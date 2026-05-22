'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
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
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
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
    generateTerminalId,
    hardwareId,
    initUserSpecificSync
  } = useEcosystem();
  const { toast } = useToast();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [requestedLocation, setRequestedLocation] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [isRequestingAuth, setIsRequestingAuth] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [generatedTerminalId, setGeneratedTerminalId] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isHardwareReady, setIsHardwareReady] = useState(false);

  const currentTerminal = terminals.find(t => t.hardwareId === hardwareId);
  const currentSchool = schools.find(s => s.id === currentTerminal?.schoolId);
  const isAuthorized = currentTerminal?.status === 'active';
  const isPending = currentTerminal?.status === 'pending';
  const isBlocked = currentTerminal?.status === 'inactive';
  const terminalExists = !!currentTerminal;

  const activeLoginCameraSource = currentTerminal?.settings?.loginCameraSource || systemSettings.studentCaptureSource || 'browser';
  const activeScanningCameraSource = currentTerminal?.settings?.scanningCameraSource || systemSettings.studentCaptureSource || 'browser';

  useEffect(() => {
    document.title = "Terminal Kiosk • SchoolGain";
    const checkMobile = () => {
      const ua = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    };
    setIsMobileDevice(checkMobile());
  }, []);

  const getCameraUrl = (source?: string, url?: string, purpose?: 'login' | 'scan') => {
    if (!url) return '';
    if (source === 'esp32') {
      let base = url.startsWith('http') ? url : `http://${url}/stream`;
      if (purpose === 'scan') {
        const flashEnabled = currentTerminal?.settings?.scanningCameraFlash !== false;
        if (flashEnabled) {
          base = base.includes('?') ? `${base}&flash=on` : `${base}?flash=on`;
        }
      } else if (purpose === 'login') {
        const flashEnabled = currentTerminal?.settings?.loginCameraFlash === true;
        if (flashEnabled) {
          base = base.includes('?') ? `${base}&flash=on` : `${base}?flash=on`;
        }
      }
      return base;
    }
    if (source === 'esp32_https') {
      let cleanUrl = url.split('?')[0].replace(/\/stream\/?$/i, '').replace(/^https?:\/\//i, '').trim();
      let base = `http://localhost:9005/stream?target=${cleanUrl}`;
      if (purpose === 'scan') {
        const flashEnabled = currentTerminal?.settings?.scanningCameraFlash !== false;
        if (flashEnabled) {
          base = `${base}&flash=on`;
        }
      } else if (purpose === 'login') {
        const flashEnabled = currentTerminal?.settings?.loginCameraFlash === true;
        if (flashEnabled) {
          base = `${base}&flash=on`;
        }
      }
      return base;
    }
    return url;
  };

  const activeLoginUrl = getCameraUrl(
    currentTerminal?.settings?.loginCameraSource || systemSettings.studentCaptureSource,
    currentTerminal?.settings?.loginCameraUrl || currentTerminal?.settings?.cameraUrl || systemSettings.studentCaptureUrl,
    'login'
  );

  const activeScanningUrl = getCameraUrl(
    currentTerminal?.settings?.scanningCameraSource || systemSettings.studentCaptureSource, 
    currentTerminal?.settings?.scanningCameraUrl || currentTerminal?.settings?.cameraUrl || systemSettings.studentCaptureUrl,
    'scan'
  );


  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => setLockoutSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  // Controle de Resolução Dinâmica e Sincronização Inteligente de Hardware:
  // - Login: Câmera em velocidade máxima com resolução CIF (~50 FPS) para leitura instantânea de QR.
  // - Scanner: Câmera configurada dinamicamente conforme a taxa de quadros (framerate) escolhida no painel.
  useEffect(() => {
    let isCancelled = false;

    // Reseta o estado pronto de hardware ao transicionar de tela, garantindo que o stream seja temporariamente desmontado
    setIsHardwareReady(false);

    const coordinateHardware = async () => {
      const getTargetOrUrl = (urlStr: string) => {
        if (urlStr.includes('target=')) {
          return urlStr.split('target=')[1].split('&')[0];
        }
        return urlStr.split('?')[0].replace(/\/stream\/?$/i, '');
      };
      // Se for a mesma ESP32-CAM física compartilhada para ambas as funções,
      // estendemos o cooldown para 800ms para dar tempo do chip reciclar o socket único de stream.
      const isSameCamera = activeLoginUrl && activeScanningUrl && 
        getTargetOrUrl(activeLoginUrl) === getTargetOrUrl(activeScanningUrl);
      const cooldownMs = isSameCamera ? 800 : 350;

      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
      if (isCancelled) return;

      try {
        if (step === 'scanning') {
          if (activeScanningUrl && (activeScanningCameraSource === 'esp32' || activeScanningCameraSource === 'esp32_https')) {
            const scannerFramerate = currentTerminal?.settings?.scannerFramerate || 'fluid';
            let targetResolution = 'vga';
            if (scannerFramerate === 'balanced') targetResolution = 'svga';
            else if (scannerFramerate === 'high_res') targetResolution = 'hd';

            const espIp = activeScanningUrl.includes('target=') 
              ? activeScanningUrl.split('target=')[1].split('&')[0] 
              : activeScanningUrl;

            // Log removido para ambiente de produção
            // Aguarda a resolução ser fisicamente atualizada na placa antes de iniciar a nova transmissão
            await fetch(`/api/hardware/camera?ip=${encodeURIComponent(espIp)}&resolution=${targetResolution}`).catch(() => {});
          }
        } else if (step === 'identification') {
          if (activeLoginUrl && (activeLoginCameraSource === 'esp32' || activeLoginCameraSource === 'esp32_https')) {
            const loginFramerate = currentTerminal?.settings?.loginCameraFramerate || 'fluid';
            let targetResolution = 'cif';
            if (loginFramerate === 'balanced') targetResolution = 'vga';
            else if (loginFramerate === 'high_res') targetResolution = 'svga';

            const espIp = activeLoginUrl.includes('target=') 
              ? activeLoginUrl.split('target=')[1].split('&')[0] 
              : activeLoginUrl;

            // Log removido para ambiente de produção
            // Aguarda a resolução ser fisicamente atualizada na placa antes de iniciar a nova transmissão
            await fetch(`/api/hardware/camera?ip=${encodeURIComponent(espIp)}&resolution=${targetResolution}`).catch(() => {});
          }
        }
      } catch (err) {
        // Ignora erro no hardware na configuração inicial e prossegue
      } finally {
        if (!isCancelled) {
          setIsHardwareReady(true);
        }
      }
    };

    coordinateHardware();

    return () => {
      isCancelled = true;
    };
  }, [step, activeLoginUrl, activeScanningUrl, activeLoginCameraSource, activeScanningCameraSource, currentTerminal?.settings?.scannerFramerate, currentTerminal?.settings?.loginCameraFramerate]);

  useEffect(() => {
    if (requestedLocation && selectedSchoolId && !generatedTerminalId && !terminalExists) {
      setGeneratedTerminalId(generateTerminalId());
    }
  }, [requestedLocation, selectedSchoolId, generatedTerminalId, terminalExists, generateTerminalId]);

  const handleLogin = useCallback(async (targetRa: string) => {
    const cleanRa = targetRa.replace(/[<>]/g, '').trim().toUpperCase();
    if (!cleanRa) return;

    const lockout = getLockoutStatus(cleanRa);
    if (lockout.isLocked) {
        setLockoutSecs(lockout.remainingSeconds);
        toast({ variant: 'destructive', title: 'Acesso Bloqueado', description: `Muitas tentativas falhas. Aguarde ${lockout.remainingSeconds}s.` });
        return;
    }

    const student = users.find((user: any) => user.ra === cleanRa || user.rfid === cleanRa);
    
    if (student) {
        if (student.status === 'inactive') {
            toast({ variant: 'destructive', title: 'Acesso Restrito', description: 'Este registro está inativo. Procure a secretaria.' });
            playBeep('error');
            return;
        }
        const actualRa = student.ra || cleanRa;
        identifyKioskUser(actualRa);
        initUserSpecificSync(student.id);
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
  }, [identifyKioskUser, users, toast, getLockoutStatus, initUserSpecificSync]);

  // Polling e Hardware
  useEffect(() => {
    const shouldPoll = step === 'identification' && (activeTab === 'rfid' || (activeTab === 'qr' && activeLoginCameraSource !== 'browser'));
    if (!shouldPoll) return;

    const pollHardware = async () => {
      try {
        const pollId = currentTerminal?.id || hardwareId;
        const res = await fetch(`/api/hardware/input?terminalId=${pollId}`);
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
      // Pequeno atraso estratégico para garantir que a câmera do login liberou completamente o hardware
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (isCancelled) return;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const videoConstraints: any = { width: { ideal: 1280 }, height: { ideal: 720 } };
          const scanningCameraDevice = currentTerminal?.settings?.scanningCameraDevice || currentTerminal?.settings?.preferredCamera;
          if (scanningCameraDevice && scanningCameraDevice !== 'default') {
            videoConstraints.deviceId = { exact: scanningCameraDevice };
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
  }, [step, identificationResult, activeScanningCameraSource, toast, currentTerminal?.settings?.preferredCamera, currentTerminal?.settings?.scanningCameraDevice]);

  const handleKeyboardInput = (key: string) => { setStudentRa((prev) => (prev + key).toUpperCase()); raInputRef.current?.focus(); };
  const handleKeyboardBackspace = () => { setStudentRa((prev) => prev.slice(0, -1)); raInputRef.current?.focus(); };

  const handleScan = async () => {
    if (!canvasRef.current) return;
    setIsLoading(true);
    setIdentificationResult(null);
    setCapturedPhotoUri(null); // Reseta a foto anterior

    const canvas = canvasRef.current;
    let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;
    const isEsp32 = activeScanningCameraSource === 'esp32' || activeScanningCameraSource === 'esp32_https' || activeScanningCameraSource === 'url';
    // Calcula o IP base da ESP32 de forma robusta e resiliente
    let esp32BaseUrl = '';
    if (activeScanningUrl) {
      let cleaned = activeScanningUrl.replace(/\/stream\/?$/i, '').trim();
      if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = `http://${cleaned}`;
      }
      esp32BaseUrl = cleaned;
    }

    // Helper para fazer requisições HTTP com tempo limite (timeout) para evitar travamentos
    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    try {
      // 1. Seleciona o elemento de origem correto (Webcam Local ou ESP32-CAM)
      if (activeScanningCameraSource === 'browser') {
        sourceElement = videoRef.current;
      } else {
        sourceElement = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
      }

      if (!sourceElement) {
        throw new Error('Câmera não encontrada ou fluxo de vídeo indisponível.');
      }

      // 2. Define dimensões do canvas com redimensionamento inteligente client-side (Max 1024px)
      let originalWidth = 640;
      let originalHeight = 480;

      if (activeScanningCameraSource === 'browser') {
        const video = sourceElement as HTMLVideoElement;
        originalWidth = video.videoWidth || 640;
        originalHeight = video.videoHeight || 480;
      } else {
        const img = sourceElement as HTMLImageElement;
        originalWidth = img.naturalWidth || 1280;
        originalHeight = img.naturalHeight || 720;
      }

      // Limita a largura ou altura máxima a 1024px mantendo a proporção (Aspect Ratio)
      const MAX_DIMENSION = 1024;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
        if (originalWidth > originalHeight) {
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round((originalHeight * MAX_DIMENSION) / originalWidth);
        } else {
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round((originalWidth * MAX_DIMENSION) / originalHeight);
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 3. Captura o frame no Canvas instantaneamente
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Falha ao inicializar o processador gráfico da imagem.');
      }

      // Aplica suavização na imagem antes de desenhar (evita serrilhado ao diminuir o tamanho)
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Filtros Gráficos Dinâmicos: Otimizados para compensar reflexos de flash e iluminação externa.
      // Reduzimos ligeiramente o brilho (0.96) para recuperar realces superexpostos (glare) e aumentamos o contraste (1.06)
      // para destacar letras de rótulos e silhuetas físicas sob iluminação mista.
      context.filter = 'contrast(1.06) brightness(0.96)';

      context.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
      
      // Reseta o filtro para evitar qualquer efeito colateral em desenhos futuros no Totem
      context.filter = 'none';
      
      // Exporta em JPEG com compressão de 85% para reduzir drasticamente o tamanho do payload
      const dataUri = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoUri(dataUri); // Guarda a imagem congelada localmente

      // 4. Liberação síncrona de socket da ESP32: Limpar a imagem 'src' força o navegador a encerrar 
      // a conexão de stream física com a ESP32. O firmware C++ detecta o encerramento do socket e 
      // desliga o Flash LED físico de forma 100% AUTOMÁTICA e instantânea!
      if (activeScanningCameraSource !== 'browser') {
        const activeStreamImg = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
        if (activeStreamImg) {
          activeStreamImg.src = "";
        }
      }

      // 5. Envia para o modelo de Inteligência Artificial processar e classificar o resíduo
      const result = await identifyWasteAction({ photoDataUri: dataUri });
      setIdentificationResult(result);

    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Falha na Identificação', 
        description: error.message || 'Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
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
    setCapturedPhotoUri(null); // Reseta foto
  }
  
  const handleExit = () => {
    setStudentRa(''); setIdentifiedStudent(null); setStep('identification'); setIdentificationResult(null); setShowKeyboard(false); setSuccessMessage(null);
    setCapturedPhotoUri(null); // Reseta foto
  };

  if (isMobileDevice) {
    return (
      <div className="relative flex min-h-screen flex-col bg-slate-100 dark:bg-[#070913] items-center justify-center p-4 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
        <style>{`
          .cyber-grid {
            background-size: 30px 30px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          }
        `}</style>
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/5 blur-[120px] animate-pulse" />
          <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
        </div>
        <Card className="relative z-10 w-full max-w-lg backdrop-blur-3xl bg-white/90 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden animate-in zoom-in duration-500">
          <div className="h-2 bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
          <CardHeader className="text-center pt-8">
             <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                <MonitorOff className="h-9 w-9" />
             </div>
             <CardTitle className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white">Dispositivo Incompatível</CardTitle>
             <CardDescription className="text-slate-600 dark:text-slate-400 text-xs mt-2 font-semibold">O modo Kiosk é exclusivo para totens fixos e não deve ser operado em dispositivos móveis.</CardDescription>
          </CardHeader>
          <CardFooter className="pb-8 pt-4 px-8">
            <Button variant="outline" className="w-full h-14 text-sm font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> 
                Voltar ao Painel Principal
              </Link>
            </Button>
          </CardFooter>
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
          const res = requestTerminalAuthorization(generatedTerminalId, hardwareId || 'UNKNOWN', requestedLocation, selectedSchoolId);
          if (res) toast({ title: "Solicitação Enviada" });
          else toast({ title: "Erro", variant: "destructive" });
          setIsRequestingAuth(false);
        }}
        deleteTerminal={deleteTerminal} terminalIdSetting={hardwareId || 'DESCONHECIDO'} toast={toast}
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
        activeLoginUrl={isHardwareReady ? activeLoginUrl : undefined}
        scannerKey={scannerKey} loginCameraDeviceId={currentTerminal?.settings?.preferredCamera}
        onIdentify={handleLogin}
        isProcessing={isLoading}
      />
    );
  }

  return (
    <ScanningSection 
      identifiedStudent={identifiedStudent} handleExit={handleExit}
      activeScanningCameraSource={activeScanningCameraSource} activeScanningUrl={isHardwareReady ? activeScanningUrl : ''}
      videoRef={videoRef} canvasRef={canvasRef} hasCameraPermission={hasCameraPermission}
      isLoading={isLoading} capturedPhotoUri={capturedPhotoUri} identificationResult={identificationResult}
      WasteIcon={identificationResult ? wasteIcons[identificationResult.wasteType] : null}
      handleScan={handleScan} handleReset={() => { setIdentificationResult(null); setCapturedPhotoUri(null); }} handleConfirm={handleConfirm}
    />
  );
}
