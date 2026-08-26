// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
// ใช้ภาษาภาพชุดเดียวกับหน้าประวัติ (สี ระยะ ความโค้ง) จะได้ไม่รู้สึกเป็นคนละเว็บ
import { createPortal } from 'react-dom';
import { s, sx, kb } from '../helpers';
import { renderExportBtn } from './exportbtn';

// ── ปุ่มจัดการท้ายแถว ────────────────────────────────────────────────────────
// แยกออกมาเพราะใช้ทั้งตาราง (จอกว้าง) และการ์ด (จอแคบ) ต้องเหมือนกันเป๊ะ
// 🚨 ปุ่มแก้ไขเป็นสีอำพันต่างจากอีกสองปุ่มโดยตั้งใจ เพราะเป็นปุ่มเดียวที่เปลี่ยนข้อมูลจริง
//    อีกสองปุ่มเป็นแค่การเปิดดู กดผิดแล้วไม่มีอะไรเสียหาย (พี่กันเคาะ 25 ส.ค. 2569)
// 🚨 ทุกปุ่มต้องมีข้อความกำกับ ห้ามย่อเหลือแต่ไอคอน (พี่กันสั่ง 26 ส.ค. 2569)
//    เคยย่อสองปุ่มแรกเหลือแต่ไอคอนเพื่อประหยัดที่ในตาราง พี่กันสั่งให้เอากลับ
//    ไอคอนเปล่า ๆ ต้องเดาความหมาย และคนที่ไม่ได้ใช้ทุกวันจะไม่กล้ากด
function rowButtons(l) {
  return (
    <div style={s('display:flex;gap:6px;justify-content:flex-end')}>
      <div {...kb(l.openEdit)} aria-label={'แก้ไข Lot ' + l.lot} title="แก้ไขล็อตนี้" className="tap"
        style={s('height:34px;padding:0 11px;border-radius:9px;border:1px solid rgba(150,101,15,.30);background:#fdf6e9;color:#96650f;display:flex;align-items:center;gap:5px;font:600 12.5px Sarabun,sans-serif;cursor:pointer;flex:none')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        แก้ไข
      </div>
      <div {...kb(l.openHistory)} aria-label={'ดูรายการยาใน Lot ' + l.lot} title="ดูรายการยาข้างใน" className="hv-bg-f6 tap"
        style={s('height:34px;padding:0 12px;border-radius:9px;border:1px solid rgba(30,36,32,.14);background:#fff;color:#414a44;display:flex;align-items:center;font:600 12.5px Sarabun,sans-serif;cursor:pointer;flex:none')}>ดูรายการ</div>
      <div {...kb(l.openSlip)} className="hv-teal tap"
        style={s('height:34px;padding:0 13px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:6px;font:600 12.5px Sarabun,sans-serif;cursor:pointer;flex:none')}>
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
  if (l.siteLabel) return <span style={s('font:600 12.5px Sarabun,sans-serif;color:#2f7d5d;overflow-wrap:anywhere')}>{l.siteLabel}</span>;
  if (l.siteMissing) return <span style={s('font:500 11.5px Sarabun,sans-serif;color:#c2543c')}>ยังไม่ได้ระบุ</span>;
  return <span style={s('font:400 12.5px Sarabun,sans-serif;color:#c9cdc9')}>—</span>;
}

export function renderLots(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;flex-direction:column;min-height:100%')}>

      {/* ── แถบหัวเรื่อง ─────────────────────────────────────────────────── */}
      <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px')}>
        {/* ปุ่มกลับ — มีข้อความบอกปลายทางด้วย ลูกศรเปล่า ๆ ไม่บอกว่ากดแล้วไปไหน
            (พี่กันสั่ง 26 ส.ค. 2569 "ปุ่มกลับ ขอสวยกว่านี้ และเอาเมาส์ไปชี้แล้วเปลี่ยนสี")
            🚨 สีตอนชี้อยู่ในคลาส .btn-back ของ globals.css ห้ามเขียน onMouseEnter */}
        <div {...kb(V.closeLots)} aria-label="กลับไปหน้าประวัติ" className="btn-back tap"
          style={s('height:38px;padding:0 15px 0 11px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background:#fff;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          ประวัติ
        </div>
        <div style={s('min-width:0')}>
          <div style={s('font:700 19px/1.2 Sarabun,sans-serif')} role="heading" aria-level="1">รายการ Lot</div>
          <div style={s('font:400 12px/1.3 Sarabun,sans-serif;color:#6b746e')}>หนึ่งรอบกดบันทึก = หนึ่ง Lot · กดหัวคอลัมน์เพื่อเรียงลำดับ</div>
        </div>
        {/* ช่วงวันที่ที่เลือกเอง อยู่แถวเดียวกับปุ่มช่วงเวลา (พี่กันสั่ง 26 ส.ค. 2569)
            ทำเหมือนหน้าประวัติทุกอย่าง ทั้งลำดับ ขนาด และขอบเขียวตอนกำลังใช้อยู่ */}
        <div style={s('margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
          <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
          <input type="date" value={V.lotsFrom} onChange={V.onLotsFrom} aria-label="ตั้งแต่วันที่"
            style={sx('height:38px;padding:0 9px;border-radius:8px;background-color:#fff;font:400 12.5px Sarabun,sans-serif', { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
          <input type="date" value={V.lotsTo} onChange={V.onLotsTo} aria-label="ถึงวันที่"
            style={sx('height:38px;padding:0 9px;border-radius:8px;background-color:#fff;font:400 12.5px Sarabun,sans-serif', { border: '1px solid ' + (V.lotsCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
          <div style={s('width:6px;flex:none')}></div>
          {V.lotsRanges.map((r) => (
            <div key={r.key} {...kb(r.pick)} className="tap" style={sx('padding:7px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: r.bg, color: r.fg })}>{r.label}</div>
          ))}
        </div>
      </div>

      {/* ── แถบค้นหาและตัวกรอง ───────────────────────────────────────────── */}
      <div style={s('display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:11px')}>
        <div style={s('position:relative;flex:0 1 340px;min-width:200px')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6f7873" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input value={V.lotsQuery} onChange={V.onLotsQuery} placeholder="ค้นเลข Lot ชื่อผู้บันทึก หรือชื่อ รพ.สต."
            aria-label="ค้นหาในรายการ Lot"
            style={s('width:100%;height:38px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background:#fff;padding:0 34px;font:400 13px Sarabun,sans-serif;color:#1e2420;outline:none;box-sizing:border-box')} />
          {V.lotsHasSearch && (
            <div {...kb(V.clearLotsQuery)} aria-label="ล้างคำค้น" className="hv-bg-f6"
              style={s('position:absolute;right:7px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font:400 13px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>✕</div>
          )}
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
          style={s('height:38px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background-color:#fff;padding:0 34px 0 12px;font:500 12.5px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none;max-width:100%')}>
          <option value="" style={{ font: '400 13px Sarabun, sans-serif' }}>ทุกแหล่งที่มา</option>
          {V.lotsSrcOptions.map((o) => (
            <option key={o.value} value={o.value} style={{ font: '400 13px Sarabun, sans-serif' }}>{o.label}</option>
          ))}
        </select>

        {/* ช่องที่สอง โผล่เฉพาะตอนเลือกแหล่งที่มาเป็น รพ.สต. */}
        {V.lotsSiteOn && (
          <select value={V.lotsSiteFilter} onChange={V.setLotsSite} aria-label="กรองตาม รพ.สต. ต้นทาง"
            style={s('height:38px;border-radius:10px;border:1px solid rgba(47,125,93,.34);background-color:#f2f8f4;padding:0 34px 0 12px;font:600 12.5px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;flex:none;max-width:100%')}>
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
            style={s('height:38px;padding:0 13px 0 11px;border-radius:10px;border:1px solid rgba(30,36,32,.14);background-color:#fff;display:flex;align-items:center;gap:6px;font:600 12.5px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
            </svg>
            ล้างค่า
          </div>
        )}

        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:12px;flex:none')}>
          <div style={s('font:600 11px Sarabun,sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.45)')}>{V.lotsCountLabel}</div>
          {/* ยอดรวมของที่เห็นอยู่ตอนนี้ — กรอง รพ.สต. แห่งหนึ่งแล้วรู้ทันทีว่าเป็นเงินเท่าไร */}
          <div style={s('font:600 13.5px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.lotsSumLabel}</div>
          {/* ปุ่มส่งออกตัวเดียวกับที่ใช้ทั้งเว็บ แก้ที่ exportbtn.jsx เปลี่ยนครบทุกจอ
              ส่งออกเฉพาะแถวที่กรองอยู่บนจอ ไม่ใช่ทั้งหมดที่โหลดมา */}
          {renderExportBtn(V.doExportLots, 'ส่งออก CSV', {})}
        </div>
      </div>

      {V.lotsLoading && (
        <div style={s('text-align:center;padding:40px 12px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดรายการ Lot</div>
      )}

      {V.lotsEmpty && !V.lotsFilteredOut && (
        <div style={s('text-align:center;padding:34px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
          <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มี Lot ในช่วงเวลานี้</div>
          <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>ลองเปลี่ยนช่วงเวลาด้านบน หรือบันทึกยาคืนสักรอบก่อน</div>
        </div>
      )}

      {/* 🚨 แยกจากกล่องข้างบน — "มี Lot อยู่แต่ตัวกรองคัดออกหมด" เป็นคนละเรื่องกับ "ไม่มี Lot เลย"
             ใช้ข้อความเดียวกันแล้วผู้ใช้จะไปไล่เปลี่ยนช่วงเวลา ทั้งที่ปัญหาอยู่ที่ช่องค้น */}
      {V.lotsFilteredOut && (
        <div style={s('text-align:center;padding:34px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
          <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ไม่พบ Lot ที่ตรงกับที่ค้น</div>
          <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>ลองล้างคำค้น หรือเปลี่ยนตัวกรองแหล่งที่มาเป็นทุกแหล่ง</div>
        </div>
      )}

      {/* ── ตาราง (จอกว้าง) ──────────────────────────────────────────────── */}
      {V.lotsWide && !V.lotsEmpty && !V.lotsLoading && (
        <div style={s('border:1px solid rgba(30,36,32,.10);border-radius:11px;background:#fff')}>
          <div style={s('display:flex;padding:11px 15px;background:#e3f0e8;border-bottom:1px solid rgba(47,125,93,.22);border-radius:10px 10px 0 0;font:600 11.5px Sarabun,sans-serif;letter-spacing:.04em')}>
            {V.lotCols.map((c) => (
              <span key={c.key}
                {...(c.pick ? kb(c.pick) : {})}
                className={c.pick ? 'hv-bg-e3f' : ''}
                style={sx('display:flex;align-items:center;gap:4px;user-select:none;border-radius:5px;margin:-3px 0;padding:3px 0', Object.assign(
                  { color: c.fg, cursor: c.pick ? 'pointer' : 'default' },
                  c.flex ? { flex: 1, minWidth: '120px' } : { width: c.w, flex: 'none' },
                  c.align === 'right' ? { justifyContent: 'flex-end' } : c.align === 'center' ? { justifyContent: 'center' } : {}
                ))}
              >
                {c.label}
                {c.arrow && <span aria-hidden="true" style={sx('font-size:10px;line-height:1', { color: c.arrowColor })}>{c.arrow}</span>}
              </span>
            ))}
          </div>

          {V.lotRows.map((l, i) => (
            <div key={l.key} style={sx('display:flex;align-items:center;padding:9px 15px;border-top:1px solid rgba(30,36,32,.06)', { background: i % 2 ? '#fbfcfb' : '#fff' })}>
              <span style={s('width:92px;flex:none;font:400 12.5px Sarabun,sans-serif;color:#414a44')}>{l.dateLabel}</span>
              <span style={s('width:108px;flex:none;font:700 13.5px Sarabun,sans-serif;color:#2f7d5d')}>{l.lot}</span>
              {/* ชื่อผู้บันทึกยาวให้ขึ้นบรรทัดใหม่ ห้ามตัดทิ้ง เป็นข้อมูลสืบกลับ */}
              <span style={s('flex:1;min-width:120px;font:500 12.5px Sarabun,sans-serif;color:#1e2420;overflow-wrap:anywhere;padding-right:10px')}>{l.by}</span>
              <span style={s('width:108px;flex:none;padding-right:8px;font:500 12.5px Sarabun,sans-serif;color:#414a44')}>{l.srcText}</span>
              <span style={s('width:120px;flex:none;padding-right:8px')}>{siteCell(l)}</span>
              <span style={s('width:72px;flex:none;text-align:center;font:500 12.5px Sarabun,sans-serif;color:#414a44;font-variant-numeric:tabular-nums')}>{l.itemsCount}</span>
              <span style={s('width:100px;flex:none;text-align:right;font:600 13px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{l.savedLabel}</span>
              <span style={sx('width:90px;flex:none;text-align:right;font:600 12.5px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { color: l.hasLost ? '#c2543c' : '#c9cdc9' })}>{l.hasLost ? l.lostLabel : '—'}</span>
              <span style={s('width:262px;flex:none')}>{rowButtons(l)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── การ์ด (จอแคบ) ────────────────────────────────────────────────── */}
      {!V.lotsWide && !V.lotsEmpty && !V.lotsLoading && (
        <div style={s('display:flex;flex-direction:column;gap:8px')}>
          {V.lotRows.map((l) => (
            <div key={l.key} style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:12px 13px')}>
              <div style={s('display:flex;align-items:baseline;gap:8px;flex-wrap:wrap')}>
                <div style={s('font:700 15px Sarabun,sans-serif;color:#2f7d5d')}>{l.lot}</div>
                <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e')}>{l.dateLabel}</div>
                <div style={s('margin-left:auto;font:600 15px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{l.savedLabel}</div>
              </div>
              <div style={s('display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:3px')}>
                <div style={s('font:500 12px Sarabun,sans-serif;color:#414a44;overflow-wrap:anywhere')}>{l.by}</div>
                <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e')}>· {l.srcText}{l.siteLabel ? ' ' + l.siteLabel : ''}</div>
                <div style={s('margin-left:auto;font:400 11.5px Sarabun,sans-serif;color:#6f7873')}>{l.itemsLabel}</div>
              </div>
              {l.hasLost && (
                <div style={s('font:600 12px Sarabun,sans-serif;color:#c2543c;margin-top:3px')}>ทำลาย {l.lostLabel}</div>
              )}
              <div style={s('margin-top:9px')}>{rowButtons(l)}</div>
            </div>
          ))}
        </div>
      )}

      {V.lotsHasMore && (
        <div {...kb(V.moreLots)} className="hv-bg-f6 tap" style={s('margin-top:10px;height:44px;border-radius:11px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 13.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>{V.lotsMoreLabel}</div>
      )}
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
    <div className="slip-backdrop" role="dialog" aria-modal="true" style={s('position:fixed;inset:0;z-index:60;background:rgba(30,36,32,.45);display:flex;flex-direction:column;align-items:center;padding:20px 16px;overflow-y:auto')}>

      <div className="slip-hide" style={s('width:100%;max-width:210mm;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px 12px 0 0;background:#f6f7f4;border:1px solid rgba(30,36,32,.12)')}>
        <div style={s('font:700 15px Sarabun,sans-serif;flex:1;min-width:0')}>ใบสรุป Lot</div>
        <div {...kb(V.printLotSlip)} className="hv-teal tap" style={s('height:38px;padding:0 16px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;cursor:pointer')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
          </svg>
          พิมพ์
        </div>
        <div {...kb(V.savePdf)} className="hv-bg-f6 tap"
          style={s('height:38px;padding:0 14px;border-radius:9px;border:1px solid rgba(30,36,32,.16);background:#fff;color:#2f7d5d;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;cursor:pointer')}>
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
