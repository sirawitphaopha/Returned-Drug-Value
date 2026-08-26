'use client';
// หน้าที่โผล่แทนจอขาวเมื่อเว็บพังกลางคัน (ผลตรวจข้อ ก-3)
//
// ═══ ทำไมต้องมี ═══
// เว็บนี้เคยพังจนได้จอขาวมาแล้วจริง — 25 ส.ค. 2569 การ์ดหนึ่งในหน้าสรุป
// เรียกตัววาดชื่อยาโดยไม่ส่งข้อมูลมา ทั้งหน้าล่มทันที ไม่มีข้อความอะไรบอกเลย
//
// เภสัชกรที่เจอจอขาวกลางเวรจะไม่รู้ว่า "ยาที่กรอกค้างไว้หายไปแล้วหรือยัง"
// ซึ่งเป็นคำถามที่สำคัญที่สุดในตอนนั้น — หน้านี้จึงต้องตอบข้อนั้นก่อนเรื่องอื่น
//
// 🚨 ร่างที่กรอกค้างไว้ปลอดภัยเสมอ เพราะเก็บใน localStorage (mrv.session)
//    ไม่ได้อยู่ในหน่วยความจำของหน้าจอ — พังแล้วรีเฟรชของยังอยู่ครบ
//
// ⚠️ ไฟล์นี้ต้องพึ่งตัวเองให้มากที่สุด ห้าม import จาก components/
//    เพราะสิ่งที่พังอาจเป็นไฟล์พวกนั้นเอง แล้วหน้านี้จะพังตามไปด้วย
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // ส่งเข้าคอนโซลให้ครบ เผื่อพี่กันเปิด F12 ดูตอนแจ้งปัญหา
    console.error('[หน้าเว็บพัง]', error);
  }, [error]);

  return (
    <main
      role="main"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f6f7f4',
        fontFamily: 'var(--font-sarabun),Sarabun,sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          border: '1px solid rgba(30,36,32,.1)',
          borderRadius: '16px',
          padding: '26px 24px 22px',
          boxShadow: '0 12px 40px rgba(30,36,32,.1)'
        }}
      >
        <div style={{ fontSize: '34px', lineHeight: 1, marginBottom: '12px' }} aria-hidden="true">⚠️</div>

        <h1 style={{ font: '700 19px/1.3 var(--font-sarabun),Sarabun,sans-serif', color: '#1e2420', margin: '0 0 8px' }}>
          หน้าเว็บทำงานผิดพลาด
        </h1>

        <p style={{ font: '400 13.5px/1.6 var(--font-sarabun),Sarabun,sans-serif', color: '#414a44', margin: '0 0 14px' }}>
          เกิดข้อผิดพลาดขึ้นระหว่างแสดงผล ไม่ได้เกิดจากสิ่งที่กรอกไว้
        </p>

        {/* คำตอบของคำถามที่สำคัญที่สุดในตอนนั้น — ต้องอยู่บนสุดและเห็นชัดที่สุด */}
        <div
          role="status"
          style={{
            background: '#eef6f1',
            border: '1px solid #cfe0d6',
            borderRadius: '11px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ font: '600 13.5px var(--font-sarabun),Sarabun,sans-serif', color: '#2f7d5d', marginBottom: '3px' }}>
            รายการที่กรอกค้างไว้ยังอยู่ครบ
          </div>
          <div style={{ font: '400 12.5px/1.55 var(--font-sarabun),Sarabun,sans-serif', color: '#414a44' }}>
            ยาที่เพิ่มไว้แต่ยังไม่ได้กดบันทึก ถูกเก็บไว้ในเครื่องนี้อยู่แล้ว
            กดลองใหม่แล้วจะเห็นเหมือนเดิมทุกรายการ
          </div>
        </div>

        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              flex: '1 1 150px',
              height: '46px',
              borderRadius: '11px',
              border: 'none',
              background: '#2f7d5d',
              color: '#fff',
              font: '600 14.5px var(--font-sarabun),Sarabun,sans-serif',
              cursor: 'pointer'
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            style={{
              flex: '1 1 150px',
              height: '46px',
              borderRadius: '11px',
              border: '1px solid rgba(30,36,32,.16)',
              background: '#fff',
              color: '#414a44',
              font: '600 14.5px var(--font-sarabun),Sarabun,sans-serif',
              cursor: 'pointer'
            }}
          >
            กลับไปหน้าแรก
          </button>
        </div>

        <div style={{ font: '400 11.5px/1.5 var(--font-sarabun),Sarabun,sans-serif', color: '#6b746e', marginTop: '14px' }}>
          ถ้ากดลองใหม่แล้วยังไม่หาย ให้ถ่ายภาพหน้าจอนี้ไว้แล้วแจ้งผู้ดูแลระบบ
        </div>
      </div>
    </main>
  );
}
