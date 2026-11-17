import React, { useEffect, useRef, useState } from 'react';
import {
  HeartHandshake,
  Music,
  Volume2,
  BookOpen,
  Sparkles,
  Search,
  BookmarkPlus,
  CheckCircle2,
  Play,
  Pause,
  MessageSquare,
  Send,
  RefreshCw,
  Mic,
  MicOff,
  Plus,
} from 'lucide-react';
import { WorshipSong, VocabularyItem, UserLevel, SongSection } from '../types';
import { WORSHIP_SONGS } from '../data/worshipSongs';
import { tts, SpeechRecognitionManager } from '../utils/speech';
import { worshipPad } from '../utils/worshipAudio';

interface WorshipStudyProps {
  userLevel?: UserLevel;
  speechRate: number;
  onSaveWord: (word: VocabularyItem) => void;
  onAddXp: (amount: number) => void;
}

type SectionStudyMode = 'meaning' | 'spoken' | 'sung';
type ArtistFilterId = 'all' | 'maverick' | 'elevation' | 'hillsong' | 'bethel' | 'classics';

export const WorshipStudy: React.FC<WorshipStudyProps> = ({
  userLevel = 'beginner',
  speechRate,
  onSaveWord,
  onAddXp,
}) => {
  const [songsCatalog, setSongsCatalog] = useState<WorshipSong[]>(WORSHIP_SONGS);
  const [selectedSong, setSelectedSong] = useState<WorshipSong>(WORSHIP_SONGS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate'>('all');
  const [artistFilter, setArtistFilter] = useState<ArtistFilterId>('all');
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [showCustomAnalyzer, setShowCustomAnalyzer] = useState(false);
  const [isExpandingSong, setIsExpandingSong] = useState(false);
  const [expandedSongIds, setExpandedSongIds] = useState<Set<string>>(new Set());

  // Per-section study tab ('meaning' | 'spoken' | 'sung')
  const [sectionModes, setSectionModes] = useState<Record<number, SectionStudyMode>>({});
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [activeAudioKind, setActiveAudioKind] = useState<'spoken' | 'sung' | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState<'spoken' | 'sung' | null>(null);
  const [withMusicalPad, setWithMusicalPad] = useState(true);
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());

  // Voice practice inside a section (speak or sing check)
  const [practicingSectionIdx, setPracticingSectionIdx] = useState<number | null>(null);
  const [practiceTranscript, setPracticeTranscript] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<{
    idx: number;
    score: number;
    messagePt: string;
  } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);

  // Custom Song Analyzer Form
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customLyrics, setCustomLyrics] = useState('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customSongError, setCustomSongError] = useState<string | null>(null);

  // Reflection response
  const [userReflection, setUserReflection] = useState('');
  const [reflectionFeedback, setReflectionFeedback] = useState<string | null>(null);
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);

  useEffect(() => {
    recognitionRef.current = new SpeechRecognitionManager();
    return () => {
      tts.stop();
      worshipPad.stopGentlePad();
      recognitionRef.current?.stopListening();
    };
  }, []);

  const stopAllAudio = () => {
    tts.stop();
    worshipPad.stopGentlePad();
    setIsPlayingAll(null);
    setActiveSectionIndex(null);
    setActiveAudioKind(null);
  };

  const handleSelectSong = (song: WorshipSong) => {
    stopAllAudio();
    setSelectedSong(song);
    setSectionModes({});
    setReflectionFeedback(null);
    setUserReflection('');
    setPracticeFeedback(null);
    setPracticeTranscript('');
  };

  const getSectionMode = (idx: number): SectionStudyMode => {
    return sectionModes[idx] || 'meaning';
  };

  const setSectionMode = (idx: number, mode: SectionStudyMode) => {
    setSectionModes((prev) => ({ ...prev, [idx]: mode }));
  };

  const handlePlaySectionSpoken = (section: SongSection, index: number, slow: boolean = false) => {
    if (activeSectionIndex === index && activeAudioKind === 'spoken') {
      stopAllAudio();
      return;
    }
    stopAllAudio();
    setActiveSectionIndex(index);
    setActiveAudioKind('spoken');

    const rate = slow ? Math.max(0.68, speechRate * 0.78) : speechRate;
    const spokenText = section.english.replace(/\s*\/\s*/g, '. ');
    tts.speak(
      spokenText,
      rate,
      1.0,
      () => {
        setActiveSectionIndex(null);
        setActiveAudioKind(null);
      },
      () => {
        setActiveSectionIndex(null);
        setActiveAudioKind(null);
      },
      'en-US'
    );
  };

  const handlePlaySectionSung = (section: SongSection, index: number) => {
    if (activeSectionIndex === index && activeAudioKind === 'sung') {
      stopAllAudio();
      return;
    }
    stopAllAudio();
    setActiveSectionIndex(index);
    setActiveAudioKind('sung');

    const phrases = section.english
      .split('/')
      .map((p) => p.trim())
      .filter(Boolean);

    if (withMusicalPad) {
      worshipPad.startGentlePad();
    }

    let phraseIdx = 0;
    const playPhrase = () => {
      if (phraseIdx >= phrases.length) {
        worshipPad.stopGentlePad();
        setActiveSectionIndex(null);
        setActiveAudioKind(null);
        onAddXp(15);
        return;
      }

      const phrase = phrases[phraseIdx];
      phraseIdx++;

      // Slightly slower, melodic legato cadence for sung phrasing
      const sungRate = Math.max(0.65, speechRate * 0.75);
      tts.speak(
        phrase,
        sungRate,
        1.06,
        () => {
          setTimeout(playPhrase, 550);
        },
        () => {
          worshipPad.stopGentlePad();
          setActiveSectionIndex(null);
          setActiveAudioKind(null);
        },
        'en-US'
      );
    };

    playPhrase();
  };

  const handlePlayAllSections = (kind: 'spoken' | 'sung') => {
    if (isPlayingAll) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setIsPlayingAll(kind);
    if (kind === 'sung' && withMusicalPad) {
      worshipPad.startGentlePad();
    }

    let currentIndex = 0;
    const playNext = () => {
      if (currentIndex >= selectedSong.sections.length) {
        stopAllAudio();
        onAddXp(30);
        return;
      }

      setActiveSectionIndex(currentIndex);
      setActiveAudioKind(kind);
      const section = selectedSong.sections[currentIndex];
      currentIndex++;

      const textToRead = section.english.replace(/\s*\/\s*/g, ', ');
      const rate = kind === 'sung' ? Math.max(0.66, speechRate * 0.76) : speechRate * 0.92;
      const pitch = kind === 'sung' ? 1.05 : 1.0;

      tts.speak(
        textToRead,
        rate,
        pitch,
        () => {
          setTimeout(playNext, kind === 'sung' ? 700 : 500);
        },
        () => {
          stopAllAudio();
        },
        'en-US'
      );
    };

    playNext();
  };

  const handleToggleVoicePractice = (section: SongSection, idx: number) => {
    if (practicingSectionIdx === idx) {
      recognitionRef.current?.stopListening();
      setPracticingSectionIdx(null);
      return;
    }

    if (!recognitionRef.current || !recognitionRef.current.isSupported) {
      setPracticeFeedback({
        idx,
        score: 0,
        messagePt:
          'O reconhecimento de voz não está disponível neste navegador. Experimente usar o Google Chrome ou Microsoft Edge.',
      });
      return;
    }

    stopAllAudio();
    setPracticingSectionIdx(idx);
    setPracticeTranscript('');
    setPracticeFeedback(null);

    const firstLine = section.english.split('/')[0]?.trim() || section.english;
    recognitionRef.current.startListening(
      (result) => {
        setPracticeTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          setPracticingSectionIdx(null);
          const expectedWords = firstLine
            .toLowerCase()
            .replace(/[^a-z0-9\s']/g, '')
            .split(/\s+/)
            .filter(Boolean);
          const spokenWords = result.transcript
            .toLowerCase()
            .replace(/[^a-z0-9\s']/g, '')
            .split(/\s+/)
            .filter(Boolean);
          const matched = expectedWords.filter((w) => spokenWords.includes(w)).length;
          const score = Math.min(100, Math.max(40, Math.round((matched / Math.max(1, expectedWords.length)) * 100)));

          onAddXp(25);
          setPracticeFeedback({
            idx,
            score,
            messagePt:
              score >= 80
                ? `Excelente! Você acertou ${score}% das palavras de "${firstLine}". Sua pronúncia está ficando muito natural!`
                : `Ótima tentativa (${score}% de acerto)! Ouça novamente no modo Falado e tente repetir devagar: "${firstLine}".`,
          });
        }
      },
      () => {
        setPracticingSectionIdx(null);
      },
      () => {
        setPracticingSectionIdx(null);
      },
      { lang: 'en-US' }
    );
  };

  const handleSaveWordItem = (item: {
    word: string;
    phonetic: string;
    meaning: string;
    biblicalContext: string;
  }) => {
    onSaveWord({
      term: item.word,
      phonetic: item.phonetic,
      meaning: `${item.meaning} (${item.biblicalContext})`,
      example: `Found in the worship song "${selectedSong.title}".`,
      category: 'worship',
    });
    setSavedTerms((prev) => new Set(prev).add(item.word));
    onAddXp(15);
  };

  const handleAnalyzeCustomSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSongTitle.trim() && !customLyrics.trim()) return;

    setIsAnalyzingCustom(true);
    setCustomSongError(null);

    try {
      const response = await fetch('/api/analyze-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: customSongTitle,
          artist: customArtist,
          lyrics: customLyrics,
        }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível analisar este louvor agora.');
      }

      const analyzedSong = await response.json();
      const newSong: WorshipSong = {
        id: `custom-${Date.now()}`,
        title: analyzedSong.title || customSongTitle || 'Louvor Personalizado',
        titlePt: analyzedSong.titlePt || 'Louvor escolhido por você',
        artist: analyzedSong.artist || customArtist || 'Worship',
        year: '2025',
        level: analyzedSong.level === 'intermediate' ? 'intermediate' : 'beginner',
        themeTagPt: analyzedSong.themeTagPt || 'Adoração Personalizada',
        spiritualTheme: analyzedSong.spiritualTheme || 'Mensagem cristã e exaltação a Deus.',
        keyBiblicalVerse:
          analyzedSong.keyBiblicalVerse || 'Psalm 100:1 - Make a joyful noise to the Lord',
        sections: analyzedSong.sections || [],
        topVocabulary: analyzedSong.topVocabulary || [],
        conversationPrompt: analyzedSong.conversationPrompt || {
          questionEn: 'How does this worship song speak to your faith?',
          questionPt: 'Como este louvor fala à sua fé?',
          suggestedAnswerTemplate: "This song reminds me of God's love...",
        },
      };

      setSongsCatalog((prev) => [newSong, ...prev]);
      handleSelectSong(newSong);
      setCustomSongTitle('');
      setCustomLyrics('');
      setCustomArtist('');
      setShowCustomAnalyzer(false);
      onAddXp(40);
    } catch (err: any) {
      console.error(err);
      setCustomSongError(err.message || 'Erro ao processar louvor com IA.');
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleSendReflection = async () => {
    if (!userReflection.trim() || isSubmittingReflection) return;

    setIsSubmittingReflection(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Sobre o louvor "${selectedSong.title}", aqui está minha resposta: "${userReflection}"`,
          persona: 'pastor_david',
          level: userLevel,
          focus: 'worship',
          interactionCount: 1,
        }),
      });

      const data = await response.json();
      setReflectionFeedback(data.mentorGuidancePt || data.replyEn || 'Linda reflexão!');
      onAddXp(35);
    } catch {
      setReflectionFeedback(
        'Que linda partilha! Conversar sobre sua fé, começando em português e inserindo palavras em inglês aos poucos, constrói uma base firme e natural.'
      );
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const handleExpandSelectedSongWithAi = async () => {
    if (isExpandingSong) return;
    setIsExpandingSong(true);
    try {
      const existingLyrics = selectedSong.sections.map((s) => `${s.type}: ${s.english}`).join('\n');
      const response = await fetch('/api/analyze-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: selectedSong.title,
          artist: selectedSong.artist,
          lyrics: existingLyrics,
        }),
      });
      if (!response.ok) throw new Error('Falha ao expandir estudo do louvor.');
      const analyzed = await response.json();
      if (Array.isArray(analyzed.sections) && analyzed.sections.length > 0) {
        const updatedSong: WorshipSong = {
          ...selectedSong,
          spiritualTheme: analyzed.spiritualTheme || selectedSong.spiritualTheme,
          keyBiblicalVerse: analyzed.keyBiblicalVerse || selectedSong.keyBiblicalVerse,
          sections: analyzed.sections,
          topVocabulary:
            Array.isArray(analyzed.topVocabulary) && analyzed.topVocabulary.length > 0
              ? analyzed.topVocabulary
              : selectedSong.topVocabulary,
        };
        setSongsCatalog((prev) => prev.map((s) => (s.id === selectedSong.id ? updatedSong : s)));
        setSelectedSong(updatedSong);
        setExpandedSongIds((prev) => new Set(prev).add(selectedSong.id));
        onAddXp(25);
      }
    } catch (err) {
      console.error('Erro ao expandir estudo do louvor:', err);
    } finally {
      setIsExpandingSong(false);
    }
  };

  const matchesArtistCategory = (artist: string, filter: ArtistFilterId): boolean => {
    const a = artist.toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'maverick') return a.includes('maverick');
    if (filter === 'elevation') return a.includes('elevation') || a.includes('brandon lake');
    if (filter === 'hillsong') return a.includes('hillsong');
    if (filter === 'bethel') return a.includes('bethel') || a.includes('phil wickham') || a.includes('kari jobe');
    return (
      !a.includes('maverick') &&
      !a.includes('elevation') &&
      !a.includes('hillsong') &&
      !a.includes('bethel')
    );
  };

  const maverickCount = songsCatalog.filter((s) => s.artist.toLowerCase().includes('maverick')).length;
  const elevationCount = songsCatalog.filter((s) => {
    const a = s.artist.toLowerCase();
    return a.includes('elevation') || a.includes('brandon lake');
  }).length;
  const hillsongCount = songsCatalog.filter((s) => s.artist.toLowerCase().includes('hillsong')).length;
  const bethelCount = songsCatalog.filter((s) => {
    const a = s.artist.toLowerCase();
    return a.includes('bethel') || a.includes('phil wickham') || a.includes('kari jobe');
  }).length;
  const classicsCount = songsCatalog.filter((s) => matchesArtistCategory(s.artist, 'classics')).length;

  const filteredSongs = songsCatalog.filter((song) => {
    const matchesLevel = levelFilter === 'all' || (song.level || 'beginner') === levelFilter;
    const matchesArtist = matchesArtistCategory(song.artist, artistFilter);
    if (!matchesLevel || !matchesArtist) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      song.title.toLowerCase().includes(q) ||
      (song.titlePt || '').toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      (song.themeTagPt || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Welcoming Banner & Song Picker Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
              <HeartHandshake className="w-4 h-4" />
              <span>Aprender com Louvores</span>
              <span aria-hidden="true">·</span>
              <span>Significado, Pronúncia Falada e Cantada</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Escolha o louvor que deseja aprender hoje
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {userLevel === 'beginner'
                ? 'Bem-vindo(a)! Todas as explicações começam em português acolhedor. Escolha um louvor abaixo para entender o significado, ouvir como se fala no dia a dia e treinar como se canta na melodia.'
                : 'Selecione um louvor do catálogo ou peça qualquer música para estudar o significado bíblico, a dicção falada e o fluxo melódico cantado.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomAnalyzer((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shrink-0 cursor-pointer self-start lg:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>{showCustomAnalyzer ? 'Fechar Busca Personalizada' : 'Escolher Outro Louvor (IA)'}</span>
          </button>
        </div>

        {/* Collapsible Custom Song Form */}
        {showCustomAnalyzer && (
          <form
            onSubmit={handleAnalyzeCustomSong}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
          >
            <div className="text-xs font-bold text-slate-200">
              Digite o nome de qualquer louvor internacional para gerar significado + pronúncia falada e cantada:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={customSongTitle}
                onChange={(e) => setCustomSongTitle(e.target.value)}
                placeholder="Nome do louvor (ex: Gratitude, Firm Foundation, Holy Forever)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={customArtist}
                onChange={(e) => setCustomArtist(e.target.value)}
                placeholder="Cantor ou ministério (opcional)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <textarea
              rows={2}
              value={customLyrics}
              onChange={(e) => setCustomLyrics(e.target.value)}
              placeholder="Cole um trecho da letra se desejar (opcional — se deixar em branco, a IA busca a letra)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {customSongError && <p className="text-xs text-rose-400">{customSongError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzingCustom || (!customSongTitle.trim() && !customLyrics.trim())}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {isAnalyzingCustom ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparando aula deste louvor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Aula Completa (+40 XP)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Search, Ministry Filter & Level Filter Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isCatalogOpen) setIsCatalogOpen(true);
                }}
                placeholder={`Buscar entre ${songsCatalog.length} louvores por título, artista (ex: Maverick City) ou tema...`}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLevelFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    levelFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({songsCatalog.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLevelFilter('beginner')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    levelFilter === 'beginner'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciantes
                </button>
                <button
                  type="button"
                  onClick={() => setLevelFilter('intermediate')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    levelFilter === 'intermediate'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Intermediário
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogOpen((prev) => !prev)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {isCatalogOpen ? 'Recolher Lista' : `Ver Catálogo (${songsCatalog.length})`}
              </button>
            </div>
          </div>

          {/* Ministry / Artist Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: 'all', label: `Todos os Ministérios (${songsCatalog.length})` },
                { id: 'maverick', label: `Maverick City Music (${maverickCount})` },
                { id: 'elevation', label: `Elevation & Brandon Lake (${elevationCount})` },
                { id: 'hillsong', label: `Hillsong (${hillsongCount})` },
                { id: 'bethel', label: `Bethel & Phil Wickham (${bethelCount})` },
                { id: 'classics', label: `Hinos & Outros Sucessos (${classicsCount})` },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setArtistFilter(cat.id);
                  if (!isCatalogOpen) setIsCatalogOpen(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums border ${
                  artistFilter === cat.id
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable 100+ Worship Song Selector Grid */}
        {isCatalogOpen && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center justify-between tabular-nums">
              <span>
                Exibindo {filteredSongs.length} {filteredSongs.length === 1 ? 'louvor' : 'louvores'}
              </span>
              <span>Clique em qualquer opção para estudar</span>
            </div>

            <div className="max-h-[340px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredSongs.map((song) => {
                const isSelected = selectedSong.id === song.id;
                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => handleSelectSong(song)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/40'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="shrink-0">
                          {song.level === 'intermediate' ? 'Intermediário' : 'Iniciante'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{song.artist.split('/')[0].trim()}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1 leading-snug">{song.title}</div>
                      {song.titlePt && (
                        <div className="text-xs text-purple-300 mt-0.5 truncate">{song.titlePt}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px] gap-2">
                      <span className="text-slate-400 truncate">{song.themeTagPt || 'Adoração'}</span>
                      <span
                        className={`font-bold shrink-0 whitespace-nowrap ${
                          isSelected ? 'text-purple-300' : 'text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Selecionado' : 'Estudar →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isCatalogOpen && filteredSongs.length === 0 && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Nenhum louvor encontrado com esse filtro. Você pode analisar qualquer louvor com IA!</span>
            <button
              type="button"
              onClick={() => {
                setCustomSongTitle(searchQuery);
                setShowCustomAnalyzer(true);
              }}
              className="text-purple-300 font-bold underline cursor-pointer ml-3 shrink-0"
            >
              Analisar "{searchQuery}"
            </button>
          </div>
        )}
      </div>

      {/* Selected Song Study Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Meaning, Spoken & Sung Pronunciation per Stanza (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Song Overview + Full Playback Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{selectedSong.artist}</span>
                  {selectedSong.year && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{selectedSong.year}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{selectedSong.level === 'intermediate' ? 'Intermediário' : 'Iniciante'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {selectedSong.title}
                </h3>
                {selectedSong.titlePt && (
                  <p className="text-xs font-semibold text-purple-300">
                    Tradução: {selectedSong.titlePt}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={withMusicalPad}
                  onChange={(e) => setWithMusicalPad(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Base musical suave ao cantar</span>
              </label>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedSong.spiritualTheme}</p>

            {/* Full Song Controls: Spoken vs Sung + AI Deep-Dive */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handlePlayAllSections('spoken')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isPlayingAll === 'spoken'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                }`}
              >
                {isPlayingAll === 'spoken' ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isPlayingAll === 'spoken' ? 'Pausar Leitura Falada' : 'Ouvir Completo (Falado)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAllSections('sung')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isPlayingAll === 'sung'
                    ? 'bg-amber-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isPlayingAll === 'sung' ? <Pause className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                <span>{isPlayingAll === 'sung' ? 'Pausar Modo Cantado' : 'Ouvir Completo (Cantado)'}</span>
              </button>

              {!expandedSongIds.has(selectedSong.id) && (
                <button
                  type="button"
                  onClick={handleExpandSelectedSongWithAi}
                  disabled={isExpandingSong}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isExpandingSong ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isExpandingSong ? 'Gerando mais estrofes...' : 'Aprofundar Letra com IA'}</span>
                </button>
              )}
            </div>

            {/* Biblical Basis */}
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-300 block">Base Bíblica:</span>
                <span>{selectedSong.keyBiblicalVerse}</span>
              </div>
            </div>
          </div>

          {/* Stanzas / Sections with Meaning + Spoken Pronunciation + Sung Pronunciation */}
          <div className="space-y-4">
            {selectedSong.sections.map((section, idx) => {
              const mode = getSectionMode(idx);
              const isPlayingSpoken = activeSectionIndex === idx && activeAudioKind === 'spoken';
              const isPlayingSung = activeSectionIndex === idx && activeAudioKind === 'sung';
              const isPracticingMic = practicingSectionIdx === idx;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition ${
                    activeSectionIndex === idx
                      ? 'bg-purple-950/30 border-purple-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Section Title & Mode Switch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-purple-300">{section.type}</span>

                    <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg self-start">
                      <button
                        type="button"
                        onClick={() => setSectionMode(idx, 'meaning')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          mode === 'meaning'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Significado
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionMode(idx, 'spoken')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          mode === 'spoken'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Pronúncia Falada
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionMode(idx, 'sung')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          mode === 'sung'
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Pronúncia Cantada
                      </button>
                    </div>
                  </div>

                  {/* Original English Lyrics (Always visible for reference) */}
                  <p className="text-base font-bold text-white leading-relaxed mt-3">
                    {section.english}
                  </p>

                  {/* Tab 1: Meaning */}
                  {mode === 'meaning' && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-[11px] font-semibold text-indigo-300 mb-1">
                          Significado em Português
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{section.portuguese}</p>
                      </div>

                      {section.grammarHighlight && (
                        <div className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-purple-300">Estrutura & Gramática: </strong>
                          {section.grammarHighlight}
                        </div>
                      )}

                      {section.keyVocab && section.keyVocab.length > 0 && (
                        <div className="text-xs text-slate-400">
                          <strong className="text-slate-200">Expressões deste trecho: </strong>
                          {section.keyVocab.join(' · ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Spoken Pronunciation */}
                  {mode === 'spoken' && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-emerald-300">
                          Como um brasileiro lê falando naturalmente
                        </div>
                        <p className="text-sm font-mono font-semibold text-emerald-200 leading-relaxed">
                          {section.spokenPhoneticEasy || section.pronunciationTip || section.english}
                        </p>
                        {(section.spokenTipPt || section.pronunciationTip) && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-100">Dica para falar: </strong>
                            {section.spokenTipPt || section.pronunciationTip}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlaySectionSpoken(section, idx, false)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isPlayingSpoken ? 'Parar Fala' : 'Ouvir Pronúncia Falada'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlaySectionSpoken(section, idx, true)}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Ouvir Bem Devagar (Iniciante)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Sung Pronunciation */}
                  {mode === 'sung' && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-purple-300">
                          Cadência Cantada (ligações musicais, vogais sustentadas e pausas ♩)
                        </div>
                        <p className="text-sm font-mono font-semibold text-purple-200 leading-relaxed">
                          {section.sungPhoneticFlow || section.spokenPhoneticEasy || section.english}
                        </p>
                        {(section.sungTipPt || section.pronunciationTip) && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-100">Como cantar sem travar: </strong>
                            {section.sungTipPt || section.pronunciationTip}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlaySectionSung(section, idx)}
                          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Music className="w-3.5 h-3.5" />
                          <span>{isPlayingSung ? 'Parar Canto' : 'Ouvir Cadência Cantada'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Voice Practice Bar (Always accessible at bottom of section) */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlaySectionSpoken(section, idx, false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Falado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlaySectionSung(section, idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5 text-purple-400" />
                        <span>Cantado</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVoicePractice(section, idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                        isPracticingMic
                          ? 'bg-rose-600 text-white'
                          : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40'
                      }`}
                    >
                      {isPracticingMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isPracticingMic ? 'Parar Microfone' : 'Testar Minha Voz'}</span>
                    </button>
                  </div>

                  {isPracticingMic && (
                    <div className="mt-2 p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/40 text-xs text-indigo-200">
                      Fale ou cante o primeiro verso: <strong>"{section.english.split('/')[0]?.trim()}"</strong>
                      {practiceTranscript && (
                        <div className="mt-1 text-white">Ouvido: "{practiceTranscript}"</div>
                      )}
                    </div>
                  )}

                  {practiceFeedback && practiceFeedback.idx === idx && (
                    <div className="mt-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
                      {practiceFeedback.messagePt}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Key Vocabulary & Guided Portuguese-First Reflection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Vocabulário deste Louvor</h4>
              <span className="text-[11px] text-slate-400">Toque para ouvir e salvar</span>
            </div>

            <div className="space-y-2.5">
              {selectedSong.topVocabulary.map((item, vIdx) => {
                const isSaved = savedTerms.has(item.word);
                return (
                  <div
                    key={vIdx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{item.word}</span>
                        <span className="text-[11px] text-purple-300 font-mono">{item.phonetic}</span>
                        <button
                          type="button"
                          onClick={() => tts.speak(item.word, speechRate, 1.0, undefined, undefined, 'en-US')}
                          title="Ouvir palavra"
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveWordItem(item)}
                        disabled={isSaved}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white'
                        }`}
                      >
                        {isSaved ? <CheckCircle2 className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                        <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200">
                      <strong>Significado:</strong> {item.meaning}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.biblicalContext}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warm Portuguese-First Guided Reflection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <MessageSquare className="w-4 h-4" />
              <span>Prática Acolhedora com o Pastor David</span>
            </div>

            <p className="text-sm font-bold text-white">
              {selectedSong.conversationPrompt.questionPt}
            </p>
            <p className="text-xs text-slate-400">
              Em inglês: "{selectedSong.conversationPrompt.questionEn}"
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <span className="text-[11px] font-bold text-indigo-300 block mb-1">
                {userLevel === 'beginner'
                  ? 'Pode responder em português ou tentar misturar palavras em inglês:'
                  : 'Modelo de resposta em inglês:'}
              </span>
              <span>"{selectedSong.conversationPrompt.suggestedAnswerTemplate}"</span>
            </div>

            <textarea
              rows={3}
              value={userReflection}
              onChange={(e) => setUserReflection(e.target.value)}
              placeholder={
                userLevel === 'beginner'
                  ? 'Escreva em português ou arrisque suas primeiras palavras em inglês...'
                  : 'Escreva sua resposta em inglês para praticar...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <button
              type="button"
              onClick={handleSendReflection}
              disabled={!userReflection.trim() || isSubmittingReflection}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmittingReflection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Enviar Reflexão (+35 XP)</span>
            </button>

            {reflectionFeedback && (
              <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-100 leading-relaxed">
                <strong className="block text-indigo-300 mb-1">Resposta do Pastor David:</strong>
                {reflectionFeedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
