// ค่าที่หน้าคลังยาใช้วาด — ไม่แตะ DOM ไม่ยิง API
import { splitDrugName, splitPercent, splitRelease } from '../helpers';
import { money, thaiDate } from '@/lib/format';
import { buildDrugNames } from '@/lib/drugName';
// ตัวแปลงแป้นพิมพ์ไทย→อังกฤษ ใช้ตัวเดียวกับช่องค้นหายาหน้าบันทึก จะได้ไม่เพี้ยนกัน
import { thaiToEnglish } from '@/lib/drugSearch';
import { pillColorOf, COLOR_HEX } from '@/lib/drugPillColors';
import { FORM_UNIT, UNIT_FALLBACK } from '@/lib/units';

// คอลัมน์ในตาราง — ต้องครบทุกช่องที่มีจริงในตาราง drugs ของ Supabase
// (`hidden` ไม่อยู่ในนี้ เพราะทำผ่านปุ่มท้ายแถวและมีตัวกรองแยกให้แล้ว)
const COLS = [
  { key: 'id', label: 'ID', w: '54px', sort: true },
  { key: 'abbrev', label: 'ตัวย่อ', w: '78px', sort: true },
  { key: 'generic', label: 'ชื่อยา', w: '', sort: true },
  { key: 'brand', label: 'ชื่อการค้า', w: '124px', sort: true },
  { key: 'strength', label: 'ความแรง', w: '88px', sort: true },
  { key: 'unit', label: 'หน่วย', w: '78px', sort: true },
  { key: 'percent', label: '%', w: '54px', sort: true },
  { key: 'form', label: 'รูปแบบ', w: '86px', sort: true },
  { key: 'release', label: 'ออกฤทธิ์', w: '72px', sort: true },
  { key: 'route', label: 'ทางให้', w: '72px', sort: true },
  { key: 'had', label: 'HAD', w: '58px', sort: true },
  { key: 'preg', label: 'Preg', w: '56px', sort: true },
  { key: 'renal', label: 'Renal', w: '62px', sort: true },
  // ราคาต่อหน่วยของเว็บนี้ (ตาราง mr_drug_price) — ไม่ใช่ของกลางเหมือนคอลัมน์อื่น
  { key: 'price', label: 'ราคา/หน่วย', w: '104px', sort: true }
];

// ตัวกรองรูปแบบยา — เอาเฉพาะที่มีเยอะสุด 5 อันแรกจากคลังจริง
function formChips(list) {
  const n = {};
  for (const d of list) if (d.form) n[d.form] = (n[d.form] || 0) + 1;
  return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, 5);
}

function matchFilters(d, filters) {
  for (const f of filters) {
    if (f === 'had' && !d.had) return false;
    if (f === 'renal' && !d.renal) return false;
    if (f === 'hidden' && !d.hidden) return false;
    if (f === 'pregDX' && !(d.preg === 'D' || d.preg === 'X')) return false;
    if (f.startsWith('form:') && d.form !== f.slice(5)) return false;
  }
  // ยาที่ซ่อนไว้ไม่โผล่ ยกเว้นกดตัวกรอง "ที่ซ่อนอยู่"
  if (!filters.includes('hidden') && d.hidden) return false;
  return true;
}

