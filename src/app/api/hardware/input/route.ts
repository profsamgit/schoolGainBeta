import { NextResponse } from 'next/server';

/**
 * Este é um armazenamento temporário em memória para o desenvolvimento local.
 * Em produção, isso deveria estar em um Banco de Dados (Redis/Postgres).
 */
const pendingLogins: Record<string, { ra: string, timestamp: number }> = {};

export async function POST(request: Request) {
  try {
    const { ra, terminalId, token } = await request.json();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    fetch(`http://localhost:9005/register-ip?ip=${clientIp}`).catch(() => null);

    const expectedToken = process.env.HARDWARE_TOKEN || 'sg_hardware_secret_2026';
    const authHeader = request.headers.get('authorization');
    
    if (token !== expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.error(`[HARDWARE] Tentativa de login não autorizada no Terminal ${terminalId}`);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!ra || !terminalId) {
      return NextResponse.json({ error: 'Dados incompletos (ra e terminalId são obrigatórios)' }, { status: 400 });
    }

    // Armazena o login pendente por 30 segundos
    pendingLogins[terminalId] = {
      ra,
      timestamp: Date.now()
    };

    // Hardware Input Log suprimido em produção

    return NextResponse.json({ success: true, message: 'Login registrado com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao processar login' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const terminalId = searchParams.get('terminalId');

  if (!terminalId) {
    return NextResponse.json({ error: 'terminalId obrigatório' }, { status: 400 });
  }

  const login = pendingLogins[terminalId];

  // Se houver um login e ele for recente (últimos 5 segundos)
  if (login && (Date.now() - login.timestamp) < 5000) {
    // Limpa após ler para não logar várias vezes
    delete pendingLogins[terminalId];
    return NextResponse.json({ ra: login.ra });
  }

  return NextResponse.json({ ra: null });
}
