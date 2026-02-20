# TON lite config mount

`docker compose up` auto-downloads TON lite `global-config.json` into this folder before `ton-http-api` starts.

## Auto-download behavior
- Compose init service: `ton-config-init`.
- Source URL env: `TON_LITESERVER_CONFIG_DOWNLOAD_URL` (default `https://ton.org/global-config.json`).
- Force refresh env: `TON_FORCE_REFRESH_CONFIG=1` to re-download even if file exists.

## Where to get `global-config.json`
- Official mainnet source: `https://ton.org/global-config.json`.
- One-command download:

```bash
./ton-lite/fetch-global-config.sh
```

- Custom source URL (optional):

```bash
./ton-lite/fetch-global-config.sh https://example.com/global-config.json
```

Expected path inside container: `/opt/ton-config/global-config.json`.

The compose defaults are tuned for reliability on self-hosted nodes:
- `TON_PARALLEL_REQUESTS_PER_LITESERVER=2`
- `TON_REQUEST_TIMEOUT_SECONDS=30`

If you need to override, set env vars in your deployment environment.
