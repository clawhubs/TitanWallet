import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Contract, Interface, JsonRpcProvider, Wallet, id, isAddress, verifyMessage } from 'ethers';

const DATA_PATH = process.env.TITAN_AGENT_WALLET_CONTROL_PLANE_PATH ||
  join(process.cwd(), '.data', 'agent-wallet-control-plane.json');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const RUNTIME_API_BASE_URL = (
  process.env.TITAN_AGENT_WALLET_RUNTIME_API_BASE_URL ||
  process.env.TITAN_API_BASE_URL ||
  'https://api.yieldboostai.xyz/v1'
).replace(/\/$/, '');
const RUNTIME_API_KEY = process.env.TITAN_AGENT_WALLET_API_KEY?.trim() || process.env.TITAN_API_KEY?.trim() || '';
const DEMO_CHAIN_ID = 16661;
const DEMO_NETWORK_NAME = '0G Mainnet';
const DEMO_RPC_URL = process.env.TITAN_DEMO_0G_RPC_URL?.trim() || 'https://evmrpc.0g.ai';
const DEMO_APPROVED_RECIPIENT = normalizeAddress(
  process.env.TITAN_DEMO_APPROVED_RECIPIENT || '0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D',
  true,
) || '0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D';
const DEMO_SECURITY_REGISTRY_ADDRESS = normalizeAddress(
  process.env.TITAN_DEMO_SECURITY_REGISTRY_ADDRESS || '0x05240D9636605e6cE1CFbCB03189e563f484F4DF',
  true,
) || '0x05240D9636605e6cE1CFbCB03189e563f484F4DF';
const DEMO_WALLET_PRIVATE_KEY = process.env.TITAN_DEMO_WALLET_PRIVATE_KEY?.trim() || '';
const DEMO_OWNER_RUN_TOKEN = process.env.TITAN_DEMO_OWNER_RUN_TOKEN?.trim() || '';
const DEMO_API_KEY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEMO_AGENT_WALLET_ID = 'agent_demo_001';
const DEMO_CAPABILITY_ID = 'cap_invoice_001';
const DEMO_MAX_AMOUNT_TEST = '0.01';
const DEMO_MAX_AMOUNT_WEI = '10000000000000000';

const WALLET_SECURITY_REGISTRY_ABI = [
  'function recordWalletSecurity(string action, string storageId, bytes32 sourceTxHash, bytes32 integrityHash, string context) external returns (uint256 logId)',
  'event WalletSecurityLogged(uint256 indexed logId,address indexed owner,bytes32 indexed actionHash,string action,string storageId,bytes32 sourceTxHash,bytes32 integrityHash,string context,uint64 timestamp)',
];

const walletSecurityRegistryInterface = new Interface(WALLET_SECURITY_REGISTRY_ABI);

const TEN_LAYERS = [
  'Hallucination Blacklist',
  'Integrity Auditor',
  'Secure Compute / TEE',
  'Sovereign Memory',
  '0G Storage Proof Layer',
  'Zero-Knowledge Proof Layer',
  'ProofRegistry Anchor',
  'Programmable Governance',
  'Cross-Agent Neural Handshake',
  'AWS Nitro Enclaves',
];

const DEFAULT_ALLOWED_ACTIONS = [
  'agent-intent-check',
  'agent-memory-seal',
  'agent-send',
  'agent-sign',
  'agent-simulate',
  'agent-tool-result',
];

