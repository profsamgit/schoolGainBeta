'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Keyboard, 
  UserCheck, 
  QrCode, 
  Cpu, 
  User, 
  Loader2,
  CheckCircle2,
  XCircle,
  Volume2,
  Lock
} from 'lucide-react';
import { playBeep, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { useEcosystem } from '../../(app)/ecosystem-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importação dinâmica do Scanner para evitar erros de SSR (Server Side Rendering)
const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, users, systemSettings, getLockoutStatus } = useEcosystem();

  const [ra, setRa] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const initialTab = systemSettings.studentLoginMethod === 'qr' ? 'qr' : 
                     systemSettings.studentLoginMethod === 'rfid' ? 'rfid' : 'manual';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [scannerKey, setScannerKey] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Sanitiza inputs básicos
  const sanitize = (val: string) => val.replace(/[<>]/g, '').trim();

  /**
   * Função central de Login
   */
  const handleLogin = useCallback(async (targetRa: string) => {
    const cleanRa = sanitize(targetRa);
    if (!cleanRa || isProcessing) return;
    
    // 1. Verifica Lockout
    const lockout = getLockoutStatus(cleanRa);
    if (lockout.isLocked) {
      setLockoutSecs(lockout.remainingSeconds);
      toast({ 
        variant: 'destructive', 
        title: 'Acesso Bloqueado', 
        description: `Muitas tentativas falhas para o RA ${cleanRa}. Aguarde ${lockout.remainingSeconds}s.` 
      });
      return;
    }

    setIsProcessing(true);
    const success = await login(cleanRa);
    
    if (success) {
      playBeep('success');
      const student = users.find((u: any) => u.ra === cleanRa || u.rfid === cleanRa);
      toast({
        title: `Bem-vindo, ${student?.name || 'Agente'}!`,
        description: 'Identificação confirmada. Redirecionando...',
      });
      
      if (student?.role === 'visitor') {
        router.push('/kiosk');
      } else if (student?.role === 'admin' || student?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      playBeep('error');
      
      const updatedLockout = getLockoutStatus(cleanRa);
      if (updatedLockout.isLocked) {
        setLockoutSecs(updatedLockout.remainingSeconds);
        toast({ 
          variant: 'destructive', 
          title: 'Segurança: RA Bloqueado', 
          description: 'Múltiplas falhas detectadas para este RA. Acesso suspenso temporariamente.' 
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Não identificado',
          description: 'O código não corresponde a nenhum aluno cadastrado.',
        });
      }
      
      setIsProcessing(false);
      setRa('');
      // Reinicia o scanner após erro para permitir nova tentativa
      setTimeout(() => setScannerKey(prev => prev + 1), 1000);
    }
  }, [login, users, router, toast, isProcessing, getLockoutStatus]);

  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => setLockoutSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  /**
   * POLING DE HARDWARE:
   * Verifica se há um login vindo do servidor (ESP32 via Wi-Fi)
   */
  useEffect(() => {
    // Só inicia o polling se estiver na aba de RFID ou na de QR (quando usar hardware externo)
    const shouldPoll = activeTab === 'rfid' || (activeTab === 'qr' && systemSettings.loginCameraSource !== 'browser');
    
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const res = await fetch(`/api/hardware/input?terminalId=${systemSettings.terminalId}`);
        const data = await res.json();
        if (data.ra) {
          handleLogin(data.ra);
        }
      } catch (e) {
        console.error("Erro ao consultar hardware:", e);
      }
    };

    const interval = setInterval(pollHardware, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [activeTab, systemSettings.terminalId, handleLogin]);

  /**
   * ESCUTA DE TECLADO (RFID HID):
   * Detecta se um leitor RFID "digitou" algo rápido e deu Enter.
   */
  useEffect(() => {
    if (activeTab !== 'rfid') return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKey = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Se demorar mais de 100ms entre teclas, provavelmente é digitação manual, não hardware
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 4) { // Tamanho mínimo de um RA/UID
          handleLogin(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [activeTab, handleLogin]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                      <UserCheck className="h-7 w-7 text-primary" />
                      Área do Aluno
                  </CardTitle>
                  <CardDescription>
                      Escolha como deseja se identificar hoje.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={cn(
                      "grid w-full mb-6",
                      systemSettings.studentLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
                    )}>
                      {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'manual') && (
                        <TabsTrigger value="manual" className="gap-2">
                          <User className="h-4 w-4" /> RA
                        </TabsTrigger>
                      )}
                      {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'qr') && (
                        <TabsTrigger value="qr" className="gap-2">
                          <QrCode className="h-4 w-4" /> QR
                        </TabsTrigger>
                      )}
                      {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'rfid') && (
                        <TabsTrigger value="rfid" className="gap-2">
                          <Cpu className="h-4 w-4" /> RFID
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {/* LOGIN MANUAL */}
                    <TabsContent value="manual" className="space-y-4">
                      {lockoutSecs > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-destructive text-sm text-center font-medium animate-pulse">
                          <Lock className="h-4 w-4 inline mr-2" /> 
                          Tentativas excedidas. Aguarde {lockoutSecs}s.
                        </div>
                      )}
                      
                      <form onSubmit={(e) => { e.preventDefault(); handleLogin(ra); }} className="space-y-4">
                        <Input
                            ref={inputRef}
                            value={ra}
                            onChange={(e) => setRa(e.target.value.toUpperCase())}
                            placeholder="Seu RA"
                            className="text-center text-xl h-14 uppercase"
                            disabled={lockoutSecs > 0}
                            inputMode={showKeyboard ? 'none' : 'text'}
                            autoComplete="username"
                        />
                        
                        {showKeyboard && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <VirtualKeyboard
                              layout="alphanumeric"
                              onInput={(key) => setRa(p => (p + key).toUpperCase())}
                              onBackspace={() => setRa(p => p.slice(0, -1))}
                              onEnter={() => handleLogin(ra)}
                            />
                          </div>
                        )}
                        
                        <Button type="submit" className="w-full h-12 text-lg" disabled={!ra.trim() || isProcessing || lockoutSecs > 0}>
                          {isProcessing ? <Loader2 className="animate-spin mr-2" /> : (lockoutSecs > 0 ? `Bloqueado (${lockoutSecs}s)` : 'Entrar')} <ArrowRight className="ml-2" />
                        </Button>
                      </form>

                      <Button
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={() => setShowKeyboard((prev) => !prev)}
                      >
                          <Keyboard className="mr-2" />
                          {showKeyboard ? 'Usar Teclado Nativo' : 'Usar Teclado Virtual'}
                      </Button>
                    </TabsContent>

                    {/* LOGIN QR CODE */}
                    <TabsContent value="qr" className="space-y-4">
                      <div className="space-y-4">
                        <QRScanner key={scannerKey} onScan={(text) => handleLogin(text)} />
                        <p className="text-xs text-center text-muted-foreground font-bold uppercase tracking-widest bg-slate-100 py-2 rounded-full">
                          Aponte sua Carteira para a câmera
                        </p>
                      </div>
                    </TabsContent>

                    {/* LOGIN RFID */}
                    <TabsContent value="rfid" className="space-y-4">
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg space-y-6 bg-primary/5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                          <Cpu className="h-16 w-16 text-primary relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xl font-bold">Aproxime seu Cartão</p>
                          <p className="text-sm text-muted-foreground">
                            O sensor RFID está aguardando sua leitura.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-3 h-3 bg-primary rounded-full animate-bounce"></span>
                          <span className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pb-6">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <Volume2 className="h-3 w-3" />
                    Feedback Sonoro Ativo
                  </div>
                </CardFooter>
            </Card>
        </main>
        <footer className="p-4 text-center text-xs text-muted-foreground space-y-2">
            <Link href="/" className="hover:text-primary underline">Voltar para a seleção de perfil</Link>
            <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
        </footer>
    </div>
  );
}
