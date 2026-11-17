import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Languages, 
  BookmarkPlus, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  Lightbulb, 
  HelpCircle,
  BookOpen,
  ArrowRight,
  SkipForward,
  PenTool,
  CheckCircle,
  Eye,
  AudioLines
} from 'lucide-react';
import { ChatMessage, LearningFocus, PersonaId, UserLevel, VocabularyItem } from '../types';
import { tts, SpeechRecognitionManager } from '../utils/speech';
import { RealTimePronunciationAnalyzer } from './RealTimePronunciationAnalyzer';
import { getBeginnerImmersionStage } from '../utils/beginnerProgression';

interface ChatMentorProps {
  userLevel: UserLevel;
  focus: LearningFocus;
  speechRate: number;
  isAudioMuted: boolean;
  onSaveWord: (word: VocabularyItem) => void;
  onAddXp: (amount: number) => void;
}

const buildWelcomeMessage = (level: UserLevel): ChatMessage => {
  if (level === 'beginner') {
    return {
      id: `welcome-${level}`,
      role: 'model',
      content:
        'Olá! Seja muito bem-vindo(a) ao Purpose Talk! Como você está no nível Iniciante, nossas primeiras conversas serão totalmente acolhedoras em Português para você se sentir seguro(a). Não se preocupe em errar — vamos aprender sua primeira palavra ou frase aos poucos! Que assunto você prefere hoje: um louvor internacional (como Way Maker) ou uma frase simples do dia a dia?',
      mentorGuidancePt:
        'Regra de Acolhimento Ativada: começamos em Português e vamos introduzindo 1 ou 2 palavras em inglês por vez, no seu ritmo.',
      timestamp: Date.now(),
      translationPt:
        'Bem-vindo(a)! Vamos começar em português com calma e introduzir suas primeiras palavras em inglês sem pressão.',
      pronunciationCoach: {
        targetPhrase: 'Way Maker',
        phoneticEasy: 'UÊI MÊI-kêr',
        mouthPositionPt:
          'Comece fazendo o som de "U" bem redondinho antes do "ÊI": UÊI. Depois fale MÊI-kêr com o R suave.',
        commonPitfallPt: 'Não precisa ler como "uai" — o som é "UÊI" (caminho).'
      },
      writingDrill: {
        promptPt:
          'Se quiser experimentar agora, escreva ou diga apenas "Oi" em português ou tente "Way Maker" em inglês. (Você também pode clicar em "Pular"!)',
        suggestedAnswerEn: 'Way Maker'
      },
      vocabulary: [
        {
          term: 'Way Maker',
          phonetic: '/weɪ ˈmeɪ.kər/',
          meaning: 'Aquele que abre caminhos (Deus que faz o caminho)',
          example: 'You are Way Maker.',
          category: 'worship'
        },
        {
          term: 'Grace',
          phonetic: '/ɡreɪs/',
          meaning: 'Graça / favor imerecido de Deus',
          example: 'Amazing grace.',
          category: 'worship'
        }
      ]
    };
  }

  return {
      id: `welcome-${level}`,
      role: 'model',
      content: "Hello and welcome! I am your Faith & Tech English Mentor. Whether you want to master English for your tech career and data science, or worship and pray with deep understanding through gospel songs, I'm here for you. How was your day, or what topic would you like to explore together?",
      mentorGuidancePt: "Olá e seja muito bem-vindo! Eu sou seu Mentor Faith & Tech. Vou guiar você passo a passo rumo à fluência em inglês: treinando sua pronúncia correta de termos técnicos e louvores, mesclando fala com escrita e permitindo pular qualquer pergunta sempre que quiser. Vamos começar?",
      timestamp: Date.now(),
      translationPt: "Olá e seja bem-vindo! Eu sou seu Mentor de Inglês Faith & Tech. Seja para dominar o inglês na sua carreira de tecnologia e ciência de dados, ou para adorar e orar com entendimento profundo através de louvores, estou aqui para você. Como foi seu dia, ou qual tópico gostaria de explorar juntos?",
      pronunciationCoach: {
        targetPhrase: "Worship and data pipeline throughput",
        phoneticEasy: "WÛR-ship ænd DÉI-tə PÁIP-lain THRU-put",
        mouthPositionPt: 'Ao falar "throughput", não junte com "i" no final. Deixe o ar sair entre os dentes no "TH" e feche a boca no "T" seco.',
        commonPitfallPt: 'Brasileiros costumam falar "troo-púti". O T final é seco e sem vogal de apoio.'
      },
      writingDrill: {
        promptPt: "Escreva uma frase curta em inglês dizendo se você quer focar em Louvores (Worship) ou Tecnologia (Tech) hoje. (Você pode pular se preferir apenas conversar!)",
        suggestedAnswerEn: "I would like to focus on tech terms and worship songs today."
      },
      vocabulary: [
        {
          term: 'Worship',
          phonetic: '/ˈwɜːr.ʃɪp/',
          meaning: 'Adorar com devoção e louvor',
          example: 'I love to worship God in spirit and truth.',
          category: 'worship'
        },
        {
          term: 'Tackle',
          phonetic: '/ˈtæk.əl/',
          meaning: 'Enfrentar / resolver um problema ou tarefa desafiadora',
          example: 'Today our team will tackle the pipeline latency issue.',
          category: 'tech'
        }
      ]
    };
};

