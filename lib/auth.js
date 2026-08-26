// รหัสผ่านร่วมของห้องยา 1 ชั้น — ไม่ใช่ระบบผู้ใช้เต็มรูปแบบ
//
// ทำไมต้องมี: เว็บอยู่บนอินเทอร์เน็ต ใครมีลิงก์ก็เข้ามาลบข้อมูลทั้งปีงบได้
// และ HN คือข้อมูลผู้ป่วย ไม่ควรวางอยู่บนเว็บที่เปิดโล่ง (เรื่อง PDPA)
//
// วิธี: ตั้งรหัสไว้เป็นค่าตั้งระบบชื่อ MRV_PASSWORD บน Cloudflare
//       ผู้ใช้กรอกถูก → ฝังคุกกี้ไว้ 30 วัน ไม่ต้องกรอกซ้ำทุกวัน
//       คุกกี้เป็น httpOnly (จาวาสคริปต์ในหน้าเว็บอ่านไม่ได้) และเก็บแค่ค่าที่แปลงแล้ว
//       ไม่ได้เก็บรหัสจริง
//
// 🚨 เว็บจริง (production) ล็อกเสมอ ไม่ว่าจะตั้ง MRV_PASSWORD ไว้หรือไม่
//    ลืมตั้ง = เข้าไม่ได้เลยทั้งเว็บ (ตอบ 503) ไม่ใช่เปิดโล่งเงียบ ๆ
//    เดิมเป็นแบบ "พังแล้วเปิด" — ลบตัวแปรตอนจัดการค่าบน Cloudflare หรือพิมพ์ชื่อผิด
//    แล้วเว็บจะเปิดให้อินเทอร์เน็ตทั้งใบโดยไม่มีสัญญาณเตือนอะไรเลย (ผลตรวจข้อ ส-2)
//    ตอนรันในเครื่องยังไม่ล็อกเหมือนเดิม เพราะ MRV_DEV_OPEN ทำหน้าที่นั้นอยู่แล้ว

export const AUTH_COOKIE = 'mrv_auth';
export const AUTH_DAYS = 30;

// ── ปลดล็อกเฉพาะตอนรันในเครื่อง ──────────────────────────────────────────────
// เว็บที่รันในเครื่อง (npm run dev) มีแค่คนหน้าจอเครื่องนั้นที่เข้าถึงได้อยู่แล้ว
// การบังคับกรอกรหัสทุกครั้งจึงไม่ได้เพิ่มความปลอดภัย มีแต่ทำให้เทสยาก
//
// 🔒 ต้องเข้าเงื่อนไข "ทั้งสองข้อ" ถึงจะปลดล็อก ป้องกันเว็บจริงหลุดโดยไม่ตั้งใจ
//    1. NODE_ENV เป็น development — Cloudflare build เป็น production เสมอ
//       ต่อให้ตัวแปรข้อ 2 หลุดขึ้นไปก็ไม่มีผลใด ๆ
//    2. ตั้ง MRV_DEV_OPEN=1 ไว้ใน .env.local (ไฟล์นี้อยู่ใน .gitignore ไม่ขึ้น git)
//
// 🚨 ห้ามตั้งตัวแปรนี้บน Cloudflare เด็ดขาด
function devOpen() {
  if (process.env.NODE_ENV !== 'development') return false;
  return (process.env.MRV_DEV_OPEN || '').trim() === '1';
}

// ตั้งรหัสไว้แล้วหรือยัง — แยกจาก authEnabled เพราะ "ต้องล็อก" กับ "ล็อกได้"
// เป็นคนละเรื่อง เว็บจริงที่ต้องล็อกแต่ยังไม่มีรหัส = ตั้งค่าไม่ครบ ต้องปิดตาย
export function authConfigured() {
  return !!(process.env.MRV_PASSWORD || '').trim();
}

export function authEnabled() {
  if (devOpen()) return false;
  if (process.env.NODE_ENV === 'production') return true;   // เว็บจริงล็อกเสมอ (ผลตรวจข้อ ส-2)
  return authConfigured();
}

