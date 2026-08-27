// ตรวจว่าหัวตารางหน้ารายการ Lot ตรึงจริงไหมตอนเลื่อนดู + ถ่ายภาพมาดูด้วยตา
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
    // จอเตี้ยลงเพื่อให้ตารางเลื่อนได้จริง
    await page.setViewport({ width: 1400, height: 620 });
    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2300);
    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);
    await click('ประวัติ'); await wait(1500);
    await click('รายการ Lot'); await wait(3400);
    const ok = await page.evaluate(() => ({ head: !!document.querySelector('.col-head'), rows: document.querySelectorAll('.col-row').length, wide: innerWidth }));
    if (!ok.head) { console.log('ไม่เจอหัวตาราง — แถว ' + ok.rows + ' · จอกว้าง ' + ok.wide); return; }

    const before = await page.evaluate(() => {
      const h = document.querySelector('.col-head');
      return h ? Math.round(h.getBoundingClientRect().top) : null;
    });
    await page.screenshot({ path: OUT + '/stick-1-บนสุด.png' });

    // เลื่อนลงในพื้นที่เลื่อนของเว็บ (ไม่ใช่ทั้งหน้า)
    await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('div')].filter((d) => {
        const st = getComputedStyle(d);
        return (st.overflowY === 'auto' || st.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 40;
      });
      if (boxes.length) boxes[0].scrollTop = 500;
      else window.scrollTo(0, 260);
    });
    await wait(700);

    const after = await page.evaluate(() => {
      const h = document.querySelector('.col-head');
      const rows = document.querySelectorAll('.col-row');
      return {
        top: h ? Math.round(h.getBoundingClientRect().top) : null,
        firstRow: rows[0] ? Math.round(rows[0].getBoundingClientRect().top) : null,
        pos: h ? getComputedStyle(h).position : ''
      };
    });
    await page.screenshot({ path: OUT + '/stick-2-เลื่อนแล้ว.png' });

    console.log('หัวตาราง position = ' + after.pos);
    console.log('ก่อนเลื่อน  หัวอยู่ที่ ' + before + 'px');
    console.log('หลังเลื่อน  หัวอยู่ที่ ' + after.top + 'px · แถวแรกอยู่ที่ ' + after.firstRow + 'px');
        // เลื่อนอีกจังหวะ ถ้าตรึงจริงหัวต้องไม่ขยับอีกเลย
    await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('div')].filter((d) => {
        const st = getComputedStyle(d);
        return (st.overflowY === 'auto' || st.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 40;
      });
      if (boxes.length) boxes[0].scrollTop = 900;
    });
    await wait(700);
    const more = await page.evaluate(() => Math.round(document.querySelector('.col-head').getBoundingClientRect().top));
    console.log('เลื่อนอีก   หัวอยู่ที่ ' + more + 'px');
    console.log(more === after.top ? '✅ ตรึงจริง — เลื่อนเท่าไรหัวก็อยู่ที่เดิม' : '❌ ยังเลื่อนตามอีก ' + (after.top - more) + 'px');
  } finally { await browser.close(); }
})();
