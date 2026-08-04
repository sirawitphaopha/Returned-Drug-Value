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

export function renderVals(app) {
  const d = derive(app);
  return Object.assign(
    {},
    shellVals(app, d),
    recordVals(app, d),
    historyVals(app, d),
    summaryVals(app, d),
    sheetVals(app, d),
    settingsVals(app, d),
    pricesVals(app, d)
  );
}
