// ═══════════════════════════════════════════════════════════════════════════
// ตรวจว่าทุกหน้าต่างเป็นเอกเทศจริง (ส-7)
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 31 ส.ค. 2569:
//   "ที่กรอก 100 เครื่องก็ต้องแยกกัน และกรอกโครมเดียวกัน แต่คนละคนต้องแยกกัน
//    ให้ทุกอย่างมันเอกเทศกัน"
//
// พิสูจน์ 6 อย่างในเว็บจริง
//   ① เปิด 3 หน้าต่าง กรอกคนละยา ต้องไม่เห็นของกันเลย
//   ② รีเฟรชหน้าต่างไหน ของหน้าต่างนั้นต้องยังอยู่ครบ
//   ③ ปิดหน้าต่างทั้งที่กรอกค้าง เปิดใหม่ต้องขึ้นแถบให้เอากลับมา
//   ④ กดเอากลับมาแล้วยาต้องครบ
//   ⑤ หน้าต่างที่ยังเปิดอยู่ ห้ามมีใครมาแย่งร่างไปได้
//   ⑥ ล็อตที่ส่งไม่สำเร็จต้องถูกดึงกลับมาเองโดยไม่ต้องกด
//
//   node scripts/tab-check.mjs
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

// เพิ่มยาเข้ารายการโดยยิงเข้าตัวแอปโดยตรง (เส้นทางเดียวกับที่ปุ่มเรียก)
async function addDrug(page, name, price, qty) {
  return page.evaluate((nm, pr, qt) => {
    const el = document.querySelector('[role="button"]');
    const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
    let f = key ? el[key] : null, app = null;
    while (f) {
      if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
      f = f.return;
    }
    if (!app) return 'ไม่เจอตัวแอป';
    const rows = app.state.rows.concat([{
      rid: 'r' + Math.random().toString(36).slice(2, 9),
      drugId: null, name: nm, unit: 'เม็ด', price: pr, qty: qt, disposition: 'reuse', source: 'opd'
    }]);
    app.persist({ rows: rows });
    return 'ok';
  }, name, price, qty);
}

const rowsOf = (page) => page.evaluate(() => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) {
    if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
    f = f.return;
  }
  return app ? app.state.rows.map((r) => r.name) : ['ไม่เจอตัวแอป'];
});

