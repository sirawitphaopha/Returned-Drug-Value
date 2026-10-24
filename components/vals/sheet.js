// ค่าของป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 1414–1441)
import { PRESETS, money } from '@/lib/format';
import { cleanQty, evalQty, isQtyExpr, isResolvedQty, DESTROY_REASONS, destroyReasonHelp, MAX_QTY } from '../helpers';
import { pillColorOf } from '@/lib/drugPillColors';
import { nameParts, makeStColorOf } from './record';

// ── ปุ่มคิดเลขฝั่งมือถือ (พี่กันเลือกแบบ ค · 24 ต.ค. 2569) ────────────────────
//   "ที่โหมดมือถือ ตรงที่ให้กรอกเลข เราอยากให้มันเป็นเครื่องคิดเลขได้ เเต่ขอเเค่ปุ่ม + - และปุ่มเอาเท้อพอ"
//   "ระบบรันตัวเลขตอนกด + ไปเรื่อยๆจะเหมือนในเเบบเดสท๊อปเลยนะ"
//   มอคอัป docs/mockups/sheet-calc-2026-10-24.html — แถบปุ่ม + − = ติดบนแป้นพิมพ์
//
// 🚨 ใช้ evalQty ตัวเดียวกับช่องจำนวนฝั่งคอม ห้ามเขียนตัวคิดเลขแยก
//    ตัวเลขรวมจึงขึ้นตรงกับฝั่งคอมทุกจังหวะ (กติกาข้อ 3.27 ของ CLAUDE.md ใช้ครบ)
// 🚨 แถบปุ่มโผล่เฉพาะฝั่งมือถือ — ฝั่งคอมใช้ป๊อปนี้ตอนแก้รายการจากหน้าประวัติ ห้ามเปลี่ยนแม้แต่จุดเดียว
//    ⚠️ evalQty กับ qtyNum ให้ค่าเท่ากันทุกตัวกับเลขล้วนที่ cleanQty ปล่อยผ่าน จึงใช้ evalQty ได้ทั้งสองฝั่ง
const CALC_KEYS = [
  { k: '+', label: 'ใส่เครื่องหมายบวก', op: '+' },
  { k: '−', label: 'ใส่เครื่องหมายลบ', op: '-' },
  { k: '=', label: 'คิดผลรวม', eq: true }
];

// สูตรยาวจนล้นช่อง ให้ตัวเลขย่อลงทีละขั้น (มอคอัปเขียนไว้ว่า "สูตรยาวจนล้นช่อง ตัวเลขจะย่อลงเอง")
// เกณฑ์มาจากความกว้างช่องจริงบนจอ 375–390 จุด (ราว 207–222 จุด) กับตัวเลขกว้างราว 0.6 เท่าของขนาดตัวอักษร
// ยาวเกินขั้นสุดท้ายแล้ว ช่องเลื่อนตามขีดกะพริบไปท้ายสูตรเอง และบรรทัดใต้ช่องบอกยอดรวมอยู่เสมอ
function calcFont(raw) {
  const n = String(raw || '').length;
  if (n <= 8) return 40;
  if (n <= 10) return 34;
  if (n <= 12) return 28;
  return 24;
}

