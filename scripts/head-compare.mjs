import fs from 'fs';
import puppeteer from 'puppeteer-core';
import path from 'path';
import { pathToFileURL } from 'url';
const CH=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(q=>fs.existsSync(q));
const pw=(fs.readFileSync('.env.local','utf8').split(/\r?\n/).find(l=>l.startsWith('MRV_PASSWORD='))||'').slice(13).trim();
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const BASE='http://127.0.0.1:3000';
const b=await puppeteer.launch({executablePath:CH,headless:'new',args:['--font-render-hinting=none']});
const p=await b.newPage();
await p.setViewport({width:430,height:900,deviceScaleFactor:2});
await p.goto(BASE+'/login',{waitUntil:'networkidle2'});
if(p.url().indexOf('/login')>=0&&pw){await p.type('#mrv-pw',pw);
  await Promise.all([p.waitForNavigation({waitUntil:'networkidle2'}).catch(()=>{}),p.click('button[type="submit"]')]);}
await p.evaluate(()=>{try{localStorage.setItem('mrv.device',JSON.stringify('เครื่องทดสอบอัตโนมัติ'));}catch(e){}});
await p.goto(BASE+'/',{waitUntil:'networkidle2'});
await wait(2500);
const กด=(t)=>p.evaluate((t)=>{const e=[...document.querySelectorAll('[role="button"]')].filter(x=>x.textContent.trim().indexOf(t)===0)[0];if(e){e.click();return true;}return false;},t);

fs.mkdirSync('out/ui',{recursive:true});
const ถ่าย=async(ชื่อ)=>{ const f='out/ui/head-'+ชื่อ+'.png';
  await p.screenshot({path:f, clip:{x:0,y:0,width:430,height:160}}); return f; };

const ไฟล์={};
ไฟล์['บันทึก'] = await ถ่าย('record');
await กด('ประวัติ'); await wait(2000); ไฟล์['ประวัติ'] = await ถ่าย('history');
await กด('สรุป'); await wait(2200); ไฟล์['สรุป'] = await ถ่าย('summary');

// ── ประกอบภาพเทียบ ─────────────────────────────────────────────────────────
const b64=(f)=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const แถว=(ชื่อ,f)=>`
  <div class="band">
    <div class="tag">${ชื่อ}</div>
    <img src="${b64(f)}">
  </div>`;
const html=`<meta charset="utf-8"><style>
  body{margin:0;background:#20241f;font:400 13px Sarabun,sans-serif;color:#fff;padding:16px 16px 22px}
  h2{font:700 16px Sarabun,sans-serif;margin:0 0 3px}
  .note{font:400 12px/1.6 Sarabun,sans-serif;color:#b9c2bc;margin:0 0 14px}
  .wrap{position:relative;width:430px}
  .band{position:relative;margin-bottom:12px;border:1px solid #4a534b;border-radius:8px;overflow:hidden}
  .band img{display:block;width:430px}
  .tag{position:absolute;left:0;top:0;z-index:4;background:#c2543c;color:#fff;font:700 10px/1 Sarabun,sans-serif;padding:4px 7px;border-radius:0 0 7px 0}
  .g{position:absolute;top:0;bottom:22px;width:0;border-left:2px dashed #ff5f45;z-index:5;pointer-events:none}
  .glbl{position:absolute;bottom:0;transform:translateX(-50%);font:700 10px/1 Sarabun,sans-serif;color:#ff8f7d;white-space:nowrap;z-index:5}
</style>
<h2>หัวสามหน้า วางซ้อนเทียบกัน</h2>
<p class="note">เส้นประแดง = แนวที่ควรตรงกันทั้งสามหน้า · จอ 430 จุด</p>
<div class="wrap">
  ${แถว('บันทึก',ไฟล์['บันทึก'])}
  ${แถว('ประวัติ',ไฟล์['ประวัติ'])}
  ${แถว('สรุป',ไฟล์['สรุป'])}
  <div class="g" style="left:20px"></div><div class="glbl" style="left:20px">ขอบซ้าย</div>
  <div class="g" style="left:410px"></div><div class="glbl" style="left:404px">ขอบขวา</div>
</div>`;
fs.writeFileSync('out/ui/_cmp.html',html,'utf8');
const p2=await b.newPage();
await p2.setViewport({width:470,height:640,deviceScaleFactor:2});
await p2.goto(pathToFileURL(path.resolve('out/ui/_cmp.html')).href,{waitUntil:'networkidle0'});
await wait(600);
await p2.screenshot({path:'out/ui/head-compare.png',fullPage:true});
console.log('ทำภาพเทียบแล้ว out/ui/head-compare.png');
await b.close();
