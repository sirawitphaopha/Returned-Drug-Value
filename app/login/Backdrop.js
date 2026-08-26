'use client';
// ═══════════════════════════════════════════════════════════════════════════
// ฉากหลังหน้าเข้าสู่ระบบ — แคปซูลยาลอยหมุนช้า ๆ ในหมอกเขียว (three.js)
// ═══════════════════════════════════════════════════════════════════════════
//
// พี่กันสั่ง 26 ส.ค. 2569: "ออกแบบหน้านี้ใหม่เลย ขอ three js ทำแอนิเมชั่นฉากหลังด้วย"
//
// ทำไมเป็นแคปซูลลอยขึ้น — เว็บนี้ชื่อ "มูลค่ายาคืน" สิ่งที่มันทำคือรับยาที่ลอยกลับมา
// แล้วแปลงเป็นมูลค่า · ฉากหลังจึงเป็นเม็ดยาลอยขึ้นช้า ๆ ไม่ใช่ลอยลง
//
// 🚨 กฎ 5 ข้อของฉากหลังนี้ ห้ามละเมิด
//   1. ห้ามแย่งความสนใจจากช่องกรอกรหัส — ความทึบต่ำ เคลื่อนช้ามาก ไม่มีอะไรกะพริบ
//   2. เครื่องที่เปิด "ลดการเคลื่อนไหว" ไว้ ต้องได้ภาพนิ่ง ไม่ใช่ภาพเคลื่อน
//      (เจ้าหน้าที่บางคนเวียนหัวกับภาพเคลื่อนไหว และเป็นค่าที่ตั้งไว้ในเครื่องอยู่แล้ว)
//   3. เครื่องที่ไม่มี WebGL ต้องไม่พังทั้งหน้า — คืน null เฉย ๆ เหลือพื้นไล่สีของ CSS
//   4. หยุดวาดเมื่อสลับแท็บออกไป — คอมห้องยาเปิดค้างทั้งวัน ไม่ควรกินซีพียูฟรี ๆ
//   5. โหลด three.js แบบขอเมื่อใช้ เฉพาะหน้านี้หน้าเดียว
//      ไฟล์ราว 600 KB ถ้าโหลดมาพร้อมทั้งเว็บจะถ่วงหน้าบันทึกที่ใช้งานจริงทุกวัน
import React from 'react';

