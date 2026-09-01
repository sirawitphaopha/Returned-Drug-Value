// เดินตามอาการที่พี่กันเจอเป๊ะ ๆ (1 ก.ย. 2569)
//   "เรากดส่งแล้วมันเด้งให้เลือกคนส่ง จากนั้นเรากดบันทึก มันไม่ไปเลย"
//
// 🚨 กดผ่านหน้าจอจริงทุกขั้น ไม่ใช่ setState เอาเอง
//    เพราะบั๊กแบบนี้เกิดจากลำดับการกดกับตำแหน่งของเมนู ซึ่ง setState ข้ามไปหมด
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

const txt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

// กดปุ่มบันทึกจริงด้วยการแตะที่พิกัดกลางปุ่ม (เหมือนนิ้วคน)
const tapSave = async (page) => {
  const box = await page.evaluate(() => {
    const b = [...document.querySelectorAll('[role="button"]')]
      .find((e) => (e.innerText || '').indexOf('รายการ') > 0 && (e.innerText || '').indexOf('บันทึก') === 0);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
      inView: r.top >= 0 && r.bottom <= window.innerHeight, label: b.innerText.replace(/\s+/g, ' ').trim() };
  });
  if (!box) return { ok: false, why: 'ไม่เจอปุ่มบันทึก' };
  if (!box.inView) return { ok: false, why: 'ปุ่มอยู่นอกจอ กดไม่ถึง' };
  await page.mouse.click(box.x, box.y);
  return { ok: true, label: box.label, at: box.x + ',' + box.y };
};

(async () => {
  if (!fs.existsSync('out')) fs.mkdirSync('out');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: process.env.SHOW === String.fromCharCode(49) ? false : 'new',
    args: ['--no-sandbox', '--window-size=430,900']
  });

  try {
    const page = await browser.newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    const sent = [];
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        sent.push(m + ' ' + u.replace(BASE, ''));
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
      try { localStorage.setItem('mrv.device', JSON.stringify('มือถือของ ภก. ทดสอบ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4000);

    // ── เตรียม: มียาในรายการ ยังไม่เลือกผู้บันทึก ──
    await grab(page, `
      const d = app.state.drugs[0];
      app.persist({ rows: [{ rid: 'f1', drugId: d.id, name: d.name, unit: d.unit,
        price: d.price || 1, qty: 20, disposition: 'reuse', source: 'opd' }] });
      app.setState({ recorder: '' });
      return 'ok';`);
    await wait(1500);

    // ── ① กดส่งครั้งแรก ──
    log('');
    log('① กดปุ่มบันทึกครั้งแรก (ยังไม่เลือกผู้บันทึก)');
    let r1 = await tapSave(page);
    log('   กดปุ่ม: ' + (r1.ok ? '"' + r1.label + '" ที่ ' + r1.at : '🔴 ' + r1.why));
    await wait(1500);
    let t = await txt(page);
    const st1 = await grab(page, `
      return { menu: !!app.state.recorderMenuOpen, showMore: !!app.state.showMore,
               box: app.state.recorderBox ? 'มี' : 'ไม่มี', recorder: app.state.recorder || '(ว่าง)' };`);
    log('   ผล: เตือนให้เลือกผู้บันทึก=' + (t.indexOf('เลือกชื่อผู้บันทึก') >= 0 ? 'ใช่' : 'ไม่')
      + ' · เมนูเปิด=' + st1.menu + ' · ตำแหน่งเมนู=' + st1.box);
    await page.screenshot({ path: 'out/มือถือ-หลังกดครั้งแรก.png' });

    // ── ② เลือกชื่อจากเมนูที่เด้งขึ้นมา (กดจริง) ──
    log('');
    log('② เลือกชื่อผู้บันทึกจากเมนู');
    const picked = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[role="button"]')]
        .filter((e) => /^(ภก|ภญ|จพ)\./.test((e.innerText || '').trim()));
      if (!rows.length) return null;
      const r = rows[0].getBoundingClientRect();
      rows[0].click();
      return { name: rows[0].innerText.trim(), inView: r.top >= 0 && r.bottom <= window.innerHeight };
    });
    log('   เลือก: ' + (picked ? picked.name + (picked.inView ? '' : ' (แถวอยู่นอกจอ)') : '🔴 ไม่เจอรายชื่อในเมนู'));
    await wait(1500);
    const st2 = await grab(page, `
      return { recorder: app.state.recorder || '(ว่าง)', menu: !!app.state.recorderMenuOpen,
               showMore: !!app.state.showMore };`);
    log('   ผู้บันทึกตอนนี้: ' + st2.recorder + ' · เมนูปิดแล้ว=' + !st2.menu);
    await page.screenshot({ path: 'out/มือถือ-หลังเลือกชื่อ.png' });

    // ── ③ กดบันทึกอีกครั้ง (จุดที่พี่กันบอกว่าไม่ไป) ──
    log('');
    log('③ กดปุ่มบันทึกอีกครั้ง — จุดที่พี่กันบอกว่าไม่ไป');
    sent.length = 0;
    let r2 = await tapSave(page);
    log('   กดปุ่ม: ' + (r2.ok ? '"' + r2.label + '" ที่ ' + r2.at : '🔴 ' + r2.why));
    await wait(1800);
    t = await txt(page);
    const st3 = await grab(page, `return { confirm: app.state.confirm ? app.state.confirm.title : '(ไม่มี)' };`);
    log('   ป๊อปยืนยัน: ' + st3.confirm);
    log('   ข้อความเตือนบนจอ: ' + (t.indexOf('เลือกชื่อผู้บันทึก') >= 0 ? '🔴 ยังบอกให้เลือกผู้บันทึกอยู่'
      : t.indexOf('เลือก รพ.สต.') >= 0 ? '🔴 ให้เลือก รพ.สต.'
      : t.indexOf('เลือกวันที่') >= 0 ? '🔴 ให้เลือกวันที่' : 'ไม่มี'));
    await page.screenshot({ path: 'out/มือถือ-หลังกดครั้งสอง.png' });

    // ── ④ ถ้าป๊อปขึ้น กดยืนยัน ──
    if (st3.confirm !== '(ไม่มี)') {
      log('');
      log('④ กดยืนยันในป๊อป');
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('[role="button"]')]
          .find((e) => (e.innerText || '').trim() === 'ยืนยันบันทึก');
        if (b) b.click();
      });
      await wait(2000);
      log('   คำขอที่ยิงออกไป: ' + (sent.length ? sent.join(' · ') : '🔴 ไม่ยิงอะไรเลย'));
    }

    log('');
    log('ภาพอยู่ใน out/ — มือถือ-หลังกดครั้งแรก / หลังเลือกชื่อ / หลังกดครั้งสอง');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
