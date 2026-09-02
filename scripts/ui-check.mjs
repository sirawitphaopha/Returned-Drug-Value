// ═══════════════════════════════════════════════════════════════════════════
// ตัวถ่ายภาพหน้าจอเว็บจริง — ใช้ตรวจงานหน้าตาโดยไม่ต้องรบกวนพี่กัน
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 ใช้เว็บจริงที่รันอยู่เท่านั้น ห้ามทำหน้าจำลองมาถ่ายแทน
//    (กฎที่พี่กันตั้ง 26 ส.ค. 2569 · หน้าจำลองผ่านหมดแต่เว็บจริงมีบั๊ก)
//
// วิธีใช้
//   node scripts/ui-check.mjs lots        หน้ารายการ Lot
//   node scripts/ui-check.mjs lots 430    หน้ารายการ Lot บนจอมือถือ
//   node scripts/ui-check.mjs record      หน้าบันทึก
//   node scripts/ui-check.mjs history     หน้าประวัติ
//
// เปิดหน้าต่างเบราว์เซอร์ให้เห็นด้วยตา (พี่กันขอ 26 ส.ค. 2569 "เราไม่เห็นเธอเปิดดูเลย")
//   SHOW=1 node scripts/ui-check.mjs lots
// ค้างหน้าต่างไว้ให้ดูนานขึ้น (วินาที)
//   SHOW=1 HOLD=30 node scripts/ui-check.mjs lots
//
// ภาพออกที่ out/ui/
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'out/ui';
const where = process.argv[2] || 'lots';
const width = Number(process.argv[3] || 1400);

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
];
function findChrome() {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ');
}
function readPassword() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
}
const log = (m) => console.log(m);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  // SHOW=1 = เปิดหน้าต่าง Chrome ให้เห็นจริง ๆ ว่ากำลังเทสอะไรอยู่
  const show = process.env.SHOW === (String.fromCharCode(49));
  const hold = Number(process.env.HOLD || (show ? 15 : 0));
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: show ? false : 'new',
    args: ['--no-sandbox', '--font-render-hinting=none', '--window-size=' + width + ',960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });

    // เก็บข้อผิดพลาดในคอนโซลไว้รายงาน — หน้าพังเพราะโค้ดผิดจะเห็นตรงนี้ก่อนดูภาพ
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }

    // 🚨 ตั้งชื่อเครื่องก่อน ไม่งั้นหน้าต่างถามชื่อเครื่องบังจอทุกภาพ
    //    ต้องเป็นชื่อเครื่องทดสอบ ห้ามใช้ชื่อ 8 เครื่องจริง (กฎข้อ 3.64)
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);

    const clickText = async (text, index) => page.evaluate((t, i) => {
      const els = [...document.querySelectorAll('[role="button"]')]
        .filter((e) => e.textContent.trim() === t || e.textContent.trim().indexOf(t) === 0);
      const el = els[i || 0];
      if (!el) return false;
      el.click();
      return true;
    }, text, index);

    if (where === 'lots') {
      await clickText('ประวัติ');
      await wait(1800);
      await clickText('รายการ Lot');
      await wait(2500);
      // รายงานตัวเลือกในดรอปดาวน์กรอง — ต้องเห็นว่ามี รพ.สต. ให้เลือกครบทุกแห่ง
      const opts = await page.evaluate(() => {
        const sel = document.querySelector('select[aria-label="กรองตามแหล่งที่มา"]');
        if (!sel) return ['ไม่เจอดรอปดาวน์'];
        return [...sel.querySelectorAll("option")].map((o) => o.textContent.trim());
      });
      log('ตัวเลือกในดรอปดาวน์กรอง ' + opts.length + ' รายการ:');
      log('   ' + opts.join(' · '));
    } else if (where === 'home') {
      // ทดสอบว่ากดชื่อเว็บแล้วกลับหน้าแรกจริงไหม
      // ไปหน้าที่ไม่ใช่หน้าแรกก่อน แล้วค่อยกดชื่อเว็บ
      await clickText('สรุป');
      await wait(1800);
      // ต้องพิสูจน์ว่า "ก่อนกดไม่ได้อยู่หน้าบันทึกอยู่แล้ว" ไม่งั้นผลผ่านแบบหลอกตัวเอง
      const before = await page.evaluate(() => document.body.innerText.replace(/s+/g, ' ').slice(0, 90));
      const clicked = await page.evaluate(() => {
        const el = [...document.querySelectorAll('[aria-label="กลับไปหน้าบันทึก"]')][0];
        if (!el) return false;
        el.click();
        return true;
      });
      await wait(1500);
      const after = await page.evaluate(() => document.body.innerText.indexOf('ค้นหายาที่รับคืน') >= 0
        || document.body.innerText.indexOf('รายการในครั้งนี้') >= 0);
      log('หน้าก่อนกด: ' + before);
      log('เจอปุ่มชื่อเว็บและกดได้: ' + clicked);
      log('กลับมาหน้าบันทึกแล้ว: ' + after);
    } else if (where === 'history') {
      await clickText('ประวัติ');
      await wait(2200);
    } else if (where === 'summary') {
      await clickText('สรุป');
      await wait(2400);
    } else if (where === 'record') {
      await wait(600);

    }

    const file = path.join(OUT, where + '-' + width + '.png');
    await page.screenshot({ path: file, fullPage: true });
    log('ถ่ายแล้ว ' + file);

    if (errs.length) {
      log('');
      log('🚨 เจอข้อผิดพลาดในหน้า ' + errs.length + ' รายการ');
      for (const e of errs.slice(0, 8)) log('   ' + e);
    } else {
      log('ไม่มีข้อผิดพลาดในคอนโซล');
    }

    if (hold > 0) {
      log('ค้างหน้าต่างไว้ให้ดู ' + hold + ' วินาที');
      await wait(hold * 1000);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('ล้มเหลว: ' + e.message);
  process.exit(1);
});
