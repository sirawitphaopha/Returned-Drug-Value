// หน้าคลังยา — ดู แก้ เพิ่ม ซ่อน และดูประวัติการแก้ของยาในตารางกลาง
//
// 🚨 ตาราง drugs ใช้ร่วมกัน 3 เว็บ แก้ที่นี่กระทบ ME-DRP กับ TB Calculator ด้วย
//    ทุกการเปลี่ยนแปลงถูกบันทึกลง drug_audit อัตโนมัติ ย้อนดูได้เสมอ
//
// 🚨 ลบยาไม่ได้โดยตั้งใจ — ใช้ "ซ่อน" แทน (พี่กันสั่ง 13 ส.ค. 2569)
//    เพราะรายการยาคืนเก่าที่อ้างถึงยาตัวนั้นยังต้องแสดงชื่อได้อยู่
import { fetchT } from '../helpers';

export function catalogActions(app) {
  // โหลดคลังยาดิบ (รวมตัวที่ซ่อนไว้) — ต่างจาก st.drugs ที่กรองตัวซ่อนออกแล้ว
  app.loadCatalog = async (force) => {
    if (app.state.catLoading) return;
    if (app.state.catalog.length && !force) return;
    app.setState({ catLoading: true });
    try {
      const res = await fetchT('/api/catalog');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดคลังยาไม่สำเร็จ');
      app.setState({ catalog: Array.isArray(data.drugs) ? data.drugs : [], catLoading: false });
    } catch (e) {
      app.setState({ catLoading: false });
      app.toast('โหลดคลังยาไม่สำเร็จ', '', false);
    }
  };

  app.openCatalog = () => {
    app.setState({ screen: 'catalog' });
    app.loadCatalog();
  };

  app.setCatSearch = (v) => app.setState({ catSearch: v });

  // กดทีเดียวขึ้นบนสุด — ตารางยาว 417 แถว เลื่อนกลับเองไกลมาก
  // 🚨 เว็บนี้เลื่อนใน scrollRef ของ shell ไม่ใช่ทั้งหน้า (window.scrollTo ไม่ทำงาน)
  app.catToTop = () => {
    const el = app.scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ตัวกรอง — กดซ้ำเพื่อยกเลิก · หลายอันพร้อมกันได้
  app.toggleCatFilter = (key) => {
    const cur = app.state.catFilters;
    app.setState({ catFilters: cur.includes(key) ? cur.filter((x) => x !== key) : cur.concat(key) });
  };
  app.clearCatFilters = () => app.setState({ catFilters: [] });

  // กดหัวคอลัมน์เพื่อเรียง · กดซ้ำสลับขึ้น/ลง
  app.toggleCatSort = (key) => {
    const s = app.state.catSort;
    app.setState({ catSort: s && s.key === key ? { key: key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: key, dir: 'asc' } });
  };

  // คอลัมน์ "ชื่อที่เห็นตอนค้นหา" — ยาวกว่าคอลัมน์อื่นมาก จึงซ่อนไว้ตั้งต้น
  // เป็นคอลัมน์เดียวในตารางที่กดซ่อน/ขยายได้ (พี่กันสั่ง 13 ส.ค. 2569)
  app.toggleCatFullName = () => app.setState({ catShowFull: !app.state.catShowFull });

  // ── ป๊อปแก้ไขยา ────────────────────────────────────────────────────────────
  app.openCatEdit = (drug) => {
    app.setState({ catEdit: { ...drug }, catEditOrig: { ...drug }, catEditNew: false, catBusy: false });
  };
  app.openCatAdd = () => {
    app.setState({
      catEdit: { generic: '', strength: '', unit: '', percent: '', form: '', route: '', release: '', brand: '', abbrev: '', had: false, preg: '', renal: false },
      catEditOrig: null,
      catEditNew: true,
      catBusy: false
    });
  };
  app.setCatField = (key, v) => app.setState({ catEdit: { ...app.state.catEdit, [key]: v } });

  // กดที่ว่างไม่ปิด · แก้ค้างแล้วกดยกเลิก = ถามก่อน (แบบเดียวกับ ME-DRP)
  app.askCloseCatEdit = () => {
    const a = app.state.catEdit;
    const b = app.state.catEditOrig;
    const dirty = !b
      ? Object.keys(a || {}).some((k) => a[k] !== '' && a[k] !== false && a[k] != null)
      : Object.keys(a || {}).some((k) => String(a[k] ?? '') !== String(b[k] ?? ''));
    if (dirty) app.setState({ catConfirmClose: true });
    else app.closeCatEdit();
  };
  app.closeCatEdit = () => app.setState({ catEdit: null, catEditOrig: null, catConfirmClose: false, catBusy: false });
  app.keepCatEdit = () => app.setState({ catConfirmClose: false });

  app.saveCatEdit = async () => {
    const d = app.state.catEdit;
    if (!d || app.state.catBusy) return;
    if (!String(d.generic || '').trim()) { app.toast('ต้องกรอกชื่อยา', '', false); return; }
    app.setState({ catBusy: true });
    try {
      const isNew = app.state.catEditNew;
      const res = await fetchT('/api/catalog', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      app.setState({ catEdit: null, catEditOrig: null, catConfirmClose: false, catBusy: false });
      app.toast(isNew ? 'เพิ่มยาแล้ว' : 'บันทึกแล้ว', '', true);
      // โหลดใหม่ทั้งสองชุด — ตารางคลังยา และรายการยาที่ช่องค้นหาใช้
      await app.loadCatalog(true);
      await app.syncDrugs(true);
    } catch (e) {
      app.setState({ catBusy: false });
      app.toast(String(e.message || 'บันทึกไม่สำเร็จ'), '', false);
    }
  };

  // ── ซ่อน / เอากลับมาแสดง ───────────────────────────────────────────────────
  // ยาที่ซ่อนจะหายจากช่องค้นหา แต่รายการยาคืนเก่ายังแสดงชื่อได้ปกติ (มี snapshot)
  app.askHideDrug = (drug) => app.setState({ catHideTarget: drug });
  app.cancelHideDrug = () => app.setState({ catHideTarget: null });
  app.doHideDrug = async () => {
    const d = app.state.catHideTarget;
    if (!d || app.state.catBusy) return;
    app.setState({ catBusy: true });
    try {
      const res = await fetchT('/api/catalog', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: d.id, hidden: !d.hidden })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ทำไม่สำเร็จ');
      app.setState({ catHideTarget: null, catBusy: false });
      app.toast(d.hidden ? 'เอากลับมาแสดงแล้ว' : 'ซ่อนยาแล้ว', '', true);
      await app.loadCatalog(true);
      await app.syncDrugs(true);
    } catch (e) {
      app.setState({ catBusy: false, catHideTarget: null });
      app.toast('ทำไม่สำเร็จ', '', false);
    }
  };

  // ── ประวัติการแก้ ──────────────────────────────────────────────────────────
  app.openCatLog = async (drug) => {
    app.setState({ catLog: { drug: drug, rows: null } });
    try {
      const res = await fetchT('/api/catalog/audit?id=' + drug.id);
      const data = await res.json();
      app.setState({ catLog: { drug: drug, rows: res.ok && Array.isArray(data.rows) ? data.rows : [] } });
    } catch (e) {
      app.setState({ catLog: { drug: drug, rows: [] } });
    }
  };
  app.closeCatLog = () => app.setState({ catLog: null });
}
