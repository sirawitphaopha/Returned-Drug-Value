// หน้าสรุปภาพรวม — คัดจากมอคอัป (คอม 317–386 · มือถือ 388–473)
// ต่างจากต้นฉบับอย่างเดียวคือข้อความบนปุ่มส่งออกเปลี่ยนเป็น "กำลังสร้างไฟล์" ตอนกำลังทำงาน
// เพราะของจริงต้องรอเซิร์ฟเวอร์ส่งรายการทั้งปีงบกลับมาก่อน
import { s, sx, kb } from '../helpers';
import { renderDrugName } from './drugname';
import { renderExportBtn } from './exportbtn';

// แถบบอกสถานะบนสุดของหน้าสรุป — ไม่มีในมอคอัป (มอคอัปมีข้อมูลอยู่ในเครื่องเลยไม่ต้องรอ)
// ของจริงต้องรอเซิร์ฟเวอร์ ถ้าไม่บอกอะไรเลย ผู้ใช้จะเห็น 0.00 กราฟว่าง
// แล้วแยกไม่ออกว่า "ยังไม่มีข้อมูล" หรือ "เน็ตช้ายังโหลดไม่เสร็จ"
function renderSumBanner(V) {
  if (V.sumLoading) {
    return (
      <div style={sx('display:flex;align-items:center;gap:9px;border-radius:11px;padding:11px 14px;margin-bottom:14px;font:500 13px Sarabun,sans-serif', { background: V.sumPanel, border: '1px solid ' + V.sumBorder, color: V.sumMuted })}>
        <span style={s('width:15px;height:15px;border-radius:50%;border:2px solid rgba(47,125,93,.25);border-top-color:#2f7d5d;animation:mrspin .7s linear infinite;flex:none')}></span>
        {V.sumLoadingLabel}
      </div>
    );
  }
  return (
    <>
      {V.sumEmpty && (
        <div style={sx('border-radius:11px;padding:14px;margin-bottom:14px;text-align:center;font:500 13px Sarabun,sans-serif', { border: '1px dashed ' + V.sumBorder, color: V.sumMuted })}>{V.sumEmptyLabel}</div>
      )}
      {V.zeroPriced > 0 && (
        <div style={s('border-radius:11px;padding:11px 14px;margin-bottom:14px;background:#fdf3e7;border:1px solid rgba(214,138,42,.28);font:500 12.5px/1.5 Sarabun,sans-serif;color:#8a5a12')}>{V.zeroPricedLabel}</div>
      )}
    </>
  );
}

