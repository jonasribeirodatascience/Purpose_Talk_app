import { AnalyzedWord, PronunciationAnalysisResult, WordPronunciationStatus } from '../types';

interface PhoneticEntry {
  phoneticEasy: string;
  ipa?: string;
  tipPt: string;
}

const BRAZILIAN_PHONETIC_DICTIONARY: Record<string, PhoneticEntry> = {
  throughput: {
    phoneticEasy: 'THRU-put',
    ipa: '/ˈθruː.pʊt/',
    tipPt: 'Coloque a ponta da língua suavemente entre os dentes no "TH" inicial e termine no "T" seco sem dizer "púti".',
  },
  latency: {
    phoneticEasy: 'LEI-tən-si',
    ipa: '/ˈleɪ.tən.si/',
    tipPt: 'A sílaba tônica é a primeira ("LEI"), com som suave no "t" (quase um R leve no inglês americano).',
  },
  pipeline: {
    phoneticEasy: 'PÁIP-lain',
    ipa: '/ˈpaɪp.laɪn/',
    tipPt: 'Pronuncie as duas vogais como ditongos abertos ("PÁIP-lain"), sem adicionar "i" depois do P.',
  },
  worship: {
    phoneticEasy: 'WÛR-ship',
    ipa: '/ˈwɜːr.ʃɪp/',
    tipPt: 'Arredonde os lábios para o "W" e enrole a língua para trás no "R", evitando som de "ór".',
  },
  faithful: {
    phoneticEasy: 'FÊITH-ful',
    ipa: '/ˈfeɪθ.fəl/',
    tipPt: 'No "th", sopre o ar com a ponta da língua entre os dentes (não fale "fêt-ful" com T).',
  },
  faithfulness: {
    phoneticEasy: 'FÊITH-ful-nəs',
    ipa: '/ˈfeɪθ.fəl.nəs/',
    tipPt: 'Mantenha o sopro do "th" antes do "ful" e relaxe o final "-nəs".',
  },
  steadfast: {
    phoneticEasy: 'STÉD-fæst',
    ipa: '/ˈsted.fæst/',
    tipPt: 'Comece direto no som de "S" ("stéd"), sem falar "istéd" com "i" na frente.',
  },
  covenant: {
    phoneticEasy: 'KÓV-ə-nənt',
    ipa: '/ˈkʌv.ə.nənt/',
    tipPt: 'A primeira vogal soa como um "Á/Ó" fechado e curto ("KÂV"), e o T final é bem leve.',
  },
  grace: {
    phoneticEasy: 'GRÊIS',
    ipa: '/ɡreɪs/',
    tipPt: 'Termine no som seco de "S", evitando acrescentar um "i" no final ("greici").',
  },
  mercy: {
    phoneticEasy: 'MÛR-si',
    ipa: '/ˈmɜːr.si/',
    tipPt: 'O "er" soa como um R retroflexo fechado ("MÂR-si"), diferente de "mérci".',
  },
  righteousness: {
    phoneticEasy: 'RÁI-tchəs-nəs',
    ipa: '/ˈraɪ.tʃəs.nəs/',
    tipPt: 'O "gh" é mudo e o "te" vira som de "tch" ("RÁI-tchâs-nês").',
  },
  schedule: {
    phoneticEasy: 'SKÉ-djuul (US) / SHÉ-djuul (UK)',
    ipa: '/ˈskedʒ.uːl/',
    tipPt: 'Comece direto no "S" sem "i" antes ("skédjul" no EUA ou "shédjul" no Reino Unido).',
  },
  comfortable: {
    phoneticEasy: 'KÂMF-tər-bəl',
    ipa: '/ˈkʌmf.tə.bəl/',
    tipPt: 'Tem apenas 3 sílabas na fala natural ("KÂMF-tâ-bôl"), não pronuncie o "for" separado.',
  },
  thorough: {
    phoneticEasy: 'THÛR-ou',
    ipa: '/ˈθɜːr.oʊ/',
    tipPt: 'Língua entre os dentes no "TH" + R enrolado + final "ôu" (o "gh" é mudo).',
  },
  deployed: {
    phoneticEasy: 'di-PLÓID',
    ipa: '/dɪˈplɔɪd/',
    tipPt: 'O "-ed" soa apenas como um "D" seco ("diplóid"), jamais como "deploidéd".',
  },
  worked: {
    phoneticEasy: 'WÛRKT',
    ipa: '/wɜːrkt/',
    tipPt: 'O "-ed" após "K" soa como "T" seco ("wûrkt"), nunca "workéd".',
  },
  optimized: {
    phoneticEasy: 'ÓP-ti-maizd',
    ipa: '/ˈɒp.tɪ.maɪzd/',
    tipPt: 'Acentue a primeira sílaba ("ÓP") e termine com som suave de "ZD".',
  },
  architecture: {
    phoneticEasy: 'ÁR-ki-ték-tchər',
    ipa: '/ˈɑːr.kɪ.tek.tʃər/',
    tipPt: 'O "ch" tem som de "K" ("ÁR-ki") e o "-ture" final soa "tchâr".',
  },
  bottleneck: {
    phoneticEasy: 'BÓ-təl-nék',
    ipa: '/ˈbɒt.əl.nek/',
    tipPt: 'Termine no "K" seco sem dizer "néki".',
  },
  tradeoffs: {
    phoneticEasy: 'TRÉID-ófs',
    ipa: '/ˈtreɪd.ɒfs/',
    tipPt: 'Ligue o "D" ao "O" como "tréi-dófs".',
  },
  database: {
    phoneticEasy: 'DÉI-tə-beis',
    ipa: '/ˈdeɪ.tə.beɪs/',
    tipPt: 'Comece com "DÉI" (não "dáta") e termine no "S" seco sem "beizi".',
  },
  algorithm: {
    phoneticEasy: 'ÆL-gə-ri-ðəm',
    ipa: '/ˈæl.ɡə.rɪ.ðəm/',
    tipPt: 'A sílaba forte é a primeira ("ÉL-gâ-ri-dâm"), com "th" vibrante no final.',
  },
  miracle: {
    phoneticEasy: 'MÍ-rə-kəl',
    ipa: '/ˈmɪr.ə.kəl/',
    tipPt: 'Acentue "MÍ" e reduza as vogais finais para um som curto ("râ-kôl").',
  },
  promise: {
    phoneticEasy: 'PRÓ-mis',
    ipa: '/ˈprɒm.ɪs/',
    tipPt: 'Acentue o início ("PRÓ") com lábios arredondados e finalize em "S" seco.',
  },
  the: {
    phoneticEasy: 'ðə / ði',
    ipa: '/ðə/',
    tipPt: 'Encoste a ponta da língua nos dentes superiores vibrando suavemente (não fale "dê" seco).',
  },
  this: {
    phoneticEasy: 'ðɪs',
    ipa: '/ðɪs/',
    tipPt: 'I curto e língua nos dentes no "th", terminando em "S" (não "dis" longo).',
  },
  that: {
    phoneticEasy: 'ðæt',
    ipa: '/ðæt/',
    tipPt: 'Língua entre os dentes no "th" e vogal aberta entre "é" e "á".',
  },
  with: {
    phoneticEasy: 'wɪð / wɪθ',
    ipa: '/wɪð/',
    tipPt: 'Arredonde a boca no "W" e termine soprando entre os dentes no "TH" (sem "uíti").',
  },
  world: {
    phoneticEasy: 'WÛRLD',
    ipa: '/wɜːrld/',
    tipPt: 'Lábios arredondados no "W", língua enrolada no "R" e toque leve no "LD" final.',
  },
  really: {
    phoneticEasy: 'RÍ-li',
    ipa: '/ˈrɪə.li/',
    tipPt: 'O "R" inicial do inglês é enrolado sem vibrar a garganta como "híli".',
  },
  red: {
    phoneticEasy: 'RÉD',
    ipa: '/red/',
    tipPt: 'Enrole a língua para trás no "R" para não confundir com "head" (cabeça).',
  },
  would: {
    phoneticEasy: 'WUD',
    ipa: '/wʊd/',
    tipPt: 'O "L" é totalmente mudo! Fale apenas "wúd" com lábios arredondados.',
  },
  could: {
    phoneticEasy: 'KUD',
    ipa: '/kʊd/',
    tipPt: 'O "L" é mudo! Pronuncie "kúd" sem falar "côuld".',
  },
  should: {
    phoneticEasy: 'SHUD',
    ipa: '/ʃʊd/',
    tipPt: 'O "L" é mudo! Diga apenas "shúd".',
  },
};

