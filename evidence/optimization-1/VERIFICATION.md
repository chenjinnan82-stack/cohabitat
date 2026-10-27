# Optimization 1 — 2026-10-27

Local M1 Pro (32 GiB), in-app browser, Ollama `qwen2.5:7b`. No paid calls, Nebius verification or production deployment. The original ten-minute baseline is retained in `../3d/`.

## Changes

- Provider input retains temperament, needs, actual encounters and observable neighbors, but sends relative distances instead of redundant coordinate JSON. The world still validates the full request and every executed action.
- A derived `satisfied / moderate / urgent` label accompanies the numerical need. Candidate descriptions state their effects. The model remains free to choose any valid candidate.
- Need below 0.2 removes consumption actions. This is a physiological rule, not a model-intelligence result.
- Repeated sightings of the same neighbor no longer occupy multiple memory slots. The model receives at most six grouped facts from the twelve actual events, prioritizing currently observed residents. Counts are within that window, not lifetime statistics or affinity scores.
- Short, unobstructed ground approaches use hops. An idle sparrow turns its head toward a resident it can actually see. Safety landings retain their physical motion but no longer add a five-second hold.

## Fixed comparisons

`cases.json` contains two observations from the original real-play log, with available water, observable neighbors and actual shared-space events. Each version uses three rounds of actual memory, empty memory, and empty memory plus hidden neighbor input: 18 real calls. Candidates are unchanged. None of these replay plans are executed or remembered. Hiding the neighbor input is not equivalent to physically removing an animal from the world.

The original prompt already reacted to neighbor input in these cases. It did not show a memory difference. Intermediate compressed prompts sometimes did show a difference, but this was sensitive to small wording changes. The final prompt selected `drink:water-far` in all 18 calls, so neither memory nor neighbor effects were established in these two cases. Do not claim a learned relationship from this test, or select only the favorable intermediate result.

`comparison-summary.json` aggregates every saved version. Raw results: `baseline.json`, `compact.json` (v1), `compact-v2.json`, `compact-v3.json`, and `final.json`.

## Failure retained and corrected

Removing action semantics made the v1 snail repeatedly visit locations at need=1 instead of taking shelter. Restoring the shared effect description helped the snail; a butterfly still visited flowers at need=0.98 without feeding. Adding per-option descriptions alone did not fix that recorded butterfly case (0/3 selected feeding). Adding the numerical urgency label changed the same observation to feeding in 3/3 calls (`urgent-butterfly.json`). This is one narrow regression case, not a general reliability guarantee.

The earlier need=1 test (`urgent-at-limit.json`) was not evidence of improvement: its original observation had already selected feeding. It is retained to make that distinction explicit. The separate intermediate recordings and runtime exports are not relabelled as final performance.

## Live measurements

Final build: 205 seconds of active play from a fresh world (206 wall seconds); 40 received/accepted model plans, one HTTP 429 rate-limit response, zero rejected received plans. During edits, four other in-flight requests were cancelled in under one second; these are recorded separately in `runtime-summary.json`. Browser console had no warnings or errors during this run.

| Measurement | Original 634-second run | Final 205-second run |
|---|---:|---:|
| Model response p50 / p95 | 5,420 / 6,752 ms | 1,807 / 2,191 ms |
| Input tokens p50 / p95 | 865 / 1,018 | 407 / 480 |
| Prompt evaluation p50 / p95 | 4,169 / 6,046 ms | 1,384 / 1,727 ms |
| Frame interval p50 / p95 | 16.7 / 18.6 ms | 16.7 / 18.5 ms |
| Largest frame interval | 33.4 ms | 33.4 ms |
| Software input feedback p95 | 18.8 ms (17 samples) | 8.5 ms (18 samples) |
| Low-need consumption plans (need < 0.15) | 36 / 110 | 0 / 40 |

The final run recorded 5 completed drinks, 2 feeds, 2 shelter actions and 3 target-moved events. Three environmental edits plus two water additions were exercised. Low-need consumption is prevented by a world rule, not credited to prompting. Both runs use a loaded local model; this is not a cold-start benchmark or an identical-duration controlled trial. The final check is three minutes, not a second ten-minute certification. No new geometry or rendering workload was added.

`ollama-play.mp4` is 147.38 seconds of uninterrupted final-build footage (normal speed, no synthetic frames); it shows flower movement, watering, shade movement, water-dish movement and camera rotation. `preview.png` is a real browser screenshot. `m1-pro-ollama-runtime.json` contains the raw final run; `runtime-summary.json` is its aggregate.

Live latency is measured from the browser request to the received decision. It excludes time waiting for the 12-calls/minute scheduler and excludes physical action duration. This limit can still cause idle periods. Repeated fixed-case tests can reuse inference caches; their sub-second samples are not presented as live latency.

The full event buffer retains only the last 400 events. An accepted plan is not proof that every queued action finished. Simulation time may continue from a browser save; measure duration with active time, not the saved world's cumulative age.

## Checks and remaining limits

`node check.mjs` passes: invalid and stale actions, occupancy and paths, continuous recovery, actual event memory, duplicate sighting retention, candidate need constraints, a ground hop, invalid simulation time, saved-state isolation, budget persistence and HTTP boundaries. No model calls are made by this check.

The model's action quality and long-term relationship effects remain limited. No stable personality evolution is claimed. Nebius latency, real tool calling, public-host performance and production deployment remain unverified.
