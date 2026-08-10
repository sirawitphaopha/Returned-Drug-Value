// ค่าที่หลายหน้าใช้ร่วมกัน — คิดครั้งเดียวต่อการวาดจอหนึ่งรอบ

// ดึงตัวเลขความแรงตัวแรกออกมาจากชื่อยา ใช้เรียงลำดับ
const strengthOf = (name) => {
  const m = name.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
};

// จัดอันดับผลค้นหา — เดิมเรียงตามตัวอักษรอย่างเดียว
// พิมพ์ "enal" กด Enter เลยได้ Enalapril 20 mg ไม่ใช่ 5 mg เพราะ "2" มาก่อน "5"
// มียา 70 ชื่อในคลังที่มีหลายความแรง เสี่ยงกรอกผิดโดยไม่รู้ตัว
// กติกาใหม่: ขึ้นต้นตรงกับที่พิมพ์มาก่อน → ความแรงน้อยกว่ามาก่อน → ตามตัวอักษร
function rankResults(drugs, q) {
  const hit = [];
  for (const d of drugs) {
    const low = d.name.toLowerCase();
    let at = low.indexOf(q);

    // ค้นจากชื่อการค้าได้ด้วย — เภสัชกรจำ "Augmentin" ได้ก่อน "Amoxicillin + Clavulanic acid"
    // (ME-DRP ค้นแบบนี้อยู่แล้ว พี่กันชี้ให้ทำคล้ายกัน)
    // เจอในชื่อการค้าให้จัดอันดับรองจากที่เจอในชื่อสามัญ ใช้ at ใหญ่ ๆ ถ่วงไว้
    if (at < 0) {
      const brandLow = String(d.brand || '').toLowerCase();
      if (!brandLow || brandLow.indexOf(q) < 0) continue;
      at = 900 + brandLow.indexOf(q);
    }

    hit.push({ d: d, starts: at === 0 ? 0 : 1, at: at, st: strengthOf(d.name) });
  }
  hit.sort((a, b) =>
    a.starts - b.starts ||
    a.at - b.at ||
    a.st - b.st ||
    a.d.name.localeCompare(b.d.name)
  );
  return hit.map((h) => h.d);
}

export function derive(app) {
  const st = app.state;
  const q = st.query.trim().toLowerCase();
  // เลือกยาไปแล้ว (pending) และช่องค้นหายังเป็นชื่อยาตัวนั้นอยู่ → ปิดรายการผลค้นหา
  // มอคอัปไม่ได้กันไว้ พอกดเลือกแล้วรายการค้างเปิดทับหน้าจอ (บรรทัด 951 + 1077)
  const picked = !!st.pending && st.query === st.pending.name;
  const results = (!picked && q.length >= 2) ? rankResults(st.drugs, q).slice(0, 8) : [];
  const saved = app.savedTotal();
  const lost = app.lostTotal();

  return {
    st: st,
    dark: st.dark,
    q: q,
    results: results,
    // เลือกยาไปแล้ว (ช่องค้นหาเป็นชื่อยาที่เลือกพอดี) — ไม่ใช่ "หาไม่เจอ"
    // ต้องส่งค่านี้ออกไปด้วย ไม่งั้นกล่อง "ไม่พบยาชื่อนี้" จะเด้งขึ้นหลังกดเลือกสำเร็จ
    // เพราะตอนเลือกแล้วเราสั่งให้ results เป็นศูนย์เพื่อปิดรายการผลค้นหา
    picked: picked,
    // แถวที่ไฮไลต์อยู่ในรายการผลค้นหา (เลื่อนด้วยลูกศรขึ้น/ลง)
    hi: Math.min(st.hi || 0, Math.max(0, results.length - 1)),
    saved: saved,
    lost: lost,
    gross: saved + lost,
    // สวิตช์บังคับดูแบบมือถือบนคอม (มอคอัปบรรทัด 1165) — พี่กันขอให้เก็บไว้
    //
    // จุดตัด: มอคอัปใช้ 960 แต่วัดจริงแล้วที่ 960px คอลัมน์ชื่อยาในตารางเหลือ 34px
    // (คอลัมน์อื่นตรึงความกว้างรวม 522px + แถบข้าง 296px กินไปหมด)
    // แค่ "Metformin 500 mg" ก็ตัดเป็น 3 บรรทัดแล้ว ชื่อยาวกว่านั้นตารางพังเลย
    // ขยับเป็น 1180 → โน้ตบุ๊กจอเล็กได้หน้าจอมือถือซึ่งอ่านง่ายกว่ามาก
    wide: st.vw >= 1180 && !st.forceNarrow
  };
}
