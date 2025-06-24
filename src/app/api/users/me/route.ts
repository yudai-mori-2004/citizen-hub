import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Mock user data
  const mockUser = {
    user_id: crypto.randomUUID(),
    email: 'user@example.com',
    kyc_status: 'Verified',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return NextResponse.json(mockUser);
}