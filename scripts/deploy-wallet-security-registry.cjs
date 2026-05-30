const fs = require("node:fs");
const path = require("node:path");
const solc = require("/home/cucu/Coder/YiledBoost Ai/node_modules/solc");
const { JsonRpcProvider, Wallet, ContractFactory, formatEther } = require("ethers");

function readEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) {
    return values;
  }

  const source = fs.readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getEnv(name, fallback) {
  if (process.env[name]) {
    return process.env[name];
  }

  return fallback[name];
}

function compileContract(contractPath, contractName) {
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      [path.basename(contractPath)]: {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatalErrors = errors.filter((item) => item.severity === "error");

  if (fatalErrors.length) {
    throw new Error(fatalErrors.map((item) => item.formattedMessage).join("\n"));
  }

  const compiled = output.contracts[path.basename(contractPath)][contractName];
  if (!compiled) {
    throw new Error(`Contract ${contractName} not found in compilation output.`);
  }

  return {
    abi: compiled.abi,
    bytecode: compiled.evm.bytecode.object,
  };
}

async function main() {
  const network = process.argv[2] || "testnet";
  const rootDir = path.resolve(__dirname, "..");
  const sharedEnv = readEnvFile("/home/cucu/Coder/YiledBoost Ai/.env.local");

  let rpcUrl;
  let privateKey;
  let explorerBase;
  let chainId;

  if (network === "mainnet") {
    rpcUrl = getEnv("ZG_MAINNET_RPC_URL", sharedEnv) || "https://evmrpc.0g.ai";
    privateKey = getEnv("ZG_MAINNET_PRIVATE_KEY", sharedEnv);
    explorerBase =
      getEnv("NEXT_PUBLIC_0G_MAINNET_EXPLORER_BASE_URL", sharedEnv) || "https://chainscan.0g.ai";
    chainId = 16661;
  } else {
    rpcUrl =
      getEnv("ZG_TESTNET_RPC_URL", sharedEnv) ||
      getEnv("NEXT_PUBLIC_ZG_RPC", sharedEnv) ||
      "https://evmrpc-testnet.0g.ai";
    privateKey = getEnv("ZG_TESTNET_PRIVATE_KEY", sharedEnv) || getEnv("ZG_PRIVATE_KEY", sharedEnv);
    explorerBase =
      getEnv("NEXT_PUBLIC_0G_EXPLORER_BASE_URL", sharedEnv) || "https://chainscan-galileo.0g.ai";
    chainId = 16602;
  }

  if (!rpcUrl || !privateKey) {
    throw new Error(`Missing RPC or private key for ${network}.`);
  }

  const contractPath = path.join(rootDir, "contracts", "WalletSecurityRegistry.sol");
  const { abi, bytecode } = compileContract(contractPath, "WalletSecurityRegistry");
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const balance = await provider.getBalance(signer.address);

  console.log(`Deploying WalletSecurityRegistry to ${network}`);
  console.log(`Deployer: ${signer.address}`);
  console.log(`Balance: ${formatEther(balance)} 0G`);

  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  const deploymentTx = contract.deploymentTransaction();
  console.log(`Deployment tx: ${deploymentTx.hash}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const artifactDir = path.join(rootDir, ".artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });

  const deployment = {
    contractName: "WalletSecurityRegistry",
    address,
    network,
    chainId,
    deployer: signer.address,
    transactionHash: deploymentTx.hash,
    explorerUrl: `${explorerBase.replace(/\/$/, "")}/address/${address}`,
    deployedAt: new Date().toISOString(),
    abi,
  };

  fs.writeFileSync(
    path.join(artifactDir, `wallet-security-registry-${network}.json`),
    JSON.stringify(deployment, null, 2),
    "utf8",
  );

  console.log(`Address: ${address}`);
  console.log(`Explorer: ${deployment.explorerUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