// ── ชื่อยาบนหัวป๊อป — สีตามสกิล drug-display เหมือนทุกที่ในเว็บ ────────────────
//   พี่กันสั่ง 24 ต.ค. 2569: "กับชื่อยาที่ขึ้นตรงนี้ สีไม่ตามสกิลนะ มันต้องขึ้นเหมือนเว็บ"
//   เดิมเป็นข้อความดำล้วน · Warfarin 2 mg ไม่มีสีส้มของเม็ดยา ยาผสมแยกความแรงไม่ออก
//
// 🚨 หาข้อมูลดิบจากคลังด้วยรหัสยาเสมอ ไม่ใช้ก้อนยาที่ส่งเข้ามาตรง ๆ
//    เปิดจากหน้าประวัติ ก้อนยามีแค่ { id, name, unit, price } ไม่มีช่องดิบให้แยกสี
//    ยานอกบัญชีที่พิมพ์ชื่อเอง (ไม่มีรหัส) → วาดเป็นข้อความธรรมดา ไม่มีอะไรให้เดา
// 🚨 สีความแรงคิดจากคลังยาทั้งชุด แบบเดียวกับตารางรายการครั้งนี้ (vals/record.js → rowStColorOf)
//    ยาตัวเดียวกันจึงหน้าตาเหมือนกันทั้งตอนค้น ตอนใส่จำนวน และหลังเข้าตาราง
//    สีเม็ดยาจริงมาก่อนสีที่ระบบสุ่มให้เสมอ
//
// ── ขนาดตัวอักษรยืดหยุ่นตามชื่อยา — สูงไม่เกิน 4 บรรทัด ────────────────────────
//   พี่กันสั่ง 24 ต.ค. 2569: "งั้น สามารถลดขนาดได้ ยืดหยุ่นตามชื่อยา"
//   แล้วสั่งต่อ "เราอยากให้มันสูงสุดแค่ 3 บรรทัด ที่เหลือ ลดขนาดให้หมด"
//   ลองแล้วยาชื่อยาวเล็กเหลือ 8–10 จุด (Augmentin บนจอ 360 ได้ 10.5) พี่กันเลยเคาะ "งั้น 4 บรรทัดละกัน"
//
//   ยาชื่อสั้นได้ 17 เท่าเดิม · ชื่อที่ยาวเกิน 4 บรรทัด ย่อทีละ 0.25 จุดจนเหลือ 4 บรรทัด
//   และไม่มีคำไหนขาดกลางคำ (เดิม "Sulfamethoxazol / e" เพราะช่องแคบกว่าคำ)
//
// 🚨 นับบรรทัดด้วยการจำลองการตัดบรรทัด ไม่ใช่ประมาณจากความยาวรวม
//    ชื่อยาใช้ Roboto Mono ทุกตัวอักษรกว้าง 0.6 เท่าของขนาดพอดี (วัดจริง 193.8 จุด / 19 ตัว / 17px)
//    จึงรู้ความกว้างแต่ละก้อนได้แม่นโดยไม่ต้องวัดจอ · จุดตัดที่จำลอง = ช่องว่าง · หลังขีด · ระหว่างชิ้น
//    ถ้าพลาด ผลจะเอียงไปทาง "บรรทัดเกิน" (ย่อเล็กกว่าจำเป็นนิดหน่อย) ไม่มีทางเกินเพดานบนจอจริง
// 🚨 ต้องจำลองให้ตรงกับตัววาด — ระหว่างชิ้นมีจุดตัดบรรทัด (renderDrugName ส่ง breaks) และ margin ซ้าย
//    ในชื่อสามัญตัดที่ช่องว่าง · ก้อนที่วางในบรรทัดเดียวได้ทั้งก้อนใส่ nowrap ห้ามตัดกลาง
//    ก้อนที่ยาวเกินบรรทัด (ความแรงยาหยอดตา 42 ตัว) ต้องยอมให้ตัดที่ช่องว่าง (กฎข้อ 3.19)
// 🚨 ความกว้างช่องมาจากการวัดจริง — กลุ่มปุ่มขวามือถือ 155.6 + ช่องไฟ 8 + ระยะขอบป๊อป 20×2 = 204
//    ฝั่งคอม (ไม่ได้บีบ) กลุ่มปุ่ม 187 + ช่องไฟ 12 + 40 = 240 · แก้ขนาดปุ่มเมื่อไหร่ต้องแก้เลขนี้ตาม
const NAME_MAX = 17;
const NAME_FLOOR = 8;
const NAME_LINES = 4;
const MONO = 0.6;
// สระบนล่างและวรรณยุกต์ไทยไม่กินที่ในแนวนอน ไม่นับ
const glyphs = (s) => String(s || '').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length;
const words = (s) => String(s || '').split(/\s+/).filter(Boolean);
// เบราว์เซอร์ตัดบรรทัดหลังขีดได้ "(Co-|trimoxazole)" · ไม่นับจุดนี้แล้วตัวคิดเผื่อเกินจนตัวอักษรเล็กเกินจำเป็น
// 🚨 ห้ามใช้ lookbehind (?<=…) ฝั่งเบราว์เซอร์ — iPhone ก่อน iOS 16.4 อ่านไม่ออกแล้วพังทั้งเว็บ
const pieces = (w) => w.match(/[^-]+-?|-/g) || [w];
// แตกคำเป็นหน่วยวาง — ชิ้นแรกของคำมีช่องว่างคั่นหน้า (ถ้าไม่ใช่คำแรก) · ชิ้นหลังขีดต่อกันไม่มีช่องว่าง
const wordUnits = (text, cw, m) => {
  const out = [];
  words(text).forEach((w, i) => pieces(w).forEach((p, k) => out.push({
    w: glyphs(p) * cw + (i === 0 && k === 0 ? m : 0),
    gap: i > 0 && k === 0,
    brk: i > 0 || k > 0
  })));
  return out;
};

