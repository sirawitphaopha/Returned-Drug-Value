// หน่วยนับไทยของยาแต่ละรูปแบบ (form)
//
// ⚠️ drugs.unit ไม่ใช่หน่วยนับ — เป็นหน่วยความแรง (mg, mg/3 mL, g)
//    หน่วยที่ผู้ป่วยคืนมาต้องเดาจาก form แทน แล้วแก้รายตัวได้ที่ mr_drug_price.unit_th
//
// ลำดับการตัดสิน: unit_th (รายตัว) → FORM_UNIT[form] (ทั้งกลุ่ม) → UNIT_FALLBACK
// คำนวณฝั่งเซิร์ฟเวอร์เท่านั้น เบราว์เซอร์เห็นแค่ผลลัพธ์

export const FORM_UNIT = {
  tab: 'เม็ด',                  // 209 ตัว
  injection: 'หลอด',            // 48 ตัว → 33 หลอด, 15 ตัวเป็นขวด (ใส่ unit_th รายตัวใน 003_seed_prices.sql)
  cap: 'แคปซูล',                // 35
  vial: 'ขวด',                  // 25
  syrup: 'ขวด',                 // 18
  solution: 'ขวด',              // 14
  amp: 'หลอด',                  // 12
  suspension: 'ขวด',            // 7
  cream: 'หลอด',                // 7
  ointment: 'หลอด',             // 4
  powder: 'ขวด',                // 4
  sachet: 'ซอง',                // 4
  MDI: 'กระบอก',                // 3
  'prefilled syringe': 'หลอด',  // 3
  implant: 'แท่ง',              // 2
  oil: 'ขวด',
  drops: 'ขวด',
  'eye drops': 'ขวด',
  paste: 'หลอด',
  nebule: 'หลอด',
  patch: 'แผ่น',
  lotion: 'ขวด',
  inhaler: 'กระบอก',
  emulsion: 'ขวด',
  suppository: 'แท่ง',
  elixir: 'ขวด',
  'prefilled pen': 'ด้าม',
  turbuhaler: 'กระบอก',
  gel: 'หลอด',
  spray: 'ขวด'
};

export const UNIT_FALLBACK = 'หน่วย';   // form ว่าง (มี 1 แถวในฐาน)

export function resolveUnit(form, unitTh) {
  const own = (unitTh || '').trim();
  if (own) return own;
  return FORM_UNIT[form] || UNIT_FALLBACK;
}
