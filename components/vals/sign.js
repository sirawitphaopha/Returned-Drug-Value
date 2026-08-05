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
    // ตำแหน่ง+ความสูงของเมนู วัดจากที่ว่างจริงตอนกดเปิด
    // (วางแบบ fixed จะได้ไม่โดนขอบแผงตัดหัวหาย เห็นกรอบครบทั้ง 4 ด้าน)
    recorderBox: st.recorderBox,
    recorderList: st.staff.map((name) => ({
      name: name,
      on: st.recorder === name,
      pick: () => app.pickRecorder(name)
    })),
    recorderNew: st.recorderNew,
    // ช่องพิมพ์ชื่อใหม่ กางเฉพาะตอนกด "+ เพิ่มชื่อใหม่" ไม่กางค้างไว้ตลอด
    // (เดิมกางค้าง ทำให้เมนูสูงเกินจนล้นจอ ดูรก)
    addingRecorder: !!st.addingRecorder,
    startAddRecorder: app.startAddRecorder,
    canAddRecorder: !!typed,
    onRecorderNew: app.onRecorderNew,
    onRecorderNewKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); app.addRecorder(); } },
    addRecorder: app.addRecorder,
    toggleRecorderMenu: app.toggleRecorderMenu,
    closeRecorderMenu: app.closeRecorderMenu
  };
}
