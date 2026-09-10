// ปุ่มขึ้นบนสุด / ลงล่างสุด — ปุ่มไหนโผล่ตอนไหน (พี่กันเคาะแบบ ค · 10 ก.ย. 2569)
//
//   "ปุ่มทั้งสองปุ่มจะไม่แสดงเสมอนะ
//    ถ้าบนสุด จะแสดงปุ่มลงสุด แต่ถ้าระหว่างตอนที่เลื่อน จะแสดงสองปุ่ม
//    และถ้าลงสุดจะแสดงแค่ปุ่มบนสุดเท่านั้น"
//   "เอาระบบนี้ไปใช้กับเว็บเดสก์ท็อปด้วย แต่ถ้าเอาเมาส์ไปชี้ มันจะเปลี่ยนเป็นสีเข้ม"
//
// 🚨 วัดค่าที่เบราว์เซอร์คำนวณจริง ไม่ใช่อ่านจากโค้ด
//    ใช้: node scripts/jump-check.mjs        (มือถือ 440×956 + คอม 1600×900)
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

async function เปิดหน้า(browser, w, h, มือถือ) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: มือถือ, hasTouch: มือถือ });
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(900);
  if (page.url().indexOf('/login') >= 0) {
    await page.type('#mrv-pw', pw);
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.click('button[type="submit"]')]);
  }
  // 🚨 ชื่อเครื่องต้องเป็นเครื่องทดสอบ ห้ามใช้ชื่อ 8 เครื่องจริง (ข้อ 3.64)
  await page.evaluate((กว้าง) => {
    try {
      localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ'));
      // ล้างธงมุมมองมือถือที่อาจค้างจากการเทสรอบก่อน
      const s = JSON.parse(localStorage.getItem('mrv.session') || '{}');
      if (s && s.forceNarrow) { delete s.forceNarrow; localStorage.setItem('mrv.session', JSON.stringify(s)); }
    } catch (e) {}
  }, w);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await wait(3800);
  return page;
}

// อ่านสภาพปุ่มทั้งสองจากค่าที่เบราว์เซอร์คำนวณจริง
const อ่านปุ่ม = (page) => page.evaluate(() => {
  const หา = (ป้าย) => document.querySelector('[aria-label="' + ป้าย + '"].jump-btn');
  const เก็บ = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    return { จาง: Math.round(Number(c.opacity) * 100) / 100, กดได้: c.pointerEvents !== 'none', พื้น: c.backgroundColor };
  };
  const sc = document.querySelector('[role="main"]');
  return {
    ขึ้น: เก็บ(หา('เลื่อนขึ้นบนสุด')),
    ลง: เก็บ(หา('เลื่อนลงล่างสุด')),
    เลื่อนไปแล้ว: sc ? Math.round(sc.scrollTop) : -1
  };
});

const เลื่อนไป = async (page, y) => {
  await page.evaluate((t) => {
    const sc = document.querySelector('[role="main"]');
    if (sc) sc.scrollTop = t === 'ล่างสุด' ? sc.scrollHeight : t;
  }, y);
  await wait(600);
};

