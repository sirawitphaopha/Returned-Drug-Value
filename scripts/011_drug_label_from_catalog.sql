-- 011_drug_label_from_catalog.sql
-- ชื่อยาที่โชว์ ให้ดึงจากคลังยาเสมอ และแสดงเต็มยศเหมือนตอนค้นหา
--
-- ═══ พี่กันสั่งอะไรบ้าง (25 ส.ค. 2569) ═══
-- 1. "ปัญหาคือชื่อยา ตอนนี้เก็บและส่งไปเก็บยังไงเนี่ย เราอยากให้ชื่อเดียวมันลิงก์
--     ไปทุกอย่างในเว็บ แม้ชื่อจะเปลี่ยนไปก็ตาม เรามีระบบ id อยู่นี่นา"
-- 2. "ชื่อจัดเต็ม มียี่ห้อด้วยนะ ไม่งั้นบางตัวหลง มี ER IR ให้เหมือนกับตอนค้นหา
--     ตามรูปเลย และค่านี้แสดงทั้งเว็บ"
-- 3. "สีที่เราต้องการล่ะ สำหรับ warfarin ใส่วงเล็บสีด้วยสิ"
--
-- ═══ ปัญหาที่เจอจริง ═══
-- Warfarin 5 mg รหัส 497 ตัวเดียวกัน แต่ในฐานมีสองชื่อ
--   บันทึก 08:37 น. → "Warfarin 5 mg"
--   บันทึก 12:21 น. → "Warfarin 5 mg (tab)"
-- เพราะระหว่างนั้นสูตรชื่อถูกแก้
-- หน้าสรุปไม่กระทบเพราะจับกลุ่มด้วย drug_id อยู่แล้ว
-- แต่หน้าประวัติกับหน้าแก้ไขล็อตเอาชื่อที่แช่ไว้มาโชว์ตรง ๆ จึงเห็นสองชื่อ
--
-- ═══ วิธีแก้ ═══
-- แถวที่มี drug_id  → ประกอบชื่อจากคลังยาใหม่ทุกครั้งที่ดึงข้อมูล
-- แถวที่ไม่มี       → ใช้ชื่อที่แช่ไว้เหมือนเดิม (ยานอกบัญชี พิมพ์ชื่อเอง ไม่มีต้นทางให้ดึง)
--
-- 🚨 คอลัมน์ drug_name ยังเก็บไว้ทุกแถว ไม่ลบ ไม่แตะ
--    เป็นหลักฐานว่าคนกดบันทึกวันนั้นเห็นชื่ออะไรบนจอ ตอนตรวจย้อนหลังต้องตอบได้
--    ส่งออกไปคู่กันในชื่อ savedName
--
-- 🚨 ราคายังแช่ไว้ในแถวเหมือนเดิมทุกประการ ไฟล์นี้ไม่แตะ unit_price เลยสักบรรทัด
--    ชื่อคือ "ป้ายเรียก" ต้องตรงกับปัจจุบัน · ราคาคือ "มูลค่า ณ วันนั้น" ต้องคงที่ตลอดไป
--
-- 🚨 การจับกลุ่มสถิติยังใช้ drug_id เหมือนเดิม (กฎข้อ 3.14 ใน CLAUDE.md)
--    ตรวจแล้วหลังรัน: ยอด 6,041.50 บาท · 59 รายการ เท่าเดิมทุกบาท


-- ═══════════════════════════════════════════════════════════════════════════
-- 1) ฟังก์ชันกลาง — ประกอบชื่อยาให้ตรงกับ lib/drugName.js ฝั่งเว็บเป๊ะ
-- ═══════════════════════════════════════════════════════════════════════════
--
--   Morphine sulfate (MST) 10 mg tab (ER)
--   Morphine sulfate 20 mg cap (ER) (Kapanol)
--   Warfarin 5 mg tab (ชมพู)
--   Aspirin (ASA) 81 mg tab
--   Ampicillin + Sulbactam (2 + 1 g) injection      ← ยาผสมครอบวงเล็บความแรง
--
-- ลำดับ: ชื่อสามัญ (ตัวย่อ) ความแรง หน่วย เปอร์เซ็นต์ รูปแบบยา (ออกฤทธิ์) (ยี่ห้อ) (สีเม็ด)
-- 🚨 รูปแบบยาไม่ใส่วงเล็บ ที่เหลือใส่ — ตามภาพผลค้นหาที่พี่กันชี้ให้ดู
--
-- 🚨 แก้สูตรตรงนี้ ต้องแก้ lib/drugName.js ให้ตรงกันด้วยเสมอ
--    ไม่งั้นชื่อในผลค้นหากับชื่อในหน้าประวัติจะไม่เหมือนกัน
--
-- รับทั้งแถวจากตาราง drugs (composite type) แทนการส่งทีละช่อง
-- เพิ่มคอลัมน์ใหม่ในคลังยาแล้วแก้แค่ที่นี่ที่เดียว ไม่ต้องไล่แก้ทุกฟังก์ชันที่เรียก
--
-- immutable เพื่อให้ตัววางแผนคำสั่งแทนเนื้อฟังก์ชันลงไปในคำสั่งได้เลย
-- ไม่ต้องเรียกใหม่ทีละแถว (แถวเยอะ ๆ จะช้า)
drop function if exists mr_drug_label(text,text,text,text,text,text,text);