// ปุ่มเลือกปีงบ + การ์ดยาที่ถูกคืนบ่อยที่สุด — ทั้งคู่ไม่มีในมอคอัป
function renderFyPicks(V) {
  if (V.fyPicks.length < 2) return null;
  return (
    <div style={s('display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
      <span style={sx('font:500 11.5px Sarabun,sans-serif', { color: V.sumMuted })}>ปีงบ</span>
      {V.fyPicks.map((y) => (
        <div key={y.key} {...kb(y.pick)} className="tap" style={sx('padding:6px 13px;border-radius:999px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: y.on ? '#2f7d5d' : V.sumTrack, color: y.on ? '#fff' : V.sumMuted })}>{y.label}</div>
      ))}
    </div>
  );
}

function renderTopReturned(V) {
  if (!V.hasTopReturned) return null;
  return (
    <div style={sx('border-radius:12px;padding:15px 16px;margin-top:14px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
      <div style={s('font:600 13.5px Sarabun,sans-serif;margin-bottom:2px')}>ยาที่ถูกคืนบ่อยที่สุด</div>
      <div style={sx('font:400 11px/1.5 Sarabun,sans-serif;margin-bottom:12px', { color: V.sumMuted, opacity: .8 })}>{V.topReturnedHint}</div>
      <div style={s('display:flex;flex-direction:column;gap:9px')}>
        {V.topReturned.map((t) => (
          <div key={t.key}>
            <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:4px')}>
              <span style={s('min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}><span style={s('font:500 12.5px Sarabun,sans-serif')}>{t.rank}. </span>{renderDrugName(t.parts, { size: '12.5px' })}</span>
              <span style={sx("font:600 12.5px 'IBM Plex Sans Thai',sans-serif;flex:none;font-variant-numeric:tabular-nums", { color: V.sumMuted })}>{t.timesLabel}</span>
            </div>
            <div style={sx('height:7px;border-radius:99px;overflow:hidden', { background: V.sumTrack })}>
              <div style={sx('height:100%;border-radius:99px;background:#2f7d5d', { width: t.w })}></div>
            </div>
            <div style={sx('font:400 10.5px Sarabun,sans-serif;margin-top:3px;font-variant-numeric:tabular-nums', { color: V.sumMuted })}>{t.qtyLabel} · {t.valueLabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderSummaryWide(V) {
  return (
    <div style={sx('width:100%;flex:1 0 auto;display:flex;flex-direction:column', { background: V.sumBg, color: V.sumFg })}>
      {/* 🚨 width:100% ห้ามลบ — เหตุผลเดียวกับหน้าบันทึก · ระยะขอบ 26px ให้เท่าอีก 2 หน้า */}
      <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:18px 26px 26px;flex:1 0 auto')}>
        {renderSumBanner(V)}
        <div style={s('margin-bottom:14px')}>{renderFyPicks(V)}</div>
        <div style={s('display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:20px')}>
          <div style={s('display:flex;align-items:center;gap:10px')}>
            <div style={sx('width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;position:relative;flex:none', { background: V.sumGreen })}>
              <div style={s('position:absolute;inset:4px;border:1.7px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
              <span style={sx("font:700 14px 'IBM Plex Sans Thai',sans-serif;line-height:1", { color: V.sumMarkFg })}>฿</span>
            </div>
            <div style={s('font:600 17px Sarabun,sans-serif')}>มูลค่ายาคืน · ปีงบประมาณ {V.fyLabel}</div>
          </div>
          <div style={s('display:flex;align-items:center;gap:10px')}>
            {renderExportBtn(V.exportCsv, V.exportLabel, {})}
            <div style={sx('display:flex;padding:3px;border-radius:10px;gap:3px', { background: V.togTrack })}>
              <div {...kb(V.setLight)} style={sx('display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:8px;cursor:pointer', { background: V.togLightBg })}>
                <span style={s('width:12px;height:12px;border-radius:50%;background:#fff;border:1px solid rgba(30,36,32,.28)')}></span>
                <span style={sx('font:600 13.5px Sarabun,sans-serif', { color: V.togLightFg })}>สว่าง</span>
              </div>
              <div {...kb(V.setDark)} style={sx('display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:8px;cursor:pointer', { background: V.togDarkBg })}>
                <span style={s('width:12px;height:12px;border-radius:50%;background:#151a17;border:1px solid rgba(255,255,255,.3)')}></span>
                <span style={sx('font:600 13.5px Sarabun,sans-serif', { color: V.togDarkFg })}>เข้ม</span>
              </div>
            </div>
            <div {...kb(V.openAbout)} title="เกี่ยวกับ" style={sx('width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font:700 16px Sarabun,sans-serif;cursor:pointer;flex:none', { border: '1px solid ' + V.sumBorder, color: V.sumMuted })}>ℹ</div>
            <div {...kb(V.openSettings)} title="ตั้งค่า" style={sx('width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font:600 17px Sarabun,sans-serif;cursor:pointer;flex:none', { border: '1px solid ' + V.sumBorder, color: V.sumMuted })}>⚙</div>
          </div>
        </div>

        <div style={s('display:flex;flex-wrap:wrap;gap:26px;align-items:flex-start;margin-bottom:26px')}>
          <div style={s('flex:1 1 420px;min-width:0')}>
            <div style={sx('font:500 clamp(14px,1.4vw,19px) Sarabun,sans-serif;margin-bottom:2px', { color: V.sumMuted })}>มูลค่ายาที่ประหยัดได้สะสม</div>
            <div style={sx("font:700 clamp(44px,9.4vw,132px)/1 'IBM Plex Sans Thai',sans-serif;letter-spacing:-.045em;font-variant-numeric:tabular-nums;word-break:break-all", { color: V.sumGreen })}>{V.fySavedBig}</div>
            <div style={s('font:500 clamp(15px,1.9vw,25px) Sarabun,sans-serif;margin-top:4px')}>฿ <span style={sx('font:400 clamp(12px,1.4vw,19px) Sarabun,sans-serif', { color: V.sumMuted })}>· {V.fyRangeLabel}</span></div>
          </div>
          <div style={s('flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:13px')}>
            <div>
              <div style={sx('font:500 14px Sarabun,sans-serif', { color: V.sumMuted })}>มูลค่าที่สูญเสีย (ทำลาย)</div>
              <div style={sx("font:700 clamp(26px,3.4vw,42px)/1.1 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.03em", { color: V.sumRed })}>{V.fyLostLabel}</div>
            </div>
            <div style={sx('display:flex;height:10px;border-radius:99px;overflow:hidden', { background: V.sumTrack })}>
              <div style={sx('', { width: V.fySavedPct, background: V.sumGreen })}></div>
              <div style={sx('background:#c2543c', { width: V.fyLostPct })}></div>
            </div>
            <div style={sx('font:400 14px/1.6 Sarabun,sans-serif', { color: V.sumMuted })}>ยาที่คืนมา <strong style={sx('font-weight:600;font-variant-numeric:tabular-nums', { color: V.sumFg })}>{V.fyGrossLabel}</strong> · ใช้ต่อได้ {V.fyReusePct}</div>
            <div style={sx('font:400 14px Sarabun,sans-serif;padding-top:12px', { color: V.sumMuted, borderTop: '1px solid ' + V.sumBorder })}><strong style={sx('font-weight:600;font-variant-numeric:tabular-nums', { color: V.sumFg })}>{V.fyCount}</strong> รายการ · <strong style={sx('font-weight:600;font-variant-numeric:tabular-nums', { color: V.sumFg })}>{V.fyDrugCount}</strong> รายการยา</div>
          </div>
        </div>

        <div style={s('display:flex;flex-wrap:wrap;gap:20px')}>
          <div style={sx('flex:1 1 460px;min-width:0;border-radius:12px;padding:16px 20px 12px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
            <div style={sx('font:600 14.5px Sarabun,sans-serif;margin-bottom:14px', { color: V.sumFg })}>มูลค่าประหยัดรายเดือน (฿)</div>
            <div style={s('display:flex;align-items:flex-end;gap:6px;height:190px')}>
              {V.months.map((m) => (
                <div key={m.key} style={s('flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:5px;min-width:0')}>
                  <div style={sx("font:600 10.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: m.labelColor })}>{m.short}</div>
                  <div style={sx('width:100%;border-radius:4px 4px 0 0;min-height:3px', { height: m.h, background: m.bg })}></div>
                  <div style={sx('font:500 12px Sarabun,sans-serif', { color: m.nameColor })}>{m.name}</div>
                </div>
              ))}
            </div>

            {/* ── สัดส่วนตามแหล่งที่มา แบบโดนัท ──────────────────────────────
                ย้ายมาจากกล่องขวา (พี่กันเลือกแบบ ค) เดิมกล่องซ้ายเหลือที่ว่างใต้กราฟเยอะ
                ส่วนกล่องขวายาวเกิน · ย้ายมาแล้วสองกล่องสูงพอ ๆ กัน ไม่ต้องหาข้อมูลใหม่ */}
            <div style={sx('margin-top:16px;padding-top:14px', { borderTop: '1px solid ' + V.sumBorder })}>
              <div style={sx('font:500 12.5px Sarabun,sans-serif;margin-bottom:2px', { color: V.sumMuted })}>สัดส่วนตามแหล่งที่มา</div>
              <div style={sx('font:400 11px Sarabun,sans-serif;margin-bottom:12px', { color: V.sumMuted, opacity: .75 })}>{V.srcBaseLabel}</div>

              <div style={s('display:flex;align-items:center;gap:18px;flex-wrap:wrap')}>
                {/* รัศมี 15.9 = เส้นรอบวง ~100 พอดี ใส่เปอร์เซ็นต์ลง dasharray ได้ตรง ๆ
                    transform หมุน -90 องศา ให้ชิ้นแรกเริ่มที่ 12 นาฬิกา */}
                <svg width="118" height="118" viewBox="0 0 42 42" style={{ flex: 'none' }}>
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke={V.sumTrack} strokeWidth="6"></circle>
                  {!V.srcEmpty && V.srcShares.map((sh) => (
                    <circle key={sh.key} cx="21" cy="21" r="15.9" fill="none"
                      stroke={sh.bg} strokeWidth="6"
                      strokeDasharray={sh.dash} strokeDashoffset={sh.dashOffset}></circle>
                  ))}
                </svg>

                <div style={s('flex:1;min-width:150px;display:grid;grid-template-columns:1fr 1fr;gap:8px 12px')}>
                  {V.srcShares.map((sh) => (
                    <span key={sh.key} style={sx('display:flex;align-items:center;gap:6px;font:400 12.5px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { color: V.sumMuted })}>
                      <span style={sx('width:9px;height:9px;border-radius:3px;flex:none', { background: sh.bg })}></span>
                      {sh.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* กล่องนี้สูงเท่ากล่องซ้ายอยู่แล้ว (flex ยืดให้เท่ากันเอง)
              แต่เนื้อหาไม่เต็ม เลยเหลือช่องว่างขาว ๆ ก้นกล่อง (พี่กันทัก)
              แก้ด้วยการให้ 10 อันดับกระจายเต็มความสูงแทนการกำหนดระยะห่างตายตัว
              → ปรับตามจอทุกขนาดเอง ไม่ต้องมานั่งจูนตัวเลขทีละความสูง */}
          <div style={sx('flex:1 1 340px;min-width:0;border-radius:12px;padding:16px 20px;display:flex;flex-direction:column', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
            <div style={s('flex:none;font:600 14.5px Sarabun,sans-serif;margin-bottom:14px')}>ยาที่คืนมูลค่าสูงสุด 10 อันดับ (฿)</div>
            {/* gap = ระยะห่างขั้นต่ำ · space-between เอาที่ว่างที่เหลือมาแบ่งเพิ่มให้เท่า ๆ กัน */}
            <div style={s('flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:9px')}>
              {V.topDrugs.map((t) => (
                <div key={t.key}>
                  <div style={s('display:flex;justify-content:space-between;gap:12px;font:400 13.5px Sarabun,sans-serif;margin-bottom:3px')}>
                    <span style={s('overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{renderDrugName(t.parts)}</span>
                    <span style={s('font-weight:600;font-variant-numeric:tabular-nums;flex:none')}>{t.value}</span>
                  </div>
                  <div style={sx('height:6px;border-radius:99px', { background: V.sumTrack })}>
                    <div style={sx('height:6px;border-radius:99px', { width: t.w, background: t.bg })}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {renderTopReturned(V)}
      </div>
    </div>
  );
}

export function renderSummaryNarrow(V) {
  return (
    <div style={sx('width:100%;min-height:100%;flex:1 0 auto', { background: V.sumBg, color: V.sumFg })}>
      <div style={s('width:100%;max-width:520px;margin:0 auto;padding:14px 20px 24px')}>
        {renderSumBanner(V)}
        <div style={s('margin-bottom:14px')}>{renderFyPicks(V)}</div>

        <div style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px')}>
          <div style={s('display:flex;align-items:center;gap:9px;min-width:0')}>
            <div style={sx('width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;flex:none', { background: V.sumGreen })}>
              <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
              <span style={sx("font:700 13px 'IBM Plex Sans Thai',sans-serif;line-height:1", { color: V.sumMarkFg })}>฿</span>
            </div>
            <div style={s('min-width:0')}>
              <div style={s('font:700 15px/1.2 Sarabun,sans-serif')}>มูลค่ายาคืน</div>
              <div style={sx('font:400 11px/1.2 Sarabun,sans-serif', { color: V.sumMuted })}>ปีงบประมาณ {V.fyLabel}</div>
            </div>
          </div>
          <div style={sx('display:flex;padding:2px;border-radius:9px;gap:2px;flex:none', { background: V.togTrack })}>
            <div {...kb(V.setLight)} style={sx('padding:6px 10px;border-radius:7px;cursor:pointer;display:flex;align-items:center;gap:5px', { background: V.togLightBg })}>
              <span style={s('width:11px;height:11px;border-radius:50%;background:#fff;border:1px solid rgba(30,36,32,.28)')}></span>
              <span style={sx('font:600 12px Sarabun,sans-serif', { color: V.togLightFg })}>สว่าง</span>
            </div>
            <div {...kb(V.setDark)} style={sx('padding:6px 10px;border-radius:7px;cursor:pointer;display:flex;align-items:center;gap:5px', { background: V.togDarkBg })}>
              <span style={s('width:11px;height:11px;border-radius:50%;background:#151a17;border:1px solid rgba(255,255,255,.3)')}></span>
              <span style={sx('font:600 12px Sarabun,sans-serif', { color: V.togDarkFg })}>เข้ม</span>
            </div>
          </div>
          <div {...kb(V.openAbout)} title="เกี่ยวกับ" style={sx('width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 14px Sarabun,sans-serif;cursor:pointer;flex:none', { border: '1px solid ' + V.sumBorder, color: V.sumMuted })}>ℹ</div>
          <div {...kb(V.openSettings)} title="ตั้งค่า" style={sx('width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:600 15px Sarabun,sans-serif;cursor:pointer;flex:none', { border: '1px solid ' + V.sumBorder, color: V.sumMuted })}>⚙</div>
        </div>

        <div style={sx('border-radius:14px;padding:16px 17px 15px;margin-bottom:10px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
          <div style={sx('font:500 12.5px Sarabun,sans-serif;margin-bottom:3px', { color: V.sumMuted })}>มูลค่ายาที่ประหยัดได้สะสม</div>
          <div style={sx("font:700 clamp(34px,10.6vw,50px)/1.02 'IBM Plex Sans Thai',sans-serif;letter-spacing:-.04em;font-variant-numeric:tabular-nums;word-break:break-all", { color: V.sumGreen })}>{V.fySavedBig}</div>
          <div style={s('font:500 15px Sarabun,sans-serif;margin-top:3px')}>฿ <span style={sx('font:400 12px Sarabun,sans-serif', { color: V.sumMuted })}>· {V.fyRangeLabel}</span></div>
          <div style={sx('display:flex;height:9px;border-radius:99px;overflow:hidden;margin:13px 0 7px', { background: V.sumTrack })}>
            <div style={sx('', { width: V.fySavedPct, background: V.sumGreen })}></div>
            <div style={sx('background:#c2543c', { width: V.fyLostPct })}></div>
          </div>
          <div style={sx('font:400 12px/1.55 Sarabun,sans-serif;font-variant-numeric:tabular-nums', { color: V.sumMuted })}>ยาที่คืนมา <strong style={sx('font-weight:600', { color: V.sumFg })}>{V.fyGrossLabel}</strong> · ใช้ต่อได้ {V.fyReusePct}</div>
        </div>

        {/* ปุ่มส่งออกย้ายขึ้นมาไว้ใต้ตัวเลขใหญ่ (พี่กันสั่ง)
            เดิมอยู่ล่างสุดของหน้า ต้องเลื่อนผ่านกราฟ + 10 อันดับ + สัดส่วนแหล่งที่มา กว่าจะเจอ
            ฝั่งคอมปุ่มนี้อยู่แถวหัวเรื่องอยู่แล้ว ตำแหน่งเลยใกล้เคียงกันทั้งสองแบบ */}
        <div style={s('margin-bottom:10px')}>{renderExportBtn(V.exportCsv, V.exportLabel, { block: true })}</div>

        <div style={s('display:flex;gap:9px;margin-bottom:10px')}>
          <div style={sx('flex:1;border-radius:12px;padding:11px 13px;min-width:0', { background: V.sumLostPanel, border: '1px solid ' + V.sumBorder })}>
            <div style={sx('font:500 11px Sarabun,sans-serif', { color: V.sumRed })}>สูญเสีย (ทำลาย)</div>
            <div style={sx("font:700 21px/1.2 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.03em;word-break:break-all", { color: V.sumRed })}>{V.fyLostShort}</div>
          </div>
          <div style={sx('flex:1;border-radius:12px;padding:11px 13px;min-width:0', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
            <div style={sx('font:500 11px Sarabun,sans-serif', { color: V.sumMuted })}>รายการบันทึก</div>
            <div style={s("font:700 21px/1.2 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.02em")}>{V.fyCount} <span style={sx('font:400 11.5px Sarabun,sans-serif', { color: V.sumMuted })}>· ยา {V.fyDrugCount}</span></div>
          </div>
        </div>

        <div style={sx('border-radius:12px;padding:14px 14px 10px;margin-bottom:10px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
          <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px')}>
            <span style={s('font:600 13.5px Sarabun,sans-serif')}>มูลค่าประหยัดรายเดือน (฿)</span>
            <span style={sx('font:400 10.5px Sarabun,sans-serif', { color: V.sumMuted })}>ต.ค.–ก.ย.</span>
          </div>
          <div style={s('display:flex;align-items:flex-end;gap:3px;height:132px')}>
            {V.months.map((m) => (
              <div key={m.key} style={s('flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:4px;min-width:0')}>
                <div style={sx("font:600 8.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: m.labelColor })}>{m.short}</div>
                <div style={sx('width:100%;border-radius:3px 3px 0 0;min-height:3px', { height: m.h, background: m.bg })}></div>
                <div style={sx('font:500 9.5px Sarabun,sans-serif;white-space:nowrap', { color: m.nameColor })}>{m.nameShort}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={sx('border-radius:12px;padding:14px 14px;margin-bottom:10px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
          <div style={s('font:600 13.5px Sarabun,sans-serif;margin-bottom:12px')}>ยาที่คืนมูลค่าสูงสุด 10 อันดับ (฿)</div>
          <div style={s('display:flex;flex-direction:column;gap:9px')}>
            {V.topDrugs.map((t) => (
              <div key={t.key} style={s('display:flex;align-items:center;gap:9px')}>
                <span style={sx("width:16px;flex:none;font:600 10.5px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums", { color: V.sumMuted })}>{t.rank}</span>
                <div style={s('flex:1;min-width:0')}>
                  <div style={s('display:flex;justify-content:space-between;gap:8px;font:400 12.5px Sarabun,sans-serif;margin-bottom:3px')}>
                    <span style={s('overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{renderDrugName(t.parts)}</span>
                    <span style={s('font-weight:600;font-variant-numeric:tabular-nums;flex:none')}>{t.value}</span>
                  </div>
                  <div style={sx('height:5px;border-radius:99px', { background: V.sumTrack })}>
                    <div style={sx('height:5px;border-radius:99px', { width: t.w, background: t.bg })}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={sx('border-radius:12px;padding:14px 14px;margin-bottom:14px', { background: V.sumPanel, border: '1px solid ' + V.sumBorder })}>
          <div style={s('font:600 13.5px Sarabun,sans-serif;margin-bottom:2px')}>สัดส่วนตามแหล่งที่มา</div>
          <div style={sx('font:400 11px/1.4 Sarabun,sans-serif;margin-bottom:11px', { color: V.sumMuted, opacity: .75 })}>{V.srcBaseLabel}</div>
          <div style={sx('display:flex;height:9px;border-radius:99px;overflow:hidden;margin-bottom:11px', { background: V.sumTrack })}>
            {V.srcShares.map((sh) => (
              <div key={sh.key} style={sx('', { width: sh.w, background: sh.bg })}></div>
            ))}
          </div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
            {V.srcShares.map((sh) => (
              <div key={sh.key} style={sx('display:flex;align-items:center;gap:7px;font:400 12px Sarabun,sans-serif;font-variant-numeric:tabular-nums', { color: V.sumMuted })}>
                <span style={sx('width:9px;height:9px;border-radius:3px;flex:none', { background: sh.bg })}></span>{sh.label}
              </div>
            ))}
          </div>
        </div>

        {renderTopReturned(V)}

      </div>
    </div>
  );
}
