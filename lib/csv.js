// ส่งออกไฟล์ CSV — คัดจากมอคอัป (Med Return App.dc.html บรรทัด 1053–1066) ตัวต่อตัว
// หัวตารางใช้ข้อความของมอคอัป ('ราคาต่อหน่วย ณ วันบันทึก') ตามกฎทำให้เหมือน
// อักขระ BOM ข้างหน้า ทำให้ Excel บนวินโดวส์อ่านภาษาไทยไม่เป็นตัวยึกยือ
import { SOURCES } from './format';

const HEAD = 'วันที่,ยา,จำนวน,หน่วย,ราคาต่อหน่วย ณ วันบันทึก,มูลค่า,สถานะ,เหตุผลที่ทำลาย,แหล่งที่มา,รพ.สต. ต้นทาง,HN,ผู้บันทึก,เลขล็อต\n';

// ครอบทุกช่อง ไม่ใช่แค่ชื่อยา — ช่องหน่วยนับพิมพ์เองได้ในหน้าจัดการราคา
// ถ้าใครพิมพ์ "ขวด, ใหญ่" คอลัมน์ตั้งแต่หน่วยเป็นต้นไปของแถวนั้นจะเลื่อนทั้งไฟล์
// และค่าที่ขึ้นต้นด้วย = + - @ Excel จะตีความเป็นสูตร ต้องเติม ' นำหน้ากันไว้
function q(v) {
  let sv = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(sv)) sv = "'" + sv;
  return '"' + sv.replace(/"/g, '""') + '"';
}

// วันที่เป็น พ.ศ. ให้ตรงกับทั้งเว็บ (เดิมส่งออกเป็น ค.ศ. ขัดกับที่โชว์บนจอ)
const thaiDay = (iso) => {
  const p = String(iso || '').split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + (Number(p[0]) + 543) : String(iso || '');
};

// meta = { orgName, fyLabel, rangeLabel, printedOn }
// ต่างจากมอคอัป: เติมหัวไฟล์ 4 บรรทัด + บรรทัดยอดรวมท้ายไฟล์
// เพราะผู้บริหารเปิดไฟล์แล้วเจอตารางเปล่า ๆ ไม่รู้ว่าของโรงพยาบาลอะไร ปีงบไหน
// และหน้าตั้งค่าเขียนบอกผู้ใช้ไว้ว่าชื่อห้องยาจะไปเป็นหัวไฟล์ ซึ่งเดิมไม่จริง
export function recordsToCsv(records, meta) {
  const m = meta || {};
  const head = [
    [q('รายงานมูลค่ายาคืน')].join(','),
    [q('หน่วยงาน'), q(m.orgName || '')].join(','),
    [q('ปีงบประมาณ'), q(m.fyLabel || '')].join(','),
    [q('ช่วงข้อมูล'), q(m.rangeLabel || '')].join(','),
    [q('วันที่ออกรายงาน'), q(thaiDay(m.printedOn || ''))].join(','),
    ''
  ].join('\n') + '\n';

  const body = records.map((r) => [
    q(thaiDay(r.date)),
    q(r.name),
    r.qty,
    q(r.unit),
    Number(r.price).toFixed(2),
    (Number(r.price) * r.qty).toFixed(2),
    q(r.disposition === 'reuse' ? 'ใช้ต่อได้' : 'ทำลาย'),
    q(r.reason || ''),
    q((SOURCES.find((s) => s.key === r.source) || {}).label || r.source),
    q(r.pcuSite || ''),
    q(r.hn || ''),
    q(r.by || ''),
    q(r.lot || '')
  ].join(',')).join('\n');

  // บรรทัดยอดรวมท้ายไฟล์ — ผู้บริหารจะได้ไม่ต้องมานั่ง SUM เอง
  let saved = 0, lost = 0;
  for (const r of records) {
    const v = Number(r.price) * r.qty;
    if (r.disposition === 'reuse') saved += v; else lost += v;
  }
  const foot = '\n\n' + [
    [q('รวมประหยัดได้ (ใช้ต่อได้)'), saved.toFixed(2)].join(','),
    [q('รวมสูญเสีย (ทำลาย)'), lost.toFixed(2)].join(','),
    [q('รวมมูลค่าที่คืนมาทั้งหมด'), (saved + lost).toFixed(2)].join(','),
    [q('จำนวนรายการ'), records.length].join(',')
  ].join('\n');

  return '﻿' + head + HEAD + body + foot;
}

// ── ไฟล์ CSV ของหน้ารายการ Lot ────────────────────────────────────────────
// คนละไฟล์กับ recordsToCsv โดยตั้งใจ — อันนั้นเป็นรายตัวยา อันนี้เป็นราย Lot
// ใช้ตอบคำถามคนละแบบ: "เดือนนี้รับคืนกี่รอบ แต่ละรอบใครเซ็น เป็นเงินเท่าไร"
//
// 🚨 ส่งออกเฉพาะแถวที่กรองอยู่บนจอ ไม่ใช่ทั้งหมดที่โหลดมา
//    ผู้ใช้กรอง รพ.สต. แห่งหนึ่งแล้วกดส่งออก ต้องได้ไฟล์ของแห่งนั้น
//    ไม่ใช่ไฟล์ทั้งเดือนซึ่งขัดกับที่เห็นตรงหน้า
export function lotsToCsv(lots, meta) {
  const m = meta || {};
  const head = [
    [q('รายงานรายการ Lot ยาคืน')].join(','),
    [q('หน่วยงาน'), q(m.orgName || '')].join(','),
    [q('ช่วงข้อมูล'), q(m.rangeLabel || '')].join(','),
    [q('ตัวกรองที่ใช้'), q(m.filterLabel || 'ไม่ได้กรอง')].join(','),
    [q('วันที่ออกรายงาน'), q(thaiDay(m.printedOn || ''))].join(','),
    ''
  ].join('\n') + '\n';

  const HEAD_LOT = 'วันที่,เลข Lot,ผู้บันทึก,แหล่งที่มา,รพ.สต. ต้นทาง,จำนวนรายการ,มูลค่าใช้ต่อได้,มูลค่าทำลาย,รวมทั้งสิ้น\n';

  const body = lots.map((l) => [
    q(thaiDay(l.date)),
    q(l.lot || ''),
    q(l.by || ''),
    q(l.srcLabel || ''),
    q(l.site || ''),
    Number(l.items || 0),
    Number(l.saved || 0).toFixed(2),
    Number(l.lost || 0).toFixed(2),
    (Number(l.saved || 0) + Number(l.lost || 0)).toFixed(2)
  ].join(',')).join('\n');

  // บรรทัดยอดรวมท้ายไฟล์ — เปิดไฟล์แล้วเห็นยอดทันทีโดยไม่ต้อง SUM เอง
  let saved = 0, lost = 0;
  for (const l of lots) { saved += Number(l.saved || 0); lost += Number(l.lost || 0); }
  const foot = '\n\n' + [
    [q('รวมประหยัดได้ (ใช้ต่อได้)'), saved.toFixed(2)].join(','),
    [q('รวมสูญเสีย (ทำลาย)'), lost.toFixed(2)].join(','),
    [q('รวมมูลค่าที่คืนมาทั้งหมด'), (saved + lost).toFixed(2)].join(','),
    [q('จำนวน Lot'), lots.length].join(',')
  ].join('\n');

  // อักขระ BOM ข้างหน้า ทำให้ Excel บนวินโดวส์อ่านภาษาไทยไม่เป็นตัวยึกยือ
  return '\ufeff' + head + HEAD_LOT + body + foot;
}

export function downloadCsv(text, filename) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
