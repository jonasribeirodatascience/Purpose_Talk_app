import { VocabularyItem } from '../types';

export const INITIAL_VOCABULARY: VocabularyItem[] = [
  // Worship and Faith English
  {
    term: 'Grace',
    phonetic: '/ɡreɪs/',
    meaning: 'Graça imerecida, favor divino concedido sem mérito humano',
    example: 'For by grace you have been saved through faith.',
    category: 'worship'
  },
  {
    term: 'Redeemed',
    phonetic: '/rɪˈdiːmd/',
    meaning: 'Redimido, resgatado mediante um preço de amor',
    example: 'Let the redeemed of the Lord say so!',
    category: 'worship'
  },
  {
    term: 'Steadfast',
    phonetic: '/ˈstɛd.fæst/',
    meaning: 'Firme, inabalável, constante',
    example: 'The steadfast love of the Lord never ceases.',
    category: 'worship'
  },
  {
    term: 'Praise',
    phonetic: '/preɪz/',
    meaning: 'Louvor, exaltação, expressar admiração a Deus',
    example: 'I will praise You with all my heart in the sanctuary.',
    category: 'worship'
  },
  {
    term: 'Covenant',
    phonetic: '/ˈkʌv.ə.nənt/',
    meaning: 'Aliança sagrada, pacto eterno e inviolável',
    example: 'He remembers His covenant forever to a thousand generations.',
    category: 'worship'
  },
  {
    term: 'Anchor',
    phonetic: '/ˈæŋ.kər/',
    meaning: 'Âncora, fundamento seguro para a alma',
    example: 'We have this hope as an anchor for the soul, firm and secure.',
    category: 'worship'
  },

  // Tech and Data Science English
  {
    term: 'Pipeline',
    phonetic: '/ˈpaɪp.laɪn/',
    meaning: 'Fluxo sequencial automatizado de ingestão, transformação e carga de dados',
    example: 'We optimized our CI/CD pipeline to deploy in under 5 minutes.',
    category: 'tech'
  },
  {
    term: 'Trade-off',
    phonetic: '/ˈtreɪd.ɔːf/',
    meaning: 'Compensação ou escolha balanceada entre prós e contras',
    example: 'There is always a trade-off between consistency and availability in distributed systems.',
    category: 'tech'
  },
  {
    term: 'Overfitting',
    phonetic: '/ˌoʊ.vərˈfɪt.ɪŋ/',
    meaning: 'Sobreajuste do modelo estatístico/ML decorrente de ruídos nos dados',
    example: 'Our random forest showed severe overfitting on the training split.',
    category: 'tech'
  },
  {
    term: 'Deployment',
    phonetic: '/dɪˈplɔɪ.mənt/',
    meaning: 'Implantação ou publicação de software em ambiente de produção',
    example: 'The blue-green deployment ensured zero downtime for active users.',
    category: 'tech'
  },
  {
    term: 'Benchmark',
    phonetic: '/ˈbɛntʃ.mɑːrk/',
    meaning: 'Padrão de referência ou teste comparativo de performance',
    example: 'We ran a benchmark comparing PostgreSQL with ClickHouse for OLAP queries.',
    category: 'tech'
  },
  {
    term: 'Decouple',
    phonetic: '/diːˈkʌp.əl/',
    meaning: 'Desacoplar componentes para reduzir dependência direta',
    example: 'Event-driven queues help decouple our ingest services from storage.',
    category: 'tech'
  }
];
