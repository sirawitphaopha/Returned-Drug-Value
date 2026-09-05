// วัดหน้าตาช่อง รพ.สต. กับ ผู้บันทึก "หลังเลือกค่าแล้ว" ว่าเหมือนกันจริงไหม
// 🚨 พี่กันทัก 1 ก.ย. 2569: "ฟอนต์ไม่เหมือนกัน" — ตอนยังไม่เลือกเหมือนกันแล้ว
//    แต่พอเลือกค่าแล้วน้ำหนักตัวอักษรต่างกัน (600 กับ 500) ตาจับได้ทันที
//
// วัดตอนเลือกแล้วเท่านั้น สคริปต์ center-check วัดตอนยังไม่เลือกจึงไม่เจอ
//
//   node scripts/picked-check.mjs
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

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
    await wait(3500);

    // เลือกแหล่งที่มาเป็น รพ.สต. แล้วเลือกแห่งแรกในรายการ
    await page.evaluate(() => {
      const chip = [...document.querySelectorAll('[role="button"]')].find((e) => (e.textContent || '').trim() === 'รพ.สต.');
      if (chip) chip.click();
    });
    await wait(600);
    await page.evaluate(() => {
      const sel = document.querySelector('select[aria-label*="รพ.สต."]');
      if (!sel) return;
      const opt = [...sel.options].find((o) => o.value);
      if (!opt) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, opt.value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(700);

    // เลือกผู้บันทึกคนแรกจากเมนู
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[role="button"]')].find((e) => (e.textContent || '').indexOf('เลือกผู้บันทึก') >= 0);
      if (b) b.click();
    });
    await wait(600);
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[role="button"]')]
        .filter((e) => /^(ภก|ภญ|นาย|นาง|น\.ส)/.test((e.textContent || '').trim()));
      if (rows.length) rows[rows.length - 1].click();
    });
    await wait(800);

    const rows = await page.evaluate(() => {
      const out = [];
      const byLabel = (t) => {
        const sp = [...document.querySelectorAll('span')].find((e) => (e.textContent || '').trim() === t);
        return sp ? sp.parentElement : null;
      };
      const read = (ชื่อ, box, inner) => {
        if (!box || !inner) return;
        const cs = getComputedStyle(inner);
        const b = box.getBoundingClientRect();
        out.push({
          ช่อง: ชื่อ,
          ค่าที่เลือก: (inner.tagName === 'SELECT' ? (inner.selectedOptions[0] || {}).text : inner.textContent || '').trim(),
          ขนาด: cs.fontSize,
          น้ำหนัก: cs.fontWeight,
          สี: cs.color,
          จัดวาง: cs.textAlign,
          สูงกรอบ: Math.round(b.height) + 'px'
        });
      };
      const p = byLabel('รพ.สต.');
      if (p) read('รพ.สต.', p, p.querySelector('select'));
      const r = byLabel('ผู้บันทึก');
      if (r) {
        const val = [...r.querySelectorAll('span')].find((e) => e !== r.querySelector('span') && (e.textContent || '').trim());
        read('ผู้บันทึก', r, val);
      }
      return out;
    });

    console.log('');
    for (const r of rows) {
      console.log('  ' + r.ช่อง.padEnd(10) + ' "' + r.ค่าที่เลือก + '"');
      console.log('             ขนาด ' + r.ขนาด + ' · น้ำหนัก ' + r.น้ำหนัก + ' · จัดวาง ' + r.จัดวาง +
        ' · สี ' + r.สี + ' · กรอบสูง ' + r.สูงกรอบ);
    }
    if (rows.length === 2) {
      const same = rows[0].ขนาด === rows[1].ขนาด && rows[0].น้ำหนัก === rows[1].น้ำหนัก &&
        rows[0].จัดวาง === rows[1].จัดวาง && rows[0].สูงกรอบ === rows[1].สูงกรอบ;
      console.log('');
      console.log(same ? '  ✅ สองช่องหน้าตาเหมือนกันทุกอย่าง' : '  ❌ ยังไม่เหมือนกัน');
    }
    await page.screenshot({ path: 'out/f-picked.png', clip: { x: 0, y: 0, width: 440, height: 500 } });
    const r2 = await page.evaluate(() => {
      const sp = [...document.querySelectorAll('span')].find((e) => (e.textContent || '').trim() === 'ผู้บันทึก');
      if (!sp) return null;
      const b = sp.parentElement.getBoundingClientRect();
      return { x: Math.max(0, b.left - 10), y: Math.max(0, b.top - 10), width: Math.min(440, b.width + 20), height: b.height + 20 };
    });
    if (r2) await page.screenshot({ path: 'out/f-picked-rec.png', clip: r2 });
    console.log('  ภาพ: out/f-picked.png · out/f-picked-rec.png');
  } catch (e) {
    console.log('พัง: ' + e.message);
  } finally {
    await browser.close();
  }
})();