create or replace function mr_drug_label(d drugs, p_fallback text)
returns text
language sql
immutable
as $fn$
  select case
    -- ไม่มีต้นทางในคลัง (ยานอกบัญชี หรือยาถูกลบไปแล้ว) → ใช้ชื่อที่แช่ไว้
    when coalesce(btrim(d.generic), '') = '' then p_fallback
    else btrim(
      btrim(d.generic)
      -- ตัวย่อที่เภสัชกรเรียกกันจริง ติดชื่อสามัญ — Morphine sulfate (MST)
      || case when coalesce(btrim(d.abbrev), '') = '' then '' else ' (' || btrim(d.abbrev) || ')' end
      -- ความแรง · ยาผสม (มีเครื่องหมายบวก) ต้องครอบวงเล็บ
      -- ไม่งั้นได้ "Ampicillin + Sulbactam 2 + 1 g" ที่แยกไม่ออกว่าตรงไหนชื่อ ตรงไหนความแรง
      || case when coalesce(btrim(d.strength), '') = '' then ''
              when d.strength like '%+%'
                then ' (' || btrim(d.strength) || coalesce(' ' || nullif(btrim(d.unit), ''), '') || ')'
              else       ' ' || btrim(d.strength) || coalesce(' ' || nullif(btrim(d.unit), ''), '')
         end
      -- ความเข้มข้นเป็นเปอร์เซ็นต์ (ยาทา ยาหยอด)
      || case when coalesce(btrim(d.percent), '') = '' then '' else ' ' || btrim(d.percent) || '%' end
      -- รูปแบบยา — ไม่ใส่วงเล็บ ตามที่เห็นในผลค้นหา
      || case when coalesce(btrim(d.form), '') = '' then '' else ' ' || btrim(d.form) end
      -- รูปแบบการออกฤทธิ์ ER · IR · SR — ข้อมูลความปลอดภัย ห้ามซ่อน
      -- Morphine 10 mg ER ออกฤทธิ์ 12 ชม. · Morphine 10 mg ออกฤทธิ์ 4 ชม.
      || case when coalesce(btrim(d.release), '') = '' then '' else ' (' || btrim(d.release) || ')' end
      -- ชื่อการค้า — เภสัชกรจำ Kapanol ได้ก่อน Morphine sulfate 20 mg cap ER
      || case when coalesce(btrim(d.brand), '') = '' then '' else ' (' || btrim(d.brand) || ')' end
      -- สีเม็ดยาจริง — Warfarin 2 ส้ม · 3 น้ำเงิน · 5 ชมพู
      -- เภสัชกรกับคนไข้จำยาพวกนี้ด้วยสีมากกว่าตัวเลข
      || case when coalesce(btrim(d.pill_color), '') = '' then '' else ' (' || btrim(d.pill_color) || ')' end
    )
  end;
$fn$;

comment on function mr_drug_label(drugs, text) is
  'ประกอบชื่อยาที่โชว์จากคลังยา — ต้องตรงกับ lib/drugName.js ฝั่งเว็บเสมอ';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) mr_history — หน้าประวัติ
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function mr_history(
  p_q text, p_from date, p_to date, p_limit integer,
  p_trash boolean default false, p_lot text default null, p_offset integer default 0
) returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  with base as (
    select r.*, mr_drug_label(d, r.drug_name) as label
    from mr_return r left join drugs d on d.id = r.drug_id
  ),
  filtered as (
    select * from base
    where (case when coalesce(p_trash, false) then deleted_at is not null else deleted_at is null end)
      and (p_lot  is null or btrim(p_lot) = '' or lot_no = btrim(p_lot))
      and (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
      -- 🚨 ค้นทั้งชื่อใหม่และชื่อเก่า
      --    คนที่จำชื่อตอนบันทึกได้ ต้องหาเจอ ถึงชื่อในคลังจะเปลี่ยนไปแล้ว
      and (p_q is null or btrim(p_q) = ''
        or position(lower(btrim(p_q)) in lower(label)) > 0
        or position(lower(btrim(p_q)) in lower(drug_name)) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(hn, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(recorded_by, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(lot_no, ''))) > 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'saved', coalesce((select sum(unit_price * qty) from filtered where disposition = 'reuse'),   0),
    'lost',  coalesce((select sum(unit_price * qty) from filtered where disposition = 'destroy'), 0),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'date', return_date, 'drugId', drug_id,
        'name', label,             -- ชื่อล่าสุดจากคลัง
        'savedName', drug_name,    -- ชื่อ ณ วันบันทึก เผื่อวันหน้าอยากโชว์ให้ผู้ตรวจดู
        'unit', unit, 'price', unit_price, 'qty', qty,
        'disposition', disposition, 'source', source, 'hn', hn,
        'by', recorded_by, 'lot', lot_no, 'reason', destroy_reason,
        'deletedAt', deleted_at, 'priceFixedAt', price_fixed_at
      ) order by return_date desc, id desc)
      from (select * from filtered order by return_date desc, id desc
            limit coalesce(p_limit, 60) offset coalesce(p_offset, 0)) t
    ), '[]'::jsonb)
  );
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) mr_lot_rows — แถวในล็อต (หน้าแก้ไขล็อต · ใบสรุปที่พิมพ์ออกมา)
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️ ต้อง drop ก่อนเพราะเพิ่มคอลัมน์ saved_name เข้าไปในผลลัพธ์
--    (postgres ไม่ยอมให้ replace ฟังก์ชันที่เปลี่ยนรูปตารางผลลัพธ์)
drop function if exists mr_lot_rows(text);

