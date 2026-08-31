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
    // 🚨 พี่กันสั่ง 26 ส.ค. 2569: "ในเว็บ ฟอนต์ไม่มีหัว เปลี่ยนเป็นมีหัวให้หมดนะ"
    //    IBM Plex Sans Thai เป็นฟอนต์ไม่มีหัว (loopless) อ่านภาษาไทยยากกว่าแบบมีหัว
    //    ไล่เปลี่ยนในไฟล์หน้าจอครบ 115 จุดแล้ว บรรทัดนี้เหลือไว้เป็นตาข่ายกันตกหล่น
    //    ถ้ามีจุดไหนหลุดรอด หรือมีคนเผลอเขียนกลับมาใหม่ ก็ยังได้ฟอนต์มีหัวอยู่ดี
    .replace(/'IBM Plex Sans Thai'/g, "Sarabun")
    // ฟอนต์ของ "ชื่อเว็บ" ต้องแปลงก่อน Sarabun เพราะเป็นคนละตัวกัน
    .replace(/\bCharmonman\b/g, 'var(--font-charmonman),Charmonman')
    // 🚨 หน้าเว็บใช้ Sarabun · TH Sarabun New ใช้เฉพาะตอนพิมพ์เอกสารเท่านั้น
    //    พี่กันเคาะ 26 ส.ค. 2569: "หน้าเว็บทั้งหมด เอากลับเป็น Sarabun จาก Google และฝังเลย
    //    ส่วน Sarabun New ยังเอาอยู่ แต่จะฝังใน PDF แค่จุดเดียวเท่านั้น"
    //
    //    เคยลองใช้ฟอนต์ราชการทั้งเว็บแล้วถอยกลับ — มันออกแบบมาสำหรับกระดาษ
    //    ตัวเล็กและเส้นบาง อ่านบนจอคอมห้องยาที่แสงจ้าได้ยากกว่า Sarabun
    //    การสลับฟอนต์เฉพาะตอนพิมพ์อยู่ใน @media print ของ globals.css จุดเดียว
    // 🔤 ฟอนต์อังกฤษกับตัวเลขมาก่อน Sarabun เสมอ (พี่กันสั่ง 27 ส.ค. 2569 · ท่าเดียวกับ HCV)
    //    เบราว์เซอร์ไล่ตามลำดับ — ตัวไหนมีในฟอนต์แรกใช้ตัวนั้น ไม่มีก็ตกมาตัวถัดไป
    //    Roboto Mono ไม่มีตัวอักษรไทย ภาษาไทยจึงได้ Sarabun เหมือนเดิมทุกตัว
    //    ผู้ใช้เลือก "แบบปกติ" ได้ในหน้าตั้งค่า แล้ว --font-en จะชี้กลับมาที่ Sarabun
    .replace(/\bSarabun\b/g, 'var(--font-en),var(--font-sarabun),Sarabun');
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
  // 🚨 คีย์นี้เป็นของรุ่นเก่า ไม่มีใครเขียนแล้ว เหลือไว้ย้ายของเก่าเข้าคีย์ใหม่ครั้งเดียว
  //    ร่างรุ่นใหม่แยกรายหน้าต่าง คีย์เป็น mrv.session.<รหัสหน้าต่าง> (ดู draftKeyOf)
  draftOld: 'mrv.session',
  dark: 'mrv.dark',
  drugs: 'mrv.drugs',       // แคชรายการยา
  setting: 'mrv.setting',   // แคชการตั้งค่าห้องยา
  enFont: 'mrv.enfont',     // ฟอนต์ตัวอักษรอังกฤษและตัวเลข ('mono' หรือ 'thai')
  // ชื่อเครื่องที่ผู้ใช้เลือกตอนเปิดเว็บครั้งแรก (พี่กันสั่ง 31 ส.ค. 2569)
  // 🚨 เก็บในที่เก็บถาวร ไม่ใช่ที่เก็บของแท็บ — เครื่องเดียวกันทุกหน้าต่างต้องได้ชื่อเดียวกัน
  device: 'mrv.device'
};

export const CACHE_TTL = 12 * 60 * 60 * 1000;   // 12 ชั่วโมง

