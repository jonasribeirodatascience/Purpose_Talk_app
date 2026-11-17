import React, { useState } from 'react';
import { 
  Award, 
  Flame, 
  BookMarked, 
  Terminal, 
  Cpu, 
  Code2, 
  HeartHandshake, 
  Sparkles, 
  PhoneCall, 
  Mic, 
  Radio, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Trophy, 
  Star,
  ChevronRight,
  Filter,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AchievementBadge, AchievementCategory, AchievementTier } from '../types';
import { tts } from '../utils/speech';

interface AchievementsViewProps {
  achievements: AchievementBadge[];
  xp: number;
  streak: number;
  wordsCount: number;
  onUnlockSimulate: (badgeId: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  xp,
  streak,
  wordsCount,
  onUnlockSimulate,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unlocked' | 'locked' | AchievementCategory>('all');
  const [activeBadgeModal, setActiveBadgeModal] = useState<AchievementBadge | null>(null);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalXpEarned = achievements
    .filter(a => a.isUnlocked)
    .reduce((acc, a) => acc + a.xpReward, 0);

  // Filter badges
  const filteredBadges = achievements.filter(badge => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unlocked') return badge.isUnlocked;
    if (selectedFilter === 'locked') return !badge.isUnlocked;
    return badge.category === selectedFilter;
  });

  const getIcon = (name: string, className: string = "w-6 h-6") => {
    switch (name) {
      case 'Flame': return <Flame className={className} />;
      case 'BookMarked': return <BookMarked className={className} />;
      case 'Terminal': return <Terminal className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Code2': return <Code2 className={className} />;
      case 'HeartHandshake': return <HeartHandshake className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'PhoneCall': return <PhoneCall className={className} />;
      case 'Mic': return <Mic className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Layers': return <Layers className={className} />;
      default: return <Award className={className} />;
    }
  };

  const getTierDetails = (tier: AchievementTier) => {
    switch (tier) {
      case 'bronze':
        return {
          label: 'Bronze',
          border: 'border-amber-700/60',
          bg: 'from-amber-950/40 via-slate-900 to-slate-950',
          glow: 'shadow-amber-900/20',
          text: 'text-amber-400',
          pill: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
          badgeRing: 'ring-amber-600/30 bg-gradient-to-tr from-amber-700 to-amber-900',
        };
      case 'silver':
        return {
          label: 'Prata',
          border: 'border-slate-400/50',
          bg: 'from-slate-800/40 via-slate-900 to-slate-950',
          glow: 'shadow-slate-500/20',
          text: 'text-slate-200',
          pill: 'bg-slate-800 text-slate-200 border-slate-600',
          badgeRing: 'ring-slate-400/40 bg-gradient-to-tr from-slate-400 to-slate-600',
        };
      case 'gold':
        return {
          label: 'Ouro',
          border: 'border-yellow-500/60',
          bg: 'from-yellow-950/40 via-slate-900 to-slate-950',
          glow: 'shadow-yellow-500/30',
          text: 'text-yellow-400',
          pill: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          badgeRing: 'ring-yellow-400/50 bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600',
        };
      case 'diamond':
        return {
          label: 'Diamante',
          border: 'border-cyan-400/70',
          bg: 'from-cyan-950/50 via-purple-950/30 to-slate-950',
          glow: 'shadow-cyan-400/40',
          text: 'text-cyan-300',
          pill: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
          badgeRing: 'ring-cyan-300/60 bg-gradient-to-tr from-cyan-400 via-purple-400 to-indigo-500',
        };
    }
  };

