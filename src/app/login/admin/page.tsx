'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, ShieldCheck, QrCode, Cpu, Loader2, Volume2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { playBeep, cn } from '@/lib/utils';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, systemSettings, users, getLockoutStatus, hardwareId, terminals } = useEcosystem();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password'>('username');
  const initialTab = systemSettings.adminLoginMethod === 'qr' ? 'qr' : 
                     systemSettings.adminLoginMethod === 'rfid' ? 'rfid' : 'manual';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  
  const currentTerminal = terminals.find(t => t.hardwareId === hardwareId);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Sanitiza inputs básicos
  const sanitize = (val: string) => val.replace(/[<>]/g, '').trim();


  const handleManualLogin = async () => {
    const cleanUser = sanitize(username);
    const cleanPass = sanitize(password);
    
    if (!cleanUser || !cleanPass) {
        toast({ variant: 'destructive', title: 'Erro de entrada', description: 'Caracteres inválidos detectados.' });
        return;
    }

    setIsProcessing(true);
    
    const lockout = getLockoutStatus(cleanUser);
    if (lockout.isLocked) {
      setLockoutSecs(lockout.remainingSeconds);
      setIsProcessing(false);
      toast({ variant: 'destructive', title: 'Acesso Bloqueado', description: `Muitas tentativas falhas. Aguarde ${lockout.remainingSeconds}s.` });
      return;
    }

    const success = await login(cleanUser, cleanPass);
    
    if (success) {
       playBeep('success');
       // Busca o usuário logado para saber o papel
       const user = users.find(u => u.ra === cleanUser || u.email?.toLowerCase() === cleanUser.toLowerCase());
       
       if (user?.role === 'super_admin') {
         toast({ title: `Bem-vindo, ${user.name}!`, description: 'Acesso total à rede concedido.' });
         router.push('/super-admin');
       } else {
         toast({ title: `Bem-vindo, ${user?.name || 'Gestor'}!`, description: 'Painel administrativo liberado.' });
         router.push('/admin/dashboard');
       }
    } else {
      playBeep('error');
      const user = users.find(u => u.ra === cleanUser || u.email?.toLowerCase() === cleanUser.toLowerCase());
      if (user && user.status === 'inactive') {
          toast({ variant: 'destructive', title: 'Acesso Restrito', description: 'Seu usuário está inativo no sistema.' });
      } else {
        const updatedLockout = getLockoutStatus(cleanUser);
        if (updatedLockout.isLocked) {
          setLockoutSecs(updatedLockout.remainingSeconds);
          toast({ variant: 'destructive', title: 'Segurança: Bloqueado', description: 'Múltiplas falhas detectadas. Seu acesso foi suspenso temporariamente.' });
        } else {
          toast({ variant: 'destructive', title: 'Falha no login', description: 'RA/Email ou senha incorretos.' });
        }
      }
       setPassword('');
       setIsProcessing(false);
    }
  };

  const handleHybridLogin = useCallback((targetId: string) => {
    if (!targetId.trim() || isProcessing) return;
    setIsProcessing(true);
    
    // Procura qualquer usuário (gestor ou super_admin) que tenha esse RA ou RFID
    const user = users.find(u => 
      (u.ra === targetId.trim() || (u as any).rfid === targetId.trim()) && 
      (u.role === 'admin' || u.role === 'super_admin')
    );
    
    if (user) {
      login(user.ra!);
      playBeep('success');
      toast({ title: `Bem-vindo, ${user.name}!`, description: 'Acesso concedido via hardware.' });
      
      if (user.role === 'super_admin') {
        router.push('/super-admin');
      } else {
        router.push('/admin/dashboard');
      }
    } else {
      playBeep('error');
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Este cartão/QR não tem permissões administrativas.' });
      setIsProcessing(false);
    }
  }, [login, router, toast, isProcessing, users]);

  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => setLockoutSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  useEffect(() => {
    // Só inicia o polling se estiver na aba de RFID ou na de QR (quando usar hardware externo)
    const shouldPoll = activeTab === 'rfid' || (activeTab === 'qr' && systemSettings.loginCameraSource !== 'browser');
    
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const pollId = currentTerminal?.id || hardwareId;
        const res = await fetch(`/api/hardware/input?terminalId=${pollId}`);
        const data = await res.json();
        if (data.ra) handleHybridLogin(data.ra);
      } catch (e) {
        console.error("[AUTH] Erro ao buscar dados de hardware:", e);
      }
    };

    const interval = setInterval(pollHardware, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [activeTab, hardwareId, currentTerminal?.id, handleHybridLogin]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                        Área do Gestor
                    </CardTitle>
                    <CardDescription>Identificação administrativa</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={cn(
                            "grid w-full mb-6",
                            systemSettings.adminLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
                        )}>
                            {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'manual') && (
                                <TabsTrigger value="manual" className="gap-2"><Lock className="h-4 w-4" /> Senha</TabsTrigger>
                            )}
                            {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'qr') && (
                                <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4" /> QR</TabsTrigger>
                            )}
                            {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'rfid') && (
                                <TabsTrigger value="rfid" className="gap-2"><Cpu className="h-4 w-4" /> RFID</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4">
                            {lockoutSecs > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-destructive text-sm text-center font-medium animate-pulse">
                                    <Lock className="h-4 w-4 inline mr-2" /> 
                                    Acesso suspenso por {lockoutSecs}s
                                </div>
                            )}
                            
                            <form onSubmit={(e) => { e.preventDefault(); handleManualLogin(); }} className="space-y-4">
                                <div className='space-y-1'>
                                    <Label htmlFor="username">Login (E-mail ou RA)</Label>
                                    <Input 
                                        id="username" 
                                        ref={usernameRef} 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        onFocus={() => setActiveInput('username')} 
                                        placeholder="admin@escola.com" 
                                        inputMode={showKeyboard ? 'none' : 'email'} 
                                        disabled={lockoutSecs > 0}
                                        autoComplete="username"
                                    />
                                </div>
                                <div className='space-y-1'>
                                    <Label htmlFor="password">Senha</Label>
                                    <Input 
                                        id="password" 
                                        ref={passwordRef} 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        onFocus={() => setActiveInput('password')} 
                                        placeholder="••••••••" 
                                        inputMode={showKeyboard ? 'none' : 'text'} 
                                        disabled={lockoutSecs > 0}
                                        autoComplete="current-password"
                                    />
                                </div>
                                
                                {showKeyboard && !lockoutSecs && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <VirtualKeyboard 
                                            layout="alphanumeric" 
                                            onInput={(key) => activeInput === 'username' ? setUsername(p => p + key) : setPassword(p => p + key)} 
                                            onBackspace={() => activeInput === 'username' ? setUsername(p => p.slice(0, -1)) : setPassword(p => p.slice(0, -1))} 
                                            onEnter={handleManualLogin} 
                                        />
                                    </div>
                                )}
                                
                                <Button type="submit" className="w-full h-12 text-lg" disabled={!username.trim() || !password.trim() || lockoutSecs > 0}>
                                    {lockoutSecs > 0 ? `Bloqueado (${lockoutSecs}s)` : 'Entrar'} <ArrowRight className="ml-2" />
                                </Button>
                            </form>

                            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowKeyboard(p => !p)} disabled={lockoutSecs > 0}>
                                <Keyboard className="mr-2" /> 
                                {showKeyboard ? 'Usar Teclado Nativo' : 'Usar Teclado Virtual'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="qr" className="space-y-4">
                            <div className="space-y-4">
                                <QRScanner onScan={handleHybridLogin} />
                                <p className="text-[10px] text-center text-rose-600 font-black uppercase tracking-[0.2em] bg-rose-50 py-2 rounded-lg">
                                    Acesso Administrativo via QR
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="rfid" className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg space-y-6 bg-primary/5">
                                <Cpu className="h-16 w-16 text-primary animate-pulse" />
                                <p className="text-xl font-bold">Aproxime seu Cartão</p>
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        <Volume2 className="h-3 w-3" /> Feedback Sonoro Ativo
                    </div>
                </CardFooter>
            </Card>
        </main>
        <footer className="p-4 text-center text-xs text-muted-foreground space-y-2">
            <Link href="/" className="hover:text-primary underline">Voltar</Link>
            <p>Não é uma escola parceira? <Link href="/register-school" className="text-primary font-bold hover:underline">Solicite acesso aqui</Link></p>
            <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
        </footer>
    </div>
  );
}
