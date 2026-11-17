import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  CalendarClock,
  Lock,
  AlertCircle,
  ExternalLink,
  Crown,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import {
  PaymentMethodRecord,
  PaymentMethodType,
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
  formatExpiryInput,
  getBrandDisplayName,
  isValidLuhn,
  parseAndValidateExpiry,
  PixKeyKind,
  validateAndMaskPixKey,
} from '../utils/paymentValidation';
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
}) => {
  const { user } = useFirebase();

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(
    subscription?.planId || 'pro_mensal'
  );

  // Payment method selection or inline creation
  const [useNewMethod, setUseNewMethod] = useState<boolean>(paymentMethods.length === 0);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods.find((m) => m.isDefault)?.id || paymentMethods[0]?.id || ''
  );

  // Inline new payment method inputs
  const [pmType, setPmType] = useState<PaymentMethodType>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pixKind, setPixKind] = useState<PixKeyKind>('email');
  const [pixKey, setPixKey] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [liveCheckoutUrl, setLiveCheckoutUrl] = useState<string | null>(null);
  const [acceptedLegalInModal, setAcceptedLegalInModal] = useState<boolean>(lgpdAccepted);

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
    setAcceptedLegalInModal(lgpdAccepted);
    if (paymentMethods.length === 0) {
      setUseNewMethod(true);
      setSelectedMethodId('');
    } else if (!selectedMethodId || !paymentMethods.some((m) => m.id === selectedMethodId)) {
      const def = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
      setSelectedMethodId(def.id);
      setUseNewMethod(false);
    }
  }, [isOpen, paymentMethods, lgpdAccepted]);

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

    try {
      if (!acceptedLegalInModal) {
        throw new Error(
          'Confirme o aceite dos Termos de Uso e da Política de Privacidade (LGPD) antes de ativar os 7 dias grátis.'
        );
      }

      if (!lgpdAccepted && onAcceptLgpd) {
        await onAcceptLgpd();
      }

      let chosenMethod = paymentMethods.find((m) => m.id === selectedMethodId);

      // Register new payment method first if user filled the inline form
      if (useNewMethod || !chosenMethod) {
        const cleanHolder = holderName.trim();
        if (cleanHolder.length < 2) {
          throw new Error('Informe o nome completo do titular da forma de pagamento.');
        }

        const newMethodId = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        if (pmType === 'pix') {
          const pixCheck = validateAndMaskPixKey(pixKey, pixKind);
          if (!pixCheck.valid || !pixCheck.masked) {
            throw new Error(pixCheck.error || 'Chave PIX inválida.');
          }
          chosenMethod = {
            id: newMethodId,
            type: 'pix',
            label: `PIX (${pixCheck.labelSuffix})`,
            holderName: cleanHolder.slice(0, 80),
            brand: 'pix',
            pixKeyMasked: pixCheck.masked,
            isDefault: true,
            createdAt: Date.now(),
          };
        } else {
          if (!isValidLuhn(cardNumber)) {
            throw new Error('Número de cartão inválido. Confira os dígitos antes de continuar.');
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

          const last4 = digitsOnly(cardNumber).slice(-4);
          const brandLabel = getBrandDisplayName(detectedBrand);
          const typeLabel = pmType === 'credit_card' ? 'Crédito' : 'Débito';

          chosenMethod = {
            id: newMethodId,
            type: pmType,
            label: `${brandLabel} ${typeLabel} •••• ${last4}`.slice(0, 80),
            holderName: cleanHolder.toUpperCase().slice(0, 80),
            brand: detectedBrand,
            last4,
            expiryMonth: expCheck.month,
            expiryYear: expCheck.year,
            isDefault: true,
            createdAt: Date.now(),
          };
        }

        await onAddPaymentMethod(chosenMethod);
        setSelectedMethodId(chosenMethod.id);
        setUseNewMethod(false);
        setCardNumber('');
        setCvv('');
        setExpiry('');
        setPixKey('');
      }

      // Call server billing route to initiate Mercado Pago trial
      const apiRes = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan.id,
          userEmail: user?.email || 'aluno@purposetalk.app',
          userId: user?.uid || 'local_user',
          preferredGateway: 'mercadopago',
          paymentMethodLabel: chosenMethod.label,
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
        userEmail: user?.email || 'aluno@purposetalk.app',
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

      setSuccessMsg(
        `Período de 7 dias grátis do plano ${activePlan.name} ativado com ${chosenMethod.label}! Primeira cobrança prevista para ${new Date(
          trialEnd
        ).toLocaleDateString('pt-BR')}.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao iniciar teste grátis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plans-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="plans-modal-title" className="text-lg font-extrabold text-white tracking-tight">
                Planos Purpose Talk · 7 Dias Grátis Iniciais
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre um cartão ou PIX hoje (R$ 0,00 agora) e teste tudo por 7 dias sem compromisso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar planos e assinatura"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <span>2. Cadastre sua Forma de Pagamento para liberar os 7 Dias Grátis</span>
                </h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Processado via Mercado Pago · Dados protegidos (sem salvar CVV)
                </span>
              </div>

              {/* Saved Methods vs Inline New Form */}
              {paymentMethods.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Usar forma de pagamento cadastrada ou adicionar nova:
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseNewMethod((v) => !v)}
                      className="text-indigo-300 hover:text-white font-semibold underline cursor-pointer"
                    >
                      {useNewMethod ? 'Usar método já salvo' : '+ Cadastrar novo cartão ou PIX'}
                    </button>
                  </div>

                  {!useNewMethod && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {paymentMethods.map((pm) => {
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
                              {pm.type === 'pix' ? (
                                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {pm.label}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {pm.holderName} ·{' '}
                                  {pm.type === 'pix' ? pm.pixKeyMasked : `•••• ${pm.last4}`}
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

              {/* Inline Payment Method Registration Form */}
              {useNewMethod && (
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-300">Modalidade:</span>
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setPmType('credit_card')}
                        className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                          pmType === 'credit_card'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Cartão de Crédito
                      </button>
                      <button
                        type="button"
                        onClick={() => setPmType('debit_card')}
                        className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                          pmType === 'debit_card'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Cartão de Débito
                      </button>
                      <button
                        type="button"
                        onClick={() => setPmType('pix')}
                        className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                          pmType === 'pix'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        PIX
                      </button>
                    </div>
                  </div>

                  {pmType !== 'pix' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Número do Cartão ({getBrandDisplayName(detectedBrand)})
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
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
                          placeholder="•••"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nome Impresso no Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: JONAS RIBEIRO"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tipo de Chave PIX
                        </label>
                        <select
                          value={pixKind}
                          onChange={(e) => setPixKind(e.target.value as PixKeyKind)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="email">E-mail</option>
                          <option value="cpf">CPF</option>
                          <option value="phone">Celular</option>
                          <option value="random">Chave Aleatória</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Chave PIX
                        </label>
                        <input
                          type="text"
                          placeholder="Digite sua chave PIX"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nome do Titular
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Jonas Ribeiro"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  )}
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
                      ? 'Ativando 7 dias grátis...'
                      : `Iniciar 7 Dias Grátis · ${activePlan.name}`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
