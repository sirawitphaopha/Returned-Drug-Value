// ช่องเลือก "ผู้บันทึก" — ไม่มีในมอคอัป พี่กันสั่งเพิ่ม
//
// แนวคิด: 1 รอบกดบันทึก = 1 ล็อตสินค้า ต้องรู้ว่าใครเป็นคนปิดล็อต
// ตำแหน่ง: แผงข้างถัดจากวันที่/HN (พี่กันสั่ง) เลือกครั้งเดียวค้างทั้งเวร
//
// 🎯 หน้าตาลอกมาจาก ME-DRP `renderReporterDD` (components/MedDrpApp.tsx บรรทัด 645–703)
//    ตามที่พี่กันสั่งให้ทำคล้ายกัน — ปรับแค่ชุดสีให้เป็นเขียวเทลของเว็บนี้ (#2f7d5d)
//    แทน teal ของ ME-DRP (#0F8A80) ส่วนโครง/ระยะ/ขนาดตัวอักษรเหมือนกันหมด
//
// ทำเมนูเอง ไม่ใช้ <select> ของระบบ เพราะชื่อยาว ("ภก. ธีร์ธวัช รัตนวรวิเศษ")
// แล้ว iOS จะตัดเหลือ 2 บรรทัดจนอ่านไม่ออก (ME-DRP เคยเจอปัญหานี้มาแล้ว)
import { s, sx, kb } from '../helpers';

