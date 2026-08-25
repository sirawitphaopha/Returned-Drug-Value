-- 009 · เพิ่ม "ห้องยา IPD" เป็นแหล่งที่มาตัวที่ 6 (พี่กันสั่ง 25 ส.ค. 2569)
--
-- ทำไมต้องแก้ฐานด้วย ไม่ใช่แค่โค้ด:
--   คอลัมน์ source มี check constraint คุมค่าไว้ 5 ตัว ถ้าเพิ่มแค่ใน lib/format.js
--   ช่องเลือกจะโผล่ตัวใหม่จริง แต่พอกดบันทึกจะโดนฐานตีกลับ "ค่าไม่ถูกต้อง" ทันที
--
-- 🚨 constraint ตัวเดิมต้อง drop ก่อน แล้วค่อยสร้างใหม่ — แก้ในที่เดิมไม่ได้
-- ⚠️ ไม่กระทบข้อมูลเก่าเลยสักแถว เพราะเป็นการ "ขยาย" รายการค่าที่ยอมรับ ไม่ได้ตัดตัวไหนทิ้ง

-- ── 1) ตารางรายการยาคืน ──────────────────────────────────────────────────────
alter table mr_return drop constraint if exists mr_return_source_check;
alter table mr_return add constraint mr_return_source_check
  check (source in ('opd', 'ncd', 'ipd', 'ward', 'home', 'pcu'));

-- ── 2) การตั้งค่าห้องยา (แหล่งที่มาเริ่มต้น) ────────────────────────────────
alter table mr_setting drop constraint if exists mr_setting_default_source_check;
alter table mr_setting add constraint mr_setting_default_source_check
  check (default_source in ('opd', 'ncd', 'ipd', 'ward', 'home', 'pcu'));

-- ── ตรวจว่าเข้าจริง ─────────────────────────────────────────────────────────
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conname in ('mr_return_source_check', 'mr_setting_default_source_check');
