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
const fs = require('fs');
const os = require('os');
const path = require('path');
const dgram = require('dgram');

const PORT = 9005;
const UDP_PORT = 9006;

const cp = require('child_process');

// Buffer de logs na memória indexado por IP da ESP
const logsByIp = {};
let logClients = [];
let macToIp = {};

// Registro de atividade recente por IP ou MAC para evitar quedas falsas de status
const lastSeenByTarget = {};

function markLastSeen(target) {
  if (!target) return;
  const normalized = target.trim().replace(/-/g, ':').toUpperCase();
  lastSeenByTarget[normalized] = Date.now();
  
  // Associa também o IP/MAC correspondente se já estiver na tabela de mapeamento
  if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(normalized)) {
    const ip = macToIp[normalized];
    if (ip) lastSeenByTarget[ip] = Date.now();
  } else {
    for (const [mac, ip] of Object.entries(macToIp)) {
      if (ip === normalized) {
        lastSeenByTarget[mac] = Date.now();
        break;
      }
    }
  }
}

// Função para atualizar tabela ARP local e resolver MAC -> IP
function updateArpTable() {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'arp -a' : 'arp -an';
  
  cp.exec(cmd, (err, stdout) => {
    if (err || !stdout) return;
    
    const lines = stdout.split('\n');
    const newMacToIp = {};
    
    for (let line of lines) {
      line = line.trim().toLowerCase();
      const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      const macMatch = line.match(/([0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2})/);
      
      if (ipMatch && macMatch) {
        const ip = ipMatch[1];
        const mac = macMatch[1].replace(/-/g, ':').toUpperCase();
        newMacToIp[mac] = ip;
      }
    }
    
    macToIp = { ...macToIp, ...newMacToIp };
  });
}

// Atualiza a tabela ARP a cada 6 segundos
setInterval(updateArpTable, 6000);
updateArpTable();

// Função utilitária para adicionar log
function addLog(ip, message) {
  // Mapeamento dinâmico se a mensagem reportar o MAC
  const macMatch = message.match(/([0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2})/);
  if (macMatch) {
    const mac = macMatch[1].replace(/-/g, ':').toUpperCase();
    if (macToIp[mac] !== ip) {
      macToIp[mac] = ip;
      console.log(`[PROXY] MAC ${mac} associado dinamicamente ao IP ${ip} via log UDP`);
    }
    markLastSeen(mac);
  }

  markLastSeen(ip);

  if (!logsByIp[ip]) {
    logsByIp[ip] = [];
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: message
  };
  logsByIp[ip].push(logEntry);
  
  // Limita o buffer em 100 linhas por IP
  if (logsByIp[ip].length > 100) {
    logsByIp[ip].shift();
  }

  // Notifica os clientes SSE conectados
  const data = JSON.stringify({ ip, ...logEntry });
  logClients.forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      // Ignora conexões fechadas
    }
  });
}

// Inicia o Servidor UDP de Logs na porta 9006
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
  const ip = rinfo.address;
  const message = msg.toString().trim();
  addLog(ip, message);
});

udpServer.on('error', (err) => {
  console.error(`[PROXY UDP ERRO] Falha no servidor de logs UDP:`, err.message);
});

