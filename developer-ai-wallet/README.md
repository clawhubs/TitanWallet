# TITAN Agent Wallet Developer Kit

Developer kit for autonomous wallets protected by the TITAN 10-layer rail.

The AI is BYOK: bring your own model, agent, planner, or local runtime. This package only handles wallet-bound capability, policy checks, proof, seal, handshake, and optional security log anchoring.

If a developer wants Privy-based Google / Apple login inside their own app, they must bring their own Privy app credentials. They must not reuse the TITAN Wallet Privy app.

## Dependency security note

This package pins `ws` through npm `overrides` so we stay on the patched `8.21.x` line without forcing a breaking downgrade of `ethers`.

If `npm audit` still reports `uuid`, treat that as an upstream wallet-connector exception in the main wallet app rather than a direct SDK flaw in this package.

## Source Of Authority

The owner wallet must be created or imported in TITAN Wallet first:

`https://titanwallet.net`

Then open:

`Settings -> Developer`

Create:

- Project
- Agent wallet
- Capability

Copy the generated SDK/CLI env block into your own agent runtime.

## Agent Intent Demo

Public demo:

`https://titanwallet.net/developer/demo`

The demo proves this path:

`Capability -> Intent Check -> Policy Check -> Allowed / Blocked -> Proof Log -> Security Log -> 10-Layer Evidence`

It uses a simulation-only API key. No public demo button can move real funds.

```bash
node dist/src/cli.js demo:key --label "TITAN Agent Intent Demo"
export TITAN_AGENT_WALLET_DEMO_API_KEY="titan_demo_..."

node dist/src/cli.js demo:run --scenario allowed
node dist/src/cli.js demo:run --scenario blocked
node dist/src/cli.js demo:logs
```

Owner-only live anchoring is separate and requires a server-side owner run token:

```bash
node dist/src/cli.js demo:anchor --owner-run-token "$TITAN_DEMO_OWNER_RUN_TOKEN"
```

## x402 Guardrail / Agent Payment Rail

x402 lets agents pay. TITAN makes sure they are allowed to pay.

This module is for developer and AI-agent wallet products. It checks an agent API payment intent before a payment processor or x402 facilitator is introduced. Public demo mode never moves real funds.

The demo proves this path:

`x402 payment intent -> capability policy -> domain / recipient / amount / token / chain checks -> allowed or blocked -> proof log -> security log -> 10-layer evidence`

```bash
node dist/src/cli.js demo:key --label "x402 Guardrail Demo"
export TITAN_AGENT_WALLET_DEMO_API_KEY="titan_demo_..."

node dist/src/cli.js x402:check --scenario allowed
node dist/src/cli.js x402:check --scenario blocked
node dist/src/cli.js demo:logs
```

Allowed demo defaults:

- `intent`: `Pay approved API invoice via x402`
- `action`: `x402_pay`
- `domain`: `api.approved-service.com`
- `endpoint`: `/v1/inference`
- `amount`: `0.01`
- `token`: `USDC`
- `chainId`: `base-sepolia`
- `recipient`: `0xApprovedPayTo`

Blocked demo defaults intentionally fail policy with an unknown domain, unknown recipient, and high amount.

## 10 Layers

- L01 Hallucination Blacklist
- L02 Integrity Auditor
- L03 Secure Compute / TEE
- L04 Sovereign Memory
- L05 0G Storage Proof Layer
- L06 Zero-Knowledge Proof Layer
- L07 ProofRegistry Anchor
- L08 Programmable Governance
- L09 Cross-Agent Neural Handshake
- L10 AWS Nitro Enclaves

## Install

```bash
cd developer-ai-wallet
npm install
npm run build
```

## Bring Your Own Privy

Privy is optional for developers integrating the TITAN wallet rail.

- TITAN Wallet's consumer app can use its own Privy app
- A third-party developer product must use its own Privy App ID, App Secret, and JWKS URL
- TITAN capability tokens and TITAN wallet rails are separate from any developer-owned Privy app

