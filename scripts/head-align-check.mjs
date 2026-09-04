import fs from 'fs';
import puppeteer from 'puppeteer-core';
const CH=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(q=>fs.existsSync(q));
const pw=(fs.readFileSync('.env.local','utf8').split(/\r?\n/).find(l=>l.startsWith('MRV_PASSWORD='))||'').slice(13).trim();
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const BASE='http://127.0.0.1:3000';
const b=await puppeteer.launch({executablePath:CH,headless:'new'});
const p=await b.newPage();
await p.setViewport({width:430,height:900});
await p.evaluateOnNewDocument(() => {
  const st = document.createElement('style');
  st.textContent = '*::-webkit-scrollbar{width:15px;height:15px}*::-webkit-scrollbar-thumb{background:#bbb}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st));
});
await p.goto(BASE+'/login',{waitUntil:'networkidle2'});
if(p.url().indexOf('/login')>=0&&pw){await p.type('#mrv-pw',pw);
  await Promise.all([p.waitForNavigation({waitUntil:'networkidle2'}).catch(()=>{}),p.click('button[type="submit"]')]);}
await p.evaluate(()=>{try{localStorage.setItem('mrv.device',JSON.stringify('เครื่องทดสอบอัตโนมัติ'));}catch(e){}});
await p.goto(BASE+'/',{waitUntil:'networkidle2'});
await wait(2500);
const กด=(t)=>p.evaluate((t)=>{const e=[...document.querySelectorAll('[role="button"]')].filter(x=>x.textContent.trim().indexOf(t)===0)[0];if(e){e.click();return true;}return false;},t);

const วัด=()=>p.evaluate(()=>{
  const g=(sel)=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();
    return {ซ้าย:Math.round(r.left),ขวา:Math.round(r.right),บน:Math.round(r.top),ล่าง:Math.round(r.bottom),กว้าง:Math.round(r.width),สูง:Math.round(r.height)};};
  const i=g('[aria-label="เกี่ยวกับ"]'), s=g('[aria-label="ตั้งค่า"]');
  const cs=(sel)=>{const e=document.querySelector(sel);if(!e)return null;const c=getComputedStyle(e);return {พื้น:c.backgroundColor,ขอบ:c.borderColor,อักษร:c.color,คลาส:e.className};};
  const ci=cs('[aria-label="เกี่ยวกับ"]'), cg=cs('[aria-label="ตั้งค่า"]');
  const mk=(()=>{const x=[...document.querySelectorAll('span')].find(y=>y.textContent.trim()==='฿');
    if(!x||!x.parentElement)return null;const r=x.parentElement.getBoundingClientRect();
    return {ซ้าย:Math.round(r.left),บน:Math.round(r.top),สูง:Math.round(r.height)};})();
  return {i,s,mk,ci,cg,ช่องไฟ: (i&&s)?Math.round(s.ซ้าย-i.ขวา):null};
});

const out={};
out['บันทึก']=await วัด();
await กด('ประวัติ'); await wait(2000); out['ประวัติ']=await วัด();
await กด('สรุป'); await wait(2200); out['สรุป']=await วัด();

const K=['บันทึก','ประวัติ','สรุป'];
const แถว=(ชื่อ,f)=>{
  const v=K.map(k=>{try{return String(f(out[k]));}catch(e){return '—';}});
  const ตรง = v[0]===v[1] && v[1]===v[2] ? '✅' : '❌ ไม่ตรง';
  console.log('  '+ชื่อ.padEnd(20)+v.map(x=>x.padEnd(10)).join('')+ตรง);
};
console.log('จอ 430 จุด · หน่วย px');
console.log('                      บันทึก    ประวัติ   สรุป');
แถว('ℹ ขอบซ้าย', o=>o.i.ซ้าย);
แถว('ℹ ขอบบน', o=>o.i.บน);
แถว('ℹ ขนาด', o=>o.i.กว้าง+'x'+o.i.สูง);
แถว('⚙ ขอบซ้าย', o=>o.s.ซ้าย);
แถว('⚙ ขอบขวา', o=>o.s.ขวา);
แถว('⚙ ขอบบน', o=>o.s.บน);
แถว('ช่องไฟระหว่างปุ่ม', o=>o.ช่องไฟ);
แถว('โลโก้ ขอบบน', o=>o.mk.บน);
console.log('');
แถว('ℹ พื้น', o=>o.ci.พื้น);
แถว('ℹ ขอบ', o=>o.ci.ขอบ);
แถว('ℹ อักษร', o=>o.ci.อักษร);
แถว('⚙ พื้น', o=>o.cg.พื้น);
แถว('⚙ ขอบ', o=>o.cg.ขอบ);
แถว('⚙ อักษร', o=>o.cg.อักษร);
แถว('คลาส hover', o=>o.ci.คลาส);
await b.close();