create function mr_lot_rows(p_lot text)
returns table(
  id bigint, drug_id integer, drug_name text, saved_name text, unit text,
  unit_price numeric, qty numeric, disposition text, reason text,
  source text, hn text, return_date date, recorded_by text
)
language sql
stable
as $fn$
  select r.id, r.drug_id,
         mr_drug_label(d, r.drug_name) as drug_name,
         r.drug_name as saved_name,
         r.unit, r.unit_price, r.qty, r.disposition, r.destroy_reason,
         r.source, r.hn, r.return_date, r.recorded_by
  from mr_return r left join drugs d on d.id = r.drug_id
  where r.lot_no = p_lot and r.deleted_at is null
  order by r.id;
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) mr_summary — หน้าสรุป (Top 10 ตามมูลค่า)
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function mr_summary(p_from date, p_to date)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  with rec as (
    select r.drug_id, r.drug_name, r.source, r.disposition, r.return_date,
           r.qty, r.destroy_reason, r.unit_price * r.qty as value,
           -- กุญแจจับกลุ่ม: มีรหัสใช้รหัส ไม่มีรหัสใช้ชื่อ
           case when r.drug_id is null then 'txt:' || r.drug_name
                else 'id:' || r.drug_id::text end as gkey,
           mr_drug_label(d, r.drug_name) as label
    from mr_return r left join drugs d on d.id = r.drug_id
    where r.deleted_at is null
      and (p_from is null or r.return_date >= p_from)
      and (p_to   is null or r.return_date <= p_to)
  ),
  named as (select gkey, disposition, value, label, drug_id from rec)
  select jsonb_build_object(
    'saved',   coalesce((select sum(value) from rec where disposition = 'reuse'),   0),
    'lost',    coalesce((select sum(value) from rec where disposition = 'destroy'), 0),
    'records', (select count(*) from rec),
    'qty',     coalesce((select sum(qty) from rec), 0),
    -- นับชนิดยาด้วยกุญแจจับกลุ่มเหมือนกัน ไม่งั้นเปลี่ยนชื่อแล้วเลขเด้ง
    'drugCount', (select count(distinct gkey) from rec where disposition = 'reuse'),
    'byMonth', coalesce((select jsonb_object_agg(m, v) from (
        select to_char(return_date, 'YYYY-MM') as m, sum(value) as v
        from rec where disposition = 'reuse' group by 1) t), '{}'::jsonb),
    'bySrc', coalesce((select jsonb_object_agg(source, v) from (
        select source, sum(value) as v from rec group by 1) t), '{}'::jsonb),
    'topDrugs', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'v', v) order by v desc)
      from (select max(label) as name, sum(value) as v from named
            where disposition = 'reuse' group by gkey
            order by sum(value) desc limit 10) t), '[]'::jsonb),
    'byReason', coalesce((select jsonb_object_agg(coalesce(destroy_reason, 'ไม่ระบุ'), v) from (
        select destroy_reason, sum(value) as v
        from rec where disposition = 'destroy' group by 1) t), '{}'::jsonb),
    'zeroPriced', (select count(*) from mr_return
                   where deleted_at is null and unit_price = 0
                     and (p_from is null or return_date >= p_from)
                     and (p_to   is null or return_date <= p_to))
  );
$fn$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5) mr_top_returned — ยาที่ถูกคืนบ่อยที่สุด
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function mr_top_returned(p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  with rec as (
    select r.drug_id, r.drug_name, r.qty, r.unit, r.unit_price * r.qty as value,
           case when r.drug_id is null then 'txt:' || r.drug_name
                else 'id:' || r.drug_id::text end as gkey,
           mr_drug_label(d, r.drug_name) as label
    from mr_return r left join drugs d on d.id = r.drug_id
    where r.deleted_at is null
      and (p_from is null or r.return_date >= p_from)
      and (p_to   is null or r.return_date <= p_to)
  ),
  named as (select gkey, qty, unit, value, label, drug_id from rec)
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', name, 'times', times, 'qty', total_qty, 'value', value, 'unit', unit
  ) order by times desc, value desc), '[]'::jsonb)
  from (select max(label) as name, max(unit) as unit, count(*) as times,
               sum(qty) as total_qty, sum(value) as value
        from named group by gkey
        order by count(*) desc, sum(value) desc
        limit coalesce(p_limit, 10)) t;
$fn$;
