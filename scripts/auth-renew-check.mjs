// พิสูจน์ว่าบัตรผ่านต่ออายุเองเมื่อใช้ไปเกินครึ่งอายุ
//
// 🔑 กฎกลาง `pharmacy-web-logic` ข้อ 24 — ME-DRP นับอายุจาก "ครั้งสุดท้ายที่ใช้"
//    เว็บนี้เดิมออกบัตรครั้งเดียวแล้วจบ ใช้ทุกวันก็ยังถูกเด้งออกเมื่อครบ 30 วัน
//
// 🚨 ทดสอบด้วยการสร้างบัตรที่ "แก่" จริง ๆ แล้วดูว่าระบบตัดสินยังไง
//    ไม่ใช่แค่อ่านโค้ดแล้วเชื่อว่าถูก
//
//   node scripts/auth-renew-check.mjs
import fs from 'fs';

// อ่านรหัสจาก .env.local ให้ตรงกับที่เซิร์ฟเวอร์ใช้
const env = fs.readFileSync('.env.local', 'utf8');
const pw = (env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD=')) || '').slice('MRV_PASSWORD='.length).trim();
process.env.MRV_PASSWORD = pw;

const src = fs.readFileSync(new URL('../lib/auth.js', import.meta.url), 'utf8');
const m = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const วัน = 24 * 60 * 60 * 1000;
const ทำบัตร = async (แก่กี่วัน) => {
  const token = await m.expectedToken();
  const at = Date.now() - แก่กี่วัน * วัน;
  // ลอกสูตรจาก issueAuthCookie แต่ย้อนเวลาได้
  const enc = new TextEncoder().encode(token + '|' + at);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const sig = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return at + '.' + sig;
};

let ผิด = 0;
const ตรวจ = (ok, ดี, แย่) => {
  if (ok) console.log('  ✅ ' + ดี);
  else { ผิด++; console.log('  ❌ ' + แย่); }
};

console.log('');
console.log('  อายุบัตรที่ตั้งไว้ ' + m.AUTH_DAYS + ' วัน · ต่ออายุเมื่อเกินครึ่ง (' + m.AUTH_DAYS / 2 + ' วัน)');
console.log('');

const ใหม่ = await ทำบัตร(1);
ตรวจ(await m.authCookieValid(ใหม่), 'บัตรอายุ 1 วัน ใช้ได้', 'บัตรอายุ 1 วัน ถูกปฏิเสธ');
ตรวจ(!m.authCookieStale(ใหม่), 'บัตรอายุ 1 วัน ยังไม่ต้องต่อ', 'บัตรอายุ 1 วัน ถูกต่ออายุโดยไม่จำเป็น');

const กลาง = await ทำบัตร(20);
ตรวจ(await m.authCookieValid(กลาง), 'บัตรอายุ 20 วัน ยังใช้ได้', 'บัตรอายุ 20 วัน ถูกปฏิเสธ');
ตรวจ(m.authCookieStale(กลาง), 'บัตรอายุ 20 วัน ถูกต่ออายุให้ (เกินครึ่งแล้ว)', 'บัตรอายุ 20 วัน ไม่ถูกต่ออายุ');

const หมด = await ทำบัตร(31);
ตรวจ(!(await m.authCookieValid(หมด)), 'บัตรอายุ 31 วัน หมดอายุจริง ต้องกรอกรหัสใหม่', 'บัตรอายุ 31 วัน ยังใช้ได้ — อายุไม่ถูกบังคับ');

// 🚨 บัตรปลอมต้องไม่ผ่านทั้งสองด่าน
ตรวจ(!(await m.authCookieValid(Date.now() + '.ลายเซ็นมั่ว')), 'บัตรที่ลายเซ็นไม่ตรง ถูกปฏิเสธ', 'บัตรลายเซ็นมั่วผ่านได้');
ตรวจ(!(await m.authCookieValid('ไม่มีจุดคั่นเลย')), 'บัตรรูปแบบเก่า (ค่าคงที่) ใช้ไม่ได้แล้ว', 'บัตรรูปแบบเก่ายังผ่าน');

// ตัวเลือกคุกกี้ต้องเป็นชุดเดียวกันทั้งตอนออกและตอนต่อ
const o = m.authCookieOpts();
ตรวจ(o.httpOnly === true && o.path === '/' && o.maxAge === m.AUTH_DAYS * 24 * 60 * 60,
  'ตัวเลือกคุกกี้ครบ — httpOnly · path · อายุตรงกับ AUTH_DAYS',
  'ตัวเลือกคุกกี้ไม่ครบหรือไม่ตรงกับ AUTH_DAYS');

console.log('');
console.log(ผิด ? '  ❌ ยังไม่ผ่าน ' + ผิด + ' ข้อ' : '  ✅ ผ่านครบ');
process.exitCode = ผิด ? 1 : 0;
