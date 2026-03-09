# Framework Migration Path

## Purpose

This document defines a migration path from the current static HTML/CSS/JavaScript app to a higher-level UI framework.

The goal is not to "wrap the existing app in React" or add a framework as a thin layer over the current DOM code.
The goal is to reshape the app so that:

- UI state is owned by the framework
- layout is composed from reusable components
- dialogs, drawers, and floating panels are built on framework-native primitives
- the Three.js simulator becomes an isolated rendering module
- build, test, and packaging workflows are aligned with the framework instead of working around it

The end state should use the framework's inherent strengths:

- declarative rendering
- component composition
- predictable state flow
- reusable hooks/composables
- testable UI behavior
- framework-aware build tooling

## Current State

The current app is a desktop-first simulator built with:

- static [index.html](/c:/Users/Nishit/Desktop/repo/Glasses/index.html)
- custom [styles.css](/c:/Users/Nishit/Desktop/repo/Glasses/styles.css)
- a single imperative [app.js](/c:/Users/Nishit/Desktop/repo/Glasses/app.js)
- Bootstrap behavior primitives loaded from local files
- Three.js rendering logic mixed into the same runtime file as UI behavior
- custom static build copy logic in [scripts/build-web.mjs](/c:/Users/Nishit/Desktop/repo/Glasses/scripts/build-web.mjs)
- Electron loading either the static file or a dev server from [electron/main.js](/c:/Users/Nishit/Desktop/repo/Glasses/electron/main.js)

This structure is workable for a small app, but it creates several scaling problems:

- DOM references and app state are tightly coupled
- modal, drawer, HUD, and simulator logic live in one file
- component reuse is mostly visual, not structural
- behavior is tested primarily through end-to-end snapshots
- Bootstrap is used as a primitive layer, but the app-level component system is custom and page-specific

## Why Migrate

The migration is justified if the product is expected to grow into:

- more panels and settings
- persistent user preferences
- richer onboarding/help flows
- reusable UI components
- multiple screens or views
- stronger testability beyond snapshots

The migration is not primarily about trends.
It is about replacing ad hoc imperative UI code with a system that is easier to reason about, extend, and standardize.

## Recommended Target

## Framework Choice

Recommended target: **React + TypeScript + Vite**

Reasoning:

- React is well suited for component-driven UI shells around a retained-mode graphics surface like Three.js
- Vite gives a fast local dev server and clean production build output
- React has a mature ecosystem for testing, accessibility primitives, and Electron integration
- TypeScript will pay for itself once state, presets, and UI components are split into modules

Alternative acceptable targets:

- **Vue 3 + TypeScript + Vite**
  - strong if you prefer SFCs and built-in reactivity
- **SvelteKit / Svelte + Vite**
  - strong for compact syntax and simple reactivity

Do not target:

- a framework while keeping UI state mostly in direct DOM queries
- a framework plus Bootstrap JS instances as the long-term modal/drawer control plane
- a framework migration without TypeScript

## Why React Specifically Here

React fits this app well because the app naturally decomposes into:

- application shell
- control drawer
- lens control cards
- status dock
- shortcut dialog
- simulator viewport bridge

Each of those can become a component.
The current imperative code already has these conceptual boundaries, but they are not yet formalized in the codebase.

## End-State Architecture

The intended architecture after migration:

### 1. App Shell Layer

Owns:

- global layout
- shell open/close state
- focus and accessibility flow
- responsive mode changes
- top-level keyboard shortcuts

Representative components:

- `AppShell`
- `TopBar`
- `ControlDrawer`
- `ShortcutDialog`
- `StatusDock`

### 2. Domain State Layer

Owns:

- prescription values
- active lens metadata
- poster type
- lighting preset
- distance
- interaction mode
- derived labels and summaries

Representative modules:

- `simulationState.ts`
- `prescription.ts`
- `sceneState.ts`
- `uiState.ts`

Possible state tools:

- start with React Context + reducer
- move to Zustand only if state fan-out or event orchestration becomes awkward

### 3. Simulator Bridge Layer

Owns:

