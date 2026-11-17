import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

const router = express.Router();

// Initialize GoogleGenAI server-side with required User-Agent
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. Interactive Mentor Chat Endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { 
      message, 
      history = [], 
      persona = 'pastor_and_tech', 
      level = 'beginner',
      focus = 'mixed', // 'worship' | 'tech' | 'mixed'
      interactionCount = 0
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const ai = getAIClient();
    const turnNumber = Math.max(0, Number(interactionCount) || 0);

    let personaInstruction = '';
    if (persona === 'pastor_david') {
      personaInstruction = `Você é o Pastor David, um mentor carinhoso, fluente e encorajador que guia o aluno passo a passo até a fluência em inglês através de louvores cristãos evangélicos (worship music) e vida cristã. Você fala em português do Brasil acolhedor para guiar a jornada e ensina o inglês correspondente com paciência.`;
    } else if (persona === 'sarah_tech') {
      personaInstruction = `Você é a Sarah, Senior Tech Lead e Especialista em Machine Learning / Data Science no Vale do Silício. Você guia profissionais brasileiros passo a passo até a fluência técnica em inglês (daily standups, entrevistas técnicas, code reviews, termos de dados). Você é dinâmica, prática e muito clara.`;
    } else if (persona === 'jake_buddy') {
      personaInstruction = `Você é o Jake, um amigo nova-iorquino super gente boa que guia o aluno no inglês do dia a dia (pedir comida, compras, direções, gírias e conversação natural).`;
    } else if (persona === 'emma_british') {
      personaInstruction = `Você é a Emma Watson-Smith, mentora britânica elegante de pronúncia e polidez. Você ensina cada som e fonética com calma para brasileiros destravarem o ritmo correto da língua.`;
    } else {
      personaInstruction = `Você é o Mentor Faith & Tech Purpose Talk. Você guia o aluno em sua jornada de aprendizado do zero até a fluência, unindo inglês técnico para carreira e adoração através de louvores.`;
    }

    let beginnerRuleInstruction = '';
    if (level === 'beginner') {
      if (turnNumber <= 2) {
        beginnerRuleInstruction = `
REGRA CRÍTICA PARA INICIANTES (PRIMEIRAS INTERAÇÕES - TURNO ${turnNumber}):
- O aluno é INICIANTE e está nas primeiras interações. O aplicativo DEVE ser extremamente acolhedor!
- Escreva o campo "replyEn" PRINCIPALMENTE EM PORTUGUÊS DO BRASIL caloroso (85% português e apenas 15% inglês), celebrando qualquer tentativa mesmo que o aluno tenha escrito tudo em português.
- Introduza APENAS 1 ou 2 expressões curtinhas e fáceis em inglês no meio da fala em português, sempre trazendo a tradução e como se lê (ex: '"Good morning" (lê-se: Gud mór-nin, que significa Bom dia)').
- No campo "followUpQuestionEn", faça uma pergunta gentil em português com apenas 1 palavra ou micro-frase em inglês para o aluno experimentar se quiser.
- No campo "pronunciationCoach.targetPhrase", coloque exatamente essa micro-frase em inglês (2 a 4 palavras) para ele praticar o áudio em inglês.`;
      } else if (turnNumber <= 5) {
        beginnerRuleInstruction = `
REGRA DE PROGRESSÃO SUAVE PARA INICIANTES (TURNO ${turnNumber}):
- Agora o aluno já deu os primeiros passos! Misture cerca de 65% de Português do Brasil acolhedor com 35% de frases bem curtas e simples em inglês no campo "replyEn".
- Toda frase em inglês inserida deve ser imediatamente compreensível ou traduzida no "replyPt".
- Mantenha "mentorGuidancePt" 100% em português do Brasil elogiando a evolução gradual dele.`;
      } else {
        beginnerRuleInstruction = `
REGRA DE IMERSÃO GRADUAL PARA INICIANTES (TURNO ${turnNumber}):
- O aluno já completou várias interações! Agora use cerca de 50% de inglês simples e natural com 50% de apoio em português, sempre oferecendo a tradução clara em "replyPt".`;
      }
    }

    const systemInstruction = `${personaInstruction}
${beginnerRuleInstruction}
DIRETRIZES FUNDAMENTAIS OBRIGATÓRIAS:
1. INICIE SEMPRE EM PORTUGUÊS DO BRASIL ("mentorGuidancePt"):
   - Toda interação, acolhimento, explicação didática e condução deve começar em português do Brasil claro, encorajador e amigável.
   - Vá guiando o usuário passo a passo na sua jornada até a fluência, dizendo o que estamos praticando agora e por que isso o aproxima de falar inglês com naturalidade.
2. CONTEÚDO PRINCIPAL ("replyEn"):
   - Para iniciantes nas primeiras interações (turnos 0 a 2), siga RIGOROSAMENTE a regra de responder majoritariamente em português acolhedor apresentando apenas 1 ou 2 expressões simples em inglês.
   - Para níveis intermediário e avançado, responda com a conversa natural em inglês adaptada ao nível ${level}.
   - Se o usuário pediu para pular (skip), acolha com gentileza em português ("Sem problemas! Vamos pular para a próxima etapa da sua jornada.") e passe para o próximo desafio imediatamente sem penalizar a nota.
3. ENSINE A PRONÚNCIA CORRETA ("pronunciationCoach"):
   - Ensine detalhadamente como pronunciar os sons que brasileiros costumam errar (ex: som do "th", terminação em consoantes mudas sem colocar som de 'i' no final, "-ed" passado, ritmo e linking sounds).
   - "phoneticEasy": Fonética facilitada que um brasileiro lê e pronuncia perfeitamente (ex: "KÓV-e-nant", "THRU-put", "UÉI MEI-ker").
   - "mouthPositionPt": Dica anatômica de onde posicionar a língua ou lábios para acertar o som.
4. MESCLE COM ESCRITA ("writingDrill"):
   - Um pequeno exercício complementar de escrita ou reflexão opcional para fixar a estrutura e a grafia das palavras.
5. OPÇÃO DE PULAR ("canSkip"):
   - Sempre forneça a opção clara de pular este exercício caso o usuário queira seguir direto para outro tema.

Retorne RIGOROSAMENTE no formato JSON:
{
  "mentorGuidancePt": "Sua orientação inicial acolhedora em português do Brasil guiando a jornada do aluno...",
  "replyEn": "Mensagem principal do mentor (acolhedora em português + primeiras palavras em inglês para iniciantes nos turnos iniciais; ou inglês natural para níveis mais altos)...",
  "replyPt": "Tradução completa ou resumo claro em português para consulta...",
  "score": 88,
  "userFeedback": {
    "isPerfect": false,
    "betterVersion": "Como um nativo falaria essa frase em inglês",
    "explanationPt": "Explicação gramatical didática e gentil em português",
    "grammarPoints": ["Ponto 1", "Ponto 2"]
  },
  "pronunciationCoach": {
    "targetPhrase": "Palavra ou frase curta em inglês para treinar pronúncia",
    "phoneticEasy": "Pronúncia facilitada para brasileiros (ex: 'THRU-put')",
    "mouthPositionPt": "Como posicionar a boca/língua para o som correto",
    "commonPitfallPt": "Erro comum de brasileiros nesta palavra"
  },
  "writingDrill": {
    "promptPt": "Mini-desafio opcional de escrita para mesclar fala com escrita",
    "suggestedAnswerEn": "Modelo correto de escrita"
  },
  "vocabulary": [
    { "term": "grace", "meaning": "graça / favor imerecido", "example": "By grace we are saved." }
  ],
  "followUpQuestionEn": "Pergunta gentil de acompanhamento (em português com toque de inglês para iniciantes, ou inglês para intermediário/avançado)",
  "stepInJourney": "Etapa atual da jornada (ex: 'Etapa 1: Acolhimento em Português')"
}`;

    // Format conversation history for context
    const formattedHistory = (history || []).slice(-8).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || msg.text || '' }]
    }));

    // Add current user message
    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: `Mensagem do aluno (nível ${level}, interação #${turnNumber}): "${message}". Responda em JSON conforme especificado.` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: contents as any,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = {
        replyEn: rawText,
        replyPt: "Aqui está sua resposta.",
        score: 85,
        userFeedback: {
          isPerfect: true,
          betterVersion: message,
          explanationPt: "Bom trabalho! Continue praticando.",
          grammarPoints: [],
          pronunciationTip: "Mantenha o ritmo natural."
        },
        vocabulary: [],
        followUpQuestionEn: "Tell me more about your experience!"
      };
    }

    res.json({
      ...data,
      replyLang: level === 'beginner' && turnNumber <= 2 ? 'pt-BR' : 'en-US',
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Falha ao processar mensagem do mentor.' });
  }
});

