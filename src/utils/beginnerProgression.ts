import { UserLevel } from '../types';

export interface BeginnerStageInfo {
  stage: 1 | 2 | 3;
  labelPt: string;
  descriptionPt: string;
  englishRatioPercent: number;
}

/**
 * Computes the warm progressive bilingual stage for beginners.
 * Turn 0-2: 100% Portuguese welcoming guidance introducing 1 simple English phrase.
 * Turn 3-5: 70% Portuguese + 30% short English phrases with instant translation.
 * Turn 6+: 50% Portuguese + 50% guided English conversation.
 */
export function getBeginnerImmersionStage(
  userLevel: UserLevel,
  studentTurnsCount: number
): BeginnerStageInfo {
  if (userLevel !== 'beginner') {
    return {
      stage: 3,
      labelPt: userLevel === 'advanced' ? 'Imersão Avançada (C1)' : 'Prática Bilíngue (B1-B2)',
      descriptionPt: 'Conversação natural em inglês com feedback de pronúncia e vocabulário.',
      englishRatioPercent: userLevel === 'advanced' ? 95 : 80,
    };
  }

  if (studentTurnsCount <= 2) {
    return {
      stage: 1,
      labelPt: 'Etapa 1 · Acolhimento em Português',
      descriptionPt:
        'Conversamos em português para você se sentir à vontade e já apresentamos suas primeiras expressões em inglês.',
      englishRatioPercent: 15,
    };
  }

  if (studentTurnsCount <= 5) {
    return {
      stage: 2,
      labelPt: 'Etapa 2 · Ponte Suave para o Inglês',
      descriptionPt:
        'Mantemos as explicações em português e já encaixamos frases curtinhas em inglês com tradução imediata.',
      englishRatioPercent: 35,
    };
  }

  return {
    stage: 3,
    labelPt: 'Etapa 3 · Diálogo Bilíngue Guiado',
    descriptionPt:
      'Você já ganhou confiança! Agora misturamos metade inglês, metade português acolhedor.',
    englishRatioPercent: 55,
  };
}

