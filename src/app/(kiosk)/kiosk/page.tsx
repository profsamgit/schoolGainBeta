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

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineDB } from '@/lib/services/offline-db';

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
  const isOnline = useNetworkStatus();
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
  const [isIdle, setIsIdle] = useState(false);

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
      if (typeof window === 'undefined') return false;
      
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      
      if (isMobileUA) return true;
      
      // Fallback para smartphones com "Solicitar site para computador" ativado.
      // 1. O dispositivo precisa possuir suporte a toque (touchscreen)
      // 2. O ponteiro padrão deve ser "coarse" (característico de telas sensíveis ao toque)
      // 3. A largura ou altura lógica da tela deve ser menor que 600px (smartphones).
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 600;
      
      return (hasTouch || isCoarsePointer) && isSmallScreen;
    };
    setIsMobileDevice(checkMobile());

    const handleNavigationCleanup = () => {
      try {
        const activeStreamImg = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
        if (activeStreamImg) {
          activeStreamImg.src = "";
          activeStreamImg.removeAttribute('src');
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', handleNavigationCleanup);
    window.addEventListener('beforeunload', handleNavigationCleanup);

    return () => {
      window.removeEventListener('popstate', handleNavigationCleanup);
      window.removeEventListener('beforeunload', handleNavigationCleanup);
    };
  }, []);

  useEffect(() => {
    if (isAuthorized && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Request initial permission to expose device IDs and get cameras ready
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          setHasCameraPermission(true);
        })
        .catch((err) => {
          console.warn("Initial camera permission denied or error:", err);
          setHasCameraPermission(false);
        });
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      // Entra em modo de economia após 60 segundos de inatividade
      timeoutId = setTimeout(() => {
        setIsIdle(true);
      }, 60000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((name) => {
      window.addEventListener(name, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((name) => {
        window.removeEventListener(name, resetTimer);
      });
    };
  }, [isAuthorized]);

  const getCameraUrl = (source?: string, url?: string, purpose?: 'login' | 'scan') => {
    if (!url) return '';
    if (source === 'esp32' || source === 'esp32_https') {
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

  const activeLoginUrl = (isIdle || activeTab !== 'qr') ? '' : getCameraUrl(
    currentTerminal?.settings?.loginCameraSource || systemSettings.studentCaptureSource || 'browser',
    currentTerminal?.settings?.loginCameraUrl || currentTerminal?.settings?.cameraUrl || systemSettings.studentCaptureUrl || '',
    'login'
  );

  const activeScanningUrl = isIdle ? '' : getCameraUrl(
    currentTerminal?.settings?.scanningCameraSource || systemSettings.studentCaptureSource || 'browser', 
    currentTerminal?.settings?.scanningCameraUrl || currentTerminal?.settings?.cameraUrl || systemSettings.studentCaptureUrl || '',
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
            let targetResolution = 'cif';
            if (scannerFramerate === 'balanced') targetResolution = 'vga';
            else if (scannerFramerate === 'high_res') targetResolution = 'svga';

            const espIp = activeScanningUrl.includes('target=') 
              ? activeScanningUrl.split('target=')[1].split('&')[0] 
              : activeScanningUrl;

            const changeResolution = async (ip: string, source: string, resolution: string) => {
              if (source === 'esp32_https') {
                await fetch(`http://localhost:9005/resolution?target=${encodeURIComponent(ip)}&val=${resolution}`).catch(() => {});
              } else {
                await fetch(`/api/hardware/camera?ip=${encodeURIComponent(ip)}&resolution=${resolution}`).catch(() => {});
              }
            };

            await changeResolution(espIp, activeScanningCameraSource, targetResolution);
          }
        } else if (step === 'identification') {
          if (activeLoginUrl && (activeLoginCameraSource === 'esp32' || activeLoginCameraSource === 'esp32_https')) {
            const loginFramerate = currentTerminal?.settings?.loginCameraFramerate || 'fluid';
            let targetResolution = 'vga'; // Minimum resolution for login QR scanning
            if (loginFramerate === 'high_res') targetResolution = 'svga';

            const espIp = activeLoginUrl.includes('target=') 
              ? activeLoginUrl.split('target=')[1].split('&')[0] 
              : activeLoginUrl;

            const changeResolution = async (ip: string, source: string, resolution: string) => {
              if (source === 'esp32_https') {
                await fetch(`http://localhost:9005/resolution?target=${encodeURIComponent(ip)}&val=${resolution}`).catch(() => {});
              } else {
                await fetch(`/api/hardware/camera?ip=${encodeURIComponent(ip)}&resolution=${resolution}`).catch(() => {});
              }
            };

            await changeResolution(espIp, activeLoginCameraSource, targetResolution);
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

    if (!isOnline) {
      // Modo offline: busca no cache local ou aceita qualquer RA formatado para evitar travar o fluxo físico
      const student = users.find((user: any) => user.ra === cleanRa || user.rfid === cleanRa);
      const fallbackStudent = student || {
        id: `temp-${Date.now()}`,
        name: 'Estudante',
        ra: cleanRa,
        role: 'student',
        status: 'active'
      };
      
      identifyKioskUser(cleanRa);
      setIdentifiedStudent(fallbackStudent);
      setStudentRa(cleanRa);
      setStep('scanning');
      playBeep('success');
      return;
    }

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
  }, [isOnline, identifyKioskUser, users, toast, getLockoutStatus, initUserSpecificSync]);

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

    if (step !== 'scanning' || identificationResult || activeScanningCameraSource !== 'browser' || isIdle) {
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
          const scanningCameraDevice = currentTerminal?.settings?.scanningCameraDevice || currentTerminal?.settings?.preferredCamera || systemSettings.studentCaptureDevice;
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
  }, [step, identificationResult, activeScanningCameraSource, toast, currentTerminal?.settings?.preferredCamera, currentTerminal?.settings?.scanningCameraDevice, isIdle]);

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

      // Limita a largura ou altura máxima mantendo a proporção (Aspect Ratio)
      // Usamos resolução menor (800px) no modo offline para economizar dados no IndexedDB
      const MAX_DIMENSION = isOnline ? 1024 : 800;
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
      
      // Exporta em JPEG com compressão (75% no modo offline para economizar espaço do IndexedDB)
      const dataUri = canvas.toDataURL('image/jpeg', isOnline ? 0.85 : 0.75);
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

      // 5. Envia para o modelo de Inteligência Artificial processar e classificar o resíduo (ou simula local offline)
      if (!isOnline) {
        const offlineResult: IdentifyWasteOutput = {
          material: 'Resíduo (Offline)',
          wasteType: 'Orgânico', // Padrão temporário a ser validado
          estimatedWeightKg: 0.1,
          isWaste: true,
          recyclable: true,
          recyclingInstructions: 'Coloque o resíduo no compartimento adequado. A validação e os pontos finais serão processados ao reconectar.',
          justification: 'Processamento de imagem postergado devido à falta de conexão.',
          points: 10
        };
        setIdentificationResult(offlineResult);
      } else {
        const result = await identifyWasteAction({ photoDataUri: dataUri });
        setIdentificationResult(result);
      }

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
  
  const handleConfirm = async () => {
    if(!identificationResult) return;

    if (!isOnline) {
      // Modo offline: Salva o descarte no IndexedDB local para sincronização futura
      try {
        await OfflineDB.savePendingDiscard({
          id: `off-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          studentInput: studentRa || identifiedStudent?.ra || '',
          capturedPhotoUri: capturedPhotoUri || '',
          timestamp: new Date().toISOString(),
          terminalId: currentTerminal?.id || 'HW-UNKNOWN',
          wasteType: identificationResult.wasteType,
          weightKg: identificationResult.estimatedWeightKg || 0.05
        });

        playBeep('success');
        setSuccessMessage('Coleta armazenada localmente com sucesso! Seus pontos serão creditados assim que a conexão retornar.');
      } catch (err: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Erro ao Salvar Localmente', 
          description: 'Houve uma falha ao acessar o armazenamento interno do totem.' 
        });
      }
      setIdentificationResult(null);
      setCapturedPhotoUri(null);
      return;
    }

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
    if (activeScanningCameraSource !== 'browser') {
      try {
        const activeStreamImg = document.querySelector('img[alt="External Camera Stream"]') as HTMLImageElement | null;
        if (activeStreamImg) {
          activeStreamImg.src = "";
          activeStreamImg.removeAttribute('src');
        }
      } catch (e) {}
    }
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

  if (isIdle) {
    return (
      <div 
        onClick={() => setIsIdle(false)}
        className="relative flex min-h-screen flex-col bg-slate-900/90 dark:bg-[#070913]/90 items-center justify-center p-6 text-white cursor-pointer select-none overflow-hidden animate-in fade-in duration-500"
      >
        <style>{`
          .cyber-grid {
            background-size: 30px 30px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          }
        `}</style>
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
          <div className="absolute inset-0 cyber-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)]" />
        </div>
        
        <div className="relative z-10 text-center space-y-6 max-w-sm p-8 border border-white/5 bg-slate-950/40 rounded-[2.5rem] backdrop-blur-xl shadow-2xl hover:border-emerald-500/20 transition-all duration-500">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-pulse">
            <Leaf className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-100">Modo de Espera Ativo</h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              O totem entrou em modo de economia de energia. Câmeras e sensores externos estão pausados.
            </p>
          </div>
          <div className="pt-2 animate-bounce">
            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">
              Toque na tela para iniciar
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return <SuccessSection successMessage={successMessage} handleExit={handleExit} />;
  }

  if (step === 'identification') {
    return (
      <IdentificationSection 
        key={isIdle ? 'idle' : 'active'}
        currentSchool={currentSchool} activeTab={activeTab} setActiveTab={setActiveTab}
        activeLoginMethod={currentTerminal?.settings?.loginMethod || systemSettings.studentLoginMethod || 'all'}
        lockoutSecs={lockoutSecs} studentRa={studentRa} setStudentRa={setStudentRa}
        raInputRef={raInputRef} handleLogin={handleLogin} showKeyboard={showKeyboard}
        setShowKeyboard={setShowKeyboard} handleKeyboardInput={handleKeyboardInput}
        handleKeyboardBackspace={handleKeyboardBackspace} activeLoginCameraSource={activeLoginCameraSource}
        activeLoginUrl={activeLoginUrl}
        scannerKey={scannerKey} loginCameraDeviceId={currentTerminal?.settings?.scanningCameraDevice || currentTerminal?.settings?.preferredCamera || systemSettings.studentCaptureDevice || 'default'}
        onIdentify={handleLogin}
        isProcessing={isLoading}
      />
    );
  }

  return (
    <ScanningSection 
      key={isIdle ? 'idle' : 'active'}
      identifiedStudent={identifiedStudent} handleExit={handleExit}
      activeScanningCameraSource={activeScanningCameraSource} activeScanningUrl={activeScanningUrl}
      videoRef={videoRef} canvasRef={canvasRef} hasCameraPermission={hasCameraPermission}
      isLoading={isLoading} capturedPhotoUri={capturedPhotoUri} identificationResult={identificationResult}
      WasteIcon={identificationResult ? wasteIcons[identificationResult.wasteType] : null}
      handleScan={handleScan} handleReset={() => { setIdentificationResult(null); setCapturedPhotoUri(null); }} handleConfirm={handleConfirm}
    />
  );
}