// 2. Song Breakdown & Lyric Analyzer Endpoint
router.post('/analyze-song', async (req: Request, res: Response) => {
  try {
    const { songTitle, artist, lyrics } = req.body;

    if (!songTitle && !lyrics) {
      return res.status(400).json({ error: 'Título da música ou letra são obrigatórios.' });
    }

    const ai = getAIClient();

    const systemInstruction = `Você é um mentor especialista em inglês e louvores evangélicos internacionais (Hillsong, Bethel, Elevation, Maverick City, Chris Tomlin, etc.).
Analise o louvor solicitado para um aluno brasileiro que quer aprender o SIGNIFICADO, a PRONÚNCIA FALADA e a PRONÚNCIA CANTADA dessa canção.
Forneça explicações super acolhedoras em português do Brasil:
1. Título em português ("titlePt"), nível sugerido ("beginner" ou "intermediate"), tema curto ("themeTagPt"), resumo espiritual e versículo bíblico base.
2. Análise por seção (Verse 1, Chorus, Bridge):
   - Trecho em inglês ("english")
   - Significado / tradução poética em português ("portuguese")
   - Explicação gramatical simples ("grammarHighlight")
   - Pronúncia FALADA: "spokenPhoneticEasy" (como um brasileiro lê falando pausado) e "spokenTipPt" (dica prática para falar)
   - Pronúncia CANTADA: "sungPhoneticFlow" (divisão rítmica com vogais alongadas e ligações, usando "♩" para marcar pausas musicais) e "sungTipPt" (dica de ligaduras musicais, respiro e vogais sustentadas no canto)
3. Lista dos 4-5 vocabulários-chave com IPA e significado.
4. Pergunta acolhedora de reflexão.

Retorne em formato JSON estrito:
{
  "title": "${songTitle || 'Louvor'}",
  "titlePt": "Tradução acolhedora do título em português",
  "artist": "${artist || 'Worship Artist'}",
  "level": "beginner",
  "themeTagPt": "Tema curto (ex: Graça & Fé)",
  "spiritualTheme": "Resumo bíblico e mensagem central em português",
  "keyBiblicalVerse": "Versículo bíblico em inglês com tradução correlata",
  "sections": [
    {
      "type": "Verse 1 / Chorus / Bridge",
      "english": "Linhas em inglês...",
      "portuguese": "Significado fiel em português...",
      "keyVocab": ["palavra1", "palavra2"],
      "grammarHighlight": "Destaque de gramática em português simples",
      "pronunciationTip": "Dica geral de pronúncia",
      "spokenPhoneticEasy": "Como um brasileiro lê falando pausado...",
      "spokenTipPt": "Dica de pronúncia falada no dia a dia...",
      "sungPhoneticFlow": "Como cantar ligando as palavras com ♩ entre respirações...",
      "sungTipPt": "Dica específica de canto: vogais longas, ligações e fluência musical..."
    }
  ],
  "topVocabulary": [
    { "word": "faithfulness", "phonetic": "/ˈfeɪθ.fəl.nəs/", "meaning": "fidelidade", "biblicalContext": "Constância do amor de Deus" }
  ],
  "conversationPrompt": {
    "questionEn": "Pergunta simples em inglês sobre a música",
    "questionPt": "Tradução em português da pergunta",
    "suggestedAnswerTemplate": "I feel grateful when I listen to this because..."
  }
}`;

    const promptText = songTitle 
      ? `Analise o louvor evangélico "${songTitle}"${artist ? ` do artista/ministério ${artist}` : ''}.${lyrics ? ` Letra fornecida: \n${lyrics}` : ''}`
      : `Analise a seguinte letra de louvor evangélico:\n${lyrics}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/analyze-song:', error);
    res.status(500).json({ error: error.message || 'Falha ao analisar louvor.' });
  }
});

// 3. Tech Scenario Drill & Interview Simulation Endpoint
router.post('/tech-drill', async (req: Request, res: Response) => {
  try {
    const { scenarioType, userResponse, topic } = req.body;
    // scenarioType: 'daily_standup' | 'job_interview' | 'code_review' | 'data_science_pitch' | 'system_design'

    const ai = getAIClient();

    const systemInstruction = `Você é um Staff Engineer e Hiring Manager americano de grandes empresas de tecnologia (Tech / Data Science).
Você está avaliando ou conduzindo um treino de conversação técnica em inglês para um profissional brasileiro de tecnologia/ciência de dados.

Se o usuário enviou uma resposta (userResponse):
Avalie a resposta técnica dele em inglês:
- Claridade, terminologia técnica correta (ex: latency, throughput, overfitting, deployment, pipeline, trade-offs).
- Gramática e naturalidade ("Como um engenheiro sênior no Vale do Silício falaria").
- Pontos fortes e pontos a melhorar com explicações em português.
- Exemplo de resposta nota 10 (STAR method ou formato executivo).

Se for para gerar um novo desafio (userResponse vazio ou null):
Crie um cenário realista de tecnologia (ex: standup blocker, pergunta de entrevista sobre SQL/Machine Learning, discussão de PR conflituoso).

Retorne em formato JSON estrito:
{
  "scenarioTitle": "Título do Cenário",
  "scenarioContextEn": "Descrição da situação em inglês",
  "scenarioContextPt": "Descrição da situação em português",
  "promptQuestionEn": "O que o usuário deve responder/falar em inglês",
  "evaluation": {
    "score": 90,
    "technicalFluency": "Excelente uso de termos de ML/Cloud",
    "betterVersion": "Versão mais impactante e concisa",
    "feedbackPt": "Feedback detalhado em português",
    "recommendedKeywords": ["trade-off", "bottleneck", "reproducibility"]
  },
  "sampleAnswerEn": "Modelo de resposta sênior em inglês"
}`;

    const promptText = userResponse 
      ? `Avalie a seguinte resposta do aluno para o cenário de tecnologia '${scenarioType}' (tópico: ${topic || 'Geral'}): "${userResponse}"`
      : `Gere um cenário interativo desafiador e prático de tecnologia para a categoria '${scenarioType}' (tópico: ${topic || 'Tech & Data Science'}).`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/tech-drill:', error);
    res.status(500).json({ error: error.message || 'Falha ao processar treino de tecnologia.' });
  }
});

// 4. Interactive Quiz Generator (Gospel English + Tech English)
router.post('/quiz', async (req: Request, res: Response) => {
  try {
    const { category = 'mixed', count = 4, difficulty = 'intermediate' } = req.body;
    // category: 'worship' | 'tech' | 'mixed' | 'false_friends'

    const ai = getAIClient();

    const systemInstruction = `Você é um criador de quizzes dinâmicos para brasileiros aprendendo inglês focado em Louvores Evangélicos (Christian Worship) e Mercado de Tecnologia (Tech & Data Science).
Gere ${count} perguntas de alta qualidade, variadas entre:
- Identificar phrasal verbs de tech ou termos bíblicos de louvor
- Preposições certas (in/on/at/with) em contextos reais
- Falsos cognatos comuns em tecnologia e conversação
- Compreensão auditiva/frasal de letras famosas (Way Maker, Goodness of God, Oceans, etc.)

Retorne em formato JSON estrito:
{
  "category": "${category}",
  "questions": [
    {
      "id": 1,
      "tag": "Tech Standup" ou "Worship Lyric" ou "Grammar",
      "questionEn": "Pergunta ou frase para preencher a lacuna em inglês",
      "questionPt": "Tradução/contexto da pergunta",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 0,
      "explanationPt": "Por que esta é a correta, com dicas de gramática e uso real",
      "audioPhrase": "Frase para ser falada em áudio"
    }
  ]
}`;

    const prompt = `Gere ${count} perguntas interativas da categoria ${category} no nível ${difficulty}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{"questions":[]}';
    const data = JSON.parse(rawText);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/quiz:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar quiz.' });
  }
});

