-- ══════════════════════════════════════════════════════════════════════════
--  จับกลุ่มสถิติด้วย "รหัสยา" ไม่ใช่ "ชื่อยา"
-- ══════════════════════════════════════════════════════════════════════════
--
-- 🚨 ปัญหาเดิม: mr_summary กับ mr_top_returned จับกลุ่มด้วย drug_name
--    ชื่อยาใน mr_return เป็น snapshot ณ วันบันทึก (ตั้งใจให้เป็นแบบนั้น)
--    พอมีคนแก้ชื่อยาในคลัง เช่นเติม (ER) หรือย้ายตัวย่อออกจากชื่อ
--    ยาตัวเดียวกันจะถูกนับเป็นสองตัวในหน้าสรุป
--
--      Morphine sulfate (MST) 10 mg   คืน 5 ครั้ง   ← ชื่อเก่า
--      Morphine sulfate 10 mg ER      คืน 3 ครั้ง   ← ชื่อใหม่ ยาตัวเดียวกัน
--
--    ตัวเลข KPI ที่รายงานผู้บริหารไปแล้วจะเปลี่ยนย้อนหลังโดยไม่มีใครรู้
--
-- ✅ กติกาใหม่ (ยกมาจาก ME-DRP ที่แก้เรื่องนี้ไปแล้วตั้งแต่ v0.9.10.2)
--      มีรหัสยา  → จับกลุ่มด้วยรหัส  · ป้ายที่โชว์ใช้ "ชื่อล่าสุด" จากคลัง
--      ไม่มีรหัส → จับกลุ่มด้วยชื่อ  (ยานอกบัญชี รพ. ที่พิมพ์ชื่อเอง)
--
-- ⚠️ ทำก่อนที่จะมีข้อมูลจริง — ตอนรัน mr_return ยังว่างเปล่า
--    ถ้ารอจนใช้งานจริงแล้วค่อยแก้ ตัวเลขย้อนหลังจะขยับ

-- ── 1. mr_summary — Top 10 ยาตามมูลค่า ───────────────────────────────────
create or replace function mr_summary(p_from date, p_to date)
returns jsonb
language sql
stable
set search_path to 'public'
as $$
  with rec as (
    select r.drug_id, r.drug_name, r.source, r.disposition, r.return_date,
           r.qty, r.destroy_reason, r.unit_price * r.qty as value,
           -- กุญแจจับกลุ่ม: มีรหัสใช้รหัส ไม่มีรหัสใช้ชื่อ
           case when r.drug_id is null then 'txt:' || r.drug_name
                else 'id:' || r.drug_id::text end as gkey,
           -- ป้ายที่โชว์: ชื่อล่าสุดจากคลัง ถ้าหาไม่เจอใช้ชื่อที่แช่ไว้
           coalesce(d.generic, r.drug_name) as latest_generic,
           d.strength, d.unit as d_unit, d.percent, d.release
    from mr_return r
    left join drugs d on d.id = r.drug_id
    where r.deleted_at is null
      and (p_from is null or r.return_date >= p_from)
      and (p_to   is null or r.return_date <= p_to)
  ),
  -- ประกอบชื่อล่าสุดให้ตรงกับที่ lib/drugName.js ทำฝั่งเว็บ
  -- generic + ความแรง(วงเล็บถ้าเป็นยาผสม) + % + รูปแบบการออกฤทธิ์
  named as (
    select gkey, disposition, value,
           case when drug_id is null then drug_name
                else trim(
                  latest_generic
                  || case when coalesce(strength,'') = '' then ''
                          when strength like '%+%' then ' (' || strength || coalesce(' ' || d_unit, '') || ')'
                          else ' ' || strength || coalesce(' ' || d_unit, '') end
                  || case when coalesce(percent,'') = '' then '' else ' ' || percent || '%' end
                  || case when coalesce(release,'') = '' then '' else ' ' || release end
                ) end as label,
           drug_id
    from rec
  )
  select jsonb_build_object(
    'saved',   coalesce((select sum(value) from rec where disposition = 'reuse'),   0),
    'lost',    coalesce((select sum(value) from rec where disposition = 'destroy'), 0),
    'records', (select count(*) from rec),
    'qty',     coalesce((select sum(qty) from rec), 0),
    -- นับชนิดยาด้วยกุญแจจับกลุ่มเหมือนกัน ไม่งั้นเปลี่ยนชื่อแล้วเลขเด้ง
    'drugCount', (select count(distinct gkey) from rec where disposition = 'reuse'),
    'byMonth', coalesce((
      select jsonb_object_agg(m, v) from (
        select to_char(return_date, 'YYYY-MM') as m, sum(value) as v
        from rec where disposition = 'reuse' group by 1) t), '{}'::jsonb),
    'bySrc', coalesce((
      select jsonb_object_agg(source, v) from (
        select source, sum(value) as v from rec group by 1) t), '{}'::jsonb),
    'topDrugs', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'v', v) order by v desc)
      from (
        select max(label) as name, sum(value) as v
        from named where disposition = 'reuse'
        group by gkey order by sum(value) desc limit 10
      ) t), '[]'::jsonb),
    'byReason', coalesce((
      select jsonb_object_agg(coalesce(destroy_reason, 'ไม่ระบุ'), v) from (
        select destroy_reason, sum(value) as v
        from rec where disposition = 'destroy' group by 1) t), '{}'::jsonb),
    'zeroPriced', (select count(*) from mr_return
                   where deleted_at is null and unit_price = 0
                     and (p_from is null or return_date >= p_from)
                     and (p_to   is null or return_date <= p_to))
  );
$$;

-- ── 2. mr_top_returned — ยาที่ถูกคืนบ่อยที่สุด ────────────────────────────
create or replace function mr_top_returned(p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $$
  with rec as (
    select r.drug_id, r.drug_name, r.qty, r.unit, r.unit_price * r.qty as value,
           case when r.drug_id is null then 'txt:' || r.drug_name
                else 'id:' || r.drug_id::text end as gkey,
           coalesce(d.generic, r.drug_name) as latest_generic,
           d.strength, d.unit as d_unit, d.percent, d.release
    from mr_return r
    left join drugs d on d.id = r.drug_id
    where r.deleted_at is null
      and (p_from is null or r.return_date >= p_from)
      and (p_to   is null or r.return_date <= p_to)
  ),
  named as (
    select gkey, qty, unit, value,
           case when drug_id is null then drug_name
                else trim(
                  latest_generic
                  || case when coalesce(strength,'') = '' then ''
                          when strength like '%+%' then ' (' || strength || coalesce(' ' || d_unit, '') || ')'
                          else ' ' || strength || coalesce(' ' || d_unit, '') end
                  || case when coalesce(percent,'') = '' then '' else ' ' || percent || '%' end
                  || case when coalesce(release,'') = '' then '' else ' ' || release end
                ) end as label,
           drug_id
    from rec
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', name, 'times', times, 'qty', total_qty, 'value', value, 'unit', unit
  ) order by times desc, value desc), '[]'::jsonb)
  from (
    select max(label)          as name,
           max(unit)           as unit,
           count(*)            as times,
           sum(qty)            as total_qty,
           sum(value)          as value
    from named
    group by gkey
    order by count(*) desc, sum(value) desc
    limit coalesce(p_limit, 10)
  ) t;
$$;
