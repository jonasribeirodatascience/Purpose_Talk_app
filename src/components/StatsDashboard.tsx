import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  CalendarDays,
  BookOpen,
  Trophy,
  ArrowRight,
  Activity,
  Target,
} from 'lucide-react';
import {
  AchievementBadge,
  DailyActivityRecord,
  ThemeMode,
  UserLevel,
  VocabularyItem,
} from '../types';
import {
  buildActivityChartSeries,
  buildWeekdayCadence,
  ChartDayPoint,
} from '../utils/activityStats';

interface StatsDashboardProps {
  xp: number;
  streak: number;
  userLevel: UserLevel;
  vocabulary: VocabularyItem[];
  achievements: AchievementBadge[];
  dailyActivity: Record<string, DailyActivityRecord>;
  theme?: ThemeMode;
  onNavigateTab: (
    tab: 'avatars' | 'journey' | 'chat' | 'roleplay' | 'worship' | 'tech' | 'quiz' | 'vocab' | 'achievements' | 'stats'
  ) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDayPoint;
  }>;
}

const XpChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-slate-950/95 border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-slate-100">
        {point.weekdayPt}, {point.fullLabelPt}
      </div>
      <div className="flex items-center justify-between gap-5 text-indigo-300">
        <span>XP acumulado</span>
        <span className="font-bold tabular-nums">{point.cumulativeXp} XP</span>
      </div>
      <div className="flex items-center justify-between gap-5 text-emerald-300">
        <span>XP ganho no dia</span>
        <span className="font-bold tabular-nums">+{point.xpEarned} XP</span>
      </div>
      <div className="flex items-center justify-between gap-5 text-slate-400">
        <span>Atividades</span>
        <span className="font-semibold tabular-nums">{point.activitiesCount}</span>
      </div>
    </div>
  );
};

const ActivityChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-slate-950/95 border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-slate-100">
        {point.weekdayPt}, {point.fullLabelPt}
      </div>
      <div className="flex items-center justify-between gap-5 text-cyan-300">
        <span>Atividades concluídas</span>
        <span className="font-bold tabular-nums">{point.activitiesCount}</span>
      </div>
      <div className="flex items-center justify-between gap-5 text-indigo-300">
        <span>XP conquistado</span>
        <span className="font-semibold tabular-nums">+{point.xpEarned} XP</span>
      </div>
      {point.wordsSaved > 0 && (
        <div className="flex items-center justify-between gap-5 text-emerald-300">
          <span>Palavras salvas</span>
          <span className="font-semibold tabular-nums">{point.wordsSaved}</span>
        </div>
      )}
    </div>
  );
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  xp,
  streak,
  userLevel,
  vocabulary,
  achievements,
  dailyActivity,
  theme = 'dark',
  onNavigateTab,
}) => {
  const [windowDays, setWindowDays] = useState<7 | 14 | 30>(30);
  const [xpViewMode, setXpViewMode] = useState<'cumulative' | 'daily'>('cumulative');

  const isLight = theme === 'light';
  const gridStroke = isLight ? '#cbd5e1' : '#1e293b';
  const axisLineStroke = isLight ? '#94a3b8' : '#1e293b';
  const tickFill = isLight ? '#334155' : '#94a3b8';
  const weekdayTickFill = isLight ? '#0f172a' : '#cbd5e1';
  const xpCumulativeStroke = isLight ? '#4338ca' : '#818cf8';
  const xpDailyStroke = isLight ? '#047857' : '#34d399';
  const activeDotFill = isLight ? '#0f172a' : '#f8fafc';
  const emptyBarFill = isLight ? '#cbd5e1' : '#1e293b';
  const lowBarFill = isLight ? '#0891b2' : '#06b6d4';
  const highBarFill = isLight ? '#059669' : '#10b981';
  const refLineStroke = isLight ? '#0284c7' : '#38bdf8';
  const weekdayBarFill = isLight ? '#6d28d9' : '#8b5cf6';
  const cursorFill = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(148, 163, 184, 0.08)';

  const full30Series = useMemo(
    () => buildActivityChartSeries(dailyActivity, xp, 30),
    [dailyActivity, xp]
  );

  const activeSeries = useMemo(
    () => full30Series.slice(30 - windowDays),
    [full30Series, windowDays]
  );

  const weekdayData = useMemo(
    () => buildWeekdayCadence(full30Series),
    [full30Series]
  );

  // Key metrics derived from the 30-day dataset
  const statsSummary = useMemo(() => {
    const xpLast30 = full30Series.reduce((sum, d) => sum + d.xpEarned, 0);
    const totalActivities30 = full30Series.reduce((sum, d) => sum + d.activitiesCount, 0);
    const activeDaysCount = full30Series.filter(
      (d) => d.activitiesCount > 0 || d.xpEarned > 0
    ).length;
    const avgActivitiesPerDay = Number((totalActivities30 / 30).toFixed(1));
    const bestDay = full30Series.reduce(
      (best, cur) => (cur.xpEarned > best.xpEarned ? cur : best),
      full30Series[0]
    );
    const windowActivitiesAvg = Number(
      (
        activeSeries.reduce((s, d) => s + d.activitiesCount, 0) /
        Math.max(1, activeSeries.length)
      ).toFixed(1)
    );

    return {
      xpLast30,
      totalActivities30,
      activeDaysCount,
      consistencyPct: Math.round((activeDaysCount / 30) * 100),
      avgActivitiesPerDay,
      bestDay,
      windowActivitiesAvg,
    };
  }, [full30Series, activeSeries]);

  const vocabBreakdown = useMemo(() => {
    const total = Math.max(1, vocabulary.length);
    const techCount = vocabulary.filter((v) => v.category === 'tech').length;
    const worshipCount = vocabulary.filter((v) => v.category === 'worship').length;
    const generalCount = vocabulary.length - techCount - worshipCount;
    return [
      {
        label: 'Carreira Tech & Dados',
        count: techCount,
        pct: Math.round((techCount / total) * 100),
        barClass: 'bg-cyan-400',
      },
      {
        label: 'Louvores & Fé',
        count: worshipCount,
        pct: Math.round((worshipCount / total) * 100),
        barClass: 'bg-purple-400',
      },
      {
        label: 'Vocabulário Geral',
        count: generalCount,
        pct: Math.round((generalCount / total) * 100),
        barClass: 'bg-emerald-400',
      },
    ];
  }, [vocabulary]);

  const unlockedBadgesCount = achievements.filter((a) => a.isUnlocked).length;
  const levelLabel =
    userLevel === 'beginner'
      ? 'Iniciante (A2)'
      : userLevel === 'intermediate'
      ? 'Intermediário (B1-B2)'
      : 'Avançado (C1)';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Top Header & Timeframe Control */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="text-xs font-medium text-indigo-400 mb-1">
            Painel de Desempenho · {levelLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Estatísticas de Evolução
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Crescimento de XP e frequência diária de prática nos últimos 30 dias.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                windowDays === days
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>XP Total Acumulado</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {xp.toLocaleString('pt-BR')} XP
          </div>
          <div className="text-xs text-emerald-400 mt-1 tabular-nums">
            +{statsSummary.xpLast30.toLocaleString('pt-BR')} XP nos últimos 30d
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Frequência (30 dias)</span>
            <CalendarDays className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {statsSummary.activeDaysCount}/30 dias
          </div>
          <div className="text-xs text-slate-400 mt-1 tabular-nums">
            {statsSummary.consistencyPct}% de consistência · {streak}d de ofensiva
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Atividades Concluídas</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {statsSummary.totalActivities30}
          </div>
          <div className="text-xs text-slate-400 mt-1 tabular-nums">
            Média de {statsSummary.avgActivitiesPerDay} por dia
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Vocabulário & Medalhas</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            {vocabulary.length} termos
          </div>
          <div className="text-xs text-slate-400 mt-1 tabular-nums">
            {unlockedBadgesCount}/{achievements.length} conquistas desbloqueadas
          </div>
        </div>
      </div>

      {/* Chart 1: Primary Focal Anchor — XP Growth Over Last 30 Days */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Crescimento de XP ({windowDays} dias)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {xpViewMode === 'cumulative'
                ? 'Evolução da pontuação total acumulada ao longo do período.'
                : 'Pontos de experiência ganhos individualmente a cada dia.'}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setXpViewMode('cumulative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                xpViewMode === 'cumulative'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XP Acumulado
            </button>
            <button
              onClick={() => setXpViewMode('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                xpViewMode === 'daily'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XP Diário
            </button>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activeSeries}
              margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="xpAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="xpDailyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: axisLineStroke }}
                minTickGap={18}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<XpChartTooltip />} />
              <Area
                type="monotone"
                dataKey={xpViewMode === 'cumulative' ? 'cumulativeXp' : 'xpEarned'}
                stroke={xpViewMode === 'cumulative' ? xpCumulativeStroke : xpDailyStroke}
                strokeWidth={2.5}
                fill={
                  xpViewMode === 'cumulative'
                    ? 'url(#xpAreaGradient)'
                    : 'url(#xpDailyGradient)'
                }
                activeDot={{ r: 5, strokeWidth: 0, fill: activeDotFill }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Daily Activity Frequency BarChart */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Frequência de Atividades ({windowDays} dias)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quantidade diária de interações (conversas, pronúncia, quizzes e vocabulário).
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Média diária no período:</span>
            <span className="font-semibold text-cyan-300 tabular-nums">
              {statsSummary.windowActivitiesAvg} atividades
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeSeries}
              margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: axisLineStroke }}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                stroke="#64748b"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <Tooltip
                cursor={{ fill: cursorFill }}
                content={<ActivityChartTooltip />}
              />
              {statsSummary.windowActivitiesAvg > 0 && (
                <ReferenceLine
                  y={statsSummary.windowActivitiesAvg}
                  stroke={refLineStroke}
                  strokeDasharray="4 4"
                  strokeOpacity={0.75}
                />
              )}
              <Bar dataKey="activitiesCount" radius={[5, 5, 0, 0]} maxBarSize={28}>
                {activeSeries.map((entry) => (
                  <Cell
                    key={entry.date}
                    fill={
                      entry.activitiesCount >= 4
                        ? highBarFill
                        : entry.activitiesCount > 0
                        ? lowBarFill
                        : emptyBarFill
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bottom Analytics Row: Weekday Cadence + Vocabulary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Cadence Chart */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Ritmo por Dia da Semana
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuição das suas atividades nos últimos 30 dias.
              </p>
            </div>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekdayData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="weekday"
                  stroke="#64748b"
                  tick={{ fill: weekdayTickFill, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: axisLineStroke }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  tick={{ fill: tickFill, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: cursorFill }}
                  formatter={(value: unknown) => [`${Number(value)} atividades`, 'Frequência']}
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#020617',
                    borderColor: isLight ? '#94a3b8' : '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isLight ? '#0f172a' : '#f1f5f9',
                  }}
                />
                <Bar
                  dataKey="activities"
                  fill={weekdayBarFill}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Vocabulary Focus & Direct Next Step */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Equilíbrio do Vocabulário
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proporção dos {vocabulary.length} termos salvos por área.
                </p>
              </div>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-3 pt-1">
              {vocabBreakdown.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{item.label}</span>
                    <span className="text-slate-400 tabular-nums">
                      {item.count} termos · {item.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                      style={{ width: `${Math.max(item.pct, item.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Melhor dia recente:{' '}
                <strong className="text-slate-200">
                  {statsSummary.bestDay?.fullLabelPt} (+{statsSummary.bestDay?.xpEarned || 0} XP)
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('avatars')}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Praticar Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('journey')}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Ver Jornada
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
