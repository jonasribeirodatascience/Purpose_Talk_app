import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/95 border border-amber-500/50 text-amber-200 text-xs font-semibold shadow-xl"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Modo offline ativo — seu vocabulário e flashcards continuam disponíveis.</span>
    </div>
  );
};
