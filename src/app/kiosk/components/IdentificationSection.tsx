'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { User as UserData, School } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Recycle, 
  User, 
  QrCode, 
  Cpu, 
  Lock, 
  Keyboard, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
          console.warn("[KIOSK LOGIN CAMERA] Câmera de login não respondeu em 3s. Exibindo painel de reconexão.");
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
            console.log("[QR STREAM] QR Code detectado na Câmera ESP32:", decodedText);
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
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Recycle className="h-8 w-8 text-primary" />
              Terminal SchoolGain
            </CardTitle>
            <CardDescription className="text-center">
              Identifique-se para registrar um resíduo.
              {currentSchool && (
                <span className="block mt-1 text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">
                  {currentSchool.name} • {currentSchool.city}/{currentSchool.state}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className={cn(
                "grid w-full mb-4",
                activeLoginMethod === 'all' ? "grid-cols-3" : "grid-cols-1"
              )}>
                {(activeLoginMethod === 'all' || activeLoginMethod === 'manual') && (
                  <TabsTrigger value="manual" className="gap-2">
                    <User className="h-4 w-4" /> RA
                  </TabsTrigger>
                )}
                {(activeLoginMethod === 'all' || activeLoginMethod === 'qr') && (
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="h-4 w-4" /> QR
                  </TabsTrigger>
                )}
                {(activeLoginMethod === 'all' || activeLoginMethod === 'rfid') && (
                  <TabsTrigger value="rfid" className="gap-2">
                    <Cpu className="h-4 w-4" /> RFID
                  </TabsTrigger>
                )}
              </TabsList>

              {/* RA LOGIN */}
              <TabsContent value="manual" className="space-y-4">
                {lockoutSecs > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-destructive text-sm text-center font-medium animate-pulse">
                    <Lock className="h-4 w-4 inline mr-2" /> 
                    Acesso suspenso por {lockoutSecs}s
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="ra-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificação Digital (RA ou ID Temporário)</label>
                  <Input 
                    id="ra-input"
                    ref={raInputRef}
                    placeholder="Digite seu RA ou ID Temporário" 
                    value={studentRa}
                    onChange={(e) => setStudentRa(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(studentRa)}}
                    className="text-2xl p-4 h-16 text-center font-black tracking-tighter uppercase"
                    autoFocus
                    disabled={lockoutSecs > 0}
                    inputMode={showKeyboard ? 'none' : 'text'}
                  />
                </div>
                {showKeyboard && (
                  <VirtualKeyboard
                    layout="alphanumeric"
                    onInput={handleKeyboardInput}
                    onBackspace={handleKeyboardBackspace}
                    onEnter={() => handleLogin(studentRa)}
                  />
                )}
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  size="lg"
                  onClick={() => handleLogin(studentRa)}
                  disabled={!studentRa.trim() || lockoutSecs > 0}
                >
                  {lockoutSecs > 0 ? `Bloqueado (${lockoutSecs}s)` : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowKeyboard((prev) => !prev)}
                >
                  <Keyboard className="mr-2" />
                  {showKeyboard ? 'Esconder' : 'Mostrar'} Teclado Virtual
                </Button>
              </TabsContent>

              {/* QR LOGIN */}
              <TabsContent value="qr" className="space-y-4">
                {activeLoginCameraSource === 'browser' ? (
                  <div className="space-y-4">
                    <QRScanner 
                      key={scannerKey} 
                      onScan={onIdentify} 
                      deviceId={loginCameraDeviceId || systemSettings.studentCaptureDevice}
                    />
                    <p className="text-xs text-center text-muted-foreground uppercase font-black tracking-widest bg-slate-100 py-2 rounded-full">
                      Aproxime sua Carteira da câmera
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {streamUrlWithRetry ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md bg-slate-950 flex items-center justify-center">
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
                              <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                ESP32-CAM Login Ao Vivo
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center animate-in fade-in duration-300">
                            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400 mb-1">
                              <AlertTriangle className="h-6 w-6 animate-pulse" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-white">Sinal de Login Instável</h4>
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
                    <p className="text-xs text-center text-muted-foreground uppercase font-black tracking-widest bg-slate-100 py-2 rounded-full">
                      Aproxime sua Carteira do Leitor da Câmera
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* RFID LOGIN */}
              <TabsContent value="rfid" className="space-y-4">
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl space-y-6 bg-primary/5 border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <Cpu className="h-20 w-20 text-primary relative z-10 transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black uppercase tracking-tighter">Aproxime seu Cartão</p>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto font-medium leading-tight">
                      O sensor RFID está aguardando sua leitura para login instantâneo.
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
        </Card>
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground space-y-2">
        <p>Não é um terminal? <Link href="/" className="underline hover:text-primary">Voltar para o app</Link></p>
        <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
      </footer>
    </div>
  );
}
