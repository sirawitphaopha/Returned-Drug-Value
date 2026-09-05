// ตรวจว่าไม่มีช่องกรอกไหนบนมือถือที่ทำให้ iPhone ซูมเข้าเอง
// (พี่กันเจอเอง 1 ก.ย. 2569 — หน้าค้างในสภาพซูมแล้วลากไปมาได้ทั้งหน้า)
//
// 🚨 Safari บน iPhone ซูมเข้าเองทันทีที่แตะช่องกรอกที่ตัวอักษรเล็กกว่า 16px
//    แล้วไม่ซูมกลับให้ · Chrome บนคอมไม่ทำแบบนี้ เครื่องมือตรวจทั่วไปจึงจับไม่ได้เลย
//    ต้องวัดขนาดตัวอักษรของทุกช่องตรง ๆ แทน
//
//   node scripts/ios-zoom-check.mjs
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
  else { fail++; console.log('  🔴ตก  ' + name + (note ? LFPAD + note : '')); }
};
const LFPAD = '\n          ';

const setState = (page, patch) => page.evaluate((p) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
  if (!app) return false;
  app.setState(p);
  return true;
}, patch);

const scanFields = (page) => page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('input, select, textarea')) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;              // ซ่อนอยู่ ไม่มีใครแตะได้
    if (e.type === 'hidden' || e.disabled || e.readOnly) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    out.push({
      px: px,
      what: (e.placeholder || e.getAttribute('aria-label') || e.type || e.tagName).slice(0, 28)
    });
  }
  return out;
});

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
    console.log('วัดขนาดตัวอักษรของทุกช่องกรอก (เกณฑ์ iPhone = 16px ขึ้นไป)');
    console.log('');

    const stops = [
      ['หน้าบันทึก', { screen: 'record' }],
      ['หน้าบันทึก · เปิดตัวเลือกเพิ่มเติม', { screen: 'record', showMore: true }],
      ['หน้าประวัติ', { screen: 'history' }],
      ['หน้าสรุป', { screen: 'summary' }],
      ['หน้าตั้งค่า', { screen: 'record', settingsOpen: true }],
      ['หน้าจัดการราคา', { screen: 'prices', settingsOpen: false }],
      ['หน้าคลังยา', { screen: 'catalog' }],
      ['หน้ารายการ Lot', { screen: 'lots' }]
    ];

    for (const [label, patch] of stops) {
      await setState(page, patch);
      await wait(900);
      const fields = await scanFields(page);
      const small = fields.filter((f) => f.px < 16);
      ok(small.length === 0, label + ' (' + fields.length + ' ช่อง)',
        small.map((f) => '"' + f.what + '" = ' + f.px + 'px').join(LFPAD));
    }

    // ป๊อปใส่จำนวนฝั่งมือถือ — ช่องตัวใหญ่ตั้งใจ ต้องไม่ถูกกฎย่อลง
    await setState(page, { screen: 'record', settingsOpen: false,
      sheet: { drug: { id: null, name: 'Metformin 500 mg', unit: 'เม็ด', price: 1 }, kind: 'add', id: null },
      sheetQty: '10' });
    await wait(900);
    const sheetFields = await scanFields(page);
    const big = sheetFields.find((f) => f.px >= 30);
    const smallInSheet = sheetFields.filter((f) => f.px < 16);
    ok(smallInSheet.length === 0, 'ป๊อปใส่จำนวน (' + sheetFields.length + ' ช่อง)',
      smallInSheet.map((f) => '"' + f.what + '" = ' + f.px + 'px').join(LFPAD));
    ok(!!big, 'ช่องจำนวนตัวใหญ่ยังใหญ่เหมือนเดิม', big ? big.px + 'px' : 'ถูกย่อลงเหลือ 16px แล้ว');

    // เดสก์ท็อปต้องไม่โดนกฎนี้
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
    await wait(3500);
    const deskFields = await page2.evaluate(() => [...document.querySelectorAll('input')]
      .filter((e) => e.getBoundingClientRect().width > 0)
      .map((e) => parseFloat(getComputedStyle(e).fontSize)));
    ok(deskFields.some((x) => x < 16), 'ฝั่งคอมยังใช้ขนาดเดิม ไม่โดนกฎมือถือ',
      'ขนาดที่เจอ: ' + deskFields.join(', '));

    console.log('');
    console.log(fail === 0 ? '✅ ผ่านครบ ' + pass + ' ข้อ — iPhone จะไม่ซูมเองอีก'
      : '🔴 ตก ' + fail + ' ข้อ จาก ' + (pass + fail));
  } finally { await browser.close(); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