export function catalogVals(app, d) {
  const st = app.state;
  const list = st.catalog || [];

  // ชื่อเต็มที่เห็นตอนค้นหา — ประกอบด้วยตัวเดียวกับที่ /api/drugs ใช้
  // ต้องส่งยา "ทุกตัว" เข้าไป ไม่งั้นชื่อที่ได้จะไม่ตรงกับของจริง
  // (ตัวแยกชื่อซ้ำต้องเห็นยาครบถึงจะรู้ว่าต้องต่อท้ายด้วยรูปแบบยาไหม)
  const fullNames = buildDrugNames(list);

  // ── ค้นหา — รองรับลืมสลับแป้นพิมพ์ (พี่กันสั่ง 25 ส.ค. 2569) ────────────────
  // ตั้งใจพิมพ์ warfarin แต่แป้นค้างที่ไทย จะได้ ้ฟก๘ยรfeatures ซึ่งไม่เจออะไรเลย
  // ใช้ตัวแปลงตัวเดียวกับช่องค้นหายาหน้าบันทึก (lib/drugSearch.js) จะได้ไม่เพี้ยนกัน
  //
  // 🚨 ต้องบอกผู้ใช้ด้วยว่าระบบค้นด้วยคำว่าอะไร ไม่งั้นงงว่าพิมพ์ไทยแล้วทำไมเจอยาอังกฤษ
  const raw = (st.catSearch || '').trim();
  let q = raw.toLowerCase();
  let swapped = false;
  const hit = (x, k) =>
    (x.generic || '').toLowerCase().includes(k) ||
    (x.brand || '').toLowerCase().includes(k) ||
    (x.abbrev || '').toLowerCase().includes(k);

  let rows = list.filter((x) => matchFilters(x, st.catFilters));
  if (q) {
    let found = rows.filter((x) => hit(x, q));
    // ไม่เจอเลยและมีตัวอักษรไทยปน — ลองแปลงแป้นแล้วค้นใหม่
    if (!found.length && /[฀-๿]/.test(raw)) {
      const alt = thaiToEnglish(raw).trim().toLowerCase();
      if (alt && alt !== q) {
        const found2 = rows.filter((x) => hit(x, alt));
        if (found2.length) { found = found2; q = alt; swapped = true; }
      }
    }
    rows = found;
  }

  const s = st.catSort;
  if (s) {
    const mul = s.dir === 'desc' ? -1 : 1;
    rows = rows.slice().sort((a, b) => {
      const av = a[s.key];
      const bv = b[s.key];
      if (s.key === 'id' || s.key === 'price') return ((av || 0) - (bv || 0)) * mul;
      // boolean ต้องเทียบแบบ 1/0 ไม่ใช่ตัวอักษร ไม่งั้น "false" มาก่อน "true" เสมอ
      if (s.key === 'had' || s.key === 'renal') return ((av ? 1 : 0) - (bv ? 1 : 0)) * mul;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'th') * mul;
    });
  }

  const forms = formChips(list);
  const hiddenCount = list.filter((x) => x.hidden).length;

  // ── ป๊อปแก้ราคาย้อนหลัง (พี่กันสั่ง 25 ส.ค. 2569) ──────────────────────────
  // โผล่เองหลังแก้ราคายา เมื่อพบว่ามีรายการเก่าที่ใช้ราคาอื่นอยู่
  // 🚨 ต้องเลือกชื่อผู้แก้ + กรอกเหตุผล ถึงจะกดยืนยันได้
  const pf = st.priceFix;
  const pfCanSave = !!(pf && pf.who && String(pf.reason || '').trim() && !pf.busy);

  return {
    pfOpen: !!pf,
    pfDrugName: pf ? pf.drugName : '',
    pfRows: pf ? pf.rows : 0,
    pfLines: pf ? [
      { label: 'ยา', value: pf.drugName },
      { label: 'ราคาใหม่', value: pf.newPrice.toFixed(2) + ' ฿ ต่อหน่วย' },
      { label: 'รายการที่กระทบ', value: pf.rows + ' รายการ · ' + pf.qty + ' หน่วย', sep: true },
      { label: 'ช่วงวันที่', value: pf.firstDate === pf.lastDate ? thaiDate(pf.firstDate) : thaiDate(pf.firstDate) + ' ถึง ' + thaiDate(pf.lastDate) },
      { label: 'Lot ที่เกี่ยว', value: pf.lots.length ? pf.lots.slice(0, 3).join(' · ') + (pf.lots.length > 3 ? ' และอีก ' + (pf.lots.length - 3) : '') : '—' },
      { label: 'มูลค่าเดิม', value: money(pf.valueBefore), tone: 'red', sep: true },
      { label: 'มูลค่าใหม่', value: money(pf.valueAfter), tone: 'green' }
    ] : null,
    pfWho: pf ? pf.who : '',
    pfReason: pf ? pf.reason : '',
    pfBusy: pf ? !!pf.busy : false,
    pfCanSave: pfCanSave,
    pfStaff: st.staff || [],
    setPfWho: app.setPriceFixWho,
    setPfReason: app.setPriceFixReason,
    doPriceFix: app.doPriceFix,
    closePriceFix: app.closePriceFix,

    isCatalog: st.screen === 'catalog',
    catCols: COLS,
    catShowFull: st.catShowFull,
    catToggleFull: app.toggleCatFullName,
    catFullLabel: st.catShowFull ? 'ซ่อนคอลัมน์นี้' : 'แสดงคอลัมน์นี้',
    catLoading: st.catLoading,
    catSearch: st.catSearch,
    setCatSearch: app.setCatSearch,
    // ปุ่ม ✕ ล้างช่องค้นหา — ตารางมี 417 แถว กด Backspace รัวเสียเวลา (พี่กันสั่ง)
    catHasSearch: !!raw,
    clearCatSearch: () => app.setCatSearch(''),
    // ป้ายบอกว่าระบบค้นด้วยคำว่าอะไร ตอนแปลงแป้นพิมพ์ให้
    catSwapped: swapped,
    catSwapLabel: swapped ? q : '',
    catTotal: list.length,
    catShown: rows.length,
    catHiddenCount: hiddenCount,
    catFilters: [
      { key: 'had', label: 'HAD' },
      ...forms.map((f) => ({ key: 'form:' + f, label: f })),
      { key: 'pregDX', label: 'Preg D/X' },
      { key: 'renal', label: 'ปรับตามไต' },
      { key: 'hidden', label: 'ที่ซ่อนอยู่ (' + hiddenCount + ')' }
    ].map((f) => ({ ...f, on: st.catFilters.includes(f.key), pick: () => app.toggleCatFilter(f.key) })),
    catHasFilter: st.catFilters.length > 0,
    catClearFilters: app.clearCatFilters,
    // ล้างทั้งคำค้นและตัวกรองในปุ่มเดียว — คนที่ทั้งค้นทั้งกรองไม่ต้องกดสองที่
    catClearAll: app.clearCatAll,
    catSortKey: s ? s.key : '',
    catSortDir: s ? s.dir : '',
    catSortBy: app.toggleCatSort,
    catAdd: app.openCatAdd,
    catToTop: app.catToTop,
    catHeadRef: app.catHeadRef,

    catRows: rows.map((x) => {
      const full = fullNames.get(x.id) || '';
      // แยกส่วนของชื่อเต็มเพื่อทาสีให้เหมือนตอนค้นหาจริงทุกจุด
      const sp = splitDrugName(full);
      const rl = splitRelease(sp.strength);
      const pc = splitPercent(rl.main);
      return {
        id: x.id,
        abbrev: (x.abbrev || '').trim(),
        generic: x.generic || '',
        brand: (x.brand || '').trim(),
        strength: (x.strength || '').trim(),
        unit: (x.unit || '').trim(),
        percent: (x.percent || '').trim(),
        form: (x.form || '').trim(),
        release: (x.release || '').trim(),
        route: (x.route || '').trim(),
        had: x.had === true,
        preg: (x.preg || '').trim(),
        renal: x.renal === true,
        hidden: x.hidden === true,
        price: Number(x.price || 0),
        // ยาที่ยังไม่ใส่ราคาโชว์เป็นขีด ไม่ใช่ 0.00 — กันเข้าใจผิดว่าราคาศูนย์บาทจริง
        priceLabel: Number(x.price || 0) > 0 ? Number(x.price).toFixed(2) : '',
        needsCheck: x.needsCheck === true,
        // ชื่อเต็มแยกเป็นส่วน ๆ พร้อมทาสี (คอลัมน์ที่กดซ่อน/ขยายได้)
        fullBase: sp.base,
        fullStrength: pc.main,
        fullPercent: pc.percent ? '(' + pc.percent + ')' : '',
        fullRelease: rl.release ? '(' + rl.release + ')' : '',
        rowBg: x.hidden ? '#faf7f2' : '#fff',
        edit: () => app.openCatEdit(x),
        log: () => app.openCatLog(x),
        hide: () => app.askHideDrug(x),
        hideLabel: x.hidden ? 'เอากลับมา' : 'ซ่อน'
      };
    }),

    // ── ป๊อปแก้ไข ──────────────────────────────────────────────────────────
    catEdit: st.catEdit,
    catEditNew: st.catEditNew,
    catBusy: st.catBusy,
    setCatField: app.setCatField,
    saveCatEdit: app.saveCatEdit,
    askCloseCatEdit: app.askCloseCatEdit,
    catConfirmClose: st.catConfirmClose,
    closeCatEdit: app.closeCatEdit,
    keepCatEdit: app.keepCatEdit,
    // ตัวเลือกในช่องแบบเลื่อนลง — เอาจากค่าที่มีจริงในคลัง กันพิมพ์ไม่ตรงกัน
    // ตัวอย่างสีที่จะเห็นจริง + หน่วยเริ่มต้นของกลุ่ม ไว้โชว์เป็น placeholder
    catPillPreview: st.catEdit ? (pillColorOf({ pill_color: st.catEdit.pill_color, pill_color_hex: st.catEdit.pill_color_hex }) || {}).color || '' : '',
    catPillHint: st.catEdit && st.catEdit.pill_color && COLOR_HEX[String(st.catEdit.pill_color).trim()] ? COLOR_HEX[String(st.catEdit.pill_color).trim()] : 'เว้นว่างได้',
    catDefaultUnit: st.catEdit ? (FORM_UNIT[String(st.catEdit.form || '').trim()] || UNIT_FALLBACK) : '',
    catUnitOpts: distinct(list, 'unit', st.catEdit),
    catFormOpts: distinct(list, 'form', st.catEdit),
    catRouteOpts: distinct(list, 'route', st.catEdit),

    // ── ป๊อปยืนยันซ่อน ─────────────────────────────────────────────────────
    catHideTarget: st.catHideTarget,
    catHideName: st.catHideTarget ? (fullNames.get(st.catHideTarget.id) || st.catHideTarget.generic) : '',
    catHideIsBack: !!(st.catHideTarget && st.catHideTarget.hidden),
    cancelHideDrug: app.cancelHideDrug,
    doHideDrug: app.doHideDrug,

    // ── ป๊อปประวัติ ────────────────────────────────────────────────────────
    catLog: st.catLog,
    catLogName: st.catLog ? (fullNames.get(st.catLog.drug.id) || st.catLog.drug.generic) : '',
    catLogRows: st.catLog && st.catLog.rows ? st.catLog.rows.map(diffRow) : null,
    closeCatLog: app.closeCatLog
  };
}

