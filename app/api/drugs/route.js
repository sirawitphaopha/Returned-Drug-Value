// รายการยาทั้งหมด — โหลดทีเดียวแล้วค้นในเครื่อง (มอคอัปค้นแบบทันที ไม่มีดีเลย์)
import { NextResponse } from 'next/server';
import { loadCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const drugs = await loadCatalog();
    return NextResponse.json({ drugs: drugs });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'โหลดรายการยาไม่สำเร็จ' }, { status: 500 });
  }
}
