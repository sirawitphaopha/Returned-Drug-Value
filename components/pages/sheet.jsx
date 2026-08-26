// ป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 513–539)
import { s, sx, kb } from '../helpers';

export function renderSheet(V) {
  if (!V.sheetOpen) return null;
  return (
    <>
      {/* 🚨 กดพื้นหลังต้องไม่ปิด — เดิมกดปิดได้ ซึ่งบนมือถือคือกับดัก
          เพราะแป้นพิมพ์บังปุ่มจนพื้นหลังเป็นที่เดียวที่กดได้
          ผู้ใช้แตะเพื่อปิดแป้นพิมพ์ = ป๊อปอัปปิดทิ้ง จำนวนที่พิมพ์หายหมด
          ใส่ปุ่ม ✕ ให้แทน */}
      <div style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:20')}></div>
      <div role="dialog" aria-modal="true" style={s('position:fixed;left:0;right:0;bottom:0;z-index:21;display:flex;justify-content:center;transform:translateY(calc(var(--kb) * -1));transition:transform .12s ease-out')}>
        <div style={s('width:100%;max-width:520px;max-height:88dvh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -14px 44px rgba(30,36,32,.24);padding:14px 20px max(22px,env(safe-area-inset-bottom))')}>
          <div style={s('width:42px;height:4px;border-radius:99px;background:rgba(30,36,32,.16);margin:0 auto 14px')}></div>

          <div style={s('display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px')}>
            <div style={s('min-width:0')}>
              <div style={s('font:600 17px/1.25 Sarabun,sans-serif;overflow-wrap:anywhere')}>{V.sheetName}</div>
              <div style={s('font:400 12.5px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{V.sheetPriceLabel}</div>
            </div>
            <div style={s('display:flex;align-items:center;gap:8px;flex:none')}>
              <div style={sx('display:flex;padding:2px;border-radius:8px', { background: V.sheetPillBg })}>
                <div {...kb(V.sheetSetReuse)} className="tap" style={sx('padding:6px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.sheetReuseBg, color: V.sheetReuseFg })}>ใช้ต่อได้</div>
                <div {...kb(V.sheetSetDestroy)} className="tap" style={sx('padding:6px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.sheetDestroyBg, color: V.sheetDestroyFg })}>ทำลาย</div>
              </div>
              <div {...kb(V.closeSheet)} aria-label="ปิดหน้าต่างใส่จำนวน" className="hv-bg-f6" style={s('width:32px;height:32px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;flex:none')}>✕</div>
            </div>
          </div>

          {/* ยานอกบัญชีโรงพยาบาล — พิมพ์ชื่อ/หน่วย/ราคาเอง
              คนไข้เอายาจาก รพ.อื่น หรือคลินิกมาคืน เดิมบันทึกไม่ได้เลย มูลค่าหายทั้งก้อน */}
          {V.sheetIsOff && (
            <div style={s('background:#f6f7f4;border-radius:11px;padding:11px 12px;margin-bottom:13px')}>
              <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:7px')}>ยานอกบัญชีโรงพยาบาล — กรอกเอง</div>
              <input value={V.offName} onChange={V.onOffName} placeholder="ชื่อยา" style={s('width:100%;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 13.5px Sarabun,sans-serif;margin-bottom:7px')} />
              <div style={s('display:flex;gap:7px')}>
                <input value={V.offUnit} onChange={V.onOffUnit} placeholder="หน่วย เช่น เม็ด" style={s('flex:1;min-width:0;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 13.5px Sarabun,sans-serif')} />
                <input value={V.offPrice} onChange={V.onOffPrice} inputMode="decimal" placeholder="ราคา/หน่วย" style={s("flex:1;min-width:0;height:40px;padding:0 11px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:400 13.5px Sarabun,sans-serif")} />
              </div>
            </div>
          )}

          {/* เหตุผลการทำลาย — โผล่เฉพาะตอนเลือก "ทำลาย"
              ผู้บริหารถามว่าที่ทำลายไปเป็นเพราะอะไร ตอนนี้ตอบได้แล้ว */}
          {V.sheetIsDestroy && (
            <div style={s('margin-bottom:13px')}>
              <div style={s('font:500 11.5px Sarabun,sans-serif;color:#6b746e;margin-bottom:6px')}>เหตุผลที่ต้องทำลาย</div>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>
                {V.sheetReasons.map((r) => (
                  <div key={r.label} {...kb(r.pick)} className="tap" style={sx('padding:7px 12px;border-radius:999px;cursor:pointer;font:500 12px Sarabun,sans-serif', { background: r.bg, color: r.fg })}>{r.label}</div>
                ))}
              </div>
            </div>
          )}

          <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:13px')}>
            <div {...kb(V.sheetDec)} className="hv-bg-f6" style={s("width:52px;height:52px;border-radius:12px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 26px Sarabun,sans-serif;color:#414a44;cursor:pointer;flex:none")}>−</div>
            <input ref={V.sheetQtyRef} value={V.sheetQty} onChange={V.onSheetQty} onKeyDown={V.onSheetKey} inputMode="numeric" style={s("flex:1;min-width:0;height:56px;text-align:center;border:none;background:transparent;font:700 40px Sarabun,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.025em;color:#1e2420")} />
            <div {...kb(V.sheetInc)} style={s("width:52px;height:52px;border-radius:12px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;font:400 26px Sarabun,sans-serif;color:#fff;cursor:pointer;flex:none")}>+</div>
          </div>

          <div style={s('text-align:center;font:400 12px Sarabun,sans-serif;color:#6b746e;margin-bottom:12px')}>{V.sheetUnit}</div>

          <div style={s('display:flex;gap:7px;margin-bottom:14px')}>
            {V.sheetPresets.map((p) => (
              <div key={p.label} {...kb(p.pick)} style={sx("flex:1;text-align:center;padding:10px 0;border-radius:9px;cursor:pointer;font:600 13.5px Sarabun,sans-serif", { background: p.bg, color: p.fg })}>{p.label}</div>
            ))}
          </div>

          <div {...kb(V.sheetConfirm)} style={s('height:54px;border-radius:12px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:600 17px Sarabun,sans-serif;cursor:pointer')}>
            {V.sheetCta} <span style={s("font:700 17px Sarabun,sans-serif;font-variant-numeric:tabular-nums")}>{V.sheetValueLabel}</span>
          </div>
        </div>
      </div>
    </>
  );
}
