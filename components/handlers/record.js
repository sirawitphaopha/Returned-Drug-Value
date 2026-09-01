// หน้าบันทึก — เพิ่มยาเข้ารายการ · ป๊อปอัปใส่จำนวน · ส่งขึ้นฐานข้อมูล
// คัดจากมอคอัป (บรรทัด 912–1051) ตัดสวิตช์จำลองเน็ตหลุดกับ resetDemo ออก
import { money, thaiDate, SOURCES } from '@/lib/format';
import { newUuid, fetchT, qtyNum, evalQty, cleanQtyExpr, qtyText, readLS, clearLS } from '../helpers';

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
  // ── ล็อตที่กรอกค้างไว้ในหน้าต่างที่ปิดไปแล้ว (พี่กันสั่ง 31 ส.ค. 2569) ──────
  //
  // 🚨 ต้องมีของในมือแล้วห้ามดึงมาทับ — ยาที่กำลังกรอกอยู่สำคัญกว่าของเก่าเสมอ
  //    ถ้ามีของอยู่แล้วให้บอกไปตรง ๆ ว่าต้องเคลียร์ของในมือก่อน
  app.takeParked = (id) => {
    const box = app.state.parked.find((x) => x.id === id);
    if (!box) return;

    if (app.state.rows.length) {
      app.toast('หน้าต่างนี้มีรายการค้างอยู่แล้ว', 'บันทึกหรือล้างของในมือก่อน แล้วค่อยเอาล็อตนี้กลับมา', false);
      return;
    }

    const v = readLS(box.key);
    const rows = v && Array.isArray(v.rows)
      ? v.rows.filter((r) => r && r.rid != null && typeof r.price === 'number' && typeof r.qty === 'number')
      : [];
    if (!rows.length) {
      clearLS(box.key);
      app.setState({ parked: app.state.parked.filter((x) => x.id !== id) });
      app.toast('ล็อตนี้ไม่มีรายการเหลือแล้ว', '', false);
      return;
    }

    // 🚨 ย้ายมาเป็นของหน้าต่างนี้แล้วต้องลบต้นทางทิ้ง ไม่งั้นหน้าต่างที่สาม
    //    ที่เปิดขึ้นมาทีหลังจะเห็นล็อตเดียวกันอีก แล้วกดเอากลับมาได้อีกคน
    clearLS(box.key);
    // 🚨 ปิดหน้าต่างล็อตค้างด้วย ไม่งั้นเอาของมาแล้วหน้าต่างยังค้างอยู่
    //    เห็นล็อตที่เพิ่งหยิบไปแล้วในรายการ (พี่กันเจอ 1 ก.ย. 2569)
    app.setState({ showOtherDrafts: false, parked: app.state.parked.filter((x) => x.id !== id) }, () => {
      app.persist({
        rows: rows,
        batchId: v.batchId || null,
        hn: typeof v.hn === 'string' ? v.hn : '',
        source: typeof v.source === 'string' ? v.source : app.state.source,
        sourceTouched: !!v.sourceTouched,
        pcuSite: typeof v.pcuSite === 'string' ? v.pcuSite : '',
        date: typeof v.date === 'string' && v.date ? v.date : app.state.date
      });
      app.animateTo(rows.reduce((a, r) => a + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0));
      app.toast('เอาล็อตที่กรอกค้างไว้กลับมาแล้ว', rows.length + ' รายการ');
    });
  };

  // ทิ้งล็อตที่ค้าง — ผ่านหน้าต่างยืนยันเสมอ เพราะย้อนกลับไม่ได้
  app.askDropParked = (id) => {
    const box = app.state.parked.find((x) => x.id === id);
    if (!box) return;
    app.setState({
      confirm: {
        title: 'ทิ้งล็อตที่กรอกค้างไว้',
        detail: 'ล็อตนี้มี ' + box.count + ' รายการ มูลค่า ' + money(box.value) +
          ' บาท · ทิ้งแล้วเอากลับมาไม่ได้อีก',
        okLabel: 'ทิ้งทั้งล็อต',
        run: () => {
          clearLS(box.key);
          app.setState({ parked: app.state.parked.filter((x) => x.id !== id) });
          app.toast('ทิ้งล็อตที่กรอกค้างไว้แล้ว', '', false);
        }
      }
    });
  };

  // ── ร่างที่เก็บไว้บนเซิร์ฟเวอร์ (พี่กันสั่ง 31 ส.ค. 2569) ────────────────────
  //
  // 🚨 เอามาทำต่อแล้วต้องย้ายเจ้าของทันที ลบของต้นทางทิ้ง
  //    ไม่งั้นเครื่องเดิมกับเครื่องนี้จะมีของชุดเดียวกัน แล้วกดบันทึกทั้งคู่
  //    = ยาชุดเดียวเข้าฐานสองรอบ มูลค่านับซ้ำ (ปัญหาเดิมที่เพิ่งแก้ไป)
  app.takeServerDraft = async (deviceId, tabId) => {
    const box = (app.state.serverDrafts || []).find(
      (d) => d.device_id === deviceId && d.tab_id === tabId
    );
    if (!box) return;

    if (app.state.rows.length) {
      app.toast('หน้าต่างนี้มีรายการค้างอยู่แล้ว', 'บันทึกหรือล้างของในมือก่อน แล้วค่อยเอาล็อตนี้มาทำต่อ', false);
      return;
    }

    const rows = (Array.isArray(box.rows) ? box.rows : []).filter(
      (r) => r && r.rid != null && typeof r.price === 'number' && typeof r.qty === 'number'
    );
    if (!rows.length) {
      await app.dropServerDraft(deviceId, tabId);
      app.loadServerDrafts();
      app.toast('ล็อตนี้ไม่มีรายการเหลือแล้ว', '', false);
      return;
    }

    await app.dropServerDraft(deviceId, tabId);
    app.setState({
      showOtherDrafts: false,
      serverDrafts: (app.state.serverDrafts || []).filter(
        (d) => !(d.device_id === deviceId && d.tab_id === tabId)
      )
    }, () => {
      app.persist({
        rows: rows,
        batchId: box.batch_id || null,
        hn: typeof box.hn === 'string' ? box.hn : '',
        source: typeof box.source === 'string' && box.source ? box.source : app.state.source,
        sourceTouched: !!box.source,
        pcuSite: typeof box.pcu_site === 'string' ? box.pcu_site : '',
        date: typeof box.return_date === 'string' && box.return_date ? box.return_date : app.state.date,
        // ล็อตที่ส่งไม่สำเร็จ ต้องรู้ตัวต่อว่ายังค้างอยู่ พร้อมชื่อคนที่เซ็นไว้
        saveFailed: !!box.save_failed,
        failedBy: typeof box.failed_by === 'string' ? box.failed_by : ''
      });
      app.animateTo(rows.reduce((a, r) => a + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0));
      const from = deviceId === app.state.deviceId ? '' : ' จาก ' + deviceId;
      app.toast('เอาล็อตที่กรอกค้างไว้มาทำต่อแล้ว' + from, rows.length + ' รายการ');
    });
  };

  // ทิ้งร่างบนเซิร์ฟเวอร์ — ผ่านหน้าต่างยืนยันเสมอ เพราะย้อนกลับไม่ได้
  app.askDropServerDraft = (deviceId, tabId) => {
    const box = (app.state.serverDrafts || []).find(
      (d) => d.device_id === deviceId && d.tab_id === tabId
    );
    if (!box) return;
    const rows = Array.isArray(box.rows) ? box.rows : [];
    const value = rows.reduce((a, r) => a + (r && r.disposition === 'reuse' ? (r.price || 0) * (r.qty || 0) : 0), 0);
    app.setState({
      confirm: {
        title: 'ทิ้งล็อตที่กรอกค้างไว้',
        detail: deviceId + ' · ' + (box.items || rows.length) + ' รายการ · ' + money(value),
        note: 'ทิ้งแล้วเอากลับมาไม่ได้อีก',
        okLabel: 'ทิ้งทั้งล็อต',
        run: async () => {
          await app.dropServerDraft(deviceId, tabId);
          app.setState({
            serverDrafts: (app.state.serverDrafts || []).filter(
              (d) => !(d.device_id === deviceId && d.tab_id === tabId)
            )
          });
          app.toast('ทิ้งล็อตที่กรอกค้างไว้แล้ว', '', false);
        }
      }
    });
  };

  // เปิด/ปิดรายการร่างจากเครื่องอื่น — ต้องกดเองเท่านั้น ไม่โผล่มาเอง
  // เปิด/ปิดหน้าต่างรายการล็อตค้าง — ต้องกดเองเท่านั้น ไม่โผล่มาเอง
  // ปิดทีไรล้างล็อตที่กางดูไว้ด้วย เปิดใหม่จะได้เริ่มจากหุบทั้งหมด
  app.toggleOtherDrafts = () => app.setState({
    showOtherDrafts: !app.state.showOtherDrafts,
    parkedSeen: ''
  });

  // กางดูยาในล็อตไหน — ทีละล็อตเท่านั้น กางหลายอันพร้อมกันแล้วเลื่อนหายาก
  app.seeParked = (key) => app.setState({ parkedSeen: key || '' });

  app.blockNoPrice = () => false;

  app.addRow = (drug, qty, disp) => {
    const row = {
      rid: Date.now() + Math.random(),
      drugId: drug.id, name: drug.name, unit: drug.unit,
      price: drug.price, qty: qty, disposition: disp,
      // เหตุผลที่เลือกไว้ตอนกดปุ่มทำลาย ติดไปกับแถวทันที (ผลตรวจข้อ ส-8)
      reason: disp === 'destroy' ? (app.state.pendingReason || '') : '',
      // แปะ HN กับแหล่งที่มา ณ ตอนกดเพิ่มลงในแถวเลย
      // ถ้าใช้ค่าของทั้งหน้าจอตอนกดบันทึก คนไข้คนที่ 2 จะทับ HN ของคนแรกทั้งล็อต
      hn: app.state.hn || '', source: app.state.source,
      pcuSite: app.state.source === 'pcu' ? (app.state.pcuSite || '') : ''
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
    // 🚨 ต้องล้างเลขก้อนการบันทึกด้วย ไม่ใช่แค่ล้างแถว (ผลตรวจข้อ ส-6)
    //
    //    เลขก้อนถูกใช้กันบันทึกซ้ำตอนกดลองส่งใหม่ ถ้าไม่ล้าง:
    //    กดบันทึกแล้วเน็ตสะดุด (ข้อมูลเข้าฐานแล้วแต่คำตอบหายกลางทาง)
    //    → เภสัชกรไม่กดลองใหม่ แต่กดล้างทั้งหมดแล้วรับคนไข้รายถัดไป
    //    → กรอกชุดใหม่ กดบันทึก → ฐานเห็นก้อนเดิม เลยใช้เลข Lot เดิมของคนไข้รายก่อน
    //    → ใบสรุปพิมพ์รวมสองรอบเป็นก้อนเดียว สืบกลับผิดคน
    app.persist({ rows: [], batchId: null, saveFailed: false, saveError: '', failedBy: '', result: null });
    app.animateTo(0);
    app.toast('ล้างรายการทั้งหมดแล้ว', '');
  };

  app.addInline = () => {
    const d = app.state.pending;
    // 🚨 ต้องใช้ evalQty ไม่ใช่ clampQty — ช่องนี้พิมพ์สูตรได้แล้ว (25+25)
    //    clampQty ใช้ parseFloat ซึ่งอ่าน "25+25" ได้แค่ 25 แล้วทิ้งที่เหลือเงียบ ๆ
    //    = บันทึกไปครึ่งเดียวโดยไม่มีใครรู้ (ฝั่งป๊อปมือถือยังใช้ clampQty เหมือนเดิม)
    const qty = evalQty(app.state.qtyInput);
    if (d && app.blockNoPrice(d)) return;
    if (!d || !qty) {
      if (!d && app.searchRef.current) app.searchRef.current.focus();
      else if (app.qtyRef.current) app.qtyRef.current.focus();
      return;
    }
    app.addRow(d, qty, app.state.pendingDisp);
    app.setState({ pending: null, qtyInput: '', query: '', pendingDisp: 'reuse', calcOpen: false }, () => {
      if (app.searchRef.current) app.searchRef.current.focus();
    });
  };

  // ── เครื่องคิดเลขในช่องจำนวน (เฉพาะคอม) ────────────────────────────────────
  // พี่กันสั่ง 25 ส.ค. 2569: "มีจุดที่กดแล้วมีเครื่องคิดเลขขึ้นมาด้วย"
  // แป้นนี้ไม่ได้คิดเลขเอง — มันแค่พิมพ์ตัวอักษรลงช่องจำนวนให้ แล้ว evalQty คิดให้ตอนกด Enter
  // ทำแบบนี้เพื่อให้ "พิมพ์เอง" กับ "กดแป้น" เดินทางเดียวกันเป๊ะ ไม่มีทางให้ผลต่างกัน
  app.toggleCalc = () => {
    const open = !app.state.calcOpen;
    app.setState({ calcOpen: open }, () => {
      if (open && app.qtyRef.current) app.qtyRef.current.focus();
    });
  };

  app.closeCalc = () => {
    if (app.state.calcOpen) app.setState({ calcOpen: false });
  };

  app.calcPress = (k) => {
    if (k === 'C') {
      app.setState({ qtyInput: '' }, () => { if (app.qtyRef.current) app.qtyRef.current.focus(); });
      return;
    }
    if (k === 'back') {
      app.setState({ qtyInput: String(app.state.qtyInput || '').slice(0, -1) },
        () => { if (app.qtyRef.current) app.qtyRef.current.focus(); });
      return;
    }
    app.setState({ qtyInput: cleanQtyExpr(String(app.state.qtyInput || '') + k) },
      () => { if (app.qtyRef.current) app.qtyRef.current.focus(); });
  };

  // ปุ่ม = ในแป้น — คิดผลลัพธ์ใส่กลับลงช่อง แต่ยังไม่เพิ่มรายการ
  // (เผื่อคิดเสร็จแล้วอยากคูณต่อ หรืออยากดูตัวเลขก่อนตัดสินใจ)
  app.calcEquals = () => {
    const n = evalQty(app.state.qtyInput);
    app.setState({ qtyInput: n > 0 ? String(n) : '' },
      () => { if (app.qtyRef.current) app.qtyRef.current.focus(); });
  };

  // ── Enter 2 จังหวะ เมื่อช่องเป็นสูตร (พี่กันสั่ง 25 ส.ค. 2569) ─────────────
  // "ตอนกด 25+25 ตอนเอนเทอร์แล้วจะได้ 50 ก่อน แล้วค่อยเอนเทอร์อีกครั้งเพื่อเพิ่ม"
  //
  // เหตุผล: การบวกกองยาเป็นจุดที่พลาดง่าย ถ้า Enter ทีเดียวเพิ่มเลย
  // ผู้ใช้จะไม่มีจังหวะได้เห็นว่าคิดออกมาเป็นเท่าไรก่อนของเข้ารายการ
  // จังหวะแรกจึงเป็นการ "เฉลย" ให้ดู จังหวะสองถึงยืนยัน
  //
  // 🚨 ใช้กติกาเดียวกันทั้งช่องเพิ่มรายการและช่องแก้จำนวนในตาราง
  //    ถ้าทำต่างกัน มือจะจำผิดสลับกันไปมา
  // ⚠️ เลขล้วน (ไม่มีเครื่องหมาย) ยังเป็น Enter ทีเดียวเหมือนเดิม ไม่มีอะไรให้เฉลย
  // 🚨 เก็บสูตรไว้ในช่องด้วย ต่อ "=ผลลัพธ์" ท้าย ไม่ใช่แทนที่ด้วยตัวเลขเปล่า
  //    "25+25=50" ตรวจย้อนได้ว่ามาจากการบวกอะไร ถ้าเหลือแค่ "50" จะไม่รู้ที่มา
  // กล่องกางดูสูตรเต็ม — เปิดเมื่อสูตรยาวเกินช่อง (พี่กันสั่ง)
  app.toggleQtyFull = () => app.setState({ qtyFull: !app.state.qtyFull });
  app.closeQtyFull = () => { if (app.state.qtyFull) app.setState({ qtyFull: false }); };

  app.resolveQty = () => {
    const n = evalQty(app.state.qtyInput);
    if (!n) return;
    app.setState({ qtyInput: String(app.state.qtyInput).split('=')[0] + '=' + n }, () => {
      const el = app.qtyRef.current;
      if (!el) return;
      el.focus();
      // 🚨 สูตรยาวกว่าช่อง ต้องดันมุมมองไปท้ายสุดเอง ไม่งั้นขีดกะพริบอยู่ท้าย
      //    แต่สายตาเห็นแค่ต้นสูตร แล้วนึกว่าระบบไม่ได้คิดให้ (พี่กันเจอเอง)
      const end = el.value.length;
      try { el.setSelectionRange(end, end); } catch (e) {}
      el.scrollLeft = el.scrollWidth;
    });
  };

  app.resolveEditQty = () => {
    const n = evalQty(app.state.editQtyText);
    if (!n) return;
    app.setState({ editQtyText: String(app.state.editQtyText).split('=')[0] + '=' + n });
  };

  // ── แก้จำนวนของแถวที่กองอยู่แล้ว (เฉพาะคอม) ───────────────────────────────
  // พี่กันสั่ง 25 ส.ค. 2569: "อยากให้มันกดเปลี่ยนจำนวนได้ในนี้เลย แม้ว่าจะกดเอนเทอร์ลงมาแล้ว"
  // เดิมต้องกดแถวเพื่อเปิดป๊อปอัป หรือลบทิ้งแล้วเพิ่มใหม่ ซึ่งช้าและเสี่ยงลบผิดแถว
  //
  // 🚨 แก้ได้เฉพาะ "จำนวน" เท่านั้น ห้ามแตะราคา — ราคาถูกแช่ไว้ในแถวตั้งแต่ตอนเลือกยา
  //    (แถวพวกนี้ยังไม่เข้าฐาน แต่ราคาที่ติดมาคือราคา ณ วันบันทึก ต้องคงไว้)
  app.startEditQty = (rid, qty) => {
    app.setState({ editQtyRid: rid, editQtyText: String(qty) });
  };

  app.changeEditQty = (text) => {
    app.setState({ editQtyText: cleanQtyExpr(text) });
  };

  // ยืนยันการแก้ — ช่องว่างหรือคิดได้ 0 ให้ถอยกลับไปใช้ค่าเดิม ไม่ลบแถวทิ้ง
  // (ลบแถวมีปุ่ม ✕ ที่มีป๊อปอัปยืนยันอยู่แล้ว การพิมพ์ 0 ไม่ควรกลายเป็นการลบ)
  app.commitEditQty = () => {
    const rid = app.state.editQtyRid;
    if (!rid) return;
    const n = evalQty(app.state.editQtyText);
    if (!n) { app.setState({ editQtyRid: null, editQtyText: '' }); return; }
    const rows = app.state.rows.map((x) => (x.rid === rid ? Object.assign({}, x, { qty: n }) : x));
    app.persist({ rows: rows });
    app.animateTo(sumReuse(rows));
    app.setState({ editQtyRid: null, editQtyText: '' });
  };

  app.cancelEditQty = () => {
    app.setState({ editQtyRid: null, editQtyText: '' });
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

  // ── เลือกเหตุผลที่ต้องทำลาย (ผลตรวจข้อ ส-8 · พี่กันเคาะแบบ ก 26 ส.ค. 2569) ──
  //
  // 🚨 เด้งถามทันทีที่กดปุ่มทำลาย ไม่ใช่ให้ไปกรอกทีหลัง
  //    เพราะ "ทีหลัง" แปลว่าไม่มีวันได้กรอก — เส้นทางหลักบนคอมไม่เคยมีช่องนี้เลย
  //
  // next = สิ่งที่จะทำเมื่อเลือกเหตุผลแล้ว · รับเหตุผลที่เลือกเป็นค่าเข้า
  // ปิดหน้าต่างโดยไม่เลือก = ไม่ทำอะไรเลย ของยังเป็น "ใช้ต่อได้" เหมือนเดิม
  app.askDestroyReason = (label, next) => {
    app.setState({ reasonAsk: { label: label || '', next: next } });
  };

  app.closeReasonPick = () => app.setState({ reasonAsk: null });

  app.pickDestroyReason = (reason) => {
    const ask = app.state.reasonAsk;
    if (!ask) return;
    // ปิดหน้าต่างก่อนแล้วค่อยทำงาน — กติกาเดียวกับป๊อปยืนยัน (ดูข้อ 3.23)
    // ถ้าปล่อยให้แต่ละที่ปิดเอง จะมีที่ที่ลืมปิดแล้วดูเหมือนปุ่มค้าง
    app.setState({ reasonAsk: null }, () => ask.next(reason));
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
        hn: app.state.hn || '', source: app.state.source,
        pcuSite: app.state.source === 'pcu' ? (app.state.pcuSite || '') : ''
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

  // ── รพ.สต. ต้นทาง — บังคับเลือกเมื่อรายชื่อถูกตั้งไว้แล้ว ──────────────────
  //
  // พี่กันสั่ง 29 ส.ค. 2569: "กฎบ้านั่นทำตอนยังไม่ใส่รายชื่อ รพ.สต. ไง
  //   ดังนั้น พอใส่แล้ว ต้องบังคับกรอก"
  //
  // เดิมไม่บังคับ เพราะตอนนั้นยังไม่ได้ตั้งรายชื่อ รพ.สต. ลงฐาน ถ้าบังคับไว้
  // ห้องยาจะบันทึกงานประจำวันไม่ได้เลย · ตอนนี้รายชื่อครบ 13 แห่งแล้ว เหตุผลนั้นหมดไป
  // และล็อตที่ไม่มีชื่อแห่งคือล็อตที่ตอบไม่ได้ว่ายาชุดนี้คืนมาจากที่ไหน
  //
  // 🚨 ยังปล่อยผ่านเมื่อรายชื่อว่างเปล่า — ไม่มีตัวเลือกให้กดแล้วยังบังคับ
  //    เท่ากับปิดประตูไม่ให้บันทึกอะไรได้เลย ซึ่งแย่กว่าข้อมูลที่ยังไม่ครบ
  //
  // 🚨 ตรวจแถวด้วย ไม่ใช่ตรวจแค่ปุ่มแหล่งที่มาที่เลือกค้างอยู่ตอนนี้
  //    แถวเก็บ source ไว้ตั้งแต่ตอนกดเพิ่ม (คนไข้ 2 คนในล็อตเดียวใช้คนละแหล่งได้)
  //    เพิ่มยาตอนเลือก รพ.สต. ไว้ แล้วสลับไป OPD ก่อนกดส่ง = แถวนั้นยังเป็น รพ.สต.
  //    ที่ไม่มีชื่อแห่งติดไปด้วย ซึ่งไม่มีอะไรจับได้เลยหลังเข้าฐานแล้ว
  app.pcuSiteMissing = () => {
    const st = app.state;
    const sites = Array.isArray(st.pcuSites) ? st.pcuSites : [];
    if (!sites.length) return false;
    // ชื่อระดับล็อต — ส่งไปเป็นค่าสำรองให้ทุกแถวที่ไม่มีชื่อของตัวเอง (ตรงกับ /api/returns)
    const lotSite = st.source === 'pcu' ? (st.pcuSite || '').trim() : '';
    if (st.source === 'pcu' && !lotSite) return true;
    return (st.rows || []).some((r) => {
      const src = r.source || st.source;
      if (src !== 'pcu') return false;
      return !((r.pcuSite || '').trim() || lotSite);
    });
  };

  // ── ป๊อปยืนยันก่อนส่งขึ้นระบบ ─────────────────────────────────────────────
  //
  // พี่กันสั่ง 25 ส.ค. 2569: "ตอนจะกดส่งข้อมูล เราอยากให้มันมีป๊อปอัปถามยืนยันอีกครั้ง
  // ว่าจะกดส่งจริงไหม แล้วก็มี แหล่งที่มา วันที่ ชื่อผู้บันทึก และรายละเอียดล็อตแบบคร่าว ๆ
  // แสดงให้ดูก่อน"
  //
  // เหตุผลที่ต้องมี: เลข Lot ออกตอนกดบันทึก แก้ทีหลังต้องเข้าหน้าแก้ไขล็อต
  // และชื่อผู้บันทึกคือหลักฐานว่าใครเซ็นรับล็อตนั้น กดผิดคนแล้วสืบกลับผิดคน
  //
  // 🚨 ตรวจช่องบังคับ "ก่อน" เปิดป๊อป — ไม่งั้นผู้ใช้กดยืนยันแล้วเพิ่งมาบอกว่ากรอกไม่ครบ
  //    เสียจังหวะและดูเหมือนปุ่มเสีย
  app.askSave = () => {
    const st = app.state;
    if (!st.rows.length || st.saving || app._saving) return;
    if (st.demo) { app.toast('อยู่ในโหมดดูตัวอย่าง บันทึกไม่ได้', 'ปิดโหมดก่อน', false); return; }
    if (!ISO.test(st.date || '')) { app.toast('เลือกวันที่ก่อนบันทึก', '', false); return; }
    if (!(st.recorder || '').trim()) {
      app.toast('เลือกชื่อผู้บันทึกก่อน', '', false);
      app.setState({ recorderMenuOpen: true, showMore: true });
      return;
    }
    if (app.pcuSiteMissing()) {
      app.toast('เลือก รพ.สต. ต้นทางก่อนบันทึก', '', false);
      return;
    }

    // จำนวนรวมแยกตามหน่วยนับจริง — ห้ามบวกข้ามหน่วย (กฎข้อ 3.4 ใน CLAUDE.md)
    const byUnit = {};
    for (const r of st.rows) {
      const u = (r.unit || 'หน่วย').trim();
      byUnit[u] = (byUnit[u] || 0) + (Number(r.qty) || 0);
    }
    const qtyLabel = Object.keys(byUnit)
      .map((u) => ({ u, n: byUnit[u] }))
      .sort((a, b) => b.n - a.n)
      .map((x) => qtyText(x.n) + ' ' + x.u)
      .join(' · ');

    const reuse = st.rows.filter((r) => r.disposition === 'reuse');
    const destroy = st.rows.filter((r) => r.disposition === 'destroy');
    const sum = (list) => list.reduce((a, r) => a + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);
    const vReuse = sum(reuse);
    const vDestroy = sum(destroy);
    const src = (SOURCES.find((s) => s.key === st.source) || {}).label || st.source;
    const noPrice = st.rows.filter((r) => !(Number(r.price) > 0)).length;

    const lines = [
      { label: 'วันที่รับคืน', value: thaiDate(st.date) },
      { label: 'แหล่งที่มา', value: src },
      // โผล่เฉพาะตอนเป็น รพ.สต. · ยังไม่เลือกให้ขึ้นสีแดงเตือน จะได้ทันสังเกตก่อนกดส่ง
      ...(st.source === 'pcu' ? [{
        label: 'รพ.สต. ต้นทาง',
        value: (st.pcuSite || '').trim() || 'ยังไม่ได้เลือก',
        tone: (st.pcuSite || '').trim() ? '' : 'red',
        indent: true
      }] : []),
      { label: 'ผู้บันทึก', value: st.recorder },
      { label: 'HN', value: (st.hn || '').trim() || 'ไม่ระบุ', tone: (st.hn || '').trim() ? '' : 'soft' },
      { label: 'รายการยา', value: st.rows.length + ' รายการ', sep: true },
      { label: 'จำนวนรวม', value: qtyLabel },
      { label: 'มูลค่ารวม', value: money(vReuse + vDestroy) },
      { label: 'ใช้ต่อได้', value: reuse.length + ' รายการ · ' + money(vReuse), tone: 'green', indent: true }
    ];
    if (destroy.length) {
      lines.push({ label: 'ทำลาย', value: destroy.length + ' รายการ · ' + money(vDestroy), tone: 'red', indent: true });
    }

    app.setState({
      confirm: {
        kind: 'normal',
        title: 'ยืนยันบันทึกรายการยาคืน',
        lines: lines,
        // เตือนเฉพาะตอนมียาที่ยังไม่ใส่ราคาจริง ๆ ไม่ใช่ขึ้นทุกครั้งจนคนเลิกอ่าน
        note: noPrice
          ? 'มียาที่ยังไม่ใส่ราคา ' + noPrice + ' รายการ บันทึกได้ตามปกติ ระบบจะตีราคาย้อนหลังให้เมื่อใส่ราคาแล้ว'
          : 'ระบบจะออกเลข Lot ให้หลังบันทึกสำเร็จ',
        okLabel: 'ยืนยันบันทึก',
        run: () => app.save()
      }
    });
  };

  // opts.auto = true → ระบบลองส่งเองเบื้องหลัง (ตัวตั้งเวลาถอยห่าง · เน็ตกลับมา · เพิ่งเปิดเว็บ)
  // 🚨 การส่งเองห้ามเปิดหน้าเต็มจอทั้งตอนสำเร็จและตอนล้ม
  //    เภสัชกรอาจกำลังพิมพ์ยาล็อตถัดไปอยู่ จู่ ๆ มีจอเต็มเด้งมาคือการขัดจังหวะ
  //    และถ้าล้มซ้ำทุก 5 นาทีจะกลายเป็นจอเด้งทั้งวัน จนคนเลิกอ่านข้อความบนนั้น
  // ⚠️ app.save ถูกใช้เป็นตัวรับการกดปุ่มด้วย (onSave) จึงได้ event object มาเป็น opts
  //    ต้องเทียบ === true เท่านั้น ห้ามเช็คแค่ว่ามีค่าไหม
  app.save = async (opts) => {
    const auto = !!(opts && opts.auto === true);
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
    // ── ใครเซ็นล็อตนี้ ────────────────────────────────────────────────────
    // ปกติคือชื่อในช่องผู้บันทึก · แต่ของค้างที่เปิดเว็บใหม่มาเจอจะไม่มีชื่อในช่องนั้น
    // เพราะช่องผู้บันทึกถูกล้างทุกครั้งที่เปิดเว็บโดยตั้งใจ (กฎข้อ 3.24 คอมเป็นเครื่องกลาง)
    // 🚨 ล็อตที่ค้างถูกเซ็นไปแล้วตั้งแต่กดส่งครั้งแรก การส่งซ้ำคือส่งของเดิมที่เซ็นไว้
    //    จึงใช้ชื่อที่เก็บคู่กับของค้าง ไม่ใช่บังคับให้คนถัดไปมาเซ็นแทน
    //    ถ้าไม่ทำแบบนี้ ระบบจะส่งของค้างเองไม่ได้เลยหลังเปิดเว็บใหม่ ต้องมีคนมากดทุกครั้ง
    const by = (st.recorder || '').trim() || (st.saveFailed ? (st.failedBy || '').trim() : '');
    if (!by) {
      app.toast('เลือกชื่อผู้บันทึกก่อน', '', false);
      app.setState({ recorderMenuOpen: true, showMore: true });
      return;
    }
    if (app.pcuSiteMissing()) {
      app.toast('เลือก รพ.สต. ต้นทางก่อนบันทึก', '', false);
      return;
    }

    app._saving = true;
    const batchId = st.batchId || newUuid();
    const sending = st.rows;                       // ล็อกชุดที่จะส่งไว้ตรงนี้
    const n = sending.length;

    app.persist({ saving: true, saveFailed: false, saveError: '', batchId: batchId });

    try {
      const res = await app.fetchT('/api/returns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          batchId: batchId,
          date: st.date,
          source: st.source,
          pcuSite: st.pcuSite,
          hn: st.hn,
          recordedBy: by,
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
            source: r.source || st.source,
            pcuSite: r.pcuSite || ''
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

      // เซิร์ฟเวอร์บอกจำนวนที่เข้าฐานจริง ถ้าน้อยกว่าที่ส่งแปลว่าบางแถวเคยบันทึกไปแล้ว
      // (กดลองส่งใหม่หลังเน็ตหลุด) ต้องบอกตรงๆ ไม่ใช่บอกว่าบันทึกครบ
      const got = typeof data.saved === 'number' ? data.saved : n;

      // ── ยอดของล็อตที่เพิ่งส่งไป — คิดจาก sending ไม่ใช่แถวที่ยังอยู่บนจอ ──
      // ระหว่างรอเซิร์ฟเวอร์ตอบ เภสัชกรพิมพ์ยาเพิ่มได้ ถ้านับจากของบนจอตัวเลขจะเกินจริง
      const sumOf = (list) => list.reduce((a, r) => a + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);
      const sentReuse = sending.filter((r) => r.disposition === 'reuse');
      const sentDestroy = sending.filter((r) => r.disposition !== 'reuse');
      // จำนวนรวมแยกตามหน่วยนับจริง — ห้ามบวกข้ามหน่วย (กฎข้อ 3.4 ใน CLAUDE.md)
      const byUnitSent = {};
      for (const r of sending) {
        const u = (r.unit || 'หน่วย').trim();
        byUnitSent[u] = (byUnitSent[u] || 0) + (Number(r.qty) || 0);
      }
      const qtyLabelSent = Object.keys(byUnitSent)
        .map((u) => ({ u, n: byUnitSent[u] }))
        .sort((a, b) => b.n - a.n)
        .map((x) => qtyText(x.n) + ' ' + x.u)
        .join(' · ');

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
        // ล็อตค้างถูกส่งไปแล้ว เลิกจำชื่อผู้เซ็นของมัน ไม่ให้ไปติดกับล็อตถัดไป
        failedBy: '',
        lastLot: data.lot || '',
        fy: data.fy || st.fy,
        // ── หน้าผลเต็มจอ (พี่กันสั่ง 29 ส.ค. 2569 · แบบ ข จากมอคอัป) ──
        // เก็บค่าที่จะโชว์ไว้ในก้อนนี้เลย ไม่ให้หน้าผลไปอ่านจาก state ที่กำลังถูกล้าง
        // 🚨 เก็บ src กับ pcuSite ของล็อตที่เพิ่งส่งไว้ด้วย ปุ่มใบสรุปต้องใช้
        // ส่งเองสำเร็จตอนผู้ใช้ทำอย่างอื่นอยู่ — บอกด้วยข้อความเด้งพอ ไม่ยึดจอทั้งจอ
        result: auto ? null : {
          kind: 'ok',
          lot: data.lot || '',
          date: st.date,
          by: by,
          src: st.source,
          pcuSite: st.source === 'pcu' ? (st.pcuSite || '') : '',
          items: n,
          qtyLabel: qtyLabelSent,
          saved: sumOf(sentReuse),
          lost: sumOf(sentDestroy),
          note: got < n
            ? ('บันทึกเข้าระบบ ' + got + ' รายการ · อีก ' + (n - got) + ' รายการเคยบันทึกไปแล้วก่อนหน้านี้ จึงไม่ถูกนับซ้ำ')
            : ''
        }
      });
      app.invalidate();
      app.animateTo(sumReuse(left));
      // ส่งได้แล้ว เลิกจับเวลาลองส่งเอง และล้างตัวนับครั้งให้พร้อมสำหรับล็อตถัดไป
      app.clearRetry();

      // ตอนกดส่งเองไม่มีข้อความเด้งแล้ว — หน้าผลเต็มจอบอกครบกว่าและไม่หายไปใน 2 วินาที
      // แต่ตอนระบบส่งให้เองต้องมี ไม่งั้นของขึ้นระบบไปแล้วโดยไม่มีอะไรบอกเลย
      if (auto) {
        app.toast('ส่งข้อมูลที่ค้างอยู่สำเร็จแล้ว', data.lot ? 'Lot ' + data.lot : '');
      }
    } catch (e) {
      const msg = (e && e.message) || '';

      // ยอดของที่ค้างอยู่ — โชว์บนหน้าส่งไม่สำเร็จให้เห็นว่าค้างไปเท่าไร
      const stuckValue = sending.reduce((a, r) => a + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);

      // 🚨 ผ่าน persist ไม่ใช่ setState — ธงส่งไม่สำเร็จต้องลงไปนอนในเครื่องด้วย
      //    ปิดแท็บแล้วเปิดใหม่จะได้รู้ว่าของก้อนนี้ยังไม่ขึ้นระบบ แล้วลองส่งเองต่อ
      app.persist({
        saving: false,
        saveFailed: true,
        saveError: msg,
        // จำไว้ว่าใครเซ็นล็อตนี้ เผื่อปิดแท็บแล้วเปิดใหม่ ระบบจะได้ส่งเองต่อได้
        failedBy: by,
        // ส่งเองแล้วล้มซ้ำขณะหน้าส่งไม่สำเร็จเปิดค้างอยู่ — อัปเดตสาเหตุล่าสุดให้ตรง
        // ไม่ใช่ปล่อยข้อความรอบแรกค้างไว้ทั้งที่สาเหตุเปลี่ยนไปแล้ว
        result: auto ? (app.state.result && app.state.result.kind === 'fail'
          ? Object.assign({}, app.state.result, { error: msg })
          : app.state.result) : {
          kind: 'fail',
          date: st.date,
          by: by,
          src: st.source,
          pcuSite: st.source === 'pcu' ? (st.pcuSite || '') : '',
          items: n,
          value: stuckValue,
          error: msg
        }
      });
      // ตั้งคิวลองส่งเองรอบถัดไป — ถอยห่างขึ้นทุกครั้งที่ล้มซ้ำ
      app.scheduleRetry(null, auto);
      // ตอนคนกดเองมีหน้าเต็มจอบอกอยู่แล้ว ข้อความเด้งซ้อนอีกชั้นเป็นการบอกซ้ำเปล่า ๆ
      if (auto) app.toast(msg || 'ยังส่งไม่สำเร็จ ระบบจะลองใหม่ให้เอง', '', false);
    } finally {
      app._saving = false;
    }
  };

  // ── ปุ่มบนหน้าผล (ทั้งสำเร็จและไม่สำเร็จ) ─────────────────────────────────
  app.closeResult = () => app.setState({ result: null });

  // ปุ่ม "ส่งอีกครั้ง" บนหน้าส่งไม่สำเร็จ — นับเป็นการกดเอง ไม่ใช่การส่งเองของระบบ
  // 🚨 ห่อด้วยลูกศรเปล่า ไม่ผูก app.save ตรง ๆ ไม่งั้น event ของการกดจะกลายเป็น opts
  app.resultRetry = () => app.save();

  // ใบสรุป Lot ตัวเดียวกับที่กดดูจากหน้ารายการ Lot (พี่กันสั่ง "แบบเดียวกันกับที่กดดูในเว็บ ที่มันปริ้นได้")
  // 🚨 ส่งแค่หัวล็อตไป — openLotSlip จะไปดึงแถวจริงจากฐานเอง
  //    ยอดบนใบจึงมาจากข้อมูลที่เข้าฐานแล้วจริง ไม่ใช่ตัวเลขที่ค้างอยู่ในเครื่อง
  app.openResultSlip = () => {
    const r = app.state.result;
    if (!r || !r.lot) return;
    app.openLotSlip({ lot: r.lot, date: r.date, by: r.by, src: r.src, pcuSite: r.pcuSite });
  };
}