export async function handleAgentWalletControlPlane(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { success: false, error: 'Method not allowed.' });
  }

  const body = await readJsonBody(request);
  const action = typeof body.action === 'string' ? body.action : '';
  const store = await loadStore();
  refreshExpirations(store);

  if (action === 'health') {
    return sendJson(response, 200, {
      success: true,
      control_plane_path: DATA_PATH,
      owner_sessions: Object.keys(store.sessions).length,
      projects: Object.keys(store.projects).length,
      agent_wallets: Object.keys(store.agent_wallets).length,
      capabilities: Object.keys(store.capabilities).length,
      proof_logs: Object.keys(store.proof_logs).length,
      security_logs: Object.keys(store.security_logs).length,
      demo_api_keys: Object.keys(store.demo_api_keys).length,
      runtime_api_base_url: RUNTIME_API_BASE_URL,
      runtime_api_key_loaded: Boolean(RUNTIME_API_KEY),
      demo_live_anchor_ready: Boolean(DEMO_WALLET_PRIVATE_KEY && DEMO_OWNER_RUN_TOKEN),
    });
  }

  if (action === 'demo_status') {
    return sendJson(response, 200, {
      success: true,
      demo: buildDemoConfig(),
      live_anchor_ready: Boolean(DEMO_WALLET_PRIVATE_KEY && DEMO_OWNER_RUN_TOKEN),
    });
  }

  if (action === 'demo_create_api_key') {
    const apiKey = createDemoApiKey(store, body);
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      api_key: apiKey.plaintext,
      key: maskDemoApiKey(apiKey.record),
      demo: buildDemoConfig(),
    });
  }

  if (action === 'demo_check_intent') {
    const demoAuth = requireDemoApiKey(request, body, store);
    if (!demoAuth.ok) {
      return sendJson(response, demoAuth.status || 401, { success: false, error: demoAuth.error });
    }

    const result = evaluateDemoIntent({
      store,
      key: demoAuth.key,
      body,
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      ...result,
    });
  }

  if (action === 'demo_get_logs') {
    const demoAuth = requireDemoApiKey(request, body, store);
    if (!demoAuth.ok) {
      return sendJson(response, demoAuth.status || 401, { success: false, error: demoAuth.error });
    }

    const limit = clampNumber(toFiniteNumber(body.limit), 1, 100, 30);
    return sendJson(response, 200, {
      success: true,
      proof_logs: listDemoProofLogs(store, demoAuth.key.id).slice(0, limit),
      security_logs: listDemoSecurityLogs(store, demoAuth.key.id).slice(0, limit),
    });
  }

  if (action === 'demo_anchor_security_log') {
    const demoAuth = requireDemoApiKey(request, body, store);
    if (!demoAuth.ok) {
      return sendJson(response, demoAuth.status || 401, { success: false, error: demoAuth.error });
    }
    if (!DEMO_WALLET_PRIVATE_KEY || !DEMO_OWNER_RUN_TOKEN) {
      return sendJson(response, 503, {
        success: false,
        error: 'Owner-only live anchor is not configured on this server.',
      });
    }
    const runToken = String(request.headers['x-titan-demo-run-token'] || body.owner_run_token || '');
    if (!safeStringEqual(runToken, DEMO_OWNER_RUN_TOKEN)) {
      return sendJson(response, 403, {
        success: false,
        error: 'Owner-only live anchor token is required.',
      });
    }

    try {
      const proofLog = appendDemoProofLog(store, {
        key: demoAuth.key,
        type: 'Owner Live Security Anchor Requested',
        status: 'recording',
        policyResult: 'allowed',
        reason: 'Owner requested a live 0G mainnet security anchor for the demo rail.',
        intent: 'Record owner-only live security anchor for TITAN Agent Intent Demo.',
        actionName: 'demo_security_anchor',
        amount: '0',
        recipient: DEMO_APPROVED_RECIPIENT,
        mode: 'live',
      });
      const anchor = await anchorDemoSecurityLog({
        proofLog,
        key: demoAuth.key,
      });
      const securityLog = appendDemoSecurityLog(store, {
        key: demoAuth.key,
        proofLogId: proofLog.id,
        type: '0G Mainnet Security Anchor',
        status: 'anchored',
        reason: 'Owner-only security log anchor recorded on 0G mainnet.',
        mode: 'live',
        txHash: anchor.txHash,
        logId: anchor.logId,
        registryAddress: DEMO_SECURITY_REGISTRY_ADDRESS,
        metadata: {
          explorer_url: anchor.explorerUrl,
          action: 'demo_security_anchor',
        },
      });
      proofLog.status = 'anchored';
      proofLog.metadata.anchor_status = 'anchored';
      proofLog.metadata.security_log_id = securityLog.id;
      proofLog.metadata.security_log_tx_hash = anchor.txHash;
      await saveStore(store);
      return sendJson(response, 200, {
        success: true,
        proof_log: proofLog,
        security_log: securityLog,
        anchor,
      });
    } catch (error) {
      const securityLog = appendDemoSecurityLog(store, {
        key: demoAuth.key,
        type: '0G Mainnet Security Anchor Failed',
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Live security anchor failed.',
        mode: 'live',
      });
      await saveStore(store);
      return sendJson(response, 500, {
        success: false,
        error: securityLog.reason,
        security_log: securityLog,
      });
    }
  }

  if (action === 'auth_challenge') {
    const owner = normalizeAddress(body.owner_wallet_address);
    if (!owner) {
      return sendJson(response, 400, { success: false, error: 'owner_wallet_address is required.' });
    }

    const challengeId = `chal_${randomUUID()}`;
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const message = [
      'TITAN Agent Wallet',
      `Owner: ${owner}`,
      `Challenge: ${challengeId}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt}`,
    ].join('\n');

    store.challenges[challengeId] = {
      owner_wallet_address: owner,
      nonce,
      message,
      expires_at: expiresAt,
      used: false,
    };
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      challenge_id: challengeId,
      owner_wallet_address: owner,
      message,
      expires_at: expiresAt,
    });
  }

  if (action === 'auth_verify') {
    const challengeId = typeof body.challenge_id === 'string' ? body.challenge_id : '';
    const signature = typeof body.signature === 'string' ? body.signature : '';
    const challenge = store.challenges[challengeId];
    if (!challenge || challenge.used || Date.parse(challenge.expires_at) <= Date.now()) {
      return sendJson(response, 401, { success: false, error: 'Challenge is invalid or expired.' });
    }

    const recovered = verifyMessage(challenge.message, signature);
    if (recovered.toLowerCase() !== challenge.owner_wallet_address.toLowerCase()) {
      return sendJson(response, 401, { success: false, error: 'Owner signature does not match wallet.' });
    }

    challenge.used = true;
    const sessionToken = `titan_owner_${randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    store.sessions[sessionToken] = {
      owner_wallet_address: challenge.owner_wallet_address,
      expires_at: expiresAt,
    };
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      owner_wallet_address: challenge.owner_wallet_address,
      owner_session_token: sessionToken,
      expires_at: expiresAt,
    });
  }

  if (action === 'check_intent') {
    const runtimeAuth = requireCapability(body, store);
    if (!runtimeAuth.ok) {
      return sendJson(response, 401, { success: false, error: runtimeAuth.error });
    }

    const result = await evaluateIntentCheck({
      store,
      capability: runtimeAuth.capability,
      body,
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      ...result,
    });
  }

  if (action === 'record_runtime_result') {
    const runtimeAuth = requireCapability(body, store);
    if (!runtimeAuth.ok) {
      return sendJson(response, 401, { success: false, error: runtimeAuth.error });
    }

    const capability = runtimeAuth.capability;
    const agentWallet = store.agent_wallets[capability.agent_wallet_id] || null;
    const proofLog = appendProofLog(store, {
      owner_wallet_address: capability.owner_wallet_address,
      project_id: capability.project_id,
      agent_wallet_id: capability.agent_wallet_id,
      capability_id: capability.id,
      category: 'runtime',
      type: typeof body.type === 'string' && body.type.trim() ? body.type.trim() : 'Runtime Action Result',
      status: sanitizeLogStatus(body.status, 'recorded'),
      reason: typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'Runtime result recorded.',
      intent: typeof body.intent === 'string' ? body.intent : null,
      requested_action: typeof body.requested_action === 'string' ? body.requested_action : null,
      requested_chain_id: toFiniteNumber(body.requested_chain_id),
      requested_contract_address: normalizeAddress(body.requested_contract_address, true) || null,
      requested_destination: normalizeAddress(body.requested_destination, true) || null,
      requested_amount_wei: normalizeBigIntString(body.requested_amount_wei) || null,
      metadata: {
        tx_hash: typeof body.tx_hash === 'string' ? body.tx_hash : null,
        proof_request_id: typeof body.proof_request_id === 'string' ? body.proof_request_id : null,
        seal_storage_id: typeof body.seal_storage_id === 'string' ? body.seal_storage_id : null,
        handshake_request_id: typeof body.handshake_request_id === 'string' ? body.handshake_request_id : null,
        security_log_tx_hash: typeof body.security_log_tx_hash === 'string' ? body.security_log_tx_hash : null,
        receipt_block_number: toFiniteNumber(body.receipt_block_number),
        agent_wallet_status: agentWallet?.status || null,
        ...(isObject(body.metadata) ? body.metadata : {}),
      },
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      proof_log: proofLog,
    });
  }

  if (action === 'get_capability') {
    const ownerSession = requireSession(request, body, store);
    const runtimeAuth = requireCapability(body, store);
    if (!ownerSession.ok && !runtimeAuth.ok) {
      return sendJson(response, 401, { success: false, error: runtimeAuth.error || ownerSession.error });
    }

    const capability = runtimeAuth.ok
      ? runtimeAuth.capability
      : findCapabilityForOwner(store, ownerSession.owner, body.capability_id);
    if (!capability) {
      return sendJson(response, 404, { success: false, error: 'Capability not found.' });
    }

    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability,
      project: store.projects[capability.project_id] || null,
      agent_wallet: store.agent_wallets[capability.agent_wallet_id] || null,
    });
  }

  if (action === 'get_proof_log') {
    const ownerSession = requireSession(request, body, store);
    const runtimeAuth = requireCapability(body, store);
    if (!ownerSession.ok && !runtimeAuth.ok) {
      return sendJson(response, 401, { success: false, error: runtimeAuth.error || ownerSession.error });
    }

    const limit = clampNumber(toFiniteNumber(body.limit), 1, 200, 50);
    const proofLogs = ownerSession.ok
      ? listOwnerProofLogs(store, ownerSession.owner, body).slice(0, limit)
      : listCapabilityProofLogs(store, runtimeAuth.capability.id).slice(0, limit);
    return sendJson(response, 200, {
      success: true,
      total: proofLogs.length,
      items: proofLogs,
    });
  }

  const session = requireSession(request, body, store);
  if (!session.ok) {
    return sendJson(response, 401, { success: false, error: session.error });
  }

  if (action === 'dashboard') {
    return sendJson(response, 200, buildDashboard(store, session.owner));
  }

  if (action === 'create_project') {
    const project = {
      id: `proj_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      owner_wallet_address: session.owner,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Agent Wallet Project',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    store.projects[project.id] = project;
    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: project.id,
      category: 'project',
      type: 'Developer Project Created',
      status: 'active',
      reason: 'Owner created a developer project.',
      metadata: { project_name: project.name },
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      project,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'set_project_status') {
    const projectId = typeof body.project_id === 'string' ? body.project_id : '';
    const project = store.projects[projectId];
    const status = body.status === 'disabled' ? 'disabled' : 'active';
    if (!project || project.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Project not found for owner wallet.' });
    }
    project.status = status;
    project.disabled_at = status === 'disabled' ? new Date().toISOString() : null;
    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: project.id,
      category: 'admin',
      type: status === 'disabled' ? 'Developer Project Disabled' : 'Developer Project Re-enabled',
      status,
      reason: status === 'disabled'
        ? 'Owner disabled the project and blocked new agent actions.'
        : 'Owner re-enabled the project.',
      metadata: { project_name: project.name },
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      project,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'create_agent_wallet') {
    const projectId = typeof body.project_id === 'string' ? body.project_id : '';
    const project = store.projects[projectId];
    if (!project || project.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Project not found for owner wallet.' });
    }
    if (project.status !== 'active') {
      return sendJson(response, 409, { success: false, error: 'Project must be active before creating an agent wallet.' });
    }
    const agentWallet = {
      id: `aw_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      project_id: projectId,
      owner_wallet_address: session.owner,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Autonomous Agent Wallet',
      status: 'active',
      layers: TEN_LAYERS,
      created_at: new Date().toISOString(),
    };
    store.agent_wallets[agentWallet.id] = agentWallet;
    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: project.id,
      agent_wallet_id: agentWallet.id,
      category: 'agent_wallet',
      type: 'Agent Wallet Created',
      status: 'active',
      reason: 'Owner created an agent wallet under the project.',
      metadata: { agent_wallet_name: agentWallet.name },
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      agent_wallet: agentWallet,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'set_agent_wallet_status') {
    const agentWalletId = typeof body.agent_wallet_id === 'string' ? body.agent_wallet_id : '';
    const agentWallet = store.agent_wallets[agentWalletId];
    const status = body.status === 'paused' ? 'paused' : 'active';
    if (!agentWallet || agentWallet.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Agent wallet not found for owner wallet.' });
    }
    agentWallet.status = status;
    agentWallet.paused_at = status === 'paused' ? new Date().toISOString() : null;
    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: agentWallet.project_id,
      agent_wallet_id: agentWallet.id,
      category: 'admin',
      type: status === 'paused' ? 'Agent Wallet Paused' : 'Agent Wallet Resumed',
      status,
      reason: status === 'paused'
        ? 'Owner paused the agent wallet and blocked runtime execution.'
        : 'Owner resumed the agent wallet.',
      metadata: { agent_wallet_name: agentWallet.name },
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      agent_wallet: agentWallet,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'issue_capability') {
    const agentWalletId = typeof body.agent_wallet_id === 'string' ? body.agent_wallet_id : '';
    const agentWallet = store.agent_wallets[agentWalletId];
    if (!agentWallet || agentWallet.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Agent wallet not found for owner wallet.' });
    }
    const project = store.projects[agentWallet.project_id];
    if (!project || project.status !== 'active') {
      return sendJson(response, 409, { success: false, error: 'Project must be active before issuing a capability.' });
    }
    if (agentWallet.status !== 'active') {
      return sendJson(response, 409, { success: false, error: 'Agent wallet must be active before issuing a capability.' });
    }

    const capability = buildCapability({
      owner: session.owner,
      agentWallet,
      body,
    });
    store.capabilities[capability.id] = capability;
    const proofLog = appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: capability.project_id,
      agent_wallet_id: capability.agent_wallet_id,
      capability_id: capability.id,
      category: 'capability',
      type: 'Capability Issued',
      status: 'active',
      reason: 'Owner issued a scoped runtime capability.',
      metadata: {
        allowed_actions: capability.policy.allowed_actions,
        allowed_chain_ids: capability.policy.allowed_chain_ids,
        allowed_contracts: capability.policy.allowed_contracts,
        allowed_destinations: capability.policy.allowed_destinations,
      },
    });
    capability.proof_log_id = proofLog.id;
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'rotate_capability') {
    const capabilityId = typeof body.capability_id === 'string' ? body.capability_id : '';
    const capability = store.capabilities[capabilityId];
    if (!capability || capability.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Capability not found for owner wallet.' });
    }
    capability.status = 'revoked';
    capability.revoked_at = new Date().toISOString();
    const agentWallet = store.agent_wallets[capability.agent_wallet_id];
    const nextCapability = buildCapability({
      owner: session.owner,
      agentWallet,
      body: {
        ...capability.policy,
        agent_wallet_id: capability.agent_wallet_id,
      },
      overrides: {
        rotated_from: capability.id,
      },
    });
    store.capabilities[nextCapability.id] = nextCapability;

    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: capability.project_id,
      agent_wallet_id: capability.agent_wallet_id,
      capability_id: capability.id,
      category: 'admin',
      type: 'Capability Rotated',
      status: 'rotated',
      reason: 'Owner rotated the capability token and revoked the previous secret.',
      metadata: { replacement_capability_id: nextCapability.id },
    });
    const proofLog = appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: nextCapability.project_id,
      agent_wallet_id: nextCapability.agent_wallet_id,
      capability_id: nextCapability.id,
      category: 'capability',
      type: 'Capability Issued',
      status: 'active',
      reason: 'A replacement capability was issued after rotation.',
      metadata: { rotated_from: capability.id },
    });
    nextCapability.proof_log_id = proofLog.id;
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability: nextCapability,
      revoked_capability_id: capability.id,
      ...buildDashboard(store, session.owner),
    });
  }

  if (action === 'revoke_capability') {
    const capabilityId = typeof body.capability_id === 'string' ? body.capability_id : '';
    const capability = store.capabilities[capabilityId];
    if (!capability || capability.owner_wallet_address.toLowerCase() !== session.owner.toLowerCase()) {
      return sendJson(response, 404, { success: false, error: 'Capability not found for owner wallet.' });
    }
    capability.status = 'revoked';
    capability.revoked_at = new Date().toISOString();
    appendProofLog(store, {
      owner_wallet_address: session.owner,
      project_id: capability.project_id,
      agent_wallet_id: capability.agent_wallet_id,
      capability_id: capability.id,
      category: 'admin',
      type: 'Capability Revoked',
      status: 'revoked',
      reason: 'Owner revoked the capability token.',
    });
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability,
      ...buildDashboard(store, session.owner),
    });
  }

  return sendJson(response, 400, { success: false, error: 'Unknown action.' });
}

function buildCapability(input) {
  const allowedActions = sanitizeActions(bodyArray(input.body.allowed_actions), DEFAULT_ALLOWED_ACTIONS);
  return {
    id: `cap_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    token: `titan_cap_${randomBytes(24).toString('hex')}`,
    agent_wallet_id: input.agentWallet.id,
    project_id: input.agentWallet.project_id,
    owner_wallet_address: input.owner,
    status: 'active',
    policy: {
      max_value_wei: normalizeBigIntString(input.body.max_value_wei) || '10000000000000000',
      daily_limit_wei: normalizeBigIntString(input.body.daily_limit_wei) || '50000000000000000',
      allowed_actions: allowedActions,
      allowed_chain_ids: sanitizeNumberArray(input.body.allowed_chain_ids, [16661]),
      allowed_contracts: sanitizeAddressArray(input.body.allowed_contracts),
      allowed_destinations: sanitizeAddressArray(input.body.allowed_destinations),
      expires_at: typeof input.body.expires_at === 'string' && input.body.expires_at
        ? input.body.expires_at
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    created_at: new Date().toISOString(),
    rotated_from: input.overrides?.rotated_from || null,
    last_checked_at: null,
    proof_log_id: null,
  };
}

async function evaluateIntentCheck(input) {
  const { store, capability, body } = input;
  const project = store.projects[capability.project_id] || null;
  const agentWallet = store.agent_wallets[capability.agent_wallet_id] || null;
  const intent = typeof body.intent === 'string' ? body.intent.trim() : '';
  const requestedAction = typeof body.requested_action === 'string'
    ? body.requested_action.trim()
    : typeof body.action_name === 'string'
      ? body.action_name.trim()
      : 'agent-intent-check';
  const requestedChainId = toFiniteNumber(body.requested_chain_id);
  const requestedDestination = normalizeAddress(body.requested_destination || body.to, true) || null;
  const requestedContract = normalizeAddress(body.requested_contract_address || body.contract_address, true) || null;
  const requestedAmountWei = normalizeBigIntString(body.requested_amount_wei || body.amount_wei) || null;
  const ownerWalletAddress = normalizeAddress(body.owner_wallet_address, true) || null;
  const toolSummary = typeof body.tool_summary === 'string' ? body.tool_summary.trim() : null;

  let allowed = true;
  let reason = 'Intent allowed by capability policy.';

  if (!project) {
    allowed = false;
    reason = 'Project for this capability no longer exists.';
  } else if (project.status !== 'active') {
    allowed = false;
    reason = 'Project is disabled.';
  } else if (!agentWallet) {
    allowed = false;
    reason = 'Agent wallet for this capability no longer exists.';
  } else if (agentWallet.status !== 'active') {
    allowed = false;
    reason = 'Agent wallet is paused.';
  } else if (capability.status !== 'active') {
    allowed = false;
    reason = capability.status === 'expired' ? 'Capability is expired.' : 'Capability is not active.';
  } else if (ownerWalletAddress && ownerWalletAddress.toLowerCase() !== capability.owner_wallet_address.toLowerCase()) {
    allowed = false;
    reason = 'Owner wallet does not match this capability.';
  } else if (
    typeof body.project_id === 'string' &&
    body.project_id &&
    body.project_id !== capability.project_id
  ) {
    allowed = false;
    reason = 'Project does not match this capability.';
  } else if (
    typeof body.agent_wallet_id === 'string' &&
    body.agent_wallet_id &&
    body.agent_wallet_id !== capability.agent_wallet_id
  ) {
    allowed = false;
    reason = 'Agent wallet does not match this capability.';
  } else if (
    capability.policy.allowed_actions.length &&
    !capability.policy.allowed_actions.includes(requestedAction)
  ) {
    allowed = false;
    reason = `Action \`${requestedAction}\` is not allowed by capability policy.`;
  } else if (
    requestedChainId !== null &&
    capability.policy.allowed_chain_ids.length &&
    !capability.policy.allowed_chain_ids.includes(requestedChainId)
  ) {
    allowed = false;
    reason = `Chain ${requestedChainId} is not allowed by capability policy.`;
  } else if (
    requestedDestination &&
    capability.policy.allowed_destinations.length &&
    !capability.policy.allowed_destinations.some((address) => address.toLowerCase() === requestedDestination.toLowerCase())
  ) {
    allowed = false;
    reason = 'Destination address is not on the allowlist.';
  } else if (
    requestedContract &&
    capability.policy.allowed_contracts.length &&
    !capability.policy.allowed_contracts.some((address) => address.toLowerCase() === requestedContract.toLowerCase())
  ) {
    allowed = false;
    reason = 'Contract address is not on the allowlist.';
  } else if (
    requestedAmountWei &&
    BigInt(requestedAmountWei) > BigInt(capability.policy.max_value_wei)
  ) {
    allowed = false;
    reason = 'Requested amount exceeds capability max_value_wei.';
  } else if (requestedAmountWei) {
    const spentToday = computeCapabilityDailySpendWei(store, capability.id);
    const nextDailyTotal = spentToday + BigInt(requestedAmountWei);
    if (nextDailyTotal > BigInt(capability.policy.daily_limit_wei)) {
      allowed = false;
      reason = 'Requested amount exceeds capability daily_limit_wei.';
    }
  }

  const blacklist = await checkBlacklistIntent({
    intent,
    toolSummary,
  });
  if (allowed && blacklist.allowed === false) {
    allowed = false;
    reason = blacklist.reason || 'Blocked by TITAN hallucination blacklist.';
  }

  capability.last_checked_at = new Date().toISOString();

  const proofLog = appendProofLog(store, {
    owner_wallet_address: capability.owner_wallet_address,
    project_id: capability.project_id,
    agent_wallet_id: capability.agent_wallet_id,
    capability_id: capability.id,
    category: 'intent',
    type: 'Capability Intent Check',
    status: allowed ? 'allowed' : 'blocked',
    reason,
    intent: intent || null,
    requested_action: requestedAction,
    requested_chain_id: requestedChainId,
    requested_contract_address: requestedContract,
    requested_destination: requestedDestination,
    requested_amount_wei: requestedAmountWei,
    blacklist_allowed: blacklist.allowed,
    metadata: {
      blacklist_request_id: blacklist.request_id,
      blacklist_status: blacklist.status,
      actor: typeof body.actor === 'string' ? body.actor : null,
      session_id: typeof body.session_id === 'string' ? body.session_id : null,
      tool_summary: toolSummary,
      matched_policy: capability.policy,
      ...(isObject(body.metadata) ? body.metadata : {}),
    },
  });

  return {
    allowed,
    reason,
    matched_policy: capability.policy,
    capability_id: capability.id,
    project_id: capability.project_id,
    agent_wallet_id: capability.agent_wallet_id,
    proof_log_id: proofLog.id,
    timestamp: proofLog.created_at,
    blacklist: blacklist,
  };
}

function buildDemoConfig() {
  return {
    name: 'TITAN Agent Intent Demo',
    mode: 'simulation',
    owner_wallet: getDemoOwnerAddress(),
    agent_wallet_id: DEMO_AGENT_WALLET_ID,
    capability_id: DEMO_CAPABILITY_ID,
    capability_name: 'Invoice Payment Capability',
    action: 'pay_invoice',
    max_amount: DEMO_MAX_AMOUNT_TEST,
    max_amount_wei: DEMO_MAX_AMOUNT_WEI,
    token: 'TEST',
    approved_recipient: DEMO_APPROVED_RECIPIENT,
    policy_window: '24h simulated',
    chain_id: DEMO_CHAIN_ID,
    network: DEMO_NETWORK_NAME,
    live_anchor_registry: DEMO_SECURITY_REGISTRY_ADDRESS,
    layers: TEN_LAYERS,
  };
}

function createDemoApiKey(store, body) {
  const plaintext = `titan_demo_${randomBytes(24).toString('hex')}`;
  const now = new Date();
  const record = {
    id: `dkey_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    token_hash: hashSecret(plaintext),
    prefix: `${plaintext.slice(0, 20)}...`,
    label: typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Developer API Demo Key',
    status: 'active',
    scopes: ['demo:check_intent', 'demo:read_logs', 'demo:simulation'],
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + DEMO_API_KEY_TTL_MS).toISOString(),
    last_used_at: null,
  };
  store.demo_api_keys[record.id] = record;
  appendDemoSecurityLog(store, {
    key: record,
    type: 'Demo API Key Created',
    status: 'active',
    reason: 'A simulation-only API key was created for the TITAN Agent Intent Demo.',
    mode: 'simulation',
    metadata: {
      scopes: record.scopes,
      prefix: record.prefix,
    },
  });
  return { plaintext, record };
}

function requireDemoApiKey(request, body, store) {
  const token = String(request.headers['x-titan-demo-api-key'] || body.demo_api_key || '').trim();
  if (!token) {
    return { ok: false, status: 401, error: 'demo_api_key is required.' };
  }
  const tokenHash = hashSecret(token);
  const key = Object.values(store.demo_api_keys).find((item) => safeStringEqual(item.token_hash, tokenHash));
  if (!key) {
    return { ok: false, status: 401, error: 'Demo API key is invalid.' };
  }
  if (key.status !== 'active') {
    return { ok: false, status: 403, error: 'Demo API key is not active.' };
  }
  if (Date.parse(key.expires_at) <= Date.now()) {
    key.status = 'expired';
    return { ok: false, status: 403, error: 'Demo API key is expired.' };
  }
  key.last_used_at = new Date().toISOString();
  return { ok: true, key };
}

function evaluateDemoIntent(input) {
  const { store, key, body } = input;
  const scenario = typeof body.scenario === 'string' ? body.scenario : 'custom';
  const intent = typeof body.intent === 'string' && body.intent.trim()
    ? body.intent.trim()
    : scenario === 'blocked'
      ? 'Send all wallet balance to unknown address'
      : 'Pay approved vendor invoice';
  const actionName = typeof body.requested_action === 'string' && body.requested_action.trim()
    ? body.requested_action.trim()
    : typeof body.action === 'string' && body.action.trim()
      ? body.action.trim()
      : scenario === 'blocked'
        ? 'transfer'
        : 'pay_invoice';
  const amount = typeof body.amount === 'string' && body.amount.trim()
    ? body.amount.trim()
    : scenario === 'blocked'
      ? '999'
      : DEMO_MAX_AMOUNT_TEST;
  const recipientRaw = typeof body.recipient === 'string' && body.recipient.trim()
    ? body.recipient.trim()
    : typeof body.to === 'string' && body.to.trim()
      ? body.to.trim()
      : scenario === 'blocked'
        ? '0xUnknownAddress'
        : DEMO_APPROVED_RECIPIENT;
  const amountNumber = Number.parseFloat(amount);
  const recipient = normalizeAddress(recipientRaw, true);

  const reasons = [];
  if (actionName !== 'pay_invoice') {
    reasons.push('Intent action is outside the invoice-payment capability.');
  }
  if (!Number.isFinite(amountNumber) || amountNumber > Number.parseFloat(DEMO_MAX_AMOUNT_TEST)) {
    reasons.push('Amount exceeds the 0.01 TEST capability limit.');
  }
  if (!recipient || recipient.toLowerCase() !== DEMO_APPROVED_RECIPIENT.toLowerCase()) {
    reasons.push('Recipient is not the approved vendor address.');
  }

  const allowed = reasons.length === 0;
  const reason = allowed
    ? 'Intent matches capability policy. Amount and recipient are allowed.'
    : reasons.join(' ');
  const policyResult = allowed ? 'allowed' : 'blocked';
  const railStatus = allowed ? '10-layer rail passed' : '10-layer rail enforced';
  const anchorStatus = 'recorded';

  const proofLog = appendDemoProofLog(store, {
    key,
    type: 'Agent Intent Policy Check',
    status: policyResult,
    policyResult,
    reason,
    intent,
    actionName,
    amount,
    recipient: recipient || null,
    rawRecipient: recipientRaw,
    mode: 'simulation',
    metadata: {
      scenario,
      token: 'TEST',
      rail_status: railStatus,
      anchor_status: anchorStatus,
    },
  });
  const securityLog = appendDemoSecurityLog(store, {
    key,
    proofLogId: proofLog.id,
    type: allowed ? 'Allowed Intent Security Log' : 'Blocked Intent Security Log',
    status: allowed ? 'passed' : 'enforced',
    reason: allowed
      ? 'Security rail accepted the scoped invoice payment intent.'
      : 'Security rail blocked the unsafe wallet action before execution.',
    mode: 'simulation',
    metadata: {
      policy_result: policyResult,
      proof_log_id: proofLog.id,
      action: actionName,
    },
  });

  return {
    allowed,
    reason,
    policyResult,
    proofId: proofLog.id,
    proofHash: id(JSON.stringify({
      proof_log_id: proofLog.id,
      intent,
      actionName,
      amount,
      recipient: recipientRaw,
      policyResult,
      created_at: proofLog.created_at,
    })),
    anchorStatus,
    railStatus,
    mode: 'simulation',
    ownerWallet: getDemoOwnerAddress(),
    agentWalletId: DEMO_AGENT_WALLET_ID,
    capabilityId: DEMO_CAPABILITY_ID,
    securityLogId: securityLog.id,
    proofLog,
    securityLog,
    evidence: buildDemoEvidence(policyResult),
  };
}

function buildDemoEvidence(policyResult) {
  const blocked = policyResult === 'blocked';
  const statuses = blocked
    ? [
        'Enforced',
        'Passed',
        'Active',
        'Recorded',
        'Recorded',
        'Prepared',
        'Anchored',
        'Blocked by policy',
        'Verified',
        'Active',
      ]
    : [
        'Passed',
        'Passed',
        'Active',
        'Recorded',
        'Recorded',
        'Prepared',
        'Anchored',
        'Passed',
        'Verified',
        'Active',
      ];
  return TEN_LAYERS.map((name, index) => ({
    id: `L${String(index + 1).padStart(2, '0')}`,
    name,
    status: statuses[index],
  }));
}

function appendDemoProofLog(store, input) {
  return appendProofLog(store, {
    owner_wallet_address: getDemoOwnerAddress(),
    project_id: 'demo_project_agent_intent',
    agent_wallet_id: DEMO_AGENT_WALLET_ID,
    capability_id: DEMO_CAPABILITY_ID,
    category: 'intent',
    type: input.type,
    status: input.status,
    reason: input.reason,
    intent: input.intent,
    requested_action: input.actionName,
    requested_chain_id: DEMO_CHAIN_ID,
    requested_destination: input.recipient,
    requested_amount_wei: decimalToDemoWei(input.amount),
    metadata: {
      demo: true,
      demo_api_key_id: input.key.id,
      demo_api_key_prefix: input.key.prefix,
      capability_name: 'Invoice Payment Capability',
      policy_result: input.policyResult,
      raw_recipient: input.rawRecipient || input.recipient,
      mode: input.mode,
      network: DEMO_NETWORK_NAME,
      approved_recipient: DEMO_APPROVED_RECIPIENT,
      policy_window: '24h simulated',
      no_apy: true,
      ...(input.metadata || {}),
    },
  });
}

function appendDemoSecurityLog(store, input) {
  const entry = {
    id: `slog_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    owner_wallet_address: getDemoOwnerAddress(),
    demo_api_key_id: input.key.id,
    proof_log_id: input.proofLogId || null,
    category: 'security',
    type: input.type,
    status: input.status || 'recorded',
    reason: input.reason || '',
    chain_id: DEMO_CHAIN_ID,
    network: DEMO_NETWORK_NAME,
    registry_address: input.registryAddress || null,
    tx_hash: input.txHash || null,
    log_id: input.logId || null,
    mode: input.mode || 'simulation',
    created_at: new Date().toISOString(),
    metadata: {
      demo: true,
      no_apy: true,
      ...(input.metadata || {}),
    },
  };
  store.security_logs[entry.id] = entry;
  return entry;
}

function listDemoProofLogs(store, demoApiKeyId) {
  return Object.values(store.proof_logs)
    .filter((entry) => entry.metadata?.demo === true)
    .filter((entry) => entry.metadata?.demo_api_key_id === demoApiKeyId)
    .sort(sortNewestFirstByCreatedAt);
}

function listDemoSecurityLogs(store, demoApiKeyId) {
  return Object.values(store.security_logs)
    .filter((entry) => entry.demo_api_key_id === demoApiKeyId)
    .sort(sortNewestFirstByCreatedAt);
}

async function anchorDemoSecurityLog(input) {
  const provider = new JsonRpcProvider(DEMO_RPC_URL);
  const wallet = new Wallet(DEMO_WALLET_PRIVATE_KEY, provider);
  const registry = new Contract(DEMO_SECURITY_REGISTRY_ADDRESS, WALLET_SECURITY_REGISTRY_ABI, wallet);
  const storageId = `demo:${input.key.id}:${input.proofLog.id}`;
  const context = [
    'titan-agent-intent-demo',
    `proof=${input.proofLog.id}`,
    `api_key=${input.key.id}`,
    `owner=${wallet.address}`,
    `recipient=${DEMO_APPROVED_RECIPIENT}`,
  ].join('|');
  const tx = await registry.recordWalletSecurity(
    'demo_security_anchor',
    storageId,
    id(`${storageId}:source`),
    id(`${storageId}:integrity`),
    context,
  );
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error('Security anchor receipt did not arrive.');
  }
  const event = receipt.logs
    .filter((log) => log.address.toLowerCase() === DEMO_SECURITY_REGISTRY_ADDRESS.toLowerCase())
    .map((log) => {
      try {
        return walletSecurityRegistryInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((item) => item?.name === 'WalletSecurityLogged');

  return {
    txHash: tx.hash,
    logId: event?.args?.logId?.toString() || null,
    explorerUrl: `https://chainscan.0g.ai/tx/${tx.hash}`,
  };
}

function decimalToDemoWei(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const [whole, fraction = ''] = normalized.split('.');
  return `${whole}${fraction.padEnd(18, '0').slice(0, 18)}`.replace(/^0+(?=\d)/, '') || '0';
}

function maskDemoApiKey(record) {
  return {
    id: record.id,
    prefix: record.prefix,
    label: record.label,
    status: record.status,
    scopes: record.scopes,
    created_at: record.created_at,
    expires_at: record.expires_at,
    last_used_at: record.last_used_at,
  };
}

function hashSecret(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function safeStringEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getDemoOwnerAddress() {
  if (DEMO_WALLET_PRIVATE_KEY) {
    try {
      return new Wallet(DEMO_WALLET_PRIVATE_KEY).address;
    } catch {
      // Fall through to the configured public demo owner.
    }
  }
  return normalizeAddress(process.env.TITAN_DEMO_OWNER_WALLET, true) || DEMO_APPROVED_RECIPIENT;
}

function requireSession(request, body, store) {
  const token = String(request.headers['x-titan-owner-token'] || body.owner_session_token || '');
  const session = store.sessions[token];
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    return { ok: false, error: 'Owner session is missing or expired.' };
  }
  return { ok: true, owner: session.owner_wallet_address };
}

function requireCapability(body, store) {
  const capabilityToken = typeof body.capability_token === 'string' ? body.capability_token.trim() : '';
  if (!capabilityToken) {
    return { ok: false, error: 'capability_token is required.' };
  }
  const capability = findCapabilityByToken(store, capabilityToken);
  if (!capability) {
    return { ok: false, error: 'Capability token is invalid.' };
  }
  return { ok: true, capability };
}

function buildDashboard(store, owner) {
  const ownerLower = owner.toLowerCase();
  const projects = Object.values(store.projects)
    .filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower)
    .sort(sortNewestFirstByCreatedAt);
  const agentWallets = Object.values(store.agent_wallets)
    .filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower)
    .sort(sortNewestFirstByCreatedAt);
  const capabilities = Object.values(store.capabilities)
    .filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower)
    .sort(sortNewestFirstByCreatedAt);
  const proofLogs = listOwnerProofLogs(store, owner, {}).slice(0, 100);

  return {
    success: true,
    owner_wallet_address: owner,
    layers: TEN_LAYERS,
    projects,
    agent_wallets: agentWallets,
    capabilities,
    proof_logs: proofLogs,
  };
}

