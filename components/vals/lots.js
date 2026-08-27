// ค่าของหน้ารายการ Lot + ใบสรุป Lot
import { money, thaiDate, SOURCES, thaiDateFull } from '@/lib/format';
import { qtyText, evalQty, isQtyExpr, exprText } from '../helpers';
import { nameParts } from './record';
import { pillColorOf } from '@/lib/drugPillColors';

const RANGES = [
  { key: 'today', label: 'วันนี้' },
  { key: 'week', label: '7 วัน' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'fy', label: 'ปีงบ' }
];

// ── คอลัมน์ของตารางรายการ Lot ────────────────────────────────────────────
// พี่กันสั่ง 26 ส.ค. 2569: "อยากให้มันมีหัวคอลัมน์ กดเรียงได้ มีช่องให้ค้นหาได้
//  และแบ่งคอลัมน์วันที่ คอลัมน์ชื่อคนที่ลง คอลัมน์แหล่งที่มา เพราะจะได้กรองได้"
// เดิมเป็นการ์ดที่ยัดสามอย่างรวมในบรรทัดเดียว จึงกรองไม่ได้และช่องไฟเหลือเยอะ
const COLS = [
  // 🚨 กว้าง 116px ไม่ใช่ 92px — ฟอนต์ Roboto Mono ตัวเลขกว้างกว่า Sarabun
  //    ที่ 92px วันที่ตกบรรทัดเป็นสองแถว แถวทั้งตารางเลยสูงขึ้นตาม (เจอ 27 ส.ค. 2569)
  { key: 'date',  label: 'วันที่',      w: '116px' },
  { key: 'lot',   label: 'เลข Lot',     w: '108px' },
  { key: 'by',    label: 'ผู้บันทึก',    flex: true },
  { key: 'src',   label: 'แหล่งที่มา',   w: '108px' },
  // 🚨 รพ.สต. เป็นคอลัมน์ของตัวเอง ไม่ใช่บรรทัดล่างของแหล่งที่มา (พี่กันสั่ง 26 ส.ค. 2569)
  //    แยกแล้วจึงกดเรียงเพื่อจับกลุ่มยาที่คืนจากแห่งเดียวกันมาอยู่ติดกันได้
  { key: 'site',  label: 'รพ.สต.',      w: '120px' },
  // 🚨 ความกว้างตรงนี้ต้องตรงกับที่เขียนในแถว (pages/lots.jsx) เป๊ะ ๆ
  //    แก้ที่เดียวไม่พอ หัวกับช่องจะเหลื่อมกันทันที
  //    ขยาย 27 ส.ค. 2569 — คอลัมน์ตัวเลขเดิมแคบจนตัวเลขดูอึดอัด ทั้งที่คอลัมน์ผู้บันทึก
  //    (flex:1 กินที่เหลือ) กว้างถึง 27% ของตารางแล้วปล่อยว่าง · ที่เพิ่มมาหักจากตรงนั้น
  { key: 'items', label: 'รายการ',      w: '88px',  align: 'center' },
  { key: 'saved', label: 'ใช้ต่อได้',    w: '116px', align: 'right' },
  { key: 'lost',  label: 'ทำลาย',       w: '100px', align: 'right' },
  { key: 'act',   label: 'จัดการ',      w: '262px', align: 'center', noSort: true }
];

// ค่าที่ใช้เทียบตอนเรียง — คอลัมน์ตัวเลขต้องเทียบแบบตัวเลข ไม่ใช่ตัวอักษร
// (ไม่งั้น 1,402.50 จะมาก่อน 550.00 เพราะเทียบทีละตัวอักษร)
const SORT_VAL = {
  date:  (l) => String(l.date || ''),
  lot:   (l) => String(l.lot || ''),
  by:    (l) => String(l.by || ''),
  src:   (l) => String(l.src || ''),
  // แถวที่ไม่มี รพ.สต. ให้ไปกองท้ายสุดเสมอ ไม่ปนกับแห่งที่มีชื่อ
  site:  (l) => String(l.pcuSite || '') || 'ๅๅๅ',
  items: (l) => Number(l.items || 0),
  saved: (l) => Number(l.saved || 0),
  lost:  (l) => Number(l.lost || 0)
};

