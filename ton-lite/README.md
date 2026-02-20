# TON lite config mount

`docker compose up` reads TON lite `global-config.json` from this folder and mounts it into `ton-http-api`.

## Runtime behavior
- Config file path in container: `/opt/ton-config/global-config.json`.
- This repository ships `ton-lite/global-config.json` and uses it directly at startup.
- A preflight validator (`ton-lite/validate-config.mjs`) now runs automatically before `ton-http-api` starts.

## Why the preflight exists
If your lite-server config contains `127.0.0.1`, `ton-http-api` in Docker will fail with `LITE_SERVER_NETWORK` and worker exit code `12`, because loopback inside a container points to the container itself, not your host node.

The validator blocks startup when loopback addresses are present and prints remediation guidance.

Reference: <https://github.com/toncenter/ton-http-api/issues/87#issuecomment-3599163096>

## Updating the config
If you need to refresh lite server endpoints, replace `ton-lite/global-config.json` yourself (for example, from your trusted TON config source), then restart the stack.

The compose defaults are tuned for reliability on self-hosted nodes:
- `TON_PARALLEL_REQUESTS_PER_LITESERVER=2`
- `TON_REQUEST_TIMEOUT_SECONDS=30`

If needed, override `TON_LITESERVER_CONFIG_URL` to point to a different path already available inside the container.