export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

const CONTRACTION_MAP: Record<string, string[]> = {
  "i'm": ['i', 'am'],
  "you're": ['you', 'are'],
  "we're": ['we', 'are'],
  "they're": ['they', 'are'],
  "he's": ['he', 'is'],
  "she's": ['she', 'is'],
  "it's": ['it', 'is'],
  "that's": ['that', 'is'],
  "what's": ['what', 'is'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "didn't": ['did', 'not'],
  "can't": ['cannot'],
  "won't": ['will', 'not'],
  "i'd": ['i', 'would'],
  "i'll": ['i', 'will'],
  "i've": ['i', 'have'],
  "you've": ['you', 'have'],
  "gonna": ['going', 'to'],
  "wanna": ['want', 'to'],
};

export function tokenizeForComparison(text: string): string[] {
  if (!text) return [];
  const raw = text.trim().split(/\s+/);
  const tokens: string[] = [];
  for (const r of raw) {
    const clean = normalizeWord(r);
    if (clean) tokens.push(clean);
  }
  return tokens;
}

/**
 * Generates an intuitive Portuguese-friendly phonetic approximation when a word
 * isn't in the curated dictionary yet.
 */
export function buildFallbackPhonetic(word: string): PhoneticEntry {
  const clean = normalizeWord(word);
  if (BRAZILIAN_PHONETIC_DICTIONARY[clean]) {
    return BRAZILIAN_PHONETIC_DICTIONARY[clean];
  }

  let easy = clean
    .replace(/^th/, 'TH')
    .replace(/th/g, 'th')
    .replace(/sh/g, 'sh')
    .replace(/ch/g, 'tch')
    .replace(/ph/g, 'f')
    .replace(/tion$/, 'shən')
    .replace(/sion$/, 'jən')
    .replace(/oo/g, 'uu')
    .replace(/ee/g, 'ii')
    .replace(/ea/g, 'ii')
    .replace(/ai/g, 'ei')
    .replace(/ay/g, 'ei')
    .replace(/ow/g, 'au');

  let tipPt = 'Pronuncie com ritmo natural e evite acrescentar vogais ("i" ou "e") no final de consoantes.';
  if (clean.includes('th')) {
    tipPt = 'Atenção ao "TH": coloque a ponta da língua entre os dentes e sopre suavemente, evitando som de T, D ou S.';
  } else if (clean.startsWith('r')) {
    tipPt = 'No "R" inicial, enrole a ponta da língua para trás sem tocar no céu da boca (evite som de "R" forte da garganta).';
  } else if (clean.endsWith('ed')) {
    tipPt = 'Na terminação "-ed", não pronuncie a vogal "e" como sílaba extra; termine seco em som de /d/ ou /t/.';
  } else if (/^s[ptckmnl]/.test(clean)) {
    tipPt = 'Comece direto no som de "S" ("sss..."), sem colocar um "i" antes da palavra.';
  } else if (/[ptkbdg]$/.test(clean)) {
    tipPt = 'Termine a consoante final de forma seca e curta, sem adicionar som de "i" no final.';
  }

  return {
    phoneticEasy: easy.toUpperCase(),
    tipPt,
  };
}

/**
 * Canonical phonetic fingerprint tailored for Brazilian English learners
 * (e.g. recognizes "tree"/"free" vs "three", "dis" vs "this", "work it" vs "worked").
 */
function brazilianPhoneticKey(word: string): string {
  return normalizeWord(word)
    .replace(/ph/g, 'f')
    .replace(/gh/g, '')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/qu/g, 'kw')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/w/g, 'v')
    .replace(/[aeiouy]+/g, 'a')
    .replace(/(.)\1+/g, '$1');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function wordSimilarity(aRaw: string, bRaw: string): number {
  const a = normalizeWord(aRaw);
  const b = normalizeWord(bRaw);
  if (!a || !b) return 0;
  if (a === b) return 1;

  // Check contraction equivalence
  const aExp = CONTRACTION_MAP[a]?.join('');
  const bExp = CONTRACTION_MAP[b]?.join('');
  if ((aExp && aExp === b) || (bExp && bExp === a)) return 0.95;

  const maxLen = Math.max(a.length, b.length);
  const charSim = 1 - levenshtein(a, b) / maxLen;

  const pa = brazilianPhoneticKey(a);
  const pb = brazilianPhoneticKey(b);
  const pMax = Math.max(pa.length, pb.length) || 1;
  const phonSim = 1 - levenshtein(pa, pb) / pMax;

  return Math.max(charSim, phonSim * 0.9);
}

