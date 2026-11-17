import { EverydayRoleplayScenario } from '../types';

export const EVERYDAY_SCENARIOS: EverydayRoleplayScenario[] = [
  {
    id: 'restaurant-diner',
    title: 'Pedir Comida no Restaurante / Diner',
    category: 'food',
    locationEmoji: '🍔',
    characterName: 'Jake (Garçom)',
    characterRoleEn: 'Friendly American Waiter at Sunny Side Diner',
    characterRolePt: 'Garçom americano atencioso em um Diner em Nova York',
    situationEn: 'You just sat down at a popular diner in New York. The waiter approaches your table with menus and a water jug.',
    situationPt: 'Você acabou de se sentar em um diner movimentado em Nova York. O garçom se aproxima da sua mesa com o cardápio e água.',
    initialBotGreetingEn: "Hi there! Welcome to Sunny Side Diner! Table for one? Here's our menu. Can I start you off with something to drink—maybe an iced tea, a fresh coffee, or a soda—or do you need a couple of minutes to look over the menu?",
    initialBotGreetingPt: "Olá! Bem-vindo ao Sunny Side Diner! Mesa para um? Aqui está o cardápio. Posso começar trazendo algo para você beber—talvez um chá gelado, café fresco ou refrigerante—ou prefere alguns minutinhos para olhar o menu?",
    goals: [
      {
        id: 'goal-drink',
        descriptionEn: 'Order a drink or ask for tap water / recommendations',
        descriptionPt: 'Pedir uma bebida ou pedir água da casa / recomendação'
      },
      {
        id: 'goal-food',
        descriptionEn: 'Order a main course with a custom request (e.g., dressing on the side, no onions)',
        descriptionPt: 'Pedir um prato principal com um ajuste (ex: molho à parte, sem cebola)'
      },
      {
        id: 'goal-bill',
        descriptionEn: 'Ask for the check/bill and ask about paying by card or tips',
        descriptionPt: 'Pedir a conta e perguntar sobre pagamento com cartão ou gorjeta'
      }
    ],
    quickStartersEn: [
      "Could I get a glass of iced water with lemon, please?",
      "What do you recommend for lunch today?",
      "I would like the bacon cheeseburger, but could I get the dressing on the side?",
      "Could we have the check, please? Can I pay by card?"
    ],
    usefulPhrases: [
      {
        phraseEn: "Could I please get the...",
        phrasePt: "Eu gostaria de pedir o... (forma mais educada que 'I want')",
        pronunciationHint: "Conecte 'could I' como /kʊ-daɪ/."
      },
      {
        phraseEn: "On the side",
        phrasePt: "À parte / separado (ex: molho ou batata frita à parte)",
        pronunciationHint: "Enfatize /saɪd/."
      },
      {
        phraseEn: "Could we have the check, please?",
        phrasePt: "Poderia nos trazer a conta, por favor? (Nos EUA usa-se 'check', no Reino Unido 'bill')",
        pronunciationHint: "O som de 'ch' em 'check' é explosivo /tʃɛk/."
      }
    ]
  },
  {
    id: 'asking-directions',
    title: 'Perguntar Direções na Cidade',
    category: 'directions',
    locationEmoji: '🗺️',
    characterName: 'Oliver (Pedestre Local)',
    characterRoleEn: 'Friendly Local Pedestrian near Central Station',
    characterRolePt: 'Pedestre local prestativo próximo à estação central',
    situationEn: 'You are looking for the subway station and your phone battery just died. You approach a friendly passerby on the street.',
    situationPt: 'Você está procurando a estação de metrô e a bateria do seu celular acabou. Você aborda um pedestre amigável na calçada.',
    initialBotGreetingEn: "Hello there! You look a bit lost or looking for something. Can I help you find your way around today?",
    initialBotGreetingPt: "Olá! Você parece um pouco perdido ou procurando algo. Posso te ajudar a encontrar seu caminho hoje?",
    goals: [
      {
        id: 'goal-ask-place',
        descriptionEn: 'Politely ask how to get to the nearest subway station or landmark',
        descriptionPt: 'Perguntar educadamente como chegar à estação de metrô mais próxima'
      },
      {
        id: 'goal-distance',
        descriptionEn: 'Ask how far it is and if it is within walking distance',
        descriptionPt: 'Perguntar qual a distância e se dá para ir a pé'
      },
      {
        id: 'goal-thanks',
        descriptionEn: 'Thank them politely and confirm the key turn (left, right, straight ahead)',
        descriptionPt: 'Agradecer calorosamente e confirmar a direção (esquerda, direita ou reto)'
      }
    ],
    quickStartersEn: [
      "Excuse me! Could you tell me where the nearest subway station is?",
      "Is it within walking distance from here?",
      "Should I turn left at the traffic light, or go straight ahead?",
      "Thank you so much! Have a wonderful day!"
    ],
    usefulPhrases: [
      {
        phraseEn: "Excuse me, do you happen to know where...",
        phrasePt: "Com licença, por acaso você sabe onde fica...",
        pronunciationHint: "'Excuse me' /ɪkˈskjuːz miː/ com 's' sonoro suave."
      },
      {
        phraseEn: "Is it within walking distance?",
        phrasePt: "Dá para ir a pé? / Fica a uma distância caminhável?",
        pronunciationHint: "'Within' tem o som do 'th' /wɪˈðɪn/."
      },
      {
        phraseEn: "Go straight ahead for two blocks",
        phrasePt: "Siga em frente por dois quarteirões",
        pronunciationHint: "'Straight' soa como /streɪt/ (o 'gh' é mudo)."
      }
    ]
  },
  {
    id: 'shopping-store',
    title: 'Fazer Compras em Loja ou Shopping',
    category: 'shopping',
    locationEmoji: '🛍️',
    characterName: 'Chloe (Vendedora da Loja)',
    characterRoleEn: 'Helpful Retail Associate at Fashion & Tech Store',
    characterRolePt: 'Vendedora atenciosa em uma loja de roupas e eletrônicos',
    situationEn: 'You are shopping for clothes and accessories. You found a jacket you like, but you need a different size.',
    situationPt: 'Você está fazendo compras em uma loja. Você encontrou uma jaqueta que gostou, mas precisa de outro tamanho.',
    initialBotGreetingEn: "Hi! Welcome in! We've got a 20% off promotion on jackets and knitwear today. Let me know if you need a different size or want to try anything on!",
    initialBotGreetingPt: "Olá! Seja bem-vindo! Temos 20% de desconto em jaquetas e malhas hoje. Me avise se precisar de outro tamanho ou quiser experimentar algo!",
    goals: [
      {
        id: 'goal-size',
        descriptionEn: 'Ask for a different size (Medium, Large) or another color',
        descriptionPt: 'Pedir um tamanho diferente (M, G) ou outra cor'
      },
      {
        id: 'goal-fitting-room',
        descriptionEn: 'Ask where the fitting rooms are located to try it on',
        descriptionPt: 'Perguntar onde fica o provador para experimentar'
      },
      {
        id: 'goal-checkout',
        descriptionEn: 'Ask about return policies and payment methods (Apple Pay / Credit card)',
        descriptionPt: 'Perguntar sobre política de troca e formas de pagamento'
      }
    ],
    quickStartersEn: [
      "Excuse me, do you have this in a medium or large?",
      "Does this jacket come in black or navy blue?",
      "Where are the fitting rooms located?",
      "Do you accept Apple Pay or contactless cards?"
    ],
    usefulPhrases: [
      {
        phraseEn: "Do you have this in a medium?",
        phrasePt: "Você tem isso no tamanho M?",
        pronunciationHint: "Em inglês diz-se 'in a medium' ou 'in a large'."
      },
      {
        phraseEn: "Where can I try this on?",
        phrasePt: "Onde posso experimentar isso?",
        pronunciationHint: "Phrasal verb 'try on' -> ligue os sons: /traɪ jɑːn/."
      },
      {
        phraseEn: "What is your return policy?",
        phrasePt: "Qual é a política de devolução / troca de vocês?",
        pronunciationHint: "'Policy' se pronuncia /ˈpɑː.lə.si/ com o primeiro 'o' aberto."
      }
    ]
  },
  {
    id: 'airport-immigration',
    title: 'Aeroporto & Imigração Internacional',
    category: 'travel',
    locationEmoji: '✈️',
    characterName: 'Officer Miller (Agente de Imigração)',
    characterRoleEn: 'U.S. Customs and Border Protection Officer at JFK Airport',
    characterRolePt: 'Agente de imigração e alfândega americana no aeroporto JFK',
    situationEn: 'You just arrived on an international flight from Brazil. You walk up to the immigration booth with your passport.',
    situationPt: 'Você acabou de pousar em um voo internacional vindo do Brasil. Você caminha até o guichê de imigração com seu passaporte.',
    initialBotGreetingEn: "Good afternoon. Please step up to the yellow line. Passport and boarding pass, please. What is the purpose of your visit to the United States?",
    initialBotGreetingPt: "Boa tarde. Por favor, aproxime-se até a linha amarela. Passaporte e cartão de embarque, por favor. Qual é o motivo da sua visita aos Estados Unidos?",
    goals: [
      {
        id: 'goal-purpose',
        descriptionEn: 'State the purpose of your trip clearly (Tourism, Tech Conference, Fellowship)',
        descriptionPt: 'Declarar o motivo da viagem (turismo, conferência de tecnologia ou evento cristão)'
      },
      {
        id: 'goal-duration',
        descriptionEn: 'State how long you will stay and where you will be staying (Hotel / Airbnb)',
        descriptionPt: 'Dizer quanto tempo ficará e onde se hospedará'
      },
      {
        id: 'goal-return',
        descriptionEn: 'Confirm return ticket and that you have nothing prohibited to declare',
        descriptionPt: 'Confirmar passagem de volta e que não traz nada proibido'
      }
    ],
    quickStartersEn: [
      "Good afternoon, Officer. Here is my passport.",
      "I am visiting for tourism and to attend a tech conference in San Francisco.",
      "I will be staying for 12 days at the Hilton Hotel.",
      "Here is my return ticket to São Paulo. I have nothing to declare."
    ],
    usefulPhrases: [
      {
        phraseEn: "I am here on vacation / for business",
        phrasePt: "Estou aqui de férias / a trabalho",
        pronunciationHint: "'Vacation' nos EUA é /veɪˈkeɪ.ʃən/."
      },
      {
        phraseEn: "I will be staying for two weeks",
        phrasePt: "Eu ficarei por duas semanas",
        pronunciationHint: "Conecte 'for two' naturalmente sem pausar."
      },
      {
        phraseEn: "I have nothing to declare",
        phrasePt: "Não tenho nada a declarar (na alfândega)",
        pronunciationHint: "'Declare' tem tonicidade na segunda sílaba: /dɪˈklɛr/."
      }
    ]
  },
  {
    id: 'hotel-checkin',
    title: 'Check-in no Hotel & Concierge',
    category: 'hotel',
    locationEmoji: '🏨',
    characterName: 'Daniel (Recepcionista do Hotel)',
    characterRoleEn: 'Front Desk Concierge at Grand Horizon Hotel',
    characterRolePt: 'Recepcionista e concierge do hotel Grand Horizon',
    situationEn: 'You arrive at your hotel after a long flight. You approach the front desk with your reservation details.',
    situationPt: 'Você chega ao hotel após uma longa viagem. Você se aproxima da recepção com os detalhes da reserva.',
    initialBotGreetingEn: "Good evening, welcome to the Grand Horizon! How was your journey today? Are you checking in with us?",
    initialBotGreetingPt: "Boa noite, bem-vindo ao Grand Horizon! Como foi sua viagem hoje? Está fazendo check-in conosco?",
    goals: [
      {
        id: 'goal-hotel-res',
        descriptionEn: 'Provide your name and confirmation for the reservation',
        descriptionPt: 'Informar seu nome e confirmar a reserva'
      },
      {
        id: 'goal-hotel-info',
        descriptionEn: 'Ask what time breakfast is served and request the Wi-Fi password',
        descriptionPt: 'Perguntar o horário do café da manhã e solicitar a senha do Wi-Fi'
      },
      {
        id: 'goal-hotel-request',
        descriptionEn: 'Ask for a quiet room on a higher floor or extra pillows/towels',
        descriptionPt: 'Pedir um quarto silencioso em andar alto ou toalhas/travesseiros extras'
      }
    ],
    quickStartersEn: [
      "Good evening! Yes, I have a reservation under Jonas Ribeiro.",
      "Is it possible to get a quiet room on a higher floor?",
      "What time is breakfast served in the morning?",
      "Could you please tell me the Wi-Fi network and password?"
    ],
    usefulPhrases: [
      {
        phraseEn: "I have a reservation under the name...",
        phrasePt: "Tenho uma reserva no nome de...",
        pronunciationHint: "'Reservation' -> /ˌrɛz.ərˈveɪ.ʃən/."
      },
      {
        phraseEn: "Is breakfast included in my stay?",
        phrasePt: "O café da manhã está incluso na minha estadia?",
        pronunciationHint: "'Included' tem a terminação /ɪd/ sonora: /ɪnˈkluː.dɪd/."
      },
      {
        phraseEn: "Could I request a late check-out?",
        phrasePt: "Eu poderia solicitar um check-out tardio?",
        pronunciationHint: "Ligue 'check-out' como /tʃɛk-aʊt/."
      }
    ]
  },
  {
    id: 'coffee-networking',
    title: 'Café & Networking Internacional (Tech & Fé)',
    category: 'social',
    locationEmoji: '☕',
    characterName: 'Mark (Engenheiro & Irmão de Fé)',
    characterRoleEn: 'Friendly Senior Developer attending an International Tech & Faith Meetup',
    characterRolePt: 'Engenheiro sênior americano em um café pós-evento de tecnologia',
    situationEn: 'During a coffee break at an international developer meetup, someone sits down next to you with a warm smile.',
    situationPt: 'Durante o coffee break de um encontro internacional de desenvolvedores, alguém se senta ao seu lado com um sorriso amigável.',
    initialBotGreetingEn: "Hey there! Mind if I take this seat? That last session on large-scale distributed systems and ethical AI was pretty mind-blowing. Are you working in tech as well?",
    initialBotGreetingPt: "Olá! Se importa se eu sentar aqui? Aquela última palestra sobre sistemas distribuídos e IA ética foi impressionante. Você também trabalha na área de tecnologia?",
    goals: [
      {
        id: 'goal-intro',
        descriptionEn: 'Introduce yourself, where you are from in Brazil, and your role in data / software',
        descriptionPt: 'Apresentar-se, dizer de onde é no Brasil e seu papel em dados / tecnologia'
      },
      {
        id: 'goal-topic',
        descriptionEn: 'Share an insight about your favorite tech stack or Christian perspective on work',
        descriptionPt: 'Compartilhar sua visão sobre tecnologias favoritas ou propósito de fé no trabalho'
      },
      {
        id: 'goal-connect',
        descriptionEn: 'Exchange LinkedIn profiles or suggest staying in touch',
        descriptionPt: 'Trocar contatos no LinkedIn ou sugerir manter contato'
      }
    ],
    quickStartersEn: [
      "Hi! Not at all, please have a seat! I'm Jonas from Brazil.",
      "I work in Data Science and Machine Learning. I really enjoyed the talk!",
      "I believe doing our best work is also a way of honoring God and helping people.",
      "Let's connect on LinkedIn! What is your handle?"
    ],
    usefulPhrases: [
      {
        phraseEn: "Mind if I join you?",
        phrasePt: "Se importa se eu me juntar a você?",
        pronunciationHint: "Frase muito comum em cafés: /maɪnd ɪf aɪ dʒɔɪn juː/."
      },
      {
        phraseEn: "I specialize in data pipelines and analytics",
        phrasePt: "Eu me especializo em pipelines de dados e analytics",
        pronunciationHint: "'Specialize' -> /ˈspɛʃ.ə.laɪz/."
      },
      {
        phraseEn: "It was a pleasure meeting you!",
        phrasePt: "Foi um prazer te conhecer!",
        pronunciationHint: "'Pleasure' tem o som suave de /ʒ/: /ˈplɛʒ.ər/."
      }
    ]
  }
];
