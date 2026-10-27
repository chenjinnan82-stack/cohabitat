# 3D verification — 2026-10-27

This is a local implementation and measurement record, **not a claim that the competition entry is ready**. All inference below uses locally installed Ollama `qwen2.5:7b`; no Nebius inference was made and no paid cloud usage was incurred.

## Actual artifacts

- `manual-motion.mp4`: 29.98 seconds, 1280-wide real canvas capture. Permanently labelled “动作测试 · 人工编排” (hand-authored movement test).
- `ollama-play.mp4`: 141.31 seconds, 1280-wide continuous real canvas capture. Permanently labelled “Ollama 本地测试”. It shows movement, a moved flower pot, water added, and changed camera angles during actual model decisions. It is not a Nemotron demonstration.
- `m1-pro-ollama-runtime.json`: complete exported measurements and 110 returned decisions, plus the last 400 simulation events. Event history is bounded, so the exported event counts are not whole-session totals.
- `memory-comparison.json`: the exact recorded observation, six real replay calls and their output.
- `neighbor-sequence.json`: three early cautious-sparrow decisions with visible neighbors and recent events. This is an observed sequence, not a controlled proof of causation.
- `scene.png`, `side.png`, `back.png`: frames from the actual recording.

## M1 Pro, 32 GiB, Codex in-app browser

Measured one foreground run of 634 seconds with real local inference, scene interaction and periods of recording. Simulation time was also 634 seconds; closing or hiding did not advance time. Three.js used pixel ratio 1.5, around 490 draw calls and 360,682 rendered triangles including the shadow pass. The Node service was later observed at about 41.2 MiB RSS; this is not the browser or Ollama memory footprint and is not production-host sizing evidence.

| Measurement | Actual | Target / interpretation |
|---|---:|---|
| RAF frame interval median | 16.7 ms | Approximately 60fps |
| RAF frame interval p95 | 18.6 ms | Approximately 54fps at the slower percentile |
| Maximum recorded frame interval | 33.4 ms | 0 frames >50ms in this run |
| JS draw submission median / p95 | 1.2 / 1.6 ms | Does not independently measure GPU completion |
| Software input to next RAF, 17 samples | median 5.3 ms; p95 18.8 ms | Below 100ms; not end-to-end display latency |
| Real model responses | 110 accepted plans | Acceptance is not proof all queued actions later executed |
| Ollama latency median / p95 | 5,420 / 6,752 ms | Fails 3,000 / 5,000 ms targets |
| Rejected call | 1 HTTP 429 | Session limit held; retry remained available |

The initial earlier cold call took 9,767ms including 3,569ms loading. It is recorded in the server log but is not folded into this later warm-run measurement. Repeated identical comparison inputs can hit Ollama prompt caching; their shorter timings are not substitutes for interactive latency. The test includes the overhead of local inference sharing the M1's resources.

## Functional checks

`npm test` passed without inference: all four resident IDs and 3D supports, target occupancy, invalid action rejection, stale revision rejection, position-preserving safety transition after moving a target, no invented successful memories, actual shared-space events, private-memory isolation, snail paths, v2 restoration, independent v1 storage, budget reservation/settlement across restart, and static/API boundaries.

Actual browser checks: front/side/back rotation, zoom, object drag with preserved offset, keyboard object movement, watering the selected tree, adding dish water, shade movement and blocked placement, pause, recording, and exports. The flower pot was moved while the butterfly was using the scene; actual target-change and movement events are recorded. Models are real meshes, not billboards. Camera position is not included in resident perception.

Visual review found a coplanar base/floor surface that produced pale rectangular depth artifacts. The base was lowered after the long recording; topology and draw count did not change. Updated preview/smoke recording identifies the correction. The performance run and longer video are preserved as measured, not relabelled as a new run. New branch/leaf growth is intentionally small and finite. All motion/collision cases and mobile touch have not been exhaustively verified.

## Memory result: not passed

For one real cautious-sparrow observation, three runs with the recorded memory and three with an empty memory all selected `visit:water-wait`. No choice difference was observed. Six runs on one case cannot show that memory never matters, but they do **not** validate the intended memory-dependent relationship. The prototype records and passes actual history; that alone is not successful relationship design.

The observational sequence shows a cautious sparrow first visiting the far rim, then moving to the waiting location when another sparrow was drinking nearby, then drinking after shared-space events. Thirst and time also changed, so this must not be described as proven neighbor causality.

Repeated drinking/feeding despite low need remains visible in the local model's choices. A stronger model or better decision representation may improve this, but there is no measured guarantee. No script was added to force a friendship or manufacture a difference in the comparison.

## Not verified / release blockers

- Actual Nebius Nemotron availability, tool invocation, model latency and accounting settlement with real provider usage; API Key remains absent.
- A convincing repeatable difference from real memory, and a controlled neighbor-presence comparison.
- Remote Lighthouse Node 22 support, memory headroom and existing-business performance; no host changes made.
- Public HTTPS game access, final English-captioned Nemotron video, public YouTube upload and official submission.

The backend price source was read successfully: `https://tokenfactory.nebius.com/api/public/models_info` listed input $0.06 / output $0.24 per million tokens for the configured Nemotron. The backend rechecks that catalog before paid use, reserves cost first and preserves unknown outcomes. The 100-CNY accounting ceiling is not authority to buy infrastructure or exceed it.
