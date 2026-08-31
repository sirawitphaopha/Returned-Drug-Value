// โหมดดูตัวอย่าง — ข้อมูลปลอมที่สร้างในเบราว์เซอร์ ไม่แตะฐานข้อมูลจริงเลย
//
// 🚨 กติกาสำคัญ
//    1. ข้อมูลชุดนี้ไม่เคยถูกส่งขึ้นเซิร์ฟเวอร์ · ทุกหน้าอ่านจากก้อนในหน่วยความจำ
//    2. เปิดโหมดนี้แล้ว "ปุ่มบันทึกถูกปิด" กันข้อมูลปลอมหลุดเข้าของจริง
//    3. ปิดโหมดแล้วทุกอย่างกลับไปอ่านของจริงทันที (ล้างแคชให้ด้วย)
import { buildDemo, demoSummary, demoTopReturned, demoHistory, demoDraft, DEMO_PCU,
  demoParked, demoServerDrafts, demoCatalog, demoPrices, demoTrash } from '@/lib/demo';
import { LS, clearLS, readLS, writeLS, myTabId, draftKeyOf } from '../helpers';

export function demoActions(app) {
  app.enterDemo = () => {
    const box = buildDemo(app.state.today || new Date().toISOString().slice(0, 10));
    const sum = demoSummary(box);

    // ยาในช่องค้นหาก็ใช้ชุดตัวอย่าง จะได้มีราคาให้เห็นตัวเลขจริง ๆ
    // 🚨 ต้องส่ง brand · form · route ต่อไปด้วย ไม่งั้นผลค้นหาในโหมดตัวอย่าง
    //    จะไม่มีชื่อการค้าสีเทล ไม่มีรูปแบบยา ไม่มีทางให้ยา = เทสของที่เพิ่งแก้ไม่ได้
    const drugs = box.drugs.map((d) => ({
      id: d.id, name: d.name, unit: d.unit, price: d.price, hasPrice: true,
      brand: d.brand || '', form: d.form || '', route: d.route || ''
    }));

    // ล็อตที่ "กำลังกรอกค้างไว้" ให้หน้าบันทึกมีของโชว์ด้วย (พี่กันขอ)
    // 🚨 ไม่ผ่าน app.persist = ไม่เขียนลง localStorage ปิดโหมดแล้วหายเกลี้ยง
    //    ไม่ไปทับร่างจริงที่พี่กันกรอกค้างไว้ก่อนกดเปิดโหมด
    const draft = demoDraft(box);
    const draftSaved = draft.reduce((a, x) => a + (x.disposition === 'reuse' ? x.price * x.qty : 0), 0);

    // เก็บของจริงที่ค้างอยู่บนจอไว้ก่อน แล้วคืนให้ตอนปิดโหมด
    // (อ่านจาก localStorage ตอนปิดไม่ได้ เพราะ persist ถูกล็อกไว้ระหว่างเปิดโหมด)
    const st0 = app.state;
    app._realDraft = {
      rows: st0.rows, batchId: st0.batchId, hn: st0.hn,
      source: st0.source, sourceTouched: st0.sourceTouched, date: st0.date,
      pcuSite: st0.pcuSite,
      // 🚨 ต้องเก็บ 3 อย่างนี้ไว้ด้วย ไม่งั้นปิดโหมดแล้วชื่อเครื่องจริงหาย
      //    และล็อตค้างของจริงถูกข้อมูลปลอมทับ (เรื่องเดียวกับร่างที่กรอกค้าง)
      deviceId: st0.deviceId,
      parked: st0.parked,
      serverDrafts: st0.serverDrafts
    };

    // ยาที่ถูกคืนบ่อยในชุดตัวอย่าง — ให้ช่องค้นหาดันขึ้นก่อนเหมือนของจริง
    // (ของจริงมาจาก mr_hot_drug_ids ตอน bootstrap)
    const times = {};
    for (const r of box.rows) times[r.drugId] = (times[r.drugId] || 0) + 1;
    const hotIds = Object.keys(times)
      .sort((a, b) => times[b] - times[a])
      .slice(0, 20)
      .map((k) => Number(k));

    app._demo = box;
    app.invalidate();
    app.setState({
      demo: true,
      settingsOpen: false,
      drugs: drugs,
      hotIds: hotIds,
      // รายชื่อ รพ.สต. ชุดตัวอย่าง — ต้องมี ไม่งั้นเปิดโหมดนี้แล้วช่องเลือก รพ.สต.
      // ขึ้นว่า "ยังไม่ได้ตั้งรายชื่อ" และไม่มีทางเห็นการบังคับเลือกที่เพิ่งทำ (กฎข้อ 3.12)
      pcuSites: DEMO_PCU,
      // ยาที่คืนบ่อย 6 ตัวแรกของชุดตัวอย่าง
      favIds: box.drugs.slice(0, 6).map((d) => d.id),
      recorder: 'ภก. สิรวิชญ์ เผ่าผา',
      hn: '6418302',
      // เลขที่ชุดตัวอย่าง — ของจริงฐานข้อมูลออกให้ตอนกดบันทึก เดาล่วงหน้าไม่ได้
      // แต่โหมดนี้มีไว้ให้เห็นภาพ ถ้าปล่อยว่างพี่กันจะไม่รู้ว่าเลขหน้าตาเป็นยังไง (พี่กันขอ)
      lastLot: (box.lots && box.lots[0] && box.lots[0].lot) || '',
      rows: draft,
      fy: { saved: sum.saved, lost: sum.lost, records: sum.records, qty: sum.qty },
      fyYear: sum.fyYear,
      sum: sum,
      sumLoading: false,
      topReturned: demoTopReturned(box),
      lots: box.lots,
      // ── คลังยากับหน้าราคาต้องเป็นของปลอมด้วย (พี่กันสั่ง 31 ส.ค. 2569) ──────
      // 🚨 เดิมสองหน้านี้ไม่รู้จักโหมดตัวอย่างเลย กดแท็บคลังยาแล้วโหลดยาจริง
      //    417 ตัวพร้อมราคาจริงมาโชว์ ผิดกติกาข้อแรกของโหมดนี้
      catalog: demoCatalog(box),
      catLoading: false,
      catDraw: 60,
      priceItems: demoPrices(box),
      priceLoading: false,
      // ── ชื่อเครื่องกับล็อตที่กรอกค้างไว้ ────────────────────────────────────
      // ตั้งชื่อเครื่องตัวอย่างเสมอ เพื่อให้หน้าตั้งค่ามีของให้ดู
      // และหน้าต่างถามชื่อเครื่องไม่เด้งขึ้นมาขวางตอนกำลังดูตัวอย่าง
      deviceId: 'computer OPD เครื่องที่ 1',
      deviceAsk: false,
      parked: demoParked(box),
      serverDrafts: demoServerDrafts(box),
      showOtherDrafts: false,
      histRows: [], histMore: [], histTotal: 0, histSaved: 0
    }, () => {
      app.animateTo(draftSaved);
      app.loadHistory(true);
      app.toast('เปิดโหมดดูตัวอย่างแล้ว', sum.records + ' รายการในประวัติ');
    });
  };

  app.exitDemo = () => {
    app._demo = null;
    app.invalidate();
    // แคชยา/การตั้งค่าในเครื่องเป็นของปลอมอยู่ ต้องทิ้งแล้วโหลดสดใหม่
    clearLS(LS.drugs);
    clearLS(LS.setting);

    // คืนล็อตจริงที่ค้างอยู่ก่อนเปิดโหมด — ถ้าไม่มีของเก่าให้เริ่มจากว่าง
    const real = app._realDraft || {};
    app._realDraft = null;
    const back = {
      rows: Array.isArray(real.rows) ? real.rows : [],
      batchId: real.batchId || null,
      hn: typeof real.hn === 'string' ? real.hn : '',
      source: typeof real.source === 'string' ? real.source : 'opd',
      sourceTouched: !!real.sourceTouched,
      pcuSite: typeof real.pcuSite === "string" ? real.pcuSite : "",
      date: real.date || app.state.today,
      // ชื่อเครื่องจริงกลับมา · ถ้าเครื่องนี้ยังไม่เคยตั้ง ให้หน้าต่างถามเด้งตามเดิม
      deviceId: real.deviceId || '',
      deviceAsk: !real.deviceId,
      parked: Array.isArray(real.parked) ? real.parked : [],
      serverDrafts: Array.isArray(real.serverDrafts) ? real.serverDrafts : []
    };

    app.setState(Object.assign({
      demo: false,
      settingsOpen: false,
      drugs: [],
      hotIds: [],            // ล้างยาคืนบ่อยของชุดตัวอย่าง · boot() จะโหลดของจริงมาทับ
      pcuSites: [],          // รายชื่อ รพ.สต. ปลอมต้องหายไปด้วย boot() โหลดของจริงมาแทน
      favIds: [],
      lastLot: '',
      sum: null,
      topReturned: [],
      lots: [],
      catalog: [], catLoading: false, catDraw: 60,
      priceItems: [], priceLoading: false,
      showOtherDrafts: false,
      histRows: [], histMore: [], histTotal: 0, histSaved: 0
    }, back), () => {
      app.boot();
      app.loadHistory(true);
      app.animateTo(back.rows.reduce((a, x) => a + (x.disposition === 'reuse' ? x.price * x.qty : 0), 0));
      app.toast('ปิดโหมดดูตัวอย่างแล้ว', 'กลับมาใช้ข้อมูลจริง');
    });
  };

  // ── ดูตัวอย่างหน้าที่ปกติเรียกดูไม่ได้ (พี่กันสั่ง 31 ส.ค. 2569) ───────────
  //
  // 🚨 ทุกตัวทำงานเฉพาะในโหมดดูตัวอย่าง ตรวจซ้ำที่นี่อีกชั้น
  //    เผื่อมีใครไปเรียกจากที่อื่นโดยไม่ผ่านปุ่มในหน้าตั้งค่า
  app.previewResult = (kind) => {
    if (!app.state.demo) return;
    const box = app._demo;
    const rows = box ? demoDraft(box) : [];
    const reuse = rows.filter((r) => r.disposition === 'reuse');
    const destroy = rows.filter((r) => r.disposition === 'destroy');
    const sum = (list) => list.reduce((a, r) => a + r.price * r.qty, 0);
    // นับจำนวนแยกตามหน่วยนับ ห้ามบวกข้ามหน่วย (กฎข้อ 3.4)
    const byUnit = {};
    for (const r of rows) byUnit[r.unit] = (byUnit[r.unit] || 0) + r.qty;
    const qtyLabel = Object.keys(byUnit).slice(0, 3).map((u) => byUnit[u] + ' ' + u).join(' · ');

    const base = {
      date: app.state.date, by: 'ภก. สิรวิชญ์ เผ่าผา',
      src: 'opd', pcuSite: '', items: rows.length
    };

    app.setState({
      settingsOpen: false,
      result: kind === 'fail'
        ? Object.assign({}, base, {
            kind: 'fail', value: sum(reuse),
            error: 'เชื่อมต่อระบบส่วนกลางไม่ได้ — เน็ตอาจหลุดชั่วคราว'
          })
        : Object.assign({}, base, {
            kind: 'ok',
            lot: (box && box.lots && box.lots[0] && box.lots[0].lot) || 'L690831-01',
            qtyLabel: qtyLabel,
            saved: sum(reuse), lost: sum(destroy), note: ''
          })
    });
  };

  // หน้าโหลดข้อมูลไม่สำเร็จ — ติดธงให้ครบทุกหน้าพร้อมกัน จะได้กดดูได้ทุกแท็บ
  app.previewLoadFail = () => {
    if (!app.state.demo) return;
    app.setState({
      settingsOpen: false,
      screen: 'summary',
      loadErr: {
        sum: 'โหลดยอดสรุปไม่สำเร็จ', hist: 'โหลดประวัติไม่สำเร็จ',
        lots: 'โหลดรายการ Lot ไม่สำเร็จ', cat: 'โหลดคลังยาไม่สำเร็จ',
        price: 'โหลดราคายาไม่สำเร็จ'
      },
      sum: null, histRows: [], histMore: [], lots: []
    });
    app.toast('กำลังดูตัวอย่างหน้าโหลดไม่สำเร็จ', 'กดปิดโหมดดูตัวอย่างเพื่อกลับสู่ปกติ', false);
  };

  app.clearPreviewLoadFail = () => {
    if (!app.state.demo) return;
    const box = app._demo;
    app.setState({ loadErr: {}, sum: box ? demoSummary(box) : null, lots: box ? box.lots : [] },
      () => app.loadHistory(true));
  };

  // หน้านำเข้าราคาจาก HIS — ใส่ผลจับคู่ตัวอย่างไว้ให้เลย ไม่ต้องมีไฟล์จริง
  app.previewHisImport = () => {
    if (!app.state.demo) return;
    const box = app._demo;
    const items = box ? demoPrices(box) : [];
    // 🚨 ต้องมีครบทั้ง 3 กอง ไม่งั้นเห็นแท็บเดียวแล้วนึกว่าระบบมีแค่นั้น
    //    มั่นใจ = ชื่อกับความแรงตรงกันหมด · ต้องเลือก = เจอหลายราคา · ไม่เจอ = ไม่มีในไฟล์
    // 🚨 รูปร่างแถวต้องตรงกับที่ matchAll() ใน lib/hisMatch.js คืนมาเป๊ะ ๆ
    //    ไม่งั้นหน้าจอนับกลุ่มไม่ได้ แล้วขึ้นว่างเปล่าทั้งสามแท็บ (เจอมาแล้ว)
    //    ช่องสำคัญคือ level (sure/pick/none) · candidates · pickedIndex · checked
    const rows = items.slice(0, 12).map(function (it, i) {
      var level = i < 7 ? 'sure' : i < 10 ? 'pick' : 'none';
      var up = String(it.name || '').toUpperCase();
      var cands = level === 'none' ? [] : (level === 'pick'
        ? [{ name: up + ' (ในบัญชี)', price: it.price, unit: it.unit },
           { name: up + ' (นอกบัญชี)', price: Math.round(it.price * 1.4 * 100) / 100, unit: it.unit }]
        : [{ name: up, price: it.price, unit: it.unit }]);
      return {
        drugId: it.id,
        webName: it.name,
        unit: it.unit || '',
        oldPrice: level === 'sure' ? 0 : Number(it.price || 0),
        level: level,
        candidates: cands,
        pickedIndex: cands.length ? 0 : -1,
        checked: level === 'sure',
        manualPrice: ''
      };
    });
    app.setState({
      settingsOpen: false, screen: 'prices',
      hisOpen: true, hisRows: rows, hisError: '', hisReading: false,
      hisFileName: 'ตัวอย่าง-รายการยา-HIS.xlsx', hisTotal: 654,
      hisTab: 'sure', hisSaving: false, hisBackfill: true
    });
  };

  app.toggleDemo = () => (app.state.demo ? app.exitDemo() : app.enterDemo());

  // หน้าเกี่ยวกับ — ยกโครงมาจาก ME-DRP ตามที่พี่กันสั่ง
  app.openAbout = () => app.setState({ screen: 'about', settingsOpen: false });
  app.closeAbout = () => app.setState({ screen: 'record' });

  // ── ออกจากระบบ ────────────────────────────────────────────────────────────
  // ต้องยืนยันก่อน 1 ชั้น เพราะออกแล้วต้องไปตามหารหัสผ่านห้องยามากรอกใหม่
  // ซึ่งคนที่ยืนอยู่หน้าเคาน์เตอร์ตอนคนไข้รออาจไม่รู้รหัส
  app.askLogout = () => {
    app.setState({
      settingsOpen: false,
      confirm: {
        title: 'ยืนยันออกจากระบบ',
        // 🚨 เดิมเขียนว่า "เครื่องนี้จะลืมรหัสผ่านห้องยาทันที" — พี่กันอ่านแล้วไม่เข้าใจ
        //    ฟังดูเหมือนรหัสผ่านหายไปเลย ทั้งที่หมายถึงเครื่องจะไม่จำว่าเคยกรอกแล้ว
        //    และซ้ำกับบรรทัดล่างที่บอกเรื่องเดียวกันอยู่แล้ว
        //    เขียนใหม่ให้บอก "สิ่งที่จะเกิดขึ้นจริง" ไม่ใช่ศัพท์ที่ต้องตีความ
        detail: 'เปิดเว็บครั้งหน้าต้องกรอกรหัสห้องยาอีกครั้ง',
        note: 'ยาที่กรอกค้างไว้ยังอยู่ครบ ไม่หายไปไหน · ช่อง HN จะถูกล้างเพื่อความเป็นส่วนตัว',
        okLabel: 'ออกจากระบบ',
        run: () => app.doLogout()
      }
    });
  };

  app.doLogout = async () => {
    // ยกธงก่อนทุกอย่าง — ตัวเตือนก่อนออกจากหน้าจะได้ไม่มาขวาง
    app._leaving = true;
    // 🚨 ล้าง HN ออกจากร่างในเครื่องก่อนเสมอ (ผลตรวจข้อ ก-7)
    //    คอมห้องยาเป็นเครื่องกลางใช้ร่วมกันทั้งเวร ร่างใน localStorage ไม่มีวันหมดอายุ
    //    ถ้าไม่ล้าง HN ของคนไข้จะค้างให้คนเวรถัดไปเห็น — เป็นประเด็น PDPA ที่ตรวจสอบได้จริง
    //    ยาที่กรอกค้างไว้ยังอยู่ครบ ล้างเฉพาะ HN ช่องเดียว
    try {
      const key = draftKeyOf(myTabId());
      const draft = readLS(key);
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
        writeLS(key, Object.assign({}, draft, { hn: '' }));
      }
    } catch (e) {}

    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      // ลบคุกกี้ไม่สำเร็จก็ยังพาไปหน้าล็อกอินอยู่ดี
      // ประตูตรวจที่ middleware จะเป็นคนตัดสินอีกทีว่าเข้าได้ไหม
    }
    window.location.href = '/login';
    // เผื่อเบราว์เซอร์ไม่เปลี่ยนหน้าให้ (โดนบล็อก) — คืนตัวเตือนกลับใน 3 วินาที
    // ไม่งั้นเว็บจะไม่เตือนอะไรเลยตลอดการใช้งานรอบนั้น
    setTimeout(() => { app._leaving = false; }, 3000);
  };

  // ── ตัวแทนการโหลดข้อมูลตอนอยู่ในโหมดตัวอย่าง ─────────────────────────────
  app.demoLoadHistory = () => {
    const st = app.state;
    const box = app._demo;
    if (!box) return;
    const h = demoHistory(box, {
      q: st.histQuery,
      lot: st.histLot,
      from: st.histRange === 'custom' ? st.histFrom : rangeFrom(st, box),
      to: st.histRange === 'custom' ? st.histTo : box.today,
      limit: 60,
      offset: 0
    });
    // ถังขยะมีของให้ดูด้วย (พี่กันสั่ง 31 ส.ค. 2569)
    // 🚨 ของในถังขยะตัวอย่างกู้คืนไม่ได้จริง เพราะ fetchT ดักคำขอที่ไม่ใช่ GET ไว้
    //    ตรงนี้มีไว้ให้เห็นหน้าตาตอนมีของ ไม่ใช่ให้ลองกดกู้
    const trash = st.histTrash ? demoTrash(box) : null;
    app.setState({
      histRows: trash || h.rows,
      histTotal: trash ? trash.length : h.total,
      histSaved: trash ? 0 : h.saved,
      histMore: [], histLoading: false
    });
  };

  app.demoLoadMore = () => {
    const st = app.state;
    const box = app._demo;
    if (!box || st.histTrash) return;
    const off = st.histRows.length + st.histMore.length;
    const h = demoHistory(box, {
      q: st.histQuery, lot: st.histLot,
      from: st.histRange === 'custom' ? st.histFrom : rangeFrom(st, box),
      to: st.histRange === 'custom' ? st.histTo : box.today,
      limit: 60, offset: off
    });
    app.setState({ histMore: st.histMore.concat(h.rows), histLoading: false });
  };
}

// แปลงปุ่มช่วงเวลา 4 ปุ่มเป็นวันเริ่ม — กติกาเดียวกับฝั่งเซิร์ฟเวอร์
function rangeFrom(st, box) {
  const t = box.today;
  if (st.histRange === 'today') return t;
  if (st.histRange === 'week') {
    const d = new Date(t + 'T00:00:00');
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }
  if (st.histRange === 'month') return t.slice(0, 7) + '-01';
  return box.range.from;
}
