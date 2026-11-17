import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Volume2, 
  RefreshCw, 
  Flame, 
  Award,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, UserLevel } from '../types';
import { tts } from '../utils/speech';

interface QuizDrillsProps {
  userLevel: UserLevel;
  speechRate: number;
  onAddXp: (amount: number) => void;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    tag: "Worship Lyric",
    questionEn: "In the song 'Way Maker', complete the line: 'Way Maker, Miracle Worker, ________ Keeper, light in the darkness...'",
    questionPt: "Na música 'Way Maker', complete o verso com o termo correto em inglês.",
    options: ["Promise", "Heart", "Faith", "Glory"],
    correctIndex: 0,
    explanationPt: "'Promise Keeper' significa 'Aquele que cumpre promessas'. Em inglês, o sufixo -er é adicionado ao verbo 'keep' para criar o substantivo agente.",
    audioPhrase: "Way Maker, Miracle Worker, Promise Keeper, light in the darkness."
  },
  {
    id: 2,
    tag: "Tech Standup",
    questionEn: "During your daily scrum, which phrasal verb correctly means 'to launch or initialize a new server or container'?",
    questionPt: "Qual phrasal verb significa 'inicializar ou subir um novo servidor ou container'?",
    options: ["Spin up", "Call off", "Bring down", "Drop off"],
    correctIndex: 0,
    explanationPt: "'Spin up' é o phrasal verb padrão na indústria tech (ex: 'We need to spin up a new container in Kubernetes'). 'Bring down' significa desligar/derrubar.",
    audioPhrase: "We need to spin up a new Redis cluster for caching."
  },
  {
    id: 3,
    tag: "False Friends",
    questionEn: "If you want to say 'Eu pretendo fazer o deploy na sexta-feira', which English verb is correct?",
    questionPt: "Qual verbo em inglês expressa a intenção correta ('pretender')?",
    options: ["I pretend to deploy...", "I intend to deploy...", "I assist to deploy...", "I realize to deploy..."],
    correctIndex: 1,
    explanationPt: "'Pretend' em inglês significa 'fingir'! Para expressar intenção de fazer algo, use 'intend to' ou 'plan to'.",
    audioPhrase: "I intend to deploy the new version this Friday."
  },
  {
    id: 4,
    tag: "Worship Grammar",
    questionEn: "In 'Goodness of God', what is the difference between 'breath' and 'breathe'?",
    questionPt: "Qual a diferença essencial entre 'breath' e 'breathe'?",
    options: [
      "'Breath' é substantivo (fôlego) e 'Breathe' é o verbo (respirar)",
      "'Breathe' é o substantivo e 'Breath' é o verbo",
      "Ambas são idênticas em significado e som",
      "'Breath' só é usado no passado"
    ],
    correctIndex: 0,
    explanationPt: "'Breath' (/brɛθ/) é o substantivo (fôlego/respiração). 'Breathe' (/briːð/) é o verbo (respirar). No verso: 'With every breath that I am able, I will sing...'",
    audioPhrase: "With every breath that I am able, I will sing of the goodness of God."
  },
  {
    id: 5,
    tag: "Data Science Vocab",
    questionEn: "When a Machine Learning model memorizes the training data too closely and fails on new test data, this is called:",
    questionPt: "Quando o modelo decora os dados de treino e falha em dados novos, esse fenômeno é chamado de:",
    options: ["Overfitting", "Throughput", "Data Ingestion", "Underflow"],
    correctIndex: 0,
    explanationPt: "'Overfitting' (sobreajuste). O oposto é 'Underfitting'. Em entrevistas de Data Science, saber explicar 'bias-variance tradeoff' é essencial.",
    audioPhrase: "Our model showed high variance and overfitting on the training set."
  }
];

export const QuizDrills: React.FC<QuizDrillsProps> = ({
  userLevel,
  speechRate,
  onAddXp,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUESTIONS);
  const [category, setCategory] = useState<'mixed' | 'worship' | 'tech' | 'false_friends'>('mixed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [isLoadingNewQuiz, setIsLoadingNewQuiz] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
      onAddXp(20);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onAddXp(50);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizComplete(false);
  };

  const handleGenerateAIQuiz = async (cat = category) => {
    setIsLoadingNewQuiz(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          count: 5,
          difficulty: userLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar novo quiz.');
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        handleRestart();
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar novo quiz no momento. Praticando com questões salvas.");
    } finally {
      setIsLoadingNewQuiz(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Desafios Rápidos de Fixação</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Quizzes de Louvor e Tecnologia
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Teste seu vocabulário, preposições, phrasal verbs e compreensão auditiva com correção instantânea.
          </p>
        </div>

        {/* Generate AI Quiz button */}
        <button
          onClick={() => handleGenerateAIQuiz()}
          disabled={isLoadingNewQuiz}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 whitespace-nowrap"
        >
          {isLoadingNewQuiz ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Gerando com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Gerar Novo Quiz com IA</span>
            </>
          )}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1">Filtrar por Tema:</span>
        <button
          onClick={() => {
            setCategory('mixed');
            handleGenerateAIQuiz('mixed');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            category === 'mixed'
              ? 'bg-amber-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Misto (Louvores + Tech)
        </button>
        <button
          onClick={() => {
            setCategory('worship');
            handleGenerateAIQuiz('worship');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            category === 'worship'
              ? 'bg-purple-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Apenas Louvores & Fé
        </button>
        <button
          onClick={() => {
            setCategory('tech');
            handleGenerateAIQuiz('tech');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            category === 'tech'
              ? 'bg-cyan-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Apenas Carreira Tech & Dados
        </button>
        <button
          onClick={() => {
            setCategory('false_friends');
            handleGenerateAIQuiz('false_friends');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            category === 'false_friends'
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Falsos Amigos
        </button>
      </div>

      {/* Main Question Card or Completion View */}
      {isQuizComplete ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
            <Award className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-white">Parabéns pelo Treino!</h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Você concluiu o quiz com <strong className="text-amber-400">{score} de {questions.length}</strong> acertos (+50 XP).
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Repetir Este Quiz
            </button>
            <button
              onClick={() => handleGenerateAIQuiz()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Próximo Quiz Gerado por IA</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          
          {/* Progress bar & Header */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-400 uppercase tracking-wider bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/60">
              {currentQuestion.tag}
            </span>

            <span>
              Questão <strong className="text-white">{currentIndex + 1}</strong> de {questions.length}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQuestion.questionEn}
              </h3>

              <button
                onClick={() => tts.speak(currentQuestion.audioPhrase || currentQuestion.questionEn, speechRate)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition shrink-0"
                title="Ouvir Pergunta em Inglês"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 italic">
              {currentQuestion.questionPt}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;

              let btnStyle = "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200";
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-900/20";
                } else if (isSelected) {
                  btnStyle = "bg-red-950/80 border-red-500 text-red-200";
                } else {
                  btnStyle = "bg-slate-950/40 border-slate-900 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && (
                    <span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation in Portuguese */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <strong className="text-amber-400 block uppercase tracking-wider text-[11px]">
                Explicação Pedagógica:
              </strong>
              <p className="text-slate-300 leading-relaxed">
                {currentQuestion.explanationPt}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5 shadow-md shadow-amber-600/30"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Próxima Questão' : 'Ver Resultado'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