// ── ร่างของแต่ละหน้าต่าง แยกขาดจากกัน ─────────────────────────────────────
//
// พี่กันสั่ง 31 ส.ค. 2569:
//   "ที่กรอก 100 เครื่องก็ต้องแยกกัน และกรอกโครมเดียวกัน แต่คนละคนต้องแยกกัน
//    ให้ทุกอย่างมันเอกเทศกัน"
//
// ปัญหาเดิม: ร่างที่กรอกค้างมีก้อนเดียวใช้ร่วมทั้งเครื่อง (คีย์ mrv.session)
// ทุกหน้าต่างเขียนทับกล่องใบเดียวกัน จึงเกิด 2 อย่างนี้เสมอเมื่อเปิดมากกว่าหนึ่งหน้าต่าง
//   1. ยาที่หน้าต่างหนึ่งเพิ่งเพิ่ม หายไปเงียบ ๆ เมื่ออีกหน้าต่างแตะอะไรก็ตาม
//   2. กดบันทึกจากสองหน้าต่าง ยาชุดเดียวกันเข้าฐานสองรอบ มูลค่าถูกนับซ้ำ
//
// ตอนนี้แต่ละหน้าต่างมีร่างของตัวเอง คีย์เป็น mrv.session.<รหัสหน้าต่าง>
// เปิดกี่หน้าต่างก็แยกขาดจากกันหมด ไม่มีใครเห็นของใคร ไม่มีใครทับใคร

export const TAB_KEY = 'mrv.tab';        // รหัสหน้าต่างนี้ (อยู่ในที่เก็บของแท็บ)
export const TABS_KEY = 'mrv.tabs';      // ทะเบียนว่าหน้าต่างไหนยังเปิดอยู่
export const DRAFT_PREFIX = 'mrv.session.';
export const TAB_ALIVE = 45000;          // ไม่ส่งสัญญาณเกิน 45 วินาที = ปิดไปแล้ว

// รหัสประจำหน้าต่าง — เกิดครั้งเดียวตอนเปิด อยู่ยาวจนปิดหน้าต่าง
//
// 🚨 เก็บใน sessionStorage ไม่ใช่ localStorage
//    sessionStorage รอดการรีเฟรช (F5 แล้วยังเป็นหน้าต่างเดิม ร่างไม่หาย)
//    แต่ไม่ข้ามไปหน้าต่างอื่น ซึ่งคือสิ่งที่ต้องการพอดี
//
// ⚠️ Chrome มีคำสั่ง "ทำสำเนาแท็บ" ซึ่งก๊อป sessionStorage ไปด้วย = รหัสซ้ำกันสองหน้าต่าง
//    ทะเบียนหน้าต่าง (TABS_KEY) จับได้ตรงนี้ แล้วออกรหัสใหม่ให้ตัวที่มาทีหลัง
//
// 🚨🔴 การรีเฟรชกับการทำสำเนาแท็บ หน้าตาเหมือนกันเป๊ะจากมุมของโค้ดนี้
//    ทั้งคู่คือ "มีรหัสเดิมใน sessionStorage และทะเบียนบอกว่ารหัสนั้นยังมีคนถืออยู่"
//
//    สิ่งที่แยกสองอย่างนี้ออกจากกันคือ หน้าต่างที่กำลังจะรีเฟรช "ปล่อยรหัสคืน"
//    ก่อนหายไป (ดู releaseTab) ส่วนต้นฉบับที่ถูกทำสำเนายังเปิดอยู่ ไม่ได้ปล่อยอะไร
//
//    เคยพลาดมาแล้ว: ไม่มีการปล่อยคืน ทุกการรีเฟรชจึงได้รหัสใหม่
//    แล้วยาที่กรอกค้างไว้กลายเป็นของหน้าต่างที่ไม่มีตัวตน = กด F5 ทีของหายทั้งล็อต
let tabId = null;

