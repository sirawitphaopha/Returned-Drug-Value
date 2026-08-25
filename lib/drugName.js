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
  // ── ยาสูตรผสม ครอบวงเล็บให้ความแรง ───────────────────────────────────────
  // ชื่อยาผสมมี " + " อยู่แล้ว พอต่อความแรงที่มี " + " อีก จะได้บรรทัดที่มี
  // เครื่องหมายบวกสองที่ ตาแยกไม่ออกว่าตรงไหนชื่อยา ตรงไหนความแรง
  //   ❌ Ampicillin + Sulbactam 2 + 1 g
  //   ✅ Ampicillin + Sulbactam (2 + 1 g)
  // ME-DRP ทำแบบนี้มาตลอด (lib/helpers.ts → drugFlatLine) พี่กันชี้ให้ดู 10 ส.ค. 2569
  // ความแรงเป็นข้อมูลความปลอดภัย อ่านผิดตัวไม่ได้ · ในฐานมียาผสม 49 ตัว
  let sv = [t(d.strength), t(d.unit)].filter(Boolean).join(' ');
  if (sv && t(d.strength).indexOf('+') >= 0) sv = '(' + sv + ')';

  const parts = [t(d.generic), sv].filter(Boolean);
  // ── ความเข้มข้นเป็น % ────────────────────────────────────────────────────
  // 🚨 เดิมเขียนว่า "แสดง % เฉพาะตอนที่ไม่มีความแรงและหน่วยเลย"
  //    ยาทา/ยาหยอดส่วนใหญ่มีทั้ง strength และ % (Chlortetracycline 10 mg/1 g = 1%)
  //    % เลยถูกข้ามไปหมด ทั้งที่ในฐานกรอกไว้แล้ว 18 ตัว (พี่กันทัก 10 ส.ค. 2569)
  //    ME-DRP แสดงทั้งสองอย่างมาตลอด เว็บนี้ต้องตรงกัน
  // เภสัชกรบางคนคุ้น mg/mL บางคนคุ้น % (ยาทา ยาหยอดตา) จึงโชว์ทั้งคู่
  if (t(d.percent)) parts.push(t(d.percent) + '%');

  // ── รูปแบบการออกฤทธิ์ (ER · IR · SR) ─────────────────────────────────────
  // 🚨 ข้อมูลนี้มีในฐานมาตลอดแต่ไม่เคยถูกแสดงเลย (พี่กันทัก 10 ส.ค. 2569)
  //    อันตรายที่สุดในบรรดาช่องที่หายไป เพราะ
  //      Morphine sulfate 10 mg ER = ออกฤทธิ์ 12 ชั่วโมง
  //      Morphine sulfate 10 mg    = ออกฤทธิ์ 4 ชั่วโมง
  //    และในคลังมี Sodium valproate 200 mg ทั้ง ER และ IR
  //    ซึ่งเดิมแสดงเป็นชื่อเดียวกันทุกตัวอักษร แยกไม่ออกเลย
  //
  // 🚨 ต้องอยู่ใน "ชื่อ" ไม่ใช่แค่ป้ายบนจอ เพราะชื่อถูกแช่ลง mr_return ตอนบันทึก
  //    ถ้าเก็บแค่ชื่อธรรมดา เปิดประวัติย้อนหลังจะไม่รู้ว่าตัวไหนเป็น ER
  //    (ฝั่งจอแยกออกมาทาสีต่างหากด้วย splitRelease ใน helpers.js)
  if (t(d.release)) parts.push(t(d.release));

  return parts.join(' ') || ('ยา #' + d.id);
}

// ต่อท้ายทีละชั้นจนกว่าจะไม่ซ้ำกับใคร
//
// 🚨 ชั้นแรกมีรูปแบบยา (form) ติดมาด้วยเสมอ ไม่ใช่เฉพาะตัวที่ชื่อซ้ำ
//    พี่กันสั่ง 25 ส.ค. 2569: "ชื่อยาที่แสดง ใส่แบบเต็มยศ ไม่งั้นถ้าเก็บทั้งยากินกับฉีด
//    มันแยกไม่ออกเลย"
//
//    เดิมชั้นแรกเป็นชื่อเปล่า ๆ แล้วค่อยเติม form ให้เฉพาะคู่ที่ชนกัน (6 คู่ในคลัง)
//    ผลคือ "Amitriptyline 10 mg" กับ "Ceftriaxone 1 g" หน้าตาเหมือนกันหมด
//    ทั้งที่ตัวหนึ่งกินตัวหนึ่งฉีด — บนใบสรุปที่พิมพ์ออกมาแยกไม่ออกเลยว่าอันไหนเป็นอันไหน
//
// ⚠️ ชื่อถูกแช่ลง mr_return.drug_name ตอนบันทึก → แถวที่บันทึกไปแล้วยังเป็นชื่อเดิม
//    ไม่ใช่บั๊ก แต่เป็นกฎแช่ข้อมูล (แถวเก่าต้องคงหน้าตา ณ วันที่บันทึกไว้)
//    Top 10 หน้าสรุปจับกลุ่มด้วย drug_id ไม่ใช่ชื่อ (008_group_by_drug_id.sql) จึงไม่กระทบ
const LEVELS = [
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
