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
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ช่องที่แก้ได้ — ระบุไว้ตายตัว ไม่รับอะไรก็ได้ที่ส่งมา
// `id` ไม่อยู่ในนี้เพราะฐานออกให้เอง และห้ามเปลี่ยน (รายการยาคืนเก่าอ้างถึงเลขนี้)
// 🚨 เพิ่มช่องใหม่ในตาราง drugs ต้องใส่ที่นี่ด้วย ไม่งั้นแก้จากหน้าคลังยาแล้วค่าไม่ถูกบันทึก
//    ราคากับสีเม็ดยาเป็นของกลาง ย้ายเข้ามาอยู่ในคลังยาแล้ว (พี่กันสั่ง 25 ส.ค. 2569)
const FIELDS = ['generic', 'strength', 'unit', 'percent', 'form', 'route', 'release', 'brand', 'abbrev',
  'had', 'preg', 'renal', 'pill_color', 'pill_color_hex', 'unit_th', 'hidden'];

// ช่องตัวเลข — แยกออกมาเพราะต้องแปลงเป็นตัวเลขจริง ไม่ใช่เก็บเป็นข้อความ
const NUM_FIELDS = ['unit_price'];

// ความยาวสูงสุดของแต่ละช่อง — ตาราง drugs ใช้ร่วม 3 เว็บ
// ถ้าไม่จำกัด คำขอเดียวที่ส่งชื่อยา 5 MB มาจะทำให้ทุกเว็บลากแถวบวมมหาศาลมาแสดงทุกครั้งที่เปิด
const MAXLEN = {
  generic: 160, strength: 60, unit: 40, percent: 20, form: 40, route: 40,
  release: 40, brand: 90, abbrev: 60, preg: 20,
  pill_color: 24, pill_color_hex: 9, unit_th: 24
};

function pick(body) {
  const row = {};
  for (const f of FIELDS) {
    if (body[f] === undefined) continue;
    const v = body[f];
    if (f === 'had' || f === 'renal' || f === 'hidden') row[f] = v === true;
    else row[f] = v === null || String(v).trim() === '' ? null : String(v).trim().slice(0, MAXLEN[f] || 80);
  }
  for (const f of NUM_FIELDS) {
    if (body[f] === undefined) continue;
    const n = Number(body[f]);
    // ราคาติดลบหรือเกินเพดานที่คอลัมน์รับได้ = ไม่รับ ปล่อยค่าเดิมไว้
    if (Number.isFinite(n) && n >= 0 && n <= 999999.99) {
      row[f] = Math.round(n * 10000) / 10000;   // เก็บ 4 ตำแหน่ง ยาถูก ๆ จาก HIS มาแบบ 0.4567
      row.price_updated_at = new Date().toISOString();
    }
  }
  return row;
}

// GET — รายการยาดิบทั้งตาราง (รวมตัวที่ซ่อนไว้) สำหรับหน้าคลังยาโดยเฉพาะ
// ต่างจาก /api/drugs ที่กรองตัวซ่อนออกและผสมราคาเข้ามาแล้ว
export async function GET() {
  try {
    const db = getAdmin();
    // 🚨 ราคาอยู่ในตาราง drugs แล้ว ไม่ต้อง join ตารางอื่น (ย้ายมา 25 ส.ค. 2569)
    //    พี่กันสั่ง: "คลังยาทั้งหมดคือส่วนกลางที่ทุกเว็บใช้ด้วยกัน ทุกอย่าง"
    const res = await db.from('drugs')
      .select('id,generic,strength,unit,percent,form,route,release,brand,abbrev,had,preg,renal,pill_color,pill_color_hex,unit_price,unit_th,price_needs_check,hidden')
      .order('generic', { ascending: true })
      .order('id', { ascending: true });
    if (res.error) throw new Error(res.error.message);

    const drugs = (res.data || []).map((d) => ({
      ...d,
      price: Number(d.unit_price || 0),
      unitTh: d.unit_th || '',
      needsCheck: d.price_needs_check === true
    }));
    return NextResponse.json({ drugs: drugs });
  } catch (e) {
    return apiFail("catalog.GET", e, "โหลดคลังยาไม่สำเร็จ");
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
    return apiFail("catalog.PUT", e, "บันทึกไม่สำเร็จ");
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
    return apiFail("catalog.POST", e, "เพิ่มยาไม่สำเร็จ");
  }
}
