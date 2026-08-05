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

export function authEnabled() {
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
