import { money } from '@/lib/format';
// หน้าคลังยา — ดู แก้ เพิ่ม ซ่อน และดูประวัติการแก้ของยาในตารางกลาง
//
// 🚨 ตาราง drugs ใช้ร่วมกัน 3 เว็บ แก้ที่นี่กระทบ ME-DRP กับ TB Calculator ด้วย
//    ทุกการเปลี่ยนแปลงถูกบันทึกลง drug_audit อัตโนมัติ ย้อนดูได้เสมอ
//
// 🚨 ลบยาไม่ได้โดยตั้งใจ — ใช้ "ซ่อน" แทน (พี่กันสั่ง 13 ส.ค. 2569)
//    เพราะรายการยาคืนเก่าที่อ้างถึงยาตัวนั้นยังต้องแสดงชื่อได้อยู่
import { SS, fetchT } from '../helpers';

export function catalogActions(app) {
  // โหลดคลังยาดิบ (รวมตัวที่ซ่อนไว้) — ต่างจาก st.drugs ที่กรองตัวซ่อนออกแล้ว
  app.loadCatalog = async (force) => {
    if (app.state.catLoading) return;
    if (app.state.catalog.length && !force) return;

    // โหลดไปแล้วรอบหนึ่งในแท็บนี้ = ไม่ต้องลากยา 417 ตัวมาอีก แม้จะรีเฟรชไปแล้ว
    // พี่กันสั่ง 27 ส.ค. 2569: "เรื่องคลังยาด้วย ถ้าโหลดมาแล้วครั้งนึง
    //                          ก็ต้องไม่โหลดอีก ยกเว้นมีใครแก้จากเครื่องอื่น"
    // ตัวล้างคือลายเซ็นคลังยา (drug_audit) ที่ /api/rev ถามให้ทุก 20 วินาที
    if (!force) {
      const cached = app.boxGet(SS.catalog, 'all', null);
      if (cached && cached.length) {
        app.setState({ catalog: cached, catLoading: false });
        return;
      }
    }

    app.setState({ catLoading: true });
    try {
      const res = await app.fetchT('/api/catalog');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดคลังยาไม่สำเร็จ');
      const list = Array.isArray(data.drugs) ? data.drugs : [];
      app.clearLoadErr('cat');
      app.boxSet(SS.catalog, 'all', null, list);
      app.setState({ catalog: list, catLoading: false });
    } catch (e) {
      app.setState({ catLoading: false });
      app.markLoadErr('cat', 'โหลดคลังยาไม่สำเร็จ');
      app.toast('โหลดคลังยาไม่สำเร็จ', '', false);
    }
  };

  app.openCatalog = () => {
    app.setState({ screen: 'catalog' });
    app.loadCatalog();
  };

  // วาดเพิ่มอีกชุดเมื่อเลื่อนใกล้ถึงท้ายตาราง
  // 🚨 เพิ่มทีละ 80 แถว — น้อยกว่านี้จะเรียกถี่จนสะดุด มากกว่านี้ก็ไม่ต่างจากวาดทั้งหมด
  app.drawMoreCatalog = () => {
    const cur = app.state.catDraw || 60;
    const all = (app.state.catalog || []).length;
    if (cur >= all) return;                 // วาดครบแล้ว ไม่ต้องสั่งวาดจอใหม่เปล่า ๆ
    app.setState({ catDraw: Math.min(cur + 80, all) });
  };

  // 🚨 เปลี่ยนเงื่อนไขค้น/กรอง/เรียง ต้องกลับไปเริ่มนับใหม่เสมอ
  //    ไม่งั้นค้นคำใหม่แล้วได้ผลลัพธ์ยาวเท่าที่เคยเลื่อนไว้ครั้งก่อน ซึ่งไม่มีเหตุผลอะไรเลย
  const RESET = { catDraw: 60 };

  app.setCatSearch = (v) => app.setState(Object.assign({ catSearch: v }, RESET));

  // กดทีเดียวขึ้นบนสุด — ตารางยาว 417 แถว เลื่อนกลับเองไกลมาก
  // 🚨 เว็บนี้เลื่อนใน scrollRef ของ shell ไม่ใช่ทั้งหน้า (window.scrollTo ไม่ทำงาน)
  app.catToTop = () => {
    const el = app.scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ตัวกรอง — กดซ้ำเพื่อยกเลิก · หลายอันพร้อมกันได้
  app.toggleCatFilter = (key) => {
    const cur = app.state.catFilters;
    app.setState(Object.assign({ catFilters: cur.includes(key) ? cur.filter((x) => x !== key) : cur.concat(key) }, RESET));
  };
  app.clearCatFilters = () => app.setState(Object.assign({ catFilters: [] }, RESET));
  // ล้างทั้งคำค้นและตัวกรองในทีเดียว — คนที่ทั้งค้นทั้งกรองไม่ต้องไล่กดสองที่
  app.clearCatAll = () => app.setState(Object.assign({ catFilters: [], catSearch: '' }, RESET));

  // กดหัวคอลัมน์เพื่อเรียง · กดซ้ำสลับขึ้น/ลง
  app.toggleCatSort = (key) => {
    const s = app.state.catSort;
    app.setState(Object.assign({ catSort: s && s.key === key ? { key: key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: key, dir: 'asc' } }, RESET));
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
      const res = await app.fetchT('/api/catalog', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      const savedId = isNew ? (data.id || null) : d.id;
      const oldPrice = Number((app.state.catEditOrig || {}).unit_price || 0);
      const newPrice = Number(d.unit_price || 0);

      app.setState({ catEdit: null, catEditOrig: null, catConfirmClose: false, catBusy: false });
      app.toast(isNew ? 'เพิ่มยาแล้ว' : 'บันทึกแล้ว', '', true);
      // โหลดใหม่ทั้งสองชุด — ตารางคลังยา และรายการยาที่ช่องค้นหาใช้
      await app.loadCatalog(true);
      await app.syncDrugs(true);

      // ── ราคาเปลี่ยน → ถามว่าจะแก้รายการเก่าย้อนหลังไหม ────────────────────
      // ไม่แก้ให้เองเงียบ ๆ เด็ดขาด เพราะราคาที่แช่ไว้อาจถูกต้องแล้วก็ได้
      // (ยาขึ้นราคากลางปี = ของเก่าต้องคงราคาเดิมไว้)
      // ระบบแค่บอกว่า "มีของเก่าที่ใช้ราคาอื่นอยู่ N รายการ" แล้วให้คนตัดสิน
      if (!isNew && savedId && newPrice !== oldPrice) {
        app.checkPriceFix(savedId, newPrice);
      }
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
      const res = await app.fetchT('/api/catalog', {
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
      const res = await app.fetchT('/api/catalog/audit?id=' + drug.id);
      const data = await res.json();
      app.setState({ catLog: { drug: drug, rows: res.ok && Array.isArray(data.rows) ? data.rows : [] } });
    } catch (e) {
      app.setState({ catLog: { drug: drug, rows: [] } });
    }
  };
  app.closeCatLog = () => app.setState({ catLog: null });

  // ═══ แก้ราคาย้อนหลัง (พี่กันสั่ง 25 ส.ค. 2569) ═══════════════════════════
  //
  // ที่มา: MTV tab ถูกใส่ราคา 20 บาท (เอาราคายาน้ำทั้งขวดมาใส่เป็นราคาต่อเม็ด)
  // บันทึกไปแล้ว 30 เม็ด = 600 บาท ทั้งที่ควรเป็น 15 บาท
  // ยอดรวมทั้งปีเพี้ยนไป 8.8% จากแถวเดียว และเดิมไม่มีทางแก้เลย
  //
  // 🚨 กฎแช่ราคายังอยู่ — นี่คือประตูเดียวที่มีกุญแจและมีสมุดลงชื่อ
  //    ใช้เฉพาะ "ราคาผิดตั้งแต่ต้น" ไม่ใช่ "ราคาที่เปลี่ยนตามเวลา"

  // ถามฐานก่อนว่ากระทบกี่รายการ ยังไม่แก้อะไรทั้งสิ้น
  app.checkPriceFix = async (drugId, newPrice) => {
    try {
      const res = await app.fetchT('/api/price-fix?drugId=' + drugId + '&price=' + encodeURIComponent(newPrice));
      const data = await res.json();
      if (!res.ok || !Number(data.rows || 0)) return;   // ไม่มีของเก่าที่ต่างราคา = จบ ไม่ต้องกวนใจ
      const drug = (app.state.catalog || []).find((x) => x.id === drugId) || {};
      app.setState({
        priceFix: {
          drugId: drugId,
          drugName: drug.generic || ('ยา #' + drugId),
          newPrice: Number(newPrice),
          rows: Number(data.rows || 0),
          qty: Number(data.qty || 0),
          valueBefore: Number(data.valueBefore || 0),
          valueAfter: Number(data.valueAfter || 0),
          firstDate: data.firstDate || '',
          lastDate: data.lastDate || '',
          lots: Array.isArray(data.lots) ? data.lots : [],
          who: '',
          reason: '',
          busy: false
        }
      });
    } catch (e) {
      // ถามไม่สำเร็จก็ไม่เป็นไร ราคาในคลังบันทึกไปแล้ว แค่ไม่ได้ถามเรื่องของเก่า
    }
  };

  app.closePriceFix = () => app.setState({ priceFix: null });
  app.setPriceFixWho = (v) => app.setState({ priceFix: Object.assign({}, app.state.priceFix, { who: v }) });
  app.setPriceFixReason = (v) => app.setState({ priceFix: Object.assign({}, app.state.priceFix, { reason: String(v).slice(0, 300) }) });

  app.doPriceFix = async () => {
    const p = app.state.priceFix;
    // 🚨 ต้องมีทั้งชื่อคนแก้และเหตุผล ไม่งั้นตอบผู้ตรวจไม่ได้ว่าใครเปลี่ยนตัวเลขและทำไม
    if (!p || p.busy || !p.who || !String(p.reason || '').trim()) return;
    app.setState({ priceFix: Object.assign({}, p, { busy: true }) });
    try {
      const res = await app.fetchT('/api/price-fix', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ drugId: p.drugId, price: p.newPrice, by: p.who, reason: p.reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'แก้ไม่สำเร็จ');
      app.setState({ priceFix: null });
      app.toast('แก้ราคาย้อนหลัง ' + Number(data.rows || 0) + ' รายการแล้ว', money(Number(data.valueAfter || 0)), true);
      // ตัวเลขสรุปกับประวัติเปลี่ยนไปแล้ว ต้องล้างแคชไม่งั้นเห็นของเก่าค้าง 60 วินาที
      app.invalidate();
    } catch (e) {
      app.setState({ priceFix: Object.assign({}, app.state.priceFix, { busy: false }) });
      app.toast(String(e.message || 'แก้ไม่สำเร็จ'), '', false);
    }
  };
}
