// รวมตาราง drugs (ของกลาง ห้ามแก้) กับ mr_drug_price (ของแอปนี้) ให้เป็นรายการยาชุดเดียว
// ใช้ร่วมกันทั้ง /api/drugs และ /api/bootstrap
//
// เบราว์เซอร์ได้เฉพาะ 4 ช่องนี้: id · ชื่อที่โชว์ · หน่วยนับไทย · ราคาต่อหน่วย
// (ตรงกับก้อน DRUGS ในมอคอัป) บวก hasPrice ไว้ตัดสินว่าจะขึ้นป้าย "ยังไม่ใส่ราคา" ไหม
import { getAdmin } from './supabaseAdmin';
import { resolveUnit } from './units';
import { buildDrugNames } from './drugName';

export async function loadCatalog() {
  const db = getAdmin();

  const [drugsRes, priceRes] = await Promise.all([
    db.from('drugs').select('id,generic,strength,unit,percent,form,route,release,brand,abbrev,hidden').order('id'),
    db.from('mr_drug_price').select('drug_id,unit_price,unit_th,display_name')
  ]);
  if (drugsRes.error) throw new Error(drugsRes.error.message);
  if (priceRes.error) throw new Error(priceRes.error.message);

  const priceById = new Map((priceRes.data || []).map((p) => [p.drug_id, p]));

  // ตั้งชื่อจากยา "ทุกตัว" ก่อน แล้วค่อยกรองตัวที่ซ่อนออก
  // ถ้าตั้งชื่อหลังกรอง ชื่อยาจะขยับตอนมีคนไปซ่อนยาอีกตัวในเว็บอื่น
  const all = (drugsRes.data || []).map((d) => ({
    ...d,
    display_name: (priceById.get(d.id) || {}).display_name
  }));
  const names = buildDrugNames(all);

  return all
    .filter((d) => d.hidden !== true)
    .map((d) => {
      const p = priceById.get(d.id) || {};
      const price = Number(p.unit_price || 0);
      return {
        id: d.id,
        name: names.get(d.id),
        // ชื่อการค้า — มีอยู่ 37 ตัวจาก 417 · ตัวที่ไม่มีส่งค่าว่างไป หน้าจอจะไม่วาดอะไรเลย
        // (ทำตามแบบ ME-DRP ที่พี่กันชี้ให้ดู)
        brand: (d.brand || '').trim(),
        // รูปแบบยา (tab · cap · injection · ointment) — คนละเรื่องกับ unit ที่เป็นหน่วยนับไทย
        // พี่กันขอให้โชว์เหมือน ME-DRP เพราะบอกได้ว่าเป็นยากินหรือยาฉีดตั้งแต่ตอนค้น
        form: (d.form || '').trim(),
        // ทางให้ยา (IV · oral · topical ...) — พี่กันขอให้โชว์เหมือน ME-DRP
        // ในฐานมี 8 ตัวที่ยังไม่กรอก ตัวนั้นจะไม่วาดอะไรเลย
        route: (d.route || '').trim(),
        // ตัวย่อที่เภสัชกรใช้เรียกกันจริง (CPM · HCTZ · INH) — ใช้ค้นหาและโชว์ในวงเล็บ
        // คั่นด้วยเว้นวรรคได้หลายค่า เช่น "SMZ-TMP TMP-SMX"
        abbrev: (d.abbrev || '').trim(),
        unit: resolveUnit(d.form, p.unit_th),
        price,
        hasPrice: price > 0
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
