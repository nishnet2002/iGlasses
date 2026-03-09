import * as THREE from "./third_party/three.module.js";

const viewport = document.getElementById("viewport");

const ui = {
  body: document.body,
  drawerToggle: document.getElementById("drawerToggle"),
  shortcutToggle: document.getElementById("shortcutToggle"),
  resetView: document.getElementById("resetView"),
  drawerClose: document.getElementById("drawerClose"),
  immersiveDrawer: document.getElementById("immersiveDrawer"),
  shortcutOverlay: document.getElementById("shortcutOverlay"),
  shortcutClose: document.getElementById("shortcutClose"),
  openGuideFromDrawer: document.getElementById("openGuideFromDrawer"),
  lensStepButtons: Array.from(document.querySelectorAll(".lens-step")),
  axisDialLeft: document.getElementById("axisDialLeft"),
  axisDialRight: document.getElementById("axisDialRight"),
  axisValueLeft: document.getElementById("axisValueLeft") || document.getElementById("hudLeftAxis"),
  axisValueRight: document.getElementById("axisValueRight") || document.getElementById("hudRightAxis"),
  hudLeftCard: document.getElementById("hudLeftCard"),
  hudRightCard: document.getElementById("hudRightCard"),
  hudLeftSph: document.getElementById("hudLeftSph"),
  hudLeftCyl: document.getElementById("hudLeftCyl"),
  hudLeftAxis: document.getElementById("hudLeftAxis") || document.getElementById("axisValueLeft"),
  hudRightSph: document.getElementById("hudRightSph"),
  hudRightCyl: document.getElementById("hudRightCyl"),
  hudRightAxis: document.getElementById("hudRightAxis") || document.getElementById("axisValueRight"),
  hudDistanceChip: document.getElementById("hudDistanceChip"),
  distanceRange: document.getElementById("distanceRange"),
  distanceValue: document.getElementById("distanceValue"),
  glassesEnabled: document.getElementById("glassesEnabled"),
  posterType: document.getElementById("posterType"),
  lightingPreset: document.getElementById("lightingPreset"),
  segmentedPills: Array.from(document.querySelectorAll(".segmented-pill")),
  visionStateBadge: document.getElementById("visionStateBadge"),
  posterSummary: document.getElementById("posterSummary"),
  posterSummaryDock: document.getElementById("posterSummaryDock"),
  roomSummary: document.getElementById("roomSummary"),
  roomSummaryDock: document.getElementById("roomSummaryDock"),
  distanceSummary: document.getElementById("distanceSummary"),
  statusToast: document.getElementById("statusToast")
};

function createDefaultState() {
  return {
    distanceM: Number(ui.distanceRange.value),
    glassesEnabled: true,
    drawerOpen: false,
    shortcutOverlayOpen: false,
    lens: {
      left: { sph: -0.25, cyl: -3.25, axis: 25 },
      right: { sph: -0.25, cyl: -3.25, axis: 25 }
    },
    posterType: "snellen",
    lightingPreset: "optometrist",
    posterPosition: { x: 0, y: 1.6 }
  };
}

const bootstrapUi = {
  drawer: window.bootstrap ? new window.bootstrap.Offcanvas(ui.immersiveDrawer) : null,
  shortcuts: window.bootstrap ? new window.bootstrap.Modal(ui.shortcutOverlay) : null
};

const appState = createDefaultState();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#1a2230");

const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
camera.position.set(0, 1.6, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(2.5, 4, 2.5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x8ba8cc, 0.3, 25);
fillLight.position.set(-3, 1.8, -2);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0x8899b0, 0x1a2230, 0.35);
scene.add(hemiLight);

const roomMaterial = new THREE.MeshStandardMaterial({ color: "#1e2a3a", side: THREE.BackSide });
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
  new THREE.MeshStandardMaterial({ color: "#3a4a60", roughness: 0.7 })
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
const pointer = new THREE.Vector2();
const dragState = {
  active: false,
  pointerId: null,
  mode: "move",
  offset: new THREE.Vector3(),
  startY: 0,
  startDistance: appState.distanceM
};

const axisDialState = {
  active: false,
  lensKey: "left"
};

// Animation state for smooth transitions
const animationState = {
  targetDistance: appState.distanceM,
  animatingDistance: false,
  distanceAnimationFrame: null
};