/**
 * Aligns spoken words against target AI words in real time and marks each word
 * as accurate, close, mispronounced, missing, or extra.
 */
export function analyzePronunciationRealtime(
  targetText: string,
  spokenText: string,
  overallConfidence: number = 0.85,
  isFinal: boolean = false
): PronunciationAnalysisResult {
  const targetTokens = targetText.trim() ? targetText.trim().split(/\s+/) : [];
  const spokenTokens = spokenText.trim() ? spokenText.trim().split(/\s+/) : [];

  // Free-speech mode (no target phrase to compare against yet)
  if (targetTokens.length === 0) {
    const words: AnalyzedWord[] = spokenTokens.map((tok, idx) => {
      const clean = normalizeWord(tok);
      const hint = buildFallbackPhonetic(clean);
      const isBrazilianPitfall =
        clean.includes('th') ||
        clean.endsWith('ed') ||
        clean.startsWith('r') ||
        clean.length >= 8;

      let status: WordPronunciationStatus = 'accurate';
      if (overallConfidence < 0.65 && clean.length > 2) {
        status = 'mispronounced';
      } else if (overallConfidence < 0.8 && isBrazilianPitfall) {
        status = 'close';
      }

      return {
        id: `free-${idx}-${clean}`,
        expectedWord: tok.replace(/[.,!?;:]+$/g, ''),
        spokenWord: tok,
        status,
        confidence: overallConfidence,
        phoneticEasy: hint.phoneticEasy,
        ipa: hint.ipa,
        tipPt: hint.tipPt,
      };
    });

    const accurateCount = words.filter(w => w.status === 'accurate').length;
    const closeCount = words.filter(w => w.status === 'close').length;
    const score = words.length > 0
      ? Math.round(((accurateCount + closeCount * 0.65) / words.length) * 100)
      : 0;

    return {
      targetText: '',
      spokenText,
      accuracyScore: score,
      words,
      summaryPt:
        words.length === 0
          ? 'Aguardando você começar a falar...'
          : 'Modo conversa livre: palavras com menor clareza acústica ou sons críticos para brasileiros estão destacadas.',
    };
  }

  // Target comparison mode using sequence alignment (DP)
  const m = targetTokens.length;
  const n = spokenTokens.length;

  // If user hasn't spoken all words yet during interim speaking, only align up to what makes sense
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const GAP_PENALTY = -0.35;

  for (let i = 1; i <= m; i++) dp[i][0] = i * GAP_PENALTY;
  for (let j = 1; j <= n; j++) dp[0][j] = j * GAP_PENALTY;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = wordSimilarity(targetTokens[i - 1], spokenTokens[j - 1]);
      const matchScore = sim >= 0.45 ? sim : -0.4;
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore,
        dp[i - 1][j] + GAP_PENALTY,
        dp[i][j - 1] + GAP_PENALTY
      );
    }
  }

  // Backtrack
  const aligned: AnalyzedWord[] = [];
  let i = m;
  let j = n;
  let step = 0;

  while (i > 0 || j > 0) {
    step++;
    if (i > 0 && j > 0) {
      const sim = wordSimilarity(targetTokens[i - 1], spokenTokens[j - 1]);
      const matchScore = sim >= 0.45 ? sim : -0.4;
      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchScore)) < 1e-6) {
        const expRaw = targetTokens[i - 1];
        const expClean = normalizeWord(expRaw);
        const spkRaw = spokenTokens[j - 1];
        const spkClean = normalizeWord(spkRaw);
        const hint = buildFallbackPhonetic(expClean);

        let status: WordPronunciationStatus = 'accurate';
        let tipPt = hint.tipPt;

        if (expClean === spkClean) {
          status = overallConfidence < 0.58 && isFinal ? 'close' : 'accurate';
        } else if (sim >= 0.65) {
          status = 'close';
          tipPt = `O microfone captou "${spkClean}" em vez de "${expClean}". ${hint.tipPt}`;
        } else {
          status = 'mispronounced';
          tipPt = `Você pronunciou próximo de "${spkClean}", mas a pronúncia da IA é "${expClean}" [${hint.phoneticEasy}]. ${hint.tipPt}`;
        }

        aligned.unshift({
          id: `w-${i}-${j}-${expClean}`,
          expectedWord: expRaw.replace(/[.,!?;:"']+$/g, ''),
          spokenWord: spkRaw,
          status,
          confidence: expClean === spkClean ? Math.max(overallConfidence, 0.85) : sim,
          phoneticEasy: hint.phoneticEasy,
          ipa: hint.ipa,
          tipPt,
        });
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && (j === 0 || Math.abs(dp[i][j] - (dp[i - 1][j] + GAP_PENALTY)) < 1e-6)) {
      const expRaw = targetTokens[i - 1];
      const expClean = normalizeWord(expRaw);
      const hint = buildFallbackPhonetic(expClean);

      // Don't mark trailing unreached words as missing while user is still speaking (unless final or user passed it)
      const isTrailingWhileSpeaking = !isFinal && j === n;

      aligned.unshift({
        id: `miss-${i}-${expClean}`,
        expectedWord: expRaw.replace(/[.,!?;:"']+$/g, ''),
        spokenWord: '',
        status: isTrailingWhileSpeaking ? 'close' : 'missing',
        confidence: 0,
        phoneticEasy: hint.phoneticEasy,
        ipa: hint.ipa,
        tipPt: isTrailingWhileSpeaking
          ? `Próxima palavra da frase: "${expClean}" [${hint.phoneticEasy}].`
          : `Palavra não reconhecida ou omitida na fala. Ouça como a IA pronuncia "${expClean}" [${hint.phoneticEasy}]. ${hint.tipPt}`,
      });
      i--;
    } else if (j > 0) {
      const spkRaw = spokenTokens[j - 1];
      const spkClean = normalizeWord(spkRaw);
      const hint = buildFallbackPhonetic(spkClean);
      aligned.unshift({
        id: `extra-${j}-${spkClean}`,
        expectedWord: spkRaw,
        spokenWord: spkRaw,
        status: 'extra',
        confidence: overallConfidence,
        phoneticEasy: hint.phoneticEasy,
        tipPt: `Palavra extra ou divisão de sílaba captada ("${spkClean}") que não estava na frase-alvo da IA.`,
      });
      j--;
    }
  }

  // Filter out trailing "upcoming" placeholders from accuracy calculation while speaking
  const evaluated = aligned.filter(w => !(w.status === 'close' && w.spokenWord === ''));
  const totalEvaluated = Math.max(evaluated.length, 1);
  const points = evaluated.reduce((acc, w) => {
    if (w.status === 'accurate') return acc + 1;
    if (w.status === 'close') return acc + 0.65;
    if (w.status === 'extra') return acc + 0.3;
    return acc;
  }, 0);

  const accuracyScore = spokenTokens.length === 0 ? 0 : Math.min(100, Math.round((points / totalEvaluated) * 100));

  const mispronouncedCount = aligned.filter(
    w => w.status === 'mispronounced' || (w.status === 'missing' && w.spokenWord === '')
  ).length;
  const closeCount = aligned.filter(w => w.status === 'close' && w.spokenWord !== '').length;

  let summaryPt = 'Fale em inglês no microfone para comparar sua pronúncia em tempo real com a da IA.';
  if (spokenTokens.length > 0) {
    if (mispronouncedCount === 0 && closeCount === 0) {
      summaryPt = 'Pronúncia excelente! Todas as palavras faladas estão alinhadas com a pronúncia nativa da IA.';
    } else if (mispronouncedCount === 0) {
      summaryPt = `Muito bom! Apenas ${closeCount} palavra(s) com leve variação de sotaque destacada(s) em âmbar.`;
    } else {
      summaryPt = `Identificamos ${mispronouncedCount} palavra(s) com pronúncia divergente em vermelho. Clique em qualquer palavra destacada para ouvir a IA e ver a dica.`;
    }
  }

  return {
    targetText,
    spokenText,
    accuracyScore,
    words: aligned,
    summaryPt,
  };
}
