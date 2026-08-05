// ── จับคู่ยาในไฟล์ HIS กับยาในเว็บ ──────────────────────────────────────────
//
// โจทย์: ไฟล์ `รายการยา.XLS` ของ HIS ไม่มีรหัสยาที่ตรงกับตาราง drugs ของเว็บเลย
//        จับคู่ได้ทางเดียวคือเทียบชื่อ ซึ่งสองฝั่งเขียนคนละแบบ
//
//   เว็บ : ชื่อสามัญ + ความแรง เป็นระเบียบ   "Ceftriaxone 1 g"
//   HIS  : ข้อความอิสระ พิมพ์กันคนละสไตล์    "CefTRI-axone 1 g/vial pwd. inj. (Preg B)"
//
// 🚨 เรื่องที่ต้องรู้ ไม่งั้นจับคู่พลาดเป็นร้อยตัว
//
// 1. HIS เขียนชื่อยาแบบ Tall Man Lettering เพื่อกันหยิบยาชื่อพ้องผิด
//    CefTRI-axone · ceFA-zolin · CefTAZ-idime · CeFO-taxime
//    ถ้าแปลงขีดเป็นช่องว่างจะกลายเป็น "cef triaxone" ไม่มีวันตรงกับ "ceftriaxone"
//    → ต้องเทียบแบบ "บีบติดกัน" (squash) ที่ตัดทั้งขีดทั้งช่องว่างทิ้ง
//
// 2. HIS ใช้ชื่อการค้าและตัวย่อ  Artane = Benzhexol · CPM = Chlorpheniramine · CPZ = Chlorpromazine
// 3. HIS มีคำสะกดผิดในต้นทาง     bisacodil (ที่ถูกคือ bisacodyl)
// 4. HIS มีเวชภัณฑ์ปนมาด้วย      Aluminium Splint · สายยาง · ถุงมือ
// 5. HIS มียาเลิกใช้ (no_use)    ต้องคัดออก ไม่งั้นได้ราคาของยาที่ไม่มีขายแล้ว
//
// ข้อ 2 กับ 3 เครื่องเดาเองไม่ได้ → ต้องให้เภสัชกรตัดสินในหน้าตรวจทาน
// ไฟล์นี้จึงไม่ตัดสินใจแทนใคร แค่ "เสนอผู้สมัคร" พร้อมบอกระดับความมั่นใจ

