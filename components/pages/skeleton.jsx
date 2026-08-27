// ═══════════════════════════════════════════════════════════════════════════
// โครงจาง ๆ ระหว่างรอข้อมูล (skeleton)
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 27 ส.ค. 2569: "หน้าโหลดทุกหน้า ทำ skeleton ไว้ให้หมด
//                          และต้องโครงเหมือนกับเว็บ"
//
// เดิมทุกหน้าขึ้นข้อความ "กำลังโหลด..." ลอยอยู่กลางที่ว่าง ซึ่งมีปัญหา 3 อย่าง
//   1. ไม่บอกว่ากำลังจะได้อะไรมา — ผู้ใช้เดาไม่ออกว่าหน้านี้หน้าตายังไง
//   2. พอข้อมูลมาถึง หน้าจอกระโดดจากที่ว่างเปล่าเป็นตารางเต็ม ตาต้องหาจุดเริ่มใหม่
//   3. ดูเหมือนเว็บค้าง มากกว่าดูเหมือนกำลังทำงาน
//
// 🚨 กฎข้อเดียวของไฟล์นี้: โครงจางต้องมีรูปร่างเหมือนของจริง
//    ตาราง 9 คอลัมน์ต้องได้โครง 9 คอลัมน์ที่กว้างเท่ากันเป๊ะ
//    ไม่ใช่กล่องสี่เหลี่ยมมั่ว ๆ ที่ไม่เกี่ยวกับหน้านั้น
//    ไม่งั้นตอนข้อมูลมาถึงหน้าจอก็ยังกระโดดอยู่ดี = ไม่ได้แก้อะไรเลย
import React from 'react';
import { s, sx } from '../helpers';

// แถบจางหนึ่งท่อน — ใช้เป็นชิ้นส่วนของทุกอย่างในไฟล์นี้
// w รับได้ทั้ง '120px' และ '60%' · h เป็นความสูงเป็น px
export function skelBar(w, h, extra) {
  return (
    <span className="skel" style={sx('display:block;border-radius:6px', Object.assign({
      width: w || '100%',
      height: (h || 12) + 'px'
    }, extra || {}))} />
  );
}

