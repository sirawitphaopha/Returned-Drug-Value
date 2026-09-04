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

// แถบเครื่องมือเสริม — ไม่มีในมอคอัป
// เดิมมีแค่ 4 ปุ่มช่วงเวลาสำเร็จรูป + ตัดที่ 60 แถว แล้วบอกให้ "กรองช่วงวันที่ให้แคบลง"
// ทั้งที่ไม่มีเครื่องมือเลือกช่วงวันเลย · เพิ่ม เลือกช่วงวันเอง + ถังขยะ + ดูรายล็อต
function renderHistTools(V) {
  return (
    <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px')}>
      <div style={s('display:flex;align-items:center;gap:6px')}>
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
        <input type="date" className="mrv-hit-input" value={V.histFrom} onChange={V.onHistFrom} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
        <input type="date" className="mrv-hit-input" value={V.histTo} onChange={V.onHistTo} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px/1.75 Sarabun,sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
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

      {/* ปุ่มล้างการเรียง — พี่กันสั่งให้มาอยู่ข้างถังขยะ 4 ก.ย. 2569
          โผล่เฉพาะตอนกดเรียงเองแล้วจริง ๆ */}
      {renderSortClear(V.histSortClear)}

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
      <div style={s('display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px')}>
        {renderPageTitle(V.histTitle || 'ประวัติการบันทึก')}
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
        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:14px;font:400 13px/1.75 Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 17px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>
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
          <table className="tbl" style={sx('', { '--tbl-top': 'calc(var(--histhead, 16px) - 16px)' })}>
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
                <td title={hr.name} style={s('overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                  {renderDrugName(hr.parts, { size: '13.5px' })}
                </td>
                <td className="ta-r">{hr.qtyLabel}</td>
                <td className="ta-r" style={s('color:#6b746e')}>{hr.priceLabel}</td>
                <td className="ta-r" style={sx('font:600 14.5px Sarabun,sans-serif', { color: hr.color })}>{hr.valueLabel}</td>
                <td className="ta-c">
                  <span style={sx('display:inline-block;padding:3px 9px;border-radius:6px;font:600 11px/1.75 Sarabun,sans-serif;white-space:nowrap', { background: hr.dispBg, color: hr.dispFg })}>{hr.dispLabel}</span>
                </td>
                <td style={s('color:#6b746e')}>{hr.sourceLabel}</td>
                <td style={s('color:#6b746e')}>{hr.hnLabel}</td>
                {/* 🚨 ชื่อผู้บันทึกห้ามตัดทิ้ง เป็นข้อมูลสืบกลับว่าใครเซ็นรับล็อตนั้น
                    เดิมใช้ ellipsis ตัดท้าย ชื่อยาว ๆ เลยเหลือ "ภญ. วลัยพรรณ…" */}
                <td title={hr.byFull} className="wrap" style={s('color:#6b746e;font-size:12px;line-height:1.35')}>{hr.byLabel}</td>
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
                      <span {...kb(hr.restore)} className="hv-bg-e3f tap" style={s('padding:6px 9px;border-radius:7px;background:#e3f0e8;font:500 11.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;cursor:pointer;white-space:nowrap')}>กู้คืน</span>
                    ) : (
                      <>
                        <span {...kb(hr.edit)} className="hv-bg-e6e tap" style={s('padding:6px 9px;border-radius:7px;background:#f0f1ee;font:500 11.5px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</span>
                        <span {...kb(hr.remove)} className="hv-bg-fbe tap" style={s('padding:6px 9px;border-radius:7px;background:#fdf1ed;font:500 11.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</span>
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
      <div style={s('background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        <div style={s(HEAD_PAD)}>
          {renderPageHead({
          onAbout: V.openAbout, onSettings: V.openSettings,
          sub: (<>{V.histTitle || 'ประวัติ'} · {V.histCountLabel} · <span style={s('font:700 11.5px/1.45 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.histTotalLabel}</span></>),
          })}
        </div>

      <div style={s('padding:0 20px 14px')}>
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
    </div>
  );
}