let activeLensCard = "left";

const labelMap = {
  posterType: {
    snellen: "Snellen Chart",
    balloon: "Classic Hot Air Balloon",
    hLines: "Horizontal Lines",
    vLines: "Vertical Lines"
  },
  lightingPreset: {
    optometrist: "Optometrist View",
    warmRoom: "Warm Room",
    coolOffice: "Cool Office",
    dimExam: "Dim Exam Room"
  }
};

let statusToastTimer = null;
let fatalErrorShown = false;

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getPosterLabel(value) {
  return labelMap.posterType[value] || "Custom Poster";
}

function getLightingLabel(value) {
  return labelMap.lightingPreset[value] || "Custom Room";
}

function announceStatus(message) {
  if (!ui.statusToast) {
    return;
  }

  ui.statusToast.textContent = message;
  ui.statusToast.classList.add("visible");

  if (statusToastTimer) {
    clearTimeout(statusToastTimer);
  }

  statusToastTimer = window.setTimeout(() => {
    ui.statusToast.classList.remove("visible");
  }, 2200);
}

function reportRuntimeIssue(message, error) {
  const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error || "");
  console.error(message, error);
  announceStatus(message);

  if (!fatalErrorShown || details) {
    fatalErrorShown = true;
  }
}

function updateViewSummary() {
  const distanceFt = appState.distanceM * 3.28084;
  const visionOn = appState.glassesEnabled;
  const posterLabel = getPosterLabel(appState.posterType);
  const lightingLabel = getLightingLabel(appState.lightingPreset);

  ui.visionStateBadge.textContent = visionOn ? "Filter on" : "Filter off";
  ui.visionStateBadge.classList.toggle("is-off", !visionOn);
  if (ui.posterSummary) {
    ui.posterSummary.textContent = posterLabel;
  }
  if (ui.posterSummaryDock) {
    ui.posterSummaryDock.textContent = posterLabel;
  }
  if (ui.roomSummary) {
    ui.roomSummary.textContent = lightingLabel;
  }
  if (ui.roomSummaryDock) {
    ui.roomSummaryDock.textContent = lightingLabel;
  }
  if (ui.distanceSummary) {
    ui.distanceSummary.textContent = `${appState.distanceM.toFixed(2)} m / ${distanceFt.toFixed(2)} ft`;
  }

  ui.segmentedPills.forEach((button) => {
    const setting = button.dataset.setting;
    const targetValue = button.dataset.value;
    const currentValue = setting === "posterType" ? appState.posterType : appState.lightingPreset;
    const isActive = currentValue === targetValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  ui.drawerToggle.setAttribute("aria-expanded", String(appState.drawerOpen));
}

function syncShellState() {
  ui.body?.classList.toggle("is-drawer-open", appState.drawerOpen);
  ui.body?.classList.toggle("is-shortcut-open", appState.shortcutOverlayOpen);
}

function setActiveLensCard(lensKey) {
  activeLensCard = lensKey;

  ui.hudLeftCard?.classList.toggle("is-active", lensKey === "left");
  ui.hudRightCard?.classList.toggle("is-active", lensKey === "right");
}

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
    ambientLight.color.set("#c0ccdd");
    ambientLight.intensity = 0.35;
    keyLight.color.set("#ffffff");
    keyLight.intensity = 0.9;
    fillLight.color.set("#8ba8cc");
    fillLight.intensity = 0.3;
    hemiLight.color.set("#8899b0");
    hemiLight.groundColor.set("#1a2230");
    hemiLight.intensity = 0.35;
    roomMaterial.color.set("#1e2a3a");
    scene.background.set("#1a2230");
  } else if (name === "warmRoom") {
    ambientLight.color.set("#a07850");
    ambientLight.intensity = 0.32;
    keyLight.color.set("#cc8844");
    keyLight.intensity = 0.75;
    fillLight.color.set("#996644");
    fillLight.intensity = 0.25;
    hemiLight.color.set("#99774d");
    hemiLight.groundColor.set("#1a1408");
    hemiLight.intensity = 0.3;
    roomMaterial.color.set("#2a2018");
    scene.background.set("#1e1810");
  } else if (name === "coolOffice") {
    ambientLight.color.set("#8899cc");
    ambientLight.intensity = 0.34;
    keyLight.color.set("#7090cc");
    keyLight.intensity = 0.8;
    fillLight.color.set("#7798bb");
    fillLight.intensity = 0.28;
    hemiLight.color.set("#8899bb");
    hemiLight.groundColor.set("#182030");
    hemiLight.intensity = 0.32;
    roomMaterial.color.set("#1a2438");
    scene.background.set("#151e2c");
  } else {
    ambientLight.color.set("#8090a8");
    ambientLight.intensity = 0.28;
    keyLight.color.set("#99bb99");
    keyLight.intensity = 0.6;
    fillLight.color.set("#6680aa");
    fillLight.intensity = 0.2;
    hemiLight.color.set("#7888a0");
    hemiLight.groundColor.set("#141c28");
    hemiLight.intensity = 0.25;
    roomMaterial.color.set("#182030");
    scene.background.set("#121820");
  }
}

