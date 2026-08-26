// ประตูตรวจรหัสผ่านร่วมของห้องยา — กั้นทุกหน้าและทุกเส้นทาง API
//
// 🚨 ห้ามเปลี่ยนชื่อไฟล์นี้เป็น proxy.ts เด็ดขาด — Cloudflare Pages/Workers จะ build ไม่ผ่าน
//    (เคยพลาดมาแล้วที่ TB Dashboard ตอน Next.js 16)
//
// ตอนรันในเครื่องที่ยังไม่ตั้ง MRV_PASSWORD ประตูนี้เปิดทิ้งไว้ ไม่ล็อกอะไรเลย
// แต่เว็บจริงล็อกเสมอ — ลืมตั้งรหัสแล้วปิดตายทั้งเว็บ ไม่ใช่เปิดโล่ง (ดู lib/auth.js)
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authConfigured, authEnabled, expectedToken, safeEqual } from '@/lib/auth';

export async function middleware(req) {
  if (!authEnabled()) return NextResponse.next();

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
  if (path === '/login' || path === '/api/auth') return NextResponse.next();

  const got = req.cookies.get(AUTH_COOKIE);
  const want = await expectedToken();
  if (got && safeEqual(got.value, want)) return NextResponse.next();

  // เส้นทาง API ตอบเป็นรหัส 401 ไม่ใช่พาไปหน้าเข้าสู่ระบบ
  // (ฝั่งจอจะได้รู้ว่าต้องพาไปกรอกรหัสใหม่ ไม่ใช่ได้หน้า HTML มาแล้วแปลง JSON พัง)
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ', needAuth: true }, { status: 401 });
  }

  const to = req.nextUrl.clone();
  to.pathname = '/login';
  return NextResponse.redirect(to);
}

export const config = {
  matcher: [
    // 🚨 เส้นทาง API ต้องผ่านประตูนี้เสมอ ห้ามมีข้อยกเว้นนามสกุลไฟล์ (ผลตรวจข้อ ก-6)
    //    ตัวกรองข้างล่างเทียบนามสกุลกับเส้นทางทั้งเส้น ทำให้ /api/returns/12.png
    //    ข้ามประตูตรวจรหัสไปทั้งดุ้น · ตอนนี้ยังไม่มีข้อมูลรั่วเพราะ Number('12.png')
    //    ไม่ใช่ตัวเลขจึงตอบ 400 กลับมา แต่เป็นระเบิดเวลา — เพิ่มเส้นทางแบบ [id]
    //    ใหม่วันไหน จะไม่มีการตรวจรหัสตั้งแต่วันแรกโดยไม่มีอะไรเตือน
    '/api/:path*',
    // หน้าเว็บทั่วไป — ยกเว้นไฟล์ของ Next เอง กับไฟล์รูป/ฟอนต์
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)'
  ]
};
