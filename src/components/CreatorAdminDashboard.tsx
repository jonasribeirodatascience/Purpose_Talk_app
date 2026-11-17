import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Shield,
  Users,
  DollarSign,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Crown,
  Ban,
  Check,
  Database,
} from 'lucide-react';
import {
  LgpdConsentRecord,
  ThemeMode,
  UserSubscriptionRecord,
} from '../types';
import {
  CreatorAdminUserRow,
  fetchCreatorDashboardSnapshot,
  updateSubscriptionInCloud,
} from '../services/firestoreSync';
import { formatBrlFromCents } from '../data/subscriptionPlans';
import firebaseConfig from '../../firebase-applet-config.json';

interface CreatorAdminDashboardProps {
  theme?: ThemeMode;
  creatorEmail: string;
}

interface GatewayConfigResponse {
  recommendedGateway: string;
  gateways: {
    mercadopago: {
      configured: boolean;
      webhookSecretConfigured?: boolean;
      publicKeyConfigured?: boolean;
      label: string;
      payoutDestination: string;
      webhookUrl: string;
    };
  };
}

interface MercadoPagoVerifyResponse {
  configured?: boolean;
  valid?: boolean;
  mode?: 'live' | 'sandbox' | 'not_configured';
  webhookUrl?: string;
  webhookSecretConfigured?: boolean;
  publicKeyConfigured?: boolean;
  account?: {
    id: number | string;
    nickname: string;
    email?: string | null;
    siteId: string;
  } | null;
  error?: string;
  message?: string;
}

