// ค่าที่หน้านำเข้าราคาจาก HIS ใช้วาดจอ — คำนวณอย่างเดียว ไม่ยิง API ไม่ setState
import { rowPrice } from '@/lib/hisMatch';
import { money } from '@/lib/format';

const LEVELS = [
  { key: 'sure', label: 'มั่นใจ' },
  { key: 'pick', label: 'ต้องเลือก' },
  { key: 'none', label: 'ไม่เจอ' }
];

export function himportVals(app) {
  const st = app.state;
  const rows = st.hisRows || [];

  const count = { sure: 0, pick: 0, none: 0 };
  let checked = 0;
  for (const r of rows) {
    count[r.level] = (count[r.level] || 0) + 1;
    if (r.checked && rowPrice(r) != null) checked += 1;
  }

  const tab = st.hisTab || 'sure';
  const shown = rows.filter((r) => r.level === tab);

  return {
    hisOpen: !!st.hisOpen,
    openHisImport: app.openHisImport,
    closeHisImport: app.closeHisImport,
    onHisFile: app.onHisFile,
    hisReading: !!st.hisReading,
    hisError: st.hisError || '',
    hisFileName: st.hisFileName || '',
    hisHasFile: rows.length > 0,
    hisSaving: !!st.hisSaving,

    // ปุ่มบันทึกปิดตายตอนกำลังบันทึก หรือยังไม่ได้เลือกอะไรเลย
    hisCanSave: checked > 0 && !st.hisSaving,
    hisSaveLabel: st.hisSaving ? 'กำลังบันทึก' : 'บันทึกราคา ' + checked + ' รายการ',
    saveHisImport: app.saveHisImport,
    hisCheckedCount: checked,

    hisSummary: 'อ่านได้ ' + (st.hisTotal || 0) + ' รายการ · จับคู่กับยาในเว็บ ' + rows.length + ' ตัว',

    hisBackfill: !!st.hisBackfill,
    toggleHisBackfill: app.toggleHisBackfill,

    hisTabs: LEVELS.map((L) => ({
      key: L.key,
      label: L.label + ' ' + (count[L.key] || 0),
      on: tab === L.key,
      pick: app.setHisTab(L.key),
      bg: tab === L.key ? '#2f7d5d' : '#f0f1ee',
      fg: tab === L.key ? '#fff' : '#414a44'
    })),

    hisTab: tab,
    checkHisTabOn: app.checkHisTab(true),
    checkHisTabOff: app.checkHisTab(false),
    hisBulkLabel: tab === 'none' ? 'ติ๊กทั้งหมดที่พิมพ์ราคาแล้ว' : 'ติ๊กทั้งกลุ่มนี้',

    hisEmptyLabel:
      tab === 'sure' ? 'ไม่มีรายการที่จับคู่ได้ชัดเจน'
        : tab === 'pick' ? 'ไม่มีรายการที่ต้องเลือก'
          : 'ทุกตัวจับคู่ได้หมด ไม่มีรายการตกค้าง',

    hisShown: shown.map((r) => {
      const p = rowPrice(r);
      const cur = r.candidates[r.pickedIndex] || null;
      const changed = p != null && r.oldPrice > 0 && Math.abs(p - r.oldPrice) > 0.00005;
      return {
        key: r.drugId,
        webName: r.webName,
        hisName: cur ? cur.name : 'ไม่เจอในไฟล์ — พิมพ์ราคาเองได้',
        hisUnit: cur ? cur.unit : '',
        unit: r.unit,
        oldLabel: r.oldPrice > 0 ? money(r.oldPrice) : '—',
        newLabel: p != null ? money(p) : '—',
        // ราคาเดิมไม่เท่าราคาใหม่ ต้องเห็นชัดว่าของเดิมกำลังจะถูกทับ
        newColor: p == null ? '#6f7873' : changed ? '#c2543c' : '#2f7d5d',
        changed: changed,
        checked: r.checked,
        canCheck: p != null,
        toggle: app.toggleHisRow(r.drugId),
        manualPrice: r.manualPrice,
        onManual: app.setHisManualPrice(r.drugId),
        showManual: r.level === 'none',
        // ตัวเลือกอื่นในไฟล์ ให้กดสลับได้ · โชว์สูงสุด 6 ตัว พอให้ตัดสินใจ
        alts: r.level === 'pick'
          ? r.candidates.slice(0, 6).map((c, i) => ({
            key: r.drugId + '-' + i,
            label: c.name,
            // money() ใส่ ฿ มาให้แล้ว อย่าเติมซ้ำ ไม่งั้นได้ "40.00 ฿ ฿/vial"
            priceLabel: money(c.price) + '/' + (c.unit || '-'),
            on: i === r.pickedIndex,
            pick: app.pickHisCandidate(r.drugId, i)
          }))
          : []
      };
    })
  };
}
