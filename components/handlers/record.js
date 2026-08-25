// หน้าบันทึก — เพิ่มยาเข้ารายการ · ป๊อปอัปใส่จำนวน · ส่งขึ้นฐานข้อมูล
// คัดจากมอคอัป (บรรทัด 912–1051) ตัดสวิตช์จำลองเน็ตหลุดกับ resetDemo ออก
import { money } from '@/lib/format';
import { newUuid, fetchT, qtyNum } from '../helpers';

const sumReuse = (rows) => rows.reduce((a, r) => a + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// จำนวนที่รับได้ — เพดานต้องตรงกับฝั่งเซิร์ฟเวอร์ ไม่งั้นกดบันทึกแล้วโดนตีกลับ
// โดยที่ผู้ใช้ไม่รู้ว่าผิดตรงไหน
const clampQty = (raw) => qtyNum(raw);

export function recordActions(app) {
  // ยาที่ยังไม่ใส่ราคา — บันทึกได้ตามปกติ (พี่กันสั่งเปลี่ยน 19 ส.ค. 2569)
  //
  // เดิมกันไม่ให้บันทึกเลย เพราะราคาถูกแช่ไว้ในแถวตอนบันทึก บันทึกตอนราคา 0
  // แถวนั้นจะมูลค่า 0 ค้างอยู่ · แต่ห้องยาจะเริ่มใช้จริงทั้งที่ยังใส่ราคาไม่ครบ
  // (เหลือ 149 ตัวรอกดเลือก) การกั้นไว้เลยกลายเป็นบันทึกงานประจำวันไม่ได้
  //
  // ตอนนี้เปลี่ยนเป็น: บันทึกไปก่อน แล้วพอใส่ราคาในหน้าตั้งราคายา
  // ระบบจะ "ตีราคาย้อนหลัง" ให้แถวเก่าที่มูลค่ายังเป็น 0 เองอัตโนมัติ
  // (ดู savePrices ใน handlers/prices.js ที่ส่ง backfill: true)
  // ยังโชว์ป้าย "ยังไม่ใส่ราคา" ในผลค้นหาและในรายการอยู่ ให้เห็นว่าตัวไหนยังรอ
  app.blockNoPrice = () => false;

  app.addRow = (drug, qty, disp) => {
    const row = {
      rid: Date.now() + Math.random(),
      drugId: drug.id, name: drug.name, unit: drug.unit,
      price: drug.price, qty: qty, disposition: disp,
      // แปะ HN กับแหล่งที่มา ณ ตอนกดเพิ่มลงในแถวเลย
      // ถ้าใช้ค่าของทั้งหน้าจอตอนกดบันทึก คนไข้คนที่ 2 จะทับ HN ของคนแรกทั้งล็อต
      hn: app.state.hn || '', source: app.state.source
    };
    const rows = app.state.rows.concat([row]);
    app.persist({ rows: rows, saveFailed: false });
    app.animateTo(sumReuse(rows));
    app.toast('เพิ่ม ' + drug.name, (disp === 'reuse' ? '+' : '−') + money(drug.price * qty));
    return rows;
  };

  // ── ลบยาออกจากรายการในครั้งนี้ ────────────────────────────────────────────
  // ต้องยืนยันก่อน 1 ชั้น (พี่กันสั่ง 10 ส.ค. 2569 — "กดลบง่ายไป เผลอได้")
  // ปุ่ม ✕ อยู่ท้ายแถวติดกับปุ่มใช้ต่อ/ทำลาย นิ้วเลื่อนนิดเดียวก็โดน
  // และยาที่กรอกค้างไว้ยังไม่ได้บันทึกลงระบบ ลบแล้วไม่มีถังขยะให้กู้
  app.askRemoveRow = (row) => {
    app.setState({
      confirm: {
        title: 'ยืนยันลบรายการนี้',
        detail: row.name + ' · ' + row.qty + ' ' + row.unit + ' · ' + money(row.price * row.qty),
        note: 'ยาตัวนี้จะหายจากรายการในครั้งนี้ · ยังไม่ได้บันทึกลงระบบจึงกู้คืนไม่ได้',
        okLabel: 'ยืนยันลบ',
        run: () => app.removeRow(row.rid)
      }
    });
  };

  app.removeRow = (rid) => {
    const rows = app.state.rows.filter((x) => x.rid !== rid);
    app.persist({ rows: rows });
    app.animateTo(sumReuse(rows));
  };

  // ── ล้างรายการทั้งหมดในครั้งนี้ ────────────────────────────────────────────
  // เดิมต้องกด ✕ ทีละแถว · กรอกผิดคนไข้ทั้งล็อตแล้วต้องกด 20 ครั้ง
  // 🚨 พี่กันสั่งว่าต้องมีป๊อปอัปยืนยันอีกชั้น "เผื่อหลง" — ลบทีเดียวหมด ไม่มีถังขยะให้กู้
  //    จึงบอกให้ชัดว่ากำลังจะเสียอะไรไป: กี่รายการ · มูลค่ารวมเท่าไหร่
  app.askClearAll = () => {
    const rows = app.state.rows;
    if (!rows.length) return;
    const reuse = sumReuse(rows);
    const all = rows.reduce((a, x) => a + x.price * x.qty, 0);
    app.setState({
      confirm: {
        title: 'ยืนยันล้างรายการทั้งหมด',
        detail: rows.length + ' รายการ · มูลค่ารวม ' + money(all) + (reuse !== all ? ' (ใช้ต่อได้ ' + money(reuse) + ')' : ''),
        note: 'รายการทั้งหมดในครั้งนี้จะหายไป · ยังไม่ได้บันทึกลงระบบจึงกู้คืนไม่ได้',
        okLabel: 'ยืนยันล้างทั้งหมด',
        run: () => app.clearAll()
      }
    });
  };

  app.clearAll = () => {
    app.persist({ rows: [] });
    app.animateTo(0);
    app.toast('ล้างรายการทั้งหมดแล้ว', '');
  };

  app.addInline = () => {
    const d = app.state.pending;
    const qty = clampQty(app.state.qtyInput);
    if (d && app.blockNoPrice(d)) return;
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

  // ปุ่ม ✕ ในช่องค้นหา — กดทีเดียวล้างทั้งช่อง ไม่ต้องกด Backspace รัว
  // ล้างยาที่เลือกค้างไว้ด้วย ไม่งั้นจะเหลือยารอเพิ่มทั้งที่ช่องค้นหาว่าง ซึ่งงง
  app.clearQuery = () => {
    app.setState({ query: '', hi: 0, pending: null, qtyInput: '', pendingDisp: 'reuse' }, () => {
      if (app.searchRef.current) app.searchRef.current.focus();
    });
  };

  // กดหัวคอลัมน์ครั้งแรก = มากไปน้อย · กดซ้ำ = สลับทิศ · กดคอลัมน์อื่น = เริ่มใหม่
  app.setRowSort = (key) => {
    if (app.state.rowSortKey === key) {
      app.setState({ rowSortDir: app.state.rowSortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      app.setState({ rowSortKey: key, rowSortDir: 'desc' });
    }
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
      sheetReason: '',
      query: ''
    }, () => { if (app.sheetQtyRef.current) app.sheetQtyRef.current.focus(); });
  };

  app.closeSheet = () => app.setState({ sheet: null, sheetQty: '', sheetReason: '', sheetOff: null });

  // ยานอกบัญชีโรงพยาบาล — คนไข้เอายาจาก รพ.อื่น/คลินิกมาคืน
  // (เจอบ่อยตอนเยี่ยมบ้านและตอนคนไข้เสียชีวิต) เดิมค้นไม่เจอแล้วจบ ไม่มีทางไปต่อ
  // มูลค่าก้อนนั้นหายจาก KPI ทั้งหมด
  app.openOffListDrug = () => {
    const name = (app.state.query || '').trim().slice(0, 160);
    app.setState({
      sheet: { drug: { id: null, name: name || 'ยาอื่น', unit: 'หน่วย', price: 0 }, kind: 'add', id: null },
      sheetOff: { name: name, unit: 'หน่วย', price: '' },
      sheetQty: '',
      sheetDisp: 'reuse',
      sheetReason: '',
      query: ''
    });
  };

  app.onOffField = (key) => (e) => {
    const off = Object.assign({}, app.state.sheetOff || {});
    off[key] = key === 'price' ? e.target.value.replace(/[^0-9.]/g, '').slice(0, 12) : e.target.value.slice(0, 160);
    const drug = Object.assign({}, app.state.sheet.drug, {
      name: (off.name || '').trim() || 'ยาอื่น',
      unit: (off.unit || '').trim() || 'หน่วย',
      price: Math.max(0, Math.round((parseFloat(off.price || '0') || 0) * 10000) / 10000)
    });
    app.setState({ sheetOff: off, sheet: Object.assign({}, app.state.sheet, { drug: drug }) });
  };

  app.confirmSheet = () => {
    const s = app.state.sheet;
    const qty = clampQty(app.state.sheetQty);
    if (!s || !qty) return;

    if (s.kind === 'add') {
      if (app.blockNoPrice(s.drug)) return;
      const row = {
        rid: Date.now() + Math.random(),
        drugId: s.drug.id, name: s.drug.name, unit: s.drug.unit,
        price: s.drug.price, qty: qty, disposition: app.state.sheetDisp,
        reason: app.state.sheetDisp === 'destroy' ? app.state.sheetReason : '',
        hn: app.state.hn || '', source: app.state.source
      };
      const rows = app.state.rows.concat([row]);
      app.persist({ rows: rows, sheet: null, sheetQty: '', sheetReason: '', sheetOff: null, saveFailed: false });
      app.animateTo(sumReuse(rows));
      app.toast('เพิ่ม ' + s.drug.name, (app.state.sheetDisp === 'reuse' ? '+' : '−') + money(s.drug.price * qty));
      if (app.searchRef.current) app.searchRef.current.focus();
    } else if (s.kind === 'row') {
      const rows = app.state.rows.map((r) =>
        r.rid === s.id ? Object.assign({}, r, { qty: qty, disposition: app.state.sheetDisp, reason: app.state.sheetDisp === 'destroy' ? app.state.sheetReason : '' }) : r);
      app.persist({ rows: rows, sheet: null, sheetQty: '', sheetReason: '' });
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
  // ── ผู้บันทึกล็อต ──────────────────────────────────────────────────────────
  // อยู่ในแผงข้างถัดจากวันที่/HN — เลือกครั้งเดียวค้างไว้ทั้งเวร ไม่มีป๊อปอัปกวน
  // เมนูวางแบบ fixed (ลอยเหนือทุกอย่าง) ไม่ใช่ absolute ในแผง
  // เพราะแผงข้างมีขอบของตัวเอง เมนูที่สูงกว่าที่ว่างจะโดนตัดหัวหาย
  // จนไม่เห็นกรอบด้านบน ดูเหมือนของค้างครึ่งท่อน (พี่กันเจอกับตา)
  //
  // วิธี: วัดที่ว่างเหนือ/ใต้ช่องก่อน แล้วเลือกฝั่งที่ว่างกว่า
  //       จากนั้นย่อความสูงเมนูให้พอดีกับที่ว่างจริง (กรอบครบทั้ง 4 ด้านเสมอ)
  app.toggleRecorderMenu = (e) => {
    if (app.state.recorderMenuOpen) { app.closeRecorderMenu(); return; }

    let box = null;
    try {
      const r = e && e.currentTarget && e.currentTarget.getBoundingClientRect();
      if (r) {
        const GAP = 6;      // ระยะห่างระหว่างช่องกับเมนู
        const EDGE = 12;    // เว้นขอบจอ
        const above = r.top - GAP - EDGE;
        const below = window.innerHeight - r.bottom - GAP - EDGE;
        const up = above > below;
        box = {
          left: Math.round(r.left),
          width: Math.round(r.width),
          top: Math.round(r.bottom + GAP),
          bottom: Math.round(window.innerHeight - r.top + GAP),
          up: up,
          // สูงได้ไม่เกินที่ว่างจริง และไม่เกิน 300px (เท่า ME-DRP)
          maxH: Math.max(140, Math.min(300, Math.round(up ? above : below)))
        };
      }
    } catch (err) { /* วัดไม่ได้ก็ปล่อยให้เมนูใช้ค่าเริ่มต้น */ }

    app.setState({ recorderMenuOpen: true, recorderBox: box, recorderNew: '', addingRecorder: false });
  };

  app.closeRecorderMenu = () => app.setState({ recorderMenuOpen: false, recorderBox: null, recorderNew: '', addingRecorder: false });

  app.startAddRecorder = () => app.setState({ addingRecorder: true, recorderNew: '' });

  app.pickRecorder = (name) => {
    app.setState({ recorder: name, recorderMenuOpen: false, recorderNew: '', addingRecorder: false });
    app.pushSetting({ lastRecorder: name });
  };

  app.onRecorderNew = (e) => app.setState({ recorderNew: e.target.value });

  // พิมพ์ชื่อใหม่แล้วกดเพิ่ม → เก็บเข้ารายชื่อถาวร ครั้งหน้ามีให้เลือกเลย
  app.addRecorder = () => {
    const name = (app.state.recorderNew || '').trim().slice(0, 80);
    if (!name) return;
    const staff = app.state.staff.indexOf(name) < 0 ? app.state.staff.concat([name]) : app.state.staff;
    app.setState({ staff: staff, recorder: name, recorderMenuOpen: false, recorderNew: '', addingRecorder: false });
    app.pushSetting({ staff: staff, lastRecorder: name });
  };

  app.save = async () => {
    const st = app.state;
    // ยามในหน่วยความจำ ไม่ต้องรอ setState — กันกดรัวสองครั้งแล้วได้ batchId คนละตัว
    // ซึ่งจะทำให้ระบบกันบันทึกซ้ำใช้ไม่ได้ แล้วข้อมูลเข้าฐานสองชุด
    if (!st.rows.length || st.saving || app._saving) return;
    // 🚨 โหมดตัวอย่างห้ามบันทึกเด็ดขาด กันข้อมูลปลอมหลุดเข้าฐานจริง
    if (st.demo) { app.toast('อยู่ในโหมดดูตัวอย่าง บันทึกไม่ได้', 'ปิดโหมดก่อน', false); return; }

    if (!ISO.test(st.date || '')) {
      app.toast('เลือกวันที่ก่อนบันทึก', '', false);
      return;
    }
    // ต้องมีชื่อผู้บันทึกเสมอ — ช่องอยู่ในแผงข้างถัดจากวันที่
    if (!(st.recorder || '').trim()) {
      app.toast('เลือกชื่อผู้บันทึกก่อน', '', false);
      app.setState({ recorderMenuOpen: true, showMore: true });
      return;
    }

    app._saving = true;
    const batchId = st.batchId || newUuid();
    const sending = st.rows;                       // ล็อกชุดที่จะส่งไว้ตรงนี้
    const n = sending.length;
    const saved = app.savedTotal();

    app.persist({ saving: true, saveFailed: false, saveError: '', batchId: batchId });

    try {
      const res = await fetchT('/api/returns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          batchId: batchId,
          date: st.date,
          source: st.source,
          hn: st.hn,
          recordedBy: st.recorder,
          items: sending.map((r) => ({
            clientRid: String(r.rid),
            drugId: r.drugId,
            // ยานอกบัญชี รพ. ไม่มีรหัสยา ต้องส่งชื่อ/หน่วย/ราคาที่พิมพ์เองไปแทน
            name: r.drugId ? '' : r.name,
            unit: r.drugId ? '' : r.unit,
            price: r.drugId ? 0 : r.price,
            qty: r.qty,
            disposition: r.disposition,
            reason: r.reason || '',
            // HN กับแหล่งที่มาติดไปกับแถวตอนกดเพิ่ม — คนไข้ 2 คนในล็อตเดียวจะได้ไม่ปนกัน
            hn: r.hn || '',
            source: r.source || st.source
          }))
        })
      }, 20000);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 400 = ข้อมูลไม่ผ่านการตรวจ กดลองส่งใหม่กี่ครั้งก็ไม่ผ่าน ต้องบอกสาเหตุจริง
        // แยกจาก "ส่งไม่ถึงเซิร์ฟเวอร์" ที่กดลองใหม่แล้วช่วยได้
        if (res.status >= 400 && res.status < 500) {
          app.setState({ saving: false, saveFailed: false });
          app.toast(data.error || 'ข้อมูลไม่ถูกต้อง แก้แล้วลองใหม่', '', false);
          return;
        }
        throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      }

      // 🚨 หักเฉพาะแถวที่ส่งไปแล้ว ห้ามล้างทั้งกระดาน
      // ระหว่างรอเซิร์ฟเวอร์ตอบ (เน็ตโรงพยาบาลช้า 2-3 วิ) เภสัชกรพิมพ์ยาเพิ่มได้
      // ถ้าล้างทั้งก้อน ยาตัวที่เพิ่งเพิ่มจะหายเงียบโดยไม่มีใครรู้
      const sentRid = new Set(sending.map((r) => String(r.rid)));
      const left = app.state.rows.filter((r) => !sentRid.has(String(r.rid)));

      app.persist({
        rows: left,
        saveFailed: false,
        saveError: '',
        hn: left.length ? app.state.hn : '',
        // วันที่ต้องเด้งกลับเป็นวันนี้เสมอหลังบันทึก ไม่งั้นคนที่ย้อนวันไปกรอกของค้าง
        // แล้วลืมกดกลับ จะบันทึกของวันนี้ลงวันเมื่อวานทั้งวัน
        date: left.length ? app.state.date : (app.state.today || st.date),
        batchId: null,
        saving: false,
        lastLot: data.lot || '',
        fy: data.fy || st.fy
      });
      app.invalidate();
      app.animateTo(sumReuse(left));

      // เซิร์ฟเวอร์บอกจำนวนที่เข้าฐานจริง ถ้าน้อยกว่าที่ส่งแปลว่าบางแถวเคยบันทึกไปแล้ว
      // (กดลองส่งใหม่หลังเน็ตหลุด) ต้องบอกตรงๆ ไม่ใช่บอกว่าบันทึกครบ
      const got = typeof data.saved === 'number' ? data.saved : n;
      const lotTag = data.lot ? ' · Lot ' + data.lot : '';
      if (got < n) {
        app.toast('บันทึก ' + got + ' รายการ · อีก ' + (n - got) + ' รายการเคยบันทึกไปแล้ว', '', false);
      } else {
        app.toast('บันทึก ' + n + ' รายการแล้ว' + lotTag, money(saved));
      }
    } catch (e) {
      const msg = (e && e.message) || '';
      app.setState({ saving: false, saveFailed: true, saveError: msg });
      app.toast(msg || 'ส่งไม่สำเร็จ กดลองส่งใหม่ได้', '', false);
    } finally {
      app._saving = false;
    }
  };
}
