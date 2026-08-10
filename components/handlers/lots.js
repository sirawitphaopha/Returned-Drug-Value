// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
//
// 1 รอบกดบันทึก = 1 Lot มีเลขของตัวเอง (L690810-01) ฐานข้อมูลรวมยอดมาให้แล้ว
// ทำไมต้องมีหน้านี้: หน้าประวัติเป็นรายแถวยา มองไม่ออกว่า "รอบบ่ายวันนี้รับคืนไปเท่าไหร่"
// ต้องไล่บวกเอง · หน้านี้ตอบได้ในบรรทัดเดียวต่อ Lot
//
// ใบสรุปพิมพ์: แปะหน้าถุงยาที่รอตรวจ ให้เวรถัดไปรู้ว่าถุงนี้คือ Lot ไหน
//              หรือเก็บเข้าแฟ้มเป็นหลักฐานว่าวันนั้นรับคืนอะไรมาบ้าง
import { fetchT } from '../helpers';

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
      const res = await fetchT('/api/lots?range=' + encodeURIComponent(key));
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
      const res = await fetchT('/api/returns?range=fy&q=&lot=' + encodeURIComponent(lot.lot));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านรายการใน Lot ไม่สำเร็จ');
      app.setState({ slipRows: data.rows || [], slipLoading: false });
    } catch (e) {
      app.setState({ slipLot: null, slipLoading: false });
      app.toast(e.message || 'อ่านรายการใน Lot ไม่สำเร็จ', '', false);
    }
  };

  app.closeLotSlip = () => app.setState({ slipLot: null, slipRows: [] });

  // 🚨 ต้องรอให้เบราว์เซอร์วาดใบเสร็จก่อนสั่งพิมพ์ ไม่งั้นได้กระดาษเปล่า
  //    (กดปุ่มพิมพ์ทันทีหลังโหลดข้อมูลเสร็จ React ยังไม่ทันวาดลงจอ)
  app.printLotSlip = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };
}
