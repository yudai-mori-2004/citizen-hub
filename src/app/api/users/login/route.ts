import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Mock login - accept any credentials for development
    console.log('Mock login attempt:', { email, password });
    
    const mockSession = {
      session_token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    return NextResponse.json(mockSession);
  } catch {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}