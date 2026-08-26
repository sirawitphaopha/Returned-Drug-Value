'use client';
// ตัวรับข้อผิดพลาดชั้นนอกสุด — ใช้เมื่อ layout.js เองพัง (ผลตรวจข้อ ก-3)
//
// 🚨 ต่างจาก app/error.js ตรงที่ตัวนี้ต้องวาด <html> กับ <body> เอง
//    เพราะ layout ที่ปกติวาดให้ คือสิ่งที่พังอยู่
//
// ⚠️ ห้ามพึ่งฟอนต์ที่ layout ฝังไว้ (var(--font-sarabun)) เพราะ layout ไม่ได้ทำงาน
//    ใช้ฟอนต์ที่มีในเครื่องแทน — เสียความสวยแต่ยังอ่านออก ซึ่งสำคัญกว่าตอนนี้
export default function GlobalError({ error, reset }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, background: '#f6f7f4', fontFamily: 'Sarabun,"Leelawadee UI",Tahoma,sans-serif' }}>
        <main
          role="main"
          style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '16px', padding: '26px 24px', border: '1px solid rgba(30,36,32,.1)' }}>
            <div style={{ fontSize: '34px', lineHeight: 1, marginBottom: '12px' }} aria-hidden="true">⚠️</div>
            <h1 style={{ font: '700 19px/1.3 inherit', color: '#1e2420', margin: '0 0 8px' }}>
              เว็บโหลดไม่สำเร็จ
            </h1>
            <p style={{ font: '400 13.5px/1.6 inherit', color: '#414a44', margin: '0 0 16px' }}>
              เกิดข้อผิดพลาดตั้งแต่ตอนเริ่มโหลดหน้าเว็บ
              รายการที่กรอกค้างไว้ยังถูกเก็บอยู่ในเครื่องนี้ ไม่ได้หายไปไหน
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ width: '100%', height: '46px', borderRadius: '11px', border: 'none', background: '#2f7d5d', color: '#fff', font: '600 14.5px inherit', cursor: 'pointer' }}
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
