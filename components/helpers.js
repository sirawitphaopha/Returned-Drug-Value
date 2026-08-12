// ตัวช่วยกลางของทั้งแอป — ห้ามพึ่งไฟล์อื่นในโฟลเดอร์ components (กันวนกันเอง)

// ── s() แปลงข้อความ CSS เป็น object ของ React ────────────────────────────────
// มอคอัปมีสไตล์ฝังในแท็กประมาณ 600 จุด ถ้าแปลงด้วยมือทีละจุดจะเพี้ยนแน่นอน
// ใส่ฟังก์ชันนี้แล้วก๊อปข้อความ CSS มาทั้งดุ้น → โค้ดใหม่เทียบกับต้นฉบับได้ตรง ๆ
// และ "ไม่มีรหัสสีไหนถูกแตะเลย"
//
// อย่างเดียวที่แปลงระหว่างทาง: ชื่อฟอนต์ → ชี้ไปฟอนต์ที่ฝังไว้ตอน build (next/font)
// เพราะเว็บจริงเสิร์ฟฟอนต์เอง ไม่ได้โหลดจาก Google เหมือนมอคอัป

const cache = new Map();

function fontify(css) {
  return css
    .replace(/'IBM Plex Sans Thai'/g, "var(--font-plex),'IBM Plex Sans Thai'")
    .replace(/\bSarabun\b/g, 'var(--font-sarabun),Sarabun');
}

// ตัดที่ ; แต่ไม่ตัดถ้าอยู่ในวงเล็บหรือในเครื่องหมายคำพูด
// (สีไล่ระดับกับ url() มีวงเล็บซ้อน ตัดมั่วแล้วสีจะหาย)
function splitDecls(text) {
  const out = [];
  let depth = 0, quote = '', buf = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { buf += c; if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

function camel(prop) {
  if (prop.slice(0, 2) === '--') return prop;
  return prop.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function s(css) {
  const hit = cache.get(css);
  if (hit) return hit;

  const out = {};
  for (const part of splitDecls(fontify(css))) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const prop = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    if (!prop || !val) continue;
    out[camel(prop)] = val;
  }

  Object.freeze(out);
  cache.set(css, out);
  return out;
}

// ต่อสไตล์คงที่เข้ากับสไตล์ที่เปลี่ยนตามข้อมูล เช่น s('...') กับ {background: bg}
export function sx(css, extra) {
  return extra ? Object.assign({}, s(css), extra) : s(css);
}

// ── kb() ทำให้ปุ่มกดด้วยคีย์บอร์ดได้ ─────────────────────────────────────────
// มอคอัปทำปุ่มทุกอันเป็น <div onClick> (ทั้งเว็บมี 107 จุด) ซึ่งมีปัญหา 2 อย่าง
//   1. Tab ไม่ถึง — หน้าบันทึกกด Tab ได้แค่ 4 ชิ้น ทั้งที่กดด้วยเมาส์ได้ 15 ชิ้น
//      กรอกยาครบแล้วต้องปล่อยแป้นพิมพ์ไปคว้าเมาส์กดบันทึกทุกรอบ
//   2. โปรแกรมอ่านหน้าจอไม่รู้ว่าเป็นปุ่ม
//
// ใช้แทน onClick ตรง ๆ:  <div {...kb(V.save)} style={...}>
// ได้ครบทีเดียว — กดเมาส์ได้เหมือนเดิม · Tab ถึง · Enter กับ Space ใช้ได้
//
// 🚨 Space ต้อง preventDefault ไม่งั้นหน้าจะเลื่อนลงไปด้วยตอนกด
export function kb(fn) {
  return {
    onClick: fn,
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (fn) fn(e);
    }
  };
}

// ── ข้อมูลที่เก็บไว้ในเครื่อง ─────────────────────────────────────────────────
export const LS = {
  draft: 'mrv.session',     // แถวที่กองอยู่ ยังไม่กดบันทึก — หายเมื่อบันทึกสำเร็จ
  dark: 'mrv.dark',
  drugs: 'mrv.drugs',       // แคชรายการยา
  setting: 'mrv.setting'    // แคชการตั้งค่าห้องยา
};

export const CACHE_TTL = 12 * 60 * 60 * 1000;   // 12 ชั่วโมง

export function readLS(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

export function clearLS(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// แคชที่มีวันหมดอายุ — คืน null ถ้าเกิน TTL
// age ติดลบ = นาฬิกาเครื่องเดินผิด (คอมเก่าถ่าน BIOS หมด เจอบ่อยในโรงพยาบาล)
// ถ้าไม่กันไว้ แคชจะไม่มีวันหมดอายุ รายการยาค้างชุดเดิมตลอดไป
export function readCache(key) {
  const box = readLS(key);
  if (!box || typeof box.ts !== 'number') return null;
  const age = Date.now() - box.ts;
  if (age < 0 || age > CACHE_TTL) return null;
  return box.v;
}

export function writeCache(key, v) {
  writeLS(key, { ts: Date.now(), v: v });
}

// ── ตัวช่วยกลางฝั่งเบราว์เซอร์ ────────────────────────────────────────────────

// crypto.randomUUID มีเฉพาะ https กับ localhost — เปิดเว็บผ่าน http://192.168.x.x
// (เทสจากมือถือในวงแลนโรงพยาบาล) จะเป็น undefined แล้วปุ่มบันทึกตายเงียบ
export function newUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// เน็ตโรงพยาบาลแบบ "ต่ออยู่แต่ไม่ไปไหน" จะทำให้ fetch ไม่ throw ไม่ resolve
// ปุ่มค้างว่ากำลังบันทึกตลอดกาล — ต้องมีตัวจับเวลาตัดทุกเส้น
export async function fetchT(url, opts, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms || 15000);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ac.signal }));
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('เชื่อมต่อนานเกินไป ลองใหม่อีกครั้ง');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export const MAX_QTY = 100000;   // ต้องตรงกับ app/api/returns/route.js

