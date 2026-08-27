// ตรวจ 3 ปุ่มในหน้าบันทึกด้วยภาพจริง — ชิปแหล่งที่มา 2 ตัว กับปุ่มสลับมุมมอง
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'C:/Users/PKH/AppData/Local/Temp/claude/C--Users-PKH/43221dc0-1d01-447f-a89e-83e7469cfd18/scratchpad';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TARGETS = ['OPD ทั่วไป', 'OPD NCD', 'มือถือ'];

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
    await wait(2500);

    for (const t of TARGETS) {
      const spot = await page.evaluate((tt) => {
        const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === tt);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { cls: el.className || '(ไม่มีคลาส)', x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
                 clip: { x: Math.max(0, r.x - 7), y: Math.max(0, r.y - 7), width: r.width + 14, height: r.height + 14 } };
      }, t);
      if (!spot) { console.log('ไม่เจอปุ่ม ' + t); continue; }

      const read = () => page.evaluate((tt) => {
        const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === tt);
        const g = getComputedStyle(el);
        return g.backgroundColor + ' / ' + g.color + ' / ' + g.borderColor;
      }, t);

      const safe = t.replace(/[^ก-๙A-Za-z]/g, '');
      await page.mouse.move(3, 3); await wait(420);
      const before = await read();
      await page.screenshot({ path: OUT + '/btn-' + safe + '-ปกติ.png', clip: spot.clip });

      await page.mouse.move(spot.x, spot.y); await wait(650);
      const after = await read();
      await page.screenshot({ path: OUT + '/btn-' + safe + '-ชี้.png', clip: spot.clip });

      console.log(t + '  [' + spot.cls + ']');
      console.log('   ก่อนชี้ ' + before);
      console.log('   ตอนชี้  ' + after);
      console.log('   ' + (before === after ? '✗ ไม่เปลี่ยนเลย' : '✓ เปลี่ยน'));
    }
  } finally { await browser.close(); }
})();
