var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountTypeEnum: () => accountTypeEnum,
  assets: () => assets,
  contentStatusEnum: () => contentStatusEnum,
  contentThemes: () => contentThemes,
  contentTypeEnum: () => contentTypeEnum,
  instagramAccounts: () => instagramAccounts,
  logStatusEnum: () => logStatusEnum,
  mediaTypeEnum: () => mediaTypeEnum,
  platformEnum: () => platformEnum,
  postMedia: () => postMedia,
  postStatusEnum: () => postStatusEnum,
  posts: () => posts,
  publicationLogs: () => publicationLogs,
  researchRunStatusEnum: () => researchRunStatusEnum,
  researchRuns: () => researchRuns,
  researchTopics: () => researchTopics,
  roleEnum: () => roleEnum,
  toneEnum: () => toneEnum,
  triacContent: () => triacContent,
  users: () => users
});
import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
var roleEnum, platformEnum, accountTypeEnum, toneEnum, postStatusEnum, mediaTypeEnum, logStatusEnum, contentTypeEnum, contentStatusEnum, researchRunStatusEnum, users, instagramAccounts, posts, postMedia, assets, contentThemes, publicationLogs, triacContent, researchTopics, researchRuns;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    roleEnum = pgEnum("role", ["user", "admin"]);
    platformEnum = pgEnum("platform", ["instagram", "linkedin", "facebook", "tiktok", "youtube"]);
    accountTypeEnum = pgEnum("accountType", ["personal", "business"]);
    toneEnum = pgEnum("tone", ["personal", "corporate"]);
    postStatusEnum = pgEnum("post_status", ["draft", "pending", "approved", "scheduled", "published", "rejected"]);
    mediaTypeEnum = pgEnum("media_type", ["image", "video"]);
    logStatusEnum = pgEnum("log_status", ["success", "failed", "pending"]);
    contentTypeEnum = pgEnum("content_type", ["servico", "projeto"]);
    contentStatusEnum = pgEnum("content_status", ["ativo", "em_desenvolvimento", "em_breve"]);
    researchRunStatusEnum = pgEnum("research_run_status", ["success", "failed", "skipped"]);
    users = pgTable("users", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      passwordHash: varchar("passwordHash", { length: 256 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: roleEnum("role").default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    instagramAccounts = pgTable("instagram_accounts", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      handle: varchar("handle", { length: 128 }).notNull().unique(),
      displayName: varchar("displayName", { length: 256 }).notNull(),
      platform: platformEnum("platform").default("instagram").notNull(),
      accountType: accountTypeEnum("accountType").notNull(),
      tone: toneEnum("tone").notNull(),
      avatarUrl: text("avatarUrl"),
      bio: text("bio"),
      profileUrl: text("profileUrl"),
      accessToken: text("accessToken"),
      tokenExpiresAt: timestamp("tokenExpiresAt"),
      linkedinUrn: varchar("linkedinUrn", { length: 256 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    posts = pgTable("posts", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      userId: integer("userId").notNull(),
      accountId: integer("accountId").notNull(),
      caption: text("caption"),
      status: postStatusEnum("status").default("draft").notNull(),
      theme: text("theme"),
      scheduledAt: timestamp("scheduledAt"),
      publishedAt: timestamp("publishedAt"),
      instagramPostId: varchar("instagramPostId", { length: 256 }),
      instagramPermalink: text("instagramPermalink"),
      mcpPending: integer("mcpPending").default(0).notNull(),
      retryCount: integer("retryCount").default(0).notNull(),
      nextRetryAt: timestamp("nextRetryAt"),
      linkedinPublished: integer("linkedinPublished").default(0).notNull(),
      facebookPublished: integer("facebookPublished").default(0).notNull(),
      likes: integer("likes").default(0),
      comments: integer("comments").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    postMedia = pgTable("post_media", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      postId: integer("postId").notNull(),
      mediaUrl: text("mediaUrl").notNull(),
      mediaType: mediaTypeEnum("media_type").default("image").notNull(),
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    assets = pgTable("assets", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      userId: integer("userId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      url: text("url").notNull(),
      fileKey: varchar("fileKey", { length: 512 }).notNull(),
      mimeType: varchar("mimeType", { length: 128 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    contentThemes = pgTable("content_themes", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      name: varchar("name", { length: 128 }).notNull(),
      slug: varchar("slug", { length: 128 }).notNull().unique(),
      description: text("description"),
      icon: varchar("icon", { length: 64 }),
      color: varchar("color", { length: 32 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    publicationLogs = pgTable("publication_logs", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      postId: integer("postId").notNull(),
      attempt: integer("attempt").default(1).notNull(),
      status: logStatusEnum("log_status").notNull(),
      instagramPostId: varchar("instagramPostId", { length: 256 }),
      permalink: text("permalink"),
      error: text("error"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    triacContent = pgTable("triac_content", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      type: contentTypeEnum("content_type").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      subtitle: varchar("subtitle", { length: 256 }),
      description: text("description").notNull(),
      category: varchar("category", { length: 128 }),
      technologies: text("technologies"),
      highlights: text("highlights"),
      status: contentStatusEnum("content_status").default("ativo").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researchTopics = pgTable("research_topics", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      accountId: integer("accountId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      query: varchar("query", { length: 512 }).notNull(),
      language: varchar("language", { length: 8 }).default("pt").notNull(),
      active: integer("active").default(1).notNull(),
      publishHour: integer("publishHour").default(8).notNull(),
      autoPublish: integer("autoPublish").default(0).notNull(),
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researchRuns = pgTable("research_runs", {
      id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
      topicId: integer("topicId").notNull(),
      postId: integer("postId"),
      headlines: text("headlines"),
      status: researchRunStatusEnum("research_run_status").notNull(),
      error: text("error"),
      ranAt: timestamp("ranAt").defaultNow().notNull()
    });
  }
});

// server/seed-triarc.ts
var seed_triarc_exports = {};
__export(seed_triarc_exports, {
  DEFAULT_CONTENT_THEMES: () => DEFAULT_CONTENT_THEMES,
  TRIARC_PROJECTS: () => TRIARC_PROJECTS,
  TRIARC_SERVICES: () => TRIARC_SERVICES,
  ensureContentThemes: () => ensureContentThemes,
  seedContentThemes: () => seedContentThemes,
  seedTriarcContent: () => seedTriarcContent
});
async function seedContentThemes() {
  const db = await getDb();
  if (!db) return;
  await db.insert(contentThemes).values([...DEFAULT_CONTENT_THEMES]).onConflictDoNothing({ target: contentThemes.slug });
  console.log(`[Seed] ${DEFAULT_CONTENT_THEMES.length} temas de conte\xFAdo garantidos`);
}
async function ensureContentThemes() {
  const db = await getDb();
  if (!db) return [];
  const existing = await db.select({ id: contentThemes.id }).from(contentThemes).limit(1);
  if (existing.length === 0) {
    await seedContentThemes();
  }
  return db.select().from(contentThemes);
}
async function seedTriarcContent() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: triacContent.id }).from(triacContent).limit(1);
  if (existing.length > 0) return;
  const allItems = [
    ...TRIARC_SERVICES,
    ...TRIARC_PROJECTS.map((p) => ({ ...p, type: "projeto" }))
  ];
  await db.insert(triacContent).values(allItems);
  console.log(`[Seed] ${allItems.length} itens Triarc inseridos (${TRIARC_SERVICES.length} servi\xE7os + ${TRIARC_PROJECTS.length} projetos)`);
}
var DEFAULT_CONTENT_THEMES, TRIARC_SERVICES, TRIARC_PROJECTS;
var init_seed_triarc = __esm({
  "server/seed-triarc.ts"() {
    "use strict";
    init_db();
    init_schema();
    DEFAULT_CONTENT_THEMES = [
      { name: "Build in Public", slug: "build-in-public", description: "Compartilhar a jornada de desenvolvimento de forma transparente", icon: "Hammer", color: "#06b6d4" },
      { name: "Funcionalidade em Foco", slug: "funcionalidade-em-foco", description: "Destacar funcionalidades e solu\xE7\xF5es com detalhes t\xE9cnicos", icon: "Zap", color: "#8b5cf6" },
      { name: "Bastidores", slug: "bastidores", description: "Mostrar os bastidores do desenvolvimento e da equipe Triarc", icon: "Camera", color: "#f59e0b" },
      { name: "Dicas de Seguran\xE7a", slug: "dicas-de-seguranca", description: "Dicas de seguran\xE7a e boas pr\xE1ticas para empresas", icon: "Shield", color: "#ef4444" },
      { name: "Desafio Collab", slug: "desafio-collab", description: "Posts colaborativos e parcerias da Triarc", icon: "Users", color: "#ec4899" }
    ];
    TRIARC_SERVICES = [
      {
        type: "servico",
        name: "Gest\xE3o Empresarial",
        subtitle: "Consultoria em Gest\xE3o",
        description: "Consultoria em gest\xE3o empresarial para otimiza\xE7\xE3o de processos e estrat\xE9gias. An\xE1lise de processos, planejamento estrat\xE9gico, otimiza\xE7\xE3o de opera\xE7\xF5es, gest\xE3o de projetos, compliance e negocia\xE7\xE3o estrat\xE9gica.",
        category: "Gest\xE3o",
        technologies: JSON.stringify(["Gest\xE3o de Projetos", "MS Project", "Compliance", "Planejamento Estrat\xE9gico"]),
        highlights: JSON.stringify(["Planejamento estrat\xE9gico", "Otimiza\xE7\xE3o de opera\xE7\xF5es", "Gest\xE3o de fornecedores", "Auditoria de contratos"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Suporte T\xE9cnico em TI",
        subtitle: "Manuten\xE7\xE3o e Infraestrutura",
        description: "Suporte t\xE9cnico, manuten\xE7\xE3o preditiva e servi\xE7os especializados em tecnologia da informa\xE7\xE3o. Monitoramento de infraestrutura, gest\xE3o de problemas, suporte remoto e presencial.",
        category: "TI",
        technologies: JSON.stringify(["Manuten\xE7\xE3o Preditiva", "Monitoramento", "Suporte Remoto", "An\xE1lise de Performance"]),
        highlights: JSON.stringify(["Manuten\xE7\xE3o preditiva", "Suporte 24/7", "Monitoramento cont\xEDnuo", "An\xE1lise de falhas"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Desenvolvimento Sob Encomenda",
        subtitle: "Software Personalizado",
        description: "Desenvolvimento de sistemas web, aplica\xE7\xF5es mobile e sistemas de gest\xE3o personalizados. Cria\xE7\xE3o de IAs, agentes especialistas e automa\xE7\xF5es sob medida para sua empresa.",
        category: "Desenvolvimento",
        technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "IA/ML", "Mobile"]),
        highlights: JSON.stringify(["Sistemas web personalizados", "Apps mobile", "Cria\xE7\xE3o de IAs", "Agentes especialistas"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Intelig\xEAncia Artificial e Automa\xE7\xE3o",
        subtitle: "IA Aplicada ao Neg\xF3cio",
        description: "Solu\xE7\xF5es avan\xE7adas em IA, automa\xE7\xE3o e agentes especialistas. Machine Learning aplicado, processamento de linguagem natural, sistemas de recomenda\xE7\xE3o e automa\xE7\xE3o de fluxos de trabalho.",
        category: "IA & Automa\xE7\xE3o",
        technologies: JSON.stringify(["OpenAI API", "Machine Learning", "NLP", "Automa\xE7\xE3o", "Agentes IA"]),
        highlights: JSON.stringify(["IAs personalizadas", "Agentes especialistas", "Automa\xE7\xE3o de fluxos", "ML aplicado"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Automa\xE7\xE3o Industrial",
        subtitle: "Processos Industriais Inteligentes",
        description: "Solu\xE7\xF5es de automa\xE7\xE3o para processos industriais e operacionais. Sistemas SCADA, integra\xE7\xE3o de equipamentos, monitoramento industrial e otimiza\xE7\xE3o de produ\xE7\xE3o.",
        category: "Industrial",
        technologies: JSON.stringify(["SCADA", "Automa\xE7\xE3o Industrial", "Controle de Processos", "IoT", "N8N"]),
        highlights: JSON.stringify(["Automa\xE7\xE3o de processos", "Sistemas SCADA", "Integra\xE7\xE3o de equipamentos", "Otimiza\xE7\xE3o de produ\xE7\xE3o"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Treinamento Profissional",
        subtitle: "Capacita\xE7\xE3o e Desenvolvimento",
        description: "Treinamento em desenvolvimento profissional e gerencial. Capacita\xE7\xE3o t\xE9cnica, workshops especializados, programas de mentoria e desenvolvimento de lideran\xE7as.",
        category: "Treinamento",
        technologies: JSON.stringify(["E-learning", "Workshops", "Mentoria", "Capacita\xE7\xE3o T\xE9cnica"]),
        highlights: JSON.stringify(["Capacita\xE7\xE3o t\xE9cnica", "Desenvolvimento gerencial", "Workshops especializados", "Programas de mentoria"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Licenciamento de Software",
        subtitle: "Software Propriet\xE1rio",
        description: "Desenvolvimento e licenciamento de programas de computador. Software propriet\xE1rio, distribui\xE7\xE3o, atualiza\xE7\xF5es, suporte t\xE9cnico especializado e auditoria de licen\xE7as.",
        category: "Software",
        technologies: JSON.stringify(["Software Propriet\xE1rio", "SaaS", "Licenciamento", "Distribui\xE7\xE3o"]),
        highlights: JSON.stringify(["Software propriet\xE1rio", "Receita recorrente", "Suporte especializado", "Auditoria de licen\xE7as"]),
        status: "ativo"
      },
      {
        type: "servico",
        name: "Data Science e Analytics",
        subtitle: "Intelig\xEAncia de Dados",
        description: "An\xE1lise de dados, Business Intelligence e visualiza\xE7\xF5es estrat\xE9gicas. Dashboards interativos, relat\xF3rios automatizados e insights acion\xE1veis para tomada de decis\xE3o.",
        category: "Dados",
        technologies: JSON.stringify(["Python", "Power BI", "SQL", "Machine Learning", "Visualiza\xE7\xE3o de Dados"]),
        highlights: JSON.stringify(["Dashboards interativos", "Relat\xF3rios automatizados", "Insights acion\xE1veis", "BI estrat\xE9gico"]),
        status: "ativo"
      }
    ];
    TRIARC_PROJECTS = [
      { name: "Sistema de Presen\xE7a de Eventos", subtitle: "Controle de Presen\xE7as em Eventos", description: "Plataforma para gest\xE3o e controle de presen\xE7a em eventos. Interface r\xE1pida e intuitiva para gerenciamento e acompanhamento de participantes com dashboard de m\xE9tricas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "shadcn-ui", "Tailwind CSS"]), highlights: JSON.stringify(["Gest\xE3o \xE1gil de eventos", "Controle pr\xE1tico de presen\xE7a", "Design moderno e intuitivo", "Alta performance"]), status: "ativo" },
      { name: "Conex\xE3o Pessoas (COPE)", subtitle: "Plataforma de Conex\xE3o de Profissionais", description: "Plataforma inovadora de troca de habilidades entre profissionais. Sistema completo com gest\xE3o de usu\xE1rios, trades, assinaturas premium e monitoramento de receitas em tempo real. 1000+ usu\xE1rios, 5000+ trades.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Plataforma SaaS completa", "Receita recorrente mensal", "Sistema de matching inteligente", "API RESTful documentada"]), status: "ativo" },
      { name: "SS-Milhas", subtitle: "Smart Management System de Milhas", description: "Sistema inteligente de gest\xE3o de milhas e pontos a\xE9reos. Gerenciamento de programas de fidelidade, rastreamento de milhas acumuladas e otimiza\xE7\xE3o de resgates. 500+ usu\xE1rios, 1M+ milhas gerenciadas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MongoDB", "Real-time Sync"]), highlights: JSON.stringify(["Gest\xE3o inteligente de milhas", "Interface moderna", "Integra\xE7\xE3o com APIs de fidelidade", "Otimiza\xE7\xE3o autom\xE1tica"]), status: "ativo" },
      { name: "TopFlow.ai", subtitle: "Invisible SEO - Alavanque seu site", description: "Plataforma completa de SEO invis\xEDvel e automa\xE7\xE3o de marketing digital com IA. Otimiza\xE7\xE3o de sites, gera\xE7\xE3o de conte\xFAdo, gest\xE3o de campanhas em redes sociais e integra\xE7\xE3o com Instagram e Facebook Ads. 50+ sites, 1000+ otimiza\xE7\xF5es.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["SEO invis\xEDvel e automatizado", "IA de \xFAltima gera\xE7\xE3o", "Integra\xE7\xE3o com redes sociais", "Resultados mensur\xE1veis"]), status: "ativo" },
      { name: "CB Integrativa", subtitle: "Assistente Virtual de Sa\xFAde Integrativa", description: "Sistema completo de cuidado integrativo com bot inteligente para sa\xFAde. Gest\xE3o de cuidados integrativos, agendamento e acompanhamento com assistente virtual especializado em medicina integrativa e hol\xEDstica.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "PostgreSQL"]), highlights: JSON.stringify(["IA especializada em sa\xFAde", "Cuidado hol\xEDstico completo", "Telemedicina integrada", "Conformidade com LGPD"]), status: "ativo" },
      { name: "Grupo Conecta", subtitle: "Sistema de Ponto e Comunica\xE7\xE3o Empresarial", description: "Sistema completo de controle de ponto com geolocaliza\xE7\xE3o e comunica\xE7\xE3o empresarial. Agente de voz IA com ElevenLabs, mensageria em tempo real, gest\xE3o de funcion\xE1rios e app mobile nativo para Android e iOS.", category: "Gest\xE3o", technologies: JSON.stringify(["React 19", "TypeScript", "Supabase", "Capacitor", "ElevenLabs AI", "N8N"]), highlights: JSON.stringify(["Ponto digital com geolocaliza\xE7\xE3o", "Agente de voz IA", "App mobile nativo", "Automa\xE7\xE3o com N8N"]), status: "ativo" },
      { name: "Legend\xE1rios Maca\xE9", subtitle: "Plataforma Oficial do Movimento", description: "Plataforma web oficial para o movimento Legend\xE1rios Maca\xE9. Integra\xE7\xF5es autom\xE1ticas com portais Legend\xE1rios Global e Rio, sincroniza\xE7\xE3o em tempo real e timeline interativa. 1000+ visitantes, 50+ eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "WordPress REST API", "React Query"]), highlights: JSON.stringify(["Plataforma oficial do movimento", "Integra\xE7\xF5es autom\xE1ticas", "Sincroniza\xE7\xE3o em tempo real", "Design responsivo"]), status: "ativo" },
      { name: "Sentinela", subtitle: "Plataforma de Conex\xE3o e Comunica\xE7\xE3o", description: "Plataforma de comunica\xE7\xE3o e conex\xE3o para o movimento Legend\xE1rios. Conecta membros, facilita comunica\xE7\xE3o, compartilha eventos e fortalece a comunidade com interface moderna.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "WebSocket"]), highlights: JSON.stringify(["Comunica\xE7\xE3o em tempo real", "Conex\xE3o comunit\xE1ria", "Interface moderna", "Fortalecimento da comunidade"]), status: "ativo" },
      { name: "TransCarga", subtitle: "Logistics Hub - Plataforma de Log\xEDstica", description: "Plataforma completa de log\xEDstica que conecta empresas e caminhoneiros. Rastreamento GPS em tempo real, geofencing, negocia\xE7\xF5es inteligentes, verifica\xE7\xE3o de documentos e assistente IA.", category: "Plataformas", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "Leaflet Maps", "AI/ML"]), highlights: JSON.stringify(["Rastreamento em tempo real", "IA integrada", "Geofencing inteligente", "Plataforma completa"]), status: "ativo" },
      { name: "Logos", subtitle: "Reuni\xF5es gravadas, transcritas e resumidas", description: "Plataforma para gravar reuni\xF5es, gerar transcri\xE7\xE3o autom\xE1tica e produzir resumos acion\xE1veis. Centraliza o hist\xF3rico de encontros e facilita a busca no que foi dito.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "IA", "Speech-to-Text"]), highlights: JSON.stringify(["Gravar e transcrever", "Resumos com IA", "Busca nas reuni\xF5es", "Pronto para uso"]), status: "ativo" },
      { name: "Farol das Escrituras", subtitle: "Estudo e leitura das Escrituras", description: "Plataforma para aprofundamento b\xEDblico, leitura guiada e recursos que apoiam o estudo das Escrituras de forma clara e acess\xEDvel. Anota\xE7\xF5es, favoritos e busca de refer\xEAncias.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Tailwind CSS"]), highlights: JSON.stringify(["Estudo b\xEDblico", "UX limpa", "Multi-dispositivo", "Pronto para uso"]), status: "ativo" },
      { name: "Mir Maca\xE9", subtitle: "An\xE1lise e captura de dados da congrega\xE7\xE3o", description: "Plataforma da congrega\xE7\xE3o Mir Maca\xE9 para reunir, validar e visualizar dados operacionais e pastorais. Automatiza coleta de dados, reduz trabalho manual e oferece pain\xE9is claros.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "API REST", "Automa\xE7\xE3o"]), highlights: JSON.stringify(["Dados da Mir Maca\xE9", "Captura automatizada", "An\xE1lise e pain\xE9is", "Menos planilha manual"]), status: "ativo" },
      { name: "Triarc Key Generator", subtitle: "Gera\xE7\xE3o segura de chaves criptogr\xE1ficas", description: "Ferramenta para gera\xE7\xE3o, valida\xE7\xE3o e gest\xE3o de chaves criptogr\xE1ficas e secrets no ecossistema TRIARC, com boas pr\xE1ticas de seguran\xE7a.", category: "Sistemas", technologies: JSON.stringify(["TypeScript", "Node.js", "Web Crypto API", "CLI"]), highlights: JSON.stringify(["Seguran\xE7a first", "Developer experience", "Chaves e secrets", "TRIARC tooling"]), status: "ativo" },
      { name: "Axis", subtitle: "Dashboards interativos e configur\xE1veis", description: "Plataforma para montar dashboards totalmente interativos e sob medida. Arraste widgets, ligue fontes de dados, defina filtros e compartilhe vis\xF5es claras com a equipe.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "Visualiza\xE7\xE3o de dados"]), highlights: JSON.stringify(["100% configur\xE1vel", "Altamente interativo", "Dados conectados", "Pronto para uso"]), status: "ativo" },
      { name: "Sintaxe", subtitle: "Programa\xE7\xE3o para crian\xE7as e adolescentes", description: "Plataforma de aprendizagem de programa\xE7\xE3o para o p\xFAblico jovem. Linguagem clara, passos curtos e desafios gamificados que ensinam l\xF3gica, sintaxe e resolu\xE7\xE3o de problemas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Gamifica\xE7\xE3o"]), highlights: JSON.stringify(["Ensino de programa\xE7\xE3o", "Gamificado", "Para jovens", "Aprendizado pr\xE1tico"]), status: "ativo" },
      { name: "NutriSystem", subtitle: "Sistema Completo de Gest\xE3o Nutricional", description: "Plataforma completa para gest\xE3o nutricional e acompanhamento de pacientes. Planos alimentares, c\xE1lculo autom\xE1tico de macronutrientes, acompanhamento de evolu\xE7\xE3o e relat\xF3rios.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Sistema completo de nutri\xE7\xE3o", "Interface moderna", "Gest\xE3o profissional", "Tecnologia de ponta"]), status: "em_desenvolvimento" },
      { name: "TRIARC CRM", subtitle: "Sistema de Gest\xE3o de Relacionamento com Cliente", description: "CRM completo com IA integrada, pipeline de vendas drag-and-drop, gera\xE7\xE3o de faturas, relat\xF3rios inteligentes e integra\xE7\xE3o com TopFlow AI. Dashboard anal\xEDtico completo.", category: "Gest\xE3o", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "AI/ML", "DnD Kit", "PWA"]), highlights: JSON.stringify(["CRM completo", "IA para insights", "Pipeline de vendas inteligente", "Integra\xE7\xE3o com TopFlow AI"]), status: "em_desenvolvimento" },
      { name: "SS Finan\xE7as", subtitle: "Sistema de Gest\xE3o Financeira Pessoal", description: "Plataforma completa para gest\xE3o financeira pessoal com controle de receitas, despesas, investimentos e metas. Categoriza\xE7\xE3o autom\xE1tica por IA e dashboard visual interativo.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "AI/ML", "Chart.js"]), highlights: JSON.stringify(["Gest\xE3o financeira completa", "IA para categoriza\xE7\xE3o", "Dashboard visual", "Metas e investimentos"]), status: "em_desenvolvimento" },
      { name: "Jarvis", subtitle: "Assistente de IA em evolu\xE7\xE3o", description: "Assistente inteligente conversacional em evolu\xE7\xE3o cont\xEDnua, com foco em automa\xE7\xE3o de tarefas, respostas contextuais e extensibilidade via plugins.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["IA conversacional", "Arquitetura evolutiva", "Automa\xE7\xE3o", "Open source"]), status: "em_desenvolvimento" },
      { name: "KryptoStudio", subtitle: "Do conte\xFAdo a slides, infogr\xE1ficos e v\xEDdeo", description: "Plataforma estilo Notebook LM: adicione documentos e PDFs como fonte \xFAnica de verdade e a IA gera apresenta\xE7\xF5es, infogr\xE1ficos e v\xEDdeos. Ideal para estudar, ensinar ou comunicar.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "IA generativa", "Busca sem\xE2ntica", "Multim\xEDdia"]), highlights: JSON.stringify(["Inspirado no Notebook LM", "Slides e infogr\xE1ficos", "V\xEDdeo a partir do conte\xFAdo", "IA nas suas fontes"]), status: "em_desenvolvimento" },
      { name: "Era das Alian\xE7as", subtitle: "Jogo de estrat\xE9gia e alian\xE7as", description: "Jogo digital onde jogadores negociam alian\xE7as, expandem influ\xEAncia e disputam objetivos em cen\xE1rios por eras. Combina decis\xF5es estrat\xE9gicas, diplomacia entre fac\xE7\xF5es e progress\xE3o cont\xEDnua.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Estrat\xE9gia e diplomacia", "Alian\xE7as din\xE2micas", "Progress\xE3o por eras", "Multijogador"]), status: "em_desenvolvimento" },
      { name: "KidShield", subtitle: "Family Guardian Suite", description: "Suite voltada \xE0 prote\xE7\xE3o digital familiar: controles parentais, alertas e ferramentas para acompanhar o uso seguro de dispositivos e conte\xFAdos. Privacidade e LGPD em foco.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Fam\xEDlia em primeiro lugar", "Seguran\xE7a digital", "Controles parentais", "Privacidade"]), status: "em_desenvolvimento" },
      { name: "Rede Si\xE3o", subtitle: "A rede social dos evang\xE9licos", description: "Rede social pensada para o p\xFAblico evang\xE9lico: feed, perfis, grupos e conversas em um ambiente alinhado \xE0 f\xE9, fam\xEDlia e comunidade crist\xE3. Compartilhe vida, eventos, louvor e mensagem.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Rede social crist\xE3", "Como o Facebook com prop\xF3sito", "Grupos e igrejas", "Comunidade evang\xE9lica"]), status: "em_desenvolvimento" },
      { name: "Pratiko", subtitle: "Praticidade no dia a dia", description: "Sistema para simplificar rotinas operacionais e tarefas recorrentes, com foco em produtividade e clareza de processos. Checklists, lembretes e relat\xF3rios simples.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "shadcn-ui"]), highlights: JSON.stringify(["Produtividade", "Processos claros", "Baixa fric\xE7\xE3o", "Gest\xE3o leve"]), status: "em_desenvolvimento" },
      { name: "Titan App", subtitle: "PWA de Escalada", description: "Aplicativo PWA de escalada desenvolvido pela Triarc Solutions. Registro de vias, modo offline, comunidade de escaladores, dicas de seguran\xE7a e tracking de progresso. Slogan: Iron Grip. Endless Ascend.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "PWA", "Supabase", "Offline First"]), highlights: JSON.stringify(["Modo offline", "Comunidade de escaladores", "Tracking de progresso", "PWA nativo"]), status: "ativo" },
      { name: "Triarc Social Manager", subtitle: "Automa\xE7\xE3o de Conte\xFAdo para Instagram", description: "Plataforma interna de automa\xE7\xE3o de conte\xFAdo para Instagram da Triarc Solutions. Gera\xE7\xE3o de legendas e artes com IA, agendamento, aprova\xE7\xE3o e publica\xE7\xE3o autom\xE1tica.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "tRPC", "MySQL"]), highlights: JSON.stringify(["IA para legendas e artes", "Agendamento autom\xE1tico", "Fluxo de aprova\xE7\xE3o", "Publica\xE7\xE3o via MCP"]), status: "ativo" },
      { name: "Plataforma de Eventos Legend\xE1rios", subtitle: "Gest\xE3o de Eventos Crist\xE3os", description: "Plataforma completa para gest\xE3o de eventos do movimento Legend\xE1rios. Inscri\xE7\xF5es, controle de presen\xE7a, comunica\xE7\xE3o com participantes e relat\xF3rios de eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Gest\xE3o completa de eventos", "Controle de presen\xE7a", "Comunica\xE7\xE3o integrada", "Relat\xF3rios detalhados"]), status: "ativo" },
      { name: "Sistema de Auditoria Empresarial", subtitle: "Conformidade e Compliance", description: "Sistema para auditoria interna e conformidade empresarial. Checklists de auditoria, rastreamento de n\xE3o conformidades, planos de a\xE7\xE3o corretiva e relat\xF3rios executivos.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Auditoria interna completa", "Rastreamento de conformidade", "Planos de a\xE7\xE3o", "Relat\xF3rios executivos"]), status: "ativo" },
      { name: "Portal RH Inteligente", subtitle: "Gest\xE3o de Pessoas com IA", description: "Portal de RH com IA integrada para gest\xE3o de colaboradores. Onboarding digital, avalia\xE7\xE3o de desempenho, gest\xE3o de f\xE9rias e banco de horas, tudo automatizado.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "OpenAI API", "N8N"]), highlights: JSON.stringify(["Onboarding digital", "IA para avalia\xE7\xF5es", "Banco de horas autom\xE1tico", "Gest\xE3o completa de pessoas"]), status: "em_desenvolvimento" },
      { name: "EduTech Triarc", subtitle: "Plataforma de E-learning Corporativo", description: "Plataforma de ensino a dist\xE2ncia para treinamentos corporativos. Cursos em v\xEDdeo, quizzes, certificados digitais, trilhas de aprendizagem e gamifica\xE7\xE3o.", category: "Treinamento", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Video Streaming"]), highlights: JSON.stringify(["E-learning corporativo", "Certificados digitais", "Gamifica\xE7\xE3o", "Trilhas de aprendizagem"]), status: "em_desenvolvimento" },
      { name: "Monitor IoT Industrial", subtitle: "Monitoramento de Equipamentos em Tempo Real", description: "Sistema de monitoramento IoT para equipamentos industriais. Coleta de dados de sensores, alertas de manuten\xE7\xE3o preditiva, dashboards em tempo real e hist\xF3rico de opera\xE7\xF5es.", category: "Industrial", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MQTT", "InfluxDB", "IoT"]), highlights: JSON.stringify(["Monitoramento em tempo real", "Manuten\xE7\xE3o preditiva", "Alertas inteligentes", "Hist\xF3rico completo"]), status: "em_desenvolvimento" },
      { name: "Chatbot Corporativo IA", subtitle: "Assistente Virtual para Empresas", description: "Chatbot inteligente treinado com a base de conhecimento da empresa. Atendimento ao cliente, suporte interno, FAQ automatizado e integra\xE7\xE3o com WhatsApp e Telegram.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["Node.js", "OpenAI API", "WhatsApp API", "Telegram Bot", "Vector DB"]), highlights: JSON.stringify(["Treinado com dados da empresa", "Multi-canal", "Atendimento 24/7", "Integra\xE7\xE3o WhatsApp"]), status: "em_breve" },
      { name: "Dashboard Financeiro Empresarial", subtitle: "BI e Analytics para Neg\xF3cios", description: "Dashboard de business intelligence para gest\xE3o financeira empresarial. KPIs em tempo real, fluxo de caixa, DRE autom\xE1tico, proje\xE7\xF5es e alertas de desvio or\xE7ament\xE1rio.", category: "Dados", technologies: JSON.stringify(["React", "TypeScript", "Python", "Power BI Embedded", "PostgreSQL"]), highlights: JSON.stringify(["KPIs em tempo real", "DRE autom\xE1tico", "Proje\xE7\xF5es financeiras", "Alertas de desvio"]), status: "em_breve" },
      { name: "Marketplace de Servi\xE7os Locais", subtitle: "Conectando Profissionais e Clientes em Maca\xE9", description: "Marketplace para conex\xE3o de prestadores de servi\xE7os locais com clientes em Maca\xE9/RJ. Perfis profissionais, avalia\xE7\xF5es, agendamento online e pagamento integrado.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Stripe", "Maps API"]), highlights: JSON.stringify(["Marketplace local", "Avalia\xE7\xF5es verificadas", "Agendamento online", "Pagamento integrado"]), status: "em_breve" },
      { name: "Sistema de Gest\xE3o Escolar", subtitle: "Administra\xE7\xE3o Completa para Escolas", description: "Sistema completo para gest\xE3o escolar. Matr\xEDculas, grade curricular, lan\xE7amento de notas, boletins digitais, comunica\xE7\xE3o com pais e relat\xF3rios pedag\xF3gicos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Gest\xE3o completa escolar", "Boletins digitais", "Comunica\xE7\xE3o com pais", "Relat\xF3rios pedag\xF3gicos"]), status: "em_breve" }
    ];
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addPostMedia: () => addPostMedia,
  createAsset: () => createAsset,
  createPost: () => createPost,
  createPublicationLog: () => createPublicationLog,
  deleteAsset: () => deleteAsset,
  deletePost: () => deletePost,
  deletePostMedia: () => deletePostMedia,
  getAccountById: () => getAccountById,
  getAccountStats: () => getAccountStats,
  getAllAccounts: () => getAllAccounts,
  getAllPosts: () => getAllPosts,
  getAllThemes: () => getAllThemes,
  getAssetsByUser: () => getAssetsByUser,
  getDb: () => getDb,
  getLastDbError: () => getLastDbError,
  getPostById: () => getPostById,
  getPostMedia: () => getPostMedia,
  getPostsByAccount: () => getPostsByAccount,
  getPostsByStatus: () => getPostsByStatus,
  getPublicationLogs: () => getPublicationLogs,
  getPublicationLogsByPost: () => getPublicationLogsByPost,
  getThemeBySlug: () => getThemeBySlug,
  getUserByEmail: () => getUserByEmail,
  getUserByOpenId: () => getUserByOpenId,
  updatePost: () => updatePost,
  upsertUser: () => upsertUser
});
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL || process.env.DB_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    _lastError = "No database URL found. Checked: DATABASE_URL, DB_URL, POSTGRES_URL, SUPABASE_DB_URL";
    console.error("[Database]", _lastError);
    return null;
  }
  try {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      _lastError = "Invalid database URL format";
      console.error("[Database]", _lastError);
      return null;
    }
    const host = parsed.hostname;
    const port = parseInt(parsed.port || "5432", 10);
    const database = parsed.pathname.replace("/", "") || "postgres";
    const username = decodeURIComponent(parsed.username || "postgres");
    const password = decodeURIComponent(parsed.password || "");
    console.log(`[Database] Connecting to ${host}:${port}/${database} as ${username}`);
    const client = postgres({
      host,
      port,
      database,
      username,
      password,
      max: 1,
      ssl: "require",
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false
    });
    await client`SELECT 1 AS ok`;
    console.log("[Database] Raw connection OK");
    const db = drizzle(client);
    _db = db;
    _lastError = "";
    console.log("[Database] Connected to PostgreSQL");
  } catch (error) {
    const root = error?.cause ?? error;
    const msg = root?.message ?? error?.message ?? String(error);
    const code = root?.code ?? error?.code ?? "";
    _lastError = code ? `${code}: ${msg}` : msg;
    console.error("[Database] Connection failed:", _lastError, error);
    _db = null;
  }
  return _db;
}
function getLastDbError() {
  return _lastError;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const fields = ["name", "email", "loginMethod", "passwordHash", "role", "lastSignedIn"];
    for (const field of fields) {
      const val = user[field];
      if (val === void 0) continue;
      values[field] = val;
      updateSet[field] = val;
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instagramAccounts);
}
async function getAccountById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(instagramAccounts).where(eq(instagramAccounts.id, id)).limit(1);
  return result[0];
}
async function getAccountStats(accountId) {
  const db = await getDb();
  if (!db) return { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  const result = await db.select({ status: posts.status, count: sql`COUNT(*)` }).from(posts).where(eq(posts.accountId, accountId)).groupBy(posts.status);
  const stats = { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  for (const row of result) {
    stats[row.status] = Number(row.count);
  }
  return stats;
}
async function createPost(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values({
    userId: data.userId,
    accountId: data.accountId,
    caption: data.caption ?? null,
    theme: data.theme ?? null,
    scheduledAt: data.scheduledAt ?? null,
    status: data.status ?? "draft",
    mcpPending: data.mcpPending ?? 0
  }).returning({ id: posts.id });
  return { id: result[0].id };
}
async function queryPosts(db, rawSql) {
  try {
    const result = await db.execute(rawSql);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    _db = null;
    throw error;
  }
}
async function getPostById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const rows = await queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p.id = ${id} LIMIT 1`);
  return rows[0];
}
async function getPostsByAccount(accountId, status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p."accountId" = ${accountId} AND p.status = ${status} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
  }
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p."accountId" = ${accountId} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
}
async function getPostsByStatus(status) {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p.status = ${status} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
}
async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
}
async function updatePost(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
}
async function deletePost(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}
async function addPostMedia(postId, mediaUrl, mediaType = "image", sortOrder = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postMedia).values({ postId, mediaUrl, mediaType, sortOrder }).returning({ id: postMedia.id });
  return { id: result[0].id };
}
async function getPostMedia(postId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.sortOrder);
}
async function deletePostMedia(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.id, id));
}
async function createAsset(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assets).values(data).returning({ id: assets.id });
  return { id: result[0].id };
}
async function getAssetsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}
async function deleteAsset(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assets).where(eq(assets.id, id));
}
async function createPublicationLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(publicationLogs).values(data).returning({ id: publicationLogs.id });
  return { id: result[0].id };
}
async function getPublicationLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).orderBy(desc(publicationLogs.createdAt)).limit(limit);
}
async function getPublicationLogsByPost(postId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).where(eq(publicationLogs.postId, postId)).orderBy(desc(publicationLogs.createdAt));
}
async function getAllThemes() {
  const { ensureContentThemes: ensureContentThemes2 } = await Promise.resolve().then(() => (init_seed_triarc(), seed_triarc_exports));
  return ensureContentThemes2();
}
async function getThemeBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(contentThemes).where(eq(contentThemes.slug, slug)).limit(1);
  return result[0];
}
var _db, _lastError, POST_COLS, POST_LIST_LIMIT, POST_FROM;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    _db = null;
    _lastError = "";
    POST_COLS = `p.id, p."userId", p."accountId", p.caption, p.status, p.theme, p."scheduledAt", p."publishedAt",
  p."instagramPostId", p."instagramPermalink", p.likes, p.comments, p."createdAt", p."updatedAt",
  p."mcpPending", p."retryCount", p."nextRetryAt", p."linkedinPublished", p."facebookPublished",
  pm."mediaUrl" AS "mediaUrl"`;
    POST_LIST_LIMIT = 150;
    POST_FROM = sql.raw(`
  FROM posts p
  LEFT JOIN LATERAL (
    SELECT "mediaUrl" FROM post_media
    WHERE "postId" = p.id
    ORDER BY "sortOrder" ASC
    LIMIT 1
  ) pm ON true
`);
  }
});

// server/vercel.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var TRIARC_LOGO_URL = "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";

// server/_core/env.ts
var ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  // LLM — DeepSeek (OpenAI-compatible)
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  // Fallback: Anthropic Claude
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Image generation: Gemini (Nano Banana)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  /** Modelo de imagem — padrão gemini-2.5-flash-image (substitui preview 2.0 descontinuado) */
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
  // News API
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  // Social media OAuth
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
  /** Scopes OAuth customizados (separados por vírgula). Sobrescreve o padrão. */
  facebookOAuthScopes: process.env.FACEBOOK_OAUTH_SCOPES ?? "",
  /** "1" = inclui instagram_basic + instagram_content_publish (exige produto IG no app Meta) */
  facebookIgScopes: process.env.FACEBOOK_IG_SCOPES === "1",
  /** Facebook Login for Business — config_id do Meta Developer */
  facebookLoginConfigId: process.env.FACEBOOK_LOGIN_CONFIG_ID ?? "",
  // Instagram direct
  igUserId: process.env.IG_USER_ID ?? "",
  igUsername: process.env.IG_USERNAME ?? "",
  igAccessToken: process.env.IG_ACCESS_TOKEN ?? "",
  // Facebook
  fbPageId: process.env.PAGE_ID ?? "",
  fbPageToken: process.env.FB_PAGE_TOKEN ?? process.env.IG_ACCESS_TOKEN ?? "",
  // LinkedIn
  liAccessToken: process.env.LI_ACCESS_TOKEN ?? "",
  liPersonUrn: process.env.LI_PERSON_URN ?? "",
  // Supabase storage
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // First admin
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@triarcsolutions.com.br",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Cron security
  cronSecret: process.env.CRON_SECRET ?? ""
};

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var getSessionSecret = () => new TextEncoder().encode(ENV.cookieSecret);
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
var SDKServer = class {
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = getSessionSecret();
    return new SignJWT({ openId: payload.openId, name: payload.name }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      { openId, name: options.name || "" },
      options
    );
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const secretKey = getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, name } = payload;
      if (!isNonEmptyString(openId)) return null;
      return { openId, name: isNonEmptyString(name) ? name : "" };
    } catch {
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionCookie);
    if (!session) throw ForbiddenError("Invalid session cookie");
    const user = await getUserByOpenId(session.openId);
    if (!user) {
      if (ENV.adminEmail && ENV.adminPassword && session.openId === `admin:${ENV.adminEmail}`) {
        return {
          id: 0,
          openId: session.openId,
          name: "Admin",
          email: ENV.adminEmail,
          passwordHash: null,
          loginMethod: "local",
          role: "admin",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          lastSignedIn: /* @__PURE__ */ new Date()
        };
      }
      throw ForbiddenError("User not found");
    }
    await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    return user;
  }
  async loginWithPassword(email, password) {
    if (email === ENV.adminEmail && password === ENV.adminPassword && ENV.adminPassword) {
      await this.ensureAdminUser().catch(() => {
      });
    }
    const user = await getUserByEmail(email);
    if (!user && email === ENV.adminEmail && password === ENV.adminPassword && ENV.adminPassword) {
      const openId = `admin:${ENV.adminEmail}`;
      return { id: 0, openId, name: "Admin", email, passwordHash: null, loginMethod: "local", role: "admin", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date(), lastSignedIn: /* @__PURE__ */ new Date() };
    }
    if (!user || !user.passwordHash) return null;
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return null;
    await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    return user;
  }
  async ensureAdminUser() {
    if (!ENV.adminPassword || !ENV.adminEmail) return;
    const existing = await getUserByEmail(ENV.adminEmail);
    if (existing) return;
    const passwordHash = await hashPassword(ENV.adminPassword);
    const openId = nanoid(21);
    await upsertUser({
      openId,
      name: "Admin",
      email: ENV.adminEmail,
      passwordHash,
      loginMethod: "local",
      role: "admin",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    console.log(`[Auth] Admin criado: ${ENV.adminEmail}`);
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function registerOAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha s\xE3o obrigat\xF3rios" });
    }
    try {
      if (String(email) === process.env.ADMIN_EMAIL) {
        await sdk.ensureAdminUser().catch(() => {
        });
      }
      const user = await sdk.loginWithPassword(String(email), String(password));
      if (!user) {
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      return res.status(500).json({ error: "Erro interno no login" });
    }
  });
}

// server/storage.ts
var STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social";
var bucketEnsured = false;
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "").replace(/^(storage|manus-storage)\//, "");
}
function supabaseHeaders() {
  return {
    Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
    apikey: ENV.supabaseServiceRoleKey
  };
}
async function ensureStorageBucket() {
  if (bucketEnsured) return;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY n\xE3o configurados");
  }
  const listRes = await fetch(`${ENV.supabaseUrl}/storage/v1/bucket`, {
    headers: supabaseHeaders()
  });
  if (listRes.ok) {
    const buckets = await listRes.json();
    if (buckets.some((b) => b.id === STORAGE_BUCKET || b.name === STORAGE_BUCKET)) {
      bucketEnsured = true;
      return;
    }
  }
  const createRes = await fetch(`${ENV.supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...supabaseHeaders(), "content-type": "application/json" },
    body: JSON.stringify({
      id: STORAGE_BUCKET,
      name: STORAGE_BUCKET,
      public: true,
      file_size_limit: 10485760
    })
  });
  if (createRes.ok || createRes.status === 409) {
    bucketEnsured = true;
    console.log(`[Storage] Bucket "${STORAGE_BUCKET}" pronto`);
    return;
  }
  const err = await createRes.text().catch(() => "");
  throw new Error(
    `N\xE3o foi poss\xEDvel criar bucket "${STORAGE_BUCKET}" (${createRes.status}): ${err.slice(0, 200)}`
  );
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY n\xE3o configurados");
  }
  await ensureStorageBucket();
  const key = appendHashSuffix(normalizeKey(relKey));
  const uploadUrl = `${ENV.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${key}`;
  const raw = typeof data === "string" ? Buffer.from(data) : data;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      "content-type": contentType,
      "x-upsert": "true",
      "cache-control": "3600"
    },
    body: raw
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Supabase storage upload failed (${res.status}): ${err.slice(0, 300)}`);
  }
  const publicUrl = `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  return { key, url: publicUrl };
}
async function storageGetSignedUrl(relKey) {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY n\xE3o configurados");
  }
  const key = normalizeKey(relKey);
  const signUrl = `${ENV.supabaseUrl}/storage/v1/object/sign/${STORAGE_BUCKET}/${key}`;
  const res = await fetch(signUrl, {
    method: "POST",
    headers: { ...supabaseHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 })
  });
  if (!res.ok) {
    return `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  }
  const { signedURL } = await res.json();
  return `${ENV.supabaseUrl}${signedURL}`;
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  const handleStorage = async (req, res) => {
    const key = req.params[0];
    if (!key) return res.status(400).send("Missing storage key");
    try {
      const signedUrl = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };
  app2.get("/storage/*", handleStorage);
  app2.get("/manus-storage/*", handleStorage);
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
async function notifyOwner(payload) {
  const title = payload.title?.trim();
  const content = payload.content?.trim();
  if (!title || !content) return false;
  console.log(`[Notify] ${title}
${content}`);
  return true;
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_schema();
init_db();
import { TRPCError as TRPCError2 } from "@trpc/server";
import { z as z3 } from "zod";
import { eq as eq5 } from "drizzle-orm";

// server/_core/llm.ts
function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => typeof p === "string" ? p : p.type === "text" ? p.text : "").join("\n");
  }
  if (content.type === "text") return content.text;
  return "";
}
function normalizeMessage(msg) {
  return {
    role: msg.role === "function" ? "tool" : msg.role,
    content: extractText(msg.content)
  };
}
function needsJson(params) {
  const fmt = params.responseFormat ?? params.response_format;
  if (fmt && (fmt.type === "json_object" || fmt.type === "json_schema")) return true;
  if (params.outputSchema ?? params.output_schema) return true;
  return false;
}
async function invokeLLM(params) {
  const apiKey = ENV.deepseekApiKey || ENV.anthropicApiKey;
  if (!apiKey) throw new Error("No LLM API key configured (DEEPSEEK_API_KEY or ANTHROPIC_API_KEY)");
  const useDeepSeek = Boolean(ENV.deepseekApiKey);
  const apiUrl = useDeepSeek ? `${ENV.deepseekBaseUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://api.anthropic.com/v1/messages";
  if (useDeepSeek) {
    return invokeOpenAICompat(params, apiUrl, ENV.deepseekApiKey, ENV.deepseekModel);
  } else {
    return invokeAnthropicRest(params, ENV.anthropicApiKey);
  }
}
async function invokeOpenAICompat(params, apiUrl, apiKey, model) {
  const messages = params.messages.map(normalizeMessage);
  if (needsJson(params)) {
    const sys = messages.find((m) => m.role === "system");
    if (sys) {
      sys.content += "\n\nResponda SEMPRE com JSON v\xE1lido puro, sem markdown.";
    } else {
      messages.unshift({ role: "system", content: "Responda SEMPRE com JSON v\xE1lido puro, sem markdown." });
    }
  }
  const payload = {
    model,
    messages,
    max_tokens: Math.min(params.maxTokens ?? params.max_tokens ?? 8192, 8192)
  };
  if (needsJson(params)) {
    payload.response_format = { type: "json_object" };
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`LLM request failed (${response.status}): ${err}`);
  }
  return response.json();
}
async function invokeAnthropicRest(params, apiKey) {
  const systemMsgs = params.messages.filter((m) => m.role === "system");
  const convMsgs = params.messages.filter((m) => m.role !== "system");
  let systemPrompt = systemMsgs.map((m) => extractText(m.content)).join("\n\n");
  if (needsJson(params)) systemPrompt += "\n\nResponda SEMPRE com JSON v\xE1lido puro, sem markdown.";
  const messages = convMsgs.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: extractText(m.content)
  }));
  if (messages.length === 0 || messages[0].role !== "user") {
    messages.unshift({ role: "user", content: "Continue." });
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: Math.min(params.maxTokens ?? params.max_tokens ?? 8192, 8192),
      ...systemPrompt ? { system: systemPrompt } : {},
      messages
    })
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Anthropic request failed (${response.status}): ${err}`);
  }
  const data = await response.json();
  const text2 = data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
  return {
    id: data.id,
    created: Math.floor(Date.now() / 1e3),
    model: data.model,
    choices: [{ index: 0, message: { role: "assistant", content: text2 }, finish_reason: data.stop_reason ?? null }],
    usage: data.usage ? { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens, total_tokens: data.usage.input_tokens + data.usage.output_tokens } : void 0
  };
}

// server/_core/imageGeneration.ts
var GEMINI_TIMEOUT_MS = 55e3;
var MAX_RETRIES_PER_MODEL = 2;
var RETRYABLE_STATUSES = /* @__PURE__ */ new Set([429, 500, 503]);
var IMAGE_NO_TEXT_RULES = `CRITICAL RULES: Do NOT render any text, letters, words, numbers, typography, headlines, titles or captions inside the image. No Portuguese or English visible. Convey the topic only through abstract visuals, icons, symbols, colors and composition. All readable text belongs in the Instagram caption, not in the image.`;
var TRIARC_VISUAL_STYLE = "Modern premium tech aesthetic, cyan (#00BFFF) and dark navy (#0A1628), minimalist corporate design, subtle circuit patterns and holographic glow. Place the Triarc Solutions logo emblem (circular tech badge with gears) in the bottom-right corner. 1080x1080 square, magazine quality.";
var GEMINI_IMAGE_MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview"
];
function buildTriarcImagePrompt(topic) {
  return `Premium Instagram visual for Triarc Solutions, a Brazilian tech company. Visual mood inspired by the concept: "${topic}". ${TRIARC_VISUAL_STYLE} ${IMAGE_NO_TEXT_RULES}`;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function formatGeminiHttpError(status, model, detail) {
  if (status === 503 || detail.includes("high demand") || detail.includes("UNAVAILABLE")) {
    return "Servidor Gemini sobrecarregado (alta demanda tempor\xE1ria). Aguarde 1\u20132 minutos e clique em Gerar Imagem novamente.";
  }
  if (status === 429) {
    const isFreeTierZero = detail.includes("free_tier") && (detail.includes("limit: 0") || detail.includes('"limit":0'));
    if (isFreeTierZero) {
      return "Gera\xE7\xE3o de IMAGEM no Gemini est\xE1 com cota 0 no tier gratuito \u2014 separado do saldo de texto. Vincule billing ao projeto da API key, crie NOVA GEMINI_API_KEY, atualize no Vercel.";
    }
    return "Limite Gemini atingido. Aguarde ~1 minuto ou cole URL de imagem manualmente.";
  }
  if (status === 403) {
    return "GEMINI_API_KEY inv\xE1lida ou sem permiss\xE3o. Verifique ai.google.dev.";
  }
  if (status === 400 && detail.includes("responseModalities")) {
    return `Configura\xE7\xE3o Gemini inv\xE1lida [${model}]. Contate suporte \u2014 responseModalities.`;
  }
  return `Gemini falhou (${status}) [${model}]: ${detail.slice(0, 400)}`;
}
function uniqueModels(primary) {
  const seen = /* @__PURE__ */ new Set();
  return [primary, ...GEMINI_IMAGE_MODEL_FALLBACKS].filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}
async function callGeminiImage(model, body) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    console.log(`[Gemini] ${model} \u2192 HTTP ${response.status} em ${Date.now() - started}ms`);
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Gemini (${model}) excedeu ${GEMINI_TIMEOUT_MS / 1e3}s. Tente novamente ou cole URL manualmente.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
async function callGeminiWithRetry(model, body) {
  let lastDetail = "";
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
    const response = await callGeminiImage(model, body);
    if (response.ok || response.status === 404) {
      return response;
    }
    lastDetail = await response.text().catch(() => "");
    if (!RETRYABLE_STATUSES.has(response.status)) {
      throw new Error(formatGeminiHttpError(response.status, model, lastDetail));
    }
    if (attempt < MAX_RETRIES_PER_MODEL) {
      const delayMs = attempt * 2e3;
      console.warn(
        `[Gemini] ${model} HTTP ${response.status} \u2014 retry ${attempt}/${MAX_RETRIES_PER_MODEL} em ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }
  console.warn(`[Gemini] ${model} esgotou retries (${lastDetail.slice(0, 120)})`);
  return null;
}
function extractImagePart(result) {
  if (result.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou o prompt: ${result.promptFeedback.blockReason}`);
  }
  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini n\xE3o retornou candidatos \u2014 prompt pode ter sido bloqueado.");
  }
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    console.warn(`[Gemini] finishReason=${candidate.finishReason}`);
  }
  return candidate.content?.parts?.find((p) => p.inlineData?.data);
}
async function generateImage(options) {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY n\xE3o configurada no Vercel.");
  }
  const prompt = options.prompt.includes("Do NOT render any text") ? options.prompt : `${options.prompt}

${IMAGE_NO_TEXT_RULES}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };
  const models = uniqueModels(ENV.geminiImageModel);
  let lastError = "";
  let saw503 = false;
  for (const model of models) {
    const response = await callGeminiWithRetry(model, body);
    if (!response) {
      saw503 = true;
      lastError = `modelo ${model} indispon\xEDvel (503/429)`;
      continue;
    }
    if (response.status === 404) {
      lastError = await response.text().catch(() => `model ${model} not found`);
      console.warn(`[Gemini] Modelo ${model} indispon\xEDvel (404)`);
      continue;
    }
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Gemini (${model}) retornou JSON inv\xE1lido.`);
    }
    const imagePart = extractImagePart(result);
    if (!imagePart?.inlineData) {
      throw new Error(`Gemini (${model}) n\xE3o retornou imagem \u2014 tente outro tema ou URL manual.`);
    }
    const { data: b64Data, mimeType } = imagePart.inlineData;
    const buffer = Buffer.from(b64Data, "base64");
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
    console.log(`[Gemini] Imagem OK (${model}) \u2192 ${url.slice(0, 80)}...`);
    return { url };
  }
  if (saw503) {
    throw new Error(formatGeminiHttpError(503, models[0] ?? "gemini", "high demand"));
  }
  throw new Error(
    `Nenhum modelo Gemini de imagem dispon\xEDvel. ${lastError}. Verifique GEMINI_API_KEY e ai.dev/rate-limit.`
  );
}
async function probeImageStack() {
  return {
    geminiKey: !!ENV.geminiApiKey,
    geminiModel: ENV.geminiImageModel,
    supabase: !!(ENV.supabaseUrl && ENV.supabaseServiceRoleKey),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social"
  };
}

// server/imageJobs.ts
init_db();
import { sql as sql2 } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
var STALE_PROCESSING_MS = 1e5;
var tableReady = false;
function internalAuthSecret() {
  return ENV.cronSecret || ENV.cookieSecret;
}
function appBaseUrl() {
  if (ENV.appUrl) return ENV.appUrl.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}
async function ensureImageJobsTable() {
  if (tableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql2`
    CREATE TABLE IF NOT EXISTS image_generation_jobs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      url TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
}
function mapJobRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    status: row.status,
    url: row.url,
    error: row.error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
async function createImageJob(userId, prompt) {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indispon\xEDvel");
  const rows = await db.execute(sql2`
    INSERT INTO image_generation_jobs (user_id, prompt, status)
    VALUES (${userId}, ${prompt}, 'pending')
    RETURNING id
  `);
  const id = rows[0]?.id;
  if (!id) throw new Error("Falha ao criar job de imagem");
  return id;
}
async function getImageJobById(jobId) {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql2`
    SELECT id, user_id, prompt, status, url, error, created_at, updated_at
    FROM image_generation_jobs
    WHERE id = ${jobId}
    LIMIT 1
  `);
  const row = rows[0];
  return row ? mapJobRow(row) : null;
}
async function getImageJob(jobId, userId) {
  const job = await getImageJobById(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}
async function markJobFailed(jobId, message) {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql2`
    UPDATE image_generation_jobs
    SET status = 'failed', error = ${message.slice(0, 500)}, updated_at = NOW()
    WHERE id = ${jobId}
  `);
}
async function processImageJob(jobId) {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indispon\xEDvel");
  const claimed = await db.execute(sql2`
    UPDATE image_generation_jobs
    SET status = 'processing', updated_at = NOW()
    WHERE id = ${jobId} AND status = 'pending'
    RETURNING id, prompt
  `);
  const job = claimed[0];
  if (!job) {
    console.log(`[ImageJob] ${jobId} j\xE1 em processamento ou conclu\xEDdo`);
    return;
  }
  console.log(`[ImageJob] Processando ${jobId}...`);
  try {
    const { url } = await generateImage({ prompt: job.prompt });
    if (!url) throw new Error("Gemini n\xE3o retornou URL");
    await db.execute(sql2`
      UPDATE image_generation_jobs
      SET status = 'done', url = ${url}, error = NULL, updated_at = NOW()
      WHERE id = ${jobId}
    `);
    console.log(`[ImageJob] ${jobId} conclu\xEDdo`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ImageJob] ${jobId} falhou:`, msg);
    await markJobFailed(jobId, msg);
  }
}
function triggerRemoteProcessing(jobId) {
  const secret = internalAuthSecret();
  const base = appBaseUrl();
  if (!secret || !base) {
    console.warn("[ImageJob] Sem APP_URL ou secret \u2014 remote dispatch ignorado");
    return;
  }
  const url = `${base}/api/internal/process-image-job/${jobId}`;
  void fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` }
  }).catch((err) => console.warn(`[ImageJob] Remote dispatch ${jobId} falhou:`, err));
}
function dispatchImageJobProcessing(jobId) {
  const task = processImageJob(jobId);
  try {
    waitUntil(task);
  } catch {
    void task;
  }
  triggerRemoteProcessing(jobId);
}
async function failStaleProcessingIfNeeded(jobId) {
  const job = await getImageJobById(jobId);
  if (!job || job.status !== "processing") return;
  if (Date.now() - job.updatedAt.getTime() > STALE_PROCESSING_MS) {
    await markJobFailed(
      jobId,
      "Processamento interrompido (timeout do servidor). Clique em Gerar Imagem novamente."
    );
  }
}
async function kickImageJob(jobId) {
  await failStaleProcessingIfNeeded(jobId);
  const job = await getImageJobById(jobId);
  if (!job || job.status === "done" || job.status === "failed") return;
  if (job.status === "processing") {
    return;
  }
  const ageMs = Date.now() - job.createdAt.getTime();
  const neverStarted = job.updatedAt.getTime() - job.createdAt.getTime() < 3e3;
  if (neverStarted && ageMs > 8e3 && ageMs < 12e4) {
    dispatchImageJobProcessing(jobId);
  }
}
function verifyInternalAuth(authHeader) {
  const secret = internalAuthSecret();
  if (!secret || !authHeader) return false;
  return authHeader === `Bearer ${secret}`;
}

