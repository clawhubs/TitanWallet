import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { verifyMessage } from 'ethers';

const DATA_PATH = process.env.TITAN_AGENT_WALLET_CONTROL_PLANE_PATH ||
  join(process.cwd(), '.data', 'agent-wallet-control-plane.json');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function handleAgentWalletControlPlane(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { success: false, error: 'Method not allowed.' });
  }

  const body = await readJsonBody(request);
  const action = typeof body.action === 'string' ? body.action : '';
  const store = await loadStore();

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
      created_at: new Date().toISOString(),
    };
    store.projects[project.id] = project;
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
    const agentWallet = {
      id: `aw_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      project_id: projectId,
      owner_wallet_address: session.owner,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Autonomous Agent Wallet',
      layers: TEN_LAYERS,
      created_at: new Date().toISOString(),
    };
    store.agent_wallets[agentWallet.id] = agentWallet;
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
    const capability = {
      id: `cap_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      token: `titan_cap_${randomBytes(24).toString('hex')}`,
      agent_wallet_id: agentWalletId,
      project_id: agentWallet.project_id,
      owner_wallet_address: session.owner,
      status: 'active',
      policy: {
        max_value_wei: stringOrDefault(body.max_value_wei, '10000000000000000'),
        daily_limit_wei: stringOrDefault(body.daily_limit_wei, '50000000000000000'),
        allowed_chain_ids: arrayOrDefault(body.allowed_chain_ids, [16661]),
        allowed_destinations: Array.isArray(body.allowed_destinations) ? body.allowed_destinations : [],
        expires_at: typeof body.expires_at === 'string' && body.expires_at
          ? body.expires_at
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      created_at: new Date().toISOString(),
    };
    store.capabilities[capability.id] = capability;
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability,
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
    await saveStore(store);
    return sendJson(response, 200, {
      success: true,
      capability,
      ...buildDashboard(store, session.owner),
    });
  }

  return sendJson(response, 400, { success: false, error: 'Unknown action.' });
}

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

function requireSession(request, body, store) {
  const token = String(request.headers['x-titan-owner-token'] || body.owner_session_token || '');
  const session = store.sessions[token];
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    return { ok: false, error: 'Owner session is missing or expired.' };
  }
  return { ok: true, owner: session.owner_wallet_address };
}

function buildDashboard(store, owner) {
  const ownerLower = owner.toLowerCase();
  const projects = Object.values(store.projects).filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower);
  const agentWallets = Object.values(store.agent_wallets).filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower);
  const capabilities = Object.values(store.capabilities).filter((item) => item.owner_wallet_address.toLowerCase() === ownerLower);
  return {
    success: true,
    owner_wallet_address: owner,
    layers: TEN_LAYERS,
    projects,
    agent_wallets: agentWallets,
    capabilities,
  };
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
  };
}

function normalizeAddress(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value.trim())) {
    return '';
  }
  return value.trim();
}

function stringOrDefault(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function arrayOrDefault(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
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
