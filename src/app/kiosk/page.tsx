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
import { Leaf, Paperclip, Recycle, Trash2, Atom, Camera, Loader2, Sparkles, Check, ArrowLeft, User, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { identifyWasteAction } from '@/app/(app)/waste/actions'; 
import { type IdentifyWasteOutput } from '@/ai/flows/identify-waste';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { leaderboardData } from '@/lib/data';
import type { User as UserData } from '@/lib/types';

const wasteIcons: { [key: string]: React.ElementType } = {
  'Plástico': Recycle,
  'Papel': Paperclip,
  'Metal': Atom,
  'Orgânico': Leaf,
  'Não identificado': Trash2,
};

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentifyWasteOutput | null>(null);
  const [step, setStep] = useState<'identification' | 'scanning'>('identification');
  const [studentRa, setStudentRa] = useState('');
  const [identifiedStudent, setIdentifiedStudent] = useState<Omit<UserData, 'email' | 'avatar'> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (step !== 'scanning') {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

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
  }, [step, toast]);

  const handleStudentIdentification = () => {
    if (!studentRa.trim()) {
        toast({
            variant: 'destructive',
            title: 'RA Inválido',
            description: 'Por favor, digite um RA para continuar.',
        });
        return;
    }

    const student = leaderboardData.find(user => user.ra === studentRa.trim());

    if (student) {
        setIdentifiedStudent(student);
        setStep('scanning');
    } else {
        toast({
            variant: 'destructive',
            title: 'Aluno não encontrado',
            description: 'O RA digitado não corresponde a nenhum aluno cadastrado.',
        });
        setIdentifiedStudent(null);
    }
  };

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
        description: `${identifiedStudent?.name || `Aluno com RA ${studentRa}`} ganhou ${identificationResult.points} pontos por reciclar ${identificationResult.wasteType}.`,
    });
    setIdentificationResult(null);
  }
  
  const handleReset = () => {
      setIdentificationResult(null);
  }

  const WasteIcon = identificationResult ? wasteIcons[identificationResult.wasteType] : null;
  
  if (step === 'identification') {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Recycle className="h-8 w-8 text-primary" />
                        Terminal SchoolGain
                    </CardTitle>
                    <CardDescription>
                        Identifique-se com seu RA para registrar um resíduo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <label htmlFor="ra-input" className="text-sm font-medium">RA (Registro Acadêmico)</label>
                        <Input 
                            id="ra-input"
                            placeholder="Digite seu RA" 
                            value={studentRa}
                            onChange={(e) => setStudentRa(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleStudentIdentification()}}
                            className="text-lg p-4 h-12"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full"
                        size="lg"
                        onClick={handleStudentIdentification}
                        disabled={!studentRa.trim()}
                    >
                        Continuar
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
            <p className="text-xs text-muted-foreground mt-4">
                Não é um terminal? <Link href="/" className="underline hover:text-primary">Voltar para o app</Link>
            </p>
        </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-6 w-6" />
                Registro por Câmera
              </CardTitle>
              <CardDescription>
                Aluno: <span className="font-bold text-primary">{identifiedStudent?.name}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setStudentRa(''); setIdentifiedStudent(null); setStep('identification'); }}>
              <User className="mr-2 h-4 w-4" />
              Trocar Aluno
            </Button>
          </div>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-4 text-center">
                    <Sparkles className="h-12 w-12 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-white">Resíduo Identificado!</h3>
                    <div className="flex items-center gap-4 bg-background/20 p-4 rounded-lg">
                        {WasteIcon && <WasteIcon className="h-16 w-16 text-primary" />}
                        <div>
                            <p className="text-xl font-semibold text-white">{identificationResult.wasteType}</p>
                            <p className="text-3xl font-bold text-primary">+{identificationResult.points} pontos</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{identificationResult.justification}"</p>
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
                    disabled={identificationResult.wasteType === 'Não identificado'}
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