const ไปหน้า = async (page, ชื่อ) => {
  const ได้ = await page.evaluate((n) => {
    const ปุ่ม = [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
      .filter((b) => (b.innerText || '').trim().indexOf(n) === 0);
    if (!ปุ่ม.length) return false;
    ปุ่ม[0].click(); return true;
  }, ชื่อ);
  await wait(2600);
  return ได้;
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    // ══ ฝั่งมือถือ ══════════════════════════════════════════════════════════
    console.log('');
    console.log('══ ฝั่งมือถือ 440×956 · หน้าประวัติ ══');
    const m = await เปิดหน้า(browser, 440, 956, true);
    if (!(await ไปหน้า(m, 'ประวัติ'))) { console.error('🔴 กดแท็บประวัติไม่ติด'); process.exit(1); }

    await เลื่อนไป(m, 0);
    let r = await อ่านปุ่ม(m);
    if (!r.ลง) { console.error('🔴 หาปุ่มไม่เจอ — หยุดก่อน อย่าเชื่อผลที่ออกมา'); process.exit(1); }
    console.log('');
    console.log('① อยู่บนสุด → ต้องเห็นแค่ปุ่มลงล่างสุด');
    เช็ค('ปุ่มขึ้นบนสุดหายไป', r.ขึ้น.จาง, 0);
    เช็ค('ปุ่มขึ้นบนสุดกดไม่ได้', r.ขึ้น.กดได้, false);
    เช็ค('ปุ่มลงล่างสุดโผล่', r.ลง.จาง > 0, true);
    เช็ค('ปุ่มลงล่างสุดกดได้', r.ลง.กดได้, true);

    console.log('');
    console.log('② เลื่อนอยู่ระหว่างทาง → ต้องเห็นทั้งสองปุ่ม');
    await เลื่อนไป(m, 600);
    r = await อ่านปุ่ม(m);
    เช็ค('ปุ่มขึ้นบนสุดโผล่', r.ขึ้น.จาง, 1);
    เช็ค('ปุ่มลงล่างสุดโผล่', r.ลง.จาง, 1);
    เช็ค('กดได้ทั้งคู่', [r.ขึ้น.กดได้, r.ลง.กดได้], [true, true]);

    console.log('');
    console.log('③ หยุดอ่านเกิน 1.5 วินาที → ปุ่มจางลง ไม่บังเนื้อหา');
    await wait(1900);
    r = await อ่านปุ่ม(m);
    เช็ค('ปุ่มขึ้นบนสุดจางลง', r.ขึ้น.จาง, 0.3);
    เช็ค('ปุ่มลงล่างสุดจางลง', r.ลง.จาง, 0.3);
    เช็ค('จางแล้วยังกดได้อยู่', [r.ขึ้น.กดได้, r.ลง.กดได้], [true, true]);

    console.log('');
    console.log('④ อยู่ล่างสุด → ต้องเห็นแค่ปุ่มขึ้นบนสุด');
    await เลื่อนไป(m, 'ล่างสุด');
    r = await อ่านปุ่ม(m);
    เช็ค('ปุ่มขึ้นบนสุดโผล่', r.ขึ้น.จาง > 0, true);
    เช็ค('ปุ่มลงล่างสุดหายไป', r.ลง.จาง, 0);
    เช็ค('ปุ่มลงล่างสุดกดไม่ได้', r.ลง.กดได้, false);

    console.log('');
    console.log('⑤ กดปุ่มขึ้นบนสุดจริง → ต้องกลับไปบนสุด');
    await m.evaluate(() => document.querySelector('[aria-label="เลื่อนขึ้นบนสุด"].jump-btn').click());
    await wait(2600);   // เลื่อนแบบลื่นจากล่างสุดของหน้ายาว ใช้เวลาหลายวินาที
    r = await อ่านปุ่ม(m);
    เช็ค('กลับมาอยู่บนสุดแล้ว', r.เลื่อนไปแล้ว, 0);

    console.log('');
    console.log('⑥ หน้ากรอก (บันทึก) → ห้ามมีปุ่มลอยเลย (พี่กันสั่งตรง ๆ)');
    await ไปหน้า(m, 'บันทึก');
    r = await อ่านปุ่ม(m);
    เช็ค('ไม่มีปุ่มขึ้นบนสุด', r.ขึ้น, null);
    เช็ค('ไม่มีปุ่มลงล่างสุด', r.ลง, null);
    await m.close();

    // ══ ฝั่งคอม ═════════════════════════════════════════════════════════════
    console.log('');
    console.log('══ ฝั่งคอม 1600×900 · หน้าประวัติ ══');
    const d = await เปิดหน้า(browser, 1600, 900, false);
    if (!(await ไปหน้า(d, 'ประวัติ'))) { console.error('🔴 กดแท็บประวัติไม่ติด'); process.exit(1); }

    await เลื่อนไป(d, 0);
    r = await อ่านปุ่ม(d);
    if (!r.ลง) { console.error('🔴 ฝั่งคอมหาปุ่มไม่เจอ — พี่กันสั่งให้ใช้ที่เดสก์ท็อปด้วย'); process.exit(1); }
    console.log('');
    console.log('⑦ ฝั่งคอมใช้ตรรกะชุดเดียวกัน');
    เช็ค('บนสุด — ปุ่มขึ้นหายไป', r.ขึ้น.จาง, 0);
    เช็ค('บนสุด — ปุ่มลงโผล่', r.ลง.จาง > 0, true);
    await เลื่อนไป(d, 500);
    r = await อ่านปุ่ม(d);
    เช็ค('ระหว่างทาง — โผล่ทั้งคู่', [r.ขึ้น.จาง, r.ลง.จาง], [1, 1]);

    console.log('');
    console.log('⑧ ฝั่งคอม เอาเมาส์ชี้ → พื้นเข้มขึ้นและกลับมาชัดเต็มตา');
    await เลื่อนไป(d, 500);
    await wait(1900);                                   // ปล่อยให้จางก่อน
    const ก่อนชี้ = await อ่านปุ่ม(d);
    await d.hover('[aria-label="เลื่อนขึ้นบนสุด"].jump-btn');
    await wait(500);
    const หลังชี้ = await อ่านปุ่ม(d);
    เช็ค('ก่อนชี้จางอยู่', ก่อนชี้.ขึ้น.จาง, 0.3);
    เช็ค('ชี้แล้วชัดเต็มตา', หลังชี้.ขึ้น.จาง, 1);
    เช็ค('ชี้แล้วพื้นเข้มขึ้น', หลังชี้.ขึ้น.พื้น, 'rgb(36, 97, 74)');
    เช็ค('ตอนไม่ชี้เป็นเขียวปกติ', ก่อนชี้.ขึ้น.พื้น, 'rgb(47, 125, 93)');

    console.log('');
    console.log('⑨ ฝั่งคอม หน้าสรุป → ต้องมีปุ่มชุดเดียวกัน');
    await ไปหน้า(d, 'สรุป');
    await เลื่อนไป(d, 400);
    r = await อ่านปุ่ม(d);
    เช็ค('หน้าสรุปมีปุ่มด้วย', !!r.ขึ้น && !!r.ลง, true);
    await d.close();

    console.log('');
    console.log('⑩ หน้ารายการ Lot → ต้องมีปุ่มชุดเดียวกัน (พี่กันสั่งเพิ่ม 10 ก.ย. 2569)');
    const lp = await เปิดหน้า(browser, 440, 956, true);
    await ไปหน้า(lp, 'ประวัติ');
    await lp.evaluate(() => {
      const b = document.querySelector('[aria-label="ดูเป็นรายการ Lot"]');
      if (b) b.click();
    });
    await wait(2800);
    await เลื่อนไป(lp, 0);
    r = await อ่านปุ่ม(lp);
    เช็ค('หน้ารายการ Lot มีปุ่มด้วย', !!r.ลง, true);
    if (r.ลง) {
      เช็ค('บนสุด — ปุ่มขึ้นหายไป', r.ขึ้น.จาง, 0);
      เช็ค('บนสุด — ปุ่มลงโผล่', r.ลง.จาง > 0, true);
    }
    await lp.close();

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
