import { sql } from './db';

// Types based on our database schema
export interface User {
  id: string;
  email: string;
  name: string  |  null;
  image: string | null;
  google_id: string | null;
  wallet_address: string | null;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer_id: string;
  status: 'Pending' | 'Active' | 'Finalized';
  voting_start_date: string | null;
  voting_end_date: string | null;
  final_result: 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  voter_id: string;
  support_level: number; // -100 to +100 scale: -100 = strong oppose, 0 = neutral, +100 = strong support
  comment: string | null;
  created_at: string;
}

// Proposal queries
export async function getAllProposals(): Promise<Proposal[]> {
  const result = await sql`
    SELECT * FROM proposals 
    ORDER BY created_at DESC
  `;
  return result as Proposal[];
}

export async function getProposalById(id: string): Promise<Proposal | null> {
  const result = await sql`
    SELECT * FROM proposals 
    WHERE id = ${id}
  `;
  return result[0] as Proposal || null;
}

export async function createProposal(
  title: string,
  description: string,
  proposerId: string
): Promise<Proposal> {
  // Calculate voting start date (next day at 0:00 UTC)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  // Calculate voting end date (7 days after start per v3.0 specification)
  const endDate = new Date(tomorrow);
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  
  const result = await sql`
    INSERT INTO proposals (title, description, proposer_id, voting_start_date, voting_end_date)
    VALUES (${title}, ${description}, ${proposerId}, ${tomorrow.toISOString()}, ${endDate.toISOString()})
    RETURNING *
  `;
  return result[0] as Proposal;
}

// Vote queries
export async function getVotesByProposalId(proposalId: string): Promise<Vote[]> {
  const result = await sql`
    SELECT * FROM votes 
    WHERE proposal_id = ${proposalId}
    ORDER BY created_at DESC
  `;
  return result as Vote[];
}

export async function createVote(
  proposalId: string,
  voterId: string,
  supportLevel: number,
  comment?: string
): Promise<Vote> {
  const result = await sql`
    INSERT INTO votes (proposal_id, voter_id, support_level, comment)
    VALUES (${proposalId}, ${voterId}, ${supportLevel}, ${comment || null})
    RETURNING *
  `;
  return result[0] as Vote;
}

export async function hasUserVoted(proposalId: string, userId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM votes 
    WHERE proposal_id = ${proposalId} AND voter_id = ${userId}
  `;
  return result.length > 0;
}

// User queries
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users 
    WHERE email = ${email}
  `;
  return result[0] as User || null;
}

export async function createUser(
  email: string,
  name: string,
  image?: string,
  googleId?: string
): Promise<User> {
  const result = await sql`
    INSERT INTO users (email, name, image, google_id)
    VALUES (${email}, ${name}, ${image || null}, ${googleId || null})
    RETURNING *
  `;
  return result[0] as User;
}

// Status update functions for cron job
export async function updateProposalStatuses(): Promise<{ updated: number }> {
  const now = new Date();
  
  // Update Pending to Active if voting start date has passed
  const activatedResult = await sql`
    UPDATE proposals 
    SET status = 'Active', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'Pending' 
    AND voting_start_date <= ${now.toISOString()}
  `;
  
  // Update Active to Finalized if voting end date has passed
  const finalizedResult = await sql`
    UPDATE proposals 
    SET status = 'Finalized', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'Active' 
    AND voting_end_date <= ${now.toISOString()}
  `;
  
  // Calculate results for newly finalized proposals
  await calculateFinalResults();
  
  return { 
    updated: (activatedResult as any).count + (finalizedResult as any).count 
  };
}

async function calculateFinalResults(): Promise<void> {
  // Get newly finalized proposals without final_result
  const proposals = await sql`
    SELECT id FROM proposals 
    WHERE status = 'Finalized' AND final_result IS NULL
  `;
  
  for (const proposal of proposals) {
    // Get vote statistics for -100 to +100 scale
    // Positive votes (1 to 100) are support, negative votes (-100 to -1) are oppose, 0 is neutral
    const voteStats = await sql`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(CASE WHEN support_level > 0 THEN 1 END) as support_votes,
        COUNT(CASE WHEN support_level < 0 THEN 1 END) as oppose_votes,
        COUNT(CASE WHEN support_level = 0 THEN 1 END) as neutral_votes,
        AVG(support_level) as average_support
      FROM votes 
      WHERE proposal_id = ${proposal.id}
    `;
    
    const stats = voteStats[0] as any;
    // A proposal is approved if more people support than oppose (neutral votes don't count toward either side)
    const result = stats.support_votes > stats.oppose_votes ? 'approved' : 'rejected';
    
    await sql`
      UPDATE proposals 
      SET final_result = ${result}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${proposal.id}
    `;
  }
}

