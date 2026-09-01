// หน้าต่างแก้ไขล็อต (พี่กันสั่ง 25 ส.ค. 2569)
//
// แก้ได้ 2 ระดับในหน้าต่างเดียว:
//   ระดับล็อต — ผู้บันทึก · วันที่ · แหล่งที่มา (เปลี่ยนทุกแถวพร้อมกัน)
//   ระดับแถว  — จำนวน · ใช้ต่อ/ทำลาย
//
// 🚨 ไม่มีช่องแก้ราคาต่อหน่วยโดยตั้งใจ — ราคาถูกแช่ไว้ตั้งแต่วันบันทึก
//    แก้แล้วตัวเลข KPI ที่รายงานผู้บริหารไปแล้วจะขยับย้อนหลัง (กฎเหล็กข้อ 12)
// 🚨 กดพื้นหลังไม่ปิด — ในนี้มีของที่แก้ค้างไว้ กดพลาดแล้วงานหายหมด
// 🚨 แยกเป็นไฟล์ของตัวเอง ไม่รวมกับ lots.jsx เพราะยาวพอ ๆ กับทั้งหน้ารายการล็อต
import { s, sx, kb } from '../helpers';
import { renderDrugName } from './drugname';
import { renderPcuField } from './pcufield';
import { skelLotEdit } from './skeleton';

