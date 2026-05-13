'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, ShieldCheck, Monitor, ShieldAlert, Settings2, Trash2 
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { SystemSettings, Terminal } from '@/lib/types';

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
  toast
}: InfraSectionProps) {
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [terminalLocation, setTerminalLocation] = useState('');
  const [preferredCamera, setPreferredCamera] = useState('default');
  const [terminalLoginMethod, setTerminalLoginMethod] = useState<'manual' | 'qr' | 'rfid' | 'all'>('all');
  const [terminalCameraSource, setTerminalCameraSource] = useState<'browser' | 'esp32' | 'url'>('browser');
  const [terminalCameraUrl, setTerminalCameraUrl] = useState('');

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

      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 uppercase tracking-tighter font-black text-sm"><Monitor className="h-5 w-5 text-primary" /> Gestão de Totens</CardTitle>
              <CardDescription>Gerencie terminais físicos e solicitações de acesso da sua unidade.</CardDescription>
            </div>
            <Badge variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Rede Conectada
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SOLICITAÇÕES PENDENTES */}
            {filteredTerminalsForAdmin.filter(t => t.status === 'pending').length > 0 && (
               <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                     <ShieldAlert className="h-4 w-4" /> Solicitações Pendentes
                  </h3>
                  <div className="grid gap-4">
                    {filteredTerminalsForAdmin.filter(t => t.status === 'pending').map(terminal => (
                       <div key={terminal.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Monitor className="h-5 w-5" />
                             </div>
                             <div>
                                <p className="font-bold text-amber-900 leading-none mb-1">{terminal.location}</p>
                                <div className="flex flex-col gap-0.5">
                                   <p className="text-[10px] font-black text-amber-800 uppercase">ID do Terminal: {terminal.id}</p>
                                   <p className="text-[9px] font-mono text-amber-600/70">Hardware: {terminal.hardwareId}</p>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => deleteTerminal(terminal.id)} className="bg-white text-red-600 border-red-200">Recusar</Button>
                             <Button size="sm" onClick={() => approveTerminal(terminal)} className="bg-amber-600 hover:bg-amber-700">Autorizar Acesso</Button>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            )}

            {/* TABELA DE TERMINAIS ATIVOS */}
            <div className="space-y-4">
              <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider">Localização</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider">ID do Terminal</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                      <TableHead className="text-right font-black uppercase text-[10px] tracking-wider">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerminalsForAdmin.filter(t => t.status !== 'pending').length > 0 ? filteredTerminalsForAdmin.filter(t => t.status !== 'pending').map((terminal) => (
                      <TableRow key={terminal.id}>
                        <TableCell className="font-bold text-slate-900">{terminal.location}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-black text-primary">{terminal.id}</span>
                            <span className="text-[9px] text-slate-400 font-medium">HW: {terminal.hardwareId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={terminal.status === 'active' ? 'default' : 'secondary'} className={`uppercase text-[9px] font-black tracking-widest ${terminal.status === 'active' ? 'bg-emerald-500' : ''}`}>
                            {terminal.status === 'active' ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                            {terminal.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[9px] tracking-widest gap-1 h-8"
                                onClick={() => approveTerminal(terminal)}
                              >
                                <ShieldCheck className="h-3 w-3" /> Ativar
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => {
                               setEditingTerminal(terminal);
                               setTerminalLocation(terminal.location);
                               setPreferredCamera(terminal.settings?.preferredCamera || 'default');
                               setTerminalLoginMethod(terminal.settings?.loginMethod || 'all');
                               setTerminalCameraSource(terminal.settings?.loginCameraSource || 'browser');
                               setTerminalCameraUrl(terminal.settings?.cameraUrl || '');
                               setIsTerminalDialogOpen(true);
                            }} className="text-amber-600 h-8 w-8 p-0">
                               <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteTerminal(terminal.id)} className="text-red-600 h-8 w-8 p-0">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-xs uppercase tracking-widest">
                           Nenhum terminal cadastrado nesta unidade.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* DIALOG DE CONFIGURAÇÃO DE TERMINAL */}
      <Dialog 
        open={isTerminalDialogOpen} 
        onOpenChange={(open) => {
          if (!open && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          setIsTerminalDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Configurar Terminal</DialogTitle>
            <DialogDescription>Ajuste como este totem físico deve se comportar na unidade.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Identificação */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localização / Nome do Totem</Label>
              <Input 
                value={terminalLocation} 
                onChange={(e) => setTerminalLocation(e.target.value)} 
                placeholder="Ex: Entrada Principal, Biblioteca..."
                className="font-bold h-11"
              />
            </div>

            {/* Segurança */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Método de Autenticação</Label>
              <Select value={terminalLoginMethod} onValueChange={(v: any) => setTerminalLoginMethod(v)}>
                <SelectTrigger className="bg-white font-bold h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo (Senha, QR e RFID)</SelectItem>
                  <SelectItem value="manual">Apenas Senha</SelectItem>
                  <SelectItem value="qr">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid">Apenas RFID (Cartão)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hardware */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fonte de Captura (Vídeo)</Label>
                <Select value={terminalCameraSource} onValueChange={(v: any) => setTerminalCameraSource(v)}>
                  <SelectTrigger className="bg-white font-bold h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser">Câmera USB / Integrada</SelectItem>
                    <SelectItem value="esp32">ESP32-CAM (Rede Local)</SelectItem>
                    <SelectItem value="url">Stream Externo (IP/URL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {terminalCameraSource === 'browser' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dispositivo de Captura</Label>
                  <Select 
                    key={`terminal-cam-${videoDevices.length}`}
                    value={preferredCamera} 
                    onValueChange={setPreferredCamera}
                  >
                    <SelectTrigger className="bg-white font-bold h-11">
                      <SelectValue placeholder="Selecione a câmera..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Automático (Padrão do Sistema)</SelectItem>
                      {sortedVideoDevices.map(device => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Câmera ${device.deviceId.slice(0, 5)}...`}
                        </SelectItem>
                      ))}
                      {videoDevices.length === 0 && <SelectItem value="none" disabled>Nenhuma câmera detectada</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {terminalCameraSource === 'esp32' ? 'IP da ESP32-CAM' : 'URL do Stream'}
                  </Label>
                  <Input 
                    value={terminalCameraUrl} 
                    onChange={(e) => setTerminalCameraUrl(e.target.value)} 
                    placeholder={terminalCameraSource === 'esp32' ? "Ex: 192.168.1.50" : "Ex: http://stream.url/video.mjpg"}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-[10px] font-mono text-slate-500 flex justify-between">
              <span>ID: {editingTerminal?.id}</span>
              <span>HW: {editingTerminal?.hardwareId}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTerminalDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (editingTerminal) {
                updateTerminalSettings(editingTerminal.id, { 
                  location: terminalLocation.toUpperCase().trim(),
                  settings: { 
                    ...editingTerminal.settings, 
                    preferredCamera,
                    loginMethod: terminalLoginMethod,
                    loginCameraSource: terminalCameraSource,
                    cameraUrl: terminalCameraUrl
                  }
                });
                toast({ title: "Configurações Salvas", description: "O terminal será atualizado no próximo ciclo de sincronização." });
                setIsTerminalDialogOpen(false);
              }
            }} className="bg-amber-600 hover:bg-amber-700">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
