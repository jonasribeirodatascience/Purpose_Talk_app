import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  BookmarkPlus, 
  RotateCcw, 
  Languages, 
  Award, 
  ArrowRight, 
  HelpCircle, 
  Check, 
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
  SkipForward,
  PenTool,
  Eye,
  CheckCircle,
  AudioLines
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  EverydayRoleplayScenario, 
  RoleplayChatMessage, 
  UserLevel, 
  VocabularyItem 
} from '../types';
import { EVERYDAY_SCENARIOS } from '../data/everydayScenarios';
import { tts, SpeechRecognitionManager } from '../utils/speech';
import { RealTimePronunciationAnalyzer } from './RealTimePronunciationAnalyzer';
import { getBeginnerImmersionStage } from '../utils/beginnerProgression';

interface RoleplayScenariosProps {
  userLevel: UserLevel;
  speechRate: number;
  isAudioMuted: boolean;
  onSaveWord: (word: VocabularyItem) => void;
  onAddXp: (amount: number) => void;
}

export const RoleplayScenarios: React.FC<RoleplayScenariosProps> = ({
  userLevel,
  speechRate,
  isAudioMuted,
  onSaveWord,
  onAddXp,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<EverydayRoleplayScenario>(EVERYDAY_SCENARIOS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Messages and goals state for the active scenario
  const [messages, setMessages] = useState<RoleplayChatMessage[]>([]);
  const [completedGoalIds, setCompletedGoalIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [isGoalsDrawerOpen, setIsGoalsDrawerOpen] = useState(true);

  // Writing drill states
  const [writingInputs, setWritingInputs] = useState<Record<string, string>>({});
  const [showSuggestedAnswers, setShowSuggestedAnswers] = useState<Record<string, boolean>>({});
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});

  // Real-time pronunciation analysis states
  const [showPronunciationAnalyzer, setShowPronunciationAnalyzer] = useState(false);
  const [analyzerTargetPhrase, setAnalyzerTargetPhrase] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveConfidence, setLiveConfidence] = useState(0.85);
  const [liveIsFinal, setLiveIsFinal] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation when scenario or userLevel changes
  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
    initializeScenario(selectedScenario);
  }, [selectedScenario, userLevel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const initializeScenario = (scenario: EverydayRoleplayScenario) => {
    const isBeginner = userLevel === 'beginner';
    const firstEnglishPhrase = scenario.initialBotGreetingEn;
    const beginnerGreeting = `Olá! Seja muito bem-vindo(a) ao cenário "${scenario.title}". Como estamos no nível iniciante, vamos começar em português para você se sentir tranquilo(a)! Aqui, ${scenario.characterName} diria: "${firstEnglishPhrase}" — que significa "${scenario.initialBotGreetingPt}". Você pode responder em português ou tentar escolher uma das frases fáceis abaixo!`;

    const initialMsg: RoleplayChatMessage = {
      id: `bot-init-${Date.now()}`,
      sender: 'bot',
      contentEn: isBeginner ? beginnerGreeting : firstEnglishPhrase,
      mentorGuidancePt: isBeginner
        ? `Primeira interação acolhedora em português! Não precisa saber inglês ainda — vamos introduzindo aos poucos.`
        : `Olá! Bem-vindo ao cenário '${scenario.title}'. Vou guiar você em português do Brasil até a fluência em situações do dia a dia, corrigindo pronúncia e mesclando com escrita.`,
      translationPt: scenario.initialBotGreetingPt,
      timestamp: Date.now(),
      writingDrill: {
        promptPt: isBeginner
          ? `Se quiser, tente digitar uma palavrinha em inglês (ex: "Hello, please") ou responda em português para ${scenario.characterName}.`
          : `Escreva como você responderia em inglês à pergunta do atendente (${scenario.characterName}). Você pode pular caso queira apenas falar!`,
        suggestedAnswerEn: scenario.quickStartersEn[0] || "Hello, I would like some help, please."
      },
      suggestedNextResponses: scenario.quickStartersEn.slice(0, 2),
    };
    setMessages([initialMsg]);
    setCompletedGoalIds(new Set());
    setInputValue('');
    setLiveTranscript('');
    setLiveIsFinal(false);
    setAnalyzerTargetPhrase(scenario.quickStartersEn[0] || scenario.initialBotGreetingEn);
    setShowTranslations({});
    setWritingInputs({});
    setShowSuggestedAnswers({});
    setCompletedDrills({});

    // Speak greeting in PT-BR for beginners or EN for higher levels
    if (!isAudioMuted) {
      tts.speak(initialMsg.contentEn, speechRate, 1.0, undefined, undefined, isBeginner ? 'pt-BR' : 'en-US');
    }
  };

  const handleStartListening = () => {
    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      alert("Reconhecimento de voz não suportado neste navegador. Experimente o Chrome ou Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setLiveTranscript('');
    setLiveIsFinal(false);
    recognitionRef.current.startListening(
      (result) => {
        setInputValue(result.transcript);
        setLiveTranscript(result.transcript);
        setLiveConfidence(result.confidence ?? 0.85);
        setLiveIsFinal(result.isFinal);
        if (result.isFinal) {
          setIsListening(false);
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stopListening();
      setIsListening(false);
    }

    const userMsg: RoleplayChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      contentEn: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const studentTurnsCount = messages.filter(m => m.sender === 'user').length;

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.contentEn
      }));

      const response = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          scenarioTitle: selectedScenario.title,
          characterRole: selectedScenario.characterRoleEn,
          goals: selectedScenario.goals.map(g => g.descriptionEn),
          message: text,
          history: historyPayload,
          userLevel,
          interactionCount: studentTurnsCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar simulação.');
      }

      const data = await response.json();

      const botReply: RoleplayChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        contentEn: data.inCharacterReplyEn || "Que bom falar com você! Como posso te ajudar hoje?",
        mentorGuidancePt: data.mentorGuidancePt,
        translationPt: data.inCharacterReplyPt,
        timestamp: Date.now(),
        feedback: data.userFeedback,
        writingDrill: data.writingDrill,
        suggestedNextResponses: data.suggestedUserResponses || selectedScenario.quickStartersEn.slice(1, 3),
      };

      setMessages(prev => [...prev, botReply]);
      onAddXp(30);

      // Check goals
      if (data.completedGoals && Array.isArray(data.completedGoals) && data.completedGoals.length > 0) {
        setCompletedGoalIds(prev => {
          const next = new Set(prev);
          selectedScenario.goals.forEach(g => {
            const matched = data.completedGoals.some((cg: string) => 
              cg.toLowerCase().includes(g.descriptionEn.toLowerCase().slice(0, 15)) ||
              g.descriptionEn.toLowerCase().includes(cg.toLowerCase().slice(0, 15))
            );
            if (matched) {
              next.add(g.id);
            }
          });

          // Check if all goals are now completed!
          if (next.size >= selectedScenario.goals.length && prev.size < selectedScenario.goals.length) {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 }
            });
            onAddXp(60);
          }
          return next;
        });
      }

      // Read bot response aloud in PT-BR for early beginner turns or EN otherwise
      if (!isAudioMuted && data.inCharacterReplyEn) {
        const spokenLang =
          data.replyLang === 'pt-BR' || (userLevel === 'beginner' && studentTurnsCount <= 2)
            ? 'pt-BR'
            : 'en-US';
        tts.speak(data.inCharacterReplyEn, speechRate, 1.0, undefined, undefined, spokenLang);
      }

    } catch (err: any) {
      console.error(err);
      const fallbackReply: RoleplayChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        contentEn: "Excuse me, I missed that. Could you say that again?",
        translationPt: "Com licença, não entendi bem. Você poderia repetir?",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySpeech = (text: string) => {
    tts.speak(text, speechRate);
  };

  const handleSkipStep = () => {
    handleSendMessage("Pular este passo do diálogo e avançar para o próximo objetivo.");
  };

  const handleWritingDrillSubmit = (msgId: string) => {
    const text = (writingInputs[msgId] || '').trim();
    if (!text) return;
    setCompletedDrills(prev => ({ ...prev, [msgId]: true }));
    onAddXp(20);
  };

  const toggleTranslation = (id: string) => {
    setShowTranslations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredScenarios = EVERYDAY_SCENARIOS.filter(sc => {
    if (categoryFilter === 'all') return true;
    return sc.category === categoryFilter;
  });

  const progressPercent = Math.round(
    (completedGoalIds.size / selectedScenario.goals.length) * 100
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Conversação Simulada em Situações Reais</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Simulador de Diálogos Cotidianos
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Interaja com personagens nativos em restaurantes, aeroportos, hotéis, lojas e ruas. Fale pelo microfone e receba feedback em tempo real sobre sua gramática, polidez e pronúncia.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <Award className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Progresso do Cenário:</span>
              <span className="text-sm font-extrabold text-white">
                {completedGoalIds.size} de {selectedScenario.goals.length} Metas Concluídas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-blue-400" />
          Escolha um Cenário:
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'all'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setCategoryFilter('food')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'food'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          🍔 Restaurante
        </button>
        <button
          onClick={() => setCategoryFilter('directions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'directions'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          🗺️ Direções
        </button>
        <button
          onClick={() => setCategoryFilter('shopping')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'shopping'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          🛍️ Compras
        </button>
        <button
          onClick={() => setCategoryFilter('travel')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'travel'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          ✈️ Aeroporto
        </button>
        <button
          onClick={() => setCategoryFilter('hotel')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'hotel'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          🏨 Hotel
        </button>
        <button
          onClick={() => setCategoryFilter('social')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            categoryFilter === 'social'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          ☕ Social & Café
        </button>
      </div>

      {/* Scenario Cards Horizontal Scroller */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {filteredScenarios.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                if (sc.id !== selectedScenario.id) {
                  setSelectedScenario(sc);
                }
              }}
              className={`p-3.5 rounded-xl border text-left min-w-[240px] sm:min-w-[270px] shrink-0 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-900/30 ring-1 ring-blue-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{sc.locationEmoji}</span>
                  <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                    {sc.characterName.split('(')[0].trim()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {sc.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {sc.situationPt}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{sc.goals.length} metas práticas</span>
                <span className={isSelected ? "text-blue-400 font-bold" : "text-slate-500"}>
                  {isSelected ? "Em andamento" : "Iniciar →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Simulation Chat & Mission Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Chat Timeline & Voice Input (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header of Chat Simulator */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                {selectedScenario.locationEmoji}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {selectedScenario.characterName}
                  </h3>
                  <span className="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                    {selectedScenario.characterRolePt}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedScenario.situationPt}
                </p>
              </div>
            </div>

            <button
              onClick={() => initializeScenario(selectedScenario)}
              title="Reiniciar diálogo"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>

          {userLevel === 'beginner' && (() => {
            const studentTurns = messages.filter(m => m.sender === 'user').length;
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

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl relative shadow-md transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none border border-blue-400/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80">
                        <span className="text-xs font-bold text-blue-400">
                          {selectedScenario.characterName}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePlaySpeech(msg.contentEn)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Ouvir fala do personagem"
                          >
                            <Volume2 className="w-4 h-4 text-blue-400" />
                          </button>

                          <button
                            onClick={() => {
                              setAnalyzerTargetPhrase(
                                msg.feedback?.betterVersion ||
                                msg.suggestedNextResponses?.[0] ||
                                msg.contentEn
                              );
                              setShowPronunciationAnalyzer(true);
                            }}
                            title="Comparar sua pronúncia palavra por palavra em tempo real"
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/70 hover:bg-blue-900 text-blue-200 border border-blue-500/30 transition flex items-center gap-1"
                          >
                            <AudioLines className="w-3 h-3 text-blue-400" />
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
                      <div className="mb-3 p-3 rounded-xl bg-blue-950/70 border border-blue-500/40 text-xs shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-blue-500/30">
                          <span className="font-bold text-blue-200 flex items-center gap-1.5 text-[11px]">
                            <span>🇧🇷</span>
                            <span>Orientação do Mentor (Português do Brasil)</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            Simulação Cotidiana
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-sans text-xs">
                          {msg.mentorGuidancePt || msg.translationPt}
                        </p>
                      </div>
                    )}

                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                      {msg.contentEn}
                    </p>

                    {showTranslations[msg.id] && msg.translationPt && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
                        <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-0.5">
                          Tradução em Português:
                        </span>
                        {msg.translationPt}
                      </div>
                    )}
                  </div>

                  {/* 2. Interactive Writing Drill (Mesclar Fala com Escrita) */}
                  {!isUser && msg.writingDrill && (
                    <div className="mt-2 w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm text-xs space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <PenTool className="w-3.5 h-3.5 text-blue-400" />
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
                          placeholder="Escreva sua resposta em inglês aqui..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleWritingDrillSubmit(msg.id)}
                          disabled={!writingInputs[msg.id]?.trim()}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            completedDrills[msg.id]
                              ? 'bg-emerald-600 text-white'
                              : writingInputs[msg.id]?.trim()
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
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
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{showSuggestedAnswers[msg.id] ? 'Ocultar Resposta' : 'Ver Resposta Sugerida'}</span>
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
                        <div className="mt-1.5 p-2 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs">
                          <strong className="block text-[10px] uppercase text-blue-300 mb-0.5">Sugestão de Escrita:</strong>
                          <span>"{msg.writingDrill.suggestedAnswerEn}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Card attached below Bot reply if feedback for user's previous message exists */}
                  {!isUser && msg.feedback && (
                    <div className="mt-2.5 w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm text-xs space-y-2.5">
                      
                      {/* Score & Naturalness */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Avaliação da sua fala:
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            msg.feedback.score >= 85
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : msg.feedback.score >= 70
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            Score: {msg.feedback.score}/100
                          </span>
                        </div>

                        {msg.feedback.phoneticSpelling && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-300 font-mono">
                            <span>{msg.feedback.phoneticSpelling}</span>
                            <button
                              onClick={() => handlePlaySpeech(msg.feedback?.betterVersion || '')}
                              className="text-slate-400 hover:text-white"
                              title="Ouvir fonética"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Better Version */}
                      {msg.feedback.betterVersion && (
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold text-blue-400">
                              Como um nativo falaria (Natural & Polido):
                            </span>
                            <button
                              onClick={() => handlePlaySpeech(msg.feedback?.betterVersion || '')}
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

                      {/* Pronunciation Tips specifically for Brazilian Speakers */}
                      {msg.feedback.pronunciationTips && msg.feedback.pronunciationTips.length > 0 && (
                        <div className="bg-purple-950/20 border border-purple-900/30 p-2.5 rounded-lg space-y-1">
                          <strong className="text-purple-300 block text-[11px]">
                            Dicas de Pronúncia & Ritmo:
                          </strong>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                            {msg.feedback.pronunciationTips.map((tip, tIdx) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Grammar Explanation */}
                      {msg.feedback.grammarExplanationPt && (
                        <div className="text-slate-300 text-xs bg-blue-950/20 p-2 rounded border border-blue-900/30">
                          <strong className="text-blue-300 block mb-0.5">Correção Gramatical:</strong>
                          {msg.feedback.grammarExplanationPt}
                        </div>
                      )}

                      {/* Politeness / Cultural tip */}
                      {msg.feedback.politenessTipPt && (
                        <div className="text-slate-400 text-[11px] italic flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Etiqueta cultural: {msg.feedback.politenessTipPt}</span>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Suggested Next Responses */}
                  {!isUser && msg.suggestedNextResponses && msg.suggestedNextResponses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        Opções para Falar:
                      </span>
                      {msg.suggestedNextResponses.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] bg-slate-900 hover:bg-blue-950 hover:border-blue-500/50 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition text-left flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 text-blue-400" />
                          <span>"{sug}"</span>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl p-3 w-fit">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>{selectedScenario.characterName} está respondendo e avaliando sua pronúncia...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Controls / Mic / Text Form */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
            {showPronunciationAnalyzer && (() => {
              const latestBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
              const effectiveTarget =
                analyzerTargetPhrase ||
                latestBotMsg?.feedback?.betterVersion ||
                latestBotMsg?.suggestedNextResponses?.[0] ||
                selectedScenario.quickStartersEn[0] ||
                latestBotMsg?.contentEn ||
                selectedScenario.initialBotGreetingEn;
              const suggestedPhrases = Array.from(
                new Set(
                  [
                    latestBotMsg?.feedback?.betterVersion,
                    ...(latestBotMsg?.suggestedNextResponses || []),
                    ...selectedScenario.quickStartersEn,
                  ].filter((p): p is string => Boolean(p && p.trim()))
                )
              ).slice(0, 5);

              return (
                <div className="max-h-[46vh] overflow-y-auto pr-0.5">
                  <RealTimePronunciationAnalyzer
                    targetPhrase={effectiveTarget}
                    suggestedPhrases={suggestedPhrases}
                    voiceLang="en-US"
                    speechRate={speechRate}
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
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Gravando sua voz em inglês... responda ao personagem!</span>
                </div>
                <button
                  onClick={handleStartListening}
                  className="text-[11px] font-bold text-red-300 hover:text-white underline"
                >
                  Parar
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
                onClick={handleStartListening}
                title={isListening ? "Parar de gravar" : "Falar pelo Microfone (Speech-to-Text)"}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white border-red-400 animate-pulse-glow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-400" />}
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
                    ? "Ouvindo sua resposta em inglês..."
                    : `Fale em inglês com ${selectedScenario.characterName.split('(')[0].trim()}...`
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
                disabled={isLoading}
              />

              {/* Skip Button */}
              <button
                type="button"
                onClick={handleSkipStep}
                disabled={isLoading}
                title="Pular esta fala ou meta e avançar para o próximo objetivo da sua jornada"
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
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>

        {/* Right: Goals Checklist & Useful Phrases (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Goals Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Metas do Cenário ({completedGoalIds.size}/{selectedScenario.goals.length})</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-400">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Goal List */}
            <div className="space-y-2.5">
              {selectedScenario.goals.map((goal) => {
                const isCompleted = completedGoalIds.has(goal.id);
                return (
                  <div
                    key={goal.id}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className={`font-semibold ${isCompleted ? 'text-emerald-300 line-through' : 'text-slate-100'}`}>
                        {goal.descriptionPt}
                      </p>
                      <p className="text-[11px] text-slate-400 italic">
                        "{goal.descriptionEn}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {completedGoalIds.size >= selectedScenario.goals.length && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center text-xs text-emerald-200 space-y-1">
                <span className="font-bold block text-sm">🎉 Cenário Concluído com Sucesso!</span>
                <span>Excelente trabalho na conversação real! Você acumulou +60 XP de fluência.</span>
              </div>
            )}
          </div>

          {/* Useful Phrases Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Frases Úteis & Pronúncia
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Toque no som</span>
            </h4>

            <div className="space-y-2.5">
              {selectedScenario.usefulPhrases.map((phrase, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">
                      "{phrase.phraseEn}"
                    </span>
                    <button
                      onClick={() => handlePlaySpeech(phrase.phraseEn)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Ouvir frase"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {phrase.phrasePt}
                  </p>

                  <p className="text-[10px] text-amber-300 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30">
                    💡 {phrase.pronunciationHint}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
