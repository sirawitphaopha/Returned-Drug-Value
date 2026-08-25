// หน้าคลังยา — ดู แก้ เพิ่ม ซ่อน และดูประวัติการแก้ของยาในตารางกลาง
//
// 🚨 ตาราง drugs ใช้ร่วมกัน 3 เว็บ · แก้ที่นี่กระทบ ME-DRP กับ TB Calculator ด้วย
// 🚨 ลบยาไม่ได้โดยตั้งใจ ใช้ "ซ่อน" แทน (พี่กันสั่ง 13 ส.ค. 2569)
import { s, sx, kb } from '../helpers';

// หัวตารางตรึงใต้แถบค้นหาที่ตรึงอยู่ก่อนแล้ว — ระยะวัดจริงจาก ResizeObserver ผ่าน --cathead
const TH = 'padding:9px 10px;text-align:left;font:600 12px Sarabun,sans-serif;color:#fff;background:#2f7d5d;white-space:nowrap;position:sticky;top:var(--cathead,150px);z-index:2';
const TD = 'padding:9px 10px;font:400 12.5px Sarabun,sans-serif;color:#414a44;vertical-align:top';
const BTN = 'border:1px solid #cfe0d6;background:#fff;color:#2f7d5d;font:600 11.5px Sarabun,sans-serif;padding:4px 9px;border-radius:7px;cursor:pointer';
// 🚨 ชิปกับช่องค้นหาต้องสูงเท่ากันเป๊ะ (พี่กันสั่ง 25 ส.ค. 2569)
//    ใช้ height ตายตัว + จัดกลางแนวตั้ง แทนการปั้นความสูงด้วย padding
//    ไม่งั้นพอเปลี่ยนขนาดตัวอักษรเมื่อไหร่ ความสูงสองฝั่งก็หลุดจากกันอีก
const CHIP_BASE = 'height:38px;box-sizing:border-box;display:inline-flex;align-items:center;padding:0 13px;border-radius:999px;cursor:pointer;white-space:nowrap';
const CHIP_ON = CHIP_BASE + ';border:1px solid #2f7d5d;background:#e3f0e8;color:#2f7d5d;font:600 12px Sarabun,sans-serif';
const CHIP_OFF = CHIP_BASE + ';border:1px solid #e3e6e1;background:#fff;color:#6b746e;font:400 12px Sarabun,sans-serif';
const FLD = 'width:100%;box-sizing:border-box;border:1.5px solid #dfe5e1;border-radius:9px;padding:9px 11px;font:400 13.5px Sarabun,sans-serif;color:#1e2420;outline:none;background:#fff';
const LAB = 'display:block;font:600 12px Sarabun,sans-serif;color:#6b746e;margin-bottom:5px';

