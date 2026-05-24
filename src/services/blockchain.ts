import { Contract, JsonRpcProvider, formatEther, formatUnits, parseEther } from 'ethers';
import type { Network, Token } from '../types';

const ERC20_METADATA_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

export function getProvider(rpcUrl: string) {
  return new JsonRpcProvider(rpcUrl);
}

export async function getNativeBalance(address: string, rpcUrl: string) {
  const provider = getProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return balance;
}

export async function estimateNativeTransferGas(input: {
  from: string;
  to: string;
  valueEth: string;
  rpcUrl: string;
}) {
  const provider = getProvider(input.rpcUrl);
  return provider.estimateGas({
    from: input.from,
    to: input.to,
    value: parseEther(input.valueEth || '0'),
  });
}

export async function getNativeTransferQuote(input: {
  from: string;
  to: string;
  valueEth: string;
  rpcUrl: string;
}) {
  const provider = getProvider(input.rpcUrl);
  const value = parseEther(input.valueEth || '0');
  const [gasLimit, feeData, network] = await Promise.all([
    provider.estimateGas({
      from: input.from,
      to: input.to,
      value,
    }),
    provider.getFeeData(),
    provider.getNetwork(),
  ]);

  const unitPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const estimatedFeeWei = unitPrice > 0n ? gasLimit * unitPrice : 0n;

  return {
    chainId: Number(network.chainId),
    gasLimit,
    gasLimitLabel: gasLimit.toString(),
    estimatedFeeNative: formatEther(estimatedFeeWei),
    gasPriceGwei: feeData.gasPrice ? formatUnits(feeData.gasPrice, 'gwei') : null,
    maxFeePerGasGwei: feeData.maxFeePerGas ? formatUnits(feeData.maxFeePerGas, 'gwei') : null,
    maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
      ? formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
      : null,
  };
}

export async function getTokenMetadata(contractAddress: string, network: Network) {
  const provider = getProvider(network.rpcUrl);
  const contract = new Contract(contractAddress, ERC20_METADATA_ABI, provider);

  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);

  return {
    name,
    symbol,
    decimals: Number(decimals),
    contractAddress,
  };
}

export function buildNativeTokenFromBalance(input: {
  network: Network;
  balance: string;
  balanceUSD?: number;
}): Token {
  return {
    id: `${input.network.id}-native`,
    symbol: input.network.symbol,
    name: input.network.name,
    balance: input.balance,
    balanceUSD: input.balanceUSD || 0,
    price: 0,
    change24h: 0,
    icon: input.network.symbol.slice(0, 1),
    network: input.network.name,
    source: 'detected',
  };
}
