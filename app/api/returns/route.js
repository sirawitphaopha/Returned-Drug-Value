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

// แปลงชื่อช่วงเวลาเป็นวันเริ่ม–วันจบ · คิดด้วยวันที่ไทย ไม่ใช่นาฬิกา DB ที่เป็น UTC
// กติกาเดียวกับมอคอัปบรรทัด 1128–1131
function rangeOf(key, today) {
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
    const range = rangeOf(key, today);
    const q = (url.searchParams.get('q') || '').slice(0, 80);
    const limit = url.searchParams.get('limit') === 'all' ? EXPORT_LIMIT : HIST_LIMIT;

    const db = getAdmin();
    const res = await db.rpc('mr_history', {
      p_q: q,
      p_from: range.from,
      p_to: range.to,
      p_limit: limit
    });
    if (res.error) throw new Error(res.error.message);

    const h = res.data || {};
    return NextResponse.json({
      rows: h.rows || [],
      total: Number(h.total || 0),
      saved: Number(h.saved || 0),
      lost: Number(h.lost || 0),
      limit: limit
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'อ่านประวัติไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!ISO_DATE.test(String(body.date || ''))) return bad('วันที่ไม่ถูกต้อง');
    if (!SOURCES.some((s) => s.key === body.source)) return bad('แหล่งที่มาไม่ถูกต้อง');
    if (body.batchId != null && !UUID.test(String(body.batchId))) return bad('รหัสก้อนการบันทึกไม่ถูกต้อง');

    const hnRaw = String(body.hn || '').replace(/[^0-9]/g, '');
    if (hnRaw.length > 20) return bad('HN ยาวเกินไป');
    const hn = hnRaw || null;

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return bad('ไม่มีรายการให้บันทึก');
    if (items.length > MAX_ITEMS) return bad('รายการเกิน ' + MAX_ITEMS + ' บรรทัดในครั้งเดียว');

    const catalog = await loadCatalog();
    const byId = new Map(catalog.map((d) => [d.id, d]));

    const rows = [];
    for (const it of items) {
      const drug = byId.get(Number(it.drugId));
      if (!drug) return bad('ไม่พบยารหัส ' + it.drugId + ' ในรายการยา');

      const qty = Number(it.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return bad('จำนวนของ ' + drug.name + ' ไม่ถูกต้อง');
      if (it.disposition !== 'reuse' && it.disposition !== 'destroy') return bad('สถานะของ ' + drug.name + ' ไม่ถูกต้อง');

      rows.push({
        return_date: body.date,
        drug_id: drug.id,
        drug_name: drug.name,
        unit: drug.unit,
        unit_price: drug.price,
        qty: qty,
        disposition: it.disposition,
        source: body.source,
        hn: hn,
        batch_id: body.batchId || null,
        client_rid: it.clientRid == null ? null : String(it.clientRid).slice(0, 64)
      });
    }

    const db = getAdmin();
    // กดลองส่งใหม่ด้วย batch_id เดิม → เจอคู่ (batch_id, client_rid) ซ้ำแล้วข้ามไป
    const ins = await db
      .from('mr_return')
      .upsert(rows, { onConflict: 'batch_id,client_rid', ignoreDuplicates: true });
    if (ins.error) throw new Error(ins.error.message);

    // ส่งยอดสะสมปีงบล่าสุดกลับไปด้วย หน้าจอจะได้ไม่ต้องยิงอีกเส้น
    const range = fyRange(todayISO());
    const sumRes = await db.rpc('mr_summary', { p_from: range.from, p_to: range.to });
    if (sumRes.error) throw new Error(sumRes.error.message);
    const sum = sumRes.data || {};

    return NextResponse.json({
      saved: rows.length,
      fy: {
        saved: Number(sum.saved || 0),
        lost: Number(sum.lost || 0),
        records: Number(sum.records || 0),
        qty: Number(sum.qty || 0)
      }
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'บันทึกไม่สำเร็จ' }, { status: 500 });
  }
}
