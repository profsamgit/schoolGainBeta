'use client';

import { useState } from 'react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
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
  
  // Estado local para o formulário
  const [settings, setSettings] = useState(systemSettings || {
    loginMethod: 'all',
    cameraSource: 'browser',
    terminalId: 'TERM-01'
  });

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
        <Button asChild size="lg"><Link href="/dashboard">Voltar para o Painel</Link></Button>
      </div>
    );
  }

  const handleSave = () => {
    updateSystemSettings(settings);
    toast({
      title: "Configurações Salvas",
      description: "As preferências de hardware foram atualizadas com sucesso.",
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
              <CardTitle>Identificação do Aluno</CardTitle>
            </div>
            <CardDescription>
              Defina como os alunos poderão acessar este terminal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Login</Label>
              <Select 
                value={settings.loginMethod} 
                onValueChange={(v: any) => setSettings({...settings, loginMethod: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (Manual, QR, RFID)</SelectItem>
                  <SelectItem value="manual">Apenas RA Manual</SelectItem>
                  <SelectItem value="qr">Apenas QR Code</SelectItem>
                  <SelectItem value="rfid">Apenas RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ID do Terminal (Nome na Rede)</Label>
              <div className="flex gap-2">
                <Input 
                  value={settings.terminalId}
                  onChange={(e) => setSettings({...settings, terminalId: e.target.value})}
                  placeholder="Ex: TERM-BIBLIOTECA"
                />
                <Button variant="outline" size="icon" title="Gerar novo ID">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                O hardware (ESP32) deve usar este ID para enviar dados.
              </p>
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
        {/* Configurações de Hardware (Câmera) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <CardTitle>Hardware de Visão</CardTitle>
            </div>
            <CardDescription>
              Configure a origem da captura de imagem para QR-Code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte da Câmera</Label>
              <Select 
                value={settings.cameraSource} 
                onValueChange={(v: any) => setSettings({...settings, cameraSource: v})}
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
                      <Cpu className="h-4 w-4" /> ESP32-CAM (Externo)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.cameraSource === 'esp32' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <strong>Nota:</strong> Para usar o ESP32-CAM, certifique-se de que ele está enviando o texto do RA para a rota <code>/api/hardware/input</code> com o Terminal ID correto.
                </p>
              </div>
            )}
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
