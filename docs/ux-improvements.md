# UX Rewrite Brief

Last updated: 2026-03-09

This document is refreshed by `npm run test:ui` after the Playwright UI regression suite completes.
It captures the current rewrite direction so the visual regression baselines and UX guidance stay aligned.

## Product Intent

The app is a desktop-first optometry simulator.
Users should be able to:

- view a distant poster through a simulated prescription blur filter
- compare left and right lens values independently
- change poster type, room lighting, and viewing distance
- manipulate the scene directly with drag, shift-drag, and axis dials

The core product value is not raw settings density.
It is fast visual feedback while tuning a small set of clinical-style controls.

## Current UI Audit

The current interface already establishes the right product model:

- full-screen immersive viewport
- controls separated from the simulation canvas
- left and right lens controls anchored near the edges
- a dedicated drawer for scene-level settings
- a small help overlay for shortcuts

The main friction points were:

- lens cards felt visually similar enough that active focus was easy to lose
- the drawer grouped many related controls, but the hierarchy was still shallow
- the overall UI leaned toward "generic dark overlay" instead of "precision instrument"
- state summaries existed, but not in one strong glanceable location
- helper text was present, but key gestures still depended on memory

## Rewrite Goals

- keep the immersive single-screen simulator model
- preserve the existing control vocabulary so the app still feels familiar
- increase visual hierarchy and scan speed
- make left/right editing state obvious
- make scene state readable without opening the drawer
- keep the experience desktop-first and stable for Electron packaging

## New Design Direction

The rewritten UI uses an "optical console" system:

- light frosted instrument panels over the live viewport
- deep navy text with copper and blue accents
- slab-like cards with stronger edges and calmer shadows
- compact uppercase labels for clinical controls
- one bottom status dock for the current scene state

This direction was chosen to keep the app feeling technical and intentional without looking like a dashboard template.

## Layout Model

### 1. Command bar

Top-left brand and global actions:

- Controls
- Help
- Reset

This remains small so the viewport stays primary.

### 2. Scene drawer

The drawer now acts as the "exam setup" panel:

- session status
- filter toggle
- distance control
- poster preset choices
- room preset choices
- shortcut access
- interaction reminders

### 3. Lens instrument cards

Left and right lens cards remain floating at the edges, but now behave more like dedicated instruments:

- stronger eye identity markers
- clearer SPH / CYL / AXIS grouping
- obvious active state
- better numeric emphasis

### 4. Status dock

Bottom-center dock provides persistent summary:

- current poster
- current room
- current distance

This reduces the need to reopen the drawer just to confirm scene state.

## Interaction Rules

- keep existing ids and control labels where possible to avoid breaking simulator logic
- maintain 44px minimum touch/click targets
- preserve keyboard access for axis dials and modal dismissal
- preserve direct-manipulation interactions in the viewport
- keep contrast high enough against both bright and dim room presets

## Accessibility Requirements

- visible focus states on all interactive controls
- icon-only controls must keep accessible names
- modal and drawer remain dismissible with Escape
- the active lens card should be visible through border, glow, and header state
- helper copy should support discovery without blocking expert use

## Implementation Notes

- keep the app in vanilla HTML, CSS, and JavaScript
- keep Bootstrap only as a behavior helper for offcanvas and modal primitives
- do not rewrite the Three.js simulator unless a UI dependency requires it
- prefer structural UI changes in HTML/CSS and minimal compatibility patches in JS

## Follow-up Checks

After the rewrite, validate:

- drawer and modal still open and close correctly
- lens step buttons still update left and right state
- axis dials remain keyboard-accessible
- bottom summary updates with poster, room, and distance changes
- visual regression snapshots are refreshed to match the new shell
