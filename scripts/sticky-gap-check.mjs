// หัวตารางต้องติดใต้แถบหัวพอดี ห้ามเหลือร่องให้แถวลอดผ่านตอนเลื่อน
//
//   พี่กันเจอเอง 10 ก.ย. 2569 — "ตารางข้างล่างมันโผล่ ตัวขอบหัวตารางต้องชิดสิ"
//
// 🚨 ต้องเลื่อนจริงก่อนวัด — ตอนยังไม่เลื่อน ทั้งสองชิ้นยังไม่ตรึง จึงไม่มีร่องให้เห็น
//    (บทเรียนเดิม 4 ก.ย. 2569 — ดูในโครมแล้วแต่ไม่ได้เลื่อน เลยไม่เห็นร่อง)
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

const วัดร่อง = (page, หัวแถบ) => page.evaluate((cls) => {
  const แถบ = document.querySelector(cls);
  // 🚨 ตัวที่ตรึงคือ th ไม่ใช่ tr — วัดที่ tr จะได้ตำแหน่งเดิมที่ยังไม่ตรึง แล้วสรุปผิด
  const th = document.querySelector('table thead th');
  const sc = document.querySelector('[role="main"]');
  if (!แถบ || !th) return null;
  const b = แถบ.getBoundingClientRect();
  const h = th.getBoundingClientRect();
  // มีแถวไหนโผล่ในร่องระหว่างแถบหัวกับหัวตารางไหม
  const กลางร่อง = (b.bottom + h.top) / 2;
  const ตรงกลาง = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(กลางร่อง));
  return {
    ร่อง: Math.round(h.top - b.bottom),
    เลื่อนไปแล้ว: Math.round(sc.scrollTop),
    เลื่อนได้อีก: Math.round(sc.scrollHeight - sc.clientHeight),
    จำนวนแถว: document.querySelectorAll('table tbody tr').length,
    หัวตารางตรึงที่: getComputedStyle(document.querySelector('table thead th')).top,
    ตัวแปรhisthead: getComputedStyle(document.documentElement).getPropertyValue('--histhead').trim(),
    หัวตารางอยู่ที่: Math.round(h.top),
    ขอบล่างแถบอยู่ที่: Math.round(b.bottom),
    ของที่อยู่ในร่อง: ตรงกลาง ? (ตรงกลาง.tagName + (ตรงกลาง.closest('tbody') ? ' (แถวข้อมูล)' : '')) : 'ไม่มี'
  };
}, หัวแถบ);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 800, deviceScaleFactor: 1 });
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });

    const เข้าหน้า = async (ชื่อแท็บ) => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await wait(3800);
      await page.evaluate((n) => {
        [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
          .find((b) => (b.innerText || '').trim().indexOf(n) === 0).click();
      }, ชื่อแท็บ);
      await wait(3000);
    };
    const เลื่อน = async (y) => {
      await page.evaluate((t) => { document.querySelector('[role="main"]').scrollTop = t; }, y);
      await wait(600);
    };

    console.log('');
    console.log('① หน้าประวัติ — เลื่อนลงแล้วต้องไม่มีร่อง');
    await เข้าหน้า('ประวัติ');
    await เลื่อน(400);
    let r = await วัดร่อง(page, '.hist-head');
    if (!r) { console.error('🔴 หาแถบหัวไม่เจอ — หยุดก่อน'); process.exit(1); }
    console.log('     เลื่อนไป ' + r.เลื่อนไปแล้ว + ' จาก ' + r.เลื่อนได้อีก + ' · แถว ' + r.จำนวนแถว + ' · หัวตารางอยู่ที่ ' + r.หัวตารางอยู่ที่ + ' · ขอบล่างแถบ ' + r.ขอบล่างแถบอยู่ที่ + ' · ร่อง ' + r.ร่อง + ' · ในร่องมี ' + r.ของที่อยู่ในร่อง);
    เช็ค('ไม่มีร่องระหว่างแถบหัวกับหัวตาราง', r.ร่อง <= 0, true);
    เช็ค('ไม่มีแถวข้อมูลโผล่ในร่อง', r.ของที่อยู่ในร่อง.indexOf('แถวข้อมูล') < 0, true);

    await เลื่อน(1200);
    r = await วัดร่อง(page, '.hist-head');
    console.log('     เลื่อนลึกอีก ' + r.เลื่อนไปแล้ว + ' จุด · ร่อง ' + r.ร่อง + ' จุด');
    เช็ค('เลื่อนลึกแล้วก็ยังไม่มีร่อง', r.ร่อง <= 0, true);

    console.log('');
    console.log('② หน้ารายการ Lot — ต้องไม่มีร่องเหมือนกัน');
    await เข้าหน้า('ประวัติ');
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').indexOf('รายการ Lot') >= 0);
      if (b) b.click();
    });
    await wait(2800);
    await เลื่อน(400);
    r = await วัดร่อง(page, '.lots-head');
    if (r) {
      console.log('     เลื่อนไป ' + r.เลื่อนไปแล้ว + ' จุด · ร่อง ' + r.ร่อง + ' จุด · ในร่องมี ' + r.ของที่อยู่ในร่อง);
      เช็ค('ไม่มีร่องในหน้ารายการ Lot', r.ร่อง <= 0, true);
      เช็ค('ไม่มีแถวข้อมูลโผล่ในร่อง', r.ของที่อยู่ในร่อง.indexOf('แถวข้อมูล') < 0, true);
    } else {
      console.log('  ⚠️ เข้าหน้ารายการ Lot ไม่ได้ ข้ามข้อนี้');
    }

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
