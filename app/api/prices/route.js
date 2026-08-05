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
      db.from('drugs').select('id,generic,strength,unit,percent,form,release,hidden').order('id'),
      db.from('mr_drug_price').select('drug_id,unit_price,unit_th,display_name,note')
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
          form: (d.form || '').trim(),
          unit: resolveUnit(d.form, p.unit_th),
          // ว่าง = ยังใช้หน่วยเริ่มต้นของกลุ่มอยู่ ไม่ได้แก้รายตัว
          unitTh: (p.unit_th || '').trim(),
          defaultUnit: FORM_UNIT[(d.form || '').trim()] || UNIT_FALLBACK,
          price,
          hasPrice: price > 0,
          note: (p.note || '').trim()
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
      rows.push({
        drug_id: id,
        // เก็บ 4 ตำแหน่ง — ไฟล์จาก HIS ให้ราคามาแบบ 0.4567 บาท/เม็ด
        // ถ้าปัดเหลือ 2 ตำแหน่ง ยาที่ถูกกว่า 0.005 จะกลายเป็น 0 = ระบบถือว่ายังไม่ใส่ราคา
        unit_price: Math.round(price * 10000) / 10000,
        unit_th: unitTh || null,
        updated_at: now
      });
    }

    const db = getAdmin();
    // ยาทั้ง 417 ตัวมีแถวราคาอยู่แล้วจาก 003_seed_prices.sql · upsert ไว้กันยาที่เพิ่มใหม่ทีหลัง
    const { error } = await db.from('mr_drug_price').upsert(rows, { onConflict: 'drug_id' });
    if (error) throw new Error(error.message);

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