function updateDistanceText() {
  const distanceFt = appState.distanceM * 3.28084;
  const chipText = `${appState.distanceM.toFixed(2)}m / ${distanceFt.toFixed(2)}ft`;
  ui.distanceValue.textContent = `${appState.distanceM.toFixed(2)} m (${distanceFt.toFixed(2)} ft)`;
  if (ui.hudDistanceChip) {
    ui.hudDistanceChip.textContent = chipText;
  }
  updateViewSummary();

  if (ui.hudDistanceChip) {
    ui.hudDistanceChip.style.animation = "none";
    requestAnimationFrame(() => {
      ui.hudDistanceChip.style.animation = "pulse 0.3s ease-out";
    });
  }
}

// Smooth distance animation
function animateDistanceChange(targetDistance) {
  if (animationState.distanceAnimationFrame) {
    cancelAnimationFrame(animationState.distanceAnimationFrame);
  }
  
  const startDistance = appState.distanceM;
  const startTime = performance.now();
  const duration = 300; // ms
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    appState.distanceM = startDistance + (targetDistance - startDistance) * easeProgress;
    updatePosterTransform();
    
    if (progress < 1) {
      animationState.distanceAnimationFrame = requestAnimationFrame(animate);
    } else {
      animationState.distanceAnimationFrame = null;
    }
  }
  
  animationState.distanceAnimationFrame = requestAnimationFrame(animate);
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

  const formatLensValue = (value) => {
    const absValue = Math.abs(value).toFixed(2);
    if (Object.is(value, -0) || value < 0) {
      return `−${absValue}`;
    }

    return `+${absValue}`;
  };

  // Animate value changes with transitions
  const updateWithTransition = (element, newText) => {
    element.style.transition = 'opacity 0.15s ease-out';
    element.style.opacity = '0.6';
    setTimeout(() => {
      element.textContent = newText;
      element.style.opacity = '1';
    }, 75);
  };

  updateWithTransition(ui.hudLeftSph, formatLensValue(left.sph));
  updateWithTransition(ui.hudLeftCyl, formatLensValue(left.cyl));
  updateWithTransition(ui.hudLeftAxis, `${left.axis.toFixed(0)}°`);

  updateWithTransition(ui.hudRightSph, formatLensValue(right.sph));
  updateWithTransition(ui.hudRightCyl, formatLensValue(right.cyl));
  updateWithTransition(ui.hudRightAxis, `${right.axis.toFixed(0)}°`);

  if (ui.axisValueLeft && ui.axisValueLeft !== ui.hudLeftAxis) {
    updateWithTransition(ui.axisValueLeft, `${left.axis.toFixed(0)}°`);
  }

  if (ui.axisValueRight && ui.axisValueRight !== ui.hudRightAxis) {
    updateWithTransition(ui.axisValueRight, `${right.axis.toFixed(0)}°`);
  }

  ui.axisDialLeft.style.setProperty("--axis-deg", `${left.axis * 2}deg`);
  ui.axisDialRight.style.setProperty("--axis-deg", `${right.axis * 2}deg`);

  ui.axisDialLeft.setAttribute("aria-valuenow", `${left.axis.toFixed(0)}`);
  ui.axisDialRight.setAttribute("aria-valuenow", `${right.axis.toFixed(0)}`);
  ui.axisDialLeft.setAttribute("aria-valuetext", `${left.axis.toFixed(0)} degrees`);
  ui.axisDialRight.setAttribute("aria-valuetext", `${right.axis.toFixed(0)} degrees`);
}

