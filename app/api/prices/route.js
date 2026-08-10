// ราคาต่อหน่วย + หน่วยนับ ของยาแต่ละตัว — ใช้โดยหน้าจัดการราคา
//
// GET คืนข้อมูลละเอียดกว่า /api/drugs เพราะหน้านี้ต้องให้เภสัชกรดูออกว่าเป็นยาตัวไหน
// (มี form กับหน่วยเริ่มต้นของกลุ่ม ไว้เทียบตอนจะแก้หน่วยรายตัว)
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { resolveUnit, FORM_UNIT, UNIT_FALLBACK } from '@/lib/units';
import { buildDrugNames } from '@/lib/drugName';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdmin();
    const [drugsRes, priceRes] = await Promise.all([
      db.from('drugs').select('id,generic,strength,unit,percent,form,release,brand,hidden').order('id'),
      db.from('mr_drug_price').select('drug_id,unit_price,unit_th,display_name,note,needs_check,suggestions')
    ]);
    if (drugsRes.error) throw new Error(drugsRes.error.message);
    if (priceRes.error) throw new Error(priceRes.error.message);

    const priceById = new Map((priceRes.data || []).map((p) => [p.drug_id, p]));
    const all = (drugsRes.data || []).map((d) => ({
      ...d,
      display_name: (priceById.get(d.id) || {}).display_name
    }));
    const names = buildDrugNames(all);

    const items = all
      .filter((d) => d.hidden !== true)
      .map((d) => {
        const p = priceById.get(d.id) || {};
        const price = Number(p.unit_price || 0);
        return {
          id: d.id,
          name: names.get(d.id),
          // ชื่อการค้า — โชว์ในวงเล็บสีเทลต่อท้ายชื่อยา เฉพาะตัวที่มี
          brand: (d.brand || '').trim(),
          form: (d.form || '').trim(),
          unit: resolveUnit(d.form, p.unit_th),
          // ว่าง = ยังใช้หน่วยเริ่มต้นของกลุ่มอยู่ ไม่ได้แก้รายตัว
          unitTh: (p.unit_th || '').trim(),
          defaultUnit: FORM_UNIT[(d.form || '').trim()] || UNIT_FALLBACK,
          price,
          hasPrice: price > 0,
          note: (p.note || '').trim(),
          // จับคู่กับ HIS ไม่ชัวร์ รอเภสัชกรกดเลือก · ราคายังเป็น 0 อยู่
          needsCheck: p.needs_check === true,
          // ตัวเลือกราคาที่ระบบเสนอ ให้กดเลือกในหน้าจัดการราคา
          suggestions: Array.isArray(p.suggestions) ? p.suggestions : []
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    return NextResponse.json({
      items,
      total: items.length,
      priced: items.filter((x) => x.hasPrice).length
    });
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'โหลดราคายาไม่สำเร็จ' }, { status: 500 });
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
        drug_id: id,
        // เก็บ 4 ตำแหน่ง — ไฟล์จาก HIS ให้ราคามาแบบ 0.4567 บาท/เม็ด
        // ถ้าปัดเหลือ 2 ตำแหน่ง ยาที่ถูกกว่า 0.005 จะกลายเป็น 0 = ระบบถือว่ายังไม่ใส่ราคา
        unit_price: Math.round(price * 10000) / 10000,
        unit_th: unitTh || null,
        updated_at: now
      };

      // ── ช่องเสริมสำหรับการนำเข้าราคาจาก HIS ────────────────────────────────
      // ส่งมาเมื่อไหร่ก็เขียนทับ ไม่ส่งมาก็ไม่แตะของเดิม
      // note        = ที่มาของราคา เช่น "HIS 5 ส.ค. 69 · CefTRI-axone 1 g/vial"
      // needsCheck  = จับคู่ไม่ชัวร์ รอเภสัชกรกดเลือก
      // suggestions = ตัวเลือกราคาที่ระบบเสนอ ให้กดเลือกในหน้าจัดการราคา
      if (it.note !== undefined) row.note = String(it.note || '').trim().slice(0, 400) || null;
      if (it.needsCheck !== undefined) row.needs_check = !!it.needsCheck;
      if (it.suggestions !== undefined) {
        const list = Array.isArray(it.suggestions) ? it.suggestions : [];
        row.suggestions = list.slice(0, 6).map((sg) => ({
          name: String(sg.name || '').slice(0, 90),
          price: Number(sg.price) || 0,
          unit: String(sg.unit || '').slice(0, 24)
        }));
      }

      rows.push(row);
    }

    const db = getAdmin();

    // ── 🚨 ต้องแยกส่งเป็นกลุ่มตาม "ชุดช่องที่เหมือนกัน" ห้ามส่งรวมทีเดียว ─────────
    //
    // บั๊กที่เคยเจอ (10 ส.ค. 2569): กดบันทึกทีละตัวได้ แต่กดหลายตัวพร้อมกันแล้วพัง
    //   null value in column "needs_check" violates not-null constraint
    //
    // สาเหตุ: ตอนส่งหลายแถวพร้อมกัน ฐานข้อมูลจะรวมรายชื่อช่องจากทุกแถวเป็นชุดเดียว
    //         แถวไหนไม่มีช่องนั้นจะถูกเติมค่าว่างลงไป
    //         แถวยาปกติไม่ได้ส่ง needs_check/suggestions มาด้วย เลยโดนเติมค่าว่าง
    //         แต่สองช่องนี้ห้ามเป็นค่าว่าง → ตีกลับทั้งก้อน ทั้งที่ข้อมูลถูกต้องหมด
    //
    // ทางแก้ที่ไม่เลือก: เติมค่าเริ่มต้นให้ทุกแถว
    //   เพราะจะไปล้าง note กับ suggestions ของยาที่ผู้ใช้ไม่ได้ตั้งใจแตะ = ข้อมูลหาย
    //
    // จัดกลุ่มตามรายชื่อช่องแล้วส่งทีละกลุ่ม → แถวไหนไม่ได้ส่งช่องไหนมา ช่องนั้นไม่ถูกแตะเลย
    // วิธีนี้รองรับช่องที่จะเพิ่มในอนาคตเองโดยไม่ต้องมาแก้ซ้ำ
    const groups = new Map();
    for (const r of rows) {
      const sig = Object.keys(r).sort().join(',');
      if (!groups.has(sig)) groups.set(sig, []);
      groups.get(sig).push(r);
    }

    // ยาทั้ง 417 ตัวมีแถวราคาอยู่แล้วจาก 003_seed_prices.sql · upsert ไว้กันยาที่เพิ่มใหม่ทีหลัง
    for (const chunk of groups.values()) {
      const { error } = await db.from('mr_drug_price').upsert(chunk, { onConflict: 'drug_id' });
      if (error) throw new Error(error.message);
    }

    // ── ตีราคาย้อนหลัง ────────────────────────────────────────────────────────
    // backfill = true → เติมราคาให้แถวเก่าที่มูลค่ายังเป็น 0 ของยาชุดนี้
    // 🚨 เติมเฉพาะแถวที่ราคาเป็น 0 เท่านั้น ไม่ทับแถวที่มีราคาอยู่แล้ว (กฎแช่ราคายังอยู่ครบ)
    let backfilled = 0;
    if (body.backfill) {
      const items = rows
        .filter((r) => r.unit_price > 0)
        .map((r) => ({ drugId: r.drug_id, price: r.unit_price }));
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
    console.error('[api]', e);
    return NextResponse.json({ error: 'บันทึกราคาไม่สำเร็จ' }, { status: 500 });
  }
}
