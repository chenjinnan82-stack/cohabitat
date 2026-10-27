# Animation pass — 2026-10-27

Local M1 Pro (32 GiB), in-app browser, Ollama `qwen2.5:7b`. This pass changes presentation in `art.mjs`; model prompts, candidate actions, event memory, world paths and service budgets are unchanged. No cloud calls, deployment, new dependencies or new mesh geometry.

## Motion

- Sparrows hold a glance before turning, tilt their heads, blink, shift weight, briefly ruffle feathers and flick their tails. Their gesture timing differs. Flight/landing poses blend into folded wings, grounded feet and a short body compression. Drinking uses separated sips with matching ripples.
- Snail antennae have different phases. Retraction is quick, extension gradual; the neck leads turns and the shell follows the crawl rhythm.
- Butterfly wing motion blends between flight and a slower opening/closing stretch at rest. Small bank/pitch changes do not displace its world anchor.
- Existing leaf groups move slightly within the conservative canopy approximation. This is decorative motion, not a changed light/occlusion model.

These are bounded procedural pose cycles, not model-selected social acts, emotion inference or successful interaction memories. The world remains the authority for movement and outcomes. Pausing world time freezes all acting, while the camera remains operable.

## Checks

`node check.mjs` passes. The existing assertion check now runs all four actual procedural models for 20 simulated seconds: transforms stay finite, each rendered root stays at the exact world position, animation does not mutate world state/memory, and repeated renders at a paused time retain identical poses. Existing validation, stale actions, physical recovery, occupancy, memory, persistence and budget assertions still pass. No inference calls in the check.

`motion-test.mp4` is 29.98 seconds of the existing explicitly labelled hand-authored action test. `ollama-play.mp4` is 155.42 seconds of uninterrupted real Ollama play, at normal speed, including adding water, moving the bowl and changing the view. The local browser recordings were encoded to H.264; sampled frames were inspected. No synthetic frames, scripted resident plans in live mode, or invented inference results.

## Live measurement

170 active seconds, 179 wall seconds, continuing a saved world from approximately simulation time 835. Do not call its cumulative 1,005 seconds a new ten-minute test. The raw report is `m1-pro-ollama-runtime.json`.

| Measurement | Result |
|---|---:|
| Received / accepted model plans | 36 / 35 |
| API failures | 0 |
| Model response p50 / p95 | 2,630 / 3,285 ms |
| Frame interval p50 / p95 | 16.7 / 18.6 ms |
| Maximum frame interval | 50 ms |
| Frames over 50 / 100 ms | 0 / 0 |
| Draw time p50 / p95 | 1.2 / 1.5 ms |
| Input feedback p95 | 8 ms, 9 samples |
| Sampled draw calls / triangles | 490 / 360,138 |

One returned snail watch plan was correctly rejected because its target was no longer valid. The bowl edit triggered existing safety handling for both sparrows and the snail; the event log retains target-moved/disturbance records. Browser console had no captured warnings/errors. Accepted plans are not automatically completed plans. Request timings exclude scheduler waiting and action duration. Rendering counts vary with visibility; no geometry was added, and a non-drinking ripple is now hidden.

This short check found no significant rendering regression. It does not replace a longer soak or establish production performance. Model policy was not tuned or re-evaluated for relationship learning in this pass: the inconsistent memory result from optimization 2 still stands.
