#!/usr/bin/env node
import process from 'node:process';
import { createTitanAgentWalletClientFromEnv, type JsonRpcRequest, TitanAgentWalletMcpServer } from './mcpServer.js';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

const server = new TitanAgentWalletMcpServer(createTitanAgentWalletClientFromEnv());

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  consumeBuffer();
});

process.stdin.on('end', () => {
  process.exit(0);
});

async function handleRequest(request: JsonRpcRequest) {
  return server.handleRequest(request);
}

function consumeBuffer() {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      return;
    }

    const headerBlock = buffer.slice(0, headerEnd);
    const contentLengthMatch = headerBlock.match(/Content-Length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      buffer = '';
      return;
    }

    const contentLength = Number.parseInt(contentLengthMatch[1], 10);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;
    if (buffer.length < messageEnd) {
      return;
    }

    const rawMessage = buffer.slice(messageStart, messageEnd);
    buffer = buffer.slice(messageEnd);

    void dispatch(rawMessage);
  }
}

async function dispatch(rawMessage: string) {
  let request: JsonRpcRequest;
  try {
    request = JSON.parse(rawMessage) as JsonRpcRequest;
  } catch (error) {
    writeMessage({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: error instanceof Error ? error.message : 'Failed to parse JSON.',
      },
    });
    return;
  }

  try {
    const result = await handleRequest(request);
    if (typeof request.id === 'undefined') {
      return;
    }
    writeMessage({
      jsonrpc: '2.0',
      id: request.id ?? null,
      result,
    });
  } catch (error) {
    if (typeof request.id === 'undefined') {
      return;
    }
    writeMessage({
      jsonrpc: '2.0',
      id: request.id ?? null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'MCP request failed.',
      },
    });
  }
}

function writeMessage(response: JsonRpcResponse) {
  const payload = JSON.stringify(response);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(payload, 'utf8')}\r\n\r\n${payload}`);
}
