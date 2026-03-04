import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const viewport = document.getElementById("viewport");

const ui = {
  drawerToggle: document.getElementById("drawerToggle"),
  drawerClose: document.getElementById("drawerClose"),
  immersiveDrawer: document.getElementById("immersiveDrawer"),
  lensStepButtons: Array.from(document.querySelectorAll(".lens-step")),
  axisDialLeft: document.getElementById("axisDialLeft"),
  axisDialRight: document.getElementById("axisDialRight"),
  axisValueLeft: document.getElementById("axisValueLeft"),
  axisValueRight: document.getElementById("axisValueRight"),
  hudLeftSph: document.getElementById("hudLeftSph"),
  hudLeftCyl: document.getElementById("hudLeftCyl"),
  hudLeftAxis: document.getElementById("hudLeftAxis"),
  hudRightSph: document.getElementById("hudRightSph"),
  hudRightCyl: document.getElementById("hudRightCyl"),
  hudRightAxis: document.getElementById("hudRightAxis"),
  hudDistanceChip: document.getElementById("hudDistanceChip"),
  distanceRange: document.getElementById("distanceRange"),
  distanceValue: document.getElementById("distanceValue"),
  glassesEnabled: document.getElementById("glassesEnabled"),
  posterType: document.getElementById("posterType"),
  lightingPreset: document.getElementById("lightingPreset")
};

const appState = {
  distanceM: Number(ui.distanceRange.value),
  glassesEnabled: true,
  drawerOpen: false,
  lens: {
    left: { sph: -0.25, cyl: -3.25, axis: 25 },
    right: { sph: -0.25, cyl: -3.25, axis: 25 }
  },
  posterType: "snellen",
  lightingPreset: "optometrist",
  posterPosition: { x: 0, y: 1.6 }
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dfe8f4");

const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
camera.position.set(0, 1.6, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.38);
keyLight.position.set(2.5, 4, 2.5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xd5e8ff, 0.47, 25);
fillLight.position.set(-3, 1.8, -2);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdcecff, 0.58);
scene.add(hemiLight);

const roomMaterial = new THREE.MeshStandardMaterial({ color: "#f5f8fd", side: THREE.BackSide });
const room = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 28), roomMaterial);
room.position.set(0, 2.4, -8);
scene.add(room);

const posterMaterial = new THREE.MeshStandardMaterial({
  map: null,
  roughness: 0.85,
  metalness: 0.02
});
const poster = new THREE.Mesh(new THREE.PlaneGeometry(5, 1), posterMaterial);
scene.add(poster);

const supportBar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.018, 0.018, 5.25, 20),
  new THREE.MeshStandardMaterial({ color: "#445166", roughness: 0.7 })
);
supportBar.rotation.z = Math.PI / 2;
scene.add(supportBar);

const offscreen = new THREE.WebGLRenderTarget(1, 1, {
  magFilter: THREE.LinearFilter,
  minFilter: THREE.LinearFilter,
  type: THREE.HalfFloatType,
  depthBuffer: true
});