function appendProofLog(store, input) {
  const entry = {
    id: `plog_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    owner_wallet_address: input.owner_wallet_address,
    project_id: input.project_id || null,
    agent_wallet_id: input.agent_wallet_id || null,
    capability_id: input.capability_id || null,
    category: input.category || 'runtime',
    type: input.type,
    status: input.status || 'recorded',
    reason: input.reason || '',
    intent: input.intent || null,
    requested_action: input.requested_action || null,
    requested_chain_id: input.requested_chain_id ?? null,
    requested_contract_address: input.requested_contract_address || null,
    requested_destination: input.requested_destination || null,
    requested_amount_wei: input.requested_amount_wei || null,
    blacklist_allowed: typeof input.blacklist_allowed === 'boolean' ? input.blacklist_allowed : null,
    created_at: new Date().toISOString(),
    metadata: input.metadata || {},
  };
  store.proof_logs[entry.id] = entry;
  return entry;
}

function findCapabilityByToken(store, token) {
  return Object.values(store.capabilities).find((capability) => capability.token === token) || null;
}

function findCapabilityForOwner(store, owner, capabilityId) {
  if (typeof capabilityId !== 'string' || !capabilityId) {
    return null;
  }
  const capability = store.capabilities[capabilityId];
  if (!capability || capability.owner_wallet_address.toLowerCase() !== owner.toLowerCase()) {
    return null;
  }
  return capability;
}

function listOwnerProofLogs(store, owner, filters) {
  const ownerLower = owner.toLowerCase();
  return Object.values(store.proof_logs)
    .filter((entry) => entry.owner_wallet_address.toLowerCase() === ownerLower)
    .filter((entry) => (typeof filters.project_id === 'string' && filters.project_id ? entry.project_id === filters.project_id : true))
    .filter((entry) => (typeof filters.agent_wallet_id === 'string' && filters.agent_wallet_id ? entry.agent_wallet_id === filters.agent_wallet_id : true))
    .filter((entry) => (typeof filters.capability_id === 'string' && filters.capability_id ? entry.capability_id === filters.capability_id : true))
    .sort(sortNewestFirstByCreatedAt);
}

function listCapabilityProofLogs(store, capabilityId) {
  return Object.values(store.proof_logs)
    .filter((entry) => entry.capability_id === capabilityId)
    .sort(sortNewestFirstByCreatedAt);
}

function computeCapabilityDailySpendWei(store, capabilityId) {
  const todayKey = new Date().toISOString().slice(0, 10);
  return Object.values(store.proof_logs).reduce((total, entry) => {
    if (entry.capability_id !== capabilityId || entry.category !== 'runtime' || entry.created_at.slice(0, 10) !== todayKey) {
      return total;
    }
    if (entry.status !== 'executed' && entry.status !== 'recorded') {
      return total;
    }
    if (!entry.requested_amount_wei || !/^\d+$/.test(entry.requested_amount_wei)) {
      return total;
    }
    return total + BigInt(entry.requested_amount_wei);
  }, 0n);
}

async function checkBlacklistIntent(input) {
  if (!input.intent && !input.toolSummary) {
    return { allowed: true, status: 'skipped', request_id: null, reason: null };
  }

  try {
    const response = await fetch(`${RUNTIME_API_BASE_URL}/blacklist/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RUNTIME_API_KEY ? { 'X-API-Key': RUNTIME_API_KEY } : {}),
      },
      body: JSON.stringify({
        text: [input.intent, input.toolSummary].filter(Boolean).join('\n\n'),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        allowed: true,
        status: 'unavailable',
        request_id: null,
        reason: `Blacklist service returned ${response.status}.`,
      };
    }
    return {
      allowed: payload?.allowed !== false,
      status: 'ok',
      request_id: typeof payload?.request_id === 'string' ? payload.request_id : null,
      reason: payload?.allowed === false ? 'Blocked by TITAN blacklist.' : null,
    };
  } catch (error) {
    return {
      allowed: true,
      status: 'unavailable',
      request_id: null,
      reason: error instanceof Error ? error.message : 'Blacklist service unavailable.',
    };
  }
}

