# Promo video

The demo at the top of the main README is rendered from this folder. It is a
React composition that runs the real `WorkflowViewer` from `../src`, so a new
recording always shows the current version of the library.

## Render

Requirements: Node 18+, Google Chrome (or set `CHROME_PATH`) and `ffmpeg`.
React, Vite and the library's own dependencies come from the repository root,
so install those first.

```bash
yarn install          # at the repository root
cd promo
npm install
npm run record        # about 5 minutes
```

This writes:

- `../assets/asl-viewer-promo.mp4`: the video, 1920×1080 at 60 fps
- `../assets/asl-viewer-demo.gif`: the README GIF

Other options:

```bash
node record.mjs --fps 30                   # faster render
node record.mjs --from 12 --to 18          # part of the timeline, in out/
node record.mjs --stills 0.5 --no-build    # a PNG every 0.5 s in out/stills
npm run dev                                # play it in the browser (real time)
```

## How it works

- `virtual-time.js` is injected before the page loads. Timers,
  `requestAnimationFrame`, `performance.now()` and every CSS / Web Animation
  follow a virtual clock that only moves when the recorder asks for the next
  frame, so every frame is rendered at an exact time.
- `src/Promo.tsx` holds the timeline: captions, camera moves on the app
  windows, and the simulated input (clicks, typing, mouse wheel) sent to the
  real components.
- `record.mjs` builds the page with Vite, steps through the timeline in
  headless Chrome and pipes the screenshots to ffmpeg.
