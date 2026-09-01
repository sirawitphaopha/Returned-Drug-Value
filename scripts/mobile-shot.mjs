// ถ่ายภาพหน้าจอฝั่งมือถือเป็นชิ้น ๆ เพื่อเปิดดูด้วยตา
// 🚨 กฎข้อ 3.65 — แตะหน้าจอเมื่อไหร่ ต้องเปิดภาพดูก่อนรายงานเสมอ
//    การวัดตัวเลขจากโค้ดผ่านหมดได้ทั้งที่ตาอ่านไม่ออก
//
//   node scripts/mobile-shot.mjs            จอ 440×956 (iPhone ของพี่กัน)
//   node scripts/mobile-shot.mjs 390 844    จอเล็กกว่า
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:3000';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const pw = (() => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const W = Number(process.argv[2] || 440);
const H = Number(process.argv[3] || 956);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      // 🚨 สคริปต์เทสห้ามแตะฐานจริง — ดักทุกคำขอที่ไม่ใช่การอ่าน
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
      }
      r.continue();
    });

    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      // 🚨 ต้องรอช่องรหัสโผล่จริง ห้ามรอเป็นเวลาตายตัว
      //    หน้าเข้าสู่ระบบโหลดฉากหลัง three.js (~600 KB) ก่อน ช้ากว่า 900 มิลลิวินาทีบ่อย
      //    รอไม่ทันแล้วสคริปต์พังทั้งตัวว่า No element found ทั้งที่เว็บปกติดี
      await page.waitForSelector('#mrv-pw', { timeout: 20000 });
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3500);

    fs.mkdirSync('out', { recursive: true });

    const shot = async (name, sel) => {
      const el = sel ? await page.$(sel) : null;
      if (sel && !el) { console.log('  ข้าม ' + name + ' (ไม่เจอ ' + sel + ')'); return; }
      await (el || page).screenshot({ path: 'out/m-' + name + '.png' });
      console.log('  out/m-' + name + '.png');
    };

    console.log('');
    console.log('จอ ' + W + '×' + H);
    await shot('full');
    await shot('nav', '[role="navigation"]');

    // แถบบันทึกล่างจอ — เป็นพี่น้องของแถบเมนู หาจากกล่องที่มีปุ่มบันทึก
    const barBox = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[role="button"]')]
        .find((e) => /^(บันทึก \d|เลือกยาก่อน|ลองส่งใหม่|กำลังบันทึก)/.test((e.innerText || '').trim()));
      if (!btn) return null;
      let el = btn;
      for (let i = 0; i < 4 && el.parentElement; i++) el = el.parentElement;
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height };
    });
    if (barBox) {
      await page.screenshot({ path: 'out/m-savebar.png', clip: barBox });
      console.log('  out/m-savebar.png');
    }

    // วัดแถวหัวเว็บ — ชื่อเว็บตกบรรทัดเมื่อที่ว่างไม่พอ
    const head = await page.evaluate(() => {
      const all = [...document.querySelectorAll('[role="button"]')];
      const t = all.find((e) => (e.innerText || '').trim() === 'มูลค่ายาคืน');
      const org = t && t.parentElement ? t.parentElement.lastElementChild : null;
      const row = t ? t.parentElement.parentElement.parentElement : null;
      const b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
      const btns = row ? [...row.querySelectorAll('[role="button"]')].map((e) => ({ txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 16), box: b(e) })) : [];
      return { title: b(t), org: b(org), row: b(row), btns: btns };
    });
    console.log('');
    console.log('แถวหัวเว็บ');
    console.log('  ชื่อเว็บ  ' + JSON.stringify(head.title));
    console.log('  หน่วยงาน ' + JSON.stringify(head.org));
    for (const x of head.btns) console.log('  ปุ่ม ' + JSON.stringify(x.txt) + ' ' + JSON.stringify(x.box));
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
