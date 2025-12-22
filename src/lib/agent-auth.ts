import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify that the request is coming from the ElevenLabs agent
 * Uses a shared secret token stored in environment variables
 */
export function verifyAgentAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.AGENT_WEBHOOK_SECRET;

  // If no secret is configured, allow all requests (development mode)
  if (!expectedToken) {
    console.warn('AGENT_WEBHOOK_SECRET not configured - webhook authentication disabled');
    return null;
  }

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (token !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }

  // Valid authentication
  return null;
}
