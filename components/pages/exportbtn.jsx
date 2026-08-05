// ── ปุ่มส่งออก CSV — ตัวเดียวใช้ร่วมกันทุกที่ ────────────────────────────────
//
// พี่กันสั่ง: "ขอสีเทล เด่นๆ เเละใส่ icon ดาวโหลด · เปลี่ยนในมือถือด้วย"
// ทำเป็นชิ้นเดียวตามกฎ "อะไรที่คล้ายกันต้องทำให้เหมือนกัน" — ก่อนหน้านี้มี 3 แบบ 3 ที่
//   หน้าประวัติคอม = ปุ่มขาวขอบเทา · หน้าสรุปคอม = ปุ่มโปร่งขอบจาง · หน้าสรุปมือถือ = แถบยาวสีพื้น
// ตอนนี้เหลือหน้าตาเดียว แก้ที่ไฟล์นี้ที่เดียวเปลี่ยนครบทุกจอ
import { sx } from '../helpers';

export const EXPORT_TEAL = '#2f7d5d';

// ไอคอนดาวน์โหลด — ลูกศรลงถาด วาดด้วย SVG ไม่ใช่ตัวอักษรพิเศษ
// (ตัว ⤓ ที่ใช้เดิมขึ้นกับฟอนต์ของเครื่อง บางเครื่องกลายเป็นสี่เหลี่ยมว่าง)
export function iconDownload(size) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none' }}
    >
      <path d="M12 3.5v11" />
      <path d="M7.2 10.2 12 15l4.8-4.8" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

// opt.block = true → แถบเต็มความกว้าง (ใช้ในมือถือ)
//             false → ปุ่มขนาดพอดีตัวอักษร (ใช้ในแถบเครื่องมือฝั่งคอม)
// opt.push  = true → ดันไปชิดขวาสุดของแถว
export function renderExportBtn(onClick, label, opt) {
  const o = opt || {};
  const shape = o.block
    ? 'height:46px;border-radius:12px;font:600 14.5px Sarabun,sans-serif'
    : 'height:38px;padding:0 16px;border-radius:9px;font:600 13px Sarabun,sans-serif';

  return (
    <div
      onClick={onClick}
      className="hv-teal tap"
      style={sx(
        'display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;color:#fff;white-space:nowrap;background:#2f7d5d;box-shadow:0 2px 8px -2px rgba(47,125,93,.55);' + shape,
        o.push ? { marginLeft: 'auto' } : {}
      )}
    >
      {iconDownload(o.block ? 17 : 15)}
      {label}
    </div>
  );
}
