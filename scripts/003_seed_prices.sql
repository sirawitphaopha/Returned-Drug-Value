-- ============================================================================
-- 003_seed_prices.sql — ตั้งต้นตารางราคา 417 แถว + หน่วยนับที่ต้องแก้รายตัว
--
-- รันซ้ำได้ ไม่ทับของเดิม (on conflict do nothing / where unit_th is null)
-- ราคาเริ่มต้น = 0 ทุกตัว → หน้าค้นยาจะขึ้นป้าย "ยังไม่ใส่ราคา" จนกว่าจะกรอก
-- ============================================================================

-- ── 1) ยาทุกตัวใน drugs ต้องมีแถวราคาของตัวเอง ─────────────────────────────
insert into mr_drug_price (drug_id, unit_price)
select id, 0 from drugs
on conflict (drug_id) do nothing;

-- ── 2) ยาฉีด 15 ตัวที่นับเป็น "ขวด" ────────────────────────────────────────
-- form = injection ค่าเริ่มต้นใน lib/units.js คือ "หลอด" (33 ตัว)
-- 15 ตัวนี้พี่กันเคาะเองว่าเป็นขวด → เขียนทับด้วย unit_th รายตัว
-- จับคู่ด้วย generic + strength ไม่ใช่เลข id เผื่อ id ในฐานเปลี่ยน
update mr_drug_price p
   set unit_th = 'ขวด', updated_at = now()
  from drugs d
 where d.id = p.drug_id
   and d.form = 'injection'
   and p.unit_th is null
   and (d.generic, d.strength) in (
     ('Amoxicillin + Clavulanic acid',                  '1 + 0.2'),
     ('Ertapenem',                                      '1'),
     ('Piperacillin + Tazobactam',                      '4 + 0.5'),
     ('Streptomycin',                                   '1'),
     ('Remdesivir',                                     '100'),
     ('Trimethoprim Sulfamethoxazole (Co-trimoxazole)', '80 + 400'),
     ('Ciprofloxacin',                                  '200'),
     ('Metronidazole',                                  '500'),
     ('Aripiprazole',                                   '400'),
     ('Depot Medroxyprogesterone acetate (DMPA)',       '150'),
     ('Furosemide',                                     '250'),
     ('Heparin sodium',                                 '5000'),
     ('Heparin sodium',                                 '25000'),
     ('Triamcinolone acetonide',                        '10'),
     ('Triamcinolone acetonide',                        '40')
   );

-- ============================================================================
-- ตรวจผล (รันมือได้ ไม่ใช่ส่วนของ migration)
--   select count(*) from mr_drug_price;                       -- ต้องได้ 417
--   select count(*) from mr_drug_price where unit_th = 'ขวด'; -- ต้องได้ 15
-- ============================================================================