export function getBeginnerAvatarGreeting(avatarId: string): {
  content: string;
  mentorGuidancePt: string;
  translationPt: string;
  starterPrompts: string[];
  targetPhrase: string;
  phoneticEasy: string;
  mouthPositionPt: string;
  commonPitfallPt: string;
  writingPromptPt: string;
  writingSuggestedEn: string;
} {
  if (avatarId === 'sarah_tech') {
    return {
      content:
        'Olá! Seja muito bem-vindo(a)! Eu sou a Sarah, especialista em Tecnologia. Se você está começando do zero, fique super tranquilo(a): nossas primeiras conversas são em português para você ganhar confiança. Hoje vamos conhecer apenas uma expressão muito usada no trabalho: "Good morning!" (lê-se: Gud mór-nin), que significa "Bom dia!". Pode me responder em português mesmo ou tentar escrever "Good morning"!',
      mentorGuidancePt:
        'Modo Acolhedor ativado: vamos começar 100% em português, sem pressa. Aos poucos vou inserindo palavras simples em inglês no seu ritmo.',
      translationPt:
        'Boas-vindas da Sarah em português apresentando sua primeira expressão: "Good morning!" (Bom dia!).',
      starterPrompts: [
        'Olá Sarah! Estou começando do zero e quero ir bem devagar',
        'Good morning! Trabalho com tecnologia e quero praticar',
        'Como se diz "Obrigado" e "Por favor" no trabalho?',
        'Quero aprender palavras simples de reuniões'
      ],
      targetPhrase: 'Good morning',
      phoneticEasy: 'Gud mór-nin',
      mouthPositionPt:
        'Deixe o som do "G" bem suave e não coloque um som forte de "i" depois do "d" em Good.',
      commonPitfallPt:
        'Evite falar "gú-di mór-nin-gui". O final de "morning" tem um "n" nasal suave, sem "g" forte.',
      writingPromptPt:
        'Escreva em português qual área de trabalho você gosta ou arrisque digitar apenas "Good morning!" abaixo.',
      writingSuggestedEn: 'Good morning! Nice to meet you.',
    };
  }

  if (avatarId === 'jake_buddy') {
    return {
      content:
        'E aí, tudo bem? Seja bem-vindo(a)! Eu sou o Jake, de Nova York. Não precisa saber inglês ainda para conversar comigo: vamos começar batendo papo em português! Nossa primeira palavrinha de hoje é super fácil: "Hello!" (lê-se: Re-lôu), que significa "Olá!". Me conta em português: como está o seu dia hoje?',
      mentorGuidancePt:
        'Sem pressão! Responda em português como se estivesse falando com um amigo. Aos poucos vamos misturando expressões fáceis do dia a dia.',
      translationPt:
        'Boas-vindas do Jake em português apresentando "Hello!" (Olá!).',
      starterPrompts: [
        'Oi Jake! Meu dia está ótimo, quero começar do zero',
        'Hello! Como eu peço um café em inglês?',
        'Me ensina a cumprimentar alguém em inglês',
        'Quero aprender frases simples de viagem'
      ],
      targetPhrase: 'Hello, how are you?',
      phoneticEasy: 'Re-lôu, ráu ár iú?',
      mouthPositionPt:
        'O "H" inicial em Hello e How tem som de "R" soprado, igual ao R de "rato" no português.',
      commonPitfallPt:
        'Não deixe o "H" mudo: diga "Re-lôu" soprando levemente o ar no início.',
      writingPromptPt:
        'Pode responder em português dizendo como você está ou tentar escrever "Hello!" para começar.',
      writingSuggestedEn: 'Hello! I am good, thank you.',
    };
  }

  if (avatarId === 'emma_british') {
    return {
      content:
        'Olá! Que alegria receber você aqui! Eu sou a Emma, de Londres. Vamos caminhar passo a passo, sempre começando em português para que você se sinta acolhido(a) e seguro(a). Hoje vamos treinar uma palavra linda e educada: "Thank you" (lê-se: Thén-kiu), que significa "Obrigado(a)". Como posso ajudar você hoje?',
      mentorGuidancePt:
        'Primeiros passos em português com suavidade: vamos construir sua base sem pressa antes de avançar para frases maiores.',
      translationPt:
        'Boas-vindas da Emma em português apresentando "Thank you" (Obrigado/a).',
      starterPrompts: [
        'Olá Emma! Quero aprender devagar começando em português',
        'Thank you! Como treino o som do TH?',
        'Quais são as palavras mais educadas do inglês?',
        'Quero praticar frases bem curtinhas para iniciantes'
      ],
      targetPhrase: 'Thank you',
      phoneticEasy: 'Thén-kiu',
      mouthPositionPt:
        'Encoste suavemente a ponta da língua entre os dentes da frente para soprar o "Th", depois fale "kiu".',
      commonPitfallPt:
        'Brasileiros costumam trocar por "Tén-kiu". Soprando com a língua entre os dentes o som fica autêntico.',
      writingPromptPt:
        'Responda em português o que gostaria de aprender primeiro ou escreva "Thank you!" para praticar.',
      writingSuggestedEn: 'Thank you! I am happy to start.',
    };
  }

  // Default: Pastor David
  return {
    content:
      'Olá, meu amigo(a)! Que bênção e alegria receber você aqui. Se você está dando os primeiros passos no inglês, sinta-se totalmente em casa: vamos conversar sempre em português no início e ir descobrindo o inglês aos pouquinhos, sem pressa e sem medo de errar. Para começar hoje, que tal uma palavra linda dos louvores? "Grace" (lê-se: Grêiss), que significa "Graça". Você gostaria de aprender com um louvor ou conversar um pouco primeiro?',
    mentorGuidancePt:
      'Primeiras interações em Português: fale ou escreva em português normalmente. A cada resposta, vamos introduzindo 1 nova expressão em inglês no seu ritmo.',
    translationPt:
      'Boas-vindas acolhedoras do Pastor David em português apresentando sua primeira palavra: "Grace" (Graça).',
    starterPrompts: [
      'Olá Pastor David! Quero começar bem devagar em português',
      'Quero aprender o significado do louvor Way Maker',
      'Grace! Como falo "Obrigado, Deus" em inglês?',
      'Como dizer "Bom dia" e "Deus te abençoe"?'
    ],
    targetPhrase: 'Grace and peace',
    phoneticEasy: 'Grêiss ænd píiss',
    mouthPositionPt:
      'Em "Grace", termine com som suave de "ss", sem colocar som de "i" no final.',
    commonPitfallPt:
      'Brasileiros tendem a dizer "grêi-ci". Segure o som final apenas no "ss" suave.',
    writingPromptPt:
      'Responda em português como você está se sentindo hoje ou digite apenas a palavra "Grace" para testar!',
    writingSuggestedEn: 'Grace and peace to you!',
  };
}
