// ช่องกรอกที่วรรณยุกต์ไทยไม่โดนตัด — ตัวกลางใช้ทุกช่องค้นหาในเว็บ
//
// 🔑 กฎกลาง `working-with-gun` หัวข้อ 9 · CLAUDE.md ข้อ 3.69
//
// ปัญหา — ช่องกรอกทุกชนิดตัดตัวอักษรที่ล้นออกนอกตัวเองเสมอ **ปิดไม่ได้**
//   สั่ง `overflow: visible` ก็ถูกเบราว์เซอร์เปลี่ยนเป็นตัดอัตโนมัติ
//   (Chromium bug 339052 · W3C bug 17473) · `<textarea>` ก็โดนเหมือนกัน
//   ผลคือไม้โทของ "นี้ นั้น" โดนหั่นครึ่ง
//
// วิธี — สามชั้น
//   กล่องนอก      กรอบที่ตาเห็น สูงเท่าเดิมเป๊ะ (ผู้เรียกเป็นคนวาด)
//   ชั้นวาด        กล่องธรรมดาวาดตัวอักษร สูงเกินกรอบ 7 จุดบนล่าง หักคืนด้วยตำแหน่งติดลบ
//   ช่องกรอกจริง   ตัวอักษรโปร่งใส เหลือแต่ขีดกะพริบ
//
// 🚨 ฟอนต์ ขนาด ระยะขอบ ต้องตรงกันเป๊ะทั้งสองชั้น ไม่งั้นขีดกะพริบไม่ตรงตัวอักษร
//    ตัวนี้บังคับให้ตรงกันเองโดยรับค่ามาชุดเดียวแล้วใช้ทั้งสองที่
//
// 🚨 การเลื่อนตามกันไม่ใช้ ref — หาชั้นวาดจากกล่องแม่เอาเลย
//    ถ้าใช้ ref ต้องประกาศคู่ละ 2 ตัวทุกช่อง (5 ช่อง = 10 ตัว) แล้วมีที่ลืมแน่นอน
//
// 🚨 กล่องนอกที่ผู้เรียกวาด ต้องมี `position:relative` และ `display:flex;align-items:center`
//    ไม่งั้นชั้นวาดจะไปเกาะกล่องอื่นแล้วตัวอักษรลอยผิดที่
import { s, sx, kb } from '../helpers';

const หาชั้นวาด = (el) => {
  const box = el && el.parentElement;
  return box ? box.querySelector('[data-thaidraw]') : null;
};

/**
 * @param {object} o
 * @param {string} o.value ค่าปัจจุบัน
 * @param {Function} o.onChange
 * @param {string} o.placeholder ข้อความจาง
 * @param {string} [o.font] ต้องเป็นชุดเดียวกันทั้งสองชั้น
 * @param {string} [o.padLeft] ระยะขอบซ้าย
 * @param {string} [o.padRight] ระยะขอบขวา — เปลี่ยนตามปุ่มที่โผล่ในช่องได้
 * @param {string} [o.ariaLabel]
 * @param {Function} [o.onKeyDown]
 * @param {string} [o.color] สีตัวอักษร
 */
