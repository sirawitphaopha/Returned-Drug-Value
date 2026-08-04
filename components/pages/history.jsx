// หน้าประวัติการบันทึก — คัดจากมอคอัป (คอม 224–265 · มือถือ 267–313)
// เพิ่มจากต้นฉบับอย่างเดียวคือข้อความ "กำลังโหลด" เพราะของจริงต้องรอเซิร์ฟเวอร์
import { s, sx } from '../helpers';

export function renderHistoryWide(V) {
  return (
    <div style={s('max-width:1400px;margin:0 auto;padding:20px 26px 26px')}>
      <div style={s('display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px')}>
        <div style={s('font:600 19px Sarabun,sans-serif')}>ประวัติการบันทึก</div>
        <input value={V.histQuery} onChange={V.onHistQuery} placeholder="ค้นด้วยชื่อยา หรือ HN" style={s('width:280px;height:42px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif')} />
        <div style={s('display:flex;gap:6px')}>
          {V.ranges.map((g) => (
            <div key={g.key} onClick={g.pick} style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
        </div>
        <div style={s('margin-left:auto;display:flex;align-items:baseline;gap:14px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>
          <span>{V.histCountLabel}</span>
          <span style={s("font:600 17px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.histTotalLabel}</span>
        </div>
      </div>

      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;overflow:hidden')}>
        <div style={s("display:flex;padding:10px 16px;background:#f6f7f4;border-bottom:1px solid rgba(30,36,32,.08);font:600 11px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.5)")}>
          <span style={s('width:116px')}>วันที่</span>
          <span style={s('flex:1')}>ยา</span>
          <span style={s('width:96px;text-align:right')}>จำนวน</span>
          <span style={s('width:104px;text-align:right')}>ราคา/หน่วย (฿)</span>
          <span style={s('width:120px;text-align:right')}>มูลค่า (฿)</span>
          <span style={s('width:96px;text-align:center')}>สถานะ</span>
          <span style={s('width:96px')}>แหล่งที่มา</span>
          <span style={s('width:92px')}>HN</span>
          <span style={s('width:92px')}></span>
        </div>

        {V.histLoading && (
          <div style={s('padding:40px 16px;text-align:center;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดประวัติ</div>
        )}
        {V.histEmpty && (
          <div style={s('padding:40px 16px;text-align:center;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>ไม่พบรายการตามเงื่อนไขนี้</div>
        )}

        {V.histRows.map((hr) => (
          <div key={hr.key} style={sx('display:flex;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(30,36,32,.05);font:400 13.5px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { background: hr.bg })}>
            <span style={s('width:116px;color:#6b746e')}>{hr.dateLabel}</span>
            <span style={s('flex:1;font-weight:500;min-width:0')}>{hr.name}</span>
            <span style={s('width:96px;text-align:right')}>{hr.qtyLabel}</span>
            <span style={s('width:104px;text-align:right;color:#6b746e')}>{hr.priceLabel}</span>
            <span style={sx("width:120px;text-align:right;font:600 14.5px 'IBM Plex Sans Thai',sans-serif", { color: hr.color })}>{hr.valueLabel}</span>
            <span style={s('width:96px;display:flex;justify-content:center')}>
              <span style={sx('padding:3px 9px;border-radius:6px;font:600 11px Sarabun,sans-serif', { background: hr.dispBg, color: hr.dispFg })}>{hr.dispLabel}</span>
            </span>
            <span style={s('width:96px;color:#6b746e')}>{hr.sourceLabel}</span>
            <span style={s('width:92px;color:#6b746e')}>{hr.hnLabel}</span>
            <span style={s('width:92px;display:flex;justify-content:flex-end;gap:6px')}>
              <span onClick={hr.edit} className="hv-bg-e6e" style={s('padding:5px 10px;border-radius:7px;background:#f0f1ee;font:500 11.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</span>
              <span onClick={hr.remove} className="hv-bg-fbe" style={s('padding:5px 10px;border-radius:7px;background:#fdf1ed;font:500 11.5px Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</span>
            </span>
          </div>
        ))}
      </div>

      {V.histTruncated && (
        <div style={s('text-align:center;font:400 12px Sarabun,sans-serif;color:#9aa19c;padding:12px 0 0')}>{V.histTruncLabel}</div>
      )}
    </div>
  );
}

export function renderHistoryNarrow(V) {
  return (
    <div style={s('max-width:520px;margin:0 auto;min-height:100%')}>
      <div style={s('padding:16px 20px 14px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:10px')}>
          <div style={s('width:30px;height:30px;border-radius:8px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;position:relative;flex:none')}>
            <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
            <span style={s("font:700 13px 'IBM Plex Sans Thai',sans-serif;color:#fff;line-height:1")}>฿</span>
          </div>
          <div style={s('font:600 18px Sarabun,sans-serif')}>ประวัติการบันทึก</div>
          <div onClick={V.openSettings} className="hv-bg-f6" style={s('margin-left:auto;width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>⋯</div>
        </div>
        <input value={V.histQuery} onChange={V.onHistQuery} placeholder="ชื่อยา หรือ HN" style={s('width:100%;height:44px;padding:0 13px;border:1px solid rgba(30,36,32,.14);border-radius:10px;background:#f6f7f4;font:400 14.5px Sarabun,sans-serif;margin-bottom:9px')} />
        <div style={s('display:flex;gap:6px;flex-wrap:wrap')}>
          {V.ranges.map((g) => (
            <div key={g.key} onClick={g.pick} style={sx('padding:7px 13px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: g.bg, color: g.fg })}>{g.label}</div>
          ))}
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
          <div style={s('text-align:center;padding:30px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>ไม่พบรายการตามเงื่อนไขนี้</div>
        )}

        {V.histDays.map((d) => (
          <div key={d.key} style={s('margin-bottom:18px')}>
            <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px')}>
              <span style={s('font:600 13.5px Sarabun,sans-serif')}>{d.label}</span>
              <span style={s("font:600 13px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{d.total}</span>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:7px')}>
              {d.items.map((it) => (
                <div key={it.key} style={sx('background:#fff;border-radius:11px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px', { border: '1px solid ' + it.border })}>
                  <div onClick={it.edit} style={s('min-width:0;flex:1;cursor:pointer')}>
                    <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif')}>{it.name}</div>
                    <div style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{it.detail}</div>
                  </div>
                  <div style={s('display:flex;align-items:center;gap:9px;flex:none')}>
                    <div style={s('text-align:right')}>
                      <div style={sx("font:600 15px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: it.color })}>{it.valueLabel}</div>
                      <div style={sx('font:400 10.5px Sarabun,sans-serif', { color: it.dispColor })}>{it.dispLabel}</div>
                    </div>
                    <div onClick={it.edit} className="hv-bg-e6e" style={s('padding:5px 9px;border-radius:7px;background:#f0f1ee;font:500 11.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>แก้</div>
                    <div onClick={it.remove} className="hv-bg-fbe" style={s('padding:5px 9px;border-radius:7px;background:#fdf1ed;font:500 11.5px Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>ลบ</div>
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