export function myTabId() {
  if (tabId) return tabId;
  try {
    const had = sessionStorage.getItem(TAB_KEY);
    const reg = readLS(TABS_KEY) || {};
    const now = Date.now();
    // รหัสเดิมยังใช้ได้ ถ้าไม่มีหน้าต่างอื่นที่ยังมีชีวิตถือรหัสนี้อยู่
    if (had && !(reg[had] && now - reg[had] < TAB_ALIVE)) {
      tabId = had;
    } else {
      tabId = 't' + now.toString(36) + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(TAB_KEY, tabId);
    }
  } catch (e) {
    // เบราว์เซอร์ปิดที่เก็บไว้ — ใช้รหัสชั่วคราวในหน่วยความจำแทน ยังทำงานได้ทุกอย่าง
    tabId = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  return tabId;
}

export const draftKeyOf = (id) => DRAFT_PREFIX + id;

// บอกทะเบียนว่าหน้าต่างนี้ยังอยู่ — เรียกเป็นระยะจากตัวจับเวลา
export function touchTab() {
  try {
    const reg = readLS(TABS_KEY) || {};
    const now = Date.now();
    reg[myTabId()] = now;
    // เก็บกวาดหน้าต่างที่เงียบไปนานแล้ว ไม่งั้นทะเบียนบวมไม่มีที่สิ้นสุด
    for (const k of Object.keys(reg)) {
      if (now - reg[k] > TAB_ALIVE * 20) delete reg[k];
    }
    writeLS(TABS_KEY, reg);
  } catch (e) {}
}

// ปล่อยรหัสคืนก่อนหน้าต่างหายไป — เรียกตอนรีเฟรชและตอนปิดแท็บ
//
// 🚨 ต้องเรียกให้ทันก่อนหน้าจะหาย จึงผูกกับ pagehide ไม่ใช่ beforeunload
//    (beforeunload ไม่ยิงในบางกรณีบนมือถือ ส่วน pagehide ยิงเสมอ)
export function releaseTab() {
  try {
    const reg = readLS(TABS_KEY) || {};
    delete reg[myTabId()];
    writeLS(TABS_KEY, reg);
  } catch (e) {}
}

export function tabAlive(id) {
  if (id === myTabId()) return true;
  const reg = readLS(TABS_KEY) || {};
  return !!(reg[id] && Date.now() - reg[id] < TAB_ALIVE);
}

// ไล่ดูร่างค้างของ "หน้าต่างที่ปิดไปแล้ว" ทั้งหมด
//
// 🚨 ห้ามแตะร่างของหน้าต่างที่ยังเปิดอยู่เด็ดขาด นั่นคือของที่คนอื่นกำลังกรอกอยู่
//    การไปดึงมาแสดงคือต้นเหตุของปัญหาเดิมทั้งหมด
export function orphanDrafts() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf(DRAFT_PREFIX) !== 0) continue;
      const id = k.slice(DRAFT_PREFIX.length);
      if (tabAlive(id)) continue;
      const v = readLS(k);
      const rows = v && Array.isArray(v.rows) ? v.rows : [];
      if (!rows.length) { clearLS(k); continue; }   // ร่างเปล่า ไม่มีประโยชน์ ทิ้งเลย
      out.push({ id: id, key: k, box: v, rows: rows, failed: !!v.saveFailed });
    }
  } catch (e) {}
  // ของที่ส่งไม่สำเร็จมาก่อนเสมอ เป็นของที่ยังไม่ขึ้นระบบส่วนกลาง
  out.sort((a, b) => (b.failed ? 1 : 0) - (a.failed ? 1 : 0));
  return out;
}

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

