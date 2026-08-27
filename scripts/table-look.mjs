// วัดตารางหน้ารายการ Lot — คอลัมน์ไหนกว้างเท่าไร ข้างในมีข้อมูลจริงกี่แถว
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
    await wait(2300);
    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);
    await click('ประวัติ'); await wait(1500);
    await click('รายการ Lot'); await wait(3200);
    const found = await page.evaluate(() => ({ head: !!document.querySelector('.col-head'), rows: document.querySelectorAll('.col-row').length, url: location.href }));
    console.log('เจอหัวตาราง ' + found.head + ' · แถว ' + found.rows);

    const out = await page.evaluate(() => {
      const head = document.querySelector('.col-head');
      const rows = [...document.querySelectorAll('.col-row')];
      if (!head) return null;
      const hs = [...head.children];
      const cols = hs.map((h, i) => {
        const r = h.getBoundingClientRect();
        // นับว่าช่องนี้มีข้อมูลจริงกี่แถว (ไม่นับขีด — และช่องว่าง)
        let filled = 0;
        for (const row of rows) {
          const cell = row.children[i];
          if (!cell) continue;
          const t = (cell.textContent || '').trim();
          if (t && t !== '—' && t !== '-') filled++;
        }
        return {
          หัว: (h.textContent || '').replace(/[↕▲▼\s]+/g, ' ').trim(),
          กว้าง: Math.round(r.width),
          มีข้อมูล: filled + '/' + rows.length
        };
      });
      const tot = cols.reduce((a, c) => a + c.กว้าง, 0);
      return { cols, tot, rows: rows.length, tableW: Math.round(head.getBoundingClientRect().width) };
    });
    if (!out) { console.log('ไม่เจอตาราง'); return; }

    console.log('ตารางกว้าง ' + out.tableW + 'px · มี ' + out.rows + ' แถว');
    console.log('');
    console.log('คอลัมน์'.padEnd(16) + 'กว้าง'.padStart(7) + '  ' + 'สัดส่วน'.padStart(7) + '  มีข้อมูลจริง');
    console.log('─'.repeat(56));
    for (const c of out.cols) {
      const pct = Math.round(c.กว้าง / out.tableW * 100);
      console.log(c.หัว.padEnd(16) + String(c.กว้าง).padStart(5) + 'px' + String(pct).padStart(6) + '%   ' + c.มีข้อมูล);
    }
  } finally { await browser.close(); }
})();
