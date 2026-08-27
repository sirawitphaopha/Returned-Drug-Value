// ถ่ายภาพโครงจาง (skeleton) ทุกหน้า — หน่วงเซิร์ฟเวอร์ให้ตอบช้าเพื่อให้ทันเห็น
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

    // 🚨 หน่วงเฉพาะคำขอข้อมูล ไม่แตะไฟล์เว็บ — ไม่งั้นหน้าไม่โหลดเลย
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      const u = req.url();
      if (/\/api\/(summary|returns|lots|catalog|prices)/.test(u)) {
        await wait(4000);
      }
      req.continue().catch(() => {});
    });

    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);

    const shots = [
      { name: 'ประวัติ', go: async () => { await click('ประวัติ'); } },
      { name: 'สรุป', go: async () => { await click('สรุป'); } },
      { name: 'คลังยา', go: async () => { await click('คลังยา'); } },
      { name: 'รายการLot', go: async () => { await click('ประวัติ'); await wait(700); await click('รายการ Lot'); } }
    ];

    for (const sh of shots) {
      await sh.go();
      await wait(1100);                       // ถ่ายตอนโครงจางยังอยู่
      await page.screenshot({ path: OUT + '/skel-' + sh.name + '.png' });
      console.log('ถ่าย ' + sh.name);
      await wait(4200);                       // รอให้ข้อมูลมาถึงก่อนไปหน้าถัดไป
    }
  } finally { await browser.close(); }
})();
