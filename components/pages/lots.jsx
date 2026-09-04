// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
// ใช้ภาษาภาพชุดเดียวกับหน้าประวัติ (สี ระยะ ความโค้ง) จะได้ไม่รู้สึกเป็นคนละเว็บ
import { createPortal } from 'react-dom';
import { s, sx, kb, Z } from '../helpers';
import { renderExportBtn } from './exportbtn';
import { renderSortClear } from './sortclear';
import { renderPageTitle } from './pagetitle';
import { skelTable, skelCard } from './skeleton';
import { renderLoadFail } from './loadfail';
import { renderSearchBox } from './thaibox';

// ── ปุ่มจัดการท้ายแถว ────────────────────────────────────────────────────────
// แยกออกมาเพราะใช้ทั้งตาราง (จอกว้าง) และการ์ด (จอแคบ) ต้องเหมือนกันเป๊ะ
// 🚨 ปุ่มแก้ไขเป็นสีอำพันต่างจากอีกสองปุ่มโดยตั้งใจ เพราะเป็นปุ่มเดียวที่เปลี่ยนข้อมูลจริง
//    อีกสองปุ่มเป็นแค่การเปิดดู กดผิดแล้วไม่มีอะไรเสียหาย (พี่กันเคาะ 25 ส.ค. 2569)
// 🚨 ทุกปุ่มต้องมีข้อความกำกับ ห้ามย่อเหลือแต่ไอคอน (พี่กันสั่ง 26 ส.ค. 2569)
//    เคยย่อสองปุ่มแรกเหลือแต่ไอคอนเพื่อประหยัดที่ในตาราง พี่กันสั่งให้เอากลับ
//    ไอคอนเปล่า ๆ ต้องเดาความหมาย และคนที่ไม่ได้ใช้ทุกวันจะไม่กล้ากด
function rowButtons(l) {
  return (
    <div style={s('display:flex;gap:6px;justify-content:center;width:100%')}>
      <div {...kb(l.openEdit)} aria-label={'แก้ไข Lot ' + l.lot} title="แก้ไขล็อตนี้" className="hv-cream tap"
        style={s('height:34px;padding:0 11px;border-radius:9px;border:1px solid rgba(150,101,15,.30);background:#fdf6e9;color:#96650f;display:flex;align-items:center;gap:5px;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        แก้ไข
      </div>
      <div {...kb(l.openHistory)} aria-label={'ดูรายการยาใน Lot ' + l.lot} title="ดูรายการยาข้างใน" className="hv-bg-f6 tap"
        style={s('height:34px;padding:0 12px;border-radius:9px;border:1px solid rgba(30,36,32,.14);background:#fff;color:#414a44;display:flex;align-items:center;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none')}>ดูรายการ</div>
      <div {...kb(l.openSlip)} className="hv-teal tap"
        style={s('height:34px;padding:0 13px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:6px;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
        </svg>
        ใบสรุป
      </div>
    </div>
  );
}

// ช่อง รพ.สต. — คอลัมน์ของตัวเองแล้ว (พี่กันสั่ง 26 ส.ค. 2569 "รพ.สต. สร้างคอลัมน์แยกด้วย")
// 🚨 ล็อตที่มาจาก รพ.สต. แต่ไม่ได้เลือกว่าแห่งไหน ต้องเห็นว่าข้อมูลไม่ครบ ไม่ใช่ปล่อยว่าง
//    ส่วนล็อตที่ไม่ได้มาจาก รพ.สต. เลย ขีดกลางจาง ๆ พอ ไม่ใช่ข้อมูลขาด
function siteCell(l) {
  if (l.siteLabel) return <span style={s('font:600 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;overflow-wrap:anywhere')}>{l.siteLabel}</span>;
  if (l.siteMissing) return <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#c2543c')}>ยังไม่ได้ระบุ</span>;
  return <span style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#c9cdc9')}>—</span>;
}

// ── หัวหน้าฝั่งมือถือ (พี่กันเลือกแบบ ก · 3 ก.ย. 2569) ─────────────────────
//
// พี่กันบอกว่า "มันกินที่ เเละไม่สวย" — วัดแล้วหัวเดิมกิน 62% ของจอ 900 จุด
// เหลือที่ให้รายการ Lot จริงแค่ใบเดียว ทั้งที่หน้านี้มีไว้ดูรายการ
//
// เดิม 6 แถว   ปุ่มกลับ · หัวเรื่อง · คำอธิบาย · ช่องวันที่ · ชิป · ค้นหา · ตัวกรอง · ยอด+CSV
// ใหม่ 3 แถว   [← ชื่อหน้า+ยอด ⤓] · [ค้นหา ⚙] · ชิปช่วงเวลา
//
// ของที่ย้ายเข้าแผ่นตัวกรอง — ช่องวันที่ · แหล่งที่มา · รพ.สต. · ปุ่มล้างค่า
// 🚨 ชิปช่วงเวลาไม่ย้ายเข้าแผ่น เป็นสิ่งที่กดบ่อยที่สุด ซ่อนแล้วต้องกดสองครั้งทุกครั้ง
// 🚨 ฝั่งคอมไม่แตะเลยสักจุด (V.lotsWide) พี่กันสั่งไว้ตลอดว่าอย่าไปหลงแก้เดสก์ท็อป
function headNarrow(V) {
  return (
    <>
      {/* แถวเดียวจบ — ปุ่มกลับ ชื่อหน้า ยอดรวม และปุ่มส่งออก
          ยอดย้ายขึ้นมาอยู่ใต้ชื่อหน้า เดิมลอยอยู่กลางจอคนละระดับกับปุ่มส่งออก */}
      <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:10px')}>
        <div {...kb(V.closeLots)} aria-label="กลับไปหน้าประวัติ" className="btn-back mrv-hit"
          style={s('width:38px;height:38px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background:#fff;display:flex;align-items:center;justify-content:center;color:#414a44;cursor:pointer;flex:none')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </div>
        <div style={s('min-width:0;flex:1')}>
          <div style={s('font:700 17px/1.25 Sarabun,sans-serif')} role="heading" aria-level="1">รายการ Lot</div>
          <div style={s('font:500 11.5px/1.6 Sarabun,sans-serif;color:#6b746e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
            {renderSortClear(V.lotsSortClear)}
            {V.lotsCountLabel} · <span style={s('font:700 12px/1.6 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.lotsSumLabel}</span>
          </div>
        </div>
        {renderExportBtn(V.doExportLots, 'ส่งออก', {})}
      </div>

      {/* ช่องค้นหา + ปุ่มเปิดแผ่นตัวกรอง
          🚨 ตัวเลขบนปุ่มบอกว่ามีตัวกรองที่ถูกซ่อนไว้ทำงานอยู่กี่ชั้น
             ไม่มีตัวเลขนี้ = กรองค้างไว้แล้วลืม แล้วงงว่าทำไมรายการหาย */}
      <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:9px')}>
        {renderSearchBox({
          value: V.lotsQuery, onChange: V.onLotsQuery, onClear: V.clearLotsQuery,
          placeholder: 'ค้น Lot ผู้บันทึก รพ.สต.',
          font: '400 13.5px/1.75 var(--font-sarabun), Sarabun, sans-serif',
          h: 44, ariaLabel: 'ค้นหาในรายการ Lot',
        })}
        <div {...kb(V.openLotsFilter)} aria-label="ตัวกรองเพิ่มเติม" className="btn-back"
          style={sx('position:relative;width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none',
            { border: '1px solid ' + (V.lotsFilterCount ? 'rgba(47,125,93,.40)' : 'rgba(30,36,32,.14)'),
              background: V.lotsFilterCount ? '#f2f8f4' : '#fff',
              color: V.lotsFilterCount ? '#2f7d5d' : '#414a44' })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />
          </svg>
          {!!V.lotsFilterCount && (
            <span aria-hidden="true"
              style={s('position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:99px;background:#2f7d5d;color:#fff;font:700 10px/17px Sarabun,sans-serif;text-align:center;box-sizing:border-box')}>{V.lotsFilterCount}</span>
          )}
        </div>
      </div>

      {/* ชิปช่วงเวลา — เลื่อนแนวนอนได้ ไม่ตกบรรทัดใหม่อีกแล้ว
          🚨 ห้ามใส่คลาส .tap ชิปห่างกัน 7 จุด ส่วน .tap ขยายพื้นที่กดด้านละ 11 จุด
             พื้นที่กดจะทับกัน เล็งกดช่วงหนึ่งแล้วโดนอีกช่วง (กฎข้อ 3.55) */}
      <div className="mrv-xscroll" style={s('display:flex;gap:7px;margin-bottom:11px;overflow-x:auto;overscroll-behavior-x:contain')}>
        {V.lotsRanges.map((r) => (
          <div key={r.key} {...kb(r.pick)} className={r.on ? 'hv-seg-on' : 'hv-seg-off'}
            style={sx('height:36px;padding:0 15px;border-radius:999px;font:500 12.5px/36px Sarabun,sans-serif;cursor:pointer;white-space:nowrap;flex:none', { background: r.bg, color: r.fg })}>{r.label}</div>
        ))}
      </div>
    </>
  );
}


// ── แผ่นตัวกรองฝั่งมือถือ ────────────────────────────────────────────────────
// เลื่อนขึ้นจากขอบล่าง เก็บทุกอย่างที่ถูกย้ายออกจากหัวหน้าไว้ครบ
//
// 🚨 กดพื้นหลังปิดได้ ต่างจากป๊อปยืนยันลบ เพราะไม่ใช่การกระทำที่ย้อนยาก
//    ปิดทิ้งแล้วตัวกรองยังเป็นเหมือนเดิมทุกอย่าง ไม่มีอะไรเสียหาย
// 🚨 ใช้ Z.panel จากตารางชั้นกลาง ห้ามเขียนเลขเอง (กฎข้อ 3.68)
// 🚨 ต้องเติมชื่อใน anyModalOpen และ _syncModalFlag ด้วย ไม่งั้นฉากหลังเลื่อนตามนิ้ว
export function renderLotsFilter(V) {
  if (!V.lotsFilterOpen) return null;
  const ป้าย = 'font:600 11.5px/1.6 Sarabun,sans-serif;color:#414a44;margin:0 0 6px';
  const ช่องวัน = 'height:44px;padding:0 10px;border-radius:9px;background-color:#fff;font:400 12.5px/1.75 Sarabun,sans-serif;flex:1;min-width:0;box-sizing:border-box';
  return (
    <>
      <div {...kb(V.closeLotsFilter)} aria-label="ปิดตัวกรอง"
        style={sx('position:fixed;inset:0;background:rgba(20,26,22,.34)', { zIndex: Z.panel })} />
      <div role="dialog" aria-modal="true" aria-label="ตัวกรองรายการ Lot"
        style={sx('position:fixed;left:0;right:0;bottom:0;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -5px 22px rgba(0,0,0,.16);padding:10px 16px 20px;max-height:82vh;overflow-y:auto;overscroll-behavior:contain',
          { zIndex: Z.panel + 1 })}>
        <div aria-hidden="true" style={s('width:36px;height:4px;border-radius:99px;background:#d7dbd6;margin:0 auto 12px')} />

        <div style={s(ป้าย)}>ช่วงเวลา</div>
        <div style={s('display:flex;gap:7px;flex-wrap:wrap')}>
          {V.lotsRanges.map((r) => (
            <div key={r.key} {...kb(r.pick)} className={r.on ? 'hv-seg-on' : 'hv-seg-off'}
              style={sx('height:40px;padding:0 16px;border-radius:999px;font:500 12.5px/40px Sarabun,sans-serif;cursor:pointer;white-space:nowrap', { background: r.bg, color: r.fg })}>{r.label}</div>
          ))}
        </div>

        <div style={sx(ป้าย, { marginTop: '16px' })}>หรือกำหนดวันเอง</div>
        <div style={s('display:flex;gap:8px;align-items:center')}>
          <input type="date" value={V.lotsFrom} onChange={V.onLotsFrom} aria-label="ตั้งแต่วันที่"
            style={sx(ช่องวัน, { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;flex:none')}>ถึง</span>
          <input type="date" value={V.lotsTo} onChange={V.onLotsTo} aria-label="ถึงวันที่"
            style={sx(ช่องวัน, { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        </div>

        <div style={sx(ป้าย, { marginTop: '16px' })}>แหล่งที่มา</div>
        {/* 🚨 เขียน background-color แยก ห้ามเขียน background รวบ
               กฎกลางใน globals.css วาดลูกศร ▾ ด้วย background-image
               เขียนรวบแล้วรูปลูกศรหายไป ช่องดูไม่ออกว่ากดได้ (พี่กันทัก 26 ส.ค. 2569) */}
        <select value={V.lotsSrcFilter} onChange={V.setLotsSrc} aria-label="กรองตามแหล่งที่มา"
          style={s('width:100%;height:44px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background-color:#fff;padding:0 36px 0 12px;font:500 13px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer;box-sizing:border-box')}>
          <option value="" style={{ font: '400 13px Sarabun, sans-serif' }}>ทุกแหล่งที่มา</option>
          {V.lotsSrcOptions.map((o) => (
            <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif' }}>{o.label}</option>
          ))}
        </select>

        {V.lotsSiteOn && (
          <>
            <div style={sx(ป้าย, { marginTop: '13px' })}>รพ.สต. ต้นทาง</div>
            <select value={V.lotsSiteFilter} onChange={V.setLotsSite} aria-label="กรองตาม รพ.สต. ต้นทาง"
              style={s('width:100%;height:44px;border-radius:10px;border:1px solid rgba(47,125,93,.34);background-color:#f2f8f4;padding:0 36px 0 12px;font:600 13px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;box-sizing:border-box')}>
              <option value="" style={{ font: '400 13px Sarabun, sans-serif' }}>ทุกแห่ง</option>
              {V.lotsSiteOptions.map((o) => (
                <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif' }}>{o.label}</option>
              ))}
            </select>
          </>
        )}

        {/* ปุ่มล้างค่าเทาไว้ตอนไม่มีอะไรให้ล้าง ไม่ซ่อนทิ้ง
            ซ่อนแล้วปุ่มขวาจะกระโดดขยายเต็มแถวทุกครั้งที่ตัวกรองเปลี่ยน ตาต้องไล่หาใหม่ */}
        <div style={s('display:flex;gap:9px;margin-top:18px')}>
          <div {...kb(V.lotsHasFilter ? V.clearLotsFilters : null)} aria-label="ล้างตัวกรองทั้งหมด"
            className={V.lotsHasFilter ? 'btn-back' : ''}
            style={sx('flex:1;height:46px;border-radius:11px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 13px/1.75 Sarabun,sans-serif',
              { background: '#fff', color: V.lotsHasFilter ? '#414a44' : '#b3b9b4', cursor: V.lotsHasFilter ? 'pointer' : 'default' })}>
            ล้างค่าทั้งหมด
          </div>
          <div {...kb(V.closeLotsFilter)} aria-label="ดูผลการกรอง" className="hv-teal"
            style={s('flex:1;height:46px;border-radius:11px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer')}>
            ดูผล {V.lotsCountLabel}
          </div>
        </div>
      </div>
    </>
  );
}

export function renderLots(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;flex-direction:column;min-height:100%')}>
      {/* กรอบขาวใบเดียวครอบทั้งหน้า — ทำเหมือนหน้าประวัติกับหน้าคลังยา
          (พี่กันสั่ง 4 ก.ย. 2569 "ทำหน้านี้ให้เหมือนกัน")
          🚨 ห้ามใส่ overflow ที่กรอบนี้ — sticky ของแถบหัวกับหัวตารางจะตายทันที
          🚨 min-width:fit-content ห้ามลบ — เหตุผลเดียวกับหน้าประวัติ */}
      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.1);border-radius:14px;padding:16px 18px;flex:1 0 auto;min-width:fit-content')}>

      {/* ── แถบหัวที่ตรึงไว้บนสุด (หัวเรื่อง + ช่วงเวลา + ค้นหา + ตัวกรอง) ──────
          ref = ตัววัดความสูง ส่งให้หัวตารางไปตั้งระยะติดบน (ดู .lots-head ใน globals.css)
          ทำเหมือนหน้าประวัติทุกอย่าง พี่กันสั่ง 27 ส.ค. 2569 */}
      <div ref={V.lotsHeadRef} className="lots-head">

      {/* 🚨 หัวชุดนี้เป็นของฝั่งคอมเท่านั้น ฝั่งมือถือใช้ headNarrow ห้ามแตะข้ามฝั่ง
          พี่กันสั่งไว้ตลอดว่าอย่าไปหลงแก้เดสก์ท็อป (กฎข้อ 3.55) */}
      {V.lotsWide && (
        <>
      {/* ── แถบหัวเรื่อง ─────────────────────────────────────────────────── */}
      <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px')}>
        {/* ปุ่มกลับ — มีข้อความบอกปลายทางด้วย ลูกศรเปล่า ๆ ไม่บอกว่ากดแล้วไปไหน
            (พี่กันสั่ง 26 ส.ค. 2569 "ปุ่มกลับ ขอสวยกว่านี้ และเอาเมาส์ไปชี้แล้วเปลี่ยนสี")
            🚨 สีตอนชี้อยู่ในคลาส .btn-back ของ globals.css ห้ามเขียน onMouseEnter */}
        <div {...kb(V.closeLots)} aria-label="กลับไปหน้าประวัติ" className="btn-back tap"
          style={s('height:38px;padding:0 15px 0 11px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background:#fff;display:flex;align-items:center;gap:7px;font:600 13px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          ประวัติ
        </div>
        <div style={s('min-width:0')}>
          {renderPageTitle('รายการ Lot')}
          <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>หนึ่งรอบกดบันทึก = หนึ่ง Lot · กดหัวคอลัมน์เพื่อเรียงลำดับ</div>
        </div>
        {/* ช่วงวันที่ที่เลือกเอง อยู่แถวเดียวกับปุ่มช่วงเวลา (พี่กันสั่ง 26 ส.ค. 2569)
            ทำเหมือนหน้าประวัติทุกอย่าง ทั้งลำดับ ขนาด และขอบเขียวตอนกำลังใช้อยู่ */}
        <div style={s('margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
          <input type="date" value={V.lotsFrom} onChange={V.onLotsFrom} aria-label="ตั้งแต่วันที่"
            style={sx('height:38px;padding:0 9px;border-radius:8px;background-color:#fff;font:400 12.5px/1.75 Sarabun,sans-serif', { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
          <input type="date" value={V.lotsTo} onChange={V.onLotsTo} aria-label="ถึงวันที่"
            style={sx('height:38px;padding:0 9px;border-radius:8px;background-color:#fff;font:400 12.5px/1.75 Sarabun,sans-serif', { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <div style={s('width:6px;flex:none')}></div>
          {V.lotsRanges.map((r) => (
            <div key={r.key} {...kb(r.pick)} className={(r.on ? 'hv-seg-on' : 'hv-seg-off') + ' tap'} style={sx('padding:7px 14px;border-radius:999px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer', { background: r.bg, color: r.fg })}>{r.label}</div>
          ))}
        </div>
      </div>

      {/* ── แถบค้นหาและตัวกรอง ───────────────────────────────────────────── */}
      <div style={s('display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:11px')}>
        {/* ช่องค้นหามาตรฐานของทั้งเว็บ — แว่นขยาย กันไม้โทหาย จัดกลาง ปุ่มล้าง มาครบในตัว */}
        <div style={s('display:flex;flex:0 1 340px;min-width:200px')}>
          {renderSearchBox({
            value: V.lotsQuery, onChange: V.onLotsQuery, onClear: V.clearLotsQuery,
            placeholder: 'ค้นเลข Lot ชื่อผู้บันทึก หรือชื่อ รพ.สต.',
            font: '400 13px/1.75 var(--font-sarabun), Sarabun, sans-serif',
            h: 38, ariaLabel: 'ค้นหาในรายการ Lot',
          })}
        </div>

        {/* ── ตัวกรองแหล่งที่มา เลือกสองชั้น ────────────────────────────
            พี่กันสั่ง 26 ส.ค. 2569: "กดเลือกแหล่งที่มาก่อนว่ามาจากไหน
             ถ้าเลือก รพ.สต. แล้วก็มีกล่องให้เลือก รพ.สต. เพิ่มว่าที่ไหน"
            เดิมยัดทั้ง 13 แห่งลงดรอปดาวน์เดียวกับแหล่งที่มา รายการยาวเป็นหางว่าว

            🚨 ห้ามเขียน background:#fff แบบรวบในช่องเลือก
               กฎกลางใน globals.css วาดลูกศร ▾ ด้วย background-image
               การเขียนแบบรวบจะล้างรูปลูกศรทิ้ง ช่องเลยดูไม่ออกว่ากดได้
               (ตระกูลเดียวกับบั๊ก border-color เดี่ยวใน hover)
               ต้องเขียน background-color แยกเสมอ */}
        <select value={V.lotsSrcFilter} onChange={V.setLotsSrc} aria-label="กรองตามแหล่งที่มา"
          style={s('height:38px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background-color:#fff;padding:0 34px 0 12px;font:500 12.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none;max-width:100%')}>
          <option value="" style={{ font: '400 13px Sarabun, sans-serif' }}>ทุกแหล่งที่มา</option>
          {V.lotsSrcOptions.map((o) => (
            <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif' }}>{o.label}</option>
          ))}
        </select>

        {/* ช่องที่สอง โผล่เฉพาะตอนเลือกแหล่งที่มาเป็น รพ.สต. */}
        {V.lotsSiteOn && (
          <select value={V.lotsSiteFilter} onChange={V.setLotsSite} aria-label="กรองตาม รพ.สต. ต้นทาง"
            style={s('height:38px;border-radius:10px;border:1px solid rgba(47,125,93,.34);background-color:#f2f8f4;padding:0 34px 0 12px;font:600 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;flex:none;max-width:100%')}>
            <option value="" style={{ font: '400 13px Sarabun, sans-serif' }}>ทุกแห่ง</option>
            {V.lotsSiteOptions.map((o) => (
              <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif' }}>{o.label}</option>
            ))}
          </select>
        )}

        {/* ปุ่มล้างค่า — โผล่เฉพาะตอนมีเงื่อนไขอยู่จริง (พี่กันสั่ง 26 ส.ค. 2569)
            ล้างครบทั้งสามอย่างในคราวเดียว คำค้น แหล่งที่มา และ รพ.สต. */}
        {V.lotsHasFilter && (
          <div {...kb(V.clearLotsFilters)} aria-label="ล้างตัวกรองทั้งหมด" className="btn-back tap"
            style={s('height:38px;padding:0 13px 0 11px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background-color:#fff;display:flex;align-items:center;gap:6px;font:600 12.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
            </svg>
            ล้างค่า
          </div>
        )}

        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:12px;flex:none')}>
          <div style={s('font:600 11px/1.75 Sarabun,sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.45)')}>{V.lotsCountLabel}</div>
          {/* ยอดรวมของที่เห็นอยู่ตอนนี้ — กรอง รพ.สต. แห่งหนึ่งแล้วรู้ทันทีว่าเป็นเงินเท่าไร */}
          <div style={s('font:600 13.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.lotsSumLabel}</div>
          {/* ปุ่มส่งออกตัวเดียวกับที่ใช้ทั้งเว็บ แก้ที่ exportbtn.jsx เปลี่ยนครบทุกจอ
              ส่งออกเฉพาะแถวที่กรองอยู่บนจอ ไม่ใช่ทั้งหมดที่โหลดมา */}
          {renderExportBtn(V.doExportLots, 'ส่งออก CSV', {})}
        </div>
      </div>

        </>
      )}

      {!V.lotsWide && headNarrow(V)}

      </div>{/* ปิดแถบหัวที่ตรึงไว้ */}

      {/* โครงจางระหว่างรอ — ใช้คอลัมน์ชุดเดียวกับตารางจริง (V.lotCols)
          จึงกว้างเท่ากันเป๊ะ ตอนข้อมูลมาถึงหน้าจอไม่กระโดด */}
      {(V.lotsLoading || V.skelDemo) && V.lotsWide && skelTable(V.lotCols, 7)}
      {(V.lotsLoading || V.skelDemo) && !V.lotsWide && (
        <div style={s('display:flex;flex-direction:column;gap:9px')}>
          {[0, 1, 2, 3, 4].map((i) => skelCard(76, null, i))}
        </div>
      )}

      {V.lotsFail && (
        <div style={s('padding:8px 0 18px')}>
          {renderLoadFail({ title: V.lotsFail, detail: 'Lot ที่บันทึกไว้ยังอยู่ครบในระบบ แค่ดึงมาแสดงไม่ได้ตอนนี้', retry: V.lotsRetry })}
        </div>
      )}
      {!V.lotsFail && V.lotsEmpty && !V.lotsFilteredOut && (
        <div style={s('text-align:center;padding:34px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
          <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มี Lot ในช่วงเวลานี้</div>
          <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ลองเปลี่ยนช่วงเวลาด้านบน หรือบันทึกยาคืนสักรอบก่อน</div>
        </div>
      )}

      {/* 🚨 แยกจากกล่องข้างบน — "มี Lot อยู่แต่ตัวกรองคัดออกหมด" เป็นคนละเรื่องกับ "ไม่มี Lot เลย"
             ใช้ข้อความเดียวกันแล้วผู้ใช้จะไปไล่เปลี่ยนช่วงเวลา ทั้งที่ปัญหาอยู่ที่ช่องค้น */}
      {V.lotsFilteredOut && (
        <div style={s('text-align:center;padding:34px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
          <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ไม่พบ Lot ที่ตรงกับที่ค้น</div>
          <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ลองล้างคำค้น หรือเปลี่ยนตัวกรองแหล่งที่มาเป็นทุกแหล่ง</div>
        </div>
      )}

      {/* ══ ตารางจริง (จอกว้าง) ═══════════════════════════════════════════
          รื้อจากกล่อง flex เรียงกันมาเป็น <table> จริง 4 ก.ย. 2569
          หน้านี้เป็นต้นแบบของอีกสองหน้า — เส้นแบ่งคอลัมน์ ไฮไลต์แถว ลูกศรเรียง

          🚨 กรอบนี้ห้ามใส่ overflow เด็ดขาด — sticky ของ thead จะตายทันที
          🚨 ความกว้างคอลัมน์อยู่ที่ <colgroup> ห้ามไปตั้งที่ th หรือ td */}
      {V.lotsWide && !V.lotsEmpty && !V.lotsLoading && !V.skelDemo && (
        <div className="col-tab" style={s('border:1px solid rgba(30,36,32,.10);border-radius:10px')}>
          <table className="tbl tbl-zebra" style={sx('', { '--tbl-top': 'calc(var(--lotshead, 16px) - 16px)' })}>
            <colgroup>
              {V.lotCols.map((c) => (
                <col key={c.key} style={c.flex ? { minWidth: '196px' } : { width: c.w }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {V.lotCols.map((c) => (
                  <th key={c.key} {...(c.pick ? kb(c.pick) : {})} scope="col"
                    className={(c.pick ? 'tbl-sort' : '') + (c.flex ? '' : ' ta-c')}
                    style={sx('', { color: c.fg })}>
                    <span style={s('display:inline-flex;align-items:center;gap:4px')}>
                      {c.label}
                      {c.arrow && <span aria-hidden="true" className="tbl-arrow" style={sx('', { color: c.arrowColor, fontSize: c.arrowSize })}>{c.arrow}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {V.lotRows.map((l) => (
                <tr key={l.key}>
                  <td style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#414a44')}>{l.dateLabel}</td>
                  <td style={s('font:700 13.5px/1.75 Sarabun,sans-serif;color:#2f7d5d')}>{l.lot}</td>
                  {/* ชื่อผู้บันทึกยาวให้ขึ้นบรรทัดใหม่ ห้ามตัดทิ้ง เป็นข้อมูลสืบกลับ */}
                  <td className="wrap" title={l.byFull} style={s('font:500 12.5px/1.75 Sarabun,sans-serif;color:#1e2420')}>{l.by}</td>
                  <td style={s('font:500 12.5px/1.75 Sarabun,sans-serif;color:#414a44')}>{l.srcText}</td>
                  <td>{siteCell(l)}</td>
                  <td className="ta-c" style={s('font:500 12.5px/1.75 Sarabun,sans-serif;color:#414a44')}>{l.itemsCount}</td>
                  <td className="ta-r" style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#2f7d5d')}>{l.savedLabel}</td>
                  {/* มีตัวเลข = ชิดขวาให้หลักตรงกับคอลัมน์ใช้ต่อได้ · ไม่มี = ขีดอยู่กึ่งกลางช่อง
                      ของเดิมขีดชิดขวาจนไปแนบปุ่มแก้ไข ดูเหมือนเศษที่ห้อยอยู่หน้าปุ่ม */}
                  <td className={l.hasLost ? 'ta-r' : 'ta-c'}
                    style={sx('font:600 12.5px/1.75 Sarabun,sans-serif', { color: l.hasLost ? '#c2543c' : '#c9cdc9' })}>
                    {l.hasLost ? l.lostLabel : '—'}
                  </td>
                  {/* มูลค่ารวมทั้งล็อต — เดิมมีแต่ยอดแยกสองช่อง ต้องบวกเอง */}
                  <td className="ta-r" style={s('font:700 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>{l.totalLabel}</td>
                  <td>{rowButtons(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── การ์ด (จอแคบ) ────────────────────────────────────────────────── */}
      {!V.lotsWide && !V.lotsEmpty && !V.lotsLoading && !V.skelDemo && (
        <div style={s('display:flex;flex-direction:column;gap:8px')}>
          {V.lotRows.map((l) => (
            <div key={l.key} style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:12px 13px')}>
              <div style={s('display:flex;align-items:baseline;gap:8px;flex-wrap:wrap')}>
                <div style={s('font:700 15px Sarabun,sans-serif;color:#2f7d5d')}>{l.lot}</div>
                <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>{l.dateLabel}</div>
                <div style={s('margin-left:auto;font:600 15px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{l.savedLabel}</div>
              </div>
              <div style={s('display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:3px')}>
                <div style={s('font:500 12px/1.75 Sarabun,sans-serif;color:#414a44;overflow-wrap:anywhere')}>{l.by}</div>
                <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>· {l.srcText}{l.siteLabel ? ' ' + l.siteLabel : ''}</div>
                <div style={s('margin-left:auto;font:400 11.5px/1.75 Sarabun,sans-serif;color:#6f7873')}>{l.itemsLabel}</div>
              </div>
              {l.hasLost && (
                <div style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#c2543c;margin-top:3px')}>ทำลาย {l.lostLabel}</div>
              )}
              <div style={s('margin-top:9px')}>{rowButtons(l)}</div>
            </div>
          ))}
        </div>
      )}

      {V.lotsHasMore && !V.skelDemo && (
        <div {...kb(V.moreLots)} className="hv-bg-f6 tap" style={s('margin-top:10px;height:44px;border-radius:11px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 13.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>{V.lotsMoreLabel}</div>
      )}
      </div>
    </div>
  );
}

// ── ใบสรุป Lot ──────────────────────────────────────────────────────────────
// 🚨 ตอนสั่งพิมพ์ ทุกอย่างนอกใบนี้ถูกซ่อนด้วย @media print ใน globals.css
//    (คลาส .slip-sheet กับ .slip-hide) ไม่งั้นได้เมนูกับปุ่มติดไปเต็มกระดาษ
export function renderLotSlip(V) {
  if (!V.slipOpen) return null;

  // ── ใบสรุปเป็น "กระดาษ A4 จริง" ตั้งแต่บนหน้าจอ ────────────────────────────
  //
  // พี่กันสั่ง 26 ส.ค. 2569 หลังเปิดไฟล์ PDF จริงดูแล้วไม่สวย
  //   "เอกสารอ่ะ วาดใหม่ จัดเรียงใหม่เลย" · "ไปดูระบบสร้าง pdf ในโปรเจกต์ listless"
  //   "อันนั้นทำมาดีแล้ว" · "ทำออกมาจนกว่าจะดี เทสทุกครั้ง"
  //
  // 🚨 ใบนี้ไม่ใช้สไตล์ฝังในแท็กเลยแม้แต่จุดเดียว — ต่างจากทั้งเว็บที่ใช้ s()
  //    เพราะสไตล์ในแท็กชนะกฎ CSS เสมอ ทำให้ตอนพิมพ์ทับขนาดไม่ได้จริง
  //    ทุกอย่างอยู่ในคลาส .slip-paper ของ globals.css ซึ่งใช้หน่วย pt กับ mm
  //    สิ่งที่เห็นบนจอจึงเท่ากับสิ่งที่ออกมาบนกระดาษเป๊ะ
  //
  // 🚨 ห้ามเอาสไตล์ฝังในแท็กกลับมาใส่ในใบนี้เด็ดขาด ไม่ว่าจะจุดเล็กแค่ไหน
  // 🚨 ใบสรุปต้องแขวนไว้ที่ body โดยตรง ไม่ใช่ฝังลึกอยู่ในหน้าเว็บ
  //    เพราะกฎการพิมพ์ต้องซ่อน "ทุกอย่างที่ไม่ใช่ใบ" ให้ได้
  //    Next.js ห่อทั้งเว็บไว้ในกล่องเดียว ตัวเลือกแบบ body > div:has(...)
  //    จึงไปตรงกับกล่องที่ครอบทั้งเว็บ แล้วเปิดกลับมาทั้งหน้า
  //    (เจอจริง 26 ส.ค. 2569 สั่งพิมพ์แล้วได้หน้ารายการ Lot ออกมาทั้งหน้า)
  if (typeof document === 'undefined') return null;

  const sheet = (
    <div className="slip-backdrop" role="dialog" aria-modal="true" style={s('position:fixed;inset:0;z-index:52;background:rgba(30,36,32,.45);display:flex;flex-direction:column;align-items:center;padding:20px 16px;overflow-y:auto')}>

      <div className="slip-hide" style={s('width:100%;max-width:210mm;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px 12px 0 0;background:#f6f7f4;border:1px solid rgba(30,36,32,.12)')}>
        <div style={s('font:700 15px Sarabun,sans-serif;flex:1;min-width:0')}>ใบสรุป Lot</div>
        <div {...kb(V.printLotSlip)} className="hv-teal tap" style={s('height:38px;padding:0 16px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:7px;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
          </svg>
          พิมพ์
        </div>
        <div {...kb(V.savePdf)} className="hv-bg-f6 tap"
          style={s('height:38px;padding:0 14px;border-radius:9px;border:1px solid rgba(30,36,32,.16);background:#fff;color:#2f7d5d;display:flex;align-items:center;gap:7px;font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
          </svg>
          บันทึก PDF
        </div>
        <div {...kb(V.closeLotSlip)} aria-label="ปิดใบสรุป" className="hv-bg-f6" style={s('width:36px;height:36px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>✕</div>
      </div>

      {/* ── กระดาษ ─────────────────────────────────────────────────────────── */}
      <div className="slip-sheet" style={s('width:100%;max-width:210mm;box-shadow:0 20px 60px rgba(0,0,0,.28)')}>
        <div className="slip-paper">

          <div className="sp-org">{V.slipOrg}</div>
          <div className="sp-title" role="heading" aria-level="1">ใบสรุปรายการยาคืน</div>

          {/* 🚨 เลขที่เอกสารมีเลข Lot อยู่ในตัวแล้ว (ยค. + เลข Lot)
              ห้ามใส่บรรทัด "เลข Lot" ซ้ำอีก พี่กันทักเอง 26 ส.ค. 2569
              ที่ว่างตรงนั้นเอาไปใส่หน่วยบริการต้นทางแทน ซึ่งสำคัญกว่ามาก */}
          <div className="sp-meta">
            <div>
              <div>เลขที่เอกสาร&nbsp; <b>{V.slipDocNo}</b></div>
              <div>วันที่รับคืน&nbsp; <b>{V.slipDate}</b></div>
              <div>ผู้บันทึก&nbsp; <b>{V.slipBy}</b></div>
            </div>
            <div>
              <div>แหล่งที่มา&nbsp; <b>{V.slipSrcLabel}</b></div>
              <div>จำนวนรายการ&nbsp; <b>{V.slipCountLabel}</b></div>
            </div>
          </div>

          {/* หน่วยบริการต้นทาง — โผล่เฉพาะยาที่คืนมาจาก รพ.สต.
              🚨 ต้องเป็นบรรทัดเต็มความกว้าง ห้ามยัดลงคอลัมน์
                 ชื่อเต็มตามทะเบียนยาวเกินครึ่งกระดาษ ยัดลงคอลัมน์แล้วตกบรรทัด
                 ดันบรรทัดอื่นเลื่อนตามจนหัวเอกสารสองฝั่งไม่ตรงกัน
              ใบนี้ถูกส่งกลับไปให้ต้นทางเก็บ จึงเรียกชื่อเต็มตามทะเบียน
              ไม่ใช่ชื่อสั้นที่ใช้เรียกกันในห้องยา */}
          {V.slipSiteFull && (
            <div className="sp-site">หน่วยบริการต้นทาง&nbsp; <b>{V.slipSiteFull}</b></div>
          )}

          {V.slipLoading && <div style={s('text-align:center;padding:30px')}>กำลังโหลดรายการยา</div>}

          {!V.slipLoading && (
            <table className="sp-table">
              <colgroup>
                {/* 🚨 ล็อกความกว้างคอลัมน์เป็นเปอร์เซ็นต์ รวมกันได้ 100 พอดี
                    ชื่อยายาว ๆ จะได้ไม่ดันคอลัมน์ตัวเลขจนบี้ (บทเรียนจาก listless) */}
                <col style={{ width: '6%' }} />
                <col style={{ width: '34%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ที่</th>
                  <th>รายการยา</th>
                  <th>HN</th>
                  <th>จำนวน</th>
                  <th>ราคา/หน่วย</th>
                  <th>มูลค่า</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {V.slipRows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.no}</td>
                    <td className="tl">{r.name}</td>
                    <td>{r.hn}</td>
                    <td className="tr">{r.qtyLabel}</td>
                    <td className="tr">{r.priceLabel}</td>
                    <td className="tr">{r.valueLabel}</td>
                    <td>{r.dispLabel}</td>
                  </tr>
                ))}

                <tr className="sp-sum">
                  <td className="tr" colSpan="5">รวมมูลค่ายาที่ใช้ต่อได้</td>
                  <td className="tr">{V.slipSavedLabel}</td>
                  <td></td>
                </tr>
                {V.slipHasLost && (
                  <tr className="sp-sum">
                    <td className="tr" colSpan="5">รวมมูลค่ายาที่ต้องทำลาย</td>
                    <td className="tr">{V.slipLostLabel}</td>
                    <td></td>
                  </tr>
                )}
                <tr className="sp-total">
                  <td className="tr" colSpan="5">รวมทั้งสิ้น</td>
                  <td className="tr">{V.slipTotalLabel}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* วันเวลาที่พิมพ์ — โผล่เฉพาะตอนสั่งพิมพ์ ผู้ตรวจสอบต้องรู้ว่าใบในมือพิมพ์เมื่อไร
              เพราะยอดเปลี่ยนได้ถ้ามีคนแก้ล็อตย้อนหลัง ซึ่งระบบอนุญาต */}
          {V.slipPrintedAt && <div className="sp-stamp">พิมพ์เมื่อ {V.slipPrintedAt}</div>}

          {/* ── ช่องลงนาม 3 ฝ่าย ────────────────────────────────────────────
              🚨 ห้ามยุบเหลือ 2 ช่อง — ผู้บันทึกเป็นผู้ปฏิบัติ ผู้ตรวจสอบเป็นผู้รับรองยอด
                 เป็นคนละบทบาทกัน เอกสารยาคืนของโรงพยาบาลต้องมีครบทั้งสาม */}
          <div className="sp-sign">
            <div>
              <div className="line"></div>
              <div>( ............................................ )</div>
              <div className="role">ผู้ส่งมอบยา</div>
              <div>วันที่ ......... / ......... / .........</div>
            </div>
            <div>
              <div className="line"></div>
              <div>( {V.slipBy} )</div>
              <div className="role">ผู้บันทึกรับคืน</div>
              <div>วันที่ ......... / ......... / .........</div>
            </div>
            <div>
              <div className="line"></div>
              <div>( ............................................ )</div>
              <div className="role">ผู้ตรวจสอบ</div>
              <div>วันที่ ......... / ......... / .........</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
