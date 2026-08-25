// อ่านรายการยาจากตาราง drugs ตารางเดียว — ใช้ร่วมกันทั้ง /api/drugs และ /api/bootstrap
//
// 🚨 ราคาย้ายเข้ามาอยู่ใน drugs แล้ว (25 ส.ค. 2569)
//    พี่กันสั่ง: "คลังยาทั้งหมดคือส่วนกลางที่ทุกเว็บใช้ด้วยกัน ทุกอย่าง"
//    เดิมราคาอยู่ตาราง mr_drug_price ของเว็บนี้เอง เว็บอื่น (ME-DRP · TB Calculator) เข้าไม่ถึง
//    ตาราง mr_drug_price ยังอยู่เป็นสำเนาสำรอง แต่ไม่มีโค้ดไหนอ่านแล้ว
//
// เบราว์เซอร์ได้เฉพาะช่องที่จำเป็น: id · ชื่อที่โชว์ · หน่วยนับไทย · ราคาต่อหน่วย · สีเม็ดยา
// บวก hasPrice ไว้ตัดสินว่าจะขึ้นป้าย "ยังไม่ใส่ราคา" ไหม
import { getAdmin } from './supabaseAdmin';
import { resolveUnit } from './units';
import { buildDrugNames } from './drugName';

export async function loadCatalog() {
  const db = getAdmin();

  const drugsRes = await db.from('drugs')
    .select('id,generic,strength,unit,percent,form,route,release,brand,abbrev,pill_color,pill_color_hex,unit_price,unit_th,display_name,hidden')
    .order('id');
  if (drugsRes.error) throw new Error(drugsRes.error.message);

  // ตั้งชื่อจากยา "ทุกตัว" ก่อน แล้วค่อยกรองตัวที่ซ่อนออก
  // ถ้าตั้งชื่อหลังกรอง ชื่อยาจะขยับตอนมีคนไปซ่อนยาอีกตัวในเว็บอื่น
  const all = drugsRes.data || [];
  const names = buildDrugNames(all);

  return all
    .filter((d) => d.hidden !== true)
    .map((d) => {
      const price = Number(d.unit_price || 0);
      return {
        id: d.id,
        name: names.get(d.id),
        // ชื่อการค้า — มีอยู่ 37 ตัวจาก 417 · ตัวที่ไม่มีส่งค่าว่างไป หน้าจอจะไม่วาดอะไรเลย
        // (ทำตามแบบ ME-DRP ที่พี่กันชี้ให้ดู)
        brand: (d.brand || '').trim(),
        // 🚨 สีเม็ดยาจริง — มาจากตาราง drugs ของกลาง ไม่ได้ฝังในโค้ด
        //    ยาที่ผู้ผลิตแยกความแรงด้วยสีเม็ด (Warfarin) เภสัชกรจำด้วยสีมากกว่าตัวเลข
        //    เพิ่มยาตัวใหม่แค่กรอกในหน้าคลังยา ไม่ต้องแตะโค้ดที่ไหนอีก (พี่กันสั่ง 25 ส.ค. 2569)
        pillColor: (d.pill_color || '').trim(),
        pillColorHex: (d.pill_color_hex || '').trim(),
        // รูปแบบยา (tab · cap · injection · ointment) — คนละเรื่องกับ unit ที่เป็นหน่วยนับไทย
        // พี่กันขอให้โชว์เหมือน ME-DRP เพราะบอกได้ว่าเป็นยากินหรือยาฉีดตั้งแต่ตอนค้น
        form: (d.form || '').trim(),
        // ทางให้ยา (IV · oral · topical ...) — พี่กันขอให้โชว์เหมือน ME-DRP
        // ในฐานมี 8 ตัวที่ยังไม่กรอก ตัวนั้นจะไม่วาดอะไรเลย
        route: (d.route || '').trim(),
        // ตัวย่อที่เภสัชกรใช้เรียกกันจริง (CPM · HCTZ · INH) — ใช้ค้นหาและโชว์ในวงเล็บ
        // คั่นด้วยเว้นวรรคได้หลายค่า เช่น "SMZ-TMP TMP-SMX"
        abbrev: (d.abbrev || '').trim(),
        unit: resolveUnit(d.form, d.unit_th),
        price,
        hasPrice: price > 0
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
