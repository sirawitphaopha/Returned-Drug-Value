// ค่าของหน้าประวัติ — คัดจากมอคอัป (บรรทัด 1292–1320 กับ 1368–1372)
// การกรองย้ายไปอยู่ฝั่ง SQL แล้ว ที่เหลือในนี้คือการจัดหน้าตาล้วนๆ เหมือนต้นฉบับ
import { SOURCES, money, thaiDate, fyOf } from '@/lib/format';
// ใช้ตัวแยกชิ้นส่วนชื่อยาตัวเดียวกับหน้าบันทึก — ชื่อยาจะได้หน้าตาเหมือนกันทุกหน้า
import { nameParts } from './record';
import { pillColorOf } from '@/lib/drugPillColors';
import { shortStaffName, textWidth, TBL_FONT, ROW_H } from '../helpers';

const HIST_LIMIT = 60;

const srcLabel = (key) => (SOURCES.find((s) => s.key === key) || {}).label || '';

// ป้ายแหล่งที่มาแบบเต็ม — ยาที่คืนจาก รพ.สต. ต้องบอกได้ว่าแห่งไหน ไม่ใช่แค่ "รพ.สต."
// เขียนติดกันด้วยช่องว่างธรรมดา ไม่ใช้จุดคั่น เพราะคอลัมน์แคบและขึ้นบรรทัดใหม่เองได้อยู่แล้ว
const srcFull = (r) => {
  const base = srcLabel(r.source);
  const site = String(r.pcuSite || '').trim();
  return site ? base + ' ' + site : base;
};

