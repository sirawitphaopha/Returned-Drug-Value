// หน้าต่างนำเข้าราคาจากไฟล์ HIS — ไม่มีในมอคอัป พี่กันสั่งทำใหม่ทั้งหน้า
//
// หลักคิด: ระบบ "เสนอ" พี่กัน "ตัดสิน" — ไม่มีการนำเข้าอัตโนมัติทั้งดุ้น
// เพราะราคาถูกแช่แข็งลงแถวตอนบันทึก จับคู่ผิดแล้วตัวเลข KPI ผิดถาวร
import { s, sx, kb } from '../helpers';

export function renderHisImport(V) {
  if (!V.hisOpen) return null;

  return (
    <>
      {/* กดพื้นหลังไม่ปิด — ตรวจทานมาตั้งเยอะ เผลอกดแล้วหายหมดคงเสียใจ */}
      <div style={s('position:fixed;inset:0;background:rgba(21,26,23,.46);z-index:34')}></div>

      <div role="dialog" aria-modal="true" style={s('position:fixed;inset:0;z-index:35;display:flex;align-items:center;justify-content:center;padding:16px')}>
        <div style={s('width:100%;max-width:900px;max-height:100%;background:#f6f7f4;border-radius:16px;box-shadow:0 24px 60px -18px rgba(30,36,32,.5);display:flex;flex-direction:column;overflow:hidden')}>

          {/* ── หัวหน้าต่าง ─────────────────────────────────────────────── */}
          <div style={s('flex:none;display:flex;align-items:center;gap:12px;padding:16px 20px;background:#fff;border-bottom:1px solid rgba(30,36,32,.08)')}>
            <div style={s('font:600 17px Sarabun,sans-serif;flex:1;min-width:0')}>นำเข้าราคาจาก HIS</div>
            <div {...kb(V.closeHisImport)} aria-label="ปิดหน้าต่างนำเข้าราคา" className="hv-bg-f6 tap" style={s('width:34px;height:34px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>✕</div>
          </div>

          {/* ── เลือกไฟล์ ──────────────────────────────────────────────── */}
          <div style={s('flex:none;padding:14px 20px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
            <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
              <label className="hv-teal tap" style={s('display:flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:9px;background:#2f7d5d;color:#fff;font:600 13.5px Sarabun,sans-serif;cursor:pointer;flex:none')}>
                เลือกไฟล์ รายการยา
                <input type="file" accept=".xls,.xlsx,.csv" onChange={V.onHisFile} style={s('display:none')} />
              </label>
              <div style={s('min-width:0;flex:1')}>
                {V.hisFileName && (
                  <div style={s('font:500 12.5px Sarabun,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{V.hisFileName}</div>
                )}
                <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6f7873')}>
                  ไฟล์ถูกอ่านในเครื่องนี้เท่านั้น ไม่ถูกส่งขึ้นเซิร์ฟเวอร์
                </div>
              </div>
            </div>

            {V.hisReading && (
              <div style={s('margin-top:10px;font:500 13px Sarabun,sans-serif;color:#2f7d5d')}>กำลังอ่านไฟล์และจับคู่ยา</div>
            )}
            {V.hisError && (
              <div style={s('margin-top:10px;padding:10px 12px;border-radius:9px;background:#fdf1ed;border:1px solid rgba(194,84,60,.28);font:500 12.5px Sarabun,sans-serif;color:#c2543c')}>{V.hisError}</div>
            )}
          </div>

          {/* ── ยังไม่ได้เลือกไฟล์ ─────────────────────────────────────── */}
          {!V.hisHasFile && !V.hisReading && (
            <div style={s('flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;gap:8px')}>
              <div style={s('font:600 15px Sarabun,sans-serif')}>เลือกไฟล์รายการยาที่เอ็กซ์พอร์ตจาก HIS</div>
              <div style={s('font:400 12.5px/1.7 Sarabun,sans-serif;color:#6b746e;max-width:460px')}>
                ระบบจะจับคู่ชื่อยาในไฟล์กับยาในเว็บให้อัตโนมัติ แล้วแยกเป็น 3 กลุ่มให้ตรวจทาน
                <br />ยาที่เลิกใช้และเวชภัณฑ์จะถูกคัดออกให้เอง
              </div>
            </div>
          )}

          {/* ── ผลจับคู่ ───────────────────────────────────────────────── */}
          {V.hisHasFile && (
            <>
              <div style={s('flex:none;padding:12px 20px;background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
                <div style={s('font:400 12.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:9px')}>{V.hisSummary}</div>
                <div style={s('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                  {V.hisTabs.map((t) => (
                    <div key={t.key} {...kb(t.pick)} className="tap" style={sx('padding:7px 14px;border-radius:999px;font:600 12.5px Sarabun,sans-serif;cursor:pointer', { background: t.bg, color: t.fg })}>{t.label}</div>
                  ))}
                  <div style={s('margin-left:auto;display:flex;gap:6px')}>
                    <div {...kb(V.checkHisTabOn)} className="hv-bg-e3f tap" style={s('padding:7px 12px;border-radius:8px;border:1px solid rgba(47,125,93,.3);background:#e3f0e8;color:#2f7d5d;font:600 12px Sarabun,sans-serif;cursor:pointer')}>{V.hisBulkLabel}</div>
                    <div {...kb(V.checkHisTabOff)} className="hv-bg-f6 tap" style={s('padding:7px 12px;border-radius:8px;border:1px solid rgba(30,36,32,.14);background:#fff;color:#6b746e;font:600 12px Sarabun,sans-serif;cursor:pointer')}>เอาออกทั้งกลุ่ม</div>
                  </div>
                </div>
              </div>

              <div style={s('flex:1;min-height:0;overflow-y:auto;padding:12px 20px')}>
                {!V.hisShown.length && (
                  <div style={s('padding:36px 12px;text-align:center;font:400 13.5px Sarabun,sans-serif;color:#6b746e')}>{V.hisEmptyLabel}</div>
                )}

                {V.hisShown.map((r) => (
                  <div key={r.key} style={sx('background:#fff;border-radius:11px;padding:11px 13px;margin-bottom:8px', { border: '1px solid ' + (r.checked ? 'rgba(47,125,93,.4)' : 'rgba(30,36,32,.09)') })}>
                    <div style={s('display:flex;align-items:flex-start;gap:11px')}>
                      {/* ช่องติ๊ก — ถ้ายังไม่มีราคาที่ใช้ได้ ติ๊กไม่ได้ */}
                      <div
                        {...kb(r.canCheck ? r.toggle : undefined)}
                        style={sx('width:20px;height:20px;border-radius:6px;flex:none;margin-top:1px;display:flex;align-items:center;justify-content:center;font:700 12px Sarabun,sans-serif', {
                          border: '1.5px solid ' + (r.checked ? '#2f7d5d' : 'rgba(30,36,32,.22)'),
                          background: r.checked ? '#2f7d5d' : '#fff',
                          color: '#fff',
                          cursor: r.canCheck ? 'pointer' : 'not-allowed',
                          opacity: r.canCheck ? 1 : .45
                        })}
                      >{r.checked ? '✓' : ''}</div>

                      <div style={s('flex:1;min-width:0')}>
                        <div style={s('font:600 13.5px Sarabun,sans-serif;overflow-wrap:anywhere')}>{r.webName}</div>
                        <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;overflow-wrap:anywhere')}>
                          {r.hisName}{r.hisUnit ? ' · ' + r.hisUnit : ''}
                        </div>
                      </div>

                      <div style={s('flex:none;text-align:right')}>
                        <div style={s('font:400 10.5px Sarabun,sans-serif;color:#6f7873')}>เดิม {r.oldLabel}</div>
                        <div style={sx("font:600 15px Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: r.newColor })}>{r.newLabel}</div>
                        {r.changed && (
                          <div style={s('font:600 10px Sarabun,sans-serif;color:#c2543c')}>ราคาเปลี่ยน</div>
                        )}
                      </div>
                    </div>

                    {/* กลุ่มต้องเลือก — โชว์ทุกบรรทัดที่เข้าข่ายให้กดสลับ */}
                    {r.alts.length > 0 && (
                      <div style={s('margin-top:9px;padding-top:9px;border-top:1px dashed rgba(30,36,32,.12);display:flex;flex-direction:column;gap:5px')}>
                        {r.alts.map((a) => (
                          <div key={a.key} {...kb(a.pick)} className="tap" style={sx('display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:8px;cursor:pointer', {
                            background: a.on ? '#e3f0e8' : '#f6f7f4',
                            border: '1px solid ' + (a.on ? 'rgba(47,125,93,.34)' : 'transparent')
                          })}>
                            <span style={sx('width:13px;height:13px;border-radius:50%;flex:none', {
                              border: '1.5px solid ' + (a.on ? '#2f7d5d' : 'rgba(30,36,32,.3)'),
                              background: a.on ? '#2f7d5d' : '#fff'
                            })}></span>
                            <span style={s('flex:1;min-width:0;font:400 12px Sarabun,sans-serif;overflow-wrap:anywhere')}>{a.label}</span>
                            <span style={s("flex:none;font:600 12px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{a.priceLabel}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* กลุ่มไม่เจอ — พิมพ์ราคาเองได้ */}
                    {r.showManual && (
                      <div style={s('margin-top:9px;padding-top:9px;border-top:1px dashed rgba(30,36,32,.12);display:flex;align-items:center;gap:9px')}>
                        <span style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;flex:none')}>พิมพ์ราคาเอง</span>
                        <input
                          value={r.manualPrice}
                          onChange={r.onManual}
                          inputMode="decimal"
                          placeholder="0.00"
                          style={s("width:120px;height:34px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:8px;background:#fff;font:600 13px Sarabun,sans-serif;text-align:right")}
                        />
                        <span style={s('font:400 11.5px Sarabun,sans-serif;color:#6f7873')}>บาท ต่อ {r.unit}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── แถบบันทึก ─────────────────────────────────────────── */}
              <div style={s('flex:none;padding:13px 20px;background:#fff;border-top:1px solid rgba(30,36,32,.08);display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
                <div {...kb(V.toggleHisBackfill)} className="tap" style={s('display:flex;align-items:center;gap:8px;cursor:pointer;min-width:0')}>
                  <span style={sx('width:18px;height:18px;border-radius:5px;flex:none;display:flex;align-items:center;justify-content:center;font:700 11px Sarabun,sans-serif;color:#fff', {
                    border: '1.5px solid ' + (V.hisBackfill ? '#2f7d5d' : 'rgba(30,36,32,.22)'),
                    background: V.hisBackfill ? '#2f7d5d' : '#fff'
                  })}>{V.hisBackfill ? '✓' : ''}</span>
                  <span style={s('font:400 12px/1.4 Sarabun,sans-serif;color:#6b746e')}>
                    ตีราคาย้อนหลังให้รายการเก่าที่มูลค่ายังเป็น 0
                  </span>
                </div>

                <div style={s('margin-left:auto;display:flex;gap:9px;flex:none')}>
                  <div {...kb(V.closeHisImport)} className="hv-bg-f6 tap" style={s('height:42px;padding:0 18px;border-radius:10px;border:1px solid rgba(30,36,32,.16);background:#fff;display:flex;align-items:center;font:600 13.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ยกเลิก</div>
                  <div
                    {...kb(V.hisCanSave ? V.saveHisImport : undefined)}
                    className={V.hisCanSave ? 'hv-teal tap' : ''}
                    style={sx('height:42px;padding:0 20px;border-radius:10px;display:flex;align-items:center;font:600 13.5px Sarabun,sans-serif', {
                      background: V.hisCanSave ? '#2f7d5d' : '#e6e8e4',
                      color: V.hisCanSave ? '#fff' : '#6f7873',
                      cursor: V.hisCanSave ? 'pointer' : 'not-allowed'
                    })}
                  >{V.hisSaveLabel}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
