-- ============================================================================
-- 005_functions_v2.sql — ฟังก์ชันรุ่นที่ 2 (แทนที่ 002 ทั้งหมด)
--
-- ต่างจาก 002 ตรงไหน
--   1. ทุกฟังก์ชันกรอง deleted_at is null — ของที่อยู่ในถังขยะต้องไม่นับใน KPI
--   2. mr_history รับ p_trash เพิ่ม → เปิดดูถังขยะได้ด้วยฟังก์ชันเดียวกัน
--   3. mr_history ค้นชื่อคนบันทึกได้ด้วย และส่ง by / deletedAt / priceFixedAt กลับมา
--   4. mr_summary ส่ง zeroPriced = จำนวนแถวที่มูลค่ายังเป็น 0 (ไว้ขึ้นแถบเตือน)
--   5. เพิ่ม mr_zero_price_count + mr_backfill_price สำหรับ "ตีราคาย้อนหลัง"
--
-- ⚠️ กติกาการนับยังต้องตรงมอคอัปเป๊ะเหมือนเดิม
--    byDrug / byMonth → เฉพาะ reuse · bySrc → ทั้ง reuse และ destroy
--    มูลค่าของแถว = unit_price ที่แช่ไว้ในแถว × qty — ห้าม join เอาราคาปัจจุบันมาคูณ
-- ============================================================================

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
    where deleted_at is null
      and (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
  )
  select jsonb_build_object(
    'saved',   coalesce((select sum(value) from rec where disposition = 'reuse'),   0),
    'lost',    coalesce((select sum(value) from rec where disposition = 'destroy'), 0),
    'records', (select count(*) from rec),
    'qty',     coalesce((select sum(qty) from rec), 0),
    'drugCount', (select count(distinct drug_name) from rec where disposition = 'reuse'),
    'byMonth', coalesce((
      select jsonb_object_agg(m, v)
      from (
        select to_char(return_date, 'YYYY-MM') as m, sum(value) as v
        from rec where disposition = 'reuse' group by 1
      ) t
    ), '{}'::jsonb),
    'bySrc', coalesce((
      select jsonb_object_agg(source, v)
      from (select source, sum(value) as v from rec group by 1) t
    ), '{}'::jsonb),
    'topDrugs', coalesce((
      select jsonb_agg(jsonb_build_object('name', drug_name, 'v', v) order by v desc)
      from (
        select drug_name, sum(value) as v
        from rec where disposition = 'reuse'
        group by drug_name order by v desc limit 10
      ) t
    ), '[]'::jsonb),
    -- แถวที่บันทึกไปแล้วแต่มูลค่ายังเป็น 0 (บันทึกตอนยังไม่ได้ใส่ราคา)
    'zeroPriced', (select count(*) from mr_return
                   where deleted_at is null
                     and unit_price = 0
                     and (p_from is null or return_date >= p_from)
                     and (p_to   is null or return_date <= p_to))
  );
$$;

-- p_trash = true → ดูเฉพาะของที่อยู่ในถังขยะ · false/null → ดูเฉพาะของที่ยังไม่ถูกลบ
create or replace function mr_history(p_q text, p_from date, p_to date, p_limit integer, p_trash boolean default false)
returns jsonb
language sql
stable
set search_path = public
as $$
  with filtered as (
    select *
    from mr_return
    where (case when coalesce(p_trash, false) then deleted_at is not null else deleted_at is null end)
      and (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
      and (
        p_q is null or btrim(p_q) = ''
        or position(lower(btrim(p_q)) in lower(drug_name)) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(hn, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(recorded_by, ''))) > 0
      )
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'saved', coalesce((select sum(unit_price * qty) from filtered where disposition = 'reuse'),   0),
    'lost',  coalesce((select sum(unit_price * qty) from filtered where disposition = 'destroy'), 0),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'date', return_date, 'drugId', drug_id, 'name', drug_name,
        'unit', unit, 'price', unit_price, 'qty', qty,
        'disposition', disposition, 'source', source, 'hn', hn,
        'by', recorded_by, 'deletedAt', deleted_at, 'priceFixedAt', price_fixed_at
      ) order by return_date desc, id desc)
      from (
        select * from filtered
        order by return_date desc, id desc
        limit coalesce(p_limit, 60)
      ) t
    ), '[]'::jsonb)
  );
$$;

-- ── ตีราคาย้อนหลัง ───────────────────────────────────────────────────────────
-- นับก่อนว่ายาแต่ละตัวมีแถวเก่าที่ยังไม่มีมูลค่ากี่แถว (ไว้ถามผู้ใช้ก่อนลงมือ)
create or replace function mr_zero_price_count(p_drug_ids integer[])
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_object_agg(drug_id::text, n), '{}'::jsonb)
  from (
    select drug_id, count(*) as n
    from mr_return
    where deleted_at is null and unit_price = 0 and drug_id = any(p_drug_ids)
    group by drug_id
  ) t;
$$;

-- 🚨 เติมเฉพาะแถวที่ราคายังเป็น 0 เท่านั้น ห้ามเขียนทับแถวที่มีราคาอยู่แล้วเด็ดขาด
--    (เป็นการเติมของที่ยังว่าง ไม่ใช่แก้ของเก่า จึงไม่ขัดกฎแช่ราคา)
--    price_fixed_at / price_fixed_by เก็บไว้เป็นหลักฐานว่าแถวไหนถูกตีราคาย้อนหลัง
-- p_items = [{"drugId":123,"price":12.5}, ...]
create or replace function mr_backfill_price(p_items jsonb, p_by text)
returns jsonb
language plpgsql
volatile
set search_path = public
as $$
declare
  v_total integer := 0;
  v_rows  integer;
  it      jsonb;
begin
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    update mr_return
    set unit_price     = (it->>'price')::numeric,
        price_fixed_at = now(),
        price_fixed_by = nullif(btrim(coalesce(p_by, '')), '')
    where deleted_at is null
      and unit_price = 0
      and drug_id = (it->>'drugId')::integer
      and (it->>'price')::numeric > 0;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
  end loop;

  return jsonb_build_object('updated', v_total);
end;
$$;
