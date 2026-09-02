// ตรวจรหัสผ่านร่วมของห้องยา แล้วฝังคุกกี้ไว้ 30 วัน
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { AUTH_COOKIE, AUTH_DAYS, authConfigured, authEnabled, tokenOf, expectedToken, safeEqual, issueAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!authEnabled()) return NextResponse.json({ ok: true, off: true });

    // 🚨 ต้องล็อกแต่ยังไม่ตั้งรหัส = ตั้งค่าไม่ครบ ห้ามให้ใครเข้าได้ (ผลตรวจข้อ ส-2)
    //    ถ้าปล่อยผ่านตรงนี้ รหัสว่างจะกลายเป็นรหัสที่ถูกต้อง เพราะ tokenOf('') ตรงกับ expectedToken()
    if (!authConfigured()) {
      return NextResponse.json({ error: 'ระบบยังไม่ได้ตั้งรหัสผ่าน ผู้ดูแลต้องตั้งค่าก่อนใช้งาน' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const password = String(body.password || '');
    if (!password) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const got = await tokenOf(password);
    const want = await expectedToken();
    // เทียบแบบใช้เวลาเท่ากันเสมอ — ค่านี้เป็นค่าเดียวกับที่ฝังเป็นคุกกี้ (ผลตรวจข้อ ก-13)
    if (!safeEqual(got, want)) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // ค่าในคุกกี้ไม่ใช่ตัว token ตรง ๆ แล้ว แต่เป็นบัตรที่เซ็นพร้อมวันออกบัตร (ผลตรวจข้อ ก-15)
    res.cookies.set(AUTH_COOKIE, await issueAuthCookie(), {
      httpOnly: true,          // จาวาสคริปต์ในหน้าเว็บอ่านค่านี้ไม่ได้
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_DAYS * 24 * 60 * 60
    });
    return res;
  } catch (e) {
    return apiFail("auth.POST", e, "เข้าสู่ระบบไม่สำเร็จ");
  }
}

// ออกจากระบบ — ลบคุกกี้ทิ้ง
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
