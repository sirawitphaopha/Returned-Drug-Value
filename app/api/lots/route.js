// รายการล็อต — 1 รอบกดบันทึก = 1 ล็อต มีเลขล็อตของตัวเอง (เช่น L690805-01)
// ใช้ทำหน้า "แยกดูรายล็อต" เหมือนคลังสินค้าที่ดูของเข้าเป็นล็อต ๆ
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { todayISO, fyRange, isoOf } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LOT_LIMIT = 200;

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

    // ช่วงวันที่ที่ผู้ใช้เลือกเอง — ต้องตรวจรูปแบบก่อนส่งต่อให้ฐาน
    // 🚨 รับเฉพาะรูปแบบ ปปปป-ดด-วว เท่านั้น ค่าอื่นตกไปใช้ช่วงสำเร็จรูปแทน
    const okDate = (v) => /^d{4}-d{2}-d{2}$/.test(String(v || ''));
    const qFrom = url.searchParams.get('from');
    const qTo = url.searchParams.get('to');
    const range = (key === 'custom' && okDate(qFrom) && okDate(qTo))
      ? { from: qFrom, to: qTo }
      : rangeOf(key, today);

    const db = getAdmin();
    const res = await db.rpc('mr_lots', {
      p_from: range.from,
      p_to: range.to,
      p_limit: LOT_LIMIT
    });
    if (res.error) throw new Error(res.error.message);

    return NextResponse.json({ lots: res.data || [], limit: LOT_LIMIT });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'อ่านรายการล็อตไม่สำเร็จ' }, { status: 500 });
  }
}
