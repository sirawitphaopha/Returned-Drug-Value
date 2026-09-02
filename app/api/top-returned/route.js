// ยาที่ถูกคืนบ่อยที่สุด — เรียงตาม "จำนวนครั้งที่ถูกคืน" ไม่ใช่มูลค่า
//
// ต่างจาก topDrugs ในหน้าสรุปที่เรียงตามมูลค่า (ยาแพงตัวเดียวก็ขึ้นอันดับหนึ่งได้)
// อันนี้ตอบคำถามคนละข้อ: "ยาตัวไหนที่คนไข้คืนบ่อยที่สุด"
// ถ้ายาตัวหนึ่งถูกคืนบ่อยมาก แปลว่าอาจสั่งเกินจำเป็น
// เอาไปคุยกับแพทย์เพื่อลดการสั่งได้ ประหยัดได้มากกว่าการเก็บยาคืนหลายเท่า
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';
import { todayISO, fyRange, fyOf } from '@/lib/format';

export const dynamic = 'force-dynamic';

const FIRST_FY = 2568;
const TOP_LIMIT = 15;

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
    const res = await db.rpc('mr_top_returned', {
      p_from: range.from,
      p_to: range.to,
      p_limit: TOP_LIMIT
    });
    if (res.error) throw new Error(res.error.message);

    return NextResponse.json({ fyYear: fy, items: res.data || [] });
  } catch (e) {
    return apiFail("top-returned.GET", e, "อ่านรายการยาที่คืนบ่อยไม่สำเร็จ");
  }
}
