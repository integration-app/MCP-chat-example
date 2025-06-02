import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { invokeMCPAgent } from '@/lib/mcp-agent';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }
    const response = await invokeMCPAgent({ auth, message });
    return NextResponse.json({ response });
  } catch (error: unknown) {
    let errorMsg = 'Failed to process chat';
    if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMsg = (error as { message: string }).message;
    }
    console.error('Error processing chat:', error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
} 