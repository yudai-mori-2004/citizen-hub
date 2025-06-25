# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CitizenHub is a Solana-based democratic proposal and voting platform for the Crypto Cities hackathon. This platform allows residents to post opinions and enables democratic voting to select truly supported proposals from numerous opinions.

The core philosophy addresses the structural limitations of representative democracy by implementing direct democratic selection of specific proposals, eliminating the transparency issues and high costs of traditional opinion collection methods.

**Technology Stack:**
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Database**: Neon PostgreSQL (serverless) for off-chain data
- **Blockchain**: Solana Devnet with Anchor framework v0.29.0
- **Authentication**: NextAuth with Google OAuth
- **Backend**: Next.js App Router API routes with Vercel deployment
- **UI Components**: Radix UI with custom styling using shadcn/ui patterns
- **Token**: PROS token for staking and rewards system

## Development Commands

### Frontend (Next.js)
- `npm run dev` - Start development server
- `npm run build` - Build production bundle  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Blockchain (Anchor/Solana)
- `anchor build` - Build Solana program
- `anchor test` - Run program tests
- `anchor deploy` - Deploy to configured cluster

The project uses Solana devnet by default (configured in Anchor.toml).

## System Architecture

### Participants and Roles

**1. Proposers**
- Submit proposals with collateral (default: 100 PROS tokens)
- Collateral returned if proposal passes, lost if rejected
- AI spam filtering prevents inappropriate content
- Voting starts next day at UTC 0:00, runs for exactly 7 days

**2. Voters**  
- Vote with sliding scale from -100% (strong oppose) to +100% (strong support)
- Minimum collateral required (default: 20 PROS tokens)
- Winners receive share of losers' collateral proportional to their stake
- One vote per proposal per user, equal voting weight regardless of stake

**3. Policy Implementers**
- Access democratically filtered citizen opinions
- Reduce information collection costs
- Focus on truly supported proposals

### Technical Structure

**Frontend Pages:**
- Authentication (Google OAuth + Solana wallet connection)
- Proposal submission form (with AI spam check)
- Home page with categorized proposals
- Proposal list with filtering (Pending/Voting/Approved/Rejected)
- Dynamic proposal detail pages
- Voting interface with slider and collateral selection
- User dashboard with activity history

**Backend/API:**
- NextAuth Google authentication
- Solana transaction generation for votes/proposals
- AI-powered spam detection
- Daily cron job for status updates (UTC 0:00)
- Off-chain data in Neon PostgreSQL, on-chain hashes for verification

**Smart Contracts (Anchor/Solana):**
- `TokenMint`: PROS token management and Bonding Curve
- `DepositLocker`: Collateral management and automatic distribution
- `Logger`: On-chain hash recording for data integrity verification

## Implementation Phases

### MVP Phase (Current)
**Target**: Basic democratic voting with collateral system
**Status**: Database integration complete, building core voting mechanics
**Key Features**:
- Google OAuth authentication (no KYC for MVP)
- Proposal submission and voting with 7-day cycles
- Basic majority decision making
- Neon PostgreSQL for data persistence
- Manual smart contract security review

**Deferred for MVP**:
- AI spam detection (basic filtering only)
- Wallet integration and PROS token economics
- Advanced vote encryption
- Automated external security audits
- On-chain verification system

### Production Phase (Future)  
**Target**: Full Web3 integration with tokenomics
**Planned Features**:
- Phantom wallet connection and PROS token staking
- Advanced AI spam detection system
- Collateral distribution and reward mechanics
- On-chain hash verification for data integrity
- Professional smart contract audit
- KYC integration for enhanced security

## Database Schema (Neon PostgreSQL)

Based on the specification, the following tables should be implemented:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  wallet_address VARCHAR(255), -- For Phase 2
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Proposals Table
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proposer_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Finalized')),
  voting_start_date TIMESTAMP WITH TIME ZONE, -- Next 0:00 after creation
  voting_end_date TIMESTAMP WITH TIME ZONE,   -- 5 days after start
  final_result VARCHAR(20) CHECK (final_result IN ('approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Votes Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id),
  voter_id UUID REFERENCES users(id),
  support_level INTEGER CHECK (support_level >= 0 AND support_level <= 100),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(proposal_id, voter_id)
);
```

## Voting Schedule System

- **Proposal Creation**: Anytime (requires 100 PROS collateral)
- **Voting Start**: Next day at 0:00 UTC (automatically calculated)
- **Voting Duration**: Exactly 7 days
- **Status Updates**: Daily at 0:00 UTC via Vercel Cron (max 1 job/day)
- **Voting Method**: Sliding scale from -100% to +100% with optional comments
- **Minimum Voting Collateral**: 20 PROS tokens
- **Result Calculation**: Simple majority (support_level >= 50)

## Environment Variables Required

```env
# Neon Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=random-secret-string
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Vercel Cron Secret (for API security)
CRON_SECRET=random-cron-secret
```

## Implementation Priority

### Current Sprint (MVP)
1. **Core Voting Mechanics**: Implement sliding scale voting system (-100 to +100)
2. **Collateral System**: Add PROS token collateral requirements and tracking
3. **Voting Schedule**: Fix 7-day voting duration (currently 5 days)
4. **Result Distribution**: Implement winner/loser collateral redistribution logic
5. **User Dashboard**: Build comprehensive activity and transaction history
6. **Spam Detection**: Basic content filtering before AI integration

### Next Sprint (Web3 Integration)
1. **Wallet Connection**: Phantom wallet integration
2. **Smart Contracts**: Deploy TokenMint, DepositLocker, Logger contracts
3. **Token Economics**: PROS token minting and distribution
4. **On-chain Verification**: Hash verification system
5. **Advanced Features**: AI spam detection, encrypted voting