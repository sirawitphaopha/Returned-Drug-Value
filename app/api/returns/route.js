// บันทึกยาคืนทั้งรอบทีเดียว
// ราคา ชื่อ หน่วย อ่านจากฐานข้อมูลตอนบันทึก ไม่รับจากเบราว์เซอร์
// (เบราว์เซอร์ส่งมาแค่ "ยาตัวไหน กี่หน่วย ใช้ต่อหรือทำลาย")
// เพราะสามช่องนี้คือตัวเลขที่ไปโผล่ใน KPI ผู้บริหาร ต้องมาจากของกลางเท่านั้น
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { loadCatalog } from '@/lib/catalog';
import { SOURCES, todayISO, fyRange, isoOf } from '@/lib/format';

export const dynamic = 'force-dynamic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 500;
const MAX_QTY = 100000;
const HIST_LIMIT = 60;
// ส่งออก Excel ต้องได้ทั้งปีงบ ไม่ใช่แค่ 60 แถวที่โชว์บนจอ
const EXPORT_LIMIT = 100000;

function bad(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// ข้อความจริงของ Postgres ต้องไม่หลุดถึงหน้าจอเภสัชกร (เผยโครงสร้างฐานให้คนนอก)
// แต่ต้องโผล่ใน log ของ Cloudflare ไม่งั้นเว็บจริงพังแล้วไล่หาสาเหตุไม่ได้เลย
function boom(tag, e, message) {
  console.error('[' + tag + ']', e);
  return NextResponse.json({ error: message }, { status: 500 });
}

// regex ตรวจแค่หน้าตา — 2026-02-30 กับ 3026-08-05 ผ่านฉลุย
// ปีพิมพ์ผิดจะบันทึกสำเร็จแล้วแถวหายจากทุกหน้าจอ ลบก็ไม่ได้ แต่ยังนอนอยู่ในฐานตลอดไป
function validDate(iso, today) {
  if (!ISO_DATE.test(iso)) return false;
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime()) || isoOf(d) !== iso) return false;
  return iso <= today && iso >= '2024-10-01';
}

// แปลงชื่อช่วงเวลาเป็นวันเริ่ม–วันจบ · คิดด้วยวันที่ไทย ไม่ใช่นาฬิกา DB ที่เป็น UTC
// กติกาเดียวกับมอคอัปบรรทัด 1128–1131
// 🚨 ปีงบเจาะจง — ส่ง fy=2568 มาได้ (ผลตรวจข้อ ส-4)
//    เดิมไม่ว่าจะส่ง range อะไรที่ไม่ใช่ today/week/month ก็ได้ "ปีงบปัจจุบัน" เสมอ
//    ผู้บริหารขอสรุปปีงบที่เพิ่งจบ → กดปุ่มปี 2568 → กดส่งออก
//    → ได้ไฟล์ชื่อ "ปีงบ2568" ที่ข้างในเป็นแถวของ 2569 ทั้งไฟล์
//    ปีงบไทยเริ่ม 1 ต.ค. ของปีก่อนหน้า → ปีงบ 2569 = 1 ต.ค. 2568 ถึง 30 ก.ย. 2569
function fyRangeOf(fy) {
  const startCe = Number(fy) - 543 - 1;
  return { from: startCe + '-10-01', to: (startCe + 1) + '-09-30' };
}

