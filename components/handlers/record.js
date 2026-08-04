// หน้าบันทึก — เพิ่มยาเข้ารายการ · ป๊อปอัปใส่จำนวน · ส่งขึ้นฐานข้อมูล
// คัดจากมอคอัป (บรรทัด 912–1051) ตัดสวิตช์จำลองเน็ตหลุดกับ resetDemo ออก
import { money } from '@/lib/format';

const sumReuse = (rows) => rows.reduce((a, r) => a + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0);

export function recordActions(app) {
  app.addRow = (drug, qty, disp) => {
    const row = {
      rid: Date.now() + Math.random(),
      drugId: drug.id, name: drug.name, unit: drug.unit,
      price: drug.price, qty: qty, disposition: disp
    };
    const rows = app.state.rows.concat([row]);
    app.persist({ rows: rows, saveFailed: false });
    app.animateTo(sumReuse(rows));
    app.toast('เพิ่ม ' + drug.name, (disp === 'reuse' ? '+' : '−') + money(drug.price * qty));
    return rows;
  };

  app.addInline = () => {
    const d = app.state.pending;
    const qty = Math.max(0, parseInt(app.state.qtyInput || '0', 10) || 0);
    if (!d || !qty) {
      if (!d && app.searchRef.current) app.searchRef.current.focus();
      else if (app.qtyRef.current) app.qtyRef.current.focus();
      return;
    }
    app.addRow(d, qty, app.state.pendingDisp);
    app.setState({ pending: null, qtyInput: '', query: '', pendingDisp: 'reuse' }, () => {
      if (app.searchRef.current) app.searchRef.current.focus();
    });
  };

  app.pickInline = (drug) => {
    app.setState({ pending: drug, query: drug.name, qtyInput: '' }, () => {
      if (app.qtyRef.current) app.qtyRef.current.focus();
    });
  };

  app.openSheet = (drug, editKind, editId, qty, disp) => {
    app.setState({
      sheet: { drug: drug, kind: editKind || 'add', id: editId || null },
      sheetQty: qty ? String(qty) : '',
      sheetDisp: disp || 'reuse',
      query: ''
    }, () => { if (app.sheetQtyRef.current) app.sheetQtyRef.current.focus(); });
  };

  app.closeSheet = () => app.setState({ sheet: null, sheetQty: '' });

  app.confirmSheet = () => {
    const s = app.state.sheet;
    const qty = Math.max(0, parseInt(app.state.sheetQty || '0', 10) || 0);
    if (!s || !qty) return;

    if (s.kind === 'add') {
      const row = {
        rid: Date.now() + Math.random(),
        drugId: s.drug.id, name: s.drug.name, unit: s.drug.unit,
        price: s.drug.price, qty: qty, disposition: app.state.sheetDisp
      };
      const rows = app.state.rows.concat([row]);
      app.persist({ rows: rows, sheet: null, sheetQty: '', saveFailed: false });
      app.animateTo(sumReuse(rows));
      app.toast('เพิ่ม ' + s.drug.name, (app.state.sheetDisp === 'reuse' ? '+' : '−') + money(s.drug.price * qty));
      if (app.searchRef.current) app.searchRef.current.focus();
    } else if (s.kind === 'row') {
      const rows = app.state.rows.map((r) =>
        r.rid === s.id ? Object.assign({}, r, { qty: qty, disposition: app.state.sheetDisp }) : r);
      app.persist({ rows: rows, sheet: null, sheetQty: '' });
      app.animateTo(sumReuse(rows));
      app.toast('แก้ไขรายการแล้ว', money(s.drug.price * qty));
    } else {
      // แก้รายการที่บันทึกลงฐานไปแล้ว — ยิง PATCH ต่อที่ handlers/history.js
      app.saveRecordEdit(s.id, qty, app.state.sheetDisp, s.drug);
    }
  };

  // ส่งทั้งรอบขึ้นฐานข้อมูลทีเดียว
  // ใช้ batchId เดิมตอนกดลองส่งใหม่ เพราะที่เจอจริงบนเน็ตโรงพยาบาลคือ
  // "ข้อมูลเข้าฐานไปแล้วแต่คำตอบหายกลางทาง" ถ้าไม่กันไว้จะได้ข้อมูลซ้ำสองชุด
  app.save = async () => {
    const st = app.state;
    if (!st.rows.length || st.saving) return;

    const batchId = st.batchId || crypto.randomUUID();
    const n = st.rows.length;
    const saved = app.savedTotal();

    app.setState({ saving: true, saveFailed: false, batchId: batchId });

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          batchId: batchId,
          date: st.date,
          source: st.source,
          hn: st.hn,
          items: st.rows.map((r) => ({
            clientRid: String(r.rid),
            drugId: r.drugId,
            qty: r.qty,
            disposition: r.disposition
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');

      app.persist({
        rows: [], saveFailed: false, hn: '', batchId: null, saving: false,
        fy: data.fy || st.fy
      });
      app.invalidate();
      app.animateTo(0);
      app.toast('บันทึก ' + n + ' รายการแล้ว', money(saved));
    } catch (e) {
      app.setState({ saving: false, saveFailed: true });
      app.toast('ส่งไม่สำเร็จ กดลองส่งใหม่ได้', '', false);
    }
  };
}