export const ChatMentor: React.FC<ChatMentorProps> = ({
  userLevel,
  focus,
  speechRate,
  isAudioMuted,
  onSaveWord,
  onAddXp,
}) => {
  const [persona, setPersona] = useState<PersonaId>('pastor_and_tech');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcomeMessage(userLevel)]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());

  // Writing drill states
  const [writingInputs, setWritingInputs] = useState<Record<string, string>>({});
  const [showSuggestedAnswers, setShowSuggestedAnswers] = useState<Record<string, boolean>>({});
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});

  // Speech-to-text & real-time pronunciation analysis state
  const [isListening, setIsListening] = useState(false);
  const [showPronunciationAnalyzer, setShowPronunciationAnalyzer] = useState(false);
  const [analyzerTargetPhrase, setAnalyzerTargetPhrase] = useState(
    userLevel === 'beginner' ? 'Way Maker' : 'Worship and data pipeline throughput'
  );
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveConfidence, setLiveConfidence] = useState(0.85);
  const [liveIsFinal, setLiveIsFinal] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id.startsWith('welcome')) {
        return [buildWelcomeMessage(userLevel)];
      }
      return prev;
    });
    setAnalyzerTargetPhrase(
      userLevel === 'beginner' ? 'Way Maker' : 'Worship and data pipeline throughput'
    );
  }, [userLevel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleTranslation = (id: string) => {
    setShowTranslation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const playSpeech = (text: string) => {
    tts.speak(text, speechRate);
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

  const handleStartListening = () => {
    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      alert("Reconhecimento de voz não suportado neste navegador. Tente usar o Google Chrome ou Microsoft Edge.");
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

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const studentTurnsCount = messages.filter(m => m.role === 'user').length;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
          persona,
          level: userLevel,
          focus,
          interactionCount: studentTurnsCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
      }

      const data = await response.json();

      const mentorMessage: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'model',
        content: data.replyEn || "Estou ouvindo! Vamos continuar passo a passo.",
        timestamp: Date.now(),
        mentorGuidancePt: data.mentorGuidancePt,
        translationPt: data.replyPt,
        score: data.score,
        feedback: data.userFeedback,
        pronunciationCoach: data.pronunciationCoach,
        writingDrill: data.writingDrill,
        vocabulary: data.vocabulary,
        followUpQuestion: data.followUpQuestionEn,
      };

      setMessages(prev => [...prev, mentorMessage]);
      onAddXp(25);

      // Play audio in PT-BR during early beginner turns, or English thereafter
      if (!isAudioMuted && data.replyEn) {
        const spokenLang =
          data.replyLang === 'pt-BR' || (userLevel === 'beginner' && studentTurnsCount <= 2)
            ? 'pt-BR'
            : 'en-US';
        tts.speak(data.replyEn, speechRate, 1.0, undefined, undefined, spokenLang);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: "I had a small connection hiccup. Let's try again in a moment!",
        timestamp: Date.now(),
        translationPt: "Tive uma pequena oscilação de conexão. Vamos tentar novamente em um instante!",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWordItem = (item: VocabularyItem) => {
    onSaveWord(item);
    setSavedTerms(prev => new Set(prev).add(item.term));
    onAddXp(10);
  };

  const starters =
    userLevel === 'beginner'
      ? [
          { label: 'Começar em Português (Zero)', prompt: 'Olá! Estou começando do zero e quero aprender minhas primeiras palavras devagar.' },
          { label: 'Louvor Way Maker', prompt: 'Quero aprender o significado e a pronúncia do louvor Way Maker passo a passo!' },
          { label: 'Primeiras Frases de Fé', prompt: 'Como eu digo "Bom dia" e "Deus te abençoe" em inglês?' },
          { label: 'Palavras de Tecnologia', prompt: 'Quais são as 3 primeiras palavras mais fáceis de tecnologia em inglês?' }
        ]
      : [
          { label: 'Standup Matinal', prompt: 'Hello! Let\'s practice my daily standup: yesterday I deployed our backend model, today I am optimizing latency.' },
          { label: 'Louvor Way Maker', prompt: 'I want to understand the lyrics of "Way Maker". Why does it say "Even when I don\'t see it, You\'re working"?' },
          { label: 'Entrevista Tech', prompt: 'Could you ask me a realistic technical interview question about SQL and Machine Learning pipelines?' },
          { label: 'Oração em Inglês', prompt: 'How do I start a simple, respectful prayer in English thanking God for our week and asking for wisdom at work?' },
          { label: 'Falsos Cognatos Tech', prompt: 'What are the most common false friends that Brazilian developers say in international meetings?' }
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-6xl mx-auto">
      
      {/* Top Mentor Profile Selector */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Escolha seu Mentor:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setPersona('pastor_and_tech')}
              className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                persona === 'pastor_and_tech'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faith & Tech (Híbrido)</span>
            </button>

            <button
              onClick={() => setPersona('pastor_david')}
              className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                persona === 'pastor_david'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Pastor David (Worship & Fé)</span>
            </button>

            <button
              onClick={() => setPersona('sarah_tech')}
              className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                persona === 'sarah_tech'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Sarah (Tech Lead & Data)</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>IA Pronta para Conversar e Ouvir</span>
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        
        {/* Quick Conversation Starters */}
        {messages.length <= 2 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Sugestões Rápidas para Iniciar Conversa
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {starters.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="text-xs bg-slate-900/90 hover:bg-indigo-900/50 hover:border-indigo-500/50 border border-slate-700/70 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm text-left"
                >
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              {/* Message Bubble */}
              <div 
                className={`p-4 rounded-2xl relative shadow-md transition-all ${
                  isUser 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none border border-indigo-400/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                }`}
              >
                {/* Header of model message */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                        AI
                      </div>
                      <span className="text-xs font-semibold text-indigo-300">
                        {persona === 'pastor_david' ? 'Pastor David' : persona === 'sarah_tech' ? 'Sarah Tech Lead' : 'Faith & Tech Mentor'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => playSpeech(msg.content)}
                        title="Ouvir Pronúncia Nativa"
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-400" />
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
                        title="Comparar pronúncia palavra por palavra em tempo real"
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/30 transition flex items-center gap-1"
                      >
                        <AudioLines className="w-3 h-3 text-indigo-400" />
                        <span className="hidden sm:inline">Analisar Voz</span>
                      </button>

                      {msg.translationPt && (
                        <button
                          onClick={() => toggleTranslation(msg.id)}
                          title="Ver Tradução em Português"
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                        >
                          <Languages className="w-3 h-3 text-emerald-400" />
                          <span>{showTranslation[msg.id] ? 'Ocultar Tradução' : 'Traduzir'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* English Content */}
                {/* 1. Brazilian Portuguese Mentor Guidance on Top */}
                {!isUser && (msg.mentorGuidancePt || msg.translationPt) && (
                  <div className="mb-3 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-indigo-500/30">
                      <span className="font-bold text-indigo-200 flex items-center gap-1.5 text-[11px]">
                        <span>🇧🇷</span>
                        <span>Orientação do Mentor (Português do Brasil)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Passo a Passo até a Fluência
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

                {/* Optional Portuguese Translation Dropdown */}
                {showTranslation[msg.id] && msg.translationPt && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
                    <div className="text-[10px] uppercase font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                      <Languages className="w-3 h-3" />
                      Tradução em Português:
                    </div>
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
                      onClick={() => playSpeech(msg.pronunciationCoach?.targetPhrase || '')}
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
                      <strong className="text-indigo-300 block text-[11px] mb-0.5">Posição da Boca & Língua:</strong>
                      <span>{msg.pronunciationCoach.mouthPositionPt}</span>
                    </div>
                    {msg.pronunciationCoach.commonPitfallPt && (
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-slate-300">
                        <strong className="text-amber-300 block text-[11px] mb-0.5">Atenção (Erro de Brasileiros):</strong>
                        <span>{msg.pronunciationCoach.commonPitfallPt}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setInputValue(msg.pronunciationCoach?.targetPhrase || '');
                          handleStartListening();
                        }}
                        className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-900/40 hover:bg-indigo-800/60 px-2.5 py-1 rounded-lg border border-indigo-700/40 transition"
                      >
                        <Mic className="w-3 h-3 text-indigo-400" />
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

              {/* Mentor Pedagogical Feedback Card (Displayed under Mentor Message) */}
              {!isUser && msg.feedback && (
                <div className="mt-2.5 w-full bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 shadow-sm text-xs space-y-2.5">
                  
                  {/* Score & Native Alternative */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Sua Frase Anterior:
                      </span>
                      {msg.score !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          msg.score >= 85 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : msg.score >= 70
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          Fluência: {msg.score}/100
                        </span>
                      )}
                    </div>

                    {msg.feedback.pronunciationTip && (
                      <span className="text-[11px] text-purple-300 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-purple-400" />
                        {msg.feedback.pronunciationTip}
                      </span>
                    )}
                  </div>

                  {/* Better Way to Say It */}
                  {msg.feedback.betterVersion && (
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center justify-between mb-1">
                        <span>Como um nativo falaria (Natural English):</span>
                        <button
                          onClick={() => playSpeech(msg.feedback?.betterVersion || '')}
                          className="text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Ouvir</span>
                        </button>
                      </div>
                      <p className="text-slate-100 font-medium italic text-sm">
                        "{msg.feedback.betterVersion}"
                      </p>
                    </div>
                  )}

                  {/* Grammar Explanation in PT */}
                  {msg.feedback.explanationPt && (
                    <p className="text-slate-300 text-xs leading-relaxed bg-indigo-950/20 p-2 rounded border border-indigo-900/30">
                      <strong className="text-indigo-300">Explicação do Mentor: </strong>
                      {msg.feedback.explanationPt}
                    </p>
                  )}

                  {/* Highlighted Vocabulary to Save */}
                  {msg.vocabulary && msg.vocabulary.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Vocabulário Recomendado para Guardar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.vocabulary.map((vocab, vIdx) => {
                          const isSaved = savedTerms.has(vocab.term);
                          return (
                            <div 
                              key={vIdx}
                              className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-100 text-xs">{vocab.term}</span>
                                  {vocab.phonetic && (
                                    <span className="text-[10px] text-slate-500 font-mono">{vocab.phonetic}</span>
                                  )}
                                  <button
                                    onClick={() => playSpeech(vocab.term)}
                                    title="Ouvir termo"
                                    className="text-slate-400 hover:text-indigo-400 p-0.5"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{vocab.meaning}</p>
                              </div>

                              <button
                                onClick={() => handleSaveWordItem(vocab)}
                                disabled={isSaved}
                                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                                  isSaved 
                                    ? 'bg-emerald-500/20 text-emerald-300' 
                                    : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40'
                                }`}
                              >
                                {isSaved ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Salvo</span>
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus className="w-3 h-3" />
                                    <span>Salvar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl p-3 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Mentor pensando na melhor orientação...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar & Mic */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 rounded-b-xl space-y-2.5">
        {showPronunciationAnalyzer && (() => {
          const latestAiMsg = [...messages].reverse().find(m => m.role === 'model');
          const effectiveTarget =
            analyzerTargetPhrase ||
            latestAiMsg?.pronunciationCoach?.targetPhrase ||
            latestAiMsg?.feedback?.betterVersion ||
            latestAiMsg?.followUpQuestion ||
            latestAiMsg?.content ||
            "Worship and data pipeline throughput";
          const suggestedPhrases = Array.from(
            new Set(
              [
                latestAiMsg?.pronunciationCoach?.targetPhrase,
                latestAiMsg?.feedback?.betterVersion,
                latestAiMsg?.followUpQuestion,
                ...starters.map(s => s.prompt),
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
              <span>Gravando sua voz em inglês... fale com naturalidade!</span>
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
          {/* Microphone STT Button */}
          <button
            type="button"
            onClick={handleStartListening}
            title={isListening ? "Parar de gravar áudio" : "Falar pelo Microfone (Speech-to-Text)"}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              isListening
                ? 'bg-red-600 text-white border-red-400 animate-pulse-glow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* Real-time Pronunciation Analyzer Toggle */}
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

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isListening 
                ? "Ouvindo você..." 
                : "Escreva em inglês ou português (ex: How was your standup? ou Como traduzo 'Way Maker'?)..."
            }
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            disabled={isLoading}
          />

          {/* Skip Button */}
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

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium transition flex items-center justify-center shrink-0 ${
              inputValue.trim() && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};
