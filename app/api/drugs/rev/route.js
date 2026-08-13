// ลายเซ็นของคลังยา — ใช้ถามว่า "มีใครแก้ยาไปหรือยัง" โดยไม่ต้องลากยา 417 ตัวมาทั้งชุด
//
// ทำไมต้องมี: ตาราง drugs ใช้ร่วมกัน 3 เว็บ เภสัชกรแก้ยาที่ ME-DRP แล้วเว็บนี้ต้องเห็นด้วย
// แต่เว็บนี้ตั้งใจไม่ให้เบราว์เซอร์ถือกุญแจฐานข้อมูลเลย (กฎเหล็กข้อ 6) จึงต่อ Supabase
// realtime ตรง ๆ ไม่ได้ → ใช้วิธีถามหลังบ้านตัวเองเป็นระยะแทน (พี่กันเคาะ 13 ส.ค. 2569)
//
// ลายเซ็นมาจาก drug_audit ซึ่งมี trigger จับทุก insert/update/delete ของตาราง drugs
// (สร้างไว้ตั้งแต่ ME-DRP v0.9.10.0) จึง **จับได้แม้แก้ตรงในหน้า Supabase**
// ใช้ max(id) ไม่ใช่ max(changed_at) เพราะเป็นตัวเลขเรียงขึ้นอย่างเดียว เทียบง่ายกว่าเวลา
//
// คำขอนี้เบามาก (นับแถวกับหาค่าสูงสุด) เรียกทุก 30 วินาทีได้สบาย
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = getAdmin();

    // ครั้งสุดท้ายที่มีคนแตะตาราง drugs
    const auditRes = await sb
      .from('drug_audit')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    // จำนวนยาที่ยังไม่ถูกซ่อน — เผื่อกรณี drug_audit ถูกล้างหรือ trigger หลุด
    const countRes = await sb
      .from('drugs')
      .select('id', { count: 'exact', head: true })
      .not('hidden', 'is', true);

    const rev = auditRes.error || !auditRes.data?.length ? 0 : Number(auditRes.data[0].id);
    const count = countRes.error ? -1 : Number(countRes.count || 0);

    return NextResponse.json({ rev: rev, count: count });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
