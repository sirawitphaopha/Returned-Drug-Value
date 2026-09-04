// หน้า "เกี่ยวกับ" — ยกโครงมาจากโปรเจกต์ ME-DRP (components/views/SettingsView.tsx)
// ตามที่พี่กันสั่งให้เอามาใส่โปรเจกต์นี้
//
// ปรับจากต้นฉบับ 3 อย่าง
//   1. ชุดสี teal ของ ME-DRP (#0B655D / #0F8A80) → เขียวเทลของเว็บนี้ (#2f7d5d / #24614a)
//   2. เนื้อหาเปลี่ยนเป็นของเว็บมูลค่ายาคืน · TypeScript → JavaScript (เว็บนี้ไม่ใช้ TS)
//   3. ตัวเลขในระบบเปลี่ยนจาก "Med/DRP กี่เคส" เป็น "กี่รายการ · มูลค่าสะสมเท่าไร"
import { s, sx, kb } from '../helpers';

const CARD = 'background:#fff;border:1px solid rgba(47,125,93,.16);border-radius:16px;padding:20px 22px';
const TITLE = 'font:700 15px Sarabun,sans-serif;color:#24614a;margin-bottom:14px';
const KV_ROW = 'display:flex;justify-content:space-between;gap:12px;padding:5px 0';
const KV_L = 'font:400 13.5px/1.75 Sarabun,sans-serif;color:#6b746e';
const KV_R = 'font:600 13.5px/1.75 Sarabun,sans-serif;color:#1e2420';
const CHIP = 'display:flex;align-items:center;gap:8px;background:#f6faf9;border:1px solid rgba(47,125,93,.16);border-radius:10px;padding:8px 13px';
const CHIP_TX = 'font:600 12.5px/1.75 Sarabun,sans-serif;color:#414a44';

// โลโก้ Supabase (สามเหลี่ยมเขียว) — ฝังเป็น SVG ไม่ต้องโหลดรูปจากอินเทอร์เน็ต
const supaLogo = (size) => (
  <svg width={size} height={size} viewBox="0 0 109 113" fill="none">
    <path d="M63.7 110.28c-2.85 3.59-8.64 1.62-8.7-2.96l-.9-67.01h45.05c8.16 0 12.71 9.42 7.63 15.81L63.7 110.28z" fill="#3ECF8E" />
    <path d="M45.32 2.71c2.85-3.59 8.64-1.62 8.7 2.96l.39 67.01H9.94c-8.16 0-12.71-9.42-7.63-15.81L45.32 2.71z" fill="#3ECF8E" fillOpacity=".62" />
  </svg>
);

