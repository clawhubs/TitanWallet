// Cerebras GLM-4.7 client (OpenAI-compatible chat completions).
const MODEL = process.env.CEREBRAS_MODEL || 'zai-glm-4.7';
const ENDPOINT = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions';
const TIMEOUT_MS = Number(process.env.CEREBRAS_TIMEOUT_MS || 30000);

export function hasCerebras(): boolean {
  return Boolean(process.env.CEREBRAS_API_KEY?.trim());
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Calls GLM-4.7 and returns parsed JSON of type T. Throws on failure. */
export async function glmJson<T>(system: string, user: string, maxTokens = 1800): Promise<T> {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  if (!key) throw new Error('CEREBRAS_API_KEY is not configured.');

  const response = await withTimeout(
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    }),
    TIMEOUT_MS,
    'GLM analysis',
  );

  if (!response.ok) throw new Error(`Cerebras HTTP ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('No content from GLM.');
  return JSON.parse(content) as T;
}

export const MODEL_LABEL = MODEL;