function distinct(list, key, cur) {
  const set = new Set();
  for (const d of list) if (d[key]) set.add(String(d[key]));
  if (cur && cur[key]) set.add(String(cur[key]));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
}

// ป้ายไทยของแต่ละช่อง ใช้ในหน้าประวัติ
const FIELD_TH = {
  generic: 'ชื่อยา', strength: 'ความแรง', unit: 'หน่วย', percent: 'เปอร์เซ็นต์',
  form: 'รูปแบบ', route: 'ทางให้ยา', release: 'การออกฤทธิ์', brand: 'ชื่อการค้า',
  abbrev: 'ตัวย่อ', had: 'ยาความเสี่ยงสูง', preg: 'Preg', renal: 'ปรับตามไต',
  hidden: 'การแสดงผล'
};

// แปลงแถวประวัติเป็นรายการ "ช่องไหนเปลี่ยนจากอะไรเป็นอะไร"
function diffRow(r) {
  const o = r.old_data || {};
  const n = r.new_data || {};
  const changes = [];
  for (const k of Object.keys(FIELD_TH)) {
    const a = o[k];
    const b = n[k];
    if (String(a ?? '') === String(b ?? '')) continue;
    const fmt = (v) => {
      if (k === 'hidden') return v ? 'ซ่อน' : 'แสดง';
      if (k === 'had' || k === 'renal') return v ? 'ใช่' : 'ไม่';
      return v == null || v === '' ? '(ว่าง)' : String(v);
    };
    changes.push({ label: FIELD_TH[k], from: fmt(a), to: fmt(b) });
  }
  const act = r.action === 'INSERT' ? 'เพิ่มยาใหม่' : r.action === 'DELETE' ? 'ลบออกจากคลัง' : 'แก้ไข';
  return { id: r.id, action: act, at: r.changed_at, changes: changes };
}
