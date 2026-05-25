'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sincroniza com o estado do navegador inicialmente
    setIsOnline(navigator.onLine);

    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
        const res = await fetch('/api/healthcheck', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setIsOnline(res.status === 200);
      } catch (e) {
        setIsOnline(false);
      }
    };

    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Executa a verificação inicial
    checkConnectivity();

    // Executa verificação periódica a cada 15 segundos
    const intervalId = setInterval(checkConnectivity, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}
