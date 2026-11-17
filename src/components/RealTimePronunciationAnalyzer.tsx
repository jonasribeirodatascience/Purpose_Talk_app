import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RotateCcw,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  ChevronRight,
  Loader2,
  AudioLines
} from 'lucide-react';
import {
  AnalyzedWord,
  PronunciationAnalysisResult,
  UserLevel
} from '../types';
import { SpeechRecognitionManager, tts } from '../utils/speech';
import { analyzePronunciationRealtime } from '../utils/pronunciationAnalysis';
import { auth } from '../firebase';
import { savePronunciationLogToCloud } from '../services/firestoreSync';

interface RealTimePronunciationAnalyzerProps {
  targetPhrase: string;
  suggestedPhrases?: string[];
  voiceLang?: 'en-US' | 'en-GB';
  speechRate: number;
  userLevel: UserLevel;
  liveTranscript?: string;
  liveIsListening?: boolean;
  liveConfidence?: number;
  liveIsFinal?: boolean;
  onUseSpokenText?: (text: string) => void;
  onAddXp?: (amount: number) => void;
  onClose?: () => void;
}

export const RealTimePronunciationAnalyzer: React.FC<RealTimePronunciationAnalyzerProps> = ({
  targetPhrase,
  suggestedPhrases = [],
  voiceLang = 'en-US',
  speechRate,
  userLevel,
  liveTranscript,
  liveIsListening = false,
  liveConfidence = 0.85,
  liveIsFinal = false,
  onUseSpokenText,
  onAddXp,
  onClose,
}) => {
  const [comparisonMode, setComparisonMode] = useState<'target' | 'free'>(
    targetPhrase.trim() ? 'target' : 'free'
  );
  const [activeTarget, setActiveTarget] = useState<string>(targetPhrase);
  const [spokenText, setSpokenText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0.85);
  const [isFinalSpeech, setIsFinalSpeech] = useState<boolean>(false);
  const [isLocalListening, setIsLocalListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);
  const [aiResult, setAiResult] = useState<PronunciationAnalysisResult | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(16).fill(18));

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastAiAnalyzedTextRef = useRef<string>('');

  // Sync target phrase when AI updates it (unless user manually cleared or is mid-speech)
  useEffect(() => {
    if (targetPhrase && !isLocalListening && !liveIsListening) {
      setActiveTarget(targetPhrase);
      setComparisonMode('target');
      setAiResult(null);
      setSelectedWord(null);
    }
  }, [targetPhrase]);

  // Sync external live transcript from conversation microphone
  useEffect(() => {
    if (typeof liveTranscript === 'string' && liveTranscript.trim()) {
      setSpokenText(liveTranscript);
      setConfidence(liveConfidence);
      setIsFinalSpeech(liveIsFinal);
      setAiResult(null);
    }
  }, [liveTranscript, liveConfidence, liveIsFinal]);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
    return () => {
      stopAudioVisualizer();
      recognitionRef.current?.stopListening();
    };
  }, []);

  const isListeningNow = isLocalListening || liveIsListening;

  // Real-time audio waveform visualizer while listening
  useEffect(() => {
    if (isListeningNow) {
      startAudioVisualizer();
    } else {
      stopAudioVisualizer();
      setAudioLevels(Array(16).fill(14));
    }
    return () => stopAudioVisualizer();
  }, [isListeningNow]);

  const startAudioVisualizer = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        startFallbackPulse();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i % dataArray.length] || 0;
          bars.push(Math.max(14, Math.min(100, Math.round((val / 255) * 100))));
        }
        setAudioLevels(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      startFallbackPulse();
    }
  };

  const startFallbackPulse = () => {
    const tick = () => {
      setAudioLevels(
        Array.from({ length: 16 }, (_, idx) =>
          Math.round(22 + Math.abs(Math.sin(Date.now() / 160 + idx * 0.55)) * 68)
        )
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAudioVisualizer = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Compute instant real-time word-by-word comparison
  const liveAnalysis: PronunciationAnalysisResult = useMemo(() => {
    if (aiResult && aiResult.spokenText === spokenText) {
      return aiResult;
    }
    return analyzePronunciationRealtime(
      comparisonMode === 'target' ? activeTarget : '',
      spokenText,
      confidence,
      isFinalSpeech
    );
  }, [aiResult, comparisonMode, activeTarget, spokenText, confidence, isFinalSpeech]);

  // Auto-select the first mispronounced/close word after final speech
  useEffect(() => {
    if (isFinalSpeech && liveAnalysis.words.length > 0 && !selectedWord) {
      const firstIssue =
        liveAnalysis.words.find(w => w.status === 'mispronounced' || w.status === 'missing') ||
        liveAnalysis.words.find(w => w.status === 'close');
      if (firstIssue) {
        setSelectedWord(firstIssue);
      }
    }
  }, [isFinalSpeech, liveAnalysis.words]);

  const handleToggleLocalListen = () => {
    setSpeechError(null);
    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      setSpeechError('Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Microsoft Edge.');
      return;
    }

    if (isLocalListening) {
      recognitionRef.current.stopListening();
      setIsLocalListening(false);
      setIsFinalSpeech(true);
      if (spokenText.trim() && spokenText.trim() !== lastAiAnalyzedTextRef.current) {
        runDeepAiAnalysis(spokenText.trim());
      }
      return;
    }

    tts.stop();
    setSpokenText('');
    setAiResult(null);
    setSelectedWord(null);
    setIsFinalSpeech(false);
    setIsLocalListening(true);

    recognitionRef.current.startListening(
      (result) => {
        setSpokenText(result.transcript);
        if (typeof result.confidence === 'number') {
          setConfidence(result.confidence);
        }
        if (result.isFinal) {
          setIsFinalSpeech(true);
        }
      },
      (err) => {
        if (err !== 'no-speech' && err !== 'aborted') {
          setSpeechError(`Erro no microfone (${String(err)}). Verifique a permissão de áudio.`);
        }
        setIsLocalListening(false);
      },
      () => {
        setIsLocalListening(false);
        setIsFinalSpeech(true);
      },
      { continuous: true, lang: voiceLang }
    );
  };

  // Trigger deep Gemini AI phonetic analysis when final speech completes or when requested
  const runDeepAiAnalysis = async (textToAnalyze: string) => {
    const clean = textToAnalyze.trim();
    if (!clean || isAnalyzingAi) return;
    lastAiAnalyzedTextRef.current = clean;
    setIsAnalyzingAi(true);
    setSpeechError(null);

    try {
      const response = await fetch('/api/analyze-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: clean,
          targetText: comparisonMode === 'target' ? activeTarget : '',
          confidence,
          userLevel,
          accent: voiceLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível aprofundar a análise fonética.');
      }

      const data = await response.json();
      if (Array.isArray(data.words) && data.words.length > 0) {
        const finalScore =
          typeof data.accuracyScore === 'number' ? data.accuracyScore : liveAnalysis.accuracyScore;
        setAiResult({
          targetText: data.targetText || activeTarget,
          spokenText: clean,
          accuracyScore: finalScore,
          words: data.words,
          summaryPt: data.summaryPt || liveAnalysis.summaryPt,
          aiEnriched: true,
        });
        const firstProblem =
          data.words.find((w: AnalyzedWord) => w.status === 'mispronounced' || w.status === 'missing') ||
          data.words.find((w: AnalyzedWord) => w.status === 'close');
        if (firstProblem) setSelectedWord(firstProblem);
        onAddXp?.(15);

        if (auth.currentUser?.emailVerified) {
          savePronunciationLogToCloud(
            auth.currentUser.uid,
            data.targetText || activeTarget || clean,
            clean,
            finalScore
          ).catch((err) => console.warn('Erro ao salvar histórico de pronúncia:', err));
        }
      }
    } catch (err: any) {
      console.warn('Deep pronunciation analysis fallback:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Trigger AI enrichment automatically when external parent conversation speech finishes
  useEffect(() => {
    if (liveIsFinal && spokenText.trim() && spokenText.trim() !== lastAiAnalyzedTextRef.current) {
      runDeepAiAnalysis(spokenText.trim());
    }
  }, [liveIsFinal]);

  const handlePlayAiWord = (word: string, slow: boolean = false) => {
    if (!word) return;
    const rate = slow ? Math.max(0.65, speechRate * 0.72) : speechRate;
    tts.speak(word, rate, 1.0, undefined, undefined, voiceLang);
  };

  const handleReset = () => {
    if (isLocalListening) {
      recognitionRef.current?.stopListening();
      setIsLocalListening(false);
    }
    setSpokenText('');
    setAiResult(null);
    setSelectedWord(null);
    setIsFinalSpeech(false);
    setSpeechError(null);
    lastAiAnalyzedTextRef.current = '';
  };

  const uniquePhraseOptions = useMemo(() => {
    const raw = [targetPhrase, ...suggestedPhrases]
      .map(s => (s || '').trim())
      .filter(Boolean);
    return Array.from(new Set(raw)).slice(0, 3);
  }, [targetPhrase, suggestedPhrases]);

  const issueWords = liveAnalysis.words.filter(
    w => w.status === 'mispronounced' || w.status === 'missing' || (w.status === 'close' && w.spokenWord !== '')
  );

  return (
    <div className="bg-slate-900/95 border border-violet-500/40 rounded-2xl p-4 shadow-xl space-y-3.5 text-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
            isListeningNow
              ? 'bg-red-500/20 border-red-500/50 text-red-300'
              : 'bg-violet-500/15 border-violet-500/30 text-violet-300'
          }`}>
            <AudioLines className={`w-4 h-4 ${isListeningNow ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              Analisador de Pronúncia em Tempo Real
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{isListeningNow ? 'Ouvindo sua voz agora' : 'Compare palavra por palavra com a IA'}</span>
              <span aria-hidden="true">·</span>
              <span>Sotaque {voiceLang === 'en-GB' ? 'Britânico' : 'Americano'}</span>
              {spokenText.trim() && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={`font-bold ${
                    liveAnalysis.accuracyScore >= 85
                      ? 'text-emerald-400'
                      : liveAnalysis.accuracyScore >= 65
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    Precisão: {liveAnalysis.accuracyScore}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Segmented Mode Control */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setComparisonMode('target');
                setAiResult(null);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                comparisonMode === 'target'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comparar com IA
            </button>
            <button
              type="button"
              onClick={() => {
                setComparisonMode('free');
                setAiResult(null);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                comparisonMode === 'free'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fala Livre
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Fechar analisador"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target AI Pronunciation Reference (in Target Mode) */}
      {comparisonMode === 'target' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
              Frase de Referência da IA:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePlayAiWord(activeTarget, true)}
                disabled={!activeTarget.trim()}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition"
              >
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>0.7x Devagar</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlayAiWord(activeTarget, false)}
                disabled={!activeTarget.trim()}
                className="px-2.5 py-1 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Volume2 className="w-3 h-3" />
                <span>Ouvir IA</span>
              </button>
            </div>
          </div>

          <input
            type="text"
            value={activeTarget}
            onChange={(e) => {
              setActiveTarget(e.target.value);
              setAiResult(null);
            }}
            placeholder="Digite ou selecione uma frase em inglês da IA para comparar sua pronúncia..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-violet-500"
          />

          {uniquePhraseOptions.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Trocar frase da IA:</span>
              {uniquePhraseOptions.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveTarget(phrase);
                    setAiResult(null);
                    setSelectedWord(null);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded border transition truncate max-w-[220px] ${
                    activeTarget === phrase
                      ? 'bg-violet-950/70 border-violet-500/60 text-violet-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Waveform & Microphone Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleLocalListen}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md shrink-0 ${
              isLocalListening
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/20'
            }`}
          >
            {isLocalListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Parar e Analisar</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{spokenText ? 'Falar Novamente' : 'Ouvir Minha Pronúncia'}</span>
              </>
            )}
          </button>

          {/* Real-Time Audio Level Bars */}
          <div className="flex items-center gap-1 h-8 px-2" aria-hidden="true">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isListeningNow ? 'bg-violet-400' : 'bg-slate-700'
                }`}
                style={{ height: `${Math.max(15, lvl)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {spokenText.trim() && !isListeningNow && (
            <button
              type="button"
              onClick={() => runDeepAiAnalysis(spokenText)}
              disabled={isAnalyzingAi}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 hover:text-white border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition"
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{aiResult ? 'Reanalisar com IA' : 'Análise Fonética IA'}</span>
                </>
              )}
            </button>
          )}

          {spokenText && (
            <button
              type="button"
              onClick={handleReset}
              title="Limpar transcrição"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {speechError && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Real-Time Highlighted Words Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Comparação Palavra por Palavra (Tempo Real):</span>
          </span>

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Correta
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Leve desvio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Pronúncia divergente
            </span>
          </div>
        </div>

        {liveAnalysis.words.length === 0 ? (
          <p className="text-slate-500 text-xs italic py-2">
            {isListeningNow
              ? 'Pode começar a falar em inglês! As palavras aparecerão aqui instantaneamente...'
              : 'Clique em "Ouvir Minha Pronúncia" ou use o microfone da conversa para ver o destaque em tempo real.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 py-1">
            {liveAnalysis.words.map((word) => {
              const isSelected = selectedWord?.id === word.id;
              const isWaitingWhileSpeaking =
                !isFinalSpeech && word.status === 'close' && word.spokenWord === '';

              let styleClass =
                'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:border-emerald-400';
              if (isWaitingWhileSpeaking) {
                styleClass = 'bg-slate-900 text-slate-500 border-slate-800';
              } else if (word.status === 'mispronounced' || word.status === 'missing') {
                styleClass =
                  'bg-rose-500/20 text-rose-200 border-rose-500/60 underline decoration-wavy decoration-rose-400 hover:bg-rose-500/30';
              } else if (word.status === 'close') {
                styleClass =
                  'bg-amber-500/15 text-amber-200 border-amber-500/50 underline decoration-dashed decoration-amber-400 hover:bg-amber-500/25';
              } else if (word.status === 'extra') {
                styleClass = 'bg-slate-800 text-slate-300 border-slate-700 line-through';
              }

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => setSelectedWord(word)}
                  className={`px-2.5 py-1 rounded-lg border text-sm font-semibold transition flex items-center gap-1.5 ${styleClass} ${
                    isSelected ? 'ring-2 ring-white/70 scale-[1.03]' : ''
                  }`}
                >
                  <span>
                    {word.status === 'missing'
                      ? word.expectedWord
                      : word.expectedWord || word.spokenWord}
                  </span>
                  {(word.status === 'mispronounced' || word.status === 'missing') && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  {word.status === 'close' && !isWaitingWhileSpeaking && (
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                  {word.status === 'accurate' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Raw Heard Transcript */}
        {spokenText && (
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-300">O que o microfone captou: </span>
              <span className="italic text-slate-200">"{spokenText}"</span>
            </div>
            {aiResult?.aiEnriched && (
              <span className="text-[10px] text-violet-300 font-semibold">
                Análise Fonética IA Ativa
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          {liveAnalysis.summaryPt}
        </p>
      </div>

      {/* Interactive Selected Word Inspector (Mispronounced Word Drill) */}
      {selectedWord && (
        <div className="bg-gradient-to-r from-slate-950 via-violet-950/30 to-slate-950 border border-violet-500/40 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                "{selectedWord.expectedWord || selectedWord.spokenWord}"
              </span>
              {selectedWord.phoneticEasy && (
                <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  [{selectedWord.phoneticEasy}]
                </span>
              )}
              {selectedWord.ipa && (
                <span className="font-mono text-[11px] text-slate-400">
                  {selectedWord.ipa}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePlayAiWord(selectedWord.expectedWord || selectedWord.spokenWord, true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Volume2 className="w-3 h-3" />
                <span>Ouvir Lento</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlayAiWord(selectedWord.expectedWord || selectedWord.spokenWord, false)}
                className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Volume2 className="w-3 h-3" />
                <span>Pronúncia da IA</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Comparação Acústica:
              </span>
              <p className="text-slate-200">
                Você falou:{' '}
                <strong className={
                  selectedWord.status === 'accurate' ? 'text-emerald-300' : 'text-rose-300'
                }>
                  {selectedWord.spokenWord ? `"${selectedWord.spokenWord}"` : '(palavra omitida)'}
                </strong>
                {' · '}
                Alvo IA: <strong className="text-violet-300">"{selectedWord.expectedWord}"</strong>
              </p>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-violet-400 block mb-0.5">
                Como Corrigir (Dica para Brasileiros):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {selectedWord.tipPt || 'Ouça o áudio da IA e repita respeitando a sílaba tônica e consoante final.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Footer when transcript exists */}
      {(spokenText.trim() || issueWords.length > 0) && onUseSpokenText && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-[11px] text-slate-400">
            {issueWords.length > 0
              ? `${issueWords.length} palavra(s) marcada(s) para revisão rápida acima.`
              : 'Pronto para enviar sua fala na conversa!'}
          </div>

          {spokenText.trim() && (
            <button
              type="button"
              onClick={() => onUseSpokenText(spokenText.trim())}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Fala na Conversa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
