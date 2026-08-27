// ตรวจปุ่มธีม สว่าง/เข้ม ในหน้าตั้งค่า — แอนิเมชันทำงานจริงไหม และสีไม่เปลี่ยนตามที่พี่กันสั่ง
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

    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim() === 'ตั้งค่า');
      if (el) el.click();
    });
    await wait(1400);

    const info = await page.evaluate(() => {
      const sun = document.querySelector('.hv-sun'), moon = document.querySelector('.hv-moon');
      if (!sun || !moon) return null;
      const box = sun.parentElement.getBoundingClientRect();
      const g = (e) => { const c = getComputedStyle(e); return c.backgroundColor + ' / ' + c.color; };
      return {
        sunSty: g(sun), moonSty: g(moon),
        sunXY: [Math.round(sun.getBoundingClientRect().x + sun.getBoundingClientRect().width / 2),
                Math.round(sun.getBoundingClientRect().y + sun.getBoundingClientRect().height / 2)],
        moonXY: [Math.round(moon.getBoundingClientRect().x + moon.getBoundingClientRect().width / 2),
                 Math.round(moon.getBoundingClientRect().y + moon.getBoundingClientRect().height / 2)],
        clip: { x: Math.round(box.x - 5), y: Math.round(box.y - 5), width: Math.round(box.width + 10), height: Math.round(box.height + 10) }
      };
    });
    if (!info) { console.log('ไม่เจอปุ่มธีม — หน้าตั้งค่าอาจไม่ได้เปิด'); return; }

    // กฎ CSS เข้าจริงไหม
    const rules = await page.evaluate(() => {
      const out = [];
      for (const sh of document.styleSheets) {
        try { for (const r of sh.cssRules) {
          if (r.selectorText && /hv-(sun|moon)/.test(r.selectorText)) out.push(r.selectorText);
          if (r.type === 7 && /hv-(sunrise|nightfall|stars)/.test(r.name)) out.push('@keyframes ' + r.name);
        } } catch (e) {}
      }
      return out;
    });
    console.log('กฎที่เข้าแล้ว ' + rules.length + ' ข้อ');
    rules.forEach((r) => console.log('   ' + r));

    await page.mouse.move(4, 4); await wait(400);
    console.log('\nสว่าง ปกติ  ' + info.sunSty);
    console.log('เข้ม  ปกติ  ' + info.moonSty);
    await page.screenshot({ path: OUT + '/theme-1-ปกติ.png', clip: info.clip });

    // ถ่ายทีละจังหวะระหว่างแอนิเมชัน จะได้เห็นว่าตอนไหนหน้าตาเป็นยังไง
    const frames = async (tag, xy) => {
      await page.mouse.move(4, 4); await wait(520);
      await page.mouse.move(xy[0], xy[1]);
      for (const ms of [180, 380, 620, 900, 1300]) {
        const prev = frames.last || 0; frames.last = ms;
        await wait(ms - prev);
        await page.screenshot({ path: OUT + "/theme-" + tag + "-" + ms + "ms.png", clip: info.clip });
      }
      frames.last = 0;
    };
    await frames("สว่าง", info.sunXY);
    await frames("เข้ม", info.moonXY);
    const after = await page.evaluate(() => {
      const g = (q) => { const c = getComputedStyle(document.querySelector(q)); return c.backgroundColor + " / " + c.color; };
      return { sun: g(".hv-sun"), moon: g(".hv-moon") };
    });
    console.log("สว่าง หลังจบ " + after.sun + (after.sun === info.sunSty ? "   ✓ กลับปกติ" : "   ✗"));
    console.log("เข้ม  หลังจบ " + after.moon + (after.moon === info.moonSty ? "   ✓ กลับปกติ" : "   ✗"));
  } finally { await browser.close(); }
})();
