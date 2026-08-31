-- ═══════════════════════════════════════════════════════════════════════════
-- เก็บร่างที่กรอกค้างขึ้นเซิร์ฟเวอร์ (v0.14.0.0)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- พี่กันสั่ง 31 ส.ค. 2569 หลังเล่าความกลัวที่แท้จริง
--   "สิ่งที่เรากลัวที่สุด คือกรอกไปชั่วโมงนึง แล้วเน็ตหลุด และกรอกไปแล้วคอมรีสตาร์ต
--    กรอกไปแล้วไปทำอย่างอื่น พอมากดที่แท็บนั้นมันดันรีเฟรชใหม่"
--
-- ของเดิมร่างอยู่ในเครื่องนั้นเครื่องเดียว รอดเน็ตหลุด รอดคอมรีสตาร์ต รอดรีเฟรช
-- แต่ไม่รอด 3 อย่างนี้ — ฮาร์ดดิสก์เสีย · มีคนล้างข้อมูลเบราว์เซอร์ · ย้ายไปทำต่อเครื่องอื่น
--
-- ตารางนี้ทำให้ร่างอยู่บนเซิร์ฟเวอร์ด้วย เอาเครื่องใหม่มาตั้งชื่อเดิมแล้วของกลับมาครบ
--
-- 🚨 ร่างในตารางนี้ยังไม่ใช่ข้อมูลจริง — ไม่เข้าหน้าประวัติ ไม่เข้ายอด KPI
--    จนกว่าจะกดบันทึกแล้วเข้า mr_return ตามปกติ

create table if not exists mr_draft (
  id          bigint generated always as identity primary key,

  -- ชื่อเครื่องที่ผู้ใช้เลือกตอนเปิดเว็บครั้งแรก
  -- คอม  → 'computer OPD เครื่องที่ 1' … (8 เครื่องประจำ)
  -- มือถือ → 'มือถือของ ภญ. ศิริพร ใจดี'  (มือถือเป็นของส่วนตัว จึงระบุด้วยชื่อคน)
  device_id   text not null,

  -- 🚨 ต้องแยกรายหน้าต่างด้วย ไม่ใช่แค่รายเครื่อง
  --    เครื่องเดียวเปิดหลายหน้าต่างเพื่อกรอกคนไข้คนละคนได้ (พี่กันสั่ง 31 ส.ค. 2569)
  --    ถ้าผูกกับเครื่องอย่างเดียว หน้าต่างจะเขียนทับกันบนเซิร์ฟเวอร์
  --    = ยกปัญหาเดิมที่เพิ่งแก้ไปวางไว้บนเซิร์ฟเวอร์แทน
  tab_id      text not null,

  rows        jsonb  not null default '[]'::jsonb,
  batch_id    uuid,
  hn          text,
  source      text,
  pcu_site    text,
  return_date date,

  -- ล็อตที่กดบันทึกแล้วส่งไม่สำเร็จ ต้องรู้ตัวข้ามเครื่องด้วย
  save_failed boolean not null default false,
  failed_by   text,

  updated_at  timestamptz not null default now(),

  unique (device_id, tab_id)
);

create index if not exists mr_draft_device_idx on mr_draft (device_id, updated_at desc);
create index if not exists mr_draft_updated_idx on mr_draft (updated_at);

alter table mr_draft enable row level security;
-- ไม่มี policy = ปฏิเสธทุกคำขอจากภายนอก เข้าถึงได้ทางเดียวคือ API ที่ใช้ service_role

-- ── เขียนร่าง ──────────────────────────────────────────────────────────────
-- 🚨 ร่างว่างเปล่า = ลบทิ้ง ไม่เก็บไว้ให้รก
--    (กดล้างรายการหรือบันทึกสำเร็จแล้ว ร่างนั้นไม่มีความหมายอีกต่อไป)
create or replace function mr_draft_put(p jsonb)
returns void language plpgsql as $$
declare
  n int := coalesce(jsonb_array_length(p->'rows'), 0);
begin
  if n = 0 then
    delete from mr_draft
     where device_id = p->>'deviceId' and tab_id = p->>'tabId';
    return;
  end if;

  insert into mr_draft (device_id, tab_id, rows, batch_id, hn, source, pcu_site,
                        return_date, save_failed, failed_by, updated_at)
  values (
    p->>'deviceId',
    p->>'tabId',
    coalesce(p->'rows', '[]'::jsonb),
    nullif(p->>'batchId', '')::uuid,
    nullif(p->>'hn', ''),
    nullif(p->>'source', ''),
    nullif(p->>'pcuSite', ''),
    nullif(p->>'date', '')::date,
    coalesce((p->>'saveFailed')::boolean, false),
    nullif(p->>'failedBy', ''),
    now()
  )
  on conflict (device_id, tab_id) do update set
    rows        = excluded.rows,
    batch_id    = excluded.batch_id,
    hn          = excluded.hn,
    source      = excluded.source,
    pcu_site    = excluded.pcu_site,
    return_date = excluded.return_date,
    save_failed = excluded.save_failed,
    failed_by   = excluded.failed_by,
    updated_at  = now();
end;
$$;

-- ── อ่านร่าง ───────────────────────────────────────────────────────────────
-- คืนทุกร่างที่ยังไม่หมดอายุ พร้อมบอกว่าเป็นของเครื่องนี้หรือเครื่องอื่น
--
-- 🚨 ล้างของหมดอายุตรงนี้เลย ไม่ต้องพึ่งตัวตั้งเวลาแยก
--    เว็บนี้ไม่มีระบบสั่งงานตามเวลา การล้างตอนมีคนเรียกจึงเป็นทางที่แน่นอนที่สุด
create or replace function mr_draft_list(p_device text, p_tab text, p_days int)
returns jsonb language plpgsql as $$
declare
  keep int := coalesce(p_days, 7);
  out  jsonb;
begin
  delete from mr_draft where updated_at < now() - (keep || ' days')::interval;

  select coalesce(jsonb_agg(x order by x.updated_at desc), '[]'::jsonb) into out
  from (
    select
      d.device_id,
      d.tab_id,
      jsonb_array_length(d.rows) as items,
      d.rows,
      d.batch_id,
      d.hn,
      d.source,
      d.pcu_site,
      d.return_date,
      d.save_failed,
      d.failed_by,
      d.updated_at,
      (d.device_id = p_device) as mine,
      (d.device_id = p_device and d.tab_id = p_tab) as self,
      -- เหลืออีกกี่วันก่อนถูกล้าง ใช้ขึ้นแถบเตือนล่วงหน้า
      greatest(0, keep - floor(extract(epoch from (now() - d.updated_at)) / 86400)::int) as days_left
    from mr_draft d
  ) x;

  return out;
end;
$$;

-- ── ลบร่าง ────────────────────────────────────────────────────────────────
create or replace function mr_draft_drop(p_device text, p_tab text)
returns void language sql as $$
  delete from mr_draft where device_id = p_device and tab_id = p_tab;
$$;
