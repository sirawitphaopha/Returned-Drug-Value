// ปุ่มย้อนกลับของเครื่อง — ต้องปิดหน้าต่างซ้อนทีละชั้น ไม่ใช่ออกจากเว็บ
//
// 🚨 พี่กันเจอเอง 10 ก.ย. 2569 — เว็บเปิดแบบแอปเต็มจอ (display: standalone)
//    ไม่มีหน้าก่อนหน้าให้กลับ ปุ่มย้อนกลับของแอนดรอยด์จึงออกจากเว็บทันที
//    ยาที่กรอกค้างหายทั้งล็อต
//
// 🚨 ตัวตรวจนี้กดปุ่มจริงและอ่านประวัติการเปิดหน้าจริง ไม่ใช่อ่านค่าจากโค้ด
//    (บทเรียนข้อ 3.66 — เทสด้วย setState ผ่านหมดแต่ปุ่มตาย)
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:' + (process.env.PORT || '3000');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const pw = (() => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
})();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let ผ่าน = 0, ตก = 0;
const เช็ค = (ชื่อ, ได้, ควรได้) => {
  const ok = JSON.stringify(ได้) === JSON.stringify(ควรได้);
  if (ok) { ผ่าน++; console.log('  ✅ ' + ชื่อ); }
  else { ตก++; console.log('  ❌ ' + ชื่อ + ' — ได้ ' + JSON.stringify(ได้) + ' ควรได้ ' + JSON.stringify(ควรได้)); }
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    // 🚨 ชื่อเครื่องต้องเป็น "เครื่องทดสอบอัตโนมัติ" ห้ามใช้ชื่อ 8 เครื่องจริง (ข้อ 3.64)
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3500);

    // จับตัวแอปผ่าน React fiber — ไม่ผูกกับข้อความบนหน้าจอ
    const เจอแอป = await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null;
      while (f) {
        if (f.stateNode && f.stateNode.state && 'settingsOpen' in f.stateNode.state) { window.__app = f.stateNode; return true; }
        f = f.return;
      }
      return false;
    });
    if (!เจอแอป) { console.error('🔴 หาตัวแอปไม่เจอ — หยุดก่อน อย่าเชื่อผลที่ออกมา'); process.exit(1); }

    const อ่าน = () => page.evaluate(() => ({
      len: history.length,
      pushed: window.__app._modalPushed === true,
      settings: window.__app.state.settingsOpen === true,
      confirm: !!window.__app.state.confirm,
      deviceAsk: window.__app.state.deviceAsk === true,
      path: location.pathname
    }));
    const ตั้ง = (obj) => page.evaluate((o) => { window.__app.setState(o); }, obj).then(() => wait(700));
    const กดย้อนกลับ = () => page.evaluate(() => { history.back(); }).then(() => wait(900));

    console.log('');
    console.log('① เปิดหน้าต่างซ้อน → ต้องฝากรอยไว้ในประวัติการเปิดหน้า');
    const ก่อน = await อ่าน();
    await ตั้ง({ settingsOpen: true });
    const เปิดแล้ว = await อ่าน();
    เช็ค('ฝากรอยแล้ว', เปิดแล้ว.pushed, true);
    เช็ค('ประวัติยาวขึ้นหนึ่งรอย', เปิดแล้ว.len - ก่อน.len, 1);

    console.log('');
    console.log('② กดย้อนกลับ → ปิดหน้าต่าง ไม่ออกจากเว็บ');
    await กดย้อนกลับ();
    const หลังกด = await อ่าน();
    เช็ค('หน้าต่างปิดแล้ว', หลังกด.settings, false);
    เช็ค('ยังอยู่ในเว็บ', หลังกด.path, '/');
    เช็ค('รอยถูกใช้ไปแล้ว', หลังกด.pushed, false);

    console.log('');
    console.log('③ ป๊อปซ้อนป๊อป → ปิดทีละชั้น จากบนลงล่าง');
    await ตั้ง({ settingsOpen: true });
    await ตั้ง({ confirm: { title: 'ทดสอบชั้นซ้อน', msg: 'ทดสอบ', run: () => {} } });
    await กดย้อนกลับ();
    const ชั้นแรก = await อ่าน();
    เช็ค('ป๊อปยืนยันปิดก่อน', ชั้นแรก.confirm, false);
    เช็ค('หน้าตั้งค่ายังเปิดอยู่', ชั้นแรก.settings, true);
    เช็ค('ฝากรอยใหม่ให้ชั้นที่เหลือ', ชั้นแรก.pushed, true);
    await กดย้อนกลับ();
    const ชั้นสอง = await อ่าน();
    เช็ค('กดอีกครั้งจึงปิดหน้าตั้งค่า', ชั้นสอง.settings, false);
    เช็ค('ยังอยู่ในเว็บ', ชั้นสอง.path, '/');

    console.log('');
    console.log('④ ปิดด้วยปุ่มในเว็บ → ต้องเก็บรอยคืน ไม่สะสมเป็นคิวเปล่า');
    await ตั้ง({ settingsOpen: true });
    await ตั้ง({ settingsOpen: false });
    await wait(600);
    const เก็บคืน = await อ่าน();
    เช็ค('ไม่เหลือรอยค้าง', เก็บคืน.pushed, false);

    console.log('');
    console.log('⑤ หน้าต่างถามชื่อเครื่อง — ปุ่มย้อนกลับปิดไม่ได้ (พี่กันสั่งว่าไม่มีปุ่มข้าม)');
    await ตั้ง({ deviceAsk: true });
    const ถามเครื่อง = await อ่าน();
    เช็ค('ไม่ฝากรอยให้หน้าต่างนี้', ถามเครื่อง.pushed, false);
    const ปิดได้ไหม = await page.evaluate(() => window.__app._closeTopLayer());
    เช็ค('สั่งปิดชั้นบนสุดแล้วไม่มีอะไรให้ปิด', ปิดได้ไหม, false);
    เช็ค('หน้าต่างยังเปิดอยู่', (await อ่าน()).deviceAsk, true);
    await ตั้ง({ deviceAsk: false });

    console.log('');
    console.log('⑥ รายการชั้น (_layers) ต้องเป็นตารางเดียว ใช้ทั้งปิดและทั้งถาม');
    const ครบไหม = await page.evaluate(() => {
      const a = window.__app;
      return { จำนวนชั้น: a._layers().length, ถามได้: typeof a._hasTopLayer === 'function' };
    });
    เช็ค('มีตัวถามว่ามีชั้นเปิดอยู่ไหม', ครบไหม.ถามได้, true);
    เช็ค('รายการชั้นครบ 19 ชั้น', ครบไหม.จำนวนชั้น, 19);

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
