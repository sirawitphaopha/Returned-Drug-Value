// ตัวเลขหน้าสรุปทั้งหมด — คิดฝั่งฐานข้อมูลก้อนเดียว
// เบราว์เซอร์เอาไปคิดต่อแค่ "หน้าตา" (ความสูงแท่ง สี เปอร์เซ็นต์) เหมือนมอคอัป
//
// รับพารามิเตอร์ fy ได้ → ดูปีงบย้อนหลังได้
// เดิมคำนวณปีงบจากวันนี้ตายตัว พอขึ้นปีงบใหม่ ตัวเลขปีเก่าหายหมด
// ผู้บริหารขอดูสรุปปีที่เพิ่งจบไม่ได้เลย (ฝั่งฐานข้อมูลรองรับอยู่แล้ว แค่ API ไม่ส่งให้)
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { todayISO, fyRange, fyOf } from '@/lib/format';

export const dynamic = 'force-dynamic';

const FIRST_FY = 2568;   // ปีงบแรกที่ให้เลือกย้อนหลังได้

// ปีงบไทย (พ.ศ.) → ช่วงวันที่จริง · ปีงบ 2569 = 1 ต.ค. 2025 ถึง 30 ก.ย. 2026
function rangeOfFy(fy) {
  const startYear = fy - 543 - 1;
  return { from: startYear + '-10-01', to: (startYear + 1) + '-09-30' };
}

export async function GET(req) {
  try {
    const today = todayISO();
    const nowFy = fyOf(today);

    const url = new URL(req.url);
    const askFy = Number(url.searchParams.get('fy') || 0);
    const fy = Number.isInteger(askFy) && askFy >= FIRST_FY && askFy <= nowFy ? askFy : nowFy;
    const range = fy === nowFy ? fyRange(today) : rangeOfFy(fy);

    const db = getAdmin();
    const res = await db.rpc('mr_summary', { p_from: range.from, p_to: range.to });
    if (res.error) throw new Error(res.error.message);

    // รายชื่อปีงบที่เลือกได้ ให้ฝั่งจอเอาไปทำปุ่ม
    const years = [];
    for (let y = nowFy; y >= FIRST_FY; y--) years.push(y);

    const s = res.data || {};
    return NextResponse.json({
      today: today,
      fyYear: fy,
      nowFy: nowFy,
      fyYears: years,
      from: range.from,
      to: range.to,
      saved: Number(s.saved || 0),
      lost: Number(s.lost || 0),
      records: Number(s.records || 0),
      qty: Number(s.qty || 0),
      drugCount: Number(s.drugCount || 0),
      zeroPriced: Number(s.zeroPriced || 0),
      byMonth: s.byMonth || {},
      bySrc: s.bySrc || {},
      byReason: s.byReason || {},
      topDrugs: s.topDrugs || []
    });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'อ่านยอดสรุปไม่สำเร็จ' }, { status: 500 });
  }
}
