# FlashAsset Deployment Guide

Complete step-by-step guide to deploy and configure FlashAsset for production use.

## Quick Start (3 Steps)

### Step 1: Deploy Smart Contracts

You need to deploy the FlashToken contracts to your target network (Sepolia for testing, Mainnet for production).

**Prerequisites:**
- Node.js 18+
- MetaMask with ETH for gas
- Alchemy/Infura RPC endpoint

**Deploy using Hardhat:**

```bash
# Clone and setup
cd contracts
npm install

# Create .env file
cat > .env << EOF
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_key
EOF

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**Example output:**
```
Deploying with: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
FlashFactory deployed to: 0x1234567890abcdef...
USDT deployed to: 0xabcdef1234567890...
```

**Save these addresses** - you'll need them in Step 2.

### Step 2: Configure the Admin Panel

1. Open the FlashAsset Admin Panel
2. Connect your deployer wallet (MetaMask)
3. Go to **Settings** tab

**Add Your Admin Address:**
- Paste your wallet address
- Click "Add"

**Add Your Token Contracts:**
- Click "Add Token"
- Enter: Symbol (e.g., `USDT`), Name (e.g., `Flash USDT`), Decimals (`6`)
- Select Network: Sepolia or Mainnet
- Paste the deployed contract address
- Click "Save Token"

### Step 3: Start Minting!

1. Go to **Mint** tab
2. Select your token
3. Enter recipient (click "Self" for your own wallet)
4. Set amount and expiry days
5. Click "Mint Tokens"
6. Confirm in MetaMask

---

## Detailed Contract Deployment

### Hardhat Configuration

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
      optimizer: { enabled: true, runs: 200 },
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

### Deployment Script

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
  const factoryAddress = await factory.getAddress();
  console.log("FlashFactory deployed to:", factoryAddress);

  // Create tokens
  const tokens = [
    { name: "Flash USDT", symbol: "USDT", decimals: 6 },
    { name: "Flash BTC", symbol: "BTC", decimals: 8 },
    { name: "Flash ETH", symbol: "ETH", decimals: 18 },
  ];

  console.log("\nDeploying tokens...");
  for (const token of tokens) {
    const tx = await factory.createToken(token.name, token.symbol, token.decimals);
    await tx.wait();
    const tokenAddress = await factory.getToken(token.symbol);
    console.log(`${token.symbol} deployed to:`, tokenAddress);
  }

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Open the Admin Panel");
  console.log("2. Add your wallet as admin in Settings");
  console.log("3. Add token contracts with the addresses above");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Verify Contracts (Optional)

```bash
npx hardhat verify --network sepolia FACTORY_ADDRESS
npx hardhat verify --network sepolia TOKEN_ADDRESS "Flash USDT" "USDT" 6
```

---

## Network Configuration

### Supported Networks

| Network | Chain ID | RPC Endpoint |
|---------|----------|--------------|
| Ethereum Mainnet | 1 | https://eth-mainnet.g.alchemy.com/v2/KEY |
| Sepolia Testnet | 11155111 | https://eth-sepolia.g.alchemy.com/v2/KEY |

### Getting Test ETH

For Sepolia testnet:
1. Visit [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
2. Or [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
3. Enter your wallet address
4. Wait for 0.5 ETH to arrive

---

## Custom Token Setup

### Token Decimals Guide

| Token Type | Recommended Decimals | Example Amount |
|------------|---------------------|----------------|
| Stablecoins (USDT, USDC) | 6 | 1000.000000 |
| Bitcoin-like | 8 | 1.00000000 |
| ETH-like | 18 | 1.000000000000000000 |

### Adding Custom Tokens

You can add any token symbol you want:

1. Deploy a new token via the Factory contract:
```javascript
await factory.createToken("Flash GOLD", "GOLD", 8);
```

2. Get the token address:
```javascript
const goldAddress = await factory.getToken("GOLD");
```

3. Add it in the Admin Panel Settings

---

## Production Checklist

### Security
- [ ] Store deployer private key in hardware wallet
- [ ] Use multi-sig for admin operations (recommended)
- [ ] Contracts audited before mainnet deployment
- [ ] RPC endpoints use authenticated access

### Testing
- [ ] Full test on Sepolia before mainnet
- [ ] Test mint, transfer, and expiry flows
- [ ] Verify contract source on Etherscan

### Monitoring
- [ ] Set up block explorer alerts
- [ ] Monitor gas prices for transactions
- [ ] Track token holder addresses

---

## Troubleshooting

### "Contract not available"
- Ensure you've added the token in Settings
- Check you're on the correct network
- Verify the contract address is correct

### "Admin privileges required"
- Add your wallet address in Settings → Admin Addresses
- Ensure your connected wallet matches the admin list

### Transaction fails
- Check you have enough ETH for gas
- Verify recipient address is valid
- For transfers: ensure tokens haven't expired

### Tokens not showing balance
- Wait for block confirmation (~15 seconds)
- Click refresh button on balance display
- Check correct network is selected

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              FlashAsset Admin               │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Mint   │ │ Transfer │ │   Settings   │  │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘  │
│       │           │              │          │
│       └───────────┼──────────────┘          │
│                   ▼                         │
│         ┌─────────────────┐                 │
│         │ Token Contracts │                 │
│         │ (FlashToken)    │                 │
│         └────────┬────────┘                 │
│                  │                          │
│                  ▼                          │
│         ┌─────────────────┐                 │
│         │  FlashFactory   │                 │
│         │  (Deployment)   │                 │
│         └─────────────────┘                 │
└─────────────────────────────────────────────┘
                   │
                   ▼
          [ Ethereum Network ]
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review contract deployment logs
3. Verify network and address configurations
