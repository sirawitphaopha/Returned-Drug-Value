// โครงนอกของทั้งแอป — คัดจากมอคอัป (บรรทัด 23–27 กับ 476–673)
// ลำดับใน DOM ตามต้นฉบับเป๊ะ ตำแหน่งจริงบนจอคุมด้วย order ของ flex
import { s, sx, kb } from './helpers';
import { renderVals } from './vals';
import { renderRecordNarrow, renderRecordWide, renderSaveBar } from './pages/record';
import { renderHistoryNarrow, renderHistoryWide } from './pages/history';
import { renderSummaryNarrow, renderSummaryWide } from './pages/summary';
import { renderNavNarrow, renderNavWide } from './pages/nav';
import { renderSheet } from './pages/sheet';
import { renderSettings } from './pages/settings';
import { renderPrices, renderPriceBar } from './pages/prices';
import { renderLots, renderLotSlip } from './pages/lots';
import { renderLotEdit } from './pages/lotedit';
import { renderCatalog } from './pages/catalog';
import { renderToast } from './pages/toast';
import { renderReasonPick } from './pages/reason';
import { renderConfirm } from './pages/confirm';
import { renderAbout } from './pages/about';
import { renderFooter } from './pages/footer';
import { renderHisImport } from './pages/himport';

// เซิร์ฟเวอร์ยังไม่รู้ความกว้างจอ ถ้าวาดเลยจะเห็นหน้ามือถือแวบหนึ่งบนคอม
// เลยรอวัดจอใน componentDidMount ก่อน ระหว่างนั้นโชว์วงกลมหมุน
function renderLoading() {
  return (
    <div style={s('height:100dvh;display:flex;align-items:center;justify-content:center;background:#f6f7f4')}>
      <div style={s('width:26px;height:26px;border-radius:50%;border:2.5px solid rgba(30,36,32,.12);border-top-color:#2f7d5d;animation:mrspin .7s linear infinite')}></div>
    </div>
  );
}

