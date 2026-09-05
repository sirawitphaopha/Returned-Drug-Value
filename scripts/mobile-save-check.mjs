// หาสาเหตุ "กดส่งในมือถือไม่ได้" (พี่กันเจอ 31 ส.ค. 2569)
//
// 🚨 ดักทุกคำขอที่ไม่ใช่ GET ไม่ให้แตะข้อมูลจริง
//    แต่ยังอ่านผลได้ว่าถ้าปล่อยจริงมันจะยิงไหม
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

(async () => {
  if (!fs.existsSync('out')) fs.mkdirSync('out');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=430,900']
  });

  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    page.setDefaultNavigationTimeout(60000);
    // จอมือถือจริง
    await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    const sent = [];
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        sent.push(m + ' ' + u.replace(BASE, ''));
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
    await wait(3500);

    // ── ① เปิดเว็บบนมือถือครั้งแรก เจออะไร ────────────────────────────
    log('');
    log('① เปิดเว็บบนมือถือครั้งแรก (ยังไม่เคยตั้งชื่อเครื่อง)');
    let t = await txt(page);
    const askDevice = t.indexOf('เครื่องนี้คือเครื่องไหน') >= 0;
    log('   หน้าต่างถามชื่อเครื่อง: ' + (askDevice ? 'เด้งขึ้นมา' : 'ไม่เด้ง'));

    if (askDevice) {
      // กดเลือก "มือถือ หรือแท็บเล็ต" แล้วดูว่ามีชื่อให้เลือกไหม
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('[aria-label]')]
          .find((e) => e.getAttribute('aria-label') === 'เลือก มือถือ หรือแท็บเล็ต');
        if (el) el.click();
      });
      await wait(800);
      const opts = await page.evaluate(() =>
        [...document.querySelectorAll('select option')].map((o) => o.textContent));
      log('   ตัวเลือกมือถือ: ' + (opts.length ? opts.length + ' ตัว · ' + opts.slice(0, 3).join(' / ') : '🔴 ไม่มีเลย'));

      const t2 = await txt(page);
      log('   มีปุ่มข้ามไหม: ' + (t2.indexOf('ข้าม') >= 0 ? 'มี' : '🔴 ไม่มี'));

      if (opts.filter((o) => o.indexOf('มือถือของ') === 0).length === 0) {
        log('');
        log('   🔴🔴 เจอต้นเหตุแล้ว — ไม่มีชื่อให้เลือก และไม่มีปุ่มข้าม');
        log('        = ติดค้างหน้านี้ ใช้เว็บบนมือถือไม่ได้เลย');
      }
      await page.screenshot({ path: 'out/มือถือ-ถามชื่อเครื่อง.png' });
    }

    // ── ② ตั้งชื่อเครื่องให้ผ่านไปก่อน แล้วลองกดส่ง ───────────────────
    log('');
    log('② ข้ามด่านชื่อเครื่อง แล้วลองกรอกยาและกดส่ง');
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('มือถือของ ภก. ทดสอบ')); } catch (e) {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(4000);

    const st = await grab(page, `
      return { drugs: app.state.drugs.length, staff: (app.state.staff || []).length,
               pcuSites: (app.state.pcuSites || []).length, device: app.state.deviceId || '' };`);
    log('   ยาในเครื่อง ' + st.drugs + ' ตัว · รายชื่อเจ้าหน้าที่ ' + st.staff + ' คน · รพ.สต. ' + st.pcuSites + ' แห่ง');

    // ใส่ยาเข้ารายการตรง ๆ
    await grab(page, `
      const d = app.state.drugs[0];
      if (!d) return 'ไม่มียา';
      app.persist({ rows: [{ rid: 'm1', drugId: d.id, name: d.name, unit: d.unit,
        price: d.price || 1, qty: 10, disposition: 'reuse', source: 'opd' }] });
      return 'ใส่ยาแล้ว';`);
    await wait(1200);

    // กดปุ่มบันทึกจริง ๆ ด้วยการแตะ
    const btn = await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')]
        .filter((e) => (e.innerText || '').indexOf('บันทึก') >= 0)
        .map((e) => { const r = e.getBoundingClientRect();
          return { txt: e.innerText.replace(/\s+/g, ' ').trim().slice(0, 24),
            top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; });
      return { list: b, จอสูง: window.innerHeight };
    });
    log('   ปุ่มบันทึกที่เจอ: ' + JSON.stringify(btn.list));

    sent.length = 0;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')]
        .find((e) => ((e.innerText || '').indexOf('รายการ') > 0 || (e.innerText || '').indexOf('ลองส่งใหม่') >= 0));
      if (b) b.click();
    });
    await wait(1500);
    t = await txt(page);
    log('   กดแล้วเกิดอะไร: ' + (t.indexOf('ยืนยันการบันทึก') >= 0 ? 'ป๊อปยืนยันขึ้น'
      : t.indexOf('เลือกชื่อผู้บันทึก') >= 0 ? '🔴 ติดที่ยังไม่เลือกผู้บันทึก'
      : t.indexOf('เลือก รพ.สต.') >= 0 ? '🔴 ติดที่ยังไม่เลือก รพ.สต.'
      : t.indexOf('โหมดดูตัวอย่าง') >= 0 ? '🔴 ติดที่โหมดดูตัวอย่าง'
      : '🔴 ไม่มีอะไรเกิดขึ้นเลย'));

    await page.screenshot({ path: 'out/มือถือ-กดบันทึก.png' });

    // ── ③ เลือกผู้บันทึกแล้วลองใหม่ ─────────────────────────────────
    log('');
    log('③ เลือกผู้บันทึกแล้วกดส่งอีกครั้ง');
    const okStaff = await grab(page, `
      const s = (app.state.staff || [])[0];
      if (!s) return 'ไม่มีรายชื่อเจ้าหน้าที่ในระบบ';
      app.setState({ recorder: s });
      return s;`);
    log('   ผู้บันทึก: ' + okStaff);
    await wait(900);

    sent.length = 0;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')]
        .find((e) => ((e.innerText || '').indexOf('รายการ') > 0 || (e.innerText || '').indexOf('ลองส่งใหม่') >= 0));
      if (b) b.click();
    });
    await wait(1500);
    t = await txt(page);
    log('   กดแล้วเกิดอะไร: ' + (t.indexOf('ยืนยันการบันทึก') >= 0 ? '✅ ป๊อปยืนยันขึ้นแล้ว'
      : t.indexOf('เลือก รพ.สต.') >= 0 ? '🔴 ติดที่ รพ.สต.'
      : '🔴 ยังไม่มีอะไรเกิดขึ้น'));

    // กดยืนยันในป๊อป
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')]
        .find((e) => (e.innerText || '').trim() === 'บันทึกเลย' || (e.innerText || '').trim().indexOf('ยืนยัน') === 0);
      if (b) b.click();
    });
    await wait(2000);
    log('   คำขอที่ยิงออกไป: ' + (sent.length ? sent.join(' · ') : '🔴 ไม่ยิงอะไรเลย'));
    await page.screenshot({ path: 'out/มือถือ-หลังยืนยัน.png' });

    log('');
    log('ถ่ายภาพไว้ใน out/ แล้ว 3 ภาพ');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