  const handleCelebrateBadge = (badge: AchievementBadge) => {
    setActiveBadgeModal(badge);
    if (badge.isUnlocked) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      tts.speak(`Badge unlocked: ${badge.title}! ${badge.description}`, 1.0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Sistema de Conquistas & Marcos de Fluência</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Galeria de Medalhas & Conquistas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Desbloqueie marcos épicos como <strong>'10-Day Streak'</strong>, <strong>'1000 Words Learned'</strong> e <strong>'Silicon Valley Mastery'</strong> completando todos os cenários profissionais!
            </p>
          </div>

          {/* Stats Badges Pill */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Medalhas</span>
              <span className="text-xl font-extrabold text-amber-400">
                {unlockedCount} <span className="text-xs text-slate-500">/ {achievements.length}</span>
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bônus de XP</span>
              <span className="text-xl font-extrabold text-purple-400">
                +{totalXpEarned}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              Nível Geral de Fluência: {Math.floor(xp / 300) + 1}
            </span>
            <span className="text-slate-400">
              {xp % 300} / 300 XP para o próximo nível
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${Math.min(100, Math.round(((xp % 300) / 300) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          Filtrar:
        </span>
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedFilter === 'all'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todas ({achievements.length})
        </button>
        <button
          onClick={() => setSelectedFilter('unlocked')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedFilter === 'unlocked'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Desbloqueadas ({unlockedCount})</span>
        </button>
        <button
          onClick={() => setSelectedFilter('streak')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedFilter === 'streak'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Ofensiva (10-Day Streak)</span>
        </button>
        <button
          onClick={() => setSelectedFilter('vocab')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedFilter === 'vocab'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>1000 Palavras</span>
        </button>
        <button
          onClick={() => setSelectedFilter('tech')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedFilter === 'tech'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Carreira Tech</span>
        </button>
        <button
          onClick={() => setSelectedFilter('worship')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            selectedFilter === 'worship'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Louvores & Fé</span>
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const tier = getTierDetails(badge.tier);
          const percent = Math.min(100, Math.round((badge.currentProgress / badge.targetProgress) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => handleCelebrateBadge(badge)}
              className={`group relative rounded-2xl p-5 border transition-all cursor-pointer bg-gradient-to-b ${tier.bg} ${tier.border} ${
                badge.isUnlocked
                  ? `hover:scale-[1.02] shadow-lg ${tier.glow}`
                  : 'opacity-70 hover:opacity-90'
              }`}
            >
              {/* Top Row: Tier pill & XP Reward */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${tier.pill}`}>
                  {tier.label}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    +{badge.xpReward} XP
                  </span>

                  {badge.isUnlocked ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Central Badge Graphic */}
              <div className="flex items-start gap-3.5 my-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ring-2 shrink-0 ${tier.badgeRing} ${
                  badge.isUnlocked ? 'text-white' : 'text-slate-400 grayscale'
                }`}>
                  {getIcon(badge.iconName, "w-7 h-7")}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition line-clamp-1">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Progresso:</span>
                  <span className="font-extrabold text-slate-200">
                    {badge.currentProgress} / {badge.targetProgress} {badge.category === 'streak' ? 'dias' : badge.category === 'vocab' ? 'palavras' : 'concluídos'}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {badge.isUnlocked && badge.unlockedAt && (
                  <p className="text-[10px] text-emerald-400 font-medium pt-0.5">
                    ✓ Desbloqueada • Toque para comemorar!
                  </p>
                )}
                {!badge.isUnlocked && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 italic">Faltam {Math.max(0, badge.targetProgress - badge.currentProgress)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockSimulate(badge.id);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                    >
                      Testar Desbloqueio
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {activeBadgeModal && (
        <div 
          onClick={() => setActiveBadgeModal(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white mx-auto shadow-xl ring-4 ring-yellow-400/30">
              {getIcon(activeBadgeModal.iconName, "w-10 h-10")}
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-700/60">
                Medalha {getTierDetails(activeBadgeModal.tier).label}
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">
                {activeBadgeModal.title}
              </h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                {activeBadgeModal.description}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Recompensa de Fluência:</span>
              <span className="font-extrabold text-amber-300">+{activeBadgeModal.xpReward} XP</span>
            </div>

            <button
              onClick={() => setActiveBadgeModal(null)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition"
            >
              Continuar Praticando
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
