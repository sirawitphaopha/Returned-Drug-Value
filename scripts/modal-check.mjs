// ตรวจระบบหน้าต่างซ้อน — ชั้นการวาง + ฉากหลังห้ามเลื่อน
// (พี่กันเจอเอง 1 ก.ย. 2569 "popup ลบมันดันอยู่ด้านหลัง popup ก่อนหน้า" + "ฉากหลังห้ามเลื่อน")
//
// 🚨 ต้องตรวจทั้งฝั่งมือถือและฝั่งคอม — พี่กันสั่ง "ไปดูระบบ popup ซ้อน popup ดีๆ ทั้งมือถือ เเละเดส"
//
//   node scripts/modal-check.mjs
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
  if (yes) { pass++; console.log('  ผ่าน  ' + name + (note ? '  — ' + note : '')); }
  else { fail++; console.log('  🔴ตก  ' + name + (note ? '  — ' + note : '')); }
};

const setState = (page, patch) => page.evaluate((p) => {
  const el = document.querySelector('[role="button"]');
  const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
  let f = key ? el[key] : null, app = null;
  while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
  if (!app) return false;
  app.setState(p);
  return true;
}, patch);

const readState = (page, key) => page.evaluate((k) => {
  const el = document.querySelector('[role="button"]');
  const kk = el && Object.keys(el).find((x) => x.indexOf('__reactFiber') === 0);
  let f = kk ? el[kk] : null, app = null;
  while (f) { if (f.stateNode && typeof f.stateNode.persist === 'function') { app = f.stateNode; break; } f = f.return; }
  return app ? app.state[k] : null;
}, key);

// ชั้นสูงสุดของหน้าต่างที่มองเห็นอยู่ตอนนี้
const topLayer = (page) => page.evaluate(() => {
  let best = { z: -1, txt: '' };
  for (const e of document.querySelectorAll('[role="dialog"], [style*="position:fixed"], [style*="position: fixed"]')) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) continue;
    const z = parseInt(cs.zIndex, 10);
    if (!isNaN(z) && z > best.z) best = { z: z, txt: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 28) };
  }
  return best;
});

const run = async (browser, W, label) => {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: W < 900 ? 844 : 950, deviceScaleFactor: 2,
    isMobile: W < 900, hasTouch: W < 900 });
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
  console.log('══ ' + label + ' (จอ ' + W + 'px) ══');

  // ── ฉากหลังห้ามเลื่อนเมื่อมีหน้าต่างซ้อน ──
  // 🚨 ไม่มี "ตั้งค่า" ในรายการนี้โดยตั้งใจ — พี่กันสั่งให้เปลี่ยนเป็นหน้าเต็มจอมีปุ่มกลับ
  //    (1 ก.ย. 2569) จึงไม่ใช่หน้าต่างซ้อนอีกแล้ว ฉากหลังไม่ต้องล็อก
  const modals = [
    ['ป๊อปใส่จำนวน', { sheet: { drug: { id: null, name: 'Metformin 500 mg', unit: 'เม็ด', price: 1 }, kind: 'add', id: null }, sheetQty: '10' }],
    ['ถามชื่อเครื่อง', { deviceAsk: true }],
    ['เลือกเหตุผลทำลาย', { reasonAsk: { label: 'Metformin', next: null } }],
    ['ยืนยัน', { confirm: { title: 'ทดสอบ', note: 'ทดสอบ', run: function () {} } }]
  ];
  for (const [name, patch] of modals) {
    await setState(page, patch);
    await wait(500);
    const r = await page.evaluate(() => {
      const m = document.querySelector('[role="main"]');
      return { ov: m ? getComputedStyle(m).overflowY : '-', flag: null };
    });
    const flag = await readState(page, 'anyModalOpen');
    ok(r.ov === 'hidden' && flag === true, 'เปิด "' + name + '" แล้วฉากหลังหยุดเลื่อน',
      'overflow-y=' + r.ov + ' · ธง=' + flag);
    // ปิดกลับ
    await setState(page, { settingsOpen: false, sheet: null, deviceAsk: false, reasonAsk: null, confirm: null });
    await wait(400);
  }

  const back = await page.evaluate(() => {
    const m = document.querySelector('[role="main"]');
    return m ? getComputedStyle(m).overflowY : '-';
  });
  ok(back === 'auto', 'ปิดหน้าต่างแล้วฉากหลังกลับมาเลื่อนได้', 'overflow-y=' + back);

  // ── ป๊อปยืนยันต้องอยู่บนสุดเสมอ ──
  console.log('');
  const stack = [
    ['รายการล็อต', { lots: [{ lot: 'L690901-01', date: '2026-09-01', by: 'ทดสอบ', items: 2, qty: 5, saved: 10, lost: 0, source: 'opd', pcu_site: null }], slipLot: null, screen: 'lots' }],
    ['ล็อตค้าง', { showOtherDrafts: true }],
    ['หน้าผลบันทึก', { result: { kind: 'ok', lot: 'L690901-01', rows: 2, saved: 10, lost: 0 } }],
  ];
  for (const [name, patch] of stack) {
    await setState(page, patch);
    await wait(600);
    const under = await topLayer(page);
    await setState(page, { confirm: { title: 'ยืนยันลบ', note: 'ทดสอบ', run: function () {} } });
    await wait(500);
    const top = await topLayer(page);
    const cz = await page.evaluate(() => {
      const d = [...document.querySelectorAll('[role="dialog"]')]
        .find((e) => /ยืนยันลบ/.test(e.innerText || ''));
      return d ? parseInt(getComputedStyle(d).zIndex, 10) : -1;
    });
    ok(cz > under.z, 'เปิด "' + name + '" แล้วกดลบ — ป๊อปยืนยันอยู่บนสุด',
      'ยืนยัน z=' + cz + ' · ตัวที่อยู่ข้างใต้ z=' + under.z);
    await setState(page, { confirm: null, hisOpen: false, showOtherDrafts: false, result: null, screen: 'record' });
    await wait(400);
  }

  await page.close();
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    await run(browser, 390, 'ฝั่งมือถือ');
    await run(browser, 1600, 'ฝั่งคอม');
    console.log('');
    console.log(fail === 0 ? '✅ ผ่านครบ ' + pass + ' ข้อ' : '🔴 ตก ' + fail + ' ข้อ จาก ' + (pass + fail));
  } finally { await browser.close(); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