// ชิ้นส่วนเรียงตามที่ renderDrugName วาด · m = margin ซ้ายของชิ้น · key = ช่องที่คุม nowrap ได้
function nameChunks(np) {
  return [
    { key: 'abbrev', text: np.hasAbbrev ? '(' + np.abbrev + ')' : '', m: 5 },
    { key: '', text: np.pillLabel ? '(' + np.pillLabel + ')' : '', m: 5, fixed: true },
    { key: 'strength', text: np.strength, m: 6 },
    { key: '', text: np.percentLabel, m: 5, fixed: true },
    { key: 'form', text: np.form, m: 6 },
    { key: '', text: np.releaseLabel, m: 5, fixed: true },
    { key: 'brand', text: np.hasBrand ? '(' + np.brand + ')' : '', m: 6 }
  ].filter((x) => x.text);
}

// จำลองการตัดบรรทัดที่ขนาด size → { lines, wrap: ชิ้นไหนวางทั้งก้อนได้ }
function layoutAt(np, size, avail) {
  const cw = MONO * size;
  const wrap = {};
  // หน่วยวาง: w = ความกว้าง · gap = มีช่องว่างคั่นจากหน่วยก่อนหน้า · brk = ตัดบรรทัดก่อนหน่วยนี้ได้
  const units = wordUnits(np.base, cw, 0);
  nameChunks(np).forEach((c) => {
    const whole = glyphs(c.text) * cw + c.m;
    if (c.fixed || whole <= avail) {
      if (c.key) wrap[c.key] = true;
      units.push({ w: whole, gap: false, brk: true });
    } else {
      if (c.key) wrap[c.key] = false;
      wordUnits(c.text, cw, c.m).forEach((u) => units.push(Object.assign(u, { brk: true })));
    }
  });
  let lines = 1;
  let x = 0;
  units.forEach((u) => {
    const add = (x > 0 && u.gap ? cw : 0) + u.w;
    if (x > 0 && u.brk && x + add > avail) { lines += 1; x = 0; }
    x += x > 0 ? add : u.w;
    // หน่วยเดียวยาวเกินบรรทัด — เบราว์เซอร์ตัดกลางคำเอง (overflow-wrap:anywhere)
    while (x > avail) { lines += 1; x -= avail; }
  });
  return { lines: lines, wrap: wrap };
}

function fitName(np, avail) {
  let size = NAME_MAX;
  let lay = layoutAt(np, size, avail);
  // ห้ามมีคำในชื่อสามัญที่ยาวเกินบรรทัด (จะขาดกลางคำ) และสูงไม่เกิน NAME_LINES บรรทัด
  const longest = Math.max(0, ...words(np.base).flatMap(pieces).map(glyphs));
  while (size > NAME_FLOOR && (lay.lines > NAME_LINES || MONO * size * longest > avail)) {
    size -= 0.25;
    lay = layoutAt(np, size, avail);
  }
  return {
    size: size,
    lines: lay.lines,
    strengthNoWrap: lay.wrap.strength !== false,
    formNoWrap: lay.wrap.form !== false,
    brandNoWrap: lay.wrap.brand !== false,
    abbrevNoWrap: lay.wrap.abbrev !== false
  };
}

function sheetNameParts(st, drug, avail) {
  const master = drug && drug.id != null ? (st.drugs || []).find((x) => x.id === drug.id) : null;
  if (!master) return { name: drug ? drug.name : '', size: NAME_MAX };
  const pill = pillColorOf(master);
  const np = nameParts(master, pill ? pill.color : makeStColorOf(st.drugs || [])(master));
  const full = Object.assign({}, np, {
    mkBefore: np.base, mkHit: '', mkAfter: '',
    abBefore: np.abbrev, abHit: '', abAfter: '',
    bdBefore: np.brand, bdHit: '', bdAfter: '',
    pillLabel: pill ? pill.label : '',
    pillColor: pill ? pill.color : ''
  });
  return Object.assign(full, fitName(full, avail));
}

