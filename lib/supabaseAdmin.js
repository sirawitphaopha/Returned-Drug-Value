// Supabase client ฝั่งเซิร์ฟเวอร์เท่านั้น (ใช้ service_role key — ห้ามหลุดไปเบราว์เซอร์)
// ตารางของแอปนี้ขึ้นต้น mr_ และเปิด RLS แบบ deny-all → มีแต่ service_role ที่ผ่านได้
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getAdmin() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ใน .env.local');
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
