// ═══════════════════════════════════════════════════════════════════════════
// ตรวจระบบเก็บของในแท็บ + อัปเดตสดข้ามเครื่อง (กลุ่ม 3 · ก-1 · ก-8)
// ═══════════════════════════════════════════════════════════════════════════
//
// พิสูจน์ 4 อย่างในเว็บจริง ไม่ใช่หน้าจำลอง
//   ① เข้าหน้าประวัติแล้วรีเฟรช → ต้องไม่ยิงขอประวัติซ้ำ และตารางต้องมีแถวทันที
//   ② สลับแท็บไปกลับ → ต้องไม่ยิงซ้ำ
//   ③ คลังยาโหลดครั้งเดียว รีเฟรชแล้วยังอยู่
//   ④ แก้ข้อมูลจากอีกทาง → ภายใน 20 วินาทีหน้าจอต้องอัปเดตเอง
//
//   node scripts/cache-check.mjs
//   SHOW=1 node scripts/cache-check.mjs      เปิดหน้าต่างให้เห็นด้วยตา
import fs from 'fs';
import puppeteer from 'puppeteer-core';

// พอร์ตอ่านจากตัวแปรแวดล้อม PORT ถ้าไม่ตั้งใช้ 3000
// (พี่กันตั้งกฎ 5 ก.ย. 2569 ว่าพอร์ตอาจไม่ว่าง ต้องเปิดพอร์ตอื่นได้)
// ใช้: PORT=3002 node scripts/xxx.mjs
const BASE = 'http://127.0.0.1:' + (process.env.PORT || '3000');
const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome'
];
const findChrome = () => {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  throw new Error('หา Chrome ในเครื่องไม่เจอ');
};
const readPassword = () => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
  return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);
const pass = [];
const fail = [];
const check = (ok, label, note) => {
  (ok ? pass : fail).push(label + (note ? ' — ' + note : ''));
  log((ok ? '  ผ่าน  ' : '  ตก    ') + label + (note ? ' — ' + note : ''));
};

