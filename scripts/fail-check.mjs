// ═══════════════════════════════════════════════════════════════════════════
// ตรวจว่า "โหลดไม่สำเร็จ" กับ "ไม่มีข้อมูล" แยกออกจากกันจริง (กลุ่ม 3 · ก-1)
// ═══════════════════════════════════════════════════════════════════════════
//
// จำลองเซิร์ฟเวอร์ล่มด้วยการดักคำขอข้อมูลแล้วตอบ 500 กลับไป
// แล้วเดินดูทีละหน้าว่าขึ้นกล่องแจ้งจริงไหม และไม่โกหกว่า "ไม่มีข้อมูล"
//
//   node scripts/fail-check.mjs
//   SHOW=1 node scripts/fail-check.mjs
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:3000';
const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome'
];
const findChrome = () => {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ');
};
const readPassword = () => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

// เส้นทางข้อมูลที่จะทำให้ล่ม — ไม่แตะไฟล์เว็บ ไม่งั้นหน้าไม่โหลดเลย
const DEAD = ['/api/summary', '/api/returns', '/api/lots', '/api/catalog', '/api/prices', '/api/top-returned'];

(async () => {
  const show = process.env.SHOW === String.fromCharCode(49);
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: show ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', readPassword());
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }

    // ล้างของที่เก็บไว้ในแท็บก่อน ไม่งั้นหน้าหยิบของเก่ามาแสดงแล้วไม่เห็นกล่องแจ้ง
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => sessionStorage.clear());

    // 🚨 ปิดการดักด้วยธง ไม่ใช่สั่ง setRequestInterception(false) กลางคัน
    //    คำขอที่ค้างอยู่ในคิวจะพังทันทีเพราะตัวดักหายไปก่อนมันถูกจัดการ
    let dead = true;
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url();
      if (dead && DEAD.some((d) => u.indexOf(d) >= 0)) {
        r.respond({ status: 500, contentType: 'application/json', body: '{"error":"จำลองเซิร์ฟเวอร์ล่ม"}' });
        return;
      }
      r.continue();
    });

    await page.reload({ waitUntil: 'networkidle2' });
    await wait(3000);

    const clickText = async (t) => page.evaluate((tx) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === tx || e.textContent.trim().indexOf(tx) === 0);
      if (!el) return false;
      el.click();
      return true;
    }, t);

    const seen = async () => page.evaluate(() => {
      const txt = document.body.innerText;
      return {
        fail: txt.indexOf('ไม่สำเร็จ') >= 0,
        retry: txt.indexOf('ลองอีกครั้ง') >= 0,
        lieEmpty: /ไม่พบรายการตามเงื่อนไข|ยังไม่มีรายการในปีงบ|ไม่พบยาตามเงื่อนไข|ไม่พบยาตามที่ค้น|ยังไม่มี Lot/.test(txt),
        zero: (txt.match(/฿\s*0\.00|0\.00\s*฿/g) || []).length
      };
    });

    const pages = [
      { name: 'ประวัติ', go: async () => { await clickText('ประวัติ'); } },
      { name: 'สรุป', go: async () => { await clickText('สรุป'); } },
      { name: 'คลังยา', go: async () => { await clickText('คลังยา'); } }
    ];

    for (const p of pages) {
      log('');
      log('หน้า' + p.name);
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await wait(1500);
      await p.go();
      await wait(3500);
      const r = await seen();
      check(r.fail, 'ขึ้นข้อความว่าโหลดไม่สำเร็จ');
      check(r.retry, 'มีปุ่มลองอีกครั้ง');
      check(!r.lieEmpty, 'ไม่โกหกว่า "ไม่มีข้อมูล"');
      if (p.name === 'สรุป') check(r.zero === 0, 'ไม่วาดยอดเงินศูนย์บาท', r.zero + ' จุด');
    }

    // หน้ารายการ Lot อยู่ในหน้าประวัติ ต้องกดเข้าไปอีกชั้น
    log('');
    log('หน้ารายการ Lot');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(1500);
    await clickText('ประวัติ');
    await wait(2000);
    await clickText('รายการ Lot');
    await wait(3500);
    const rl = await seen();
    check(rl.fail, 'ขึ้นข้อความว่าโหลดไม่สำเร็จ');
    check(rl.retry, 'มีปุ่มลองอีกครั้ง');
    check(!rl.lieEmpty, 'ไม่โกหกว่า "ไม่มี Lot"');

    // ── ปุ่มลองอีกครั้งต้องใช้ได้จริงเมื่อเซิร์ฟเวอร์กลับมา ──────────────
    log('');
    log('ปุ่มลองอีกครั้ง หลังเซิร์ฟเวอร์กลับมา');
    dead = false;
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(1500);
    await clickText('สรุป');
    await wait(3000);
    const back = await page.evaluate(() => document.body.innerText.indexOf('ไม่สำเร็จ') < 0);
    check(back, 'เซิร์ฟเวอร์กลับมาแล้วหน้าสรุปแสดงตัวเลขได้ตามปกติ');

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
