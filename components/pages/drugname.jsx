// วาดชื่อยาพร้อมสีทีละส่วน — ตัวกลางตัวเดียวของทั้งเว็บ
//
// พี่กันสั่ง 25 ส.ค. 2569: "ชื่อจัดเต็ม มียี่ห้อด้วยนะ ไม่งั้นบางตัวหลง
// มี ER IR ให้เหมือนกับตอนค้นหา ตามรูปเลย และค่านี้แสดงทั้งเว็บ"
// ตามด้วย "ไหนสีแบบที่ช่องค้นหา" หลังเห็นหน้าประวัติเป็นข้อความสีเดียว
//
// ก่อนหน้านี้แต่ละหน้าวาดชื่อยาเอง หน้าค้นหามีสีครบ หน้าประวัติกับหน้าสรุปเป็นสีเดียว
// รวมมาไว้ที่เดียวตามกฎ "อะไรที่คล้ายกันต้องเป็นระบบเดียว"
//
// 🚨 ลำดับห้ามสลับ — ตรงกับ lib/drugName.js และ mr_drug_label ฝั่งฐาน
//    ชื่อสามัญ (ตัวย่อ) (สีเม็ด) ความแรง (%) รูปแบบยา (ER/IR) (ยี่ห้อ)
//
// 🚨 สีแต่ละส่วนห้ามสลับกัน (ดูสกิล pharmacy-web-logic)
//    ม่วง = ตัวย่อ · ส้มอำพัน = เปอร์เซ็นต์ · แดงอมชมพูเอียง = ER/IR · เทล = ชื่อการค้า
//    สีเม็ดยาใช้สีจริงของเม็ด จึงไม่ชนกับใคร
import { s, sx } from '../helpers';

// ก้อนสั้นห้ามถูกตัดขาดกลางเวลาบรรทัดยาวเกิน
// "(40 + 200 mg/5 mL)" เคยตัด "(40 + 200" ค้างบรรทัดบน "mg/5 mL)" ตกบรรทัดล่าง
// อ่านแล้วสับสนว่าความแรงเท่าไหร่ · ก้อนที่ยาวจริง ๆ ต้องยอมให้ตัด ไม่งั้นล้นจอมือถือ
const nw = (on) => (on ? { whiteSpace: 'nowrap' } : {});

// ── สีในโหมดมืด ────────────────────────────────────────────────────────────
// 🔴 บั๊กที่พี่กันเจอ 26 ส.ค. 2569: "ชื่อยาหายในโหมดมืด"
//    ชื่อสามัญใช้ #1e2420 (เกือบดำ) ตายตัว พอพื้นการ์ดเป็นสีมืดก็กลืนหายไปทั้งชื่อ
//    เหลือแต่ความแรงกับรูปแบบยา = อ่านไม่ออกว่ายาอะไร ซึ่งเป็นข้อมูลความปลอดภัย
//
// 🚨 สีที่เปลี่ยนมีแค่สองตัวที่เข้มจนกลืนพื้นมืด (ชื่อสามัญ กับ รูปแบบยา)
//    ที่เหลือ (ม่วง เทล ส้ม แดงอมชมพู) เป็นสีกลางที่อ่านออกทั้งสองพื้น ห้ามเปลี่ยน
//    เพราะสีพวกนั้นมีความหมายเฉพาะตัว (ดู CLAUDE.md ข้อ 3.4.3)
const C = (dark) => ({
  name: dark ? '#e8ece9' : '#1e2420',
  form: dark ? '#b9c2bc' : '#414a44',
  strength: dark ? '#9aa5a0' : '#6b746e',
  hitBg: dark ? 'rgba(47,125,93,.32)' : '#dcefe4',
  hitFg: dark ? '#7fd6ab' : '#2f7d5d',
  brand: dark ? '#7fd6ab' : '#2f7d5d'
});

