'use client';

import { useState, useEffect } from 'react';
import { User as UserData } from '@/lib/types';
import { type IdentifyWasteOutput } from '@/ai/flows/identify-waste';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  User, 
  Cpu, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Check,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { POINTS_MAPPING } from '@/lib/constants';

interface ScanningSectionProps {
  identifiedStudent: any;
  handleExit: () => void;
  activeScanningCameraSource: string;
  activeScanningUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hasCameraPermission: boolean | null;
  isLoading: boolean;
  capturedPhotoUri: string | null;
  identificationResult: IdentifyWasteOutput | null;
  WasteIcon: any;
  handleScan: () => void;
  handleReset: () => void;
  handleConfirm: () => void;
}

export function ScanningSection({
  identifiedStudent,
  handleExit,
  activeScanningCameraSource,
  activeScanningUrl,
  videoRef,
  canvasRef,
  hasCameraPermission,
  isLoading,
  capturedPhotoUri,
  identificationResult,
  WasteIcon,
  handleScan,
  handleReset,
  handleConfirm
}: ScanningSectionProps) {
  const [streamError, setStreamError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const streamUrlWithRetry = activeScanningUrl
    ? (retryKey > 0 ? (activeScanningUrl.includes('?') ? `${activeScanningUrl}&retry=${retryKey}` : `${activeScanningUrl}?retry=${retryKey}`) : activeScanningUrl)
    : '';

  useEffect(() => {
    if (!streamUrlWithRetry || streamError) return;

    // Timer de 3 segundos. Se a imagem do stream não disparar onLoad nesse período,
    // assumimos que a placa está inacessível ou o socket travou.
    const timer = setTimeout(() => {
      setImageLoaded((current) => {
        if (!current) {
          console.warn("[KIOSK CAMERA] Câmera não respondeu em 3s. Exibindo painel de reconexão.");
          setStreamError(true);
        }
        return current;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [streamUrlWithRetry, streamError]);

  useEffect(() => {
    return () => {
      // FORÇA A LIBERAÇÃO FÍSICA E IMEDIATA DO SOCKET DA ESP32 AO SAIR DA TELA DE SCANNER!
      // Como o React anula a Ref e desmonta o DOM, localizamos e cancelamos o request diretamente.
      try {
        const img = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
        if (img) {
          img.src = "";
          img.removeAttribute('src');
        }
      } catch (e) {}
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl animate-in zoom-in duration-500">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6" />
                  Registro por Câmera
                </CardTitle>
                <CardDescription>
                  {identifiedStudent?.role === 'visitor' ? 'Visitante (ID Temporário)' : identifiedStudent?.role === 'staff' ? 'Funcionário' : 'Usuário'}: <span className="font-bold text-primary">{identifiedStudent?.name}</span>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExit}>
                <User className="mr-2 h-4 w-4" />
                Trocar Usuário
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full aspect-video rounded-md overflow-hidden border bg-muted relative">
              {/* O canvas oculto precisa estar sempre montado para permitir capturas do feed (local ou ESP32) */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Exibe a foto capturada estática se estiver analisando ou mostrando o resultado.
                  Isso interrompe o feed de vídeo ao vivo (desmontando as tags video/img) e libera a CPU da ESP32-CAM! */}
              {capturedPhotoUri && (isLoading || identificationResult) ? (
                <img 
                  src={capturedPhotoUri} 
                  className="w-full h-full object-cover" 
                  alt="Captured Waste Freeze Frame" 
                />
              ) : activeScanningCameraSource === 'browser' ? (
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  muted 
                  playsInline 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white overflow-hidden">
                  {streamUrlWithRetry && !streamError ? (
                    <img 
                      src={streamUrlWithRetry} 
                      className="w-full h-full object-cover" 
                      alt="External Camera Stream"
                      crossOrigin="anonymous"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        setStreamError(true);
                      }}
                    />
                  ) : streamError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center animate-in fade-in duration-300">
                      <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-400 mb-2">
                        <AlertTriangle className="h-10 w-10 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white">Sinal de Câmera Instável</h3>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                        Não conseguimos receber a transmissão de vídeo do Totem. Verifique a conexão Wi-Fi da placa ESP32-CAM.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/10 hover:bg-white/5 text-white gap-2 font-bold uppercase tracking-wider text-[10px]"
                        onClick={() => {
                          setImageLoaded(false);
                          setStreamError(false);
                          setRetryKey(k => k + 1);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 animate-spin [animation-duration:3s]" />
                        Tentar Reconectar
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center animate-in fade-in">
                      <Cpu className="h-16 w-16 text-primary animate-pulse mb-2" />
                      <h3 className="text-xl font-bold">Hardware Externo Ativo</h3>
                      <p className="text-sm text-slate-400 p-6 text-center">Aguardando sinal do sensor de imagem do terminal (ESP32-CAM).</p>
                    </div>
                  )}
                  {!streamError && streamUrlWithRetry && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                  )}
                </div>
              )}
              
              {activeScanningCameraSource === 'browser' && hasCameraPermission === false && !identificationResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-center p-4">Permissão da câmera negada ou não suportada.</p>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex flex-col items-center justify-center transition-all duration-300">
                  <div className="flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-6 py-3.5 rounded-full border border-slate-800 shadow-2xl animate-in zoom-in duration-300">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-semibold text-white tracking-wide">Analisando com Inteligência Artificial...</span>
                  </div>
                </div>
              )}
              {identificationResult && (
                <div className="absolute inset-x-0 bottom-0 max-h-[65%] md:inset-y-0 md:right-0 md:left-auto md:w-80 md:max-h-none bg-slate-950/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-center gap-2.5 overflow-y-auto rounded-b-md md:rounded-b-none md:rounded-r-md shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-500">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identificado!</h3>
                  </div>
                  
                  <div className="bg-white/10 p-3 rounded-lg border border-white/5 shadow-inner">
                    <div className="flex items-center gap-3">
                      {WasteIcon && (
                        <div className="p-1.5 bg-primary/20 rounded-md border border-primary/30">
                          <WasteIcon className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight truncate">{identificationResult.material}</p>
                        <p className="text-xs text-slate-300 capitalize">{identificationResult.wasteType}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-xs text-slate-400">Pontuação:</span>
                      <span className="text-md font-extrabold text-primary">+{POINTS_MAPPING[identificationResult.wasteType] || 0} pts</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-left">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">Como Descartar:</p>
                    <p className="text-[11px] text-slate-300 leading-normal">{identificationResult.recyclingInstructions}</p>
                  </div>

                  <p className="text-[10px] text-slate-400 italic leading-snug border-l-2 border-primary/50 pl-2 text-left">
                    "{identificationResult.justification}"
                  </p>
                </div>
              )}
            </div>
            
            {hasCameraPermission === null && !identificationResult && activeScanningCameraSource === 'browser' && (
              <Alert>
                <AlertTitle>Aguardando permissão da câmera...</AlertTitle>
                <AlertDescription>
                  Você precisa permitir o acesso à câmera para usar esta funcionalidade.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            {!identificationResult ? (
              <Button
                onClick={handleScan}
                className="w-full sm:w-auto"
                disabled={isLoading || (activeScanningCameraSource === 'browser' && !hasCameraPermission)}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Escanear Resíduo
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleReset}
                  className="w-full sm:w-auto"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Escanear Outro
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="w-full sm:w-auto"
                  size="lg"
                  disabled={!identificationResult || (identificationResult.points === 0 && !identificationResult.isWaste)}
                >
                  <Check className="mr-2 h-5 w-5" />
                  {identifiedStudent?.role === 'visitor' ? 'Confirmar Descarte' : 'Confirmar e Ganhar Bio-Coins'}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground">
        <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
      </footer>
    </div>
  );
}
