// ตรวจ "ดึงลงเพื่อโหลดใหม่" + "เปลี่ยนหน้าไม่วาบ" (พี่กันสั่ง 1 ก.ย. 2569)
// 🚨 สคริปต์เทสห้ามแตะฐานจริง — ดักทุกคำขอที่ไม่ใช่การอ่าน
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

let pass = 0, fail = 0;
const ok = (yes, name, note) => {
  if (yes) { pass++; console.log('  ผ่าน  ' + name); }
  else { fail++; console.log('  🔴ตก  ' + name + (note ? '  — ' + note : '')); }
};

// อ่านค่าจากตัวแอปโดยตรง
const grab = (page, src) => page.evaluate((x) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) {
    if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
    f = f.return;
  }
  if (!app) return '__ไม่เจอตัวแอป__';
  return new Function('app', x)(app);
}, src);

// ลากนิ้วลงจากกลางจอส่วนบน
const drag = async (page, dy, hold) => {
  const t = page.touchscreen;
  await t.touchStart(220, 200);
  for (let i = 1; i <= 6; i++) { await t.touchMove(220, 200 + (dy * i / 6)); await wait(28); }
  if (hold) await wait(hold);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const seen = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0) seen.push(m + ' ' + u.replace(BASE, ''));
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
      }
      r.continue();
    });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));

    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3500);

    console.log('');
    console.log('── พื้นฐาน ──');
    ok(errs.length === 0, 'เปิดเว็บแล้วไม่มีข้อผิดพลาด', errs.join(' · '));
    const mobileOn = await page.evaluate(() => document.body.classList.contains('mrv-mobile'));
    ok(mobileOn, 'จอ 440px ได้คลาสมือถือที่ body');
    const tabs = await grab(page, 'return 1;');
    ok(tabs !== '__ไม่เจอตัวแอป__', 'หาตัวแอปเจอ');

    console.log('');
    console.log('── แท็บฝั่งมือถือ ──');
    const labels = await page.evaluate(() => {
      const nav = document.querySelector('[role="navigation"]');
      return nav ? [...nav.querySelectorAll('[role="button"]')].map((e) => (e.innerText || '').trim()) : [];
    });
    ok(labels.length === 3, 'มี 3 แท็บ', 'เจอ ' + labels.length + ': ' + labels.join(','));
    ok(labels.indexOf('คลังยา') < 0, 'ไม่มีแท็บคลังยาบนมือถือ');
    const icons = await page.evaluate(() => {
      const nav = document.querySelector('[role="navigation"]');
      return nav ? nav.querySelectorAll('svg').length : 0;
    });
    ok(icons >= 3, 'ทุกแท็บมีไอคอนเส้นวาด', 'เจอ ' + icons + ' รูป');

    console.log('');
    console.log('── ดึงลงเพื่อโหลดใหม่ ──');
    // ลากน้อย ๆ แล้วปล่อย — ไม่ควรสั่งโหลด
    await drag(page, 40, 120);
    const smallY = await grab(page, 'return app.state.pullY;');
    ok(smallY > 0 && smallY < 62, 'ลากนิดเดียวแล้วหน้าขยับตามนิ้ว', 'pullY=' + smallY);
    const labelSmall = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="status"]')].find((e) => /ดึงลง|ปล่อยเพื่อ|กำลังโหลด/.test(e.innerText || ''));
      return el ? el.innerText.trim() : '';
    });
    ok(/ดึงลงเพื่อโหลดใหม่/.test(labelSmall), 'ยังไม่ถึงเกณฑ์ ขึ้นว่า "ดึงลงเพื่อโหลดใหม่"', labelSmall);
    await page.touchscreen.touchEnd();
    await wait(500);
    ok((await grab(page, 'return app.state.pullY;')) === 0, 'ปล่อยแล้วหน้าเด้งกลับที่เดิม');
    ok((await grab(page, 'return app.state.pullBusy;')) === false, 'ลากไม่ถึงเกณฑ์ = ไม่สั่งโหลด');

    // ลากยาวจนถึงเกณฑ์
    seen.length = 0;
    await drag(page, 220, 150);
    const bigY = await grab(page, 'return app.state.pullY;');
    ok(bigY >= 62, 'ลากยาวแล้วถึงเกณฑ์', 'pullY=' + bigY);
    const labelBig = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="status"]')].find((e) => /ดึงลง|ปล่อยเพื่อ|กำลังโหลด/.test(e.innerText || ''));
      return el ? el.innerText.trim() : '';
    });
    ok(/ปล่อยเพื่อโหลดใหม่/.test(labelBig), 'ถึงเกณฑ์แล้วเปลี่ยนเป็น "ปล่อยเพื่อโหลดใหม่"', labelBig);
    ok(bigY <= 92, 'ลากไกลแค่ไหนก็ไม่เกินเพดาน 92px', 'pullY=' + bigY);

    await page.touchscreen.touchEnd();
    await wait(120);
    ok((await grab(page, 'return app.state.pullBusy;')) === true, 'ปล่อยแล้วเริ่มโหลดจริง');
    await wait(1400);
    ok((await grab(page, 'return app.state.pullBusy;')) === false, 'โหลดเสร็จแล้วคืนหน้าจอ');
    ok((await grab(page, 'return app.state.pullY;')) === 0, 'โหลดเสร็จแล้วหน้ากลับที่เดิม');
    ok(seen.some((x) => x.indexOf('GET /api/rev') >= 0), 'ยิงถามลายเซ็นข้อมูลจริง', seen.join(' · ').slice(0, 90));
    ok(!seen.some((x) => x.indexOf('GET ') !== 0), 'ไม่มีคำขอที่แตะข้อมูล (GET ล้วน)');

    console.log('');
    console.log('── ดึงตอนไม่ได้อยู่บนสุด ──');
    await page.evaluate(() => { const sc = document.querySelector('[role="main"]'); if (sc) sc.scrollTop = 200; });
    await wait(200);
    await drag(page, 120, 100);
    const midY = await grab(page, 'return app.state.pullY;');
    ok(midY === 0, 'เลื่อนอยู่กลางหน้าแล้วลากลง หน้าต้องไม่ถูกดึง', 'pullY=' + midY);
    await page.touchscreen.touchEnd();
    await page.evaluate(() => { const sc = document.querySelector('[role="main"]'); if (sc) sc.scrollTop = 0; });
    await wait(300);

    console.log('');
    console.log('── เปลี่ยนหน้าไม่วาบ ──');
    const hasVT = await page.evaluate(() => typeof document.startViewTransition === 'function');
    ok(hasVT, 'เบราว์เซอร์ตัวนี้รองรับการไล่จาง');
    await page.evaluate(() => {
      window.__vt = 0;
      const real = document.startViewTransition;
      if (real) document.startViewTransition = function (cb) { window.__vt++; return real.call(document, cb); };
    });
    // กดแท็บประวัติ
    await page.evaluate(() => {
      const nav = document.querySelector('[role="navigation"]');
      const b = [...nav.querySelectorAll('[role="button"]')].find((e) => (e.innerText || '').trim() === 'ประวัติ');
      if (b) b.click();
    });
    await wait(900);
    ok((await grab(page, "return app.state.screen;")) === 'history', 'กดแท็บแล้วเปลี่ยนหน้าจริง');
    ok((await page.evaluate(() => window.__vt)) === 1, 'เปลี่ยนหน้าผ่านการไล่จาง 1 ครั้ง');
    // กดแท็บเดิมซ้ำ — ไม่ควรไล่จางอีก
    await page.evaluate(() => {
      const nav = document.querySelector('[role="navigation"]');
      const b = [...nav.querySelectorAll('[role="button"]')].find((e) => (e.innerText || '').trim() === 'ประวัติ');
      if (b) b.click();
    });
    await wait(500);
    ok((await page.evaluate(() => window.__vt)) === 1, 'กดแท็บเดิมซ้ำไม่ไล่จางซ้ำ');

    console.log('');
    console.log('── โหมดคอมต้องไม่มีอะไรเปลี่ยน ──');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1600, height: 950 });
    await page2.setRequestInterception(true);
    page2.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
      }
      r.continue();
    });
    await page2.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

    await wait(3200);
    ok(!(await page2.evaluate(() => document.body.classList.contains('mrv-mobile'))), 'จอ 1600px ไม่มีคลาสมือถือ');
    const deskTabs = await page2.evaluate(() => {
      const nav = document.querySelector('[role="navigation"]');
      return nav ? [...nav.querySelectorAll('[role="button"]')].map((e) => (e.innerText || '').trim()) : [];
    });
    ok(deskTabs.indexOf('คลังยา') >= 0, 'ฝั่งคอมยังมีแท็บคลังยาครบ', deskTabs.join(','));
    const deskTransform = await page2.evaluate(() => {
      const sc = document.querySelector('[role="main"]');
      return sc ? getComputedStyle(sc).transform : 'x';
    });
    ok(deskTransform === 'none', 'พื้นที่เลื่อนฝั่งคอมไม่ถูกขยับเลย', deskTransform);
    const deskOver = await page2.evaluate(() => {
      const sc = document.querySelector('[role="main"]');
      return sc ? getComputedStyle(sc).overscrollBehaviorY : 'x';
    });
    ok(deskOver === 'auto', 'ฝั่งคอมไม่โดนกฎ overscroll ของมือถือ', deskOver);

    console.log('');
    console.log(fail === 0 ? '✅ ผ่านครบ ' + pass + ' ข้อ' : '🔴 ตก ' + fail + ' ข้อ จาก ' + (pass + fail));
  } finally { await browser.close(); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
