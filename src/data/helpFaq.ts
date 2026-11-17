export type HelpCategoryId =
  | 'all'
  | 'primeiros_passos'
  | 'louvores_ia'
  | 'planos_mercadopago'
  | 'cookies_lgpd'
  | 'pwa_playstore';

export interface HelpFaqItem {
  id: string;
  category: Exclude<HelpCategoryId, 'all'>;
  question: string;
  answer: string;
  tags: string[];
}

export const HELP_CATEGORIES: Array<{ id: HelpCategoryId; label: string }> = [
  { id: 'all', label: 'Todos os Tópicos' },
  { id: 'primeiros_passos', label: 'Primeiros Passos' },
  { id: 'louvores_ia', label: 'Louvores & Pronúncia' },
  { id: 'planos_mercadopago', label: 'Planos & Mercado Pago' },
  { id: 'cookies_lgpd', label: 'Cookies & LGPD' },
  { id: 'pwa_playstore', label: 'Celular & Google Play' },
];

export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: 'faq-iniciante-portugues',
    category: 'primeiros_passos',
    question: 'Não sei nada de inglês ainda. O aplicativo é indicado para iniciantes?',
    answer:
      'Sim! Quando o nível Iniciante está selecionado, as primeiras interações com os mentores e avatares acontecem de forma acolhedora majoritariamente em Português (cerca de 85% português e 15% inglês com leitura facilitada). Conforme você avança nos turnos, o inglês é introduzido aos poucos, sem pressão.',
    tags: ['iniciante', 'português', 'acolhimento', 'nível'],
  },
  {
    id: 'faq-salvar-progresso',
    category: 'primeiros_passos',
    question: 'Como faço para não perder meu XP, flashcards e ofensiva (streak)?',
    answer:
      'Você pode praticar imediatamente no navegador e, quando quiser sincronizar tudo na nuvem, basta abrir Configurações e entrar com sua conta Google. Todo o seu XP, vocabulário salvo, repetição espaçada, medalhas e assinatura ficam protegidos no Cloud Firestore.',
    tags: ['google', 'conta', 'nuvem', 'firestore', 'streak', 'xp'],
  },
  {
    id: 'faq-flashcards-srs',
    category: 'primeiros_passos',
    question: 'Como funciona o modo Flashcards com repetição espaçada?',
    answer:
      'Na aba Vocabulário, clique em "Modo Flashcards". Cada palavra salva exibe o termo em inglês com áudio e fonética na frente e o significado/exemplo no verso. Ao avaliar se achou "Difícil", "Bom" ou "Fácil", o algoritmo SM-2 agenda automaticamente o melhor dia para você revisar antes de esquecer.',
    tags: ['flashcards', 'vocabulário', 'memorização', 'sm-2', 'revisão'],
  },
  {
    id: 'faq-louvores-catalogo',
    category: 'louvores_ia',
    question: 'Quantos louvores existem e como funcionam a pronúncia falada e cantada?',
    answer:
      'O catálogo conta com 148 louvores selecionados — incluindo clássicos e sucessos de Maverick City Music, Hillsong Worship, Bethel Music, Elevation Worship e Chris Tomlin. Ao escolher uma música, você vê o significado linha por linha em português, a "Pronúncia Falada" (como brasileiros falam no dia a dia) e a "Pronúncia Cantada" (com ligações musicais e marcas de ritmo "♩"). Se quiser analisar qualquer outra letra, use o analisador por IA na própria aba Louvores.',
    tags: ['louvores', 'maverick city', 'cantada', 'falada', 'música', '148'],
  },
  {
    id: 'faq-microfone-permissao',
    category: 'louvores_ia',
    question: 'O reconhecimento de voz não captou meu microfone. Como resolver?',
    answer:
      'Verifique se concedeu permissão de microfone ao navegador clicando no ícone de cadeado ao lado da barra de endereço. Recomendamos Chrome, Edge ou Android WebView atualizado. Se estiver no computador sem microfone, você também pode digitar suas frases ou clicar em "Pular etapa" a qualquer momento.',
    tags: ['microfone', 'voz', 'pronúncia', 'permissão', 'áudio'],
  },
  {
    id: 'faq-velocidade-sotaque',
    category: 'louvores_ia',
    question: 'Posso deixar a fala da IA mais devagar ou escolher sotaque americano/britânico?',
    answer:
      'Sim. Em Configurações > Áudio, Voz da IA e Aparência você ajusta a velocidade (0.8x Lento, 1.0x Normal, 1.2x Nativo) e escolhe entre perfis com sotaque americano (en-US) ou britânico (en-GB).',
    tags: ['velocidade', 'sotaque', 'voz', 'en-US', 'en-GB'],
  },
  {
    id: 'faq-trial-7-dias',
    category: 'planos_mercadopago',
    question: 'Como funciona o teste grátis de 7 dias com cadastro de cartão de crédito?',
    answer:
      'Ao escolher um plano (Essencial Mensal R$ 39,90, Pro Mensal R$ 59,90 ou Pro Anual R$ 478,80), você cadastra um Cartão de Crédito válido. No ato do cadastro é feita apenas uma validação de segurança e pré-autorização temporária (cancelada imediatamente, sem cobrança efetiva) para confirmar cartão ativo e com limite. Você tem 7 dias completos para usar tudo; se cancelar antes do 7º dia em Configurações > Planos, nada será cobrado.',
    tags: ['7 dias grátis', 'trial', 'preço', 'planos', 'cancelamento', 'cartão de crédito'],
  },
  {
    id: 'faq-mercadopago-seguranca',
    category: 'planos_mercadopago',
    question: 'Meus dados de cartão ficam seguros? Como o Mercado Pago valida e processa?',
    answer:
      'Sim. O Purpose Talk nunca armazena o número completo do cartão, CPF nem o código de segurança (CVV) em seu banco de dados — mantemos apenas metadados mascarados (bandeira e 4 últimos dígitos). A tokenização, validação antifraude, verificação de limite por pré-autorização (R$ 0,00 efetivo) e a cobrança recorrente após os 7 dias são intermediadas diretamente pelo Mercado Pago.',
    tags: ['mercado pago', 'segurança', 'cvv', 'cartão de crédito', 'validação'],
  },
  {
    id: 'faq-criador-recebimento',
    category: 'planos_mercadopago',
    question: 'Sou o criador do app: onde cai o valor das assinaturas e como conecto minha conta Mercado Pago?',
    answer:
      'Os valores pagos pelos assinantes após os 7 dias caem diretamente na conta Mercado Pago vinculada à sua aplicação de desenvolvedor, podendo ser transferidos via PIX para qualquer banco. Para ativar em produção, adicione MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_WEBHOOK_SECRET nos Secrets do servidor e cadastre a URL /api/billing/webhook/mercadopago no painel Mercado Pago Developers (veja o guia passo a passo completo no Painel do Criador).',
    tags: ['criador', 'webhook', 'access token', 'recebimento', 'saldo'],
  },
  {
    id: 'faq-cookies-aceite',
    category: 'cookies_lgpd',
    question: 'Para que servem os cookies e o armazenamento local no Purpose Talk?',
    answer:
      'Usamos armazenamento essencial para manter seu login seguro, o app offline (PWA) funcionando e lembrar seu aceite LGPD. Cookies opcionais guardam seu tema visual, velocidade de voz, flashcards e preferências de notificação. Não vendemos seus dados nem exibimos anúncios rastreados.',
    tags: ['cookies', 'armazenamento', 'privacidade', 'anúncios'],
  },
  {
    id: 'faq-lgpd-portabilidade',
    category: 'cookies_lgpd',
    question: 'Como posso exportar meus dados ou revogar meu consentimento LGPD?',
    answer:
      'Você pode clicar em "Privacidade & Cookies" no rodapé ou abrir Configurações > Conta, Planos, Pagamentos & LGPD. Lá é possível baixar uma cópia completa dos seus dados em formato JSON (Art. 18, V da LGPD), personalizar categorias de cookies ou revogar o consentimento a qualquer instante.',
    tags: ['lgpd', 'json', 'portabilidade', 'revogar', 'dpo'],
  },
  {
    id: 'faq-push-streak',
    category: 'pwa_playstore',
    question: 'Como ativar lembretes diários para não perder minha ofensiva (streak)?',
    answer:
      'Em Configurações > Progresso & Lembretes Diários, abra "Lembretes Push", escolha seu horário preferido e conceda permissão de notificação ao navegador usando Firebase Cloud Messaging. Se chegar no horário escolhido e você ainda não tiver praticado naquele dia, o app enviará um lembrete gentil.',
    tags: ['notificações', 'push', 'fcm', 'streak', 'lembrete'],
  },
  {
    id: 'faq-instalar-pwa',
    category: 'pwa_playstore',
    question: 'Posso instalar o Purpose Talk no celular como aplicativo antes mesmo da loja?',
    answer:
      'Sim! O Purpose Talk é um Progressive Web App (PWA) completo. No Android/Chrome, clique em "Instalar App" no topo da página ou no menu do navegador ("Adicionar à tela inicial"). No iPhone (Safari), toque em Compartilhar e depois em "Adicionar à Tela de Início". Ele abre em tela cheia e funciona mesmo offline para revisão.',
    tags: ['instalar', 'pwa', 'android', 'iphone', 'ios', 'offline'],
  },
  {
    id: 'faq-google-play-twa',
    category: 'pwa_playstore',
    question: 'O aplicativo está preparado para publicação na Google Play Store?',
    answer:
      'Sim. O projeto já inclui Web App Manifest completo, ícones PNG (192x192, 512x512, maskable e Apple Touch), Service Worker offline, Política de Privacidade/Cookies exigida pelo Google Play e o arquivo .well-known/assetlinks.json para empacotamento em Trusted Web Activity (TWA) via PWABuilder ou Bubblewrap.',
    tags: ['google play', 'play store', 'twa', 'aab', 'pwabuilder', 'assetlinks'],
  },
];
