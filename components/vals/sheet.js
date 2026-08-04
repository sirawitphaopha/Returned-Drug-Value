// ค่าของป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 1414–1441)
import { PRESETS, money } from '@/lib/format';

export function sheetVals(app, d) {
  const st = d.st;
  const sheet = st.sheet;
  const qty = parseInt(st.sheetQty || '0', 10) || 0;
  const reuse = st.sheetDisp === 'reuse';

  return {
    sheetOpen: !!sheet,
    closeSheet: app.closeSheet,
    sheetName: sheet ? sheet.drug.name : '',
    sheetUnit: sheet ? sheet.drug.unit : '',
    sheetPriceLabel: sheet ? sheet.drug.price.toFixed(2) + ' ฿ / ' + sheet.drug.unit + ' · ราคา ณ วันบันทึก' : '',
    sheetQty: st.sheetQty,
    sheetQtyRef: app.sheetQtyRef,
    onSheetQty: (e) => app.setState({ sheetQty: e.target.value.replace(/[^0-9]/g, '') }),
    onSheetKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); app.confirmSheet(); } },
    sheetDec: () => app.setState({ sheetQty: String(Math.max(0, qty - 1)) }),
    sheetInc: () => app.setState({ sheetQty: String(qty + 1) }),
    sheetPresets: PRESETS.map((p) => ({
      label: String(p),
      bg: qty === p ? '#e3f0e8' : '#f0f1ee',
      fg: qty === p ? '#2f7d5d' : '#414a44',
      pick: () => app.setState({ sheetQty: String(p) })
    })),
    sheetPillBg: reuse ? '#f0f1ee' : '#fbe4dd',
    sheetReuseBg: reuse ? '#fff' : 'transparent',
    sheetReuseFg: reuse ? '#2f7d5d' : '#c9a096',
    sheetDestroyBg: reuse ? 'transparent' : '#fff',
    sheetDestroyFg: reuse ? '#9aa19c' : '#c2543c',
    sheetSetReuse: () => app.setState({ sheetDisp: 'reuse' }),
    sheetSetDestroy: () => app.setState({ sheetDisp: 'destroy' }),
    sheetCta: sheet && sheet.kind === 'add' ? 'เพิ่ม' : 'บันทึกการแก้ไข',
    sheetValueLabel: sheet && qty
      ? (sheet.kind === 'add' ? (reuse ? '+' : '−') : '') + money(sheet.drug.price * qty)
      : '',
    sheetConfirm: app.confirmSheet
  };
}
