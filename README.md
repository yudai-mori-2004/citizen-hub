# 🏛️ CitizenHub - Developer Documentation

**A Solana-based democratic proposal and voting platform for the Crypto Cities hackathon**

CitizenHub enables residents to post opinions and participate in democratic voting to select truly supported proposals, addressing the structural limitations of representative democracy through direct democratic selection of specific proposals.

![CitizenHub Demo](https://img.shields.io/badge/Demo-Live-green) ![Solana](https://img.shields.io/badge/Solana-DevNet-purple) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![License](https://img.shields.io/badge/License-MIT-blue)

> **Just want to try the platform?** Check out [QUICK_START.md](./QUICK_START.md) for a 5-minute demo guide.

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL (serverless) for off-chain data
- **Blockchain**: Solana DevNet with Anchor framework v0.29.0
- **Authentication**: NextAuth with Google OAuth
- **Backend**: Next.js App Router API routes
- **UI Components**: Radix UI with shadcn/ui patterns
- **Token**: PROS token for staking and rewards system

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Solana        │
│   (Next.js)     │◄──►│   (Next.js)      │◄──►│   (Anchor)      │
│                 │    │                  │    │                 │
│ • Voting UI     │    │ • Proposal CRUD  │    │ • PROS Token    │
│ • Wallet        │    │ • User Auth      │    │ • Voting Logic  │
│ • Dashboard     │    │ • On-chain Sync  │    │ • Collateral    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   (Neon)         │
                       │                  │
                       │ • Users          │
                       │ • Proposals      │
                       │ • Votes          │
                       └──────────────────┘
```

---

## 🚀 Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 18+](https://nodejs.org/)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html) (for smart contract development)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (optional)
- [Phantom Wallet](https://phantom.app/) browser extension

### Quick Start

```bash
# Clone repository
git clone https://github.com/yudai-mori-2004/citizen-hub.git
cd citizen-hub

# Start with Docker (recommended)
docker-compose up --build

# Or install and run locally
npm install
cp .env.example .env.local  # Configure environment
npm run db:init             # Initialize database
npm run dev                 # Start development server
```

The application will be available at **http://localhost:3000**

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Database (Neon PostgreSQL or Docker)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth (Google OAuth)
NEXTAUTH_SECRET="your-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Solana DevNet
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"

# Cron job security
CRON_SECRET="your-cron-secret"
```

---

## 📁 Project Structure

```
citizen-hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth configuration
│   │   │   ├── proposals/     # Proposal CRUD operations
│   │   │   ├── user/          # User data & statistics
│   │   │   └── cron/          # Scheduled tasks
│   │   ├── proposal/          # Proposal pages
│   │   │   ├── [id]/          # Individual proposal view
│   │   │   └── submit/        # Proposal submission
│   │   ├── dashboard/         # User activity dashboard
│   │   ├── airdrop/          # Token airdrop page
│   │   └── admin/            # Admin tools
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── Layout.tsx        # Main layout wrapper
│   │   ├── Navbar.tsx        # Navigation
│   │   ├── WalletButton.tsx  # Phantom wallet integration
│   │   └── PROSBalance.tsx   # Token balance display
│   ├── lib/                  # Utilities & configurations
│   │   ├── solana.ts         # Solana/Anchor setup
│   │   ├── program.ts        # Smart contract interactions
│   │   ├── db.ts             # Database connection
│   │   └── utils.ts          # Helper functions
│   ├── hooks/                # Custom React hooks
│   │   └── useWallet.ts      # Wallet state management
│   └── types/                # TypeScript definitions
├── programs/                 # Solana smart contracts
│   └── citizenhub-program/   # Anchor program
│       ├── src/lib.rs        # Rust smart contract code
│       └── Cargo.toml        # Rust dependencies
├── sql/                      # Database schema
│   └── init.sql              # Complete DB initialization
├── scripts/                  # Utility scripts
│   ├── sync-proposals-onchain.js  # Sync existing data
│   └── utils/                # Development tools
├── docker-compose.yml        # Development environment
├── Anchor.toml              # Anchor configuration
└── package.json             # Node.js dependencies
```

---

## 🔧 Development Workflow

### Database Operations

```bash
# Initialize database (creates tables, indexes, seed data)
npm run db:init

# Run migrations
npm run db:migrate

# Reset database
npm run db:seed
```

### Smart Contract Development

```bash
# Build Solana program
npm run anchor:build
# or: anchor build

# Test smart contracts
npm run anchor:test
# or: anchor test

# Deploy to DevNet
npm run anchor:deploy
# or: anchor deploy
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Lint code
npm run lint
```

### Docker Development

```bash
# Start all services
npm run docker:up
# or: docker-compose up --build

# Stop all services
npm run docker:down
# or: docker-compose down

# Reset everything (including database)
docker-compose down -v && docker-compose up --build
```

### System Utilities

```bash
# Check system status (vault accounts, PDAs)
npm run check-system

# Sync existing proposals to blockchain
npm run sync-proposals

# Verify on-chain data integrity
node scripts/utils/verify-onchain-proposals.js
```

---

## 🎯 Voting Mechanics

### System Flow

1. **Proposal Creation**
   - User submits proposal with 100 PROS collateral
   - Proposal gets unique on-chain hash and PDA
   - Voting starts next day at UTC 0:00

2. **Voting Process**
   - 7-day voting period
   - Support scale: -100% (oppose) to +100% (support)
   - Minimum 20 PROS collateral per vote
   - Equal voting weight regardless of stake

3. **Result Calculation**
   - Simple majority (≥50% support = approved)
   - Winners receive proportional share of losers' collateral
   - Proposal submitter gets collateral back if approved

### Smart Contract Architecture

**Core Contracts:**
- `TokenMint`: PROS token management and minting
- `DepositLocker`: Collateral management and distribution
- `Logger`: On-chain hash recording for data integrity

**Key Functions:**
- `initialize_mint()`: Set up PROS token system
- `register_proposal()`: Record proposal hash on-chain
- `stake_for_proposal()`: Lock proposer collateral
- `stake_for_vote()`: Lock voter collateral
- `finalize_distribution()`: Distribute rewards to winners

---

## 📡 API Reference

### Proposals API

```typescript
// Get all proposals
GET /api/proposals
Response: { proposals: Proposal[] }

// Create new proposal
POST /api/proposals
Body: { title: string, description: string, wallet_address: string, tx_signature: string }
Response: { success: boolean, proposal: Proposal }

// Get specific proposal
GET /api/proposals/[id]
Response: { proposal: Proposal, votes: Vote[] }

// Vote on proposal
POST /api/proposals/[id]/vote
Body: { support_level: number, comment?: string, wallet_address: string, tx_signature: string }
Response: { success: boolean, vote: Vote }
```

### User API

```typescript
// Get user activity and statistics
GET /api/user/balance
Headers: { Cookie: session }
Response: { 
  activities: Activity[], 
  statistics: { totalProposals, totalVotes, totalStaked } 
}
```

### Authentication API

```typescript
// NextAuth endpoints
GET /api/auth/session        # Current session
POST /api/auth/signin        # Google OAuth login
POST /api/auth/signout       # Logout
```

---

## 🛠️ Configuration

### Smart Contract Addresses (DevNet)

Update these in your environment when deploying:

```typescript
// Current deployment
PROGRAM_ID = "GcwrHG7nXB2Tz9P2GcwYfvgTvMdN3vkVWBhMzvEsZfhk"
PROS_MINT = "7w4KenXsTxNZAVt2z6NszouoYTfuvAGyP7y8FqA3M96i"
MINT_AUTHORITY = "GjVoCKKSKBFxqiPhgcSKQ2GMoj4MaoWykyxbsc5PQiyV"
```

### Database Schema

Key tables and relationships:

```sql
users (id, email, name, google_id, wallet_address)
  ↓
proposals (id, title, description, proposer_id, on_chain_proposal_seed)
  ↓
votes (id, proposal_id, voter_id, support_level, collateral_amount)
```

### Environment Variables

Required for production deployment:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random 32-byte secret
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint
- `CRON_SECRET`: Secure cron job access

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Connect GitHub repo to Vercel
# Set environment variables in dashboard
# Auto-deploy on push to main
```

### Database (Neon)

```bash
# Create Neon PostgreSQL database
# Run: psql $DATABASE_URL -f sql/init.sql
# Update DATABASE_URL in environment
```

### Smart Contracts (Solana DevNet)

```bash
# Configure target in Anchor.toml
anchor build
anchor deploy

# Update program IDs in:
# - src/lib/solana.ts
# - Environment variables
```

---

## 🧪 Testing

### Unit Tests

```bash
# Frontend tests
npm test

# Smart contract tests
anchor test
```

### Integration Testing

```bash
# Test complete flow
npm run dev                    # Start local server
npm run sync-proposals         # Sync test data
# Manual testing via UI
```

### Load Testing

```bash
# Database stress test
npm run db:seed               # Insert test data

# Blockchain stress test
node scripts/stress-test.js   # Multiple concurrent transactions
```

---

## 🤝 Contributing

### Development Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yudai-mori-2004/citizen-hub.git
   cd citizen-hub
   ```

2. **Set Up Environment**
   ```bash
   docker-compose up --build
   cp .env.example .env.local
   # Configure .env.local
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Develop & Test**
   ```bash
   npm run dev                  # Frontend development
   npm run anchor:test          # Smart contract testing
   npm run lint                 # Code quality
   ```

5. **Submit PR**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   # Open Pull Request
   ```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration
- **Prettier**: Auto-formatting
- **Conventional Commits**: Clear commit messages
- **Testing**: Unit tests for new features

### Architecture Decisions

- **App Router**: Next.js 13+ pattern
- **Server Components**: Default where possible
- **Client Components**: For interactivity only
- **API Routes**: RESTful design
- **Database**: Normalized PostgreSQL schema
- **Blockchain**: Anchor framework best practices

---

## 📚 Resources

### Documentation

- [Solana Developer Guide](https://docs.solana.com/developing)
- [Anchor Book](https://book.anchor-lang.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Phantom Wallet SDK](https://docs.phantom.app/)

### Community

- [Solana Discord](https://discord.gg/solana)
- [Anchor Discord](https://discord.gg/8HwmBtt2ss)
- [Next.js Discord](https://discord.gg/nextjs)

### Tools

- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- [Anchor Deploy Logs](https://anchor.so/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Database](https://neon.tech/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** for the powerful blockchain infrastructure
- **Crypto Cities Hackathon** for the inspiration and opportunity
- **Anchor Framework** for simplifying Solana development
- **Next.js Team** for the excellent React framework

---

**Built with ❤️ for democratic participation and blockchain innovation**