// หน้าต่างซ้อน — รายการล็อตที่กรอกค้างไว้ พร้อมดูยาข้างในได้
//
// พี่กันสั่ง 31 ส.ค. 2569: "ต้องกดดูรายละเอียดได้ด้วยสิ"
//
// ทำไมต้องเป็นหน้าต่างซ้อน ไม่ใช่กางในหน้า
//   คอลัมน์ซ้ายของหน้าบันทึกคอมถูกล็อกความสูงเท่าจอ (กฎข้อ 3.2)
//   ของที่กางออกมาในนั้นจะดันเนื้อหาทะลุกล่องไปทับท้ายเว็บ (เจอมาแล้ว)
//   หน้าต่างซ้อนลอยอยู่เหนือหน้าเว็บ ไม่กินที่ในผังหน้าเลย
//   และมีที่พอให้กางดูยาทีละล็อตโดยไม่ต้องบีบอะไรทิ้ง
//
// 🚨 กดพื้นหลังปิดได้ ต่างจากป๊อปยืนยันลบ เพราะแค่เปิดดู ไม่ได้ทำอะไรที่ย้อนยาก
// 🚨 ปุ่ม "ทิ้ง" ยังผ่านหน้าต่างยืนยันอีกชั้นเหมือนเดิม ไม่ได้ลบทันที
import { s, sx, kb } from '../helpers';
import { money } from '@/lib/format';
import { parkedItems, parkedTone } from './parked';

