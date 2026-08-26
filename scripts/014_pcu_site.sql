-- ═══════════════════════════════════════════════════════════════════════════
-- 014 — ยาคืนจาก รพ.สต. ต้องรู้ว่า "แห่งไหน"
-- ═══════════════════════════════════════════════════════════════════════════
--
-- พี่กันสั่ง 26 ส.ค. 2569:
--   "ตอนที่เลือกติ๊กแหล่งที่มา แล้วลง รพ.สต. ให้มีดรอปดาวน์เลือกได้เพิ่ม"
--   "ถ้าได้ รพ.สต. มา ก็ทำให้ตรงนี้มันแก้ รพ.สต. ได้ด้วยนะ ให้แก้ย้อนหลังได้"
--
-- ปัญหาเดิม: แหล่งที่มา 'pcu' บอกได้แค่ว่า "มาจาก รพ.สต." แต่อำเภอปรางค์กู่
-- มี รพ.สต. หลายแห่ง · ยาที่คืนมาทั้งหมดถูกเหมารวมเป็นก้อนเดียว
-- เวลาจะตอบว่าแห่งไหนคืนยาเยอะสุด หรือจะส่งใบสรุปกลับไปให้ รพ.สต. ต้นทาง
-- ก็ทำไม่ได้เลย เพราะข้อมูลไม่เคยถูกเก็บไว้ตั้งแต่ต้น
--
-- 🚨 รายชื่อ รพ.สต. เก็บใน "ฐานข้อมูล" ไม่ฝังในโค้ด (กฎเดียวกับสีเม็ดยา ข้อ 3.33)
--    เปิด รพ.สต. ใหม่ หรือเปลี่ยนชื่อ = แก้ในหน้าตั้งค่า ไม่ต้องแก้โค้ดแล้วขึ้นเว็บใหม่
--
-- 🚨 ไม่ผูก foreign key กับรายชื่อโดยตั้งใจ — เก็บเป็น snapshot ของชื่อ ณ วันบันทึก
--    เหมือน drug_name และ recorded_by · รพ.สต. เปลี่ยนชื่อวันหน้า
--    รายการเก่าต้องยังอ่านออกว่าตอนนั้นเขียนว่าอะไร (กฎแช่ข้อมูล)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) คอลัมน์ใหม่
-- ═══════════════════════════════════════════════════════════════════════════
-- ว่างได้เสมอ · มีค่าเฉพาะแถวที่ source = 'pcu' เท่านั้น
alter table mr_return  add column if not exists pcu_site text;

-- รายชื่อ รพ.สต. ที่ให้เลือก — โครงเดียวกับ staff (รายชื่อผู้บันทึก)
alter table mr_setting add column if not exists pcu_sites jsonb not null default '[]'::jsonb;

-- ค้นหาตามชื่อ รพ.สต. ได้เร็ว (หน้าประวัติค้นด้วยชื่อได้)
create index if not exists mr_return_pcu_site_idx on mr_return (pcu_site)
  where pcu_site is not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.5) เก็บกวาดซากฟังก์ชันเก่าที่ทับถมกันมา
