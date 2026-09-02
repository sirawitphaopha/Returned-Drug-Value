// โหลดครั้งเดียวตอนเปิดเว็บ: รายการยา + การตั้งค่าห้องยา + ยอดสะสมปีงบปัจจุบัน
// รวม 3 อย่างไว้คำขอเดียว เพราะเน็ตโรงพยาบาลช้า ยิงทีละเส้นจะเห็นหน้าจอกระตุก
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';
import { loadCatalog } from '@/lib/catalog';
import { todayISO, fyOf, fyRange } from '@/lib/format';
import { authEnabled } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdmin();
    // วันที่คิดจากนาฬิกาไทย ไม่ใช่ UTC ของเซิร์ฟเวอร์ ไม่งั้นช่วงหัวค่ำจะได้วันของเมื่อวาน
    const today = todayISO();
    const range = fyRange(today);

    const [catalog, settingRes, summaryRes, hotRes, revRes] = await Promise.all([
      loadCatalog(),
      db.from('mr_setting').select('org_name,default_source,fav_ids,staff,pcu_sites,pcu_full,last_recorder').eq('id', 1).maybeSingle(),
      db.rpc('mr_summary', { p_from: range.from, p_to: range.to }),
      // รหัสยาที่ถูกคืนบ่อยที่สุดในปีงบนี้ — ให้ช่องค้นหาดันตัวที่ใช้บ่อยขึ้นก่อน
      // ต้องมาตั้งแต่เปิดเว็บ เพราะช่องค้นหาใช้ทันที (หน้าสรุปโหลดทีหลัง)
      db.rpc('mr_hot_drug_ids', { p_from: range.from, p_to: range.to, p_limit: 20 }),
      // ลายเซ็นคลังยา ณ วินาทีที่ส่งรายการยาชุดนี้ออกไป
      // ต้องมาคู่กับ drugs เสมอ ไม่งั้นถ้ามีคนแก้ยาระหว่างเปิดเว็บกับการถามครั้งแรก
      // เว็บจะจำลายเซ็นใหม่ไปเลยโดยที่ยังถือรายการยาชุดเก่าอยู่ = พลาดการแก้ครั้งนั้นถาวร
      db.from('drug_audit').select('id').order('id', { ascending: false }).limit(1)
    ]);
    if (settingRes.error) throw new Error(settingRes.error.message);
    if (summaryRes.error) throw new Error(summaryRes.error.message);
    // ยาคืนบ่อยเป็นของเสริม พังก็ไม่ควรทำให้ทั้งเว็บเปิดไม่ขึ้น
    const hotIds = hotRes.error ? [] : (Array.isArray(hotRes.data) ? hotRes.data : []);

    const st = settingRes.data || {};
    const sum = summaryRes.data || {};

    return NextResponse.json({
      today: today,
      fyYear: fyOf(today),
      // เว็บนี้ล็อกด้วยรหัสผ่านห้องยาอยู่ไหม — ใช้ตัดสินว่าจะโชว์ปุ่มออกจากระบบ
      // ถ้าไม่ได้ตั้ง MRV_PASSWORD (เช่นตอนรันในเครื่อง) ปุ่มนั้นกดไปก็ไม่มีความหมาย
      // 🚨 ปุ่มออกจากระบบต้องโผล่เฉพาะตอน "ล็อกอยู่จริง" เท่านั้น
      //    เคยลองเปลี่ยนไปผูกกับ authConfigured() เพื่อให้ปุ่มโผล่บนเครื่องทดสอบด้วย
      //    แต่พี่กันทักทันที 26 ส.ค. 2569: "ถ้าเป็นงี้แล้วเราจะกด log out ยังไง"
      //    เพราะเครื่องที่ไม่ได้ล็อก กดออกจากระบบไปก็ไม่มีคุกกี้ให้ลบ รีเฟรชก็เข้าได้เหมือนเดิม
      //    = ปุ่มหลอก ซึ่งแย่กว่าปุ่มที่ไม่มี
      //    ต้นเหตุจริงคือทางลัดปลดล็อกตอนรันในเครื่อง ซึ่งถอดทิ้งไปแล้ว 26 ส.ค. 2569
      authOn: authEnabled(),
      drugs: catalog,
      // รูปแบบเดียวกับที่ /api/drugs/rev คืน — เทียบกันตรง ๆ ได้
      drugRev: (revRes.error || !revRes.data?.length ? 0 : Number(revRes.data[0].id)) + ':' + catalog.length,
      hotIds: hotIds,
      setting: {
        orgName: st.org_name || 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่',
        defaultSource: st.default_source || 'opd',
        favIds: Array.isArray(st.fav_ids) ? st.fav_ids : [],
        staff: Array.isArray(st.staff) ? st.staff : [],
        pcuSites: Array.isArray(st.pcu_sites) ? st.pcu_sites : [],
        // ชื่อเต็มตามทะเบียนของแต่ละ รพ.สต. ใช้เฉพาะในใบสรุปที่พิมพ์ออกกระดาษ
        pcuFull: st.pcu_full && typeof st.pcu_full === 'object' ? st.pcu_full : {},
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
    return apiFail("bootstrap.GET", e, "โหลดข้อมูลตั้งต้นไม่สำเร็จ");
  }
}
