// แก้ราคาย้อนหลังในรายการที่บันทึกไปแล้ว
//
// พี่กันสั่ง 25 ส.ค. 2569 หลังเจอเคสจริง — MTV tab ถูกใส่ราคา 20 บาท
// (เอาราคายาน้ำทั้งขวดมาใส่เป็นราคาต่อเม็ด) บันทึกไปแล้ว 30 เม็ด = 600 บาท
// ทั้งที่ควรเป็น 15 บาท ยอดรวมทั้งปีเพี้ยนไป 8.8% จากแถวเดียว
//
// 🚨 กฎแช่ราคายังอยู่ครบ นี่คือ "ประตูเดียวที่มีกุญแจและมีสมุดลงชื่อ"
//    ใช้เฉพาะกรณี "ราคาผิดตั้งแต่ต้น" ไม่ใช่ "ราคาที่เปลี่ยนตามเวลา"
//
//    ราคาเปลี่ยนตามเวลา (ยาขึ้นราคากลางปี)  → ห้ามแตะ ตัวเลขย้อนหลังต้องคงที่
//    ราคาผิดตั้งแต่แรก (กรอกผิด/จับคู่ผิด)   → ต้องแก้ได้ เพราะข้อมูลผิดมาตลอด
//
// 🚨 ทุกครั้งที่แก้ต้องมีเหตุผลกับชื่อคนแก้ และถูกบันทึกลง mr_price_fix_log
//    การเปลี่ยนตัวเลขที่รายงานผู้บริหารไปแล้ว ต้องตอบผู้ตรวจได้ว่าใครเปลี่ยนและทำไม
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET — ดูก่อนว่าจะกระทบอะไรบ้าง (ไม่แก้อะไรทั้งสิ้น)
// 🚨 หน้าจอต้องเรียกอันนี้ก่อนเสมอ ให้เภสัชกรเห็นตัวเลขก่อนตัดสินใจ
export async function GET(req) {
  try {
    const u = new URL(req.url);
    const drugId = Number(u.searchParams.get('drugId'));
    const price = Number(u.searchParams.get('price'));
    if (!drugId || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const db = getAdmin();
    const res = await db.rpc('mr_price_fix_preview', { p_drug_id: drugId, p_new_price: price });
    if (res.error) throw new Error(res.error.message);

    const d = res.data || {};
    return NextResponse.json({
      rows: Number(d.rows || 0),
      qty: Number(d.qty || 0),
      valueBefore: Number(d.valueBefore || 0),
      valueAfter: Number(d.valueAfter || 0),
      firstDate: d.firstDate || '',
      lastDate: d.lastDate || '',
      lots: Array.isArray(d.lots) ? d.lots : []
    });
  } catch (e) {
    return apiFail("price-fix.GET", e, "ตรวจสอบไม่สำเร็จ");
  }
}

// POST — แก้จริง
export async function POST(req) {
  try {
    const body = await req.json();
    const drugId = Number(body.drugId);
    const price = Number(body.price);
    const by = String(body.by || '').trim();
    const reason = String(body.reason || '').trim();

    if (!drugId) return NextResponse.json({ error: 'ไม่พบรหัสยา' }, { status: 400 });
    if (!Number.isFinite(price) || price < 0 || price > 999999.99) {
      return NextResponse.json({ error: 'ราคาไม่ถูกต้อง' }, { status: 400 });
    }
    if (!by) return NextResponse.json({ error: 'ต้องเลือกชื่อผู้แก้ไข' }, { status: 400 });
    if (!reason) return NextResponse.json({ error: 'ต้องระบุเหตุผลที่แก้' }, { status: 400 });

    const db = getAdmin();
    const res = await db.rpc('mr_price_fix', {
      p_drug_id: drugId,
      p_new_price: Math.round(price * 10000) / 10000,
      p_by: by.slice(0, 120),
      p_reason: reason.slice(0, 300)
    });
    if (res.error) throw new Error(res.error.message);

    const d = res.data || {};
    if (d.error) return NextResponse.json({ error: d.error }, { status: 400 });

    return NextResponse.json({
      ok: true,
      rows: Number(d.rows || 0),
      valueBefore: Number(d.valueBefore || 0),
      valueAfter: Number(d.valueAfter || 0)
    });
  } catch (e) {
    return apiFail("price-fix.POST", e, "แก้ราคาย้อนหลังไม่สำเร็จ");
  }
}
