'use client';

import { useEffect, useRef, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from '@/components/ui/card';

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

  useEffect(() => {
    let isMounted = true;
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

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
                : { facingMode: "user" };

            await html5QrCode.start(
                cameraConfig,
                config,
                (decodedText) => {
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
                },
                () => {} 
            );
        } catch (err: any) {
            // Silencia erros esperados de concorrência ou hardware
            // Aviso de inicialização do scanner silenciado em produção
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
  }, [onScan, onError, elementId, deviceId]);

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-black relative aspect-square">
      {/* Usamos um container fixo que o React não gerencia internamente após montagem */}
      <div 
        id={elementId} 
        ref={containerRef}
        className="w-full h-full"
      ></div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-center text-[10px] uppercase font-bold tracking-widest z-10">
        Scanner Ativo
      </div>
    </Card>
  );
}
