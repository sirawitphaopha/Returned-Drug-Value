// หน้าต่างตั้งค่า — คัดจากมอคอัป (บรรทัด 567–653)
// ตัดออก 2 อย่างตามแผน: ปุ่มล้างข้อมูลเดโม กับปุ่มออกจากระบบ (ยังไม่มีระบบเข้าสู่ระบบ)
// ช่องที่ว่างตรงนั้นใส่ปุ่มไปหน้าจัดการราคายาแทน โครงกล่องกับความสูงปุ่มเท่าเดิม
import { s, sx, kb } from '../helpers';

const LABEL = "font:600 11px Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)";
const HINT = 'font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;margin-bottom:20px';
const FIELD = 'width:100%;height:46px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:10px;background:#f6f7f4;font:400 14.5px Sarabun,sans-serif;margin-bottom:6px';

export function renderSettings(V) {
  if (!V.settingsOpen) return null;
  return (
    <>
      <div {...kb(V.closeSettings)} style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:24')}></div>
      <div role="dialog" aria-modal="true" style={sx('position:fixed;inset:0;z-index:25;display:flex;justify-content:center;pointer-events:none', { alignItems: V.settingsAlign })}>
        <div style={sx('pointer-events:auto;width:100%;overflow-y:auto;background:#fff;box-shadow:0 -14px 44px rgba(30,36,32,.28);padding:14px 20px max(22px,env(safe-area-inset-bottom))', { maxWidth: V.settingsMaxW, maxHeight: V.settingsMaxH, borderRadius: V.settingsRadius })}>

          <div style={s('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px')}>
            <div role="heading" aria-level="1" style={s('font:700 18px Sarabun,sans-serif')}>ตั้งค่า และเกี่ยวกับ</div>
            <div {...kb(V.closeSettings)} aria-label="ปิดหน้าต่างตั้งค่า" className="hv-bg-e6e" style={s('width:32px;height:32px;border-radius:8px;background:#f0f1ee;display:flex;align-items:center;justify-content:center;font:400 14px Sarabun,sans-serif;color:#414a44;cursor:pointer')}>✕</div>
          </div>

          <div style={s(LABEL + ';margin-bottom:7px')}>หน่วยงาน</div>
          <input value={V.orgName} onChange={V.onOrgName} placeholder="ชื่อห้องยา / โรงพยาบาล" style={s(FIELD)} />
          <div style={s(HINT)}>ชื่อนี้แสดงบน header และเป็นหัวไฟล์ตอน Export Excel</div>

          <div style={s(LABEL + ';margin-bottom:7px')}>แหล่งที่มาเริ่มต้น</div>
          <div style={s('display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px')}>
            {V.defaultSources.map((ds) => (
              <div key={ds.label} {...kb(ds.pick)} className={ds.on ? 'hv-seg-on' : 'hv-seg-off'} style={sx('padding:8px 14px;border-radius:999px;font:500 12.5px Sarabun,sans-serif;cursor:pointer', { background: ds.bg, color: ds.fg })}>{ds.label}</div>
            ))}
          </div>
          <div style={s(HINT)}>เปิดแอปมาจะเลือกชิปนี้ให้เลย ตั้งเป็นแหล่งที่คืนบ่อยที่สุดของห้องยาท่าน</div>

          <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:7px')}>
            <span style={s(LABEL)}>ยาที่คืนบ่อย</span>
            <span style={s("font:600 11.5px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums")}>{V.favCountLabel}</span>
          </div>
          <div style={s('display:flex;flex-direction:column;gap:6px;margin-bottom:9px')}>
            {V.favList.map((fv) => (
              <div key={fv.id} style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(30,36,32,.08);border-radius:10px')}>
                <div style={s('min-width:0')}>
                  <div style={s('font:600 13.5px/1.3 Sarabun,sans-serif')}>{fv.name}</div>
                  <div style={s('font:400 11px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{fv.priceLabel}</div>
                </div>
                <div {...kb(fv.remove)} aria-label="เอาออกจากยาที่คืนบ่อย" className="hv-del" style={s('width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#c0c5c1;cursor:pointer;font:400 13px Sarabun,sans-serif;flex:none')}>✕</div>
              </div>
            ))}
          </div>
          {V.favFull && (
            <div style={s(HINT)}>ครบ 6 ช่องแล้ว — ลบตัวใดตัวหนึ่งออกก่อนถ้าจะเพิ่มยาอื่น</div>
          )}
          {V.favNotFull && (
            <>
              <input value={V.favQuery} onChange={V.onFavQuery} placeholder="ค้นชื่อยาเพื่อเพิ่มเข้าช่อง" style={s('width:100%;height:44px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:10px;background:#f6f7f4;font:400 14px Sarabun,sans-serif')} />
              <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:6px;margin-bottom:20px')}>
                {V.favResults.map((fr) => (
                  <div key={fr.id} {...kb(fr.add)} className="hv-bg-e3f" style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#eef6f1;cursor:pointer')}>
                    <div style={s('min-width:0')}>
                      <div style={s('font:600 13.5px/1.3 Sarabun,sans-serif')}>{fr.name}</div>
                      <div style={s('font:400 11px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{fr.priceLabel}</div>
                    </div>
                    <span style={s('font:600 12px Sarabun,sans-serif;color:#2f7d5d;flex:none')}>เพิ่ม +</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={s(LABEL + ';margin-bottom:7px')}>ธีมหน้าสรุป</div>
          <div style={s('display:flex;gap:6px;margin-bottom:6px')}>
            <div {...kb(V.setLight)} className="hv-sun" style={sx('flex:1;text-align:center;padding:11px 0;border-radius:10px;cursor:pointer;font:600 13.5px Sarabun,sans-serif', { background: V.themeLightBg, color: V.themeLightFg })}>สว่าง</div>
            <div {...kb(V.setDark)} className="hv-moon" style={sx('flex:1;text-align:center;padding:11px 0;border-radius:10px;cursor:pointer;font:600 13.5px Sarabun,sans-serif', { background: V.themeDarkBg, color: V.themeDarkFg })}>เข้ม</div>
          </div>
          <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;margin-bottom:22px')}>ห้องประชุมที่ปิดไฟหรือโปรเจกเตอร์คอนทราสต์ต่ำใช้ธีมเข้มจะอ่านง่ายกว่า</div>

          {/* ── ฟอนต์ตัวอักษรอังกฤษและตัวเลข ────────────────────────────────
              พี่กันสั่ง 27 ส.ค. 2569 ให้เอาแบบเดียวกับเว็บ HCV
              🚨 ตัวอย่างในปุ่มต้องเขียนฟอนต์ตรง ๆ ไม่ใช้ตัวแปร --font-en
                 ไม่งั้นทั้งสองปุ่มจะเปลี่ยนตามที่เลือกอยู่ = เทียบกันไม่ได้ */}
          <div style={s(LABEL + ';margin-bottom:4px')}>ฟอนต์ตัวอักษรอังกฤษและตัวเลข</div>
          <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;margin-bottom:8px')}>ภาษาไทยใช้ฟอนต์เดิมเสมอ การเปลี่ยนตรงนี้มีผลกับตัวอักษรอังกฤษและตัวเลขเท่านั้น</div>
          <div style={s('display:flex;gap:8px;margin-bottom:22px')}>
            <div {...kb(V.setEnMono)} className="hv-bg-f6 tap"
              style={sx('flex:1;padding:10px 12px;border-radius:10px;cursor:pointer', { background: V.enMonoBg, border: '1.5px solid ' + V.enMonoBd })}>
              <div style={s('font:600 13px Sarabun,sans-serif;color:#1e2420')}>Roboto Mono</div>
              <div style={s('font:400 11px Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>ตัวเลขเรียงตรงกัน อ่านค่าง่าย</div>
              <div style={{ font: '400 12px var(--font-mono),monospace', color: '#414a44', marginTop: '6px' }}>L690826-01 · 1,402.50</div>
            </div>
            <div {...kb(V.setEnThai)} className="hv-bg-f6 tap"
              style={sx('flex:1;padding:10px 12px;border-radius:10px;cursor:pointer', { background: V.enThaiBg, border: '1.5px solid ' + V.enThaiBd })}>
              <div style={s('font:600 13px Sarabun,sans-serif;color:#1e2420')}>แบบปกติ</div>
              <div style={s('font:400 11px Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>อ่านสบาย กลมกลืนกับภาษาไทย</div>
              <div style={{ font: '400 12px var(--font-sarabun),Sarabun,sans-serif', color: '#414a44', marginTop: '6px' }}>L690826-01 · 1,402.50</div>
            </div>
          </div>

          {/* โหมดดูตัวอย่าง — ข้อมูลปลอมฝังในเว็บ ไม่แตะฐานข้อมูลจริง
              มีไว้ให้เห็นภาพว่าเว็บทำงานเต็มที่แล้วหน้าตาเป็นยังไง
              ตอนที่ยังไม่ได้ใส่ราคายาจริง (ตัวเลขทุกหน้าเป็น 0 หมด) */}
          <div style={s(LABEL + ';margin-bottom:7px')}>โหมดดูตัวอย่าง</div>
          <div {...kb(V.toggleDemo)} className={(V.demo ? 'hv-cream' : 'hv-bg-e6e') + ' tap'} style={sx('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:11px;cursor:pointer;margin-bottom:6px', {
            background: V.demo ? '#fdf3e7' : '#f6f7f4',
            border: '1px solid ' + (V.demo ? 'rgba(214,138,42,.4)' : 'rgba(30,36,32,.1)')
          })}>
            <span style={sx('font:600 13.5px Sarabun,sans-serif', { color: V.demo ? '#8a5a12' : '#414a44' })}>{V.demoBtnLabel}</span>
            <span style={sx('width:42px;height:24px;border-radius:99px;flex:none;position:relative;transition:background .15s', { background: V.demo ? '#d68a2a' : '#d5dad6' })}>
              <span style={sx('position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s', { left: V.demo ? '21px' : '3px' })}></span>
            </span>
          </div>
          <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;margin-bottom:22px')}>{V.demoHint}</div>

          <div style={s('border-top:1px solid rgba(30,36,32,.08);padding-top:18px;margin-bottom:18px')}>
            <div style={s(LABEL + ';margin-bottom:10px')}>เกี่ยวกับแอปนี้</div>
            <div style={s('font:400 13px/1.75 Sarabun,sans-serif;color:#414a44')}>
              แอปนี้ทำหน้าที่เดียว: <strong style={s('font-weight:600')}>แปลงยาที่ผู้ป่วยคืนมาให้เป็นตัวเลขมูลค่า</strong> ไม่เข้าไปคุมกระบวนการรับยาคืนหรือคืนเข้าคลัง ซึ่งมีอยู่แล้วในงานประจำ
            </div>
            <div style={s('display:flex;flex-direction:column;gap:9px;margin-top:12px')}>
              <div style={s('padding:11px 13px;border-radius:10px;background:#eef6f1')}>
                <div style={s('font:600 12.5px Sarabun,sans-serif;color:#2f7d5d;margin-bottom:2px')}>มูลค่าคิดจากราคา ณ วันที่บันทึก</div>
                <div style={s('font:400 12px/1.6 Sarabun,sans-serif;color:#414a44')}>ราคาต่อหน่วยจะถูกแช่ไว้ในรายการตอนกดบันทึก ถ้าราคายาเปลี่ยนกลางปี ตัวเลข KPI ย้อนหลังจะไม่ขยับตาม จึงอธิบายผู้บริหารและผู้ตรวจได้</div>
              </div>
              <div style={s('padding:11px 13px;border-radius:10px;background:#f6f7f4')}>
                <div style={s('font:600 12.5px Sarabun,sans-serif;margin-bottom:2px')}>ปีงบประมาณไทย ต.ค.–ก.ย.</div>
                <div style={s('font:400 12px/1.6 Sarabun,sans-serif;color:#6b746e')}>ยอดสะสมและกราฟรายเดือนนับตามปีงบ ไม่ใช่ปีปฏิทิน · วันที่แสดงเป็น พ.ศ. แต่เก็บในฐานข้อมูลเป็น ค.ศ.</div>
              </div>
              <div style={s('padding:11px 13px;border-radius:10px;background:#f6f7f4')}>
                <div style={s('font:600 12.5px Sarabun,sans-serif;margin-bottom:2px')}>ยังไม่มีในเวอร์ชันนี้</div>
                <div style={s('font:400 12px/1.6 Sarabun,sans-serif;color:#6b746e')}>ระบบสถานะงาน/การอนุมัติ · สิทธิ์ผู้ใช้แยกบทบาท · ทะเบียนทำลายยาและใบสำคัญทำลาย</div>
              </div>
            </div>
            <div style={s('display:flex;justify-content:space-between;font:400 11.5px Sarabun,sans-serif;color:#6f7873;margin-top:14px;font-variant-numeric:tabular-nums')}>
              <span>เวอร์ชัน {V.appVersion}</span><span>{V.recordTotalLabel}</span>
            </div>
          </div>

          <div style={s('border-top:1px solid rgba(30,36,32,.08);padding-top:16px;display:flex;flex-direction:column;gap:8px')}>
            <div {...kb(V.openPrices)} className="hv-bg-e3f" style={s('height:46px;border-radius:10px;background:#eef6f1;display:flex;align-items:center;justify-content:center;gap:9px;font:600 14px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>
              ตั้งราคายา <span style={s("font:500 12px Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums")}>{V.priceProgressLabel}</span>
            </div>

            {/* ออกจากระบบ — โผล่เฉพาะตอนเว็บล็อกด้วยรหัสผ่านห้องยาอยู่ (พี่กันขอ)
                วางไว้ล่างสุด สีจางกว่าปุ่มอื่น เพราะเป็นของที่นาน ๆ ใช้ที ไม่ใช่ปุ่มประจำวัน */}
            {V.showLogout && (
              <div {...kb(V.askLogout)} className="hv-bg-fbe tap" style={s('height:46px;border-radius:10px;border:1px solid rgba(194,84,60,.26);background:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font:600 14px Sarabun,sans-serif;color:#c2543c;cursor:pointer')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <path d="M9.5 20.5H5.2a1.7 1.7 0 0 1-1.7-1.7V5.2a1.7 1.7 0 0 1 1.7-1.7h4.3" />
                  <path d="M16 16.5 20.5 12 16 7.5" />
                  <path d="M20.5 12H9.5" />
                </svg>
                ออกจากระบบ
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
