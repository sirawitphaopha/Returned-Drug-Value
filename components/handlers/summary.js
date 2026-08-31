// หน้าสรุป — ดึงยอดทั้งปีงบก้อนเดียว · ส่งออกไฟล์ Excel
// ยอดรวมทุกตัวคิดใน SQL แล้ว ที่นี่แค่รับมาเก็บ
import { fyOf } from '@/lib/format';
import { SS, fetchT } from '../helpers';
import { recordsToCsv, downloadCsv } from '@/lib/csv';


export function summaryActions(app) {
  // เลขลำดับคำขอ แบบเดียวกับหน้าประวัติ — กดสรุป→ประวัติ→สรุปเร็วๆ จะยิงซ้อนกัน
  // ถ้ารอบแรกกลับทีหลังจะทับตัวเลขรอบใหม่ แล้วเขียนของเก่าลงแคชค้างอีก 60 วินาที
  app._sumSeq = 0;

  app.loadSummary = async (force) => {
    if (app.state.demo) return;      // โหมดตัวอย่างคิดยอดไว้แล้วตอนเปิดโหมด
    // กุญแจต้องมีปีงบอยู่ด้วย ไม่งั้นสลับปีแล้วได้ตัวเลขปีเก่ากลับมา
    const fyKey = String(app.state.sumFy || 'now');
    const c = app._sumCache && app._sumCache.fy === fyKey
      ? app._sumCache
      : app.boxGet(SS.sum, fyKey, null);
    if (!force && c && c.fy === fyKey) {
      app._sumCache = c;
      app.setState({ sum: c.data, sumLoading: false });
      return;
    }

    const seq = ++app._sumSeq;
    app.setState({ sumLoading: true });
    try {
      const fy = app.state.sumFy;
      const res = await app.fetchT('/api/summary' + (fy ? '?fy=' + fy : ''));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านยอดสรุปไม่สำเร็จ');
      if (seq !== app._sumSeq) return;

      app.clearLoadErr('sum');
      app._sumCache = { ts: Date.now(), fy: fyKey, data: data };
      app.boxSet(SS.sum, fyKey, null, app._sumCache);
      // /api/summary ส่ง today มาด้วย — ใช้เป็นตาข่ายรับกรณี /api/bootstrap ล่ม
      // ไม่งั้น today ค้างเป็นค่าว่างตลอด แล้วป้ายปีงบเพี้ยนทั้งหน้า
      const patch = { sum: data, sumLoading: false };
      if (!app.state.today && data.today) {
        patch.today = data.today;
        if (!app.state.date) patch.date = data.today;
      }
      patch.sumFyYears = Array.isArray(data.fyYears) ? data.fyYears : [];
      app.setState(patch);
    } catch (e) {
      if (seq !== app._sumSeq) return;
      app.setState({ sumLoading: false });
      // 🚨 ต้องปักธงไว้ด้วย ไม่ใช่แค่เด้งข้อความที่หายเองใน 2 วินาที
      //    ไม่งั้นหน้าจอจะวาด ฿0.00 ทุกช่องค้างไว้ ราวกับว่าปีนี้ยังไม่มีใครคืนยาเลย
      app.markLoadErr('sum', 'โหลดยอดสรุปไม่สำเร็จ');
      app.toast('อ่านยอดสรุปไม่สำเร็จ', '', false);
    }
  };

  // เลือกปีงบย้อนหลัง — เดิมดูได้แค่ปีงบปัจจุบัน พอขึ้นปีใหม่ตัวเลขปีเก่าหายหมด
  app.setSumFy = (fy) => {
    if (fy === app.state.sumFy) return;
    app._sumCache = null;
    app.setState({ sumFy: fy, sum: null }, () => {
      app.loadSummary(true);
      app.loadTopReturned();
    });
  };

  // ยาที่ถูกคืนบ่อยที่สุด — เรียงตามจำนวนครั้ง ไม่ใช่มูลค่า
  // ยาตัวไหนถูกคืนบ่อยมาก = อาจสั่งเกินจำเป็น เอาไปคุยกับแพทย์ลดการสั่งได้
  app.loadTopReturned = async () => {
    if (app.state.demo) return;
    try {
      const fy = app.state.sumFy;
      const res = await app.fetchT('/api/top-returned' + (fy ? '?fy=' + fy : ''));
      const data = await res.json();
      if (!res.ok) return;
      app.setState({ topReturned: data.items || [] });
    } catch (e) { /* ไม่ใช่ข้อมูลหลัก โหลดไม่ได้ก็ข้ามไป */ }
  };

  // มอคอัปมีรายการทั้งปีอยู่ในเครื่องอยู่แล้ว เลยสร้างไฟล์ได้ทันที
  // ของจริงต้องขอรายการทั้งปีงบจากเซิร์ฟเวอร์ก่อน แล้วค่อยประกอบไฟล์ในเครื่อง
  app.exportCsv = async () => {
    if (app.state.exporting) return;
    app.setState({ exporting: true });
    try {
      // 🚨 ต้องส่งปีงบที่กำลังดูไปด้วย ไม่งั้นได้ข้อมูลปีปัจจุบันเสมอ (ผลตรวจข้อ ส-4)
    const fyNow = Number(app.state.sumFy || (app.state.sum ? app.state.sum.fyYear : 0) || 0);
    const res = await app.fetchT('/api/returns?range=fy&limit=all' + (fyNow ? '&fy=' + fyNow : ''));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ส่งออกไฟล์ไม่สำเร็จ');

      const rows = data.rows || [];
      if (!rows.length) {
        app.setState({ exporting: false });
        app.toast('ยังไม่มีรายการให้ส่งออก', '', false);
        return;
      }

      const st = app.state;
      const fyLabel = String(st.sumFy || (st.sum && st.sum.fyYear) || fyOf(st.today));
      downloadCsv(
        recordsToCsv(rows, {
          orgName: st.orgName,
          fyLabel: fyLabel,
          rangeLabel: st.sum ? (st.sum.from + ' ถึง ' + st.sum.to) : '',
          printedOn: st.today
        }),
        'มูลค่ายาคืน-ปีงบ' + fyLabel + '.csv'
      );
      app.setState({ exporting: false });
      app.toast('ส่งออกไฟล์แล้ว', rows.length.toLocaleString('en-US') + ' รายการ');
    } catch (e) {
      app.setState({ exporting: false });
      app.toast('ส่งออกไฟล์ไม่สำเร็จ', '', false);
    }
  };
}
