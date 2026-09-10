// ตัวกรอง 3 ทาง + ปุ่มล้างตัวกรอง + กดชื่อยาแล้วกรอง (พี่กันสั่ง 10 ก.ย. 2569)
//   "เอาปุ่มล้างตัวกรองใส่ก่อน" · "กดที่ชื่อยาแล้วกรองเฉพาะยาตัวนั้น" · "ใส่ด้วย"
//
// 🚨 กดปุ่มจริงทีละขั้นเหมือนคนใช้ ไม่ใช่ setState แล้วอ่านค่า (บทเรียนข้อ 3.66)
// 🚨 ดักคำขอที่ยิงออกไปด้วย เพื่อพิสูจน์ว่ากรองที่ฐานจริง ไม่ใช่กรองแถวที่โหลดมาแล้ว
// 🚨 ฝั่งเดสก์ท็อปเท่านั้น — พี่กันย้ำว่ามือถือห้ามแตะ
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

const อ่าน = (page) => page.evaluate(() => {
  const sels = [...document.querySelectorAll('select[aria-label]')]
    .filter((s) => (s.getAttribute('aria-label') || '').indexOf('กรองตาม') === 0);
  const ปุ่ม = [...document.querySelectorAll('[role="button"]')];
  const แถว = [...document.querySelectorAll('table tbody tr')];
  const ช่องค้น = document.querySelector('input[aria-label="ค้นหาในประวัติ"]');
  const ช่องข้อความ = [...document.querySelectorAll('span')];
  return {
    จำนวนช่องเลือก: sels.length,
    ตัวเลือกแรก: sels.map((s) => (s.options[0] ? s.options[0].textContent.trim() : '')),
    จำนวนตัวเลือก: sels.map((s) => s.options.length),
    ค่าที่เลือก: sels.map((s) => s.value),
    มีปุ่มล้าง: ปุ่ม.some((b) => (b.innerText || '').trim() === 'ล้างตัวกรอง'),
    จำนวนแถว: แถว.length,
    สถานะในตาราง: [...new Set(แถว.map((tr) => {
      const td = tr.children[5];
      return td ? (td.innerText || '').trim() : '';
    }))].filter(Boolean),
    ยอดรายการ: (() => {
      const el = ช่องข้อความ.find((x) => / รายการ$/.test((x.textContent || '').trim()));
      return el ? el.textContent.trim() : '';
    })(),
    คำค้น: ช่องค้น ? ช่องค้น.value : null,
    ชื่อยาแถวแรก: (แถว[0] && แถว[0].children[1]) ? (แถว[0].children[1].innerText || '').trim() : ''
  };
});


// รอจนตารางมีแถวจริง แล้วรอให้ยอดนิ่ง (สองรอบติดกันได้ค่าเท่ากัน)
const รอตาราง = async (page, วิ) => {
  const หมดเวลา = Date.now() + (วิ || 25) * 1000;
  let ก่อนหน้า = null;
  while (Date.now() < หมดเวลา) {
    const now = await page.evaluate(() => {
      const n = document.querySelectorAll('table tbody tr').length;
      const el = [...document.querySelectorAll('span')].find((x) => / รายการ$/.test((x.textContent || '').trim()));
      return n + '|' + (el ? el.textContent.trim() : '');
    });
    if (now.indexOf('0|') !== 0 && now === ก่อนหน้า) return true;
    ก่อนหน้า = now;
    await wait(500);
  }
  return false;
};

