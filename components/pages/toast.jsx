// ข้อความเด้ง — คัดจากมอคอัป (บรรทัด 665–673)
import { s } from '../helpers';

// 🚨 มอคอัปตรึงข้อความเด้งไว้ที่ bottom:96px ตายตัว แต่หน้าบันทึกแบบมือถือมีแถบบันทึก
//    ซ้อนอยู่เหนือแถบเมนู รวมกันสูงกว่า 200px ข้อความ "บันทึกสำเร็จ" จึงไปทับ
//    ตัวเลขมูลค่ารวมพอดี อ่านไม่ออกทั้งคู่
//    --bottombar คือความสูงจริงของแถบล่าง วัดด้วย ResizeObserver ใน MedReturnApp.jsx
//    (ค่าสำรอง 96px ไว้เผื่อจังหวะแรกที่ยังวัดไม่เสร็จ)
export function renderToast(V) {
  if (!V.toastOpen) return null;
  return (
    <div role="status" aria-live="polite" style={s('position:fixed;left:0;right:0;bottom:calc(var(--bottombar, 96px) + 14px);z-index:30;display:flex;justify-content:center;pointer-events:none')}>
      <div style={s('display:flex;align-items:center;gap:10px;max-width:440px;background:#1e2420;color:#fff;border-radius:12px;padding:11px 15px;box-shadow:0 10px 30px rgba(30,36,32,.28)')}>
        <span style={{ ...s("width:20px;height:20px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px Sarabun,sans-serif;flex:none"), background: V.toastDot }}>{V.toastIcon}</span>
        <span style={s('font:500 13.5px Sarabun,sans-serif')}>{V.toastText}</span>
        <span style={{ ...s("font:700 14px Sarabun,sans-serif;font-variant-numeric:tabular-nums"), color: V.toastValueColor }}>{V.toastValue}</span>
      </div>
    </div>
  );
}
