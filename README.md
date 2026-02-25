# Glasses Distance Poster Viewer

A lightweight 3D web app that simulates viewing a distant poster through configurable virtual glasses.

## Features

- Distance control from **1 ft** to **20 m**
- Toggle glasses filter on/off (direct image vs filtered view)
- Per-lens controls (Left/Right): **SPH**, **CYL**, **Axis**
- Poster presets:
  - Snellen Chart
  - Classic Hot Air Balloon
  - Horizontal Lines
  - Vertical Lines
- Fixed poster dimensions: **1m × 5m**
- Lighting/room presets with **Optometrist View** as default

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

- HTML + CSS + JavaScript
- Three.js (ES modules via CDN)
- Custom post-processing shader for the virtual glasses effect
