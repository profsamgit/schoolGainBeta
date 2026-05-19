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
  RefreshCw,
  Sparkles,
  Zap,
  Fingerprint
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
    }, 3500);

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

    // Roda a decodificação a cada 350ms
    intervalId = setInterval(scanFrame, 350);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);

      // FORÇA A LIBERAÇÃO FÍSICA E IMEDIATA DO SOCKET DA ESP32 ANTES DE DESMONTAR!
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#070913] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* 🚀 Estilos de Animação Inline Otimizados */}
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
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* 🌌 Cosmic Background & Ambient Glow Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Deep Emerald glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Blob 2: Deep Indigo glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md">
        
        {/* 📟 Glassmorphic Unified Console Container */}
        <div className="w-full backdrop-blur-3xl bg-slate-950/40 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-8 sm:p-10 transition-all duration-500 hover:border-emerald-500/20 ring-1 ring-white/5">
          
          {/* Header Section */}
          <div className="mb-8 text-center flex flex-col items-center">
            {/* Custom Icon Badge */}
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 text-emerald-400 border border-emerald-500/30 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-[float-slow_6s_infinite_ease-in-out]">
              <Recycle className="w-7 h-7 text-emerald-400 animate-spin [animation-duration:12s]" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-white mb-1.5 uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Terminal SchoolGain
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Identifique-se para registrar um resíduo
            </p>

            {currentSchool && (
              <span className="mt-4 inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <Sparkles className="w-2.5 h-2.5 mr-1.5 animate-pulse text-emerald-400" />
                {currentSchool.name} • {currentSchool.city}/{currentSchool.state}
              </span>
            )}
          </div>

          {/* Form & Navigation tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            
            {/* Pill-Style TabsList */}
            <TabsList className={cn(
              "grid w-full mb-6 bg-slate-950/80 p-1 border border-white/5 rounded-2xl gap-1 h-12 shadow-inner",
              activeLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
            )}>
              {(activeLoginMethod === 'all' || activeLoginMethod === 'manual') && (
                <TabsTrigger 
                  value="manual" 
                  className="gap-2 rounded-xl text-slate-400 font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <User className="h-4 w-4" /> RA
                </TabsTrigger>
              )}
              {(activeLoginMethod === 'all' || activeLoginMethod === 'qr') && (
                <TabsTrigger 
                  value="qr" 
                  className="gap-2 rounded-xl text-slate-400 font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <QrCode className="h-4 w-4" /> QR
                </TabsTrigger>
              )}
              {(activeLoginMethod === 'all' || activeLoginMethod === 'rfid') && (
                <TabsTrigger 
                  value="rfid" 
                  className="gap-2 rounded-xl text-slate-400 font-bold text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Cpu className="h-4 w-4" /> RFID
                </TabsTrigger>
              )}
            </TabsList>

            {/* TAB: MANUAL LOGIN */}
            <TabsContent value="manual" className="space-y-5 animate-in fade-in-50 duration-300">
              {lockoutSecs > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-400 text-xs text-center font-bold flex items-center justify-center gap-2 animate-pulse">
                  <Lock className="h-4 w-4 text-rose-500" />
                  Acesso suspenso por {lockoutSecs}s
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ra-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1.5">
                    Identificação Digital (RA ou ID Temporário)
                  </label>
                  <Input 
                    id="ra-input"
                    ref={raInputRef}
                    placeholder="Digite seu RA ou ID" 
                    value={studentRa}
                    onChange={(e) => setStudentRa(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(studentRa)}}
                    className="text-2xl p-4 h-16 text-center font-black tracking-wider uppercase bg-[#090b14]/90 text-white placeholder:text-slate-600 border border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/10 focus:ring-4 rounded-2xl transition-all shadow-inner"
                    autoFocus
                    disabled={lockoutSecs > 0}
                    inputMode={showKeyboard ? 'none' : 'text'}
                  />
                </div>
                
                {showKeyboard && (
                  <div className="animate-in fade-in slide-in-from-top-3 duration-300 bg-slate-950/60 p-4 border border-white/5 rounded-2xl shadow-inner">
                    <VirtualKeyboard
                      layout="alphanumeric"
                      onInput={handleKeyboardInput}
                      onBackspace={handleKeyboardBackspace}
                      onEnter={() => handleLogin(studentRa)}
                    />
                  </div>
                )}
                
                <Button 
                  className="group w-full h-14 text-base rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 border border-emerald-400/20"
                  onClick={() => handleLogin(studentRa)}
                  disabled={!studentRa.trim() || lockoutSecs > 0}
                >
                  {lockoutSecs > 0 ? (
                    `Bloqueado (${lockoutSecs}s)`
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Acessar Painel</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-11 text-xs font-semibold rounded-xl"
                onClick={() => setShowKeyboard((prev) => !prev)}
              >
                <Keyboard className="mr-2.5 h-4.5 w-4.5 text-emerald-400" />
                {showKeyboard ? 'Esconder Teclado Físico' : 'Mostrar Teclado Virtual'}
              </Button>
            </TabsContent>

            {/* TAB: QR CODE LOGIN */}
            <TabsContent value="qr" className="space-y-4 animate-in fade-in-50 duration-300">
              {activeLoginCameraSource === 'browser' ? (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-950 aspect-video">
                    {/* Futuristic Corner Scan Scope Brackets */}
                    <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                      
                      {/* Sweeping Laser Line */}
                      <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
                    </div>

                    <QRScanner 
                      key={scannerKey} 
                      onScan={onIdentify} 
                      deviceId={loginCameraDeviceId || systemSettings.studentCaptureDevice}
                    />
                  </div>
                  <p className="text-[10px] text-center text-emerald-400 font-black uppercase tracking-[0.18em] bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20 shadow-sm">
                    Aproxime sua Carteira da câmera
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {streamUrlWithRetry ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 flex items-center justify-center">
                      {!streamError ? (
                        <>
                          {/* Corner Brackets for Stream */}
                          <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl">
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
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
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              Login ESP32-CAM Ao Vivo
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070913] p-6 text-center animate-in fade-in duration-300">
                          <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400 mb-2">
                            <AlertTriangle className="h-6 w-6 animate-pulse" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-tight text-white">Sinal de Login Instável</h4>
                          <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 mb-3 leading-snug">
                            Não conseguimos conectar com a câmera de login externa.
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
                    <div className="flex flex-col items-center justify-center p-8 border border-white/10 rounded-2xl bg-white/5 animate-pulse">
                      <QrCode className="h-16 w-16 text-emerald-400 mb-4" />
                      <div className="text-center space-y-1">
                        <p className="font-bold text-white uppercase tracking-tight">Câmera Externa Ativa</p>
                        <p className="text-xs text-slate-400">O terminal fará a leitura automática via hardware externo.</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-center text-emerald-400 font-black uppercase tracking-[0.18em] bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20 shadow-sm">
                    Aproxime sua Carteira do Leitor da Câmera
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: RFID LOGIN */}
            <TabsContent value="rfid" className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex flex-col items-center justify-center p-10 border border-white/10 rounded-[2rem] space-y-6 bg-slate-950/40 shadow-2xl relative overflow-hidden">
                
                {/* 3D Concentric expands ripples RFID */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-1">
                  <div className="absolute w-36 h-36 rounded-full border border-emerald-500/10 animate-[pulse-ring_3s_infinite_linear]" />
                  <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20 animate-[pulse-ring_3s_infinite_linear_1s]" />
                  <div className="absolute w-20 h-20 rounded-full border border-emerald-500/30 animate-[pulse-ring_3s_infinite_linear_2s]" />
                  
                  {/* Glowing center badge */}
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.4)] border border-emerald-400/30 z-10">
                    <Fingerprint className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center space-y-2 relative z-10">
                  <p className="text-lg font-black text-white uppercase tracking-tight">Aproxime seu Cartão</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    O sensor RFID está aguardando sua leitura física para login instantâneo.
                  </p>
                </div>
                
                <div className="flex gap-2 relative z-10">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </TabsContent>

          </Tabs>

        </div>

        {/* Dynamic Footer links */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <p>Não é um terminal? <Link href="/" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Voltar para o app</Link></p>
            <span className="text-slate-700">•</span>
            <Link href="/about" className="hover:text-emerald-300 hover:underline transition-all">
              TDS 2B 2026 - CETI Frei José Apicella
            </Link>
          </div>
        </div>

      </main>

    </div>
  );
}
