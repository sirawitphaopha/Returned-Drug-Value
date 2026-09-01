// ค่าของป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 1414–1441)
import { PRESETS, money } from '@/lib/format';
import { cleanQty, qtyNum, DESTROY_REASONS, destroyReasonHelp, MAX_QTY } from '../helpers';

export function sheetVals(app, d) {
  const st = d.st;
  const sheet = st.sheet;
  const qty = qtyNum(st.sheetQty);
  const reuse = st.sheetDisp === 'reuse';

  return {
    sheetOpen: !!sheet,
    closeSheet: app.closeSheet,

    // ยานอกบัญชี — โผล่ 3 ช่องให้พิมพ์ ชื่อ/หน่วย/ราคา เอง
    sheetIsOff: !!st.sheetOff,
    offName: st.sheetOff ? st.sheetOff.name : '',
    offUnit: st.sheetOff ? st.sheetOff.unit : '',
    offPrice: st.sheetOff ? st.sheetOff.price : '',
    onOffName: app.onOffField('name'),
    onOffUnit: app.onOffField('unit'),
    onOffPrice: app.onOffField('price'),

    sheetName: sheet ? sheet.drug.name : '',
    sheetUnit: sheet ? sheet.drug.unit : '',
    sheetPriceLabel: sheet ? sheet.drug.price.toFixed(2) + ' ฿ / ' + sheet.drug.unit + ' · ราคา ณ วันบันทึก' : '',
    sheetQty: st.sheetQty,
    sheetQtyRef: app.sheetQtyRef,
    onSheetQty: (e) => app.setState({ sheetQty: cleanQty(e.target.value) }),
    onSheetKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); app.confirmSheet(); } },
    sheetDec: () => app.setState({ sheetQty: String(Math.max(0, Math.round((qty - 1) * 100) / 100)) }),
    // 🚨 ปุ่มบวกยังไม่ให้เกินเพดาน เพราะเป็นการกดทีละครั้ง ไม่ใช่การพิมพ์พลาด
    //    ส่วนการพิมพ์เองปล่อยให้เกินได้ แล้วเตือนแทน (พี่กันเลือกแบบ ก)
    // ข้อความเตือนตอนพิมพ์เกินเพดาน — ว่างเปล่าเมื่อไม่เกิน
    sheetOverMsg: qty > MAX_QTY ? ('จำนวนสูงสุด ' + MAX_QTY.toLocaleString('th-TH')) : '',
    sheetOverMax: qty > MAX_QTY,
    sheetInc: () => app.setState({ sheetQty: String(Math.min(100000, Math.round((qty + 1) * 100) / 100)) }),
    sheetPresets: PRESETS.map((p) => ({
      label: String(p),
      bg: qty === p ? '#e3f0e8' : '#f0f1ee',
      fg: qty === p ? '#2f7d5d' : '#414a44',
      pick: () => app.setState({ sheetQty: String(p) })
    })),
    sheetPillBg: reuse ? '#f0f1ee' : '#fbe4dd',
    sheetReuseBg: reuse ? '#fff' : 'transparent',
    sheetReuseOn: reuse,
    sheetReuseFg: reuse ? '#2f7d5d' : '#c9a096',
    sheetDestroyBg: reuse ? 'transparent' : '#fff',
    sheetDestroyFg: reuse ? '#6f7873' : '#c2543c',
    sheetSetReuse: () => app.setState({ sheetDisp: 'reuse', sheetReason: '' }),
    sheetSetDestroy: () => app.setState({ sheetDisp: 'destroy' }),

    // เหตุผลการทำลาย — โผล่เฉพาะตอนเลือกทำลาย เพิ่มการกดแค่ 1 ครั้ง
    // แต่ได้ข้อมูลที่ผู้บริหารเอาไปตัดสินใจได้จริง (หมดอายุเยอะ = สั่งยาเกิน)
    sheetIsDestroy: !reuse,
    sheetReasons: DESTROY_REASONS.map((r) => ({
      label: r.label,
      help: r.help,
      on: st.sheetReason === r.label,
      bg: st.sheetReason === r.label ? '#fbe4dd' : '#f0f1ee',
      fg: st.sheetReason === r.label ? '#c2543c' : '#414a44',
      pick: () => app.setState({ sheetReason: st.sheetReason === r.label ? '' : r.label })
    })),
    // คำอธิบายของตัวที่เลือกอยู่ — โผล่ใต้แถวชิป ไม่ต้องยัดคำอธิบายลงในชิปทุกอัน
    sheetReasonHelp: destroyReasonHelp(st.sheetReason),
    sheetCta: sheet && sheet.kind === 'add' ? 'เพิ่ม' : 'บันทึกการแก้ไข',
    sheetValueLabel: sheet && qty
      ? (sheet.kind === 'add' ? (reuse ? '+' : '−') : '') + money(sheet.drug.price * qty)
      : '',
    sheetConfirm: app.confirmSheet
  };
}
