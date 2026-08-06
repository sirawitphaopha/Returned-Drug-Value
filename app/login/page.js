'use client';
// หน้ากรอกรหัสผ่านร่วมของห้องยา — กรอกถูกครั้งเดียวจำไว้ 30 วัน
// หน้าตาใช้ชุดสีเดียวกับทั้งเว็บ (เขียวเทล #2f7d5d บนพื้น #f6f7f4)
import React from 'react';

export default function LoginPage() {
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  // ปุ่มดวงตา — พี่กันขอไว้เผื่อพิมพ์รหัสผิดแล้วอยากดูว่าพิมพ์อะไรไป
  const [showPw, setShowPw] = React.useState(false);

  const go = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      window.location.href = '/';
    } catch (e) {
      setErr(e.message || 'เข้าสู่ระบบไม่สำเร็จ');
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f6f7f4' }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 16, padding: '26px 22px 22px', boxShadow: '0 14px 40px rgba(30,36,32,.10)', border: '1px solid rgba(30,36,32,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2f7d5d', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 'none' }}>
            <div style={{ position: 'absolute', inset: 5, border: '1.8px solid rgba(255,255,255,.45)', borderRadius: '50%', borderTopColor: 'transparent', transform: 'rotate(-38deg)' }}></div>
            <span style={{ font: "700 16px 'IBM Plex Sans Thai',sans-serif", color: '#fff', lineHeight: 1 }}>฿</span>
          </div>
          <div>
            <div style={{ font: '700 17px/1.2 Sarabun,sans-serif', color: '#1e2420' }}>มูลค่ายาคืน</div>
            <div style={{ font: '400 11.5px/1.3 Sarabun,sans-serif', color: '#6b746e' }}>ห้องยา รพ.ปรางค์กู่</div>
          </div>
        </div>

        <div style={{ font: '500 11.5px Sarabun,sans-serif', color: '#6b746e', marginBottom: 5 }}>รหัสผ่านห้องยา</div>
        {/* ช่องรหัสผ่าน + ปุ่มดวงตาซ้อนอยู่ขอบขวา
            เว้น padding ขวา 46px ไว้ให้ตัวอักษรไม่วิ่งไปมุดใต้ปุ่ม */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'}
            value={pw}
            autoFocus
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
            placeholder="กรอกรหัสผ่าน"
            style={{ width: '100%', height: 46, padding: '0 46px 0 13px', border: '1px solid ' + (err ? 'rgba(194,84,60,.5)' : 'rgba(30,36,32,.16)'), borderRadius: 10, background: '#f6f7f4', font: '400 15px Sarabun,sans-serif', color: '#1e2420', outline: 'none' }}
          />
          <div
            onClick={() => setShowPw(!showPw)}
            title={showPw ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
            style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showPw ? '#2f7d5d' : '#9aa19c' }}
          >
            {/* วาดด้วย SVG ไม่ใช้ตัวอักษรพิเศษ เครื่องที่ฟอนต์ไม่มีจะได้ไม่กลายเป็นสี่เหลี่ยมว่าง */}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.8 12S5.4 5.2 12 5.2 22.2 12 22.2 12 18.6 18.8 12 18.8 1.8 12 1.8 12Z" />
              <circle cx="12" cy="12" r="3.1" />
              {/* ไอคอนบอก "สถานะตอนนี้" ไม่ใช่ "สิ่งที่จะเกิดถ้ากด" (พี่กันทักว่ากลับด้าน)
                  มีขีดทับ = ตอนนี้มองไม่เห็นรหัส · ไม่มีขีด = ตอนนี้เห็นรหัสอยู่ */}
              {!showPw && <path d="M4 20 20 4" />}
            </svg>
          </div>
        </div>

        {err && <div style={{ font: '400 12.5px Sarabun,sans-serif', color: '#c2543c', marginTop: 7 }}>{err}</div>}

        <div
          onClick={go}
          style={{ marginTop: 14, height: 46, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 14.5px Sarabun,sans-serif', background: pw && !busy ? '#2f7d5d' : '#e9ebe8', color: pw && !busy ? '#fff' : '#9aa19c', cursor: pw && !busy ? 'pointer' : 'default' }}
        >{busy ? 'กำลังตรวจสอบ' : 'เข้าใช้งาน'}</div>

        <div style={{ font: '400 11.5px/1.6 Sarabun,sans-serif', color: '#9aa19c', marginTop: 13, textAlign: 'center' }}>
          กรอกถูกครั้งเดียว เครื่องนี้จะจำไว้ 30 วัน
        </div>
      </div>
    </div>
  );
}
