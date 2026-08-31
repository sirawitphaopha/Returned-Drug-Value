// ถ่ายภาพแถบล็อตค้างในโหมดดูตัวอย่าง ให้พี่กันเห็นของจริง
// (กฎ: รายงานเรื่องหน้าตาต้องให้เห็นภาพ ไม่ใช่เล่าเอา)
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
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });
  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
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

    // ① แถบตอนหุบ — ทั้งหน้า
    await page.screenshot({ path: 'out/แถบล็อตค้าง-หุบ.png' });

    // ② แถบตอนกาง
    await grab(page, 'app.toggleOtherDrafts(); return 1;');
    await wait(900);
    await page.screenshot({ path: 'out/แถบล็อตค้าง-กาง.png' });

    // ③ หน้าตั้งค่า — แถวชื่อเครื่อง
    await grab(page, "app.setState({ settingsOpen: true }); return 1;");
    await wait(1200);
    await page.screenshot({ path: 'out/ตั้งค่า-ชื่อเครื่อง.png' });

    console.log('ถ่ายเสร็จ 3 ภาพใน out/');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