export function renderCatalog(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px')}>
      <div style={s('background:#fff;border:1px solid rgba(30,36,32,.1);border-radius:14px;padding:16px 18px')}>

        <div style={s('display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px')}>
          <div>
            <div style={s('font:700 18px/1.2 Sarabun,sans-serif;color:#1e2420')}>คลังยา</div>
            <div style={s('font:400 12px Sarabun,sans-serif;color:#6b746e;margin-top:4px;font-variant-numeric:tabular-nums')}>
              แสดง {V.catShown} จาก {V.catTotal} รายการ
              {V.catHiddenCount > 0 && <span> · ซ่อนอยู่ {V.catHiddenCount} ตัว</span>}
              {' · '}แก้ที่นี่แล้วเว็บอื่นของห้องยาเห็นด้วย
            </div>
          </div>
          <div {...kb(V.catAdd)} className="hv-bg-e3f tap" style={s('background:#2f7d5d;color:#fff;font:600 13px Sarabun,sans-serif;padding:9px 16px;border-radius:9px;cursor:pointer')}>
            เพิ่มยา
          </div>
        </div>

        {/* แถบค้นหา + ตัวกรอง + ปุ่มสลับคอลัมน์ — ตรึงไว้บนสุดของพื้นที่เลื่อน
            ตารางยาว 417 แถว เลื่อนไปไกลแล้วต้องยังกดกรองหรือค้นได้ทันที (พี่กันสั่ง 19 ส.ค. 2569)
            พื้นที่เลื่อนคือ scrollRef ของ shell ไม่ใช่ทั้งหน้า top:0 จึงหมายถึงขอบบนกรอบนั้น */}
        <div ref={V.catHeadRef} style={s('position:sticky;top:0;z-index:6;background:#fff;padding:14px 0 10px;margin:0 -18px;padding-left:18px;padding-right:18px;border-bottom:1px solid #f2f5f3')}>
        {/* ช่องค้นหาครึ่งซ้าย · ตัวกรองครึ่งขวา บรรทัดเดียวกัน (พี่กันสั่ง 25 ส.ค. 2569)
            เดิมช่องค้นหากินเต็มบรรทัดแล้วตัวกรองตกไปบรรทัดล่าง แถบที่ตรึงไว้จึงสูงเกินจำเป็น
            🚨 จอแคบต้องยุบเป็นซ้อนกัน (flex-wrap + min-width) ไม่งั้นชิปเบียดจนกดไม่โดน */}
        <div style={s('display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap')}>

          {/* 🚨 ช่องค้นหากิน 25% ของแถว ที่เหลือ 75% เป็นของตัวกรอง (พี่กันสั่ง 25 ส.ค. 2569)
              ชิป 9 อันกับปุ่มล้างต้องอยู่บรรทัดเดียวกันให้ได้ ไม่งั้นแถบที่ตรึงไว้สูงขึ้นอีกแถว
              flex:0 1 = ย่อได้แต่ห้ามขยาย · min-width กันแคบจนพิมพ์แล้วอ่านไม่ออกบนจอเล็ก */}
          <div style={s('flex:0 1 25%;min-width:170px;position:relative')}>
            <input
              value={V.catSearch}
              onChange={(e) => V.setCatSearch(e.target.value)}
              placeholder="ค้นหาชื่อยา ชื่อการค้า ตัวย่อ"
              style={sx('width:100%;height:38px;box-sizing:border-box;border:1.5px solid #dfe5e1;border-radius:10px;padding:0 13px;font:400 13.5px Sarabun,sans-serif;color:#1e2420;outline:none',
                { paddingRight: V.catSwapped ? '150px' : '44px' })}
            />
            {V.catSwapped && (
              <span style={s('position:absolute;right:42px;top:50%;transform:translateY(-50%);font:600 11px Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border-radius:6px;padding:3px 8px;white-space:nowrap;pointer-events:none')}>
                ค้นว่า {V.catSwapLabel}
              </span>
            )}
            {V.catHasSearch && (
              <span {...kb(V.clearCatSearch)} className="tap hv-bg-eef" title="ล้างช่องค้นหา"
                style={s('position:absolute;right:8px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b746e;font:400 13px Sarabun,sans-serif')}>✕</span>
            )}
          </div>

          <div style={s('flex:1 1 300px;min-width:0;display:flex;gap:6px;flex-wrap:wrap;align-items:center')}>
            {V.catFilters.map((f) => (
              <div key={f.key} {...kb(f.pick)} className="tap" style={s(f.on ? CHIP_ON : CHIP_OFF)}>{f.label}</div>
            ))}
            {/* ปุ่มล้าง — โผล่เมื่อมีอะไรให้ล้างจริง ล้างทั้งตัวกรองและคำค้นในปุ่มเดียว
                เดิมล้างเฉพาะตัวกรอง ผู้ใช้ที่ทั้งค้นทั้งกรองต้องกดสองที่ (พี่กันทัก) */}
            {(V.catHasFilter || V.catHasSearch) && (
              <div {...kb(V.catClearAll)} className="tap" title="ล้างคำค้นและตัวกรองทั้งหมด"
                style={s(CHIP_BASE + ';border:1px solid rgba(194,84,60,.3);background:#fff;color:#c2543c;font:600 12px Sarabun,sans-serif')}>
                ✕ ล้างทั้งหมด
              </div>
            )}
          </div>
        </div>

        {/* คอลัมน์ชื่อเต็มยาวกว่าคอลัมน์อื่นมาก จึงซ่อนไว้ตั้งต้นและกดเปิดได้
            เป็นคอลัมน์เดียวในตารางที่ทำแบบนี้ (พี่กันสั่ง 13 ส.ค. 2569) */}
        <div style={sx('border-radius:9px;padding:9px 12px;margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap', V.catShowFull ? { background: '#eef6f1', border: '1px solid #cfe0d6' } : { background: '#f7faf8', border: '1px dashed #cfe0d6' })}>
          <span style={s('font:400 12.5px Sarabun,sans-serif;color:#414a44')}>
            คอลัมน์ <b style={s('font-weight:600')}>ชื่อที่เห็นตอนค้นหา</b> {V.catShowFull ? 'กำลังแสดงอยู่ท้ายตาราง' : 'ซ่อนอยู่ เพราะยาวกว่าคอลัมน์อื่นมาก'}
          </span>
          <div {...kb(V.catToggleFull)} className="tap" style={s('background:#e3f0e8;color:#2f7d5d;font:600 12px Sarabun,sans-serif;padding:6px 13px;border-radius:8px;cursor:pointer;flex:none')}>
            {V.catFullLabel}
          </div>
        </div>
        </div>

        {V.catLoading ? (
          <div style={s('padding:40px;text-align:center;font:400 13px Sarabun,sans-serif;color:#9aa19c')}>กำลังโหลดคลังยา</div>
        ) : (
          <div style={s('border:1px solid #eef1ee;border-radius:10px')}>
            <table style={s('width:100%;border-collapse:collapse')}>
              <colgroup>
                {V.catCols.map((c) => <col key={c.key} style={c.w ? { width: c.w } : undefined} />)}
                {V.catShowFull && <col style={{ width: '340px' }} />}
                <col style={{ width: '178px' }} />
              </colgroup>
              <thead>
                <tr>
                  {V.catCols.map((c) => (
                    <th key={c.key} {...(c.sort ? kb(() => V.catSortBy(c.key)) : {})} style={sx(TH, c.sort ? { cursor: 'pointer' } : null)}>
                      {c.label}
                      {c.sort && (
                        <span style={s('margin-left:3px;opacity:.75')}>
                          {V.catSortKey === c.key ? (V.catSortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </th>
                  ))}
                  {V.catShowFull && <th style={s(TH + ';background:#25664b')}>ชื่อที่เห็นตอนค้นหา</th>}
                  <th style={s(TH)}></th>
                </tr>
              </thead>
              <tbody>
                {V.catRows.map((r) => (
                  <tr key={r.id} style={sx('border-bottom:1px solid #f2f5f3', { background: r.rowBg })}>
                    <td style={s(TD + ';color:#9aa19c;font-size:11.5px')}>{r.id}</td>
                    {/* สีตรงกับที่ใช้ในผลค้นหา — ม่วง ตัวย่อ · ส้ม เปอร์เซ็นต์ · แดงอมชมพู ออกฤทธิ์ · เทล ชื่อการค้า */}
                    <td style={s(TD + ';color:#6d3b9e;font-weight:600')}>{r.abbrev || '—'}</td>
                    <td style={s(TD + ';color:#1e2420;font-weight:600')}>
                      {r.generic}
                      {r.hidden && <span style={s('margin-left:6px;font:600 10.5px Sarabun,sans-serif;color:#8a6d3b;background:#fbf1e0;border-radius:5px;padding:2px 6px')}>ซ่อนอยู่</span>}
                    </td>
                    <td style={s(TD + ';color:#2f7d5d;font-weight:600')}>{r.brand || '—'}</td>
                    <td style={s(TD)}>{r.strength || '—'}</td>
                    <td style={s(TD)}>{r.unit || '—'}</td>
                    <td style={s(TD + ';color:#96650f;font-weight:700')}>{r.percent ? r.percent + '%' : '—'}</td>
                    <td style={s(TD)}>{r.form || '—'}</td>
                    <td style={s(TD + ';color:#b02a5b;font-weight:700;font-style:italic')}>{r.release || '—'}</td>
                    <td style={s(TD)}>{r.route || '—'}</td>
                    <td style={s(TD)}>{r.had ? <span style={s('font:700 10.5px Sarabun,sans-serif;color:#c2543c;background:#fbe9e5;border-radius:5px;padding:2px 7px')}>HAD</span> : ''}</td>
                    <td style={s(TD)}>{r.preg || '—'}</td>
                    <td style={s(TD)}>{r.renal ? <span style={s('font:700 10.5px Sarabun,sans-serif;color:#8a5a00;background:#fbf1e0;border-radius:5px;padding:2px 7px')}>ไต</span> : '—'}</td>
                    {/* ราคาต่อหน่วย — ของเว็บนี้เอง (mr_drug_price) ไม่ใช่ของกลางเหมือนคอลัมน์อื่น
                        ยาที่ยังไม่ใส่ราคาโชว์ป้ายเตือน ไม่ใช่ 0.00 กันเข้าใจผิดว่าราคาศูนย์บาทจริง */}
                    <td style={s(TD + ';text-align:right;font-variant-numeric:tabular-nums')}>
                      {r.priceLabel
                        ? <span style={s('color:#1e2420;font-weight:600')}>{r.priceLabel}</span>
                        : <span style={s('font:600 10.5px Sarabun,sans-serif;color:#c2543c;background:#fbe9e5;border-radius:5px;padding:2px 7px;white-space:nowrap')}>ยังไม่ใส่ราคา</span>}
                    </td>
                    {V.catShowFull && (
                      <td style={s(TD + ';background:#f7faf8;overflow-wrap:anywhere')}>
                        <span style={s('color:#1e2420;font-weight:600')}>{r.fullBase}</span>
                        {r.abbrev && <span style={s('color:#6d3b9e;font-weight:600;margin-left:5px;white-space:nowrap')}>({r.abbrev})</span>}
                        {r.fullStrength && <span style={s('color:#6b746e;margin-left:6px;white-space:nowrap')}>{r.fullStrength}</span>}
                        {r.fullPercent && <span style={s('color:#96650f;font-weight:700;margin-left:5px;white-space:nowrap')}>{r.fullPercent}</span>}
                        {r.form && <span style={s('color:#414a44;font-weight:600;margin-left:6px;white-space:nowrap')}>{r.form}</span>}
                        {r.fullRelease && <span style={s('color:#b02a5b;font-weight:700;font-style:italic;margin-left:5px;white-space:nowrap')}>{r.fullRelease}</span>}
                        {r.brand && <span style={s('color:#2f7d5d;font-weight:600;margin-left:6px;white-space:nowrap')}>({r.brand})</span>}
                      </td>
                    )}
                    <td style={s(TD + ';white-space:nowrap')}>
                      <span {...kb(r.edit)} className="tap" style={s(BTN + ';margin-right:5px')}>แก้ไข</span>
                      <span {...kb(r.log)} className="tap" style={s(BTN + ';margin-right:5px;color:#6b746e;border-color:#e3e6e1')}>ประวัติ</span>
                      <span {...kb(r.hide)} className="tap" style={s('border:1px solid #f0d8ae;background:#fef7ec;color:#b45309;font:600 11.5px Sarabun,sans-serif;padding:4px 9px;border-radius:7px;cursor:pointer')}>{r.hideLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {V.catRows.length === 0 && (
              <div style={s('padding:34px;text-align:center;font:400 13px Sarabun,sans-serif;color:#9aa19c')}>ไม่พบยาตามเงื่อนไข</div>
            )}
          </div>
        )}

      </div>

      {/* ปุ่มลอยกดทีเดียวขึ้นบนสุด — ตารางยาว 417 แถว เลื่อนกลับเองไกลมาก */}
      <div {...kb(V.catToTop)} className="tap" title="ขึ้นบนสุด"
        style={s('position:fixed;right:24px;bottom:24px;z-index:40;width:44px;height:44px;border-radius:50%;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(30,36,32,.25);font:700 18px Sarabun,sans-serif')}>
        ↑
      </div>

      {V.catEdit && renderCatEdit(V)}
      {V.catHideTarget && renderCatHide(V)}
      {V.catLog && renderCatLog(V)}
    </div>
  );
}

// ── ป๊อปแก้ไข / เพิ่มยา ───────────────────────────────────────────────────────
// กดพื้นหลังไม่ปิด · แก้ค้างแล้วกดยกเลิกจะถามก่อน (กฎเดียวกับป๊อปอื่นในเว็บ)
function renderCatEdit(V) {
  const d = V.catEdit;
  const fld = (label, key, ph) => (
    <div style={s('flex:1;min-width:120px')}>
      <label style={s(LAB)}>{label}</label>
      <input value={d[key] || ''} onChange={(e) => V.setCatField(key, e.target.value)} placeholder={ph || ''} style={s(FLD)} />
    </div>
  );
  const sel = (label, key, opts) => (
    <div style={s('flex:1;min-width:120px')}>
      <label style={s(LAB)}>{label}</label>
      <select value={d[key] || ''} onChange={(e) => V.setCatField(key, e.target.value)} style={s(FLD)}>
        <option value="">— เลือก —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const flag = (label, key) => (
    <div {...kb(() => V.setCatField(key, !d[key]))} className="tap" style={sx('flex:1;min-width:120px;border-radius:9px;padding:10px 12px;font:600 13px Sarabun,sans-serif;cursor:pointer;text-align:center', d[key] ? { border: '1.5px solid #2f7d5d', background: '#e3f0e8', color: '#2f7d5d' } : { border: '1.5px solid #dfe5e1', background: '#fff', color: '#9aa19c' })}>
      {label}
    </div>
  );

  return (
    <div style={s('position:fixed;inset:0;background:rgba(30,36,32,.42);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px')}>
      <div style={s('background:#fff;border-radius:16px;width:560px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(30,36,32,.3)')}>
        <div style={s('background:#2f7d5d;color:#fff;padding:14px 18px;font:700 16px Sarabun,sans-serif')}>
          {V.catEditNew ? 'เพิ่มยาเข้าคลัง' : 'แก้ไขยา'}
        </div>
        <div style={s('padding:16px 18px;display:flex;flex-direction:column;gap:11px')}>
          <div style={s('background:#fbf1e0;border-radius:8px;padding:9px 11px;font:400 12px/1.6 Sarabun,sans-serif;color:#8a6d3b')}>
            ยาตัวนี้ใช้ร่วมกันทุกเว็บของห้องยา แก้แล้วเว็บอื่นเปลี่ยนตามทันที
          </div>
          <div>
            <label style={s(LAB)}>ชื่อยา (generic)</label>
            <input value={d.generic || ''} onChange={(e) => V.setCatField('generic', e.target.value)} style={s(FLD)} />
          </div>
          <div style={s('display:flex;gap:9px;flex-wrap:wrap')}>
            {fld('ความแรง', 'strength', '500')}
            {sel('หน่วย', 'unit', V.catUnitOpts)}
            {fld('เปอร์เซ็นต์', 'percent', '1')}
          </div>
          <div style={s('display:flex;gap:9px;flex-wrap:wrap')}>
            {sel('รูปแบบ', 'form', V.catFormOpts)}
            {sel('ทางให้ยา', 'route', V.catRouteOpts)}
            {fld('การออกฤทธิ์', 'release', 'ER, IR')}
          </div>
          <div style={s('display:flex;gap:9px;flex-wrap:wrap')}>
            {fld('ชื่อการค้า', 'brand')}
            {fld('ตัวย่อ', 'abbrev', 'CPM')}
            {fld('Preg', 'preg', 'C')}
          </div>
          <div style={s('display:flex;gap:9px;flex-wrap:wrap')}>
            {flag('ยาความเสี่ยงสูง (HAD)', 'had')}
            {flag('ปรับขนาดตามไต', 'renal')}
          </div>

          {/* ── ราคากับสีเม็ดยา — ของกลาง ย้ายเข้าคลังยาแล้ว (พี่กันสั่ง 25 ส.ค. 2569) ──
              เดิมราคาอยู่ตารางแยกของเว็บนี้เอง แก้จากป๊อปนี้ไม่ได้เลย ต้องไปหน้าจัดการราคา
              ตอนนี้แก้ได้ทุกอย่างจบในที่เดียว และทุกเว็บของห้องยาเห็นตรงกัน */}
          <div style={s('border-top:1px dashed #e3e6e1;padding-top:11px;display:flex;flex-direction:column;gap:11px')}>
            <div style={s('display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end')}>
              <div style={s('flex:1 1 150px;min-width:0')}>
                <label style={s(LAB)}>ราคาต่อหน่วย (บาท)</label>
                <input value={d.unit_price == null ? '' : d.unit_price} inputMode="decimal" placeholder="0.00"
                  onChange={(e) => V.setCatField('unit_price', e.target.value.replace(/[^0-9.]/g, ''))}
                  style={s(FLD + ';text-align:right;font-variant-numeric:tabular-nums')} />
              </div>
              <div style={s('flex:1 1 150px;min-width:0')}>
                <label style={s(LAB)}>หน่วยนับ</label>
                <input value={d.unit_th || ''} placeholder={V.catDefaultUnit || 'เม็ด'}
                  onChange={(e) => V.setCatField('unit_th', e.target.value)} style={s(FLD)} />
              </div>
            </div>

            <div style={s('display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end')}>
              <div style={s('flex:1 1 150px;min-width:0')}>
                <label style={s(LAB)}>สีเม็ดยา</label>
                <input value={d.pill_color || ''} placeholder="ส้ม · น้ำเงิน · ชมพู"
                  onChange={(e) => V.setCatField('pill_color', e.target.value)} style={s(FLD)} />
              </div>
              <div style={s('flex:1 1 150px;min-width:0')}>
                <label style={s(LAB)}>รหัสสี</label>
                <div style={s('display:flex;gap:8px;align-items:center')}>
                  <input value={d.pill_color_hex || ''} placeholder={V.catPillHint || 'เว้นว่างได้'}
                    onChange={(e) => V.setCatField('pill_color_hex', e.target.value)} style={s(FLD)} />
                  {V.catPillPreview && (
                    <span title="สีที่จะเห็นบนหน้าจอ" style={sx('width:26px;height:26px;border-radius:7px;flex:none;border:1px solid rgba(30,36,32,.18)', { background: V.catPillPreview })} />
                  )}
                </div>
              </div>
            </div>
            <div style={s('font:400 11px/1.6 Sarabun,sans-serif;color:#9aa19c')}>
              สีเม็ดยาใส่เฉพาะยาที่ผู้ผลิตแยกความแรงด้วยสีเม็ด เช่น Warfarin · พิมพ์แค่ชื่อสีไทย ระบบเติมรหัสสีให้เอง
            </div>
          </div>
        </div>
        <div style={s('border-top:1px solid #eef1ee;padding:13px 18px;display:flex;gap:9px;justify-content:flex-end')}>
          <div {...kb(V.askCloseCatEdit)} className="tap" style={s('border:1px solid #dfe5e1;background:#fff;color:#6b746e;font:600 13px Sarabun,sans-serif;padding:9px 18px;border-radius:9px;cursor:pointer')}>ยกเลิก</div>
          <div {...kb(V.saveCatEdit)} className="tap" style={sx('color:#fff;font:600 13px Sarabun,sans-serif;padding:9px 20px;border-radius:9px;cursor:pointer', { background: V.catBusy ? '#9aa19c' : '#2f7d5d' })}>
            {V.catBusy ? 'กำลังบันทึก' : 'บันทึก'}
          </div>
        </div>

        {V.catConfirmClose && (
          <div style={s('position:fixed;inset:0;background:rgba(30,36,32,.42);z-index:82;display:flex;align-items:center;justify-content:center;padding:18px')}>
            <div style={s('background:#fff;border-radius:14px;width:340px;max-width:100%;padding:18px')}>
              <div style={s('font:700 15px Sarabun,sans-serif;color:#1e2420;margin-bottom:7px')}>ปิดโดยไม่บันทึกการแก้ไข</div>
              <div style={s('font:400 13px/1.6 Sarabun,sans-serif;color:#6b746e;margin-bottom:16px')}>สิ่งที่แก้ไว้จะหายไปทั้งหมด</div>
              <div style={s('display:flex;gap:9px')}>
                <div {...kb(V.closeCatEdit)} className="tap" style={s('flex:1;text-align:center;background:#c2543c;color:#fff;font:600 13px Sarabun,sans-serif;padding:10px;border-radius:9px;cursor:pointer')}>ทิ้งการแก้ไข</div>
                <div {...kb(V.keepCatEdit)} className="tap" style={s('flex:1;text-align:center;border:1px solid #dfe5e1;background:#fff;color:#414a44;font:600 13px Sarabun,sans-serif;padding:10px;border-radius:9px;cursor:pointer')}>กลับไปแก้ต่อ</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ป๊อปยืนยันซ่อน ───────────────────────────────────────────────────────────
function renderCatHide(V) {
  return (
    <div style={s('position:fixed;inset:0;background:rgba(30,36,32,.42);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px')}>
      <div style={s('background:#fff;border-radius:14px;width:400px;max-width:100%;padding:18px')}>
        <div style={s('font:700 15px Sarabun,sans-serif;color:#1e2420;margin-bottom:8px')}>
          {V.catHideIsBack ? 'เอายากลับมาแสดง' : 'ซ่อนยาออกจากช่องค้นหา'}
        </div>
        <div style={s('font:400 13px/1.7 Sarabun,sans-serif;color:#414a44;margin-bottom:6px')}>{V.catHideName}</div>
        <div style={s('font:400 12.5px/1.7 Sarabun,sans-serif;color:#6b746e;margin-bottom:16px')}>
          {V.catHideIsBack
            ? 'ยาตัวนี้จะกลับมาให้ค้นหาและบันทึกได้ตามปกติ ทุกเว็บของห้องยา'
            : 'ยาตัวนี้จะหายจากช่องค้นหาของทุกเว็บ แต่รายการยาคืนเก่ายังแสดงชื่อได้ปกติ · เอากลับมาได้ทุกเมื่อ'}
        </div>
        <div style={s('display:flex;gap:9px')}>
          <div {...kb(V.doHideDrug)} className="tap" style={s('flex:1;text-align:center;background:#b45309;color:#fff;font:600 13px Sarabun,sans-serif;padding:10px;border-radius:9px;cursor:pointer')}>
            {V.catHideIsBack ? 'เอากลับมา' : 'ซ่อนยา'}
          </div>
          <div {...kb(V.cancelHideDrug)} className="tap" style={s('flex:1;text-align:center;border:1px solid #dfe5e1;background:#fff;color:#414a44;font:600 13px Sarabun,sans-serif;padding:10px;border-radius:9px;cursor:pointer')}>ยกเลิก</div>
        </div>
      </div>
    </div>
  );
}

// ── ป๊อปประวัติการแก้ ─────────────────────────────────────────────────────────
function renderCatLog(V) {
  return (
    <div {...kb(V.closeCatLog)} style={s('position:fixed;inset:0;background:rgba(30,36,32,.42);z-index:80;display:flex;align-items:center;justify-content:center;padding:18px')}>
      <div onClick={(e) => e.stopPropagation()} style={s('background:#fff;border-radius:16px;width:540px;max-width:100%;max-height:84vh;overflow:auto;box-shadow:0 24px 60px rgba(30,36,32,.3)')}>
        <div style={s('background:#2f7d5d;color:#fff;padding:14px 18px')}>
          <div style={s('font:700 15px Sarabun,sans-serif')}>ประวัติการแก้ไข</div>
          <div style={s('font:400 12px Sarabun,sans-serif;opacity:.85;margin-top:3px')}>{V.catLogName}</div>
        </div>
        <div style={s('padding:16px 18px')}>
          {V.catLogRows === null ? (
            <div style={s('padding:24px;text-align:center;font:400 13px Sarabun,sans-serif;color:#9aa19c')}>กำลังโหลด</div>
          ) : V.catLogRows.length === 0 ? (
            <div style={s('padding:24px;text-align:center;font:400 13px Sarabun,sans-serif;color:#9aa19c')}>ยังไม่มีการแก้ไข</div>
          ) : (
            <div style={s('display:flex;flex-direction:column;gap:11px')}>
              {V.catLogRows.map((row) => (
                <div key={row.id} style={s('border-left:3px solid #cfe0d6;padding-left:12px')}>
                  <div style={s('font:600 12.5px Sarabun,sans-serif;color:#2f7d5d')}>{row.action}</div>
                  <div style={s('font:400 11.5px Sarabun,sans-serif;color:#9aa19c;margin:2px 0 6px')}>{row.at}</div>
                  {row.changes.length === 0 ? (
                    <div style={s('font:400 12.5px Sarabun,sans-serif;color:#6b746e')}>ไม่มีช่องไหนเปลี่ยนค่า</div>
                  ) : row.changes.map((c, i) => (
                    <div key={i} style={s('font:400 12.5px/1.7 Sarabun,sans-serif;color:#414a44')}>
                      <b style={s('font-weight:600')}>{c.label}</b> — {c.from} → <b style={s('font-weight:600;color:#1e2420')}>{c.to}</b>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={s('border-top:1px solid #eef1ee;padding:12px 18px;display:flex;justify-content:flex-end')}>
          <div {...kb(V.closeCatLog)} className="tap" style={s('border:1px solid #dfe5e1;background:#fff;color:#414a44;font:600 13px Sarabun,sans-serif;padding:9px 20px;border-radius:9px;cursor:pointer')}>ปิด</div>
        </div>
      </div>
    </div>
  );
}
