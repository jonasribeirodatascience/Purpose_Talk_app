import { TechScenario } from '../types';

export const TECH_SCENARIOS: TechScenario[] = [
  {
    id: 'scrum-standup-data-eng',
    type: 'daily_standup',
    title: 'Daily Standup - Data Engineering & Pipelines',
    roleTitle: 'Data Engineer / Analytics Engineer',
    contextEn: 'You are in the morning Scrum with your distributed team in the US and Europe. It is your turn to give your 60-second update.',
    contextPt: 'Você está no Scrum matinal com seu time internacional nos EUA e Europa. É a sua vez de dar sua atualização de 60 segundos.',
    promptQuestionEn: 'What did you complete yesterday, what are you tackling today, and are there any blockers?',
    starterHintPt: 'Use a estrutura clássica: "Yesterday I worked on... Today I plan to... As for blockers, I am currently..."',
    sampleAnswerEn: 'Yesterday, I finished refactoring the automated ETL pipeline in Databricks and addressed the schema mismatch issue in our staging database. Today, I am setting up the Airflow DAGs for the new customer churn model and running validation tests. No blockers on my end, but I will need a quick review from Sarah on PR #214.',
    keyVocabulary: [
      { term: 'Tackle', meaning: 'Enfrentar / lidar com uma tarefa', context: 'Today I will tackle the caching layer.' },
      { term: 'Blocker / Impediment', meaning: 'Impedimento ou trava que impede o progresso', context: 'I have no blockers, but I need API access.' },
      { term: 'On my end', meaning: 'Do meu lado / da minha parte', context: 'Everything looks green on my end.' },
      { term: 'Spin up', meaning: 'Inicializar / criar uma instância de servidor ou container', context: 'We need to spin up a new Redis cluster.' }
    ]
  },
  {
    id: 'interview-ml-explanation',
    type: 'job_interview',
    title: 'Tech Interview - Explaining Machine Learning & Impact',
    roleTitle: 'Senior Data Scientist / ML Engineer',
    contextEn: 'The interviewer asks: "Can you explain a real machine learning or data science project you led and how you validated the business results?"',
    contextPt: 'O recrutador pergunta: "Você pode explicar um projeto real de machine learning ou ciência de dados que você liderou e como validou os resultados de negócio?"',
    promptQuestionEn: 'Describe your model, metrics chosen (e.g., F1-score, AUC-ROC, latency), and the tangible impact on the product.',
    starterHintPt: 'Aplique o método STAR: Situation (Situação), Task (Tarefa), Action (Ação com modelos/dados), Result (Resultado mensurável).',
    sampleAnswerEn: 'At my previous company, customer churn was around 8% monthly. I led an initiative to build a predictive XGBoost classifier using historical usage logs. Because false negatives were costly, we optimized for high recall while keeping precision above 78%. We deployed the model via FastAPI microservices on AWS with Docker. The pilot campaign reduced churn by 22% in the first quarter, saving roughly $150k in recurring revenue.',
    keyVocabulary: [
      { term: 'Trade-off', meaning: 'Compensação / equilíbrio entre duas decisões opostas', context: 'There is a trade-off between model complexity and inference latency.' },
      { term: 'Actionable insight', meaning: 'Descoberta ou métrica que permite tomar ação prática', context: 'The dashboard gives actionable insights to the marketing team.' },
      { term: 'Latency vs Throughput', meaning: 'Tempo de resposta vs volume de requisições por segundo', context: 'Our microservice handles high throughput with sub-50ms latency.' },
      { term: 'Overfitting', meaning: 'Sobreajuste do modelo aos dados de treino', context: 'We applied dropout and regularization to prevent overfitting.' }
    ]
  },
  {
    id: 'pr-code-review',
    type: 'code_review',
    title: 'Code Review & PR Discussion',
    roleTitle: 'Full-Stack / Backend Engineer',
    contextEn: 'You are reviewing a colleague\'s Pull Request that has potential performance bottlenecks and unhandled async error states.',
    contextPt: 'Você está revisando o Pull Request de um colega que possui possíveis gargalos de desempenho e erros assíncronos não tratados.',
    promptQuestionEn: 'How do you politely and constructively point out the performance issue and suggest an asynchronous batch approach?',
    starterHintPt: 'Em inglês, feedback técnico é gentil e colaborativo. Use "Could we consider...", "I wonder if...", "What do you think about..."',
    sampleAnswerEn: 'Great work on this implementation! The logic is super clean. I noticed that inside the loop on line 42, we are making individual database queries, which might cause an N+1 query bottleneck as our user base grows. Could we consider batching these requests or using a bulk insert operation? Also, what do you think about wrapping the third-party API call in a try/catch block with exponential backoff?',
    keyVocabulary: [
      { term: 'Bottleneck', meaning: 'Gargalo de processamento ou desempenho', context: 'The database connection pool became our main bottleneck.' },
      { term: 'LGTM', meaning: 'Looks Good To Me (Aprovado / Parece bom para mim)', context: 'Left two minor comments, otherwise LGTM!' },
      { term: 'Edge case', meaning: 'Caso limite / cenário raro ou extremo', context: 'Make sure we write a unit test for this edge case.' },
      { term: 'Deprecate', meaning: 'Descontinuar ou marcar como obsoleto', context: 'We are deprecating the legacy v1 endpoint next sprint.' }
    ]
  },
  {
    id: 'system-design-cloud',
    type: 'system_design',
    title: 'System Design - Scalability & High Availability',
    roleTitle: 'Cloud Architect / Solutions Engineer',
    contextEn: 'Your team is architecting an event-driven system that handles sudden traffic spikes during live stream events.',
    contextPt: 'Seu time está desenhando um sistema orientado a eventos que precisa suportar picos repentinos de tráfego durante transmissões ao vivo.',
    promptQuestionEn: 'Explain how you would decouple the frontend ingestion from the backend workers using a message queue and caching.',
    starterHintPt: 'Mencione componentes como: load balancer, message broker (Kafka/RabbitMQ/SQS), in-memory cache (Redis), autoscaling.',
    sampleAnswerEn: 'To prevent database degradation during peak traffic, I recommend decoupling the ingestion layer from background workers using Apache Kafka or AWS SQS. Incoming events hit a distributed API gateway behind an Application Load Balancer. We immediately write events to the queue and return a 202 Accepted status with low latency. Consumer workers can then ingest and process messages asynchronously at a controlled pace, with Redis acting as a write-through cache for live view counts.',
    keyVocabulary: [
      { term: 'Decouple', meaning: 'Desacoplar serviços / componentes independentes', context: 'Using queues allows us to decouple producers from consumers.' },
      { term: 'Fault-tolerant', meaning: 'Tolerante a falhas / resiliente', context: 'Our Kubernetes cluster is designed to be fully fault-tolerant.' },
      { term: 'Scale out / In', meaning: 'Escalabilidade horizontal (adicionar mais máquinas)', context: 'The service automatically scales out when CPU exceeds 70%.' },
      { term: 'Idempotent', meaning: 'Operação idempotente (mesmo resultado se repetida)', context: 'Payment webhooks must be strictly idempotent.' }
    ]
  }
];

