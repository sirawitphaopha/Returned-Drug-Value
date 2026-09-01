// แถบบอกว่ามีล็อตที่กรอกค้างไว้
//
// พี่กันสั่ง 31 ส.ค. 2569 หลังเห็นหน้าจอที่มีแถบเรียงกัน 7 อัน
//   "ไปแก้ให้มันสะอาดตานะ"
// แล้วสั่งเพิ่มหลังเห็นของที่แคลร์ทำรอบแรก
//   "มันทับกันหมดแล้ว" · "ต้องกดดูรายละเอียดได้ด้วยสิ"
//
// 🚨🔴 แถบนี้ต้องกินที่คงที่เสมอ ห้ามยืดตามจำนวนล็อต
//    คอลัมน์ซ้ายของหน้าบันทึกคอมถูกล็อกความสูงเท่าจอไว้ (กฎข้อ 3.2)
//    ของที่ยืดได้ในนั้นมีแค่กรอบตาราง ตัวอื่นเป็น flex:none หมด
//    รอบแรกแคลร์ทำเป็นกรอบกางออกในหน้า สูงเพิ่มทีเดียว 290px
//    เนื้อหาเลยล้นทะลุกล่องออกไปทับท้ายเว็บ — พี่กันเห็นเองแล้วทัก
//
//    รายละเอียดจึงต้องไปอยู่ใน "หน้าต่างซ้อน" (pages/parkedsheet.jsx)
//    ซึ่งลอยอยู่เหนือหน้าเว็บ ไม่กินที่ในผังหน้าเลยแม้แต่พิกเซลเดียว
//
// ที่มาของล็อตค้างมี 2 ทาง
//   ① ในเครื่องนี้    — หน้าต่างที่ปิดไปแล้ว (localStorage)
//   ② บนเซิร์ฟเวอร์  — เครื่องนี้ หรือเครื่องอื่น (ตาราง mr_draft)
//
// 🚨 ไม่ดึงกลับมาให้เอง คนที่เปิดหน้าต่างนี้อาจเป็นคนละคนกับที่กรอกค้างไว้
//    ยกเว้นล็อตที่ "ส่งไม่สำเร็จ" ในเครื่องเดียวกัน อันนั้นดึงให้ตั้งแต่เปิดเว็บ
import { s, sx, kb } from '../helpers';

// รวมทุกทางมาเป็นรายการเดียว — ใช้ร่วมกับหน้าต่างซ้อน จึงแยกออกมาเป็นฟังก์ชัน
export function parkedItems(V) {
  return []
    .concat((V.parked || []).map((p) => ({
      key: 'l:' + p.id,
      title: 'จากหน้าต่างที่ปิดไปแล้วในเครื่องนี้',
      detail: [p.countLabel, p.valueLabel, p.whenLabel].filter(Boolean).join(' · '),
      takeLabel: 'เอากลับมา',
      hot: false, mine: true,
      rows: p.rows || [],
      take: p.take, drop: p.drop
    })))
    .concat((V.serverMine || []).map((d) => ({
      key: 's:' + d.key,
      title: d.failed ? 'ล็อตที่ส่งไม่สำเร็จ' : 'เก็บไว้บนเซิร์ฟเวอร์',
      detail: [d.countLabel, d.valueLabel, d.whenLabel,
        d.soon ? d.soonLabel : 'เหลืออีก ' + d.daysLeft + ' วัน'].filter(Boolean).join(' · '),
      takeLabel: 'เอากลับมา',
      hot: !!d.soon, mine: true,
      rows: d.rows || [],
      take: d.take, drop: d.drop
    })))
    .concat((V.serverOther || []).map((d) => ({
      key: 'o:' + d.key,
      title: d.deviceLabel,
      detail: [d.countLabel, d.valueLabel, d.whenLabel,
        d.failed ? 'ส่งไม่สำเร็จ' : '',
        d.soon ? d.soonLabel : 'เหลืออีก ' + d.daysLeft + ' วัน'].filter(Boolean).join(' · '),
      takeLabel: 'เอามาทำต่อ',
      hot: !!d.soon, mine: false,
      rows: d.rows || [],
      take: d.take, drop: d.drop
    })));
}

// สีของแถบ — ใกล้ครบกำหนดล้างเป็นแดง ปกติเป็นครีม
export function parkedTone(hot) {
  // 🚨 btn/hv = สีปุ่มหลัก ต้องอยู่โทนเดียวกับพื้นแถบเสมอ
  //    แถบแดง = ปุ่มแดงเข้ม · แถบครีม = ปุ่มเขียวเทล (คู่สีหลักของเว็บ)
  //    เขียวบนพื้นแดงคือสิ่งที่พี่กันทักว่า "สีเข้ากันแล้วเหรอ"
  return hot
    ? { bg: '#fdf3f5', bd: 'rgba(176,42,91,.24)', fg: '#b02a5b', sub: '#8a6470',
        btn: '#b02a5b', hv: 'hv-crim' }
    : { bg: '#fdf8ec', bd: 'rgba(150,101,15,.26)', fg: '#96650f', sub: '#7a6033',
        btn: '#2f7d5d', hv: 'hv-teal' };
}

