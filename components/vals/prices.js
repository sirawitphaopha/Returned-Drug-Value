// ค่าของหน้าตั้งราคายา — ไม่มีในมอคอัป ใช้ภาษาภาพชุดเดียวกับหน้าบันทึก
import { priceDirty } from '../handlers/prices';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  // แคลร์จับคู่ราคาจาก HIS มาให้แล้ว แต่ที่ไม่ชัวร์ต้องให้เภสัชกรกดเลือกเอง
  // แท็บนี้คือรายการงานที่พี่กันต้องไล่เคลียร์ ตั้งไว้เป็นตัวที่สองเพราะเป็นงานหลัก
  { key: 'check', label: 'รอกดเลือก' },
  { key: 'todo', label: 'ยังไม่ใส่ราคา' },
  { key: 'done', label: 'ใส่ราคาแล้ว' }
];

export function pricesVals(app, d) {
  const st = d.st;
  const q = st.priceQuery.trim().toLowerCase();
  const edits = st.priceEdits;

  const matched = st.priceItems.filter((it) => {
    if (q.length && it.name.toLowerCase().indexOf(q) < 0) return false;
    if (st.priceFilter === 'check') return !!it.needsCheck;
    if (st.priceFilter === 'todo') return !it.hasPrice;
    if (st.priceFilter === 'done') return it.hasPrice;
    return true;
  });

  const needCheck = st.priceItems.filter((it) => it.needsCheck).length;

  const dirty = st.priceItems.filter((it) => priceDirty(it, edits));
  const priced = st.priceItems.filter((it) => it.hasPrice).length;
  const total = st.priceItems.length;
  const shown = matched.slice(0, st.priceShown);

  return {
    isPrices: st.screen === 'prices',
    pricesWidth: d.wide ? '820px' : '520px',
    closePrices: app.closePrices,

    priceProgress: total ? priced.toLocaleString('en-US') + ' / ' + total.toLocaleString('en-US') : '—',
    priceProgressW: total ? (priced / total) * 100 + '%' : '0%',

    priceQuery: st.priceQuery,
    onPriceQuery: app.onPriceQuery,
    priceFilters: FILTERS.map((f) => ({
      key: f.key,
      // แท็บ "รอกดเลือก" ติดตัวเลขงานค้างไว้ จะได้รู้ว่าเหลืออีกกี่ตัว
      label: f.key === 'check' && needCheck ? f.label + ' ' + needCheck : f.label,
      bg: st.priceFilter === f.key ? '#2f7d5d' : (f.key === 'check' && needCheck ? '#fdf1ed' : '#f0f1ee'),
      fg: st.priceFilter === f.key ? '#fff' : (f.key === 'check' && needCheck ? '#c2543c' : '#414a44'),
      pick: () => app.setPriceFilter(f.key)
    })),

    priceLoading: st.priceLoading && !total,
    priceEmpty: !st.priceLoading && !matched.length,
    priceCountLabel: matched.length.toLocaleString('en-US') + ' รายการ',

    priceRows: shown.map((it) => {
      const e = edits[String(it.id)] || {};
      const isDirty = priceDirty(it, edits);
      const warn = !it.hasPrice && !isDirty;
      return {
        id: it.id,
        name: it.name,
        // ชื่อการค้า — วงเล็บสีเทลต่อท้ายชื่อยา เฉพาะตัวที่มี (แบบเดียวกับผลค้นหาในหน้าบันทึก)
        brand: (it.brand || '').trim(),
        hasBrand: !!(it.brand || '').trim(),
        // form เป็นภาษาอังกฤษตามที่ HIS ส่งมา เก็บไว้ให้เภสัชกรดูออกว่าเป็นยารูปแบบไหน
        sub: it.form || 'ไม่ระบุรูปแบบ',
        subColor: warn ? '#c2543c' : '#6b746e',
        warnLabel: warn ? ' · ยังไม่ใส่ราคา' : '',
        border: isDirty ? '#2f7d5d' : 'rgba(30,36,32,.08)',
        priceValue: e.price === undefined ? (it.price ? String(it.price) : '') : e.price,
        onPrice: (ev) => app.editPrice(it.id, ev.target.value),
        // ปล่อยว่าง = ใช้หน่วยเริ่มต้นของกลุ่ม placeholder โชว์ให้เห็นว่าจะได้หน่วยอะไร
        unitValue: e.unitTh === undefined ? it.unitTh : e.unitTh,
        unitPlaceholder: it.defaultUnit,
        onUnit: (ev) => app.editUnit(it.id, ev.target.value),

        // ── ที่มาของราคา + ตัวเลือกที่ระบบเสนอ ────────────────────────────
        // แคลร์จับคู่จากไฟล์ HIS มาให้ล่วงหน้า พี่กันแค่กดเลือกตัวที่ถูก
        note: it.note || '',
        needsCheck: !!it.needsCheck,
        suggests: (it.suggestions || []).map((sg, i) => ({
          key: it.id + '-' + i,
          name: sg.name,
          priceLabel: Number(sg.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ฿/' + (sg.unit || '-'),
          // กดแล้วเติมราคาลงช่องเลย ยังไม่บันทึกจนกว่าจะกดปุ่มบันทึกด้านล่าง
          pick: () => app.editPrice(it.id, String(sg.price)),
          on: String(e.price === undefined ? (it.price || '') : e.price) === String(sg.price)
        }))
      };
    }),

    priceHasMore: matched.length > shown.length,
    priceMoreLabel: 'ดูเพิ่มอีก ' + Math.min(40, matched.length - shown.length).toLocaleString('en-US') + ' รายการ',
    morePrices: app.morePrices,

    priceDirtyCount: dirty.length,
    priceBarOpen: dirty.length > 0,
    priceSaveLabel: st.priceSaving ? 'กำลังบันทึก' : 'บันทึกราคา ' + dirty.length + ' รายการ',
    priceSaveBg: st.priceSaving ? '#9aa19c' : '#2f7d5d',
    savePrices: app.savePrices,
    resetPriceEdits: app.resetPriceEdits
  };
}
