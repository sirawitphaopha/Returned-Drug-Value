// ป๊อปอัปยืนยัน — ไม่มีในมอคอัป (มอคอัปกดลบแล้วหายเลย)
// ใช้ตัวเดียวทั้งเว็บตามกฎ "อะไรที่คล้ายกันต้องเป็นระบบเดียว"
//
// รองรับ 2 แบบ ต่างกันที่สีปุ่มและตำแหน่ง
//
//   danger (ค่าเริ่มต้น) — ลบ/ทำลาย ของที่ย้อนไม่ได้
//     [ยืนยันลบ แดง ซ้าย][ยกเลิก ขวา]
//     🚨 ปุ่มยืนยันอยู่ซ้าย ตั้งใจสลับที่กันนิ้วกดต่อจากปุ่มลบทันที — อย่าไปสลับกลับ
//
//   normal — ยืนยันการกระทำปกติ เช่น ส่งข้อมูลขึ้นระบบ
//     [ยกเลิก ซ้าย][ยืนยัน เขียว ขวา]
//     เรียงตามธรรมชาติ เพราะเป็นสิ่งที่ผู้ใช้ตั้งใจจะทำอยู่แล้ว
//
// กดพื้นหลังไม่ปิดทั้งสองแบบ ต้องเลือกปุ่มเอง
import { s, sx, kb } from '../helpers';

export function renderConfirm(V) {
  if (!V.confirmOpen) return null;
  const danger = V.confirmKind !== 'normal';

  // 🚨 ป๊อปที่ขอชื่อผู้ทำ ปุ่มยืนยันต้องกดไม่ได้จนกว่าจะเลือก (ผลตรวจข้อ ต-6)
  //    บทเรียนจากหน้าต่างแก้ไขล็อต — เดิมกดได้แล้วโดนตีกลับเงียบ ดูเหมือนปุ่มเสีย
  const okOn = V.confirmWhoOk;
  const okBtn = (
    <div {...(okOn ? kb(V.confirmRun) : {})} className={okOn ? (danger ? 'hv-red' : 'hv-teal') : ''}
      title={okOn ? '' : 'เลือกชื่อก่อนจึงจะกดได้'}
      style={sx('flex:1;height:46px;border-radius:11px;display:flex;align-items:center;justify-content:center;font:600 14.5px Sarabun,sans-serif',
        okOn ? { background: danger ? '#c2543c' : '#2f7d5d', color: '#fff', cursor: 'pointer' }
             : { background: '#e9ebe8', color: '#b8bdb9', cursor: 'not-allowed' })}>
      {V.confirmOkLabel}
    </div>
  );
  const cancelBtn = (
    <div {...kb(V.closeConfirm)} className="hv-bg-f6"
      style={s('flex:1;height:46px;border-radius:11px;border:1px solid rgba(30,36,32,.16);display:flex;align-items:center;justify-content:center;font:600 14.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>
      {V.confirmCancelLabel || 'ยกเลิก'}
    </div>
  );

  return (
    <>
      <div style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:85')}></div>
      <div role="dialog" aria-modal="true" className="mrv-pop-wrap" style={s('position:fixed;inset:0;z-index:86;display:flex;align-items:center;justify-content:center;padding:20px')}>
        <div className="mrv-pop" style={s('width:100%;max-width:430px;max-height:calc(100vh - 40px);overflow-y:auto;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(30,36,32,.28);padding:20px 20px 16px')}>
          <div style={s('font:700 17px/1.3 Sarabun,sans-serif;margin-bottom:10px')}>{V.confirmTitle}</div>

          {/* แบบบรรทัดเดียว — ใช้กับป๊อปลบ */}
          {V.confirmDetail && (
            <div style={s('font:500 13.5px/1.75 Sarabun,sans-serif;color:#1e2420;background:#f6f7f4;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-variant-numeric:tabular-nums')}>{V.confirmDetail}</div>
          )}

          {/* แบบตาราง — ใช้กับป๊อปยืนยันส่ง ให้เห็นทุกอย่างก่อนตัดสินใจ
              เส้นคั่นแยกส่วนหัวเรื่อง (ใคร เมื่อไร ที่ไหน) ออกจากส่วนตัวเลข */}
          {V.confirmLines && V.confirmLines.length > 0 && (
            <div style={s('background:#f6f7f4;border-radius:10px;padding:11px 13px;margin-bottom:10px')}>
              {V.confirmLines.map((ln, i) => (
                <div key={i} style={sx('display:flex;align-items:baseline;gap:10px;padding:3px 0',
                  ln.sep ? { borderTop: '1px dashed rgba(30,36,32,.16)', marginTop: '7px', paddingTop: '9px' } : {})}>
                  <span style={sx('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;flex:none;width:96px',
                    ln.indent ? { paddingLeft: '11px' } : {})}>{ln.label}</span>
                  <span style={sx('font:600 13.5px/1.75 Sarabun,sans-serif;color:#1e2420;flex:1;min-width:0;text-align:right;font-variant-numeric:tabular-nums;overflow-wrap:anywhere',
                    ln.tone === 'green' ? { color: '#2f7d5d' } : ln.tone === 'red' ? { color: '#c2543c' } : ln.tone === 'soft' ? { color: '#6b746e', fontWeight: 400 } : {})}>{ln.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 🚨 ช่องเลือกชื่อผู้ทำ — โผล่เฉพาะป๊อปที่ตั้ง who ไว้
              ต้องเลือกตรงนี้ ไม่ใช่ไปเลือกในหน้าบันทึก เพราะคนละงานกัน
              คนที่มาลบรายการอาจไม่ใช่คนที่กรอกล็อตนั้น (บทเรียนข้อ 3.26)
              🚨 background-color แยก ห้ามเขียน background รวบ ไม่งั้นลูกศร v หายทั้งช่อง */}
          {V.confirmWhoLabel && (
            <div style={s('margin-bottom:14px')}>
              <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>
                {V.confirmWhoLabel} {!V.confirmWhoOk && <span style={s('color:#c2543c;font-weight:600')}>ต้องเลือกก่อนยืนยัน</span>}
              </div>
              <select value={V.confirmWho} onChange={V.onConfirmWho}
                style={sx('width:100%;height:42px;padding:0 11px;border-radius:9px;background-color:#fff;font:400 14px/1.75 Sarabun,sans-serif;color:#1e2420;outline:none;cursor:pointer',
                  { border: '1px solid ' + (V.confirmWhoOk ? 'rgba(30,36,32,.16)' : '#c2543c') })}>
                <option value={''}>— เลือก{V.confirmWhoLabel} —</option>
                {V.confirmStaff.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}

          {V.confirmNote && (
            <div style={sx('font:400 12.5px/1.75 Sarabun,sans-serif;margin-bottom:16px',
              { color: danger ? '#c2543c' : '#6b746e' })}>{V.confirmNote}</div>
          )}

          <div style={s('display:flex;gap:9px')}>
            {danger ? okBtn : cancelBtn}
            {danger ? cancelBtn : okBtn}
          </div>
        </div>
      </div>
    </>
  );
}
