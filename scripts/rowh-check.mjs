// ปุ่มเลือกความสูงแถวตาราง 3 ระดับ (พี่กันสั่ง 10 ก.ย. 2569)
//   "ความสูง 43 34 30 เรารู้ละ เอาปุ่มเลือกขนาดได้ใส่ไปเลย" · "ขอเป็น icon"
//
// 🚨 วัดความสูงแถวจริงในเบราว์เซอร์ ไม่ใช่อ่านค่าจาก CSS
// 🚨 ปุ่มเป็นไอคอน หาด้วยข้อความไม่ได้ ต้องหาจากชื่อที่ให้โปรแกรมอ่านจอ
// 🚨 เช็คด้วยว่าจำระดับที่เลือกไว้ข้ามการรีเฟรช และมีผลกับตารางหน้าอื่นด้วย
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

// ชื่อที่ให้โปรแกรมอ่านจอของปุ่มไอคอนคือ "แถวสูง NN จุด · คำอธิบาย"
const อ่าน = (page) => page.evaluate(() => {
  const tr = document.querySelector('table tbody tr');
  const ปุ่ม = [...document.querySelectorAll('[role="button"][aria-label]')]
    .filter((b) => (b.getAttribute('aria-label') || '').indexOf('แถวสูง ') === 0);
  const เลข = (b) => {
    const m = (b.getAttribute('aria-label') || '').match(/แถวสูง (\d+) จุด/);
    return m ? Number(m[1]) : null;
  };
  const ที่เลือก = ปุ่ม.find((b) => getComputedStyle(b).backgroundColor === 'rgb(47, 125, 93)');
  return {
    สูงแถว: tr ? Math.round(tr.getBoundingClientRect().height) : null,
    จำนวนปุ่ม: ปุ่ม.length,
    ระดับที่เลือกอยู่: ที่เลือก ? เลข(ที่เลือก) : null,
    เป็นไอคอน: ปุ่ม.length > 0 && ปุ่ม.every((b) => !!b.querySelector('svg') && !(b.innerText || '').trim()),
    คลาสที่หน้าเว็บ: [...document.documentElement.classList].filter((c) => c.indexOf('rh-') === 0)
  };
});

// กดปุ่มด้วยความสูงที่ต้องการ (43 · 34 · 30)
const กด = async (page, px) => {
  await page.evaluate((n) => {
    const b = [...document.querySelectorAll('[role="button"][aria-label]')]
      .find((x) => (x.getAttribute('aria-label') || '').indexOf('แถวสูง ' + n + ' จุด') === 0);
    if (b) b.click();
  }, px);
  await wait(700);
};

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
    await page.evaluate(() => {
      try {
        localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ'));
        localStorage.removeItem('mrv.rowh');
      } catch (e) {}
    });
    const ไปประวัติ = async () => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await wait(3800);
      await page.evaluate(() => {
        [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
          .find((b) => (b.innerText || '').trim().indexOf('ประวัติ') === 0).click();
      });
      await wait(3000);
    };
    await ไปประวัติ();

    console.log('');
    console.log('① ค่าตั้งต้น — แถวโปร่ง 43 จุด');
    let r = await อ่าน(page);
    if (!r.สูงแถว) { console.error('🔴 หาตารางไม่เจอ — หยุดก่อน'); process.exit(1); }
    เช็ค('มีปุ่มให้เลือก 3 ระดับ', r.จำนวนปุ่ม, 3);
    เช็ค('ปุ่มเป็นไอคอน ไม่มีตัวหนังสือ', r.เป็นไอคอน, true);
    เช็ค('ระดับที่เลือกอยู่คือ 43', r.ระดับที่เลือกอยู่, 43);
    เช็ค('แถวสูง 43 จุด', r.สูงแถว, 43);
    เช็ค('คลาสที่หน้าเว็บมีตัวเดียว', r.คลาสที่หน้าเว็บ, ['rh-roomy']);

    console.log('');
    console.log('② กดไอคอนกลาง → 34 จุด');
    await กด(page, 34);
    r = await อ่าน(page);
    เช็ค('แถวสูง 34 จุด', r.สูงแถว, 34);
    เช็ค('คลาสเปลี่ยนแล้ว ไม่ซ้อนกัน', r.คลาสที่หน้าเว็บ, ['rh-tight']);

    console.log('');
    console.log('③ กดไอคอนขวา → 30 จุด');
    await กด(page, 30);
    r = await อ่าน(page);
    เช็ค('แถวสูง 30 จุด', r.สูงแถว, 30);
    เช็ค('คลาสเปลี่ยนแล้ว ไม่ซ้อนกัน', r.คลาสที่หน้าเว็บ, ['rh-dense']);

    console.log('');
    console.log('④ จำระดับที่เลือกข้ามการรีเฟรช');
    await ไปประวัติ();
    r = await อ่าน(page);
    เช็ค('เปิดเว็บใหม่แล้วยังเป็น 30', r.ระดับที่เลือกอยู่, 30);
    เช็ค('แถวยังสูง 30 จุด', r.สูงแถว, 30);
    const จำไว้ = await page.evaluate(() => localStorage.getItem('mrv.rowh'));
    เช็ค('เก็บลงที่เก็บถาวรจริง', จำไว้, '"dense"');

    console.log('');
    console.log('⑤ มีผลกับตารางหน้าอื่นด้วย (คลาสอยู่ที่หน้าเว็บ ไม่ใช่ที่ตาราง)');
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
        .find((x) => (x.innerText || '').trim().indexOf('บันทึก') === 0);
      if (b) b.click();
    });
    await wait(2200);
    const คลาสคงอยู่ = await page.evaluate(() =>
      [...document.documentElement.classList].filter((c) => c.indexOf('rh-') === 0));
    เช็ค('สลับไปหน้าบันทึกแล้วคลาสยังอยู่', คลาสคงอยู่, ['rh-dense']);

    console.log('');
    console.log('⑥ กดกลับเป็น 43 ได้');
    await ไปประวัติ();
    await กด(page, 43);
    r = await อ่าน(page);
    เช็ค('กลับมา 43 จุด', r.สูงแถว, 43);

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
