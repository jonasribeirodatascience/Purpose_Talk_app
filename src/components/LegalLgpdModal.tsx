import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Cookie,
  CheckCircle2,
  Download,
  AlertTriangle,
  Lock,
  Ban,
} from 'lucide-react';
import { CookieConsentRecord, LgpdConsentRecord } from '../types';
import {
  COOKIE_CATEGORIES,
  COOKIE_POLICY_SECTIONS,
  COOKIE_POLICY_VERSION,
  DATA_CONTROLLER_INFO,
  LEGAL_LAST_UPDATED_PT,
  LEGAL_TERMS_VERSION,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_VERSION,
  TERMS_OF_USE_SECTIONS,
} from '../data/legalDocuments';

export type LegalTabId = 'terms' | 'privacy' | 'cookies';

interface LegalLgpdModalProps {
  isOpen: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
  consent: LgpdConsentRecord | null;
  cookieConsent: CookieConsentRecord | null;
  onSaveConsent: (opts: {
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    marketingOptIn: boolean;
  }) => Promise<void>;
  onSaveCookieConsent: (opts: {
    preferences: boolean;
    analyticsAndProduct: boolean;
    marketing: boolean;
  }) => void;
  onRevokeConsent: () => Promise<void>;
  onExportUserData: () => void;
}

