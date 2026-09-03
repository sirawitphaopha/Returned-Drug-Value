// พิสูจน์ว่าตัวร้องฝั่งเบราว์เซอร์ปิดบังเลขผู้ป่วยจริง และอ่านออก
//
// 🔑 กฎกลาง `pharmacy-web-logic` ข้อ 31 — ฝั่งเบราว์เซอร์ก็ต้องร้อง ไม่ใช่กลืนเงียบ
//
// 🚨 บทเรียนจาก ME-DRP: เขียนตัวช่วยกลางเสร็จแล้วเชื่อว่าใช้ได้ ผลคือได้ "[object Object]"
//    ต้องมีชุดที่ **เรียกตัวจริงแล้วดูข้อความที่ออกมา** ไม่ใช่แค่ทดสอบตัวปิดบังเดี่ยว ๆ
//
//   node scripts/client-log-proof.mjs
import fs from 'fs';

// 🚨 node ต้องการนามสกุล `.js` ต่อท้าย แต่โค้ดในโปรเจกต์เขียนแบบไม่มี (Next.js เติมให้เอง)
//    จึงต้องสวมที่อยู่ให้ก่อน — ห้ามแก้ไฟล์จริงเพื่อให้ชุดทดสอบรันผ่าน
//    (ท่าเดียวกับ scripts/api-fail-proof.mjs)
const src = fs.readFileSync(new URL('../lib/clientLog.js', import.meta.url), 'utf8')
  .replace("from './maskHn'", 'from ' + JSON.stringify(new URL('../lib/maskHn.js', import.meta.url).href));
const { logFail, logWarn } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const เขียนไว้ = [];
const เดิมErr = console.error;
const เดิมWarn = console.warn;
console.error = (...a) => เขียนไว้.push(a.join(' '));
console.warn = (...a) => เขียนไว้.push(a.join(' '));

// ① ก้อนของ supabase-js — ตัวที่ทำให้ ME-DRP ได้ [object Object]
logFail('loadServerDrafts (ร่างที่ค้างบนเซิร์ฟเวอร์)', {
  message: 'permission denied for table mr_draft',
  code: '42501', details: 'HN 14820 ของผู้ป่วยเลข 1482055', hint: null
});

// ② Error ปกติ
logFail('pullDrugs (คลังยาชุดใหม่)', new Error('fetch failed at route.js:1430:9'));

// ③ ที่เก็บในเครื่องเต็ม — ล้มได้ตามปกติ ใช้ logWarn
logWarn('writeCache (เก็บคลังยาลงเครื่อง)', new Error('QuotaExceededError'));

console.error = เดิมErr;
console.warn = เดิมWarn;

const รวม = เขียนไว้.join(String.fromCharCode(10));
const เลขคนไข้ = ['14820', '1482055'];
const หลุด = เลขคนไข้.filter((n) => รวม.includes(n));

console.log('');
console.log('  บรรทัดที่ร้องออกมาจริง');
เขียนไว้.forEach((l) => console.log('   ', l));
console.log('');

let ผิด = 0;
const ตรวจ = (ok, ดี, แย่) => {
  if (ok) console.log('  ✅ ' + ดี);
  else { ผิด++; console.log('  ❌ ' + แย่); }
};

ตรวจ(!หลุด.length,
  'ไม่มีเลขผู้ป่วยหลุดลงคอนโซลเลย (' + เลขคนไข้.join(' · ') + ')',
  'เลขผู้ป่วยหลุดลงคอนโซล — ' + หลุด.join(' · '));
ตรวจ(รวม.indexOf('[object Object]') < 0,
  'ไม่มี [object Object] — ก้อนของ supabase-js อ่านออก',
  'เจอ [object Object] ร้องแล้วอ่านไม่รู้เรื่อง');
ตรวจ(รวม.indexOf('42501') >= 0,
  'รหัสฐาน 42501 ยังอ่านได้ ไม่โดนปิดบัง',
  'รหัสฐานโดนปิดบังไปด้วย ไล่ต้นเหตุไม่ได้');
ตรวจ(รวม.indexOf('1430') >= 0,
  'เลขบรรทัด 1430 ยังอ่านได้',
  'เลขบรรทัดโดนปิดบังไปด้วย');
ตรวจ(เขียนไว้.length === 3,
  'ร้องครบทั้ง 3 ครั้ง ไม่มีอันไหนเงียบหาย',
  'ร้องไม่ครบ ได้ ' + เขียนไว้.length + ' จาก 3');

console.log('');
console.log(ผิด ? '  ❌ ยังไม่ผ่าน ' + ผิด + ' ข้อ' : '  ✅ ผ่านครบ');
process.exitCode = ผิด ? 1 : 0;