(async () => {
  const show = process.env.SHOW === String.fromCharCode(49);
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: show ? false : 'new',
    args: ['--no-sandbox', '--window-size=1400,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const hits = [];
    page.on('request', (r) => {
      const u = r.url();
      if (u.indexOf('/api/') >= 0) hits.push(u.replace(BASE, ''));
    });
    const countOf = (frag) => hits.filter((u) => u.indexOf(frag) >= 0).length;
    const reset = () => { hits.length = 0; };

    // ── เข้าสู่ระบบ ───────────────────────────────────────────────────────
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', readPassword());
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);
    }

    const clickText = async (text) => page.evaluate((t) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === t || e.textContent.trim().indexOf(t) === 0);
      if (!el) return false;
      el.click();
      return true;
    }, text);

    const rowCount = () => page.evaluate(() =>
      document.body.innerText.indexOf('ไม่พบรายการ') >= 0 ? 0 : (document.body.innerText.match(/฿/g) || []).length);

    // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(3000);

    // ── ① หน้าประวัติ ────────────────────────────────────────────────────
    log('');
    log('① หน้าประวัติ — โหลดครั้งเดียวแล้วรีเฟรชต้องไม่โหลดซ้ำ');
    reset();
    await clickText('ประวัติ');
    await wait(3000);
    const first = countOf('/api/returns');
    const rows1 = await rowCount();
    check(first >= 1, 'เข้าครั้งแรกยิงขอประวัติจริง', first + ' ครั้ง');
    check(rows1 > 0, 'ตารางมีแถว', rows1 + ' จุดที่มีเครื่องหมายบาท');

    // 🚨 รีเฟรชแล้วเว็บเด้งกลับหน้าบันทึกเสมอ (เดิมเป็นแบบนี้อยู่แล้ว ไม่ได้แก้)
    //    ต้องกดเข้าหน้าประวัติใหม่ก่อนวัด ไม่งั้นได้ผล "ไม่ยิงซ้ำ" แบบหลอกตัวเอง
    //    เพราะไม่ได้อยู่หน้าประวัติตั้งแต่แรก
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(3000);
    reset();
    await clickText('ประวัติ');
    await wait(3000);
    const after = countOf('/api/returns');
    const rows2 = await rowCount();
    const isHist = await page.evaluate(() => document.body.innerText.indexOf('ประวัติการบันทึก') >= 0);
    check(isHist, 'กลับเข้าหน้าประวัติได้จริงหลังรีเฟรช');
    check(after === 0, 'เข้าหน้าประวัติหลังรีเฟรชแล้วไม่ยิงขอซ้ำ', after + ' ครั้ง');
    check(rows2 >= rows1, 'ตารางมีแถวครบเท่าเดิมทันที', rows1 + ' → ' + rows2 + ' จุด');

    // ── ② สลับแท็บไปกลับ ────────────────────────────────────────────────
    log('');
    log('② สลับแท็บไปกลับ');
    reset();
    await clickText('สรุป');
    await wait(2500);
    const sum1 = countOf('/api/summary');
    await clickText('ประวัติ');
    await wait(1500);
    await clickText('สรุป');
    await wait(2000);
    const sum2 = countOf('/api/summary');
    check(sum2 === sum1, 'กลับมาหน้าสรุปอีกรอบไม่ยิงซ้ำ', sum1 + ' → ' + sum2 + ' ครั้ง');

    // ── ③ คลังยา ────────────────────────────────────────────────────────
    log('');
    log('③ คลังยา 417 ตัว');
    reset();
    await clickText('คลังยา');
    await wait(3500);
    const cat1 = countOf('/api/catalog');
    check(cat1 >= 1, 'เข้าครั้งแรกโหลดคลังยาจริง', cat1 + ' ครั้ง');
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(3000);
    reset();
    await clickText('คลังยา');
    await wait(3000);
    const cat2 = countOf('/api/catalog');
    const catRows = await page.evaluate(() => (document.body.innerText.match(/mg|ml/gi) || []).length);
    check(cat2 === 0, 'เข้าคลังยาหลังรีเฟรชแล้วไม่โหลดซ้ำ', cat2 + ' ครั้ง');
    check(catRows > 20, 'ตารางคลังยามีข้อมูลทันที', catRows + ' จุดที่มีหน่วยความแรง');

    // ── ④ อัปเดตสดข้ามเครื่อง ───────────────────────────────────────────
    log('');
    log('④ อัปเดตสดข้ามเครื่อง — จำลองว่าอีกเครื่องแก้ข้อมูล');
    // 🚨 หน้าคลังยาเต็มจอ ปุ่มแท็บถูกบัง กดจากตรงนั้นไม่ได้ ต้องกลับหน้าแรกก่อน
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);
    await clickText('ประวัติ');
    await wait(2500);
    const atHist = await page.evaluate(() => document.body.innerText.indexOf('ประวัติการบันทึก') >= 0);
    check(atHist, 'อยู่หน้าประวัติก่อนเริ่มทดสอบ');
    reset();

    // แก้ข้อมูลจาก "อีกทาง" จริง ๆ — เปิดแท็บที่สองแล้วยิงเข้า API เหมือนอีกเครื่องทำ
    // 🚨 ส่งจำนวนเดิมกลับไป ข้อมูลจึงไม่เปลี่ยนแม้แต่ช่องเดียว
    //    สิ่งเดียวที่ขยับคือร่องรอยเวลาที่แถวถูกแตะ ซึ่งคือสิ่งที่ลายเซ็นใช้
    const other = await browser.newPage();
    await other.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const edited = await other.evaluate(async () => {
      const list = await (await fetch('/api/returns?range=fy')).json();
      const row = (list.rows || [])[0];
      if (!row) return null;
      const r = await fetch('/api/returns/' + row.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qty: row.qty })
      });
      return r.ok ? row.id : null;
    });
    await other.close();
    // 🚨 ตัวจับเวลาถามลายเซ็นข้ามแท็บที่ซ่อนอยู่โดยตั้งใจ (ประหยัดคำขอ)
    //    ตอนทดสอบจึงต้องดันแท็บที่วัดขึ้นมาข้างหน้าก่อน ไม่งั้นวัดของที่ถูกปิดไว้เอง
    await page.bringToFront();
    const vis = await page.evaluate(() => document.visibilityState);
    log('   สถานะแท็บที่วัด: ' + vis);

    if (!edited) {
      check(false, 'จำลองการแก้จากอีกเครื่องไม่สำเร็จ');
    } else {
      log('   อีกเครื่องแก้รายการ id ' + edited + ' แล้ว');
      log('   รอตัวจับเวลาถามลายเซ็น (สูงสุด 25 วินาที)');
      let seen = 0;
      let toastSeen = false;
      for (let i = 0; i < 25; i++) {
        await wait(1000);
        // ข้อความเด้งหายเองใน 2-3 วินาที ต้องคอยดูทุกวินาที ไม่ใช่ตรวจทีเดียวตอนจบ
        if (!toastSeen) {
          toastSeen = await page.evaluate(() => document.body.innerText.indexOf('มีข้อมูลใหม่จากเครื่องอื่น') >= 0);
        }
        if (countOf('/api/rev') > 0 && countOf('/api/returns') > 0) { seen = i + 1; break; }
      }
      // เผื่อข้อความมาช้ากว่าคำขอนิดหน่อย
      if (!toastSeen) {
        await wait(700);
        toastSeen = await page.evaluate(() => document.body.innerText.indexOf('มีข้อมูลใหม่จากเครื่องอื่น') >= 0);
      }
      log('   คำขอที่เกิดขึ้นระหว่างรอ: ' + (hits.length ? hits.join(' · ') : 'ไม่มีเลย'));
      const onScreen = await page.evaluate(() => document.body.innerText.slice(0, 60).replace(/s+/g, ' '));
      log('   หน้าที่เปิดอยู่ขึ้นต้นว่า: ' + onScreen);
      check(countOf('/api/rev') > 0, 'ตัวจับเวลาถามลายเซ็นทำงาน', countOf('/api/rev') + ' ครั้ง');
      check(seen > 0, 'ถามลายเซ็นแล้วดึงประวัติชุดใหม่เอง', seen ? 'ภายใน ' + seen + ' วินาที' : 'ไม่เกิดขึ้นใน 25 วินาที');
      check(toastSeen, 'ขึ้นข้อความบอกผู้ใช้ว่ามีข้อมูลใหม่');
    }

    // ── ⑤ ทำเองแล้วต้องไม่ขึ้นข้อความว่ามาจากเครื่องอื่น ────────────────────
    log('');
    log('⑤ เราเป็นคนแก้เอง — ห้ามขึ้นข้อความว่ามาจากเครื่องอื่น');
    await wait(3000);
    reset();

    const own = await page.evaluate(async () => {
      // หาตัวแอปผ่านโครงภายในของ React (ไม่แตะโค้ดจริงเพื่อการเทส)
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null;
      let app = null;
      while (f) {
        if (f.stateNode && typeof f.stateNode.pulse === 'function') { app = f.stateNode; break; }
        f = f.return;
      }
      if (!app) return 'ไม่เจอตัวแอป';

      // เส้นทางเดียวกับตอนกดบันทึก/แก้/ลบ: แก้ข้อมูลแล้วเรียก invalidate()
      const list = await (await fetch('/api/returns?range=fy')).json();
      const row = (list.rows || [])[0];
      if (!row) return 'ไม่มีรายการให้แก้';
      await fetch('/api/returns/' + row.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qty: row.qty })
      });
      app.invalidate();
      return 'ok';
    });

    if (own !== 'ok') {
      check(false, 'จำลองการแก้ด้วยตัวเองไม่สำเร็จ', own);
    } else {
      log('   รอ 30 วินาที เผื่อให้ตัวจับเวลาถามลายเซ็นครบรอบ');
      let wrongToast = false;
      for (let i = 0; i < 30; i++) {
        await wait(1000);
        if (!wrongToast) {
          wrongToast = await page.evaluate(() =>
            document.body.innerText.indexOf('มีข้อมูลใหม่จากเครื่องอื่น') >= 0);
        }
      }
      check(!wrongToast, 'ไม่ขึ้นข้อความ "มีข้อมูลใหม่จากเครื่องอื่น" ตอนเราแก้เอง');
      check(countOf('/api/rev') > 0, 'ตัวจับเวลายังทำงานตามปกติ', countOf('/api/rev') + ' ครั้ง');
      const stillRows = await rowCount();
      check(stillRows > 0, 'ตารางยังมีข้อมูลครบ', stillRows + ' จุด');
    }

    // ── ⑥ โหมดดูตัวอย่างห้ามทิ้งของปลอมไว้ในที่เก็บของแท็บ ─────────────────
    // (ผลตรวจข้อ ว-1 ระดับวิกฤตเคยเกิดจากเรื่องทำนองนี้มาแล้ว)
    log('');
    log('⑥ โหมดดูตัวอย่างต้องไม่ปนกับของจริง');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2500);
    const keysBefore = await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.indexOf('mrv.s.') === 0).length);

    const opened = await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null;
      while (f) {
        if (f.stateNode && typeof f.stateNode.enterDemo === 'function') { f.stateNode.enterDemo(); return true; }
        f = f.return;
      }
      return false;
    });
    await wait(4000);

    if (!opened) {
      check(false, 'เปิดโหมดดูตัวอย่างไม่สำเร็จ');
    } else {
      const inDemo = await page.evaluate(() => document.body.innerText.indexOf('โหมดดูตัวอย่าง') >= 0);
      check(inDemo, 'เข้าโหมดดูตัวอย่างแล้วจริง');
      // เดินดูหน้าที่มีตาราง เพื่อให้ตัวโหลดทุกตัวได้ทำงาน
      await clickText('ประวัติ');
      await wait(2000);
      await clickText('สรุป');
      await wait(2000);
      const keysAfter = await page.evaluate(() =>
        Object.keys(sessionStorage).filter((k) => k.indexOf('mrv.s.') === 0));
      check(keysAfter.length === 0,
        'ไม่มีข้อมูลตัวอย่างค้างในที่เก็บของแท็บ',
        'ก่อนเข้าโหมดมี ' + keysBefore + ' ก้อน · ระหว่างอยู่ในโหมดมี ' + keysAfter.length + ' ก้อน');
    }

    // ── ⑦ การตั้งค่าที่แก้จากเครื่องอื่น ต้องตามมาเอง ──────────────────────
    log('');
    log('⑦ การตั้งค่าที่เครื่องอื่นแก้ ต้องตามมาเอง');
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(3000);
    reset();

    const other2 = await browser.newPage();
    await other2.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    // ส่งชื่อห้องยาเดิมกลับไป — ไม่มีอะไรเปลี่ยน มีแค่เวลาที่แก้ล่าสุดขยับ
    const setOk = await other2.evaluate(async () => {
      const g = await (await fetch('/api/settings')).json();
      if (!g.setting) return false;
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orgName: g.setting.orgName })
      });
      return r.ok;
    });
    await other2.close();
    await page.bringToFront();

    if (!setOk) {
      check(false, 'จำลองการแก้การตั้งค่าจากอีกเครื่องไม่สำเร็จ');
    } else {
      let got = 0;
      for (let i = 0; i < 25; i++) {
        await wait(1000);
        if (countOf('/api/settings') > 0) { got = i + 1; break; }
      }
      check(got > 0, 'ดึงการตั้งค่าชุดใหม่มาเอง', got ? 'ภายใน ' + got + ' วินาที' : 'ไม่เกิดขึ้นใน 25 วินาที');
      const recorderEmpty = await page.evaluate(() => {
        const el = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').indexOf('ผู้บันทึก') >= 0);
        return el ? el.value === '' : true;
      });
      check(recorderEmpty, 'ช่องผู้บันทึกยังว่าง ไม่ถูกเติมให้เอง');
    }

    log('');
    log('═══ สรุป ═══');
    log('ผ่าน ' + pass.length + ' ข้อ · ตก ' + fail.length + ' ข้อ');
    if (fail.length) fail.forEach((f) => log('  ตก: ' + f));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
