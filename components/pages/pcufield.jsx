// ช่องเลือก รพ.สต. ต้นทาง — โผล่เฉพาะตอนเลือกแหล่งที่มาเป็น "รพ.สต."
//
// พี่กันสั่ง 26 ส.ค. 2569:
//   "ตอนที่เลือกติ๊กแหล่งที่มา แล้วลง รพ.สต. ให้มีดรอปดาวน์เลือกได้เพิ่ม"
//   "ถ้าได้ รพ.สต. มา ก็ทำให้ตรงนี้มันแก้ รพ.สต. ได้ด้วยนะ ให้แก้ย้อนหลังได้"
//
// 🚨 ตัววาดตัวเดียวใช้ 3 ที่ — หน้าบันทึกแบบคอม · หน้าบันทึกแบบมือถือ · หน้าต่างแก้ไขล็อต
//    ตรงกับกฎ "อะไรที่คล้ายกันต้องรวมเป็นระบบกลางตัวเดียว"
//    ถ้าแยกเขียน 3 รอบ วันหน้าแก้ที่เดียวแล้วอีกสองที่จะเพี้ยนตามไม่ทัน
//
// ทำไมใช้ <select> ของเบราว์เซอร์ ไม่ทำเมนูเองแบบช่องผู้บันทึก
//   1. หน้าต่างแก้ไขล็อตใช้ <select> สำหรับผู้บันทึกอยู่แล้ว หน้าตาจึงเข้าชุดกัน
//   2. บนมือถือ เบราว์เซอร์เปิดวงล้อเลือกเต็มจอให้เอง กดง่ายกว่าเมนูที่ทำเอง
//   3. รายชื่อ รพ.สต. มีสิบกว่าแห่ง เมนูที่ทำเองต้องจัดการการเลื่อนเองทั้งหมด
//
// 🚨 บังคับเลือกตอนกดส่ง เมื่อรายชื่อ รพ.สต. ถูกตั้งไว้ในระบบแล้ว (พี่กันสั่ง 29 ส.ค. 2569)
//    ด่านตรวจอยู่ที่ handlers/record.js → app.pcuSiteMissing()
//    รายชื่อยังว่างเปล่าเมื่อไหร่ ยังบันทึกได้เหมือนเดิม — ไม่มีตัวเลือกให้กดแล้วยังบังคับ
//    เท่ากับปิดประตูไม่ให้ห้องยาบันทึกงานประจำวันได้เลย
import { s, sx } from '../helpers';

