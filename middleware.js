// ประตูตรวจรหัสผ่านร่วมของห้องยา — กั้นทุกหน้าและทุกเส้นทาง API
//
// 🚨 ห้ามเปลี่ยนชื่อไฟล์นี้เป็น proxy.ts เด็ดขาด — Cloudflare Pages/Workers จะ build ไม่ผ่าน
//    (เคยพลาดมาแล้วที่ TB Dashboard ตอน Next.js 16)
//
// ตอนรันในเครื่องที่ยังไม่ตั้ง MRV_PASSWORD ประตูนี้เปิดทิ้งไว้ ไม่ล็อกอะไรเลย
// แต่เว็บจริงล็อกเสมอ — ลืมตั้งรหัสแล้วปิดตายทั้งเว็บ ไม่ใช่เปิดโล่ง (ดู lib/auth.js)
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authConfigured, authEnabled, authCookieValid, authCookieStale, authCookieOpts, issueAuthCookie } from '@/lib/auth';

// ── ตาข่ายกันโค้ดแปลกปลอม (ผลตรวจข้อ ก-14) ────────────────────────────────
// พี่กันสั่ง 27 ส.ค. 2569: "ก14 ทำ และต้องทำด้วย แต่ทำตอนท้ายก็ได้"
//
// ปัญหาเดิม: script-src มี 'unsafe-inline' อยู่ = อนุญาตให้สคริปต์ที่ฝังในหน้าทำงานได้ทุกตัว
// ซึ่งทำให้ตาข่ายกัน XSS หมดความหมายไปเกือบทั้งหมด — ถ้ามีช่องให้แทรกข้อความเข้ามาได้
// สักจุด โค้ดนั้นจะทำงานทันที และเว็บนี้มี HN ผู้ป่วยกับสิทธิ์ลบข้อมูลอยู่ในมือ
//
// ตัดตรง ๆ ไม่ได้เพราะ Next.js ต้องฝังสคริปต์ในหน้าเพื่อทำให้หน้าเว็บโต้ตอบได้
// จึงต้องออก "ใบอนุญาต" (nonce) สุ่มใหม่ทุกคำขอ แล้วติดไว้กับสคริปต์ของเราเอง
// สคริปต์ที่ไม่มีใบอนุญาตจะไม่ถูกรันเลย แม้จะฝังอยู่ในหน้าเดียวกัน
//
// 🚨 ใบอนุญาตต้องสุ่มใหม่ทุกคำขอ ห้ามใช้ค่าคงที่เด็ดขาด
//    ค่าคงที่ = ผู้โจมตีรู้ค่าล่วงหน้า แล้วแนบมากับโค้ดที่แทรกเข้ามาได้ทันที
//
// 🚨 style-src ยังต้องมี 'unsafe-inline' ต่อไป (กฎเหล็กข้อของโปรเจกต์นี้)
//    ทั้งเว็บวาดด้วยสไตล์ฝังในแท็กราว 600 จุด ตัดออกแล้วหน้าเว็บกลายเป็นข้อความเปล่า
function makeNonce() {
  // crypto ของ Edge runtime มีเสมอ — แต่กันไว้เผื่อสภาพแวดล้อมที่ไม่มี
  try {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    let bin = '';
    for (const b of a) bin += String.fromCharCode(b);
    return btoa(bin);
  } catch (e) {
    return btoa(String(Math.random()) + ':' + String(Math.random()));
  }
}

function cspOf(nonce) {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    // 'strict-dynamic' = สคริปต์ที่ได้รับอนุญาตแล้ว โหลดสคริปต์ตัวอื่นต่อได้
    // จำเป็นเพราะ Next.js โหลดไฟล์ของตัวเองต่อเป็นทอด ๆ
    // ⚠️ ตอนรันในเครื่องต้องมี 'unsafe-eval' ให้ตัวรีเฟรชอัตโนมัติ (เว็บจริงไม่มี)
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'" + (isDev ? " 'unsafe-eval'" : ''),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'" + (isDev ? ' ws: wss:' : ''),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
}

