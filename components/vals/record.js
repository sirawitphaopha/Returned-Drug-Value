// ค่าของหน้าบันทึก — คัดจาก renderVals ของมอคอัป (บรรทัด 1160–1290)
// ต่างจากต้นฉบับ 3 จุด: ตัดเลขคงคลังปลอม · ตัดสวิตช์จำลองเน็ตหลุด
// · ยอดสะสมปีงบมาจากฐานข้อมูล ไม่ได้นับจากรายการในเครื่อง
import { SOURCES, money, thaiDate } from '@/lib/format';
import { cleanQty, qtyNum, qtyText, splitDrugName, splitPercent, splitRelease, markMatch } from '../helpers';
import { moveHi } from '@/lib/drugSearch';

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
const ROW_COLS = [
  { key: 'name', label: 'ยา', w: '', align: 'left', flex: true },
  { key: 'qty', label: 'จำนวน', w: '104px', align: 'right' },
  { key: 'price', label: 'ราคา/หน่วย (฿)', w: '104px', align: 'right' },
  { key: 'value', label: 'มูลค่า (฿)', w: '124px', align: 'right' },
  { key: 'disposition', label: 'สถานะ', w: '150px', align: 'right' }
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
  const pendQty = qtyNum(st.qtyInput);
  const canAdd = !!pending && pendQty > 0;
  const fySaved = st.fy.saved;

  const setRowDisp = (rid, disp) => () => {
    const rows = st.rows.map((x) => (x.rid === rid ? Object.assign({}, x, { disposition: disp }) : x));
    app.persist({ rows: rows });
    app.animateTo(sumReuse(rows));
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
      const stColor = d.stColorOf(drug);
      // แยกชื่อกับความแรง แล้วไฮไลต์คำที่พิมพ์ค้น — ตาไล่หาง่ายขึ้นมาก
      const sp = splitDrugName(drug.name);
      const mk = markMatch(sp.base, d.qUsed);
      // แยกรูปแบบการออกฤทธิ์ (ER/IR/SR) ออกก่อน แล้วค่อยแยก %
      // ลำดับสำคัญ เพราะ release อยู่ท้ายสุดของชื่อ ("10 mg/1 g 1% ER")
      const rl = splitRelease(sp.strength);
      // แยก % ออกจากความแรง เอาไปใส่วงเล็บทาสีต่างหาก จะได้สะดุดตา (พี่กันขอ)
      const pc = splitPercent(rl.main);
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

    // ── แหล่งที่มา · วันที่ · HN ─────────────────────────────────────────────
    sources: SOURCES.map((s) => ({
      label: s.label,
      // พี่กันสั่งเปลี่ยนจากดำ (#1e2420 ของมอคอัป) เป็นเขียวเทลของธีม
      bg: st.source === s.key ? '#2f7d5d' : '#f0f1ee',
      fg: st.source === s.key ? '#fff' : '#414a44',
      // sourceTouched = ผู้ใช้แตะเองแล้ว · ใช้แยกจาก "ยังเป็นค่าเริ่มต้น"
      pick: () => app.persist({ source: s.key, sourceTouched: true })
    })),
    dateIso: st.date,
    dateMax: st.today,
    isBackdated: !!st.today && !!st.date && st.date !== st.today,
    onDate: (e) => app.persist({ date: e.target.value || st.today }),
    hn: st.hn,
    onHn: (e) => app.setState({ hn: e.target.value.replace(/[^0-9]/g, '') }),
    showMore: st.showMore,
    toggleMore: () => app.setState({ showMore: !st.showMore }),

    // ── แถวใส่ยาบนคอม (พิมพ์ → Enter → ใส่จำนวน → Enter) ─────────────────────
    qtyRef: app.qtyRef,
    qtyInput: st.qtyInput,
    // รับทศนิยมได้ 2 ตำแหน่ง — ยาน้ำครึ่งขวด ยาแบ่งครึ่งเม็ด
    // (เดิมกรอง [^0-9] ทิ้ง พิมพ์ 2.5 กลายเป็น 25 ซึ่งผิดเป็นสิบเท่า)
    onQtyInput: (e) => app.setState({ qtyInput: cleanQty(e.target.value) }),
    onQtyKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); app.addInline(); } },
    addInline: app.addInline,
    // ปุ่ม "เพิ่ม" — พี่กันสั่งเปลี่ยนจากดำเป็นเขียวเทลของธีม
    addBg: canAdd ? '#2f7d5d' : '#e9ebe8',
    addFg: canAdd ? '#fff' : '#9aa19c',
    addHintFg: canAdd ? 'rgba(255,255,255,.5)' : '#b8bdb9',
    searchBorder: pending ? '#2f7d5d' : 'rgba(30,36,32,.16)',
    pendingUnit: pending ? ' (' + pending.unit + ')' : '',
    pendReuseBg: pendReuse ? '#e3f0e8' : 'transparent',
    pendReuseFg: pendReuse ? '#2f7d5d' : '#9aa19c',
    pendDestroyBg: pendReuse ? 'transparent' : '#fbe4dd',
    pendDestroyFg: pendReuse ? '#9aa19c' : '#c2543c',
    setPendingReuse: () => app.setState({ pendingDisp: 'reuse' }),
    setPendingDestroy: () => app.setState({ pendingDisp: 'destroy' }),
    desktopHint: !pending
      ? 'พิมพ์ชื่อยา → Enter เลือกผลแรก → ใส่จำนวน → Enter เพิ่มรายการ แล้วกลับไปช่องยาเอง'
      : pendQty > 0
        ? 'Enter เพื่อเพิ่ม ' + pending.name + ' ' + pendQty + ' ' + pending.unit + ' = ' + money(pending.price * pendQty)
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
      return {
        rid: r.rid,
        name: r.name,
        detail: r.qty + ' ' + r.unit + ' × ' + r.price.toFixed(2),
        qtyLabel: r.qty + ' ' + r.unit,
        priceLabel: r.price.toFixed(2),
        deskBg: reuse ? '#fff' : '#fdf7f5',
        valueLabel: money(r.price * r.qty),
        color: reuse ? '#2f7d5d' : '#c2543c',
        border: reuse ? 'rgba(30,36,32,.08)' : 'rgba(194,84,60,.22)',
        pillBg: reuse ? '#f0f1ee' : '#fbe4dd',
        reuseBg: reuse ? '#fff' : 'transparent',
        reuseFg: reuse ? '#2f7d5d' : '#c9a096',
        destroyBg: reuse ? 'transparent' : '#fff',
        destroyFg: reuse ? '#9aa19c' : '#c2543c',
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
    saveBg: st.rows.length === 0 ? '#e9ebe8' : st.saveFailed ? '#1e2420' : '#2f7d5d',
    saveFg: st.rows.length === 0 ? '#9aa19c' : '#fff',
    onSave: app.save,
    priceAsOfLabel: 'ราคา ณ ' + (st.date ? thaiDate(st.date) : '—')
  };
}
