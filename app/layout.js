import './globals.css';
// 🚨 กฎที่มีผลเฉพาะฝั่งมือถือ ทุกกฎในไฟล์นี้ขึ้นต้นด้วย .mrv-mobile
//    คลาสนั้นถูกใส่/ถอดที่ <body> โดย MedReturnApp.jsx ตามธง wide
//    เดสก์ท็อปจึงไม่มีทางโดนกฎในไฟล์นี้เลยแม้แต่ข้อเดียว (พี่กันสั่ง 1 ก.ย. 2569)
import './mobile.css';
// 🔤 ฟอนต์ฝังในเว็บผ่าน next/font/google — ดาวน์โหลดและฝังตอน build
// เว็บเสิร์ฟฟอนต์เอง ไม่พึ่ง Google ตอนใช้งาน (ขึ้นชัวร์ทุกเครื่อง ไม่กระพริบ เน็ตโรงพยาบาลก็ไม่สะดุด)
// 📌 กฎโปรเจกต์: ฟอนต์ใหม่ทุกตัวต้องฝังแบบนี้ ห้ามใช้ <link> ไป CDN
//    มอคอัปโหลด 2 ตัวนี้ (บรรทัด 12): Sarabun 300–700 + IBM Plex Sans Thai 400–700
// ฟอนต์ของ "ชื่อเว็บ" อย่างเดียว — พี่กันเลือกเอง 26 ส.ค. 2569 (ลอง Charm → Charmonman → Charmonman)
// 🚨 ฝังมากับเว็บผ่าน next/font/google ไม่ได้ลิงก์ CDN — เน็ตโรงพยาบาลบล็อก Google Fonts ได้
import { IBM_Plex_Sans_Thai, Sarabun, Charmonman, Roboto_Mono } from 'next/font/google';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

// ใช้กับตัวเลขเงิน — มี tabular-nums ทำให้หลักไม่ขยับตอนตัวเลขวิ่ง
// Charmonman มีแค่ 2 น้ำหนัก (400 กับ 700) — ต่างจาก Sarabun ที่มี 5 ระดับ
// 🚨 ใช้กับชื่อเว็บเท่านั้น ห้ามลามไปที่อื่น — ตัวเลขกับชื่อยาต้องอ่านง่ายที่สุด
const charm = Charmonman({
  subsets: ['thai', 'latin'],
  weight: ['400', '700'],
  variable: '--font-charmonman',
  display: 'swap'
});

// 🔤 ฟอนต์ตัวอักษรอังกฤษกับตัวเลข — พี่กันสั่ง 27 ส.ค. 2569 ให้เอาแบบเดียวกับเว็บ HCV
// ตัวเลขทุกตัวกว้างเท่ากันเป๊ะ เลขในตารางจึงเรียงตรงกันเป็นแถวอ่านง่าย
// 🚨 ฟอนต์นี้ไม่มีตัวอักษรไทย จึงใส่ไว้ "ก่อน" Sarabun ในรายชื่อ
//    ตัวไทยที่ไม่มีในฟอนต์นี้ เบราว์เซอร์จะตกมาใช้ Sarabun ให้เอง (ท่าเดียวกับ HCV)
const mono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap'
});

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
  // ── ห้ามซูม (พี่กันสั่ง 1 ก.ย. 2569) ──────────────────────────────────────
  //   "งั้น ห้ามซูม เหมือนจุดที่ตรึงไว้ของปุ่มกดส่งยา เพราะแอปทั่วไป มันซูมไม่ได้ นี่นา"
  //
  // ที่มา: Safari จำระดับซูมผูกไว้กับที่อยู่เว็บถาวร พอเคยซูมออกครั้งหนึ่ง
  // (ตอนที่ยังมีของกว้างเกินจอ) หน้าก็ลากไปมาได้ตลอดไป แม้แก้ของที่ล้นหมดแล้ว
  // และ iOS ยอมให้ลากหน้าเสมอเมื่อระดับซูมไม่ใช่ 100% ไม่ว่าหน้าเว็บจะเขียน CSS อะไร
  //
  // ⚠️ แคลร์ทักท้วงเรื่องการเข้าถึงไปแล้ว (คนสายตายาวขยายอ่านไม่ได้) พี่กันยืนยัน
  //    เว็บนี้ใช้ในห้องยาบนเครื่องของเจ้าหน้าที่เอง ไม่ใช่เว็บสาธารณะ
  //    และตัวหนังสือทั้งเว็บถูกตั้งให้ใหญ่พออ่านได้อยู่แล้ว (ช่องกรอกขั้นต่ำ 16px)
  //
  // 🚨 บรรทัดนี้อย่างเดียวไม่พอ — iOS 10 ขึ้นไปไม่สนใจ user-scalable ในหลายกรณี
  //    ต้องใช้คู่กับ touch-action ใน mobile.css และตัวดักท่าซูมใน MedReturnApp.jsx
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${plex.variable} ${charm.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
