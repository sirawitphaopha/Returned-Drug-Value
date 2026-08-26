// แถบเมนู — คัดจากมอคอัป มือถืออยู่ล่างจอ (บรรทัด 478–489) คอมอยู่บนจอ (490–511)
import { s, sx, kb } from '../helpers';

export function renderNavNarrow(V) {
  return (
    <div role="navigation" aria-label="เมนูหลัก" ref={V.navBarRef} style={s('flex:none;background:#fff;border-top:1px solid rgba(30,36,32,.08);padding:8px 0 max(14px,env(safe-area-inset-bottom));order:2')}>
      {/* 🚨 ต้องมีสวิตช์มุมมองในแถบล่างด้วย เฉพาะตอนที่จอกว้างจริงแต่ถูกบังคับดูแบบมือถือ
          ไม่งั้นกดสลับเป็น "มือถือ" แล้วสวิตช์หายไปกับแถบบน = ติดอยู่ในโหมดมือถือถาวร */}
      {V.showLayoutSwitch && (
        <div style={s('max-width:520px;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;gap:7px')}>
          <span style={s("font:500 10.5px Sarabun,sans-serif;letter-spacing:.06em;color:#6f7873")}>มุมมอง</span>
          <div style={s('display:flex;padding:2px;border-radius:8px;background:#f0f1ee;gap:2px')}>
            <div {...kb(V.useDesktop)} className="tap" style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutDeskBg, color: V.layoutDeskFg })}>คอม</div>
            <div {...kb(V.useMobile)} className="tap" style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutMobBg, color: V.layoutMobFg })}>มือถือ</div>
          </div>
        </div>
      )}
      <div style={s('max-width:520px;margin:0 auto;display:flex;justify-content:space-around')}>
        {V.tabs.map((t) => (
          <div key={t.label} {...kb(t.pick)} style={sx('display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px 18px;cursor:pointer;font:600 11px Sarabun,sans-serif', { color: t.fg })}>
            <span style={{ width: '20px', height: '20px', border: '2px solid ' + t.fg, borderRadius: t.radius }}></span>{t.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// แถบเมนูบนของคอม
// 🚨 แถบสีขาวต้องกว้างเต็มจอ (ไม่งั้นเห็นพื้นหลังโผล่ข้าง ๆ) แต่ "เนื้อหาข้างใน" ต้องจำกัดความกว้าง
//    ให้เท่ากับเนื้อหาของหน้า (1400px) ไม่งั้นบนจอ 1920px โลโก้กับวันที่จะหลุดไปคนละมุมจอ
//    ไม่ตรงแนวกับตารางข้างล่าง ตากวาดหาไม่เจอ
//    จึงแยกเป็นสองชั้น: ชั้นนอกพื้นขาวเต็มจอ · ชั้นในจำกัดความกว้างแล้วจัดกึ่งกลาง
export function renderNavWide(V) {
  return (
    <div role="navigation" aria-label="เมนูหลัก" style={s('flex:none;order:-1;background:#fff;border-bottom:1px solid rgba(30,36,32,.08);position:relative;z-index:6')}>
    <div style={s('width:100%;max-width:1400px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 26px')}>
      <div style={s('display:flex;align-items:center;gap:24px')}>
        {/* กดชื่อเว็บแล้วกลับหน้าแรก · สีตอนชี้อยู่ในคลาส .hv-home ของ globals.css */}
        <div {...kb(V.goHome)} aria-label="กลับไปหน้าบันทึก" className="hv-home"
          style={s('display:flex;align-items:center;gap:9px;cursor:pointer;border-radius:9px;margin:-4px -7px;padding:4px 7px')}>
          <div style={s('width:30px;height:30px;border-radius:8px;background:#2f7d5d;display:flex;align-items:center;justify-content:center;position:relative;flex:none')}>
            <div style={s('position:absolute;inset:4px;border:1.6px solid rgba(255,255,255,.45);border-radius:50%;border-top-color:transparent;transform:rotate(-38deg)')}></div>
            <span style={s("font:700 13px Sarabun,sans-serif;color:#fff;line-height:1")}>฿</span>
          </div>
          <div style={s('font:700 19px/1.95 Charmonman,cursive')}>มูลค่ายาคืน</div>
        </div>
        {/* กรอบจาง ๆ ให้เห็นว่าเป็นปุ่ม + เข้มขึ้นตอนเอาเมาส์ชี้ (พี่กันสั่ง)
            สีตอนชี้อยู่ใน .tab-btn ที่ globals.css ไม่ใช่ที่นี่ เพราะ React ทำ :hover ในสไตล์ไม่ได้ */}
        <div style={s('display:flex;gap:6px')}>
          {V.tabs.map((tw) => (
            <div key={tw.label} {...kb(tw.pick)} className={tw.cls} style={sx('padding:7px 15px;border-radius:8px;font:600 14px Sarabun,sans-serif;cursor:pointer', { background: tw.navBg, color: tw.navFg })}>{tw.label}</div>
          ))}
        </div>
      </div>
      <div style={s('display:flex;align-items:center;gap:12px')}>
        {/* 🚨 ชื่อหน่วยงานเต็มยศยาว 72 ตัวอักษร แถบบนเดิมกว้าง 420px จึงตัดด้วย ...
            พี่กันทัก 26 ส.ค. 2569 ว่า "ทำไมมี ..." — ขยายเป็น 620px แล้วลดขนาดลงนิด
            ยังตัดอยู่บนจอแคบ แต่บนจอห้องยา 1360px ขึ้นไปจะเห็นครบทั้งชื่อ
            เอาเมาส์ชี้เห็นชื่อเต็มได้ทุกกรณี */}
        <span title={V.dateLabel + ' · ' + V.orgName}
          style={s("font:500 12px Sarabun,sans-serif;color:#6b746e;max-width:620px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{V.dateLabel} · {V.orgName}</span>

        {/* สวิตช์มุมมอง คอม/มือถือ — ย้ายจากกล่องลอยมุมล่างซ้ายมาอยู่แถบบน (พี่กันสั่ง)
            ของเดิมลอยทับปุ่มในตาราง กดไม่ได้ */}
        {V.showLayoutSwitch && (
          <div style={s('display:flex;align-items:center;gap:7px')}>
            <span style={s("font:500 10.5px Sarabun,sans-serif;letter-spacing:.06em;color:#6f7873")}>มุมมอง</span>
            <div style={s('display:flex;padding:2px;border-radius:8px;background:#f0f1ee;gap:2px')}>
              <div {...kb(V.useDesktop)} className="tap" style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutDeskBg, color: V.layoutDeskFg })}>คอม</div>
              <div {...kb(V.useMobile)} className="tap" style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutMobBg, color: V.layoutMobFg })}>มือถือ</div>
            </div>
          </div>
        )}

        {/* 🚨 ใช้ตัวอักษร ไม่ใช่ไอคอนเปล่า (พี่กันสั่ง 26 ส.ค. 2569 "ทำเป็นตัวอักษรหน่อย")
            ℹ กับ ⚙ ต้องเดาความหมายเอง และคนที่ไม่ได้ใช้ทุกวันจะไม่กล้ากด
            เป็นเรื่องเดียวกับที่พี่กันสั่งเรื่องปุ่มในตารางว่า "ไม่ย่อ เอากลับเหมือนเดิม" */}
        <div {...kb(V.openAbout)} aria-label="เกี่ยวกับ" className="hv-bg-f6" style={s('min-height:38px;padding:0 13px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:inline-flex;align-items:center;font:600 12.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>เกี่ยวกับ</div>
        <div {...kb(V.openSettings)} aria-label="ตั้งค่า" className="hv-bg-f6" style={s('min-height:38px;padding:0 13px;border-radius:9px;border:1px solid rgba(30,36,32,.14);display:inline-flex;align-items:center;font:600 12.5px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>ตั้งค่า</div>
      </div>
    </div>
    </div>
  );
}