// server/instagram.ts
init_db();
async function processScheduledPosts() {
  const scheduledPosts = await getPostsByStatus("scheduled");
  const now = /* @__PURE__ */ new Date();
  let processed = 0;
  let promoted = 0;
  const errors = [];
  for (const post of scheduledPosts) {
    if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
      processed++;
      try {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Instagram] Post ${post.id} movido para fila de publica\xE7\xE3o.`);
      } catch (err) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }
  }
  return { processed, promoted, errors };
}
async function fetchPostInsights(_instagramPostId) {
  console.warn("[Instagram] fetchPostInsights deve ser chamado pelo agente Manus, n\xE3o pelo servidor.");
  return {};
}

// server/autonomousAgent.ts
init_db();

// server/linkedin.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";

// server/_core/oauthFinish.ts
function parseOAuthState(state, fallbackOrigin) {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    return {
      origin: decoded.origin || fallbackOrigin,
      accountId: decoded.accountId,
      popup: decoded.popup === true || decoded.popup === "1"
    };
  } catch {
    return { origin: fallbackOrigin, popup: false };
  }
}
function buildOAuthState(origin, accountId, popup) {
  return Buffer.from(JSON.stringify({ origin, accountId, popup: popup ? true : void 0 })).toString("base64url");
}
function finishOAuth(res, opts) {
  const { origin, popup, provider, success, error } = opts;
  const param = success ? `${provider}_connected=1` : `${provider}_error=${encodeURIComponent(error ?? "unknown")}`;
  const redirectUrl = `${origin}/accounts?${param}`;
  if (popup) {
    const message = success ? "Conta conectada com sucesso!" : `Erro ao conectar: ${error ?? "desconhecido"}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>OAuth</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 24px">
<p>${message}</p>
<p style="color:#666;font-size:14px">Fechando esta janela...</p>
<script>
(function(){
  var payload = { type: "oauth_complete", provider: ${JSON.stringify(provider)}, success: ${success ? "true" : "false"} };
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, ${JSON.stringify(origin)});
      window.close();
      setTimeout(function(){ window.close(); }, 300);
      return;
    }
  } catch (e) {}
  window.location.replace(${JSON.stringify(redirectUrl)});
})();
</script>
</body></html>`);
    return;
  }
  res.redirect(redirectUrl);
}

// server/linkedin.ts
var LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
var LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
var LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
var LINKEDIN_ASSETS_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";
var LINKEDIN_ORG_VANITY = "triarc-solutions-brasil";
var SCOPES = "w_member_social openid profile";
var LINKEDIN_REDIRECT_URI = "https://tsm.triarcsolutions.com.br/auth/linkedin/callback";
function getRedirectUri(_origin) {
  return LINKEDIN_REDIRECT_URI;
}
async function resolveOrganizationUrn(accessToken) {
  try {
    const res = await fetch(
      `https://api.linkedin.com/v2/organizations?q=vanityName&vanityName=${LINKEDIN_ORG_VANITY}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      console.warn("[LinkedIn] organizations lookup status:", res.status);
      return null;
    }
    const data = await res.json();
    const org = data?.elements?.[0];
    if (org?.id) {
      const urn = `urn:li:organization:${org.id}`;
      console.log(`[LinkedIn] Organization encontrada: ${urn}`);
      return urn;
    }
    const aclRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,vanityName,localizedName)))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!aclRes.ok) return null;
    const aclData = await aclRes.json();
    const match = aclData?.elements?.find(
      (e) => e["organization~"]?.vanityName === LINKEDIN_ORG_VANITY
    );
    if (match?.["organization~"]?.id) {
      const urn = `urn:li:organization:${match["organization~"].id}`;
      console.log(`[LinkedIn] Organization via ACL: ${urn}`);
      return urn;
    }
  } catch (err) {
    console.warn("[LinkedIn] Erro ao resolver organization URN:", err);
  }
  return null;
}
function registerLinkedInRoutes(app2) {
  app2.get("/api/linkedin/auth", (req, res) => {
    const origin = req.query.origin || "http://localhost:3000";
    const accountId = req.query.accountId;
    const popup = req.query.popup === "1" || req.query.popup === "true";
    const redirectUri = getRedirectUri(origin);
    const state = buildOAuthState(origin, accountId, popup);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.linkedinClientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state
    });
    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
  });
  app2.get("/auth/linkedin/callback", async (req, res) => {
    const { code, state, error } = req.query;
    const fallbackOrigin = "https://tsm.triarcsolutions.com.br";
    const { origin, accountId, popup } = parseOAuthState(state, fallbackOrigin);
    if (error) {
      console.error("[LinkedIn] OAuth error:", error);
      return finishOAuth(res, { origin, popup, provider: "linkedin", success: false, error });
    }
    const redirectUri = getRedirectUri(origin);
    try {
      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.linkedinClientId,
          client_secret: ENV.linkedinClientSecret
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[LinkedIn] Token exchange failed:", tokenData);
        return finishOAuth(res, { origin, popup, provider: "linkedin", success: false, error: "token_exchange_failed" });
      }
      const { access_token, expires_in } = tokenData;
      const expiresAt = new Date(Date.now() + (expires_in ?? 5184e3) * 1e3);
      let linkedinUrn = await resolveOrganizationUrn(access_token);
      if (!linkedinUrn) {
        console.warn("[LinkedIn] Organization URN n\xE3o resolvido, buscando URN pessoal...");
        try {
          const uiRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          if (uiRes.ok) {
            const ui = await uiRes.json();
            if (ui?.sub) {
              linkedinUrn = `urn:li:person:${ui.sub}`;
              console.log(`[LinkedIn] URN via userinfo: ${linkedinUrn}`);
            }
          }
          if (!linkedinUrn) {
            const meRes = await fetch("https://api.linkedin.com/v2/me", {
              headers: { Authorization: `Bearer ${access_token}` }
            });
            if (meRes.ok) {
              const me = await meRes.json();
              if (me?.id) {
                linkedinUrn = `urn:li:person:${me.id}`;
                console.log(`[LinkedIn] URN via /v2/me: ${linkedinUrn}`);
              }
            }
          }
        } catch (e) {
          console.warn("[LinkedIn] Falha ao buscar URN pessoal:", e);
        }
      }
      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts).set({
          accessToken: access_token,
          tokenExpiresAt: expiresAt,
          linkedinUrn: linkedinUrn ?? void 0
        }).where(eq2(instagramAccounts.id, parseInt(accountId)));
        console.log(`[LinkedIn] Token salvo para conta ${accountId}, URN: ${linkedinUrn}`);
      }
      finishOAuth(res, { origin, popup, provider: "linkedin", success: true });
    } catch (err) {
      console.error("[LinkedIn] Callback error:", err);
      finishOAuth(res, { origin, popup, provider: "linkedin", success: false, error: "callback_failed" });
    }
  });
}
async function publishToLinkedIn(params) {
  const { accessToken, linkedinUrn, caption, imageUrl } = params;
  const isOrg = linkedinUrn.startsWith("urn:li:organization:");
  console.log(`[LinkedIn] Publicando como ${isOrg ? "Company Page" : "perfil pessoal"}: ${linkedinUrn}`);
  let shareMediaCategory = "NONE";
  let media = [];
  if (imageUrl) {
    try {
      const uploadedAsset = await registerLinkedInImage(accessToken, linkedinUrn, imageUrl);
      if (uploadedAsset) {
        shareMediaCategory = "IMAGE";
        media = [{
          status: "READY",
          description: { text: caption.slice(0, 200) },
          media: uploadedAsset,
          title: { text: "Triarc Solutions" }
        }];
      }
    } catch (err) {
      console.warn("[LinkedIn] Image upload failed, posting text-only:", err);
    }
  }
  const body = {
    author: linkedinUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory,
        ...media.length > 0 ? { media } : {}
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };
  const res = await fetch(LINKEDIN_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn UGC post failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const postId = data.id ?? "";
  const permalink = `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`;
  return { postId, permalink };
}
async function registerLinkedInImage(accessToken, ownerUrn, imageUrl) {
  const registerRes = await fetch(LINKEDIN_ASSETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent"
        }]
      }
    })
  });
  if (!registerRes.ok) return null;
  const registerData = await registerRes.json();
  const uploadUrl = registerData?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn = registerData?.value?.asset;
  if (!uploadUrl || !assetUrn) return null;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const imgBuffer = await imgRes.arrayBuffer();
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg"
    },
    body: imgBuffer
  });
  if (!uploadRes.ok) return null;
  return assetUrn;
}

