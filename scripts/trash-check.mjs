// ถังขยะย้ายไปอยู่ในหน้าตั้งค่า (พี่กันสั่ง 10 ก.ย. 2569)
//   "เอาปุ่มถังขยะออก เอาไปไว้ที่ตั้งค่า เอาไว้กดแล้วมันจะเด้งมาหน้าตารางนี้เอง"
//
// 🚨 ทางเข้าย้ายไปตั้งค่า แต่ทางออกต้องอยู่ในหน้าประวัติเสมอ
//    ไม่งั้นเข้าถังขยะแล้วออกไม่ได้ — เทสข้อนี้สำคัญที่สุด
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:' + (process.env.PORT || '3000');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const pw = (() => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let ผ่าน = 0, ตก = 0;
const เช็ค = (ชื่อ, ได้, ควรได้) => {
  const ok = JSON.stringify(ได้) === JSON.stringify(ควรได้);
  if (ok) { ผ่าน++; console.log('  ✅ ' + ชื่อ); }
  else { ตก++; console.log('  ❌ ' + ชื่อ + ' — ได้ ' + JSON.stringify(ได้) + ' ควรได้ ' + JSON.stringify(ควรได้)); }
};

const อ่าน = (page) => page.evaluate(() => {
  const ปุ่มทั้งหมด = [...document.querySelectorAll('[role="button"]')];
  const หา = (คำ) => ปุ่มทั้งหมด.some((b) => (b.innerText || '').trim() === คำ);
  const หัว = [...document.querySelectorAll('[role="heading"]')].map((h) => (h.innerText || '').trim());
  return {
    มีปุ่มถังขยะในแถบ: หา('ถังขยะ'),
    มีปุ่มกลับ: หา('กลับไปดูรายการปกติ'),
    มีปุ่มเปิดถังขยะในตั้งค่า: ปุ่มทั้งหมด.some((b) => (b.innerText || '').trim() === 'เปิดถังขยะ'),
    หัวเรื่อง: หัว.find((h) => h.indexOf('ประวัติ') >= 0 || h.indexOf('ถังขยะ') >= 0) || หัว[0] || '',
    อยู่หน้าตั้งค่า: document.body.innerText.indexOf('ธีมหน้าสรุป') >= 0
  };
});

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4200);

    const กดปุ่ม = async (คำ) => {
      const ได้ = await page.evaluate((n) => {
        const b = [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').trim() === n);
        if (!b) return false;
        b.click(); return true;
      }, คำ);
      await wait(2600);
      return ได้;
    };
    const ไปประวัติ = () => page.evaluate(() => {
      [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
        .find((b) => (b.innerText || '').trim().indexOf('ประวัติ') === 0).click();
    }).then(() => wait(2800));

    console.log('');
    console.log('① หน้าประวัติปกติ — ต้องไม่มีปุ่มถังขยะในแถบเครื่องมือแล้ว');
    await ไปประวัติ();
    let r = await อ่าน(page);
    เช็ค('ไม่มีปุ่มถังขยะในแถบ', r.มีปุ่มถังขยะในแถบ, false);
    เช็ค('ไม่มีปุ่มกลับ (เพราะยังไม่ได้เข้าถังขยะ)', r.มีปุ่มกลับ, false);

    console.log('');
    console.log('② หน้าตั้งค่า — ต้องมีปุ่มเปิดถังขยะ');
    const เปิดตั้งค่า = await page.evaluate(() => {
      const b = document.querySelector('[aria-label="ตั้งค่า"]');
      if (!b) return false;
      b.click(); return true;
    });
    await wait(1800);
    if (!เปิดตั้งค่า) { console.error('🔴 กดปุ่มตั้งค่าไม่ติด — หยุดก่อน'); process.exit(1); }
    r = await อ่าน(page);
    เช็ค('อยู่ในหน้าตั้งค่าจริง', r.อยู่หน้าตั้งค่า, true);
    เช็ค('มีปุ่มเปิดถังขยะ', r.มีปุ่มเปิดถังขยะในตั้งค่า, true);

    console.log('');
    console.log('③ กดแล้วต้องเด้งไปหน้าประวัติในโหมดถังขยะเลย');
    await กดปุ่ม('เปิดถังขยะ');
    r = await อ่าน(page);
    เช็ค('ออกจากหน้าตั้งค่าแล้ว', r.อยู่หน้าตั้งค่า, false);
    เช็ค('หัวเรื่องบอกว่าเป็นถังขยะ', r.หัวเรื่อง.indexOf('ถังขยะ') >= 0, true);
    เช็ค('มีปุ่มกลับไปดูรายการปกติ', r.มีปุ่มกลับ, true);

    console.log('');
    console.log('④ กดปุ่มกลับแล้วต้องออกจากถังขยะได้');
    await กดปุ่ม('กลับไปดูรายการปกติ');
    r = await อ่าน(page);
    เช็ค('กลับมาหน้าประวัติปกติ', r.หัวเรื่อง.indexOf('ถังขยะ') < 0, true);
    เช็ค('ปุ่มกลับหายไปแล้ว', r.มีปุ่มกลับ, false);

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