// Voting schedule calculation (7-day duration starting next day at 0:00 UTC)
export function getVotingSchedule(): { votingStartDate: Date; votingEndDate: Date } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const endDate = new Date(tomorrow);
  endDate.setUTCDate(endDate.getUTCDate() + 7); // Changed from 5 to 7 days per v3.0 specification
  
  return {
    votingStartDate: tomorrow,
    votingEndDate: endDate
  };
}

// Collateral and PROS token management
export interface CollateralTransaction {
  id: string;
  user_id: string;
  proposal_id: string |  null;
  vote_id: string | null;
  transaction_type: "lock" | "return" | "forfeit" | "profit";
  amount: number;
  description: string | null;
  created_at: string;
}

export async function getUserProsBalance(userId: string): Promise<number> {
  const result = await sql`
    SELECT pros_balance FROM users 
    WHERE id = ${userId}
  `;
  return result[0]?.pros_balance || 0;
}

export async function updateUserProsBalance(userId: string, newBalance: number): Promise<void> {
  await sql`
    UPDATE users 
    SET pros_balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
}

export async function createCollateralTransaction(
  userId: string,
  transactionType: "lock" | "return" | "forfeit" | "profit",
  amount: number,
  description: string,
  proposalId?: string,
  voteId?: string
): Promise<CollateralTransaction> {
  const result = await sql`
    INSERT INTO collateral_transactions (
      user_id, proposal_id, vote_id, transaction_type, amount, description
    )
    VALUES (
      ${userId}, 
      ${proposalId || null}, 
      ${voteId || null}, 
      ${transactionType}, 
      ${amount}, 
      ${description}
    )
    RETURNING *
  `;
  return result[0] as CollateralTransaction;
}

export async function lockProposalCollateral(
  title: string,
  description: string,
  proposerId: string,
  collateralAmount: number = 100
): Promise<{ proposal: Proposal; transaction: CollateralTransaction }> {
  // Check user balance
  const userBalance = await getUserProsBalance(proposerId);
  if (userBalance < collateralAmount) {
    throw new Error(`Insufficient PROS balance. Required: ${collateralAmount}, Available: ${userBalance}`);
  }

  // Create proposal with collateral
  const { votingStartDate, votingEndDate } = getVotingSchedule();
  
  const proposalResult = await sql`
    INSERT INTO proposals (
      title, description, proposer_id, voting_start_date, voting_end_date,
      collateral_amount, collateral_locked
    )
    VALUES (
      ${title}, ${description}, ${proposerId}, 
      ${votingStartDate.toISOString()}, ${votingEndDate.toISOString()},
      ${collateralAmount}, true
    )
    RETURNING *
  `;
  
  const proposal = proposalResult[0] as Proposal;

  // Lock collateral
  await updateUserProsBalance(proposerId, userBalance - collateralAmount);
  
  const transaction = await createCollateralTransaction(
    proposerId,
    "lock",
    collateralAmount,
    `Proposal submission: ${title}`,
    proposal.id
  );

  return { proposal, transaction };
}

export async function lockVoteCollateral(
  proposalId: string,
  voterId: string,
  supportLevel: number,
  comment: string | null,
  collateralAmount: number = 20
): Promise<{ vote: Vote; transaction: CollateralTransaction }> {
  // Check user balance
  const userBalance = await getUserProsBalance(voterId);
  if (userBalance < collateralAmount) {
    throw new Error(`Insufficient PROS balance. Required: ${collateralAmount}, Available: ${userBalance}`);
  }

  // Create/update vote with collateral
  const voteResult = await sql`
    INSERT INTO votes (proposal_id, voter_id, support_level, comment, collateral_amount, collateral_locked)
    VALUES (${proposalId}, ${voterId}, ${supportLevel}, ${comment}, ${collateralAmount}, true)
    ON CONFLICT (proposal_id, voter_id) 
    DO UPDATE SET 
      support_level = EXCLUDED.support_level,
      comment = EXCLUDED.comment,
      collateral_amount = EXCLUDED.collateral_amount,
      collateral_locked = EXCLUDED.collateral_locked,
      created_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const vote = voteResult[0] as Vote;

  // Lock collateral
  await updateUserProsBalance(voterId, userBalance - collateralAmount);
  
  const transaction = await createCollateralTransaction(
    voterId,
    "lock",
    collateralAmount,
    `Vote on proposal`,
    proposalId,
    vote.id
  );

  return { vote, transaction };
}

