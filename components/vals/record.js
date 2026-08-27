// ค่าของหน้าบันทึก — คัดจาก renderVals ของมอคอัป (บรรทัด 1160–1290)
// ต่างจากต้นฉบับ 3 จุด: ตัดเลขคงคลังปลอม · ตัดสวิตช์จำลองเน็ตหลุด
// · ยอดสะสมปีงบมาจากฐานข้อมูล ไม่ได้นับจากรายการในเครื่อง
import { SOURCES, money, thaiDate } from '@/lib/format';
import { cleanQty, qtyNum, qtyText, splitDrugName, splitPercent, splitRelease, markMatch,
  cleanQtyExpr, evalQty, isQtyExpr, exprText, isResolvedQty, splitResolved, DESTROY_REASONS } from '../helpers';
import { moveHi } from '@/lib/drugSearch';
import { pillColorOf } from '@/lib/drugPillColors';

const sumReuse = (rows) => rows.reduce((a, x) => a + (x.disposition === 'reuse' ? x.price * x.qty : 0), 0);

// ก้อนในบรรทัดชื่อยาที่สั้นพอ จะถูกสั่งห้ามตัดขาดกลาง (white-space:nowrap)
// ก้อนที่ยาวกว่านี้ปล่อยให้ตัดตามปกติ ไม่งั้นล้นออกนอกกรอบมือถือ
//
// เกณฑ์ 26 ตัวอักษร ≈ 165px ที่ขนาดตัวอักษร 13px — กรอบผลค้นหาบนมือถือกว้างราว 430px
// วัดจากคลังจริง: ความแรงยาวสุด 42 ("25 + 2 + 5000 mcg/1 mL + mg/1 mL + IU/1 mL") = ตัดได้
// ส่วน "(40 + 200 mg/5 mL)" 18 ตัว · ชื่อการค้ายาวสุด 17 · รูปแบบยา 17 · ตัวย่อ 15 = ไม่ตัด
const NOWRAP_MAX = 26;
const fits = (text) => String(text || '').trim().length > 0 && String(text).trim().length <= NOWRAP_MAX;

// ── สีความแรง ────────────────────────────────────────────────────────────────
// ยาชื่อเดียวกันที่มีหลายความแรงในผลค้นหาเดียวกัน ต้องแยกออกจากกันด้วยสี
// Morphine 10 · 20 · 30 mg หยิบสลับกันแล้วอันตรายถึงชีวิต ตาต้องจับได้ตั้งแต่กวาดผ่าน
//
// 🚨 ห้ามใช้สีที่จองไว้แล้ว — เทล (ชื่อการค้า + ไฮไลต์คำค้น) · ม่วง (ตัวย่อ)
//    ส้ม (เปอร์เซ็นต์) · แดงอมชมพู (ER/IR) · แดง (ทำลาย/ยังไม่ใส่ราคา)
// พี่กันเลือกชุดนี้เอง 13 ส.ค. 2569
const ST_COLORS = ['#0b62d6', '#b04a00', '#00808f', '#5b34c9', '#6b6b52'];

