export const LEGAL_TERMS_VERSION = '2026.1';
export const PRIVACY_POLICY_VERSION = '2026.1';
export const LEGAL_LAST_UPDATED_PT = '16 de novembro de 2026';

export const DATA_CONTROLLER_INFO = {
  brandName: 'Purpose Talk',
  controllerName: 'Purpose Talk Educação e Tecnologia (Jonas Ribeiro)',
  dpoEmail: 'crescimentopp02@gmail.com',
  country: 'República Federativa do Brasil',
  applicableLaw: 'Lei nº 13.709/2018 (LGPD), Lei nº 12.965/2014 (Marco Civil da Internet) e Lei nº 8.078/1990 (Código de Defesa do Consumidor)',
};

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_OF_USE_SECTIONS: LegalSection[] = [
  {
    id: 'objeto-aceite',
    title: '01. Objeto e Aceitação dos Termos',
    paragraphs: [
      'Estes Termos de Uso regulam o acesso e a utilização da plataforma Purpose Talk, um ambiente educacional interativo voltado ao aprendizado prático da língua inglesa com foco em conversação por IA, louvores cristãos (Worship) e carreira em tecnologia e ciência de dados.',
      'Ao criar uma conta, utilizar os módulos gratuitos ou iniciar uma assinatura com período de teste grátis, você declara ter lido, compreendido e aceito integralmente estes Termos de Uso e a Política de Privacidade e Proteção de Dados (LGPD).',
    ],
  },
  {
    id: 'cadastro-elegibilidade',
    title: '02. Cadastro, Conta Google e Elegibilidade',
    paragraphs: [
      'A sincronização em nuvem é realizada mediante autenticação via Google Firebase Authentication. Você é responsável por manter a segurança da sua conta Google e pela veracidade das informações fornecidas.',
      'O uso por menores de 18 (dezoito) anos requer ciência e supervisão de pais ou responsáveis legais, nos termos do Art. 14 da LGPD e do Estatuto da Criança e do Adolescente.',
    ],
  },
  {
    id: 'planos-trial-pagamentos',
    title: '03. Planos, 7 Dias Grátis Iniciais e Cobrança',
    paragraphs: [
      'O Purpose Talk oferece planos de assinatura recorrente com período inicial de 7 (sete) dias gratuitos mediante o cadastro e validação prévia de um Cartão de Crédito ativo e com limite disponível vinculado ao gateway autorizado:',
    ],
    bullets: [
      'Plano Essencial Mensal: R$ 39,90/mês após os 7 dias grátis iniciais.',
      'Plano Purpose Pro Mensal: R$ 59,90/mês após os 7 dias grátis iniciais.',
      'Plano Purpose Pro Anual: R$ 478,80/ano (equivalente a R$ 39,90/mês) após os 7 dias grátis iniciais.',
      'Validação sem cobrança efetiva (R$ 0,00 na fatura): no cadastro realizamos uma verificação de segurança e pré-autorização temporária de baixo valor para confirmar que o Cartão de Crédito é válido e possui limite ativo, estornando/cancelando imediatamente na sequência para manter os 7 dias grátis sem cobrança.',
      'Processamento seguro: os pagamentos são intermediados por gateway certificado (Mercado Pago). O Purpose Talk nunca armazena o número completo do cartão (PAN), CPF bruto nem o código de segurança (CVV).',
      'Direito de arrependimento: em compras à distância após conversão em plano pago, aplica-se o direito de arrependimento de até 7 dias corridos previsto no Art. 49 do Código de Defesa do Consumidor.',
    ],
  },
  {
    id: 'ia-voz-educacional',
    title: '04. Uso de Inteligência Artificial e Reconhecimento de Voz',
    paragraphs: [
      'As correções gramaticais, análises de pronúncia em tempo real e simulações de diálogos são geradas com apoio de modelos de inteligência artificial e reconhecimento de fala do navegador.',
      'O conteúdo tem finalidade estritamente educacional e de treinamento linguístico, não constituindo aconselhamento jurídico, financeiro, médico ou teológico oficial.',
    ],
  },
  {
    id: 'propriedade-conduta',
    title: '05. Propriedade Intelectual e Condutas Vedadas',
    paragraphs: [
      'A marca Purpose Talk, código-fonte, fluxos pedagógicos, design, trilhas de aprendizado e bancos de exercícios são protegidos pela legislação de propriedade intelectual.',
      'É proibido realizar engenharia reversa, raspagem automatizada de dados, exploração abusiva das APIs de IA ou tentativas de burlar as regras de segurança e limites de XP/assinatura.',
    ],
  },
  {
    id: 'alteracoes-foro',
    title: '06. Atualizações dos Termos e Foro Aplicável',
    paragraphs: [
      'Estes Termos podem ser atualizados para refletir melhorias pedagógicas, novos meios de pagamento ou adequações regulatórias. Sempre que houver alteração relevante na versão vigente, será solicitado novo aceite transparente no aplicativo.',
      'Estes Termos são regidos pelas leis da República Federativa do Brasil, ficando eleito o foro do domicílio do usuário consumidor no Brasil para dirimir eventuais controvérsias.',
    ],
  },
];

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: 'controlador-escopo',
    title: '01. Identificação do Controlador e Compromisso LGPD',
    paragraphs: [
      `Esta Política de Privacidade e Proteção de Dados descreve como o ${DATA_CONTROLLER_INFO.controllerName} trata os dados pessoais dos usuários em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).`,
      `Encarregado pelo Tratamento de Dados Pessoais (DPO): ${DATA_CONTROLLER_INFO.dpoEmail}.`,
    ],
  },
  {
    id: 'dados-coletados',
    title: '02. Quais Dados Pessoais Coletamos',
    paragraphs: [
      'Aplicamos o princípio da minimização (Art. 6º, III, LGPD), coletando apenas os dados estritamente necessários ao funcionamento educacional e financeiro da plataforma:',
    ],
    bullets: [
      'Dados de Conta (via Google OAuth): identificador único (UID), nome de exibição, e-mail verificado e URL da foto de perfil (armazenados de forma isolada em subcoleção privada).',
      'Dados Pedagógicos e de Progresso: nível de inglês, foco de estudo, XP acumulado, ofensiva (streak), histórico de atividade diária, caderno de vocabulário pessoal e medalhas desbloqueadas.',
      'Dados de Áudio e Pronúncia: o áudio captado pelo microfone é processado para transcrever sua fala e destacar palavras que precisam de ajuste na pronúncia. Não mantemos arquivo de áudio bruto após o processamento da sessão.',
      'Metadados de Pagamento (PCI-Safe): armazenamos apenas rótulo mascarado, últimos 4 dígitos do cartão de crédito, bandeira e mês/ano de validade. Nunca armazenamos número completo do cartão, CPF bruto nem CVV.',
      'Registros de Consentimento LGPD: versão dos termos/política aceita, data/hora do aceite e preferência opcional de comunicações.',
    ],
  },
  {
    id: 'bases-legais',
    title: '03. Finalidades e Bases Legais (Art. 7º da LGPD)',
    paragraphs: [
      'Cada operação de tratamento possui base legal específica:',
    ],
    bullets: [
      'Execução de contrato ou procedimentos preliminares (Art. 7º, V): autenticação da conta, salvamento de progresso, gestão de planos, período grátis de 7 dias e cobrança via gateway.',
      'Consentimento explícito do titular (Art. 7º, I): acesso ao microfone para análise de fala em tempo real, registro de preferências visuais/pedagógicas e eventual envio de novidades educacionais (opt-in livre).',
      'Cumprimento de obrigação legal ou regulatória (Art. 7º, II): manutenção de registros fiscais, comprovação de aceite de termos e logs de transações exigidos por lei.',
      'Legítimo interesse e proteção do crédito/segurança (Art. 7º, IX e X): prevenção a fraudes, bloqueio de adulteração de XP/preços nas regras de banco de dados e integridade da plataforma.',
    ],
  },
  {
    id: 'compartilhamento-operadores',
    title: '04. Compartilhamento e Transferência Internacional',
    paragraphs: [
      'Não vendemos, alugamos ou comercializamos seus dados pessoais. O compartilhamento ocorre apenas com operadores tecnológicos essenciais à prestação do serviço:',
    ],
    bullets: [
      'Google Firebase (Authentication e Cloud Firestore): infraestrutura em nuvem protegida por regras de segurança baseadas em UID, verificação de e-mail e isolamento de PII.',
      'Google Gemini API: processamento das mensagens de texto enviadas voluntariamente nos chats e roleplays para retorno pedagógico.',
      'Gateways de Pagamento (Mercado Pago e Stripe): processamento de assinaturas, webhooks e verificação antifraude diretamente em ambiente certificado PCI-DSS.',
    ],
  },
  {
    id: 'cookies-localstorage',
    title: '05. Armazenamento Local (localStorage) e Preferências',
    paragraphs: [
      'Utilizamos armazenamento local estritamente funcional no navegador para lembrar seu tema visual (escuro ou claro de alto contraste), velocidade de fala, vocabulário offline e o registro do seu aceite LGPD.',
      'Você pode gerenciar ou revogar consentimentos opcionais diretamente no modal "Privacidade & LGPD" no cabeçalho ou rodapé do aplicativo.',
    ],
  },
  {
    id: 'direitos-titular',
    title: '06. Seus Direitos como Titular dos Dados (Art. 18 da LGPD)',
    paragraphs: [
      'A qualquer momento e de forma gratuita, você pode exercer seus direitos garantidos pela LGPD:',
    ],
    bullets: [
      'Confirmação da existência de tratamento e acesso completo aos seus dados armazenados.',
      'Correção de dados incompletos, inexatos ou desatualizados.',
      'Portabilidade dos seus dados em formato estruturado (disponível pelo botão "Baixar Meus Dados (JSON)" dentro do painel LGPD).',
      'Revogação do consentimento a qualquer momento, com registro imediato no banco de dados.',
      'Eliminação dos dados pessoais tratados com consentimento ou encerramento da conta mediante solicitação ao DPO pelo e-mail crescimentopp02@gmail.com.',
    ],
  },
  {
    id: 'seguranca-retencao',
    title: '07. Segurança da Informação e Prazo de Retenção',
    paragraphs: [
      'Adotamos criptografia em trânsito (HTTPS/TLS), isolamento de subcoleções privadas no Cloud Firestore, validação rigorosa de esquema no servidor e políticas de acesso restrito apenas ao proprietário autenticado.',
      'Seus dados educacionais permanecem armazenados enquanto sua conta estiver ativa. Registros de consentimento e transações financeiras podem ser retidos pelo prazo legal aplicável para cumprimento de obrigações regulatórias.',
    ],
  },
];

