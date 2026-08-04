// ส่งออกไฟล์ CSV — คัดจากมอคอัป (Med Return App.dc.html บรรทัด 1053–1066) ตัวต่อตัว
// หัวตารางใช้ข้อความของมอคอัป ('ราคาต่อหน่วย ณ วันบันทึก') ตามกฎทำให้เหมือน
// อักขระ BOM ข้างหน้า ทำให้ Excel บนวินโดวส์อ่านภาษาไทยไม่เป็นตัวยึกยือ
import { SOURCES } from './format';

const HEAD = 'วันที่,ยา,จำนวน,หน่วย,ราคาต่อหน่วย ณ วันบันทึก,มูลค่า,สถานะ,แหล่งที่มา,HN\n';

export function recordsToCsv(records) {
  const body = records.map((r) => [
    r.date,
    '"' + String(r.name).replace(/"/g, '""') + '"',
    r.qty,
    r.unit,
    Number(r.price).toFixed(2),
    (Number(r.price) * r.qty).toFixed(2),
    r.disposition === 'reuse' ? 'ใช้ต่อได้' : 'ทำลาย',
    (SOURCES.find((s) => s.key === r.source) || {}).label || r.source,
    r.hn || ''
  ].join(',')).join('\n');

  return '﻿' + HEAD + body;
}

export function downloadCsv(text, filename) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
