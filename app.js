import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const viewport = document.getElementById("viewport");

const ui = {
  distanceRange: document.getElementById("distanceRange"),
  distanceValue: document.getElementById("distanceValue"),
  glassesEnabled: document.getElementById("glassesEnabled"),
  activeLens: document.getElementById("activeLens"),
  sph: document.getElementById("sph"),
  sphValue: document.getElementById("sphValue"),
  cyl: document.getElementById("cyl"),
  cylValue: document.getElementById("cylValue"),
  axis: document.getElementById("axis"),
  axisValue: document.getElementById("axisValue"),
  posterType: document.getElementById("posterType"),
  lightingPreset: document.getElementById("lightingPreset")
};

const appState = {
  distanceM: Number(ui.distanceRange.value),
  glassesEnabled: true,
  activeLens: "left",
  lens: {
    left: { sph: -0.25, cyl: -3.25, axis: 25 },
    right: { sph: -0.25, cyl: -3.25, axis: 25 }
  },
  posterType: "snellen",
  lightingPreset: "optometrist"
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#cfd6e2");

const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
camera.position.set(0, 1.6, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(2.5, 4, 2.5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xcfe4ff, 0.25, 25);
fillLight.position.set(-3, 1.8, -2);
scene.add(fillLight);

const roomMaterial = new THREE.MeshStandardMaterial({ color: "#eef2f8", side: THREE.BackSide });
const room = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 28), roomMaterial);
room.position.set(0, 2.4, -8);
scene.add(room);

const posterMaterial = new THREE.MeshStandardMaterial({
  map: null,
  roughness: 0.85,
  metalness: 0.02
});
const poster = new THREE.Mesh(new THREE.PlaneGeometry(5, 1), posterMaterial);
poster.position.set(0, 1.6, -appState.distanceM);
scene.add(poster);

const supportBar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.018, 0.018, 5.25, 20),
  new THREE.MeshStandardMaterial({ color: "#445166", roughness: 0.7 })
);
supportBar.rotation.z = Math.PI / 2;
supportBar.position.set(0, 2.2, -appState.distanceM - 0.03);
scene.add(supportBar);

const lensCenters = {
  left: new THREE.Vector2(0.25, 0.5),
  right: new THREE.Vector2(0.75, 0.5)
};

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
    leftCenter: { value: lensCenters.left },
    rightCenter: { value: lensCenters.right },
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
      vec2 px = 1.0 / resolution;

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
      if (glassesEnabled == 0) {
        gl_FragColor = texture2D(tScene, vUv);
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
    ambientLight.intensity = 0.45;
    keyLight.color.set("#ffffff");
    keyLight.intensity = 1.15;
    fillLight.color.set("#d5e8ff");
    fillLight.intensity = 0.26;
    roomMaterial.color.set("#edf2f8");
    scene.background.set("#ced7e3");
  } else if (name === "warmRoom") {
    ambientLight.color.set("#ffe6c2");
    ambientLight.intensity = 0.35;
    keyLight.color.set("#ffc176");
    keyLight.intensity = 0.9;
    fillLight.color.set("#ffdcb4");
    fillLight.intensity = 0.2;
    roomMaterial.color.set("#f4e6d7");
    scene.background.set("#d9c8b8");
  } else if (name === "coolOffice") {
    ambientLight.color.set("#e2edff");
    ambientLight.intensity = 0.4;
    keyLight.color.set("#b8d1ff");
    keyLight.intensity = 1.0;
    fillLight.color.set("#cde8ff");
    fillLight.intensity = 0.28;
    roomMaterial.color.set("#e9eff8");
    scene.background.set("#c2d0df");
  } else {
    ambientLight.color.set("#cdd8e2");
    ambientLight.intensity = 0.2;
    keyLight.color.set("#f2fff2");
    keyLight.intensity = 0.55;
    fillLight.color.set("#adc8ff");
    fillLight.intensity = 0.12;
    roomMaterial.color.set("#dae0e8");
    scene.background.set("#aeb8c6");
  }
}

function updateDistance() {
  poster.position.z = -appState.distanceM;
  supportBar.position.z = -appState.distanceM - 0.03;

  const distanceFt = appState.distanceM * 3.28084;
  ui.distanceValue.textContent = `${appState.distanceM.toFixed(2)} m (${distanceFt.toFixed(2)} ft)`;
}

function updateLensControlsFromState() {
  const lens = appState.lens[appState.activeLens];
  ui.sph.value = String(lens.sph);
  ui.cyl.value = String(lens.cyl);
  ui.axis.value = String(lens.axis);
  updateLensText();
}

function updateLensText() {
  const lens = appState.lens[appState.activeLens];
  ui.sphValue.textContent = `${appState.activeLens.toUpperCase()} SPH: ${lens.sph.toFixed(2)}`;
  ui.cylValue.textContent = `${appState.activeLens.toUpperCase()} CYL: ${lens.cyl.toFixed(2)}`;
  ui.axisValue.textContent = `${appState.activeLens.toUpperCase()} Axis: ${lens.axis.toFixed(0)}°`;
}

function syncLensToShader() {
  const left = appState.lens.left;
  const right = appState.lens.right;
  postMaterial.uniforms.leftLens.value.set(left.sph, left.cyl, left.axis);
  postMaterial.uniforms.rightLens.value.set(right.sph, right.cyl, right.axis);
  postMaterial.uniforms.glassesEnabled.value = appState.glassesEnabled ? 1 : 0;
}

function bindUi() {
  ui.distanceRange.addEventListener("input", () => {
    appState.distanceM = Number(ui.distanceRange.value);
    updateDistance();
  });

  ui.glassesEnabled.addEventListener("change", () => {
    appState.glassesEnabled = ui.glassesEnabled.checked;
    syncLensToShader();
  });

  ui.activeLens.addEventListener("change", () => {
    appState.activeLens = ui.activeLens.value;
    updateLensControlsFromState();
  });

  ui.sph.addEventListener("input", () => {
    appState.lens[appState.activeLens].sph = Number(ui.sph.value);
    updateLensText();
    syncLensToShader();
  });

  ui.cyl.addEventListener("input", () => {
    appState.lens[appState.activeLens].cyl = Number(ui.cyl.value);
    updateLensText();
    syncLensToShader();
  });

  ui.axis.addEventListener("input", () => {
    appState.lens[appState.activeLens].axis = Number(ui.axis.value);
    updateLensText();
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
updateDistance();
updateLensControlsFromState();
syncLensToShader();
resize();
animate();

window.addEventListener("resize", resize);
