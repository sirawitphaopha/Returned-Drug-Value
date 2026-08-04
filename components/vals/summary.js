// ค่าของหน้าสรุป — คัดจากมอคอัป (บรรทัด 1092–1115 กับ 1374–1412) ตัวต่อตัว
// ต่างจากมอคอัปแค่ "ที่มาของตัวเลข": มอคอัปนับจากรายการในเครื่อง ของจริงรับก้อนสรุปจาก /api/summary
// ส่วนที่คิดในเบราว์เซอร์เหมือนเดิมทุกอย่าง — ความสูงแท่ง สีไล่ระดับ เปอร์เซ็นต์ ข้อความ
import { TH_MONTHS, SOURCES, money, compact, fyOf } from '@/lib/format';

const EMPTY = { saved: 0, lost: 0, records: 0, qty: 0, drugCount: 0, byMonth: {}, bySrc: {}, topDrugs: [] };

export function summaryVals(app, d) {
  const st = d.st;
  const dark = d.dark;
  const sum = st.sum || EMPTY;

  const fySaved = sum.saved;
  const fyLost = sum.lost;
  const fyGross = fySaved + fyLost;
  const byMonth = sum.byMonth || {};
  const bySrc = sum.bySrc || {};

  const fyStartYear = Number(st.today.slice(5, 7)) >= 10 ? Number(st.today.slice(0, 4)) : Number(st.today.slice(0, 4)) - 1;
  const months = [];
  let maxM = 1;
  for (let i = 0; i < 12; i++) {
    const dt = new Date(fyStartYear, 9 + i, 1);
    const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
    const v = Number(byMonth[key] || 0);
    if (v > maxM) maxM = v;
    months.push({ key: key, name: TH_MONTHS[dt.getMonth()], v: v, isNow: key === st.today.slice(0, 7) });
  }
  const monthVals = months.map((m) => ({
    key: m.key,
    name: m.name,
    nameShort: m.name.replace(/\.$/, ''),
    short: m.v ? compact(m.v) : '—',
    h: (m.v ? Math.max(4, (m.v / maxM) * 100) : 1.5) + '%',
    bg: m.v === 0 ? (dark ? 'rgba(255,255,255,.1)' : '#e6e9e5') : m.isNow ? (dark ? 'repeating-linear-gradient(135deg,#2f7d5d 0 6px,#25654b 6px 12px)' : 'repeating-linear-gradient(135deg,#a8d3bd 0 6px,#cbe4d6 6px 12px)') : (m.v === maxM ? (dark ? 'linear-gradient(180deg,#9ce8c2,#4fae82)' : '#2f7d5d') : (dark ? '#2f7d5d' : '#a8d3bd')),
    labelColor: m.v === 0 ? (dark ? 'rgba(255,255,255,.3)' : '#c0c5c1') : m.v === maxM ? (dark ? '#7fd6ab' : '#2f7d5d') : (dark ? 'rgba(255,255,255,.5)' : '#6b746e'),
    nameColor: dark ? 'rgba(255,255,255,.5)' : '#6b746e'
  }));

  // ฐานข้อมูลเรียงและตัด 10 อันดับมาให้แล้ว ที่นี่แค่แปลงเป็นความกว้างแท่งกับสี
  const topArr = (sum.topDrugs || []).map((t) => ({ name: t.name, v: Number(t.v || 0) }));
  const topMax = topArr.length ? topArr[0].v : 1;
  const greens = dark
    ? ['#7fd6ab', '#5fc394', '#4fae82', '#419a72', '#3a8c67', '#34805d', '#2f7d5d', '#2b7255', '#28684e', '#245e47']
    : ['#2f7d5d', '#3f8f6c', '#4d9a76', '#5ba583', '#6aaf8f', '#7ab79a', '#8bc0a6', '#9ac9b1', '#a8d3bd', '#b9dcc9'];
  const srcTotal = Object.keys(bySrc).reduce((a, k) => a + Number(bySrc[k] || 0), 0) || 1;

  return {
    sumBg: dark ? '#151a17' : '#f6f7f4',
    sumFg: dark ? '#ffffff' : '#1e2420',
    sumMuted: dark ? 'rgba(255,255,255,.6)' : '#6b746e',
    sumPanel: dark ? 'rgba(255,255,255,.05)' : '#ffffff',
    sumBorder: dark ? 'rgba(255,255,255,.12)' : 'rgba(30,36,32,.1)',
    sumTrack: dark ? 'rgba(255,255,255,.1)' : '#eef1ee',
    sumGreen: dark ? '#7fd6ab' : '#2f7d5d',
    sumRed: dark ? '#f0a68f' : '#c2543c',
    sumMarkFg: '#ffffff',
    sumLostPanel: dark ? 'rgba(194,84,60,.14)' : '#fdf1ed',

    togTrack: dark ? 'rgba(255,255,255,.09)' : '#e6e9e5',
    togLightBg: dark ? 'transparent' : '#fff',
    togLightFg: dark ? 'rgba(255,255,255,.6)' : '#1e2420',
    togDarkBg: dark ? '#2b332d' : 'transparent',
    togDarkFg: dark ? '#fff' : '#6b746e',
    setLight: app.setLight,
    setDark: app.setDark,

    exportCsv: app.exportCsv,
    exportLabel: st.exporting ? 'กำลังสร้างไฟล์' : 'Export Excel',

    fyLabel: String(fyOf(st.today)),
    fySavedBig: Math.floor(fySaved).toLocaleString('en-US') + '.' + (fySaved.toFixed(2).split('.')[1] || '00'),
    fyLostLabel: money(fyLost),
    fyLostShort: Math.round(fyLost).toLocaleString('en-US') + ' ฿',
    fyGrossLabel: money(fyGross),
    fySavedPct: fyGross ? (fySaved / fyGross * 100) + '%' : '0%',
    fyLostPct: fyGross ? (fyLost / fyGross * 100) + '%' : '0%',
    fyReusePct: (fyGross ? (fySaved / fyGross * 100).toFixed(1) : '0') + '%',
    fyCount: sum.records.toLocaleString('en-US'),
    fyDrugCount: String(sum.drugCount),
    fyRangeLabel: 'ต.ค. ' + (fyStartYear + 543) + ' – ' + TH_MONTHS[Number(st.today.slice(5, 7)) - 1] + ' ' + (Number(st.today.slice(0, 4)) + 543),

    months: monthVals,
    topDrugs: topArr.map((t, i) => ({
      key: t.name,
      rank: String(i + 1),
      name: t.name,
      value: Math.round(t.v).toLocaleString('en-US'),
      w: (t.v / topMax * 100) + '%',
      bg: greens[i]
    })),
    srcShares: SOURCES.map((sc, i) => ({
      key: sc.key,
      w: (Number(bySrc[sc.key] || 0) / srcTotal * 100) + '%',
      bg: greens[i * 2 < greens.length ? i * 2 : greens.length - 1],
      label: sc.label + ' ' + Math.round(Number(bySrc[sc.key] || 0) / srcTotal * 100) + '%'
    }))
  };
}
