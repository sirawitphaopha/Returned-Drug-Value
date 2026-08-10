// ค่าคงที่ + ฟังก์ชันแปลงรูปแบบตัวเลข/วันที่
// คัดจากมอคอัป (Med Return App.dc.html บรรทัด 741–786) ตัวต่อตัว — ห้ามแก้สูตร
// ตัดออกแค่ของเดโม: DEMO_VERSION · demoIsStale · demoSession · mulberry · buildDemo

export const SOURCES = [
  { key: 'opd', label: 'OPD ทั่วไป' },
  { key: 'ncd', label: 'OPD NCD' },
  { key: 'ward', label: 'หอผู้ป่วย' },
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