// 5. Daily Everyday Roleplay Simulator Endpoint
router.post('/roleplay', async (req: Request, res: Response) => {
  try {
    const {
      scenarioId,
      scenarioTitle,
      characterRole,
      goals = [],
      message,
      history = [],
      userLevel = 'beginner',
      interactionCount = 0
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const ai = getAIClient();
    const turnNumber = Math.max(0, Number(interactionCount) || 0);

    let roleplayBeginnerRule = '';
    if (userLevel === 'beginner') {
      if (turnNumber <= 2) {
        roleplayBeginnerRule = `
REGRA ACOLHEDORA PARA INICIANTE (TURNO ${turnNumber}):
- O aluno é iniciante nas primeiras interações. Mantenha "mentorGuidancePt" e "inCharacterReplyPt" extremamente acolhedores em português do Brasil.
- No campo "inCharacterReplyEn", fale em português carinhoso misturando APENAS 1 frase curtinha em inglês com tradução entre parênteses (ex: "Que bom te atender! Em inglês dizemos: 'How can I help you?' (Como posso te ajudar?)") para o aluno não se assustar e ir absorvendo aos poucos.
- As "suggestedUserResponses" devem ser micro-frases de 2 a 4 palavras fáceis com a tradução ao lado.`;
      } else if (turnNumber <= 5) {
        roleplayBeginnerRule = `
REGRA PROGRESSIVA PARA INICIANTE (TURNO ${turnNumber}):
- Misture frases simples em inglês com apoio imediato em português e tradução clara em "inCharacterReplyPt".`;
      }
    }

    const systemInstruction = `Você é um simulador de conversação realista em inglês e coach para brasileiros.
Cenário Atual: "${scenarioTitle || 'Cenário Cotidiano'}"
Seu Papel no Cenário: "${characterRole || 'Interlocutor Nativo'}"
Nível do Aluno: ${userLevel}
Metas da Conversa: ${JSON.stringify(goals)}
${roleplayBeginnerRule}

DIRETRIZES DA JORNADA:
1. Comece orientando o aluno em PORTUGUÊS DO BRASIL ("mentorGuidancePt"):
   - Dê o contexto em português, acolha, diga qual o objetivo imediato de fala para a fluência dele.
   - Se o usuário pediu para pular (skip), responda com empatia em português ("Sem problemas! Vamos avançar para a próxima etapa da cena...") e continue a interação.
2. Responda dentro do personagem em inglês ("inCharacterReplyEn") e forneça a tradução em português ("inCharacterReplyPt").
3. Avalie detalhadamente a pronúncia e a gramática:
   - "pronunciationTips": 1 a 3 dicas práticas focadas em vícios de pronúncia de brasileiros.
   - "phoneticSpelling": Transcrição fonética facilitada que um brasileiro entenda sem complicação.
   - "writingDrill": Mini-exercício de escrita complementar para mesclar fala com escrita.
4. "canSkip": Sempre permita ao aluno pular para o próximo passo.

Retorne em formato JSON estrito:
{
  "mentorGuidancePt": "Orientação do mentor em português do Brasil guiando a cena...",
  "inCharacterReplyEn": "Resposta do personagem em inglês...",
  "inCharacterReplyPt": "Tradução em português da resposta...",
  "score": 88,
  "userFeedback": {
    "isNatural": true,
    "betterVersion": "Frase refinada como um nativo diria",
    "grammarExplanationPt": "Explicação gramatical clara em português",
    "pronunciationTips": [
      "Dica 1 de pronúncia para brasileiros",
      "Dica 2 de linking ou entonação"
    ],
    "phoneticSpelling": "Fonética facilitada (ex: 'KUD AI PLIIZ GET')",
    "politenessTipPt": "Dica cultural de polidez"
  },
  "writingDrill": {
    "promptPt": "Desafio opcional de escrita para fixar este momento da conversa",
    "suggestedAnswerEn": "Modelo de resposta escrita"
  },
  "completedGoals": ["Meta cumprida se houver"],
  "suggestedUserResponses": [
    "Opção 1 de resposta em inglês que o aluno pode falar",
    "Opção 2 de resposta alternativa"
  ]
}`;

    // Format history
    const formattedHistory = (history || []).slice(-8).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || msg.text || '' }]
    }));

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: `Mensagem falada pelo aluno (nível ${userLevel}, interação #${turnNumber}): "${message}". Responda em JSON rigoroso.` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: contents as any,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = {
        inCharacterReplyEn: rawText,
        inCharacterReplyPt: "Aqui está a resposta do atendente.",
        score: 85,
        userFeedback: {
          isNatural: true,
          betterVersion: message,
          grammarExplanationPt: "Boa frase! Mantenha a clareza e ritmo.",
          pronunciationTips: ["Preste atenção na terminação das palavras em consoante."],
          phoneticSpelling: "",
          politenessTipPt: "Lembre-se de sempre agradecer com 'Thank you so much!'"
        },
        completedGoals: [],
        suggestedUserResponses: ["Thank you! Could you also help me with..."]
      };
    }

    res.json({
      ...data,
      replyLang: userLevel === 'beginner' && turnNumber <= 2 ? 'pt-BR' : 'en-US',
    });
  } catch (error: any) {
    console.error('Error in /api/roleplay:', error);
    res.status(500).json({ error: error.message || 'Falha ao processar simulação de conversação cotidiana.' });
  }
});