export const CreatorAdminDashboard: React.FC<CreatorAdminDashboardProps> = ({
  theme = 'dark',
  creatorEmail,
}) => {
  const [users, setUsers] = useState<CreatorAdminUserRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionRecord[]>([]);
  const [lgpdConsents, setLgpdConsents] = useState<LgpdConsentRecord[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfigResponse | null>(null);
  const [mpVerify, setMpVerify] = useState<MercadoPagoVerifyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const isLight = theme === 'light';
  const gridStroke = isLight ? '#cbd5e1' : '#1e293b';
  const tickFill = isLight ? '#334155' : '#94a3b8';
  const axisLineStroke = isLight ? '#94a3b8' : '#1e293b';

  const loadSnapshot = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [snapshot, gwRes, mpRes] = await Promise.all([
        fetchCreatorDashboardSnapshot(),
        fetch('/api/billing/config').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/billing/mercadopago/verify').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setUsers(snapshot.users);
      setSubscriptions(snapshot.subscriptions);
      setLgpdConsents(snapshot.lgpdConsents);
      if (gwRes) setGatewayConfig(gwRes);
      if (mpRes) setMpVerify(mpRes);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Erro ao carregar dados globais do Firestore. Verifique se você está autenticado com o e-mail criador.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const metrics = useMemo(() => {
    const trialingSubs = subscriptions.filter((s) => s.status === 'trialing');
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const canceledSubs = subscriptions.filter((s) => s.status === 'canceled');

    const toMonthlyCents = (sub: UserSubscriptionRecord) =>
      sub.billingCycle === 'annual'
        ? Math.round(sub.priceBrlCents / 12)
        : sub.priceBrlCents;

    const confirmedMrrCents = activeSubs.reduce((sum, s) => sum + toMonthlyCents(s), 0);
    const pipelineTrialMrrCents = trialingSubs.reduce((sum, s) => sum + toMonthlyCents(s), 0);
    const totalXpBase = users.reduce((sum, u) => sum + u.xp, 0);
    const avgXp = users.length > 0 ? Math.round(totalXpBase / users.length) : 0;
    const lgpdActiveCount = lgpdConsents.filter(
      (c) => c.acceptedTerms && c.acceptedPrivacy && !c.revokedAt
    ).length;

    return {
      totalUsers: users.length,
      trialingCount: trialingSubs.length,
      activeCount: activeSubs.length,
      canceledCount: canceledSubs.length,
      confirmedMrrCents,
      pipelineTrialMrrCents,
      projectedArrCents: (confirmedMrrCents + pipelineTrialMrrCents) * 12,
      avgXp,
      lgpdActiveCount,
    };
  }, [users, subscriptions, lgpdConsents]);

  const planDistributionData = useMemo(() => {
    const counts = [
      {
        name: 'Essencial (R$39,90)',
        count: subscriptions.filter((s) => s.planId === 'essencial_mensal' && s.status !== 'canceled').length,
        color: isLight ? '#0891b2' : '#06b6d4',
      },
      {
        name: 'Pro Mensal (R$59,90)',
        count: subscriptions.filter((s) => s.planId === 'pro_mensal' && s.status !== 'canceled').length,
        color: isLight ? '#4338ca' : '#818cf8',
      },
      {
        name: 'Pro Anual (R$478,80)',
        count: subscriptions.filter((s) => s.planId === 'pro_anual' && s.status !== 'canceled').length,
        color: isLight ? '#059669' : '#10b981',
      },
      {
        name: 'Canceladas',
        count: subscriptions.filter((s) => s.status === 'canceled').length,
        color: isLight ? '#dc2626' : '#f43f5e',
      },
    ];
    return counts;
  }, [subscriptions, isLight]);

  const topUsersChartData = useMemo(
    () =>
      users.slice(0, 6).map((u) => ({
        name: u.displayName.split(' ')[0].slice(0, 12),
        xp: u.xp,
        streak: u.streak,
      })),
    [users]
  );

  const subByUid = useMemo(() => {
    const map: Record<string, UserSubscriptionRecord> = {};
    subscriptions.forEach((s) => {
      map[s.uid] = s;
    });
    return map;
  }, [subscriptions]);

  const consentByUid = useMemo(() => {
    const map: Record<string, LgpdConsentRecord> = {};
    lgpdConsents.forEach((c) => {
      map[c.uid] = c;
    });
    return map;
  }, [lgpdConsents]);

  const handleAdminStatusChange = async (
    uid: string,
    nextStatus: 'active' | 'trialing' | 'canceled'
  ) => {
    setUpdatingUid(uid);
    try {
      await updateSubscriptionInCloud(uid, {
        status: nextStatus,
        cancelAtPeriodEnd: nextStatus === 'canceled',
      });
      await loadSnapshot();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao atualizar status da assinatura.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const firestoreConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;
  const firebaseAuthUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Creator Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>Painel Exclusivo do Criador · {creatorEmail}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Controle de Usuários, Assinaturas & Receita
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Indicadores consolidados do Firestore e configuração do gateway para recebimento em conta.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <a
            href={firestoreConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Abrir Firestore DB</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={firebaseAuthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Usuários Auth</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={loadSnapshot}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Atualizando...' : 'Atualizar Indicadores'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-4 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Usuários Cadastrados</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {metrics.totalUsers}
          </div>
          <div className="text-xs text-slate-400 mt-1 tabular-nums">
            Média de {metrics.avgXp.toLocaleString('pt-BR')} XP · {metrics.lgpdActiveCount} aceites LGPD
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Testes Grátis (7 dias)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {metrics.trialingCount}
          </div>
          <div className="text-xs text-amber-300 mt-1 tabular-nums">
            Potencial de {formatBrlFromCents(metrics.pipelineTrialMrrCents)}/mês
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>MRR Confirmado (Ativos)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {formatBrlFromCents(metrics.confirmedMrrCents)}
          </div>
          <div className="text-xs text-emerald-400 mt-1 tabular-nums">
            {metrics.activeCount} assinantes pagos · {metrics.canceledCount} cancelados
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ARR Projetado (Trial + Ativos)</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {formatBrlFromCents(metrics.projectedArrCents)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Receita anual estimada
          </div>
        </div>
      </div>

      {/* Payout Account & Mercado Pago Readiness Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Mercado Pago · Conta de Recebimento & Credenciais no Servidor
              </h3>
              <p className="text-xs text-slate-400">
                O valor cobrado no cartão de crédito após os 7 dias grátis cai diretamente na sua conta Mercado Pago.
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg self-start sm:self-auto ${
              mpVerify?.valid
                ? 'bg-emerald-600 text-white'
                : gatewayConfig?.gateways?.mercadopago?.configured
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-amber-300 border border-slate-700'
            }`}
          >
            {mpVerify?.valid
              ? `Conectado (${mpVerify.mode === 'sandbox' ? 'Sandbox' : 'Produção'})`
              : gatewayConfig?.gateways?.mercadopago?.configured
              ? 'Token configurado · Verificar alerta'
              : 'Aguardando MERCADOPAGO_ACCESS_TOKEN nos Secrets'}
          </span>
        </div>

        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3">
          {mpVerify?.account && (
            <p className="text-xs text-emerald-200">
              Conta recebedora conectada: <strong>{mpVerify.account.nickname}</strong>
              {mpVerify.account.email ? ` (${mpVerify.account.email})` : ''} · Região {mpVerify.account.siteId}
            </p>
          )}
          {mpVerify?.error && (
            <p className="text-xs text-rose-300">{mpVerify.error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-mono-code">MERCADOPAGO_ACCESS_TOKEN</span>
              <span className={gatewayConfig?.gateways?.mercadopago?.configured ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {gatewayConfig?.gateways?.mercadopago?.configured ? 'Ativo' : 'Pendente'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-mono-code">MERCADOPAGO_WEBHOOK_SECRET</span>
              <span className={mpVerify?.webhookSecretConfigured ? 'text-emerald-400 font-bold' : 'text-slate-400 font-semibold'}>
                {mpVerify?.webhookSecretConfigured ? 'Ativo' : 'Opcional'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-mono-code">VITE_MERCADOPAGO_PUBLIC_KEY</span>
              <span className={mpVerify?.publicKeyConfigured ? 'text-emerald-400 font-bold' : 'text-slate-400 font-semibold'}>
                {mpVerify?.publicKeyConfigured ? 'Ativa' : 'Opcional'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div>
              <span className="text-slate-400">Webhook Mercado Pago:</span>{' '}
              <span className="font-mono-code text-emerald-300 break-all">
                {mpVerify?.webhookUrl || gatewayConfig?.gateways?.mercadopago?.webhookUrl || '/api/billing/webhook/mercadopago'}
              </span>
            </div>
            <p className="text-slate-400">
              Por segurança, adicione suas chaves diretamente no painel de <strong>Secrets / Variáveis de Ambiente</strong> do servidor (nunca no código do navegador).
            </p>
          </div>
        </div>
      </section>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Distribuição de Assinaturas por Plano</h3>
            <p className="text-xs text-slate-400">
              Volume de assinantes (em teste de 7 dias ou ativos) e cancelamentos.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planDistributionData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: tickFill, fontSize: 11 }}
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
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#020617',
                    borderColor: isLight ? '#94a3b8' : '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isLight ? '#0f172a' : '#f1f5f9',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {planDistributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Engajamento dos Alunos (Top XP)</h3>
            <p className="text-xs text-slate-400">
              Pontuação acumulada pelos principais usuários da plataforma.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsersChartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: tickFill, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: axisLineStroke }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: tickFill, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#020617',
                    borderColor: isLight ? '#94a3b8' : '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isLight ? '#0f172a' : '#f1f5f9',
                  }}
                />
                <Bar
                  dataKey="xp"
                  fill={isLight ? '#4338ca' : '#818cf8'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Subscriptions & Users Control Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Usuários & Controle de Assinaturas ({users.length} alunos)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualize o nível, XP, plano contratado, forma de pagamento mascarada e altere o status manualmente quando necessário.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Aluno</th>
                <th className="py-2.5 px-3 font-semibold">Nível / Foco</th>
                <th className="py-2.5 px-3 font-semibold">XP / Streak</th>
                <th className="py-2.5 px-3 font-semibold">Plano & Valor</th>
                <th className="py-2.5 px-3 font-semibold">Meio de Pagamento</th>
                <th className="py-2.5 px-3 font-semibold">LGPD</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Ações do Criador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {isLoading ? 'Carregando usuários do Firestore...' : 'Nenhum usuário encontrado.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const sub = subByUid[u.uid];
                  const consent = consentByUid[u.uid];
                  const isBusy = updatingUid === u.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-slate-950/40">
                      <td className="py-3 pr-4">
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-[11px] text-slate-400 font-mono-code">
                          {sub?.userEmail || u.uid.slice(0, 14) + '...'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{u.userLevel}</div>
                        <div className="text-[11px] text-slate-400">{u.focus}</div>
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        <div className="font-bold text-indigo-300">{u.xp} XP</div>
                        <div className="text-[11px] text-amber-300">{u.streak}d ofensiva</div>
                      </td>
                      <td className="py-3 px-3">
                        {sub ? (
                          <div>
                            <div className="font-bold text-white">{sub.planName}</div>
                            <div className="text-[11px] text-slate-400">
                              {formatBrlFromCents(sub.priceBrlCents)} · {sub.gateway}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Sem assinatura</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {sub ? sub.paymentMethodLabel : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {consent && consent.acceptedTerms && consent.acceptedPrivacy && !consent.revokedAt ? (
                          <span className="text-[11px] font-semibold text-emerald-300">
                            Aceito v{consent.termsVersion}
                          </span>
                        ) : consent?.revokedAt ? (
                          <span className="text-[11px] font-semibold text-rose-300">
                            Revogado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {sub ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              sub.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : sub.status === 'trialing'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {sub.status === 'active'
                              ? 'Ativa'
                              : sub.status === 'trialing'
                              ? `Trial (${new Date(sub.trialEndsAt).toLocaleDateString('pt-BR')})`
                              : 'Cancelada'}
                          </span>
                        ) : (
                          <span className="text-slate-500">Gratuito</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {sub ? (
                          <div className="inline-flex items-center gap-1.5">
                            {sub.status !== 'active' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdminStatusChange(u.uid, 'active')}
                                title="Ativar assinatura paga manualmente"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Ativar</span>
                              </button>
                            )}
                            {sub.status !== 'trialing' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdminStatusChange(u.uid, 'trialing')}
                                title="Colocar em período de teste 7d"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Trial</span>
                              </button>
                            )}
                            {sub.status !== 'canceled' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdminStatusChange(u.uid, 'canceled')}
                                title="Cancelar assinatura"
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Cancelar</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
