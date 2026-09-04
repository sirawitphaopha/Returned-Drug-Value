// หน้าบันทึก — คัดจากมอคอัป มือถือ (บรรทัด 28–123) คอม (124–220) แถบบันทึกล่างจอมือถือ (541–565)
// ตัดออกตามที่ตกลงไว้: สวิตช์จำลองเน็ตหลุด (ของเดโม) และเลขคงคลังปลอมใต้ชื่อยา
import { s, sx, kb, APP_VERSION } from '../helpers';
import { renderParked } from './parked';
import { renderDrugName } from './drugname';
import { renderSearchBox } from './thaibox';
import { renderPageHead, HEAD_PAD } from './pagehead';
import { renderRecorderField } from './recorder';
import { renderPcuField } from './pcufield';

// ก้อนสั้นในบรรทัดชื่อยาห้ามถูกตัดขาดกลาง (ความแรง · ตัวย่อ · % · รูปแบบ · ER · ชื่อการค้า)
// เว้นวรรคระหว่างก้อนทำด้วย margin-left ไม่ใช่ช่องว่างในข้อความ จึงยังขึ้นบรรทัดใหม่ระหว่างก้อนได้
// ธง *NoWrap คำนวณจากความยาวใน vals/record.js — ก้อนที่ยาวเกินกรอบยอมให้ตัดตามปกติ
const nw = (on) => (on ? { whiteSpace: 'nowrap' } : null);

