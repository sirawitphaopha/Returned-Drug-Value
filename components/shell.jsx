// โครงนอกของทั้งแอป — คัดจากมอคอัป (บรรทัด 23–27 กับ 476–673)
// ลำดับใน DOM ตามต้นฉบับเป๊ะ ตำแหน่งจริงบนจอคุมด้วย order ของ flex
import { s, sx } from './helpers';
import { renderVals } from './vals';
import { renderRecordNarrow, renderRecordWide, renderSaveBar } from './pages/record';
import { renderHistoryNarrow, renderHistoryWide } from './pages/history';
import { renderSummaryNarrow, renderSummaryWide } from './pages/summary';
import { renderNavNarrow, renderNavWide } from './pages/nav';
import { renderSheet } from './pages/sheet';
import { renderSettings } from './pages/settings';
import { renderPrices, renderPriceBar } from './pages/prices';
import { renderToast } from './pages/toast';
import { renderConfirm } from './pages/confirm';

// เซิร์ฟเวอร์ยังไม่รู้ความกว้างจอ ถ้าวาดเลยจะเห็นหน้ามือถือแวบหนึ่งบนคอม
// เลยรอวัดจอใน componentDidMount ก่อน ระหว่างนั้นโชว์วงกลมหมุน
function renderLoading() {
  return (
    <div style={s('height:100dvh;display:flex;align-items:center;justify-content:center;background:#f6f7f4')}>
      <div style={s('width:26px;height:26px;border-radius:50%;border:2.5px solid rgba(30,36,32,.12);border-top-color:#2f7d5d;animation:mrspin .7s linear infinite')}></div>
    </div>
  );
}

// สวิตช์บังคับดูหน้าจอแบบมือถือทั้งที่นั่งอยู่หน้าคอม — คัดจากมอคอัป (บรรทัด 655–663)
// ต่างจากต้นฉบับ 3 จุด:
//   1. ป้ายกำกับเปลี่ยนจาก "เดโม" เป็น "มุมมอง" เพราะของจริงไม่ใช่เดโมแล้ว
//   2. ย้ายจากมุมขวาล่างไปมุมซ้ายล่าง — มุมขวาล่างเป็นที่ของปุ่มแก้/ลบ แถวล่างสุด
//      ในตารางประวัติ สวิตช์ไปทับจนกดไม่ได้ทุกจอที่แคบกว่า ~1700px
//   3. ซ่อนตอนมีหน้าต่างเด้งเปิดอยู่ ไม่งั้นลอยเด่นบนฉากมืด
function renderLayoutSwitch(V) {
  if (!V.showLayoutSwitch || V.anyModalOpen) return null;
  return (
    <div style={s('position:fixed;left:14px;bottom:14px;z-index:10;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(30,36,32,.12);border-radius:10px;padding:5px 6px 5px 11px;box-shadow:0 6px 20px rgba(30,36,32,.14)')}>
      <span style={s("font:500 10.5px 'IBM Plex Sans Thai',sans-serif;letter-spacing:.06em;color:#9aa19c")}>มุมมอง</span>
      <div style={s('display:flex;padding:2px;border-radius:8px;background:#f0f1ee;gap:2px')}>
        <div onClick={V.useDesktop} style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutDeskBg, color: V.layoutDeskFg })}>คอม</div>
        <div onClick={V.useMobile} style={sx('padding:5px 11px;border-radius:6px;cursor:pointer;font:600 12px Sarabun,sans-serif', { background: V.layoutMobBg, color: V.layoutMobFg })}>มือถือ</div>
      </div>
    </div>
  );
}

export function renderShell(app) {
  if (app.state.loading) return renderLoading();
  const V = renderVals(app);

  return (
    <div style={sx('height:100dvh;display:flex;flex-direction:column;overflow:hidden;font-family:Sarabun,sans-serif;color:#1e2420', { background: V.shellBg })}>
      <div style={s('flex:1;overflow-y:auto;min-height:0;position:relative')}>
        {V.isRecord && (V.narrow ? renderRecordNarrow(V) : renderRecordWide(V))}
        {V.isHistory && (V.narrow ? renderHistoryNarrow(V) : renderHistoryWide(V))}
        {V.isSummary && (V.narrow ? renderSummaryNarrow(V) : renderSummaryWide(V))}
        {V.isPrices && renderPrices(V)}
      </div>

      {V.narrow && renderNavNarrow(V)}
      {V.wide && renderNavWide(V)}
      {renderSheet(V)}
      {V.recordNarrow && renderSaveBar(V)}
      {V.isPrices && renderPriceBar(V)}
      {renderSettings(V)}
      {renderToast(V)}
      {renderConfirm(V)}
      {renderLayoutSwitch(V)}
    </div>
  );
}
