// วัดช่องไฟจริงของหัวคอลัมน์กับช่องในแถว + ขนาดลูกศร
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
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
    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);
    await click('ประวัติ'); await wait(1600);
    await click('รายการ Lot'); await wait(3200);

    const out = await page.evaluate(() => {
      const head = document.querySelector('.col-head');
      const row = document.querySelector('.col-row');
      if (!head || !row) return null;
      const g = (el) => {
        const c = getComputedStyle(el);
        return { l: c.paddingLeft, r: c.paddingRight, box: c.boxSizing };
      };
      const arrow = head.querySelector('span span');
      return {
        หัวช่อง2: g(head.children[1]),
        แถวช่อง2: g(row.children[1]),
        หัวช่อง3: g(head.children[2]),
        แถวช่อง3: g(row.children[2]),
        ลูกศร: arrow ? { size: getComputedStyle(arrow).fontSize, text: arrow.textContent } : null,
        ปุ่มในแถว: (() => {
          const last = row.children[row.children.length - 1];
          const box = last.firstElementChild;
          return box ? getComputedStyle(box).justifyContent : '';
        })()
      };
    });
    if (!out) { console.log('ไม่เจอตาราง'); return; }
    console.log(JSON.stringify(out, null, 1));
  } finally { await browser.close(); }
})();
