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

export function renderVals(app) {
  const d = derive(app);
  const box = Object.assign(
    {},
    shellVals(app, d),
    recordVals(app, d),
    historyVals(app, d),
    summaryVals(app, d),
    sheetVals(app, d),
    settingsVals(app, d),
    pricesVals(app, d),
    signVals(app, d)
  );

  // เตือนตอน dev ถ้ามีคีย์ซ้ำข้ามไฟล์ — เคยพลาดมาแล้ว (fyLabel ของหน้าบันทึกโดน summary ทับ
  // จนค่าจากเซิร์ฟเวอร์ไม่เคยถูกใช้เลย และ setLight/setDark ซ้ำจนกลายเป็นโค้ดตาย)
  if (process.env.NODE_ENV !== 'production') {
    const seen = {};
    const parts = [
      ['shell', shellVals(app, d)], ['record', recordVals(app, d)], ['history', historyVals(app, d)],
      ['summary', summaryVals(app, d)], ['sheet', sheetVals(app, d)], ['settings', settingsVals(app, d)],
      ['prices', pricesVals(app, d)], ['sign', signVals(app, d)]
    ];
    for (const [file, obj] of parts) {
      for (const k of Object.keys(obj)) {
        if (seen[k]) console.warn('[vals] คีย์ซ้ำ:', k, '→', seen[k], 'ถูกทับด้วย', file);
        seen[k] = file;
      }
    }
  }

  return box;
}
