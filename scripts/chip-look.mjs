// ตรวจชิปสถานะ "ใช้ต่อได้ / ทำลาย" ในช่องกรอกหน้าบันทึก ว่าสีตอนชี้ตรงกับสีของปุ่มไหม
// พี่กันถาม 27 ส.ค. 2569 "ทำลาย สีแดงไหม" — ตอนชี้ต้องแดง ไม่ใช่เขียว
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

    // กรอบที่ล้อมชิปทั้งสอง
    const box = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === 'ทำลาย');
      if (!el) return null;
      const p = el.parentElement.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { clip: { x: Math.round(p.x - 4), y: Math.round(p.y - 4), width: Math.round(p.width + 8), height: Math.round(p.height + 8) },
               x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    if (!box) { console.log('ไม่เจอชิปทำลาย'); return; }

    const read = (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === tt);
      const g = getComputedStyle(el);
      return g.backgroundColor + '  ตัวอักษร ' + g.color;
    }, t);

    await page.mouse.move(3, 400); await wait(420);
    console.log('ปกติ · ทำลาย   ' + await read('ทำลาย'));
    await page.screenshot({ path: OUT + '/chip-1-ปกติ.png', clip: box.clip });

    await page.mouse.move(box.x, box.y); await wait(650);
    console.log('ชี้ปุ่มทำลาย   ' + await read('ทำลาย'));
    await page.screenshot({ path: OUT + '/chip-2-ชี้ทำลาย.png', clip: box.clip });
  } finally { await browser.close(); }
})();
