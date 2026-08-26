// อ่าน / แก้ไข ล็อตทั้งก้อน (พี่กันสั่ง 25 ส.ค. 2569)
//
// GET   — แถวทั้งหมดในล็อต + ประวัติการแก้ไข (สำหรับหน้าต่างแก้ไข)
// PATCH — แก้ทีเดียวได้ทั้ง 2 ระดับ:
//           ระดับล็อต  → ผู้บันทึก · แหล่งที่มา · วันที่   (มีผลทุกแถว)
//           ระดับแถว   → จำนวน · ใช้ต่อ/ทำลาย
//
// 🚨 ห้ามแตะ unit_price เด็ดขาด — ราคาถูกแช่ไว้ตั้งแต่วันบันทึก (กฎเหล็กข้อ 12)
//    ถ้าปล่อยให้แก้ ตัวเลข KPI ที่รายงานผู้บริหารไปแล้วจะขยับย้อนหลัง
//    มูลค่าคำนวณจาก qty × unit_price อยู่แล้ว แก้จำนวนก็พอให้ตัวเลขถูกต้อง
//
// 🚨 ทุกการแก้ต้องลง mr_lot_audit — การแก้ชื่อผู้บันทึกย้อนหลังคือการเปลี่ยนหลักฐาน
//    ว่าใครเซ็นรับล็อตนั้น ถ้าไม่เก็บไว้จะตอบผู้ตรวจไม่ได้ว่าเคยเป็นอะไรมาก่อน
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { SOURCES, todayISO } from '@/lib/format';

export const dynamic = 'force-dynamic';

const MAX_QTY = 100000;
const SOURCE_KEYS = SOURCES.map((s) => s.key);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
// เลขล็อตมีรูปแบบตายตัว L + ปี พ.ศ. 2 หลัก + เดือน + วัน + ลำดับ (L690824-01)
const LOT_RE = /^L\d{6}-\d{2,3}$/;

