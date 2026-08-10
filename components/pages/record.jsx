// หน้าบันทึก — คัดจากมอคอัป มือถือ (บรรทัด 28–123) คอม (124–220) แถบบันทึกล่างจอมือถือ (541–565)
// ตัดออกตามที่ตกลงไว้: สวิตช์จำลองเน็ตหลุด (ของเดโม) และเลขคงคลังปลอมใต้ชื่อยา
import { s, sx } from '../helpers';
import { renderRecorderField } from './recorder';

// ── หนึ่งบรรทัดในรายการผลค้นยา ───────────────────────────────────────────────
// ต่างจากมอคอัปที่โชว์ชื่อยาเป็นพืดเดียวกับ "หน่วย · คงคลัง 1234" (เลขมั่วของเดโม)
// พี่กันขอให้อ่านง่ายขึ้น เลยจัดใหม่เป็น
//   บรรทัดบน  = ชื่อยาตัวหนาเข้ม (ไฮไลต์คำที่พิมพ์ค้นด้วยพื้นเขียวอ่อน)
//                + ความแรงตัวเบากว่าต่อท้าย → ตาแยกชื่อกับขนาดออกทันที
//   บรรทัดล่าง = หน่วยนับ · ป้ายเตือนถ้ายังไม่ใส่ราคา (ทำเป็นป้ายเล็ก ไม่ใช่ตัวหนังสือแดงลอย)
//   ฝั่งขวา    = ราคา ตัวเลขใหญ่ + "ต่อ เม็ด" ตัวเล็กใต้ลงมา
function renderDrugOption(r, big) {
  const nameSize = big ? '15.5px' : '14.5px';
  return (
    <div key={r.name} onClick={big ? r.pick : r.pickInline} className="hv-bg-eef"
      style={sx('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(30,36,32,.06);cursor:pointer', { background: r.rowBg })}>

      <div style={s('min-width:0;flex:1')}>
        {/* 🚨 ห้ามใช้ white-space:nowrap + ellipsis ตรงนี้ (พี่กันแจ้ง 10 ส.ค. 2569)
            ยาชื่อยาวอย่าง "Gramicidin + Neomycin sulfate + Polymyxin b sulfate"
            ทำให้ความแรงโดนตัด และชื่อการค้าหายทั้งอัน — ทั้งที่ค้นด้วยชื่อการค้าอยู่แท้ ๆ
            ความแรงเป็นข้อมูลความปลอดภัย (25 กับ 5000 mcg คนละเรื่อง) ซ่อนไม่ได้
            ยอมให้แถวสูงขึ้นเฉพาะยาชื่อยาว ดีกว่าซ่อนของสำคัญ */}
        <div style={sx('font-family:var(--font-sarabun),Sarabun,sans-serif;line-height:1.35;overflow-wrap:anywhere', { fontSize: nameSize })}>
          <span style={s('font-weight:600;color:#1e2420')}>{r.mkBefore}</span>
          <span style={s('font-weight:700;color:#2f7d5d;background:#dcefe4;border-radius:3px;padding:0 1px')}>{r.mkHit}</span>
          <span style={s('font-weight:600;color:#1e2420')}>{r.mkAfter}</span>
          {r.strength && (
            <span style={s("font-weight:500;color:#6b746e;font-family:var(--font-plex),'IBM Plex Sans Thai',sans-serif;margin-left:6px")}>{r.strength}</span>
          )}
          {/* ความเข้มข้น % ในวงเล็บ สีส้มอำพัน — พี่กันขอให้เห็นง่าย
              เลือกสีนี้เพราะไม่ชนกับเทล (ชื่อการค้า) และไม่ชนกับแดง (ทำลาย) */}
          {r.hasPercent && (
            <span style={s("font-weight:700;color:#96650f;font-family:var(--font-plex),'IBM Plex Sans Thai',sans-serif;margin-left:5px")}>{r.percentLabel}</span>
          )}
          {/* รูปแบบยา (tab · cap · injection) — ลำดับเดียวกับ ME-DRP คือก่อนชื่อการค้า
              บอกได้ตั้งแต่ตอนค้นว่าเป็นยากินหรือยาฉีด */}
          {r.form && (
            <span style={s('font-weight:600;color:#414a44;margin-left:6px')}>{r.form}</span>
          )}
          {/* ชื่อการค้าในวงเล็บ สีเทลตัวหนา — แสดงเฉพาะยาที่มี (37 ตัวจาก 417)
              ทำตามแบบ ME-DRP ที่พี่กันชี้ให้ดู · ไฮไลต์คำค้นข้างในด้วยเพราะค้นจากชื่อการค้าได้ */}
          {r.hasBrand && (
            <span style={s('font-weight:600;color:#2f7d5d;margin-left:6px')}>
              ({r.bdBefore}<span style={s('background:#dcefe4;border-radius:3px;padding:0 1px')}>{r.bdHit}</span>{r.bdAfter})
            </span>
          )}
        </div>
        <div style={s('display:flex;align-items:center;gap:6px;margin-top:2px')}>
          {/* ทางให้ยา (IV · oral) นำหน้าหน่วยนับ ตำแหน่งเดียวกับ ME-DRP
              เข้มกว่าหน่วยนับนิดหนึ่ง เพราะเป็นข้อมูลของตัวยา ส่วนหน่วยนับเป็นเรื่องการนับ */}
          {r.route && (
            <>
              <span style={s('font:500 11.5px/1.3 Sarabun,sans-serif;color:#6b746e')}>{r.route}</span>
              <span style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#cfd4d0')}>·</span>
            </>
          )}
          <span style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#9aa19c')}>{r.unitLabel}</span>
          {r.noPrice && (
            <span style={s('font:600 10px Sarabun,sans-serif;color:#c2543c;background:#fbe4dd;border-radius:4px;padding:1px 6px;flex:none')}>ยังไม่ใส่ราคา</span>
          )}
        </div>
      </div>

      <div style={s('text-align:right;flex:none')}>
        <div style={sx("font:600 14px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap", { color: r.priceColor })}>{r.priceLabel}</div>
        {r.priceSub && <div style={s('font:400 10.5px Sarabun,sans-serif;color:#9aa19c;white-space:nowrap')}>{r.priceSub}</div>}
      </div>
    </div>
  );
}

