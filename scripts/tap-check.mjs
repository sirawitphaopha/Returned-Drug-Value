// ═══════════════════════════════════════════════════════════════════════════
// วัดขนาดปุ่มจริงในโหมดมือถือ — ผลตรวจข้อ ต-12
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 พี่กันสั่ง 26 ส.ค. 2569: "ต12 ต้องทำ แล้วค่อย ๆ แก้ไป
//    และอย่าไปหลงแก้ในเดสก์ท็อป ต้องเช็คเสมอ"
//
// เกณฑ์ 44×44 พิกเซลเป็นเรื่องของ "นิ้วบนจอสัมผัส" ไม่ใช่เมาส์บนคอม
// ปุ่มเล็กบนเดสก์ท็อปไม่ใช่ปัญหา เพราะเมาส์ชี้ได้แม่นกว่านิ้วมาก
//
// 🚨 สิ่งที่อันตรายกว่าปุ่มเล็ก คือ "พื้นที่กดทับกัน"
//    คลาส .tap ขยายพื้นที่กดออกด้านละ 11px ด้วย ::before
//    ปุ่มที่วางติดกัน (✓ กับ ✕ · ใช้ต่อ/ทำลาย) จะมีพื้นที่กดซ้อนกัน
//    กลายเป็นกดพลาดสลับกัน ซึ่งแย่กว่าปุ่มเล็กที่กดยากแต่ไม่กดผิด
//    สคริปต์นี้จึงรายงานทั้งสองอย่าง
//
// วิธีใช้  node scripts/tap-check.mjs           ทุกหน้าที่จอ 390px
//         node scripts/tap-check.mjs 430        กำหนดความกว้างเอง
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const width = Number(process.argv[2] || 390);
const MIN = 44;

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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);

const MEASURE = (MIN) => {
  const els = [...document.querySelectorAll('[role="button"], button, input, select, a')];
  const boxes = [];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > window.innerHeight * 4) continue;
    const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
    boxes.push({ label: label, x: r.x, y: r.y, w: r.width, h: r.height, tap: el.className.indexOf('tap') >= 0 });
  }
  const small = boxes.filter((b) => b.h < MIN || b.w < MIN);

  // พื้นที่กดที่ขยายแล้ว (.tap ขยายด้านละ 11px) ทับกันไหม
  const hit = (b) => b.tap
    ? { x1: b.x - 11, y1: b.y - 11, x2: b.x + b.w + 11, y2: b.y + b.h + 11 }
    : { x1: b.x, y1: b.y, x2: b.x + b.w, y2: b.y + b.h };
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = hit(boxes[i]), c = hit(boxes[j]);
      if (a.x1 < c.x2 && c.x1 < a.x2 && a.y1 < c.y2 && c.y1 < a.y2) {
        overlaps.push(boxes[i].label + '  ×  ' + boxes[j].label);
      }
    }
  }
  return {
    total: boxes.length,
    small: small.map((b) => b.label + ' | ' + Math.round(b.w) + 'x' + Math.round(b.h) + (b.tap ? ' (มี .tap)' : '')),
    overlaps: overlaps
  };
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: width, height: 850, isMobile: true, hasTouch: true });

    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);

    const clickText = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === tt || e.textContent.trim().indexOf(tt) === 0);
      if (!el) return false;
      el.click();
      return true;
    }, t);

    const screens = [
      { name: 'บันทึก', go: async () => {} },
      { name: 'ประวัติ', go: async () => { await clickText('ประวัติ'); } },
      { name: 'สรุป', go: async () => { await clickText('สรุป'); } },
      { name: 'คลังยา', go: async () => { await clickText('คลังยา'); } }
    ];

    log('วัดที่จอกว้าง ' + width + 'px · เกณฑ์ ' + MIN + 'x' + MIN + ' พิกเซล');
    log('');
    for (const s of screens) {
      await s.go();
      await wait(2200);
      const r = await page.evaluate(MEASURE, MIN);
      log('── หน้า' + s.name + ' · ปุ่มทั้งหมด ' + r.total + ' · เล็กเกิน ' + r.small.length + ' ──');
      for (const x of r.small) log('   ' + x);
      if (r.overlaps.length) {
        log('   🚨 พื้นที่กดทับกัน ' + r.overlaps.length + ' คู่');
        for (const o of r.overlaps.slice(0, 10)) log('      ' + o);
      }
      log('');
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('ล้มเหลว: ' + e.message);
  process.exit(1);
});