- Three.js scene lifecycle
- renderer creation
- camera
- lighting setup
- poster textures
- pointer drag handling for the scene
- shader uniform updates

Representative modules:

- `SimulatorViewport`
- `createSimulatorEngine`
- `posterTextureFactory`
- `lightingPresets`

Critical rule:

- React should not directly recreate the Three.js scene on ordinary UI updates
- the simulator engine should expose a controlled imperative API
- the React side should send intentional state updates into that engine

### 4. Design System Layer

Owns:

- tokens
- spacing scale
- typography scale
- color roles
- radius/shadow/motion rules
- reusable panel/button/card/dialog components

Representative modules:

- `theme/tokens.css`
- `components/ui/Button.tsx`
- `components/ui/Panel.tsx`
- `components/ui/Dialog.tsx`
- `components/ui/SegmentedControl.tsx`

## Migration Principles

These principles should govern the entire migration:

### Principle 1: Separate simulator logic from UI logic before chasing perfect componentization

Today, [app.js](/c:/Users/Nishit/Desktop/repo/Glasses/app.js) owns both.
That is the largest structural risk.
The migration should first expose simulator operations as explicit functions and state inputs.

### Principle 2: Migrate behavior by slice, not by file type

Do not do this:

- first convert all HTML to JSX
- then later decide what state belongs where

Do this instead:

- identify a feature slice
- define its data model
- define its UI ownership
- build it as a framework-native component

### Principle 3: Preserve behavior contracts during each phase

Examples:

- `Esc` closes dialog/drawer
- `?` opens shortcut dialog
- axis dial remains keyboard-accessible
- distance slider still updates the scene
- Electron still loads a functional web entry

### Principle 4: Prefer framework-native primitives over Bootstrap JS

Bootstrap may remain temporarily for CSS or transitional layout help.
But the long-term target should be framework-controlled primitives, for example:

- React Aria / Radix / Headless UI style patterns
- or custom accessible primitives owned in the repo

The point is:

- component state should be controlled by the framework
- not by external DOM-driven instances

### Principle 5: Do not migrate visual debt unchanged

The migration is an opportunity to standardize:

- sizing
- component hierarchy
- layout contracts
- panel behavior
- typography
- token naming

## Proposed Stack

Recommended target stack:

- React
- TypeScript
- Vite
- React Testing Library
- Playwright
- CSS Modules or a clear token-first global CSS strategy
- optional Zustand for domain state if reducer/context becomes awkward

Deliberate non-recommendations for this repo:

- Next.js
  - unnecessary if this remains a desktop/static app
- Tailwind as the first migration step
  - it would add a second migration axis at the same time as framework migration
- introducing both a framework and a third-party component mega-library immediately
  - that usually obscures ownership decisions

## Migration Options

There are three realistic approaches.

### Option A: Big-bang rewrite

Replace the current web app with a new framework app in one branch.

Pros:

- clean architecture from day one
- avoids temporary dual-runtime complexity

Cons:

- highest regression risk
- long-running branch
- difficult review surface
- can stall if simulator integration becomes messy

Recommendation:

- not preferred for this repo

### Option B: Parallel app inside repo, then cut over

Create a new framework app in a subfolder, keep the current app operational, and migrate feature by feature until the new app is ready.

Pros:

- safer
- enables side-by-side validation
- lets Electron and web build switch later
- easier rollback

Cons:

- temporary duplicate infrastructure
- some shared assets/build logic need transitional handling

Recommendation:

- preferred

### Option C: Incremental framework islands in current HTML

Mount framework components into parts of the current static app.

Pros:

- small early wins

Cons:

- architecture often stays split-brain
- DOM ownership becomes unclear
- long-term cleanup cost is high

Recommendation:

- avoid as the primary strategy

## Recommended Strategy

Use **Option B: parallel app inside the repo**.

Suggested directory shape during migration:

```text
/src
  /app
  /components
  /features
  /lib
  /simulator
  /styles
  main.tsx
  App.tsx

/legacy
  index.html
  app.js
  styles.css

/electron
/scripts
/tests
```