// server/facebook.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
var FB_AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";
var FB_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";
var FB_GRAPH_URL = "https://graph.facebook.com/v21.0";
var FB_PAGE_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts"
];
var FB_IG_SCOPES = ["instagram_basic", "instagram_content_publish"];
function getFacebookScopes(forInstagram) {
  if (ENV.facebookOAuthScopes.trim()) {
    return ENV.facebookOAuthScopes.trim();
  }
  const scopes = [...FB_PAGE_SCOPES];
  if (forInstagram && ENV.facebookIgScopes) {
    scopes.push(...FB_IG_SCOPES);
  }
  return scopes.join(",");
}
var FB_PAGE_VANITY = "Triarcsolutions";
var FACEBOOK_REDIRECT_URI = "https://tsm.triarcsolutions.com.br/auth/facebook/callback";
function getRedirectUri2(_origin) {
  return FACEBOOK_REDIRECT_URI;
}
async function resolvePageToken(userToken) {
  try {
    const res = await fetch(
      `${FB_GRAPH_URL}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${userToken}`
    );
    if (!res.ok) {
      console.warn("[Facebook] /me/accounts status:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const pages = data?.data ?? [];
    if (pages.length === 0) {
      console.warn("[Facebook] Nenhuma p\xE1gina encontrada para este usu\xE1rio");
      return null;
    }
    const triarc = pages.find(
      (p) => p.name?.toLowerCase().includes("triarc") || p.id === FB_PAGE_VANITY
    ) ?? pages[0];
    console.log(`[Facebook] P\xE1gina selecionada: ${triarc.name} (${triarc.id})`);
    const igUserId = triarc.instagram_business_account?.id;
    return { pageId: triarc.id, pageToken: triarc.access_token, pageName: triarc.name, igUserId };
  } catch (err) {
    console.warn("[Facebook] Erro ao resolver Page token:", err);
    return null;
  }
}
function registerFacebookRoutes(app2) {
  app2.get("/api/facebook/auth", (req, res) => {
    const origin = req.query.origin || "http://localhost:3000";
    const accountId = req.query.accountId;
    const popup = req.query.popup === "1" || req.query.popup === "true";
    const forInstagram = req.query.forInstagram === "1" || req.query.forInstagram === "true";
    const redirectUri = getRedirectUri2(origin);
    const state = buildOAuthState(origin, accountId, popup);
    const scope = getFacebookScopes(forInstagram);
    const params = new URLSearchParams({
      client_id: ENV.facebookAppId,
      redirect_uri: redirectUri,
      scope,
      state,
      response_type: "code",
      display: popup ? "popup" : "page"
    });
    if (ENV.facebookLoginConfigId) {
      params.set("config_id", ENV.facebookLoginConfigId);
    }
    res.redirect(`${FB_AUTH_URL}?${params.toString()}`);
  });
  app2.get("/auth/facebook/callback", async (req, res) => {
    const { code, state, error } = req.query;
    const fallbackOrigin = "https://tsm.triarcsolutions.com.br";
    const { origin, accountId, popup } = parseOAuthState(state, fallbackOrigin);
    if (error) {
      console.error("[Facebook] OAuth error:", error);
      return finishOAuth(res, { origin, popup, provider: "facebook", success: false, error });
    }
    const redirectUri = getRedirectUri2(origin);
    try {
      const tokenRes = await fetch(
        `${FB_TOKEN_URL}?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[Facebook] Token exchange failed:", tokenData);
        return finishOAuth(res, { origin, popup, provider: "facebook", success: false, error: "token_exchange_failed" });
      }
      const userToken = tokenData.access_token;
      const page = await resolvePageToken(userToken);
      let finalToken = userToken;
      let pageRef = "fb:personal";
      if (page) {
        finalToken = page.pageToken;
        pageRef = `fb:page:${page.pageId}`;
        console.log(`[Facebook] Usando Page token: ${page.pageName} (${page.pageId})`);
      } else {
        console.warn("[Facebook] Nenhuma Page encontrada \u2014 usando token pessoal como fallback");
      }
      const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1e3);
      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [account] = await db.select().from(instagramAccounts).where(eq3(instagramAccounts.id, parseInt(accountId))).limit(1);
        let accountRef = pageRef;
        if (account?.platform === "instagram" && page) {
          let igUserId = page.igUserId;
          if (!igUserId) {
            try {
              const igRes = await fetch(
                `${FB_GRAPH_URL}/${page.pageId}?fields=instagram_business_account&access_token=${page.pageToken}`
              );
              if (igRes.ok) {
                const igData = await igRes.json();
                igUserId = igData?.instagram_business_account?.id;
              }
            } catch (err) {
              console.warn("[Facebook] N\xE3o foi poss\xEDvel obter conta Instagram Business:", err);
            }
          }
          if (!igUserId && ENV.igUserId) {
            igUserId = ENV.igUserId;
            console.log(`[Facebook] Instagram ID via IG_USER_ID env: ${igUserId}`);
          }
          if (igUserId) {
            accountRef = `ig:${igUserId}`;
            console.log(`[Facebook] Instagram Business Account: ${igUserId}`);
          } else {
            console.warn("[Facebook] P\xE1gina sem Instagram Business vinculado \u2014 verifique conta Creator/Business no Meta");
          }
        }
        await db.update(instagramAccounts).set({
          accessToken: page ? page.pageToken : finalToken,
          tokenExpiresAt: expiresAt,
          linkedinUrn: accountRef
        }).where(eq3(instagramAccounts.id, parseInt(accountId)));
        console.log(`[Facebook] Token salvo para conta ${accountId} (ref: ${accountRef})`);
      } else {
        console.warn("[Facebook] OAuth sem accountId \u2014 token n\xE3o associado a nenhuma conta");
        return finishOAuth(res, { origin, popup, provider: "facebook", success: false, error: "missing_account_id" });
      }
      finishOAuth(res, { origin, popup, provider: "facebook", success: true });
    } catch (err) {
      console.error("[Facebook] Callback error:", err);
      finishOAuth(res, { origin, popup, provider: "facebook", success: false, error: "callback_failed" });
    }
  });
}
async function publishToFacebook(params) {
  const { pageToken, pageId, caption, imageUrl } = params;
  let postId;
  if (imageUrl) {
    const formData = new URLSearchParams({
      caption,
      url: imageUrl,
      access_token: pageToken,
      published: "true"
    });
    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook photo post failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    postId = data.post_id ?? data.id ?? "";
  } else {
    const formData = new URLSearchParams({
      message: caption,
      access_token: pageToken
    });
    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook feed post failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    postId = data.id ?? "";
  }
  const permalink = postId ? `https://www.facebook.com/${pageId}/posts/${postId.split("_")[1] ?? postId}` : `https://www.facebook.com/${pageId}`;
  return { postId, permalink };
}

// server/autonomousAgent.ts
var IG_GRAPH = "https://graph.facebook.com/v19.0";
async function resolveMediaUrl(mediaUrl) {
  if (mediaUrl.startsWith("/manus-storage/") || mediaUrl.startsWith("/storage/")) {
    const appUrl = ENV.appUrl.replace(/\/$/, "");
    try {
      return await storageGetSignedUrl(mediaUrl);
    } catch {
      return `${appUrl}${mediaUrl}`;
    }
  }
  if (mediaUrl.startsWith("/")) {
    return `${ENV.appUrl.replace(/\/$/, "")}${mediaUrl}`;
  }
  return mediaUrl;
}
var LI_API = "https://api.linkedin.com/v2";
async function publishToInstagram(params) {
  const { igUserId, accessToken, caption, imageUrl } = params;
  const containerBody = {
    caption,
    access_token: accessToken
  };
  if (imageUrl) {
    containerBody.image_url = imageUrl;
    containerBody.media_type = "IMAGE";
  } else {
    throw new Error("Instagram requer pelo menos uma imagem");
  }
  const containerRes = await fetch(`${IG_GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(containerBody).toString()
  });
  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`IG media container failed: ${containerRes.status} ${err}`);
  }
  const { id: creationId } = await containerRes.json();
  const publishRes = await fetch(`${IG_GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }).toString()
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`IG media_publish failed: ${publishRes.status} ${err}`);
  }
  const { id: mediaId } = await publishRes.json();
  const permalink = `https://www.instagram.com/p/${mediaId}/`;
  return { postId: mediaId, permalink };
}
async function fetchIgComments(mediaId, accessToken) {
  const res = await fetch(
    `${IG_GRAPH}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${accessToken}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}
async function replyIgComment(commentId, message, accessToken) {
  await fetch(`${IG_GRAPH}/${commentId}/replies`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message, access_token: accessToken }).toString()
  });
}
async function autoReplyIgComments(igUserId, accessToken, postCaption) {
  const mediaRes = await fetch(
    `${IG_GRAPH}/${igUserId}/media?fields=id,timestamp&limit=10&access_token=${accessToken}`
  );
  if (!mediaRes.ok) return;
  const media = (await mediaRes.json()).data ?? [];
  for (const post of media) {
    const comments = await fetchIgComments(post.id, accessToken);
    for (const comment of comments) {
      if (!comment.text || comment.username?.toLowerCase().includes("triarc")) continue;
      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Voc\xEA \xE9 o social media manager da Triarc Solutions. Responda coment\xE1rios de forma profissional, amig\xE1vel e aut\xEAntica. Nunca mencione que \xE9 IA. Resposta curta (m\xE1ximo 2 frases). Contexto do post: ${postCaption?.slice(0, 200)}`
            },
            { role: "user", content: `Coment\xE1rio de @${comment.username}: "${comment.text}"` }
          ]
        });
        const reply = res.choices?.[0]?.message?.content?.trim();
        if (reply) {
          await replyIgComment(comment.id, reply, accessToken);
          console.log(`[IG] Respondido @${comment.username}: ${reply.slice(0, 60)}...`);
        }
      } catch (e) {
        console.warn(`[IG] Falha ao responder coment\xE1rio ${comment.id}:`, e.message);
      }
    }
  }
}
async function autoReplyFbComments(pageId, pageToken) {
  const postsRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message&limit=10&access_token=${pageToken}`
  );
  if (!postsRes.ok) return;
  const fbPosts = (await postsRes.json()).data ?? [];
  for (const post of fbPosts) {
    const commentsRes = await fetch(
      `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from&access_token=${pageToken}`
    );
    if (!commentsRes.ok) continue;
    const comments = (await commentsRes.json()).data ?? [];
    for (const comment of comments) {
      if (!comment.message) continue;
      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Voc\xEA \xE9 o social media manager da Triarc Solutions. Responda coment\xE1rios de forma profissional e amig\xE1vel. Resposta curta (m\xE1ximo 2 frases).`
            },
            { role: "user", content: `Coment\xE1rio de ${comment.from?.name ?? "algu\xE9m"}: "${comment.message}"` }
          ]
        });
        const reply = res.choices?.[0]?.message?.content?.trim();
        if (reply) {
          await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ message: reply, access_token: pageToken }).toString()
          });
          console.log(`[FB] Respondido ${comment.from?.name}: ${reply.slice(0, 60)}...`);
        }
      } catch (e) {
        console.warn(`[FB] Falha ao responder coment\xE1rio ${comment.id}:`, e.message);
      }
    }
  }
}
async function acceptLinkedInInvitations(accessToken) {
  let accepted = 0;
  try {
    const res = await fetch(`${LI_API}/invitations?invitationType=CONNECTION`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const invitations = data.elements ?? [];
    for (const inv of invitations.slice(0, 20)) {
      try {
        await fetch(`${LI_API}/invitations/${inv.entityUrn}?action=accept`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" }
        });
        accepted++;
      } catch {
      }
    }
  } catch (e) {
    console.warn("[LinkedIn] Falha ao aceitar convites:", e.message);
  }
  console.log(`[LinkedIn] Aceitos ${accepted} convites de conex\xE3o`);
  return accepted;
}
async function sendLinkedInConnectionRequests(accessToken, dailyLimit = 100) {
  let sent = 0;
  try {
    const searches = [
      "CTO Brasil tecnologia",
      "CEO startup inova\xE7\xE3o",
      "Gerente TI",
      "Desenvolvedor software"
    ];
    for (const query of searches) {
      if (sent >= dailyLimit) break;
      const searchRes = await fetch(
        `${LI_API}/search/blended?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER&q=blended&start=0&count=25`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!searchRes.ok) continue;
      const data = await searchRes.json();
      const people = (data.elements ?? []).filter((e) => e["$type"]?.includes("MiniProfile")).slice(0, Math.floor(dailyLimit / searches.length));
      for (const person of people) {
        if (sent >= dailyLimit) break;
        try {
          const profileUrn = person.objectUrn;
          if (!profileUrn) continue;
          await fetch(`${LI_API}/invitations`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "content-type": "application/json",
              "x-restli-protocol-version": "2.0.0"
            },
            body: JSON.stringify({
              invitee: {
                "com.linkedin.voyager.growth.invitation.InviteeProfile": {
                  profileId: person.publicIdentifier
                }
              },
              message: "Ol\xE1! Sou da Triarc Solutions, empresa de tecnologia e inova\xE7\xE3o. Seria um prazer conectarmos!"
            })
          });
          sent++;
          await new Promise((r) => setTimeout(r, 2e3));
        } catch {
        }
      }
    }
  } catch (e) {
    console.warn("[LinkedIn] Falha ao enviar convites:", e.message);
  }
  console.log(`[LinkedIn] Enviados ${sent} convites de conex\xE3o`);
  return sent;
}
var MAX_RETRIES = 3;
var dailyConnectionsSent = 0;
var lastConnectionReset = (/* @__PURE__ */ new Date()).toDateString();
async function runAutonomousAgent() {
  const result = { postsPublished: 0, commentsReplied: 0, connectionsAccepted: 0, connectionsSent: 0, errors: [] };
  if ((/* @__PURE__ */ new Date()).toDateString() !== lastConnectionReset) {
    dailyConnectionsSent = 0;
    lastConnectionReset = (/* @__PURE__ */ new Date()).toDateString();
  }
  const allAccounts = await getAllAccounts();
  const approved = await getPostsByStatus("approved");
  const now = /* @__PURE__ */ new Date();
  for (const post of approved) {
    if (post.mcpPending && post.updatedAt) {
      const stuckMs = now.getTime() - new Date(post.updatedAt).getTime();
      if (stuckMs > 5 * 60 * 1e3) {
        await updatePost(post.id, { mcpPending: 0 });
        post.mcpPending = 0;
        console.log(`[Agent] Post ${post.id}: mcpPending resetado (travado h\xE1 ${Math.round(stuckMs / 6e4)}min)`);
      }
    }
  }
  const readyPosts = approved.filter((p) => {
    if (p.mcpPending) return false;
    if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
    if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
    return true;
  });
  for (const post of readyPosts) {
    await updatePost(post.id, { mcpPending: 1 });
    const media = await getPostMedia(post.id);
    const rawImageUrl = media?.[0]?.mediaUrl || void 0;
    const imageUrl = rawImageUrl ? await resolveMediaUrl(rawImageUrl) : void 0;
    const igAccount2 = allAccounts.find(
      (a) => a.id === post.accountId && a.platform === "instagram" && a.accessToken
    ) ?? allAccounts.find((a) => a.platform === "instagram" && a.accessToken);
    const igToken2 = igAccount2?.accessToken || ENV.igAccessToken;
    if (!igToken2) {
      console.warn(`[Agent] Post ${post.id}: sem token Instagram \u2014 configure IG_ACCESS_TOKEN ou conecte em Contas`);
      await updatePost(post.id, { mcpPending: 0 });
      result.errors.push(`Post ${post.id}: sem token Instagram`);
      continue;
    }
    const igUserId = igAccount2?.linkedinUrn?.startsWith("ig:") ? igAccount2.linkedinUrn.replace("ig:", "") : ENV.igUserId;
    if (!igUserId) {
      console.warn(`[Agent] Post ${post.id}: IG_USER_ID n\xE3o configurado`);
      await updatePost(post.id, { mcpPending: 0 });
      result.errors.push(`Post ${post.id}: IG_USER_ID n\xE3o configurado`);
      continue;
    }
    const prevLogs = await getPublicationLogsByPost(post.id);
    const attempt = prevLogs.length + 1;
    try {
      const igRes = await publishToInstagram({
        igUserId,
        accessToken: igToken2,
        caption: post.caption ?? "",
        imageUrl
      });
      await updatePost(post.id, {
        status: "published",
        publishedAt: /* @__PURE__ */ new Date(),
        instagramPostId: igRes.postId,
        instagramPermalink: igRes.permalink,
        mcpPending: 0,
        retryCount: 0
      });
      await createPublicationLog({ postId: post.id, attempt, status: "success", instagramPostId: igRes.postId, permalink: igRes.permalink });
      await notifyOwner({ title: "\u2705 Post publicado no Instagram", content: `Post #${post.id}: ${igRes.permalink}` });
      result.postsPublished++;
      console.log(`[Agent] Post ${post.id} publicado no Instagram: ${igRes.permalink}`);
      await publishToOtherPlatforms(post.id, post.caption ?? "", imageUrl, allAccounts);
    } catch (err) {
      await createPublicationLog({ postId: post.id, attempt, status: "failed", error: err.message });
      if (attempt >= MAX_RETRIES) {
        await updatePost(post.id, { status: "rejected", mcpPending: 0, retryCount: attempt });
        await notifyOwner({ title: "\u274C Falha ao publicar", content: `Post #${post.id} falhou ap\xF3s ${MAX_RETRIES} tentativas: ${err.message}` });
      } else {
        const nextRetryAt = new Date(Date.now() + 5 * 60 * 1e3);
        await updatePost(post.id, { mcpPending: 0, retryCount: attempt, nextRetryAt });
      }
      result.errors.push(`Post ${post.id}: ${err.message}`);
      console.error(`[Agent] Falha ao publicar post ${post.id}:`, err.message);
    }
  }
  const igAccount = allAccounts.find((a) => a.platform === "instagram" && a.accessToken);
  const igToken = igAccount?.accessToken || ENV.igAccessToken;
  if (igToken && ENV.igUserId) {
    try {
      await autoReplyIgComments(ENV.igUserId, igToken, "Triarc Solutions");
    } catch (e) {
      result.errors.push(`IG comments: ${e.message}`);
    }
  }
  const fbAccounts = allAccounts.filter((a) => a.platform === "facebook" && a.accessToken && a.linkedinUrn);
  if (fbAccounts.length > 0) {
    for (const fbAcc of fbAccounts) {
      const pageId = fbAcc.linkedinUrn.startsWith("fb:page:") ? fbAcc.linkedinUrn.replace("fb:page:", "") : null;
      if (!pageId) continue;
      try {
        await autoReplyFbComments(pageId, fbAcc.accessToken);
      } catch (e) {
        result.errors.push(`FB comments: ${e.message}`);
      }
    }
  } else if (ENV.fbPageToken && ENV.fbPageId) {
    try {
      await autoReplyFbComments(ENV.fbPageId, ENV.fbPageToken);
    } catch (e) {
      result.errors.push(`FB comments: ${e.message}`);
    }
  }
  const liAccount = allAccounts.find((a) => a.platform === "linkedin" && a.accessToken);
  const liToken = liAccount?.accessToken || ENV.liAccessToken;
  if (liToken) {
    try {
      result.connectionsAccepted = await acceptLinkedInInvitations(liToken);
    } catch (e) {
      result.errors.push(`LI accept: ${e.message}`);
    }
    if (dailyConnectionsSent < 100) {
      try {
        const toSend = 100 - dailyConnectionsSent;
        const sent = await sendLinkedInConnectionRequests(liToken, toSend);
        dailyConnectionsSent += sent;
        result.connectionsSent = sent;
      } catch (e) {
        result.errors.push(`LI connections: ${e.message}`);
      }
    }
  }
  console.log(`[Agent] Ciclo completo: ${result.postsPublished} publicados, ${result.connectionsAccepted} convites aceitos, ${result.connectionsSent} solicita\xE7\xF5es enviadas`);
  return result;
}
async function publishToOtherPlatforms(postId, caption, imageUrl, allAccounts) {
  const liAccounts = allAccounts.filter((a) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn);
  for (const liAcc of liAccounts) {
    try {
      const res = await publishToLinkedIn({ accessToken: liAcc.accessToken, linkedinUrn: liAcc.linkedinUrn, caption, imageUrl });
      await updatePost(postId, { linkedinPublished: 1 });
      console.log(`[Agent] Post ${postId} publicado no LinkedIn: ${res.permalink}`);
    } catch (e) {
      console.error(`[Agent] LinkedIn falhou para post ${postId}:`, e.message);
    }
  }
  const fbAccounts = allAccounts.filter((a) => a.platform === "facebook" && a.accessToken && a.linkedinUrn);
  for (const fbAcc of fbAccounts) {
    const pageId = fbAcc.linkedinUrn.startsWith("fb:page:") ? fbAcc.linkedinUrn.replace("fb:page:", "") : "me";
    try {
      const res = await publishToFacebook({ pageToken: fbAcc.accessToken, pageId, caption, imageUrl });
      await updatePost(postId, { facebookPublished: 1 });
      console.log(`[Agent] Post ${postId} publicado no Facebook: ${res.permalink}`);
    } catch (e) {
      console.error(`[Agent] Facebook falhou para post ${postId}:`, e.message);
    }
  }
}