export function lotsVals(app, d) {
  const st = d.st;
  const lots = st.lots || [];
  const slip = st.slipLot;
  const slipRows = st.slipRows || [];
  const pcuFull = st.pcuFull || {};

  // ── ช่องค้น ───────────────────────────────────────────────────────────
  // ค้นได้ทั้งเลข Lot · ชื่อผู้บันทึก · ชื่อ รพ.สต. ในช่องเดียว
  // พิมพ์หลายคำได้ ต้องเจอครบทุกคำถึงนับว่าใช่ (ท่าเดียวกับช่องค้นยา)
  const lq = String(st.lotsQuery || '').trim().toLowerCase();
  const words = lq ? lq.split(/s+/) : [];

  // ── ตัวกรองแหล่งที่มา — เลือกสองชั้น ─────────────────────────────────
  // ชั้นแรกเลือกว่ามาจากไหน · ถ้าเลือก รพ.สต. ค่อยมีช่องที่สองให้เจาะว่าแห่งไหน
  // 🚨 เคยยัดทั้ง 13 แห่งลงดรอปดาวน์เดียวกับแหล่งที่มา รายการยาวเป็นหางว่าว
  //    พี่กันสั่งแก้ทันที 26 ส.ค. 2569 — เลือกสองรอบชัดกว่าและสั้นกว่ามาก
  const sfSrc = String(st.lotsSrcFilter || '');
  const sfSite = sfSrc === 'pcu' ? String(st.lotsSiteFilter || '') : '';

  const filtered = lots.filter((l) => {
    if (sfSrc && String(l.src || '') !== sfSrc) return false;
    if (sfSite && String(l.pcuSite || '') !== sfSite) return false;
    if (!words.length) return true;
    const hay = (String(l.lot || '') + ' ' + String(l.by || '') + ' ' + String(l.pcuSite || '')).toLowerCase();
    for (const w of words) if (hay.indexOf(w) < 0) return false;
    return true;
  });

  // ── การเรียง ─────────────────────────────────────────────────────────
  // ยังไม่กดหัวคอลัมน์ = เรียงตามที่ฐานส่งมา (วันที่ใหม่สุดก่อน) ซึ่งถูกอยู่แล้ว
  const sk = st.lotsSortKey;
  const sorted = sk && SORT_VAL[sk]
    ? filtered.slice().sort((a, b2) => {
        const va = SORT_VAL[sk](a);
        const vb = SORT_VAL[sk](b2);
        let c = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'th');
        // ค่าเท่ากันให้เรียงตามเลข Lot กันแถวสลับไปมาทุกครั้งที่วาดจอใหม่
        if (c === 0) c = String(a.lot || '').localeCompare(String(b2.lot || ''));
        return st.lotsSortDir === 'asc' ? c : -c;
      })
    : filtered;

  // ยอดรวมของใบสรุป — คิดจากแถวจริงที่ดึงมา ไม่ใช้ยอดจากหน้ารายการ
  // (ถ้ามีคนลบแถวไปหลังเปิดหน้ารายการ ตัวเลขบนใบต้องตรงกับรายการที่พิมพ์ออกมา)
  let slipSaved = 0;
  let slipLost = 0;
  for (const r of slipRows) {
    const v = Number(r.price || 0) * Number(r.qty || 0);
    if (r.disposition === 'reuse') slipSaved += v; else slipLost += v;
  }

  return {
    isLots: st.screen === 'lots',
    // จอกว้างวาดเป็นตาราง จอแคบวาดเป็นการ์ด — ตาราง 8 คอลัมน์ยัดลงมือถือไม่ได้
    lotsWide: !!d.wide,
    closeLots: app.closeLots,
    lotsLoading: !!st.lotsLoading && !lots.length,
    lotsEmpty: !st.lotsLoading && !sorted.length,
    // แยกสองกรณีออกจากกัน — ไม่มี Lot เลย กับ มี Lot แต่ตัวกรองคัดออกหมด
    // ข้อความแนะนำต้องคนละแบบ ไม่งั้นผู้ใช้ไปเปลี่ยนช่วงเวลาทั้งที่ปัญหาอยู่ที่ช่องค้น
    lotsFilteredOut: !st.lotsLoading && !!lots.length && !sorted.length,
    lotsCountLabel: sorted.length.toLocaleString('en-US') + ' Lot'
      + (sorted.length !== lots.length ? ' จากทั้งหมด ' + lots.length.toLocaleString('en-US') : ''),
    // ยอดรวมของที่เห็นอยู่ตอนนี้ — กรองแล้วต้องรู้ว่าเหลือเงินเท่าไร
    lotsSumLabel: money(sorted.reduce((t, l) => t + Number(l.saved || 0) + Number(l.lost || 0), 0)),
    lotsHasMore: sorted.length > st.lotsShown,
    lotsMoreLabel: 'ดูเพิ่มอีก ' + Math.min(40, sorted.length - st.lotsShown).toLocaleString('en-US') + ' Lot',
    moreLots: app.moreLots,

    // ── แถบเครื่องมือของตาราง ─────────────────────────────────────────
    lotsQuery: st.lotsQuery || '',
    onLotsQuery: app.onLotsQuery,
    clearLotsQuery: app.clearLotsQuery,
    lotsHasSearch: !!String(st.lotsQuery || '').trim(),

    // ดรอปดาวน์กรองแหล่งที่มา — รวมทั้งแบบเหมากลุ่มและเจาะ รพ.สต. รายแห่งไว้ตัวเดียว
    // ทำเป็นสองดรอปดาวน์แยกจะกินที่และต้องคิดว่าอันไหนคุมอันไหน
    lotsSrcFilter: st.lotsSrcFilter || '',
    setLotsSrc: app.setLotsSrc,
    lotsSrcOptions: SOURCES.map((o) => ({ value: o.key, label: o.label })),
    lotsSiteFilter: st.lotsSiteFilter || '',
    setLotsSite: app.setLotsSite,
    // ช่องที่สองโผล่เฉพาะตอนเลือกแหล่งที่มาเป็น รพ.สต. เท่านั้น
    lotsSiteOn: String(st.lotsSrcFilter || '') === 'pcu',

    // ปุ่มล้างค่าโผล่เฉพาะตอนมีเงื่อนไขอยู่จริง ไม่งั้นเป็นปุ่มที่กดแล้วไม่เกิดอะไร
    lotsHasFilter: !!(String(st.lotsQuery || '').trim() || st.lotsSrcFilter || st.lotsSiteFilter),
    clearLotsFilters: app.clearLotsFilters,

    // ── ช่วงวันที่ที่เลือกเอง ─────────────────────────────────────────
    lotsFrom: st.lotsFrom || '',
    lotsTo: st.lotsTo || '',
    onLotsFrom: app.onLotsFrom,
    onLotsTo: app.onLotsTo,
    // ขอบช่องเป็นสีเขียวตอนกำลังใช้ช่วงที่กรอกเอง ให้รู้ว่าปุ่มด้านขวาไม่ได้คุมอยู่
    lotsCustomRange: st.lotsRange === 'custom',

    // ── ส่งออกไฟล์ CSV ───────────────────────────────────────────────
    // 🚨 ส่งออกเฉพาะแถวที่กรองอยู่ (sorted) ไม่ใช่ทั้งหมดที่โหลดมา
    //    และไม่ใช่แค่ 40 แถวแรกที่วาดอยู่ ต้องได้ครบทุกแถวที่ตรงเงื่อนไข
    doExportLots: () => app.exportLotsCsv(
      sorted.map((l) => ({
        date: l.date,
        lot: l.lot,
        by: l.by || '',
        srcLabel: srcLabel(l.src) || '',
        site: l.src === 'pcu' ? String(l.pcuSite || '') : '',
        items: l.items,
        saved: l.saved,
        lost: l.lost
      })),
      {
        orgName: st.orgName,
        rangeLabel: st.lotsRange === 'custom'
          ? (st.lotsFrom || '?') + ' ถึง ' + (st.lotsTo || '?')
          : (RANGES.find((r) => r.key === st.lotsRange) || {}).label || '',
        filterLabel: [
          String(st.lotsQuery || '').trim() ? 'ค้นว่า ' + st.lotsQuery.trim() : '',
          st.lotsSrcFilter ? 'แหล่งที่มา ' + (srcLabel(st.lotsSrcFilter) || st.lotsSrcFilter) : '',
          st.lotsSiteFilter ? 'รพ.สต. ' + st.lotsSiteFilter : ''
        ].filter(Boolean).join(' · '),
        printedOn: st.today,
        fileName: 'รายการ-Lot-ยาคืน-' + (st.today || '') + '.csv'
      }
    ),
    // 🚨 รายชื่อ รพ.สต. ต้องมาจากการตั้งค่า (ทั้ง 13 แห่ง) ไม่ใช่จากที่โผล่ในข้อมูล
    //    เคยทำแบบเอาเฉพาะแห่งที่เคยคืนยาจริง แล้วพี่กันเปิดมาเจอรายการว่างเปล่า
    //    เพราะยังไม่มีล็อตไหนกรอกชื่อแห่งไว้เลย (26 ส.ค. 2569 "ทำไมเลือก รพ.สต. ไม่ได้")
    //    ตัวกรองที่เลือกอะไรไม่ได้เลย แย่กว่าตัวกรองที่มีตัวเลือกซึ่งยังไม่มีข้อมูล
    //    ต่อท้ายด้วยจำนวน Lot ให้เห็นว่าแห่งไหนมีของ แห่งไหนยังว่าง
    lotsSiteOptions: (() => {
      const counts = {};
      for (const l of lots) {
        if (l.src !== 'pcu') continue;
        const n = String(l.pcuSite || '').trim();
        if (n) counts[n] = (counts[n] || 0) + 1;
      }
      // รายชื่อจากการตั้งค่าก่อน แล้วเติมชื่อที่โผล่ในข้อมูลแต่ไม่อยู่ในรายชื่อ
      // (เผื่อมีแห่งที่ถูกลบออกจากการตั้งค่าไปแล้ว แต่ข้อมูลเก่ายังอ้างถึงอยู่)
      const names = [...new Set([...(st.pcuSites || []), ...Object.keys(counts)])]
        .map((n) => String(n).trim()).filter(Boolean)
        .sort((x, y) => x.localeCompare(y, 'th'));
      return names.map((n) => ({
        value: n,
        label: n + (counts[n] ? ' (' + counts[n] + ')' : '')
      }));
    })(),

    // หัวคอลัมน์กดเรียงได้ · ↑ น้อยไปมาก ↓ มากไปน้อย ↑↓ ยังไม่ได้เรียง
    // พี่กันสั่ง 27 ส.ค. 2569 ให้เอาแบบที่ชี้ให้ดู — ลูกศรขึ้นกับลง ตัวใหญ่ ๆ เห็นชัด
    // ของเดิมเป็นสามเหลี่ยม ▲▼↕ ขนาด 10px ซึ่งเล็กจนดูไม่ออกว่าเรียงทางไหนอยู่
    lotCols: COLS.map((c) => {
      const on = sk === c.key;
      return {
        key: c.key,
        label: c.label,
        w: c.w,
        flex: !!c.flex,
        align: c.align,
        noSort: !!c.noSort,
        arrow: c.noSort ? '' : (on ? (st.lotsSortDir === 'asc' ? '↑' : '↓') : '↑↓'),
        arrowColor: on ? '#2f7d5d' : 'rgba(30,36,32,.34)',
        // ตัวที่กำลังเรียงอยู่ใหญ่กว่าเพื่อน เพราะเป็นตัวเดียวที่ต้องอ่านจริง ๆ
        // 🚨 ขนาดนี้มาจากรูปที่พี่กันชี้ให้ดู 27 ส.ค. 2569 — ลูกศรใหญ่พอ ๆ กับตัวหนังสือ
        //    รอบแรกทำ 12/15px ซึ่งเล็กกว่าในรูปมาก พี่กันทักว่า "อันเล็กนิดเดียวเอง"
        arrowSize: on ? '19px' : '16px',
        fg: on ? '#2f7d5d' : '#414a44',
        pick: c.noSort ? null : (() => app.setLotsSort(c.key))
      };
    }),

    lotsHeadRef: app.lotsHeadRef,

    lotsRanges: RANGES.map((r) => ({
      key: r.key,
      label: r.label,
      on: st.lotsRange === r.key,
      bg: st.lotsRange === r.key ? '#2f7d5d' : '#f0f1ee',
      fg: st.lotsRange === r.key ? '#fff' : '#414a44',
      pick: () => app.setLotsRange(r.key)
    })),

    lotRows: sorted.slice(0, st.lotsShown).map((l) => {
      const saved = Number(l.saved || 0);
      const lost = Number(l.lost || 0);
      return {
        key: l.lot,
        lot: l.lot,
        dateLabel: thaiDate(l.date),
        by: l.by || 'ไม่ระบุผู้บันทึก',
        // ป้ายเล็กบอกว่าล็อตนี้มาจาก รพ.สต. ไหน — ว่างเมื่อไม่ได้มาจาก รพ.สต.
        siteLabel: l.src === 'pcu' ? String(l.pcuSite || '').trim() : '',
        // แหล่งที่มาเป็นคอลัมน์ของตัวเองแล้ว ไม่ใช่ข้อความห้อยท้ายชื่อคนเหมือนเดิม
        srcText: srcLabel(l.src) || '—',
        // ยาที่คืนจาก รพ.สต. แต่ไม่ได้เลือกว่าแห่งไหน — ต้องเห็นว่าข้อมูลไม่ครบ
        siteMissing: l.src === 'pcu' && !String(l.pcuSite || '').trim(),
        itemsLabel: Number(l.items || 0).toLocaleString('en-US') + ' รายการ',
        // ในตารางใช้เลขเปล่า เพราะหัวคอลัมน์บอกอยู่แล้วว่าเป็นจำนวนรายการ
        itemsCount: Number(l.items || 0).toLocaleString('en-US'),
        // 🚨 ไม่รวมจำนวนข้ามหน่วยนับตรงนี้ (เม็ด+ขวด+หลอด บวกกันไม่มีความหมาย)
        //    ฐานข้อมูลส่ง qty รวมมาก็จริง แต่หน้านี้ไม่เอามาโชว์ ให้ดูมูลค่าแทน
        savedLabel: money(saved),
        lostLabel: lost > 0 ? money(lost) : '',
        hasLost: lost > 0,
        openHistory: () => app.openLotInHistory(l.lot),
        openSlip: () => app.openLotSlip(l),
        openEdit: () => app.openLotEdit(l.lot)
      };
    }),

    // ── ใบสรุป Lot สำหรับพิมพ์ ───────────────────────────────────────────────
    slipOpen: !!slip,
    slipLoading: !!st.slipLoading,
    slipLot: slip ? slip.lot : '',
    // 🚨 เอกสารราชการเขียนเดือนเต็ม ไม่ใช้ตัวย่อแบบที่ใช้บนหน้าจอ (พี่กันสั่ง 26 ส.ค. 2569)
    slipDate: slip ? thaiDateFull(slip.date) : '',
    slipBy: slip ? (slip.by || 'ไม่ระบุผู้บันทึก') : '',
    // ใบที่พิมพ์ออกมาต้องบอกได้ว่ายาชุดนี้มาจาก รพ.สต. ไหน
    // ไม่งั้นส่งใบกลับไปให้ต้นทางแล้วเขาไม่รู้ว่าเป็นของตัวเองหรือเปล่า
    slipSite: slip && slip.src === 'pcu' ? String(slip.pcuSite || '').trim() : '',
    // 🚨 ในใบที่พิมพ์ใช้ชื่อเต็มตามทะเบียน ไม่ใช่ชื่อสั้นแบบที่ใช้บนหน้าจอ
    //    เพราะใบนี้ถูกส่งกลับไปให้ รพ.สต. ต้นทางเก็บเป็นหลักฐาน
    //    เอกสารที่ส่งออกนอกห้องยาต้องเรียกชื่อหน่วยงานให้ถูกต้องตามทะเบียน
    //    map มาจากฐาน (mr_setting.pcu_full) · ไม่มีใน map ค่อยเติมคำนำหน้าให้
    slipSiteFull: slip && slip.src === 'pcu' && slip.pcuSite
      ? (pcuFull[slip.pcuSite] || ('โรงพยาบาลส่งเสริมสุขภาพตำบลบ้าน' + slip.pcuSite))
      : '',
    slipOrg: st.orgName,

    // ── ของที่เอกสารทางการต้องมี (พี่กันสั่ง 26 ส.ค. 2569) ────────────────────
    // เลขที่เอกสาร — ใช้เลข Lot เป็นฐาน เพราะ 1 Lot = 1 ใบเสมอ ไม่มีทางซ้ำ
    // นำหน้าด้วย ยค. (ยาคืน) ให้แยกออกจากเอกสารอื่นของห้องยาตอนเก็บเข้าแฟ้ม
    slipDocNo: slip ? 'ยค. ' + slip.lot : '',
    // วันเวลาที่พิมพ์ — ผู้ตรวจสอบต้องรู้ว่าใบในมือพิมพ์เมื่อไร
    // เพราะยอดอาจเปลี่ยนได้ถ้ามีคนแก้ล็อตย้อนหลังทีหลัง (ซึ่งระบบอนุญาต)
    slipPrintedAt: st.slipPrintedAt || '',
    // ชื่อไฟล์ตอนบันทึกเป็น PDF — เบราว์เซอร์ใช้ชื่อหน้าเว็บเป็นชื่อไฟล์
    slipFileName: slip ? 'ใบสรุปยาคืน-' + slip.lot : 'ใบสรุปยาคืน',
    savePdf: app.saveLotSlipPdf,
    slipRows: slipRows.map((r, i) => ({
      key: r.id != null ? r.id : i,
      no: String(i + 1),
      name: r.name,
      qtyLabel: qtyText(r.qty) + ' ' + r.unit,
      priceLabel: Number(r.price || 0).toFixed(2),
      valueLabel: (Number(r.price || 0) * Number(r.qty || 0)).toFixed(2),
      dispLabel: r.disposition === 'reuse' ? 'ใช้ต่อ' : 'ทำลาย',
      dispColor: r.disposition === 'reuse' ? '#2f7d5d' : '#c2543c',
      hn: r.hn || '—'
    })),
    slipCountLabel: slipRows.length.toLocaleString('en-US') + ' รายการ',
    // แหล่งที่มาแบบเต็มสำหรับหัวเอกสาร — รวมชื่อ รพ.สต. ไว้ในบรรทัดเดียว
    // แหล่งที่มาบรรทัดเดียวโดด ๆ ชื่อ รพ.สต. แยกไปอยู่บรรทัดหน่วยบริการต้นทาง
    slipSrcLabel: slip ? srcLabel(slip.src) : '',
    slipSavedLabel: money(slipSaved),
    slipLostLabel: money(slipLost),
    slipHasLost: slipLost > 0,
    slipTotalLabel: money(slipSaved + slipLost),
    closeLotSlip: app.closeLotSlip,
    printLotSlip: app.printLotSlip,

    // ── หน้าต่างแก้ไขล็อต ────────────────────────────────────────────────────
    ...lotEditVals(app, st)
  };
}

