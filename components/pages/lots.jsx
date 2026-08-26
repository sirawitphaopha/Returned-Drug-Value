// หน้ารายการ Lot + ใบสรุป Lot สำหรับพิมพ์
// ใช้ภาษาภาพชุดเดียวกับหน้าประวัติ (สี ระยะ ความโค้ง) จะได้ไม่รู้สึกเป็นคนละเว็บ
import { s, sx, kb } from '../helpers';

export function renderLots(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:20px 26px 26px;display:flex;flex-direction:column;min-height:100%')}>
      <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px')}>
        <div {...kb(V.closeLots)} aria-label="กลับไปหน้าประวัติ" className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>←</div>
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

      <div style={s('font:600 11px Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45);margin-bottom:8px')}>{V.lotsCountLabel}</div>

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
            {/* 🚨 ต้องเป็นความกว้างคงที่ ไม่ใช่ min-width — ไม่งั้นกล่องนี้ยืดตามความยาวชื่อคน
                   แล้วคอลัมน์ "X รายการ" ของแต่ละแถวจะไม่ตรงกัน (วัดจริงเหลื่อมกัน 23px)
                   ชื่อยาวสุดที่วัดได้คือ "24 ส.ค. 2569 · ภญ. วลัยพรรณ ชิณวงษ์" = 180px
                   ตั้ง 208px เผื่อชื่อยาวกว่านี้ · ยาวเกินก็ขึ้นบรรทัดใหม่ ไม่ตัดทิ้ง
                   เพราะชื่อผู้บันทึกเป็นข้อมูลสืบกลับ ซ่อนไม่ได้ (พี่กันทัก 25 ส.ค. 2569) */}
            <div style={s('width:208px;flex:none;min-width:0')}>
              <div style={s("font:700 15px Sarabun,sans-serif;color:#2f7d5d")}>{l.lot}</div>
              <div style={s('font:400 11.5px Sarabun,sans-serif;color:#6b746e;margin-top:1px;overflow-wrap:anywhere')}>{l.dateLabel} · {l.by}{l.siteLabel ? ' · รพ.สต.' + l.siteLabel : ''}</div>
            </div>

            <div style={s('width:82px;flex:none;font:500 12.5px Sarabun,sans-serif;color:#414a44;text-align:right')}>{l.itemsLabel}</div>

            <div style={s('display:flex;align-items:baseline;gap:10px;margin-left:auto;flex-wrap:wrap')}>
              <div style={s('text-align:right')}>
                <div style={s("font:600 15px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums")}>{l.savedLabel}</div>
                <div style={s('font:400 10.5px Sarabun,sans-serif;color:#9aa19c')}>ใช้ต่อได้</div>
              </div>
              {l.hasLost && (
                <div style={s('text-align:right')}>
                  <div style={s("font:600 13px Sarabun,sans-serif;color:#c2543c;font-variant-numeric:tabular-nums")}>{l.lostLabel}</div>
                  <div style={s('font:400 10.5px Sarabun,sans-serif;color:#9aa19c')}>ทำลาย</div>
                </div>
              )}
            </div>

            <div style={s('display:flex;gap:7px;flex:none')}>
              {/* ปุ่มแก้ไข — สีอำพันต่างจากอีกสองปุ่มโดยตั้งใจ เพราะเป็นปุ่มเดียวที่เปลี่ยนข้อมูลจริง
                  อีกสองปุ่มเป็นแค่การเปิดดู กดผิดแล้วไม่มีอะไรเสียหาย (พี่กันเคาะ 25 ส.ค. 2569) */}
              <div {...kb(l.openEdit)} className="tap" title="แก้ไขล็อตนี้"
                style={s('height:36px;padding:0 12px;border-radius:9px;border:1px solid rgba(150,101,15,.30);background:#fdf6e9;color:#96650f;display:flex;align-items:center;gap:6px;font:600 12.5px Sarabun,sans-serif;cursor:pointer')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
                แก้ไข
              </div>
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

  // ── สไตล์ตารางแบบเอกสารราชการ ────────────────────────────────────────────
  //
  // พี่กันทัก 26 ส.ค. 2569: "เอกสารราชการ ใช้ตารางแบบนี้เหรอ"
  // แล้วสั่ง "เอกสารอ่ะ วาดใหม่ จัดเรียงใหม่เลย ส่วนในเว็บก็ทำตารางคล้าย ๆ กันด้วย
  //          เฉพาะหน้าแสดง ตารางอื่นในเว็บห้ามแตะ"
  //
  // ตารางในเอกสารราชการไทยมี "เส้นกรอบครบทุกด้าน" ทุกช่อง ไม่ใช่เส้นใต้อย่างเดียว
  // แบบเส้นใต้เป็นสไตล์เว็บสมัยใหม่ ซึ่งดูไม่เป็นเอกสารเมื่อพิมพ์ลงกระดาษ
  //
  // 🚨 ตารางนี้ใช้เฉพาะในใบสรุป — ตารางหน้าบันทึก ประวัติ คลังยา ห้ามแตะ (พี่กันสั่ง)
  const LINE = '1px solid #1e2420';
  const TH = 'border:' + LINE + ';padding:6px 7px;font:700 12.5px Sarabun,sans-serif;background:#eef1ee;text-align:center';
  const TD = 'border:' + LINE + ';padding:6px 7px;font:400 12.5px Sarabun,sans-serif';
  const NUM = TD + ';text-align:right;font-variant-numeric:tabular-nums';
  const MID = TD + ';text-align:center';
  // แถวยอดรวมอยู่ในตารางเลย ไม่ลอยข้างนอก — เอกสารราชการนับยอดในกรอบเดียวกับข้อมูล
  const SUM = 'border:' + LINE + ';padding:7px;font:700 13px Sarabun,sans-serif;background:#f6f7f4';

  return (
    <div className="slip-backdrop" role="dialog" aria-modal="true" style={s('position:fixed;inset:0;z-index:60;background:rgba(30,36,32,.45);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto')}>
      <div className="slip-sheet" style={s('width:100%;max-width:760px;background:#fff;border-radius:14px;overflow:hidden')}>

        <div className="slip-hide" style={s('display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid rgba(30,36,32,.1);background:#f6f7f4')}>
          <div style={s('font:700 15px Sarabun,sans-serif;flex:1;min-width:0')}>ใบสรุป Lot</div>
          <div {...kb(V.printLotSlip)} className="hv-teal tap" style={s('height:38px;padding:0 16px;border-radius:9px;background:#2f7d5d;color:#fff;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;cursor:pointer')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M6 9V3h12v6" /><path d="M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" />
            </svg>
            พิมพ์
          </div>
          {/* บันทึก PDF — ใช้ตัวแปลงของเบราว์เซอร์ ต่างกันแค่ตั้งชื่อไฟล์ให้ก่อน
              (ดูเหตุผลที่ไม่ลงตัวสร้าง PDF เพิ่ม ใน handlers/lots.js) */}
          <div {...kb(V.savePdf)} className="hv-bg-f6 tap"
            style={s('height:38px;padding:0 14px;border-radius:9px;border:1px solid rgba(30,36,32,.16);background:#fff;color:#2f7d5d;display:flex;align-items:center;gap:7px;font:600 13px Sarabun,sans-serif;cursor:pointer')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
            </svg>
            บันทึก PDF
          </div>
          <div {...kb(V.closeLotSlip)} aria-label="ปิดใบสรุป" className="hv-bg-f6" style={s('width:36px;height:36px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>✕</div>
        </div>

        <div style={s('padding:26px 30px 30px')}>

          {/* ── ส่วนหัว ────────────────────────────────────────────────────────
              ชื่อหน่วยงานบนสุด แล้วชื่อเอกสารตัวใหญ่ ทั้งคู่จัดกึ่งกลาง
              เป็นรูปแบบเดียวกับหนังสือราชการทั่วไป เอาเข้าแฟ้มแล้วเข้าชุดกัน */}
          <div style={s('text-align:center;margin-bottom:16px')}>
            <div style={s('font:600 13.5px/1.55 Sarabun,sans-serif;color:#1e2420;overflow-wrap:anywhere')}>{V.slipOrg}</div>
            <div role="heading" aria-level="1" style={s('font:700 20px/1.4 Sarabun,sans-serif;margin-top:4px')}>ใบสรุปรายการยาคืน</div>
          </div>

          {/* ── ตารางข้อมูลหัวเรื่อง ────────────────────────────────────────────
              🚨 เอกสารราชการใส่ข้อมูลหัวเรื่องในตารางเหมือนกัน ไม่ปล่อยเป็นข้อความลอย
                 เพื่อให้ตำแหน่งของแต่ละช่องคงที่ ตรวจสอบย้อนหลังได้ว่าอะไรอยู่ตรงไหน */}
          <table style={s('width:100%;border-collapse:collapse;margin-bottom:14px')}>
            <tbody>
              <tr>
                <td style={s(TD + ';width:110px;background:#f6f7f4;font-weight:600')}>เลขที่เอกสาร</td>
                <td style={s(TD)}>{V.slipDocNo}</td>
                <td style={s(TD + ';width:110px;background:#f6f7f4;font-weight:600')}>เลข Lot</td>
                <td style={s(TD + ';font-weight:600')}>{V.slipLot}</td>
              </tr>
              <tr>
                <td style={s(TD + ';background:#f6f7f4;font-weight:600')}>วันที่รับคืน</td>
                <td style={s(TD)}>{V.slipDate}</td>
                <td style={s(TD + ';background:#f6f7f4;font-weight:600')}>แหล่งที่มา</td>
                <td style={s(TD)}>{V.slipSrcLabel}</td>
              </tr>
              <tr>
                <td style={s(TD + ';background:#f6f7f4;font-weight:600')}>ผู้บันทึก</td>
                <td style={s(TD)}>{V.slipBy}</td>
                <td style={s(TD + ';background:#f6f7f4;font-weight:600')}>จำนวนรายการ</td>
                <td style={s(TD)}>{V.slipCountLabel}</td>
              </tr>
            </tbody>
          </table>

          {V.slipLoading && (
            <div style={s('text-align:center;padding:30px;font:400 13px Sarabun,sans-serif;color:#6b746e')}>กำลังโหลดรายการยา</div>
          )}

          {/* ── ตารางรายการยา ─────────────────────────────────────────────────
              เส้นกรอบครบทุกช่อง หัวตารางพื้นเทาจัดกึ่งกลาง ตามแบบเอกสารราชการ
              🚨 ยอดรวมอยู่ในตารางเป็นแถวสุดท้าย ไม่ลอยอยู่ข้างนอกแบบเดิม */}
          {!V.slipLoading && (
            <table style={s('width:100%;border-collapse:collapse')}>
              <thead>
                <tr>
                  <th style={s(TH + ';width:34px')}>ที่</th>
                  <th style={s(TH)}>รายการยา</th>
                  <th style={s(TH + ';width:76px')}>HN</th>
                  <th style={s(TH + ';width:88px')}>จำนวน</th>
                  <th style={s(TH + ';width:78px')}>ราคา/หน่วย</th>
                  <th style={s(TH + ';width:88px')}>มูลค่า</th>
                  <th style={s(TH + ';width:74px')}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {V.slipRows.map((r) => (
                  <tr key={r.key}>
                    <td style={s(MID + ';color:#6b746e')}>{r.no}</td>
                    <td style={s(TD + ';overflow-wrap:anywhere')}>{r.name}</td>
                    <td style={s(MID + ';color:#414a44')}>{r.hn}</td>
                    <td style={s(NUM)}>{r.qtyLabel}</td>
                    <td style={s(NUM + ';color:#414a44')}>{r.priceLabel}</td>
                    <td style={s(NUM + ';font-weight:600')}>{r.valueLabel}</td>
                    <td style={sx(MID + ';font-weight:600', { color: r.dispColor })}>{r.dispLabel}</td>
                  </tr>
                ))}

                {/* แถวยอดรวม — อยู่ในกรอบตารางเดียวกับข้อมูล */}
                <tr>
                  <td colSpan="5" style={s(SUM + ';text-align:right')}>รวมมูลค่ายาที่ใช้ต่อได้</td>
                  <td style={s(SUM + ';text-align:right;font-variant-numeric:tabular-nums')}>{V.slipSavedLabel}</td>
                  <td style={s(SUM)}></td>
                </tr>
                {V.slipHasLost && (
                  <tr>
                    <td colSpan="5" style={s(SUM + ';text-align:right')}>รวมมูลค่ายาที่ต้องทำลาย</td>
                    <td style={s(SUM + ';text-align:right;font-variant-numeric:tabular-nums')}>{V.slipLostLabel}</td>
                    <td style={s(SUM)}></td>
                  </tr>
                )}
                <tr>
                  <td colSpan="5" style={s(SUM + ';text-align:right;background:#e7f2ec')}>รวมทั้งสิ้น</td>
                  <td style={s(SUM + ';text-align:right;background:#e7f2ec;font-variant-numeric:tabular-nums')}>{V.slipTotalLabel}</td>
                  <td style={s(SUM + ';background:#e7f2ec')}></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* วันเวลาที่พิมพ์ — โผล่เฉพาะตอนสั่งพิมพ์จริง ไม่รกจอตอนดูบนหน้าจอ
              ผู้ตรวจสอบต้องรู้ว่าใบในมือพิมพ์เมื่อไร เพราะยอดเปลี่ยนได้ถ้ามีคนแก้ล็อตย้อนหลัง */}
          {V.slipPrintedAt && (
            <div style={s('font:400 11.5px Sarabun,sans-serif;color:#414a44;margin-top:8px;text-align:right')}>
              พิมพ์เมื่อ {V.slipPrintedAt}
            </div>
          )}

          {/* ── ช่องลงนาม 3 ฝ่าย ─────────────────────────────────────────────
              เอกสารยาคืนของโรงพยาบาลต้องมีทั้งคนที่ส่งมอบยา คนที่รับเข้าห้องยา
              และหัวหน้าที่ตรวจสอบยอด
              🚨 ห้ามยุบเหลือ 2 ช่อง — ผู้บันทึกเป็นผู้ปฏิบัติ ส่วนผู้ตรวจสอบเป็นผู้รับรองยอด */}
          <div className="slip-sign" style={s('display:flex;gap:26px;flex-wrap:wrap;margin-top:44px;font:400 11.5px Sarabun,sans-serif;color:#414a44')}>
            <div style={s('flex:1 1 160px;text-align:center')}>
              <div style={s('border-bottom:1px dotted #1e2420;height:32px')}></div>
              <div style={s('margin-top:7px')}>( ................................................ )</div>
              <div style={s('margin-top:4px;font-weight:600')}>ผู้ส่งมอบยา</div>
              <div style={s('margin-top:2px;color:#6b746e')}>วันที่ ......... / ......... / .........</div>
            </div>
            <div style={s('flex:1 1 160px;text-align:center')}>
              <div style={s('border-bottom:1px dotted #1e2420;height:32px')}></div>
              <div style={s('margin-top:7px')}>( {V.slipBy} )</div>
              <div style={s('margin-top:4px;font-weight:600')}>ผู้บันทึกรับคืน</div>
              <div style={s('margin-top:2px;color:#6b746e')}>วันที่ ......... / ......... / .........</div>
            </div>
            <div style={s('flex:1 1 160px;text-align:center')}>
              <div style={s('border-bottom:1px dotted #1e2420;height:32px')}></div>
              <div style={s('margin-top:7px')}>( ................................................ )</div>
              <div style={s('margin-top:4px;font-weight:600')}>ผู้ตรวจสอบ</div>
              <div style={s('margin-top:2px;color:#6b746e')}>วันที่ ......... / ......... / .........</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
