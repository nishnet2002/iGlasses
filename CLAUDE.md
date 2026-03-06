# Glasses project — Claude Code guide

## Project type
Static Three.js frontend app. No build step. Deployed to GitHub Pages.

## Files of record
| File | Owner |
|---|---|
| `app.js` | Dwight |
| `styles.css` | Angela |
| `index.html` | Angela (markup/copy/aria), Dwight (script wiring only) |
| `.github/workflows/deploy-pages.yml` | Dwight |

## Tech stack
- Vanilla HTML + CSS + JavaScript
- Three.js via CDN: `https://unpkg.com/three@0.164.1/build/three.module.js`
- Local server: `npx http-server . -p 5500 -c-1`
- Deploy: GitHub Actions → GitHub Pages

## Agent team setup
Agent teams are enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).
Mode: in-process (Windows compatible).

### Agents
- **Micheal** — Team Lead. Spawns Angela and Dwight. Coordinates tasks, approves plans, synthesizes results. Does not write code.
- **Angela** — UI/UX Designer + Researcher. Owns `styles.css` and `index.html`. Handles layout, accessibility, visual quality, and copy.
- **Dwight** — FullStack Developer + DevOps. Owns `app.js` and CI/CD. Handles Three.js, shader logic, events, state, and GitHub Pages deployment.

### Typical invocations
Use **Micheal** as the entry point for team tasks:
```
Use Micheal to do a full UI and code review of the app, then propose improvements.
```
```
Use Micheal to implement a new poster type. Have Angela and Dwight work in parallel.
```
```
Use Micheal to investigate a rendering bug. Spawn both teammates to test competing hypotheses.
```

## File conflict rule
Never let Angela and Dwight edit the same file at the same time. Micheal enforces this.

## Quality bar
- Accessibility: WCAG 2.2 AA for UI surfaces
- Responsive: `styles.css` breakpoints at 980px, 760px, 900px
- Rendering: no regressions to existing blur/distortion shader
- Deploy: GitHub Pages compatible, no server-side logic
- IDs: preserve all element `id` and `data-*` attributes used by `app.js`
