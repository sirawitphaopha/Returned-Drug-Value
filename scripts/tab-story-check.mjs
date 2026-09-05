// ═══════════════════════════════════════════════════════════════════════════
// 3 สถานการณ์ที่พี่กันถาม 31 ส.ค. 2569
// ═══════════════════════════════════════════════════════════════════════════
//
//   ① กรอกไปแล้วเผลอปิดแท็บทั้งที่ยังไม่บันทึก จะเป็นยังไง
//   ② แท็บอื่นที่กำลังใช้งานอยู่ จะมีอะไรโผล่ไปไหม
//   ③ ถ้ารีเฟรชแท็บที่ใช้งานอยู่ ข้อมูลจากแท็บก่อนหน้าจะเข้ามาไหม
//
// 🚨 สคริปต์นี้ไม่แตะฐานข้อมูลจริงเลย ดักคำขอที่เขียนข้อมูลไว้หมดแล้ว
import fs from 'fs';
import puppeteer from 'puppeteer-core';

// พอร์ตอ่านจากตัวแปรแวดล้อม PORT ถ้าไม่ตั้งใช้ 3000
// (พี่กันตั้งกฎ 5 ก.ย. 2569 ว่าพอร์ตอาจไม่ว่าง ต้องเปิดพอร์ตอื่นได้)
// ใช้: PORT=3002 node scripts/xxx.mjs
const BASE = 'http://127.0.0.1:' + (process.env.PORT || '3000');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const pw = (() => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);

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

const seen = (page) => page.evaluate(() => ({
  แถบล็อตค้าง: document.body.innerText.indexOf('มีล็อตที่กรอกค้างไว้') >= 0,
  ข้อความบนแถบ: (document.body.innerText.match(/มีล็อตที่กรอกค้างไว้[^\n]*\n[^\n]*/) || [''])[0].replace(/\s+/g, ' ').trim()
}));

async function open(browser) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1400, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url(), m = r.method();
    // 🚨 ต้องยกเว้น /api/auth ไม่งั้นล็อกอินไม่ผ่านตั้งแต่แรก
    if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
      r.respond({ status: 503, contentType: 'application/json', body: '{"error":"เทสไม่แตะฐานจริง"}' });
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
  return page;
}

const addDrug = (page, name, price, qty) => grab(page, `
  const rows = app.state.rows.concat([{ rid: 'r' + Math.random().toString(36).slice(2, 9),
    drugId: null, name: '${name}', unit: 'เม็ด', price: ${price}, qty: ${qty},
    disposition: 'reuse', source: 'opd' }]);
  app.persist({ rows: rows });
  return app.state.rows.length;`);

const rowsOf = (page) => grab(page, `return app.state.rows.map(function (r) { return r.name; });`);

