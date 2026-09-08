-- ─────────────────────────────────────────────────────────────────────────────
--  018 · บันทึกการแก้ในหน้าล็อต ให้แสดงชื่อยาปัจจุบันจากคลัง
-- ─────────────────────────────────────────────────────────────────────────────
--
--  พี่กันเคาะ 8 ก.ย. 2569 (แชท ME-DRP)
--    "ชื่อยาควรเปลี่ยนนะ เพราะชื่อยาที่เปลี่ยนควรเป็นปัจจุบัน เพราะไม่งั้นมันไม่สวย
--     และการเปลี่ยนชื่อยา เราไม่ได้เปลี่ยนชนิดยาสักหน่อย เราอาจจะแค่ใส่บางคำเพิ่มแค่นั้น"
--
--  เว็บนี้ทำเรื่องนี้ไปแล้วทุกหน้า ผ่าน mr_drug_label() ที่ประกอบชื่อจากคลังปัจจุบัน
--  เหลือที่เดียวคือกล่อง "ประวัติการแก้" ท้ายหน้าล็อต ซึ่งยังอ่านชื่อที่จดไว้ตอนแก้
--
--  ทำไมถึงยังไม่ได้ — ตาราง mr_lot_audit ไม่มี drug_id จึงหาในคลังไม่ได้
--
--  🚨 ปลอดภัยกับโค้ดเก่า — คอลัมน์ใหม่ปล่อยว่างได้ และ mr_lot_log คืนชื่อช่องเดิม
--     โค้ดที่ยังไม่ได้อัปเดตจึงทำงานต่อได้ตามปกติระหว่างรอ deploy
--
--  ข้อมูลเดิม 4 แถว ณ วันรัน เป็นการแก้ระดับล็อตทั้งหมด (แหล่งที่มา · วันที่)
--  ไม่ผูกกับยาตัวไหน return_id กับ drug_name จึงว่างอยู่แล้วโดยการออกแบบ
--  → ไม่ต้องเติมย้อนหลัง

alter table mr_lot_audit add column if not exists drug_id integer;

comment on column mr_lot_audit.drug_id is
  'รหัสยาของแถวที่ถูกแก้ — เอาไว้ดึงชื่อปัจจุบันจากคลัง · ว่างได้เมื่อเป็นการแก้ระดับล็อต';

-- เผื่อกรณีที่แถวเก่ามี return_id แต่ยังไม่มี drug_id (ไม่มีในฐานตอนนี้ แต่กันไว้)
update mr_lot_audit a
   set drug_id = r.drug_id
  from mr_return r
 where a.return_id = r.id
   and a.drug_id is null
   and r.drug_id is not null;

-- อ่านบันทึกการแก้ — ชื่อยาใช้ของปัจจุบัน ตกกลับไปใช้ชื่อที่จดไว้เมื่อหาในคลังไม่เจอ
create or replace function public.mr_lot_log(p_lot text, p_limit integer default 200)
returns table(id bigint, return_id bigint, drug_name text, field text,
              old_value text, new_value text, changed_by text, changed_at timestamptz)
language sql
stable
as $function$
  select a.id, a.return_id,
         -- ยาถูกลบจากคลัง หรือแถวนี้ไม่ผูกกับยา → ได้ชื่อที่จดไว้ตอนแก้กลับไป
         mr_drug_label(d, a.drug_name) as drug_name,
         a.field, a.old_value, a.new_value, a.changed_by, a.changed_at
  from mr_lot_audit a
  left join drugs d on d.id = a.drug_id
  where a.lot_no = p_lot
  order by a.id desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$function$;
