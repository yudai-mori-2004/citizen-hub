# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CitizenHub is a democratic staking and voting platform for the Crypto Cities hackathon. This is a hybrid Web3 application combining:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Solana blockchain using Anchor framework
- **UI Components**: Radix UI with custom styling using shadcn/ui patterns

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

## Architecture

### Frontend Structure
- `src/app/` - Next.js app router pages
- `src/components/` - React components
  - `ui/` - Reusable UI components (buttons, cards, etc.)
  - Component files for specific features (HeroSection, ProposalCard, etc.)
- `src/lib/` - Utility functions and shared logic

### Blockchain Structure  
- `programs/citizenhub-program/` - Solana program written in Rust
- Program ID: `CLGiHLTiggu1bPa91aGUtP3viTxqmSe2FNa3gzh4goEU`
- Currently implements basic counter functionality as a foundation

### Key Technologies
- **Styling**: Tailwind CSS with custom components using class-variance-authority
- **Icons**: Lucide React
- **State Management**: React hooks (no external state management currently)
- **Blockchain**: Anchor framework v0.29.0

## Project Context

This is an active hackathon project with Japanese documentation and UI text. The current implementation includes:
- Basic proposal listing interface with dummy data
- Navigation structure for democratic voting platform
- Foundational Solana program structure
- Mobile-responsive design with Tailwind CSS

The codebase is in early development phase, transitioning from idea documentation to prototype implementation.