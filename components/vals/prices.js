// ค่าของหน้าตั้งราคายา — ไม่มีในมอคอัป ใช้ภาษาภาพชุดเดียวกับหน้าบันทึก
import { priceDirty } from '../handlers/prices';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'todo', label: 'ยังไม่ใส่ราคา' },
  { key: 'done', label: 'ใส่ราคาแล้ว' }
];

export function pricesVals(app, d) {
  const st = d.st;
  const q = st.priceQuery.trim().toLowerCase();
  const edits = st.priceEdits;

  const matched = st.priceItems.filter((it) => {
    if (q.length && it.name.toLowerCase().indexOf(q) < 0) return false;
    if (st.priceFilter === 'todo') return !it.hasPrice;
    if (st.priceFilter === 'done') return it.hasPrice;
    return true;
  });

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
      label: f.label,
      bg: st.priceFilter === f.key ? '#1e2420' : '#f0f1ee',
      fg: st.priceFilter === f.key ? '#fff' : '#414a44',
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
        onUnit: (ev) => app.editUnit(it.id, ev.target.value)
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