export function sheetVals(app, d) {
  const st = d.st;
  const sheet = st.sheet;
  const qty = evalQty(st.sheetQty);
  const reuse = st.sheetDisp === 'reuse';
  const calc = !d.wide;
  const raw = String(st.sheetQty || '');
  const resolved = calc && isResolvedQty(raw) && qty > 0;
  const nameFit = sheet
    ? sheetNameParts(st, sheet.drug, calc ? Math.min(st.vw || 390, 520) - 204 : 280)
    : null;

  return {
    sheetOpen: !!sheet,
    closeSheet: app.closeSheet,

    // ยานอกบัญชี — โผล่ 3 ช่องให้พิมพ์ ชื่อ/หน่วย/ราคา เอง
    sheetIsOff: !!st.sheetOff,
    offName: st.sheetOff ? st.sheetOff.name : '',
    offUnit: st.sheetOff ? st.sheetOff.unit : '',
    offPrice: st.sheetOff ? st.sheetOff.price : '',
    onOffName: app.onOffField('name'),
    onOffUnit: app.onOffField('unit'),
    onOffPrice: app.onOffField('price'),

    sheetName: sheet ? sheet.drug.name : '',
    sheetNameParts: nameFit,
    sheetNameSize: nameFit ? nameFit.size : NAME_MAX,
    // ฝั่งมือถือบีบระยะซ้ายขวาของปุ่ม ใช้ต่อได้/ทำลาย ให้ช่องชื่อยากว้างขึ้น · ความสูง 44 คงเดิม
    sheetSegTight: calc ? { minWidth: '56px', paddingLeft: '9px', paddingRight: '9px' } : null,
    sheetUnit: sheet ? sheet.drug.unit : '',
    sheetPriceLabel: sheet ? sheet.drug.price.toFixed(2) + ' ฿ / ' + sheet.drug.unit + ' · ราคา ณ วันบันทึก' : '',
    // ฝั่งมือถือแยกเป็นสองบรรทัด (พี่กันสั่ง 24 ต.ค. 2569 "ราคา ณ วันบันทึก ตัดลงไปอีกบันทัดนึงที")
    // เดิมบรรทัดเดียวตกบรรทัดกลางวลีเป็น "ราคา ณ" กับ "วันบันทึก" อ่านสะดุด
    sheetPriceMain: sheet ? sheet.drug.price.toFixed(2) + ' ฿ / ' + sheet.drug.unit : '',
    sheetPriceNote: 'ราคา ณ วันบันทึก',
    sheetQty: st.sheetQty,
    sheetQtyRef: app.sheetQtyRef,
    onSheetQty: calc
      ? (e) => app.onSheetCalcInput(e.target.value)
      : (e) => app.setState({ sheetQty: cleanQty(e.target.value) }),
    // Enter 2 จังหวะเหมือนฝั่งคอม — ยังเป็นสูตรอยู่ = เฉลยให้ดูก่อน · จังหวะสองถึงเพิ่มรายการ
    onSheetKey: (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (calc && isQtyExpr(raw) && qty > 0) { app.sheetCalcEq(); return; }
      app.confirmSheet();
    },

    // ── ปุ่มคิดเลข (มือถือเท่านั้น) ──
    sheetCalcOn: calc,
    sheetCalcKeys: CALC_KEYS.map((c) => ({
      k: c.k,
      label: c.label,
      eq: !!c.eq,
      press: c.eq ? app.sheetCalcEq : () => app.sheetCalcOp(c.op)
    })),
    // 🚨 กดปุ่มบนแถบแล้วช่องตัวเลขต้องไม่หลุดโฟกัส ไม่งั้นแป้นพิมพ์ของเครื่องพับลง
    //    แถบที่ติดอยู่บนแป้นจะตกลงไปล่างจอทุกครั้งที่กด
    sheetCalcHold: (e) => { if (e.cancelable) e.preventDefault(); },
    sheetQtyFont: calc ? calcFont(raw) : 40,
    // เฉลยแล้ว "30+30+4=64" — วาดซ้อนทับให้สูตรเป็นสีจาง ผลลัพธ์สีเขียว (ท่าเดียวกับฝั่งคอม)
    sheetQtyResolved: resolved,
    sheetQtyLayerRef: app.sheetQtyLayerRef,
    sheetQtyExprLeft: raw.split('=')[0],
    sheetQtyAnswerTail: raw.indexOf('=') >= 0 ? '=' + raw.split('=').slice(1).join('=') : '',
    onSheetQtyScroll: (e) => {
      if (app.sheetQtyLayerRef.current) app.sheetQtyLayerRef.current.scrollLeft = e.target.scrollLeft;
    },
    // เลิกโฟกัสแล้วเลื่อนไปท้ายสุดเสมอ ท้ายสุดคือที่ที่คำตอบอยู่ (บทเรียนเดียวกับฝั่งคอม)
    onSheetQtyBlur: () => {
      const el = app.sheetQtyRef.current;
      if (!el) return;
      el.scrollLeft = el.scrollWidth;
      if (app.sheetQtyLayerRef.current) app.sheetQtyLayerRef.current.scrollLeft = el.scrollWidth;
    },
    // ตัวเลขรวมที่รันไปเรื่อย ๆ ระหว่างกด + — ขึ้นทันทีที่ช่องมีเครื่องหมาย ไม่ต้องรอกด =
    sheetCalcSumOn: calc && !resolved && isQtyExpr(raw) && qty > 0,
    sheetCalcSum: qty,
    sheetDec: () => app.setState({ sheetQty: String(Math.max(0, Math.round((qty - 1) * 100) / 100)) }),
    // 🚨 ปุ่มบวกยังไม่ให้เกินเพดาน เพราะเป็นการกดทีละครั้ง ไม่ใช่การพิมพ์พลาด
    //    ส่วนการพิมพ์เองปล่อยให้เกินได้ แล้วเตือนแทน (พี่กันเลือกแบบ ก)
    // ข้อความเตือนตอนพิมพ์เกินเพดาน — ว่างเปล่าเมื่อไม่เกิน
    sheetOverMsg: qty > MAX_QTY ? ('จำนวนสูงสุด ' + MAX_QTY.toLocaleString('th-TH')) : '',
    sheetOverMax: qty > MAX_QTY,
    sheetInc: () => app.setState({ sheetQty: String(Math.min(100000, Math.round((qty + 1) * 100) / 100)) }),
    sheetPresets: PRESETS.map((p) => ({
      label: String(p),
      bg: qty === p ? '#e3f0e8' : '#f0f1ee',
      fg: qty === p ? '#2f7d5d' : '#414a44',
      pick: () => app.setState({ sheetQty: String(p) })
    })),
    sheetPillBg: reuse ? '#f0f1ee' : '#fbe4dd',
    sheetReuseBg: reuse ? '#fff' : 'transparent',
    sheetReuseOn: reuse,
    sheetReuseFg: reuse ? '#2f7d5d' : '#c9a096',
    sheetDestroyBg: reuse ? 'transparent' : '#fff',
    sheetDestroyFg: reuse ? '#6f7873' : '#c2543c',
    sheetSetReuse: () => app.setState({ sheetDisp: 'reuse', sheetReason: '' }),
    sheetSetDestroy: () => app.setState({ sheetDisp: 'destroy' }),

    // เหตุผลการทำลาย — โผล่เฉพาะตอนเลือกทำลาย เพิ่มการกดแค่ 1 ครั้ง
    // แต่ได้ข้อมูลที่ผู้บริหารเอาไปตัดสินใจได้จริง (หมดอายุเยอะ = สั่งยาเกิน)
    sheetIsDestroy: !reuse,
    sheetReasons: DESTROY_REASONS.map((r) => ({
      label: r.label,
      help: r.help,
      on: st.sheetReason === r.label,
      bg: st.sheetReason === r.label ? '#fbe4dd' : '#f0f1ee',
      fg: st.sheetReason === r.label ? '#c2543c' : '#414a44',
      pick: () => app.setState({ sheetReason: st.sheetReason === r.label ? '' : r.label })
    })),
    // คำอธิบายของตัวที่เลือกอยู่ — โผล่ใต้แถวชิป ไม่ต้องยัดคำอธิบายลงในชิปทุกอัน
    sheetReasonHelp: destroyReasonHelp(st.sheetReason),
    // 🚨 ปุ่มที่กดไม่ได้ต้องบอกเหตุผลในตัวเอง (พี่กันเลือกแบบ ก · 2 ก.ย. 2569)
    //    เดิมปุ่มเทายังเขียนยอดเงินจากจำนวนที่เกินเพดาน เช่น "เพิ่ม +1,350,000,000.00 ฿"
    //    ตัวเลขหลักพันล้านสะดุดตากว่าบรรทัดเตือนสีแดงเสียอีก
    //    คนเห็นแวบแรกตกใจว่าระบบคิดเงินผิด ทั้งที่เป็นยอดที่ไม่มีวันบันทึกได้จริง
    sheetCta: !sheet ? '' : (qty > MAX_QTY ? 'เกินจำนวนสูงสุด'
      : (sheet.kind === 'add' ? 'เพิ่ม' : 'บันทึกการแก้ไข')),
    // 🚨 เกินเพดานแล้วต้องไม่โชว์ยอดเงินเลย ไม่ใช่โชว์ยอดที่ใช้ไม่ได้
    sheetValueLabel: sheet && qty && qty <= MAX_QTY
      ? (sheet.kind === 'add' ? (reuse ? '+' : '−') : '') + money(sheet.drug.price * qty)
      : '',
    sheetConfirm: app.confirmSheet
  };
}
