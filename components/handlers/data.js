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
      const res = await app.fetchT('/api/bootstrap');
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
        // 🚨 ห้ามติ๊กชื่อคนล่าสุดไว้ให้ — ต้องเลือกเองทุกครั้งที่เปิดเว็บ (พี่กันสั่ง 25 ส.ค. 2569)
        // เดิมติ๊กคนที่เซ็นล่าสุดไว้เพื่อความเร็ว แต่คอมห้องยาเป็นเครื่องกลางที่ใช้ร่วมกัน
        // คนถัดไปที่มานั่งจะเห็นชื่อคนก่อนติ๊กอยู่ กดบันทึกโดยไม่ทันสังเกต
        // = ล็อตนั้นเซ็นในชื่อคนอื่น สืบกลับผิดคน
        // (ยังจำ lastRecorder ไว้ในฐานอยู่ ใช้ที่อื่นได้ แค่ไม่เอามาติ๊กให้)
        recorder: app.state.recorder || '',
        defaultSource: data.setting.defaultSource,
        // เดิมเขียน app.state.source || ... ซึ่งไม่มีวันหลุดไปฝั่งขวา เพราะ source
        // ตั้งต้นเป็น 'opd' ที่เป็นค่าจริงเสมอ → หอผู้ป่วยตั้งค่าเริ่มต้นไว้แล้วก็ไม่เคยได้ใช้
        source: app.state.sourceTouched ? app.state.source : data.setting.defaultSource
      });
      // ทวนวันทันทีหลังรู้ว่าวันนี้คือวันไหน — ร่างที่กู้มาอาจค้างวันเก่าข้ามวัน
      // ถ้ารอตัวจับเวลา 1 นาที ผู้ใช้จะเห็นวันเก่าค้างอยู่นาทีแรกแล้วบันทึกผิดวันได้
      app.checkDayRollover();
      // ทวนชื่อยาในร่างให้ตรงกับคลังยาชุดล่าสุด
      app.refreshDraftNames(data.drugs);
    } catch (e) {
      // ถ้าโหลดไม่ได้ ยังใช้ของที่แคชไว้ต่อได้ แค่บอกให้รู้
      app.toast('โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ', '', false);
    }
  };

  // ── ทวนชื่อยาในร่างให้ตรงกับคลังยาชุดล่าสุด ────────────────────────────────
  // พี่กันทัก 25 ส.ค. 2569: กรอกยาค้างไว้ก่อน แล้วชื่อยาในระบบถูกแก้ทีหลัง
  // (เปลี่ยนชื่อการค้า · เปลี่ยนหน่วย · เปลี่ยนสูตรประกอบชื่อ) แถวในร่างยังค้างชื่อเก่า
  // ทั้งที่ยังไม่ได้บันทึก จึงยังไม่มีเหตุผลให้แช่ชื่อไว้
  //
  // 🚨 ทำเฉพาะแถวที่ "ยังไม่บันทึก" เท่านั้น — แถวที่เข้าฐานแล้วห้ามแตะเด็ดขาด
  //    ชื่อกับราคาในแถวที่บันทึกแล้วคือหลักฐาน ณ วันนั้น (กฎเหล็กข้อ 12)
  // 🚨 อัปเดตแค่ชื่อกับหน่วย ไม่แตะราคา — ราคาถูกล็อกไว้ตั้งแต่ตอนกดเลือกยา
  //    ถ้าอัปเดตราคาด้วย ของที่กรอกค้างข้ามวันจะเปลี่ยนมูลค่าเองโดยผู้ใช้ไม่รู้ตัว
  app.refreshDraftNames = (drugs) => {
    const rows = app.state.rows;
    if (!rows.length || !Array.isArray(drugs) || !drugs.length) return;
    const byId = new Map(drugs.map((d) => [d.id, d]));
    let changed = false;
    const next = rows.map((r) => {
      const d = byId.get(r.drugId);
      if (!d || (d.name === r.name && d.unit === r.unit)) return r;
      changed = true;
      return Object.assign({}, r, { name: d.name, unit: d.unit });
    });
    if (changed) app.persist({ rows: next });
  };

  // ดึงยอดสะสมปีงบใหม่ — เรียกหลังบันทึก/แก้/ลบ
  // ใช้ /api/summary ไม่ใช่ /api/bootstrap เพราะ bootstrap ลากยา 417 ตัวมาด้วยทุกครั้ง
  // ทั้งที่ต้องการแค่ตัวเลข 4 ตัว
  app.refreshFy = async () => {
    if (app.state.demo) return;
    try {
      const res = await app.fetchT('/api/summary');
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
      const res = await app.fetchT('/api/drugs/rev');
      if (!res.ok) return;
      const sig = await res.json();
      const key = sig.rev + ':' + sig.count;

      // ลายเซ็นตั้งต้นมาพร้อมรายการยาจาก boot() แล้ว ตรงนี้จึงเทียบได้เลย
      // (ถ้ายังไม่มี = boot ยังไม่เสร็จ ปล่อยผ่านไปก่อน เดี๋ยวรอบหน้าค่อยเทียบ)
      if (app._drugRev === null) { app._drugRev = key; return; }
      if (key === app._drugRev && !force) return;
      app._drugRev = key;

      const dres = await app.fetchT('/api/drugs');
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
    // เลื่อนวันในช่องให้ด้วย ถ้าเดิมยังเป็น "วันนี้" (ไม่ได้ตั้งใจย้อนวัน)
    // หรือถ้าค้างเป็นวันในอดีต — เกิดจากร่างเก่าใน localStorage ที่กู้มาข้ามวัน
    // 🚨 เดิมเช็คแค่ wasToday ทำให้ร่างที่ค้างข้ามวันติดวันเก่าถาวร
    //    เปิดเว็บวันที่ 19 แต่ช่องวันที่ยังเป็น 10 (พี่กันเจอเอง 19 ส.ค. 2569)
    const wasToday = app.state.date === app.state.today;
    const isPast = app.state.date && app.state.date < now;
    app.setState({ today: now, date: (wasToday || isPast) ? now : app.state.date });
    app.invalidate();
  };
}
