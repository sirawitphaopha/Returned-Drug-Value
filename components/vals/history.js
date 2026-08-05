// ค่าของหน้าประวัติ — คัดจากมอคอัป (บรรทัด 1292–1320 กับ 1368–1372)
// การกรองย้ายไปอยู่ฝั่ง SQL แล้ว ที่เหลือในนี้คือการจัดหน้าตาล้วนๆ เหมือนต้นฉบับ
import { SOURCES, money, thaiDate, fyOf } from '@/lib/format';

const HIST_LIMIT = 60;

const srcLabel = (key) => (SOURCES.find((s) => s.key === key) || {}).label || '';

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
    source: (r) => srcLabel(r.source),
    hn: (r) => r.hn || '',
    by: (r) => r.by || ''
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
  const COLS = [
    { key: 'date', label: 'วันที่', w: '110px', align: 'left' },
    { key: 'name', label: 'ยา', w: '', align: 'left', flex: true },
    { key: 'qty', label: 'จำนวน', w: '80px', align: 'right' },
    { key: 'price', label: 'ราคา/หน่วย', w: '92px', align: 'right' },
    { key: 'value', label: 'มูลค่า (฿)', w: '104px', align: 'right' },
    { key: 'disposition', label: 'สถานะ', w: '90px', align: 'center' },
    { key: 'source', label: 'แหล่งที่มา', w: '88px', align: 'left' },
    { key: 'hn', label: 'HN', w: '84px', align: 'left' },
    { key: 'by', label: 'ผู้บันทึก', w: '104px', align: 'left' }
  ];

  // จัดกลุ่มรายวันสำหรับมือถือ — แถวมาจากเซิร์ฟเวอร์เรียงวันใหม่→เก่าอยู่แล้ว
  const dayMap = {};
  const dayOrder = [];
  rows.forEach((r) => {
    if (!dayMap[r.date]) { dayMap[r.date] = []; dayOrder.push(r.date); }
    dayMap[r.date].push(r);
  });

  const itemOf = (r) => {
    const reuse = r.disposition === 'reuse';
    const price = Number(r.price);
    return {
      key: r.id,
      name: r.name,
      // บนมือถือคอลัมน์แคบมาก ตัดชื่อแหล่งที่มาออกจากบรรทัดรายละเอียด
      // (ยังดูได้ในหน้าคอม) เหลือแค่ข้อมูลที่จำเป็นจริง ๆ
      detail: r.qty + ' ' + r.unit + ' × ' + price.toFixed(2) + (r.hn ? ' · HN ' + r.hn : '') + (r.lot ? ' · ' + r.lot : ''),
      valueLabel: money(price * r.qty),
      color: reuse ? '#2f7d5d' : '#c2543c',
      dispLabel: reuse ? 'ใช้ต่อได้' : 'ทำลาย',
      dispColor: reuse ? '#9aa19c' : '#c2543c',
      border: reuse ? 'rgba(30,36,32,.08)' : 'rgba(194,84,60,.22)',
      inTrash: !!r.deletedAt,
      edit: () => app.editRecord(r),
      remove: () => app.askDeleteRecord(r),
      restore: () => app.askRestoreRecord(r)
    };
  };

  return {
    histQuery: st.histQuery,
    onHistQuery: app.onHistQuery,

    // ตัววัดความสูงแถบกรอง — หัวตารางเอาไปใช้ตั้งระยะติดบน (ดู .sticky-head ใน globals.css)
    histHeadRef: app.histHeadRef,

    // หัวตารางกดเรียงได้ · ลูกศรบอกทิศ ▲ น้อยไปมาก ▼ มากไปน้อย ↕ ยังไม่ได้เรียง
    histCols: COLS.map((c) => {
      const on = sortKey === c.key;
      return {
        key: c.key,
        label: c.label,
        w: c.w,
        flex: !!c.flex,
        align: c.align,
        arrow: on ? (st.histSortDir === 'asc' ? '▲' : '▼') : '↕',
        arrowColor: on ? '#2f7d5d' : 'rgba(30,36,32,.28)',
        fg: on ? '#2f7d5d' : '#414a44',
        pick: () => app.setHistSort(c.key)
      };
    }),
    ranges: rangeDefs.map((r) => ({
      key: r.key,
      label: r.label,
      bg: st.histRange === r.key ? '#2f7d5d' : '#f0f1ee',
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
      return {
        key: r.id,
        dateLabel: thaiDate(r.date),
        name: r.name,
        qtyLabel: r.qty + ' ' + r.unit,
        priceLabel: price.toFixed(2),
        valueLabel: money(price * r.qty),
        color: reuse ? '#2f7d5d' : '#c2543c',
        bg: reuse ? '#fff' : '#fdf7f5',
        dispLabel: reuse ? 'ใช้ต่อได้' : 'ทำลาย',
        dispBg: reuse ? '#e3f0e8' : '#fbe4dd',
        dispFg: reuse ? '#2f7d5d' : '#c2543c',
        sourceLabel: srcLabel(r.source),
        hnLabel: r.hn || '—',
        byLabel: r.by || '—',
        lotLabel: r.lot || '—',
        inTrash: !!r.deletedAt,
        edit: () => app.editRecord(r),
        remove: () => app.askDeleteRecord(r),
        restore: () => app.askRestoreRecord(r)
      };
    }),

    // ตอนกำลังโหลดรอบแรกยังไม่มีแถว อย่าเพิ่งขึ้นว่าไม่พบรายการ
    histLoading: st.histLoading && !rows.length,
    histEmpty: !st.histLoading && !rows.length,
    histCountLabel: st.histTotal.toLocaleString('en-US') + ' รายการ',
    histTotalLabel: money(st.histSaved),
    histTruncated: st.histTotal > rows.length,
    histTruncLabel: 'แสดง ' + rows.length.toLocaleString('en-US') + ' จาก ' + st.histTotal.toLocaleString('en-US') + ' รายการ',
    loadMoreHistory: app.loadMoreHistory,
    loadMoreLabel: st.histLoading ? 'กำลังโหลด' : 'ดูเพิ่มอีก 60 รายการ',

    // ส่งออกเฉพาะที่กรองอยู่ — ต่างจากปุ่มในหน้าสรุปที่ส่งออกทั้งปีงบ
    exportHistoryCsv: app.exportHistoryCsv,
    histExportLabel: st.exporting ? 'กำลังสร้างไฟล์' : 'ส่งออก CSV',

    // ── ถังขยะ · ดูรายล็อต · ช่วงวันที่เลือกเอง ─────────────────────────────
    histTrash: st.histTrash,
    toggleTrash: app.toggleTrash,
    trashLabel: st.histTrash ? 'กลับไปดูรายการปกติ' : 'ถังขยะ',
    histLot: st.histLot,
    clearLot: () => app.viewLot(''),
    histFrom: st.histFrom,
    histTo: st.histTo,
    onHistFrom: app.onHistFrom,
    onHistTo: app.onHistTo,
    isCustomRange: st.histRange === 'custom',
    histTitle: st.histTrash
      ? 'ถังขยะ — รายการที่ลบไปแล้ว'
      : st.histLot ? 'ล็อต ' + st.histLot : '',
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
    confirmRun: () => { if (app.state.confirm) app.state.confirm.run(); },
    closeConfirm: app.closeConfirm
  };
}
