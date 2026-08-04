// ค่าที่หลายหน้าใช้ร่วมกัน — คิดครั้งเดียวต่อการวาดจอหนึ่งรอบ
export function derive(app) {
  const st = app.state;
  const q = st.query.trim().toLowerCase();
  const results = q.length >= 2
    ? st.drugs.filter((d) => d.name.toLowerCase().indexOf(q) >= 0).slice(0, 8)
    : [];
  const saved = app.savedTotal();
  const lost = app.lostTotal();

  return {
    st: st,
    dark: st.dark,
    q: q,
    results: results,
    saved: saved,
    lost: lost,
    gross: saved + lost,
    // มอคอัปมีสวิตช์บังคับดูแบบมือถือบนคอมด้วย (forceNarrow) เป็นของเดโม ตัดออกแล้ว
    wide: st.vw >= 960
  };
}
