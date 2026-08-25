-- 012_price_fix.sql
-- ระบบแก้ราคาย้อนหลังในรายการที่บันทึกไปแล้ว
--
-- ═══ ที่มา ═══
-- พี่กันเจอเคสจริง 25 ส.ค. 2569:
--   MTV tab ถูกใส่ราคา 20 บาท (แคลร์จับคู่ราคาผิด เอาราคายาน้ำทั้งขวดมาใส่เป็นราคาต่อเม็ด)
--   บันทึกไปแล้ว 30 เม็ด = 600 บาท ทั้งที่ควรเป็น 15 บาท
--   ยอดรวมทั้งปีเพี้ยนไป 585 บาท = 8.8% จากแถวเดียว
--   เดิมไม่มีทางแก้เลย เหลือทางเดียวคือลบทิ้งแล้วกรอกใหม่ ซึ่งเสียร่องรอยว่าใครรับคืนวันไหน
--
-- ═══ กฎแช่ราคายังอยู่ครบ ═══
-- นี่คือ "ประตูเดียวที่มีกุญแจและมีสมุดลงชื่อ"
--
--   ราคาเปลี่ยนตามเวลา (ยาขึ้นราคากลางปี)  → ห้ามแตะ ตัวเลขย้อนหลังต้องคงที่
--   ราคาผิดตั้งแต่แรก (กรอกผิด/จับคู่ผิด)   → ต้องแก้ได้ เพราะข้อมูลผิดมาตลอด
--
-- 🚨 ระบบไม่แก้ให้เอง — หน้าจอถามก่อนเสมอ พร้อมโชว์ว่ากระทบกี่รายการ
--    มูลค่าเปลี่ยนจากเท่าไรเป็นเท่าไร แล้วให้เภสัชกรเป็นคนตัดสิน
-- 🚨 บังคับกรอกเหตุผลกับชื่อผู้แก้ ถึงจะกดยืนยันได้
--
-- หน้าจอที่ใช้: หน้าคลังยา → แก้ราคายา → บันทึก → ป๊อปถามขึ้นเองถ้ามีของเก่าที่ใช้ราคาอื่น
-- หลังบ้าน: app/api/price-fix/route.js

-- ── ตารางบันทึกร่องรอย ──────────────────────────────────────────────────────
-- แยกจาก mr_lot_audit เพราะคนละเรื่องกัน — อันนั้นผูกกับล็อต อันนี้ผูกกับยา
create table if not exists mr_price_fix_log (
  id          bigint generated always as identity primary key,
  drug_id     integer not null,
  drug_name   text,                      -- ชื่อ ณ เวลาที่แก้ เผื่อยาถูกลบทีหลัง
  old_price   numeric(12,4) not null,
  new_price   numeric(12,4) not null check (new_price >= 0),
  rows_fixed  integer not null,          -- แก้ไปกี่แถว
  value_before numeric(14,2) not null,   -- มูลค่ารวมก่อนแก้
  value_after  numeric(14,2) not null,   -- มูลค่ารวมหลังแก้
  reason      text not null,             -- บังคับกรอก ตอบผู้ตรวจได้ว่าทำไมถึงแก้
  fixed_by    text not null,
  fixed_at    timestamptz not null default now()
);
create index if not exists mr_price_fix_log_drug_idx on mr_price_fix_log (drug_id, fixed_at desc);
alter table mr_price_fix_log enable row level security;

-- ── ดูก่อนว่าจะกระทบอะไรบ้าง ────────────────────────────────────────────────
-- 🚨 หน้าจอต้องเรียกอันนี้ก่อนเสมอ ให้เห็นตัวเลขก่อนตัดสินใจ ห้ามแก้เงียบ ๆ
create or replace function mr_price_fix_preview(p_drug_id integer, p_new_price numeric)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  select jsonb_build_object(
    'rows',        count(*),
    'qty',         coalesce(sum(qty), 0),
    'oldPrices',   coalesce(jsonb_agg(distinct unit_price), '[]'::jsonb),
    'valueBefore', coalesce(sum(unit_price * qty), 0),
    'valueAfter',  coalesce(sum(p_new_price * qty), 0),
    'firstDate',   min(return_date),
    'lastDate',    max(return_date),
    'lots',        coalesce(jsonb_agg(distinct lot_no) filter (where lot_no is not null), '[]'::jsonb)
  )
  from mr_return
  where deleted_at is null
    and drug_id = p_drug_id
    and unit_price <> p_new_price;
$fn$;

-- ── แก้จริง ─────────────────────────────────────────────────────────────────
-- 🚨 เขียนบันทึกร่องรอย "หลัง" แก้สำเร็จเท่านั้น ถ้าเขียนก่อนแล้วแก้ล้ม ประวัติจะโกหก
-- 🚨 บังคับมีเหตุผลกับชื่อคนแก้ ไม่งั้นตอบผู้ตรวจไม่ได้ว่าใครเปลี่ยนตัวเลขและทำไม
create or replace function mr_price_fix(
  p_drug_id integer, p_new_price numeric, p_by text, p_reason text
) returns jsonb
language plpgsql
set search_path to 'public'
as $fn$
declare
  v_before numeric := 0;
  v_after  numeric := 0;
  v_rows   integer := 0;
  v_old    numeric := 0;
  v_name   text;
begin
  if p_new_price is null or p_new_price < 0 then
    return jsonb_build_object('error', 'ราคาไม่ถูกต้อง');
  end if;
  if coalesce(btrim(p_by), '') = '' then
    return jsonb_build_object('error', 'ต้องระบุชื่อผู้แก้ไข');
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('error', 'ต้องระบุเหตุผลที่แก้');
  end if;

  select count(*), coalesce(sum(unit_price * qty), 0), coalesce(sum(p_new_price * qty), 0),
         coalesce(max(unit_price), 0)
    into v_rows, v_before, v_after, v_old
  from mr_return
  where deleted_at is null and drug_id = p_drug_id and unit_price <> p_new_price;

  if v_rows = 0 then
    return jsonb_build_object('ok', true, 'rows', 0, 'note', 'ไม่มีรายการที่ต้องแก้');
  end if;

  select generic into v_name from drugs where id = p_drug_id;

  update mr_return
  set unit_price     = p_new_price,
      price_fixed_at = now(),
      price_fixed_by = btrim(p_by) || ' · แก้ราคาย้อนหลัง: ' || btrim(p_reason)
  where deleted_at is null and drug_id = p_drug_id and unit_price <> p_new_price;

  insert into mr_price_fix_log
    (drug_id, drug_name, old_price, new_price, rows_fixed, value_before, value_after, reason, fixed_by)
  values
    (p_drug_id, v_name, v_old, p_new_price, v_rows, v_before, v_after, btrim(p_reason), btrim(p_by));

  return jsonb_build_object('ok', true, 'rows', v_rows,
                            'valueBefore', v_before, 'valueAfter', v_after);
end;
$fn$;

-- ── ประวัติการแก้ราคาย้อนหลังของยาตัวหนึ่ง ─────────────────────────────────
-- ยังไม่มีหน้าจอเรียกใช้ เตรียมไว้สำหรับหน้าประวัติการแก้ราคาในอนาคต
create or replace function mr_price_fix_history(p_drug_id integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'at', fixed_at, 'by', fixed_by, 'reason', reason,
    'oldPrice', old_price, 'newPrice', new_price, 'rows', rows_fixed,
    'valueBefore', value_before, 'valueAfter', value_after
  ) order by fixed_at desc), '[]'::jsonb)
  from mr_price_fix_log where drug_id = p_drug_id;
$fn$;
