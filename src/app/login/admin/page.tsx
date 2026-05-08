'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Keyboard, ShieldCheck, QrCode, Cpu, User, Loader2, Volume2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { ADMIN_MOCK } from '@/lib/data';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, systemSettings, users } = useEcosystem();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password'>('username');
  const [activeTab, setActiveTab] = useState('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const playBeep = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const handleManualLogin = async () => {
    setIsProcessing(true);
    const success = await login(username.trim(), password.trim());
    
    if (success) {
       playBeep('success');
       // Busca o usuário logado para saber o papel
       const user = users.find(u => u.ra === username || u.email?.toLowerCase() === username.toLowerCase());
       
       if (user?.role === 'super_admin') {
         toast({ title: `Bem-vindo, ${user.name}!`, description: 'Acesso total à rede concedido.' });
         router.push('/super-admin');
       } else {
         toast({ title: `Bem-vindo, ${user?.name || 'Gestor'}!`, description: 'Painel administrativo liberado.' });
         router.push('/admin');
       }
    } else {
       playBeep('error');
       toast({ variant: 'destructive', title: 'Falha no login', description: 'RA/Email ou senha incorretos.' });
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
        router.push('/admin');
      }
    } else {
      playBeep('error');
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Este cartão/QR não tem permissões administrativas.' });
      setIsProcessing(false);
    }
  }, [login, router, toast, isProcessing, users]);

  useEffect(() => {
    // Só inicia o polling se estiver na aba de RFID ou na de QR (quando usar hardware externo)
    const shouldPoll = activeTab === 'rfid' || (activeTab === 'qr' && systemSettings.loginCameraSource !== 'browser');
    
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const res = await fetch(`/api/hardware/input?terminalId=${systemSettings.terminalId}`);
        const data = await res.json();
        if (data.ra) handleHybridLogin(data.ra);
      } catch (e) {
        console.error("[AUTH] Erro ao buscar dados de hardware:", e);
      }
    };

    const interval = setInterval(pollHardware, 2000);
    return () => {
      clearInterval(interval);
      console.log("[AUTH] Polling de hardware desativado.");
    };
  }, [activeTab, systemSettings.terminalId, systemSettings.loginCameraSource, handleHybridLogin]);

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
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="manual" className="gap-2"><Lock className="h-4 w-4" /> Senha</TabsTrigger>
                            <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4" /> QR</TabsTrigger>
                            <TabsTrigger value="rfid" className="gap-2"><Cpu className="h-4 w-4" /> RFID</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4">
                            <div className='space-y-1'>
                                <Label htmlFor="username">Login (E-mail)</Label>
                                <Input id="username" ref={usernameRef} value={username} onChange={(e) => setUsername(e.target.value)} onFocus={() => setActiveInput('username')} placeholder="admin@escola.com" inputMode={showKeyboard ? 'none' : 'email'} />
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" ref={passwordRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setActiveInput('password')} onKeyDown={(e) => e.key === 'Enter' && handleManualLogin()} placeholder="••••••••" inputMode={showKeyboard ? 'none' : 'text'} />
                            </div>
                            {showKeyboard && (
                                <VirtualKeyboard layout="alphanumeric" onInput={(key) => activeInput === 'username' ? setUsername(p => p + key) : setPassword(p => p + key)} onBackspace={() => activeInput === 'username' ? setUsername(p => p.slice(0, -1)) : setPassword(p => p.slice(0, -1))} onEnter={handleManualLogin} />
                            )}
                            <Button className="w-full" size="lg" onClick={handleManualLogin} disabled={!username.trim() || !password.trim()}>Entrar <ArrowRight className="ml-2" /></Button>
                            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowKeyboard(p => !p)}><Keyboard className="mr-2" /> {showKeyboard ? 'Esconder' : 'Mostrar'} Teclado</Button>
                        </TabsContent>

                        <TabsContent value="qr" className="space-y-4">
                            {systemSettings.loginCameraSource === 'browser' ? (
                                <div className="space-y-4"><QRScanner onScan={handleHybridLogin} /><p className="text-xs text-center text-muted-foreground">Aponte o QR Code do gestor para a câmera.</p></div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
                                    <Cpu className="h-12 w-12 text-primary animate-pulse" />
                                    <p className="font-bold">Aguardando ESP32-CAM</p>
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
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
            <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
        </footer>
    </div>
  );
}
