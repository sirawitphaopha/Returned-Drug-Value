// โหลดข้อมูลตั้งต้นจากเซิร์ฟเวอร์ แล้วทับของที่กู้มาจากเครื่อง
import { LS, writeCache } from '../helpers';

export function dataActions(app) {
  // แคชประวัติกับยอดสรุปอยู่ในหน่วยความจำเท่านั้น ไม่ลงเครื่อง
  // ตัวเลข KPI เก่าค้างบนจอแย่กว่ารอโหลดอีกนิด
  app._histCache = {};
  app._sumCache = null;

  // ล้างแคชทั้งสองก้อนพร้อมกันทุกครั้งที่ข้อมูลเปลี่ยน (บันทึก/แก้/ลบ)
  // ถ้าล้างแค่ก้อนเดียว ตัวเลขหน้าประวัติกับหน้าสรุปจะหลุดจากกัน
  app.invalidate = () => {
    app._histCache = {};
    app._sumCache = null;
  };

  app.boot = async () => {
    try {
      const res = await fetch('/api/bootstrap');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลตั้งต้นไม่สำเร็จ');

      writeCache(LS.drugs, data.drugs);
      writeCache(LS.setting, data.setting);

      app.setState({
        drugs: data.drugs,
        today: data.today,
        // วันที่บันทึกตั้งเป็นวันนี้เสมอตอนเปิดเว็บ ถ้าผู้ใช้เปลี่ยนเองระหว่างใช้งานถึงจะค้างไว้
        date: app.state.date || data.today,
        fyYear: data.fyYear,
        fy: data.fy,
        orgName: data.setting.orgName,
        favIds: data.setting.favIds,
        defaultSource: data.setting.defaultSource,
        source: app.state.source || data.setting.defaultSource
      });
    } catch (e) {
      // ถ้าโหลดไม่ได้ ยังใช้ของที่แคชไว้ต่อได้ แค่บอกให้รู้
      app.toast('โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ', '', false);
    }
  };

  // ดึงยอดสะสมปีงบใหม่ — เรียกหลังบันทึก/แก้/ลบ
  app.refreshFy = async () => {
    try {
      const res = await fetch('/api/bootstrap');
      const data = await res.json();
      if (res.ok) app.setState({ fy: data.fy });
    } catch (e) {}
  };
}
