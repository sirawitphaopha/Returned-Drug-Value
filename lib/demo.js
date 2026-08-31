// ── ข้อมูลตัวอย่าง (โหมดดูตัวอย่าง) ─────────────────────────────────────────
//
// 🚨 ข้อมูลชุดนี้ "ฝังอยู่ในเว็บ" ล้วน ๆ สร้างขึ้นในเบราว์เซอร์ตอนเปิดโหมด
//    ไม่เคยถูกส่งขึ้น Supabase และไม่เคยแตะฐานข้อมูลจริงแม้แต่แถวเดียว
//    ตอนเปิดโหมดนี้ ปุ่มบันทึกจะถูกปิด เพื่อกันข้อมูลปลอมหลุดเข้าของจริง
//
// ทำไมต้องมี: พี่กันยังไม่ได้ใส่ราคายาจริง ตัวเลขทุกหน้าเลยเป็น 0 หมด
//             มองไม่ออกว่าเว็บทำงานเสร็จแล้วหน้าตาจะเป็นยังไง
//
// ตัวเลขสุ่มด้วยเมล็ดคงที่ (seeded) → เปิดกี่ครั้งก็ได้ข้อมูลชุดเดิม
// จะได้เทียบหน้าจอกันได้ ไม่ใช่เปลี่ยนทุกครั้งที่รีเฟรช

import { SOURCES, fyRange, fyOf, isoOf } from './format';