// ตัดภาษาไทย วงเล็บ วงเล็บเหลี่ยม แล้วเหลือแต่ตัวพิมพ์เล็กคั่นด้วยช่องว่าง
export function normName(s) {
  return String(s || '')
    .replace(/[฀-๿]+/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9.+/%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// บีบให้เหลือแต่ตัวอักษรกับตัวเลข ไม่มีช่องว่าง — ตัวจัดการ Tall Man Lettering
export function squashName(s) {
  return String(s || '')
    .replace(/[฀-๿]+/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

// ตัวเลขทั้งหมดในข้อความ ใช้ยืนยันว่าเป็นความแรงเดียวกัน
export function numsIn(s) {
  return (String(s || '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

// คำที่บอกว่าแถวนั้นเป็นเวชภัณฑ์ ไม่ใช่ยา — คัดออกก่อนจับคู่
const SUPPLY = /splint|syringe|glove|gauze|cotton wool|needle|catheter|face mask|nasal cannula|elastic band|plaster|urine bag|extension tube|three way|เข็ม|ถุงมือ|สำลี|ผ้าก๊อซ|ผ้าพันแผล|สายสวน|ถุงปัสสาวะ|พลาสเตอร์|หน้ากาก/i;

export function looksLikeSupply(name) {
  return SUPPLY.test(String(name || ''));
}

// ── อ่านตารางที่ได้จากไฟล์ Excel ให้เป็นรายการยาของ HIS ────────────────────
// rows = array ของ object ที่ SheetJS อ่านมา (คีย์คือหัวคอลัมน์)
export function readHisRows(rows) {
  const out = [];
  for (const r of rows || []) {
    const name = String(r.Name == null ? '' : r.Name).trim();
    if (!name) continue;
    const price = Number(r.UnitPrice);
    out.push({
      name: name,
      price: Number.isFinite(price) ? price : 0,
      unit: String(r.UnitName == null ? '' : r.UnitName).trim(),
      // no_use = 1 คือยาที่เลิกใช้แล้ว
      retired: String(r.no_use == null ? '' : r.no_use).trim() === '1',
      supply: looksLikeSupply(name),
      n: normName(name),
      sq: squashName(name),
      nums: numsIn(name)
    });
  }
  return out;
}

// ── หาผู้สมัครให้ยาหนึ่งตัว ─────────────────────────────────────────────────
// drug  = { id, name, price }  ยาในเว็บ (ชื่อประกอบแล้ว เช่น "Ceftriaxone 1 g")
// pool  = ผลจาก readHisRows()
//
// คืน { level, candidates } — level เป็นตัวบอกว่าเชื่อได้แค่ไหน
//   'sure'   เจอตัวเดียว ราคามากกว่า 0
//   'pick'   เจอหลายตัว ต้องให้คนเลือก
//   'none'   ไม่เจอเลย ต้องพิมพ์ราคาเองหรือข้าม
export function matchOne(drug, pool) {
  const full = String(drug.name || '');
  // ตัดความแรงท้ายชื่อออก เหลือเฉพาะชื่อยา เช่น "Ceftriaxone 1 g" → "Ceftriaxone"
  const genPart = full.replace(/\s\d[\d\w./+\- ]*$/, '');
  const firstWord = normName(genPart).split(' ')[0] || '';
  const genSq = squashName(genPart);
  const want = numsIn(full.slice(genPart.length));

  if (genSq.length < 4) return { level: 'none', candidates: [] };

  // ยาที่เลิกใช้กับเวชภัณฑ์ ไม่เอามาเป็นผู้สมัครตั้งแต่แรก
  const live = pool.filter((h) => !h.retired && !h.supply && h.price > 0);

  let cand = live.filter(
    (h) => h.sq.includes(genSq) || (firstWord.length >= 4 && h.n.includes(firstWord))
  );
  if (!cand.length) return { level: 'none', candidates: [] };

  // ── ตรวจความแรง ต้องตรวจ "เสมอ" ไม่ใช่เฉพาะตอนมีหลายตัวเลือก ────────────
  // 🚨 เคยพลาดมาแล้ว: เดิมตรวจเฉพาะตอน cand.length > 1
  //    พอในไฟล์มี ACYCLOVIR 400 mg อยู่แถวเดียว ยา "Acyclovir 500 mg" ในเว็บ
  //    ก็จับคู่กับแถว 400 mg แล้วขึ้นว่า "มั่นใจ" ติ๊กให้อัตโนมัติ
  //    = ได้ราคาของยาคนละความแรงมาใส่แบบเงียบ ๆ ซึ่งอันตรายที่สุดในระบบนี้
  // ถ้าไม่มีแถวไหนความแรงตรงเลย → ห้ามขึ้นว่ามั่นใจเด็ดขาด ส่งให้คนตัดสิน
  if (want.length) {
    const exact = cand.filter((h) => want.every((w) => h.nums.includes(w)));
    if (exact.length) cand = exact;
    else return { level: 'pick', candidates: cand.slice().sort((a, b) => a.sq.length - b.sq.length) };
  }

  // เรียงให้ตัวที่ชื่อสั้นที่สุดมาก่อน — ชื่อสั้น = มีของแถมน้อย มักตรงตัวกว่า
  cand = cand.slice().sort((a, b) => a.sq.length - b.sq.length);

  return { level: cand.length === 1 ? 'sure' : 'pick', candidates: cand };
}

// ── จับคู่ทั้งชุด ───────────────────────────────────────────────────────────
export function matchAll(drugs, pool) {
  const rows = [];
  for (const d of drugs || []) {
    const m = matchOne(d, pool);
    rows.push({
      drugId: d.id,
      webName: d.name,
      unit: d.unit || '',
      oldPrice: Number(d.price || 0),
      level: m.level,
      candidates: m.candidates,
      // เลือกตัวแรกไว้ก่อน · ระดับ pick ยังไม่ติ๊กให้ ต้องให้คนยืนยันเอง
      pickedIndex: m.candidates.length ? 0 : -1,
      checked: m.level === 'sure',
      manualPrice: ''
    });
  }
  return rows;
}

// ราคาที่จะบันทึกของแถวหนึ่ง — ว่าง = ยังไม่มีราคาที่ใช้ได้
export function rowPrice(row) {
  if (row.manualPrice !== '' && row.manualPrice != null) {
    const v = Number(row.manualPrice);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  const c = row.candidates[row.pickedIndex];
  return c && c.price > 0 ? c.price : null;
}
