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
    return { resultOpen: false, resultOk: false, resultFail: false };
  }

  const srcLabel = (SOURCES.find((s) => s.key === r.src) || {}).label || r.src || '';
  const site = String(r.pcuSite || '').trim();

  // ── นับถอยหลังจนกว่าระบบจะลองส่งเองครั้งถัดไป ────────────────────────────
  // ต้องเห็นตัวเลขเดินจริง ไม่ใช่เขียนลอย ๆ ว่า "ระบบจะลองใหม่ให้"
  // ประโยคลอย ๆ ไม่มีอะไรพิสูจน์ว่าระบบยังทำงานอยู่ คนจะไม่เชื่อแล้วกดเองรัว ๆ
  const leftMs = Math.max(0, Number(st.retryAt || 0) - Date.now());
  const leftSec = Math.ceil(leftMs / 1000);
  const nextText = st.saving
    ? 'กำลังส่ง'
    : leftSec > 60
      ? 'ลองส่งใหม่ให้เองในอีก ' + Math.ceil(leftSec / 60) + ' นาที'
      : leftSec > 0
        ? 'ลองส่งใหม่ให้เองในอีก ' + leftSec + ' วินาที'
        : 'กำลังลองส่งใหม่';

  return {
    resultOpen: true,
    resultOk: r.kind === 'ok',
    resultFail: r.kind === 'fail',

    // ── หน้าส่งไม่สำเร็จ ──
    resultValue: money(r.value || 0),
    resultError: r.error || '',
    resultNext: nextText,
    resultTries: Number(st.retryTries || 0),
    resultTriesText: Number(st.retryTries || 0) > 0
      ? 'ระบบลองส่งให้เองแล้ว ' + st.retryTries + ' ครั้ง'
      : '',
    resultSaving: !!st.saving,
    resultRetry: app.resultRetry,
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