export const COOKIE_POLICY_VERSION = '2026.1';

export interface CookieCategoryInfo {
  id: 'essential' | 'preferences' | 'analyticsAndProduct' | 'marketing';
  title: string;
  required: boolean;
  description: string;
  examples: string[];
}

export const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    id: 'essential',
    title: 'Cookies e Armazenamento Estritamente Essenciais',
    required: true,
    description:
      'Necessários para autenticação segura via Firebase Authentication, proteção contra fraudes no checkout, funcionamento offline (PWA Service Worker) e registro da sua escolha de cookies e LGPD.',
    examples: [
      'firebaseLocalStorageDb (sessão autenticada)',
      'purpose_talk_cookie_consent_v1',
      'purpose_talk_lgpd_consent_v1',
    ],
  },
  {
    id: 'preferences',
    title: 'Cookies de Preferências Pedagógicas e Acessibilidade',
    required: false,
    description:
      'Lembram seu nível de inglês (Iniciante/Intermediário/Avançado), foco de estudo, tema claro/escuro, velocidade de fala e configurações dos perfis de voz da IA.',
    examples: [
      'purpose_talk_theme',
      'faith_tech_level',
      'faith_tech_rate',
      'purpose_talk_push_prefs_v1',
    ],
  },
  {
    id: 'analyticsAndProduct',
    title: 'Armazenamento de Evolução e Desempenho do Produto',
    required: false,
    description:
      'Permite manter em cache local seus flashcards (SM-2), ofensiva (streak), histórico dos últimos 30 dias e funcionamento contínuo mesmo com oscilação de internet.',
    examples: [
      'faith_tech_vocab',
      'purpose_talk_daily_activity_v1',
      'purpose_talk_achievements',
    ],
  },
  {
    id: 'marketing',
    title: 'Comunicações Educacionais e Campanhas',
    required: false,
    description:
      'Utilizado apenas se você autorizar expressamente o recebimento de novidades sobre novos louvores, trilhas ou condições promocionais de assinatura.',
    examples: ['purpose_talk_marketing_optin'],
  },
];

