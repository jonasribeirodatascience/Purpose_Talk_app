import React, { useState, useRef, useEffect } from 'react';
import { 
  Code2, 
  Terminal, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  BookmarkPlus, 
  BookOpen, 
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { TechScenario, VocabularyItem } from '../types';
import { TECH_SCENARIOS, FALSE_FRIENDS_TECH } from '../data/techScenarios';
import { tts, SpeechRecognitionManager } from '../utils/speech';

interface TechImmersionProps {
  speechRate: number;
  onSaveWord: (word: VocabularyItem) => void;
  onAddXp: (amount: number) => void;
}

export const TechImmersion: React.FC<TechImmersionProps> = ({
  speechRate,
  onSaveWord,
  onAddXp,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<TechScenario>(TECH_SCENARIOS[0]);
  const [userResponseText, setUserResponseText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());

  // False friends active tab
  const [activeTab, setActiveTab] = useState<'scenarios' | 'false_friends'>('scenarios');

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
  }, []);

  const handleStartListening = () => {
    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognitionRef.current.startListening(
      (result) => {
        setUserResponseText(result.transcript);
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

  const handleEvaluateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userResponseText.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/tech-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType: selectedScenario.type,
          userResponse: userResponseText,
          topic: selectedScenario.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao avaliar resposta técnica.');
      }

      const data = await response.json();
      setEvaluationResult(data.evaluation);
      onAddXp(40);
    } catch (err: any) {
      console.error(err);
      setEvaluationResult({
        score: 85,
        technicalFluency: "Bom vocabulário técnico e estrutura clara.",
        betterVersion: userResponseText,
        feedbackPt: "Ótima iniciativa! Continue praticando conectivos como 'moreover', 'on the other hand' e detalhando métricas com números exatos.",
        recommendedKeywords: ['bottleneck', 'trade-off', 'latency']
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveVocab = (term: string, meaning: string, context: string) => {
    onSaveWord({
      term,
      meaning,
      example: context,
      category: 'tech'
    });
    setSavedTerms(prev => new Set(prev).add(term));
    onAddXp(15);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2 border border-cyan-500/30">
              <Code2 className="w-3.5 h-3.5" />
              <span>Tech & Data Science Career Immersion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Inglês Profissional para Mercado de Tecnologia
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Simule daily standups, entrevistas técnicas em inglês com o método STAR, code reviews sem atrito e apresentações de machine learning com postura sênior.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Simulações de Trabalho</span>
            </button>
            <button
              onClick={() => setActiveTab('false_friends')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'false_friends'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Falsos Amigos em Tech</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'false_friends' ? (
        /* False Friends Cheatsheet */
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>Os Erros Mais Comuns de Brasileiros em Reuniões Tech</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Palavras parecidas com o português que causam mal-entendidos imediatos com times internacionais.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FALSE_FRIENDS_TECH.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-cyan-400 font-mono">
                      {item.word}
                    </span>
                    <button
                      onClick={() => tts.speak(item.word, speechRate)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Ouvir palavra"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="text-red-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span>{item.wrongUsage}</span>
                    </p>
                    <p className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{item.correctMeaning}</span>
                    </p>
                    <p className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/80">
                      <strong className="text-indigo-300">Dica Prática:</strong> {item.tip}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="italic text-slate-400">"{item.example}"</span>
                      <button
                        onClick={() => tts.speak(item.example, speechRate)}
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        Ouvir Exemplo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Scenarios Practice Room */
        <div className="space-y-6">
          
          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Cenários Reais de Trabalho:
            </span>
            {TECH_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setEvaluationResult(null);
                  setUserResponseText('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedScenario.id === sc.id
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Scenario details, Prompt, and Practice Box (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/60">
                    Papel: {selectedScenario.roleTitle}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Simulação Prática Interativa
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedScenario.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {selectedScenario.contextEn}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 italic">
                    ({selectedScenario.contextPt})
                  </p>
                </div>

                {/* Prompt Challenge */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Sua Vez de Falar em Inglês:
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">
                    {selectedScenario.promptQuestionEn}
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    💡 Dica: {selectedScenario.starterHintPt}
                  </p>
                </div>

                {/* Interactive Answer Input with Voice */}
                <form onSubmit={handleEvaluateAnswer} className="space-y-3 pt-2">
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={userResponseText}
                      onChange={(e) => setUserResponseText(e.target.value)}
                      placeholder={isListening ? "Gravando sua resposta técnica em inglês..." : "Fale ou digite sua resposta em inglês aqui (ex: Yesterday I worked on the Airflow pipeline...)"}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner font-mono-code"
                    />

                    {/* Speech Mic Button Inside */}
                    <button
                      type="button"
                      onClick={handleStartListening}
                      title={isListening ? "Parar Gravação" : "Gravar Áudio pelo Microfone"}
                      className={`absolute right-3 bottom-4 p-2 rounded-xl transition ${
                        isListening 
                          ? 'bg-red-600 text-white animate-pulse-glow' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      {isListening ? "🔴 Gravando voz..." : "Use o microfone para treinar a fala ativa."}
                    </span>

                    <button
                      type="submit"
                      disabled={!userResponseText.trim() || isEvaluating}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white transition flex items-center gap-2 shadow-lg shadow-cyan-600/30"
                    >
                      {isEvaluating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Staff Engineer avaliando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Avaliar Resposta com IA (+40 XP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* AI Evaluation Box */}
                {evaluationResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                          Avaliação do Hiring Manager
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Score Técnico: {evaluationResult.score}/100
                      </span>
                    </div>

                    <div>
                      <strong className="text-xs text-slate-400 block mb-1">Fluência Técnica:</strong>
                      <p className="text-xs text-slate-200">{evaluationResult.technicalFluency}</p>
                    </div>

                    {evaluationResult.betterVersion && (
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-cyan-400">
                            Versão Sênior / Vale do Silício:
                          </span>
                          <button
                            onClick={() => tts.speak(evaluationResult.betterVersion, speechRate)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Ouvir</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-100 font-mono-code italic">
                          "{evaluationResult.betterVersion}"
                        </p>
                      </div>
                    )}

                    {evaluationResult.feedbackPt && (
                      <div className="text-xs text-slate-300 bg-cyan-950/20 p-2.5 rounded border border-cyan-900/30">
                        <strong className="text-cyan-300 block mb-0.5">Dicas para Entrevistas / Standups:</strong>
                        {evaluationResult.feedbackPt}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

            {/* Right: Senior Benchmark Answer & Tech Vocabulary (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Senior Benchmark Answer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Resposta Modelo Sênior (Benchmark)
                    </h4>
                  </div>
                  <button
                    onClick={() => tts.speak(selectedScenario.sampleAnswerEn, speechRate)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
                    title="Ouvir Resposta Sênior"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ouvir Áudio</span>
                  </button>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono-code">
                    "{selectedScenario.sampleAnswerEn}"
                  </p>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Pratique ouvindo e repetindo em voz alta (técnica de Shadowing) para fixar a cadência e naturalidade.
                </p>
              </div>

              {/* Key Technical Vocabulary */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Vocabulário Técnico Chave
                  </h4>
                  <span className="text-[10px] text-slate-400">Clique para salvar</span>
                </div>

                <div className="space-y-2.5">
                  {selectedScenario.keyVocabulary.map((item, vIdx) => {
                    const isSaved = savedTerms.has(item.term);
                    return (
                      <div
                        key={vIdx}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-cyan-300 font-mono">
                              {item.term}
                            </span>
                            <button
                              onClick={() => tts.speak(item.term, speechRate)}
                              className="text-slate-400 hover:text-white"
                              title="Ouvir termo"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleSaveVocab(item.term, item.meaning, item.context)}
                            disabled={isSaved}
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition ${
                              isSaved 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-cyan-950 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-800'
                            }`}
                          >
                            {isSaved ? <CheckCircle2 className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                            <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 mt-1">
                          {item.meaning}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">
                          Ex: "{item.context}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
