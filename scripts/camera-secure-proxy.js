/**
 * 📟 ESP32-CAM LOCAL SECURE PROXY (DEPENDENCY-FREE)
 * ----------------------------------------------------------------------------
 * Este script roda localmente na escola e resolve o bloqueio de "Mixed Content"
 * e "Private Network Access (PNA)" no navegador do Totem de forma 100% gratuita.
 * 
 * Ele escuta na porta 9005 localmente, recebe as conexões da ESP32-CAM (HTTP)
 * e as retransmite adicionando os cabeçalhos de segurança CORS necessários.
 * 
 * 🔧 Como usar:
 * 1. Certifique-se de ter o Node.js instalado.
 * 2. Execute o script no terminal da máquina local da escola:
 *    node scripts/camera-secure-proxy.js
 * 
 * 3. No painel do Gestor Admin, configure a URL da Câmera do Totem como:
 *    http://localhost:9005/stream?target=192.168.1.100
 *    (Substitua "192.168.1.100" pelo IP real da sua ESP32-CAM).
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 9005;

/**
 * Obtém ou gera um Hardware ID persistente para a máquina do Totem.
 * Prioriza a leitura de um ID salvo no diretório home (~/.schoolgain_hwid).
 * Caso não exista, tenta usar o MAC address físico para gerar um ID.
 * Se falhar, gera um UUID/random string e persiste localmente.
 */
function getPersistentHardwareId() {
  const homeDir = os.homedir();
  const filePath = path.join(homeDir, '.schoolgain_hwid');

  // 1. Tenta ler ID existente no arquivo do sistema operacional
  try {
    if (fs.existsSync(filePath)) {
      const savedId = fs.readFileSync(filePath, 'utf8').trim();
      if (savedId && savedId.startsWith('SG-HW-')) {
        return savedId;
      }
    }
  } catch (err) {
    console.error('[PROXY] Erro ao ler hardware ID físico:', err.message);
  }

  // 2. Tenta obter o MAC address físico como identificador único estável
  let macAddress = null;
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.mac && net.mac !== '00:00:00:00:00:00' && !net.internal) {
          macAddress = net.mac.replace(/[:-]/g, '').toUpperCase();
          break;
        }
      }
      if (macAddress) break;
    }
  } catch (err) {
    console.error('[PROXY] Erro ao obter endereços MAC:', err.message);
  }

  let finalId;
  if (macAddress) {
    finalId = `SG-HW-MAC-${macAddress}`;
  } else {
    // 3. Fallback: gera um ID aleatório de alta entropia se não houver MAC
    const chars = '0123456789ABCDEF';
    let unique = '';
    for (let i = 0; i < 12; i++) {
      unique += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    finalId = `SG-HW-PHYSICAL-${unique}`;
  }

  // 4. Grava no arquivo físico do SO para persistência cross-browser e pós-limpezas
  try {
    fs.writeFileSync(filePath, finalId, 'utf8');
    console.log('[PROXY] Hardware ID persistente configurado em:', filePath);
  } catch (err) {
    console.error('[PROXY] Erro ao gravar arquivo de hardware ID:', err.message);
  }

  return finalId;
}

const server = http.createServer((req, res) => {
  // Configura cabeçalhos de CORS e Private Network Access (PNA)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Proxy local ativo e pronto' }));
    return;
  }

  if (parsedUrl.pathname === '/hardware-id') {
    const hwid = getPersistentHardwareId();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hardwareId: hwid }));
    return;
  }

  const targetIp = parsedUrl.query.target;

  if (!targetIp) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Parâmetro ?target=<IP_DA_ESP32> é obrigatório' }));
    return;
  }

  // Sanitiza o IP/Host de destino
  let cleanHost = targetIp.split('?')[0].replace(/\/stream\/?$/i, '').trim();
  const espUrl = `http://${cleanHost}/stream`;

  console.log(`[PROXY] Canalizando stream de: ${espUrl}`);

  const connector = http.get(espUrl, (espRes) => {
    // Copia os cabeçalhos de imagem/video da ESP32-CAM original (como multipart/x-mixed-replace)
    res.writeHead(espRes.statusCode, {
      ...espRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    
    // Retransmite os dados chunk-by-chunk em tempo real
    espRes.pipe(res);
  });

  connector.on('error', (err) => {
    console.error(`[PROXY ERRO] Falha de conexão com a ESP32-CAM em ${espUrl}:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Não foi possível conectar à ESP32-CAM. Verifique o IP e se o WiFi da placa está ativo.' }));
  });

  req.on('close', () => {
    connector.destroy();
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`📡 PROXY SEGURO DA ESP32-CAM ATIVO COM SUCESSO!`);
  console.log(`=============================================================`);
  console.log(`- Ouvindo localmente na porta: ${PORT}`);
  console.log(`- Para usar com o Totem online, configure a URL da câmera como:`);
  console.log(`  http://localhost:${PORT}/stream?target=<IP_DA_ESP32>`);
  console.log(`=============================================================\n`);
});
