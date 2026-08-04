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
export function readCache(key) {
  const box = readLS(key);
  if (!box || typeof box.ts !== 'number') return null;
  if (Date.now() - box.ts > CACHE_TTL) return null;
  return box.v;
}

export function writeCache(key, v) {
  writeLS(key, { ts: Date.now(), v: v });
}

export const APP_VERSION = '0.1.0.0';
