// การตั้งค่าห้องยา — มีแถวเดียวเสมอ (mr_setting.id = 1) เพราะยังไม่มีระบบผู้ใช้
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';
import { SOURCES } from '@/lib/format';

export const dynamic = 'force-dynamic';

// ชื่อตั้งต้นดึงจากจุดกลาง เพื่อให้หน้าเข้าสู่ระบบกับหลังบ้านตรงกันเสมอ
import { DEFAULT_ORG } from '@/lib/format';
const SOURCE_KEYS = SOURCES.map((s) => s.key);

function shape(row) {
  const st = row || {};
  return {
    orgName: st.org_name || DEFAULT_ORG,
    defaultSource: st.default_source || 'opd',
    favIds: Array.isArray(st.fav_ids) ? st.fav_ids : [],
    // รายชื่อคนในห้องยา — ใช้ในหน้าต่างเซ็นชื่อก่อนส่งล็อต
    staff: Array.isArray(st.staff) ? st.staff : [],
    // รายชื่อ รพ.สต. ในเครือข่ายอำเภอ — โผล่เป็นดรอปดาวน์เมื่อเลือกแหล่งที่มาเป็น รพ.สต.
    // 🚨 เก็บในฐาน ไม่ฝังในโค้ด · เปิดแห่งใหม่หรือเปลี่ยนชื่อ แก้ในหน้าตั้งค่าได้เลย
    pcuSites: Array.isArray(st.pcu_sites) ? st.pcu_sites : [],
    pcuFull: st.pcu_full && typeof st.pcu_full === 'object' ? st.pcu_full : {},
    lastRecorder: st.last_recorder || ''
  };
}

export async function GET() {
  try {
    const db = getAdmin();
    const { data, error } = await db
      .from('mr_setting')
      .select('org_name,default_source,fav_ids,staff,pcu_sites,pcu_full,last_recorder')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({ setting: shape(data) });
  } catch (e) {
    return apiFail("settings.GET", e, "อ่านการตั้งค่าไม่สำเร็จ");
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const patch = { updated_at: new Date().toISOString() };

    if (body.orgName !== undefined) {
      // เผื่อไว้ 200 ตัวอักษร — ชื่อเต็มยศแบบราชการยาวกว่าที่คิด
      // "กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค โรงพยาบาลปรางค์กู่ จังหวัดศรีสะเกษ" = 72 ตัว
      const name = String(body.orgName).trim().slice(0, 200);
      // ปล่อยให้ว่างไม่ได้ ชื่อนี้ไปโผล่บน header กับหัวไฟล์ที่ส่งออก
      patch.org_name = name || DEFAULT_ORG;
    }

    if (body.defaultSource !== undefined) {
      if (SOURCE_KEYS.indexOf(body.defaultSource) < 0) {
        return NextResponse.json({ error: 'แหล่งที่มาไม่ถูกต้อง' }, { status: 400 });
      }
      patch.default_source = body.defaultSource;
    }

    if (body.favIds !== undefined) {
      if (!Array.isArray(body.favIds)) {
        return NextResponse.json({ error: 'รายการยาที่คืนบ่อยไม่ถูกต้อง' }, { status: 400 });
      }
      const ids = [];
      for (const raw of body.favIds) {
        const id = Number(raw);
        if (Number.isInteger(id) && id > 0 && ids.indexOf(id) < 0) ids.push(id);
      }
      patch.fav_ids = ids.slice(0, 6);
    }

    if (body.staff !== undefined) {
      if (!Array.isArray(body.staff)) {
        return NextResponse.json({ error: 'รายชื่อผู้บันทึกไม่ถูกต้อง' }, { status: 400 });
      }
      const names = [];
      for (const raw of body.staff) {
        const n = String(raw == null ? '' : raw).trim().slice(0, 80);
        if (n && names.indexOf(n) < 0) names.push(n);
      }
      patch.staff = names.slice(0, 60);
    }

    if (body.pcuSites !== undefined) {
      if (!Array.isArray(body.pcuSites)) {
        return NextResponse.json({ error: 'รายชื่อ รพ.สต. ไม่ถูกต้อง' }, { status: 400 });
      }
      const sites = [];
      for (const raw of body.pcuSites) {
        const n = String(raw == null ? '' : raw).trim().slice(0, 120);
        if (n && sites.indexOf(n) < 0) sites.push(n);
      }
      patch.pcu_sites = sites.slice(0, 80);
    }

    // จำคนที่เซ็นชื่อล่าสุด ครั้งหน้าจะได้ติ๊กไว้ให้แล้ว กดยืนยันอย่างเดียว
    if (body.lastRecorder !== undefined) {
      patch.last_recorder = String(body.lastRecorder || '').trim().slice(0, 80) || null;
    }

    const db = getAdmin();
    const { data, error } = await db
      .from('mr_setting')
      .update(patch)
      .eq('id', 1)
      .select('org_name,default_source,fav_ids,staff,pcu_sites,pcu_full,last_recorder')
      .maybeSingle();
    if (error) throw new Error(error.message);

    return NextResponse.json({ setting: shape(data) });
  } catch (e) {
    return apiFail("settings.PUT", e, "บันทึกการตั้งค่าไม่สำเร็จ");
  }
}
