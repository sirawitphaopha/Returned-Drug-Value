// ค่าของหน้าสรุป — คัดจากมอคอัป (บรรทัด 1092–1115 กับ 1374–1412) ตัวต่อตัว
// ต่างจากมอคอัปแค่ "ที่มาของตัวเลข": มอคอัปนับจากรายการในเครื่อง ของจริงรับก้อนสรุปจาก /api/summary
// ส่วนที่คิดในเบราว์เซอร์เหมือนเดิมทุกอย่าง — ความสูงแท่ง สีไล่ระดับ เปอร์เซ็นต์ ข้อความ
import { TH_MONTHS, SOURCES, money, compact, fyOf } from '@/lib/format';
// ชื่อยาต้องหน้าตาเหมือนกันทุกหน้า — ใช้ตัวแยกชิ้นส่วนตัวเดียวกับหน้าบันทึกและหน้าประวัติ
import { nameParts } from './record';
import { pillColorOf } from '@/lib/drugPillColors';

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

  // ตอนเปิดเว็บ today ยังว่างจนกว่า /api/bootstrap จะตอบ — ถ้าไม่กันไว้ Number('') = 0
  // จะได้ "ปีงบ 543" กับชื่อเดือนว่างโผล่แวบหนึ่ง
  const hasToday = !!st.today;
  // 🚨 ปีงบที่กำลังดูอยู่ ไม่ใช่ปีงบปัจจุบันเสมอไป (ผลตรวจข้อ ส-4)
  //
  //    เดิมสร้างคีย์เดือนจากวันนี้เสมอ พอเลือกดูปีงบย้อนหลัง คีย์ที่สร้าง (2025-10…2026-09)
  //    ไม่ตรงกับข้อมูลที่ฐานส่งมา (2024-10…2025-09) สักคีย์เดียว
  //    → กราฟขึ้น "—" ทั้ง 12 แท่ง ทั้งที่ปีนั้นมีข้อมูลอยู่จริง
  //    ผู้บริหารเห็นแล้วนึกว่าปีนั้นห้องยาไม่ได้รับยาคืนเลย
  //
  //    เซิร์ฟเวอร์ส่ง fyYear (พ.ศ.) มาให้อยู่แล้ว หยิบมาใช้แทน
  //    ปีงบ 2569 เริ่ม ต.ค. 2568 → ปี ค.ศ. ที่เริ่ม = 2569 - 543 - 1 = 2025
  const fyViewing = Number((st.sum && st.sum.fyYear) || st.sumFy || 0);
  const fyStartYear = fyViewing
    ? fyViewing - 543 - 1
    : hasToday
      ? (Number(st.today.slice(5, 7)) >= 10 ? Number(st.today.slice(0, 4)) : Number(st.today.slice(0, 4)) - 1)
      : 1900;
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
    // ป้ายเดือนที่ยังไม่มีข้อมูล (ขีด —) เดิมใช้ #c0c5c1 ซึ่งจางเกินเกณฑ์อ่านได้
    // (คอนทราสต์ 1.8:1 จากเกณฑ์ 4.5:1) มองไม่เห็นเลยบนโปรเจกเตอร์ห้องประชุมที่สีซีดกว่าจอคอม
    // เปลี่ยนเป็นสีเดียวกับตัวเลขปกติ (4.8:1) — ขีดกับตัวเลขต่างกันชัดอยู่แล้ว ไม่ต้องพึ่งความจาง
    labelColor: m.v === 0 ? (dark ? 'rgba(255,255,255,.55)' : '#6b746e') : m.v === maxM ? (dark ? '#7fd6ab' : '#2f7d5d') : (dark ? 'rgba(255,255,255,.5)' : '#6b746e'),
    nameColor: dark ? 'rgba(255,255,255,.5)' : '#6b746e'
  }));

  // ฐานข้อมูลเรียงและตัด 10 อันดับมาให้แล้ว ที่นี่แค่แปลงเป็นความกว้างแท่งกับสี
  const topArr = (sum.topDrugs || []).map((t) => ({ name: t.name, v: Number(t.v || 0), id: t.id == null ? null : Number(t.id) }));
  // แผนที่รหัสยา → ข้อมูลดิบในคลัง ใช้วาดชื่อพร้อมสี (ฐานส่งชื่อมาเป็นข้อความก้อนเดียว)
  const drugById = new Map((st.drugs || []).map((d) => [d.id, d]));
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
    // ใช้ app.setTheme ตัวเดียวกับหน้าตั้งค่า — เดิมมี app.setLight/setDark ซ้ำอีกชุด
    // แล้วโดน settingsVals ทับทิ้ง กลายเป็นโค้ดตายที่แก้แล้วไม่มีอะไรเปลี่ยน
    setLight: () => app.setTheme(false),
    setDark: () => app.setTheme(true),

    exportCsv: app.exportCsv,
    // มอคอัปเขียน "Export Excel" แต่ไฟล์ที่ได้เป็น .csv → ผู้ใช้คาดว่าจะได้ .xlsx แล้วงง
    // เปลี่ยนป้ายให้ตรงกับของจริง (ไฟล์ CSV เปิดใน Excel ได้ปกติ มี BOM ภาษาไทยไม่เพี้ยน)
    exportLabel: st.exporting ? 'กำลังสร้างไฟล์' : 'ส่งออกไฟล์ CSV',

    // st.sumLoading เดิมถูกตั้งค่าไว้แต่ไม่มีใครเอาไปใช้เลย → หน้าสรุปเลยโชว์ 0.00
    // กราฟ 12 แท่งว่าง แยกไม่ออกว่า "ยังไม่มีข้อมูล" หรือ "เน็ตช้ายังโหลดไม่เสร็จ"
    sumLoading: !!st.sumLoading && !st.sum,
    sumEmpty: !st.sumLoading && !!st.sum && Number(sum.records || 0) === 0,
    sumEmptyLabel: 'ยังไม่มีรายการในปีงบนี้ — บันทึกรายการแรกที่หน้าบันทึก',
    sumLoadingLabel: 'กำลังโหลดยอดสรุป',
    // แถบเตือนเมื่อมีแถวที่บันทึกไปแล้วแต่มูลค่ายังเป็น 0
    zeroPriced: Number(sum.zeroPriced || 0),
    zeroPricedLabel: 'มี ' + Number(sum.zeroPriced || 0).toLocaleString('en-US') + ' รายการที่มูลค่ายังเป็น 0 — ใส่ราคายาแล้วกดตีราคาย้อนหลังได้ที่หน้าจัดการราคา',

    // เลือกปีงบย้อนหลัง — เดิมดูได้แค่ปีปัจจุบัน พอขึ้นปีใหม่ตัวเลขปีเก่าหายหมด
    fyPicks: (st.sumFyYears.length ? st.sumFyYears : [fyOf(st.today || '2026-01-01')]).map((y) => ({
      key: y,
      label: String(y),
      on: (st.sumFy || (st.sum ? st.sum.fyYear : 0) || fyOf(st.today || '2026-01-01')) === y,
      pick: () => app.setSumFy(y)
    })),

    // ยาที่ถูกคืนบ่อยที่สุด — เรียงตามจำนวนครั้ง ไม่ใช่มูลค่า
    // ยาตัวไหนถูกคืนบ่อยมาก = อาจสั่งเกินจำเป็น เอาไปคุยกับแพทย์ลดการสั่งได้จริง
    topReturned: st.topReturned.slice(0, 10).map((t, i) => {
      const master = t.id != null ? drugById.get(Number(t.id)) : null;
      const pill = master ? pillColorOf(master) : null;
      const np = nameParts(master || { name: t.name }, pill ? pill.color : '');
      return {
      key: t.name,
      rank: i + 1,
      name: t.name,
      // ชิ้นส่วนชื่อยาสำหรับวาดพร้อมสี — ตัวเดียวกับทุกหน้าในเว็บ
      parts: {
        ...np,
        mkBefore: np.base, mkHit: '', mkAfter: '',
        abBefore: np.abbrev, abHit: '', abAfter: '',
        bdBefore: np.brand, bdHit: '', bdAfter: '',
        pillLabel: pill ? pill.label : '',
        pillColor: pill ? pill.color : '',
        strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
      },
      timesLabel: Number(t.times || 0).toLocaleString('en-US') + ' ครั้ง',
      qtyLabel: Number(t.qty || 0).toLocaleString('en-US') + ' ' + (t.unit || 'หน่วย'),
      valueLabel: money(Number(t.value || 0)),
      w: st.topReturned.length ? (Number(t.times || 0) / Number(st.topReturned[0].times || 1) * 100) + '%' : '0%'
      };
    }),
    hasTopReturned: st.topReturned.length > 0,
    topReturnedHint: 'ยาที่ถูกคืนบ่อย อาจเป็นยาที่สั่งเกินจำเป็น — เอาไปคุยกับแพทย์เพื่อลดการสั่งได้',

    // 🚨 ป้ายปีต้องเป็นปีที่กำลังดูอยู่ (ผลตรวจข้อ ส-4)
    //    เดิมเขียน "ปีงบประมาณ 2569" ทับตัวเลขของ 2568 ที่กำลังเปิดดู
    fyLabel: fyViewing ? String(fyViewing) : (hasToday ? String(fyOf(st.today)) : '—'),
    // 🚨 ต้องปัดเศษก่อนแล้วค่อยแยกส่วน (ผลตรวจข้อ ต-5)
    //    ของเดิมใช้ Math.floor กับ toFixed คู่กัน ซึ่งปัดคนละทาง
    //    1234.995 → floor ได้ 1234 แต่ toFixed(2) ได้ "1235.00" → โชว์ 1,234.00 ผิดไป 1 บาท
    fySavedBig: (function () {
      const fixed = fySaved.toFixed(2);
      const dot = fixed.indexOf('.');
      return Number(fixed.slice(0, dot)).toLocaleString('en-US') + '.' + fixed.slice(dot + 1);
    })(),
    fyLostLabel: money(fyLost),
    fyLostShort: Math.round(fyLost).toLocaleString('en-US') + ' ฿',
    fyGrossLabel: money(fyGross),
    fySavedPct: fyGross ? (fySaved / fyGross * 100) + '%' : '0%',
    fyLostPct: fyGross ? (fyLost / fyGross * 100) + '%' : '0%',
    fyReusePct: (fyGross ? (fySaved / fyGross * 100).toFixed(1) : '0') + '%',
    fyCount: sum.records.toLocaleString('en-US'),
    fyDrugCount: String(sum.drugCount),
    fyRangeLabel: hasToday
      ? 'ต.ค. ' + (fyStartYear + 543) + ' – ' + TH_MONTHS[Number(st.today.slice(5, 7)) - 1] + ' ' + (Number(st.today.slice(0, 4)) + 543)
      : '—',

    months: monthVals,
    topDrugs: topArr.map((t, i) => {
      const master = t.id != null ? drugById.get(t.id) : null;
      const pill = master ? pillColorOf(master) : null;
      // สีเม็ดยาเป็นสีของตัวเลขความแรงด้วย เหมือนหน้าค้นหาและหน้าประวัติ
      const np = nameParts(master || { name: t.name }, pill ? pill.color : '');
      return {
      key: t.name,
      rank: String(i + 1),
      name: t.name,
      // ชิ้นส่วนชื่อยาสำหรับวาดพร้อมสี (components/pages/drugname.jsx)
      parts: {
        ...np,
        mkBefore: np.base, mkHit: '', mkAfter: '',
        abBefore: np.abbrev, abHit: '', abAfter: '',
        bdBefore: np.brand, bdHit: '', bdAfter: '',
        pillLabel: pill ? pill.label : '',
        pillColor: pill ? pill.color : '',
        strengthNoWrap: true, formNoWrap: true, brandNoWrap: true, abbrevNoWrap: true
      },
      value: Math.round(t.v).toLocaleString('en-US'),
      w: (t.v / topMax * 100) + '%',
      bg: greens[i]
      };
    }),
    // 🚨 สัดส่วนแหล่งที่มานับ "ทั้งใช้ต่อได้และทำลาย" ตามมอคอัป (บรรทัด 1087)
    // แต่ตัวเลขใหญ่ด้านบนนับเฉพาะที่ใช้ต่อได้ → เอา % ไปคูณตัวเลขใหญ่ไม่ได้
    // ถ้าไม่มีป้ายบอก ผู้บริหารจะเข้าใจผิดแน่นอน
    srcBaseLabel: 'คิดจากมูลค่ายาที่คืนมาทั้งหมด (ใช้ต่อได้ + ทำลาย)',
    // ── สัดส่วนตามแหล่งที่มา ──────────────────────────────────────────────────
    // dash/dashOffset = ค่าที่วงกลมโดนัทใน SVG ต้องใช้ (พี่กันเลือกแบบ ค)
    // เคล็ดลับ: ตั้งรัศมี 15.9 จะได้เส้นรอบวง ~100 พอดี เลยใส่เปอร์เซ็นต์ลงไปตรง ๆ ได้เลย
    // ไม่ต้องคูณหารอะไร · offset เริ่มที่ 25 เพื่อให้ชิ้นแรกเริ่มที่ตำแหน่ง 12 นาฬิกา
    srcShares: (() => {
      let acc = 0;
      return SOURCES.map((sc, i) => {
        const pct = (Number(bySrc[sc.key] || 0) / srcTotal) * 100;
        const row = {
          key: sc.key,
          w: pct + '%',
          pct: pct,
          dash: pct + ' ' + (100 - pct),
          dashOffset: 25 - acc,
          bg: greens[i * 2 < greens.length ? i * 2 : greens.length - 1],
          label: sc.label + ' ' + Math.round(pct) + '%'
        };
        acc += pct;
        return row;
      });
    })(),
    // ยังไม่มีข้อมูลเลย → วาดโดนัทเป็นวงเทาว่าง ๆ แทนวงที่บิดเบี้ยว
    srcEmpty: !srcTotal
  };
}
