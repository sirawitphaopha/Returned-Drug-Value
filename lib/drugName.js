// ประกอบชื่อยาที่โชว์บนหน้าเว็บ
//
// มอคอัปมีช่อง name ช่องเดียวแบบ 'Amlodipine 5 mg' แต่ตาราง drugs แยกเป็น
// generic / strength / unit / percent → ต้องต่อกันเอง
//
// ⚠️ ในฐานมียาที่ต่อแล้วชื่อซ้ำกัน 6 คู่ ถ้าปล่อยซ้ำจะเกิด 2 ปัญหา:
//    ค้นแล้วเลือกผิดตัว · Top 10 ในหน้าสรุปจับกลุ่มด้วยชื่อ ยาคนละตัวจะถูกรวมเป็นก้อนเดียว
//    จึงต่อท้ายด้วยตัวที่ต่างกันเท่าที่จำเป็น: form ก่อน แล้วค่อย release แล้วค่อยเลข id

const t = (v) => (v == null ? '' : String(v).trim());

function baseName(d) {
  const parts = [t(d.generic), t(d.strength), t(d.unit)].filter(Boolean);
  // ยาทาบางตัวมีแต่ % ไม่มีความแรง เช่น Sodium bicarbonate (หยอดหู) 3%
  if (!t(d.strength) && !t(d.unit) && t(d.percent)) parts.push(t(d.percent) + '%');
  return parts.join(' ') || ('ยา #' + d.id);
}

// ต่อท้ายทีละชั้นจนกว่าจะไม่ซ้ำกับใคร
const LEVELS = [
  (d, base) => base,
  (d, base) => (t(d.form) ? base + ' (' + t(d.form) + ')' : base),
  (d, base) => base + ' (' + [t(d.form), t(d.release)].filter(Boolean).join(' ') + ')',
  (d, base) => base + ' (#' + d.id + ')'
];

// rows = แถวจาก drugs (join กับ mr_drug_price แล้ว) → คืน Map ของ id → ชื่อที่โชว์
export function buildDrugNames(rows) {
  const out = new Map();
  const bases = new Map();
  let pending = [];

  for (const d of rows) {
    const own = t(d.display_name);
    if (own) { out.set(d.id, own); continue; }   // ตั้งชื่อเองแล้ว ใช้ตามนั้น
    bases.set(d.id, baseName(d));
    pending.push(d);
  }

  for (let lv = 0; lv < LEVELS.length && pending.length; lv++) {
    const named = pending.map((d) => ({ d, name: LEVELS[lv](d, bases.get(d.id)) }));
    const seen = new Map();
    for (const x of named) seen.set(x.name, (seen.get(x.name) || 0) + 1);

    const next = [];
    for (const x of named) {
      if (seen.get(x.name) === 1) out.set(x.d.id, x.name);
      else next.push(x.d);
    }
    pending = next;
  }

  // ชั้นสุดท้ายมีเลข id อยู่แล้ว ซ้ำไม่ได้ — บรรทัดนี้กันเหนียวเฉย ๆ
  for (const d of pending) out.set(d.id, LEVELS[LEVELS.length - 1](d, bases.get(d.id)));

  return out;
}
