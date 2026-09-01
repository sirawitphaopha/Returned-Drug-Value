// หน้าประวัติการบันทึก — คัดจากมอคอัป (คอม 224–265 · มือถือ 267–313)
// เพิ่มจากต้นฉบับอย่างเดียวคือข้อความ "กำลังโหลด" เพราะของจริงต้องรอเซิร์ฟเวอร์
import { s, sx, kb } from '../helpers';
import { renderExportBtn } from './exportbtn';
import { renderDrugName } from './drugname';
import { skelTable, skelCard } from './skeleton';
import { renderLoadFail } from './loadfail';

// แถบเครื่องมือเสริม — ไม่มีในมอคอัป
// เดิมมีแค่ 4 ปุ่มช่วงเวลาสำเร็จรูป + ตัดที่ 60 แถว แล้วบอกให้ "กรองช่วงวันที่ให้แคบลง"
// ทั้งที่ไม่มีเครื่องมือเลือกช่วงวันเลย · เพิ่ม เลือกช่วงวันเอง + ถังขยะ + ดูรายล็อต
function renderHistTools(V) {
  return (
    <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px')}>
      <div style={s('display:flex;align-items:center;gap:6px')}>
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
        <input type="date" value={V.histFrom} onChange={V.onHistFrom} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
        <input type="date" value={V.histTo} onChange={V.onHistTo} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
      </div>

      {/* หน้ารายการ Lot — ประวัติเป็นรายแถวยา มองไม่ออกว่ารอบไหนรับคืนไปเท่าไหร่
          ต้องไล่บวกเอง · หน้านั้นตอบได้ในบรรทัดเดียวต่อ Lot และพิมพ์ใบสรุปได้ */}
      {/* 🚨 ปุ่มนี้เด่นกว่าชิปช่วงเวลาโดยตั้งใจ (พี่กันสั่ง 26 ส.ค. 2569)
          ชิปช่วงเวลาเป็นแค่ตัวกรองของหน้าเดิม แต่ปุ่มนี้พาไปอีกหน้าหนึ่ง
          ของสองอย่างที่ทำคนละเรื่องกันไม่ควรหน้าตาเหมือนกัน
          ใช้พื้นเขียวอ่อนกับขอบเขียว ไม่ใช่เขียวทึบ เพราะเขียวทึบจองไว้ให้
          "ช่วงเวลาที่กำลังเลือกอยู่" แล้ว ถ้าใช้ซ้ำจะอ่านผิดว่าปุ่มนี้ถูกเลือกอยู่ */}
      <div {...kb(V.openLots)} className="hv-bg-e3f tap" style={s('display:inline-flex;align-items:center;gap:7px;padding:8px 15px;border-radius:999px;border:1px solid rgba(47,125,93,.34);font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;background:#e3f0e8;color:#2f7d5d')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
        </svg>
        รายการ Lot
      </div>

      {/* 🚨 คลาส hover ต้องสลับตามสถานะปุ่ม ไม่ใช่ตั้งตายตัว
             ตอนอยู่ในถังขยะปุ่มเป็นพื้นเขียวตัวหนังสือขาว ถ้าใช้ hv-bg-f6 (พื้นขาวนวล)
             ชี้เมาส์แล้วตัวหนังสือขาวจะกลืนไปกับพื้นขาว อ่านไม่ออกเลย
             (พี่กันเจอเอง 25 ส.ค. 2569 — ตระกูลเดียวกับบั๊ก border-color ใน ME-DRP) */}
      <div {...kb(V.toggleTrash)} className={(V.histTrash ? 'hv-teal' : 'hv-bg-f6') + ' tap'} style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer', { background: V.histTrash ? '#2f7d5d' : '#f0f1ee', color: V.histTrash ? '#fff' : '#414a44' })}>
        {V.trashLabel}
      </div>

      {V.histLot && (
        <div {...kb(V.clearLot)} aria-label="เลิกกรองเฉพาะ Lot นี้" className="hv-bg-e3f tap" style={s('display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer')}>
          Lot {V.histLot} <span aria-hidden="true" style={s('font:400 13px/1.75 Sarabun,sans-serif')}>✕</span>
        </div>
      )}

      {/* ส่งออกเฉพาะที่กรองอยู่ตอนนี้ — หน้าสรุปมีปุ่มส่งออกทั้งปีงบอยู่แล้ว */}
      {renderExportBtn(V.exportHistoryCsv, V.histExportLabel, { push: true })}
    </div>
  );
}

// 🚨 width:100% ห้ามลบ — เหตุผลเดียวกับหน้าบันทึก (margin:0 auto ใน flex = เลิกยืดเต็มความกว้าง)
export function renderHistoryWide(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;flex:1 0 auto')}>
      {/* แถบกรองติดบนตอนเลื่อน — เลื่อนดูแถวลึก ๆ แล้วยังเปลี่ยนช่วงเวลา/ค้นหาได้ทันที
          ref = ตัววัดความสูง ส่งให้หัวตารางไปตั้งระยะติดบน (ดู .hist-head ใน globals.css) */}
      <div ref={V.histHeadRef} className="hist-head">
      <div style={s('display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px')}>
        <div role="heading" aria-level="1" style={s('font:600 19px Sarabun,sans-serif')}>{V.histTitle || 'ประวัติการบันทึก'}</div>
        {/* ช่องค้นหา — ระบบเดียวกับหน้าคลังยาและหน้าบันทึก (พี่กันสั่ง 25 ส.ค. 2569)
            รองรับลืมสลับแป้นพิมพ์ + ป้ายบอกคำที่ค้นจริง + ปุ่มล้าง
            เว้นที่ว่างขวาตามสิ่งที่โผล่จริง ไม่งั้นตัวหนังสือที่พิมพ์จะลอดไปใต้ป้าย */}
        <div style={s('position:relative;width:320px;flex:none')}>
          <input value={V.histQuery} onChange={V.onHistQuery}
            placeholder="ค้นด้วยชื่อยา · HN · ชื่อคนบันทึก · เลข Lot"
            style={sx('width:100%;height:42px;box-sizing:border-box;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif',
              { paddingRight: V.histSwapped ? '150px' : (V.histHasSearch ? '42px' : '13px') })} />
          {V.histSwapped && (
            <span style={s('position:absolute;right:40px;top:50%;transform:translateY(-50%);font:600 11px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border-radius:6px;padding:3px 8px;white-space:nowrap;pointer-events:none')}>
              ค้นว่า {V.histSwapLabel}
            </span>
          )}
          {V.histHasSearch && (
            <span {...kb(V.clearHistQuery)} aria-label="ล้างช่องค้นหา" className="tap hv-bg-eef" title="ล้างช่องค้นหา"
              style={s('position:absolute;right:7px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b746e;font:400 13px/1.75 Sarabun,sans-serif')}>✕</span>
          )}
        </div>
        <div style={s('display:flex;gap:6px')}>
          {V.ranges.map((g) => (
            <div key={g.key} {...kb(g.pick)} className={(g.on ? 'hv-seg-on' : 'hv-seg-off') + ' tap'} style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>
        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:14px;font:400 13px/1.75 Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 17px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>
      </div>

      {renderHistTools(V)}
      </div>

      {/* overflow:hidden ถูกเอาออกเพราะทำให้หัวตารางติดบนไม่ทำงาน
          ใช้มุมโค้งกับเส้นขอบที่แถวแทน */}
      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px')}>
        {/* หัวตาราง — กดเรียงได้ทุกคอลัมน์ · สีเข้มกว่าเดิม
            (เดิมพื้น #f6f7f4 ตัวหนังสือ rgba(.5) จางมากจนแทบมองไม่เห็น) */}
        <div className="sticky-head" style={s("display:flex;padding:11px 16px;background:#e3f0e8;border-bottom:1px solid rgba(47,125,93,.22);border-radius:10px 10px 0 0;font:600 11.5px/1.75 Sarabun,sans-serif;letter-spacing:.04em")}>
          {V.histCols.map((c) => (
            <span
              key={c.key}
              {...kb(c.pick)}
              className="hv-bg-e3f"
              style={sx('display:flex;align-items:center;gap:4px;cursor:pointer;user-select:none;border-radius:5px;margin:-3px 0;padding:3px 0', Object.assign(
                { color: c.fg },
                c.flex ? { flex: 1, minWidth: '180px' } : { width: c.w },
                c.align === 'right' ? { justifyContent: 'flex-end' } : c.align === 'center' ? { justifyContent: 'center' } : {}
              ))}
            >
              {c.label}
              <span style={sx('font-size:9px;flex:none', { color: c.arrowColor })}>{c.arrow}</span>
            </span>
          ))}
          <span style={s('width:80px')}></span>
        </div>

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

        {V.histRows.map((hr) => (
          <div key={hr.key} style={sx('display:flex;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(30,36,32,.05);font:400 13.5px/1.75 Sarabun,sans-serif;font-variant-numeric:tabular-nums', { background: hr.bg })}>
            <span style={s('width:110px;color:#6b746e')}>{hr.dateLabel}</span>
            {/* ชื่อยาต้องตัดด้วยจุดไข่ปลา ไม่งั้นชื่อยาว ๆ ดันแถวสูงเป็นสิบบรรทัด
                title = เอาเมาส์ชี้แล้วเห็นชื่อเต็ม */}
            {/* ชื่อยาวาดทีละส่วนพร้อมสี ตัวเดียวกับผลค้นหาในหน้าบันทึก
                (พี่กันสั่ง 25 ส.ค. 2569 "ไหนสีแบบที่ช่องค้นหา")
                ยังตัดด้วยจุดไข่ปลาเหมือนเดิม ไม่งั้นชื่อยาว ๆ ดันแถวสูงเป็นสิบบรรทัด
                title = เอาเมาส์ชี้แล้วเห็นชื่อเต็ม */}
            <span title={hr.name} style={s('flex:1;min-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px')}>
              {renderDrugName(hr.parts, { size: '13.5px' })}
            </span>
            <span style={s('width:80px;text-align:right')}>{hr.qtyLabel}</span>
            <span style={s('width:92px;text-align:right;color:#6b746e')}>{hr.priceLabel}</span>
            <span style={sx("width:104px;text-align:right;font:600 14.5px Sarabun,sans-serif", { color: hr.color })}>{hr.valueLabel}</span>
            <span style={s('width:90px;display:flex;justify-content:center')}>
              <span style={sx('padding:3px 9px;border-radius:6px;font:600 11px/1.75 Sarabun,sans-serif;white-space:nowrap', { background: hr.dispBg, color: hr.dispFg })}>{hr.dispLabel}</span>
            </span>
            <span style={s('width:88px;color:#6b746e')}>{hr.sourceLabel}</span>
            <span style={s('width:84px;color:#6b746e')}>{hr.hnLabel}</span>
            {/* 🚨 ชื่อผู้บันทึกห้ามตัดทิ้ง เป็นข้อมูลสืบกลับว่าใครเซ็นรับล็อตนั้น (กฎเดิมของหน้ารายการ Lot)
                เดิมใช้ ellipsis ตัดท้าย ชื่อยาว ๆ เลยเหลือ "ภญ. วลัยพรรณ…" อ่านไม่ออกว่านามสกุลอะไร
                ฟอนต์ Roboto Mono ทำให้เห็นชัดขึ้นเพราะตัวอักษรกว้างกว่าเดิม (พี่กันจับได้ 27 ส.ค. 2569) */}
            <span title={hr.byLabel} style={s('width:118px;color:#6b746e;font-size:12px;overflow-wrap:anywhere;padding-right:8px;line-height:1.35')}>{hr.byLabel}</span>
            {/* เลข Lot — กดแล้วกรองดูเฉพาะ Lot นั้น */}
            <span style={s('width:96px;padding-right:8px;overflow:hidden')}>
              {hr.hasLot ? (
                <span {...kb(hr.openLot)} className="hv-lot" title={'ดูเฉพาะ ' + hr.lotLabel}
                  style={s("font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;cursor:pointer;border-bottom:1px dashed rgba(30,36,32,.28);white-space:nowrap")}>{hr.lotLabel}</span>
              ) : (
                <span style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#c0c5c1')}>{hr.lotLabel}</span>
              )}
            </span>
            <span style={s('width:80px;display:flex;justify-content:flex-end;gap:6px')}>
              {hr.inTrash ? (
                <span {...kb(hr.restore)} className="hv-bg-e3f tap" style={s('padding:6px 9px;border-radius:7px;background:#e3f0e8;font:500 11.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>กู้คืน</span>
              ) : (
                <>
                  <span {...kb(hr.edit)} className="hv-bg-e6e tap" style={s('padding:6px 9px;border-radius:7px;background:#f0f1ee;font:500 11.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</span>
                  <span {...kb(hr.remove)} className="hv-bg-fbe tap" style={s('padding:6px 9px;border-radius:7px;background:#fdf1ed;font:500 11.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      {V.histTruncated && !V.skelDemo && (
        <div style={s('text-align:center;padding:14px 0 0')}>
          <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6f7873;margin-bottom:8px')}>{V.histTruncLabel}</div>
          <div {...kb(V.loadMoreHistory)} className="hv-bg-f6 tap" style={s('display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(30,36,32,.16);border-radius:999px;background:#fff;font:600 13px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>{V.loadMoreLabel}</div>
        </div>
      )}
    </div>
  );
}

export function renderHistoryNarrow(V) {
  return (
    <div style={s('width:100%;max-width:520px;margin:0 auto;min-height:100%;flex:1 0 auto')}>
      <div style={s('padding:16px 20px 14px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:10px')}>
          <div style={s('width:30px;height:30px;border-radius:8px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;position:relative;flex:none')}>
            <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
            <span style={s("font:700 13px/1.75 Sarabun,sans-serif;color:#fff;line-height:1")}>฿</span>
          </div>
          <div role="heading" aria-level="1" style={s('font:600 18px Sarabun,sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{V.histTitle || 'ประวัติการบันทึก'}</div>
          <div {...kb(V.openAbout)} aria-label="เกี่ยวกับ" title="เกี่ยวกับ" className="hv-bg-f6" style={s('margin-left:auto;width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:700 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>ℹ</div>
          <div {...kb(V.openSettings)} aria-label="ตั้งค่า" title="ตั้งค่า" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>⚙</div>
        </div>
        {/* ฝั่งมือถือ — ระบบเดียวกับฝั่งคอมทุกอย่าง ต่างแค่ขนาดกับสีพื้น */}
        <div style={s('position:relative;width:100%;margin-bottom:9px')}>
          <input value={V.histQuery} onChange={V.onHistQuery}
            placeholder="ชื่อยา · HN · ชื่อคนบันทึก · เลข Lot"
            style={sx('width:100%;height:44px;box-sizing:border-box;padding:0 13px;border:1px solid rgba(30,36,32,.14);border-radius:10px;background:#f6f7f4;font:400 14.5px Sarabun,sans-serif',
              { paddingRight: V.histSwapped ? '150px' : (V.histHasSearch ? '44px' : '13px') })} />
          {V.histSwapped && (
            <span style={s('position:absolute;right:42px;top:50%;transform:translateY(-50%);font:600 11px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border-radius:6px;padding:3px 8px;white-space:nowrap;pointer-events:none')}>
              ค้นว่า {V.histSwapLabel}
            </span>
          )}
          {V.histHasSearch && (
            <span {...kb(V.clearHistQuery)} aria-label="ล้างช่องค้นหา" className="tap hv-bg-eef" title="ล้างช่องค้นหา"
              style={s('position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b746e;font:400 14px Sarabun,sans-serif')}>✕</span>
          )}
        </div>
        {/* ชิปช่วงเวลาฝั่งมือถือ — สูง 44px เต็มเกณฑ์นิ้ว (ผลตรวจข้อ ต-12)
            🚨 ถอดคลาส .tap ออกจากชิปที่วางเรียงติดกัน
               .tap ขยายพื้นที่กดออกด้านละ 11px ชิปที่ห่างกัน 6px จึงทับกันหมดแถว
               กดชิปหนึ่งแล้วโดนชิปข้าง ๆ · ขยายตัวชิปเองแทนแล้วไม่ต้องพึ่ง .tap
            🚨 ฝั่งเดสก์ท็อป (renderHistoryWide) ห้ามแตะ พี่กันสั่ง "อย่าไปหลงแก้ในเดสก์ท็อป"
               เมาส์ชี้แม่นกว่านิ้วมาก ปุ่มเล็กบนคอมไม่ใช่ปัญหา */}
        <div style={s('display:flex;gap:8px;flex-wrap:wrap')}>
          {V.ranges.map((g) => (
            <div key={g.key} {...kb(g.pick)} className={g.on ? 'hv-seg-on' : 'hv-seg-off'} style={sx('min-height:44px;padding:0 15px;border-radius:999px;display:inline-flex;align-items:center;font:500 13px/1.75 Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
          {/* เด่นกว่าชิปช่วงเวลาแบบเดียวกับฝั่งคอม — ของสองอย่างที่ทำคนละเรื่องกัน
              ไม่ควรหน้าตาเหมือนกัน (กฎ "อะไรที่คล้ายกันทำให้เหมือนกัน" ใช้กับของที่คล้ายกันจริง) */}
          <div {...kb(V.openLots)} className="hv-bg-e3f" style={s('min-height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(47,125,93,.34);font:600 13px/1.75 Sarabun,sans-serif;cursor:pointer;background:#e3f0e8;color:#2f7d5d')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" />
          </svg>
            รายการ Lot
          </div>
          <div {...kb(V.toggleTrash)} className={V.histTrash ? 'hv-seg-on' : 'hv-seg-off'} style={sx('min-height:44px;padding:0 15px;border-radius:999px;display:inline-flex;align-items:center;font:500 13px/1.75 Sarabun,sans-serif;cursor:pointer', { background: V.histTrash ? '#2f7d5d' : '#f0f1ee', color: V.histTrash ? '#fff' : '#414a44' })}>{V.trashLabel}</div>
          {/* 🚨 เขียน "Lot" เป็นภาษาอังกฤษเสมอ ห้ามแปลว่า "ชุด" (พี่กันสั่ง — แคลร์เคยแปลผิดมาแล้ว)
              ตรงนี้หลุดมาจากรอบก่อน เพิ่งเจอตอนไล่ทำหน้ารายการ Lot */}
          {V.histLot && (
            <div {...kb(V.clearLot)} className="hv-bg-e3f tap" style={s('display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer')}>Lot {V.histLot} ✕</div>
          )}
        </div>
        <div style={s('display:flex;align-items:center;gap:6px;margin-top:9px')}>
          <input type="date" value={V.histFrom} onChange={V.onHistFrom} style={sx("flex:1;min-width:0;height:38px;padding:0 9px;border-radius:8px;background:#f6f7f4;font:400 16px Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.14)') })} />
          <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;flex:none')}>ถึง</span>
          <input type="date" value={V.histTo} onChange={V.onHistTo} style={sx("flex:1;min-width:0;height:38px;padding:0 9px;border-radius:8px;background:#f6f7f4;font:400 16px Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.14)') })} />
        </div>
      </div>

      <div style={s('padding:14px 20px 20px')}>
        <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>

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
    </div>
  );
}
