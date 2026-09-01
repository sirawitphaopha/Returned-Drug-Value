// ═══════════════════════════════════════════════════════════════════════════
// หน้าต่างเลือกเหตุผลที่ต้องทำลายยา
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันเคาะ 26 ส.ค. 2569 (ผลตรวจข้อ ส-8):
//   "เอาทุกข้อเลย แต่ให้มีใส่ความหมายไว้ด้วยนะ หาที่ใส่"
//   และเลือกแบบ ก) — เด้งถามทันทีที่กดปุ่มทำลาย
//
// ปัญหาเดิม: ช่องเหตุผลมีอยู่ แต่กรอกได้ทางเดียวคือป๊อปใส่จำนวนฝั่งมือถือ
// เส้นทางหลักบนคอม (พิมพ์ชื่อยา Enter ใส่จำนวน Enter) ไม่มีช่องให้กรอกเลย
// ผลคือตอบผู้บริหารไม่ได้ว่า "ทำลายไป 40,000 บาท เพราะอะไร"
// ซึ่งเป็นเหตุผลเดียวที่ใส่ช่องนี้มาตั้งแต่แรก
//
// 🚨 ตัวเดียวใช้ทุกที่ที่กด "ทำลาย" — ปุ่มก่อนกดเพิ่ม · สลับแถวที่เพิ่มแล้ว
//    ทั้งฝั่งคอมและฝั่งมือถือ · ตรงกับกฎ "อะไรที่คล้ายกันรวมเป็นระบบกลางตัวเดียว"
//
// 🚨 กดพื้นหลังปิดได้ และปิดแล้วถือว่า "ไม่เปลี่ยนเป็นทำลาย"
//    ต่างจากป๊อปยืนยันลบที่กดพื้นหลังไม่ปิด เพราะอันนี้ไม่ใช่การกระทำที่ย้อนยาก
//    กดพลาดแล้วปิดทิ้ง ของยังเป็น "ใช้ต่อได้" เหมือนเดิม ไม่มีอะไรเสียหาย
import { s, sx, kb } from '../helpers';

export function renderReasonPick(V) {
  if (!V.reasonOpen) return null;

  return (
    <>
      <div {...kb(V.closeReason)} style={s('position:fixed;inset:0;background:rgba(21,26,23,.42);z-index:70')}></div>
      <div role="dialog" aria-modal="true" aria-label="เลือกเหตุผลที่ต้องทำลาย"
        style={s('position:fixed;inset:0;z-index:71;display:flex;align-items:center;justify-content:center;padding:20px;pointer-events:none')}>
        <div style={s('pointer-events:auto;width:100%;max-width:470px;max-height:calc(100dvh - 40px);overflow-y:auto;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(30,36,32,.28);padding:20px 20px 16px')}>

          <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:3px')}>
            <div role="heading" aria-level="2" style={s('font:700 17px/1.3 Sarabun,sans-serif')}>เหตุผลที่ต้องทำลาย</div>
            <div {...kb(V.closeReason)} aria-label="ปิด" className="hv-bg-f6 tap"
              style={s('flex:none;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:400 15px Sarabun,sans-serif;color:#6b746e;cursor:pointer')}>✕</div>
          </div>

          <div style={s('font:400 12.5px/1.6 Sarabun,sans-serif;color:#6b746e;margin-bottom:13px;overflow-wrap:anywhere')}>{V.reasonDrugLabel}</div>

          {/* รายการเหตุผล — แต่ละแถวมีชื่อกับคำอธิบายอยู่ด้วยกัน
              🚨 คำอธิบายต้องอยู่ในแถวเลย ไม่ใช่ซ่อนไว้ให้เอาเมาส์ไปชี้
                 คนที่รับยาคืนหน้าเคาน์เตอร์อาจไม่ใช่เภสัชกร และบนมือถือไม่มีเมาส์ให้ชี้ */}
          <div style={s('display:flex;flex-direction:column;gap:7px')}>
            {V.reasonList.map((r) => (
              <div key={r.label} {...kb(r.pick)} className="tap hv-reason"
                style={sx('text-align:left;border-radius:11px;padding:11px 13px;cursor:pointer;transition:background .12s',
                  { background: r.bg, border: '1px solid ' + r.border })}>
                <div style={sx('font:600 13.5px/1.35 Sarabun,sans-serif', { color: r.fg })}>{r.label}</div>
                <div style={s('font:400 11.5px/1.5 Sarabun,sans-serif;color:#6b746e;margin-top:2px')}>{r.help}</div>
              </div>
            ))}
          </div>

          <div style={s('font:400 11.5px/1.6 Sarabun,sans-serif;color:#6f7873;margin-top:12px;text-align:center')}>
            เลือกแล้วรายการจะถูกตั้งเป็นทำลายทันที · ปิดหน้าต่างนี้เพื่อยกเลิก
          </div>
        </div>
      </div>
    </>
  );
}
