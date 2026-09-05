// ═══════════════════════════════════════════════════════════════════════════
// ตรวจโหมดดูตัวอย่างว่ามีข้อมูลครบทุกหน้า (พี่กันสั่ง 31 ส.ค. 2569)
//   "ข้อมูลอะไรพวกนี้ ใส่ในเดโม่ด้วยนะ ไปไล่ดูด้วยว่าเดโม่อันไหนยังใส่ไม่ครบ"
//
// 🚨 สคริปต์นี้ดักทุกคำขอที่ไม่ใช่ GET ไม่ให้แตะข้อมูลจริง
//    และตรวจด้วยว่าตอนอยู่ในโหมดตัวอย่าง เว็บไม่แอบยิงถามของจริง
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
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

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
const clickLabel = (page, label) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === l);
  if (!el) return false; el.click(); return true;
}, label);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 1400, height: 900 });

    // จดว่าเว็บยิงถามอะไรบ้าง เพื่อดูว่าโหมดตัวอย่างแอบถามของจริงไหม
    const seen = [];
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0) {
        seen.push(m + ' ' + u.replace(BASE, ''));
        if (m !== 'GET' && u.indexOf('/api/auth') < 0) {
          r.respond({ status: 503, contentType: 'application/json', body: '{}' });
          return;
        }
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
    await wait(3200);

    // ── ① เปิดโหมดดูตัวอย่าง ────────────────────────────────────────────
    log('');
    log('① เปิดโหมดดูตัวอย่าง');
    await grab(page, 'app.enterDemo(); return 1;');
    await wait(3000);
    const inDemo = await grab(page, 'return app.state.demo === true;');
    check(inDemo, 'เข้าโหมดดูตัวอย่างแล้ว');

    // ── ② ล็อตที่กรอกค้างไว้ ────────────────────────────────────────────
    log('');
    log('② ล็อตที่กรอกค้างไว้ (ของใหม่ที่พี่กันสั่งให้ใส่)');
    const drafts = await grab(page, [
      'const st = app.state;',
      'return { parked: (st.parked || []).length,',
      '  mine: (st.serverDrafts || []).filter(function (d) { return d.mine; }).length,',
      '  other: (st.serverDrafts || []).filter(function (d) { return !d.mine; }).length,',
      '  device: st.deviceId || String() };'
    ].join('\n'));
    check(drafts.parked === 1, 'มีร่างจากหน้าต่างที่ปิดไปแล้ว', drafts.parked + ' ก้อน');
    check(drafts.mine === 1, 'มีร่างของเครื่องนี้บนเซิร์ฟเวอร์', drafts.mine + ' ก้อน');
    check(drafts.other === 2, 'มีร่างจากเครื่องอื่น', drafts.other + ' ก้อน');
    check(drafts.device === 'computer OPD เครื่องที่ 1', 'มีชื่อเครื่องตัวอย่าง', drafts.device);

    // ── ③ แถบต้องรวบเป็นแถบเดียว ────────────────────────────────────────
    log('');
    log('③ แถบสะอาดตา (พี่กันสั่งหลังเห็นแถบเรียง 7 อัน)');
    let t = await txt(page);
    check(t.indexOf('มีล็อตที่กรอกค้างไว้ 4 ล็อต') >= 0, 'รวบเป็นแถบเดียว บอกจำนวนรวม');
    check(t.indexOf('ดูทั้งหมด') >= 0, 'มีปุ่มกางรายการ');

    const bars = await page.evaluate(() => {
      const hit = [...document.querySelectorAll('[role="status"]')]
        .filter((e) => e.innerText.indexOf('กรอกค้างไว้') >= 0);
      return hit.length;
    });
    check(bars === 1, 'มีแถบเดียวจริง ไม่เรียงกันหลายอัน', bars + ' แถบ');

    // ── ④ กางรายการออกมาดู ──────────────────────────────────────────────
    log('');
    log('④ กดดูทั้งหมด');
    await grab(page, 'app.toggleOtherDrafts(); return 1;');
    await wait(900);
    t = await txt(page);
    check(t.indexOf('computer NCD เครื่องที่ 1') >= 0, 'เห็นชื่อเครื่องอื่นในรายการ');
    check(t.indexOf('ล็อตที่ส่งไม่สำเร็จ') >= 0, 'แยกล็อตที่ส่งไม่สำเร็จออกมาให้เห็น');
    check(t.indexOf('จะถูกล้างพรุ่งนี้') >= 0, 'เตือนล็อตที่ใกล้ถูกล้าง');

    const boxH = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div')]
        .find((e) => e.style && e.style.maxHeight === '216px');
      return el ? Math.round(el.getBoundingClientRect().height) : -1;
    });
    check(boxH > 0 && boxH <= 216, 'รายการเลื่อนในกรอบ ไม่ดันหน้าจอ', boxH + 'px');

    // ── ⑤ คลังยาต้องเป็นของปลอม ─────────────────────────────────────────
    log('');
    log('⑤ คลังยากับหน้าราคาในโหมดตัวอย่าง');
    seen.length = 0;
    await grab(page, 'app.openCatalog(); return 1;');
    await wait(2500);
    const cat = await grab(page, 'return (app.state.catalog || []).length;');
    check(cat > 0 && cat < 100, 'คลังยาเป็นชุดตัวอย่าง ไม่ใช่ยาจริง 417 ตัว', cat + ' ตัว');
    check(!seen.some((x) => x.indexOf('/api/catalog') >= 0), 'ไม่ยิงถามคลังยาจริง',
      seen.filter((x) => x.indexOf('catalog') >= 0).join(' · ') || 'ไม่ยิงเลย');

    await grab(page, "app.setState({ screen: 'prices' }); app.loadPrices(); return 1;");
    await wait(2000);
    const pr = await grab(page, 'return (app.state.priceItems || []).length;');
    check(pr > 0 && pr < 100, 'หน้าราคาเป็นชุดตัวอย่าง', pr + ' ตัว');
    check(!seen.some((x) => x.indexOf('/api/prices') >= 0), 'ไม่ยิงถามราคาจริง');

    // ── ⑥ หน้าตั้งค่า — ชื่อเครื่อง ──────────────────────────────────────
    log('');
    log('⑥ หน้าตั้งค่า — แถวชื่อเครื่อง');
    await grab(page, "app.setState({ screen: 'record', settingsOpen: true }); return 1;");
    await wait(1200);
    t = await txt(page);
    check(t.indexOf('เครื่องนี้') >= 0, 'มีหัวข้อเครื่องนี้');
    check(t.indexOf('computer OPD เครื่องที่ 1') >= 0, 'โชว์ชื่อเครื่องที่ตั้งไว้');
    const hasBtn = await page.evaluate(() => !![...document.querySelectorAll('[aria-label]')]
      .find((e) => e.getAttribute('aria-label') === 'เปลี่ยนชื่อเครื่อง'));
    check(hasBtn, 'มีปุ่มเปลี่ยนชื่อเครื่อง');

    await clickLabel(page, 'เปลี่ยนชื่อเครื่อง');
    await wait(1000);
    t = await txt(page);
    check(t.indexOf('เครื่องนี้คือเครื่องไหน') >= 0, 'กดแล้วหน้าต่างถามชื่อเครื่องเปิด');
    const bothOpen = await grab(page, 'return app.state.settingsOpen === true;');
    check(!bothOpen, 'หน้าตั้งค่าปิดให้เอง ไม่ซ้อนสองหน้าต่าง');

    // ── ⑦ ปิดโหมด ของจริงต้องกลับมา ─────────────────────────────────────
    log('');
    log('⑦ ปิดโหมดดูตัวอย่าง');
    await grab(page, 'app.setState({ deviceAsk: false }); app.exitDemo(); return 1;');
    await wait(3500);
    const after = await grab(page, [
      'const st = app.state;',
      'return { demo: st.demo, device: st.deviceId || String(),',
      '  parked: (st.parked || []).length,',
      '  server: (st.serverDrafts || []).length,',
      '  cat: (st.catalog || []).length,',
      '  price: (st.priceItems || []).length };'
    ].join('\n'));
    check(after.demo === false, 'ออกจากโหมดแล้ว');
    check(after.device === 'เครื่องทดสอบอัตโนมัติ', 'ชื่อเครื่องจริงกลับมา', after.device);
    check(after.parked === 0 && after.server === 0, 'ล็อตค้างปลอมหายเกลี้ยง',
      after.parked + ' + ' + after.server);
    check(after.cat === 0 && after.price === 0, 'คลังยากับราคาปลอมหายเกลี้ยง',
      after.cat + ' + ' + after.price);

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