// ── ค่าของหน้าต่างแก้ไขล็อต (พี่กันสั่ง 25 ส.ค. 2569) ────────────────────────
// แยกออกมาเป็นฟังก์ชันของตัวเองเพราะยาว และเป็นคนละเรื่องกับหน้ารายการล็อต
//
// 🚨 ป้าย "แก้แล้ว" ต้องเทียบกับค่าเดิมจริง ๆ ไม่ใช่ "แตะช่องนั้นหรือยัง"
//    ผู้ใช้ที่เปลี่ยนไปแล้วเปลี่ยนกลับ ต้องไม่เห็นป้ายค้าง ไม่งั้นจะนึกว่ายังมีอะไรรออยู่
function lotEditVals(app, st) {
  const e = st.lotEdit;
  if (!e || !e.rows) {
    return {
      lotEditOpen: !!e,
      lotEditLoading: !!st.lotEditLoading,
      lotEditLot: e ? e.lot : '',
      lotEditRows: [],
      lotEditLog: [],
      closeLotEdit: app.closeLotEdit
    };
  }

  const origById = new Map(e.orig.rows.map((r) => [r.id, r]));
  let saved = 0;
  let lost = 0;
  let rowChanges = 0;
  for (const r of e.rows) {
    const v = Number(r.price || 0) * Number(r.qty || 0);
    if (r.disposition === 'reuse') saved += v; else lost += v;
    const o = origById.get(r.id);
    if (o && (Number(o.qty) !== Number(r.qty) || o.disposition !== r.disposition)) rowChanges++;
  }

  const byChanged = e.recordedBy !== e.orig.recordedBy;
  const srcChanged = e.source !== e.orig.source;
  // ย้ายออกจาก รพ.สต. ถือว่าชื่อถูกล้าง จึงนับเป็นการเปลี่ยนด้วย
  const siteNow = e.source === 'pcu' ? (e.pcuSite || '') : '';
  const siteWas = e.orig.source === 'pcu' ? (e.orig.pcuSite || '') : '';
  const siteChanged = siteNow !== siteWas;
  const dateChanged = e.date !== e.orig.date;
  const lotChanges = (byChanged ? 1 : 0) + (srcChanged ? 1 : 0) + (dateChanged ? 1 : 0) + (siteChanged ? 1 : 0);
  const dirty = lotChanges + rowChanges > 0;

  // สรุปว่าจะเปลี่ยนอะไรบ้าง — ใช้ในหน้าต่างยืนยัน ผู้ใช้จะได้เห็นก่อนกดจริง
  const summary = [];
  if (byChanged) summary.push({ k: 'by', label: 'ผู้บันทึก', from: e.orig.recordedBy || 'ไม่ระบุ', to: e.recordedBy });
  if (srcChanged) summary.push({ k: 'src', label: 'แหล่งที่มา', from: srcLabel(e.orig.source), to: srcLabel(e.source) });
  if (siteChanged) summary.push({ k: 'site', label: 'รพ.สต. ต้นทาง', from: siteWas || 'ไม่ระบุ', to: siteNow || 'ไม่ระบุ' });
  if (dateChanged) summary.push({ k: 'date', label: 'วันที่รับคืน', from: thaiDate(e.orig.date), to: thaiDate(e.date) });

  return {
    lotEditOpen: true,
    lotEditLoading: false,
    lotEditLot: e.lot,
    lotEditBusy: !!st.lotEditBusy,
    lotEditDirty: dirty,
    lotEditSaveBg: dirty && !st.lotEditBusy ? '#2f7d5d' : '#e9ebe8',
    lotEditSaveFg: dirty && !st.lotEditBusy ? '#fff' : '#b8bdb9',
    lotEditSaveLabel: st.lotEditBusy ? 'กำลังบันทึก' : 'บันทึกการแก้ไข',
    lotEditCountLabel: e.rows.length.toLocaleString('en-US') + ' รายการ',
    lotEditTotalLabel: money(saved + lost),
    lotEditSavedLabel: money(saved),
    lotEditLostLabel: money(lost),
    lotEditHasLost: lost > 0,
    closeLotEdit: app.closeLotEdit,

    // ค่าระดับล็อต
    lotEditBy: e.recordedBy,
    lotEditByChanged: byChanged,
    lotEditByWas: e.orig.recordedBy || 'ไม่ระบุ',
    lotEditStaff: (st.staff || []).slice(),
    onLotEditBy: (ev) => app.setLotEditField('recordedBy', ev.target.value),
    lotEditDate: e.date,
    lotEditDateChanged: dateChanged,
    lotEditDateWas: thaiDate(e.orig.date),
    lotEditDateMax: st.today,
    onLotEditDate: (ev) => app.setLotEditField('date', ev.target.value),
    lotEditSrcChanged: srcChanged,
    lotEditSrcWas: srcLabel(e.orig.source),
    lotEditSources: SOURCES.map((s) => ({
      key: s.key,
      label: s.label,
      bg: e.source === s.key ? '#2f7d5d' : '#fff',
      on: e.source === s.key,
      fg: e.source === s.key ? '#fff' : '#414a44',
      border: e.source === s.key ? '#2f7d5d' : 'rgba(30,36,32,.14)',
      pick: () => app.setLotEditField('source', s.key)
    })),

    // 🚨 ก้อนนี้มีรูปร่างเหมือนกับที่หน้าบันทึกส่งให้ renderPcuField เป๊ะ ๆ
    //    ตัววาดจึงใช้ตัวเดียวกันได้ทั้งสองที่ โดยไม่ต้องรู้ว่าถูกเรียกจากหน้าไหน
    lotEditPcu: {
      pcuOn: e.source === 'pcu',
      pcuSite: e.pcuSite || '',
      pcuSites: Array.isArray(st.pcuSites) ? st.pcuSites : [],
      onPcuSite: (ev) => app.setLotEditField('pcuSite', ev.target.value)
    },
    lotEditSiteChanged: siteChanged,
    lotEditSiteWas: siteWas || 'ไม่ระบุ',

    // ตารางรายการ
    lotEditRows: e.rows.map((r) => {
      const o = origById.get(r.id) || r;
      const qtyChanged = Number(o.qty) !== Number(r.qty);
      const dispChanged = o.disposition !== r.disposition;
      const editing = st.lotEditQtyId === r.id;
      const reuse = r.disposition === 'reuse';
      const nq = evalQty(st.lotEditQtyText);
      const canSave = editing && nq > 0 && nq !== Number(r.qty);
      return {
        key: r.id,
        np: (() => {
          // ชื่อยาต้องหน้าตาเหมือนทุกหน้าในเว็บ — ดึงข้อมูลดิบจากคลังด้วยรหัสยา
          // ยานอกบัญชีที่ไม่มีรหัส ตกไปใช้ชื่อที่แช่ไว้ในแถว
          const master = r.drugId != null ? (st.drugs || []).find((x) => x.id === r.drugId) : null;
          const pill = master ? pillColorOf(master) : null;
          const base = nameParts(master || { name: r.name }, pill ? pill.color : '');
          return Object.assign({}, base, {
            mkBefore: base.base, mkHit: '', mkAfter: '',
            abBefore: base.abbrev, abHit: '', abAfter: '',
            bdBefore: base.brand, bdHit: '', bdAfter: '',
            pillLabel: pill ? pill.label : '',
            pillColor: pill ? pill.color : '',
            strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
          });
        })(),
        qtyLabel: qtyText(r.qty) + ' ' + r.unit,
        priceLabel: Number(r.price || 0).toFixed(2),
        valueLabel: money(Number(r.price || 0) * Number(r.qty || 0)),
        valueColor: reuse ? '#2f7d5d' : '#c2543c',
        rowBg: qtyChanged || dispChanged ? '#fdfaf2' : (reuse ? '#fff' : '#fdf7f5'),
        wasLabel: qtyChanged ? 'เดิม ' + qtyText(o.qty) + ' ' + r.unit : '',
        // แก้จำนวน — กติกาเดียวกับหน้าบันทึกทุกอย่าง (สูตร · Enter 2 จังหวะ · ปุ่ม ✓ ปิดเมื่อค่าเดิม)
        editing: editing,
        editText: editing ? st.lotEditQtyText : '',
        editPreview: editing && isQtyExpr(st.lotEditQtyText) && nq > 0
          ? exprText(st.lotEditQtyText) + ' = ' + nq + ' ' + r.unit : '',
        editCanSave: canSave,
        editOkBg: canSave ? '#2f7d5d' : '#e9ebe8',
        editOkFg: canSave ? '#fff' : '#b8bdb9',
        startQty: () => app.startLotQty(r.id, r.qty),
        onQty: (ev) => app.changeLotQty(ev.target.value),
        onQtyKey: (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            if (isQtyExpr(st.lotEditQtyText) && evalQty(st.lotEditQtyText) > 0) { app.resolveLotQty(); return; }
            app.commitLotQty();
          } else if (ev.key === 'Escape') { ev.preventDefault(); app.cancelLotQty(); }
        },
        commitQty: app.commitLotQty,
        cancelQty: app.cancelLotQty,
        // ใช้ต่อ / ทำลาย
        pillBg: reuse ? '#f0f1ee' : '#fbe4dd',
        reuseBg: reuse ? '#fff' : 'transparent',
        reuseOn: reuse,
        reuseFg: reuse ? '#2f7d5d' : '#c9a096',
        destroyBg: reuse ? 'transparent' : '#fff',
        destroyFg: reuse ? '#6f7873' : '#c2543c',
        setReuse: () => app.setLotRowDisp(r.id, 'reuse'),
        setDestroy: () => app.setLotRowDisp(r.id, 'destroy')
      };
    }),

    // หน้าต่างยืนยัน
    lotEditConfirm: !!st.lotEditConfirm,
    // 🚨 ชื่อผู้แก้เลือกในหน้าต่างยืนยันเอง ไม่ผูกกับช่องผู้บันทึกในหน้าบันทึก
    //    (เดิมผูกไว้ พอไม่ได้เลือกในหน้านั้น กดยืนยันแล้วเงียบ ดูเหมือนปุ่มเสีย)
    lotEditWho: st.lotEditWho || '',
    lotEditWhoOk: !!String(st.lotEditWho || '').trim(),
    onLotEditWho: (ev) => app.setLotEditWho(ev.target.value),
    lotEditOkBg: String(st.lotEditWho || '').trim() && !st.lotEditBusy ? '#2f7d5d' : '#e9ebe8',
    lotEditOkFg: String(st.lotEditWho || '').trim() && !st.lotEditBusy ? '#fff' : '#b8bdb9',
    lotEditOkLabel: st.lotEditBusy ? 'กำลังบันทึก' : 'ยืนยันการแก้ไข',
    lotEditSummary: summary,
    lotEditRowChangeLabel: rowChanges ? 'จำนวนหรือสถานะของยา ' + rowChanges + ' รายการ' : '',
    lotEditHasRowChange: rowChanges > 0,
    askSaveLotEdit: app.askSaveLotEdit,
    cancelSaveLotEdit: app.cancelSaveLotEdit,
    saveLotEdit: app.saveLotEdit,

    // ประวัติการแก้ไข
    lotEditLogOpen: !!st.lotEditLogOpen,
    toggleLotEditLog: app.toggleLotEditLog,
    lotEditLogCount: (st.lotEditLog || []).length,
    lotEditLogLabel: (st.lotEditLog || []).length
      ? 'ประวัติการแก้ไข ' + (st.lotEditLog || []).length + ' ครั้ง'
      : 'ยังไม่เคยมีการแก้ไขล็อตนี้',
    lotEditLog: (st.lotEditLog || []).map((x) => ({
      key: x.id,
      what: FIELD_TH[x.field] || x.field,
      drug: x.drugName || '',
      from: fieldText(x.field, x.oldValue),
      to: fieldText(x.field, x.newValue),
      by: x.by || 'ไม่ระบุ',
      at: logTime(x.at)
    }))
  };
}

