// ═══════════════════════════════════════════════════════════════════════════
// ตรวจระบบตั้งชื่อเครื่อง + ร่างบนเซิร์ฟเวอร์ (v0.14.0.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 31 ส.ค. 2569 — "ไม่ข้าม ต้องเลือก" · "เลือกจากมือถือ หรือคอม ก่อน"
// และความกลัวที่แท้จริง — "กรอกไปชั่วโมงนึง แล้วเน็ตหลุด · คอมรีสตาร์ต"
//
// 🚨 สคริปต์นี้ดัก POST /api/returns ไว้ ไม่ให้แตะข้อมูลจริง
//    แต่ปล่อยให้เขียน /api/drafts ได้ เพราะเป็นสิ่งที่กำลังทดสอบ (ล้างท้ายสคริปต์)
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
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

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

const txt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

async function open(browser) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1400, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url(), m = r.method();
    // ดักเฉพาะการบันทึกล็อตจริง ปล่อยให้ /api/drafts ทำงานเพราะเป็นสิ่งที่ทดสอบ
    if (u.indexOf('/api/returns') >= 0 && m === 'POST') {
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
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(3200);
  return page;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    // ── ① เปิดเว็บครั้งแรก ต้องถามชื่อเครื่อง ────────────────────────────
    log('');
    log('① เปิดเว็บครั้งแรกในเครื่องนี้');
    const A = await open(browser);
    let t = await txt(A);
    check(t.indexOf('เครื่องนี้คือเครื่องไหน') >= 0, 'ถามชื่อเครื่องทันที');
    check(t.indexOf('ต้องเลือกก่อนจึงจะใช้งานได้') >= 0, 'บอกว่าต้องเลือกก่อน');
    check(t.indexOf('ข้ามไปก่อน') < 0, 'ไม่มีปุ่มข้าม (พี่กันสั่ง)');

    // ── ② เลือกชนิดเครื่อง ──────────────────────────────────────────────
    log('');
    log('② เลือกชนิดเครื่อง');
    const clickLabel = (page, label) => page.evaluate((l) => {
      const el = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === l);
      if (!el) return false; el.click(); return true;
    }, label);

    await clickLabel(A, 'เลือก คอมพิวเตอร์');
    await wait(700);
    const comps = await A.evaluate(() => [...document.querySelectorAll('select option')]
      .map((o) => o.textContent).filter((x) => x.indexOf('computer') === 0));
    check(comps.length === 8, 'เลือกคอมแล้วขึ้นรายชื่อ 8 เครื่อง', comps.length + ' เครื่อง');
    check(comps[0] === 'computer OPD เครื่องที่ 1', 'ชื่อตรงกับที่พี่กันให้มา', comps[0]);

    await clickLabel(A, 'เลือก มือถือ หรือแท็บเล็ต');
    await wait(700);
    const mobs = await A.evaluate(() => [...document.querySelectorAll('select option')]
      .map((o) => o.textContent).filter((x) => x.indexOf('มือถือของ') === 0));
    check(mobs.length > 0, 'เลือกมือถือแล้วขึ้นรายชื่อเจ้าหน้าที่', mobs.length + ' ชื่อ · ' + (mobs[0] || ''));

    // ── ③ เลือกเครื่องแล้วใช้งานได้ ─────────────────────────────────────
    log('');
    log('③ เลือกคอมเครื่องที่ 1 แล้วยืนยัน');
    await clickLabel(A, 'เลือก คอมพิวเตอร์');
    await wait(500);
    await A.evaluate(() => {
      const sel = document.querySelector('select');
      const setV = window.Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setV.call(sel, 'computer OPD เครื่องที่ 1');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(600);
    await clickLabel(A, 'ยืนยันชื่อเครื่อง');
    await wait(1800);

    t = await txt(A);
    const dev = await grab(A, `return app.state.deviceId || '';`);
    check(t.indexOf('เครื่องนี้คือเครื่องไหน') < 0, 'หน้าต่างปิดแล้ว');
    check(dev === 'computer OPD เครื่องที่ 1', 'จำชื่อเครื่องไว้แล้ว', dev);

    // ── ④ กรอกยาแล้วร่างขึ้นเซิร์ฟเวอร์ ─────────────────────────────────
    log('');
    log('④ กรอกยาแล้วร่างขึ้นเซิร์ฟเวอร์เอง');
    await grab(A, `
      app.persist({ rows: [
        { rid: 'd1', drugId: null, name: 'ยาทดสอบเครื่อง 1', unit: 'เม็ด',
          price: 3, qty: 12, disposition: 'reuse', source: 'opd' }
      ], hn: '9001' });
      return 'ok';`);
    await wait(4500);   // ตัวส่งหน่วง 2 วินาที เผื่อเวลาให้ครบ

    const onServer = await A.evaluate(async () => {
      const r = await fetch('/api/drafts?device=' + encodeURIComponent('computer OPD เครื่องที่ 1') + '&tab=zz');
      const j = await r.json();
      return (j.drafts || []).filter((d) => d.mine).length;
    });
    check(onServer >= 1, 'ร่างขึ้นไปอยู่บนเซิร์ฟเวอร์แล้ว', onServer + ' ก้อน');

    // ── ⑤ เครื่องเดียวกัน หน้าต่างใหม่ เห็นร่างของเครื่องตัวเอง ─────────
    log('');
    log('⑤ เปิดหน้าต่างใหม่ในเครื่องเดียวกัน');
    const B = await browser.newPage();
    B.on('dialog', (d) => d.accept().catch(() => {}));
    await B.setViewport({ width: 1400, height: 900 });
    await B.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4000);
    const tB = await txt(B);
    check(tB.indexOf('เครื่องนี้คือเครื่องไหน') < 0, 'ไม่ถามชื่อเครื่องซ้ำ');
    check(tB.indexOf('มีล็อตที่กรอกค้างไว้ในเครื่องนี้') >= 0 ||
          tB.indexOf('มีล็อตที่กรอกค้างไว้') >= 0, 'เห็นร่างของเครื่องตัวเอง');

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
    log('');
    log('⚠️ ร่างทดสอบยังค้างในตาราง mr_draft — ล้างด้วย SQL หลังดูผลเสร็จ');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
