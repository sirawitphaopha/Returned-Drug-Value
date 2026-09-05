// วัดว่าการคำนวณค่าหน้าจอกินเวลาเท่าไหร่จริง ๆ (กลุ่ม 3 · ก-8)
// 🚨 วัดก่อนแก้เสมอ ไม่งั้นไม่รู้ว่าแก้แล้วดีขึ้นจริงไหม หรือแก้ผิดจุด
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
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--window-size=1400,960'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
        page.click('button[type="submit"]')]);
    }
    // ตั้งชื่อเครื่องไว้ล่วงหน้า ไม่งั้นติดหน้าต่างถามชื่อเครื่อง (มีตั้งแต่ v0.14.0.0)
    await page.evaluate(() => { try { localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ')); } catch (e) {} });
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(3500);

    const clickText = async (t) => page.evaluate((tx) => {
      const el = [...document.querySelectorAll('[role="button"]')]
        .find((e) => e.textContent.trim() === tx || e.textContent.trim().indexOf(tx) === 0);
      if (!el) return false; el.click(); return true;
    }, t);

    // เข้าหน้าคลังยาก่อน เพื่อให้ยา 417 ตัวถูกโหลดเข้ามาจริง (จุดที่หนักที่สุด)
    // 🚨 ต้องกลับหน้าบันทึกด้วยการ "กดปุ่ม" ไม่ใช่โหลดหน้าใหม่
    //    โหลดใหม่ = ล้างคลังยาออกจากหน่วยความจำ แล้ววัดไม่เจอของจริง (เคยพลาดมาแล้ว)
    await clickText('คลังยา');
    await wait(4500);
    const loaded = await page.evaluate(() => document.body.innerText.indexOf('417') >= 0);
    console.log(loaded ? 'คลังยาโหลดครบแล้ว เริ่มวัด' : '⚠️ คลังยายังไม่ครบ ตัวเลขที่วัดจะไม่ตรง');
    if ((process.argv[2] || 'record') !== 'catalog') {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('[role="button"],[aria-label]')]
          .find((e) => (e.getAttribute('aria-label') || '') === 'กลับไปหน้าบันทึก'
            || e.textContent.trim() === 'บันทึก');
        if (el) el.click();
      });
      await wait(2500);
    }

    const mode = process.argv[2] || 'record';

    if (mode === 'catalog') {
      // ── วัดหน้าคลังยา 417 แถว ────────────────────────────────────────────
      await page.evaluate(() => { window.__mrvPerf = true; window.__mrvPerfLog = {}; });
      const cat = await page.evaluate(async () => {
        const box = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').indexOf('ค้น') >= 0);
        if (!box) return { err: 'ไม่เจอช่องค้นในหน้าคลังยา' };
        const setVal = window.Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const times = [];
        for (const w of ['a', 'am', 'amo', 'p', 'pa', 'par', 'm', 'me', 'met', 'w']) {
          const t0 = performance.now();
          setVal.call(box, w);
          box.dispatchEvent(new Event('input', { bubbles: true }));
          await frame();
          times.push(performance.now() - t0);
        }
        setVal.call(box, '');
        box.dispatchEvent(new Event('input', { bubbles: true }));
        await frame();
        times.sort((a, b) => a - b);
        return {
          แถวในตาราง: document.querySelectorAll('tbody tr').length,
          กล่องทั้งหน้า: document.querySelectorAll('*').length,
          เร็วสุด: Math.round(times[0]),
          กลาง: Math.round(times[Math.floor(times.length / 2)]),
          ช้าสุด: Math.round(times[times.length - 1]),
          เฉลี่ย: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        };
      });
      console.log('พิมพ์ในช่องค้นหน้าคลังยา (มิลลิวินาที)');
      console.log(JSON.stringify(cat, null, 2));
      const per2 = await page.evaluate(() => {
        const log = window.__mrvPerfLog || {};
        return Object.keys(log).map((k) => k + ' ต่อครั้ง ' + (log[k].total / log[k].n).toFixed(2) + ' ms').sort();
      });
      per2.forEach((x) => console.log('  ' + x));
      await browser.close();
      process.exit(0);
    }

    await page.evaluate(() => { window.__mrvPerf = true; window.__mrvPerfLog = {}; });

    // วัดเวลาที่ใช้พิมพ์ 1 ตัวอักษรในช่องค้นยา — เส้นทางที่เภสัชกรใช้ทุกวัน
    const r = await page.evaluate(async () => {
      const box = document.querySelector('input[placeholder*="ค้นชื่อยา"], input[placeholder*="ค้นหายา"]')
        || [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').indexOf('ยา') >= 0);
      if (!box) return { err: 'ไม่เจอช่องค้นยา' };

      const setVal = window.Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const type = (v) => {
        setVal.call(box, v);
        box.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));

      const words = ['a', 'am', 'amo', 'amox', 'amoxi', 'met', 'metf', 'para', 'pa', 'p'];
      const times = [];
      for (const w of words) {
        const t0 = performance.now();
        type(w);
        await frame();
        times.push(performance.now() - t0);
      }
      type('');
      await frame();
      times.sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      return {
        รอบ: times.length,
        เร็วสุด: Math.round(times[0]),
        กลาง: Math.round(times[Math.floor(times.length / 2)]),
        ช้าสุด: Math.round(times[times.length - 1]),
        เฉลี่ย: Math.round(sum / times.length)
      };
    });

    console.log('พิมพ์ในช่องค้นยา (หน่วยเป็นมิลลิวินาที ยิ่งน้อยยิ่งดี)');
    console.log(JSON.stringify(r, null, 2));

    const per = await page.evaluate(() => {
      const log = window.__mrvPerfLog || {};
      return Object.keys(log)
        .map((k) => ({ ไฟล์: k, ครั้ง: log[k].n, รวม: Math.round(log[k].total), ต่อครั้ง: +(log[k].total / log[k].n).toFixed(2), ครั้งที่แพงสุด: +log[k].max.toFixed(2) }))
        .sort((a, b) => b.รวม - a.รวม);
    });
    console.log('');
    console.log('แยกตามไฟล์ (เรียงจากกินเวลารวมมากสุด)');
    for (const x of per) {
      console.log('  ' + String(x.ไฟล์).padEnd(10) + ' รวม ' + String(x.รวม).padStart(5) + ' ms · ' +
        'ต่อครั้ง ' + String(x.ต่อครั้ง).padStart(6) + ' ms · แพงสุด ' + x.ครั้งที่แพงสุด + ' ms · ' + x.ครั้ง + ' ครั้ง');
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