// ── ตัวสุ่มแบบมีเมล็ด (mulberry32) ──────────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ยาที่คืนบ่อยจริงในห้องยา OPD พร้อมราคาโดยประมาณ
//
// 🚨 ต้องมีช่อง brand · form · route ครบเหมือนยาจริงในคลัง
//    ไม่งั้นพี่กันเปิดโหมดตัวอย่างแล้ว "ไม่เห็นสิ่งที่เพิ่งแก้ไป" ทั้งที่โค้ดถูกแล้ว
//    (ชื่อการค้าสีเทล · ความเข้มข้นสีส้ม · รูปแบบยา · ทางให้ยา)
//
// 🚨 ชื่อยาต้องเขียนตามรูปแบบเดียวกับที่ระบบจริงประกอบขึ้นมา คือ
//    ชื่อสามัญ + ความแรง + หน่วย + เปอร์เซ็นต์ท้ายสุด
//    · ยาสูตรผสมความแรงต้องอยู่ในวงเล็บ  "(875 + 125 mg)"
//    · เปอร์เซ็นต์ต้องอยู่ท้ายสุด        "50 mg/10 mL 0.5%"  ไม่ใช่กลางชื่อ
//    ถ้าเขียนผิดตำแหน่ง ตัวแยกชื่อ/ความแรง/เปอร์เซ็นต์จะแยกไม่ออก แล้วสีไม่ขึ้น
const DEMO_DRUGS = [
  { id: 9001, name: 'Metformin 500 mg', unit: 'เม็ด', price: 0.45, w: 10, form: 'tab', route: 'oral', brand: 'Glucophage', gen: 'Metformin', str: '500', su: 'mg', pct: '' },
  { id: 9002, name: 'Amlodipine 5 mg', unit: 'เม็ด', price: 0.38, w: 9, form: 'tab', route: 'oral', brand: '', gen: 'Amlodipine', str: '5', su: 'mg', pct: '' },
  { id: 9003, name: 'Simvastatin 20 mg', unit: 'เม็ด', price: 0.72, w: 8, form: 'tab', route: 'oral', brand: '', gen: 'Simvastatin', str: '20', su: 'mg', pct: '' },
  { id: 9004, name: 'Enalapril 5 mg', unit: 'เม็ด', price: 0.31, w: 8, form: 'tab', route: 'oral', brand: '', gen: 'Enalapril', str: '5', su: 'mg', pct: '' },
  { id: 9005, name: 'Atorvastatin 40 mg', unit: 'เม็ด', price: 2.85, w: 7, form: 'tab', route: 'oral', brand: 'Lipitor', gen: 'Atorvastatin', str: '40', su: 'mg', pct: '' },
  { id: 9006, name: 'Losartan 50 mg', unit: 'เม็ด', price: 1.15, w: 7, form: 'tab', route: 'oral', brand: '', gen: 'Losartan', str: '50', su: 'mg', pct: '' },
  { id: 9007, name: 'Glipizide 5 mg', unit: 'เม็ด', price: 0.42, w: 6, form: 'tab', route: 'oral', brand: '', gen: 'Glipizide', str: '5', su: 'mg', pct: '' },
  { id: 9008, name: 'Hydrochlorothiazide 25 mg', unit: 'เม็ด', price: 0.22, w: 6, form: 'tab', route: 'oral', brand: '', gen: 'Hydrochlorothiazide', str: '25', su: 'mg', pct: '' },
  { id: 9009, name: 'Aspirin 81 mg', unit: 'เม็ด', price: 0.18, w: 6, form: 'tab', route: 'oral', brand: '', gen: 'Aspirin', str: '81', su: 'mg', pct: '' },
  { id: 9010, name: 'Omeprazole 20 mg', unit: 'แคปซูล', price: 1.42, w: 5, form: 'cap', route: 'oral', brand: 'Losec', gen: 'Omeprazole', str: '20', su: 'mg', pct: '' },
  { id: 9011, name: 'Insulin glargine 100 IU/mL', unit: 'ด้าม', price: 385.0, w: 3, form: 'prefilled pen', route: 'SC', brand: 'Lantus', gen: 'Insulin glargine', str: '100', su: 'IU/mL', pct: '' },
  { id: 9012, name: 'Salbutamol 100 mcg', unit: 'กระบอก', price: 78.5, w: 4, form: 'MDI', route: 'inhaled', brand: 'Ventolin', gen: 'Salbutamol', str: '100', su: 'mcg', pct: '' },
  { id: 9013, name: 'Warfarin 3 mg', unit: 'เม็ด', price: 1.95, w: 4, form: 'tab', route: 'oral', brand: '', gen: 'Warfarin', str: '3', su: 'mg', pct: '' },
  { id: 9014, name: 'Furosemide 40 mg', unit: 'เม็ด', price: 0.28, w: 5, form: 'tab', route: 'oral', brand: 'Lasix', gen: 'Furosemide', str: '40', su: 'mg', pct: '' },
  { id: 9015, name: 'Allopurinol 100 mg', unit: 'เม็ด', price: 0.35, w: 4, form: 'tab', route: 'oral', brand: '', gen: 'Allopurinol', str: '100', su: 'mg', pct: '' },
  { id: 9016, name: 'Amoxicillin 500 mg', unit: 'แคปซูล', price: 1.25, w: 4, form: 'cap', route: 'oral', brand: '', gen: 'Amoxicillin', str: '500', su: 'mg', pct: '' },
  { id: 9017, name: 'Paracetamol 500 mg', unit: 'เม็ด', price: 0.14, w: 5, form: 'tab', route: 'oral', brand: '', gen: 'Paracetamol', str: '500', su: 'mg', pct: '' },
  { id: 9018, name: 'Gliclazide 30 mg', unit: 'เม็ด', price: 1.85, w: 4, form: 'tab', route: 'oral', brand: 'Diamicron', gen: 'Gliclazide', str: '30', su: 'mg', pct: '' },
  // ── ยาสูตรผสม — ความแรงอยู่ในวงเล็บ ตาแยกออกว่าตรงไหนชื่อยา ตรงไหนความแรง ──
  { id: 9019, name: 'Amoxicillin + Clavulanic acid (875 + 125 mg)', unit: 'เม็ด', price: 9.75, w: 3, form: 'tab', route: 'oral', brand: 'Augmentin', gen: 'Amoxicillin + Clavulanic acid', str: '875 + 125', su: 'mg', pct: '' },
  { id: 9020, name: 'Ampicillin + Sulbactam (2 + 1 g)', unit: 'ขวด', price: 68.0, w: 2, form: 'injection', route: 'IV', brand: '', gen: 'Ampicillin + Sulbactam', str: '2 + 1', su: 'g', pct: '' },
  { id: 9021, name: 'Budesonide + Formoterol (160 + 4.5 mcg)', unit: 'กระบอก', price: 425.0, w: 2, form: 'turbuhaler', route: 'inhaled', brand: 'Symbicort', gen: 'Budesonide + Formoterol', str: '160 + 4.5', su: 'mcg', pct: '' },
  { id: 9022, name: 'Cetirizine 10 mg', unit: 'เม็ด', price: 0.55, w: 4, form: 'tab', route: 'oral', brand: 'Zyrtec', gen: 'Cetirizine', str: '10', su: 'mg', pct: '' },
  { id: 9023, name: 'Domperidone 10 mg', unit: 'เม็ด', price: 0.48, w: 3, form: 'tab', route: 'oral', brand: 'Motilium', gen: 'Domperidone', str: '10', su: 'mg', pct: '' },
  { id: 9024, name: 'Ferrous fumarate 200 mg', unit: 'เม็ด', price: 0.26, w: 3, form: 'tab', route: 'oral', brand: '', gen: 'Ferrous fumarate', str: '200', su: 'mg', pct: '' },
  { id: 9025, name: 'Calcium carbonate 1000 mg', unit: 'เม็ด', price: 0.62, w: 3, form: 'tab', route: 'oral', brand: '', gen: 'Calcium carbonate', str: '1000', su: 'mg', pct: '' },
  // ── ยาที่มีความเข้มข้นเป็น % — ต้องอยู่ท้ายชื่อเสมอ ──────────────────────
  { id: 9026, name: 'Sodium chloride 100 mL 0.9%', unit: 'ขวด', price: 24.0, w: 2, form: 'solution', route: 'IV', brand: '', gen: 'Sodium chloride', str: '100', su: 'mL', pct: '0.9%' },
  { id: 9027, name: 'Chloramphenicol 50 mg/10 mL 0.5%', unit: 'ขวด', price: 12.0, w: 2, form: 'drops', route: 'ophthalmic', brand: '', gen: 'Chloramphenicol', str: '50', su: 'mg/10 mL', pct: '0.5%' },
  { id: 9028, name: 'Lidocaine 20 mg/mL 2%', unit: 'ขวด', price: 45.0, w: 1, form: 'solution', route: 'topical', brand: 'Viscous', gen: 'Lidocaine', str: '20', su: 'mg/mL', pct: '2%' },
  { id: 9029, name: 'Betamethasone 1 mg/1 g 0.1%', unit: 'หลอด', price: 18.5, w: 2, form: 'cream', route: 'topical', brand: '', gen: 'Betamethasone', str: '1', su: 'mg/1 g', pct: '0.1%' },
];