// ── มือถือ ──────────────────────────────────────────────────────────────────
export function renderRecordNarrow(V) {
  return (
    <div style={s('width:100%;max-width:520px;margin:0 auto;display:flex;flex-direction:column;min-height:100%;flex:1 0 auto')}>
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
            {/* ปุ่มเกี่ยวกับ แยกออกมาเป็นปุ่มของตัวเองข้างเฟือง — พี่กันสั่ง
                เดิมซ่อนอยู่ในหน้าตั้งค่า ต้องเลื่อนลงไปหา ไม่มีใครเจอ */}
            <div onClick={V.openAbout} title="เกี่ยวกับ" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:700 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>ℹ</div>
            <div onClick={V.openSettings} title="ตั้งค่า" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>⚙</div>
          </div>
        </div>

        {/* ปุ่ม ✕ ล้างช่องค้นหาทีเดียว — พี่กันขอ ไม่ต้องกด Backspace รัว */}
        <div style={s('position:relative')}>
          <input ref={V.searchRef} value={V.query} onChange={V.onQuery} onKeyDown={V.onSearchKey} placeholder={V.searchPlaceholder} style={s('width:100%;height:50px;padding:0 46px 0 14px;border:1px solid rgba(30,36,32,.16);border-radius:12px;background:#f6f7f4;font:400 15.5px Sarabun,sans-serif;color:#1e2420')} />
          {V.hasQuery && (
            <div onClick={V.clearQuery} className="hv-bg-e6e" style={s('position:absolute;right:9px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;background:rgba(30,36,32,.06)')}>✕</div>
          )}
        </div>

        {V.hasResults && (
          <div style={s('margin-top:8px;border:1px solid rgba(30,36,32,.10);border-radius:12px;background:#fff;box-shadow:0 10px 26px rgba(30,36,32,.12);overflow:hidden;max-height:264px;overflow-y:auto')}>
            {V.results.map((r) => renderDrugOption(r, true))}
          </div>
        )}

        {V.noResults && (
          <div style={s('margin-top:8px;padding:13px 14px;border:1px dashed rgba(30,36,32,.18);border-radius:12px;text-align:center')}>
            <div style={s('font:400 13px Sarabun,sans-serif;color:#6b746e;margin-bottom:9px')}>ไม่พบยาชื่อนี้ ลองพิมพ์ชื่อสามัญ เช่น amlo, metf, insu</div>
            <div onClick={V.openOffListDrug} className="tap" style={s('display:inline-flex;align-items:center;padding:9px 16px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>ยาอื่น — พิมพ์ชื่อเอง</div>
          </div>
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
            {/* ผู้บันทึกล็อต — ต่อจากวันที่/HN ตามที่พี่กันสั่ง */}
            {renderRecorderField(V)}
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
            {/* ถ้ายังไม่ได้ตั้งยาที่คืนบ่อย อย่าบอกให้ไปแตะสิ่งที่ไม่มีอยู่บนจอ */}
            <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e')}>{V.emptyHint}</div>
          </div>
        )}

        {/* ต่างจากมอคอัปโดยจำเป็น: มอคอัปวางชื่อยากับปุ่มไว้บรรทัดเดียวกัน
            ซึ่งทำงานได้ที่จอ 430px กับชื่อยาสั้น ๆ ของเดโมเท่านั้น
            ของจริงที่ 360px คอลัมน์ชื่อเหลือ 83px "Amoxicillin + Clavulanic acid 875 + 125 mg"
            แตกเป็น 4 บรรทัด และถ้ามูลค่าหลักล้านจะล้นไปทับปุ่มใช้ต่อ/ทำลาย
            → แยกชื่อยาขึ้นบรรทัดบนเต็มความกว้าง ปุ่มกับตัวเลขลงบรรทัดล่าง */}
        <div style={s('display:flex;flex-direction:column;gap:7px')}>
          {V.rows.map((row) => (
            <div key={row.rid} style={sx('background:#fff;border-radius:11px;padding:10px 12px', { border: '1px solid ' + row.border })}>
              <div onClick={row.edit} style={s('min-width:0;cursor:pointer;margin-bottom:7px')}>
                <div style={s('font:600 14.5px/1.3 Sarabun,sans-serif;overflow-wrap:anywhere')}>{row.name}</div>
                <div style={s('font:400 11.5px/1.3 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{row.detail}</div>
              </div>
              <div style={s('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                <div style={sx('display:flex;padding:2px;border-radius:7px;flex:none', { background: row.pillBg })}>
                  <div onClick={row.setReuse} className="tap" style={sx('padding:5px 10px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.reuseBg, color: row.reuseFg })}>ใช้ต่อ</div>
                  <div onClick={row.setDestroy} className="tap" style={sx('padding:5px 10px;border-radius:5px;cursor:pointer;font:600 11px Sarabun,sans-serif', { background: row.destroyBg, color: row.destroyFg })}>ทำลาย</div>
                </div>
                <div style={s('display:flex;align-items:center;gap:8px;min-width:0')}>
                  <div style={sx("font:600 15px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;text-align:right", { color: row.color })}>{row.valueLabel}</div>
                  <div onClick={row.remove} className="hv-del tap" style={s('width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#c0c5c1;cursor:pointer;font:400 14px Sarabun,sans-serif;flex:none')}>✕</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── คอม ─────────────────────────────────────────────────────────────────────
// 🚨 width:100% ห้ามลบ — กล่องครอบใน shell เป็น flex คอลัมน์
// ใน flex ตัว margin:0 auto จะยกเลิกการยืดเต็มความกว้าง แล้วย่อลงเท่าเนื้อหา (เคยหดไป 347px)
// align-items:stretch = ให้คอลัมน์ซ้ายกับแผงขวาสูงเท่ากัน กรอบขาวจะได้ไม่ลอยค้างครึ่งจอ
export function renderRecordWide(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;gap:22px;align-items:stretch;flex:1;min-height:440px')}>
      <div style={s('flex:1;min-width:0;min-height:0;display:flex;flex-direction:column')}>
        <div style={s('flex:none;display:flex;gap:10px;align-items:flex-end;margin-bottom:6px')}>
          <div style={s('flex:1;min-width:0;position:relative')}>
            <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>ยา</div>
            <input ref={V.searchRef} value={V.query} onChange={V.onQuery} onKeyDown={V.onSearchKeyDesktop} placeholder="พิมพ์ชื่อยา แล้วกด Enter" style={sx('width:100%;height:46px;padding:0 44px 0 13px;border-radius:9px;background:#fff;font:500 15px Sarabun,sans-serif', { border: '1px solid ' + V.searchBorder })} />
            {/* ปุ่ม ✕ ล้างช่องค้นหาทีเดียว — พี่กันขอ ไม่ต้องกด Backspace รัว */}
            {V.hasQuery && (
              <div onClick={V.clearQuery} className="hv-bg-e6e" style={s('position:absolute;right:8px;top:calc(50% + 9px);transform:translateY(-50%);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:400 14px Sarabun,sans-serif;color:#6b746e;cursor:pointer;background:rgba(30,36,32,.06);z-index:10')}>✕</div>
            )}
            {/* หน้าคอมเดิมไม่มีกล่อง "ไม่พบยา" (มอคอัปก็ไม่มี) พิมพ์ผิดแล้วเงียบสนิท
                เภสัชกรไม่รู้ว่าพิมพ์ผิดหรือระบบค้าง — ฝั่งมือถือมีอยู่แล้ว เอามาใส่ให้เหมือนกัน */}
            {V.noResults && (
              <div style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:9;border:1px dashed rgba(30,36,32,.18);border-radius:10px;background:#fff;padding:14px;text-align:center')}>
                <div style={s('font:400 13px Sarabun,sans-serif;color:#6b746e;margin-bottom:9px')}>{V.noResultsHint}</div>
                <div onClick={V.openOffListDrug} className="tap" style={s('display:inline-flex;align-items:center;padding:9px 16px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>ยาอื่น — พิมพ์ชื่อเอง</div>
              </div>
            )}
            {V.hasResults && (
              <div style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:9;border:1px solid rgba(30,36,32,.10);border-radius:10px;background:#fff;box-shadow:0 12px 30px rgba(30,36,32,.14);overflow:hidden;max-height:290px;overflow-y:auto')}>
                {V.results.map((r) => renderDrugOption(r, false))}
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

        <div style={s('flex:none;font:400 11.5px Sarabun,sans-serif;color:rgba(30,36,32,.45);margin-bottom:16px;min-height:16px')}>{V.desktopHint}</div>

        {/* แถบยาที่คืนบ่อยฝั่งคอม — มอคอัปมีเฉพาะฝั่งมือถือ (บรรทัด 76–92) พี่กันขอให้มีบนคอมด้วย
            ใช้การ์ดหน้าตาเดียวกับมือถือทุกอย่าง ต่างแค่เรียง 6 ช่องแนวนอนแทนตาราง 3 คอลัมน์ */}
        {V.hasFrequent && (
          <div style={s('flex:none;margin-bottom:16px')}>
            <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px')}>
              <span style={s("font:600 11px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>ยาที่คืนบ่อย</span>
              <span style={s('font:400 11px Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>กดเพื่อใส่จำนวน</span>
            </div>
            <div style={s('display:grid;grid-template-columns:repeat(6,1fr);gap:6px')}>
              {V.frequent.map((f) => (
                <div key={f.base + f.strength} onClick={f.pickWide} className="hv-bd-green" style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:7px 9px;display:flex;flex-direction:column;justify-content:space-between;height:66px;cursor:pointer;overflow:hidden')}>
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

        {/* flex:1 = กรอบขาวยืดเต็มความสูงที่เหลือ ไม่ลอยค้างครึ่งจอ (พี่กันทัก)
            min-height:0 = ยอมให้หดต่ำกว่าเนื้อในได้ ไม่งั้นแถวเยอะแล้วกรอบดันทั้งหน้ายาวออกไป
            แทนที่จะเลื่อนอยู่ข้างในกรอบ */}
        <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;overflow:hidden;flex:1;min-height:0;display:flex;flex-direction:column')}>
          {/* หัวตาราง — กดเรียงได้ + สีเข้ม ชุดเดียวกับหน้าประวัติ (พี่กันสั่งให้เหมือนกัน) */}
          <div style={s("flex:none;display:flex;padding:11px 16px;background:#e3f0e8;border-bottom:1px solid rgba(47,125,93,.22);font:600 11.5px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.04em")}>
            {V.rowCols.map((c) => (
              <span
                key={c.key}
                onClick={c.pick}
                className="hv-bg-e3f"
                style={sx('display:flex;align-items:center;gap:4px;cursor:pointer;user-select:none;border-radius:5px;margin:-3px 0;padding:3px 0', Object.assign(
                  { color: c.fg },
                  c.flex ? { flex: 1 } : { width: c.w },
                  c.align === 'right' ? { justifyContent: 'flex-end' } : {}
                ))}
              >
                {c.label}
                <span style={sx('font-size:9px;flex:none', { color: c.arrowColor })}>{c.arrow}</span>
              </span>
            ))}
            <span style={s('width:40px')}></span>
          </div>

          {/* 🎯 จุดเดียวในหน้าบันทึกแบบคอมที่เลื่อนได้ (พี่กันสั่ง)
              ช่องกรอกยา · ยาที่คืนบ่อย · หัวตาราง · แผงขวา ถูกตรึงหมด ไม่ขยับตามการเลื่อน */}
          <div style={s('flex:1;min-height:0;overflow-y:auto')}>
          {V.noRows && (
            <div style={s('min-height:100%;padding:34px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center')}>
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
      </div>

      {/* แผงขวาถูกตรึงเช่นกัน — overflow-y:auto ไว้เผื่อจอเตี้ยมากจนของในแผงล้น
          ให้เลื่อนอยู่ในแผงเอง ไม่ไปดันทั้งหน้าให้ยาว */}
      {/* ระยะห่างถูกรีดลงจาก 18/20 gap16 → 14/16 gap11 เพื่อให้กล่อง "ล็อตนี้" มีที่ยืน
          วัดแล้วก่อนหน้านี้แผงกิน 502px ในพื้นที่ 503px = แน่นเป๊ะไม่มีที่เหลือเลย
          จอ 1366x768 ของพี่กันเหลือพื้นที่จริงราว 640px ยิ่งต้องประหยัดทุกพิกเซล */}
      <div style={s('width:296px;flex:none;min-height:0;overflow-y:auto;background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:11px')}>
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

        {/* ผู้บันทึกล็อต — ต่อจากวันที่/HN ตามที่พี่กันสั่ง */}
        <div>{renderRecorderField(V)}</div>

        {/* ── กล่อง "ล็อตนี้" — เดิมตรงนี้เป็นช่องว่างเปล่า ๆ (พี่กันเลือกแบบ ก) ──
            เป็นจุดสุดท้ายก่อนข้อมูลเข้าฐาน ราคาถูกแช่แข็งทันทีที่กดบันทึก แก้ทีหลังยาก
            ให้ทวนได้ว่ากำลังจะส่งอะไร กี่ตัว ใช้ต่อกี่ ทำลายกี่ ก่อนกดปุ่ม */}
        {/* 🚨 ต้องเป็น flex:1 1 auto ไม่ใช่ flex:1
            flex:1 ย่อมาจาก 1 1 0% = ฐานความสูงเป็นศูนย์ การคำนวณการหดจะได้ศูนย์ตาม
            กล่องเลยไม่ยอมหดเลยแม้ใส่ min-height:0 แล้วไปดันปุ่มบันทึกตกขอบแผง
            ใช้ฐาน auto (เท่าเนื้อหา) แทน จะโตตอนที่ว่างเหลือ และหดตอนที่ว่างไม่พอ */}
        <div style={s('flex:1 1 auto;background:#f6f7f4;border-radius:9px;padding:11px 12px;display:flex;flex-direction:column')}>
          <div style={s("font:600 10.5px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.45);margin-bottom:6px")}>Lot นี้</div>

          {/* 🚨 ห้ามใส่ overflow-y:auto + min-height:0 ตรงนี้ (พี่กันเจอบั๊กที่จอ 768)
              เคยใส่ไว้ให้กล่องยุบได้ตอนที่ว่างไม่พอ ผลคือกล่องยุบจนเหลือ 23px
              แล้วซ่อนบรรทัดแยกหน่วยนับไว้ข้างใน กลายเป็นกล่องเล็ก ๆ ที่มีแถบเลื่อนจิ๋ว
              = อ่านไม่ได้ ดูเหมือนเว็บพัง ทั้งที่แผงยังมีที่ว่างเหลือ
              ปล่อยให้กล่องสูงเท่าเนื้อหาเสมอ ถ้าที่ไม่พอค่อยให้ "ทั้งแผง" เลื่อนแทน
              ซึ่งปลอดภัยแล้วเพราะปุ่มบันทึกถูกตรึงไว้ก้นแผง */}
          <div>
          {V.noRows ? (
            <div style={s('min-height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:400 11.5px/1.6 Sarabun,sans-serif;color:#9aa19c;padding:6px 4px')}>
              ยังไม่มียาใน Lot นี้<br />เพิ่มยาจากช่องด้านซ้าย
            </div>
          ) : (
            /* จัด 2 คอลัมน์ ใช้ความสูงครึ่งเดียวของแบบเรียงลงมา 4 บรรทัด
               จำเป็นเพราะจอ 1366x768 เหลือพื้นที่แนวตั้งน้อยมาก */
            <div>
              <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:5px 10px;font-variant-numeric:tabular-nums')}>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px Sarabun,sans-serif')}>
                  <span style={s('color:#6b746e')}>รายการ</span><span style={s('font-weight:500')}>{V.lotItemsLabel}</span>
                </div>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px Sarabun,sans-serif')}>
                  <span style={s('color:#2f7d5d')}>ใช้ต่อ</span><span style={s('font-weight:500;color:#2f7d5d')}>{V.lotReuseLabel}</span>
                </div>
                <div></div>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px Sarabun,sans-serif')}>
                  <span style={s('color:#c2543c')}>ทำลาย</span><span style={s('font-weight:500;color:#c2543c')}>{V.lotDestroyLabel}</span>
                </div>
              </div>
              {/* แยกจำนวนตามหน่วยนับจริง ไม่รวมข้ามหน่วยแล้วเขียนว่า "หน่วย" ลอย ๆ
                  วางเต็มความกว้างเพราะยาวกว่าครึ่งคอลัมน์ */}
              <div style={s('margin-top:5px;font:400 11px/1.5 Sarabun,sans-serif;color:#414a44;font-variant-numeric:tabular-nums;overflow-wrap:anywhere')}>{V.lotUnitsLabel}</div>
            </div>
          )}
          </div>

          {/* เลขล็อตออกโดยฐานข้อมูลตอนกดบันทึก เดาล่วงหน้าไม่ได้ (เครื่องอื่นอาจแทรกก่อน)
              จึงโชว์เลขจริงเฉพาะหลังบันทึกสำเร็จ ระหว่างกรอกบอกตรง ๆ ว่ายังไม่มีเลข */}
          <div style={s('flex:none;border-top:1px dashed rgba(30,36,32,.14);margin-top:7px;padding-top:7px;display:flex;justify-content:space-between;gap:6px;font:400 11px Sarabun,sans-serif')}>
            <span style={s('color:#6b746e;flex:none')}>เลข Lot</span>
            <span style={sx('text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', V.lotNoIsReal
              ? { font: "600 11.5px var(--font-plex),'IBM Plex Sans Thai',sans-serif", color: '#2f7d5d' }
              : { color: '#9aa19c' })}>{V.lotNoLabel}</span>
          </div>
        </div>

        {/* 🚨 ตรึงก้อนสรุป+ปุ่มบันทึกไว้ก้นแผง ไม่ว่าจอจะเตี้ยแค่ไหนก็ต้องเห็นปุ่มเสมอ
            เคยเจอ: จอ 640px + แถบเตือนโหมดตัวอย่าง = ปุ่มบันทึกตกขอบแผง ต้องเลื่อนหา
            margin ลบ + padding เท่ากัน = แผ่ทับระยะขอบของแผง ไม่งั้นเห็นเนื้อหาลอดตรงร่อง
            bottom:-14px หักลบ padding ล่างของแผง ให้ก้อนนี้ติดก้นแผงพอดี */}
        <div style={s('flex:none;position:sticky;bottom:-14px;z-index:2;background:#fff;border-top:1px solid rgba(30,36,32,.08);margin:0 -16px -14px;padding:11px 16px 14px')}>
          <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:8px')}>
            <span style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e')}>สะสมปีงบ {V.fyLabel}</span>
            <span style={s("font:600 12.5px 'IBM Plex Sans Thai',sans-serif;color:#414a44;font-variant-numeric:tabular-nums")}>{V.cumulativeLabel}</span>
          </div>
          <div style={s('display:flex;gap:8px;margin-bottom:8px')}>
            <div style={s('flex:1;background:#eef6f1;border-radius:10px;padding:7px 10px')}>
              <div style={s('font:500 10.5px Sarabun,sans-serif;color:#2f7d5d')}>ประหยัด</div>
              <div style={s("font:700 20px/1.15 'IBM Plex Sans Thai',sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.animSavedLabel}</div>
            </div>
            <div style={s('flex:1;background:#fdf1ed;border-radius:10px;padding:7px 10px')}>
              <div style={s('font:500 10.5px Sarabun,sans-serif;color:#c2543c')}>สูญเสีย</div>
              <div style={s("font:700 20px/1.15 'IBM Plex Sans Thai',sans-serif;color:#c2543c;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.lostLabel}</div>
            </div>
          </div>
          <div style={s('display:flex;height:7px;border-radius:99px;overflow:hidden;margin-bottom:4px;background:#eef1ee')}>
            <div style={{ width: V.savedBarW, background: '#2f7d5d' }}></div>
            <div style={{ width: V.lostBarW, background: '#c2543c' }}></div>
          </div>
          <div style={s('font:400 11px/1.4 Sarabun,sans-serif;color:#6b746e;margin-bottom:9px;font-variant-numeric:tabular-nums')}>{V.proportionLabel}</div>

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
