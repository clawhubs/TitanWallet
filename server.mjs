import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAgentWalletControlPlane } from './developer-ai-wallet/server/controlPlane.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
await loadLocalEnvFiles();
const rootDir = join(__dirname, 'dist');
const indexPath = join(rootDir, 'index.html');
const port = Number.parseInt(process.env.PORT || '4173', 10);
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const apiV1Target = 'https://api.yieldboostai.xyz/v1';
const militaryGradeTarget = 'https://dev.yieldboostai.xyz/api/dev/store/military-grade';
const serverApiKey = process.env.TITAN_AGENT_WALLET_API_KEY?.trim() || process.env.TITAN_API_KEY?.trim() || '';
const serverMilitaryGradeAuth =
  process.env.TITAN_AGENT_WALLET_MILITARY_GRADE_AUTH?.trim() ||
  (serverApiKey ? `Bearer ${serverApiKey}` : '');
const consumerAuthMode = process.env.TITAN_CONSUMER_AUTH_MODE?.trim() === 'off' ? 'off' : 'titan-managed';
const consumerAuthLabel = process.env.TITAN_CONSUMER_AUTH_LABEL?.trim() || 'TITAN Managed';
const consumerAuthCookieName = process.env.TITAN_CONSUMER_AUTH_COOKIE_NAME?.trim() || 'titan_managed_auth';
const consumerAuthStateCookieName = `${consumerAuthCookieName}_state`;
const consumerAuthCookieSecret = process.env.TITAN_CONSUMER_AUTH_COOKIE_SECRET?.trim() || '';
const googleClientId = process.env.TITAN_GOOGLE_CLIENT_ID?.trim() || '';
const googleClientSecret = process.env.TITAN_GOOGLE_CLIENT_SECRET?.trim() || '';
const managedWalletMode = process.env.TITAN_MANAGED_WALLET_MODE?.trim() || 'google-linked-local';
const managedWalletLabel = process.env.TITAN_MANAGED_WALLET_LABEL?.trim() || 'Google-linked local wallet';
const managedWalletMessage =
  process.env.TITAN_MANAGED_WALLET_MESSAGE?.trim()
  || 'Google auth is active. Wallets are still created locally in the browser, then linked back to the Google session for recovery.';
