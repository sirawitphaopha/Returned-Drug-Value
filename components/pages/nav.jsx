// แถบเมนู — คัดจากมอคอัป มือถืออยู่ล่างจอ (บรรทัด 478–489) คอมอยู่บนจอ (490–511)
import { s, sx } from '../helpers';

export function renderNavNarrow(V) {
  return (
    <div style={s('flex:none;background:#fff;border-top:1px solid rgba(30,36,32,.08);padding:8px 0 max(14px,env(safe-area-inset-bottom));order:2')}>
      <div style={s('max-width:520px;margin:0 auto;display:flex;justify-content:space-around')}>
        {V.tabs.map((t) => (
          <div key={t.label} onClick={t.pick} style={sx('display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px 18px;cursor:pointer;font:600 11px Sarabun,sans-serif', { color: t.fg })}>
            <span style={{ width: '20px', height: '20px', border: '2px solid ' + t.fg, borderRadius: t.radius }}></span>{t.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderNavWide(V) {
  return (
    <div style={s('flex:none;order:-1;display:flex;align-items:center;justify-content:space-between;padding:12px 26px;background:#fff;border-bottom:1px solid rgba(30,36,32,.08);position:relative;z-index:6')}>
      <div style={s('display:flex;align-items:center;gap:24px')}>
        <div style={s('display:flex;align-items:center;gap:9px')}>
          <div style={s('width:30px;height:30px;border-radius:8px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;position:relative;flex:none')}>
            <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
            <span style={s("font:700 13px 'IBM Plex Sans Thai',sans-serif;color:#fff;line-height:1")}>฿</span>
          </div>
          <div style={s('font:700 16px Sarabun,sans-serif')}>มูลค่ายาคืน</div>
        </div>
        <div style={s('display:flex;gap:5px')}>
          {V.tabs.map((tw) => (
            <div key={tw.label} onClick={tw.pick} style={sx('padding:7px 15px;border-radius:8px;font:600 14px Sarabun,sans-serif;cursor:pointer', { background: tw.navBg, color: tw.navFg })}>{tw.label}</div>
          ))}
        </div>
      </div>
      <div style={s('display:flex;align-items:center;gap:12px')}>
        <span style={s("font:500 13px 'IBM Plex Sans Thai',sans-serif;color:#6b746e")}>{V.dateLabel} · {V.orgName}</span>
        <div onClick={V.openSettings} className="hv-bg-f6" style={s('width:34px;height:34px;border-radius:8px;border:1px solid rgba(30,36,32,.14);display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>⋯</div>
      </div>
    </div>
  );
}
