import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  Languages, 
  Award, 
  Send, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  HeartHandshake, 
  Code2, 
  Coffee, 
  GraduationCap,
  MessageSquare,
  SkipForward,
  PenTool,
  CheckCircle,
  Eye,
  AudioLines
} from 'lucide-react';
import { AvatarMentorProfile, ChatMessage, UserLevel, VocabularyItem } from '../types';
import { AVATAR_PROFILES } from '../data/avatarProfiles';
import { tts, SpeechRecognitionManager } from '../utils/speech';
import { RealTimePronunciationAnalyzer } from './RealTimePronunciationAnalyzer';
import { getBeginnerAvatarGreeting, getBeginnerImmersionStage } from '../utils/beginnerProgression';

interface HumanAvatarsRoomProps {
  userLevel: UserLevel;
  speechRate: number;
  isAudioMuted: boolean;
  onSaveWord: (word: VocabularyItem) => void;
  onAddXp: (amount: number) => void;
}

export const HumanAvatarsRoom: React.FC<HumanAvatarsRoomProps> = ({
  userLevel,
  speechRate,
  isAudioMuted,
  onSaveWord,
  onAddXp,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarMentorProfile>(AVATAR_PROFILES[0]);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  
  // Hands-free continuous call mode
  const [isHandsFreeCall, setIsHandsFreeCall] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});

  // Writing drill states
  const [writingInputs, setWritingInputs] = useState<Record<string, string>>({});
  const [showSuggestedAnswers, setShowSuggestedAnswers] = useState<Record<string, boolean>>({});
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});

  // Real-time pronunciation analysis states
  const [showPronunciationAnalyzer, setShowPronunciationAnalyzer] = useState<boolean>(false);
  const [analyzerTargetPhrase, setAnalyzerTargetPhrase] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveConfidence, setLiveConfidence] = useState<number>(0.85);
  const [liveIsFinal, setLiveIsFinal] = useState<boolean>(false);

  // Chat messages for current avatar
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handsFreeRef = useRef<boolean>(false);

  // Keep ref in sync
  useEffect(() => {
    handsFreeRef.current = isHandsFreeCall;
  }, [isHandsFreeCall]);

  // Initialize Speech recognition
  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
  }, []);

  // Initialize avatar greeting when avatar or level changes
  useEffect(() => {
    initAvatarChat(selectedAvatar);
  }, [selectedAvatar, userLevel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, avatarState]);

  const initAvatarChat = (avatar: AvatarMentorProfile) => {
    tts.stop();
    setIsListening(false);
    setIsHandsFreeCall(false);
    setAvatarState('idle');

    const beginnerData = getBeginnerAvatarGreeting(avatar.id);
    const isBeginner = userLevel === 'beginner';

    // Default pronunciation coach based on avatar specialty
    const defaultPronunciation = isBeginner
      ? {
          targetPhrase: beginnerData.targetPhrase,
          phoneticEasy: beginnerData.phoneticEasy,
          mouthPositionPt: beginnerData.mouthPositionPt,
          commonPitfallPt: beginnerData.commonPitfallPt,
        }
      : avatar.id === 'pastor_david'
      ? {
          targetPhrase: "Steadfast love and faithfulness",
          phoneticEasy: "STÉD-fæst lúv ænd FEITH-ful-nəs",
          mouthPositionPt: 'No "th" de faithfulness, coloque suavemente a ponta da língua entre os dentes superiores e inferiores e solte o ar.',
          commonPitfallPt: 'Brasileiros tendem a falar "fêt-ful" com som de T. O "th" é soprado com a ponta da língua.'
        }
      : avatar.id === 'sarah_tech'
      ? {
          targetPhrase: "Throughput and latency trade-offs",
          phoneticEasy: "THRU-put ænd LEI-tən-si TRÉID-óffs",
          mouthPositionPt: 'No "throughput", projete a ponta da língua entre os dentes para o "TH" antes do som de R.',
          commonPitfallPt: 'Cuidado para não pronunciar "troo-púti" colocando "i" no final de throughput. Termine a consoante seca.'
        }
      : avatar.id === 'emma_british'
      ? {
          targetPhrase: "Could I possibly have the schedule?",
          phoneticEasy: "KUD AI PÓ-si-bli HÆV ðə SHÉ-djuul",
          mouthPositionPt: 'No inglês britânico elegante, "schedule" começa com o som macio de SH ("shédjul"), relaxando os lábios.',
          commonPitfallPt: 'No inglês britânico soa "SH", diferente do americano que soa "SK" (skédjul).'
        }
      : {
          targetPhrase: "What's up, can I grab a coffee to go?",
          phoneticEasy: "UÓTS ÁP, KÆN AI GRÆB ə KÓ-fi TU GÔU",
          mouthPositionPt: 'Ligue o som: "grab a" vira "græ-bə" de forma contínua.',
          commonPitfallPt: 'Não fale "grabi a coffee". Conecte a consoante B direto na vogal seguinte.'
        };

    const greetingMsg: ChatMessage = {
      id: `avatar-init-${Date.now()}`,
      role: 'model',
      content: isBeginner ? beginnerData.content : avatar.greetingEn,
      mentorGuidancePt: isBeginner ? beginnerData.mentorGuidancePt : avatar.greetingPt,
      translationPt: isBeginner ? beginnerData.translationPt : avatar.greetingPt,
      timestamp: Date.now(),
      followUpQuestion: isBeginner ? beginnerData.starterPrompts[0] : avatar.starterPrompts[0],
      pronunciationCoach: defaultPronunciation,
      writingDrill: {
        promptPt: isBeginner
          ? beginnerData.writingPromptPt
          : `Escreva uma saudação de resposta em inglês dizendo como você está hoje para ${avatar.name.split(' ')[0]}. (Você pode pular se preferir apenas falar!)`,
        suggestedAnswerEn: isBeginner
          ? beginnerData.writingSuggestedEn
          : `Hello ${avatar.name.split(' ')[0]}! I am doing well, ready to learn with you today.`
      }
    };

    setMessages([greetingMsg]);
    setInputValue('');
    setLiveTranscript('');
    setLiveIsFinal(false);
    setAnalyzerTargetPhrase(defaultPronunciation.targetPhrase);
    setShowTranslations({});
    setWritingInputs({});
    setShowSuggestedAnswers({});
    setCompletedDrills({});

    // Speak greeting warmly in PT-BR for beginners or avatar's English accent for intermediate/advanced
    if (!isAudioMuted) {
      setAvatarState('speaking');
      tts.speak(
        greetingMsg.content,
        isBeginner ? Math.max(0.9, avatar.voiceRate) : avatar.voiceRate,
        1.0,
        () => setAvatarState('idle'),
        () => setAvatarState('idle'),
        isBeginner ? 'pt-BR' : avatar.voiceLang
      );
    }
  };

  const handleSpeakWithAvatar = (text: string, onDone?: () => void, customLang?: string) => {
    setAvatarState('speaking');
    tts.speak(
      text,
      selectedAvatar.voiceRate,
      1.0,
      () => {
        setAvatarState('idle');
        onDone?.();
        // If in hands-free call mode, automatically trigger microphone after speaking!
        if (handsFreeRef.current) {
          setTimeout(() => {
            startListeningTurn();
          }, 400);
        }
      },
      () => {
        setAvatarState('idle');
        onDone?.();
      },
      customLang || selectedAvatar.voiceLang
    );
  };

  const startListeningTurn = () => {
    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      setIsHandsFreeCall(false);
      return;
    }

    setIsListening(true);
    setAvatarState('listening');
    setLiveTranscript('');
    setLiveIsFinal(false);

    recognitionRef.current.startListening(
      (result) => {
        setInputValue(result.transcript);
        setLiveTranscript(result.transcript);
        setLiveConfidence(result.confidence ?? 0.85);
        setLiveIsFinal(result.isFinal);

        if (result.isFinal && result.transcript.trim()) {
          setIsListening(false);
          if (handsFreeRef.current || !showPronunciationAnalyzer) {
            handleSendMessage(result.transcript.trim());
          } else {
            setAvatarState('idle');
          }
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
        setAvatarState('idle');
      },
      () => {
        setIsListening(false);
        if (avatarState === 'listening') {
          setAvatarState('idle');
        }
      },
      { lang: selectedAvatar.voiceLang }
    );
  };

  const toggleHandsFreeCall = () => {
    if (isHandsFreeCall) {
      // Hang up
      setIsHandsFreeCall(false);
      tts.stop();
      recognitionRef.current?.stopListening();
      setIsListening(false);
      setAvatarState('idle');
    } else {
      // Start live voice call
      setIsHandsFreeCall(true);
      // Play a short greeting prompt then start listening
      handleSpeakWithAvatar(`I'm listening! You can start speaking now.`, () => {
        startListeningTurn();
      });
    }
  };

  const handleTogglePushToTalk = () => {
    if (isListening) {
      recognitionRef.current?.stopListening();
      setIsListening(false);
      setAvatarState('idle');
    } else {
      startListeningTurn();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stopListening();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setAvatarState('thinking');

    const studentTurnsCount = messages.filter(m => m.role === 'user').length;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
          persona: selectedAvatar.id,
          level: userLevel,
          focus: selectedAvatar.id === 'pastor_david' ? 'worship' : selectedAvatar.id === 'sarah_tech' ? 'tech' : 'mixed',
          interactionCount: studentTurnsCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do avatar.');
      }

      const data = await response.json();

      const mentorMsg: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'model',
        content: data.replyEn || "Que ótimo falar com você! Vamos dar o próximo passo juntos.",
        mentorGuidancePt: data.mentorGuidancePt,
        translationPt: data.replyPt,
        score: data.score,
        feedback: data.userFeedback,
        pronunciationCoach: data.pronunciationCoach,
        writingDrill: data.writingDrill,
        vocabulary: data.vocabulary,
        followUpQuestion: data.followUpQuestionEn,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, mentorMsg]);
      onAddXp(35);

      // Speak response warmly in PT-BR during early beginner turns or in English thereafter
      if (!isAudioMuted && data.replyEn) {
        const spokenLang =
          data.replyLang === 'pt-BR' || (userLevel === 'beginner' && studentTurnsCount <= 2)
            ? 'pt-BR'
            : selectedAvatar.voiceLang;
        handleSpeakWithAvatar(data.replyEn, undefined, spokenLang);
      } else {
        setAvatarState('idle');
      }

    } catch (err: any) {
      console.error(err);
      setAvatarState('idle');
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: "I had a brief connection issue. Could you say that one more time?",
        translationPt: "Tive uma breve falha de conexão. Você poderia falar mais uma vez?",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTranslation = (id: string) => {
    setShowTranslations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSkipStep = () => {
    handleSendMessage("Pular este exercício e avançar para o próximo passo da jornada.");
  };

  const handleWritingDrillSubmit = (msgId: string) => {
    const text = (writingInputs[msgId] || '').trim();
    if (!text) return;
    setCompletedDrills(prev => ({ ...prev, [msgId]: true }));
    onAddXp(20);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-950/70 via-slate-900 to-indigo-950/70 border border-violet-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-2 border border-violet-500/30">
              <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Avatares Humanos com Voz & Expressão Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Aprenda Inglês Conversando com Pessoas Reais de IA
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pratique conversação ativa com nativos americanos e britânicos. Escolha seu mentor, ative o <strong>Modo Chamada de Voz Contínua</strong> para falar sem precisar clicar, e receba correções imediatas de pronúncia e gramática.
            </p>
          </div>

          {/* Quick Call Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleHandsFreeCall}
              className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isHandsFreeCall
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse-glow'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isHandsFreeCall ? (
                <>
                  <PhoneOff className="w-5 h-5" />
                  <span>Encerrar Chamada</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5" />
                  <span>Iniciar Chamada de Voz</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Avatars Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {AVATAR_PROFILES.map((avatar) => {
          const isSelected = selectedAvatar.id === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => {
                if (avatar.id !== selectedAvatar.id) {
                  setSelectedAvatar(avatar);
                }
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-violet-950/80 to-slate-900 border-violet-500 shadow-lg shadow-violet-900/30 ring-1 ring-violet-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 shadow"
                />
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white truncate">
                    {avatar.name}
                  </h4>
                </div>
                <p className="text-[11px] text-violet-300 truncate font-medium">
                  {avatar.role}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  📍 {avatar.location.split(',')[0]} • {avatar.accent.split('(')[0].trim()}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Video Call & Conversation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: The Human Avatar Visual Call Screen (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center justify-between min-h-[480px]">
            
            {/* Ambient Background Aura */}
            <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              avatarState === 'speaking' 
                ? 'bg-radial from-violet-600/20 via-transparent to-transparent opacity-100'
                : avatarState === 'listening'
                ? 'bg-radial from-emerald-600/20 via-transparent to-transparent opacity-100'
                : 'opacity-0'
            }`} />

            {/* Top Bar: Call Status */}
            <div className="w-full flex items-center justify-between z-10 text-xs">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/80">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  avatarState === 'speaking'
                    ? 'bg-violet-400 animate-pulse'
                    : avatarState === 'listening'
                    ? 'bg-emerald-400 animate-ping'
                    : avatarState === 'thinking'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-emerald-400'
                }`} />
                <span className="font-semibold text-slate-200">
                  {avatarState === 'speaking'
                    ? `${selectedAvatar.name} falando...`
                    : avatarState === 'listening'
                    ? "Ouvindo você..."
                    : avatarState === 'thinking'
                    ? "Pensando..."
                    : isHandsFreeCall
                    ? "Em chamada contínua"
                    : "Pronto para conversar"}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                {selectedAvatar.accent.split('(')[0].trim()}
              </span>
            </div>

            {/* Central Avatar Visual Presentation */}
            <div className="relative my-6 flex flex-col items-center">
              
              {/* Radiating Soundwave Rings when speaking or listening */}
              {avatarState === 'speaking' && (
                <div className="absolute inset-0 -m-4 rounded-full border-2 border-violet-500/40 animate-ping pointer-events-none" />
              )}
              {avatarState === 'listening' && (
                <div className="absolute inset-0 -m-4 rounded-full border-2 border-emerald-500/40 animate-ping pointer-events-none" />
              )}

              {/* Portrait Image with Dynamic Glow Ring */}
              <div className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 transition-all duration-300 shadow-2xl ${
                avatarState === 'speaking'
                  ? 'bg-gradient-to-tr from-violet-500 via-purple-500 to-amber-400 shadow-violet-500/40 ring-4 ring-violet-500/30'
                  : avatarState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/40 ring-4 ring-emerald-500/30'
                  : avatarState === 'thinking'
                  ? 'bg-gradient-to-tr from-amber-500 to-indigo-500 ring-2 ring-amber-500/30'
                  : 'bg-slate-800'
              }`}>
                <img
                  src={selectedAvatar.image}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-cover rounded-full shadow-inner"
                />

                {/* Animated Audio Equalizer overlay when speaking */}
                {avatarState === 'speaking' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full border border-violet-500/40">
                    <span className="w-1 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 h-4 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="text-[10px] font-bold text-violet-300 ml-1">Voz Ativa</span>
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="text-center mt-4">
                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                  <span>{selectedAvatar.name}</span>
                </h3>
                <p className="text-xs text-violet-300 font-medium">
                  {selectedAvatar.role}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedAvatar.location}
                </p>
              </div>
            </div>

            {/* Bottom Call Controls */}
            <div className="w-full flex items-center justify-center gap-3 z-10 pt-2 border-t border-slate-800/80">
              
              {/* Push-to-Talk Mic Button */}
              <button
                onClick={handleTogglePushToTalk}
                title={isListening ? "Parar de falar" : "Segurar ou clicar para falar em inglês"}
                className={`p-3.5 rounded-full font-bold transition-all shadow-lg flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse-glow ring-4 ring-red-500/40'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Hands-Free Mode Toggle */}
              <button
                onClick={toggleHandsFreeCall}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 border ${
                  isHandsFreeCall
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {isHandsFreeCall ? (
                  <>
                    <PhoneOff className="w-4 h-4 text-red-400" />
                    <span>Desligar Ligação</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                    <span>Modo Ligação (Mãos Livres)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => initAvatarChat(selectedAvatar)}
                title="Reiniciar diálogo com este mentor"
                className="p-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Avatar Bio & Specialties */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 block mb-0.5">
                Sobre seu Mentor:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedAvatar.bioPt}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Especialidades de Conversação:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAvatar.specialties.map((spec, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-violet-950/60 text-violet-300 border border-violet-800/60 font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right: Real-Time Conversation Dialogue & Instant Pedagogical Feedback (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[650px] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header of Conversation */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-slate-200">
                Diálogo em Tempo Real com {selectedAvatar.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">Conversação Ativa</span>
            </div>
          </div>

          {/* Beginner Progressive Immersion Status Bar */}
          {userLevel === 'beginner' && (() => {
            const studentTurns = messages.filter(m => m.role === 'user').length;
            const stageInfo = getBeginnerImmersionStage(userLevel, studentTurns);
            return (
              <div className="px-4 py-2 bg-indigo-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-indigo-300">{stageInfo.labelPt}</span>
                  <span className="text-slate-400 ml-2 hidden sm:inline">{stageInfo.descriptionPt}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 tabular-nums">
                  {stageInfo.englishRatioPercent}% inglês gradual
                </span>
              </div>
            );
          })()}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            
            {/* Quick Conversation Starters */}
            {messages.length <= 2 && (() => {
              const activeStarters =
                userLevel === 'beginner'
                  ? getBeginnerAvatarGreeting(selectedAvatar.id).starterPrompts
                  : selectedAvatar.starterPrompts;
              return (
                <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-800/30 space-y-2 mb-3">
                  <div className="flex items-center gap-1.5 text-violet-300 text-xs font-bold">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {userLevel === 'beginner'
                        ? `Escolha como começar em português com ${selectedAvatar.name.split(' ')[0]}:`
                        : `Assuntos recomendados para falar com ${selectedAvatar.name.split(' ')[0]}:`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeStarters.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-xs bg-slate-900 hover:bg-violet-900/40 border border-slate-800 hover:border-violet-500/50 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition text-left flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3 text-violet-400 shrink-0" />
                        <span>"{prompt}"</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div
                    className={`p-4 rounded-2xl relative shadow-md transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none border border-violet-400/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <img
                            src={selectedAvatar.image}
                            alt={selectedAvatar.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-violet-400">
                            {selectedAvatar.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSpeakWithAvatar(msg.content)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Ouvir áudio com sotaque nativo"
                          >
                            <Volume2 className="w-4 h-4 text-violet-400" />
                          </button>

                          <button
                            onClick={() => {
                              setAnalyzerTargetPhrase(
                                msg.pronunciationCoach?.targetPhrase ||
                                msg.feedback?.betterVersion ||
                                msg.followUpQuestion ||
                                msg.content
                              );
                              setShowPronunciationAnalyzer(true);
                            }}
                            title="Comparar sua pronúncia palavra por palavra em tempo real"
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-violet-950/70 hover:bg-violet-900 text-violet-200 border border-violet-500/30 transition flex items-center gap-1"
                          >
                            <AudioLines className="w-3 h-3 text-violet-400" />
                            <span className="hidden sm:inline">Analisar Voz</span>
                          </button>

                          {msg.translationPt && (
                            <button
                              onClick={() => toggleTranslation(msg.id)}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                            >
                              <Languages className="w-3 h-3 text-emerald-400" />
                              <span>{showTranslations[msg.id] ? 'Ocultar' : 'Traduzir'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 1. Brazilian Portuguese Mentor Guidance on Top */}
                    {!isUser && (msg.mentorGuidancePt || msg.translationPt) && (
                      <div className="mb-3 p-3 rounded-xl bg-violet-950/70 border border-violet-500/40 text-xs shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-violet-500/30">
                          <span className="font-bold text-violet-200 flex items-center gap-1.5 text-[11px]">
                            <span>🇧🇷</span>
                            <span>Orientação do Mentor (Português do Brasil)</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            Jornada de Fluência
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-sans text-xs">
                          {msg.mentorGuidancePt || msg.translationPt}
                        </p>
                      </div>
                    )}

                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                      {msg.content}
                    </p>

                    {showTranslations[msg.id] && msg.translationPt && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                          Tradução em Português:
                        </span>
                        {msg.translationPt}
                      </div>
                    )}
                  </div>

                  {/* 2. Interactive Pronunciation Coach Card */}
                  {!isUser && msg.pronunciationCoach && (
                    <div className="mt-2.5 w-full bg-slate-900/95 border border-purple-500/30 rounded-xl p-3.5 shadow-md text-xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                        <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span>Treinador de Pronúncia para Brasileiros</span>
                        </div>
                        <button
                          onClick={() => handleSpeakWithAvatar(msg.pronunciationCoach?.targetPhrase || '')}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1 text-[11px] transition shadow"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ouvir Nativo</span>
                        </button>
                      </div>

                      <div className="bg-slate-950/90 p-2.5 rounded-lg border border-purple-900/40">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Frase / Palavra Alvo:</div>
                        <div className="text-sm font-bold text-white tracking-wide">
                          "{msg.pronunciationCoach.targetPhrase}"
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/20 text-purple-200 font-mono text-xs font-bold border border-purple-500/30">
                          <span>Pronúncia Facilitada:</span>
                          <span className="text-emerald-300">[{msg.pronunciationCoach.phoneticEasy}]</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                          <strong className="text-violet-300 block text-[11px] mb-0.5">Posição da Boca & Língua:</strong>
                          <span>{msg.pronunciationCoach.mouthPositionPt}</span>
                        </div>
                        {msg.pronunciationCoach.commonPitfallPt && (
                          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                            <strong className="text-amber-300 block text-[11px] mb-0.5">Atenção (Erro Comum):</strong>
                            <span>{msg.pronunciationCoach.commonPitfallPt}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setInputValue(msg.pronunciationCoach?.targetPhrase || '');
                              handleTogglePushToTalk();
                            }}
                            className="text-[11px] text-violet-300 hover:text-white flex items-center gap-1 bg-violet-900/40 hover:bg-violet-800/60 px-2.5 py-1 rounded-lg border border-violet-700/40 transition"
                          >
                            <Mic className="w-3 h-3 text-violet-400" />
                            <span>Falar e Treinar Esta Frase</span>
                          </button>

                          <button
                            onClick={() => {
                              setAnalyzerTargetPhrase(msg.pronunciationCoach?.targetPhrase || '');
                              setShowPronunciationAnalyzer(true);
                            }}
                            className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-600/40 transition"
                          >
                            <AudioLines className="w-3 h-3 text-emerald-400" />
                            <span>Analisador Ao Vivo</span>
                          </button>
                        </div>

                        <button
                          onClick={handleSkipStep}
                          className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                        >
                          <SkipForward className="w-3 h-3 text-amber-400" />
                          <span>Pular este treino</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Interactive Writing Drill (Mesclar Fala com Escrita) */}
                  {!isUser && msg.writingDrill && (
                    <div className="mt-2 w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm text-xs space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Treino de Escrita Opcional (Fixação da Grafia)</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Pule quando desejar</span>
                      </div>

                      <p className="text-slate-300 text-xs">
                        {msg.writingDrill.promptPt}
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={writingInputs[msg.id] || ''}
                          onChange={(e) => setWritingInputs({ ...writingInputs, [msg.id]: e.target.value })}
                          placeholder="Digite sua resposta em inglês aqui..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleWritingDrillSubmit(msg.id)}
                          disabled={!writingInputs[msg.id]?.trim()}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            completedDrills[msg.id]
                              ? 'bg-emerald-600 text-white'
                              : writingInputs[msg.id]?.trim()
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{completedDrills[msg.id] ? 'Concluído (+20 XP)' : 'Checar'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          onClick={() => setShowSuggestedAnswers({ ...showSuggestedAnswers, [msg.id]: !showSuggestedAnswers[msg.id] })}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{showSuggestedAnswers[msg.id] ? 'Ocultar Resposta Modelo' : 'Ver Resposta Modelo'}</span>
                        </button>

                        <button
                          onClick={handleSkipStep}
                          className="text-slate-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                        >
                          <SkipForward className="w-3 h-3 text-amber-400" />
                          <span>Pular Escrita</span>
                        </button>
                      </div>

                      {showSuggestedAnswers[msg.id] && (
                        <div className="mt-1.5 p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 text-xs">
                          <strong className="block text-[10px] uppercase text-indigo-300 mb-0.5">Sugestão de Escrita:</strong>
                          <span>"{msg.writingDrill.suggestedAnswerEn}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Feedback on User Speech */}
                  {!isUser && msg.feedback && (
                    <div className="mt-2.5 w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm text-xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                          Como você se comunicou:
                        </span>
                        {msg.score !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            msg.score >= 85
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : msg.score >= 70
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          }`}>
                            Fluência Humana: {msg.score}/100
                          </span>
                        )}
                      </div>

                      {/* Better Version */}
                      {msg.feedback.betterVersion && (
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold text-violet-400">
                              Como um nativo falaria naturalmente:
                            </span>
                            <button
                              onClick={() => handleSpeakWithAvatar(msg.feedback?.betterVersion || '')}
                              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Ouvir</span>
                            </button>
                          </div>
                          <p className="text-slate-100 font-medium italic text-xs sm:text-sm">
                            "{msg.feedback.betterVersion}"
                          </p>
                        </div>
                      )}

                      {/* Pronunciation Tip */}
                      {msg.feedback.pronunciationTip && (
                        <div className="text-purple-300 text-xs bg-purple-950/20 p-2 rounded border border-purple-900/30 flex items-start gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[11px] text-purple-200">Dica de Pronúncia:</strong>
                            <span>{msg.feedback.pronunciationTip}</span>
                          </div>
                        </div>
                      )}

                      {/* Grammar Explanation in Portuguese */}
                      {msg.feedback.explanationPt && (
                        <div className="text-slate-300 text-xs bg-violet-950/20 p-2 rounded border border-violet-900/30">
                          <strong className="text-violet-300 block mb-0.5">Explicação do Mentor:</strong>
                          {msg.feedback.explanationPt}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl p-3 w-fit">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                <span>{selectedAvatar.name} está ouvindo e formulando a resposta...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text & Speech Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
            {showPronunciationAnalyzer && (() => {
              const latestAiMsg = [...messages].reverse().find(m => m.role === 'model');
              const effectiveTarget =
                analyzerTargetPhrase ||
                latestAiMsg?.pronunciationCoach?.targetPhrase ||
                latestAiMsg?.feedback?.betterVersion ||
                latestAiMsg?.followUpQuestion ||
                latestAiMsg?.content ||
                selectedAvatar.starterPrompts[0];
              const suggestedPhrases = Array.from(
                new Set(
                  [
                    latestAiMsg?.pronunciationCoach?.targetPhrase,
                    latestAiMsg?.feedback?.betterVersion,
                    latestAiMsg?.followUpQuestion,
                    ...selectedAvatar.starterPrompts,
                  ].filter((p): p is string => Boolean(p && p.trim()))
                )
              ).slice(0, 5);

              return (
                <div className="max-h-[46vh] overflow-y-auto pr-0.5">
                  <RealTimePronunciationAnalyzer
                    targetPhrase={effectiveTarget}
                    suggestedPhrases={suggestedPhrases}
                    voiceLang={selectedAvatar.voiceLang}
                    speechRate={selectedAvatar.voiceRate || speechRate}
                    userLevel={userLevel}
                    liveTranscript={liveTranscript}
                    liveIsListening={isListening}
                    liveConfidence={liveConfidence}
                    liveIsFinal={liveIsFinal}
                    onUseSpokenText={(spoken) => handleSendMessage(spoken)}
                    onAddXp={onAddXp}
                    onClose={() => setShowPronunciationAnalyzer(false)}
                  />
                </div>
              );
            })()}

            {isListening && (
              <div className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Ouvindo sua voz em inglês... fale com {selectedAvatar.name}!</span>
                </div>
                <button
                  onClick={handleTogglePushToTalk}
                  className="text-[11px] font-bold text-red-300 hover:text-white underline"
                >
                  Concluir
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleTogglePushToTalk}
                title={isListening ? "Parar de falar" : "Falar pelo Microfone (Speech-to-Text)"}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white border-red-400 animate-pulse-glow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-violet-400" />}
              </button>

              <button
                type="button"
                onClick={() => setShowPronunciationAnalyzer(prev => !prev)}
                title="Analisador de Pronúncia em Tempo Real (destaca palavras com erro vs. nativo)"
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                  showPronunciationAnalyzer
                    ? 'bg-emerald-600/25 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                <AudioLines className="w-5 h-5 text-emerald-400" />
                <span className="hidden md:inline">Pronúncia</span>
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isListening
                    ? "Ouvindo você..."
                    : `Fale ou digite em inglês para ${selectedAvatar.name}...`
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition shadow-inner"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={handleSkipStep}
                disabled={isLoading}
                title="Pular este exercício ou pergunta e avançar para o próximo tema da sua jornada"
                className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
              >
                <SkipForward className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Pular</span>
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`p-2.5 rounded-xl font-medium transition flex items-center justify-center shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
