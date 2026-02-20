# TON lite config mount

`docker compose up` reads TON lite `global-config.json` from this folder and mounts it into `ton-http-api`.

## Runtime behavior
- Config file path in container: `/opt/ton-config/global-config.json`.
- This repository ships `ton-lite/global-config.json` and uses it directly at startup.
- No auto-download/init script is used during container boot.

## Updating the config
If you need to refresh lite server endpoints, replace `ton-lite/global-config.json` yourself (for example, from your trusted TON config source), then restart the stack.

The compose defaults are tuned for reliability on self-hosted nodes:
- `TON_PARALLEL_REQUESTS_PER_LITESERVER=2`
- `TON_REQUEST_TIMEOUT_SECONDS=30`

If needed, override `TON_LITESERVER_CONFIG_URL` to point to a different path already available inside the container.
