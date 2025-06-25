# CitizenHub 🏛️

A Solana-based democratic proposal and voting platform that enables transparent, collateral-backed community decision making.

## 🌟 Features

- **Democratic Voting**: Sliding scale voting from -100% (oppose) to +100% (support)
- **Collateral System**: PROS token staking for both proposals and votes
- **Transparent Results**: Real-time vote visualization with histograms
- **Web3 Integration**: Phantom wallet connectivity with Solana blockchain
- **Spam Protection**: Collateral requirements prevent low-quality submissions

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom components
- **Authentication**: NextAuth.js with Google OAuth
- **Wallet**: Phantom wallet integration for Solana transactions

### Backend
- **Database**: Neon PostgreSQL (serverless)
- **API**: Next.js App Router with API routes
- **Authentication**: Session-based auth with Google OAuth

### Blockchain
- **Network**: Solana Devnet
- **Framework**: Anchor v0.29.0
- **Token**: PROS token (6 decimals) for collateral system
- **Smart Contracts**: Proposal registration, voting, and collateral management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Phantom wallet browser extension

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yudai-mori-2004/citizen-hub.git
cd citizen-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy the sample environment file and configure it:
```bash
cp .env.sample .env.local
```
Then edit `.env.local` with your actual credentials (see `.env.sample` for detailed instructions)

4. **Set up the database**
Run the SQL migrations in the `sql/` directory:
```sql
-- Create tables (see sql/schema.sql)
-- Add on-chain fields (see sql/add_onchain_fields.sql)
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🗳️ How It Works

### For Proposers
1. **Submit Proposal**: Create a proposal with title, description, and collateral (min 100 PROS)
2. **Collateral Lock**: PROS tokens are locked on-chain until voting ends
3. **Result**: If approved, collateral is returned; if rejected, collateral is forfeited

### For Voters
1. **Vote**: Use sliding scale from -100% to +100% with optional comments
2. **Stake**: Lock PROS tokens (min 20) to participate in voting
3. **Rewards**: Winners share losers' collateral proportional to their stake

### Voting Schedule
- **Proposal Creation**: Anytime with collateral
- **Voting Period**: 7 days starting next day at 0:00 UTC
- **Results**: Automatic calculation based on majority support

## 💻 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19 with TypeScript
- Tailwind CSS + shadcn/ui components
- Lucide React icons

### Backend & Database
- Next.js API routes
- Neon PostgreSQL
- NextAuth.js authentication

### Blockchain
- Solana Web3.js
- Anchor framework
- SPL Token (PROS token)
- Phantom wallet adapter

## 🧪 Development

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Smart Contract Development
```bash
anchor build         # Build Solana program
anchor test          # Run program tests
anchor deploy        # Deploy to configured cluster
```

## 📁 Project Structure

```
citizen-hub/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript type definitions
├── programs/               # Anchor smart contracts
├── sql/                   # Database migrations
└── public/               # Static assets
```

## 🛡️ Security Features

- **Authentication**: Google OAuth integration
- **Wallet Security**: Client-side wallet connection only
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Collateral requirements prevent spam
- **Data Integrity**: On-chain transaction verification

## 🌍 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database (Neon)
1. Create Neon PostgreSQL database
2. Run migration scripts
3. Update DATABASE_URL in environment variables

### Smart Contracts (Solana)
1. Configure Anchor.toml for target network
2. Deploy using `anchor deploy`
3. Update program IDs in frontend code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Crypto Cities hackathon
- Powered by Solana blockchain technology
- UI components from shadcn/ui
- Icons from Lucide React

---

**CitizenHub** - Empowering democratic decision making through blockchain technology 🚀
