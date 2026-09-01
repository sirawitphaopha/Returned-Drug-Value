// ตรวจทั้งหน้าจอว่ามีข้อความไทยตรงไหนโดนตัดหัวสระหรือวรรณยุกต์
//
// 🚨 พี่กันเจอเอง 1 ก.ย. 2569 สามจุด — "ตัว ไ โดนตัดส่วนปลายข้างบน" ·
//    "แถบค้นหาตัดวรรณยุก เช่น นี้ นั้น ตัดไม้โท" · "เครื่องนี้ ไม้โท ไม้เอกหาย"
//
// กลไกของอาการ: ตัวอักษรไทยที่มีวรรณยุกต์ซ้อนสระบน (นี้ นั้น เครื่อง ไต้)
// ลอยสูงกว่าที่ฟอนต์ประกาศไว้ราว 3 จุด · กล่องที่ตั้ง overflow ไม่ให้ล้น
// (input ทุกตัว หรือกล่องที่เขียน overflow:hidden ไว้) จะตัดส่วนเกินนั้นทิ้ง
// เห็นเป็นวรรณยุกต์หายไปดื้อ ๆ ทั้งที่ตัวอักษรอื่นปกติ
//
// เกณฑ์: ระยะบรรทัดต้องไม่ต่ำกว่า 1.5 เท่าของขนาดตัวอักษร
//        (วัดจากฟอนต์จริง — ยอดวรรณยุกต์อยู่ที่ 1.19 เท่าของขนาด ส่วน descender อีก 0.28)
//
//   node scripts/thai-clip-check.mjs          จอมือถือ 440
//   node scripts/thai-clip-check.mjs 1360     จอคอม
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
const W = Number(process.argv[2] || 440);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: 900, deviceScaleFactor: 1, isMobile: W < 1180, hasTouch: W < 1180 });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = r.url(), m = r.method();
      if (u.indexOf('/api/') >= 0 && u.indexOf('/api/auth') < 0 && m !== 'GET') {
        r.respond({ status: 503, contentType: 'application/json', body: '{}' }); return;
      }
      r.continue();
    });
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    if (page.url().indexOf('/login') >= 0) {
      await page.waitForSelector('#mrv-pw', { timeout: 20000 });
      await wait(1200);
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => {
      try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {}
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3200);

    const bad = await page.evaluate(() => {
      const TONE = /[\u0E48-\u0E4C]/;          // ไม้เอก โท ตรี จัตวา การันต์
      const UPPER = /[\u0E31\u0E34-\u0E37\u0E47]/;  // สระบน ไม้ไต่คู้
      const out = [];
      const seen = new Set();
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        // ตัดกล่องที่ปล่อยให้ล้นได้ ตัวอักษรจะไม่ถูกตัด
        const clips = cs.overflow !== 'visible' || el.tagName === 'INPUT' || el.tagName === 'SELECT';
        if (!clips) continue;
        // เอาเฉพาะกล่องที่มีข้อความของตัวเอง
        let txt = '';
        if (el.tagName === 'INPUT') txt = el.value || el.placeholder || '';
        else if (el.tagName === 'SELECT') txt = (el.selectedOptions[0] || {}).text || '';
        else for (const n of el.childNodes) if (n.nodeType === 3) txt += n.textContent;
        txt = txt.trim();
        if (!txt || !(TONE.test(txt) || UPPER.test(txt))) continue;
        // 🚨 ตัดสินจาก "ที่ว่างจริงเหนือตัวอักษร" ไม่ใช่ระยะบรรทัดลอย ๆ
        //    เกณฑ์เดิมดูแค่ line-height แล้วฟ้องชิป เยี่ยมบ้าน ที่ปกติดี (พี่กันทัก)
        //    กล่องที่บรรทัดเตี้ยแต่ตัวกล่องสูง ยังมีที่ให้วรรณยุกต์ ไม่ตัด
        const size = parseFloat(cs.fontSize);
        const lh = cs.lineHeight === 'normal' ? size * 1.2 : parseFloat(cs.lineHeight);
        // ยอดวรรณยุกต์ลอยเหนือเส้นฐานราว 1.19 เท่าของขนาดตัวอักษร
        // ส่วนที่ฟอนต์จองไว้มีแค่ราว 1.0 เท่า ส่วนเกินคือส่วนที่เสี่ยงโดนตัด
        const r0 = el.getBoundingClientRect();
        const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
        const bt = parseFloat(cs.borderTopWidth) || 0, bb2 = parseFloat(cs.borderBottomWidth) || 0;
        const content = r0.height - padT - padB - bt - bb2;
        // ที่ว่างเหนือบรรทัด = ครึ่งหนึ่งของส่วนที่กล่องสูงกว่าบรรทัด
        const room = Math.max(0, (content - lh) / 2) + Math.max(0, (lh - size * 1.28) / 2);
        const overflowNeed = size * 0.22;   // ส่วนที่วรรณยุกต์ล้นเหนือที่ฟอนต์จองไว้
        if (room >= overflowNeed - 0.3) continue;
        const need = Math.round((overflowNeed - room) * 10) / 10;
        const key = txt.slice(0, 22) + '|' + size + '|' + lh;
        if (seen.has(key)) continue;
        seen.add(key);
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        out.push({
          ข้อความ: txt.slice(0, 30),
          ขนาด: size,
          ระยะบรรทัด: Math.round(lh * 10) / 10,
          ขาดที่ว่างเหนือตัวอักษร: need + 'px',
          ที่ว่างที่มี: Math.round(room * 10) / 10 + 'px'
        });
      }
      return out;
    });

    console.log('');
    console.log('  จอกว้าง ' + W + ' — ข้อความที่ระยะบรรทัดไม่พอ วรรณยุกต์จะโดนตัด');
    console.log('');
    if (!bad.length) console.log('  ✅ ไม่เจอจุดที่เสี่ยงโดนตัด');
    for (const b of bad) {
      console.log('  X  "' + b.ข้อความ + '"');
      console.log('       ตัวอักษร ' + b.ขนาด + 'px · ระยะบรรทัด ' + b.ระยะบรรทัด +
        'px · ที่ว่างเหนือตัวอักษร ' + b.ที่ว่างที่มี + ' (ขาดอีก ' + b.ขาดที่ว่างเหนือตัวอักษร + ')');
    }
    console.log('');
    console.log('  รวม ' + bad.length + ' จุด');
    process.exitCode = bad.length ? 1 : 0;
  } catch (e) {
    console.log('พัง: ' + e.message);
  } finally {
    await browser.close();
  }
})();