// r = ผลจาก vals/record.js → nameParts() ผสมกับข้อมูลไฮไลต์คำค้น
// opts.size = ขนาดตัวอักษร (หน้าค้นหาย่อลงเมื่อชื่อยาว) · ไม่ส่งมาใช้ 13.5px
// opts.dark = โหมดมืด (หน้าสรุปเป็นหน้าเดียวที่มี)
export function renderDrugName(r, opts) {
  const o = opts || {};
  const c = C(!!o.dark);
  // 🚨 กันหน้าขาวทั้งจอ — ถ้าที่เรียกลืมส่งชิ้นส่วนมา ให้วาดชื่อเป็นข้อความธรรมดาแทน
  //    เคยพลาด 25 ส.ค. 2569: การ์ดหนึ่งในหน้าสรุปยังไม่ได้ต่อสาย แล้วทั้งหน้าล่มทันที
  if (!r) return null;
  if (!r.mkBefore && !r.mkHit && !r.mkAfter && !r.strength) {
    return <span style={sx('font-weight:500', { color: c.name })}>{r.name || ''}</span>;
  }
  return (
    <span style={sx('font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;line-height:1.35;overflow-wrap:anywhere',
      o.size ? { fontSize: o.size } : {})}>
      {/* ชื่อสามัญ — ส่วนที่ตรงกับคำค้นจะถูกไฮไลต์พื้นเขียวอ่อน */}
      <span style={sx('font-weight:600', { color: c.name })}>{r.mkBefore}</span>
      {r.mkHit ? <span style={sx('font-weight:700;border-radius:3px;padding:0 1px', { color: c.hitFg, background: c.hitBg })}>{r.mkHit}</span> : null}
      <span style={sx('font-weight:600', { color: c.name })}>{r.mkAfter}</span>

      {/* ตัวย่อที่เภสัชกรเรียกกันจริง (CPM · HCTZ · MST) — วงเล็บสีม่วง
          วางถัดจากชื่อยาทันที เพราะเป็น "ชื่อเรียกอีกแบบ" ของยาตัวเดียวกัน
          คนละสีกับชื่อการค้า (เทล) เพื่อให้แยกออกว่าอันไหนตัวย่อ อันไหนยี่ห้อ */}
      {r.hasAbbrev && (
        <span style={sx("font-weight:600;color:#6d3b9e;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(r.abbrevNoWrap))}>
          ({r.abBefore}{r.abHit ? <span style={s('background:#ece3f6;border-radius:3px;padding:0 1px')}>{r.abHit}</span> : null}{r.abAfter})
        </span>
      )}

      {/* 🚨 สีเม็ดยาจริง — Warfarin แยกความแรงด้วยสีเม็ดตามที่ผู้ผลิตตั้งใจทำมา
          เภสัชกรกับคนไข้จำยาตัวนี้ด้วยสีมากกว่าตัวเลข หน้าจอต้องพูดภาษาเดียวกับของในมือ
          วางไว้ติดชื่อยา เพราะเป็น "ลักษณะของยาตัวนี้" ไม่ใช่ข้อมูลประกอบ */}
      {r.pillLabel && (
        <span style={sx('font-weight:700;margin-left:5px;white-space:nowrap', { color: r.pillColor })}>({r.pillLabel})</span>
      )}

      {/* ความแรง — ถ้ามียาชื่อเดียวกันหลายความแรงในรายการเดียว ตัวเลขจะถูกทาสีคนละสี
          กันหยิบสลับ (Morphine 10 · 20 · 30 mg) · หน่วยคงสีเทาเดิม บรรทัดจะได้ไม่รก */}
      {r.strength && (
        <span style={sx("font-weight:500;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:6px", Object.assign({ color: c.strength }, nw(r.strengthNoWrap)))}>
          {r.stColor
            ? <><span style={{ color: r.stColor, fontWeight: 700 }}>{r.stNum}</span>{r.stRest}</>
            : r.strength}
        </span>
      )}

      {/* ความเข้มข้นเป็นเปอร์เซ็นต์ สีส้มอำพัน — ไม่ชนกับเทล (ชื่อการค้า) และไม่ชนกับแดง (ทำลาย) */}
      {r.hasPercent && (
        <span style={sx("font-weight:700;color:#96650f;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(true))}>{r.percentLabel}</span>
      )}

      {/* รูปแบบยา (tab · cap · injection) — บอกได้ทันทีว่ายากินหรือยาฉีด */}
      {r.form && (
        <span style={sx('font-weight:600;margin-left:6px', Object.assign({ color: c.form }, nw(r.formNoWrap)))}>{r.form}</span>
      )}

      {/* 🚨 รูปแบบการออกฤทธิ์ (ER · IR · SR) — เอียง หนา วงเล็บ แดงอมชมพู
          ตั้งใจให้สะดุดตากว่าทุกตัวในบรรทัด เพราะ Morphine 10 mg ER กับ IR เป็นคนละยากัน
          ในคลังมี Sodium valproate 200 mg ทั้ง ER และ IR ชื่อเหมือนกันเป๊ะทุกตัวอักษร */}
      {r.hasRelease && (
        <span style={sx("font-weight:700;font-style:italic;color:#b02a5b;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(true))}>{r.releaseLabel}</span>
      )}

      {/* ชื่อการค้าในวงเล็บ สีเทลตัวหนา — เภสัชกรจำ Kapanol ได้ก่อนชื่อสามัญ */}
      {r.hasBrand && (
        <span style={sx('font-weight:600;margin-left:6px', Object.assign({ color: c.brand }, nw(r.brandNoWrap)))}>
          ({r.bdBefore}{r.bdHit ? <span style={s('background:#dcefe4;border-radius:3px;padding:0 1px')}>{r.bdHit}</span> : null}{r.bdAfter})
        </span>
      )}
    </span>
  );
}
