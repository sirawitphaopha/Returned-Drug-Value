'use client';
// แกนกลางของแอป — เก็บสถานะทั้งหมดไว้ก้อนเดียวเหมือนมอคอัป (บรรทัด 840–910)
// เมธอดทั้งหมดอยู่ใน handlers/ · การวาดจออยู่ใน shell.jsx กับ pages/
import React from 'react';
import { installHandlers } from './handlers';
import { renderShell } from './shell';
import { LS, readLS, readCache } from './helpers';
import { todayISO } from '@/lib/format';

export default class MedReturnApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // มอคอัปไม่มีสองอันนี้ เพราะเป็นไฟล์เดียวไม่มีฝั่งเซิร์ฟเวอร์
      // ตอนเซิร์ฟเวอร์วาดจอยังไม่รู้ความกว้างจอ ถ้าวาดเลยจะเห็นหน้าจอมือถือแวบหนึ่งบนคอม
      loading: true,
      saving: false,

      screen: 'record',
      drugs: [],
      today: '',
      date: '',
      fyYear: 0,
      // ยอดสะสมปีงบ มาจากฐานข้อมูล ไม่ได้นับจากรายการในเครื่องเหมือนมอคอัป
      fy: { saved: 0, lost: 0, records: 0, qty: 0 },

      // บังคับดูหน้าจอแบบมือถือทั้งที่นั่งอยู่หน้าคอม — สวิตช์อยู่มุมขวาล่าง
      forceNarrow: false,

      // โหมดดูตัวอย่าง — ข้อมูลปลอมฝังในเว็บ ไม่แตะ Supabase เลย · บันทึกไม่ได้ตอนเปิดโหมด
      demo: false,

      query: '',
      hi: 0,               // แถวที่ไฮไลต์ในผลค้นหา — เลื่อนด้วยลูกศรขึ้น/ลง
      rowSortKey: '',      // คอลัมน์ที่กดเรียงในตารางรายการครั้งนี้
      rowSortDir: 'desc',
      hn: '',
      source: 'opd',
      sourceTouched: false,
      // ผู้ใช้แตะช่องวันที่เองในรอบการใช้งานนี้แล้วหรือยัง
      // อยู่ใน state เฉย ๆ ไม่ถูกเก็บลงเครื่อง จึงเป็นเท็จเสมอตอนเปิดเว็บใหม่
      dateTouched: false,
      // เน็ตหลุดอยู่หรือเปล่า (ผลตรวจข้อ ต-17)
      // 🚨 เริ่มเป็นเท็จเสมอ ห้ามอ่าน navigator.onLine ตอนสร้าง state
      //    เพราะฝั่งเซิร์ฟเวอร์ไม่มีตัวนี้ จะพังตั้งแต่วาดจอครั้งแรก
      offline: false,
      // ชื่อ รพ.สต. ต้นทาง — ใช้เฉพาะตอน source เป็น 'pcu'
      pcuSite: '',
      pcuSites: [],           // รายชื่อที่เลือกได้ มาจากการตั้งค่า (ฐานข้อมูล)
      orgName: 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่',
      favIds: [],

      // ── เซ็นชื่อก่อนส่งล็อต ────────────────────────────────────────────────
      // 1 รอบกดบันทึก = 1 ล็อต · ต้องรู้ว่าใครเป็นคนบันทึก ไม่งั้นสืบกลับไม่ได้
      staff: [],              // รายชื่อคนในห้องยา (ก๊อปมาจาก ME-DRP 16 คน แก้ได้ในหน้าตั้งค่า)
      recorder: '',           // คนที่เลือกไว้ตอนนี้ — ค้างไว้ทั้งเวร
      recorderMenuOpen: false,
      recorderBox: null,      // ตำแหน่ง+ความสูงเมนู วัดจากที่ว่างจริงตอนกดเปิด
      recorderNew: '',        // ช่องพิมพ์ชื่อใหม่ เผื่อมีคนใหม่มาช่วย
      addingRecorder: false,  // กางช่องพิมพ์ชื่อใหม่อยู่ไหม
      lastLot: '',            // เลขล็อตที่เพิ่งบันทึกสำเร็จ
      defaultSource: 'opd',
      settingsOpen: false,
      favQuery: '',
      showMore: false,
      saveFailed: false,
      saveError: '',
      rows: [],
      sheet: null,
      sheetQty: '',
      sheetDisp: 'reuse',
      sheetReason: '',
      sheetOff: null,        // ยานอกบัญชี รพ. — {name, unit, price} ที่พิมพ์เอง

      // ประวัติมาจากฐานข้อมูล ไม่ได้กองอยู่ในเครื่องเหมือนมอคอัป (มอคอัปใช้ state.records)
      histQuery: '',
      // ค้นแล้วไม่เจอเพราะลืมสลับแป้นพิมพ์ ระบบแปลงให้แล้วค้นใหม่
      // histSwapLabel = คำที่ใช้ค้นจริง เอาไปโชว์ในป้ายข้างช่องค้นหา
      histSwapped: false,
      histSwapLabel: '',
      histRange: 'month',
      histRows: [],
      histTotal: 0,
      histSaved: 0,
      histLoading: false,
      histTrash: false,      // เปิดดูถังขยะแทนรายการปกติ
      histLot: '',           // ดูเฉพาะล็อตเดียว (เว้นว่าง = ทุกล็อต)
      histFrom: '',          // ช่วงวันที่เลือกเอง
      histTo: '',
      // 🗑 เคยมี histOffset อยู่ตรงนี้ — ลบแล้ว (ผลตรวจข้อ ต-18)
      //    ถูกตั้งค่าอยู่ 4 จุดแต่ไม่มีใครอ่านเลย ตัวที่ใช้จริงคือ
      //    histRows.length + histMore.length ซึ่งนับจากของที่มีอยู่จริงในมือ
      histSortKey: '',       // คอลัมน์ที่กดเรียง (ว่าง = เรียงวันใหม่→เก่าตามที่เซิร์ฟเวอร์ส่งมา)
      histSortDir: 'desc',
      histMore: [],          // แถวที่โหลดเพิ่มมาแล้ว
      hotIds: [],            // รหัสยาที่ถูกคืนบ่อย — ช่องค้นหาดันขึ้นก่อน
      lots: [],              // รายการ Lot — หน้าแยกดูราย Lot
      lotsLoading: false,
      lotsRange: 'month',    // ช่วงเวลาของหน้ารายการ Lot (แยกจากหน้าประวัติ)
      lotsShown: 40,
      lotsQuery: '',         // ช่องค้นในหน้ารายการ Lot — ค้นเลข Lot ชื่อผู้บันทึก ชื่อ รพ.สต.
      lotsSrcFilter: '',     // ตัวกรองแหล่งที่มา · ว่าง = ทุกแหล่ง
      lotsSiteFilter: '',    // ตัวกรอง รพ.สต. รายแห่ง · ใช้ได้เฉพาะตอนเลือกแหล่งที่มาเป็น รพ.สต.
      lotsFrom: '',          // ช่วงวันที่ที่เลือกเอง — ว่างจนกว่าผู้ใช้จะกรอก
      lotsTo: '',
      lotsSortKey: '',       // คอลัมน์ที่กดเรียง · ว่าง = เรียงตามที่ฐานส่งมา (วันที่ใหม่ก่อน)
      lotsSortDir: 'desc',         // แสดงทีละ 40 Lot — ปีงบหนึ่งมีหลายร้อย วาดหมดทีเดียวจอค้าง
      // ── หน้าคลังยา (ตาราง drugs ของกลาง ใช้ร่วม 3 เว็บ) ──────────────────
      catalog: [],           // ยาดิบทั้งตาราง รวมตัวที่ซ่อนไว้ (ต่างจาก drugs ที่กรองแล้ว)
      catLoading: false,
      catSearch: '',
      catFilters: [],        // ตัวกรอง — กดหลายอันพร้อมกันได้
      catSort: null,         // { key, dir } — กดหัวคอลัมน์เพื่อเรียง
      catShowFull: false,    // คอลัมน์ "ชื่อที่เห็นตอนค้นหา" — ยาวมาก จึงซ่อนไว้ตั้งต้น
      catEdit: null,         // ยาที่กำลังแก้อยู่ในป๊อป
      catEditOrig: null,     // ค่าก่อนแก้ ใช้เทียบว่าแก้อะไรไปแล้วหรือยัง
      catEditNew: false,     // ป๊อปนี้เป็นการเพิ่มยาใหม่ ไม่ใช่แก้ของเดิม
      catConfirmClose: false,
      catBusy: false,
      catHideTarget: null,   // ยาที่กำลังจะซ่อน (รอยืนยัน)
      catLog: null,          // ประวัติการแก้ที่กำลังเปิดดู
      // ── แก้ราคาย้อนหลัง (พี่กันสั่ง 25 ส.ค. 2569) ────────────────────────
      // โผล่เองเมื่อแก้ราคายาแล้วพบว่ามีรายการเก่าที่ใช้ราคาอื่นอยู่
      // 🚨 ระบบแค่ถาม ไม่แก้ให้เอง — ราคาที่แช่ไว้อาจถูกต้องแล้วก็ได้
      //    (ยาขึ้นราคากลางปี = ของเก่าต้องคงราคาเดิม) คนต้องเป็นคนตัดสิน
      priceFix: null,
      slipLot: null,         // ใบสรุป Lot ที่เปิดอยู่ (null = ไม่ได้เปิด)
      slipRows: [],          // รายการยาใน Lot นั้น — ดึงตอนกดเปิดใบ
      slipLoading: false,
      // ── หน้าต่างแก้ไขล็อต (พี่กันสั่ง 25 ส.ค. 2569) ────────────────────────
      // เก็บทั้งค่าที่กำลังแก้และค่าเดิม (orig) ไว้ในก้อนเดียว เพื่อเทียบว่าแตะอะไรไปแล้ว
      lotEdit: null,
      lotEditLoading: false,
      lotEditBusy: false,
      lotEditConfirm: false,  // หน้าต่างยืนยันก่อนบันทึกจริง
      lotEditQtyId: null,     // แถวที่กำลังแก้จำนวนอยู่
      lotEditQtyText: '',
      lotEditLog: [],         // ประวัติการแก้ของล็อตนี้ (จาก mr_lot_audit)
      lotEditLogOpen: false,
      // ชื่อคนที่กดแก้ — เลือกในหน้าต่างยืนยันเอง ไม่ผูกกับช่องผู้บันทึกในหน้าบันทึก
      lotEditWho: '',
      confirm: null,

      // หน้าสรุป — ยอดทั้งปีงบคิดมาจากฐานข้อมูลก้อนเดียว
      sum: null,
      sumLoading: false,
      sumFy: 0,              // ปีงบที่เลือกดู (0 = ปีปัจจุบัน)
      sumFyYears: [],
      topReturned: [],       // ยาที่ถูกคืนบ่อยที่สุด — เรียงตามจำนวนครั้ง
      exporting: false,
      dark: false,
      animSaved: 0,
      toast: null,
      vw: 430,
      // มีเมาส์จริงไหม — วัดตอน componentDidMount ด้วย (pointer: fine)
      // ใช้กันสวิตช์ "คอม/มือถือ" ไม่ให้โผล่บนเครื่องสัมผัสจริง (พี่กันสั่ง — ขึ้นมาแล้วบังจอ)
      // ความกว้างอย่างเดียวไม่พอ แท็บเล็ตแนวนอนกว้าง 1024 จะหลุดขึ้นมา
      hasMouse: true,
      pending: null,
      qtyInput: '',
      pendingDisp: 'reuse',
      // หน้าต่างเลือกเหตุผลที่ต้องทำลาย (ผลตรวจข้อ ส-8)
      // เก็บสิ่งที่จะทำหลังเลือกไว้ในนี้ ตัวหน้าต่างจึงไม่ต้องรู้ว่าถูกเปิดจากที่ไหน
      reasonAsk: null,
      // เหตุผลที่เลือกไว้ตอนกดปุ่มทำลาย ก่อนกดเพิ่มเข้ารายการ
      pendingReason: '',
      // เครื่องคิดเลขในช่องจำนวน (คอมเท่านั้น · พี่กันสั่ง 25 ส.ค. 2569)
      calcOpen: false,
      // แถวที่กำลังแก้จำนวนอยู่ในตาราง "รายการในครั้งนี้" — เก็บเป็นข้อความ
      // เพราะระหว่างพิมพ์สูตร ("55+10") ยังไม่ใช่ตัวเลขจนกว่าจะกด Enter
      editQtyRid: null,
      editQtyText: '',
      // ก้อนการบันทึก 1 ครั้ง — กดลองส่งใหม่ต้องใช้ก้อนเดิม ไม่งั้นได้ข้อมูลซ้ำสองชุด
      batchId: null,

      // หน้าจัดการราคายา — ไม่มีในมอคอัป
      priceItems: [],
      priceLoading: false,
      priceSaving: false,
      priceQuery: '',
      priceFilter: 'all',
      priceEdits: {},
      priceShown: 40,

      // ── นำเข้าราคาจากไฟล์ HIS ────────────────────────────────────────────
      // hisRows = ผลจับคู่รายตัว ถืออยู่ในหน่วยความจำอย่างเดียว
      // ไม่เก็บลง localStorage เพราะเป็นข้อมูลทั้งบัญชียาของโรงพยาบาล
      hisOpen: false,
      hisRows: [],
      hisTotal: 0,
      hisFileName: '',
      hisReading: false,
      hisError: '',
      hisTab: 'sure',
      hisSaving: false,
      hisBackfill: true,

      // เว็บล็อกด้วยรหัสผ่านห้องยาอยู่ไหม — มาจาก /api/bootstrap
      // ปุ่มออกจากระบบจะโผล่เฉพาะตอนล็อกอยู่จริง
      authOn: false
    };

    this.searchRef = React.createRef();
    this.qtyRef = React.createRef();
    this.sheetQtyRef = React.createRef();
    // พื้นที่เลื่อนหลักของทั้งแอป — goScreen ใช้เด้งกลับบนสุดตอนสลับแท็บ
    this.scrollRef = React.createRef();

    // ── วัดความสูงแถบกรองหน้าประวัติ ─────────────────────────────────────────
    // หัวตารางต้องติดใต้แถบกรองพอดี ห่างเกินไปจะเห็นแถวลอดผ่าน ชิดเกินไปก็ทับกัน
    // ตั้งเลขตายตัวไม่ได้ เพราะแถบกรองขึ้นบรรทัดใหม่เองเมื่อจอแคบ (flex-wrap)
    // ref แบบฟังก์ชันจะถูกเรียกตอนของโผล่/หายจากจอ = ต่อและถอดตัววัดได้ถูกจังหวะ
    this._histHeadRO = null;
    this.histHeadRef = (el) => {
      if (this._histHeadRO) { this._histHeadRO.disconnect(); this._histHeadRO = null; }
      if (!el || typeof ResizeObserver === 'undefined') return;
      const write = () => document.documentElement.style.setProperty('--histhead', el.offsetHeight + 'px');
      write();
      this._histHeadRO = new ResizeObserver(write);
      this._histHeadRO.observe(el);
    };

    // ── วัดความสูงแถบค้นหาของหน้าคลังยา ────────────────────────────────────
    // หัวตารางต้องตรึงพอดีใต้แถบค้นหาที่ตรึงอยู่ก่อนแล้ว
    // ตั้งเลขตายตัวไม่ได้ เพราะชิปตัวกรองขึ้นบรรทัดใหม่เองเมื่อจอแคบ (flex-wrap)
    this._catHeadRO = null;
    this.catHeadRef = (el) => {
      if (this._catHeadRO) { this._catHeadRO.disconnect(); this._catHeadRO = null; }
      if (!el || typeof ResizeObserver === 'undefined') return;
      const write = () => document.documentElement.style.setProperty('--cathead', el.offsetHeight + 'px');
      write();
      this._catHeadRO = new ResizeObserver(write);
      this._catHeadRO.observe(el);
    };

    // ── วัดความสูงของแถบล่างจอในโหมดมือถือ ──────────────────────────────────
    // ข้อความเด้ง (toast) ของมอคอัปตรึงไว้ที่ bottom:96px ตายตัว
    // แต่ในเว็บจริงหน้าบันทึกมีแถบบันทึกซ้อนอยู่เหนือแถบเมนู รวมกันสูงกว่า 200px
    // ข้อความเด้ง "บันทึกสำเร็จ" จึงไปทับตัวเลขมูลค่ารวมพอดี = อ่านไม่ออกทั้งคู่
    //
    // มีสองกล่องแยกกัน (แถบเมนู + แถบบันทึก) และแถบบันทึกโผล่เฉพาะบางหน้า
    // จึงวัดทีละกล่องแล้วบวกกัน เขียนผลรวมลง --bottombar ให้ toast เอาไปใช้
    this._barRO = { nav: null, save: null };
    this._barH = { nav: 0, save: 0 };
    this._writeBottomBar = () => {
      const total = this._barH.nav + this._barH.save;
      document.documentElement.style.setProperty('--bottombar', total + 'px');
    };
    // สร้าง ref ไว้ตายตัวใน constructor — ถ้าสร้างใหม่ทุกครั้งที่วาดจอ
    // React จะถอดแล้วต่อตัววัดใหม่ทุกเฟรม
    const makeBarRef = (name) => (el) => {
      if (this._barRO[name]) { this._barRO[name].disconnect(); this._barRO[name] = null; }
      if (!el || typeof ResizeObserver === 'undefined') {
        this._barH[name] = 0;              // กล่องหายไปจากจอ = ไม่นับความสูงของมัน
        this._writeBottomBar();
        return;
      }
      const write = () => { this._barH[name] = el.offsetHeight; this._writeBottomBar(); };
      write();
      this._barRO[name] = new ResizeObserver(write);
      this._barRO[name].observe(el);
    };
    this.navBarRef = makeBarRef('nav');
    this.saveBarRef = makeBarRef('save');

    // วาดใหม่เฉพาะตอนความกว้างเปลี่ยนจริง — ลากขอบหน้าต่างจะยิง event รัวมาก
    // แต่ละครั้งวิ่ง renderVals ใหม่ทั้งก้อน (กรองยา 417 ตัว) เครื่องเก่าจะกระตุก
    this._onResize = () => {
      if (window.innerWidth !== this.state.vw) this.setState({ vw: window.innerWidth });
    };
    this._raf = null;
    this._toastTimer = null;
    this._orgTimer = null;
    this._histTimer = null;

    // แถวที่กำลังถูกไฮไลต์ในรายการผลค้นยา — ใช้เลื่อนกรอบตามลูกศรขึ้น/ลง
    // (ดู componentDidUpdate ด้านล่าง)
    this.hiRef = React.createRef();

    installHandlers(this);
  }

  // ── กดลูกศรแล้วกรอบผลค้นหาต้องเลื่อนตาม ────────────────────────────────────
  // 🚨 บั๊กที่พี่กันเจอ 10 ส.ค. 2569: กรอบผลค้นหาสูงได้แค่ ~290px (เห็นราว 5 แถว)
  //    กดลูกศรลงไปแถวที่ 6 ตัวที่ถูกเลือกไปซ่อนอยู่ใต้ขอบกรอบ กรอบไม่เลื่อนตาม
  //    ผู้ใช้กดต่อไปเรื่อย ๆ แบบตาบอด ไม่รู้ว่ากำลังเลือกยาตัวไหนอยู่ = เลือกผิดตัวได้
  //
  // block:'nearest' = เลื่อนน้อยที่สุดเท่าที่จำเป็น ถ้าแถวอยู่ในสายตาแล้วจะไม่ขยับเลย
  // และเลื่อนเฉพาะกรอบที่ใกล้ที่สุด ไม่ลากทั้งหน้าตาม
  //
  // ทำที่นี่แทนที่จะทำใน ref callback เพราะ ref ถูกเรียกทุกครั้งที่วาดจอ
  // ซึ่งจะดึงกรอบกลับตอนผู้ใช้เลื่อนดูเองด้วยเมาส์
  componentDidUpdate(prevProps, prevState) {
    if (prevState.hi !== this.state.hi && this.hiRef.current) {
      this.hiRef.current.scrollIntoView({ block: 'nearest' });
    }
  }

  componentDidMount() {
    // วาดจอจากของที่มีในเครื่องก่อน ไม่ต้องรอเซิร์ฟเวอร์ แล้วค่อยยิงไปทับ
    const draft = readLS(LS.draft);
    const dark = readLS(LS.dark) === 1;
    const drugs = readCache(LS.drugs);
    const setting = readCache(LS.setting);

    const patch = { loading: false, vw: window.innerWidth, dark: dark };

    // เครื่องสัมผัสล้วน (มือถือ/แท็บเล็ต) → (pointer: fine) เป็นเท็จ = ซ่อนสวิตช์มุมมอง
    // โน้ตบุ๊กจอสัมผัสที่ต่อเมาส์ยังนับเป็น fine เพราะดูตัวชี้หลัก
    //
    // ต้องคอยฟังการเปลี่ยนแปลงด้วย ไม่ใช่วัดครั้งเดียวจบ — เสียบเมาส์เข้าแท็บเล็ต
    // หรือถอดออกจากแท่นวาง ค่านี้เปลี่ยนได้กลางคัน ถ้าไม่ฟังไว้สวิตช์จะค้างผิดสถานะ
    try {
      this._mqMouse = window.matchMedia('(pointer: fine)');
      patch.hasMouse = this._mqMouse.matches;
      this._onMouseKind = (e) => this.setState({ hasMouse: e.matches });
      if (this._mqMouse.addEventListener) this._mqMouse.addEventListener('change', this._onMouseKind);
      else this._mqMouse.addListener(this._onMouseKind);        // Safari รุ่นเก่า
    } catch (e) { patch.hasMouse = true; }

    // วันที่ต้องมีค่าตั้งแต่วินาทีแรก ไม่งั้นถ้า /api/bootstrap ล่ม (เน็ตโรงพยาบาลสะดุด)
    // ช่องวันที่จะว่างตลอด แล้วกดบันทึกกี่ครั้งก็ไม่ผ่าน โดยไม่มีใครบอกว่าทำไม
    patch.today = todayISO();
    patch.date = patch.today;

    // ร่างรุ่นเก่าเก็บเป็น array ล้วน รุ่นใหม่เป็น object ที่มี batchId/hn/source/date ด้วย
    const box = Array.isArray(draft) ? { rows: draft } : (draft || {});
    // กรองแถวที่รูปแบบเสียทิ้ง ไม่งั้นแถวที่ขาดช่อง price จะทำให้จอขาวถาวร
    // (รีเฟรชก็อ่านของเสียชุดเดิมกลับมาอีก วนไม่จบ)
    if (Array.isArray(box.rows)) {
      patch.rows = box.rows.filter(
        (r) => r && r.rid != null && typeof r.price === 'number' && typeof r.qty === 'number'
      );
      if (box.batchId) patch.batchId = box.batchId;
      if (typeof box.hn === 'string') patch.hn = box.hn;
      if (typeof box.source === 'string') patch.source = box.source;
      if (box.sourceTouched) patch.sourceTouched = true;
      if (typeof box.pcuSite === 'string') patch.pcuSite = box.pcuSite;
      if (typeof box.date === 'string' && box.date) patch.date = box.date;
    }

    if (Array.isArray(drugs)) patch.drugs = drugs;
    if (setting && Array.isArray(setting.favIds)) {
      patch.orgName = setting.orgName;
      patch.favIds = setting.favIds;
      patch.defaultSource = setting.defaultSource;
      if (!patch.sourceTouched) patch.source = setting.defaultSource;
    }

    this.setState(patch, () => {
      this.animateTo(this.savedTotal());
      this.boot();
    });
    window.addEventListener('resize', this._onResize);
    window.addEventListener('keydown', this._onKey);
    // แป้นเครื่องคิดเลขต้องปิดเมื่อกดที่อื่น — ป๊อปตัวเล็กที่ไม่มีฉากหลังคลุมจอ
    // ถ้าไม่ปิดจะค้างบังตารางรายการอยู่ตลอด ต้องย้อนกลับมากดปุ่มเดิม
    document.addEventListener('mousedown', this._onDocDown);
    // ทวนวันทุก 1 นาที — คอมห้องยาเปิดค้างข้ามคืนเป็นเรื่องปกติ
    this._dayTimer = setInterval(this.checkDayRollover, 60000);
    document.addEventListener('visibilitychange', this._onVisible);
    window.addEventListener('online', this._onOnline);
    // ⚠️ เดิมฟังแต่ 'online' — รู้ตอนเน็ตกลับมา แต่ไม่เคยรู้ตอนเน็ตหลุด
    window.addEventListener('offline', this._onOffline);
    // เช็คสถานะจริงตอนเปิดเว็บด้วย — เผลอเปิดตอนเน็ตหลุดอยู่แล้วจะได้เห็นป้ายทันที
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.setState({ offline: true });
    }

    // ป๊อปอัปหนีแป้นพิมพ์บนมือถือ — บาง iOS ไม่หดพื้นที่ให้แม้ตั้ง interactiveWidget แล้ว
    // เลยวัดความสูงจริงของแป้นพิมพ์เอง แล้วส่งเป็นตัวแปร --kb ให้ CSS ใช้ดันป๊อปอัปขึ้น
    if (window.visualViewport) {
      this._vv = window.visualViewport;
      this._onVV = () => {
        const gap = Math.max(0, window.innerHeight - this._vv.height - this._vv.offsetTop);
        document.documentElement.style.setProperty('--kb', Math.round(gap) + 'px');
      };
      this._vv.addEventListener('resize', this._onVV);
      this._vv.addEventListener('scroll', this._onVV);
    }
  }

  // กดที่อื่นแล้วปิดแป้นเครื่องคิดเลข — เป็นป๊อปตัวเล็กที่ไม่มีฉากหลังคลุมจอ
  // (ใส่ฉากหลังคลุมไม่ได้ เพราะจะบังช่องจำนวนที่ต้องพิมพ์ต่อได้ระหว่างแป้นเปิดอยู่)
  // 🚨 ต้องเป็น mousedown ไม่ใช่ click — ปุ่มบนแป้นทำงานตอน click
  //    ถ้าดักที่ click แป้นจะปิดก่อนปุ่มได้ทำงาน กดเลขแล้วไม่เข้าช่อง
  _onDocDown = (e) => {
    if (!this.state.calcOpen) return;
    const box = this.qtyRef.current && this.qtyRef.current.closest('div[style]');
    if (box && box.contains(e.target)) return;   // กดในกล่องช่องจำนวน (รวมแป้น) = ไม่ปิด
    this.setState({ calcOpen: false });
  };

  // Esc ปิดหน้าต่างที่เปิดอยู่ทีละชั้น เริ่มจากชั้นบนสุด
  // (หน้าต่างยืนยันลบกดพื้นหลังไม่ปิดโดยตั้งใจ ถ้าไม่มี Esc ก็เหลือทางเดียวคือเมาส์)
  _onKey = (e) => {
    if (e.key !== 'Escape') return;
    const st = this.state;
    if (st.confirm) { this.closeConfirm(); return; }
    if (st.recorderMenuOpen) { this.closeRecorderMenu(); return; }
    if (st.sheet) { this.closeSheet(); return; }
    // แป้นเครื่องคิดเลขกับช่องแก้จำนวนอยู่ชั้นในสุด ปิดก่อนหน้าต่างตั้งค่า
    if (st.calcOpen) { this.setState({ calcOpen: false }); return; }
    if (st.editQtyRid) { this.setState({ editQtyRid: null, editQtyText: '' }); return; }
    // หน้าต่างแก้ไขล็อตซ้อนกัน 3 ชั้น ต้องปิดจากบนลงล่าง
    if (st.lotEditQtyId) { this.setState({ lotEditQtyId: null, lotEditQtyText: '' }); return; }
    if (st.lotEditConfirm) { this.setState({ lotEditConfirm: false }); return; }
    if (st.lotEdit) { this.closeLotEdit(); return; }
    // ใบสรุปล็อตกดพื้นหลังไม่ปิดโดยตั้งใจ (กันปิดพลาดตอนกำลังจะสั่งพิมพ์)
    // ถ้าไม่มี Esc ก็เหลือทางเดียวคือเล็งปุ่ม ✕ มุมบนขวา — เจอเองตอนเทส 25 ส.ค. 2569
    if (st.slipLot) { this.closeLotSlip(); return; }
    if (st.settingsOpen) { this.setState({ settingsOpen: false, favQuery: '' }); }
  };

  _onVisible = () => {
    if (document.hidden) return;
    this.checkDayRollover();
    // กลับมาที่แท็บนี้อีกที = จังหวะที่คุ้มจะถามว่าคลังยาถูกแก้ไปหรือยัง
    // ไม่ตั้งตัวจับเวลาถามเป็นระยะ เพราะการแก้ชื่อยาเกิดปีละไม่กี่ครั้ง
    // แต่เว็บเปิดค้างทั้งวัน — ถามทุก 30 วินาทีจะได้คำขอเปล่าวันละพันกว่าครั้ง
    this.syncDrugs();
    this.retryFailedSave();
  };

  // เน็ตโรงพยาบาลหลุดแล้วกลับมา — ระหว่างที่หลุดอาจมีคนแก้ยาไปแล้ว
  _onOnline = () => { this.setState({ offline: false }); this.syncDrugs(); this.retryFailedSave(); };
  _onOffline = () => { this.setState({ offline: true }); };

  // ── ส่งซ้ำอัตโนมัติเมื่อเน็ตกลับมา ─────────────────────────────────────────
  //
  // พี่กันสั่ง 25 ส.ค. 2569: "ทำระบบไว้ด้วย ถ้าเกิดเน็ตมันพัง มันต้องขึ้นบอกด้วย
  // ไม่ใช่ส่งแล้วพังโดยไม่เห็น"
  //
  // เดิมมีกล่องแดงบอกอยู่แล้ว แต่ต้องกด "ลองส่งใหม่" เอง
  // ถ้าเภสัชกรปิดแท็บไปก่อนโดยลืมกด ของทั้งล็อตค้างอยู่ในเครื่องเงียบ ๆ
  //
  // 🚨 ใช้ batchId เดิมเสมอ (app.save เก็บไว้ใน state ให้แล้ว)
  //    ไม่งั้นระบบกันบันทึกซ้ำใช้ไม่ได้ แล้วได้ข้อมูลสองชุด
  //    กรณีที่เจอจริงบนเน็ตโรงพยาบาลคือ "ข้อมูลเข้าฐานไปแล้วแต่คำตอบหายกลางทาง"
  //
  // 🚨 หน่วง 1.2 วินาทีก่อนยิง — เหตุการณ์ online มาถึงก่อนที่เน็ตจะใช้ได้จริง
  //    ยิงทันทีมักล้มซ้ำแล้วผู้ใช้เห็นกล่องแดงกะพริบเปล่า ๆ
  retryFailedSave = () => {
    const st = this.state;
    if (!st.saveFailed || !st.rows.length || this._saving || st.demo) return;
    if (this._retryTimer) clearTimeout(this._retryTimer);
    this._retryTimer = setTimeout(() => {
      const cur = this.state;
      if (!cur.saveFailed || !cur.rows.length || this._saving) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      this.toast('เน็ตกลับมาแล้ว กำลังส่งข้อมูลที่ค้างอยู่', '', false);
      this.save();
    }, 1200);
  };

  componentWillUnmount() {
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    if (this._histHeadRO) { this._histHeadRO.disconnect(); this._histHeadRO = null; }
    if (this._catHeadRO) { this._catHeadRO.disconnect(); this._catHeadRO = null; }
    if (this._mqMouse && this._onMouseKind) {
      if (this._mqMouse.removeEventListener) this._mqMouse.removeEventListener('change', this._onMouseKind);
      else this._mqMouse.removeListener(this._onMouseKind);
    }
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    if (this._orgTimer) clearTimeout(this._orgTimer);
    if (this._histTimer) clearTimeout(this._histTimer);
    if (this._dayTimer) clearInterval(this._dayTimer);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKey);
    document.removeEventListener('mousedown', this._onDocDown);
    document.removeEventListener('visibilitychange', this._onVisible);
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('offline', this._onOffline);
    if (this._vv && this._onVV) {
      this._vv.removeEventListener('resize', this._onVV);
      this._vv.removeEventListener('scroll', this._onVV);
    }
  }

  render() {
    return renderShell(this);
  }
}
