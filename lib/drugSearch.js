// ══════════════════════════════════════════════════════════════════════════
//  ระบบค้นหายา — โมดูลอิสระ ยกไปใช้โปรเจกต์อื่นได้ทั้งไฟล์
// ══════════════════════════════════════════════════════════════════════════
//
// ไฟล์นี้ตั้งใจให้ "ก๊อปไปวางในโปรเจกต์อื่นแล้วใช้ได้เลย"
//   · ไม่พึ่ง React · ไม่พึ่ง Next.js · ไม่พึ่งไฟล์อื่นในโปรเจกต์นี้
//   · รับ array ของยาเข้าไป คืน array ที่จัดอันดับแล้วออกมา
//
// รับยาได้ 2 รูปแบบ — ตรวจให้เองอัตโนมัติ
//   แบบ ก (มูลค่ายาคืน)  { name: 'Metformin 500 mg', brand, abbrev }
//   แบบ ข (ME-DRP)       { generic: 'Metformin', strength: '500', unit: 'mg', brand, abbrev }
//   ช่องอื่นติดไปด้วยได้ ระบบไม่แตะ คืนกลับทั้ง object เดิม
//
// วิธีใช้
//   import { searchDrugs, moveHi } from '@/lib/drugSearch';
//   const results = searchDrugs(drugs, 'met', { limit: 14 });
//   const next = moveHi(hi, +1, results.length);   // ลูกศรลง (วนรอบ)
//
// ── ประวัติบั๊กที่แก้ไปแล้ว (อย่าทำซ้ำ) ────────────────────────────────────
// 🚨 10 ส.ค. 2569 — พิมพ์ "met" แล้ว Metformin ไม่ขึ้นเลย
//    ต้นเหตุ: เรียงตามความแรง "ข้ามยาคนละตัวกัน"
//      0.2 → 2.5 → 5 → 10 → 12.5 → 100 → 200 → 250 → 500(Metformin)
//    ตัดที่ 8 ตัว Metformin เลยตกขอบ ทั้งที่เป็นยาที่คืนบ่อยที่สุด
//    บทเรียน: ความแรงใช้เรียงได้เฉพาะ "ยาชื่อเดียวกัน" เท่านั้น

// ── แยกชื่อยาออกจากความแรง ────────────────────────────────────────────────
// "Enalapril 5 mg"                        → base: Enalapril · st: 5
// "Amoxicillin + Clavulanic acid (875 + 125 mg)" → base: ...acid · st: 875
//
// 🚨 วงเล็บต้องขึ้นต้นด้วยตัวเลขเท่านั้น ไม่งั้นจะไปจับวงเล็บที่ต่อท้ายชื่อยาซ้ำ
//    ("Ampicillin 250 mg (vial)") มาเป็นความแรงแทน
const NAME_SPLIT = /^(.*?)\s(\(\d[^)]*\)|\d[\d\w./+\-% ]*)$/;

export function splitName(name) {
  const full = String(name || '');
  const m = full.match(NAME_SPLIT);
  if (!m) return { base: full, strength: '' };
  return { base: m[1].trim(), strength: m[2].trim() };
}

