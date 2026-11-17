import { digitsOnly } from './paymentValidation';

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      createCardToken: (params: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
      }) => Promise<{ id: string; first_six_digits?: string; last_four_digits?: string }>;
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;
let cachedPublicKey: string | null = null;

export async function loadMercadoPagoSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('SDK do Mercado Pago só pode ser carregado no navegador.');
  }
  if (window.MercadoPago) return;
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.mercadopago.com/js/v2"]'
    );
    if (existing) {
      if (window.MercadoPago) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Falha ao carregar SDK de segurança do Mercado Pago.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('Não foi possível conectar ao módulo de validação do Mercado Pago.'));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export async function getMercadoPagoPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;

  const envKey = (import.meta as any)?.env?.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (typeof envKey === 'string' && envKey.trim()) {
    cachedPublicKey = envKey.trim();
    return cachedPublicKey;
  }

  const res = await fetch('/api/billing/public-key');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.publicKey) {
    throw new Error(
      'Chave pública do Mercado Pago não configurada para validação segura do cartão.'
    );
  }
  cachedPublicKey = String(data.publicKey).trim();
  return cachedPublicKey;
}

export interface CreditCardValidationParams {
  cardNumber: string;
  holderName: string;
  cpf: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  payerEmail: string;
  userId?: string;
  createSubscriptionToken?: boolean;
}

export interface CreditCardValidationResult {
  paymentMethodId: string;
  validationPaymentId: string;
  subscriptionCardTokenId?: string;
  verifiedAt: number;
}

export async function validateCreditCardWithMercadoPago(
  params: CreditCardValidationParams
): Promise<CreditCardValidationResult> {
  const cleanCardNumber = digitsOnly(params.cardNumber);
  const cleanCpf = digitsOnly(params.cpf);
  const cleanCvv = digitsOnly(params.cvv);
  const bin = cleanCardNumber.slice(0, 6);

  if (bin.length < 6) {
    throw new Error('Informe os dígitos completos do cartão de crédito.');
  }

  // 1. Verificar BIN para garantir que é um cartão de CRÉDITO ativo (bloqueia débito/pré-pago exclusivo)
  const binRes = await fetch(
    `/api/billing/mercadopago/bin-check?bin=${encodeURIComponent(bin)}`
  );
  const binData = await binRes.json().catch(() => ({}));
  if (!binRes.ok || !binData?.validCreditCard || !binData?.paymentMethodId) {
    throw new Error(
      binData?.error ||
        'Somente cartão de crédito válido é aceito. Cartões de débito, pré-pagos ou inválidos não são permitidos.'
    );
  }

  // 2. Carregar SDK v2 do Mercado Pago e tokenizar cartão com segurança
  await loadMercadoPagoSdk();
  const publicKey = await getMercadoPagoPublicKey();
  if (!window.MercadoPago) {
    throw new Error('Módulo de tokenização do Mercado Pago indisponível.');
  }

  const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });

  const expMonthStr = String(params.expiryMonth).padStart(2, '0');
  const expYearStr = String(params.expiryYear);

  const createToken = async () => {
    const tokenRes = await mp.createCardToken({
      cardNumber: cleanCardNumber,
      cardholderName: params.holderName.trim().toUpperCase(),
      cardExpirationMonth: expMonthStr,
      cardExpirationYear: expYearStr,
      securityCode: cleanCvv,
      identificationType: 'CPF',
      identificationNumber: cleanCpf,
    });
    if (!tokenRes?.id) {
      throw new Error('Não foi possível validar os dados do cartão junto ao Mercado Pago.');
    }
    return tokenRes.id;
  };

  let validationTokenId: string;
  try {
    validationTokenId = await createToken();
  } catch (err: any) {
    throw new Error(
      err?.message ||
        'Dados do cartão de crédito rejeitados na validação. Confira número, validade, CVV e CPF.'
    );
  }

  // 3. Validar limite/saldo e status no emissor via pré-autorização de R$ 1,50 cancelada na hora (R$ 0,00 cobrado)
  const valRes = await fetch('/api/billing/mercadopago/validate-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardTokenId: validationTokenId,
      paymentMethodId: binData.paymentMethodId,
      payerEmail: params.payerEmail,
      holderName: params.holderName.trim().toUpperCase(),
      cpfDigits: cleanCpf,
      userId: params.userId || 'local_user',
    }),
  });
  const valData = await valRes.json().catch(() => ({}));
  if (!valRes.ok || !valData?.valid) {
    throw new Error(
      valData?.error ||
        'Cartão recusado ou sem limite disponível na verificação antifraude. Utilize outro cartão de crédito.'
    );
  }

  // 4. Token adicional (uso único) para vincular à assinatura recorrente após validação positiva
  let subscriptionCardTokenId: string | undefined;
  if (params.createSubscriptionToken) {
    try {
      subscriptionCardTokenId = await createToken();
    } catch {
      subscriptionCardTokenId = undefined;
    }
  }

  return {
    paymentMethodId: String(binData.paymentMethodId),
    validationPaymentId: String(valData.paymentId || ''),
    subscriptionCardTokenId,
    verifiedAt: Date.now(),
  };
}
