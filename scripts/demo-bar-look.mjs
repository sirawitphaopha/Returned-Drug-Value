// ตรวจแถบเตือนโหมดดูตัวอย่าง (พาดบนสุด กดแล้วปิดโหมด) ว่าเปลี่ยนสีตอนชี้จริงไหม
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'C:/Users/PKH/AppData/Local/Temp/claude/C--Users-PKH/43221dc0-1d01-447f-a89e-83e7469cfd18/scratchpad';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function readPassword() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2400);

    // เปิดหน้าต่างตั้งค่า แล้วกดสวิตช์โหมดดูตัวอย่าง
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === 'ตั้งค่า');
      if (el) el.click();
    });
    await wait(1200);
    const opened = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"], input')]
        .find((e) => (e.getAttribute('aria-label') || '').indexOf('ดูตัวอย่าง') >= 0
                  || (e.textContent || '').indexOf('โหมดดูตัวอย่าง') >= 0);
      if (!el) return false;
      el.click(); return true;
    });
    await wait(1400);
    // ปิดหน้าต่างตั้งค่า
    await page.keyboard.press('Escape');
    await wait(1200);

    const spot = await page.evaluate(() => {
      const el = document.querySelector('.hv-demo');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
               clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } };
    });
    if (!spot) { console.log('ไม่เจอแถบ .hv-demo (เปิดโหมดไม่สำเร็จ · กดสวิตช์เจอ ' + opened + ')'); return; }

    const read = () => page.evaluate(() => getComputedStyle(document.querySelector('.hv-demo')).backgroundColor);

    await page.mouse.move(3, 400); await wait(420);
    console.log('ก่อนชี้ ' + await read());
    await page.screenshot({ path: OUT + '/demo-1-ปกติ.png', clip: spot.clip });

    await page.mouse.move(spot.x, spot.y); await wait(620);
    console.log('ตอนชี้  ' + await read());
    await page.screenshot({ path: OUT + '/demo-2-ชี้.png', clip: spot.clip });
  } finally { await browser.close(); }
})();
