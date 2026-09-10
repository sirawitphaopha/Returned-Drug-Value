// หน้าประวัติ — อ่านจากเซิร์ฟเวอร์ · แก้และลบทีละรายการ
// ต่างจากมอคอัปตรงที่มอคอัปกรองในเครื่อง (ข้อมูลกองอยู่ในเครื่องอยู่แล้ว)
// ของจริงข้อมูลอยู่ในฐานข้อมูล เลยให้ SQL กรองแล้วส่งมาแค่ 60 แถวบนสุด
import { money } from '@/lib/format';
import { SS, fetchT } from '../helpers';
import { recordsToCsv, downloadCsv } from '@/lib/csv';
// ตัวแปลงแป้นพิมพ์ไทยเป็นอังกฤษ — ไฟล์เดียวกับที่หน้าบันทึกและหน้าคลังยาใช้
import { thaiToEnglish } from '@/lib/drugSearch';

const DEBOUNCE = 300;

export function historyActions(app) {
  app._histTimer = null;
  // เลขลำดับคำขอ — ถ้าพิมพ์เร็วจนคำตอบเก่ากลับมาทีหลัง จะได้ทิ้งของเก่าไป
  app._histSeq = 0;

  const keyOf = () => {
    const st = app.state;
    // 🚨 ตัวกรอง 3 ทางต้องอยู่ในกุญแจด้วย ไม่งั้นเปลี่ยนตัวกรองแล้วได้ของชุดเดิมกลับมา
    return [st.histRange, st.histQuery.trim(), st.histTrash ? 'T' : '', st.histLot,
      st.histFrom, st.histTo, st.histDisp, st.histSrc, st.histBy, st.histSite].join('\n');
  };

  // qUse = คำที่ใช้ค้นจริง · ปกติคือคำที่พิมพ์ แต่ถ้าลืมสลับแป้นจะเป็นคำที่แปลงแล้ว
  const urlOf = (offset, qUse) => {
    const st = app.state;
    const q = qUse == null ? st.histQuery.trim() : qUse;
    let u = '/api/returns?range=' + encodeURIComponent(st.histRange) +
      '&q=' + encodeURIComponent(q);
    if (st.histTrash) u += '&trash=1';
    if (st.histLot) u += '&lot=' + encodeURIComponent(st.histLot);
    if (st.histRange === 'custom') {
      u += '&from=' + encodeURIComponent(st.histFrom) + '&to=' + encodeURIComponent(st.histTo);
    }
    // ตัวกรอง 3 ทาง — ส่งเฉพาะตัวที่เลือกไว้จริง (เว้นว่าง = ไม่กรอง)
    if (st.histDisp) u += '&disp=' + encodeURIComponent(st.histDisp);
    if (st.histSrc) u += '&src=' + encodeURIComponent(st.histSrc);
    if (st.histBy) u += '&by=' + encodeURIComponent(st.histBy);
    if (st.histSite) u += '&site=' + encodeURIComponent(st.histSite);
    if (offset) u += '&offset=' + offset;
    return u;
  };

  app.loadHistory = async (force) => {
    if (app.state.demo) { app.demoLoadHistory(); return; }
    const k = keyOf();
    // ของที่โหลดไว้แล้วอยู่ได้ข้ามการรีเฟรช — ไม่มีตัวจับเวลาหมดอายุ
    // ลายเซ็นข้อมูลจาก /api/rev เป็นตัวบอกว่าเมื่อไหร่ต้องทิ้ง (ตรงกว่านาฬิกา)
    const c = app.boxGet(SS.hist, k, app._histCache);
    if (!force && c) {
      // ต้องคืนธงลืมสลับแป้นมาด้วย ไม่งั้นพอหยิบจากแคช ป้าย "ค้นว่า ..." จะหายไปเฉย ๆ
      // ทั้งที่ผลลัพธ์บนจอยังเป็นของคำที่แปลงแล้ว
      app.setState({
        histRows: c.rows, histTotal: c.total, histSaved: c.saved,
        histLost: Number(c.lost || 0),
        histMore: [], histLoading: false,
        histSwapped: !!c.swapped, histSwapLabel: c.swapLabel || '',
        // 🚨 ต้องคืนรายชื่อผู้บันทึกมาด้วย ไม่งั้นพอหยิบจากแคช ช่องเลือกคนบันทึกจะว่างเปล่า
        //    ทั้งที่ยังกรองด้วยชื่อคนนั้นอยู่ (ตระกูลเดียวกับป้าย "ค้นว่า ..." ที่เคยหาย)
        histPeople: Array.isArray(c.people) ? c.people : []
      });
      return;
    }

    const seq = ++app._histSeq;
    app.setState({ histLoading: true });

    try {
      const raw = app.state.histQuery.trim();
      let res = await app.fetchT(urlOf(0));
      let data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านประวัติไม่สำเร็จ');

      // ── ลืมสลับแป้นพิมพ์ ──────────────────────────────────────────────
      // ตั้งใจพิมพ์ metformin แต่แป้นค้างที่ไทย ได้ "ทำะดนพทรื" แล้วไม่เจออะไรเลย
      // กติกาเดียวกับหน้าบันทึกและหน้าคลังยา (สกิล pharmacy-web-logic ข้อ 12)
      //
      // ต่างจากสองหน้านั้นตรงที่หน้านี้ค้นที่เซิร์ฟเวอร์ จึงรู้ผลก็ต่อเมื่อคำตอบกลับมาแล้ว
      // เลยต้องยิงรอบสอง — เกิดเฉพาะตอนพิมพ์ผิดแป้นจริง ๆ ซึ่งนาน ๆ ครั้ง
      let swapped = false;
      let swapLabel = '';
      if (Number(data.total || 0) === 0 && /[฀-๿]/.test(raw)) {
        const alt = thaiToEnglish(raw).trim();
        if (alt && alt !== raw) {
          const res2 = await app.fetchT(urlOf(0, alt));
          const data2 = await res2.json();
          if (res2.ok && Number(data2.total || 0) > 0) {
            res = res2; data = data2; swapped = true; swapLabel = alt;
          }
        }
      }

      // ตรวจหมายเลขลำดับ "ก่อน" เขียนแคช ไม่งั้นคำตอบเก่าที่ถูกทิ้งจะยังปนเปื้อนแคช
      // แล้วรายการที่เพิ่งลบไปจะโผล่กลับมาเมื่อสลับแท็บกลับภายใน 60 วินาที
      if (seq !== app._histSeq) return;
      app.clearLoadErr('hist');
      app.setState({ histSwapped: swapped, histSwapLabel: swapLabel });
      app.boxSet(SS.hist, k, app._histCache, {
        ts: Date.now(),
        rows: data.rows,
        total: Number(data.total || 0),
        saved: Number(data.saved || 0),
        lost: Number(data.lost || 0),
        swapped: swapped,
        swapLabel: swapLabel,
        people: Array.isArray(data.people) ? data.people : []
      });
      app.setState({
        histRows: data.rows,
        histTotal: Number(data.total || 0),
        histSaved: Number(data.saved || 0),
        histLost: Number(data.lost || 0),
        histMore: [],
        histLoading: false,
        // รายชื่อผู้บันทึกที่มีจริงในช่วงเวลานี้ — ฐานส่งมาพร้อมผลค้น
        histPeople: Array.isArray(data.people) ? data.people : []
      });
    } catch (e) {
      if (seq !== app._histSeq) return;
      app.setState({ histLoading: false });
      // ไม่งั้นหน้าจอขึ้น "ไม่พบรายการตามเงื่อนไขนี้" ทั้งที่ความจริงคือเน็ตหลุด
      // แล้วผู้ใช้จะไปไล่เปลี่ยนช่วงวันที่หาของที่ไม่เคยหายไปไหน
      app.markLoadErr('hist', 'โหลดประวัติไม่สำเร็จ');
      app.toast('อ่านประวัติไม่สำเร็จ', '', false);
    }
  };

  // ดูเพิ่มอีก 60 แถว — เดิมตัดที่ 60 แล้วบอกให้ "กรองช่วงวันที่ให้แคบลง"
  // ทั้งที่ไม่มีเครื่องมือให้เลือกช่วงวันเลย
  app.loadMoreHistory = async () => {
    if (app.state.demo) { app.demoLoadMore(); return; }
    if (app.state.histLoading) return;
    const offset = app.state.histRows.length + app.state.histMore.length;
    // 🚨 ต้องมีเลขลำดับกันคำตอบเก่าเหมือน loadHistory (ผลตรวจข้อ ต-4)
    //    กด "ดูเพิ่ม" แล้วรีบพิมพ์ค้นทันที คำตอบของชุดเก่าจะกลับมาทีหลัง
    //    แล้วต่อแถวที่ไม่ตรงเงื่อนไขปนเข้าไปในผลลัพธ์ชุดใหม่
    const seq = ++app._histSeq;
    app.setState({ histLoading: true });
    try {
      // 🚨 ต้องใช้คำที่แปลงแล้วด้วย ไม่งั้นกด "ดูเพิ่ม" ตอนค้นแบบลืมสลับแป้น
      //    จะยิงคำภาษาไทยกลับไปแล้วได้ศูนย์แถว ดูเหมือนข้อมูลหมดทั้งที่ยังมีอีก
      const res = await app.fetchT(urlOf(offset, app.state.histSwapped ? app.state.histSwapLabel : undefined));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อ่านประวัติไม่สำเร็จ');
      if (seq !== app._histSeq) return;      // มีคำขอใหม่แซงไปแล้ว ทิ้งคำตอบนี้
      app.setState({
        histMore: app.state.histMore.concat(data.rows || []),
        histLoading: false
      });
    } catch (e) {
      if (seq !== app._histSeq) return;
      app.setState({ histLoading: false });
      app.toast('โหลดเพิ่มไม่สำเร็จ', '', false);
    }
  };

  // ต่างจากมอคอัปโดยจำเป็น: ช่องค้นในหน้านี้ยิงเซิร์ฟเวอร์ เลยต้องหน่วง
  // (ช่องค้นยาในหน้าบันทึกไม่หน่วง เพราะค้นในเครื่อง)
  app.onHistQuery = (e) => {
    app.setState({ histQuery: e.target.value });
    if (app._histTimer) clearTimeout(app._histTimer);
    app._histTimer = setTimeout(() => app.loadHistory(), DEBOUNCE);
  };

  // ล้างช่องค้นหา — ทำเหมือนหน้าคลังยา ปุ่ม ✕ ในช่อง
  // ยิงทันทีไม่ต้องรอหน่วง เพราะเป็นการกดปุ่ม ไม่ใช่การพิมพ์รัว
  app.clearHistQuery = () => {
    if (app._histTimer) clearTimeout(app._histTimer);
    app.setState({ histQuery: '', histSwapped: false, histSwapLabel: '' }, () => app.loadHistory());
  };

  app.setHistRange = (key) => {
    app.setState({ histRange: key, histLot: '' }, () => app.loadHistory());
  };

  // กดหัวคอลัมน์ครั้งแรก = เรียงมากไปน้อย · กดซ้ำ = สลับทิศ · กดคอลัมน์อื่น = เริ่มใหม่
  // ล้างการเรียง กลับไปเรียงวันที่ใหม่ไปเก่าตามที่ฐานส่งมา (พี่กันสั่ง 4 ก.ย. 2569)
  app.clearHistSort = () => app.setState({ histSortKey: '', histSortDir: 'desc' });

  // ── ล้างตัวกรองทั้งหมดในทีเดียว (พี่กันสั่ง 10 ก.ย. 2569) ─────────────────
  //
  //   หน้านี้กรองซ้อนกันได้หลายชั้น — คำค้น · ช่วงเวลา · ช่วงวันที่เอง · Lot · การเรียง
  //   กรองไว้หลายชั้นแล้วลืม จะงงว่าทำไมรายการหายไป แล้วไล่ปิดทีละอันไม่ถูก
  //
  // 🚨 กลับไปเป็นค่าตั้งต้นของหน้า คือ "เดือนนี้" ไม่ใช่ล้างจนว่างเปล่า
  //    ล้างช่วงเวลาทิ้งด้วยจะไม่เหลืออะไรให้ดูเลย ซึ่งไม่ใช่สิ่งที่คนกดต้องการ
  // 🚨 ไม่แตะถังขยะ — อยู่ในถังขยะแล้วกดล้างตัวกรอง ต้องยังอยู่ในถังขยะ
  //    ทางออกจากถังขยะมีปุ่มของตัวเองอยู่แล้ว ("กลับไปดูรายการปกติ")
  app.clearHistFilters = () => {
    if (app._histTimer) clearTimeout(app._histTimer);
    app.setState({
      histQuery: '', histSwapped: false, histSwapLabel: '',
      histRange: 'month', histFrom: '', histTo: '',
      histLot: '', histSortKey: '', histSortDir: 'desc',
      // 🚨 ตัวกรอง 3 ทางต้องล้างด้วย ไม่งั้นกดล้างแล้วรายการยังหายอยู่
      //    โดยไม่มีอะไรบนจอบอกว่าเพราะอะไร
      histDisp: '', histSrc: '', histBy: '', histSite: ''
    }, () => app.loadHistory());
  };

  // ── กดชื่อยาในตาราง แล้วกรองเฉพาะยาตัวนั้น (พี่กันสั่ง 10 ก.ย. 2569) ──────
  //
  // 🚨 ใส่ชื่อลงช่องค้นหาจริง ๆ ไม่ใช่กรองแบบซ่อนอยู่เบื้องหลัง
  //    ผู้ใช้จะได้เห็นว่ากำลังกรองด้วยอะไร แก้คำต่อเองได้ และกดปุ่มล้างในช่องได้ตามปกติ
  //    (บทเรียนเดิม — ตัวกรองที่มองไม่เห็นบนจอ ทำให้ผลลัพธ์ว่างโดยไม่รู้สาเหตุ)
  // 🚨 ใช้ชื่อที่ตาเห็นในตาราง ไม่ใช่รหัสยา — ฐานค้นจากข้อความ
  //    และถ้าชื่อยาวเกินไปจนไม่เจอ ผู้ใช้ลบคำท้ายออกเองได้ทันที
  app.filterByDrug = (name) => {
    const q = String(name || '').trim();
    if (!q) return;
    if (app._histTimer) clearTimeout(app._histTimer);
    app.setState({ histQuery: q, histSwapped: false, histSwapLabel: '', histLot: '' },
      () => app.loadHistory());
  };

  app.setHistSort = (key) => {
    // 🚨 ตอนยังไม่ได้กดเรียง ตารางเรียงวันที่ใหม่ไปเก่าอยู่แล้ว (ฐานส่งมาแบบนั้น)
    //    กดคอลัมน์วันที่ครั้งแรกจึงต้องสลับเป็นเก่าไปใหม่ทันที ไม่ใช่ตั้ง desc ซ้ำ
    //    ไม่งั้นกดแล้วหน้าจอไม่เปลี่ยนอะไรเลย ดูเหมือนปุ่มเสีย (พี่กันทัก 4 ก.ย. 2569)
    if (!app.state.histSortKey && key === 'date') {
      app.setState({ histSortKey: key, histSortDir: 'asc' });
      return;
    }
    if (app.state.histSortKey === key) {
      app.setState({ histSortDir: app.state.histSortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      app.setState({ histSortKey: key, histSortDir: 'desc' });
    }
  };

  // ── ตัวกรอง 3 ทาง (พี่กันสั่ง 10 ก.ย. 2569) ────────────────────────────
  //
  // 🚨 ยิงเซิร์ฟเวอร์ทันที ไม่หน่วง — เป็นการกดเลือกจากรายการ ไม่ใช่การพิมพ์รัว
  // 🚨 ล้าง histLot ทิ้งด้วยทุกครั้ง — กำลังดูเฉพาะ Lot เดียวอยู่แล้วมาเลือกตัวกรองอื่น
  //    ถ้าไม่ล้าง จะเหลือเงื่อนไขซ้อนกันจนผลว่าง แล้วหาสาเหตุไม่เจอ
  //    (บทเรียนเดิมจากตัวกรอง รพ.สต. หน้ารายการ Lot — ข้อ 3.52)
  app.setHistDisp = (e) => {
    app.setState({ histDisp: e.target.value, histLot: '' }, () => app.loadHistory());
  };
  // 🚨 เปลี่ยนแหล่งที่มาไปเป็นอย่างอื่น ต้องล้างชื่อ รพ.สต. ทิ้งด้วย
  //    ไม่งั้นเหลือเงื่อนไขซ่อนอยู่ที่มองไม่เห็นบนจอ แล้วผลว่างโดยไม่รู้สาเหตุ
  //    (กติกาเดียวกับหน้ารายการ Lot — CLAUDE.md ข้อ 3.52)
  app.setHistSrc = (e) => {
    const v = e.target.value;
    app.setState({ histSrc: v, histSite: v === 'pcu' ? app.state.histSite : '', histLot: '' },
      () => app.loadHistory());
  };
  app.setHistSite = (e) => {
    app.setState({ histSite: e.target.value, histLot: '' }, () => app.loadHistory());
  };

  app.setHistBy = (e) => {
    app.setState({ histBy: e.target.value, histLot: '' }, () => app.loadHistory());
  };


  app.onHistFrom = (e) => app.setState({ histFrom: e.target.value, histRange: 'custom' }, () => app.loadHistory());
  app.onHistTo = (e) => app.setState({ histTo: e.target.value, histRange: 'custom' }, () => app.loadHistory());

  // ถังขยะ — ของที่ลบไปแล้วยังอยู่ในฐาน กู้คืนได้
  // ── แผ่นตัวกรองฝั่งมือถือ — โทนเดียวกับหน้ารายการ Lot (พี่กันสั่ง 3 ก.ย. 2569) ──
  //    ช่องวันที่ ถังขยะ และป้ายกรอง Lot ย้ายเข้าแผ่นที่เลื่อนขึ้นจากขอบล่าง
  //    เหลือบนหัวแค่ ช่องค้นหา ชิปช่วงเวลา และปุ่มรายการ Lot ที่พี่กันขอให้เด่น
  app.openHistFilter = () => app.setState({ histFilterOpen: true });
  app.closeHistFilter = () => app.setState({ histFilterOpen: false });

  // ── เปิดถังขยะจากหน้าตั้งค่า (พี่กันสั่ง 10 ก.ย. 2569) ──────────────────
  //   "เอาปุ่มถังขยะออก เอาไปไว้ที่ตั้งค่า เอาไว้กดแล้วมันจะเด้งมาหน้าตารางนี้เอง"
  //
  // 🚨 ถังขยะเป็นของที่ใช้นาน ๆ ครั้ง (กู้รายการที่ลบผิด) แต่กินที่ในแถบเครื่องมือ
  //    ที่ต้องใช้ทุกวันตลอดเวลา · ย้ายมาไว้ในตั้งค่าแล้วกดทีเดียวเด้งไปหน้าประวัติเลย
  // 🚨 ปุ่ม "กลับไปดูรายการปกติ" ยังอยู่ในแถบเครื่องมือเหมือนเดิม
  //    แต่โผล่เฉพาะตอนอยู่ในถังขยะ ไม่งั้นเข้าไปแล้วออกไม่ได้
  app.openTrash = () => {
    app.setState({ settingsOpen: false, favQuery: '', screen: 'history', histTrash: true, histLot: '', histQuery: '' },
      () => { app.loadHistory(); if (app.toTop) app.toTop(); });
  };

  app.toggleTrash = () => {
    app.setState({ histTrash: !app.state.histTrash, histLot: '' }, () => app.loadHistory());
  };

  app.viewLot = (lot) => {
    app.setState({ histLot: lot || '', histTrash: false, histQuery: '' }, () => app.loadHistory());
  };

  app.restoreRecord = async (r) => {
    if (app._busyRow === r.id) return;
    app._busyRow = r.id;
    const back = { histRows: app.state.histRows };
    app.setState({ histRows: app.state.histRows.filter((x) => x.id !== r.id), confirm: null });
    try {
      const res = await app.fetchT('/api/returns/' + r.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'กู้คืนไม่สำเร็จ');
      app.invalidate();
      app.toast('กู้คืนรายการแล้ว', r.name);
      app.loadHistory(true);
      app.refreshFy();
    } catch (e) {
      app.setState(back);
      app.toast((e && e.message) || 'กู้คืนไม่สำเร็จ', '', false);
    } finally {
      app._busyRow = null;
    }
  };

  app.askRestoreRecord = (r) => {
    app.setState({
      confirm: {
        title: 'ยืนยันกู้คืนรายการนี้',
        detail: r.name + ' · ' + r.qty + ' ' + r.unit + ' · ' + money(Number(r.price) * r.qty),
        note: 'รายการจะกลับเข้าไปนับในมูลค่าสะสมปีงบอีกครั้ง',
        okLabel: 'ยืนยันกู้คืน',
        run: () => app.restoreRecord(r)
      }
    });
  };

  // ส่งออก CSV เฉพาะที่กรองอยู่ตอนนี้ — ต่างจากปุ่มในหน้าสรุปที่ส่งออกทั้งปีงบ
  // (เช่น อยากได้เฉพาะเดือนนี้ หรือเฉพาะล็อตเดียว หรือเฉพาะที่ค้นด้วยชื่อคนบันทึก)
  app.exportHistoryCsv = async () => {
    if (app.state.exporting) return;
    const st = app.state;
    app.setState({ exporting: true });
    try {
      let rows;
      if (st.demo) {
        rows = st.histRows.concat(st.histMore);
      } else {
        // ขอทั้งชุดที่ตรงเงื่อนไข ไม่ใช่แค่ 60 แถวที่โชว์บนจอ
        const res = await app.fetchT(urlOf(0).replace('range=', 'limit=all&range='));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'ส่งออกไฟล์ไม่สำเร็จ');
        rows = data.rows || [];
      }
      if (!rows.length) {
        app.setState({ exporting: false });
        app.toast('ไม่มีรายการให้ส่งออก', '', false);
        return;
      }

      const scope = st.histTrash ? 'ถังขยะ' : st.histLot ? 'ชุด ' + st.histLot : rangeName(st);
      downloadCsv(
        recordsToCsv(rows, {
          orgName: st.orgName,
          fyLabel: String(st.fyYear || ''),
          rangeLabel: scope + (st.histQuery ? ' · ค้น "' + st.histQuery + '"' : ''),
          printedOn: st.today
        }),
        'มูลค่ายาคืน-' + scope.replace(/[\\/:*?"<>|\s]/g, '') + '.csv'
      );
      app.setState({ exporting: false });
      app.toast('ส่งออกไฟล์แล้ว', rows.length.toLocaleString('en-US') + ' รายการ');
    } catch (e) {
      app.setState({ exporting: false });
      app.toast((e && e.message) || 'ส่งออกไฟล์ไม่สำเร็จ', '', false);
    }
  };

  // 🗑 เคยมี app.loadLots ตัวหนึ่งอยู่ตรงนี้ — ลบทิ้งแล้ว (ผลตรวจข้อ ต-8)
  //    เป็นโค้ดตาย เพราะ handlers/index.js ติดตั้ง historyActions ก่อน lotsActions
  //    ตัวใน handlers/lots.js จึงเขียนทับตัวนี้เสมอ ไม่มีทางถูกเรียกเลยสักครั้ง
  //    อันตรายตรงที่คนมาแก้ทีหลังอาจแก้ผิดตัวแล้วงงว่าทำไมไม่มีอะไรเปลี่ยน
  //    ตัวจริงอยู่ที่ handlers/lots.js (มีแคช · รองรับ force · กรองช่วงเวลาของตัวเอง)

  // ราคาที่โชว์ในป๊อปอัปต้องเป็นราคาที่แช่ไว้ในแถว ไม่ใช่ราคาปัจจุบันของยาตัวนั้น
  app.editRecord = (r) => {
    const drug = { id: r.drugId, name: r.name, unit: r.unit, price: Number(r.price) };
    app.openSheet(drug, 'record', r.id, r.qty, r.disposition);
  };

  // แก้บนจอก่อน แล้วค่อยยิงเซิร์ฟเวอร์ ถ้าล้มเหลวย้อนกลับให้เหมือนเดิม
  app.saveRecordEdit = async (id, qty, disp, drug) => {
    if (app._busyRow === id) return;       // กันกดซ้อนตอนคำขอเดิมยังไม่กลับ
    app._busyRow = id;

    const st = app.state;
    const before = st.histRows;
    const old = before.find((r) => r.id === id);
    const after = before.map((r) => (r.id === id ? Object.assign({}, r, { qty: qty, disposition: disp }) : r));

    // ยอดรวมบนหัวต้องขยับพร้อมแถว ไม่งั้นตัวเลขกับรายการที่เห็นขัดกันเอง 1-2 วิ
    // (และค้างผิดถาวรถ้าการโหลดรอบตามล้มเหลว)
    const oldVal = old && old.disposition === 'reuse' ? Number(old.price) * old.qty : 0;
    const newVal = disp === 'reuse' ? Number(drug.price) * qty : 0;
    const back = { histRows: before, histSaved: st.histSaved };

    app.setState({ histRows: after, histSaved: st.histSaved - oldVal + newVal, sheet: null, sheetQty: '' });

    try {
      const res = await app.fetchT('/api/returns/' + id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qty: qty, disposition: disp })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'แก้ไขไม่สำเร็จ');

      app.invalidate();
      app.toast('แก้ไขรายการแล้ว', money(drug.price * qty));
      app.loadHistory(true);
      app.refreshFy();
    } catch (e) {
      app.setState(back);
      app.toast((e && e.message) || 'แก้ไขไม่สำเร็จ', '', false);
    } finally {
      app._busyRow = null;
    }
  };

  // ต่างจากมอคอัปโดยตั้งใจ: มอคอัปกดลบแล้วหายเลย ของจริงต้องยืนยันก่อน 1 ชั้น
  app.askDeleteRecord = (r) => {
    // 🚨 ตั้งค่าเริ่มต้นจากคนที่กำลังทำงานอยู่ตอนนี้ ไม่ใช่คนล่าสุดที่จำไว้ในฐาน
    //    st.recorder ว่างเปล่าเสมอตอนเปิดเว็บ (กฎข้อ 3.24) จึงไม่มีทางเซ็นในชื่อคนก่อน
    app.setState({
      confirmWho: app.state.recorder || '',
      confirm: {
        title: 'ยืนยันลบรายการนี้',
        detail: r.name + ' · ' + r.qty + ' ' + r.unit + ' · ' + money(Number(r.price) * r.qty),
        // 🚨 ข้อความต้องตรงกับสิ่งที่ระบบทำจริง (ผลตรวจข้อ ส-5)
        //    เดิมเขียนว่า "กู้คืนไม่ได้" ซึ่งไม่จริง — การลบที่นี่เป็นการย้ายเข้าถังขยะ
        //    (ประทับเวลาไว้ในแถว ไม่ได้ลบออกจากฐาน) และมีปุ่มกู้คืนอยู่ในถังขยะจริง
        //    เขียนให้กลัวเกินจริงแล้วเภสัชกรไม่กล้าลบรายการที่กรอกผิด
        note: 'รายการจะถูกย้ายไปถังขยะ · มูลค่าสะสมปีงบลดลงทันที · กู้คืนได้ที่ปุ่มถังขยะ',
        okLabel: 'ยืนยันลบ',
        who: 'ผู้ที่ลบ',
        run: (by) => app.deleteRecord(r, by)
      }
    });
  };

  app.closeConfirm = () => app.setState({ confirm: null });

  app.deleteRecord = async (r, by) => {
    if (app._busyRow === r.id) return;
    app._busyRow = r.id;

    const st = app.state;
    const back = { histRows: st.histRows, histTotal: st.histTotal, histSaved: st.histSaved };
    const val = r.disposition === 'reuse' ? Number(r.price) * r.qty : 0;

    app.setState({
      histRows: st.histRows.filter((x) => x.id !== r.id),
      histTotal: Math.max(0, st.histTotal - 1),
      histSaved: st.histSaved - val,
      confirm: null
    });

    try {
      // ส่งชื่อผู้ลบไปด้วย (ผลตรวจข้อ ต-6) — หลังบ้านรับ `by` มาตั้งแต่แรกแต่ไม่เคยมีใครส่ง
      // `deleted_by` เลยเป็นค่าว่างทุกแถว ตอบผู้ตรวจไม่ได้ว่าใครลบ
      // ✅ บังคับเลือกแล้ว 2 ก.ย. 2569 — ป๊อปยืนยันมีช่อง 'ผู้ที่ลบ' และปุ่มปิดจนกว่าจะเลือก
      //    ค่าที่ส่งมาทาง by คือชื่อที่เลือกในป๊อปนั้น ไม่ใช่ช่องผู้บันทึกในหน้าบันทึก
      const res = await app.fetchT('/api/returns/' + r.id, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ by: String(by || app.state.recorder || '').trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');

      app.invalidate();
      app.toast('ลบรายการแล้ว', r.name);
      app.loadHistory(true);
      app.refreshFy();
    } catch (e) {
      app.setState(back);
      app.toast((e && e.message) || 'ลบไม่สำเร็จ', '', false);
    } finally {
      app._busyRow = null;
    }
  };
}

// ชื่อช่วงเวลาที่กำลังดูอยู่ — ไว้ตั้งชื่อไฟล์กับหัวไฟล์ CSV
function rangeName(st) {
  if (st.histRange === 'custom') return (st.histFrom || '?') + ' ถึง ' + (st.histTo || '?');
  if (st.histRange === 'today') return 'วันนี้';
  if (st.histRange === 'week') return '7 วันล่าสุด';
  if (st.histRange === 'month') return 'เดือนนี้';
  return 'ปีงบ ' + (st.fyYear || '');
}
