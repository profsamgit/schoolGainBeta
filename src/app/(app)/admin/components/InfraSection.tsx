'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, ShieldCheck, Monitor, ShieldAlert, Settings2, Trash2, Cpu, Download, Sparkles, Wifi, WifiOff, Activity
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SystemSettings, Terminal, School } from '@/types/ecosystem';

interface InfraSectionProps {
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: SystemSettings, targetSchoolId?: string) => void;
  videoDevices: MediaDeviceInfo[];
  filteredTerminalsForAdmin: Terminal[];
  deleteTerminal: (id: string) => void;
  updateTerminalStatus: (id: string, status: any, schoolId: string) => void;
  updateTerminalSettings: (id: string, settings: Partial<Terminal>) => void;
  approveTerminal: (terminal: Terminal) => void;
  approveSchool: (school: any) => void;
  currentUser: any;
  targetSchoolId?: string;
  toast: any;
  schools: School[];
}

export function InfraSection({
  systemSettings,
  updateSystemSettings,
  videoDevices,
  filteredTerminalsForAdmin,
  deleteTerminal,
  updateTerminalStatus,
  updateTerminalSettings,
  approveTerminal,
  approveSchool,
  currentUser,
  targetSchoolId,
  toast,
  schools
}: InfraSectionProps) {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('');
  
  // States para formulário ativo
  const [terminalLocation, setTerminalLocation] = useState('');
  const [preferredCamera, setPreferredCamera] = useState('default');
  const [terminalScanningCameraDevice, setTerminalScanningCameraDevice] = useState('default');
  const [terminalLoginMethod, setTerminalLoginMethod] = useState<'manual' | 'qr' | 'rfid' | 'all' | 'manual_qr' | 'manual_rfid' | 'qr_rfid'>('all');
  const [terminalLoginCameraSource, setTerminalLoginCameraSource] = useState<'browser' | 'esp32' | 'esp32_https' | 'url'>('browser');
  const [terminalScanningCameraSource, setTerminalScanningCameraSource] = useState<'browser' | 'esp32' | 'esp32_https' | 'url'>('browser');
  const [terminalLoginCameraUrl, setTerminalLoginCameraUrl] = useState('');
  const [terminalScanningCameraUrl, setTerminalScanningCameraUrl] = useState('');
  const [terminalScannerFramerate, setTerminalScannerFramerate] = useState<'fluid' | 'balanced' | 'high_res'>('fluid');
  const [terminalLoginCameraFramerate, setTerminalLoginCameraFramerate] = useState<'fluid' | 'balanced' | 'high_res'>('fluid');
  const [terminalLoginCameraFlash, setTerminalLoginCameraFlash] = useState(false);
  const [terminalScanningCameraFlash, setTerminalScanningCameraFlash] = useState(true);
  const [terminalSchoolgainServer, setTerminalSchoolgainServer] = useState('172.16.0.118:3000');
  const [terminalHardwareToken, setTerminalHardwareToken] = useState('sg_hardware_secret_2026');
  const [terminalDiscardEspIp, setTerminalDiscardEspIp] = useState('');
  const [terminalDiscardEspSource, setTerminalDiscardEspSource] = useState<'esp32' | 'esp32_https'>('esp32');
  const [terminalSonarDistance, setTerminalSonarDistance] = useState<number>(15);
  const [terminalRfidReaderEnabled, setTerminalRfidReaderEnabled] = useState(true);
  const [espsStatus, setEspsStatus] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});

  const [proxyActive, setProxyActive] = useState<boolean | null>(null);
  const [proxyLoading, setProxyLoading] = useState(false);

  const getIpFromUrl = (urlStr?: string) => {
    if (!urlStr) return '';
    const trimmed = urlStr.trim().replace(/^(https?:\/\/)?/, '').split('/')[0];
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed.split(':')[0];
  };

  useEffect(() => {
    const checkProxy = async () => {
      try {
        // Tenta verificar diretamente no navegador se o proxy local na porta 9005 está ativo na máquina do Totem
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const res = await fetch('http://localhost:9005/status', {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          setProxyActive(data.status === 'ok');
        } else {
          setProxyActive(false);
        }
      } catch (err) {
        // Fallback: Tenta a rota de API local (útil para desenvolvimento local completo)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 800);
          const res = await fetch('/api/hardware/proxy', { signal: controller.signal, cache: 'no-store' });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            setProxyActive(data.active);
          } else {
            setProxyActive(false);
          }
        } catch (e) {
          setProxyActive(false);
        }
      }
    };
    checkProxy();
    const interval = setInterval(checkProxy, 3000);
    return () => clearInterval(interval);
  }, []);

  // Efeito para verificar status das ESPs do totem selecionado em tempo real
  useEffect(() => {
    if (!selectedTerminalId) return;
    const selectedTerminal = filteredTerminalsForAdmin.find(t => t.id === selectedTerminalId);
    if (!selectedTerminal) return;

    const ipList: { id: string; ip: string }[] = [];

    if (
      (terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https') &&
      terminalLoginCameraUrl
    ) {
      const ip = getIpFromUrl(terminalLoginCameraUrl);
      if (ip) ipList.push({ id: 'login', ip });
    }

    if (
      (terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https') &&
      terminalScanningCameraUrl
    ) {
      const ip = getIpFromUrl(terminalScanningCameraUrl);
      if (ip) ipList.push({ id: 'scanner', ip });
    }

    if (terminalDiscardEspIp) {
      const ip = getIpFromUrl(terminalDiscardEspIp);
      if (ip) ipList.push({ id: 'discard', ip });
    }

    if (ipList.length === 0) {
      setEspsStatus({});
      return;
    }

    setEspsStatus(prev => {
      const newStatus = { ...prev };
      ipList.forEach(item => {
        if (!newStatus[item.id]) {
          newStatus[item.id] = 'checking';
        }
      });
      return newStatus;
    });

    let isSubscribed = true;

    const checkAll = async () => {
      for (const item of ipList) {
        if (!isSubscribed) break;
        
        // 1. Regra especial para a ESP de Descarte:
        // Se ela enviou dados para a API (que salvou no Firestore) nos últimos 45s, consideramos online
        if (item.id === 'discard' && selectedTerminal?.lastBinUpdate) {
          const lastUpdateMs = new Date(selectedTerminal.lastBinUpdate).getTime();
          const isRecent = Date.now() - lastUpdateMs < 45000;
          if (isRecent) {
            if (isSubscribed) {
              setEspsStatus(prev => ({ ...prev, [item.id]: 'online' }));
            }
            continue;
          }
        }

        // 2. Tenta checar através da rota /ping do proxy local (porta 9005)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const res = await fetch(`http://localhost:9005/ping?target=${encodeURIComponent(item.ip)}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (isSubscribed) {
              setEspsStatus(prev => ({ ...prev, [item.id]: data.online ? 'online' : 'offline' }));
            }
            continue;
          }
        } catch (e) {
          // Proxy inativo
        }

        // 3. Fallback: Se for IP direto (não MAC) e o proxy estiver inativo, tenta conexão direta no navegador
        const isMac = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(item.ip);
        if (!isMac) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            await fetch(`http://${item.ip}`, { mode: 'no-cors', signal: controller.signal });
            clearTimeout(timeoutId);
            if (isSubscribed) {
              setEspsStatus(prev => ({ ...prev, [item.id]: 'online' }));
            }
          } catch (e) {
            if (isSubscribed) {
              setEspsStatus(prev => ({ ...prev, [item.id]: 'offline' }));
            }
          }
        } else {
          // Se for MAC e o proxy estiver inativo, é impossível resolver
          if (isSubscribed) {
            setEspsStatus(prev => ({ ...prev, [item.id]: 'offline' }));
          }
        }
      }
    };

    checkAll();
    const interval = setInterval(checkAll, 10000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [
    selectedTerminalId,
    terminalLoginCameraSource,
    terminalLoginCameraUrl,
    terminalScanningCameraSource,
    terminalScanningCameraUrl,
    terminalDiscardEspIp,
    filteredTerminalsForAdmin
  ]);

  // Automatiza a troca de fonte HTTP -> HTTPS Proxy quando um MAC Address é digitado
  useEffect(() => {
    const isMac = (val: string) => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val.trim());

    // Câmera de Login
    if (terminalLoginCameraSource === 'esp32' && isMac(terminalLoginCameraUrl)) {
      setTerminalLoginCameraSource('esp32_https');
      toast({
        title: "Proxy Ativado Automaticamente",
        description: "MAC Address detectado na câmera de login. A fonte de vídeo foi alternada para HTTPS Proxy, pois o uso de MAC exige o Proxy Local.",
      });
    }

    // Câmera do Scanner
    if (terminalScanningCameraSource === 'esp32' && isMac(terminalScanningCameraUrl)) {
      setTerminalScanningCameraSource('esp32_https');
      toast({
        title: "Proxy Ativado Automaticamente",
        description: "MAC Address detectado na câmera de scanner. A fonte de vídeo foi alternada para HTTPS Proxy, pois o uso de MAC exige o Proxy Local.",
      });
    }

    // ESP de Descarte
    if (terminalDiscardEspSource === 'esp32' && isMac(terminalDiscardEspIp)) {
      setTerminalDiscardEspSource('esp32_https');
      toast({
        title: "Proxy Ativado Automaticamente",
        description: "MAC Address detectado no controlador de descarte. A fonte foi alternada para HTTPS Proxy, pois o uso de MAC exige o Proxy Local.",
      });
    }
  }, [
    terminalLoginCameraUrl, 
    terminalLoginCameraSource, 
    terminalScanningCameraUrl, 
    terminalScanningCameraSource, 
    terminalDiscardEspIp,
    terminalDiscardEspSource,
    toast
  ]);

  const handleStartProxy = async () => {
    setProxyLoading(true);
    try {
      const res = await fetch('/api/hardware/proxy', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProxyActive(data.active);
        toast({
          title: "Proxy Local Iniciado",
          description: "O canalizador seguro de vídeo da ESP32-CAM está rodando na porta 9005.",
          variant: "success"
        });
      }
    } catch (err) {
      toast({
        title: "Erro ao Iniciar",
        description: "Não foi possível iniciar o proxy local automaticamente. Verifique se o Node.js está instalado.",
        variant: "destructive"
      });
    } finally {
      setProxyLoading(false);
    }
  };

  const handleStopProxy = async () => {
    setProxyLoading(true);
    try {
      // Envia o comando de desligamento diretamente para a porta local 9005 na máquina física do Totem
      await fetch('http://localhost:9005/shutdown', { method: 'GET' }).catch(() => null);
      
      // Envia também para a API do Next.js como garantia no ambiente de dev local
      await fetch('/api/hardware/proxy', { method: 'DELETE' }).catch(() => null);
      
      // Aguarda o encerramento do processo e atualiza o estado
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProxyActive(false);
      
      toast({
        title: "Proxy Local Desativado",
        description: "O canalizador de vídeo na porta 9005 foi encerrado com sucesso.",
        variant: "success"
      });
    } catch (err) {
      toast({
        title: "Erro ao Parar",
        description: "Não foi possível desativar o proxy local.",
        variant: "destructive"
      });
    } finally {
      setProxyLoading(false);
    }
  };

  const handleDownloadScripts = () => {
    const files = ['start', 'stop', 'script'];
    files.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/hardware/download?file=${file}`;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 400); // 400ms delay to prevent browser download restrictions
    });
    toast({
      title: "Downloads Iniciados",
      description: "Os arquivos de configuração do Totem (Proxy e Lote .bat) estão sendo baixados para o seu computador.",
      variant: "success"
    });
  };

  const handleDownloadFile = (fileType: 'espcam' | 'totem' | 'readme') => {
    const link = document.createElement('a');
    link.href = `/api/hardware/download?file=${fileType}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    let description = "";
    if (fileType === 'espcam') {
      description = "O código espcam.ino foi baixado com sucesso.";
    } else if (fileType === 'totem') {
      description = "O código totem_controller.ino foi baixado com sucesso.";
    } else if (fileType === 'readme') {
      description = "O manual de hardware (README.md) foi baixado com sucesso.";
    }

    toast({
      title: "Download Concluído",
      description,
      variant: "success"
    });
  };

  const sortedVideoDevices = useMemo(() => {
    return [...videoDevices].sort((a, b) => a.label.localeCompare(b.label));
  }, [videoDevices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 dark:text-white">
      
      {/* Guia Informativo de Infraestrutura */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 text-slate-800 dark:text-white backdrop-blur-xl shadow-lg">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shrink-0">
            <Settings2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Guia de Configuração de Hardware e Totens</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              Gerencie a integração física da escola (câmeras, totens físicos de pesagem/coleta e métodos de autenticação):
            </p>
            <ul className="text-[11px] text-slate-650 dark:text-slate-350 space-y-1.5 list-disc pl-4 mt-2 font-semibold">
              <li><strong className="text-slate-800 dark:text-white">Transmissão ESP32-CAM</strong>: Configure a origem de vídeo dos totens (Webcam local, ESP32 via IP, ou o Proxy HTTPS Seguro na porta 9005 para contornar restrições de segurança do navegador).</li>
              <li><strong className="text-slate-800 dark:text-white">Métodos de Acesso</strong>: Configure quais formas de autenticação estão habilitadas para Alunos (RA, QRCode e/ou cartão RFID) e Administradores (Senha, QRCode e/ou crachá RFID).</li>
              <li><strong className="text-slate-800 dark:text-white">Gestão de Totens</strong>: Aprove terminais novos solicitando acesso, copie os IDs e chaves criptográficas para colar no código do Arduino, e configure resoluções ou taxas de quadros.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 📡 DIAGNÓSTICO DO PROXY SEGURO */}
      <div className="p-6 bg-white/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-[2rem] backdrop-blur-xl text-slate-800 dark:text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${proxyActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'} transition-all duration-300`}>
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400/80">Painel de Transmissão ESP32-CAM</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Status do Proxy Seguro: {proxyActive === null ? 'Verificando...' : proxyActive ? '🟢 ATIVO (Porta 9005)' : '🔴 INATIVO'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              {proxyActive 
                ? 'As transmissões via "ESP32-CAM HTTPS Proxy" estão prontas e seguras contra bloqueios de rede do navegador (PNA e Mixed Content).'
                : 'Necessário para conexões online seguras em HTTPS. Se você estiver rodando o servidor localmente, clique em Iniciar. Caso contrário, execute o arquivo "Iniciar-Proxy-Local.bat" no computador local do Totem.'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <Button
              onClick={handleDownloadScripts}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30 font-bold text-[10px] uppercase tracking-wider h-8 px-2.5 rounded-lg shadow-sm transition-all duration-300 flex items-center gap-1 shrink-0"
            >
              <Download className="h-3 w-3" /> Proxy
            </Button>
            <Button
              onClick={() => handleDownloadFile('espcam')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 font-bold text-[10px] uppercase tracking-wider h-8 px-2.5 rounded-lg shadow-sm transition-all duration-300 flex items-center gap-1 shrink-0"
            >
              <Download className="h-3 w-3" /> ESP-Cam
            </Button>
            <Button
              onClick={() => handleDownloadFile('totem')}
              className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30 font-bold text-[10px] uppercase tracking-wider h-8 px-2.5 rounded-lg shadow-sm transition-all duration-300 flex items-center gap-1 shrink-0"
            >
              <Download className="h-3 w-3" /> Totem
            </Button>
            <Button
              onClick={() => handleDownloadFile('readme')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50 font-bold text-[10px] uppercase tracking-wider h-8 px-2.5 rounded-lg shadow-sm transition-all duration-300 flex items-center gap-1 shrink-0"
            >
              <Download className="h-3 w-3" /> Manual
            </Button>
          </div>
          <div className="px-3 py-2 bg-slate-100/60 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 rounded-xl text-center min-w-[130px]">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-555 block">Uso do Totem</span>
            <span className="text-[10px] font-mono text-indigo-650 dark:text-indigo-400 font-bold block mt-0.5">Executar Localmente</span>
          </div>
        </div>
      </div>

      <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 dark:hover:border-indigo-500/20 transition-all duration-300 text-slate-800 dark:text-white md:col-span-2">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5 pb-4">
          <CardTitle className="flex items-center gap-2 uppercase tracking-tight font-black text-sm text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Configurações de Acesso Geral (Web/Pessoal)
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Configure as opções de acesso para computadores e celulares pessoais dos alunos e gestores.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Login do Aluno (Web/Pessoal)</Label>
              <Select 
                value={systemSettings.studentLoginMethod || "all"} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="all" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Tudo Habilitado (RA, QR e RFID)</SelectItem>
                  <SelectItem value="manual" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas Manual (RA)</SelectItem>
                  <SelectItem value="qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas RFID (Cartão)</SelectItem>
                  <SelectItem value="manual_qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Manual e QR Code</SelectItem>
                  <SelectItem value="manual_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Manual e RFID</SelectItem>
                  <SelectItem value="qr_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">QR Code e RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Login do Gestor (Web/Pessoal)</Label>
              <Select 
                value={systemSettings.adminLoginMethod || "all"} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="all" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Tudo Habilitado (Senha, QR e RFID)</SelectItem>
                  <SelectItem value="manual" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas Senha</SelectItem>
                  <SelectItem value="qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas RFID (Cartão)</SelectItem>
                  <SelectItem value="manual_qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Manual e QR Code</SelectItem>
                  <SelectItem value="manual_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Manual e RFID</SelectItem>
                  <SelectItem value="qr_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">QR Code e RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Status da Área do Aluno (Web)</Label>
              <Select 
                value={systemSettings.studentAreaMaintenance ? "maintenance" : "active"} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentAreaMaintenance: v === "maintenance"}, targetSchoolId)}
              >
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <SelectItem value="active" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">🟢 Ativo (Portal Liberado)</SelectItem>
                  <SelectItem value="maintenance" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">⚠️ Em Manutenção (Bloquear Acesso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wider">
            Aviso: Configurações aplicadas às conexões fora do modo totem. O modo totem físico opera sob configurações individuais e autônomas.
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 dark:hover:border-indigo-500/20 transition-all duration-300 text-slate-800 dark:text-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-950/30 px-6 py-5 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tight font-black text-sm text-indigo-600 dark:text-indigo-400"><Monitor className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Gestão de Totens</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">Localize, gerencie câmeras e configure parâmetros físicos dos totens da sua unidade.</CardDescription>
            </div>
            <Badge className="gap-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 uppercase font-black tracking-widest text-[9px] h-6 px-3 rounded-full shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></div>
              Painel Sincronizado
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* SOLICITAÇÕES PENDENTES */}
            {filteredTerminalsForAdmin.filter(t => t.status === 'pending').length > 0 && (
               <div className="border border-amber-500/20 rounded-3xl bg-amber-500/5 p-5 space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                     <ShieldAlert className="h-4 w-4" /> Solicitações de Acesso Pendentes
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredTerminalsForAdmin.filter(t => t.status === 'pending').map(terminal => (
                       <div key={terminal.id} className="flex flex-col justify-between p-4 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl gap-4">
                          <div className="flex items-start gap-3">
                             <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <Monitor className="h-5 w-5 animate-pulse" />
                             </div>
                             <div>
                                <p className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight mb-1">{terminal.location}</p>
                                <div className="flex flex-col gap-0.5 font-mono text-[9px] text-slate-500 dark:text-slate-400">
                                   <span>ID: {terminal.id}</span>
                                   <span>Hardware: {terminal.hardwareId}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => deleteTerminal(terminal.id)} className="bg-white dark:bg-slate-950 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 flex-1 h-9 uppercase text-[10px] font-black tracking-wider rounded-xl">Recusar</Button>
                             <Button size="sm" onClick={() => approveTerminal(terminal)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white dark:text-slate-950 border border-indigo-400/20 flex-1 h-9 uppercase text-[10px] font-black tracking-wider rounded-xl">Autorizar Acesso</Button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            )}

            {/* SELEÇÃO E NAVEGAÇÃO DE TOTENS CADASTRADOS */}
            <div className="space-y-4">
              {/* CARD DE DETALHES OU GRADE DE TOTENS */}
              {selectedTerminalId ? (
                // VIEW 1: PAINEL DE CONTROLE DETALHADO DO TOTEM SELECIONADO
                (() => {
                  const selectedTerminal = filteredTerminalsForAdmin.find(t => t.id === selectedTerminalId);
                  return (
                    <div className="border border-slate-200 dark:border-indigo-500/20 rounded-3xl bg-slate-50/50 dark:bg-slate-950/40 p-6 space-y-6 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shadow-md">
                            <Cpu className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-800 dark:text-slate-200 text-lg uppercase tracking-tight">{terminalLocation || selectedTerminal?.location}</h3>
                              <Badge className={`uppercase text-[8px] font-black tracking-widest ${selectedTerminal?.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-950 border border-slate-350 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
                                {selectedTerminal?.status === 'active' ? 'Ativo / Online' : 'Inativo / Offline'}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-550 dark:text-slate-500 font-mono">ID: {selectedTerminal?.id} • HW: {selectedTerminal?.hardwareId}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedTerminalId('')} 
                          className="font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                        >
                          ← Voltar para Grade de Totens
                        </Button>
                      </div>

                      {(() => {
                        const isMacAddr = (val: string) => /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val.trim());
                        const needsProxy = 
                          (terminalLoginCameraSource === 'esp32_https' || isMacAddr(terminalLoginCameraUrl)) ||
                          (terminalScanningCameraSource === 'esp32_https' || isMacAddr(terminalScanningCameraUrl)) ||
                          isMacAddr(terminalDiscardEspIp);

                        if (needsProxy && !proxyActive) {
                          return (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-450 rounded-2xl flex flex-col gap-1.5 animate-in slide-in-from-top duration-300">
                              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                ⚠️ AVISO: Proxy Local Requerido
                              </span>
                              <p className="text-[10.5px] leading-relaxed font-semibold">
                                Você configurou um ou mais dispositivos utilizando <strong>MAC Address</strong> ou <strong>HTTPS Proxy</strong>, porém o Proxy Local na porta 9005 está <strong>desativado</strong>. Para que o navegador consiga resolver os MAC Addresses ou conexões seguras, ative o proxy local clicando no botão de inicialização no topo da tela ou executando o script <code>Iniciar-Proxy-Local.bat</code>.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* BLOCO A: IDENTIFICAÇÃO E SEGURANÇA */}
                        <div className="space-y-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-250 dark:border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">1. Identificação & Segurança</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Nome / Localização do Totem</Label>
                            <Input 
                              value={terminalLocation} 
                              onChange={(e) => setTerminalLocation(e.target.value)} 
                              placeholder="Ex: Entrada Principal, Biblioteca..."
                              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Método de Autenticação do Totem</Label>
                            <Select value={terminalLoginMethod || "all"} onValueChange={(v: any) => setTerminalLoginMethod(v)}>
                              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                <SelectItem value="all" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Tudo Habilitado (Senha, QR e RFID)</SelectItem>
                                <SelectItem value="manual" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas Senha</SelectItem>
                                <SelectItem value="qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas QR Code</SelectItem>
                                <SelectItem value="rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Apenas RFID (Cartão)</SelectItem>
                                <SelectItem value="manual_qr" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Senha e QR Code</SelectItem>
                                <SelectItem value="manual_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Senha e RFID</SelectItem>
                                <SelectItem value="qr_rfid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">QR Code e RFID</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* BLOCO B: PARÂMETROS DE FIRMWARE DA ESP32-CAM */}
                        <div className="space-y-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-250 dark:border-white/5">
                            <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">2. Parâmetros de Firmware (Código C++)</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                Servidor (schoolgain_server)
                              </Label>
                              <Input 
                                value={terminalSchoolgainServer} 
                                onChange={(e) => setTerminalSchoolgainServer(e.target.value)} 
                                placeholder="Ex: 172.16.0.118:3000"
                                className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                Token (hardware_token)
                              </Label>
                              <Input 
                                value={terminalHardwareToken} 
                                onChange={(e) => setTerminalHardwareToken(e.target.value)} 
                                placeholder="Ex: sg_hardware_secret_2026"
                                className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                              ID do Terminal (terminal_id - Cole no Arduino)
                            </Label>
                            <div className="flex gap-2">
                              <Input 
                                readOnly
                                value={selectedTerminal?.hardwareId || ''} 
                                className="font-mono text-xs h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl select-all flex-1"
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm"
                                className="h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-xl uppercase text-[9px] font-black tracking-wider"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTerminal?.hardwareId || '');
                                  toast({ title: "Copiado!", description: "ID do Terminal copiado com sucesso!" });
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* BLOCO C: CÂMERA DE LOGIN (QR CODE) */}
                        <div className="space-y-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-250 dark:border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">3. Câmera de Login (Aluno)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Fonte de Vídeo (Login)</Label>
                            <Select value={terminalLoginCameraSource || "browser"} onValueChange={(v: any) => setTerminalLoginCameraSource(v)}>
                              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                <SelectItem value="browser" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32-CAM HTTP (IP Local)</SelectItem>
                                <SelectItem value="esp32_https" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32-CAM HTTPS Proxy</SelectItem>
                                <SelectItem value="url" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalLoginCameraSource !== 'browser' ? (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Endereço IP ou MAC da Câmera de Login</Label>
                                <Input 
                                  value={terminalLoginCameraUrl} 
                                  onChange={(e) => setTerminalLoginCameraUrl(e.target.value)} 
                                  placeholder={terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https' ? "Ex: 192.168.1.5 ou AA:BB:CC:DD:EE:FF" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                                />
                                <p className="text-[8.5px] leading-normal text-slate-500 dark:text-slate-450 mt-1">
                                  💡 Suporta IP ou MAC Address. O MAC resolve automaticamente IPs dinâmicos (DHCP) através do Proxy Local.
                                </p>
                              </div>

                              {(terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https') && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                      Taxa de Quadros (Qualidade) do Login
                                    </Label>
                                    <Select value={terminalLoginCameraFramerate || "fluid"} onValueChange={(v: any) => setTerminalLoginCameraFramerate(v)}>
                                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                        <SelectItem value="fluid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">⚡ Alta Velocidade / QR (VGA)</SelectItem>
                                        <SelectItem value="balanced" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">⚖️ Equilibrado (SVGA)</SelectItem>
                                        <SelectItem value="high_res" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">📸 Alta Resolução (HD)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                      Luz de Flash LED (Login)
                                    </Label>
                                    <Select 
                                      value={terminalLoginCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalLoginCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                        <SelectItem value="off" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">💡 Ativado (Flash Aceso na Leitura)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Dispositivo de Captura</Label>
                              <Select value={preferredCamera || "default"} onValueChange={setPreferredCamera}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                  <SelectItem value="default" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* BLOCO D: CÂMERA DO SCANNER (PESAGEM E IA) */}
                        <div className="space-y-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-250 dark:border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">4. Câmera de Scanner (Identificação de Resíduos)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Fonte de Vídeo (Scanner)</Label>
                            <Select value={terminalScanningCameraSource || "browser"} onValueChange={(v: any) => setTerminalScanningCameraSource(v)}>
                              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                <SelectItem value="browser" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32-CAM HTTP (IP Local)</SelectItem>
                                <SelectItem value="esp32_https" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32-CAM HTTPS Proxy</SelectItem>
                                <SelectItem value="url" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalScanningCameraSource === 'browser' ? (
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Dispositivo de Captura (Scanner)</Label>
                              <Select value={terminalScanningCameraDevice || "default"} onValueChange={setTerminalScanningCameraDevice}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                  <SelectItem value="default" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">Endereço IP ou MAC da Câmera de Scanner</Label>
                                <Input 
                                  value={terminalScanningCameraUrl} 
                                  onChange={(e) => setTerminalScanningCameraUrl(e.target.value)} 
                                  placeholder={terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https' ? "Ex: 192.168.1.6 ou AA:BB:CC:DD:EE:FF" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                                />
                                <p className="text-[8.5px] leading-normal text-slate-500 dark:text-slate-455 mt-1">
                                  💡 Suporta IP ou MAC Address. O MAC resolve automaticamente IPs dinâmicos (DHCP) através do Proxy Local.
                                </p>
                              </div>

                              {(terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https') && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                      Taxa de Quadros (Framerate) do Scanner
                                    </Label>
                                    <Select value={terminalScannerFramerate || "fluid"} onValueChange={(v: any) => setTerminalScannerFramerate(v)}>
                                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                        <SelectItem value="fluid" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">⚡ Alta Fluidez (~30 FPS) - VGA</SelectItem>
                                        <SelectItem value="balanced" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">⚖️ Equilibrado (~18 FPS) - SVGA</SelectItem>
                                        <SelectItem value="high_res" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">📸 Alta Resolução (~12 FPS) - HD</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-450 ml-1">
                                      Luz de Flash LED (Scanner)
                                    </Label>
                                    <Select 
                                      value={terminalScanningCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalScanningCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                        <SelectItem value="off" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">💡 Ativado (Iluminar Resíduo ao Escanear)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* BLOCO E: CONFIGURAÇÕES DA ESP32 DE DESCARTE */}
                        <div className="space-y-4 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-250 dark:border-white/5">
                            <Cpu className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400 animate-pulse" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">5. ESP32 de Descarte (Lixeiras / RFID / Sonar)</h4>
                          </div>

                           <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400 ml-1">Fonte de Conexão (Descarte)</Label>
                            <Select value={terminalDiscardEspSource || "esp32"} onValueChange={(v: any) => setTerminalDiscardEspSource(v)}>
                              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                <SelectItem value="esp32" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32 Direta (IP Local)</SelectItem>
                                <SelectItem value="esp32_https" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">ESP32 HTTPS Proxy (MAC / HTTPS)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-455 ml-1">Endereço IP ou MAC da ESP de Descarte</Label>
                            <Input 
                              value={terminalDiscardEspIp} 
                              onChange={(e) => setTerminalDiscardEspIp(e.target.value)} 
                              placeholder="Ex: 192.168.1.100 ou AA:BB:CC:DD:EE:FF"
                              className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                            />
                            <p className="text-[8.5px] leading-normal text-slate-500 dark:text-slate-455 mt-1">
                              💡 Suporta IP ou MAC Address. O MAC resolve automaticamente IPs dinâmicos (DHCP) através do Proxy Local.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-455 ml-1">Distância do Sonar (cm)</Label>
                              <Input 
                                type="number"
                                value={terminalSonarDistance} 
                                onChange={(e) => setTerminalSonarDistance(Number(e.target.value))} 
                                placeholder="Ex: 15"
                                className="font-mono text-xs h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-indigo-500/50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-455 ml-1">Leitor RFID Físico (ESP)</Label>
                              <Select 
                                value={terminalRfidReaderEnabled ? "enabled" : "disabled"} 
                                onValueChange={(v) => setTerminalRfidReaderEnabled(v === "enabled")}
                              >
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                                  <SelectItem value="enabled" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Ativado (RFID na ESP)</SelectItem>
                                  <SelectItem value="disabled" className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20">Desativado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* BLOCO F: STATUS DOS DISPOSITIVOS E LIXEIRAS (ESP32 TELEMETRIA) */}
                        <div className="space-y-6 p-5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl shadow-md md:col-span-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-250 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400">6. Status das ESP32 e Lixeiras em Tempo Real</h4>
                            </div>
                            {selectedTerminal?.lastBinUpdate && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                Última telemetria: {new Date(selectedTerminal.lastBinUpdate).toLocaleTimeString('pt-BR')}
                              </span>
                            )}
                          </div>

                          {/* STATUS DE CONEXÃO DE TODAS AS ESPS */}
                          <div className="space-y-3">
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-455 ml-1">
                              Status de Conexão das Placas ESP32
                            </h5>

                            {(() => {
                              const activeEspsList = [];
                               if (terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https') {
                                activeEspsList.push({
                                  id: 'login',
                                  name: '🔑 Câmera de Login',
                                  ip: getIpFromUrl(terminalLoginCameraUrl),
                                });
                              }
                              if (terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https') {
                                activeEspsList.push({
                                  id: 'scanner',
                                  name: '🔍 Câmera de Scanner',
                                  ip: getIpFromUrl(terminalScanningCameraUrl),
                                });
                              }
                              if (terminalDiscardEspIp) {
                                activeEspsList.push({
                                  id: 'discard',
                                  name: '♻️ Controlador de Descarte',
                                  ip: getIpFromUrl(terminalDiscardEspIp),
                                });
                              }

                              if (activeEspsList.length === 0) {
                                return (
                                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-[10px] text-slate-500 dark:text-slate-450 italic">
                                    Nenhuma placa ESP32 configurada para este totem.
                                  </div>
                                );
                              }

                              return (
                                <div className="grid gap-3 sm:grid-cols-3">
                                  {activeEspsList.map((esp) => {
                                    const status = espsStatus[esp.id] || 'checking';
                                    return (
                                      <div 
                                        key={esp.id} 
                                        className="p-3 border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl flex flex-col justify-between gap-2"
                                      >
                                        <div className="space-y-1">
                                          <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-350 block line-clamp-1">
                                            {esp.name}
                                          </span>
                                          <span className="font-mono text-[9px] text-slate-500 block">
                                            IP: {esp.ip}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center mt-1">
                                          {status === 'online' ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 font-black text-[8px] uppercase tracking-wider h-5 rounded-md px-1.5 flex gap-1 items-center">
                                              <Wifi className="h-2.5 w-2.5" /> Online
                                            </Badge>
                                          ) : status === 'offline' ? (
                                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 font-black text-[8px] uppercase tracking-wider h-5 rounded-md px-1.5 flex gap-1 items-center">
                                              <WifiOff className="h-2.5 w-2.5" /> Offline
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-455 border border-slate-200 dark:border-white/5 font-black text-[8px] uppercase tracking-wider h-5 rounded-md px-1.5 flex gap-1 items-center animate-pulse">
                                              <Activity className="h-2.5 w-2.5 animate-spin" /> Testando...
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between items-center border-t border-slate-200 dark:border-white/5">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (confirm("Deseja realmente remover este totem permanentemente do sistema?")) {
                              deleteTerminal(selectedTerminalId);
                              toast({ title: "Totem Removido", description: "O terminal foi removido do banco de dados." });
                              setSelectedTerminalId('');
                            }
                          }}
                          className="w-full sm:w-auto bg-white dark:bg-slate-950 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 uppercase text-[10px] font-black tracking-widest h-12 rounded-xl"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Totem do Sistema
                        </Button>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedTerminalId('')}
                            className="w-full sm:w-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl h-12 uppercase text-[10px] font-black tracking-widest"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={() => {
                              updateTerminalSettings(selectedTerminalId, { 
                                location: terminalLocation.toUpperCase().trim(),
                                settings: { 
                                  ...selectedTerminal?.settings, 
                                  preferredCamera,
                                  scanningCameraDevice: terminalScanningCameraDevice,
                                  loginMethod: terminalLoginMethod,
                                  loginCameraSource: terminalLoginCameraSource,
                                  scanningCameraSource: terminalScanningCameraSource,
                                  cameraUrl: terminalScanningCameraUrl,
                                  loginCameraUrl: terminalLoginCameraUrl,
                                  scanningCameraUrl: terminalScanningCameraUrl,
                                  scannerFramerate: terminalScannerFramerate,
                                  loginCameraFramerate: terminalLoginCameraFramerate,
                                  loginCameraFlash: terminalLoginCameraFlash,
                                  scanningCameraFlash: terminalScanningCameraFlash,
                                  schoolgainServer: terminalSchoolgainServer,
                                  hardwareToken: terminalHardwareToken,
                                  discardEspIp: terminalDiscardEspIp,
                                  discardEspSource: terminalDiscardEspSource,
                                  sonarDistance: Number(terminalSonarDistance) || 15,
                                  rfidReaderEnabled: terminalRfidReaderEnabled
                                }
                              });
                              toast({ title: "Configurações Salvas", description: "O totem foi atualizado com sucesso." });
                              setSelectedTerminalId('');
                            }}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            Salvar Configurações
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // VIEW 2: GRADE VISUAL COMPACTA DE TOTENS CADASTRADOS (IMPERIAL SELECTION DESIGN)
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                      Totens Cadastrados nesta Unidade ({filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length})
                    </h3>
                  </div>

                  {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').map((terminal) => {
                        const isOnline = terminal.status === 'active';
                        return (
                          <div 
                            key={terminal.id} 
                            className="border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 rounded-2xl p-5 bg-white dark:bg-slate-950/40 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all flex flex-col justify-between gap-4 cursor-pointer group"
                            onClick={() => {
                              setSelectedTerminalId(terminal.id);
                              setTerminalLocation(terminal.location);
                              setPreferredCamera(terminal.settings?.preferredCamera || 'default');
                              setTerminalScanningCameraDevice(terminal.settings?.scanningCameraDevice || 'default');
                              setTerminalLoginMethod(terminal.settings?.loginMethod || 'all');
                              setTerminalLoginCameraSource(terminal.settings?.loginCameraSource || 'browser');
                              setTerminalScanningCameraSource(terminal.settings?.scanningCameraSource || 'browser');
                              setTerminalLoginCameraUrl(terminal.settings?.loginCameraUrl || terminal.settings?.cameraUrl || '');
                              setTerminalScanningCameraUrl(terminal.settings?.scanningCameraUrl || terminal.settings?.cameraUrl || '');
                              setTerminalScannerFramerate(terminal.settings?.scannerFramerate || 'fluid');
                              setTerminalLoginCameraFramerate(terminal.settings?.loginCameraFramerate || 'fluid');
                              setTerminalLoginCameraFlash(terminal.settings?.loginCameraFlash ?? false);
                              setTerminalScanningCameraFlash(terminal.settings?.scanningCameraFlash ?? true);
                              setTerminalSchoolgainServer(terminal.settings?.schoolgainServer || '172.16.0.118:3000');
                              setTerminalHardwareToken(terminal.settings?.hardwareToken || 'sg_hardware_secret_2026');
                              setTerminalDiscardEspIp(terminal.settings?.discardEspIp || '');
                              setTerminalDiscardEspSource(terminal.settings?.discardEspSource || 'esp32');
                              setTerminalSonarDistance(terminal.settings?.sonarDistance || 15);
                              setTerminalRfidReaderEnabled(terminal.settings?.rfidReaderEnabled ?? true);
                            }}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                                  <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                </div>
                                <Badge className={`uppercase text-[8px] font-black tracking-widest ${isOnline ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
                                  {isOnline ? 'Ativo / Online' : 'Inativo'}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight line-clamp-1">{terminal.location}</h4>
                                <div className="flex flex-col gap-0.5 font-mono text-[9px] text-slate-500 dark:text-slate-450">
                                  <span>ID: {terminal.id}</span>
                                  <span>HW: {terminal.hardwareId.slice(0, 15)}...</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <div className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded">
                                Login: {terminal.settings?.loginCameraSource === 'esp32' ? 'ESP32-CAM HTTP' : terminal.settings?.loginCameraSource === 'esp32_https' ? 'ESP32-CAM HTTPS' : 'Local'}
                              </div>
                              <div className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded">
                                Scanner: {terminal.settings?.scanningCameraSource === 'esp32' ? `ESP32 HTTP (${terminal.settings?.scannerFramerate === 'fluid' ? '30 FPS' : terminal.settings?.scannerFramerate === 'balanced' ? '18 FPS' : '12 FPS'})` : terminal.settings?.scanningCameraSource === 'esp32_https' ? `ESP32 HTTPS (${terminal.settings?.scannerFramerate === 'fluid' ? '30 FPS' : terminal.settings?.scannerFramerate === 'balanced' ? '18 FPS' : '12 FPS'})` : 'Local'}
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-9 uppercase text-[9px] font-black tracking-wider border border-slate-200/60 dark:border-white/10 group-hover:border-indigo-500/40 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl"
                            >
                              Configurar Parâmetros
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                      <Cpu className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto animate-pulse" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic uppercase tracking-wider">Nenhum totem cadastrado nesta unidade escolar.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