const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const postMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: offscreen.texture },
    glassesEnabled: { value: 1 },
    leftLens: { value: new THREE.Vector3(-0.25, -3.25, 25) },
    rightLens: { value: new THREE.Vector3(-0.25, -3.25, 25) },
    leftCenter: { value: new THREE.Vector2(0.32, 0.52) },
    rightCenter: { value: new THREE.Vector2(0.68, 0.52) },
    resolution: { value: new THREE.Vector2(1, 1) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tScene;
    uniform int glassesEnabled;
    uniform vec3 leftLens;
    uniform vec3 rightLens;
    uniform vec2 leftCenter;
    uniform vec2 rightCenter;
    uniform vec2 resolution;

    varying vec2 vUv;

    vec2 lensDistort(vec2 uv, vec2 center, float sph) {
      vec2 d = uv - center;
      float r2 = dot(d, d);
      float k = sph * 0.04;
      return uv + d * r2 * k;
    }

    vec3 sampleAnisotropicBlur(vec2 uv, vec3 lens) {
      float sph = lens.x;
      float cyl = lens.y;
      float axis = radians(lens.z);

      float sphPower = abs(sph);
      float cylPower = abs(cyl);

      float isoRadius = clamp((sphPower * 0.0022), 0.0, 0.018);
      float anisoRadius = clamp((cylPower * 0.003), 0.0, 0.024);

      vec2 dir = vec2(cos(axis), sin(axis));

      vec3 base = texture2D(tScene, uv).rgb * 0.26;

      vec3 iso = vec3(0.0);
      iso += texture2D(tScene, uv + vec2( isoRadius,  0.0)).rgb;
      iso += texture2D(tScene, uv + vec2(-isoRadius,  0.0)).rgb;
      iso += texture2D(tScene, uv + vec2( 0.0,  isoRadius)).rgb;
      iso += texture2D(tScene, uv + vec2( 0.0, -isoRadius)).rgb;
      iso *= 0.11;

      vec2 a = dir * anisoRadius;
      vec2 b = vec2(-dir.y, dir.x) * (anisoRadius * 0.3 * sign(cyl == 0.0 ? 1.0 : cyl));

      vec3 cylBlur = vec3(0.0);
      cylBlur += texture2D(tScene, uv + a + b).rgb;
      cylBlur += texture2D(tScene, uv - a + b).rgb;
      cylBlur += texture2D(tScene, uv + a - b).rgb;
      cylBlur += texture2D(tScene, uv - a - b).rgb;
      cylBlur *= 0.12;

      return base + iso + cylBlur;
    }

    void main() {
      vec3 original = texture2D(tScene, vUv).rgb;

      if (glassesEnabled == 0) {
        gl_FragColor = vec4(original, 1.0);
        return;
      }

      bool isLeft = vUv.x <= 0.5;
      vec3 lens = isLeft ? leftLens : rightLens;
      vec2 center = isLeft ? leftCenter : rightCenter;
      vec2 warpedUv = lensDistort(vUv, center, lens.x);
      vec3 col = sampleAnisotropicBlur(warpedUv, lens);
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
postScene.add(postQuad);

const posterCanvas = document.createElement("canvas");
posterCanvas.width = 2400;
posterCanvas.height = 480;
const posterCtx = posterCanvas.getContext("2d");

const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointer = new THREE.Vector2();
const dragState = {
  active: false,
  mode: "move",
  offset: new THREE.Vector3(),
  startY: 0,
  startDistance: appState.distanceM
};

const axisDialState = {
  active: false,
  lensKey: "left"
};

function drawSnellen() {
  const ctx = posterCtx;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);
  ctx.fillStyle = "#0b0f16";

  const lines = ["E", "FP", "TOZ", "LPED", "PECFD", "EDFCZP", "FELOPZD"];
  const sizes = [120, 92, 74, 58, 48, 40, 34];

  let y = 70;
  for (let i = 0; i < lines.length; i += 1) {
    ctx.font = `700 ${sizes[i]}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(lines[i], posterCanvas.width / 2, y);
    y += sizes[i] + 8;
  }

  ctx.strokeStyle = "#274875";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, posterCanvas.width - 16, posterCanvas.height - 16);
}

function drawBalloon() {
  const ctx = posterCtx;
  const w = posterCanvas.width;
  const h = posterCanvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#9ed2ff");
  grad.addColorStop(1, "#f2fbff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#d9edf7";
  for (let i = 0; i < 5; i += 1) {
    const x = 260 + i * 440;
    const y = 100 + (i % 2) * 25;
    ctx.beginPath();
    ctx.ellipse(x, y, 120, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = w * 0.5;
  const cy = h * 0.48;
  ctx.fillStyle = "#f25555";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 190, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd26f";
  for (let i = -3; i <= 3; i += 1) {
    const sx = cx + i * 46;
    ctx.fillRect(sx - 14, cy - 148, 28, 295);
  }

  ctx.fillStyle = "#6a4d35";
  ctx.fillRect(cx - 55, cy + 148, 110, 42);

  ctx.strokeStyle = "#6a4d35";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy + 148);
  ctx.lineTo(cx - 56, cy + 96);
  ctx.moveTo(cx + 34, cy + 148);
  ctx.lineTo(cx + 56, cy + 96);
  ctx.stroke();

  ctx.fillStyle = "#5ea446";
  ctx.fillRect(0, h - 65, w, 65);
}

function drawLines(horizontal) {
  const ctx = posterCtx;
  const w = posterCanvas.width;
  const h = posterCanvas.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 4;

  if (horizontal) {
    for (let y = 18; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else {
    for (let x = 18; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }
}

function updatePosterTexture() {
  if (appState.posterType === "snellen") {
    drawSnellen();
  } else if (appState.posterType === "balloon") {
    drawBalloon();
  } else if (appState.posterType === "hLines") {
    drawLines(true);
  } else {
    drawLines(false);
  }

  if (posterMaterial.map) {
    posterMaterial.map.dispose();
  }

  const texture = new THREE.CanvasTexture(posterCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  posterMaterial.map = texture;
  posterMaterial.needsUpdate = true;
}

function applyLightingPreset(name) {
  if (name === "optometrist") {
    ambientLight.color.set("#ffffff");
    ambientLight.intensity = 0.68;
    keyLight.color.set("#ffffff");
    keyLight.intensity = 1.38;
    fillLight.color.set("#d5e8ff");
    fillLight.intensity = 0.47;
    hemiLight.color.set("#ffffff");
    hemiLight.groundColor.set("#dfecff");
    hemiLight.intensity = 0.58;
    roomMaterial.color.set("#f5f8fd");
    scene.background.set("#dfe8f4");
  } else if (name === "warmRoom") {
    ambientLight.color.set("#ffe8c8");
    ambientLight.intensity = 0.6;
    keyLight.color.set("#ffc176");
    keyLight.intensity = 1.17;
    fillLight.color.set("#ffdcb4");
    fillLight.intensity = 0.37;
    hemiLight.color.set("#fff0dc");
    hemiLight.groundColor.set("#ffe6cc");
    hemiLight.intensity = 0.5;
    roomMaterial.color.set("#fbf0e4");
    scene.background.set("#eadbcd");
  } else if (name === "coolOffice") {
    ambientLight.color.set("#e2edff");
    ambientLight.intensity = 0.62;
    keyLight.color.set("#b8d1ff");
    keyLight.intensity = 1.24;
    fillLight.color.set("#cde8ff");
    fillLight.intensity = 0.43;
    hemiLight.color.set("#f1f7ff");
    hemiLight.groundColor.set("#dceaff");
    hemiLight.intensity = 0.52;
    roomMaterial.color.set("#f1f5fb");
    scene.background.set("#d3dfea");
  } else {
    ambientLight.color.set("#dbe5ef");
    ambientLight.intensity = 0.5;
    keyLight.color.set("#f2fff2");
    keyLight.intensity = 0.95;
    fillLight.color.set("#bfd4ff");
    fillLight.intensity = 0.32;
    hemiLight.color.set("#f0f5fb");
    hemiLight.groundColor.set("#d3deed");
    hemiLight.intensity = 0.45;
    roomMaterial.color.set("#e8edf4");
    scene.background.set("#c8d1de");
  }
}

function updateDistanceText() {
  const distanceFt = appState.distanceM * 3.28084;
  const chipText = `${appState.distanceM.toFixed(2)}m / ${distanceFt.toFixed(2)}ft`;
  ui.distanceValue.textContent = `${appState.distanceM.toFixed(2)} m (${distanceFt.toFixed(2)} ft)`;
  ui.hudDistanceChip.textContent = chipText;
}

function updatePosterTransform() {
  const z = -appState.distanceM;
  poster.position.set(appState.posterPosition.x, appState.posterPosition.y, z);
  supportBar.position.set(appState.posterPosition.x, appState.posterPosition.y + 0.6, z - 0.03);
  updateDistanceText();
}

function updateLensCards() {
  const left = appState.lens.left;
  const right = appState.lens.right;

  ui.hudLeftSph.textContent = `SPH: ${left.sph.toFixed(2)}`;
  ui.hudLeftCyl.textContent = `CYL: ${left.cyl.toFixed(2)}`;
  ui.hudLeftAxis.textContent = `AXIS: ${left.axis.toFixed(0)}°`;

  ui.hudRightSph.textContent = `SPH: ${right.sph.toFixed(2)}`;
  ui.hudRightCyl.textContent = `CYL: ${right.cyl.toFixed(2)}`;
  ui.hudRightAxis.textContent = `AXIS: ${right.axis.toFixed(0)}°`;

  ui.axisValueLeft.textContent = `${left.axis.toFixed(0)}°`;
  ui.axisValueRight.textContent = `${right.axis.toFixed(0)}°`;

  ui.axisDialLeft.style.setProperty("--axis-deg", `${left.axis * 2}deg`);
  ui.axisDialRight.style.setProperty("--axis-deg", `${right.axis * 2}deg`);

  ui.axisDialLeft.setAttribute("aria-valuenow", `${left.axis.toFixed(0)}`);
  ui.axisDialRight.setAttribute("aria-valuenow", `${right.axis.toFixed(0)}`);
}

function syncLensToShader() {
  const left = appState.lens.left;
  const right = appState.lens.right;
  postMaterial.uniforms.leftLens.value.set(left.sph, left.cyl, left.axis);
  postMaterial.uniforms.rightLens.value.set(right.sph, right.cyl, right.axis);
  postMaterial.uniforms.glassesEnabled.value = appState.glassesEnabled ? 1 : 0;
  updateLensCards();
}

function toggleDrawer(forceOpen) {
  appState.drawerOpen = typeof forceOpen === "boolean" ? forceOpen : !appState.drawerOpen;
  ui.immersiveDrawer.classList.toggle("open", appState.drawerOpen);
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function intersectPosterPlane(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  dragPlane.constant = appState.distanceM;
  const hit = new THREE.Vector3();
  const didHit = raycaster.ray.intersectPlane(dragPlane, hit);
  return didHit ? hit : null;
}

function startPosterDrag(event) {
  if (event.target.closest(".immersive-drawer, .immersive-topbar, .hud-float-card")) {
    return;
  }

  if (event.button !== 0 && event.button !== 2) {
    return;
  }

  const zoomMode = event.button === 2 || event.shiftKey;
  if (zoomMode) {
    dragState.active = true;
    dragState.mode = "zoom";
    dragState.startY = event.clientY;
    dragState.startDistance = appState.distanceM;
    renderer.domElement.style.cursor = "ns-resize";
    return;
  }

  const hit = intersectPosterPlane(event);
  if (!hit) {
    return;
  }

  dragState.active = true;
  dragState.mode = "move";
  dragState.offset.set(hit.x - appState.posterPosition.x, hit.y - appState.posterPosition.y, 0);
  renderer.domElement.style.cursor = "grabbing";
}

function onPosterDrag(event) {
  if (!dragState.active) {
    return;
  }

  if (dragState.mode === "zoom") {
    const deltaY = event.clientY - dragState.startY;
    appState.distanceM = THREE.MathUtils.clamp(dragState.startDistance + deltaY * 0.03, 0.3048, 20);
    ui.distanceRange.value = String(appState.distanceM);
    updatePosterTransform();
    return;
  }

  const hit = intersectPosterPlane(event);
  if (!hit) {
    return;
  }

  appState.posterPosition.x = THREE.MathUtils.clamp(hit.x - dragState.offset.x, -4.8, 4.8);
  appState.posterPosition.y = THREE.MathUtils.clamp(hit.y - dragState.offset.y, 0.7, 3.8);
  updatePosterTransform();
}

function endPosterDrag() {
  dragState.active = false;
  renderer.domElement.style.cursor = "grab";
}

function adjustLens(lensKey, control, delta) {
  const lens = appState.lens[lensKey];

  if (control === "sph") {
    lens.sph = THREE.MathUtils.clamp(lens.sph + delta, -10, 10);
  } else if (control === "cyl") {
    lens.cyl = THREE.MathUtils.clamp(lens.cyl + delta, -6, 6);
  }

  syncLensToShader();
}

function setAxisFromPointer(lensKey, clientX, clientY, dialEl) {
  const rect = dialEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;

  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) {
    deg += 360;
  }

  const axis = Math.round(deg / 2);
  appState.lens[lensKey].axis = THREE.MathUtils.clamp(axis, 0, 180);
  syncLensToShader();
}

function bindAxisDial(dialElement, lensKey) {
  dialElement.addEventListener("pointerdown", (event) => {
    axisDialState.active = true;
    axisDialState.lensKey = lensKey;
    setAxisFromPointer(lensKey, event.clientX, event.clientY, dialElement);
  });

  dialElement.addEventListener("click", (event) => {
    setAxisFromPointer(lensKey, event.clientX, event.clientY, dialElement);
  });
}

function bindUi() {
  ui.drawerToggle.addEventListener("click", () => toggleDrawer());
  ui.drawerClose.addEventListener("click", () => toggleDrawer(false));

  ui.distanceRange.addEventListener("input", () => {
    appState.distanceM = Number(ui.distanceRange.value);
    updatePosterTransform();
  });

  ui.glassesEnabled.addEventListener("change", () => {
    appState.glassesEnabled = ui.glassesEnabled.checked;
    syncLensToShader();
  });

  ui.posterType.addEventListener("change", () => {
    appState.posterType = ui.posterType.value;
    updatePosterTexture();
  });

  ui.lightingPreset.addEventListener("change", () => {
    appState.lightingPreset = ui.lightingPreset.value;
    applyLightingPreset(appState.lightingPreset);
  });

  renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  renderer.domElement.addEventListener("pointerdown", startPosterDrag);
  window.addEventListener("pointermove", onPosterDrag);
  window.addEventListener("pointerup", endPosterDrag);
  window.addEventListener("pointercancel", endPosterDrag);

  ui.lensStepButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const lensKey = btn.dataset.lens;
      const control = btn.dataset.control;
      const step = Number(btn.dataset.step);
      const precisionStep = event.altKey ? step * 0.2 : step;
      adjustLens(lensKey, control, precisionStep);
    });
  });

  bindAxisDial(ui.axisDialLeft, "left");
  bindAxisDial(ui.axisDialRight, "right");

  window.addEventListener("pointermove", (event) => {
    if (!axisDialState.active) {
      return;
    }

    const dial = axisDialState.lensKey === "left" ? ui.axisDialLeft : ui.axisDialRight;
    setAxisFromPointer(axisDialState.lensKey, event.clientX, event.clientY, dial);
  });

  window.addEventListener("pointerup", () => {
    axisDialState.active = false;
  });

  window.addEventListener("pointerdown", (event) => {
    const inDrawer = ui.immersiveDrawer.contains(event.target);
    const inTopbar = event.target.closest(".immersive-topbar");

    if (appState.drawerOpen && !inDrawer && !inTopbar) {
      toggleDrawer(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleDrawer(false);
    }
  });
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  offscreen.setSize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
  postMaterial.uniforms.resolution.value.set(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  renderer.setRenderTarget(offscreen);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  renderer.render(postScene, postCamera);
}

bindUi();
updatePosterTexture();
applyLightingPreset(appState.lightingPreset);
updatePosterTransform();
syncLensToShader();
resize();
animate();

renderer.domElement.style.cursor = "grab";
window.addEventListener("resize", resize);
