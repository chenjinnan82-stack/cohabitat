# Optimization 2 — 2026-10-27

Local M1 Pro, 32 GiB, in-app browser, Ollama `qwen2.5:7b`. No paid service, Nebius verification or remote deployment. Changes are limited to the existing modules; no new dependency.

## What changed

- The prompt sees the last four remembered arrivals in chronological order, including returns. Previously arrivals were grouped with other facts and could disappear behind neighbor events. Encounter summaries use at most four groups from the existing twelve actual events; there is no new hidden long-term memory.
- The model can choose to watch one actually visible resident for 12 seconds, or rest for 20 seconds. Waiting near water lasts 12 seconds. These durations are explicit world rules. No travel is needed; the animal retains its physical support. Looking follows the chosen neighbor. Losing sight cancels observation without recording successful completion.
- Moving a resting or watching animal's support triggers continuous safety motion. Ineffective object moves no longer invalidate a decision.
- A finished recording retains a local download link, so missing the automatic stop no longer loses the clip. Only the latest clip is retained, and its object URL is released when replaced. Nothing is uploaded.

## Fixed route comparison

`cases.json` was selected before changing the prompt: the first satisfied return to a target visited within 60 seconds, without a subsequent disturbance or moved-target event, for sparrow-a and butterfly in the previous 205-second run. Original candidates stay exactly the same, without the new watch action. Both prompts ran each observation under actual history, empty history, and empty history with unobserved neighbors, three repetitions each (18 calls per prompt). Plans were not executed.

| Case | Previous prompt, actual history | Current prompt, actual history | Current prompt, empty history |
|---|---|---|---|
| Sparrow-a | return to water-far, 3/3 | wait nearby, 2/3; rail-left, 1/3 | visit water-wait, 2/3; rail-left, 1/3 |
| Butterfly | return to flower-top, 3/3 | rest, 3/3 | return to flower-top, 3/3 |

This is narrow evidence that the route/history input can affect a choice. It is not proof of a relationship or universal loop prevention. Raw inputs/results are `cases.json`, `baseline.json`, `same-options.json`; `comparison-summary.json` includes every condition.

## Actual run

487 active/simulation seconds, 497 wall seconds, fresh world. 94 decisions received; 93 accepted. One returned watch plan was rejected after its subject left view. One HTTP 429 was handled by retry timing. Accepted plans are not necessarily fully executed. Browser console had no captured warnings/errors. The run exercised flower movement, watering, shade movement, water-dish movement and camera rotation.

| Measurement | Previous 205-second run | Current 487-second run |
|---|---:|---:|
| Decision response p50 / p95 | 1,807 / 2,191 ms | 2,238 / 3,077 ms |
| Input tokens p50 / p95 | 407 / 480 | 543 / 684 |
| Frame interval p50 / p95 | 16.7 / 18.5 ms | 16.7 / 18.6 ms |
| Largest frame interval | 33.4 ms | 51.6 ms |
| Intervals over 50 / 100 ms | 0 / 0 | 3 / 0 |
| Software input feedback p95 | 8.5 ms, 18 samples | 10.1 ms, 18 samples |

No new geometry: 492 draw calls and 360,938 triangles in the sampled view, pixel ratio 1.5. Added behavior increased model input and latency; it did not make rendering significantly heavier. This is eight minutes, not another ten-minute certification. Live response timing excludes scheduler queueing and action execution. Replay timings can benefit from prompt caching and must not substitute for these measurements.

29 of 94 first actions were model-selected observation, 48 travel/visit, 9 drinking, 4 feeding, 3 shelter and 1 rest. Low-need consumption remained zero due to the existing candidate rule. The last 400 events retain 21 completed observations and one ended by loss of sight; earlier events have rolled out. `neighbor-sequence.json` shows actual sparrow-a/b choices at 139.1/141.8 seconds to watch each other and actual completions at 153.5/156.1 seconds. This is observed behavior, not evidence of affection.

Exploratory loop metric: among satisfied decisions with a remembered arrival within 60 seconds and no later disturbance/moved-target event, first-action visits back to such targets fell from 5/25 to 4/58. The first 205 seconds of the new run had 0/24. Counts and individual rows are in `behavior-summary.json`. The runs have different intervention timing; longer stationary actions and new watch choices are confounds. Do not attribute the whole difference to memory or claim loops are solved. The snail still alternated between ground locations later in the run.

`m1-pro-ollama-runtime.json` is the raw run. `ollama-play.mp4` is 157.40 seconds of uninterrupted, normal-speed actual play, recorded separately after this measurement from the saved world. It shows model-selected actions, flower movement, watering, shade movement and camera rotation, with the Ollama label. `video-runtime.json` is that separate 177-active-second session (34 received/accepted decisions); it is not substituted for the eight-minute report. `preview.png` is the final live browser screenshot. The video was encoded from the browser recording and its sampled frames inspected; no generated frames or scripted resident plans were used.

## Encounter-only comparison: still not a pass

Before running these calls, selected each sparrow's first actual observation with need below 0.7, the other sparrow visible, a completed shared-space event with that sparrow, and its watch action available. Kept current neighbors, needs and candidates fixed. Compared actual history, history with only events involving another resident removed, and completely empty history. Three rotating repetitions per condition, 18 calls total; none were executed or remembered.

- Sparrow-a: all nine selected `visit:water-wait`; no difference.
- Sparrow-b: actual history selected `visit:water-near` twice and `watch:sparrow-a` once; removing only encounters selected watch three times; completely empty history selected visit three times.

There is sensitivity to input, but no stable or clearly interpretable learned relationship. No prompt was retuned after this result to manufacture a positive outcome. `encounter-cases.json`, `encounter-comparison.json`, `encounter-summary.json` preserve inputs and all results. Reproduce with `node verify-model.mjs evidence/optimization-2/encounter-cases.json OUTPUT.json memory` while browser residents are paused.

## Checks and remaining limits

`node check.mjs` passes. Added assertions cover visible watch targets, stationary support, no completed memory before execution, loss of visibility, actual observation completion, unseen-target API rejection, moving a resting animal's support, no-op movement, and chronological route preservation. Existing occupancy, stale plan, paths, persistence, budget and HTTP checks remain.

The new observation option improves readable pauses, but behavior remains simple and sometimes repetitive. Twelve events are short working memory; no personality evolution is claimed. Nebius/Nemotron, deployment performance and competition readiness remain unverified.
