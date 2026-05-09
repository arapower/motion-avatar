# Work In Progress

## Goal

`motion-avatar` is a browser-only camera-to-3D motion capture tool that maps camera input to a VRM avatar in real time.

Current product goals:
- Run entirely on the frontend with no application server.
- Load and render a VRM avatar in the browser.
- Reflect camera-tracked motion to the avatar with capture modes for face, upper body, and full body.
- Keep avatar motion visually aligned with the camera preview direction.
- Ship as a standalone repo and integrate into the `showcase` deployment flow.

## Current Status

Implemented and already in the repository:
- Vite + TypeScript app with Three.js and `@pixiv/three-vrm`.
- MediaPipe FaceLandmarker integration for head rotation, blink, and mouth open/close.
- MediaPipe PoseLandmarker integration for upper-body and full-body modes.
- MediaPipe HandLandmarker integration for finger curl tracking.
- Capture range selector:
  - `face`
  - `upper-body`
  - `full-body`
- Local VRM file loading and bundled default sample model.
- Showcase integration work has already been prepared in earlier commits/branches.

Recent completed work:
- Face direction was adjusted and is considered good enough for now.
- Hand visibility was improved by combining finger curl with hand orientation.
- The realtime panel wording was clarified to indicate that it currently shows facial tracking values.

Latest local checkpoint at the time of pause:
- `8a4c5fe` `fix: align face pose and hand tracking`

## Verified State

Last verified commands:

```bash
npm test
npm run build
```

Status at pause:
- Unit tests passed.
- Build passed.
- `npm run dev` was usable for manual verification.

## What Still Needs Work

The next focus is **upper-body adjustment**.

Primary unfinished work:
- Improve shoulder, upper-arm, and forearm alignment so the avatar moves in the same apparent direction as the preview.
- Recheck arm forward/back motion in `upper-body` mode.
- Revisit wrist and hand orientation if finger motion still feels disconnected.
- Confirm that `full-body` mode still behaves reasonably after upper-body changes.

Secondary follow-up items:
- Consider exposing additional realtime diagnostics for body/hand tracking if needed.
- Recheck whether the current hand mapping should include more wrist rotation or palm normal handling.
- Manually verify behavior with more than one VRM model, not only the bundled sample.

## Recommended Resume Plan

1. Run the app locally and verify current behavior.
2. Tune upper-body mapping before changing any UI.
3. Re-run tests and build after each motion-mapping change.
4. Commit upper-body fixes separately from any later UI or deployment tweaks.

Suggested local commands:

```bash
npm install
npm run dev
npm test
npm run build
```

## Important Files

Main runtime and mapping logic:
- `src/main.ts`
- `src/scene.ts`
- `src/landmark-mapper.ts`
- `src/pose-mapper.ts`
- `src/hand-mapper.ts`
- `src/face-tracker.ts`
- `src/pose-tracker.ts`
- `src/hand-tracker.ts`

UI:
- `index.html`
- `src/style.css`

Tests:
- `tests/unit/landmark-mapper.test.ts`
- `tests/unit/pose-mapper.test.ts`
- `tests/unit/hand-mapper.test.ts`

## Notes Useful For Resuming

- The current realtime values in the side panel are facial values only:
  - left blink
  - right blink
  - mouth open
- Hand tracking is already implemented; if it appears weak, the issue is likely mapping quality rather than missing integration.
- Capture range changes are handled in `src/main.ts` and camera framing presets are in `src/scene.ts`.
- The repo already has `main`, `staging`, and `production` branches for deployment flow.
- The bundled sample VRM is stored at `public/models/AvatarSample_A.vrm` and is currently the default startup model.

## Pause Summary

At this pause point, the project is in a working state with face, pose, and hand tracking integrated, and the next meaningful engineering task is improving upper-body motion quality.
