// ป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 513–539)
import { s, sx, kb } from '../helpers';
import { renderDrugName } from './drugname';

export function renderSheet(V) {
  if (!V.sheetOpen) return null;
  return (
    <>
      {/* 🚨 กดพื้นหลังต้องไม่ปิด — เดิมกดปิดได้ ซึ่งบนมือถือคือกับดัก
          เพราะแป้นพิมพ์บังปุ่มจนพื้นหลังเป็นที่เดียวที่กดได้
          ผู้ใช้แตะเพื่อปิดแป้นพิมพ์ = ป๊อปอัปปิดทิ้ง จำนวนที่พิมพ์หายหมด
          ใส่ปุ่ม ✕ ให้แทน */}
      <div style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:20')}></div>
      {/* ฝั่งมือถือเรียงเป็นคอลัมน์ — ป๊อปอยู่บน แถบปุ่มคิดเลขอยู่ล่าง (ติดแป้นพิมพ์)
          🚨 ฝั่งคอมไม่ส่งค่าอะไรเพิ่ม หน้าตาเหมือนเดิมทุกจุด */}
      <div role="dialog" aria-modal="true" style={sx('position:fixed;left:0;right:0;bottom:0;z-index:21;display:flex;justify-content:center;transform:translateY(calc(var(--kb) * -1));transition:transform .12s ease-out',
        V.sheetCalcOn ? { flexDirection: 'column', alignItems: 'center' } : null)}>
        {/* ฝั่งมือถือ ระยะกันขอบล่างของเครื่อง (safe-area) ย้ายไปอยู่ที่แถบปุ่มแทน เพราะแถบอยู่ล่างสุด
            และหักความสูงแถบออกจากเพดานความสูงป๊อป ไม่งั้นรวมกันแล้วล้นจอ */}
        <div className="mrv-pop" style={sx('width:100%;max-width:520px;max-height:88dvh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -14px 44px rgba(30,36,32,.24);padding:14px 20px max(22px,env(safe-area-inset-bottom))',
          V.sheetCalcOn ? { paddingBottom: '22px', maxHeight: 'calc(88dvh - 57px)' } : null)}>
          <div style={s('width:42px;height:4px;border-radius:99px;background:rgba(30,36,32,.16);margin:0 auto 14px')}></div>

          {/* ฝั่งมือถือบีบช่องไฟหัวป๊อปให้ช่องชื่อยากว้างขึ้น (พี่กันสั่ง 24 ต.ค. 2569 "บีบช่องว่างได้นะ")
              ชื่อยาใช้ Roboto Mono ซึ่งกว้างกว่า Sarabun ราว 15% ช่องเดิมแคบจน Sulfamethoxazole ขาดกลางคำ
              🚨 ปุ่มยังสูง 44 ตามเกณฑ์จอสัมผัส บีบแค่ระยะซ้ายขวา · ฝั่งคอมไม่ส่งค่าอะไรเพิ่ม หน้าตาเหมือนเดิม */}
          <div style={sx('display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px', V.sheetCalcOn ? { gap: '8px' } : null)}>
            <div style={s('min-width:0')}>
              {/* ชื่อยาวาดด้วยตัวกลางตัวเดียวของทั้งเว็บ — สีตามสกิล drug-display (พี่กันสั่ง 24 ต.ค. 2569)
                  ยานอกบัญชีที่พิมพ์ชื่อเองไม่มีข้อมูลดิบให้แยกสี จึงคงเป็นข้อความธรรมดาเหมือนเดิม */}
              <div style={sx('font:600 17px/1.35 Sarabun,sans-serif;overflow-wrap:anywhere', { fontSize: V.sheetNameSize + 'px' })}>{V.sheetNameParts && V.sheetNameParts.mkBefore ? renderDrugName(V.sheetNameParts, { size: V.sheetNameSize + 'px', breaks: true }) : V.sheetName}</div>
              {V.sheetCalcOn ? (
                /* ฝั่งมือถือ — "ราคา ณ วันบันทึก" ขึ้นบรรทัดของตัวเอง ไม่ตกบรรทัดกลางวลี (พี่กันสั่ง 24 ต.ค. 2569) */
                <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>
                  <div>{V.sheetPriceMain}</div>
                  <div>{V.sheetPriceNote}</div>
                </div>
              ) : (
                <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{V.sheetPriceLabel}</div>
              )}
            </div>
            <div style={sx('display:flex;align-items:center;gap:8px;flex:none', V.sheetCalcOn ? { gap: '6px' } : null)}>
              <div style={sx('display:flex;padding:2px;border-radius:8px', { background: V.sheetPillBg })}>
                <div {...kb(V.sheetSetReuse)} className={V.sheetReuseOn ? 'hv-seg-on' : 'hv-txt'} style={sx('min-height:44px;min-width:70px;display:flex;align-items:center;justify-content:center;padding:6px 13px;border-radius:6px;cursor:pointer;font:600 12px/1.75 Sarabun,sans-serif', Object.assign({ background: V.sheetReuseBg, color: V.sheetReuseFg }, V.sheetSegTight))}>ใช้ต่อได้</div>
                <div {...kb(V.sheetSetDestroy)} className={V.sheetReuseOn ? 'hv-des-off' : 'hv-des-on'} style={sx('min-height:44px;min-width:70px;display:flex;align-items:center;justify-content:center;padding:6px 13px;border-radius:6px;cursor:pointer;font:600 12px/1.75 Sarabun,sans-serif', Object.assign({ background: V.sheetDestroyBg, color: V.sheetDestroyFg }, V.sheetSegTight))}>ทำลาย</div>
              </div>
              <div {...kb(V.closeSheet)} aria-label="ปิดหน้าต่างใส่จำนวน" className="hv-bg-f6" style={s('width:32px;height:32px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>✕</div>
            </div>
          </div>

          {/* ยานอกบัญชีโรงพยาบาล — พิมพ์ชื่อ/หน่วย/ราคาเอง
              คนไข้เอายาจาก รพ.อื่น หรือคลินิกมาคืน เดิมบันทึกไม่ได้เลย มูลค่าหายทั้งก้อน */}
          {V.sheetIsOff && (
            <div style={s('background:#f6f7f4;border-radius:11px;padding:11px 12px;margin-bottom:13px')}>
              <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:7px')}>ยานอกบัญชีโรงพยาบาล — กรอกเอง</div>
              <input value={V.offName} onChange={V.onOffName} placeholder="ชื่อยา" style={s('width:100%;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 16px Sarabun,sans-serif;margin-bottom:7px')} />
              <div style={s('display:flex;gap:7px')}>
                <input value={V.offUnit} onChange={V.onOffUnit} placeholder="หน่วย เช่น เม็ด" style={s('flex:1;min-width:0;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 16px Sarabun,sans-serif')} />
                <input value={V.offPrice} onChange={V.onOffPrice} inputMode="decimal" placeholder="ราคา/หน่วย" style={s("flex:1;min-width:0;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 16px Sarabun,sans-serif")} />
              </div>
            </div>
          )}

          {/* เหตุผลการทำลาย — โผล่เฉพาะตอนเลือก "ทำลาย"
              ผู้บริหารถามว่าที่ทำลายไปเป็นเพราะอะไร ตอนนี้ตอบได้แล้ว */}
          {V.sheetIsDestroy && (
            <div style={s('margin-bottom:13px')}>
              <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:6px')}>เหตุผลที่ต้องทำลาย</div>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>
                {V.sheetReasons.map((r) => (
                  <div key={r.label} {...kb(r.pick)} className={r.on ? 'hv-des-off' : 'hv-seg-off'} title={r.help}
                    style={sx('padding:9px 12px;border-radius:999px;cursor:pointer;font:500 12px/1.75 Sarabun,sans-serif', { background: r.bg, color: r.fg })}>{r.label}</div>
                ))}
              </div>
              {/* 🚨 คำอธิบายโผล่ใต้แถวชิปของตัวที่เลือกอยู่ ไม่ยัดลงในชิปทุกอัน
                  ชิป 12 อันพร้อมคำอธิบายจะยาวจนล้นจอมือถือ และอ่านไม่ทันอยู่ดี */}
              {V.sheetReasonHelp && (
                <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;background:#f6f7f4;border-radius:8px;padding:8px 10px;margin-top:7px')}>{V.sheetReasonHelp}</div>
              )}
            </div>
          )}

          <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:13px')}>
            <div {...kb(V.sheetDec)} className="hv-bg-f6" style={s("width:52px;height:52px;border-radius:12px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 26px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none")}>−</div>
            {V.sheetCalcOn ? (
              /* ฝั่งมือถือ — ช่องคิดเลขได้ (พี่กันเลือกแบบ ค · 24 ต.ค. 2569)
                 🚨 ช่องกรอกทำสีต่างเฉพาะบางส่วนไม่ได้ เฉลยแล้วจึงวาดข้อความซ้อนทับ แล้วซ่อนตัวอักษรจริง
                    ฟอนต์ ขนาด ระยะตัวอักษร ระยะขอบ ต้องชุดเดียวกันทั้งสองชั้น ไม่งั้นขีดกะพริบเหลื่อม
                 🚨 ระยะในต้องเป็น 0 ทั้งสองชั้น — ระยะในตั้งต้นของเบราว์เซอร์ทำให้สองชั้นไม่ตรงกัน
                 🚨 ช่องต้องมีเส้นกรอบเทาของตัวเองตลอดเวลา (พี่กันสั่ง 24 ต.ค. 2569 "มันควรเป็นกรอบว่าง")
                    เดิมไม่มีเส้นเลย เห็นแค่เส้นโฟกัสสีเขียวตอนพิมพ์ ปิดแป้นตัวเลขแล้วเหลือแต่ที่ว่างสีขาว
                    เส้นเทาหนา 1 ชุดเดียวกับปุ่ม − ข้างช่อง · ตอนพิมพ์มีเส้นโฟกัสเขียวครอบอีกชั้นเหมือนช่องค้นหา
                    ชั้นที่วาดทับต้องมีเส้นใสหนาเท่ากัน ตัวอักษรสองชั้นถึงจะตรงกัน
                 ขนาดตัวเลขย่อลงเองเมื่อสูตรยาว (V.sheetQtyFont) */
              <div style={s('flex:1;min-width:0;height:56px;position:relative')}>
                <input ref={V.sheetQtyRef} className="mrv-qty-big" value={V.sheetQty} onChange={V.onSheetQty} onKeyDown={V.onSheetKey}
                  onScroll={V.onSheetQtyScroll} onBlur={V.onSheetQtyBlur} inputMode="numeric" autoComplete="off" aria-label="จำนวน"
                  style={sx("width:100%;height:56px;padding:0;text-align:center;border:1px solid rgba(30,36,32,.14);border-radius:12px;background:#fff;font:700 40px Sarabun,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.025em;color:#1e2420;caret-color:#1e2420",
                    { fontSize: V.sheetQtyFont + 'px', color: V.sheetQtyResolved ? 'transparent' : '#1e2420' })} />
                {V.sheetQtyResolved && (
                  /* สูตรสีเทา ผลลัพธ์เขียวเด่น — ต่อกันแล้วต้องเป็นข้อความเดียวกับในช่องเป๊ะ ๆ */
                  <div ref={V.sheetQtyLayerRef} aria-hidden="true"
                    style={sx("position:absolute;left:0;right:0;top:0;height:56px;padding:0;border:1px solid transparent;border-radius:12px;pointer-events:none;overflow:hidden;white-space:pre;text-align:center;font:700 40px Sarabun,sans-serif;line-height:54px;font-variant-numeric:tabular-nums;letter-spacing:-.025em",
                      { fontSize: V.sheetQtyFont + 'px' })}>
                    <span style={s('color:#6f7873')}>{V.sheetQtyExprLeft}</span>
                    <span style={s('color:#2f7d5d')}>{V.sheetQtyAnswerTail}</span>
                  </div>
                )}
              </div>
            ) : (
              <input ref={V.sheetQtyRef} className="mrv-qty-big" value={V.sheetQty} onChange={V.onSheetQty} onKeyDown={V.onSheetKey} inputMode="numeric" style={s("flex:1;min-width:0;height:56px;text-align:center;border:none;background:transparent;font:700 40px Sarabun,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.025em;color:#1e2420")} />
            )}
            <div {...kb(V.sheetInc)} className="hv-teal" style={s("width:52px;height:52px;border-radius:12px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;font:400 26px Sarabun,sans-serif;color:#fff;cursor:pointer;flex:none")}>+</div>
          </div>

          {/* 🚨 เกินเพดานแล้วต้องบอก ไม่ใช่แอบตัดค่าให้ (พี่กันเลือกแบบ ก · 1 ก.ย. 2569)
              พี่กันพิมพ์ 3000000000 แล้วมันกลายเป็น 100000 เงียบ ๆ
              ถ้าเป็นการกรอกจริงอาจไม่ทันสังเกตว่าเลขเปลี่ยน แล้วยอดรายงานเพี้ยน */}
          {V.sheetOverMsg ? (
            <div role="alert" style={s('text-align:center;font:600 12px/1.75 Sarabun,sans-serif;color:#c2543c;margin-bottom:12px')}>{V.sheetOverMsg}</div>
          ) : (
            <div style={s('text-align:center;font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:12px')}>
              {/* ตัวเลขรวมที่รันไปเรื่อย ๆ ระหว่างกด + (เหมือนป้าย "รวม" ฝั่งคอม) — เฉลยแล้วผลลัพธ์อยู่ในช่องแทน */}
              {V.sheetCalcSumOn && <>รวม <span style={s('color:#2f7d5d;font-weight:700')}>{V.sheetCalcSum}</span> </>}
              {V.sheetUnit}
            </div>
          )}

          <div style={s('display:flex;gap:7px;margin-bottom:14px')}>
            {V.sheetPresets.map((p) => (
              <div key={p.label} {...kb(p.pick)} className="hv-bg-f6" style={sx("flex:1;text-align:center;padding:10px 0;border-radius:9px;cursor:pointer;font:600 13.5px/1.75 Sarabun,sans-serif", { background: p.bg, color: p.fg })}>{p.label}</div>
            ))}
          </div>

          <div {...kb(V.sheetOverMax ? (() => {}) : V.sheetConfirm)} className={V.sheetOverMax ? '' : 'hv-teal'}
            style={sx('height:54px;border-radius:12px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:600 17px Sarabun,sans-serif;cursor:pointer', V.sheetOverMax ? { background: '#e9ebe8', color: '#8a938d', cursor: 'default' } : null)}>
            {V.sheetCta} <span style={s("font:700 17px Sarabun,sans-serif;font-variant-numeric:tabular-nums")}>{V.sheetValueLabel}</span>
          </div>
        </div>

        {/* ── แถบปุ่ม + − = ติดบนแป้นพิมพ์ (มือถือเท่านั้น · พี่กันเลือกแบบ ค 24 ต.ค. 2569) ──
            แป้นตัวเลขของ iPhone ไม่มี + − และไม่มีปุ่ม Enter จึงต้องมีปุ่มของเว็บเอง
            🚨 หน้าตาเดียวกับปุ่มบนแป้นของเครื่อง (พื้นเทาแป้น ปุ่มขาว เงาล่าง) ให้ดูเป็นส่วนหนึ่งของแป้น
            🚨 กดแล้วช่องตัวเลขต้องไม่หลุดโฟกัส (sheetCalcHold) ไม่งั้นแป้นพับลงแล้วแถบตกไปล่างจอ
            🚨 ระยะล่างหักความสูงแป้นออก — แป้นเปิดอยู่ได้ 6 จุด · แป้นปิดได้ระยะกันขอบล่างของเครื่อง
            🚨 ห้ามใส่คลาส .tap ปุ่มห่างกัน 6 จุด พื้นที่กดจะทับกัน (กฎข้อ 3.55) ปุ่มสูง 44 ถึงเกณฑ์อยู่แล้ว */}
        {V.sheetCalcOn && (
          <div onPointerDown={V.sheetCalcHold} onMouseDown={V.sheetCalcHold}
            style={s('width:100%;max-width:520px;display:flex;gap:6px;background:#d1d3d9;border-top:1px solid rgba(0,0,0,.08);padding:7px 6px max(6px,calc(env(safe-area-inset-bottom,0px) - var(--kb)))')}>
            {V.sheetCalcKeys.map((c) => (
              <div key={c.k} {...kb(c.press)} aria-label={c.label} className={c.eq ? 'hv-teal' : 'hv-bg-f6'}
                style={c.eq
                  ? s('flex:1;height:44px;border-radius:6px;background:#2f7d5d;color:#fff;box-shadow:0 1px 0 #1f5a42;display:flex;align-items:center;justify-content:center;font:600 26px/1 -apple-system,"Helvetica Neue",Sarabun,sans-serif;cursor:pointer')
                  : s('flex:1;height:44px;border-radius:6px;background:#fff;color:#000;box-shadow:0 1px 0 #898a8d;display:flex;align-items:center;justify-content:center;font:400 26px/1 -apple-system,"Helvetica Neue",Sarabun,sans-serif;cursor:pointer')}>
                {c.k}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
