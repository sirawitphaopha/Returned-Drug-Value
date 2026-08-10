// โหมดดูตัวอย่าง — ข้อมูลปลอมที่สร้างในเบราว์เซอร์ ไม่แตะฐานข้อมูลจริงเลย
//
// 🚨 กติกาสำคัญ
//    1. ข้อมูลชุดนี้ไม่เคยถูกส่งขึ้นเซิร์ฟเวอร์ · ทุกหน้าอ่านจากก้อนในหน่วยความจำ
//    2. เปิดโหมดนี้แล้ว "ปุ่มบันทึกถูกปิด" กันข้อมูลปลอมหลุดเข้าของจริง
//    3. ปิดโหมดแล้วทุกอย่างกลับไปอ่านของจริงทันที (ล้างแคชให้ด้วย)
import { buildDemo, demoSummary, demoTopReturned, demoHistory, demoDraft } from '@/lib/demo';
import { LS, clearLS } from '../helpers';

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
      source: st0.source, sourceTouched: st0.sourceTouched, date: st0.date
    };

    app._demo = box;
    app.invalidate();
    app.setState({
      demo: true,
      settingsOpen: false,
      drugs: drugs,
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
      date: real.date || app.state.today
    };

    app.setState(Object.assign({
      demo: false,
      settingsOpen: false,
      drugs: [],
      favIds: [],
      lastLot: '',
      sum: null,
      topReturned: [],
      lots: [],
      histRows: [], histMore: [], histTotal: 0, histSaved: 0
    }, back), () => {
      app.boot();
      app.loadHistory(true);
      app.animateTo(back.rows.reduce((a, x) => a + (x.disposition === 'reuse' ? x.price * x.qty : 0), 0));
      app.toast('ปิดโหมดดูตัวอย่างแล้ว', 'กลับมาใช้ข้อมูลจริง');
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
        detail: 'เครื่องนี้จะลืมรหัสผ่านห้องยาทันที',
        note: 'ครั้งหน้าต้องกรอกรหัสผ่านใหม่ · ยาที่กรอกค้างไว้ยังอยู่ครบ ไม่หายไปไหน',
        okLabel: 'ออกจากระบบ',
        run: () => app.doLogout()
      }
    });
  };

  app.doLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      // ลบคุกกี้ไม่สำเร็จก็ยังพาไปหน้าล็อกอินอยู่ดี
      // ประตูตรวจที่ middleware จะเป็นคนตัดสินอีกทีว่าเข้าได้ไหม
    }
    window.location.href = '/login';
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
    // ถังขยะในโหมดตัวอย่างว่างเสมอ (ไม่ได้ลบอะไรจริง)
    app.setState({
      histRows: st.histTrash ? [] : h.rows,
      histTotal: st.histTrash ? 0 : h.total,
      histSaved: st.histTrash ? 0 : h.saved,
      histMore: [], histOffset: 0, histLoading: false
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