// ยาในล็อต — ตารางเล็ก ๆ ให้เห็นว่ามีอะไรบ้างก่อนตัดสินใจ
// 🚨 ห้ามรวมจำนวนข้ามหน่วยนับ (กฎข้อ 3.4) จึงโชว์รายแถวไปเลย ไม่สรุปเป็นตัวเลขเดียว
function rowsTable(rows) {
  if (!rows.length) {
    return (
      <div style={s('padding:11px 13px;font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>
        ล็อตนี้ไม่มีรายการยาเหลือแล้ว
      </div>
    );
  }
  return (
    <div style={s('padding:2px 0')}>
      {rows.map((r, i) => {
        const destroy = r.disposition === 'destroy';
        return (
          <div key={r.rid || i}
            style={sx('display:flex;align-items:center;gap:10px;padding:7px 13px;flex-wrap:wrap', {
              background: destroy ? '#fdf7f5' : 'transparent'
            })}>
            <div style={s('flex:1;min-width:150px;font:500 12.5px/1.75 Sarabun,sans-serif;color:#1e2420;overflow-wrap:anywhere')}>
              {r.name}
            </div>
            <div style={s('font:500 12px/1.75 Sarabun,sans-serif;color:#6b746e;flex:none;font-variant-numeric:tabular-nums')}>
              {r.qty} {r.unit}
            </div>
            <div style={sx('font:700 12.5px/1.75 Sarabun,sans-serif;flex:none;min-width:74px;text-align:right;font-variant-numeric:tabular-nums', {
              color: destroy ? '#b02a5b' : '#2f7d5d'
            })}>
              {money((r.price || 0) * (r.qty || 0))}
            </div>
            <div style={sx('font:600 11px/1.75 Sarabun,sans-serif;flex:none;min-width:46px;text-align:center;padding:3px 7px;border-radius:6px', {
              background: destroy ? '#fbe9ec' : '#e6f2ec',
              color: destroy ? '#b02a5b' : '#2f7d5d'
            })}>
              {destroy ? 'ทำลาย' : 'ใช้ต่อ'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function renderParkedSheet(V) {
  if (!V.showOtherDrafts) return null;

  const items = parkedItems(V);
  if (!items.length) return null;

  const other = items.some((x) => !x.mine);
  const open = V.parkedSeen || '';

    {/* 🚨🔴 kb() คืน role="button" มาด้วย ต้องวางก่อน role="dialog" เสมอ
        ถ้าวางทีหลัง role จะถูกทับเป็น button แล้วตัวกันเลื่อนฉากหลัง
        (_blockBgScroll ใน MedReturnApp) จะมองไม่เห็นว่านี่คือหน้าต่างซ้อน
        แล้วบล็อกการเลื่อนในหน้าต่างเองไปด้วย — พี่กันเจอ 1 ก.ย. 2569
        "ทำไมเราสโครเมาส์ลงไม่ได้วะ" */}
  return (
    <div {...kb(V.toggleOtherDrafts)} role="dialog" aria-modal="true"
      style={s('position:fixed;inset:0;background:rgba(20,26,22,.45);display:flex;align-items:center;justify-content:center;padding:22px 16px;z-index:52;overflow:auto')}>
      {/* กล่องข้างในต้องกินการกดไว้เอง ไม่งั้นกดอะไรก็ปิดหน้าต่าง */}
      <div onClick={(e) => e.stopPropagation()}
        style={s('background:#fff;border-radius:14px;overflow:hidden;width:100%;max-width:620px;height:min(76vh,640px);display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(20,26,22,.2)')}>

        <div style={s('flex:none;padding:18px 22px 12px;border-bottom:1px solid #eef1ef')}>
          <div style={s('display:flex;align-items:flex-start;gap:12px')}>
            <div style={s('flex:1;min-width:0')}>
              <div role="heading" aria-level="2" style={s('font:700 16px Sarabun,sans-serif;margin-bottom:4px')}>
                ล็อตที่กรอกค้างไว้ {items.length} ล็อต
              </div>
              <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>
                ยังไม่ได้บันทึกเข้าระบบ กดดูรายละเอียดเพื่อเช็คว่ามียาอะไรก่อนตัดสินใจ
              </div>
            </div>
            <div {...kb(V.toggleOtherDrafts)} aria-label="ปิดหน้าต่าง" className="hv-bg-e6e tap"
              style={s('width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer;background:rgba(30,36,32,.06);flex:none')}>
              ✕
            </div>
          </div>
        </div>

        {/* data-scrollable="1" บอกตัวกันเลื่อนฉากหลังว่ากล่องนี้เลื่อนได้ */}
        <div data-scrollable="1" style={s('flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px 14px')}>
          {items.map((it) => {
            const c = parkedTone(it.hot);
            const seen = open === it.key;
            return (
              <div key={it.key}
                style={sx('border-radius:11px;margin-bottom:9px;overflow:hidden', { border: '1px solid ' + c.bd })}>
                {/* ── แถวหัวการ์ด — คอมเรียงแถวเดียว มือถือแยกสองแถว ─────────────────
                
                    พี่กันสั่ง 1 ก.ย. 2569 "แทรก จุดนี้ เกลาให้มันสวยหน่อย ของมือถือ"
                
                    ของเดิมใช้ flex-wrap ให้ปุ่มตกบรรทัดเอง ผลคือบนมือถือ
                    ปุ่มดูยาค้างอยู่บรรทัดบน ส่วนอีกสองปุ่มตกลงมา ดูไม่เป็นระเบียบ
                
                    🚨 มือถือ — ชื่อกับรายละเอียดเต็มความกว้าง ปุ่มสามอันอยู่แถวล่าง
                       แบ่งพื้นที่เท่า ๆ กัน (flex:1) ขอบซ้ายขวาตรงแนวกับข้อความ
                    🚨 คอม — เหมือนเดิมทุกอย่าง ปุ่มอยู่ขวาแถวเดียวกับชื่อ
                       ความกว้างขั้นต่ำ 76/112/58 ให้ทุกแถวตรงแนวกัน */}
                <div style={sx(V.wide
                  ? 'display:flex;align-items:center;gap:10px;padding:11px 13px'
                  : 'padding:11px 13px', { background: c.bg })}>
                  <div style={s(V.wide ? 'flex:1;min-width:0' : '')}>
                    <div style={sx('font:700 13px/1.75 Sarabun,sans-serif;margin-bottom:2px', { color: it.hot ? '#b02a5b' : '#1e2420' })}>
                      {it.title}
                    </div>
                    {/* 🚨 แต่ละก้อนห้ามขาดกลาง (กฎข้อ 3.19 ของโปรเจกต์)
                        "เหลืออีก 7 วัน" เคยขาดเป็น "เหลืออีก 7" กับ "วัน" คนละบรรทัด
                        ขึ้นบรรทัดใหม่ระหว่างก้อนได้ แต่ในก้อนเดียวกันต้องอยู่ด้วยกัน */}
                    <div style={sx('font:500 11.5px/1.75 Sarabun,sans-serif;display:flex;flex-wrap:wrap;gap:0 5px', { color: c.sub })}>
                      {String(it.detail || '').split(' · ').map((part, i, arr) => (
                        <span key={i} style={s('white-space:nowrap')}>{part}{i < arr.length - 1 ? ' ·' : ''}</span>
                      ))}
                    </div>
                  </div>
                
                  <div style={s(V.wide ? 'display:flex;gap:10px;flex:none' : 'display:flex;gap:8px;margin-top:10px')}>
                    <div {...kb(() => V.seeParked(seen ? '' : it.key))}
                      aria-label={seen ? 'ซ่อนรายการยาในล็อตนี้' : 'ดูรายการยาในล็อตนี้'}
                      className="hv-bg-f6 tap"
                      style={sx('display:flex;align-items:center;justify-content:center;padding:8px 12px;white-space:nowrap;border-radius:8px;border:1px solid rgba(30,36,32,.14);background:#fff;color:#414a44;font:600 12px/1.75 Sarabun,sans-serif;cursor:pointer;min-height:38px', {
                        flex: V.wide ? 'none' : '1', minWidth: V.wide ? '76px' : 0
                      })}>
                      {seen ? 'ซ่อนยา' : 'ดูยา'}
                    </div>
                
                    <div {...kb(it.take)} aria-label="เอาล็อตที่กรอกค้างไว้มาทำต่อ" className={c.hv + ' tap'}
                      style={sx('display:flex;align-items:center;justify-content:center;padding:8px 14px;white-space:nowrap;border-radius:8px;color:#fff;font:700 12px/1.75 Sarabun,sans-serif;cursor:pointer;min-height:38px', {
                        background: c.btn, flex: V.wide ? 'none' : '1.4', minWidth: V.wide ? '112px' : 0
                      })}>
                      {it.takeLabel}
                    </div>
                
                    <div {...kb(it.drop)} aria-label="ทิ้งล็อตที่กรอกค้างไว้" className="hv-del tap"
                      style={sx('display:flex;align-items:center;justify-content:center;padding:8px 12px;white-space:nowrap;border-radius:8px;border:1px solid rgba(176,42,91,.28);background:#fff;color:#b02a5b;font:600 12px/1.75 Sarabun,sans-serif;cursor:pointer;min-height:38px', {
                        flex: V.wide ? 'none' : '0.8', minWidth: V.wide ? '58px' : 0
                      })}>
                      ทิ้ง
                    </div>
                  </div>
                </div>
                {seen && (
                  <div style={s('border-top:1px solid #eef1ef;background:#fff')}>
                    {rowsTable(it.rows)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {other && (
          <div style={s('flex:none;padding:11px 18px;border-top:1px solid #eef1ef;background:#fbfcfb;font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>
            ล็อตจากเครื่องอื่นใช้ตอนเครื่องนั้นเสียแล้วต้องเอางานมาทำต่อ ·
            เอามาทำต่อแล้วเครื่องเดิมจะไม่เห็นอีก เพื่อไม่ให้สองเครื่องบันทึกของชุดเดียวกันซ้ำ
          </div>
        )}
      </div>
    </div>
  );
}