// 6. Real-Time Speech-to-Text Pronunciation Analysis Endpoint
router.post('/analyze-pronunciation', async (req: Request, res: Response) => {
  try {
    const {
      spokenText,
      targetText = '',
      confidence = 0.85,
      userLevel = 'intermediate',
      accent = 'en-US',
    } = req.body;

    if (!spokenText || typeof spokenText !== 'string') {
      return res.status(400).json({ error: 'Texto falado (spokenText) é obrigatório.' });
    }

    const ai = getAIClient();

    const systemInstruction = `Você é um foneticista e coach de pronúncia de inglês especialista em ajudar falantes de Português do Brasil (${userLevel}, sotaque alvo: ${accent}).
Analise a transcrição captada pelo reconhecimento de voz (Speech-to-Text) do aluno ("spokenText") em comparação com a frase/pronúncia ideal da IA ("targetText").
Se "targetText" estiver vazio (conversa livre), primeiro deduza a frase natural exata que o aluno tentou falar em inglês (corrigindo palavras mal reconhecidas pelo microfone devido a pronúncia brasileira, como "tree"->"three", "dis"->"this", "work it"->"worked", "greici"->"grace", etc.) e use essa frase natural como "targetText".

Para CADA palavra da frase alvo, avalie e classifique:
- "status": "accurate" (pronúncia precisa), "close" (leve variação de sotaque/confiança média), "mispronounced" (palavra trocada, distorcida ou difícil para brasileiros que falhou no STT) ou "missing" (palavra omitida).
- "phoneticEasy": guia fonético intuitivo que um brasileiro lê imediatamente (ex: "THRU-put", "FÊITH-ful", "di-PLÓID").
- "ipa": transcrição IPA padrão.
- "tipPt": dica anatômica curta em Português do Brasil de onde posicionar língua, dentes ou lábios para acertar a pronúncia igual à IA.

Retorne RIGOROSAMENTE neste formato JSON:
{
  "targetText": "Frase exata com a pronúncia ideal da IA",
  "spokenText": "${spokenText}",
  "accuracyScore": 84,
  "summaryPt": "Resumo acolhedor em português do Brasil explicando os pontos fortes e o que ajustar.",
  "words": [
    {
      "id": "w-0",
      "expectedWord": "throughput",
      "spokenWord": "throughout",
      "status": "mispronounced",
      "confidence": 0.62,
      "phoneticEasy": "THRU-put",
      "ipa": "/ˈθruː.pʊt/",
      "tipPt": "Termine em T seco sem som de 'i', mantendo o som soprado no TH inicial."
    }
  ]
}`;

    const promptText = targetText
      ? `Frase alvo da IA: "${targetText}"\nTexto captado pelo microfone do aluno: "${spokenText}"\nConfiança média do reconhecimento de voz: ${Math.round(Number(confidence) * 100)}%`
      : `Modo conversa livre.\nTexto captado pelo microfone do aluno: "${spokenText}"\nConfiança média do reconhecimento de voz: ${Math.round(Number(confidence) * 100)}%`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    res.json({ ...data, aiEnriched: true });
  } catch (error: any) {
    console.error('Error in /api/analyze-pronunciation:', error);
    res.status(500).json({ error: error.message || 'Falha ao analisar pronúncia.' });
  }
});

