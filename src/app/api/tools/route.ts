import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { getAvailableMcpTools } from '@/lib/mcp-agent';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const tools = await getAvailableMcpTools(auth);
    return NextResponse.json({ tools });
  } catch (error: unknown) {
    let errorMsg = 'Failed to fetch tools';
    if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMsg = (error as { message: string }).message;
    }
    console.error('Error fetching MCP tools:', error);
    return NextResponse.json({ tools: {}, error: errorMsg }, { status: 500 });
  }
} 