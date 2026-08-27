// ═══════════════════════════════════════════════════════════════════════════
// ดูปุ่ม "เลือกยาก่อน" ก่อนชี้ กับหลังชี้ ว่าหน้าตาเปลี่ยนจริงไหม
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 27 ส.ค. 2569: "ไม่ชอบสีเทา ปุ่มนี้ขออนิเมชั่นแปลก ๆ ไม่เหมือนเพื่อน"
// ทำเป็นครีมอมเหลือง + สั่นซ้ายขวา — ไฟล์นี้ถ่ายภาพมาดูว่าได้ผลจริง
//
// วิธีใช้  node scripts/wait-btn-look.mjs
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const OUT = 'C:/Users/PKH/AppData/Local/Temp/claude/C--Users-PKH/43221dc0-1d01-447f-a89e-83e7469cfd18/scratchpad';

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
];
function findChrome() {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ');
}
function readPassword() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(), headless: 'new', args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);

        const which = process.argv[2] || "เลือกยาก่อน";
    const box = await page.evaluate((w) => {
      const el = [...document.querySelectorAll(".hv-wait, .hv-off-green")].find((e) => e.textContent.indexOf(w) >= 0);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, which);
    if (!box) { console.log("ไม่เจอปุ่ม " + which); return; }

    // เผื่อขอบรอบปุ่มไว้ 14px จะได้เห็นตอนสั่นออกนอกกรอบ
    const clip = {
      x: Math.max(0, box.x - 14), y: Math.max(0, box.y - 14),
      width: box.w + 28, height: box.h + 28
    };

        const read = () => page.evaluate((w) => {
      const el = [...document.querySelectorAll(".hv-wait, .hv-off-green")].find((e) => e.textContent.indexOf(w) >= 0);
      const c = getComputedStyle(el);
      return { พื้น: c.backgroundColor, ตัวอักษร: c.color, ขอบ: c.borderColor };
    }, which);

    await page.screenshot({ path: OUT + '/wait-' + which + '-1-ปกติ.png', clip });
    console.log('ก่อนชี้ ', JSON.stringify(await read()));

    // เอาเมาส์เข้าไปกลางปุ่ม
    await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);

    // ถ่ายระหว่างสั่น (ราว 0.15 วินาทีหลังเมาส์เข้า = ช่วงเหวี่ยงสุด)
    await wait(150);
    await page.screenshot({ path: OUT + '/wait-' + which + '-2-สั่น.png', clip });

    // ถ่ายหลังสั่นจบ เหลือแต่สีตอนชี้
    await wait(700);
    await page.screenshot({ path: OUT + '/wait-' + which + '-3-ชี้.png', clip });
    console.log('ตอนชี้  ', JSON.stringify(await read()));
  } finally {
    await browser.close();
  }
})();
