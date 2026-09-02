// ร่างที่กรอกค้าง เก็บบนเซิร์ฟเวอร์ (v0.14.0.0)
//
// พี่กันสั่ง 31 ส.ค. 2569 หลังเล่าความกลัวที่แท้จริง
//   "สิ่งที่เรากลัวที่สุด คือกรอกไปชั่วโมงนึง แล้วเน็ตหลุด และกรอกไปแล้วคอมรีสตาร์ต"
//
// 🚨 ร่างในเส้นทางนี้ยังไม่ใช่ข้อมูลจริง — ไม่เข้าหน้าประวัติ ไม่เข้ายอด KPI
//    ไม่กินเลข Lot · จนกว่าจะกดบันทึกแล้วเข้า mr_return ตามปกติ
//
// 🚨 ยังเก็บในเครื่องเหมือนเดิมทุกอย่าง ตรงนี้เป็นสำเนาสำรองอีกชั้น
//    เน็ตหลุดก็กรอกต่อได้ปกติ แล้วค่อยส่งขึ้นตอนเน็ตกลับมา
import { NextResponse } from 'next/server';
import { apiFail } from '@/lib/apiError';
import { getAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const KEEP_DAYS = 7;          // พี่กันเคาะ 31 ส.ค. 2569 — เผื่อวันหยุดยาวติดกัน
const MAX_ROWS = 400;         // ล็อตใหญ่สุดที่เคยเจอไม่ถึง 100 แถว เผื่อไว้ 4 เท่า

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max || 120) : '');

// ── รายการร่างทั้งหมดที่ยังไม่หมดอายุ ────────────────────────────────────────
export async function GET(req) {
  try {
    const u = new URL(req.url);
    const device = clean(u.searchParams.get('device'));
    const tab = clean(u.searchParams.get('tab'), 60);
    if (!device) return NextResponse.json({ drafts: [] });

    const db = getAdmin();
    const { data, error } = await db.rpc('mr_draft_list', {
      p_device: device, p_tab: tab, p_days: KEEP_DAYS
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ drafts: Array.isArray(data) ? data : [], keepDays: KEEP_DAYS });
  } catch (e) {
    // 🚨 ห้ามส่งข้อความผิดพลาดดิบกลับเบราว์เซอร์ (ผลตรวจข้อ ต-16)
    return apiFail("drafts.GET", e, "อ่านร่างที่กรอกค้างไม่สำเร็จ");
  }
}

// ── บันทึกร่าง (เรียกถี่ ต้องเบา) ────────────────────────────────────────────
export async function PUT(req) {
  try {
    const body = await req.json();
    const device = clean(body.deviceId);
    const tab = clean(body.tabId, 60);
    if (!device || !tab) return NextResponse.json({ error: 'ไม่รู้ว่าเป็นเครื่องไหน' }, { status: 400 });

    const rows = Array.isArray(body.rows) ? body.rows.slice(0, MAX_ROWS) : [];

    const db = getAdmin();
    const { error } = await db.rpc('mr_draft_put', {
      p: {
        deviceId: device,
        tabId: tab,
        rows: rows,
        batchId: clean(body.batchId, 40),
        hn: clean(body.hn, 40),
        source: clean(body.source, 20),
        pcuSite: clean(body.pcuSite, 80),
        date: clean(body.date, 10),
        saveFailed: !!body.saveFailed,
        failedBy: clean(body.failedBy, 80)
      }
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, rows: rows.length });
  } catch (e) {
    return apiFail("drafts.PUT", e, "เก็บร่างขึ้นเซิร์ฟเวอร์ไม่สำเร็จ");
  }
}

// ── ลบร่าง (บันทึกสำเร็จ · กดทิ้ง · ย้ายไปเครื่องอื่น) ──────────────────────
export async function DELETE(req) {
  try {
    const u = new URL(req.url);
    const device = clean(u.searchParams.get('device'));
    const tab = clean(u.searchParams.get('tab'), 60);
    if (!device || !tab) return NextResponse.json({ error: 'ไม่รู้ว่าจะลบร่างของเครื่องไหน' }, { status: 400 });

    const db = getAdmin();
    const { error } = await db.rpc('mr_draft_drop', { p_device: device, p_tab: tab });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiFail("drafts.DELETE", e, "ลบร่างไม่สำเร็จ");
  }
}