The `legacy/` location is conceptual.
Actual movement can happen later, but the repo should reach a point where:

- legacy files are explicitly legacy
- new files are explicitly framework-native

## Phase-by-Phase Plan

## Phase 0: Planning and Baseline Capture

Objective:

- capture the current app behavior and layout contracts before migration begins

Tasks:

- document current interaction contracts
- document simulator state shape
- document keyboard shortcuts
- capture screenshots for key states
- list all DOM ids and data attributes currently used
- define minimum supported viewport sizes for desktop shell and Electron
- record Electron loading expectations

Deliverables:

- migration checklist
- UI contract list
- simulator API candidate list

Exit criteria:

- team agrees what must remain identical during early migration

## Phase 1: Introduce New Framework App Skeleton

Objective:

- add the framework without changing the production app yet

Tasks:

- add Vite + React + TypeScript
- create `src/main.tsx`
- create `src/App.tsx`
- ensure local asset strategy still works with `third_party/`
- add a minimal design-token stylesheet
- create a framework dev script alongside the legacy scripts

Representative npm scripts:

- `start:web:legacy`
- `start:web:framework`
- `build:web:framework`

Do not yet:

- switch Electron to the new app
- remove legacy files

Exit criteria:

- a new framework shell runs locally
- it can load packaged local assets

## Phase 2: Extract Domain Model From Legacy App

Objective:

- understand and formalize state before moving UI

Tasks:

- define TypeScript types for:
  - lens values
  - scene state
  - UI shell state
  - lighting presets
  - poster presets
- map current mutable `appState` into typed state
- identify derived values:
  - poster label
  - room label
  - distance summaries
  - active lens

Proposed types:

```ts
type LensId = "left" | "right";

type LensState = {
  sph: number;
  cyl: number;
  axis: number;
};

type PosterType = "snellen" | "balloon" | "hLines" | "vLines";
type LightingPreset = "optometrist" | "warmRoom" | "coolOffice" | "dimExam";

type SceneState = {
  distanceM: number;
  posterType: PosterType;
  lightingPreset: LightingPreset;
  posterPosition: { x: number; y: number };
  glassesEnabled: boolean;
  lens: Record<LensId, LensState>;
};

type ShellState = {
  drawerOpen: boolean;
  shortcutDialogOpen: boolean;
  activeLens: LensId;
};
```

Exit criteria:

- state contracts exist independently from DOM access

## Phase 3: Extract Simulator Engine API

Objective:

- create a seam between UI and Three.js

This is the most important enabling step.

Tasks:

- move Three.js initialization code into `simulator/engine.ts`
- expose an engine factory
- expose methods such as:
  - `mount(container)`
  - `dispose()`
  - `setSceneState(sceneState)`
  - `setPosterType(type)`
  - `setLightingPreset(preset)`
  - `setDistance(distanceM)`
  - `setPosterPosition(position)`
  - `setLens(lensId, lensState)`
  - `resize(width, height)`

Critical rule:

- the engine should not read from DOM-owned controls
- the engine should receive values from caller-owned state

Pseudo-API:

```ts
type SimulatorEngine = {
  mount(container: HTMLElement): void;
  dispose(): void;
  resize(width: number, height: number): void;
  update(nextState: SceneState): void;
};
```

Exit criteria:

- legacy UI can still drive the engine through the new API
- engine is testable as a module boundary

## Phase 4: Build the Framework Shell Without Full Feature Parity

Objective:

- prove the architecture with a minimal but real shell

Build these first:

- `AppShell`
- `TopBar`
- `ShortcutDialog`
- `StatusDock`
- `SimulatorViewport`

Do not initially build:

- every drawer control
- every lens interaction

Reason:

- first validate shell composition and viewport integration

Exit criteria:

- framework shell renders
- help dialog opens/closes
- simulator viewport mounts successfully
- shell state is owned entirely by framework state

## Phase 5: Migrate the Drawer

Objective:

- replace Bootstrap offcanvas state ownership with framework-native dialog/sheet ownership

Tasks:

