// ค่าของโครงนอก: พื้นหลัง · แถบเมนู · ข้อความเด้ง
import { thaiDate, money } from '@/lib/format';


export function shellVals(app, d) {
  const st = d.st;
  // goScreen เปลี่ยนหน้าแล้วสั่งโหลดข้อมูลของหน้านั้นให้ด้วย (มอคอัปไม่ต้อง เพราะข้อมูลอยู่ในเครื่องหมดแล้ว)
  const pickScreen = (name) => () => app.goScreen(name);

  return {
    shellBg: st.screen === 'summary' ? (d.dark ? '#151a17' : '#f6f7f4') : '#f6f7f4',
    wide: d.wide,
    narrow: !d.wide,
    recordNarrow: st.screen === 'record' && !d.wide,

    // 🚨 หน้าบันทึกแบบคอม = หน้าเดียวที่ "ล็อกความสูงเท่าจอ" ไม่ให้ทั้งหน้าเลื่อน
    //    ของทุกอย่างถูกตรึง เหลือแค่ในกรอบรายการที่เลื่อนได้ (พี่กันสั่ง)
    //    หน้าอื่นยังเลื่อนทั้งหน้าตามปกติ ดูวิธีสลับที่ shell.jsx
    fitScreen: st.screen === 'record' && d.wide,
    isRecord: st.screen === 'record',
    isHistory: st.screen === 'history',
    isSummary: st.screen === 'summary',
    // cls = คลาสของแท็บฝั่งคอม · .tab-btn ให้กรอบจาง ๆ · .on บอกว่าแท็บนี้เปิดอยู่
    //       (ตัวที่เปิดอยู่ห้ามเปลี่ยนสีตอนเอาเมาส์ชี้ ดู globals.css)
    tabs: [
      { label: 'บันทึก', radius: '5px', on: st.screen === 'record', cls: st.screen === 'record' ? 'tab-btn on' : 'tab-btn', fg: st.screen === 'record' ? '#2f7d5d' : '#6b746e', navBg: st.screen === 'record' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'record' ? '#2f7d5d' : '#6b746e', pick: pickScreen('record') },
      { label: 'ประวัติ', radius: '50%', on: st.screen === 'history', cls: st.screen === 'history' ? 'tab-btn on' : 'tab-btn', fg: st.screen === 'history' ? '#2f7d5d' : '#6b746e', navBg: st.screen === 'history' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'history' ? '#2f7d5d' : '#6b746e', pick: pickScreen('history') },
      { label: 'สรุป', radius: '3px', on: st.screen === 'summary', cls: st.screen === 'summary' ? 'tab-btn on' : 'tab-btn', fg: st.screen === 'summary' ? '#2f7d5d' : '#6b746e', navBg: st.screen === 'summary' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'summary' ? '#2f7d5d' : '#6b746e', pick: pickScreen('summary') },
      // คลังยา — ตาราง drugs ของกลาง ใช้ร่วมกันทุกเว็บห้องยา (พี่กันสั่งให้เป็นแท็บ 13 ส.ค. 2569)
      // ต้องเรียก openCatalog ไม่ใช่ pickScreen เฉย ๆ เพราะต้องสั่งโหลดคลังยาดิบด้วย
      { label: 'คลังยา', radius: '8px', on: st.screen === 'catalog', cls: st.screen === 'catalog' ? 'tab-btn on' : 'tab-btn', fg: st.screen === 'catalog' ? '#2f7d5d' : '#6b746e', navBg: st.screen === 'catalog' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'catalog' ? '#2f7d5d' : '#6b746e', pick: app.openCatalog }
    ],

    // ปุ่มออกจากระบบ — โผล่เฉพาะตอนเว็บล็อกด้วยรหัสผ่านห้องยาอยู่จริง
    // ตอนรันในเครื่องที่ไม่ได้ตั้ง MRV_PASSWORD กดไปก็ไม่มีความหมาย
    showLogout: st.authOn === true,
    askLogout: app.askLogout,

    orgName: st.orgName,
    dateLabel: st.date ? thaiDate(st.date) : '—',
    settingsOpen: st.settingsOpen,
    openSettings: () => app.setState({ settingsOpen: true, favQuery: '' }),
    closeSettings: () => app.setState({ settingsOpen: false, favQuery: '' }),

    // สวิตช์บังคับดูแบบมือถือบนคอม (มอคอัปบรรทัด 655–663 · 1361–1367)
    // 🚨 ต้องผ่าน 2 ด่าน: จอกว้างจริง + มีเมาส์จริง
    // ด่านความกว้างอย่างเดียวไม่พอ แท็บเล็ตแนวนอน 1024px จะหลุดขึ้นมาบังจอ (พี่กันสั่ง)
    showLayoutSwitch: st.vw >= 960 && st.hasMouse,
    anyModalOpen: !!(st.confirm || st.sheet || st.settingsOpen),
    // สีปุ่มที่เลือกอยู่ใช้เขียวของเว็บ ไม่ใช่ดำแบบมอคอัป — ชุดเดียวกับปุ่มเพิ่ม/แหล่งที่มา
    layoutDeskBg: st.forceNarrow ? 'transparent' : '#2f7d5d',
    layoutDeskFg: st.forceNarrow ? '#6b746e' : '#fff',
    layoutMobBg: st.forceNarrow ? '#2f7d5d' : 'transparent',
    layoutMobFg: st.forceNarrow ? '#fff' : '#6b746e',
    useDesktop: () => app.setState({ forceNarrow: false }),
    useMobile: () => app.setState({ forceNarrow: true }),

    // ── โหมดดูตัวอย่าง ──────────────────────────────────────────────────────
    demo: !!st.demo,
    toggleDemo: app.toggleDemo,
    demoBtnLabel: st.demo ? 'กำลังดูข้อมูลตัวอย่าง — กดเพื่อปิด' : 'เปิดโหมดดูตัวอย่าง',
    demoHint: st.demo
      ? 'ข้อมูลชุดนี้เป็นของสมมติที่สร้างในเครื่อง ไม่ได้อยู่ในฐานข้อมูลจริง และบันทึกอะไรไม่ได้ระหว่างเปิดโหมดนี้'
      : 'สร้างข้อมูลสมมติทั้งปีงบให้ดูว่าเว็บทำงานเต็มที่แล้วหน้าตาเป็นยังไง ข้อมูลอยู่ในเครื่องอย่างเดียว ไม่ถูกส่งขึ้นฐานข้อมูล',
    demoBanner: 'กำลังดูข้อมูลตัวอย่าง — ตัวเลขทั้งหมดเป็นของสมมติ ไม่ได้อยู่ในฐานข้อมูลจริง',

    // ── แถบเตือนเน็ตหลุด (ผลตรวจข้อ ต-17 · พี่กันเคาะ 26 ส.ค. 2569) ──
    // 🚨 ต้องบอกให้ชัดว่า "ของที่กรอกไว้ไม่หาย" ไม่ใช่แค่บอกว่าเน็ตหลุด
    //    ไม่งั้นเภสัชกรจะรีบจดใส่กระดาษเผื่อไว้ ซึ่งเสียเวลาโดยไม่จำเป็น
    //    ร่างถูกเก็บในเครื่องทุกครั้งที่กดเพิ่มยา ไม่ได้พึ่งเน็ตเลย
    offline: !!st.offline,
    offlineBanner: 'ออฟไลน์ — ยังกรอกต่อได้ตามปกติ รายการที่กรอกไว้ถูกเก็บในเครื่องนี้แล้ว',
    offlineHint: 'กดบันทึกได้เมื่อเน็ตกลับมา',

    isAbout: st.screen === 'about',
    footerYear: (Number((st.today || '').slice(0, 4)) || new Date().getFullYear()) + 543,
    aboutStat: 'ในระบบ: ' + Number(st.fy.records || 0).toLocaleString('en-US') + ' รายการ · ประหยัดสะสม ' + money(st.fy.saved || 0),
    openAbout: app.openAbout,
    closeAbout: app.closeAbout,

    // ตัววัดความสูงแถบล่างจอ — ข้อความเด้งเอาไปเว้นระยะให้ไม่ทับตัวเลข
    navBarRef: app.navBarRef,
    saveBarRef: app.saveBarRef,

    toastOpen: !!st.toast,
    closeToast: app.closeToast,
    // ปุ่มปิดโผล่เฉพาะข้อความผิดพลาด — ข้อความสำเร็จหายเองไม่ต้องมีปุ่ม
    toastClosable: !!(st.toast && st.toast.ok === false),
    toastText: st.toast ? st.toast.text : '',
    toastValue: st.toast ? st.toast.value : '',
    toastIcon: st.toast && st.toast.ok ? '✓' : '!',
    toastDot: st.toast && st.toast.ok ? '#2f7d5d' : '#c2543c',
    toastValueColor: st.toast && st.toast.ok ? '#7fd6ab' : '#f0a68f'
  };
}
