// โหลดข้อมูลตั้งต้นจากเซิร์ฟเวอร์ แล้วทับของที่กู้มาจากเครื่อง
import { LS, writeCache, fetchT } from '../helpers';
import { todayISO } from '@/lib/format';

export function dataActions(app) {
  // แคชประวัติกับยอดสรุปอยู่ในหน่วยความจำเท่านั้น ไม่ลงเครื่อง
  // ตัวเลข KPI เก่าค้างบนจอแย่กว่ารอโหลดอีกนิด
  app._histCache = {};
  app._sumCache = null;

  // ล้างแคชทั้งสองก้อนพร้อมกันทุกครั้งที่ข้อมูลเปลี่ยน (บันทึก/แก้/ลบ)
  // ถ้าล้างแค่ก้อนเดียว ตัวเลขหน้าประวัติกับหน้าสรุปจะหลุดจากกัน
  // ขยับเลขลำดับด้วย เพื่อตัดคำขอที่ยิงไปแล้วยังไม่กลับ ไม่งั้นคำตอบเก่า
  // (ที่ยังมีแถวซึ่งเพิ่งถูกลบไป) จะกลับมาเขียนแคชทับของใหม่
  app.invalidate = () => {
    app._histCache = {};
    app._sumCache = null;
    app._histSeq++;
    app._sumSeq++;
  };

  app.boot = async () => {
    if (app.state.demo) return;      // โหมดตัวอย่างไม่ดึงของจริงมาทับ
    try {
      const res = await fetchT('/api/bootstrap');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลตั้งต้นไม่สำเร็จ');

      writeCache(LS.drugs, data.drugs);
      writeCache(LS.setting, data.setting);

      app.setState({
        drugs: data.drugs,
        // รหัสยาที่คืนบ่อย — ช่องค้นหาใช้ดันตัวที่ใช้บ่อยขึ้นก่อน
        hotIds: Array.isArray(data.hotIds) ? data.hotIds : [],
        today: data.today,
        // เว็บล็อกด้วยรหัสผ่านห้องยาอยู่ไหม — ใช้ตัดสินว่าจะโชว์ปุ่มออกจากระบบ
        authOn: data.authOn === true,
        // วันที่บันทึกตั้งเป็นวันนี้เสมอตอนเปิดเว็บ ถ้าผู้ใช้เปลี่ยนเองระหว่างใช้งานถึงจะค้างไว้
        date: app.state.date || data.today,
        fyYear: data.fyYear,
        fy: data.fy,
        orgName: data.setting.orgName,
        favIds: data.setting.favIds,
        staff: Array.isArray(data.setting.staff) ? data.setting.staff : [],
        // ติ๊กคนที่เซ็นชื่อล่าสุดไว้ให้เลย ครั้งต่อไปกดยืนยันอย่างเดียว
        recorder: app.state.recorder || data.setting.lastRecorder || '',
        defaultSource: data.setting.defaultSource,
        // เดิมเขียน app.state.source || ... ซึ่งไม่มีวันหลุดไปฝั่งขวา เพราะ source
        // ตั้งต้นเป็น 'opd' ที่เป็นค่าจริงเสมอ → หอผู้ป่วยตั้งค่าเริ่มต้นไว้แล้วก็ไม่เคยได้ใช้
        source: app.state.sourceTouched ? app.state.source : data.setting.defaultSource
      });
    } catch (e) {
      // ถ้าโหลดไม่ได้ ยังใช้ของที่แคชไว้ต่อได้ แค่บอกให้รู้
      app.toast('โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ', '', false);
    }
  };

  // ดึงยอดสะสมปีงบใหม่ — เรียกหลังบันทึก/แก้/ลบ
  // ใช้ /api/summary ไม่ใช่ /api/bootstrap เพราะ bootstrap ลากยา 417 ตัวมาด้วยทุกครั้ง
  // ทั้งที่ต้องการแค่ตัวเลข 4 ตัว
  app.refreshFy = async () => {
    if (app.state.demo) return;
    try {
      const res = await fetchT('/api/summary');
      const data = await res.json();
      if (!res.ok) return;
      app.setState({
        fy: {
          saved: Number(data.saved || 0),
          lost: Number(data.lost || 0),
          records: Number(data.records || 0),
          qty: Number(data.qty || 0)
        }
      });
    } catch (e) {}
  };

  // คอมห้องยาเปิดเว็บค้างข้ามคืนเป็นเรื่องปกติ ถ้าไม่ทวนวัน ยาที่คืนเช้าวันใหม่
  // จะลงวันเมื่อวานทั้งวัน และถ้าเป็นคืน 30 ก.ย. ต่อ 1 ต.ค. จะตกผิดปีงบด้วย
  app.checkDayRollover = () => {
    const now = todayISO();
    if (!app.state.today || app.state.today === now) return;
    const wasToday = app.state.date === app.state.today;
    app.setState({ today: now, date: wasToday ? now : app.state.date });
    app.invalidate();
  };
}