export const FALSE_FRIENDS_TECH = [
  {
    word: 'Actually',
    wrongUsage: 'Não significa "atualmente"',
    correctMeaning: 'Significa "na verdade", "de fato", "realmente".',
    tip: 'Para dizer "atualmente" em inglês, use: "Currently" ou "Nowadays".',
    example: 'Actually, the bug is in the authentication middleware, not the database.'
  },
  {
    word: 'Pretend',
    wrongUsage: 'Não significa "pretender / ter intenção"',
    correctMeaning: 'Significa "fingir".',
    tip: 'Para "pretender", use: "Intend" ou "Plan to".',
    example: 'I intend to deploy the new microservice this Friday.'
  },
  {
    word: 'Resume',
    wrongUsage: 'Não significa "resumo"',
    correctMeaning: 'Significa "currículo profissional" (ou o verbo "retomar").',
    tip: 'Para dizer "resumo" em inglês, use: "Summary" ou "Abstract".',
    example: 'Please send your resume in PDF format to the hiring manager.'
  },
  {
    word: 'Attend',
    wrongUsage: 'Não significa "atender o telefone" ou "prestar serviço"',
    correctMeaning: 'Significa "comparecer", "assistir presencialmente a uma reunião/evento".',
    tip: 'Para "atender um cliente", use "Serve" ou "Assist". Para "atender telefone", use "Answer".',
    example: 'I need to attend our architectural sync meeting at 3 PM.'
  },
  {
    word: 'Notice',
    wrongUsage: 'Não significa "notícia de jornal"',
    correctMeaning: 'Significa "notar", "perceber", ou "aviso prévio".',
    tip: 'Para "notícia de jornal", use "News" ou "News report".',
    example: 'Did you notice any memory leaks after running the stress test?'
  }
];
