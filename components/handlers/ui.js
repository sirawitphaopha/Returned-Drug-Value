// ตัวช่วยทั่วไป: เก็บลงเครื่อง · ข้อความเด้ง · ตัวเลขที่นับขึ้น
// คัดจากมอคอัป (บรรทัด 957–1004) ตัดเฉพาะส่วนที่เก็บรายการที่บันทึกแล้วลงเครื่อง
// เพราะยอด KPI เก่าค้างบนจอแย่กว่ารอโหลดนิดหน่อย
import { LS, writeLS } from '../helpers';

export function uiActions(app) {
  // เก็บเฉพาะร่างที่ยังไม่บันทึก กับธีม — ที่เหลืออยู่บนเซิร์ฟเวอร์
  app.persist = (patch) => {
    app.setState(patch, () => {
      writeLS(LS.draft, app.state.rows);
      writeLS(LS.dark, app.state.dark ? 1 : 0);
    });
  };

  // สลับแท็บ — หน้าประวัติกับหน้าสรุปดึงข้อมูลจากเซิร์ฟเวอร์ เลยต้องสั่งโหลดตอนเข้า
  // (มอคอัปไม่มีขั้นนี้เพราะข้อมูลอยู่ในเครื่องอยู่แล้ว)
  app.goScreen = (name) => {
    app.setState({ screen: name }, () => {
      if (name === 'history') app.loadHistory();
      if (name === 'summary') app.loadSummary();
    });
  };

  app.savedTotal = () =>
    app.state.rows.reduce((s, r) => s + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0);

  app.lostTotal = () =>
    app.state.rows.reduce((s, r) => s + (r.disposition === 'destroy' ? r.price * r.qty : 0), 0);

  app.animateTo = (target) => {
    if (app._raf) cancelAnimationFrame(app._raf);
    const from = app.state.animSaved;
    if (Math.abs(target - from) < 0.005) { app.setState({ animSaved: target }); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      app.setState({ animSaved: from + (target - from) * e });
      if (k < 1) app._raf = requestAnimationFrame(step);
    };
    app._raf = requestAnimationFrame(step);
  };

  app.toast = (text, value, ok) => {
    if (app._toastTimer) clearTimeout(app._toastTimer);
    app.setState({ toast: { text: text, value: value, ok: ok !== false } });
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    app._toastTimer = setTimeout(() => app.setState({ toast: null }), 2000);
  };
}
