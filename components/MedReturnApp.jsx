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
      histRange: 'month',
      histRows: [],
      histTotal: 0,
      histSaved: 0,
      histLoading: false,
      histTrash: false,      // เปิดดูถังขยะแทนรายการปกติ
      histLot: '',           // ดูเฉพาะล็อตเดียว (เว้นว่าง = ทุกล็อต)
      histFrom: '',          // ช่วงวันที่เลือกเอง
      histTo: '',
      histOffset: 0,         // ดูเพิ่มทีละ 60 แถว
      histSortKey: '',       // คอลัมน์ที่กดเรียง (ว่าง = เรียงวันใหม่→เก่าตามที่เซิร์ฟเวอร์ส่งมา)
      histSortDir: 'desc',
      histMore: [],          // แถวที่โหลดเพิ่มมาแล้ว
      lots: [],              // รายการ Lot — หน้าแยกดูราย Lot
      lotsLoading: false,
      lotsRange: 'month',    // ช่วงเวลาของหน้ารายการ Lot (แยกจากหน้าประวัติ)
      lotsShown: 40,         // แสดงทีละ 40 Lot — ปีงบหนึ่งมีหลายร้อย วาดหมดทีเดียวจอค้าง
      slipLot: null,         // ใบสรุป Lot ที่เปิดอยู่ (null = ไม่ได้เปิด)
      slipRows: [],          // รายการยาใน Lot นั้น — ดึงตอนกดเปิดใบ
      slipLoading: false,
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

    installHandlers(this);
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
    // ทวนวันทุก 1 นาที — คอมห้องยาเปิดค้างข้ามคืนเป็นเรื่องปกติ
    this._dayTimer = setInterval(this.checkDayRollover, 60000);
    document.addEventListener('visibilitychange', this._onVisible);

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

  // Esc ปิดหน้าต่างที่เปิดอยู่ทีละชั้น เริ่มจากชั้นบนสุด
  // (หน้าต่างยืนยันลบกดพื้นหลังไม่ปิดโดยตั้งใจ ถ้าไม่มี Esc ก็เหลือทางเดียวคือเมาส์)
  _onKey = (e) => {
    if (e.key !== 'Escape') return;
    const st = this.state;
    if (st.confirm) { this.closeConfirm(); return; }
    if (st.recorderMenuOpen) { this.closeRecorderMenu(); return; }
    if (st.sheet) { this.closeSheet(); return; }
    if (st.settingsOpen) { this.setState({ settingsOpen: false, favQuery: '' }); }
  };

  _onVisible = () => {
    if (!document.hidden) this.checkDayRollover();
  };

  componentWillUnmount() {
    if (this._histHeadRO) { this._histHeadRO.disconnect(); this._histHeadRO = null; }
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
    document.removeEventListener('visibilitychange', this._onVisible);
    if (this._vv && this._onVV) {
      this._vv.removeEventListener('resize', this._onVV);
      this._vv.removeEventListener('scroll', this._onVV);
    }
  }

  render() {
    return renderShell(this);
  }
}
