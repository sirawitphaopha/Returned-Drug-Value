// ═══════════════════════════════════════════════════════════════════════════
// ตรวจว่าสีตอนชี้ "ตรงโทน" กับสีของปุ่มนั้นหรือเปล่า
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 26 ส.ค. 2569: "สีควรเข้ากับปุ่มนั้น ไม่ใช่ใส่แค่สีเทาเข้ม ต้องเข้ากับธีม"
// และ 27 ส.ค. 2569: "กรอบมันสีแดงนะ จุ้มไปต้องสีแดงสิ"
//
// ตัวตรวจ hover-check.mjs เช็คได้แค่ "เปลี่ยนไหม" — ปุ่มแดงที่ชี้แล้วเป็นเขียว
// ก็ผ่านของมัน เพราะสีเปลี่ยนจริง แต่ผิดโทน (เจอ 27 ส.ค. 2569 ที่ปุ่มทำลาย)
//
// ไฟล์นี้เทียบ "เฉดสี" ของปุ่มตอนปกติกับตอนชี้ ถ้ากระโดดข้ามโทนจะฟ้อง
// วิธีใช้  node scripts/hue-check.mjs
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.PRINT_CHECK_URL || 'http://127.0.0.1:3000';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ชื่อโทนสีเป็นภาษาคน — พี่กันอ่านรหัสสีไม่ออก (สั่งไว้ 27 ส.ค. 2569)
function toneName(h, s, l) {
  if (s < 0.10) return l > 0.92 ? 'ขาว' : l < 0.22 ? 'ดำ' : 'เทา';
  if (h < 18 || h >= 345) return 'แดง';
  if (h < 45) return 'ส้ม';
  if (h < 66) return 'เหลือง';
  if (h < 165) return 'เขียว';
  if (h < 200) return 'ฟ้าอมเขียว';
  if (h < 255) return 'น้ำเงิน';
  if (h < 290) return 'ม่วง';
  return 'ชมพู';
}
function rgbToHsl(str) {
  const m = String(str).match(/[\d.]+/g);
  if (!m) return null;
  const a = m.length > 3 ? Number(m[3]) : 1;
  if (a < 0.06) return { clear: true };
  const r = +m[0] / 255, g = +m[1] / 255, b = +m[2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h, s, l, name: toneName(h, s, l) };
}

function readPassword() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const hit = env.split(/\r?\n/).find((l) => l.startsWith('MRV_PASSWORD='));
    return hit ? hit.slice('MRV_PASSWORD='.length).trim() : '';
  } catch (e) { return ''; }
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const pw = readPassword();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
    if (page.url().indexOf('/login') >= 0 && pw) {
      await page.type('#mrv-pw', pw);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}), page.click('button[type="submit"]')]);
    }
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await wait(2400);

    const click = async (t) => page.evaluate((tt) => {
      const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.trim().indexOf(tt) === 0);
      if (el) { el.click(); return true; } return false;
    }, t);

    const screens = [
      { name: 'บันทึก', go: async () => {} },
      { name: 'ประวัติ', go: async () => { await click('ประวัติ'); } },
      { name: 'รายการ Lot', go: async () => { await click('รายการ Lot'); } },
      { name: 'สรุป', go: async () => { await click('ประวัติ'); await wait(900); await click('สรุป'); } },
      { name: 'คลังยา', go: async () => { await click('คลังยา'); } }
    ];

    let bad = 0, all = 0;
    for (const s of screens) {
      await s.go();
      await wait(2300);

      const spots = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('[role="button"], button')) {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) continue;
          if (r.top < 0 || r.top > window.innerHeight - 8) continue;
          out.push({ label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28),
                     x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
        }
        return out;
      });

      const paint = (xy) => page.evaluate((p) => {
        const el = document.elementFromPoint(p[0], p[1]);
        if (!el) return null;
        const hit = el.closest('[role="button"], button') || el;
        const g = getComputedStyle(hit);
        return { bg: g.backgroundColor, fg: g.color, bd: g.borderColor };
      }, xy);

      const wrong = [], grey = [];
      for (const sp of spots) {
        all++;
        await page.mouse.move(4, 4); await wait(380);
        const a = await paint([sp.x, sp.y]);
        await page.mouse.move(sp.x, sp.y); await wait(560);
        const b = await paint([sp.x, sp.y]);
        if (!a || !b) continue;

        // โทนของปุ่มตอนปกติ — เอาจากพื้นก่อน ถ้าพื้นใสใช้ตัวหนังสือ ถ้ายังไม่ได้ใช้ขอบ
        const pick = (o) => {
          for (const k of ['bg', 'fg', 'bd']) {
            const t = rgbToHsl(o[k]);
            if (t && !t.clear && t.s >= 0.12) return t;
          }
          return null;
        };
        const was = pick(a), now = pick(b);

        // 🚨 ปุ่มที่ตอนปกติเป็นขาว/เทา ไม่มีโทนให้เทียบ เครื่องตัดสินแทนคนไม่ได้
        //    ต้องอ่านจากความหมายของปุ่ม (ทำลาย=แดง · บันทึก=เขียว · รอ=อำพัน)
        //    เคยพลาดตรงนี้ 27 ส.ค. 2569 — ปุ่มทำลายพื้นใสตัวหนังสือเทา ชี้แล้วเป็นเขียว
        //    ตัวตรวจไม่ฟ้องเพราะไม่มีโทนตั้งต้นให้เทียบ พี่กันเห็นเองแล้วทัก
        if (!was) { if (now) grey.push(sp.label + '  ปกติขาวหรือเทา → ชี้แล้ว' + now.name); continue; }
        if (!now) continue;
        // ต่างกันเกิน 40 องศาบนวงล้อสี = คนละโทน
        let d = Math.abs(was.h - now.h); if (d > 180) d = 360 - d;
        if (d > 40) wrong.push(sp.label + '  ปกติ' + was.name + ' → ชี้แล้ว' + now.name);
      }
      bad += wrong.length;
      console.log('── หน้า' + s.name + ' · ตรวจ ' + spots.length + ' ปุ่ม · สีผิดโทน ' + wrong.length + ' ──');
      for (const w of wrong) console.log('   ' + w);
      if (grey.length) {
        console.log('   ── ต้องอ่านเอง (ปุ่มขาว/เทา ไม่มีโทนให้เครื่องเทียบ) ──');
        for (const g of grey) console.log('      ' + g);
      }
      console.log('');
    }
    console.log(bad ? '🚨 รวม ' + bad + ' จาก ' + all + ' ปุ่มที่สีตอนชี้ผิดโทน'
                    : '✅ ทุกปุ่ม (' + all + ' ปุ่ม) สีตอนชี้อยู่ในโทนเดียวกับปุ่มตัวเอง');
  } finally { await browser.close(); }
})();
