/* ═══════════ 3D Product Models with Image Textures ═══════════ */
/* Each product card gets a unique 3D model with the real product
   image mapped as a texture onto the front face. */

(function () {
  if (typeof THREE === 'undefined') return;

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();

  const CATEGORY_COLORS = {
    labels:      { primary: 0x7c3aed, secondary: 0x22d3ee, accent: 0xf59e0b },
    'hang-tags': { primary: 0x22d3ee, secondary: 0x7c3aed, accent: 0xf59e0b },
    cards:       { primary: 0xf59e0b, secondary: 0x7c3aed, accent: 0x22d3ee },
    stickers:    { primary: 0xec4899, secondary: 0x7c3aed, accent: 0x22d3ee },
    packaging:   { primary: 0x7c3aed, secondary: 0xec4899, accent: 0x22d3ee },
    buffy:       { primary: 0x7c3aed, secondary: 0x22d3ee, accent: 0xf59e0b },
  };

  const scenes = [];

  // ── Texture loader with cache ────────────────────────────

  function loadTexture(url) {
    if (!url) return Promise.resolve(null);
    if (textureCache.has(url)) return Promise.resolve(textureCache.get(url));
    return new Promise((resolve) => {
      textureLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          textureCache.set(url, tex);
          resolve(tex);
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  // ── Model builders (each returns the front-face mesh for texture) ──

  function buildLabel(scene, colors, tex) {
    const group = new THREE.Group();

    // Core spool
    const spoolGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 28);
    const spoolMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.5 });
    const spool = new THREE.Mesh(spoolGeo, spoolMat);
    spool.rotation.z = Math.PI / 6;
    group.add(spool);

    // Wound label ribbon layers
    for (let i = 0; i < 6; i++) {
      const r = 0.58 + i * 0.12;
      const ribbonGeo = new THREE.TorusGeometry(r, 0.04, 8, 48);
      const t = i / 5;
      const c = new THREE.Color(colors.primary).lerp(new THREE.Color(colors.secondary), t);
      const ribbonMat = new THREE.MeshPhongMaterial({ color: c, shininess: 80, transparent: true, opacity: 0.9 });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.rotation.x = Math.PI / 2;
      ribbon.position.y = (i - 2.5) * 0.18;
      group.add(ribbon);
    }

    // Trailing label strip — product image goes here
    const stripW = 1.8, stripH = 1.2;
    const stripGeo = new THREE.PlaneGeometry(stripW, stripH);
    const stripMat = tex
      ? new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 60, transparent: true, opacity: 0.95 })
      : new THREE.MeshPhongMaterial({ color: colors.primary, side: THREE.DoubleSide, shininess: 60, transparent: true, opacity: 0.85 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0.3, 0.1, 0.85);
    strip.rotation.y = -0.15;
    group.add(strip);

    // Glow border around the image
    const borderGeo = new THREE.PlaneGeometry(stripW + 0.06, stripH + 0.06);
    const borderMat = new THREE.MeshPhongMaterial({ color: colors.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.set(0.3, 0.1, 0.84);
    border.rotation.y = -0.15;
    group.add(border);

    group.position.y = 0.1;
    scene.add(group);
    return group;
  }

  function buildHangTag(scene, colors, tex) {
    const group = new THREE.Group();
    const w = 1.6, h = 2.0;

    // Tag body — rounded rectangle
    const shape = new THREE.Shape();
    const r = 0.15;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    // Punched hole
    const hole = new THREE.Path();
    hole.absarc(0, h / 2 - 0.3, 0.12, 0, Math.PI * 2, false);
    shape.holes.push(hole);

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };
    const tagGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const tagMat = new THREE.MeshPhongMaterial({ color: colors.primary, shininess: 90, transparent: true, opacity: 0.92 });
    const tag = new THREE.Mesh(tagGeo, tagMat);
    tag.position.z = -0.04;
    group.add(tag);

    // Product image on tag front face
    const imgW = w * 0.85, imgH = h * 0.55;
    const imgGeo = new THREE.PlaneGeometry(imgW, imgH);
    const imgMat = tex
      ? new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 80, transparent: true, opacity: 0.95 })
      : new THREE.MeshPhongMaterial({ color: colors.secondary, side: THREE.DoubleSide, shininess: 80, transparent: true, opacity: 0.8 });
    const imgMesh = new THREE.Mesh(imgGeo, imgMat);
    imgMesh.position.set(0, -0.1, 0.06);
    group.add(imgMesh);

    // Accent stripe
    const stripeGeo = new THREE.BoxGeometry(w * 0.7, 0.06, 0.12);
    const stripeMat = new THREE.MeshPhongMaterial({ color: colors.accent, shininess: 100 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.35, 0.06);
    group.add(stripe);

    // Bottom accent bar
    const barGeo = new THREE.BoxGeometry(w * 0.5, 0.04, 0.12);
    const barMat = new THREE.MeshPhongMaterial({ color: colors.secondary, shininess: 80 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, -0.55, 0.06);
    group.add(bar);

    // String loop
    const stringCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.15, h / 2 - 0.3, 0.06),
      new THREE.Vector3(0, h / 2 + 0.35, 0.3),
      new THREE.Vector3(0.15, h / 2 - 0.3, 0.06)
    );
    const stringGeo = new THREE.TubeGeometry(stringCurve, 20, 0.015, 6, false);
    const stringMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 40 });
    const string = new THREE.Mesh(stringGeo, stringMat);
    group.add(string);

    group.rotation.x = 0.1;
    group.position.y = -0.1;
    scene.add(group);
    return group;
  }

  function buildCard(scene, colors, tex) {
    const group = new THREE.Group();
    const cardW = 1.4, cardH = 1.8, cardD = 0.04;
    const count = 5;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const c = new THREE.Color(colors.primary).lerp(new THREE.Color(colors.secondary), t);

      const cardGeo = new THREE.BoxGeometry(cardW, cardH, cardD);
      const cardMat = new THREE.MeshPhongMaterial({ color: c, shininess: 100, transparent: true, opacity: 0.85 + t * 0.15 });
      const card = new THREE.Mesh(cardGeo, cardMat);

      const angle = (i - (count - 1) / 2) * 0.12;
      card.rotation.z = angle;
      card.position.x = Math.sin(angle) * 0.15;
      card.position.y = Math.cos(angle) * 0.05 * i;
      card.position.z = i * 0.06;
      group.add(card);

      // Product image on front card only
      if (i === count - 1) {
        const imgGeo = new THREE.PlaneGeometry(cardW * 0.9, cardH * 0.7);
        const imgMat = tex
          ? new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 80, transparent: true, opacity: 0.95 })
          : new THREE.MeshPhongMaterial({ color: colors.accent, side: THREE.DoubleSide, shininess: 80, transparent: true, opacity: 0.8 });
        const imgMesh = new THREE.Mesh(imgGeo, imgMat);
        imgMesh.position.set(0, 0.1, cardD / 2 + 0.01);
        card.add(imgMesh);
      }

      // Accent line
      const lineGeo = new THREE.BoxGeometry(cardW * 0.6, 0.03, cardD + 0.01);
      const lineMat = new THREE.MeshPhongMaterial({ color: colors.accent, shininess: 80 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(0, -0.4, cardD / 2 + 0.01);
      card.add(line);
    }

    group.position.y = 0.05;
    scene.add(group);
    return group;
  }

  function buildSticker(scene, colors, tex) {
    const group = new THREE.Group();

    // Core roll
    const coreGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 24);
    const coreMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.4 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.z = Math.PI / 6;
    group.add(core);

    // Sticker layers
    for (let i = 0; i < 8; i++) {
      const r = 0.42 + i * 0.1;
      const ringGeo = new THREE.TorusGeometry(r, 0.035, 8, 48);
      const t = i / 7;
      const c = t < 0.5
        ? new THREE.Color(colors.primary).lerp(new THREE.Color(colors.secondary), t * 2)
        : new THREE.Color(colors.secondary).lerp(new THREE.Color(colors.accent), (t - 0.5) * 2);
      const ringMat = new THREE.MeshPhongMaterial({ color: c, shininess: 80, transparent: true, opacity: 0.88 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (i - 3.5) * 0.15;
      group.add(ring);
    }

    // Peeling sticker — product image goes here
    const peelGeo = new THREE.CircleGeometry(0.55, 32);
    const peelMat = tex
      ? new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 100, transparent: true, opacity: 0.95 })
      : new THREE.MeshPhongMaterial({ color: colors.accent, side: THREE.DoubleSide, shininess: 100, transparent: true, opacity: 0.9 });
    const peel = new THREE.Mesh(peelGeo, peelMat);
    peel.position.set(1.0, 0.25, 0.35);
    peel.rotation.set(-0.2, 0.4, 0.15);
    group.add(peel);

    // Backing circle behind the peel
    const backGeo = new THREE.CircleGeometry(0.5, 32);
    const backMat = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(1.0, 0.25, 0.33);
    back.rotation.set(-0.2, 0.4, 0.15);
    group.add(back);

    group.position.y = 0.1;
    scene.add(group);
    return group;
  }

  function buildPackaging(scene, colors, tex) {
    const group = new THREE.Group();

    // Box base
    const baseGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const baseMat = new THREE.MeshPhongMaterial({ color: colors.primary, shininess: 80, transparent: true, opacity: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.15;
    group.add(base);

    // Product image on front face of box
    const frontGeo = new THREE.PlaneGeometry(1.3, 0.6);
    const frontMat = tex
      ? new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 100, transparent: true, opacity: 0.95 })
      : new THREE.MeshPhongMaterial({ color: colors.secondary, side: THREE.DoubleSide, shininess: 100, transparent: true, opacity: 0.8 });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.set(0, -0.15, 0.61);
    group.add(frontMesh);

    // Box lid — hinged open
    const lidGeo = new THREE.BoxGeometry(1.6, 0.06, 1.2);
    const lidMat = new THREE.MeshPhongMaterial({ color: colors.secondary, shininess: 100, transparent: true, opacity: 0.92 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(0, 0.25, -0.6);
    lid.rotation.x = -0.6;
    group.add(lid);

    // Cross ribbon
    const ribbonGeo = new THREE.BoxGeometry(0.08, 0.82, 1.22);
    const ribbonMat = new THREE.MeshPhongMaterial({ color: colors.accent, shininess: 90 });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, -0.14, 0);
    group.add(ribbon);

    const crossGeo = new THREE.BoxGeometry(1.62, 0.82, 0.08);
    const crossMat = new THREE.MeshPhongMaterial({ color: colors.accent, shininess: 90 });
    const cross = new THREE.Mesh(crossGeo, crossMat);
    cross.position.set(0, -0.14, 0);
    group.add(cross);

    group.position.y = 0.05;
    scene.add(group);
    return group;
  }

  function buildBuffy(scene, colors) {
    const group = new THREE.Group();
    const bodyColor = 0x7c3aed;
    const accentColor = 0x22d3ee;
    const glowColor = 0xf59e0b;

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.0, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 100, transparent: true, opacity: 0.92 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -0.15;
    group.add(body);

    // Chest screen
    const screenGeo = new THREE.PlaneGeometry(0.7, 0.45);
    const screenMat = new THREE.MeshPhongMaterial({ color: 0x0a0a1e, shininess: 200, emissive: accentColor, emissiveIntensity: 0.15 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, -0.05, 0.56);
    group.add(screen);

    // Code lines on screen
    const codeColors = [0x22d3ee, 0xf59e0b, 0xec4899, 0x7c3aed];
    for (let l = 0; l < 4; l++) {
      const w = 0.25 + Math.random() * 0.25;
      const lineGeo = new THREE.BoxGeometry(w, 0.03, 0.01);
      const lineMat = new THREE.MeshPhongMaterial({ color: codeColors[l], emissive: codeColors[l], emissiveIntensity: 0.5 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(-0.15 + w / 4, 0.1 - l * 0.09, 0.57);
      group.add(line);
    }

    // Head
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const headMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 100, transparent: true, opacity: 0.95 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.65;
    head.scale.set(1, 0.9, 0.95);
    group.add(head);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.65, 0.22, 0.1);
    const visorMat = new THREE.MeshPhongMaterial({ color: 0x0a0a1e, shininess: 200, emissive: accentColor, emissiveIntensity: 0.2 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.68, 0.4);
    group.add(visor);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const eyeMat = new THREE.MeshPhongMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.9, shininess: 200 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14, 0.68, 0.46);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.14, 0.68, 0.46);
    group.add(eyeR);

    // Antenna
    const antennaStickGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.35, 8);
    const antennaStickMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 80 });
    const antennaStick = new THREE.Mesh(antennaStickGeo, antennaStickMat);
    antennaStick.position.set(0, 1.1, 0);
    group.add(antennaStick);

    const antennaTipGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const antennaTipMat = new THREE.MeshPhongMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.8 });
    const antennaTip = new THREE.Mesh(antennaTipGeo, antennaTipMat);
    antennaTip.position.set(0, 1.3, 0);
    group.add(antennaTip);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.5, 8, 8);
    const armMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 80 });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.72, 0.05, 0);
    armL.rotation.z = 0.25;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.72, 0.05, 0);
    armR.rotation.z = -0.25;
    group.add(armR);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const handMat = new THREE.MeshPhongMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4, shininess: 120 });
    const handL = new THREE.Mesh(handGeo, handMat);
    handL.position.set(-0.82, -0.25, 0);
    group.add(handL);
    const handR = new THREE.Mesh(handGeo, handMat);
    handR.position.set(0.82, -0.25, 0);
    group.add(handR);

    // Feet
    const footGeo = new THREE.CapsuleGeometry(0.1, 0.2, 8, 8);
    const footMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 60 });
    const footL = new THREE.Mesh(footGeo, footMat);
    footL.position.set(-0.28, -0.85, 0.08);
    footL.rotation.z = 0.1;
    group.add(footL);
    const footR = new THREE.Mesh(footGeo, footMat);
    footR.position.set(0.28, -0.85, 0.08);
    footR.rotation.z = -0.1;
    group.add(footR);

    // Glow ring
    const ringGeo = new THREE.TorusGeometry(0.62, 0.02, 8, 32);
    const ringMat = new THREE.MeshPhongMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.15;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.userData = { eyeL, eyeR, antennaTip, ring };
    scene.add(group);
    return group;
  }

  const BUILDERS = {
    labels:      buildLabel,
    'hang-tags': buildHangTag,
    cards:       buildCard,
    stickers:    buildSticker,
    packaging:   buildPackaging,
    buffy:       buildBuffy,
  };

  // ── Scene factory ────────────────────────────────────────

  function createProductScene(canvas, category, icon, imageUrl) {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 150;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);
    const rimLight = new THREE.PointLight(CATEGORY_COLORS[category]?.secondary || 0x7c3aed, 0.6, 15);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.labels;
    const clock = new THREE.Clock();
    let model = null;
    let mx = 0, my = 0;

    // Mouse tracking
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mx = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
      my = ((touch.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: false });

    // Load texture then build model
    const texturePromise = loadTexture(imageUrl);

    function animate() {
      if (!model) return;
      const t = clock.getElapsedTime();

      model.rotation.y = Math.sin(t * 0.5) * 0.3 + mx * 0.4;
      model.rotation.x = Math.sin(t * 0.3) * 0.08 - my * 0.15;
      model.position.y = 0.05 + Math.sin(t * 0.8) * 0.08;

      // Buffy-specific animation
      if (model.userData?.eyeL && category === 'buffy') {
        const blink = Math.sin(t * 3) > 0.95 ? 0.02 : 0.055;
        model.userData.eyeL.scale.y = blink / 0.055;
        model.userData.eyeR.scale.y = blink / 0.055;
        model.userData.antennaTip.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.4;
        model.userData.ring.rotation.z = t * 0.8;
      }

      renderer.render(scene, camera);
    }

    // Start animating once texture loads
    texturePromise.then((tex) => {
      const builder = BUILDERS[category] || BUILDERS.labels;
      model = builder(scene, colors, tex);
    });

    return {
      animate,
      dispose: () => {
        canvas.removeEventListener('mousemove', onMouse);
        renderer.dispose();
      },
    };
  }

  // ── Public API ───────────────────────────────────────────

  window.initProduct3D = function (canvas, category, icon, imageUrl) {
    if (!canvas || !category) return null;
    const entry = createProductScene(canvas, category, icon, imageUrl);
    scenes.push(entry);
    return entry;
  };

  let running = false;
  function loop() {
    if (!running) return;
    scenes.forEach(s => s.animate());
    requestAnimationFrame(loop);
  }

  window.startProduct3DLoop = function () {
    if (running) return;
    running = true;
    loop();
  };

  window.stopProduct3DLoop = function () {
    running = false;
  };
})();