export async function distributeCollateralAfterVoting(proposalId: string): Promise<void> {
  // Get proposal and voting results
  const proposal = await getProposalById(proposalId);
  if (!proposal || proposal.status !== "Finalized") {
    throw new Error("Proposal not ready for collateral distribution");
  }

  const votes = await getVotesByProposalId(proposalId);
  const supportVotes = votes.filter(v => (v as any).support_level > 0);
  const opposeVotes = votes.filter(v => (v as any).support_level < 0);
  
  const isApproved = proposal.final_result === "approved";
  const winners = isApproved ? supportVotes : opposeVotes;
  const losers = isApproved ? opposeVotes : supportVotes;

  // Calculate total collateral
  const totalWinnerCollateral = winners.reduce((sum, vote) => sum + ((vote as any).collateral_amount || 20), 0);
  const totalLoserCollateral = losers.reduce((sum, vote) => sum + ((vote as any).collateral_amount || 20), 0);

  // Distribute loser collateral to winners proportionally
  for (const winner of winners) {
    const winnerCollateral = (winner as any).collateral_amount || 20;
    const winnerPortion = totalWinnerCollateral > 0 ? winnerCollateral / totalWinnerCollateral : 0;
    const profit = Math.floor(totalLoserCollateral * winnerPortion);
    
    // Return original collateral + profit
    const totalReturn = winnerCollateral + profit;
    
    if (totalReturn > 0) {
      const currentBalance = await getUserProsBalance(winner.voter_id);
      await updateUserProsBalance(winner.voter_id, currentBalance + totalReturn);
      
      // Record transactions
      await createCollateralTransaction(
        winner.voter_id,
        "return",
        winnerCollateral,
        `Collateral returned - proposal ${isApproved ? approved : rejected}`,
        proposalId,
        winner.id
      );
      
      if (profit > 0) {
        await createCollateralTransaction(
          winner.voter_id,
          "profit",
          profit,
          `Profit from correct vote`,
          proposalId,
          winner.id
        );
      }
    }
  }

  // Record loser collateral forfeit
  for (const loser of losers) {
    await createCollateralTransaction(
      loser.voter_id,
      "forfeit",
      (loser as any).collateral_amount || 20,
      `Collateral forfeited - incorrect vote`,
      proposalId,
      loser.id
    );
  }

  // Handle proposal collateral
  if (isApproved) {
    // Return proposal collateral to proposer
    const proposalCollateral = (proposal as any).collateral_amount || 100;
    const currentBalance = await getUserProsBalance(proposal.proposer_id);
    await updateUserProsBalance(proposal.proposer_id, currentBalance + proposalCollateral);
    
    await createCollateralTransaction(
      proposal.proposer_id,
      "return",
      proposalCollateral,
      `Proposal collateral returned - approved`,
      proposalId
    );
  } else {
    // Forfeit proposal collateral
    await createCollateralTransaction(
      proposal.proposer_id,
      "forfeit",
      (proposal as any).collateral_amount || 100,
      `Proposal collateral forfeited - rejected`,
      proposalId
    );
  }

  // Mark collateral as processed
  await sql`
    UPDATE proposals 
    SET collateral_returned = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${proposalId}
  `;
  
  await sql`
    UPDATE votes 
    SET collateral_returned = true, updated_at = CURRENT_TIMESTAMP
    WHERE proposal_id = ${proposalId}
  `;
}

export async function getUserTransactionHistory(userId: string): Promise<CollateralTransaction[]> {
  const result = await sql`
    SELECT * FROM collateral_transactions 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result as CollateralTransaction[];
}
