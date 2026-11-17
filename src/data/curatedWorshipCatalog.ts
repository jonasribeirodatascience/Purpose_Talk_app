import { WorshipSong } from '../types';
import { MAVERICK_AND_MODERN_ENTRIES } from './worshipCatalogMaverickAndModern';
import { CLASSICS_AND_HITS_ENTRIES } from './worshipCatalogClassicsAndHits';
import { FAVORITES_PART_1 } from './worshipCatalogFavorites1';

export interface CompactWorshipEntry {
  id: string;
  title: string;
  titlePt: string;
  artist: string;
  year: string;
  level: 'beginner' | 'intermediate';
  themeTagPt: string;
  spiritualTheme: string;
  keyBiblicalVerse: string;
  chorusEn: string;
  chorusPt: string;
  spokenPhoneticEasy: string;
  spokenTipPt: string;
  sungPhoneticFlow: string;
  sungTipPt: string;
  grammarHighlight: string;
  verseEn: string;
  versePt: string;
  verseSpokenPhonetic: string;
  verseSungPhonetic: string;
  vocabWord: string;
  vocabPhonetic: string;
  vocabMeaning: string;
  vocabWord2: string;
  vocabPhonetic2: string;
  vocabMeaning2: string;
  questionPt: string;
  questionEn: string;
  suggestedAnswer: string;
}

export function buildCatalogSong(entry: CompactWorshipEntry): WorshipSong {
  return {
    id: entry.id,
    title: entry.title,
    titlePt: entry.titlePt,
    artist: entry.artist,
    year: entry.year,
    level: entry.level,
    themeTagPt: entry.themeTagPt,
    spiritualTheme: entry.spiritualTheme,
    keyBiblicalVerse: entry.keyBiblicalVerse,
    sections: [
      {
        type: 'Chorus (Refrão Principal)',
        english: entry.chorusEn,
        portuguese: entry.chorusPt,
        keyVocab: [
          `${entry.vocabWord} (${entry.vocabMeaning})`,
          `${entry.vocabWord2} (${entry.vocabMeaning2})`,
        ],
        grammarHighlight: entry.grammarHighlight,
        pronunciationTip: entry.spokenTipPt,
        spokenPhoneticEasy: entry.spokenPhoneticEasy,
        spokenTipPt: entry.spokenTipPt,
        sungPhoneticFlow: entry.sungPhoneticFlow,
        sungTipPt: entry.sungTipPt,
      },
      {
        type: 'Verse / Bridge (Estrofe-Chave)',
        english: entry.verseEn,
        portuguese: entry.versePt,
        keyVocab: [`${entry.vocabWord2} (${entry.vocabMeaning2})`],
        grammarHighlight: `Estrutura acolhedora presente em "${entry.title}" para fortalecer sua compreensão oral e cantada.`,
        pronunciationTip: 'Observe as ligações entre palavras finais em consoante e palavras iniciais em vogal.',
        spokenPhoneticEasy: entry.verseSpokenPhonetic,
        spokenTipPt: 'Fale pausadamente sílaba por sílaba primeiro usando o botão "Ouvir Bem Devagar".',
        sungPhoneticFlow: entry.verseSungPhonetic,
        sungTipPt: 'Ao cantar este trecho, respire apenas após cada barra "/" mantendo as vogais abertas e conectadas.',
      },
    ],
    topVocabulary: [
      {
        word: entry.vocabWord,
        phonetic: entry.vocabPhonetic,
        meaning: entry.vocabMeaning,
        biblicalContext: entry.keyBiblicalVerse.split(' - ')[0] || 'Contexto bíblico de adoração',
      },
      {
        word: entry.vocabWord2,
        phonetic: entry.vocabPhonetic2,
        meaning: entry.vocabMeaning2,
        biblicalContext: entry.themeTagPt,
      },
    ],
    conversationPrompt: {
      questionEn: entry.questionEn,
      questionPt: entry.questionPt,
      suggestedAnswerTemplate: entry.suggestedAnswer,
    },
  };
}

export const ALL_COMPACT_ENTRIES: CompactWorshipEntry[] = [
  ...MAVERICK_AND_MODERN_ENTRIES,
  ...CLASSICS_AND_HITS_ENTRIES,
  ...FAVORITES_PART_1,
];

export const EXTENDED_WORSHIP_SONGS: WorshipSong[] = ALL_COMPACT_ENTRIES.map(buildCatalogSong);
