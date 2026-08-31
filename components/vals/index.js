// รวมค่าที่ใช้วาดจอทั้งหมดไว้ก้อนเดียว ชื่อคีย์เท่าเดิมกับมอคอัป
// แยกไฟล์ตามหน้า แต่ผลลัพธ์เป็น object ก้อนเดียวเหมือน renderVals ต้นฉบับ
import { derive } from './derive';
import { shellVals } from './shell';
import { recordVals } from './record';
import { historyVals } from './history';
import { summaryVals } from './summary';
import { sheetVals } from './sheet';
import { settingsVals } from './settings';
import { pricesVals } from './prices';
import { signVals } from './sign';
import { himportVals } from './himport';
import { lotsVals } from './lots';
import { catalogVals } from './catalog';
import { resultVals } from './result';

export function renderVals(app) {
  const d = derive(app);

  // 🚨 คำนวณทีละไฟล์ "ครั้งเดียว" แล้วใช้ทั้งการรวมร่างและการตรวจคีย์ซ้ำ (ผลตรวจข้อ ต-9)
  //    ของเดิมเรียก vals ทุกตัวซ้ำอีกรอบเพื่อตรวจ = ทำงานสองเท่าตอน dev โดยไม่จำเป็น
  //    และรายชื่อที่เอามาตรวจมีแค่ 8 ไฟล์ ขาด himport · lots · catalog ไป 3 ไฟล์
  //    ตัวตรวจที่ตรวจไม่ครบแย่กว่าไม่มีตัวตรวจ เพราะให้ความมั่นใจแบบผิด ๆ
  // รายชื่อตัวคำนวณ — เก็บเป็น "ฟังก์ชัน" ไม่ใช่ผลลัพธ์ เพื่อให้เลือกเรียกได้
  const FILES = [
    ['shell', shellVals],
    ['record', recordVals],
    ['history', historyVals],
    ['summary', summaryVals],
    ['sheet', sheetVals],
    ['settings', settingsVals],
    ['prices', pricesVals],
    ['sign', signVals],
    ['himport', himportVals],
    ['lots', lotsVals],
    ['catalog', catalogVals],
    ['result', resultVals]
  ];

  // ── ตัวจับเวลาสำหรับหาจุดที่หนัก (มีเฉพาะตอนรันในเครื่อง) ─────────────────
  // เปิดด้วย window.__mrvPerf = true แล้วอ่านผลจาก window.__mrvPerfLog
  // 🚨 เว็บจริงไม่มีโค้ดส่วนนี้เลย ตัวแปลงตัดทิ้งตั้งแต่ตอน build
  const dev = process.env.NODE_ENV !== 'production';
  const timing = dev && typeof window !== 'undefined' && window.__mrvPerf;
  const run = (name, fn) => {
    if (!timing) return fn(app, d);
    const t0 = performance.now();
    const out = fn(app, d);
    const ms = performance.now() - t0;
    const log = (window.__mrvPerfLog = window.__mrvPerfLog || {});
    const box = (log[name] = log[name] || { n: 0, total: 0, max: 0 });
    box.n++; box.total += ms; box.max = Math.max(box.max, ms);
    return out;
  };

  // ── คำนวณเฉพาะหน้าที่กำลังเปิดอยู่ (ผลตรวจข้อ ก-8) ────────────────────────
  // พี่กันสั่ง 27 ส.ค. 2569: "ก8 ต้องแก้เลย เราต้องการจุดที่ดีที่สุด"
  //
  // เดิมคำนวณค่าของทุกหน้าใหม่ทุกครั้งที่วาดจอ แม้แต่หน้าที่ไม่ได้เปิด
  // พิมพ์ 1 ตัวอักษรในช่องค้นยา = ประกอบชื่อยา 417 ตัวของหน้าคลังยาใหม่ทั้งชุด
  //
  // ✅ ตรวจแล้วว่าตัดได้ปลอดภัย — ไล่ดูทีละคีย์ทั้ง 334 ตัวจาก 6 ไฟล์นี้
  //    ไม่มีหน้าไหนใช้ค่าข้ามไฟล์กันเลยสักตัวเดียว
  //
  // 🚨 หน้าที่ถูกข้ามได้ค่าเป็นว่างเปล่า ไม่ใช่ค่าเก่าที่จำไว้
  //    ถ้าคืนค่าเก่า ธงอย่าง slipOpen จะค้างเป็นจริง แล้วใบสรุปจะเด้งขึ้นมาเอง
  //    ตัววาดทุกตัวมีด่าน "ไม่มีค่า = ไม่วาด" อยู่แล้ว จึงปลอดภัยกว่า
  const stt = app.state;
  const sc = stt.screen;
  const need = {
    history: sc === 'history',
    summary: sc === 'summary',
    prices: sc === 'prices',
    catalog: sc === 'catalog',
    // หน้าต่างซ้อนของรายการ Lot เปิดข้ามหน้าได้ — ใบสรุปเปิดจากหน้าผลหลังกดบันทึกก็ได้
    lots: sc === 'lots' || !!stt.slipLot || !!stt.lotEdit || !!stt.result,
    // หน้านำเข้าราคาจากไฟล์ HIS เป็นหน้าต่างซ้อนของหน้าจัดการราคา
    himport: sc === 'prices' || !!stt.hisOpen
  };

  const parts = FILES.map(([name, fn]) =>
    [name, (name in need) && !need[name] ? {} : run(name, fn)]
  );

  const box = Object.assign({}, ...parts.map((p) => p[1]));

  // 🚨 ธงบอกว่าหน้าไหนเปิดอยู่ ต้องมีค่าถูกต้องเสมอ แม้หน้านั้นจะไม่ถูกคำนวณ
  //    เดิมธงพวกนี้อยู่ในไฟล์ของหน้าตัวเอง ซึ่งกลายเป็นวงจรอุบาทว์ทันทีที่ข้าม
  //    (ไม่คำนวณหน้าราคา → ไม่มีธง isPrices → กดเข้าหน้าราคาแล้วจอว่างถาวร)
  box.isHistory = sc === 'history';
  box.isSummary = sc === 'summary';
  box.isPrices = sc === 'prices';
  box.isLots = sc === 'lots';
  box.isCatalog = sc === 'catalog';

  // ── สวิตช์ดูโครงจาง (พี่กันสั่ง 27 ส.ค. 2569) ──────────────────────────
  // 🚨 เปิดสวิตช์แล้วต้องไม่มีข้อมูลจริงเหลืออยู่เลย
  //    ของเดิมแค่วาดโครงจางเพิ่มเข้าไป ข้อมูลจริงยังอยู่ครบ = ซ้อนกันสองชุด
  //    พี่กันเห็นแล้วทัก "เปิดโหมดนี้ ไม่โหลดข้อมูลจริงสิ"
  // 🚨 ทำที่จุดรวมร่างจุดเดียว ทุกหน้าได้ผลพร้อมกัน
  //    ถ้าไปดักทีละหน้าจะตกหล่นแน่นอน (มี 6 หน้าที่มีรายการ)
  if (app.state.skelDemo) {
    box.histRows = [];
    box.lotRows = [];
    box.catRows = [];
    box.priceRows = [];
    box.rows = [];
    box.sumTop = [];
    box.sumTopReturned = [];
    box.sumMonths = [];
    box.sumSources = [];
    box.lotEditRows = [];
    // ธงว่างต้องปิดด้วย ไม่งั้นจะขึ้นข้อความ "ไม่พบรายการ" ทับโครงจาง
    box.histEmpty = false;
    box.lotsEmpty = false;
    box.lotsFilteredOut = false;
    box.priceEmpty = false;
    box.catEmpty = false;
  }

  // เตือนตอน dev ถ้ามีคีย์ซ้ำข้ามไฟล์ — เคยพลาดมาแล้ว (fyLabel ของหน้าบันทึกโดน summary ทับ
  // จนค่าจากเซิร์ฟเวอร์ไม่เคยถูกใช้เลย และ setLight/setDark ซ้ำจนกลายเป็นโค้ดตาย)
  // 🚨 เพิ่มไฟล์ใหม่ใน parts ข้างบน = ได้รับการตรวจอัตโนมัติ ไม่ต้องมาเติมรายชื่อสองที่
  if (process.env.NODE_ENV !== 'production') {
    const seen = {};
    for (const [file, obj] of parts) {
      for (const k of Object.keys(obj)) {
        if (seen[k]) console.warn('[vals] คีย์ซ้ำ:', k, '→', seen[k], 'ถูกทับด้วย', file);
        seen[k] = file;
      }
    }
  }

  return box;
}
