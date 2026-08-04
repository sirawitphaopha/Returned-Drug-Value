// หน้าประวัติ — อ่านจากเซิร์ฟเวอร์ · แก้และลบทีละรายการ
// ต่างจากมอคอัปตรงที่มอคอัปกรองในเครื่อง (ข้อมูลกองอยู่ในเครื่องอยู่แล้ว)
// ของจริงข้อมูลอยู่ในฐานข้อมูล เลยให้ SQL กรองแล้วส่งมาแค่ 60 แถวบนสุด
import { money } from '@/lib/format';

const HIST_TTL = 60000;
const DEBOUNCE = 300;

export function historyActions(app) {
  app._histTimer = null;
  // เลขลำดับคำขอ — ถ้าพิมพ์เร็วจนคำตอบเก่ากลับมาทีหลัง จะได้ทิ้งของเก่าไป
  app._histSeq = 0;

  const keyOf = () => app.state.histRange + '\n' + app.state.histQuery.trim();

  app.loadHistory = async (force) => {
    const k = keyOf();
    const c = app._histCache[k];
    if (!force && c && Date.now() - c.ts < HIST_TTL) {
      app.setState({ histRows: c.rows, histTotal: c.total, histSaved: c.saved, histLoading: false });
      return;
    }

    const seq = ++app._histSeq;
    const st = app.state;
    app.setState({ histLoading: true });

    try {
      const url = '/api/returns?range=' + encodeURIComponent(st.histRange) +
        '&q=' + encodeURIComponent(st.histQuery.trim());
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านประวัติไม่สำเร็จ');

      app._histCache[k] = {
        ts: Date.now(),
        rows: data.rows,
        total: Number(data.total || 0),
        saved: Number(data.saved || 0)
      };
      if (seq !== app._histSeq) return;
      app.setState({
        histRows: data.rows,
        histTotal: Number(data.total || 0),
        histSaved: Number(data.saved || 0),
        histLoading: false
      });
    } catch (e) {
      if (seq !== app._histSeq) return;
      app.setState({ histLoading: false });
      app.toast('อ่านประวัติไม่สำเร็จ', '', false);
    }
  };

  // ต่างจากมอคอัปโดยจำเป็น: ช่องค้นในหน้านี้ยิงเซิร์ฟเวอร์ เลยต้องหน่วง
  // (ช่องค้นยาในหน้าบันทึกไม่หน่วง เพราะค้นในเครื่อง)
  app.onHistQuery = (e) => {
    app.setState({ histQuery: e.target.value });
    if (app._histTimer) clearTimeout(app._histTimer);
    app._histTimer = setTimeout(() => app.loadHistory(), DEBOUNCE);
  };

  app.setHistRange = (key) => {
    app.setState({ histRange: key }, () => app.loadHistory());
  };

  // ราคาที่โชว์ในป๊อปอัปต้องเป็นราคาที่แช่ไว้ในแถว ไม่ใช่ราคาปัจจุบันของยาตัวนั้น
  app.editRecord = (r) => {
    const drug = { id: r.drugId, name: r.name, unit: r.unit, price: Number(r.price) };
    app.openSheet(drug, 'record', r.id, r.qty, r.disposition);
  };

  // แก้บนจอก่อน แล้วค่อยยิงเซิร์ฟเวอร์ ถ้าล้มเหลวย้อนกลับให้เหมือนเดิม
  app.saveRecordEdit = async (id, qty, disp, drug) => {
    const before = app.state.histRows;
    const after = before.map((r) => (r.id === id ? Object.assign({}, r, { qty: qty, disposition: disp }) : r));
    app.setState({ histRows: after, sheet: null, sheetQty: '' });

    try {
      const res = await fetch('/api/returns/' + id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qty: qty, disposition: disp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'แก้ไขไม่สำเร็จ');

      app.invalidate();
      app.toast('แก้ไขรายการแล้ว', money(drug.price * qty));
      app.loadHistory(true);
      app.refreshFy();
    } catch (e) {
      app.setState({ histRows: before });
      app.toast('แก้ไขไม่สำเร็จ', '', false);
    }
  };

  // ต่างจากมอคอัปโดยตั้งใจ: มอคอัปกดลบแล้วหายเลย ของจริงต้องยืนยันก่อน 1 ชั้น
  app.askDeleteRecord = (r) => {
    app.setState({
      confirm: {
        title: 'ยืนยันลบรายการนี้',
        detail: r.name + ' · ' + r.qty + ' ' + r.unit + ' · ' + money(Number(r.price) * r.qty),
        note: 'รายการที่ลบแล้วกู้คืนไม่ได้ และมูลค่าสะสมปีงบจะลดลงตามไปด้วย',
        okLabel: 'ยืนยันลบ',
        run: () => app.deleteRecord(r)
      }
    });
  };

  app.closeConfirm = () => app.setState({ confirm: null });

  app.deleteRecord = async (r) => {
    const before = app.state.histRows;
    app.setState({ histRows: before.filter((x) => x.id !== r.id), confirm: null });

    try {
      const res = await fetch('/api/returns/' + r.id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');

      app.invalidate();
      app.toast('ลบรายการแล้ว', r.name);
      app.loadHistory(true);
      app.refreshFy();
    } catch (e) {
      app.setState({ histRows: before });
      app.toast('ลบไม่สำเร็จ', '', false);
    }
  };
}
