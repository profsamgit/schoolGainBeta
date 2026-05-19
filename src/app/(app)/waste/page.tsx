'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Paperclip, Recycle, Trash2, Atom, Camera, Loader2, Sparkles, Check, ArrowLeft, Cpu, GlassWater } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { identifyWasteAction } from './actions';
import { type IdentifyWasteOutput } from '@/ai/flows/identify-waste';
import { useEcosystem } from '../ecosystem-context';

const wasteIcons: { [key: string]: React.ElementType } = {
  'Plástico': Recycle,
  'Papel': Paperclip,
  'Metal': Atom,
  'Orgânico': Leaf,
  'Vidro': GlassWater,
  'Eletrônico': Cpu,
  'Não reciclável': Trash2,
};

export default function WastePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentifyWasteOutput | null>(null);
  const { toast } = useToast();
  const { currentUser, addPoints, registerWaste } = useEcosystem();

  useEffect(() => {
    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (identificationResult) {
      stopCamera();
      return;
    }

    let isCancelled = false;

    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (!isCancelled) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
          } else {
            // If component unmounted while we were getting permission, stop the stream.
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Acesso à câmera negado',
              description: 'Por favor, habilite o acesso à câmera nas configurações do seu navegador.',
            });
          }
        }
      } else {
        if (!isCancelled) {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Câmera não suportada',
            description: 'Seu navegador não suporta acesso à câmera.',
          });
        }
      }
    }

    getCameraPermission();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [identificationResult, toast]);

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    setIdentificationResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await identifyWasteAction({ photoDataUri: dataUri });
            setIdentificationResult(result);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Falha na Identificação',
                description: error.message || 'Não foi possível identificar o resíduo. Tente novamente.',
            });
        } finally {
            setIsLoading(false);
        }
    } else {
         setIsLoading(false);
         toast({
            variant: 'destructive',
            title: 'Erro de Captura',
            description: 'Não foi possível capturar a imagem.',
        });
    }
  };
  
  const handleConfirm = () => {
    if(!identificationResult || identificationResult.points === 0) return;
    
    // Registrar resíduo e adicionar pontos automaticamente
    if (currentUser?.ra) {
        registerWaste(currentUser.ra, identificationResult.wasteType as any, identificationResult.estimatedWeightKg || 0.05);
    }

    toast({
        title: 'Registro bem-sucedido!',
        description: `${currentUser?.name || 'Agente'}, você ganhou ${identificationResult.points} pontos por reciclar: ${identificationResult.material}.`,
    });
    setIdentificationResult(null);
  }
  
  const handleReset = () => {
      setIdentificationResult(null);
  }

  const WasteIcon = identificationResult ? wasteIcons[identificationResult.wasteType] : null;

  return (
    <div className="flex justify-center items-start pt-8 px-4 w-full">
      <Card className="w-full max-w-2xl border border-white/5 shadow-2xl bg-slate-900/40 text-white backdrop-blur-xl rounded-[2rem] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Camera className="h-5 w-5" />
            </div>
            Registro de Resíduo
          </CardTitle>
          <CardDescription className="text-slate-450 font-bold text-[9px] mt-1 uppercase tracking-widest leading-relaxed">
            Use a câmera para escanear um item e ganhar pontos de sustentabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-slate-950 relative group">
              <video ref={videoRef} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl pointer-events-none z-10 m-4">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
              </div>

              {hasCameraPermission === false && !identificationResult && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                    <p className="text-white text-center p-4 font-bold text-xs uppercase tracking-wider">Permissão da câmera negada ou não suportada.</p>
                 </div>
              )}
              {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm gap-4 z-20">
                      <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
                      <p className="text-sm font-black text-white uppercase tracking-wider animate-pulse">Analisando resíduo...</p>
                  </div>
              )}
              {identificationResult && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md gap-3 p-6 text-center z-30 overflow-y-auto">
                    <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Resíduo Identificado!</h3>
                    
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl w-full max-w-sm mt-2 shadow-xl text-left">
                        {WasteIcon && <WasteIcon className="h-10 w-10 text-emerald-400" />}
                        <div className='flex-1'>
                            <p className="text-base font-black text-white uppercase tracking-tight">{identificationResult.material}</p>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{identificationResult.wasteType} • {identificationResult.recyclable ? 'Reciclável' : 'Não Reciclável'}</p>
                            <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                +{identificationResult.points} pontos
                            </div>
                        </div>
                    </div>

                    <Alert variant={identificationResult.recyclable && identificationResult.isWaste ? 'default' : 'destructive'} className={`text-left border mt-2 max-w-sm rounded-2xl ${identificationResult.recyclable && identificationResult.isWaste ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'}`}>
                      <AlertTitle className="font-black text-[10px] uppercase tracking-wider">
                         {identificationResult.recyclable && identificationResult.isWaste ? 'Instruções de Descarte' : 'Informação'}
                      </AlertTitle>
                      <AlertDescription className="text-xs opacity-90 mt-1 font-medium leading-relaxed">
                        {identificationResult.recyclingInstructions}
                      </AlertDescription>
                    </Alert>

                    <p className="text-[10px] text-slate-450 italic max-w-sm mt-1 px-4">"{identificationResult.justification}"</p>
                  </div>
              )}
          </div>
          
          {hasCameraPermission === null && !identificationResult && (
            <Alert className="bg-slate-950/40 border-white/5 rounded-2xl text-slate-350 w-full">
                <AlertTitle className="font-black text-[10px] uppercase tracking-wider text-slate-200">Aguardando câmera...</AlertTitle>
                <AlertDescription className="text-slate-400 text-xs">
                Permita o acesso à câmera no seu navegador para registrar resíduos.
                </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === false && !identificationResult && (
            <Alert variant="destructive" className="rounded-2xl border-rose-500/30 bg-rose-500/10 text-rose-455 w-full">
                <AlertTitle className="font-black text-[10px] uppercase tracking-wider">Acesso Negado</AlertTitle>
                <AlertDescription className="text-xs">
                Habilite o acesso à câmera nas configurações para continuar.
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-2 pb-6 px-6">
            {!identificationResult ? (
                 <Button
                    onClick={handleScan}
                    className="w-full sm:w-auto h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-300 shadow-xl shadow-emerald-500/10"
                    disabled={isLoading || !hasCameraPermission}
                    size="lg"
                >
                    {isLoading ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                        </>
                    ) : (
                        <>
                        <Camera className="mr-2 h-4 w-4" />
                        Escanear Resíduo
                        </>
                    )}
                </Button>
            ) : (
                <>
                <Button
                    onClick={handleReset}
                    className="w-full sm:w-auto h-12 rounded-2xl font-black text-[10px] tracking-widest bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 border border-white/5 transition-all duration-300"
                    variant="outline"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Escanear Outro
                </Button>
                <Button
                    onClick={handleConfirm}
                    className="w-full sm:w-auto h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-300 shadow-xl shadow-emerald-500/10"
                    size="lg"
                    disabled={!identificationResult || identificationResult.points === 0}
                >
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar e Ganhar Pontos
                </Button>
                </>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
