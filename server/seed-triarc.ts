// Seed: serviços e projetos reais da Triarc Solutions
import { getDb } from "./db";
import { triacContent } from "../drizzle/schema";

export const TRIARC_SERVICES = [
  {
    type: "servico" as const,
    name: "Gestão Empresarial",
    subtitle: "Consultoria em Gestão",
    description: "Consultoria em gestão empresarial para otimização de processos e estratégias. Análise de processos, planejamento estratégico, otimização de operações, gestão de projetos, compliance e negociação estratégica.",
    category: "Gestão",
    technologies: JSON.stringify(["Gestão de Projetos", "MS Project", "Compliance", "Planejamento Estratégico"]),
    highlights: JSON.stringify(["Planejamento estratégico", "Otimização de operações", "Gestão de fornecedores", "Auditoria de contratos"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Suporte Técnico em TI",
    subtitle: "Manutenção e Infraestrutura",
    description: "Suporte técnico, manutenção preditiva e serviços especializados em tecnologia da informação. Monitoramento de infraestrutura, gestão de problemas, suporte remoto e presencial.",
    category: "TI",
    technologies: JSON.stringify(["Manutenção Preditiva", "Monitoramento", "Suporte Remoto", "Análise de Performance"]),
    highlights: JSON.stringify(["Manutenção preditiva", "Suporte 24/7", "Monitoramento contínuo", "Análise de falhas"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Desenvolvimento Sob Encomenda",
    subtitle: "Software Personalizado",
    description: "Desenvolvimento de sistemas web, aplicações mobile e sistemas de gestão personalizados. Criação de IAs, agentes especialistas e automações sob medida para sua empresa.",
    category: "Desenvolvimento",
    technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "IA/ML", "Mobile"]),
    highlights: JSON.stringify(["Sistemas web personalizados", "Apps mobile", "Criação de IAs", "Agentes especialistas"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Inteligência Artificial e Automação",
    subtitle: "IA Aplicada ao Negócio",
    description: "Soluções avançadas em IA, automação e agentes especialistas. Machine Learning aplicado, processamento de linguagem natural, sistemas de recomendação e automação de fluxos de trabalho.",
    category: "IA & Automação",
    technologies: JSON.stringify(["OpenAI API", "Machine Learning", "NLP", "Automação", "Agentes IA"]),
    highlights: JSON.stringify(["IAs personalizadas", "Agentes especialistas", "Automação de fluxos", "ML aplicado"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Automação Industrial",
    subtitle: "Processos Industriais Inteligentes",
    description: "Soluções de automação para processos industriais e operacionais. Sistemas SCADA, integração de equipamentos, monitoramento industrial e otimização de produção.",
    category: "Industrial",
    technologies: JSON.stringify(["SCADA", "Automação Industrial", "Controle de Processos", "IoT", "N8N"]),
    highlights: JSON.stringify(["Automação de processos", "Sistemas SCADA", "Integração de equipamentos", "Otimização de produção"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Treinamento Profissional",
    subtitle: "Capacitação e Desenvolvimento",
    description: "Treinamento em desenvolvimento profissional e gerencial. Capacitação técnica, workshops especializados, programas de mentoria e desenvolvimento de lideranças.",
    category: "Treinamento",
    technologies: JSON.stringify(["E-learning", "Workshops", "Mentoria", "Capacitação Técnica"]),
    highlights: JSON.stringify(["Capacitação técnica", "Desenvolvimento gerencial", "Workshops especializados", "Programas de mentoria"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Licenciamento de Software",
    subtitle: "Software Proprietário",
    description: "Desenvolvimento e licenciamento de programas de computador. Software proprietário, distribuição, atualizações, suporte técnico especializado e auditoria de licenças.",
    category: "Software",
    technologies: JSON.stringify(["Software Proprietário", "SaaS", "Licenciamento", "Distribuição"]),
    highlights: JSON.stringify(["Software proprietário", "Receita recorrente", "Suporte especializado", "Auditoria de licenças"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Data Science e Analytics",
    subtitle: "Inteligência de Dados",
    description: "Análise de dados, Business Intelligence e visualizações estratégicas. Dashboards interativos, relatórios automatizados e insights acionáveis para tomada de decisão.",
    category: "Dados",
    technologies: JSON.stringify(["Python", "Power BI", "SQL", "Machine Learning", "Visualização de Dados"]),
    highlights: JSON.stringify(["Dashboards interativos", "Relatórios automatizados", "Insights acionáveis", "BI estratégico"]),
    status: "ativo" as const,
  },
];

export const TRIARC_PROJECTS = [
  { name: "Sistema de Presença de Eventos", subtitle: "Controle de Presenças em Eventos", description: "Plataforma para gestão e controle de presença em eventos. Interface rápida e intuitiva para gerenciamento e acompanhamento de participantes com dashboard de métricas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "shadcn-ui", "Tailwind CSS"]), highlights: JSON.stringify(["Gestão ágil de eventos", "Controle prático de presença", "Design moderno e intuitivo", "Alta performance"]), status: "ativo" as const },
  { name: "Conexão Pessoas (COPE)", subtitle: "Plataforma de Conexão de Profissionais", description: "Plataforma inovadora de troca de habilidades entre profissionais. Sistema completo com gestão de usuários, trades, assinaturas premium e monitoramento de receitas em tempo real. 1000+ usuários, 5000+ trades.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Plataforma SaaS completa", "Receita recorrente mensal", "Sistema de matching inteligente", "API RESTful documentada"]), status: "ativo" as const },
  { name: "SS-Milhas", subtitle: "Smart Management System de Milhas", description: "Sistema inteligente de gestão de milhas e pontos aéreos. Gerenciamento de programas de fidelidade, rastreamento de milhas acumuladas e otimização de resgates. 500+ usuários, 1M+ milhas gerenciadas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MongoDB", "Real-time Sync"]), highlights: JSON.stringify(["Gestão inteligente de milhas", "Interface moderna", "Integração com APIs de fidelidade", "Otimização automática"]), status: "ativo" as const },
  { name: "TopFlow.ai", subtitle: "Invisible SEO - Alavanque seu site", description: "Plataforma completa de SEO invisível e automação de marketing digital com IA. Otimização de sites, geração de conteúdo, gestão de campanhas em redes sociais e integração com Instagram e Facebook Ads. 50+ sites, 1000+ otimizações.", category: "IA & Automação", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["SEO invisível e automatizado", "IA de última geração", "Integração com redes sociais", "Resultados mensuráveis"]), status: "ativo" as const },
  { name: "CB Integrativa", subtitle: "Assistente Virtual de Saúde Integrativa", description: "Sistema completo de cuidado integrativo com bot inteligente para saúde. Gestão de cuidados integrativos, agendamento e acompanhamento com assistente virtual especializado em medicina integrativa e holística.", category: "Saúde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "PostgreSQL"]), highlights: JSON.stringify(["IA especializada em saúde", "Cuidado holístico completo", "Telemedicina integrada", "Conformidade com LGPD"]), status: "ativo" as const },
  { name: "Grupo Conecta", subtitle: "Sistema de Ponto e Comunicação Empresarial", description: "Sistema completo de controle de ponto com geolocalização e comunicação empresarial. Agente de voz IA com ElevenLabs, mensageria em tempo real, gestão de funcionários e app mobile nativo para Android e iOS.", category: "Gestão", technologies: JSON.stringify(["React 19", "TypeScript", "Supabase", "Capacitor", "ElevenLabs AI", "N8N"]), highlights: JSON.stringify(["Ponto digital com geolocalização", "Agente de voz IA", "App mobile nativo", "Automação com N8N"]), status: "ativo" as const },
  { name: "Legendários Macaé", subtitle: "Plataforma Oficial do Movimento", description: "Plataforma web oficial para o movimento Legendários Macaé. Integrações automáticas com portais Legendários Global e Rio, sincronização em tempo real e timeline interativa. 1000+ visitantes, 50+ eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "WordPress REST API", "React Query"]), highlights: JSON.stringify(["Plataforma oficial do movimento", "Integrações automáticas", "Sincronização em tempo real", "Design responsivo"]), status: "ativo" as const },
  { name: "Sentinela", subtitle: "Plataforma de Conexão e Comunicação", description: "Plataforma de comunicação e conexão para o movimento Legendários. Conecta membros, facilita comunicação, compartilha eventos e fortalece a comunidade com interface moderna.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "WebSocket"]), highlights: JSON.stringify(["Comunicação em tempo real", "Conexão comunitária", "Interface moderna", "Fortalecimento da comunidade"]), status: "ativo" as const },
  { name: "TransCarga", subtitle: "Logistics Hub - Plataforma de Logística", description: "Plataforma completa de logística que conecta empresas e caminhoneiros. Rastreamento GPS em tempo real, geofencing, negociações inteligentes, verificação de documentos e assistente IA.", category: "Plataformas", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "Leaflet Maps", "AI/ML"]), highlights: JSON.stringify(["Rastreamento em tempo real", "IA integrada", "Geofencing inteligente", "Plataforma completa"]), status: "ativo" as const },
  { name: "Logos", subtitle: "Reuniões gravadas, transcritas e resumidas", description: "Plataforma para gravar reuniões, gerar transcrição automática e produzir resumos acionáveis. Centraliza o histórico de encontros e facilita a busca no que foi dito.", category: "IA & Automação", technologies: JSON.stringify(["React", "TypeScript", "Vite", "IA", "Speech-to-Text"]), highlights: JSON.stringify(["Gravar e transcrever", "Resumos com IA", "Busca nas reuniões", "Pronto para uso"]), status: "ativo" as const },
  { name: "Farol das Escrituras", subtitle: "Estudo e leitura das Escrituras", description: "Plataforma para aprofundamento bíblico, leitura guiada e recursos que apoiam o estudo das Escrituras de forma clara e acessível. Anotações, favoritos e busca de referências.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Tailwind CSS"]), highlights: JSON.stringify(["Estudo bíblico", "UX limpa", "Multi-dispositivo", "Pronto para uso"]), status: "ativo" as const },
  { name: "Mir Macaé", subtitle: "Análise e captura de dados da congregação", description: "Plataforma da congregação Mir Macaé para reunir, validar e visualizar dados operacionais e pastorais. Automatiza coleta de dados, reduz trabalho manual e oferece painéis claros.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "API REST", "Automação"]), highlights: JSON.stringify(["Dados da Mir Macaé", "Captura automatizada", "Análise e painéis", "Menos planilha manual"]), status: "ativo" as const },
  { name: "Triarc Key Generator", subtitle: "Geração segura de chaves criptográficas", description: "Ferramenta para geração, validação e gestão de chaves criptográficas e secrets no ecossistema TRIARC, com boas práticas de segurança.", category: "Sistemas", technologies: JSON.stringify(["TypeScript", "Node.js", "Web Crypto API", "CLI"]), highlights: JSON.stringify(["Segurança first", "Developer experience", "Chaves e secrets", "TRIARC tooling"]), status: "ativo" as const },
  { name: "Axis", subtitle: "Dashboards interativos e configuráveis", description: "Plataforma para montar dashboards totalmente interativos e sob medida. Arraste widgets, ligue fontes de dados, defina filtros e compartilhe visões claras com a equipe.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "Visualização de dados"]), highlights: JSON.stringify(["100% configurável", "Altamente interativo", "Dados conectados", "Pronto para uso"]), status: "ativo" as const },
  { name: "Sintaxe", subtitle: "Programação para crianças e adolescentes", description: "Plataforma de aprendizagem de programação para o público jovem. Linguagem clara, passos curtos e desafios gamificados que ensinam lógica, sintaxe e resolução de problemas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Gamificação"]), highlights: JSON.stringify(["Ensino de programação", "Gamificado", "Para jovens", "Aprendizado prático"]), status: "ativo" as const },
  { name: "NutriSystem", subtitle: "Sistema Completo de Gestão Nutricional", description: "Plataforma completa para gestão nutricional e acompanhamento de pacientes. Planos alimentares, cálculo automático de macronutrientes, acompanhamento de evolução e relatórios.", category: "Saúde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Sistema completo de nutrição", "Interface moderna", "Gestão profissional", "Tecnologia de ponta"]), status: "em_desenvolvimento" as const },
  { name: "TRIARC CRM", subtitle: "Sistema de Gestão de Relacionamento com Cliente", description: "CRM completo com IA integrada, pipeline de vendas drag-and-drop, geração de faturas, relatórios inteligentes e integração com TopFlow AI. Dashboard analítico completo.", category: "Gestão", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "AI/ML", "DnD Kit", "PWA"]), highlights: JSON.stringify(["CRM completo", "IA para insights", "Pipeline de vendas inteligente", "Integração com TopFlow AI"]), status: "em_desenvolvimento" as const },
  { name: "SS Finanças", subtitle: "Sistema de Gestão Financeira Pessoal", description: "Plataforma completa para gestão financeira pessoal com controle de receitas, despesas, investimentos e metas. Categorização automática por IA e dashboard visual interativo.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "AI/ML", "Chart.js"]), highlights: JSON.stringify(["Gestão financeira completa", "IA para categorização", "Dashboard visual", "Metas e investimentos"]), status: "em_desenvolvimento" as const },
  { name: "Jarvis", subtitle: "Assistente de IA em evolução", description: "Assistente inteligente conversacional em evolução contínua, com foco em automação de tarefas, respostas contextuais e extensibilidade via plugins.", category: "IA & Automação", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["IA conversacional", "Arquitetura evolutiva", "Automação", "Open source"]), status: "em_desenvolvimento" as const },
  { name: "KryptoStudio", subtitle: "Do conteúdo a slides, infográficos e vídeo", description: "Plataforma estilo Notebook LM: adicione documentos e PDFs como fonte única de verdade e a IA gera apresentações, infográficos e vídeos. Ideal para estudar, ensinar ou comunicar.", category: "IA & Automação", technologies: JSON.stringify(["React", "TypeScript", "IA generativa", "Busca semântica", "Multimídia"]), highlights: JSON.stringify(["Inspirado no Notebook LM", "Slides e infográficos", "Vídeo a partir do conteúdo", "IA nas suas fontes"]), status: "em_desenvolvimento" as const },
  { name: "Era das Alianças", subtitle: "Jogo de estratégia e alianças", description: "Jogo digital onde jogadores negociam alianças, expandem influência e disputam objetivos em cenários por eras. Combina decisões estratégicas, diplomacia entre facções e progressão contínua.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Estratégia e diplomacia", "Alianças dinâmicas", "Progressão por eras", "Multijogador"]), status: "em_desenvolvimento" as const },
  { name: "KidShield", subtitle: "Family Guardian Suite", description: "Suite voltada à proteção digital familiar: controles parentais, alertas e ferramentas para acompanhar o uso seguro de dispositivos e conteúdos. Privacidade e LGPD em foco.", category: "Saúde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Família em primeiro lugar", "Segurança digital", "Controles parentais", "Privacidade"]), status: "em_desenvolvimento" as const },
  { name: "Rede Sião", subtitle: "A rede social dos evangélicos", description: "Rede social pensada para o público evangélico: feed, perfis, grupos e conversas em um ambiente alinhado à fé, família e comunidade cristã. Compartilhe vida, eventos, louvor e mensagem.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Rede social cristã", "Como o Facebook com propósito", "Grupos e igrejas", "Comunidade evangélica"]), status: "em_desenvolvimento" as const },
  { name: "Pratiko", subtitle: "Praticidade no dia a dia", description: "Sistema para simplificar rotinas operacionais e tarefas recorrentes, com foco em produtividade e clareza de processos. Checklists, lembretes e relatórios simples.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "shadcn-ui"]), highlights: JSON.stringify(["Produtividade", "Processos claros", "Baixa fricção", "Gestão leve"]), status: "em_desenvolvimento" as const },
  { name: "Titan App", subtitle: "PWA de Escalada", description: "Aplicativo PWA de escalada desenvolvido pela Triarc Solutions. Registro de vias, modo offline, comunidade de escaladores, dicas de segurança e tracking de progresso. Slogan: Iron Grip. Endless Ascend.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "PWA", "Supabase", "Offline First"]), highlights: JSON.stringify(["Modo offline", "Comunidade de escaladores", "Tracking de progresso", "PWA nativo"]), status: "ativo" as const },
  { name: "Triarc Social Manager", subtitle: "Automação de Conteúdo para Instagram", description: "Plataforma interna de automação de conteúdo para Instagram da Triarc Solutions. Geração de legendas e artes com IA, agendamento, aprovação e publicação automática.", category: "IA & Automação", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "tRPC", "MySQL"]), highlights: JSON.stringify(["IA para legendas e artes", "Agendamento automático", "Fluxo de aprovação", "Publicação via MCP"]), status: "ativo" as const },
  { name: "Plataforma de Eventos Legendários", subtitle: "Gestão de Eventos Cristãos", description: "Plataforma completa para gestão de eventos do movimento Legendários. Inscrições, controle de presença, comunicação com participantes e relatórios de eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Gestão completa de eventos", "Controle de presença", "Comunicação integrada", "Relatórios detalhados"]), status: "ativo" as const },
  { name: "Sistema de Auditoria Empresarial", subtitle: "Conformidade e Compliance", description: "Sistema para auditoria interna e conformidade empresarial. Checklists de auditoria, rastreamento de não conformidades, planos de ação corretiva e relatórios executivos.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Auditoria interna completa", "Rastreamento de conformidade", "Planos de ação", "Relatórios executivos"]), status: "ativo" as const },
  { name: "Portal RH Inteligente", subtitle: "Gestão de Pessoas com IA", description: "Portal de RH com IA integrada para gestão de colaboradores. Onboarding digital, avaliação de desempenho, gestão de férias e banco de horas, tudo automatizado.", category: "Gestão", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "OpenAI API", "N8N"]), highlights: JSON.stringify(["Onboarding digital", "IA para avaliações", "Banco de horas automático", "Gestão completa de pessoas"]), status: "em_desenvolvimento" as const },
  { name: "EduTech Triarc", subtitle: "Plataforma de E-learning Corporativo", description: "Plataforma de ensino a distância para treinamentos corporativos. Cursos em vídeo, quizzes, certificados digitais, trilhas de aprendizagem e gamificação.", category: "Treinamento", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Video Streaming"]), highlights: JSON.stringify(["E-learning corporativo", "Certificados digitais", "Gamificação", "Trilhas de aprendizagem"]), status: "em_desenvolvimento" as const },
  { name: "Monitor IoT Industrial", subtitle: "Monitoramento de Equipamentos em Tempo Real", description: "Sistema de monitoramento IoT para equipamentos industriais. Coleta de dados de sensores, alertas de manutenção preditiva, dashboards em tempo real e histórico de operações.", category: "Industrial", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MQTT", "InfluxDB", "IoT"]), highlights: JSON.stringify(["Monitoramento em tempo real", "Manutenção preditiva", "Alertas inteligentes", "Histórico completo"]), status: "em_desenvolvimento" as const },
  { name: "Chatbot Corporativo IA", subtitle: "Assistente Virtual para Empresas", description: "Chatbot inteligente treinado com a base de conhecimento da empresa. Atendimento ao cliente, suporte interno, FAQ automatizado e integração com WhatsApp e Telegram.", category: "IA & Automação", technologies: JSON.stringify(["Node.js", "OpenAI API", "WhatsApp API", "Telegram Bot", "Vector DB"]), highlights: JSON.stringify(["Treinado com dados da empresa", "Multi-canal", "Atendimento 24/7", "Integração WhatsApp"]), status: "em_breve" as const },
  { name: "Dashboard Financeiro Empresarial", subtitle: "BI e Analytics para Negócios", description: "Dashboard de business intelligence para gestão financeira empresarial. KPIs em tempo real, fluxo de caixa, DRE automático, projeções e alertas de desvio orçamentário.", category: "Dados", technologies: JSON.stringify(["React", "TypeScript", "Python", "Power BI Embedded", "PostgreSQL"]), highlights: JSON.stringify(["KPIs em tempo real", "DRE automático", "Projeções financeiras", "Alertas de desvio"]), status: "em_breve" as const },
  { name: "Marketplace de Serviços Locais", subtitle: "Conectando Profissionais e Clientes em Macaé", description: "Marketplace para conexão de prestadores de serviços locais com clientes em Macaé/RJ. Perfis profissionais, avaliações, agendamento online e pagamento integrado.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Stripe", "Maps API"]), highlights: JSON.stringify(["Marketplace local", "Avaliações verificadas", "Agendamento online", "Pagamento integrado"]), status: "em_breve" as const },
  { name: "Sistema de Gestão Escolar", subtitle: "Administração Completa para Escolas", description: "Sistema completo para gestão escolar. Matrículas, grade curricular, lançamento de notas, boletins digitais, comunicação com pais e relatórios pedagógicos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Gestão completa escolar", "Boletins digitais", "Comunicação com pais", "Relatórios pedagógicos"]), status: "em_breve" as const },
];

export async function seedTriarcContent() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: triacContent.id }).from(triacContent).limit(1);
  if (existing.length > 0) return; // já populado

  const allItems = [
    ...TRIARC_SERVICES,
    ...TRIARC_PROJECTS.map(p => ({ ...p, type: "projeto" as const })),
  ];

  await db.insert(triacContent).values(allItems);
  console.log(`[Seed] ${allItems.length} itens Triarc inseridos (${TRIARC_SERVICES.length} serviços + ${TRIARC_PROJECTS.length} projetos)`);
}
