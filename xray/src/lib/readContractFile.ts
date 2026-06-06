// Client-side reader for Solidity sources. Supports raw .sol/.txt and .zip archives
// (parsed via the browser's built-in DecompressionStream — no external dependency).

const MAX_CHARS = 24000;

export async function readContractFile(file: File): Promise<{ name: string; source: string }> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.zip')) {
    const source = await readSolFromZip(file);
    return { name: file.name, source: source.slice(0, MAX_CHARS) };
  }
  const text = await file.text();
  return { name: file.name, source: text.slice(0, MAX_CHARS) };
}

async function inflateRaw(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buf);
}

async function readSolFromZip(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const view = new DataView(ab);
  const bytes = new Uint8Array(ab);

  // Find End Of Central Directory (signature 0x06054b50) scanning from the end.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 65557; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Invalid .zip file.');

  const cdOffset = view.getUint32(eocd + 16, true);
  const total = view.getUint16(eocd + 10, true);

  const parts: { name: string; text: string }[] = [];
  let p = cdOffset;
  for (let n = 0; n < total; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    if (!name.toLowerCase().endsWith('.sol')) continue;
    if (name.includes('node_modules/') || name.includes('/test/') || name.includes('/mock')) continue;

    // Local header: data starts after local name + extra fields.
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = bytes.subarray(dataStart, dataStart + compSize);
    try {
      const text = method === 0 ? new TextDecoder().decode(data) : await inflateRaw(data);
      parts.push({ name, text });
    } catch {
      // skip entries we cannot inflate
    }
    if (parts.join('').length > MAX_CHARS) break;
  }

  if (!parts.length) throw new Error('No .sol files found in the archive.');
  // Prefer the largest source file (usually the main contract), then append others.
  parts.sort((a, b) => b.text.length - a.text.length);
  return parts.map((f) => `// ===== ${f.name} =====\n${f.text}`).join('\n\n');
}
