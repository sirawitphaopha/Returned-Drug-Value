-- 010 · แก้ไขล็อตได้ + เก็บร่องรอยทุกการแก้ (พี่กันสั่ง 25 ส.ค. 2569)
--
-- ที่มา: ล็อตที่บันทึกไปแล้วมีโอกาสกรอกผิด — เลือกชื่อผู้บันทึกผิดคน ติ๊กแหล่งที่มาผิด
-- หรือนับจำนวนพลาด เดิมต้องลบทีละแถวแล้วกรอกใหม่ทั้งล็อต ซึ่งเสี่ยงกว่าการแก้มาก
--
-- 🚨 ทำไมต้องเก็บร่องรอย: การแก้ชื่อผู้บันทึกย้อนหลัง = เปลี่ยนหลักฐานว่าใครเซ็นรับล็อตนั้น
--    ถ้าไม่เก็บไว้ จะไม่มีทางตอบผู้ตรวจได้ว่าตัวเลขที่เห็นวันนี้เคยเป็นอะไรมาก่อน
--    (พี่กันเคาะเอง 25 ส.ค. 2569 — "เอาเก็บร่องรอยด้วย")

create table if not exists mr_lot_audit (
  id          bigint generated always as identity primary key,
  lot_no      text        not null,
  -- แถวไหนใน mr_return · ว่าง = เป็นการแก้ที่มีผลทั้งล็อต (ผู้บันทึก/แหล่งที่มา/วันที่)
  return_id   bigint,
  -- ชื่อยาตอนที่แก้ — เก็บไว้ตรงนี้เลยเพื่อให้อ่านประวัติได้โดยไม่ต้อง join
  -- และถ้าแถวนั้นถูกลบทีหลัง ประวัติยังบอกได้ว่าเคยเป็นยาอะไร
  drug_name   text,
  -- ช่องที่ถูกแก้: recorded_by · source · return_date · qty · disposition
  field       text        not null,
  old_value   text,
  new_value   text,
  changed_by  text,                                    -- คนที่กดแก้ (จากช่องผู้บันทึกที่เลือกอยู่)
  changed_at  timestamptz not null default now()
);

-- เปิดประวัติของล็อตหนึ่งต้องเร็ว เรียงใหม่→เก่า
create index if not exists mr_lot_audit_lot_idx on mr_lot_audit (lot_no, id desc);
create index if not exists mr_lot_audit_time_idx on mr_lot_audit (changed_at desc);

-- RLS ปิดตายเหมือนตารางอื่นของโปรเจกต์ — เบราว์เซอร์ไม่มีกุญแจ ทุกอย่างผ่าน API ฝั่งเซิร์ฟเวอร์
alter table mr_lot_audit enable row level security;

-- ── ฟังก์ชันอ่านประวัติการแก้ของล็อต ────────────────────────────────────────
create or replace function mr_lot_log(p_lot text, p_limit int default 200)
returns table (
  id bigint, return_id bigint, drug_name text, field text,
  old_value text, new_value text, changed_by text, changed_at timestamptz
)
language sql
stable
as $$
  select a.id, a.return_id, a.drug_name, a.field,
         a.old_value, a.new_value, a.changed_by, a.changed_at
  from mr_lot_audit a
  where a.lot_no = p_lot
  order by a.id desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

-- ── ฟังก์ชันอ่านแถวทั้งหมดในล็อต (สำหรับหน้าแก้ไข) ─────────────────────────
-- 🚨 ต้องดึงทุกแถว ไม่ตัดที่ 60 เหมือนหน้าประวัติ — ล็อตใหญ่มีได้ถึง 500 รายการ
--    ถ้าตัด ผู้ใช้จะแก้ได้ไม่ครบโดยไม่รู้ตัว แล้วยอดรวมบนจอกับในฐานจะไม่ตรงกัน
create or replace function mr_lot_rows(p_lot text)
returns table (
  id bigint, drug_id integer, drug_name text, unit text,
  unit_price numeric, qty numeric, disposition text, reason text,
  source text, hn text, return_date date, recorded_by text
)
language sql
stable
as $$
  select r.id, r.drug_id, r.drug_name, r.unit,
         r.unit_price, r.qty, r.disposition, r.destroy_reason,
         r.source, r.hn, r.return_date, r.recorded_by
  from mr_return r
  where r.lot_no = p_lot and r.deleted_at is null
  order by r.id;
$$;
