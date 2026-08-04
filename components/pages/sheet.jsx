// ป๊อปอัปใส่จำนวน — คัดจากมอคอัป (บรรทัด 513–539)
import { s, sx } from '../helpers';

export function renderSheet(V) {
  if (!V.sheetOpen) return null;
  return (
    <>
      <div onClick={V.closeSheet} style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:20')}></div>
      <div style={s('position:fixed;left:0;right:0;bottom:0;z-index:21;display:flex;justify-content:center')}>
        <div style={s('width:100%;max-width:520px;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -14px 44px rgba(30,36,32,.24);padding:14px 20px max(22px,env(safe-area-inset-bottom))')}>
          <div style={s('width:42px;height:4px;border-radius:99px;background:rgba(30,36,32,.16);margin:0 auto 14px')}></div>

          <div style={s('display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px')}>
            <div style={s('min-width:0')}>
              <div style={s('font:600 17px/1.25 Sarabun,sans-serif')}>{V.sheetName}</div>
              <div style={s('font:400 12.5px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{V.sheetPriceLabel}</div>
            </div>
            <div style={sx('display:flex;padding:2px;border-radius:8px;flex:none', { background: V.sheetPillBg })}>
              <div onClick={V.sheetSetReuse} style={sx('padding:6px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.sheetReuseBg, color: V.sheetReuseFg })}>ใช้ต่อได้</div>
              <div onClick={V.sheetSetDestroy} style={sx('padding:6px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.sheetDestroyBg, color: V.sheetDestroyFg })}>ทำลาย</div>
            </div>
          </div>

          <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:13px')}>
            <div onClick={V.sheetDec} className="hv-bg-f6" style={s("width:52px;height:52px;border-radius:12px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:400 26px 'IBM Plex Sans Thai',sans-serif;color:#414a44;cursor:pointer;flex:none")}>−</div>
            <input ref={V.sheetQtyRef} value={V.sheetQty} onChange={V.onSheetQty} onKeyDown={V.onSheetKey} inputMode="numeric" style={s("flex:1;min-width:0;height:56px;text-align:center;border:none;background:transparent;font:700 40px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.025em;color:#1e2420")} />
            <div onClick={V.sheetInc} style={s("width:52px;height:52px;border-radius:12px;background:#1e2420;display:flex;align-items:center;justify-content:center;font:400 26px 'IBM Plex Sans Thai',sans-serif;color:#fff;cursor:pointer;flex:none")}>+</div>
          </div>

          <div style={s('text-align:center;font:400 12px Sarabun,sans-serif;color:#6b746e;margin-bottom:12px')}>{V.sheetUnit}</div>

          <div style={s('display:flex;gap:7px;margin-bottom:14px')}>
            {V.sheetPresets.map((p) => (
              <div key={p.label} onClick={p.pick} style={sx("flex:1;text-align:center;padding:10px 0;border-radius:9px;cursor:pointer;font:600 13.5px 'IBM Plex Sans Thai',sans-serif", { background: p.bg, color: p.fg })}>{p.label}</div>
            ))}
          </div>

          <div onClick={V.sheetConfirm} style={s('height:54px;border-radius:12px;background:#2f7d5d;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:600 17px Sarabun,sans-serif;cursor:pointer')}>
            {V.sheetCta} <span style={s("font:700 17px 'IBM Plex Sans Thai',sans-serif;font-variant-numeric:tabular-nums")}>{V.sheetValueLabel}</span>
          </div>
        </div>
      </div>
    </>
  );
}