- implement `ControlDrawer` as a framework component
- move filter toggle, distance slider, poster controls, room controls, and summaries into subcomponents
- replace direct DOM updates with controlled props
- move derived labels into selectors/helpers

Suggested component breakdown:

- `ControlDrawer`
- `CurrentViewPanel`
- `DistanceControl`
- `PosterPresetControl`
- `RoomPresetControl`
- `QuickControlsHint`

Framework-native behavior target:

- drawer open state controlled by app state
- focus sent into drawer on open
- focus returned to trigger on close
- no Bootstrap JS instance required

Exit criteria:

- drawer can be removed from legacy ownership

## Phase 6: Migrate Lens Cards

Objective:

- convert left/right HUD cards into reusable components

Suggested component shape:

```tsx
<LensCard
  lensId="left"
  value={scene.lens.left}
  active={shell.activeLens === "left"}
  onSphereStep={...}
  onCylinderStep={...}
  onAxisChange={...}
  onFocus={...}
/>
```

Subcomponents:

- `LensCard`
- `LensValueChip`
- `LensStepper`
- `AxisDial`

Important:

- `AxisDial` should become a focused, reusable input-like component
- keyboard behavior should be explicit and testable

Exit criteria:

- left/right cards are rendered from the same component
- active state is data-driven, not DOM-class-driven

## Phase 7: Migrate Shortcuts Dialog

Objective:

- replace the Bootstrap modal instance with a framework-owned dialog primitive

Tasks:

- build `ShortcutDialog`
- make open state controlled by framework state
- support close via:
  - explicit close button
  - backdrop click
  - `Esc`
  - `?` toggle rules if retained
- ensure focus trap and return focus behavior are explicit

This is one of the best early wins because it is mostly shell logic and accessibility behavior, not simulator coupling.

Exit criteria:

- legacy quick-controls modal can be deleted

## Phase 8: Migrate Interaction Orchestration

Objective:

- move keyboard and shell interaction rules out of global imperative listeners where possible

Tasks:

- define a shortcut map
- define shell-level event ownership
- ensure viewport drag logic remains attached only where required
- move app-global behaviors to framework-managed effects

Examples:

- `Esc` close hierarchy
- `?` open help
- drawer dismissal rules
- focus restoration

Exit criteria:

- shell interaction policy is explicit and component-aware

## Phase 9: Switch Electron to Framework Output

Objective:

- make the framework app the default app entry for desktop and static builds

Current Electron behavior:

- loads a static file or a URL

Target behavior:

- in dev, Electron loads Vite dev server
- in production, Electron loads built framework assets from `dist/web`

Tasks:

- update [electron/main.js](/c:/Users/Nishit/Desktop/repo/Glasses/electron/main.js) dev URL assumptions
- update [scripts/build-web.mjs](/c:/Users/Nishit/Desktop/repo/Glasses/scripts/build-web.mjs) or replace it with framework build output handling
- keep cache-busting strategy if still needed
- verify `electron-builder` file includes point at new assets

Exit criteria:

- Electron runs against the framework app in both dev and production

## Phase 10: Retire Legacy Runtime

Objective:

- remove dead files and transitional ownership

Tasks:

- delete legacy UI runtime
- remove legacy Bootstrap JS ownership where no longer needed
- shrink or eliminate legacy build copy scripts
- update README and CI scripts
- refresh Playwright baselines

Exit criteria:

- framework app is the only web runtime

## Recommended Component Model

Suggested high-level structure:

```text
src/
  app/
    App.tsx
    AppShell.tsx
    providers.tsx
  components/
    ui/
      Button.tsx
      Panel.tsx
      Dialog.tsx
      Drawer.tsx
      SegmentedControl.tsx
      ValueChip.tsx
    simulator/
      SimulatorViewport.tsx
    lens/
      LensCard.tsx
      AxisDial.tsx
      LensStepper.tsx
    controls/
      ControlDrawer.tsx
      DistanceControl.tsx
      PosterPresetControl.tsx
      RoomPresetControl.tsx
    shortcuts/
      ShortcutDialog.tsx
    status/
      StatusDock.tsx
  features/
    simulation/
      state.ts
      selectors.ts
      reducer.ts
      presets.ts
    shell/
      state.ts
      shortcuts.ts
  simulator/
    engine.ts
    scene.ts
    shaders.ts
    posterTextures.ts
    lighting.ts
  styles/
    tokens.css
    global.css
```