// ตัวเลขความแรงตัวแรก ใช้เรียงยาชื่อเดียวกัน (5 mg มาก่อน 20 mg)
function firstNumber(text) {
  const m = String(text || '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

// ── รองรับยา 2 รูปแบบ ────────────────────────────────────────────────────
// บางโปรเจกต์เก็บชื่อยาเป็นก้อนเดียว (name) บางโปรเจกต์แยกช่อง (generic + strength)
// แยกไว้ตรงนี้จุดเดียว ที่เหลือในไฟล์ไม่ต้องรู้ว่ามาจากรูปแบบไหน
function nameOf(d) {
  return String(d.name != null ? d.name : (d.generic || ''));
}

// ชื่อยาโดยไม่เอาความแรง — ใช้จัดกลุ่มก่อนเรียง
function baseOf(d) {
  // แยกช่องอยู่แล้ว = generic คือชื่อฐานตรง ๆ ไม่ต้องแกะ
  if (d.name == null && d.generic) return String(d.generic).toLowerCase();
  return splitName(nameOf(d)).base.toLowerCase();
}

function strengthOf(d) {
  // แยกช่องอยู่แล้ว = อ่านจากช่องตรง ๆ แม่นกว่าแกะจากข้อความ
  if (d.strength != null && d.strength !== '') return firstNumber(d.strength);
  if (d.name == null) return Infinity;   // แยกช่องแต่ไม่มีความแรง
  return firstNumber(splitName(nameOf(d)).strength);
}

// ══════════════════════════════════════════════════════════════════════════
//  ลืมสลับแป้นพิมพ์ — แปลงไทยกลับเป็นอังกฤษให้อัตโนมัติ
// ══════════════════════════════════════════════════════════════════════════
//
// อาการ: ตั้งใจพิมพ์ "metformin" แต่แป้นค้างอยู่ที่ไทย → ได้ "ทำะดนพทรื"
//        ค้นไม่เจออะไรเลย ต้องลบทิ้งพิมพ์ใหม่ทั้งคำ
//
// ในห้องยาเวลารีบ ๆ เจอบ่อยมาก (พี่กันบอกว่า "ลืมเปลี่ยนภาษาตลอด")
//
// ⚠️ คนละเรื่องกับ "ตัวแปลงอักษรต่างด้าว" ของโปรเจกต์ HCV
//    อันนั้นแก้ตัวอักษรเพี้ยนจากการก๊อปข้อความมา (encoding พัง)
//    อันนี้คือแป้นพิมพ์คนละภาษา ตัวอักษรถูกต้องทุกตัว แค่ผิดภาษา
//
// ตารางนี้อิงแป้นเกษมณี (Kedmanee) ซึ่งเป็นแป้นไทยมาตรฐานของ Windows
const TH_TO_EN = {
  'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']',
  'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': "'",
  'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
  // แถวที่ต้องกด Shift
  '๐': 'Q', '"': 'W', 'ฎ': 'E', 'ฑ': 'R', 'ธ': 'T', 'ํ': 'Y', '๊': 'U', 'ณ': 'I', 'ฯ': 'O', 'ญ': 'P', 'ฐ': '{',
  'ฤ': 'A', 'ฆ': 'S', 'ฏ': 'D', 'โ': 'F', 'ฌ': 'G', '็': 'H', '๋': 'J', 'ษ': 'K', 'ศ': 'L', 'ซ': 'V',
  '(': 'Z', ')': 'X', 'ฉ': 'C', 'ฮ': 'B', 'ฺ': 'N', '์': 'M', '?': 'M', 'ฒ': '<', 'ฬ': '>', 'ฦ': '?'
};

// มีตัวอักษรไทยปนอยู่ไหม
function hasThai(s) {
  return /[฀-๿]/.test(s);
}

// แปลงข้อความที่พิมพ์ตอนแป้นค้างภาษาไทย กลับเป็นอังกฤษ
//   "ทำะดนพทรื" → "metformin"
// ตัวไหนแปลงไม่ได้คงไว้ตามเดิม (ตัวเลข ช่องว่าง เครื่องหมาย)
export function thaiToEnglish(text) {
  let out = '';
  for (const ch of String(text || '')) {
    out += TH_TO_EN[ch] != null ? TH_TO_EN[ch] : ch;
  }
  return out;
}

// ── ค้นหา + จัดอันดับ ─────────────────────────────────────────────────────
//
// ลำดับการจัดอันดับ (ก่อน → หลัง)
//   1. เจอที่ต้นชื่อ มาก่อนเจอกลางชื่อ      (พิมพ์ met → Metformin ก่อน Dexamethasone)
//   2. ตำแหน่งที่เจอ ยิ่งต้น ยิ่งมาก่อน
//   3. ชื่อยาตามตัวอักษร                    ← กันความแรงเรียงข้ามยาคนละตัว
//   4. ความแรงน้อย → มาก                    เฉพาะยาชื่อเดียวกัน
//
// เจอในชื่อการค้าจัดอันดับรองจากชื่อสามัญเสมอ (ถ่วงด้วยตำแหน่ง 900+)
// ── พิมพ์หลายคำได้ ────────────────────────────────────────────────────────
// "amox clav" → ["amox","clav"] → ชื่อไหนมีครบทุกคำ = เจอ (ไม่สนลำดับ)
// เดิมต้องพิมพ์ติดกันเป๊ะ "amox clav" จึงไม่เจอ Amoxicillin + Clavulanic acid เลย
// (Google · PubMed · Algolia ค้นแบบนี้กันหมด)
//
// คำเดียว = ทำงานเหมือนเดิมทุกประการ ไม่มีอะไรเปลี่ยน
function matchOne(d, tokens) {
  const name = nameOf(d).toLowerCase();
  const brand = String(d.brand || '').toLowerCase();
  // ตัวย่อที่เภสัชกรใช้เรียกกันจริง (CPM · HCTZ · INH) — เก็บได้หลายค่าคั่นด้วยเว้นวรรค
  const abbrev = String(d.abbrev || '').toLowerCase();

  // ทุกคำต้องอยู่ในชื่อยา ชื่อการค้า หรือตัวย่อ ขาดคำเดียวก็ไม่นับ
  for (const t of tokens) {
    if (name.indexOf(t) < 0 && brand.indexOf(t) < 0 && abbrev.indexOf(t) < 0) return -1;
  }

  // ตำแหน่งที่ใช้จัดอันดับ = ตำแหน่งของคำแรก
  //   เจอในชื่อสามัญ  → ใช้ตำแหน่งจริง (0 = ต้นชื่อ มาก่อนสุด)
  //   เจอในตัวย่อ     → ถ่วง 500 · พิมพ์ cpm ต้องได้ Chlorpheniramine ก่อนยาที่มี cpm กลางชื่อ
  //   เจอในชื่อการค้า → ถ่วง 900 · รองสุด
  const first = tokens[0];
  const inName = name.indexOf(first);
  if (inName >= 0) return inName;

  const inAbbrev = abbrev.indexOf(first);
  if (inAbbrev >= 0) return 500 + inAbbrev;

  return 900 + brand.indexOf(first);
}

// ── ลำดับรูปแบบยา ────────────────────────────────────────────────────────────
// ยาชื่อเดียวกันที่มีหลายรูปแบบ ให้จัดกลุ่มตามรูปแบบก่อนแล้วค่อยเรียงความแรงในกลุ่ม
// เหตุผล: เวลารับยาคืน สิ่งแรกที่เห็นในมือคือรูปของยา (เม็ด ขวด หลอด) ไม่ใช่ตัวเลขความแรง
// เรียงจากที่เจอบ่อยสุดในห้องยาไปหาที่เจอน้อย — ยากินก่อน แล้วยาฉีด แล้วยาใช้ภายนอก
// รูปแบบที่ไม่อยู่ในรายการนี้ไปต่อท้ายสุด (เรียงตามตัวอักษรกันเอง)
const FORM_ORDER = [
  'tab', 'cap',                                        // ยากินชนิดแข็ง
  'syrup', 'suspension', 'solution', 'elixir', 'oil', 'sachet', 'powder',  // ยากินชนิดน้ำ/ผง
  'injection', 'vial', 'amp', 'prefilled syringe', 'prefilled pen',        // ยาฉีด
  'nebule', 'MDI', 'inhaler', 'turbuhaler', 'spray',   // ยาพ่น
  'eye drops', 'drops',                                // ยาหยอด
  'cream', 'ointment', 'gel', 'paste', 'lotion', 'emulsion',  // ยาใช้ภายนอก
  'patch', 'suppository', 'implant'                    // อื่น ๆ
];
const FORM_RANK = new Map(FORM_ORDER.map((f, i) => [f, i]));
function formOf(d) {
  const f = String(d.form || '').trim();
  const r = FORM_RANK.get(f);
  return r === undefined ? FORM_ORDER.length : r;
}

function runSearch(drugs, query, limit, hot) {
  const q = String(query || '').trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const hit = [];
  for (const d of drugs || []) {
    if (d.hidden === true) continue;
    const at = matchOne(d, tokens);
    if (at < 0) continue;

    hit.push({
      d: d,
      starts: at === 0 ? 0 : 1,
      at: at,
      // ยาที่คืนบ่อย = 0 (ขึ้นก่อน) · ยาทั่วไป = 1
      hot: hot && hot.has(d.id) ? 0 : 1,
      base: baseOf(d),
      form: formOf(d),
      st: strengthOf(d)
    });
  }

  hit.sort((a, b) =>
    a.starts - b.starts ||
    a.at - b.at ||
    a.hot - b.hot ||     // ยาที่คืนบ่อยลอยขึ้นก่อน — แต่แพ้ตำแหน่งที่เจอเสมอ
    a.base.localeCompare(b.base) ||
    a.form - b.form ||   // ยาชื่อเดียวกันจัดกลุ่มตามรูปแบบ (เม็ด → น้ำ → ฉีด → ทา)
    a.st - b.st ||
    nameOf(a.d).localeCompare(nameOf(b.d))
  );

  const out = hit.map((h) => h.d);
  return limit > 0 ? out.slice(0, limit) : out;
}

// opts
//   limit    จำนวนที่คืน (0 = ไม่จำกัด · ค่าเริ่มต้น 14)
//   minLen   พิมพ์อย่างน้อยกี่ตัวถึงเริ่มค้น (ค่าเริ่มต้น 2)
//   hotIds   รหัสยาที่ใช้บ่อย ให้ลอยขึ้นก่อนเมื่อคะแนนอื่นเท่ากัน
//            (โปรเจกต์นี้ส่งยาที่ถูกคืนบ่อยที่สุดเข้ามา)
// คืนทั้งผลลัพธ์และ "คำที่ใช้ค้นจริง"
//   { list, used, swapped }
//     list    = ผลลัพธ์
//     used    = คำที่ระบบใช้ค้นจริง (ถ้าแปลงแป้นแล้วจะเป็นคำอังกฤษ)
//     swapped = true เมื่อระบบแปลงแป้นให้
//
// 🚨 หน้าจอต้องใช้ `used` ไปไฮไลต์ในชื่อยา ไม่ใช่คำที่ผู้ใช้พิมพ์
//    ไม่งั้นพิมพ์ "ทำะดน" แล้วเจอ Metformin แต่ชื่อยาไม่ไฮไลต์อะไรเลย
//    เพราะ "ทำะดน" ไม่มีอยู่ในคำว่า Metformin สักตัว (พี่กันแจ้ง 10 ส.ค. 2569)
export function searchDrugsEx(drugs, query, opts) {
  const o = opts || {};
  const limit = o.limit == null ? 14 : o.limit;
  const minLen = o.minLen == null ? 2 : o.minLen;
  const raw = String(query || '').trim();
  if (raw.length < minLen) return { list: [], used: raw, swapped: false };

  const hot = o.hotIds && o.hotIds.length ? new Set(o.hotIds) : null;

  const out = runSearch(drugs, raw, limit, hot);
  if (out.length) return { list: out, used: raw, swapped: false };

  // ── ทางหนี: ลืมสลับแป้นพิมพ์ ───────────────────────────────────────────
  // หาไม่เจอเลย + มีตัวอักษรไทยปน = น่าจะพิมพ์อังกฤษตอนแป้นค้างที่ไทย
  // แปลงกลับแล้วลองใหม่ให้เงียบ ๆ ผู้ใช้ไม่ต้องลบพิมพ์ใหม่
  if (hasThai(raw)) {
    const fixed = thaiToEnglish(raw);
    if (fixed !== raw) {
      const alt = runSearch(drugs, fixed, limit, hot);
      if (alt.length) return { list: alt, used: fixed, swapped: true };
    }
  }

  return { list: out, used: raw, swapped: false };
}

// รุ่นย่อ คืนแค่ผลลัพธ์ — ใช้ตอนไม่สนว่าระบบแปลงคำให้หรือเปล่า
export function searchDrugs(drugs, query, opts) {
  return searchDrugsEx(drugs, query, opts).list;
}

// ── เลื่อนตัวที่ไฮไลต์ด้วยลูกศร (วนรอบ) ───────────────────────────────────
//
// ทำตามแบบ ME-DRP ที่พี่กันชี้ให้ดู
//   · ลงจากตัวสุดท้าย → วนกลับตัวแรก
//   · ขึ้นจากตัวแรก   → วนไปตัวสุดท้าย
//   · ยังไม่ได้ชี้ตัวไหน (-1) กดขึ้นครั้งแรก → ไปตัวสุดท้ายเลย (ดูตัวท้ายเร็ว)
//
// คืน -1 ถ้าไม่มีผลลัพธ์ (ไม่มีอะไรให้ชี้)
export function moveHi(current, delta, total) {
  if (!total || total < 1) return -1;
  if (current < 0) return delta > 0 ? 0 : total - 1;
  let next = current + delta;
  if (next < 0) next = total - 1;
  if (next >= total) next = 0;
  return next;
}

// ── ตัดข้อความเป็น 3 ท่อนไว้ทำไฮไลต์คำค้น ────────────────────────────────
//   markMatch('Metformin', 'met') → ['', 'Met', 'formin']
export function markMatch(text, query) {
  const t = String(text || '');
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [t, '', ''];
  const i = t.toLowerCase().indexOf(q);
  if (i < 0) return [t, '', ''];
  return [t.slice(0, i), t.slice(i, i + q.length), t.slice(i + q.length)];
}
