// ตรวจว่าคลังยาวาดครบ 417 แถวเมื่อเลื่อนถึง (กลุ่ม 3 · ก-9)
// 🚨 ความเสี่ยงของการทยอยวาดคือ "เลื่อนแล้วไม่มาเพิ่ม" ซึ่งเท่ากับยาหายไปเฉย ๆ
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:3000';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const pw = (() => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === 'คลังยา');
      if (el) el.click();
    });
    await wait(4000);

    const rows = () => page.evaluate(() => document.querySelectorAll('tbody tr').length);
    const total = await page.evaluate(() => {
      const m = document.body.innerText.match(/แสดง\s*([\d,]+)\s*จาก\s*([\d,]+)/);
      return m ? Number(m[2].replace(/,/g, '')) : 417;
    });

    const first = await rows();
    check(first > 20 && first < 200, 'เริ่มต้นวาดแค่บางส่วน', first + ' แถว จากทั้งหมด ' + total);

    // เลื่อนลงเรื่อย ๆ จนสุด
    log('  เลื่อนลงจนสุดตาราง...');
    let last = first, stuck = 0;
    for (let i = 0; i < 40; i++) {
      await page.evaluate(() => {
        const el = document.querySelector('main, [style*="overflow-y"]')
          || document.scrollingElement;
        const box = [...document.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 200 && getComputedStyle(e).overflowY !== 'visible');
        (box || el).scrollTop = (box || el).scrollHeight;
      });
      await wait(400);
      const n = await rows();
      if (n === last) { stuck++; if (stuck >= 4) break; } else { stuck = 0; }
      last = n;
    }
    check(last >= total, 'เลื่อนจนสุดแล้ววาดครบทุกแถว', last + ' / ' + total + ' แถว');

    // ค้นแล้วต้องเริ่มนับใหม่
    await page.evaluate(() => {
      const box = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').indexOf('ค้น') >= 0);
      const setVal = window.Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setVal.call(box, 'a');
      box.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await wait(1200);
    const afterSearch = await rows();
    check(afterSearch < last, 'ค้นแล้วกลับไปเริ่มนับใหม่', afterSearch + ' แถว');

    // หัวตารางยังตรึงอยู่
    const stick = await page.evaluate(() => {
      const th = document.querySelector('thead th');
      return th ? getComputedStyle(th).position : 'ไม่เจอ';
    });
    check(stick === 'sticky', 'หัวตารางยังตรึงอยู่', stick);
    check(errs.length === 0, 'ไม่มีข้อผิดพลาดในคอนโซล', errs.slice(0, 1).join('') || '0 ข้อความ');

    log('');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
