// ติดเมธอดทั้งหมดเข้ากับตัวแอป — เรียกครั้งเดียวใน constructor
import { fetchT } from '../helpers';
import { uiActions } from './ui';
import { dataActions } from './data';
import { recordActions } from './record';
import { historyActions } from './history';
import { summaryActions } from './summary';
import { settingsActions } from './settings';
import { pricesActions } from './prices';
import { demoActions } from './demo';
import { himportActions } from './himport';
import { lotsActions } from './lots';
import { catalogActions } from './catalog';

// ── ประตูกันโหมดดูตัวอย่างทะลุไปแตะข้อมูลจริง ────────────────────────────────
//
// 🚨 ปัญหาที่ผลตรวจจับได้ (ข้อ ว-1 ใน docs/AUDIT-2026-08-25.md)
//
//    ข้อมูลตัวอย่างใช้เลขแถว 1, 2, 3, … ชุดเดียวกับเลขของแถวจริงใน mr_return
//    เปิดโหมดตัวอย่างให้ผู้บริหารดู แล้วกด "ลบ" แถวตัวอย่างเพื่อโชว์วิธีลบ
//    → เบราว์เซอร์ยิง DELETE /api/returns/57 จริง → แถวจริงหมายเลข 57 หายไปจากฐาน
//    กด "แก้" แล้วเปลี่ยนจำนวนยิ่งแย่กว่า เพราะแถวยังอยู่ครบ ไม่มีร่องรอย
//    ไม่มีใครมีทางรู้ว่าตัวเลขเพี้ยนไปแล้ว
//
//    เดิมมีการกันไว้ทีละฟังก์ชัน 8 จุด แต่ขาดไปอีก 6 จุด (ลบ · แก้ · กู้คืน ·
//    ส่งออก CSV · แก้ราคา · แก้คลังยา) เพราะต้องจำใส่เองทุกครั้งที่เขียนฟังก์ชันใหม่
//
// 🚨 วิธีแก้: ดักที่ทางออกทางเดียวแทนที่จะไล่ใส่ทีละที่
//    ทุกคำขอที่ "ไม่ใช่การอ่าน" ถูกตีกลับตั้งแต่ยังไม่ออกจากเครื่อง
//    เพิ่มฟังก์ชันใหม่ทีหลังก็ปลอดภัยเองโดยไม่ต้องจำ
//
// ⚠️ ห้ามเปลี่ยนให้ปล่อยผ่านเด็ดขาด — โหมดตัวอย่างมีไว้ให้กดเล่นได้ทุกปุ่ม
//    ความปลอดภัยของมันอยู่ที่ "ไม่มีอะไรออกไปถึงฐานจริง" ข้อเดียว
function installDemoGuard(app) {
  app.fetchT = (url, opts, ms) => {
    const method = String((opts && opts.method) || 'GET').toUpperCase();
    if (app.state && app.state.demo && method !== 'GET') {
      app.toast('อยู่ในโหมดดูตัวอย่าง ข้อมูลจริงไม่ถูกแตะต้อง', 'ปิดโหมดก่อนถึงจะบันทึกได้', false);
      // คืนคำตอบปลอมหน้าตาเหมือนของจริง ฝั่งที่เรียกจะได้ไม่พังตอนอ่าน .json()
      return Promise.resolve({
        ok: false,
        status: 403,
        json: async () => ({ error: 'อยู่ในโหมดดูตัวอย่าง' })
      });
    }
    return fetchT(url, opts, ms);
  };
}

export function installHandlers(app) {
  installDemoGuard(app);   // ต้องมาก่อนตัวอื่น ฟังก์ชันอื่นเรียก app.fetchT ได้ทันที
  uiActions(app);
  dataActions(app);
  recordActions(app);
  historyActions(app);
  summaryActions(app);
  settingsActions(app);
  pricesActions(app);
  demoActions(app);
  himportActions(app);
  lotsActions(app);
  catalogActions(app);
}