export function renderThaiInput(o) {
  const font = o.font || '400 14.5px/1.75 var(--font-sarabun), Sarabun, sans-serif';
  const padL = o.padLeft || '13px';
  const padR = o.padRight || '13px';
  const fg = o.color || '#1e2420';
  // ความสูงในกรอบ — ใช้เป็นระยะบรรทัดของชั้นวาด ให้เส้นฐานตรงกับช่องกรอกจริง
  const lh = (o.innerH || 36) + 'px';

  const sync = (e) => {
    const d = หาชั้นวาด(e.target);
    if (d) d.scrollLeft = e.target.scrollLeft;
  };
  // เลิกโฟกัสแล้วเลื่อนกลับไปต้นข้อความ ให้เห็นตั้งแต่ตัวแรก
  const reset = (e) => {
    e.target.scrollLeft = 0;
    const d = หาชั้นวาด(e.target);
    if (d) d.scrollLeft = 0;
  };

  return (
    <>
      <div data-thaidraw="1" aria-hidden="true"
        style={sx('position:absolute;left:0;right:0;top:-7px;bottom:-7px;overflow:hidden;display:flex;align-items:center;pointer-events:none',
          { paddingLeft: padL, paddingRight: padR })}>
        <span style={sx('white-space:nowrap;flex:none', { font: font, lineHeight: lh, color: o.value ? fg : '#8d948f' })}>
          {o.value || o.placeholder || ''}
        </span>
      </div>

      <input ref={o.inputRef} value={o.value} onChange={o.onChange} onKeyDown={o.onKeyDown}
        onScroll={sync} onBlur={reset} aria-label={o.ariaLabel || o.placeholder || ''}
        inputMode={o.inputMode} type={o.type}
        style={sx('position:relative;width:100%;height:100%;box-sizing:border-box;border:none;background:transparent',
          { font: font, color: 'transparent', caretColor: fg, paddingLeft: padL, paddingRight: padR })} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ช่องค้นหามาตรฐานของทั้งเว็บ — พี่กันตั้งเป็นกฎ 3 ก.ย. 2569
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง: "ทำกรอบค้นหา ให้เหมือนกันที คือมีไอค่อนเเว่นขยาย ทำเป็นกฎ
//             เหมือนกรอบค้นนี้ใน lot ทั้งการป้องกันไม้โทหาย การจัดตรงกลาง"
//
// 🚨 ช่องค้นหาทุกช่องในเว็บต้องเรียกตัวนี้ ห้ามวาดเอง
//    เดิมมี 8 ช่องที่วาดกันคนละแบบ บางช่องมีแว่นขยาย บางช่องไม่มี
//    บางช่องตัดวรรณยุกต์ บางช่องตัวอักษรลอยไม่กลางกรอบ
//
// ได้อะไรมาให้ครบในตัว
//    · ไอคอนแว่นขยายซ้ายมือ ขนาดตามความสูงกรอบ
//    · วรรณยุกต์ไทยไม่โดนตัด (โครงสามชั้น ดูคำอธิบายด้านบน)
//    · ตัวอักษรนั่งกลางกรอบตรงกับไอคอน ไม่ลอยขึ้น
//    · ปุ่มล้างคำค้นโผล่เองเมื่อมีข้อความ
//    · ป้าย "ค้นว่า ..." ตอนผู้ใช้ลืมสลับแป้นพิมพ์
//
// @param {object} o
// @param {string} o.value · {Function} o.onChange · {string} o.placeholder
// @param {number} o.h ความสูงกรอบที่ตาเห็น (มือถือ 44 · คอม 42) — ตัวเดียวคุมทุกอย่าง
// @param {string} [o.bg] สีพื้นกรอบ (ค่าเริ่มต้นขาว)
// @param {Function} [o.onClear] มีแล้วปุ่มล้างจะโผล่เมื่อมีข้อความ
// @param {string} [o.swapLabel] คำที่ระบบใช้ค้นจริงหลังแปลงแป้นพิมพ์
// @param {string} [o.font] · {Function} [o.onKeyDown] · {string} [o.ariaLabel]
export function renderSearchBox(o) {
  const h = o.h || 44;
  const มีคำ = !!String(o.value || '').trim();
  const มีปุ่มล้าง = !!o.onClear && มีคำ;
  // ที่ว่างขวาต้องพอดีกับสิ่งที่โผล่จริง ไม่งั้นตัวหนังสือลอดไปใต้ป้าย
  const ขวา = o.swapLabel ? '150px' : (มีปุ่มล้าง ? (h - 8) + 'px' : '13px');
  const ไอคอน = Math.round(h * 0.36);
  const ปุ่ม = h - 16;

  return (
    <div style={sx('position:relative;flex:1;min-width:0;box-sizing:border-box;border-radius:10px;display:flex;align-items:center',
      { height: h + 'px', border: '1px solid rgba(30,36,32,.14)', background: o.bg || '#fff' })}>

      {/* แว่นขยาย — บอกว่าช่องนี้ใช้ค้นหา ไม่ใช่ช่องกรอกข้อมูลธรรมดา */}
      <svg width={ไอคอน} height={ไอคอน} viewBox="0 0 24 24" fill="none" stroke="#6f7873"
        strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>

      {renderThaiInput({
        value: o.value, onChange: o.onChange, onKeyDown: o.onKeyDown, inputRef: o.inputRef,
        placeholder: o.placeholder, font: o.font,
        padLeft: (ไอคอน + 20) + 'px', padRight: ขวา,
        innerH: h - 2, ariaLabel: o.ariaLabel || o.placeholder || '',
      })}

      {/* ป้ายบอกว่าระบบค้นด้วยคำว่าอะไร ตอนผู้ใช้ลืมสลับแป้นพิมพ์
          ไม่มีป้ายนี้ ผู้ใช้จะงงว่าทำไมพิมพ์ไทยแล้วเจอของภาษาอังกฤษ (สกิลข้อ 12) */}
      {!!o.swapLabel && (
        <span style={sx('position:absolute;top:50%;transform:translateY(-50%);font:600 11px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border-radius:6px;padding:3px 8px;white-space:nowrap;pointer-events:none',
          { right: (มีปุ่มล้าง ? h - 6 : 10) + 'px' })}>
          ค้นว่า {o.swapLabel}
        </span>
      )}

      {มีปุ่มล้าง && (
        <div {...kb(o.onClear)} aria-label="ล้างคำค้น" title="ล้างคำค้น" className="hv-bg-f6"
          style={sx('position:absolute;top:50%;transform:translateY(-50%);border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b746e',
            { right: '7px', width: ปุ่ม + 'px', height: ปุ่ม + 'px', font: '400 ' + Math.round(h * 0.31) + 'px/1 Sarabun, sans-serif' })}>✕</div>
      )}
    </div>
  );
}