// ── ตาราง ────────────────────────────────────────────────────────────────
// cols  = รายการคอลัมน์จริงของหน้านั้น ([{ w, flex, align }])
//         ส่งของจริงเข้ามาเสมอ อย่าสร้างชุดใหม่ให้ตรงกันเอง เดี๋ยวหลุดกันภายหลัง
// rows  = จำนวนแถวจาง (ใส่เท่าที่หน้าจอเห็นพอดี ไม่ต้องเท่าข้อมูลจริง)
export function skelTable(cols, rows, opts) {
  const o = opts || {};
  const n = rows || 8;
  // ความยาวแถบในแต่ละช่องสลับกันเล็กน้อย จะได้ไม่ดูเป็นบล็อกตันเหมือนตารางเปล่า
  const widths = ['72%', '54%', '86%', '63%', '48%', '78%', '58%', '68%'];

  return (
    <div className="col-tab" style={s('border:1px solid rgba(30,36,32,.10);border-radius:11px;background:#fff;overflow:hidden')}>
      {/* หัวคอลัมน์ — ใช้ข้อความจริง ไม่ทำเป็นแถบจาง
          ผู้ใช้จะได้รู้ตั้งแต่วินาทีแรกว่ากำลังจะได้ตารางอะไรมา
          🚨 ต้องเขียน position:static ทับ — คลาส .col-head มี position:sticky
             หัวจะลอยไปติดขอบบนของกรอบ แล้วไปโผล่กลางแถวจาง (พี่กันเห็นแล้วทัก 27 ส.ค. 2569)
          🚨 หน้าไหนวาดหัวตารางของตัวเองอยู่แล้ว (หน้าประวัติ · หน้าคลังยา)
             ต้องส่ง noHead:true มาด้วย ไม่งั้นหัวจะซ้อนกันสองแถว */}
      {!o.noHead && <div className="col-head" style={s('display:flex;padding:11px 15px;background:#e3f0e8;border-bottom:1px solid rgba(47,125,93,.22);font:600 11.5px Sarabun,sans-serif;letter-spacing:.04em;color:#414a44;position:static')}>
        {cols.map((c, i) => (
          <span key={c.key || i}
            style={sx('display:flex;align-items:center;gap:4px;user-select:none',
              c.flex ? { flex: 1, minWidth: '120px' } : { width: c.w, flex: 'none' },
              c.align === 'right' ? { justifyContent: 'flex-end' }
                : c.align === 'center' ? { justifyContent: 'center' } : {}
            )}>{c.label}</span>
        ))}
      </div>}

      {Array.from({ length: n }).map((_, r) => (
        <div key={r} className="col-row" style={sx('display:flex;align-items:center;border-top:1px solid rgba(30,36,32,.06)', { background: r % 2 ? '#fbfcfb' : '#fff' })}>
          {cols.map((c, i) => (
            <span key={c.key || i}
              style={sx('display:flex;align-items:center',
                c.flex ? { flex: 1, minWidth: '120px' } : { width: c.w, flex: 'none' },
                c.align === 'right' ? { justifyContent: 'flex-end' }
                  : c.align === 'center' ? { justifyContent: 'center' } : {}
              )}>
              {skelBar(widths[(r + i) % widths.length], o.barH || 11)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── ตารางที่ทำด้วยแท็ก <table> จริง (หน้าคลังยา) ─────────────────────────
// 🚨 หน้าคลังยาใช้ <table> + <colgroup> ไม่ใช่ div flex เหมือนหน้าอื่น
//    จะใช้ skelTable ตัวบนไม่ได้ ความกว้างคอลัมน์จะไม่ตรงกับของจริง
//    ตัวนี้จึงวาดด้วยแท็กเดียวกันและใช้ colgroup ชุดเดียวกัน
export function skelTableTag(cols, rows, opts) {
  const o = opts || {};
  const n = rows || 10;
  const widths = ["72%", "54%", "86%", "63%", "48%", "78%", "58%", "68%"];
  return (
    <div style={s("border:1px solid #eef1ee;border-radius:10px;overflow:hidden")}>
      <table style={s("width:100%;border-collapse:collapse")}>
        <colgroup>
          {cols.map((c) => <col key={c.key} style={c.w ? { width: c.w } : undefined} />)}
          {o.extraCols ? o.extraCols.map((w, i) => <col key={"x" + i} style={{ width: w }} />) : null}
        </colgroup>
        {/* หัวตารางใช้ข้อความจริง สีเขียวทึบเหมือนของจริง
            ผู้ใช้จะได้รู้ตั้งแต่วินาทีแรกว่ากำลังจะได้คอลัมน์อะไรบ้าง */}
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={s("padding:9px 10px;text-align:left;font:600 12px Sarabun,sans-serif;color:#fff;background:#2f7d5d;white-space:nowrap")}>{c.label}</th>
            ))}
            {o.extraCols ? o.extraCols.map((w, i) => (
              <th key={"x" + i} style={s("padding:9px 10px;background:#2f7d5d")} />
            )) : null}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }).map((_, r) => (
            <tr key={r} style={sx("border-top:1px solid #f2f5f3", { background: r % 2 ? "#fbfcfb" : "#fff" })}>
              {cols.map((c, i) => (
                <td key={c.key || i} style={s("padding:9px 10px")}>
                  {skelBar(widths[(r + i) % widths.length], o.barH || 10)}
                </td>
              ))}
              {o.extraCols ? o.extraCols.map((w, i) => (
                <td key={"x" + i} style={s("padding:9px 10px")}>{skelBar("70%", o.barH || 10)}</td>
              )) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── การ์ดใบเดียว ─────────────────────────────────────────────────────────
export function skelCard(h, extra) {
  return (
    <div style={sx('background:#fff;border:1px solid rgba(30,36,32,.10);border-radius:12px;padding:16px 18px', extra || {})}>
      {skelBar('38%', 13, { marginBottom: '14px' })}
      {skelBar('100%', (h || 120) - 40, { borderRadius: '9px' })}
    </div>
  );
}

// ── หน้าสรุป ─────────────────────────────────────────────────────────────
// วางตามโครงจริง — ตัวเลขใหญ่ซ้าย · แถบสัดส่วนขวา · กราฟกับ Top 10 ข้างล่าง
export function skelSummary() {
  return (
    <div>
      {/* 🚨 ไม่วาดหัวเรื่องกับปุ่มปีงบ — หน้าสรุปวาดของจริงไว้แล้ว
          พี่กันทัก 27 ส.ค. 2569 ว่าไม่ควรจางทั้งหน้า หัวที่วาดได้ทันทีต้องเป็นของจริง */}
      <div style={s('display:flex;flex-wrap:wrap;gap:26px;align-items:flex-start;margin-bottom:26px')}>
        <div style={s('flex:1 1 420px;min-width:0')}>
          {skelBar('42%', 15, { marginBottom: '10px' })}
          {skelBar('76%', 74, { borderRadius: '10px', marginBottom: '10px' })}
          {skelBar('54%', 13)}
        </div>
        <div style={s('flex:1 1 260px;min-width:0')}>
          {skelBar('50%', 13, { marginBottom: '9px' })}
          {skelBar('44%', 30, { borderRadius: '8px', marginBottom: '14px' })}
          {skelBar('100%', 10, { borderRadius: '99px', marginBottom: '13px' })}
          {skelBar('72%', 12, { marginBottom: '9px' })}
          {skelBar('46%', 12)}
        </div>
      </div>
      <div style={s('display:flex;flex-wrap:wrap;gap:22px')}>
        <div style={s('flex:1 1 420px;min-width:0')}>{skelCard(230)}</div>
        <div style={s('flex:1 1 420px;min-width:0')}>{skelCard(230)}</div>
      </div>
    </div>
  );
}

// ── หน้าต่างแก้ไขล็อต ────────────────────────────────────────────────────
// พี่กันทัก 27 ส.ค. 2569: "รูปสี่ไม่มีโครงอ่ะ"
// โครงตามของจริง — ช่องผู้บันทึกกับวันที่บนสุด · ชิปแหล่งที่มา · แล้วรายการยา
export function skelLotEdit() {
  return (
    <div>
      <div style={s("padding:15px 20px;border-bottom:1px solid #eef1ee")}>
        {skelBar("170px", 12, { marginBottom: "12px" })}
        <div style={s("display:flex;gap:14px;margin-bottom:14px")}>
          <div style={s("flex:1;min-width:0")}>
            {skelBar("58px", 11, { marginBottom: "6px" })}
            {skelBar("100%", 38, { borderRadius: "9px" })}
          </div>
          <div style={s("flex:1;min-width:0")}>
            {skelBar("70px", 11, { marginBottom: "6px" })}
            {skelBar("100%", 38, { borderRadius: "9px" })}
          </div>
        </div>
        {skelBar("64px", 11, { marginBottom: "7px" })}
        <div style={s("display:flex;gap:6px;flex-wrap:wrap")}>
          {[92, 78, 96, 82, 70].map((w, i) => (
            <span key={i}>{skelBar(w + "px", 30, { borderRadius: "999px" })}</span>
          ))}
        </div>
      </div>
      <div style={s("padding:6px 20px 14px")}>
        <div style={s("display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #f2f5f3")}>
          {skelBar("40px", 11)}
          <span style={s("margin-left:auto")}>{skelBar("56px", 11)}</span>
          {skelBar("64px", 11)}
          {skelBar("56px", 11)}
          {skelBar("70px", 11)}
        </div>
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <div key={r} style={s("display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f7f9f7")}>
            <span style={s("flex:1;min-width:0")}>{skelBar(r % 2 ? "64%" : "78%", 12)}</span>
            {skelBar("62px", 12)}
            {skelBar("46px", 12)}
            {skelBar("64px", 12)}
            {skelBar("88px", 26, { borderRadius: "8px" })}
          </div>
        ))}
      </div>
    </div>
  );
}