// ชื่อไทยของช่องที่ถูกแก้ — ใช้ทั้งในประวัติและหน้าต่างยืนยัน
const FIELD_TH = {
  recorded_by: 'ผู้บันทึก',
  source: 'แหล่งที่มา',
  pcu_site: 'รพ.สต. ต้นทาง',
  return_date: 'วันที่รับคืน',
  hn: 'HN',
  qty: 'จำนวน',
  disposition: 'สถานะ'
};

const srcLabel = (key) => (SOURCES.find((s) => s.key === key) || {}).label || key || 'ไม่ระบุ';

// แปลงค่าดิบในประวัติให้อ่านออก — เก็บเป็นข้อความดิบในฐานเพื่อให้รองรับทุกช่อง
function fieldText(field, raw) {
  const v = String(raw == null ? '' : raw);
  if (!v) return 'ว่าง';
  if (field === 'source') return srcLabel(v);
  if (field === 'return_date') return thaiDate(v);
  if (field === 'disposition') return v === 'reuse' ? 'ใช้ต่อได้' : 'ทำลาย';
  return v;
}

// เวลาที่แก้ — วันที่ไทยพร้อมเวลา (ประวัติต้องตอบได้ว่าแก้เมื่อไร ไม่ใช่แค่วันไหน)
function logTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return thaiDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')) + ' ' + hh + ':' + mm;
}
