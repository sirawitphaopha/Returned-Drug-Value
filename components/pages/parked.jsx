// แถบบอกว่ามีล็อตที่กรอกค้างไว้ในหน้าต่างที่ปิดไปแล้ว
//
// พี่กันสั่ง 31 ส.ค. 2569:
//   "ที่กรอก 100 เครื่องก็ต้องแยกกัน และกรอกโครมเดียวกัน แต่คนละคนต้องแยกกัน
//    ให้ทุกอย่างมันเอกเทศกัน"
//
// ทุกหน้าต่างมีร่างของตัวเองแยกขาดจากกัน จึงไม่มีใครเห็นของใครระหว่างที่ยังเปิดอยู่
// แต่ถ้าหน้าต่างไหนถูกปิดไปทั้งที่ยังกรอกค้าง ของนั้นจะไม่มีใครดูแล
// แถบนี้จึงมีไว้บอกว่ายังอยู่ครบ พร้อมให้เลือกว่าจะเอากลับมาทำต่อ หรือทิ้ง
//
// 🚨 ไม่ดึงกลับมาให้เอง — คนที่เปิดหน้าต่างนี้อาจเป็นคนละคนกับที่กรอกค้างไว้
//    ของที่โผล่มาเองในหน้าจอคนอื่นคือต้นเหตุของปัญหาเดิมทั้งหมด
//
// ⚠️ ข้อยกเว้นเดียวคือล็อตที่ "ส่งไม่สำเร็จ" — อันนั้นถูกดึงกลับมาให้อัตโนมัติ
//    ตั้งแต่ตอนเปิดเว็บ เพราะเป็นยาที่รับคืนจากคนไข้ไปแล้วแต่ยังไม่ขึ้นระบบส่วนกลาง
//    (ดู MedReturnApp.jsx → componentDidMount)
import { s, sx, kb } from '../helpers';

export function renderParked(V) {
  if (!V.parked || !V.parked.length) return null;

  return (
    <div style={s('flex:none;display:flex;flex-direction:column;gap:8px;margin-bottom:11px')}>
      {V.parked.map((p) => (
        <div key={p.id} role="status"
          style={s('display:flex;align-items:center;gap:11px;flex-wrap:wrap;background:#fdf8ec;border:1px solid rgba(150,101,15,.26);border-radius:11px;padding:11px 13px')}>
          <div style={s('flex:1;min-width:180px')}>
            <div style={s('font:700 13px Sarabun,sans-serif;color:#96650f;margin-bottom:2px')}>
              มีล็อตที่กรอกค้างไว้จากหน้าต่างที่ปิดไปแล้ว
            </div>
            <div style={s('font:500 12px Sarabun,sans-serif;color:#7a6033')}>
              {p.countLabel}
              {p.valueLabel ? ' · ' + p.valueLabel : ''}
              {p.whenLabel ? ' · ' + p.whenLabel : ''}
            </div>
          </div>

          <div {...kb(p.take)} aria-label="เอาล็อตที่กรอกค้างไว้กลับมา" className="hv-teal tap"
            style={s('padding:9px 16px;border-radius:9px;background:#2f7d5d;color:#fff;font:700 12.5px Sarabun,sans-serif;cursor:pointer;min-height:40px;display:flex;align-items:center;flex:none')}>
            เอากลับมา
          </div>

          <div {...kb(p.drop)} aria-label="ทิ้งล็อตที่กรอกค้างไว้" className="hv-del tap"
            style={s('padding:9px 14px;border-radius:9px;border:1px solid rgba(176,42,91,.28);background:#fff;color:#b02a5b;font:600 12.5px Sarabun,sans-serif;cursor:pointer;min-height:40px;display:flex;align-items:center;flex:none')}>
            ทิ้ง
          </div>
        </div>
      ))}
    </div>
  );
}
