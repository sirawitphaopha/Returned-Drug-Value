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
      // จำลายเซ็นของคลังยาชุดที่เพิ่งได้มา — ใช้เทียบทีหลังว่ามีใครแก้ยาไปแล้วหรือยัง
      app._drugRev = data.drugRev || null;

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

  // ── คลังยาซิงก์ข้ามเว็บ ────────────────────────────────────────────────────
  // ตาราง drugs ใช้ร่วมกัน 3 เว็บ · เภสัชกรแก้ยาที่ ME-DRP แล้วเว็บนี้ต้องเห็นด้วย
  // ไม่ต่อ Supabase realtime ตรง ๆ เพราะต้องเอากุญแจไปไว้ในเบราว์เซอร์
  // ซึ่งขัดกฎเหล็กข้อ 6 ของโปรเจกต์นี้ → ถามหลังบ้านตัวเองแทน (พี่กันเคาะ 13 ส.ค. 2569)
  //
  // ถามแค่ "ลายเซ็น" (ตัวเลข 2 ตัว) ไม่ได้ลากยา 417 ตัวมาทุกครั้ง
  // ลายเซ็นเปลี่ยนเมื่อไหร่ค่อยดึงของจริง
  app._drugRev = null;

  app.syncDrugs = async (force) => {
    if (app.state.demo) return;        // โหมดตัวอย่างไม่ยุ่งกับของจริง
    try {
      const res = await fetchT('/api/drugs/rev');
      if (!res.ok) return;
      const sig = await res.json();
      const key = sig.rev + ':' + sig.count;

      // ลายเซ็นตั้งต้นมาพร้อมรายการยาจาก boot() แล้ว ตรงนี้จึงเทียบได้เลย
      // (ถ้ายังไม่มี = boot ยังไม่เสร็จ ปล่อยผ่านไปก่อน เดี๋ยวรอบหน้าค่อยเทียบ)
      if (app._drugRev === null) { app._drugRev = key; return; }
      if (key === app._drugRev && !force) return;
      app._drugRev = key;

      const dres = await fetchT('/api/drugs');
      if (!dres.ok) return;
      const data = await dres.json();
      const list = Array.isArray(data.drugs) ? data.drugs : null;
      if (!list) return;

      // 🚨 ต้องล้างแคชในเครื่องด้วย ไม่งั้นรีเฟรชแล้วของเก่ากลับมาอีก (แคชอายุ 12 ชม.)
      writeCache(LS.drugs, list);
      app.setState({ drugs: list });
      app.toast('คลังยามีการแก้ไข อัปเดตให้แล้ว', '', true);
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