export function renderPcuField(V, o) {
  const opt = o || {};
  if (!V.pcuOn) return null;

  const has = !!V.pcuSite;
  const empty = !V.pcuSites || V.pcuSites.length === 0;

  // ── แบบบรรทัดเดียว ป้ายซ้าย เส้นคั่น แล้วค่าที่เลือก (พี่กันเลือกแบบ ก จากมอคอัป) ──
  //
  //   "ทำเป็นบรรทัดเดียวให้ได้ ทำมอคอัปมาให้เลือก"
  //
  //   หน้าตาเดียวกับช่องวันที่ HN และผู้บันทึกเป๊ะ มือจำที่เดียวใช้ได้ทุกช่อง
  //   ของเดิมกิน 67px (ป้ายบรรทัดบน + ช่องบรรทัดล่าง) แบบนี้เหลือ 40px
  //
  // 🚨 ใช้เฉพาะฝั่งมือถือ (opt.inline) ฝั่งคอมกับหน้าต่างแก้ล็อตยังเป็นแบบเดิม
  //    พี่กันสั่งเรื่องนี้ตอนดูหน้าจอมือถือ ไม่ได้สั่งให้แตะฝั่งคอม
  // 🚨 ยังไม่เลือก = กรอบแดง ป้ายแดง · เลือกแล้ว = กรอบเขียว ป้ายเขียว
  //    สีบอกสถานะแทนป้าย "ต้องเลือกก่อนบันทึก" ที่เคยกินอีกบรรทัด
  // 🚨 ตัวเลือกต้องเป็น 16px ไม่งั้น iPhone ซูมเองตอนแตะ
  // 🚨 line-height 1.7 ไม่ใช่ 1.5 ไม่งั้นยอดสระบน (ไ ำ ึ) โดนขอบช่องตัด
  if (opt.inline) {
    const bd = has ? 'rgba(47,125,93,.34)' : 'rgba(194,84,60,.55)';
    const fg = has ? '#2f7d5d' : '#c2543c';
    if (empty) {
      return (<div style={s('margin-top:9px;font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e;background:#f6f7f4;border-radius:9px;padding:9px 11px')}>ยังไม่ได้ตั้งรายชื่อ รพ.สต. ในระบบ ติดต่อผู้ดูแลระบบเพื่อเพิ่มรายชื่อ</div>);
    }
    return (
      <div style={sx('margin-top:9px;display:flex;align-items:center;height:40px;padding:0;border-radius:9px;background:#fff', { border: '1px solid ' + bd })}>
        <span style={sx('font:500 11px/1.75 Sarabun,sans-serif;flex:none;width:62px;align-self:stretch;display:flex;align-items:center;justify-content:center;white-space:nowrap', { color: fg, borderRight: '1px solid ' + bd })}>รพ.สต.</span>
        <select className={has ? 'hv-bg-f6' : 'hv-bg-red-l'} value={V.pcuSite || ''} onChange={V.onPcuSite} aria-label="เลือก รพ.สต. ต้นทาง"
          style={sx('flex:1;min-width:0;height:100%;border:none;background-color:transparent;padding:0;text-align:center;text-align-last:center;font:400 16px/1.7 Sarabun,sans-serif;cursor:pointer', { color: has ? '#1e2420' : '#c2543c', fontWeight: has ? 600 : 500 })}>
          <option value="" style={s('font:600 14.5px Sarabun,sans-serif;color:#6b746e')}>— เลือก รพ.สต. ก่อนบันทึก —</option>
          {V.pcuSites.map((name) => (<option key={name} value={name} style={s('font:600 14.5px Sarabun,sans-serif;color:#1e2420')}>{name}</option>))}
        </select>
      </div>
    );
  }

  return (
    <div style={s('margin-top:9px')}>
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:5px')}>
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>รพ.สต. ต้นทาง</span>
        {!has && !empty && (
          <span style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#c2543c')}>{opt.required ? 'ต้องเลือกก่อนบันทึก' : 'ยังไม่ได้เลือก'}</span>
        )}
      </div>

      {empty ? (
        // ยังไม่มีรายชื่อในระบบ — บอกให้รู้ว่าต้องทำยังไงต่อ ไม่ใช่โชว์ช่องว่างเปล่าให้งง
        <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e;background:#f6f7f4;border-radius:9px;padding:9px 11px')}>
          ยังไม่ได้ตั้งรายชื่อ รพ.สต. ในระบบ ติดต่อผู้ดูแลระบบเพื่อเพิ่มรายชื่อ
        </div>
      ) : (
        <select
          // 🚨 กรอบเป็นแดงตอนยังไม่ได้เลือกแห่ง สีตอนชี้จึงต้องแดงตาม (พี่กันทัก 27 ส.ค. 2569)
          className={has ? 'hv-bg-f6' : 'hv-bg-red-l'}
          value={V.pcuSite || ''}
          onChange={V.onPcuSite}
          aria-label="เลือก รพ.สต. ต้นทาง"
          style={sx('width:100%;box-sizing:border-box;height:42px;padding:0 10px;border-radius:9px;background-color:#fff;font:600 14.5px Sarabun,sans-serif;cursor:pointer', {
            border: '1px solid ' + (has ? 'rgba(30,36,32,.16)' : 'rgba(194,84,60,.55)'),
            color: has ? '#1e2420' : '#6b746e',
            height: opt.tall ? '44px' : '42px'
          })}
        >
          {/* 🚨 ต้องใส่สไตล์ที่ <option> ด้วย ไม่ใช่แค่ที่ <select>
              วินโดวส์วาดรายการที่กางออกด้วยระบบของตัวเอง ไม่สืบทอดฟอนต์จากตัวแม่
              ใส่แค่ที่ <select> จะได้ฟอนต์ระบบตัวบางสีจางเหมือนเดิม */}
          <option value="" style={s('font:600 14.5px Sarabun,sans-serif;color:#6b746e')}>— เลือก รพ.สต. ก่อนบันทึก —</option>
          {V.pcuSites.map((name) => (
            <option key={name} value={name} style={s('font:600 14.5px Sarabun,sans-serif;color:#1e2420')}>{name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