async function login(page) {
  // 🚨 ตั้งแต่ v0.13.1.0 เว็บถามก่อนออกจากหน้าเมื่อมีของค้าง ต้องดักไว้ ไม่งั้นสคริปต์ค้าง
  page.on('dialog', (d) => d.accept().catch(() => {}));
  // 🚨 สคริปต์เทสห้ามส่งของขึ้นฐานจริงเด็ดขาด (เคยเผลอสร้างขยะไป 4 ล็อต)
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.url().indexOf('/api/returns') >= 0 && r.method() === 'POST') {
      r.respond({ status: 503, contentType: 'application/json', body: '{\"error\":\"เทสไม่แตะฐานจริง\"}' });
      return;
    }
    r.continue();
  });
  // เปิดหลายหน้าต่างพร้อมกันบนเซิร์ฟเวอร์ทดสอบ ต้องเผื่อเวลาให้มากกว่าปกติ
  page.setDefaultNavigationTimeout(90000);
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(1200);
  if (page.url().indexOf('/login') >= 0) {
    await page.type('#mrv-pw', pw);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
  }
  // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
  await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(3200);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    // ── ① สามหน้าต่าง กรอกคนละยา ────────────────────────────────────────
    log('');
    log('① เปิด 3 หน้าต่าง กรอกคนละคนไข้');
    const A = await browser.newPage(); A.on('dialog', (d) => d.accept().catch(() => {}));
    await A.setViewport({ width: 1400, height: 900 }); await login(A);
    const B = await browser.newPage(); await B.setViewport({ width: 1400, height: 900 }); await login(B);
    const C = await browser.newPage(); await C.setViewport({ width: 1400, height: 900 }); await login(C);

    await addDrug(A, 'Amoxicillin 500 mg', 2.5, 20);
    await addDrug(B, 'Metformin 500 mg', 1, 30);
    await addDrug(C, 'Simvastatin 40 mg', 2.5, 30);
    await wait(1200);

    const a1 = await rowsOf(A), b1 = await rowsOf(B), c1 = await rowsOf(C);
    check(a1.length === 1 && a1[0].indexOf('Amox') === 0, 'หน้าต่าง 1 มีแต่ยาของตัวเอง', a1.join(' · '));
    check(b1.length === 1 && b1[0].indexOf('Metf') === 0, 'หน้าต่าง 2 มีแต่ยาของตัวเอง', b1.join(' · '));
    check(c1.length === 1 && c1[0].indexOf('Simv') === 0, 'หน้าต่าง 3 มีแต่ยาของตัวเอง', c1.join(' · '));

    // ── ② รีเฟรชแล้วของยังอยู่ ──────────────────────────────────────────
    log('');
    log('② รีเฟรชหน้าต่างที่ 2');
    await B.reload({ waitUntil: 'networkidle2' });
    await wait(3000);
    const b2 = await rowsOf(B);
    check(b2.length === 1 && b2[0].indexOf('Metf') === 0, 'ของหน้าต่างนั้นยังอยู่ครบหลังรีเฟรช', b2.join(' · '));
    const a2 = await rowsOf(A);
    check(a2.length === 1 && a2[0].indexOf('Amox') === 0, 'หน้าต่างอื่นไม่กระทบ', a2.join(' · '));

    // ── ⑤ หน้าต่างที่ยังเปิดอยู่ ห้ามถูกแย่งร่าง ────────────────────────
    log('');
    log('⑤ เปิดหน้าต่างที่ 4 ขณะที่ทุกหน้าต่างยังเปิดอยู่');
    const D = await browser.newPage(); await D.setViewport({ width: 1400, height: 900 }); await login(D);
    const d1 = await rowsOf(D);
    const parkedD = await D.evaluate(() => document.body.innerText.indexOf('มีล็อตที่กรอกค้างไว้') >= 0);
    check(d1.length === 0, 'หน้าต่างใหม่เริ่มจากว่างเปล่า', d1.length + ' รายการ');
    const dbg = await D.evaluate(() => {
      const el = document.querySelector('[role=\"button\"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
      if (!app) return 'ไม่เจอตัวแอป';
      return {
        ร่างในเครื่อง: (app.state.parked || []).length,
        ร่างบนเซิร์ฟเวอร์: (app.state.serverDrafts || []).map((d) => d.device_id + '/' + d.tab_id),
        ทะเบียน: localStorage.getItem('mrv.tabs')
      };
    });
    log('   ที่มาของแถบ: ' + JSON.stringify(dbg));
    check(!parkedD, 'ไม่มีแถวไหนของหน้าต่างที่ยังเปิดอยู่ถูกเสนอให้เอาไป');

    // ── ③④ ปิดหน้าต่างทั้งที่กรอกค้าง ──────────────────────────────────
    log('');
    log('③ ปิดหน้าต่างที่ 3 ทั้งที่ยังกรอกค้าง แล้วเปิดหน้าต่างใหม่');
    await C.close();
    await wait(1000);
    // ทะเบียนถือว่ายังมีชีวิตอีก 45 วินาที — เร่งเวลาโดยลบรายการของมันออกจากทะเบียน
    await D.evaluate(() => {
      try {
        const reg = JSON.parse(localStorage.getItem('mrv.tabs') || '{}');
        const mine = sessionStorage.getItem('mrv.tab');
        for (const k of Object.keys(reg)) if (k !== mine) reg[k] = 0;
        localStorage.setItem('mrv.tabs', JSON.stringify(reg));
      } catch (e) {}
    });

    const E = await browser.newPage(); await E.setViewport({ width: 1400, height: 900 }); await login(E);
    const banner = await E.evaluate(() => document.body.innerText.indexOf('มีล็อตที่กรอกค้างไว้') >= 0);
    check(banner, 'ขึ้นแถบบอกว่ามีล็อตที่กรอกค้างไว้');
    const eBefore = await rowsOf(E);
    check(eBefore.length === 0, 'ยังไม่ดึงมาเอง ต้องกดก่อน', eBefore.length + ' รายการ');

    log('');
    log('④ กดปุ่มเอากลับมา');
    const clicked = await E.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find((e) => e.getAttribute('aria-label') === 'เอาล็อตที่กรอกค้างไว้กลับมา');
      if (!el) return false; el.click(); return true;
    });
    await wait(1500);
    const eAfter = await rowsOf(E);
    check(clicked, 'เจอปุ่มเอากลับมา');
    check(eAfter.length >= 1, 'ยากลับมาครบ', eAfter.join(' · '));

    // ⑥ ล็อตที่ส่งไม่สำเร็จ ย้ายไปอยู่ scripts/tab-failed-check.mjs
    //    เพราะต้องดักคำขอบันทึกไม่ให้แตะฐานจริง และเปิดปิดหน้าต่างหลายรอบ

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
