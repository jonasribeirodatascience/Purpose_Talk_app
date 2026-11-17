import { CardBrand } from '../types';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectCardBrand(rawNumber: string): Exclude<CardBrand, 'pix'> {
  const num = digitsOnly(rawNumber);
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(num)) {
    return 'elo';
  }
  if (/^(38|60)/.test(num)) {
    return 'hipercard';
  }
  if (/^3[47]/.test(num)) {
    return 'amex';
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(num)) {
    return 'mastercard';
  }
  return 'visa';
}

export function formatCardNumberDisplay(rawNumber: string, brand?: Exclude<CardBrand, 'pix'>): string {
  const digits = digitsOnly(rawNumber).slice(0, 19);
  const resolvedBrand = brand || detectCardBrand(digits);
  if (resolvedBrand === 'amex') {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiryInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

export function isValidLuhn(rawNumber: string): boolean {
  const digits = digitsOnly(rawNumber);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function parseAndValidateExpiry(expiryText: string): {
  valid: boolean;
  month?: number;
  year?: number;
  error?: string;
} {
  const match = expiryText.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return { valid: false, error: 'Informe a validade no formato MM/AA.' };
  }
  const month = parseInt(match[1], 10);
  const shortYear = parseInt(match[2], 10);
  const year = 2000 + shortYear;

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Mês de validade inválido (01 a 12).' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Este cartão já está vencido.' };
  }
  if (year > 2050) {
    return { valid: false, error: 'Ano de validade fora do intervalo permitido.' };
  }

  return { valid: true, month, year };
}

export type PixKeyKind = 'cpf' | 'email' | 'phone' | 'random';

export function validateAndMaskPixKey(
  rawKey: string,
  kind: PixKeyKind
): { valid: boolean; masked?: string; labelSuffix?: string; error?: string } {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    return { valid: false, error: 'Informe a chave PIX.' };
  }

  if (kind === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { valid: false, error: 'E-mail PIX inválido.' };
    }
    const [local, domain] = trimmed.split('@');
    const visible = local.slice(0, Math.min(2, local.length));
    return {
      valid: true,
      masked: `${visible}***@${domain}`.slice(0, 80),
      labelSuffix: 'E-mail',
    };
  }

  if (kind === 'cpf') {
    const d = digitsOnly(trimmed);
    if (d.length !== 11) {
      return { valid: false, error: 'O CPF deve conter 11 dígitos.' };
    }
    return {
      valid: true,
      masked: `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`,
      labelSuffix: 'CPF',
    };
  }

  if (kind === 'phone') {
    const d = digitsOnly(trimmed);
    if (d.length < 10 || d.length > 13) {
      return { valid: false, error: 'Informe um celular válido com DDD.' };
    }
    const last4 = d.slice(-4);
    const ddd = d.slice(-11, -9) || d.slice(0, 2);
    return {
      valid: true,
      masked: `(${ddd}) *****-${last4}`,
      labelSuffix: 'Celular',
    };
  }

  // Random EVP key
  if (trimmed.length < 12) {
    return { valid: false, error: 'Chave aleatória deve ter ao menos 12 caracteres.' };
  }
  return {
    valid: true,
    masked: `${trimmed.slice(0, 6)}••••${trimmed.slice(-4)}`.slice(0, 80),
    labelSuffix: 'Chave Aleatória',
  };
}

export function formatCpfInput(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function isValidCpf(rawCpf: string): boolean {
  const cpf = digitsOnly(rawCpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf[10], 10);
}

export function getBrandDisplayName(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
      return 'American Express';
    case 'elo':
      return 'Elo';
    case 'hipercard':
      return 'Hipercard';
    case 'pix':
      return 'PIX';
  }
}
