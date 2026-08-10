// ค่าของหน้ารายการ Lot + ใบสรุป Lot
import { money, thaiDate } from '@/lib/format';
import { qtyText } from '../helpers';

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
        itemsLabel: Number(l.items || 0).toLocaleString('en-US') + ' รายการ',
        // 🚨 ไม่รวมจำนวนข้ามหน่วยนับตรงนี้ (เม็ด+ขวด+หลอด บวกกันไม่มีความหมาย)
        //    ฐานข้อมูลส่ง qty รวมมาก็จริง แต่หน้านี้ไม่เอามาโชว์ ให้ดูมูลค่าแทน
        savedLabel: money(saved),
        lostLabel: lost > 0 ? money(lost) : '',
        hasLost: lost > 0,
        openHistory: () => app.openLotInHistory(l.lot),
        openSlip: () => app.openLotSlip(l)
      };
    }),

    // ── ใบสรุป Lot สำหรับพิมพ์ ───────────────────────────────────────────────
    slipOpen: !!slip,
    slipLoading: !!st.slipLoading,
    slipLot: slip ? slip.lot : '',
    slipDate: slip ? thaiDate(slip.date) : '',
    slipBy: slip ? (slip.by || 'ไม่ระบุผู้บันทึก') : '',
    slipOrg: st.orgName,
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
    printLotSlip: app.printLotSlip
  };
}
