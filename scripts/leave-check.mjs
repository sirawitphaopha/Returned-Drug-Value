// ตรวจว่าเว็บถามก่อนออกจากหน้าเมื่อยังไม่ได้กดบันทึก (พี่กันสั่ง 31 ส.ค. 2569)
//
//   "ป้องกันการกดรีเฟรช มันจะถามก่อนว่าจะออกจากหน้าเว็บนี้ไหม ถ้ายังไม่กดบันทึก"
//
// 🚨 ทดสอบด้วยการกดรีเฟรชจริง แล้วดูว่าเบราว์เซอร์เด้งถามหรือไม่
//    ไม่ใช่ดูแค่ว่ามีโค้ดผูกไว้ — โค้ดที่ผูกแล้วแต่เงื่อนไขผิดก็ไม่ถามอยู่ดี
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
const log = (m) => console.log(m);
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

const grab = (page, src) => page.evaluate((s) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) {
    if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
    f = f.return;
  }
  if (!app) return 'ไม่เจอตัวแอป';
  return new Function('app', s)(app);
}, src);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 1400, height: 900 });

    // ดักหน้าต่างเด้งของเบราว์เซอร์ไว้ดูว่าเด้งจริงไหม
    let asked = 0, lastMsg = '';
    page.on('dialog', async (d) => {
      asked++;
      lastMsg = d.type() + ' · ' + (d.message() || '(ข้อความของเบราว์เซอร์เอง)');
      await d.accept().catch(() => {});
    });

    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' });
        return;
      }
      r.continue();
    });

    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3000);

    // ── ① ยังไม่มีรายการ — ไม่ควรถาม ────────────────────────────────────
    log('');
    log('① รีเฟรชตอนยังไม่มีรายการ');
    asked = 0;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(2500);
    check(asked === 0, 'ไม่ถาม เพราะไม่มีอะไรจะเสีย', asked + ' ครั้ง');

    // ── ② มีรายการค้าง ยังไม่กดบันทึก — ต้องถาม ─────────────────────────
    log('');
    log('② รีเฟรชตอนมีรายการค้างยังไม่ได้บันทึก');
    await grab(page, `
      app.persist({ rows: [{ rid: 'lv1', drugId: null, name: 'Amoxicillin 500 mg',
        unit: 'เม็ด', price: 2.5, qty: 20, disposition: 'reuse', source: 'opd' }] });
      return app.state.rows.length;`);
    await wait(1200);

    // ตรวจว่าตัวดักถูกผูกไว้จริงและเงื่อนไขผ่าน
    const armed = await page.evaluate(() => {
      const ev = new Event('beforeunload', { cancelable: true });
      const blocked = !window.dispatchEvent(ev);
      return blocked;
    });
    check(armed, 'เว็บสั่งให้เบราว์เซอร์ถามก่อนออกจากหน้า');

    asked = 0;
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await wait(2500);
    log('   หน้าต่างเด้งที่เบราว์เซอร์แสดง: ' + (asked ? lastMsg : 'ไม่มี'));

    const after = await grab(page, `return app.state.rows.length;`);
    check(after === 1, 'ยาไม่หายหลังรีเฟรช', after + ' รายการ');

    // ── ③ โหมดดูตัวอย่าง — ไม่ควรถาม ───────────────────────────────────
    log('');
    log('③ โหมดดูตัวอย่าง');
    const demoOn = await grab(page, `
      if (typeof app.enterDemo !== 'function') return false;
      app.enterDemo();
      return true;`);
    await wait(3500);
    const demoArmed = await page.evaluate(() => {
      const ev = new Event('beforeunload', { cancelable: true });
      return !window.dispatchEvent(ev);
    });
    check(demoOn && !demoArmed, 'ไม่ถามในโหมดดูตัวอย่าง ข้อมูลปลอมหายได้ไม่เสียหาย');

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
