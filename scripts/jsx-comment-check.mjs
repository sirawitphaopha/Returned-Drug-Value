// ตรวจตำแหน่งคอมเมนต์ JSX — กันหน้าเว็บพัง 500 ทั้งใบ
//
// 🚨 พลาดเรื่องนี้มาแล้ว 3 ครั้งใน session เดียว (1 ก.ย. 2569)
//    ทุกครั้งอาการเหมือนกัน: หน้าเว็บขึ้น 500 ทั้งเว็บ ข้อความ Expected '</', got 'style'
//    ซึ่งชี้ไปที่บรรทัดถัดจากคอมเมนต์ ไม่ใช่ตัวคอมเมนต์เอง — ไล่ผิดที่ทุกครั้ง
//
// กติกาของ JSX: วงเล็บเปิดของ `{เงื่อนไข && (` · `.map(() => (` · `return (`
// รับ element ได้ชิ้นเดียว · คอมเมนต์ `{/* */}` นับเป็นอีกชิ้น
// จึงวางเป็นลูกตัวแรกไม่ได้ ต้องวางไว้ "ก่อน" บรรทัดที่เปิดวงเล็บ
//
//   ❌ {V.showMore && (          ✅ {/* คำอธิบาย */}
//        {/* คำอธิบาย */}          {V.showMore && (
//        <div>...                    <div>...
//
// การรัน:  node scripts/jsx-comment-check.mjs
import fs from 'fs';
import path from 'path';

const ROOTS = ['components', 'app'];
const OPENERS = /(&&\s*\(|\|\|\s*\(|=>\s*\(|return\s*\(|\?\s*\(|:\s*\()$/;

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (name !== 'node_modules') walk(p, out); continue; }
    if (/\.(jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const files = [];
for (const r of ROOTS) if (fs.existsSync(r)) walk(r, files);

let bad = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim().indexOf('{/*') !== 0) continue;
    const prev = lines[i - 1].trim();
    if (!OPENERS.test(prev)) continue;
    bad++;
    console.log('X ' + f + ':' + (i + 1));
    console.log('    บรรทัดก่อนหน้า  ' + prev);
    console.log('    คอมเมนต์        ' + lines[i].trim().slice(0, 70));
    console.log('    แก้: ย้ายคอมเมนต์ทั้งก้อนขึ้นไปไว้เหนือบรรทัดก่อนหน้า');
  }
}

console.log('');
console.log('ตรวจ ' + files.length + ' ไฟล์ · คอมเมนต์วางผิดที่ ' + bad + ' จุด');
process.exit(bad ? 1 : 0);
