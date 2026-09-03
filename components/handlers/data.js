// โหลดข้อมูลตั้งต้นจากเซิร์ฟเวอร์ แล้วทับของที่กู้มาจากเครื่อง
import { logFail } from '@/lib/clientLog';
import { LS, SS, writeCache, readSS, writeSS, clearSS, clearAllSS, writeLS, fetchT, myTabId, tabAlive } from '../helpers';
import { todayISO } from '@/lib/format';

export function dataActions(app) {
  // แคชประวัติกับยอดสรุปอยู่ในหน่วยความจำเท่านั้น ไม่ลงเครื่อง
  // ตัวเลข KPI เก่าค้างบนจอแย่กว่ารอโหลดอีกนิด
  app._histCache = {};
  app._sumCache = null;

  // ล้างของที่โหลดมาทั้งหมด — ทั้งในหน่วยความจำและในที่เก็บของแท็บ
  // ล้างทุกก้อนพร้อมกันเสมอ ถ้าล้างแค่ก้อนเดียว ตัวเลขหน้าประวัติกับหน้าสรุปจะหลุดจากกัน
  // ขยับเลขลำดับด้วย เพื่อตัดคำขอที่ยิงไปแล้วยังไม่กลับ ไม่งั้นคำตอบเก่า
  // (ที่ยังมีแถวซึ่งเพิ่งถูกลบไป) จะกลับมาเขียนแคชทับของใหม่
  //
  // 🚨 แยกจาก invalidate() โดยตั้งใจ ตัวนี้ "ไม่" ประทับว่าเป็นการกระทำของเราเอง
  //    ใช้ตอนรู้ว่าเครื่องอื่นแก้ข้อมูล ซึ่งต้องขึ้นข้อความบอกผู้ใช้ด้วย
  app.dropCache = () => {
    app._histCache = {};
    app._sumCache = null;
    // 🚨 แคชรายการ Lot ต้องล้างด้วย (ผลตรวจข้อ ต-7) — เดิมลืมไว้ก้อนเดียว
    //    บันทึก Lot ใหม่แล้วเข้าหน้ารายการ Lot จะไม่เห็นของที่เพิ่งบันทึกไปอีก 60 วินาที
    //    นึกว่าบันทึกไม่ติด แล้วกดบันทึกซ้ำ
    if (app._lotsCache) app._lotsCache = {};
    app._histSeq++;
    app._sumSeq++;
    // 🚨 ต้องล้างที่เก็บของแท็บด้วย ไม่งั้นรีเฟรชแล้วของเก่ากลับมาอีก
    //    (ของในนั้นไม่มีวันหมดอายุด้วยเวลา ตัวล้างมีแค่ตรงนี้กับลายเซ็น)
    clearAllSS();
  };

  // การกระทำของเราเอง (บันทึก/แก้/ลบ) — ล้างแคชแล้วประทับเวลาไว้
  // ตัวถามลายเซ็นจะได้รู้ว่าความเปลี่ยนแปลงที่เจอเป็นฝีมือเราเอง ไม่ใช่เครื่องอื่น
  // แล้วไม่ต้องขึ้นข้อความว่า "มีข้อมูลใหม่จากเครื่องอื่น" ให้งง
  app.invalidate = () => {
    app._ownAt = Date.now();
    app.dropCache();

    // 🚨 รีบไปจำลายเซ็นชุดใหม่ทันที ไม่ต้องรอตัวจับเวลารอบถัดไป
    //    ถ้าไม่ทำ ตัวถามลายเซ็นจะเห็นว่า "ข้อมูลเปลี่ยน" แล้วเด้งข้อความ
    //    "มีข้อมูลใหม่จากเครื่องอื่น" ทั้งที่เป็นล็อตที่เราเพิ่งกดบันทึกเอง
    //
    // หน่วง 1.2 วินาที เพราะลบหลายรายการติด ๆ กันจะเรียกตรงนี้รัวหลายรอบ
    // และเผื่อให้ฐานข้อมูลบันทึกเสร็จก่อนไปถาม
    if (app._ownTimer) clearTimeout(app._ownTimer);
    app._ownTimer = setTimeout(() => { app.pulse({ quiet: true }); }, 1200);
  };

  // ── ของที่โหลดมาแล้ว เก็บสองที่พร้อมกัน ────────────────────────────────
  // หน่วยความจำ = เร็ว · ที่เก็บของแท็บ = รอดการรีเฟรช (พี่กันสั่งไว้ 27 ส.ค. 2569)
  //
  // 🚨 ไม่มีวันหมดอายุด้วยเวลา — เดิมตั้งไว้ 60 วินาที ซึ่งเป็นตัวเลขที่เดาเอา
  //    ตัวล้างที่ถูกต้องคือ "ข้อมูลจริงเปลี่ยนหรือยัง" ซึ่งลายเซ็นตอบได้ตรงกว่า
  //
  // 🚨 โหมดดูตัวอย่างห้ามเขียนลงที่เก็บของแท็บ ข้อมูลปลอมจะค้างข้ามการรีเฟรช
  app.boxGet = (base, key, mem) => {
    if (mem && mem[key]) return mem[key];
    if (app.state.demo) return null;
    const v = readSS(base + ':' + key);
    if (v && mem) mem[key] = v;
    return v;
  };

  app.boxSet = (base, key, mem, val) => {
    if (mem) mem[key] = val;
    if (app.state.demo) return;
    writeSS(base + ':' + key, val);
  };

  // ── ร่างที่กรอกค้าง เก็บขึ้นเซิร์ฟเวอร์ด้วย (พี่กันสั่ง 31 ส.ค. 2569) ────────
  //
  //   "สิ่งที่เรากลัวที่สุด คือกรอกไปชั่วโมงนึง แล้วเน็ตหลุด และกรอกไปแล้วคอมรีสตาร์ต"
  //
  // ของเดิมร่างอยู่ในเครื่องเดียว รอดเน็ตหลุด รอดคอมรีสตาร์ต รอดรีเฟรช
  // แต่ไม่รอดฮาร์ดดิสก์เสีย ไม่รอดการล้างข้อมูลเบราว์เซอร์ และย้ายเครื่องไม่ได้
  //
  // 🚨 ยังเก็บในเครื่องเหมือนเดิมทุกอย่าง ตรงนี้เป็นสำเนาสำรองอีกชั้น
  //    เน็ตหลุดก็กรอกต่อได้ปกติ แล้วค่อยส่งขึ้นตอนเน็ตกลับมา
  app._draftTimer = null;

  app.pushDraft = () => {
    const st = app.state;
    if (st.demo) return;                       // โหมดตัวอย่างห้ามแตะของจริง
    if (!st.deviceId) return;                  // ยังไม่ได้เลือกเครื่อง เก็บในเครื่องอย่างเดียว

    // 🚨 หน่วงก่อนส่งเสมอ — กรอกยา 1 รายการทำให้ persist ทำงานหลายรอบ
    //    ถ้าส่งทุกรอบจะได้คำขอเป็นร้อยครั้งต่อการกรอกล็อตเดียว
    if (app._draftTimer) clearTimeout(app._draftTimer);
    app._draftTimer = setTimeout(() => {
      const now = app.state;
      app.fetchT('/api/drafts', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          deviceId: now.deviceId,
          tabId: myTabId(),
          rows: now.rows,
          batchId: now.batchId || '',
          hn: now.hn || '',
          source: now.source || '',
          pcuSite: now.pcuSite || '',
          date: now.date || '',
          saveFailed: !!now.saveFailed,
          failedBy: now.failedBy || ''
        })
      }, 12000).catch(() => {
        // 🚨 ส่งไม่ขึ้นไม่ใช่เรื่องใหญ่ ร่างยังอยู่ในเครื่องครบ
        //    เน็ตกลับมาเมื่อไหร่ การแตะครั้งถัดไปจะส่งขึ้นให้เอง
      });
    }, 2000);
  };

  // ── ดึงรายการร่างจากเซิร์ฟเวอร์ ────────────────────────────────────────
  // คืนทั้งของเครื่องนี้และเครื่องอื่น ฝั่งจอเป็นคนเลือกว่าจะโชว์อะไร
  app.loadServerDrafts = async () => {
    const st = app.state;
    if (st.demo || !st.deviceId) return;
    try {
      const u = '/api/drafts?device=' + encodeURIComponent(st.deviceId) +
        '&tab=' + encodeURIComponent(myTabId());
      const res = await app.fetchT(u, {}, 12000);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.drafts)) return;

      // 🚨🔴 ต้องตัด 2 อย่างออก ไม่ใช่แค่ของตัวเอง
      //
      //    ① ร่างของหน้าต่างนี้เอง — ไม่งั้นเห็นของตัวเองเป็นของค้าง
      //    ② ร่างของหน้าต่างอื่นในเครื่องเดียวกันที่ ยังเปิดอยู่
      //       นั่นคือของที่คนอื่นกำลังกรอกอยู่ตรงหน้า ห้ามเสนอให้ใครเอาไปเด็ดขาด
      //
      //    เซิร์ฟเวอร์ไม่มีทางรู้ว่าหน้าต่างไหนยังเปิดอยู่ (ทะเบียนอยู่ในเครื่อง)
      //    การกรองจึงต้องทำฝั่งนี้ · เทสจับได้ตอนเปิดหน้าต่างที่ 4
      //    แล้วเห็นร่างของ 3 หน้าต่างที่กำลังกรอกอยู่ = ปัญหาเดิมกลับมาทางเซิร์ฟเวอร์
      const others = data.drafts.filter((d) => {
        if (d.self) return false;
        if (d.mine && tabAlive(d.tab_id)) return false;
        return true;
      });
      // 🚨🔴 ต้องเช็คโหมดตัวอย่าง "อีกครั้ง" ตรงนี้ ไม่ใช่แค่ตอนเริ่มฟังก์ชัน
      //    คำขอนี้ใช้เวลาเดินทาง ระหว่างนั้นผู้ใช้กดเปิดโหมดตัวอย่างได้
      //    คำตอบที่กลับมาทีหลังจะทับร่างตัวอย่างที่เพิ่งตั้งไว้จนหายเกลี้ยง
      //    (เจอจากภาพถ่ายหน้าจอจริง แถบขึ้นล็อตเดียวทั้งที่ตั้งไว้ 4 ล็อต)
      //    ตระกูลเดียวกับบั๊ก "คำตอบเก่าทับสิ่งที่ผู้ใช้กำลังพิมพ์" ในข้อ 3.50
      if (app.state.demo) return;
      app.setState({ serverDrafts: others, keepDays: data.keepDays || 7 });
    } catch (e) { logFail('loadServerDrafts (ร่างที่ค้างบนเซิร์ฟเวอร์)', e); }
  };

  // ลบร่างของหน้าต่างนี้ออกจากเซิร์ฟเวอร์ — ใช้ตอนบันทึกสำเร็จหรือกดล้าง
  app.dropServerDraft = (deviceId, tabId) => {
    const dev = deviceId || app.state.deviceId;
    const tab = tabId || myTabId();
    if (!dev || app.state.demo) return Promise.resolve();
    return app.fetchT('/api/drafts?device=' + encodeURIComponent(dev) +
      '&tab=' + encodeURIComponent(tab), { method: 'DELETE' }, 12000).catch(() => {});
  };

  // ── ตั้งชื่อเครื่อง ────────────────────────────────────────────────────
  // 🚨 เลือกครั้งเดียวตอนเปิดเว็บครั้งแรก แล้วอยู่ยาว แก้ได้ในหน้าตั้งค่า
  app.pickDevice = (name) => {
    const v = String(name || '').trim();
    if (!v) return;
    writeLS(LS.device, v);
    app.setState({ deviceId: v, deviceAsk: false }, () => {
      app.loadServerDrafts();
      app.pushDraft();          // มีของค้างอยู่แล้วก็ส่งขึ้นเลย
      app.toast('ตั้งชื่อเครื่องแล้ว', v);
    });
  };

  // เปิดจากหน้าตั้งค่า — ต้องปิดหน้าตั้งค่าด้วย ไม่งั้นสองหน้าต่างซ้อนกัน
  app.openDeviceAsk = () => app.setState({ deviceAsk: true, deviceKind: 0, devicePick: '', settingsOpen: false });
  app.setDeviceKind = (n) => app.setState({ deviceKind: n, devicePick: '' });
  app.setDevicePick = (v) => app.setState({ devicePick: v });

  // ── ธงโหลดไม่สำเร็จรายหน้า ────────────────────────────────────────────────
  // ตัวเดียวใช้ทุกหน้า ไม่ต้องเพิ่ม state ใหม่ทุกครั้งที่มีหน้าใหม่
  app.markLoadErr = (key, msg) => {
    const cur = app.state.loadErr || {};
    if (cur[key] === msg) return;
    app.setState({ loadErr: Object.assign({}, cur, { [key]: msg || 'โหลดข้อมูลไม่สำเร็จ' }) });
  };

  app.clearLoadErr = (key) => {
    const cur = app.state.loadErr || {};
    if (!cur[key]) return;      // ไม่มีอะไรให้ล้าง อย่าสั่งวาดจอใหม่เปล่า ๆ
    app.setState({ loadErr: Object.assign({}, cur, { [key]: '' }) });
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
        pcuSites: Array.isArray(data.setting.pcuSites) ? data.setting.pcuSites : [],
        pcuFull: data.setting.pcuFull || {},
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
    } catch (e) { logFail('refreshFy (ยอดสะสมปีงบ ตอนเปิดเว็บ)', e); }
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

      await app.pullDrugs();
    } catch (e) { logFail('syncDrugs (ถามลายเซ็นคลังยา)', e); }
  };

  // ดึงรายการยาชุดใหม่มาทับ — ใช้ร่วมกันระหว่าง syncDrugs กับตัวถามลายเซ็น
  app.pullDrugs = async () => {
    try {
      const dres = await app.fetchT('/api/drugs');
      if (!dres.ok) return;
      const data = await dres.json();
      const list = Array.isArray(data.drugs) ? data.drugs : null;
      if (!list) return;

      // 🚨 ต้องล้างแคชในเครื่องด้วย ไม่งั้นรีเฟรชแล้วของเก่ากลับมาอีก (แคชอายุ 12 ชม.)
      writeCache(LS.drugs, list);
      // คลังยาดิบในที่เก็บของแท็บก็เก่าไปแล้วเหมือนกัน ทิ้งให้หน้าคลังยาโหลดใหม่
      clearSS(SS.catalog);
      app.setState({ drugs: list, catalog: [] });
      app.toast('คลังยามีการแก้ไข อัปเดตให้แล้ว', '', true);
    } catch (e) { logFail('pullDrugs (คลังยาชุดใหม่)', e); }
  };

  // ── อัปเดตสดข้ามเครื่อง ──────────────────────────────────────────────────
  // พี่กันสั่ง 27 ส.ค. 2569:
  //   "ถ้าเราเปิดตารางประวัติ แล้วมีอีกคนส่งข้อมูลมา มันจะขึ้นอัปเดตให้เราเลย"
  //
  // วิธี: ถามหลังบ้านตัวเองว่า "ลายเซ็นข้อมูลเปลี่ยนไหม" — ตอบกลับแค่ตัวเลข 4 ตัว
  // เปลี่ยนเมื่อไหร่ค่อยดึงของจริงเฉพาะหน้าที่กำลังเปิดอยู่
  //
  // 🚨 ไม่ต่อฐานข้อมูลตรงจากเบราว์เซอร์ เพราะต้องเอากุญแจไปไว้ในเบราว์เซอร์
  //    = ใครเปิดเว็บก็แก้ข้อมูลได้ · ขัดกฎเหล็กข้อ 6 (แนวเดียวกับคลังยาที่ทำไว้แล้ว)
  // ลายเซ็นชุดล่าสุดที่หน้าจอนี้เห็น
  // 🚨 กู้จากที่เก็บของแท็บด้วย — รีเฟรชแล้วของที่โหลดไว้ยังอยู่ครบ
  //    ถ้าไม่กู้ลายเซ็นมาคู่กัน การถามรอบแรกจะไม่มีอะไรให้เทียบ
  //    แล้วข้อมูลที่เครื่องอื่นแก้ไประหว่างนั้นจะไม่ถูกดึงมาเลยจนกว่าจะถามรอบสอง
  app._rev = readSS(SS.rev) || null;
  app._ownAt = 0;       // ครั้งสุดท้ายที่ "เราเอง" เป็นคนเปลี่ยนข้อมูล
  app._pulsing = false; // กันถามซ้อนกันตอนเน็ตช้า

  app.pulse = async (opts) => {
    const quiet = !!(opts && opts.quiet);
    if (app.state.demo) return;          // โหมดตัวอย่างไม่ยุ่งกับของจริง
    if (app._pulsing) return;
    app._pulsing = true;
    try {
      const res = await app.fetchT('/api/rev', {}, 10000);
      if (!res.ok) return;
      const sig = await res.json();
      if (!sig || sig.error) return;

      const was = app._rev;
      app._rev = sig;
      writeSS(SS.rev, sig);
      if (!was) return;                  // ครั้งแรกหลังเปิดเว็บ ยังไม่มีอะไรให้เทียบ

      // คลังยา — ตาราง drugs ใช้ร่วม 3 เว็บ เภสัชกรแก้ที่ ME-DRP แล้วเว็บนี้ต้องเห็น
      if (sig.drug !== was.drug) {
        app._drugRev = sig.drug;
        await app.pullDrugs();
      }

      // การตั้งค่า — รายชื่อผู้บันทึก · รพ.สต. · ยาที่คืนบ่อย
      if (sig.setting !== was.setting) await app.pullSetting();

      // รายการยาคืน — เพิ่ม แก้ ลบ กู้คืน ตีราคาใหม่ หรือแก้ระดับล็อต
      if (sig.rows !== was.rows || sig.lot !== was.lot) {
        // 🚨 ต้องแยกให้ออกว่าเป็นฝีมือเราเองหรือเครื่องอื่น
        //    ไม่งั้นกดบันทึกเองแล้วเด้งข้อความ "มีข้อมูลใหม่จากเครื่องอื่น" ทุกครั้ง
        //    เผื่อเวลาไว้ 45 วินาที · ตัวจับเวลาถามทุก 20 วินาที ถ้าเผื่อเท่ากันจะชนขอบพอดี
        //    แล้วบางครั้งจะเด้งข้อความผิด บางครั้งไม่เด้ง = บั๊กที่จับยากที่สุดแบบหนึ่ง
        const mine = app._ownAt && Date.now() - app._ownAt < 45000;
        app.dropCache();
        app.refreshCurrent();
        if (!mine && !quiet) app.toast('มีข้อมูลใหม่จากเครื่องอื่น อัปเดตให้แล้ว', '', true);
      }
    } catch (e) {
      // เน็ตหลุดชั่วคราวเป็นเรื่องปกติของโรงพยาบาล เงียบไว้ รอบหน้าค่อยถามใหม่
    } finally {
      app._pulsing = false;
    }
  };

  // ดึงการตั้งค่าชุดใหม่ — ไม่แตะช่องที่ผู้ใช้กำลังกรอกค้างอยู่
  // 🚨 ห้ามยัดชื่อผู้บันทึกกลับเข้าช่อง คอมห้องยาเป็นเครื่องกลาง ต้องเลือกเองทุกครั้ง
  app.pullSetting = async () => {
    try {
      const res = await app.fetchT('/api/settings');
      const data = await res.json();
      if (!res.ok || !data.setting) return;
      const g = data.setting;
      writeCache(LS.setting, g);
      app.setState({
        orgName: g.orgName,
        favIds: g.favIds,
        staff: Array.isArray(g.staff) ? g.staff : [],
        pcuSites: Array.isArray(g.pcuSites) ? g.pcuSites : [],
        pcuFull: g.pcuFull || {},
        defaultSource: g.defaultSource
      });
    } catch (e) { logFail('pullSetting (การตั้งค่ากับรายชื่อ รพ.สต.)', e); }
  };

  // โหลดเฉพาะหน้าที่กำลังเปิดอยู่ — หน้าอื่นแคชถูกล้างไปแล้ว เข้าเมื่อไหร่ค่อยโหลด
  // ตรงนี้คือหัวใจของ "ไม่โหลดทุกอย่างตลอดเวลา" ที่พี่กันบ่นไว้
  app.refreshCurrent = () => {
    const sc = app.state.screen;
    if (sc === 'history') app.loadHistory(true);
    else if (sc === 'summary') { app.loadSummary(true); app.loadTopReturned(); }
    else if (sc === 'lots') app.loadLots(true);
    else if (sc === 'catalog') app.loadCatalog(true);
    else if (sc === 'prices') app.loadPrices(true);
    // หน้าบันทึกไม่มีตาราง แต่มีตัวเลขใหญ่ "ยอดประหยัดสะสมปีงบ" ที่ต้องขยับตาม
    else if (sc === 'record') app.refreshFy();
  };

  // ยอดสะสมปีงบชุดใหม่ — ใช้ตอนเครื่องอื่นบันทึกเข้ามาระหว่างที่เราเปิดหน้าบันทึกค้างไว้
  // (บันทึกเองไม่ต้องใช้ตัวนี้ เพราะ POST /api/returns คืนยอดใหม่กลับมาให้อยู่แล้ว)
  app.refreshFy = async () => {
    if (app.state.demo) return;
    try {
      const res = await app.fetchT('/api/summary');
      const d = await res.json();
      if (!res.ok) return;
      app.setState({
        fy: {
          saved: Number(d.saved || 0),
          lost: Number(d.lost || 0),
          records: Number(d.records || 0),
          qty: Number(d.qty || 0),
          zeroPriced: Number(d.zeroPriced || 0)
        }
      });
    } catch (e) { logFail('refreshFy (ยอดสะสมปีงบ)', e); }
  };

  // คอมห้องยาเปิดเว็บค้างข้ามคืนเป็นเรื่องปกติ ถ้าไม่ทวนวัน ยาที่คืนเช้าวันใหม่
  // จะลงวันเมื่อวานทั้งวัน และถ้าเป็นคืน 30 ก.ย. ต่อ 1 ต.ค. จะตกผิดปีงบด้วย
  app.checkDayRollover = () => {
    const now = todayISO();
    if (!app.state.today) return;

    // 🚨🚨 ด่านนี้เคยปิดตายจนโค้ดข้างล่างไม่เคยได้ทำงานเลย (เจอ 26 ส.ค. 2569)
    //
    // ตอนกู้ร่างจาก localStorage มีบรรทัด patch.today = todayISO() อยู่แล้ว
    // แปลว่า state.today เท่ากับวันนี้ "เสมอ" ตั้งแต่วินาทีแรกที่เปิดเว็บ
    // เงื่อนไขเดิม (today === now → return) จึงตีกลับทุกครั้งที่ถูกเรียก
    // การแก้เรื่องร่างค้างข้ามวันเมื่อ 19 ส.ค. 2569 เลยไม่เคยมีผลอะไรจริง ๆ
    //
    // อาการที่พี่กันเจอ: เปิดเว็บวันที่ 26 แต่ช่องวันที่ยังเป็น 25
    // = ยาที่รับคืนวันนี้ถูกบันทึกเป็นเมื่อวานทั้งล็อต โดยไม่มีอะไรเตือนเลย
    //
    // ตอนนี้ต้องเช็คสองอย่าง: วันเปลี่ยนหรือยัง "และ" ร่างค้างวันเก่าอยู่หรือเปล่า
    //
    // 🚨 dateTouched กันไม่ให้ไปทับวันที่ผู้ใช้ "ตั้งใจ" เลือกย้อนหลัง
    //    (เช่นบันทึกยาที่รับคืนเมื่อวานให้ครบ) ตัวจับเวลาเรียกฟังก์ชันนี้ทุก 1 นาที
    //    ถ้าไม่มีธงนี้ เลือกวันย้อนหลังแล้วอีกนาทีเดียวจะถูกดึงกลับเป็นวันนี้เงียบ ๆ
    //    ซึ่งแย่กว่าบั๊กเดิมอีก เพราะเกิดหลังจากผู้ใช้ตั้งใจทำอะไรบางอย่างไปแล้ว
    const stale = !app.state.dateTouched && !!app.state.date && app.state.date < now;
    if (app.state.today === now && !stale) return;
    // เลื่อนวันในช่องให้ด้วย ถ้าเดิมยังเป็น "วันนี้" (ไม่ได้ตั้งใจย้อนวัน)
    // หรือถ้าค้างเป็นวันในอดีต — เกิดจากร่างเก่าใน localStorage ที่กู้มาข้ามวัน
    // 🚨 เดิมเช็คแค่ wasToday ทำให้ร่างที่ค้างข้ามวันติดวันเก่าถาวร
    //    เปิดเว็บวันที่ 19 แต่ช่องวันที่ยังเป็น 10 (พี่กันเจอเอง 19 ส.ค. 2569)
    const wasToday = app.state.date === app.state.today;
    app.setState({ today: now, date: (wasToday || stale) ? now : app.state.date });
    app.invalidate();
  };
}
