# Cohabitat — A balcony with other lives

Status: draft material. Do not submit as a completed Nebius entry until its deployment and real Nemotron checks are filled in.

## Pitch

You can move the water, but you cannot tell a sparrow to become friends. Cohabitat is a small, rotatable 3D balcony shared by two sparrows, a snail, a butterfly and living plants. You arrange their surroundings and observe how each resident adapts. Waiting, giving way, approaching and remaining apart are all possible outcomes.

## How it works

A deterministic world supplies each animal with its own needs, nearby visible residents, a small memory of actual events, and currently valid actions. A language model chooses a short sequence. The simulation executes movement, reserves landing points and checks changing targets. Only completed or observed events become memories. Camera movement has no effect on perception. Trees use simplified light, water and space rules instead of model calls.

The browser renders original procedural meshes with Three.js. A small Node service keeps credentials off the client, validates model choices, enforces request limits and maintains a persistent spending ledger.

## What is actually verified

The current prototype runs on a local M1 Pro, using Ollama/Qwen2.5 7B for real decisions. The manual animation test has a permanent label and is a separate mode. Local latency, rendering performance and memory comparisons are reported in the verification file without substituting them for Nebius results.

## Required before submission

- Run the same interface through Nebius-hosted NVIDIA Nemotron and report the exact served model and latency.
- Publish and test the dedicated HTTPS entry point; keep test access available for the official judging period.
- Publish the source repository with its license and clear run instructions.
- Upload a public or unlisted English-captioned YouTube demonstration under three minutes and place the real URL here.
- Check the official rules at submission time, including deadline and required sponsor usage: https://nebiusglobalaihackathon.devpost.com/rules . No entry or representation of completion has been submitted automatically.

## Suggested short demo narration

“This is Cohabitat, a miniature balcony shared with other lives. I can turn the scene and move its objects. I cannot issue commands to the animals. Each resident sees nearby activity and remembers events that actually occurred. Here I move a resource: old plans become invalid, so the residents safely continue from where they are. Water, flowers and shelter create reasons to approach, wait or leave. A model chooses valid actions; ordinary code handles physics, animation and memory. Relationships are possibilities, not a scripted reward.”

The current local recording must be labelled “Ollama development test.” Replace that label only after recording actual Nemotron operation; do not relabel the same footage.