export function renderParked(V) {
  const items = parkedItems(V);
  if (!items.length) return null;

  const mine = items.filter((x) => x.mine);
  const other = items.filter((x) => !x.mine);
  const hot = items.some((x) => x.hot);
  const c = parkedTone(hot);

  // ── ล็อตเดียว แสดงรายละเอียดไปเลย ไม่ต้องให้กดอะไรเพิ่ม ──
  //
  // 🚨🔴 เฉพาะฝั่งคอมเท่านั้น (พี่กันเจอเอง 1 ก.ย. 2569 "มันยังเลื่อนไปมาได้อยู่")
  //
  //    แบบล็อตเดียวมีของ 4 ชิ้นในบรรทัดเดียว — ชื่อเครื่องเต็ม (อย่างน้อย 180px)
  //    กับปุ่ม ดูรายละเอียด · เอามาทำต่อ · ทิ้ง รวมแล้วกว้างราว 507px
  //    บนจอมือถือ 390px จึงล้นออกไป 117px แล้วลากทั้งหน้าให้เลื่อนซ้ายขวาตามไปด้วย
  //
  //    ย่อชื่อปุ่มให้สั้นลงแก้ไม่ได้ — พี่กันสั่งไว้ว่า "ไม่ย่อ เอากลับเหมือนเดิม" (กฎข้อ 3.52)
  //    มือถือจึงใช้ปุ่ม "ดูทั้งหมด" ปุ่มเดียวเหมือนตอนมีหลายล็อต
  //    แล้วไปกด เอากลับมา/ทิ้ง ในหน้าต่างซ้อนซึ่งมีปุ่มครบอยู่แล้ว
  //
  // ⚠️ เทสตอนมีหลายล็อตอย่างเดียวจะไม่เจอบั๊กนี้เลย เพราะคนละเส้นทางกัน
  const single = (items.length === 1 && V.wide) ? items[0] : null;

  // ทุกอย่างอยู่บรรทัดเดียว — จำนวนรวม แยกเครื่อง และคำเตือนใกล้ถูกล้าง
  const head = single
    ? single.title + ' · ' + single.detail
    : ['ล็อตที่กรอกค้างไว้ ' + items.length + ' ล็อต',
       mine.length ? 'เครื่องนี้ ' + mine.length : '',
       other.length ? 'เครื่องอื่น ' + other.length : '',
       hot ? 'บางล็อตใกล้ถูกล้าง' : ''].filter(Boolean).join(' · ');

  return (
    <div role="status"
      style={sx('flex:none;margin-bottom:8px;display:flex;align-items:center;gap:9px;padding:6px 8px 6px 12px;border-radius:10px', {
        background: c.bg, border: '1px solid ' + c.bd
      })}>
      {/* 🚨 min-width บนมือถือต้องเป็น 0 — ตั้ง 180px ไว้แล้วกล่องนี้จะไม่ยอมหด
          ต่อให้ที่ไม่พอ มันก็ดันปุ่มให้ล้นออกนอกจอแทนที่จะบีบตัวเอง */}
      <div style={sx('flex:1;font:700 12.5px/1.35 Sarabun,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', { color: c.fg, minWidth: V.wide ? '180px' : 0 })}>
        {head}
      </div>

      {single ? (
        <>
          {/* ล็อตเดียวก็ยังต้องดูได้ว่ามียาอะไรบ้าง ก่อนตัดสินใจว่าจะเอาหรือทิ้ง */}
          <div {...kb(V.toggleOtherDrafts)} aria-label="ดูรายละเอียดล็อตที่กรอกค้างไว้" className="hv-bg-f6 tap"
            style={s('padding:6px 12px;border-radius:8px;border:1px solid rgba(30,36,32,.14);background:#fff;color:#414a44;font:600 12.5px Sarabun,sans-serif;cursor:pointer;min-height:32px;display:flex;align-items:center;flex:none')}>
            ดูรายละเอียด
          </div>
          <div {...kb(single.take)} aria-label="เอาล็อตที่กรอกค้างไว้กลับมา" className={c.hv + ' tap'}
            style={sx('padding:6px 14px;border-radius:8px;color:#fff;font:700 12.5px Sarabun,sans-serif;cursor:pointer;min-height:32px;display:flex;align-items:center;flex:none', { background: c.btn })}>
            {single.takeLabel}
          </div>
          <div {...kb(single.drop)} aria-label="ทิ้งล็อตที่กรอกค้างไว้" className="hv-del tap"
            style={s('padding:6px 12px;border-radius:8px;border:1px solid rgba(176,42,91,.28);background:#fff;color:#b02a5b;font:600 12.5px Sarabun,sans-serif;cursor:pointer;min-height:32px;display:flex;align-items:center;flex:none')}>
            ทิ้ง
          </div>
        </>
      ) : (
        <div {...kb(V.toggleOtherDrafts)} aria-label="ดูรายการล็อตที่กรอกค้างไว้" className={c.hv + ' tap'}
          style={sx('padding:6px 14px;border-radius:8px;color:#fff;font:700 12.5px Sarabun,sans-serif;cursor:pointer;min-height:32px;display:flex;align-items:center;flex:none', { background: c.btn })}>
          ดูทั้งหมด
        </div>
      )}
    </div>
  );
}
