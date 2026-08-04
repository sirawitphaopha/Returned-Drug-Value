// ป๊อปอัปยืนยัน — ไม่มีในมอคอัป (มอคอัปกดลบแล้วหายเลย)
// ของจริงต้องยืนยันก่อน เพราะรายการที่ลบไปแล้วกู้คืนไม่ได้ และมูลค่าสะสมจะลดตาม
// ปุ่มยืนยันอยู่ "ซ้าย" ตั้งใจสลับที่กับปุ่มยกเลิก เพื่อกันนิ้วกดต่อจากปุ่มลบทันที
// กดพื้นหลังไม่ปิด ต้องเลือกปุ่มเอง
import { s } from '../helpers';

export function renderConfirm(V) {
  if (!V.confirmOpen) return null;
  return (
    <>
      <div style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:40')}></div>
      <div style={s('position:fixed;inset:0;z-index:41;display:flex;align-items:center;justify-content:center;padding:20px')}>
        <div style={s('width:100%;max-width:400px;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(30,36,32,.28);padding:20px 20px 16px')}>
          <div style={s('font:700 17px/1.3 Sarabun,sans-serif;margin-bottom:8px')}>{V.confirmTitle}</div>
          <div style={s('font:500 13.5px/1.5 Sarabun,sans-serif;color:#1e2420;background:#f6f7f4;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-variant-numeric:tabular-nums')}>{V.confirmDetail}</div>
          <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#c2543c;margin-bottom:16px')}>{V.confirmNote}</div>

          <div style={s('display:flex;gap:9px')}>
            <div onClick={V.confirmRun} className="hv-red" style={s('flex:1;height:46px;border-radius:11px;background:#c2543c;color:#fff;display:flex;align-items:center;justify-content:center;font:600 14.5px Sarabun,sans-serif;cursor:pointer')}>{V.confirmOkLabel}</div>
            <div onClick={V.closeConfirm} className="hv-bg-f6" style={s('flex:1;height:46px;border-radius:11px;border:1px solid rgba(30,36,32,.16);display:flex;align-items:center;justify-content:center;font:600 14.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ยกเลิก</div>
          </div>
        </div>
      </div>
    </>
  );
}
