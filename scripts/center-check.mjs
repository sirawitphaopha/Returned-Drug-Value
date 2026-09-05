// วัดว่าข้อความในช่องอยู่ "กึ่งกลาง" ของอะไรกันแน่
// 🚨 พี่กันถาม 1 ก.ย. 2569: "คำว่า ไม่บังคับ อยู่กลางจริงๆไหม"
//    ตอบด้วยการดูภาพผ่าน ๆ ไม่ได้ ต้องวัดพิกัดจริงจากเบราว์เซอร์
//
// วัด 3 อย่างต่อช่อง — กึ่งกลางกรอบทั้งอัน · กึ่งกลางพื้นที่หลังเส้นคั่น · กึ่งกลางตัวอักษรจริง
//
//   node scripts/center-check.mjs
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

    // เลือก รพ.สต. + กางตัวเลือกเพิ่มเติม ให้ครบทุกช่อง
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('[role="button"]')];
      const chip = all.find((e) => (e.textContent || '').trim() === 'รพ.สต.');
      if (chip) chip.click();
    });
    await wait(600);
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('[role="button"]')];
      const more = all.find((e) => (e.textContent || '').indexOf('2569') >= 0);
      if (more) more.click();
    });
    await wait(700);

    const rows = await page.evaluate(() => {
      const out = [];
      // วัดความกว้างข้อความจริงด้วย canvas ตามฟอนต์ที่ใช้อยู่จริง
      const ctx = document.createElement('canvas').getContext('2d');
      const textW = (el, txt) => {
        const cs = getComputedStyle(el);
        ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        return ctx.measureText(txt).width;
      };
      const push = (ชื่อ, box, inner, txt) => {
        if (!box || !inner) return;
        const b = box.getBoundingClientRect(), ir = inner.getBoundingClientRect();
        // 🚨 ต้องวัดจาก "พื้นที่เนื้อหา" ไม่ใช่กล่องทั้งใบ — ตัวค่าเผื่อที่ว่างทางขวาไว้ชดเชยป้าย
        //    ถ้าวัดรวม padding จะได้ผลผิดว่าเยื้อง ทั้งที่ตาเห็นว่าตรงกลางแล้ว
        const cs0 = getComputedStyle(inner);
        const i = { left: ir.left + parseFloat(cs0.paddingLeft || 0),
                    width: ir.width - parseFloat(cs0.paddingLeft || 0) - parseFloat(cs0.paddingRight || 0) };
        const w = textW(inner, txt);
        // ตัวอักษรวางกึ่งกลางของ inner แล้วขอบซ้าย/ขวาของตัวอักษรอยู่ตรงไหน
        const tl = i.left + (i.width - w) / 2, tr = tl + w;
        out.push({
          ช่อง: ชื่อ,
          กลางกรอบ: Math.round(b.left + b.width / 2),
          กลางพื้นที่ค่า: Math.round(i.left + i.width / 2),
          กลางตัวอักษร: Math.round((tl + tr) / 2),
          // 🚨 เกณฑ์คือกึ่งกลาง "ช่องกรอก" (พื้นที่ขาวหลังเส้นคั่น) ตามที่พี่กันชี้
          //    ไม่ใช่กึ่งกลางกรอบที่รวมป้าย — ตาคนมองว่าป้ายเป็นของนอกช่อง
          เยื้องจากกลางช่องกรอก: Math.round((tl + tr) / 2 - (i.left + i.width / 2)) + 'px',
          ฟอนต์: getComputedStyle(inner).fontSize + ' น้ำหนัก ' + getComputedStyle(inner).fontWeight
        });
      };

      const byLabel = (t) => {
        const sp = [...document.querySelectorAll('span')].find((e) => (e.textContent || '').trim() === t);
        return sp ? sp.parentElement : null;
      };

      const hnBox = byLabel('HN');
      if (hnBox) push('HN · ไม่บังคับ', hnBox, hnBox.querySelector('input'), 'ไม่บังคับ');

      const dBox = byLabel('วันที่');
      if (dBox) push('วันที่', dBox, dBox.querySelector('input'), '01/09/2026');

      const pBox = byLabel('รพ.สต.');
      if (pBox) push('รพ.สต.', pBox, pBox.querySelector('select'), 'ต้องเลือกก่อนบันทึก');

      const rBox = byLabel('ผู้บันทึก');
      if (rBox) {
        const val = [...rBox.querySelectorAll('span')].find((e) => (e.textContent || '').indexOf('เลือก') >= 0);
        push('ผู้บันทึก', rBox, val, 'ต้องเลือกก่อนบันทึก');
      }
      return out;
    });

    console.log('');
    console.log('  ช่อง                กลางกรอบ   กลางช่องกรอก   กลางตัวอักษร   เยื้อง   ฟอนต์');
    for (const r of rows) {
      console.log('  ' + r.ช่อง.padEnd(20) + String(r.กลางกรอบ).padStart(6) +
        String(r.กลางพื้นที่ค่า).padStart(14) + String(r.กลางตัวอักษร).padStart(14) +
        r.เยื้องจากกลางช่องกรอก.padStart(10) + '   ' + r.ฟอนต์);
    }
    console.log('');
    console.log('  เยื้อง = ตัวอักษรอยู่ห่างจากจุดกึ่งกลางของ "ช่องกรอก" เท่าไร (0 = กลางพอดี)');
    console.log('  กลางกรอบ = จุดกึ่งกลางของกรอบที่รวมป้าย ใส่ไว้เทียบให้เห็นว่าคนละจุดกัน');
  } catch (e) {
    console.log('พัง: ' + e.message);
  } finally {
    await browser.close();
  }
})();
