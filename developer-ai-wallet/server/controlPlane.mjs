import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { isAddress, verifyMessage } from 'ethers';

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
      runtime_api_base_url: RUNTIME_API_BASE_URL,
      runtime_api_key_loaded: Boolean(RUNTIME_API_KEY),
    });
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
