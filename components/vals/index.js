// รวมค่าที่ใช้วาดจอทั้งหมดไว้ก้อนเดียว ชื่อคีย์เท่าเดิมกับมอคอัป
// แยกไฟล์ตามหน้า แต่ผลลัพธ์เป็น object ก้อนเดียวเหมือน renderVals ต้นฉบับ
import { derive } from './derive';
import { shellVals } from './shell';
import { recordVals } from './record';
import { historyVals } from './history';
import { summaryVals } from './summary';
import { sheetVals } from './sheet';
import { settingsVals } from './settings';
import { pricesVals } from './prices';
import { signVals } from './sign';
import { himportVals } from './himport';
import { lotsVals } from './lots';
import { catalogVals } from './catalog';

export function renderVals(app) {
  const d = derive(app);

  // 🚨 คำนวณทีละไฟล์ "ครั้งเดียว" แล้วใช้ทั้งการรวมร่างและการตรวจคีย์ซ้ำ (ผลตรวจข้อ ต-9)
  //    ของเดิมเรียก vals ทุกตัวซ้ำอีกรอบเพื่อตรวจ = ทำงานสองเท่าตอน dev โดยไม่จำเป็น
  //    และรายชื่อที่เอามาตรวจมีแค่ 8 ไฟล์ ขาด himport · lots · catalog ไป 3 ไฟล์
  //    ตัวตรวจที่ตรวจไม่ครบแย่กว่าไม่มีตัวตรวจ เพราะให้ความมั่นใจแบบผิด ๆ
  const parts = [
    ['shell', shellVals(app, d)],
    ['record', recordVals(app, d)],
    ['history', historyVals(app, d)],
    ['summary', summaryVals(app, d)],
    ['sheet', sheetVals(app, d)],
    ['settings', settingsVals(app, d)],
    ['prices', pricesVals(app, d)],
    ['sign', signVals(app, d)],
    ['himport', himportVals(app, d)],
    ['lots', lotsVals(app, d)],
    ['catalog', catalogVals(app, d)]
  ];

  const box = Object.assign({}, ...parts.map((p) => p[1]));

  // ── สวิตช์ดูโครงจาง (พี่กันสั่ง 27 ส.ค. 2569) ──────────────────────────
  // 🚨 เปิดสวิตช์แล้วต้องไม่มีข้อมูลจริงเหลืออยู่เลย
  //    ของเดิมแค่วาดโครงจางเพิ่มเข้าไป ข้อมูลจริงยังอยู่ครบ = ซ้อนกันสองชุด
  //    พี่กันเห็นแล้วทัก "เปิดโหมดนี้ ไม่โหลดข้อมูลจริงสิ"
  // 🚨 ทำที่จุดรวมร่างจุดเดียว ทุกหน้าได้ผลพร้อมกัน
  //    ถ้าไปดักทีละหน้าจะตกหล่นแน่นอน (มี 6 หน้าที่มีรายการ)
  if (app.state.skelDemo) {
    box.histRows = [];
    box.lotRows = [];
    box.catRows = [];
    box.priceRows = [];
    box.rows = [];
    box.sumTop = [];
    box.sumTopReturned = [];
    box.sumMonths = [];
    box.sumSources = [];
    box.lotEditRows = [];
    // ธงว่างต้องปิดด้วย ไม่งั้นจะขึ้นข้อความ "ไม่พบรายการ" ทับโครงจาง
    box.histEmpty = false;
    box.lotsEmpty = false;
    box.lotsFilteredOut = false;
    box.priceEmpty = false;
    box.catEmpty = false;
  }

  // เตือนตอน dev ถ้ามีคีย์ซ้ำข้ามไฟล์ — เคยพลาดมาแล้ว (fyLabel ของหน้าบันทึกโดน summary ทับ
  // จนค่าจากเซิร์ฟเวอร์ไม่เคยถูกใช้เลย และ setLight/setDark ซ้ำจนกลายเป็นโค้ดตาย)
  // 🚨 เพิ่มไฟล์ใหม่ใน parts ข้างบน = ได้รับการตรวจอัตโนมัติ ไม่ต้องมาเติมรายชื่อสองที่
  if (process.env.NODE_ENV !== 'production') {
    const seen = {};
    for (const [file, obj] of parts) {
      for (const k of Object.keys(obj)) {
        if (seen[k]) console.warn('[vals] คีย์ซ้ำ:', k, '→', seen[k], 'ถูกทับด้วย', file);
        seen[k] = file;
      }
    }
  }

  return box;
}
