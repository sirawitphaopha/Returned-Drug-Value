// โหลดครั้งเดียวตอนเปิดเว็บ: รายการยา + การตั้งค่าห้องยา + ยอดสะสมปีงบปัจจุบัน
// รวม 3 อย่างไว้คำขอเดียว เพราะเน็ตโรงพยาบาลช้า ยิงทีละเส้นจะเห็นหน้าจอกระตุก
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { loadCatalog } from '@/lib/catalog';
import { todayISO, fyOf, fyRange } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdmin();
    // วันที่คิดจากนาฬิกาไทย ไม่ใช่ UTC ของเซิร์ฟเวอร์ ไม่งั้นช่วงหัวค่ำจะได้วันของเมื่อวาน
    const today = todayISO();
    const range = fyRange(today);

    const [catalog, settingRes, summaryRes] = await Promise.all([
      loadCatalog(),
      db.from('mr_setting').select('org_name,default_source,fav_ids,staff,last_recorder').eq('id', 1).maybeSingle(),
      db.rpc('mr_summary', { p_from: range.from, p_to: range.to })
    ]);
    if (settingRes.error) throw new Error(settingRes.error.message);
    if (summaryRes.error) throw new Error(summaryRes.error.message);

    const st = settingRes.data || {};
    const sum = summaryRes.data || {};

    return NextResponse.json({
      today: today,
      fyYear: fyOf(today),
      drugs: catalog,
      setting: {
        orgName: st.org_name || 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่',
        defaultSource: st.default_source || 'opd',
        favIds: Array.isArray(st.fav_ids) ? st.fav_ids : [],
        staff: Array.isArray(st.staff) ? st.staff : [],
        lastRecorder: st.last_recorder || ''
      },
      // ยอดสะสมปีงบ — เอาไปโชว์ตัวเลขใหญ่ทันทีตอนเปิดเว็บ ไม่ต้องรอหน้าสรุป
      fy: {
        saved: Number(sum.saved || 0),
        lost: Number(sum.lost || 0),
        records: Number(sum.records || 0),
        qty: Number(sum.qty || 0),
        zeroPriced: Number(sum.zeroPriced || 0)
      }
    });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'โหลดข้อมูลตั้งต้นไม่สำเร็จ' }, { status: 500 });
  }
}
