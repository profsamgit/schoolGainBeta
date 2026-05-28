'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Cpu, 
  Terminal as TerminalIcon, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Play, 
  Power,
  Camera,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from '@/types/ecosystem';

interface LogLine {
  timestamp: string;
  message: string;
}

interface IoTSectionProps {
  terminals?: Terminal[];
}

export function IoTSection({ terminals = [] }: IoTSectionProps) {
  const { toast } = useToast();

  // Status do Proxy Local
  const [proxyActive, setProxyActive] = useState(false);
  const [checkingProxy, setCheckingProxy] = useState(false);

  // Monitoramento sob demanda
  const [selectedEspId, setSelectedEspId] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [cameraError, setCameraError] = useState(false);
  const [streamSrc, setStreamSrc] = useState<string>('');

  useEffect(() => {
    setCameraError(false);
  }, [selectedEspId, isMonitoring]);

  // Refs e conexões
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Efeito para scroll automático ao final do terminal de logs
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Função auxiliar para extrair IP/Host de uma URL
  const getIpFromUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim().replace(/^(https?:\/\/)?/, '').split('/')[0];
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed.split(':')[0];
  };

  // Mapeamento dinâmico das ESPs configuradas nos totens ativos
  const detectedEsps = useMemo(() => {
    const esps: {
      id: string;
      name: string;
      type: 'login' | 'scanner' | 'discard';
      ip: string;
      originalUrl: string;
      totemName: string;
      totemId: string;
      source: string;
    }[] = [];

    terminals.forEach((t) => {
      // 1. ESP da Câmera de Login (Qualquer fonte que possua URL)
      if (t.settings?.loginCameraUrl || t.settings?.cameraUrl) {
        const url = t.settings?.loginCameraUrl || t.settings?.cameraUrl;
        const ip = getIpFromUrl(url);
        if (ip) {
          esps.push({
            id: `${t.id}-login`,
            name: `${t.location} - Câmera de Login`,
            type: 'login',
            ip,
            originalUrl: url || '',
            totemName: t.location,
            totemId: t.id,
            source: t.settings?.loginCameraSource || 'esp32'
          });
        }
      }

      // 2. ESP da Câmera do Scanner (Qualquer fonte que possua URL)
      if (t.settings?.scanningCameraUrl || t.settings?.cameraUrl) {
        const url = t.settings?.scanningCameraUrl || t.settings?.cameraUrl;
        const ip = getIpFromUrl(url);
        if (ip) {
          esps.push({
            id: `${t.id}-scanner`,
            name: `${t.location} - Câmera de Scanner / Descarte`,
            type: 'scanner',
            ip,
            originalUrl: url || '',
            totemName: t.location,
            totemId: t.id,
            source: t.settings?.scanningCameraSource || 'esp32'
          });
        }
      }

      // 3. ESP de Descarte (Lixeiras / RFID / Sonar)
      if (t.settings?.discardEspIp) {
        const ip = getIpFromUrl(t.settings.discardEspIp);
        if (ip) {
          esps.push({
            id: `${t.id}-discard`,
            name: `${t.location} - Controlador de Descarte`,
            type: 'discard',
            ip,
            originalUrl: t.settings.discardEspIp,
            totemName: t.location,
            totemId: t.id,
            source: t.settings?.discardEspSource || 'esp32'
          });
        }
      }
    });

    return esps;
  }, [terminals]);

  const activeEsp = useMemo(() => {
    return detectedEsps.find(e => e.id === selectedEspId) || null;
  }, [detectedEsps, selectedEspId]);

  // Auto-seleciona a primeira ESP detectada se nenhuma estiver selecionada
  useEffect(() => {
    if (detectedEsps.length > 0 && !selectedEspId) {
      setSelectedEspId(detectedEsps[0].id);
    }
  }, [detectedEsps, selectedEspId]);

  // Efeito reativo para fechar/abrir stream sem travar conexões no navegador
  useEffect(() => {
    if (isMonitoring && activeEsp) {
      setStreamSrc(`http://localhost:9005/stream?target=${activeEsp.ip}&_ts=${Date.now()}`);
    } else {
      setStreamSrc('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
    }
  }, [isMonitoring, activeEsp?.ip]);

  // Função para verificar status do Proxy local
  const checkProxyStatus = async () => {
    setCheckingProxy(true);
    try {
      const res = await fetch('http://localhost:9005/status');
      if (res.ok) {
        const data = await res.json();
        setProxyActive(data.status === 'ok');
      } else {
        setProxyActive(false);
      }
    } catch (e) {
      setProxyActive(false);
    } finally {
      setCheckingProxy(false);
    }
  };

  // Carregar histórico de logs da ESP ativa
  const loadLogsHistory = async (ip: string) => {
    try {
      const res = await fetch(`http://localhost:9005/logs?target=${ip}`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.warn("Erro ao buscar histórico de logs:", e);
    }
  };

  // Gerencia a conexão com o fluxo de logs (SSE)
  useEffect(() => {
    checkProxyStatus();
  }, []);

  useEffect(() => {
    if (!proxyActive || !isMonitoring || !activeEsp) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    loadLogsHistory(activeEsp.ip);

    const eventSource = new EventSource('http://localhost:9005/logs/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { ip, timestamp, message } = data;

        if (ip === activeEsp.ip) {
          const newLog: LogLine = { timestamp, message };
          setLogs(prev => [...prev.slice(-99), newLog]);
        }
      } catch (err) {
        console.error("Erro ao decodificar log SSE:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [proxyActive, isMonitoring, activeEsp]);

  // Ações de ligar/desligar monitoramento
  const startMonitoring = () => {
    if (!activeEsp) {
      toast({ 
        title: "Nenhuma placa selecionada", 
        description: "Configure os totens para registrar as ESPs da escola.",
        variant: "destructive" 
      });
      return;
    }
    setLogs([]);
    setIsMonitoring(true);
    toast({ 
      title: "Monitoramento Iniciado", 
      description: `Buscando fluxo de dados e vídeo para a placa em ${activeEsp.ip}.` 
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    toast({ 
      title: "Monitoramento Pausado", 
      description: "A conexão com a placa foi encerrada." 
    });
  };

  const clearTerminal = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* SELEÇÃO DE PLACAS CADASTRADAS EM TOTENS */}
      <Card className="w-full border border-slate-200/60 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">Painel de Dispositivos Totem IoT</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Selecione as placas ativas configuradas no cadastro de totens escolares
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {detectedEsps.length > 0 ? (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Selecione uma Placa ESP para Monitoramento
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select 
                  value={selectedEspId} 
                  onValueChange={(id) => {
                    setSelectedEspId(id);
                    setIsMonitoring(false);
                    setLogs([]);
                  }}
                >
                  <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold">
                    <SelectValue placeholder="Selecione um totem detectado..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                    {detectedEsps.map(esp => {
                      const protocolLabel = esp.source === 'esp32_https' ? 'HTTPS' : 'HTTP';
                      return (
                        <SelectItem key={esp.id} value={esp.id} className="font-bold hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">
                          {esp.type === 'login' ? '🔑' : esp.type === 'scanner' ? '🔍' : '♻️'} {esp.name} ({esp.ip} - {protocolLabel})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  {!isMonitoring ? (
                    <Button 
                      onClick={startMonitoring}
                      disabled={!selectedEspId}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl h-11 px-5 gap-1.5 shadow-lg shadow-emerald-500/15 whitespace-nowrap"
                    >
                      <Play className="h-3.5 w-3.5" /> Testar ESP
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopMonitoring}
                      variant="destructive"
                      className="bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl h-11 px-5 gap-1.5 shadow-lg shadow-rose-500/15 animate-pulse whitespace-nowrap"
                    >
                      <Power className="h-3.5 w-3.5" /> Parar Teste
                    </Button>
                  )}
                </div>
              </div>
              
              {activeEsp && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/5 rounded-2xl flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <div>Totem de Origem: <strong className="text-slate-800 dark:text-white">{activeEsp.totemName}</strong></div>
                  <div>IP da Placa: <strong className="text-slate-800 dark:text-white font-mono">{activeEsp.ip}</strong></div>
                  <div>Função IoT: <strong className="text-slate-800 dark:text-white uppercase">{activeEsp.type === 'login' ? 'Identificação / Login' : activeEsp.type === 'scanner' ? 'Scanner de Pesagem' : 'Controlador de Triagem'}</strong></div>
                  <div>Protocolo: <strong className="text-slate-800 dark:text-white uppercase font-mono">{activeEsp.source === 'esp32_https' ? 'HTTPS Proxy' : 'HTTP Direto'}</strong></div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Nenhuma placa ESP32 configurada nos totens desta escola
              </p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                Para realizar o monitoramento, acesse as configurações dos totens na aba "Infraestrutura" e informe o endereço IP ou MAC da câmera/controlador correspondente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MONITOR SERIAL VIRTUAL */}
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-4 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <TerminalIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-md font-black uppercase tracking-tight">Monitor Serial de Rede</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Transmissão de logs de console em tempo real via UDP
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearTerminal}
              className="h-8 rounded-xl text-[9px] font-black uppercase tracking-wider border-slate-250 dark:border-white/5"
            >
              Limpar Tela
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Terminal de Logs */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-550">
                  Console Serial - {activeEsp ? activeEsp.name : 'Nenhuma placa selecionada'}
                </span>
                {isMonitoring && activeEsp && proxyActive && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] flex gap-1 items-center">
                    <Activity className="h-3 w-3 animate-pulse" />
                    CONECTADO E TRANSMITINDO
                  </Badge>
                )}
              </div>
              <div ref={terminalContainerRef} className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-emerald-400 h-80 overflow-y-auto border border-slate-880 shadow-inner flex flex-col">
                {!isMonitoring ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic gap-2 text-center select-none">
                    <TerminalIcon className="h-8 w-8 text-slate-800" />
                    <span className="text-xs uppercase font-black text-slate-500">Monitoramento Inativo</span>
                    <span className="text-[10px] text-slate-550 max-w-xs mt-1">
                      {activeEsp 
                        ? `Clique no botão "Testar ESP" acima para conectar e iniciar a escuta de logs de "${activeEsp.name}".`
                        : 'Nenhuma placa selecionada para iniciar a escuta.'}
                    </span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic gap-2 text-center">
                    <RefreshCw className="h-8 w-8 text-slate-750 animate-spin" />
                    <span>Conectado. Aguardando transmissão de dados de {activeEsp?.name}...</span>
                    {!proxyActive && (
                      <span className="text-[10px] text-rose-500 uppercase not-italic font-black mt-1">
                        O Proxy local está offline. Inicie-o para receber logs de rede.
                      </span>
                    )}
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex gap-2 py-0.5 hover:bg-white/5 rounded px-1">
                      <span className="text-slate-600 shrink-0 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className="whitespace-pre-wrap break-all text-emerald-300">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Visualização de Vídeo / Status Câmera */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-550">
                Visualização ao Vivo
              </span>
              <div className="aspect-video bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex items-center justify-center relative text-slate-500 shadow-md">
                {isMonitoring && activeEsp ? (
                  cameraError ? (
                    <div className="flex flex-col items-center gap-1.5 text-[10px] font-bold text-rose-400 text-center p-4">
                      <svg className="h-6 w-6 text-rose-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <span className="mt-1">CÂMERA INDISPONÍVEL</span>
                      <span className="text-[9px] text-slate-500 font-normal">Verifique se o IP {activeEsp.ip} está correto e acessível.</span>
                    </div>
                  ) : (
                    // Retransmissão da ESP32-CAM via Proxy CORS local
                    <img 
                      src={streamSrc} 
                      alt={`Stream ${activeEsp.name}`}
                      className="h-full w-full object-cover"
                      onError={() => {
                        if (streamSrc && !streamSrc.startsWith('data:')) {
                          setCameraError(true);
                        }
                      }}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <Camera className="h-7 w-7 text-slate-700" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 leading-snug">
                      {!isMonitoring ? "Vídeo Pausado" : "Aguardando Câmera"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-white/5 space-y-2 text-slate-750 dark:text-slate-350">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Dicas de Diagnóstico</span>
                <p className="text-[10.5px] leading-relaxed">
                  1. Certifique-se de que a ESP e o Totem estão na **mesma rede Wi-Fi**.
                </p>
                <p className="text-[10.5px] leading-relaxed">
                  2. O firmware deve direcionar os logs para a porta **9006 via UDP**.
                </p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
