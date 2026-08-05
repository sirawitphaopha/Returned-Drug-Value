// ประตูตรวจรหัสผ่านร่วมของห้องยา — กั้นทุกหน้าและทุกเส้นทาง API
//
// 🚨 ห้ามเปลี่ยนชื่อไฟล์นี้เป็น proxy.ts เด็ดขาด — Cloudflare Pages/Workers จะ build ไม่ผ่าน
//    (เคยพลาดมาแล้วที่ TB Dashboard ตอน Next.js 16)
//
// ถ้ายังไม่ได้ตั้งค่า MRV_PASSWORD ประตูนี้จะเปิดทิ้งไว้ ไม่ล็อกอะไรเลย
// เพื่อให้รันในเครื่องได้โดยไม่ต้องตั้งอะไรก่อน
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authEnabled, expectedToken } from '@/lib/auth';

export async function middleware(req) {
  if (!authEnabled()) return NextResponse.next();

  const path = req.nextUrl.pathname;
  // หน้าเข้าสู่ระบบกับเส้นทางตรวจรหัส ต้องเข้าได้เสมอ ไม่งั้นวนไม่จบ
  if (path === '/login' || path === '/api/auth') return NextResponse.next();

  const got = req.cookies.get(AUTH_COOKIE);
  const want = await expectedToken();
  if (got && got.value === want) return NextResponse.next();

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
  // ยกเว้นไฟล์ของ Next เอง กับไฟล์รูป/ฟอนต์ — ไม่ต้องตรวจ
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)']
};
