import './globals.css';
// 🔤 ฟอนต์ฝังในเว็บผ่าน next/font/google — ดาวน์โหลดและฝังตอน build
// เว็บเสิร์ฟฟอนต์เอง ไม่พึ่ง Google ตอนใช้งาน (ขึ้นชัวร์ทุกเครื่อง ไม่กระพริบ เน็ตโรงพยาบาลก็ไม่สะดุด)
// 📌 กฎโปรเจกต์: ฟอนต์ใหม่ทุกตัวต้องฝังแบบนี้ ห้ามใช้ <link> ไป CDN
//    มอคอัปโหลด 2 ตัวนี้ (บรรทัด 12): Sarabun 300–700 + IBM Plex Sans Thai 400–700
import { IBM_Plex_Sans_Thai, Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

// ใช้กับตัวเลขเงิน — มี tabular-nums ทำให้หลักไม่ขยับตอนตัวเลขวิ่ง
const plex = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

// ไอคอนเว็บ — คัดจากมอคอัปบรรทัด 13 ตัวต่อตัว (วงกลมเขียว + สัญลักษณ์บาท)
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232f7d5d'/%3E%3Cpath d='M25 16a9 9 0 1 1-3.2-6.9' fill='none' stroke='%23ffffff' stroke-opacity='.5' stroke-width='2.2' stroke-linecap='round'/%3E%3Cpath d='M25.4 5.6 L25.4 11 L20 11 Z' fill='%23ffffff' fill-opacity='.8'/%3E%3Ctext x='16' y='22.5' font-family='sans-serif' font-size='15' font-weight='700' fill='%23ffffff' text-anchor='middle'%3E%E0%B8%BF%3C/text%3E%3C/svg%3E";

export const metadata = {
  title: 'มูลค่ายาคืน · ห้องยา รพ.ปรางค์กู่',
  description: 'บันทึกยาที่ผู้ป่วยคืน แปลงเป็นมูลค่าเงินที่ประหยัดได้ พร้อมสรุปรายปีงบประมาณ',
  icons: { icon: FAVICON },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // แป้นพิมพ์เด้งขึ้นมาแล้วให้พื้นที่เนื้อหาหดตาม ไม่ใช่ลอยทับ
  // ไม่งั้นป๊อปอัปใส่จำนวนที่ตรึงล่างจอจะโดนแป้นพิมพ์บังปุ่ม "เพิ่ม" กับปุ่มลัด 10/30/60/90
  interactiveWidget: 'resizes-content',
  // ให้เนื้อหาไหลถึงขอบจอจริง env(safe-area-inset-*) ถึงจะมีค่า
  // (โค้ดกันแถบล่าง iPhone เขียนไว้แล้วแต่ไม่เคยทำงานเพราะขาดบรรทัดนี้)
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
