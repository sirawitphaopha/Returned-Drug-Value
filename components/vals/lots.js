// ค่าของหน้ารายการ Lot + ใบสรุป Lot
import { money, thaiDate, SOURCES } from '@/lib/format';
import { qtyText, evalQty, isQtyExpr, exprText } from '../helpers';
import { nameParts } from './record';
import { pillColorOf } from '@/lib/drugPillColors';

const RANGES = [
  { key: 'today', label: 'วันนี้' },
  { key: 'week', label: '7 วัน' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'fy', label: 'ปีงบ' }
];

export function lotsVals(app, d) {
  const st = d.st;
  const lots = st.lots || [];
  const slip = st.slipLot;
  const slipRows = st.slipRows || [];

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
    closeLots: app.closeLots,
    lotsLoading: !!st.lotsLoading && !lots.length,
    lotsEmpty: !st.lotsLoading && !lots.length,
    lotsCountLabel: lots.length.toLocaleString('en-US') + ' Lot',
    lotsHasMore: lots.length > st.lotsShown,
    lotsMoreLabel: 'ดูเพิ่มอีก ' + Math.min(40, lots.length - st.lotsShown).toLocaleString('en-US') + ' Lot',
    moreLots: app.moreLots,

    lotsRanges: RANGES.map((r) => ({
      key: r.key,
      label: r.label,
      bg: st.lotsRange === r.key ? '#2f7d5d' : '#f0f1ee',
      fg: st.lotsRange === r.key ? '#fff' : '#414a44',
      pick: () => app.setLotsRange(r.key)
    })),

    lotRows: lots.slice(0, st.lotsShown).map((l) => {
      const saved = Number(l.saved || 0);
      const lost = Number(l.lost || 0);
      return {
        key: l.lot,
        lot: l.lot,
        dateLabel: thaiDate(l.date),
        by: l.by || 'ไม่ระบุผู้บันทึก',
        // ป้ายเล็กบอกว่าล็อตนี้มาจาก รพ.สต. ไหน — ว่างเมื่อไม่ได้มาจาก รพ.สต.
        siteLabel: l.src === 'pcu' ? String(l.pcuSite || '').trim() : '',
        itemsLabel: Number(l.items || 0).toLocaleString('en-US') + ' รายการ',
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
    slipDate: slip ? thaiDate(slip.date) : '',
    slipBy: slip ? (slip.by || 'ไม่ระบุผู้บันทึก') : '',
    // ใบที่พิมพ์ออกมาต้องบอกได้ว่ายาชุดนี้มาจาก รพ.สต. ไหน
    // ไม่งั้นส่งใบกลับไปให้ต้นทางแล้วเขาไม่รู้ว่าเป็นของตัวเองหรือเปล่า
    slipSite: slip && slip.src === 'pcu' ? String(slip.pcuSite || '').trim() : '',
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
        reuseFg: reuse ? '#2f7d5d' : '#c9a096',
        destroyBg: reuse ? 'transparent' : '#fff',
        destroyFg: reuse ? '#9aa19c' : '#c2543c',
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
