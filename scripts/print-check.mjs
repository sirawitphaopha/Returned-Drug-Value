// ═══════════════════════════════════════════════════════════════════════════
// ตัวตรวจเอกสารที่พิมพ์ออกมา — สร้างไฟล์ PDF จริงเพื่อดูด้วยตา
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 พี่กันตั้งเป็นกฎ 26 ส.ค. 2569: "ถ้าเป็นการสร้างไฟล์ ต้องดูของจริง"
//    และ "อย่าจำลอง ถ้าจำลองก็ไม่เห็นของจริงสิ" · "ทำออกมาจนกว่าจะดี เทสทุกครั้ง"
//
// ทำไมต้องมีตัวนี้ — หน้าจอกับกระดาษไม่เหมือนกัน สิ่งที่ดูดีบนจอออกมาแล้วอาจ
// ตัวเล็กจิ๋ว ตารางแคบ ขึ้นหน้าใหม่ผิดที่ ฟอนต์ไม่ตรง หรือสีหาย
// เคยพลาดมาแล้วจริง — ตั้งขนาด 16 พอยต์ไว้ในกฎการพิมพ์ แต่โดนสไตล์ในแท็กทับหมด
// ดูบนจอไม่มีทางรู้ ต้องเปิดไฟล์ PDF จริงเท่านั้นถึงเห็น
//
// วิธีใช้
//   1. เปิดเซิร์ฟเวอร์ทดสอบไว้ก่อน (npm run dev)
//   2. node scripts/print-check.mjs
//   3. เปิดไฟล์ที่ได้ใน out/ ดูด้วยตา
//
// 🚨 ต้องมีคุกกี้เข้าสู่ระบบ — สคริปต์นี้อ่านรหัสจาก .env.local ให้เอง
//    ไม่ต้องพิมพ์รหัสลงไฟล์นี้เด็ดขาด
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'out';

// Chrome ในเครื่อง — ไม่ดาวน์โหลด Chromium เพิ่ม (หนัก 150 MB โดยไม่จำเป็น)
const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
];

function findChrome() {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ — แก้รายการ CHROME_PATHS ในไฟล์นี้');
}

// อ่านรหัสผ่านจาก .env.local (ไฟล์นี้อยู่ใน .gitignore ไม่ขึ้น git)
function readPassword() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
}

const log = (m) => console.log(m);

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--font-render-hinting=none']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    // ── เข้าสู่ระบบ ────────────────────────────────────────────────────────
    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
      log('เข้าสู่ระบบแล้ว');
    }

    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2500));

    // ── เปิดหน้ารายการ Lot แล้วกดใบสรุปใบแรก ────────────────────────────────
    const clickText = async (text, index) => {
      return page.evaluate((t, i) => {
        const els = [...document.querySelectorAll('[role="button"]')]
          .filter((e) => e.textContent.trim() === t || e.textContent.trim().indexOf(t) === 0);
        const el = els[i || 0];
        if (!el) return false;
        el.click();
        return true;
      }, text, index);
    };

    await clickText('ประวัติ');
    await new Promise((r) => setTimeout(r, 2000));
    await clickText('รายการ Lot');
    await new Promise((r) => setTimeout(r, 2500));

    // ใบแรก = ล็อตล่าสุด · ใบที่สอง = ล็อตที่มีรายการเยอะ (เอาไว้ดูการขึ้นหน้าใหม่)
    const targets = [
      { index: 0, name: 'ใบสรุป-ล็อตล่าสุด.pdf' },
      { index: 1, name: 'ใบสรุป-ล็อตรายการเยอะ.pdf' }
    ];

    for (const t of targets) {
      const ok = await clickText('ใบสรุป', t.index);
      if (!ok) { log('ข้าม ' + t.name + ' — ไม่มีล็อตลำดับที่ ' + (t.index + 1)); continue; }
      await new Promise((r) => setTimeout(r, 2500));

      // 🚨 ต้องรอฟอนต์ราชการโหลดเสร็จก่อน ไม่งั้นได้ฟอนต์สำรองในไฟล์
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.load) {
          await Promise.all([
            document.fonts.load('16pt "TH Sarabun New"'),
            document.fonts.load('700 16pt "TH Sarabun New"')
          ]).catch(() => {});
        }
      });
      await new Promise((r) => setTimeout(r, 600));

      // 🚨 ตรวจก่อนเสมอว่าใบเปิดอยู่จริง ไม่งั้นได้ PDF ของหน้าเว็บทั้งหน้าโดยไม่รู้ตัว
      const state = await page.evaluate(() => {
        const paper = document.querySelector(".slip-paper");
        return {
          hasPaper: !!paper,
          rows: paper ? paper.querySelectorAll("tbody tr").length : 0,
          bodyKids: document.body.children.length
        };
      });
      if (!state.hasPaper) {
        log("X " + t.name + " — ใบสรุปไม่ได้เปิดอยู่ ข้ามไป (ลูกของ body " + state.bodyKids + " ตัว)");
        continue;
      }
      log("ใบเปิดอยู่ · " + state.rows + " แถว");

      const file = path.join(OUT, t.name);
      await page.pdf({
        path: file,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
      });
      const kb = (fs.statSync(file).size / 1024).toFixed(0);
      log('สร้างแล้ว ' + file + '  (' + kb + ' KB)');

      // ปิดใบแล้วกลับไปหน้ารายการ Lot เพื่อเปิดใบถัดไป
      await page.evaluate(() => {
        const x = document.querySelector('[aria-label="ปิดใบสรุป"]');
        if (x) x.click();
      });
      await new Promise((r) => setTimeout(r, 1200));
    }

    log('เสร็จแล้ว — เปิดไฟล์ในโฟลเดอร์ out/ ดูด้วยตาได้เลย');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('ล้มเหลว: ' + e.message);
  process.exit(1);
});
