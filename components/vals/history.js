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
    { key: 'fy', label: 'ปีงบ ' + (st.today ? fyOf(st.today) : '') }
  ];

  const rows = st.histRows;

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
      detail: r.qty + ' ' + r.unit + ' × ' + price.toFixed(2) + ' · ' + srcLabel(r.source) + (r.hn ? ' · HN ' + r.hn : ''),
      valueLabel: money(price * r.qty),
      color: reuse ? '#2f7d5d' : '#c2543c',
      dispLabel: reuse ? 'ใช้ต่อได้' : 'ทำลาย',
      dispColor: reuse ? '#9aa19c' : '#c2543c',
      border: reuse ? 'rgba(30,36,32,.08)' : 'rgba(194,84,60,.22)',
      edit: () => app.editRecord(r),
      remove: () => app.askDeleteRecord(r)
    };
  };

  return {
    histQuery: st.histQuery,
    onHistQuery: app.onHistQuery,
    ranges: rangeDefs.map((r) => ({
      key: r.key,
      label: r.label,
      bg: st.histRange === r.key ? '#1e2420' : '#f0f1ee',
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
        edit: () => app.editRecord(r),
        remove: () => app.askDeleteRecord(r)
      };
    }),

    // ตอนกำลังโหลดรอบแรกยังไม่มีแถว อย่าเพิ่งขึ้นว่าไม่พบรายการ
    histLoading: st.histLoading && !rows.length,
    histEmpty: !st.histLoading && !rows.length,
    histCountLabel: st.histTotal.toLocaleString('en-US') + ' รายการ',
    histTotalLabel: money(st.histSaved),
    histTruncated: st.histTotal > HIST_LIMIT,
    histTruncLabel: 'แสดง ' + HIST_LIMIT + ' จาก ' + st.histTotal.toLocaleString('en-US') + ' รายการ — กรองช่วงวันที่ให้แคบลง',

    confirmOpen: !!st.confirm,
    confirmTitle: st.confirm ? st.confirm.title : '',
    confirmDetail: st.confirm ? st.confirm.detail : '',
    confirmNote: st.confirm ? st.confirm.note : '',
    confirmOkLabel: st.confirm ? st.confirm.okLabel : '',
    confirmRun: () => { if (app.state.confirm) app.state.confirm.run(); },
    closeConfirm: app.closeConfirm
  };
}
