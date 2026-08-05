// ค่าของโครงนอก: พื้นหลัง · แถบเมนู · ข้อความเด้ง
import { thaiDate } from '@/lib/format';

export function shellVals(app, d) {
  const st = d.st;
  // goScreen เปลี่ยนหน้าแล้วสั่งโหลดข้อมูลของหน้านั้นให้ด้วย (มอคอัปไม่ต้อง เพราะข้อมูลอยู่ในเครื่องหมดแล้ว)
  const pickScreen = (name) => () => app.goScreen(name);

  return {
    shellBg: st.screen === 'summary' ? (d.dark ? '#151a17' : '#f6f7f4') : '#f6f7f4',
    wide: d.wide,
    narrow: !d.wide,
    recordNarrow: st.screen === 'record' && !d.wide,
    isRecord: st.screen === 'record',
    isHistory: st.screen === 'history',
    isSummary: st.screen === 'summary',
    tabs: [
      { label: 'บันทึก', radius: '5px', fg: st.screen === 'record' ? '#2f7d5d' : '#9aa19c', navBg: st.screen === 'record' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'record' ? '#2f7d5d' : '#8d948f', pick: pickScreen('record') },
      { label: 'ประวัติ', radius: '50%', fg: st.screen === 'history' ? '#2f7d5d' : '#9aa19c', navBg: st.screen === 'history' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'history' ? '#2f7d5d' : '#8d948f', pick: pickScreen('history') },
      { label: 'สรุป', radius: '3px', fg: st.screen === 'summary' ? '#2f7d5d' : '#9aa19c', navBg: st.screen === 'summary' ? '#e3f0e8' : 'transparent', navFg: st.screen === 'summary' ? '#2f7d5d' : '#8d948f', pick: pickScreen('summary') }
    ],

    orgName: st.orgName,
    dateLabel: st.date ? thaiDate(st.date) : '—',
    settingsOpen: st.settingsOpen,
    openSettings: () => app.setState({ settingsOpen: true, favQuery: '' }),
    closeSettings: () => app.setState({ settingsOpen: false, favQuery: '' }),

    // สวิตช์บังคับดูแบบมือถือบนคอม (มอคอัปบรรทัด 655–663 · 1361–1367)
    // โชว์เฉพาะตอนจอกว้างจริง บนมือถือไม่มีประโยชน์
    showLayoutSwitch: st.vw >= 960,
    anyModalOpen: !!(st.confirm || st.sheet || st.settingsOpen),
    layoutDeskBg: st.forceNarrow ? 'transparent' : '#1e2420',
    layoutDeskFg: st.forceNarrow ? '#6b746e' : '#fff',
    layoutMobBg: st.forceNarrow ? '#1e2420' : 'transparent',
    layoutMobFg: st.forceNarrow ? '#fff' : '#6b746e',
    useDesktop: () => app.setState({ forceNarrow: false }),
    useMobile: () => app.setState({ forceNarrow: true }),

    toastOpen: !!st.toast,
    toastText: st.toast ? st.toast.text : '',
    toastValue: st.toast ? st.toast.value : '',
    toastIcon: st.toast && st.toast.ok ? '✓' : '!',
    toastDot: st.toast && st.toast.ok ? '#2f7d5d' : '#c2543c',
    toastValueColor: st.toast && st.toast.ok ? '#7fd6ab' : '#f0a68f'
  };
}
