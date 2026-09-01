// ตรวจแถบล็อตที่กรอกค้างไว้ ทุกสถานะ ว่าไม่ล้นออกนอกจอ
// (พี่กันเจอเอง 1 ก.ย. 2569 "มันยังเลื่อนไปมาได้อยู่เลยยยยยยย")
//
// 🚨 บั๊กรอบนี้เกิดเฉพาะตอนมี "ล็อตเดียว" ซึ่งเป็นคนละเส้นทางกับหลายล็อต
//    สคริปต์เดิมเทสแค่ตอน 2 ล็อต จึงผ่านหมดทั้งที่ของจริงพัง
//    ทุกสถานะที่วาดต่างกัน ต้องเทสแยกกันเสมอ
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

let pass = 0, fail = 0;
const ok = (yes, name, note) => {
  if (yes) { pass++; console.log('  ผ่าน  ' + name); }
  else { fail++; console.log('  🔴ตก  ' + name + (note ? '  — ' + note : '')); }
};

// ยัดร่างค้างปลอมเข้า state (ไม่แตะเซิร์ฟเวอร์เลย)
const setDrafts = (page, n, mine) => page.evaluate((cnt, isMine) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
  if (!app) return false;
  const list = [];
  for (let i = 0; i < cnt; i++) {
    list.push({
      device_id: 'มือถือของ ภญ. วลัยพรรณ ซิวประโคน',
      tab_id: 'tab-' + i,
      mine: !!isMine,
      items: 3,
      days_left: 5,
      return_date: '2026-09-01',
      save_failed: false,
      rows: [{ rid: 'r' + i, name: 'Metformin 500 mg', unit: 'เม็ด', price: 1, qty: 30, disposition: 'reuse' }]
    });
  }
  app.setState({ serverDrafts: list, parked: [] });
  return true;
}, n, mine);

const measure = (page, w) => page.evaluate((vw) => {
  const bar = [...document.querySelectorAll('[role="status"]')]
    .find((e) => /ล็อตที่กรอกค้างไว้|มือถือของ|เก็บไว้บนเซิร์ฟเวอร์|จากหน้าต่างที่ปิด/.test(e.innerText || ''));
  if (!bar) return null;
  const r = bar.getBoundingClientRect();
  const kids = [...bar.children].map((e) => {
    const k = e.getBoundingClientRect();
    return { t: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 18), l: Math.round(k.left), r: Math.round(k.right) };
  });
  return {
    barW: Math.round(r.width), barR: Math.round(r.right), inner: bar.scrollWidth,
    docW: document.documentElement.scrollWidth, viewW: vw,
    over: kids.filter((k) => k.r > vw + 1), kids: kids
  };
}, w);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    for (const W of [390, 440]) {
      const page = await browser.newPage();
      await page.setViewport({ width: W, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        const u = r.url(), m = r.method();
        if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
          r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
        }
        r.continue();
      });
      await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
      await wait(1200);
      if (page.url().indexOf('/login') >= 0) {
        await page.type('#mrv-pw', pw);
        await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
          page.click('button[type="submit"]')]);
      }
      await page.evaluate(() => {
        try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
      });
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await wait(4000);

      console.log('');
      console.log('══ จอ ' + W + 'px ══');

      for (const [n, mine, label] of [[1, false, 'ล็อตเดียว จากเครื่องอื่น'],
        [1, true, 'ล็อตเดียว ของเครื่องนี้'],
        [2, false, 'สองล็อต'],
        [7, false, 'เจ็ดล็อต']]) {
        await setDrafts(page, n, mine);
        await wait(700);
        const m = await measure(page, W);
        if (!m) { ok(false, label, 'ไม่เจอแถบ'); continue; }
        const good = m.over.length === 0 && m.docW <= W && m.inner <= W + 1;
        ok(good, label,
          'แถบกว้าง ' + m.barW + ' เนื้อใน ' + m.inner + ' เอกสาร ' + m.docW +
          (m.over.length ? ' · ล้น: ' + m.over.map((x) => '"' + x.t + '" ถึง ' + x.r).join(', ') : ''));
      }

      await setDrafts(page, 1, false);
      await wait(600);
      fs.mkdirSync('out', { recursive: true });
      const bar = await page.$('[role="status"]');
      if (bar) await bar.screenshot({ path: 'out/m-parked-' + W + '.png' });
      await page.close();
    }
    console.log('');
    console.log(fail === 0 ? '✅ ผ่านครบ ' + pass + ' ข้อ · ภาพ out/m-parked-390.png · out/m-parked-440.png'
      : '🔴 ตก ' + fail + ' ข้อ จาก ' + (pass + fail));
  } finally { await browser.close(); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
