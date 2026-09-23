/* 3D woven-fabric particle field — represents textile threads */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 7, 20);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ── Woven thread grid ──────────────────────────────────
  const COLS = 90, ROWS = 60, SPACING = 0.55;
  const count = COLS * ROWS;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const c1 = new THREE.Color('#9e1b1f'); // maroon
  const c2 = new THREE.Color('#b03034'); // crimson
  const c3 = new THREE.Color('#5c0f12'); // dark maroon

  let i = 0;
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      positions[i * 3]     = (x - COLS / 2) * SPACING;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (y - ROWS / 2) * SPACING;
      const t = (x / COLS + y / ROWS) / 2;
      const col = t < 0.5 ? c1.clone().lerp(c2, t * 2) : c2.clone().lerp(c3, (t - 0.5) * 2);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      i++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85 });
  const fabric = new THREE.Points(geo, mat);
  fabric.rotation.x = -0.35;
  scene.add(fabric);

  // ── Floating spool particles ───────────────────────────
  const spoolGeo = new THREE.BufferGeometry();
  const spoolPos = new Float32Array(300);
  for (let s = 0; s < 100; s++) {
    spoolPos[s * 3]     = (Math.random() - 0.5) * 50;
    spoolPos[s * 3 + 1] = Math.random() * 18 - 4;
    spoolPos[s * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  spoolGeo.setAttribute('position', new THREE.BufferAttribute(spoolPos, 3));
  const spools = new THREE.Points(spoolGeo, new THREE.PointsMaterial({
    size: 0.14, color: 0xf59e0b, transparent: true, opacity: 0.6,
  }));
  scene.add(spools);

  // ── Mouse parallax ─────────────────────────────────────
  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  const pos = geo.attributes.position.array;

  function animate() {
    const t = clock.getElapsedTime();

    // Ripple the fabric like woven cloth in wind
    let k = 0;
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        pos[k * 3 + 1] =
          Math.sin(x * 0.35 + t * 1.2) * 0.6 +
          Math.cos(y * 0.45 + t * 0.8) * 0.6 +
          Math.sin((x + y) * 0.2 + t) * 0.3;
        k++;
      }
    }
    geo.attributes.position.needsUpdate = true;

    spools.rotation.y = t * 0.05;
    fabric.rotation.z = Math.sin(t * 0.1) * 0.05 + mx * 0.05;
    camera.position.x += (mx * 2 - camera.position.x) * 0.03;
    camera.position.y += (7 - my * 1.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
})();