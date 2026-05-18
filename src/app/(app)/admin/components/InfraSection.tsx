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
import { SystemSettings, Terminal, School } from '@/lib/types';

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
  const [terminalLoginCameraSource, setTerminalLoginCameraSource] = useState<'browser' | 'esp32' | 'url'>('browser');
  const [terminalScanningCameraSource, setTerminalScanningCameraSource] = useState<'browser' | 'esp32' | 'url'>('browser');
  const [terminalLoginCameraUrl, setTerminalLoginCameraUrl] = useState('');
  const [terminalScanningCameraUrl, setTerminalScanningCameraUrl] = useState('');
  const [terminalScannerFramerate, setTerminalScannerFramerate] = useState<'fluid' | 'balanced' | 'high_res'>('fluid');
  const [terminalLoginCameraFramerate, setTerminalLoginCameraFramerate] = useState<'fluid' | 'balanced' | 'high_res'>('fluid');
  const [terminalLoginCameraFlash, setTerminalLoginCameraFlash] = useState(false);
  const [terminalScanningCameraFlash, setTerminalScanningCameraFlash] = useState(true);
  const [terminalSchoolgainServer, setTerminalSchoolgainServer] = useState('172.16.0.118:3000');
  const [terminalHardwareToken, setTerminalHardwareToken] = useState('sg_hardware_secret_2026');

  const sortedVideoDevices = useMemo(() => {
    return [...videoDevices].sort((a, b) => a.label.localeCompare(b.label));
  }, [videoDevices]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-emerald-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm">
              <UserIcon className="h-5 w-5 text-emerald-600" /> Acesso do Aluno (Portal)
            </CardTitle>
            <CardDescription>Configure como os alunos acessam o Portal Web.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Método de Login Ativo</Label>
              <Select 
                value={systemSettings.studentLoginMethod} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-white font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo (RA e QR Code)</SelectItem>
                  <SelectItem value="manual">Apenas Manual (RA)</SelectItem>
                  <SelectItem value="qr">Apenas QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2 border-t border-emerald-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonte da Câmera</Label>
                <Select 
                  value={systemSettings.studentCaptureSource || 'browser'} 
                  onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentCaptureSource: v}, targetSchoolId)}
                >
                  <SelectTrigger className="bg-white font-bold h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser">Webcam do Sistema</SelectItem>
                    <SelectItem value="esp32">ESP32-CAM (IP)</SelectItem>
                    <SelectItem value="url">Stream Externo (URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {systemSettings.studentCaptureSource === 'browser' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dispositivo de Captura</Label>
                  <Select 
                    key={`student-cam-${videoDevices.length}`}
                    value={systemSettings.studentCaptureDevice || 'default'} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, studentCaptureDevice: v}, targetSchoolId)}
                  >
                    <SelectTrigger className="bg-white font-bold h-9"><SelectValue placeholder="Selecione a câmera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Automático (Padrão do Sistema)</SelectItem>
                      {sortedVideoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço / URL do Stream</Label>
                  <Input 
                    placeholder={systemSettings.studentCaptureSource === 'esp32' ? "Ex: 192.168.1.50" : "http://server.com/stream"}
                    value={systemSettings.studentCaptureUrl || ''}
                    onChange={(e) => updateSystemSettings({...systemSettings, studentCaptureUrl: e.target.value}, targetSchoolId)}
                    className="bg-white font-bold h-9 text-xs"
                  />
                </div>
              )}
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
              Configuração aplicada ao login web do aluno.
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm">
              <ShieldCheck className="h-5 w-5 text-rose-600" /> Painel de Gestão (Admin)
            </CardTitle>
            <CardDescription>Segurança e acesso para administradores e gestores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Método de Autenticação</Label>
              <Select 
                value={systemSettings.adminLoginMethod} 
                onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminLoginMethod: v}, targetSchoolId)}
              >
                <SelectTrigger className="bg-white font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo (Senha, QR e RFID)</SelectItem>
                  <SelectItem value="manual">Apenas Senha</SelectItem>
                  <SelectItem value="qr">Apenas QR Code Master</SelectItem>
                  <SelectItem value="rfid">Apenas RFID (Crachá)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2 border-t border-rose-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonte da Câmera</Label>
                <Select 
                  value={systemSettings.adminCaptureSource || 'browser'} 
                  onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminCaptureSource: v}, targetSchoolId)}
                >
                  <SelectTrigger className="bg-white font-bold h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser">Webcam do Sistema</SelectItem>
                    <SelectItem value="esp32">ESP32-CAM (IP)</SelectItem>
                    <SelectItem value="url">Stream Externo (URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {systemSettings.adminCaptureSource === 'browser' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dispositivo de Captura</Label>
                  <Select 
                    key={`admin-cam-${videoDevices.length}`}
                    value={systemSettings.adminCaptureDevice || 'default'} 
                    onValueChange={(v: any) => updateSystemSettings({...systemSettings, adminCaptureDevice: v}, targetSchoolId)}
                  >
                    <SelectTrigger className="bg-white font-bold h-9"><SelectValue placeholder="Selecione a câmera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Automático (Padrão do Sistema)</SelectItem>
                      {sortedVideoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço / URL do Stream</Label>
                  <Input 
                    placeholder={systemSettings.adminCaptureSource === 'esp32' ? "Ex: 192.168.1.50" : "http://server.com/stream"}
                    value={systemSettings.adminCaptureUrl || ''}
                    onChange={(e) => updateSystemSettings({...systemSettings, adminCaptureUrl: e.target.value}, targetSchoolId)}
                    className="bg-white font-bold h-9 text-xs"
                  />
                </div>
              )}
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-[10px] text-rose-700 font-bold uppercase tracking-wider">
              Recomendado: Híbrido para máxima redundância.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm"><Monitor className="h-5 w-5 text-primary" /> Gestão de Totens</CardTitle>
              <CardDescription>Localize, gerencie câmeras e configure parâmetros físicos dos totens da sua unidade.</CardDescription>
            </div>
            <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Painel Sincronizado
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* SOLICITAÇÕES PENDENTES */}
            {filteredTerminalsForAdmin.filter(t => t.status === 'pending').length > 0 && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                     <ShieldAlert className="h-4 w-4" /> Solicitações de Acesso Pendentes
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredTerminalsForAdmin.filter(t => t.status === 'pending').map(terminal => (
                       <div key={terminal.id} className="flex flex-col justify-between p-4 bg-amber-50/40 border border-amber-200 rounded-2xl gap-4">
                          <div className="flex items-start gap-3">
                             <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <Monitor className="h-5 w-5 animate-pulse" />
                             </div>
                             <div>
                                <p className="font-black text-amber-900 text-sm leading-tight mb-1">{terminal.location}</p>
                                <div className="flex flex-col gap-0.5">
                                   <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider">ID: {terminal.id}</p>
                                   <p className="text-[9px] font-mono text-amber-600/70">Hardware: {terminal.hardwareId}</p>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => deleteTerminal(terminal.id)} className="bg-white text-red-600 border-red-200 flex-1 h-9 uppercase text-[10px] font-black tracking-wider">Recusar</Button>
                             <Button size="sm" onClick={() => approveTerminal(terminal)} className="bg-amber-600 hover:bg-amber-700 flex-1 h-9 uppercase text-[10px] font-black tracking-wider">Autorizar Acesso</Button>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            )}

            {/* SELEÇÃO E NAVEGAÇÃO DE TOTENS CADASTRADOS */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Estrutura de Seleção de Totens
                    </Label>
                    <p className="text-[9px] text-slate-400 font-medium">Use o menu abaixo para localizar e focar imediatamente nas configurações de qualquer totem cadastrado.</p>
                  </div>
                  
                  <Select 
                    value={selectedTerminalId} 
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
                    <SelectTrigger className="w-full md:w-80 h-11 bg-white border-slate-200 shadow-sm font-bold text-slate-800">
                      <SelectValue placeholder="Escolha um totem para gerenciar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length > 0 ? (
                        filteredTerminalsForAdmin.filter(t => t.status !== 'pending').map(t => (
                          <SelectItem key={t.id} value={t.id} className="font-bold text-slate-700">
                            📍 {t.location} (ID: {t.id.slice(0, 15)}...)
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-xs text-slate-400 italic">Nenhum totem cadastrado nesta unidade.</div>
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
                    <div className="border border-amber-200/60 rounded-3xl bg-gradient-to-b from-amber-50/10 to-slate-50/50 p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Cpu className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{terminalLocation || selectedTerminal?.location}</h3>
                              <Badge variant={selectedTerminal?.status === 'active' ? 'default' : 'secondary'} className={`uppercase text-[8px] font-black tracking-widest ${selectedTerminal?.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}>
                                {selectedTerminal?.status === 'active' ? 'Ativo / Online' : 'Inativo / Offline'}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {selectedTerminal?.id} • HW: {selectedTerminal?.hardwareId}</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedTerminalId('')} 
                          className="font-bold text-slate-500 hover:text-slate-900 border"
                        >
                          ← Voltar para Grade de Totens
                        </Button>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* BLOCO A: IDENTIFICAÇÃO E SEGURANÇA */}
                        <div className="space-y-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">1. Identificação & Segurança</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nome / Localização do Totem</Label>
                            <Input 
                              value={terminalLocation} 
                              onChange={(e) => setTerminalLocation(e.target.value)} 
                              placeholder="Ex: Entrada Principal, Biblioteca..."
                              className="font-bold h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Método de Autenticação do Totem</Label>
                            <Select value={terminalLoginMethod} onValueChange={(v: any) => setTerminalLoginMethod(v)}>
                              <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tudo (Senha, QR e RFID)</SelectItem>
                                <SelectItem value="manual">Apenas Senha</SelectItem>
                                <SelectItem value="qr">Apenas QR Code</SelectItem>
                                <SelectItem value="rfid">Apenas RFID (Cartão)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* BLOCO B: PARÂMETROS DE FIRMWARE DA ESP32-CAM */}
                        <div className="space-y-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Cpu className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">2. Parâmetros de Firmware (Código C++)</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                Servidor (schoolgain_server)
                              </Label>
                              <Input 
                                value={terminalSchoolgainServer} 
                                onChange={(e) => setTerminalSchoolgainServer(e.target.value)} 
                                placeholder="Ex: 172.16.0.118:3000"
                                className="font-mono text-xs h-10 bg-white"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                Token (hardware_token)
                              </Label>
                              <Input 
                                value={terminalHardwareToken} 
                                onChange={(e) => setTerminalHardwareToken(e.target.value)} 
                                placeholder="Ex: sg_hardware_secret_2026"
                                className="font-mono text-xs h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                              ID do Terminal (terminal_id - Cole no Arduino)
                            </Label>
                            <div className="flex gap-2">
                              <Input 
                                readOnly
                                value={selectedTerminal?.hardwareId || ''} 
                                className="font-mono text-xs h-10 bg-slate-50 select-all flex-1"
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="sm"
                                className="h-10 px-3 uppercase text-[9px] font-black tracking-wider border-slate-300 hover:bg-slate-100"
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
                        <div className="space-y-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">3. Câmera de Login (Aluno)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fonte de Vídeo (Login)</Label>
                            <Select value={terminalLoginCameraSource} onValueChange={(v: any) => setTerminalLoginCameraSource(v)}>
                              <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="browser">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32">ESP32-CAM Externa (IP Local)</SelectItem>
                                <SelectItem value="url">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalLoginCameraSource !== 'browser' ? (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Endereço da Câmera de Login</Label>
                                <Input 
                                  value={terminalLoginCameraUrl} 
                                  onChange={(e) => setTerminalLoginCameraUrl(e.target.value)} 
                                  placeholder={terminalLoginCameraSource === 'esp32' ? "Ex: 192.168.1.5" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10"
                                />
                              </div>

                              {terminalLoginCameraSource === 'esp32' && (
                                <div className="space-y-4">
                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      Taxa de Quadros (Qualidade) do Login
                                    </Label>
                                    <Select value={terminalLoginCameraFramerate} onValueChange={(v: any) => setTerminalLoginCameraFramerate(v)}>
                                      <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="fluid">⚡ Alta Velocidade / QR (CIF)</SelectItem>
                                        <SelectItem value="balanced">⚖️ Equilibrado (VGA)</SelectItem>
                                        <SelectItem value="high_res">📸 Alta Resolução (SVGA)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      Luz de Flash LED (Login)
                                    </Label>
                                    <Select 
                                      value={terminalLoginCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalLoginCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="off">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on">💡 Ativado (Flash Aceso na Leitura)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dispositivo de Captura</Label>
                              <Select value={preferredCamera} onValueChange={setPreferredCamera}>
                                <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* BLOCO D: CÂMERA DO SCANNER (PESAGEM E IA) */}
                        <div className="space-y-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">4. Câmera de Scanner (Identificação de Resíduos)</h4>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fonte de Vídeo (Scanner)</Label>
                            <Select value={terminalScanningCameraSource} onValueChange={(v: any) => setTerminalScanningCameraSource(v)}>
                              <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="browser">Webcam Integrada do Totem</SelectItem>
                                <SelectItem value="esp32">ESP32-CAM Externa (IP Local)</SelectItem>
                                <SelectItem value="url">Fluxo de Vídeo Externo (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {terminalScanningCameraSource === 'browser' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dispositivo de Captura (Scanner)</Label>
                              <Select value={terminalScanningCameraDevice} onValueChange={setTerminalScanningCameraDevice}>
                                <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Automático (Padrão do Navegador)</SelectItem>
                                  {sortedVideoDevices.map(device => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                      {device.label || `Câmera ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Endereço da Câmera de Scanner</Label>
                                <Input 
                                  value={terminalScanningCameraUrl} 
                                  onChange={(e) => setTerminalScanningCameraUrl(e.target.value)} 
                                  placeholder={terminalScanningCameraSource === 'esp32' ? "Ex: 192.168.1.6" : "Ex: http://ip:port/stream"}
                                  className="font-mono text-xs h-10"
                                />
                              </div>

                              {terminalScanningCameraSource === 'esp32' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      Taxa de Quadros (Framerate) do Scanner
                                    </Label>
                                    <Select value={terminalScannerFramerate} onValueChange={(v: any) => setTerminalScannerFramerate(v)}>
                                      <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="fluid">⚡ Alta Fluidez (~30 FPS) - VGA</SelectItem>
                                        <SelectItem value="balanced">⚖️ Equilibrado (~18 FPS) - SVGA</SelectItem>
                                        <SelectItem value="high_res">📸 Alta Resolução (~12 FPS) - HD</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      Luz de Flash LED (Scanner)
                                    </Label>
                                    <Select 
                                      value={terminalScanningCameraFlash ? "on" : "off"} 
                                      onValueChange={(v) => setTerminalScanningCameraFlash(v === "on")}
                                    >
                                      <SelectTrigger className="bg-white font-bold h-10"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="off">🌑 Desativado (Flash Apagado)</SelectItem>
                                        <SelectItem value="on">💡 Ativado (Iluminar Resíduo ao Escanear)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between items-center border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (confirm("Deseja realmente remover este totem permanentemente do sistema?")) {
                              deleteTerminal(selectedTerminalId);
                              toast({ title: "Totem Removido", description: "O terminal foi removido do banco de dados." });
                              setSelectedTerminalId('');
                            }
                          }}
                          className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 uppercase text-[10px] font-black tracking-widest h-12"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir Totem do Sistema
                        </Button>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedTerminalId('')}
                            className="w-full sm:w-auto h-12 uppercase text-[10px] font-black tracking-widest"
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
                            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
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
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
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
                            className="border-2 border-slate-100 hover:border-amber-500/40 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between gap-4 cursor-pointer group"
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
                                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                  <Cpu className="h-4 w-4" />
                                </div>
                                <Badge variant={isOnline ? 'default' : 'secondary'} className={`uppercase text-[8px] font-black tracking-widest ${isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  {isOnline ? 'Ativo / Online' : 'Inativo'}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight line-clamp-1">{terminal.location}</h4>
                                <div className="flex flex-col gap-0.5 font-mono text-[9px] text-slate-400">
                                  <span>ID: {terminal.id}</span>
                                  <span>HW: {terminal.hardwareId.slice(0, 15)}...</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider text-slate-500">
                              <div className="px-2 py-1 bg-slate-50 rounded border">
                                Login: {terminal.settings?.loginCameraSource === 'esp32' ? 'ESP32-CAM' : 'Local'}
                              </div>
                              <div className="px-2 py-1 bg-slate-50 rounded border">
                                Scanner: {terminal.settings?.scanningCameraSource === 'esp32' ? `ESP32 (${terminal.settings?.scannerFramerate === 'fluid' ? '30 FPS' : terminal.settings?.scannerFramerate === 'balanced' ? '18 FPS' : '12 FPS'})` : 'Local'}
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-9 uppercase text-[9px] font-black tracking-wider border-slate-200 group-hover:border-amber-500/40 text-slate-700 bg-slate-50/50 hover:bg-slate-100"
                            >
                              Configurar Parâmetros
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                      <Cpu className="h-10 w-10 text-slate-300 mx-auto" />
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