udpServer.bind(UDP_PORT, () => {
  console.log(`📡 Coletor de Logs UDP ouvindo na porta: ${UDP_PORT}`);
});

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

  // Substitui url.parse() pela API padrão WHATWG URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  if (pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Proxy local ativo e pronto' }));
    return;
  }

  if (pathname === '/shutdown') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end(JSON.stringify({ success: true, message: 'Encerrando proxy local...' }));
    console.log('[PROXY] Recebida solicitação de encerramento via navegador. Fechando o serviço...');
    setTimeout(() => {
      try { udpServer.close(); } catch(e) {}
      process.exit(0);
    }, 500);
    return;
  }

  if (pathname === '/hardware-id') {
    const hwid = getPersistentHardwareId();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hardwareId: hwid }));
    return;
  }

  // Endpoint HTTP para verificar conectividade de uma ESP32 (HEAD, logs ou ARP)
  if (pathname === '/ping') {
    let target = searchParams.get('target');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    if (!target) {
      res.end(JSON.stringify({ error: 'Parametro ?target= e obrigatorio' }));
      return;
    }
    
    // Resolve MAC se for o caso
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(target)) {
      const normalizedMac = target.replace(/-/g, ':').toUpperCase();
      // Se foi visto nos últimos 60s, considera online de forma direta e instantânea
      if (lastSeenByTarget[normalizedMac] && (Date.now() - lastSeenByTarget[normalizedMac] < 60000)) {
        res.end(JSON.stringify({ online: true, source: 'last-seen-mac' }));
        return;
      }
      target = macToIp[normalizedMac] || target;
    }

    // Se for IP, confere se foi registrado ou visto recentemente
    if (lastSeenByTarget[target] && (Date.now() - lastSeenByTarget[target] < 60000)) {
      res.end(JSON.stringify({ online: true, source: 'last-seen-ip' }));
      return;
    }
    
    // 1. Verifica logs recentes (últimos 30 segundos)
    const hasRecentLogs = logsByIp[target] && logsByIp[target].length > 0 && 
      (Date.now() - new Date(logsByIp[target][logsByIp[target].length - 1].timestamp).getTime() < 30000);
      
    if (hasRecentLogs) {
      res.end(JSON.stringify({ online: true, source: 'logs' }));
      return;
    }
    
    // 2. Tenta requisição HTTP rápida
    let responded = false;
    const sendResponse = (data) => {
      if (responded) return;
      responded = true;
      res.end(JSON.stringify(data));
    };

    // Se ainda for um MAC address (não resolvido para IP), não faz requisição HTTP
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(target)) {
      sendResponse({ online: false, source: 'unresolved-mac' });
      return;
    }

    const espUrl = `http://${target}/`;
    const clientReq = http.request(espUrl, { method: 'HEAD', timeout: 1000 }, (espRes) => {
      sendResponse({ online: true, source: 'http' });
      clientReq.destroy();
    });
    
    clientReq.on('error', (err) => {
      // 3. Se falhar, confere se deu ECONNREFUSED (aparelho respondeu mas rejeitou a porta, provando que está online)
      // ou confere se está na tabela ARP
      const isOnline = err.code === 'ECONNREFUSED' || Object.values(macToIp).includes(target);
      sendResponse({ online: isOnline, source: isOnline ? 'http-refused' : 'arp' });
      clientReq.destroy();
    });
    
    clientReq.on('timeout', () => {
      const isIpInArp = Object.values(macToIp).includes(target);
      sendResponse({ online: isIpInArp, source: 'arp-timeout' });
      clientReq.destroy();
    });
    
    clientReq.end();
    return;
  }

  // Endpoint HTTP para registrar IP dinâmico da ESP e atualizar tabela ARP para descobrir o MAC
  if (pathname === '/register-ip') {
    const ip = searchParams.get('ip');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end(JSON.stringify({ success: true }));
    
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      markLastSeen(ip);
      const isWindows = process.platform === 'win32';
      // Acorda a placa disparando um único pacote ping rápido para forçar o sistema operacional a preencher a tabela ARP física
      const pingCmd = isWindows ? `ping -n 1 -w 300 ${ip}` : `ping -c 1 -W 1 ${ip}`;
      
      cp.exec(pingCmd, () => {
        const cmd = isWindows ? `arp -a ${ip}` : `arp -an ${ip}`;
        cp.exec(cmd, (err, stdout) => {
          if (stdout) {
            const macMatch = stdout.match(/([0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2})/i);
            if (macMatch) {
              const mac = macMatch[1].replace(/-/g, ':').toUpperCase();
              if (macToIp[mac] !== ip) {
                macToIp[mac] = ip;
                console.log(`[PROXY] MAC ${mac} associado dinamicamente ao IP ${ip} via requisicao de registro (com acordar-ping)`);
              }
              markLastSeen(mac);
            }
          }
        });
      });
    }
    return;
  }

  // Endpoint HTTP para resolver MAC para IP usando ARP cache
  if (pathname === '/resolve') {
    const mac = searchParams.get('mac');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    if (mac) {
      const normalizedMac = mac.replace(/-/g, ':').toUpperCase();
      const ip = macToIp[normalizedMac] || null;
      res.end(JSON.stringify({ mac: normalizedMac, ip }));
    } else {
      res.end(JSON.stringify({ error: 'Parametro ?mac= e obrigatorio' }));
    }
    return;
  }

  // Endpoint HTTP para recuperar histórico de logs de um IP ou MAC
  if (pathname === '/logs') {
    let ip = searchParams.get('target');
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    if (ip) {
      // Resolve se for MAC
      if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(ip)) {
        ip = macToIp[ip.replace(/-/g, ':').toUpperCase()] || ip;
      }
      res.end(JSON.stringify(logsByIp[ip] || []));
    } else {
      res.end(JSON.stringify(logsByIp));
    }
    return;
  }

  // Endpoint SSE para streaming de logs em tempo real
  if (pathname === '/logs/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.write('\n');

    const client = { res };
    logClients.push(client);

    req.on('close', () => {
      logClients = logClients.filter(c => c !== client);
    });
    return;
  }

  const targetIp = searchParams.get('target');

  if (!targetIp) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Parâmetro ?target=<IP_DA_ESP32> é obrigatório' }));
    return;
  }

  // Sanitiza o IP/Host de destino
  let cleanHost = targetIp.split('?')[0].replace(/\/stream\/?$/i, '').trim();

  // Se o host for um MAC address, resolve dinamicamente
  if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(cleanHost)) {
    const mac = cleanHost.replace(/-/g, ':').toUpperCase();
    if (macToIp[mac]) {
      console.log(`[PROXY] MAC ${mac} resolvido para IP ${macToIp[mac]}`);
      cleanHost = macToIp[mac];
    } else {
      console.warn(`[PROXY] Falha ao resolver MAC ${mac} para IP (Tabela ARP pendente).`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `MAC ${mac} nao resolvido. Ligue a ESP32 para registrar na rede local.` }));
      return;
    }
  }

  // Se a rota for /resolution, retransmite a chamada de alteração de resolução para a ESP32-CAM localmente
  if (pathname === '/resolution') {
    const val = searchParams.get('val') || 'vga';
    const espUrl = `http://${cleanHost}/resolution?val=${val}`;
    console.log(`[PROXY] Alterando resolução local da ESP32-CAM para: ${espUrl}`);
    
    const connector = http.get(espUrl, (espRes) => {
      res.writeHead(espRes.statusCode, {
        ...espRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true'
      });
      espRes.pipe(res);
    });
    
    connector.on('error', (err) => {
      console.error(`[PROXY ERRO] Falha ao enviar resolução para ESP32-CAM em ${espUrl}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao conectar à ESP32-CAM localmente' }));
      } else {
        res.end();
      }
    });
    return;
  }

  // Preserva parâmetros adicionais (como ?flash=on)
  const espSearchParams = new URLSearchParams(searchParams);
  espSearchParams.delete('target');
  const queryString = espSearchParams.toString();
  const espUrl = `http://${cleanHost}/stream` + (queryString ? `?${queryString}` : '');

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
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Não foi possível conectar à ESP32-CAM. Verifique o IP e se o WiFi da placa está ativo.' }));
    } else {
      res.end();
    }
  });

  req.on('close', () => {
    connector.destroy();
  });
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`📡 PROXY SEGURO DA ESP32-CAM E RECEPTOR DE LOGS ATIVO!`);
  console.log(`=============================================================`);
  console.log(`- Ouvindo vídeo localmente na porta: ${PORT}`);
  console.log(`- Ouvindo logs UDP localmente na porta: ${UDP_PORT}`);
  console.log(`- Para usar com o Totem online, configure a URL da câmera como:`);
  console.log(`  http://localhost:${PORT}/stream?target=<IP_DA_ESP32>`);
  console.log(`=============================================================\n`);
});
