// หน้าต่างตั้งค่า — คัดจากมอคอัป (บรรทัด 567–653)
// ตัดออก 2 อย่างตามแผน: ปุ่มล้างข้อมูลเดโม กับปุ่มออกจากระบบ (ยังไม่มีระบบเข้าสู่ระบบ)
// ช่องที่ว่างตรงนั้นใส่ปุ่มไปหน้าจัดการราคายาแทน โครงกล่องกับความสูงปุ่มเท่าเดิม
import { s, sx, kb } from '../helpers';
import { renderSearchBox } from './thaibox';

const LABEL = "font:600 11px/1.75 Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)";
const HINT = 'font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:20px';
// การ์ดขาว — ชุดเดียวกับหน้าเกี่ยวกับเป๊ะ (พี่กันสั่ง 3 ก.ย. 2569)
// 'ในเพจตั้งค่า มันสีแปลกๆ ไม่เหมือนในเกี่ยวกับที่มันจะมีช่องกรอบสีขาว'
// สองหน้านี้เปิดจากปุ่มที่อยู่ข้างกัน หน้าตาจึงต้องเป็นชุดเดียวกัน
const CARD = 'background:#fff;border:1px solid rgba(47,125,93,.16);border-radius:16px;padding:18px 18px 4px';
const FIELD = 'width:100%;height:46px;padding:0 13px;border:1px solid rgba(30,36,32,.16);border-radius:10px;background:#f6f7f4;font:400 14.5px Sarabun,sans-serif;margin-bottom:6px';