export const LegalLgpdModal: React.FC<LegalLgpdModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  consent,
  cookieConsent,
  onSaveConsent,
  onSaveCookieConsent,
  onRevokeConsent,
  onExportUserData,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(
    Boolean(consent?.acceptedTerms && !consent?.revokedAt)
  );
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(
    Boolean(consent?.acceptedPrivacy && !consent?.revokedAt)
  );
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(
    Boolean(consent?.marketingOptIn && !consent?.revokedAt)
  );

  // Granular Cookie Preferences
  const [cookiePreferences, setCookiePreferences] = useState<boolean>(
    cookieConsent?.preferences ?? true
  );
  const [cookieAnalytics, setCookieAnalytics] = useState<boolean>(
    cookieConsent?.analyticsAndProduct ?? true
  );
  const [cookieMarketing, setCookieMarketing] = useState<boolean>(
    cookieConsent?.marketing ?? false
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setAcceptedTerms(Boolean(consent?.acceptedTerms && !consent?.revokedAt));
    setAcceptedPrivacy(Boolean(consent?.acceptedPrivacy && !consent?.revokedAt));
    setMarketingOptIn(Boolean(consent?.marketingOptIn && !consent?.revokedAt));
    setCookiePreferences(cookieConsent?.preferences ?? true);
    setCookieAnalytics(cookieConsent?.analyticsAndProduct ?? true);
    setCookieMarketing(cookieConsent?.marketing ?? false);
    setStatusMessage(null);
    setErrorMessage(null);
  }, [isOpen, initialTab, consent, cookieConsent]);

  if (!isOpen) return null;

  const isConsentActive = Boolean(
    consent &&
      consent.acceptedTerms &&
      consent.acceptedPrivacy &&
      consent.termsVersion === LEGAL_TERMS_VERSION &&
      consent.privacyVersion === PRIVACY_POLICY_VERSION &&
      !consent.revokedAt
  );

  const sections =
    activeTab === 'terms'
      ? TERMS_OF_USE_SECTIONS
      : activeTab === 'cookies'
      ? COOKIE_POLICY_SECTIONS
      : PRIVACY_POLICY_SECTIONS;

  const handleConfirmAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (activeTab === 'cookies') {
      onSaveCookieConsent({
        preferences: cookiePreferences,
        analyticsAndProduct: cookieAnalytics,
        marketing: cookieMarketing,
      });
      setStatusMessage(
        `Preferências de cookies salvas para a versão ${COOKIE_POLICY_VERSION}.`
      );
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setErrorMessage(
        'Para registrar o aceite, marque a concordância com os Termos de Uso e com a Política de Privacidade (LGPD).'
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSaveConsent({
        acceptedTerms: true,
        acceptedPrivacy: true,
        marketingOptIn,
      });
      onSaveCookieConsent({
        preferences: cookiePreferences,
        analyticsAndProduct: cookieAnalytics,
        marketing: marketingOptIn,
      });
      setStatusMessage(
        `Aceite LGPD e Cookies registrado com sucesso para a versão ${LEGAL_TERMS_VERSION}.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao registrar aceite LGPD.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptOnlyEssentialCookies = () => {
    setCookiePreferences(false);
    setCookieAnalytics(false);
    setCookieMarketing(false);
    onSaveCookieConsent({
      preferences: false,
      analyticsAndProduct: false,
      marketing: false,
    });
    setStatusMessage('Somente cookies estritamente essenciais mantidos ativos.');
  };

  const handleAcceptAllCookies = () => {
    setCookiePreferences(true);
    setCookieAnalytics(true);
    setCookieMarketing(true);
    onSaveCookieConsent({
      preferences: true,
      analyticsAndProduct: true,
      marketing: true,
    });
    setStatusMessage('Todas as categorias de cookies aceitas e salvas.');
  };

  const handleRevoke = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);
    try {
      await onRevokeConsent();
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      setMarketingOptIn(false);
      setStatusMessage(
        'Consentimento revogado e registrado no log de auditoria LGPD.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao revogar consentimento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="legal-modal-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate"
              >
                Termos, Privacidade (LGPD) e Política de Cookies
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Versão {LEGAL_TERMS_VERSION} · Atualizado em {LEGAL_LAST_UPDATED_PT} · Lei nº 13.709/2018
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Termos, Privacidade e Política de Cookies"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Switcher + Portability Action */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'terms'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Termos de Uso</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'privacy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidade (LGPD)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cookies')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'cookies'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Política de Cookies</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportUserData}
            title="Exercite seu direito de portabilidade (Art. 18, V, LGPD) baixando seus dados em JSON"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Baixar Meus Dados (JSON)</span>
          </button>
        </div>

        {/* Scrollable Legal Text */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Controller Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white">
              Controlador: {DATA_CONTROLLER_INFO.controllerName}
            </div>
            <div>
              Encarregado de Dados (DPO):{' '}
              <span className="font-semibold text-indigo-300">
                {DATA_CONTROLLER_INFO.dpoEmail}
              </span>{' '}
              · Base Legal: {DATA_CONTROLLER_INFO.applicableLaw}
            </div>
          </div>

          {/* Interactive Cookie Category Matrix when Cookies tab is active */}
          {activeTab === 'cookies' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gerenciar Categorias de Cookies
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {cookieConsent
                      ? `Última escolha registrada em ${new Date(cookieConsent.updatedAt).toLocaleString('pt-BR')}`
                      : 'Personalize quais cookies opcionais deseja permitir.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptOnlyEssentialCookies}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap cursor-pointer"
                  >
                    Apenas Essenciais
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAllCookies}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                  >
                    Aceitar Todos
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {COOKIE_CATEGORIES.map((cat) => {
                  const isChecked =
                    cat.id === 'essential'
                      ? true
                      : cat.id === 'preferences'
                      ? cookiePreferences
                      : cat.id === 'analyticsAndProduct'
                      ? cookieAnalytics
                      : cookieMarketing;

                  const onToggle = () => {
                    if (cat.required) return;
                    if (cat.id === 'preferences') setCookiePreferences((v) => !v);
                    if (cat.id === 'analyticsAndProduct') setCookieAnalytics((v) => !v);
                    if (cat.id === 'marketing') setCookieMarketing((v) => !v);
                  };

                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{cat.title}</span>
                          {cat.required && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              Sempre Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {cat.description}
                        </p>
                        <div className="text-[11px] font-mono-code text-slate-500 truncate">
                          Chaves: {cat.examples.join(', ')}
                        </div>
                      </div>

                      <label className="inline-flex items-center shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={cat.required}
                          onChange={onToggle}
                          aria-label={cat.title}
                          className="h-4 w-4 rounded border-slate-600 accent-emerald-600 cursor-pointer disabled:opacity-60"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document Sections */}
          <div className="space-y-6 max-w-3xl">
            {sections.map((section) => (
              <section key={section.id} className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {section.title}
                </h3>
                {section.paragraphs.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {section.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Bottom Consent & Acceptance Bar */}
        <form
          onSubmit={handleConfirmAcceptance}
          className="border-t border-slate-800 bg-slate-950/70 px-6 py-4 space-y-3"
        >
          {activeTab !== 'cookies' && (
            <>
              {isConsentActive ? (
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Aceite ativo registrado em{' '}
                      {new Date(consent!.acceptedAt).toLocaleString('pt-BR')} (Versão{' '}
                      {consent!.termsVersion})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={isSaving}
                    className="text-xs font-semibold text-rose-300 hover:text-rose-200 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Revogar consentimento</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {consent?.revokedAt
                      ? `Consentimento revogado em ${new Date(
                          consent.revokedAt
                        ).toLocaleString('pt-BR')}. Marque abaixo para aceitar novamente.`
                      : 'Aceite pendente: leia os documentos acima e confirme abaixo para registrar seu consentimento LGPD.'}
                  </span>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 accent-indigo-600 cursor-pointer"
                  />
                  <span>
                    Li e aceito os <strong>Termos de Uso</strong> do Purpose Talk
                    (obrigatório).
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>
                    Li e concordo com a{' '}
                    <strong>Política de Privacidade e Política de Cookies (LGPD)</strong>{' '}
                    (obrigatório).
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 accent-indigo-600 cursor-pointer"
                  />
                  <span>
                    Autorizo o recebimento opcional de avisos de evolução pedagógica
                    e novidades (LGPD Art. 7º, I — revogável a qualquer momento).
                  </span>
                </label>
              </div>
            </>
          )}

          {errorMessage && (
            <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-3 py-2">
              {statusMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {activeTab === 'cookies'
                  ? 'Salvar Preferências de Cookies'
                  : isSaving
                  ? 'Salvando...'
                  : isConsentActive
                  ? 'Atualizar Preferências LGPD'
                  : 'Aceitar e Registrar Consentimento'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
