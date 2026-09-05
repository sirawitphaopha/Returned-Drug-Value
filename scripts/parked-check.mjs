// ตรวจแถบล็อตค้าง + หน้าต่างดูรายละเอียด (พี่กันสั่ง 31 ส.ค. 2569)
//   "มันทับกันหมดแล้ว" · "ต้องกดดูรายละเอียดได้ด้วยสิ"
//
// 🚨 ข้อสำคัญที่สุดคือ "ห้ามมีอะไรทับกัน" จึงวัดพิกัดจริงบนจอ ไม่ใช่ดูว่ามีข้อความ
//    SHOW=1 เปิดหน้าต่างให้เห็นด้วยตา
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

// วัดว่ามีอะไรล้นออกนอกกล่องที่ล็อกความสูงไว้ไหม — นี่คือต้นเหตุที่ทำให้ทับกัน
const overflow = (page) => page.evaluate(() => {
  const out = [];
  // ท้ายเว็บกับแถบยาที่คืนบ่อย ต้องไม่ทับกัน
  const foot = [...document.querySelectorAll('div')]
    .find((e) => e.innerText && e.innerText.indexOf('มูลค่ายาคืน v') === 0 && e.children.length < 12);
  const fav = [...document.querySelectorAll('div')]
    .find((e) => e.innerText && e.innerText.trim().indexOf('ยาที่คืนบ่อย') === 0);
  if (foot && fav) {
    const a = foot.getBoundingClientRect(), b = fav.getBoundingClientRect();
    const hit = !(a.bottom <= b.top || b.bottom <= a.top);
    out.push({ what: 'ท้ายเว็บ ทับ ยาที่คืนบ่อย', hit: hit,
      foot: Math.round(a.top) + '-' + Math.round(a.bottom),
      fav: Math.round(b.top) + '-' + Math.round(b.bottom) });
  }
  // เนื้อหาในคอลัมน์ซ้ายล้นออกนอกกล่องตัวเองไหม
  const col = [...document.querySelectorAll('div')].find((e) =>
    e.style && e.style.flexDirection === 'column' && e.querySelector('input[placeholder*="พิมพ์ชื่อยา"]'));
  if (col) {
    out.push({ what: 'คอลัมน์ซ้ายล้น',
      hit: col.scrollHeight > col.clientHeight + 2,
      foot: col.scrollHeight + ' / ' + col.clientHeight });
  }
  return out;
});

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
    await page.setViewport({ width: 1400, height: 860 });
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
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3200);

    await grab(page, 'app.enterDemo(); return 1;');
    await wait(3000);

    // ── ① แถบตอนหุบ ห้ามทับอะไร ─────────────────────────────────────────
    log('');
    log('① แถบตอนหุบ — ห้ามมีอะไรทับกัน');
    let ov = await overflow(page);
    ov.forEach((o) => check(!o.hit, o.what + ' (ต้องไม่ทับ)', o.foot + (o.fav ? ' vs ' + o.fav : '')));

    const barH = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="status"]')]
        .find((e) => e.innerText.indexOf('กรอกค้างไว้') >= 0);
      return el ? Math.round(el.getBoundingClientRect().height) : -1;
    });
    check(barH > 0 && barH < 100, 'แถบเตี้ย ไม่กินที่', barH + 'px');

    // ── ② เปิดหน้าต่างรายละเอียด ─────────────────────────────────────────
    log('');
    log('② กดดูทั้งหมด — ต้องเป็นหน้าต่างซ้อน ไม่ใช่กางในหน้า');
    await clickLabel(page, 'ดูรายการล็อตที่กรอกค้างไว้');
    await wait(900);
    const dlg = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === 'ปิดหน้าต่าง');
      if (!btn) return null;
      let d = btn;
      while (d && d.getAttribute && d.getAttribute('role') !== 'dialog') d = d.parentElement;
      if (!d) return null;
      return { fixed: getComputedStyle(d).position,
        lots: (d.innerText.match(/เอากลับมา|เอามาทำต่อ/g) || []).length };
    });
    check(!!dlg, 'หน้าต่างซ้อนเปิดแล้ว');
    check(dlg && dlg.fixed === 'fixed', 'ลอยเหนือหน้าเว็บ ไม่กินที่ในผังหน้า', dlg ? dlg.fixed : '-');
    check(dlg && dlg.lots === 4, 'มีล็อตครบทั้ง 4 ในหน้าต่าง', dlg ? dlg.lots + ' ล็อต' : '-');

    // แถบในหน้ายังเตี้ยเท่าเดิม = หน้าไม่ถูกดัน
    const barH2 = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="status"]')]
        .find((e) => e.innerText.indexOf('กรอกค้างไว้') >= 0);
      return el ? Math.round(el.getBoundingClientRect().height) : -1;
    });
    check(barH2 === barH, 'เปิดหน้าต่างแล้วแถบในหน้าไม่สูงขึ้น', barH + ' → ' + barH2);

    ov = await overflow(page);
    ov.forEach((o) => check(!o.hit, o.what + ' ตอนเปิดหน้าต่าง', o.foot + (o.fav ? ' vs ' + o.fav : '')));

    let t = await txt(page);
    check(t.indexOf('ล็อตที่กรอกค้างไว้ 4 ล็อต') >= 0, 'บอกจำนวนล็อตในหัวหน้าต่าง');
    check(t.indexOf('computer NCD เครื่องที่ 1') >= 0, 'เห็นล็อตของเครื่องอื่น');

    // ── ③ กดดูยาในล็อต ──────────────────────────────────────────────────
    log('');
    log('③ กดดูยาข้างในล็อต (พี่กันสั่ง)');
    const before = await txt(page);
    check(before.indexOf('Metformin') < 0 || before.indexOf('ดูยา') >= 0, 'ยังไม่กด ยังไม่กางยา');

    await clickLabel(page, 'ดูรายการยาในล็อตนี้');
    await wait(800);
    t = await txt(page);
    check(t.indexOf('Metformin 500 mg') >= 0, 'กางแล้วเห็นชื่อยาจริง');
    check(t.indexOf('30 เม็ด') >= 0, 'เห็นจำนวนพร้อมหน่วยนับ');
    check(t.indexOf('ซ่อนยา') >= 0, 'ปุ่มเปลี่ยนเป็นซ่อนยา');

    const drugRows = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === 'ปิดหน้าต่าง');
      let d = btn;
      while (d && d.getAttribute && d.getAttribute('role') !== 'dialog') d = d.parentElement;
      if (!d) return 0;
      return (d.innerText.match(/ใช้ต่อ|ทำลาย/g) || []).length;
    });
    check(drugRows >= 3, 'เห็นสถานะใช้ต่อ/ทำลายรายตัวยา', drugRows + ' แถว');

    // กางล็อตที่สอง — ล็อตแรกต้องหุบเอง
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('[aria-label="ดูรายการยาในล็อตนี้"]')];
      if (all.length) all[0].click();
    });
    await wait(700);
    const openCount = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-label="ซ่อนรายการยาในล็อตนี้"]')].length);
    check(openCount === 1, 'กางได้ทีละล็อต ไม่กางค้างหลายอัน', openCount + ' ล็อต');

    // ── ④ ปิดหน้าต่าง ───────────────────────────────────────────────────
    log('');
    log('④ ปิดหน้าต่าง');
    await clickLabel(page, 'ปิดหน้าต่าง');
    await wait(700);
    const closed = await page.evaluate(() =>
      ![...document.querySelectorAll('[role="dialog"]')]
        .find((e) => e.innerText.indexOf('ล็อตที่กรอกค้างไว้') >= 0));
    check(closed, 'ปิดแล้ว');
    const seen = await grab(page, "return app.state.parkedSeen || 'ว่าง';");
    check(seen === 'ว่าง', 'ล้างล็อตที่กางค้างไว้ เปิดใหม่เริ่มจากหุบ', seen);

    ov = await overflow(page);
    ov.forEach((o) => check(!o.hit, o.what + ' หลังปิดหน้าต่าง', o.foot + (o.fav ? ' vs ' + o.fav : '')));

    if (process.env.SHOT === String.fromCharCode(49)) {
      if (!fs.existsSync('out')) fs.mkdirSync('out');
      await clickLabel(page, 'ดูรายการล็อตที่กรอกค้างไว้');
      await wait(700);
      await clickLabel(page, 'ดูรายการยาในล็อตนี้');
      await wait(700);
      await page.screenshot({ path: 'out/หน้าต่างล็อตค้าง.png' });
      await clickLabel(page, 'ปิดหน้าต่าง');
      await wait(600);
      await page.screenshot({ path: 'out/แถบล็อตค้าง-หุบ.png' });
      log('   ถ่ายภาพลง out/ แล้ว');
    }

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));

    if (process.env.SHOW === String.fromCharCode(49)) {
      log('');
      log('เปิดหน้าต่างค้างไว้ 25 วินาที ให้ดูด้วยตา');
      await wait(25000);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