// ── แยกชื่อยาเป็น "ชื่อ" กับ "ความแรง" ──────────────────────────────────────
// ชื่อในคลังเป็นพืดเดียว เช่น "Enalapril 5 mg" หรือ "Amoxicillin + Clavulanic acid 875 + 125 mg"
// แยกออกมาเพื่อให้ตาไล่อ่านง่าย — ชื่อตัวหนาเข้ม ความแรงตัวเบากว่า
//
// ⚠️ ต้องยอมให้ + และ - อยู่ในกลุ่มความแรงด้วย ไม่งั้นยาสูตรผสมจะแยกผิดจุด
//    ("Amoxicillin + Clavulanic acid 875 +" / "125 mg" — มี + ห้อยท้ายชื่อ)
export function splitDrugName(name) {
  const full = String(name || '');
  // ต้องยอมให้ % อยู่ในกลุ่มความแรงด้วย ไม่งั้นยาที่มีความเข้มข้นเป็น %
  // ("Chlortetracycline 10 mg/1 g 1%") จะแยกไม่ออก แล้วชื่อไปกองรวมเป็นก้อนเดียว
  // ยาสูตรผสมมีความแรงอยู่ในวงเล็บ "(2 + 1 g)" ต้องรับด้วย
  // 🚨 ในวงเล็บต้องขึ้นต้นด้วยตัวเลขเท่านั้น ไม่งั้นจะไปจับวงเล็บที่ต่อท้ายชื่อยาซ้ำ
  //    ("Ampicillin 250 mg (vial)") มาเป็นความแรงแทน
  const m = full.match(/^(.*?)\s(\(\d[^)]*\)|\d[\d\w./+\-% ]*)$/);
  if (!m) return { base: full, strength: '' };
  return { base: m[1].trim(), strength: m[2].trim() };
}

