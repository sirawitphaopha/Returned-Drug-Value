// ตรวจรหัสผ่านร่วมของห้องยา แล้วฝังคุกกี้ไว้ 30 วัน
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_DAYS, authEnabled, tokenOf, expectedToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!authEnabled()) return NextResponse.json({ ok: true, off: true });

    const body = await req.json().catch(() => ({}));
    const got = await tokenOf(String(body.password || ''));
    const want = await expectedToken();
    if (got !== want) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, want, {
      httpOnly: true,          // จาวาสคริปต์ในหน้าเว็บอ่านค่านี้ไม่ได้
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_DAYS * 24 * 60 * 60
    });
    return res;
  } catch (e) {
    console.error('[api]', e);
    return NextResponse.json({ error: 'เข้าสู่ระบบไม่สำเร็จ' }, { status: 500 });
  }
}

// ออกจากระบบ — ลบคุกกี้ทิ้ง
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
