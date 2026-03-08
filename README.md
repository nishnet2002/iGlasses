#  👓 World view of a Spectic

A lightweight 3D web app that simulates viewing a distant poster through configurable virtual glasses.

This repository now also includes a minimal Electron shell for packaging the simulator as an offline Windows desktop app.

## Features

- Immersive single-screen UI built for desktop and large screens
- Refined top-bar actions for **Controls**, **Help**, and **Reset**
- Gradient **Current view** control card with:
  - Glasses filter toggle
  - Distance slider
  - Poster segmented controls
  - Room segmented controls
- Floating **Left Lens** and **Right Lens** HUD cards with:
  - direct **SPH** and **CYL** step controls
  - secondary **AXIS** dial control
  - stable signed value chips to avoid layout shift during value changes
- Center distance chip with live meter/feet readout
- Shortcut guide modal for interaction help
- Poster presets:
  - Snellen Chart
  - Classic Hot Air Balloon
  - Horizontal Lines
  - Vertical Lines
- Room presets:
  - Optometrist View
  - Warm Room
  - Cool Office
  - Dim Exam Room
- Mouse interactions:
  - Drag to move poster
  - Shift + Drag or Right-drag to zoom distance
- Fine adjustment modifier:
  - Hold **Alt** while clicking lens buttons for smaller step changes
- Fixed poster dimensions: **1m × 5m**
- Brightened lighting model for all room presets

## Run locally

Install dependencies first:

```bash
npm install
```

### Option A: VS Code task (one-click)

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: **Tasks: Run Task**
3. Choose: **Run Static Server (Glasses)**
4. Open: `http://localhost:5500`

### Option B: Command line

```bash
npm run start:web
```

Then open:

- `http://localhost:5500`

If port `5500` is busy, use another port (for example `5501`).

### Local production deploy

Build the production bundle and serve `dist/web` locally:

```bash
npm run deploy:local
```

Then open:

- `http://localhost:4173`

### VS Code one-click task

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: **Tasks: Run Build Task**
3. Choose: **Deploy Local Production Build (Glasses)**

That task builds the production site and starts a local server for the generated `dist/web` output.

### Desktop app

Launch the Electron desktop shell:

```bash
npm run start:desktop
```

Launch Electron against the local web server for wrapper-only debugging:

```bash
npm run start:desktop:web
```

Build the Windows installer:

```bash
npm run dist:win
```

Validate required desktop build inputs:

```bash
npm run validate:build
```

### In-app controls

- Open **Controls** to access the main current-view panel
- Use the **Current view** card for:
  - filter toggle
  - poster switching
  - room switching
  - distance adjustments
- Use the left and right HUD cards to adjust **SPH** and **CYL** directly
- Drag each lens **AXIS** dial to set angular axis
- Open **Help** for the shortcut guide
- Use **Reset** to restore the default simulation state
- Drag in the viewport to move the poster
- Hold `Shift` and drag, or right-drag, to zoom distance
- Hold `Alt` while pressing `SPH/CYL +/-` for finer control
- Press `?` to open the quick controls overlay
- Press `Esc` to close the shortcut overlay or drawer

## Deploy on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

The workflow installs dependencies, localizes frontend assets, builds `dist/web`, and deploys that folder to GitHub Pages.
The production build injects a cache-busting build id into the CSS and JS URLs so GitHub Pages updates are less likely to serve stale frontend assets after a deploy.

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

## Desktop release automation

The Windows desktop pipeline lives at `.github/workflows/build-windows-release.yml`.

- Push a tag like `v0.1.0` to build the Windows installer automatically
- The workflow creates or updates the matching GitHub Release
- The built `.exe` installer is attached to that release

## Tech stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (no framework)
- **UI helpers**: Bootstrap 5 loaded from local packaged assets
- **3D Engine**: Three.js loaded from local packaged assets
- **Shaders**: Custom post-processing shader for virtual glasses effect
- **Desktop shell**: Electron
- **Packaging**: electron-builder
- **Design System**: Custom CSS design tokens and immersive overlay styling
  - gradient glass panels
  - CSS custom properties for theming
  - smooth transitions and micro-interactions
- **Deployment**: GitHub Actions → GitHub Pages and GitHub Releases
