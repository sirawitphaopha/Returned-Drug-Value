// ═══════════════════════════════════════════════════════════════════════════
// 3 สถานการณ์ที่พี่กันกลัวที่สุด (ถาม 31 ส.ค. 2569)
// ═══════════════════════════════════════════════════════════════════════════
//
//   ① กรอกไปชั่วโมงนึง แล้วเน็ตหลุด
//   ② กรอกไปแล้วคอมรีสตาร์ต
//   ③ กรอกไปแล้วไปทำอย่างอื่น พอมากดที่แท็บนั้นมันดันรีเฟรชใหม่
//
// 🚨 ไม่แตะฐานข้อมูลจริง — ดักคำขอที่เขียนข้อมูลไว้แล้ว
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

const rowsOf = (page) => grab(page, `return app.state.rows.length;`);

async function open(browser) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1400, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url(), m = r.method();
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

// กรอกยาหลายรายการ เหมือนกรอกมาสักพัก
const fillMany = (page, n) => grab(page, `
  const rows = [];
  for (let i = 0; i < ${n}; i++) {
    rows.push({ rid: 'c' + i, drugId: null, name: 'ยาทดสอบตัวที่ ' + (i + 1),
      unit: 'เม็ด', price: 2.5, qty: 10 + i, disposition: 'reuse', source: 'opd' });
  }
  app.persist({ rows: rows, hn: '6418302' });
  return app.state.rows.length;`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    const page = await open(browser);

    // ── ① เน็ตหลุดระหว่างกรอก ────────────────────────────────────────────
    log('');
    log('① กรอกไป 25 รายการ แล้วเน็ตหลุดกลางคัน');
    await fillMany(page, 25);
    await wait(1200);
    log('   กรอกไว้ ' + (await rowsOf(page)) + ' รายการ');

    await page.setOfflineMode(true);
    await wait(1500);
    log('   ตัดเน็ตแล้ว');

    // กรอกต่อตอนเน็ตหลุด
    const moreOk = await grab(page, `
      const rows = app.state.rows.concat([{ rid: 'off1', drugId: null,
        name: 'ยาที่กรอกตอนเน็ตหลุด', unit: 'เม็ด', price: 5, qty: 7,
        disposition: 'reuse', source: 'opd' }]);
      app.persist({ rows: rows });
      return rows.length;`);
    await wait(1000);
    check(moreOk === 26, 'กรอกต่อได้ตามปกติแม้เน็ตหลุด', moreOk + ' รายการ');

    // ค้นหายายังทำงานไหม (ยา 417 ตัวอยู่ในเครื่องแล้ว)
    const canSearch = await grab(page, `return (app.state.drugs || []).length;`);
    check(canSearch > 400, 'ยังค้นหายาได้ เพราะคลังยาอยู่ในเครื่องแล้ว', canSearch + ' ตัว');

    // ร่างยังถูกเขียนลงเครื่องระหว่างเน็ตหลุดไหม
    const savedOffline = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('mrv.session.') === 0) {
          const v = JSON.parse(localStorage.getItem(k) || '{}');
          if ((v.rows || []).length) return v.rows.length;
        }
      }
      return 0;
    });
    check(savedOffline === 26, 'ร่างถูกเก็บลงเครื่องครบ ไม่ต้องพึ่งเน็ตเลย', savedOffline + ' รายการ');

    await page.setOfflineMode(false);
    await wait(1200);

    // ── ② คอมรีสตาร์ต ───────────────────────────────────────────────────
    log('');
    log('② คอมรีสตาร์ต (ปิดเบราว์เซอร์ทั้งตัวแล้วเปิดใหม่)');
    // คอมรีสตาร์ต = sessionStorage หายหมด แต่ localStorage อยู่
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(3500);

    const afterBoot = await rowsOf(page);
    const banner = await page.evaluate(() => ({
      มีแถบ: document.body.innerText.indexOf('มีล็อตที่กรอกค้างไว้') >= 0,
      ข้อความ: (document.body.innerText.match(/มีล็อตที่กรอกค้างไว้[^\n]*\n[^\n]*/) || [''])[0].replace(/\s+/g, ' ').trim()
    }));
    log('   รายการที่ขึ้นเองทันที: ' + afterBoot + ' รายการ');
    log('   แถบล็อตค้าง: ' + (banner.มีแถบ ? banner.ข้อความ : 'ไม่ขึ้น'));
    check(banner.มีแถบ || afterBoot === 26, 'ยาไม่หาย ยังเอากลับมาได้',
      afterBoot === 26 ? 'กลับมาเองเลย' : 'ต้องกดปุ่มเอากลับมา');

    // กดเอากลับมาแล้วครบไหม
    if (banner.มีแถบ && afterBoot === 0) {
      const clicked = await page.evaluate(() => {
        const el = [...document.querySelectorAll('[aria-label]')]
          .find((e) => e.getAttribute('aria-label') === 'เอาล็อตที่กรอกค้างไว้กลับมา');
        if (!el) return false; el.click(); return true;
      });
      await wait(1500);
      const back = await rowsOf(page);
      const hn = await grab(page, `return app.state.hn || '';`);
      check(clicked && back === 26, 'กดเอากลับมาแล้วได้ครบทุกรายการ', back + ' รายการ');
      check(hn === '6418302', 'HN กลับมาด้วย', hn || 'ว่าง');
    }

    // ── ③ แท็บถูกเบราว์เซอร์ทิ้งแล้วโหลดใหม่ตอนกลับมา ─────────────────────
    log('');
    log('③ ไปทำอย่างอื่นนาน ๆ แล้วกลับมา แท็บโหลดใหม่เอง');
    // แท็บที่ถูกทิ้งแล้วโหลดใหม่ ต่างจากคอมรีสตาร์ตตรงที่ sessionStorage ยังอยู่
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(3500);
    const afterDiscard = await rowsOf(page);
    const bannerAgain = await page.evaluate(() =>
      document.body.innerText.indexOf('มีล็อตที่กรอกค้างไว้') >= 0);
    check(afterDiscard === 26, 'ยากลับมาเองทันที ไม่ต้องกดอะไรเลย', afterDiscard + ' รายการ');
    // ⚠️ ตั้งแต่ v0.14.0.0 ร่างถูกเก็บบนเซิร์ฟเวอร์ด้วย แถบอาจขึ้นได้ถ้ารหัสหน้าต่างเปลี่ยนไปแล้ว
    //    สิ่งที่ต้องผ่านคือ 'ยากลับมาเองทันที' ข้างบน ส่วนแถบเป็นแค่ข้อมูลประกอบ
    log('   แถบล็อตค้างขึ้นไหม: ' + (bannerAgain ? 'ขึ้น (ร่างบนเซิร์ฟเวอร์)' : 'ไม่ขึ้น'));

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
