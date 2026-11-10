# OCTO / 08 · Mechanical octopus

An original, offline interactive mechanical octopus, developed from the earlier hummingbird study. The current experience is designed and reviewed for desktop.

## Structure

- Eight independently phased arms with ten nested joints each.
- Twin rows of suction cups: four cups per segment, 320 total.
- Tapered ceramic link covers, metal axles, bearing rings, telescoping rods and copper conduits.
- Eight separate pressure-hull petals surrounding a four-level rotating gear stack, central turbine and eight pump cartridges.
- Three illuminated optical pods, a lower distribution manifold and structural cage.
- Progressive explosion, transparent hull, five camera views and subsystem isolation.
- Pause, phase scrubbing, frequency and playback controls, and a 34-second automatic tour.

## Run

```sh
npm install --ignore-scripts
npm run build
npm run dev
```

Default address: http://127.0.0.1:4173. Set `STUDY_PORT=4174 npm run dev` when that port is occupied. The server serves the built file; run `npm run build` after source edits.

`dist/index.html` also works offline without a server. All geometry is procedural; no external runtime assets are required.

Space pauses or resumes, H toggles the panels, R resets. Drag to orbit; scroll to zoom. Any input stops the tour; 25 seconds of inactivity restarts it.

## Motion model

For arm index a=0…7 and joint j=0…9:

```
wave = phase − a·π/4 − j·0.48
bend = (j=0 ? −0.38 : 0.12) + sin(wave)·(0.12 + j·0.012)
sway = sin(wave + 0.8)·0.055
```

Angles are in radians. Nested transforms propagate motion down each arm. The graph shows arm 01's root and sixth joint using the same solver as the geometry.

The separate pump diagram is an ideal slider-crank reference (r=3.8 mm, L=18 mm, 4:1 drive ratio), not an arm-actuation solver. All values are conceptual. Fluid dynamics, pressure, suction, contact, collisions between arms, loads and manufacturability are not simulated.

Repeated arm hardware is instanced across the eight chains; static core hardware is merged by material. Automatic quality reduction and reduced-motion support remain available.

## Verification and capture

`npm test` checks pump linkage closure, analytical velocity, arm periodicity, eight-arm/80-joint topology, finite geometry, floor clearance and subsystem visibility.

`window.study.renderAt(t, overrides)` renders a deterministic tour frame. `window.study.resume()` restores the animation loop. For example, `/?frame=0` shows the assembly and `/?frame=18` shows the exploded assembly. Optional query parameters: `phase`, `view`, `system`, `explode`.

Subsystem keys: `all`, `drive`, `arms`, `hull`, `manifold`.

## Sources

- Original study workflow inspired by [Elvar — How I Turn Any Machine Into a 3D Simulator You Can Take Apart](https://x.com/elvar_official/status/2116174609355571402) and the MIT [teardown workflow](https://github.com/elvarofficial/teardown/blob/main/SKILL.md).
- Rendering: [Three.js](https://threejs.org/), MIT. Upstream license notices remain in the built bundle.
