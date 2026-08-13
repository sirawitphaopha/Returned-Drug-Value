// แก้และเพิ่มยาในคลังกลาง (ตาราง drugs) — ใช้โดยหน้าคลังยาของเว็บนี้
//
// 🚨 ตารางนี้ใช้ร่วมกัน 3 เว็บ (มูลค่ายาคืน · ME-DRP · TB Calculator)
//    แก้ผิดกระทบทุกที่พร้อมกัน · ทุกการเปลี่ยนแปลงถูกบันทึกลง drug_audit อัตโนมัติ
//    ด้วย trigger ที่ ME-DRP สร้างไว้ จึงย้อนดูได้เสมอว่าใครแก้อะไรเมื่อไหร่
//
// 🚨 ไม่มี DELETE โดยตั้งใจ — ลบยาออกจากคลังไม่ได้ ให้ "ซ่อน" แทน (hidden = true)
//    เพราะรายการยาคืนเก่าที่อ้างถึงยาตัวนั้นยังต้องแสดงชื่อได้อยู่
//    ลบจริงทำได้ทางเดียวคือเข้าไปลบใน Supabase เอง (พี่กันคนเดียว)
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ช่องที่แก้ได้ — ระบุไว้ตายตัว ไม่รับอะไรก็ได้ที่ส่งมา
// `id` ไม่อยู่ในนี้เพราะฐานออกให้เอง และห้ามเปลี่ยน (รายการยาคืนเก่าอ้างถึงเลขนี้)
const FIELDS = ['generic', 'strength', 'unit', 'percent', 'form', 'route', 'release', 'brand', 'abbrev', 'had', 'preg', 'renal', 'hidden'];

function pick(body) {
  const row = {};
  for (const f of FIELDS) {
    if (body[f] === undefined) continue;
    const v = body[f];
    if (f === 'had' || f === 'renal' || f === 'hidden') row[f] = v === true;
    else row[f] = v === null || String(v).trim() === '' ? null : String(v).trim();
  }
  return row;
}

// GET — รายการยาดิบทั้งตาราง (รวมตัวที่ซ่อนไว้) สำหรับหน้าคลังยาโดยเฉพาะ
// ต่างจาก /api/drugs ที่กรองตัวซ่อนออกและผสมราคาเข้ามาแล้ว
export async function GET() {
  try {
    const db = getAdmin();
    const res = await db
      .from('drugs')
      .select('id,generic,strength,unit,percent,form,route,release,brand,abbrev,had,preg,renal,hidden')
      .order('generic', { ascending: true })
      .order('id', { ascending: true });
    if (res.error) throw new Error(res.error.message);
    return NextResponse.json({ drugs: res.data || [] });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'โหลดคลังยาไม่สำเร็จ' }, { status: 500 });
  }
}

// PUT — แก้ยาที่มีอยู่ (ต้องส่ง id มาด้วย)
export async function PUT(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: 'ไม่พบรหัสยา' }, { status: 400 });

    const row = pick(body);
    if (!Object.keys(row).length) return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้' }, { status: 400 });
    if (row.generic !== undefined && !row.generic) {
      return NextResponse.json({ error: 'ชื่อยาห้ามว่าง' }, { status: 400 });
    }

    const db = getAdmin();
    const res = await db.from('drugs').update(row).eq('id', id).select('id');
    if (res.error) throw new Error(res.error.message);
    if (!res.data?.length) return NextResponse.json({ error: 'ไม่พบยาที่ต้องการแก้' }, { status: 404 });

    return NextResponse.json({ ok: true, id: id });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 });
  }
}

// POST — เพิ่มยาใหม่ · ฐานออกเลข id ให้เอง (identity column)
export async function POST(req) {
  try {
    const body = await req.json();
    const row = pick(body);
    if (!row.generic) return NextResponse.json({ error: 'ต้องกรอกชื่อยา' }, { status: 400 });

    const db = getAdmin();
    const res = await db.from('drugs').insert(row).select('id');
    if (res.error) throw new Error(res.error.message);

    return NextResponse.json({ ok: true, id: res.data?.[0]?.id || null });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'เพิ่มยาไม่สำเร็จ' }, { status: 500 });
  }
}
