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
// 🚨 ถ้าไม่ได้ตั้ง MRV_PASSWORD ระบบจะ "ไม่ล็อก" เลย — ตั้งใจให้เป็นแบบนี้
//    เพื่อไม่ให้เว็บล็อกตัวเองตอนรันในเครื่อง แต่ก่อนเปิดใช้จริงต้องตั้งเสมอ

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

export function authEnabled() {
  if (devOpen()) return false;
  return !!(process.env.MRV_PASSWORD || '').trim();
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