Example:

```bash
export PRIVY_APP_ID="your_privy_app_id"
export PRIVY_APP_SECRET="your_privy_app_secret"
export PRIVY_JWKS_URL="https://auth.privy.io/api/v1/apps/<your-app-id>/jwks.json"
```

## SDK

```ts
import { TitanAgentWalletClient } from "@titan/agent-wallet";

const client = new TitanAgentWalletClient({
  baseUrl: "https://titanwallet.net/api",
  militaryBaseUrl: "https://titanwallet.net",
  ownerWalletAddress: process.env.TITAN_AGENT_WALLET_OWNER,
  projectId: process.env.TITAN_AGENT_WALLET_PROJECT_ID,
  agentWalletId: process.env.TITAN_AGENT_WALLET_ID,
  capabilityToken: process.env.TITAN_AGENT_WALLET_CAPABILITY,
});

await client.checkIntent({
  intent: "Pay approved vendor invoice",
  action: "agent-send",
  chainId: 16661,
  destinationAddress: "0xapproved...",
  amountWei: "1000000000000000",
  actor: "local-agent",
});

const capability = await client.getCapability();
const proofLog = await client.getProofLog({ limit: 10 });

const demoKey = await client.createDemoApiKey({ label: "TITAN Agent Intent Demo" });
const demoRun = await client.runDemoIntent({
  demoApiKey: demoKey.api_key,
  scenario: "allowed",
  intent: "Pay approved vendor invoice",
  action: "pay_invoice",
  amount: "0.01",
  recipient: demoKey.demo.approved_recipient,
});
const demoLogs = await client.getDemoLogs({ demoApiKey: demoKey.api_key });

const x402Run = await client.checkX402Payment({
  demoApiKey: demoKey.api_key,
  scenario: "allowed",
  intent: "Pay approved API invoice via x402",
  action: "x402_pay",
  domain: "api.approved-service.com",
  endpoint: "/v1/inference",
  amount: "0.01",
  token: "USDC",
  chainId: "base-sepolia",
  recipient: "0xApprovedPayTo",
});
```

## CLI

```bash
export TITAN_AGENT_WALLET_BASE_URL="https://titanwallet.net/api"
export TITAN_AGENT_WALLET_MILITARY_BASE_URL="https://titanwallet.net"
export TITAN_AGENT_WALLET_OWNER="0x..."
export TITAN_AGENT_WALLET_PROJECT_ID="proj_..."
export TITAN_AGENT_WALLET_ID="aw_..."
export TITAN_AGENT_WALLET_CAPABILITY="titan_cap_..."
export TITAN_AGENT_WALLET_OWNER_SESSION_TOKEN="titan_owner_..."

node dist/src/cli.js health
node dist/src/cli.js capability
node dist/src/cli.js proof:list --limit 10
node dist/src/cli.js demo:key --label "TITAN Agent Intent Demo"
node dist/src/cli.js demo:run --demo-api-key "$TITAN_AGENT_WALLET_DEMO_API_KEY" --scenario allowed
node dist/src/cli.js demo:run --demo-api-key "$TITAN_AGENT_WALLET_DEMO_API_KEY" --scenario blocked
node dist/src/cli.js x402:check --demo-api-key "$TITAN_AGENT_WALLET_DEMO_API_KEY" --scenario allowed
node dist/src/cli.js x402:check --demo-api-key "$TITAN_AGENT_WALLET_DEMO_API_KEY" --scenario blocked
node dist/src/cli.js demo:logs --demo-api-key "$TITAN_AGENT_WALLET_DEMO_API_KEY"
node dist/src/cli.js check-intent --intent "Pay approved vendor invoice" --action agent-send --chain-id 16661 --to "0xapproved..." --amount-wei "1000000000000000"
node dist/src/cli.js capability:revoke --capability-id "cap_..." --owner-session-token "$TITAN_AGENT_WALLET_OWNER_SESSION_TOKEN"
```

## MCP