// ── ที่เก็บของแท็บ (sessionStorage) ───────────────────────────────────────────
// ต่างจากที่เก็บถาวรตรงที่ "เบราว์เซอร์ล้างให้เองตอนปิดแท็บ" ไม่ต้องเขียนโค้ดไล่ลบ
// และรอดการรีเฟรช ซึ่งคือสิ่งที่พี่กันสั่งไว้เป๊ะ ๆ (27 ส.ค. 2569)
//
//   "ถ้าครั้งนี้โหลดมาแล้ว แล้วรีเฟรชเว็บแบบปกติ มันจะไม่โหลดใหม่
//    คือให้มันเก็บในสตอเรจเว็บเลย ... แต่ก็ต้องลบทิ้งถ้าปิดแท็บนะ"
//
// 🚨 สามอย่างนี้ห้ามย้ายมาที่นี่ ต้องอยู่ที่เก็บถาวรต่อไป
//    ร่างที่ยังไม่บันทึก (ของค้างส่งไม่สำเร็จต้องรอดข้ามการปิดแท็บ) · ธีม · ฟอนต์
//
// 🚨 ของที่เก็บที่นี่ "ไม่มีวันหมดอายุด้วยเวลา" โดยตั้งใจ
//    ตัวล้างคือลายเซ็นข้อมูลจาก /api/rev ซึ่งบอกความจริงได้ตรงกว่านาฬิกา
//    (ข้อมูลไม่เปลี่ยน = ของในมือยังถูกต้องเสมอ ต่อให้ผ่านไปทั้งวัน)
export const SS = {
  hist:    'mrv.s.hist',      // ผลค้นประวัติ แยกตามเงื่อนไขที่กรอง
  sum:     'mrv.s.sum',       // ตัวเลขหน้าสรุป
  lots:    'mrv.s.lots',      // รายการ Lot แยกตามช่วงวัน
  catalog: 'mrv.s.catalog',   // คลังยาดิบ 417 ตัว (รวมตัวที่ซ่อน)
  prices:  'mrv.s.prices',    // ราคายาในหน้าจัดการราคา
  rev:     'mrv.s.rev'        // ลายเซ็นชุดล่าสุดที่หน้าจอนี้เห็น
};

export function readSS(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// 🚨 ที่เก็บเต็มแล้วห้ามพังทั้งเว็บ — sessionStorage มีเพดานราว 5 MB
//    คลังยา 417 ตัวกับประวัติหลายชุดรวมกันยังห่างไกล แต่ถ้าเต็มจริงให้ทิ้งของเก่า
//    แล้วลองใหม่ครั้งเดียว ไม่ได้ก็ปล่อยผ่าน (เว็บกลับไปโหลดใหม่ทุกครั้งเหมือนเดิม)
export function writeSS(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    clearAllSS();
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e2) {}
  }
}

export function clearSS(key) {
  try { sessionStorage.removeItem(key); } catch (e) {}
}

// ล้างของที่โหลดมาทั้งหมด — ใช้ตอนข้อมูลเปลี่ยน และตอนเข้า/ออกโหมดดูตัวอย่าง
// 🚨 ไล่ตามคำนำหน้า ไม่ใช่ไล่ตามรายชื่อคีย์ เพราะประวัติกับ Lot เก็บหลายชุด
//    (คีย์จริงคือ mrv.s.hist:<เงื่อนไข>) ถ้าลบตามรายชื่อจะเหลือชุดเก่าค้าง
export function clearAllSS() {
  try {
    const kill = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.indexOf('mrv.s.') === 0) kill.push(k);
    }
    kill.forEach((k) => sessionStorage.removeItem(k));
  } catch (e) {}
}

