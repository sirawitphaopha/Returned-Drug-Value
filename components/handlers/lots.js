// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
//
// 1 รอบกดบันทึก = 1 Lot มีเลขของตัวเอง (L690810-01) ฐานข้อมูลรวมยอดมาให้แล้ว
// ทำไมต้องมีหน้านี้: หน้าประวัติเป็นรายแถวยา มองไม่ออกว่า "รอบบ่ายวันนี้รับคืนไปเท่าไหร่"
// ต้องไล่บวกเอง · หน้านี้ตอบได้ในบรรทัดเดียวต่อ Lot
//
// ใบสรุปพิมพ์: แปะหน้าถุงยาที่รอตรวจ ให้เวรถัดไปรู้ว่าถุงนี้คือ Lot ไหน
//              หรือเก็บเข้าแฟ้มเป็นหลักฐานว่าวันนั้นรับคืนอะไรมาบ้าง
import { fetchT, cleanQtyExpr, evalQty } from '../helpers';

// วันเวลาที่พิมพ์ใบ — ใช้ พ.ศ. ตามที่ห้องยาอ่านกันจริง
// 🚨 อ่านนาฬิกาของเครื่อง ไม่ใช่ของฐานข้อมูล เพราะฐานเป็นเวลา UTC จะเพี้ยนไป 7 ชั่วโมง
function stampNow() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + (d.getFullYear() + 543) +
    ' เวลา ' + p2(d.getHours()) + '.' + p2(d.getMinutes()) + ' น.';
}

const LOTS_TTL = 60000;

// วันเริ่มต้นของแต่ละช่วงเวลาในโหมดดูตัวอย่าง — เลียนแบบ rangeOf() ใน /api/lots
function demoFrom(range, box) {
  const t = box.today;
  if (range === 'today') return t;
  if (range === 'week') {
    const d = new Date(t + 'T00:00:00');
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }
  if (range === 'month') return t.slice(0, 7) + '-01';
  return box.range.from;
}

