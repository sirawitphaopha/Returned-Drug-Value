// ═══════════════════════════════════════════════════════════════════════════
// แปลงไฟล์ PDF เป็นภาพ เพื่อ "ดูของจริง" ด้วยตา
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 กฎที่พี่กันตั้ง 26 ส.ค. 2569: "ถ้าเป็นการสร้างไฟล์ ต้องดูของจริง"
//    เครื่องนี้อ่าน PDF ตรง ๆ ไม่ได้ (ไม่มี poppler) จึงต้องแปลงเป็นภาพก่อน
//    ห้ามใช้ภาพหน้าจอของเว็บแทน เพราะนั่นคือการจำลอง ไม่ใช่ของที่ออกมาจริง
//
// วิธีใช้  node scripts/pdf-look.mjs out/ชื่อไฟล์.pdf
import fs from 'fs';
import path from 'path';
import { pdf } from 'pdf-to-img';

const file = process.argv[2];
if (!file) { console.error('ใส่ชื่อไฟล์ PDF มาด้วย'); process.exit(1); }

const OUT = 'out/look';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const doc = await pdf(file, { scale: 2 });
let n = 0;
for await (const img of doc) {
  n += 1;
  const p = path.join(OUT, 'หน้า-' + n + '.png');
  fs.writeFileSync(p, img);
  console.log('หน้า ' + n + ' → ' + p);
}
console.log('ทั้งหมด ' + n + ' หน้า');
