// ตัวเลขหน้าสรุปทั้งหมด — คิดฝั่งฐานข้อมูลก้อนเดียว
// เบราว์เซอร์เอาไปคิดต่อแค่ "หน้าตา" (ความสูงแท่ง สี เปอร์เซ็นต์) เหมือนมอคอัป
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { todayISO, fyRange, fyOf } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = todayISO();
    const range = fyRange(today);

    const db = getAdmin();
    const res = await db.rpc('mr_summary', { p_from: range.from, p_to: range.to });
    if (res.error) throw new Error(res.error.message);

    const s = res.data || {};
    return NextResponse.json({
      today: today,
      fyYear: fyOf(today),
      from: range.from,
      to: range.to,
      saved: Number(s.saved || 0),
      lost: Number(s.lost || 0),
      records: Number(s.records || 0),
      qty: Number(s.qty || 0),
      drugCount: Number(s.drugCount || 0),
      byMonth: s.byMonth || {},
      bySrc: s.bySrc || {},
      topDrugs: s.topDrugs || []
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'อ่านยอดสรุปไม่สำเร็จ' }, { status: 500 });
  }
}
