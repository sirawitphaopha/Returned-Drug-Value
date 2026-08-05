// ช่องเลือก "ผู้บันทึก" — ไม่มีในมอคอัป พี่กันสั่งเพิ่ม
//
// แนวคิด: 1 รอบกดบันทึก = 1 ล็อตสินค้า ต้องรู้ว่าใครเป็นคนปิดล็อต ไม่งั้นสืบกลับไม่ได้
// เดิมทำเป็นหน้าต่างเด้งตอนกดบันทึก แต่พี่กันขอให้ย้ายมาอยู่ในแผงข้าง
// ถัดจากวันที่/HN เลย จะได้ไม่เสียจังหวะตอนกรอกรัว
//
// ทำเป็นเมนูของตัวเองแทน <select> ของระบบ เพราะชื่อยาว ("ภก. ธีร์ธวัช รัตนวรวิเศษ")
// แล้ว iOS จะตัดเหลือ 2 บรรทัดจนอ่านไม่ออก (ME-DRP เคยเจอปัญหานี้มาแล้ว)
import { s, sx } from '../helpers';

export function renderRecorderField(V, compact) {
  const h = compact ? '42px' : '42px';
  const fs = compact ? '13.5px' : '14px';

  return (
    <div style={s('position:relative')}>
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px')}>
        <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>ผู้บันทึก</span>
        {!V.recorderName && <span style={s('font:500 11px Sarabun,sans-serif;color:#c2543c')}>ต้องเลือกก่อนบันทึก</span>}
      </div>

      <div
        onClick={V.toggleRecorderMenu}
        className="hv-bd-green"
        style={sx('width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 11px;border-radius:9px;background:#f6f7f4;cursor:pointer', {
          height: h,
          border: '1px solid ' + (V.recorderName ? 'rgba(30,36,32,.16)' : 'rgba(194,84,60,.45)')
        })}
      >
        <span style={sx('min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', {
          font: '500 ' + fs + " Sarabun,sans-serif",
          color: V.recorderName ? '#1e2420' : '#9aa19c'
        })}>{V.recorderName || 'เลือกชื่อผู้บันทึก'}</span>
        <span style={s('font:400 10px Sarabun,sans-serif;color:#6b746e;flex:none')}>▾</span>
      </div>

      {V.recorderMenuOpen && (
        <>
          {/* ฉากบางๆ ไว้รับการกดนอกเมนู */}
          <div onClick={V.closeRecorderMenu} style={s('position:fixed;inset:0;z-index:29')}></div>
          <div style={sx('position:absolute;left:0;right:0;z-index:30;border:1px solid rgba(30,36,32,.12);border-radius:11px;background:#fff;box-shadow:0 14px 34px rgba(30,36,32,.18);overflow:hidden;max-height:290px;overflow-y:auto', V.recorderMenuUp ? { bottom: '100%', marginBottom: '6px' } : { top: '100%', marginTop: '6px' })}>
            {V.recorderList.map((p) => (
              <div
                key={p.name}
                onClick={p.pick}
                className="hv-bg-eef"
                style={sx('display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;font:500 13px Sarabun,sans-serif;border-bottom:1px solid rgba(30,36,32,.05)', {
                  background: p.on ? '#eef6f1' : '#fff',
                  color: p.on ? '#2f7d5d' : '#1e2420'
                })}
              >
                <span style={s('width:14px;flex:none;text-align:center;font:600 12px Sarabun,sans-serif')}>{p.on ? '✓' : ''}</span>
                <span style={s('min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{p.name}</span>
              </div>
            ))}

            {/* เผื่อมีคนใหม่มาช่วย พิมพ์ชื่อแล้วเก็บเข้ารายชื่อถาวรเลย */}
            <div style={s('padding:9px 12px;background:#f6f7f4')}>
              <div style={s('font:500 10.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>เพิ่มชื่อใหม่</div>
              <div style={s('display:flex;gap:6px')}>
                <input
                  value={V.recorderNew}
                  onChange={V.onRecorderNew}
                  onKeyDown={V.onRecorderNewKey}
                  placeholder="เช่น ภก. สมชาย ใจดี"
                  style={s('flex:1;min-width:0;height:36px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:8px;background:#fff;font:400 12.5px Sarabun,sans-serif')}
                />
                <div
                  onClick={V.addRecorder}
                  style={sx('height:36px;padding:0 13px;border-radius:8px;display:flex;align-items:center;font:600 12.5px Sarabun,sans-serif;flex:none', {
                    background: V.canAddRecorder ? '#2f7d5d' : '#e9ebe8',
                    color: V.canAddRecorder ? '#fff' : '#9aa19c',
                    cursor: V.canAddRecorder ? 'pointer' : 'default'
                  })}
                >เพิ่ม</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
