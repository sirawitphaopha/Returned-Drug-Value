// ── นำเข้าราคาจากไฟล์ HIS ───────────────────────────────────────────────────
//
// พี่กันเลือกแบบ "หน้าตรวจทานในเว็บ" ไม่ใช่นำเข้าอัตโนมัติทั้งดุ้น
// เพราะราคาถูกแช่แข็งลงแถวตอนบันทึก ถ้าจับคู่ผิดแล้วบันทึกไป
// ตัวเลข KPI ที่เอาไปเสนอผู้บริหารจะผิดถาวร แก้ทีหลังไม่ได้
//
// 🚨 ไฟล์ถูกอ่านในเบราว์เซอร์ล้วน ๆ ไม่เคยถูกส่งขึ้นเซิร์ฟเวอร์
//    ไฟล์จาก HIS มีข้อมูลทั้งบัญชียาของโรงพยาบาล ไม่มีเหตุให้ต้องอัปโหลด
//    สิ่งเดียวที่ถูกส่งขึ้นไปคือ (รหัสยา, ราคา) ของแถวที่พี่กันติ๊กยืนยันแล้วเท่านั้น
import { readHisRows, matchAll, rowPrice } from '@/lib/hisMatch';

const XLSX_SRC = '/vendor/xlsx.full.min.js';

// โหลดตัวอ่าน Excel แบบขอเมื่อใช้ — 952 KB ไม่ควรถ่วงตอนเปิดเว็บครั้งแรก
// เก็บสัญญาไว้ใน app._xlsxPromise กันโหลดซ้ำเวลาเปิดหน้านี้หลายรอบ
function loadXlsx(app) {
  if (typeof window !== 'undefined' && window.XLSX) return Promise.resolve(window.XLSX);
  if (app._xlsxPromise) return app._xlsxPromise;

  app._xlsxPromise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = XLSX_SRC;
    el.async = true;
    el.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('โหลดตัวอ่านไฟล์ไม่สำเร็จ')));
    el.onerror = () => { app._xlsxPromise = null; reject(new Error('โหลดตัวอ่านไฟล์ไม่สำเร็จ')); };
    document.head.appendChild(el);
  });
  return app._xlsxPromise;
}

export function himportActions(app) {
  app.openHisImport = () => app.setState({
    hisOpen: true, hisRows: [], hisError: '', hisReading: false,
    hisFileName: '', hisTotal: 0, hisTab: 'sure', hisSaving: false, hisBackfill: true
  });

  app.closeHisImport = () => app.setState({ hisOpen: false });

  app.setHisTab = (t) => () => app.setState({ hisTab: t });

  app.toggleHisBackfill = () => app.setState({ hisBackfill: !app.state.hisBackfill });

  // ── เลือกไฟล์แล้วอ่าน ─────────────────────────────────────────────────────
  app.onHisFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    // เคลียร์ค่าในช่องเลือกไฟล์ทันที ไม่งั้นเลือกไฟล์เดิมซ้ำจะไม่ยิง onChange
    e.target.value = '';
    if (!file) return;

    app.setState({ hisReading: true, hisError: '', hisFileName: file.name, hisRows: [] });

    try {
      const XLSX = await loadXlsx(app);
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error('ไฟล์นี้ไม่มีแผ่นงานข้อมูล');

      const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!raw.length) throw new Error('ไฟล์นี้ไม่มีข้อมูลในแผ่นแรก');

      // ต้องมีคอลัมน์ Name กับ UnitPrice ไม่งั้นคือคนละไฟล์
      const head = Object.keys(raw[0] || {});
      if (head.indexOf('Name') < 0 || head.indexOf('UnitPrice') < 0) {
        throw new Error('ไม่ใช่ไฟล์รายการยาของ HIS — ต้องมีคอลัมน์ Name และ UnitPrice');
      }

      const pool = readHisRows(raw);
      if (!pool.length) throw new Error('อ่านรายการยาจากไฟล์ไม่ได้เลย');

      // ต้องมีรายการยาในเว็บก่อน ถึงจะจับคู่ได้
      if (!app.state.priceItems.length) await app.loadPrices(true);
      const rows = matchAll(app.state.priceItems, pool);

      app.setState({
        hisRows: rows,
        hisTotal: pool.length,
        hisReading: false,
        hisTab: 'sure'
      });
    } catch (err) {
      app.setState({ hisReading: false, hisError: err.message || 'อ่านไฟล์ไม่สำเร็จ', hisRows: [] });
    }
  };

  // ── ปรับแต่งรายแถว ────────────────────────────────────────────────────────
  const patch = (drugId, changes) => {
    app.setState({
      hisRows: app.state.hisRows.map((r) => (r.drugId === drugId ? Object.assign({}, r, changes) : r))
    });
  };

  app.toggleHisRow = (drugId) => () => {
    const row = app.state.hisRows.find((r) => r.drugId === drugId);
    if (!row) return;
    patch(drugId, { checked: !row.checked });
  };

  // เลือกบรรทัด HIS อื่นให้ยาตัวนี้ — ติ๊กให้เลยเพราะการเลือกคือการยืนยันอยู่แล้ว
  app.pickHisCandidate = (drugId, index) => () =>
    patch(drugId, { pickedIndex: index, checked: true, manualPrice: '' });

  app.setHisManualPrice = (drugId) => (e) => {
    const v = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    patch(drugId, { manualPrice: v, checked: v !== '' && Number(v) > 0 });
  };

  // ติ๊ก/เอาออกทั้งกลุ่มที่กำลังดูอยู่
  app.checkHisTab = (on) => () => {
    const tab = app.state.hisTab;
    app.setState({
      hisRows: app.state.hisRows.map((r) => {
        if (r.level !== tab) return r;
        // กลุ่มที่ไม่มีผู้สมัครและยังไม่พิมพ์ราคาเอง ติ๊กไปก็ไม่มีอะไรบันทึก
        if (on && rowPrice(r) == null) return r;
        return Object.assign({}, r, { checked: on });
      })
    });
  };

  // ── บันทึก ────────────────────────────────────────────────────────────────
  app.saveHisImport = async () => {
    if (app.state.hisSaving) return;

    const items = [];
    for (const r of app.state.hisRows) {
      if (!r.checked) continue;
      const p = rowPrice(r);
      if (p == null) continue;
      items.push({ drugId: r.drugId, price: p });
    }
    if (!items.length) { app.toast('ยังไม่ได้เลือกรายการที่จะบันทึก', '', false); return; }

    app.setState({ hisSaving: true });
    try {
      // API รับได้ครั้งละ 500 รายการ ยา 417 ตัวยังไม่ถึงเพดาน แต่ซอยไว้กันอนาคต
      let saved = 0, backfilled = 0;
      for (let i = 0; i < items.length; i += 400) {
        const chunk = items.slice(i, i + 400);
        const res = await fetch('/api/prices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: chunk,
            backfill: !!app.state.hisBackfill,
            by: app.state.recorder || ''
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
        saved += Number(data.saved || 0);
        backfilled += Number(data.backfilled || 0);
      }

      app.setState({ hisSaving: false, hisOpen: false, hisRows: [] });
      app.invalidate();
      await Promise.all([app.loadPrices(true), app.boot()]);
      app.toast(
        'บันทึกราคา ' + saved + ' รายการ',
        backfilled ? 'ตีราคาย้อนหลังให้รายการเก่า ' + backfilled + ' แถว' : ''
      );
    } catch (err) {
      app.setState({ hisSaving: false });
      app.toast('บันทึกไม่สำเร็จ', err.message || '', false);
    }
  };
}
