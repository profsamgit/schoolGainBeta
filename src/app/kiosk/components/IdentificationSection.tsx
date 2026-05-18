'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { School } from '@/lib/types';
import { 
  Recycle, 
  User, 
  QrCode, 
  Cpu, 
  Lock, 
  Keyboard, 
  ArrowRight, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Importação dinâmica do Scanner para evitar erros de SSR
import dynamic from 'next/dynamic';
const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });
import { useEcosystem } from '@/app/(app)/ecosystem-context';

interface IdentificationSectionProps {
  currentSchool: School | undefined;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeLoginMethod: string;
  lockoutSecs: number;
  studentRa: string;
  setStudentRa: (ra: string) => void;
  raInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogin: (ra: string) => void;
  showKeyboard: boolean;
  setShowKeyboard: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleKeyboardInput: (key: string) => void;
  handleKeyboardBackspace: () => void;
  activeLoginCameraSource: string;
  activeLoginUrl?: string;
  scannerKey: number;
  loginCameraDeviceId: string | undefined;
  onIdentify: (data: string) => void;
  isProcessing: boolean;
}

export function IdentificationSection({
  currentSchool,
  activeTab,
  setActiveTab,
  activeLoginMethod,
  lockoutSecs,
  studentRa,
  setStudentRa,
  raInputRef,
  handleLogin,
  showKeyboard,
  setShowKeyboard,
  handleKeyboardInput,
  handleKeyboardBackspace,
  activeLoginCameraSource,
  activeLoginUrl,
  scannerKey,
  loginCameraDeviceId,
  onIdentify,
  isProcessing
}: IdentificationSectionProps) {
  const { systemSettings } = useEcosystem();
  const streamImgRef = useRef<HTMLImageElement | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const streamUrlWithRetry = activeLoginUrl
    ? (retryKey > 0 ? (activeLoginUrl.includes('?') ? `${activeLoginUrl}&retry=${retryKey}` : `${activeLoginUrl}?retry=${retryKey}`) : activeLoginUrl)
    : '';

  useEffect(() => {
    if (!streamUrlWithRetry || streamError || activeTab !== 'qr') return;

    // Timer de 3 segundos. Se a imagem do stream não disparar onLoad nesse período,
    // assumimos que a placa está inacessível ou o socket travou.
    const timer = setTimeout(() => {
      setImageLoaded((current) => {
        if (!current) {
          // Timeout atingido na câmera
          setStreamError(true);
        }
        return current;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [streamUrlWithRetry, streamError, activeTab]);

  useEffect(() => {
    if (activeLoginCameraSource === 'browser' || !streamUrlWithRetry || activeTab !== 'qr') return;

    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let intervalId: any = null;

    // Criamos um elemento de scanner invisível no DOM
    const scannerElementId = 'hidden-qr-scanner-login';
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
      
      // Garante que a imagem está carregada e tem dimensões válidas
      if (!img.complete || img.naturalWidth === 0) return;

      isScanningFrame = true;

      // Otimização de Performance Extrema: Redimensiona o canvas para 320px de largura
      // 320px é perfeitamente nítido para decodificar QR, mas corta o processamento gráfico de renderização pela metade!
      const targetWidth = 320;
      const scale = targetWidth / img.naturalWidth;
      const targetHeight = img.naturalHeight * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isScanningFrame = false;
        return;
      }

      // Desenha com suavização para manter a legibilidade das bordas do QR
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Converte o canvas para Blob JPEG leve (60% qualidade) para agilizar o parse de memória do html5-qrcode
      canvas.toBlob(async (blob) => {
        if (!blob || !isMounted) {
          isScanningFrame = false;
          return;
        }
        try {
          const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
          const decodedText = await html5QrCode!.scanFile(file, false);
          
          if (decodedText && isMounted) {
            // QR Detectado na stream
            onIdentify(decodedText);
          }
        } catch (err) {
          // Erro esperado se não houver QR Code no frame, silencia
        } finally {
          isScanningFrame = false;
        }
      }, 'image/jpeg', 0.60);
    };

    // Roda a decodificação a cada 350ms (quase 3 vezes por segundo - leitura instantânea e CPU fria!)
    intervalId = setInterval(scanFrame, 350);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);

      // FORÇA A LIBERAÇÃO FÍSICA E IMEDIATA DO SOCKET DA ESP32 ANTES DE DESMONTAR!
      // Como o React anula a Ref antes do cleanup rodar, localizamos o elemento diretamente no DOM.
      try {
        const img = document.querySelector('img[alt="Login ESP32 Camera Stream"]') as HTMLImageElement | null;
        if (img) {
          img.src = "";
          img.removeAttribute('src');
        }
      } catch (e) {}

      if (html5QrCode) {
        try {
          html5QrCode.clear();
        } catch (e) {}
      }
      if (hiddenContainer && hiddenContainer.parentNode) {
        hiddenContainer.parentNode.removeChild(hiddenContainer);
      }
    };
  }, [activeLoginCameraSource, activeLoginUrl, activeTab, onIdentify]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-500">
      
      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Emerald glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        {/* Blob 2: Indigo glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md">
        
        {/* 📟 Glassmorphic Unified Console Container */}
        <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Header Section */}
          <div className="mb-8 text-center flex flex-col items-center">
            {/* Custom Icon Badge */}
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 mb-5 shadow-inner">
              <Recycle className="w-7 h-7" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-1">
              Terminal SchoolGain
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Identifique-se para registrar um resíduo
            </p>

            {currentSchool && (
              <span className="inline-flex items-center bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                {currentSchool.name} • {currentSchool.city}/{currentSchool.state}
              </span>
            )}
          </div>

          {/* Form & Navigation tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            
            {/* Pill-Style TabsList */}
            <TabsList className={cn(
              "grid w-full mb-6 bg-slate-100/80 dark:bg-slate-950/40 p-1 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl gap-1 h-11",
              activeLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
            )}>
              {(activeLoginMethod === 'all' || activeLoginMethod === 'manual') && (
                <TabsTrigger 
                  value="manual" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <User className="h-4 w-4" /> RA
                </TabsTrigger>
              )}
              {(activeLoginMethod === 'all' || activeLoginMethod === 'qr') && (
                <TabsTrigger 
                  value="qr" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              )}
              {(activeLoginMethod === 'all' || activeLoginMethod === 'rfid') && (
                <TabsTrigger 
                  value="rfid" 
                  className="gap-2 rounded-xl text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all duration-200"
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
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="ra-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                    Identificação Digital (RA ou ID Temporário)
                  </label>
                  <Input 
                    id="ra-input"
                    ref={raInputRef}
                    placeholder="Digite seu RA ou ID" 
                    value={studentRa}
                    onChange={(e) => setStudentRa(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(studentRa)}}
                    className="text-2xl p-4 h-16 text-center font-black tracking-tighter uppercase bg-slate-900/90 dark:bg-slate-950/60 text-white placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl"
                    autoFocus
                    disabled={lockoutSecs > 0}
                    inputMode={showKeyboard ? 'none' : 'text'}
                  />
                </div>
                
                {showKeyboard && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <VirtualKeyboard
                      layout="alphanumeric"
                      onInput={handleKeyboardInput}
                      onBackspace={handleKeyboardBackspace}
                      onEnter={() => handleLogin(studentRa)}
                    />
                  </div>
                )}
                
                <Button 
                  className="group w-full h-13 text-base rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-slate-100 dark:text-slate-900 font-bold transition-all duration-300"
                  onClick={() => handleLogin(studentRa)}
                  disabled={!studentRa.trim() || lockoutSecs > 0}
                >
                  {lockoutSecs > 0 ? (
                    `Bloqueado (${lockoutSecs}s)`
                  ) : (
                    <>
                      <span>Continuar</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold"
                onClick={() => setShowKeyboard((prev) => !prev)}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                {showKeyboard ? 'Esconder Teclado Físico' : 'Mostrar Teclado Virtual'}
              </Button>
            </TabsContent>

            {/* TAB: QR CODE LOGIN */}
            <TabsContent value="qr" className="space-y-4 animate-in fade-in-50 duration-200">
              {activeLoginCameraSource === 'browser' ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                    <QRScanner 
                      key={scannerKey} 
                      onScan={onIdentify} 
                      deviceId={loginCameraDeviceId || systemSettings.studentCaptureDevice}
                    />
                  </div>
                  <p className="text-[10px] text-center text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] bg-emerald-100/50 dark:bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-200/20 dark:border-emerald-500/20">
                    Aproxime sua Carteira da câmera
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {streamUrlWithRetry ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md bg-slate-950 flex items-center justify-center">
                      {!streamError ? (
                        <>
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-4">
                            <p className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              ESP32-CAM Login Ao Vivo
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center animate-in fade-in duration-300">
                          <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400 mb-2">
                            <AlertTriangle className="h-6 w-6 animate-pulse" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-tight text-white">Sinal de Login Instável</h4>
                          <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 mb-3 leading-snug">
                            Não conseguimos conectar com a câmera de login.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-white/10 hover:bg-white/5 text-white gap-2 font-bold uppercase tracking-wider text-[9px]"
                            onClick={() => {
                              setImageLoaded(false);
                              setStreamError(false);
                              setRetryKey(k => k + 1);
                            }}
                          >
                            <RefreshCw className="h-2.5 w-2.5 animate-spin [animation-duration:3s]" />
                            Reconectar
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4 bg-primary/5 animate-pulse">
                      <QrCode className="h-16 w-16 text-primary" />
                      <div className="text-center">
                        <p className="font-bold uppercase tracking-tight">Câmera Externa Ativa</p>
                        <p className="text-sm text-muted-foreground">O terminal fará a leitura automática via hardware externo.</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-center text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.15em] bg-emerald-100/50 dark:bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-200/20 dark:border-emerald-500/20">
                    Aproxime sua Carteira do Leitor da Câmera
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: RFID LOGIN */}
            <TabsContent value="rfid" className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-col items-center justify-center p-10 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl space-y-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping"></div>
                  <Cpu className="h-14 w-14 text-emerald-600 dark:text-emerald-400 relative z-10" />
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Aproxime seu Cartão</p>
                  <p className="text-xs text-slate-400">
                    O sensor RFID está aguardando sua leitura para login instantâneo
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

        </div>

        {/* Dynamic Footer links */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-semibold">
            <p>Não é um terminal? <Link href="/" className="underline hover:text-emerald-600 dark:hover:text-emerald-400">Voltar para o app</Link></p>
            <span>•</span>
            <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">
              TDS 2B 2026 - CETI Frei José Apicella
            </Link>
          </div>
        </div>

      </main>

    </div>
  );
}
