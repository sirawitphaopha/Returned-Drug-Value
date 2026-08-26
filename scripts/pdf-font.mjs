// ตรวจว่าไฟล์ PDF ใช้ฟอนต์อะไรจริง ๆ — อ่านจากไฟล์ ไม่ใช่จากหน้าจอ
//
// 🚨 ดูจากหน้าจอไม่มีทางรู้ เบราว์เซอร์อาจใช้ฟอนต์สำรองแทนโดยไม่บอกอะไรเลย
//    เคยพลาดมาแล้ว 26 ส.ค. 2569 (พี่กันทัก "เราบอกว่าไง ใน pdf ใช้ sarabun new")
//
// วิธีทำงาน — ไฟล์ PDF เก็บฟอนต์ที่ฝังไว้เป็นก้อนบีบอัด (FlateDecode)
// คลายทุกก้อนออกมาแล้วมองหาชื่อฟอนต์ที่อยู่ในตารางชื่อของไฟล์ฟอนต์
//
// วิธีใช้  node scripts/pdf-font.mjs out/ชื่อไฟล์.pdf
import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync(process.argv[2]);
const found = new Set();

// ชื่อฟอนต์ที่ไม่ได้บีบอัด (อยู่ในพจนานุกรมของเอกสาร)
const plain = buf.toString('latin1');
for (const m of plain.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#\-,]+)/g)) found.add('BaseFont: ' + m[1]);

// ชื่อที่อยู่ในก้อนบีบอัด — ตัวไฟล์ฟอนต์เองมีตารางชื่อเป็นตัวอักษรสองไบต์
let at = 0;
let blocks = 0;
while (true) {
  const i = plain.indexOf('stream', at);
  if (i < 0) break;
  let s = i + 6;
  if (plain[s] === String.fromCharCode(13)) s++;
  if (plain[s] === String.fromCharCode(10)) s++;
  const e = plain.indexOf('endstream', s);
  if (e < 0) break;
  at = e + 9;
  try {
    const out = zlib.inflateSync(buf.subarray(s, e));
    blocks++;
    // ตารางชื่อใน TTF เก็บเป็นตัวอักษรสองไบต์ — แทรกไบต์ศูนย์ระหว่างตัวอักษร
    const wide = out.toString('latin1').split(String.fromCharCode(0)).join('');
    for (const m of wide.matchAll(/(TH ?Sarabun ?New|Sarabun[A-Za-z]*|Charmonman|Arial|Times[A-Za-z ]*)/g)) {
      found.add('ในไฟล์ฟอนต์: ' + m[1]);
    }
  } catch (err) { /* ก้อนที่ไม่ได้บีบอัดแบบนี้ ข้ามไป */ }
}

console.log('ไฟล์ ' + process.argv[2] + ' · คลายก้อนได้ ' + blocks + ' ก้อน');
if (!found.size) console.log('  (ไม่พบชื่อฟอนต์)');
for (const f of [...found].sort()) console.log('  · ' + f);
