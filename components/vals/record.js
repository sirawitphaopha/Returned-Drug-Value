// ค่าของหน้าบันทึก — คัดจาก renderVals ของมอคอัป (บรรทัด 1160–1290)
// ต่างจากต้นฉบับ 3 จุด: ตัดเลขคงคลังปลอม · ตัดสวิตช์จำลองเน็ตหลุด
// · ยอดสะสมปีงบมาจากฐานข้อมูล ไม่ได้นับจากรายการในเครื่อง
import { SOURCES, money, thaiDate } from '@/lib/format';
import { cleanQty, qtyNum } from '../helpers';

const sumReuse = (rows) => rows.reduce((a, x) => a + (x.disposition === 'reuse' ? x.price * x.qty : 0), 0);

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
    onSearchKey: (e) => { if (e.key === 'Enter' && d.results.length) { e.preventDefault(); app.openSheet(d.results[d.hi] || d.results[0]); } },
    onSearchKeyDesktop: (e) => {
      // ลูกศรขึ้น/ลงเลื่อนเลือกในรายการผลค้นหา — เดิมกด Enter ได้ตัวแรกเสมอ
      // ทั้งที่ระบบไฮไลต์แถวแรกไว้ ซึ่งสื่อว่าเลื่อนเลือกได้
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!d.results.length) return;
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        app.setState({ hi: Math.min(d.results.length - 1, Math.max(0, d.hi + step)) });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pending && pendQty > 0) { app.addInline(); return; }
        if (d.results.length) app.pickInline(d.results[d.hi] || d.results[0]);
      }
    },
    hasResults: d.results.length > 0,
    noResults: d.q.length >= 2 && d.results.length === 0,
    noResultsHint: 'ไม่พบยาชื่อนี้ ลองพิมพ์ชื่อสามัญ',
    openOffListDrug: app.openOffListDrug,
    results: d.results.map((drug, i) => ({
      name: drug.name,
      // มอคอัปโชว์ "หน่วย · คงคลัง 1234" ซึ่งเป็นเลขมั่วของเดโม ตัดออกแล้ว
      // ยาที่ยังไม่ใส่ราคาให้ขึ้นป้ายเตือนตรงนี้แทน
      sub: drug.hasPrice ? drug.unit : drug.unit + ' · ยังไม่ใส่ราคา',
      subColor: drug.hasPrice ? '#6b746e' : '#c2543c',
      priceLabel: drug.price.toFixed(2) + ' ฿/' + drug.unit,
      priceColor: drug.hasPrice ? '#2f7d5d' : '#c2543c',
      rowBg: i === d.hi ? '#eef6f1' : '#fff',
      pick: () => app.openSheet(drug),
      pickInline: () => app.pickInline(drug)
    })),

    // ── ยาที่คืนบ่อย ──────────────────────────────────────────────────────────
    frequent: st.favIds
      .map((id) => st.drugs.find((x) => x.id === id))
      .filter(Boolean)
      .slice(0, 6)
      .map((drug) => {
        const m = drug.name.match(/^(.*?)\s(\d[\w./ ]*)$/);
        return {
          base: m ? m[1] : drug.name,
          strength: m ? m[2] : ' ',
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
    rows: st.rows.map((r) => {
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
        remove: () => {
          const rows = st.rows.filter((x) => x.rid !== r.rid);
          app.persist({ rows: rows });
          app.animateTo(sumReuse(rows));
        }
      };
    }),
    noRows: st.rows.length === 0,
    rowCount: st.rows.length,
    rowsLabel: 'รายการในครั้งนี้ ' + st.rows.length,

    // ── ตัวเลขสรุปท้ายจอ ─────────────────────────────────────────────────────
    animSavedLabel: st.animSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    lostLabel: d.lost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    savedBarW: d.gross ? (d.saved / d.gross * 100) + '%' : '0%',
    lostBarW: d.gross ? (d.lost / d.gross * 100) + '%' : '0%',
    proportionLabel: d.gross
      ? 'ใช้ต่อได้ ' + Math.round(d.saved / d.gross * 100) + '% ของมูลค่าที่คืนมา ' + money(d.gross)
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