// server/routers/research.ts
init_db();
init_schema();
import { z as z2 } from "zod";
import { eq as eq4, desc as desc2 } from "drizzle-orm";
var NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";
var APP_CONTEXT = `A Triarc Solutions \xE9 uma empresa de tecnologia e inova\xE7\xE3o com sede em Maca\xE9/RJ. Pilares: Gest\xE3o, Treinamento e Tecnologia. Servi\xE7os: IA e automa\xE7\xE3o, desenvolvimento de software, data science. Site: triarcsolutions.com.br.`;
var TRIARC_TONE = `Tom corporativo profissional, moderno e acess\xEDvel. Posicione a Triarc Solutions como refer\xEAncia em tecnologia. Inclua CTA para triarcsolutions.com.br e hashtags do nicho tech/IA.`;
async function fetchNews(query, language) {
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  const lang = language === "pt" ? "pt" : "en";
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${yesterday}&language=${lang}&pageSize=5&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": "TriarcSocialManager/1.0" } });
  const data = await res.json();
  if (data.status !== "ok" || !data.articles?.length) return [];
  return data.articles.slice(0, 5).map((a) => ({ title: a.title, description: a.description ?? "", url: a.url }));
}
async function generateCaption(topicName, articles) {
  const headlines = articles.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join("\n");
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `${APP_CONTEXT}
${TRIARC_TONE}
Voc\xEA \xE9 especialista em marketing digital para Instagram.
REGRAS DE PORTUGU\xCAS: portugu\xEAs brasileiro correto, acentua\xE7\xE3o perfeita, zero erros de ortografia ou digita\xE7\xE3o.` },
      {
        role: "user",
        content: `Crie uma legenda impactante para o Instagram da @triarcsolutions sobre o tema: "${topicName}".
Baseie-se nestas not\xEDcias das \xFAltimas 24 horas:
${headlines}

Requisitos:
- Conecte as novidades ao posicionamento da Triarc Solutions
- Tom profissional e inspirador
- M\xE1ximo 2200 caracteres
- Inclua emojis estrat\xE9gicos
- Termine com CTA para triarcsolutions.com.br
- Inclua 5-10 hashtags relevantes`
      }
    ]
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
async function generateArtForResearch(topicName, _headlines) {
  const { url } = await generateImage({
    prompt: buildTriarcImagePrompt(topicName),
    originalImages: [{ url: TRIARC_LOGO_URL, mimeType: "image/jpeg" }]
  });
  if (!url) throw new Error("Falha ao gerar imagem");
  return url;
}
var researchRouter = router({
  // Listar tópicos
  listTopics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(researchTopics).orderBy(researchTopics.sortOrder, researchTopics.createdAt);
  }),
  // Criar tópico
  createTopic: protectedProcedure.input(z2.object({
    accountId: z2.number(),
    name: z2.string().min(1).max(256),
    query: z2.string().min(1).max(512),
    language: z2.enum(["pt", "en"]).default("pt"),
    publishHour: z2.number().min(0).max(23).default(8)
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const result = await db.insert(researchTopics).values({
      accountId: input.accountId,
      name: input.name,
      query: input.query,
      language: input.language,
      publishHour: input.publishHour,
      active: 1
    }).returning({ id: researchTopics.id });
    return { id: result[0].id };
  }),
  // Atualizar tópico (ativar/desativar, editar)
  updateTopic: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().min(1).max(256).optional(),
    query: z2.string().min(1).max(512).optional(),
    language: z2.enum(["pt", "en"]).optional(),
    active: z2.number().min(0).max(1).optional(),
    autoPublish: z2.number().min(0).max(1).optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...values } = input;
    await db.update(researchTopics).set(values).where(eq4(researchTopics.id, id));
    return { success: true };
  }),
  // Deletar tópico
  deleteTopic: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(researchTopics).where(eq4(researchTopics.id, input.id));
    return { success: true };
  }),
  // Histórico de execuções
  listRuns: protectedProcedure.input(z2.object({
    topicId: z2.number().optional(),
    limit: z2.number().default(20)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(researchRuns).orderBy(desc2(researchRuns.ranAt)).limit(input.limit);
    if (input.topicId) {
      return db.select().from(researchRuns).where(eq4(researchRuns.topicId, input.topicId)).orderBy(desc2(researchRuns.ranAt)).limit(input.limit);
    }
    return q;
  }),
  // Executar pesquisa manualmente para um tópico
  runNow: protectedProcedure.input(z2.object({ topicId: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [topic] = await db.select().from(researchTopics).where(eq4(researchTopics.id, input.topicId)).limit(1);
    if (!topic) throw new Error("T\xF3pico n\xE3o encontrado");
    try {
      const articles = await fetchNews(topic.query, topic.language);
      if (!articles.length) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Nenhuma not\xEDcia encontrada" });
        return { success: false, message: "Nenhuma not\xEDcia encontrada para este t\xF3pico" };
      }
      const caption = await generateCaption(topic.name, articles);
      const imageUrl = await generateArtForResearch(topic.name, articles.map((a) => a.title));
      const userId = ctx.user.id;
      const postStatus = topic.autoPublish === 1 ? "approved" : "pending";
      const postResult = await db.insert(posts).values({
        userId,
        accountId: topic.accountId,
        caption,
        theme: `Pesquisa Di\xE1ria: ${topic.name}`,
        status: postStatus,
        mcpPending: 0
      }).returning({ id: posts.id });
      const postId = postResult[0].id;
      await db.insert(postMedia).values({
        postId,
        mediaUrl: imageUrl,
        mediaType: "image",
        sortOrder: 0
      });
      await db.insert(researchRuns).values({
        topicId: topic.id,
        postId,
        headlines: JSON.stringify(articles.map((a) => a.title)),
        status: "success"
      });
      return { success: true, postId, autoPublished: postStatus === "approved", message: `Post criado com sucesso! ID: ${postId}` };
    } catch (err) {
      await db.insert(researchRuns).values({
        topicId: topic.id,
        status: "failed",
        error: err?.message ?? "Erro desconhecido"
      });
      throw err;
    }
  }),
  // Executar todos os tópicos ativos (usado pelo cron)
  runAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const activeTopics = await db.select().from(researchTopics).where(eq4(researchTopics.active, 1));
    const results = [];
    for (const topic of activeTopics) {
      try {
        const articles = await fetchNews(topic.query, topic.language);
        if (!articles.length) {
          await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Sem not\xEDcias" });
          results.push({ topicId: topic.id, name: topic.name, success: false, error: "Sem not\xEDcias" });
          continue;
        }
        const caption = await generateCaption(topic.name, articles);
        const imageUrl = await generateArtForResearch(topic.name, articles.map((a) => a.title));
        const runAllStatus = topic.autoPublish === 1 ? "approved" : "pending";
        const postResult = await db.insert(posts).values({
          userId: ctx.user.id,
          accountId: topic.accountId,
          caption,
          theme: `Pesquisa Di\xE1ria: ${topic.name}`,
          status: runAllStatus,
          mcpPending: 0
        }).returning({ id: posts.id });
        const postId = postResult[0].id;
        await db.insert(postMedia).values({ postId, mediaUrl: imageUrl, mediaType: "image", sortOrder: 0 });
        await db.insert(researchRuns).values({
          topicId: topic.id,
          postId,
          headlines: JSON.stringify(articles.map((a) => a.title)),
          status: "success"
        });
        results.push({ topicId: topic.id, name: topic.name, success: true, postId });
      } catch (err) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "failed", error: err?.message });
        results.push({ topicId: topic.id, name: topic.name, success: false, error: err?.message });
      }
    }
    return { results, total: activeTopics.length, succeeded: results.filter((r) => r.success).length };
  })
});

