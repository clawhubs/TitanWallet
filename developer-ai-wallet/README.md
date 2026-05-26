# TITAN Agent Wallet Developer Kit

Developer kit for autonomous wallets protected by the TITAN 10-layer rail.

The AI is BYOK: bring your own model, agent, planner, or local runtime. This package only handles wallet-bound capability, policy checks, proof, seal, handshake, and optional security log anchoring.

## Source Of Authority

The owner wallet must be created or imported in TITAN Wallet first:

`https://wallet.yieldboostai.xyz`

Then open:

`Settings -> Developer`

Create:

- Project
- Agent wallet
- Capability

Copy the generated SDK/CLI env block into your own agent runtime.

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

## SDK

```ts
import { TitanAgentWalletClient } from "@titan/agent-wallet";

const client = new TitanAgentWalletClient({
  baseUrl: "https://wallet.yieldboostai.xyz/api",
  militaryBaseUrl: "https://wallet.yieldboostai.xyz",
  ownerWalletAddress: process.env.TITAN_AGENT_WALLET_OWNER,
  projectId: process.env.TITAN_AGENT_WALLET_PROJECT_ID,
  agentWalletId: process.env.TITAN_AGENT_WALLET_ID,
  capabilityToken: process.env.TITAN_AGENT_WALLET_CAPABILITY,
});

await client.checkIntent({
  intent: "Pay approved vendor invoice",
  actor: "local-agent",
});
```

## CLI

```bash
export TITAN_AGENT_WALLET_BASE_URL="https://wallet.yieldboostai.xyz/api"
export TITAN_AGENT_WALLET_MILITARY_BASE_URL="https://wallet.yieldboostai.xyz"
export TITAN_AGENT_WALLET_OWNER="0x..."
export TITAN_AGENT_WALLET_PROJECT_ID="proj_..."
export TITAN_AGENT_WALLET_ID="aw_..."
export TITAN_AGENT_WALLET_CAPABILITY="titan_cap_..."

node dist/cli.js health
node dist/cli.js layers
node dist/cli.js check-intent --intent "Pay approved vendor invoice"
node dist/cli.js run --action agent-simulate --intent "Prepare capped transfer"
```

## Optional Agent Send

If the developer chooses local signing for an autonomous agent, set a scoped key and RPC in the local runtime.

```bash
export TITAN_AGENT_WALLET_PRIVATE_KEY="0x..."
export TITAN_AGENT_WALLET_RPC_URL="https://evmrpc.0g.ai"

node dist/cli.js send \
  --to "0x..." \
  --value-eth "0.001" \
  --intent "Pay approved vendor invoice" \
  --max-value-wei "10000000000000000"
```

## Docs Playground

Public docs page:

`https://wallet.yieldboostai.xyz/developer/docs`

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
