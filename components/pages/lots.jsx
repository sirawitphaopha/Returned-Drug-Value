// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
// ใช้ภาษาภาพชุดเดียวกับหน้าประวัติ (สี ระยะ ความโค้ง) จะได้ไม่รู้สึกเป็นคนละเว็บ
import { s, sx, kb } from '../helpers';

export function renderLots(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;flex-direction:column;min-height:100%')}>
      <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px')}>
        <div {...kb(V.closeLots)} className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>←</div>
        <div style={s('min-width:0')}>
          <div style={s('font:700 19px/1.2 Sarabun,sans-serif')}>รายการ Lot</div>
          <div style={s('font:400 12px/1.3 Sarabun,sans-serif;color:#6b746e')}>หนึ่งรอบกดบันทึก = หนึ่ง Lot · กดที่ Lot เพื่อดูรายการยาข้างใน</div>
        </div>
        <div style={s('margin-left:auto;display:flex;gap:6px;flex-wrap:wrap')}>
          {V.lotsRanges.map((r) => (
            <div key={r.key} {...kb(r.pick)} style={sx('padding:7px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: r.bg, color: r.fg })}>{r.label}</div>
          ))}
        </div>
      </div>

      <div style={s('font:600 11px \'IBM Plex Sans Thai\',sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45);margin-bottom:8px')}>{V.lotsCountLabel}</div>

      {V.lotsLoading && (
        <div style={s('text-align:center;padding:40px 12px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดรายการ Lot</div>
      )}

      {V.lotsEmpty && (
        <div style={s('text-align:center;padding:34px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
          <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มี Lot ในช่วงเวลานี้</div>
          <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>ลองเปลี่ยนช่วงเวลาด้านบน หรือบันทึกยาคืนสักรอบก่อน</div>
        </div>
      )}

      <div style={s('display:flex;flex-direction:column;gap:8px')}>
        {V.lotRows.map((l) => (
          <div key={l.key} style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:13px 15px;display:flex;align-items:center;gap:14px;flex-wrap:wrap')}>
            <div style={s('min-width:150px')}>
              <div style={s("font:700 15px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d")}>{l.lot}</div>
              <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>{l.dateLabel} · {l.by}</div>
            </div>

            <div style={s('font:500 12.5px Sarabun,sans-serif;color:#414a44;flex:none')}>{l.itemsLabel}</div>

            <div style={s('display:flex;align-items:baseline;gap:10px;margin-left:auto;flex-wrap:wrap')}>
              <div style={s('text-align:right')}>
                <div style={s("font:600 15px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{l.savedLabel}</div>
                <div style={s('font:400 10.5px Sarabun,sans-serif;color:#9aa19c')}>ใช้ต่อได้</div>
              </div>
              {l.hasLost && (
                <div style={s('text-align:right')}>
                  <div style={s("font:600 13px 'IBM Plex Sans Thai',sans-serif;color:#c2543c;font-variant-numeric:tabular-nums")}>{l.lostLabel}</div>
                  <div style={s('font:400 10.5px Sarabun,sans-serif;color:#9aa19c')}>ทำลาย</div>
                </div>
              )}
            </div>

            <div style={s('display:flex;gap:7px;flex:none')}>
              <div {...kb(l.openHistory)} className="hv-bg-f6" style={s('height:36px;padding:0 13px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;font:600 12.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ดูรายการ</div>
              <div {...kb(l.openSlip)} className="hv-teal tap" style={s('height:36px;padding:0 14px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:6px;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
                </svg>
                ใบสรุป
              </div>
            </div>
          </div>
        ))}
      </div>

      {V.lotsHasMore && (
        <div {...kb(V.moreLots)} className="hv-bg-f6" style={s('margin-top:10px;height:44px;border-radius:11px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 13.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>{V.lotsMoreLabel}</div>
      )}
    </div>
  );
}

// ── ใบสรุป Lot ──────────────────────────────────────────────────────────────
// 🚨 ตอนสั่งพิมพ์ ทุกอย่างนอกใบนี้ถูกซ่อนด้วย @media print ใน globals.css
//    (คลาส .slip-sheet กับ .slip-hide) ไม่งั้นได้เมนูกับปุ่มติดไปเต็มกระดาษ
export function renderLotSlip(V) {
  if (!V.slipOpen) return null;
  return (
    <div className="slip-backdrop" style={s('position:fixed;inset:0;z-index:60;background:rgba(30,36,32,.45);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto')}>
      <div className="slip-sheet" style={s('width:100%;max-width:720px;background:#fff;border-radius:14px;overflow:hidden')}>

        <div className="slip-hide" style={s('display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid rgba(30,36,32,.1);background:#f6f7f4')}>
          <div style={s('font:700 15px Sarabun,sans-serif;flex:1;min-width:0')}>ใบสรุป Lot</div>
          <div {...kb(V.printLotSlip)} className="hv-teal tap" style={s('height:38px;padding:0 16px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;cursor:pointer')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
            </svg>
            พิมพ์
          </div>
          <div {...kb(V.closeLotSlip)} className="hv-bg-f6" style={s('width:36px;height:36px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>✕</div>
        </div>

        <div style={s('padding:22px 26px 26px')}>
          <div style={s('display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:12px;border-bottom:2px solid #2f7d5d')}>
            <div>
              <div style={s('font:700 18px Sarabun,sans-serif')}>ใบสรุปยาคืน</div>
              <div style={s('font:400 12px Sarabun,sans-serif;color:#6b746e;margin-top:2px')}>{V.slipOrg}</div>
            </div>
            <div style={s('text-align:right')}>
              <div style={s("font:700 17px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d")}>{V.slipLot}</div>
              <div style={s('font:400 12px Sarabun,sans-serif;color:#6b746e;margin-top:2px')}>{V.slipDate}</div>
            </div>
          </div>

          <div style={s('display:flex;gap:22px;flex-wrap:wrap;padding:10px 0 12px;font:400 12px Sarabun,sans-serif;color:#414a44')}>
            <span>ผู้บันทึก: <b>{V.slipBy}</b></span>
            <span>จำนวน: <b>{V.slipCountLabel}</b></span>
          </div>

          {V.slipLoading && (
            <div style={s('text-align:center;padding:30px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดรายการยา</div>
          )}

          {!V.slipLoading && (
            <table style={s('width:100%;border-collapse:collapse;font:400 12.5px Sarabun,sans-serif')}>
              <thead>
                <tr>
                  <th style={s('text-align:left;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:28px')}>#</th>
                  <th style={s('text-align:left;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600')}>รายการยา</th>
                  <th style={s('text-align:left;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:80px')}>HN</th>
                  <th style={s('text-align:right;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:92px')}>จำนวน</th>
                  <th style={s('text-align:right;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:80px')}>ราคา/หน่วย</th>
                  <th style={s('text-align:right;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:88px')}>มูลค่า</th>
                  <th style={s('text-align:right;padding:7px 6px;border-bottom:1px solid rgba(30,36,32,.18);font-weight:600;width:60px')}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {V.slipRows.map((r) => (
                  <tr key={r.key}>
                    <td style={s('padding:6px;border-bottom:1px solid rgba(30,36,32,.07);color:#9aa19c')}>{r.no}</td>
                    <td style={s('padding:6px;border-bottom:1px solid rgba(30,36,32,.07);overflow-wrap:anywhere')}>{r.name}</td>
                    <td style={s('padding:6px;border-bottom:1px solid rgba(30,36,32,.07);color:#6b746e')}>{r.hn}</td>
                    <td style={s("padding:6px;border-bottom:1px solid rgba(30,36,32,.07);text-align:right;font-family:var(--font-plex),'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums")}>{r.qtyLabel}</td>
                    <td style={s("padding:6px;border-bottom:1px solid rgba(30,36,32,.07);text-align:right;font-family:var(--font-plex),'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;color:#6b746e")}>{r.priceLabel}</td>
                    <td style={s("padding:6px;border-bottom:1px solid rgba(30,36,32,.07);text-align:right;font-family:var(--font-plex),'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;font-weight:600")}>{r.valueLabel}</td>
                    <td style={sx('padding:6px;border-bottom:1px solid rgba(30,36,32,.07);text-align:right;font-weight:600', { color: r.dispColor })}>{r.dispLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={s('display:flex;justify-content:flex-end;gap:26px;padding-top:12px;margin-top:4px;border-top:2px solid #2f7d5d;font:400 12.5px Sarabun,sans-serif')}>
            <div style={s('text-align:right')}>
              <div style={s('color:#6b746e')}>ใช้ต่อได้</div>
              <div style={s("font:700 15px 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d")}>{V.slipSavedLabel}</div>
            </div>
            {V.slipHasLost && (
              <div style={s('text-align:right')}>
                <div style={s('color:#6b746e')}>ทำลาย</div>
                <div style={s("font:700 15px 'IBM Plex Sans Thai',sans-serif;color:#c2543c")}>{V.slipLostLabel}</div>
              </div>
            )}
            <div style={s('text-align:right')}>
              <div style={s('color:#6b746e')}>รวมทั้งหมด</div>
              <div style={s("font:700 15px 'IBM Plex Sans Thai',sans-serif")}>{V.slipTotalLabel}</div>
            </div>
          </div>

          {/* ช่องลงชื่อ — ใบนี้ใช้เป็นหลักฐานในแฟ้มได้ ต้องมีที่ให้เซ็นรับ */}
          <div style={s('display:flex;gap:40px;margin-top:34px;font:400 12px Sarabun,sans-serif;color:#6b746e')}>
            <div style={s('flex:1')}>
              <div style={s('border-bottom:1px dotted rgba(30,36,32,.4);height:26px')}></div>
              <div style={s('margin-top:5px;text-align:center')}>ผู้บันทึก</div>
            </div>
            <div style={s('flex:1')}>
              <div style={s('border-bottom:1px dotted rgba(30,36,32,.4);height:26px')}></div>
              <div style={s('margin-top:5px;text-align:center')}>ผู้ตรวจรับ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
