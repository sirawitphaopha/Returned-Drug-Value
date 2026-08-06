// หน้าประวัติการบันทึก — คัดจากมอคอัป (คอม 224–265 · มือถือ 267–313)
// เพิ่มจากต้นฉบับอย่างเดียวคือข้อความ "กำลังโหลด" เพราะของจริงต้องรอเซิร์ฟเวอร์
import { s, sx } from '../helpers';
import { renderExportBtn } from './exportbtn';

// แถบเครื่องมือเสริม — ไม่มีในมอคอัป
// เดิมมีแค่ 4 ปุ่มช่วงเวลาสำเร็จรูป + ตัดที่ 60 แถว แล้วบอกให้ "กรองช่วงวันที่ให้แคบลง"
// ทั้งที่ไม่มีเครื่องมือเลือกช่วงวันเลย · เพิ่ม เลือกช่วงวันเอง + ถังขยะ + ดูรายล็อต
function renderHistTools(V) {
  return (
    <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px')}>
      <div style={s('display:flex;align-items:center;gap:6px')}>
        <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>ตั้งแต่</span>
        <input type="date" value={V.histFrom} onChange={V.onHistFrom} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px 'IBM Plex Sans Thai',sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
        <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e')}>ถึง</span>
        <input type="date" value={V.histTo} onChange={V.onHistTo} style={sx("height:38px;padding:0 9px;border-radius:8px;background:#fff;font:400 12.5px 'IBM Plex Sans Thai',sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.16)') })} />
      </div>

      <div onClick={V.toggleTrash} className="hv-bg-f6 tap" style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: V.histTrash ? '#2f7d5d' : '#f0f1ee', color: V.histTrash ? '#fff' : '#414a44' })}>
        {V.trashLabel}
      </div>

      {V.histLot && (
        <div onClick={V.clearLot} className="tap" style={s('display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>
          Lot {V.histLot} <span style={s('font:400 13px Sarabun,sans-serif')}>✕</span>
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
        <div style={s('font:600 19px Sarabun,sans-serif')}>{V.histTitle || 'ประวัติการบันทึก'}</div>
        <input value={V.histQuery} onChange={V.onHistQuery} placeholder="ค้นด้วยชื่อยา · HN · ชื่อคนบันทึก · เลข Lot" style={s('width:320px;height:42px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif')} />
        <div style={s('display:flex;gap:6px')}>
          {V.ranges.map((g) => (
            <div key={g.key} onClick={g.pick} className="tap" style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>
        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:14px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 17px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>
      </div>

      {renderHistTools(V)}
      </div>

      {/* overflow:hidden ถูกเอาออกเพราะทำให้หัวตารางติดบนไม่ทำงาน
          ใช้มุมโค้งกับเส้นขอบที่แถวแทน */}
      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px')}>
        {/* หัวตาราง — กดเรียงได้ทุกคอลัมน์ · สีเข้มกว่าเดิม
            (เดิมพื้น #f6f7f4 ตัวหนังสือ rgba(.5) จางมากจนแทบมองไม่เห็น) */}
        <div className="sticky-head" style={s("display:flex;padding:11px 16px;background:#e3f0e8;border-bottom:1px solid rgba(47,125,93,.22);border-radius:10px 10px 0 0;font:600 11.5px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.04em")}>
          {V.histCols.map((c) => (
            <span
              key={c.key}
              onClick={c.pick}
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

        {V.histLoading && (
          <div style={s('padding:40px 16px;text-align:center;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดประวัติ</div>
        )}
        {V.histEmpty && (
          <div style={s('padding:40px 16px;text-align:center;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>{V.histEmptyLabel}</div>
        )}

        {V.histRows.map((hr) => (
          <div key={hr.key} style={sx('display:flex;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(30,36,32,.05);font:400 13.5px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { background: hr.bg })}>
            <span style={s('width:110px;color:#6b746e')}>{hr.dateLabel}</span>
            {/* ชื่อยาต้องตัดด้วยจุดไข่ปลา ไม่งั้นชื่อยาว ๆ ดันแถวสูงเป็นสิบบรรทัด
                title = เอาเมาส์ชี้แล้วเห็นชื่อเต็ม */}
            <span title={hr.name} style={s('flex:1;min-width:180px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px')}>{hr.name}</span>
            <span style={s('width:80px;text-align:right')}>{hr.qtyLabel}</span>
            <span style={s('width:92px;text-align:right;color:#6b746e')}>{hr.priceLabel}</span>
            <span style={sx("width:104px;text-align:right;font:600 14.5px 'IBM Plex Sans Thai',sans-serif", { color: hr.color })}>{hr.valueLabel}</span>
            <span style={s('width:90px;display:flex;justify-content:center')}>
              <span style={sx('padding:3px 9px;border-radius:6px;font:600 11px Sarabun,sans-serif;white-space:nowrap', { background: hr.dispBg, color: hr.dispFg })}>{hr.dispLabel}</span>
            </span>
            <span style={s('width:88px;color:#6b746e')}>{hr.sourceLabel}</span>
            <span style={s('width:84px;color:#6b746e')}>{hr.hnLabel}</span>
            <span title={hr.byLabel} style={s('width:104px;color:#6b746e;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px')}>{hr.byLabel}</span>
            <span style={s('width:80px;display:flex;justify-content:flex-end;gap:6px')}>
              {hr.inTrash ? (
                <span onClick={hr.restore} className="hv-bg-e3f tap" style={s('padding:6px 9px;border-radius:7px;background:#e3f0e8;font:500 11.5px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>กู้คืน</span>
              ) : (
                <>
                  <span onClick={hr.edit} className="hv-bg-e6e tap" style={s('padding:6px 9px;border-radius:7px;background:#f0f1ee;font:500 11.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</span>
                  <span onClick={hr.remove} className="hv-bg-fbe tap" style={s('padding:6px 9px;border-radius:7px;background:#fdf1ed;font:500 11.5px Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      {V.histTruncated && (
        <div style={s('text-align:center;padding:14px 0 0')}>
          <div style={s('font:400 12px Sarabun,sans-serif;color:#9aa19c;margin-bottom:8px')}>{V.histTruncLabel}</div>
          <div onClick={V.loadMoreHistory} className="hv-bg-f6 tap" style={s('display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(30,36,32,.16);border-radius:999px;background:#fff;font:600 13px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>{V.loadMoreLabel}</div>
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
            <span style={s("font:700 13px 'IBM Plex Sans Thai',sans-serif;color:#fff;line-height:1")}>฿</span>
          </div>
          <div style={s('font:600 18px Sarabun,sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{V.histTitle || 'ประวัติการบันทึก'}</div>
          <div onClick={V.openAbout} title="เกี่ยวกับ" className="hv-bg-f6" style={s('margin-left:auto;width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:700 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>ℹ</div>
          <div onClick={V.openSettings} title="ตั้งค่า" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>⚙</div>
        </div>
        <input value={V.histQuery} onChange={V.onHistQuery} placeholder="ชื่อยา · HN · ชื่อคนบันทึก · เลข Lot" style={s('width:100%;height:44px;padding:0 13px;border:1px solid rgba(30,36,32,.14);border-radius:10px;background:#f6f7f4;font:400 14.5px Sarabun,sans-serif;margin-bottom:9px')} />
        <div style={s('display:flex;gap:6px;flex-wrap:wrap')}>
          {V.ranges.map((g) => (
            <div key={g.key} onClick={g.pick} className="tap" style={sx('padding:7px 13px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
          <div onClick={V.toggleTrash} className="tap" style={sx('padding:7px 13px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: V.histTrash ? '#2f7d5d' : '#f0f1ee', color: V.histTrash ? '#fff' : '#414a44' })}>{V.trashLabel}</div>
          {V.histLot && (
            <div onClick={V.clearLot} className="tap" style={s('display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>ชุด {V.histLot} ✕</div>
          )}
        </div>
        <div style={s('display:flex;align-items:center;gap:6px;margin-top:9px')}>
          <input type="date" value={V.histFrom} onChange={V.onHistFrom} style={sx("flex:1;min-width:0;height:38px;padding:0 9px;border-radius:8px;background:#f6f7f4;font:400 12.5px 'IBM Plex Sans Thai',sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.14)') })} />
          <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;flex:none')}>ถึง</span>
          <input type="date" value={V.histTo} onChange={V.onHistTo} style={sx("flex:1;min-width:0;height:38px;padding:0 9px;border-radius:8px;background:#f6f7f4;font:400 12.5px 'IBM Plex Sans Thai',sans-serif", { border: '1px solid ' + (V.isCustomRange ? '#2f7d5d' : 'rgba(30,36,32,.14)') })} />
        </div>
      </div>

      <div style={s('padding:14px 20px 20px')}>
        <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;font:400 12px Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 12.5px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>

        {V.histLoading && (
          <div style={s('text-align:center;padding:30px 12px;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดประวัติ</div>
        )}
        {V.histEmpty && (
          <div style={s('text-align:center;padding:30px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>{V.histEmptyLabel}</div>
        )}

        {V.histDays.map((d) => (
          <div key={d.key} style={s('margin-bottom:18px')}>
            <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
              <span style={s('font:600 13.5px Sarabun,sans-serif')}>{d.label}</span>
              <span style={s("font:600 13px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{d.total}</span>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:7px')}>
              {d.items.map((it) => (
                <div key={it.key} style={sx('background:#fff;border-radius:11px;padding:10px 12px', { border: '1px solid ' + it.border })}>
                  <div onClick={it.edit} style={s('min-width:0;cursor:pointer;margin-bottom:7px')}>
                    <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif;overflow-wrap:anywhere')}>{it.name}</div>
                    <div style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{it.detail}</div>
                  </div>
                  <div style={s('display:flex;align-items:center;justify-content:space-between;gap:9px')}>
                    <div style={s('min-width:0')}>
                      <div style={sx("font:600 15px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: it.color })}>{it.valueLabel}</div>
                      <div style={sx('font:400 10.5px Sarabun,sans-serif', { color: it.dispColor })}>{it.dispLabel}</div>
                    </div>
                    <div style={s('display:flex;align-items:center;gap:7px;flex:none')}>
                      {it.inTrash ? (
                        <div onClick={it.restore} className="hv-bg-e3f tap" style={s('padding:7px 11px;border-radius:7px;background:#e3f0e8;font:500 11.5px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>กู้คืน</div>
                      ) : (
                        <>
                          <div onClick={it.edit} className="hv-bg-e6e tap" style={s('padding:7px 11px;border-radius:7px;background:#f0f1ee;font:500 11.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</div>
                          <div onClick={it.remove} className="hv-bg-fbe tap" style={s('padding:7px 11px;border-radius:7px;background:#fdf1ed;font:500 11.5px Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {V.histTruncated && (
          <div style={s('text-align:center;font:400 12px Sarabun,sans-serif;color:#9aa19c;padding:4px 0 8px')}>{V.histTruncLabel}</div>
        )}
      </div>
    </div>
  );
}
