import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Mock user creation
    const mockUser = {
      user_id: crypto.randomUUID(),
      email,
      created_at: new Date().toISOString(),
      kyc_status: 'None'
    };
    
    return NextResponse.json(mockUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}