export function renderShell(app) {
  if (app.state.loading) return renderLoading();
  const V = renderVals(app);

  return (
    <div style={sx('height:100dvh;display:flex;flex-direction:column;overflow:hidden;font-family:Sarabun,sans-serif;color:#1e2420', { background: V.shellBg })}>
      {/* แถบเตือนโหมดดูตัวอย่าง — ต้องเห็นตลอดเวลาที่เปิดโหมด
          จะได้ไม่มีใครเผลอคิดว่าตัวเลขบนจอคือของจริง */}
      {V.demo && (
        <div {...kb(V.toggleDemo)} className="hv-demo" style={s('flex:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 14px;background:#d68a2a;color:#fff;font:600 12px Sarabun,sans-serif;cursor:pointer;text-align:center')}>
          <span>⚠ {V.demoBanner}</span>
          <span style={s('font:600 11px Sarabun,sans-serif;background:rgba(255,255,255,.25);border-radius:6px;padding:2px 8px;flex:none')}>กดเพื่อปิด</span>
        </div>
      )}
      {/* ── แถบเตือนเน็ตหลุด ──────────────────────────────────────────────
          🚨 สีแดงอิฐตัดกับเขียวของเว็บชัด ๆ ตามที่พี่กันสั่ง — เห็นทันทีแม้กวาดตาผ่าน
          วางเหนือพื้นที่เลื่อน จึงค้างอยู่บนสุดเสมอ ไม่เลื่อนหนีไปกับเนื้อหา
          role="status" ให้โปรแกรมอ่านหน้าจออ่านให้เมื่อสถานะเปลี่ยน */}
      {V.offline && (
        <div role="status" aria-live="polite"
          style={s('flex:none;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding:9px 14px;background:#c2543c;color:#fff;font:600 12.5px Sarabun,sans-serif;text-align:center')}>
          <span>{V.offlineBanner}</span>
          <span style={s('font:400 12px Sarabun,sans-serif;color:rgba(255,255,255,.82)')}>{V.offlineHint}</span>
        </div>
      )}

      {/* พื้นที่เลื่อน — ใช้ flex คอลัมน์เพื่อดันท้ายเว็บลงล่างสุดเสมอ
          แม้เนื้อหาจะสั้นกว่าจอ (margin-top:auto ในตัว footer) */}
      {/* overflow-anchor:none = ปิดระบบ "ยึดตำแหน่งเลื่อน" ของเบราว์เซอร์
          ปกติมันช่วยไม่ให้จอกระตุกตอนเนื้อหาข้างบนโตขึ้น แต่ที่นี่มันกลับดึงตำแหน่งเดิมกลับมา
          หลังสลับแท็บแล้วข้อมูลโหลดเสร็จ ทำให้เปิดหน้าสรุปมาแล้วอยู่กลางหน้า (พี่กันแจ้งบั๊ก) */}
      {/* role="main" = บอกโปรแกรมอ่านหน้าจอว่าตรงนี้คือเนื้อหาหลักของหน้า (ผลตรวจข้อ ต-14)
          🚨 เติม role บน div เดิม ไม่เปลี่ยนเป็นแท็ก <main> เพราะ <main> มีสไตล์ตั้งต้นของเบราว์เซอร์
             เปลี่ยนแท็กเมื่อไหร่หน้าตาขยับทันที · เติม role อย่างเดียวไม่แตะ CSS เลยสักพิกเซล */}
      <div ref={app.scrollRef} role="main" style={s('flex:1;overflow-y:auto;overflow-anchor:none;min-height:0;position:relative;display:flex;flex-direction:column')}>
        {/* กล่องครอบเนื้อหา — ยืดเต็มพื้นที่ที่เหลือ ท้ายเว็บเลยถูกดันลงล่างสุดเอง
            ไม่ต้องพึ่ง margin-top:auto

            🚨 ต่างกัน 2 โหมด และต่างกันแค่ตัวเดียวคือ "หดได้ไหม"
            · หน้าทั่วไป  flex:1 0 auto = ห้ามหด เนื้อหายาวเท่าไหร่ก็ดันให้ทั้งหน้าเลื่อน
            · หน้าบันทึกคอม flex:1 min-height:0 = หดได้ ความสูงจึงเท่าจอพอดี
              ต้องหดได้เท่านั้น กรอบรายการข้างในถึงจะรู้ว่าตัวเองสูงได้แค่ไหน แล้วเลื่อนในตัวเอง
              ถ้าใช้ 1 0 auto กรอบจะยืดตามจำนวนแถวไปเรื่อย ๆ แล้วทั้งหน้าเลื่อนแทน */}
        <div style={V.fitScreen
          ? s('flex:1;min-height:0;display:flex;flex-direction:column')
          : s('flex:1 0 auto;display:flex;flex-direction:column')}>
          {V.isRecord && (V.narrow ? renderRecordNarrow(V) : renderRecordWide(V))}
          {V.isHistory && (V.narrow ? renderHistoryNarrow(V) : renderHistoryWide(V))}
          {V.isSummary && (V.narrow ? renderSummaryNarrow(V) : renderSummaryWide(V))}
          {V.isPrices && renderPrices(V)}
          {V.isLots && renderLots(V)}
          {V.isCatalog && renderCatalog(V)}
          {V.isAbout && renderAbout(V)}
        </div>
        {renderFooter(V)}
      </div>

      {V.narrow && renderNavNarrow(V)}
      {V.wide && renderNavWide(V)}
      {renderSheet(V)}
      {V.recordNarrow && renderSaveBar(V)}
      {V.isPrices && renderPriceBar(V)}
      {renderSettings(V)}
      {renderHisImport(V)}
      {renderLotSlip(V)}
      {renderLotEdit(V)}
      {renderToast(V)}
      {renderReasonPick(V)}
      {renderConfirm(V)}
    </div>
  );
}