## Design System Strategy

The framework migration should coincide with design-system cleanup.

Standardize these first:

- typography tokens
- spacing scale
- surface roles
- focus ring styles
- z-index layers
- panel sizes
- interactive control heights

Recommended token categories:

- `--color-*`
- `--space-*`
- `--radius-*`
- `--shadow-*`
- `--font-*`
- `--motion-*`
- `--z-*`

Suggested z-layer contract:

- viewport base
- shell chrome
- floating HUD
- drawer/sheet
- modal/dialog
- transient toast

This should replace scattered numeric layering.

## Bootstrap Strategy

Bootstrap today serves as:

- modal/offcanvas primitive behavior
- some form styling

After migration, recommended path:

### Short term

- keep Bootstrap CSS if needed for baseline utility while migrating

### Medium term

- remove Bootstrap JS ownership for dialog/drawer

### Long term

- decide whether Bootstrap CSS remains useful
- if the app ends with a clean internal design system, Bootstrap can likely be removed entirely

Important:

Do not carry Bootstrap JS instance control forward as the long-term architecture.
That works against framework-native state ownership.

## State Management Recommendation

Start simple:

- React reducer + context for app state

Move to Zustand only if:

- simulator events need to update state from many surfaces
- UI state and scene state need independent subscriptions
- performance or ergonomics become awkward

Do not introduce Redux unless product complexity justifies it.

This app likely does not need that weight.

## Styling Strategy Recommendation

Recommended:

- token-first global CSS
- component-scoped class names
- minimal utility usage

Avoid combining all of these at once:

- framework migration
- Tailwind migration
- component library adoption
- design-system rewrite

Pick one dominant system.

For this repo, the safest route is:

- migrate runtime architecture first
- preserve core token names where useful
- refactor CSS structure after components exist

## Accessibility Requirements for the New App

The migration should improve accessibility rather than simply preserve it.

Required:

- focus trap for dialogs and drawers
- deterministic focus return
- visible focus ring system
- keyboard support for axis dial
- proper button semantics for lens controls
- explicit labeling for interactive controls
- modal dismissal consistency

Recommended:

- screen-reader summaries for current lens/scene state
- reduced-motion handling at component level
- role and aria contract tests

## Testing Strategy During Migration

The current app relies heavily on Playwright UI testing.
That remains useful, but the framework migration should add lower-level testing.

Target testing pyramid:

### Unit tests

For:

- selectors
- reducers
- label formatting
- preset mappings
- axis stepping behavior

### Component tests

For:

- `ShortcutDialog`
- `ControlDrawer`
- `LensCard`
- `AxisDial`
- `StatusDock`

These should verify:

- controlled props
- accessibility semantics
- close/open behavior
- keyboard behavior

### Integration tests

For:

- shell state updates simulator bridge
- simulator callbacks update UI state if needed

### Playwright tests

Keep for:

- key layout states
- Electron-adjacent flows if needed
- regression snapshots
- critical interaction paths

## Build and Tooling Migration

Current build:

- copies static files into `dist/web`

Target build:

- Vite builds framework assets into `dist/web`

Migration tasks:

- replace `build-web.mjs` copy logic with Vite build
- preserve output folder expected by deployment and Electron
- preserve `.nojekyll` behavior for GitHub Pages
- adapt cache-busting only if Vite output hashing does not already cover it

Important observation:

Vite already solves cache-busted assets through hashed output filenames.
That means the current manual query-string replacement approach should likely be retired.

## Electron Migration Notes

Electron integration should remain thin.

Target pattern:

- `start:web:framework` launches Vite dev server
- `start:desktop:web` points Electron to the Vite URL
- packaged build loads framework-generated `dist/web/index.html`

Likely updates needed in Electron packaging:

- adjust build files list
- ensure built assets are included
- verify CSP and preload constraints remain valid