// แยกความเข้มข้น % ออกจากท้ายข้อความ เพื่อเอาไปใส่วงเล็บและทาสีต่างหาก (พี่กันขอ)
//   "10 mg/1 g 1%" → { main: "10 mg/1 g", percent: "1%" }
// ทำเป็นตัวกลางเพราะใช้ทั้งผลค้นหาหน้าบันทึกและหน้าตั้งราคายา
export function splitPercent(text) {
  const s = String(text || '').trim();
  const m = s.match(/^(.*?)\s*(\d[\d.]*%)$/);
  if (!m) return { main: s, percent: '' };
  return { main: m[1].trim(), percent: m[2] };
}

// ── แยกรูปแบบการออกฤทธิ์ออกจากท้ายข้อความ ──────────────────────────────────
//   "10 mg ER" → { main: "10 mg", release: "ER" }
//
// 🚨 ข้อมูลความปลอดภัยระดับสูงสุดในบรรทัดชื่อยา
//    ER (ออกฤทธิ์นาน) กับ IR (ออกฤทธิ์ทันที) เป็นคนละยากันโดยสิ้นเชิง
//    Morphine 10 mg ER กิน 2 ครั้ง/วัน · Morphine 10 mg IR กิน 6 ครั้ง/วัน
//    สลับกันแล้วอันตรายถึงชีวิต จึงต้องทาสีให้สะดุดตาแยกจากตัวอื่น
//
// รับเฉพาะรหัสมาตรฐานที่รู้จัก ไม่ใช่ทุกคำท้ายชื่อ
// ไม่งั้นยาที่ลงท้ายด้วยตัวย่ออื่นจะโดนตัดมั่ว
export function splitRelease(text) {
  const s = String(text || '').trim();
  const m = s.match(/^(.*?)\s(ER|IR|SR|XR|CR|LA|MR|XL)$/);
  if (!m) return { main: s, release: '' };
  return { main: m[1].trim(), release: m[2] };
}

// ตัดข้อความเป็น 3 ท่อน [ก่อน, ที่ตรงกับคำค้น, หลัง] ไว้ทำไฮไลต์
// (ME-DRP ก็ไฮไลต์คำค้นแบบนี้ในตัวเลือกยา)
export function markMatch(text, q) {
  const t = String(text || '');
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) return [t, '', ''];
  const i = t.toLowerCase().indexOf(needle);
  if (i < 0) return [t, '', ''];
  return [t.slice(0, i), t.slice(i, i + needle.length), t.slice(i + needle.length)];
}

// เหตุผลการทำลาย — ผู้บริหารถามว่า "ที่ทำลายไป 40,000 บาท เพราะอะไร"
// เดิมระบบเก็บแค่ว่า "ทำลาย" ตอบไม่ได้เลย
export const DESTROY_REASONS = [
  'หมดอายุ',
  'แกะจากซองเดิม',
  'สภาพเปลี่ยน',
  'ไม่ทราบแหล่งที่มา',
  'อื่น ๆ'
];

// จำนวนรับทศนิยม 2 ตำแหน่ง — ยาน้ำคืนมาครึ่งขวด ยาแบ่งครึ่งเม็ด
// กันจุดซ้ำ กันติดลบ กันทศนิยมเกิน 2 ตำแหน่ง แต่ยอมให้พิมพ์ "2." ค้างไว้ระหว่างพิมพ์
export function cleanQty(raw) {
  let v = String(raw == null ? '' : raw).replace(/[^0-9.]/g, '');
  const first = v.indexOf('.');
  if (first >= 0) v = v.slice(0, first + 1) + v.slice(first + 1).replace(/\./g, '');
  const dot = v.indexOf('.');
  if (dot >= 0) v = v.slice(0, dot + 3);
  return v;
}

// แปลงข้อความในช่องเป็นตัวเลขจริง ปัดเหลือ 2 ตำแหน่ง
export function qtyNum(raw) {
  const n = Math.round((parseFloat(raw || '0') || 0) * 100) / 100;
  return n > 0 ? Math.min(MAX_QTY, n) : 0;
}

// แสดงจำนวนบนจอ — จำนวนเต็มไม่ต้องโชว์ .00 (30 เม็ด ไม่ใช่ 30.00 เม็ด)
export function qtyText(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : String(v);
}

export const APP_VERSION = '0.6.0.0';