// ── จำผลของงานหนักไว้ ──────────────────────────────────────────────────────
// ใช้กับงานที่ "ผลลัพธ์ขึ้นกับของไม่กี่ชิ้น" และคำนวณใหม่ทุกครั้งที่วาดจอ
//
// พี่กันสั่ง 27 ส.ค. 2569: "ก8 ต้องแก้เลย เราต้องการจุดที่ดีที่สุด"
//
// 🚨 ของที่เอามาเทียบ (deps) ต้องครบ ขาดตัวเดียว = หน้าจอค้างของเก่าโดยไม่มีอะไรเตือน
//    จึงใช้เฉพาะจุดที่ของนำเข้าชัดเจนจริง ๆ ไม่เอาไปครอบทั้งไฟล์
export function memo1(box, key, deps, make) {
  const old = box[key];
  if (old && old.deps.length === deps.length && old.deps.every((v, i) => v === deps[i])) {
    return old.val;
  }
  const val = make();
  box[key] = { deps: deps, val: val };
  return val;
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
  //
  // 🚨 ยาที่ชื่อกับความแรงซ้ำกันพอดี (6 คู่ในคลัง เช่น Co-trimoxazole 80 + 400 mg
  //    ที่มีทั้งยาฉีดและยาเม็ด) ถูก drugName.js ต่อรูปแบบยาไว้ท้ายชื่อเพื่อแยกให้ออก
  //    → "Trimethoprim Sulfamethoxazole (Co-trimoxazole) (80 + 400 mg) (injection)"
  //    ความแรงจึงไม่ได้อยู่ท้ายสุดอีกต่อไป เดิมจับไม่ได้เลยเหมาว่าทั้งก้อนคือชื่อยา
  //    ผลคือความแรงกลายเป็นสีเข้มเหมือนชื่อ และตัวย่อไปโผล่ท้ายสุดแทนที่จะติดชื่อ
  //    = ยาตัวเดียวกันหน้าตาไม่เหมือนกันในรายการเดียว (พี่กันทักเอง 13 ส.ค. 2569)
  //    กลุ่มที่ 3 จึงรับวงเล็บต่อท้ายที่ "ไม่ได้ขึ้นต้นด้วยตัวเลข" ไว้ต่างหาก
  const m = full.match(/^(.*?)\s(\(\d[^)]*\)|\d[\d\w./+\-% ]*)(?:\s(\([^)\d][^)]*\)))?$/);
  if (!m) return { base: full, strength: '', tail: '' };
  return { base: m[1].trim(), strength: m[2].trim(), tail: (m[3] || '').trim() };
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
// ── เหตุผลที่ยาคืนต้องถูกทำลาย ────────────────────────────────────────────────
//
// พี่กันเคาะ 26 ส.ค. 2569: "เอาทุกข้อเลย แต่ให้มีใส่ความหมายไว้ด้วยนะ"
// ของเดิมมี 5 ข้อซึ่งไม่ครอบคลุม เภสัชกรต้องเลือก "อื่น ๆ" บ่อยจนตอบผู้บริหารไม่ได้
//
// 🚨 คำอธิบายไม่ใช่ของประดับ — คนที่รับยาคืนหน้าเคาน์เตอร์อาจไม่ใช่เภสัชกร
//    ถ้าไม่บอกว่าแต่ละข้อกินความแค่ไหน จะเลือกไม่ตรงกัน แล้วสถิติทั้งปีเชื่อไม่ได้
//    เช่น "สภาพยาเปลี่ยน" กับ "เก็บผิดสภาพ" ต่างกันที่ "เห็นความเสียหายแล้วหรือยัง"
//
// 🚨 ลำดับเรียงจากที่เจอบ่อยที่สุดลงไป — ไม่ใช่เรียงตามความรุนแรง
//    คนกรอกจะได้เจอตัวที่ต้องใช้จริงในสามอันดับแรกเสมอ
//
// ⚠️ ข้อ 11 (ยาเสพติด) มีระเบียบทำลายเฉพาะของตัวเอง ต้องมีคณะกรรมการร่วม
//    ใส่ไว้ในรายการเพื่อให้บันทึกได้ครบ แต่คำอธิบายเตือนว่าต้องทำตามระเบียบแยก
export const DESTROY_REASONS = [
  { label: 'หมดอายุ', help: 'เลยวันหมดอายุที่ระบุบนบรรจุภัณฑ์แล้ว' },
  { label: 'ใกล้หมดอายุ จ่ายต่อไม่ทัน', help: 'ยังไม่หมดอายุ แต่เหลือสั้นจนจ่ายให้ผู้ป่วยใช้ไม่หมด' },
  { label: 'แกะออกจากบรรจุภัณฑ์เดิม', help: 'ไม่มีฉลาก ไม่ทราบรุ่นผลิตและวันหมดอายุ' },
  { label: 'สภาพยาเปลี่ยน', help: 'สี กลิ่น เนื้อยาเปลี่ยน แตกร่วน ชื้นเยิ้ม หรือตกตะกอน' },
  { label: 'บรรจุภัณฑ์ชำรุด', help: 'ขวดแตก แผงฉีก หลอดรั่ว หรือซีลถูกเปิด' },
  { label: 'เก็บผิดสภาพ', help: 'ยาแช่เย็นถูกทิ้งไว้อุณหภูมิห้อง หรือตากแดด แม้ยายังดูปกติ' },
  { label: 'เปิดใช้แล้วเกินอายุหลังเปิด', help: 'อินซูลิน ยาหยอดตา ยาน้ำผสมแล้ว ที่เลยกำหนดใช้หลังเปิด' },
  { label: 'ฉลากลบเลือน ระบุยาไม่ได้', help: 'เห็นเม็ดยาแต่ยืนยันไม่ได้ว่าเป็นยาตัวไหน' },
  { label: 'ไม่ทราบแหล่งที่มา', help: 'ไม่ใช่ยาของโรงพยาบาล หรือผู้ป่วยซื้อมาเอง' },
  { label: 'ยาถูกเรียกคืน', help: 'บริษัทผู้ผลิตหรือ อย. ประกาศเรียกคืนรุ่นผลิตนั้น' },
  { label: 'ยาเสพติด วัตถุออกฤทธิ์', help: 'ต้องทำลายตามระเบียบเฉพาะ มีคณะกรรมการร่วมเป็นพยาน' },
  { label: 'อื่น ๆ', help: 'เหตุผลนอกเหนือจากที่ระบุไว้ข้างต้น' }
];

