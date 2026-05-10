'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { identifyWasteAction } from '@/app/(app)/waste/actions'; 
import { type IdentifyWasteOutput } from '@/ai/flows/identify-waste';
import { POINTS_MAPPING } from '@/lib/constants';
import { playBeep } from '@/lib/utils';
import { 
  Recycle, 
  Paperclip, 
  Atom, 
  Leaf, 
  GlassWater, 
  Cpu, 
  Trash2,
  MonitorOff,
  ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Componentes Modularizados
import { AuthorizationSection } from './components/AuthorizationSection';
import { IdentificationSection } from './components/IdentificationSection';
import { ScanningSection } from './components/ScanningSection';
import { SuccessSection } from './components/SuccessSection';

const wasteIcons: { [key: string]: React.ElementType } = {
  'Plástico': Recycle,
  'Papel': Paperclip,
  'Metal': Atom,
  'Orgânico': Leaf,
  'Vidro': GlassWater,
  'Eletrônico': Cpu,
  'Não reciclável': Trash2,
};

/**
 * ============================================================================
 * KIOSK PAGE: INTERFACE DO TERMINAL DE INTERAÇÃO
 * ============================================================================
 * Esta página provê a interface lógica para os terminais físicos de coleta.
 * 
 * O fluxo de operação consiste em três estágios principais:
 * 1. Identificação do usuário via hardware ou entrada manual.
 * 2. Processamento e validação da entrada de dados (visão computacional/sensores).
 * 3. Comunicação com o barramento de serviços para persistência e premiação.
 */
export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentifyWasteOutput | null>(null);
  const [step, setStep] = useState<'identification' | 'scanning'>('identification');
  const [studentRa, setStudentRa] = useState('');
  const [identifiedStudent, setIdentifiedStudent] = useState<any>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const { 
    users, 
    getLockoutStatus,
    systemSettings, 
    terminals,
    schools,
    requestTerminalAuthorization,
    deleteTerminal,
    registerWaste,
    identifyKioskUser,
    generateTerminalId
  } = useEcosystem();
  const { toast } = useToast();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [requestedLocation, setRequestedLocation] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [generatedTerminalId, setGeneratedTerminalId] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const currentTerminal = terminals.find(t => t.hardwareId === systemSettings.terminalId);
  const currentSchool = schools.find(s => s.id === currentTerminal?.schoolId);
  const isAuthorized = currentTerminal?.status === 'active';
  const isPending = currentTerminal?.status === 'pending';
  const isBlocked = currentTerminal?.status === 'inactive';
  const terminalExists = !!currentTerminal;

  const activeLoginCameraSource = currentTerminal?.settings?.loginCameraSource || systemSettings.studentCaptureSource || 'browser';
  const activeScanningCameraSource = currentTerminal?.settings?.scanningCameraSource || systemSettings.studentCaptureSource || 'browser';

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    };
    setIsMobileDevice(checkMobile());
  }, []);

  const getCameraUrl = (source?: string, url?: string) => {
    if (!url) return '';
    if (source === 'esp32') return url.startsWith('http') ? url : `http://${url}/stream`;
    return url;
  };

  const activeScanningUrl = getCameraUrl(currentTerminal?.settings?.scanningCameraSource, currentTerminal?.settings?.cameraUrl);

  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => setLockoutSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  useEffect(() => {
    if (requestedLocation && selectedSchoolId && !generatedTerminalId && !terminalExists) {
      setGeneratedTerminalId(generateTerminalId());
    }
  }, [requestedLocation, selectedSchoolId, generatedTerminalId, terminalExists, generateTerminalId]);

  const handleLogin = useCallback(async (targetRa: string) => {
    const cleanRa = targetRa.replace(/[<>]/g, '').trim();
    if (!cleanRa) return;

    const lockout = getLockoutStatus(cleanRa);
    if (lockout.isLocked) {
        setLockoutSecs(lockout.remainingSeconds);
        toast({ variant: 'destructive', title: 'Acesso Bloqueado', description: `Muitas tentativas falhas. Aguarde ${lockout.remainingSeconds}s.` });
        return;
    }

    const student = users.find((user: any) => user.ra === cleanRa || user.rfid === cleanRa);
    if (student) {
        const actualRa = student.ra || cleanRa;
        identifyKioskUser(actualRa);
        setIdentifiedStudent(student);
        setStudentRa(actualRa);
        setStep('scanning');
        playBeep('success');
    } else {
        toast({ variant: 'destructive', title: 'Não identificado', description: 'RA ou RFID inválido.' });
        playBeep('error');
        setIdentifiedStudent(null);
        setStudentRa('');
    }
  }, [identifyKioskUser, users, toast, getLockoutStatus]);

  // Polling e Hardware
  useEffect(() => {
    const shouldPoll = step === 'identification' && (activeTab === 'rfid' || (activeTab === 'qr' && activeLoginCameraSource !== 'browser'));
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const res = await fetch(`/api/hardware/input?terminalId=${systemSettings.terminalId}`);
        const data = await res.json();
        if (data.ra) {
          const cleanRa = data.ra.replace(/[<>]/g, '').trim();
          const lockout = getLockoutStatus(cleanRa);
          if (lockout.isLocked) { setLockoutSecs(lockout.remainingSeconds); return; }
          setStudentRa(cleanRa);
          handleLogin(cleanRa);
        }
      } catch (e) {}
    };

    const interval = setInterval(pollHardware, 2000);
    return () => clearInterval(interval);
  }, [step, activeTab, systemSettings.terminalId, users, getLockoutStatus, activeLoginCameraSource, handleLogin]);

  useEffect(() => {
    if (activeTab !== 'rfid') return;
    let buffer = '';
    let lastKeyTime = Date.now();
    const handleGlobalKey = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) buffer = '';
      if (e.key === 'Enter') {
        if (buffer.length >= 4) handleLogin(buffer);
        buffer = '';
      } else if (e.key.length === 1) buffer += e.key;
      lastKeyTime = currentTime;
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [activeTab, handleLogin]);

  // Câmera Local
  useEffect(() => {
    const stopCamera = () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          videoRef.current.load();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (step !== 'scanning' || identificationResult || activeScanningCameraSource !== 'browser') {
      stopCamera();
      return;
    }

    let isCancelled = false;
    async function getCameraPermission() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const videoConstraints: any = { width: { ideal: 1280 }, height: { ideal: 720 } };
          if (currentTerminal?.settings?.preferredCamera && currentTerminal.settings.preferredCamera !== 'default') {
            videoConstraints.deviceId = { exact: currentTerminal.settings.preferredCamera };
          } else {
            videoConstraints.facingMode = 'environment';
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
          if (!isCancelled) {
            streamRef.current = stream;
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => {});
            }
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (error) {
          if (!isCancelled) {
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Câmera negada', description: 'Habilite o acesso nas configurações.' });
          }
        }
      }
    }
    getCameraPermission();
    return () => { isCancelled = true; stopCamera(); };
  }, [step, identificationResult, activeScanningCameraSource, toast, currentTerminal?.settings?.preferredCamera]);

  const handleKeyboardInput = (key: string) => { setStudentRa((prev) => (prev + key).toUpperCase()); raInputRef.current?.focus(); };
  const handleKeyboardBackspace = () => { setStudentRa((prev) => prev.slice(0, -1)); raInputRef.current?.focus(); };

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
            toast({ variant: 'destructive', title: 'Falha na Identificação', description: error.message || 'Tente novamente.' });
        } finally {
            setIsLoading(false);
        }
    }
  };
  
  const handleConfirm = () => {
    if(!identificationResult) return;
    if (!identificationResult.isWaste && identificationResult.wasteType !== 'Não reciclável') {
        toast({ title: 'Ação Bloqueada', description: 'Não parece ser um resíduo.', variant: 'destructive' });
        return;
    }
    const estimatedWeightKg = identificationResult.estimatedWeightKg || 0.05;
    const basePoints = POINTS_MAPPING[identificationResult.wasteType] || 0;
    const actualPoints = estimatedWeightKg >= 1 ? Math.floor(estimatedWeightKg * basePoints) : basePoints;

    registerWaste(identifiedStudent?.ra || studentRa, identificationResult.wasteType as any, estimatedWeightKg, currentTerminal?.schoolId);
    if (identifiedStudent?.role === 'visitor') {
        setSuccessMessage('Agradecemos pela visita! Este engajamento inspira esta instituição.');
    } else {
        toast({ title: 'Registro bem-sucedido!', description: `${identifiedStudent?.name} ganhou ${actualPoints} pontos.` });
        setStep('identification'); setStudentRa(''); setIdentifiedStudent(null); setIdentificationResult(null);
    }
    setIdentificationResult(null);
  }
  
  const handleExit = () => {
    setStudentRa(''); setIdentifiedStudent(null); setStep('identification'); setIdentificationResult(null); setShowKeyboard(false); setSuccessMessage(null);
  };

  if (isMobileDevice) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-500/20 shadow-xl overflow-hidden">
          <div className="h-2 bg-red-500"></div>
          <CardHeader className="text-center">
             <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600"><MonitorOff className="h-8 w-8" /></div>
             <CardTitle className="text-2xl font-black uppercase text-red-600">Dispositivo Incompatível</CardTitle>
             <CardDescription>O Kiosk é exclusivo para totens fixos.</CardDescription>
          </CardHeader>
          <CardFooter><Button variant="outline" className="w-full h-12" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link></Button></CardFooter>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <AuthorizationSection 
        isBlocked={isBlocked} isPending={isPending} terminalExists={terminalExists} currentTerminal={currentTerminal}
        schools={schools} selectedSchoolId={selectedSchoolId} setSelectedSchoolId={setSelectedSchoolId}
        requestedLocation={requestedLocation} setRequestedLocation={setRequestedLocation}
        generatedTerminalId={generatedTerminalId} isRequestingAuth={isRequestingAuth}
        handleRequestAuth={() => {
          setIsRequestingAuth(true);
          const res = requestTerminalAuthorization(generatedTerminalId, systemSettings.terminalId, requestedLocation, selectedSchoolId);
          if (res) toast({ title: "Solicitação Enviada" });
          else toast({ title: "Erro", variant: "destructive" });
          setIsRequestingAuth(false);
        }}
        deleteTerminal={deleteTerminal} terminalIdSetting={systemSettings.terminalId} toast={toast}
      />
    );
  }

  if (successMessage) {
    return <SuccessSection successMessage={successMessage} handleExit={handleExit} />;
  }

  if (step === 'identification') {
    return (
      <IdentificationSection 
        currentSchool={currentSchool} activeTab={activeTab} setActiveTab={setActiveTab}
        activeLoginMethod={currentTerminal?.settings?.loginMethod || systemSettings.studentLoginMethod || 'all'}
        lockoutSecs={lockoutSecs} studentRa={studentRa} setStudentRa={setStudentRa}
        raInputRef={raInputRef} handleLogin={handleLogin} showKeyboard={showKeyboard}
        setShowKeyboard={setShowKeyboard} handleKeyboardInput={handleKeyboardInput}
        handleKeyboardBackspace={handleKeyboardBackspace} activeLoginCameraSource={activeLoginCameraSource}
        scannerKey={scannerKey} loginCameraDeviceId={currentTerminal?.settings?.preferredCamera}
        handleVisitorLogin={() => {
          const visitor = users.find(u => u.ra === 'VISITANTE');
          if (visitor) { setStudentRa('VISITANTE'); setIdentifiedStudent(visitor); setStep('scanning'); }
        }}
      />
    );
  }

  return (
    <ScanningSection 
      identifiedStudent={identifiedStudent} handleExit={handleExit}
      activeScanningCameraSource={activeScanningCameraSource} activeScanningUrl={activeScanningUrl}
      videoRef={videoRef} canvasRef={canvasRef} hasCameraPermission={hasCameraPermission}
      isLoading={isLoading} identificationResult={identificationResult}
      WasteIcon={identificationResult ? wasteIcons[identificationResult.wasteType] : null}
      handleScan={handleScan} handleReset={() => setIdentificationResult(null)} handleConfirm={handleConfirm}
    />
  );
}