// Button click feedback
function addButtonFeedback(button) {
  button.style.transform = 'translateY(0) scale(0.95)';
  setTimeout(() => {
    button.style.transform = '';
  }, 100);
}

function syncLensToShader() {
  const left = appState.lens.left;
  const right = appState.lens.right;
  postMaterial.uniforms.leftLens.value.set(left.sph, left.cyl, left.axis);
  postMaterial.uniforms.rightLens.value.set(right.sph, right.cyl, right.axis);
  postMaterial.uniforms.glassesEnabled.value = appState.glassesEnabled ? 1 : 0;
  updateLensCards();
  updateViewSummary();
}

function toggleDrawer(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !appState.drawerOpen;

  if (bootstrapUi.drawer) {
    if (shouldOpen) {
      bootstrapUi.drawer.show();
    } else {
      bootstrapUi.drawer.hide();
    }
    return;
  }

  appState.drawerOpen = shouldOpen;
  ui.immersiveDrawer.classList.toggle("show", shouldOpen);
  syncShellState();
  updateViewSummary();
}

function toggleShortcutOverlay(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !appState.shortcutOverlayOpen;

  if (bootstrapUi.shortcuts) {
    if (shouldOpen) {
      bootstrapUi.shortcuts.show();
    } else {
      bootstrapUi.shortcuts.hide();
    }
    return;
  }

  appState.shortcutOverlayOpen = shouldOpen;
  ui.shortcutOverlay.hidden = !shouldOpen;
  syncShellState();
}

function handleShortcutClose(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  addButtonFeedback(ui.shortcutClose);
  toggleShortcutOverlay(false);
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function isUiInteractionTarget(target) {
  return Boolean(target?.closest?.(".immersive-drawer, .immersive-topbar, .hud-float-card, .shortcut-overlay"));
}

function intersectPoster(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const [hit] = raycaster.intersectObject(poster, false);
  return hit?.point || null;
}

function startPosterDrag(event) {
  if (axisDialState.active || isUiInteractionTarget(event.target)) {
    return;
  }

  if (event.button !== 0 && event.button !== 2) {
    return;
  }

  const zoomMode = event.button === 2 || event.shiftKey;
  if (zoomMode) {
    dragState.active = true;
    dragState.pointerId = event.pointerId;
    dragState.mode = "zoom";
    dragState.startY = event.clientY;
    dragState.startDistance = appState.distanceM;
    renderer.domElement.style.cursor = "ns-resize";
    return;
  }

  const hit = intersectPoster(event);
  if (!hit) {
    return;
  }

  dragState.active = true;
  dragState.pointerId = event.pointerId;
  dragState.mode = "move";
  dragState.offset.set(hit.x - appState.posterPosition.x, hit.y - appState.posterPosition.y, 0);
  renderer.domElement.style.cursor = "grabbing";
}

function onPosterDrag(event) {
  if (axisDialState.active || dragState.pointerId !== event.pointerId) {
    return;
  }

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

  const hit = intersectPoster(event);
  if (!hit) {
    return;
  }

  appState.posterPosition.x = THREE.MathUtils.clamp(hit.x - dragState.offset.x, -4.8, 4.8);
  appState.posterPosition.y = THREE.MathUtils.clamp(hit.y - dragState.offset.y, 0.7, 3.8);
  updatePosterTransform();
}

function endPosterDrag(event) {
  if (event?.pointerId != null && dragState.pointerId !== event.pointerId) {
    return;
  }

  const wasActive = dragState.active;
  const mode = dragState.mode;
  dragState.active = false;
  dragState.pointerId = null;
  renderer.domElement.style.cursor = "grab";

  if (!wasActive) {
    return;
  }

  if (mode === "zoom") {
    announceStatus(`Distance set to ${appState.distanceM.toFixed(2)} meters.`);
    return;
  }

  announceStatus("Poster position updated.");
}

function adjustLens(lensKey, control, delta) {
  const lens = appState.lens[lensKey];

  setActiveLensCard(lensKey);

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
  setActiveLensCard(lensKey);
  syncLensToShader();
}

function bindAxisDial(dialElement, lensKey) {
  dialElement.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.active = false;
    dragState.pointerId = null;
    axisDialState.active = true;
    axisDialState.lensKey = lensKey;
    setActiveLensCard(lensKey);
    dialElement.setPointerCapture?.(event.pointerId);
    setAxisFromPointer(lensKey, event.clientX, event.clientY, dialElement);
  });

  dialElement.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveLensCard(lensKey);
    setAxisFromPointer(lensKey, event.clientX, event.clientY, dialElement);
  });

  dialElement.addEventListener("pointerup", (event) => {
    event.stopPropagation();
    axisDialState.active = false;
    dialElement.releasePointerCapture?.(event.pointerId);
  });

  dialElement.addEventListener("pointercancel", () => {
    axisDialState.active = false;
  });

  dialElement.addEventListener("lostpointercapture", () => {
    axisDialState.active = false;
  });

  dialElement.addEventListener("keydown", (event) => {
    let handled = true;
    const lens = appState.lens[lensKey];
    const step = event.shiftKey ? 5 : 1;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      lens.axis = THREE.MathUtils.clamp(lens.axis + step, 0, 180);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      lens.axis = THREE.MathUtils.clamp(lens.axis - step, 0, 180);
    } else if (event.key === "Home") {
      lens.axis = 0;
    } else if (event.key === "End") {
      lens.axis = 180;
    } else {
      handled = false;
    }

    if (!handled) {
      return;
    }

    event.preventDefault();
    setActiveLensCard(lensKey);
    syncLensToShader();
    announceStatus(`${lensKey === "left" ? "Left" : "Right"} axis set to ${lens.axis.toFixed(0)} degrees.`);
  });
}