// ชื่อเหตุผลล้วน ๆ สำหรับที่ที่ต้องการแค่ข้อความ (ตรวจค่าจากฐาน · ไฟล์ส่งออก)
export const DESTROY_REASON_LABELS = DESTROY_REASONS.map((r) => r.label);

// คำอธิบายของเหตุผลหนึ่ง ๆ — คืนค่าว่างถ้าเป็นเหตุผลเก่าที่ไม่มีในรายการแล้ว
export function destroyReasonHelp(label) {
  const hit = DESTROY_REASONS.find((r) => r.label === label);
  return hit ? hit.help : '';
}

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
  // String() ตัด .00 ให้เองอยู่แล้ว — 30 ได้ "30" · 30.5 ได้ "30.5"
  // เดิมเขียนเป็นเงื่อนไขที่สองข้างเหมือนกันเป๊ะ ไม่มีผลอะไร (ผลตรวจข้อ ต-18)
  return String(Number(n) || 0);
}

// ── ช่องจำนวนที่คิดเลขได้ (เฉพาะฝั่งคอม) ────────────────────────────────────
// พี่กันสั่ง 25 ส.ค. 2569: "ใส่ 25+25 แล้วเอนเทอร์ อยากให้มันบวกให้ด้วย"
//
// ที่มาของโจทย์: นับยาคืนจริงมักได้เป็นกอง ๆ — แผงละ 10 สามแผง กับเศษอีก 4
// เดิมต้องคิดในหัวก่อนแล้วค่อยพิมพ์ผลรวม ซึ่งเป็นจุดที่พลาดง่ายและตรวจย้อนไม่ได้
//
// 🚨 ห้ามเอาไปใช้กับป๊อปอัปฝั่งมือถือ — พี่กันสั่งชัดว่าทำเฉพาะคอม
//    ฝั่งมือถือใช้ cleanQty/qtyNum ตัวเดิมต่อไป ไม่ต้องแก้อะไรเลย
//    (แป้นพิมพ์มือถือเป็นแป้นตัวเลข ไม่มีเครื่องหมาย + − × ÷ ให้กดอยู่แล้ว)

// ยอมให้เครื่องหมายกับวงเล็บค้างอยู่ในช่องระหว่างพิมพ์ ไม่งั้นพิมพ์ + ปุ๊บโดนกินทันที
// (cleanQty ตัวเดิมกรอง + ทิ้งทุกตัว → พิมพ์ 25+25 กลายเป็น 2525 ซึ่งผิด 50 เท่า)
export function cleanQtyExpr(raw) {
  return String(raw == null ? '' : raw)
    .replace(/[×xX]/g, '*')          // พิมพ์ x แทนคูณได้ (แป้นคอมไม่มีปุ่ม ×)
    .replace(/[÷]/g, '/')
    .replace(/−/g, '-')              // ขีดลบยาวจากปุ่มบนแป้น → ขีดลบธรรมดา
    .replace(/[^0-9.+\-*/()=]/g, '')
    .slice(0, 60);                   // กันวางข้อความยาวเป็นพืดมาทั้งก้อน
}

