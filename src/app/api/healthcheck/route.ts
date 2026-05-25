import { NextResponse } from 'next/server';

async function checkInternet(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos de limite
    
    // Testa a conectividade externa com o próprio domínio do Cloud Firestore
    const res = await fetch('https://firestore.googleapis.com/v1/projects', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    // Se receber qualquer resposta da rede externa, a internet/Firestore está ativa
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  const isOnline = await checkInternet();
  return new NextResponse(isOnline ? 'OK' : 'OFFLINE', { status: isOnline ? 200 : 503 });
}

export async function HEAD() {
  const isOnline = await checkInternet();
  return new NextResponse(null, { status: isOnline ? 200 : 503 });
}
