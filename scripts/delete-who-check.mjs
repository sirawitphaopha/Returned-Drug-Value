// ตรวจว่าลบรายการต้องเลือกชื่อผู้ลบก่อน (ผลตรวจข้อ ต-6)
//
// 🚨 กดปุ่มจริงทีละขั้นเหมือนคนใช้ ไม่ใช่ setState แล้วอ่านค่า
//    บทเรียน v0.15.1.0 — ปุ่มยืนยันไม่มีฟังก์ชันผูก แต่เทสแบบ setState ผ่านหมด
//
// 🚨 ทำในโหมดดูตัวอย่างเท่านั้น ข้อมูลจริงต้องไม่ถูกแตะ
//    ตัวกันในเว็บตีกลับทุกคำขอที่ไม่ใช่ GET อยู่แล้ว แต่ดัก DELETE ไว้อีกชั้น
//
//   node scripts/delete-who-check.mjs
//   SHOW=1 node scripts/delete-who-check.mjs
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome'
];
const findChrome = () => {
  for (const p of PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ');
};
const readPw = () => {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// เอื้อมถึงตัวแอปผ่าน React fiber — ท่าเดียวกับ scripts/demo-check.mjs
const grab = (page, src) => page.evaluate((x) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) {
    if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
    f = f.return;
  }
  if (!app) return 'ไม่เจอตัวแอป';
  return new Function('app', x)(app);
}, src);

let ผิด = 0;
const ตรวจ = (ok, ดี, แย่) => {
  if (ok) console.log('  ✅ ' + ดี);
  else { ผิด++; console.log('  ❌ ' + แย่); }
};

