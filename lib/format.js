// ค่าคงที่ + ฟังก์ชันแปลงรูปแบบตัวเลข/วันที่
// คัดจากมอคอัป (Med Return App.dc.html บรรทัด 741–786) ตัวต่อตัว — ห้ามแก้สูตร
// ตัดออกแค่ของเดโม: DEMO_VERSION · demoIsStale · demoSession · mulberry · buildDemo

// 🚨 จุดกลางจุดเดียวของ "แหล่งที่มา" — เพิ่ม/แก้ที่นี่แล้วไปทั้งเว็บ
//    (ช่องเลือกหน้าบันทึก · ตัวกรองหน้าประวัติ · โดนัทหน้าสรุป · หัวคอลัมน์ไฟล์ส่งออก
//     และ allowlist ฝั่งเซิร์ฟเวอร์ที่ app/api/returns/route.js กับ settings/route.js ดึงไปใช้)
//
// 🚨 เพิ่มตัวใหม่ต้องแก้ check constraint ในฐานด้วย ไม่งั้นบันทึกไม่ผ่าน
//    (mr_return.source และ mr_setting.default_source — ดู scripts/009_source_ipd.sql)
//
// ⚠️ ลำดับในรายการนี้คุมสีในโดนัทหน้าสรุป (greens[i*2]) แทรกตรงกลางแล้วสีของตัวที่อยู่หลังจะขยับ
export const SOURCES = [
  { key: 'opd', label: 'OPD ทั่วไป' },
  { key: 'ncd', label: 'OPD NCD' },
  // 🚨 เขียน IPD เป็นตัวย่ออังกฤษ ห้ามแปลไทย (แบบเดียวกับ Lot) — พี่กันสั่ง 25 ส.ค. 2569
  { key: 'ipd', label: 'ห้องยา IPD' },
  // 🚨 เอา 'ward' (หอผู้ป่วย) ออกแล้ว — พี่กันสั่ง 25 ส.ค. 2569 ว่าซ้ำซ้อนกับห้องยา IPD
  //    ยาที่คืนจากผู้ป่วยในเดินผ่านห้องยา IPD เสมอ จึงเป็นทางเดียวกัน แยกไว้ทำให้เลือกลังเล
  //    ตรวจแล้วไม่มีแถวไหนในฐานใช้ค่านี้เลย (ncd 33 แถว · pcu 3 แถว) จึงลบได้ไม่กระทบของเก่า
  //    ⚠️ check constraint ในฐานยังยอมรับ 'ward' อยู่ (scripts/009) ตั้งใจคงไว้
  //       เผื่อวันหน้าอยากได้กลับมา จะได้แก้ที่ไฟล์นี้ไฟล์เดียวไม่ต้องแตะฐานอีก
  { key: 'home', label: 'เยี่ยมบ้าน' },
  { key: 'pcu', label: 'รพ.สต.' }
];

export const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export const PRESETS = [10, 30, 60, 90];

export function money(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ฿';
}

// ป้ายตัวเลขบนแท่งกราฟรายเดือน — ใช้ที่เดียวคือหน้าสรุป
//
// 🚨 เดิมปัดเป็นหลักพันทั้งหมด (`Math.round(n / 1000) + 'k'`)
//    3,499 กลายเป็น "3k" · 3,500 กลายเป็น "4k" — ห่างกันบาทเดียวแต่ป้ายต่างกัน 1,000 บาท
//    ผู้บริหารอ่านกราฟแล้วบวกเองในหัว ตัวเลขจะไม่ตรงกับยอดจริงที่รายงาน
//
// ยอดยาคืนต่อเดือนของโรงพยาบาลชุมชนอยู่หลักพันถึงหลักหมื่น จึงแสดงเลขเต็มถึงหลักแสน
// เกินหลักแสนค่อยย่อ (ป้ายจะยาวเกินความกว้างแท่ง) ซึ่งตอนนั้นคลาดเคลื่อนไม่ถึง 0.5%
export function compact(n) {
  const v = Math.round(n);
  if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
  if (v >= 100000) return Math.round(v / 1000) + 'k';
  return v.toLocaleString('en-US');
}

export function isoOf(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function thaiDate(iso) {
  const p = iso.split('-');
  return Number(p[2]) + ' ' + TH_MONTHS[Number(p[1]) - 1] + ' ' + (Number(p[0]) + 543);
}

// ปีงบประมาณไทย เริ่ม 1 ต.ค. → 30 ก.ย. · คืนเป็น พ.ศ.
export function fyOf(iso) {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  return (m >= 10 ? y + 1 : y) + 543;
}

// ── เพิ่มจากมอคอัป (มอคอัปไม่ต้องมี เพราะไม่มีฝั่งเซิร์ฟเวอร์) ────────────────
// นาฬิกาเซิร์ฟเวอร์เป็น UTC ถ้าใช้ตรง ๆ ช่วงหัวค่ำถึงเที่ยงคืนจะได้วันที่ย้อนหลังไป 1 วัน
export function todayISO() {
  const now = new Date();
  return isoOf(new Date(now.getTime() + (now.getTimezoneOffset() + 420) * 60000));
}

// ช่วงวันของปีงบที่ครอบวันที่ที่ให้มา — ใช้ส่งเข้า mr_summary()
export function fyRange(iso) {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const startYear = m >= 10 ? y : y - 1;
  return { from: startYear + '-10-01', to: (startYear + 1) + '-09-30' };
}
