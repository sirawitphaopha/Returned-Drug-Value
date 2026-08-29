// ── ค่าที่ใช้วาดหน้าผลบันทึกสำเร็จเต็มจอ ────────────────────────────────────
//
// พี่กันสั่ง 29 ส.ค. 2569: "ตอนที่กดส่งเสร็จแล้ว มันเปลี่ยนหน้าเลย แบบโปรเจกต์ DRP
// แล้วกดตกลง มันถึงเปลี่ยนกลับเป็นหน้ากรอกจริง" แล้วเลือกแบบ ข จากมอคอัป 3 แบบ
// (มีการ์ดสรุปยอด) พร้อมสั่งว่าปุ่มใบสรุป Lot "เอาก็ดี แบบเดียวกันกับที่กดดูในเว็บ ที่มันปริ้นได้"
//
// ทำไมต้องมีทั้งที่เคยมีข้อความเด้งอยู่แล้ว
//   ข้อความเด้งหายเองใน 2 วินาที · เลข Lot ที่ฐานเพิ่งออกให้จึงหายไปด้วย
//   ซึ่งเป็นเลขเดียวที่ใช้ตามล็อตนี้กลับมาได้ทีหลัง และเป็นเลขที่ต้องเขียนคู่กับถุงยาจริง
//   หน้าเต็มจอค้างไว้จนกดตกลง จึงไม่มีทางพลาดเลขนี้
//
// 🚨 ข้อมูลทั้งหมดมาจากแถวที่ "ส่งไปแล้วจริง" ไม่ใช่แถวที่ยังอยู่บนจอ
//    ระหว่างรอเซิร์ฟเวอร์ตอบ เภสัชกรพิมพ์ยาเพิ่มได้ ถ้านับจากของบนจอตัวเลขจะเกินจริง
import { SOURCES, money, thaiDate } from '@/lib/format';

export function resultVals(app, d) {
  const st = app.state;
  const r = st.result;
  if (!r) {
    return { resultOpen: false, resultOk: false };
  }

  const srcLabel = (SOURCES.find((s) => s.key === r.src) || {}).label || r.src || '';
  const site = String(r.pcuSite || '').trim();

  return {
    resultOpen: true,
    resultOk: r.kind === 'ok',
    resultLot: r.lot || '',
    resultHasLot: !!r.lot,
    resultDate: r.date ? thaiDate(r.date) : '',
    resultBy: r.by || 'ไม่ระบุ',
    // แหล่งที่มาต่อด้วยชื่อ รพ.สต. ในบรรทัดเดียว แบบเดียวกับหน้าประวัติ
    resultSrc: srcLabel + (r.src === 'pcu' && site ? ' · ' + site : ''),
    resultItems: (r.items || 0).toLocaleString('en-US') + ' รายการ',
    resultQty: r.qtyLabel || '',
    resultSaved: money(r.saved || 0),
    resultLost: money(r.lost || 0),
    resultHasLost: Number(r.lost || 0) > 0,
    // ขึ้นเฉพาะตอนบางแถวเคยเข้าฐานไปแล้ว (กดลองส่งใหม่หลังเน็ตหลุด)
    // เดิมบอกผ่านข้อความเด้งซึ่งหายไปก่อนอ่านทัน
    resultNote: r.note || '',
    resultClose: app.closeResult,
    resultSlip: app.openResultSlip
  };
}