// ── สูตรที่เฉลยแล้ว "25+25=50" ───────────────────────────────────────────────
// พี่กันสั่ง 25 ส.ค. 2569: กด Enter ครั้งแรกให้ช่องกลายเป็น "25+25=50" โดยเลข 50 เด่น
// แล้วกด Enter อีกครั้งถึงเพิ่มรายการ — ผู้ใช้ได้เห็นว่าคิดออกมาเท่าไรก่อนของเข้ารายการ
//
// 🚨 เก็บสูตรไว้ในช่องด้วย ไม่ใช่แทนที่ด้วยผลลัพธ์เปล่า ๆ
//    เพราะถ้าเห็นแต่ "50" จะตรวจย้อนไม่ได้ว่ามาจากการบวกอะไรบ้าง
export function splitResolved(raw) {
  const s = String(raw == null ? '' : raw);
  const i = s.indexOf('=');
  if (i < 0) return { expr: s, answer: '', resolved: false };
  return { expr: s.slice(0, i + 1), answer: s.slice(i + 1), resolved: true };
}

export function isResolvedQty(raw) {
  return String(raw == null ? '' : raw).indexOf('=') >= 0;
}

// มีเครื่องหมายคิดเลขอยู่ในช่องไหม — ตัวแรกไม่นับ เพราะ -5 คือเลขติดลบ ไม่ใช่การลบ
// เฉลยแล้ว (มี =) ไม่นับเป็นสูตรที่รอคิด เพราะคิดไปแล้ว
export function isQtyExpr(raw) {
  const s = String(raw == null ? '' : raw);
  if (s.indexOf('=') >= 0) return false;
  return /[+\-*/()]/.test(s.slice(1));
}

