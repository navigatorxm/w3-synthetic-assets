# FlashAsset Production Architecture

## System Overview

FlashAsset is an enterprise-grade platform for minting and managing ERC-20 compatible expiring tokens for trading communities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLASHASSET ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        FRONTEND (React + Vite)                       │   │
│   │                                                                       │   │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐ │   │
│   │  │  User Dashboard │  │  Admin Panel  │  │  Analytics Dashboard    │ │   │
│   │  │  - Balances     │  │  - Mint Tokens │  │  - Volume Charts        │ │   │
│   │  │  - Transfers    │  │  - Burn Tokens │  │  - Holder Stats         │ │   │
│   │  │  - Expiry Timer │  │  - Manage Users│  │  - Transaction History  │ │   │
│   │  └───────────────┘  └───────────────┘  └───────────────────────────┘ │   │
│   │                                                                       │   │
│   │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│   │  │                    Web3 Integration Layer                         │ │   │
│   │  │  - Wallet Connection (MetaMask, WalletConnect)                    │ │   │
│   │  │  - Contract Interactions (ethers.js)                              │ │   │
│   │  │  - Transaction Management                                         │ │   │
│   │  │  - Event Listeners                                                │ │   │
│   │  └───────────────────────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    BLOCKCHAIN (Ethereum Mainnet)                     │   │
│   │                                                                       │   │
│   │  ┌───────────────────────────────────────────────────────────────┐   │   │
│   │  │              FlashAssetFactory (Proxy Pattern)                 │   │   │
│   │  │                                                                │   │   │
│   │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │   │   │
│   │  │  │  FlashUSDT    │  │  FlashBTC    │  │  FlashETH    │         │   │   │
│   │  │  │  ERC-20       │  │  ERC-20      │  │  ERC-20      │         │   │   │
│   │  │  │  + Expiry     │  │  + Expiry    │  │  + Expiry    │         │   │   │
│   │  │  └──────────────┘  └──────────────┘  └──────────────┘         │   │   │
│   │  └───────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                          Contract Events                                    │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      BACKEND (Lovable Cloud)                         │   │
│   │                                                                       │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│   │  │  Edge Functions   │  │  Database (PG)   │  │  Realtime        │   │   │
│   │  │  - Event Indexer  │  │  - Transactions  │  │  - Live Updates  │   │   │
│   │  │  - Analytics Calc │  │  - Analytics     │  │  - Notifications │   │   │
│   │  │  - Webhook Handler│  │  - Audit Logs    │  │                  │   │   │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Web3**: ethers.js v6 + wagmi + ConnectKit
- **Charts**: Recharts

### Blockchain
- **Networks**: Ethereum Mainnet (production), Sepolia (testing)
- **Contracts**: Solidity 0.8.20+ with OpenZeppelin
- **Pattern**: Factory + Proxy (upgradeable)

### Backend (Lovable Cloud)
- **Database**: PostgreSQL
- **Auth**: Wallet signature verification (SIWE)
- **Edge Functions**: Deno runtime
- **Realtime**: WebSocket subscriptions

## Directory Structure

```
src/
├── assets/                    # Static assets (images, fonts)
├── components/
│   ├── admin/                 # Admin-only components
│   │   ├── MintForm.tsx
│   │   ├── BurnPanel.tsx
│   │   └── UserManagement.tsx
│   ├── analytics/             # Analytics & charts
│   │   ├── VolumeChart.tsx
│   │   ├── HolderStats.tsx
│   │   └── TransactionHistory.tsx
│   ├── dashboard/             # User dashboard components
│   │   ├── BalanceCard.tsx
│   │   ├── ExpiryTimer.tsx
│   │   └── TransferForm.tsx
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── ui/                    # shadcn/ui components
│   └── wallet/                # Web3 wallet components
│       ├── ConnectButton.tsx
│       ├── WalletModal.tsx
│       └── NetworkSwitch.tsx
├── config/
│   ├── chains.ts              # Network configurations
│   ├── contracts.ts           # Contract addresses & ABIs
│   └── constants.ts           # App constants
├── hooks/
│   ├── web3/                  # Web3 hooks
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   ├── useBalance.ts
│   │   └── useTransactions.ts
│   ├── useAuth.ts
│   └── useAnalytics.ts
├── lib/
│   ├── contracts/             # Contract interaction utilities
│   │   ├── FlashToken.ts
│   │   ├── FlashFactory.ts
│   │   └── events.ts
│   ├── utils.ts               # General utilities
│   └── validation.ts          # Zod schemas
├── pages/
│   ├── Index.tsx              # Landing/Dashboard
│   ├── Admin.tsx              # Admin panel
│   ├── Analytics.tsx          # Analytics dashboard
│   ├── Transfer.tsx           # Transfer page
│   └── NotFound.tsx
├── providers/
│   ├── Web3Provider.tsx       # wagmi/ethers provider
│   └── AuthProvider.tsx       # Wallet auth context
├── stores/
│   └── walletStore.ts         # Zustand wallet state
├── types/
│   ├── token.ts               # Token types
│   ├── transaction.ts         # Transaction types
│   └── index.ts               # Barrel export
└── integrations/
    └── supabase/              # Auto-generated

supabase/
├── config.toml                # Auto-managed
└── functions/
    ├── sync-events/           # Blockchain event indexer
    │   └── index.ts
    └── analytics-calculate/   # Analytics aggregation
        └── index.ts

contracts/                     # Solidity contracts (reference)
├── FlashToken.sol
├── FlashFactory.sol
└── interfaces/
    └── IFlashToken.sol
```

## Smart Contract Interface

```solidity
interface IFlashToken {
    // ERC-20 Standard
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // FlashAsset Extensions
    function expiryOf(address account) external view returns (uint256);
    function isExpired(address account) external view returns (bool);
    function mint(address to, uint256 amount, uint256 expiry) external;
    function burn(address account, uint256 amount) external;
    function batchMint(address[] calldata recipients, uint256[] calldata amounts, uint256[] calldata expiries) external;
    
    // Events
    event TokenMinted(address indexed to, uint256 amount, uint256 expiry);
    event TokenBurned(address indexed from, uint256 amount);
    event ExpiryUpdated(address indexed account, uint256 newExpiry);
}
```

## Security Considerations

### Smart Contract Security
- OpenZeppelin base contracts (audited)
- Reentrancy guards on all state-changing functions
- Role-based access control (ADMIN_ROLE, MINTER_ROLE)
- Pausable for emergency stops
- Rate limiting on mints

### Frontend Security
- Input validation with Zod schemas
- XSS prevention (no dangerouslySetInnerHTML)
- Transaction confirmation dialogs
- Network verification before transactions

### Backend Security
- RLS policies on all tables
- Wallet signature verification
- Rate limiting on edge functions
- Audit logging for all actions

## Deployment Checklist

### Pre-Deployment
- [ ] Contract audit completed
- [ ] Testnet deployment verified
- [ ] Frontend security review
- [ ] Load testing completed
- [ ] Backup procedures documented

### Deployment
- [ ] Deploy contracts to mainnet
- [ ] Update contract addresses in config
- [ ] Enable production database
- [ ] Configure monitoring/alerts
- [ ] DNS/SSL configuration

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Analytics tracking verified
- [ ] Documentation published
- [ ] Support channels active
