import React, { useEffect, useState } from 'react';
import { Trophy, Zap, X, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AchievementBadge } from '../types';
import { tts } from '../utils/speech';

interface AchievementUnlockToastProps {
  badge: AchievementBadge | null;
  onDismiss: () => void;
}

export const AchievementUnlockToast: React.FC<AchievementUnlockToastProps> = ({
  badge,
  onDismiss,
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied'>('idle');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!badge) return;
    setShareStatus('idle');
    setIsPaused(false);
    confetti({
      particleCount: 70,
      spread: 55,
      origin: { y: 0.2 },
    });
    tts.speak(`Congratulations! You unlocked the ${badge.title} badge!`, 1.05);
  }, [badge]);

  useEffect(() => {
    if (!badge || isPaused) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [badge, isPaused, onDismiss]);

  if (!badge) return null;

  const handleShareAchievement = async () => {
    setIsPaused(true);
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareTitle = `Nova Conquista no Purpose Talk: ${badge.title}`;
    const shareText = `🏆 Acabei de desbloquear a conquista "${badge.title}" (+${badge.xpReward} XP) praticando inglês com louvor, tecnologia e IA no Purpose Talk!`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          ...(shareUrl ? { url: shareUrl } : {}),
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2500);
        setIsPaused(false);
        return;
      } catch (err: any) {
        // User closed the native share sheet without sharing
        if (err?.name === 'AbortError') {
          setIsPaused(false);
          return;
        }
      }
    }

    // Fallback when Web Share API is unavailable on desktop browsers
    try {
      const fullCopy = shareUrl ? `${shareText}\n${shareUrl}` : shareText;
      await navigator.clipboard.writeText(fullCopy);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch {
      // ignore clipboard denial
    } finally {
      setIsPaused(false);
    }
  };

  return (
    <div
      className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden ring-4 ring-amber-500/30">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-white shrink-0 shadow-lg ring-2 ring-white/30">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60 inline-block mb-1">
              🎉 Nova Conquista Desbloqueada!
            </span>
            <h4 className="text-sm font-extrabold text-white truncate">
              {badge.title}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
              {badge.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                +{badge.xpReward} XP Bônus
              </span>

              <button
                type="button"
                onClick={handleShareAchievement}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] px-2.5 py-1 rounded-lg border border-indigo-400/40 inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                {shareStatus === 'idle' ? (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar Conquista</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {shareStatus === 'shared' ? 'Compartilhado!' : 'Link Copiado!'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar notificação de conquista"
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