// เทียบสองข้อความแบบใช้เวลาเท่ากันเสมอ ไม่ว่าจะต่างกันตั้งแต่ตัวแรกหรือตัวสุดท้าย
//
// ปกติเรื่องนี้แทบไม่มีผลกับคนโจมตีผ่านอินเทอร์เน็ต แต่เว็บนี้ต่างออกไป
// เพราะค่าที่เอามาเทียบคือค่าเดียวกับที่ฝังเป็นคุกกี้ (ดู /api/auth)
// เดาค่านั้นออกเมื่อไหร่ = เอาไปตั้งเป็นคุกกี้เข้าเว็บได้เลยโดยไม่ต้องรู้รหัสจริง
// (ผลตรวจข้อ ก-13) · ทั้งสองค่าเป็นรหัสย่อยาว 64 ตัวเท่ากันเสมอ การเทียบความยาวก่อนจึงไม่รั่วอะไร
export function safeEqual(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// แปลงรหัสเป็นค่าที่เอาไปเก็บในคุกกี้ — ย้อนกลับเป็นรหัสจริงไม่ได้
export async function tokenOf(password) {
  const raw = String(password || '') + '|mrv|' + (process.env.SUPABASE_URL || '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function expectedToken() {
  return tokenOf(process.env.MRV_PASSWORD || '');
}

// ── บัตรผ่านมีวันหมดอายุจริง (ผลตรวจข้อ ก-15) ───────────────────────────────
//
// ปัญหาของเดิม: ค่าในคุกกี้คือ `expectedToken()` ซึ่งเป็นค่าคงที่ตลอดกาล
// `maxAge: 30 วัน` เป็นเพียง "คำขอ" ที่ส่งไปให้เบราว์เซอร์ช่วยลบให้เท่านั้น
// ไม่ใช่การตรวจฝั่งเซิร์ฟเวอร์ — ใครก๊อปค่าคุกกี้ออกไปได้ครั้งเดียว
// (ยืมเครื่อง · ส่วนขยายเบราว์เซอร์ · สำรองข้อมูลเครื่อง) เอาไปตั้งเองในเครื่องอื่น
// แล้วเข้าเว็บได้ตลอดชีวิต จนกว่าจะมีคนเปลี่ยน MRV_PASSWORD ซึ่งอาจไม่เกิดขึ้นเลย
//
// วิธีแก้: ฝัง "เวลาที่ออกบัตร" ลงในค่าคุกกี้ แล้วเซ็นทับด้วยรหัสลับ
//   รูปแบบ  <เวลาที่ออกบัตร>.<ลายเซ็น>
//   ลายเซ็น = sha256(รหัสที่คาดหวัง + '|' + เวลาที่ออกบัตร)
//
// เวลาที่ออกบัตรจึงแก้เองไม่ได้ — ขยับตัวเลขเมื่อไหร่ลายเซ็นไม่ตรงทันที
// และเซิร์ฟเวอร์เป็นคนตัดสินอายุเอง ไม่ต้องพึ่งเบราว์เซอร์อีก
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// เซ็นบัตรผ่านใบใหม่ ให้ /api/auth เอาไปฝังเป็นคุกกี้
export async function issueAuthCookie() {
  const token = await expectedToken();
  const at = Date.now();
  return at + '.' + (await sha256Hex(token + '|' + at));
}

// ตรวจบัตรผ่าน — ต้องผ่านครบทั้ง 3 ด่านถึงจะเข้าได้
//   1. รูปแบบถูกต้อง   2. ลายเซ็นตรง (ไม่มีใครแก้เวลา)   3. ยังไม่หมดอายุ
//
// 🚨 คุกกี้แบบเก่า (ค่าคงที่ไม่มีจุดคั่น) ใช้ไม่ได้แล้วโดยตั้งใจ
//    ผลคือทุกเครื่องต้องกรอกรหัสใหม่ครั้งเดียวหลังอัปเดต ซึ่งเป็นสิ่งที่ต้องการอยู่แล้ว
//    เพราะบัตรใบเก่าที่เคยรั่วออกไปจะใช้ไม่ได้อีกต่อไปทันที
export async function authCookieValid(value) {
  const raw = String(value || '');
  const dot = raw.indexOf('.');
  if (dot <= 0) return false;

  const atText = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d{1,15}$/.test(atText) || !sig) return false;

  const token = await expectedToken();
  const want = await sha256Hex(token + '|' + atText);
  if (!safeEqual(sig, want)) return false;

  const age = Date.now() - Number(atText);
  // เวลาในอนาคตก็ไม่รับ — นาฬิกาเครื่องเพี้ยน หรือมีคนพยายามยืดอายุบัตร
  if (age < -60 * 1000) return false;
  if (age > AUTH_DAYS * 24 * 60 * 60 * 1000) return false;
  return true;
}
