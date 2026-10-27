# Credits and licenses

## Current 3D build

- Cohabitat source code, native mesh models and part animations: original project work, MIT; see LICENSE.
- Three.js 0.186.1, including OrbitControls and RoundedBoxGeometry: Copyright © 2010–2026 three.js authors, MIT. https://github.com/mrdoob/three.js/blob/dev/LICENSE . The installed dependency includes its complete LICENSE; it is also copied into `THIRD_PARTY_LICENSES.txt`.
- No generated concept image, downloaded model or pixel sprite is used as a movable object in the current 3D scene. All current models are constructed in `art.mjs`.
- Ollama is a separately installed development runtime. The locally used Qwen2.5 7B model weights are not redistributed. https://huggingface.co/Qwen/Qwen2.5-7B-Instruct (Apache 2.0 model card).
- Nebius-hosted NVIDIA Nemotron is a remote service; its weights are not bundled. The official catalog links NVIDIA's Open Model License: https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/ . Provider use and competition eligibility remain separate from our source-code license.

## Retained local historical pixel baseline

The earlier 2D prototype is preserved under `archive/pixel-v1/` and is not loaded by the 3D entry point.

- Bird, Small by Inmenus — https://inmenus.itch.io/bird-small — author labels it CC0.
- Pixel Art Flower Pack by Karsiori — https://karsiori.itch.io/free-pixel-art-flower-pack — author labels it CC0.
- The original sprite files and their earlier credit document remain with the local archive. They are not needed for the current runtime or deployment package.
