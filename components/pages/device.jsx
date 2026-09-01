// หน้าต่างถามว่าเครื่องนี้คือเครื่องไหน
//
// พี่กันสั่ง 31 ส.ค. 2569:
//   "ให้ทุกคนตั้งชื่อ com ก่อนไหม และชื่อนั้นจะทำให้ระบบรู้ว่าควรจะส่งไปเครื่องไหน"
//   "ไม่ข้าม ต้องเลือก"
//   "ลืมไป มันจากมือถือก็ได้ งั้นใส่อีกชุด ว่าเลือกจากมือถือ หรือคอม ก่อน"
//
// ชื่อนี้ใช้บอกว่าร่างที่กรอกค้างไว้เป็นของเครื่องไหน เครื่องนี้เสียหรือหาย
// เอาเครื่องใหม่มาเลือกชื่อเดิม ของที่กรอกค้างไว้กลับมาครบ
//
// 🚨 เลือก 2 ชั้น — คอมเป็นเครื่องกลางระบุด้วยหมายเลขเครื่อง
//    ส่วนมือถือเป็นของส่วนตัวระบุด้วยชื่อคน (เปลี่ยนเครื่องใหม่ก็เลือกชื่อเดิม)
//
// 🚨 ไม่มีปุ่มข้าม กดพื้นหลังไม่ปิด ปุ่มยืนยันปิดไว้จนกว่าจะเลือกครบทั้งสองชั้น
import { s, sx, kb } from '../helpers';

const KIND = [
  { n: 1, title: 'คอมพิวเตอร์', why: 'เครื่องประจำในห้องยา' },
  { n: 2, title: 'มือถือ หรือแท็บเล็ต', why: 'พกไปเยี่ยมบ้านได้' }
];

export function renderDeviceAsk(V) {
  if (!V.deviceAskOpen) return null;

  const kind = V.deviceKind;
  const list = kind === 1 ? V.deviceComputers : kind === 2 ? V.deviceMobiles : [];
  const ready = !!V.devicePick;

  return (
    <div role="dialog" aria-modal="true"
      style={s('position:fixed;inset:0;background:rgba(20,26,22,.45);display:flex;align-items:center;justify-content:center;padding:22px 16px;z-index:52;overflow:auto')}>
      <div style={s('background:#fff;border-radius:14px;width:100%;max-width:470px;padding:20px 22px;box-shadow:0 8px 30px rgba(20,26,22,.2)')}>

        <div role="heading" aria-level="2" style={s('font:700 16px Sarabun,sans-serif;margin-bottom:5px')}>
          เครื่องนี้คือเครื่องไหน
        </div>
        <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:14px')}>
          ใช้บอกว่าล็อตที่กรอกค้างไว้เป็นของเครื่องไหน ถ้าเครื่องนี้เสียหรือหาย
          เอาเครื่องใหม่มาเลือกชื่อเดิม ของที่กรอกค้างไว้จะกลับมาครบ
        </div>

        {/* ── ชั้นที่ 1 ── */}
        <div style={s('font:600 11.5px/1.75 Sarabun,sans-serif;color:#414a44;margin-bottom:5px')}>กรอกจากอะไร</div>
        <div style={s('font:700 11px/1.75 Sarabun,sans-serif;color:#b02a5b;margin-bottom:9px')}>
          ต้องเลือกก่อนจึงจะใช้งานได้
        </div>

        <div style={s('display:flex;gap:8px;margin-bottom:14px')}>
          {KIND.map((k) => (
            <div key={k.n} {...kb(() => V.setDeviceKind(k.n))}
              aria-label={'เลือก ' + k.title}
              className="hv-bg-f6"
              style={sx('flex:1;border-radius:11px;padding:13px 10px;text-align:center;cursor:pointer;background:#fff', {
                border: kind === k.n ? '1.5px solid #2f7d5d' : '1.5px solid rgba(30,36,32,.16)',
                background: kind === k.n ? '#eef6f1' : '#fff'
              })}>
              <div style={sx('font:700 13.5px/1.75 Sarabun,sans-serif;margin-bottom:2px', { color: kind === k.n ? '#2f7d5d' : '#1e2420' })}>{k.title}</div>
              <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e')}>{k.why}</div>
            </div>
          ))}
        </div>

        {/* ── ชั้นที่ 2 ── */}
        {kind > 0 && (
          <>
            <div style={s('font:600 11.5px/1.75 Sarabun,sans-serif;color:#414a44;margin-bottom:5px')}>
              {kind === 1 ? 'เครื่องไหน' : 'มือถือของใคร'}
            </div>
            <select value={V.devicePick} onChange={(e) => V.setDevicePick(e.target.value)}
              aria-label={kind === 1 ? 'เลือกเครื่อง' : 'เลือกชื่อเจ้าของมือถือ'}
              style={s('width:100%;height:40px;border-radius:9px;border:1px solid rgba(30,36,32,.18);padding:0 11px;font:500 13px/1.75 Sarabun,sans-serif;color:#1e2420;background-color:#fff;margin-bottom:11px')}>
              <option value="">{kind === 1 ? '− เลือกเครื่อง −' : '− เลือกชื่อ −'}</option>
              {list.map((x) => <option key={x} value={x} style={s('font:500 13px/1.75 Sarabun,sans-serif')}>{x}</option>)}
            </select>

            <div style={s('background:#fdf8ec;border:1px solid rgba(150,101,15,.24);border-radius:9px;padding:9px 11px;font:500 11.5px/1.75 Sarabun,sans-serif;color:#7a6033;margin-bottom:14px')}>
              {kind === 1
                ? '🚨 ถ้าเครื่องนี้เคยตั้งชื่อไว้แล้ว ต้องเลือกชื่อเดิมให้ตรง เลือกผิดเครื่อง จะไปเห็นล็อตที่กรอกค้างของเครื่องอื่นแทน'
                : 'มือถือเป็นของส่วนตัว จึงระบุด้วยชื่อคนแทนหมายเลขเครื่อง เปลี่ยนมือถือใหม่ก็เลือกชื่อเดิม ของที่กรอกค้างไว้ตามมาด้วย'}
            </div>

            {kind === 2 && !list.length && (
              <div style={s('background:#fdf3f5;border:1px solid rgba(176,42,91,.24);border-radius:9px;padding:9px 11px;font:500 11.5px/1.75 Sarabun,sans-serif;color:#b02a5b;margin-bottom:14px')}>
                ยังไม่มีรายชื่อเจ้าหน้าที่ในระบบ ให้ตั้งรายชื่อในหน้าตั้งค่าก่อน แล้วค่อยกลับมาเลือก
              </div>
            )}
          </>
        )}

        <div style={s('display:flex;gap:8px;justify-content:flex-end')}>
          <div {...(ready ? kb(() => V.pickDevice(V.devicePick)) : {})}
            aria-label="ยืนยันชื่อเครื่อง"
            className={ready ? 'hv-teal' : ''}
            style={sx('padding:10px 20px;border-radius:9px;font:700 13px/1.75 Sarabun,sans-serif;min-height:42px;display:flex;align-items:center', ready
              ? { background: '#2f7d5d', color: '#fff', cursor: 'pointer' }
              : { background: '#f4f6f3', color: '#9aa19c', border: '1px solid rgba(30,36,32,.12)', cursor: 'default' })}>
            ใช้ชื่อนี้
          </div>
        </div>
      </div>
    </div>
  );
}
