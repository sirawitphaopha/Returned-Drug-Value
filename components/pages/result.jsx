// ── หน้าผลบันทึกสำเร็จเต็มจอ ────────────────────────────────────────────────
//
// พี่กันเลือกแบบ ข จากมอคอัป 3 แบบ (29 ส.ค. 2569) — มีการ์ดสรุปยอดใต้เลข Lot
// เหตุผลที่เลือกแบบมีการ์ด: ตรวจซ้ำได้ทันทีว่าเซ็นในชื่อใคร มาจากแห่งไหน
// ก่อนกดปิด · ถ้าพลาดต้องไปแก้ที่หน้าต่างแก้ไขล็อตซึ่งเก็บร่องรอยทุกครั้งที่แก้
//
// 🚨 ปิดได้ทางเดียวคือปุ่มตกลงกับปุ่ม Esc — กดพื้นหลังไม่ปิดโดยตั้งใจ
//    เลข Lot ที่โชว์อยู่คือเลขที่ฐานเพิ่งออกให้ ปิดพลาดแล้วต้องไปหาในหน้ารายการ Lot เอง
//    (กฎเดียวกับใบสรุป Lot · ป๊อปที่กดพื้นหลังไม่ปิดต้องมี Esc เสมอ ดูข้อ 3.31)
//
// 🚨 z-index 50 — สูงกว่าทุกอย่างในเว็บ แต่ต่ำกว่าใบสรุป Lot ที่ 60
//    เพราะปุ่ม "ดูใบสรุป Lot นี้" บนหน้านี้เปิดใบสรุปซ้อนขึ้นมาอีกชั้น
import { s, sx, kb } from '../helpers';

function stat(label, value, tone) {
  const red = tone === 'red';
  return (
    <div style={sx('flex:1;min-width:0;border-radius:11px;padding:9px 12px', {
      background: red ? '#fdf1ed' : '#eef6f1'
    })}>
      <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:2px')}>{label}</div>
      <div style={sx('font:700 19px Sarabun,sans-serif', { color: red ? '#c2543c' : '#2f7d5d' })}>{value}</div>
    </div>
  );
}

function line(label, value) {
  return (
    <div style={s('display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(30,36,32,.08)')}>
      <span style={s('font:400 13px Sarabun,sans-serif;color:#6b746e;flex:none')}>{label}</span>
      <span style={s('font:600 13px Sarabun,sans-serif;color:#1e2420;text-align:right')}>{value}</span>
    </div>
  );
}

export function renderResult(V) {
  if (!V.resultOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="ผลการบันทึก"
      style={s('position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:24px 20px;text-align:center;background:linear-gradient(180deg,#f4faf7,#e3f0e8)')}>

      {/* เนื้อหาสั้นให้ลอยกลางจอ เนื้อหายาวให้เลื่อนตามปกติ ไม่โดนตัดหัว
          ใช้ที่ว่างยืดหยุ่นสองก้อนแทน justify-content:center ซึ่งตัดหัวเมื่อเนื้อหาล้น */}
      <div style={s('flex:1 0 0;min-height:0')}></div>

      <div style={s('width:78px;height:78px;border-radius:999px;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 0 0 9px rgba(47,125,93,.10)')}>
        <span aria-hidden="true" style={s('font:400 42px/1 Sarabun,sans-serif;color:#2f7d5d')}>✓</span>
      </div>

      <div role="heading" aria-level="1" style={s('margin-top:14px;font:800 23px Sarabun,sans-serif;color:#24614a;letter-spacing:-.3px')}>บันทึกสำเร็จ</div>

      {V.resultHasLot && (
        <div style={s('margin-top:12px;display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:#fff;border:1px solid rgba(47,125,93,.28)')}>
          <span style={s('font:500 12px Sarabun,sans-serif;color:#6b746e')}>เลข Lot</span>
          <span style={s('font:700 17px Sarabun,sans-serif;color:#24614a;letter-spacing:.4px')}>{V.resultLot}</span>
        </div>
      )}

      <div style={s('width:100%;max-width:360px;margin-top:16px;background:#fff;border:1px solid rgba(30,36,32,.10);border-radius:14px;padding:13px 15px;text-align:left')}>
        <div style={s('display:flex;gap:10px')}>
          {stat('ใช้ต่อได้', V.resultSaved, '')}
          {stat('ทำลาย', V.resultLost, 'red')}
        </div>
        <div style={s('margin-top:10px')}>
          {line('รายการยา', V.resultItems)}
          {line('ผู้บันทึก', V.resultBy)}
          {line('แหล่งที่มา', V.resultSrc)}
          {/* บรรทัดสุดท้ายไม่มีเส้นคั่นใต้ ใช้กล่องของตัวเองแทนตัวช่วย line() */}
          <div style={s('display:flex;justify-content:space-between;gap:12px;padding:7px 0')}>
            <span style={s('font:400 13px Sarabun,sans-serif;color:#6b746e;flex:none')}>วันที่รับคืน</span>
            <span style={s('font:600 13px Sarabun,sans-serif;color:#1e2420;text-align:right')}>{V.resultDate}</span>
          </div>
        </div>
      </div>

      {/* แถวที่เคยเข้าฐานไปแล้วจากการกดลองส่งใหม่ — ต้องบอก ไม่ใช่เงียบว่าบันทึกครบ */}
      {V.resultNote && (
        <div style={s('width:100%;max-width:360px;margin-top:11px;padding:10px 13px;border-radius:11px;background:#fbeed4;border:1px solid rgba(150,101,15,.28);font:500 12.5px/1.6 Sarabun,sans-serif;color:#96650f;text-align:left')}>
          {V.resultNote}
        </div>
      )}

      {/* 🚨 ปุ่มทั้งสองสูงเกิน 44px อยู่แล้ว จึงห้ามใส่คลาส .tap ซ้ำ
          .tap ขยายพื้นที่กดออกด้านละ 11px ปุ่มที่ห่างกัน 10px จะมีพื้นที่กดทับกัน
          เล็งกด "ตกลง" แล้วโดน "ดูใบสรุป" แทน (กฎข้อ 3.55 · เคยเจอจริงที่การ์ดประวัติ) */}
      <div style={s('width:100%;max-width:360px;margin-top:17px;display:flex;flex-direction:column;gap:10px')}>
        <div {...kb(V.resultClose)} className="hv-teal" style={s('display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:12px;background:#2f7d5d;color:#fff;font:700 15.5px Sarabun,sans-serif;cursor:pointer')}>ตกลง</div>
        {V.resultHasLot && (
          <div {...kb(V.resultSlip)} className="hv-txt" style={s('display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:11px;color:#24614a;font:600 14px Sarabun,sans-serif;cursor:pointer')}>ดูใบสรุป Lot นี้</div>
        )}
      </div>

      <div style={s('flex:1 0 0;min-height:0')}></div>
    </div>
  );
}
