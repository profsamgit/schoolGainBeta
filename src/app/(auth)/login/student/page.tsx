'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft,
  Keyboard, 
  UserCheck, 
  QrCode, 
  Cpu, 
  User, 
  Loader2,
  Lock,
  Volume2,
  CircleDot
} from 'lucide-react';
import { playBeep, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importação dinâmica do Scanner para evitar erros de SSR (Server Side Rendering)
const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, users, systemSettings, getLockoutStatus, hardwareId, terminals } = useEcosystem();
  const isOnline = useNetworkStatus();

  const [ra, setRa] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const initialTab = systemSettings.studentLoginMethod === 'qr' ? 'qr' : 
                     systemSettings.studentLoginMethod === 'rfid' ? 'rfid' : 'manual';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [scannerKey, setScannerKey] = useState(0);
  
  const currentTerminal = terminals.find(t => t.hardwareId === hardwareId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sanitiza inputs básicos
  const sanitize = (val: string) => val.replace(/[<>]/g, '').trim();

  /**
   * Função central de Login
   */
  const handleLogin = useCallback(async (targetRa: string) => {
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'Sem Conexão',
        description: 'O login no painel de estudantes só é permitido com conexão ativa.',
      });
      return;
    }

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
    const success = await login(cleanRa, undefined, currentTerminal?.schoolId);
    
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
        router.push('/student/dashboard');
      }
    } else {
      const student = users.find((u: any) => u.ra === cleanRa || u.rfid === cleanRa);
      if (student && student.status === 'inactive') {
        toast({ 
          variant: 'destructive', 
          title: 'Acesso Restrito', 
          description: 'Este cadastro está inativo. Procure a secretaria para regularização.' 
        });
      } else {
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
      }
      
      setIsProcessing(false);
      setRa('');
      // Reinicia o scanner após erro para permitir nova tentativa
      setTimeout(() => setScannerKey(prev => prev + 1), 1000);
    }
  }, [login, users, router, toast, isProcessing, getLockoutStatus, isOnline]);

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
        const pollId = currentTerminal?.id || hardwareId;
        const res = await fetch(`/api/hardware/input?terminalId=${pollId}`);
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
  }, [activeTab, hardwareId, currentTerminal?.id, handleLogin]);

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Fundo Cósmico & Brilhos de Luz Ambiente */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Brilho 1: Brilho Esmeralda */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Brilho 2: Brilho Ciano/Azul-petróleo */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl" />
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
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 mb-5 shadow-inner">
              <UserCheck className="w-7 h-7" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1.5">
              Área do Aluno
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Escolha seu método de autenticação hoje
            </p>
            {!isOnline && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-amber-600 dark:text-amber-400 text-xs text-center font-semibold">
                ⚠️ Sem Conexão: O login no painel de estudantes não está disponível em modo offline.
              </div>
            )}
          </div>

          {/* Abas de Formulário & Navegação */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* Lista de Abas em Estilo Pílula */}
            <TabsList className={cn(
              "grid w-full mb-6 bg-slate-100/80 dark:bg-slate-950/40 p-1 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl gap-1 h-11",
              systemSettings.studentLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
            )}>
              {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'manual') && (
                <TabsTrigger 
                  value="manual" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <User className="h-4 w-4" /> RA
                </TabsTrigger>
              )}
              {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'qr') && (
                <TabsTrigger 
                  value="qr" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              )}
              {(systemSettings.studentLoginMethod === 'all' || systemSettings.studentLoginMethod === 'rfid') && (
                <TabsTrigger 
                  value="rfid" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <Cpu className="h-4 w-4" /> RFID
                </TabsTrigger>
              )}
            </TabsList>

            {/* ABA: LOGIN MANUAL */}
            <TabsContent value="manual" className="space-y-5 animate-in fade-in-50 duration-200">
              {lockoutSecs > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-600 dark:text-rose-400 text-xs text-center font-bold flex items-center justify-center gap-2 animate-pulse">
                  <Lock className="h-4 w-4" />
                  Tentativas excedidas. Aguarde {lockoutSecs}s.
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(ra); }} className="space-y-4">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={ra}
                    onChange={(e) => setRa(e.target.value.toUpperCase())}
                    placeholder="Seu RA"
                    className="text-center text-xl h-13 uppercase bg-white/80 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl"
                    disabled={lockoutSecs > 0}
                    inputMode={showKeyboard ? 'none' : 'text'}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                
                {showKeyboard && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-100/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-inner">
                    <VirtualKeyboard
                      layout="alphanumeric"
                      onInput={(key) => setRa(p => (p + key).toUpperCase())}
                      onBackspace={() => setRa(p => p.slice(0, -1))}
                      onEnter={() => handleLogin(ra)}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="group w-full h-12 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300"
                  disabled={!ra.trim() || isProcessing || lockoutSecs > 0}
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
                onClick={() => setShowKeyboard((prev) => !prev)}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                {showKeyboard ? 'Usar Teclado Físico' : 'Usar Teclado Virtual'}
              </Button>
            </TabsContent>

            {/* ABA: LOGIN VIA QR CODE */}
            <TabsContent value="qr" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                  <QRScanner 
                    key={scannerKey} 
                    onScan={(text) => handleLogin(text)} 
                    deviceId={systemSettings.studentCaptureDevice}
                  />
                </div>
                <p className="text-[10px] text-center text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] bg-emerald-100/50 dark:bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-200/20 dark:border-emerald-500/20">
                  Aponte seu QR para a câmera
                </p>
              </div>
            </TabsContent>

            {/* ABA: LOGIN VIA RFID */}
            <TabsContent value="rfid" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-col items-center justify-center p-10 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl space-y-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping"></div>
                  <Cpu className="h-14 w-14 text-emerald-600 dark:text-emerald-400 relative z-10" />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Aproxime seu Cartão</p>
                  <p className="text-xs text-slate-400">
                    O leitor RFID está escaneando novas aproximações
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </TabsContent>

          </Tabs>

          {/* Indicador de Feedback Sonoro Ativo */}
          <div className="mt-6 flex justify-center border-t border-slate-200/30 dark:border-slate-800/30 pt-5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
              <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Feedback Sonoro Habilitado
            </div>
          </div>

        </div>

        {/* Links Dinâmicos do Rodapé */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <Link href="/login/register-student" className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            <CircleDot className="w-3.5 h-3.5 animate-pulse" />
            Não tem cadastro? Solicitar Acesso
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:scale-105 active:scale-95 shadow-sm font-black text-[10px] tracking-widest uppercase transition-all duration-300 backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Voltar</span>
            </Link>
            <span className="hidden sm:inline-block">•</span>
            <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">
              TDS 2B 2026 - CETI Frei José Apicella
            </Link>
          </div>
        </div>

      </main>

    </div>
  );
}