// server/routers.ts
init_seed_triarc();
init_schema();
init_db();
var APP_CONTEXT2 = `A Triarc Solutions \xE9 uma empresa de tecnologia e inova\xE7\xE3o com sede em Maca\xE9/RJ. Site oficial: triarcsolutions.com.br. Pilares: Gest\xE3o, Treinamento e Tecnologia. Servi\xE7os: desenvolvimento de software sob encomenda, IA e automa\xE7\xE3o, gest\xE3o empresarial, suporte t\xE9cnico em TI, automa\xE7\xE3o industrial, treinamento profissional, licenciamento de software e data science. Projetos em destaque: TopFlow.ai (SEO com IA), COPE (plataforma de conex\xE3o de profissionais), SS-Milhas (gest\xE3o de milhas), TransCarga (log\xEDstica inteligente), TRIARC CRM, NutriSystem, Grupo Conecta e mais de 36 projetos entregues. O Triarc Social Manager \xE9 a plataforma interna de automa\xE7\xE3o de conte\xFAdo para Instagram da Triarc Solutions.`;
var TRIARC_TONE2 = `Use um tom corporativo profissional, moderno e acess\xEDvel. Posicione a Triarc Solutions como refer\xEAncia em tecnologia e inova\xE7\xE3o. Destaque expertise t\xE9cnica, resultados concretos e valor para o cliente. Sempre inclua CTA direcionando para triarcsolutions.com.br. Use hashtags do nicho tech/inova\xE7\xE3o/neg\xF3cios.`;
var CAPTION_PT_RULES = `REGRAS DE PORTUGU\xCAS (obrigat\xF3rio):
- Portugu\xEAs brasileiro correto, com acentua\xE7\xE3o perfeita (\xE7\xE3o, \xE3, \xF5es, etc.)
- Zero erros de ortografia ou digita\xE7\xE3o
- Frases completas e gramaticalmente corretas
- N\xE3o invente palavras nem use anglicismos desnecess\xE1rios`;
var appRouter = router({
  system: systemRouter,
  research: researchRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  accounts: router({
    list: protectedProcedure.query(async () => {
      return getAllAccounts();
    }),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getAccountById(input.id);
    }),
    stats: protectedProcedure.input(z3.object({ accountId: z3.number() })).query(async ({ input }) => {
      return getAccountStats(input.accountId);
    }),
    create: protectedProcedure.input(z3.object({
      handle: z3.string().min(1).max(128),
      displayName: z3.string().min(1).max(256),
      platform: z3.enum(["instagram", "linkedin", "facebook", "tiktok", "youtube"]).default("instagram"),
      accountType: z3.enum(["personal", "business"]).default("business"),
      tone: z3.enum(["personal", "corporate"]).default("corporate"),
      bio: z3.string().optional(),
      profileUrl: z3.string().optional()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indispon\xEDvel. Verifique se DATABASE_URL est\xE1 configurada nas vari\xE1veis de ambiente do Vercel.");
      const result = await db.insert(instagramAccounts).values({
        handle: input.handle,
        displayName: input.displayName,
        platform: input.platform,
        accountType: input.accountType,
        tone: input.tone,
        bio: input.bio ?? null,
        profileUrl: input.profileUrl ?? null
      }).returning({ id: instagramAccounts.id });
      return { id: result[0].id };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indispon\xEDvel. Verifique se DATABASE_URL est\xE1 configurada nas vari\xE1veis de ambiente do Vercel.");
      await db.delete(instagramAccounts).where(eq5(instagramAccounts.id, input.id));
      return { success: true };
    })
  }),
  posts: router({
    create: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      caption: z3.string().optional(),
      theme: z3.string().optional(),
      scheduledAt: z3.string().optional(),
      mediaUrls: z3.array(z3.string()).optional(),
      mediaUrl: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const scheduledDate = input.scheduledAt ? new Date(input.scheduledAt) : void 0;
      const isFutureSchedule = scheduledDate && scheduledDate > /* @__PURE__ */ new Date();
      const { id } = await createPost({
        userId: ctx.user.id,
        accountId: input.accountId,
        caption: input.caption,
        theme: input.theme,
        scheduledAt: scheduledDate,
        status: isFutureSchedule ? "scheduled" : "pending",
        mcpPending: 0
      });
      const urls = input.mediaUrls ?? (input.mediaUrl ? [input.mediaUrl] : []);
      for (let i = 0; i < urls.length; i++) {
        await addPostMedia(id, urls[i], "image", i);
      }
      if (!isFutureSchedule) {
        const account = await getAccountById(input.accountId);
        await notifyOwner({
          title: "Novo post pronto para aprova\xE7\xE3o",
          content: `Um post para @${account?.handle ?? "desconhecido"} est\xE1 aguardando sua aprova\xE7\xE3o. Tema: ${input.theme ?? "Sem tema"}`
        });
      }
      return { id };
    }),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) return null;
      const media = await getPostMedia(input.id);
      return { ...post, media };
    }),
    list: protectedProcedure.input(z3.object({
      accountId: z3.number().optional(),
      status: z3.string().optional()
    }).optional()).query(async ({ input }) => {
      if (input?.accountId && input?.status) {
        return getPostsByAccount(input.accountId, input.status);
      }
      if (input?.accountId) {
        return getPostsByAccount(input.accountId);
      }
      if (input?.status) {
        return getPostsByStatus(input.status);
      }
      return getAllPosts();
    }),
    update: protectedProcedure.input(z3.object({
      id: z3.number(),
      caption: z3.string().optional(),
      theme: z3.string().optional(),
      scheduledAt: z3.string().nullable().optional(),
      status: z3.string().optional()
    })).mutation(async ({ input }) => {
      const data = {};
      if (input.caption !== void 0) data.caption = input.caption;
      if (input.theme !== void 0) data.theme = input.theme;
      if (input.scheduledAt !== void 0) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (input.status !== void 0) data.status = input.status;
      await updatePost(input.id, data);
      return { success: true };
    }),
    approve: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new Error("Post not found");
      if (!post.scheduledAt || new Date(post.scheduledAt) <= /* @__PURE__ */ new Date()) {
        await updatePost(input.id, { status: "approved", mcpPending: 0 });
        return { success: true, status: "approved" };
      }
      await updatePost(input.id, { status: "scheduled" });
      return { success: true, status: "scheduled" };
      ;
    }),
    reject: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "rejected" });
      return { success: true };
    }),
    submitForApproval: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "pending" });
      const post = await getPostById(input.id);
      const account = post ? await getAccountById(post.accountId) : null;
      await notifyOwner({
        title: "Novo post pronto para aprova\xE7\xE3o",
        content: `Um post para @${account?.handle ?? "desconhecido"} est\xE1 aguardando sua aprova\xE7\xE3o. Tema: ${post?.theme ?? "Sem tema"}`
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deletePost(input.id);
      return { success: true };
    }),
    addMedia: protectedProcedure.input(z3.object({
      postId: z3.number(),
      mediaUrl: z3.string(),
      mediaType: z3.enum(["image", "video"]).optional(),
      sortOrder: z3.number().optional()
    })).mutation(async ({ input }) => {
      const { id } = await addPostMedia(input.postId, input.mediaUrl, input.mediaType ?? "image", input.sortOrder ?? 0);
      return { id };
    }),
    removeMedia: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deletePostMedia(input.id);
      return { success: true };
    }),
    getMedia: protectedProcedure.input(z3.object({ postId: z3.number() })).query(async ({ input }) => {
      return getPostMedia(input.postId);
    })
  }),
  assets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAssetsByUser(ctx.user.id);
    }),
    upload: protectedProcedure.input(z3.object({
      name: z3.string(),
      base64: z3.string(),
      mimeType: z3.string()
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const fileKey = `assets/${ctx.user.id}/${Date.now()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const { id } = await createAsset({
        userId: ctx.user.id,
        name: input.name,
        url,
        fileKey,
        mimeType: input.mimeType
      });
      return { id, url };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deleteAsset(input.id);
      return { success: true };
    })
  }),
  themes: router({
    list: protectedProcedure.query(async () => {
      return getAllThemes();
    })
  }),
  automation: router({
    generateWeek: protectedProcedure.input(z3.object({
      accountIds: z3.array(z3.number()).optional()
    })).mutation(async ({ ctx, input }) => {
      const accounts = await getAllAccounts();
      const targetAccounts = input.accountIds ? accounts.filter((a) => input.accountIds.includes(a.id)) : accounts;
      if (targetAccounts.length === 0) throw new Error("Nenhuma conta encontrada");
      const db = await getDb();
      const triacItems = db ? await db.select().from(triacContent) : [];
      const contentItems = triacItems.length > 0 ? triacItems : TRIARC_PROJECTS.map((p, i) => ({ id: i + 1, name: p.name, subtitle: p.subtitle, description: p.description, category: p.category, type: "projeto" }));
      if (contentItems.length === 0) throw new Error("Nenhum conte\xFAdo Triarc encontrado");
      const bestTimes = [
        { hour: 8, minute: 0 },
        // Manhã cedo
        { hour: 12, minute: 30 },
        // Almoço
        { hour: 18, minute: 0 },
        // Fim do expediente
        { hour: 20, minute: 0 }
        // Noite
      ];
      const createdPosts = [];
      const now = /* @__PURE__ */ new Date();
      for (let day = 1; day <= 7; day++) {
        for (const account of targetAccounts) {
          const theme = contentItems[(day + account.id) % contentItems.length];
          const scheduleDate = new Date(now);
          scheduleDate.setDate(now.getDate() + day);
          const timeSlot = bestTimes[(day + account.id) % bestTimes.length];
          scheduleDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
          const toneInstruction = TRIARC_TONE2;
          let caption = "";
          try {
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `Voc\xEA \xE9 um especialista em marketing de conte\xFAdo para Instagram. ${APP_CONTEXT2}

${toneInstruction}

${CAPTION_PT_RULES}

A legenda deve incluir:
- Texto envolvente e relevante ao tema/projeto/servi\xE7o
- Hashtags estrat\xE9gicas (8-15 hashtags do nicho tech, inova\xE7\xE3o, neg\xF3cios)
- CTA claro direcionando para triarcsolutions.com.br
- Emojis moderados e profissionais

Responda APENAS com a legenda pronta.`
                },
                {
                  role: "user",
                  content: `Crie uma legenda para @triarcsolutions no Instagram. Tema/Projeto: ${theme.name}. Dia ${day} da semana de conte\xFAdo. Foque em mostrar o valor e impacto desse servi\xE7o/projeto para empresas e profissionais.`
                }
              ]
            });
            const rawContent = response.choices?.[0]?.message?.content;
            caption = typeof rawContent === "string" ? rawContent : "";
          } catch (e) {
            caption = `[Erro na gera\xE7\xE3o] Tema: ${theme.name} para @${account.handle}`;
          }
          let mediaUrl = "";
          try {
            const artResult = await generateImage({
              prompt: buildTriarcImagePrompt(theme.name),
              originalImages: [{ url: TRIARC_LOGO_URL, mimeType: "image/jpeg" }]
            });
            mediaUrl = artResult.url ?? "";
          } catch (e) {
          }
          const { id } = await createPost({
            userId: ctx.user.id,
            accountId: account.id,
            caption,
            theme: theme.name,
            scheduledAt: scheduleDate,
            status: "pending"
          });
          if (mediaUrl) {
            await addPostMedia(id, mediaUrl, "image", 0);
          }
          createdPosts.push({ id, account: account.handle, theme: theme.name, day });
        }
      }
      await notifyOwner({
        title: `${createdPosts.length} posts gerados automaticamente`,
        content: `A automa\xE7\xE3o criou ${createdPosts.length} posts para a semana. Eles est\xE3o aguardando sua aprova\xE7\xE3o no painel.`
      });
      return { created: createdPosts.length, posts: createdPosts };
    }),
    generateBatch: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      themes: z3.array(z3.string()),
      startDate: z3.string(),
      intervalHours: z3.number().default(24)
    })).mutation(async ({ ctx, input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Conta n\xE3o encontrada");
      const createdPosts = [];
      const startDate = new Date(input.startDate);
      for (let i = 0; i < input.themes.length; i++) {
        const theme = input.themes[i];
        const scheduleDate = new Date(startDate);
        scheduleDate.setHours(scheduleDate.getHours() + i * input.intervalHours);
        const toneInstruction = TRIARC_TONE2;
        let caption = "";
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voc\xEA \xE9 um especialista em marketing para Instagram. ${APP_CONTEXT2}

${toneInstruction}

${CAPTION_PT_RULES}

Inclua hashtags estrat\xE9gicas do nicho tech/inova\xE7\xE3o, CTA claro para triarcsolutions.com.br. Responda APENAS com a legenda.`
              },
              { role: "user", content: `Legenda para @triarcsolutions. Tema/Projeto: ${theme}. Destaque o impacto e valor para o cliente.` }
            ]
          });
          const rawBatch = response.choices?.[0]?.message?.content;
          caption = typeof rawBatch === "string" ? rawBatch : "";
        } catch (e) {
          caption = `[Erro] Tema: ${theme}`;
        }
        let mediaUrl = "";
        try {
          const artResult = await generateImage({
            prompt: buildTriarcImagePrompt(theme),
            originalImages: [{ url: TRIARC_LOGO_URL, mimeType: "image/jpeg" }]
          });
          mediaUrl = artResult.url ?? "";
        } catch (e) {
        }
        const { id } = await createPost({
          userId: ctx.user.id,
          accountId: account.id,
          caption,
          theme,
          scheduledAt: scheduleDate,
          status: "pending"
        });
        if (mediaUrl) await addPostMedia(id, mediaUrl, "image", 0);
        createdPosts.push({ id, theme, scheduledAt: scheduleDate.toISOString() });
      }
      await notifyOwner({
        title: `Lote de ${createdPosts.length} posts gerados`,
        content: `${createdPosts.length} posts para @${account.handle} aguardam aprova\xE7\xE3o.`
      });
      return { created: createdPosts.length, posts: createdPosts };
    }),
    getQueue: protectedProcedure.input(z3.object({
      accountId: z3.number().optional()
    }).optional()).query(async ({ input }) => {
      const statuses = ["pending", "approved", "scheduled"];
      const allPosts = input?.accountId ? await getPostsByAccount(input.accountId) : await getAllPosts();
      return allPosts.filter((p) => statuses.includes(p.status)).sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return dateA - dateB;
      });
    }),
    approveAll: protectedProcedure.mutation(async () => {
      const pendingPosts = await getPostsByStatus("pending");
      let approved = 0;
      let scheduled = 0;
      for (const post of pendingPosts) {
        const p = post;
        if (!p.scheduledAt || new Date(p.scheduledAt) <= /* @__PURE__ */ new Date()) {
          await updatePost(p.id, { status: "approved", mcpPending: 0 });
          approved++;
        } else {
          await updatePost(p.id, { status: "scheduled" });
          scheduled++;
        }
      }
      return { approved, published: 0, scheduled, total: pendingPosts.length };
    }),
    processScheduled: protectedProcedure.mutation(async () => {
      return processScheduledPosts();
    }),
    publishNow: protectedProcedure.input(z3.object({
      postId: z3.number(),
      approveFirst: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post n\xE3o encontrado");
      if (input.approveFirst && post.status === "pending") {
        await updatePost(input.postId, { status: "approved", mcpPending: 0 });
      } else {
        await updatePost(input.postId, { status: "approved", mcpPending: 0, retryCount: 0 });
      }
      const result = await runAutonomousAgent();
      const published = result.postsPublished > 0;
      const refreshed = await getPostById(input.postId);
      if (refreshed?.status === "published") {
        return {
          success: true,
          published: true,
          permalink: refreshed.instagramPermalink,
          message: "Post publicado no Instagram com sucesso!"
        };
      }
      if (result.errors.length > 0) {
        throw new Error(result.errors[0]);
      }
      return {
        success: true,
        published,
        message: published ? "Post publicado com sucesso!" : "Post aprovado. Verifique se IG_ACCESS_TOKEN est\xE1 configurado ou conecte o Instagram em Contas."
      };
    }),
    getLogs: protectedProcedure.query(async () => {
      return getPublicationLogs(100);
    }),
    getPostLogs: protectedProcedure.input(z3.object({ postId: z3.number() })).query(async ({ input }) => {
      return getPublicationLogsByPost(input.postId);
    }),
    syncInsights: protectedProcedure.input(z3.object({ postId: z3.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post || !post.instagramPostId) throw new Error("Post not published or no Instagram ID");
      const insights = await fetchPostInsights(post.instagramPostId);
      await updatePost(input.postId, {
        likes: insights.likes ?? 0,
        comments: insights.comments ?? 0
      });
      return { success: true, insights };
    })
  }),
  triacContent: router({
    list: protectedProcedure.input(z3.object({
      type: z3.enum(["servico", "projeto", "all"]).optional()
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db.select().from(triacContent);
      if (input?.type && input.type !== "all") {
        return items.filter((i) => i.type === input.type);
      }
      return items;
    })
  }),
  analytics: router({
    // Dados da conta Instagram via MCP (chamado pelo agente, cacheado no banco)
    // Como o MCP só pode ser chamado pelo agente, estes endpoints retornam dados
    // armazenados no banco ou buscam via endpoint interno do agente.
    getAccountStats: protectedProcedure.query(async () => {
      const accounts = await getAllAccounts();
      const triarc = accounts.find((a) => a.handle === "triarcsolutions") || accounts[0];
      if (!triarc) return null;
      const stats = await getAccountStats(triarc.id);
      return { account: triarc, stats };
    }),
    getPostsWithMetrics: protectedProcedure.query(async () => {
      const published = await getPostsByStatus("published");
      return published.map((p) => ({
        id: p.id,
        caption: p.caption,
        publishedAt: p.publishedAt,
        instagramPostId: p.instagramPostId,
        instagramPermalink: p.instagramPermalink,
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        theme: p.theme,
        linkedinPublished: p.linkedinPublished ?? 0,
        facebookPublished: p.facebookPublished ?? 0
      }));
    }),
    syncAllInsights: protectedProcedure.mutation(async () => {
      const published = await getPostsByStatus("published");
      const postsWithId = published.filter((p) => p.instagramPostId);
      let updated = 0;
      const errors = [];
      for (const post of postsWithId) {
        try {
          const port = process.env.PORT || 3e3;
          const res = await fetch(`http://localhost:${port}/api/scheduled/insights/${post.instagramPostId}`, {
            headers: { "x-internal-key": process.env.JWT_SECRET || "internal" }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.likes !== void 0 || data.comments !== void 0) {
              await updatePost(post.id, { likes: data.likes ?? post.likes ?? 0, comments: data.comments ?? post.comments ?? 0 });
              updated++;
            }
          }
        } catch (e) {
          errors.push(`Post ${post.id}: ${e.message}`);
        }
      }
      return { updated, total: postsWithId.length, errors };
    }),
    getSummary: protectedProcedure.query(async () => {
      const [all, pending, approved, published, scheduled] = await Promise.all([
        getAllPosts(),
        getPostsByStatus("pending"),
        getPostsByStatus("approved"),
        getPostsByStatus("published"),
        getPostsByStatus("scheduled")
      ]);
      const publishedPosts = published;
      const totalLikes = publishedPosts.reduce((s, p) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s, p) => s + (p.comments ?? 0), 0);
      return {
        total: all.length,
        pending: pending.length,
        approved: approved.length,
        published: publishedPosts.length,
        scheduled: scheduled.length,
        totalLikes,
        totalComments
      };
    })
  }),
  ai: router({
    generateCaption: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      theme: z3.string(),
      extraContext: z3.string().optional()
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const toneInstruction = TRIARC_TONE2;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Voc\xEA \xE9 um especialista em marketing de conte\xFAdo para Instagram. ${APP_CONTEXT2}

${toneInstruction}

${CAPTION_PT_RULES}

A legenda deve incluir:
- Texto envolvente e relevante ao tema/projeto/servi\xE7o
- Hashtags estrat\xE9gicas (8-15 hashtags do nicho tech, inova\xE7\xE3o, neg\xF3cios)
- CTA claro para triarcsolutions.com.br
- Emojis moderados e profissionais

Responda APENAS com a legenda pronta, sem explica\xE7\xF5es adicionais.`
          },
          {
            role: "user",
            content: `Crie uma legenda para @triarcsolutions no Instagram.
Tema/Projeto/Servi\xE7o: ${input.theme}
${input.extraContext ? `Contexto adicional: ${input.extraContext}` : ""}
Destaque o impacto, tecnologias usadas e valor para o cliente.`
          }
        ]
      });
      const caption = response.choices?.[0]?.message?.content ?? "Erro ao gerar legenda.";
      return { caption };
    }),
    generateArt: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      theme: z3.string(),
      description: z3.string().optional(),
      includelogo: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) {
        throw new TRPCError2({ code: "NOT_FOUND", message: "Conta n\xE3o encontrada" });
      }
      let prompt = buildTriarcImagePrompt(input.theme.trim());
      const extra = input.description?.trim().slice(0, 500);
      if (extra) {
        prompt += `
Visual context: ${extra}`;
      }
      try {
        const jobId = await createImageJob(ctx.user.id, prompt);
        dispatchImageJobProcessing(jobId);
        console.log(`[generateArt] Job ${jobId} enfileirado theme="${input.theme}"`);
        return { jobId, status: "pending" };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[generateArt] FALHA ao enfileirar:", msg);
        throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),
    generateArtStatus: protectedProcedure.input(z3.object({
      jobId: z3.number()
    })).query(async ({ ctx, input }) => {
      await kickImageJob(input.jobId);
      const job = await getImageJob(input.jobId, ctx.user.id);
      if (!job) {
        throw new TRPCError2({ code: "NOT_FOUND", message: "Job de imagem n\xE3o encontrado" });
      }
      return {
        jobId: job.id,
        status: job.status,
        url: job.url ?? void 0,
        error: job.error ?? void 0
      };
    })
  }),
  actionPlan: router({
    generate: protectedProcedure.input(z3.object({
      period: z3.enum(["week", "month"]).default("week")
    })).mutation(async () => {
      const published = await getPostsByStatus("published");
      const publishedPosts = published;
      const totalLikes = publishedPosts.reduce((s, p) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s, p) => s + (p.comments ?? 0), 0);
      const avgEngagement = publishedPosts.length > 0 ? ((totalLikes + totalComments) / publishedPosts.length).toFixed(1) : "0";
      const topPosts = publishedPosts.sort((a, b) => (b.likes ?? 0) + (b.comments ?? 0) - ((a.likes ?? 0) + (a.comments ?? 0))).slice(0, 3).map((p) => ({ theme: p.theme || "Sem tema", likes: p.likes ?? 0, comments: p.comments ?? 0 }));
      const prompt = "Crie um plano de acao de marketing digital para a Triarc Solutions (empresa de tecnologia de Macae/RJ) baseado nos dados abaixo.\n\nDados de performance:\n- Posts publicados: " + publishedPosts.length + "\n- Total de curtidas: " + totalLikes + "\n- Total de comentarios: " + totalComments + "\n- Engajamento medio por post: " + avgEngagement + "\n- Top posts: " + JSON.stringify(topPosts) + '\n\nRetorne JSON com exatamente esta estrutura:\n{\n  "diagnosis": "diagnostico da performance atual em 3-4 frases",\n  "score": 75,\n  "actions": [{ "priority": "alta", "title": "titulo", "description": "descricao", "metric": "metrica", "deadline": "prazo" }],\n  "contentCalendar": [{ "day": "Segunda", "type": "Educativo", "theme": "tema", "platform": "Instagram" }],\n  "kpis": [{ "name": "KPI", "current": "atual", "target": "meta", "period": "periodo" }],\n  "quickWins": ["acao 1", "acao 2", "acao 3"]\n}';
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "Voce e um estrategista de marketing digital especializado em empresas de tecnologia B2B no Brasil. Responda SEMPRE em JSON valido sem markdown." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                score: { type: "number" },
                actions: { type: "array", items: { type: "object", properties: { priority: { type: "string" }, title: { type: "string" }, description: { type: "string" }, metric: { type: "string" }, deadline: { type: "string" } }, required: ["priority", "title", "description", "metric", "deadline"], additionalProperties: false } },
                contentCalendar: { type: "array", items: { type: "object", properties: { day: { type: "string" }, type: { type: "string" }, theme: { type: "string" }, platform: { type: "string" } }, required: ["day", "type", "theme", "platform"], additionalProperties: false } },
                kpis: { type: "array", items: { type: "object", properties: { name: { type: "string" }, current: { type: "string" }, target: { type: "string" }, period: { type: "string" } }, required: ["name", "current", "target", "period"], additionalProperties: false } },
                quickWins: { type: "array", items: { type: "string" } }
              },
              required: ["diagnosis", "score", "actions", "contentCalendar", "kpis", "quickWins"],
              additionalProperties: false
            }
          }
        }
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error("LLM nao retornou resposta");
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    })
  }),
  marketIntel: router({
    analyze: protectedProcedure.input(z3.object({
      niche: z3.string().min(1),
      competitor: z3.string().optional()
    })).mutation(async ({ input }) => {
      const competitorContext = input.competitor ? `Analise tamb\xE9m o concorrente: ${input.competitor}. Compare estrat\xE9gias de conte\xFAdo.` : "";
      const res = await invokeLLM({
        messages: [
          { role: "system", content: `Voc\xEA \xE9 um especialista em marketing digital e social media para empresas de tecnologia B2B no Brasil. Responda sempre em JSON v\xE1lido.` },
          { role: "user", content: `Fa\xE7a uma an\xE1lise completa de mercado para a Triarc Solutions (empresa de tecnologia e inova\xE7\xE3o de Maca\xE9/RJ, especializada em software, IA, automa\xE7\xE3o e consultoria) no nicho: "${input.niche}". ${competitorContext}

Retorne JSON com exatamente esta estrutura:
{
  "summary": "diagn\xF3stico do nicho em 3-4 frases",
  "strengths": ["diferencial 1", "diferencial 2", "diferencial 3", "diferencial 4"],
  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4"],
  "contentPillars": ["pilar 1: descri\xE7\xE3o", "pilar 2: descri\xE7\xE3o", "pilar 3: descri\xE7\xE3o", "pilar 4: descri\xE7\xE3o"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "postingStrategy": "estrat\xE9gia detalhada de frequ\xEAncia, hor\xE1rios e tipos de conte\xFAdo por dia da semana"
}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "market_intel",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                contentPillars: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } },
                postingStrategy: { type: "string" }
              },
              required: ["summary", "strengths", "opportunities", "contentPillars", "hashtags", "postingStrategy"],
              additionalProperties: false
            }
          }
        }
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error("LLM n\xE3o retornou resposta");
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/scheduledRoutes.ts
init_db();
var MAX_RETRIES2 = 3;
async function getUser(req) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}
async function resolveMediaUrl2(mediaUrl) {
  if (mediaUrl.startsWith("/manus-storage/")) {
    return storageGetSignedUrl(mediaUrl.replace("/manus-storage/", ""));
  }
  return mediaUrl;
}
async function publishToSocialPlatforms(postId, caption, imageUrl) {
  const post = await getPostById(postId);
  const allAccounts = await getAllAccounts();
  if (!post?.linkedinPublished) {
    const linkedinAccounts = allAccounts.filter(
      (a) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn
    );
    for (const liAccount of linkedinAccounts) {
      try {
        const result = await publishToLinkedIn({
          accessToken: liAccount.accessToken,
          linkedinUrn: liAccount.linkedinUrn,
          caption,
          imageUrl
        });
        await updatePost(postId, { linkedinPublished: 1 });
        console.log(`[LinkedIn] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "\u2705 Post publicado no LinkedIn",
          content: `Post #${postId} publicado!
Link: ${result.permalink}`
        });
      } catch (err) {
        console.error(`[LinkedIn] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[LinkedIn] Post ${postId} j\xE1 publicado \u2014 ignorando.`);
  }
  if (!post?.facebookPublished) {
    const facebookAccounts = allAccounts.filter(
      (a) => a.platform === "facebook" && a.accessToken && (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
    );
    for (const fbAccount of facebookAccounts) {
      const pageId = fbAccount.linkedinUrn.startsWith("fb:page:") ? fbAccount.linkedinUrn.replace("fb:page:", "") : "me";
      try {
        const result = await publishToFacebook({
          pageToken: fbAccount.accessToken,
          pageId,
          caption,
          imageUrl
        });
        await updatePost(postId, { facebookPublished: 1 });
        console.log(`[Facebook] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "\u2705 Post publicado no Facebook",
          content: `Post #${postId} publicado!
Link: ${result.permalink}`
        });
      } catch (err) {
        console.error(`[Facebook] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[Facebook] Post ${postId} j\xE1 publicado \u2014 ignorando.`);
  }
}
function registerScheduledRoutes(app2) {
  app2.get("/api/scheduled/pending-posts", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const allAccounts = await getAllAccounts();
      const instagramAccountIds = new Set(
        allAccounts.filter((a) => a.platform === "instagram" || !a.platform).map((a) => a.id)
      );
      const approved = await getPostsByStatus("approved");
      const now = /* @__PURE__ */ new Date();
      const pendingPosts = approved.filter((p) => {
        if (!instagramAccountIds.has(p.accountId)) return false;
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES2) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });
      console.log(`[ScheduledRoutes] pending-posts: ${approved.length} aprovados, ${pendingPosts.length} prontos para Instagram`);
      if (pendingPosts.length === 0) {
        return res.json({ posts: [] });
      }
      await Promise.all(pendingPosts.map((p) => updatePost(p.id, { mcpPending: 1 })));
      const postsWithMedia = await Promise.all(
        pendingPosts.map(async (post) => {
          const media = await getPostMedia(post.id);
          const mediaWithUrls = await Promise.all(
            media.map(async (m) => ({
              ...m,
              publicUrl: await resolveMediaUrl2(m.mediaUrl)
            }))
          );
          return { ...post, media: mediaWithUrls };
        })
      );
      Promise.all(
        postsWithMedia.map(async (post) => {
          const imageUrl = post.media?.[0]?.publicUrl;
          try {
            await publishToSocialPlatforms(post.id, post.caption || "", imageUrl);
          } catch (e) {
            console.error(`[ScheduledRoutes] Erro ao publicar post ${post.id} em LinkedIn/Facebook:`, e.message);
          }
        })
      ).catch((e) => console.error("[ScheduledRoutes] Erro geral LinkedIn/Facebook:", e.message));
      console.log(`[ScheduledRoutes] Retornando ${postsWithMedia.length} post(s) para o AGENT publicar no Instagram`);
      return res.json({ posts: postsWithMedia });
    } catch (err) {
      console.error("[ScheduledRoutes] Erro ao buscar posts pendentes:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/scheduled/publish-result", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { postId, instagramPostId, permalink, success, error } = req.body;
      if (!postId) return res.status(400).json({ error: "postId is required" });
      const postIdNum = Number(postId);
      const previousLogs = await getPublicationLogsByPost(postIdNum);
      const attempt = previousLogs.length + 1;
      console.log(`[ScheduledRoutes] publish-result: postId=${postIdNum} success=${success} instagramPostId=${instagramPostId}`);
      if (success && instagramPostId) {
        await updatePost(postIdNum, {
          status: "published",
          publishedAt: /* @__PURE__ */ new Date(),
          instagramPostId: String(instagramPostId),
          instagramPermalink: permalink ? String(permalink) : void 0,
          mcpPending: 0,
          retryCount: 0
        });
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "success",
          instagramPostId: String(instagramPostId),
          permalink: permalink ? String(permalink) : void 0
        });
        await notifyOwner({
          title: "\u2705 Post publicado no Instagram",
          content: `Post #${postIdNum} publicado!
Instagram ID: ${instagramPostId}
Link: ${permalink || "N/A"}`
        });
        console.log(`[ScheduledRoutes] Post ${postIdNum} publicado no Instagram: ${instagramPostId}`);
        return res.json({ ok: true });
      } else {
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "failed",
          error: error ? String(error) : "Erro desconhecido"
        });
        const newRetryCount = attempt;
        if (newRetryCount < MAX_RETRIES2) {
          const nextRetryAt = new Date(Date.now() + 5 * 60 * 1e3);
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, nextRetryAt });
          console.warn(`[ScheduledRoutes] Post ${postIdNum} falhou (${newRetryCount}/${MAX_RETRIES2}), pr\xF3xima tentativa em ${nextRetryAt.toISOString()}`);
          return res.json({ ok: false, error, willRetry: true, attempt: newRetryCount, nextRetryAt });
        } else {
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, status: "rejected" });
          await notifyOwner({
            title: "\u274C Falha ao publicar post no Instagram",
            content: `Post #${postIdNum} falhou ap\xF3s ${MAX_RETRIES2} tentativas.
Erro: ${error || "Desconhecido"}`
          });
          console.error(`[ScheduledRoutes] Post ${postIdNum} rejeitado ap\xF3s ${MAX_RETRIES2} tentativas`);
          return res.json({ ok: false, error, willRetry: false, maxRetriesReached: true });
        }
      }
    } catch (err) {
      console.error("[ScheduledRoutes] Erro:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/scheduled/insights/:instagramPostId", async (req, res) => {
    const internalKey = req.headers["x-internal-key"];
    if (internalKey !== (process.env.JWT_SECRET || "internal")) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { posts: posts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq6 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) return res.status(503).json({ error: "DB unavailable" });
      const [post] = await db.select().from(posts2).where(eq6(posts2.instagramPostId, req.params.instagramPostId)).limit(1);
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.json({ likes: post.likes ?? 0, comments: post.comments ?? 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/scheduled/publication-logs", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { getPublicationLogs: getPublicationLogs2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const logs = await getPublicationLogs2(100);
      return res.json({ logs });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}

// server/imageRoutes.ts
init_db();
var TOTAL_GENERATION_MS = 1e5;
function buildPrompt(theme, description) {
  let prompt = buildTriarcImagePrompt(theme.trim());
  const extra = description?.trim().slice(0, 500);
  if (extra) prompt += `
Visual context: ${extra}`;
  return prompt;
}
async function generateWithBudget(prompt) {
  const budget = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error("Gera\xE7\xE3o excedeu 100s. Tente novamente em 1 minuto.")),
      TOTAL_GENERATION_MS
    );
  });
  const { url } = await Promise.race([generateImage({ prompt }), budget]);
  if (!url) throw new Error("Gemini n\xE3o retornou URL da imagem");
  return url;
}
function registerImageRoutes(app2) {
  app2.post("/api/generate-image", async (req, res) => {
    const started = Date.now();
    try {
      const user = await sdk.authenticateRequest(req);
      const { accountId, theme, description } = req.body ?? {};
      if (!accountId || !theme?.trim()) {
        return res.status(400).json({ error: "Conta e tema s\xE3o obrigat\xF3rios" });
      }
      const account = await getAccountById(Number(accountId));
      if (!account) {
        return res.status(404).json({ error: "Conta n\xE3o encontrada" });
      }
      const prompt = buildPrompt(String(theme), description ? String(description) : void 0);
      console.log(`[generate-image] user=${user.id} theme="${theme}"`);
      const url = await generateWithBudget(prompt);
      console.log(`[generate-image] OK em ${Date.now() - started}ms`);
      return res.json({ url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generate-image] FALHA em ${Date.now() - started}ms:`, msg);
      return res.status(500).json({ error: msg });
    }
  });
}

// server/vercel.ts
init_seed_triarc();
init_db();
import { sql as sql3 } from "drizzle-orm";
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let dbError = "";
  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql3`SELECT 1 AS ok`);
      dbOk = true;
    } else {
      dbError = getLastDbError() || "getDb() returned null";
    }
  } catch (e) {
    dbError = e.message;
  }
  const dbUrlCandidates = {
    DATABASE_URL: process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.length + " chars)" : "not set",
    DB_URL: process.env.DB_URL ? "set (" + process.env.DB_URL.length + " chars)" : "not set",
    POSTGRES_URL: process.env.POSTGRES_URL ? "set (" + process.env.POSTGRES_URL.length + " chars)" : "not set",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "set" : "not set",
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? "set" : "not set"
  };
  const activeUrl = process.env.DATABASE_URL || process.env.DB_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DB_URL || "";
  const masked = activeUrl ? activeUrl.replace(/:[^:@]+@/, ":***@") : "(none found)";
  const relevantKeys = Object.keys(process.env).filter((k) => /^(DATABASE|POSTGRES|SUPABASE|DB_)/i.test(k)).map((k) => k);
  res.json({
    ok: dbOk,
    db: dbOk ? "connected" : `error: ${dbError}`,
    env: {
      dbUrlCandidates,
      activeUrl: masked,
      allDbRelatedKeys: relevantKeys,
      totalEnvKeys: Object.keys(process.env).length,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "(n\xE3o definido)",
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      NODE_ENV: process.env.NODE_ENV || "(not set)",
      SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "not set",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "not set",
      GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image (default)",
      SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social (default)"
    },
    imageStack: await probeImageStack(),
    ts: (/* @__PURE__ */ new Date()).toISOString()
  });
});
registerStorageProxy(app);
registerOAuthRoutes(app);
registerScheduledRoutes(app);
registerLinkedInRoutes(app);
registerFacebookRoutes(app);
registerImageRoutes(app);
app.get("/api/cron/tick", async (req, res) => {
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await runAutonomousAgent();
    return res.json({ ok: true, ts: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/internal/process-image-job/:id", async (req, res) => {
  if (!verifyInternalAuth(req.headers.authorization)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const jobId = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  try {
    await processImageJob(jobId);
    return res.json({ ok: true, jobId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`[tRPC] ${path ?? "?"}:`, error.message);
  }
}));
sdk.ensureAdminUser().catch((e) => console.error("[Auth] Erro ao criar admin:", e));
seedTriarcContent().catch((e) => console.error("[Seed] Erro triac_content:", e));
seedContentThemes().catch((e) => console.error("[Seed] Erro content_themes:", e));
ensureStorageBucket().catch((e) => console.error("[Storage] Bucket:", e.message));
ensureImageJobsTable().catch((e) => console.error("[ImageJob] Tabela:", e.message));
var config = { maxDuration: 120 };
var vercel_default = app;
export {
  config,
  vercel_default as default
};
