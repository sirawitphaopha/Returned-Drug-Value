-- ═══════════════════════════════════════════════════════════════════════════
--  ตัวกรอง 3 ทางในหน้าประวัติ — สถานะ · แหล่งที่มา · ผู้บันทึก
--  พี่กันสั่ง 10 ก.ย. 2569 (เลือกแบบ ข จากมอคอัป hist-head-2026-09-10.html)
-- ═══════════════════════════════════════════════════════════════════════════
--
--  🚨 ทำไมต้องกรองที่ฐาน ไม่ใช่กรองในเครื่อง
--     หน้าประวัติโหลดทีละ 60 แถว ถ้ากรองในเครื่องจะกรองเฉพาะที่โหลดมาแล้ว
--     เลือก "ทำลาย" แล้วเห็น 1 รายการ ทั้งที่ทั้งปีมี 20 — ตัวเลขโกหกโดยไม่มีอะไรเตือน
--     ยอดรวมท้ายหน้า (saved/lost) ก็ต้องนับจากผลที่กรองแล้วด้วย
--
--  🚨 พารามิเตอร์ใหม่ทั้ง 3 ตัวมีค่าเริ่มต้นเป็น null = ไม่กรอง
--     โค้ดเก่าที่ยังไม่ได้ deploy จึงเรียกได้เหมือนเดิมทุกประการ
--
--  p_disp  'reuse' | 'destroy' | null    สถานะ
--  p_src   'opd' | 'ncd' | 'ipd' | 'home' | 'pcu' | null    แหล่งที่มา
--  p_by    ชื่อผู้บันทึกเต็ม ๆ | null      ต้องตรงทั้งชื่อ ไม่ใช่ค้นบางส่วน
--  p_site  ชื่อ รพ.สต. | null            ชั้นที่สองของ p_src ใช้ได้เฉพาะตอน p_src = 'pcu'

create or replace function mr_history(
  p_q text,
  p_from date,
  p_to date,
  p_limit integer,
  p_trash boolean default false,
  p_lot text default null,
  p_offset integer default 0,
  p_disp text default null,
  p_src text default null,
  p_by text default null,
  p_site text default null
)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
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
      -- ── ตัวกรอง 3 ทางที่เพิ่มเข้ามา ─────────────────────────────────────
      and (p_disp is null or btrim(p_disp) = '' or disposition = btrim(p_disp))
      and (p_src  is null or btrim(p_src)  = '' or source      = btrim(p_src))
      and (p_by   is null or btrim(p_by)   = '' or recorded_by = btrim(p_by))
      and (p_site is null or btrim(p_site) = '' or pcu_site    = btrim(p_site))
      and (p_q is null or btrim(p_q) = ''
        or position(lower(btrim(p_q)) in lower(label)) > 0
        or position(lower(btrim(p_q)) in lower(drug_name)) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(hn, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(recorded_by, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(lot_no, ''))) > 0
        or position(lower(btrim(p_q)) in lower(coalesce(pcu_site, ''))) > 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'saved', coalesce((select sum(unit_price * qty) from filtered where disposition = 'reuse'),   0),
    'lost',  coalesce((select sum(unit_price * qty) from filtered where disposition = 'destroy'), 0),
    -- 🚨 รายชื่อผู้บันทึกที่มีจริงในช่วงเวลาที่เลือก (ไม่รวมตัวกรองผู้บันทึกเอง)
    --    เพื่อให้ช่องเลือกมีเฉพาะคนที่บันทึกจริงในช่วงนั้น ไม่ใช่ทั้ง 16 คนเสมอ
    'people', coalesce((
      select jsonb_agg(distinct recorded_by order by recorded_by)
      from base
      where (case when coalesce(p_trash, false) then deleted_at is not null else deleted_at is null end)
        and (p_from is null or return_date >= p_from)
        and (p_to   is null or return_date <= p_to)
        and recorded_by is not null and btrim(recorded_by) <> ''
    ), '[]'::jsonb),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'date', return_date, 'drugId', drug_id,
        'name', label,
        'savedName', drug_name,
        'unit', unit, 'price', unit_price, 'qty', qty,
        'disposition', disposition, 'source', source, 'hn', hn,
        'pcuSite', pcu_site,
        'by', recorded_by, 'lot', lot_no, 'reason', destroy_reason,
        'deletedAt', deleted_at, 'priceFixedAt', price_fixed_at
      ) order by return_date desc, id desc)
      from (select * from filtered order by return_date desc, id desc
            limit coalesce(p_limit, 60) offset coalesce(p_offset, 0)) t
    ), '[]'::jsonb)
  );
$function$;
