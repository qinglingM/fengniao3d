# Study 09 · Mechanical hummingbird

An interactive mechanical concept specimen that works offline. Open `dist/index.html` in a browser, or run the local preview.

## Features

- Procedural 3D hummingbird with an open ribbed frame, a 48/12-tooth reduction pair, a slider-crank, paired wing-root racks, individual wing vanes, a tail and an optical sensor.
- One crank phase drives every moving part, gauge, chart and linkage diagram. Pause or scrub the phase to inspect each step.
- Wingbeat frequency from 6 to 42 Hz, four playback speeds, shell x-ray, part labels, progressive explosion and five camera views.
- Assembly, drive, wings, frame and tail isolation.
- A 34-second automatic tour. Any pointer, scroll or key input hands control to the visitor; 25 seconds without input restores the tour.
- Automatic quality reduction, manual quality control and support for reduced motion preferences.
- Responsive desktop and phone layouts. No external images, fonts or runtime network dependencies.

## Local preview

```sh
npm install --ignore-scripts
npm run build
npm run dev
```

Open http://127.0.0.1:4173 . `npm test` checks linkage closure, stroke, periodicity, analytical velocity, wing-tip symmetry and floor clearance throughout a full cycle.

Shortcuts: Space pauses or resumes, H toggles the panels, R resets. Drag to orbit and scroll to zoom. On a touch screen, use one finger to orbit and two fingers to zoom.

## Concept model

All parameters are original design assumptions, identified as such on the page and in the About dialog. They do not establish manufacturing feasibility, aerodynamic efficiency, lift or endurance.

Crank radius r=3.8 mm, connecting rod L=18 mm, wing-root gear pitch radius R=4.5 mm.

```
slider(θ) = r cosθ + √(L² − r² sin²θ)
flap(θ) = (slider(θ) − L) / R
feather(θ) = 28° sin(θ + π/2)
```

The stroke is 2r=7.6 mm. The flap sweep is 2r/R=1.6889 rad≈96.77°. At the default 28 Hz wingbeat frequency, a 4:1 reduction corresponds to a motor speed of 6,720 rpm. The nominal fully extended span is 2×(12+98)=220 mm. Feathering uses an analytical cam approximation. Cam contact, backlash, structural flexibility and aerodynamics are not simulated.

## Frame capture and review

`window.study.renderAt(t)` renders a deterministic tour frame. `resume()` restores real-time operation.

For example, `/?frame=18&phase=90` shows an exploded frame. `frame` is measured in seconds and `phase` in degrees. The optional `view`, `system` and `explode` parameters select review states. Normal visitors do not need these parameters.

Local review screenshots and interaction records, when generated, are kept in `artifacts/` and excluded from version control.

## Article workflow

1. Read the teardown skill and dependency declaration, adapting its model and review principles to Codex. The third-party skill was not globally installed or executed.
2. The user authorized an original mechanical hummingbird concept without a specified real-world reference.
3–7. The shared model, console, styling, review and visitor interaction are implemented.
8. Deterministic capture is available; a scored video has not been exported.
9. The standalone HTML is under 1 MB. Public deployment is awaiting user confirmation.

## Sources

- [Elvar — How I Turn Any Machine Into a 3D Simulator You Can Take Apart](https://x.com/elvar_official/status/2116174609355571402).
- [teardown workflow](https://github.com/elvarofficial/teardown/blob/main/SKILL.md), MIT. Its model and source code were not copied.
- [Three.js](https://threejs.org/), MIT. The minified bundle retains upstream license notices.
