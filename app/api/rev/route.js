// ลายเซ็นของข้อมูลทั้งเว็บ — "มีอะไรเปลี่ยนไปหรือยัง" ในคำขอเดียว
//
// พี่กันสั่ง 27 ส.ค. 2569:
//   "ถ้าเราเปิดตารางประวัติ แล้วมีอีกคนส่งข้อมูลมา มันจะขึ้นอัปเดตให้เราเลย
//    ซึ่งระบบเรียลไทม์ถือเป็นพื้นฐานของเว็บเราอยู่แล้วนะ"
//
// ทำไมไม่ต่อ Supabase realtime ตรงจากเบราว์เซอร์
//   ต้องเอากุญแจฐานข้อมูลไปไว้ในเบราว์เซอร์ = ใครเปิดเว็บก็แก้ข้อมูลได้
//   ขัดกฎเหล็กข้อ 6 ของโปรเจกต์นี้ · แนวทางเดียวกับที่คลังยาใช้อยู่แล้ว
//   (พี่กันเคาะวิธีนี้ไว้ตั้งแต่ 13 ส.ค. 2569 สำหรับ /api/drugs/rev)
//
// คำขอนี้เบามาก — ค่าสูงสุด 3 ตัวกับนับแถว 1 ครั้ง ไม่แตะข้อมูลจริงเลย
// รวมลายเซ็นคลังยามาด้วยในเส้นเดียว จะได้ไม่ต้องยิงสองรอบทุกครั้ง
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = getAdmin();

    // ── ลายเซ็นข้อมูลยาคืน · การแก้ระดับล็อต · การตั้งค่า ──────────────────
    const revRes = await sb.rpc('mr_rev');

    // ── ลายเซ็นคลังยา (ตาราง drugs ใช้ร่วม 3 เว็บ) ─────────────────────────
    // drug_audit มี trigger จับทุก insert/update/delete จึงจับได้แม้แก้ในหน้า Supabase
    const auditRes = await sb
      .from('drug_audit')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const countRes = await sb
      .from('drugs')
      .select('id', { count: 'exact', head: true })
      .not('hidden', 'is', true);

    const r = revRes.error || !revRes.data ? {} : revRes.data;
    const drugRev = auditRes.error || !auditRes.data?.length ? 0 : Number(auditRes.data[0].id);
    const drugCount = countRes.error ? -1 : Number(countRes.count || 0);

    return NextResponse.json({
      // ✅ ส่งเป็นข้อความสำเร็จรูป ฝั่งเบราว์เซอร์เทียบสองข้อความตรง ๆ ไม่ต้องรู้ความหมาย
      rows: String(r.rows || 0) + ':' + String(r.cnt || 0),
      lot: String(r.lot || 0),
      setting: String(r.setg || 0),
      drug: String(drugRev) + ':' + String(drugCount)
    });
  } catch (e) {
    // 🚨 ห้ามส่งข้อความผิดพลาดดิบกลับเบราว์เซอร์ (ผลตรวจข้อ ต-16)
    console.error('[api]', e);
    return NextResponse.json({ error: 'อ่านลายเซ็นข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