// แยกตัวเลขนำหน้าออกจากหน่วย — "10 mg/5mL" → "10" กับ " mg/5mL"
// ทาสีเฉพาะตัวเลข ส่วนหน่วยคงเทาเดิม บรรทัดจะได้ไม่รกไปกว่านี้
const NUM_HEAD = /^\(?\s*[\d.+\s]*\d/;
const numPart = (text) => { const m = String(text || '').match(NUM_HEAD); return m ? m[0] : ''; };
const restPart = (text) => { const s = String(text || ''); return s.slice(numPart(s).length); };

// คืนฟังก์ชันที่บอกว่ายาตัวนี้ควรได้สีอะไร — null = ไม่ต้องทาสี (เจอชื่อนี้ตัวเดียว)
// จับกลุ่มด้วยชื่อยาที่ตัดความแรงออกแล้ว ไม่ใช่ชื่อเต็ม เพราะชื่อเต็มมีความแรงติดอยู่
export function makeStColorOf(results) {
  const groups = new Map();
  for (const drug of results) {
    const key = splitDrugName(drug.name).base.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(drug.id);
  }
  return (drug) => {
    const key = splitDrugName(drug.name).base.toLowerCase();
    const g = groups.get(key);
    if (!g || g.length < 2) return null;
    return ST_COLORS[g.indexOf(drug.id) % ST_COLORS.length];
  };
}

// หัวตารางรายการในครั้งนี้ — กดเรียงได้เหมือนหน้าประวัติ
// แป้นเครื่องคิดเลข 4 คอลัมน์ 5 แถว — เรียงแบบเครื่องคิดเลขจริงเพื่อให้มือจำตำแหน่งได้
// 🚨 ต้องมีปุ่ม + ครบ — โจทย์แรกสุดที่พี่กันสั่งคือ "25+25" ถ้าไม่มีก็ใช้แป้นทำไม่ได้เลย
// ⌫ ลบทีละตัว · ล้าง ล้างทั้งช่อง (สองปุ่มนี้ต่างกัน อย่ารวมเป็นปุ่มเดียว)
// = คิดผลลัพธ์ใส่กลับลงช่อง แต่ยังไม่เพิ่มรายการ (เผื่ออยากคูณต่อ)
const CALC_KEYS = [
  { k: '(', kind: 'op' }, { k: ')', kind: 'op' }, { k: '⌫', act: 'back', kind: 'fn' }, { k: 'ล้าง', act: 'clear', kind: 'del' },
  { k: '7' }, { k: '8' }, { k: '9' }, { k: '÷', send: '/', kind: 'op' },
  { k: '4' }, { k: '5' }, { k: '6' }, { k: '×', send: '*', kind: 'op' },
  { k: '1' }, { k: '2' }, { k: '3' }, { k: '−', send: '-', kind: 'op' },
  { k: '0' }, { k: '.' }, { k: '=', act: 'eq', kind: 'eq' }, { k: '+', kind: 'op' }
];

// ── แยกชิ้นส่วนชื่อยาสำหรับวาดพร้อมสี ────────────────────────────────────────
// ใช้ร่วมกันระหว่างผลค้นหากับตารางรายการครั้งนี้ ชื่อยาจะได้หน้าตาเหมือนกันทุกที่
// (พี่กันสั่ง 25 ส.ค. 2569 — เดิมตารางโชว์ชื่อเป็นข้อความดำล้วน แยกยากิน/ยาฉีดไม่ออก)
//
// ⚠️ ไม่มีการไฮไลต์คำค้นในนี้ เพราะตารางไม่มีคำค้น ส่วนผลค้นหาเติม markMatch เองข้างนอก
// แยกชิ้นส่วนชื่อยาเพื่อวาดทีละส่วนแล้วทาสีคนละสี
//
// 🚨 ใช้ข้อมูลดิบรายช่องเป็นหลัก ห้ามเดาชิ้นส่วนจากข้อความชื่อถ้าเลี่ยงได้
//    บทเรียน 25 ส.ค. 2569: เดิมแยกด้วยการอ่านข้อความ พอสูตรชื่อเปลี่ยน
//    (เพิ่มรูปแบบยา · ยี่ห้อ · สีเม็ด เข้าไปในชื่อ) ตัวเดาก็เดาผิดทันที
//    ได้ "Morphine sulfate 10 mg/mL injection injection" ซ้ำสองรอบ
//    และ (IR) หายไปเพราะไม่อยู่ในตำแหน่งที่ตัวเดาคาดไว้ พี่กันจับได้ทันที
//
// ยังเก็บทางเดาไว้เป็นทางสำรอง สำหรับที่ที่มีแต่ข้อความชื่อจริง ๆ
// (ยานอกบัญชีที่พิมพ์ชื่อเอง ไม่มีต้นทางในคลังให้ดึงช่องดิบ)
export function nameParts(drug, stColor) {
  const gen = (drug.generic || '').trim();

  // ── ทางหลัก: มีข้อมูลดิบครบ ใช้ตรง ๆ ────────────────────────────────────
  if (gen) {
    let sv = [(drug.strength || '').trim(), (drug.strengthUnit || '').trim()].filter(Boolean).join(' ');
    // ยาผสมครอบวงเล็บความแรง กันสับสนกับเครื่องหมายบวกในชื่อยา
    if (sv && (drug.strength || '').indexOf('+') >= 0) sv = '(' + sv + ')';
    const ab = (drug.abbrev || '').trim();
    const pct = (drug.percent || '').trim();
    const rel = (drug.release || '').trim();
    const br = (drug.brand || '').trim();
    return {
      base: gen,
      tail: '',
      strength: sv,
      stNum: stColor ? numPart(sv) : '',
      stRest: stColor ? restPart(sv) : sv,
      stColor: stColor || '',
      percentLabel: pct ? '(' + pct + '%)' : '',
      hasPercent: !!pct,
      releaseLabel: rel ? '(' + rel + ')' : '',
      hasRelease: !!rel,
      form: (drug.form || '').trim(),
      brand: br,
      hasBrand: !!br,
      abbrev: ab,
      hasAbbrev: !!ab
    };
  }

  // ── ทางสำรอง: มีแต่ข้อความชื่อ ต้องเดาเอา ────────────────────────────────
  const sp = splitDrugName(drug.name || '');
  const rl = splitRelease(sp.strength);      // ER/IR/SR อยู่ท้ายสุด ต้องแยกก่อน %
  const pc = splitPercent(rl.main);
  const abRaw = (drug.abbrev || '').trim();
  return {
    base: sp.base,
    tail: sp.tail,
    strength: pc.main,
    stNum: stColor ? numPart(pc.main) : '',
    stRest: stColor ? restPart(pc.main) : pc.main,
    stColor: stColor || '',
    percentLabel: pc.percent ? '(' + pc.percent + ')' : '',
    hasPercent: !!pc.percent,
    releaseLabel: rl.release ? '(' + rl.release + ')' : '',
    hasRelease: !!rl.release,
    form: (drug.form || '').trim(),
    brand: (drug.brand || '').trim(),
    hasBrand: !!(drug.brand || '').trim(),
    // ตัวย่อ — ไม่วาดถ้ามีอยู่ในชื่อยาแล้ว กัน "(HCTZ)(HCTZ)"
    abbrev: abRaw && (drug.name || '').toLowerCase().indexOf(abRaw.toLowerCase()) < 0 ? abRaw : '',
    hasAbbrev: !!(abRaw && (drug.name || '').toLowerCase().indexOf(abRaw.toLowerCase()) < 0)
  };
}

const ROW_COLS = [
  { key: 'name', label: 'ยา', w: '', align: 'left', flex: true },
  // 🚨 align คุมเฉพาะ "หัวคอลัมน์" ไม่ใช่ข้อมูลข้างใน — ตัวเลขในตารางชิดขวาเสมอเพื่อให้หลักตรงกัน
  //    พี่กันสั่ง 25 ส.ค. 2569 แยกกันคนละแบบ:
  //      จำนวน   → ให้หัวอยู่ "ตรงเลข" ไม่ใช่กลางคอลัมน์
  //      ราคา    → กลางคอลัมน์
  //      มูลค่า  → ตามเดิม (ชิดขวา เพราะข้างในชิดขวาสุดอยู่แล้ว)
  //      สถานะ   → กลางคอลัมน์
  //
  // 🚨 คอลัมน์จำนวนมีปุ่มดินสอกับที่ว่างต่อท้ายตัวเลขรวม 62px (26 + 26 + ช่องไฟ 5×2)
  //    หัวจึงต้องถอยขวาเข้ามาเท่านั้น บวกระยะขอบของตัวเลขอีก 7px = 69px
  //    ถ้าเปลี่ยนความกว้างปุ่มเมื่อไหร่ ต้องแก้เลขนี้ตามด้วย
  { key: 'qty', label: 'จำนวน', w: '220px', align: 'right', padRight: '69px' },
  { key: 'price', label: 'ราคา/หน่วย (฿)', w: '104px', align: 'center' },
  { key: 'value', label: 'มูลค่า (฿)', w: '124px', align: 'right' },
  { key: 'disposition', label: 'สถานะ', w: '150px', align: 'center' }
];

const ROW_VAL = {
  name: (r) => r.name || '',
  qty: (r) => Number(r.qty) || 0,
  price: (r) => Number(r.price) || 0,
  value: (r) => (Number(r.price) || 0) * (Number(r.qty) || 0),
  disposition: (r) => (r.disposition === 'reuse' ? 0 : 1)
};

// เรียงในเครื่อง · ไม่เรียง = เรียงตามลำดับที่กดเพิ่ม (เหมือนเดิม)
// ตัวหนังสือใช้ localeCompare('th') ไม่งั้น ก ข ค เรียงมั่ว
function sortRows(rows, key, dir) {
  if (!key || !ROW_VAL[key]) return rows;
  return rows.slice().sort((a, b) => {
    const va = ROW_VAL[key](a);
    const vb = ROW_VAL[key](b);
    let c;
    if (typeof va === 'number' && typeof vb === 'number') c = va - vb;
    else c = String(va).localeCompare(String(vb), 'th');
    if (c === 0) c = a.rid - b.rid;
    return dir === 'asc' ? c : -c;
  });
}

export function recordVals(app, d) {
  const st = d.st;
  const pending = st.pending;
  const pendReuse = st.pendingDisp === 'reuse';
  // 🚨 ช่องจำนวนฝั่งคอมคิดสูตรได้แล้ว ต้องใช้ evalQty ไม่ใช่ qtyNum
  //    qtyNum ใช้ parseFloat ซึ่งอ่าน "25+25" ได้แค่ 25 แล้วทิ้งที่เหลือเงียบ ๆ
  //    (ป๊อปอัปฝั่งมือถือใน vals/sheet.js ยังใช้ qtyNum เหมือนเดิม พี่กันสั่งไม่ให้แตะมือถือ)
  const pendQty = evalQty(st.qtyInput);
  const canAdd = !!pending && pendQty > 0;
  const fySaved = st.fy.saved;
  const pendValue = pending ? pending.price * pendQty : 0;
  const showExpr = isQtyExpr(st.qtyInput) && pendQty > 0;

  // สีความแรงในตารางรายการครั้งนี้ — ทายาชื่อเดียวกันคนละความแรงให้คนละสี
  // (Morphine 10 · 20 · 30 mg อยู่ในล็อตเดียวกันแล้วหยิบสลับกันได้)
  // 🚨 ต้องคิดจาก "แถวที่กองอยู่" ไม่ใช่จากผลค้นหา — คนละชุดข้อมูลกัน
  const rowStColorOf = makeStColorOf(st.rows.map((r) => ({ id: r.drugId, name: r.name })));

  const applyRowDisp = (rid, disp, reason) => {
    const rows = st.rows.map((x) => (x.rid === rid
      ? Object.assign({}, x, { disposition: disp, reason: disp === 'destroy' ? (reason || x.reason || '') : '' })
      : x));
    app.persist({ rows: rows });
    app.animateTo(sumReuse(rows));
  };

  // 🚨 กด "ทำลาย" ต้องถามเหตุผลก่อนเสมอ — กด "ใช้ต่อได้" ไม่ต้องถาม
  //    เพราะใช้ต่อได้คือสภาพปกติ ไม่มีอะไรต้องอธิบาย
  const setRowDisp = (rid, disp) => () => {
    if (disp !== 'destroy') return applyRowDisp(rid, disp);
    const row = st.rows.find((x) => x.rid === rid);
    app.askDestroyReason(row ? row.name : '', (reason) => applyRowDisp(rid, 'destroy', reason));
  };

  return {
    // ── ช่องค้นยา ────────────────────────────────────────────────────────────
    query: st.query,
    searchRef: app.searchRef,
    searchPlaceholder: 'ค้นชื่อยา (' + st.drugs.length + ' รายการ)',
    // พิมพ์ใหม่ = เด้งไฮไลต์กลับไปแถวแรกเสมอ
    onQuery: (e) => app.setState({ query: e.target.value, hi: 0 }),
    hasQuery: !!st.query,
    clearQuery: app.clearQuery,
    // ป้ายบอกคำที่ระบบแปลงให้ตอนลืมสลับแป้นพิมพ์ (พี่กันขอ 10 ส.ค. 2569)
    // โผล่ข้างปุ่ม ✕ ในช่องค้นหา — ผู้ใช้จะได้รู้ว่าระบบเข้าใจว่ากำลังหาคำว่าอะไร
    // ไม่ใช่งงว่าทำไมพิมพ์ไทยแล้วเจอยาภาษาอังกฤษ
    showSwap: !!d.qSwapped,
    swapLabel: d.qUsed,
    onSearchKey: (e) => { if (e.key === 'Enter' && d.results.length) { e.preventDefault(); app.openSheet(d.results[d.hi] || d.results[0]); } },
    onSearchKeyDesktop: (e) => {
      // ลูกศรขึ้น/ลงเลื่อนเลือกในรายการผลค้นหา — เดิมกด Enter ได้ตัวแรกเสมอ
      // ทั้งที่ระบบไฮไลต์แถวแรกไว้ ซึ่งสื่อว่าเลื่อนเลือกได้
      //
      // 🔄 วนรอบเหมือน ME-DRP (พี่กันสั่งให้ทำตาม) — ลงจากตัวสุดท้ายกลับตัวแรก
      //    ขึ้นจากตัวแรกไปตัวสุดท้าย · อยากดูตัวท้าย ๆ กดขึ้นทีเดียวถึงเลย
      //    ตัวเลื่อนอยู่ใน lib/drugSearch.js → moveHi()
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!d.results.length) return;
        e.preventDefault();
        app.setState({ hi: moveHi(d.hi, e.key === 'ArrowDown' ? 1 : -1, d.results.length) });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pending && pendQty > 0) { app.addInline(); return; }
        if (d.results.length) app.pickInline(d.results[d.hi] || d.results[0]);
      }
    },
    hasResults: d.results.length > 0,
    // 🚨 ต้องเช็ค !d.picked ด้วย (พี่กันแจ้งบั๊ก 10 ส.ค. 2569)
    //    พอกดเลือกยาสำเร็จ ระบบตั้ง results = [] เพื่อปิดรายการผลค้นหา
    //    ถ้าดูแค่ "results ว่าง" กล่อง "ไม่พบยาชื่อนี้" จะเด้งขึ้นทันทีหลังเลือกสำเร็จ
    //    ทั้งที่เพิ่งเลือกยาตัวนั้นไปหมาด ๆ
    noResults: !d.picked && d.q.length >= 2 && d.results.length === 0,
    noResultsHint: 'ไม่พบยาชื่อนี้ ลองพิมพ์ชื่อสามัญ',
    openOffListDrug: app.openOffListDrug,
    results: d.results.map((drug, i) => {
      // สีความแรง — ทายาที่ชื่อเดียวกันแต่ความแรงต่างกันให้คนละสี (พี่กันเคาะชุด 2)
      // ทำงานเฉพาะตอนผลค้นหามียาชื่อเดียวกันหลายรายการ · เจอตัวเดียวคงสีเทาเหมือนเดิม
      // เหตุผล: Morphine 10 · 20 · 30 mg หยิบสลับกันแล้วอันตราย ต้องแยกออกตั้งแต่ตอนกวาดตา
      // 🚨 สีเม็ดยาจริงมาก่อนสีที่ระบบสุ่มให้เสมอ (Warfarin — พี่กันสั่ง 25 ส.ค. 2569)
      //    สีที่ระบบสุ่ม (makeStColorOf) มีไว้แค่ "ทำให้ต่างกัน" ไม่ได้สื่อความหมายอะไร
      //    แต่สีเม็ดยาจริงคือสิ่งที่เภสัชกรถือในมือ ต้องตรงกันเป๊ะ
      const pill = pillColorOf(drug);
      const stColor = pill ? pill.color : d.stColorOf(drug);
      // 🚨 แยกชิ้นส่วนจาก "ข้อมูลดิบรายช่อง" ไม่ใช่จากการอ่านข้อความชื่อ
      //    บทเรียน 25 ส.ค. 2569: เดิมเดาจากข้อความ พอสูตรชื่อเปลี่ยนก็เดาผิดทันที
      //    ได้ "Morphine sulfate 10 mg/mL injection injection" ซ้ำสองรอบ และ (IR) หายไป
      //    ตอนนี้ทั้งผลค้นหา ตารางรายการ และหน้าประวัติ ใช้ nameParts ตัวเดียวกันหมด
      const npx = nameParts(drug, '');
      const sp = { base: npx.base, tail: npx.tail };
      const mk = markMatch(sp.base, d.qUsed);
      const rl = { release: npx.hasRelease ? npx.releaseLabel.slice(1, -1) : '' };
      const pc = { main: npx.strength, percent: npx.hasPercent ? npx.percentLabel.slice(1, -1) : '' };
      // ชื่อการค้า — ไฮไลต์คำค้นข้างในด้วย เพราะค้นจากชื่อการค้าได้แล้ว
      const bk = markMatch(drug.brand || '', d.qUsed);
      // ตัวย่อ — ไม่วาดถ้ามีอยู่ในชื่อยาอยู่แล้ว กัน "(HCTZ)(HCTZ)"
      const abRaw = (drug.abbrev || '').trim();
      const abShow = abRaw && drug.name.toLowerCase().indexOf(abRaw.toLowerCase()) < 0 ? abRaw : '';
      const abMk = markMatch(abShow, d.qUsed);
      return {
        name: drug.name,
        base: sp.base,
        strength: pc.main,
        // 🚨 ก้อนสั้นห้ามถูกตัดขาดกลางเวลาบรรทัดยาวเกิน
        //    "(40 + 200 mg/5 mL)" เคยตัด "(40 + 200" ค้างบรรทัดบน "mg/5 mL)" ตกบรรทัดล่าง
        //    อ่านแล้วสับสนว่าความแรงเท่าไหร่กันแน่ (ME-DRP แก้เรื่องเดียวกันไปแล้ว)
        //    แต่ก้อนที่ยาวจริง ๆ ต้องยอมให้ตัด ไม่งั้นล้นออกนอกจอมือถือ
        //    ที่ยาวสุดในคลังคือ "25 + 2 + 5000 mcg/1 mL + mg/1 mL + IU/1 mL" (42 ตัวอักษร)
        strengthNoWrap: fits(pc.main),
        // ตัวเลขความแรงแยกออกมาทาสี ส่วนหน่วยคงสีเทาเดิม — เน้นเฉพาะจุดที่ต่างกันจริง
        stNum: stColor ? numPart(pc.main) : '',
        stRest: stColor ? restPart(pc.main) : pc.main,
        stColor: stColor,
        // ป้ายสีเม็ดยาจริง — วงเล็บหลังชื่อ เช่น Warfarin (ส้ม) 2 mg
        pillLabel: pill ? pill.label : '',
        pillColor: pill ? pill.color : '',
        percentLabel: pc.percent ? '(' + pc.percent + ')' : '',
        hasPercent: !!pc.percent,
        // รูปแบบการออกฤทธิ์ — เอียง หนา วงเล็บ สีแดงอมชมพู (พี่กันเลือกแบบ ง)
        releaseLabel: rl.release ? '(' + rl.release + ')' : '',
        hasRelease: !!rl.release,
        mkBefore: mk[0],
        mkHit: mk[1],
        mkAfter: mk[2],
        // รูปแบบยา — วางต่อจากความแรง ก่อนชื่อการค้า (ลำดับเดียวกับ ME-DRP)
        form: (drug.form || '').trim(),
        formNoWrap: fits(drug.form),
        hasBrand: !!(drug.brand || '').trim(),
        brandNoWrap: fits(drug.brand),
        bdBefore: bk[0],
        bdHit: bk[1],
        bdAfter: bk[2],
        // ทางให้ยา — วางนำหน้าหน่วยนับในบรรทัดล่าง ตำแหน่งเดียวกับ ME-DRP
        route: (drug.route || '').trim(),
        // ตัวย่อที่เภสัชกรเรียกกันจริง (CPM · HCTZ) — วงเล็บสีม่วงต่อจากชื่อยา (พี่กันเลือกสีเอง)
        // ไฮไลต์คำค้นข้างในด้วย เพราะค้นด้วยตัวย่อได้แล้ว
        //
        // 🚨 ยาบางตัวมีตัวย่ออยู่ในชื่ออยู่แล้ว เช่น "Hydrochlorothiazide (HCTZ)"
        //    ถ้าวาดซ้ำจะได้ "Hydrochlorothiazide (HCTZ)(HCTZ)" — ตรวจก่อนว่ามีในชื่อไหม
        //    (ยังไม่ย้ายตัวย่อออกจากชื่อ เพราะ ME-DRP ยังไม่รู้จักช่องนี้ ดูสกิล pharmacy-web-logic)
        abbrev: abShow,
        hasAbbrev: !!abShow,
        abbrevNoWrap: fits(abShow),
        abBefore: abMk[0],
        abHit: abMk[1],
        abAfter: abMk[2],
        // มอคอัปโชว์ "หน่วย · คงคลัง 1234" ซึ่งเป็นเลขมั่วของเดโม ตัดออกแล้ว
        unitLabel: drug.unit,
        noPrice: !drug.hasPrice,
        // ยาที่ยังไม่ใส่ราคา ฝั่งขวาโชว์แค่ขีด — ข้อความเตือนอยู่ที่ป้ายแดงฝั่งซ้ายแล้ว
        // (ถ้าเขียนทั้งสองที่จะกลายเป็น "ยังไม่ใส่ราคา ยังไม่ใส่ราคา" ในแถวเดียว)
        priceLabel: drug.hasPrice ? drug.price.toFixed(2) + ' ฿' : '—',
        priceSub: drug.hasPrice ? 'ต่อ ' + drug.unit : '',
        priceColor: drug.hasPrice ? '#2f7d5d' : '#c0c5c1',
        rowBg: i === d.hi ? '#eef6f1' : '#fff',
        // ติด ref ไว้เฉพาะแถวที่ถูกไฮไลต์ เพื่อให้กรอบเลื่อนตามลูกศรขึ้น/ลง
        // (ตัวเลื่อนอยู่ใน componentDidUpdate ของ MedReturnApp)
        hiRef: i === d.hi ? app.hiRef : null,
        pick: () => app.openSheet(drug),
        pickInline: () => app.pickInline(drug)
      };
    }),

    // ── ยาที่คืนบ่อย ──────────────────────────────────────────────────────────
    frequent: st.favIds
      .map((id) => st.drugs.find((x) => x.id === id))
      .filter(Boolean)
      .slice(0, 6)
      .map((drug) => {
        // ใช้ตัวแยกชื่อตัวเดียวกับผลค้นหา — ตัวเดิมแยกยาสูตรผสมผิดจุด
        // ("Amoxicillin + Clavulanic acid 875 +" / "125 mg" มี + ห้อยท้าย)
        const sp = splitDrugName(drug.name);
        return {
          base: sp.base,
          strength: sp.strength || ' ',
          priceLabel: drug.price.toFixed(2) + ' ฿',
          priceColor: drug.hasPrice ? '#6b746e' : '#c2543c',
          // มือถือ = เปิดป๊อปอัปใส่จำนวน · คอม = ยัดเข้าช่องรอเพิ่มแล้วเด้งไปช่องจำนวน
          // (ให้เข้ากับเส้นทางคีย์บอร์ดของฝั่งคอม ไม่ต้องเปิดป๊อปอัปให้เสียจังหวะ)
          pick: () => app.openSheet(drug),
          pickWide: () => app.pickInline(drug)
        };
      }),
    hasFrequent: st.favIds.length > 0,
    emptyHint: st.favIds.length > 0
      ? 'ค้นชื่อยาด้านบน หรือแตะยาที่คืนบ่อย'
      : 'ค้นชื่อยาด้านบน — ตั้งยาที่คืนบ่อยได้ที่ปุ่ม ⋯ มุมขวาบน',

    // ── หน้าต่างเลือกเหตุผลที่ต้องทำลาย (ผลตรวจข้อ ส-8) ──────────────────────
    reasonOpen: !!st.reasonAsk,
    reasonDrugLabel: st.reasonAsk && st.reasonAsk.label
      ? st.reasonAsk.label
      : 'เลือกเหตุผลเพื่อบันทึกว่าทำไมยานี้ต้องถูกทำลาย',
    closeReason: app.closeReasonPick,
    reasonList: DESTROY_REASONS.map((r) => ({
      label: r.label,
      help: r.help,
      bg: '#fff',
      border: 'rgba(30,36,32,.13)',
      fg: '#1e2420',
      pick: () => app.pickDestroyReason(r.label)
    })),

    // ── แหล่งที่มา · วันที่ · HN ─────────────────────────────────────────────
    sources: SOURCES.map((s) => ({
      label: s.label,
      // พี่กันสั่งเปลี่ยนจากดำ (#1e2420 ของมอคอัป) เป็นเขียวเทลของธีม
      bg: st.source === s.key ? '#2f7d5d' : '#f0f1ee',
      // ธงบอกว่าปุ่มนี้ถูกเลือกอยู่ไหม — หน้าจอใช้เลือกคลาสสีตอนเอาเมาส์ชี้
      // 🚨 ปุ่มสลับสถานะต้องใช้คลาสคนละตัวตามสถานะ ใส่ตัวเดียวให้ทั้งคู่ไม่ได้
      on: st.source === s.key,
      fg: st.source === s.key ? '#fff' : '#414a44',
      // sourceTouched = ผู้ใช้แตะเองแล้ว · ใช้แยกจาก "ยังเป็นค่าเริ่มต้น"
      // 🚨 ย้ายออกจาก รพ.สต. ต้องล้างชื่อ รพ.สต. ทิ้งทันที ไม่ปล่อยให้ค้าง
      //    ไม่งั้นกลับมาเลือก รพ.สต. อีกครั้งจะเจอชื่อเก่าติ๊กไว้แล้วโดยไม่ได้ตั้งใจ
      pick: () => app.persist({
        source: s.key,
        sourceTouched: true,
        pcuSite: s.key === 'pcu' ? st.pcuSite : ''
      })
    })),

    // ── รพ.สต. ต้นทาง — โผล่เฉพาะตอนแหล่งที่มาเป็น รพ.สต. ──
    pcuOn: st.source === 'pcu',
    pcuSite: st.pcuSite || '',
    pcuSites: Array.isArray(st.pcuSites) ? st.pcuSites : [],
    onPcuSite: (e) => app.persist({ pcuSite: e.target.value || '' }),
    dateIso: st.date,
    dateMax: st.today,
    isBackdated: !!st.today && !!st.date && st.date !== st.today,
    // ติดธงว่าผู้ใช้เลือกวันเอง ตัวทวนวันจะได้ไม่ไปดึงกลับเป็นวันนี้ภายใน 1 นาที
    onDate: (e) => app.persist({ date: e.target.value || st.today, dateTouched: true }),
    hn: st.hn,
    onHn: (e) => app.setState({ hn: e.target.value.replace(/[^0-9]/g, '') }),
    showMore: st.showMore,
    toggleMore: () => app.setState({ showMore: !st.showMore }),

    // ── แถวใส่ยาบนคอม (พิมพ์ → Enter → ใส่จำนวน → Enter) ─────────────────────
    qtyRef: app.qtyRef,
    qtyInput: st.qtyInput,
    // รับทศนิยมได้ 2 ตำแหน่ง — ยาน้ำครึ่งขวด ยาแบ่งครึ่งเม็ด
    // (เดิมกรอง [^0-9] ทิ้ง พิมพ์ 2.5 กลายเป็น 25 ซึ่งผิดเป็นสิบเท่า)
    // และรับเครื่องหมายคิดเลขกับวงเล็บด้วย — 25+25 · 3*(10+2) (พี่กันสั่ง 25 ส.ค. 2569)
    onQtyInput: (e) => app.setState({ qtyInput: cleanQtyExpr(e.target.value) }),
    onQtyKey: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // จังหวะแรก: ยังเป็นสูตรอยู่ → คิดให้ดูก่อน ยังไม่เพิ่มรายการ (พี่กันสั่ง)
        if (isQtyExpr(st.qtyInput) && pendQty > 0) { app.resolveQty(); return; }
        app.addInline();
        return;
      }
      if (e.key === 'Escape' && st.calcOpen) { e.preventDefault(); app.closeCalc(); }
    },
    addInline: app.addInline,

    // ── ช่องเฉลยสูตรแล้ว "25+25=50" (พี่กันสั่ง 25 ส.ค. 2569) ────────────────
    // ช่องกรอกธรรมดาทำตัวหนา/สีต่างเฉพาะบางส่วนไม่ได้ จึงวาดข้อความซ้อนทับแทน
    // แล้วทำตัวอักษรใน input ให้โปร่งใส (เห็นแต่ขีดกะพริบ) — ตำแหน่งตรงกันเป๊ะเพราะใช้ฟอนต์เดียวกัน
    qtyResolved: isResolvedQty(st.qtyInput) && pendQty > 0,
    qtyExprPart: splitResolved(st.qtyInput).expr,
    qtyAnswerPart: splitResolved(st.qtyInput).answer,

    // ── เครื่องคิดเลขในช่องจำนวน (คอมเท่านั้น) ───────────────────────────────
    calcOpen: !!st.calcOpen,
    toggleCalc: app.toggleCalc,
    calcBg: st.calcOpen ? '#2f7d5d' : '#f0f3ef',
    calcFg: st.calcOpen ? '#fff' : '#6b746e',
    // แป้นไม่ได้คิดเลขเอง — แค่พิมพ์ตัวอักษรลงช่อง แล้ว evalQty คิดให้ตอนกด Enter
    // ทำแบบนี้เพื่อให้ "พิมพ์เอง" กับ "กดแป้น" เดินทางเดียวกัน ไม่มีทางให้ผลต่างกัน
    calcKeys: CALC_KEYS.map((k) => ({
      k: k.k,
      kind: k.kind || '',
      press: k.act === 'eq' ? app.calcEquals
        : k.act === 'back' ? () => app.calcPress('back')
        : k.act === 'clear' ? () => app.calcPress('C')
        : () => app.calcPress(k.send !== undefined ? k.send : k.k)
    })),
    // จอเล็กบนแป้น — บอกสูตรที่พิมพ์ไว้กับผลลัพธ์สด เห็นก่อนกดว่าได้เท่าไร
    calcExpr: st.qtyInput ? exprText(st.qtyInput) : '',
    calcResult: String(pendQty || 0),

    // ── ราคารวมของรายการที่กำลังจะเพิ่ม (แบบ ก — กล่องท้ายแถว พี่กันเคาะ) ─────
    // เดิมราคาไปอยู่ในข้อความจาง 11.5px ใต้ช่อง ซึ่งเป็นตัวเลขที่สำคัญที่สุดในแถวนั้น
    // แต่จางที่สุดในหน้าจอ — เภสัชกรต้องเพ่งอ่านทุกครั้งก่อนกดเพิ่ม
    sumLabel: pendValue > 0 ? money(pendValue) : '0.00 ฿',
    sumOn: pendValue > 0,
    sumBg: pendValue > 0 ? '#e7f2ec' : '#f4f5f3',
    sumBorder: pendValue > 0 ? 'rgba(47,125,93,.22)' : 'rgba(30,36,32,.10)',
    sumKeyFg: pendValue > 0 ? '#4e8f70' : '#6f7873',
    sumFg: pendValue > 0 ? '#2f7d5d' : '#b8bdb9',
    // ปุ่ม "เพิ่ม" — พี่กันสั่งเปลี่ยนจากดำเป็นเขียวเทลของธีม
    // 🎨 ตอนกดไม่ได้เป็นเขียวจาง = สีของปุ่มตัวเองที่จางลง ไม่ใช่เทาและไม่ใช่ครีม
    //    พี่กันสั่ง 27 ส.ค. 2569: "ปุ่มมันจริง ๆ สีเขียว ก็แค่เปลี่ยนสีเขียวปกติ"
    //    🚨 ปุ่มนี้ไม่มีแอนิเมชัน — แอนิเมชันใส่เฉพาะปุ่มที่พี่กันสั่งเองเท่านั้น
    addBg: canAdd ? '#2f7d5d' : '#eaf3ee',
    addFg: canAdd ? '#fff' : '#7d9c8d',
    addHintFg: canAdd ? 'rgba(255,255,255,.5)' : 'rgba(125,156,141,.6)',
    addBorder: canAdd ? '1px solid transparent' : '1px solid rgba(47,125,93,.16)',
    addOn: canAdd,
    searchBorder: pending ? '#2f7d5d' : 'rgba(30,36,32,.16)',
    pendingUnit: pending ? ' (' + pending.unit + ')' : '',
    pendReuseBg: pendReuse ? '#e3f0e8' : 'transparent',
    pendReuseOn: pendReuse,
    pendReuseFg: pendReuse ? '#2f7d5d' : '#6f7873',
    pendDestroyBg: pendReuse ? 'transparent' : '#fbe4dd',
    pendDestroyFg: pendReuse ? '#6f7873' : '#c2543c',
    setPendingReuse: () => app.setState({ pendingDisp: 'reuse', pendingReason: '' }),
    // ยังไม่ได้กดเพิ่มเข้ารายการ แต่ถามเหตุผลตั้งแต่ตอนนี้เลย
    // จะได้ติดไปกับแถวทันทีที่กดเพิ่ม ไม่ต้องกลับมาไล่กรอกทีหลัง
    setPendingDestroy: () => app.askDestroyReason(
      st.pending ? st.pending.name : '',
      (reason) => app.setState({ pendingDisp: 'destroy', pendingReason: reason })
    ),
    // ราคารวมถูกย้ายไปกล่องท้ายแถวแล้ว บรรทัดนี้จึงไม่ต้องบอกราคาซ้ำ
    // แต่ถ้าพิมพ์เป็นสูตร ต้องกางให้เห็นว่าคิดได้เท่าไร ก่อนกด Enter
    desktopHint: !pending
      ? 'พิมพ์ชื่อยา → Enter เลือกผลแรก → ใส่จำนวน → Enter เพิ่มรายการ แล้วกลับไปช่องยาเอง · ช่องจำนวนพิมพ์ + − × ÷ และวงเล็บได้'
      : pendQty > 0
        ? (showExpr ? exprText(st.qtyInput) + ' = ' + pendQty + ' ' + pending.unit + ' · ' : '')
          + 'Enter เพื่อเพิ่ม ' + pending.name + ' ' + pendQty + ' ' + pending.unit
        : 'เลือก ' + pending.name + ' แล้ว — ใส่จำนวนเป็น ' + pending.unit + ' แล้วกด Enter',

    // ── รายการที่กองอยู่ในครั้งนี้ ───────────────────────────────────────────
    // หัวตารางกดเรียงได้ ชุดเดียวกับหน้าประวัติ (พี่กันสั่งให้เหมือนกัน)
    rowCols: ROW_COLS.map((c) => {
      const on = st.rowSortKey === c.key;
      return {
        key: c.key,
        label: c.label,
        w: c.w,
        flex: !!c.flex,
        padRight: c.padRight || '',
        align: c.align,
        arrow: on ? (st.rowSortDir === 'asc' ? '▲' : '▼') : '↕',
        arrowColor: on ? '#2f7d5d' : 'rgba(30,36,32,.28)',
        fg: on ? '#2f7d5d' : '#414a44',
        pick: () => app.setRowSort(c.key)
      };
    }),
    rows: sortRows(st.rows, st.rowSortKey, st.rowSortDir).map((r) => {
      const reuse = r.disposition === 'reuse';
      const drug = st.drugs.find((x) => x.id === r.drugId) || r;
      const editing = st.editQtyRid === r.rid;
      // ชื่อยาในตารางต้องหน้าตาเหมือนตอนค้นหาเป๊ะ — สีความแรง · รูปแบบยา · ER · ชื่อการค้า
      // (พี่กันสั่ง 25 ส.ค. 2569: "ชื่อเต็ม เราอยากได้เหมือนตอนค้นหา พวกสีต่างๆ ควรมาด้วย")
      // 🚨 ยาที่ถูกซ่อนไปหลังจากกรอกแล้ว จะหาใน st.drugs ไม่เจอ → ตกไปใช้ชื่อที่แช่ไว้ในแถว
      // 🚨 สีเม็ดยาจริงมาก่อนสีที่ระบบสุ่มให้เสมอ (Warfarin — พี่กันสั่ง 25 ส.ค. 2569)
      //    สีที่ระบบสุ่มมีไว้แค่ "ทำให้ต่างกัน" แต่สีเม็ดยาคือสิ่งที่เภสัชกรถือในมือจริง
      const pill = drug.name ? pillColorOf(drug) : null;
      const npBase = nameParts(drug.name ? drug : { name: r.name },
        pill ? pill.color : rowStColorOf({ id: r.drugId, name: r.name }));
      const np = Object.assign({}, npBase, {
        // ตัวกลางวาดชื่อยา (pages/drugname.jsx) ต้องการช่องพวกนี้ครบ
        mkBefore: npBase.base, mkHit: '', mkAfter: '',
        abBefore: npBase.abbrev, abHit: '', abAfter: '',
        bdBefore: npBase.brand, bdHit: '', bdAfter: '',
        pillLabel: pill ? pill.label : '',
        pillColor: pill ? pill.color : '',
        strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
      });
      return {
        rid: r.rid,
        name: r.name,
        np: np,
        detail: r.qty + ' ' + r.unit + ' × ' + r.price.toFixed(2),
        qtyLabel: r.qty + ' ' + r.unit,

        // ── แก้จำนวนได้ทั้งที่กด Enter ลงมาแล้ว (คอมเท่านั้น) ──────────────
        // พี่กันสั่ง 25 ส.ค. 2569 — เดิมต้องเปิดป๊อปอัปหรือลบทิ้งแล้วเพิ่มใหม่
        // ช่องนี้พิมพ์สูตรได้เหมือนช่องด้านบน (55+10 · 12*4)
        // 🚨 แก้ได้เฉพาะจำนวน ราคาที่แช่ไว้ในแถวห้ามแตะ
        editing: editing,
        editText: editing ? st.editQtyText : '',
        editUnit: r.unit,
        // ผลลัพธ์สดใต้ช่องตอนพิมพ์สูตร — เห็นก่อนกด Enter ว่าจะได้เท่าไร
        editPreview: editing && isQtyExpr(st.editQtyText) && evalQty(st.editQtyText) > 0
          ? exprText(st.editQtyText) + ' = ' + evalQty(st.editQtyText) + ' ' + r.unit
          : '',
        // ปุ่ม ✓ กดได้เฉพาะตอนที่ค่าเปลี่ยนจริง (พี่กันสั่ง 25 ส.ค. 2569)
        // ค่าเท่าเดิมแล้วยังกดได้ = ผู้ใช้ไม่รู้ว่าตกลงไปแล้วมีอะไรเปลี่ยนหรือเปล่า
        // และ 0 ก็กดไม่ได้ เพราะจำนวนศูนย์ไม่ใช่การแก้ แต่คือการลบซึ่งมีปุ่ม ✕ ของมันอยู่แล้ว
        editCanSave: editing && evalQty(st.editQtyText) > 0 && evalQty(st.editQtyText) !== Number(r.qty),
        editOkBg: editing && evalQty(st.editQtyText) > 0 && evalQty(st.editQtyText) !== Number(r.qty) ? '#2f7d5d' : '#e9ebe8',
        editOkFg: editing && evalQty(st.editQtyText) > 0 && evalQty(st.editQtyText) !== Number(r.qty) ? '#fff' : '#b8bdb9',
        startEditQty: () => app.startEditQty(r.rid, r.qty),
        onEditQty: (e) => app.changeEditQty(e.target.value),
        onEditQtyKey: (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // จังหวะแรก: ยังเป็นสูตร → คิดให้ดูก่อน · จังหวะสอง: ตกลง (กติกาเดียวกับช่องด้านบน)
            if (isQtyExpr(st.editQtyText) && evalQty(st.editQtyText) > 0) { app.resolveEditQty(); return; }
            app.commitEditQty();
          } else if (e.key === 'Escape') { e.preventDefault(); app.cancelEditQty(); }
        },
        commitEditQty: app.commitEditQty,
        cancelEditQty: app.cancelEditQty,
        priceLabel: r.price.toFixed(2),
        deskBg: reuse ? '#fff' : '#fdf7f5',
        valueLabel: money(r.price * r.qty),
        color: reuse ? '#2f7d5d' : '#c2543c',
        border: reuse ? 'rgba(30,36,32,.08)' : 'rgba(194,84,60,.22)',
        pillBg: reuse ? '#f0f1ee' : '#fbe4dd',
        reuseBg: reuse ? '#fff' : 'transparent',
        reuseOn: reuse,
        reuseFg: reuse ? '#2f7d5d' : '#c9a096',
        destroyBg: reuse ? 'transparent' : '#fff',
        destroyFg: reuse ? '#6f7873' : '#c2543c',
        // เหตุผลที่ทำลาย — โผล่ใต้ชื่อยาเฉพาะแถวที่ทำลาย (พี่กันถาม 26 ส.ค. 2569
        // ว่า "เหตุผลจะขึ้นที่ไหน มันควรแสดงไหม แต่แสดงยังไงดี")
        // 🚨 ไม่เพิ่มคอลัมน์ใหม่ — ตารางมี 7 คอลัมน์แล้วและพี่กันสั่งห้ามตัด HN ออก
        //    วางเป็นบรรทัดที่สองใต้ชื่อยาแทน ซึ่งเป็นที่เดียวที่ยังมีที่เหลือจริง
        reasonLabel: r.disposition === 'destroy' ? (r.reason || '') : '',
        setReuse: setRowDisp(r.rid, 'reuse'),
        setDestroy: setRowDisp(r.rid, 'destroy'),
        // ราคาที่โชว์ในป๊อปอัปต้องเป็นราคาของแถวนั้น ไม่ใช่ราคาปัจจุบันของยา
        edit: () => app.openSheet(
          Object.assign({}, drug, { id: r.drugId, name: r.name, unit: r.unit, price: r.price }),
          'row', r.rid, r.qty, r.disposition
        ),
        // กดแล้วเปิดป๊อปอัปยืนยันก่อน ไม่ลบทันที (พี่กันสั่ง — ปุ่ม ✕ กดพลาดง่าย)
        // ตัวลบจริงอยู่ที่ handlers/record.js ตามสัญญาโครงสร้าง (vals ห้าม setState เอง)
        remove: () => app.askRemoveRow(r)
      };
    }),
    noRows: st.rows.length === 0,
    rowCount: st.rows.length,
    rowsLabel: 'รายการในครั้งนี้ ' + st.rows.length,

    // ปุ่มล้างทั้งหมด — โผล่เฉพาะตอนมีของให้ล้าง (พี่กันขอ · มีป๊อปอัปยืนยันอีกชั้น)
    canClearAll: st.rows.length > 0,
    askClearAll: app.askClearAll,

    // ── กล่อง "ล็อตนี้" ในแผงขวาฝั่งคอม (แบบ ก ที่พี่กันเลือก) ────────────────
    // จุดสุดท้ายก่อนข้อมูลเข้าฐาน ราคาถูกแช่แข็งทันทีที่กดบันทึก แก้ทีหลังยาก
    // ให้ทวนได้ว่ากำลังจะส่งอะไร กี่ตัว ใช้ต่อกี่ ทำลายกี่ ก่อนกดปุ่ม
    lotItemsLabel: st.rows.length + ' ตัว',
    // 🚨 ห้ามรวมจำนวนข้ามหน่วยนับแล้วเขียนว่า "414 หน่วย" (พี่กันทักว่าหน่วยอะไร)
    //    เอาเม็ดไปบวกกับขวดกับหลอด ได้ตัวเลขที่ไม่มีความหมายอะไรเลย
    //    แยกตามหน่วยนับจริงแทน เภสัชกรถึงจะทวนกับของตรงหน้าได้
    lotUnitsLabel: (() => {
      const by = {};
      for (const r of st.rows) {
        const u = (r.unit || 'หน่วย').trim();
        by[u] = (by[u] || 0) + (Number(r.qty) || 0);
      }
      const list = Object.keys(by).map((u) => ({ u, n: by[u] })).sort((a, b) => b.n - a.n);
      if (!list.length) return '';
      // โชว์ 2 หน่วยแรก ที่เหลือยุบเป็น "และอีก N"
      // 2 ตัวเพราะกล่องกว้างแค่ 238px ถ้าใส่ 3 ตัวจะตกบรรทัดที่สอง
      // แล้วแผงขวาสูงเกินจอ 768 ของพี่กัน ต้องเลื่อนหาแหล่งที่มา
      const head = list.slice(0, 2).map((x) => qtyText(x.n) + ' ' + x.u).join(' · ');
      return list.length > 2 ? head + ' · และอีก ' + (list.length - 2) : head;
    })(),
    lotReuseLabel: String(st.rows.filter((r) => r.disposition === 'reuse').length),
    lotDestroyLabel: String(st.rows.filter((r) => r.disposition === 'destroy').length),
    // 🚨 เลขล็อตออกโดยฐานข้อมูลตอนกดบันทึก (mr_next_lot_no) เดาล่วงหน้าไม่ได้
    //    เครื่องอื่นอาจกดบันทึกแทรกก่อน แล้วเลขที่เดาไว้จะผิด
    //    จึงโชว์เลขจริงเฉพาะหลังบันทึกสำเร็จ ระหว่างกรอกบอกตรง ๆ ว่ายังไม่มีเลข
    lotNoLabel: st.lastLot || 'ระบบออกให้ตอนกดบันทึก',
    lotNoTitle: 'เลข Lot',
    lotNoIsReal: !!st.lastLot,

    // ── ตัวเลขสรุปท้ายจอ ─────────────────────────────────────────────────────
    animSavedLabel: st.animSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    lostLabel: d.lost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    savedBarW: d.gross ? (d.saved / d.gross * 100) + '%' : '0%',
    lostBarW: d.gross ? (d.lost / d.gross * 100) + '%' : '0%',
    // ย่อจาก "ของมูลค่าที่คืนมา" เหลือ "จาก" เพื่อให้อยู่บรรทัดเดียวในแผงกว้าง 238px
    // ตกบรรทัดที่สองเมื่อไหร่ แผงขวาจะสูงเกินจอ 768 ทันที
    proportionLabel: d.gross
      ? 'ใช้ต่อได้ ' + Math.round(d.saved / d.gross * 100) + '% จาก ' + money(d.gross)
      : 'ยังไม่มีมูลค่าในครั้งนี้',
    cumulativeLabel: money(fySaved),
    fyLabel: String(st.fyYear || ''),
    saveFailed: st.saveFailed,
    saveLabel: st.saving
      ? 'กำลังบันทึก'
      : st.rows.length === 0 ? 'เลือกยาก่อน'
        : st.saveFailed ? 'ลองส่งใหม่'
          : 'บันทึก ' + st.rows.length + ' รายการ',
    // 🎨 ยังไม่เลือกยา = ครีมอมเหลือง ไม่ใช่เทา (พี่กันสั่ง 27 ส.ค. 2569 ว่าไม่ชอบสีเทา)
    saveBg: st.rows.length === 0 ? '#fdf6e9' : st.saveFailed ? '#1e2420' : '#2f7d5d',
    saveBorder: st.rows.length === 0 ? '1px solid rgba(150,101,15,.22)' : '1px solid transparent',
    // กดได้ = พื้นเขียวทึบหรือดำ ต้องมีสีตอนชี้ · ไม่มีรายการ = เทา ไม่ต้องมี
    saveOn: st.rows.length > 0,
    saveFg: st.rows.length === 0 ? '#96650f' : '#fff',
    // 🚨 กดบันทึกครั้งแรก = เปิดป๊อปยืนยันก่อน (พี่กันสั่ง 25 ส.ค. 2569)
    //    แต่ตอน "ลองส่งใหม่" หลังเน็ตหลุด ให้ส่งเลย ไม่ต้องยืนยันซ้ำ
    //    เพราะผู้ใช้เพิ่งยืนยันไปเมื่อกี้ ข้อมูลชุดเดิมทุกอย่าง
    onSave: st.saveFailed ? app.save : app.askSave,
    priceAsOfLabel: 'ราคา ณ ' + (st.date ? thaiDate(st.date) : '—')
  };
}