// 7. Billing & Payment Gateway Routes (Mercado Pago Recommended + Stripe Alternative)
const PLANS_CATALOG: Record<
  string,
  { id: string; name: string; priceBrlCents: number; billingCycle: 'monthly' | 'annual'; frequency: number; frequencyType: 'months' }
> = {
  essencial_mensal: {
    id: 'essencial_mensal',
    name: 'Essencial Mensal',
    priceBrlCents: 3990,
    billingCycle: 'monthly',
    frequency: 1,
    frequencyType: 'months',
  },
  pro_mensal: {
    id: 'pro_mensal',
    name: 'Purpose Pro Mensal',
    priceBrlCents: 5990,
    billingCycle: 'monthly',
    frequency: 1,
    frequencyType: 'months',
  },
  pro_anual: {
    id: 'pro_anual',
    name: 'Purpose Pro Anual',
    priceBrlCents: 47880,
    billingCycle: 'annual',
    frequency: 12,
    frequencyType: 'months',
  },
};

function resolveAppUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured !== 'MY_APP_URL') {
    return configured.replace(/\/$/, '');
  }
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const host = forwardedHost || req.get('host');
  if (!host) return 'http://localhost:3000';
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/$/, '');
}

router.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'purpose-talk-api',
    appUrl: resolveAppUrl(req),
    timestamp: new Date().toISOString(),
  });
});

