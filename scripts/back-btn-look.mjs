// ตรวจปุ่มชื่อ "ประวัติ" ในหน้ารายการ Lot — มี 2 ตัว (แท็บบนแถบเมนู กับปุ่มกลับ)
// ตัวไหนที่ยังไม่เปลี่ยนสีตอนชี้
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
    await wait(2200);

    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);
    await click('ประวัติ'); await wait(1400);
    await click('รายการ Lot'); await wait(2200);

    const spots = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('[role="button"]')) {
        if (el.textContent.trim().indexOf('ประวัติ') !== 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8) continue;
        out.push({ cls: el.className || '(ไม่มีคลาส)', x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
                   clip: { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 } });
      }
      return out;
    });

    let i = 0;
    for (const s of spots) {
      i++;
      await page.mouse.move(5, 5); await wait(350);
      const before = await page.evaluate((c) => {
        const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.className === c && e.textContent.trim().indexOf('ประวัติ') === 0);
        const g = getComputedStyle(el); return g.backgroundColor + ' / ' + g.color + ' / ' + g.borderColor;
      }, s.cls);
      await page.screenshot({ path: OUT + '/back-' + i + '-ปกติ.png', clip: s.clip });

      await page.mouse.move(s.x, s.y);
      await wait(500);
      const after = await page.evaluate((c) => {
        const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.className === c && e.textContent.trim().indexOf('ประวัติ') === 0);
        const g = getComputedStyle(el); return g.backgroundColor + ' / ' + g.color + ' / ' + g.borderColor;
      }, s.cls);
      await page.screenshot({ path: OUT + '/back-' + i + '-ชี้.png', clip: s.clip });

      console.log('ปุ่มที่ ' + i + ' คลาส [' + s.cls + ']');
      console.log('   ก่อนชี้ ' + before);
      console.log('   ตอนชี้  ' + after);
      console.log('   ' + (before === after ? '✗ ไม่เปลี่ยนเลย' : '✓ เปลี่ยน'));
    }
  } finally { await browser.close(); }
})();
