// หน้าตั้งราคายา — ไม่มีในมอคอัป (มอคอัปฝังราคาปลอมไว้ในไฟล์)
// ใช้สี ระยะ และความโค้งชุดเดียวกับหน้าบันทึก จะได้ไม่รู้สึกเป็นคนละเว็บ
import { s, sx, kb } from '../helpers';

export function renderPrices(V) {
  return (
    <div style={sx('margin:0 auto;display:flex;flex-direction:column;min-height:100%', { maxWidth: V.pricesWidth })}>
      <div style={s('padding:16px 20px 14px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:12px')}>
          <div {...kb(V.closePrices)} aria-label="กลับไปหน้าก่อน" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>←</div>
          <div style={s('min-width:0;flex:1')}>
            <div style={s('font:700 17px/1.2 Sarabun,sans-serif')}>ตั้งราคายา</div>
            <div style={s('font:400 11.5px/1.2 Sarabun,sans-serif;color:#6b746e')}>ราคาต่อหน่วยที่ใช้คิดมูลค่ายาคืน</div>
          </div>
          <div style={s('text-align:right;flex:none')}>
            <div style={s("font:600 14px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{V.priceProgress}</div>
            <div style={s('font:400 11px Sarabun,sans-serif;color:#6b746e')}>ใส่ราคาแล้ว</div>
          </div>
        </div>

        <div style={s('display:flex;height:6px;border-radius:99px;overflow:hidden;margin-bottom:12px;background:#eef1ee')}>
          <div style={{ width: V.priceProgressW, background: '#2f7d5d' }}></div>
        </div>

        {/* นำเข้าราคาทีเดียวจากไฟล์ HIS — เร็วกว่าพิมพ์ทีละตัว 417 รอบมาก
            แต่ยังต้องตรวจทานก่อนบันทึกเสมอ เพราะชื่อยาสองฝั่งเขียนคนละแบบ */}
        <div {...kb(V.openHisImport)} className="hv-teal tap" style={s('display:flex;align-items:center;justify-content:center;gap:8px;height:44px;border-radius:12px;background:#2f7d5d;color:#fff;font:600 14px Sarabun,sans-serif;cursor:pointer;margin-bottom:10px;box-shadow:0 2px 8px -2px rgba(47,125,93,.55)')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
            <path d="M12 20.5v-11" /><path d="M7.2 13.8 12 9l4.8 4.8" /><path d="M4.5 4.5h15" />
          </svg>
          นำเข้าราคาจาก HIS
        </div>

        <input value={V.priceQuery} onChange={V.onPriceQuery} placeholder="ค้นชื่อยา" style={s('width:100%;height:46px;padding:0 14px;border:1px solid rgba(30,36,32,.16);border-radius:12px;background:#f6f7f4;font:400 15px Sarabun,sans-serif;color:#1e2420')} />

        <div style={s('display:flex;gap:6px;margin-top:10px;flex-wrap:wrap')}>
          {V.priceFilters.map((f) => (
            <div key={f.key} {...kb(f.pick)} style={sx('padding:7px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: f.bg, color: f.fg })}>{f.label}</div>
          ))}
        </div>
      </div>

      <div style={s('padding:14px 20px 18px;flex:1')}>
        <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px')}>
          <span style={s("font:600 11px Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>{V.priceCountLabel}</span>
          <span style={s('font:400 11px Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>ปล่อยช่องหน่วยว่างไว้ = ใช้หน่วยเริ่มต้น</span>
        </div>

        {V.priceLoading && (
          <div style={s('text-align:center;padding:40px 12px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดรายการยา</div>
        )}

        {V.priceEmpty && (
          <div style={s('text-align:center;padding:24px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
            <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ไม่พบยาตามที่ค้น</div>
            <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>ลองพิมพ์ชื่อสามัญ เช่น amlo, metf, insu</div>
          </div>
        )}

        <div style={s('display:flex;flex-direction:column;gap:7px')}>
          {V.priceRows.map((p) => (
            <div key={p.id} style={sx('background:#fff;border-radius:11px;padding:10px 12px', { border: '1px solid ' + p.border })}>
              <div style={s('display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap')}>
                <div style={s('min-width:150px;flex:1')}>
                  <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif')}>
                    {p.name}
                    {/* ตัวย่อในวงเล็บสีม่วง — ให้ตรงกับผลค้นหาหน้าบันทึก */}
                    {p.hasAbbrev && <span style={s("font-weight:600;color:#6d3b9e;font-family:var(--font-plex),Sarabun,sans-serif;margin-left:5px;white-space:nowrap")}>({p.abbrev})</span>}
                    {/* ความเข้มข้น % ในวงเล็บสีส้มอำพัน ให้เหมือนผลค้นหาหน้าบันทึก */}
                    {p.hasPercent && <span style={s("font-weight:700;color:#96650f;font-family:var(--font-plex),Sarabun,sans-serif;margin-left:5px;white-space:nowrap")}>{p.percentLabel}</span>}
                    {/* รูปแบบการออกฤทธิ์ (ER/IR/SR) แดงอมชมพู เอียง หนา — ให้ตรงกับผลค้นหาหน้าบันทึก */}
                    {p.hasRelease && <span style={s("font-weight:700;font-style:italic;color:#b02a5b;font-family:var(--font-plex),Sarabun,sans-serif;margin-left:5px;white-space:nowrap")}>{p.releaseLabel}</span>}
                    {/* ชื่อการค้าในวงเล็บสีเทล เฉพาะยาที่มี (แบบเดียวกับ ME-DRP) */}
                    {p.hasBrand && <span style={s('color:#2f7d5d;margin-left:6px;white-space:nowrap')}>({p.brand})</span>}
                  </div>
                  <div style={sx('font:400 11.5px/1.3 Sarabun,sans-serif', { color: p.subColor })}>{p.sub}{p.warnLabel}</div>
                  {/* ที่มาของราคา — บอกว่าไปหยิบมาจากบรรทัดไหนในไฟล์ HIS
                      สำคัญมาก เพราะเภสัชกรต้องดูออกว่าจับคู่ถูกตัวหรือเปล่า */}
                  {p.note && (
                    <div style={s('font:400 11px/1.4 Sarabun,sans-serif;color:#6f7873;margin-top:2px;overflow-wrap:anywhere')}>{p.note}</div>
                  )}
                </div>
                <div style={s('display:flex;align-items:center;gap:7px;flex:none')}>
                  <input value={p.priceValue} onChange={p.onPrice} inputMode="decimal" placeholder="0.00" style={s("width:96px;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:600 15px Sarabun,sans-serif;font-variant-numeric:tabular-nums;text-align:right;color:#1e2420")} />
                  <span style={s("font:500 13px Sarabun,sans-serif;color:#6b746e;flex:none")}>฿ /</span>
                  <input value={p.unitValue} onChange={p.onUnit} placeholder={p.unitPlaceholder} style={s('width:82px;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 14px Sarabun,sans-serif;color:#1e2420')} />
                </div>
              </div>

              {/* ราคาที่ระบบเสนอ — กดปุ่มแล้วเติมลงช่องราคาให้เลย ไม่ต้องพิมพ์เอง
                  ยังไม่บันทึกจนกว่าจะกดปุ่มบันทึกที่แถบล่างจอ */}
              {p.suggests.length > 0 && (
                <div style={s('margin-top:9px;padding-top:9px;border-top:1px dashed rgba(30,36,32,.12)')}>
                  <div style={s("font:600 10.5px Sarabun,sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.45);margin-bottom:6px")}>เลือกราคาที่ถูกต้อง</div>
                  <div style={s('display:flex;flex-direction:column;gap:5px')}>
                    {p.suggests.map((sg) => (
                      <div key={sg.key} {...kb(sg.pick)} className="tap" style={sx('display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;cursor:pointer', {
                        background: sg.on ? '#e3f0e8' : '#f6f7f4',
                        border: '1px solid ' + (sg.on ? 'rgba(47,125,93,.36)' : 'transparent')
                      })}>
                        <span style={sx('width:14px;height:14px;border-radius:50%;flex:none', {
                          border: '1.6px solid ' + (sg.on ? '#2f7d5d' : 'rgba(30,36,32,.3)'),
                          background: sg.on ? '#2f7d5d' : '#fff'
                        })}></span>
                        <span style={s('flex:1;min-width:0;font:400 12px/1.4 Sarabun,sans-serif;overflow-wrap:anywhere')}>{sg.name}</span>
                        <span style={s("flex:none;font:600 12.5px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{sg.priceLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {V.priceHasMore && (
          <div {...kb(V.morePrices)} className="hv-bg-f6" style={s('margin-top:10px;height:44px;border-radius:11px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 13.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>{V.priceMoreLabel}</div>
        )}
      </div>
    </div>
  );
}

// แถบบันทึกล่างจอ โผล่เฉพาะตอนมีของที่แก้ค้างอยู่
export function renderPriceBar(V) {
  if (!V.priceBarOpen) return null;
  return (
    <div style={s('flex:none;background:#fff;border-top:1px solid rgba(30,36,32,.08);box-shadow:0 -6px 20px rgba(30,36,32,.06);order:1;position:relative;z-index:5')}>
      <div style={sx('margin:0 auto;padding:12px 20px max(16px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:10px', { maxWidth: V.pricesWidth })}>
        <div {...kb(V.resetPriceEdits)} className="hv-bg-f6" style={s('height:50px;padding:0 18px;border-radius:12px;border:1px solid rgba(30,36,32,.16);display:flex;align-items:center;justify-content:center;font:600 14px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none')}>ยกเลิก</div>
        <div {...kb(V.savePrices)} style={sx('flex:1;height:50px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;cursor:pointer', { background: V.priceSaveBg })}>{V.priceSaveLabel}</div>
      </div>
    </div>
  );
}