router.get('/billing/config', (req: Request, res: Response) => {
  const mpConfigured = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  const mpWebhookSecretConfigured = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);
  const mpPublicKeyConfigured = Boolean(process.env.VITE_MERCADOPAGO_PUBLIC_KEY);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const appUrl = resolveAppUrl(req);

  res.json({
    recommendedGateway: 'mercadopago',
    gateways: {
      mercadopago: {
        configured: mpConfigured,
        webhookSecretConfigured: mpWebhookSecretConfigured,
        publicKeyConfigured: mpPublicKeyConfigured,
        label: 'Mercado Pago (Recomendado Brasil)',
        supportsPix: true,
        supportsCards: true,
        supports7DayTrial: true,
        payoutDestination: 'Conta Mercado Pago / Chave PIX ou Conta Bancária vinculada no painel do criador',
        webhookUrl: `${appUrl}/api/billing/webhook/mercadopago`,
      },
      stripe: {
        configured: stripeConfigured,
        label: 'Stripe Billing (Global)',
        supportsPix: false,
        supportsCards: true,
        supports7DayTrial: true,
        payoutDestination: 'Conta Bancária vinculada no painel Stripe',
        webhookUrl: `${appUrl}/api/billing/webhook/stripe`,
      },
    },
    trialDays: 7,
    plans: Object.values(PLANS_CATALOG),
  });
});

// Verify Mercado Pago seller credentials & mode safely on the server
router.get('/billing/mercadopago/verify', async (req: Request, res: Response) => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecretConfigured = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);
  const publicKeyConfigured = Boolean(process.env.VITE_MERCADOPAGO_PUBLIC_KEY);
  const webhookUrl = `${resolveAppUrl(req)}/api/billing/webhook/mercadopago`;

  if (!token) {
    return res.json({
      configured: false,
      mode: 'not_configured',
      webhookUrl,
      webhookSecretConfigured,
      publicKeyConfigured,
      account: null,
      message: 'Defina MERCADOPAGO_ACCESS_TOKEN nas variáveis de ambiente do servidor para conectar sua aplicação Mercado Pago.',
    });
  }

  try {
    const mpRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const mpUser: any = await mpRes.json().catch(() => ({}));

    if (!mpRes.ok) {
      return res.status(200).json({
        configured: true,
        valid: false,
        mode: token.startsWith('TEST-') ? 'sandbox' : 'live',
        webhookUrl,
        webhookSecretConfigured,
        publicKeyConfigured,
        account: null,
        error: mpUser?.message || 'Access Token rejeitado pelo Mercado Pago.',
      });
    }

    const isSandbox = token.startsWith('TEST-') || Boolean(mpUser?.tags?.includes('test_user'));
    return res.json({
      configured: true,
      valid: true,
      mode: isSandbox ? 'sandbox' : 'live',
      webhookUrl,
      webhookSecretConfigured,
      publicKeyConfigured,
      account: {
        id: mpUser.id,
        nickname: mpUser.nickname || 'Conta Mercado Pago',
        email: mpUser.email || null,
        siteId: mpUser.site_id || 'MLB',
      },
    });
  } catch (err: any) {
    return res.status(200).json({
      configured: true,
      valid: false,
      mode: token.startsWith('TEST-') ? 'sandbox' : 'live',
      webhookUrl,
      webhookSecretConfigured,
      publicKeyConfigured,
      account: null,
      error: err?.message || 'Erro de rede ao consultar Mercado Pago.',
    });
  }
});

router.post('/billing/create-subscription', async (req: Request, res: Response) => {
  try {
    const {
      planId,
      userEmail,
      userId,
      preferredGateway = 'mercadopago',
      paymentMethodLabel,
    } = req.body || {};

    const plan = PLANS_CATALOG[String(planId || '')];
    if (!plan) {
      return res.status(400).json({ error: 'Plano selecionado é inválido.' });
    }
    if (!paymentMethodLabel || typeof paymentMethodLabel !== 'string') {
      return res.status(400).json({ error: 'É obrigatório cadastrar uma forma de pagamento para iniciar os 7 dias grátis.' });
    }

    const gateway = preferredGateway === 'stripe' ? 'stripe' : 'mercadopago';
    const appUrl = resolveAppUrl(req);

    // Real Mercado Pago Preapproval API call if token is configured
    if (gateway === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const mpBody: Record<string, unknown> = {
        reason: `Purpose Talk — ${plan.name} (7 dias grátis)`,
        external_reference: userId || 'guest',
        payer_email: userEmail || undefined,
        auto_recurring: {
          frequency: plan.frequency,
          frequency_type: plan.frequencyType,
          transaction_amount: Number((plan.priceBrlCents / 100).toFixed(2)),
          currency_id: 'BRL',
          free_trial: {
            frequency: 7,
            frequency_type: 'days',
          },
        },
        back_url: `${appUrl}/?page=app&billing=success`,
        status: 'pending',
      };

      if (appUrl.startsWith('https://')) {
        mpBody.notification_url = `${appUrl}/api/billing/webhook/mercadopago`;
      }

      const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mpBody),
      });

      const mpData: any = await mpResponse.json();
      if (!mpResponse.ok) {
        return res.status(400).json({
          error: mpData?.message || 'Erro ao criar assinatura no Mercado Pago.',
        });
      }

      const isSandbox = process.env.MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-');
      return res.json({
        mode: isSandbox ? 'sandbox' : 'live',
        gateway: 'mercadopago',
        gatewaySubscriptionId: String(mpData.id || ''),
        checkoutUrl: (isSandbox ? mpData.sandbox_init_point : null) || mpData.init_point || null,
        status: 'trialing',
        trialDays: 7,
      });
    }

    // Real Stripe Checkout Session (with 7-day trial) if Stripe key is configured
    if (gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      const params = new URLSearchParams();
      params.append('mode', 'subscription');
      params.append('success_url', `${appUrl}/?page=app&billing=success`);
      params.append('cancel_url', `${appUrl}/?page=app&billing=canceled`);
      if (userEmail) params.append('customer_email', String(userEmail));
      if (userId) params.append('client_reference_id', String(userId));
      params.append('subscription_data[trial_period_days]', '7');
      params.append('line_items[0][quantity]', '1');
      params.append('line_items[0][price_data][currency]', 'brl');
      params.append('line_items[0][price_data][unit_amount]', String(plan.priceBrlCents));
      params.append(
        'line_items[0][price_data][recurring][interval]',
        plan.billingCycle === 'annual' ? 'year' : 'month'
      );
      params.append('line_items[0][price_data][product_data][name]', `Purpose Talk — ${plan.name}`);

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const stripeData: any = await stripeResponse.json();
      if (!stripeResponse.ok) {
        return res.status(400).json({
          error: stripeData?.error?.message || 'Erro ao criar sessão no Stripe.',
        });
      }

      return res.json({
        mode: 'live',
        gateway: 'stripe',
        gatewaySubscriptionId: String(stripeData.id || ''),
        checkoutUrl: stripeData.url || null,
        status: 'trialing',
        trialDays: 7,
      });
    }

    // Sandbox / Pre-gateway-key readiness mode: validates & prepares trial state cleanly
    return res.json({
      mode: 'trial_ready',
      gateway,
      gatewaySubscriptionId: `trial_${gateway}_${Date.now()}`,
      checkoutUrl: null,
      status: 'trialing',
      trialDays: 7,
      message: 'Período de 7 dias grátis ativado. Configure o token do gateway no servidor para cobrança automática ao final do trial.',
    });
  } catch (error: any) {
    console.error('Error in /api/billing/create-subscription:', error);
    res.status(500).json({ error: error.message || 'Falha ao iniciar assinatura.' });
  }
});

