// วัดความกว้างที่พอดีของคอลัมน์ที่มีชื่อคนกับชื่อสถานที่ ในตารางประวัติฝั่งคอม
//
//   พี่กันสั่ง 10 ก.ย. 2569
//     "เธอควรลิสต์รายชื่อทุกคนมา แล้วคำนวณค่าความกว้างที่ชื่อทุกคนใส่เข้าไปได้แล้วไม่โดนตัด"
//     "อย่าลืม ชื่อ รพ.สต. บางเจ้ามันชื่อยาวนะ อนาคตมันอาจจะโดนตัด
//      ดังนั้นจุดนี้เธอก็ควรไปวัดมาทุก รพ.สต. ว่ามันควรจะยาวแค่ไหน"
//
// 🚨 วัด "ทุกตัวเลือกที่เลือกได้" ไม่ใช่แค่ค่าที่เคยบันทึกจริง
//    คนหรือแห่งที่ยังไม่เคยใช้ วันหน้าก็ใช้ ชื่อต้องไม่ตัดตั้งแต่วันแรก
// 🚨 วัดด้วยฟอนต์ที่ตารางใช้จริง ไม่ใช่นับจำนวนตัวอักษร (ตัวอักษรไทยกว้างไม่เท่ากัน)
//
//   ใช้: node scripts/col-width.mjs
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

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await wait(900);
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(3800);
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
        .find((b) => (b.innerText || '').trim().indexOf('ประวัติ') === 0).click();
    });
    await wait(3000);

    // รายชื่อทั้งหมดที่เลือกได้ — อ่านจากตัวแอปเอง (มาจาก mr_setting)
    const ของ = await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && f.stateNode.state && 'staff' in f.stateNode.state) { app = f.stateNode; break; } f = f.return; }
      if (!app) return null;
      return { staff: app.state.staff || [], pcu: app.state.pcuSites || [] };
    });
    if (!ของ || !ของ.staff.length) { console.error('🔴 อ่านรายชื่อไม่ได้ — หยุดก่อน อย่าเชื่อผลที่ออกมา'); process.exit(1); }
    if (!ของ.pcu.length) { console.error('🔴 อ่านรายชื่อ รพ.สต. ไม่ได้ — หยุดก่อน'); process.exit(1); }

    const ผล = await page.evaluate((d) => {
      const หัว = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/[↑↓\s]+/g, ' ').trim());
      const tr = document.querySelector('table tbody tr');
      const ช่องของ = (ชื่อหัว) => {
        const i = หัว.findIndex((h) => h.indexOf(ชื่อหัว) >= 0);
        return i >= 0 ? tr.children[i] : null;
      };
      const วัดใน = (td, ข้อความ) => {
        const cs = getComputedStyle(td);
        const s = document.createElement('span');
        s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;'
          + 'font-size:' + cs.fontSize + ';font-family:' + cs.fontFamily
          + ';font-weight:' + cs.fontWeight + ';letter-spacing:' + cs.letterSpacing;
        s.textContent = ข้อความ;
        document.body.appendChild(s);
        const w = Math.ceil(s.getBoundingClientRect().width);
        s.remove();
        return w;
      };
      const ระยะใน = (td) => {
        const cs = getComputedStyle(td);
        return Math.round(parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
      };

      // ── คอลัมน์ผู้บันทึก — โชว์ คำนำหน้า + ชื่อต้น ─────────────────────
      const ย่อ = (full) => {
        const t = String(full || '').trim();
        const w = t.split(/\s+/);
        if (w.length === 1) return t;
        return /\.$/.test(w[0]) ? w[0] + ' ' + w[1] : w[0];
      };
      const tdBy = ช่องของ('ผู้บันทึก');
      const by = d.staff.map((n) => ({ โชว์: ย่อ(n), กว้าง: วัดใน(tdBy, ย่อ(n)) })).sort((a, b) => b.กว้าง - a.กว้าง);

      // ── คอลัมน์แหล่งที่มา — ยาวสุดคือ "รพ.สต. <ชื่อ>" ───────────────────
      const tdSrc = ช่องของ('แหล่งที่มา');
      const อื่น = ['OPD ทั่วไป', 'OPD NCD', 'ห้องยา IPD', 'เยี่ยมบ้าน', 'รพ.สต.'];
      const src = d.pcu.map((n) => 'รพ.สต. ' + n).concat(อื่น)
        .map((n) => ({ โชว์: n, กว้าง: วัดใน(tdSrc, n) })).sort((a, b) => b.กว้าง - a.กว้าง);

      return {
        by: { ระยะใน: ระยะใน(tdBy), ตอนนี้: Math.round(tdBy.getBoundingClientRect().width), แถว: by },
        src: { ระยะใน: ระยะใน(tdSrc), ตอนนี้: Math.round(tdSrc.getBoundingClientRect().width), แถว: src }
      };
    }, ของ);

    const พิมพ์ = (ชื่อ, g, เผื่อ) => {
      console.log('');
      console.log('══ คอลัมน์' + ชื่อ + ' ══  ตอนนี้กว้าง ' + g.ตอนนี้ + ' จุด · ระยะขอบในรวม ' + g.ระยะใน + ' จุด');
      console.log('');
      g.แถว.slice(0, 6).forEach((r, i) => {
        console.log('   ' + (i === 0 ? '🥇' : '  ') + ' ' + r.โชว์.padEnd(22) + String(r.กว้าง).padStart(4) + 'px');
      });
      if (g.แถว.length > 6) console.log('      … อีก ' + (g.แถว.length - 6) + ' รายการ สั้นกว่านี้ทั้งหมด');
      const พอดี = g.แถว[0].กว้าง + g.ระยะใน;
      console.log('');
      console.log('   🎯 พอดีเป๊ะ = ' + g.แถว[0].กว้าง + ' + ' + g.ระยะใน + ' = ' + พอดี + ' จุด'
        + '   ·   เผื่อ ' + เผื่อ + ' จุด = ' + (พอดี + เผื่อ) + ' จุด');
      console.log('   ' + (g.ตอนนี้ >= พอดี ? '✅ ตอนนี้พอ' : '🔴 ตอนนี้ไม่พอ ชื่อยาวสุดจะโดนตัด')
        + ' · ต่างจากที่พอดี ' + (g.ตอนนี้ - พอดี) + ' จุด');
    };

    console.log('');
    console.log('วัดจากทุกตัวเลือกที่เลือกได้จริง — ผู้บันทึก ' + ของ.staff.length + ' คน · รพ.สต. ' + ของ.pcu.length + ' แห่ง');
    พิมพ์('ผู้บันทึก', ผล.by, 8);
    พิมพ์('แหล่งที่มา', ผล.src, 8);
    console.log('');
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
