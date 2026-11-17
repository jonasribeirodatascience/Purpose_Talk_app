import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Check,
  Trash2,
  Star,
  Plus,
  Lock,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { PaymentMethodRecord } from '../types';
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

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethods: PaymentMethodRecord[];
  onAddPaymentMethod: (method: PaymentMethodRecord) => void;
  onSetDefaultMethod: (methodId: string) => void;
  onDeletePaymentMethod: (methodId: string) => void;
}

export const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  isOpen,
  onClose,
  paymentMethods,
  onAddPaymentMethod,
  onSetDefaultMethod,
  onDeletePaymentMethod,
}) => {
  const { user } = useFirebase();

  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderCpf, setHolderCpf] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [makeDefault, setMakeDefault] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const creditCards = paymentMethods.filter((m) => m.type === 'credit_card');
  const detectedBrand = detectCardBrand(cardNumber);
  const cardDigits = digitsOnly(cardNumber);
  const maskedPreviewDigits =
    cardDigits.length > 0
      ? cardDigits
          .padEnd(16, '•')
          .slice(0, 16)
          .replace(/(.{4})/g, '$1 ')
          .trim()
      : '•••• •••• •••• ••••';

  const resetForm = () => {
    setCardNumber('');
    setHolderName('');
    setHolderCpf('');
    setExpiry('');
    setCvv('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanHolder = holderName.trim();
    if (cleanHolder.length < 2) {
      setErrorMsg('Informe o nome completo impresso no cartão.');
      return;
    }

    if (!isValidCpf(holderCpf)) {
      setErrorMsg('Informe um CPF válido do titular do cartão.');
      return;
    }

    if (!isValidLuhn(cardNumber)) {
      setErrorMsg('Número de cartão de crédito inválido. Verifique os dígitos informados.');
      return;
    }

    const expiryCheck = parseAndValidateExpiry(expiry);
    if (!expiryCheck.valid || !expiryCheck.month || !expiryCheck.year) {
      setErrorMsg(expiryCheck.error || 'Data de validade inválida.');
      return;
    }

    const cleanCvv = digitsOnly(cvv);
    const expectedCvvLen = detectedBrand === 'amex' ? 4 : 3;
    if (cleanCvv.length < expectedCvvLen || cleanCvv.length > 4) {
      setErrorMsg(`Código de segurança (CVV) deve ter ${expectedCvvLen} dígitos.`);
      return;
    }

    setIsValidating(true);
    try {
      await validateCreditCardWithMercadoPago({
        cardNumber,
        holderName: cleanHolder,
        cpf: holderCpf,
        expiryMonth: expiryCheck.month,
        expiryYear: expiryCheck.year,
        cvv: cleanCvv,
        payerEmail: user?.email || 'aluno@purposetalk.app',
        userId: user?.uid || 'local_user',
        createSubscriptionToken: false,
      });

      const shouldBeDefault = makeDefault || creditCards.length === 0;
      const newId = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const last4 = cardDigits.slice(-4);
      const brandName = getBrandDisplayName(detectedBrand);

      // Store ONLY masked metadata (never store full PAN, CVV, or CPF)
      const newMethod: PaymentMethodRecord = {
        id: newId,
        type: 'credit_card',
        label: `${brandName} Crédito •••• ${last4}`.slice(0, 80),
        holderName: cleanHolder.toUpperCase().slice(0, 80),
        brand: detectedBrand,
        last4,
        expiryMonth: expiryCheck.month,
        expiryYear: expiryCheck.year,
        isDefault: shouldBeDefault,
        createdAt: Date.now(),
      };

      onAddPaymentMethod(newMethod);
      resetForm();
      setSuccessMsg(
        `Cartão ${brandName} terminado em ${last4} validado (limite ativo, sem cobrança) e salvo com segurança.`
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Cartão não aprovado na validação antifraude. Tente outro cartão de crédito.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="payment-modal-title" className="text-lg font-extrabold text-white tracking-tight">
                Cartões de Crédito Salvos
              </h2>
              <p className="text-xs text-slate-400">
                Somente cartão de crédito validado é aceito na assinatura Purpose Talk
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de formas de pagamento"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Security & Sync Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Proteção PCI & Antifraude: validamos o limite sem cobrança (pré-autorização de R$ 1,50 cancelada na hora) e salvamos apenas os últimos 4 dígitos.
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300 shrink-0">
              <Cloud className="w-3.5 h-3.5" />
              <span>{user ? 'Sincronizado no Firestore' : 'Salvo localmente'}</span>
            </div>
          </div>

          {/* Saved Payment Methods */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">
                Cartões de Crédito Salvos ({creditCards.length})
              </h3>
            </div>

            {creditCards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center text-xs text-slate-400">
                Nenhum cartão de crédito cadastrado ainda. Adicione um cartão válido abaixo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creditCards.map((method) => {
                  const expLabel =
                    method.expiryMonth && method.expiryYear
                      ? `${String(method.expiryMonth).padStart(2, '0')}/${String(method.expiryYear).slice(-2)}`
                      : null;
                  return (
                    <div
                      key={method.id}
                      className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition ${
                        method.isDefault
                          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {method.label}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {method.holderName}
                            </div>
                          </div>
                        </div>

                        {method.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span className="font-mono-code">
                          {`•••• ${method.last4}${expLabel ? ` · Val ${expLabel}` : ''}`}
                        </span>

                        <div className="flex items-center gap-2">
                          {!method.isDefault && (
                            <button
                              type="button"
                              onClick={() => onSetDefaultMethod(method.id)}
                              className="text-indigo-300 hover:text-white font-semibold underline cursor-pointer"
                            >
                              Definir padrão
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeletePaymentMethod(method.id)}
                            title="Remover forma de pagamento"
                            aria-label={`Remover ${method.label}`}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Add New Payment Method Form */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Adicionar Cartão de Crédito Validado</span>
              </h3>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Somente Cartão de Crédito</span>
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
                {/* Live Card Preview */}
                <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-5 text-white shadow-lg space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-90">
                      Cartão de Crédito
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {getBrandDisplayName(detectedBrand)}
                    </span>
                  </div>

                  <div className="font-mono-code text-base tracking-widest font-semibold pt-2">
                    {maskedPreviewDigits}
                  </div>

                  <div className="flex items-end justify-between gap-3 pt-2 text-[11px]">
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase opacity-75">Titular</div>
                      <div className="font-bold truncate">
                        {(holderName.trim() || 'SEU NOME AQUI').toUpperCase()}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[9px] uppercase opacity-75">Validade</div>
                      <div className="font-mono-code font-bold">{expiry || 'MM/AA'}</div>
                    </div>
                  </div>
                </div>

                {/* Card Form Inputs */}
                <div className="md:col-span-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número do Cartão de Crédito
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumberDisplay(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        autoComplete="cc-name"
                        placeholder="Ex: JONAS RIBEIRO"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono-code focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={makeDefault}
                    onChange={(e) => setMakeDefault(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Definir como cartão principal</span>
                </label>

                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isValidating ? 'Validando cartão e limite...' : 'Validar e Salvar Cartão'}</span>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