Keep Electron dumb.
It should remain a shell, not absorb UI state or rendering logic.

## Risks

### Risk 1: Scene lifecycle bugs

Cause:

- React rerenders unintentionally recreate or destabilize the renderer

Mitigation:

- isolate engine in a ref-backed imperative module
- mount once, update intentionally

### Risk 2: Migration leaves hybrid ownership for too long

Cause:

- some panels controlled by React, others by DOM scripts

Mitigation:

- migrate by feature slice with clear ownership rules
- define which runtime owns which screen surface

### Risk 3: Visual regressions multiply

Cause:

- componentization changes spacing and layer behavior

Mitigation:

- preserve screenshot baselines by milestone
- define layout contracts early

### Risk 4: Team spends too long on framework bikeshedding

Cause:

- debating React vs Vue vs Svelte beyond practical differences

Mitigation:

- choose once
- optimize for maintainability and ecosystem, not novelty

### Risk 5: Framework introduced, architecture unchanged

Cause:

- UI moved to JSX but still depends on imperative DOM patterns

Mitigation:

- require removal of direct DOM-driven state ownership from migrated features

## Definition of Done for the Migration

The migration is complete when:

- the framework app is the primary web runtime
- shell state is framework-owned
- dialog and drawer behavior are framework-owned
- lens cards are reusable components
- the simulator is updated via an explicit engine API
- legacy DOM query-based runtime is removed
- Electron loads the framework build
- CI and deployment work without legacy copy-based assumptions
- Playwright tests pass against the new app
- documentation reflects the new architecture

## Concrete Milestones

Recommended milestone plan:

### Milestone 1: Framework scaffold

- Vite + React + TypeScript added
- empty shell renders

### Milestone 2: Simulator bridge

- engine extracted
- legacy UI can drive engine through explicit API

### Milestone 3: New shell

- top bar
- status dock
- shortcut dialog
- viewport host

### Milestone 4: Drawer migration

- framework-owned drawer
- scene controls migrated

### Milestone 5: Lens controls migration

- left/right lens cards
- axis dial component

### Milestone 6: Electron/build cutover

- framework build in `dist/web`
- Electron loads it

### Milestone 7: Legacy deletion

- remove old runtime
- finalize documentation

## Recommended First PR Sequence

The first several PRs should be narrow and architectural.

### PR 1

- add Vite + React + TypeScript scaffold
- no user-facing switch

### PR 2

- define typed state model
- define presets and selectors
- no UI replacement yet

### PR 3

- extract simulator engine module
- legacy UI still drives it

### PR 4

- build new shell with viewport + shortcut dialog

### PR 5

- migrate drawer

### PR 6

- migrate lens cards and axis dial

### PR 7

- switch Electron and production build

### PR 8

- remove legacy runtime

## Recommendation Summary

The right migration path is:

1. Choose React + TypeScript + Vite.
2. Build a parallel framework app inside the repo.
3. Extract simulator logic into an explicit engine API before large UI migration.
4. Rebuild shell surfaces as framework-native controlled components.
5. Replace Bootstrap JS ownership with framework-owned dialog and drawer primitives.
6. Cut Electron and production builds over only after feature parity is stable.
7. Remove the legacy runtime once ownership is clean.

This path minimizes risk while still aiming for the real prize:

- not a framework veneer
- a framework-native application architecture

## Future VR Path

This migration path can support a future VR-native direction, but only if the migration is done with platform separation in mind.

The important distinction is:

- **Vite / React** helps the app scale as a modern web and desktop UI
- **architecture separation** is what makes a later VR-native app realistic

Vite is not a VR strategy by itself.
It is a good web build tool.
The VR leverage comes from how the app is decomposed.

### What Can Carry Forward Into VR

If the migration is done correctly, these parts can later be reused or adapted for:

- WebXR prototypes
- desktop 3D immersive modes
- Quest/visionOS/native XR implementations
- Unity/Unreal/native frontends using the same product logic

Reusable layers:

