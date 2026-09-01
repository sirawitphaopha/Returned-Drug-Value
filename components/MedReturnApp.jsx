'use client';
// แกนกลางของแอป — เก็บสถานะทั้งหมดไว้ก้อนเดียวเหมือนมอคอัป (บรรทัด 840–910)
// เมธอดทั้งหมดอยู่ใน handlers/ · การวาดจออยู่ใน shell.jsx กับ pages/
import React from 'react';
import { installHandlers } from './handlers';
import { renderShell } from './shell';
import { LS, readLS, readCache, writeLS, clearLS, myTabId, draftKeyOf, touchTab, releaseTab, orphanDrafts } from './helpers';
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
      // ผลการบันทึกล่าสุด — มีค่าเมื่อไหร่ หน้าผลเต็มจอจะขึ้นทับทั้งจอจนกดตกลง
      // 🚨 ไม่ถูกเก็บลง localStorage โดยตั้งใจ (app.persist ไม่มีคีย์นี้)
      //    เปิดเว็บใหม่ต้องไม่เจอหน้าผลของล็อตเมื่อวานค้างอยู่
      result: null,
      // เวลาที่ระบบจะลองส่งของค้างครั้งถัดไป (0 = ไม่มีคิว) กับจำนวนครั้งที่ลองไปแล้ว
      retryAt: 0,
      retryTries: 0,
      // ชื่อผู้บันทึกของล็อตที่ส่งไม่สำเร็จ ใช้ตอนส่งซ้ำหลังเปิดเว็บใหม่เท่านั้น
      // 🚨 ไม่ใช่ค่าในช่องผู้บันทึก และห้ามเอาไปเติมในช่องนั้น (กฎข้อ 3.24)
      failedBy: '',
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
      // ── โหลดไม่สำเร็จของแต่ละหน้า ──────────────────────────────────────
      // 🚨 "โหลดไม่สำเร็จ" กับ "ไม่มีข้อมูล" ต้องแยกจากกันให้เด็ดขาด
      //    หน้าสรุปเคยวาด ฿0.00 ทุกช่องตอนเซิร์ฟเวอร์ล่ม ซึ่งเป็นหน้าที่เอาไปเสนอผู้บริหาร
      //    = บอกข้อมูลผิดแบบเงียบ ๆ · หน้าประวัติเคยขึ้น "ไม่พบรายการ" ทั้งที่เน็ตหลุด
      loadErr: { sum: '', hist: '', lots: '', cat: '', price: '' },
      // ── หน้าคลังยา — จำนวนแถวที่วาดจริงตอนนี้ (ผลตรวจข้อ ก-9) ────────────
      // พี่กันสั่ง 27 ส.ค. 2569: "ก9 เราอยากวาดครบ 417 แต่ส่วนที่ไม่แสดงก็ไม่เรนเดอร์"
      // 🚨 ไม่ใช่ปุ่ม "ดูเพิ่ม" — แถวโผล่เองตอนเลื่อนถึง ผู้ใช้ไม่ต้องรู้ว่ามีการแบ่ง
      catDraw: 60,
      // ── ล็อตที่กรอกค้างไว้ในหน้าต่างที่ปิดไปแล้ว (พี่กันสั่ง 31 ส.ค. 2569) ──
      // ไม่ดึงมาเอง แค่ขึ้นแถบบอกว่ามีอยู่ พร้อมปุ่มเอากลับมาหรือทิ้ง
      parked: [],
      // ── ชื่อเครื่อง + ร่างบนเซิร์ฟเวอร์ (พี่กันสั่ง 31 ส.ค. 2569) ──────────
      deviceId: '',        // ชื่อเครื่องที่เลือกไว้ เช่น computer OPD เครื่องที่ 1
      deviceAsk: false,    // เปิดหน้าต่างถามชื่อเครื่องอยู่ไหม
      deviceKind: 0,       // 1 = คอมพิวเตอร์ · 2 = มือถือ
      devicePick: '',      // ชื่อที่เลือกค้างไว้ในหน้าต่าง
      serverDrafts: [],    // ร่างที่เก็บบนเซิร์ฟเวอร์ (ของเครื่องนี้และเครื่องอื่น)
      keepDays: 7,
      showOtherDrafts: false,   // รายการร่างจากเครื่องอื่น ต้องกดเปิดเอง
      parkedSeen: '',          // ล็อตที่กางดูยาอยู่ในหน้าต่างนั้น (ทีละล็อต)
      qtyFull: false,          // กางดูสูตรเต็มในช่องจำนวนอยู่ไหม
      sumFy: 0,              // ปีงบที่เลือกดู (0 = ปีปัจจุบัน)
      sumFyYears: [],
      topReturned: [],       // ยาที่ถูกคืนบ่อยที่สุด — เรียงตามจำนวนครั้ง
      exporting: false,
      dark: false,
      animSaved: 0,
      toast: null,
      vw: 430,
      // ความสูงจอ — ใช้ตัดสินว่าจอสูงพอจะล็อกความสูงหน้าบันทึกไหม
      // 🚨 จอเตี้ยแล้วยังล็อกอยู่ = กรอบรายการยาโดนบีบจนเหลือ 2 แถว
      //    พี่กันเจอเองตอนเปิดโครมสูง 577px แล้วทัก "อันนี้บีบมากกก"
      vh: 900,
      // ── ความกว้างของ "ขอบจอจริง" ที่วัดได้จากเครื่อง (พี่กันสั่ง 1 ก.ย. 2569) ──
      //   "ให้มัน detect ขอบมือถือ แล้ว fix เลย และปรับใช้กับทุกมือถือได้"
      // 0 = ยังไม่ได้วัด (ตอนเซิร์ฟเวอร์วาดจอ) ให้ใช้ 100% ไปก่อน
      lockW: 0,
      // ── ดึงหน้าลงเพื่อโหลดใหม่ (พี่กันสั่ง 1 ก.ย. 2569) ────────────────────
      // pullY = ระยะที่นิ้วลากลงมาแล้ว (หน่วยพิกเซล · 0 คือยังไม่ได้ลาก)
      // pullBusy = ปล่อยนิ้วแล้วกำลังโหลดอยู่
      // 🚨 ทั้งคู่ต้องเป็น 0/false เสมอบนเดสก์ท็อป — ตัวจับนิ้วไม่ทำงานที่นั่นเลย
      // มีหน้าต่างซ้อนเปิดอยู่ไหม — ตัวดักการเลื่อนอ่านค่านี้
      // 🚨 ตัวจริงคำนวณใน vals/shell.js · ตรงนี้เป็นสำเนาที่ componentDidUpdate เขียนให้
      //    เพราะตัวดักเป็นเหตุการณ์นอก React จะเรียก renderVals เองไม่ได้
      anyModalOpen: false,
      pullY: 0,
      pullBusy: false,
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
    // ชั้นที่วาดตัวอักษรของช่องค้นยาฝั่งมือถือ — ต้องเลื่อนตามช่องกรอกจริง
    this.searchDrawRef = React.createRef();
    this.qtyRef = React.createRef();
    this.qtyLayerRef = React.createRef();   // ชั้นที่วาดสูตรในช่องจำนวน — เลื่อนตาม input
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

    // ── วัดความสูงแถบหัวของหน้ารายการ Lot ─────────────────────────────────
    // หัวตารางต้องตรึงพอดีใต้แถบหัวเรื่อง+แถบค้นหาที่ตรึงอยู่ก่อนแล้ว
    // ตั้งเลขตายตัวไม่ได้ เพราะปุ่มช่วงเวลากับช่องวันที่ขึ้นบรรทัดใหม่เองเมื่อจอแคบ
    // (ท่าเดียวกับหน้าประวัติเป๊ะ ๆ — พี่กันสั่ง 27 ส.ค. 2569 ให้ทำเหมือนกัน)
    this._lotsHeadRO = null;
    this.lotsHeadRef = (el) => {
      if (this._lotsHeadRO) { this._lotsHeadRO.disconnect(); this._lotsHeadRO = null; }
      if (!el || typeof ResizeObserver === 'undefined') return;
      const write = () => document.documentElement.style.setProperty('--lotshead', el.offsetHeight + 'px');
      write();
      this._lotsHeadRO = new ResizeObserver(write);
      this._lotsHeadRO.observe(el);
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
      this.syncMobileClass();
      this.lockWidth();
      if (window.innerWidth !== this.state.vw || window.innerHeight !== this.state.vh) {
        this.setState({ vw: window.innerWidth, vh: window.innerHeight });
      }
    };
    this._raf = null;
    this._toastTimer = null;
    this._orgTimer = null;
    this._histTimer = null;

    // แถวที่กำลังถูกไฮไลต์ในรายการผลค้นยา — ใช้เลื่อนกรอบตามลูกศรขึ้น/ลง
    // (ดู componentDidUpdate ด้านล่าง)
    this.hiRef = React.createRef();

    // ── ผูกตัวกันลาก/กันซูมตั้งแต่วินาทีแรก ────────────────────────────────
    // 🚨 componentDidMount เกิดช้ากว่านี้หลายวินาทีบนมือถือ
    //    ผูกที่นี่จึงกันได้ตั้งแต่ก่อนหน้าจอถูกวาดครั้งแรกด้วยซ้ำ
    //    (ตัวถอดยังอยู่ที่ componentWillUnmount เหมือนเดิม)
    this._bindEarlyGuards();

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
  // ทวนธง "มีหน้าต่างซ้อนเปิดอยู่ไหม" ให้ตรงกับของจริงทุกครั้งที่วาดจอ
  // 🚨 รายชื่อต้องตรงกับ vals/shell.js → anyModalOpen เป๊ะ ๆ แก้ที่หนึ่งต้องแก้อีกที่
  _syncModalFlag = () => {
    const st = this.state;
    const now = !!(
      st.confirm || st.sheet || st.result ||
      st.hisOpen || st.slipLot || st.lotEdit || st.showOtherDrafts ||
      st.deviceAsk || st.reasonAsk || st.catEdit || st.catLog || st.priceFix
    );
    if (now !== st.anyModalOpen) this.setState({ anyModalOpen: now });
    this._lockBody(now);
  };

  // ── ฉากหลังห้ามเลื่อนเมื่อมีหน้าต่างซ้อน — ฝั่งมือถือต้องตรึงทั้งใบ ────────
  //
  //   พี่กันเจอเอง 1 ก.ย. 2569: "ทำไมเราเปิด popup แล้วเราสามารถเลื่อนเพจลงล่างได้"
  //
  //   การดักเหตุการณ์ touchmove อย่างเดียวไม่พอบนมือถือ — เบราว์เซอร์บนมือถือ
  //   ส่งการเลื่อนต่อไปให้หน้าเว็บทั้งใบได้อยู่ดี ต้องตรึงตัวหน้าเว็บเองด้วย
  //
  // 🚨 ต้องจำตำแหน่งที่เลื่อนค้างไว้ แล้วคืนตอนปิดหน้าต่าง
  //    ไม่งั้นปิดหน้าต่างแล้วเด้งกลับไปบนสุด เสียตำแหน่งที่กำลังดูอยู่
  // 🚨 ทำเฉพาะฝั่งมือถือ ฝั่งคอมปิด overflow ที่พื้นที่เลื่อนก็พอแล้ว
  //    (ตรึงทั้งใบบนคอมจะทำให้แถบเลื่อนหายแล้วหน้ากระตุกตอนเปิดปิด)
  _lockBody = (on) => {
    if (typeof document === 'undefined') return;
    if (!this._isNarrowNow()) {
      // เผื่อกรณีสลับจากมือถือมาคอมทั้งที่หน้าต่างยังเปิดอยู่
      if (document.body.style.position === 'fixed') this._lockBody(false);
      return;
    }
    const b = document.body;
    if (on) {
      if (b.style.position === 'fixed') return;
      const sc = this.scrollRef && this.scrollRef.current;
      this._lockTop = sc ? sc.scrollTop : (window.scrollY || 0);
      b.style.position = 'fixed';
      b.style.width = '100%';
      b.style.overflow = 'hidden';
    } else {
      if (b.style.position !== 'fixed') return;
      b.style.position = '';
      b.style.width = '';
      b.style.overflow = '';
      const sc = this.scrollRef && this.scrollRef.current;
      if (sc && this._lockTop != null) sc.scrollTop = this._lockTop;
      this._lockTop = null;
    }
  };

  componentDidUpdate(prevProps, prevState) {
    this._syncModalFlag();
    // สลับปุ่มมุมมองมือถือ/คอม ต้องอัปเดตคลาสที่ body ตามทันที
    if (prevState.vw !== this.state.vw || prevState.forceNarrow !== this.state.forceNarrow) {
      this.syncMobileClass();
    }
    if (prevState.hi !== this.state.hi && this.hiRef.current) {
      this.hiRef.current.scrollIntoView({ block: 'nearest' });
    }

    // ── นาฬิกาถอยหลังบนหน้าส่งไม่สำเร็จ ──────────────────────────────────
    // เดินเฉพาะตอนหน้านั้นเปิดอยู่จริง — ไม่ใช่ตลอดเวลาที่มีของค้าง
    // เว็บเปิดค้างทั้งวัน ตัวจับเวลาที่เดินเปล่าทุกวินาทีคือการวาดจอทิ้งวันละหมื่นรอบ
    const failNow = !!this.state.result && this.state.result.kind === 'fail';
    const failBefore = !!prevState.result && prevState.result.kind === 'fail';
    if (failNow && !failBefore && !this._tickTimer) {
      this._tickTimer = setInterval(() => this.setState({ tick: Date.now() }), 1000);
    }
    if (!failNow && this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }
  }

  componentDidMount() {
    // วาดจอจากของที่มีในเครื่องก่อน ไม่ต้องรอเซิร์ฟเวอร์ แล้วค่อยยิงไปทับ
    // ── ร่างของหน้าต่างนี้ (พี่กันสั่ง 31 ส.ค. 2569 ให้ทุกหน้าต่างเป็นเอกเทศ) ──
    // 🚨 อ่านเฉพาะร่างที่มีรหัสหน้าต่างนี้ ห้ามแตะของหน้าต่างอื่นเด็ดขาด
    const patchDevice = {};
    const myKey = draftKeyOf(myTabId());
    let draft = readLS(myKey);

    // ย้ายร่างรุ่นเก่าที่ยังใช้คีย์รวมเข้ามาเป็นของหน้าต่างนี้ ครั้งเดียวจบ
    // ไม่งั้นคนที่กำลังกรอกค้างอยู่ตอนอัปเดตเวอร์ชัน จะเปิดมาแล้วของหายทั้งล็อต
    if (!draft) {
      const old = readLS(LS.draftOld);
      if (old && (Array.isArray(old) ? old.length : (old.rows || []).length)) {
        draft = old;
        writeLS(myKey, old);
      }
      clearLS(LS.draftOld);
    }

    // ล็อตที่กรอกค้างไว้ในหน้าต่างที่ปิดไปแล้ว — ยังอยู่ครบ ไม่ได้หายไปไหน
    const orphans = orphanDrafts().filter((o) => o.id !== myTabId());
    const dark = readLS(LS.dark) === 1;
    const drugs = readCache(LS.drugs);
    const setting = readCache(LS.setting);

    // ฟอนต์ตัวอักษรอังกฤษและตัวเลข — ค่าเริ่มต้นเป็น Roboto Mono (พี่กันสั่ง 27 ส.ค. 2569)
    // 🚨 ต้องเขียนตัวแปร CSS ตั้งแต่ตรงนี้ ไม่ใช่รอให้ผู้ใช้กดเลือก
    //    ไม่งั้นคนที่เคยเลือก "แบบปกติ" ไว้ จะเห็น Roboto Mono แวบหนึ่งตอนเปิดเว็บ
    // ชื่อเครื่อง — ยังไม่เคยเลือก = เปิดหน้าต่างถามทันที ไม่มีทางข้าม (พี่กันสั่ง)
    const device = readLS(LS.device);
    patchDevice.deviceId = typeof device === 'string' ? device : '';
    patchDevice.deviceAsk = !patchDevice.deviceId;

    const enFont = readLS(LS.enFont) === "thai" ? "thai" : "mono";
    this.applyEnFont(enFont);

    const patch = Object.assign({ loading: false, vw: window.innerWidth, vh: window.innerHeight, dark: dark, enFont: enFont }, patchDevice);

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
      // ของค้างที่เคยส่งไม่สำเร็จ ต้องยังรู้ตัวว่าค้างอยู่หลังเปิดเว็บใหม่
      // 🚨 ติดธงเฉพาะตอนมีแถวเหลือจริง — ธงค้างโดยไม่มีของ = กล่องแดงขึ้นเปล่า ๆ
      if (box.saveFailed && patch.rows && patch.rows.length) {
        patch.saveFailed = true;
        patch.saveError = typeof box.saveError === 'string' ? box.saveError : '';
        // ผู้บันทึกที่เซ็นล็อตค้างนี้ไว้ — เก็บแยกจากช่องผู้บันทึกโดยตั้งใจ
        patch.failedBy = typeof box.failedBy === 'string' ? box.failedBy : '';
      }
    }

    // ── ของค้างจากหน้าต่างที่ปิดไปแล้ว ────────────────────────────────────
    // 🚨 ของที่ "ส่งไม่สำเร็จ" ต้องดึงกลับมาให้เองทันที ไม่ต้องรอใครกด
    //    มันคือยาที่รับคืนจากคนไข้ไปแล้วแต่ยังไม่ขึ้นระบบส่วนกลาง
    //    ถ้ารอให้คนสังเกตแล้วกด อาจไม่มีใครกดเลยจนของหายทั้งล็อต
    //
    // ส่วนร่างธรรมดาที่ยังกรอกไม่เสร็จ ไม่ดึงมาเอง — ขึ้นแถบให้กดเอากลับมาแทน
    // เพราะการที่ของคนอื่นโผล่มาเองในหน้าต่างเราคือต้นเหตุของปัญหาเดิมทั้งหมด
    const failedOne = orphans.find((o) => o.failed);
    const plainOnes = orphans.filter((o) => !o.failed);

    if (failedOne && !(patch.rows && patch.rows.length)) {
      const b = failedOne.box;
      patch.rows = (b.rows || []).filter(
        (r) => r && r.rid != null && typeof r.price === 'number' && typeof r.qty === 'number'
      );
      if (patch.rows.length) {
        if (b.batchId) patch.batchId = b.batchId;      // ต้องใช้เลขก้อนเดิม ไม่งั้นกันซ้ำไม่ได้
        if (typeof b.hn === 'string') patch.hn = b.hn;
        if (typeof b.source === 'string') patch.source = b.source;
        if (b.sourceTouched) patch.sourceTouched = true;
        if (typeof b.pcuSite === 'string') patch.pcuSite = b.pcuSite;
        if (typeof b.date === 'string' && b.date) patch.date = b.date;
        patch.saveFailed = true;
        patch.saveError = typeof b.saveError === 'string' ? b.saveError : '';
        patch.failedBy = typeof b.failedBy === 'string' ? b.failedBy : '';
        clearLS(failedOne.key);                        // ย้ายมาเป็นของหน้าต่างนี้แล้ว
        this._tookOrphan = true;
      }
    }

    // เหลือแค่ร่างธรรมดา — เก็บไว้เสนอเป็นแถบให้กดเอากลับมา
    patch.parked = plainOnes.map((o) => ({
      id: o.id,
      key: o.key,
      count: o.rows.length,
      value: o.rows.reduce((a, r) => a + (r.disposition === 'reuse' ? r.price * r.qty : 0), 0),
      when: typeof o.box.date === 'string' ? o.box.date : ''
    }));

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
      // ของค้างจากรอบก่อน — ลองส่งให้เองเลย ไม่ต้องรอให้ใครกด
      // เส้นทางเดียวกับตอนเน็ตกลับมา จึงใช้ batchId เดิมและไม่มีทางได้ข้อมูลซ้ำ
      if (patch.saveFailed) this.retryFailedSave();
      // 🚨 ต้องเรียกตรงนี้ ไม่ใช่ข้างล่าง — setState ยังไม่ commit ตอนนั้น
      //    ชื่อเครื่องจึงยังว่าง แล้วตัวดึงร่างจะออกจากฟังก์ชันไปเลยโดยไม่ทำอะไร
      this.loadServerDrafts();
    });
    // วัดขอบจอจริงทันทีที่เปิดเว็บ แล้ววัดซ้ำทุกครั้งที่กรอบจอขยับ
    // 🚨 ต้องผูกกับ visualViewport ด้วย — แป้นพิมพ์เด้ง หมุนจอ หรือแถบเบราว์เซอร์ยืดหด
    //    ล้วนเปลี่ยนขอบจอโดยไม่ยิง resize ของหน้าต่างเสมอไป
    this.lockWidth();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.lockWidth);
      window.visualViewport.addEventListener('scroll', this.lockWidth);
    }
    window.addEventListener('resize', this._onResize);
    // ดึงหน้าลงเพื่อโหลดใหม่ — ผูกที่หน้าต่าง ไม่ใช่ที่พื้นที่เลื่อน
    // 🚨 พื้นที่เลื่อนถูกสร้างหลัง componentDidMount ในบางจังหวะ (ตอนยังโหลดอยู่)
    //    ผูกที่หน้าต่างแล้วเช็ค scrollRef เอาข้างในจึงไม่มีทางพลาด
    // 🚨 passive:false ที่ touchmove เท่านั้น — ตัวอื่นปล่อย passive ไว้ให้เลื่อนลื่น
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this._onTouchEnd, { passive: true });
    window.addEventListener('keydown', this._onKey);
    // แป้นเครื่องคิดเลขต้องปิดเมื่อกดที่อื่น — ป๊อปตัวเล็กที่ไม่มีฉากหลังคลุมจอ
    // ถ้าไม่ปิดจะค้างบังตารางรายการอยู่ตลอด ต้องย้อนกลับมากดปุ่มเดิม
    document.addEventListener('mousedown', this._onDocDown);
    // ทวนวันทุก 1 นาที — คอมห้องยาเปิดค้างข้ามคืนเป็นเรื่องปกติ
    this._dayTimer = setInterval(this.checkDayRollover, 60000);

    // ── บอกทะเบียนว่าหน้าต่างนี้ยังเปิดอยู่ ────────────────────────────────
    // 🚨 จำเป็นสำหรับแยกให้ออกว่าร่างไหนเป็นของหน้าต่างที่ยังกรอกอยู่ (ห้ามแตะ)
    //    กับร่างของหน้าต่างที่ปิดไปแล้ว (เอากลับมาได้)
    //    ทุก 15 วินาที ต่ำกว่าเกณฑ์ 45 วินาทีอยู่ 3 เท่า เผื่อเครื่องช้าหรือแท็บถูกพักไว้
    touchTab();
    this._tabTimer = setInterval(touchTab, 15000);
    // 🚨 ปล่อยรหัสคืนก่อนหน้าหาย ไม่งั้นกด F5 แล้วได้รหัสใหม่ = ยาที่กรอกค้างหายทั้งล็อต
    //    ตอนปิดแท็บจริงก็ปล่อยเหมือนกัน ทำให้ร่างนั้นกลายเป็นของที่ไม่มีเจ้าของทันที
    //    หน้าต่างที่เปิดทีหลังจึงเห็นและเอากลับมาได้เลย ไม่ต้องรอ 45 วินาที
    window.addEventListener('pagehide', releaseTab);

    // ── อัปเดตสดข้ามเครื่อง ────────────────────────────────────────────────
    // ถามหลังบ้านทุก 20 วินาทีว่า "ลายเซ็นข้อมูลเปลี่ยนไหม" ตอบกลับแค่ตัวเลข 4 ตัว
    // เปลี่ยนเมื่อไหร่ค่อยดึงของจริงเฉพาะหน้าที่เปิดอยู่
    //
    // 🚨 แท็บที่ซ่อนอยู่ไม่ถาม — คอมห้องยาเปิดเว็บค้างทั้งวันโดยไม่ได้มอง
    //    ถ้าถามตลอดจะได้คำขอเปล่าวันละสองพันกว่าครั้งต่อเครื่อง
    //    (กลับมาที่แท็บเมื่อไหร่ ถามทันทีอยู่แล้วที่ _onVisible)
    this.pulse();
    this._revTimer = setInterval(() => {
      if (document.hidden) return;
      this.pulse();
    }, 20000);
    document.addEventListener('visibilitychange', this._onVisible);
    window.addEventListener('online', this._onOnline);
    // ปิดหน้าต่างหรือกดรีเฟรชทั้งที่ยังไม่ได้กดบันทึก = ต้องถามก่อนเสมอ
    // พี่กันสั่ง 31 ส.ค. 2569: "ป้องกันการกดรีเฟรช มันจะถามก่อนว่าจะออกจากหน้าเว็บนี้ไหม
    //                          ถ้ายังไม่กดบันทึก"
    //
    // ⚠️ เดิมเตือนเฉพาะตอนส่งไม่สำเร็จ ด้วยเหตุผลว่าร่างที่กรอกค้างเป็นเรื่องปกติ
    //    เตือนบ่อยแล้วคนจะเลิกอ่าน — พี่กันสั่งเปลี่ยนแล้ว ตอนนี้เตือนทุกครั้งที่มีของค้าง
    window.addEventListener('beforeunload', this._onBeforeUnload);
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
    // หน้าผลบันทึกสำเร็จ — กดพื้นหลังไม่ปิดเหมือนกัน (เลข Lot ที่โชว์อยู่หายแล้วต้องไปหาเอง)
    // อยู่ล่างกว่าใบสรุป เพราะกดปุ่มบนหน้านี้เปิดใบสรุปซ้อนขึ้นไปได้อีกชั้น
    if (st.result) { this.closeResult(); return; }
    if (st.settingsOpen) { this.setState({ settingsOpen: false, favQuery: '' }); }
  };

  // ── ตัวสังเกตท้ายตารางคลังยา ────────────────────────────────────────────
  // เลื่อนใกล้ถึงท้ายตารางเมื่อไหร่ วาดเพิ่มให้อีกชุด
  //
  // 🚨 ต้องเป็นเมธอดตัวเดิมตลอด ห้ามสร้างใหม่ทุกครั้งที่วาดจอ
  //    ไม่งั้น React จะถอดแล้วต่อตัวสังเกตใหม่ทุกเฟรม (บทเรียนเดียวกับ --bottombar)
  //
  // 🚨 เผื่อระยะ 600px ก่อนถึงจริง แถวชุดใหม่จะได้พร้อมก่อนตาไปถึง
  //    ผู้ใช้จึงไม่มีทางเห็นตารางว่างหรือกระตุกระหว่างเลื่อน
  catMoreRef = (el) => {
    if (this._catMoreObs) { this._catMoreObs.disconnect(); this._catMoreObs = null; }
    if (this._tabTimer) clearInterval(this._tabTimer);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    this._catMoreObs = new IntersectionObserver((ents) => {
      if (ents.some((e) => e.isIntersecting)) this.drawMoreCatalog();
    }, { root: this.scrollRef.current || null, rootMargin: '600px 0px' });
    this._catMoreObs.observe(el);
  };

  _onVisible = () => {
    if (document.hidden) return;
    this.checkDayRollover();
    // กลับมาที่แท็บนี้อีกที = จังหวะที่คุ้มที่สุดที่จะถามว่ามีอะไรเปลี่ยนไปบ้าง
    // ถามทีเดียวได้ครบทั้งคลังยา การตั้งค่า และรายการยาคืน (/api/rev)
    // ระหว่างที่แท็บซ่อนอยู่ตัวจับเวลาหยุดถาม ตรงนี้จึงเป็นการไล่ให้ทันทันที
    this.pulse();
    this.retryFailedSave();
  };

  // เน็ตโรงพยาบาลหลุดแล้วกลับมา — ระหว่างที่หลุดอาจมีคนแก้ยาไปแล้ว
  _onOnline = () => { this.setState({ offline: false }); this.pulse(); this.retryFailedSave(); };

  // ข้อความที่โชว์เป็นของเบราว์เซอร์เอง แก้ไม่ได้ — สิ่งเดียวที่ทำได้คือให้มันถามหรือไม่ถาม
  //
  // ถามเมื่อมีรายการค้างอยู่ในหน้าบันทึกและยังไม่ได้กดบันทึก (พี่กันสั่ง 31 ส.ค. 2569)
  // ครอบคลุมทั้งการกดรีเฟรช ปิดแท็บ และปิดทั้งหน้าต่าง
  //
  // 🚨 โหมดดูตัวอย่างไม่ต้องถาม ของในนั้นเป็นข้อมูลปลอมที่หายได้ไม่เสียหาย
  // 🚨 ระหว่างกำลังส่งอยู่ (saving) ก็ต้องถาม ยังไม่รู้ผลว่าเข้าฐานหรือยัง
  // ── ธงบอก CSS ว่าตอนนี้เป็นฝั่งมือถือ (พี่กันสั่ง 1 ก.ย. 2569) ─────────────
  //
  // 🚨 ต้องผูกกับธง wide ตัวเดียวกับที่ใช้เลือกว่าจะวาดหน้าจอแบบไหน
  //    ใช้ @media (max-width) ใน CSS แทนไม่ได้ เพราะกดปุ่ม "มือถือ" บนคอมได้
  //    (forceNarrow) ซึ่งตอนนั้นจอยังกว้าง 1366px อยู่ แต่หน้าจอเป็นแบบมือถือแล้ว
  //
  // 🚨 เงื่อนไขต้องตรงกับ vals/derive.js → wide เป๊ะ ๆ ห้ามเขียนคนละแบบ
  //    แก้ที่หนึ่งต้องแก้อีกที่เสมอ ไม่งั้น CSS กับ JSX จะไม่ตรงกันแบบเงียบ ๆ
  // ── ดึงหน้าลงเพื่อโหลดใหม่ (พี่กันสั่ง 1 ก.ย. 2569) ─────────────────────────
  //
  // ทำไมต้องมี: เว็บนี้ถามเซิร์ฟเวอร์เองทุก 20 วินาทีอยู่แล้ว (ดูข้อ 3.62)
  // แต่คนใช้มือถือไม่มีทางรู้ว่าของบนจอสดหรือเก่า และไม่มีปุ่มโหลดใหม่ให้กด
  // การดึงลงเป็นท่ามาตรฐานที่ทุกแอปใช้ตรงกัน จึงไม่ต้องสอน
  //
  // 🚨 ทำงานเฉพาะฝั่งมือถือ — ผูกกับคลาส .mrv-mobile ตัวเดียวกับ mobile.css
  //    เดสก์ท็อปไม่มี touch event และถึงมีก็ถูกด่านนี้ตีกลับก่อน
  // 🚨 ต้องอยู่บนสุดของพื้นที่เลื่อนเท่านั้น (scrollTop === 0)
  //    ไม่งั้นเลื่อนดูตารางประวัติกลางหน้าแล้วหน้าถูกดึงลงมั่ว
  // 🚨 ระยะที่นิ้วลากถูกหารครึ่ง — ให้รู้สึกฝืดเหมือนดึงยางยืด
  //    ลากเท่าไหร่ขยับเท่านั้น จะรู้สึกลื่นเกินจนเผลอสั่งโหลดใหม่บ่อย
  PULL_MAX = 92;
  PULL_FIRE = 62;

  _onTouchStart = (e) => {
    if (!this._isNarrowNow()) return;
    if (this.state.pullBusy) return;
    const sc = this.scrollRef.current;
    if (!sc || sc.scrollTop > 0) { this._pullFrom = null; return; }
    this._pullFrom = e.touches && e.touches[0] ? e.touches[0].clientY : null;
  };

  _onTouchMove = (e) => {
    if (this._pullFrom == null) return;
    const sc = this.scrollRef.current;
    // เลื่อนขึ้นไปแล้ว = เลิกนับว่าเป็นการดึง ปล่อยให้เลื่อนตามปกติ
    if (!sc || sc.scrollTop > 0) { this._pullFrom = null; if (this.state.pullY) this.setState({ pullY: 0 }); return; }
    const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
    const dy = y - this._pullFrom;
    if (dy <= 0) { if (this.state.pullY) this.setState({ pullY: 0 }); return; }
    // 🚨 ต้องห้ามการเลื่อนของเบราว์เซอร์ ไม่งั้นเด้งของมันเองสู้กับของเรา ภาพกระตุก
    //    ทำได้เพราะตัวจับนี้ผูกแบบ passive:false (ดู componentDidMount)
    if (e.cancelable) e.preventDefault();
    const next = Math.min(this.PULL_MAX, dy * 0.5);
    if (Math.abs(next - this.state.pullY) >= 1) this.setState({ pullY: next });
  };

  _onTouchEnd = () => {
    if (this._pullFrom == null) return;
    this._pullFrom = null;
    const y = this.state.pullY;
    if (y >= this.PULL_FIRE) { this.pullRefresh(); return; }
    if (y) this.setState({ pullY: 0 });
  };

  // 🚨 ต้องคืนหน้าจอให้เร็วแม้เซิร์ฟเวอร์ช้า — ค้างที่ตัวหมุนนาน ๆ คนจะกดซ้ำ
  //    ตั้งเวลาขั้นต่ำ 420 มิลลิวินาที ไม่งั้นเน็ตเร็ว ๆ ตัวหมุนแวบเดียวจนดูเหมือนไม่ได้ทำอะไร
  pullRefresh = async () => {
    if (this.state.pullBusy) return;
    this.setState({ pullBusy: true, pullY: this.PULL_FIRE });
    const t0 = Date.now();
    try {
      // ถามลายเซ็นก่อน (คลังยา · การตั้งค่า · รายการยาคืน) แล้วโหลดเฉพาะหน้าที่เปิดอยู่
      await this.pulse({ quiet: true });
      this.refreshCurrent();
      if (this.loadServerDrafts) this.loadServerDrafts();
    } catch (e) {}
    const left = 420 - (Date.now() - t0);
    const done = () => this.setState({ pullBusy: false, pullY: 0 });
    if (left > 0) setTimeout(done, left); else done();
  };

  // ── ห้ามซูมด้วยนิ้ว (พี่กันสั่ง 1 ก.ย. 2569) ───────────────────────────────
  //
  // Safari บน iPhone มีท่าซูมของตัวเองชื่อ gesture ซึ่งไม่ผ่านระบบ touch ปกติ
  // ปิดด้วย CSS อย่างเดียวจึงไม่พอ ต้องดักท่านี้ตรง ๆ ด้วย
  //
  // 🚨 ฝั่งคอมต้องไม่โดน — ตรวจคลาส .mrv-mobile ก่อนเสมอ
  //    (เบราว์เซอร์บนคอมไม่ยิง gesture อยู่แล้ว แต่กันไว้เผื่อจอสัมผัสบนคอม)
  // 🚨 ห้ามดักการแตะสองครั้งด้วยตัวนี้ — ปุ่มทั้งเว็บใช้ touch-action: manipulation
  //    ซึ่งปิดการซูมจากการแตะสองครั้งให้แล้ว
  _onGesture = (e) => {
    if (!this._isNarrowNow()) return;
    if (e.cancelable) e.preventDefault();
  };

  // ── วัดขอบจอจริงแล้วล็อกความกว้างของแอปเท่านั้นเป๊ะ ๆ ───────────────────
  //
  // พี่กันสั่ง 1 ก.ย. 2569 หลังบ่นเรื่องหน้าไถลซ้ายขวา 7 รอบ
  //   "ให้มัน fix ซ้ายขวาไม่ได้เหรอ และให้มัน detect ขอบมือถือ แล้ว fix เลย
  //    และปรับใช้กับทุกมือถือได้"
  //
  // ทำไมกฎ CSS ทั้งหมดก่อนหน้าไม่พอ:
  //   iPhone มีกรอบหน้าเว็บ 2 ชั้น — กรอบผัง (layout viewport) กับกรอบที่ตาเห็น
  //   (visual viewport) ถ้ามีอะไรกว้างเกินแม้แต่ครั้งเดียว กรอบผังจะกว้างกว่าจอ
  //   แล้ว iOS ยอมให้ลากกรอบที่ตาเห็นไปมาภายในกรอบผังได้เสมอ
  //   position:fixed ก็ยึดกับกรอบผัง ไม่ใช่ขอบจอ จึงถูกลากไปด้วย
  //
  // วิธีนี้จึงไม่พึ่งกรอบผังเลย — ถามเครื่องตรง ๆ ว่าขอบจอจริงกว้างเท่าไหร่
  // แล้วบังคับตัวแอปให้กว้างเท่านั้น ใช้ได้กับมือถือทุกรุ่นโดยไม่ต้องรู้จักรุ่นเลย
  //
  // 🚨 เอาค่าที่น้อยที่สุดในสามตัวเสมอ — visualViewport คือของที่ตาเห็นจริง
  //    ส่วน innerWidth กับ clientWidth จะโตตามกรอบผังเมื่อมีของล้น
  // 🚨 ปัดลงด้วย Math.floor ห้ามปัดขึ้น — เกินไปแม้ครึ่งจุดก็ลากได้แล้ว
  lockWidth = () => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const cands = [
      vv && vv.width ? vv.width : 0,
      window.innerWidth || 0,
      document.documentElement ? document.documentElement.clientWidth : 0
    ].filter((x) => x > 0);
    if (!cands.length) return;
    const w = Math.floor(Math.min.apply(null, cands));
    if (w > 0 && w !== this.state.lockW) this.setState({ lockW: w });
  };

  // ── ตรึงตำแหน่งเลื่อนแนวนอนไว้ที่ 0 (พี่กันชี้ทางเอง 1 ก.ย. 2569) ──────────
  //
  // พี่กันถามว่า "ทำไมกรอบแสดงค่ายา และกรอบปุ่มกดส่งยา ทำไมมันไม่เลื่อน
  //              ทำไมเอาระบบนั้นมาไม่ได้"
  //
  // คำตอบคือแถบพวกนั้นอยู่ "นอก" พื้นที่เลื่อน จึงไม่มีอะไรมาลากมันได้เลย
  // และคลิปที่พี่กันถ่ายมาก็ยืนยัน — แถบล่างนิ่งสนิททุกเฟรมขณะที่ส่วนบนไถล
  // แปลว่าไม่ใช่ทั้งหน้าถูกลาก แต่เป็น "พื้นที่เลื่อน" ตัวเดียวที่เลื่อนแนวนอนได้
  //
  // กฎ CSS ทุกข้อที่ลองมา (overflow hidden/clip · touch-action · max-width)
  // ได้ผลบนคอมแต่ไม่ได้ผลบนมือถือของพี่กัน จึงเลิกพึ่ง CSS แล้วดักที่ตัวเหตุการณ์ตรง ๆ
  // มีอะไรมาดันให้เลื่อนก็ดันไป — ดีดกลับเป็น 0 ทันทีทุกครั้ง
  //
  // 🚨 ผูกแบบ passive ได้ เพราะไม่ได้ห้ามเหตุการณ์ แค่ตั้งค่ากลับ
  //    จึงไม่ถ่วงการเลื่อนขึ้นลงเลยแม้แต่นิดเดียว
  // 🚨 ฝั่งคอมต้องไม่โดน — ตรวจคลาส .mrv-mobile ก่อนเสมอ
  //    (หน้าคลังยาฝั่งคอมมีตารางกว้างที่ต้องเลื่อนดูข้าง ๆ ได้จริง)
  // 🚨 ต้องดักที่ window ด้วย เผื่อสิ่งที่เลื่อนคือทั้งหน้าไม่ใช่กล่องข้างใน
  _pinLeft = () => {
    if (!this._isNarrowNow()) return;
    const sc = this.scrollRef && this.scrollRef.current;
    if (sc && sc.scrollLeft !== 0) sc.scrollLeft = 0;
    const de = document.documentElement;
    if (de && de.scrollLeft !== 0) de.scrollLeft = 0;
    if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0;
    if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
  };

  // ── ตอนนี้เป็นฝั่งมือถือไหม (ไม่พึ่งคลาสที่โค้ดเป็นคนใส่) ─────────────────
  //
  // 🔴 พี่กันเจอเอง 1 ก.ย. 2569: "ตอนรีเฟรชหน้าเเล้วเข้ามา ตอนนี้คือเราขยับซ้ายขวาได้อยู่"
  //
  //    ต้นเหตุคือทุกอย่างเช็คคลาส .mrv-mobile ก่อนทำงาน แต่คลาสนั้นถูกใส่ใน
  //    componentDidMount ซึ่งเกิดหลังหน้าโหลดเสร็จหลายวินาที
  //    ช่วงก่อนหน้านั้นจึงไม่มีการป้องกันอะไรเลย — ลากทีเดียวก็ค้างไปทั้งรอบ
  //
  // 🚨 ความกว้างจอใช้ได้ตั้งแต่วินาทีแรก ไม่ต้องรออะไรเลย
  //    เอามาเป็นด่านสำรอง คู่กับคลาสที่ยังใช้เป็นตัวหลักเมื่อโหลดเสร็จแล้ว
  // 🚨 1180 = จุดสลับเดียวกับธง wide · เดสก์ท็อปจริงจึงไม่มีทางเข้าเงื่อนไขนี้
  // ⚠️ ถ้ากดปุ่ม "มือถือ" บนคอม (forceNarrow) จอยังกว้างอยู่ ตัวนี้จะตอบว่าไม่ใช่มือถือ
  //    ซึ่งถูกต้อง — กรณีนั้นไม่มีนิ้วมาลากอยู่แล้ว และคลาสก็ทำงานแทนให้
  // ผูกตัวกันลากกับกันซูมทันที ไม่รอให้หน้าจอวาดเสร็จ
  // 🚨 ต้องกันการผูกซ้ำ เพราะ React โหมดเข้มงวดสร้างคอมโพเนนต์สองรอบตอนพัฒนา
  _bindEarlyGuards = () => {
    if (typeof window === 'undefined' || this._earlyBound) return;
    this._earlyBound = true;
    // ฉากหลังห้ามเลื่อนเมื่อมีหน้าต่างซ้อน (ดู _blockBgScroll)
    document.addEventListener('touchmove', this._blockBgScroll, { passive: false });
    document.addEventListener('wheel', this._blockBgScroll, { passive: false });
    document.addEventListener('scroll', this._pinLeft, { passive: true, capture: true });
    window.addEventListener('scroll', this._pinLeft, { passive: true });
    window.addEventListener('touchmove', this._pinLeft, { passive: true });
    window.addEventListener('touchend', this._pinLeft, { passive: true });
    document.addEventListener('gesturestart', this._onGesture, { passive: false });
    document.addEventListener('gesturechange', this._onGesture, { passive: false });
    document.addEventListener('gestureend', this._onGesture, { passive: false });
  };

  // ── ฉากหลังห้ามเลื่อนเมื่อมีหน้าต่างซ้อน (พี่กันสั่ง 1 ก.ย. 2569) ──────────
  //
  // การปิด overflow ที่พื้นที่เลื่อน (ดู shell.jsx) พอสำหรับคอม
  // แต่บนมือถือนิ้วยังลากได้อยู่ เพราะเบราว์เซอร์ส่งการเลื่อนต่อไปให้ตัวที่อยู่ข้างนอก
  //
  // 🚨 ต้องห้ามที่เหตุการณ์ตรง ๆ และต้องเป็น passive:false ถึงจะห้ามได้
  // 🚨 ต้องปล่อยให้เลื่อนได้ถ้านิ้วอยู่ "ในตัวหน้าต่างซ้อนเอง"
  //    ไม่งั้นหน้าต่างที่มีเนื้อหายาว (รายการล็อต · ตั้งค่า) เลื่อนดูข้างในไม่ได้เลย
  //    ตัวชี้วัดคือ element ที่นิ้วแตะอยู่ในกล่องที่มี role="dialog" หรือไม่
  _blockBgScroll = (e) => {
    if (!this.state.anyModalOpen) return;
    const t = e.target;
    if (t && t.closest && t.closest('[role="dialog"], [data-scrollable="1"]')) return;
    if (e.cancelable) e.preventDefault();
  };

  _isNarrowNow = () => {
    if (typeof document === 'undefined') return false;
    if (document.body.classList.contains('mrv-mobile')) return true;
    return (window.innerWidth || 0) < 1180;
  };

  syncMobileClass = () => {
    if (typeof document === 'undefined') return;
    const st = this.state;
    const wide = (st.vw || 0) >= 1180 && !st.forceNarrow;
    document.body.classList.toggle('mrv-mobile', !wide);
  };

  _onBeforeUnload = (e) => {
    const st = this.state;
    // 🚨 กำลังออกจากระบบเอง = ตั้งใจออกและยืนยันมาแล้วหนึ่งชั้น ห้ามถามซ้ำ
    //    ไม่งั้นเบราว์เซอร์เด้งถามอีกรอบแล้วผู้ใช้กดออกจากระบบไม่ได้เลย
    //    (พี่กันเจอเอง 31 ส.ค. 2569 "เรากด log out ไม่ออก")
    if (this._leaving) return;
    if (st.demo || !st.rows.length) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  };
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
    // สัญญาณจากภายนอก (เน็ตกลับมา · กลับเข้าแท็บ · เพิ่งเปิดเว็บ) = จังหวะที่มีหวังที่สุด
    // จึงเริ่มนับจังหวะถอยใหม่ทุกครั้ง ไม่สืบทอดจังหวะยาว ๆ ของรอบก่อนมา
    this._retryStep = 0;
    this.scheduleRetry(1200, false);
  };

  // ── ลองส่งเองเป็นระยะ ถี่ก่อนแล้วห่างขึ้น (พี่กันเคาะ 29 ส.ค. 2569 ข้อ 1) ──
  //
  // ทำไมรอสัญญาณ "เน็ตกลับมา" อย่างเดียวไม่พอ
  //   เบราว์เซอร์ยิงสัญญาณนั้นเมื่อ "เครื่องหลุดจากเครือข่าย" เท่านั้น
  //   แต่อาการที่เจอจริงในโรงพยาบาลคือไวไฟยังต่ออยู่ครบทุกขีด แค่ออกอินเทอร์เน็ตไม่ได้
  //   เครื่องจึงคิดว่าตัวเองออนไลน์ตลอด ไม่มีสัญญาณไหนยิงเลย ของค้างเงียบข้ามวันได้
  //
  // 🚨 ต้องถอยห่างขึ้น ห้ามยิงถี่เท่าเดิมตลอด — เน็ตล่มยาว ๆ จะกลายเป็นยิงคำขอเปล่า
  //    ใส่เซิร์ฟเวอร์เป็นพัน ๆ ครั้ง ทั้งที่รู้อยู่แล้วว่าส่งไม่ได้
  // 🚨 ค้างที่ 5 นาทีไปเรื่อย ๆ ไม่หยุดลองเอง — หยุดเมื่อไหร่แปลว่าต้องมีคนมากดเอง
  //    ซึ่งเป็นสิ่งเดียวที่พยายามเลี่ยงตั้งแต่ต้น
  RETRY_WAITS = [20000, 40000, 80000, 160000, 300000];

  scheduleRetry = (delay, countUp) => {
    if (this._retryTimer) clearTimeout(this._retryTimer);
    if (countUp) this._retryStep = Math.min((this._retryStep || 0) + 1, this.RETRY_WAITS.length - 1);
    const wait = typeof delay === 'number' ? delay : this.RETRY_WAITS[this._retryStep || 0];
    // เวลาที่จะลองครั้งต่อไป — หน้าส่งไม่สำเร็จเอาไปนับถอยหลังให้เห็นว่าระบบยังทำงานอยู่
    this.setState({ retryAt: Date.now() + wait, retryTries: this._retryTries || 0 });
    this._retryTimer = setTimeout(() => {
      const cur = this.state;
      if (!cur.saveFailed || !cur.rows.length || this._saving || cur.demo) return;
      // เครื่องรู้ตัวว่าหลุดเครือข่าย ยิงไปก็ล้มแน่ ๆ — รอรอบถัดไป ไม่นับเป็นครั้งที่ลอง
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.scheduleRetry(null, true);
        return;
      }
      this._retryTries = (this._retryTries || 0) + 1;
      this.setState({ retryTries: this._retryTries });
      // 🚨 ส่งแบบเงียบ — ไม่เปิดหน้าเต็มจอทั้งตอนสำเร็จและตอนล้ม
      //    เภสัชกรอาจกำลังกรอกล็อตถัดไปอยู่ หน้าเต็มจอเด้งขึ้นมาเองคือการขัดจังหวะ
      this.save({ auto: true });
    }, wait);
  };

  clearRetry = () => {
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    this._retryStep = 0;
    this._retryTries = 0;
    this.setState({ retryAt: 0, retryTries: 0 });
  };

  componentWillUnmount() {
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
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
    if (this._revTimer) clearInterval(this._revTimer);
    if (this._ownTimer) clearTimeout(this._ownTimer);
    if (this._catMoreObs) { this._catMoreObs.disconnect(); this._catMoreObs = null; }
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.lockWidth);
      window.visualViewport.removeEventListener('scroll', this.lockWidth);
    }
    document.removeEventListener('touchmove', this._blockBgScroll);
    document.removeEventListener('wheel', this._blockBgScroll);
    document.removeEventListener('scroll', this._pinLeft, true);
    window.removeEventListener('scroll', this._pinLeft);
    window.removeEventListener('touchmove', this._pinLeft);
    window.removeEventListener('touchend', this._pinLeft);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKey);
    document.removeEventListener('gesturestart', this._onGesture);
    document.removeEventListener('gesturechange', this._onGesture);
    document.removeEventListener('gestureend', this._onGesture);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('touchcancel', this._onTouchEnd);
    document.removeEventListener('mousedown', this._onDocDown);
    document.removeEventListener('visibilitychange', this._onVisible);
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('beforeunload', this._onBeforeUnload);
    window.removeEventListener('offline', this._onOffline);
    window.removeEventListener('pagehide', releaseTab);
    if (this._vv && this._onVV) {
      this._vv.removeEventListener('resize', this._onVV);
      this._vv.removeEventListener('scroll', this._onVV);
    }
  }

  render() {
    // ตัวจับเวลาสำหรับหาจุดที่หนัก — มีเฉพาะตอนรันในเครื่อง เปิดด้วย window.__mrvPerf
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && window.__mrvPerf) {
      const t0 = performance.now();
      const out = renderShell(this);
      const ms = performance.now() - t0;
      const log = (window.__mrvPerfLog = window.__mrvPerfLog || {});
      const box = (log['(วาดทั้งหน้า)'] = log['(วาดทั้งหน้า)'] || { n: 0, total: 0, max: 0 });
      box.n++; box.total += ms; box.max = Math.max(box.max, ms);
      return out;
    }
    return renderShell(this);
  }
}
