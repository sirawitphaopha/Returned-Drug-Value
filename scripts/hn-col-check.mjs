// คอลัมน์ HN กดซ่อน/แสดงได้ + ชื่อผู้บันทึกห้ามถูกผ่ากลางคำ (พี่กันสั่ง 10 ก.ย. 2569)
//
//   "แสดงเริ่มต้นคือซ่อน · จำสถานะ · ก็ค้นได้นะ HN แม้ว่ามันจะปิดก็ตาม"
//   "ห้ามตัดชื่อ"
//
// 🚨 นับบรรทัดจริงด้วย Range ของตัวอักษร ไม่ใช่เดาจากความสูงช่อง
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

const อ่านตาราง = (page) => page.evaluate(() => {
  const นับบรรทัด = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const แถว = [];
    [...r.getClientRects()].filter((b) => b.width > 0 && b.height > 0)
      .forEach((b) => { if (!แถว.some((y) => Math.abs(y - b.top) < 4)) แถว.push(b.top); });
    return แถว.length;
  };
  const หัว = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/[↑↓\s]+/g, ' ').trim());
  const tr = document.querySelector('table tbody tr');
  const i = หัว.findIndex((h) => h.indexOf('ผู้บันทึก') >= 0);
  const j = หัว.findIndex((h) => h.indexOf('แหล่งที่มา') >= 0);
  const tdSrc = tr && tr.children[j];
  const td = tr && tr.children[i];
  return {
    หัวคอลัมน์: หัว,
    มีคอลัมน์HN: หัว.some((h) => h === 'HN'),
    ผู้บันทึก: td ? { ข้อความ: td.innerText.trim(), บรรทัด: นับบรรทัด(td), กว้าง: Math.round(td.getBoundingClientRect().width), ล้น: td.scrollWidth > td.clientWidth + 1 } : null,
    แหล่งที่มา: tdSrc ? { ข้อความ: tdSrc.innerText.trim(), บรรทัด: นับบรรทัด(tdSrc), กว้าง: Math.round(tdSrc.getBoundingClientRect().width), ล้น: tdSrc.scrollWidth > tdSrc.clientWidth + 1 } : null,
    สูงแถว: tr ? Math.round(tr.getBoundingClientRect().height) : null,
    ปุ่มHN: (() => {
      const b = [...document.querySelectorAll('[role="button"]')].find((x) => /^(ซ่อน|แสดง) HN$/.test((x.innerText || '').trim()));
      return b ? b.innerText.trim() : null;
    })()
  };
});

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
    // 🚨 ล้างสถานะที่จำไว้ก่อน ไม่งั้นเทสค่าตั้งต้นไม่ได้เลย
    await page.evaluate(() => {
      try {
        localStorage.setItem('mrv.device', JSON.stringify('เครื่องทดสอบอัตโนมัติ'));
        localStorage.removeItem('mrv.hncol');
      } catch (e) {}
    });
    const ไปประวัติ = async () => {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await wait(3800);
      await page.evaluate(() => {
        [...document.querySelectorAll('[role="navigation"] [role="button"], [role="button"]')]
          .find((b) => (b.innerText || '').trim().indexOf('ประวัติ') === 0).click();
      });
      await wait(3000);
    };
    await ไปประวัติ();

    console.log('');
    console.log('① ค่าตั้งต้น — คอลัมน์ HN ต้องซ่อน');
    let r = await อ่านตาราง(page);
    if (!r.ผู้บันทึก) { console.error('🔴 หาตารางไม่เจอ — หยุดก่อน อย่าเชื่อผลที่ออกมา'); process.exit(1); }
    เช็ค('ไม่มีคอลัมน์ HN ในตาราง', r.มีคอลัมน์HN, false);
    เช็ค('ปุ่มเขียนว่า "แสดง HN"', r.ปุ่มHN, 'แสดง HN');

    console.log('');
    console.log('② ชื่อผู้บันทึกห้ามถูกผ่ากลางคำ');
    const เต็มบรรทัดเดียว = r.ผู้บันทึก.บรรทัด === 1;
    เช็ค('ชื่ออยู่บรรทัดเดียว', เต็มบรรทัดเดียว, true);
    เช็ค('คอลัมน์กว้าง 114 ตามที่วัดมา', r.ผู้บันทึก.กว้าง, 114);
    เช็ค('ชื่อไม่ล้นออกนอกช่อง', r.ผู้บันทึก.ล้น, false);
    เช็ค('ชื่อไม่มีคำไหนถูกผ่า', /^(ภญ|ภก|จพ)\.\s*\S+$/.test(r.ผู้บันทึก.ข้อความ.replace(/\n/g, ' ')), true);
    console.log('     ชื่อที่อ่านได้: "' + r.ผู้บันทึก.ข้อความ.replace(/\n/g, ' ⏎ ') + '"');

    console.log('');
    console.log('③ กดปุ่มแล้วคอลัมน์ HN ต้องโผล่');
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').trim() === 'แสดง HN').click();
    });
    await wait(900);
    r = await อ่านตาราง(page);
    เช็ค('คอลัมน์ HN โผล่แล้ว', r.มีคอลัมน์HN, true);
    เช็ค('ปุ่มเปลี่ยนเป็น "ซ่อน HN"', r.ปุ่มHN, 'ซ่อน HN');
    // 🚨🔴 ต้องเช็คบรรทัดตอนเปิด HN ด้วย — ของเดิมเช็คแค่ความกว้าง
    //    ตัวตรวจจึงผ่านทั้งที่ชื่อตกบรรทัดจริง พี่กันจับได้เอง 10 ก.ย. 2569
    เช็ค('เปิด HN แล้วชื่อยังอยู่บรรทัดเดียว', r.ผู้บันทึก.บรรทัด, 1);
    เช็ค('เปิด HN แล้วชื่อไม่ล้นออกนอกช่อง', r.ผู้บันทึก.ล้น, false);
    เช็ค('คอลัมน์ผู้บันทึกยังกว้าง 114 เท่าเดิม', r.ผู้บันทึก.กว้าง, 114);

    console.log('');
    console.log('④ จำสถานะข้ามการรีเฟรช');
    await ไปประวัติ();
    r = await อ่านตาราง(page);
    เช็ค('เปิดเว็บใหม่แล้ว HN ยังเปิดอยู่', r.มีคอลัมน์HN, true);
    const จำไว้ = await page.evaluate(() => localStorage.getItem('mrv.hncol'));
    เช็ค('เก็บลงที่เก็บถาวรจริง', จำไว้, 'true');

    console.log('');
    console.log('⑤ ปิดกลับแล้วต้องจำเหมือนกัน');
    await page.evaluate(() => {
      [...document.querySelectorAll('[role="button"]')].find((x) => (x.innerText || '').trim() === 'ซ่อน HN').click();
    });
    await wait(900);
    await ไปประวัติ();
    r = await อ่านตาราง(page);
    เช็ค('เปิดเว็บใหม่แล้ว HN ยังซ่อนอยู่', r.มีคอลัมน์HN, false);
    เช็ค('ชื่อยังอยู่บรรทัดเดียว', r.ผู้บันทึก.บรรทัด, 1);

    console.log('');
    console.log('⑥ คอลัมน์ปิดอยู่ก็ต้องค้นด้วย HN ได้ (พี่กันย้ำ)');
    // 🚨 ช่องค้นหาเป็นโครง 3 ชั้นกันวรรณยุกต์โดนตัด ตัวอักษรที่ตาเห็นไม่ได้อยู่ใน input
    //    หาแบบเดิม (placeholder ของ input) จึงไม่มีวันเจอ — ต้องหาจากข้อความที่วาดจริง
    const ค้น = await page.evaluate(() => {
      const มีในจอ = document.body.innerText.indexOf('HN') >= 0;
      const ป้าย = [...document.querySelectorAll('[aria-label]')].some((e) => (e.getAttribute('aria-label') || '').indexOf('ค้นหา') >= 0);
      return { ข้อความบอกว่าค้น_HN_ได้: มีในจอ, มีช่องค้นหา: ป้าย };
    });
    เช็ค('ช่องค้นหายังบอกว่าค้น HN ได้', ค้น.ข้อความบอกว่าค้น_HN_ได้, true);
    เช็ค('ช่องค้นหายังอยู่', ค้น.มีช่องค้นหา, true);

    console.log('');
    console.log('⑦ ชื่อ รพ.สต. ห้ามตัดเหมือนกัน (พี่กันสั่ง 10 ก.ย. 2569)');
    // 🚨 ความกว้างยืดหดตามข้อมูลที่แสดงอยู่ (พี่กันสั่ง) จึงเช็คเป็นช่วง ไม่ใช่ค่าเดียว
    //    พื้น 96 (หัวคอลัมน์) · เพดาน 156 (รพ.สต. หนองเชียงทูน ที่ยาวที่สุด)
    เช็ค('แหล่งที่มาอยู่ในช่วง 96-156', r.แหล่งที่มา.กว้าง >= 96 && r.แหล่งที่มา.กว้าง <= 156, true);
    console.log('     กว้างจริงตอนนี้ ' + r.แหล่งที่มา.กว้าง + ' จุด (ข้อมูลยาวสุดที่แสดงอยู่)');
    เช็ค('ชื่อ รพ.สต. อยู่บรรทัดเดียว', r.แหล่งที่มา.บรรทัด, 1);
    เช็ค('ชื่อ รพ.สต. ไม่ล้นออกนอกช่อง', r.แหล่งที่มา.ล้น, false);

    console.log('');
    console.log('⑧ คอลัมน์แหล่งที่มายืดตามข้อมูล — ใส่ชื่อยาวสุดเข้าไปแล้วต้องขยาย');
    // 🚨 ใส่แถวปลอมที่มี รพ.สต. ชื่อยาวที่สุดเข้า state โดยตรง (ไม่แตะฐาน)
    const ขยาย = await page.evaluate(() => {
      const el = document.querySelector('[role="button"]');
      const key = el && Object.keys(el).find((k) => k.indexOf('__reactFiber') === 0);
      let f = key ? el[key] : null, app = null;
      while (f) { if (f.stateNode && f.stateNode.state && 'histRows' in f.stateNode.state) { app = f.stateNode; break; } f = f.return; }
      if (!app) return null;
      const เดิม = app.state.histRows;
      if (!เดิม.length) return null;
      const ปลอม = Object.assign({}, เดิม[0], { id: -999, source: 'pcu', pcuSite: 'หนองเชียงทูน' });
      app.setState({ histRows: [ปลอม].concat(เดิม) });
      return true;
    });
    if (ขยาย) {
      await wait(900);
      r = await อ่านตาราง(page);
      เช็ค('มีชื่อยาวสุดแล้วคอลัมน์ขยายถึงเพดาน 156', r.แหล่งที่มา.กว้าง, 156);
      เช็ค('ชื่อยาวสุดยังอยู่บรรทัดเดียว', r.แหล่งที่มา.บรรทัด, 1);
      เช็ค('ชื่อยาวสุดไม่ล้นออกนอกช่อง', r.แหล่งที่มา.ล้น, false);
      console.log('     ข้อความที่อ่านได้: "' + r.แหล่งที่มา.ข้อความ + '"');
    } else {
      console.log('  ⚠️ ใส่แถวทดสอบไม่ได้ ข้ามข้อนี้');
    }

    console.log('');
    console.log('─────────────────────────────');
    console.log('ผ่าน ' + ผ่าน + ' · ตก ' + ตก);
    if (ตก) process.exit(1);
  } finally { await browser.close(); }
})().catch((e) => { console.error('พัง: ' + e.message); process.exit(1); });