-- ═══════════════════════════════════════════════════════════════════════════
-- 🚨 เจอตอนทำข้อนี้: `mr_history` มีอยู่ในฐาน **4 ตัวพร้อมกัน** เพราะเคยเพิ่ม
--    พารามิเตอร์ทีละตัว (002 → 004 → 005 → 011) แล้ว postgres ถือว่าเป็นคนละฟังก์ชัน
--    ตัวเก่าไม่เคยถูกลบ ยังนั่งรออยู่ในฐานเงียบ ๆ ทั้งหมด
--
--    ตอนนี้ยังไม่พังเพราะ /api/returns ส่งครบ 7 ช่องเสมอ จึงไปโดนตัวใหม่ทุกครั้ง
--    แต่วันไหนมีคนเรียกโดยไม่ส่ง p_offset จะไปโดนตัวเก่าที่ไม่รู้จัก pcu_site
--    แล้วได้ข้อมูลชุดเก่ากลับมาแบบไม่มีอะไรเตือนเลยสักอย่าง
--
--    ลบได้ปลอดภัย เพราะไม่มีโค้ดไหนเรียกแบบไม่ครบช่อง (ตรวจแล้วทั้งโปรเจกต์)
drop function if exists mr_history(text,date,date,integer);
drop function if exists mr_history(text,date,date,integer,boolean);
drop function if exists mr_history(text,date,date,integer,boolean,text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) mr_history — คืนชื่อ รพ.สต. ออกไปด้วย และค้นเจอด้วยชื่อ รพ.สต.
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
        or position(lower(btrim(p_q)) in lower(coalesce(lot_no, ''))) > 0
        -- พิมพ์ชื่อ รพ.สต. แล้วต้องเจอรายการที่คืนมาจากที่นั่น
        or position(lower(btrim(p_q)) in lower(coalesce(pcu_site, ''))) > 0)
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
        'pcuSite', pcu_site,       -- ชื่อ รพ.สต. ต้นทาง (ว่างถ้าไม่ได้มาจาก รพ.สต.)
        'by', recorded_by, 'lot', lot_no, 'reason', destroy_reason,
        'deletedAt', deleted_at, 'priceFixedAt', price_fixed_at
      ) order by return_date desc, id desc)
      from (select * from filtered order by return_date desc, id desc
            limit coalesce(p_limit, 60) offset coalesce(p_offset, 0)) t
    ), '[]'::jsonb)
  );
$fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) mr_lot_rows — หน้าแก้ไขล็อตต้องรู้ว่าล็อตนี้มาจาก รพ.สต. ไหน
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️ ต้อง drop ก่อน เพราะเพิ่มคอลัมน์เข้าไปในผลลัพธ์
--    (postgres ไม่ยอมให้ replace ฟังก์ชันที่เปลี่ยนรูปตารางผลลัพธ์)
drop function if exists mr_lot_rows(text);

create function mr_lot_rows(p_lot text)
returns table(
  id bigint, drug_id integer, drug_name text, saved_name text, unit text,
  unit_price numeric, qty numeric, disposition text, reason text,
  source text, pcu_site text, hn text, return_date date, recorded_by text
)
language sql
stable
as $fn$
  select r.id, r.drug_id,
         mr_drug_label(d, r.drug_name) as drug_name,
         r.drug_name as saved_name,
         r.unit, r.unit_price, r.qty, r.disposition, r.destroy_reason,
         r.source, r.pcu_site, r.hn, r.return_date, r.recorded_by
  from mr_return r left join drugs d on d.id = r.drug_id
  where r.lot_no = p_lot and r.deleted_at is null
  order by r.id;
$fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) mr_lots — หน้ารายการ Lot โชว์ชื่อ รพ.สต. ได้เลยไม่ต้องเปิดเข้าไปดู
-- ═══════════════════════════════════════════════════════════════════════════
-- 🚨 ยังห้ามรวมจำนวนข้ามหน่วยนับ (กฎข้อ 3.4) — total_qty ส่งไปแต่หน้าจอไม่เอามาโชว์
create or replace function mr_lots(p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'lot', lot_no, 'date', lot_date, 'by', recorded_by,
    'src', src, 'pcuSite', pcu_site,
    'items', items, 'qty', total_qty, 'saved', saved, 'lost', lost
  ) order by lot_date desc, lot_no desc), '[]'::jsonb)
  from (
    select
      lot_no,
      max(return_date) as lot_date,
      max(recorded_by) as recorded_by,
      max(source)      as src,
      max(pcu_site)    as pcu_site,
      count(*)         as items,
      sum(qty)         as total_qty,
      coalesce(sum(unit_price * qty) filter (where disposition = 'reuse'),   0) as saved,
      coalesce(sum(unit_price * qty) filter (where disposition = 'destroy'), 0) as lost
    from mr_return
    where deleted_at is null
      and lot_no is not null
      and (p_from is null or return_date >= p_from)
      and (p_to   is null or return_date <= p_to)
    group by lot_no
    order by max(return_date) desc, lot_no desc
    limit coalesce(p_limit, 200)
  ) t;
$fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) ตรวจว่าเรียบร้อย
-- ═══════════════════════════════════════════════════════════════════════════
-- select column_name from information_schema.columns
--  where table_name = 'mr_return' and column_name = 'pcu_site';
-- select pcu_sites from mr_setting where id = 1;
