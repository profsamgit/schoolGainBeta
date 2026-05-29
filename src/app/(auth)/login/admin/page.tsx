'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Keyboard, ShieldCheck, QrCode, Cpu, Loader2, Volume2, Lock, Sparkles, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { EcosystemService } from '@/lib/ecosystem.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { playBeep, cn } from '@/lib/utils';

const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });
import { Html5Qrcode } from 'html5-qrcode';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, systemSettings, users, getLockoutStatus, hardwareId, terminals } = useEcosystem();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<'username' | 'password'>('username');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [scannerKey, setScannerKey] = useState(0);
  
  const currentTerminal = terminals.find(t => t.hardwareId === hardwareId);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isTotem = !!currentTerminal && currentTerminal.status === 'active';
  
  const allowedMethod = isTotem
    ? (currentTerminal?.settings?.loginMethod || systemSettings.adminLoginMethod || 'all')
    : (systemSettings.adminLoginMethod || 'all');

  const showManualTab = allowedMethod === 'all' || 
                         allowedMethod === 'manual' || 
                         allowedMethod === 'manual_qr' || 
                         allowedMethod === 'manual_rfid' || 
                         (!isTotem && (allowedMethod === 'rfid' || allowedMethod === 'qr_rfid'));

  const showQrTab = allowedMethod === 'all' || 
                     allowedMethod === 'qr' || 
                     allowedMethod === 'manual_qr' || 
                     allowedMethod === 'qr_rfid';

  const showRfidTab = isTotem && (
    allowedMethod === 'all' || 
    allowedMethod === 'rfid' || 
    allowedMethod === 'manual_rfid' || 
    allowedMethod === 'qr_rfid'
  );

  const visibleTabsCount = (showManualTab ? 1 : 0) + (showQrTab ? 1 : 0) + (showRfidTab ? 1 : 0);

  const activeLoginCameraSource = isTotem
    ? (currentTerminal?.settings?.loginCameraSource || systemSettings.adminCaptureSource || 'browser')
    : (systemSettings.adminCaptureSource || 'browser');
  const activeLoginCameraUrl = isTotem
    ? (currentTerminal?.settings?.loginCameraUrl || systemSettings.adminCaptureUrl || '')
    : (systemSettings.adminCaptureUrl || '');

  const getCameraUrl = (src: string, url: string) => {
    if (!url) return '';
    if (src === 'esp32' || src === 'esp32_https') {
      let cleanUrl = url.split('?')[0].replace(/\/stream\/?$/i, '').replace(/^https?:\/\//i, '').trim();
      let base = `http://localhost:9005/stream?target=${cleanUrl}`;
      const flashEnabled = currentTerminal?.settings?.loginCameraFlash === true;
      if (flashEnabled) {
        base = `${base}&flash=on`;
      }
      return base;
    }
    return url;
  };

  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'rfid'>(() => {
    if (allowedMethod === 'rfid' && isTotem) return 'rfid';
    if (allowedMethod === 'qr') return 'qr';
    return 'manual';
  });

  const streamUrl = activeTab !== 'qr' ? '' : getCameraUrl(activeLoginCameraSource, activeLoginCameraUrl);

  const streamImgRef = useRef<HTMLImageElement | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const streamUrlWithRetry = streamUrl
    ? (retryKey > 0 ? (streamUrl.includes('?') ? `${streamUrl}&retry=${retryKey}` : `${streamUrl}?retry=${retryKey}`) : streamUrl)
    : '';

  useEffect(() => {
    if (activeTab === 'rfid' && !showRfidTab) {
      setActiveTab(showQrTab ? 'qr' : 'manual');
    } else if (activeTab === 'qr' && !showQrTab) {
      setActiveTab(showManualTab ? 'manual' : 'rfid');
    } else if (activeTab === 'manual' && !showManualTab) {
      setActiveTab(showQrTab ? 'qr' : 'rfid');
    }
  }, [showRfidTab, showQrTab, showManualTab, activeTab]);

  // Sanitiza inputs básicos
  const sanitize = (val: string) => val.replace(/[<>]/g, '').trim();

  const handleManualLogin = async () => {
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sem Conexão',
        description: 'Não é possível acessar o painel de gestão offline.',
      });
      return;
    }
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

    const success = await login(cleanUser, cleanPass, currentTerminal?.schoolId);
    
    if (success) {
       playBeep('success');
       // Encontra o usuário correspondente de forma precisa, validando também a senha para caso de e-mails duplicados
       const user = await (async () => {
         const candidates = users.filter(u => u.ra === cleanUser || u.email?.toLowerCase() === cleanUser.toLowerCase());
         if (candidates.length <= 1) return candidates[0];
         const hashed = await EcosystemService.hashPassword(cleanPass);
         return candidates.find(u => u.password === hashed || u.password === cleanPass) || candidates[0];
       })();
       
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
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sem Conexão',
        description: 'Não é possível acessar o painel de gestão offline.',
      });
      return;
    }
    if (!targetId.trim() || isProcessing) return;
    setIsProcessing(true);
    
    // Procura qualquer usuário (gestor ou super_admin) que tenha esse RA ou RFID
    const user = users.find(u => 
      (u.ra === targetId.trim() || (u as any).rfid === targetId.trim()) && 
      (u.role === 'admin' || u.role === 'super_admin')
    );
    
    if (user) {
      login(user.ra!, undefined, currentTerminal?.schoolId);
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
  }, [login, router, toast, isProcessing, users, isOnline]);

  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => setLockoutSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  useEffect(() => {
    // Só inicia o polling se estiver na aba de RFID ou na de QR (quando usar hardware externo)
    const shouldPoll = activeTab === 'rfid' || (activeTab === 'qr' && activeLoginCameraSource !== 'browser');
    
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const pollId = currentTerminal?.hardwareId || currentTerminal?.id || hardwareId;
        const res = await fetch(`/api/hardware/input?terminalId=${pollId}`);
        const data = await res.json();
        if (data.ra) handleHybridLogin(data.ra);
      } catch (e) {
        console.error("[AUTENTICAÇÃO] Erro ao consultar hardware:", e);
      }
    };

    const interval = setInterval(pollHardware, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [activeTab, hardwareId, currentTerminal?.id, handleHybridLogin, activeLoginCameraSource]);

  useEffect(() => {
    if (!streamUrlWithRetry || streamError || activeTab !== 'qr') return;

    // Como streams MJPEG contínuos podem não disparar o evento onLoad tradicional,
    // forçamos imageLoaded para true após 1 segundo se o elemento da imagem existir.
    const forceLoadTimer = setTimeout(() => {
      if (streamImgRef.current) {
        setImageLoaded(true);
      }
    }, 1000);

    const timer = setTimeout(() => {
      setImageLoaded((current) => {
        if (!current) {
          setStreamError(true);
        }
        return current;
      });
    }, 3500);

    return () => {
      clearTimeout(forceLoadTimer);
      clearTimeout(timer);
    };
  }, [streamUrlWithRetry, streamError, activeTab]);

  useEffect(() => {
    if (activeLoginCameraSource === 'browser' || !streamUrlWithRetry || activeTab !== 'qr') return;

    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let intervalId: any = null;

    const scannerElementId = 'hidden-qr-scanner-login-admin';
    let hiddenContainer = document.getElementById(scannerElementId);
    if (!hiddenContainer) {
      hiddenContainer = document.createElement('div');
      hiddenContainer.id = scannerElementId;
      hiddenContainer.style.display = 'none';
      document.body.appendChild(hiddenContainer);
    }

    try {
      html5QrCode = new Html5Qrcode(scannerElementId);
    } catch (e) {
      console.error("[QR STREAM] Falha ao instanciar Html5Qrcode:", e);
    }

    const canvas = document.createElement('canvas');
    let isScanningFrame = false;

    const scanFrame = async () => {
      if (!isMounted || !html5QrCode || !streamImgRef.current || isScanningFrame) return;
      const img = streamImgRef.current;
      if (!img.complete || img.naturalWidth === 0) return;

      isScanningFrame = true;
       const targetWidth = 640;
      const scale = targetWidth / img.naturalWidth;
      const targetHeight = img.naturalHeight * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isScanningFrame = false;
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'grayscale(1) contrast(1.4) brightness(0.95)';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      ctx.filter = 'none';

      canvas.toBlob(async (blob) => {
        if (!blob || !isMounted) {
          isScanningFrame = false;
          return;
        }
        try {
          const file = new File([blob], 'qrcode.jpg', { type: 'image/jpeg' });
          const decodedText = await html5QrCode!.scanFile(file, false);
          if (decodedText && isMounted) {
            handleHybridLogin(decodedText);
          }
        } catch (err) {
          // No QR Code found
        } finally {
          isScanningFrame = false;
        }
      }, 'image/jpeg', 0.90);
    };

    intervalId = setInterval(scanFrame, 120);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);

      if (html5QrCode) {
        try {
          html5QrCode.clear();
        } catch (e) {}
      }
      if (hiddenContainer && hiddenContainer.parentNode) {
        hiddenContainer.parentNode.removeChild(hiddenContainer);
      }
    };
  }, [activeLoginCameraSource, streamUrlWithRetry, activeTab, handleHybridLogin]);
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-950 dark:selection:text-indigo-400">
      <style>{`
        @keyframes scan {
          0%, 100% { top: 8%; opacity: 0.5; }
          50% { top: 92%; opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
      
      {/* 🌌 Fundo Cósmico & Brilhos de Luz Ambiente */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Brilho 1: Brilho Índigo */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Brilho 2: Brilho Esmeralda */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Sobreposição sutil de padrão de grade */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md">
        
        {/* 📟 Console Unificado com Efeito Vidro (Glassmorphic) */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Seção do Cabeçalho */}
          <div className="mb-8 text-center flex flex-col items-center">
            
            {/* Logomarca da Escola Parceira */}
            <div className="mb-4 flex items-center justify-center select-none scale-95 hover:scale-100 transition-all duration-500">
              <img 
                src="/brand/logo_apicella_menor.png" 
                alt="Logomarca CETI Frei José Apicella" 
                className="h-14 w-auto object-contain drop-shadow-md dark:brightness-110" 
              />
            </div>

            {/* Distintivo de Ícone Personalizado */}
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-100/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 mb-5 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1.5">
              Área do Gestor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Autenticação administrativa do ecossistema
            </p>
            {!isOnline && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-amber-600 dark:text-amber-400 text-xs text-center font-semibold">
                ⚠️ Sem Conexão: O painel de gestão não está disponível em modo offline.
              </div>
            )}
          </div>

          {/* Abas de Formulário & Navegação */}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'manual' | 'qr' | 'rfid')} className="w-full">
            
            {/* Lista de Abas em Estilo Pílula */}
            <TabsList className={cn(
              "grid w-full mb-6 bg-slate-100/80 dark:bg-slate-950/40 p-1 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl gap-1 h-11",
              visibleTabsCount === 3 ? "grid-cols-3" : visibleTabsCount === 2 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {showManualTab && (
                <TabsTrigger 
                  value="manual" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Lock className="h-4 w-4" /> Senha
                </TabsTrigger>
              )}
              {showQrTab && (
                <TabsTrigger 
                  value="qr" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              )}
              {showRfidTab && (
                <TabsTrigger 
                  value="rfid" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Cpu className="h-4 w-4" /> RFID
                </TabsTrigger>
              )}
            </TabsList>

            {/* ABA: LOGIN MANUAL (E-MAIL/RA + SENHA) */}
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
                    className="h-12 bg-white/80 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl px-4 text-sm"
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
                    className="h-12 bg-white/80 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl px-4 text-sm"
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

            {/* TAB: LOGIN VIA QR CODE */}
            <TabsContent value="qr" className="space-y-4 animate-in fade-in-50 duration-200">
              {activeTab === 'qr' && (
                activeLoginCameraSource === 'browser' ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-200/50 dark:bg-slate-950 aspect-video">
                      {/* Futuristic Corner Scan Scope Brackets */}
                      <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />
                        
                        {/* Sweeping Laser Line */}
                        <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
                      </div>

                      <QRScanner 
                        key={scannerKey}
                        onScan={handleHybridLogin} 
                        deviceId={isTotem ? (currentTerminal?.settings?.scanningCameraDevice || systemSettings.adminCaptureDevice || 'default') : (systemSettings.adminCaptureDevice || 'default')}
                      />
                    </div>
                    <p className="text-[10px] text-center text-indigo-400 font-black uppercase tracking-[0.18em] bg-indigo-500/10 py-3 rounded-xl border border-indigo-500/20 shadow-sm">
                      Acesso Administrativo via QR
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {streamUrlWithRetry ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-200/50 dark:bg-slate-950 flex items-center justify-center">
                        {!streamError ? (
                          <>
                            {/* Corner Brackets for Stream */}
                            <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
                              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
                              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
                              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
                              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />
                              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
                            </div>

                            <img 
                              ref={streamImgRef}
                              src={streamUrlWithRetry} 
                              className="w-full h-full object-cover" 
                              alt="Login ESP32 Camera Stream"
                              crossOrigin="anonymous"
                              onLoad={() => setImageLoaded(true)}
                              onError={() => {
                                setStreamError(true);
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 z-10">
                              <p className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                Login ESP32-CAM Ao Vivo
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-900 p-6 text-center animate-in fade-in duration-300">
                            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400 mb-2">
                              <ArrowRight className="h-6 w-6 animate-pulse" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Sinal de Login Instável</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mt-0.5 mb-3 leading-snug">
                              Não conseguimos conectar com a câmera de login externa.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-white gap-2 font-bold uppercase tracking-wider text-[9px]"
                              onClick={() => {
                                setImageLoaded(false);
                                setStreamError(false);
                                setRetryKey(k => k + 1);
                              }}
                            >
                              <Loader2 className="h-2.5 w-2.5 animate-spin [animation-duration:3s]" />
                              Reconectar
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-slate-200/50 dark:border-slate-850 rounded-2xl bg-slate-100/50 dark:bg-white/5 animate-pulse">
                        <QrCode className="h-16 w-16 text-indigo-400 mb-4" />
                        <div className="text-center space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Câmera Externa Ativa</p>
                          <p className="text-xs text-slate-450">O terminal fará a leitura automática via hardware externo.</p>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-center text-indigo-400 font-black uppercase tracking-[0.18em] bg-indigo-500/10 py-3 rounded-xl border border-indigo-500/20 shadow-sm">
                      Aproxime seu QR da câmera externa
                    </p>
                  </div>
                )
              )}
            </TabsContent>

            {/* ABA: LOGIN VIA RFID */}
            <TabsContent value="rfid" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-col items-center justify-center p-10 border border-slate-200/65 dark:border-white/10 rounded-[2rem] space-y-6 bg-slate-100/60 dark:bg-slate-950/40 shadow-2xl relative overflow-hidden">
                
                {/* 3D Concentric expands ripples RFID */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-1">
                  <div className="absolute w-36 h-36 rounded-full border border-indigo-500/10 animate-[pulse-ring_3s_infinite_linear]" />
                  <div className="absolute w-28 h-28 rounded-full border border-indigo-500/20 animate-[pulse-ring_3s_infinite_linear_1s]" />
                  <div className="absolute w-20 h-20 rounded-full border border-indigo-500/30 animate-[pulse-ring_3s_infinite_linear_2s]" />
                  
                  {/* Glowing center badge */}
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-indigo-400/30 z-10">
                    <Fingerprint className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-2 relative z-10">
                  <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Aproxime seu Cartão</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    O sensor RFID está aguardando sua leitura física para login instantâneo.
                  </p>
                </div>

                <div className="flex gap-2 relative z-10">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </TabsContent>

          </Tabs>

          {/* Indicador de Feedback Sonoro Ativo */}
          <div className="mt-6 flex justify-center border-t border-slate-200/30 dark:border-slate-800/30 pt-5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
              <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Feedback Sonoro Habilitado
            </div>
          </div>

        </div>

        {/* Links Dinâmicos do Rodapé */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <Link href="/login/register-school" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
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
