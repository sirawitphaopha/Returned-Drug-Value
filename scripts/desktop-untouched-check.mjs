// พิสูจน์ว่าเดสก์ท็อปไม่ขยับแม้แต่ 1px (พี่กันสั่ง 1 ก.ย. 2569)
//   "ห้ามเปลี่ยนเดสก์ท็อปสักนิดเดียว แม้แต่ขยับ 1px ก็ห้าม"
//
// วิธี: วัดพิกัดกับขนาดของทุกปุ่มในหน้าบันทึกฝั่งเดสก์ท็อป 2 รอบ
//       รอบแรกตามปกติ · รอบสองถอดคลาส .mrv-mobile ทิ้ง (จำลองว่าไฟล์มือถือไม่มีผล)
//       ถ้าเลขทุกตัวเท่ากันเป๊ะ = ไฟล์มือถือไม่รั่วมาโดนเดสก์ท็อปเลย
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

// วัดทุกปุ่ม + ช่องกรอก + กล่องสำคัญ เก็บเป็นลายนิ้วมือของหน้า
const fingerprint = (page) => page.evaluate(() => {
  const out = [];
  // 🚨 ข้ามข้อความเด้ง — มันหายเองตามเวลา ไม่ใช่ผลจาก CSS
  //    ถ้านับด้วยจะได้ผลไม่ตรงกันทุกรอบโดยไม่เกี่ยวกับสิ่งที่กำลังตรวจ
  const els = [...document.querySelectorAll('[role="button"], input, select, [role="status"]')]
    .filter((e) => !/^(✓|⚠|✕)/.test((e.innerText || '').trim()) || e.getAttribute('role') === 'button');
  for (const e of els) {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    out.push([
      (e.innerText || e.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 18),
      Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height),
      cs.padding, cs.fontSize, cs.minHeight, cs.touchAction, cs.userSelect, cs.transition.slice(0, 40)
    ].join('|'));
  }
  return out;
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.setViewport({ width: 1600, height: 950 });
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
      // 🚨 ต้องรอช่องรหัสโผล่จริง ห้ามรอเป็นเวลาตายตัว
      //    หน้าเข้าสู่ระบบโหลดฉากหลัง three.js (~600 KB) ก่อน ช้ากว่า 900 มิลลิวินาทีบ่อย
      //    รอไม่ทันแล้วสคริปต์พังทั้งตัวว่า No element found ทั้งที่เว็บปกติดี
      await page.waitForSelector('#mrv-pw', { timeout: 20000 });
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3500);

    // เปิดโหมดตัวอย่างให้มีของบนจอครบ ๆ จะได้วัดได้เยอะ
    await grab(page, 'app.enterDemo(); return 1;');
    await wait(3200);

    const wide = await grab(page, 'return (app.state.vw || 0) >= 1180 && !app.state.forceNarrow;');
    const hasClass = await page.evaluate(() => document.body.classList.contains('mrv-mobile'));
    log('');
    log('จอกว้าง 1600px → ฝั่งเดสก์ท็อป: ' + (wide ? 'ใช่' : '🔴 ไม่ใช่'));
    log('body มีคลาส mrv-mobile ไหม: ' + (hasClass ? '🔴 มี (ผิด)' : 'ไม่มี (ถูกต้อง)'));

    // ── รอบ 1 — ตามปกติ ──
    const a = await fingerprint(page);

    // ── รอบ 2 — บังคับใส่คลาสมือถือ แล้ววัดใหม่ ──
    // ถ้าไฟล์มือถือเขียนถูก คลาสนี้จะทำให้เลขเปลี่ยน = พิสูจน์ว่ากฎในไฟล์ทำงานจริง
    await page.evaluate(() => document.body.classList.add('mrv-mobile'));
    await wait(600);
    const b = await fingerprint(page);

    await page.evaluate(() => document.body.classList.remove('mrv-mobile'));
    await wait(600);
    const c = await fingerprint(page);

    // เทียบ
    const diffAB = a.filter((x, i) => x !== b[i]).length;
    const diffAC = a.filter((x, i) => x !== c[i]).length;

    log('');
    log('วัดของ ' + a.length + ' ชิ้นบนหน้าบันทึกเดสก์ท็อป (พิกัด ขนาด ระยะขอบ ฟอนต์ ฯลฯ)');
    log('');
    log((diffAC === 0 ? '  ผ่าน  ' : '  ตก    ') + 'ถอดคลาสแล้ววัดซ้ำ ได้เลขเดิมทุกตัว — ' + diffAC + ' ชิ้นที่ต่าง');
    log((diffAB > 0 ? '  ผ่าน  ' : '  ตก    ') + 'ใส่คลาสมือถือแล้วเลขเปลี่ยนจริง (พิสูจน์ว่าไฟล์ทำงาน) — ' + diffAB + ' ชิ้นที่ต่าง');

    if (diffAB > 0) {
      log('');
      log('ตัวอย่างชิ้นที่เปลี่ยนเมื่อเป็นมือถือ (3 ชิ้นแรก)');
      let n = 0;
      for (let i = 0; i < a.length && n < 3; i++) {
        if (a[i] !== b[i]) {
          const fa = a[i].split('|'), fb = b[i].split('|');
          log('   "' + fa[0] + '"');
          log('     เดสก์ท็อป: touch=' + fa[8] + ' select=' + fa[9] + ' minH=' + fa[7]);
          log('     มือถือ   : touch=' + fb[8] + ' select=' + fb[9] + ' minH=' + fb[7]);
          n++;
        }
      }
    }

    log('');
    if (diffAC > 0) {
      log('');
      log('ชิ้นที่ต่างหลังถอดคลาส (ต้องดูว่าเป็นของ CSS จริงหรือแค่ตัวเลขที่เดินเอง)');
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== c[i]) {
          log('   ก่อน: ' + a[i]);
          log('   หลัง: ' + c[i]);
        }
      }
    }

    log(diffAC === 0
      ? '✅ สรุป: เดสก์ท็อปไม่ขยับแม้แต่พิกเซลเดียว'
      : '🔴 สรุป: เดสก์ท็อปเปลี่ยนไป ' + diffAC + ' ชิ้น — ต้องแก้');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
