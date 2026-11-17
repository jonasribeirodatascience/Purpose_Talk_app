// Speech Synthesis & Speech Recognition utilities for English Practice
import { SpeechProfileId } from '../types';
import { SPEECH_PROFILES } from '../data/speechProfiles';

export class TextToSpeechManager {
  private static instance: TextToSpeechManager;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private speechProfile: SpeechProfileId = 'auto';
  private customVoiceURI: string | null = null;
  private pitchOffset: number = 1.0;

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('purpose_talk_speech_profile');
      if (savedProfile) {
        this.speechProfile = savedProfile as SpeechProfileId;
      }
      const savedCustomVoice = localStorage.getItem('purpose_talk_custom_voice_uri');
      if (savedCustomVoice) {
        this.customVoiceURI = savedCustomVoice;
      }
      const savedPitch = localStorage.getItem('purpose_talk_pitch_offset');
      if (savedPitch) {
        this.pitchOffset = parseFloat(savedPitch) || 1.0;
      }

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  public static getInstance(): TextToSpeechManager {
    if (!TextToSpeechManager.instance) {
      TextToSpeechManager.instance = new TextToSpeechManager();
    }
    return TextToSpeechManager.instance;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  public setSpeechProfile(profileId: SpeechProfileId) {
    this.speechProfile = profileId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('purpose_talk_speech_profile', profileId);
    }
  }

  public getSpeechProfile(): SpeechProfileId {
    return this.speechProfile;
  }

  public setCustomVoiceURI(uri: string | null) {
    this.customVoiceURI = uri;
    if (typeof window !== 'undefined') {
      if (uri) {
        localStorage.setItem('purpose_talk_custom_voice_uri', uri);
      } else {
        localStorage.removeItem('purpose_talk_custom_voice_uri');
      }
    }
  }

  public getCustomVoiceURI(): string | null {
    return this.customVoiceURI;
  }

  public setPitchOffset(pitch: number) {
    this.pitchOffset = pitch;
    if (typeof window !== 'undefined') {
      localStorage.setItem('purpose_talk_pitch_offset', pitch.toString());
    }
  }

  public getPitchOffset(): number {
    return this.pitchOffset;
  }

  public speak(
    text: string, 
    rate: number = 0.95, 
    pitch: number = 1.0, 
    onEnd?: () => void,
    onError?: (err: any) => void,
    lang?: 'en-US' | 'en-GB' | string
  ) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      onEnd?.();
      return;
    }

    this.stop();

    // Clean markdown symbols or asterisks before speaking
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Apply Active Speech Profile adjustments (only for English utterances)
    let targetLang = lang || 'en-US';
    const isPortuguese = targetLang.toLowerCase().startsWith('pt');
    let targetPitch = pitch * (isPortuguese ? 1.0 : this.pitchOffset);
    let targetRate = rate;

    if (!isPortuguese && this.speechProfile !== 'auto') {
      const profileConfig = SPEECH_PROFILES.find(p => p.id === this.speechProfile);
      if (profileConfig) {
        targetLang = profileConfig.voiceLang;
        targetPitch = profileConfig.defaultPitch * this.pitchOffset;
        targetRate = rate * profileConfig.rateMultiplier;
      }
    }

    utterance.lang = targetLang;
    utterance.rate = Math.min(Math.max(targetRate, 0.5), 2.0);
    utterance.pitch = Math.min(Math.max(targetPitch, 0.5), 1.8);

    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }

    let preferredVoice: SpeechSynthesisVoice | undefined;

    if (isPortuguese) {
      const ptVoices = this.voices.filter(v => v.lang.toLowerCase().startsWith('pt'));
      preferredVoice =
        ptVoices.find(v => v.lang.toLowerCase().includes('br')) ||
        ptVoices[0];
    } else {
      const enVoices = this.getEnglishVoices();

      if (this.customVoiceURI) {
        preferredVoice = enVoices.find(v => v.voiceURI === this.customVoiceURI);
      }

      if (!preferredVoice) {
        if (targetLang === 'en-GB') {
          preferredVoice = enVoices.find(v => 
            (v.lang.includes('GB') || v.lang.includes('UK') || v.name.includes('UK') || v.name.includes('British') || v.name.includes('Daniel') || v.name.includes('George') || v.name.includes('Serena'))
          );
        } else {
          preferredVoice = enVoices.find(v => 
            (v.lang.includes('US') || v.name.includes('Google US') || v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Jenny') || v.name.includes('Guy'))
          );
        }
      }

      if (!preferredVoice && enVoices.length > 0) {
        preferredVoice = enVoices[0];
      }
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      onError?.(e);
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }
}

// Browser Speech-to-Text Recognition
export interface SpeechRecognitionAlternativeItem {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultPayload {
  transcript: string;
  interimTranscript?: string;
  finalTranscript?: string;
  isFinal: boolean;
  confidence?: number;
  alternatives?: SpeechRecognitionAlternativeItem[];
}

export interface SpeechListeningOptions {
  continuous?: boolean;
  lang?: string;
  maxAlternatives?: number;
}

export class SpeechRecognitionManager {
  private recognition: any = null;
  public isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public startListening(
    onResult: (result: SpeechRecognitionResultPayload) => void,
    onError?: (error: any) => void,
    onEnd?: () => void,
    options?: SpeechListeningOptions
  ) {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    this.recognition.continuous = options?.continuous ?? false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = options?.maxAlternatives ?? 3;
    this.recognition.lang = options?.lang || 'en-US';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let latestConfidence = 0.85;
      const alternatives: SpeechRecognitionAlternativeItem[] = [];

      for (let i = 0; i < event.results.length; ++i) {
        const resultItem = event.results[i];
        const primary = resultItem[0];
        if (resultItem.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + primary.transcript.trim();
          if (typeof primary.confidence === 'number' && primary.confidence > 0) {
            latestConfidence = primary.confidence;
          }
          for (let j = 0; j < resultItem.length; j++) {
            alternatives.push({
              transcript: resultItem[j].transcript,
              confidence: typeof resultItem[j].confidence === 'number' ? resultItem[j].confidence : 0.75,
            });
          }
        } else {
          interimTranscript += (interimTranscript ? ' ' : '') + primary.transcript.trim();
          if (typeof primary.confidence === 'number' && primary.confidence > 0) {
            latestConfidence = primary.confidence;
          }
        }
      }

      const combined = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
      const lastResult = event.results[event.results.length - 1];
      const isLastFinal = lastResult ? !!lastResult.isFinal : !!finalTranscript;

      onResult({
        transcript: combined,
        interimTranscript: interimTranscript.trim(),
        finalTranscript: finalTranscript.trim(),
        isFinal: !options?.continuous ? !!finalTranscript : isLastFinal,
        confidence: latestConfidence,
        alternatives,
      });
    };

    this.recognition.onerror = (event: any) => {
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already started or error:', e);
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }
}

export const tts = TextToSpeechManager.getInstance();