export function lotsActions(app) {
  app._lotsCache = {};

  app.openLots = () => {
    app.setState({ screen: 'lots' });
    app.loadLots();
  };

  // กลับไปหน้าประวัติ — ไม่ใช่ goScreen เพราะไม่อยากให้ล้างตัวกรองที่ตั้งไว้
  app.closeLots = () => {
    app.setState({ screen: 'history' });
    app.toTop();
  };

  app.setLotsRange = (range) => {
    // เปลี่ยนช่วงเวลา = เริ่มนับใหม่ 40 Lot แรกเสมอ ไม่งั้นกดช่วงแคบลงแล้วยังค้างที่ 200
    app.setState({ lotsRange: range, lotsShown: 40 });
    // ตั้งค่าใหม่แล้วโหลดทันที ไม่ต้องรอ (ปุ่มช่วงเวลามีแค่ 4 ปุ่ม กดไม่รัวเหมือนพิมพ์ค้น)
    setTimeout(() => app.loadLots(), 0);
  };

  app.moreLots = () => app.setState({ lotsShown: app.state.lotsShown + 40 });

  app.loadLots = async (force) => {
    // โหมดดูตัวอย่างสร้างรายการ Lot มาให้พร้อมแล้วในเครื่อง ไม่ต้องแตะเซิร์ฟเวอร์
    // 🚨 ต้องกรองตามช่วงเวลาเองด้วย ไม่งั้นกด "วันนี้" แล้วยังเห็นทั้งปีงบ 684 Lot
    if (app.state.demo) {
      const box = app._demo;
      const from = box ? demoFrom(app.state.lotsRange, box) : '';
      const lots = box ? box.lots.filter((l) => l.date >= from && l.date <= box.today) : [];
      app.setState({ lots: lots, lotsLoading: false });
      return;
    }

    const key = app.state.lotsRange;
    const c = app._lotsCache[key];
    if (!force && c && Date.now() - c.ts < LOTS_TTL) {
      app.setState({ lots: c.lots, lotsLoading: false });
      return;
    }

    app.setState({ lotsLoading: true });
    try {
      const res = await app.fetchT('/api/lots?range=' + encodeURIComponent(key));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านรายการ Lot ไม่สำเร็จ');
      app._lotsCache[key] = { ts: Date.now(), lots: data.lots || [] };
      app.setState({ lots: data.lots || [], lotsLoading: false });
    } catch (e) {
      app.setState({ lotsLoading: false });
      app.toast(e.message || 'อ่านรายการ Lot ไม่สำเร็จ', '', false);
    }
  };

  // กดที่ Lot แล้วเด้งไปหน้าประวัติที่กรองไว้ให้เฉพาะ Lot นั้น (ใช้ตัวกรองที่มีอยู่แล้ว)
  app.openLotInHistory = (lot) => {
    app.setState({ screen: 'history', histLot: lot, histTrash: false });
    setTimeout(() => app.loadHistory(true), 0);
  };

  // ── ใบสรุป Lot ────────────────────────────────────────────────────────────
  // ต้องดึงรายการยาข้างใน Lot มาก่อน (หน้ารายการมีแต่ยอดรวม)
  app.openLotSlip = async (lot) => {
    app.setState({ slipLot: lot, slipRows: [], slipLoading: true });

    if (app.state.demo) {
      const box = app._demo;
      const rows = box ? box.rows.filter((x) => x.lot === lot.lot) : [];
      app.setState({ slipRows: rows, slipLoading: false });
      return;
    }

    try {
      // 🚨 ต้องมี limit=all — ไม่งั้นเซิร์ฟเวอร์ตัดที่ 60 แถวเงียบ ๆ (ผลตรวจข้อ ก-4)
      //    ยอดท้ายใบสรุปคิดจากแถวที่ดึงมาเท่านั้น รับคืนรอบใหญ่ 80 รายการแล้วสั่งพิมพ์
      //    จะได้กระดาษ 60 แถว ยอดไม่ตรงกับที่โชว์บนหน้ารายการ Lot — เอกสารเข้าแฟ้มขัดกันเอง
      const res = await app.fetchT('/api/returns?range=fy&limit=all&q=&lot=' + encodeURIComponent(lot.lot));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านรายการใน Lot ไม่สำเร็จ');
      app.setState({ slipRows: data.rows || [], slipLoading: false });
    } catch (e) {
      app.setState({ slipLot: null, slipLoading: false });
      app.toast(e.message || 'อ่านรายการใน Lot ไม่สำเร็จ', '', false);
    }
  };

  app.closeLotSlip = () => app.setState({ slipLot: null, slipRows: [] });

  // ── แก้ไขล็อตทั้งก้อน (พี่กันสั่ง 25 ส.ค. 2569) ─────────────────────────────
  // ล็อตที่บันทึกไปแล้วมีโอกาสกรอกผิด — เลือกชื่อผู้บันทึกผิดคน ติ๊กแหล่งที่มาผิด นับจำนวนพลาด
  // เดิมต้องลบทีละแถวแล้วกรอกใหม่ทั้งล็อต ซึ่งเสี่ยงกว่าการแก้มาก
  //
  // 🚨 ทุกการแก้ถูกบันทึกลง mr_lot_audit — ดูเหตุผลใน app/api/lots/[lot]/route.js
  // 🚨 ราคาต่อหน่วยแก้ไม่ได้ ไม่มีช่องให้แก้ในหน้าจอและฝั่งเซิร์ฟเวอร์ก็ไม่รับ
  app.openLotEdit = async (lot) => {
    if (app.state.demo) { app.toast('โหมดดูตัวอย่างแก้ข้อมูลไม่ได้', '', false); return; }
    app.setState({ lotEdit: { lot: lot }, lotEditLoading: true, lotEditBusy: false, lotEditConfirm: false, lotEditLogOpen: false });
    try {
      const res = await app.fetchT('/api/lots/' + encodeURIComponent(lot));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านข้อมูลล็อตไม่สำเร็จ');
      app.setState({
        lotEdit: {
          lot: data.lot,
          // ค่าตั้งต้น = ค่าปัจจุบันในฐาน · orig เก็บไว้เทียบว่าแก้อะไรไปแล้วบ้าง
          recordedBy: data.recordedBy,
          source: data.source,
          pcuSite: data.pcuSite || '',
          date: data.date,
          rows: data.rows,
          orig: {
            recordedBy: data.recordedBy, source: data.source,
            pcuSite: data.pcuSite || '', date: data.date, rows: data.rows
          }
        },
        lotEditLog: data.log || [],
        lotEditLoading: false
      });
    } catch (e) {
      app.setState({ lotEdit: null, lotEditLoading: false });
      app.toast(e.message || 'อ่านข้อมูลล็อตไม่สำเร็จ', '', false);
    }
  };

  app.closeLotEdit = () => app.setState({
    lotEdit: null, lotEditLog: [], lotEditConfirm: false, lotEditQtyId: null, lotEditQtyText: '', lotEditLogOpen: false, lotEditWho: ''
  });

  // แก้ค่าระดับล็อต (ผู้บันทึก · แหล่งที่มา · วันที่)
  app.setLotEditField = (key, value) => {
    const e = app.state.lotEdit;
    if (!e) return;
    app.setState({ lotEdit: Object.assign({}, e, { [key]: value }) });
  };

  // แก้จำนวนรายแถว — ใช้กติกาเดียวกับหน้าบันทึก (พิมพ์สูตรได้ · Enter 2 จังหวะ)
  app.startLotQty = (id, qty) => app.setState({ lotEditQtyId: id, lotEditQtyText: String(qty) });
  app.changeLotQty = (text) => app.setState({ lotEditQtyText: cleanQtyExpr(text) });
  app.cancelLotQty = () => app.setState({ lotEditQtyId: null, lotEditQtyText: '' });

  app.resolveLotQty = () => {
    const n = evalQty(app.state.lotEditQtyText);
    if (!n) return;
    app.setState({ lotEditQtyText: String(app.state.lotEditQtyText).split('=')[0] + '=' + n });
  };

  app.commitLotQty = () => {
    const e = app.state.lotEdit;
    const id = app.state.lotEditQtyId;
    if (!e || !id) return;
    const n = evalQty(app.state.lotEditQtyText);
    if (!n) { app.setState({ lotEditQtyId: null, lotEditQtyText: '' }); return; }
    app.setState({
      lotEdit: Object.assign({}, e, { rows: e.rows.map((r) => (r.id === id ? Object.assign({}, r, { qty: n }) : r)) }),
      lotEditQtyId: null,
      lotEditQtyText: ''
    });
  };

  app.setLotRowDisp = (id, disp) => {
    const e = app.state.lotEdit;
    if (!e) return;
    app.setState({ lotEdit: Object.assign({}, e, { rows: e.rows.map((r) => (r.id === id ? Object.assign({}, r, { disposition: disp }) : r)) }) });
  };

  app.toggleLotEditLog = () => app.setState({ lotEditLogOpen: !app.state.lotEditLogOpen });

  // 🚨 ต้องผ่านหน้าต่างยืนยันก่อนเสมอ — แก้ล็อตกระทบตัวเลขที่รายงานไปแล้ว
  //    และการเปลี่ยนชื่อผู้บันทึกคือการเปลี่ยนหลักฐานว่าใครเซ็น (กฎเหล็กข้อ 7)
  // เปิดหน้าต่างยืนยัน — ถ้าหน้าบันทึกเลือกชื่อไว้แล้วก็หยิบมาใส่ให้ เป็นการช่วย ไม่ใช่การบังคับ
  app.askSaveLotEdit = () => app.setState({
    lotEditConfirm: true,
    lotEditWho: app.state.lotEditWho || app.state.recorder || ''
  });
  app.setLotEditWho = (v) => app.setState({ lotEditWho: v });
  app.cancelSaveLotEdit = () => app.setState({ lotEditConfirm: false });

  app.saveLotEdit = async () => {
    const e = app.state.lotEdit;
    if (!e || app.state.lotEditBusy) return;
    // 🚨 ชื่อผู้แก้มาจากช่องในหน้าต่างยืนยันเอง ไม่ใช่ช่องผู้บันทึกในหน้าบันทึก
    //    เดิมผูกกับ app.state.recorder ซึ่งผิด — คนที่มาแก้ล็อตย้อนหลังไม่จำเป็น
    //    ต้องเปิดหน้าบันทึกแล้วเลือกชื่อตัวเองก่อน มันคนละงานกัน
    //    ผลคือกดยืนยันแล้วโดนตีกลับเงียบ ๆ (ข้อความเตือนหายใน 2 วินาที)
    //    ดูเหมือนปุ่มเสีย — พี่กันเจอเอง 25 ส.ค. 2569
    const by = String(app.state.lotEditWho || '').trim();
    if (!by) return;      // ปุ่มยืนยันถูกปิดอยู่แล้วเมื่อยังไม่เลือก ตรงนี้แค่กันเหนียว

    app.setState({ lotEditBusy: true });
    try {
      // ส่งเฉพาะแถวที่เปลี่ยนจริง — ฝั่งเซิร์ฟเวอร์เทียบซ้ำอีกชั้นอยู่แล้ว
      // แต่ส่งน้อยกว่าดีกว่า เน็ตโรงพยาบาลช้าและล็อตใหญ่มีได้ถึง 500 แถว
      const origById = new Map(e.orig.rows.map((r) => [r.id, r]));
      const items = e.rows
        .filter((r) => {
          const o = origById.get(r.id);
          return o && (Number(o.qty) !== Number(r.qty) || o.disposition !== r.disposition);
        })
        .map((r) => ({ id: r.id, qty: r.qty, disposition: r.disposition }));

      const body = { by: by, items: items };
      if (e.recordedBy !== e.orig.recordedBy) body.recordedBy = e.recordedBy;
      if (e.source !== e.orig.source) body.source = e.source;
      // ส่งชื่อ รพ.สต. ไปเมื่อชื่อเปลี่ยน หรือเมื่อเพิ่งย้ายเข้ามาเป็น รพ.สต.
      // (หลังบ้านล้างค่าให้เองตอนย้ายออก จึงไม่ต้องส่งกรณีนั้น)
      if (e.pcuSite !== e.orig.pcuSite || (e.source === 'pcu' && e.source !== e.orig.source)) {
        body.pcuSite = e.source === 'pcu' ? e.pcuSite : '';
      }
      if (e.date !== e.orig.date) body.date = e.date;

      const res = await app.fetchT('/api/lots/' + encodeURIComponent(e.lot), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, 20000);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'แก้ไขล็อตไม่สำเร็จ');

      // 🚨 ต้องล้างแคชทุกก้อนที่เกี่ยวกับตัวเลข ไม่งั้นหน้าประวัติกับหน้าสรุปยังโชว์ของเก่า
      app._lotsCache = {};
      app.invalidate();
      app.setState({ lotEdit: null, lotEditLog: [], lotEditConfirm: false, lotEditBusy: false });
      app.loadLots(true);
      app.refreshFy();
      const n = Number(data.changed || 0);
      app.toast('แก้ไขล็อต ' + e.lot + ' แล้ว', n ? 'เปลี่ยนไป ' + n + ' จุด บันทึกไว้ในประวัติการแก้ไขแล้ว' : '');
    } catch (err) {
      app.setState({ lotEditBusy: false, lotEditConfirm: false });
      app.toast(err.message || 'แก้ไขล็อตไม่สำเร็จ', '', false);
    }
  };

  // 🚨 ต้องรอให้เบราว์เซอร์วาดใบเสร็จก่อนสั่งพิมพ์ ไม่งั้นได้กระดาษเปล่า
  //    (กดปุ่มพิมพ์ทันทีหลังโหลดข้อมูลเสร็จ React ยังไม่ทันวาดลงจอ)
  app.printLotSlip = () => {
    app.setState({ slipPrintedAt: stampNow() }, () => {
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    });
  };

  // ── บันทึกเป็นไฟล์ PDF ──────────────────────────────────────────────────────
  //
  // พี่กันสั่ง 26 ส.ค. 2569: "ใช่มันต้องสร้าง pdf ได้"
  //
  // 🚨 ไม่ได้ลงตัวสร้าง PDF เพิ่มโดยตั้งใจ — ใช้ตัวแปลงที่มีอยู่ในเบราว์เซอร์แทน
  //    เหตุผล: ตัวสร้าง PDF ฝั่งจาวาสคริปต์ต้องฝังฟอนต์ไทยเข้าไปในไฟล์เอง
  //    ฟอนต์ Sarabun ชุดเต็มหนักราว 300 KB ต่อน้ำหนัก ถ้าฝัง 5 น้ำหนักคือ 1.5 MB
  //    ถ่วงเว็บทั้งใบเพื่อฟีเจอร์ที่ใช้วันละไม่กี่ครั้ง และสระไทยมักลอยผิดตำแหน่ง
  //
  //    ส่วน "บันทึกเป็น PDF" ของเบราว์เซอร์ใช้ฟอนต์ที่หน้าเว็บใช้อยู่แล้ว
  //    สระวรรณยุกต์จึงตรงเป๊ะ 100% และไม่ต้องโหลดอะไรเพิ่มเลยสักไบต์
  //
  // สิ่งที่เพิ่มให้คือ "ชื่อไฟล์" — เบราว์เซอร์ตั้งชื่อไฟล์ PDF จากชื่อหน้าเว็บ
  // ปกติจะได้ชื่อยาว ๆ ของทั้งเว็บ เปลี่ยนเป็นชื่อใบชั่วคราวแล้วคืนค่าเดิมหลังพิมพ์
  app.saveLotSlipPdf = () => {
    const slip = app.state.slipLot;
    const name = slip ? 'ใบสรุปยาคืน-' + slip.lot : 'ใบสรุปยาคืน';
    const was = document.title;
    document.title = name;
    app.setState({ slipPrintedAt: stampNow() }, () => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.print();
        // คืนชื่อเดิมหลังกล่องพิมพ์ปิด — บางเบราว์เซอร์ยังอ่านชื่ออยู่ตอน print() คืนค่า
        setTimeout(() => { document.title = was; }, 600);
      }));
    });
  };
}