let ยิงลบจริง = 0;

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

    // 🚨 ต้องรอให้หน้าเข้าสู่ระบบทำงานเสร็จก่อนพิมพ์ ไม่งั้นตัวรับคีย์ยังไม่ติด
    //    และห้ามตัดสินว่าสำเร็จจาก URL — คุกกี้ถูกตั้งจาก /api/auth ไม่ใช่จากการเปลี่ยนหน้า
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      const pw = readPw();
      if (!pw) throw new Error('ไม่มีรหัสผ่านใน .env.local');
      await page.type('#mrv-pw', pw);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }

    // 🚨 เปิดตัวดักคำขอ "หลัง" เข้าสู่ระบบเท่านั้น
    //    เปิดตั้งแต่แรกแล้วคุกกี้ไม่ติด ล็อกอินไม่ผ่าน (เสียเวลาไปหนึ่งรอบ)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && req.url().indexOf('/api/returns/') >= 0) {
        ยิงลบจริง++;
        return req.respond({ status: 403, contentType: 'application/json', body: '{"error":"เทส"}' });
      }
      req.continue();
    });

    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3400);

    await grab(page, 'app.enterDemo(); return 1;');
    await wait(2800);
    await grab(page, 'app.goScreen("history"); return 1;');
    await wait(1800);

    const โหมด = await grab(page, 'return app.state.demo === true;');
    ตรวจ(โหมด === true, 'อยู่ในโหมดดูตัวอย่าง ข้อมูลจริงไม่ถูกแตะ', 'เข้าโหมดดูตัวอย่างไม่ได้');
    if (โหมด !== true) throw new Error('ไม่ได้อยู่ในโหมดดูตัวอย่าง');

    // 🚨 ล้างชื่อผู้บันทึกก่อน — โหมดตัวอย่างเลือกไว้ให้แล้ว ค่าเริ่มต้นในป๊อปจึงถูกเติม
    //    ต้องเริ่มจากช่องว่าง ถึงจะทดสอบด่าน 'ยังไม่เลือก' ได้จริง
    await grab(page, 'app.setState({ recorder: String() }); return 1;');
    await wait(600);

    // ── กดปุ่มลบของแถวแรกจริง ๆ ────────────────────────────────────────
    const กดลบ = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === 'ลบ');
      if (!el) return false;
      el.click();
      return true;
    });
    ตรวจ(กดลบ, 'กดปุ่มลบในหน้าประวัติได้', 'หาปุ่มลบในหน้าประวัติไม่เจอ');
    await wait(800);

    const อ่านป๊อป = () => page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      const sel = d.querySelector('select');
      const ok = [...d.querySelectorAll('div')].find((b) => b.textContent.trim() === 'ยืนยันลบ');
      return {
        มีช่อง: !!sel,
        ป้าย: d.textContent.indexOf('ผู้ที่ลบ') >= 0,
        เตือน: d.textContent.indexOf('ต้องเลือกก่อนยืนยัน') >= 0,
        จำนวนชื่อ: sel ? sel.options.length - 1 : 0,
        กดได้: ok ? getComputedStyle(ok).cursor === 'pointer' : null
      };
    });

    const ป๊อป = await อ่านป๊อป();
    ตรวจ(!!ป๊อป, 'ป๊อปยืนยันเปิดขึ้นมา', 'ป๊อปยืนยันไม่เปิด');
    if (!ป๊อป) throw new Error('ไม่มีป๊อป');

    ตรวจ(ป๊อป.มีช่อง && ป๊อป.ป้าย, 'ป๊อปมีช่องเลือก "ผู้ที่ลบ"', 'ป๊อปไม่มีช่องเลือกผู้ที่ลบ');
    ตรวจ(ป๊อป.เตือน, 'ขึ้นป้ายแดง "ต้องเลือกก่อนยืนยัน"', 'ไม่มีป้ายบอกว่าต้องเลือกก่อน');
    ตรวจ(ป๊อป.จำนวนชื่อ > 0, 'มีรายชื่อให้เลือก ' + ป๊อป.จำนวนชื่อ + ' คน', 'รายชื่อว่างเปล่า เลือกอะไรไม่ได้');
    ตรวจ(ป๊อป.กดได้ === false, 'ปุ่มยืนยันลบกดไม่ได้ตอนยังไม่เลือกชื่อ', 'ปุ่มยืนยันลบยังกดได้ทั้งที่ยังไม่เลือกชื่อ');

    const กดยืนยัน = () => page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return false;
      const ok = [...d.querySelectorAll('div')].find((b) => b.textContent.trim() === 'ยืนยันลบ');
      if (!ok) return false;
      ok.click();
      return true;
    });
    await กดยืนยัน();
    await wait(700);
    const ยังเปิด = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
    ตรวจ(ยังเปิด, 'กดยืนยันทั้งที่ยังไม่เลือกชื่อ ป๊อปยังอยู่ ไม่มีอะไรถูกลบ', 'ป๊อปปิดไปทั้งที่ยังไม่ได้เลือกชื่อ');

    // ── เลือกชื่อ แล้วปุ่มต้องกดได้ ──────────────────────────────────────
    const ชื่อ = await page.evaluate(() => {
      const sel = document.querySelector('[role="dialog"] select');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, sel.options[1].value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return sel.options[1].value;
    });
    await wait(700);
    const หลังเลือก = await อ่านป๊อป();
    ตรวจ(หลังเลือก && หลังเลือก.กดได้, 'เลือกชื่อ "' + ชื่อ + '" แล้วปุ่มยืนยันกดได้', 'เลือกชื่อแล้วปุ่มยังกดไม่ได้');
    ตรวจ(หลังเลือก && !หลังเลือก.เตือน, 'ป้ายแดงหายไปหลังเลือกชื่อ', 'ป้ายแดงยังค้างอยู่ทั้งที่เลือกแล้ว');

    await กดยืนยัน();
    await wait(1400);
    const ปิดแล้ว = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
    ตรวจ(ปิดแล้ว, 'เลือกชื่อแล้วกดยืนยัน ป๊อปปิดลง', 'กดยืนยันแล้วป๊อปยังค้าง');
    ตรวจ(ยิงลบจริง === 0, 'ไม่มีคำขอลบหลุดไปถึงฐานข้อมูลจริงเลย', 'มีคำขอลบหลุดไปถึงฐานจริง ' + ยิงลบจริง + ' ครั้ง');

    console.log('');
    console.log(ผิด ? '  ❌ ยังไม่ผ่าน ' + ผิด + ' ข้อ' : '  ✅ ผ่านครบ');
    process.exitCode = ผิด ? 1 : 0;
  } finally {
    if (process.env.SHOW === String.fromCharCode(49)) await wait(Number(process.env.HOLD || 12) * 1000);
    await browser.close();
  }
})();
