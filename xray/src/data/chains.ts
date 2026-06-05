// Comprehensive EVM chain list for Titan X-Ray scanner
// Source: chainid.network/chains.json + community standards (June 2026)
// Only mainnets with active approval scanning relevance

export interface ChainInfo {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  icon: string; // emoji or unicode symbol
  color: string;
  explorerUrl: string;
  rpcUrl?: string;
  rpcEnv?: string;
  explorerApiUrl?: string;
  explorerApiKeyEnv?: string;
  nativeSymbol?: string;
  approvalScanMode?: 'onchain' | 'offchain';
  category: 'popular' | 'layer2' | 'evm' | 'other';
}

export const CHAINS: ChainInfo[] = [
  // === POPULAR / TIER 1 ===
  { id: 'ethereum', name: 'Ethereum', shortName: 'ETH', chainId: 1, icon: '⟠', color: '#627EEA', explorerUrl: 'https://etherscan.io', rpcUrl: 'https://ethereum.publicnode.com', rpcEnv: 'ETHEREUM_RPC_URL', explorerApiUrl: 'https://api.etherscan.io/api', explorerApiKeyEnv: 'ETHERSCAN_API_KEY', nativeSymbol: 'ETH', category: 'popular' },
  { id: 'bsc', name: 'BNB Chain', shortName: 'BSC', chainId: 56, icon: '◈', color: '#F0B90B', explorerUrl: 'https://bscscan.com', rpcUrl: 'https://bsc-dataseed.binance.org', rpcEnv: 'BSC_RPC_URL', explorerApiUrl: 'https://api.bscscan.com/api', explorerApiKeyEnv: 'BSCSCAN_API_KEY', nativeSymbol: 'BNB', category: 'popular' },
  { id: 'polygon', name: 'Polygon', shortName: 'POL', chainId: 137, icon: '⬡', color: '#8247E5', explorerUrl: 'https://polygonscan.com', rpcUrl: 'https://polygon-bor.publicnode.com', rpcEnv: 'POLYGON_RPC_URL', explorerApiUrl: 'https://api.polygonscan.com/api', explorerApiKeyEnv: 'POLYGONSCAN_API_KEY', nativeSymbol: 'POL', category: 'popular' },
  { id: 'arbitrum', name: 'Arbitrum One', shortName: 'ARB', chainId: 42161, icon: '◆', color: '#28A0F0', explorerUrl: 'https://arbiscan.io', rpcUrl: 'https://arbitrum-one.publicnode.com', rpcEnv: 'ARBITRUM_RPC_URL', explorerApiUrl: 'https://api.arbiscan.io/api', explorerApiKeyEnv: 'ARBISCAN_API_KEY', nativeSymbol: 'ETH', category: 'popular' },
  { id: 'optimism', name: 'OP Mainnet', shortName: 'OP', chainId: 10, icon: '⊕', color: '#FF0420', explorerUrl: 'https://optimistic.etherscan.io', rpcUrl: 'https://optimism.publicnode.com', rpcEnv: 'OPTIMISM_RPC_URL', explorerApiUrl: 'https://api-optimistic.etherscan.io/api', explorerApiKeyEnv: 'OPTIMISTIC_ETHERSCAN_API_KEY', nativeSymbol: 'ETH', category: 'popular' },
  { id: 'base', name: 'Base', shortName: 'BASE', chainId: 8453, icon: '●', color: '#0052FF', explorerUrl: 'https://basescan.org', rpcUrl: 'https://base.publicnode.com', rpcEnv: 'BASE_RPC_URL', explorerApiUrl: 'https://api.basescan.org/api', explorerApiKeyEnv: 'BASESCAN_API_KEY', nativeSymbol: 'ETH', category: 'popular' },
  { id: '0g', name: '0G', shortName: '0G', chainId: 16661, icon: '0G', color: '#00F0FF', explorerUrl: 'https://chainscan.0g.ai', rpcUrl: 'https://evmrpc.0g.ai', rpcEnv: 'ZERO_G_RPC_URL', nativeSymbol: '0G', approvalScanMode: 'onchain', category: 'popular' },
  { id: 'avalanche', name: 'Avalanche C-Chain', shortName: 'AVAX', chainId: 43114, icon: '▲', color: '#E84142', explorerUrl: 'https://snowtrace.io', rpcUrl: 'https://avalanche-c-chain.publicnode.com', rpcEnv: 'AVALANCHE_RPC_URL', explorerApiUrl: 'https://api.snowtrace.io/api', explorerApiKeyEnv: 'SNOWTRACE_API_KEY', nativeSymbol: 'AVAX', category: 'popular' },
  { id: 'sonic', name: 'Sonic', shortName: 'S', chainId: 146, icon: '◎', color: '#0000FF', explorerUrl: 'https://sonicscan.org', rpcUrl: 'https://rpc.soniclabs.com', rpcEnv: 'SONIC_RPC_URL', nativeSymbol: 'S', category: 'popular' },

  // === LAYER 2 / ROLLUPS ===
  { id: 'zksync', name: 'zkSync Era', shortName: 'ZKS', chainId: 324, icon: '◇', color: '#8C8DFC', explorerUrl: 'https://explorer.zksync.io', category: 'layer2' },
  { id: 'linea', name: 'Linea', shortName: 'LINEA', chainId: 59144, icon: '▬', color: '#121212', explorerUrl: 'https://lineascan.build', category: 'layer2' },
  { id: 'scroll', name: 'Scroll', shortName: 'SCRL', chainId: 534352, icon: '📜', color: '#FFEEDA', explorerUrl: 'https://scrollscan.com', category: 'layer2' },
  { id: 'mantle', name: 'Mantle', shortName: 'MNT', chainId: 5000, icon: '▣', color: '#000000', explorerUrl: 'https://mantlescan.xyz', category: 'layer2' },
  { id: 'blast', name: 'Blast', shortName: 'BLAST', chainId: 81457, icon: '💥', color: '#FCFC03', explorerUrl: 'https://blastscan.io', category: 'layer2' },
  { id: 'manta', name: 'Manta Pacific', shortName: 'MANTA', chainId: 169, icon: '🐙', color: '#1C68F3', explorerUrl: 'https://pacific-explorer.manta.network', category: 'layer2' },
  { id: 'mode', name: 'Mode', shortName: 'MODE', chainId: 34443, icon: '◉', color: '#DFFE00', explorerUrl: 'https://explorer.mode.network', category: 'layer2' },
  { id: 'zora', name: 'Zora', shortName: 'ZORA', chainId: 7777777, icon: '✦', color: '#000000', explorerUrl: 'https://explorer.zora.energy', category: 'layer2' },
  { id: 'worldchain', name: 'World Chain', shortName: 'WC', chainId: 480, icon: '🌐', color: '#000000', explorerUrl: 'https://worldscan.org', category: 'layer2' },
  { id: 'unichain', name: 'Unichain', shortName: 'UNI', chainId: 130, icon: '🦄', color: '#FF007A', explorerUrl: 'https://uniscan.xyz', category: 'layer2' },
  { id: 'fraxtal', name: 'Fraxtal', shortName: 'FRAX', chainId: 252, icon: '⌘', color: '#000000', explorerUrl: 'https://fraxscan.com', category: 'layer2' },
  { id: 'kroma', name: 'Kroma', shortName: 'KRO', chainId: 255, icon: '◎', color: '#57CC99', explorerUrl: 'https://blockscout.kroma.network', category: 'layer2' },
  { id: 'shape', name: 'Shape', shortName: 'SHAPE', chainId: 360, icon: '▰', color: '#000000', explorerUrl: 'https://shapescan.xyz', category: 'layer2' },
  { id: 'form', name: 'Form', shortName: 'FORM', chainId: 478, icon: '▢', color: '#000000', explorerUrl: 'https://explorer.form.network', category: 'layer2' },

  // === EVM COMPATIBLE ===
  { id: 'fantom', name: 'Fantom Opera', shortName: 'FTM', chainId: 250, icon: '👻', color: '#1969FF', explorerUrl: 'https://ftmscan.com', category: 'evm' },
  { id: 'gnosis', name: 'Gnosis', shortName: 'GNO', chainId: 100, icon: '🦉', color: '#04795B', explorerUrl: 'https://gnosisscan.io', category: 'evm' },
  { id: 'celo', name: 'Celo', shortName: 'CELO', chainId: 42220, icon: '◯', color: '#35D07F', explorerUrl: 'https://celoscan.io', category: 'evm' },
  { id: 'moonbeam', name: 'Moonbeam', shortName: 'GLMR', chainId: 1284, icon: '🌙', color: '#53CBC9', explorerUrl: 'https://moonscan.io', category: 'evm' },
  { id: 'moonriver', name: 'Moonriver', shortName: 'MOVR', chainId: 1285, icon: '🌊', color: '#F2B705', explorerUrl: 'https://moonriver.moonscan.io', category: 'evm' },
  { id: 'cronos', name: 'Cronos', shortName: 'CRO', chainId: 25, icon: '🔷', color: '#002D74', explorerUrl: 'https://explorer.cronos.org', category: 'evm' },
  { id: 'harmony', name: 'Harmony', shortName: 'ONE', chainId: 1666600000, icon: '☯', color: '#00ADE8', explorerUrl: 'https://explorer.harmony.one', category: 'evm' },
  { id: 'kcc', name: 'KCC', shortName: 'KCS', chainId: 321, icon: '▷', color: '#23AF91', explorerUrl: 'https://explorer.kcc.io', category: 'evm' },
  { id: 'aurora', name: 'Aurora', shortName: 'AURORA', chainId: 1313161554, icon: '🌈', color: '#70D44B', explorerUrl: 'https://explorer.aurora.dev', category: 'evm' },
  { id: 'metis', name: 'Metis', shortName: 'METIS', chainId: 1088, icon: '♦', color: '#00D2FF', explorerUrl: 'https://andromeda-explorer.metis.io', category: 'evm' },
  { id: 'boba', name: 'Boba Network', shortName: 'BOBA', chainId: 288, icon: '🧋', color: '#CBFF00', explorerUrl: 'https://bobascan.com', category: 'evm' },
  { id: 'canto', name: 'Canto', shortName: 'CANTO', chainId: 7700, icon: '♪', color: '#06FC99', explorerUrl: 'https://www.oklink.com/canto', category: 'evm' },
  { id: 'klaytn', name: 'Klaytn', shortName: 'KLAY', chainId: 8217, icon: '◆', color: '#FF3D00', explorerUrl: 'https://www.klaytnscope.com', category: 'evm' },
  { id: 'filecoin', name: 'Filecoin', shortName: 'FIL', chainId: 314, icon: '📁', color: '#0090FF', explorerUrl: 'https://filfox.info', category: 'evm' },
  { id: 'pulsechain', name: 'PulseChain', shortName: 'PLS', chainId: 369, icon: '💜', color: '#9B59B6', explorerUrl: 'https://scan.pulsechain.com', category: 'evm' },
  { id: 'opbnb', name: 'opBNB', shortName: 'opBNB', chainId: 204, icon: '◈', color: '#F0B90B', explorerUrl: 'https://mainnet.opbnbscan.com', category: 'evm' },
  { id: 'etc', name: 'Ethereum Classic', shortName: 'ETC', chainId: 61, icon: '⟠', color: '#34D399', explorerUrl: 'https://etc.blockscout.com', category: 'evm' },
  { id: 'monad', name: 'Monad', shortName: 'MON', chainId: 143, icon: '◇', color: '#836EF9', explorerUrl: 'https://monadscan.com', category: 'evm' },
  { id: 'hedera', name: 'Hedera', shortName: 'HBAR', chainId: 295, icon: 'ℏ', color: '#000000', explorerUrl: 'https://hashscan.io', category: 'evm' },
  { id: 'near', name: 'NEAR Protocol', shortName: 'NEAR', chainId: 397, icon: '◎', color: '#000000', explorerUrl: 'https://eth-explorer.near.org', category: 'evm' },
  { id: 'lens', name: 'Lens', shortName: 'LENS', chainId: 232, icon: '🌿', color: '#00501E', explorerUrl: 'https://explorer.lens.xyz', category: 'evm' },

  // === OTHER / EMERGING ===
  { id: 'shibarium', name: 'Shibarium', shortName: 'SHIB', chainId: 109, icon: '🐕', color: '#F9A825', explorerUrl: 'https://www.shibariumscan.io', category: 'other' },
  { id: 'xlayer', name: 'X Layer', shortName: 'OKB', chainId: 196, icon: '✕', color: '#000000', explorerUrl: 'https://www.oklink.com/xlayer', category: 'other' },
  { id: 'telos', name: 'Telos EVM', shortName: 'TLOS', chainId: 40, icon: '⬣', color: '#571AFF', explorerUrl: 'https://teloscan.io', category: 'other' },
  { id: 'fuse', name: 'Fuse', shortName: 'FUSE', chainId: 122, icon: '⚡', color: '#B4F9BA', explorerUrl: 'https://explorer.fuse.io', category: 'other' },
  { id: 'bttc', name: 'BitTorrent Chain', shortName: 'BTT', chainId: 199, icon: '▶', color: '#000000', explorerUrl: 'https://bttcscan.com', category: 'other' },
  { id: 'rollux', name: 'Rollux', shortName: 'SYS', chainId: 570, icon: '◈', color: '#0082C9', explorerUrl: 'https://explorer.rollux.com', category: 'other' },
  { id: 'oasys', name: 'Oasys', shortName: 'OAS', chainId: 248, icon: '⊙', color: '#008080', explorerUrl: 'https://explorer.oasys.games', category: 'other' },
  { id: 'flare', name: 'Flare', shortName: 'FLR', chainId: 14, icon: '☀', color: '#E62058', explorerUrl: 'https://flare-explorer.flare.network', category: 'other' },
  { id: 'b2', name: 'B² Network', shortName: 'B2', chainId: 223, icon: '₿', color: '#F7931A', explorerUrl: 'https://explorer.bsquared.network', category: 'other' },
  { id: 'swan', name: 'Swan Chain', shortName: 'SWAN', chainId: 254, icon: '🦢', color: '#000000', explorerUrl: 'https://swanscan.io', category: 'other' },
  { id: 'prom', name: 'Prom', shortName: 'PROM', chainId: 227, icon: '◆', color: '#5B21B6', explorerUrl: 'https://prom-blockscout.eu-north-2.gateway.fm', category: 'other' },
  { id: 'hashkey', name: 'HashKey Chain', shortName: 'HSK', chainId: 177, icon: '#', color: '#0066FF', explorerUrl: 'https://explorer.hsk.xyz', category: 'other' },
];

export const CHAIN_CATEGORIES = [
  { id: 'popular', label: 'Popular' },
  { id: 'layer2', label: 'Layer 2' },
  { id: 'evm', label: 'EVM Compatible' },
  { id: 'other', label: 'Other' },
] as const;

export function getChainById(id: string): ChainInfo | undefined {
  return CHAINS.find(c => c.id === id);
}

export function getChainByChainId(chainId: number): ChainInfo | undefined {
  return CHAINS.find(c => c.chainId === chainId);
}

export function getChainsByCategory(category: string): ChainInfo[] {
  return CHAINS.filter(c => c.category === category);
}