const DEMO_STAFF = [
  'ภญ. ชนิสา แหวนเงิน', 'ภก. ประคอง ชิณวงษ์', 'ภก. สิรวิชญ์ เผ่าผา',
  'ภก. ปวริศร์ มุงคุณ', 'ภญ. งามตา นามสว่าง', 'จพ. วีระ กานกายันต์'
];

// รพ.สต. ตัวอย่าง — ใช้ชื่อจริงจากอำเภอปรางค์กู่ (รายละเอียดใน docs/PCU-SITES.md)
// ไม่ได้เอาครบ 13 แห่ง เพราะข้อมูลตัวอย่างมีไม่กี่ล็อต ใส่หมดก็ไม่ได้เห็นซ้ำ
export const DEMO_PCU = ['กู่', 'หนองเชียงทูน', 'ตูม', 'ดู่'];

const DEMO_REASONS = ['หมดอายุ', 'แกะจากซองเดิม', 'สภาพเปลี่ยน', 'ไม่ทราบแหล่งที่มา'];

// เลือกของจากรายการโดยถ่วงน้ำหนัก — ยาที่คืนบ่อยจะโผล่บ่อยกว่า เหมือนของจริง
function pickWeighted(list, r) {
  const total = list.reduce((a, x) => a + x.w, 0);
  let n = r() * total;
  for (const x of list) { n -= x.w; if (n <= 0) return x; }
  return list[list.length - 1];
}

const two = (n) => Math.round(n * 100) / 100;

