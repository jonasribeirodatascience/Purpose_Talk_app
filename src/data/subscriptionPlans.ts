import { SubscriptionPlanConfig } from '../types';

export const CREATOR_ADMIN_EMAIL = 'jonasribeiro.datascience@gmail.com';

export const SUBSCRIPTION_TRIAL_DAYS = 7;

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'essencial_mensal',
    name: 'Essencial Mensal',
    taglinePt: 'Ideal para destravar a fala no dia a dia com 7 dias grátis',
    priceBrlCents: 3990,
    priceLabel: 'R$ 39,90',
    monthlyEquivalentLabel: 'por mês após 7 dias grátis',
    billingCycle: 'monthly',
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    featuresPt: [
      '7 dias grátis iniciais (cancele antes do 7º dia sem cobrança)',
      'Avatares Vivos em chamada de voz com sotaques US e UK',
      'Mentor de Texto & Áudio + Cenários Cotidianos (Roleplay)',
      'Análise de Pronúncia em tempo real com guia fonético',
      'Caderno de vocabulário e sincronização na nuvem (Firestore)',
    ],
  },
  {
    id: 'pro_mensal',
    name: 'Purpose Pro Mensal',
    taglinePt: 'Fluência completa para Carreira Tech & Louvores com IA avançada',
    priceBrlCents: 5990,
    priceLabel: 'R$ 59,90',
    monthlyEquivalentLabel: 'por mês após 7 dias grátis',
    billingCycle: 'monthly',
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    popular: true,
    badgeText: 'Mais Popular',
    featuresPt: [
      '7 dias grátis iniciais + tudo do plano Essencial',
      'Trilha Carreira Tech & Dados (Daily Standups, PRs e Entrevistas)',
      'Estudo completo de Louvores & Worship com contexto bíblico',
      'Painel Stats (30d) completo e Mapa de Jornada A1 → Fluência',
      'Prioridade na análise fonética de pronúncia via Gemini AI',
    ],
  },
  {
    id: 'pro_anual',
    name: 'Purpose Pro Anual',
    taglinePt: 'Economize 33% (4 meses grátis) no plano completo anual',
    priceBrlCents: 47880,
    priceLabel: 'R$ 478,80',
    monthlyEquivalentLabel: 'equivale a R$ 39,90/mês · 7 dias grátis',
    billingCycle: 'annual',
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    badgeText: 'Economize 33%',
    featuresPt: [
      '7 dias grátis iniciais com cancelamento em 1 clique',
      'Acesso completo a todos os módulos Tech, Louvor e Avatares por 12 meses',
      'Desconto equivalente a 4 meses gratuitos comparado ao Pro Mensal',
      'Acompanhamento de consistência, metas e conquistas ilimitadas',
      'Suporte prioritário e acesso antecipado a novos cenários',
    ],
  },
];

export const GATEWAY_RECOMMENDATIONS = [
  {
    id: 'mercadopago' as const,
    name: 'Mercado Pago (Recomendado Brasil)',
    recommended: true,
    summaryPt:
      'Melhor opção para operar no Brasil: suporta 7 dias grátis (Preapproval), Cartão de Crédito com validação de BIN e pré-autorização automática para evitar cartões sem saldo/limite, além de repasse direto para sua conta Mercado Pago ou transferência via PIX.',
    feesHintPt: 'Cartão de Crédito recorrente ~3,98% a 4,98% · Pré-validação sem custo após cancelamento imediato',
    payoutFlowPt: 'Saldo cai na sua conta Mercado Pago e pode ser transferido via PIX na hora para qualquer banco.',
  },
  {
    id: 'stripe' as const,
    name: 'Stripe Billing (Alternativa Global)',
    recommended: false,
    summaryPt:
      'Excelente para escalar internacionalmente (BRL ou USD) com trial nativo de 7 dias, Customer Portal e webhooks maduros. Não possui suporte nativo completo para PIX recorrente brasileiro.',
    feesHintPt: 'Cartão nacional ~3,99% + R$ 0,39 por cobrança',
    payoutFlowPt: 'Repasse automático em ciclos de D+2 a D+30 para sua conta bancária cadastrada na Stripe.',
  },
];

export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