export default function Backdrop() {
  const holderRef = React.useRef(null);

  React.useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    // เคารพการตั้งค่า "ลดการเคลื่อนไหว" ของเครื่อง
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stop = false;
    let cleanup = null;

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch (e) {
        return;   // โหลดไม่ได้ก็ปล่อยให้เหลือพื้นไล่สีของ CSS
      }
      if (stop || !holderRef.current) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch (e) {
        return;   // เครื่องไม่มี WebGL — ไม่ใช่เรื่องต้องแจ้งผู้ใช้ แค่ไม่มีฉากหลัง
      }

      const w = () => holder.clientWidth || window.innerWidth;
      const h = () => holder.clientHeight || window.innerHeight;

      // ── ความละเอียดระดับ 4K (พี่กันสั่ง 26 ส.ค. 2569) ──────────────────────
      // เรนเดอร์ที่ความละเอียดจริงของจอเต็ม ๆ ไม่ลดทอน ขอบแคปซูลจึงคมไม่มีรอยหยัก
      // เพดาน 3 เท่าไว้กันจอมือถือความละเอียดสูงมาก ๆ ที่เกินความจำเป็นจริง
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      // ปรับโทนแสงแบบภาพยนตร์ ให้ไล่เฉดนุ่มแทนที่จะตัดกันแข็ง ๆ
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.setSize(w(), h());
      renderer.setClearAlpha(0);
      holder.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';

      const scene = new THREE.Scene();
      // หมอกจาง ๆ ให้ตัวที่อยู่ไกลค่อย ๆ กลืนไปกับพื้นหลัง แทนที่จะหายวับตรงขอบ
      scene.fog = new THREE.Fog(0xeef4f0, 12, 30);

      const camera = new THREE.PerspectiveCamera(42, w() / h(), 0.1, 100);
      camera.position.set(0, 0, 15);

      // ── แสง ────────────────────────────────────────────────────────────────
      // แสงนวลจากบน + แสงเทลจากซ้ายล่าง ให้แคปซูลมีมิติโดยไม่ต้องมีเงา
      scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe0d6, 1.15));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(3, 6, 8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x2f7d5d, 0.7);
      rim.position.set(-6, -3, 4);
      scene.add(rim);

      // ── แคปซูลยา ───────────────────────────────────────────────────────────
      // 🚨 ใช้ InstancedMesh ตัวเดียววาดทุกเม็ด — ถ้าสร้าง Mesh แยก 34 ตัว
      //    การ์ดจอต้องสั่งวาด 34 รอบต่อเฟรม ซึ่งเครื่องห้องยาไม่ไหว
      const COUNT = 34;
      // 🚨 ความละเอียดสูงมาก — 32 ส่วนตามยาว × 96 ส่วนรอบวง ราว 6,000 สามเหลี่ยมต่อเม็ด
      //    ทำได้เพราะเป็น InstancedMesh ตัวเดียว การ์ดจอสั่งวาดรอบเดียวต่อเฟรม
      //    ถ้าแยกเป็น Mesh 34 ตัว ความละเอียดขนาดนี้จะทำให้เครื่องห้องยาค้างทันที
      const geo = new THREE.CapsuleGeometry(0.26, 0.5, 32, 96);
      // MeshPhysicalMaterial ให้ชั้นเคลือบเงาแบบเปลือกแคปซูลจริง
      // (MeshStandardMaterial ทำ clearcoat ไม่ได้ จึงดูเป็นพลาสติกด้าน)
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.28,
        metalness: 0.0,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
        sheen: 0.35,
        sheenColor: new THREE.Color(0xdcefe4),
        transparent: true,
        opacity: 0.92
      });
      // ── เม็ดกลมแบน (tablet) ────────────────────────────────────────────────
      // พี่กันสั่ง 26 ส.ค. 2569: "ตอนนี้มันเป็นแคปซูล เราขอแบบ tablet ด้วย แทรกสัก 30%"
      // ห้องยาจ่ายยาเม็ดมากกว่าแคปซูลหลายเท่า ฉากหลังที่มีแต่แคปซูลจึงไม่ตรงกับของจริง
      //
      // ทำจากทรงกลมแล้วบีบให้แบน ไม่ใช้ทรงกระบอก เพราะทรงกระบอกได้ขอบคมเป็นเหลี่ยม
      // ส่วนทรงกลมที่บีบแล้วได้ขอบมนโค้งเหมือนเม็ดยาปั๊มจริง
      const tabGeo = new THREE.SphereGeometry(0.42, 96, 64);
      tabGeo.scale(1, 0.4, 1);

      const N_TAB = Math.round(COUNT * 0.3);   // 30% ตามที่พี่กันขอ
      const N_CAP = COUNT - N_TAB;

      const pills = new THREE.InstancedMesh(geo, mat, N_CAP);
      pills.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // 🚨 ใช้วัสดุตัวเดียวกันทั้งสองทรง — สร้างวัสดุใหม่จะเปลืองหน่วยความจำการ์ดจอ
      //    และต้องจำไปคืนตอนปิดหน้าอีกชิ้น
      const tabs = new THREE.InstancedMesh(tabGeo, mat, N_TAB);
      tabs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // เฉดเขียวชุดเดียวกับธีมเว็บ ไล่จากเทลเข้มไปเขียวอ่อนเกือบขาว
      const TONES = [0x2f7d5d, 0x4e9b78, 0x7bbb9c, 0xa8d4be, 0xdcefe4, 0xffffff];
      const color = new THREE.Color();
      for (let i = 0; i < N_CAP; i++) {
        color.setHex(TONES[i % TONES.length]);
        pills.setColorAt(i, color);
      }
      for (let i = 0; i < N_TAB; i++) {
        // เม็ดกลมเริ่มไล่เฉดจากคนละจุด จะได้ไม่เรียงสีซ้ำแพตเทิร์นเดียวกับแคปซูล
        color.setHex(TONES[(i + 2) % TONES.length]);
        tabs.setColorAt(i, color);
      }
      scene.add(pills);
      scene.add(tabs);

      // ตำแหน่งตั้งต้น — สุ่มด้วยเมล็ดคงที่ เปิดกี่ครั้งก็ได้ภาพเดิม
      // (กฎเดียวกับข้อมูลโหมดดูตัวอย่าง — ห้ามใช้ Math.random เพราะเทียบหน้าจอไม่ได้)
      let seed = 20690826;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      const items = [];
      for (let i = 0; i < COUNT; i++) {
        items.push({
          x: (rnd() - 0.5) * 22,
          y: (rnd() - 0.5) * 18,
          z: (rnd() - 0.5) * 12 - 3,
          rx: rnd() * Math.PI, ry: rnd() * Math.PI, rz: rnd() * Math.PI,
          // ลอยขึ้นช้ามาก — เม็ดที่อยู่ใกล้กล้องลอยเร็วกว่านิดหน่อย ให้รู้สึกมีระยะ
          speed: 0.0016 + rnd() * 0.0026,
          spin: (rnd() - 0.5) * 0.0035,
          scale: 0.55 + rnd() * 0.85
        });
      }

      // ── ฝุ่นแสง ─────────────────────────────────────────────────────────────
      // จุดเล็ก ๆ ลอยอยู่ด้านหลัง ทำให้ที่ว่างไม่โล่งจนดูเหมือนภาพค้าง
      const DUST = 260;
      const dustPos = new Float32Array(DUST * 3);
      for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] = (rnd() - 0.5) * 30;
        dustPos[i * 3 + 1] = (rnd() - 0.5) * 24;
        dustPos[i * 3 + 2] = (rnd() - 0.5) * 16 - 6;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
        color: 0x2f7d5d, size: 0.045, transparent: true, opacity: 0.3, sizeAttenuation: true
      }));
      scene.add(dust);

      const dummy = new THREE.Object3D();
      const draw = () => {
        // items เก็บรวมกันชุดเดียว แล้วแบ่งครึ่งแรกเป็นแคปซูล ครึ่งหลังเป็นเม็ดกลม
        // การเคลื่อนไหวจึงคำนวณที่เดียว ไม่ต้องเขียนซ้ำสองรอบ
        for (let i = 0; i < N_CAP; i++) {
          const p = items[i];
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(p.rx, p.ry, p.rz);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          pills.setMatrixAt(i, dummy.matrix);
        }
        for (let i = 0; i < N_TAB; i++) {
          const p = items[N_CAP + i];
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(p.rx, p.ry, p.rz);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          tabs.setMatrixAt(i, dummy.matrix);
        }
        pills.instanceMatrix.needsUpdate = true;
        tabs.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
      };

      const step = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = items[i];
          p.y += p.speed;
          p.rx += p.spin;
          p.ry += p.spin * 0.7;
          // ลอยพ้นขอบบนแล้ววนกลับมาข้างล่าง ฉากจึงไม่มีวันว่าง
          if (p.y > 11) p.y = -11;
        }
        dust.rotation.y += 0.00022;
      };

      let raf = 0;
      const loop = () => {
        if (stop) return;
        step();
        draw();
        raf = requestAnimationFrame(loop);
      };

      const onResize = () => {
        renderer.setSize(w(), h());
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
        if (calm) draw();
      };

      // หยุดวาดเมื่อสลับแท็บออกไป — คอมห้องยาเปิดค้างทั้งวัน
      const onVis = () => {
        if (calm) return;
        if (document.hidden) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else if (!raf && !stop) {
          loop();
        }
      };

      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVis);

      if (calm) draw();   // ภาพนิ่งหนึ่งเฟรม สวยเท่ากันแต่ไม่ขยับ
      else loop();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVis);
        // 🚨 ต้องคืนหน่วยความจำการ์ดจอเอง three.js ไม่เก็บกวาดให้
        geo.dispose();
        tabGeo.dispose();
        mat.dispose();
        dustGeo.dispose();
        dust.material.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      stop = true;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={holderRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
