-- ============================================================================
-- 002_functions.sql — ฟังก์ชันสรุปยอดฝั่งฐานข้อมูล
--
-- ทำไมต้องคำนวณใน SQL ไม่ดึงแถวมารวมในเบราว์เซอร์:
-- ปีงบหนึ่งจะมีหลายพันแถว ดึงมาทั้งหมดแล้วบวกเองทั้งช้าและกินเน็ต
-- ฝั่งเบราว์เซอร์เหลือแค่คำนวณ "หน้าตา" (ความสูงแท่งกราฟ สี เปอร์เซ็นต์) เหมือนมอคอัป
--
-- ⚠️ กติกาการนับต้องตรงมอคอัปเป๊ะ (Med Return App.dc.html บรรทัด 1085–1089)
--    byDrug  → นับเฉพาะ reuse  (บรรทัด 1086)
--    byMonth → นับเฉพาะ reuse  (บรรทัด 1088)
--    bySrc   → นับทั้ง reuse และ destroy  (บรรทัด 1087)
--    มูลค่าของแถว = unit_price ที่แช่ไว้ในแถว × qty — ห้าม join เอาราคาปัจจุบันมาคูณ
-- ============================================================================

-- ── mr_summary — ตัวเลขทั้งหมดของหน้าสรุป ในคำขอเดียว ────────────────────────
-- ช่วงวันที่ส่งมาจากฝั่งเซิร์ฟเวอร์ (คำนวณปีงบด้วยนาฬิกาไทย ไม่ใช่นาฬิกา DB ที่เป็น UTC)
create or replace function mr_summary(p_from date, p_to date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with rec as (
    select
      drug_name,
      source,
      disposition,
      return_date,
      qty,
      unit_price * qty as value
    from mr_return
    where (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
  )
  select jsonb_build_object(
    -- ยอดรวมก้อนใหญ่
    'saved',   coalesce((select sum(value) from rec where disposition = 'reuse'),   0),
    'lost',    coalesce((select sum(value) from rec where disposition = 'destroy'), 0),
    'records', (select count(*) from rec),
    'qty',     coalesce((select sum(qty) from rec), 0),

    -- จำนวน "รายการยา" ที่ต่างกัน · มอคอัปนับจาก Object.keys(byDrug).length (บรรทัด 1397)
    -- byDrug เก็บเฉพาะ reuse ตัวนับนี้เลยต้องเฉพาะ reuse เหมือนกัน
    'drugCount', (select count(distinct drug_name) from rec where disposition = 'reuse'),

    -- กราฟแท่ง 12 เดือน · คีย์ 'YYYY-MM' · เฉพาะ reuse
    'byMonth', coalesce((
      select jsonb_object_agg(m, v)
      from (
        select to_char(return_date, 'YYYY-MM') as m, sum(value) as v
        from rec
        where disposition = 'reuse'
        group by 1
      ) t
    ), '{}'::jsonb),

    -- สัดส่วนแหล่งที่มา · นับทั้งสองแบบ
    'bySrc', coalesce((
      select jsonb_object_agg(source, v)
      from (
        select source, sum(value) as v
        from rec
        group by 1
      ) t
    ), '{}'::jsonb),

    -- Top 10 ยา · จัดกลุ่มด้วย "ชื่อยาที่แช่ไว้ในแถว" ไม่ใช่ drug_id
    -- (ยาตัวเดียวกันถ้าเคยเปลี่ยนชื่อ จะแยกเป็นสองบรรทัด — ตรงกับมอคอัปที่ group ด้วย r.name)
    'topDrugs', coalesce((
      select jsonb_agg(jsonb_build_object('name', drug_name, 'v', v) order by v desc)
      from (
        select drug_name, sum(value) as v
        from rec
        where disposition = 'reuse'
        group by drug_name
        order by v desc
        limit 10
      ) t
    ), '[]'::jsonb)
  );
$$;

-- ── mr_history — แถวประวัติ + จำนวนรวม + ยอดรวม ในคำขอเดียว ──────────────────
-- p_q ค้นได้ทั้งชื่อยาและ HN · ใช้ position() แทน like เพื่อให้ % _ ในคำค้นเป็นตัวอักษรธรรมดา
-- total เอาไว้เทียบกับจำนวนแถวที่ส่งกลับ → รู้ว่าโดนตัดหรือยัง (มอคอัปมีป้ายบอกตอนเกิน)
create or replace function mr_history(p_q text, p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path = public
as $$
  with filtered as (
    select *
    from mr_return
    where (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
      and (
        p_q is null or btrim(p_q) = ''
        or position(lower(btrim(p_q)) in lower(drug_name)) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(hn, ''))) > 0
      )
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'saved', coalesce((select sum(unit_price * qty) from filtered where disposition = 'reuse'),   0),
    'lost',  coalesce((select sum(unit_price * qty) from filtered where disposition = 'destroy'), 0),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',          id,
        'date',        return_date,
        'drugId',      drug_id,
        'name',        drug_name,
        'unit',        unit,
        'price',       unit_price,
        'qty',         qty,
        'disposition', disposition,
        'source',      source,
        'hn',          hn
      ) order by return_date desc, id desc)
      from (
        select *
        from filtered
        order by return_date desc, id desc
        limit coalesce(p_limit, 60)
      ) t
    ), '[]'::jsonb)
  );
$$;
