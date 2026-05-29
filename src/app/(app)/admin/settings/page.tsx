'use client';

import { useState } from 'react';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Cpu, 
  Camera, 
  ShieldCheck, 
  Save, 
  RefreshCcw,
  Smartphone,
  LayoutGrid
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { systemSettings, updateSystemSettings, currentUser } = useEcosystem();
  const { toast } = useToast();
  
  // Estado local para o formulário alinhado com SystemSettings
  const [settings, setSettings] = useState(() => ({
    studentLoginMethod: systemSettings?.studentLoginMethod || 'all',
    adminLoginMethod: systemSettings?.adminLoginMethod || 'all',
    studentCaptureSource: systemSettings?.studentCaptureSource || 'browser',
    adminCaptureSource: systemSettings?.adminCaptureSource || 'browser',
    studentCaptureDevice: systemSettings?.studentCaptureDevice || '',
    adminCaptureDevice: systemSettings?.adminCaptureDevice || '',
    studentCaptureUrl: systemSettings?.studentCaptureUrl || '',
    adminCaptureUrl: systemSettings?.adminCaptureUrl || '',
    studentAreaMaintenance: systemSettings?.studentAreaMaintenance || false,
  }));

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 max-w-md mx-auto">
        <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
          <LayoutGrid className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Acesso Restrito</h2>
          <p className="text-muted-foreground">Esta área é reservada para a gestão técnica do sistema.</p>
        </div>
        <Button asChild size="lg"><Link href="/student/dashboard">Voltar para o Painel</Link></Button>
      </div>
    );
  }

  const handleSave = () => {
    updateSystemSettings(settings);
    toast({
      title: "Configurações Salvas",
      description: "As preferências globais e de hardware foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutGrid className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gestão de Terminais</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configurações de Identificação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Métodos de Identificação</CardTitle>
            </div>
            <CardDescription>
              Defina como os usuários e gestores acessam o ecossistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Login do Aluno</Label>
              <Select 
                value={settings.studentLoginMethod || "all"} 
                onValueChange={(v: any) => setSettings({...settings, studentLoginMethod: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método para alunos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (Manual, QR, RFID)</SelectItem>
                  <SelectItem value="manual">Apenas RA Manual</SelectItem>
                  <SelectItem value="qr">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid">Apenas RFID</SelectItem>
                  <SelectItem value="manual_qr">RA Manual + QR Code</SelectItem>
                  <SelectItem value="manual_rfid">RA Manual + RFID</SelectItem>
                  <SelectItem value="qr_rfid">QR Code + RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Login do Administrador</Label>
              <Select 
                value={settings.adminLoginMethod || "all"} 
                onValueChange={(v: any) => setSettings({...settings, adminLoginMethod: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método para admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (Manual, QR, RFID)</SelectItem>
                  <SelectItem value="manual">Apenas Login Manual</SelectItem>
                  <SelectItem value="qr">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid">Apenas RFID</SelectItem>
                  <SelectItem value="manual_qr">Login Manual + QR Code</SelectItem>
                  <SelectItem value="manual_rfid">Login Manual + RFID</SelectItem>
                  <SelectItem value="qr_rfid">QR Code + RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                id="maintenance-mode"
                type="checkbox"
                checked={settings.studentAreaMaintenance}
                onChange={(e) => setSettings({...settings, studentAreaMaintenance: e.target.checked})}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="maintenance-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Ativar Modo Manutenção na Área do Aluno
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" /> Salvar Preferências
            </Button>
          </CardFooter>
        </Card>

        {/* Configurações de Segurança (Alterar Senha) */}
        <PasswordChangeCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configurações de Hardware (Câmera do Aluno) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>Hardware de Visão (Alunos)</CardTitle>
            </div>
            <CardDescription>
              Configure o comportamento de captura de imagem para os alunos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte da Câmera (Aluno)</Label>
              <Select 
                value={settings.studentCaptureSource || "browser"} 
                onValueChange={(v: any) => setSettings({...settings, studentCaptureSource: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> Webcam do Computador
                    </div>
                  </SelectItem>
                  <SelectItem value="esp32">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> ESP32-CAM HTTP (IP Local)
                    </div>
                  </SelectItem>
                  <SelectItem value="esp32_https">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> ESP32-CAM HTTPS Proxy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(settings.studentCaptureSource === 'esp32' || settings.studentCaptureSource === 'esp32_https') && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <Label>Endereço IP / URL da ESP32 (Aluno)</Label>
                <Input 
                  value={settings.studentCaptureUrl}
                  onChange={(e) => setSettings({...settings, studentCaptureUrl: e.target.value})}
                  placeholder="Ex: 192.168.1.50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>ID do Dispositivo de Captura (Padrão)</Label>
              <Input 
                value={settings.studentCaptureDevice}
                onChange={(e) => setSettings({...settings, studentCaptureDevice: e.target.value})}
                placeholder="Ex: default ou device-id"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Hardware (Câmera do Admin) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>Hardware de Visão (Gestores)</CardTitle>
            </div>
            <CardDescription>
              Configure o comportamento de captura de imagem para os gestores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte da Câmera (Admin)</Label>
              <Select 
                value={settings.adminCaptureSource || "browser"} 
                onValueChange={(v: any) => setSettings({...settings, adminCaptureSource: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> Webcam do Computador
                    </div>
                  </SelectItem>
                  <SelectItem value="esp32">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> ESP32-CAM HTTP (IP Local)
                    </div>
                  </SelectItem>
                  <SelectItem value="esp32_https">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> ESP32-CAM HTTPS Proxy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(settings.adminCaptureSource === 'esp32' || settings.adminCaptureSource === 'esp32_https') && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <Label>Endereço IP / URL da ESP32 (Admin)</Label>
                <Input 
                  value={settings.adminCaptureUrl}
                  onChange={(e) => setSettings({...settings, adminCaptureUrl: e.target.value})}
                  placeholder="Ex: 192.168.1.51"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>ID do Dispositivo de Captura (Padrão)</Label>
              <Input 
                value={settings.adminCaptureDevice}
                onChange={(e) => setSettings({...settings, adminCaptureDevice: e.target.value})}
                placeholder="Ex: default ou device-id"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PasswordChangeCard() {
  const { updateMyPassword } = useEcosystem();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Erro na Confirmação",
        description: "As novas senhas não coincidem.",
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await updateMyPassword(passwords.current, passwords.new);
      if (success) {
        toast({
          title: "Senha Atualizada",
          description: "Sua senha de acesso foi alterada com sucesso.",
        });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "A senha atual está incorreta.",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Segurança da Conta</CardTitle>
        </div>
        <CardDescription>
          Mantenha sua conta de gestor protegida alterando sua senha periodicamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Senha Atual</Label>
          <Input 
            type="password" 
            value={passwords.current}
            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Nova Senha</Label>
          <Input 
            type="password" 
            value={passwords.new}
            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirmar Nova Senha</Label>
          <Input 
            type="password" 
            value={passwords.confirm}
            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full gap-2" 
          onClick={handleChangePassword}
          disabled={loading || !passwords.current || !passwords.new}
        >
          {loading ? "Processando..." : "Atualizar Senha"}
        </Button>
      </CardFooter>
    </Card>
  );
}