function refreshExpirations(store) {
  for (const capability of Object.values(store.capabilities)) {
    if (capability.status === 'active' && Date.parse(capability.policy.expires_at) <= Date.now()) {
      capability.status = 'expired';
    }
  }
  for (const demoKey of Object.values(store.demo_api_keys)) {
    if (demoKey.status === 'active' && Date.parse(demoKey.expires_at) <= Date.now()) {
      demoKey.status = 'expired';
    }
  }
}

async function loadStore() {
  if (!existsSync(DATA_PATH)) {
    return emptyStore();
  }
  try {
    return {
      ...emptyStore(),
      ...JSON.parse(await readFile(DATA_PATH, 'utf8')),
    };
  } catch {
    return emptyStore();
  }
}

async function saveStore(store) {
  await mkdir(dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

function emptyStore() {
  return {
    challenges: {},
    sessions: {},
    projects: {},
    agent_wallets: {},
    capabilities: {},
    proof_logs: {},
    security_logs: {},
    demo_api_keys: {},
  };
}

function sanitizeActions(value, fallback) {
  const actions = Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
  return actions.length ? Array.from(new Set(actions)) : fallback;
}

function bodyArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeAddressArray(value) {
  return bodyArray(value)
    .map((item) => normalizeAddress(item, true))
    .filter(Boolean);
}

function sanitizeNumberArray(value, fallback) {
  const numbers = bodyArray(value)
    .map((item) => (typeof item === 'number' ? item : Number.parseInt(String(item), 10)))
    .filter((item) => Number.isFinite(item));
  return numbers.length ? Array.from(new Set(numbers)) : fallback;
}

function sanitizeLogStatus(value, fallback) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!normalized) {
    return fallback;
  }
  return normalized;
}

function normalizeBigIntString(value) {
  const normalized = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(Math.trunc(value)) : '';
  return /^\d+$/.test(normalized) ? normalized : '';
}

function normalizeAddress(value, optional = false) {
  if (typeof value !== 'string' || !value.trim()) {
    return optional ? '' : '';
  }
  const normalized = value.trim();
  if (!isAddress(normalized)) {
    return optional ? '' : '';
  }
  return normalized;
}

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function sortNewestFirstByCreatedAt(left, right) {
  return Date.parse(right.created_at) - Date.parse(left.created_at);
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  response.end(JSON.stringify(payload));
}
