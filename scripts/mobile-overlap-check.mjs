// วัดว่าอะไรทับกันบ้างบนหน้าบันทึกฝั่งมือถือ (พี่กันแจ้ง 1 ก.ย. 2569 "มันทับกัน HN วันที่")
// 🚨 วัดพิกัดจริงในเบราว์เซอร์ ไม่ใช่อ่านจากโค้ด
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

const W = Number(process.argv[2] || 440);
const H = Number(process.argv[3] || 956);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'] });
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

    // กดเปิด "ตัวเลือกเพิ่มเติม" ถ้ายังไม่เปิด
    await page.evaluate(() => {
      const hit = [...document.querySelectorAll('[role="button"]')]
        .find((e) => /ตัวเลือกเพิ่มเติม|เพิ่มเติม/.test(e.innerText || ''));
      if (hit) hit.click();
    });
    await wait(900);

    const out = await page.evaluate(() => {
      const grab = (re, tag) => [...document.querySelectorAll(tag || '*')]
        .filter((e) => re.test((e.innerText || e.placeholder || '').trim()) && e.children.length === 0);
      const box = (e) => { const r = e.getBoundingClientRect();
        return { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
      const res = { w: innerWidth, h: innerHeight, items: [] };
      const push = (name, el) => { if (el) res.items.push(Object.assign({ name: name, text: (el.innerText || el.placeholder || '').slice(0, 22) }, box(el))); };

      push('ป้ายวันที่', grab(/^วันที่$/)[0]);
      push('ป้าย HN', grab(/^HN/)[0]);
      push('ช่องวันที่', document.querySelector('input[type="date"]'));
      push('ช่อง HN', [...document.querySelectorAll('input')].find((i) => i.placeholder === 'ปล่อยว่างได้'));
      push('ป้ายผู้บันทึก', grab(/^ผู้บันทึก$/)[0]);
      push('ป้ายต้องเลือก', grab(/ต้องเลือกก่อนบันทึก/)[0]);

      // แถบเมนูล่าง
      const nav = document.querySelector('[role="navigation"]');
      if (nav) {
        res.items.push(Object.assign({ name: 'แถบเมนูล่าง', text: '' }, box(nav)));
        [...nav.querySelectorAll('[role="button"]')].forEach((b, i) => {
          res.items.push(Object.assign({ name: 'แท็บ' + (i + 1), text: (b.innerText || '').replace(/\s+/g, '') }, box(b)));
        });
      }
      return res;
    });

    log('');
    log('จอ ' + out.w + '×' + out.h);
    log('');
    for (const it of out.items) {
      log('  ' + it.name.padEnd(14) + ' x ' + String(it.l).padStart(4) + '→' + String(it.r).padStart(4) +
        '   y ' + String(it.t).padStart(4) + '→' + String(it.b).padStart(4) +
        '   ' + (it.text ? '"' + it.text + '"' : ''));
    }

    // ตรวจการทับกันแบบตรง ๆ
    log('');
    const hit = [];
    for (let i = 0; i < out.items.length; i++) {
      for (let j = i + 1; j < out.items.length; j++) {
        const a = out.items[i], b = out.items[j];
        if (a.name.indexOf('แถบเมนู') === 0 || b.name.indexOf('แถบเมนู') === 0) continue;
        const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (ox > 1 && oy > 1) hit.push('  🔴 ' + a.name + ' ทับ ' + b.name + ' — กว้าง ' + ox + 'px สูง ' + oy + 'px');
      }
    }
    log(hit.length ? hit.join('\n') : '  ไม่มีอะไรทับกันในจุดที่วัด');

    await page.screenshot({ path: 'out/mobile-overlap.png' });
    log('');
    log('ภาพ: out/mobile-overlap.png');
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
