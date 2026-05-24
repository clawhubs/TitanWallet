# TITAN Wallet

Frontend wallet app for the TITAN / YieldBoost AI stack.

This project is a standalone `Vite + React + TypeScript` app intended to live in its own repository and deploy separately from the main YieldBoost codebase.

## What is included

- In-memory wallet session management with `ethers`
- Network management with custom RPC support
- Token detection and custom token import
- Swap flow with pre-swap TITAN security checks
- YieldBoost Integrity API integration for health, records, proofs, and security actions

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

## Environment variables

See [.env.example](./.env.example).

Important values:

- `VITE_TITAN_API_BASE_URL`
- `VITE_TITAN_DEV_PORTAL_URL`
- `VITE_TITAN_API_KEY`
- `VITE_TITAN_API_ENV`

## Production build

```bash
npm run build
```

The static output is generated in `dist/`.

## VPS deployment idea

Recommended target:

- app path: `/opt/titan-wallet/current`
- domain: `wallet.yieldboostai.xyz`
- web server: `nginx`
- serve static files from `dist/`

Because this frontend calls the Integrity API directly, make sure the API backend allows:

```text
https://wallet.yieldboostai.xyz
```

inside `INTEGRITY_API_CORS_ORIGINS`.

## Notes

- This repo is intentionally separate from the main YieldBoost app for easier maintenance and GitHub management.
- Private wallet secrets are kept in memory only and are not persisted by default.
