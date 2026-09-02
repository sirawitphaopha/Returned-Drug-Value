// ตรวจว่าหลังบ้านเขียนบันทึกครบทุกจุดไหม
//
// 🔑 กฎกลาง `pharmacy-web-logic` ข้อ 31 (บันทึกของเซิร์ฟเวอร์)
//
// ตรวจ 3 อย่าง
//   ① ทุก catch ใน app/api/ ต้องจบด้วย apiFail หรือ apiWarn
//   ② ห้ามมี console.error เขียนตรง ๆ นอก lib/apiError.js
//   ③ ป้ายที่ส่งให้ apiFail ต้องบอกได้ว่าพังที่เส้นทางไหน วิธีไหน (ห้ามซ้ำกันทั้งเว็บ)
//
//   node scripts/api-log-check.mjs
import fs from 'fs';
import path from 'path';

function walk(dir, out, want) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p, out, want); continue; }
    if (want.test(name)) out.push(p.split(path.sep).join('/'));
  }
  return out;
}

let ผิด = 0;

// ── ① ทุก catch ต้องใช้ตัวช่วยกลาง ────────────────────────────────────────
console.log('');
console.log('  ① catch ในหลังบ้านต้องใช้ apiFail / apiWarn');
const routes = walk('app/api', [], /^route\.js$/);
let catchAll = 0, catchBad = 0;
for (const f of routes) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/\}\s*catch\s*\(/.test(lines[i])) continue;
    catchAll++;
    // มองหาตัวช่วยกลางในบล็อกนี้ (ไม่เกิน 8 บรรทัด)
    let ok = false;
    for (let j = i; j < Math.min(i + 8, lines.length); j++) {
      if (/apiFail\(|apiWarn\(/.test(lines[j])) { ok = true; break; }
      // catch เปล่าที่ตั้งใจปล่อยผ่าน ต้องมีคอมเมนต์อธิบายในบรรทัดเดียวกัน
      if (j === i && /catch\s*\([^)]*\)\s*\{\s*\/\*.*\*\/\s*\}/.test(lines[i])) { ok = true; break; }
      if (j > i && /^\s*\}\s*$/.test(lines[j])) break;
    }
    if (!ok) { catchBad++; ผิด++; console.log('     X ' + f + ':' + (i + 1) + '  ' + lines[i].trim()); }
  }
}
console.log('     ' + (catchBad ? '❌' : '✅') + ' catch ทั้งหมด ' + catchAll + ' จุด · ไม่ใช้ตัวช่วยกลาง ' + catchBad + ' จุด');

// ── ② ห้าม console.error นอกตัวช่วยกลาง ───────────────────────────────────
console.log('');
console.log('  ② console.error ต้องอยู่ใน lib/apiError.js ที่เดียว');
const src = [].concat(
  walk('app', [], /\.(js|jsx)$/),
  walk('components', [], /\.(js|jsx)$/),
  walk('lib', [], /\.(js|jsx)$/)
);
let leak = 0;
for (const f of src) {
  if (f.endsWith('lib/apiError.js')) continue;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => {
    if (!/console\.error\(/.test(l)) return;
    // ฝั่งเบราว์เซอร์เขียนลงคอนโซลของเครื่องผู้ใช้เอง ไม่ได้ออกไปนอกโรงพยาบาล
    // app/error.js เป็นตัวจับข้อผิดพลาดของหน้าเว็บ ทำงานในเบราว์เซอร์ของผู้ใช้เอง
    // เขียนลงคอนโซลเครื่องนั้น ไม่ได้ออกไปนอกโรงพยาบาล จึงไม่ต้องปิดบัง
    const เป็นฝั่งจอ = f.startsWith('components/') || f.startsWith('app/login/') || f === 'app/error.js';
    if (เป็นฝั่งจอ) return;
    leak++; ผิด++;
    console.log('     X ' + f + ':' + (i + 1) + '  ' + l.trim().slice(0, 80));
  });
}
console.log('     ' + (leak ? '❌' : '✅') + ' console.error ที่หลุดออกนอกตัวช่วยกลาง ' + leak + ' จุด');

// ── ③ ป้ายต้องไม่ซ้ำกัน ───────────────────────────────────────────────────
console.log('');
console.log('  ③ ป้ายของ apiFail ต้องบอกได้ว่าพังตรงไหน (ห้ามซ้ำ)');
const tags = new Map();
for (const f of routes) {
  const txt = fs.readFileSync(f, 'utf8');
  // 🚨 ต้องรับทั้งอัญประกาศเดี่ยวและคู่ — ตัวแทนที่อัตโนมัติเขียนเป็นคู่
  //    เคยพลาด: regex รับแต่เดี่ยว แล้วรายงานว่าเจอ 0 ป้ายทั้งที่มี 27 จุด
  //    ตัวตรวจที่รายงานผิดแย่กว่าไม่มีตัวตรวจ
  const re = /api(?:Fail|Warn)\(\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(txt))) {
    const t = m[1];
    tags.set(t, (tags.get(t) || 0) + 1);
  }
}
const ซ้ำ = [...tags.entries()].filter(([, n]) => n > 1);
for (const [t, n] of ซ้ำ) { ผิด++; console.log('     X ป้าย "' + t + '" ใช้ซ้ำ ' + n + ' จุด'); }
console.log('     ' + (ซ้ำ.length ? '❌' : '✅') + ' ป้ายทั้งหมด ' + tags.size + ' แบบ · ซ้ำ ' + ซ้ำ.length + ' แบบ');

console.log('');
console.log(ผิด ? '  ❌ ยังไม่ครบ ' + ผิด + ' จุด' : '  ✅ ผ่านครบทั้งสามข้อ');
process.exitCode = ผิด ? 1 : 0;
