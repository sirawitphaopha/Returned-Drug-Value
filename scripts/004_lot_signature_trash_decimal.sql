-- 004 — ถังขยะ · คนบันทึก (เซ็นชื่อต่อล็อต) · จำนวนทศนิยม · ราคา 4 ตำแหน่ง · ตีราคาย้อนหลัง
-- รันครั้งเดียว ปลอดภัยกับข้อมูลเดิม (ตอนรันมี mr_return 1 แถวทดสอบ)

-- ── 1) ถังขยะ ────────────────────────────────────────────────────────────────
-- ลบแล้วแค่ประทับเวลา แถวยังอยู่ กู้คืนได้ · ตัวเลขสรุปกรองของที่ลบออก
alter table mr_return add column if not exists deleted_at timestamptz;
alter table mr_return add column if not exists deleted_by text;
create index if not exists mr_return_alive_idx on mr_return (return_date desc, id desc) where deleted_at is null;

-- ── 2) คนบันทึก ──────────────────────────────────────────────────────────────
-- 1 รอบกดบันทึก = 1 ล็อต · เซ็นชื่อก่อนส่ง ชื่อติดไปทุกแถวในล็อตนั้น
alter table mr_return add column if not exists recorded_by text;

-- ── 3) จำนวนรับทศนิยม ────────────────────────────────────────────────────────
-- ยาน้ำคืนมาครึ่งขวด ยาแบ่งครึ่งเม็ด เดิมบันทึกไม่ได้เพราะบังคับจำนวนเต็ม
alter table mr_return drop constraint if exists mr_return_qty_check;
alter table mr_return alter column qty type numeric(12,2) using qty::numeric(12,2);
alter table mr_return add constraint mr_return_qty_check check (qty > 0);

-- ── 4) ราคา 4 ตำแหน่ง ────────────────────────────────────────────────────────
-- ไฟล์จาก HIS ให้ราคามา 4 ตำแหน่ง (เช่น 0.4567 บาท/เม็ด) เดิมต้องปัดเหลือ 2
-- ยาถูกกว่า 0.005 จะกลายเป็น 0.00 = ระบบถือว่ายังไม่ใส่ราคา
alter table mr_drug_price drop constraint if exists mr_drug_price_unit_price_check;
alter table mr_drug_price alter column unit_price type numeric(12,4) using unit_price::numeric(12,4);
alter table mr_drug_price add constraint mr_drug_price_unit_price_check check (unit_price >= 0);

alter table mr_return alter column unit_price type numeric(12,4) using unit_price::numeric(12,4);

-- ── 5) ตีราคาย้อนหลัง ────────────────────────────────────────────────────────
-- เติมราคาให้แถวเก่าที่ราคายังเป็น 0 ได้ · เติมเฉพาะที่ว่าง ไม่ทับของที่มีอยู่แล้ว
-- (ไม่ขัดกฎแช่ราคา เพราะเป็นการเติมของที่ยังไม่เคยมี ไม่ใช่เขียนทับ)
alter table mr_return add column if not exists price_fixed_at timestamptz;
alter table mr_return add column if not exists price_fixed_by text;

-- ── 6) รายชื่อคนในห้องยา ─────────────────────────────────────────────────────
-- ก๊อปมาจาก ME-DRP lib/constants.ts REPORTERS (16 คน) เก็บไว้ในโปรเจกต์นี้เอง
-- ไม่ดึงข้ามเว็บตอนใช้งาน — 2 เว็บแยกกัน ผูกกันแล้ววันหน้าแก้ที่หนึ่งอีกที่พังตาม
alter table mr_setting add column if not exists staff jsonb not null default '[]'::jsonb;
alter table mr_setting add column if not exists last_recorder text;

update mr_setting
set staff = '[
  "ภญ. ชนิสา แหวนเงิน",
  "ภก. ประคอง ชิณวงษ์",
  "ภก. ธีร์ธวัช รัตนวรวิเศษ",
  "ภญ. วลัยพรรณ ชิณวงษ์",
  "ภญ. งามตา นามสว่าง",
  "ภก. สิรวิชญ์ เผ่าผา",
  "ภก. พลกฤษณ์ พงษ์วิเศษ",
  "ภก. ปวริศร์ มุงคุณ",
  "จพ. วีระ กานกายันต์",
  "จพ. ภัชทราวลี คำพินิจ",
  "จพ. อนุวัฒน์ ใจหวัง",
  "จพ. ฉัตรกมล ศรีมุม",
  "จพ. กฤตยชญ์ โคษา",
  "พนง. จำเนียร สีสัน",
  "พนง. อุเทน พรหมบุตร",
  "พนง. สุพิชฌาย์ ประกอบดี"
]'::jsonb
where id = 1 and jsonb_array_length(staff) = 0;

-- ── 7) ฟังก์ชันสรุป/ประวัติ ต้องกรองของที่ลบออก + ส่งชื่อคนบันทึกกลับมา ──────────
-- (เนื้อฟังก์ชันเต็มอยู่ใน 005_functions_v2.sql เพราะยาว)
