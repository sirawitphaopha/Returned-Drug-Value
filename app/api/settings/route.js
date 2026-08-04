// การตั้งค่าห้องยา — มีแถวเดียวเสมอ (mr_setting.id = 1) เพราะยังไม่มีระบบผู้ใช้
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { SOURCES } from '@/lib/format';

export const dynamic = 'force-dynamic';

const DEFAULT_ORG = 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่';
const SOURCE_KEYS = SOURCES.map((s) => s.key);

function shape(row) {
  const st = row || {};
  return {
    orgName: st.org_name || DEFAULT_ORG,
    defaultSource: st.default_source || 'opd',
    favIds: Array.isArray(st.fav_ids) ? st.fav_ids : []
  };
}

export async function GET() {
  try {
    const db = getAdmin();
    const { data, error } = await db
      .from('mr_setting')
      .select('org_name,default_source,fav_ids')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({ setting: shape(data) });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'อ่านการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const patch = { updated_at: new Date().toISOString() };

    if (body.orgName !== undefined) {
      const name = String(body.orgName).trim().slice(0, 120);
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

    const db = getAdmin();
    const { data, error } = await db
      .from('mr_setting')
      .update(patch)
      .eq('id', 1)
      .select('org_name,default_source,fav_ids')
      .maybeSingle();
    if (error) throw new Error(error.message);

    return NextResponse.json({ setting: shape(data) });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 });
  }
}
