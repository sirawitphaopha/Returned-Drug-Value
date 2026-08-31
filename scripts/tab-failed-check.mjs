// ตรวจว่าล็อตที่ "ส่งไม่สำเร็จ" ถูกดึงกลับมาเองเมื่อเปิดหน้าต่างใหม่ (ส-7)
//
// 🚨 เป็นเส้นทางที่สำคัญที่สุดของทั้งเรื่อง — ยาถูกรับคืนจากคนไข้ไปแล้ว
//    แต่ยังไม่ขึ้นระบบส่วนกลาง ถ้าไม่มีใครสานต่อ ของหายทั้งล็อตโดยไม่มีใครรู้
//
// แยกออกมาจาก tab-check.mjs เพราะต้องเปิดปิดหน้าต่างหลายรอบ
// รวมอยู่ในสคริปต์เดียวกันแล้วเบราว์เซอร์ทดสอบค้าง
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

const grab = (page, fn) => page.evaluate((src) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) {
    if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; }
    f = f.return;
  }
  if (!app) return 'ไม่เจอตัวแอป';
  return new Function('app', src)(app);
}, fn);

async function open(browser) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  // 🚨 กันไม่ให้สคริปต์เทสส่งของขึ้นฐานจริง (เคยเผลอสร้างขยะไป 4 ล็อตแล้ว)
  //    ดักเฉพาะการบันทึก ไม่แตะเส้นอื่น เพื่อให้ของค้างยังคงค้างอยู่ตามที่ต้องการเทส
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (u.indexOf('/api/returns') >= 0 && r.method() === 'POST') {
      r.respond({ status: 503, contentType: 'application/json', body: '{\"error\":\"จำลองเน็ตหลุด\"}' });
      return;
    }
    r.continue();
  });
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(1000);
  if (page.url().indexOf('/login') >= 0) {
    await page.type('#mrv-pw', pw);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
  }
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(3000);
  return page;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    log('');
    log('หน้าต่างที่ 1 — กรอกยาแล้วส่งไม่สำเร็จ');
    const A = await open(browser);
    await grab(A, `
      app.persist({ rows: [{ rid: 'rx1', drugId: null, name: 'Amoxicillin 500 mg',
        unit: 'เม็ด', price: 2.5, qty: 20, disposition: 'reuse', source: 'opd' }] });
      return 'ok';`);
    await wait(900);
    await grab(A, `
      app.persist({ saveFailed: true, saveError: 'จำลองเน็ตหลุด', recorder: 'ภญ. ทดสอบ' });
      return 'ok';`);
    await wait(1200);

    const before = await grab(A, `return { rows: app.state.rows.length, failed: !!app.state.saveFailed };`);
    check(before.rows === 1 && before.failed, 'ตั้งสถานะส่งไม่สำเร็จได้', JSON.stringify(before));

    const keys0 = await A.evaluate(() => ({ ตัวเอง: sessionStorage.getItem('mrv.tab'), คีย์: Object.keys(localStorage).filter((k) => k.indexOf('mrv.session') === 0) }));
    log('   ก่อนปิด: ' + JSON.stringify(keys0));
    log('   ปิดหน้าต่างนี้ทั้งที่ของยังค้าง');
    await A.close({ runBeforeUnload: false });
    await wait(1500);

    log('');
    log('หน้าต่างที่ 2 — เปิดใหม่');
    const B = await open(browser);
    await wait(1500);

    // ⚠️ เครื่องมือทดสอบปิดหน้าต่างโดยไม่ยิงสัญญาณ pagehide ทะเบียนจึงยังคิดว่าหน้าต่างนั้นเปิดอยู่
    //    (เบราว์เซอร์จริงยิงเสมอ) จำลองว่าเวลาผ่านไปเกินเกณฑ์แล้ว เพื่อให้ตรงกับของจริง
    const keys1 = await B.evaluate(() => Object.keys(localStorage).filter((k) => k.indexOf('mrv.') === 0).map((k) => k + ' = ' + (localStorage.getItem(k) || '').slice(0, 60)));
    log('   ของในเครื่องทั้งหมด:');
    keys1.forEach((k) => log('     ' + k));
    const reg1 = await B.evaluate(() => localStorage.getItem('mrv.tabs'));
    log('   ทะเบียนหลังปิดหน้าต่างที่ 1: ' + reg1);
    const stale = await B.evaluate(() => {
      try {
        const reg = JSON.parse(localStorage.getItem('mrv.tabs') || '{}');
        const mine = sessionStorage.getItem('mrv.tab');
        let n = 0;
        for (const k of Object.keys(reg)) if (k !== mine) { reg[k] = 0; n++; }
        localStorage.setItem('mrv.tabs', JSON.stringify(reg));
        return n;
      } catch (e) { return -1; }
    });
    if (stale > 0) {
      log('   ทำให้หน้าต่างที่ปิดไปแล้วหมดอายุในทะเบียน (' + stale + ' รายการ) แล้วเปิดหน้าใหม่อีกที');
      await B.reload({ waitUntil: 'domcontentloaded' });
      await wait(3000);
    }

    const got = await grab(B, `return {
      rows: app.state.rows.map(function (r) { return r.name; }),
      failed: !!app.state.saveFailed,
      by: app.state.failedBy || '',
      inBox: app.state.recorder || '',
      parked: (app.state.parked || []).length
    };`);

    check(got.rows.length === 1 && got.rows[0].indexOf('Amox') === 0,
      'ยากลับมาเองโดยไม่ต้องกด', got.rows.join(' · ') || 'ว่าง');
    check(got.failed, 'ยังรู้ตัวว่าเป็นของที่ส่งไม่สำเร็จ');
    check(got.by.indexOf('ทดสอบ') >= 0, 'จำผู้เซ็นล็อตนั้นไว้', got.by || 'ว่าง');
    check(got.inBox === '', 'ช่องผู้บันทึกยังว่าง ไม่ถูกเติมให้เอง (กฎข้อ 3.24)', got.inBox || 'ว่าง');
    check(got.parked === 0, 'ไม่ขึ้นแถบซ้ำ เพราะย้ายมาเป็นของหน้าต่างนี้แล้ว', got.parked + ' รายการค้าง');

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
