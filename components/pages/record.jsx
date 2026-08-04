// หน้าบันทึก — คัดจากมอคอัป มือถือ (บรรทัด 28–123) คอม (124–220) แถบบันทึกล่างจอมือถือ (541–565)
// ตัดออกตามที่ตกลงไว้: สวิตช์จำลองเน็ตหลุด (ของเดโม) และเลขคงคลังปลอมใต้ชื่อยา
import { s, sx } from '../helpers';

// ── มือถือ ──────────────────────────────────────────────────────────────────
export function renderRecordNarrow(V) {
  return (
    <div style={s('max-width:520px;margin:0 auto;display:flex;flex-direction:column;min-height:100%')}>
      <div style={s('padding:16px 20px 14px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        <div style={s('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px')}>
          <div style={s('display:flex;align-items:center;gap:10px;min-width:0')}>
            <div style={s('width:34px;height:34px;border-radius:9px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;position:relative;flex:none')}>
              <div style={s('position:absolute;inset:5px;border:1.7px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
              <span style={s("font:700 15px 'IBM Plex Sans Thai',sans-serif;color:#fff;line-height:1")}>฿</span>
            </div>
            <div style={s('min-width:0')}>
              <div style={s('font:700 17px/1.2 Sarabun,sans-serif')}>มูลค่ายาคืน</div>
              <div style={s('font:400 11.5px/1.2 Sarabun,sans-serif;color:#6b746e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{V.orgName}</div>
            </div>
          </div>
          <div style={s('display:flex;align-items:center;gap:7px;flex:none')}>
            <div onClick={V.toggleMore} style={s("display:flex;align-items:center;gap:6px;padding:6px 11px;border:1px solid rgba(30,36,32,.14);border-radius:8px;font:500 12.5px 'IBM Plex Sans Thai',sans-serif;cursor:pointer")}>{V.dateLabel} <span style={s('color:#9aa19c')}>▾</span></div>
            <div onClick={V.openSettings} className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>⋯</div>
          </div>
        </div>

        <input ref={V.searchRef} value={V.query} onChange={V.onQuery} onKeyDown={V.onSearchKey} placeholder={V.searchPlaceholder} style={s('width:100%;height:50px;padding:0 14px;border:1px solid rgba(30,36,32,.16);border-radius:12px;background:#f6f7f4;font:400 15.5px Sarabun,sans-serif;color:#1e2420')} />

        {V.hasResults && (
          <div style={s('margin-top:8px;border:1px solid rgba(30,36,32,.10);border-radius:12px;background:#fff;box-shadow:0 10px 26px rgba(30,36,32,.12);overflow:hidden;max-height:264px;overflow-y:auto')}>
            {V.results.map((r) => (
              <div key={r.name} onClick={r.pick} className="hv-bg-eef" style={s('display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(30,36,32,.06);cursor:pointer')}>
                <div style={s('min-width:0')}>
                  <div style={s('font:600 15px/1.3 Sarabun,sans-serif')}>{r.name}</div>
                  <div style={sx('font:400 11.5px/1.3 Sarabun,sans-serif', { color: r.subColor })}>{r.sub}</div>
                </div>
                <div style={sx("font:600 13.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap;flex:none", { color: r.priceColor })}>{r.priceLabel}</div>
              </div>
            ))}
          </div>
        )}

        {V.noResults && (
          <div style={s('margin-top:8px;padding:13px 14px;border:1px dashed rgba(30,36,32,.18);border-radius:12px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>ไม่พบยาชื่อนี้ ลองพิมพ์ชื่อสามัญ เช่น amlo, metf, insu</div>
        )}

        <div style={s('display:flex;gap:7px;margin-top:10px;flex-wrap:wrap')}>
          {V.sources.map((src) => (
            <div key={src.label} onClick={src.pick} style={sx('padding:7px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: src.bg, color: src.fg })}>{src.label}</div>
          ))}
        </div>

        {V.showMore && (
          <div style={s('margin-top:11px;padding-top:11px;border-top:1px solid rgba(30,36,32,.08);display:flex;flex-direction:column;gap:9px')}>
            <div style={s('display:flex;gap:9px')}>
              <div style={s('flex:1')}>
                <div style={s('font:500 11px Sarabun,sans-serif;color:#6b746e;margin-bottom:4px')}>วันที่</div>
                <input type="date" value={V.dateIso} onChange={V.onDate} style={s("width:100%;height:42px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 14px 'IBM Plex Sans Thai',sans-serif")} />
              </div>
              <div style={s('flex:1')}>
                <div style={s('font:500 11px Sarabun,sans-serif;color:#6b746e;margin-bottom:4px')}>HN (ไม่บังคับ)</div>
                <input value={V.hn} onChange={V.onHn} inputMode="numeric" placeholder="ปล่อยว่างได้" style={s("width:100%;height:42px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 14px 'IBM Plex Sans Thai',sans-serif")} />
              </div>
            </div>
          </div>
        )}
      </div>

      {V.hasFrequent && (
        <div style={s('padding:12px 0 0')}>
          <div style={s('display:flex;justify-content:space-between;align-items:baseline;padding:0 20px;margin-bottom:6px')}>
            <span style={s("font:600 11px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>ยาที่คืนบ่อย</span>
            <span style={s('font:400 11px Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>แตะเพื่อใส่จำนวน</span>
          </div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 20px')}>
            {V.frequent.map((f) => (
              <div key={f.base + f.strength} onClick={f.pick} className="hv-bd-green" style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:7px 9px;display:flex;flex-direction:column;justify-content:space-between;height:66px;cursor:pointer;overflow:hidden')}>
                <div>
                  <div style={s('font:600 12px/1.25 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{f.base}</div>
                  <div style={s('font:600 12px/1.25 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{f.strength}</div>
                </div>
                <div style={sx("font:500 10.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: f.priceColor })}>{f.priceLabel}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s('padding:14px 20px 18px;flex:1')}>
        <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px')}>
          <span style={s("font:600 11px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>{V.rowsLabel}</span>
          <span style={s('font:400 11px Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>{V.priceAsOfLabel}</span>
        </div>

        {V.noRows && (
          <div style={s('text-align:center;padding:24px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
            <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มีรายการในครั้งนี้</div>
            <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>ค้นชื่อยาด้านบน หรือแตะยาที่คืนบ่อย</div>
          </div>
        )}

        <div style={s('display:flex;flex-direction:column;gap:7px')}>
          {V.rows.map((row) => (
            <div key={row.rid} style={sx('background:#fff;border-radius:11px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:9px', { border: '1px solid ' + row.border })}>
              <div onClick={row.edit} style={s('min-width:0;flex:1;cursor:pointer')}>
                <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif')}>{row.name}</div>
                <div style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{row.detail}</div>
              </div>
              <div style={s('display:flex;align-items:center;gap:8px;flex:none')}>
                <div style={sx('display:flex;padding:2px;border-radius:7px', { background: row.pillBg })}>
                  <div onClick={row.setReuse} style={sx('padding:3px 7px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.reuseBg, color: row.reuseFg })}>ใช้ต่อ</div>
                  <div onClick={row.setDestroy} style={sx('padding:3px 7px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.destroyBg, color: row.destroyFg })}>ทำลาย</div>
                </div>
                <div style={sx("font:600 15px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;text-align:right;min-width:74px", { color: row.color })}>{row.valueLabel}</div>
                <div onClick={row.remove} className="hv-del" style={s('width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#c0c5c1;cursor:pointer;font:400 13px Sarabun,sans-serif')}>✕</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── คอม ─────────────────────────────────────────────────────────────────────
export function renderRecordWide(V) {
  return (
    <div style={s('max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;gap:22px;align-items:flex-start')}>
      <div style={s('flex:1;min-width:0')}>
        <div style={s('display:flex;gap:10px;align-items:flex-end;margin-bottom:6px')}>
          <div style={s('flex:1;min-width:0;position:relative')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>ยา</div>
            <input ref={V.searchRef} value={V.query} onChange={V.onQuery} onKeyDown={V.onSearchKeyDesktop} placeholder="พิมพ์ชื่อยา แล้วกด Enter" style={sx('width:100%;height:46px;padding:0 13px;border-radius:9px;background:#fff;font:500 15px Sarabun,sans-serif', { border: '1px solid ' + V.searchBorder })} />
            {V.hasResults && (
              <div style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:9;border:1px solid rgba(30,36,32,.10);border-radius:10px;background:#fff;box-shadow:0 12px 30px rgba(30,36,32,.14);overflow:hidden;max-height:290px;overflow-y:auto')}>
                {V.results.map((r) => (
                  <div key={r.name} onClick={r.pickInline} className="hv-bg-eef" style={sx('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(30,36,32,.06);cursor:pointer', { background: r.rowBg })}>
                    <div style={s('min-width:0')}>
                      <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif')}>{r.name}</div>
                      <div style={sx('font:400 11.5px/1.3 Sarabun,sans-serif', { color: r.subColor })}>{r.sub}</div>
                    </div>
                    <div style={sx("font:600 13.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap;flex:none", { color: r.priceColor })}>{r.priceLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s('width:132px')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>จำนวน{V.pendingUnit}</div>
            <input ref={V.qtyRef} value={V.qtyInput} onChange={V.onQtyInput} onKeyDown={V.onQtyKey} inputMode="numeric" placeholder="0" style={s("width:100%;height:46px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:600 16px 'IBM Plex Sans Thai',sans-serif;color:#1e2420")} />
          </div>

          <div style={s('width:176px')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>สถานะ</div>
            <div style={s('height:46px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;display:flex;align-items:center;padding:3px;gap:3px')}>
              <div onClick={V.setPendingReuse} style={sx('flex:1;text-align:center;padding:8px 0;border-radius:7px;cursor:pointer;font:600 12.5px Sarabun,sans-serif', { background: V.pendReuseBg, color: V.pendReuseFg })}>ใช้ต่อได้</div>
              <div onClick={V.setPendingDestroy} style={sx('flex:1;text-align:center;padding:8px 0;border-radius:7px;cursor:pointer;font:600 12.5px Sarabun,sans-serif', { background: V.pendDestroyBg, color: V.pendDestroyFg })}>ทำลาย</div>
            </div>
          </div>

          <div onClick={V.addInline} style={sx('height:46px;padding:0 20px;border-radius:9px;display:flex;align-items:center;font:600 14px Sarabun,sans-serif;cursor:pointer', { background: V.addBg, color: V.addFg })}>เพิ่ม <span style={sx("font:400 11px 'IBM Plex Sans Thai',monospace;margin-left:8px", { color: V.addHintFg })}>⏎</span></div>
        </div>

        <div style={s('font:400 11.5px Sarabun,sans-serif;color:rgba(30,36,32,.45);margin-bottom:16px;min-height:16px')}>{V.desktopHint}</div>

        <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;overflow:hidden')}>
          <div style={s("display:flex;padding:10px 16px;background:#f6f7f4;border-bottom:1px solid rgba(30,36,32,.08);font:600 11px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.5)")}>
            <span style={s('flex:1')}>ยา</span>
            <span style={s('width:104px;text-align:right')}>จำนวน</span>
            <span style={s('width:104px;text-align:right')}>ราคา/หน่วย (฿)</span>
            <span style={s('width:124px;text-align:right')}>มูลค่า (฿)</span>
            <span style={s('width:150px;text-align:right')}>สถานะ</span>
            <span style={s('width:40px')}></span>
          </div>

          {V.noRows && (
            <div style={s('padding:34px 16px;text-align:center')}>
              <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มีรายการในครั้งนี้</div>
              <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>พิมพ์ชื่อยาด้านบน กด Enter ใส่จำนวน แล้ว Enter อีกครั้ง — ไม่ต้องแตะเมาส์</div>
            </div>
          )}

          {V.rows.map((row) => (
            <div key={row.rid} style={sx('display:flex;align-items:center;padding:11px 16px;border-bottom:1px solid rgba(30,36,32,.05);font:400 14px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { background: row.deskBg })}>
              <span style={s('flex:1;font-weight:500;min-width:0')}>{row.name}</span>
              <span style={s('width:104px;text-align:right')}>{row.qtyLabel}</span>
              <span style={s('width:104px;text-align:right;color:#6b746e')}>{row.priceLabel}</span>
              <span style={sx("width:124px;text-align:right;font:600 15px 'IBM Plex Sans Thai',sans-serif", { color: row.color })}>{row.valueLabel}</span>
              <span style={s('width:150px;display:flex;justify-content:flex-end')}>
                <span style={sx('display:flex;padding:2px;border-radius:7px', { background: row.pillBg })}>
                  <span onClick={row.setReuse} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.reuseBg, color: row.reuseFg })}>ใช้ต่อ</span>
                  <span onClick={row.setDestroy} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.destroyBg, color: row.destroyFg })}>ทำลาย</span>
                </span>
              </span>
              <span onClick={row.remove} className="hv-fg-red" style={s('width:40px;text-align:right;color:#c0c5c1;cursor:pointer')}>✕</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s('width:296px;flex:none;background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;gap:16px')}>
        <div>
          <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:6px')}>แหล่งที่มา</div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>
            {V.sources.map((s2) => (
              <div key={s2.label} onClick={s2.pick} style={sx('padding:7px 13px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: s2.bg, color: s2.fg })}>{s2.label}</div>
            ))}
          </div>
        </div>

        <div style={s('display:flex;gap:10px')}>
          <div style={s('flex:1')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>วันที่</div>
            <input type="date" value={V.dateIso} onChange={V.onDate} style={s("width:100%;height:42px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 13.5px 'IBM Plex Sans Thai',sans-serif")} />
          </div>
          <div style={s('flex:1')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>HN</div>
            <input value={V.hn} onChange={V.onHn} inputMode="numeric" placeholder="ไม่บังคับ" style={s("width:100%;height:42px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 13.5px 'IBM Plex Sans Thai',sans-serif")} />
          </div>
        </div>

        <div style={s('border-top:1px solid rgba(30,36,32,.08);padding-top:16px;margin-top:auto')}>
          <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:10px')}>
            <span style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e')}>สะสมปีงบ {V.fyLabel}</span>
            <span style={s("font:600 12.5px 'IBM Plex Sans Thai',sans-serif;color:#414a44;font-variant-numeric:tabular-nums")}>{V.cumulativeLabel}</span>
          </div>
          <div style={s('display:flex;gap:9px;margin-bottom:10px')}>
            <div style={s('flex:1;background:#eef6f1;border-radius:11px;padding:9px 11px')}>
              <div style={s('font:500 11px Sarabun,sans-serif;color:#2f7d5d')}>ประหยัด</div>
              <div style={s("font:700 22px/1.15 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.animSavedLabel}</div>
            </div>
            <div style={s('flex:1;background:#fdf1ed;border-radius:11px;padding:9px 11px')}>
              <div style={s('font:500 11px Sarabun,sans-serif;color:#c2543c')}>สูญเสีย</div>
              <div style={s("font:700 22px/1.15 'IBM Plex Sans Thai',sans-serif;color:#c2543c;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.lostLabel}</div>
            </div>
          </div>
          <div style={s('display:flex;height:8px;border-radius:99px;overflow:hidden;margin-bottom:5px;background:#eef1ee')}>
            <div style={{ width: V.savedBarW, background: '#2f7d5d' }}></div>
            <div style={{ width: V.lostBarW, background: '#c2543c' }}></div>
          </div>
          <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:12px;font-variant-numeric:tabular-nums')}>{V.proportionLabel}</div>

          {V.saveFailed && (
            <div style={s('border:1px solid rgba(194,84,60,.28);background:#fdf1ed;border-radius:11px;padding:11px 12px;margin-bottom:10px')}>
              <div style={s('font:600 13px Sarabun,sans-serif;color:#c2543c;margin-bottom:2px')}>ส่งไม่สำเร็จ — เน็ตหลุด</div>
              <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e')}>ข้อมูล {V.rowCount} รายการยังอยู่ครบในเครื่อง</div>
            </div>
          )}

          <div onClick={V.onSave} style={sx('height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:600 15.5px Sarabun,sans-serif;cursor:pointer', { background: V.saveBg, color: V.saveFg })}>{V.saveLabel}</div>
        </div>
      </div>
    </div>
  );
}

// ── แถบบันทึกล่างจอมือถือ ──────────────────────────────────────────────────
export function renderSaveBar(V) {
  return (
    <div style={s('flex:none;background:#fff;border-top:1px solid rgba(30,36,32,.08);box-shadow:0 -6px 20px rgba(30,36,32,.06);order:1;position:relative;z-index:5')}>
      <div style={s('max-width:520px;margin:0 auto')}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;padding:8px 20px;background:#f6f7f4;border-bottom:1px solid rgba(30,36,32,.06)')}>
          <span style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e')}>สะสมปีงบ {V.fyLabel}</span>
          <span style={s("font:600 13.5px 'IBM Plex Sans Thai',sans-serif;color:#414a44;font-variant-numeric:tabular-nums")}>{V.cumulativeLabel} <span style={s('color:#2f7d5d')}>▲</span></span>
        </div>
        <div style={s('padding:12px 20px 16px')}>
          <div style={s('display:flex;gap:9px;margin-bottom:10px')}>
            <div style={s('flex:1;background:#eef6f1;border-radius:11px;padding:9px 12px')}>
              <div style={s('font:500 11px Sarabun,sans-serif;color:#2f7d5d')}>ประหยัดครั้งนี้</div>
              <div style={s("font:700 25px/1.15 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.animSavedLabel}</div>
            </div>
            <div style={s('flex:1;background:#fdf1ed;border-radius:11px;padding:9px 12px')}>
              <div style={s('font:500 11px Sarabun,sans-serif;color:#c2543c')}>สูญเสีย</div>
              <div style={s("font:700 25px/1.15 'IBM Plex Sans Thai',sans-serif;color:#c2543c;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.lostLabel}</div>
            </div>
          </div>
          <div style={s('display:flex;height:8px;border-radius:99px;overflow:hidden;margin-bottom:5px;background:#eef1ee')}>
            <div style={{ width: V.savedBarW, background: '#2f7d5d' }}></div>
            <div style={{ width: V.lostBarW, background: '#c2543c' }}></div>
          </div>
          <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:10px;font-variant-numeric:tabular-nums')}>{V.proportionLabel}</div>

          {V.saveFailed && (
            <div style={s('border:1px solid rgba(194,84,60,.28);background:#fdf1ed;border-radius:11px;padding:11px 12px;margin-bottom:10px')}>
              <div style={s('font:600 13.5px Sarabun,sans-serif;color:#c2543c;margin-bottom:2px')}>ส่งไม่สำเร็จ — เน็ตหลุด</div>
              <div style={s('font:400 12px/1.5 Sarabun,sans-serif;color:#6b746e')}>ข้อมูล {V.rowCount} รายการยังอยู่ครบในเครื่อง ไม่ได้หายไป กดลองส่งใหม่ได้เลย</div>
            </div>
          )}

          <div onClick={V.onSave} style={sx('height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;font:600 17px Sarabun,sans-serif;cursor:pointer', { background: V.saveBg, color: V.saveFg })}>{V.saveLabel}</div>
        </div>
      </div>
    </div>
  );
}
