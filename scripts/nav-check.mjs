// ═══════════════════════════════════════════════════════════════════════════
// เดินดูทุกหน้าและทุกหน้าต่างซ้อน — กันการข้ามคำนวณทำให้จอว่าง (กลุ่ม 3 · ก-8)
// ═══════════════════════════════════════════════════════════════════════════
//
// 🚨 ความเสี่ยงของ "คำนวณเฉพาะหน้าที่เปิดอยู่" คือหน้าที่ถูกข้ามแล้วไม่มีใครสังเกต
//    ธงที่หายไปทำให้จอว่างเปล่าโดยไม่มี error ในคอนโซลเลยสักบรรทัด
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
const pass = [], fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

(async () => {
  const show = process.env.SHOW === String.fromCharCode(49);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: show ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(3000);

    const clickText = async (t) => page.evaluate((tx) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === tx || e.textContent.trim().indexOf(tx) === 0);
      if (!el) return false; el.click(); return true;
    }, t);
    const clickLabel = async (t) => page.evaluate((tx) => {
      const el = [...document.querySelectorAll('[aria-label]')].find((e) => e.getAttribute('aria-label') === tx);
      if (!el) return false; el.click(); return true;
    }, t);
    const textOf = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());

    // ── ทุกหน้าหลัก ────────────────────────────────────────────────────────
    log('');
    log('หน้าหลัก');
    const pages = [
      { name: 'บันทึก', click: 'บันทึก', want: 'รายการในครั้งนี้' },
      { name: 'ประวัติ', click: 'ประวัติ', want: 'ประวัติการบันทึก' },
      { name: 'สรุป', click: 'สรุป', want: 'มูลค่ายาที่ประหยัดได้สะสม' },
      { name: 'คลังยา', click: 'คลังยา', want: 'รายการ' }
    ];
    for (const p of pages) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
      await wait(1800);
      await clickText(p.click);
      await wait(3000);
      const t = await textOf();
      check(t.indexOf(p.want) >= 0, 'หน้า' + p.name + ' มีเนื้อหา', t.length + ' ตัวอักษรบนจอ');
    }

    // ── รายการ Lot (เข้าจากหน้าประวัติ) ─────────────────────────────────────
    log('');
    log('หน้ารายการ Lot และหน้าต่างซ้อน');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(1800);
    await clickText('ประวัติ');
    await wait(2200);
    await clickText('รายการ Lot');
    await wait(3000);
    let t = await textOf();
    check(t.indexOf('Lot') >= 0 && t.length > 300, 'หน้ารายการ Lot มีเนื้อหา', t.length + ' ตัวอักษร');

    // ใบสรุป Lot
    await clickText('ใบสรุป');
    await wait(2800);
    t = await textOf();
    check(t.indexOf('ใบสรุปรายการยาคืน') >= 0, 'ใบสรุป Lot เปิดได้');
    await page.keyboard.press('Escape');
    await wait(1200);

    // หน้าต่างแก้ไขล็อต
    await clickText('แก้ไข');
    await wait(2800);
    t = await textOf();
    check(t.indexOf('แก้ไข Lot') >= 0 || t.indexOf('ผู้บันทึก') >= 0, 'หน้าต่างแก้ไขล็อตเปิดได้');
    await page.keyboard.press('Escape');
    await wait(1000);

    // ── หน้าจัดการราคา + นำเข้าจากไฟล์ HIS ─────────────────────────────────
    log('');
    log('หน้าจัดการราคา');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(1800);
    await clickLabel('ตั้งค่า');
    await wait(1500);
    const gotPrices = await clickText('ตั้งราคายา');
    await wait(3000);
    t = await textOf();
    check(gotPrices && /ราคา|บาท|ยา/.test(t), 'หน้าจัดการราคามีเนื้อหา',
      t.length + ' ตัวอักษร · เห็นว่า: ' + t.slice(0, 70));
    const gotHis = await clickText('นำเข้าราคาจากไฟล์');
    await wait(2000);
    if (gotHis) {
      t = await textOf();
      check(t.indexOf('HIS') >= 0 || t.indexOf('ไฟล์') >= 0, 'หน้านำเข้าราคาเปิดได้');
      await page.keyboard.press('Escape');
      await wait(800);
    } else {
      log('  ข้าม  ไม่เจอปุ่มนำเข้าราคา (อาจอยู่คนละที่)');
    }

    // ── สลับไปมาหลายรอบ ────────────────────────────────────────────────────
    log('');
    log('สลับหน้าไปมา 3 รอบ');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(1800);
    for (let i = 0; i < 3; i++) {
      for (const name of ['ประวัติ', 'สรุป', 'คลังยา', 'บันทึก']) {
        await clickText(name);
        await wait(900);
      }
    }
    t = await textOf();
    check(t.indexOf('รายการในครั้งนี้') >= 0, 'กลับมาหน้าบันทึกแล้วยังใช้งานได้');

    check(errs.length === 0, 'ไม่มีข้อผิดพลาดในคอนโซล', errs.length ? errs.slice(0, 2).join(' | ') : '0 ข้อความ');

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
