# iGlasses Dark Mode — Design Agency Specification

> **Prepared by:** Design Agency  
> **Date:** 2026-03-09  
> **Status:** Implemented  
> **Audience:** Frontend developers maintaining iGlasses

---

## 1. Overview

The iGlasses Console UI has been migrated from a light theme to a dark theme.  
This document catalogues every change made and the rationale behind the new palette so that any frontend developer can maintain, extend, or roll back the dark mode with confidence.

### Screenshots

| Default view | Drawer open |
|---|---|
| ![Dark mode main view](https://github.com/user-attachments/assets/1a13915f-45c2-45ed-bb6d-da360a08b813) | ![Dark mode drawer](https://github.com/user-attachments/assets/ae8d3ce3-07b5-40e3-837d-43431d98c730) |

---

## 2. Files Changed

| File | Owner | Summary of changes |
|---|---|---|
| `index.html` | Angela | `data-bs-theme` attribute switched from `"light"` to `"dark"` |
| `styles.css` | Angela | All CSS custom properties and hardcoded colours updated for dark palette |
| `app.js` | Dwight | Three.js scene background, room material, lighting defaults and all four presets darkened |
| `tests/ui/layout.spec.js` | Dwight | Test stabilisation background updated to match new body colour |

---

## 3. Bootstrap Theme Attribute

```html
<!-- BEFORE -->
<body data-bs-theme="light">

<!-- AFTER -->
<body data-bs-theme="dark">
```

Bootstrap 5.3+ reads `data-bs-theme` and swaps its own CSS variables (form controls, modals, offcanvas, etc.) automatically. Setting this single attribute flips all Bootstrap-provided surfaces to dark mode.

---

## 4. CSS Custom Properties — Token Map

All design tokens live in `:root`. The table below shows every token that changed.

### 4.1 Meta

| Token | Light value | Dark value | Notes |
|---|---|---|---|
| `color-scheme` | `light` | `dark` | Tells the browser to render scrollbars, form controls, etc. in dark mode |

### 4.2 Shadows

| Token | Light value | Dark value |
|---|---|---|
| `--shadow-soft` | `0 18px 40px rgba(20,31,45,0.14)` | `0 18px 40px rgba(0,0,0,0.35)` |
| `--shadow-card` | `0 20px 50px rgba(17,28,40,0.2)` | `0 20px 50px rgba(0,0,0,0.45)` |
| `--shadow-active` | `0 24px 50px rgba(55,100,173,0.24)` | `0 24px 50px rgba(55,100,173,0.35)` |

**Rationale:** On dark backgrounds shadows need higher opacity to remain visible.

### 4.3 Ink (Text) Colours

| Token | Light value | Dark value |
|---|---|---|
| `--ink-strong` | `#1d2733` | `#e8ecf1` |
| `--ink` | `rgba(29,39,51,0.92)` | `rgba(220,228,238,0.92)` |
| `--ink-muted` | `rgba(50,64,82,0.72)` | `rgba(160,175,195,0.78)` |

### 4.4 Line / Border Colours

| Token | Light value | Dark value |
|---|---|---|
| `--line` | `rgba(31,53,80,0.12)` | `rgba(200,215,235,0.1)` |
| `--line-strong` | `rgba(49,79,117,0.2)` | `rgba(200,215,235,0.18)` |

### 4.5 Panel / Surface Colours

| Token | Light value | Dark value |
|---|---|---|
| `--panel` | `rgba(246,240,230,0.82)` | `rgba(30,38,50,0.82)` |
| `--panel-strong` | `rgba(251,247,241,0.9)` | `rgba(36,44,58,0.9)` |
| `--panel-soft` | `rgba(255,255,255,0.48)` | `rgba(40,50,65,0.48)` |
| `--panel-dark` | `rgba(25,38,57,0.78)` | `rgba(15,20,30,0.78)` |
| `--surface-gradient` | `linear-gradient(145deg, rgba(255,252,247,0.88), rgba(239,232,222,0.72))` | `linear-gradient(145deg, rgba(30,38,50,0.88), rgba(22,28,38,0.72))` |

### 4.6 Accent Colours

| Token | Light value | Dark value | Notes |
|---|---|---|---|
| `--accent` | `#355f92` | `#5b8ec9` | Brightened for contrast on dark surfaces |
| `--accent-soft` | `rgba(53,95,146,0.12)` | `rgba(91,142,201,0.15)` | |
| `--accent-strong` | `#274975` | `#7aabdf` | Used for value labels, inline buttons |
| `--copper` | `#986748` | `#c9936e` | Brightened for visibility |
| `--copper-soft` | `rgba(152,103,72,0.14)` | `rgba(201,147,110,0.18)` | |

### 4.7 Status Colours

| Token | Light value | Dark value |
|---|---|---|
| `--success` | `#2d6f57` | `#4aad8a` |
| `--danger` | `#7f3641` | `#c96272` |

---

## 5. Hardcoded Colour Changes in `styles.css`

Beyond the `:root` tokens, many selectors had inline rgba/hex colours. The general mapping rule applied:

| Pattern | Light approach | Dark approach |
|---|---|---|
| White overlays `rgba(255,255,255,…)` | High-opacity white | Low-opacity light-slate (`rgba(80,100,130,…)` or dark fills `rgba(30,40,55,…)`) |
| Dark text / headings | `#172435`, `rgba(44,61,83,…)` | `#e0e6ee`, `rgba(160,180,210,…)` |
| Panel / card backgrounds | Near-white `rgba(255,…,0.5–0.9)` | Dark navy `rgba(28,36,50,…)` or `rgba(35,45,60,…)` |
| Borders | `rgba(31,53,80,0.1)` — dark on light | `rgba(80,100,130,0.12–0.18)` — light on dark |
| Gradients | `#eef2f7 → #dce5ef` | `#151b24 → #0f141c` |
| Inset highlights | `inset 0 1px 0 rgba(255,255,255,0.6)` | `inset 0 1px 0 rgba(80,100,130,0.2)` |

### Key selectors updated

| Selector | Property | Light | Dark |
|---|---|---|---|
| `body` | `background` | `#e6ebf2` | `#12171f` |
| `.command-bar` | `background` | `rgba(250,245,238,0.8)` gradient | `rgba(28,36,50,0.8)` gradient |
| `.command-bar` | `border` | `rgba(255,255,255,0.34)` | `rgba(100,120,150,0.15)` |
| `.brand-title` | `color` | `#172435` | `#e0e6ee` |
| `.top-btn` | `background` | `rgba(255,255,255,0.55)` | `rgba(35,45,60,0.55)` |
| `.top-btn-primary` | `background` | `#355f92 → #274975` | `#3a6fa5 → #2c5585` |
| `.immersive-drawer` | `--bs-offcanvas-bg` | `rgba(240,233,223,0.9)` | `rgba(22,28,40,0.9)` |
| `.drawer-panel` | `background` | `var(--surface-gradient)` | `var(--surface-gradient)` (token updated) |
| `.drawer-panel` | `border` | `rgba(255,255,255,0.35)` | `rgba(80,100,130,0.15)` |
| `.session-card` | `background` | `rgba(255,255,255,0.5)` | `rgba(35,45,60,0.5)` |
| `.segmented-pill` | `background` | `rgba(255,255,255,0.6)` | `rgba(35,45,60,0.6)` |
| `.segmented-pill.is-active` | `background` | `#355f92 → #274975` | `#3a6fa5 → #2c5585` |
| `.shortcut-dialog` | `background` | warm cream gradient | dark navy gradient |
| `.shortcut-card` | `background` | `rgba(255,255,255,0.62)` | `rgba(30,40,55,0.62)` |
| `.shortcut-key` | `background` | `rgba(255,255,255,0.82)` | `rgba(30,40,55,0.82)` |
| `.hud-float-card` | `background` | warm cream gradient | dark navy gradient |
| `.lens-row-card` | `background` | `rgba(255,255,255,0.46)` | `rgba(30,40,55,0.46)` |
| `.lens-step` | `background` | `rgba(255,255,255,0.76)` | `rgba(35,45,60,0.76)` |
| `.axis-dial` | `background` | cream → beige → dark radial | dark → darker → near-black radial |
| `.axis-core` | `background` | `rgba(255,255,255,0.88)` | `rgba(50,65,85,0.88)` |
| `.status-dock-grid` | `background` | warm cream gradient | dark navy gradient |
| `.hud-distance-chip` | `background` | `#1f2d40 → #111c2b` | `#0f1820 → #080d14` |
| `.shortcut-close` | `background` | `rgba(255,255,255,0.72)` | `rgba(35,45,60,0.72)` |
| `.mobile-screen-notice` | `background` | `#eef2f7 → #dce5ef` | `#151b24 → #0f141c` |
| `.mobile-screen-notice-card` | `background` | `rgba(255,255,255,0.95)` | `rgba(25,32,45,0.95)` |

---

## 6. Three.js Scene Colours (`app.js`)

### 6.1 Default Initialisation

| Property | Light value | Dark value |
|---|---|---|
| `scene.background` | `#dfe8f4` | `#1a2230` |
| `ambientLight` colour / intensity | `0xffffff` / `0.68` | `0xffffff` / `0.35` |
| `keyLight` colour / intensity | `0xffffff` / `1.38` | `0xffffff` / `0.9` |
| `fillLight` colour / intensity | `0xd5e8ff` / `0.47` | `0x8ba8cc` / `0.3` |
| `hemiLight` sky / ground / intensity | `0xffffff` / `0xdcecff` / `0.58` | `0x8899b0` / `0x1a2230` / `0.35` |
| `roomMaterial.color` | `#f5f8fd` | `#1e2a3a` |
| Support bar colour | `#445166` | `#3a4a60` |

### 6.2 Lighting Presets

Each preset was remapped to maintain relative warmth/coolness while keeping overall brightness low.

#### Optometrist (Default)

| Property | Light | Dark |
|---|---|---|
| Ambient colour / intensity | `#ffffff` / `0.68` | `#c0ccdd` / `0.35` |
| Key colour / intensity | `#ffffff` / `1.38` | `#ffffff` / `0.9` |
| Fill colour / intensity | `#d5e8ff` / `0.47` | `#8ba8cc` / `0.3` |
| Hemi sky / ground / intensity | `#ffffff` / `#dfecff` / `0.58` | `#8899b0` / `#1a2230` / `0.35` |
| Room | `#f5f8fd` | `#1e2a3a` |
| Background | `#dfe8f4` | `#1a2230` |

#### Warm Room

| Property | Light | Dark |
|---|---|---|
| Ambient | `#ffe8c8` / `0.6` | `#a07850` / `0.32` |
| Key | `#ffc176` / `1.17` | `#cc8844` / `0.75` |
| Fill | `#ffdcb4` / `0.37` | `#996644` / `0.25` |
| Hemi | `#fff0dc` / `#ffe6cc` / `0.5` | `#99774d` / `#1a1408` / `0.3` |
| Room | `#fbf0e4` | `#2a2018` |
| Background | `#eadbcd` | `#1e1810` |

#### Cool Office

| Property | Light | Dark |
|---|---|---|
| Ambient | `#e2edff` / `0.62` | `#8899cc` / `0.34` |
| Key | `#b8d1ff` / `1.24` | `#7090cc` / `0.8` |
| Fill | `#cde8ff` / `0.43` | `#7798bb` / `0.28` |
| Hemi | `#f1f7ff` / `#dceaff` / `0.52` | `#8899bb` / `#182030` / `0.32` |
| Room | `#f1f5fb` | `#1a2438` |
| Background | `#d3dfea` | `#151e2c` |

#### Dim Exam Room

| Property | Light | Dark |
|---|---|---|
| Ambient | `#dbe5ef` / `0.5` | `#8090a8` / `0.28` |
| Key | `#f2fff2` / `0.95` | `#99bb99` / `0.6` |
| Fill | `#bfd4ff` / `0.32` | `#6680aa` / `0.2` |
| Hemi | `#f0f5fb` / `#d3deed` / `0.45` | `#7888a0` / `#141c28` / `0.25` |
| Room | `#e8edf4` | `#182030` |
| Background | `#c8d1de` | `#121820` |

---

## 7. Test Changes

| File | Change |
|---|---|
| `tests/ui/layout.spec.js` | Stabilisation background updated from `#c9d0db` to `#12171f` to match new body colour |

> **Note:** Visual-regression snapshot baselines will need to be regenerated with `npm run test:ui:update` after merging this change.

---

## 8. Design Principles Applied

1. **Contrast ratios ≥ 4.5:1** — All text tokens (`--ink-strong`, `--ink`, `--ink-muted`) have been brightened to meet WCAG 2.2 AA against the darkened panel backgrounds.
2. **Preserve relative hierarchy** — Shadows are deeper, borders are subtler, and surface layering (panel → panel-strong → panel-soft) follows the same gradient direction but in dark tones.
3. **Accent brightness boost** — `--accent` and `--copper` were lightened so that interactive elements remain immediately recognisable.
4. **Backdrop-filter preservation** — Blur and saturation values on glassmorphism surfaces are unchanged; only the underlying fill colours shifted.
5. **3D scene coherence** — Lighting intensities were reduced ~40-55% across all presets so the Snellen chart remains readable against the dark room walls without appearing washed out.

---

## 9. Extending the Dark Mode

If a future toggle is desired:

1. Move the current `:root` dark tokens into a `[data-bs-theme="dark"]` selector.
2. Restore the original light tokens under `:root` (or `[data-bs-theme="light"]`).
3. Add a toggle button in the topbar that flips `document.body.dataset.bsTheme`.
4. Gate the `app.js` lighting presets behind the same attribute (read `document.body.dataset.bsTheme` inside `applyLightingPreset`).
5. Persist the preference in `localStorage`.

---

*End of specification.*
