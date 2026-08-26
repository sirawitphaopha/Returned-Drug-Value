// การตั้งค่าห้องยา — คัดจากมอคอัป (บรรทัด 1322–1352)
//
// ต่างจากมอคอัปตรงเดียว: มอคอัปเก็บลง localStorage อย่างเดียว ของจริงต้องขึ้นเซิร์ฟเวอร์
// เพราะตั้งค่าที่เครื่องหนึ่งแล้วอีกเครื่องต้องเห็นด้วย
//
// วิธี: เปลี่ยนบนจอทันที แล้วค่อยยิงเซิร์ฟเวอร์เบื้องหลัง ถ้าล้มเหลวย้อนกลับ + บอกให้รู้
import { LS, writeCache, clearLS, fetchT } from '../helpers';

export function settingsActions(app) {
  // ยิงขึ้นเซิร์ฟเวอร์ · patch = เฉพาะช่องที่เปลี่ยน
  app.pushSetting = async (patch, before) => {
    try {
      const res = await app.fetchT('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกการตั้งค่าไม่สำเร็จ');

      // 🚨🚨 ห้ามเอาคำตอบจากเซิร์ฟเวอร์มาทับช่องที่ผู้ใช้กำลังพิมพ์อยู่
      //
      // อาการที่พี่กันเจอ 26 ส.ค. 2569: พิมพ์ชื่อหน่วยงานยาว ๆ แล้วตัวอักษรหายเป็นท่อน
      // เหมือนระบบตัดจำนวนคำ ทั้งที่ไม่มีการตัดที่ไหนเลย
      //
      // กลไก: ระบบรอให้หยุดพิมพ์ 0.5 วินาทีแล้วค่อยส่งขึ้นเซิร์ฟเวอร์
      //   1. พิมพ์ "กลุ่มงานเภสัชกรรม" แล้วหยุดคิดแป๊บหนึ่ง → ยิงขึ้นเซิร์ฟเวอร์
      //   2. พิมพ์ต่อ "และคุ้มครองผู้บริโภค" ระหว่างที่คำขอยังเดินทางอยู่
      //   3. คำตอบกลับมาว่าชื่อคือ "กลุ่มงานเภสัชกรรม" → setState ทับ
      //   4. ที่พิมพ์ไปในข้อ 2 หายหมดต่อหน้าต่อตา
      //
      // ยิ่งชื่อยาว ยิ่งหยุดพิมพ์บ่อย ยิ่งโดนบ่อย · ชื่อสั้น ๆ จึงไม่เคยมีปัญหา
      //
      // วิธีแก้: ถ้าค่าบนจอไม่ตรงกับค่าที่เพิ่งส่งไป แปลว่าผู้ใช้พิมพ์ต่อแล้ว → คงของบนจอไว้
      // ตระกูลเดียวกับ "กันคำตอบเก่าทับคำตอบใหม่" ที่หน้าประวัติใช้เลขลำดับ
      app.setState((st) => {
        const sent = patch.orgName;
        const typing = sent !== undefined && st.orgName !== sent;
        return {
          orgName: typing ? st.orgName : data.setting.orgName,
          favIds: data.setting.favIds,
          defaultSource: data.setting.defaultSource,
          staff: Array.isArray(data.setting.staff) ? data.setting.staff : [],
          pcuSites: Array.isArray(data.setting.pcuSites) ? data.setting.pcuSites : []
        };
      });
      writeCache(LS.setting, data.setting);
    } catch (e) {
      if (before) app.setState(before);
      // แคชเก่าไม่ตรงกับเซิร์ฟเวอร์แล้ว ทิ้งไปเลย เปิดใหม่จะได้โหลดสด
      clearLS(LS.setting);
      app.toast(e.message || 'บันทึกการตั้งค่าไม่สำเร็จ', '', false);
    }
  };

  // ชื่อห้องยาพิมพ์ทีละตัวอักษร ยิงทุกตัวจะถล่มเซิร์ฟเวอร์ เลยรอให้หยุดพิมพ์ก่อน
  app.onOrgName = (e) => {
    const value = e.target.value;
    const before = { orgName: app.state.orgName };
    app.setState({ orgName: value });
    if (app._orgTimer) clearTimeout(app._orgTimer);
    app._orgTimer = setTimeout(() => app.pushSetting({ orgName: value }, before), 500);
  };

  app.pickDefaultSource = (key) => {
    const before = { defaultSource: app.state.defaultSource, source: app.state.source };
    // เปลี่ยนค่าเริ่มต้นแล้วชิปบนหน้าบันทึกขยับตามทันที เหมือนมอคอัป
    app.setState({ defaultSource: key, source: key });
    app.pushSetting({ defaultSource: key }, before);
  };

  app.addFav = (id) => {
    if (app.state.favIds.length >= 6 || app.state.favIds.indexOf(id) >= 0) return;
    const before = { favIds: app.state.favIds };
    const next = app.state.favIds.concat([id]);
    app.setState({ favIds: next, favQuery: '' });
    app.pushSetting({ favIds: next }, before);
  };

  app.removeFav = (id) => {
    const before = { favIds: app.state.favIds };
    const next = app.state.favIds.filter((x) => x !== id);
    app.setState({ favIds: next });
    app.pushSetting({ favIds: next }, before);
  };

  app.onFavQuery = (e) => app.setState({ favQuery: e.target.value });

  // ธีมอยู่ในเครื่องอย่างเดียว คนละเครื่องชอบคนละแบบ ไม่ต้องขึ้นเซิร์ฟเวอร์
  app.setTheme = (dark) => app.persist({ dark: dark });
}
