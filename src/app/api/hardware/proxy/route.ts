import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const res = await fetch('http://localhost:9005/status', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        return NextResponse.json({ active: true, source: 'proxy' });
      }
    }
  } catch (err) {
    // Proxy não está rodando
  }

  return NextResponse.json({ active: false });
}

export async function POST() {
  try {
    // Tenta verificar se o proxy já está rodando antes de iniciar outro
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const res = await fetch('http://localhost:9005/status', { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (res.ok) {
        return NextResponse.json({ success: true, message: 'O proxy já está ativo.', active: true });
      }
    } catch (e) {
      // Não está rodando, podemos iniciar
    }

    // Só é possível acionar processos locais se o servidor Next.js estiver rodando localmente
    const isLocalServer = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    if (!isLocalServer) {
      return NextResponse.json({ 
        success: false, 
        message: 'A inicialização automática do proxy não é suportada em servidores na nuvem. Execute o arquivo Iniciar-Proxy-Local.bat diretamente no computador local do Totem.' 
      }, { status: 400 });
    }

    // Dispara o proxy em background usando o desvio dinâmico do compilador para evitar que o Next.js tente empacotar o script local
    const cp = eval("require('child_process')");
    const path = eval("require('path')");
    const scriptPath = path.join(process.cwd(), 'scripts', 'camera-secure-proxy.js');
    
    const child = cp.spawn('node', [scriptPath], {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();

    // Aguarda um pequeno intervalo para garantir a inicialização do socket
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ 
      success: true, 
      message: 'Proxy local iniciado com sucesso em segundo plano!',
      active: true
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: `Erro ao iniciar o proxy: ${error.message}` 
    }, { status: 500 });
  }
}
