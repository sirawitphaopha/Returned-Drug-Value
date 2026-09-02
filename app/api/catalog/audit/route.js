// ประวัติการแก้ยาแต่ละตัว — อ่านจาก drug_audit
//
// ตารางนี้กับ trigger ถูกสร้างไว้แล้วโดย ME-DRP (v0.9.10.0) เว็บนี้แค่มาอ่านต่อ
// trigger เป็น SECURITY DEFINER จึง **จับได้แม้แก้ตรงในหน้า Supabase**
// = ไม่มีทางแก้ยาแล้วไม่ทิ้งร่องรอย
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const id = Number(new URL(req.url).searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'ไม่พบรหัสยา' }, { status: 400 });

    const db = getAdmin();
    const res = await db
      .from('drug_audit')
      .select('id,action,changed_at,old_data,new_data')
      .eq('drug_id', id)
      .order('id', { ascending: false })
      .limit(50);
    if (res.error) throw new Error(res.error.message);

    return NextResponse.json({ rows: res.data || [] });
  } catch (e) {
    return apiFail("catalog/audit.GET", e, "โหลดประวัติไม่สำเร็จ");
  }
}
