// หน้าจัดการราคายา — ไม่มีในมอคอัป (มอคอัปใช้ราคาปลอมฝังในไฟล์)
//
// วิธีทำงานเหมือนหน้าบันทึก: แก้กองไว้ก่อน แล้วกดบันทึกทีเดียว
// ไม่ใช่แก้ช่องไหนก็เขียนฐานทันที เพราะพิมพ์ราคาผิดกลางคันจะเขียนค่าครึ่ง ๆ ลงไป
import { LS, clearLS, fetchT } from '../helpers';

const PAGE = 40;

// แก้แล้วค่าต่างจากเดิมจริงไหม — พิมพ์ทับแล้วพิมพ์กลับเป็นค่าเดิมไม่นับว่าแก้
// vals ใช้ตัวนี้นับเลขบนปุ่ม ตัวบันทึกใช้ตัวเดียวกันคัดรายการ เลขบนปุ่มจะได้ตรงกับที่ส่งจริง
export function priceDirty(item, edits) {
  const e = edits[String(item.id)];
  if (!e) return false;
  if (e.price !== undefined && Number(e.price === '' ? 0 : e.price) !== item.price) return true;
  if (e.unitTh !== undefined && e.unitTh.trim() !== item.unitTh) return true;
  return false;
}

export function pricesActions(app) {
  app.openPrices = () => {
    app.setState({ screen: 'prices', settingsOpen: false, priceQuery: '', priceShown: PAGE });
    app.loadPrices();
  };

  app.closePrices = () => app.setState({ screen: 'record' });

  app.loadPrices = async (force) => {
    if (!force && app.state.priceItems.length) return;
    app.setState({ priceLoading: true });
    try {
      const res = await fetchT('/api/prices');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดราคายาไม่สำเร็จ');
      app.setState({ priceItems: data.items, priceLoading: false });
    } catch (e) {
      app.setState({ priceLoading: false });
      app.toast(e.message || 'โหลดราคายาไม่สำเร็จ', '', false);
    }
  };

  app.onPriceQuery = (e) => app.setState({ priceQuery: e.target.value, priceShown: PAGE });
  app.setPriceFilter = (key) => app.setState({ priceFilter: key, priceShown: PAGE });
  app.morePrices = () => app.setState({ priceShown: app.state.priceShown + PAGE });

  // เก็บเป็นข้อความดิบไว้ก่อน คนพิมพ์ "12." กลางคันต้องไม่โดนลบทิ้ง
  app.editPrice = (id, value) => {
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;
    app.setState({ priceEdits: patchEdit(app, id, { price: value }) });
  };

  app.editUnit = (id, value) => {
    app.setState({ priceEdits: patchEdit(app, id, { unitTh: value.slice(0, 24) }) });
  };

  app.resetPriceEdits = () => app.setState({ priceEdits: {} });

  app.savePrices = async () => {
    const edits = app.state.priceEdits;
    const ids = Object.keys(edits);
    if (!ids.length || app.state.priceSaving) return;

    const byId = new Map(app.state.priceItems.map((it) => [String(it.id), it]));
    const items = [];
    for (const key of ids) {
      const base = byId.get(key);
      if (!base || !priceDirty(base, edits)) continue;
      const e = edits[key];
      const price = e.price === undefined ? base.price : Number(e.price === '' ? 0 : e.price);
      if (!Number.isFinite(price) || price < 0) {
        app.toast('ราคาต้องเป็นตัวเลขไม่ติดลบ', '', false);
        return;
      }
      items.push({
        drugId: base.id,
        price: price,
        unitTh: e.unitTh === undefined ? base.unitTh : e.unitTh.trim()
      });
    }
    if (!items.length) { app.setState({ priceEdits: {} }); return; }

    app.setState({ priceSaving: true });
    try {
      const res = await fetchT('/api/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกราคาไม่สำเร็จ');

      app.setState({ priceEdits: {}, priceSaving: false });
      // ราคาเปลี่ยนแล้ว แคชยาในเครื่องใช้ไม่ได้ ต้องดึงใหม่ทั้งชุด
      // ไม่งั้นหน้าบันทึกจะยังโชว์ราคาเก่าไปอีก 12 ชั่วโมง
      clearLS(LS.drugs);
      await Promise.all([app.loadPrices(true), app.boot()]);
      app.toast('บันทึกราคา ' + items.length + ' รายการ', '');
    } catch (e) {
      app.setState({ priceSaving: false });
      app.toast(e.message || 'บันทึกราคาไม่สำเร็จ', '', false);
    }
  };
}

function patchEdit(app, id, patch) {
  const key = String(id);
  const cur = app.state.priceEdits[key] || {};
  return Object.assign({}, app.state.priceEdits, { [key]: Object.assign({}, cur, patch) });
}
