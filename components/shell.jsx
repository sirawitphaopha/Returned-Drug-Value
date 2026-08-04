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
    </div>
  );
}