function resetExperience() {
  const defaults = createDefaultState();

  appState.distanceM = defaults.distanceM;
  appState.glassesEnabled = defaults.glassesEnabled;
  appState.lens.left = { ...defaults.lens.left };
  appState.lens.right = { ...defaults.lens.right };
  appState.posterType = defaults.posterType;
  appState.lightingPreset = defaults.lightingPreset;
  appState.posterPosition = { ...defaults.posterPosition };

  ui.distanceRange.value = String(appState.distanceM);
  ui.glassesEnabled.checked = appState.glassesEnabled;
  ui.posterType.value = appState.posterType;
  ui.lightingPreset.value = appState.lightingPreset;

  updatePosterTexture();
  applyLightingPreset(appState.lightingPreset);
  updatePosterTransform();
  syncLensToShader();
  announceStatus("View reset to the default eye exam setup.");
}

function bindUi() {
  if (bootstrapUi.drawer) {
    ui.immersiveDrawer.addEventListener("shown.bs.offcanvas", () => {
      appState.drawerOpen = true;
      syncShellState();
      updateViewSummary();
    });

    ui.immersiveDrawer.addEventListener("hidden.bs.offcanvas", () => {
      appState.drawerOpen = false;
      syncShellState();
      updateViewSummary();
    });
  }

  if (bootstrapUi.shortcuts) {
    ui.shortcutOverlay.addEventListener("shown.bs.modal", () => {
      appState.shortcutOverlayOpen = true;
      syncShellState();
      if (ui.statusToast) {
        ui.statusToast.classList.remove("visible");
      }
    });

    ui.shortcutOverlay.addEventListener("hidden.bs.modal", () => {
      appState.shortcutOverlayOpen = false;
      syncShellState();
    });
  }

  ui.drawerToggle.addEventListener("click", () => {
    addButtonFeedback(ui.drawerToggle);
    toggleDrawer();
  });

  ui.shortcutToggle.addEventListener("click", () => {
    addButtonFeedback(ui.shortcutToggle);
    toggleShortcutOverlay(true);
  });

  ui.resetView.addEventListener("click", () => {
    addButtonFeedback(ui.resetView);
    resetExperience();
  });
  
  ui.drawerClose.addEventListener("click", () => {
    addButtonFeedback(ui.drawerClose);
    toggleDrawer(false);
  });

  ui.shortcutClose.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    handleShortcutClose(event);
  });

  ui.shortcutClose.addEventListener("click", (event) => {
    if (event.detail !== 0) {
      return;
    }

    handleShortcutClose(event);
  });

  ui.openGuideFromDrawer.addEventListener("click", () => {
    addButtonFeedback(ui.openGuideFromDrawer);
    toggleShortcutOverlay(true);
  });

  // Debounced distance update for smooth performance
  const debouncedDistanceUpdate = debounce(() => {
    updatePosterTransform();
  }, 10);

  ui.distanceRange.addEventListener("input", () => {
    appState.distanceM = Number(ui.distanceRange.value);
    debouncedDistanceUpdate();
  });

  ui.glassesEnabled.addEventListener("change", () => {
    appState.glassesEnabled = ui.glassesEnabled.checked;
    syncLensToShader();
    announceStatus(`Glasses filter ${appState.glassesEnabled ? "enabled" : "disabled"}.`);
  });

  ui.posterType.addEventListener("change", () => {
    appState.posterType = ui.posterType.value;
    updatePosterTexture();
    updateViewSummary();
    announceStatus(`Poster changed to ${getPosterLabel(appState.posterType)}.`);
  });

  ui.lightingPreset.addEventListener("change", () => {
    appState.lightingPreset = ui.lightingPreset.value;
    applyLightingPreset(appState.lightingPreset);
    updateViewSummary();
    announceStatus(`Room changed to ${getLightingLabel(appState.lightingPreset)}.`);
  });

  ui.segmentedPills.forEach((button) => {
    button.addEventListener("click", () => {
      const setting = button.dataset.setting;
      const value = button.dataset.value;

      if (setting === "posterType") {
        if (ui.posterType.value === value) {
          return;
        }

        ui.posterType.value = value;
        ui.posterType.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      if (ui.lightingPreset.value === value) {
        return;
      }

      ui.lightingPreset.value = value;
      ui.lightingPreset.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });

  renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  renderer.domElement.addEventListener("pointerdown", startPosterDrag);
  window.addEventListener("pointermove", onPosterDrag);
  window.addEventListener("pointerup", endPosterDrag);
  window.addEventListener("pointercancel", endPosterDrag);

  ui.lensStepButtons.forEach((btn) => {
    btn.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      setActiveLensCard(btn.dataset.lens);
    });

    btn.addEventListener("click", (event) => {
      const lensKey = btn.dataset.lens;
      const control = btn.dataset.control;
      const step = Number(btn.dataset.step);
      const precisionStep = event.altKey ? step * 0.2 : step;
      addButtonFeedback(btn);
      adjustLens(lensKey, control, precisionStep);
    });
  });

  [ui.hudLeftCard, ui.hudRightCard].forEach((card) => {
    if (!card) {
      return;
    }

    card.addEventListener("pointerdown", () => {
      setActiveLensCard(card.dataset.lensCard);
    });

    card.addEventListener("focusin", () => {
      setActiveLensCard(card.dataset.lensCard);
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

  ui.shortcutOverlay.addEventListener("click", (event) => {
    if (event.target === ui.shortcutOverlay) {
      toggleShortcutOverlay(false);
    }
  });

  window.addEventListener("pointerdown", (event) => {
    if (appState.shortcutOverlayOpen) {
      return;
    }

    const inDrawer = ui.immersiveDrawer.contains(event.target);
    const inTopbar = event.target.closest(".immersive-topbar");
    const inHud = event.target.closest(".hud-float-card");

    if (appState.drawerOpen && !inDrawer && !inTopbar && !inHud) {
      toggleDrawer(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (appState.shortcutOverlayOpen) {
        toggleShortcutOverlay(false);
        return;
      }

      toggleDrawer(false);
    }

    if (event.key === "?" && !event.repeat) {
      event.preventDefault();
      toggleShortcutOverlay(true);
    }
  });
}

function bindRuntimeDiagnostics() {
  window.addEventListener("error", (event) => {
    reportRuntimeIssue("A runtime error occurred. Check the console for details.", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportRuntimeIssue("An unexpected async error occurred. Check the console for details.", event.reason);
  });

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    reportRuntimeIssue("WebGL context was lost. The view may stop updating.", null);
  });

  renderer.domElement.addEventListener("webglcontextrestored", () => {
    announceStatus("WebGL context restored.");
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
bindRuntimeDiagnostics();
updatePosterTexture();
applyLightingPreset(appState.lightingPreset);
updatePosterTransform();
syncLensToShader();
updateViewSummary();
syncShellState();
setActiveLensCard(activeLensCard);
resize();
animate();

renderer.domElement.style.cursor = "grab";
window.addEventListener("resize", resize);
