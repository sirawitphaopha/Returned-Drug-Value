/** @type {import('next').NextConfig} */

// ── ส่วนหัวความปลอดภัย (security headers) ────────────────────────────────────
// คำสั่งที่เว็บบอกเบราว์เซอร์ว่าอนุญาตให้ทำอะไรได้บ้างในหน้านี้
// กันคนแทรกโค้ดอันตรายเข้ามาขโมยข้อมูล — ในเว็บนี้มี HN ซึ่งเป็นข้อมูลผู้ป่วย
// ยกชุดเดียวกับที่ TB Dashboard ใช้อยู่แล้วมาปรับให้เข้ากับโปรเจกต์นี้
//
// 🚨 'unsafe-inline' ใน style-src ตัดออกไม่ได้
//    ทั้งเว็บวาดด้วยสไตล์ฝังในแท็ก (แปลงจากมอคอัปด้วย s()) ราว 600 จุด
//    ถ้าตัดออก หน้าเว็บจะกลายเป็นข้อความเปล่าไม่มีสีไม่มีเลย์เอาต์เลย
//
// 🚨 'unsafe-eval' ใส่เฉพาะตอนรันในเครื่อง — เครื่องมือรีเฟรชอัตโนมัติของ Next ต้องใช้
//    เว็บจริงไม่มีบรรทัดนี้
const isDev = process.env.NODE_ENV === 'development';

// 🚨 CSP ย้ายไปออกที่ middleware.js แล้ว (ผลตรวจข้อ ก-14 · แก้ 31 ส.ค. 2569)
//    เพราะต้องแนบ "ใบอนุญาตรายคำขอ" (nonce) ซึ่งต้องสุ่มใหม่ทุกครั้งที่เปิดหน้า
//    ส่วนหัวที่ตั้งจากไฟล์นี้เป็นค่าคงที่ ทำแบบนั้นไม่ได้
//
//    ชุดนี้เหลือไว้เป็นตาข่ายชั้นสองสำหรับเส้นทางที่ middleware ไม่ได้ดูแล
//    (ไฟล์ static ของ Next) และเผื่อกรณี middleware ไม่ทำงานด้วยเหตุใดก็ตาม
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ''),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // ws: เฉพาะตอนรันในเครื่อง — ตัวรีเฟรชอัตโนมัติของ Next คุยผ่าน WebSocket
  // ถ้าไม่เปิดให้ หน้าเว็บจะไม่อัปเดตเองตอนแก้โค้ด (เว็บจริงไม่มีบรรทัดนี้)
  "connect-src 'self'" + (isDev ? ' ws: wss:' : ''),
  "object-src 'none'",       // ห้ามฝัง Flash/PDF viewer เก่า ๆ ที่เป็นช่องโหว่
  "base-uri 'self'",         // ห้ามเปลี่ยนที่อยู่ฐานของหน้า (ใช้หลอกให้โหลดสคริปต์จากที่อื่น)
  "form-action 'self'",      // ฟอร์มส่งไปที่อื่นไม่ได้ — กันขโมยรหัสผ่านห้องยา
  "frame-ancestors 'none'"   // ห้ามเว็บอื่นเอาเว็บนี้ไปฝังในกรอบ (clickjacking)
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // ห้ามเอาไปฝังในกรอบ — ซ้ำกับ frame-ancestors ไว้เผื่อเบราว์เซอร์เก่าที่ยังไม่รู้จัก CSP
  { key: 'X-Frame-Options', value: 'DENY' },
  // ห้ามเบราว์เซอร์เดาชนิดไฟล์เอง (ไฟล์ข้อความถูกเดาเป็นสคริปต์แล้วรันได้)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // ไปเว็บอื่นแล้วไม่ส่งที่อยู่หน้าเต็มไปด้วย — ที่อยู่มีเลข Lot กับคำค้นติดไปได้
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // เว็บนี้ไม่ต้องใช้กล้อง ไมค์ ตำแหน่ง — ปิดทิ้งให้หมด
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // บังคับให้เบราว์เซอร์จำว่าเว็บนี้ต้องต่อแบบเข้ารหัสเท่านั้น 2 ปี (ผลตรวจข้อ ต-15)
  // ถ้าไม่มี ครั้งแรกที่พิมพ์ที่อยู่โดยไม่ใส่ https คำขอแรกจะวิ่งแบบไม่เข้ารหัส
  // ซึ่งดักอ่านได้ระหว่างทาง — ในเว็บนี้คำขอนั้นพ่วงคุกกี้เข้าสู่ระบบไปด้วย
  // ⚠️ ใส่ได้เพราะเว็บนี้อยู่บน Cloudflare ที่เป็น https อยู่แล้วทั้งเส้น ไม่มีเส้นทางที่ต้องใช้ http
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }
];

const nextConfig = {
  reactStrictMode: true,
  // ไม่ต้องประกาศให้โลกรู้ว่าเว็บนี้สร้างด้วยอะไร (ผลตรวจข้อ ต-15)
  // คนสแกนหาเว็บที่ใช้รุ่นที่มีช่องโหว่จะได้ไม่เจอจากส่วนหัวนี้
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};

module.exports = nextConfig;
