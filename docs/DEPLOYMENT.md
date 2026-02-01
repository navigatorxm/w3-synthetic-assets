# FlashAsset Deployment Guide

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Hardhat or Foundry for smart contract deployment
- MetaMask or similar wallet with ETH for gas
- Access to Ethereum RPC endpoints

## Smart Contract Deployment

### 1. Install Dependencies

```bash
cd contracts
npm install @openzeppelin/contracts hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Configure Hardhat

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
```

### 3. Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy Factory
  const FlashFactory = await ethers.getContractFactory("FlashFactory");
  const factory = await FlashFactory.deploy();
  await factory.waitForDeployment();
  console.log("FlashFactory deployed to:", await factory.getAddress());

  // Create tokens
  const tokens = [
    { name: "Flash USDT", symbol: "USDT", decimals: 6 },
    { name: "Flash BTC", symbol: "BTC", decimals: 8 },
    { name: "Flash ETH", symbol: "ETH", decimals: 18 },
  ];

  for (const token of tokens) {
    const tx = await factory.createToken(token.name, token.symbol, token.decimals);
    await tx.wait();
    const tokenAddress = await factory.getToken(token.symbol);
    console.log(`${token.symbol} deployed to:`, tokenAddress);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 4. Deploy to Testnet

```bash
# Set environment variables
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
export PRIVATE_KEY="your-private-key"
export ETHERSCAN_API_KEY="your-api-key"

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contracts
npx hardhat verify --network sepolia FACTORY_ADDRESS
```

### 5. Update Frontend Configuration

After deployment, update `src/config/contracts.ts` with the deployed addresses:

```typescript
export const CONTRACT_ADDRESSES: Record<number, Record<TokenSymbol, string>> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    USDT: "0x...", // Replace with actual address
    BTC: "0x...",
    ETH: "0x...",
  },
  [CHAIN_IDS.SEPOLIA]: {
    USDT: "0x...", // Replace with actual address
    BTC: "0x...",
    ETH: "0x...",
  },
};

export const FACTORY_ADDRESSES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: "0x...",
  [CHAIN_IDS.SEPOLIA]: "0x...",
};
```

## Admin Configuration

Update `src/config/constants.ts` with admin wallet addresses:

```typescript
export const ADMIN_ADDRESSES: string[] = [
  "0x...", // Your admin wallet address
  // Add more admin addresses as needed
];
```

## Backend Event Indexer

For production, set up a Node.js service to index blockchain events:

```typescript
// Example indexer service structure
import { ethers } from "ethers";
import { FLASH_TOKEN_ABI, CONTRACT_ADDRESSES } from "./config";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function indexEvents() {
  const symbols = ["USDT", "BTC", "ETH"];
  
  for (const symbol of symbols) {
    const address = CONTRACT_ADDRESSES[1][symbol];
    const contract = new ethers.Contract(address, FLASH_TOKEN_ABI, provider);
    
    // Listen for events
    contract.on("TokenMinted", async (to, amount, expiry, event) => {
      // Call sync-events edge function
      await fetch(`${SUPABASE_URL}/functions/v1/sync-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "sync_transaction",
          data: {
            tx_hash: event.transactionHash,
            block_number: event.blockNumber,
            tx_type: "mint",
            token_symbol: symbol,
            from_address: ethers.ZeroAddress,
            to_address: to,
            amount: amount.toString(),
            expiry_timestamp: Number(expiry),
            chain_id: 1,
          },
        }),
      });
    });
    
    // Similar listeners for Transfer and TokenBurned events
  }
}
```

## Production Checklist

### Security
- [ ] Smart contracts audited by reputable firm
- [ ] Admin keys stored in hardware wallet
- [ ] RPC endpoints use authenticated access
- [ ] Rate limiting on edge functions
- [ ] Monitoring and alerting configured

### Infrastructure
- [ ] Multi-region backend deployment
- [ ] CDN for frontend assets
- [ ] Database backups enabled
- [ ] SSL/TLS configured
- [ ] DDoS protection active

### Testing
- [ ] Unit tests passing
- [ ] Integration tests on testnet
- [ ] Load testing completed
- [ ] Security penetration testing done

### Documentation
- [ ] API documentation published
- [ ] User guides created
- [ ] Admin manual complete
- [ ] Incident response plan ready

## Environment Variables

Required environment variables for production:

```env
# Backend (Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Indexer Service
RPC_URL=https://eth-mainnet.your-provider.io/v3/your-key
PRIVATE_KEY=your-indexer-private-key

# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```
