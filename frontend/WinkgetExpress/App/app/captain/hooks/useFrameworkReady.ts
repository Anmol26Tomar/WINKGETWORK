import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    window.frameworkReady?.();
  });
}

// Default export to appease Expo Router route resolution
export default function CaptainHooksRoute() { return null as any; }
