// พิสูจน์ด้วยการ "ลากจริง" ว่าหน้าไม่ไถลซ้ายขวาแล้ว
// (พี่กันบ่นเรื่องเดียวกัน 4 รอบ — "เราตั้งใจทำให้มันเลื่อน เห็นมั้ยว่ามันมีขอบว่าง")
//
// 🚨 การวัดความกว้างอย่างเดียวไม่พอ ต้องลากนิ้วจริงแล้ววัดว่าของบนจอขยับไหม
//    เพราะสิ่งที่พี่กันเห็นคือ "ลากแล้วมันไถล" ไม่ใช่ตัวเลขความกว้าง
//
//   node scripts/drag-proof.mjs [กว้าง]
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

let pass = 0, fail = 0;
const ok = (yes, name, note) => {
  if (yes) { pass++; console.log('  ผ่าน  ' + name + (note ? '  — ' + note : '')); }
  else { fail++; console.log('  🔴ตก  ' + name + (note ? '  — ' + note : '')); }
};

// จุดอ้างอิงที่ต้องไม่ขยับ — ของจริงที่พี่กันมองเห็นบนจอ
const marks = (page) => page.evaluate(() => {
  const pick = (re) => [...document.querySelectorAll('div,span,input')]
    .find((e) => re.test((e.innerText || e.placeholder || '').trim()));
  const box = (e) => e ? Math.round(e.getBoundingClientRect().left) : null;
  return {
    title: box(pick(/^มูลค่ายาคืน/)),
    search: box(document.querySelector('input[placeholder*="ค้นชื่อยา"]')),
    chip: box(pick(/^OPD$/)),
    saveBtn: box(pick(/^(เลือกยาก่อน|บันทึก \d)/)),
    tab: box(pick(/^บันทึก$/))
  };
});

const drag = async (page, from, to, y) => {
  const t = page.touchscreen;
  await t.touchStart(from, y);
  for (let i = 1; i <= 8; i++) await t.touchMove(from + ((to - from) * i / 8), y);
  await wait(120);
  const mid = await marks(page);
  await t.touchEnd();
  await wait(400);
  return mid;
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
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

    // ยัดล็อตค้างแบบที่พี่กันมีจริง (จากเครื่องอื่น ชื่อยาว) — สถานะที่เคยล้น
    await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
      if (app) app.setState({ serverDrafts: [{
        device_id: 'มือถือของ ภญ. วลัยพรรณ ซิวประโคน', tab_id: 't1', mine: false,
        items: 3, days_left: 5, return_date: '2026-09-01', save_failed: false,
        rows: [{ rid: 'r1', name: 'Metformin 500 mg', unit: 'เม็ด', price: 1, qty: 30, disposition: 'reuse' }]
      }] });
    });
    await wait(900);

    console.log('');
    console.log('จอ ' + W + 'px · มีล็อตค้างจากเครื่องอื่น 1 ล็อต (สถานะเดียวกับที่พี่กันเจอ)');
    console.log('');

    const before = await marks(page);
    console.log('  ตำแหน่งก่อนลาก  ' + JSON.stringify(before));

    // ลากไปทางซ้าย (นิ้วปัดจากขวาไปซ้าย = หน้าควรไถลไปซ้ายถ้ามันเลื่อนได้)
    const midL = await drag(page, W - 30, 30, 560);
    console.log('  ระหว่างลากซ้าย ' + JSON.stringify(midL));

    // ลากไปทางขวา
    const midR = await drag(page, 30, W - 30, 560);
    console.log('  ระหว่างลากขวา  ' + JSON.stringify(midR));

    const after = await marks(page);
    console.log('  ตำแหน่งหลังลาก  ' + JSON.stringify(after));
    console.log('');

    const keys = ['title', 'search', 'chip', 'saveBtn', 'tab'];
    const nameTh = { title: 'ชื่อเว็บ', search: 'ช่องค้นยา', chip: 'ชิป OPD', saveBtn: 'ปุ่มบันทึก', tab: 'แท็บบันทึก' };
    for (const k of keys) {
      const moved = Math.max(
        Math.abs((midL[k] ?? 0) - (before[k] ?? 0)),
        Math.abs((midR[k] ?? 0) - (before[k] ?? 0)),
      );   // 🚨 ไม่เอา after มาตัดสิน — ปล่อยนิ้วแล้วอาจถูกนับเป็นการแตะจนหน้าเปลี่ยน
      ok(before[k] !== null && moved <= 1, nameTh[k] + ' ไม่ขยับตอนลาก',
        before[k] === null ? 'หาไม่เจอบนจอ' : 'ขยับมากสุด ' + moved + 'px');
    }

    const scroll = await page.evaluate(() => {
      const m = document.querySelector('[role="main"]');
      return { mainLeft: m ? m.scrollLeft : -1, docLeft: document.documentElement.scrollLeft,
        winX: window.scrollX, mainSW: m ? m.scrollWidth : 0, mainCW: m ? m.clientWidth : 0 };
    });
    ok(scroll.mainLeft === 0 && scroll.docLeft === 0 && scroll.winX === 0,
      'ไม่มีตำแหน่งเลื่อนแนวนอนค้างอยู่', JSON.stringify(scroll));

    fs.mkdirSync('out', { recursive: true });
    await page.screenshot({ path: 'out/m-drag-after.png' });
    console.log('');
    console.log(fail === 0 ? '✅ ผ่านครบ ' + pass + ' ข้อ — ลากยังไงหน้าก็ไม่ไถล'
      : '🔴 ตก ' + fail + ' ข้อ จาก ' + (pass + fail));
  } finally { await browser.close(); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
