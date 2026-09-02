// พิสูจน์ว่า apiFail "เรียกใช้" ตัวปิดบังจริง ทั้งตอนเขียนบันทึกและตอนตอบผู้ใช้
//
// 🔑 กฎกลาง `pharmacy-web-logic` ข้อ 31
//    "ต้องเปิดดูบันทึกจริงหลังใส่ระบบเสมอ ไม่ใช่เชื่อว่าเขียนถูกแล้วจบ"
//
// ต่างจาก `scripts/mask-hn-test.mjs` ตรงที่อันนั้นตรวจตัวปิดบังเดี่ยว ๆ
// สองอย่างนี้พังแยกกันได้ — ตัวปิดบังถูกทุกเคสแต่ลืมเรียกในบางทาง
// = เลขผู้ป่วยหลุดทั้งที่ชุดทดสอบขึ้นเขียวหมด (เกิดขึ้นจริงตอนเขียนรอบแรก)
//
// 🚨 ต้องสวม next/server ด้วยของปลอมก่อน — node เรียก 'next/server' ตรง ๆ ไม่ได้
//    (ต้องเป็น 'next/server.js') แต่ห้ามแก้ไฟล์จริงเพื่อให้ชุดทดสอบรันผ่าน
//
//   node scripts/api-fail-proof.mjs
import fs from 'fs';

const ปลอม = 'const NextResponse = { json: (b, i) => ({ _body: b, status: (i && i.status) || 200 }) };';
const src = fs.readFileSync(new URL('../lib/apiError.js', import.meta.url), 'utf8')
  .replace(/^import \{ NextResponse \}.*$/m, ปลอม)
  .replace("from './maskHn'", 'from ' + JSON.stringify(new URL('../lib/maskHn.js', import.meta.url).href));

const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const { apiFail, apiWarn } = mod;

const เขียนไว้ = [];
const เดิม = console.error;
console.error = (...a) => เขียนไว้.push(a.join(' '));

// ① ภาษาช่างล้วน แบบที่ PostgREST ส่งมาจริง (ยืนยันด้วยฐานปลอมแล้ว 2 ก.ย. 2569)
const ช่าง = 'duplicate key value violates unique constraint "mr_return_hn_idx"'
  + ' (hn)=(1482055) HN 14820 at route.js:1430:9 v0.16.3.0';
const ก = await apiFail('returns.POST', new Error(ช่าง), 'บันทึกไม่สำเร็จ');

// ② มีตัวอักษรไทยปน — ทางนี้ส่งข้อความจริงกลับถึงผู้ใช้ จึงต้องปิดบังด้วย
const ไทยปน = 'ล็อตของ รพ.สต. หนองเชียงทูน ซ้ำกับผู้ป่วย HN 14820 เลข 9999001';
const ข = await apiFail('lots.PATCH', new Error(ไทยปน), 'แก้ล็อตไม่สำเร็จ');

apiWarn('drafts.PUT', new Error('เขียนร่างไม่สำเร็จ hn 1482055'));
console.error = เดิม;

const บันทึก = เขียนไว้.join(String.fromCharCode(10));
const หน้าจอ = ก._body.error + ' ' + ข._body.error;
const เลขคนไข้ = ['1482055', '14820', '9999001'];
const หลุดบันทึก = เลขคนไข้.filter((n) => บันทึก.includes(n));
const หลุดหน้าจอ = เลขคนไข้.filter((n) => หน้าจอ.includes(n));
const ต้องอ่านได้ = ['1430', '0.16.3.0'].filter((n) => บันทึก.includes(n));

console.log('');
console.log('  บรรทัดที่ถูกเขียนลงบันทึกจริง');
เขียนไว้.forEach((l) => console.log('   ', l.split(String.fromCharCode(10))[0]));
console.log('');
console.log('  ข้อความที่ส่งกลับถึงเภสัชกร');
console.log('    ภาษาช่างล้วน →', ก._body.error, '(สถานะ ' + ก.status + ')');
console.log('    มีไทยปน      →', ข._body.error);
console.log('');

let ผิด = 0;
const ตรวจ = (ok, ดี, แย่) => {
  if (ok) console.log('  ✅ ' + ดี);
  else { ผิด++; console.log('  ❌ ' + แย่); }
};

ตรวจ(!หลุดบันทึก.length,
  'ไม่มีเลขผู้ป่วยหลุดลงบันทึก (' + เลขคนไข้.join(' · ') + ')',
  'เลขผู้ป่วยหลุดลงบันทึก — ' + หลุดบันทึก.join(' · '));
ตรวจ(!หลุดหน้าจอ.length,
  'ไม่มีเลขผู้ป่วยหลุดไปหน้าจอผู้ใช้',
  'เลขผู้ป่วยหลุดไปหน้าจอผู้ใช้ — ' + หลุดหน้าจอ.join(' · '));
ตรวจ(ต้องอ่านได้.length === 2,
  'เลขบรรทัด 1430 กับเลขรุ่น 0.16.3.0 ยังอ่านได้ตามเดิม',
  'เลขบรรทัด/เลขรุ่นโดนปิดบังไปด้วย เปิดบันทึกมาแล้วไล่ต้นเหตุไม่ได้');
ตรวจ(ก._body.error === 'บันทึกไม่สำเร็จ',
  'ข้อความภาษาช่างถูกแทนด้วยข้อความไทยที่เตรียมไว้',
  'ข้อความภาษาช่างหลุดถึงเภสัชกร — ' + ก._body.error);
ตรวจ(ข._body.error.indexOf('หนองเชียงทูน') >= 0,
  'ข้อความไทยที่ตั้งใจเขียนยังส่งถึงผู้ใช้ครบใจความ',
  'ข้อความไทยถูกกลืนหาย ผู้ใช้จะไม่รู้ว่าเกิดอะไรขึ้น');

console.log('');
console.log(ผิด ? '  ❌ ยังไม่ผ่าน ' + ผิด + ' ข้อ' : '  ✅ ผ่านครบ');
process.exitCode = ผิด ? 1 : 0;
