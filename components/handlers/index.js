// ติดเมธอดทั้งหมดเข้ากับตัวแอป — เรียกครั้งเดียวใน constructor
import { uiActions } from './ui';
import { dataActions } from './data';
import { recordActions } from './record';
import { historyActions } from './history';
import { summaryActions } from './summary';
import { settingsActions } from './settings';
import { pricesActions } from './prices';
import { demoActions } from './demo';

export function installHandlers(app) {
  uiActions(app);
  dataActions(app);
  recordActions(app);
  historyActions(app);
  summaryActions(app);
  settingsActions(app);
  pricesActions(app);
  demoActions(app);
}
