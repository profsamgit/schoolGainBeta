import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  try {
    let filePath = '';
    let contentType = 'application/octet-stream';
    let fileName = '';

    if (file === 'start') {
      filePath = path.join(process.cwd(), 'Iniciar-Proxy-Local.bat');
      contentType = 'application/x-bat';
      fileName = 'Iniciar-Proxy-Local.bat';
    } else if (file === 'stop') {
      filePath = path.join(process.cwd(), 'Parar-Proxy-Local.bat');
      contentType = 'application/x-bat';
      fileName = 'Parar-Proxy-Local.bat';
    } else if (file === 'script') {
      filePath = path.join(process.cwd(), 'scripts', 'camera-secure-proxy.js');
      contentType = 'application/javascript';
      fileName = 'camera-secure-proxy.js';
    } else if (file === 'espcam') {
      filePath = path.join(process.cwd(), 'hardware', 'espcam', 'espcam.ino');
      contentType = 'text/plain';
      fileName = 'espcam.ino';
    } else if (file === 'totem') {
      filePath = path.join(process.cwd(), 'hardware', 'totem_controller', 'totem_controller.ino');
      contentType = 'text/plain';
      fileName = 'totem_controller.ino';
    } else if (file === 'readme') {
      filePath = path.join(process.cwd(), 'hardware', 'README.md');
      contentType = 'text/markdown';
      fileName = 'README.md';
    } else {
      return NextResponse.json({ error: 'Arquivo de download inválido. Use ?file=start, stop, script, espcam, totem ou readme' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo físico não encontrado no servidor' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
