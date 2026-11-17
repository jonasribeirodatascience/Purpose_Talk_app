import { SpeechProfileConfig } from '../types';

export const SPEECH_PROFILES: SpeechProfileConfig[] = [
  {
    id: 'auto',
    name: 'Auto Adaptativo',
    taglinePt: 'Altera o sotaque e tom automaticamente conforme o Avatar ou Cenário ativo.',
    accentLabelPt: 'Dinâmico (EUA / UK)',
    voiceLang: 'en-US',
    defaultPitch: 1.0,
    rateMultiplier: 1.0,
    sampleQuote: "Hello! I automatically adapt my voice to whichever mentor or scenario you are practicing with."
  },
  {
    id: 'pastor_david',
    name: 'Pastor David (Worship & Fé)',
    taglinePt: 'Tom acolhedor, calmo e encorajador com sotaque americano do sul/neutro.',
    accentLabelPt: 'Americano Acolhedor (en-US)',
    voiceLang: 'en-US',
    defaultPitch: 0.92,
    rateMultiplier: 0.92,
    sampleQuote: "The Lord bless you and keep you. Take a deep breath, and let's speak with peace and gratitude."
  },
  {
    id: 'sarah_tech',
    name: 'Sarah Jenkins (Tech Lead)',
    taglinePt: 'Voz dinâmica, precisa e articulada, padrão Vale do Silício e Seattle.',
    accentLabelPt: 'Americano Tech (en-US)',
    voiceLang: 'en-US',
    defaultPitch: 1.05,
    rateMultiplier: 1.02,
    sampleQuote: "Our data pipeline throughput is optimized, and latency is under ten milliseconds. Let's tackle your standup!"
  },
  {
    id: 'jake_buddy',
    name: 'Jake Reynolds (Casual Buddy)',
    taglinePt: 'Voz amigável, descontraída e rápida para conversas cotidianas de Nova York.',
    accentLabelPt: 'Americano Casual (en-US)',
    voiceLang: 'en-US',
    defaultPitch: 1.0,
    rateMultiplier: 1.0,
    sampleQuote: "Hey, what's up! Ready to grab a coffee or practice asking for directions around town?"
  },
  {
    id: 'emma_british',
    name: 'Emma Watson-Smith (British RP)',
    taglinePt: 'Pronúncia britânica impecável de Oxford, ritmo elegante e polidez social.',
    accentLabelPt: 'Britânico Elegante (en-GB)',
    voiceLang: 'en-GB',
    defaultPitch: 1.08,
    rateMultiplier: 0.95,
    sampleQuote: "Good day to you! English is a wonderfully musical language when spoken with poise and gentle rhythm."
  }
];