export function renderRecorderField(V, opt) {
  opt = opt || {};
  const open = V.recorderMenuOpen;
  const has = !!V.recorderName;

  // ── แบบบรรทัดเดียว ให้เหมือนช่อง รพ.สต. (พี่กันสั่ง 1 ก.ย. 2569) ──────────
  //   "เปลี่ยนอันนี้ด้วยละกัน ให้เหมือน รพ สต เเละเอาไว้กึ่งกลาง"
  //
  //   ป้ายอยู่ซ้ายในกรอบเดียวกัน เส้นคั่นแล้วต่อด้วยชื่อ เหลือบรรทัดเดียว
  //   สามช่องบังคับของหน้าบันทึกมือถือจึงหน้าตาเป็นชุดเดียวกันหมด
  //
  // 🚨 ใช้เฉพาะฝั่งมือถือ แผงขวาฝั่งคอมยังเป็นแบบเดิม ห้ามแตะ
  // 🚨 ยังเป็นเมนูที่ทำเอง ไม่ใช่ <select> เพราะชื่อยาว (ภก. ธีร์ธวัช รัตนวรวิเศษ)
  //    iOS จะตัดเหลือสองบรรทัดจนอ่านไม่ออก (ปัญหาเดิมจาก ME-DRP)
  const inline = !!opt.inline;
  const ibd = has ? 'rgba(47,125,93,.34)' : 'rgba(194,84,60,.55)';
  const ifg = has ? '#2f7d5d' : '#c2543c';
  // พื้นไฮไลต์ของป้าย — เขียวจางเมื่อกรอกแล้ว แดงจางเมื่อยังไม่ได้กรอก
  // (พี่กันเสนอ 4 ก.ย. 2569) ตัวหนังสือแดงบนพื้นขาวเด่นไม่พอ
  const ibg = has ? 'rgba(47,125,93,.10)' : 'rgba(194,84,60,.10)';

  return (
    <div style={s('position:relative')}>
      {inline ? (
        <div {...kb(V.toggleRecorderMenu)} className={has ? 'hv-bg-f6' : 'hv-bg-red-l'}
          style={sx('display:flex;align-items:center;height:40px;padding:0;border-radius:9px;background:#fff;cursor:pointer', { border: '1px solid ' + (open ? '#2f7d5d' : ibd) })}>
          <span style={sx('font:500 11px/1.75 Sarabun,sans-serif;flex:none;width:62px;align-self:stretch;display:flex;align-items:center;justify-content:center;white-space:nowrap', { color: ifg, borderRight: '1px solid ' + ibd, background: ibg })}>ผู้บันทึก</span>
          {/* 🚨 ขนาดกับน้ำหนักตัวอักษรต้องเท่ากับช่อง รพ.สต. เป๊ะ (พี่กันทัก 1 ก.ย. 2569)
              16px · เลือกแล้วหนา 600 · ยังไม่เลือกหนา 500
              สองช่องอยู่ในชุดเดียวกัน ตัวหนังสือหนาไม่เท่ากันเห็นได้ทันที */}
          <span style={sx('flex:1;min-width:0;font:400 16px/1.7 Sarabun,sans-serif;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', { color: has ? '#1e2420' : '#c2543c', fontWeight: has ? 600 : 500 })}>
            {V.recorderName || '— เลือกผู้บันทึก ก่อนบันทึก —'}
          </span>
          {/* 🚨 ลูกศรลอยทับขอบขวา ไม่กินที่ในแถว
              ถ้าปล่อยให้กินที่ ข้อความที่จัดกึ่งกลางจะถูกดันไปทางซ้ายเท่าความกว้างลูกศร
              ซึ่งเป็นจุดที่พี่กันทักว่ายังไม่กลาง */}
          <span style={sx('position:absolute;right:9px;top:0;bottom:0;display:flex;align-items:center;color:#414a44;transition:transform .15s;pointer-events:none', { transform: 'rotate(' + (open ? '180deg' : '0') + ')' })}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9.5 12 15.5 18 9.5" /></svg>
          </span>
        </div>
      ) : (
      <>
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px')}>
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ผู้บันทึก</span>
        {!has && <span style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#c2543c')}>ต้องเลือกก่อนบันทึก</span>}
      </div>

      {/* ปุ่มเปิดเมนู — โครงเดียวกับ ME-DRP: ขอบ 1.5px เปลี่ยนสีตอนเปิด · ลูกศรหมุน 180° */}
      {/* 🚨 กรอบช่องนี้เป็นสีแดงตอนยังไม่ได้เลือกชื่อ สีตอนชี้จึงต้องเป็นแดงตาม
          ใส่คลาสเขียวให้ทั้งสองสถานะไม่ได้ (พี่กันทัก 27 ส.ค. 2569)
          🚨 คอมเมนต์ JSX ต้องอยู่นอกแท็ก วางในแอตทริบิวต์แล้วเว็บพังทันที */}
      <div
        {...kb(V.toggleRecorderMenu)}
        className={!has ? 'hv-bg-red-l' : 'hv-bg-f6'}
        style={sx('width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;border-radius:11px;padding:12px 14px;background:#fff;cursor:pointer', {
          border: '1.5px solid ' + (!has ? 'rgba(194,84,60,.55)' : open ? '#2f7d5d' : 'rgba(30,36,32,.14)'),
          color: has ? '#1e2420' : '#6f7873'
        })}
      >
        <span style={s('font:500 15px/1.75 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
          {V.recorderName || '— เลือกผู้บันทึก ก่อนบันทึก —'}
        </span>
        <span style={sx('flex:none;display:flex;align-items:center;color:#414a44;transition:transform .15s', {
          transform: 'rotate(' + (open ? '180deg' : '0') + ')'
        })}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9.5 12 15.5 18 9.5" />
          </svg>
        </span>
      </div>

      </>
      )}

      {open && (
        <>
          {/* ฉากบาง ๆ รับการกดนอกเมนู */}
          <div {...kb(V.closeRecorderMenu)} style={s('position:fixed;inset:0;z-index:29')}></div>

          {/* 🎯 วางแบบ fixed ตามตำแหน่งจริงของช่อง — ไม่ใช่ absolute ในแผง
              เพราะแผงข้างมีขอบของตัวเอง เมนูที่สูงกว่าที่ว่างจะโดนตัดหัวหาย
              จนไม่เห็นกรอบด้านบน · ความสูงถูกย่อให้พอดีที่ว่างจริงตั้งแต่ตอนกดเปิด */}
          <div style={sx('position:fixed;z-index:30;border:1.5px solid rgba(47,125,93,.32);border-radius:12px;background:#fff;box-shadow:0 14px 34px -10px rgba(30,36,32,.42);overflow:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch',
            V.recorderBox
              ? Object.assign(
                  { left: V.recorderBox.left + 'px', width: V.recorderBox.width + 'px', maxHeight: V.recorderBox.maxH + 'px' },
                  V.recorderBox.up ? { bottom: V.recorderBox.bottom + 'px' } : { top: V.recorderBox.top + 'px' }
                )
              : { left: '12px', right: '12px', bottom: '12px', maxHeight: '300px' }
          )}>

            {V.recorderList.map((p) => (
              <div
                key={p.name}
                {...kb(p.pick)}
                className="hv-bg-eef"
                style={sx('display:flex;align-items:center;gap:8px;padding:13px 14px;font:400 15px Sarabun,sans-serif;cursor:pointer;border-bottom:1px solid rgba(30,36,32,.05);white-space:nowrap;overflow:hidden;text-overflow:ellipsis', {
                  background: p.on ? '#eef6f1' : '#fff',
                  color: p.on ? '#2f7d5d' : '#1e2420',
                  fontWeight: p.on ? 700 : 400
                })}
              >
                <span style={s('flex:none;width:16px;color:#2f7d5d')}>{p.on ? '✓' : ''}</span>
                <span style={s('overflow:hidden;text-overflow:ellipsis')}>{p.name}</span>
              </div>
            ))}

            {/* แถวสุดท้าย — เพิ่มชื่อใหม่ เผื่อมีคนใหม่มาช่วย
                ทำเป็นแถวเดียวหน้าตาเหมือนตัวเลือกอื่น กดแล้วค่อยกางช่องพิมพ์
                (เดิมกางช่องพิมพ์ค้างไว้ตลอด ทำให้เมนูสูงเกินจนดูรก) */}
            {!V.addingRecorder && (
              <div
                {...kb(V.startAddRecorder)}
                className="hv-bg-eef"
                style={s('display:flex;align-items:center;gap:8px;padding:13px 14px;font:500 14px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;background:#f6f7f4')}
              >
                <span style={s('flex:none;width:16px')}>+</span>
                <span>เพิ่มชื่อใหม่</span>
              </div>
            )}

            {V.addingRecorder && (
              <div style={s('padding:11px 14px;background:#f6f7f4;display:flex;gap:7px')}>
                <input
                  value={V.recorderNew}
                  onChange={V.onRecorderNew}
                  onKeyDown={V.onRecorderNewKey}
                  autoFocus
                  placeholder="เช่น ภก. สมชาย ใจดี"
                  style={s('flex:1;min-width:0;height:38px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif')}
                />
                <div
                  {...kb(V.addRecorder)}
                  className={V.canAddRecorder ? 'hv-teal' : ''}
                  style={sx('height:38px;padding:0 14px;border-radius:9px;display:flex;align-items:center;font:600 13px/1.75 Sarabun,sans-serif;flex:none', {
                    background: V.canAddRecorder ? '#2f7d5d' : '#e9ebe8',
                    color: V.canAddRecorder ? '#fff' : '#6f7873',
                    cursor: V.canAddRecorder ? 'pointer' : 'default'
                  })}
                >เพิ่ม</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
