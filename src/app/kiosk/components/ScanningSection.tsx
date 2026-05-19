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
  AlertTriangle,
  Award,
  Coins,
  ShieldCheck,
  Zap,
  Leaf
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { POINTS_MAPPING } from '@/lib/constants';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { cn } from '@/lib/utils';

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
  const { userStates, legends } = useEcosystem();
  const [streamError, setStreamError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loaderText, setLoaderText] = useState('Sincronizando com o Hub...');

  // Obter o estado real do ecossistema do aluno
  const studentState = identifiedStudent?.id ? userStates[identifiedStudent.id] : null;
  const currentLevel = studentState?.level || identifiedStudent?.level || 'Semente';
  const currentBalance = studentState?.balance ?? identifiedStudent?.balance ?? 0;
  
  // Verificar proteção lendária e prestígio
  const isLegend = legends.some(l => l.studentId === identifiedStudent?.id) || currentLevel === 'Guardião da Lenda';

  const streamUrlWithRetry = activeScanningUrl
    ? (retryKey > 0 ? (activeScanningUrl.includes('?') ? `${activeScanningUrl}&retry=${retryKey}` : `${activeScanningUrl}?retry=${retryKey}`) : activeScanningUrl)
    : '';

  useEffect(() => {
    if (!streamUrlWithRetry || streamError) return;

    // Timer de 3.5 segundos. Se a imagem do stream não disparar onLoad nesse período,
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
  }, [streamUrlWithRetry, streamError]);

  useEffect(() => {
    return () => {
      // FORÇA A LIBERAÇÃO FÍSICA E IMEDIATA DO SOCKET DA ESP32 AO SAIR DA TELA DE SCANNER!
      try {
        const img = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
        if (img) {
          img.src = "";
          img.removeAttribute('src');
        }
      } catch (e) {}
    };
  }, []);

  // Rotacionar mensagens do loader da IA
  useEffect(() => {
    if (!isLoading) return;
    const messages = [
      'Calibrando Visão de Máquina...',
      'Calculando Densidade Molecular...',
      'Identificando Composição Química...',
      'Pesando Pegada de Carbono...',
      'Indexando Bio-Coins...',
      'Processando Redes Neurais...'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoaderText(messages[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Cores personalizadas dependendo do resíduo identificado
  const getMaterialTheme = (type?: string) => {
    if (!type) return { bg: 'bg-slate-950/90', border: 'border-white/10', text: 'text-primary', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' };
    
    switch (type.toLowerCase()) {
      case 'plástico':
        return { bg: 'bg-red-950/70 backdrop-blur-md', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]' };
      case 'papel':
        return { bg: 'bg-blue-950/70 backdrop-blur-md', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]' };
      case 'metal':
        return { bg: 'bg-amber-950/70 backdrop-blur-md', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]' };
      case 'orgânico':
        return { bg: 'bg-emerald-950/70 backdrop-blur-md', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]' };
      case 'vidro':
        return { bg: 'bg-teal-950/70 backdrop-blur-md', border: 'border-teal-500/30', text: 'text-teal-400', glow: 'shadow-[0_0_25px_rgba(20,184,166,0.25)]' };
      case 'eletrônico':
        return { bg: 'bg-purple-950/70 backdrop-blur-md', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]' };
      default:
        return { bg: 'bg-slate-900/80 backdrop-blur-md', border: 'border-slate-700/50', text: 'text-slate-300', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.15)]' };
    }
  };

  const matTheme = getMaterialTheme(identificationResult?.wasteType);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#070913] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Estilos Inline de Laser e Pulsos */}
      <style>{`
        @keyframes scan-laser {
          0%, 100% { top: 6%; opacity: 0.4; }
          50% { top: 94%; opacity: 1; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gold-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.9) translateY(0px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-4px); }
        }
        .cyber-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
      `}</style>

      {/* Orbes de brilho ambiente */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '13s' }} />
        <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
      </div>

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl backdrop-blur-3xl bg-slate-950/40 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/5 overflow-hidden animate-in zoom-in duration-500">
          
          <CardHeader className="border-b border-white/5 pb-5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              
              {/* HUD do Usuário Identificado */}
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  "relative p-1 rounded-2xl transition-all duration-500",
                  isLegend 
                    ? "bg-gradient-to-r from-amber-400 to-yellow-600 shadow-[0_0_20px_rgba(251,191,36,0.35)] border border-amber-300/40" 
                    : "bg-slate-800 border border-white/10"
                )}>
                  {identifiedStudent?.avatar ? (
                    <img 
                      src={identifiedStudent.avatar} 
                      alt={identifiedStudent.name} 
                      className="w-12 h-12 rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-[14px] bg-slate-900 flex items-center justify-center text-slate-300 font-extrabold uppercase text-lg border border-white/5">
                      {identifiedStudent?.name?.substring(0, 2) || <User className="h-5 w-5" />}
                    </div>
                  )}
                  {isLegend && (
                    <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1 border border-slate-950 text-slate-950 shadow-md animate-bounce">
                      <Award className="h-3 w-3 font-black" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-base leading-none uppercase tracking-wide">
                      {identifiedStudent?.name}
                    </h3>
                    
                    {/* Badge especial de Lenda */}
                    {isLegend ? (
                      <span className="inline-flex items-center bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-slate-950 font-black tracking-widest text-[8px] uppercase px-2 py-0.5 rounded border border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                        LENDA
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                        {identifiedStudent?.role === 'visitor' ? 'Visitante' : identifiedStudent?.role === 'staff' ? 'Funcionário' : 'Aluno'}
                      </span>
                    )}
                  </div>
                  
                  {/* Status do Ecossistema no Totem */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                      {currentLevel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-amber-400" />
                      {currentBalance} Bio-Coins
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Trocar Usuário */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExit} 
                className="h-10 border-white/10 hover:bg-white/5 hover:text-white text-slate-400 gap-2 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Trocar Usuário
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 pt-6">
            
            {/* Câmera / Preview do Descarte */}
            <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#090b14] relative shadow-2xl">
              
              {/* O canvas oculto para IA */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Mira Holográfica Ciberbética */}
              {!capturedPhotoUri && !isLoading && !identificationResult && (
                <div className="absolute inset-0 z-20 pointer-events-none rounded-3xl">
                  {/* Scope Corners */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                  
                  {/* Sweeping scan lines */}
                  <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan-laser_2.5s_ease-in-out_infinite]" />
                </div>
              )}

              {/* Congelar imagem capturada */}
              {capturedPhotoUri && (isLoading || identificationResult) ? (
                <img 
                  src={capturedPhotoUri} 
                  className="w-full h-full object-cover animate-in fade-in duration-500" 
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
                    <>
                      {/* Mira de câmera externa */}
                      <div className="absolute inset-0 z-20 pointer-events-none rounded-3xl">
                        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                        <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan-laser_2.5s_ease-in-out_infinite]" />
                      </div>

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
                    </>
                  ) : streamError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070913] p-6 text-center animate-in fade-in duration-300">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070913] p-6 text-center animate-in fade-in">
                      <Cpu className="h-16 w-16 text-emerald-400 animate-pulse mb-3" />
                      <h3 className="text-xl font-bold uppercase tracking-tight text-white">Hardware Externo Ativo</h3>
                      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mt-1">Aguardando sinal do sensor de imagem do terminal (ESP32-CAM).</p>
                    </div>
                  )}
                  {!streamError && streamUrlWithRetry && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none z-10">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Erro de Câmera Local */}
              {activeScanningCameraSource === 'browser' && hasCameraPermission === false && !identificationResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                  <div className="text-center p-6 max-w-md">
                    <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-3 animate-pulse" />
                    <p className="text-white font-black uppercase text-sm mb-1">Permissão Negada</p>
                    <p className="text-xs text-slate-400">Você precisa habilitar o acesso à webcam local nas configurações do navegador.</p>
                  </div>
                </div>
              )}

              {/* Holographic Loader de IA */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 z-30">
                  <div className="flex flex-col items-center gap-4 bg-slate-950/90 border border-white/10 px-8 py-7 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300 max-w-xs w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    
                    {/* Ring Loader */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-emerald-400 relative z-10" />
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-t-emerald-500 animate-spin [animation-duration:3s]" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-black text-white tracking-widest uppercase">Processador IA</span>
                      <p className="text-[11px] font-bold text-emerald-400 tracking-wide animate-pulse">
                        {loaderText}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Painel de Resultados Flutuante Futurista */}
              {identificationResult && (
                <div className={cn(
                  "absolute inset-x-0 bottom-0 max-h-[70%] md:inset-y-0 md:right-0 md:left-auto md:w-80 md:max-h-none border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col justify-center gap-3 overflow-y-auto rounded-b-[24px] md:rounded-b-none md:rounded-r-[24px] shadow-2xl z-20 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 text-left",
                  matTheme.bg,
                  matTheme.glow
                )}>
                  
                  {/* Glowing header */}
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Resíduo Detectado!</h3>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-3.5">
                      {WasteIcon && (
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                          <WasteIcon className={cn("h-8 w-8", matTheme.text, "animate-pulse")} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white leading-tight truncate uppercase tracking-wide">
                          {identificationResult.material}
                        </p>
                        <p className={cn("text-[10px] font-black uppercase tracking-wider mt-0.5", matTheme.text)}>
                          {identificationResult.wasteType}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Bio-Coins Propostas:</span>
                      <span className={cn("text-lg font-black tracking-wider leading-none", matTheme.text)}>
                        +{POINTS_MAPPING[identificationResult.wasteType] || 0} pts
                      </span>
                    </div>
                  </div>

                  {/* Instruction */}
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Instrução de Descarte:</p>
                    <p className="text-[11px] text-slate-300 leading-normal font-bold">
                      {identificationResult.recyclingInstructions}
                    </p>
                  </div>

                  {/* Justification quote */}
                  <p className="text-[10px] text-slate-400 italic leading-snug border-l-2 border-emerald-500/50 pl-2">
                    "{identificationResult.justification}"
                  </p>
                </div>
              )}
            </div>
            
            {hasCameraPermission === null && !identificationResult && activeScanningCameraSource === 'browser' && (
              <Alert className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <AlertTitle className="text-white font-extrabold text-xs uppercase tracking-wider">Aguardando Câmera...</AlertTitle>
                  <AlertDescription className="text-slate-400 text-xs mt-0.5">
                    Aguardando liberação física ou digital dos drivers da webcam.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 border-t border-white/5 mt-4 pt-6">
            {!identificationResult ? (
              <Button
                onClick={handleScan}
                className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 border border-emerald-400/20"
                disabled={isLoading || (activeScanningCameraSource === 'browser' && !hasCameraPermission)}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2.5 h-5 w-5 animate-spin text-white" />
                    Analisando Imagem...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2.5 h-5 w-5" />
                    Escanear Resíduo
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleReset}
                  className="w-full sm:w-auto h-14 text-sm font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-2xl border border-white/5 transition-all"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar e Reiniciar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="w-full flex-1 h-14 text-base rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 border border-emerald-400/20"
                  size="lg"
                  disabled={!identificationResult || (identificationResult.points === 0 && !identificationResult.isWaste)}
                >
                  <Check className="mr-2.5 h-5 w-5" />
                  {identifiedStudent?.role === 'visitor' ? 'Confirmar Descarte' : 'Confirmar e Ganhar Coins'}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </main>

      <footer className="relative z-10 p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        <p><Link href="/about" className="hover:text-emerald-400 hover:underline transition-all">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
      </footer>
    </div>
  );
}
