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
//
// ── หน้าที่ที่สอง: บัตรผ่านหมดอายุแล้วต้องพากลับไปกรอกรหัส (ผลตรวจข้อ ก-15) ──
//
// ประตูตรวจรหัสตอบ 401 พร้อมธง needAuth มาตั้งแต่แรก แต่ไม่เคยมีใครอ่านธงนั้นเลย
// ผลคือพอบัตรหมดอายุ (30 วัน) หรือผู้ดูแลเปลี่ยนรหัส เภสัชกรจะเห็นแค่
// "โหลดข้อมูลไม่สำเร็จ" ซ้ำ ๆ ทุกปุ่มที่กด โดยไม่มีอะไรบอกว่าต้องเข้าสู่ระบบใหม่
// เป็นอาการที่ดูเหมือนเว็บพัง ทั้งที่จริงแค่ต้องกรอกรหัสอีกครั้งเดียว
//
// 🚨 ดักที่ทางออกทางเดียวเหมือนกัน เพิ่มเส้นทาง API ใหม่ทีหลังก็ได้รับการดูแลเอง
function installFetchGuard(app) {
  app.fetchT = async (url, opts, ms) => {
    const method = String((opts && opts.method) || 'GET').toUpperCase();
    if (app.state && app.state.demo && method !== 'GET') {
      app.toast('อยู่ในโหมดดูตัวอย่าง ข้อมูลจริงไม่ถูกแตะต้อง', 'ปิดโหมดก่อนถึงจะบันทึกได้', false);
      // คืนคำตอบปลอมหน้าตาเหมือนของจริง ฝั่งที่เรียกจะได้ไม่พังตอนอ่าน .json()
      return {
        ok: false,
        status: 403,
        json: async () => ({ error: 'อยู่ในโหมดดูตัวอย่าง' })
      };
    }

    const res = await fetchT(url, opts, ms);

    // ⚠️ ต้องอ่าน "สำเนา" ของคำตอบ ไม่ใช่ตัวจริง เพราะเนื้อหาอ่านได้ครั้งเดียว
    //    ถ้าอ่านตัวจริงตรงนี้ ฝั่งที่เรียกจะได้กล่องเปล่าไปแทน
    if (res && res.status === 401 && typeof res.clone === 'function') {
      let needAuth = false;
      try { needAuth = !!(await res.clone().json()).needAuth; } catch (e) { needAuth = false; }
      if (needAuth && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        app.toast('หมดเวลาเข้าสู่ระบบแล้ว', 'กำลังพาไปกรอกรหัสผ่านใหม่', false);
        // หน่วงให้ข้อความขึ้นทันเห็นก่อนเปลี่ยนหน้า
        setTimeout(() => { window.location.href = '/login'; }, 900);
      }
    }
    return res;
  };
}

export function installHandlers(app) {
  installFetchGuard(app);   // ต้องมาก่อนตัวอื่น ฟังก์ชันอื่นเรียก app.fetchT ได้ทันที
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
