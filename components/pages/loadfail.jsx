// กล่องแจ้งว่าโหลดข้อมูลไม่สำเร็จ — ตัวเดียวใช้ทุกหน้า
//
// 🚨 ทำไมต้องมี (ผลตรวจข้อ ก-1)
//    เดิม "โหลดไม่สำเร็จ" กับ "ไม่มีข้อมูลจริง" หน้าจอออกมาเหมือนกันเป๊ะ
//    หน้าสรุปวาด ฿0.00 ทุกช่อง — ซึ่งเป็นหน้าที่เอาไปเสนอผู้บริหาร
//    หน้าประวัติขึ้น "ไม่พบรายการตามเงื่อนไขนี้" ทั้งที่ความจริงคือเน็ตหลุด
//
//    ตัวเลขที่ผิดแบบเงียบ ๆ อันตรายกว่าการไม่มีตัวเลข เพราะไม่มีใครรู้ว่าต้องสงสัย
//
// 🚨 ต้องมีปุ่มลองใหม่เสมอ — บอกว่าพังแล้วปล่อยให้ผู้ใช้หาทางเอง
//    คนส่วนใหญ่จะรีเฟรชทั้งหน้า ซึ่งทำให้ของที่กรอกค้างไว้เสี่ยงหาย
import { s, sx, kb } from '../helpers';

export function renderLoadFail(o) {
  const dark = !!(o && o.dark);
  const bg = dark ? 'rgba(176,42,91,.12)' : '#fdf3f5';
  const bd = dark ? 'rgba(224,124,158,.34)' : 'rgba(176,42,91,.22)';
  const fg = dark ? '#e79bb5' : '#b02a5b';
  const sub = dark ? '#c5aeb6' : '#8a6470';

  return (
    <div role="status" style={sx('width:100%;border-radius:12px;padding:18px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px', { background: bg, border: '1px solid ' + bd })}>
      <div style={sx('font:700 14.5px Sarabun,sans-serif', { color: fg })}>{o.title || 'โหลดข้อมูลไม่สำเร็จ'}</div>
      <div style={sx('font:500 12.5px Sarabun,sans-serif;line-height:1.55;max-width:420px', { color: sub })}>
        {o.detail || 'ข้อมูลที่ควรแสดงตรงนี้ยังมาไม่ถึง ตัวเลขที่เห็นอาจไม่ครบ ตรวจสอบการเชื่อมต่อแล้วกดลองอีกครั้ง'}
      </div>
      {o.retry && (
        <div {...kb(o.retry)} aria-label="ลองโหลดข้อมูลอีกครั้ง" className="hv-teal tap"
          style={s('margin-top:2px;padding:9px 20px;border-radius:9px;background:#2f7d5d;color:#fff;font:700 13px Sarabun,sans-serif;cursor:pointer;min-height:40px;display:flex;align-items:center')}>
          ลองอีกครั้ง
        </div>
      )}
    </div>
  );
}
