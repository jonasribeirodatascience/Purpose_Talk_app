import React from 'react';
import {
  Sparkles,
  Code2,
  HeartHandshake,
  Layers,
  Compass,
  Radio,
  MapPin,
  Settings,
  BookOpen,
} from 'lucide-react';
import { UserLevel } from '../types';
import { useFirebase } from '../context/FirebaseContext';

export type AppTabId =
  | 'avatars'
  | 'journey'
  | 'chat'
  | 'roleplay'
  | 'worship'
  | 'tech'
  | 'quiz'
  | 'vocab'
  | 'achievements'
  | 'stats'
  | 'admin'
  | 'settings';

interface HeaderProps {
  currentTab: AppTabId;
  onTabChange: (tab: AppTabId) => void;
  userLevel: UserLevel;
  xp: number;
  streak: number;
}

const LEARNING_SUBJECT_TABS: Array<{
  id: AppTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'worship', label: 'Louvores', icon: HeartHandshake },
  { id: 'avatars', label: 'Conversação por Voz', icon: Radio },
  { id: 'chat', label: 'Mentor Guiado', icon: Sparkles },
  { id: 'journey', label: 'Jornada', icon: MapPin },
  { id: 'roleplay', label: 'Dia a Dia', icon: Compass },
  { id: 'tech', label: 'Tech & Dados', icon: Code2 },
  { id: 'quiz', label: 'Quizzes', icon: Layers },
  { id: 'vocab', label: 'Vocabulário', icon: BookOpen },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  userLevel,
  xp,
  streak,
}) => {
  const { authError, clearAuthError } = useFirebase();

  const levelSummaryLabel =
    userLevel === 'beginner'
      ? 'Iniciante'
      : userLevel === 'intermediate'
      ? 'Intermediário'
      : 'Avançado';

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Clean 3-Zone Top Bar: Brand — Quiet Learning Status — Full-Screen Settings Navigation */}
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Wordmark */}
          <button
            type="button"
            onClick={() => onTabChange('worship')}
            className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            Purpose{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300">
              Talk
            </span>
          </button>

          {/* Zone 2: Quiet Unboxed Learning Progress Metadata */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
            <span>Nível {levelSummaryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{streak} dias seguidos</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{xp} XP</span>
          </div>

          {/* Zone 3: Open Full-Page Settings Screen */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange('settings')}
              aria-label="Abrir configurações em tela cheia"
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Configurações</span>
            </button>
          </div>
        </div>

        {authError && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
            <span>{authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-rose-300 hover:text-white underline font-semibold shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Main Screen Navigation: Learning Subjects Only */}
        <nav
          aria-label="Assuntos de aprendizagem"
          className="mt-2.5 flex items-center gap-1 sm:gap-2 border-t border-slate-800/80 pt-2.5 overflow-x-auto no-scrollbar"
        >
          {LEARNING_SUBJECT_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
