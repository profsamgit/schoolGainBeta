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
import { Leaf, Paperclip, Recycle, Trash2, Atom, Camera, Loader2, Sparkles, Check, ArrowLeft, User, ArrowRight, Keyboard, Cpu, GlassWater, QrCode, MonitorOff, Lock, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { identifyWasteAction } from '@/app/(app)/waste/actions'; 
import { type IdentifyWasteOutput } from '@/ai/flows/identify-waste';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { School as SchoolIcon } from 'lucide-react';

// Importação dinâmica do Scanner para evitar erros de SSR
const QRScanner = dynamic(() => import('@/components/ui/qr-scanner'), { ssr: false });

import { STUDENT_MOCK, LEADERBOARD_MOCK, ADMIN_MOCK } from '@/lib/data';
import type { User as UserData } from '@/lib/types';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { useEcosystem } from '@/app/(app)/ecosystem-context';

const wasteIcons: { [key: string]: React.ElementType } = {
  'Plástico': Recycle,
  'Papel': Paperclip,
  'Metal': Atom,
  'Orgânico': Leaf,
  'Vidro': GlassWater,
  'Eletrônico': Cpu,
  'Não reciclável': Trash2,
};

export default function KioskPage() {
  return <KioskContent />;
}

function KioskContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentifyWasteOutput | null>(null);
  const [step, setStep] = useState<'identification' | 'scanning'>('identification');
  const [studentRa, setStudentRa] = useState('');
  const [identifiedStudent, setIdentifiedStudent] = useState<Omit<UserData, 'email' | 'avatar'> | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const { 
    users, 
    addPoints, 
    systemSettings, 
    pendingHardwareLogin,
    terminals,
    schools,
    requestTerminalAuthorization,
    deleteTerminal
  } = useEcosystem();
  const { toast } = useToast();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados de Autorização de Terminal
  const [requestedLocation, setRequestedLocation] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const currentTerminal = terminals.find(t => t.hardwareId === systemSettings.terminalId);
  const currentSchool = schools.find(s => s.id === currentTerminal?.schoolId);
  const isAuthorized = currentTerminal?.status === 'active';
  const isPending = currentTerminal?.status === 'pending';
  const isBlocked = currentTerminal?.status === 'inactive';
  const terminalExists = !!currentTerminal;
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    };
    setIsMobileDevice(checkMobile());
  }, []);

  /**
   * POLING DE HARDWARE:
   * Detecta se o aluno se identificou via hardware externo (ESP32).
   */
  useEffect(() => {
    if (step !== 'identification') return;

    const pollHardware = async () => {
      try {
        const res = await fetch(`/api/hardware/input?terminalId=${systemSettings.terminalId}`);
        const data = await res.json();
        if (data.ra) {
          console.log(`[KIOSK] Aluno identificado via Hardware: ${data.ra}`);
          setStudentRa(data.ra);
          // Auto-confirmar se o RA ou RFID for válido
          const student = users.find((user: any) => user.ra === data.ra.trim() || user.rfid === data.ra.trim());
          if (student) {
              setIdentifiedStudent(student);
              setStep('scanning');
          }
        }
      } catch (e) {
        console.error("Erro no polling do kiosk:", e);
      }
    };

    const interval = setInterval(pollHardware, 2000);
    return () => clearInterval(interval);
  }, [step, systemSettings.terminalId, users]);

  /**
   * INICIALIZAÇÃO DA CÂMERA LOCAL:
   * Só ocorre se o sistema estiver configurado para usar a Webcam do Computador.
   */
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

    // Só liga a câmera se estiver no passo de escaneamento E a fonte for o navegador
    if (step !== 'scanning' || identificationResult || systemSettings.scanningCameraSource !== 'browser') {
      stopCamera();
      return;
    }

    let isCancelled = false;

    async function getCameraPermission() {
      console.log("[KIOSK] Iniciando captura de vídeo...");
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          if (!isCancelled) {
            streamRef.current = stream;
            setHasCameraPermission(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => {
                    if (e.name !== 'AbortError') console.error("[KIOSK] Erro ao dar play no vídeo:", e);
                });
            }
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('[KIOSK] Erro ao acessar câmera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Acesso à câmera negado',
              description: 'Por favor, habilite o acesso à câmera nas configurações.',
            });
          }
        }
      }
    }

    getCameraPermission();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [step, identificationResult, systemSettings.scanningCameraSource, toast]);

  // Efeito extra para garantir que o srcObject seja definido quando o videoRef ficar disponível
  useEffect(() => {
    if (step === 'scanning' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') console.error("[KIOSK] Erro no re-anexo do vídeo:", e);
      });
    }
  }, [step]);

  const handleStudentIdentification = () => {
    if (!studentRa.trim()) {
        toast({
            variant: 'destructive',
            title: 'RA Inválido',
            description: 'Por favor, digite um RA para continuar.',
        });
        return;
    }

    const student = users.find((user: any) => user.ra === studentRa.trim() || user.rfid === studentRa.trim());

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

  const handleKeyboardInput = (key: string) => {
    setStudentRa((prev) => prev + key);
    raInputRef.current?.focus();
  };

  const handleKeyboardBackspace = () => {
    setStudentRa((prev) => prev.slice(0, -1));
    raInputRef.current?.focus();
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
    
    // ADICIONAR PONTOS REALMENTE
    addPoints(identificationResult.points, studentRa);

    if (identifiedStudent?.role === 'visitor') {
        setSuccessMessage('Obrigado por sua visita! Sua atitude inspira nossa escola. Pequenas ações constroem um grande futuro.');
    } else {
        toast({
            title: 'Registro bem-sucedido!',
            description: `${identifiedStudent?.name || `Aluno com RA ${studentRa}`} ganhou ${identificationResult.points} pontos por reciclar: ${identificationResult.material}.`,
        });
    }
    setIdentificationResult(null);
  }
  
  const handleReset = () => {
      setIdentificationResult(null);
  }

  const handleExit = () => {
    setStudentRa('');
    setIdentifiedStudent(null);
    setStep('identification');
    setIdentificationResult(null);
    setShowKeyboard(false);
    setSuccessMessage(null);
  };

  const WasteIcon = identificationResult ? wasteIcons[identificationResult.wasteType] : null;
  
  // VERIFICAÇÃO DE AUTORIZAÇÃO DO TERMINAL
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col bg-background items-center justify-center p-4">
        <Card className="w-full max-w-lg border-primary/20 shadow-xl overflow-hidden">
          <div className={`h-2 ${isBlocked ? 'bg-red-500' : isPending ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
          <CardHeader className="text-center">
             <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isMobileDevice ? 'bg-red-100 text-red-600' : isBlocked ? 'bg-red-100 text-red-600' : isPending ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                {isMobileDevice ? <MonitorOff className="h-8 w-8" /> : isBlocked ? <Lock className="h-8 w-8" /> : isPending ? <Clock className="h-8 w-8" /> : <MonitorOff className="h-8 w-8" />}
             </div>
             <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">
                {isMobileDevice ? 'Dispositivo Incompatível' : isBlocked ? 'Terminal Bloqueado' : isPending ? 'Aguardando Aprovação' : 'Terminal não Cadastrado'}
             </CardTitle>
             <CardDescription>
                {isMobileDevice ? 'O sistema Kiosk foi projetado para totens e computadores fixos. Smartphones não são compatíveis.' :
                 isBlocked ? 'Este dispositivo foi desativado por um administrador.' : 
                 isPending ? 'Sua solicitação de acesso está sendo analisada.' : 
                 'Este totem precisa ser autorizado para operar o sistema.'}
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {isPending ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                   <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-700 uppercase">ID do Terminal:</span>
                      <code className="bg-white px-2 py-1 rounded border font-mono">{systemSettings.terminalId}</code>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-700 uppercase">Localização Informada:</span>
                      <span className="italic text-amber-900">{currentTerminal?.location}</span>
                   </div>
                   <p className="text-[10px] text-amber-600 text-center font-medium italic">
                      Por favor, contate o administrador da escola para liberar este terminal.
                   </p>
                </div>
             ) : isBlocked ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                   <p className="text-sm font-bold text-red-800">O acesso deste terminal foi revogado.</p>
                   <p className="text-xs text-red-600 mt-1">ID: {systemSettings.terminalId}</p>
                </div>
             ) : (
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 border rounded-lg">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Identificador do Hardware</Label>
                      <code className="text-sm font-mono block p-2 bg-white border rounded">{systemSettings.terminalId}</code>
                   </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unidade Escolar</Label>
                       <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                          <SelectTrigger className="h-12 bg-white text-left">
                             <SelectValue placeholder="Selecione a instituição..." />
                          </SelectTrigger>
                          <SelectContent>
                             {schools.filter(s => s.status === 'active').map(school => (
                                <SelectItem key={school.id} value={school.id}>
                                   <div className="flex items-center gap-2 uppercase font-bold text-[10px] tracking-tighter">
                                      <SchoolIcon className="h-3 w-3 text-primary" />
                                      {school.name}
                                   </div>
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localização do Terminal (Ex: Pátio, Entrada)</Label>
                       <Input 
                         placeholder="Ex: Pátio Principal" 
                         value={requestedLocation}
                         onChange={(e) => setRequestedLocation(e.target.value)}
                         className="h-12 text-lg"
                       />
                    </div>
                </div>
             )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
             {!terminalExists && (
                <Button 
                   className="w-full h-14 text-lg font-bold" 
                   disabled={!requestedLocation || !selectedSchoolId || isRequestingAuth}
                   onClick={() => {
                      setIsRequestingAuth(true);
                      const res = requestTerminalAuthorization(systemSettings.terminalId, requestedLocation, selectedSchoolId);
                      if (res) {
                         toast({ title: "Solicitação Enviada", description: "Aguarde a aprovação do administrador da unidade." });
                      } else {
                         toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" });
                      }
                      setIsRequestingAuth(false);
                   }}
                >
                   {isRequestingAuth ? 'Enviando...' : 'Solicitar Autorização'}
                </Button>
             )}
             
             {isPending && (
                <Button 
                  variant="destructive" 
                  className="w-full h-12 font-bold gap-2"
                  onClick={() => {
                    if (currentTerminal) {
                      deleteTerminal(currentTerminal.id);
                      toast({ title: "Solicitação Cancelada", description: "O pedido de acesso foi removido." });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Cancelar Solicitação
                </Button>
             )}

             <div className="grid grid-cols-2 gap-3 w-full">
                {(isPending || isBlocked) && (
                  <Button variant="outline" className="h-12 font-bold gap-2" onClick={() => window.location.reload()}>
                    <Recycle className="h-4 w-4" /> Recarregar
                  </Button>
                )}
                <Button variant="ghost" className={`h-12 gap-2 ${(isPending || isBlocked) ? '' : 'col-span-2'}`} asChild>
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" /> Sair / Voltar
                  </Link>
                </Button>
             </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (successMessage) {
    return (
        <div className="flex min-h-screen flex-col bg-background items-center justify-center p-4">
            <Card className="w-full max-w-lg border-primary/20 shadow-xl overflow-hidden">
                <div className="h-2 bg-primary"></div>
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-black italic text-primary uppercase tracking-tighter">Ação Registrada!</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 px-8">
                    <p className="text-xl font-bold text-slate-800 leading-relaxed italic">
                        "{successMessage}"
                    </p>
                    <p className="mt-6 text-sm text-muted-foreground uppercase font-black tracking-widest">Equipe SchoolGain</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleExit} className="w-full h-14 text-lg font-bold" size="lg">
                        Finalizar e Voltar
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (step === 'identification') {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md">
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
                        <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="manual">Manual / RFID</TabsTrigger>
                                <TabsTrigger value="qr">Carteira (QR)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="manual" className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="ra-input" className="text-sm font-medium">RA do Aluno</label>
                                    <Input 
                                        id="ra-input"
                                        ref={raInputRef}
                                        placeholder="Digite ou aproxime o cartão" 
                                        value={studentRa}
                                        onChange={(e) => setStudentRa(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleStudentIdentification()}}
                                        className="text-lg p-4 h-14 text-center"
                                        autoFocus
                                        inputMode={showKeyboard ? 'none' : 'numeric'}
                                        pattern="\d*"
                                    />
                                </div>
                                {showKeyboard && (
                                    <VirtualKeyboard
                                        layout="numeric"
                                        onInput={handleKeyboardInput}
                                        onBackspace={handleKeyboardBackspace}
                                        onEnter={handleStudentIdentification}
                                    />
                                )}
                                <Button 
                                    className="w-full"
                                    size="lg"
                                    onClick={handleStudentIdentification}
                                    disabled={!studentRa.trim()}
                                >
                                    Continuar
                                    <ArrowRight className="ml-2 h-5 w-5" />
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

                            <TabsContent value="qr" className="space-y-4">
                                {systemSettings.loginCameraSource === 'browser' ? (
                                    <div className="space-y-4">
                                        <QRScanner key={scannerKey} onScan={(text) => {
                                            setStudentRa(text);
                                            // Procura o aluno imediatamente
                                            const student = users.find((user: any) => user.ra === text.trim() || user.rfid === text.trim());
                                            if (student) {
                                                setIdentifiedStudent(student);
                                                setStep('scanning');
                                            } else {
                                                toast({
                                                    variant: 'destructive',
                                                    title: 'Não identificado',
                                                    description: 'Código inválido. Tente novamente.',
                                                });
                                                setStudentRa('');
                                                // Reinicia o scanner para permitir nova tentativa automática
                                                setTimeout(() => setScannerKey(prev => prev + 1), 1500);
                                            }
                                        }} />
                                        <p className="text-xs text-center text-muted-foreground uppercase font-bold tracking-widest">
                                            Aproxime sua Carteira da câmera
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4 bg-primary/5">
                                        <QrCode className="h-16 w-16 text-primary animate-pulse" />
                                        <div className="text-center">
                                            <p className="font-bold">Aguardando ESP32-CAM</p>
                                            <p className="text-sm text-muted-foreground">O terminal fará a leitura automática via hardware externo.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground font-black tracking-widest">Ou</span>
                            </div>
                        </div>

                        <Button 
                            variant="outline" 
                            className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 gap-2 font-black uppercase text-xs tracking-widest h-12"
                            onClick={() => {
                                const visitor = users.find(u => u.ra === 'VISITANTE');
                                if (visitor) {
                                    setStudentRa('VISITANTE');
                                    setIdentifiedStudent(visitor);
                                    setStep('scanning');
                                } else {
                                    toast({ title: 'Acesso Visitante', description: 'O sistema de visitantes está em manutenção.', variant: 'destructive' });
                                }
                            }}
                        >
                            <Sparkles className="h-4 w-4 text-primary" />
                            Sou Visitante
                        </Button>
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
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
                    <Button variant="outline" size="sm" onClick={handleExit}>
                    <User className="mr-2 h-4 w-4" />
                    Trocar Aluno
                    </Button>
                </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                <div className="w-full aspect-video rounded-md overflow-hidden border bg-muted relative">
                    {systemSettings.scanningCameraSource === 'browser' ? (
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4 text-white p-6 text-center">
                        <Cpu className="h-16 w-16 text-primary animate-pulse" />
                        <h3 className="text-xl font-bold">Hardware Externo Ativo</h3>
                        <p className="text-sm text-slate-400">Aguardando sinal do sensor de imagem do terminal (ESP32-CAM).</p>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        </div>
                      </div>
                    )}
                    
                    {systemSettings.scanningCameraSource === 'browser' && hasCameraPermission === false && !identificationResult && (
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
        </main>
        <footer className="p-4 text-center text-xs text-muted-foreground">
             <p><Link href="/about" className="hover:text-primary hover:underline">TDS 2B 2026 - CETI Frei José Apicella</Link></p>
        </footer>
    </div>
  );
}