export function historyVals(app, d) {
  const st = d.st;

  const rangeDefs = [
    { key: 'today', label: 'วันนี้' },
    { key: 'week', label: '7 วัน' },
    { key: 'month', label: 'เดือนนี้' },
    { key: 'fy', label: 'ปีงบ ' + (st.today ? fyOf(st.today) : '—') }
  ];

  // แถวหลัก + แถวที่กด "ดูเพิ่ม" มาต่อท้าย
  const loaded = st.histMore.length ? st.histRows.concat(st.histMore) : st.histRows;

  // ── เรียงตามคอลัมน์ ─────────────────────────────────────────────────────────
  // เรียงในเครื่องจากแถวที่โหลดมาแล้ว (เซิร์ฟเวอร์ส่งมาเรียงวันใหม่→เก่าอยู่แล้ว)
  // ตัวเลขเทียบเป็นตัวเลข · ตัวหนังสือไทยใช้ localeCompare('th') ไม่งั้น ก ข ค เรียงมั่ว
  const SORT_VAL = {
    date: (r) => r.date,
    name: (r) => r.name || '',
    qty: (r) => Number(r.qty) || 0,
    price: (r) => Number(r.price) || 0,
    value: (r) => (Number(r.price) || 0) * (Number(r.qty) || 0),
    disposition: (r) => (r.disposition === 'reuse' ? 0 : 1),
    source: (r) => srcFull(r),
    hn: (r) => r.hn || '',
    by: (r) => r.by || '',
    lot: (r) => r.lot || ''
  };

  const sortKey = st.histSortKey;
  const rows = sortKey && SORT_VAL[sortKey]
    ? loaded.slice().sort((a, b) => {
        const va = SORT_VAL[sortKey](a);
        const vb = SORT_VAL[sortKey](b);
        let c;
        if (typeof va === 'number' && typeof vb === 'number') c = va - vb;
        else c = String(va).localeCompare(String(vb), 'th');
        if (c === 0) c = b.id - a.id;          // เท่ากันให้ใหม่กว่าขึ้นก่อน
        return st.histSortDir === 'asc' ? c : -c;
      })
    : loaded;

  // หัวตาราง — กดเรียงได้ · สีเข้มกว่าเดิม (เดิมจางมากจนแทบไม่เห็น)
  // ── คอลัมน์ HN กดซ่อน/แสดงได้ (พี่กันสั่ง 10 ก.ย. 2569) ────────────────────
  //   "แสดงเริ่มต้นคือซ่อน · จำสถานะ"
  const เปิดHN = !!st.hnCol;

  // ── คอลัมน์แหล่งที่มา ยืดหดตามข้อมูลที่แสดงอยู่จริง (พี่กันสั่ง 10 ก.ย. 2569) ──
  //
  //   "ให้มันเปลี่ยนความยาวตามข้อมูลแหล่งที่มา แต่เรากำหนด fix ตัวสูงสุดไว้
  //    แล้วมันจะทำงานเมื่อ รพ.สต. ที่ยาวที่สุดจะกรอกเท่านั้น
  //    และให้ตัวที่ไหลลื่นขยับขยายได้คือชื่อยา ตามที่ทำอยู่ตอนนี้"
  //
  //   หน้าที่มีแต่ "OPD NCD" คอลัมน์จะแคบ · หน้าที่มี "รพ.สต. หนองเชียงทูน" ค่อยกว้างสุด
  //   ที่เหลือตกเป็นของคอลัมน์ยา (flex) ซึ่งยาวเกินช่องอยู่ตลอด
  //
  // 🚨 เพดาน 156 = "รพ.สต. หนองเชียงทูน" 132 จุด + ระยะขอบใน 24 (พอดีเป๊ะ ไม่เผื่อ)
  //    ยาวสุดใน 13 แห่ง วัดด้วย scripts/col-width.mjs ห้ามเดาจากจำนวนตัวอักษร
  // 🚨 พื้น 96 = หัวคอลัมน์ "แหล่งที่มา" กับลูกศรเรียง ต้องการเท่านี้เป็นอย่างน้อย
  //    แคบกว่านี้หัวจะโดนบีบจนลูกศรตกไปคนละบรรทัด
  // 🚨 ตอนเซิร์ฟเวอร์วาดจอวัดไม่ได้ (ยังไม่มีผืนผ้าใบ) ใช้เพดานไปก่อน
  //    กว้างเกินไว้ก่อนดีกว่าแคบแล้วชื่อโดนตัดตอนวาดครั้งแรก
  const SRC_MIN = 96;
  const SRC_MAX = 156;
  const กว้างสุดที่แสดงอยู่ = rows.reduce((m, r) => {
    const w = textWidth(srcFull(r), TBL_FONT);
    return w > m ? w : m;
  }, 0);
  const กว้างแหล่งที่มา = กว้างสุดที่แสดงอยู่
    ? Math.min(SRC_MAX, Math.max(SRC_MIN, กว้างสุดที่แสดงอยู่ + 24))
    : SRC_MAX;
  const COLS = [
    { key: 'date', label: 'วันที่', w: '124px', align: 'left' },
    { key: 'name', label: 'ยา', w: '', align: 'left', flex: true },
    { key: 'qty', label: 'จำนวน', w: '80px', align: 'right' },
    { key: 'price', label: 'ราคา/หน่วย', w: '116px', align: 'right' },
    { key: 'value', label: 'มูลค่า (฿)', w: '118px', align: 'right' },
    { key: 'disposition', label: 'สถานะ', w: '90px', align: 'center' },
    // ความกว้างคำนวณข้างบน — ยืดหดตามข้อมูลที่แสดงอยู่ เพดาน 164
    { key: 'source', label: 'แหล่งที่มา', w: กว้างแหล่งที่มา + 'px', align: 'left' },
    // 🚨 ขีดกลางของแถวที่ไม่มี HN ต้องอยู่กึ่งกลางช่อง (พี่กันสั่ง 10 ก.ย. 2569)
    ...(เปิดHN ? [{ key: 'hn', label: 'HN', w: '68px', align: 'center' }] : []),
    // 🚨🔴 ชื่อผู้บันทึกห้ามตัด ทุกสถานะ — พี่กันสั่ง "ห้ามตัดชื่อ" (10 ก.ย. 2569)
    //    114 จุด = 82 (ชื่อยาวสุดใน 16 คน คือ "ภญ. วลัยพรรณ" กับ "พนง. สุพิชฌาย์")
    //             + 24 ระยะขอบใน + 8 เผื่อ
    //    เคยตั้ง 146 ซึ่งกว้างเกินไป 40 จุด พี่กันทักว่า "ช่องไฟมันเยอะมากเลย"
    //    และเคยตั้งให้หดเป็น 104 ตอนเปิด HN ซึ่งไม่พอ ชื่อตกบรรทัดทันที
    //    วัดครบทั้ง 16 คนด้วย scripts/col-width.mjs — ห้ามเดาจากจำนวนตัวอักษร
    { key: 'by', label: 'ผู้บันทึก', w: '114px', align: 'left' },
    { key: 'lot', label: 'Lot', w: '92px', align: 'left' }
  ];

  // ── แถบสีจางแยกแต่ละ Lot (พี่กันเลือกแบบ ข) ───────────────────────────────
  // ฐานข้อมูลเรียง วันที่ใหม่→เก่า, id ใหม่→เก่า แถวใน Lot เดียวกันจึงติดกันเองอยู่แล้ว
  // สลับพื้นขาว↔เขียวจางทุกครั้งที่ขึ้น Lot ใหม่ ตากวาดแล้วเห็นเป็นก้อน ๆ
  //
  // 🚨 ทำงานเฉพาะตอนเรียงตามวันที่เท่านั้น
  //    ถ้ากดเรียงตามราคา/ชื่อยา แถวจาก Lot ต่าง ๆ จะสลับกันมั่ว
  //    สีจางจะกลายเป็นลายพร้อยที่ไม่มีความหมาย หลอกตาว่าเป็นกลุ่มทั้งที่ไม่ใช่
  const bandOn = !sortKey || sortKey === 'date';
  const bandOf = {};
  if (bandOn) {
    let band = false, prevLot = null;
    for (const r of rows) {
      const lot = r.lot || ('__' + r.date);   // แถวเก่าที่ยังไม่มีเลข Lot ให้จับกลุ่มตามวัน
      if (prevLot !== null && lot !== prevLot) band = !band;
      prevLot = lot;
      bandOf[r.id] = band;
    }
  }

  // จัดกลุ่มรายวันสำหรับมือถือ — แถวมาจากเซิร์ฟเวอร์เรียงวันใหม่→เก่าอยู่แล้ว
  const dayMap = {};
  const dayOrder = [];
  rows.forEach((r) => {
    if (!dayMap[r.date]) { dayMap[r.date] = []; dayOrder.push(r.date); }
    dayMap[r.date].push(r);
  });

  // แผนที่รหัสยา → ข้อมูลดิบในคลัง สร้างครั้งเดียวต่อการวาดจอ
  // 🚨 ต้องมีเพื่อวาดชื่อยาแบบมีสี — ฐานส่งชื่อมาเป็นข้อความก้อนเดียว
  //    ถ้าเอาข้อความมาเดาชิ้นส่วนจะเดาผิดเวลาสูตรชื่อเปลี่ยน (พลาดมาแล้ว 25 ส.ค. 2569)
  const drugById = new Map((st.drugs || []).map((d) => [d.id, d]));

  const itemOf = (r) => {
    const reuse = r.disposition === 'reuse';
    const price = Number(r.price);
    // ยาที่มีรหัส → ดึงข้อมูลดิบจากคลังมาวาดพร้อมสี
    // ยานอกบัญชีที่พิมพ์ชื่อเอง (ไม่มีรหัส) → ใช้ชื่อที่แช่ไว้ ไม่มีสีให้แยก
    const master = r.drugId != null ? drugById.get(r.drugId) : null;
    const pill = master ? pillColorOf(master) : null;
    // 🚨 ส่งสีเม็ดยาเข้าไปเป็นสีของ "ตัวเลขความแรง" ด้วย (พี่กันสั่ง 25 ส.ค. 2569)
    //    Warfarin 2 ส้ม · 3 น้ำเงิน · 5 ชมพู — ตัวเลขกับป้ายสีต้องเป็นสีเดียวกัน
    //    ตาจับได้ตั้งแต่กวาดผ่าน ไม่ต้องอ่านคำในวงเล็บ
    //    ยาที่ไม่ได้กรอกสีเม็ดไว้ ตัวเลขคงสีเทาเหมือนเดิม
    const np = nameParts(master || { name: r.name }, pill ? pill.color : '');
    return {
      key: r.id,
      name: r.name,
      // ชิ้นส่วนชื่อยาสำหรับวาดทีละส่วนพร้อมทาสี (components/pages/drugname.jsx)
      // หน้านี้ไม่มีการค้นในตัว จึงไม่มีคำไฮไลต์ — ส่งชื่อทั้งก้อนเป็น mkBefore
      parts: {
        ...np,
        mkBefore: np.base, mkHit: '', mkAfter: '',
        abBefore: np.abbrev, abHit: '', abAfter: '',
        bdBefore: np.brand, bdHit: '', bdAfter: '',
        pillLabel: pill ? pill.label : '',
        pillColor: pill ? pill.color : '',
        strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
      },
      // บนมือถือคอลัมน์แคบมาก ตัดชื่อแหล่งที่มาออกจากบรรทัดรายละเอียด
      // (ยังดูได้ในหน้าคอม) เหลือแค่ข้อมูลที่จำเป็นจริง ๆ
      //
      // ดึงเลข Lot ออกจากบรรทัดนี้ไปทำเป็นป้ายกดได้ต่างหาก (พี่กันขอให้เกลามือถือ)
      // เดิมยัดรวมกันจนเป็นพืดยาว "60 เม็ด × 0.45 · HN 6418302 · L690806-03" อ่านยาก
      detail: r.qty + ' ' + r.unit + ' × ' + price.toFixed(2) + (r.hn ? ' · HN ' + r.hn : ''),
      lotLabel: r.lot || '',
      hasLot: !!r.lot,
      openLot: r.lot ? () => app.viewLot(r.lot) : null,
      // แถบสีจางแยก Lot บนมือถือด้วย — แต่ใช้เส้นขอบซ้ายแทนพื้นสี
      // เพราะการ์ดมือถือมีพื้นขาวกับกรอบอยู่แล้ว ถ้าเปลี่ยนพื้นอีกจะเลอะ
      lotBand: !!bandOf[r.id],
      valueLabel: money(price * r.qty),
      color: reuse ? '#2f7d5d' : '#c2543c',
      dispLabel: reuse ? 'ใช้ต่อได้' : 'ทำลาย',
      dispColor: reuse ? '#6f7873' : '#c2543c',
      border: reuse ? 'rgba(30,36,32,.08)' : 'rgba(194,84,60,.22)',
      inTrash: !!r.deletedAt,
      edit: () => app.editRecord(r),
      remove: () => app.askDeleteRecord(r),
      restore: () => app.askRestoreRecord(r)
    };
  };

  return {
    // ── ช่องค้นหน้าประวัติฝั่งมือถือ — โครงสามชั้นกันวรรณยุกต์โดนตัด ────────
    //
    // 🚨 กฎข้อ 3.69 · ช่องกรอกทุกชนิดตัดตัวอักษรที่ล้นออกนอกตัวเองเสมอ ปิดไม่ได้
    //    "นี้ นั้น" ไม้โทโดนหั่นครึ่ง (พี่กันเห็นเองในเว็บจริง 2 ก.ย. 2569)
    //    ตอนนั้นแก้แค่ช่องค้นยาในหน้าบันทึก ช่องนี้หลุดไป
    //
    // ✅ 3 ก.ย. 2569 ยกเป็นตัวกลาง components/pages/thaibox.jsx ใช้ทุกช่องค้นหาในเว็บ
    //    ตัวกลางหาชั้นวาดจากกล่องแม่เอง จึงไม่ต้องมี ref คู่ละสองตัวทุกช่องอีก
    // 🚨 ระยะขอบขวาต้องตรงกับที่ช่องกรอกใช้เป๊ะ ไม่งั้นข้อความที่วาดกับขีดกะพริบเหลื่อมกัน
    histQPadRight: st.histSwapped ? '150px' : ((st.histQuery || '').trim() ? '44px' : '13px'),
    histQuery: st.histQuery,
    onHistQuery: app.onHistQuery,
    // ลืมสลับแป้นพิมพ์ — ต้องบอกผู้ใช้ว่าระบบค้นด้วยคำว่าอะไรให้
    // ไม่งั้นพิมพ์ไทยแล้วเจอยาภาษาอังกฤษ จะงงว่าเว็บทำอะไรอยู่
    histSwapped: !!st.histSwapped,
    histSwapLabel: st.histSwapLabel || '',
    histHasSearch: !!(st.histQuery || '').trim(),
    clearHistQuery: app.clearHistQuery,

    // ตัววัดความสูงแถบกรอง — หัวตารางเอาไปใช้ตั้งระยะติดบน (ดู .sticky-head ใน globals.css)
    histHeadRef: app.histHeadRef,

    // ── ปุ่มเลือกความสูงแถว 3 ระดับ (พี่กันสั่ง 10 ก.ย. 2569) ──────────────
    // 🚨 ตั้งครั้งเดียวมีผลกับตารางทุกหน้า เพราะคลาสไปอยู่ที่ <html>
    rowHPicks: ROW_H.map((r) => ({
      key: r.key,
      label: r.label,
      // ตำแหน่งเส้นในไอคอน — ยิ่งชิดยิ่งแทนแถวที่แน่นขึ้น
      lines: r.lines,
      title: 'แถวสูง ' + r.px + ' จุด · ' + r.hint,
      on: (st.rowH || 'roomy') === r.key,
      bg: (st.rowH || 'roomy') === r.key ? '#2f7d5d' : '#f0f1ee',
      fg: (st.rowH || 'roomy') === r.key ? '#fff' : '#414a44',
      pick: () => app.setRowH(r.key)
    })),

    // ── ปุ่มสลับคอลัมน์ HN ────────────────────────────────────────────────
    // 🚨 ค้นด้วย HN ยังทำงานปกติแม้คอลัมน์ปิดอยู่ · ไฟล์ส่งออกมี HN เสมอ
    hnCol: เปิดHN,
    hnColToggle: app.toggleHnCol,
    hnColLabel: เปิดHN ? 'ซ่อน HN' : 'แสดง HN',
    hnColTitle: เปิดHN ? 'ซ่อนคอลัมน์ HN ออกจากตาราง' : 'แสดงคอลัมน์ HN ในตาราง',
    hnColBg: เปิดHN ? '#e3f0e8' : '#fff',
    hnColFg: เปิดHN ? '#2f7d5d' : '#6b746e',
    hnColBorder: เปิดHN ? 'rgba(47,125,93,.40)' : 'rgba(30,36,32,.16)',

    // หัวตารางกดเรียงได้ · ลูกศรบอกทิศ ▲ น้อยไปมาก ▼ มากไปน้อย ↕ ยังไม่ได้เรียง
    // ปุ่มล้างการเรียง — โผล่เฉพาะตอนกดเรียงเองแล้วจริง ๆ
    histSortClear: { on: !!sortKey, clear: app.clearHistSort, label: (COLS.find((c) => c.key === sortKey) || {}).label || '' },

    // ── ปุ่มล้างตัวกรองทั้งหมด (พี่กันสั่ง 10 ก.ย. 2569) ──────────────────────
    // 🚨 นับเฉพาะตัวกรองที่ "ไม่ใช่ค่าตั้งต้น" — ช่วงเวลาเดือนนี้คือค่าตั้งต้น ไม่นับ
    //    ไม่งั้นปุ่มจะเปิดใช้งานตลอดเวลาทั้งที่ไม่มีอะไรให้ล้าง
    // 🚨 ไม่นับถังขยะ เพราะปุ่มนี้ไม่แตะถังขยะ (มีปุ่มกลับของตัวเองแล้ว)
    histHasFilter: !!(st.histQuery.trim() || st.histLot || sortKey
      || st.histDisp || st.histSrc || st.histBy || st.histSite
      || (st.histRange && st.histRange !== 'month')),
    clearHistFilters: app.clearHistFilters,

    // ── ตัวกรอง 3 ทาง — สถานะ · แหล่งที่มา · ผู้บันทึก (พี่กันสั่ง 10 ก.ย. 2569) ──
    //
    // 🚨 ทุกช่องมีตัวเลือกแรกเป็น "ทุก…" ซึ่งค่าเป็นค่าว่าง = ไม่กรอง
    //    ช่องเลือกที่ไม่มีทางกลับไปสถานะ "ไม่กรอง" คือกับดักที่ออกไม่ได้
    // 🚨 ช่องผู้บันทึกใช้รายชื่อที่ "มีรายการจริงในช่วงเวลานี้" ไม่ใช่พนักงานทั้ง 16 คน
    //    เลือกคนที่ไม่มีรายการแล้วได้ตารางว่าง = ตัวเลือกที่ไม่มีประโยชน์
    // 🚨 แต่ถ้าเลือกคนไว้อยู่แล้วและคนนั้นหลุดจากรายชื่อ (เปลี่ยนช่วงเวลา) ต้องคงไว้ในรายการ
    //    ไม่งั้นช่องจะเด้งกลับไปเป็น "ทุกคนบันทึก" ทั้งที่ยังกรองด้วยชื่อนั้นอยู่
    histDispValue: st.histDisp || '',
    onHistDisp: app.setHistDisp,
    histDispOpts: [
      { value: '', label: 'ทุกสถานะ' },
      { value: 'reuse', label: 'นำกลับใช้' },
      { value: 'destroy', label: 'ทำลาย' }
    ],

    histSrcValue: st.histSrc || '',
    onHistSrc: app.setHistSrc,
    histSrcOpts: [{ value: '', label: 'ทุกแหล่งที่มา' }]
      .concat(SOURCES.map((s) => ({ value: s.key, label: s.label }))),

    // ── ชั้นที่สอง — เลือก รพ.สต. ว่าแห่งไหน (พี่กันสั่ง 10 ก.ย. 2569) ──────
    //   "รพ.สต. ถ้าเลือกแล้วควรขึ้นเหมือนหน้า lot นะ"
    //
    // 🚨 โผล่เฉพาะตอนแหล่งที่มาเป็น รพ.สต. — อำเภอปรางค์กู่มี 13 แห่ง
    //    ยัดรวมลงช่องเดียวกับแหล่งที่มาจะได้รายการยาวเป็นหางว่าว 19 บรรทัด
    //    (พี่กันสั่งแยกสองชั้นตั้งแต่ทำหน้ารายการ Lot — CLAUDE.md ข้อ 3.52)
    // 🚨 รายชื่อมาจากการตั้งค่า (ครบทั้ง 13 แห่ง) ไม่ใช่จากแถวที่โหลดมาแล้ว
    //    หน้านี้โหลดทีละ 60 แถว เอาจากข้อมูลที่เห็นจะได้ตัวเลือกไม่ครบ
    //    และแห่งที่ยังไม่เคยคืนยาก็ต้องเลือกได้ (จะได้รู้ว่าไม่มีจริง ๆ)
    histSiteOn: st.histSrc === 'pcu',
    histSiteValue: st.histSite || '',
    onHistSite: app.setHistSite,
    histSiteOpts: [{ value: '', label: 'ทุกแห่ง' }].concat(
      [...new Set((st.pcuSites || []).map((n) => String(n).trim()).filter(Boolean))]
        .sort((x, y) => x.localeCompare(y, 'th'))
        .map((n) => ({ value: n, label: n }))
    ),

    histByValue: st.histBy || '',
    onHistBy: app.setHistBy,
    histByOpts: [{ value: '', label: 'ทุกคนบันทึก' }].concat(
      (() => {
        const มี = (st.histPeople || []).filter((n) => String(n || '').trim());
        const เลือกอยู่ = String(st.histBy || '').trim();
        if (เลือกอยู่ && มี.indexOf(เลือกอยู่) < 0) มี.push(เลือกอยู่);
        // ชื่อในช่องเลือกใช้ชื่อสั้นเหมือนในตาราง แต่ค่าที่ส่งกลับเป็นชื่อเต็มเสมอ
        return มี.map((n) => ({ value: n, label: shortStaffName(n) || n }));
      })()
    ),


    histCols: COLS.map((c) => {
            // 🚨 ยังไม่ได้กดเรียง ไม่ได้แปลว่าไม่ได้เรียง
      //    ฐานส่งข้อมูลมาเรียงวันที่ใหม่ไปเก่าอยู่แล้ว ลูกศรจึงต้องชี้ลงที่คอลัมน์วันที่
      //    ของเดิมโชว์ ↑↓ ทั้งที่เรียงอยู่จริง = ลูกศรโกหก (พี่กันจับได้ 4 ก.ย. 2569)
      const on = sortKey ? sortKey === c.key : c.key === 'date';
      const dir = sortKey ? st.histSortDir : 'desc';
      return {
        key: c.key,
        label: c.label,
        w: c.w,
        flex: !!c.flex,
        align: c.align,
        // ลูกศรชุดเดียวกับหน้ารายการ Lot ซึ่งเป็นต้นแบบ (พี่กันย้ำ 4 ก.ย. 2569)
        // ↑ น้อยไปมาก · ↓ มากไปน้อย · ↑↓ ยังไม่ได้เรียงด้วยคอลัมน์นี้
        // ของเดิมเป็นสามเหลี่ยม ▲▼↕ ขนาด 9px เล็กจนดูไม่ออกว่าเรียงทางไหนอยู่
        arrow: on ? (dir === 'asc' ? '↑' : '↓') : '↑↓',
        arrowColor: on ? '#2f7d5d' : 'rgba(30,36,32,.34)',
        // ตัวที่กำลังเรียงอยู่ใหญ่กว่าเพื่อน เพราะเป็นตัวเดียวที่ต้องอ่านจริง
        arrowSize: on ? '19px' : '16px',
        fg: on ? '#2f7d5d' : '#414a44',
        pick: () => app.setHistSort(c.key)
      };
    }),
    ranges: rangeDefs.map((r) => ({
      key: r.key,
      label: r.label,
      bg: st.histRange === r.key ? '#2f7d5d' : '#f0f1ee',
      on: st.histRange === r.key,
      fg: st.histRange === r.key ? '#fff' : '#414a44',
      pick: () => app.setHistRange(r.key)
    })),

    histDays: dayOrder.map((dt) => ({
      key: dt,
      label: dt === st.today ? 'วันนี้ · ' + thaiDate(dt) : thaiDate(dt),
      total: money(dayMap[dt].reduce((s, r) => s + (r.disposition === 'reuse' ? Number(r.price) * r.qty : 0), 0)),
      items: dayMap[dt].map(itemOf)
    })),

    histRows: rows.map((r) => {
      const reuse = r.disposition === 'reuse';
      const price = Number(r.price);
      const master = r.drugId != null ? drugById.get(r.drugId) : null;
      const pill = master ? pillColorOf(master) : null;
      // สีเม็ดยาเป็นสีของตัวเลขความแรงด้วย — เหตุผลเดียวกับที่อธิบายไว้ในบล็อกด้านบน
      const np = nameParts(master || { name: r.name }, pill ? pill.color : '');
      return {
        key: r.id,
        dateLabel: thaiDate(r.date),
        name: r.name,
        // ชิ้นส่วนชื่อยาสำหรับวาดพร้อมสี — ตัวเดียวกับหน้าบันทึก
        parts: {
          ...np,
          mkBefore: np.base, mkHit: '', mkAfter: '',
          abBefore: np.abbrev, abHit: '', abAfter: '',
          bdBefore: np.brand, bdHit: '', bdAfter: '',
          pillLabel: pill ? pill.label : '',
          pillColor: pill ? pill.color : '',
          strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
        },
        qtyLabel: r.qty + ' ' + r.unit,
        priceLabel: price.toFixed(2),
        valueLabel: money(price * r.qty),
        color: reuse ? '#2f7d5d' : '#c2543c',
        // แถว "ทำลาย" คงสีแดงจางไว้เหมือนเดิม เพราะเป็นสัญญาณที่สำคัญกว่าการจับกลุ่ม
        // ส่วนแถวใช้ต่อได้สลับ ขาว ↔ เขียวจาง ตาม Lot
        bg: reuse ? (bandOf[r.id] ? '#f4faf7' : '#fff') : '#fdf7f5',
        dispLabel: reuse ? 'ใช้ต่อได้' : 'ทำลาย',
        dispBg: reuse ? '#e3f0e8' : '#fbe4dd',
        dispFg: reuse ? '#2f7d5d' : '#c2543c',
        // กดชื่อยาในตารางแล้วกรองเฉพาะยาตัวนั้น (พี่กันสั่ง 10 ก.ย. 2569)
        pickDrug: () => app.filterByDrug(r.name),
        sourceLabel: srcFull(r),
        hnLabel: r.hn || '—',
        // แสดงแค่คำนำหน้ากับชื่อ ไม่เอานามสกุล (พี่กันสั่ง 4 ก.ย. 2569)
        // ชื่อเต็มยังอยู่ครบใน byFull สำหรับเอาเมาส์ชี้ดู และในไฟล์ส่งออก
        byLabel: shortStaffName(r.by) || '—',
        // 🚨 ชื่อคนห้ามถูกผ่ากลางคำ (พี่กันสั่ง 10 ก.ย. 2569 "ห้ามตัดชื่อ")
        //    แยกเป็นก้อนตามช่องว่าง แล้วให้ตัววาดห่อแต่ละก้อนด้วย nowrap
        //    ตัดได้เฉพาะตรงช่องว่าง — "ภญ." ขึ้นบรรทัดหนึ่ง "วลัยพรรณ" อีกบรรทัด
        //    ไม่มีทางได้ "ภญ. วลัย / พรรณ" อีกไม่ว่าคอลัมน์จะแคบแค่ไหน
        //    (ท่าเดียวกับก้อนในบรรทัดชื่อยา — CLAUDE.md ข้อ 3.19)
        byParts: String(shortStaffName(r.by) || '—').split(/\s+/).filter(Boolean),
        byFull: r.by || '—',
        lotLabel: r.lot || '—',
        // กดเลข Lot = กรองดูเฉพาะ Lot นั้น · เดิมมีฟีเจอร์นี้อยู่แล้วแต่หน้าคอมไม่เคยโชว์เลข
        // คนใช้เลยไม่มีทางรู้ว่าเลขคืออะไร กลายเป็นฟีเจอร์ที่มีแต่ใช้ไม่ได้
        openLot: r.lot ? () => app.viewLot(r.lot) : null,
        hasLot: !!r.lot,
        inTrash: !!r.deletedAt,
        edit: () => app.editRecord(r),
        remove: () => app.askDeleteRecord(r),
        restore: () => app.askRestoreRecord(r)
      };
    }),

    // ตอนกำลังโหลดรอบแรกยังไม่มีแถว อย่าเพิ่งขึ้นว่าไม่พบรายการ
    histLoading: st.histLoading && !rows.length,
    // 🚨 เน็ตหลุดแล้วขึ้น "ไม่พบรายการตามเงื่อนไขนี้" = ส่งผู้ใช้ไปไล่หาของที่ไม่เคยหาย
    histEmpty: !st.histLoading && !rows.length && !st.loadErr.hist,
    histFail: (!st.histLoading && !rows.length) ? (st.loadErr.hist || '') : '',
    histRetry: () => app.loadHistory(true),
    histCountLabel: st.histTotal.toLocaleString('en-US') + ' รายการ',
    // ── ยอดสรุปใต้ชื่อหน้า ต้องตรงกับสิ่งที่กรองอยู่ ────────────────────────
    //
    // 🚨 เดิมโชว์ยอด "นำกลับใช้" เสมอ พอกรองเฉพาะแถวทำลาย ยอดจึงขึ้น 0.00 ฿
    //    ทั้งที่มีรายการอยู่จริง — ตัวเลขที่โกหกโดยไม่มีอะไรเตือน
    // 🚨 เปลี่ยนความหมายเมื่อไหร่ ต้องเปลี่ยนสีและมีคำกำกับด้วย
    //    ตัวเลขสองความหมายที่หน้าตาเหมือนกันเป๊ะ อ่านผิดได้ทันที
    histTotalLabel: money(st.histDisp === 'destroy' ? st.histLost : st.histSaved),
    histTotalColor: st.histDisp === 'destroy' ? '#c2543c' : '#2f7d5d',
    // คำกำกับโผล่เฉพาะตอนกรองสถานะ — ไม่กรองแล้วหน้าตาเหมือนเดิมทุกจุด
    histTotalNote: st.histDisp === 'destroy' ? 'ทำลาย' : (st.histDisp === 'reuse' ? 'นำกลับใช้' : ''),
    histTruncated: st.histTotal > rows.length,
    histTruncLabel: 'แสดง ' + rows.length.toLocaleString('en-US') + ' จาก ' + st.histTotal.toLocaleString('en-US') + ' รายการ',
    loadMoreHistory: app.loadMoreHistory,
    loadMoreLabel: st.histLoading ? 'กำลังโหลด' : 'ดูเพิ่มอีก 60 รายการ',

    // ส่งออกเฉพาะที่กรองอยู่ — ต่างจากปุ่มในหน้าสรุปที่ส่งออกทั้งปีงบ
    exportHistoryCsv: app.exportHistoryCsv,
    histExportLabel: st.exporting ? 'กำลังสร้างไฟล์' : 'ส่งออก CSV',

    // ── ถังขยะ · ดูรายล็อต · ช่วงวันที่เลือกเอง ─────────────────────────────
    histTrash: st.histTrash,
    openLots: app.openLots,

    // ── แผ่นตัวกรองฝั่งมือถือ (โทนเดียวกับหน้ารายการ Lot) ──────────────
    histFilterOpen: !!st.histFilterOpen,
    openHistFilter: app.openHistFilter,
    closeHistFilter: app.closeHistFilter,
    // 🚨 ต้องนับถังขยะด้วย — เปิดถังขยะค้างไว้แล้วซ่อนปุ่มไป
    //    จะงงว่าทำไมรายการที่บันทึกวันนี้หายหมด
    histFilterCount: (st.histRange === 'custom' ? 1 : 0) + (st.histTrash ? 1 : 0)
      + (st.histLot ? 1 : 0),
    toggleTrash: app.toggleTrash,
    trashLabel: st.histTrash ? 'กลับไปดูรายการปกติ' : 'ถังขยะ',
    histLot: st.histLot,
    clearLot: () => app.viewLot(''),
    histFrom: st.histFrom,
    histTo: st.histTo,
    onHistFrom: app.onHistFrom,
    onHistTo: app.onHistTo,
    isCustomRange: st.histRange === 'custom',
    // 🚨 หัวเรื่องต้องสั้น (พี่กันสั่ง 10 ก.ย. 2569 "เขียนแค่ ถังขยะพอ")
    //    ของเดิม 'ถังขยะ — รายการที่ลบไปแล้ว' ยาวจนดันปุ่มส่งออกตกไปอีกแถว
    //    หัวเรื่องอยู่แถวเดียวกับช่องค้นหา ชิปช่วงเวลา ช่องวันที่ และปุ่มส่งออก
    //    ยาวขึ้นนิดเดียวก็ดันของท้ายแถวตกบรรทัดทันที
    histTitle: st.histTrash
      ? 'ถังขยะ'
      : st.histLot ? 'Lot ' + st.histLot : '',
    histEmptyLabel: st.histTrash ? 'ถังขยะว่าง ไม่มีรายการที่ถูกลบ' : 'ไม่พบรายการตามเงื่อนไขนี้',

    // รายการล็อต
    lots: st.lots.map((l) => ({
      key: l.lot,
      lot: l.lot,
      dateLabel: thaiDate(l.date),
      by: l.by || '—',
      itemsLabel: l.items + ' รายการ',
      savedLabel: money(Number(l.saved || 0)),
      open: () => app.viewLot(l.lot)
    })),
    lotsLoading: st.lotsLoading,
    loadLots: app.loadLots,

    confirmOpen: !!st.confirm,
    confirmTitle: st.confirm ? st.confirm.title : '',
    confirmDetail: st.confirm ? st.confirm.detail : '',
    confirmNote: st.confirm ? st.confirm.note : '',
    confirmOkLabel: st.confirm ? st.confirm.okLabel : '',
    // แบบของป๊อป — 'normal' = ยืนยันการกระทำปกติ (ปุ่มเขียวอยู่ขวา)
    // ไม่ระบุ = ป๊อปลบ (ปุ่มแดงอยู่ซ้าย ตั้งใจสลับกันเผลอกด)
    confirmKind: st.confirm ? (st.confirm.kind || 'danger') : 'danger',
    // รายการสรุปแบบตาราง สำหรับป๊อปที่ต้องให้เห็นหลายอย่างก่อนตัดสินใจ
    confirmLines: st.confirm ? (st.confirm.lines || null) : null,
    confirmCancelLabel: st.confirm ? (st.confirm.cancelLabel || 'ยกเลิก') : 'ยกเลิก',
    // ── ช่องเลือกชื่อผู้ทำ — ใช้กับป๊อปที่ต้องตอบผู้ตรวจได้ว่าใครกด (ผลตรวจข้อ ต-6)
    //    ป๊อปไหนไม่ได้ตั้ง who ไว้ ช่องนี้จะไม่โผล่และไม่กั้นอะไรเลย
    //    ยกแพตเทิร์นมาจากหน้าต่างแก้ไขล็อตทั้งดุ้น (ข้อ 3.26) ให้มือจำที่เดียว
    confirmWhoLabel: st.confirm ? (st.confirm.who || '') : '',
    confirmWho: st.confirmWho || '',
    confirmWhoOk: !st.confirm || !st.confirm.who || !!String(st.confirmWho || '').trim(),
    confirmStaff: st.staff || [],
    onConfirmWho: (e) => app.setState({ confirmWho: e.target.value }),
    confirmRun: () => {
      const c = app.state.confirm;
      if (!c) return;
      // 🚨 ป๊อปที่ขอชื่อผู้ทำ ต้องเลือกก่อนถึงกดได้ (ผลตรวจข้อ ต-6)
      //    ปุ่มถูกปิดไว้อยู่แล้ว ตรงนี้เป็นด่านที่สองกันเรียกจากที่อื่น
      const who = String(app.state.confirmWho || '').trim();
      if (c.who && !who) return;
      // ปิดป๊อปก่อนเสมอ แล้วค่อยทำงาน — ไม่งั้นป๊อปค้างบังจอ
      // (handler บางตัวปิดเอง บางตัวลืม ทำให้พฤติกรรมไม่เหมือนกัน)
      app.setState({ confirm: null }, () => c.run(who));
    },
    closeConfirm: app.closeConfirm
  };
}