export function renderAbout(V) {
  return (
    <div style={s('width:100%;max-width:640px;margin:0 auto;padding:14px 16px 60px;display:flex;flex-direction:column;gap:13px')}>

      {/* ── ปุ่มกลับกับหัวเรื่องอยู่แถวเดียวกัน (พี่กันสั่ง 3 ก.ย. 2569) ──────────
          "เอาคำว่า ตั้งค่า กับ เกี่ยวกับ อยู่เสมอปุ่มกดกลับได้ไหม"
          หน้าตั้งค่ากับหน้านี้เป็นคู่กัน หัวเรื่องจึงต้องอยู่ที่เดียวกันทั้งสองหน้า
          🚨 เดิมเป็นป้ายจาง ๆ ลอยเหนือชื่อเว็บ พี่กันบอกว่า "เด่นกว่านี้"
             ย้ายมาอยู่ข้างปุ่มกลับแล้วเด่นขึ้นเองโดยไม่ต้องกินแถวเพิ่ม */}
      <div style={s('display:flex;align-items:center;gap:12px')}>
        {/* 🚨 ปุ่มกลับเหลือลูกศรอย่างเดียว ตัดคำว่า กลับ ออก (พี่กันเลือกแบบ ก · 3 ก.ย. 2569)
            ปุ่มกล่องมีข้อความอยู่ข้างหัวเรื่องตัวใหญ่ สองชิ้นน้ำหนักต่างกันมากจนดูไม่เข้าคู่
            เหลือลูกศรแล้วหัวเรื่องเป็นตัวเด่นตัวเดียวในแถว
            🚨 ต้องมี aria-label เพราะไม่มีข้อความให้โปรแกรมอ่านจออ่านแล้ว
            🚨 ลูกศรวาดด้วย SVG ไม่ใช่ตัวอักษร ← ซึ่งหน้าตาขึ้นกับฟอนต์ของเครื่อง
            🚨 ปุ่ม 38 จุดเล็กกว่าเกณฑ์นิ้ว แต่คลาส tap ขยายพื้นที่กดออกด้านละ 11 จุด
               และไม่มีปุ่มอื่นวางติดกัน จึงไม่มีพื้นที่กดทับกัน (กฎข้อ 3.55) */}
        <div {...kb(V.closeAbout)} className="hv-bg-f6 tap" aria-label="กลับไปหน้าก่อนหน้า"
          style={s('width:38px;height:38px;border:1px solid rgba(30,36,32,.14);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;color:#414a44;cursor:pointer;flex:none')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </div>
        <div role="heading" aria-level="1" style={s('font:700 21px/1.3 Krub,sans-serif;color:#24614a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>เกี่ยวกับ</div>
      </div>

      {/* หัวเรื่อง */}
      {/* 🚨 ไม่มีช่องไฟด้านบน (พี่กันสั่ง "สูงกว่านี้") — ชื่อเว็บลอยต่ำเกินไป
          ตัวการคือหางฟอนต์ Charmonman ที่ลากลงมา ทำให้ดูเหมือนมีที่ว่างข้างบนเยอะกว่าจริง */}
      <div style={s('text-align:center;padding:0 0 2px;margin-top:-4px')}>
        {/* 🚨 ระยะบรรทัด 1.2 ไม่ใช่ 1.95 (พี่กันทัก "รูปสองชื่อเว้บต่ำจัง")
            Charmonman ลากหางลงมายาว ระยะบรรทัดกว้าง ๆ จึงดันตัวอักษรลอยต่ำกลางกล่อง
            ใช้ padding-bottom กันที่ให้หางแทน ซึ่งดันเฉพาะของที่อยู่ข้างล่าง */}
        <div style={s('font:700 30px/1.3 Krub,sans-serif;color:#24614a;padding-bottom:2px')}>มูลค่ายาคืน</div>

        {/* คำอธิบายเว็บ — เกลาใหม่ 3 ก.ย. 2569 (พี่กันสั่ง "เกลาคำนี้ที")
            เดิมเป็นข้อความก้อนเดียว 12.5 จุด สีจาง ยัดคำอธิบายระบบกับชื่อหน่วยงาน
            มาต่อกันด้วยจุดกลาง ตกลงมา 3 บรรทัดติดกัน อ่านยากและดูอึดอัด
            🚨 ไม่ตัดเนื้อหาออกสักคำ แค่แยกคนละบรรทัดตามหน้าที่ของมัน
               บรรทัดบน = เว็บนี้ทำอะไร · บรรทัดล่าง = ของหน่วยงานไหน
            🚨 จำกัดความกว้าง 400 จุด บรรทัดยาวเต็มจอกวาดตาตามยาก */}
        {/* 🚨 แยกสองบรรทัดเอง ไม่ปล่อยให้เบราว์เซอร์ตัดเอง (พี่กันสั่ง "ตัดบรรทัดดีๆ" 3 ก.ย. 2569)
            ปล่อยไว้แล้วได้ "...ตัวชี้วัดราย" ขึ้นบรรทัดใหม่ว่า "ปีงบประมาณ"
            เบราว์เซอร์ตัดคำไทยตามพจนานุกรม ซึ่งถูกหลักภาษาแต่อ่านสะดุด
            แต่ละบรรทัดตอนนี้จบความคิดในตัว — ทำอะไร / ได้อะไร
            🚨 nowrap ใส่ไม่ได้ จอแคบกว่านี้จะล้นออกนอกจอ ใช้ text-wrap:balance ช่วยจัดแทน */}
        <div style={s('font:400 13.5px/1.85 Sarabun,sans-serif;color:#414a44;margin:7px auto 0;max-width:400px;text-wrap:balance')}>
          <div>ระบบแปลงยาที่ผู้ป่วยคืนมาให้เป็นตัวเลขมูลค่า</div>
          <div>พร้อมสรุปเป็นตัวชี้วัดรายปีงบประมาณ</div>
        </div>
        <div style={s('font:500 12px/1.75 Sarabun,sans-serif;color:#6b746e;margin:9px auto 0;padding-top:9px;border-top:1px solid rgba(30,36,32,.09);max-width:400px')}>
          {V.orgName}
        </div>
      </div>

      {/* ผู้พัฒนา */}
      <div style={s(CARD + ';text-align:center')}>
        <div style={s(TITLE)}>👤 ผู้พัฒนา</div>
        <div style={s('font:800 22px/1.25 Sarabun,sans-serif;color:#24614a;margin-top:6px;letter-spacing:-.2px')}>เภสัชกร สิรวิชญ์ เผ่าผา</div>
        <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:5px')}>เลขที่ใบประกอบวิชาชีพเภสัชกรรม 47186</div>
        <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:3px')}>
          กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค<br />โรงพยาบาลปรางค์กู่
        </div>
        <a href="mailto:siravitphoapha9928@hotmail.com" className="hv-bg-e3f" style={s('display:inline-flex;align-items:center;gap:8px;margin-top:14px;background:#e3f0e8;color:#24614a;font:600 13px/1.75 Sarabun,sans-serif;padding:9px 15px;border-radius:10px;text-decoration:none')}>
          ✉️ siravitphoapha9928@hotmail.com
        </a>
      </div>

      {/* ข้อมูลแอป */}
      <div style={s(CARD)}>
        <div style={s(TITLE)}>📱 ข้อมูลแอป</div>
        <div style={s(KV_ROW)}>
          <span style={s(KV_L)}>เวอร์ชันปัจจุบัน</span>
          <span style={s('font:700 13.5px/1.75 Sarabun,sans-serif;color:#24614a')}>v{V.appVersion}</span>
        </div>
        <div style={s(KV_ROW)}>
          <span style={s(KV_L)}>เผยแพร่ครั้งแรก</span>
          <span style={s(KV_R)}>{V.appFirstRelease}</span>
        </div>
        <div style={s(KV_ROW)}>
          <span style={s(KV_L)}>อัปเดตล่าสุด</span>
          <span style={s(KV_R)}>{V.appLastUpdate}</span>
        </div>
      </div>

      {/* เก็บข้อมูลที่ไหน */}
      <div style={s(CARD)}>
        <div style={s(TITLE)}>🗄️ ข้อมูลเก็บที่ไหน</div>
        <div style={s('display:flex;align-items:center;gap:13px')}>
          {supaLogo(34)}
          <div>
            <div style={s('font:700 15px Sarabun,sans-serif;color:#1e2420')}>Supabase</div>
            <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>ฐานข้อมูล PostgreSQL บนคลาวด์ · เข้ารหัส · สำรองข้อมูลอัตโนมัติ</div>
          </div>
        </div>
        <div style={s('margin-top:15px;padding-top:14px;border-top:1px solid rgba(47,125,93,.12);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap')}>
          <span style={sx('font:600 13px/1.75 Sarabun,sans-serif', { color: V.demo ? '#8a5a12' : '#2f7d5d' })}>
            ● {V.demo ? 'กำลังดูข้อมูลตัวอย่าง (ไม่ได้อยู่ในฐานข้อมูล)' : 'เชื่อมต่อฐานข้อมูลแล้ว'}
          </span>
          <span style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{V.aboutStat}</span>
        </div>
        <div style={s('margin-top:12px;padding:11px 13px;border-radius:10px;background:#eef6f1;font:400 12px/1.75 Sarabun,sans-serif;color:#414a44')}>
          กุญแจฐานข้อมูลอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น เบราว์เซอร์ไม่เคยถือกุญแจ · ทุกตารางเปิดระบบกั้นสิทธิ์ข้อมูล (RLS) แบบปฏิเสธทุกคำขอจากภายนอก
        </div>
      </div>

      {/* สร้างด้วยอะไร */}
      <div style={s(CARD)}>
        <div style={s(TITLE)}>🛠️ สร้างด้วยเทคโนโลยี</div>
        {/* 🚨 เรียงเป็นตารางสองคอลัมน์ (พี่กันสั่ง "เรียงสวยๆหน่อย เอาสองคอลัม")
            ของเดิมเป็นแถวที่ปล่อยให้ตกบรรทัดเอง ได้ 3-2-1-2 ชิปต่อแถวไม่เท่ากันเลย
            ตารางทำให้ทุกใบกว้างเท่ากันและขอบตรงกันทั้งบล็อก */}
        <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          <div style={s(CHIP)}>
            <svg width="19" height="19" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#000" />
              <text x="12" y="16.5" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Arial">N</text>
            </svg>
            <span style={s(CHIP_TX)}>Next.js 15</span>
          </div>
          <div style={s(CHIP)}>
            <svg width="21" height="21" viewBox="-11.5 -10.23 23 20.46">
              <circle r="2.05" fill="#61DAFB" />
              <g stroke="#61DAFB" strokeWidth="1.1" fill="none">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
              </g>
            </svg>
            <span style={s(CHIP_TX)}>React 19</span>
          </div>
          <div style={s(CHIP)}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <rect width="24" height="24" rx="4" fill="#F7DF1E" />
              <text x="12" y="16.5" fontSize="10" fontWeight="700" fill="#000" textAnchor="middle" fontFamily="Arial">JS</text>
            </svg>
            <span style={s(CHIP_TX)}>JavaScript</span>
          </div>
          <div style={s(CHIP)}>
            {supaLogo(17)}
            <span style={s(CHIP_TX)}>Supabase</span>
          </div>
          {/* three.js — ใช้กับฉากหลังแคปซูลยาลอยในหน้าเข้าสู่ระบบ (เพิ่ม 26 ส.ค. 2569)
              🚨 โหลดเฉพาะหน้านั้นหน้าเดียว ไม่ถ่วงหน้าบันทึกที่ใช้งานจริงทุกวัน */}
          <div style={s(CHIP)}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.2 21.4 19.6 12 17.2 2.6 19.6z" fill="none" stroke="#1e2420" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 2.2 12 17.2" stroke="#1e2420" strokeWidth="1.1" opacity=".45" />
            </svg>
            <span style={s(CHIP_TX)}>three.js</span>
          </div>
          <div style={s(CHIP)}>
            <svg width="24" height="17" viewBox="0 0 48 30">
              <path d="M33 27H12.5A9 9 0 1 1 15 9.5 12 12 0 0 1 37.5 22.5c3.5.2 4.5 4.5-4.5 4.5z" fill="#F38020" />
            </svg>
            <span style={s(CHIP_TX)}>Cloudflare</span>
          </div>
        </div>
        <div style={s('margin-top:15px;padding-top:14px;border-top:1px solid rgba(47,125,93,.12);display:flex;align-items:center;justify-content:center;gap:8px;font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>
          <svg width="17" height="17" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <g stroke="#D97757" strokeWidth="11" strokeLinecap="round">
              <line x1="50" y1="13" x2="50" y2="87" />
              <line x1="13" y1="50" x2="87" y2="50" />
              <line x1="23.8" y1="23.8" x2="76.2" y2="76.2" />
              <line x1="76.2" y1="23.8" x2="23.8" y2="76.2" />
            </g>
          </svg>
          พัฒนาด้วย <b style={s('font-weight:600;color:#414a44')}>Claude Code</b>
        </div>
      </div>

      {/* PDPA */}
      <div style={s('background:#fef7ec;border:1px solid #f6d89a;border-radius:16px;padding:16px 20px')}>
        <div style={s('font:700 13px/1.75 Sarabun,sans-serif;color:#b45309;margin-bottom:6px')}>🔒 ความปลอดภัยข้อมูล (PDPA)</div>
        <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#92400e')}>
          ข้อมูลผู้ป่วย (HN) ใช้เฉพาะงานบริบาลเภสัชกรรมภายในโรงพยาบาล จัดเก็บอย่างปลอดภัยตามหลักคุ้มครองข้อมูลส่วนบุคคล (PDPA) ห้ามเผยแพร่นอกวัตถุประสงค์
        </div>
      </div>

    </div>
  );
}
