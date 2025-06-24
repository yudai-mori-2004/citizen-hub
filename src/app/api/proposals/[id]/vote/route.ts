import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { support_level, comment } = await request.json();
    const proposalId = params.id;
    
    // Mock vote submission
    const vote = {
      vote_id: crypto.randomUUID(),
      proposal_id: proposalId,
      voter: 'current-user',
      support_level, // 0-100 slider value
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      vote,
      message: '投票が完了しました'
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid vote data' },
      { status: 400 }
    );
  }
}