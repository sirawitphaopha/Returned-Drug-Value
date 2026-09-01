// ข้อความเด้ง — คัดจากมอคอัป (บรรทัด 665–673)
import { s } from '../helpers';

// 🚨 มอคอัปตรึงข้อความเด้งไว้ที่ bottom:96px ตายตัว แต่หน้าบันทึกแบบมือถือมีแถบบันทึก
//    ซ้อนอยู่เหนือแถบเมนู รวมกันสูงกว่า 200px ข้อความ "บันทึกสำเร็จ" จึงไปทับ
//    ตัวเลขมูลค่ารวมพอดี อ่านไม่ออกทั้งคู่
//    --bottombar คือความสูงจริงของแถบล่าง วัดด้วย ResizeObserver ใน MedReturnApp.jsx
//    (ค่าสำรอง 96px ไว้เผื่อจังหวะแรกที่ยังวัดไม่เสร็จ)
// 🚨 ข้อความค้างจนกว่าจะกดปิด (ผลตรวจข้อ ก-2 · พี่กันเคาะ 26 ส.ค. 2569)
//    กล่องต้องรับการกดได้ จึงเอา pointer-events:none ออกจากตัวกล่อง
//    แต่คงไว้ที่ชั้นนอก ไม่งั้นแถบใสเต็มความกว้างจะบังปุ่มที่อยู่ข้างหลัง
//
// 🚨 ปุ่มปิดใช้ onClick ตรง ๆ ไม่ใช้ kb() — kb() ผูก Enter กับ Space เข้ากับปุ่มด้วย
//    ซึ่งพี่กันสั่งห้ามชัดเจน เพราะ Enter เป็นปุ่มที่กดรัวตอนกรอกยา
export function renderToast(V) {
  if (!V.toastOpen) return null;
  return (
    <div role="status" aria-live="polite" style={s('position:fixed;left:0;right:0;bottom:calc(var(--bottombar, 96px) + 14px);z-index:95;display:flex;justify-content:center;pointer-events:none;padding:0 14px')}>
      <div style={s('display:flex;align-items:center;gap:10px;max-width:460px;background:#1e2420;color:#fff;border-radius:12px;padding:11px 11px 11px 15px;box-shadow:0 10px 30px rgba(30,36,32,.28);pointer-events:auto')}>
        <span style={{ ...s("width:20px;height:20px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px Sarabun,sans-serif;flex:none"), background: V.toastDot }}>{V.toastIcon}</span>
        <span style={s('font:500 13.5px/1.45 Sarabun,sans-serif;flex:1;min-width:0;overflow-wrap:anywhere')}>{V.toastText}</span>
        <span style={{ ...s("font:700 14px Sarabun,sans-serif;font-variant-numeric:tabular-nums;flex:none"), color: V.toastValueColor }}>{V.toastValue}</span>
        {/* ปุ่มปิดมีเฉพาะข้อความผิดพลาด — ข้อความสำเร็จหายเองใน 4 วินาที
            ถ้าใส่ปุ่มให้ทุกอัน กรอกยา 30 ตัวก็ต้องกดปิด 30 ครั้ง (พี่กันทัก) */}
        {V.toastClosable && (
          <span
            onClick={V.closeToast}
            role="button"
            aria-label="ปิดข้อความ"
            title="ปิดข้อความ"
            style={s('flex:none;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font:400 14px Sarabun,sans-serif;color:rgba(255,255,255,.72);background:rgba(255,255,255,.1);cursor:pointer')}
          >✕</span>
        )}
      </div>
    </div>
  );
}
