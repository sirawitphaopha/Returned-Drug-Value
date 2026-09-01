// หาว่าอะไรล้นออกนอกจอจนหน้าเว็บเลื่อนซ้ายขวาได้ (พี่กันแจ้ง 1 ก.ย. 2569)
//   "เราไม่อยากให้มันเลื่อนไปมาแบบนี้"
//
// 🚨 หน้าเว็บที่เลื่อนแนวนอนได้บนมือถือคือบั๊กเสมอ — ปัดนิ้วเลื่อนดูรายการยา
//    แล้วหน้าไหลไปข้างพร้อมกัน ตัวหนังสือฝั่งขวาหายไปนอกจอโดยไม่มีอะไรบอก
//
//   node scripts/overflow-check.mjs [กว้าง] [สูง]
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
const W = Number(process.argv[2] || 390);
const H = Number(process.argv[3] || 844);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
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
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3500);

    const scan = async (label) => {
      const out = await page.evaluate((w) => {
        const res = { docW: document.documentElement.scrollWidth, viewW: window.innerWidth, bad: [], scrollers: [] };
        const desc = (e) => {
          const t = (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 26);
          const cls = (e.className && typeof e.className === 'string') ? '.' + e.className.split(' ').filter(Boolean).slice(0, 2).join('.') : '';
          return e.tagName.toLowerCase() + cls + (t ? ' "' + t + '"' : '');
        };
        for (const e of document.querySelectorAll('*')) {
          const r = e.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          // ล้นขอบขวา หรือ ยื่นเลยขอบซ้าย
          if (r.right > w + 1 || r.left < -1) {
            // เอาเฉพาะตัวที่พ่อไม่ได้ล้นด้วย = ต้นตอจริง ไม่ใช่ลูกที่ล้นตามพ่อ
            const p = e.parentElement ? e.parentElement.getBoundingClientRect() : null;
            const parentBad = p && (p.right > w + 1 || p.left < -1);
            if (!parentBad) res.bad.push({ el: desc(e), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) });
          }
          // กล่องที่เลื่อนแนวนอนได้เอง
          if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) {
            const ov = getComputedStyle(e).overflowX;
            if (ov === 'auto' || ov === 'scroll' || ov === 'visible') {
              res.scrollers.push({ el: desc(e), inner: e.scrollWidth, box: e.clientWidth, ov: ov });
            }
          }
        }
        return res;
      }, W);

      console.log('');
      console.log('── ' + label + ' ──');
      console.log('  ความกว้างเอกสาร ' + out.docW + ' · จอ ' + out.viewW +
        (out.docW > out.viewW ? '   🔴 เลื่อนซ้ายขวาได้ ' + (out.docW - out.viewW) + 'px' : '   ผ่าน ไม่เลื่อน'));
      if (out.bad.length) {
        console.log('  ของที่ยื่นออกนอกจอ');
        for (const b of out.bad.slice(0, 8)) console.log('    ' + b.el + '  ซ้าย ' + b.l + ' ขวา ' + b.r + ' (กว้าง ' + b.w + ')');
      }
      if (out.scrollers.length) {
        console.log('  กล่องที่เนื้อในกว้างเกินตัวเอง');
        for (const c of out.scrollers.slice(0, 8)) console.log('    ' + c.el + '  ข้างใน ' + c.inner + ' > กล่อง ' + c.box + '  (overflow-x: ' + c.ov + ')');
      }
      return out.docW > out.viewW;
    };

    let bad = await scan('หน้าบันทึก · ยังไม่มีรายการ');

    // ใส่ยาตัวอย่างเข้าไปให้เหมือนในวิดีโอของพี่กัน (2 รายการ)
    await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
      if (!app) return;
      const mk = (qty) => ({
        rid: 'test-' + qty, drugId: 1, name: 'Metformin 500 mg', unit: 'เม็ด',
        price: 1, qty: qty, disposition: 'reuse', source: 'opd', hn: ''
      });
      app.setState({ rows: [mk(2), mk(32)] });
    });
    await wait(700);
    bad = (await scan('หน้าบันทึก · มี 2 รายการ')) || bad;

    // เปิดตัวเลือกเพิ่มเติม (วันที่ · HN · ผู้บันทึก) เหมือนในวิดีโอ
    await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
      if (app) app.setState({ showMore: true });
    });
    await wait(600);
    bad = (await scan('หน้าบันทึก · เปิดตัวเลือกเพิ่มเติม')) || bad;

    fs.mkdirSync('out', { recursive: true });
    await page.screenshot({ path: 'out/m-overflow.png', fullPage: false });
    console.log('');
    console.log('ภาพ: out/m-overflow.png');
    console.log(bad ? '🔴 ยังเลื่อนซ้ายขวาได้' : '✅ ไม่เลื่อนซ้ายขวาแล้ว');
    process.exit(bad ? 1 : 0);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
