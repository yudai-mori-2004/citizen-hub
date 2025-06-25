import { NextRequest, NextResponse } from 'next/server';
import { updateProposalStatuses, distributeCollateralAfterVoting, getAllProposals } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron job call
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running daily proposal status update...');
    
    // Update proposal statuses
    const updateResult = await updateProposalStatuses();
    console.log(`Updated ${updateResult.updated} proposals`);

    // Get newly finalized proposals and distribute collateral
    const allProposals = await getAllProposals();
    const newlyFinalized = allProposals.filter(p => 
      p.status === 'Finalized' && 
      !(p as any).collateral_returned
    );

    let distributedCount = 0;
    for (const proposal of newlyFinalized) {
      try {
        await distributeCollateralAfterVoting(proposal.id);
        distributedCount++;
        console.log(`Distributed collateral for proposal: ${proposal.id}`);
      } catch (error) {
        console.error(`Failed to distribute collateral for proposal ${proposal.id}:`, error);
      }
    }

    console.log(`Distributed collateral for ${distributedCount} proposals`);

    return NextResponse.json({ 
      success: true, 
      message: `Daily update completed. Updated ${updateResult.updated} proposals, distributed collateral for ${distributedCount} proposals.`,
      updated: updateResult.updated,
      collateral_distributed: distributedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daily status update failed:', error);
    return NextResponse.json(
      { 
        error: 'Daily status update failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
