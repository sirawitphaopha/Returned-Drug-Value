// ค่าของหน้าต่างตั้งค่า — คัดจากมอคอัป (บรรทัด 1322–1358)
// orgName / settingsOpen / openSettings / closeSettings อยู่ใน shellVals แล้ว
import { SOURCES } from '@/lib/format';
import { APP_VERSION, APP_FIRST_RELEASE, APP_LAST_UPDATE } from '../helpers';

export function settingsVals(app, d) {
  const st = d.st;
  const byId = new Map(st.drugs.map((x) => [x.id, x]));
  const favQ = st.favQuery.trim().toLowerCase();
  const label = (dr) => dr.price.toFixed(2) + ' ฿/' + dr.unit;
  const priced = st.drugs.filter((x) => x.hasPrice).length;

  return {
    onOrgName: app.onOrgName,

    settingsAlign: d.wide ? 'center' : 'flex-end',
    settingsRadius: d.wide ? '16px' : '22px 22px 0 0',
    settingsMaxW: d.wide ? '600px' : '520px',
    settingsMaxH: d.wide ? '84vh' : '88vh',

    // 🚨 ต้องส่งชื่อย่อไปด้วย — ฝั่งมือถือใช้ชื่อย่อให้ชิปอยู่แถวเดียว
    //    (พี่กันสั่ง 1 ก.ย. 2569 "ย่ออันนี้ด้วยสิ" · ทำแบบเดียวกับชิปในหน้าบันทึก)
    defaultSources: SOURCES.map((sc) => ({
      label: sc.label,
      short: sc.short || sc.label,
      on: st.defaultSource === sc.key,
      bg: st.defaultSource === sc.key ? '#2f7d5d' : '#f0f1ee',
      fg: st.defaultSource === sc.key ? '#fff' : '#414a44',
      pick: () => app.pickDefaultSource(sc.key)
    })),

    favList: st.favIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((dr) => ({
        id: dr.id,
        name: dr.name,
        priceLabel: label(dr),
        remove: () => app.removeFav(dr.id)
      })),
    favCountLabel: st.favIds.length + ' / 6',
    favFull: st.favIds.length >= 6,
    favNotFull: st.favIds.length < 6,
    favQuery: st.favQuery,
    onFavQuery: app.onFavQuery,
    favResults: (favQ.length >= 2 && st.favIds.length < 6
      ? st.drugs.filter((x) => x.name.toLowerCase().indexOf(favQ) >= 0 && st.favIds.indexOf(x.id) < 0).slice(0, 5)
      : []
    ).map((dr) => ({
      id: dr.id,
      name: dr.name,
      priceLabel: label(dr),
      add: () => app.addFav(dr.id)
    })),

    // 🚨 ปุ่มที่เลือกอยู่ใช้เขียวของเว็บ ไม่ใช่ดำแบบมอคอัป (กฎเดิมของโปรเจกต์นี้)
    //    ปุ่ม 'เข้ม' ใช้เขียวอยู่แล้ว แต่ปุ่ม 'สว่าง' ยังเป็นดำจากมอคอัป หลุดมาตั้งแต่แรก
    //    ผลคือสองปุ่มที่ทำหน้าที่คู่กันเป็นคนละสี ดูเหมือนคนละระบบ (พี่กันทัก 3 ก.ย. 2569)
    themeLightOn: !d.dark,
    themeLightBg: d.dark ? '#f0f1ee' : '#2f7d5d',
    themeLightFg: d.dark ? '#414a44' : '#fff',
    themeDarkBg: d.dark ? '#2f7d5d' : '#f0f1ee',
    themeDarkFg: d.dark ? '#fff' : '#414a44',
    setLight: () => app.setTheme(false),
    setDark: () => app.setTheme(true),

    // สวิตช์ดูโครงจางค้างไว้ (เครื่องมือดูงาน ไม่ใช่การตั้งค่าของผู้ใช้)
    skelDemo: !!st.skelDemo,
    toggleSkelDemo: app.toggleSkelDemo,

    // ── ฟอนต์ตัวอักษรอังกฤษและตัวเลข (พี่กันสั่ง 27 ส.ค. 2569 · เอาแบบเดียวกับเว็บ HCV) ──
    // ภาษาไทยใช้ Sarabun เสมอไม่ว่าเลือกอะไร เพราะ Roboto Mono ไม่มีตัวอักษรไทย
    enFontMono: st.enFont !== 'thai',
    enMonoBg: st.enFont !== 'thai' ? '#e3f0e8' : '#fff',
    enMonoBd: st.enFont !== 'thai' ? '#2f7d5d' : 'rgba(30,36,32,.14)',
    enThaiBg: st.enFont === 'thai' ? '#e3f0e8' : '#fff',
    enThaiBd: st.enFont === 'thai' ? '#2f7d5d' : 'rgba(30,36,32,.14)',
    setEnMono: () => app.setEnFont('mono'),
    setEnThai: () => app.setEnFont('thai'),

    // มอคอัปนับรายการที่เก็บในเครื่อง ของจริงนับจากฐานข้อมูลของปีงบปัจจุบัน
    appVersion: APP_VERSION,
    appFirstRelease: APP_FIRST_RELEASE,
    appLastUpdate: APP_LAST_UPDATE,
    recordTotalLabel: st.fy.records.toLocaleString('en-US') + ' รายการ ปีงบ ' + st.fyYear,

    // ปุ่มไปหน้าจัดการราคา — แทนที่ปุ่มล้างเดโมกับออกจากระบบของมอคอัป
    openPrices: app.openPrices,
    priceProgressLabel: priced.toLocaleString('en-US') + ' / ' + st.drugs.length.toLocaleString('en-US') + ' รายการ'
  };
}