// ติดใบอนุญาตกับคำตอบ แล้วบอก Next.js ให้เอาไปแปะสคริปต์ของตัวเองด้วย
function withCsp(res, nonce, csp) {
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export async function middleware(req) {
  const nonce = makeNonce();
  const csp = cspOf(nonce);
  // ส่งต่อให้ Next.js ทางส่วนหัวของคำขอ — Next อ่านตรงนี้แล้วแปะ nonce ให้สคริปต์เอง
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-nonce', nonce);
  reqHeaders.set('Content-Security-Policy', csp);
  const pass = () => withCsp(NextResponse.next({ request: { headers: reqHeaders } }), nonce, csp);

  if (!authEnabled()) return pass();

  // 🚨 ต้องล็อกแต่ยังไม่มีรหัส = ตั้งค่าไม่ครบ ปิดตายทั้งเว็บรวมหน้าเข้าสู่ระบบ
  //    ห้ามปล่อยผ่าน และห้ามให้เดารหัสว่างเข้ามาได้ (ผลตรวจข้อ ส-2)
  //    เข้าเว็บไม่ได้เลยแบบนี้สังเกตเห็นภายในนาทีเดียว ดีกว่าเปิดโล่งเป็นเดือนโดยไม่มีใครรู้
  if (!authConfigured()) {
    return new NextResponse('ระบบยังไม่ได้ตั้งรหัสผ่าน (MRV_PASSWORD) ผู้ดูแลต้องตั้งค่าก่อนใช้งาน', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  const path = req.nextUrl.pathname;
  // หน้าเข้าสู่ระบบกับเส้นทางตรวจรหัส ต้องเข้าได้เสมอ ไม่งั้นวนไม่จบ
  if (path === '/login' || path === '/api/auth') return pass();

  // ตรวจบัตรผ่านฝั่งเซิร์ฟเวอร์เอง — ทั้งลายเซ็นและอายุ (ผลตรวจข้อ ก-15)
  // 🚨 ห้ามกลับไปเทียบค่าคงที่ตรง ๆ อีก บัตรจะกลายเป็นบัตรตลอดชีพทันที
  const got = req.cookies.get(AUTH_COOKIE);
  if (got && (await authCookieValid(got.value))) {
    // ── ต่ออายุบัตรให้เองเมื่อใช้ไปเกินครึ่งอายุแล้ว (กฎกลางข้อ 24) ──────────
    //
    // 🚨 นับจาก "ครั้งสุดท้ายที่ใช้" ไม่ใช่ "วันที่ออกบัตร"
    //    คอมห้องยาเปิดเว็บทุกวัน แต่เดิมจู่ ๆ วันหนึ่งก็ถูกเด้งออกกลางงาน
    //    เภสัชกรที่กำลังกรอกยาคืนค้างอยู่ต้องหยุดไปตามหารหัส ซึ่งไม่มีใครจำได้
    //
    // 🚨 ต่อเมื่อเกินครึ่งอายุเท่านั้น ไม่ใช่ต่อทุกคำขอ
    //    ต่อทุกคำขอ = เขียนคุกกี้ใหม่หลายสิบครั้งต่อนาทีโดยไม่ได้อะไรเพิ่ม
    const res = pass();
    if (authCookieStale(got.value)) {
      res.cookies.set(AUTH_COOKIE, await issueAuthCookie(), authCookieOpts());
    }
    return res;
  }

  // เส้นทาง API ตอบเป็นรหัส 401 ไม่ใช่พาไปหน้าเข้าสู่ระบบ
  // (ฝั่งจอจะได้รู้ว่าต้องพาไปกรอกรหัสใหม่ ไม่ใช่ได้หน้า HTML มาแล้วแปลง JSON พัง)
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ', needAuth: true }, { status: 401 });
  }

  const to = req.nextUrl.clone();
  to.pathname = '/login';
  return withCsp(NextResponse.redirect(to), nonce, csp);
}

export const config = {
  // 🚨 manifest.webmanifest ต้องเปิดได้โดยไม่ต้องล็อกอิน
  //    ระบบปฏิบัติการอ่านไฟล์นี้ตอนกด "เพิ่มลงหน้าจอโฮม" โดยไม่ส่งคุกกี้ไปด้วย
  //    ถ้ากั้นไว้ มือถือจะอ่านไม่ได้แล้วเมนูนั้นไม่ทำงาน (ชุด 5 · 1 ก.ย. 2569)
  //    ในไฟล์ไม่มีข้อมูลผู้ป่วยเลย มีแค่ชื่อเว็บกับที่อยู่ไอคอน
  matcher: [
    // 🚨 เส้นทาง API ต้องผ่านประตูนี้เสมอ ห้ามมีข้อยกเว้นนามสกุลไฟล์ (ผลตรวจข้อ ก-6)
    //    ตัวกรองข้างล่างเทียบนามสกุลกับเส้นทางทั้งเส้น ทำให้ /api/returns/12.png
    //    ข้ามประตูตรวจรหัสไปทั้งดุ้น · ตอนนี้ยังไม่มีข้อมูลรั่วเพราะ Number('12.png')
    //    ไม่ใช่ตัวเลขจึงตอบ 400 กลับมา แต่เป็นระเบิดเวลา — เพิ่มเส้นทางแบบ [id]
    //    ใหม่วันไหน จะไม่มีการตรวจรหัสตั้งแต่วันแรกโดยไม่มีอะไรเตือน
    '/api/:path*',
    // หน้าเว็บทั่วไป — ยกเว้นไฟล์ของ Next เอง กับไฟล์รูป/ฟอนต์
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)'
  ]
};
