'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, X, Loader2, Cpu } from 'lucide-react';
import { useEcosystem } from '@/app/(app)/ecosystem-context';
import { useToast } from '@/hooks/use-toast';

interface PhotoCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function PhotoCaptureDialog({ isOpen, onClose, onCapture }: PhotoCaptureDialogProps) {
  const { systemSettings } = useEcosystem();
  const { toast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const source = systemSettings.studentCaptureSource || 'browser';
  const deviceId = systemSettings.studentCaptureDevice || 'default';
  const rawUrl = systemSettings.studentCaptureUrl || '';

  const getFullUrl = () => {
    if (!rawUrl) return '';
    if (source === 'esp32') {
      return rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}/stream`;
    }
    if (source === 'esp32_https') {
      let cleanUrl = rawUrl.split('?')[0].replace(/\/stream\/?$/i, '').replace(/^https?:\/\//i, '').trim();
      return `http://localhost:9005/stream?target=${cleanUrl}`;
    }
    return rawUrl;
  };

  const streamUrl = getFullUrl();

  useEffect(() => {
    if (isOpen && source === 'browser') {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, source, deviceId]);

  const startCamera = async () => {
    setIsLoading(true);
    try {
      const constraints: any = {
        video: deviceId === 'default' ? { facingMode: 'user' } : { deviceId: { exact: deviceId } }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      toast({
        variant: 'destructive',
        title: 'Erro na Câmera',
        description: 'Não foi possível acessar sua webcam.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (source === 'browser' && videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
    } else if ((source === 'esp32' || source === 'esp32_https' || source === 'url') && imgRef.current) {
      // Para streams de imagem (MJPEG)
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      ctx.drawImage(imgRef.current, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    // Converte dataUrl para File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        onCapture(file);
        onClose();
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Capturar Foto de Perfil
          </DialogTitle>
          <DialogDescription>
            {source === 'browser' ? 'Sua webcam local está ativa.' : 'Usando stream de rede configurado.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
          ) : (
            <>
              {source === 'browser' ? (
                <>
                  {isLoading && <Loader2 className="absolute h-10 w-10 text-white animate-spin z-10" />}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                </>
              ) : (
                <div className="w-full h-full relative">
                  {streamUrl ? (
                    <img 
                      ref={imgRef}
                      src={streamUrl} 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover" 
                      alt="Network Stream"
                      onError={() => {
                        toast({ variant: 'destructive', title: 'Erro no Stream', description: 'Não foi possível carregar a imagem da câmera de rede.' });
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white gap-2 p-6 text-center">
                      <Cpu className="h-12 w-12 text-primary animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-widest">Aguardando Câmera de Rede</p>
                      <p className="text-[10px] text-slate-400">Verifique se o IP/URL está correto nas configurações.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={() => setCapturedImage(null)} className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" /> Tentar Novamente
              </Button>
              <Button onClick={handleConfirm} className="flex-1 gap-2">
                <Check className="h-4 w-4" /> Confirmar Foto
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={capturePhoto} className="flex-1 gap-2" disabled={isLoading || (!stream && source === 'browser')}>
                <Camera className="h-4 w-4" /> Tirar Foto
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
