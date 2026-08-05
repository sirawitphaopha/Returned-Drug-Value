// ค่าของช่อง "ผู้บันทึก" — ไม่มีในมอคอัป พี่กันสั่งเพิ่ม
//
// 1 รอบกดบันทึก = 1 ล็อตสินค้า ต้องรู้ว่าใครปิดล็อต
// เดิมทำเป็นหน้าต่างเด้งตอนกดบันทึก แต่พี่กันขอย้ายมาอยู่ในแผงข้างถัดจากวันที่/HN
// เพื่อไม่ให้เสียจังหวะตอนกรอกรัว — เลือกครั้งเดียวแล้วค้างไว้ทั้งเวร
export function signVals(app, d) {
  const st = d.st;
  const typed = (st.recorderNew || '').trim();

  return {
    recorderName: st.recorder || '',
    recorderMenuOpen: !!st.recorderMenuOpen,
    // เมนูเด้งขึ้นบนถ้าช่องอยู่ค่อนไปทางล่างจอ กันโดนตัดขอบ
    recorderMenuUp: !!st.recorderMenuUp,
    recorderList: st.staff.map((name) => ({
      name: name,
      on: st.recorder === name,
      pick: () => app.pickRecorder(name)
    })),
    recorderNew: st.recorderNew,
    canAddRecorder: !!typed,
    onRecorderNew: app.onRecorderNew,
    onRecorderNewKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); app.addRecorder(); } },
    addRecorder: app.addRecorder,
    toggleRecorderMenu: app.toggleRecorderMenu,
    closeRecorderMenu: app.closeRecorderMenu
  };
}
