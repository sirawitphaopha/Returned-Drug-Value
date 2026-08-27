// ถ่ายภาพหน้าตั้งค่า — ใช้ดูปุ่มเลือกฟอนต์กับส่วนอื่นในหน้าต่างนี้
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
    await page.setViewport({ width: 1400, height: 950 });
    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2400);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === 'ตั้งค่า');
      if (el) el.click();
    });
    await wait(1600);

    // เลื่อนหาส่วนฟอนต์
    const box = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const label = all.find((d) => d.textContent.trim() === 'ฟอนต์ตัวอักษรอังกฤษและตัวเลข' && d.children.length === 0);
      if (!label) return null;
      label.scrollIntoView({ block: 'center' });
      return true;
    });
    await wait(600);
    await page.screenshot({ path: OUT + '/หน้าตั้งค่า-ฟอนต์.png' });
    console.log(box ? 'ถ่ายแล้ว (เจอส่วนฟอนต์)' : 'ถ่ายแล้ว (ไม่เจอหัวข้อฟอนต์ — ดูภาพเอง)');
  } finally { await browser.close(); }
})();
