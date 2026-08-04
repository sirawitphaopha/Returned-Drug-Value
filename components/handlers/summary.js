// หน้าสรุป — ดึงยอดทั้งปีงบก้อนเดียว · ส่งออกไฟล์ Excel
// ยอดรวมทุกตัวคิดใน SQL แล้ว ที่นี่แค่รับมาเก็บ
import { fyOf } from '@/lib/format';
import { recordsToCsv, downloadCsv } from '@/lib/csv';

const SUM_TTL = 60000;

export function summaryActions(app) {
  app.loadSummary = async (force) => {
    const c = app._sumCache;
    if (!force && c && Date.now() - c.ts < SUM_TTL) {
      app.setState({ sum: c.data, sumLoading: false });
      return;
    }

    app.setState({ sumLoading: true });
    try {
      const res = await fetch('/api/summary');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านยอดสรุปไม่สำเร็จ');

      app._sumCache = { ts: Date.now(), data: data };
      app.setState({ sum: data, sumLoading: false });
    } catch (e) {
      app.setState({ sumLoading: false });
      app.toast('อ่านยอดสรุปไม่สำเร็จ', '', false);
    }
  };

  app.setLight = () => app.persist({ dark: false });
  app.setDark = () => app.persist({ dark: true });

  // มอคอัปมีรายการทั้งปีอยู่ในเครื่องอยู่แล้ว เลยสร้างไฟล์ได้ทันที
  // ของจริงต้องขอรายการทั้งปีงบจากเซิร์ฟเวอร์ก่อน แล้วค่อยประกอบไฟล์ในเครื่อง
  app.exportCsv = async () => {
    if (app.state.exporting) return;
    app.setState({ exporting: true });
    try {
      const res = await fetch('/api/returns?range=fy&limit=all');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ส่งออกไฟล์ไม่สำเร็จ');

      const rows = data.rows || [];
      if (!rows.length) {
        app.setState({ exporting: false });
        app.toast('ยังไม่มีรายการให้ส่งออก', '', false);
        return;
      }

      downloadCsv(recordsToCsv(rows), 'มูลค่ายาคืน-ปีงบ' + fyOf(app.state.today) + '.csv');
      app.setState({ exporting: false });
      app.toast('ส่งออกไฟล์แล้ว', rows.length.toLocaleString('en-US') + ' รายการ');
    } catch (e) {
      app.setState({ exporting: false });
      app.toast('ส่งออกไฟล์ไม่สำเร็จ', '', false);
    }
  };
}