export function renderSettings(V) {
  if (!V.settingsOpen) return null;
  return (
    // ── หน้าตั้งค่า — หน้าเต็มจอมีปุ่มกลับ เหมือนหน้าเกี่ยวกับ ─────────────────
    //   พี่กันสั่ง 1 ก.ย. 2569: "ตั้งค่า เกี่ยวกับ เอาให้เหมือนรายละเอียดเว้บ คือมีปุ่มกลับ"
    //
    //   ของเดิมตั้งค่าเป็นหน้าต่างซ้อนที่เลื่อนขึ้นจากล่าง ส่วนเกี่ยวกับเป็นหน้าเต็มจอ
    //   ทั้งที่ปุ่มสองอันอยู่ข้างกันบนหัวเว็บและเป็นของประเภทเดียวกัน
    //   กดแล้วได้หน้าตาคนละแบบทำให้มือจำไม่ได้ว่าปิดยังไง
    //
    // 🚨 เป็นหน้าเต็มจอแล้วห้ามอยู่ในรายการ anyModalOpen อีก
    //    ไม่งั้นฉากหลังถูกล็อกทั้งที่ไม่มีอะไรซ้อนอยู่ = เลื่อนดูเนื้อหาข้างในไม่ได้
    <div style={s('width:100%;max-width:640px;margin:0 auto;padding:18px 16px 60px;display:flex;flex-direction:column')}>

      {/* ── ปุ่มกลับกับหัวเรื่องอยู่แถวเดียวกัน (พี่กันสั่ง 3 ก.ย. 2569) ──────────
          "เอาคำว่า ตั้งค่า กับ เกี่ยวกับ อยู่เสมอปุ่มกดกลับได้ไหม"
          เดิมหัวเรื่องอยู่กลางหน้าใต้ปุ่มกลับ กินไปอีกแถวโดยไม่ได้อะไรเพิ่ม
          ตอนนี้กวาดตาแถวเดียวรู้ครบว่าอยู่หน้าไหนและกดกลับตรงไหน
          🚨 โทนเดียวกับหัวหน้ารายการ Lot ที่พี่กันเคาะไปแล้ว */}
      <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:14px')}>
        {/* 🚨 ปุ่มกลับเหลือลูกศรอย่างเดียว ตัดคำว่า กลับ ออก (พี่กันเลือกแบบ ก · 3 ก.ย. 2569)
            ปุ่มกล่องมีข้อความอยู่ข้างหัวเรื่องตัวใหญ่ สองชิ้นน้ำหนักต่างกันมากจนดูไม่เข้าคู่
            เหลือลูกศรแล้วหัวเรื่องเป็นตัวเด่นตัวเดียวในแถว
            🚨 ต้องมี aria-label เพราะไม่มีข้อความให้โปรแกรมอ่านจออ่านแล้ว
            🚨 ลูกศรวาดด้วย SVG ไม่ใช่ตัวอักษร ← ซึ่งหน้าตาขึ้นกับฟอนต์ของเครื่อง
            🚨 ปุ่ม 38 จุดเล็กกว่าเกณฑ์นิ้ว แต่คลาส tap ขยายพื้นที่กดออกด้านละ 11 จุด
               และไม่มีปุ่มอื่นวางติดกัน จึงไม่มีพื้นที่กดทับกัน (กฎข้อ 3.55) */}
        <div {...kb(V.closeSettings)} className="hv-bg-f6 tap" aria-label="กลับไปหน้าก่อนหน้า"
          style={s('width:38px;height:38px;border:1px solid rgba(30,36,32,.14);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;color:#414a44;cursor:pointer;flex:none')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </div>
        <div role="heading" aria-level="1" style={s('font:700 21px/1.3 Krub,sans-serif;color:#24614a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>ตั้งค่า</div>
      </div>


      <div style={s(CARD + ';margin-top:13px')}>

          <div style={s(LABEL + ';margin-bottom:7px')}>หน่วยงาน</div>
          <input value={V.orgName} onChange={V.onOrgName} placeholder="ชื่อห้องยา / โรงพยาบาล" style={s(FIELD)} />
          <div style={s(HINT)}>ชื่อนี้แสดงบน header และเป็นหัวไฟล์ตอน Export Excel</div>

          <div style={s(LABEL + ';margin-bottom:7px')}>แหล่งที่มาเริ่มต้น</div>
          {/* 🚨 ฝั่งมือถือใช้ชื่อย่อ อยู่แถวเดียว และเตี้ยลง (พี่กันสั่ง 1 ก.ย. 2569)
              "ย่ออันนี้ด้วยสิ" แล้วตามด้วย "บีบความสูงได้มั้ย"
              ของเดิมชื่อเต็มทำให้ "รพ.สต." ตกไปอยู่บรรทัดที่สองตัวเดียวโดด ๆ
              ฝั่งคอมยังใช้ชื่อเต็มและขึ้นบรรทัดใหม่ได้เหมือนเดิม */}
          <div style={sx('display:flex;gap:5px;margin-bottom:6px', V.wide ? { flexWrap: 'wrap' } : null)}>
            {V.defaultSources.map((ds) => (
              <div key={ds.label} {...kb(ds.pick)} className={ds.on ? 'hv-seg-on' : 'hv-seg-off'} style={sx('border-radius:999px;font:500 11.5px/1.75 Sarabun,sans-serif;cursor:pointer;text-align:center;white-space:nowrap;display:flex;align-items:center;justify-content:center', { background: ds.bg, color: ds.fg, padding: V.wide ? '8px 14px' : '0 5px', height: V.wide ? 'auto' : '27px', flex: V.wide ? '0 0 auto' : '1 1 0' })}>{V.wide ? ds.label : ds.short}</div>
            ))}
          </div>
          <div style={s(HINT)}>เปิดแอปมาจะเลือกชิปนี้ให้เลย ตั้งเป็นแหล่งที่คืนบ่อยที่สุดของห้องยาท่าน</div>

          <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:7px')}>
            <span style={s(LABEL)}>ยาที่คืนบ่อย</span>
            <span style={s("font:600 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums")}>{V.favCountLabel}</span>
          </div>
          <div style={s('display:flex;flex-direction:column;gap:6px;margin-bottom:9px')}>
            {V.favList.map((fv) => (
              <div key={fv.id} style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(30,36,32,.08);border-radius:10px')}>
                <div style={s('min-width:0')}>
                  <div style={s('font:600 13.5px/1.75 Sarabun,sans-serif')}>{fv.name}</div>
                  <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{fv.priceLabel}</div>
                </div>
                <div {...kb(fv.remove)} aria-label="เอาออกจากยาที่คืนบ่อย" className="hv-del" style={s('width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#c0c5c1;cursor:pointer;font:400 13px/1.75 Sarabun,sans-serif;flex:none')}>✕</div>
              </div>
            ))}
          </div>
          {V.favFull && (
            <div style={s(HINT)}>ครบ 6 ช่องแล้ว — ลบตัวใดตัวหนึ่งออกก่อนถ้าจะเพิ่มยาอื่น</div>
          )}
          {V.favNotFull && (
            <>
              {/* ช่องค้นหามาตรฐานของทั้งเว็บ (thaibox.jsx) */}
              <div style={s('display:flex')}>
                {renderSearchBox({
                  value: V.favQuery, onChange: V.onFavQuery,
                  placeholder: 'ค้นชื่อยาเพื่อเพิ่มเข้าช่อง',
                  font: '400 14px/1.75 var(--font-sarabun), Sarabun, sans-serif',
                  h: 44, bg: '#f6f7f4', ariaLabel: 'ค้นชื่อยาเพื่อเพิ่มเข้าช่อง',
                })}
              </div>
              <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:6px;margin-bottom:20px')}>
                {V.favResults.map((fr) => (
                  <div key={fr.id} {...kb(fr.add)} className="hv-bg-e3f" style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#eef6f1;cursor:pointer')}>
                    <div style={s('min-width:0')}>
                      <div style={s('font:600 13.5px/1.75 Sarabun,sans-serif')}>{fr.name}</div>
                      <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums')}>{fr.priceLabel}</div>
                    </div>
                    <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#2f7d5d;flex:none')}>เพิ่ม +</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── เครื่องนี้ ────────────────────────────────────────────────────
              ชื่อเครื่องใช้บอกว่าล็อตที่กรอกค้างไว้เป็นของเครื่องไหน
              ตั้งครั้งเดียวตอนเปิดเว็บครั้งแรก แล้วมาแก้ตรงนี้ได้ */}
          <div style={s(LABEL + ';margin-bottom:4px')}>เครื่องนี้</div>
          <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:8px')}>ใช้บอกว่าล็อตที่กรอกค้างไว้เป็นของเครื่องไหน ตอนต้องเอางานมาทำต่อจากเครื่องที่เสีย</div>
          <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:22px;padding:11px 13px;border-radius:10px;background:#f6f7f4;border:1px solid rgba(30,36,32,.10)')}>
            <div style={s('flex:1;min-width:150px;font:600 13.5px/1.75 Sarabun,sans-serif;color:#1e2420')}>
              {V.deviceLabel || 'ยังไม่ได้ตั้งชื่อเครื่อง'}
            </div>
            <div {...kb(V.openDeviceAsk)} aria-label="เปลี่ยนชื่อเครื่อง" className="hv-bg-e3f tap"
              style={s('padding:9px 15px;border-radius:9px;background:#eef6f1;color:#2f7d5d;font:700 12.5px/1.75 Sarabun,sans-serif;cursor:pointer;flex:none')}>
              เปลี่ยน
            </div>
          </div>

          <div style={s(LABEL + ';margin-bottom:7px')}>ธีมหน้าสรุป</div>
          <div style={s('display:flex;gap:6px;margin-bottom:6px')}>
            <div {...kb(V.setLight)} className="hv-sun" style={sx('flex:1;text-align:center;padding:11px 0;border-radius:10px;cursor:pointer;font:600 13.5px/1.75 Sarabun,sans-serif', { background: V.themeLightBg, color: V.themeLightFg })}>สว่าง</div>
            <div {...kb(V.setDark)} className="hv-moon" style={sx('flex:1;text-align:center;padding:11px 0;border-radius:10px;cursor:pointer;font:600 13.5px/1.75 Sarabun,sans-serif', { background: V.themeDarkBg, color: V.themeDarkFg })}>เข้ม</div>
          </div>
          <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:22px')}>ห้องประชุมที่ปิดไฟหรือโปรเจกเตอร์คอนทราสต์ต่ำใช้ธีมเข้มจะอ่านง่ายกว่า</div>

          {/* ── ฟอนต์ตัวอักษรอังกฤษและตัวเลข ────────────────────────────────
              พี่กันสั่ง 27 ส.ค. 2569 ให้เอาแบบเดียวกับเว็บ HCV
              🚨 ตัวอย่างในปุ่มต้องเขียนฟอนต์ตรง ๆ ไม่ใช้ตัวแปร --font-en
                 ไม่งั้นทั้งสองปุ่มจะเปลี่ยนตามที่เลือกอยู่ = เทียบกันไม่ได้ */}
          <div style={s(LABEL + ';margin-bottom:4px')}>ฟอนต์ตัวอักษรอังกฤษและตัวเลข</div>
          <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:8px')}>ภาษาไทยใช้ฟอนต์เดิมเสมอ การเปลี่ยนตรงนี้มีผลกับตัวอักษรอังกฤษและตัวเลขเท่านั้น</div>
          <div style={s('display:flex;gap:8px;margin-bottom:22px')}>
            <div {...kb(V.setEnMono)} className="hv-bg-f6 tap"
              style={sx('flex:1;padding:10px 12px;border-radius:10px;cursor:pointer', { background: V.enMonoBg, border: '1.5px solid ' + V.enMonoBd })}>
              <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>Roboto Mono</div>
              <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>ตัวเลขเรียงตรงกัน อ่านค่าง่าย</div>
              <div style={{ font: '400 12px var(--font-mono),monospace', color: '#414a44', marginTop: '6px' }}>L690826-01 · 1,402.50</div>
            </div>
            <div {...kb(V.setEnThai)} className="hv-bg-f6 tap"
              style={sx('flex:1;padding:10px 12px;border-radius:10px;cursor:pointer', { background: V.enThaiBg, border: '1.5px solid ' + V.enThaiBd })}>
              <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>แบบปกติ</div>
              <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>อ่านสบาย กลมกลืนกับภาษาไทย</div>
              <div style={{ font: '400 12px var(--font-sarabun),Sarabun,sans-serif', color: '#414a44', marginTop: '6px' }}>L690826-01 · 1,402.50</div>
            </div>
          </div>

          {/* ── ดูตัวอย่างหน้าจอที่ปกติเรียกดูไม่ได้ (พี่กันสั่ง 31 ส.ค. 2569) ───
              🚨 โผล่เฉพาะตอนอยู่ในโหมดดูตัวอย่าง
                 ไม่งั้นเภสัชกรกดเล่นตอนใช้งานจริงแล้วเจอจอ "ส่งไม่สำเร็จ" ปลอม ๆ */}
          {V.demo && (
            <>
              <div style={s(LABEL + ';margin-bottom:4px')}>ดูตัวอย่างหน้าจอ</div>
              <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:8px')}>หน้าพวกนี้เกิดขึ้นเองตามสถานการณ์ กดดูล่วงหน้าได้ที่นี่โดยไม่ต้องรอให้เกิดจริง</div>
              <div style={s('display:flex;flex-direction:column;gap:6px;margin-bottom:22px')}>
                <div {...kb(V.previewOk)} aria-label="ดูตัวอย่างหน้าบันทึกสำเร็จ" className="hv-bg-e3f tap"
                  style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#eef6f1;cursor:pointer')}>
                  <div>
                    <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>หน้าบันทึกสำเร็จ</div>
                    <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>จอที่ขึ้นหลังกดส่งแล้วเข้าระบบเรียบร้อย</div>
                  </div>
                  <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#2f7d5d;flex:none')}>เปิดดู</span>
                </div>

                <div {...kb(V.previewFail)} aria-label="ดูตัวอย่างหน้าส่งไม่สำเร็จ" className="hv-del tap"
                  style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#fdf3f5;cursor:pointer')}>
                  <div>
                    <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>หน้าส่งไม่สำเร็จ</div>
                    <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>จอตอนเน็ตหลุด พร้อมนาฬิกานับถอยหลังก่อนลองส่งเอง</div>
                  </div>
                  <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#b02a5b;flex:none')}>เปิดดู</span>
                </div>

                <div {...kb(V.hasLoadErr ? V.clearPreviewLoadFail : V.previewLoadFail)}
                  aria-label={V.hasLoadErr ? 'เลิกดูตัวอย่างหน้าโหลดไม่สำเร็จ' : 'ดูตัวอย่างหน้าโหลดไม่สำเร็จ'}
                  className="hv-cream tap"
                  style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#fdf8ec;cursor:pointer')}>
                  <div>
                    <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>หน้าโหลดข้อมูลไม่สำเร็จ</div>
                    <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>กล่องแจ้งเตือนในหน้าสรุป ประวัติ Lot คลังยา และราคายา</div>
                  </div>
                  <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#96650f;flex:none')}>{V.hasLoadErr ? 'เลิกดู' : 'เปิดดู'}</span>
                </div>

                <div {...kb(V.previewHisImport)} aria-label="ดูตัวอย่างหน้านำเข้าราคาจาก HIS" className="hv-bg-f6 tap"
                  style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#f6f7f4;cursor:pointer')}>
                  <div>
                    <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420')}>หน้านำเข้าราคาจาก HIS</div>
                    <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-top:1px')}>ตารางจับคู่ยากับราคา แยกเป็นมั่นใจ ต้องเลือก และไม่เจอ</div>
                  </div>
                  <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#414a44;flex:none')}>เปิดดู</span>
                </div>
              </div>
            </>
          )}

          {/* โหมดดูตัวอย่าง — ข้อมูลปลอมฝังในเว็บ ไม่แตะฐานข้อมูลจริง
              มีไว้ให้เห็นภาพว่าเว็บทำงานเต็มที่แล้วหน้าตาเป็นยังไง
              ตอนที่ยังไม่ได้ใส่ราคายาจริง (ตัวเลขทุกหน้าเป็น 0 หมด) */}
          <div style={s(LABEL + ';margin-bottom:7px')}>โหมดดูตัวอย่าง</div>
          <div {...kb(V.toggleDemo)} className={(V.demo ? 'hv-cream' : 'hv-bg-e6e') + ' tap'} style={sx('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:11px;cursor:pointer;margin-bottom:6px', {
            background: V.demo ? '#fdf3e7' : '#f6f7f4',
            border: '1px solid ' + (V.demo ? 'rgba(214,138,42,.4)' : 'rgba(30,36,32,.1)')
          })}>
            <span style={sx('font:600 13.5px/1.75 Sarabun,sans-serif', { color: V.demo ? '#8a5a12' : '#414a44' })}>{V.demoBtnLabel}</span>
            <span style={sx('width:42px;height:24px;border-radius:99px;flex:none;position:relative;transition:background .15s', { background: V.demo ? '#d68a2a' : '#d5dad6' })}>
              <span style={sx('position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s', { left: V.demo ? '21px' : '3px' })}></span>
            </span>
          </div>
          <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:22px')}>{V.demoHint}</div>

          {/* ── ดูโครงจางค้างไว้ ──────────────────────────────────────────────
              พี่กันสั่ง 27 ส.ค. 2569 ให้มีปุ่มกดเทสเอง
              ปกติโครงจางโผล่แค่เสี้ยววินาที ดูไม่ทันว่าหน้าตาถูกไหม
              🚨 ไม่เก็บลงเครื่อง ปิดเว็บแล้วเปิดใหม่กลับเป็นปกติเสมอ */}
          <div style={s(LABEL + ';margin-bottom:7px')}>ดูโครงจางระหว่างโหลด</div>
          <div {...kb(V.toggleSkelDemo)} className={(V.skelDemo ? 'hv-bg-e3f' : 'hv-bg-e6e') + ' tap'} style={sx('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:11px;cursor:pointer;margin-bottom:6px', {
            background: V.skelDemo ? '#e8f2ec' : '#f6f7f4',
            border: '1px solid ' + (V.skelDemo ? 'rgba(47,125,93,.4)' : 'rgba(30,36,32,.1)')
          })}>
            <span style={sx('font:600 13.5px/1.75 Sarabun,sans-serif', { color: V.skelDemo ? '#2f7d5d' : '#414a44' })}>{V.skelDemo ? 'กำลังค้างโครงจางไว้' : 'ค้างโครงจางไว้ดู'}</span>
            <span style={sx('width:42px;height:24px;border-radius:99px;flex:none;position:relative;transition:background .15s', { background: V.skelDemo ? '#2f7d5d' : '#d5dad6' })}>
              <span style={sx('position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s', { left: V.skelDemo ? '21px' : '3px' })}></span>
            </span>
          </div>
          <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:22px')}>เปิดแล้วทุกหน้าจะค้างโครงจางไว้ให้ดู ปิดสวิตช์เมื่อไรก็กลับมาแสดงข้อมูลจริงทันที · ปิดเว็บแล้วเปิดใหม่ค่านี้จะกลับเป็นปกติเอง</div>

          <div style={s('border-top:1px solid rgba(30,36,32,.08);padding-top:18px;margin-bottom:18px')}>
            <div style={s(LABEL + ';margin-bottom:10px')}>เกี่ยวกับแอปนี้</div>
            <div style={s('font:400 13px/1.75 Sarabun,sans-serif;color:#414a44')}>
              แอปนี้ทำหน้าที่เดียว: <strong style={s('font-weight:600')}>แปลงยาที่ผู้ป่วยคืนมาให้เป็นตัวเลขมูลค่า</strong> ไม่เข้าไปคุมกระบวนการรับยาคืนหรือคืนเข้าคลัง ซึ่งมีอยู่แล้วในงานประจำ
            </div>
            <div style={s('display:flex;flex-direction:column;gap:9px;margin-top:12px')}>
              <div style={s('padding:11px 13px;border-radius:10px;background:#eef6f1')}>
                <div style={s('font:600 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;margin-bottom:2px')}>มูลค่าคิดจากราคา ณ วันที่บันทึก</div>
                <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#414a44')}>ราคาต่อหน่วยจะถูกแช่ไว้ในรายการตอนกดบันทึก ถ้าราคายาเปลี่ยนกลางปี ตัวเลข KPI ย้อนหลังจะไม่ขยับตาม จึงอธิบายผู้บริหารและผู้ตรวจได้</div>
              </div>
              <div style={s('padding:11px 13px;border-radius:10px;background:#f6f7f4')}>
                <div style={s('font:600 12.5px/1.75 Sarabun,sans-serif;margin-bottom:2px')}>ปีงบประมาณไทย ต.ค.–ก.ย.</div>
                <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>ยอดสะสมและกราฟรายเดือนนับตามปีงบ ไม่ใช่ปีปฏิทิน · วันที่แสดงเป็น พ.ศ. แต่เก็บในฐานข้อมูลเป็น ค.ศ.</div>
              </div>
              <div style={s('padding:11px 13px;border-radius:10px;background:#f6f7f4')}>
                <div style={s('font:600 12.5px/1.75 Sarabun,sans-serif;margin-bottom:2px')}>ยังไม่มีในเวอร์ชันนี้</div>
                <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>ระบบสถานะงาน/การอนุมัติ · สิทธิ์ผู้ใช้แยกบทบาท · ทะเบียนทำลายยาและใบสำคัญทำลาย</div>
              </div>
            </div>
            <div style={s('display:flex;justify-content:space-between;font:400 11.5px/1.75 Sarabun,sans-serif;color:#6f7873;margin-top:14px;font-variant-numeric:tabular-nums')}>
              <span>เวอร์ชัน {V.appVersion}</span><span>{V.recordTotalLabel}</span>
            </div>
          </div>

          <div style={s('border-top:1px solid rgba(30,36,32,.08);padding-top:16px;display:flex;flex-direction:column;gap:8px')}>
            {/* ── ปุ่มตั้งราคายาโผล่เฉพาะฝั่งคอม (พี่กันสั่ง 1 ก.ย. 2569 "เอาระบบตั้งราคาออก") ──
                หน้าจัดการราคาเป็นตารางยาที่ต้องเลื่อนดูหลายคอลัมน์ ใช้บนจอมือถือไม่ไหว
                เหตุผลเดียวกับที่เอาแท็บคลังยาออกจากมือถือไปแล้ว
                ⚠️ หน้ายังเปิดได้ทุกทางเหมือนเดิม แค่ไม่มีปุ่มให้กดบนมือถือ */}
            {V.wide && (
              <div {...kb(V.openPrices)} className="hv-bg-e3f" style={s('height:46px;border-radius:10px;background:#eef6f1;display:flex;align-items:center;justify-content:center;gap:9px;font:600 14px Sarabun,sans-serif;color:#2f7d5d;cursor:pointer')}>
                ตั้งราคายา <span style={s("font:500 12px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums")}>{V.priceProgressLabel}</span>
              </div>
            )}

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
  );
}
