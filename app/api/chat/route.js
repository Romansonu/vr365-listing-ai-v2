import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const body = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
