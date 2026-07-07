// Seed: serviços e projetos reais da Triarc Solutions
// Fonte: Relatório Técnico de Softwares — Adjalma / Triarc Solutions (06/07/2026)
// REGRA: nunca inventar números, usuários, estatísticas ou funcionalidades não confirmadas.
// Apenas projetos marcados como "Apto para post público: Sim" no relatório estão aqui.
import { getDb } from "./db";
import { triacContent } from "../drizzle/schema";

export const TRIARC_SERVICES = [
  {
    type: "servico" as const,
    name: "Desenvolvimento Sob Encomenda",
    subtitle: "Software Personalizado",
    description: "Desenvolvimento de sistemas web, aplicações mobile e sistemas de gestão personalizados para empresas. Criação de soluções sob medida com React, TypeScript, Node.js e bancos de dados modernos.",
    category: "Desenvolvimento",
    technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Mobile"]),
    highlights: JSON.stringify(["Sistemas web personalizados", "Apps mobile iOS e Android", "APIs e integrações", "Entrega com documentação"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Inteligência Artificial e Automação",
    subtitle: "IA Aplicada ao Negócio",
    description: "Soluções em IA generativa, automação de fluxos e agentes especialistas. Integração com OpenAI, Anthropic e modelos locais via Ollama para automatizar processos repetitivos e gerar insights.",
    category: "IA & Automação",
    technologies: JSON.stringify(["OpenAI API", "Anthropic Claude", "Ollama", "N8N", "FastAPI", "Agentes IA"]),
    highlights: JSON.stringify(["Agentes IA especializados", "Automação de fluxos", "Integração com LLMs", "Processamento de linguagem natural"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Suporte Técnico em TI",
    subtitle: "Manutenção e Infraestrutura",
    description: "Suporte técnico, manutenção preditiva e serviços especializados em tecnologia da informação. Monitoramento de infraestrutura, gestão de problemas e suporte remoto.",
    category: "TI",
    technologies: JSON.stringify(["Manutenção Preditiva", "Monitoramento", "Suporte Remoto", "Análise de Performance"]),
    highlights: JSON.stringify(["Manutenção preditiva", "Monitoramento contínuo", "Suporte remoto e presencial", "Análise de falhas"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Gestão Empresarial",
    subtitle: "Consultoria em Gestão",
    description: "Consultoria em gestão empresarial para otimização de processos e estratégias. Planejamento estratégico, otimização de operações, gestão de projetos e compliance.",
    category: "Gestão",
    technologies: JSON.stringify(["Gestão de Projetos", "Planejamento Estratégico", "Compliance", "MS Project"]),
    highlights: JSON.stringify(["Planejamento estratégico", "Otimização de operações", "Gestão de fornecedores", "Auditoria de contratos"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Data Science e Analytics",
    subtitle: "Inteligência de Dados",
    description: "Análise de dados, Business Intelligence e dashboards estratégicos. Relatórios automatizados e insights acionáveis para tomada de decisão baseada em dados.",
    category: "Dados",
    technologies: JSON.stringify(["Python", "Power BI", "SQL", "Machine Learning", "Visualização de Dados"]),
    highlights: JSON.stringify(["Dashboards interativos", "Relatórios automatizados", "Insights acionáveis", "BI estratégico"]),
    status: "ativo" as const,
  },
  {
    type: "servico" as const,
    name: "Licenciamento de Software",
    subtitle: "Software Proprietário SaaS",
    description: "Desenvolvimento e licenciamento de softwares proprietários no modelo SaaS. Distribuição, atualizações contínuas, suporte técnico especializado e gestão de licenças multi-cliente.",
    category: "Software",
    technologies: JSON.stringify(["SaaS", "Software Proprietário", "Licenciamento", "Multi-tenant"]),
    highlights: JSON.stringify(["Modelo SaaS", "Receita recorrente", "Suporte especializado", "Multi-cliente"]),
    status: "ativo" as const,
  },
];

export const TRIARC_PROJECTS = [
  {
    name: "Triarc Social Manager",
    subtitle: "Gestão de Redes Sociais com IA",
    description: "Painel para gerenciar, criar e agendar posts multi-conta no Instagram, Facebook, LinkedIn e TikTok. Geração de legendas por IA, fila de aprovação antes de publicar e métricas consolidadas de todas as plataformas em um só lugar.",
    category: "IA & Automação",
    technologies: JSON.stringify(["React 19", "TypeScript", "Node.js", "tRPC", "Instagram Graph API", "Meta API", "LinkedIn API"]),
    highlights: JSON.stringify(["Geração de legendas com IA", "Fila de aprovação", "Publicação automática multi-plataforma", "Métricas consolidadas"]),
    status: "ativo" as const,
  },
  {
    name: "Grupo Conecta",
    subtitle: "Ponto Eletrônico e Comunicação Empresarial",
    description: "Sistema completo de controle de ponto eletrônico com rastreamento por GPS e portal de comunicação para funcionários e responsáveis. Combina compliance de ponto com canal de comunicação institucional (comunicados, atendimento) em um único produto.",
    category: "Gestão",
    technologies: JSON.stringify(["React", "TypeScript", "Capacitor", "GPS", "Supabase"]),
    highlights: JSON.stringify(["Ponto com GPS e auditoria", "Espelho de ponto", "Portal do responsável", "Relatórios de horas e férias"]),
    status: "ativo" as const,
  },
  {
    name: "ELO - Estação OFF Grid",
    subtitle: "Comunicação em Áreas Remotas sem Internet",
    description: "Sistema de comunicação e monitoramento off-grid via malha de rádio, BLE e satélite. Permite comunicação em zonas rurais, desastres e expedições onde não há internet ou sinal de celular. Inclui simulação de malha antes do hardware real e análise de RF.",
    category: "Sistemas",
    technologies: JSON.stringify(["Mesh Radio", "BLE", "Satélite", "Análise RF", "Mapa 3D"]),
    highlights: JSON.stringify(["Comunicação sem internet", "Rede mesh off-grid", "Simulação de malha", "Dashboards de RF e satélite"]),
    status: "ativo" as const,
  },
  {
    name: "ELO - Resposta a Emergências",
    subtitle: "Coordenação de Desastres para Defesa Civil",
    description: "App de resposta a emergências e desastres para cidadãos e operadores, construído sobre tecnologia de rede off-grid. SOS via satélite, mapa de abrigos e dashboard de inteligência para operadores com IA de previsão. Projeto com potencial de fomento à inovação (FINEP).",
    category: "Sistemas",
    technologies: JSON.stringify(["Satélite SOS", "Mapa de Incidentes", "IA de Previsão", "Rede Off-grid"]),
    highlights: JSON.stringify(["SOS via satélite", "Mapa para cidadãos", "Dashboard de incidentes", "Abrigos e relatório de danos"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Peetron",
    subtitle: "Saúde e Segurança Ocupacional (SST)",
    description: "Plataforma de gestão de saúde e segurança ocupacional e RH para empresas. Controla exames ocupacionais (ASO), treinamentos e prazos de compliance com alertas automáticos antes do vencimento, reduzindo risco de multas por não conformidade.",
    category: "Saúde",
    technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
    highlights: JSON.stringify(["Controle de exames (ASO)", "Alertas de prazo automáticos", "Treinamentos e riscos", "Importação em massa"]),
    status: "ativo" as const,
  },
  {
    name: "RHEMA",
    subtitle: "Publicação de Livros Assistida por IA",
    description: "Plataforma para autores independentes criarem e publicarem livros com qualidade sem equipe própria. Inclui editor com IA, geração de capa, estúdio de audiobook, revisão gramatical e exportação direta para Kindle/KDP. Já possui planos de assinatura implementados.",
    category: "IA & Automação",
    technologies: JSON.stringify(["React", "TypeScript", "OpenAI", "ElevenLabs TTS", "KDP Export"]),
    highlights: JSON.stringify(["Editor de livro com IA", "Geração de capa", "Estúdio de audiobook", "Exportação para Kindle/KDP"]),
    status: "ativo" as const,
  },
  {
    name: "TSS - Pentest as a Service",
    subtitle: "Avaliação de Segurança Contínua",
    description: "Plataforma de teste de segurança (pentest) como serviço, com fluxo de scans, achados e compliance. Copiloto de IA para análise, modo sandbox, validação ética embutida no fluxo e relatórios em PDF. Alternativa acessível ao pentest tradicional caro e manual.",
    category: "Segurança",
    technologies: JSON.stringify(["React", "TypeScript", "Node.js", "IA Copiloto", "PDF Reports"]),
    highlights: JSON.stringify(["Scans e findings", "Copiloto de IA", "Validação ética", "Relatórios em PDF"]),
    status: "ativo" as const,
  },
  {
    name: "AI Biomimética",
    subtitle: "Orquestração de IA com Auto-evolução",
    description: "Sistema de orquestração biomimética de múltiplos provedores de IA (OpenAI, Anthropic, Google) com motor de auto-evolução genética. Aprende com histórico e feedback humano para escolher automaticamente o melhor provedor para cada tarefa, otimizando custo e qualidade.",
    category: "IA & Automação",
    technologies: JSON.stringify(["Python", "FastAPI", "OpenAI", "Anthropic", "Google AI", "Ollama", "Algoritmo Genético"]),
    highlights: JSON.stringify(["Orquestração multi-LLM", "Motor de auto-evolução", "Cérebro local via Ollama", "API FastAPI (Bio Console)"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "CHOKMAH - Console IA",
    subtitle: "Interface HUD com Holograma 3D e Voz",
    description: "Frontend do sistema de IA biomimética com experiência visual tipo HUD estilo JARVIS. Holograma 3D via WebGL/Three.js, reconhecimento de voz, síntese de voz via ElevenLabs e central de comandos. Interface imersiva para interação com IA.",
    category: "IA & Automação",
    technologies: JSON.stringify(["React", "Three.js", "WebGL", "ElevenLabs TTS", "Reconhecimento de Voz"]),
    highlights: JSON.stringify(["Holograma 3D interativo", "Voz e chat por voz", "TTS ElevenLabs", "Interface estilo JARVIS"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Git Deadline",
    subtitle: "Gamificação de Contribuições no GitHub",
    description: "Plataforma de gamificação para desenvolvedores inspirada em O Preço do Amanhã: ações no GitHub (commits, PRs, issues) concedem tempo de vida digital, com ranking global em tempo real. Arquitetura robusta com Go, Redis, WebSocket e globo 3D.",
    category: "Plataformas",
    technologies: JSON.stringify(["Go", "Redis", "WebSocket", "Three.js", "OAuth GitHub", "Webhook GitHub"]),
    highlights: JSON.stringify(["Relógio de vida ligado ao GitHub", "Ranking global em tempo real", "Globo 3D com clustering", "Webhook GitHub nativo"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Transformind",
    subtitle: "Plataforma de Coaching e Desenvolvimento Pessoal",
    description: "Plataforma completa de coaching e desenvolvimento pessoal com IA, comunidade e gamificação. AI Coach personalizado, diário emocional, roda da vida, análise SWOT, mentoria e comunidade com feed e grupos. Já possui checkout e assinatura implementados.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Supabase", "OpenAI", "Gamificação"]),
    highlights: JSON.stringify(["AI Coach personalizado", "Diário emocional", "Comunidade e grupos", "Assinatura implementada"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Conexão Pessoas",
    subtitle: "Networking e Troca de Habilidades entre Profissionais",
    description: "Plataforma de networking para profissionais autônomos encontrarem parceiros e clientes. Sistema de matches e trades (trocas de serviços) além de conexões tradicionais, com plano premium implementado.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Supabase", "PostgreSQL"]),
    highlights: JSON.stringify(["Matches entre profissionais", "Sistema de trades", "Plano premium", "Checkout implementado"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Sniper App",
    subtitle: "Monitoramento de Pregões e Licitações Públicas",
    description: "Ferramenta para empresas monitorarem pregões e licitações públicas em tempo real via APIs governamentais (PNCP, compras.dados.gov.br). Notificações push e histórico de lances. Protótipo inicial com integração real com autenticação Gov.br.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "PNCP API", "Gov.br OAuth", "Notificações Push"]),
    highlights: JSON.stringify(["Integração com APIs governamentais", "Status de leilões em tempo real", "Notificações via Gov.br", "Histórico de lances"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Roda Frete",
    subtitle: "Rastreamento de Fretes e Entregas",
    description: "Plataforma de rastreamento de fretes para transportadoras e seus clientes finais. Link público de rastreamento sem necessidade de login, timeline de status e app iOS com pipeline de build automatizado via Codemagic.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Supabase", "Capacitor", "iOS", "Codemagic"]),
    highlights: JSON.stringify(["Rastreamento público sem login", "Timeline de status", "App iOS com pipeline", "Trigger de histórico automático"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Sistema CB Integrativa",
    subtitle: "Agendamento via WhatsApp para Clínicas",
    description: "Bot de WhatsApp para agendamento de consultas em clínicas de saúde integrativa. Parsing de datas em linguagem natural, sincronização automática com Google Calendar e integração com ElevenLabs. Reduz trabalho manual da recepção e elimina erros de agenda.",
    category: "Saúde",
    technologies: JSON.stringify(["Z-API WhatsApp", "Google Calendar", "ElevenLabs", "N8N", "NLP"]),
    highlights: JSON.stringify(["Agendamento pelo WhatsApp", "Linguagem natural", "Sync Google Calendar", "Integração N8N"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "SS Finanças",
    subtitle: "Controle Financeiro Pessoal e Empresarial",
    description: "Sistema de controle financeiro com painel unificado para gastos fixos, variáveis, cartões de crédito e módulo de holerite familiar. Deployado na Vercel e em uso real. Vai além de apps financeiros genéricos com o módulo de holerite completo.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Supabase", "Vercel"]),
    highlights: JSON.stringify(["Gastos fixos e variáveis", "Cartões de crédito", "Módulo de holerite", "Dashboard com KPIs"]),
    status: "ativo" as const,
  },
  {
    name: "Farol das Escrituras",
    subtitle: "Estudo Bíblico com Pronúncia em Idiomas Originais",
    description: "App de leitura e estudo bíblico com narração por voz em idiomas originais (hebraico, aramaico e grego) via ElevenLabs. Diferencial técnico raro: vozes ajustadas especificamente para pronúncia bíblica correta, algo ausente na maioria dos apps de estudo bíblico.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "ElevenLabs TTS", "PWA", "Hebraico/Aramaico/Grego"]),
    highlights: JSON.stringify(["TTS em hebraico, aramaico e grego", "Pronúncia bíblica original", "PWA instalável", "Estudo aprofundado"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Sintaxe",
    subtitle: "Aprendizado de Programação Gamificado",
    description: "Plataforma de aprendizado de programação com lições interativas, editor de código embutido e animações 3D via Three.js. Recompensas com confete e desafios gamificados para tornar o aprendizado mais lúdico que plataformas tradicionais.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Three.js", "Editor de Código", "Gamificação"]),
    highlights: JSON.stringify(["Editor de código adaptativo", "Animações 3D", "Gamificação com recompensas", "Passos de lição sincronizados"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Mir Macaé",
    subtitle: "Dashboard de Células para Igrejas",
    description: "Dashboard de acompanhamento de células (grupos) de organizações religiosas em Macaé. Importação de dados via Excel para JSON, gráficos de performance por geração e visão consolidada da liderança. Elimina o controle manual por planilhas.",
    category: "Plataformas",
    technologies: JSON.stringify(["React", "TypeScript", "Importação Excel", "Gráficos", "API REST"]),
    highlights: JSON.stringify(["Performance por geração", "Importação de Excel", "Total de células", "Visão consolidada"]),
    status: "em_desenvolvimento" as const,
  },
  {
    name: "Sistema RPM",
    subtitle: "Check-in e Mídia de Eventos com Licenciamento Multi-cliente",
    description: "App mobile (iOS/Android) de check-in e presença em eventos com galeria de mídia integrada. Painel administrativo de licenciamento multi-cliente, criador de reels e slideshow. Modelo SaaS para organizadores de eventos e igrejas com múltiplas unidades.",
    category: "Plataformas",
    technologies: JSON.stringify(["React Native", "TypeScript", "iOS", "Android", "Multi-tenant"]),
    highlights: JSON.stringify(["Check-in em eventos", "Galeria de mídia", "Criador de reels/slideshow", "Licenciamento multi-cliente"]),
    status: "ativo" as const,
  },
  {
    name: "TopFlow.ai",
    subtitle: "Gestão Consolidada de Anúncios em Redes Sociais",
    description: "Plataforma para gestores de tráfego pago consolidarem campanhas de Google Ads, Meta Ads e Instagram em um único painel. Histórico de métricas, tendências de mercado via IA e conexões OAuth com auto-refresh para evitar reautenticação manual.",
    category: "IA & Automação",
    technologies: JSON.stringify(["React", "TypeScript", "Supabase", "Google Ads API", "Meta Ads API", "OAuth"]),
    highlights: JSON.stringify(["Painel consolidado de anúncios", "Tendências via IA", "OAuth com auto-refresh", "Histórico de métricas"]),
    status: "em_desenvolvimento" as const,
  },
];

export async function seedTriarcContent() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Limpar conteúdo anterior
  await db.delete(triacContent);
  // Inserir serviços
  for (const s of TRIARC_SERVICES) {
    await db.insert(triacContent).values(s);
  }
  // Inserir projetos
  for (const p of TRIARC_PROJECTS) {
    await db.insert(triacContent).values({ type: "projeto" as const, ...p });
  }
  console.log(`[Seed] ${TRIARC_SERVICES.length} serviços e ${TRIARC_PROJECTS.length} projetos inseridos.`);
}