// ── คิดสูตรในช่องจำนวน ───────────────────────────────────────────────────────
// รองรับ + − × ÷ และวงเล็บ ตามที่พี่กันสั่ง 25 ส.ค. 2569
// คูณหารมาก่อนบวกลบ · วงเล็บมาก่อนทุกอย่าง ตามหลักคณิตศาสตร์
//
// 🚨 ห้ามใช้ eval() หรือ new Function() เด็ดขาด แม้จะสั้นกว่ามาก
//    ทั้งสองตัวรันโค้ดอะไรก็ได้ที่อยู่ในข้อความ และ CSP ของเว็บจริงบล็อกไว้อยู่แล้ว
//    (next.config.js ใส่ 'unsafe-eval' เฉพาะตอน dev — เว็บจริงจะพังเงียบ ๆ หาสาเหตุยากมาก)
//
// วิธีที่ใช้คือไล่อ่านทีละชั้น (บวกลบ → คูณหาร → ตัวเลข/วงเล็บ) ชั้นล่างถูกเรียกก่อนเสมอ
// จึงได้ลำดับความสำคัญถูกต้องโดยไม่ต้องจัดคิวเอง
//
// ⚠️ ต้องทนกับสูตรที่ยังพิมพ์ไม่จบ เพราะผลลัพธ์ถูกคิดใหม่ทุกตัวอักษรที่พิมพ์
//    "25+" · "(25+25" · "3*(" ต้องไม่พังและไม่กระพริบเป็นค่าอนันต์
export function evalQty(raw) {
  // เฉลยไปแล้ว ("25+25=50") ให้คิดจากสูตรฝั่งซ้าย ไม่ใช่ตัวเลขฝั่งขวา
  // ป้องกันกรณีผู้ใช้ไปแก้ตัวเลขหลัง = เองแล้วได้ค่าที่ไม่ตรงกับสูตร
  const cut = String(raw == null ? '' : raw).split('=')[0];
  const s = cleanQtyExpr(cut).replace(/[+\-*/(]+$/, '');   // ลงท้ายค้างไว้ = คิดเท่าที่พิมพ์มาแล้ว
  if (!s) return 0;
  const toks = s.match(/(\d+\.?\d*|[+\-*/()])/g);
  if (!toks) return 0;

  let i = 0;

  // ชั้นบนสุด: บวกลบ ไล่จากซ้ายไปขวา
  function readSum() {
    let v = readProduct();
    while (i < toks.length && (toks[i] === '+' || toks[i] === '-')) {
      const op = toks[i++];
      const r = readProduct();
      if (!Number.isFinite(r)) return NaN;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  // ชั้นกลาง: คูณหาร — ถูกเรียกก่อนบวกลบ จึงคิดเสร็จก่อนเสมอ
  function readProduct() {
    let v = readAtom();
    while (i < toks.length && (toks[i] === '*' || toks[i] === '/')) {
      const op = toks[i++];
      const r = readAtom();
      if (!Number.isFinite(r)) return NaN;
      v = op === '*' ? v * r : (r === 0 ? 0 : v / r);      // หารศูนย์ = 0 ไม่ใช่ค่าอนันต์
    }
    return v;
  }

  // ชั้นล่างสุด: ตัวเลขเดี่ยว · วงเล็บ · เครื่องหมายนำหน้า
  function readAtom() {
    if (i >= toks.length) return NaN;
    const t = toks[i];
    if (t === '(') {
      i++;
      const v = readSum();                                  // ในวงเล็บเริ่มนับใหม่จากชั้นบนสุด
      if (toks[i] === ')') i++;                             // ยังไม่ได้ปิดวงเล็บ = ปิดให้เอง
      return v;
    }
    if (t === '-') { i++; const v = readAtom(); return Number.isFinite(v) ? -v : NaN; }
    if (t === '+') { i++; return readAtom(); }
    if (/^\d/.test(t)) { i++; return parseFloat(t); }
    return NaN;                                             // ')' ลอย ๆ หรืออะไรที่ไม่ควรอยู่ตรงนี้
  }

  let sum = readSum();
  if (!Number.isFinite(sum)) return 0;
  sum = Math.round(sum * 100) / 100;                        // ทศนิยม 2 ตำแหน่งเท่าเดิม
  return sum > 0 ? Math.min(MAX_QTY, sum) : 0;              // เพดานเดียวกับ qtyNum
}

// สูตรที่อ่านง่ายสำหรับโชว์บนจอ — 25*4 อ่านยากกว่า 25 × 4
// วงเล็บไม่เว้นวรรคด้านใน ไม่งั้น "( 25 + 25 )" ดูโปร่งจนอ่านยากกว่าเดิม
export function exprText(raw) {
  return cleanQtyExpr(raw)
    .replace(/\*/g, ' × ').replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ').replace(/([\d)])-/g, '$1 − ');
}

// ── เลขเวอร์ชันกับวันที่ ต้องอยู่ติดกันเสมอ ──────────────────────────────────
// 🚨🚨 ทุกครั้งที่ bump เวอร์ชัน ต้องแก้ APP_LAST_UPDATE ด้วยเสมอ
//    เดิมวันที่ฝังตายอยู่ใน pages/about.jsx คนละไฟล์กับเลขเวอร์ชัน จึงลืมทุกที
//    ผลคือ push v0.7.1.0 วันที่ 25 ส.ค. แต่หน้าตั้งค่ายังบอก "อัปเดตล่าสุด 5 สิงหาคม 2569"
//    (พี่กันจับได้เอง 25 ส.ค. 2569) → ย้ายมาไว้ตรงนี้ให้เห็นพร้อมกัน จะได้ไม่พลาดอีก
//
// ⚠️ เขียนเป็นข้อความไทยตรง ๆ ไม่คำนวณจากนาฬิกาเครื่อง
//    เพราะนี่คือ "วันที่ปล่อยรุ่นนี้" ไม่ใช่ "วันนี้" — คอมที่นาฬิกาเพี้ยนจะโชว์มั่ว
export const APP_VERSION = '0.15.0.0';
export const APP_FIRST_RELEASE = '4 สิงหาคม 2569';
export const APP_LAST_UPDATE = '31 สิงหาคม 2569';
