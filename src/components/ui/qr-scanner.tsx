'use client';

import { useEffect, useRef, useId, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { SwitchCamera } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
  deviceId?: string;
}

/**
 * QRScanner: Componente para leitura de QR Code usando a webcam.
 * Altamente resiliente a erros de "AbortError" e conflitos de montagem.
 */
export default function QRScanner({ onScan, onError, deviceId }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStartingRef = useRef(false);
  const hasScannedRef = useRef(false);
  const uniqueId = useId().replace(/:/g, '-');
  const elementId = `qr-reader-${uniqueId}`;
  
  // Default to environment (rear) camera on mobile, but allow toggling
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    let isMounted = true;
    const config = { fps: 30, qrbox: { width: 250, height: 250 } };

    const startScanner = async () => {
        // Atraso para garantir que transições de UI terminaram
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!isMounted || !containerRef.current || isStartingRef.current) return;
        
        const element = document.getElementById(elementId);
        if (!element) return;

        isStartingRef.current = true;
        
        try {
            const html5QrCode = new Html5Qrcode(elementId);
            scannerRef.current = html5QrCode;

            if (!isMounted) return;

            const cameraConfig = deviceId && deviceId !== 'default' 
                ? { deviceId: { exact: deviceId } } 
                : { facingMode: facingMode };

            const onScanSuccess = (decodedText: string) => {
                if (!isMounted || hasScannedRef.current) return;
                hasScannedRef.current = true;

                if (html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        html5QrCode.clear();
                        setTimeout(() => { if (isMounted) onScan(decodedText); }, 100);
                    }).catch(() => {
                        if (isMounted) onScan(decodedText);
                    });
                } else {
                    if (isMounted) onScan(decodedText);
                }
            };

            try {
                await html5QrCode.start(
                    cameraConfig,
                    config,
                    onScanSuccess,
                    () => {} 
                );
            } catch (startErr) {
                if (deviceId && deviceId !== 'default' && isMounted) {
                    console.warn("[QRScanner] Falha ao iniciar câmera específica, tentando fallback padrão...", startErr);
                    await html5QrCode.start(
                        { facingMode: facingMode },
                        config,
                        onScanSuccess,
                        () => {}
                    );
                } else {
                    throw startErr;
                }
            }
        } catch (err: any) {
            // Silencia erros esperados de concorrência ou hardware
            if (onError) onError(err);
        } finally {
            isStartingRef.current = false;
        }
    };

    startScanner();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        // Interrompe tracks de mídia manualmente com try/catch agressivo
        try {
          if (containerRef.current) {
              const video = containerRef.current.querySelector('video');
              if (video) {
                  video.pause();
                  if (video.srcObject instanceof MediaStream) {
                      video.srcObject.getTracks().forEach(track => {
                          try { track.stop(); } catch(e) {}
                      });
                  }
                  video.srcObject = null;
                  video.load();
              }
          }
        } catch(e) {}

        // Aguarda um pouco se estiver no meio de um start
        if (isStartingRef.current) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          } catch (err) {
            // Silenciar erros de limpeza já que o componente está saindo
          } finally {
            scannerRef.current = null;
            isStartingRef.current = false;
          }
        }
      };
      cleanup();
    };
  }, [onScan, onError, elementId, deviceId, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-black relative aspect-square">
      {/* Usamos um container fixo que o React não gerencia internamente após montagem */}
      <div 
        id={elementId} 
        ref={containerRef}
        className="w-full h-full"
      ></div>
      
      {/* Camera switch button */}
      <button
        type="button"
        onClick={toggleCamera}
        className="absolute top-3 right-3 z-30 p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/50 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-1.5 backdrop-blur-md"
        title="Alternar Câmera (Frontal / Traseira)"
      >
        <SwitchCamera className="h-4 w-4 text-emerald-400" />
        <span className="text-[10px] font-black uppercase tracking-wider">
          {facingMode === 'user' ? 'Frontal' : 'Traseira'}
        </span>
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-center text-[10px] uppercase font-bold tracking-widest z-10">
        Scanner Ativo
      </div>
    </Card>
  );
}

