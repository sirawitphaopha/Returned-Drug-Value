// ราคาต่อหน่วย + หน่วยนับ ของยาแต่ละตัว — ใช้โดยหน้าจัดการราคา
//
// GET คืนข้อมูลละเอียดกว่า /api/drugs เพราะหน้านี้ต้องให้เภสัชกรดูออกว่าเป็นยาตัวไหน
// (มี form กับหน่วยเริ่มต้นของกลุ่ม ไว้เทียบตอนจะแก้หน่วยรายตัว)
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';
import { resolveUnit, FORM_UNIT, UNIT_FALLBACK } from '@/lib/units';
import { buildDrugNames } from '@/lib/drugName';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdmin();
    // 🚨 ราคาอยู่ในตาราง drugs แล้ว ตารางเดียวจบ (ย้ายมา 25 ส.ค. 2569)
    const drugsRes = await db.from('drugs')
      .select('id,generic,strength,unit,percent,form,route,release,brand,abbrev,pill_color,pill_color_hex,unit_price,unit_th,display_name,price_note,price_needs_check,price_suggestions,hidden')
      .order('id');
    if (drugsRes.error) throw new Error(drugsRes.error.message);

    const all = drugsRes.data || [];
    const names = buildDrugNames(all);

    const items = all
      .filter((d) => d.hidden !== true)
      .map((d) => {
        const price = Number(d.unit_price || 0);
        return {
          id: d.id,
          name: names.get(d.id),
          // ชื่อการค้า — โชว์ในวงเล็บสีเทลต่อท้ายชื่อยา เฉพาะตัวที่มี
          brand: (d.brand || '').trim(),
          form: (d.form || '').trim(),
          // ทางให้ยา — โชว์คู่กับรูปแบบยาในบรรทัดล่าง ให้ตรงกับผลค้นหาหน้าบันทึก
          route: (d.route || '').trim(),
          // ตัวย่อที่เภสัชกรใช้เรียกกันจริง — ค้นหาได้ + โชว์ในวงเล็บสีม่วง
          abbrev: (d.abbrev || '').trim(),
          unit: resolveUnit(d.form, d.unit_th),
          // ว่าง = ยังใช้หน่วยเริ่มต้นของกลุ่มอยู่ ไม่ได้แก้รายตัว
          unitTh: (d.unit_th || '').trim(),
          defaultUnit: FORM_UNIT[(d.form || '').trim()] || UNIT_FALLBACK,
          price,
          hasPrice: price > 0,
          note: (d.price_note || '').trim(),
          // จับคู่กับ HIS ไม่ชัวร์ รอเภสัชกรกดเลือก · ราคายังเป็น 0 อยู่
          needsCheck: d.price_needs_check === true,
          // ตัวเลือกราคาที่ระบบเสนอ ให้กดเลือกในหน้าจัดการราคา
          suggestions: Array.isArray(d.price_suggestions) ? d.price_suggestions : []
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    return NextResponse.json({
      items,
      total: items.length,
      priced: items.filter((x) => x.hasPrice).length
    });
  } catch (e) {
    return apiFail("prices.GET", e, "โหลดราคายาไม่สำเร็จ");
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const list = Array.isArray(body.items) ? body.items : [];
    if (!list.length) return NextResponse.json({ error: 'ไม่มีรายการที่จะบันทึก' }, { status: 400 });
    if (list.length > 500) return NextResponse.json({ error: 'บันทึกได้ครั้งละไม่เกิน 500 รายการ' }, { status: 400 });

    const now = new Date().toISOString();
    const rows = [];
    for (const it of list) {
      const id = Number(it.drugId);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: 'รหัสยาไม่ถูกต้อง' }, { status: 400 });
      }
      const price = Number(it.price);
      // เพดานต้องต่ำกว่าที่ numeric(12,2) รับได้ ไม่งั้น Postgres ตีกลับเป็น 500
      // แล้วราคาตัวอื่นที่แก้ค้างไว้พร้อมกันเป็นสิบตัวจะไม่ถูกบันทึกทั้งหมด (ส่งเป็นก้อนเดียว)
      if (!Number.isFinite(price) || price < 0 || price > 999999.99) {
        return NextResponse.json(
          { error: 'ราคาของรหัสยา ' + id + ' ต้องอยู่ระหว่าง 0 ถึง 999999.99' },
          { status: 400 }
        );
      }
      const unitTh = String(it.unitTh == null ? '' : it.unitTh).trim().slice(0, 24);
      const row = {
        id: id,
        // เก็บ 4 ตำแหน่ง — ไฟล์จาก HIS ให้ราคามาแบบ 0.4567 บาท/เม็ด
        // ถ้าปัดเหลือ 2 ตำแหน่ง ยาที่ถูกกว่า 0.005 จะกลายเป็น 0 = ระบบถือว่ายังไม่ใส่ราคา
        unit_price: Math.round(price * 10000) / 10000,
        unit_th: unitTh || null,
        price_updated_at: now
      };

      // ── ช่องเสริมสำหรับการนำเข้าราคาจาก HIS ────────────────────────────────
      // ส่งมาเมื่อไหร่ก็เขียนทับ ไม่ส่งมาก็ไม่แตะของเดิม
      // note        = ที่มาของราคา เช่น "HIS 5 ส.ค. 69 · CefTRI-axone 1 g/vial"
      // needsCheck  = จับคู่ไม่ชัวร์ รอเภสัชกรกดเลือก
      // suggestions = ตัวเลือกราคาที่ระบบเสนอ ให้กดเลือกในหน้าจัดการราคา
      if (it.note !== undefined) row.price_note = String(it.note || '').trim().slice(0, 400) || null;
      if (it.needsCheck !== undefined) row.price_needs_check = !!it.needsCheck;
      if (it.suggestions !== undefined) {
        const list = Array.isArray(it.suggestions) ? it.suggestions : [];
        row.price_suggestions = list.slice(0, 6).map((sg) => ({
          name: String(sg.name || '').slice(0, 90),
          price: Number(sg.price) || 0,
          unit: String(sg.unit || '').slice(0, 24)
        }));
      }

      rows.push(row);
    }

    const db = getAdmin();

    // ── 🚨 ต้องใช้ update ทีละแถว ห้ามใช้ upsert กับตาราง drugs ───────────────
    //
    // ราคาย้ายมาอยู่ในตาราง drugs แล้ว (25 ส.ค. 2569) ซึ่งเป็นตารางของกลาง 3 เว็บ
    // ที่มีช่องบังคับกรอกอย่าง generic อยู่ด้วย
    //
    // upsert จะพยายาม "แทรกแถวใหม่" ถ้าหารหัสนั้นไม่เจอ แล้วจะพังเพราะไม่มีชื่อยา
    // ที่แย่กว่าคือถ้าวันหน้ามีคนส่งรหัสยาผิดมา จะกลายเป็นสร้างยาผีขึ้นในคลังกลาง
    // update จึงปลอดภัยกว่า — หารหัสไม่เจอก็แค่ไม่มีอะไรเปลี่ยน ไม่สร้างขยะทิ้งไว้
    //
    // ⚠️ ส่งเป็นชุดละ 20 แถวพร้อมกัน ไม่ยิงทีละตัวเรียงกัน
    //    นำเข้าราคาจาก HIS ทีหนึ่งมีได้ถึง 400 ตัว ถ้ายิงทีละตัวจะรอนานมาก
    //
    // (บั๊กเดิมเรื่อง "ส่งหลายแถวแล้วช่องที่ไม่ได้ส่งโดนเติมค่าว่าง" หมดไปเอง
    //  เพราะ update แตะเฉพาะช่องที่ส่งมาจริงอยู่แล้ว ไม่ต้องจัดกลุ่มตามชุดช่องอีก)
    const CHUNK = 20;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const results = await Promise.all(chunk.map((r) => {
        const { id: drugId, ...patch } = r;
        return db.from('drugs').update(patch).eq('id', drugId);
      }));
      for (const res of results) {
        if (res.error) throw new Error(res.error.message);
      }
    }

    // ── ตีราคาย้อนหลัง ────────────────────────────────────────────────────────
    // backfill = true → เติมราคาให้แถวเก่าที่มูลค่ายังเป็น 0 ของยาชุดนี้
    // 🚨 เติมเฉพาะแถวที่ราคาเป็น 0 เท่านั้น ไม่ทับแถวที่มีราคาอยู่แล้ว (กฎแช่ราคายังอยู่ครบ)
    let backfilled = 0;
    if (body.backfill) {
      const items = rows
        .filter((r) => r.unit_price > 0)
        .map((r) => ({ drugId: r.id, price: r.unit_price }));
      if (items.length) {
        const bf = await db.rpc('mr_backfill_price', {
          p_items: items,
          p_by: String(body.by || '').trim().slice(0, 80) || null
        });
        if (bf.error) throw new Error(bf.error.message);
        backfilled = Number((bf.data || {}).updated || 0);
      }
    }

    return NextResponse.json({ ok: true, saved: rows.length, backfilled: backfilled });
  } catch (e) {
    return apiFail("prices.PUT", e, "บันทึกราคาไม่สำเร็จ");
  }
}
