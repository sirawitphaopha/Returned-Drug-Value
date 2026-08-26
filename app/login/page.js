'use client';
// ═══════════════════════════════════════════════════════════════════════════
// หน้าเข้าสู่ระบบ — ประตูรหัสผ่านร่วมของห้องยา
// ═══════════════════════════════════════════════════════════════════════════
//
// ออกแบบใหม่ 26 ส.ค. 2569 ตามที่พี่กันสั่ง: "ออกแบบหน้านี้ใหม่เลย ขอ three js ทำแอนิเมชั่นฉากหลังด้วย"
//
// ของเดิมเป็นการ์ดขาวลอยบนพื้นเทา ชื่อเว็บกับชื่อหน่วยงานอัดกันจนตัวหนังสือทับกัน
// (ฟอนต์ Charmonman มีหางยาวกว่าฟอนต์ทั่วไป ระยะบรรทัดที่เคยพอดีจึงไม่พอ)
//
// 🚨 หน้านี้เป็นหน้าเดียวที่คนนอกเห็นได้โดยไม่ต้องมีรหัส
//    ห้ามมีข้อมูลผู้ป่วย ห้ามมีชื่อยา ห้ามบอกว่าข้างในมีอะไร — มีแค่ชื่อหน่วยงานกับช่องกรอก
//
// 🚨 ต้องใช้งานได้แม้ฉากหลังโหลดไม่ขึ้น — พื้นไล่สีเป็น CSS ล้วน ไม่ได้พึ่ง three.js
import React from 'react';
import { DEFAULT_ORG } from '@/lib/format';
import Backdrop from './Backdrop';

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

  const ready = !!pw && !busy;

  return (
    <div style={S.page}>
      {/* พื้นไล่สี — อยู่ใต้ฉากหลัง three.js และทำงานเองได้แม้ three.js ไม่โหลด */}
      <div style={S.wash} aria-hidden="true" />
      <Backdrop />

      <main role="main" style={S.center}>
        <div style={S.card}>

          {/* ── หัวการ์ด ────────────────────────────────────────────────────
              🚨 ชื่อเว็บกับชื่อหน่วยงานต้องแยกบรรทัดกันชัด ๆ ห้ามอัดใน flex เดียวกัน
                 ฟอนต์ Charmonman หางยาว ถ้าระยะบรรทัดไม่พอจะทับตัวหนังสือข้างล่าง */}
          <div style={S.brandRow}>
            <div style={S.mark} aria-hidden="true">
              <div style={S.markRing} />
              <span style={S.markGlyph}>฿</span>
            </div>
            <div style={S.brandName}>มูลค่ายาคืน</div>
          </div>

          <div style={S.org}>{DEFAULT_ORG}</div>

          <div style={S.rule} aria-hidden="true" />

          {/* ── แบบฟอร์มจริง (ผลตรวจข้อ ต-1) ────────────────────────────────
              เบราว์เซอร์ต้องรู้ว่านี่คือหน้าเข้าสู่ระบบ ตัวจำรหัสผ่านถึงจะเติมให้
              และปุ่มต้องเป็น <button type="submit"> จริง กด Enter ในช่องถึงจะส่งได้ */}
          <form onSubmit={(e) => { e.preventDefault(); go(); }} noValidate>
            <label htmlFor="mrv-pw" style={S.label}>รหัสผ่านห้องยา</label>

            <div style={S.field}>
              <input
                id="mrv-pw"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                autoFocus
                autoComplete="current-password"
                aria-invalid={err ? 'true' : 'false'}
                aria-describedby={err ? 'mrv-pw-err' : undefined}
                onChange={(e) => setPw(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                style={{ ...S.input, borderColor: err ? 'rgba(194,84,60,.55)' : 'rgba(30,36,32,.14)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                title={showPw ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                style={{ ...S.eye, color: showPw ? '#2f7d5d' : '#8b938d' }}
              >
                {/* วาดด้วย SVG ไม่ใช้ตัวอักษรพิเศษ เครื่องที่ฟอนต์ไม่มีจะได้ไม่กลายเป็นสี่เหลี่ยมว่าง */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.8 12S5.4 5.2 12 5.2 22.2 12 22.2 12 18.6 18.8 12 18.8 1.8 12 1.8 12Z" />
                  <circle cx="12" cy="12" r="3.1" />
                  {/* ไอคอนบอก "สถานะตอนนี้" ไม่ใช่ "สิ่งที่จะเกิดถ้ากด" (พี่กันทักว่ากลับด้าน)
                      มีขีดทับ = ตอนนี้มองไม่เห็นรหัส · ไม่มีขีด = ตอนนี้เห็นรหัสอยู่ */}
                  {!showPw && <path d="M4 20 20 4" />}
                </svg>
              </button>
            </div>

            {/* role="alert" ทำให้โปรแกรมอ่านหน้าจออ่านข้อความนี้ทันทีที่โผล่ */}
            {err && <div id="mrv-pw-err" role="alert" style={S.err}>{err}</div>}

            <button
              type="submit"
              disabled={!ready}
              style={{
                ...S.submit,
                background: ready ? '#2f7d5d' : 'rgba(30,36,32,.07)',
                color: ready ? '#fff' : '#9aa19c',
                cursor: ready ? 'pointer' : 'default',
                boxShadow: ready ? '0 8px 20px rgba(47,125,93,.28)' : 'none'
              }}
            >{busy ? 'กำลังตรวจสอบ' : 'เข้าใช้งาน'}</button>
          </form>

          <div style={S.hint}>กรอกถูกครั้งเดียว เครื่องนี้จะจำไว้ 30 วัน</div>
        </div>

        <div style={S.foot}>© 2569 ภก. สิรวิชญ์ เผ่าผา · กลุ่มงานเภสัชกรรม รพ.ปรางค์กู่</div>
      </main>
    </div>
  );
}

// ── สไตล์ ────────────────────────────────────────────────────────────────────
// หน้านี้เขียนเป็น object ตรง ๆ ไม่ผ่านตัวแปลง s() ของเว็บ
// เพราะโหลดก่อนผ่านประตูรหัสผ่าน จึงตั้งใจไม่ให้พึ่งไฟล์อื่นในโปรเจกต์เกินจำเป็น
// 🚨 ชื่อฟอนต์ต้องเขียนตัวแปร var(--font-xxx) เต็ม ๆ เอง เพราะไม่มี s() มาแปลงให้
const SARABUN = '"TH Sarabun New",var(--font-sarabun),Sarabun,"Leelawadee UI",Tahoma,sans-serif';
const CHARM = 'var(--font-charmonman),Charmonman,cursive';

const S = {
  page: {
    position: 'relative',
    minHeight: '100dvh',
    background: '#eef4f0',
    fontFamily: SARABUN,
    overflow: 'hidden'
  },

  // ไล่สีเขียวอ่อนจากมุมบนซ้ายลงมุมล่างขวา + แสงนวลตรงกลาง
  wash: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    background:
      'radial-gradient(1100px 620px at 18% 8%, #ffffff 0%, rgba(255,255,255,0) 62%),' +
      'radial-gradient(900px 700px at 88% 92%, #dcefe4 0%, rgba(220,239,228,0) 66%),' +
      'linear-gradient(158deg, #f3f8f5 0%, #e6f0ea 52%, #dceae1 100%)'
  },

  center: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: '28px 20px'
  },

  // การ์ดกระจกฝ้า — ฉากหลังลอยผ่านได้จาง ๆ แต่ตัวหนังสือยังคมชัด
  card: {
    width: '100%',
    maxWidth: 396,
    background: 'rgba(255,255,255,.86)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.15)',
    backdropFilter: 'blur(14px) saturate(1.15)',
    border: '1px solid rgba(255,255,255,.8)',
    borderRadius: 20,
    padding: '30px 28px 24px',
    boxShadow: '0 24px 60px rgba(23,54,42,.14), 0 2px 8px rgba(23,54,42,.06)'
  },

  brandRow: { display: 'flex', alignItems: 'center', gap: 12 },

  mark: {
    position: 'relative',
    width: 44, height: 44, flex: 'none',
    borderRadius: 13,
    background: 'linear-gradient(145deg, #3a8f6b 0%, #2f7d5d 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(47,125,93,.32)'
  },
  markRing: {
    position: 'absolute', inset: 6,
    border: '1.8px solid rgba(255,255,255,.42)',
    borderRadius: '50%',
    borderTopColor: 'transparent',
    transform: 'rotate(-38deg)'
  },
  markGlyph: { position: 'relative', font: '700 17px ' + SARABUN, color: '#fff' },

  // 🚨 lineHeight 1.5 ไม่ใช่ 1.15 — Charmonman มีหางลากยาวกว่าฟอนต์ทั่วไป
  //    ของเดิมตั้ง 1.2 แล้วหางไปทับชื่อหน่วยงานข้างล่าง (พี่กันเห็นแล้วทัก)
  brandName: { font: '700 28px/1.95 ' + CHARM, color: '#1e2420', paddingTop: 2 },

  org: {
    font: '400 12.5px/1.6 ' + SARABUN,
    color: '#54605a',
    marginTop: 10,
    overflowWrap: 'anywhere'
  },

  rule: {
    height: 1,
    background: 'linear-gradient(90deg, rgba(47,125,93,.22), rgba(47,125,93,.04))',
    margin: '18px 0 16px'
  },

  label: {
    display: 'block',
    font: '600 12px ' + SARABUN,
    letterSpacing: '.03em',
    color: '#54605a',
    marginBottom: 7
  },

  field: { position: 'relative' },

  // 16px กันไอโฟนซูมหน้าจอเองตอนแตะช่อง (ผลตรวจข้อ ก-11)
  input: {
    width: '100%',
    height: 50,
    padding: '0 48px 0 15px',
    border: '1px solid rgba(30,36,32,.14)',
    borderRadius: 13,
    background: 'rgba(255,255,255,.92)',
    font: '400 16px ' + SARABUN,
    color: '#1e2420',
    outline: 'none'
  },

  eye: {
    position: 'absolute', right: 6, top: '50%',
    transform: 'translateY(-50%)',
    width: 38, height: 38,
    border: 'none', background: 'transparent',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer'
  },

  err: { font: '500 12.5px/1.5 ' + SARABUN, color: '#c2543c', marginTop: 8 },

  submit: {
    width: '100%',
    marginTop: 16,
    height: 50,
    borderRadius: 13,
    border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    font: '600 15px ' + SARABUN,
    transition: 'background .16s, box-shadow .16s'
  },

  hint: {
    font: '400 11.5px/1.6 ' + SARABUN,
    color: '#7d857f',
    marginTop: 14,
    textAlign: 'center'
  },

  foot: {
    position: 'relative',
    zIndex: 1,
    font: '400 11px ' + SARABUN,
    color: '#7d857f',
    textAlign: 'center'
  }
};