- prescription and lens math
- scene-state definitions
- poster and lighting preset logic
- derived labels and formatting rules
- simulator engine contract
- interaction semantics at the product level
  - for example:
  - adjust sphere
  - adjust cylinder
  - rotate axis
  - move target
  - change viewing distance

The most important reusable outcome is a **platform-agnostic simulation core**.

### What Will Not Carry Forward Cleanly

These parts should be treated as web-shell specific:

- DOM layout
- CSS panels and overlays
- Bootstrap primitives
- browser modal/drawer interactions
- Electron shell behavior
- most current component styling

Those are implementation details of the current platform, not long-term product assets.

### Architecture Needed for VR Readiness

To keep a future VR-native path viable, the migration should enforce this split:

#### 1. Core simulation domain

Platform-agnostic.

Owns:

- lens values
- scene state
- preset definitions
- simulation rules
- validation and constraints

This should eventually be reusable from multiple frontends.

#### 2. Rendering engine interface

Platform-adaptable.

Owns:

- scene graph lifecycle
- camera/view setup
- world objects
- target positioning
- lighting application

This layer may have different implementations later:

- Three.js for web
- WebXR mode for browser immersive use
- native XR scene implementation for another platform

#### 3. Interaction adapter layer

Platform-specific.

Owns:

- mouse
- keyboard
- touch
- controller input
- gaze/pointer interaction

The product actions should remain consistent even if the device input changes.

Example:

- web today:
  - `Shift + Drag` changes distance
- VR later:
  - controller thumbstick or radial control changes distance

The device mapping changes.
The underlying action should not.

#### 4. UI shell layer

Fully platform-specific.

Owns:

- drawer
- dialog
- panel chrome
- desktop HUD
- VR wrist panel or floating world-space UI

This layer will almost certainly be rebuilt per platform.

### Recommended Long-Term Target Shape

If VR-native is a plausible future, the architecture should eventually look like this:

```text
/packages
  /simulation-core
  /render-contracts
  /preset-library

/apps
  /web-simulator
  /desktop-shell
  /xr-prototype
```

This does not need to exist immediately.
But the migration should avoid making such a split harder.

### Practical Near-Term Guidance

To preserve a future VR path, do these during the framework migration:

- move prescription math into pure functions
- move preset data into typed modules
- make scene state serializable
- define a renderer-facing engine API
- keep UI components unaware of Three.js internals
- keep Three.js internals unaware of DOM component structure

Do not do these:

- embed business logic in React components
- tie simulator behavior directly to DOM element ids
- make Bootstrap/dialog structure part of the simulation contract
- let renderer internals depend on desktop layout assumptions

### WebXR vs VR-Native

There are two different futures that are often conflated.

#### Path A: WebXR

This is the closer extension from the current stack.

Pros:

- can still use web technologies
- Three.js can participate
- easier experimentation

Cons:

- platform capabilities and performance are more constrained
- still browser-platform dependent

#### Path B: True native XR app

Examples:

- Unity-based Quest app
- Unreal-based XR app
- visionOS native experience

Pros:

- stronger immersive tooling
- more direct access to platform-native interaction models

Cons:

- current UI layer will not transfer directly
- higher product and engineering cost

The migration path in this document helps both futures only if it produces reusable non-UI core layers.

### Recommendation for This Repo

For this repo, the right strategy is:

1. Optimize the next app for framework-native web/desktop maintainability.
2. Keep the simulation core and renderer contract platform-agnostic.
3. Treat the desktop shell as one client, not the final architecture.
4. Defer any VR-native implementation decision until the core/domain boundaries are clean.

That gives you a credible future path to VR without prematurely designing the whole repo around a platform you are not building yet.

## Appendix: What Must Not Survive the Migration

These patterns should be considered temporary and should not remain in the final framework app:

- direct app-wide state ownership through DOM queries
- Bootstrap instance objects as the long-term source of truth
- mixed simulator and UI logic in the same runtime module
- shell layout defined by one page-level stylesheet without component ownership
- fragile event handling spread across many global listeners
- build scripts that manually copy and rewrite static files when the framework bundler can own asset output

The end state should use the framework because it changes the architecture, not because it changes the syntax.
