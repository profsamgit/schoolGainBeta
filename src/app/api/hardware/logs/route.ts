import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const url = target 
      ? `http://localhost:9005/logs?target=${target}` 
      : 'http://localhost:9005/logs';

    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Proxy não está rodando
  }

  return NextResponse.json({ error: 'Proxy local offline' }, { status: 503 });
}