function rangeOf(key, today, fy) {
  if (fy) return fyRangeOf(fy);
  if (key === 'today') return { from: today, to: today };
  if (key === 'week') {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - 6);
    return { from: isoOf(d), to: today };
  }
  if (key === 'month') return { from: today.slice(0, 7) + '-01', to: today };
  return fyRange(today);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const today = todayISO();
    const key = url.searchParams.get('range') || 'month';
    // ปีงบ พ.ศ. ที่ขอมาเจาะจง (2500–2700 กันค่าเพี้ยน) — ใช้กับปุ่มส่งออกในหน้าสรุป
    const fyRaw = Number(url.searchParams.get('fy') || 0);
    const fy = fyRaw >= 2500 && fyRaw <= 2700 ? fyRaw : 0;
    const range = rangeOf(key, today, fy);
    const q = (url.searchParams.get('q') || '').slice(0, 80);
    const wantAll = url.searchParams.get('limit') === 'all';
    const limit = wantAll ? EXPORT_LIMIT : HIST_LIMIT;
    const trash = url.searchParams.get('trash') === '1';
    const lot = (url.searchParams.get('lot') || '').slice(0, 24);
    const offset = Math.max(0, Math.min(100000, Number(url.searchParams.get('offset') || 0) || 0));

    // ช่วงวันที่เลือกเองได้ — เดิมมีแค่ 4 ปุ่มสำเร็จรูป
    // ระบบบอกให้ "กรองช่วงวันที่ให้แคบลง" แต่ไม่มีเครื่องมือให้เลือกช่วงวันเลย
    const cFrom = ISO_DATE.test(url.searchParams.get('from') || '') ? url.searchParams.get('from') : null;
    const cTo = ISO_DATE.test(url.searchParams.get('to') || '') ? url.searchParams.get('to') : null;

    // ถังขยะกับการดูรายล็อต ไม่ควรถูกจำกัดด้วยช่วงวันที่ของแท็บที่เปิดอยู่
    let from = trash || lot ? null : range.from;
    let to = trash || lot ? null : range.to;
    if (key === 'custom') { from = cFrom; to = cTo; }

    const db = getAdmin();
    const res = await db.rpc('mr_history', {
      p_q: q,
      p_from: from,
      p_to: to,
      p_limit: limit,
      p_trash: trash,
      p_lot: lot || null,
      p_offset: offset
    });
    if (res.error) throw new Error(res.error.message);

    const h = res.data || {};

    // 🚨 การดึงทั้งปีงบลากข้อมูลผู้ป่วยออกไปทีเดียวหลายพันแถวพร้อม HN (ผลตรวจข้อ ต-19)
    //    เดิมไม่มีร่องรอยเลยว่าเคยมีการดึงชุดใหญ่ออกไปเมื่อไหร่ ตอบผู้ตรวจไม่ได้
    //    บันทึกไว้ฝั่งเซิร์ฟเวอร์อย่างเดียว ไม่ส่งอะไรเพิ่มกลับไปที่เบราว์เซอร์
    if (wantAll) {
      console.warn('[returns.GET] ดึงข้อมูลชุดใหญ่', JSON.stringify({
        rows: (h.rows || []).length, total: Number(h.total || 0),
        from: from, to: to, lot: lot || null, trash: trash
      }));
    }

    return NextResponse.json({
      rows: h.rows || [],
      total: Number(h.total || 0),
      saved: Number(h.saved || 0),
      lost: Number(h.lost || 0),
      limit: limit,
      offset: offset
    });
  } catch (e) {
    return boom('returns.GET', e, 'อ่านประวัติไม่สำเร็จ');
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!validDate(String(body.date || ''), todayISO())) {
      return bad('วันที่ไม่ถูกต้อง หรืออยู่นอกช่วงที่บันทึกได้');
    }
    if (!SOURCES.some((s) => s.key === body.source)) return bad('แหล่งที่มาไม่ถูกต้อง');
    // 🚨 ต้องมี batchId เสมอ — ดัชนี unique เป็นแบบ NULLS DISTINCT
    // ถ้าปล่อยให้เป็น null ระบบกันบันทึกซ้ำจะไม่ทำงานเลย ส่งซ้ำได้ข้อมูลสองชุด
    if (!UUID.test(String(body.batchId || ''))) return bad('รหัสก้อนการบันทึกไม่ถูกต้อง');

    // ชื่อ รพ.สต. ต้นทาง — เก็บเฉพาะตอนแหล่งที่มาเป็น รพ.สต. เท่านั้น
    // 🚨 เก็บเป็นชื่อ ไม่ใช่รหัส เพราะเป็น snapshot ณ วันบันทึก (กฎแช่ข้อมูล)
    //    รพ.สต. เปลี่ยนชื่อวันหน้า รายการเก่ายังต้องอ่านออกว่าตอนนั้นเขียนว่าอะไร
    const pcuSite = String(body.pcuSite == null ? '' : body.pcuSite).trim().slice(0, 120);

    const hnRaw = String(body.hn || '').replace(/[^0-9]/g, '');
    if (hnRaw.length > 20) return bad('HN ยาวเกินไป');
    const hn = hnRaw || null;

    // 1 รอบกดบันทึก = 1 ล็อต · ต้องเซ็นชื่อก่อนส่งเสมอ
    const recordedBy = String(body.recordedBy || '').trim().slice(0, 80);
    if (!recordedBy) return bad('ยังไม่ได้เลือกผู้บันทึกล็อตนี้');

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return bad('ไม่มีรายการให้บันทึก');
    if (items.length > MAX_ITEMS) return bad('รายการเกิน ' + MAX_ITEMS + ' บรรทัดในครั้งเดียว');

    const catalog = await loadCatalog();
    const byId = new Map(catalog.map((d) => [d.id, d]));
    const db = getAdmin();

    // เลขล็อต — สร้างครั้งเดียวต่อ 1 batch
    // ถ้ากดลองส่งใหม่ด้วย batch เดิม ต้องใช้เลขเดิม ห้ามออกเลขใหม่
    const seen = await db.from('mr_return').select('lot_no').eq('batch_id', body.batchId).limit(1);
    if (seen.error) throw new Error(seen.error.message);
    let lotNo = seen.data && seen.data[0] ? seen.data[0].lot_no : null;
    if (!lotNo) {
      const gen = await db.rpc('mr_next_lot_no', { p_date: body.date });
      if (gen.error) throw new Error(gen.error.message);
      lotNo = gen.data;
    }

    const rows = [];
    for (const it of items) {
      if (!it || typeof it !== 'object') return bad('รายการยาไม่ถูกต้อง');

      // ยานอกบัญชีโรงพยาบาล — คนไข้เอายาจาก รพ.อื่น/คลินิกมาคืน
      // ไม่มีในคลัง 417 ตัว เลยไม่มีรหัสยา ต้องรับชื่อ/หน่วย/ราคาที่พิมพ์เองแทน
      const isOff = !it.drugId && !!String(it.name || '').trim();
      const drug = isOff ? {
        id: null,
        name: String(it.name).trim().slice(0, 160),
        unit: String(it.unit || 'หน่วย').trim().slice(0, 24) || 'หน่วย',
        price: Math.max(0, Math.min(999999.99, Math.round((Number(it.price) || 0) * 10000) / 10000))
      } : byId.get(Number(it.drugId));

      // ตาราง drugs ใช้ร่วมกับ TB Calculator และ ME-DRP — ถ้ามีคนไปซ่อนยาในเว็บอื่น
      // ระหว่างที่ร่างค้างอยู่ในเครื่อง จะบันทึกไม่ได้ทั้งก้อน ต้องบอกให้ชัดว่าแถวไหน
      if (!drug) return bad('ไม่พบยารหัส ' + it.drugId + ' ในรายการยา ให้ลบแถวนี้ออกก่อน');

      // จำนวนรับทศนิยม 2 ตำแหน่ง — ยาน้ำครึ่งขวด ยาแบ่งครึ่งเม็ด
      const qty = Math.round(Number(it.qty) * 100) / 100;
      if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_QTY) return bad('จำนวนของ ' + drug.name + ' ไม่ถูกต้อง');
      if (it.disposition !== 'reuse' && it.disposition !== 'destroy') return bad('สถานะของ ' + drug.name + ' ไม่ถูกต้อง');

      const rid = String(it.clientRid == null ? '' : it.clientRid).slice(0, 64);
      if (!rid) return bad('รหัสรายการย่อยไม่ถูกต้อง');

      // HN กับแหล่งที่มา มาจากแถวถ้ามี (ติดไปตอนกดเพิ่ม) ไม่งั้นใช้ค่าของทั้งล็อต
      // แก้ปัญหาคนไข้ 2 คนในล็อตเดียวแล้ว HN ปนกัน
      const rowHnRaw = String(it.hn == null ? '' : it.hn).replace(/[^0-9]/g, '').slice(0, 20);
      const rowSrc = SOURCES.some((s) => s.key === it.source) ? it.source : body.source;
      // แถวที่ไม่ได้มาจาก รพ.สต. ต้องเป็นค่าว่างเสมอ ไม่ใช่ค้างชื่อไว้จากที่เลือกก่อนหน้า
      const rowSite = rowSrc === 'pcu'
        ? (String(it.pcuSite == null ? '' : it.pcuSite).trim().slice(0, 120) || pcuSite || null)
        : null;

      rows.push({
        return_date: body.date,
        drug_id: drug.id,
        drug_name: drug.name,
        unit: drug.unit,
        unit_price: drug.price,
        qty: qty,
        disposition: it.disposition,
        // เหตุผลการทำลาย — เก็บเฉพาะแถวที่ทำลาย ผู้บริหารจะได้ตอบได้ว่าทำลายเพราะอะไร
        destroy_reason: it.disposition === 'destroy'
          ? (String(it.reason || '').trim().slice(0, 60) || null)
          : null,
        source: rowSrc,
        pcu_site: rowSite,
        hn: rowHnRaw || hn,
        recorded_by: recordedBy,
        lot_no: lotNo,
        batch_id: body.batchId,
        client_rid: rid
      });
    }

    // กดลองส่งใหม่ด้วย batch_id เดิม → เจอคู่ (batch_id, client_rid) ซ้ำแล้วข้ามไป
    // 🚨 ห้ามเปลี่ยนเป็น ignoreDuplicates: false เด็ดขาด — จะกลายเป็น DO UPDATE
    // แล้วทับ unit_price ด้วยราคาปัจจุบัน = ผิดกฎแช่ราคาทันทีโดยไม่มีอะไรเตือน
    // .select('id') ต่อท้ายเพื่อรู้ว่าเข้าจริงกี่แถว หน้าจอจะได้ไม่บอกว่าบันทึกครบทั้งที่บางแถวถูกข้าม
    const ins = await db
      .from('mr_return')
      .upsert(rows, { onConflict: 'batch_id,client_rid', ignoreDuplicates: true })
      .select('id');
    if (ins.error) throw new Error(ins.error.message);

    // ส่งยอดสะสมปีงบล่าสุดกลับไปด้วย หน้าจอจะได้ไม่ต้องยิงอีกเส้น
    const range = fyRange(todayISO());
    const sumRes = await db.rpc('mr_summary', { p_from: range.from, p_to: range.to });
    if (sumRes.error) throw new Error(sumRes.error.message);
    const sum = sumRes.data || {};

    return NextResponse.json({
      sent: rows.length,
      saved: (ins.data || []).length,
      lot: lotNo,
      fy: {
        saved: Number(sum.saved || 0),
        lost: Number(sum.lost || 0),
        records: Number(sum.records || 0),
        qty: Number(sum.qty || 0)
      }
    });
  } catch (e) {
    return boom('returns.POST', e, 'บันทึกไม่สำเร็จ');
  }
}