export function renderLotEdit(V) {
  if (!V.lotEditOpen) return null;
  return (
    <div role="dialog" aria-modal="true" style={s('position:fixed;inset:0;background:rgba(20,26,22,.45);display:flex;align-items:flex-start;justify-content:center;padding:26px 16px;z-index:32;overflow:auto')}>
      <div style={s('background:#fff;border-radius:16px;width:100%;max-width:960px;box-shadow:0 24px 60px rgba(20,26,22,.28);overflow:hidden')}>

        <div style={s('padding:15px 20px;border-bottom:1px solid #eef1ee;display:flex;align-items:center;gap:11px')}>
          <div style={s('font:700 15.5px Sarabun,sans-serif')}>แก้ไขล็อต</div>
          <div style={s("font:700 14px Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border-radius:7px;padding:3px 10px")}>{V.lotEditLot}</div>
          {!V.lotEditLoading && <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>{V.lotEditCountLabel}</div>}
          <div {...kb(V.closeLotEdit)} aria-label="ปิดหน้าต่างแก้ไขล็อต" className="hv-ico tap" title="ปิด"
            style={s('margin-left:auto;width:30px;height:30px;border-radius:8px;background:#f2f4f1;color:#6b746e;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px')}>✕</div>
        </div>

        {(V.lotEditLoading || V.skelDemo) ? (
          skelLotEdit()
        ) : (
          <>
            {/* ── ค่าระดับล็อต ── */}
            <div style={s('padding:15px 20px;border-bottom:1px solid #eef1ee')}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap')}>
                <span style={s('font:600 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ข้อมูลของทั้งล็อต</span>
                <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#96650f;background:#fdf6e9;border:1px solid rgba(150,101,15,.25);border-radius:5px;padding:1px 7px')}>แก้แล้วมีผลทุกรายการในล็อต</span>
              </div>

              <div style={s('display:flex;gap:18px;flex-wrap:wrap')}>
                <div>
                  <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px;display:flex;align-items:center;gap:6px')}>
                    ผู้บันทึก
                    {V.lotEditByChanged && <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#96650f;background:#fdf6e9;border-radius:4px;padding:1px 6px')}>เดิม {V.lotEditByWas}</span>}
                  </div>
                  <select value={V.lotEditBy} onChange={V.onLotEditBy}
                    style={sx('width:246px;height:42px;padding:0 11px;border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif;color:#1e2420;outline:none;cursor:pointer',
                      { border: '1px solid ' + (V.lotEditByChanged ? '#96650f' : 'rgba(30,36,32,.16)') })}>
                    {V.lotEditStaff.indexOf(V.lotEditBy) < 0 && <option value={V.lotEditBy}>{V.lotEditBy || 'ไม่ระบุ'}</option>}
                    {V.lotEditStaff.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div>
                  <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px;display:flex;align-items:center;gap:6px')}>
                    วันที่รับคืน
                    {V.lotEditDateChanged && <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#96650f;background:#fdf6e9;border-radius:4px;padding:1px 6px')}>เดิม {V.lotEditDateWas}</span>}
                  </div>
                  <input type="date" value={V.lotEditDate} onChange={V.onLotEditDate} max={V.lotEditDateMax}
                    style={sx("width:190px;height:42px;padding:0 11px;border-radius:9px;background:#fff;font:400 13.5px/1.75 Sarabun,sans-serif;color:#1e2420;outline:none",
                      { border: '1px solid ' + (V.lotEditDateChanged ? '#96650f' : 'rgba(30,36,32,.16)') })} />
                </div>
              </div>

              <div style={s('margin-top:13px')}>
                <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:6px;display:flex;align-items:center;gap:6px')}>
                  แหล่งที่มา
                  {V.lotEditSrcChanged && <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#96650f;background:#fdf6e9;border-radius:4px;padding:1px 6px')}>เดิม {V.lotEditSrcWas}</span>}
                </div>
                <div style={s('display:flex;gap:6px;flex-wrap:wrap')}>
                  {V.lotEditSources.map((sc) => (
                    <div key={sc.key} {...kb(sc.pick)} className={(sc.on ? 'hv-seg-on' : 'hv-seg-off') + ' tap'}
                      style={sx('height:34px;padding:0 13px;border-radius:9px;display:flex;align-items:center;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer',
                        { background: sc.bg, color: sc.fg, border: '1px solid ' + sc.border })}>{sc.label}</div>
                  ))}
                </div>

                {/* รพ.สต. ต้นทาง — แก้ย้อนหลังได้ พร้อมเก็บร่องรอยว่าใครแก้จากอะไรเป็นอะไร
                    (พี่กันสั่ง 26 ส.ค. 2569) · ป้าย "เดิม …" ใช้รูปแบบเดียวกับช่องอื่นในหน้านี้ */}
                {V.lotEditPcu && V.lotEditPcu.pcuOn && V.lotEditSiteChanged && (
                  <div style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#96650f;margin-top:9px;margin-bottom:-4px;text-align:right')}>
                    เดิม {V.lotEditSiteWas}
                  </div>
                )}
                {renderPcuField(V.lotEditPcu || {})}
              </div>
            </div>

            {/* ── ตารางรายการยา ── */}
            <div style={s('max-height:340px;overflow-y:auto;border-bottom:1px solid #eef1ee')}>
              <div style={s("display:flex;padding:9px 20px;background:#f8f9f7;border-bottom:1px solid #eef1ee;font:600 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;position:sticky;top:0;z-index:2")}>
                <span style={s('flex:1')}>ยา</span>
                <span style={s('width:210px;text-align:center')}>จำนวน</span>
                <span style={s('width:96px;text-align:center')}>ราคา/หน่วย</span>
                <span style={s('width:116px;text-align:right')}>มูลค่า</span>
                <span style={s('width:140px;text-align:center')}>สถานะ</span>
              </div>

              {V.lotEditRows.map((r) => (
                <div key={r.key} style={sx('display:flex;align-items:center;padding:11px 20px;border-bottom:1px solid rgba(30,36,32,.05);font:400 13.5px/1.75 Sarabun,sans-serif;font-variant-numeric:tabular-nums', { background: r.rowBg })}>
                  <span style={s('flex:1;min-width:0;line-height:1.35;overflow-wrap:anywhere')}>
                    {renderDrugName(r.np, { size: '13.5px' })}
                    {r.wasLabel && <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#96650f;background:#fdf6e9;border-radius:4px;padding:1px 6px;margin-left:7px;white-space:nowrap')}>{r.wasLabel}</span>}
                  </span>

                  {/* กติกาช่องจำนวนเหมือนหน้าบันทึกทุกอย่าง — โครงคงที่ ปุ่ม 2 ช่องเสมอ กรอบจึงไม่เลื่อน */}
                  {r.editing ? (
                    <span style={s('width:210px;height:22px;display:flex;align-items:center;justify-content:flex-end;gap:5px;position:relative')}>
                      <input autoFocus onFocus={(e) => e.target.select()} value={r.editText} onChange={r.onQty} onKeyDown={r.onQtyKey} autoComplete="off"
                        style={s("width:140px;height:26px;padding:0 7px;border:1px solid #2f7d5d;border-radius:6px;background:#fff;text-align:right;font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420;outline:none;box-shadow:0 0 0 3px rgba(47,125,93,.12)")} />
                      <span {...(r.editCanSave ? kb(r.commitQty) : {})} aria-label="ตกลงจำนวนใหม่" className={r.editCanSave ? 'hv-txt tap' : ''} title={r.editCanSave ? 'ตกลง' : 'ยังไม่ได้เปลี่ยนจำนวน'}
                        style={sx('width:26px;height:26px;flex:none;border-radius:6px;display:flex;align-items:center;justify-content:center;font:700 13px/1.75 Sarabun,sans-serif',
                          { background: r.editOkBg, color: r.editOkFg, cursor: r.editCanSave ? 'pointer' : 'not-allowed' })}>✓</span>
                      <span {...kb(r.cancelQty)} aria-label="ยกเลิกการแก้จำนวน" className="hv-txt tap" title="ยกเลิก"
                        style={s('width:26px;height:26px;flex:none;border-radius:6px;background:#f2f4f1;color:#6b746e;display:flex;align-items:center;justify-content:center;cursor:pointer;font:600 13px/1.75 Sarabun,sans-serif')}>✕</span>
                      {r.editPreview && (
                        <span style={s('position:absolute;top:27px;right:0;white-space:nowrap;font:600 10.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border:1px solid rgba(47,125,93,.22);border-radius:5px;padding:2px 7px;z-index:4;pointer-events:none')}>{r.editPreview}</span>
                      )}
                    </span>
                  ) : (
                    <span style={s('width:210px;height:22px;display:flex;align-items:center;justify-content:flex-end;gap:5px')}>
                      <span style={s('width:140px;text-align:right;padding-right:7px')}>{r.qtyLabel}</span>
                      <span {...kb(r.startQty)} aria-label="แก้จำนวน" className="tap hv-bg-eef" title="แก้จำนวน"
                        style={s('width:26px;height:24px;flex:none;border:1px solid rgba(30,36,32,.14);border-radius:6px;background:#fff;color:#6b746e;display:flex;align-items:center;justify-content:center;cursor:pointer;font:400 11px/1.75 Sarabun,sans-serif')}>✎</span>
                      <span style={s('width:26px;flex:none')} />
                    </span>
                  )}

                  <span style={s('width:96px;text-align:right;color:#6b746e;padding-right:16px')}>{r.priceLabel}</span>
                  <span style={sx("width:116px;text-align:right;font:600 14px Sarabun,sans-serif", { color: r.valueColor })}>{r.valueLabel}</span>
                  <span style={s('width:140px;display:flex;justify-content:center')}>
                    <span style={sx('display:flex;padding:2px;border-radius:7px', { background: r.pillBg })}>
                      <span {...kb(r.setReuse)} className={r.reuseOn ? 'hv-seg-on' : 'hv-txt'} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: r.reuseBg, color: r.reuseFg })}>ใช้ต่อ</span>
                      <span {...kb(r.setDestroy)} className={r.reuseOn ? 'hv-des-off' : 'hv-des-on'} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: r.destroyBg, color: r.destroyFg })}>ทำลาย</span>
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {/* ── ประวัติการแก้ไข ── */}
            <div style={s('border-bottom:1px solid #eef1ee')}>
              <div {...kb(V.toggleLotEditLog)} className="hv-bg-f6"
                style={s('padding:11px 20px;display:flex;align-items:center;gap:8px;cursor:pointer;font:600 12px/1.75 Sarabun,sans-serif;color:#414a44')}>
                <span style={s('font-size:11px;color:#6f7873')}>{V.lotEditLogOpen ? '▾' : '▸'}</span>
                {V.lotEditLogLabel}
              </div>
              {V.lotEditLogOpen && V.lotEditLogCount > 0 && (
                <div style={s('max-height:190px;overflow-y:auto;padding:0 20px 12px')}>
                  {V.lotEditLog.map((x) => (
                    <div key={x.key} style={s('display:flex;align-items:baseline;gap:9px;padding:7px 0;border-top:1px solid rgba(30,36,32,.05);font:400 12px/1.75 Sarabun,sans-serif;flex-wrap:wrap')}>
                      <span style={s('font:600 11.5px/1.75 Sarabun,sans-serif;color:#414a44')}>{x.what}</span>
                      {x.drug && <span style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#6b746e')}>{x.drug}</span>}
                      <span style={s('color:#6f7873;text-decoration:line-through')}>{x.from}</span>
                      <span aria-hidden="true" style={s('color:#6f7873')}>→</span>
                      <span style={s('font-weight:600;color:#2f7d5d')}>{x.to}</span>
                      <span style={s('margin-left:auto;font:400 11px/1.75 Sarabun,sans-serif;color:#6f7873;white-space:nowrap')}>{x.by} · {x.at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ท้ายหน้าต่าง ── */}
            <div style={s('padding:13px 20px;display:flex;align-items:center;gap:14px;background:#f8f9f7;flex-wrap:wrap')}>
              <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>
                ยอดรวมหลังแก้ <span style={s("font:700 15px Sarabun,sans-serif;color:#2f7d5d;margin-left:5px")}>{V.lotEditTotalLabel}</span>
              </div>
              {V.lotEditHasLost && (
                <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6f7873')}>
                  ใช้ต่อ {V.lotEditSavedLabel} · ทำลาย <span style={s('color:#c2543c;font-weight:600')}>{V.lotEditLostLabel}</span>
                </div>
              )}
              <div style={s('margin-left:auto;display:flex;gap:9px')}>
                <div {...kb(V.closeLotEdit)} className="hv-bg-f6"
                  style={s('height:38px;padding:0 16px;border-radius:9px;border:1px solid rgba(30,36,32,.14);background:#fff;display:flex;align-items:center;font:600 13px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ยกเลิก</div>
                <div {...(V.lotEditDirty && !V.lotEditBusy ? kb(V.askSaveLotEdit) : {})} className={V.lotEditDirty && !V.lotEditBusy ? 'hv-teal tap' : ''}
                  title={V.lotEditDirty ? 'บันทึกการแก้ไข' : 'ยังไม่ได้แก้อะไร'}
                  style={sx('height:38px;padding:0 18px;border-radius:9px;display:flex;align-items:center;font:600 13px/1.75 Sarabun,sans-serif',
                    { background: V.lotEditSaveBg, color: V.lotEditSaveFg, cursor: V.lotEditDirty && !V.lotEditBusy ? 'pointer' : 'not-allowed' })}>{V.lotEditSaveLabel}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── หน้าต่างยืนยัน — สรุปให้เห็นก่อนว่าจะเปลี่ยนอะไร ── */}
      {V.lotEditConfirm && (
        <div role="dialog" aria-modal="true" style={s('position:fixed;inset:0;background:rgba(20,26,22,.5);display:flex;align-items:center;justify-content:center;padding:18px;z-index:85')}>
          <div style={s('background:#fff;border-radius:14px;width:100%;max-width:460px;padding:20px;box-shadow:0 20px 50px rgba(20,26,22,.3)')}>
            <div style={s('font:700 15px Sarabun,sans-serif;margin-bottom:5px')}>ยืนยันการแก้ไขล็อต {V.lotEditLot}</div>
            <div style={s('font:400 12px/1.7 Sarabun,sans-serif;color:#6b746e;margin-bottom:13px')}>
              การแก้ไขจะถูกบันทึกไว้ในประวัติพร้อมชื่อผู้แก้และเวลา · ตัวเลขสรุปปีงบจะเปลี่ยนตามทันที
            </div>

            <div style={s('background:#f8f9f7;border-radius:10px;padding:11px 13px;margin-bottom:15px')}>
              {V.lotEditSummary.map((x) => (
                <div key={x.k} style={s('display:flex;align-items:baseline;gap:8px;padding:4px 0;font:400 12.5px/1.75 Sarabun,sans-serif;flex-wrap:wrap')}>
                  <span style={s('font-weight:600;color:#414a44;min-width:74px')}>{x.label}</span>
                  <span style={s('color:#6f7873;text-decoration:line-through')}>{x.from}</span>
                  <span aria-hidden="true" style={s('color:#6f7873')}>→</span>
                  <span style={s('font-weight:600;color:#2f7d5d')}>{x.to}</span>
                </div>
              ))}
              {V.lotEditHasRowChange && (
                <div style={s('padding:4px 0;font:400 12.5px/1.75 Sarabun,sans-serif;color:#414a44')}>
                  <span style={s('font-weight:600')}>รายการยา</span> <span style={s('color:#6b746e')}>{V.lotEditRowChangeLabel}</span>
                </div>
              )}
            </div>

            {/* 🚨 ต้องเลือกชื่อผู้แก้ตรงนี้ ไม่ใช่ไปเลือกในหน้าบันทึก — คนละงานกัน
                   เดิมผูกกับช่องผู้บันทึกในหน้าบันทึก พอไม่ได้เลือกไว้ กดยืนยันแล้วเงียบ
                   ดูเหมือนปุ่มเสีย (พี่กันเจอเอง 25 ส.ค. 2569) */}
            <div style={s('margin-bottom:14px')}>
              <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>
                ผู้ที่แก้ไข {!V.lotEditWhoOk && <span style={s('color:#c2543c;font-weight:600')}>ต้องเลือกก่อนยืนยัน</span>}
              </div>
              <select value={V.lotEditWho} onChange={V.onLotEditWho}
                style={sx('width:100%;height:42px;padding:0 11px;border-radius:9px;background:#fff;font:400 14px Sarabun,sans-serif;color:#1e2420;outline:none;cursor:pointer',
                  { border: '1px solid ' + (V.lotEditWhoOk ? 'rgba(30,36,32,.16)' : '#c2543c') })}>
                <option value="">— เลือกผู้ที่แก้ไข —</option>
                {V.lotEditStaff.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* 🚨 ปุ่มยืนยันอยู่ซ้าย ปุ่มย้อนกลับอยู่ขวา — ตั้งใจสลับกันเพื่อกันเผลอกดรัว
                   ชุดเดียวกับป๊อปลบทั้งเว็บ (กฎเหล็กข้อ 7) */}
            <div style={s('display:flex;gap:9px')}>
              <div {...(V.lotEditWhoOk && !V.lotEditBusy ? kb(V.saveLotEdit) : {})} className={V.lotEditWhoOk && !V.lotEditBusy ? 'hv-teal tap' : ''}
                title={V.lotEditWhoOk ? 'ยืนยันการแก้ไข' : 'เลือกผู้ที่แก้ไขก่อน'}
                style={sx('flex:1;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;font:600 13px/1.75 Sarabun,sans-serif',
                  { background: V.lotEditOkBg, color: V.lotEditOkFg, cursor: V.lotEditWhoOk && !V.lotEditBusy ? 'pointer' : 'not-allowed' })}>{V.lotEditOkLabel}</div>
              <div {...kb(V.cancelSaveLotEdit)} className="hv-bg-f6"
                style={s('flex:1;height:40px;border-radius:9px;border:1px solid rgba(30,36,32,.14);background:#fff;display:flex;align-items:center;justify-content:center;font:600 13px/1.75 Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ย้อนกลับ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
