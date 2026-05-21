'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, ShieldCheck, Monitor, ShieldAlert, Settings2, Trash2, Cpu 
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
  const [terminalLoginMethod, setTerminalLoginMethod] = useState<'manual' | 'qr' | 'rfid' | 'all'>('all');
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

  const [proxyActive, setProxyActive] = useState<boolean | null>(null);
  const [proxyLoading, setProxyLoading] = useState(false);

  useEffect(() => {
    const checkProxy = async () => {
      try {
        const res = await fetch('/api/hardware/proxy', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProxyActive(data.active);
        } else {
          setProxyActive(false);
        }
      } catch (err) {
        setProxyActive(false);
      }
    };
    checkProxy();
    const interval = setInterval(checkProxy, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const sortedVideoDevices = useMemo(() => {
    return [...videoDevices].sort((a, b) => a.label.localeCompare(b.label));
  }, [videoDevices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 📡 DIAGNÓSTICO DO PROXY SEGURO */}
      <div className="p-6 bg-slate-900/40 border border-white/10 rounded-[2rem] backdrop-blur-xl text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${proxyActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'} transition-all duration-300`}>
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400/80">Painel de Transmissão ESP32-CAM</h3>
            <p className="text-sm font-bold text-white mt-0.5">
              Status do Proxy Seguro: {proxyActive === null ? 'Verificando...' : proxyActive ? '🟢 ATIVO (Porta 9005)' : '🔴 INATIVO'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xl leading-relaxed">
              {proxyActive 
                ? 'As transmissões via "ESP32-CAM HTTPS Proxy" estão prontas e seguras contra bloqueios de rede do navegador (PNA e Mixed Content).'
                : 'Necessário para conexões online seguras em HTTPS. Se você estiver rodando o servidor localmente, clique em Iniciar. Caso contrário, execute o arquivo "Iniciar-Proxy-Local.bat" no computador local do Totem.'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {!proxyActive && (
            <Button
              onClick={handleStartProxy}
              disabled={proxyLoading || proxyActive === null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-5 rounded-xl shadow-lg shadow-indigo-600/15 disabled:opacity-50 transition-all duration-300"
            >
              {proxyLoading ? 'Iniciando...' : 'Iniciar Proxy Local'}
            </Button>
          )}
          <div className="px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-center min-w-[130px]">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Atalho do Totem</span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold block mt-0.5">Iniciar-Proxy-Local.bat</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-white">
          <CardHeader className="border-b border-white/5 bg-slate-950/20 px-6 py-5 pb-4">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tight font-black text-sm text-indigo-400">
              <UserIcon className="h-5 w-5 text-indigo-400" /> Acesso do Aluno (Portal)
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Configure como os alunos acessam o Portal Web.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Método de Login Ativo</Label>
              <Select 
                value={systemSettings.studentLoginMethod || "all"} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="all" className="hover:bg-indigo-500/10">Tudo (RA e QR Code)</SelectItem>
                  <SelectItem value="manual" className="hover:bg-indigo-500/10">Apenas Manual (RA)</SelectItem>
                  <SelectItem value="qr" className="hover:bg-indigo-500/10">Apenas QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fonte da Câmera</Label>
                <Select 
                  value={systemSettings.studentCaptureSource || 'browser'} 
                  onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentCaptureSource: v}, targetSchoolId)}
                >
                  <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border border-white/10 text-white">
                    <SelectItem value="browser" className="hover:bg-indigo-500/10">Webcam do Sistema</SelectItem>
                    <SelectItem value="esp32" className="hover:bg-indigo-500/10">ESP32-CAM HTTP (IP Local)</SelectItem>
                    <SelectItem value="esp32_https" className="hover:bg-indigo-500/10">ESP32-CAM HTTPS Proxy</SelectItem>
                    <SelectItem value="url" className="hover:bg-indigo-500/10">Stream Externo (URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {systemSettings.studentCaptureSource === 'browser' ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dispositivo de Captura</Label>
                  <Select 
                    key={`student-cam-${videoDevices.length}`}
                    value={systemSettings.studentCaptureDevice || 'default'} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentCaptureDevice: v}, targetSchoolId)}
                  >
                    <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9"><SelectValue placeholder="Selecione a câmera" /></SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                      <SelectItem value="default" className="hover:bg-indigo-500/10">Automático (Padrão do Sistema)</SelectItem>
                      {sortedVideoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10">
                          {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço / URL do Stream</Label>
                  <Input 
                    placeholder={systemSettings.studentCaptureSource === 'esp32' || systemSettings.studentCaptureSource === 'esp32_https' ? "Ex: 192.168.1.50" : "http://server.com/stream"}
                    value={systemSettings.studentCaptureUrl || ''}
                    onChange={(e) => updateSystemSettings({...systemSettings, studentCaptureUrl: e.target.value}, targetSchoolId)}
                    className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9 text-xs"
                  />
                </div>
              )}
            </div>
            
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              Configuração aplicada ao login web do aluno.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-white">
          <CardHeader className="border-b border-white/5 bg-slate-950/20 px-6 py-5 pb-4">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tight font-black text-sm text-indigo-400">
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> Painel de Gestão (Admin)
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">Segurança e acesso para administradores e gestores.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Método de Autenticação</Label>
              <Select 
                value={systemSettings.adminLoginMethod || "all"} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                  <SelectItem value="all" className="hover:bg-indigo-500/10">Tudo (Senha, QR e RFID)</SelectItem>
                  <SelectItem value="manual" className="hover:bg-indigo-500/10">Apenas Senha</SelectItem>
                  <SelectItem value="qr" className="hover:bg-indigo-500/10">Apenas QR Code Master</SelectItem>
                  <SelectItem value="rfid" className="hover:bg-indigo-500/10">Apenas RFID (Crachá)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fonte da Câmera</Label>
                <Select 
                  value={systemSettings.adminCaptureSource || 'browser'} 
                  onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminCaptureSource: v}, targetSchoolId)}
                >
                  <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border border-white/10 text-white">
                    <SelectItem value="browser" className="hover:bg-indigo-500/10">Webcam do Sistema</SelectItem>
                    <SelectItem value="esp32" className="hover:bg-indigo-500/10">ESP32-CAM HTTP (IP Local)</SelectItem>
                    <SelectItem value="esp32_https" className="hover:bg-indigo-500/10">ESP32-CAM HTTPS Proxy</SelectItem>
                    <SelectItem value="url" className="hover:bg-indigo-500/10">Stream Externo (URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {systemSettings.adminCaptureSource === 'browser' ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dispositivo de Captura</Label>
                  <Select 
                    key={`admin-cam-${videoDevices.length}`}
                    value={systemSettings.adminCaptureDevice || 'default'} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminCaptureDevice: v}, targetSchoolId)}
                  >
                    <SelectTrigger className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9"><SelectValue placeholder="Selecione a câmera" /></SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                      <SelectItem value="default" className="hover:bg-indigo-500/10">Automático (Padrão do Sistema)</SelectItem>
                      {sortedVideoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10">
                          {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço / URL do Stream</Label>
                  <Input 
                    placeholder={systemSettings.adminCaptureSource === 'esp32' || systemSettings.adminCaptureSource === 'esp32_https' ? "Ex: 192.168.1.50" : "http://server.com/stream"}
                    value={systemSettings.adminCaptureUrl || ''}
                    onChange={(e) => updateSystemSettings({...systemSettings, adminCaptureUrl: e.target.value}, targetSchoolId)}
                    className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-9 text-xs"
                  />
                </div>
              )}
            </div>
            
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              Recomendado: Híbrido para máxima redundância escolar.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/10 shadow-2xl overflow-hidden bg-slate-900/40 rounded-[2rem] backdrop-blur-xl hover:border-indigo-500/10 transition-all duration-300 text-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-slate-950/20 px-6 py-5 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tight font-black text-sm"><Monitor className="h-5 w-5 text-indigo-400" /> Gestão de Totens</CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">Localize, gerencie câmeras e configure parâmetros físicos dos totens da sua unidade.</CardDescription>
            </div>
            <Badge className="gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-black tracking-widest text-[9px] h-6 px-3 rounded-full shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
              Painel Sincronizado
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* SOLICITAÇÕES PENDENTES */}
            {filteredTerminalsForAdmin.filter(t => t.status === 'pending').length > 0 && (
               <div className="border border-amber-500/20 rounded-3xl bg-amber-500/5 p-5 space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                     <ShieldAlert className="h-4 w-4" /> Solicitações de Acesso Pendentes
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredTerminalsForAdmin.filter(t => t.status === 'pending').map(terminal => (
                       <div key={terminal.id} className="flex flex-col justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl gap-4">
                          <div className="flex items-start gap-3">
                             <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                <Monitor className="h-5 w-5 animate-pulse" />
                             </div>
                             <div>
                                <p className="font-black text-slate-200 text-sm leading-tight mb-1">{terminal.location}</p>
                                <div className="flex flex-col gap-0.5 font-mono text-[9px] text-slate-400">
                                   <span>ID: {terminal.id}</span>
                                   <span>Hardware: {terminal.hardwareId}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => deleteTerminal(terminal.id)} className="bg-slate-950 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 flex-1 h-9 uppercase text-[10px] font-black tracking-wider rounded-xl">Recusar</Button>
                             <Button size="sm" onClick={() => approveTerminal(terminal)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-950 border border-indigo-400/20 flex-1 h-9 uppercase text-[10px] font-black tracking-wider rounded-xl">Autorizar Acesso</Button>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            )}

            {/* SELEÇÃO E NAVEGAÇÃO DE TOTENS CADASTRADOS */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl shadow-md space-y-3">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Estrutura de Seleção de Totens
                    </Label>
                    <p className="text-[9px] text-slate-500 font-medium">Use o menu abaixo para localizar e focar imediatamente nas configurações de qualquer totem cadastrado.</p>
                  </div>
                  
                  <Select 
                    value={selectedTerminalId || ""} 
                    onValueChange={(id) => {
                      setSelectedTerminalId(id);
                      if (id) {
                        const terminal = filteredTerminalsForAdmin.find(t => t.id === id);
                        if (terminal) {
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
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full md:w-80 h-11 bg-slate-950 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold">
                      <SelectValue placeholder="Escolha um totem para gerenciar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border border-white/10 text-white">
                      {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length > 0 ? (
                        filteredTerminalsForAdmin.filter(t => t.status !== 'pending').map(t => (
                          <SelectItem key={t.id} value={t.id} className="font-bold text-slate-200 hover:bg-indigo-500/10">
                            📍 {t.location} (ID: {t.id.slice(0, 15)}...)
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-xs text-slate-500 italic">Nenhum totem cadastrado nesta unidade.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CARD DE DETALHES OU GRADE DE TOTENS */}
              {selectedTerminalId ? (
                // VIEW 1: PAINEL DE CONTROLE DETALHADO DO TOTEM SELECIONADO
                (() => {
                  const selectedTerminal = filteredTerminalsForAdmin.find(t => t.id === selectedTerminalId);
                  return (
                    <div className="border border-indigo-500/20 rounded-3xl bg-slate-950/40 p-6 space-y-6 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-md">
                            <Cpu className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-200 text-lg uppercase tracking-tight">{terminalLocation || selectedTerminal?.location}</h3>
                              <Badge className={`uppercase text-[8px] font-black tracking-widest ${selectedTerminal?.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border border-white/5 text-slate-400'}`}>
                                {selectedTerminal?.status === 'active' ? 'Ativo / Online' : 'Inativo / Offline'}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {selectedTerminal?.id} • HW: {selectedTerminal?.hardwareId}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedTerminalId('')} 
                          className="font-bold text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl"
                        >
                          ← Voltar para Grade de Totens
                        </Button>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* BLOCO A: IDENTIFICAÇÃO E SEGURANÇA */}
                        <div className="space-y-4 p-5 bg-slate-950 border border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Identificação & Segurança</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome / Localização do Totem</Label>
                            <Input 
                              value={terminalLocation} 
                              onChange={(e) => setTerminalLocation(e.target.value)} 
                              placeholder="Ex: Entrada Principal, Biblioteca..."
                              className="bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Método de Autenticação do Totem</Label>
                            <Select value={terminalLoginMethod || "all"} onValueChange={(v: any) => setTerminalLoginMethod(v)}>
                              <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50 font-bold h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                <SelectItem value="all" className="hover:bg-indigo-500/10">Tudo (Senha, QR e RFID)</SelectItem>
                                <SelectItem value="manual" className="hover:bg-indigo-500/10">Apenas Senha</SelectItem>
                                <SelectItem value="qr" className="hover:bg-indigo-500/10">Apenas QR Code</SelectItem>
                                <SelectItem value="rfid" className="hover:bg-indigo-500/10">Apenas RFID (Cartão)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* BLOCO B: PARÂMETROS DE FIRMWARE DA ESP32-CAM */}
                        <div className="space-y-4 p-5 bg-slate-950 border border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Parâmetros de Firmware (Código C++)</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Servidor (schoolgain_server)
                              </Label>
                              <Input 
                                value={terminalSchoolgainServer} 
                                onChange={(e) => setTerminalSchoolgainServer(e.target.value)} 
                                placeholder="Ex: 172.16.0.118:3000"
                                className="font-mono text-xs h-10 bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Token (hardware_token)
                              </Label>
                              <Input 
                                value={terminalHardwareToken} 
                                onChange={(e) => setTerminalHardwareToken(e.target.value)} 
                                placeholder="Ex: sg_hardware_secret_2026"
                                className="font-mono text-xs h-10 bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                              ID do Terminal (terminal_id - Cole no Arduino)
                            </Label>
                            <div className="flex gap-2">
                              <Input 
                                readOnly
                                value={selectedTerminal?.hardwareId || ''} 
                                className="font-mono text-xs h-10 bg-slate-900 border-white/10 text-slate-300 rounded-xl select-all flex-1"
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm"
                                className="h-10 px-3 bg-slate-950 border border-white/10 text-indigo-400 hover:text-indigo-300 rounded-xl uppercase text-[9px] font-black tracking-wider"
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
                        <div className="space-y-4 p-5 bg-slate-950 border border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">3. Câmera de Login (Aluno)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Fonte de Vídeo (Login)</Label>
                            <Select value={terminalLoginCameraSource || "browser"} onValueChange={(v: any) => setTerminalLoginCameraSource(v)}>
                              <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                <SelectItem value="browser" className="hover:bg-indigo-500/10">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32" className="hover:bg-indigo-500/10">ESP32-CAM HTTP (IP Local)</SelectItem>
                                <SelectItem value="esp32_https" className="hover:bg-indigo-500/10">ESP32-CAM HTTPS Proxy</SelectItem>
                                <SelectItem value="url" className="hover:bg-indigo-500/10">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalLoginCameraSource !== 'browser' ? (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Endereço da Câmera de Login</Label>
                                <Input 
                                  value={terminalLoginCameraUrl} 
                                  onChange={(e) => setTerminalLoginCameraUrl(e.target.value)} 
                                  placeholder={terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https' ? "Ex: 192.168.1.5" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10 bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50"
                                />
                              </div>

                              {(terminalLoginCameraSource === 'esp32' || terminalLoginCameraSource === 'esp32_https') && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                      Taxa de Quadros (Qualidade) do Login
                                    </Label>
                                    <Select value={terminalLoginCameraFramerate || "fluid"} onValueChange={(v: any) => setTerminalLoginCameraFramerate(v)}>
                                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        <SelectItem value="fluid" className="hover:bg-indigo-500/10">⚡ Alta Velocidade / QR (CIF)</SelectItem>
                                        <SelectItem value="balanced" className="hover:bg-indigo-500/10">⚖️ Equilibrado (VGA)</SelectItem>
                                        <SelectItem value="high_res" className="hover:bg-indigo-500/10">📸 Alta Resolução (SVGA)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                      Luz de Flash LED (Login)
                                    </Label>
                                    <Select 
                                      value={terminalLoginCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalLoginCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        <SelectItem value="off" className="hover:bg-indigo-500/10">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on" className="hover:bg-indigo-500/10">💡 Ativado (Flash Aceso na Leitura)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Dispositivo de Captura</Label>
                              <Select value={preferredCamera || "default"} onValueChange={setPreferredCamera}>
                                <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                  <SelectItem value="default" className="hover:bg-indigo-500/10">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10">
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* BLOCO D: CÂMERA DO SCANNER (PESAGEM E IA) */}
                        <div className="space-y-4 p-5 bg-slate-950 border border-white/5 rounded-2xl shadow-md">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">4. Câmera de Scanner (Identificação de Resíduos)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Fonte de Vídeo (Scanner)</Label>
                            <Select value={terminalScanningCameraSource || "browser"} onValueChange={(v: any) => setTerminalScanningCameraSource(v)}>
                              <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                <SelectItem value="browser" className="hover:bg-indigo-500/10">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32" className="hover:bg-indigo-500/10">ESP32-CAM HTTP (IP Local)</SelectItem>
                                <SelectItem value="esp32_https" className="hover:bg-indigo-500/10">ESP32-CAM HTTPS Proxy</SelectItem>
                                <SelectItem value="url" className="hover:bg-indigo-500/10">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalScanningCameraSource === 'browser' ? (
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Dispositivo de Captura (Scanner)</Label>
                              <Select value={terminalScanningCameraDevice || "default"} onValueChange={setTerminalScanningCameraDevice}>
                                <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                  <SelectItem value="default" className="hover:bg-indigo-500/10">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId} className="hover:bg-indigo-500/10">
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in duration-200">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Endereço da Câmera de Scanner</Label>
                                <Input 
                                  value={terminalScanningCameraUrl} 
                                  onChange={(e) => setTerminalScanningCameraUrl(e.target.value)} 
                                  placeholder={terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https' ? "Ex: 192.168.1.6" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10 bg-slate-900 border-white/10 text-white rounded-xl focus:border-indigo-500/50"
                                />
                              </div>

                              {(terminalScanningCameraSource === 'esp32' || terminalScanningCameraSource === 'esp32_https') && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                      Taxa de Quadros (Framerate) do Scanner
                                    </Label>
                                    <Select value={terminalScannerFramerate || "fluid"} onValueChange={(v: any) => setTerminalScannerFramerate(v)}>
                                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        <SelectItem value="fluid" className="hover:bg-indigo-500/10">⚡ Alta Fluidez (~30 FPS) - VGA</SelectItem>
                                        <SelectItem value="balanced" className="hover:bg-indigo-500/10">⚖️ Equilibrado (~18 FPS) - SVGA</SelectItem>
                                        <SelectItem value="high_res" className="hover:bg-indigo-500/10">📸 Alta Resolução (~12 FPS) - HD</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                      Luz de Flash LED (Scanner)
                                    </Label>
                                    <Select 
                                      value={terminalScanningCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalScanningCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent className="bg-slate-950 border border-white/10 text-white">
                                        <SelectItem value="off" className="hover:bg-indigo-500/10">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on" className="hover:bg-indigo-500/10">💡 Ativado (Iluminar Resíduo ao Escanear)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between items-center border-t border-white/5">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (confirm("Deseja realmente remover este totem permanentemente do sistema?")) {
                              deleteTerminal(selectedTerminalId);
                              toast({ title: "Totem Removido", description: "O terminal foi removido do banco de dados." });
                              setSelectedTerminalId('');
                            }
                          }}
                          className="w-full sm:w-auto bg-slate-950 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 uppercase text-[10px] font-black tracking-widest h-12 rounded-xl"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Totem do Sistema
                        </Button>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedTerminalId('')}
                            className="w-full sm:w-auto bg-slate-950 border border-white/10 text-slate-300 hover:text-white rounded-xl h-12 uppercase text-[10px] font-black tracking-widest"
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
                                  hardwareToken: terminalHardwareToken
                                }
                              });
                              toast({ title: "Configurações Salvas", description: "O totem foi atualizado com sucesso." });
                              setSelectedTerminalId('');
                            }}
                            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-950 border border-indigo-400/20 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
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
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
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
                            className="border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 bg-slate-950/40 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all flex flex-col justify-between gap-4 cursor-pointer group"
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
                            }}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="h-9 w-9 rounded-xl bg-slate-950 border border-white/5 text-slate-400 flex items-center justify-center shrink-0">
                                  <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
                                </div>
                                <Badge className={`uppercase text-[8px] font-black tracking-widest ${isOnline ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border border-white/5 text-slate-400'}`}>
                                  {isOnline ? 'Ativo / Online' : 'Inativo'}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-slate-200 text-sm uppercase tracking-tight line-clamp-1">{terminal.location}</h4>
                                <div className="flex flex-col gap-0.5 font-mono text-[9px] text-slate-500">
                                  <span>ID: {terminal.id}</span>
                                  <span>HW: {terminal.hardwareId.slice(0, 15)}...</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider text-slate-400">
                              <div className="px-2 py-1 bg-slate-950 border border-white/5 rounded">
                                Login: {terminal.settings?.loginCameraSource === 'esp32' ? 'ESP32-CAM HTTP' : terminal.settings?.loginCameraSource === 'esp32_https' ? 'ESP32-CAM HTTPS' : 'Local'}
                              </div>
                              <div className="px-2 py-1 bg-slate-950 border border-white/5 rounded">
                                Scanner: {terminal.settings?.scanningCameraSource === 'esp32' ? `ESP32 HTTP (${terminal.settings?.scannerFramerate === 'fluid' ? '30 FPS' : terminal.settings?.scannerFramerate === 'balanced' ? '18 FPS' : '12 FPS'})` : terminal.settings?.scanningCameraSource === 'esp32_https' ? `ESP32 HTTPS (${terminal.settings?.scannerFramerate === 'fluid' ? '30 FPS' : terminal.settings?.scannerFramerate === 'balanced' ? '18 FPS' : '12 FPS'})` : 'Local'}
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-9 uppercase text-[9px] font-black tracking-wider border border-white/10 group-hover:border-indigo-500/40 text-slate-300 bg-slate-950/50 hover:bg-slate-900 rounded-xl"
                            >
                              Configurar Parâmetros
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl space-y-3 bg-slate-950/20">
                      <Cpu className="h-10 w-10 text-slate-500 mx-auto animate-pulse" />
                      <p className="text-xs text-slate-400 italic uppercase tracking-wider">Nenhum totem cadastrado nesta unidade escolar.</p>
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
