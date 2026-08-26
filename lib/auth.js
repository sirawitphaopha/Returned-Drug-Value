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