// ── สร้างชุดข้อมูลตัวอย่างทั้งก้อน ──────────────────────────────────────────
// today = วันนี้จริงของเครื่อง เพื่อให้ปีงบกับกราฟ 12 เดือนตรงกับของจริง
export function buildDemo(today) {
  const r = rng(20690805);
  const range = fyRange(today);
  const start = new Date(range.from + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');
  const days = Math.max(1, Math.round((end - start) / 86400000));

  const rows = [];
  const lotsMap = {};
  let id = 1;
  let lotSeq = {};

  // เดินทีละวัน · วันธรรมดามีคนคืนยาเกือบทุกวัน · วันละ 2-5 ล็อต
  // ความถี่ถูกเพิ่มจากชุดแรก (60% ของวัน · 1-3 ล็อต · 1-4 รายการ) เพราะพี่กันบอกว่าน้อยไป
  // ดูหน้าประวัติแล้วเห็นแค่สิบกว่าแถว มองไม่ออกว่าใช้งานจริงจะแน่นแค่ไหน
  for (let d = 0; d <= days; d++) {
    const dt = new Date(start.getTime() + d * 86400000);
    const dow = dt.getDay();
    if (dow === 0 || dow === 6) continue;            // เสาร์อาทิตย์ห้องยา OPD ปิด
    if (r() > 0.88) continue;

    const iso = isoOf(dt);
    const lotCount = 2 + Math.floor(r() * 4);

    for (let L = 0; L < lotCount; L++) {
      lotSeq[iso] = (lotSeq[iso] || 0) + 1;
      const yy = String((dt.getFullYear() + 543) % 100).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const lot = 'L' + yy + mm + dd + '-' + String(lotSeq[iso]).padStart(2, '0');

      const by = DEMO_STAFF[Math.floor(r() * DEMO_STAFF.length)];
      const src = SOURCES[Math.floor(r() * SOURCES.length)].key;
      const hn = r() > 0.25 ? String(1000000 + Math.floor(r() * 8999999)) : null;
      const items = 2 + Math.floor(r() * 5);

      for (let i = 0; i < items; i++) {
        const dg = pickWeighted(DEMO_DRUGS, r);
        // ยาเม็ดคืนมาเป็นหลักสิบ · ยาฉีด/พ่นคืนมาชิ้นสองชิ้น
        const bulk = dg.price < 5;
        const qty = bulk
          ? [7, 10, 14, 20, 28, 30, 60, 90][Math.floor(r() * 8)]
          : (r() > 0.8 ? two(0.5 + Math.floor(r() * 2)) : 1 + Math.floor(r() * 2));
        // ราว 78% เอากลับไปใช้ต่อได้ ที่เหลือต้องทำลาย
        const destroy = r() > 0.78;

        rows.push({
          id: id++,
          date: iso,
          drugId: dg.id,
          name: dg.name,
          unit: dg.unit,
          price: dg.price,
          qty: qty,
          disposition: destroy ? 'destroy' : 'reuse',
          reason: destroy ? DEMO_REASONS[Math.floor(r() * DEMO_REASONS.length)] : null,
          source: src,
          pcuSite: src === 'pcu' ? DEMO_PCU[Math.floor(r() * DEMO_PCU.length)] : '',
          hn: hn,
          by: by,
          lot: lot,
          deletedAt: null,
          priceFixedAt: null
        });
      }

      if (!lotsMap[lot]) lotsMap[lot] = { lot: lot, date: iso, by: by, items: 0, qty: 0, saved: 0, lost: 0 };
    }
  }

  // สรุปยอดต่อล็อต
  for (const x of rows) {
    const L = lotsMap[x.lot];
    if (!L) continue;
    L.items += 1;
    L.qty += x.qty;
    if (x.disposition === 'reuse') L.saved += x.price * x.qty;
    else L.lost += x.price * x.qty;
  }

  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

  const lots = Object.keys(lotsMap)
    .map((k) => lotsMap[k])
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.lot < b.lot ? 1 : -1)));

  return { rows: rows, lots: lots, drugs: DEMO_DRUGS, today: today, range: range };
}