This package also ships with a local MCP server that uses the same SDK identity and capability env as the CLI. MCP is not a separate auth system.

Build and run:

```bash
npm run build
node dist/src/mcp.js
```

Example MCP config:

```json
{
  "mcpServers": {
    "titan-agent-wallet": {
      "command": "node",
      "args": ["/absolute/path/to/developer-ai-wallet/dist/src/mcp.js"],
      "env": {
        "TITAN_AGENT_WALLET_BASE_URL": "https://titanwallet.net/api",
        "TITAN_AGENT_WALLET_MILITARY_BASE_URL": "https://titanwallet.net",
        "TITAN_AGENT_WALLET_PROJECT_ID": "proj_...",
        "TITAN_AGENT_WALLET_ID": "aw_...",
        "TITAN_AGENT_WALLET_CAPABILITY": "titan_cap_..."
      }
    }
  }
}
```

Programmatic use from the SDK package:

```ts
import {
  createTitanAgentWalletClientFromEnv,
  TitanAgentWalletMcpServer,
} from "@titan/agent-wallet";

const client = createTitanAgentWalletClientFromEnv(process.env);
const mcpServer = new TitanAgentWalletMcpServer(client);

await mcpServer.handleRequest({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
});
```

Available MCP tools now include:

- `titan_health`
- `titan_layers`
- `titan_check_intent`
- `titan_get_capability`
- `titan_get_proof_log`
- `titan_demo_status`
- `titan_demo_create_api_key`
- `titan_demo_run`
- `titan_x402_check_payment`
- `titan_demo_logs`
- `titan_demo_anchor_security_log`
- `titan_revoke_capability`
- `titan_security_status`
- `titan_run_ten_layer_rail`
- `titan_seal_memory`
- `titan_send_native`

## Optional Agent Send

If the developer chooses local signing for an autonomous agent, set a scoped key and RPC in the local runtime.

```bash
export TITAN_AGENT_WALLET_PRIVATE_KEY="0x..."
export TITAN_AGENT_WALLET_RPC_URL="https://evmrpc.0g.ai"

node dist/src/cli.js send \
  --to "0x..." \
  --value-eth "0.001" \
  --intent "Pay approved vendor invoice" \
  --max-value-wei "10000000000000000"
```

## Docs Playground

Public docs page:

`https://titanwallet.net/developer/docs`

Local static docs:

```bash
npm run dev:docs
```

Then open:

`http://localhost:8097`

## 0G Private Computer

Priority LLM provider for autonomous agent runtime:

- OpenAI-compatible base URL: `https://router-api.0g.ai/v1`
- Chat endpoint: `POST https://router-api.0g.ai/v1/chat/completions`
- TEE verification: add `verify_tee: true`

Models listed in the 0G PC API reference:

- `0GM-1.0-35B-A3B`
- `deepseek-v4-pro`
- `deepseek/deepseek-chat-v3-0324`
- `qwen/qwen3-vl-30b-a3b-instruct`
- `qwen3.6-plus`
- `zai-org/GLM-5-FP8`
- `zai-org/GLM-5.1-FP8`
- `z-image`
- `openai/whisper-large-v3`

Python example:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://router-api.0g.ai/v1",
    api_key="<0G_PC_API_KEY>",
)

response = client.chat.completions.create(
    model="qwen3.6-plus",
    messages=[{"role": "user", "content": "Hello!"}],
    verify_tee=True,
)
```

## Endpoint Smoke Test

```bash
npm run build
npm run smoke
```

The smoke test checks:

- `/api/v1/health`
- `/api/v1/status/layers`
- `/api/v1/blacklist/check`
- `/api/dev/store/military-grade`
- `/api/v1/proof/run`
- `/api/v1/handshake/log`
- `/api/v1/auth/challenge`
- `/api/v1/integrity/seal`

## Boundary

This folder is additive. It must not change the mature TITAN Wallet flows:

- Create wallet
- Import wallet
- Export wallet
- Send token
- Swap token
