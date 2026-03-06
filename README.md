# World view of a Spectic

A lightweight 3D web app that simulates viewing a distant poster through configurable virtual glasses.

## Features

- Immersive-first single-screen UI (no separate classic page)
- Unified left control drawer for view and scene adjustments
- Floating **Left Lens** and **Right Lens** cards with direct controls:
  - SPH +/-
  - CYL +/-
  - Radial AXIS dial (angular control)
- Distance control from **1 ft** to **20 m**
- Glasses filter toggle (on/off)
- Drawer menu for scene controls:
  - Poster preset (Snellen, Hot Air Balloon, Horizontal Lines, Vertical Lines)
  - Room preset (Optometrist, Warm Room, Cool Office, Dim Exam Room)
- Shortcut overlay available with **?** and dismissible with **Esc**
- Mouse interactions:
  - Drag to move poster
  - Shift+Drag or Right-drag to zoom distance
- Fine adjustment modifier:
  - Hold **Alt** while clicking lens buttons for smaller step changes
- Fixed poster dimensions: **1m × 5m**
- Brightened lighting model for all room presets

## Run locally

### Option A: VS Code task (one-click)

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: **Tasks: Run Task**
3. Choose: **Run Static Server (Glasses)**
4. Open: `http://localhost:5500`

### Option B: Command line

```bash
npx --yes http-server . -p 5500 -c-1
```

Then open:

- `http://localhost:5500`

If port `5500` is busy, use another port (for example `5501`).

### In-app controls

- Open **Menu** for poster, room, filter toggle, and distance slider
- Use left and right lens cards to adjust SPH/CYL directly
- Drag each lens AXIS dial to set angular axis
- Drag in viewport to move poster
- Hold `Shift` and drag (or right-drag) to zoom distance
- Hold `Alt` while pressing `SPH/CYL +/-` for finer control
- Press `?` to open the quick controls overlay
- Press `Esc` to close the shortcut overlay or drawer

## Deploy on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

### 1) Create a new GitHub repository

Create an empty repository on GitHub (for example: `glasses-distance-viewer`).

### 2) Push this project

Run these commands in this folder:

```bash
git add .
git commit -m "Initial app setup"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 3) Enable GitHub Pages

1. Open your repo on GitHub
2. Go to **Settings → Pages**
3. Under **Build and deployment**, choose **Source: GitHub Actions**

After the workflow finishes, your site is published at:

- `https://<your-username>.github.io/<your-repo>/`

## Tech stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (no framework)
- **3D Engine**: Three.js (ES modules via CDN)
- **Shaders**: Custom post-processing shader for virtual glasses effect
- **Design System**: Custom CSS design tokens with modern 2026 standards
  - Glass morphism effects (backdrop-filter)
  - CSS custom properties for theming
  - Inter font via Google Fonts
  - Smooth transitions and micro-interactions
- **Deployment**: GitHub Actions → GitHub Pages (static hosting)
