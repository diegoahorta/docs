/* Cena Three.js: pôr do sol City Pop em tons pastéis (fundo) + confetes 3D (camada da frente). */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasThree = typeof window.THREE !== 'undefined';
  const FX = { burst() {}, celebrate() {}, rain() {} };
  window.FX = FX;
  if (!hasThree) return;
  const T = window.THREE;

  /* ---------------------------------------------------------------- fundo */
  function initBackground() {
    const canvas = document.getElementById('bg3d');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    } catch (e) { canvas.hidden = true; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(60, 1, 0.1, 500);
    camera.position.set(0, 3, 12);

    // céu: gradiente lavanda → rosa → pêssego
    const sky = document.createElement('canvas');
    sky.width = 4; sky.height = 512;
    const g = sky.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#A9C4FF');
    grad.addColorStop(0.35, '#D6C2FF');
    grad.addColorStop(0.62, '#FFC4E1');
    grad.addColorStop(0.80, '#FFD9C7');
    grad.addColorStop(1.0, '#FFE9D6');
    g.fillStyle = grad; g.fillRect(0, 0, 4, 512);
    const skyTex = new T.CanvasTexture(sky);
    scene.background = skyTex;
    scene.fog = new T.Fog(0xFFDCE8, 60, 190);

    // sol listrado (marca registrada das capas de City Pop)
    const sunMat = new T.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform float uTime;',
        'void main(){',
        '  vec2 p = vUv - 0.5; float d = length(p);',
        '  if (d > 0.5) discard;',
        '  vec3 top = vec3(1.0, 0.93, 0.62); vec3 bot = vec3(1.0, 0.56, 0.76);',
        '  vec3 col = mix(bot, top, smoothstep(0.05, 0.95, vUv.y));',
        '  float y = vUv.y;',
        '  if (y < 0.5) {',
        '    float band = fract(y * 14.0 + uTime * 0.25);',
        '    float gap = mix(0.55, 0.06, y / 0.5);',
        '    if (band < gap) discard;',
        '  }',
        '  float edge = smoothstep(0.5, 0.48, d);',
        '  gl_FragColor = vec4(col, edge);',
        '}'
      ].join('\n')
    });
    const sun = new T.Mesh(new T.CircleGeometry(30, 96), sunMat);
    sun.position.set(0, 16, -150);
    scene.add(sun);
    const glow = new T.Mesh(
      new T.CircleGeometry(48, 64),
      new T.MeshBasicMaterial({ color: 0xFFE3F0, transparent: true, opacity: 0.35, fog: false })
    );
    glow.position.set(0, 16, -152);
    scene.add(glow);

    // skyline de cidade com janelinhas acesas
    const city = new T.Group();
    const tones = [0xB7A6EE, 0xA996E6, 0xC4B5F4, 0x9F8EDC];
    const winPos = [];
    for (let i = 0; i < 70; i++) {
      const w = 4 + Math.random() * 7;
      const h = 6 + Math.pow(Math.random(), 1.6) * 34;
      const x = -170 + i * 5 + Math.random() * 3;
      const z = -105 - Math.random() * 14;
      const m = new T.Mesh(
        new T.BoxGeometry(w, h, 4),
        new T.MeshBasicMaterial({ color: tones[i % tones.length] })
      );
      m.position.set(x, h / 2, z);
      city.add(m);
      for (let wy = 2; wy < h - 1; wy += 2.2) {
        for (let wx = -w / 2 + 1; wx < w / 2 - 0.6; wx += 1.6) {
          if (Math.random() < 0.38) winPos.push(x + wx, wy, z + 2.05);
        }
      }
    }
    const winGeo = new T.BufferGeometry();
    winGeo.setAttribute('position', new T.Float32BufferAttribute(winPos, 3));
    city.add(new T.Points(winGeo, new T.PointsMaterial({ color: 0xFFF3B0, size: 0.7, sizeAttenuation: true })));
    scene.add(city);

    // chão com grade retrô rolando
    const gridMat = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'varying vec3 vW; uniform float uTime;',
        'float line(float v, float w){ float f = abs(fract(v) - 0.5); return smoothstep(w, 0.0, 0.5 - f); }',
        'void main(){',
        '  vec3 base = vec3(0.95, 0.86, 1.0);',
        '  vec3 hot = vec3(1.0, 0.55, 0.80);',
        '  float gx = line(vW.x / 6.0, 0.05);',
        '  float gz = line((vW.z + uTime * 6.0) / 6.0, 0.05);',
        '  float g = max(gx, gz);',
        '  float dist = clamp(-vW.z / 170.0, 0.0, 1.0);',
        '  vec3 col = mix(base, hot, g * (1.0 - dist * 0.85));',
        '  col = mix(col, vec3(1.0, 0.88, 0.92), smoothstep(0.35, 1.0, dist));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    const ground = new T.Mesh(new T.PlaneGeometry(420, 260), gridMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -100);
    scene.add(ground);

    // pétalas de sakura, corações e estrelinhas flutuando
    const PETALS = reduceMotion ? 30 : 110;
    const petalShape = new T.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.35, 0.25, 0.4, 0.75, 0.12, 1.0);
    petalShape.lineTo(0, 0.9);
    petalShape.lineTo(-0.12, 1.0);
    petalShape.bezierCurveTo(-0.4, 0.75, -0.35, 0.25, 0, 0);
    const petalGeo = new T.ShapeGeometry(petalShape);
    petalGeo.translate(0, -0.5, 0);
    const petalMesh = new T.InstancedMesh(
      petalGeo,
      new T.MeshBasicMaterial({ side: T.DoubleSide, transparent: true, opacity: 0.9 }),
      PETALS
    );
    const petalColors = [0xFFB7D0, 0xFFC9DC, 0xFFFFFF, 0xFFD1E3, 0xF8A5C8];
    const petals = [];
    const c = new T.Color();
    for (let i = 0; i < PETALS; i++) {
      petals.push({
        x: (Math.random() - 0.5) * 50, y: Math.random() * 22, z: -30 + Math.random() * 36,
        rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6,
        vx: 0.4 + Math.random() * 0.8, vy: 0.5 + Math.random() * 0.9,
        sp: 0.5 + Math.random() * 1.5, s: 0.25 + Math.random() * 0.35, ph: Math.random() * 6
      });
      petalMesh.setColorAt(i, c.set(petalColors[i % petalColors.length]));
    }
    scene.add(petalMesh);

    const dummy = new T.Object3D();
    let mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 640 ? 72 : 60;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let last = performance.now(), t = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt;
      sunMat.uniforms.uTime.value = t;
      gridMat.uniforms.uTime.value = t;
      for (let i = 0; i < PETALS; i++) {
        const p = petals[i];
        p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 0.6) * dt;
        p.y -= p.vy * dt;
        p.rx += dt * p.sp; p.ry += dt * p.sp * 0.7; p.rz += dt * 0.3;
        if (p.y < -1 || p.x > 28) { p.y = 20 + Math.random() * 4; p.x = -28 + Math.random() * 30; }
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.setScalar(p.s);
        dummy.updateMatrix();
        petalMesh.setMatrixAt(i, dummy.matrix);
      }
      petalMesh.instanceMatrix.needsUpdate = true;
      camera.position.x += (mx * 3 - camera.position.x) * 0.03;
      camera.position.y += (3 - my * 1.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 6, -60);
      renderer.render(scene, camera);
    }
    function loop(now) {
      if (!document.hidden) frame(now);
      if (!reduceMotion) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------- confetes */
  function initConfetti() {
    const canvas = document.getElementById('fx3d');
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { canvas.hidden = true; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(0, 1, 0, -1, -800, 800);

    function star(r1, r2) {
      const s = new T.Shape();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? r2 : r1;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
      return new T.ShapeGeometry(s);
    }
    function heart() {
      const s = new T.Shape();
      s.moveTo(0, -0.35);
      s.bezierCurveTo(-0.1, -0.2, -0.5, 0.0, -0.5, 0.25);
      s.bezierCurveTo(-0.5, 0.5, -0.15, 0.6, 0, 0.35);
      s.bezierCurveTo(0.15, 0.6, 0.5, 0.5, 0.5, 0.25);
      s.bezierCurveTo(0.5, 0.0, 0.1, -0.2, 0, -0.35);
      return new T.ShapeGeometry(s);
    }
    const MAX = 420;
    const kinds = [
      { geo: new T.PlaneGeometry(1, 0.55), size: [9, 15] },
      { geo: new T.PlaneGeometry(1, 1), size: [6, 9] },
      { geo: star(0.6, 0.26), size: [14, 22] },
      { geo: heart(), size: [13, 20] }
    ];
    const mat = new T.MeshBasicMaterial({ side: T.DoubleSide });
    kinds.forEach((k) => {
      k.mesh = new T.InstancedMesh(k.geo, mat, MAX);
      k.mesh.count = 0;
      k.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      k.mesh.frustumCulled = false;
      k.list = [];
      scene.add(k.mesh);
    });
    const palette = [0xFF8FB8, 0xFFB3CF, 0x9EE6CF, 0xB9A8F5, 0xFFE58F, 0xFFC2A6, 0xA7D8FF, 0xFFFFFF];
    const dummy = new T.Object3D();
    const col = new T.Color();
    let W = 1, H = 1, running = false, last = 0;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H, false);
      camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    function spawn(x, y, angle, spread, speed, n) {
      const scale = reduceMotion ? 0.3 : 1;
      n = Math.round(n * scale);
      for (let i = 0; i < n; i++) {
        const kind = kinds[Math.random() < 0.5 ? 0 : Math.random() < 0.4 ? 1 : Math.random() < 0.6 ? 2 : 3];
        if (kind.list.length >= MAX) continue;
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.45 + Math.random() * 0.75);
        kind.list.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6,
          wx: (Math.random() - 0.5) * 14, wy: (Math.random() - 0.5) * 14, wz: (Math.random() - 0.5) * 8,
          s: kind.size[0] + Math.random() * (kind.size[1] - kind.size[0]),
          life: 0, max: 2.4 + Math.random() * 1.6, ph: Math.random() * 6,
          color: palette[(Math.random() * palette.length) | 0]
        });
      }
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
    }

    function tick(now) {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      let alive = 0;
      kinds.forEach((k) => {
        const next = [];
        for (const p of k.list) {
          p.life += dt;
          if (p.life > p.max || p.y > H + 40) continue;
          p.vy += 1500 * dt;
          const drag = Math.exp(-2.2 * dt);
          p.vx *= drag; p.vy *= Math.exp(-1.1 * dt);
          p.x += (p.vx + Math.sin(p.life * 5 + p.ph) * 50) * dt;
          p.y += p.vy * dt;
          p.rx += p.wx * dt; p.ry += p.wy * dt; p.rz += p.wz * dt;
          next.push(p);
        }
        k.list = next;
        k.mesh.count = next.length;
        next.forEach((p, i) => {
          const fade = Math.min(1, (p.max - p.life) / 0.6);
          dummy.position.set(p.x, -p.y, 0);
          dummy.rotation.set(p.rx, p.ry, p.rz);
          dummy.scale.setScalar(p.s * fade);
          dummy.updateMatrix();
          k.mesh.setMatrixAt(i, dummy.matrix);
          k.mesh.setColorAt(i, col.set(p.color));
        });
        k.mesh.instanceMatrix.needsUpdate = true;
        if (k.mesh.instanceColor) k.mesh.instanceColor.needsUpdate = true;
        alive += next.length;
      });
      renderer.render(scene, camera);
      if (alive > 0) requestAnimationFrame(tick);
      else { running = false; renderer.clear(); }
    }

    FX.burst = function (x, y, power) {
      power = power || 1;
      spawn(x, y, -Math.PI / 2, Math.PI * 1.1, 900 * Math.min(1.4, 0.8 + power * 0.2), 70 * power);
    };
    FX.celebrate = function () {
      spawn(0, H, -Math.PI / 3.2, 0.6, 1700, 140);
      spawn(W, H, -Math.PI + Math.PI / 3.2, 0.6, 1700, 140);
      setTimeout(() => spawn(W / 2, H * 0.45, -Math.PI / 2, Math.PI * 2, 1000, 120), 250);
    };
    FX.rain = function () {
      for (let i = 0; i < 8; i++) spawn(W * (i + 0.5) / 8, -20, Math.PI / 2, 0.8, 200, 14);
    };
  }

  function boot() { initBackground(); initConfetti(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
