import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/hardware/led
 * ----------------------------------------------------------------------------
 * Esta rota atua como um Proxy de Servidor (Server-Side Proxy).
 * 
 * Por que é necessária?
 * Os navegadores modernos implementam políticas rígidas de segurança de rede
 * (Private Network Access - PNA e CORS Sandboxing). Chamadas diretas em AJAX/Fetch 
 * partindo do navegador do Totem (localhost:3000) para IPs da rede interna (172.16.1.5)
 * são ativamente bloqueadas pelo navegador.
 * 
 * Executando a requisição a partir do Servidor Node.js (Next.js backend), 
 * contornamos totalmente as restrições do navegador, garantindo entrega 100% confiável 
 * dos comandos de ligar/desligar o LED Flash.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');
  const action = searchParams.get('action'); // 'on' ou 'off'

  if (!ip || !action) {
    return NextResponse.json(
      { error: 'IP e ação (on/off) são obrigatórios.' }, 
      { status: 400 }
    );
  }

  // Sanitiza o IP e extrai a base (remove parâmetros de query e /stream se houver)
  let cleanIp = ip.split('?')[0].replace(/\/stream\/?$/i, '').trim();
  if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
    cleanIp = `http://${cleanIp}`;
  }

  const ledUrl = `${cleanIp}/led/${action}`;

  try {
    // Log removido para produção
    
    const controller = new AbortController();
    // Timeout de 4s para maior resiliência de conexões de hardware em rede local
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(ledUrl, {
      signal: controller.signal,
      cache: 'no-store', // Evita cache no servidor
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({ success: true, message: `LED turned ${action} successfully` });
    } else {
      return NextResponse.json(
        { success: false, error: `ESP32 respondeu com status: ${response.status}` }, 
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error(`[LED PROXY ERRO] Falha ao acionar LED em ${ledUrl}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha de conexão física com a ESP32-CAM' }, 
      { status: 500 }
    );
  }
}
