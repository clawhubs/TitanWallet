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
- `VITE_TITAN_MILITARY_GRADE_BASE_URL`
- `VITE_TITAN_DEV_PORTAL_URL`
- `VITE_TITAN_API_KEY`
- `VITE_TITAN_API_ENV`
- `VITE_PRIVY_APP_ID`

## Privy social auth

This wallet can optionally use Privy for Google / Apple authentication and embedded MPC wallet creation.

Frontend:

- Set `VITE_PRIVY_APP_ID` in `.env.local`
- The React app never needs the Privy App Secret

Server-side / developer auth notes:

- Keep `PRIVY_APP_SECRET` only on the server
- Verify Privy-issued JWTs against the app JWKS endpoint:
  `https://auth.privy.io/api/v1/apps/<your-privy-app-id>/jwks.json`
- The current app can safely use Google / Apple login in the browser while any privileged verification stays in your backend or agent runtime
- For third-party developers building their own app on top of TITAN rails, they must bring their own Privy app and credentials rather than reuse the TITAN Wallet Privy app

## Dependency security note

We pin `ws` through npm `overrides` so the wallet stays on patched `8.21.x` without forcing a breaking downgrade of `ethers`, `viem`, or Privy's wallet stack.

`uuid` may still appear in `npm audit` as a moderate transitive issue through MetaMask / WalletConnect dependencies pulled in by the wallet connector stack. We are intentionally leaving that as a documented upstream exception until Privy / `x402` / `wagmi` / connector dependencies publish a compatible non-breaking upgrade path.

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

Production should prefer same-origin proxy routes on the wallet domain:
Use a managed API key from `https://dev.yieldboostai.xyz/console` and point the wallet at the live endpoints:

- `https://api.yieldboostai.xyz`
- `https://dev.yieldboostai.xyz/api/dev/store/aws-nitro-fortress`

## Notes

- This repo is intentionally separate from the main YieldBoost app for easier maintenance and GitHub management.
- Private wallet secrets are kept in memory only and are not persisted by default.
