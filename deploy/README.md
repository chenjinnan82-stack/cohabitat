# Deployment runbook (prepared, not deployed)

This release adds an isolated `/cohabitat/` reverse proxy. It must not replace the current website or business services. The browser renders the 3D scene; the server only serves local Three.js files, validates requests and calls Nebius.

## Read-only preflight on the existing Lighthouse host

Run `node --version`, `command -v node`, `free -m`, `df -h /opt /var`, `uptime`, `ss -lntp`, `systemctl --failed`, and `sudo nginx -T` before changing anything. Confirm Node 22+, no service already using port 5321, at least 256 MiB memory headroom, and enough disk space. Compare existing site response times before and during a staging load. Do not purchase a new machine or resize the host.

The local repository contains earlier website deployment records, but no usable SSH configuration was found. Remote runtime/headroom has NOT been checked. Existing deployment was through Tencent's browser terminal. Do not infer its current capacity from local M1 performance.

## Install and isolate

1. Back up the exact Nginx server block and note the existing website release symlink. Create a dedicated unprivileged `cohabitat` account and `/opt/cohabitat/releases/<release>/`.
2. Extract the source package into that release and run `npm ci --omit=dev --ignore-scripts`. Verify Node 22+ and `npm test`. Only `three@0.186.1` is installed.
3. Create `/etc/cohabitat.env` from `production.env.example`, mode 600. Enter the Nebius credential on the server; never include it in a source archive. Do not point public requests at a local Ollama computer.
4. Create `/var/lib/cohabitat`, owned by the dedicated account. **Retain this directory through upgrades and rollback:** it holds the budget ledger and decision log. Never reset it to replenish the budget.
5. Point `/opt/cohabitat/current` to the release. Verify `/usr/bin/node` is the actual Node 22+ executable; adjust the unit if necessary. Install the service and start it.
6. Check local `/api/status`, one real tool call and error paths before exposing the route. A missing key or a successful status response is not proof of working inference.
7. Add only the supplied location snippet to the existing HTTPS host. Run `nginx -t`, then reload. Verify imports, MIME types, camera, drag, saves and `/cohabitat/api/decide` in the public browser.
8. Observe CPU/RSS, Nginx latency of the existing site, request rate and ledger growth. The proposed service caps are 192 MiB and 35% of one CPU; measure them on the actual host. No GPU is used by this server.

## Spending

The provider price is verified against Nebius's official public model catalog before each cached pricing period. Each call reserves an upper bound based on request bytes, 768 output tokens and a conservative accounting envelope of 10 CNY/USD. Actual token counts settle reservations. Unknown outcomes keep the full reservation. The total ceiling cannot exceed 100 CNY; a lower environment limit is allowed. The ledger is for this application only and cannot account for unrelated use of the same key or purchases. Do not start new paid services.

One Node process owns the ledger. Do not run multiple replicas against it. Public sessions are limited to 12 calls/minute and one in-flight request per resident; the server also limits global calls and concurrency. The budget cap limits exposure, but does not replace host monitoring. Preserve the private logs with restrictive permissions.

## Rollback

Remove only the new location snippet, check and reload Nginx, then stop `cohabitat.service`. Keep the state ledger. No original site files or routes are replaced. For a code rollback, point the dedicated symlink at the prior release and restart the service without resetting state.

Public access and a real Nebius smoke test remain prerequisites before marking this build submission-ready.