function bad(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function lotOf(raw) {
  const v = String(raw || '').trim().toUpperCase();
  return LOT_RE.test(v) ? v : null;
}

// วันที่ต้องอยู่ในช่วงที่บันทึกได้จริง — เกณฑ์เดียวกับตอนบันทึกครั้งแรก
// (ห้ามอนาคต · ห้ามก่อนวันที่เริ่มใช้ระบบ) ไม่งั้นแก้ทีหลังจะเลี่ยงด่านได้
function validDate(iso) {
  if (!ISO.test(iso)) return false;
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return false;
  return iso >= '2024-10-01' && iso <= todayISO();
}

export async function GET(req, ctx) {
  try {
    const params = await ctx.params;
    const lot = lotOf(params.lot);
    if (!lot) return bad('เลขล็อตไม่ถูกต้อง');

    const db = getAdmin();
    const [rowsRes, logRes] = await Promise.all([
      db.rpc('mr_lot_rows', { p_lot: lot }),
      db.rpc('mr_lot_log', { p_lot: lot, p_limit: 200 })
    ]);
    if (rowsRes.error) throw new Error(rowsRes.error.message);
    if (logRes.error) throw new Error(logRes.error.message);

    const rows = rowsRes.data || [];
    if (!rows.length) return NextResponse.json({ error: 'ไม่พบล็อตนี้' }, { status: 404 });

    return NextResponse.json({
      lot: lot,
      rows: rows.map((r) => ({
        id: r.id,
        drugId: r.drug_id,
        name: r.drug_name,
        unit: r.unit,
        price: Number(r.unit_price || 0),
        qty: Number(r.qty || 0),
        disposition: r.disposition,
        reason: r.reason || ''
      })),
      // ค่าระดับล็อต — อ่านจากแถวแรก เพราะทุกแถวในล็อตต้องเหมือนกันอยู่แล้ว
      recordedBy: rows[0].recorded_by || '',
      source: rows[0].source || '',
      pcuSite: rows[0].pcu_site || '',
      date: rows[0].return_date,
      hn: rows[0].hn || '',
      log: (logRes.data || []).map((x) => ({
        id: x.id,
        returnId: x.return_id,
        drugName: x.drug_name || '',
        field: x.field,
        oldValue: x.old_value || '',
        newValue: x.new_value || '',
        by: x.changed_by || '',
        at: x.changed_at
      }))
    });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'อ่านข้อมูลล็อตไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  try {
    const params = await ctx.params;
    const lot = lotOf(params.lot);
    if (!lot) return bad('เลขล็อตไม่ถูกต้อง');

    const body = await req.json();
    const by = String(body.by || '').trim().slice(0, 80);
    if (!by) return bad('ต้องระบุผู้ที่แก้ไข');

    const db = getAdmin();

    // อ่านสภาพก่อนแก้ — ใช้ทั้งตรวจว่ามีล็อตจริง และเทียบว่าอะไรเปลี่ยนบ้าง
    const cur = await db.rpc('mr_lot_rows', { p_lot: lot });
    if (cur.error) throw new Error(cur.error.message);
    const rows = cur.data || [];
    if (!rows.length) return NextResponse.json({ error: 'ไม่พบล็อตนี้' }, { status: 404 });

    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    const audit = [];
    const lotPatch = {};

    // ── ระดับล็อต ────────────────────────────────────────────────────────────
    if (body.recordedBy !== undefined) {
      const v = String(body.recordedBy || '').trim().slice(0, 80);
      if (!v) return bad('ชื่อผู้บันทึกว่างไม่ได้');
      if (v !== (rows[0].recorded_by || '')) {
        lotPatch.recorded_by = v;
        audit.push({ field: 'recorded_by', old_value: rows[0].recorded_by || '', new_value: v });
      }
    }
    if (body.source !== undefined) {
      const v = String(body.source || '').trim();
      if (SOURCE_KEYS.indexOf(v) < 0) return bad('แหล่งที่มาไม่ถูกต้อง');
      if (v !== (rows[0].source || '')) {
        lotPatch.source = v;
        audit.push({ field: 'source', old_value: rows[0].source || '', new_value: v });
      }
    }
    // 🚨 ต้องมาหลังการแก้ source เสมอ — ถ้าย้ายล็อตออกจาก รพ.สต. ไปเป็น OPD
    //    ชื่อ รพ.สต. ต้องถูกล้างทิ้งด้วย ไม่งั้นจะค้างอยู่ในแถวที่ไม่ใช่ รพ.สต. แล้ว
    //    กลายเป็นข้อมูลที่ขัดกันเองซึ่งไม่มีอะไรจับได้เลย
    {
      const srcNow = lotPatch.source !== undefined ? lotPatch.source : (rows[0].source || '');
      const was = rows[0].pcu_site || '';
      let want = was;
      if (srcNow !== 'pcu') {
        want = '';
      } else if (body.pcuSite !== undefined) {
        want = String(body.pcuSite || '').trim().slice(0, 120);
      }
      if (want !== was) {
        lotPatch.pcu_site = want || null;
        audit.push({ field: 'pcu_site', old_value: was, new_value: want });
      }
    }

    if (body.date !== undefined) {
      const v = String(body.date || '').trim();
      if (!validDate(v)) return bad('วันที่ไม่ถูกต้อง หรืออยู่นอกช่วงที่บันทึกได้');
      if (v !== String(rows[0].return_date)) {
        lotPatch.return_date = v;
        audit.push({ field: 'return_date', old_value: String(rows[0].return_date), new_value: v });
      }
    }
    if (body.hn !== undefined) {
      // HN เก็บเฉพาะตัวเลข เหมือนตอนบันทึกครั้งแรก · ว่างได้ (ไม่บังคับ)
      const v = String(body.hn || '').replace(/[^0-9]/g, '').slice(0, 20);
      if (v !== (rows[0].hn || '')) {
        lotPatch.hn = v || null;
        audit.push({ field: 'hn', old_value: rows[0].hn || '', new_value: v });
      }
    }

    // ── ระดับแถว ─────────────────────────────────────────────────────────────
    // items = [{ id, qty, disposition }] · ส่งมาเฉพาะแถวที่แก้ก็ได้
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length > 500) return bad('รายการมากเกินไป');
    const rowPatches = [];
    for (const it of items) {
      const id = Number(it && it.id);
      const r = byId.get(id);
      if (!r) return bad('พบรายการที่ไม่ได้อยู่ในล็อตนี้');
      const patch = {};

      if (it.qty !== undefined) {
        const q = Math.round(Number(it.qty) * 100) / 100;
        if (!Number.isFinite(q) || q <= 0 || q > MAX_QTY) return bad('จำนวนไม่ถูกต้อง');
        if (q !== Number(r.qty)) {
          patch.qty = q;
          audit.push({
            field: 'qty', return_id: id, drug_name: r.drug_name,
            old_value: String(Number(r.qty)), new_value: String(q)
          });
        }
      }
      if (it.disposition !== undefined) {
        const dp = String(it.disposition);
        if (dp !== 'reuse' && dp !== 'destroy') return bad('สถานะไม่ถูกต้อง');
        if (dp !== r.disposition) {
          patch.disposition = dp;
          audit.push({
            field: 'disposition', return_id: id, drug_name: r.drug_name,
            old_value: r.disposition, new_value: dp
          });
        }
      }
      if (Object.keys(patch).length) rowPatches.push({ id: id, patch: patch });
    }

    if (!audit.length) return NextResponse.json({ ok: true, changed: 0, note: 'ไม่มีอะไรเปลี่ยน' });

    // ── ลงมือแก้ ─────────────────────────────────────────────────────────────
    // 🚨 แก้ระดับล็อตก่อน แล้วค่อยรายแถว — ถ้าสลับกัน การอัปเดตทั้งล็อตจะทับค่ารายแถวที่เพิ่งตั้ง
    //    (ตอนนี้คนละคอลัมน์กันจึงไม่ชนจริง แต่กันไว้เผื่อวันหน้าเพิ่มช่องที่ซ้อนกัน)
    if (Object.keys(lotPatch).length) {
      const res = await db.from('mr_return').update(lotPatch)
        .eq('lot_no', lot).is('deleted_at', null).select('id');
      if (res.error) throw new Error(res.error.message);
    }
    for (const rp of rowPatches) {
      const res = await db.from('mr_return').update(rp.patch)
        .eq('id', rp.id).eq('lot_no', lot).is('deleted_at', null).select('id');
      if (res.error) throw new Error(res.error.message);
    }

    // ── เก็บร่องรอย ──────────────────────────────────────────────────────────
    // ⚠️ เขียนหลังแก้สำเร็จเท่านั้น — ถ้าเขียนก่อนแล้วการแก้ล้ม ประวัติจะโกหก
    const auditRes = await db.from('mr_lot_audit').insert(
      audit.map((a) => ({
        lot_no: lot,
        return_id: a.return_id || null,
        drug_name: a.drug_name || null,
        field: a.field,
        old_value: a.old_value,
        new_value: a.new_value,
        changed_by: by
      }))
    );
    if (auditRes.error) throw new Error(auditRes.error.message);

    return NextResponse.json({ ok: true, changed: audit.length });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'แก้ไขล็อตไม่สำเร็จ' }, { status: 500 });
  }
}