const managedWalletStorePath = join(__dirname, '.data', 'managed-wallets.json');
const walletStatsStorePath = join(__dirname, '.data', 'wallet-stats.json');

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const requestPath = decodeURIComponent(url.pathname);

    if (requestPath === '/api/dev/store/military-grade') {
      const upstream = await fetch(militaryGradeTarget, {
        method: request.method,
        headers: {
          'Content-Type': request.headers['content-type'] || 'application/json',
          ...(request.headers.authorization
            ? { Authorization: request.headers.authorization }
            : serverMilitaryGradeAuth
              ? { Authorization: serverMilitaryGradeAuth }
              : {}),
        },
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : await readRequestBody(request),
      });
      const payload = await upstream.text();
      response.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      response.end(payload);
      return;
    }

    if (requestPath === '/api/agent-wallet/control') {
      await handleAgentWalletControlPlane(request, response);
      return;
    }

    if (requestPath === '/api/consumer-auth/config') {
      writeJson(response, 200, getConsumerAuthPublicConfig());
      return;
    }

    if (requestPath === '/api/consumer-auth/session') {
      const session = await getConsumerAuthSession(request);
      writeJson(response, 200, session || {
        authenticated: false,
        provider: null,
        user: null,
        linkedWallet: null,
      });
      return;
    }

    if (requestPath === '/api/public/wallet-stats') {
      if (request.method !== 'GET') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      writeJson(response, 200, await getWalletStats());
      return;
    }

    if (requestPath === '/api/public/wallet-opened') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const body = await readJsonBody(request);
      writeJson(response, 200, await registerWalletOpened({
        address: typeof body?.address === 'string' ? body.address : '',
        source: typeof body?.source === 'string' ? body.source : 'create',
        walletName: typeof body?.walletName === 'string' ? body.walletName : null,
      }));
      return;
    }

    if (requestPath === '/api/consumer-wallet/google/link') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const session = readSignedCookie(request, consumerAuthCookieName, consumerAuthCookieSecret);
      if (!session?.sub) {
        writeJson(response, 401, { error: 'Login required' });
        return;
      }

      if (consumerAuthMode !== 'titan-managed') {
        writeJson(response, 400, { error: 'Managed consumer auth is disabled in this deployment.' });
        return;
      }

      if (managedWalletMode !== 'google-linked-local') {
        writeJson(response, 400, { error: `Wallet link mode \`${managedWalletMode}\` is not writable in this repo yet.` });
        return;
      }

      const body = await readJsonBody(request);
      const wallet = await createOrUpdateLinkedWallet({
        ownerSub: session.sub,
        provider: session.provider || 'google',
        email: session.email || null,
        name: session.name || null,
        walletName: normalizeManagedWalletName(body?.walletName, session.name, session.email),
        address: typeof body?.address === 'string' ? body.address.trim() : '',
        mnemonic: typeof body?.mnemonic === 'string' ? body.mnemonic.trim() : '',
        privateKey: typeof body?.privateKey === 'string' ? body.privateKey.trim() : '',
      });
      writeJson(response, 200, { wallet: toManagedWalletSummary(wallet) });
      return;
    }

    if (requestPath === '/api/consumer-wallet/google/restore') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const session = readSignedCookie(request, consumerAuthCookieName, consumerAuthCookieSecret);
      if (!session?.sub) {
        writeJson(response, 401, { error: 'Login required' });
        return;
      }

      const wallet = await getManagedWalletByOwnerSub(session.sub);
      if (!wallet) {
        writeJson(response, 404, { error: 'No wallet linked to this Google account yet.' });
        return;
      }

      writeJson(response, 200, {
        wallet: {
          id: wallet.id,
          address: wallet.address,
          walletName: wallet.walletName,
          mnemonic: decryptManagedSecret(wallet.encryptedMnemonic, consumerAuthCookieSecret),
          privateKey: decryptManagedSecret(wallet.encryptedPrivateKey, consumerAuthCookieSecret),
          createdAt: wallet.createdAt,
          custody: wallet.custody,
        },
      });
      return;
    }

    if (requestPath === '/api/consumer-wallet/google/rename') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const session = readSignedCookie(request, consumerAuthCookieName, consumerAuthCookieSecret);
      if (!session?.sub) {
        writeJson(response, 401, { error: 'Login required' });
        return;
      }

      const wallet = await getManagedWalletByOwnerSub(session.sub);
      if (!wallet) {
        writeJson(response, 404, { error: 'No wallet linked to this Google account yet.' });
        return;
      }

      const body = await readJsonBody(request);
      wallet.walletName = normalizeManagedWalletName(body?.walletName, session.name, session.email);
      wallet.updatedAt = new Date().toISOString();

      const store = await readManagedWalletStore();
      store.wallets = store.wallets.map((entry) => (entry.ownerSub === session.sub ? wallet : entry));
      await writeManagedWalletStore(store);

      writeJson(response, 200, { wallet: toManagedWalletSummary(wallet) });
      return;
    }

    if (requestPath === '/api/consumer-auth/logout') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Set-Cookie': [
          serializeCookie(consumerAuthCookieName, '', request, { maxAge: 0 }),
          serializeCookie(consumerAuthStateCookieName, '', request, { maxAge: 0 }),
        ],
      });
      response.end(JSON.stringify({ success: true }));
      return;
    }

    if (requestPath === '/api/consumer-auth/google/start') {
      if (request.method !== 'GET') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo'));

      if (consumerAuthMode !== 'titan-managed') {
        redirectWithAuthError(response, request, 'google_not_configured', returnTo);
        return;
      }

      if (!consumerAuthCookieSecret) {
        redirectWithAuthError(response, request, 'auth_config_missing', returnTo);
        return;
      }

      if (!googleClientId || !googleClientSecret) {
        redirectWithAuthError(response, request, 'google_not_configured', returnTo);
        return;
      }

      const state = randomId();
      const redirectUri = getConsumerAuthGoogleRedirectUri(request);
      const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleUrl.searchParams.set('client_id', googleClientId);
      googleUrl.searchParams.set('redirect_uri', redirectUri);
      googleUrl.searchParams.set('response_type', 'code');
      googleUrl.searchParams.set('scope', 'openid email profile');
      googleUrl.searchParams.set('state', state);
      googleUrl.searchParams.set('prompt', 'select_account');

      response.writeHead(302, {
        Location: googleUrl.toString(),
        'Set-Cookie': serializeCookie(
          consumerAuthStateCookieName,
          encodeSignedCookie({ state, returnTo }, consumerAuthCookieSecret),
          request,
          { maxAge: 10 * 60 },
        ),
      });
      response.end();
      return;
    }

    if (requestPath === '/api/consumer-auth/google/callback') {
      if (request.method !== 'GET') {
        writeJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const stateRecord = readSignedCookie(request, consumerAuthStateCookieName, consumerAuthCookieSecret);
      const returnTo = sanitizeReturnTo(stateRecord?.returnTo);
      const returnedState = url.searchParams.get('state');
      const code = url.searchParams.get('code');

      if (!stateRecord?.state || !returnedState || stateRecord.state !== returnedState) {
        redirectWithAuthError(response, request, 'oauth_state_mismatch', returnTo);
        return;
      }

      if (!code) {
        redirectWithAuthError(response, request, 'oauth_code_missing', returnTo);
        return;
      }

      try {
        const redirectUri = getConsumerAuthGoogleRedirectUri(request);
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('oauth_exchange_failed');
        }

        const tokenPayload = await tokenResponse.json();
        const accessToken = tokenPayload.access_token;
        if (!accessToken) {
          throw new Error('oauth_exchange_failed');
        }

        const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('oauth_userinfo_failed');
        }

        const userInfo = await userInfoResponse.json();
        const sessionValue = encodeSignedCookie({
          provider: 'google',
          sub: userInfo.sub,
          email: userInfo.email || null,
          name: userInfo.name || null,
          picture: userInfo.picture || null,
          iat: new Date().toISOString(),
        }, consumerAuthCookieSecret);

        const successUrl = new URL(returnTo, getRequestOrigin(request));
        successUrl.searchParams.set('login', 'success');

        response.writeHead(302, {
          Location: `${successUrl.pathname}${successUrl.search}${successUrl.hash}`,
          'Set-Cookie': [
            serializeCookie(consumerAuthCookieName, sessionValue, request, { maxAge: 7 * 24 * 60 * 60 }),
            serializeCookie(consumerAuthStateCookieName, '', request, { maxAge: 0 }),
          ],
        });
        response.end();
        return;
      } catch (error) {
        const code = error instanceof Error ? error.message : 'oauth_exchange_failed';
        redirectWithAuthError(response, request, code, returnTo);
        return;
      }
    }

    if (requestPath.startsWith('/api/v1/')) {
      const upstreamPath = requestPath.replace(/^\/api\/v1\//, '');
      const upstreamUrl = new URL(`${apiV1Target}/${upstreamPath}`);
      upstreamUrl.search = url.search;

      const upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers: {
          'Content-Type': request.headers['content-type'] || 'application/json',
          ...(request.headers['x-api-key']
            ? { 'X-API-Key': request.headers['x-api-key'] }
            : serverApiKey
              ? { 'X-API-Key': serverApiKey }
              : {}),
        },
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : await readRequestBody(request),
      });
      const payload = await upstream.text();
      response.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      response.end(payload);
      return;
    }

    const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const assetPath = join(rootDir, safePath);

    if (existsSync(assetPath) && statSync(assetPath).isFile()) {
      const ext = extname(assetPath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      createReadStream(assetPath).pipe(response);
      return;
    }

    const indexHtml = await readFile(indexPath);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    response.end(indexHtml);
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end(error instanceof Error ? error.message : 'Internal server error');
  }
});

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

