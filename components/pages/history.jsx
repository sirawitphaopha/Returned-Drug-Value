// หน้าประวัติการบันทึก — คัดจากมอคอัป (คอม 224–265 · มือถือ 267–313)
// เพิ่มจากต้นฉบับอย่างเดียวคือข้อความ "กำลังโหลด" เพราะของจริงต้องรอเซิร์ฟเวอร์
import { s, sx, kb, Z } from '../helpers';
import { renderPageHead, HEAD_PAD } from './pagehead';
import { renderExportBtn } from './exportbtn';
import { renderDrugName } from './drugname';
import { skelTable, skelCard } from './skeleton';
import { renderLoadFail } from './loadfail';
import { renderSortClear } from './sortclear';
import { renderPageTitle } from './pagetitle';
import { renderSearchBox } from './thaibox';
import { renderScrollBtns } from './scrollbtns';

// แถบเครื่องมือเสริม — ไม่มีในมอคอัป
// เดิมมีแค่ 4 ปุ่มช่วงเวลาสำเร็จรูป + ตัดที่ 60 แถว แล้วบอกให้ "กรองช่วงวันที่ให้แคบลง"
// ทั้งที่ไม่มีเครื่องมือเลือกช่วงวันเลย · เพิ่ม เลือกช่วงวันเอง + ถังขยะ + ดูรายล็อต
function renderHistTools(V) {
  // 🚨 ระยะใต้แถบนี้ต้องเท่ากับระยะระหว่างแถวในแถบเอง (พี่กันสั่ง 10 ก.ย. 2569)
  //    "ระยะห่างบนมันแคบกว่าระยะห่างล่าง เราอยากให้มันแคบเท่ากันวงบน"
  //    3 (ตรงนี้) + 6 (padding ล่างของ .hist-head) + เส้นแบ่ง = 10 เท่ากับระยะระหว่างแถวพอดี
  // ⚠️ คอมเมนต์แบบ JSX วางเป็นลูกตัวแรกของ return ไม่ได้ เว็บพังทั้งหน้า (ข้อ 3.68)
  return (
    <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:3px')}>

      {/* หน้ารายการ Lot — ประวัติเป็นรายแถวยา มองไม่ออกว่ารอบไหนรับคืนไปเท่าไหร่
          ต้องไล่บวกเอง · หน้านั้นตอบได้ในบรรทัดเดียวต่อ Lot และพิมพ์ใบสรุปได้ */}
      {/* 🚨 ปุ่มนี้เด่นกว่าชิปช่วงเวลาโดยตั้งใจ (พี่กันสั่ง 26 ส.ค. 2569)
          ชิปช่วงเวลาเป็นแค่ตัวกรองของหน้าเดิม แต่ปุ่มนี้พาไปอีกหน้าหนึ่ง
          ของสองอย่างที่ทำคนละเรื่องกันไม่ควรหน้าตาเหมือนกัน
          ใช้พื้นเขียวอ่อนกับขอบเขียว ไม่ใช่เขียวทึบ เพราะเขียวทึบจองไว้ให้
          "ช่วงเวลาที่กำลังเลือกอยู่" แล้ว ถ้าใช้ซ้ำจะอ่านผิดว่าปุ่มนี้ถูกเลือกอยู่ */}
      <div {...kb(V.openLots)} className="hv-bg-e3f tap" style={s('height:40px;display:inline-flex;align-items:center;gap:7px;padding:0 15px;border-radius:10px;border:1px solid rgba(47,125,93,.34);font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;background-color:#e3f0e8;color:#2f7d5d;flex:none')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
        </svg>
        รายการ Lot
      </div>

      {/* ── ปุ่มกลับจากถังขยะ — โผล่เฉพาะตอนอยู่ในถังขยะ ──────────────────
          พี่กันสั่ง 10 ก.ย. 2569 ให้ย้ายทางเข้าถังขยะไปไว้ในหน้าตั้งค่า
          "เอาปุ่มถังขยะออก เอาไปไว้ที่ตั้งค่า เอาไว้กดแล้วมันจะเด้งมาหน้าตารางนี้เอง"
          🚨 ทางออกต้องอยู่ตรงนี้เสมอ ไม่งั้นเข้าถังขยะแล้วออกไม่ได้
          🚨 คลาส hover ต้องเป็น hv-teal เพราะปุ่มพื้นเขียวตัวหนังสือขาว
             ถ้าใช้ hv-bg-f6 (พื้นขาวนวล) ตัวหนังสือขาวจะกลืนหาย (พี่กันเจอเอง 25 ส.ค. 2569) */}
      {V.histTrash && (
        <div {...kb(V.toggleTrash)} className="hv-teal tap" style={s('height:40px;display:flex;align-items:center;padding:0 14px;border-radius:10px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;background-color:#2f7d5d;color:#fff;white-space:nowrap;flex:none')}>
          {V.trashLabel}
        </div>
      )}

      {/* ปุ่มล้างการเรียง — พี่กันสั่งให้มาอยู่ข้างถังขยะ 4 ก.ย. 2569
          โผล่เฉพาะตอนกดเรียงเองแล้วจริง ๆ */}
      {renderSortClear(V.histSortClear)}

      {/* ── ตัวกรอง 3 ทาง — สถานะ · แหล่งที่มา · ผู้บันทึก (พี่กันสั่ง 10 ก.ย. 2569) ──
          "ใส่ด้วย" พร้อมภาพช่องเลือก 3 ช่อง

          🚨 กรองที่ฐาน ไม่ใช่กรองแถวที่โหลดมาแล้ว — หน้านี้โหลดทีละ 60 แถว
             กรองในเครื่องจะได้ตัวเลขที่โกหกโดยไม่มีอะไรเตือน
          🚨 ช่องที่กรองอยู่เปลี่ยนเป็นพื้นเขียวอ่อน ตาจะได้เห็นทันทีว่าตัวไหนกรองค้างอยู่
             ไม่งั้นเลื่อนดูแล้วรายการหาย จะไล่หาไม่เจอว่าตั้งอะไรไว้ตรงไหน
          🚨 ห้ามเขียน background แบบรวบ — กฎกลางใน globals.css วาดลูกศร ▾ ด้วย
             background-image เขียนรวบแล้วรูปลูกศรหายทั้งช่อง (ข้อ 3.52) */}
      {[
        { key: 'disp', value: V.histDispValue, on: V.onHistDisp, opts: V.histDispOpts, label: 'กรองตามสถานะ' },
        { key: 'src', value: V.histSrcValue, on: V.onHistSrc, opts: V.histSrcOpts, label: 'กรองตามแหล่งที่มา' },
        // ── ชั้นที่สอง — รพ.สต. แห่งไหน (พี่กันสั่ง 10 ก.ย. 2569) ───────────────
        //   "รพ.สต. ถ้าเลือกแล้วควรขึ้นเหมือนหน้า lot นะ"
        // 🚨 ต้องอยู่ติดกับช่องแหล่งที่มาที่มันห้อยอยู่ ไม่ใช่ไปต่อท้ายแถว
        //    (พี่กันทักเอง "ทำไมกรอบทุกคนบันทึกอยู่ตรงกลางขวางการเลือก รพ.สต.")
        // 🚨 พื้นเขียวจางตลอดเวลา แม้ยังไม่ได้เลือกแห่ง เพื่อบอกว่าเป็นลูกของช่องก่อนหน้า
        ...(V.histSiteOn ? [{ key: 'site', value: V.histSiteValue, on: V.onHistSite,
          opts: V.histSiteOpts, label: 'กรองตาม รพ.สต. ต้นทาง', ชั้นสอง: true }] : []),
        { key: 'by', value: V.histByValue, on: V.onHistBy, opts: V.histByOpts, label: 'กรองตามผู้บันทึก' }
      ].map((f) => (
        <select key={f.key} value={f.value} onChange={f.on} aria-label={f.label}
          style={sx('height:40px;border-radius:10px;padding:0 34px 0 12px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none;max-width:190px', {
            backgroundColor: (f.value || f.ชั้นสอง) ? '#f2f8f4' : '#fff',
            border: '1px solid ' + ((f.value || f.ชั้นสอง) ? 'rgba(47,125,93,.34)' : 'rgba(30,36,32,.14)'),
            color: (f.value || f.ชั้นสอง) ? '#2f7d5d' : '#414a44',
            fontWeight: f.ชั้นสอง ? 600 : 500
          })}>
          {f.opts.map((o) => (
            <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif', color: '#1e2420' }}>{o.label}</option>
          ))}
        </select>
      ))}

      {/* ── ปุ่มล้างตัวกรองทั้งหมด (พี่กันสั่ง 10 ก.ย. 2569 "เอาปุ่มล้างตัวกรองใส่ก่อน") ──
          🚨 โผล่เฉพาะตอนมีตัวกรองอยู่จริง — ปุ่มที่กดแล้วไม่เกิดอะไรคือปุ่มหลอก
          🚨 กลับไปเป็นค่าตั้งต้นของหน้า (เดือนนี้) ไม่ใช่ล้างจนว่างเปล่า
          🚨 ไม่แตะถังขยะ — อยู่ในถังขยะแล้วกดล้าง ต้องยังอยู่ในถังขยะ */}
      {/* 🚨 สีแดงคือสิ่งที่พี่กันเลือกเอง 10 ก.ย. 2569 ("แต่เราชอบปุ่มล้างตัวกรอง สีนี้นะ")
          ส่วนรูปกรอบเอาแบบหน้ารายการ Lot — มุมมน 10 ไม่ใช่แคปซูล
          ("เราชอบกรอบในหน้า lot นะ มันเกลี้ยง ขอบมน ดูแข็งแรงดี") */}
      {V.histHasFilter && (
        <div {...kb(V.clearHistFilters)} aria-label="ล้างตัวกรองทั้งหมด" className="hv-bg-fbe tap"
          style={s('height:40px;padding:0 14px;border-radius:10px;border:1px solid rgba(194,84,60,.28);background-color:#fdf1ed;display:flex;align-items:center;gap:6px;font:600 12.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer;flex:none')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
          ล้างตัวกรอง
        </div>
      )}

      {V.histLot && (
        <div {...kb(V.clearLot)} aria-label="เลิกกรองเฉพาะ Lot นี้" className="hv-bg-e3f tap" style={s('height:40px;display:flex;align-items:center;gap:7px;padding:0 14px;border-radius:10px;background-color:#e3f0e8;color:#2f7d5d;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none')}>
          Lot {V.histLot} <span aria-hidden="true" style={s('font:400 13px/1.75 Sarabun,sans-serif')}>✕</span>
        </div>
      )}


      {/* ── ปุ่มซ่อน/แสดงคอลัมน์ HN (พี่กันสั่ง 10 ก.ย. 2569) ────────────────
          ค่าตั้งต้นคือซ่อน และจำสถานะที่เลือกไว้ข้ามการรีเฟรช
          🚨 HN เป็นข้อมูลผู้ป่วย ซ่อนไว้ = คนที่เดินผ่านจอไม่เห็นโดยไม่ตั้งใจ
          🚨 ปิดอยู่ก็ยังค้นด้วย HN ได้ตามปกติ แค่ไม่โชว์เลขในตาราง
             และไฟล์ส่งออก CSV มี HN เสมอ ไม่ผูกกับสถานะปุ่มนี้ */}
      <div {...kb(V.hnColToggle)} title={V.hnColTitle} aria-label={V.hnColTitle}
        className={(V.hnCol ? 'hv-bg-e3f' : 'hv-bg-f6') + ' tap'}
        style={sx('height:40px;display:flex;align-items:center;padding:0 14px;border-radius:10px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;white-space:nowrap;flex:none',
          { backgroundColor: V.hnColBg, color: V.hnColFg, border: '1px solid ' + V.hnColBorder })}>
        {V.hnColLabel}
      </div>

      {/* ── ปุ่มเลือกความสูงแถว (พี่กันสั่ง 10 ก.ย. 2569) ──────────────────────
          "ความสูง 43 34 30 เรารู้ละ เอาปุ่มเลือกขนาดได้ใส่ไปเลย"
          แล้วสั่งย้ายมาไว้ข้างปุ่มส่งออก — "ย้ายไปไว้แถว ๆ ปุ่มโหลด CSV"
          🚨 margin-left:auto ดันทั้งกลุ่มไปชิดขวา ปุ่มส่งออกจึงตามมาต่อท้ายเอง
             (ปุ่มส่งออกเลิกใช้ push แล้ว ไม่งั้นสองตัวแย่งกันดันไปขวาคนละที)
          🚨 มีผลกับตารางทุกหน้า เพราะคลาสไปอยู่ที่ <html> ไม่ใช่ที่ตารางนี้ */}
      {/* 🚨 เป็นไอคอน ไม่ใช่ตัวหนังสือ (พี่กันสั่ง 10 ก.ย. 2569 "ขอเป็น icon")
          ⚠️ ต่างจากกฎเดิมข้อ 3.52 ที่ว่าปุ่มต้องมีข้อความกำกับ — พี่กันสั่งเปลี่ยนเอง
             แต่ยังต้องมีชื่อให้โปรแกรมอ่านจอและป้ายตอนเอาเมาส์ชี้เสมอ (title + aria-label)
          ไอคอนคือเส้นแนวนอนที่ห่างกันตามระดับ — โปร่ง 3 เส้นห่าง · แน่นมาก 4 เส้นชิด
          ตาอ่านได้ทันทีว่าหมายถึงแถวห่างแค่ไหน ไม่ต้องแปลจากคำ */}
      <div style={s('margin-left:auto;display:flex;align-items:center;gap:4px')}>
        {V.rowHPicks.map((h) => (
          <div key={h.key} {...kb(h.pick)} title={h.title} aria-label={h.title}
            className={(h.on ? 'hv-seg-on' : 'hv-seg-off') + ' tap'}
            style={sx('width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer',
              { background: h.bg, color: h.fg })}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {h.lines.map((y, i) => (<path key={i} d={'M4 ' + y + 'h16'} />))}
            </svg>
          </div>
        ))}
      </div>


    </div>
  );
}

// 🚨 width:100% ห้ามลบ — เหตุผลเดียวกับหน้าบันทึก (margin:0 auto ใน flex = เลิกยืดเต็มความกว้าง)
export function renderHistoryWide(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;flex:1 0 auto')}>
      {/* กรอบขาวใบเดียวครอบทั้งหน้า — ทำเหมือนหน้าคลังยา (พี่กันสั่ง 4 ก.ย. 2569
          "ทำหน้านี้ให้เหมือนเพื่อน") เดิมแถบเครื่องมือลอยอยู่บนพื้นเทานอกกรอบ
          แล้วตารางมีกรอบของตัวเองอีกใบ ซึ่งไม่มีหน้าไหนในเว็บทำแบบนั้น
          🚨 ห้ามใส่ overflow ที่กรอบนี้เด็ดขาด — sticky ของแถบกรองกับหัวตารางจะตายทันที
          🚨 min-width:fit-content ห้ามลบ — ตารางกว้างคงที่ตาม colgroup (ราว 1300 จุด)
             จอที่แคบกว่านั้นถ้ากรอบไม่ยอมกว้างตาม ตารางจะทะลุออกไปนอกกรอบ
             เห็นเป็นปุ่มกับหัวตารางลอยทับกัน (พี่กันเจอเอง 4 ก.ย. 2569) */}
      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.1);border-radius:14px;padding:16px 18px;min-width:fit-content')}>
      {/* แถบกรองติดบนตอนเลื่อน — เลื่อนดูแถวลึก ๆ แล้วยังเปลี่ยนช่วงเวลา/ค้นหาได้ทันที
          ref = ตัววัดความสูง ส่งให้หัวตารางไปตั้งระยะติดบน (ดู .hist-head ใน globals.css) */}
      <div ref={V.histHeadRef} className="hist-head">
      <div style={s('display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:5px')}>
        {/* หัวเรื่อง + ยอดสรุปใต้ชื่อ (พี่กันสั่ง 10 ก.ย. 2569)
            "ที่เขียนว่า 75 รายการและราคา อันนี้ย้ายไปอยู่ใต้คำว่า ประวัติบันทึก
             และบีบให้มันอยู่ใต้ชื่อนี้"
            เดิมลอยอยู่ขวาสุดของแถว ห่างจากหัวเรื่องคนละฟากจอ */}
        <div style={s('display:flex;flex-direction:column;gap:1px;flex:none')}>
          {renderPageTitle(V.histTitle || 'ประวัติการบันทึก')}
          <div style={s('display:flex;align-items:baseline;gap:8px;font:400 12px/1.5 Sarabun,sans-serif;color:#6b746e')}>
            <span>{V.histCountLabel}</span>
            {/* 🚨 กรองสถานะ "ทำลาย" แล้วยอดต้องเป็นยอดทำลาย ไม่ใช่ยอดนำกลับใช้ที่เป็นศูนย์
                (เจอตอนตรวจภาพเอง 10 ก.ย. 2569 — ขึ้น 1 รายการ 0.00 ฿ ดูเหมือนระบบพัง) */}
            <span style={sx("font:700 14px Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: V.histTotalColor })}>{V.histTotalLabel}</span>
            {V.histTotalNote && (
              <span style={sx('font:500 11px/1.5 Sarabun,sans-serif', { color: V.histTotalColor })}>{V.histTotalNote}</span>
            )}
          </div>
        </div>
        {/* ช่องค้นหา — ระบบเดียวกับหน้าคลังยาและหน้าบันทึก (พี่กันสั่ง 25 ส.ค. 2569)
            รองรับลืมสลับแป้นพิมพ์ + ป้ายบอกคำที่ค้นจริง + ปุ่มล้าง
            เว้นที่ว่างขวาตามสิ่งที่โผล่จริง ไม่งั้นตัวหนังสือที่พิมพ์จะลอดไปใต้ป้าย */}
        {/* ช่องค้นหามาตรฐานของทั้งเว็บ (thaibox.jsx) — พี่กันตั้งเป็นกฎ 3 ก.ย. 2569 */}
        <div style={s('display:flex;width:320px;flex:none')}>
          {renderSearchBox({
            value: V.histQuery, onChange: V.onHistQuery, onClear: V.clearHistQuery,
            placeholder: 'ค้นด้วยชื่อยา · HN · ชื่อคนบันทึก · เลข Lot',
            font: '400 14px/1.75 var(--font-sarabun), Sarabun, sans-serif',
            h: 42, swapLabel: V.histSwapped ? V.histSwapLabel : '',
            ariaLabel: 'ค้นหาในประวัติ',
          })}
        </div>
        <div style={s('display:flex;gap:6px')}>
          {V.ranges.map((g) => (
            <div key={g.key} {...kb(g.pick)} className={(g.on ? 'hv-seg-on' : 'hv-seg-off') + ' tap'} style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>

        {/* ช่วงวันที่เลือกเอง — ต่อจากชิปปีงบ (พี่กันสั่ง 10 ก.ย. 2569 "ย้ายอันนี้ไปต่อจากปีงบ")
            อยู่ชุดเดียวกับชิปช่วงเวลาแล้ว เพราะเป็นเครื่องมือเลือกช่วงเวลาเหมือนกัน */}
        <div style={s('display:flex;align-items:center;gap:6px')}>
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
          <input type="date" className="mrv-hit-input" value={V.histFrom} onChange={V.onHistFrom} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
          <input type="date" className="mrv-hit-input" value={V.histTo} onChange={V.onHistTo} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        </div>

        {/* ส่งออกเฉพาะที่กรองอยู่ตอนนี้ — หน้าสรุปมีปุ่มส่งออกทั้งปีงบอยู่แล้ว
            🚨 อยู่แถวบนสุด (พี่กันสั่ง 10 ก.ย. 2569 "เอาปุ่มโหลด csv อยู่แถวบน
               แล้วขนาดแถว อยู่แถวล่าง") */}
        {renderExportBtn(V.exportHistoryCsv, V.histExportLabel, { push: true })}

      </div>

      {renderHistTools(V)}
      </div>
      {/* ══ ตารางจริง (จอกว้าง) ═══════════════════════════════════════════
          รื้อจากกล่อง flex เรียงกันมาเป็น <table> จริง 4 ก.ย. 2569
          ต้นแบบคือหน้ารายการ Lot (พี่กันย้ำ) — เส้นแบ่งคอลัมน์ ไฮไลต์แถว
          และลูกศรเรียงลำดับ ยกมาจากที่นั่นทั้งชุด

          🚨 กรอบนี้ห้ามใส่ overflow เด็ดขาด — sticky ของ thead จะตายทันที
          🚨 ความกว้างคอลัมน์อยู่ที่ <colgroup> ห้ามไปตั้งที่ th หรือ td */}
      <div style={s('border:1px solid rgba(30,36,32,.08);border-radius:10px')}>
        {/* 🚨 ต้องลบ 16 ออกจากความสูงแถบกรอง
            แถบกรองอยู่ในกรอบขาวที่มีระยะขอบใน 16 จุด และตรึงที่ top:-16px
            ตัววัด --histhead วัดความสูงเต็มของแถบ ซึ่งรวม 16 จุดนั้นไว้ด้วย
            ถ้าเอามาใช้ตรง ๆ หัวตารางจะติดต่ำกว่าที่ควร 16 จุด เกิดร่องให้แถวลอดผ่าน
            (พี่กันเจอเอง 4 ก.ย. 2569 — แคลร์ดูในโครมแล้วแต่ไม่ได้เลื่อน เลยไม่เห็น) */}
          {/* 🚨🔴 หัวตารางต้องติดใต้แถบหัวพอดี ห้ามเหลือร่องให้แถวลอดผ่าน
              (พี่กันเจอเอง 10 ก.ย. 2569 "ตารางข้างล่างมันโผล่ ตัวขอบหัวตารางต้องชิดสิ")
              เดิมลบ 16 ออก เพราะแถบหัวตรึงที่ top:-16px
              พอเปลี่ยนแถบเป็น top:0 (ตอนทำระยะบน 10 จุด) การลบ 16 จึงกลายเป็นร่อง 16 จุด
              🚨 แก้ระยะตรึงของแถบหัวเมื่อไหร่ ต้องมาแก้บรรทัดนี้ให้ตรงกันเสมอ */}
          <table className="tbl" style={sx('', { '--tbl-top': 'var(--histhead, 0px)' })}>
          <colgroup>
            {V.histCols.map((c) => (
              <col key={c.key} style={c.flex ? { minWidth: '180px' } : { width: c.w }} />
            ))}
            <col style={s('width:104px')} />
          </colgroup>
          <thead>
            <tr>
              {/* 🚨 หัวคอลัมน์อยู่กึ่งกลางทุกอัน ยกเว้นคอลัมน์ยา (พี่กันสั่ง 4 ก.ย. 2569)
                  ส่วนข้อมูลในแถวคงการจัดวางเดิมไว้ — ตัวเลขชิดขวาให้หลักตรงกัน
                  ข้อความชิดซ้ายเพราะตาอ่านจากซ้าย เป็นคนละเรื่องกับหัว
                  ⚠️ คอมเมนต์ต้องอยู่นอกแท็ก วางระหว่าง attribute ไม่ได้ เว็บจะพังทั้งหน้า */}
              {V.histCols.map((c) => (
                <th key={c.key} {...kb(c.pick)} scope="col"
                  className={'tbl-sort' + (c.flex ? '' : ' ta-c')}
                  style={sx('', { color: c.fg })}>
                  <span style={s('display:inline-flex;align-items:center;gap:4px')}>
                    {c.label}
                    <span aria-hidden="true" className="tbl-arrow" style={sx('', { color: c.arrowColor, fontSize: c.arrowSize })}>{c.arrow}</span>
                  </span>
                </th>
              ))}
              {/* หัวคอลัมน์ปุ่ม — เดิมเว้นว่าง พี่กันทัก 4 ก.ย. 2569 ว่าไม่มีชื่อ
                  ใช้คำเดียวกับหน้ารายการ Lot ซึ่งเป็นต้นแบบ */}
              <th scope="col" className="ta-c">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {V.histRows.map((hr) => (
              <tr key={hr.key} style={sx('', { background: hr.bg })}>
                <td style={s('color:#6b746e')}>{hr.dateLabel}</td>
                {/* ชื่อยาวาดทีละส่วนพร้อมสี ตัวเดียวกับผลค้นหาในหน้าบันทึก
                    (พี่กันสั่ง 25 ส.ค. 2569 "ไหนสีแบบที่ช่องค้นหา")
                    ตัดด้วยจุดไข่ปลา ไม่งั้นชื่อยาว ๆ ดันแถวสูงเป็นสิบบรรทัด
                    title = เอาเมาส์ชี้แล้วเห็นชื่อเต็ม */}
                {/* 🚨 กดชื่อยาแล้วกรองเฉพาะยาตัวนั้น (พี่กันสั่ง 10 ก.ย. 2569)
                    ใส่ชื่อลงช่องค้นหาจริง ๆ ไม่ใช่กรองซ่อนอยู่เบื้องหลัง
                    ผู้ใช้จะได้เห็นว่ากรองด้วยอะไร แก้คำต่อเองได้ และกดล้างในช่องได้ตามปกติ */}
                <td title={hr.name + ' — กดเพื่อกรองเฉพาะยาตัวนี้'} style={s('overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                  <span {...kb(hr.pickDrug)} className="hv-drug" style={s('cursor:pointer')}>
                    {renderDrugName(hr.parts, { size: '13.5px' })}
                  </span>
                </td>
                <td className="ta-r">{hr.qtyLabel}</td>
                <td className="ta-r" style={s('color:#6b746e')}>{hr.priceLabel}</td>
                <td className="ta-r" style={sx('font:600 14.5px Sarabun,sans-serif', { color: hr.color })}>{hr.valueLabel}</td>
                <td className="ta-c">
                  <span style={sx('display:inline-block;padding:3px 9px;border-radius:6px;font:600 11px/1.75 Sarabun,sans-serif;white-space:nowrap', { background: hr.dispBg, color: hr.dispFg })}>{hr.dispLabel}</span>
                </td>
                {/* 🚨 ชื่อ รพ.สต. ห้ามตัดเหมือนชื่อคน — "รพ.สต. หนองเชียงทูน" ยาวสุด 132 จุด
                    คอลัมน์กว้าง 164 จุดจึงพอทุกแห่ง (ดู scripts/col-width.mjs) */}
                <td style={s('color:#6b746e;white-space:nowrap')}>{hr.sourceLabel}</td>
                {V.hnCol && <td className="ta-c" style={s('color:#6b746e')}>{hr.hnLabel}</td>}
                {/* 🚨 ชื่อผู้บันทึกห้ามตัดทิ้ง เป็นข้อมูลสืบกลับว่าใครเซ็นรับล็อตนั้น
                    เดิมใช้ ellipsis ตัดท้าย ชื่อยาว ๆ เลยเหลือ "ภญ. วลัยพรรณ…"

                    🚨🔴 และห้ามผ่ากลางคำด้วย (พี่กันสั่ง 10 ก.ย. 2569 "ห้ามตัดชื่อ")
                    คลาส wrap ตั้งไว้ให้ตัดตรงไหนก็ได้ ซึ่งจำเป็นกับชื่อยาอังกฤษยาว ๆ
                    แต่กับชื่อคนแล้วมันผ่ากลางชื่อ — "ภญ. วลัย" ขึ้นบรรทัดหนึ่ง "พรรณ" อีกบรรทัด
                    ห่อแต่ละก้อนด้วย nowrap แล้วตัดได้เฉพาะตรงช่องว่างเท่านั้น
                    (ท่าเดียวกับก้อนในบรรทัดชื่อยา — CLAUDE.md ข้อ 3.19) */}
                <td title={hr.byFull} style={s('color:#6b746e;font-size:12px;line-height:1.35;white-space:nowrap')}>
                  {hr.byParts.map((w, i) => (
                    <span key={i} style={s('white-space:nowrap')}>{i ? ' ' : ''}{w}</span>
                  ))}
                </td>
                {/* เลข Lot — กดแล้วกรองดูเฉพาะ Lot นั้น */}
                <td>
                  {hr.hasLot ? (
                    <span {...kb(hr.openLot)} className="hv-lot" title={'ดูเฉพาะ ' + hr.lotLabel}
                      style={s("font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;cursor:pointer;border-bottom:1px dashed rgba(30,36,32,.28);white-space:nowrap")}>{hr.lotLabel}</span>
                  ) : (
                    <span style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#c0c5c1')}>{hr.lotLabel}</span>
                  )}
                </td>
                <td>
                  <span style={s('display:flex;justify-content:flex-end;gap:6px')}>
                    {hr.inTrash ? (
                      <span {...kb(hr.restore)} className="hv-bg-e3f tap rh-btn" style={s('padding:6px 9px;border-radius:7px;background:#e3f0e8;font:500 11.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;white-space:nowrap')}>กู้คืน</span>
                    ) : (
                      <>
                        {/* 🚨 คลาส rh-btn ให้ปุ่มย่อตามระดับความสูงแถวที่ผู้ใช้เลือก
                            ปุ่มคือตัวที่กำหนดความสูงแถวจริง ๆ ไม่ใช่ตัวหนังสือ */}
                        <span {...kb(hr.edit)} className="hv-bg-e6e tap rh-btn" style={s('padding:6px 9px;border-radius:7px;background:#f0f1ee;font:500 11.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</span>
                        <span {...kb(hr.remove)} className="hv-bg-fbe tap rh-btn" style={s('padding:6px 9px;border-radius:7px;background:#fdf1ed;font:500 11.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</span>
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* โครงจางใช้คอลัมน์ชุดเดียวกับตารางจริง (V.histCols) */}
        {(V.histLoading || V.skelDemo) && skelTable(V.histCols, 9, { noHead: true })}
        {V.histFail && (
          <div style={s('padding:26px 16px')}>
            {renderLoadFail({ title: V.histFail, detail: 'รายการที่บันทึกไว้ยังอยู่ครบในระบบ แค่ดึงมาแสดงไม่ได้ตอนนี้', retry: V.histRetry })}
          </div>
        )}
        {V.histEmpty && (
          <div style={s('padding:40px 16px;text-align:center;font:400 13.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>{V.histEmptyLabel}</div>
        )}
      </div>

      {V.histTruncated && !V.skelDemo && (
        <div style={s('text-align:center;padding:14px 0 0')}>
          <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6f7873;margin-bottom:8px')}>{V.histTruncLabel}</div>
          <div {...kb(V.loadMoreHistory)} className="hv-bg-f6 tap" style={s('display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(30,36,32,.16);border-radius:999px;background:#fff;font:600 13px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>{V.loadMoreLabel}</div>
        </div>
      )}
      </div>
      {renderScrollBtns(V)}
    </div>
  );
}


// ── แผ่นตัวกรองหน้าประวัติ ฝั่งมือถือ ────────────────────────────────────────
// โทนเดียวกับแผ่นของหน้ารายการ Lot ทุกอย่าง (พี่กันสั่ง 3 ก.ย. 2569)
// เก็บของที่ถูกย้ายออกจากหัวหน้าไว้ครบ — ช่วงวันที่ · ถังขยะ · ป้ายกรอง Lot
//
// 🚨 กดพื้นหลังปิดได้ ไม่ใช่การกระทำที่ย้อนยาก ปิดแล้วตัวกรองยังเหมือนเดิม
// 🚨 ใช้ Z.panel จากตารางชั้นกลาง ห้ามเขียนเลขเอง (กฎข้อ 3.68)
export function renderHistFilter(V) {
  if (!V.histFilterOpen) return null;
  const ป้าย = 'font:600 11.5px/1.6 Sarabun,sans-serif;color:#414a44;margin:0 0 6px';
  const ช่องวัน = 'height:44px;padding:0 10px;border-radius:9px;background-color:#fff;font:400 16px Sarabun,sans-serif;flex:1;min-width:0;box-sizing:border-box';
  return (
    <>
      <div {...kb(V.closeHistFilter)} aria-label="ปิดตัวกรอง"
        style={sx('position:fixed;inset:0;background:rgba(20,26,22,.34)', { zIndex: Z.panel })} />
      <div role="dialog" aria-modal="true" aria-label="ตัวกรองประวัติ"
        style={sx('position:fixed;left:0;right:0;bottom:0;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -5px 22px rgba(0,0,0,.16);padding:10px 16px 20px;max-height:82vh;overflow-y:auto;overscroll-behavior:contain',
          { zIndex: Z.panel + 1 })}>
        <div aria-hidden="true" style={s('width:36px;height:4px;border-radius:99px;background:#d7dbd6;margin:0 auto 12px')} />

        <div style={s(ป้าย)}>ช่วงเวลา</div>
        <div style={s('display:flex;gap:7px;flex-wrap:wrap')}>
          {V.ranges.map((g) => (
            <div key={g.key} {...kb(g.pick)} className={g.on ? 'hv-seg-on' : 'hv-seg-off'}
              style={sx('height:40px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;white-space:nowrap', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>

        <div style={sx(ป้าย, { marginTop: '16px' })}>หรือกำหนดวันเอง</div>
        <div style={s('display:flex;gap:8px;align-items:center')}>
          <input type="date" value={V.histFrom} onChange={V.onHistFrom} aria-label="ตั้งแต่วันที่"
            style={sx(ช่องวัน, { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;flex:none')}>ถึง</span>
          <input type="date" value={V.histTo} onChange={V.onHistTo} aria-label="ถึงวันที่"
            style={sx(ช่องวัน, { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        </div>

        {/* ถังขยะเป็นสวิตช์สลับมุมมอง ไม่ใช่ตัวกรองธรรมดา จึงแยกหัวข้อของตัวเอง
            🚨 ต้องเห็นชัดว่ากำลังเปิดอยู่ไหม เปิดค้างแล้วลืมคือที่มาของ "รายการวันนี้หายไปไหน" */}
        <div style={sx(ป้าย, { marginTop: '16px' })}>มุมมอง</div>
        <div {...kb(V.toggleTrash)} className={V.histTrash ? 'hv-teal' : 'btn-back'}
          style={sx('height:46px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:8px;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer',
            { background: V.histTrash ? '#2f7d5d' : '#fff', color: V.histTrash ? '#fff' : '#414a44',
              border: '1px solid ' + (V.histTrash ? '#2f7d5d' : 'rgba(30,36,32,.14)') })}>
          {V.trashLabel}
        </div>

        {V.histLot && (
          <>
            <div style={sx(ป้าย, { marginTop: '16px' })}>กรองอยู่ที่ Lot เดียว</div>
            <div {...kb(V.clearLot)} className="hv-bg-e3f"
              style={s('height:46px;border-radius:11px;background:#e3f0e8;color:#2f7d5d;border:1px solid rgba(47,125,93,.34);display:flex;align-items:center;justify-content:center;gap:8px;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer')}>
              Lot {V.histLot} · กดเพื่อเลิกกรอง
            </div>
          </>
        )}

        <div style={s('display:flex;gap:9px;margin-top:18px')}>
          <div {...kb(V.closeHistFilter)} aria-label="ดูผลการกรอง" className="hv-teal"
            style={s('flex:1;height:46px;border-radius:11px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer')}>
            ดูผล {V.histCountLabel}
          </div>
        </div>
      </div>
    </>
  );
}

export function renderHistoryNarrow(V) {
  return (
    <div style={s('width:100%;max-width:520px;margin:0 auto;min-height:100%;flex:1 0 auto')}>
      {/* 🚨 หัวใช้ตัวกลาง components/pages/pagehead.jsx ตัวเดียวกับอีกสองหน้า
          ห้ามวาดเอง ไม่งั้นปุ่ม ℹ ⚙ เหลื่อมกันอีก (พี่กันจับได้ 4 ก.ย. 2569) */}
      {/* ── หัวเว็บ — ปล่อยให้เลื่อนหายไปตามปกติ ตรึงเฉพาะแถบเครื่องมือข้างล่าง ──
          🚨 ระยะขอบล่างของ HEAD_PAD ถูกย้ายไปเป็นระยะขอบบนของแถบเครื่องมือแทน
             ช่องไฟที่ตาเห็นเท่าเดิมทุกจุด แต่ตอนแถบไปติดขอบบน ช่องค้นหาจะไม่ชิดขอบ */}
      <div style={s('background:#fff')}>
        <div style={sx(HEAD_PAD, { paddingBottom: 0 })}>
          {renderPageHead({
          onAbout: V.openAbout, onSettings: V.openSettings,
          sub: (<>{V.histTitle || 'ประวัติ'} · {V.histCountLabel} · <span style={s('font:700 11.5px/1.45 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.histTotalLabel}</span></>),
          })}
        </div>
      </div>

      {/* ── แถบเครื่องมือตรึงไว้บนสุด (พี่กันสั่ง 10 ก.ย. 2569 · เฉพาะมือถือ) ──
          ช่องค้นหา · ชิปช่วงเวลา · ปุ่มดูเป็นรายการ Lot ต้องเห็นตลอดเวลาที่เลื่อนดูรายการ
          ไม่ต้องเลื่อนกลับขึ้นไปข้างบนทุกครั้งที่อยากเปลี่ยนช่วงเวลาหรือค้นใหม่
          🚨 กฎอยู่ใน app/mobile.css ขึ้นต้นด้วย .mrv-mobile ฝั่งคอมจึงไม่โดนแม้แต่พิกเซลเดียว
          🚨 ชั้นต้องเป็น Z.bar (6) ต่ำกว่าหน้าต่างซ้อนที่ต่ำที่สุด (ป๊อปใส่จำนวน 20) */}
      <div className="mrv-hist-stick"
        style={sx('background:#fff;border-bottom:1px solid rgba(30,36,32,.07);padding:11px 20px 14px', { zIndex: Z.bar })}>
        {/* ช่องค้นหา + ปุ่มตัวกรอง อยู่แถวเดียวกัน โทนเดียวกับหน้ารายการ Lot */}
        <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:9px')}>
        {renderSearchBox({
          value: V.histQuery, onChange: V.onHistQuery, onClear: V.clearHistQuery,
          placeholder: 'ชื่อยา · HN · ชื่อคนบันทึก · เลข Lot',
          font: '400 14.5px/1.75 var(--font-sarabun), Sarabun, sans-serif',
          h: 44, bg: '#f6f7f4', swapLabel: V.histSwapped ? V.histSwapLabel : '',
          ariaLabel: 'ค้นหาในประวัติ',
        })}
        {/* ปุ่มเปิดแผ่นตัวกรอง — ชุดเดียวกับหน้ารายการ Lot
            🚨 ตัวเลขบอกว่ามีตัวกรองที่ถูกซ่อนไว้ทำงานอยู่กี่ชั้น
               ที่สำคัญที่สุดคือถังขยะ เปิดค้างไว้แล้วซ่อนไป จะงงว่ารายการวันนี้หายไปไหน */}
        <div {...kb(V.openHistFilter)} aria-label="ตัวกรองเพิ่มเติม" className="btn-back"
          style={sx('position:relative;width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none',
            { border: '1px solid ' + (V.histFilterCount ? 'rgba(47,125,93,.40)' : 'rgba(30,36,32,.14)'),
              background: V.histFilterCount ? '#f2f8f4' : '#fff',
              color: V.histFilterCount ? '#2f7d5d' : '#414a44' })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />
          </svg>
          {!!V.histFilterCount && (
            <span aria-hidden="true"
              style={s('position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:99px;background:#2f7d5d;color:#fff;font:700 10px/17px Sarabun,sans-serif;text-align:center;box-sizing:border-box')}>{V.histFilterCount}</span>
          )}
        </div>
        </div>
        {/* ── ชิปช่วงเวลา + ปุ่มรายการ Lot (เกลาใหม่ 3 ก.ย. 2569) ─────────────
            พี่กันสั่ง "เกลาอันนี้ เป็นโทนเดียวกันด้วยละกัน เเต่ให้ปุ่มดู lot เด่นนะ"
            = ทำโทนเดียวกับหัวหน้ารายการ Lot ที่เพิ่งเคาะไป

            เดิม 5 แถว  หัวเว็บ · ค้นหา · ชิป+รายการ Lot+ถังขยะ (ตกบรรทัด) · ช่องวันที่ · ยอด
            ใหม่ 4 แถว  หัวเว็บ+ยอด · ค้นหา+ตัวกรอง · ชิป · ปุ่มรายการ Lot

            🚨 ชิปเลื่อนแนวนอนแทนการตกบรรทัด หัวจึงสูงเท่าเดิมเสมอไม่ว่าจอแคบแค่ไหน
            🚨 ห้ามใส่คลาส .tap ชิปห่างกัน 8 จุด ส่วน .tap ขยายพื้นที่กดด้านละ 11 จุด
               พื้นที่กดจะทับกัน เล็งกดช่วงหนึ่งแล้วโดนอีกช่วง (กฎข้อ 3.55)
            🚨 ฝั่งเดสก์ท็อป (renderHistoryWide) ห้ามแตะ พี่กันสั่งไว้ตลอด */}
        <div className="mrv-xscroll" style={s('display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain')}>
          {V.ranges.map((g) => (
            <div key={g.key} {...kb(g.pick)} className={g.on ? 'hv-seg-on' : 'hv-seg-off'}
              style={sx('min-height:44px;padding:0 15px;border-radius:999px;display:inline-flex;align-items:center;font:500 13px/1.75 Sarabun,sans-serif;cursor:pointer;white-space:nowrap;flex:none', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>

        {/* ปุ่มรายการ Lot — พี่กันสั่งให้เด่น จึงเป็นปุ่มเขียวเต็มพื้นเต็มความกว้าง
            🚨 แยกออกจากแถวชิปโดยตั้งใจ ชิปที่เลือกอยู่ก็เขียวเข้มเหมือนกัน
               วางปนกันแล้วตาแยกไม่ออกว่าอันไหนคือช่วงเวลาที่เลือก อันไหนคือปุ่มไปอีกหน้า */}
        <div {...kb(V.openLots)} aria-label="ดูเป็นรายการ Lot" className="hv-teal"
          style={s('margin-top:9px;height:46px;border-radius:12px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font:600 13.5px/1.75 Sarabun,sans-serif;cursor:pointer')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
          </svg>
          ดูเป็นรายการ Lot
        </div>
      </div>

      <div style={s('padding:14px 20px 20px')}>

        {/* ฝั่งมือถือเป็นการ์ด ไม่ใช่ตาราง โครงจางจึงต้องเป็นการ์ดตาม */}
        {(V.histLoading || V.skelDemo) && (
          <div style={s('display:flex;flex-direction:column;gap:9px')}>
            {[0, 1, 2, 3, 4, 5].map((i) => skelCard(84, null, i))}
          </div>
        )}
        {V.histFail && (
          <div style={s('padding:26px 16px')}>
            {renderLoadFail({ title: V.histFail, detail: 'รายการที่บันทึกไว้ยังอยู่ครบในระบบ แค่ดึงมาแสดงไม่ได้ตอนนี้', retry: V.histRetry })}
          </div>
        )}
        {V.histEmpty && (
          <div style={s('text-align:center;padding:30px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px;font:400 13.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>{V.histEmptyLabel}</div>
        )}

        {V.histDays.map((d) => (
          <div key={d.key} style={s('margin-bottom:18px')}>
            <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
              <span style={s('font:600 13.5px/1.75 Sarabun,sans-serif')}>{d.label}</span>
              <span style={s("font:600 13px/1.75 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{d.total}</span>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:7px')}>
              {/* แถบซ้ายบอกกลุ่ม Lot — ใช้เส้นขอบซ้ายแทนพื้นสีเหมือนฝั่งคอม
                  เพราะการ์ดมือถือมีพื้นขาวกับกรอบอยู่แล้ว เปลี่ยนพื้นอีกจะเลอะ
                  Lot เดียวกัน = แถบซ้ายสีเดียวกัน สลับเข้ม/จางเมื่อขึ้น Lot ใหม่ */}
              {d.items.map((it) => (
                <div key={it.key} style={sx('background:#fff;border-radius:11px;padding:10px 12px 10px 11px', {
                  border: '1px solid ' + it.border,
                  borderLeft: '3px solid ' + (it.hasLot ? (it.lotBand ? '#2f7d5d' : '#a8d3bd') : 'transparent')
                })}>
                  <div {...kb(it.edit)} className="hv-txt" style={s('min-width:0;cursor:pointer;margin-bottom:7px;padding:2px 5px;margin-left:-5px;border-radius:6px')}>
                    {/* ฝั่งมือถือวาดชื่อยาพร้อมสีเหมือนกัน แค่ตัวใหญ่ขึ้นนิดหนึ่ง
                        ไม่ตัดด้วยจุดไข่ปลา เพราะการ์ดมือถือยอมให้สูงขึ้นได้ */}
                    <div style={s('overflow-wrap:anywhere')}>{renderDrugName(it.parts, { size: '14.5px' })}</div>
                    <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{it.detail}</div>
                  </div>
                  <div style={s('display:flex;align-items:center;justify-content:space-between;gap:9px')}>
                    <div style={s('min-width:0')}>
                      <div style={sx("font:600 15px Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: it.color })}>{it.valueLabel}</div>
                      <div style={s('display:flex;align-items:center;gap:7px;flex-wrap:wrap')}>
                        <span style={sx('font:400 10.5px/1.75 Sarabun,sans-serif', { color: it.dispColor })}>{it.dispLabel}</span>
                        {/* ป้าย Lot กดได้ → กรองดูเฉพาะ Lot นั้น
                            ดึงออกมาจากบรรทัดรายละเอียดที่เดิมยัดรวมกันจนอ่านยาก */}
                        {it.hasLot && (
                          <span {...kb(it.openLot)} className="hv-bg-e3f tap" style={s("font:500 10px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e3f0e8;border-radius:5px;padding:2px 7px;cursor:pointer;white-space:nowrap")}>{it.lotLabel}</span>
                        )}
                      </div>
                    </div>
                    {/* ── ปุ่มแก้กับลบ (ผลตรวจข้อ ต-12) ──────────────────────────
                        🔴 จุดอันตรายที่สุดของทั้งเว็บบนจอสัมผัส
                           วัดจริงที่จอ 390px ได้ 36×29 พิกเซล วางห่างกัน 7px
                           คลาส .tap ขยายพื้นที่กดออกอีกด้านละ 11px
                           พื้นที่กดของสองปุ่มจึงทับกัน = เล็งกด "แก้" แต่โดน "ลบ"
                           ผิดพลาดแล้วข้อมูลหายไปถังขยะโดยไม่ตั้งใจ

                        แก้เป็นสูง 44px เต็มเกณฑ์นิ้ว และถ่างระยะห่างเป็น 12px
                        🚨 ห้ามใช้ .tap กับปุ่มคู่ที่วางติดกันแบบนี้
                           .tap ทำให้พื้นที่กดล้นออกไปทับปุ่มข้าง ๆ
                           ต้องขยายตัวปุ่มเองให้ถึงเกณฑ์แทน ─────────────────── */}
                    <div style={s('display:flex;align-items:center;gap:12px;flex:none')}>
                      {it.inTrash ? (
                        <div {...kb(it.restore)} className="hv-bg-e3f" style={s('min-height:44px;min-width:56px;padding:0 13px;border-radius:9px;background:#e3f0e8;display:flex;align-items:center;justify-content:center;font:500 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>กู้คืน</div>
                      ) : (
                        <>
                          <div {...kb(it.edit)} className="hv-bg-e6e" style={s('min-height:44px;min-width:48px;padding:0 13px;border-radius:9px;background:#f0f1ee;display:flex;align-items:center;justify-content:center;font:500 12.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</div>
                          <div {...kb(it.remove)} className="hv-bg-fbe" style={s('min-height:44px;min-width:48px;padding:0 13px;border-radius:9px;background:#fdf1ed;display:flex;align-items:center;justify-content:center;font:500 12.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {V.histTruncated && !V.skelDemo && (
          <div style={s('display:flex;flex-direction:column;align-items:center;gap:9px;padding:4px 0 10px')}>
            <div style={s('text-align:center;font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>{V.histTruncLabel}</div>
            <div {...kb(V.loadMoreHistory)} className="hv-bg-f6 tap"
              style={s('display:inline-flex;align-items:center;min-height:44px;padding:10px 22px;border:1px solid rgba(30,36,32,.16);border-radius:999px;background:#fff;font:600 13.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>{V.loadMoreLabel}</div>
          </div>
        )}
      </div>
      {renderScrollBtns(V)}
    </div>
  );
}
