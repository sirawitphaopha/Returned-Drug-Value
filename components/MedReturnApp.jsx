'use client';
// แกนกลางของแอป — เก็บสถานะทั้งหมดไว้ก้อนเดียวเหมือนมอคอัป (บรรทัด 840–910)
// เมธอดทั้งหมดอยู่ใน handlers/ · การวาดจออยู่ใน shell.jsx กับ pages/
import React from 'react';
import { installHandlers } from './handlers';
import { renderShell } from './shell';
import { LS, readLS, readCache } from './helpers';

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

      query: '',
      hn: '',
      source: 'opd',
      orgName: 'ห้องยาผู้ป่วยนอก · รพ.ปรางค์กู่',
      favIds: [],
      defaultSource: 'opd',
      settingsOpen: false,
      favQuery: '',
      showMore: false,
      saveFailed: false,
      rows: [],
      sheet: null,
      sheetQty: '',
      sheetDisp: 'reuse',

      // ประวัติมาจากฐานข้อมูล ไม่ได้กองอยู่ในเครื่องเหมือนมอคอัป (มอคอัปใช้ state.records)
      histQuery: '',
      histRange: 'month',
      histRows: [],
      histTotal: 0,
      histSaved: 0,
      histLoading: false,
      confirm: null,

      // หน้าสรุป — ยอดทั้งปีงบคิดมาจากฐานข้อมูลก้อนเดียว
      sum: null,
      sumLoading: false,
      exporting: false,
      dark: false,
      animSaved: 0,
      toast: null,
      vw: 430,
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
      priceShown: 40
    };

    this.searchRef = React.createRef();
    this.qtyRef = React.createRef();
    this.sheetQtyRef = React.createRef();

    this._onResize = () => this.setState({ vw: window.innerWidth });
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
    if (Array.isArray(draft)) patch.rows = draft;
    if (Array.isArray(drugs)) patch.drugs = drugs;
    if (setting) {
      patch.orgName = setting.orgName;
      patch.favIds = setting.favIds;
      patch.defaultSource = setting.defaultSource;
      patch.source = setting.defaultSource;
    }

    this.setState(patch, () => {
      this.animateTo(this.savedTotal());
      this.boot();
    });
    window.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    if (this._orgTimer) clearTimeout(this._orgTimer);
    if (this._histTimer) clearTimeout(this._histTimer);
    window.removeEventListener('resize', this._onResize);
  }

  render() {
    return renderShell(this);
  }
}
