import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/hardware/camera
 * ----------------------------------------------------------------------------
 * Esta rota atua como um Proxy de Servidor para alterar a resolução da ESP32-CAM.
 * 
 * Evita bloqueios de CORS e Private Network Access (PNA) no navegador do Totem
 * ao fazer a chamada de rede local no servidor do Next.js.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');
  const resolution = searchParams.get('resolution'); // 'vga' | 'hd' | 'cif'

  if (!ip || !resolution) {
    return NextResponse.json(
      { error: 'IP e resolution (vga/hd) são obrigatórios.' }, 
      { status: 400 }
    );
  }

  // Sanitiza o IP e extrai a base (remove parâmetros de query e /stream se houver)
  let cleanIp = ip.split('?')[0].replace(/\/stream\/?$/i, '').trim();
  if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
    cleanIp = `http://${cleanIp}`;
  }

  const cameraUrl = `${cleanIp}/resolution?val=${resolution.toLowerCase()}`;

  try {
    console.log(`[CAMERA PROXY] Mudando resolução da ESP32-CAM em: ${cameraUrl}`);
    
    const controller = new AbortController();
    // Timeout de 1.5s para permitir a alteração física dos registradores do sensor
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(cameraUrl, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({ success: true, message: `Resolution changed to ${resolution} successfully` });
    } else {
      return NextResponse.json(
        { success: false, error: `ESP32 respondeu com status: ${response.status}` }, 
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error(`[CAMERA PROXY ERRO] Falha ao alterar resolução em ${cameraUrl}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha de conexão com a ESP32-CAM' }, 
      { status: 500 }
    );
  }
}
