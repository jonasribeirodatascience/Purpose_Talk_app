import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CalendarClock,
  Lock,
  AlertCircle,
  ExternalLink,
  Crown,
  CheckCircle2,
  Ban,
  LogOut,
  ArrowRight,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import {
  PaymentMethodRecord,
  SubscriptionPlanId,
  UserSubscriptionRecord,
} from '../types';
import {
  formatBrlFromCents,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_TRIAL_DAYS,
} from '../data/subscriptionPlans';
import {
  detectCardBrand,
  digitsOnly,
  formatCardNumberDisplay,
  formatCpfInput,
  formatExpiryInput,
  getBrandDisplayName,
  isValidCpf,
  isValidLuhn,
  parseAndValidateExpiry,
} from '../utils/paymentValidation';
import { validateCreditCardWithMercadoPago } from '../utils/mercadoPagoClient';
import { useFirebase } from '../context/FirebaseContext';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethods: PaymentMethodRecord[];
  subscription: UserSubscriptionRecord | null;
  onAddPaymentMethod: (method: PaymentMethodRecord) => Promise<void>;
  onActivateSubscription: (sub: UserSubscriptionRecord) => Promise<void>;
  onUpdateSubscription: (
    patch: Partial<
      Pick<
        UserSubscriptionRecord,
        'status' | 'cancelAtPeriodEnd' | 'planId' | 'planName' | 'priceBrlCents' | 'billingCycle'
      >
    >
  ) => Promise<void>;
  lgpdAccepted?: boolean;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
  onAcceptLgpd?: () => Promise<void>;
  isRequiredOnboarding?: boolean;
  userEmail?: string | null;
  userName?: string | null;
  onSignOut?: () => Promise<void>;
  onContinueToApp?: () => void;
  isCreatorAdmin?: boolean;
  onBypassAsCreator?: () => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  paymentMethods,
  subscription,
  onAddPaymentMethod,
  onActivateSubscription,
  onUpdateSubscription,
  lgpdAccepted = false,
  onOpenLegal,
  onAcceptLgpd,
  isRequiredOnboarding = false,
  userEmail,
  userName,
  onSignOut,
  onContinueToApp,
  isCreatorAdmin = false,
  onBypassAsCreator,
}) => {
  const { user } = useFirebase();

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(
    subscription?.planId || 'pro_mensal'
  );

  const creditCards = paymentMethods.filter((m) => m.type === 'credit_card');
  const hasExistingActiveAccess = Boolean(
    subscription && (subscription.status === 'trialing' || subscription.status === 'active')
  );

  // Payment method selection (apenas se já tiver assinatura ativa/trialing) ou cadastro obrigatório de cartão de crédito validado
  const [useNewMethod, setUseNewMethod] = useState<boolean>(
    !hasExistingActiveAccess || creditCards.length === 0
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    creditCards.find((m) => m.isDefault)?.id || creditCards[0]?.id || ''
  );

  // Credit card registration inputs (only credit_card allowed)
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderCpf, setHolderCpf] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusLabel, setSubmitStatusLabel] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [liveCheckoutUrl, setLiveCheckoutUrl] = useState<string | null>(null);
  const [acceptedLegalInModal, setAcceptedLegalInModal] = useState<boolean>(lgpdAccepted);
  const [onboardingActivated, setOnboardingActivated] = useState<boolean>(false);
  const [activatedSummary, setActivatedSummary] = useState<{
    planName: string;
    priceLabel: string;
    billingCycle: 'monthly' | 'annual';
    paymentMethodLabel: string;
    trialEndsAt: number;
  } | null>(null);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    setIsCanceling(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const endpoint =
        subscription.gateway === 'mercadopago'
          ? '/api/billing/mercadopago/cancel'
          : '/api/billing/cancel-subscription';

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: subscription.gateway,
          gatewaySubscriptionId: subscription.gatewaySubscriptionId,
          cancelScope: 'preapproval',
          userId: subscription.uid,
        }),
      });
      const apiData = await apiRes.json().catch(() => ({}));
      if (!apiRes.ok) {
        throw new Error(apiData?.error || 'Não foi possível cancelar a assinatura.');
      }

      await onUpdateSubscription({ cancelAtPeriodEnd: true, status: 'canceled' });
      setSuccessMsg(
        apiData?.message ||
          'Assinatura cancelada com sucesso. Nenhuma cobrança futura será realizada.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao cancelar assinatura.');
    } finally {
      setIsCanceling(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLiveCheckoutUrl(null);
    setOnboardingActivated(false);
    setActivatedSummary(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setAcceptedLegalInModal(lgpdAccepted);
  }, [isOpen, lgpdAccepted]);

  useEffect(() => {
    if (!isOpen) return;
    if (!hasExistingActiveAccess || creditCards.length === 0) {
      setUseNewMethod(true);
      setSelectedMethodId('');
    } else if (!selectedMethodId || !creditCards.some((m) => m.id === selectedMethodId)) {
      const def = creditCards.find((m) => m.isDefault) || creditCards[0];
      setSelectedMethodId(def.id);
    }
  }, [isOpen, paymentMethods, selectedMethodId, hasExistingActiveAccess]);

  if (!isOpen) return null;

  const activePlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];
  const detectedBrand = detectCardBrand(cardNumber);

  const daysRemaining = subscription
    ? Math.max(0, Math.ceil((subscription.trialEndsAt - Date.now()) / 86400000))
    : SUBSCRIPTION_TRIAL_DAYS;

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLiveCheckoutUrl(null);
    setIsSubmitting(true);
    setSubmitStatusLabel('Validando cartão de crédito...');

    try {
      if (!acceptedLegalInModal) {
        throw new Error(
          'Confirme o aceite dos Termos de Uso e da Política de Privacidade (LGPD) antes de ativar os 7 dias grátis.'
        );
      }

      if (!lgpdAccepted && onAcceptLgpd) {
        await onAcceptLgpd();
      }

      let chosenMethod = creditCards.find((m) => m.id === selectedMethodId);
      const mustValidateCardNow =
        useNewMethod || !chosenMethod || !hasExistingActiveAccess || isRequiredOnboarding;

      let validationPaymentId: string | undefined;
      let subscriptionCardTokenId: string | undefined;

      if (mustValidateCardNow) {
        const cleanHolder = holderName.trim();
        if (cleanHolder.length < 2) {
          throw new Error('Informe o nome completo impresso no cartão de crédito.');
        }

        if (!isValidCpf(holderCpf)) {
          throw new Error('Informe um CPF válido do titular para a validação antifraude do cartão.');
        }

        if (!isValidLuhn(cardNumber)) {
          throw new Error('Número do cartão de crédito inválido. Confira os dígitos antes de continuar.');
        }

        const expCheck = parseAndValidateExpiry(expiry);
        if (!expCheck.valid || !expCheck.month || !expCheck.year) {
          throw new Error(expCheck.error || 'Validade do cartão inválida.');
        }

        const cleanCvv = digitsOnly(cvv);
        const minCvv = detectedBrand === 'amex' ? 4 : 3;
        if (cleanCvv.length < minCvv || cleanCvv.length > 4) {
          throw new Error(`Informe os ${minCvv} dígitos do CVV.`);
        }

        setSubmitStatusLabel('Verificando bandeira e limite disponível (sem cobrança)...');
        const mpCheck = await validateCreditCardWithMercadoPago({
          cardNumber,
          holderName: cleanHolder,
          cpf: holderCpf,
          expiryMonth: expCheck.month,
          expiryYear: expCheck.year,
          cvv: cleanCvv,
          payerEmail: user?.email || userEmail || 'aluno@purposetalk.app',
          userId: user?.uid || 'local_user',
          createSubscriptionToken: true,
        });

        validationPaymentId = mpCheck.validationPaymentId;
        subscriptionCardTokenId = mpCheck.subscriptionCardTokenId;

        const newMethodId = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const last4 = digitsOnly(cardNumber).slice(-4);
        const brandLabel = getBrandDisplayName(detectedBrand);

        chosenMethod = {
          id: newMethodId,
          type: 'credit_card',
          label: `${brandLabel} Crédito •••• ${last4}`.slice(0, 80),
          holderName: cleanHolder.toUpperCase().slice(0, 80),
          brand: detectedBrand,
          last4,
          expiryMonth: expCheck.month,
          expiryYear: expCheck.year,
          isDefault: true,
          createdAt: Date.now(),
        };

        await onAddPaymentMethod(chosenMethod);
        setSelectedMethodId(chosenMethod.id);
        setUseNewMethod(false);
        setCardNumber('');
        setCvv('');
        setExpiry('');
        setHolderCpf('');
      }

      if (!chosenMethod) {
        throw new Error('Selecione ou valide um cartão de crédito para continuar.');
      }

      setSubmitStatusLabel('Ativando 7 dias grátis...');

      // Call server billing route to initiate Mercado Pago trial
      const apiRes = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan.id,
          userEmail: user?.email || userEmail || 'aluno@purposetalk.app',
          userId: user?.uid || 'local_user',
          preferredGateway: 'mercadopago',
          paymentMethodLabel: chosenMethod.label,
          paymentMethodType: 'credit_card',
          cardTokenId: subscriptionCardTokenId,
          validationPaymentId,
        }),
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok) {
        throw new Error(apiData?.error || 'Não foi possível preparar a assinatura no gateway.');
      }

      const now = Date.now();
      const trialEnd = now + SUBSCRIPTION_TRIAL_DAYS * 86400000;

      const subRecord: UserSubscriptionRecord = {
        uid: user?.uid || 'local_user',
        userEmail: user?.email || userEmail || 'aluno@purposetalk.app',
        userName: user?.displayName || chosenMethod.holderName || 'Aluno Purpose Talk',
        planId: activePlan.id,
        planName: activePlan.name,
        priceBrlCents: activePlan.priceBrlCents,
        billingCycle: activePlan.billingCycle,
        status: 'trialing',
        gateway: 'mercadopago',
        paymentMethodId: chosenMethod.id,
        paymentMethodLabel: chosenMethod.label,
        trialDays: SUBSCRIPTION_TRIAL_DAYS,
        trialStartedAt: now,
        trialEndsAt: trialEnd,
        nextBillingAt: trialEnd,
        gatewaySubscriptionId: apiData.gatewaySubscriptionId || undefined,
        cancelAtPeriodEnd: false,
        createdAt: subscription?.createdAt || now,
        updatedAt: now,
      };

      await onActivateSubscription(subRecord);

      if (apiData.checkoutUrl) {
        setLiveCheckoutUrl(apiData.checkoutUrl);
      }

      setActivatedSummary({
        planName: activePlan.name,
        priceLabel: activePlan.priceLabel,
        billingCycle: activePlan.billingCycle,
        paymentMethodLabel: chosenMethod.label,
        trialEndsAt: trialEnd,
      });

      if (isRequiredOnboarding) {
        setOnboardingActivated(true);
      }

      setSuccessMsg(
        `Período de 7 dias grátis do plano ${activePlan.name} ativado com ${chosenMethod.label}! Primeira cobrança prevista para ${new Date(
          trialEnd
        ).toLocaleDateString('pt-BR')}.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao iniciar teste grátis.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatusLabel(null);
    }
  };

  const outerWrapperClass = isRequiredOnboarding
    ? 'min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4';

  const cardContainerClass = isRequiredOnboarding
    ? 'bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden'
    : 'bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col';

  const bodyContainerClass = isRequiredOnboarding
    ? 'p-5 sm:p-7 space-y-6'
    : 'flex-1 overflow-y-auto p-6 space-y-6';

  return (
    <div
      className={outerWrapperClass}
      role={isRequiredOnboarding ? 'region' : 'dialog'}
      aria-modal={isRequiredOnboarding ? undefined : true}
      aria-labelledby="plans-modal-title"
    >
      <div className={cardContainerClass}>
        {/* Top Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              {isRequiredOnboarding && (
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                  Etapa obrigatória antes de iniciar · R$ 0,00 hoje
                </div>
              )}
              <h2 id="plans-modal-title" className="text-lg font-extrabold text-white tracking-tight">
                {isRequiredOnboarding
                  ? 'Escolha seu Plano e Valide seu Cartão de Crédito'
                  : 'Planos Purpose Talk · 7 Dias Grátis Iniciais'}
              </h2>
              <p className="text-xs text-slate-400">
                Somente cartão de crédito ativo · Validação de limite sem cobrança inicial (R$ 0,00 hoje)
              </p>
            </div>
          </div>

          {isRequiredOnboarding ? (
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              {(userName || userEmail) && (
                <span className="text-xs text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg truncate max-w-[210px]">
                  {userName || userEmail}
                </span>
              )}
              {isCreatorAdmin && onBypassAsCreator && (
                <button
                  type="button"
                  onClick={onBypassAsCreator}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-200 text-xs font-semibold transition cursor-pointer"
                >
                  Acesso Criador
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut().catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar planos e assinatura"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className={bodyContainerClass}>
          {isRequiredOnboarding && onboardingActivated && activatedSummary ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-indigo-950/40 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>7 Dias Grátis Liberados · R$ 0,00 Cobrado Hoje</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    Tudo pronto! Seu período de testes foi ativado.
                  </h3>
                  <p className="text-xs text-slate-300">
                    Nenhuma cobrança foi realizada agora. A primeira cobrança acontecerá somente após os {SUBSCRIPTION_TRIAL_DAYS} dias grátis, caso você não cancele antes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                  <div className="text-[11px] text-slate-400">Plano Escolhido</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">{activatedSummary.planName}</div>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                  <div className="text-[11px] text-slate-400">Forma de Pagamento</div>
                  <div className="text-sm font-extrabold text-white mt-0.5 truncate">
                    {activatedSummary.paymentMethodLabel}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                  <div className="text-[11px] text-slate-400">Cobrança Inicial Hoje</div>
                  <div className="text-sm font-extrabold text-emerald-400 mt-0.5">R$ 0,00</div>
                </div>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                  <div className="text-[11px] text-slate-400">1ª Cobrança Após Testes</div>
                  <div className="text-sm font-extrabold text-amber-300 mt-0.5">
                    {new Date(activatedSummary.trialEndsAt).toLocaleDateString('pt-BR')} ·{' '}
                    {activatedSummary.priceLabel}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                {liveCheckoutUrl ? (
                  <a
                    href={liveCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold transition"
                  >
                    <span>Autorizar assinatura recorrente no Mercado Pago</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">
                    Você pode gerenciar ou cancelar sua assinatura a qualquer momento em Configurações.
                  </span>
                )}

                {onContinueToApp && (
                  <button
                    type="button"
                    onClick={onContinueToApp}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <span>Entrar no Purpose Talk Agora</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {isRequiredOnboarding && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-200 space-y-1 leading-relaxed">
                    <div className="font-bold text-emerald-300">
                      Somente Cartão de Crédito · Validação de limite sem cobrança inicial (R$ 0,00 hoje)
                    </div>
                    <p className="text-slate-300">
                      Para evitar cartões inválidos ou sem limite, realizamos uma pré-autorização temporária de R$ 1,50 cancelada automaticamente na hora (sem cobrança na fatura). A primeira cobrança ocorre apenas após os {SUBSCRIPTION_TRIAL_DAYS} dias grátis, caso não cancele antes.
                    </p>
                  </div>
                </div>
              )}
          {/* Active Subscription Banner */}
          {subscription && (
            <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-white">
                    Assinatura Atual: {subscription.planName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      subscription.status === 'canceled'
                        ? 'bg-rose-500/20 text-rose-300'
                        : subscription.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {subscription.status === 'trialing'
                      ? `7 dias grátis (${daysRemaining}d restantes)`
                      : subscription.status === 'active'
                      ? 'Ativa'
                      : subscription.status === 'canceled'
                      ? 'Cancelada'
                      : 'Pendente'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Meio vinculado: <strong>{subscription.paymentMethodLabel}</strong> · Gateway:{' '}
                  <strong>{subscription.gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}</strong> ·{' '}
                  {subscription.cancelAtPeriodEnd
                    ? `Cancelamento agendado para ${new Date(subscription.trialEndsAt).toLocaleDateString('pt-BR')}`
                    : `Próxima cobrança (${formatBrlFromCents(subscription.priceBrlCents)}): ${new Date(
                        subscription.nextBillingAt
                      ).toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {subscription.status !== 'canceled' && !subscription.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    disabled={isCanceling}
                    onClick={handleCancelSubscription}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isCanceling ? 'Cancelando...' : 'Cancelar Assinatura'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSubscription({ cancelAtPeriodEnd: false, status: 'trialing' })
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reativar</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Pricing Plans Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>1. Escolha seu Plano (Todos com 7 dias grátis)</span>
              </h3>
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                Cobrança de R$ 0,00 hoje · Cancele quando quiser
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`text-left rounded-2xl border p-5 flex flex-col justify-between transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-white">{plan.name}</span>
                        {plan.badgeText && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              plan.popular
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {plan.badgeText}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-white tabular-nums">
                            {plan.priceLabel}
                          </span>
                          <span className="text-xs text-slate-400">
                            /{plan.billingCycle === 'annual' ? 'ano' : 'mês'}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                          {plan.monthlyEquivalentLabel}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400">{plan.taglinePt}</p>

                      <ul className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        {plan.featuresPt.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className={`mt-4 pt-3 border-t border-slate-800/80 text-xs font-bold flex items-center justify-between ${
                        isSelected ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      <span>{isSelected ? 'Plano selecionado' : 'Selecionar plano'}</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Recommended Gateway + Payment Method Registration */}
          <form onSubmit={handleStartTrial} className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>2. Cadastre e Valide seu Cartão de Crédito (Somente Crédito)</span>
                </h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verificação antifraude & limite Mercado Pago · Sem salvar CVV
                </span>
              </div>

              {/* Saved Credit Cards (only selectable when user already holds an active/trialing subscription and wants to switch plans) */}
              {hasExistingActiveAccess && creditCards.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Usar cartão de crédito já validado ou cadastrar novo:
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseNewMethod((v) => !v)}
                      className="text-indigo-300 hover:text-white font-semibold underline cursor-pointer"
                    >
                      {useNewMethod ? 'Usar cartão já salvo' : '+ Cadastrar novo cartão de crédito'}
                    </button>
                  </div>

                  {!useNewMethod && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {creditCards.map((pm) => {
                        const chosen = selectedMethodId === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setSelectedMethodId(pm.id)}
                            className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition cursor-pointer ${
                              chosen
                                ? 'bg-indigo-950/40 border-indigo-500'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {pm.label}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {pm.holderName} · •••• {pm.last4}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                chosen
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'border-slate-600'
                              }`}
                            >
                              {chosen && <Check className="w-2.5 h-2.5" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Credit Card Validation Form */}
              {(useNewMethod || !hasExistingActiveAccess || creditCards.length === 0) && (
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold">
                      <CreditCard className="w-3.5 h-3.5" />
                      Modalidade exclusiva: Cartão de Crédito (validação em tempo real)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Pré-autorização de R$ 1,50 cancelada automaticamente após confirmar limite
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Número do Cartão de Crédito ({getBrandDisplayName(detectedBrand)})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumberDisplay(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="12/29"
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        autoComplete="cc-name"
                        placeholder="Ex: JONAS RIBEIRO"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        CPF do Titular
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={holderCpf}
                        onChange={(e) => setHolderCpf(formatCpfInput(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                  {liveCheckoutUrl && (
                    <a
                      href={liveCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold shrink-0"
                    >
                      <span>Concluir no Mercado Pago</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* LGPD & Terms Acceptance Confirmation */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedLegalInModal}
                    onChange={(e) => setAcceptedLegalInModal(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>
                    Li e concordo com os{' '}
                    {onOpenLegal ? (
                      <button
                        type="button"
                        onClick={() => onOpenLegal('terms')}
                        className="text-indigo-300 hover:text-white underline font-semibold cursor-pointer"
                      >
                        Termos de Uso
                      </button>
                    ) : (
                      <strong>Termos de Uso</strong>
                    )}{' '}
                    (incluindo renovação após 7 dias grátis) e com a{' '}
                    {onOpenLegal ? (
                      <button
                        type="button"
                        onClick={() => onOpenLegal('privacy')}
                        className="text-emerald-300 hover:text-white underline font-semibold cursor-pointer"
                      >
                        Política de Privacidade (LGPD)
                      </button>
                    ) : (
                      <strong>Política de Privacidade (LGPD)</strong>
                    )}
                    .
                  </span>
                </label>
              </div>

              {/* Summary & Submit CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div>
                    Hoje: <strong className="text-emerald-400">R$ 0,00 (7 dias grátis)</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Após 7 dias: {activePlan.priceLabel} (
                    {activePlan.billingCycle === 'annual' ? 'anual' : 'mensal'}) · Cancele antes sem custo.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? submitStatusLabel || 'Validando cartão e ativando 7 dias grátis...'
                      : `Validar Cartão e Iniciar 7 Dias Grátis · ${activePlan.name}`}
                  </span>
                </button>
              </div>
            </div>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
