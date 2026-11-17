import { WorshipSong } from '../types';
import { EXTENDED_WORSHIP_SONGS } from './curatedWorshipCatalog';

const CORE_WORSHIP_SONGS: WorshipSong[] = [
  {
    id: 'way-maker',
    title: 'Way Maker',
    titlePt: 'Abridor de Caminhos',
    artist: 'Sinach / Leeland',
    year: '2016',
    level: 'beginner',
    themeTagPt: 'Milagres & Promessas',
    spiritualTheme: 'Deus como realizador de milagres e fiel cumpridor de promessas mesmo quando não podemos ver.',
    keyBiblicalVerse: 'Isaiah 43:19 - "Behold, I am doing a new thing! ... I will make a way in the wilderness and rivers in the desert."',
    sections: [
      {
        type: 'Verse 1 (Verso 1)',
        english: 'You are here, moving in our midst / I worship You, I worship You / You are here, working in this place / I worship You, I worship You',
        portuguese: 'Tu estás aqui, movendo-te em nosso meio / Eu Te adoro, eu Te adoro / Tu estás aqui, operando neste lugar / Eu Te adoro, eu Te adoro',
        keyVocab: ['midst (em nosso meio / entre nós)', 'worship (adorar / reverenciar)'],
        grammarHighlight: 'Present Continuous ("moving", "working") expressando a presença contínua e ativa de Deus neste momento presente.',
        pronunciationTip: '"Midst" se pronuncia /mɪdst/ (atenção para não omitir o som s-t suave no final).',
        spokenPhoneticEasy: 'Iú ár ríer, mú-vin in áu-er mídst / Ái uâr-ship Iú / Iú ár ríer, uâr-kin in dhis plêiss',
        spokenTipPt: 'Na fala natural, pronuncie "You are" de forma clara ("Iú ár") e "here" com o R caipira suave do inglês ("ríer").',
        sungPhoneticFlow: 'Iu-ár-ríííer ♩ mú-vi-nin-áu-er mídst / Ái uâr-ship Iúúú ♩ Ái uâr-ship Iúúú',
        sungTipPt: 'No canto, "moving in our" se liga em um único fluxo ("mú-vi-nin-áu-er") e você segura a vogal longa em "here" ("ríííer") e no final de "You" ("Iúúú").'
      },
      {
        type: 'Chorus (Refrão)',
        english: 'Way Maker, Miracle Worker, Promise Keeper / Light in the darkness, my God, that is who You are',
        portuguese: 'Abridor de caminhos, Realizador de milagres, Guardião de promessas / Luz na escuridão, meu Deus, esse é quem Tu és',
        keyVocab: ['Promise Keeper (aquele que cumpre e guarda promessas)', 'Miracle Worker (operador de milagres)'],
        grammarHighlight: 'Formação de substantivos agentes em inglês com sufixo "-er": Make -> Maker, Work -> Worker, Keep -> Keeper.',
        pronunciationTip: 'Linking de consoante + vogal: "that is who" soa como "that-is-who" (/ðæt ɪz huː/).',
        spokenPhoneticEasy: 'Uêi Mêi-kâr, Mi-râ-côl Uâr-kâr, Pró-mis Kí-pâr / Láit in dhâ dárk-nes, mai Gód, dhét iz rú Iú ár',
        spokenTipPt: 'Falando devagar, marque cada título de Deus separadamente. O "th" de "that" tem língua entre os dentes, vibrando levemente.',
        sungPhoneticFlow: 'Uêêêi Mêi-kâr ♩ Mi-râ-côu Uâr-kâr ♩ Pró-mis Kí-pâr / Lái-tin-dhâ-dárk-nes ♩ mai Gód ♩ dhé-riz-rú-Iu-ááár',
        sungTipPt: 'Ao cantar o refrão, sustente a nota em "Way" ("Uêêêi") e emende "Light in the" ("Lái-tin-dhâ"). O "that is who You are" desliza contínuo até segurar em "are".'
      },
      {
        type: 'Bridge (Ponte)',
        english: 'Even when I don\'t see it, You\'re working / Even when I don\'t feel it, You\'re working / You never stop, You never stop working',
        portuguese: 'Mesmo quando eu não vejo, Tu estás trabalhando / Mesmo quando eu não sinto, Tu estás trabalhando / Tu nunca paras, nunca paras de trabalhar',
        keyVocab: ['Even when (mesmo quando / ainda que)', 'stop working (parar de trabalhar)'],
        grammarHighlight: 'Uso de "stop + V-ing": Quando paramos uma ação em andamento (ex: "stop working").',
        pronunciationTip: '"Don\'t see it" conecta o t com s: /doʊnt siː ɪt/.',
        spokenPhoneticEasy: 'Í-ven uén ái dôunt sí it, iór uâr-kin / Í-ven uén ái dôunt fíl it, iór uâr-kin / Iú né-ver stóp uâr-kin',
        spokenTipPt: 'Em "don\'t", o "t" quase desaparece antes de consoantes, soando "dôun sí it".',
        sungPhoneticFlow: 'Í-ven ué-nai dôun sííí-it ♩ iór uâr-kin / Iú né-ver stóóóp ♩ Iú né-ver stóp uâr-kiiiin',
        sungTipPt: 'Na ponte crescente, respire rápido antes de "Even", conecte "when I" ("ué-nai") e abra o som do "o" em "stop" ("stóóóp") dando ênfase emocional.'
      }
    ],
    topVocabulary: [
      { word: 'Way Maker', phonetic: '/weɪ ˈmeɪ.kər/', meaning: 'Abridor de caminhos / aquele que faz caminho onde não há', biblicalContext: 'Alusão a Isaías 43:19' },
      { word: 'Promise Keeper', phonetic: '/ˈprɑː.mɪs ˈkiː.pər/', meaning: 'Cumpridor fiel de promessas', biblicalContext: 'Fidelidade de Deus em cumprir cada palavra' },
      { word: 'Midst', phonetic: '/mɪdst/', meaning: 'No meio de / entre', biblicalContext: 'Mateus 18:20: "onde estiverem dois ou três reunidos em meu nome"' },
      { word: 'Darkness', phonetic: '/ˈdɑːrk.nəs/', meaning: 'Escuridão / trevas', biblicalContext: 'João 1:5: "A luz resplandece nas trevas"' },
      { word: 'Worship', phonetic: '/ˈwɜːr.ʃɪp/', meaning: 'Adorar com reverência e entrega', biblicalContext: 'Postura de honra e entrega a Deus' }
    ],
    conversationPrompt: {
      questionEn: 'How does the phrase "Even when I don\'t see it, You\'re working" inspire your daily life?',
      questionPt: 'Como a frase "Mesmo quando não vejo, Tu estás trabalhando" inspira o seu dia a dia?',
      suggestedAnswerTemplate: 'This phrase reminds me that God is in control even when I cannot see the answer yet.'
    }
  },
  {
    id: 'goodness-of-god',
    title: 'Goodness of God',
    titlePt: 'A Bondade de Deus',
    artist: 'Bethel Music / CeCe Winans',
    year: '2019',
    level: 'beginner',
    themeTagPt: 'Gratidão & Fidelidade',
    spiritualTheme: 'Gratidão por toda a fidelidade, misericórdia e bondade de Deus ao longo de todas as estações da vida.',
    keyBiblicalVerse: 'Psalm 23:6 - "Surely goodness and mercy shall follow me all the days of my life, and I will dwell in the house of the Lord forever."',
    sections: [
      {
        type: 'Verse 1 (Verso 1)',
        english: 'I love You, Lord, for Your mercy never fails me / All my days, I\'ve been held in Your hands / From the moment that I wake up until I lay my head / Oh, I will sing of the goodness of God',
        portuguese: 'Eu Te amo, Senhor, pois Tua misericórdia nunca me falha / Todos os meus dias, fui sustentado em Tuas mãos / Desde o momento em que acordo até a hora de deitar a cabeça / Oh, eu cantarei da bondade de Deus',
        keyVocab: ['mercy (misericórdia)', 'held in Your hands (sustentado em Tuas mãos)', 'lay my head (deitar a cabeça)'],
        grammarHighlight: 'Present Perfect Passive ("I\'ve been held"): ação que começou no passado e continua até o presente.',
        pronunciationTip: '"I\'ve been held" conecta: /aɪv bɪn hɛld/. Repare no som curto de "been" (/bɪn/).',
        spokenPhoneticEasy: 'Ái lâv Iú Lórd, fór iór mâr-si né-ver fêils mi / Ól mai dêis, áiv bin réld in iór rênds',
        spokenTipPt: 'Na fala, "been" soa curto como "bin" (e não "biin" longo), e "hands" tem som de "h" soprado como "rênds".',
        sungPhoneticFlow: 'Ái lâââv Iú Lóóórd ♩ fór iór mâr-si né-ver fêêêils mi / Ól mai dêêêis ♩ áiv bin rél-di-niór rêêênds',
        sungTipPt: 'Ao cantar, ligue "held in Your" em "rél-di-niór" sem parar o ar, deixando o "d" tocar levemente o "in" e deslizando para a nota longa em "hands".'
      },
      {
        type: 'Chorus (Refrão)',
        english: '\'Cause all my life You have been faithful / And all my life You have been so, so good / With every breath that I am able / Oh, I will sing of the goodness of God',
        portuguese: 'Pois por toda a minha vida Tu tens sido fiel / E por toda a minha vida Tu tens sido tão, tão bom / A cada fôlego que eu puder dar / Oh, eu cantarei da bondade de Deus',
        keyVocab: ['faithful (fiel)', 'breath (fôlego / respiração)', 'able (capaz)'],
        grammarHighlight: 'Diferença entre "breath" (substantivo, /brɛθ/, fôlego) e "breathe" (verbo, /briːð/, respirar).',
        pronunciationTip: 'O som "th" de "breath" é desvozeado (/θ/), soprando com a língua entre os dentes.',
        spokenPhoneticEasy: 'Cóz ól mai láif Iú rév bin fêith-ful / Énd ól mai láif Iú rév bin sôu, sôu gud / Uith é-vri bréth dhét ái ém êi-bol',
        spokenTipPt: 'Quando falamos "faithful", lembre de colocar a língua nos dentes no meio da palavra ("fêith-ful").',
        sungPhoneticFlow: 'Cóz ól mai láááif ♩ Iú rév bin fêêêith-fuuul / Én ól mai láááif ♩ Iú rév bin sôôôu, sôu guuud / Uith é-vri bréééth dhé-rai-ém êi-boooul',
        sungTipPt: 'No refrão, alongue "life" ("láááif") e "so" ("sôôôu"). Em "that I am", suavize o "t" para soar quase como um R brando ("dhé-rai-ém").'
      },
      {
        type: 'Bridge (Ponte)',
        english: 'Your goodness is running after, it\'s running after me / With my life laid down, I\'m surrendered, now I give You everything',
        portuguese: 'Tua bondade está correndo atrás, correndo atrás de mim / Com a minha vida entregue, estou rendido, agora Te dou tudo',
        keyVocab: ['running after (correndo atrás / perseguindo com amor)', 'surrendered (rendido / entregue)'],
        grammarHighlight: 'Phrasal verb "run after" (ir atrás de alguém com amor) + particípio "laid down" (depositada).',
        pronunciationTip: '"Running after" vira /ˈrʌn.ɪŋ ˈæf.tər/ com t suave.',
        spokenPhoneticEasy: 'Iór gud-nes iz râ-nin éf-ter, its râ-nin éf-ter mi / Uith mai láif lêid dáun, áim sâ-rên-derd',
        spokenTipPt: 'Pronuncie "surrendered" com a sílaba forte no meio: "sâ-RÊN-derd".',
        sungPhoneticFlow: 'Iór gud-ne-siz râ-ni-néf-ter ♩ its râ-ni-néf-ter miii / Uith mai láif lêid dáááun ♩ áim sâ-rên-derd',
        sungTipPt: 'Na ponte rápida e alegre, junte as palavras: "goodness is running after" desliza como "gud-ne-siz râ-ni-néf-ter" sem pausas rígidas!'
      }
    ],
    topVocabulary: [
      { word: 'Goodness', phonetic: '/ˈɡʊd.nəs/', meaning: 'Bondade intrínseca e benevolência', biblicalContext: 'Salmo 23:6 e Êxodo 34:6' },
      { word: 'Faithful', phonetic: '/ˈfeɪθ.fəl/', meaning: 'Fiel, leal, inabalável', biblicalContext: 'Lamentações 3:23: "Grande é a tua fidelidade"' },
      { word: 'Mercy', phonetic: '/ˈmɜːr.si/', meaning: 'Misericórdia e compaixão', biblicalContext: 'Compaixão renovada a cada manhã' },
      { word: 'Surrender', phonetic: '/səˈrɛn.dər/', meaning: 'Render-se / entregar o controle', biblicalContext: 'Entrega voluntária da vontade a Deus' }
    ],
    conversationPrompt: {
      questionEn: 'Can you share one reason why you are grateful to God today?',
      questionPt: 'Você pode contar um motivo pelo qual é grato a Deus hoje?',
      suggestedAnswerTemplate: 'Today I am grateful for my family, my health, and God\'s faithfulness.'
    }
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace (My Chains Are Gone)',
    titlePt: 'Maravilhosa Graça (Minhas Correntes Caíram)',
    artist: 'Chris Tomlin / John Newton',
    year: '2006',
    level: 'beginner',
    themeTagPt: 'Graça & Libertação',
    spiritualTheme: 'O hino cristão mais conhecido do mundo sobre ser salvo pela graça imerecida de Deus e liberto das correntes.',
    keyBiblicalVerse: 'Ephesians 2:8 - "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God."',
    sections: [
      {
        type: 'Verse 1 (Verso 1)',
        english: 'Amazing grace, how sweet the sound / That saved a wretch like me / I once was lost, but now am found / Was blind, but now I see',
        portuguese: 'Maravilhosa graça, quão doce é o som / Que salvou um pecador como eu / Antes eu estava perdido, mas agora fui encontrado / Era cego, mas agora eu vejo',
        keyVocab: ['amazing (maravilhosa / surpreendente)', 'grace (graça)', 'lost / found (perdido / encontrado)'],
        grammarHighlight: 'Contraste no passado vs presente: "once was lost" (um dia estive perdido) -> "now am found" (agora fui achado).',
        pronunciationTip: 'O "ee" de "sweet" e "see" é um som de I longo e sorridente: /swiːt/, /siː/.',
        spokenPhoneticEasy: 'Â-mêi-zin grêiss, ráu suít dhâ sáund / Dhét sêivd â rétch láik mi / Ái uâns uóz lóst, bât náu ém fáund / Uóz bláind, bât náu ái sí',
        spokenTipPt: 'Em "wretch" (alguém perdido/miserável), o "w" é mudo! Começa direto no som de R inglês: "rétch".',
        sungPhoneticFlow: 'Â-mêêêi-zin grêêêiss ♩ ráu suííít dhâ sáááund / Dhét sêêêiv-dâ rétch láik miii / Ái uâns uóz lóóóst ♩ bât náááu ém fáááund',
        sungTipPt: 'A melodia clássica pede notas bem abertas e respiração calma em cada vírgula. Ligue "saved a" em "sêêêiv-dâ" suavemente.'
      },
      {
        type: 'Chorus (Refrão)',
        english: 'My chains are gone, I\'ve been set free / My God, my Savior has ransomed me / And like a flood His mercy reigns / Unending love, amazing grace',
        portuguese: 'Minhas correntes se foram, fui liberto / Meu Deus, meu Salvador me resgatou / E como um dilúvio Sua misericórdia reina / Amor sem fim, maravilhosa graça',
        keyVocab: ['chains (correntes / grilhões)', 'set free (libertado)', 'ransomed (resgatado com preço pago)'],
        grammarHighlight: '"I\'ve been set free" = voz passiva no Present Perfect, indicando libertação completa com efeito até hoje.',
        pronunciationTip: '"Chains" começa com som forte de "tch": /tʃeɪnz/.',
        spokenPhoneticEasy: 'Mai tchêins ár gón, áiv bin sét frí / Mai Gód, mai Sêi-vior réz rên-sâmd mi / Énd láik â flâd Riz mâr-si rêins',
        spokenTipPt: 'Em "flood" (dilúvio/enchente), cuidado: não se fala "flúd", e sim com som de A fechado ("flâd")!',
        sungPhoneticFlow: 'Mai tchêêêins ár góóón ♩ áiv bin sét frííí / Mai Góóód, mai Sêi-vior ♩ réz rên-sâmd miii / Ân-ên-din lâââv ♩ â-mêi-zin grêêêiss',
        sungTipPt: 'Respire fundo antes do refrão: segure a nota em "gone" ("góóón") e "free" ("frííí"), projetando a voz com alegria.'
      }
    ],
    topVocabulary: [
      { word: 'Grace', phonetic: '/ɡreɪs/', meaning: 'Graça, favor imerecido', biblicalContext: 'Efésios 2:8' },
      { word: 'Chains', phonetic: '/tʃeɪnz/', meaning: 'Correntes, amarras espirituais', biblicalContext: 'Libertação em Cristo' },
      { word: 'Savior', phonetic: '/ˈseɪv.jər/', meaning: 'Salvador, aquele que resgata', biblicalContext: 'Título de Jesus Cristo' },
      { word: 'Ransomed', phonetic: '/ˈræn.səmd/', meaning: 'Resgatado mediante pagamento', biblicalContext: 'O sacrifício da cruz' }
    ],
    conversationPrompt: {
      questionEn: 'What does "Amazing Grace" mean to your heart today?',
      questionPt: 'O que significa "Maravilhosa Graça" para o seu coração hoje?',
      suggestedAnswerTemplate: 'Amazing grace means God loves me and gives me a fresh new start every day.'
    }
  },
  {
    id: 'how-great-is-our-god',
    title: 'How Great Is Our God',
    titlePt: 'Quão Grande é o Nosso Deus',
    artist: 'Chris Tomlin',
    year: '2004',
    level: 'beginner',
    themeTagPt: 'Adoração Simples & Majestade',
    spiritualTheme: 'Louvor extremamente acolhedor e repetitivo para iniciantes, exaltando a grandeza de Deus.',
    keyBiblicalVerse: 'Psalm 145:3 - "Great is the Lord and most worthy of praise; his greatness no one can fathom."',
    sections: [
      {
        type: 'Chorus (Refrão)',
        english: 'How great is our God, sing with me / How great is our God, and all will see / How great, how great is our God',
        portuguese: 'Quão grande é o nosso Deus, cante comigo / Quão grande é o nosso Deus, e todos verão / Quão grande, quão grande é o nosso Deus',
        keyVocab: ['how great (quão grande)', 'our God (nosso Deus)', 'sing with me (cante comigo)'],
        grammarHighlight: 'Exclamação com "How + adjetivo": "How great..." ("Quão grande..."), estrutura super útil no inglês.',
        pronunciationTip: '"Great" rima com "eight": /ɡreɪt/ (fala-se "grêit", e não "grít").',
        spokenPhoneticEasy: 'Ráu grêit iz áu-er Gód, sin uith mí / Ráu grêit iz áu-er Gód, énd ól uil sí / Ráu grêit, ráu grêit iz áu-er Gód',
        spokenTipPt: 'Perfeito para iniciantes! Treine o "How" como "Ráu" e "great" como "grêit" sem colocar som de "i" no t final.',
        sungPhoneticFlow: 'Ráu grêêêi-tiz áu-er Góóód ♩ sin uith miii / Ráu grêêêi-tiz áu-er Góóód ♩ én ól uil siii / Ráu grêêêit ♩ ráu grêêêit iz áu-er Góóód',
        sungTipPt: 'Ao cantar, ligue o "t" de "great" com "is" ("grêêêi-tiz"), transformando duas palavras em uma fluência só!'
      },
      {
        type: 'Verse 1 (Verso 1)',
        english: 'The splendor of the King, clothed in majesty / Let all the earth rejoice, all the earth rejoice',
        portuguese: 'O esplendor do Rei, vestido em majestade / Que toda a terra se alegre, toda a terra se alegre',
        keyVocab: ['splendor (esplendor)', 'clothed (vestido / revestido)', 'rejoice (alegrar-se)'],
        grammarHighlight: 'Imperativo convidativo com "Let": "Let all the earth rejoice" = "Que toda a terra se regozije".',
        pronunciationTip: '"Earth" tem o som R seguido de TH suave: /ɜːrθ/.',
        spokenPhoneticEasy: 'Dhâ splên-der óv dhâ Kin, klôudhd in mé-djes-ti / Lét ól dhi ârth ri-djóis',
        spokenTipPt: 'Repare que antes de vogal ("the earth"), "the" muda de som de "dhâ" para "dhi" ("dhi ârth")!',
        sungPhoneticFlow: 'Dhâ splên-der óv dhâ Kiiiing ♩ klôudhd in mé-djes-tiii / Lé-tól dhi ârth ri-djóóóis',
        sungTipPt: 'No canto, junte "Let all" em "Lé-tól" e sustente a última vogal de "King" e "rejoice".'
      }
    ],
    topVocabulary: [
      { word: 'Great', phonetic: '/ɡreɪt/', meaning: 'Grande, grandioso, excelente', biblicalContext: 'Salmo 145:3' },
      { word: 'Majesty', phonetic: '/ˈmædʒ.ə.sti/', meaning: 'Majestade, realeza divina', biblicalContext: 'Judas 1:25' },
      { word: 'Rejoice', phonetic: '/rɪˈdʒɔɪs/', meaning: 'Alegrar-se profundamente', biblicalContext: 'Filipenses 4:4' },
      { word: 'Sing', phonetic: '/sɪŋ/', meaning: 'Cantar', biblicalContext: 'Salmo 96:1' }
    ],
    conversationPrompt: {
      questionEn: 'What makes you feel thankful when you sing "How Great Is Our God"?',
      questionPt: 'O que faz você sentir gratidão ao cantar "Quão Grande é o Nosso Deus"?',
      suggestedAnswerTemplate: 'Looking at nature and my family reminds me how great God is.'
    }
  },
  {
    id: '10000-reasons',
    title: '10,000 Reasons (Bless the Lord)',
    titlePt: '10 Mil Razões (Bendize ao Senhor)',
    artist: 'Matt Redman',
    year: '2011',
    level: 'beginner',
    themeTagPt: 'Gratidão Diária',
    spiritualTheme: 'Louvor sincero baseado no Salmo 103, louvando o Senhor pela manhã, nas dificuldades e até o último suspiro.',
    keyBiblicalVerse: 'Psalm 103:1 - "Bless the Lord, O my soul, and all that is within me, bless His holy name!"',
    sections: [
      {
        type: 'Chorus (Refrão)',
        english: 'Bless the Lord, O my soul, O my soul / Worship His holy name / Sing like never before, O my soul / I\'ll worship Your holy name',
        portuguese: 'Bendize ao Senhor, ó minha alma, ó minha alma / Adora o Seu santo nome / Cante como nunca antes, ó minha alma / Eu adorarei o Teu santo nome',
        keyVocab: ['Bless (bendizer / abençoar)', 'holy (santo / separado)', 'like never before (como nunca antes)'],
        grammarHighlight: 'Imperativo exortativo em primeira pessoa da alma ("Bless the Lord, O my soul"). Expressão idiomática "like never before".',
        pronunciationTip: '"Holy name": o "o" em holy é longo /oʊ/ (/ˈhoʊ.li/).',
        spokenPhoneticEasy: 'Bléss dhâ Lórd, ôu mai sôul / Uâr-ship Riz rôu-li nêim / Sin láik né-ver bi-fór',
        spokenTipPt: '"Soul" se fala "sôul" e "holy" começa com som de R soprado: "rôu-li".',
        sungPhoneticFlow: 'Bléss dhâ Lóóórd ♩ ôu mai sôôôul ♩ ôu mai sôôôul / Uâr-ship Riz rôu-li nêêêim / Sin láik né-ver bi-fóóór',
        sungTipPt: 'Cante cada "O my soul" de forma ligada e suave ("ôu mai sôôôul"), segurando o som do L macio no final sem cortar seco.'
      },
      {
        type: 'Verse 1 (Verso 1)',
        english: 'The sun comes up, it\'s a new day dawning / It\'s time to sing Your song again / Whatever may pass and whatever lies before me / Let me be singing when the evening comes',
        portuguese: 'O sol desponta, é um novo dia amanhecendo / É hora de cantar a Tua canção de novo / O que quer que aconteça e o que quer que esteja diante de mim / Que eu esteja cantando quando o entardecer chegar',
        keyVocab: ['dawning (amanhecendo)', 'lies before me (está diante de mim)', 'evening (entardecer / noite)'],
        grammarHighlight: 'Uso de "Whatever" (o que quer que seja) para expressar entrega perante o futuro.',
        pronunciationTip: '"Evening" tem duas sílabas: /ˈiːv.nɪŋ/ ("ív-nin"), e não três.',
        spokenPhoneticEasy: 'Dhâ sân kâms âp, its â niú dêi dó-nin / Its táim tu sin iór sóng â-guên',
        spokenTipPt: '"Comes up" significa "nasce/sobe". Fala-se junto: "kâm-zâp".',
        sungPhoneticFlow: 'Dhâ sân kâm-zâââp ♩ it-sâ niú dêi dóóó-nin / Its táim tu sin iór són-gâ-guêêên',
        sungTipPt: 'Na melodia, conecte "it\'s a" em "it-sâ" e "song again" em "són-gâ-guêêên", mantendo o ritmo calmo de manhã.'
      }
    ],
    topVocabulary: [
      { word: 'Dawn', phonetic: '/dɔːn/', meaning: 'Alvorecer, amanhecer', biblicalContext: 'As misericórdias se renovam a cada manhã' },
      { word: 'Holy', phonetic: '/ˈhoʊ.li/', meaning: 'Santo, consagrado, perfeito', biblicalContext: 'A santidade e pureza do caráter de Deus' },
      { word: 'Soul', phonetic: '/soʊl/', meaning: 'Alma, o íntimo do ser humano', biblicalContext: 'Salmo 103' },
      { word: 'Bless', phonetic: '/blɛs/', meaning: 'Abençoar, bendizer', biblicalContext: 'Gratidão espiritual' }
    ],
    conversationPrompt: {
      questionEn: 'Name 2 things you are thankful for today.',
      questionPt: 'Diga 2 coisas pelas quais você é grato hoje.',
      suggestedAnswerTemplate: 'Today I am thankful for my family and a new day of life.'
    }
  },
  {
    id: 'what-a-beautiful-name',
    title: 'What A Beautiful Name',
    titlePt: 'Quão Lindo Esse Nome É',
    artist: 'Hillsong Worship',
    year: '2016',
    level: 'intermediate',
    themeTagPt: 'O Nome de Jesus',
    spiritualTheme: 'Adoração centrada na beleza, poder e majestade incomparável do nome de Jesus Cristo.',
    keyBiblicalVerse: 'Philippians 2:9 - "Therefore God exalted him to the highest place and gave him the name that is above every name."',
    sections: [
      {
        type: 'Chorus (Refrão)',
        english: 'What a beautiful Name it is, what a beautiful Name it is / The Name of Jesus Christ my King / What a beautiful Name it is, nothing compares to this',
        portuguese: 'Quão lindo esse Nome é, quão lindo esse Nome é / O Nome de Jesus Cristo, meu Rei / Quão lindo esse Nome é, nada se compara a Ele',
        keyVocab: ['beautiful (lindo / maravilhoso)', 'nothing compares (nada se compara)'],
        grammarHighlight: 'Exclamação "What a + adjetivo + substantivo": "What a beautiful Name!" = "Que Nome lindo!".',
        pronunciationTip: 'O "t" de "What a" vira um R suave no inglês americano/australiano ("Uó-râ").',
        spokenPhoneticEasy: 'Uót â biú-ri-ful Nêim it iz / Dhâ Nêim óv Djí-zâs Kráist mai Kin / Nâ-thin kâm-pérs tu dhis',
        spokenTipPt: 'Em "beautiful", o "t" entre vogais fica macio como "r": "biú-ri-ful".',
        sungPhoneticFlow: 'Uó-râ biú-ri-ful Nêêêi-mi-riz ♩ uó-râ biú-ri-ful Nêêêi-mi-riz / Dhâ Nêi-móv Djí-zâs Kráist mai Kiiiing',
        sungTipPt: 'Ao cantar, toda a frase "Name it is" desliza conectada em "Nêêêi-mi-riz" com vibrato suave no "Name".'
      },
      {
        type: 'Bridge (Ponte)',
        english: 'Death could not hold You, the veil tore before You / You silence the boast of sin and grave',
        portuguese: 'A morte não pôde Te deter, o véu se rasgou diante de Ti / Tu silenciaste o orgulho do pecado e da sepultura',
        keyVocab: ['veil tore (o véu se rasgou)', 'grave (sepultura)', 'boast (jactância / orgulho)'],
        grammarHighlight: '"Could not hold You" = passado de possibilidade ("não conseguiu segurar Você").',
        pronunciationTip: '"Sin and grave": ligue "sin" com "and" -> "si-nên grêiv".',
        spokenPhoneticEasy: 'Déth kud nót rôuld Iú, dhâ vêil tór bi-fór Iú / Iú sái-lêns dhâ bôust óv sin énd grêiv',
        spokenTipPt: '"Death" tem som soprado de TH no final ("Déth") e "veil" soa "vêil".',
        sungPhoneticFlow: 'Déth kud nót rôôôuld Iúúú ♩ dhâ vêil tór bi-fóóór Iúúú / Iú sái-lêns dhâ bôust óv si-nên grêêêiv',
        sungTipPt: 'Na ponte épica, dê força nas sílabas tônicas ("HOLD", "TORE", "GRAVE") e mantenha o fôlego até completar "You".'
      }
    ],
    topVocabulary: [
      { word: 'Beautiful', phonetic: '/ˈbjuː.tɪ.fəl/', meaning: 'Belo, lindo, admirável', biblicalContext: 'Salmo 27:4' },
      { word: 'Nothing compares', phonetic: '/ˈnʌθ.ɪŋ kəmˈpɛrz/', meaning: 'Nada se compara', biblicalContext: 'Exclusividade de Cristo' },
      { word: 'Veil', phonetic: '/veɪl/', meaning: 'Véu (referência ao véu do templo)', biblicalContext: 'Mateus 27:51' },
      { word: 'King', phonetic: '/kɪŋ/', meaning: 'Rei', biblicalContext: 'Apocalipse 19:16' }
    ],
    conversationPrompt: {
      questionEn: 'Which line in "What A Beautiful Name" encourages you the most?',
      questionPt: 'Qual frase de "What A Beautiful Name" mais encoraja você?',
      suggestedAnswerTemplate: 'I love "Death could not hold You" because it reminds me of hope and victory.'
    }
  },
  {
    id: 'oceans',
    title: 'Oceans (Where Feet May Fail)',
    titlePt: 'Oceanos (Onde Meus Pés Podem Falhar)',
    artist: 'Hillsong UNITED',
    year: '2013',
    level: 'intermediate',
    themeTagPt: 'Fé no Desconhecido',
    spiritualTheme: 'Dar um passo de fé nas águas profundas do desconhecido, confiando na soberania e no chamado de Deus.',
    keyBiblicalVerse: 'Matthew 14:29 - "Peter got down out of the boat, walked on the water and came toward Jesus."',
    sections: [
      {
        type: 'Verse 1 (Verso 1)',
        english: 'You call me out upon the waters / The great unknown where feet may fail / And there I find You in the mystery / In oceans deep, my faith will stand',
        portuguese: 'Tu me chamas para sobre as águas / O grande desconhecido onde os pés podem falhar / E ali Te encontro no mistério / Em oceanos profundos, minha fé permanecerá firme',
        keyVocab: ['call out (chamar para fora)', 'great unknown (o grande desconhecido)', 'feet may fail (onde os pés podem vacilar)'],
        grammarHighlight: 'Modal verb "may": indica possibilidade poética ("where feet may fail").',
        pronunciationTip: '"Upon the waters" pronuncia-se /əˈpɑːn ðə ˈwɔː.tərz/.',
        spokenPhoneticEasy: 'Iú kól mi áut â-pón dhâ uó-târs / Dhâ grêit ân-nôun uér fít mêi fêil / In ôu-shâns díp, mai fêith uil stênd',
        spokenTipPt: 'Na fala, "oceans" soa como "ôu-shâns" (com som de CH/SH no meio, nunca "oceâns").',
        sungPhoneticFlow: 'Iú kól mi áut â-pón dhâ uóóó-târs / Dhâ grêi-tân-nôun uér fít mêi fêêêil / I-nôu-shâns díííp ♩ mai fêith uil stêêênd',
        sungTipPt: 'Cante suavemente no verso: junte "great unknown" ("grêi-tân-nôun") e "In oceans" ("I-nôu-shâns"), quase sussurrando as vogais longas.'
      },
      {
        type: 'Chorus (Refrão)',
        english: 'And I will call upon Your name / And keep my eyes above the waves / When oceans rise, my soul will rest in Your embrace / For I am Yours and You are mine',
        portuguese: 'E eu invocarei o Teu nome / E manterei meus olhos acima das ondas / Quando oceanos se erguerem, minha alma descansará no Teu abraço / Pois eu sou Teu e Tu és meu',
        keyVocab: ['call upon (invocar / clamar por)', 'embrace (abraço acolhedor)', 'waves (ondas)'],
        grammarHighlight: 'Uso de "keep + object + preposition" ("keep my eyes above the waves").',
        pronunciationTip: '"Keep my eyes above" soa encadeado: /kiːp maɪ aɪz əˈbʌv/.',
        spokenPhoneticEasy: 'Énd ái uil kól â-pón iór nêim / Énd kíp mai áis â-bâv dhâ uêivs / Mai sôul uil rést in iór im-brêiss',
        spokenTipPt: 'Em "waves", faça o som vibrante do V no final antes do Z ("uêivs").',
        sungPhoneticFlow: 'Én ái uil kóóól â-pón iór nêêêim / Én kíp mai ái-zâ-bâv dhâ uêêêivs / Mai sôul uil rést i-nió-rim-brêêêiss',
        sungTipPt: 'Repare no belo encadeamento cantado de "in Your embrace" -> "i-nió-rim-brêêêiss", subindo o tom na última sílaba.'
      },
      {
        type: 'Bridge (Ponte)',
        english: 'Spirit lead me where my trust is without borders / Let me walk upon the waters wherever You would call me / Take me deeper than my feet could ever wander',
        portuguese: 'Espírito, guia-me onde minha confiança seja sem fronteiras / Deixa-me andar sobre as águas para onde quer que me chames / Leva-me mais fundo do que meus pés poderiam jamais vagar',
        keyVocab: ['without borders (sem fronteiras)', 'wander (vagar / caminhar)', 'deeper (mais profundo)'],
        grammarHighlight: 'Comparativos com "-er": "deeper" (mais profundo).',
        pronunciationTip: '"Wander" (/ˈwɑːn.dər/ = vagar) vs "wonder" (/ˈwʌn.dər/ = maravilhar-se).',
        spokenPhoneticEasy: 'Spi-rit líd mi uér mai trâst iz uith-áut bór-dârs / Têik mi dí-pâr dhén mai fít kud é-ver uón-dâr',
        spokenTipPt: 'Diga "trust is" claramente como "trâst iz" na fala.',
        sungPhoneticFlow: 'Spi-rit líííd mi ♩ uér mai trâs-tiz uith-áut bór-dârs / Têik mi dííí-pâr dhén mai fít ku-dé-ver uón-dâââr',
        sungTipPt: 'A ponte vai ganhando intensidade: acentue "LEAD", "DEEPER" e conecte "trust is" ("trâs-tiz") e "could ever" ("ku-dé-ver").'
      }
    ],
    topVocabulary: [
      { word: 'Borders', phonetic: '/ˈbɔːr.dərz/', meaning: 'Fronteiras, limites', biblicalContext: 'Confiança ilimitada em Deus' },
      { word: 'Wander', phonetic: '/ˈwɑːn.dər/', meaning: 'Caminhar, aventurar-se', biblicalContext: 'Explorar profundezas espirituais' },
      { word: 'Rest', phonetic: '/rɛst/', meaning: 'Descansar em paz', biblicalContext: 'Descanso da alma em Cristo' },
      { word: 'Embrace', phonetic: '/ɪmˈbreɪs/', meaning: 'Abraço, acolhimento', biblicalContext: 'Segurança no cuidado divino' }
    ],
    conversationPrompt: {
      questionEn: 'What new step of faith are you taking in your life or studies right now?',
      questionPt: 'Qual novo passo de fé você está dando na sua vida ou estudos agora?',
      suggestedAnswerTemplate: 'Learning English step by step is one of my steps of faith this year.'
    }
  },
  {
    id: 'reckless-love',
    title: 'Reckless Love',
    titlePt: 'O Amor Ousado de Deus',
    artist: 'Cory Asbury / Bethel',
    year: '2017',
    level: 'intermediate',
    themeTagPt: 'Amor Incondicional',
    spiritualTheme: 'O amor extravagante de Deus que deixa as 99 ovelhas para ir atrás de uma só.',
    keyBiblicalVerse: 'Luke 15:4 - "Suppose one of you has a hundred sheep and loses one of them. Doesn\'t he leave the ninety-nine in the open country and go after the lost sheep until he finds it?"',
    sections: [
      {
        type: 'Chorus (Refrão)',
        english: 'Oh, the overwhelming, never-ending, reckless love of God / Oh, it chases me down, fights \'til I\'m found, leaves the ninety-nine',
        portuguese: 'Oh, o avassalador, interminável e ousado amor de Deus / Oh, Ele corre atrás de mim, luta até que eu seja achado, deixa as noventa e nove',
        keyVocab: ['overwhelming (avassalador / imenso)', 'chases me down (corre atrás para me alcançar)', 'ninety-nine (noventa e nove)'],
        grammarHighlight: 'Adjetivos compostos fortes: "overwhelming" e "never-ending" descrevendo o amor divino.',
        pronunciationTip: 'Em "reckless", o final "-less" tem vogal curta e relaxada: /ˈrɛk.ləs/.',
        spokenPhoneticEasy: 'Ôu, dhi ôu-ver-uél-min, né-ver-ên-din, rék-lês lâv óv Gód / It tchêi-sês mi dáun, fáits til áim fáund',
        spokenTipPt: 'Divida "overwhelming" em 4 partes na fala: "ôu-ver-UÉL-min".',
        sungPhoneticFlow: 'Ôôôu dhi ôu-ver-uél-min ♩ né-ver-ên-din ♩ rék-lês lâââv óv Góóód / It tchêi-sês mi dáááun ♩ fáits ti-láim fáááund',
        sungTipPt: 'No refrão em compasso 6/8 (valsa lenta), balance cada frase em 3 tempos e ligue "\'til I\'m" em "ti-láim" antes da nota alta em "found".'
      },
      {
        type: 'Bridge (Ponte)',
        english: 'There\'s no shadow You won\'t light up / Mountain You won\'t climb up / Coming after me',
        portuguese: 'Não há sombra que Tu não ilumines / Montanha que Tu não escales / Vindo atrás de mim',
        keyVocab: ['shadow (sombra)', 'light up (iluminar)', 'climb up (escalar)'],
        grammarHighlight: 'Phrasal verbs com "up" indicando ação completa: "light up" (iluminar por completo), "climb up" (subir até o topo).',
        pronunciationTip: '"Climb" tem o B final completamente mudo! Fala-se /klaɪm/ ("kláim").',
        spokenPhoneticEasy: 'Dhérz nôu shé-dôu Iú uôunt láit âp / Máun-tân Iú uôunt kláim âp / Kâ-min éf-ter mi',
        spokenTipPt: 'Lembre que o "b" de "climb" não é pronunciado nunca ("kláim").',
        sungPhoneticFlow: 'Dhérz nôu shé-dôu Iú uôunt lái-tâââp / Máun-tân Iú uôunt klái-mâââp / Kâ-mi-néf-ter miii',
        sungTipPt: 'Na ponte cheia de energia, conecte "light up" ("lái-tâââp") e "climb up" ("klái-mâââp"), estendendo o som final com fôlego firme.'
      }
    ],
    topVocabulary: [
      { word: 'Overwhelming', phonetic: '/ˌoʊ.vərˈwɛl.mɪŋ/', meaning: 'Avassalador, que transborda', biblicalContext: 'Efésios 3:19' },
      { word: 'Chase', phonetic: '/tʃeɪs/', meaning: 'Perseguir com foco / correr atrás', biblicalContext: 'A busca de Deus pelo filho perdido' },
      { word: 'Shadow', phonetic: '/ˈʃæd.oʊ/', meaning: 'Sombra, lugar escuro', biblicalContext: 'Salmo 23:4' },
      { word: 'Climb', phonetic: '/klaɪm/', meaning: 'Escalar, subir (b mudo)', biblicalContext: 'Superar barreiras por amor' }
    ],
    conversationPrompt: {
      questionEn: 'What does it feel like to know God never gives up on you?',
      questionPt: 'Qual é a sensação de saber que Deus nunca desiste de você?',
      suggestedAnswerTemplate: 'It gives me deep peace and strength to keep going every day.'
    }
  }
];

const combinedSongs: WorshipSong[] = [...CORE_WORSHIP_SONGS, ...EXTENDED_WORSHIP_SONGS];
const seenIds = new Set<string>();
const seenTitles = new Set<string>();

export const WORSHIP_SONGS: WorshipSong[] = combinedSongs.filter((song) => {
  const normId = song.id.trim().toLowerCase();
  const normTitle = song.title.trim().toLowerCase();
  if (seenIds.has(normId) || seenTitles.has(normTitle)) {
    return false;
  }
  seenIds.add(normId);
  seenTitles.add(normTitle);
  return true;
});
