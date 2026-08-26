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
// ⚠️ ไม่บังคับต้องเลือก — ขึ้นเป็นป้ายเตือนแทน (เหตุผลเดียวกับยาที่ยังไม่ใส่ราคา ข้อ 3.21)
//    ถ้าบังคับแล้วรายชื่อยังไม่ได้ตั้งค่า ห้องยาจะบันทึกงานประจำวันไม่ได้เลย
//    ซึ่งแย่กว่าข้อมูลที่ยังไม่ครบ · ป้ายเตือนทำให้เห็นว่าตกหล่นอยู่แล้ว
import { s, sx } from '../helpers';

export function renderPcuField(V, o) {
  const opt = o || {};
  if (!V.pcuOn) return null;

  const has = !!V.pcuSite;
  const empty = !V.pcuSites || V.pcuSites.length === 0;

  return (
    <div style={s('margin-top:9px')}>
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:5px')}>
        <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>รพ.สต. ต้นทาง</span>
        {!has && !empty && (
          <span style={s('font:500 11px Sarabun,sans-serif;color:#c2543c')}>ยังไม่ได้เลือก</span>
        )}
      </div>

      {empty ? (
        // ยังไม่มีรายชื่อในระบบ — บอกให้รู้ว่าต้องทำยังไงต่อ ไม่ใช่โชว์ช่องว่างเปล่าให้งง
        <div style={s('font:400 12px/1.55 Sarabun,sans-serif;color:#6b746e;background:#f6f7f4;border-radius:9px;padding:9px 11px')}>
          ยังไม่ได้ตั้งรายชื่อ รพ.สต. ในระบบ ติดต่อผู้ดูแลระบบเพื่อเพิ่มรายชื่อ
        </div>
      ) : (
        <select
          value={V.pcuSite || ''}
          onChange={V.onPcuSite}
          aria-label="เลือก รพ.สต. ต้นทาง"
          style={sx('width:100%;box-sizing:border-box;height:42px;padding:0 10px;border-radius:9px;background:#fff;font:600 14.5px Sarabun,sans-serif;cursor:pointer', {
            border: '1px solid ' + (has ? 'rgba(30,36,32,.16)' : 'rgba(194,84,60,.55)'),
            color: has ? '#1e2420' : '#6b746e',
            height: opt.tall ? '44px' : '42px'
          })}
        >
          {/* 🚨 ต้องใส่สไตล์ที่ <option> ด้วย ไม่ใช่แค่ที่ <select>
              วินโดวส์วาดรายการที่กางออกด้วยระบบของตัวเอง ไม่สืบทอดฟอนต์จากตัวแม่
              ใส่แค่ที่ <select> จะได้ฟอนต์ระบบตัวบางสีจางเหมือนเดิม */}
          <option value="" style={s('font:600 14.5px Sarabun,sans-serif;color:#6b746e')}>— เลือก รพ.สต. —</option>
          {V.pcuSites.map((name) => (
            <option key={name} value={name} style={s('font:600 14.5px Sarabun,sans-serif;color:#1e2420')}>{name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
