// วัดแถบบันทึกฝั่งมือถือว่ากินที่เท่าไหร่ + ถ่ายภาพให้ดูจริง
// พี่กันสั่ง 1 ก.ย. 2569 "ไปบีบจุดนี้หน่อย เพราะตอนใช้ในมือถือ มันกินเนื้อที่มาก"
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
    await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

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
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('มือถือของ ภก. ทดสอบ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4000);

    // ใส่ยาเข้ารายการ + เลือกผู้บันทึก
    await grab(page, `
      const d = app.state.drugs[0], e = app.state.drugs[3];
      if (!d) return 'ไม่มียา';
      app.persist({ rows: [
        { rid: 'b1', drugId: d.id, name: d.name, unit: d.unit, price: d.price || 1, qty: 30, disposition: 'reuse', source: 'opd' },
        { rid: 'b2', drugId: e.id, name: e.name, unit: e.unit, price: e.price || 1, qty: 10, disposition: 'destroy', source: 'opd' }
      ] });
      app.setState({ recorder: (app.state.staff || [])[0] || '' });
      return 'ok';`);
    await wait(1800);

    const m = await page.evaluate(() => {
      const R = (e) => e ? Math.round(e.getBoundingClientRect().height) : 0;
      const bar = [...document.querySelectorAll('div')]
        .find((e) => (e.innerText || '').indexOf('สะสมปีงบ') === 0 && R(e) > 80 && R(e) < 400);
      const btn = [...document.querySelectorAll('[role="button"]')]
        .find((e) => (e.innerText || '').indexOf('รายการ') > 0 || (e.innerText || '').indexOf('ลองส่งใหม่') >= 0);
      const b = btn ? btn.getBoundingClientRect() : null;
      return {
        จอสูง: window.innerHeight,
        แถบบันทึกสูง: R(bar),
        ปุ่มสูง: b ? Math.round(b.height) : 0,
        ปุ่มอยู่ในจอไหม: b ? (b.top >= 0 && b.bottom <= window.innerHeight) : false,
        ข้อความปุ่ม: btn ? btn.innerText.replace(/\s+/g, ' ').trim() : '(ไม่เจอ)'
      };
    });

    log('');
    log('จอมือถือสูง ' + m.จอสูง + 'px');
    log('แถบบันทึกกินที่ ' + m.แถบบันทึกสูง + 'px (' + Math.round(m.แถบบันทึกสูง * 100 / m.จอสูง) + '% ของจอ)');
    log('ปุ่มบันทึกสูง ' + m.ปุ่มสูง + 'px · ' + (m.ปุ่มอยู่ในจอไหม ? 'อยู่ในจอ กดได้' : '🔴 ตกขอบจอ') + ' · "' + m.ข้อความปุ่ม + '"');
    log((m.ปุ่มสูง >= 44 ? '  ผ่าน  ' : '  ตก    ') + 'ปุ่มถึงเกณฑ์นิ้ว 44px');

    await page.screenshot({ path: 'out/มือถือ-แถบบันทึก.png' });
    log('');
    log('ถ่ายภาพลง out/มือถือ-แถบบันทึก.png แล้ว');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
