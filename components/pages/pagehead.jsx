// หัวหน้าเว็บฝั่งมือถือ — ตัวเดียวใช้ทั้งสามหน้า (พี่กันสั่ง 4 ก.ย. 2569)
//
// พี่กันวัดด้วยตาแล้วจับได้ว่า "สองปุ่มนี้ ขยับตลอดทั้งสามหน้า"
// วัดจริงยืนยัน — ปุ่มขอบบน 11 / 18 / 15 · ช่องไฟระหว่างปุ่ม 7 / 10 / 10
//
// ต้นเหตุคือหัวสามหน้าเขียนแยกกันสามที่ ต่างคนต่างปรับมาเป็นเดือน
// ไล่แก้ทีละหน้าให้ตรงกันได้ครั้งหนึ่ง แล้วครั้งหน้าก็เหลื่อมอีก
// เรื่องเดียวกับช่องค้นหาที่รวมเป็นตัวกลางไปแล้ว
//
// 🚨 ค่าทุกตัวลอกจากหน้าบันทึกมาเป๊ะ เพราะพี่กันบอกว่าหน้านั้นคือหน้าหลักที่ตรึงไว้แล้ว
//    ("หน้านี้คือหน้าหลักที่ fix วันที่ปุ่มกดต้องอยู่ระดับเดียวกันเท่านั้น")
//    หน้าบันทึกจึงต้องไม่ขยับแม้แต่จุดเดียวหลังเปลี่ยนมาใช้ตัวนี้ — วัดยืนยันแล้ว
//
// 🚨 ความสูงของกลุ่มซ้ายต้องไม่เกิน 38 จุด (เท่าปุ่ม) ไม่งั้นแถวสูงขึ้น
//    แล้วปุ่มที่จัดกึ่งกลางแถวจะเลื่อนลงตาม = เหลื่อมกลับมาอีก
//    ชื่อเว็บ 18×1.2 = 21.6 · บรรทัดล่าง 11×1.45 = 16 · รวม 37.6 พอดี
import { s, sx, kb } from '../helpers';

/**
 * @param {object} o
 * @param {Function} [o.onHome] กดชื่อเว็บแล้วกลับหน้าบันทึก (มีเฉพาะหน้าบันทึก)
 * @param {any} [o.sub] บรรทัดล่าง — ชื่อหน้ากับข้อมูลย่อ (หน้าบันทึกไม่มี)
 * @param {any} [o.extra] ของที่วางก่อนปุ่มสองตัว เช่น ปุ่มวันที่ของหน้าบันทึก
 * @param {Function} o.onAbout · @param {Function} o.onSettings
 * @param {object} [o.tone] สีสำหรับหน้าที่เปลี่ยนธีมได้ { mark, markFg, muted, border, ico, btnBg }
 */
// 🚨 ระยะขอบของกล่องหัว — ทุกหน้าต้องใช้ค่านี้ ห้ามเขียนเลขเอง
//    ปุ่ม ℹ ⚙ จะอยู่ระดับเดียวกันทั้งสามหน้าก็ต่อเมื่อระยะขอบบนเท่ากัน
export const HEAD_PAD = 'padding:11px 20px 11px';

export function renderPageHead(o) {
  const t = o.tone || {};
  const ปุ่ม = 'width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none';
  // 🚨 พื้นปุ่มต้องระบุเป็นสีขาวตรง ๆ ห้ามปล่อยโปร่งใส (พี่กันสั่ง 4 ก.ย. 2569)
  //    ปล่อยโปร่ง = สีที่ตาเห็นขึ้นกับพื้นของหน้านั้น
  //    หน้าบันทึกกับประวัติมีแถบขาวรองอยู่ ปุ่มจึงดูขาว
  //    หน้าสรุปไม่มีแถบรอง ปุ่มเลยกลายเป็นสีเทาตามพื้นหน้า — สามหน้าดูคนละสี
  const กรอบปุ่ม = {
    background: t.btnBg || '#fff',
    border: '1px solid ' + (t.border || 'rgba(30,36,32,.14)'),
    color: t.muted || '#6b746e',
  };
  const cls = t.ico || 'hv-bg-f6';

  return (
    // 🚨 ระยะห่างใต้หัวอยู่ในตัวกลาง ทุกหน้าจึงเท่ากันเอง
    //    ตอนยกหัวมาเป็นตัวกลางรอบแรก ระยะนี้หายไป ช่องค้นหาเลยมาชิดหัวเว็บ
    //    (พี่กันเห็นเองแล้วทัก 4 ก.ย. 2569 "กรอบค้น มันชิดไป")
    <div style={s('display:flex;justify-content:space-between;align-items:center;margin-bottom:12px')}>

        <div style={s('display:flex;align-items:center;gap:9px;min-width:0')}>
          {/* โลโก้ ฿ 30 จุด — เท่าหน้าบันทึกเป๊ะ */}
          <div style={sx('width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;flex:none', { background: t.mark || '#2f7d5d' })}>
            <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
            <span style={sx('font:700 13px/1.75 Sarabun,sans-serif;line-height:1', { color: t.markFg || '#fff' })}>฿</span>
          </div>

          <div style={s('min-width:0')}>
            {/* 🚨 ชื่อเว็บกดกลับหน้าบันทึกได้เฉพาะหน้าบันทึก อีกสองหน้าเป็นข้อความเฉย ๆ
                กดแล้วเด้งไปหน้าอื่นโดยไม่ได้ตั้งใจคือสิ่งที่ไม่มีใครคาดหวังจากชื่อหน้า */}
            {o.onHome ? (
              <div {...kb(o.onHome)} aria-label="กลับไปหน้าบันทึก" className="hv-home"
                style={s('font:700 18px/1.2 Krub,sans-serif;cursor:pointer;display:inline-block;border-radius:8px;margin:0 0 0 -7px;padding:0 0 0 7px;white-space:nowrap')}>มูลค่ายาคืน</div>
            ) : (
              <div style={s('font:700 18px/1.2 Krub,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>มูลค่ายาคืน</div>
            )}
            {!!o.sub && (
              <div role="heading" aria-level="1"
                style={sx('font:500 11px/1.45 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', { color: t.muted || '#6b746e' })}>{o.sub}</div>
            )}
          </div>
        </div>

        {/* 🚨 ช่องไฟ 7 จุด ตามหน้าบันทึก ห้ามเปลี่ยนเป็น 10 อีก */}
        <div style={s('display:flex;align-items:center;gap:7px;flex:none')}>
          {o.extra || null}
          <div {...kb(o.onAbout)} aria-label="เกี่ยวกับ" title="เกี่ยวกับ" className={cls}
            style={sx(ปุ่ม + ';font:700 15px Sarabun,sans-serif', กรอบปุ่ม)}>ℹ</div>
          <div {...kb(o.onSettings)} aria-label="ตั้งค่า" title="ตั้งค่า" className={cls}
            style={sx(ปุ่ม + ';font:600 16px Sarabun,sans-serif', กรอบปุ่ม)}>⚙</div>
        </div>

    </div>
  );
}