const กดปุ่มชื่อ = (page, คำ) => page.evaluate((n) => {
  const b = [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').trim() === n);
  if (!b) return false;
  b.click(); return true;
}, คำ);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const ยิงไป = [];
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
    page.on('request', (r) => { if (r.url().indexOf('/api/returns?') >= 0) ยิงไป.push(r.url()); });

    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await wait(4200);
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
        .find((b) => (b.innerText || '').trim().indexOf('ประวัติ') === 0).click();
    });
    await รอตาราง(page);

    const เลือก = async (i, value) => {
      await page.evaluate((idx, v) => {
        const sels = [...document.querySelectorAll('select[aria-label]')]
          .filter((s) => (s.getAttribute('aria-label') || '').indexOf('กรองตาม') === 0);
        const s = sels[idx];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        setter.call(s, v);
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }, i, value);
      await wait(700);
      await รอตาราง(page);
    };

    console.log('');
    console.log('① ช่องเลือกครบ 3 ช่อง ค่าตั้งต้นคือไม่กรอง');
    let r = await อ่าน(page);
    if (!r.จำนวนแถว) { console.error('🔴 ตารางว่าง — เทสต่อไม่ได้'); process.exit(1); }
    เช็ค('มีช่องเลือก 3 ช่อง', r.จำนวนช่องเลือก, 3);
    เช็ค('เรียงตามที่พี่กันส่งภาพมา', r.ตัวเลือกแรก, ['ทุกสถานะ', 'ทุกแหล่งที่มา', 'ทุกคนบันทึก']);
    เช็ค('ค่าตั้งต้นทุกช่องคือไม่กรอง', r.ค่าที่เลือก, ['', '', '']);
    เช็ค('ยังไม่มีปุ่มล้างตัวกรอง เพราะยังไม่ได้กรองอะไร', r.มีปุ่มล้าง, false);
    เช็ค('ช่องผู้บันทึกมีชื่อคนให้เลือกจริง', r.จำนวนตัวเลือก[2] > 1, true);
    const แถวเดิม = r.จำนวนแถว;
    const ยอดเดิม = r.ยอดรายการ;
    console.log('     ตอนนี้ ' + ยอดเดิม + ' · แสดง ' + แถวเดิม + ' แถว · สถานะที่เห็น ' + JSON.stringify(r.สถานะในตาราง));

    console.log('');
    console.log('② เลือกสถานะ ทำลาย — ต้องกรองที่ฐาน และเหลือแต่แถวทำลาย');
    ยิงไป.length = 0;
    await เลือก(0, 'destroy');
    r = await อ่าน(page);
    เช็ค('ยิงคำขอใหม่ไปที่เซิร์ฟเวอร์', ยิงไป.length > 0, true);
    เช็ค('ส่ง disp=destroy ไปด้วย', ยิงไป.some((u) => u.indexOf('disp=destroy') >= 0), true);
    เช็ค('ตารางเหลือแต่แถวทำลาย', r.สถานะในตาราง, ['ทำลาย']);
    เช็ค('ปุ่มล้างตัวกรองโผล่แล้ว', r.มีปุ่มล้าง, true);
    เช็ค('ช่องที่กรองอยู่ยังจำค่าไว้', r.ค่าที่เลือก[0], 'destroy');
    console.log('     กรองแล้วเหลือ ' + r.ยอดรายการ + ' · แสดง ' + r.จำนวนแถว + ' แถว');
    เช็ค('ยอดรวมนับจากผลที่กรองแล้ว ไม่ใช่ยอดเดิม', r.ยอดรายการ !== ยอดเดิม, true);

    console.log('');
    console.log('③ กรองซ้อนด้วยแหล่งที่มา — เงื่อนไขต้องอยู่ครบทั้งสองอัน');
    ยิงไป.length = 0;
    await เลือก(1, 'opd');
    r = await อ่าน(page);
    เช็ค('ส่งทั้ง disp และ src ไปพร้อมกัน',
      ยิงไป.some((u) => u.indexOf('disp=destroy') >= 0 && u.indexOf('src=opd') >= 0), true);
    เช็ค('ช่องแรกยังกรองอยู่', r.ค่าที่เลือก[0], 'destroy');
    เช็ค('ช่องที่สองกรองแล้ว', r.ค่าที่เลือก[1], 'opd');

    console.log('');
    console.log('④ กดล้างตัวกรอง — ทุกช่องต้องกลับเป็นไม่กรอง');
    await กดปุ่มชื่อ(page, 'ล้างตัวกรอง');
    await wait(700);
    await รอตาราง(page);
    r = await อ่าน(page);
    เช็ค('ทุกช่องกลับเป็นไม่กรอง', r.ค่าที่เลือก, ['', '', '']);
    เช็ค('ปุ่มล้างหายไปแล้ว', r.มีปุ่มล้าง, false);
    เช็ค('รายการกลับมาเท่าเดิม', r.ยอดรายการ, ยอดเดิม);
    เช็ค('ช่องค้นหาถูกล้างด้วย', r.คำค้น, '');

    console.log('');
    console.log('⑤ กดชื่อยาในตาราง — ต้องกรองเฉพาะยาตัวนั้น และเห็นคำในช่องค้นหา');
    const ชื่อที่กด = await page.evaluate(() => {
      const tr = document.querySelector('table tbody tr');
      const sp = tr.children[1].querySelector('.hv-drug');
      if (!sp) return null;
      const ชื่อ = (sp.innerText || '').trim();
      sp.click();
      return ชื่อ;
    });
    await wait(700);
    await รอตาราง(page);
    เช็ค('ชื่อยากดได้จริง มีตัวห่อ hv-drug', !!ชื่อที่กด, true);
    r = await อ่าน(page);
    console.log('     กดชื่อ ' + JSON.stringify(ชื่อที่กด) + ' แล้วเหลือ ' + r.ยอดรายการ);
    เช็ค('คำที่กรองโผล่ในช่องค้นหาให้เห็น', !!r.คำค้น, true);
    const ยาตัวเดียว = await page.evaluate(() => {
      const ชื่อ = [...document.querySelectorAll('table tbody tr')]
        .map((tr) => (tr.children[1].innerText || '').trim());
      return ชื่อ.length > 0 && new Set(ชื่อ).size === 1;
    });
    เช็ค('ทุกแถวเป็นยาตัวเดียวกับที่กด', ยาตัวเดียว, true);
    เช็ค('ปุ่มล้างตัวกรองโผล่ เพราะมีคำค้นอยู่', r.มีปุ่มล้าง, true);

    console.log('');
    console.log('⑥ ในถังขยะตัวกรองยังใช้ได้ และปุ่มล้างไม่พาออกจากถังขยะ');
    await กดปุ่มชื่อ(page, 'ล้างตัวกรอง');
    await wait(700);
    await รอตาราง(page);
    const เปิดตั้งค่า = await page.evaluate(() => {
      const b = document.querySelector('[aria-label="ตั้งค่า"]');
      if (!b) return false;
      b.click(); return true;
    });
    await wait(1800);
    if (เปิดตั้งค่า) {
      await กดปุ่มชื่อ(page, 'เปิดถังขยะ');
      await wait(2200);
      r = await อ่าน(page);
      เช็ค('ในถังขยะยังมีช่องเลือกครบ 3 ช่อง', r.จำนวนช่องเลือก, 3);
      await เลือก(0, 'reuse');
      await กดปุ่มชื่อ(page, 'ล้างตัวกรอง');
      await wait(2800);
      const ยังอยู่ = await page.evaluate(() =>
        [...document.querySelectorAll('[role="heading"]')].some((h) => (h.innerText || '').indexOf('ถังขยะ') >= 0));
      เช็ค('กดล้างตัวกรองแล้วยังอยู่ในถังขยะ', ยังอยู่, true);
    } else {
      console.log('  ⚠️ เปิดหน้าตั้งค่าไม่ได้ ข้ามข้อนี้');
    }

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
