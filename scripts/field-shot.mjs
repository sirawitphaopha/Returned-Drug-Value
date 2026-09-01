// ถ่ายภาพ "สามช่องบังคับ" ฝั่งมือถือ + ปุ่มเลื่อนหน้าสรุป
// 🚨 กฎข้อ 3.65 — แตะหน้าจอเมื่อไหร่ ต้องเปิดภาพดูก่อนรายงานเสมอ
//
// ช่องพวกนี้ซ่อนอยู่หลังการกด (ต้องเลือก รพ.สต. ก่อน ช่อง รพ.สต. ถึงโผล่ ·
// ต้องกดตัวเลือกเพิ่มเติมก่อน วันที่กับ HN ถึงโผล่) mobile-shot ตัวเดิมจึงถ่ายไม่ติด
//
//   node scripts/field-shot.mjs
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
      // 🚨 ต้องรอให้ React ผูกตัวรับค่ากับช่องก่อน ไม่งั้นพิมพ์ลงไปแล้วค่าไม่เข้า state
      //    ปุ่มเข้าใช้งานจะยังปิดอยู่ กดแล้วไม่เกิดอะไร แล้วสคริปต์ค้างที่หน้าล็อกอินเงียบ ๆ
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
    fs.mkdirSync('out', { recursive: true });

    // กดปุ่มจากข้อความที่เห็นบนจอ — เหมือนคนใช้กดจริง
    const tap = async (text) => {
      const done = await page.evaluate((t) => {
        const all = [...document.querySelectorAll('[role="button"], button')];
        const el = all.find((e) => (e.textContent || '').trim() === t);
        if (!el) return false;
        el.click(); return true;
      }, text);
      await wait(700);
      return done;
    };

    const shotAround = async (name, label) => {
      const box = await page.evaluate((t) => {
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) {
          if ((n.textContent || '').trim() !== t) continue;
          let el = n.parentElement;
          for (let i = 0; i < 3 && el; i++) el = el.parentElement;
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.max(0, r.left - 8), y: Math.max(0, r.top - 8), width: Math.min(440, r.width + 16), height: r.height + 16 };
        }
        return null;
      }, label);
      if (!box || box.height < 6) { console.log('  ข้าม ' + name + ' (ไม่เจอ "' + label + '")'); return; }
      await page.screenshot({ path: 'out/f-' + name + '.png', clip: box });
      console.log('  out/f-' + name + '.png   (' + Math.round(box.width) + '×' + Math.round(box.height) + ')');
    };

    console.log('① เลือกแหล่งที่มาเป็น รพ.สต. แล้วดูช่องที่โผล่');
    await tap('รพ.สต.');
    await shotAround('pcu', 'รพ.สต.');

    console.log('② กางตัวเลือกเพิ่มเติม ดูช่องวันที่กับ HN');
    const more = await page.evaluate(() => {
      const all = [...document.querySelectorAll('[role="button"]')];
      const el = all.find((e) => (e.textContent || '').indexOf('2569') >= 0 ||
                                 (e.textContent || '').indexOf('ตัวเลือกเพิ่มเติม') >= 0);
      if (!el) return false;
      el.click(); return true;
    });
    await wait(700);
    if (!more) console.log('  ข้าม (ไม่เจอปุ่มตัวเลือกเพิ่มเติม)');
    await shotAround('datehn', 'HN');

    console.log('③ ครึ่งบนของหน้าบันทึก (สามช่องพร้อมกัน)');
    await page.screenshot({ path: 'out/f-top.png', clip: { x: 0, y: 0, width: 440, height: 420 } });
    console.log('  out/f-top.png');

    console.log('④ หน้าสรุป — ปุ่มขึ้นบนสุด/ลงล่างสุด');
    await tap('สรุป');
    await wait(2500);
    await page.screenshot({ path: 'out/f-sum.png' });
    console.log('  out/f-sum.png');

    const btns = await page.evaluate(() => {
      const all = [...document.querySelectorAll('[aria-label]')];
      return all.filter((e) => (e.getAttribute('aria-label') || '').indexOf('เลื่อน') >= 0)
        .map((e) => { const r = e.getBoundingClientRect();
          return { ป้าย: e.getAttribute('aria-label'), กว้าง: Math.round(r.width), สูง: Math.round(r.height),
                   ขวา: Math.round(window.innerWidth - r.right), ล่าง: Math.round(window.innerHeight - r.bottom) }; });
    });
    console.log('  ปุ่มเลื่อนที่เจอ: ' + JSON.stringify(btns, null, 1));
  } catch (e) {
    console.log('พัง: ' + e.message);
  } finally {
    await browser.close();
  }
})();
