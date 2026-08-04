-- ============================================================================
-- 001_schema.sql — โครงตารางของแอปมูลค่ายาคืน
-- ฐานข้อมูล: Supabase โปรเจกต์ tb-calculator (ryewggkhunpuipgkgbfv)
-- ตารางทุกตัวขึ้นต้น mr_ (Med Return) เพื่อไม่ชนกับ TB Calculator / ME-DRP / คลังคำ
--
-- ⚠️ ห้ามแตะตาราง public.drugs เด็ดขาด — ME-DRP กับ TB Calculator ใช้ร่วมกันอยู่
-- ============================================================================

-- ── 1) ราคาต่อหน่วย + หน่วยนับไทย ของยาแต่ละตัว ───────────────────────────
-- ตาราง drugs เดิมไม่มีคอลัมน์ราคา และห้ามไปเพิ่ม → แยกตารางใหม่ผูกด้วย drug_id
create table if not exists mr_drug_price (
  drug_id      integer primary key references drugs(id) on delete cascade,
  unit_price   numeric(12,2) not null default 0 check (unit_price >= 0),
  unit_th      text,          -- หน่วยนับเฉพาะตัวนี้ · ว่าง = ใช้ค่าเริ่มต้นจาก form (lib/units.js)
  display_name text,          -- ชื่อที่โชว์ · ว่าง = ประกอบจาก generic + strength (lib/drugName.js)
  note         text,          -- ที่มาของราคา เช่น "HIS 2569-08"
  updated_at   timestamptz not null default now()
);

-- ── 2) รายการยาคืน ─────────────────────────────────────────────────────────
-- 🔑 หัวใจของแอป: ราคาถูกแช่แข็งไว้ในแถว ห้าม join เอาราคาปัจจุบันตอนทำรายงาน
--    ถ้าราคายาเปลี่ยนกลางปี ตัวเลข KPI ย้อนหลังต้องไม่ขยับ ไม่งั้นอธิบายผู้บริหารไม่ได้
create table if not exists mr_return (
  id           bigint generated always as identity primary key,
  return_date  date          not null,     -- ไม่มี default (นาฬิกา DB เป็น UTC จะเพี้ยนวันกับไทย +7)
  drug_id      integer       not null,     -- ไม่ผูก FK โดยตั้งใจ (ดูหมายเหตุท้ายไฟล์)
  drug_name    text          not null,     -- snapshot ชื่อยา ณ วันบันทึก
  unit         text          not null,     -- snapshot หน่วยนับ ณ วันบันทึก
  unit_price   numeric(12,2) not null check (unit_price >= 0),  -- snapshot ราคา ณ วันบันทึก
  qty          integer       not null check (qty > 0),
  disposition  text not null default 'reuse'  check (disposition in ('reuse','destroy')),
  source       text not null default 'opd'    check (source in ('opd','ncd','ward','home','pcu')),
  hn           text,
  batch_id     uuid,          -- ก้อนการบันทึก 1 ครั้ง (กดบันทึกทีเดียวได้หลายแถว)
  client_rid   text,          -- คู่กับ batch_id = กันบันทึกซ้ำตอนเน็ตหลุดแล้วกดส่งใหม่
  created_at   timestamptz not null default now()
);
create index if not exists mr_return_date_idx on mr_return (return_date desc, id desc);
create index if not exists mr_return_drug_idx on mr_return (drug_id);
create index if not exists mr_return_hn_idx   on mr_return (hn);
-- กันข้อมูลซ้ำ: กรณีที่เจอจริงบนเน็ตโรงพยาบาลคือ "ข้อมูลเข้าฐานแล้วแต่คำตอบหายกลางทาง"
-- กดส่งใหม่ด้วย batch_id เดิม → upsert เจอคู่ซ้ำแล้วข้ามไป ไม่ได้ข้อมูลสองชุด
-- ห้ามใส่ where batch_id is not null — ดัชนีแบบมีเงื่อนไข ON CONFLICT อ้างถึงไม่ได้
-- และไม่จำเป็นด้วย เพราะ Postgres ถือว่าค่าว่างไม่ซ้ำกันอยู่แล้ว
create unique index if not exists mr_return_batch_rid_idx
  on mr_return (batch_id, client_rid);

-- ── 3) การตั้งค่าห้องยา ────────────────────────────────────────────────────
-- มีแถวเดียวเสมอ (id = 1) เพราะยังไม่มีระบบผู้ใช้แยกคน
create table if not exists mr_setting (
  id             smallint primary key default 1 check (id = 1),
  org_name       text not null default 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่',
  default_source text not null default 'opd' check (default_source in ('opd','ncd','ward','home','pcu')),
  fav_ids        jsonb not null default '[]'::jsonb,   -- ยาที่คืนบ่อย สูงสุด 6 ตัว
  updated_at     timestamptz not null default now()
);
insert into mr_setting (id) values (1) on conflict (id) do nothing;

-- ── ระบบกั้นสิทธิ์ข้อมูล (RLS) ─────────────────────────────────────────────
-- เปิด RLS แต่ไม่สร้าง policy เลย = ปิดตายจากภายนอกทั้งหมด
-- มีแต่ service_role (กุญแจฝั่งเซิร์ฟเวอร์) ที่ผ่านได้ → เบราว์เซอร์ไม่เคยแตะฐานข้อมูลตรง ๆ
alter table mr_drug_price enable row level security;
alter table mr_return     enable row level security;
alter table mr_setting    enable row level security;

-- ============================================================================
-- หมายเหตุ 3 การตัดสินใจสำคัญ
--
-- 1) ทำตารางราคาแยก ไม่แก้ drugs
--    drugs ใช้ร่วมกับอีก 2 เว็บที่รันอยู่จริง แตะแล้วพังทั้งสามที่
--
-- 2) mr_return.drug_id ไม่ผูก FK
--    แถวมี snapshot (ชื่อ/หน่วย/ราคา) ครบอยู่แล้ว ไม่ต้อง join
--    FK จะไปขวางการแก้ตาราง drugs ของเว็บอื่น
--    ตรงกับที่ ME-DRP ทำไว้อยู่แล้ว (incidents.drug_ids ก็ไม่มี FK)
--
-- 3) แช่ราคาไว้ในแถว
--    ผลข้างเคียงที่ต้องรู้: ยาที่ถูกซ่อน (hidden = true) ทีหลังจะหายจากช่องค้นหา
--    แต่รายการเก่าที่บันทึกไว้แล้วยังแสดงปกติ เพราะมี snapshot ของตัวเอง — ถูกต้องแล้ว
-- ============================================================================
