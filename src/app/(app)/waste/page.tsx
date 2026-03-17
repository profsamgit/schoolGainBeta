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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentifyWasteOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isCancelled = false;

    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (!isCancelled && videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
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
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [toast]);

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
    toast({
        title: 'Registro bem-sucedido!',
        description: `Você ganhou ${identificationResult.points} pontos por reciclar: ${identificationResult.material}.`,
    });
    setIdentificationResult(null);
  }
  
  const handleReset = () => {
      setIdentificationResult(null);
  }

  const WasteIcon = identificationResult ? wasteIcons[identificationResult.wasteType] : null;

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Registro de Resíduo
          </CardTitle>
          <CardDescription>
            Use a câmera para escanear um item e ganhar pontos de sustentabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full aspect-video rounded-md overflow-hidden border bg-muted relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white text-center p-4">Permissão da câmera negada ou não suportada.</p>
                 </div>
              )}
              {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-lg text-white">Identificando resíduo...</p>
                  </div>
              )}
              {identificationResult && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4 text-center">
                    <Sparkles className="h-10 w-10 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-white">Resíduo Identificado!</h3>
                    
                    <div className="flex items-center gap-4 bg-background/20 p-3 rounded-lg">
                        {WasteIcon && <WasteIcon className="h-12 w-12 text-primary" />}
                        <div className='text-left'>
                            <p className="text-lg font-semibold text-white">{identificationResult.material}</p>
                            <p className="text-sm text-slate-200">{identificationResult.wasteType} ({identificationResult.recyclable ? 'Reciclável' : 'Não Reciclável'})</p>
                            <p className="text-2xl font-bold text-primary">+{identificationResult.points} pontos</p>
                        </div>
                    </div>

                    <Alert variant={identificationResult.recyclable && identificationResult.isWaste ? 'default' : 'destructive'} className="text-left bg-background/90 max-w-sm">
                      <AlertTitle className="font-semibold">{identificationResult.recyclable && identificationResult.isWaste ? 'Instruções de Descarte' : 'Informação'}</AlertTitle>
                      <AlertDescription>
                        {identificationResult.recyclingInstructions}
                      </AlertDescription>
                    </Alert>

                    <p className="text-xs text-slate-400 italic max-w-sm">"{identificationResult.justification}"</p>
                  </div>
              )}
          </div>
          {hasCameraPermission === null && !identificationResult && (
            <Alert>
                <AlertTitle>Aguardando permissão da câmera...</AlertTitle>
                <AlertDescription>
                Você precisa permitir o acesso à câmera para usar esta funcionalidade.
                </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === false && !identificationResult && (
            <Alert variant="destructive">
                <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                <AlertDescription>
                Por favor, habilite o acesso à câmera nas configurações do seu navegador para continuar.
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
            {!identificationResult ? (
                 <Button
                    onClick={handleScan}
                    className="w-full sm:w-auto"
                    disabled={isLoading || !hasCameraPermission}
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
                    disabled={!identificationResult || identificationResult.points === 0}
                >
                    <Check className="mr-2 h-5 w-5" />
                    Confirmar e Ganhar Pontos
                </Button>
                </>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