server.listen(port, host, () => {
  console.log(`TITAN Wallet listening on http://${host}:${port}`);
});

function getConsumerAuthPublicConfig() {
  const errors = [];

  if (consumerAuthMode === 'titan-managed') {
    if (!consumerAuthCookieSecret) {
      errors.push('The TITAN-managed auth lane is missing `TITAN_CONSUMER_AUTH_COOKIE_SECRET`.');
    }

    if (!googleClientId) {
      errors.push('Google login is waiting for `TITAN_GOOGLE_CLIENT_ID` in this wallet server.');
    }

    if (!googleClientSecret) {
      errors.push('Google login is waiting for `TITAN_GOOGLE_CLIENT_SECRET` in this wallet server.');
    }
  }

  return {
    provider: consumerAuthMode,
    label: consumerAuthLabel,
    loginMethods: {
      google: consumerAuthMode === 'titan-managed' && Boolean(googleClientId && googleClientSecret && consumerAuthCookieSecret),
      apple: false,
    },
    managedWallet: {
      ready: managedWalletMode === 'google-linked-local',
      label: managedWalletLabel,
      message: managedWalletMessage,
    },
    errors,
  };
}

async function getConsumerAuthSession(request) {
  const session = readSignedCookie(request, consumerAuthCookieName, consumerAuthCookieSecret);
  if (!session) {
    return null;
  }

  const linkedWallet = session.sub ? await getManagedWalletByOwnerSub(session.sub) : null;

  return {
    authenticated: true,
    provider: session.provider,
    user: {
      sub: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
    linkedWallet: linkedWallet ? toManagedWalletSummary(linkedWallet) : null,
  };
}

function getRequestOrigin(request) {
  const protocol = getRequestProtocol(request);
  return `${protocol}://${request.headers.host || 'localhost'}`;
}

function getConsumerAuthGoogleRedirectUri(request) {
  return `${getRequestOrigin(request)}/api/consumer-auth/google/callback`;
}

function sanitizeReturnTo(input) {
  if (!input || typeof input !== 'string') {
    return '/create-wallet?auth=google';
  }

  if (!input.startsWith('/')) {
    return '/create-wallet?auth=google';
  }

  if (input.startsWith('//')) {
    return '/create-wallet?auth=google';
  }

  return input;
}

function redirectWithAuthError(response, request, code, returnTo) {
  const nextUrl = new URL(returnTo, getRequestOrigin(request));
  nextUrl.searchParams.set('error', code);
  response.writeHead(302, {
    Location: `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    'Set-Cookie': serializeCookie(consumerAuthStateCookieName, '', request, { maxAge: 0 }),
  });
  response.end();
}

function serializeCookie(name, value, request, options = {}) {
  const protocol = getRequestProtocol(request);
  const isSecure = protocol === 'https';
  const segments = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (typeof options.maxAge === 'number') {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (isSecure) {
    segments.push('Secure');
  }

  return segments.join('; ');
}

function getRequestProtocol(request) {
  const forwardedProto = firstHeaderToken(request.headers['x-forwarded-proto']);
  if (forwardedProto) {
    return forwardedProto;
  }

  const forwardedHeader = firstHeaderToken(request.headers.forwarded);
  if (forwardedHeader) {
    const match = forwardedHeader.match(/proto=([^;]+)/i);
    if (match?.[1]) {
      return match[1].trim().toLowerCase();
    }
  }

  const hostHeader = `${request.headers.host || ''}`.trim().toLowerCase();
  if (hostHeader && !hostHeader.startsWith('localhost') && !hostHeader.startsWith('127.0.0.1')) {
    return 'https';
  }

  return 'http';
}

function firstHeaderToken(value) {
  if (Array.isArray(value)) {
    return firstHeaderToken(value[0] || '');
  }

  if (typeof value !== 'string') {
    return '';
  }

  return value
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .find(Boolean) || '';
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const separator = entry.indexOf('=');
      if (separator === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separator);
      const value = entry.slice(separator + 1);
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function encodeSignedCookie(payload, secret) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function readSignedCookie(request, cookieName, secret) {
  if (!secret) {
    return null;
  }

  const cookies = parseCookies(request.headers.cookie || '');
  const rawValue = cookies[cookieName];
  if (!rawValue) {
    return null;
  }

  const separator = rawValue.lastIndexOf('.');
  if (separator === -1) {
    return null;
  }

  const encodedPayload = rawValue.slice(0, separator);
  const signature = rawValue.slice(separator + 1);
  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  response.end(JSON.stringify(payload));
}

async function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = join(__dirname, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const content = await readFile(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

async function readJsonBody(request) {
  const rawBody = await readRequestBody(request);
  if (!rawBody.length) {
    return {};
  }

  try {
    return JSON.parse(rawBody.toString('utf8'));
  } catch {
    return {};
  }
}

async function createOrUpdateLinkedWallet(input) {
  if (!input.address || !input.privateKey || !input.mnemonic) {
    throw new Error('Wallet link payload is incomplete.');
  }

  const store = await readManagedWalletStore();
  const existing = store.wallets.find((wallet) => wallet.ownerSub === input.ownerSub);
  if (existing) {
    if (
      existing.walletName !== input.walletName
      || existing.email !== input.email
      || existing.name !== input.name
      || existing.provider !== input.provider
    ) {
      existing.walletName = input.walletName;
      existing.email = input.email;
      existing.name = input.name;
      existing.provider = input.provider;
      existing.updatedAt = new Date().toISOString();
      await writeManagedWalletStore(store);
    }
    return existing;
  }

  const now = new Date().toISOString();
  const record = {
    id: `managed_${randomId()}`,
    ownerSub: input.ownerSub,
    provider: input.provider,
    email: input.email,
    name: input.name,
    walletName: input.walletName,
    address: input.address,
    custody: 'google-linked-local',
    encryptedMnemonic: encryptManagedSecret(input.mnemonic, consumerAuthCookieSecret),
    encryptedPrivateKey: encryptManagedSecret(input.privateKey, consumerAuthCookieSecret),
    createdAt: now,
    updatedAt: now,
  };

  store.wallets.unshift(record);
  await writeManagedWalletStore(store);
  await registerWalletOpened({
    address: record.address,
    source: 'google',
    walletName: record.walletName,
  });
  return record;
}

async function getManagedWalletByOwnerSub(ownerSub) {
  if (!ownerSub) {
    return null;
  }

  const store = await readManagedWalletStore();
  return store.wallets.find((wallet) => wallet.ownerSub === ownerSub) || null;
}

async function readManagedWalletStore() {
  try {
    const content = await readFile(managedWalletStorePath, 'utf8');
    const parsed = JSON.parse(content);
    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
    };
  } catch {
    return { wallets: [] };
  }
}

async function writeManagedWalletStore(store) {
  await mkdir(join(__dirname, '.data'), { recursive: true });
  await writeFile(managedWalletStorePath, JSON.stringify(store, null, 2), 'utf8');
}

async function getWalletStats() {
  const store = await readWalletStatsStore();
  const walletHashes = new Set(
    store.wallets
      .map((wallet) => wallet.walletHash)
      .filter(Boolean),
  );

  const managedStore = await readManagedWalletStore();
  managedStore.wallets.forEach((wallet) => {
    const normalizedAddress = normalizeWalletAddress(wallet.address);
    if (normalizedAddress) {
      walletHashes.add(hashWalletAddress(normalizedAddress));
    }
  });

  return {
    totalWalletsCreated: walletHashes.size,
  };
}

async function registerWalletOpened(input) {
  const normalizedAddress = normalizeWalletAddress(input.address);
  if (!normalizedAddress) {
    return getWalletStats();
  }

  const walletHash = hashWalletAddress(normalizedAddress);
  const store = await readWalletStatsStore();
  const existing = store.wallets.find((wallet) => wallet.walletHash === walletHash);

  if (existing) {
    existing.lastSeenAt = new Date().toISOString();
    existing.source = input.source || existing.source || 'create';
    existing.walletName = sanitizeStatsLabel(input.walletName) || existing.walletName || null;
  } else {
    const now = new Date().toISOString();
    store.wallets.unshift({
      walletHash,
      source: input.source || 'create',
      walletName: sanitizeStatsLabel(input.walletName),
      createdAt: now,
      lastSeenAt: now,
    });
  }

  await writeWalletStatsStore(store);
  return getWalletStats();
}

async function readWalletStatsStore() {
  try {
    const content = await readFile(walletStatsStorePath, 'utf8');
    const parsed = JSON.parse(content);
    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
    };
  } catch {
    return { wallets: [] };
  }
}

async function writeWalletStatsStore(store) {
  await mkdir(join(__dirname, '.data'), { recursive: true });
  await writeFile(walletStatsStorePath, JSON.stringify({
    wallets: store.wallets.slice(0, 100000),
  }, null, 2), 'utf8');
}

function normalizeWalletAddress(address) {
  const normalized = typeof address === 'string' ? address.trim().toLowerCase() : '';
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : '';
}

function hashWalletAddress(address) {
  return createHash('sha256').update(address).digest('hex');
}

function sanitizeStatsLabel(label) {
  if (typeof label !== 'string') {
    return null;
  }

  const trimmed = label.trim();
  return trimmed ? trimmed.slice(0, 80) : null;
}

function encryptManagedSecret(secret, keyMaterial) {
  const key = createHash('sha256').update(keyMaterial).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64url'),
    tag: tag.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
  };
}

function decryptManagedSecret(payload, keyMaterial) {
  const key = createHash('sha256').update(keyMaterial).digest();
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(payload.iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64url')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function toManagedWalletSummary(record) {
  return {
    id: record.id,
    address: record.address,
    walletName: record.walletName,
    createdAt: record.createdAt,
    custody: record.custody,
    hasRecoveryPhrase: Boolean(record.encryptedMnemonic),
  };
}

function normalizeManagedWalletName(walletName, fallbackName, fallbackEmail) {
  const candidate = typeof walletName === 'string' ? walletName.trim() : '';
  if (candidate) {
    return candidate;
  }

  const identity = fallbackName?.trim() || fallbackEmail?.trim();
  if (identity) {
    return `${identity} TITAN`;
  }

  return 'TITAN Managed Wallet';
}