const handleCancelSubscriptionRoute = async (req: Request, res: Response) => {
  try {
    const {
      gateway = 'mercadopago',
      gatewaySubscriptionId = '',
      preapprovalPlanId = '',
      cancelScope = 'preapproval',
      userId = '',
    } = req.body || {};

    const cleanGateway = gateway === 'stripe' ? 'stripe' : 'mercadopago';
    const cleanSubId = String(gatewaySubscriptionId || '').trim();
    const cleanPlanId = String(preapprovalPlanId || '').trim();
    const isRealSubId = Boolean(cleanSubId && !cleanSubId.startsWith('trial_'));

    if (
      cleanGateway === 'mercadopago' &&
      process.env.MERCADOPAGO_ACCESS_TOKEN &&
      (isRealSubId || cleanPlanId)
    ) {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

      // Cancelamento de Preaprovação (/preapproval/{id}) ou Plano (/preapproval_plan/{id})
      const targetEndpoint =
        cancelScope === 'preapproval_plan' || (!isRealSubId && cleanPlanId)
          ? `https://api.mercadopago.com/preapproval_plan/${encodeURIComponent(cleanPlanId || cleanSubId)}`
          : `https://api.mercadopago.com/preapproval/${encodeURIComponent(cleanSubId)}`;

      let mpResponse = await fetch(targetEndpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      let mpData: any = await mpResponse.json().catch(() => ({}));

      // Fallback automático para cancelamento de plano se o ID pertencer a preapproval_plan
      if (!mpResponse.ok && isRealSubId && cancelScope !== 'preapproval_plan') {
        const planFallbackRes = await fetch(
          `https://api.mercadopago.com/preapproval_plan/${encodeURIComponent(cleanPlanId || cleanSubId)}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' }),
          }
        );
        if (planFallbackRes.ok) {
          mpResponse = planFallbackRes;
          mpData = await planFallbackRes.json().catch(() => ({}));
        }
      }

      if (!mpResponse.ok) {
        return res.status(400).json({
          error:
            mpData?.message ||
            'Não foi possível cancelar a preaprovação ou plano na API do Mercado Pago.',
        });
      }

      return res.json({
        ok: true,
        mode: 'live',
        gateway: 'mercadopago',
        gatewaySubscriptionId: cleanSubId || cleanPlanId,
        gatewayStatus: mpData?.status || 'cancelled',
        status: 'canceled',
        userId: userId || null,
        message:
          'Preaprovação cancelada diretamente na API do Mercado Pago. Nenhuma cobrança futura será realizada.',
      });
    }

    if (
      cleanGateway === 'stripe' &&
      process.env.STRIPE_SECRET_KEY &&
      isRealSubId
    ) {
      const params = new URLSearchParams();
      params.append('cancel_at_period_end', 'true');

      const stripeResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(cleanSubId)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const stripeData: any = await stripeResponse.json().catch(() => ({}));
      if (!stripeResponse.ok) {
        return res.status(400).json({
          error:
            stripeData?.error?.message ||
            'Não foi possível agendar o cancelamento no Stripe.',
        });
      }

      return res.json({
        ok: true,
        mode: 'live',
        gateway: 'stripe',
        gatewaySubscriptionId: cleanSubId,
        gatewayStatus: stripeData?.status || 'canceled',
        status: 'canceled',
        userId: userId || null,
        message: 'Cancelamento registrado no Stripe com sucesso.',
      });
    }

    return res.json({
      ok: true,
      mode: 'trial_local',
      gateway: cleanGateway,
      gatewaySubscriptionId: cleanSubId || null,
      status: 'canceled',
      userId: userId || null,
      message:
        'Assinatura cancelada com sucesso. Nenhuma cobrança futura será realizada.',
    });
  } catch (error: any) {
    console.error('Error in Mercado Pago cancel endpoint:', error);
    return res.status(500).json({
      error: error?.message || 'Erro interno ao solicitar cancelamento da assinatura.',
    });
  }
};

router.post('/billing/cancel-subscription', handleCancelSubscriptionRoute);
router.post('/billing/mercadopago/cancel', handleCancelSubscriptionRoute);

function verifyMercadoPagoSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // Optional until configured by creator

  const xSignature = req.header('x-signature') || '';
  const xRequestId = req.header('x-request-id') || '';
  if (!xSignature) return false;

  let ts = '';
  let v1 = '';
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === 'ts') ts = v;
    if (k === 'v1') v1 = v;
  }
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}

router.post('/billing/webhook/mercadopago', async (req: Request, res: Response) => {
  try {
    const eventType = String(req.body?.type || req.query?.topic || req.body?.action || 'unknown');
    const dataId = String(req.body?.data?.id || req.query?.['data.id'] || req.query?.id || '');

    if (dataId && !verifyMercadoPagoSignature(req, dataId)) {
      console.warn('Mercado Pago webhook rejected: invalid HMAC signature.');
      return res.status(401).json({ received: false, error: 'Assinatura de webhook inválida.' });
    }

    let normalizedStatus: string | null = null;
    let externalReference: string | null = null;
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (token && dataId) {
      if (eventType.includes('preapproval')) {
        const lookup = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lookup.ok) {
          const preapproval: any = await lookup.json();
          externalReference = preapproval.external_reference || null;
          const mpStatus = String(preapproval.status || '');
          normalizedStatus =
            mpStatus === 'authorized'
              ? 'active'
              : mpStatus === 'cancelled' || mpStatus === 'paused'
              ? 'canceled'
              : 'trialing';
        }
      } else if (eventType.includes('payment')) {
        const lookup = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lookup.ok) {
          const payment: any = await lookup.json();
          externalReference = payment.external_reference || null;
          const mpStatus = String(payment.status || '');
          normalizedStatus =
            mpStatus === 'approved'
              ? 'active'
              : mpStatus === 'rejected' || mpStatus === 'cancelled'
              ? 'past_due'
              : 'trialing';
        }
      }
    }

    console.log('Mercado Pago webhook processed:', {
      eventType,
      dataId,
      externalReference,
      normalizedStatus,
    });

    return res.status(200).json({
      received: true,
      gateway: 'mercadopago',
      eventType,
      dataId: dataId || null,
      externalReference,
      normalizedStatus,
    });
  } catch (err: any) {
    console.error('Error processing Mercado Pago webhook:', err);
    return res.status(500).json({ received: false, error: err?.message || 'Erro interno no webhook.' });
  }
});

router.post('/billing/webhook/stripe', (req: Request, res: Response) => {
  const eventType = req.body?.type || 'unknown';
  console.log('Stripe webhook received:', eventType);
  res.status(200).json({ received: true, gateway: 'stripe', eventType });
});

// 8. Firebase Cloud Messaging (FCM) Browser Push Notification Endpoints
router.get('/notifications/config', (_req: Request, res: Response) => {
  res.json({
    vapidConfigured: Boolean(process.env.VITE_FIREBASE_VAPID_KEY),
    serverPushConfigured: Boolean(process.env.FCM_SERVER_KEY),
    messagingSenderId: '762119788256',
    projectId: 'helical-monolith-hxq1s',
  });
});

router.post('/notifications/streak-reminder', async (req: Request, res: Response) => {
  try {
    const {
      fcmToken,
      streak = 1,
      userName = 'Aluno',
      streakAtRisk = true,
    } = req.body || {};

    const firstName = String(userName || 'Aluno').trim().split(' ')[0] || 'Aluno';
    const safeStreak = Math.max(0, Number(streak) || 0);

    const title = streakAtRisk
      ? `Purpose Talk · Proteja sua ofensiva de ${safeStreak} ${safeStreak === 1 ? 'dia' : 'dias'}!`
      : `Purpose Talk · Lembrete diário de inglês`;

    const body = streakAtRisk
      ? `${firstName}, você ainda não praticou hoje. Fale ou estude 1 frase agora para não perder sua streak!`
      : `${firstName}, sua ofensiva de ${safeStreak} dias está em dia! Que tal revisar mais 1 termo hoje?`;

    const payload = {
      title,
      body,
      url: '/',
      streak: safeStreak,
      streakAtRisk: Boolean(streakAtRisk),
    };

    const serverKey = process.env.FCM_SERVER_KEY;
    const isRealToken =
      typeof fcmToken === 'string' &&
      fcmToken.length > 24 &&
      !fcmToken.startsWith('browser_sw_');

    if (serverKey && isRealToken) {
      const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
            click_action: '/',
          },
          data: {
            url: '/',
            streak: String(safeStreak),
            streakAtRisk: String(Boolean(streakAtRisk)),
          },
        }),
      });

      const fcmData: any = await fcmRes.json().catch(() => ({}));
      if (fcmRes.ok && fcmData?.success >= 1) {
        return res.json({
          mode: 'fcm_server',
          delivered: true,
          payload,
        });
      }
    }

    return res.json({
      mode: 'client_sw_ready',
      delivered: false,
      payload,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications/streak-reminder:', error);
    res.status(500).json({ error: error.message || 'Falha ao preparar lembrete FCM.' });
  }
});

export default router;



