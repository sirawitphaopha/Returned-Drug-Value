-- ══════════════════════════════════════════════════════════════════════════
--  mr_hot_drug_ids — รหัสยาที่ถูกคืนบ่อยที่สุด (ไว้ให้ช่องค้นหาดันขึ้นก่อน)
-- ══════════════════════════════════════════════════════════════════════════
--
-- ต่างจาก mr_top_returned ที่มีอยู่แล้วตรงที่
--   · mr_top_returned  group by drug_name  → ใช้โชว์ในหน้าสรุป (ต้องการชื่อ)
--   · ตัวนี้           group by drug_id    → ใช้จัดอันดับผลค้นหา (ต้องการรหัส)
--
-- ทำไมต้องใช้รหัสไม่ใช่ชื่อ: ชื่อยาใน mr_return เป็น snapshot ณ วันบันทึก
-- ถ้ายาเปลี่ยนชื่อในคลัง ชื่อเก่ากับใหม่จะนับแยกกัน แต่รหัสยังเป็นตัวเดียวกันเสมอ
--
-- ยานอกบัญชี รพ. (drug_id เป็น null) ไม่นับ เพราะไม่มีรหัสให้จับคู่กับคลัง

create or replace function mr_hot_drug_ids(p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $$
  select coalesce(jsonb_agg(drug_id order by times desc), '[]'::jsonb)
  from (
    select drug_id, count(*) as times
    from mr_return
    where deleted_at is null
      and drug_id is not null
      and (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
    group by drug_id
    order by count(*) desc
    limit coalesce(p_limit, 20)
  ) t;
$$;
