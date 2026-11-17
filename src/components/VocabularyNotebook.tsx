import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookMarked,
  Search,
  Volume2,
  Plus,
  Trash2,
  Copy,
  Check,
  HeartHandshake,
  Code2,
  RotateCw,
  Layers,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { VocabularyItem } from '../types';
import { tts } from '../utils/speech';
import {
  SrsGrade,
  applySrsReview,
  formatDueStatusPt,
  getSrsMasteryStage,
  isCardDueForReview,
  previewNextIntervals,
  sortQueueBySrsPriority,
} from '../utils/spacedRepetition';

interface VocabularyNotebookProps {
  vocabulary: VocabularyItem[];
  speechRate: number;
  onAddWord: (word: VocabularyItem) => void;
  onUpdateWord?: (word: VocabularyItem) => void;
  onDeleteWord: (term: string) => void;
  onAddXp?: (amount: number) => void;
}

type NotebookViewMode = 'flashcards' | 'list';

export const VocabularyNotebook: React.FC<VocabularyNotebookProps> = ({
  vocabulary,
  speechRate,
  onAddWord,
  onUpdateWord,
  onDeleteWord,
  onAddXp,
}) => {
  const [viewMode, setViewMode] = useState<NotebookViewMode>('flashcards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'worship' | 'tech'>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isCopied, setIsCopied] = useState(false);

  // Add new word form
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newCategory, setNewCategory] = useState<'worship' | 'tech' | 'general'>('tech');

  // Flashcards Spaced Repetition (SM-2) Session State
  const [flashcardCategory, setFlashcardCategory] = useState<'all' | 'worship' | 'tech'>('all');
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [isFlashcardRevealed, setIsFlashcardRevealed] = useState(false);
  const [showContextHint, setShowContextHint] = useState(false);
  const [isFreePractice, setIsFreePractice] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    remembered: 0,
    againCount: 0,
    xpEarned: 0,
  });

  // Derived SRS counts across entire notebook
  const srsSummary = useMemo(() => {
    const now = Date.now();
    let dueCount = 0;
    let newCount = 0;
    let masteredCount = 0;
    let learningCount = 0;

    for (const item of vocabulary) {
      if (isCardDueForReview(item, now)) dueCount++;
      const stage = getSrsMasteryStage(item);
      if (stage.id === 'new') newCount++;
      else if (stage.id === 'mastered') masteredCount++;
      else learningCount++;
    }
    return { dueCount, newCount, masteredCount, learningCount };
  }, [vocabulary]);

  // Filtered vocabulary for flashcard deck
  const categoryDeck = useMemo(() => {
    return vocabulary.filter(
      (item) => flashcardCategory === 'all' || item.category === flashcardCategory
    );
  }, [vocabulary, flashcardCategory]);

  // Build / rebuild queue when entering flashcards or changing filter
  const buildSessionQueue = useCallback(
    (forceFreePractice: boolean) => {
      const now = Date.now();
      const sorted = sortQueueBySrsPriority(categoryDeck, now);
      const dueOnly = sorted.filter((item) => isCardDueForReview(item, now));
      const targetList = forceFreePractice || dueOnly.length === 0 ? sorted : dueOnly;

      setSessionQueue(
        forceFreePractice ? targetList.map((i) => i.term) : dueOnly.map((i) => i.term)
      );
      setIsFreePractice(forceFreePractice);
      setSessionIndex(0);
      setIsFlashcardRevealed(false);
      setShowContextHint(false);
      setSessionStats({ reviewed: 0, remembered: 0, againCount: 0, xpEarned: 0 });
    },
    [categoryDeck]
  );

  // Sync queue when filter changes or initially mounted
  useEffect(() => {
    const now = Date.now();
    const sorted = sortQueueBySrsPriority(categoryDeck, now);
    const dueOnly = sorted.filter((item) => isCardDueForReview(item, now));
    setSessionQueue(dueOnly.map((i) => i.term));
    setIsFreePractice(false);
    setSessionIndex(0);
    setIsFlashcardRevealed(false);
    setShowContextHint(false);
    setSessionStats({ reviewed: 0, remembered: 0, againCount: 0, xpEarned: 0 });
  }, [flashcardCategory]);

  // Keep queue resilient if terms are added or deleted while viewing
  useEffect(() => {
    const existingTerms = new Set(vocabulary.map((v) => v.term));
    setSessionQueue((prev) => prev.filter((term) => existingTerms.has(term)));
  }, [vocabulary]);

  const currentTermKey = sessionQueue[sessionIndex];
  const currentCard = useMemo(
    () => vocabulary.find((v) => v.term === currentTermKey) || null,
    [vocabulary, currentTermKey]
  );

  const isSessionCompleted =
    sessionQueue.length > 0 && sessionIndex >= sessionQueue.length && !currentCard;

  const currentIntervals = useMemo(() => {
    if (!currentCard) return null;
    return previewNextIntervals(currentCard);
  }, [currentCard]);

  const handleRateCard = useCallback(
    (grade: SrsGrade) => {
      if (!currentCard) return;

      const updatedItem = applySrsReview(currentCard, grade);
      onUpdateWord?.(updatedItem);

      const xpByGrade: Record<SrsGrade, number> = {
        again: 5,
        hard: 10,
        good: 15,
        easy: 20,
      };
      const gainedXp = xpByGrade[grade];
      onAddXp?.(gainedXp);

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        remembered: grade === 'again' ? prev.remembered : prev.remembered + 1,
        againCount: grade === 'again' ? prev.againCount + 1 : prev.againCount,
        xpEarned: prev.xpEarned + gainedXp,
      }));

      // If user forgot ('again'), re-insert card near end of session queue for active reinforcement
      if (grade === 'again') {
        setSessionQueue((prev) => {
          const remaining = prev.slice(sessionIndex + 1);
          // Avoid duplicating if already scheduled later in queue
          if (remaining.includes(currentCard.term)) return prev;
          const insertOffset = Math.min(prev.length, sessionIndex + 3);
          const next = [...prev];
          next.splice(insertOffset, 0, currentCard.term);
          return next;
        });
      }

      setIsFlashcardRevealed(false);
      setShowContextHint(false);
      setSessionIndex((prev) => prev + 1);
    },
    [currentCard, onUpdateWord, onAddXp, sessionIndex]
  );

  // Keyboard shortcuts during Flashcards mode (Space = Flip, 1-4 = Grade)
  useEffect(() => {
    if (viewMode !== 'flashcards' || isAdding || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlashcardRevealed((prev) => !prev);
      } else if (isFlashcardRevealed) {
        if (e.key === '1') handleRateCard('again');
        else if (e.key === '2') handleRateCard('hard');
        else if (e.key === '3') handleRateCard('good');
        else if (e.key === '4') handleRateCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isAdding, currentCard, isFlashcardRevealed, handleRateCard]);

  const toggleFlip = (term: string) => {
    setFlippedCards((prev) => ({ ...prev, [term]: !prev[term] }));
  };

  const handleAddNewWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newMeaning.trim()) return;

    const trimmedTerm = newTerm.trim();
    onAddWord({
      term: trimmedTerm,
      phonetic: newPhonetic.trim() || undefined,
      meaning: newMeaning.trim(),
      example:
        newExample.trim() ||
        `I practice using "${trimmedTerm}" in daily conversation.`,
      category: newCategory,
    });

    // Also enqueue newly added word if in flashcards
    setSessionQueue((prev) => (prev.includes(trimmedTerm) ? prev : [...prev, trimmedTerm]));

    setNewTerm('');
    setNewPhonetic('');
    setNewMeaning('');
    setNewExample('');
    setIsAdding(false);
  };

  const handleCopyAll = () => {
    const text = vocabulary
      .map(
        (v) =>
          `${v.term} ${v.phonetic ? `(${v.phonetic})` : ''} - ${v.meaning}\nExemplo: "${v.example}"`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredWords = vocabulary.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const dueInCategoryCount = useMemo(() => {
    const now = Date.now();
    return categoryDeck.filter((item) => isCardDueForReview(item, now)).length;
  }, [categoryDeck]);

  const progressPercent =
    sessionQueue.length > 0
      ? Math.min(100, Math.round((Math.min(sessionIndex, sessionQueue.length) / sessionQueue.length) * 100))
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
            <span className="font-semibold text-emerald-400">Glossário & Repetição Espaçada</span>
            <span aria-hidden="true">·</span>
            <span>{vocabulary.length} termos salvos</span>
            <span aria-hidden="true">·</span>
            <span className={srsSummary.dueCount > 0 ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>
              {srsSummary.dueCount} para revisar hoje
            </span>
            <span aria-hidden="true">·</span>
            <span>{srsSummary.masteredCount} dominados</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Vocabulário & Flashcards
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Memorize palavras de louvores e termos de tecnologia com repetição espaçada inteligente: acerte e o intervalo cresce automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Palavra</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="Copiar todas as palavras para a área de transferência"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{isCopied ? 'Copiado' : 'Copiar Lista'}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Flashcards SRS vs Lista do Caderno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setViewMode('flashcards')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              viewMode === 'flashcards'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards (Repetição Espaçada)</span>
            {srsSummary.dueCount > 0 && (
              <span className="font-mono tabular-nums text-[11px] opacity-90">
                ({srsSummary.dueCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Lista do Caderno ({vocabulary.length})</span>
          </button>
        </div>

        {viewMode === 'flashcards' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFlashcardCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                flashcardCategory === 'all'
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas ({vocabulary.length})
            </button>
            <button
              type="button"
              onClick={() => setFlashcardCategory('worship')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                flashcardCategory === 'worship'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <HeartHandshake className="w-3 h-3" />
              <span>Louvores</span>
            </button>
            <button
              type="button"
              onClick={() => setFlashcardCategory('tech')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                flashcardCategory === 'tech'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Tech & Dados</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Word Form Accordion */}
      {isAdding && (
        <form
          onSubmit={handleAddNewWord}
          className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-sm"
        >
          <h3 className="text-xs font-bold text-emerald-400">
            Nova Palavra ou Expressão
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Palavra em inglês (ex: Throughput / Grace)"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={newPhonetic}
              onChange={(e) => setNewPhonetic(e.target.value)}
              placeholder="Pronúncia fonética (opcional, ex: /ˈθruː.pʊt/)"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <select
              aria-label="Categoria da palavra"
              value={newCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewCategory(e.target.value as 'worship' | 'tech' | 'general')
              }
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="tech">Carreira Tech & Dados</option>
              <option value="worship">Louvor & Fé Cristã</option>
              <option value="general">Geral / Conversação</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="Significado e tradução em português"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="Frase de exemplo em inglês"
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              Salvar no Meu Caderno
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: FLASHCARDS SPACED REPETITION MODE */}
      {viewMode === 'flashcards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Study Stage (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {categoryDeck.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-200">
                  Nenhum termo nesta categoria ainda.
                </p>
                <p className="text-xs text-slate-400">
                  Adicione novas palavras acima ou mude o filtro para estudar todos os seus termos salvos.
                </p>
                <button
                  type="button"
                  onClick={() => setFlashcardCategory('all')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  Mostrar Todas as Palavras
                </button>
              </div>
            ) : currentCard ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Card Progress & Metadata Strip */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        Card {sessionIndex + 1} de {sessionQueue.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {currentCard.category === 'worship'
                          ? 'Louvor & Fé'
                          : currentCard.category === 'tech'
                            ? 'Tech & Dados'
                            : 'Geral'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-medium">
                        {getSrsMasteryStage(currentCard).labelPt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isFreePractice ? 'Prática Livre' : formatDueStatusPt(currentCard)}</span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${Math.max(4, progressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Front Side (Always Visible Question) */}
                <div className="py-6 text-center space-y-4 border-b border-slate-800/80">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {currentCard.term}
                  </h3>

                  {currentCard.phonetic && (
                    <p className="text-sm font-mono text-slate-400">
                      {currentCard.phonetic}
                    </p>
                  )}

                  <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => tts.speak(currentCard.term, speechRate)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Ouvir Pronúncia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => tts.speak(currentCard.term, Math.max(0.6, speechRate * 0.72))}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Devagar</span>
                    </button>

                    {!isFlashcardRevealed && (
                      <button
                        type="button"
                        onClick={() => setShowContextHint((prev) => !prev)}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{showContextHint ? 'Ocultar Dica' : 'Dica na Frase'}</span>
                      </button>
                    )}
                  </div>

                  {!isFlashcardRevealed && showContextHint && (
                    <div className="max-w-xl mx-auto pt-2 text-xs text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3">
                      <span className="text-slate-400 block mb-1">Contexto em inglês:</span>
                      <p className="italic text-slate-200">"{currentCard.example}"</p>
                    </div>
                  )}
                </div>

                {/* Interaction Zone: Reveal CTA OR Back Side + SM-2 Buttons */}
                {!isFlashcardRevealed ? (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFlashcardRevealed(true)}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Mostrar Significado e Avaliar</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-slate-500">
                      Tente lembrar o significado antes de revelar · Atalho: Espaço
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Answer Content */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 block mb-1">
                          Significado em Português
                        </span>
                        <p className="text-lg font-semibold text-white">
                          {currentCard.meaning}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-medium text-slate-400 block mb-0.5">
                            Exemplo em Inglês
                          </span>
                          <p className="text-sm text-slate-200 italic">
                            "{currentCard.example}"
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => tts.speak(currentCard.example, speechRate)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ouvir Frase</span>
                        </button>
                      </div>
                    </div>

                    {/* SM-2 Rating Controls */}
                    {currentIntervals && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium text-slate-300">
                            Como foi lembrar desta palavra?
                          </span>
                          <span className="hidden sm:inline text-[11px] text-slate-500">
                            Atalhos: teclas 1 a 4
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleRateCard('again')}
                            className="p-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-left transition flex flex-col justify-between gap-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-red-200">1 · Errei</span>
                              <span className="text-[11px] text-red-300 font-mono tabular-nums">+5 XP</span>
                            </div>
                            <span className="text-[11px] text-red-300/90">
                              Rever em {currentIntervals.again}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRateCard('hard')}
                            className="p-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-left transition flex flex-col justify-between gap-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-amber-200">2 · Difícil</span>
                              <span className="text-[11px] text-amber-300 font-mono tabular-nums">+10 XP</span>
                            </div>
                            <span className="text-[11px] text-amber-300/90">
                              Em {currentIntervals.hard}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRateCard('good')}
                            className="p-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-left transition flex flex-col justify-between gap-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-emerald-200">3 · Bom</span>
                              <span className="text-[11px] text-emerald-300 font-mono tabular-nums">+15 XP</span>
                            </div>
                            <span className="text-[11px] text-emerald-300/90">
                              Em {currentIntervals.good}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRateCard('easy')}
                            className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/50 border border-indigo-500/40 text-left transition flex flex-col justify-between gap-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-indigo-200">4 · Fácil</span>
                              <span className="text-[11px] text-indigo-300 font-mono tabular-nums">+20 XP</span>
                            </div>
                            <span className="text-[11px] text-indigo-300/90">
                              Em {currentIntervals.easy}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Queue Done or All Caught Up Today */
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    {isSessionCompleted
                      ? 'Sessão de Revisão Concluída!'
                      : 'Todas as revisões de hoje estão em dia!'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {isSessionCompleted
                      ? `Você revisou ${sessionStats.reviewed} ${sessionStats.reviewed === 1 ? 'termo' : 'termos'}, acertou ${sessionStats.remembered} e ganhou +${sessionStats.xpEarned} XP.`
                      : 'Nenhum termo está pendente nesta categoria agora. O algoritmo de repetição espaçada avisará quando chegar o momento ideal de revisar cada palavra.'}
                  </p>
                </div>

                <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => buildSessionQueue(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Praticar Todos Novamente ({categoryDeck.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Ver Lista do Caderno</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Deck Sidebar (4 cols): Progress & Next Scheduled Terms */}
          <aside className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Resumo da Repetição Espaçada
              </h3>
              <p className="text-xs text-slate-400">
                Cards difíceis voltam antes; palavras lembradas aumentam de intervalo (1d → 6d → 15d+).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left tabular-nums">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Pendentes Hoje</span>
                <span className="text-lg font-bold text-amber-300">{dueInCategoryCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">XP na Sessão</span>
                <span className="text-lg font-bold text-emerald-400">+{sessionStats.xpEarned}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Novos</span>
                <span className="text-lg font-bold text-slate-100">{srsSummary.newCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Dominados</span>
                <span className="text-lg font-bold text-indigo-300">{srsSummary.masteredCount}</span>
              </div>
            </div>

            {currentCard && (
              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400 tabular-nums">
                <span className="font-semibold text-slate-300 block">Card Atual</span>
                <div className="flex justify-between">
                  <span>Repetições seguidas</span>
                  <span className="text-slate-200 font-mono">{currentCard.srsRepetitions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Intervalo atual</span>
                  <span className="text-slate-200 font-mono">
                    {currentCard.srsIntervalDays ? `${currentCard.srsIntervalDays}d` : 'Novo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fator de facilidade</span>
                  <span className="text-slate-200 font-mono">
                    {(currentCard.srsEaseFactor ?? 2.5).toFixed(2)}x
                  </span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Agenda dos Termos</span>
                {dueInCategoryCount > 0 && isFreePractice && (
                  <button
                    type="button"
                    onClick={() => buildSessionQueue(false)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Voltar aos pendentes
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {sortQueueBySrsPriority(categoryDeck).map((item) => {
                  const isDue = isCardDueForReview(item);
                  const isCurrent = currentCard?.term === item.term;
                  return (
                    <button
                      key={item.term}
                      type="button"
                      onClick={() => {
                        const existingIdx = sessionQueue.indexOf(item.term);
                        if (existingIdx >= 0) {
                          setSessionIndex(existingIdx);
                        } else {
                          setSessionQueue((prev) => [item.term, ...prev]);
                          setSessionIndex(0);
                        }
                        setIsFlashcardRevealed(false);
                        setShowContextHint(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-white'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-medium truncate">{item.term}</span>
                      <span
                        className={`text-[11px] shrink-0 tabular-nums ${
                          isDue ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {isDue ? 'Revisar' : formatDueStatusPt(item)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* VIEW 2: FULL NOTEBOOK LIST / CARDS GRID */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar termo ou tradução..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas ({vocabulary.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('worship')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  filterCategory === 'worship'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <HeartHandshake className="w-3 h-3" />
                <span>Louvores</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('tech')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                  filterCategory === 'tech'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Tech & Dados</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredWords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
              Nenhuma palavra encontrada com os filtros atuais. Adicione termos das letras de louvor ou treinos de standup!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWords.map((item) => {
                const isFlipped = !!flippedCards[item.term];
                const isWorship = item.category === 'worship';
                const mastery = getSrsMasteryStage(item);
                const dueLabel = formatDueStatusPt(item);

                return (
                  <div
                    key={item.term}
                    className="group relative bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between min-h-[195px]"
                  >
                    {/* Card Top: Quiet Metadata & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0 truncate">
                        <span className={isWorship ? 'text-purple-300 font-semibold' : 'text-cyan-300 font-semibold'}>
                          {isWorship ? 'Louvores' : item.category === 'tech' ? 'Tech & Dados' : 'Geral'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{mastery.labelPt}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => tts.speak(item.term, speechRate)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title="Ouvir Pronúncia"
                        >
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFlip(item.term)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title="Virar Card"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWord(item.term)}
                          className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Remover termo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Front or Back */}
                    {!isFlipped ? (
                      <div
                        onClick={() => toggleFlip(item.term)}
                        className="cursor-pointer flex-1 flex flex-col justify-center"
                      >
                        <div className="text-xl font-bold text-white tracking-tight">
                          {item.term}
                        </div>
                        {item.phonetic && (
                          <span className="text-xs text-slate-400 font-mono mt-0.5">
                            {item.phonetic}
                          </span>
                        )}
                        <span className="text-xs text-emerald-400 mt-3 inline-block font-semibold">
                          Toque para ver tradução & exemplo →
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => toggleFlip(item.term)}
                        className="cursor-pointer flex-1 space-y-2"
                      >
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Significado:
                          </span>
                          <p className="text-sm font-semibold text-slate-100">
                            {item.meaning}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            Exemplo em inglês:
                          </span>
                          <p className="text-xs text-slate-300 italic">
                            "{item.example}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Bottom SRS status + Audio trigger */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="truncate tabular-nums">{dueLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tts.speak(item.example, speechRate);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ouvir Frase</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
