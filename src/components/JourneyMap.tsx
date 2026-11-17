import React, { useState } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Code2, 
  HeartHandshake, 
  Radio, 
  Compass, 
  Trophy, 
  Flame, 
  Volume2, 
  PenTool, 
  Check, 
  Filter, 
  Layers, 
  Play,
  RotateCcw,
  Star,
  Target
} from 'lucide-react';
import { JourneyMilestone, JourneyPillar, UserLevel } from '../types';
import { JOURNEY_MILESTONES, JOURNEY_STAGES } from '../data/journeyRoadmap';
import { tts } from '../utils/speech';

interface JourneyMapProps {
  userLevel: UserLevel;
  xp: number;
  streak: number;
  speechRate: number;
  onNavigateTab: (tab: 'avatars' | 'chat' | 'roleplay' | 'worship' | 'tech' | 'quiz' | 'vocab' | 'achievements') => void;
  onAddXp: (amount: number) => void;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  userLevel,
  xp,
  streak,
  speechRate,
  onNavigateTab,
  onAddXp,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<JourneyPillar | 'all'>('all');
  const [completedManualMilestones, setCompletedManualMilestones] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('purpose_talk_completed_milestones');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  const toggleMilestoneComplete = (milestoneId: string, xpReward: number) => {
    setCompletedManualMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
        onAddXp(xpReward);
      }
      localStorage.setItem('purpose_talk_completed_milestones', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const isMilestoneCompleted = (milestone: JourneyMilestone) => {
    return completedManualMilestones.has(milestone.id) || xp >= milestone.requiredXp + 60;
  };

  const isMilestoneUnlocked = (milestone: JourneyMilestone) => {
    return xp >= milestone.requiredXp || milestone.stepNumber <= 2;
  };

  // Find next recommended milestone
  const nextMilestone = JOURNEY_MILESTONES.find(m => !isMilestoneCompleted(m)) || JOURNEY_MILESTONES[JOURNEY_MILESTONES.length - 1];

  // Calculate completed count
  const completedCount = JOURNEY_MILESTONES.filter(isMilestoneCompleted).length;
  const overallPercentage = Math.round((completedCount / JOURNEY_MILESTONES.length) * 100);

  // Filtered milestones
  const filteredMilestones = JOURNEY_MILESTONES.filter(m => {
    if (selectedPillar === 'all') return true;
    return m.pillar === selectedPillar;
  });

  const getPillarBadge = (pillar: JourneyPillar) => {
    switch (pillar) {
      case 'tech':
        return {
          label: 'Tecnologia & Dados',
          icon: <Code2 className="w-3.5 h-3.5 text-cyan-400" />,
          colorClass: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/60',
          dotColor: 'bg-cyan-400',
        };
      case 'worship':
        return {
          label: 'Louvores & Adoração',
          icon: <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />,
          colorClass: 'text-purple-300 bg-purple-950/60 border-purple-800/60',
          dotColor: 'bg-purple-400',
        };
      case 'conversation':
        return {
          label: 'Conversação & Avatares',
          icon: <Radio className="w-3.5 h-3.5 text-violet-400" />,
          colorClass: 'text-violet-300 bg-violet-950/60 border-violet-800/60',
          dotColor: 'bg-violet-400',
        };
      case 'bridge':
        return {
          label: 'Conexão & Fluência Plena',
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
          colorClass: 'text-amber-300 bg-amber-950/60 border-amber-800/60',
          dotColor: 'bg-amber-400',
        };
    }
  };

  const handleSpeakPhrase = (text: string) => {
    tts.speak(text, speechRate);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Top Hero Banner: Interactive Journey Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
              <span>Mapa da Sua Jornada até a Fluência</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A Trilha Completa: do <span className="text-cyan-400">Iniciante</span> à <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300">Fluência Plena</span>
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              O Purpose Talk une <strong>Tecnologia & Dados</strong>, <strong>Louvores Internacionais</strong> e <strong>Conversação com Avatares Vivos</strong> em uma única linha pedagógica progressiva. Cada marco exercita a pronúncia correta de brasileiros e a escrita para consolidar sua confiança.
            </p>

            {/* Quick Three Pillars Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Carreira Tech (Daily, PRs, Entrevistas)</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span>Louvores (Way Maker, Oração, Canto)</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                <span>Conversação Real (Avatares Nativos)</span>
              </div>
            </div>
          </div>

          {/* Progress Card in Hero */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:min-w-[280px] shadow-xl text-center flex flex-col items-center justify-center">
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-900 shadow-inner">
                <span className="text-2xl font-black text-white">{overallPercentage}%</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-200 mt-1">
              Progresso Geral da Trilha
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {completedCount} de {JOURNEY_MILESTONES.length} marcos dominados
            </div>

            {/* XP and streak indicator */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 w-full flex items-center justify-around text-xs">
              <div className="flex items-center gap-1 text-purple-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{xp} XP Acumulados</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-amber-300 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{streak} Dias Seguidos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Recommended Step Highlight Card */}
      {nextMilestone && (
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50 border border-amber-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  Próximo Marco Recomendado para Você
                </span>
                <span className="text-xs text-slate-400">
                  {nextMilestone.stageNamePt} · {nextMilestone.levelBadge}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Passo {nextMilestone.stepNumber}:</span>
                <span className="text-amber-200">{nextMilestone.titlePt}</span>
              </h3>
              
              <p className="text-xs text-slate-300 max-w-2xl">
                {nextMilestone.descriptionPt}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab(nextMilestone.recommendedAction.tab)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 shrink-0"
            >
              <span>{nextMilestone.recommendedAction.labelPt}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter by Pillar Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filtrar Pilares da Trilha:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedPillar === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos os Pilares ({JOURNEY_MILESTONES.length})
          </button>

          <button
            onClick={() => setSelectedPillar('tech')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              selectedPillar === 'tech'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tecnologia & Dados</span>
          </button>

          <button
            onClick={() => setSelectedPillar('worship')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              selectedPillar === 'worship'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Louvores</span>
          </button>

          <button
            onClick={() => setSelectedPillar('conversation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              selectedPillar === 'conversation'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-violet-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Conversação & Avatares</span>
          </button>

          <button
            onClick={() => setSelectedPillar('bridge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              selectedPillar === 'bridge'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conexão / Quizzes</span>
          </button>
        </div>
      </div>

      {/* Progressive Stages & Connected Milestones */}
      <div className="space-y-10">
        {JOURNEY_STAGES.map((stage) => {
          const stageMilestones = filteredMilestones.filter(m => m.stageLevel === stage.id);
          if (stageMilestones.length === 0) return null;

          const isStageUnlocked = xp >= stage.minXp;
          const stageCompletedMilestones = stageMilestones.filter(isMilestoneCompleted).length;
          const isStageFinished = stageCompletedMilestones === stageMilestones.length;

          return (
            <div 
              key={stage.id} 
              className={`rounded-2xl border transition-all ${
                isStageUnlocked 
                  ? 'bg-slate-900/60 border-slate-800' 
                  : 'bg-slate-950/40 border-slate-900 opacity-75'
              } p-5 sm:p-6 shadow-xl relative`}
            >
              {/* Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-gradient-to-r ${stage.colorGradient} text-white shadow-sm`}>
                      {stage.levelBadge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {stage.nameEn}
                    </span>
                    {isStageFinished && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Fase Concluída!
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {stage.namePt}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                    {stage.descriptionPt}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[11px]">Progresso da Fase:</span>
                    <span className="font-extrabold text-white">
                      {stageCompletedMilestones} / {stageMilestones.length} marcos
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                    {Math.round((stageCompletedMilestones / stageMilestones.length) * 100)}%
                  </div>
                </div>
              </div>

              {/* Milestones Road Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageMilestones.map((milestone) => {
                  const completed = isMilestoneCompleted(milestone);
                  const unlocked = isMilestoneUnlocked(milestone);
                  const pillarBadge = getPillarBadge(milestone.pillar);

                  return (
                    <div
                      key={milestone.id}
                      className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all relative overflow-hidden ${
                        completed
                          ? 'bg-slate-950/90 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : unlocked
                          ? 'bg-slate-950/95 border-slate-700 hover:border-indigo-500/50 shadow-md'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      {/* Top Bar of Card */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${pillarBadge.colorClass}`}>
                            {pillarBadge.icon}
                            <span>{pillarBadge.label}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-400">
                              Passo {milestone.stepNumber}
                            </span>
                            {completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : unlocked ? (
                              <Circle className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                          {milestone.titlePt}
                        </h4>
                        <div className="text-[11px] text-slate-400 italic mb-2">
                          "{milestone.titleEn}"
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {milestone.descriptionPt}
                        </p>

                        {/* Pronunciation & Writing Goal Pills */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between text-purple-300 font-semibold text-[10px] uppercase">
                              <span className="flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-purple-400" />
                                Meta de Pronúncia:
                              </span>
                              <button
                                onClick={() => handleSpeakPhrase(milestone.titleEn)}
                                className="text-slate-400 hover:text-white"
                                title="Ouvir título em inglês"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-slate-300 text-[11px]">
                              {milestone.pronunciationGoalPt}
                            </p>
                          </div>

                          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 space-y-1">
                            <span className="flex items-center gap-1 text-indigo-300 font-semibold text-[10px] uppercase">
                              <PenTool className="w-3 h-3 text-indigo-400" />
                              Meta de Escrita:
                            </span>
                            <p className="text-slate-300 text-[11px]">
                              {milestone.writingGoalPt}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Action & Completion Status */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleMilestoneComplete(milestone.id, milestone.xpReward)}
                          className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                            completed
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{completed ? 'Dominado' : 'Marcar Feito'}</span>
                        </button>

                        <button
                          onClick={() => onNavigateTab(milestone.recommendedAction.tab)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition shadow-sm"
                        >
                          <span>{milestone.recommendedAction.labelPt.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