// ── รายการค้างในหน้าบันทึก ──────────────────────────────────────────────────
// พี่กันขอให้หน้าบันทึกมีของให้ดูด้วย ไม่ใช่ว่างเปล่าอยู่หน้าเดียว
// เป็นล็อตที่ "กำลังกรอกอยู่ ยังไม่กดบันทึก" — รูปร่างแถวต้องตรงกับ app.addRow เป๊ะ
// ไม่งั้นตารางหน้าบันทึกอ่านค่าไม่เจอ (rid · drugId · name · unit · price · qty · disposition · hn · source)
export function demoDraft(box) {
  const r = rng(760815);
  const hn = '6418302';
  const plan = [
    { i: 0,  qty: 60, disp: 'reuse',   src: 'opd'  },   // Metformin
    { i: 1,  qty: 30, disp: 'reuse',   src: 'opd'  },   // Amlodipine
    { i: 9,  qty: 14, disp: 'reuse',   src: 'ncd'  },   // Omeprazole
    { i: 12, qty: 28, disp: 'reuse',   src: 'ncd'  },   // Warfarin
    { i: 4,  qty: 20, disp: 'destroy', src: 'ward' },   // Atorvastatin — หมดอายุ
    { i: 11, qty: 1,  disp: 'reuse',   src: 'home' },   // Salbutamol MDI
    { i: 10, qty: 2,  disp: 'destroy', src: 'home' },   // Insulin — หลุดลูกโซ่ความเย็น
    { i: 5,  qty: 90, disp: 'reuse',   src: 'opd'  },   // Losartan
    { i: 8,  qty: 30, disp: 'reuse',   src: 'ncd'  },   // Aspirin
    { i: 16, qty: 20, disp: 'reuse',   src: 'opd'  },   // Paracetamol
    { i: 13, qty: 28, disp: 'reuse',   src: 'ward' },   // Furosemide
    { i: 19, qty: 1,  disp: 'destroy', src: 'home' },   // Budesonide turbuhaler — สภาพเปลี่ยน
    { i: 3,  qty: 60, disp: 'reuse',   src: 'pcu'  },   // Enalapril
    { i: 2,  qty: 30, disp: 'reuse',   src: 'pcu'  }    // Simvastatin
  ];

  return plan.map((p, n) => {
    const dg = box.drugs[p.i];
    return {
      // rid ต้องไม่ซ้ำกับของจริงที่ผู้ใช้กดเพิ่มเอง (ของจริงใช้ Date.now() = สิบสามหลัก)
      rid: 'demo-' + n + '-' + Math.floor(r() * 1e6),
      drugId: dg.id, name: dg.name, unit: dg.unit,
      price: dg.price, qty: p.qty, disposition: p.disp,
      hn: hn, source: p.src,
      pcuSite: p.src === 'pcu' ? DEMO_PCU[0] : ''
    };
  });
}

