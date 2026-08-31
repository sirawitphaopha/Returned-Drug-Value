-- ═══════════════════════════════════════════════════════════════════════════
-- ลายเซ็นข้อมูล — ใช้ถามว่า "มีอะไรเปลี่ยนไปหรือยัง" โดยไม่ต้องลากข้อมูลจริงมา
-- v0.12.0.0 · กลุ่ม 3 ข้อ ก-1 (อัปเดตสดข้ามเครื่อง) + ก-8 (เลิกโหลดซ้ำ)
--
-- พี่กันสั่ง 27 ส.ค. 2569:
--   "ถ้าครั้งนี้โหลดมาแล้ว แล้วรีเฟรชเว็บแบบปกติ มันจะไม่โหลดใหม่"
--   "ถ้าเราเปิดตารางประวัติ แล้วมีอีกคนส่งข้อมูลมา มันจะขึ้นอัปเดตให้เราเลย"
--
-- ทำไมต้องมี updated_at + trigger แทนการนับแถวเฉย ๆ
--   นับแถวจับได้แค่ "เพิ่ม" กับ "ลบ" — จับ "แก้จำนวน/สลับใช้ต่อเป็นทำลาย" ไม่ได้เลย
--   ซึ่งเป็นการแก้ที่กระทบมูลค่าโดยตรง เครื่องอื่นต้องเห็นทันที
--
--   trigger ทำงานในฐานข้อมูล จึงจับได้แม้แก้ตรงในหน้า Supabase
--   (แนวเดียวกับ drug_audit ของตาราง drugs ที่ใช้อยู่แล้ว)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) ร่องรอยเวลาที่แถวถูกแตะครั้งล่าสุด ────────────────────────────────────
alter table mr_return
  add column if not exists updated_at timestamptz not null default now();

-- แถวเก่าที่มีอยู่แล้วได้ now() ไปตอน add column ซึ่งไม่ตรงความจริง
-- ตั้งให้เท่ากับเวลาที่บันทึกจริงแทน (ของที่ลบไปแล้วใช้เวลาที่ลบ)
update mr_return
   set updated_at = coalesce(deleted_at, created_at)
 where updated_at > coalesce(deleted_at, created_at);

-- ── 2) ตัวประทับเวลาอัตโนมัติทุกครั้งที่แถวถูกแก้ ────────────────────────────
create or replace function mr_touch_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mr_return_touch on mr_return;
create trigger mr_return_touch
  before update on mr_return
  for each row execute function mr_touch_updated();

-- ── 3) ดัชนีให้ max(updated_at) ตอบเร็วแม้ตารางโตเป็นหลักแสนแถว ──────────────
create index if not exists mr_return_updated_idx on mr_return (updated_at desc);

-- ── 4) ลายเซ็นก้อนเดียว ─────────────────────────────────────────────────────
-- คืนตัวเลขไม่กี่ตัว ไม่แตะข้อมูลจริงเลย เรียกทุก 20 วินาทีได้สบาย
--
-- rows  = ครั้งสุดท้ายที่มีใครแตะรายการยาคืน (เพิ่ม/แก้/ลบ/กู้คืน/ตีราคาใหม่)
-- cnt   = จำนวนแถวทั้งหมด — เผื่อมีคนลบถาวรตรงในฐาน ซึ่ง updated_at จับไม่ได้
-- lot   = ครั้งสุดท้ายที่มีการแก้ระดับล็อต (เก็บแยกไว้ใน mr_lot_audit)
-- setg  = ครั้งสุดท้ายที่มีคนแก้การตั้งค่าห้องยา (ชื่อคน · รพ.สต. · ยาที่คืนบ่อย)
create or replace function mr_rev()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'rows', coalesce((select extract(epoch from max(updated_at))::bigint from mr_return), 0),
    'cnt',  (select count(*) from mr_return),
    'lot',  coalesce((select max(id) from mr_lot_audit), 0),
    'setg', coalesce((select extract(epoch from updated_at)::bigint from mr_setting where id = 1), 0)
  );
$$;
