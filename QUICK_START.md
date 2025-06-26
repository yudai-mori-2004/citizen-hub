# 🚀 CitizenHub MVP Demo Guide

**Experience CitizenHub's democratic voting platform in 5 minutes!**

This guide will walk you through trying out the live MVP deployment - no coding required, just your browser and a Phantom wallet.

> **For developers**: Check out [README.md](./README.md) for setup and development documentation.

---

## 🎯 What You'll Experience

- **Democratic Voting**: Vote on real community proposals using blockchain
- **PROS Token Economy**: Use crypto tokens for transparent participation
- **Proposal Submission**: Submit your own ideas to the community
- **Real-time Results**: See live voting progress and outcomes

---

## 📋 Prerequisites

**Just 2 things needed:**

1. **Google Account** (for login)
2. **Phantom Wallet** ([Download here](https://phantom.app/))

**Time Required**: 5-10 minutes

---

## Step 1: Set Up Your Phantom Wallet 👻

### Install Phantom Wallet

1. **Download**: Visit [phantom.app](https://phantom.app/) and install browser extension
2. **Create Wallet**: Follow Phantom's setup guide to create a new wallet
3. **Save Recovery Phrase**: Store your 12-word phrase safely (you'll need this!)

### Switch to DevNet

🚨 **Important**: We're using Solana's test network (DevNet), not real money!

1. **Open Phantom**: Click the Phantom extension
2. **Settings**: Click gear icon → "Developer Settings"
3. **Change Network**: Select **"Devnet"** from dropdown
4. **Confirm**: You should see "Devnet" in the top corner

### Get DevNet SOL (Test Currency)

You need a small amount of test SOL for transaction fees:

**Option A**: Solana Faucet
1. **Copy Address**: In Phantom, click your wallet name to copy address
2. **Visit Faucet**: Go to [faucet.solana.com](https://faucet.solana.com/)
3. **Request SOL**: Paste address, select "Devnet", request 1-2 SOL

**Option B**: Direct Airdrop (if you have Solana CLI)
```bash
solana airdrop 2 <your-wallet-address> --url devnet
```

✅ **You should now have 1-2 SOL in your Phantom wallet on DevNet**

---

## Step 2: Access CitizenHub MVP 🏛️

### Visit the Platform

1. **Open**: https://citizen-hub-drab.vercel.app/
2. **Sign In**: Click "Sign In with Google"
3. **Authorize**: Allow Google OAuth permissions
4. **Connect Wallet**: Click "Connect Phantom" and approve connection

✅ **You're now logged in and connected!**

---

## Step 3: Get PROS Tokens 🪙

PROS tokens are used for voting and proposal submission.

### Claim Your Airdrop

1. **Navigate**: Go to **"Get Free PROS"** page (should be in navigation)
2. **Claim Tokens**: Click **"Claim 1,000 PROS Tokens"**
3. **Approve Transaction**: Phantom will popup → Click **"Approve"**
4. **Wait**: Transaction takes 5-15 seconds to confirm

### Verify Your Balance

- **Check**: You should see "1,000 PROS" in your balance indicator
- **Refresh**: If not showing, refresh the page

✅ **You now have 1,000 PROS tokens for participating!**

---

## Step 4: Browse & Vote on Proposals 🗳️

### Explore Active Proposals

1. **Homepage**: Go to main page to see proposal list
2. **Filter**: Look for proposals with **"Active"** status
3. **Read**: Click on any proposal to view details

### Cast Your First Vote

1. **Select Proposal**: Choose an active proposal that interests you
2. **Set Support Level**: 
   - Drag slider from **-100% (oppose)** to **+100% (support)**
   - Try different values to see how it affects your position
3. **Set Collateral**: 
   - Minimum **20 PROS** required
   - Higher amounts = larger reward if you're on winning side
4. **Add Comment** (optional): Share your reasoning
5. **Submit Vote**: Click **"Vote"** button
6. **Approve Transaction**: Confirm in Phantom wallet

### Understanding Voting

- **Support Scale**: -100% = strongly oppose, +100% = strongly support
- **Collateral System**: Your tokens are locked until voting ends
- **Winning**: If your side wins (majority), you get your tokens back + share of losers' tokens
- **Losing**: If your side loses, you forfeit your staked tokens

✅ **You've cast your first democratic vote on the blockchain!**

---

## Step 5: Submit Your Own Proposal 📝

### Create a Proposal

1. **Navigate**: Go to **"Submit Proposal"** page
2. **Fill Details**:
   - **Title**: Clear, concise description (e.g., "Install Solar Panels on City Hall")
   - **Description**: Detailed explanation of your idea, benefits, and implementation
3. **Review Collateral**: 100 PROS tokens required (automatically deducted)
4. **Submit**: Click **"Submit Proposal"**
5. **Approve Transaction**: Confirm the staking transaction in Phantom

### What Happens Next

- **Voting Delay**: Voting starts tomorrow at 0:00 UTC (prevents manipulation)
- **Voting Period**: 7 days of community voting
- **Results**: If approved (≥50% support), you get your 100 PROS back
- **If Rejected**: You lose your 100 PROS tokens

✅ **You've submitted a proposal to the community!**

---

## Step 6: Monitor Your Activity 📊

### Check Your Dashboard

1. **Visit**: Go to **"Dashboard"** page
2. **Review Stats**:
   - **Proposals Submitted**: How many ideas you've contributed
   - **Votes Cast**: Your participation in community decisions
   - **Total Staked**: PROS tokens you have at risk
   - **Successful Proposals**: Ideas of yours that were approved

### Track Your Votes & Proposals

- **Recent Activity**: See timeline of your participation
- **Transaction Links**: Click to view on Solana blockchain explorer
- **PROS Balance**: Real-time token balance updates

✅ **You can track all your democratic participation!**

---

## 🎯 What You've Accomplished

**Congratulations! You've just:**

- ✅ Set up a crypto wallet on Solana DevNet
- ✅ Obtained and used PROS governance tokens
- ✅ Participated in blockchain-based democratic voting
- ✅ Submitted a proposal for community consideration
- ✅ Experienced transparent, collateral-backed decision making

**This is the future of democratic participation!**

---

## 🔍 Understanding the System

### Key Concepts You've Used

**Democratic Innovation**:
- **Direct Democracy**: Vote directly on specific issues, not representatives
- **Transparent Process**: All votes recorded permanently on blockchain
- **Skin in the Game**: Collateral system ensures thoughtful participation

**Blockchain Benefits**:
- **Immutable Records**: Votes can't be changed or deleted
- **Transparent Counting**: Results calculated automatically by smart contracts
- **Global Access**: Participate from anywhere with internet

**Token Economics**:
- **PROS Tokens**: Governance currency for participation
- **Collateral System**: Prevents spam, rewards good judgment
- **Self-Sustaining**: Winners compensated by losers' stakes

---

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient SOL for transaction"**
- **Solution**: Get more DevNet SOL from [faucet.solana.com](https://faucet.solana.com/)
- **Need**: ~0.01 SOL per transaction for fees

**"PROS balance not showing"**
- **Solution**: Refresh page, check you're on DevNet, visit airdrop page again
- **Check**: Phantom wallet should show Devnet in corner

**"Transaction failed"**
- **Solution**: Ensure sufficient PROS balance, try increasing priority fee in Phantom
- **Retry**: Most failures are temporary network issues

**"Proposal voting not available"**
- **Reason**: Voting starts day after submission at UTC 0:00
- **Wait**: Check back tomorrow for voting to begin

**"Can't vote on my own proposal"**
- **Reason**: System prevents self-voting to avoid manipulation
- **Solution**: Ask friends to test vote on your proposal

### Getting Help

**Check These First**:
1. **Phantom Settings**: Confirm you're on "Devnet"
2. **PROS Balance**: Should show in navigation bar
3. **SOL Balance**: Need small amount for transaction fees
4. **Browser Refresh**: Often resolves display issues

**Still Stuck?**
- **Solana Explorer**: Search your wallet address at [explorer.solana.com](https://explorer.solana.com/?cluster=devnet)
- **Transaction Status**: Check if your transactions actually went through

---

## 🌟 Next Steps

### Explore More

**Try Different Scenarios**:
- Vote on multiple proposals with different support levels
- Submit proposals with varying complexity
- Check back daily to see voting progress
- Experience both winning and losing votes

**Understand the Impact**:
- **Real Democratic Innovation**: This technology could revolutionize governance
- **Blockchain Transparency**: All activity is publicly verifiable
- **Economic Incentives**: System rewards thoughtful participation

### Share the Experience

**Tell Others About**:
- **Democratic Participation**: How blockchain enables better voting
- **Token Economics**: How collateral systems work
- **Transparency**: Benefits of immutable, public records

---

## 🏆 You're Now a Blockchain Democracy Pioneer!

**You've experienced the future of democratic participation:**

- **Transparent Voting**: Every vote recorded immutably
- **Economic Incentives**: Rewarding good judgment, discouraging spam
- **Direct Democracy**: Vote on specific issues, not representatives
- **Global Accessibility**: Participate from anywhere in the world

**Share your experience and help build the future of governance!**

---

**Questions? Feedback? Want to contribute?** Check out our [developer documentation](./README.md) or join our community discussions.