// ถ่ายภาพหน้าเว็บมาดูด้วยตา — ใช้ตอนโครมของพี่กันไม่ได้เปิดอยู่
// วิธีใช้  node scripts/page-shot.mjs [ชื่อหน้า]
//         ชื่อหน้า: บันทึก · ประวัติ · รายการ Lot · สรุป · คลังยา (ไม่ใส่ = บันทึก)
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'C:/Users/PKH/AppData/Local/Temp/claude/C--Users-PKH/43221dc0-1d01-447f-a89e-83e7469cfd18/scratchpad';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WANT = process.argv[2] || 'บันทึก';

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

    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);

    if (WANT === 'ประวัติ') { await click('ประวัติ'); await wait(1800); }
    if (WANT === 'รายการ Lot') { await click('ประวัติ'); await wait(1500); await click('รายการ Lot'); await wait(2200); }
    if (WANT === 'สรุป') { await click('สรุป'); await wait(2000); }
    if (WANT === 'คลังยา') { await click('คลังยา'); await wait(2400); }

    const file = OUT + '/หน้า-' + WANT.replace(/\s/g, '') + '.png';
    await page.screenshot({ path: file });
    console.log('ถ่ายแล้ว ' + file);
  } finally { await browser.close(); }
})();
