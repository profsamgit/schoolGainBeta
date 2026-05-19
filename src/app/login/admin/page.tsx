'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Keyboard, ShieldCheck, QrCode, Cpu, Loader2, Volume2, Lock, Sparkles } from 'lucide-react';
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-950 dark:selection:text-indigo-400">
      
      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Indigo glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Blob 2: Emerald glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md">
        
        {/* 📟 Glassmorphic Unified Console Container */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-8 text-center flex flex-col items-center">
            {/* Custom Icon Badge */}
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-100/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 mb-5 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1.5">
              Área do Gestor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Autenticação administrativa do ecossistema
            </p>
          </div>

          {/* Form & Navigation tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* Pill-Style TabsList */}
            <TabsList className={cn(
              "grid w-full mb-6 bg-slate-100/80 dark:bg-slate-950/40 p-1 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl gap-1 h-11",
              systemSettings.adminLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
            )}>
              {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'manual') && (
                <TabsTrigger 
                  value="manual" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Lock className="h-4 w-4" /> Senha
                </TabsTrigger>
              )}
              {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'qr') && (
                <TabsTrigger 
                  value="qr" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              )}
              {(systemSettings.adminLoginMethod === 'all' || systemSettings.adminLoginMethod === 'rfid') && (
                <TabsTrigger 
                  value="rfid" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Cpu className="h-4 w-4" /> RFID
                </TabsTrigger>
              )}
            </TabsList>

            {/* TAB: MANUAL LOGIN */}
            <TabsContent value="manual" className="space-y-5 animate-in fade-in-50 duration-200">
              {lockoutSecs > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-600 dark:text-rose-400 text-xs text-center font-bold flex items-center justify-center gap-2 animate-pulse">
                  <Lock className="h-4 w-4" />
                  Acesso suspenso por {lockoutSecs}s
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleManualLogin(); }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                    Login (E-mail ou RA)
                  </Label>
                  <Input 
                    id="username" 
                    ref={usernameRef} 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    onFocus={() => setActiveInput('username')} 
                    placeholder="admin@escola.com" 
                    className="h-12 bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl px-4 text-sm"
                    inputMode={showKeyboard ? 'none' : 'email'} 
                    disabled={lockoutSecs > 0}
                    autoComplete="username"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                    Senha
                  </Label>
                  <Input 
                    id="password" 
                    ref={passwordRef} 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setActiveInput('password')} 
                    placeholder="••••••••" 
                    className="h-12 bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl px-4 text-sm"
                    inputMode={showKeyboard ? 'none' : 'text'} 
                    disabled={lockoutSecs > 0}
                    autoComplete="current-password"
                  />
                </div>
                
                 {showKeyboard && !lockoutSecs && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-100/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-inner">
                    <VirtualKeyboard 
                      layout="alphanumeric" 
                      onInput={(key) => activeInput === 'username' ? setUsername(p => p + key) : setPassword(p => p + key)} 
                      onBackspace={() => activeInput === 'username' ? setUsername(p => p.slice(0, -1)) : setPassword(p => p.slice(0, -1))} 
                      onEnter={handleManualLogin} 
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="group w-full h-12 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300"
                  disabled={!username.trim() || !password.trim() || lockoutSecs > 0}
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : lockoutSecs > 0 ? (
                    `Bloqueado (${lockoutSecs}s)`
                  ) : (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </form>

              <Button 
                variant="ghost" 
                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold"
                onClick={() => setShowKeyboard(p => !p)} 
                disabled={lockoutSecs > 0}
              >
                <Keyboard className="mr-2 h-4 w-4" /> 
                {showKeyboard ? 'Usar Teclado Físico' : 'Usar Teclado Virtual'}
              </Button>
            </TabsContent>

            {/* TAB: QR CODE LOGIN */}
            <TabsContent value="qr" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                  <QRScanner 
                    onScan={handleHybridLogin} 
                    deviceId={systemSettings.adminCaptureDevice}
                  />
                </div>
                <p className="text-[10px] text-center text-rose-600 dark:text-rose-400 font-black uppercase tracking-[0.15em] bg-rose-500/10 dark:bg-rose-500/10 py-2.5 rounded-xl border border-rose-500/20 dark:border-rose-500/20">
                  Acesso Administrativo via QR
                </p>
              </div>
            </TabsContent>

            {/* TAB: RFID LOGIN */}
            <TabsContent value="rfid" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-col items-center justify-center p-10 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl space-y-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
                  <Cpu className="h-14 w-14 text-indigo-600 dark:text-indigo-400 relative z-10" />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Aproxime seu Cartão</p>
                  <p className="text-xs text-slate-400">
                    O leitor RFID está escaneando aproximações administrativas
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </TabsContent>

          </Tabs>

          {/* Sonorous Active Indicator */}
          <div className="mt-6 flex justify-center border-t border-slate-200/30 dark:border-slate-800/30 pt-5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
              <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Feedback Sonoro Habilitado
            </div>
          </div>

        </div>

        {/* Dynamic Footer links */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <Link href="/register-school" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Cadastrar nova Escola Parceira
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 hover:scale-105 active:scale-95 shadow-sm font-black text-[10px] tracking-widest uppercase transition-all duration-300 backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Voltar</span>
            </Link>
            <span className="hidden sm:inline-block">•</span>
            <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
              TDS 2B 2026 - CETI Frei José Apicella
            </Link>
          </div>
        </div>

      </main>

    </div>
  );
}
