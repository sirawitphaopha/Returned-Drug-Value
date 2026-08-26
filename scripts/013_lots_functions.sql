-- 013_lots_functions.sql
-- เก็บฟังก์ชัน 2 ตัวที่รันอยู่ในฐานมานานแล้วแต่ไม่เคยมีไฟล์ใน repo
--
-- ═══ ที่มา ═══
-- ผลตรวจข้อ 📌 2 (docs/AUDIT-STATUS.md): "ฟังก์ชันในฐานข้อมูลบางตัวไม่มีไฟล์เก็บใน scripts/"
-- ยืนยันด้วย SQL จริง 26 ส.ค. 2569 — จากฟังก์ชัน mr_* ทั้ง 17 ตัวในฐาน
-- มี 2 ตัวที่ไม่มีไฟล์ไหนเก็บเลย คือ mr_lots กับ mr_next_lot_no
--
-- 🚨 ทำไมเรื่องนี้สำคัญ
--    ฟังก์ชันที่ไม่มีไฟล์เก็บ = ไม่มีใครรู้ว่าข้างในทำอะไร ตรวจสอบไม่ได้ว่ากรอง
--    ถังขยะครบไหม และถ้าฐานพังต้องสร้างใหม่ก็ไม่มีต้นฉบับให้กลับไปดู
--
-- ✅ ตรวจแล้ว 26 ส.ค. 2569 ทั้งสองตัวถูกต้อง — ไฟล์นี้จึงเป็นการ "เก็บของที่ใช้อยู่"
--    ไม่ได้แก้พฤติกรรมอะไรเลย รันซ้ำได้ผลเหมือนเดิมทุกประการ

-- ═══════════════════════════════════════════════════════════════════════════
-- mr_lots — รายการ Lot สำหรับหน้าแยกดูราย Lot
-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ กรอง deleted_at is null แล้ว — ของในถังขยะไม่โผล่ในรายการ Lot
--
-- 🚨 คืน total_qty มาด้วยก็จริง แต่หน้าจอ "ห้ามเอามาโชว์" (กฎข้อ 3.4 ใน CLAUDE.md)
--    เพราะเป็นการบวกจำนวนข้ามหน่วยนับ — เม็ด + ขวด + หลอด รวมกันไม่มีความหมาย
--
-- ⚠️ ตัดที่ 200 Lot โดยหน้าจอยังไม่บอกผู้ใช้ (ผลตรวจข้อ ต-19 ยังไม่แก้ครบ)
--    ปีงบหนึ่งมีหลายร้อย Lot — ต้องเพิ่มข้อความบนจอ ซึ่งแตะหน้าตา รอพี่กันเคาะ
create or replace function mr_lots(p_from date, p_to date, p_limit integer)
returns jsonb
language sql
stable
set search_path to 'public'
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'lot', lot_no, 'date', lot_date, 'by', recorded_by,
    'items', items, 'qty', total_qty, 'saved', saved, 'lost', lost
  ) order by lot_date desc, lot_no desc), '[]'::jsonb)
  from (
    select
      lot_no,
      max(return_date) as lot_date,
      max(recorded_by) as recorded_by,
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
-- mr_next_lot_no — ออกเลข Lot ถัดไปของวันนั้น
-- ═══════════════════════════════════════════════════════════════════════════
-- รูปแบบ: L + ปีเดือนวัน พ.ศ. 2 หลัก + ขีด + ลำดับ 2 หลัก  →  L690826-01
--
-- 🚨 ใช้ upsert เพื่อให้ออกเลขแบบ atomic — ห้ามเปลี่ยนไปใช้ max(n)+1 เด็ดขาด
--    สองเครื่องกดบันทึกพร้อมกันจะอ่าน max ตัวเดียวกันแล้วได้เลข Lot ซ้ำ
--    ซึ่งทำให้ยาของคนไข้สองรายปนกันในใบสรุปเดียว สืบกลับผิดคน
--
-- 🚨 บวก 543 ปีก่อนแปลงเป็นข้อความ — เลข Lot ใช้ พ.ศ. ตามที่ห้องยาอ่านกันจริง
--    ไม่ใช่ ค.ศ. · เปลี่ยนตรงนี้เมื่อไหร่ เลข Lot เก่ากับใหม่จะอ่านคนละระบบทันที
create or replace function mr_next_lot_no(p_date date)
returns text
language plpgsql
set search_path to 'public'
as $fn$
declare
  v_n integer;
begin
  insert into mr_lot_seq (lot_date, n) values (p_date, 1)
  on conflict (lot_date) do update set n = mr_lot_seq.n + 1
  returning n into v_n;

  return 'L' || to_char(p_date + interval '543 years', 'YYMMDD') || '-' || lpad(v_n::text, 2, '0');
end;
$fn$;