// ── หนึ่งบรรทัดในรายการผลค้นยา ───────────────────────────────────────────────
// ต่างจากมอคอัปที่โชว์ชื่อยาเป็นพืดเดียวกับ "หน่วย · คงคลัง 1234" (เลขมั่วของเดโม)
// พี่กันขอให้อ่านง่ายขึ้น เลยจัดใหม่เป็น
//   บรรทัดบน  = ชื่อยาตัวหนาเข้ม (ไฮไลต์คำที่พิมพ์ค้นด้วยพื้นเขียวอ่อน)
//                + ความแรงตัวเบากว่าต่อท้าย → ตาแยกชื่อกับขนาดออกทันที
//   บรรทัดล่าง = หน่วยนับ · ป้ายเตือนถ้ายังไม่ใส่ราคา (ทำเป็นป้ายเล็ก ไม่ใช่ตัวหนังสือแดงลอย)
//   ฝั่งขวา    = ราคา ตัวเลขใหญ่ + "ต่อ เม็ด" ตัวเล็กใต้ลงมา
function renderDrugOption(r, big) {
  const nameSize = big ? '15.5px' : '14.5px';
  return (
    <div key={r.name} ref={r.hiRef} {...kb(big ? r.pick : r.pickInline)} className="hv-bg-eef"
      style={sx('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(30,36,32,.06);cursor:pointer', { background: r.rowBg })}>

      <div style={s('min-width:0;flex:1')}>
        {/* 🚨 ห้ามใช้ white-space:nowrap + ellipsis ตรงนี้ (พี่กันแจ้ง 10 ส.ค. 2569)
            ยาชื่อยาวอย่าง "Gramicidin + Neomycin sulfate + Polymyxin b sulfate"
            ทำให้ความแรงโดนตัด และชื่อการค้าหายทั้งอัน — ทั้งที่ค้นด้วยชื่อการค้าอยู่แท้ ๆ
            ความแรงเป็นข้อมูลความปลอดภัย (25 กับ 5000 mcg คนละเรื่อง) ซ่อนไม่ได้
            ยอมให้แถวสูงขึ้นเฉพาะยาชื่อยาว ดีกว่าซ่อนของสำคัญ */}
        <div style={sx('font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;line-height:1.35;overflow-wrap:anywhere', { fontSize: nameSize })}>
          <span style={s('font-weight:600;color:#1e2420')}>{r.mkBefore}</span>
          <span style={s('font-weight:700;color:#2f7d5d;background:#dcefe4;border-radius:3px;padding:0 1px')}>{r.mkHit}</span>
          <span style={s('font-weight:600;color:#1e2420')}>{r.mkAfter}</span>
          {/* ตัวย่อที่เภสัชกรเรียกกันจริง (CPM · HCTZ · INH) — วงเล็บสีม่วง
              วางถัดจากชื่อยาทันที เพราะเป็น "ชื่อเรียกอีกแบบ" ของยาตัวเดียวกัน
              คนละสีกับชื่อการค้า (เทล) เพื่อให้แยกออกว่าอันไหนตัวย่อ อันไหนยี่ห้อ */}
          {r.hasAbbrev && (
            <span style={sx("font-weight:600;color:#6d3b9e;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(r.abbrevNoWrap))}>
              ({r.abBefore}<span style={s('background:#ece3f6;border-radius:3px;padding:0 1px')}>{r.abHit}</span>{r.abAfter})
            </span>
          )}
          {/* 🚨 สีเม็ดยาจริง — Warfarin แยกความแรงด้วยสีเม็ดตามที่ผู้ผลิตตั้งใจทำมา
              เภสัชกรกับคนไข้จำยาตัวนี้ด้วยสีมากกว่าตัวเลข หน้าจอต้องพูดภาษาเดียวกับของในมือ
              วางไว้ติดชื่อยาทันที เพราะเป็น "ลักษณะของยาตัวนี้" ไม่ใช่ข้อมูลประกอบ
              (พี่กันสั่ง 25 ส.ค. 2569 · ตารางสีอยู่ lib/drugPillColors.js) */}
          {r.pillLabel && (
            <span style={sx('font-weight:700;margin-left:5px;white-space:nowrap', { color: r.pillColor })}>({r.pillLabel})</span>
          )}
          {/* ความแรง — ถ้าผลค้นหามียาชื่อเดียวกันหลายตัว ตัวเลขจะถูกทาสีคนละสีเพื่อไม่ให้หยิบสลับ
              (Morphine 10 · 20 · 30 mg) · หน่วยคงสีเทาเดิม บรรทัดจะได้ไม่รก */}
          {r.strength && (
            <span style={sx("font-weight:500;color:#6b746e;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:6px", nw(r.strengthNoWrap))}>
              {r.stColor
                ? <><span style={{ color: r.stColor, fontWeight: 700 }}>{r.stNum}</span>{r.stRest}</>
                : r.strength}
            </span>
          )}
          {/* ความเข้มข้น % ในวงเล็บ สีส้มอำพัน — พี่กันขอให้เห็นง่าย
              เลือกสีนี้เพราะไม่ชนกับเทล (ชื่อการค้า) และไม่ชนกับแดง (ทำลาย) */}
          {r.hasPercent && (
            <span style={sx("font-weight:700;color:#96650f;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(true))}>{r.percentLabel}</span>
          )}
          {/* รูปแบบยา (tab · cap · injection) — ลำดับเดียวกับ ME-DRP คือก่อนชื่อการค้า
              บอกได้ตั้งแต่ตอนค้นว่าเป็นยากินหรือยาฉีด */}
          {r.form && (
            <span style={sx('font-weight:600;color:#414a44;margin-left:6px', nw(r.formNoWrap))}>{r.form}</span>
          )}
          {/* 🚨 รูปแบบการออกฤทธิ์ (ER · IR · SR) — เอียง หนา วงเล็บ แดงอมชมพู
              พี่กันเลือกแบบ ง · ตั้งใจให้สะดุดตากว่าทุกตัวในบรรทัด
              เพราะ Morphine 10 mg ER กับ IR เป็นคนละยากัน สลับกันแล้วอันตราย
              และในคลังมี Sodium valproate 200 mg ทั้ง ER และ IR ชื่อเหมือนกันเป๊ะ */}
          {r.hasRelease && (
            <span style={sx("font-weight:700;font-style:italic;color:#b02a5b;font-family:var(--font-en),var(--font-sarabun),Sarabun,sans-serif;margin-left:5px", nw(true))}>{r.releaseLabel}</span>
          )}
          {/* ชื่อการค้าในวงเล็บ สีเทลตัวหนา — แสดงเฉพาะยาที่มี (37 ตัวจาก 417)
              ทำตามแบบ ME-DRP ที่พี่กันชี้ให้ดู · ไฮไลต์คำค้นข้างในด้วยเพราะค้นจากชื่อการค้าได้ */}
          {r.hasBrand && (
            <span style={sx('font-weight:600;color:#2f7d5d;margin-left:6px', nw(r.brandNoWrap))}>
              ({r.bdBefore}<span style={s('background:#dcefe4;border-radius:3px;padding:0 1px')}>{r.bdHit}</span>{r.bdAfter})
            </span>
          )}
        </div>
        <div style={s('display:flex;align-items:center;gap:6px;margin-top:2px')}>
          {/* ทางให้ยา (IV · oral) นำหน้าหน่วยนับ ตำแหน่งเดียวกับ ME-DRP
              เข้มกว่าหน่วยนับนิดหนึ่ง เพราะเป็นข้อมูลของตัวยา ส่วนหน่วยนับเป็นเรื่องการนับ */}
          {r.route && (
            <>
              <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>{r.route}</span>
              <span style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#cfd4d0')}>·</span>
            </>
          )}
          <span style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6f7873')}>{r.unitLabel}</span>
          {r.noPrice && (
            <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#c2543c;background:#fbe4dd;border-radius:4px;padding:1px 6px;flex:none')}>ยังไม่ใส่ราคา</span>
          )}
        </div>
      </div>

      <div style={s('text-align:right;flex:none')}>
        <div style={sx("font:600 14px Sarabun,sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap", { color: r.priceColor })}>{r.priceLabel}</div>
        {r.priceSub && <div style={s('font:400 10.5px/1.75 Sarabun,sans-serif;color:#6f7873;white-space:nowrap')}>{r.priceSub}</div>}
      </div>
    </div>
  );
}

// ── มือถือ ──────────────────────────────────────────────────────────────────
export function renderRecordNarrow(V) {
  return (
    <div style={s('width:100%;max-width:520px;margin:0 auto;display:flex;flex-direction:column;min-height:100%;flex:1 0 auto')}>
      {renderParked(V)}
      {/* ── หัวเว็บฝั่งมือถือ ตรึงไว้บนสุด (พี่กันสั่ง 1 ก.ย. 2569) ──────────────
          "ทำไมตรงกดส่งยามันตรึงได้ล่ะ อันนี้ยังทำได้เลย"

          แถบบันทึกกับแถบเมนูตรึงได้เพราะมันอยู่ "นอก" พื้นที่เลื่อน (เป็นพี่น้องกัน)
          ส่วนหัวเว็บอยู่ "ใน" พื้นที่เลื่อน จึงไถลไปกับเนื้อหา
          ย้าย DOM ออกไปข้างนอกก็ได้ แต่จะรื้อโครงทั้งหน้า — ใช้ position:sticky แทน
          ซึ่งตรึงกับขอบบนของพื้นที่เลื่อนได้โดยไม่ต้องย้ายอะไรเลย

          🚨 z-index ต้องสูงกว่าเนื้อหาที่เลื่อนผ่านใต้มัน แต่ต่ำกว่าหน้าต่างซ้อนทุกตัว
             (ต่ำสุดคือป๊อปใส่จำนวนที่ 20 — ตรงนี้จึงใช้ 6)
          🚨 พื้นต้องทึบ ไม่งั้นเห็นรายการยาไหลผ่านทะลุหลังชื่อเว็บ
          ⚠️ ฝั่งคอมไม่ได้ตรึงตรงนี้ หน้าบันทึกคอมล็อกความสูงเท่าจออยู่แล้ว (กฎข้อ 3.2) */}
      {/* 🚨 หัวใช้ตัวกลาง components/pages/pagehead.jsx ตัวเดียวกับหน้าประวัติและหน้าสรุป
          พี่กันวัดด้วยตาแล้วจับได้ว่าปุ่ม ℹ ⚙ ขยับทั้งสามหน้า (4 ก.ย. 2569)
          ค่าทุกตัวในตัวกลางลอกจากหน้านี้มาเป๊ะ เพราะพี่กันบอกว่าหน้านี้คือหน้าหลักที่ตรึงแล้ว
          เปลี่ยนมาใช้ตัวกลางแล้วหน้านี้ต้องไม่ขยับสักจุด — วัดยืนยันแล้ว
          🚨 ปุ่มวันที่ส่งเข้าไปทาง extra จึงยังอยู่ที่เดิมก่อนปุ่มสองตัวเหมือนเดิม */}
      <div style={s('position:sticky;top:0;z-index:6;' + HEAD_PAD + ';background:#fff;border-bottom:1px solid rgba(30,36,32,.07)')}>
        {renderPageHead({
          onHome: V.goHome, onAbout: V.openAbout, onSettings: V.openSettings,
          // เลขรุ่นเป็นบรรทัดรองของหน้านี้ (พี่กันสั่ง 4 ก.ย. 2569)
          // อีกสองหน้ามีบรรทัดรองอยู่แล้ว หน้านี้เว้นว่างไว้จึงดูไม่เป็นชุดเดียวกัน
          // 🚨 ดึงจาก helpers ตรง ๆ ไม่ใช้ V.appVersion เพราะค่านั้นอยู่ใน vals/settings
          //    ซึ่งถูกข้ามการคำนวณตอนไม่ได้เปิดหน้าตั้งค่า (กฎข้อ 3.62)
          sub: (<span style={s('font:700 11px/1.45 Sarabun,sans-serif;color:#2f7d5d')}>{'v' + APP_VERSION}</span>),
          extra: (<div {...kb(V.toggleMore)} className="hv-bg-f6" style={s("display:flex;align-items:center;gap:6px;height:38px;padding:0 12px;border:1px solid rgba(30,36,32,.14);border-radius:9px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer")}>{V.dateLabel} <span style={s('color:#6f7873')}>▾</span></div>),
        })}

        {/* ปุ่ม ✕ ล้างช่องค้นหาทีเดียว — พี่กันขอ ไม่ต้องกด Backspace รัว */}
        {/* ── ช่องค้นยาฝั่งมือถือ — ช่องกรอกไม่ได้วาดตัวอักษรเอง ──────────────────

            พี่กันเจอ 1 ก.ย. 2569 แล้วสั่งซ้ำสี่รอบ: "ไม้โทโดนหั่นเหลือครึ่งตัว"
            และให้คำว่า "ก้" มาเทียบ เพื่อให้เห็นว่าไม้โทเต็มตัวหน้าตาเป็นยังไง

            🚨 ต้นเหตุ — ช่องกรอกทุกชนิดตัดตัวอักษรที่ล้นออกนอกตัวเองเสมอ
               สั่ง overflow: visible ไปก็ถูกเบราว์เซอร์เปลี่ยนเป็นตัดอัตโนมัติ
               (ข้อตกลงของทุกเบราว์เซอร์ ดู Chromium bug 339052 · W3C bug 17473)
               textarea ก็โดนเหมือนกัน วัดค่าจริงแล้วได้ auto ทั้งที่สั่ง visible
               ที่ลองมาแล้วไม่ได้ผลทุกทาง — เพิ่มระยะบรรทัด · ถอดความสูงตายตัว ·
               ดันข้อความลงด้วยระยะขอบ · เปลี่ยนฟอนต์ · ทำช่องสูงเกินกรอบ

            วิธีที่ใช้ — ให้กล่องธรรมดาวาดตัวอักษรแทน (กล่องธรรมดาปล่อยล้นได้)
            แล้วทำตัวอักษรในช่องกรอกจริงให้โปร่งใส เหลือแต่ขีดกะพริบ
            เป็นท่าเดียวกับช่องจำนวนฝั่งคอมที่โชว์สูตรสองสี (กฎข้อ 3.27)

            🚨 กล่องที่วาดต้องใช้ฟอนต์ ขนาด และระยะขอบชุดเดียวกับช่องกรอกเป๊ะ
               ไม่งั้นขีดกะพริบจะไม่ตรงกับตัวอักษรที่เห็น
            🚨 ต้องเลื่อนตามกันเมื่อข้อความยาวเกินช่อง (onScroll → scrollLeft)
            🚨 ฝั่งคอมห้ามแตะ (พี่กันสั่ง) */}
        {/* ช่องค้นหามาตรฐานของทั้งเว็บ (thaibox.jsx) — พี่กันตั้งเป็นกฎ 3 ก.ย. 2569
            เดิมช่องนี้วาดโครงสามชั้นเอง จึงไม่มีแว่นขยายเหมือนช่องอื่น (พี่กันจับได้)
            🚨 ต้องส่ง inputRef ไปด้วย หน้าบันทึกสั่งโฟกัสกลับมาที่ช่องนี้ 4 จุด
               หลังเลือกยา ปิดป๊อป และล้างคำค้น */}
        {/* 🚨 ช่องค้นยาหน้านี้อยู่ในกล่องหัวเดียวกับชื่อเว็บ ต่างจากหน้าประวัติกับหน้าสรุป
            ที่ช่องค้นอยู่นอกกล่อง แล้วได้ระยะขอบในล่างของกล่อง (11 จุด) มาบวกให้เอง
            หน้านี้จึงต้องใส่ระยะเองเท่ากัน ไม่งั้นช่องค้นมาชิดหัวเว็บ
            (พี่กันเจอเอง 4 ก.ย. 2569 "จุดนี้กลับบีบกว่าเดิม") */}
        <div style={s('margin-top:12px')} />
        {renderSearchBox({
          value: V.query, onChange: V.onQuery, onKeyDown: V.onSearchKey,
          onClear: V.clearQuery, inputRef: V.searchRef,
          placeholder: V.searchPlaceholder,
          font: '400 16px/1.75 var(--font-sarabun), Sarabun, sans-serif',
          h: 42, bg: '#f6f7f4',
          swapLabel: V.showSwap ? V.swapLabel : '',
          ariaLabel: 'ค้นชื่อยา',
        })}

        {/* 🚨 overscroll-behavior:contain — เลื่อนดูยาจนสุดกรอบแล้วหน้าเว็บข้างหลังต้องไม่ไหลตาม
            (กฎกลาง pharmacy-web-logic ข้อ 28) ไม่เปลี่ยนหน้าตาสักพิกเซล เปลี่ยนแค่พฤติกรรมการเลื่อน */}
        {V.hasResults && (
          <div style={s('margin-top:8px;border:1px solid rgba(30,36,32,.10);border-radius:12px;background:#fff;box-shadow:0 10px 26px rgba(30,36,32,.12);overflow:hidden;max-height:264px;overflow-y:auto;overscroll-behavior:contain')}>
            {V.results.map((r) => renderDrugOption(r, true))}
          </div>
        )}

        {V.noResults && (
          <div style={s('margin-top:8px;padding:13px 14px;border:1px dashed rgba(30,36,32,.18);border-radius:12px;text-align:center')}>
            <div style={s('font:400 13px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:9px')}>ไม่พบยาชื่อนี้ ลองพิมพ์ชื่อสามัญ เช่น amlo, metf, insu</div>
            <div {...kb(V.openOffListDrug)} className="hv-bg-e3f tap" style={s('display:inline-flex;align-items:center;padding:9px 16px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer')}>ยาอื่น — พิมพ์ชื่อเอง</div>
          </div>
        )}

        {/* ชิปแหล่งที่มาฝั่งมือถือ — ชื่อสั้นและลงแถวเดียวเสมอ (พี่กันสั่ง 1 ก.ย. 2569)
            🚨 ห้ามใส่ flex-wrap — ตกแถวที่สองเมื่อไหร่คือกินที่ของรายการยาทันที
               ชิปยืดหดตามที่ว่างแทน (flex:1) และห้ามให้ตัวอักษรตัดบรรทัด
            🚨 ฝั่งเดสก์ท็อปห้ามแตะ ยังใช้ชื่อเต็มกับ flex-wrap เหมือนเดิม */}
        <div style={s('display:flex;gap:5px;margin-top:10px')}>
          {/* 🚨 ชิปเตี้ย 30px (พี่กันสั่ง 1 ก.ย. 2569 "บีบตรงนี้โว้ย")
              เดิม min-height 44px ตามเกณฑ์นิ้ว แต่พี่กันเห็นแล้วว่ากินที่มากเกินไป
              ยังกดง่ายอยู่เพราะกว้างเต็มหนึ่งในห้าของจอ (ราว 70px) ซึ่งเกินเกณฑ์ในแนวกว้าง
              และไม่มีปุ่มอื่นวางติดกันในแนวตั้งให้กดพลาด */}
          {V.sources.map((src) => (
            <div key={src.label} {...kb(src.pick)} className={src.on ? 'hv-seg-on' : 'hv-seg-off'} style={sx('flex:1;min-width:0;display:flex;align-items:center;justify-content:center;height:30px;padding:0 4px;border-radius:999px;font:500 11.5px/1.75 Sarabun,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', { background: src.bg, color: src.fg })}>{src.short}</div>
          ))}
        </div>

        {/* รพ.สต. ต้นทาง — วางนอกส่วน "ตัวเลือกเพิ่มเติม" ให้เห็นทันทีที่เลือก รพ.สต.
            ไม่ใช่ซ่อนไว้จนต้องกดเปิดหา ซึ่งจะทำให้ลืมกรอกได้ง่ายมาก */}
        {renderPcuField(V, { required: true, inline: true })}

        {/* ── วันที่กับ HN อยู่แถวเดียว ป้ายอยู่ข้างช่อง (พี่กันสั่ง 1 ก.ย. 2569) ──
            "วันที่ HN ย้ายงี้หน่อยเป็นเเถวเดียว"

            เดิมป้ายอยู่บนช่อง กินความสูงช่องละสองบรรทัด รวมสี่บรรทัด
            ย้ายป้ายมาไว้ข้างซ้ายในกรอบเดียวกัน เหลือบรรทัดเดียว

            🚨 กรอบอยู่ที่กล่องนอก ช่องกรอกจึงไม่มีขอบของตัวเอง
               ปล่อยให้มีทั้งคู่จะเห็นเส้นซ้อนสองชั้น
            🚨 ช่องกรอกยังต้องเป็น 16px ไม่งั้น iPhone ซูมเองตอนแตะ

            ⚠️ ช่องผู้บันทึกย้ายไปอยู่ในแถบบันทึกล่างจอแล้ว (พี่กันสั่ง
               "ผู้บันทึก เอาตรึงไว้ตรงกดส่ง") — มันต้องเลือกก่อนกดส่ง
               อยู่ติดปุ่มส่งจึงเห็นพร้อมกันโดยไม่ต้องเลื่อนหา */}
          {/* 🚨 ไม่มีเส้นคั่นแนวนอนแล้ว (พี่กันสั่ง 1 ก.ย. 2569)
              "ไม่เอาเส้นเเบ่งเเนวนอนระหว่าง รพสต เเละวันที่"
              สามช่องเป็นชุดเดียวกันอยู่แล้ว เส้นคั่นทำให้ดูเหมือนคนละพวก
              ระยะห่างบอกการแบ่งกลุ่มได้พอโดยไม่ต้องขีดเส้น */}
        {V.showMore && (
          <div style={s('margin-top:9px;display:flex;gap:9px')}>

            <div style={s('flex:1;min-width:0;display:flex;align-items:center;height:40px;padding:0;border:1px solid rgba(47,125,93,.34);border-radius:9px;background:#fff')}>
              <span style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#2f7d5d;flex:none;width:62px;align-self:stretch;display:flex;align-items:center;justify-content:center;border-right:1px solid rgba(47,125,93,.28);background:rgba(47,125,93,.10)')}>วันที่</span>
              {/* 🚨 ช่องวันที่ห้ามเผื่อที่ว่างทางขวาเหมือนช่องอื่น
                    กรอบกว้างแค่ครึ่งจอ (~195px) หักป้าย 62 แล้วเผื่ออีก 62
                    เหลือที่จริง 71px ซึ่งไม่พอกับ 01/09/2026 (~110px) แล้วปีหายไปทั้งดุ้น
                    ยอมให้กลางของพื้นที่หลังเส้นคั่นแทน — ข้อมูลครบสำคัญกว่าตำแหน่งตรงเป๊ะ */}
              <input type="date" value={V.dateIso} onChange={V.onDate} max={V.dateMax}
                style={s("flex:1;min-width:0;height:100%;border:none;background:transparent;padding:0;text-align:center;font:400 16px/1.7 Sarabun,sans-serif")} />
            </div>

            <div style={s('flex:1;min-width:0;display:flex;align-items:center;height:40px;padding:0;border:1px solid rgba(47,125,93,.34);border-radius:9px;background:#fff')}>
              <span style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#2f7d5d;flex:none;width:62px;align-self:stretch;display:flex;align-items:center;justify-content:center;border-right:1px solid rgba(47,125,93,.28);background:rgba(47,125,93,.10)')}>HN</span>
              {/* 🚨 ข้อความไว้กึ่งกลาง (พี่กันสั่ง 1 ก.ย. 2569 "ไม่ก็เอาไว้กึ่งกลาง")
                    ตัว ไ เคยโดนขอบช่องตัดยอด · อยู่กึ่งกลางแล้วมีที่ว่างบนล่างเท่ากัน */}
              <input value={V.hn} onChange={V.onHn} inputMode="numeric" placeholder="ไม่บังคับ"
                style={s("flex:1;min-width:0;height:100%;border:none;background:transparent;padding:0;text-align:center;font:400 16px/1.7 Sarabun,sans-serif")} />
            </div>

          </div>
        )}
      </div>

      {V.hasFrequent && (
        <div style={s('padding:12px 0 0')}>
          <div style={s('display:flex;justify-content:space-between;align-items:baseline;padding:0 20px;margin-bottom:6px')}>
            <span style={s("font:600 11px/1.75 Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>ยาที่คืนบ่อย</span>
            <span style={s('font:400 11px/1.75 Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>แตะเพื่อใส่จำนวน</span>
          </div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:0 20px')}>
            {V.frequent.map((f) => (
              <div key={f.base + f.strength} {...kb(f.pick)} className="hv-bd-green" style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:7px 9px;display:flex;flex-direction:column;justify-content:space-between;height:66px;cursor:pointer;overflow:hidden')}>
                <div>
                  <div style={s('font:600 12px/1.75 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{f.base}</div>
                  <div style={s('font:600 12px/1.75 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{f.strength}</div>
                </div>
                <div style={sx("font:500 10.5px/1.75 Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: f.priceColor })}>{f.priceLabel}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s('padding:14px 20px 18px;flex:1')}>
        <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;gap:10px')}>
          <span style={s("font:600 11px/1.75 Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>{V.rowsLabel}</span>
          {/* ปุ่มล้างทั้งหมด — โผล่เฉพาะตอนมีรายการ · กดแล้วมีป๊อปอัปยืนยันอีกชั้น (พี่กันสั่ง)
              ใช้สีแดงจางไม่ใช่ปุ่มทึบ เพราะไม่ใช่ปุ่มที่ควรเด่นกว่าปุ่มบันทึก */}
          {V.canClearAll ? (
            <span {...kb(V.askClearAll)} className="hv-del" style={s('font:600 11.5px/1.75 Sarabun,sans-serif;color:#c2543c;cursor:pointer;padding:2px 8px;border-radius:6px;flex:none')}>ล้างทั้งหมด</span>
          ) : (
            <span style={s('font:400 11px/1.75 Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>{V.priceAsOfLabel}</span>
          )}
        </div>

        {V.noRows && (
          <div style={s('text-align:center;padding:24px 12px;border:1px dashed rgba(30,36,32,.16);border-radius:12px')}>
            <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มีรายการในครั้งนี้</div>
            {/* ถ้ายังไม่ได้ตั้งยาที่คืนบ่อย อย่าบอกให้ไปแตะสิ่งที่ไม่มีอยู่บนจอ */}
            <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>{V.emptyHint}</div>
          </div>
        )}

        {/* ต่างจากมอคอัปโดยจำเป็น: มอคอัปวางชื่อยากับปุ่มไว้บรรทัดเดียวกัน
            ซึ่งทำงานได้ที่จอ 430px กับชื่อยาสั้น ๆ ของเดโมเท่านั้น
            ของจริงที่ 360px คอลัมน์ชื่อเหลือ 83px "Amoxicillin + Clavulanic acid 875 + 125 mg"
            แตกเป็น 4 บรรทัด และถ้ามูลค่าหลักล้านจะล้นไปทับปุ่มใช้ต่อ/ทำลาย
            → แยกชื่อยาขึ้นบรรทัดบนเต็มความกว้าง ปุ่มกับตัวเลขลงบรรทัดล่าง */}
        <div style={s('display:flex;flex-direction:column;gap:7px')}>
        {/* ── การ์ดรายการยาแบบ ก (พี่กันเลือกจากมอคอัป 1 ก.ย. 2569) ──────────────
            "เอาแบบ ก เเต่ ขอตามรูปนี้" — โครงแบบ ก + ปุ่มคู่แบบเม็ดยาที่พี่กันชี้

            ของเดิมสูง 118px ต่อใบ เพราะปุ่มใช้ต่อ/ทำลายกินทั้งแถวที่สาม
            ทั้งที่ทางขวายังว่าง · แบบใหม่เหลือราว 66px ประหยัดไปเกือบครึ่ง

            🚨 แถบสีซ้าย 4px บอกสถานะตั้งแต่กวาดตา ไม่ต้องอ่านปุ่ม
               เขียว = ใช้ต่อ · แดง = ทำลาย (สีเดียวกับที่ใช้ทั้งเว็บ)
            🚨 ปุ่มคู่ยังต้องกว้างพอไม่ให้กดพลาด — กำหนด min-width 52px ต่อปุ่ม
               และห้ามใส่คลาส .tap เด็ดขาด (กฎข้อ 3.55) มันขยายพื้นที่กดออกด้านละ 11px
               ปุ่มที่ติดกันจะมีพื้นที่กดซ้อนกัน เล็งกด "ใช้ต่อ" แล้วโดน "ทำลาย"
               = ยาดีถูกบันทึกว่าทำลาย ตัวเลข KPI ผิดโดยไม่มีอะไรเตือน
            🚨 ชื่อยาตัดท้ายด้วยจุดไข่ปลาได้ที่นี่ เพราะแตะแล้วเปิดหน้าต่างที่มีชื่อเต็ม
               (ต่างจากผลค้นหาที่ห้ามตัด เพราะเป็นจุดตัดสินใจว่าจะหยิบยาตัวไหน) */}
          {V.rows.map((row) => (
            <div key={row.rid} style={sx('display:flex;align-items:stretch;background:#fff;border-radius:10px;overflow:hidden', { border: '1px solid ' + row.border })}>

              <div style={sx('width:4px;flex:none', { background: row.reuseOn ? '#2f7d5d' : '#c2543c' })}></div>

              <div style={s('flex:1;min-width:0;padding:5px 4px 5px 10px')}>

                <div {...kb(row.edit)} className="hv-txt"
                  style={s('display:flex;align-items:baseline;gap:8px;cursor:pointer;border-radius:6px;margin:-2px -4px 0;padding:2px 4px')}>
                  {/* 🚨 ชื่อยาต้องผ่านตัววาดกลางเสมอ ห้ามใส่เป็นข้อความเปล่า
                      (พี่กันทัก "อย่าทิ้งระบบสีเราสิ")
                      สีแต่ละส่วนมีความหมายเฉพาะตัว — ตัวย่อม่วง · ความเข้มข้นส้ม
                      · ER/IR แดงอมชมพู · ชื่อการค้าเทล · สีความแรงแยกยาชื่อเดียวกัน
                      ทิ้งไปเมื่อไหร่ = เภสัชกรแยกยาคนละความแรงด้วยตาไม่ได้ (กฎข้อ 3.34) */}
                  <div style={s('flex:1;min-width:0;overflow:hidden')}>{renderDrugName(row.np, { size: '13px' })}</div>
                  <div style={sx("flex:none;font:700 13px/1.75 Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: row.color })}>{row.valueLabel}</div>
                </div>

                <div style={s('display:flex;align-items:center;gap:8px;margin-top:2px')}>
                  <div {...kb(row.edit)} className="hv-txt"
                    style={s('flex:1;min-width:0;cursor:pointer;font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{row.detail}</div>

                  <div style={s('display:flex;padding:2px;border-radius:999px;flex:none;background:#f0f1ee')}>
                    <div {...kb(row.setReuse)} className={row.reuseOn ? 'hv-seg-on' : 'hv-txt'} style={sx('min-width:50px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:999px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: row.reuseOn ? '#2f7d5d' : 'transparent', color: row.reuseOn ? '#fff' : '#8a938d' })}>ใช้ต่อ</div>
                    <div {...kb(row.setDestroy)} className={row.reuseOn ? 'hv-des-off' : 'hv-des-on'} style={sx('min-width:50px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:999px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: row.reuseOn ? 'transparent' : '#c2543c', color: row.reuseOn ? '#8a938d' : '#fff' })}>ทำลาย</div>
                  </div>
                </div>

                {/* เหตุผลที่ทำลาย — ต้องเห็นในรายการ ไม่ใช่ซ่อนให้ไปกดดู
                    เพราะเป็นสิ่งที่ต้องตอบผู้บริหารว่าทำลายไปเพราะอะไร (กฎข้อ 3.47) */}
                {row.reasonLabel && (
                  <div style={s('font:500 10px/1.75 Sarabun,sans-serif;color:#c2543c;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                    เหตุผล: {row.reasonLabel}
                  </div>
                )}

              </div>

              <div {...kb(row.remove)} aria-label="ลบรายการนี้ออกจากรายการในครั้งนี้" className="hv-del"
                style={s('width:34px;flex:none;display:flex;align-items:center;justify-content:center;color:#c3c9c4;font:400 15px Sarabun,sans-serif;cursor:pointer')}>✕</div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── คอม ─────────────────────────────────────────────────────────────────────
// 🚨 width:100% ห้ามลบ — กล่องครอบใน shell เป็น flex คอลัมน์
// ใน flex ตัว margin:0 auto จะยกเลิกการยืดเต็มความกว้าง แล้วย่อลงเท่าเนื้อหา (เคยหดไป 347px)
// align-items:stretch = ให้คอลัมน์ซ้ายกับแผงขวาสูงเท่ากัน กรอบขาวจะได้ไม่ลอยค้างครึ่งจอ
export function renderRecordWide(V) {
  return (
    <div style={s('width:100%;max-width:1400px;margin:0 auto;padding:12px 26px 12px;display:flex;gap:22px;align-items:stretch;flex:1;min-height:440px')}>
      <div style={s('flex:1;min-width:0;min-height:0;display:flex;flex-direction:column')}>
        <div style={s('flex:none;display:flex;gap:10px;align-items:flex-end;margin-bottom:6px')}>
          <div style={s('flex:1;min-width:0;position:relative')}>
            <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>ยา</div>
            {/* ── ช่องค้นยา — ช่องกรอกไม่ได้วาดตัวอักษรเอง (พี่กันสั่ง 1 ก.ย. 2569) ────

                "ไปแก้ในเดสก์ท็อป ให้เหมือนกันเป๊ะ เอาตรรกะเดิมมา"
                ยกวิธีเดียวกับฝั่งมือถือมาทั้งชุด

                🚨 ช่องกรอกทุกชนิดตัดตัวอักษรที่ล้นออกนอกตัวเองเสมอ ปิดไม่ได้
                   ไม้โท ไม้เอก ที่ลอยเหนือสระบนจึงโดนหั่นครึ่ง (พี่กันสั่งซ้ำสี่รอบ)
                   สั่ง overflow: visible ก็ถูกเบราว์เซอร์เปลี่ยนเป็นตัดอัตโนมัติ
                   textarea ก็โดนเหมือนกัน — วัดค่าจริงแล้วได้ auto ทั้งที่สั่ง visible

                วิธีที่ใช้ — กล่องธรรมดาวาดตัวอักษร (กล่องธรรมดาปล่อยล้นได้)
                แล้วทำตัวอักษรในช่องกรอกจริงให้โปร่งใส เหลือแต่ขีดกะพริบ

                🚨 ฟอนต์ ขนาด ระยะขอบ ต้องตรงกันเป๊ะทั้งสองชั้น ไม่งั้นขีดกะพริบเยื้อง
                🚨 ชั้นที่วาดสูงเกินกรอบ 7 จุดบนล่าง แล้วหักคืนด้วยตำแหน่งติดลบ
                   ผังหน้าเว็บจึงยังนับความสูง 46 จุดเท่าเดิม ไม่มีอะไรขยับ */}
            {/* ช่องค้นหามาตรฐานของทั้งเว็บ (thaibox.jsx) — ชุดเดียวกับฝั่งมือถือทุกอย่าง
                ต่างแค่ความสูง สีพื้น และปุ่มกดแป้นที่ฝั่งคอมมีลูกศรขึ้นลงกับ Enter */}
            {renderSearchBox({
              value: V.query, onChange: V.onQuery, onKeyDown: V.onSearchKeyDesktop,
              onClear: V.clearQuery, inputRef: V.searchRef,
              placeholder: 'พิมพ์ชื่อยา แล้วกด Enter',
              font: '500 15px/1.75 var(--font-sarabun), Sarabun, sans-serif',
              h: 46,
              swapLabel: V.showSwap ? V.swapLabel : '',
              ariaLabel: 'ค้นชื่อยา',
            })}
            {/* หน้าคอมเดิมไม่มีกล่อง "ไม่พบยา" (มอคอัปก็ไม่มี) พิมพ์ผิดแล้วเงียบสนิท
                เภสัชกรไม่รู้ว่าพิมพ์ผิดหรือระบบค้าง — ฝั่งมือถือมีอยู่แล้ว เอามาใส่ให้เหมือนกัน */}
            {V.noResults && (
              <div style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:9;border:1px dashed rgba(30,36,32,.18);border-radius:10px;background:#fff;padding:14px;text-align:center')}>
                <div style={s('font:400 13px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:9px')}>{V.noResultsHint}</div>
                <div {...kb(V.openOffListDrug)} className="hv-bg-e3f tap" style={s('display:inline-flex;align-items:center;padding:9px 16px;border-radius:999px;background:#e3f0e8;color:#2f7d5d;font:600 12.5px/1.75 Sarabun,sans-serif;cursor:pointer')}>ยาอื่น — พิมพ์ชื่อเอง</div>
              </div>
            )}
            {V.hasResults && (
              <div style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:9;border:1px solid rgba(30,36,32,.10);border-radius:10px;background:#fff;box-shadow:0 12px 30px rgba(30,36,32,.14);overflow:hidden;max-height:290px;overflow-y:auto;overscroll-behavior:contain')}>
                {V.results.map((r) => renderDrugOption(r, false))}
              </div>
            )}
          </div>

          {/* ช่องจำนวนฝั่งคอม — พิมพ์สูตรได้ (25+25 · 3*(10+2)) พี่กันสั่ง 25 ส.ค. 2569
              🚨 position:relative ต้องอยู่ที่กล่องนี้ ไม่งั้นแป้นเครื่องคิดเลขจะไปอิงกล่องนอก
              🚨 ห้ามใส่ inputMode="numeric" แล้ว — แป้นตัวเลขไม่มีเครื่องหมายให้กด
                 (ฝั่งมือถือไม่ได้ใช้ช่องนี้ ใช้ป๊อปอัปคนละตัว จึงไม่กระทบ) */}
          <div style={s('width:225px;position:relative')}>
            <div style={s('display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px;height:16px')}>
              <span style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>จำนวน{V.pendingUnit}</span>
              {/* ผลลัพธ์อยู่นอกช่อง จึงไม่มีวันโดนสูตรที่ยาวเบียดหาย */}
              {V.qtyShowSum && (
                V.qtyLong ? (
                  /* สูตรยาวเกินช่อง — กดที่ตัวเลขเพื่อกางดูเต็ม (พี่กันสั่ง 31 ส.ค. 2569) */
                  <span {...kb(V.toggleQtyFull)} aria-label={V.qtyFullOpen ? 'ปิดสูตรเต็ม' : 'กางดูสูตรเต็ม'}
                    className="hv-bg-e3f tap"
                    style={s('font:700 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;flex:none;cursor:pointer;padding:0 8px;border-radius:6px;background:#eef6f1;display:flex;align-items:center;gap:5px;height:16px')}>
                    {'รวม ' + V.qtyFullAnswer}
                    <span style={s('font:600 10px/1.75 Sarabun,sans-serif;color:#2f7d5d')} aria-hidden="true">{V.qtyFullOpen ? '▲ ปิด' : '▼ ดูเต็ม'}</span>
                  </span>
                ) : (
                  <span style={s('font:700 12.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;flex:none')}>
                    {'รวม ' + V.qtyFullAnswer}
                  </span>
                )
              )}
            </div>
            {/* กด Enter ครั้งแรกเมื่อเป็นสูตร → ช่องกลายเป็น "25+25=50" โดยเลข 50 เด่น
                กด Enter อีกครั้งถึงเพิ่มรายการ (พี่กันสั่ง 25 ส.ค. 2569)
                🚨 ช่องกรอกทำตัวหนาเฉพาะบางส่วนไม่ได้ จึงวาดข้อความซ้อนทับแล้วซ่อนตัวอักษรจริง
                   ต้องใช้ฟอนต์ ขนาด และระยะขอบชุดเดียวกันทั้งสองชั้น ไม่งั้นขีดกะพริบจะไม่ตรงตัวอักษร */}
            <input ref={V.qtyRef} value={V.qtyInput} onChange={V.onQtyInput} onKeyDown={V.onQtyKey} onScroll={V.onQtyScroll} onBlur={V.onQtyBlur} placeholder="0" autoComplete="off"
              style={sx("width:100%;height:46px;padding:0 40px 0 13px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;font:600 16px Sarabun,sans-serif;caret-color:#1e2420",
                { color: V.qtyResolved ? 'transparent' : '#1e2420' })} />
            {V.qtyResolved && (
              /* วาดทับช่องเพื่อให้สูตรเป็นสีจาง — ไม่วาดผลลัพธ์ตรงนี้
                 ผลลัพธ์อยู่ป้าย "รวม" เหนือช่องแล้ว วาดซ้ำจะทับสูตรจนอ่านไม่ออก
                 (พี่กันเห็นเองเป็น "15+15+15+ = 105·15+") */
              <div ref={V.qtyLayerRef}
                style={s("position:absolute;left:14px;right:41px;bottom:0;height:46px;display:flex;align-items:center;pointer-events:none;font:600 16px Sarabun,sans-serif;white-space:nowrap;overflow:hidden")}>
                {/* สูตรสีเทา ผลลัพธ์เขียวเด่น — เรียงต่อกันตามปกติ ไม่ทับกัน
                    รวมสองชิ้นแล้วต้องเป็นข้อความเดียวกับใน input เป๊ะ ๆ ตัวอักษรจึงไม่เหลื่อม */}
                <span style={s('color:#6f7873;flex:none')}>{V.qtyExprLeft}</span>
                <span style={s('color:#2f7d5d;font-weight:700;flex:none')}>{V.qtyAnswerTail}</span>
              </div>
            )}

            {/* กล่องสูตรเต็ม — ตัดบรรทัดได้ เห็นทุกตัวเลขในตาเดียว ไม่ต้องเลื่อน
                ลอยทับของข้างล่าง (position:absolute) จึงไม่ดันผังหน้าให้เพี้ยน */}
            {V.qtyShowSum && V.qtyLong && V.qtyFullOpen && (
              <div role="dialog" aria-label="สูตรเต็ม"
                style={s('position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:12;background:#fff;border:1px solid rgba(47,125,93,.28);border-radius:11px;box-shadow:0 12px 30px rgba(30,36,32,.16);padding:11px 13px')}>
                <div style={s('font:600 10.5px/1.75 Sarabun,sans-serif;letter-spacing:.06em;color:#6b746e;margin-bottom:5px')}>สูตรที่พิมพ์ไว้</div>
                <div style={s('font:600 14px/1.7 Sarabun,sans-serif;color:#414a44;overflow-wrap:anywhere;margin-bottom:9px')}>{V.qtyFullExpr}</div>
                <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:9px;border-top:1px solid #eef1ef')}>
                  <span style={s('font:600 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>รวมทั้งหมด</span>
                  <span style={s('font:700 21px Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums')}>{V.qtyFullAnswer}{V.pendingUnit}</span>
                </div>
              </div>
            )}

            {/* 🚨 วาดเป็น SVG ไม่ใช่อักขระพิเศษ (พี่กันขอ 25 ส.ค. 2569)
                อักขระอย่าง ▦ หน้าตาเป็นแค่ตาราง ไม่สื่อว่าเป็นเครื่องคิดเลข
                และคอมโรงพยาบาลที่ฟอนต์ไม่ครบจะเห็นเป็นสี่เหลี่ยมเปล่า
                stroke/fill ใช้ currentColor จึงเปลี่ยนสีตามสถานะเปิด-ปิดเองโดยไม่ต้องส่งสีเข้ามา */}
            <div {...kb(V.toggleCalc)} className="hv-ico tap" title="เครื่องคิดเลข"
              style={sx('position:absolute;right:8px;bottom:8px;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none',
                { background: V.calcBg, color: V.calcFg })}>
              <svg width="15" height="17" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="1" width="14" height="16" rx="2.4" />
                <rect x="4" y="3.9" width="8" height="3.2" rx="0.9" />
                <circle cx="4.7" cy="10.6" r="0.95" fill="currentColor" stroke="none" />
                <circle cx="8" cy="10.6" r="0.95" fill="currentColor" stroke="none" />
                <circle cx="11.3" cy="10.6" r="0.95" fill="currentColor" stroke="none" />
                <circle cx="4.7" cy="13.9" r="0.95" fill="currentColor" stroke="none" />
                <circle cx="8" cy="13.9" r="0.95" fill="currentColor" stroke="none" />
                <circle cx="11.3" cy="13.9" r="0.95" fill="currentColor" stroke="none" />
              </svg>
            </div>

            {V.calcOpen && (
              <div style={s('position:absolute;top:calc(100% + 7px);right:0;width:225px;background:#fff;border:1px solid rgba(30,36,32,.12);border-radius:12px;box-shadow:0 14px 34px rgba(30,36,32,.18);padding:9px;z-index:12')}>
                <div style={s('background:#f6f7f4;border-radius:8px;padding:7px 10px;margin-bottom:8px;text-align:right')}>
                  <div style={s("font:400 11px/1.75 Sarabun,monospace;color:#6f7873;min-height:14px;word-break:break-all")}>{V.calcExpr || ' '}</div>
                  <div style={s("font:700 19px Sarabun,sans-serif;color:#1e2420;font-variant-numeric:tabular-nums")}>{V.calcResult}</div>
                </div>
                <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:5px')}>
                  {V.calcKeys.map((b) => (
                    <div key={b.k} {...kb(b.press)} className={b.kind === 'eq' ? 'hv-teal' : 'hv-txt'}
                      style={sx('height:36px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none',
                        b.kind === 'op' ? { background: '#eef3f0', color: '#2f7d5d', font: "600 15px Sarabun,sans-serif" }
                        : b.kind === 'eq' ? { background: '#2f7d5d', color: '#fff', font: "700 15px Sarabun,sans-serif" }
                        : b.kind === 'del' ? { background: '#fbe9e5', color: '#c2543c', font: '600 12.5px Sarabun,sans-serif' }
                        : b.kind === 'fn' ? { background: '#f4f5f3', color: '#6b746e', font: "600 14px Sarabun,sans-serif" }
                        : { background: '#f2f4f1', color: '#1e2420', font: "600 15px Sarabun,sans-serif" })}>{b.k}</div>
                  ))}
                </div>
                <div style={s('font:400 10.5px/1.75 Sarabun,sans-serif;color:#6f7873;text-align:center;margin-top:7px')}>พิมพ์ในช่องเองก็ได้ · Enter เพิ่มรายการเลย</div>
              </div>
            )}
          </div>

          <div style={s('width:176px')}>
            <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>สถานะ</div>
            <div style={s('height:46px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#fff;display:flex;align-items:center;padding:3px;gap:3px')}>
              <div {...kb(V.setPendingReuse)} className={V.pendReuseOn ? 'hv-bg-e3f' : 'hv-txt'} style={sx('flex:1;text-align:center;padding:8px 0;border-radius:7px;cursor:pointer;font:600 12.5px/1.75 Sarabun,sans-serif', { background: V.pendReuseBg, color: V.pendReuseFg })}>ใช้ต่อได้</div>
              <div {...kb(V.setPendingDestroy)} className={V.pendReuseOn ? 'hv-del' : 'hv-des-off'} style={sx('flex:1;text-align:center;padding:8px 0;border-radius:7px;cursor:pointer;font:600 12.5px/1.75 Sarabun,sans-serif', { background: V.pendDestroyBg, color: V.pendDestroyFg })}>ทำลาย</div>
            </div>
          </div>

          {/* ราคารวมของรายการที่กำลังจะเพิ่ม (แบบ ก — พี่กันเคาะ 25 ส.ค. 2569)
              เดิมตัวเลขนี้ไปอยู่ในข้อความจาง 11.5px ใต้ช่อง ทั้งที่เป็นตัวเลขสำคัญที่สุดในแถว
              ป้าย "รวมเป็นเงิน" อยู่บนกล่อง ระดับเดียวกับ "จำนวน" และ "สถานะ" (พี่กันสั่ง) */}
          <div style={s('min-width:150px')}>
            <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>รวมเป็นเงิน</div>
            <div style={sx('height:46px;border-radius:9px;display:flex;align-items:center;justify-content:flex-end;padding:0 14px',
              { background: V.sumBg, border: '1px solid ' + V.sumBorder })}>
              <div style={sx("font:700 18px Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: V.sumFg })}>{V.sumLabel}</div>
            </div>
          </div>

          <div {...kb(V.addInline)} className={V.addOn ? 'hv-teal' : 'hv-off-green'} style={sx('height:46px;padding:0 20px;border-radius:9px;display:flex;align-items:center;font:600 14px Sarabun,sans-serif;cursor:pointer;box-sizing:border-box', { background: V.addBg, color: V.addFg, border: V.addBorder })}>เพิ่ม <span style={sx("font:400 11px/1.75 Sarabun,monospace;margin-left:8px", { color: V.addHintFg })}>⏎</span></div>
        </div>

        {V.showHint && (
          <div style={s('flex:none;font:400 11.5px/1.75 Sarabun,sans-serif;color:rgba(30,36,32,.45);margin-bottom:6px;min-height:16px')}>{V.desktopHint}</div>
        )}

        {/* แถบยาที่คืนบ่อยฝั่งคอม — มอคอัปมีเฉพาะฝั่งมือถือ (บรรทัด 76–92) พี่กันขอให้มีบนคอมด้วย
            ใช้การ์ดหน้าตาเดียวกับมือถือทุกอย่าง ต่างแค่เรียง 6 ช่องแนวนอนแทนตาราง 3 คอลัมน์ */}
        {V.hasFrequent && (
          <div style={s('flex:none;margin-bottom:6px')}>
            <div style={s('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px')}>
              <span style={s("font:600 11px/1.75 Sarabun,sans-serif;letter-spacing:.08em;color:rgba(30,36,32,.45)")}>ยาที่คืนบ่อย</span>
              <span style={s('font:400 11px/1.75 Sarabun,sans-serif;color:rgba(30,36,32,.4)')}>กดเพื่อใส่จำนวน</span>
            </div>
            <div style={s('display:grid;grid-template-columns:repeat(6,1fr);gap:6px')}>
              {V.frequent.map((f) => (
                <div key={f.base + f.strength} {...kb(f.pickWide)} className="hv-bd-green" style={sx('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:11px;padding:5px 9px;display:flex;flex-direction:column;justify-content:center;gap:1px;cursor:pointer;overflow:hidden', { height: V.tight ? '40px' : '48px' })}>
                  {/* บรรทัดเดียว ชื่อกับความแรงติดกัน — ความแรงเป็นข้อมูลความปลอดภัย ห้ามตัดทิ้ง */}
                  <div style={s('font:600 12px/1.75 Sarabun,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
                    {f.base} <span style={s('color:#6b746e')}>{f.strength}</span>
                  </div>
                  <div style={sx("font:500 10.5px/1.75 Sarabun,sans-serif;font-variant-numeric:tabular-nums", { color: f.priceColor })}>{f.priceLabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* flex:1 = กรอบขาวยืดเต็มความสูงที่เหลือ ไม่ลอยค้างครึ่งจอ (พี่กันทัก)
            min-height:0 = ยอมให้หดต่ำกว่าเนื้อในได้ ไม่งั้นแถวเยอะแล้วกรอบดันทั้งหน้ายาวออกไป
            แทนที่จะเลื่อนอยู่ข้างในกรอบ */}
        <div style={s('background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;overflow:hidden;flex:1;min-height:0;display:flex;flex-direction:column')}>
          {/* ══ หัวตาราง — ตารางจริงก้อนแรก ═══════════════════════════════
              หน้านี้ใช้ตาราง 2 ก้อน ไม่ใช่ก้อนเดียวเหมือนอีกสองหน้า เพราะ
              หัวต้องตรึงอยู่นอกพื้นที่เลื่อน ส่วนแถบล็อตค้างต้องอยู่ "ใต้หัว"
              และเลื่อนหายไปได้ (พี่กันสั่งไว้ว่าไม่ต้องตรึงแถบนั้น)
              ถ้ารวมเป็นตารางเดียว แถบล็อตค้างจะไปอยู่เหนือหัว ซึ่งสลับที่กัน

              🚨 ทั้งสองก้อนต้องใช้ colgroup ชุดเดียวกันเป๊ะ ๆ ไม่งั้นคอลัมน์เหลื่อม */}
          <div style={s('flex:none')}>
            <table className="tbl" style={s('--tbl-pad:16px')}>
              <colgroup>
                {V.rowCols.map((c) => <col key={c.key} style={c.flex ? undefined : { width: c.w }} />)}
                <col style={s('width:40px')} />
              </colgroup>
              <thead>
                <tr>
                  {V.rowCols.map((c) => (
                    <th key={c.key} {...kb(c.pick)} scope="col"
                      className={'tbl-sort' + (c.flex ? '' : ' ta-c')}
                      style={sx('', Object.assign(
                        { color: c.fg },
                        // ถอยหัวเข้ามาให้ตรงกับตัวเลข ไม่ใช่ตรงขอบคอลัมน์ (ดูเหตุผลใน ROW_COLS)
                        c.padRight ? { paddingRight: c.padRight } : {}
                      ))}>
                      <span style={s('display:inline-flex;align-items:center;gap:4px')}>
                        {c.label}
                        <span aria-hidden="true" className="tbl-arrow" style={sx('', { color: c.arrowColor, fontSize: c.arrowSize })}>{c.arrow}</span>
                      </span>
                    </th>
                  ))}
                  {/* ปุ่มล้างทั้งหมด วางหัวคอลัมน์ ✕ พอดี — สื่อว่า "ลบทั้งคอลัมน์นี้" (พี่กันขอ)
                      กดแล้วมีป๊อปอัปยืนยันอีกชั้น เพราะลบแล้วไม่มีถังขยะให้กู้
                      โผล่เฉพาะตอนมีรายการ ไม่งั้นเป็นปุ่มตายที่กดไปก็ไม่เกิดอะไร */}
                  <th scope="col" className="ta-c">
                    {V.canClearAll ? (
                      <span {...kb(V.askClearAll)} title="ล้างรายการทั้งหมด" className="hv-del"
                        style={s('display:inline-block;cursor:pointer;color:#c2543c;border-radius:5px;padding:0 2px')}>ล้าง</span>
                    ) : null}
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* 🎯 จุดเดียวในหน้าบันทึกแบบคอมที่เลื่อนได้ (พี่กันสั่ง)
              ช่องกรอกยา · ยาที่คืนบ่อย · หัวตาราง · แผงขวา ถูกตรึงหมด ไม่ขยับตามการเลื่อน */}
          <div style={s('flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain')}>
          {/* แถบล็อตค้างอยู่ในนี้ ไม่ใช่ข้างนอก — พี่กันสั่งว่าไม่ต้องตรึงตัวนี้
              เลื่อนดูยาแล้วแถบเลื่อนหายไปเอง กรอบตารางได้ที่คืนเต็ม */}
          <div style={s('padding:8px 8px 0')}>{renderParked(V)}</div>
          {V.noRows && (
            <div style={s('min-height:100%;padding:34px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center')}>
              <div style={s('font:600 15px Sarabun,sans-serif;margin-bottom:4px')}>ยังไม่มีรายการในครั้งนี้</div>
              <div style={s('font:400 12.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>พิมพ์ชื่อยาด้านบน กด Enter ใส่จำนวน แล้ว Enter อีกครั้ง — ไม่ต้องแตะเมาส์</div>
            </div>
          )}

          {/* ══ แถว — ตารางจริงก้อนที่สอง ═══════════════════════════════
              🚨 colgroup ต้องเหมือนก้อนหัวเป๊ะ ๆ ไม่งั้นคอลัมน์เหลื่อมกัน
              🚨 ห้ามใส่ thead ในก้อนนี้ หัวอยู่ก้อนบนแล้ว */}
          <table className="tbl" style={s('--tbl-pad:16px')}>
            <colgroup>
              {V.rowCols.map((c) => <col key={c.key} style={c.flex ? undefined : { width: c.w }} />)}
              <col style={s('width:40px')} />
            </colgroup>
            <tbody>
          {V.rows.map((row) => (
            <tr key={row.rid} className={V.tight ? 'rec-row rec-tight' : 'rec-row'} style={sx('', { background: row.deskBg })}>
              {/* ชื่อยาหน้าตาเหมือนตอนค้นหาเป๊ะ — สีความแรง · รูปแบบยา · ER · ชื่อการค้า
                  (พี่กันสั่ง 25 ส.ค. 2569) ยาฉีดกับยากินจะได้แยกออกตั้งแต่กวาดตา */}
              <td>
                {renderDrugName(row.np, { size: '14px' })}
                {/* เหตุผลที่ทำลาย — ตัวเล็กสีแดงอิฐใต้ชื่อยา เห็นได้โดยไม่ต้องเปิดอะไรเพิ่ม
                    ไม่มีเหตุผลก็ไม่มีบรรทัดนี้ แถวที่ใช้ต่อได้จึงหน้าตาเหมือนเดิมทุกประการ */}
                {row.reasonLabel && (
                  <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#c2543c;margin-top:2px')}>
                    เหตุผล: {row.reasonLabel}
                  </div>
                )}
              </td>

              {/* จำนวนแก้ได้ทั้งที่กด Enter ลงมาแล้ว — มีปุ่มดินสอบอกชัด ๆ ว่ากดแก้ได้
                  พิมพ์สูตรได้เหมือนช่องด้านบน · ปุ่ม ✓ ตกลง · ปุ่ม ✕ ยกเลิก (พี่กันสั่ง 25 ส.ค. 2569)
                  🚨 ความสูงแถวต้องคงที่ — ทั้งช่องกรอกและป้ายผลลัพธ์ถูกบีบไว้ในกรอบ 22px เท่าเดิม
                     ป้ายผลลัพธ์ใช้ position:absolute จึงไม่ดันแถวให้สูงขึ้น
                  🚨 แก้ได้เฉพาะจำนวน ราคาที่แช่ไว้ในแถวห้ามแตะ */}
              {/* 🚨 สองสถานะต้องใช้โครงเดียวกันเป๊ะ — ช่องตัวเลขกว้าง 100px เท่ากัน
                     แล้วต่อด้วยปุ่ม 26px สองช่องเสมอ (ตอนไม่แก้ ช่องที่สองเป็นที่ว่างเปล่า)
                     ถ้าปล่อยให้จำนวนปุ่มไม่เท่ากัน กรอบตัวเลขจะเลื่อนซ้ายตอนกดแก้
                     ซึ่งทำให้ตาต้องไล่หาใหม่ทุกครั้ง (พี่กันทัก 25 ส.ค. 2569) */}
              <td>{row.editing ? (
                <span style={s('height:22px;display:flex;align-items:center;justify-content:flex-end;gap:5px;position:relative')}>
                  {/* onFocus select() = กดดินสอแล้วเลขถูกไฮไลต์ พิมพ์ทับได้เลยไม่ต้องลบก่อน */}
                  <input autoFocus onFocus={(e) => e.target.select()}
                    value={row.editText} onChange={row.onEditQty} onKeyDown={row.onEditQtyKey} autoComplete="off"
                    style={s("width:150px;height:26px;padding:0 7px;border:1px solid #2f7d5d;border-radius:6px;background:#fff;text-align:right;font:600 13px/1.75 Sarabun,sans-serif;color:#1e2420;outline:none;box-shadow:0 0 0 3px rgba(47,125,93,.12)")} />
                  <span {...(row.editCanSave ? kb(row.commitEditQty) : {})} aria-label="ตกลงจำนวนใหม่" className={row.editCanSave ? 'hv-txt tap' : ''}
                    title={row.editCanSave ? 'ตกลง' : 'ยังไม่ได้เปลี่ยนจำนวน'}
                    style={sx('width:26px;height:26px;flex:none;border-radius:6px;display:flex;align-items:center;justify-content:center;font:700 13px/1.75 Sarabun,sans-serif',
                      { background: row.editOkBg, color: row.editOkFg, cursor: row.editCanSave ? 'pointer' : 'not-allowed' })}>✓</span>
                  <span {...kb(row.cancelEditQty)} aria-label="ยกเลิกการแก้จำนวน" className="hv-txt tap" title="ยกเลิก"
                    style={s('width:26px;height:26px;flex:none;border-radius:6px;background:#f2f4f1;color:#6b746e;display:flex;align-items:center;justify-content:center;cursor:pointer;font:600 13px/1.75 Sarabun,sans-serif')}>✕</span>
                  {row.editPreview && (
                    <span style={s('position:absolute;top:27px;right:0;white-space:nowrap;font:600 10.5px/1.75 Sarabun,sans-serif;color:#2f7d5d;background:#e7f2ec;border:1px solid rgba(47,125,93,.22);border-radius:5px;padding:2px 7px;z-index:4;pointer-events:none')}>{row.editPreview}</span>
                  )}
                </span>
              ) : (
                <span style={s('height:22px;display:flex;align-items:center;justify-content:flex-end;gap:5px')}>
                  <span style={s('width:150px;text-align:right;font-variant-numeric:tabular-nums;padding-right:7px')}>{row.qtyLabel}</span>
                  <span {...kb(row.startEditQty)} aria-label="แก้จำนวน" className="tap hv-bg-eef" title="แก้จำนวน"
                    style={s('width:26px;height:24px;flex:none;border:1px solid rgba(30,36,32,.14);border-radius:6px;background:#fff;color:#6b746e;display:flex;align-items:center;justify-content:center;cursor:pointer;font:400 11px/1.75 Sarabun,sans-serif')}>✎</span>
                  <span style={s('width:26px;flex:none')} />
                </span>
              )}</td>
              {/* ราคาจัดกลางคอลัมน์ให้ตรงกับหัว (พี่กันสั่ง 25 ส.ค. 2569)
                  ราคาทุกตัวมีทศนิยม 2 ตำแหน่งเสมอ หลักจุดจึงเยื้องกันน้อยมาก
                  ต่างจากคอลัมน์มูลค่าที่ตัวเลขยาวไม่เท่ากัน (15.00 กับ 1,200.00) ต้องชิดขวา */}
              <td className="ta-c" style={s('color:#6b746e')}>{row.priceLabel}</td>
              <td className="ta-r" style={sx('font:600 15px Sarabun,sans-serif', { color: row.color })}>{row.valueLabel}</td>
              <td className="ta-r">
                <span style={sx('display:flex;padding:2px;border-radius:7px', { background: row.pillBg })}>
                  <span {...kb(row.setReuse)} className={row.reuseOn ? 'hv-seg-on' : 'hv-txt'} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: row.reuseBg, color: row.reuseFg })}>ใช้ต่อ</span>
                  <span {...kb(row.setDestroy)} className={row.reuseOn ? 'hv-des-off' : 'hv-des-on'} style={sx('padding:4px 9px;border-radius:5px;cursor:pointer;font:600 11px/1.75 Sarabun,sans-serif', { background: row.destroyBg, color: row.destroyFg })}>ทำลาย</span>
                </span>
              </td>
              {/* ✕ อยู่กลางคอลัมน์ให้ตรงกับหัว "ล้าง" ซึ่งจัดกลางอยู่แล้ว (พี่กันสั่ง 25 ส.ค. 2569) */}
              <td {...kb(row.remove)} aria-label="ลบรายการนี้ออกจากรายการครั้งนี้" className="hv-fg-red ta-c" style={s('color:#c0c5c1;cursor:pointer')}>✕</td>
            </tr>
          ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* แผงขวาถูกตรึงเช่นกัน — overflow-y:auto ไว้เผื่อจอเตี้ยมากจนของในแผงล้น
          ให้เลื่อนอยู่ในแผงเอง ไม่ไปดันทั้งหน้าให้ยาว */}
      {/* ระยะห่างถูกรีดลงจาก 18/20 gap16 → 14/16 gap11 เพื่อให้กล่อง "ล็อตนี้" มีที่ยืน
          วัดแล้วก่อนหน้านี้แผงกิน 502px ในพื้นที่ 503px = แน่นเป๊ะไม่มีที่เหลือเลย
          จอ 1366x768 ของพี่กันเหลือพื้นที่จริงราว 640px ยิ่งต้องประหยัดทุกพิกเซล */}
      {/* 🚨 จอของพี่กันสูง 641px ซึ่งเตี้ยกว่าที่แผงนี้ต้องการ (ราว 655px)
          รีดระยะห่างลงเท่าที่ทำได้โดยไม่ให้อ่านยาก — 14/11 → 11/8 (พี่กันทัก 27 ส.ค. 2569)
          ที่เหลือยังต้องเลื่อน ซึ่งปลอดภัยแล้วเพราะปุ่มบันทึกถูกตรึงไว้ก้นแผง */}
      <div style={s('width:296px;flex:none;min-height:0;overflow-y:auto;background:#fff;border:1px solid rgba(30,36,32,.08);border-radius:10px;padding:11px 14px;display:flex;flex-direction:column;gap:8px')}>
        <div>
          <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:6px')}>แหล่งที่มา</div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>
            {V.sources.map((s2) => (
              <div key={s2.label} {...kb(s2.pick)} className={s2.on ? 'hv-seg-on' : 'hv-seg-off'} style={sx('padding:6px 12px;border-radius:999px;font:500 12.5px/1.75 Sarabun,sans-serif;cursor:pointer', { background: s2.bg, color: s2.fg })}>{s2.label}</div>
            ))}
          </div>
          {renderPcuField(V, { required: true })}
        </div>

        <div style={s('display:flex;gap:10px')}>
          <div style={s('flex:1')}>
            <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>วันที่</div>
            <input type="date" value={V.dateIso} onChange={V.onDate} max={V.dateMax} style={s("width:100%;height:42px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 13.5px/1.75 Sarabun,sans-serif")} />
          </div>
          <div style={s('flex:1')}>
            <div style={s('font:500 11.5px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:5px')}>HN</div>
            <input value={V.hn} onChange={V.onHn} inputMode="numeric" placeholder="ไม่บังคับ" style={s("width:100%;height:42px;padding:0 10px;border:1px solid rgba(30,36,32,.16);border-radius:9px;background:#f6f7f4;font:400 13.5px/1.75 Sarabun,sans-serif")} />
          </div>
        </div>

        {/* ผู้บันทึกล็อต — ต่อจากวันที่/HN ตามที่พี่กันสั่ง */}
        <div>{renderRecorderField(V)}</div>

        {/* ── กล่อง "ล็อตนี้" — เดิมตรงนี้เป็นช่องว่างเปล่า ๆ (พี่กันเลือกแบบ ก) ──
            เป็นจุดสุดท้ายก่อนข้อมูลเข้าฐาน ราคาถูกแช่แข็งทันทีที่กดบันทึก แก้ทีหลังยาก
            ให้ทวนได้ว่ากำลังจะส่งอะไร กี่ตัว ใช้ต่อกี่ ทำลายกี่ ก่อนกดปุ่ม */}
        {/* 🚨 ต้องเป็น flex:1 1 auto ไม่ใช่ flex:1
            flex:1 ย่อมาจาก 1 1 0% = ฐานความสูงเป็นศูนย์ การคำนวณการหดจะได้ศูนย์ตาม
            กล่องเลยไม่ยอมหดเลยแม้ใส่ min-height:0 แล้วไปดันปุ่มบันทึกตกขอบแผง
            ใช้ฐาน auto (เท่าเนื้อหา) แทน จะโตตอนที่ว่างเหลือ และหดตอนที่ว่างไม่พอ */}
        <div style={s('flex:1 1 auto;background:#f6f7f4;border-radius:9px;padding:9px 11px;display:flex;flex-direction:column')}>
          <div style={s("font:600 10.5px/1.75 Sarabun,sans-serif;letter-spacing:.06em;color:rgba(30,36,32,.45);margin-bottom:6px")}>Lot นี้</div>

          {/* 🚨 ห้ามใส่ overflow-y:auto + min-height:0 ตรงนี้ (พี่กันเจอบั๊กที่จอ 768)
              เคยใส่ไว้ให้กล่องยุบได้ตอนที่ว่างไม่พอ ผลคือกล่องยุบจนเหลือ 23px
              แล้วซ่อนบรรทัดแยกหน่วยนับไว้ข้างใน กลายเป็นกล่องเล็ก ๆ ที่มีแถบเลื่อนจิ๋ว
              = อ่านไม่ได้ ดูเหมือนเว็บพัง ทั้งที่แผงยังมีที่ว่างเหลือ
              ปล่อยให้กล่องสูงเท่าเนื้อหาเสมอ ถ้าที่ไม่พอค่อยให้ "ทั้งแผง" เลื่อนแทน
              ซึ่งปลอดภัยแล้วเพราะปุ่มบันทึกถูกตรึงไว้ก้นแผง */}
          <div>
          {V.noRows ? (
            <div style={s('min-height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:400 11.5px/1.75 Sarabun,sans-serif;color:#6f7873;padding:6px 4px')}>
              ยังไม่มียาใน Lot นี้<br />เพิ่มยาจากช่องด้านซ้าย
            </div>
          ) : (
            /* จัด 2 คอลัมน์ ใช้ความสูงครึ่งเดียวของแบบเรียงลงมา 4 บรรทัด
               จำเป็นเพราะจอ 1366x768 เหลือพื้นที่แนวตั้งน้อยมาก */
            <div>
              <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:5px 10px;font-variant-numeric:tabular-nums')}>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px/1.75 Sarabun,sans-serif')}>
                  <span style={s('color:#6b746e')}>รายการ</span><span style={s('font-weight:500')}>{V.lotItemsLabel}</span>
                </div>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px/1.75 Sarabun,sans-serif')}>
                  <span style={s('color:#2f7d5d')}>ใช้ต่อ</span><span style={s('font-weight:500;color:#2f7d5d')}>{V.lotReuseLabel}</span>
                </div>
                <div></div>
                <div style={s('display:flex;justify-content:space-between;gap:5px;font:400 11.5px/1.75 Sarabun,sans-serif')}>
                  <span style={s('color:#c2543c')}>ทำลาย</span><span style={s('font-weight:500;color:#c2543c')}>{V.lotDestroyLabel}</span>
                </div>
              </div>
              {/* แยกจำนวนตามหน่วยนับจริง ไม่รวมข้ามหน่วยแล้วเขียนว่า "หน่วย" ลอย ๆ
                  วางเต็มความกว้างเพราะยาวกว่าครึ่งคอลัมน์ */}
              <div style={s('margin-top:5px;font:400 11px/1.75 Sarabun,sans-serif;color:#414a44;font-variant-numeric:tabular-nums;overflow-wrap:anywhere')}>{V.lotUnitsLabel}</div>
            </div>
          )}
          </div>

          {/* เลขล็อตออกโดยฐานข้อมูลตอนกดบันทึก เดาล่วงหน้าไม่ได้ (เครื่องอื่นอาจแทรกก่อน)
              จึงโชว์เลขจริงเฉพาะหลังบันทึกสำเร็จ ระหว่างกรอกบอกตรง ๆ ว่ายังไม่มีเลข */}
          <div style={s('flex:none;border-top:1px dashed rgba(30,36,32,.14);margin-top:7px;padding-top:7px;display:flex;justify-content:space-between;gap:6px;font:400 11px/1.75 Sarabun,sans-serif')}>
            <span style={s('color:#6b746e;flex:none')}>เลข Lot</span>
            <span style={sx('text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', V.lotNoIsReal
              ? { font: "600 11.5px var(--font-en),var(--font-sarabun),Sarabun,sans-serif", color: '#2f7d5d' }
              : { color: '#6f7873' })}>{V.lotNoLabel}</span>
          </div>
        </div>

        {/* 🚨 ตรึงก้อนสรุป+ปุ่มบันทึกไว้ก้นแผง ไม่ว่าจอจะเตี้ยแค่ไหนก็ต้องเห็นปุ่มเสมอ
            เคยเจอ: จอ 640px + แถบเตือนโหมดตัวอย่าง = ปุ่มบันทึกตกขอบแผง ต้องเลื่อนหา
            margin ลบ + padding เท่ากัน = แผ่ทับระยะขอบของแผง ไม่งั้นเห็นเนื้อหาลอดตรงร่อง
            bottom:-14px หักลบ padding ล่างของแผง ให้ก้อนนี้ติดก้นแผงพอดี */}
        <div style={s('flex:none;position:sticky;bottom:-14px;z-index:2;background:#fff;border-top:1px solid rgba(30,36,32,.08);margin:0 -16px -14px;padding:11px 16px 14px')}>
          <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:8px')}>
            <span style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>สะสมปีงบ {V.fyLabel}</span>
            <span style={s("font:600 12.5px/1.75 Sarabun,sans-serif;color:#414a44;font-variant-numeric:tabular-nums")}>{V.cumulativeLabel}</span>
          </div>
          <div style={s('display:flex;gap:8px;margin-bottom:8px')}>
            <div style={s('flex:1;background:#eef6f1;border-radius:10px;padding:7px 10px')}>
              <div style={s('font:500 10.5px/1.75 Sarabun,sans-serif;color:#2f7d5d')}>ประหยัด</div>
              <div style={s("font:700 20px/1.15 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.animSavedLabel}</div>
            </div>
            <div style={s('flex:1;background:#fdf1ed;border-radius:10px;padding:7px 10px')}>
              <div style={s('font:500 10.5px/1.75 Sarabun,sans-serif;color:#c2543c')}>สูญเสีย</div>
              <div style={s("font:700 20px/1.15 Sarabun,sans-serif;color:#c2543c;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.lostLabel}</div>
            </div>
          </div>
          <div style={s('display:flex;height:7px;border-radius:99px;overflow:hidden;margin-bottom:4px;background:#eef1ee')}>
            <div style={{ width: V.savedBarW, background: '#2f7d5d' }}></div>
            <div style={{ width: V.lostBarW, background: '#c2543c' }}></div>
          </div>
          <div style={s('font:400 11px/1.75 Sarabun,sans-serif;color:#6b746e;margin-bottom:9px;font-variant-numeric:tabular-nums')}>{V.proportionLabel}</div>

          {V.saveFailed && (
            <div style={s('border:1px solid rgba(194,84,60,.28);background:#fdf1ed;border-radius:11px;padding:11px 12px;margin-bottom:10px')}>
              <div style={s('font:600 13px/1.75 Sarabun,sans-serif;color:#c2543c;margin-bottom:2px')}>ส่งไม่สำเร็จ — เน็ตหลุด</div>
              <div style={s('font:400 11.5px/1.75 Sarabun,sans-serif;color:#6b746e')}>ข้อมูล {V.rowCount} รายการยังอยู่ครบในเครื่อง</div>
            </div>
          )}

          <div {...kb(V.onSave)} className={V.saveOn ? 'hv-teal' : 'hv-wait'} style={sx('height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:600 15.5px Sarabun,sans-serif;cursor:pointer', { background: V.saveBg, color: V.saveFg, border: V.saveBorder, boxSizing: 'border-box' })}>{V.saveLabel}</div>
        </div>
      </div>
    </div>
  );
}

// ── แถบบันทึกล่างจอมือถือ ──────────────────────────────────────────────────
export function renderSaveBar(V) {
  return (
    <div ref={V.saveBarRef} style={s('flex:none;background:#fff;border-top:1px solid rgba(30,36,32,.08);box-shadow:0 -6px 20px rgba(30,36,32,.06);order:1;position:relative;z-index:5')}>
      <div style={s('max-width:520px;margin:0 auto')}>
        {/* ── ไม่มีแถวยอดสะสมปีงบแล้ว (พี่กันสั่ง 1 ก.ย. 2569) ────────────────────
            สั่งเป็น 2 จังหวะ — รอบแรกเอาคำว่า "สะสมปีงบ" ออก รอบนี้เอาตัวเลขออกด้วย
            จอมือถือเตี้ย แถบล่างกินที่ไปแล้วเกือบหนึ่งในสี่ของจอ ทุกบรรทัดต้องคุ้มที่จริง ๆ
            และยอดทั้งปีไม่ใช่ของที่ต้องเห็นตอนกำลังนับยาคืนอยู่หน้าเคาน์เตอร์

            ⚠️ ยอดสะสมปีงบยังอยู่ครบที่หน้าสรุปและแผงขวาฝั่งคอม ไม่ได้หายจากระบบ
            🚨 แถบนี้เป็นของมือถือเท่านั้น ห้ามเอาไปแตะ renderRecordWide ของคอม */}
        <div style={s('padding:8px 20px 10px')}>
          {/* ── ผู้บันทึกตรึงไว้ติดปุ่มส่ง (พี่กันสั่ง 1 ก.ย. 2569) ──────────────────
              "ผู้บันทึก เอาตรึงไว้ตรงกดส่ง"

              เดิมซ่อนอยู่ในตัวเลือกเพิ่มเติม ต้องกดเปิดแล้วเลื่อนขึ้นไปหา
              ทั้งที่เป็นช่องบังคับที่ต้องเลือกก่อนกดส่งทุกครั้ง (กฎข้อ 3.24)
              ย้ายมาอยู่เหนือปุ่มส่งพอดี เห็นพร้อมกันโดยไม่ต้องเลื่อนหา */}
          {/* 🚨 ต้องมีระยะห่างใต้ช่องผู้บันทึก (พี่กันทัก "กรอบผู้บันทึก ชิดไปปป")
              ตัวช่องไม่มีระยะของตัวเอง พอวางติดกล่องประหยัด/สูญเสียเลยดูอัดกัน
              ครอบด้วยกล่องที่มีระยะ แทนการแก้ที่ตัวช่องเอง เพราะช่องนี้ใช้ 2 ที่
              (แถบบันทึกฝั่งมือถือ กับแผงขวาฝั่งคอม) ซึ่งต้องการระยะไม่เท่ากัน */}
          <div style={s('margin-bottom:9px')}>{renderRecorderField(V, { inline: true })}</div>

          <div style={s('display:flex;gap:8px;margin-bottom:7px')}>
            <div style={s('flex:1;background:#eef6f1;border-radius:10px;padding:6px 11px')}>
              <div style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#2f7d5d')}>ประหยัดครั้งนี้</div>
              <div style={s("font:700 21px/1.1 Sarabun,sans-serif;color:#2f7d5d;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.animSavedLabel}</div>
            </div>
            <div style={s('flex:1;background:#fdf1ed;border-radius:10px;padding:6px 11px')}>
              <div style={s('font:500 11px/1.75 Sarabun,sans-serif;color:#c2543c')}>สูญเสีย</div>
              <div style={s("font:700 21px/1.1 Sarabun,sans-serif;color:#c2543c;font-variant-numeric:tabular-nums;letter-spacing:-.025em")}>{V.lostLabel}</div>
            </div>
          </div>
          {/* ── ไม่มีแถบสัดส่วนกับบรรทัด "ใช้ต่อได้ N%" แล้ว (พี่กันสั่ง 1 ก.ย. 2569) ──
              จอมือถือเตี้ย แถบล่างกินที่ไปมากแล้ว · ตัวเลขประหยัด/สูญเสียบอกครบอยู่แล้ว
              ⚠️ แผงขวาฝั่งคอมยังมีทั้งแถบและบรรทัดนี้ครบเหมือนเดิม ห้ามแตะ */}

          {V.saveFailed && (
            <div style={s('border:1px solid rgba(194,84,60,.28);background:#fdf1ed;border-radius:11px;padding:11px 12px;margin-bottom:10px')}>
              <div style={s('font:600 13.5px/1.75 Sarabun,sans-serif;color:#c2543c;margin-bottom:2px')}>ส่งไม่สำเร็จ — เน็ตหลุด</div>
              <div style={s('font:400 12px/1.75 Sarabun,sans-serif;color:#6b746e')}>ข้อมูล {V.rowCount} รายการยังอยู่ครบในเครื่อง ไม่ได้หายไป กดลองส่งใหม่ได้เลย</div>
            </div>
          )}

          <div {...kb(V.onSave)} className={V.saveOn ? 'hv-teal' : 'hv-wait'} style={sx('height:48px;border-radius:11px;display:flex;align-items:center;justify-content:center;font:600 16px Sarabun,sans-serif;cursor:pointer', { background: V.saveBg, color: V.saveFg, border: V.saveBorder, boxSizing: 'border-box' })}>{V.saveLabel}</div>
        </div>
      </div>
    </div>
  );
}
