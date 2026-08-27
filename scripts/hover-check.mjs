// ═══════════════════════════════════════════════════════════════════════════
// ตรวจว่าทุกปุ่มเปลี่ยนสีตอนเอาเมาส์ชี้จริงหรือไม่
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 กฎการออกแบบที่พี่กันตั้ง 26 ส.ค. 2569:
//    "ทุกปุ่มควรเปลี่ยนสีตอนเอาเมาส์ไปชี้ ตั้งเป็นกฎการออกแบบ
//     เราขี้เกียจสั่งเธอให้ทำอันนี้แล้ว"
//
// วิธีตรวจ — ถ่ายภาพปุ่มก่อนชี้ กับหลังชี้ แล้วเทียบว่าต่างกันจริงไหม
// ไม่ใช่ดูแค่ว่ามีกฎ CSS เขียนไว้ เพราะกฎอาจโดนสไตล์ฝังในแท็กทับจนไม่มีผล
//
// วิธีใช้  node scripts/hover-check.mjs
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
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
const log = (m) => console.log(m);

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

    const clickText = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === tt || e.textContent.trim().indexOf(tt) === 0);
      if (!el) return false;
      el.click();
      return true;
    }, t);

    const screens = [
      { name: 'บันทึก', go: async () => {} },
      { name: 'ประวัติ', go: async () => { await clickText('ประวัติ'); } },
      { name: 'รายการ Lot', go: async () => { await clickText('รายการ Lot'); } },
      { name: 'สรุป', go: async () => { await clickText('ประวัติ'); await wait(900); await clickText('สรุป'); } },
      { name: 'คลังยา', go: async () => { await clickText('คลังยา'); } }
    ];

    let totalDead = 0, totalAll = 0;
    for (const s of screens) {
      await s.go();
      await wait(2300);

      // เก็บรายชื่อปุ่มที่มองเห็นอยู่
      const spots = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('[role="button"], button')) {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) continue;
          if (r.top < 0 || r.top > window.innerHeight - 8) continue;
          if (el.getAttribute('aria-disabled') === 'true' || el.disabled) continue;
          out.push({
            label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 26),
            x: Math.round(r.x + r.width / 2),
            y: Math.round(r.y + r.height / 2)
          });
        }
        return out.slice(0, 40);
      });

      const dead = [];
      for (const sp of spots) {
        // 🚨 อ่านค่าสีที่เบราว์เซอร์คำนวณจริง ไม่ใช่เทียบภาพ
        //    เทียบภาพเคยรายงานผิดสลับไปมาทุกรอบที่รัน เพราะการไล่สีใช้เวลา .12–.15 วินาที
        //    แต่โค้ดเดิมรอแค่ .045 กับ .16 วินาที ภาพจึงถ่ายติดตอนสียังไหลไม่ถึงที่
        //    (แคลร์เจอ 27 ส.ค. 2569 — รอบหนึ่งฟ้องปุ่มกลับ อีกรอบฟ้องชิปแหล่งที่มา
        //     พอตรวจทีละปุ่มด้วยมือแล้วทุกตัวเปลี่ยนสีจริงหมด)
        const paint = () => page.evaluate((xy) => {
          const el = document.elementFromPoint(xy[0], xy[1]);
          if (!el) return '';
          const hit = el.closest('[role="button"], button') || el;
          const g = getComputedStyle(hit);
          return g.backgroundColor + '|' + g.color + '|' + g.borderColor + '|' + g.opacity;
        }, [sp.x, sp.y]);

        await page.mouse.move(5, 5);
        await wait(420);
        const before = await paint();
        await page.mouse.move(sp.x, sp.y);
        await wait(620);
        const after = await paint();
        if (before && before === after) dead.push(sp.label);
      }
      totalAll += spots.length;
      totalDead += dead.length;
      log('── หน้า' + s.name + ' · ตรวจ ' + spots.length + ' ปุ่ม · ไม่เปลี่ยนสี ' + dead.length + ' ──');
      for (const d of dead) log('   ' + d);
      log('');
    }
    log(totalDead
      ? '🚨 รวม ' + totalDead + ' จาก ' + totalAll + ' ปุ่มที่ยังไม่เปลี่ยนสีตอนชี้'
      : '✅ ทุกปุ่มที่ตรวจ (' + totalAll + ' ปุ่ม) เปลี่ยนสีตอนเอาเมาส์ชี้ครบ');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('ล้มเหลว: ' + e.message);
  process.exit(1);
});
