// แก้ไข / ลบ รายการยาคืนทีละรายการ
// PATCH แตะได้แค่สองช่อง: จำนวน กับ ใช้ต่อ/ทำลาย
// ห้ามแตะ unit_price เด็ดขาด — ราคาถูกแช่ไว้ตั้งแต่วันบันทึก
// ถ้าปล่อยให้แก้ทีหลังได้ ตัวเลข KPI ย้อนหลังจะขยับตามราคาปัจจุบัน ซึ่งผิดทั้งหมด
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_QTY = 100000;

function bad(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function idOf(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req, ctx) {
  try {
    const params = await ctx.params;
    const id = idOf(params.id);
    if (!id) return bad('รหัสรายการไม่ถูกต้อง');

    const body = await req.json();
    const patch = {};

    // กู้คืนจากถังขยะ — เป็นการ "ล้างวันที่ลบ" ไม่ใช่การแก้เนื้อข้อมูล
    if (body.action === 'restore') {
      const db = getAdmin();
      const res = await db.from('mr_return')
        .update({ deleted_at: null, deleted_by: null })
        .eq('id', id).not('deleted_at', 'is', null).select('id');
      if (res.error) throw new Error(res.error.message);
      if (!res.data || !res.data.length) return NextResponse.json({ error: 'ไม่พบรายการนี้ในถังขยะ' }, { status: 404 });
      return NextResponse.json({ ok: true, id: id });
    }

    if (body.qty !== undefined) {
      // จำนวนรับทศนิยม 2 ตำแหน่ง — ยาน้ำครึ่งขวด ยาแบ่งครึ่งเม็ด
      const qty = Math.round(Number(body.qty) * 100) / 100;
      if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_QTY) return bad('จำนวนไม่ถูกต้อง');
      patch.qty = qty;
    }
    if (body.disposition !== undefined) {
      if (body.disposition !== 'reuse' && body.disposition !== 'destroy') return bad('สถานะไม่ถูกต้อง');
      patch.disposition = body.disposition;
    }
    if (!Object.keys(patch).length) return bad('ไม่มีอะไรให้แก้');

    const db = getAdmin();
    // ห้ามแก้ของที่อยู่ในถังขยะ ต้องกู้คืนก่อน
    const res = await db.from('mr_return').update(patch).eq('id', id).is('deleted_at', null).select('id');
    if (res.error) throw new Error(res.error.message);
    if (!res.data || !res.data.length) return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });

    return NextResponse.json({ ok: true, id: id });
  } catch (e) {
    return apiFail("returns/id.PATCH", e, "แก้ไขไม่สำเร็จ");
  }
}

// 🚨 ไม่ลบแถวจริง — แค่ประทับเวลาลง deleted_at (ถังขยะ)
// ฟังก์ชัน mr_summary / mr_history กรอง deleted_at is null อยู่แล้ว ตัวเลข KPI จึงถูกต้อง
// แต่ของยังอยู่ในฐาน กู้คืนได้ และตอบผู้ตรวจได้ว่าเคยมีอะไรแล้วใครลบ
export async function DELETE(req, ctx) {
  try {
    const params = await ctx.params;
    const id = idOf(params.id);
    if (!id) return bad('รหัสรายการไม่ถูกต้อง');

    let by = '';
    try {
      const body = await req.json();
      by = String((body && body.by) || '').trim().slice(0, 80);
    } catch (e) { /* DELETE ไม่มี body ก็ได้ */ }

    const db = getAdmin();
    const res = await db.from('mr_return')
      .update({ deleted_at: new Date().toISOString(), deleted_by: by || null })
      .eq('id', id).is('deleted_at', null).select('id');
    if (res.error) throw new Error(res.error.message);
    if (!res.data || !res.data.length) return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });

    return NextResponse.json({ ok: true, id: id });
  } catch (e) {
    return apiFail("returns/id.DELETE", e, "ลบไม่สำเร็จ");
  }
}
