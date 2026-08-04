// แก้ไข / ลบ รายการยาคืนทีละรายการ
// PATCH แตะได้แค่สองช่อง: จำนวน กับ ใช้ต่อ/ทำลาย
// ห้ามแตะ unit_price เด็ดขาด — ราคาถูกแช่ไว้ตั้งแต่วันบันทึก
// ถ้าปล่อยให้แก้ทีหลังได้ ตัวเลข KPI ย้อนหลังจะขยับตามราคาปัจจุบัน ซึ่งผิดทั้งหมด
import { NextResponse } from 'next/server';
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

    if (body.qty !== undefined) {
      const qty = Number(body.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return bad('จำนวนไม่ถูกต้อง');
      patch.qty = qty;
    }
    if (body.disposition !== undefined) {
      if (body.disposition !== 'reuse' && body.disposition !== 'destroy') return bad('สถานะไม่ถูกต้อง');
      patch.disposition = body.disposition;
    }
    if (!Object.keys(patch).length) return bad('ไม่มีอะไรให้แก้');

    const db = getAdmin();
    const res = await db.from('mr_return').update(patch).eq('id', id).select('id');
    if (res.error) throw new Error(res.error.message);
    if (!res.data || !res.data.length) return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });

    return NextResponse.json({ ok: true, id: id });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'แก้ไขไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(req, ctx) {
  try {
    const params = await ctx.params;
    const id = idOf(params.id);
    if (!id) return bad('รหัสรายการไม่ถูกต้อง');

    const db = getAdmin();
    const res = await db.from('mr_return').delete().eq('id', id).select('id');
    if (res.error) throw new Error(res.error.message);
    if (!res.data || !res.data.length) return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });

    return NextResponse.json({ ok: true, id: id });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'ลบไม่สำเร็จ' }, { status: 500 });
  }
}