export const COOKIE_POLICY_SECTIONS: LegalSection[] = [
  {
    id: 'o-que-sao-cookies',
    title: '01. O que são Cookies e Armazenamento Local?',
    paragraphs: [
      'Cookies e tecnologias equivalentes de armazenamento no navegador (como localStorage, IndexedDB e Cache Storage do PWA) são pequenos registros salvos no seu dispositivo para manter o Purpose Talk rápido, seguro e personalizado.',
      'Esta Política de Cookies complementa a Política de Privacidade (LGPD) e explica com total transparência o que armazenamos e como você pode aceitar, personalizar ou revogar permissões a qualquer momento.',
    ],
  },
  {
    id: 'categorias-utilizadas',
    title: '02. Categorias de Cookies que Utilizamos',
    paragraphs: [
      'Não utilizamos cookies invasivos de rastreamento publicitário de terceiros nem vendemos perfis de navegação.',
    ],
    bullets: [
      'Estritamente Essenciais (sempre ativos): garantem login seguro Google/Firebase, integridade do checkout Mercado Pago/Stripe, cache offline do PWA e memorização das suas escolhas de privacidade.',
      'Preferências de Aprendizagem (opcional): guardam idioma acolhedor inicial, velocidade da fala, sotaque escolhido (US/UK) e tema de contraste (escuro ou claro).',
      'Progresso Offline e Repetição Espaçada (opcional): mantêm seus flashcards, louvores favoritos e ofensiva diária acessíveis instantaneamente no dispositivo.',
      'Comunicações e Novidades (opcional): habilitado somente mediante seu aceite livre para receber avisos de novos recursos e conteúdos.',
    ],
  },
  {
    id: 'terceiros-cookies',
    title: '03. Tecnologias de Terceiros Envolvidas',
    paragraphs: [
      'Quando você utiliza recursos específicos de conta, notificações ou pagamento, os respectivos operadores aplicam seus controles técnicos de segurança:',
    ],
    bullets: [
      'Google Firebase (Auth, Firestore e Cloud Messaging): tokens técnicos de sessão e identificador de notificação Web Push quando autorizado.',
      'Mercado Pago / Stripe: cookies antifraude estritamente necessários no momento em que você prossegue para o pagamento ou cadastro de meio de pagamento.',
    ],
  },
  {
    id: 'gestao-revogacao',
    title: '04. Como Gerenciar ou Revogar seu Aceite de Cookies',
    paragraphs: [
      'Você tem controle total sobre os cookies não essenciais. Basta clicar em "Política de Cookies" no rodapé da Landing Page, dentro do aplicativo ou em Configurações para ajustar suas preferências ou voltar para "Apenas Essenciais".',
      'Você também pode limpar ou bloquear cookies diretamente nas configurações do navegador (Chrome, Safari, Edge ou Firefox); contudo, a desativação de itens essenciais pode impedir a sincronização da conta Google.',
    ],
  },
];

