'use client';

import { useState, useEffect, useRef } from 'react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Terminal, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Play, 
  Power,
  Camera,
  Trash2,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogLine {
  timestamp: string;
  message: string;
}

export function IoTSection() {
  const { systemSettings, updateSystemSettings } = useEcosystem();
  const { toast } = useToast();

  // Configuração dos IPs locais
  const [espLoginIp, setEspLoginIp] = useState(systemSettings?.espLoginIp || '');
  const [espScannerIp, setEspScannerIp] = useState(systemSettings?.espScannerIp || '');
  const [espWasteIp, setEspWasteIp] = useState(systemSettings?.espWasteIp || '');
  const [isSaving, setIsSaving] = useState(false);

  // Status do Proxy Local
  const [proxyActive, setProxyActive] = useState(false);
  const [checkingProxy, setCheckingProxy] = useState(false);
  const [startingProxy, setStartingProxy] = useState(false);

  // Abas do terminal
  const [activeTab, setActiveTab] = useState<'login' | 'scanner' | 'waste'>('login');

  // Logs recebidos
  const [loginLogs, setLoginLogs] = useState<LogLine[]>([]);
  const [scannerLogs, setScannerLogs] = useState<LogLine[]>([]);
  const [wasteLogs, setWasteLogs] = useState<LogLine[]>([]);

  // Refs de auto-scroll para os terminais
  const loginEndRef = useRef<HTMLDivElement>(null);
  const scannerEndRef = useRef<HTMLDivElement>(null);
  const wasteEndRef = useRef<HTMLDivElement>(null);

  // Efeito para scroll automático ao final do terminal
  useEffect(() => {
    if (activeTab === 'login') loginEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (activeTab === 'scanner') scannerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (activeTab === 'waste') wasteEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [loginLogs, scannerLogs, wasteLogs, activeTab]);

  // Função para verificar status do Proxy
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

  // Função para iniciar o Proxy
  const handleStartProxy = async () => {
    setStartingProxy(true);
    try {
      const res = await fetch('/api/hardware/proxy', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProxyActive(true);
        toast({ title: "Proxy Ativo", description: data.message });
        // Pequena pausa antes de carregar o histórico de logs
        setTimeout(loadLogsHistory, 1000);
      } else {
        toast({ title: "Erro no Proxy", description: data.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro de Conexão", description: "Não foi possível acionar a API local.", variant: "destructive" });
    } finally {
      setStartingProxy(false);
    }
  };

  // Função para salvar os IPs
  const handleSaveIPs = async () => {
    setIsSaving(true);
    try {
      updateSystemSettings({
        ...systemSettings,
        espLoginIp,
        espScannerIp,
        espWasteIp
      });
      toast({ title: "Configurações Salvas", description: "Os IPs das ESPs foram salvos com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: "Falha ao salvar preferências.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar histórico de logs do proxy
  const loadLogsHistory = async () => {
    if (!proxyActive) return;
    try {
      if (espLoginIp) {
        const res = await fetch(`http://localhost:9005/logs?target=${espLoginIp}`);
        if (res.ok) setLoginLogs(await res.json());
      }
      if (espScannerIp) {
        const res = await fetch(`http://localhost:9005/logs?target=${espScannerIp}`);
        if (res.ok) setScannerLogs(await res.json());
      }
      if (espWasteIp) {
        const res = await fetch(`http://localhost:9005/logs?target=${espWasteIp}`);
        if (res.ok) setWasteLogs(await res.json());
      }
    } catch (e) {
      console.warn("Erro ao buscar histórico de logs:", e);
    }
  };

  // Inicializa conexões
  useEffect(() => {
    checkProxyStatus();
  }, []);

  // Monitora alterações de proxyActive para rodar conexões SSE
  useEffect(() => {
    if (!proxyActive) return;

    loadLogsHistory();

    // Conecta no EventSource para streaming de logs
    const eventSource = new EventSource('http://localhost:9005/logs/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { ip, timestamp, message } = data;

        const newLog: LogLine = { timestamp, message };

        if (ip === espLoginIp) {
          setLoginLogs(prev => [...prev.slice(-99), newLog]);
        } else if (ip === espScannerIp) {
          setScannerLogs(prev => [...prev.slice(-99), newLog]);
        } else if (ip === espWasteIp) {
          setWasteLogs(prev => [...prev.slice(-99), newLog]);
        }
      } catch (err) {
        console.error("Erro ao decodificar log SSE:", err);
      }
    };

    eventSource.onerror = () => {
      // Tenta restabelecer conexão mais tarde se cair
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [proxyActive, espLoginIp, espScannerIp, espWasteIp]);

  const clearTerminal = () => {
    if (activeTab === 'login') setLoginLogs([]);
    if (activeTab === 'scanner') setScannerLogs([]);
    if (activeTab === 'waste') setWasteLogs([]);
  };

  const getActiveLogs = () => {
    if (activeTab === 'login') return { logs: loginLogs, ip: espLoginIp, name: "Login" };
    if (activeTab === 'scanner') return { logs: scannerLogs, ip: espScannerIp, name: "Scanner" };
    return { logs: wasteLogs, ip: espWasteIp, name: "Descarte" };
  };

  const currentTabInfo = getActiveLogs();

  return (
    <div className="space-y-6">
      {/* HEADER & PROXY MANAGEMENT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* CONFIGURAÇÃO DE IPS */}
        <Card className="flex-1 border border-slate-200/60 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">IPs das Placas ESP</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-500">Configure os IPs das câmeras e sensores na rede local</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ESP-CAM Login</label>
                <Input 
                  value={espLoginIp} 
                  onChange={e => setEspLoginIp(e.target.value)} 
                  placeholder="Ex: 192.168.1.101" 
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl h-11 text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ESP-CAM Scanner</label>
                <Input 
                  value={espScannerIp} 
                  onChange={e => setEspScannerIp(e.target.value)} 
                  placeholder="Ex: 192.168.1.102" 
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl h-11 text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-550 ml-1">ESP-CAM Descarte</label>
                <Input 
                  value={espWasteIp} 
                  onChange={e => setEspWasteIp(e.target.value)} 
                  placeholder="Ex: 192.168.1.103" 
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-xl h-11 text-sm font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveIPs} 
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg px-6 h-11"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STATUS DO PROXY */}
        <Card className="lg:w-80 border border-slate-200/60 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">Status do Proxy IoT</CardTitle>
            <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-500">Serviço local de intermediação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-white/5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Conexão Local:</span>
              <div className="flex items-center gap-1.5">
                {proxyActive ? (
                  <>
                    <Wifi className="h-4 w-4 text-emerald-500" />
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px] py-0.5 px-2">ONLINE</Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-rose-500" />
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[9px] py-0.5 px-2">OFFLINE</Badge>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full pt-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={checkProxyStatus} 
                disabled={checkingProxy}
                className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10"
                title="Recarregar status"
              >
                <RefreshCw className={`h-4 w-4 ${checkingProxy ? 'animate-spin' : ''}`} />
              </Button>
              {!proxyActive ? (
                <Button 
                  onClick={handleStartProxy} 
                  disabled={startingProxy}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl h-11 gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> Iniciar Proxy
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pronto para uso
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MONITOR SERIAL VIRTUAL */}
      <Card className="border border-slate-200/60 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 py-4 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-md font-black uppercase tracking-tight">Monitor Serial de Rede</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-slate-500">Transmissão de logs de console das ESP32-CAMs via UDP</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Abas */}
            <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-250 dark:border-white/5 flex gap-1">
              <Button 
                variant={activeTab === 'login' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('login')}
                className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-wider ${activeTab === 'login' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
              >
                ESP Login
              </Button>
              <Button 
                variant={activeTab === 'scanner' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('scanner')}
                className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-wider ${activeTab === 'scanner' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
              >
                ESP Scanner
              </Button>
              <Button 
                variant={activeTab === 'waste' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('waste')}
                className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-wider ${activeTab === 'waste' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
              >
                ESP Descarte
              </Button>
            </div>

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
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Console Serial - {currentTabInfo.name} ({currentTabInfo.ip || 'Sem IP'})
                </span>
                {currentTabInfo.ip && proxyActive && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[9px]">
                    CONECTADO
                  </Badge>
                )}
              </div>
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-emerald-400 h-80 overflow-y-auto border border-slate-800 shadow-inner flex flex-col">
                {currentTabInfo.logs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic gap-2 text-center">
                    <Terminal className="h-8 w-8 text-slate-700 animate-pulse" />
                    <span>Aguardando transmissão de dados de {currentTabInfo.name}...</span>
                    {(!proxyActive || !currentTabInfo.ip) && (
                      <span className="text-[10px] text-rose-500 uppercase not-italic font-black mt-1">
                        {!proxyActive ? "O PROXY LOCAL ESTÁ OFFLINE" : "CONFIGURE O IP DA ESP ACIMA"}
                      </span>
                    )}
                  </div>
                ) : (
                  currentTabInfo.logs.map((log, index) => (
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
                {/* Marcadores de scroll */}
                {activeTab === 'login' && <div ref={loginEndRef} />}
                {activeTab === 'scanner' && <div ref={scannerEndRef} />}
                {activeTab === 'waste' && <div ref={wasteEndRef} />}
              </div>
            </div>

            {/* Visualização de Vídeo / Status Câmera */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-550">
                Visualização ao Vivo
              </span>
              <div className="aspect-video bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex items-center justify-center relative text-slate-500 shadow-md">
                {currentTabInfo.ip && proxyActive ? (
                  // Retransmissão da ESP32-CAM via Proxy CORS local
                  <img 
                    src={`http://localhost:9005/stream?target=${currentTabInfo.ip}`} 
                    alt={`Stream ${currentTabInfo.name}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Se falhar o stream da câmera
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = "flex flex-col items-center gap-1.5 text-[10px] font-bold text-rose-400";
                        errorMsg.innerHTML = `<svg class="h-6 w-6 text-rose-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span>CÂMERA INDISPONÍVEL</span>`;
                        parent.appendChild(errorMsg);
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <Camera className="h-7 w-7 text-slate-700" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 leading-snug">
                      {!currentTabInfo.ip ? "IP Não Configurado" : "Proxy Offline"}
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
                  2. O arquivo de logs deve direcionar para o IP do Totem na porta **9006 via UDP**.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
