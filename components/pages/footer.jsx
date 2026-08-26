// ท้ายเว็บ — ไม่มีในมอคอัป พี่กันขอให้มีแบบเว็บทั่วไป
//
// วางไว้ท้ายพื้นที่เลื่อน เลื่อนสุดแล้วเจอ · ไม่ลอยทับอะไร
// คอม = แถวเดียว ซ้าย-ขวา · มือถือ = ซ้อนกลางจอ ตัวเล็กลง
// หน้าสรุปมีธีมเข้มด้วย เลยรับสีมาจาก V แทนที่จะฝังสีตายตัว
import { s, sx, kb } from '../helpers';

export function renderFooter(V) {
  if (V.isAbout) return null;      // หน้าเกี่ยวกับมีเนื้อหาพวกนี้อยู่แล้ว ไม่ต้องซ้ำ

  const wide = V.wide;
  const muted = V.isSummary ? V.sumMuted : '#6f7873';
  const line = V.isSummary ? V.sumBorder : 'rgba(30,36,32,.08)';

  return (
    <div style={sx('margin-top:auto;padding:16px 20px 20px', {
      borderTop: '1px solid ' + line
    })}>
      <div style={sx('max-width:1400px;margin:0 auto;display:flex;gap:8px', wide
        ? { alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }
        : { flexDirection: 'column', alignItems: 'center', textAlign: 'center' })}>

        <div style={sx('display:flex;align-items:center;gap:8px;min-width:0', wide ? {} : { justifyContent: 'center' })}>
          <span style={s('width:18px;height:18px;border-radius:5px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;flex:none')}>
            <span style={s("font:700 9px Sarabun,sans-serif;color:#fff;line-height:1")}>฿</span>
          </span>
          <span style={sx('font:500 11.5px Sarabun,sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', { color: muted })}>
            มูลค่ายาคืน v{V.appVersion} · {V.orgName}
          </span>
        </div>

        <div style={sx('display:flex;align-items:center;gap:10px;flex-wrap:wrap', wide ? {} : { justifyContent: 'center' })}>
          <span style={sx('font:400 11px Sarabun,sans-serif', { color: muted })}>
            © {V.footerYear} ภก. สิรวิชญ์ เผ่าผา · กลุ่มงานเภสัชกรรม รพ.ปรางค์กู่
          </span>
          <span {...kb(V.openAbout)} className="tap" style={sx('font:600 11px Sarabun,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px', { color: V.isSummary ? V.sumMuted : '#2f7d5d' })}>
            เกี่ยวกับ
          </span>
        </div>
      </div>
    </div>
  );
}
