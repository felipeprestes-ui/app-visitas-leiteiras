'use client';

import { useEffect } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(`${basePath}/sw.js`, {
          scope: `${basePath}/`,
        });
      } catch {
        return;
      }
    };

    register();
  }, []);

  return null;
}