// ── ตัวเลขหน้าสรุป — คิดจากแถวตัวอย่าง ใช้กติกาเดียวกับ mr_summary() เป๊ะ ──
// byMonth/topDrugs นับเฉพาะ reuse · bySrc นับทั้งสองแบบ
export function demoSummary(box) {
  const rows = box.rows;
  let saved = 0, lost = 0, qty = 0;
  const byMonth = {}, bySrc = {}, byReason = {}, byDrug = {}, drugSet = {};

  for (const x of rows) {
    const v = x.price * x.qty;
    qty += x.qty;
    bySrc[x.source] = (bySrc[x.source] || 0) + v;
    if (x.disposition === 'reuse') {
      saved += v;
      const m = x.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + v;
      byDrug[x.name] = (byDrug[x.name] || 0) + v;
      drugSet[x.name] = 1;
    } else {
      lost += v;
      const k = x.reason || 'ไม่ระบุ';
      byReason[k] = (byReason[k] || 0) + v;
    }
  }

  const topDrugs = Object.keys(byDrug)
    .map((n) => ({ name: n, v: byDrug[n] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 10);

  return {
    today: box.today,
    fyYear: fyOf(box.today),
    nowFy: fyOf(box.today),
    fyYears: [fyOf(box.today)],
    from: box.range.from,
    to: box.range.to,
    saved: saved,
    lost: lost,
    records: rows.length,
    qty: qty,
    drugCount: Object.keys(drugSet).length,
    zeroPriced: 0,
    byMonth: byMonth,
    bySrc: bySrc,
    byReason: byReason,
    topDrugs: topDrugs
  };
}

// ยาที่ถูกคืนบ่อยที่สุด — เรียงตามจำนวนครั้ง ไม่ใช่มูลค่า (เหมือน mr_top_returned)
export function demoTopReturned(box) {
  const m = {};
  for (const x of box.rows) {
    if (!m[x.name]) m[x.name] = { name: x.name, unit: x.unit, times: 0, qty: 0, value: 0 };
    m[x.name].times += 1;
    m[x.name].qty += x.qty;
    m[x.name].value += x.price * x.qty;
  }
  return Object.keys(m).map((k) => m[k]).sort((a, b) => b.times - a.times || b.value - a.value).slice(0, 15);
}

// กรองแถวตามเงื่อนไขหน้าประวัติ — เลียนแบบ mr_history()
export function demoHistory(box, opt) {
  const o = opt || {};
  const q = String(o.q || '').trim().toLowerCase();
  let out = box.rows;

  if (o.lot) out = out.filter((x) => x.lot === o.lot);
  if (o.from) out = out.filter((x) => x.date >= o.from);
  if (o.to) out = out.filter((x) => x.date <= o.to);
  if (q) {
    out = out.filter((x) =>
      x.name.toLowerCase().indexOf(q) >= 0 ||
      String(x.hn || '').indexOf(q) >= 0 ||
      String(x.by || '').toLowerCase().indexOf(q) >= 0 ||
      String(x.lot || '').toLowerCase().indexOf(q) >= 0
    );
  }

  let saved = 0, lost = 0;
  for (const x of out) {
    const v = x.price * x.qty;
    if (x.disposition === 'reuse') saved += v; else lost += v;
  }

  return {
    rows: out.slice(o.offset || 0, (o.offset || 0) + (o.limit || 60)),
    total: out.length,
    saved: saved,
    lost: lost
  };
}

// ── ล็อตที่กรอกค้างไว้ในหน้าต่างที่ปิดไปแล้ว (เครื่องนี้) ────────────────────
// พี่กันสั่ง 31 ส.ค. 2569 — "ข้อมูลอะไรพวกนี้ ใส่ในเดโม่ด้วยนะ"
// มีอันเดียวพอ ให้เห็นหน้าตาตอนมีล็อตค้างอันเดียว (แถบโชว์รายละเอียดเลย)
export function demoParked(box) {
  const d = box.drugs;
  // 🚨 ต้องมี rows ด้วย ไม่งั้นกดดูรายละเอียดแล้วขึ้นว่าไม่มียาเหลือ
  const plan = [[0, 30], [5, 60], [9, 14]];
  const rows = plan.map(function (p, i) {
    const dg = d[p[0]];
    return {
      rid: 'demo-pk-' + i, drugId: dg.id, name: dg.name, unit: dg.unit,
      price: dg.price, qty: p[1], disposition: 'reuse', source: 'opd'
    };
  });
  return [{
    id: 'demo-parked-1',
    count: rows.length,
    value: rows.reduce(function (a, r) { return a + r.price * r.qty; }, 0),
    when: box.today,
    rows: rows
  }];
}

// ── ร่างที่เก็บไว้บนเซิร์ฟเวอร์ ──────────────────────────────────────────────
// รูปร่างต้องเหมือนที่ /api/drafts ส่งมาเป๊ะ ๆ (ช่องขีดล่างตามฐานข้อมูล)
// ไม่งั้น shapeDraft() ใน vals/record.js อ่านไม่ออก
//
// ใส่ 3 ก้อนเพื่อให้เห็นครบทุกแบบที่เกิดขึ้นจริง
//   ① เครื่องนี้ · ส่งไม่สำเร็จ   ② เครื่องอื่น · ปกติ   ③ เครื่องอื่น · ใกล้ถูกล้าง (แถบแดง)
// ถอยวันจากวันนี้ — ใช้กับร่างที่กรอกค้างไว้ ต้องอยู่ในช่วง 7 วันที่ระบบเก็บให้
function daysAgo(today, n) {
  const d = new Date(today + String.fromCharCode(84) + '00:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function demoServerDrafts(box) {
  const d = box.drugs;
  const row = (i, qty, disp) => ({
    rid: 'demo-sv-' + i + '-' + qty, drugId: d[i].id, name: d[i].name, unit: d[i].unit,
    price: d[i].price, qty: qty, disposition: disp || 'reuse', source: 'opd'
  });
  return [
    {
      device_id: 'computer OPD เครื่องที่ 2', tab_id: 'demo-a',
      rows: [row(0, 60), row(3, 30)], items: 2,
      hn: '6418302', source: 'opd', pcu_site: '', return_date: box.today,
      save_failed: true, failed_by: 'ภญ. ชนิสา แหวนเงิน',
      days_left: 6, mine: true
    },
    {
      device_id: 'computer NCD เครื่องที่ 1', tab_id: 'demo-b',
      rows: [row(9, 14), row(12, 28), row(8, 30)], items: 3,
      hn: '6702511', source: 'ncd', pcu_site: '', return_date: daysAgo(box.today, 3),
      save_failed: false, failed_by: '',
      days_left: 4, mine: false
    },
    {
      device_id: 'มือถือของ ภก. ประคอง ชิณวงษ์', tab_id: 'demo-c',
      rows: [row(3, 60, 'reuse'), row(4, 20, 'destroy')], items: 2,
      hn: '', source: 'pcu', pcu_site: DEMO_PCU[0], return_date: daysAgo(box.today, 6),
      save_failed: false, failed_by: '',
      days_left: 1, mine: false
    }
  ];
}

// ── คลังยาตัวอย่าง — รูปร่างเดียวกับที่ /api/catalog ส่งมา ───────────────────
// 🚨 ต้องมี เพราะเดิมโหมดดูตัวอย่างกดแท็บคลังยาแล้ว "โหลดยาจริง 417 ตัวมาโชว์"
//    ผิดกติกาข้อแรกของโหมดนี้ที่ว่าทุกอย่างต้องเป็นข้อมูลปลอม
export function demoCatalog(box) {
  return box.drugs.map((d) => ({
    id: d.id,
    generic: d.gen, strength: d.str, unit: d.su, percent: d.pct,
    form: d.form, route: d.route, release: '',
    brand: d.brand || '', abbrev: '',
    had: false, preg: '', renal: false,
    pill_color: '', pill_color_hex: '',
    unit_price: d.price, unit_th: d.unit, price_needs_check: false, hidden: false,
    price: d.price, unitTh: d.unit, needsCheck: false
  }));
}

// ── หน้าจัดการราคา — รูปร่างเดียวกับที่ /api/prices ส่งมา ────────────────────
// ตัวสุดท้ายตั้งเป็น "รอกดเลือก" ไว้ 1 ตัว ให้เห็นแท็บงานค้างกับปุ่มตัวเลือกราคา
export function demoPrices(box) {
  return box.drugs.map((d, i) => {
    const wait = i === box.drugs.length - 1;
    return {
      id: d.id, name: d.name,
      brand: d.brand || '', form: d.form || '', route: d.route || '', abbrev: '',
      unit: d.unit, unitTh: '', defaultUnit: d.unit,
      price: wait ? 0 : d.price,
      hasPrice: !wait,
      note: wait ? '' : 'HIS 31 ส.ค. 69 · ข้อมูลตัวอย่าง',
      needsCheck: wait,
      suggestions: wait
        ? [{ name: 'BETAMETHASONE 0.1% cream 5 g', price: 18.5, unit: 'หลอด' },
           { name: 'BETAMETHASONE 0.1% cream 15 g', price: 42.0, unit: 'หลอด' }]
        : []
    };
  });
}

// ── ถังขยะตัวอย่าง ────────────────────────────────────────────────────────
// พี่กันสั่ง 31 ส.ค. 2569 ให้ไล่ดูว่าเดโมหน้าไหนยังใส่ข้อมูลไม่ครบ
// เดิมกดแท็บถังขยะในโหมดตัวอย่างแล้วขึ้น "ถังขยะว่าง" เสมอ
// = ดูไม่ออกเลยว่าหน้าตอนมีของหน้าตาเป็นยังไง และปุ่มกู้คืนอยู่ตรงไหน
export function demoTrash(box) {
  const who = ['ภญ. ชนิสา แหวนเงิน', 'ภก. สิรวิชญ์ เผ่าผา', 'ภก. ประคอง ชิณวงษ์'];
  // หยิบจากแถวจริงในชุดตัวอย่าง จะได้ชื่อยากับราคาสมจริง
  return box.rows.slice(0, 6).map(function (x, i) {
    return Object.assign({}, x, {
      id: 900000 + i,
      deletedAt: box.today,
      deletedBy: who[i % who.length]
    });
  });
}