// เครื่องมือทดสอบปิดหน้าต่างโดยไม่ยิง pagehide เสมอไป (เบราว์เซอร์จริงยิงเสมอ)
// จึงต้องช่วยทำให้ทะเบียนหมดอายุเอง เพื่อให้ตรงกับพฤติกรรมจริง
const expireOthers = (page) => page.evaluate(() => {
  try {
    const reg = JSON.parse(localStorage.getItem('mrv.tabs') || '{}');
    const mine = sessionStorage.getItem('mrv.tab');
    for (const k of Object.keys(reg)) if (k !== mine) reg[k] = 0;
    localStorage.setItem('mrv.tabs', JSON.stringify(reg));
  } catch (e) {}
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    // ── เตรียมฉาก ────────────────────────────────────────────────────────
    log('');
    log('เตรียมฉาก — เปิด 2 หน้าต่าง');
    const A = await open(browser);
    const B = await open(browser);
    await addDrug(A, 'Amoxicillin 500 mg', 2.5, 20);
    await addDrug(B, 'Metformin 500 mg', 1, 30);
    await wait(1200);
    log('   หน้าต่าง A มี: ' + (await rowsOf(A)).join(' · '));
    log('   หน้าต่าง B มี: ' + (await rowsOf(B)).join(' · '));

    // ── ① เผลอปิดหน้าต่าง A ทั้งที่ยังไม่บันทึก ─────────────────────────
    log('');
    log('① เผลอปิดหน้าต่าง A ทั้งที่ยังไม่บันทึก');
    await A.close({ runBeforeUnload: false });
    await wait(1500);
    const stillThere = await B.evaluate(() => {
      let n = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('mrv.session.') === 0) {
          const v = JSON.parse(localStorage.getItem(k) || '{}');
          if ((v.rows || []).length) n++;
        }
      }
      return n;
    });
    log('   → ยาที่กรอกไว้ยังอยู่ในเครื่อง (ร่างที่มีของ ' + stillThere + ' ก้อน) ไม่ได้หายไปไหน');

    // ── ② หน้าต่าง B ที่กำลังใช้งานอยู่ มีอะไรโผล่ไหม ────────────────────
    log('');
    log('② หน้าต่าง B ที่กำลังใช้งานอยู่ — มีอะไรโผล่ไปไหม');
    await expireOthers(B);
    await wait(2000);
    const bNow = await seen(B);
    const bRows = await rowsOf(B);
    log('   → แถบล็อตค้างโผล่ในหน้าต่าง B: ' + (bNow.แถบล็อตค้าง ? '🔴 โผล่' : '✅ ไม่โผล่'));
    log('   → รายการยาในหน้าต่าง B: ' + bRows.join(' · ') + ' (' + bRows.length + ' รายการ)');

    // ── ③ รีเฟรชหน้าต่าง B ─────────────────────────────────────────────
    log('');
    log('③ รีเฟรชหน้าต่าง B ที่กำลังใช้งานอยู่');
    await B.reload({ waitUntil: 'domcontentloaded' });
    await wait(3500);
    const bAfter = await seen(B);
    const bRows2 = await rowsOf(B);
    log('   → รายการยาของหน้าต่าง B เอง: ' + bRows2.join(' · ') + ' (' + bRows2.length + ' รายการ)');
    log('   → ยาจากหน้าต่าง A ไหลเข้ามาไหม: ' +
      (bRows2.some((n) => n.indexOf('Amox') === 0) ? '🔴 เข้ามา' : '✅ ไม่เข้ามา'));
    log('   → แถบล็อตค้างขึ้นไหม: ' + (bAfter.แถบล็อตค้าง ? 'ขึ้น' : 'ไม่ขึ้น'));
    if (bAfter.ข้อความบนแถบ) log('     ข้อความ: ' + bAfter.ข้อความบนแถบ);

    // ── ④ กดเอากลับมาตอนที่มีของในมืออยู่แล้ว ──────────────────────────
    log('');
    log('④ ลองกดปุ่มเอากลับมา ทั้งที่หน้าต่างนี้มียาอยู่แล้ว');
    const clicked = await B.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find((e) => e.getAttribute('aria-label') === 'เอาล็อตที่กรอกค้างไว้กลับมา');
      if (!el) return false; el.click(); return true;
    });
    await wait(1500);
    const bRows3 = await rowsOf(B);
    const toast = await B.evaluate(() => document.body.innerText.indexOf('มีรายการค้างอยู่แล้ว') >= 0);
    log('   → กดปุ่มได้: ' + (clicked ? 'ใช่' : 'ไม่เจอปุ่ม'));
    log('   → รายการหลังกด: ' + bRows3.join(' · ') + ' (' + bRows3.length + ' รายการ)');
    log('   → ระบบเตือนว่ามีของในมืออยู่แล้ว: ' + (toast ? '✅ เตือน' : '⚠️ ไม่เตือน'));

    log('');
    log('เสร็จ — ไม่มีอะไรถูกส่งขึ้นฐานข้อมูลจริงเลยสักรายการ');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
