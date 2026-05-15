'use client';

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
  Check 
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
  identificationResult,
  WasteIcon,
  handleScan,
  handleReset,
  handleConfirm
}: ScanningSectionProps) {
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
              {activeScanningCameraSource === 'browser' ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    muted 
                    playsInline 
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4 text-white overflow-hidden">
                  {activeScanningUrl ? (
                    <img 
                      src={activeScanningUrl} 
                      className="w-full h-full object-cover" 
                      alt="External Camera Stream"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <>
                      <Cpu className="h-16 w-16 text-primary animate-pulse" />
                      <h3 className="text-xl font-bold">Hardware Externo Ativo</h3>
                      <p className="text-sm text-slate-400 p-6 text-center">Aguardando sinal do sensor de imagem do terminal (ESP32-CAM).</p>
                    </>
                  )}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  </div>
                </div>
              )}
              
              {activeScanningCameraSource === 'browser' && hasCameraPermission === false && !identificationResult && (
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
                      <p className="text-2xl font-bold text-primary">+{POINTS_MAPPING[identificationResult.wasteType] || 0} pontos</p>
                    </div>
                  </div>

                  <Alert variant={identificationResult.recyclable && identificationResult.isWaste ? 'default' : 'destructive'} className="text-left bg-background/90 max-w-sm">
                    <AlertTitle className="font-semibold">{identificationResult.recyclable && identificationResult.isWaste ? 'Instruções de Descarte' : 'Informação'}</AlertTitle>
                    <AlertDescription>
                      {identificationResult.recyclingInstructions}
                    </AlertDescription>
                  </Alert>

                  <p className="text-xs text-slate-400 max-w-sm">"{identificationResult.justification}"</p>
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
