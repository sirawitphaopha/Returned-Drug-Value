// วัดว่าเลื่อนตารางแล้วกระตุกไหม (พี่กันแจ้ง 10 ก.ย. 2569 "พอเราเลื่อนตาราง ตอนนี้มันกระตุกอยู่นะ")
//
// 🚨 วัดเวลาที่เบราว์เซอร์ใช้วาดจริงแต่ละเฟรม ไม่ใช่ความรู้สึก
//    เฟรมที่เกิน 16.7 มิลลิวินาที = หลุด 60 เฟรมต่อวินาที = ตาเห็นเป็นกระตุก
//
//   ใช้: node scripts/scroll-perf.mjs
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
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await b.newPage();
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
        .find((x) => (x.innerText || '').trim().indexOf('ประวัติ') === 0).click();
    });
    await wait(3000);

    // โหลดเพิ่มให้ครบทุกแถว จะได้เลื่อนได้ยาวเหมือนที่พี่กันใช้จริง
    const โหลดเพิ่ม = await page.evaluate(() => {
      const b2 = [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').indexOf('ดูเพิ่ม') >= 0);
      if (b2) { b2.click(); return true; }
      return false;
    });
    if (โหลดเพิ่ม) await wait(2600);

    const นับของ = await page.evaluate(() => ({
      แถว: document.querySelectorAll('table tbody tr').length,
      ช่อง: document.querySelectorAll('table tbody td').length,
      ของทั้งหน้า: document.querySelectorAll('*').length,
      ปุ่มมีtap: document.querySelectorAll('table .tap').length
    }));

    // 🚨 ต้องเอาเมาส์ไปวางบนตารางก่อน ไม่งั้นไม่มีการไล่สีให้วัดเลย
    //    (พี่กันใช้จริงมีเมาส์อยู่บนตารางเสมอ — วัดโดยไม่มีเมาส์คือวัดคนละสภาพ)
    const กลางตาราง = await page.evaluate(() => {
      const r = document.querySelector('table tbody').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 200) };
    });
    await page.mouse.move(กลางตาราง.x, กลางตาราง.y);
    await wait(300);

    // เก็บเวลาเฟรมระหว่างเลื่อน
    const ผล = await page.evaluate(async () => {
      const sc = document.querySelector('[role="main"]');
      if (!sc) return null;
      sc.scrollTop = 0;
      await new Promise((r) => setTimeout(r, 300));

      const เฟรม = [];
      let ก่อนหน้า = performance.now();
      let หยุด = false;
      const นับ = () => {
        const now = performance.now();
        เฟรม.push(now - ก่อนหน้า);
        ก่อนหน้า = now;
        if (!หยุด) requestAnimationFrame(นับ);
      };
      requestAnimationFrame(นับ);

      // เลื่อนทีละน้อยแบบคนปัดจริง 60 ครั้ง
      for (let i = 0; i < 60; i++) {
        sc.scrollTop += 40;
        await new Promise((r) => requestAnimationFrame(r));
      }
      หยุด = true;
      await new Promise((r) => setTimeout(r, 100));

      const ตัด = เฟรม.slice(2);
      const เรียง = ตัด.slice().sort((a, b) => a - b);
      return {
        จำนวนเฟรม: ตัด.length,
        กลาง: Math.round(เรียง[Math.floor(เรียง.length / 2)] * 10) / 10,
        แย่สุด: Math.round(Math.max(...ตัด) * 10) / 10,
        เฟรมที่เกิน16_7: ตัด.filter((x) => x > 16.7).length,
        เฟรมที่เกิน33: ตัด.filter((x) => x > 33).length
      };
    });

    console.log('');
    console.log('ของบนหน้า — แถว ' + นับของ.แถว + ' · ช่อง ' + นับของ.ช่อง
      + ' · ปุ่มที่มีพื้นที่กดขยาย ' + นับของ.ปุ่มมีtap + ' · ของทั้งหน้า ' + นับของ.ของทั้งหน้า);
    console.log('');
    console.log('เลื่อน 60 ครั้ง');
    console.log('  เวลาเฟรมกลาง ๆ    ' + ผล.กลาง + ' มิลลิวินาที' + (ผล.กลาง <= 17 ? '  ✅ ลื่น' : '  🔴 ช้า'));
    console.log('  เฟรมที่แย่ที่สุด   ' + ผล.แย่สุด + ' มิลลิวินาที');
    console.log('  เฟรมที่หลุด 60fps  ' + ผล.เฟรมที่เกิน16_7 + ' จาก ' + ผล.จำนวนเฟรม
      + ' (' + Math.round(ผล.เฟรมที่เกิน16_7 / ผล.จำนวนเฟรม * 100) + '%)');
    console.log('  เฟรมที่สะดุดชัด    ' + ผล.เฟรมที่เกิน33 + ' เฟรม (เกิน 33 มิลลิวินาที)');
    console.log('');

    // กลไกปิดการไล่สีระหว่างเลื่อน ทำงานจริงไหม
    const กลไก = await page.evaluate(async () => {
      const sc = document.querySelector('[role="main"]');
      sc.scrollTop += 200;
      await new Promise((r) => setTimeout(r, 40));
      const ระหว่าง = document.documentElement.classList.contains('is-scrolling');
      await new Promise((r) => setTimeout(r, 420));
      const หลัง = document.documentElement.classList.contains('is-scrolling');
      return { ระหว่าง: ระหว่าง, หลัง: หลัง };
    });
    console.log('กลไกปิดการไล่สีระหว่างเลื่อน');
    console.log('  ระหว่างเลื่อน ปิดอยู่   ' + (กลไก.ระหว่าง ? '✅ ใช่' : '❌ ไม่'));
    console.log('  หยุดแล้ว เปิดกลับ       ' + (!กลไก.หลัง ? '✅ ใช่' : '❌ ยังปิดค้าง'));
    console.log('');
    console.log('⚠️ ตัวเลขข้างบนวัดจากเบราว์เซอร์แบบไม่เปิดหน้าต่าง จับอาการกระตุกจากการ์ดจอไม่ได้');
    console.log('   ต้องให้พี่กันลองเลื่อนบนเครื่องจริงถึงจะรู้ว่าหายจริงไหม');
    console.log('');
  } finally { await b.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
