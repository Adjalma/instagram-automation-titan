# Triarc Social Manager - TODO

## Database & Schema
- [x] Tabela instagram_accounts (id, userId, accountHandle, accountName, accountType, tone, createdAt)
- [x] Tabela posts (id, userId, accountId, caption, status, theme, scheduledAt, publishedAt, instagramPostId, likes, comments, createdAt, updatedAt)
- [x] Tabela post_media (id, postId, mediaUrl, mediaType, sortOrder)
- [x] Tabela assets (id, userId, name, url, fileKey, mimeType, createdAt)
- [x] Tabela content_themes (id, name, description, accountType)
- [x] Aplicar migrações SQL

## Backend
- [x] Router: accounts (listar contas, stats por conta)
- [x] Router: posts (CRUD, listar por conta, listar por status, aprovar, rejeitar, agendar)
- [x] Router: assets (upload, listar, deletar)
- [x] Router: ai (gerar legenda, gerar arte)
- [x] Router: themes (listar temas de conteúdo)
- [x] Seed dos 5 temas fixos e 2 contas Instagram
- [x] Lógica de geração de legendas com IA (tom diferenciado por conta)
- [x] Lógica de geração de artes com IA (logo Titan)
- [x] Notificação ao dono quando post pronto para aprovação

## Frontend - Estilo Visual
- [x] Tema: fundo branco, grid fino, tipografia sans-serif pesada + mono labels, ciano pastel + rosa suave
- [x] Layout dashboard com sidebar

## Frontend - Páginas
- [x] Dashboard: visão geral das duas contas (agendados, publicados, pendentes)
- [x] Criar Post: editor de legenda, seleção de conta, upload/geração de imagens IA
- [x] Aprovação: lista de posts pendentes com botões aprovar/rejeitar
- [x] Calendário: visualização mensal de posts agendados por conta
- [x] Cronograma: temas fixos com sugestões de conteúdo
- [x] Histórico: posts publicados com métricas (curtidas, comentários)
- [x] Assets: upload e gerenciamento de imagens do Titan App
- [x] Configurações: contas Instagram conectadas

## Testes
- [x] Testes unitários para routers principais

## Rebranding - Triarc Social Manager
- [x] Renomear de "Titan Social Manager" para "Triarc Social Manager" em todo o sistema
- [x] Incorporar logo oficial do Triarc Social Manager na sidebar e login
- [x] Atualizar título do app (VITE_APP_TITLE)
- [x] Atualizar logo do app (VITE_APP_LOGO)
- [x] Atualizar favicon com o logo oficial

## Correções
- [x] Corrigir título na aba do navegador de "Titan" para "Triarc Social Manager"

## Automação Completa de Posts
- [x] Botão "Gerar Semana" que cria automaticamente posts para 7 dias (legenda IA + arte IA) para ambas as contas
- [x] Fila de posts: sistema de enfileiramento visual ordenado por data
- [x] Auto-agendamento: distribui posts automaticamente nos melhores horários (8h, 12h30, 18h, 20h)
- [x] Geração em lote: gerar múltiplos posts de uma vez baseado nos 5 temas do cronograma
- [x] Página de Automação dedicada com controles de geração automática + botão Aprovar Todos + rota /automation no menu

## Bugs
- [x] Posts aprovados não estavam sendo publicados no Instagram - CORRIGIDO: publishToInstagram() integrado no approve/approveAll, processScheduled para posts agendados, syncInsights para métricas reais

## Refinamentos de Publicação
- [x] Implementar estado "aguardando confirmação MCP" na UI (post enviado ao Instagram, aguardando card de confirmação)
- [x] Adicionar agendador periódico (cron/worker) para processScheduledPosts() no servidor
- [x] Adicionar testes para fluxo approve/approveAll/processScheduled

## Bugs v1.2
- [x] Corrigir erro de query SQL no agendador: conexão única expirava após horas de uptime — CORRIGIDO: substituído por pool de conexões com keepAlive (mysql2 createPool)

## Bug crítico — Publicação não funciona
- [x] Diagnosticar por que posts aprovados não são publicados: manus-mcp-cli não pode ser chamado pelo servidor web
- [x] Corrigir fluxo: agente Manus agendado a cada 10min busca posts aprovados via /api/scheduled/pending-posts e publica via MCP
- [x] Garantir feedback visual: banners atualizados no Approval.tsx explicando o novo fluxo automático

## Bug v1.3 — Posts não chegam ao Instagram
- [x] Diagnosticar: scheduler chamava manus-mcp-cli diretamente (falha) — CORRIGIDO: scheduler agora apenas promove posts agendados vencidos para 'approved'
- [x] Testar publicação real: post 150006 publicado com sucesso em https://www.instagram.com/p/DXouDCjieVp/
- [x] Tarefa agendada Manus atualizada com instruções corrigidas (aguarda 30s entre posts, usa publicUrl da mídia)
- [x] Publicar projeto (deploy) para ativar a tarefa agendada (aguardando clique do usuário no botão Publish)

## Features v1.5 — Sistema Completo
- [x] Tabela publication_logs no banco (postId, status, instagramPostId, permalink, error, attempt, createdAt)
- [x] Endpoint tRPC automation.publishNow para publicar um post imediatamente via agente
- [x] Retry automático no scheduler (até 3 tentativas, backoff 5min entre tentativas)
- [x] Notificação ao dono (notifyOwner) quando post é publicado com sucesso
- [x] Página de Logs de Publicação na UI (rota /logs, listagem com status, permalink, erros)
- [x] Botão "Publicar Agora" na tela de Aprovação (chama publishNow)

## Features v1.6 — Conteúdo Triarc Real
- [x] Tabela triac_content (tipo: servico|projeto, nome, descricao, categoria, tecnologias, destaques)
- [x] Seed com 8 serviços e 36 projetos reais da Triarc (idempotente no boot)
- [x] Prompts de IA atualizados: tom corporativo Triarc + CTA para triarcsolutions.com.br
- [x] UI: seleção de projeto/serviço ao criar post (dropdown com 8 serviços + 36 projetos)
- [x] Calendário editorial: "Gerar Semana" usa temas dos projetos/serviços automaticamente

## Features v1.13 — Analytics + Publicação Corrigida
- [x] Post de hoje (ID 360011) publicado no Instagram @triarcsolutions
- [x] Página Analytics (/analytics) com KPIs: total posts, publicados, pendentes, aprovados
- [x] Gráfico de engajamento (curtidas/comentários) por post publicado
- [x] Lista de posts publicados com métricas e link direto para Instagram
- [x] tRPC analytics.getSummary, analytics.getPostsWithMetrics, analytics.getAccountStats
- [x] Item "Analytics" adicionado ao menu lateral (sidebar)
- [x] 17 testes passando, zero erros TypeScript

## Features v1.16 — Mobile + PWA
- [x] Bottom navigation bar no mobile (Início, Criar, Aprovar, Analytics, Mais)
- [x] Top bar mobile com logo e nome da página ativa
- [x] Sidebar fecha automaticamente ao navegar no mobile
- [x] Padding inferior (pb-16) para conteúdo não ficar atrás da bottom-bar
- [x] viewport-fit=cover para suporte a notch/Dynamic Island
- [x] Meta tags Apple PWA (apple-mobile-web-app-capable, status-bar-style, touch-icon)
- [x] manifest.json com nome, ícone, shortcuts (Criar Post, Aprovação)
- [x] Service Worker básico registrado para habilitar instalação PWA
- [x] lang="pt-BR" no HTML

## Features v1.19 — Carrossel + Publicação Automática Corrigida

- [x] Suporte a carrossel no Criar Post: até 10 imagens, badge "Carrossel", numeração nos slides, botão "Gerar slide" inline
- [x] Campo para adicionar URL de imagem manualmente no Criar Post
- [x] Preview mostra indicador 1/N quando há múltiplos slides
- [x] Tarefa agendada atualizada: envia todos os itens de post.media como array no MCP (suporte a carrossel)
- [x] Tarefa agendada reativada (estava pausada) e com parâmetros MCP corretos

## Features v1.20 — Pesquisa Diária

- [x] Tabela research_topics no banco (id, name, query, active, accountId)
- [x] Tabela research_posts no banco (id, topicId, headlines, postId, generatedAt)
- [x] Endpoint /api/cron/daily-research para buscar notícias, gerar legenda+imagem e criar post
- [x] Cron job diário às 8h (America/Sao_Paulo) no servidor
- [x] Aba "Pesquisa Diária" com configuração de tópicos e histórico de posts gerados
- [x] Rota /research no App.tsx
- [x] Item "Pesquisa" no menu do DashboardLayout

## Features v1.23 — Multi-Rede + Logo + Inteligência de Mercado

- [x] Upload do logo Triarc para storage e URL pública
- [x] Corrigir prompt de geração de imagem para incluir logo (via referência de imagem no generateImage)
- [x] Suporte a múltiplas redes na tabela instagram_accounts (campo platform: instagram|linkedin|facebook|tiktok|youtube)
- [x] UI para adicionar contas de outras redes (LinkedIn, Facebook, TikTok, YouTube)
- [x] Módulo Inteligência de Mercado: monitoramento de nicho e análise de concorrentes
- [x] Página Estratégia: recomendações de marketing geradas por LLM com base nos dados coletados

## Features v1.27 — LinkedIn Integration

- [x] Salvar LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET via secrets
- [x] OAuth flow LinkedIn: /api/linkedin/auth → callback → salvar access_token na conta
- [x] Publicação no LinkedIn via API (UGC Posts endpoint)
- [x] Botão "Conectar LinkedIn" na tela de Contas
- [x] Publicação automática no LinkedIn junto com Instagram quando post for aprovado

## Correções Críticas 2026-05-23

- [x] AGENT cron de publicação reativado (estava pausado)
- [x] POST_COLS corrigido: adicionar linkedinPublished e facebookPublished
- [x] pending-posts marca mcpPending=1 ao retornar posts (evita duplicatas)
- [x] 5 posts aprovados publicados manualmente no Instagram via MCP
- [x] Analytics: botão Sincronizar insights do Instagram
- [x] Analytics: contador de posts por plataforma (Instagram/LinkedIn/Facebook)
- [x] Analytics: ícones de plataforma em cada post publicado
- [x] Analytics: linkedinPublished e facebookPublished no getPostsWithMetrics
- [x] Research: toggle autoPublish por tópico (publica sem aprovação manual)
- [x] Research: badge Auto com ícone Zap quando autoPublish ativo
- [x] ActionPlan: página criada com plano de ação por IA
- [x] ActionPlan: rota /action-plan registrada no App.tsx
- [x] DashboardLayout: item "Plano de Ação" adicionado ao menu
- [x] schema: coluna autoPublish adicionada à tabela research_topics

## Heartbeat HTTP Persistente 2026-05-23

- [x] Endpoint POST /api/scheduled/heartbeat-publish criado (promove scheduled→approved, publica FB/LI inline, enfileira IG para AGENT cron)
- [x] Heartbeat criado via manus-heartbeat CLI (a cada 10 min) — task_uid: ABqSvvSD8bJirguZXkoJJC
- [x] task_uid salvo em references/heartbeat-config.json
- [x] Corrigir posts duplicados no generateWeek (verificação por tema+conta+dia)
- [x] Corrigir erros TypeScript do GitHub (main.tsx URL|Request, storage.ts regex /s flag)
- [x] AGENT cron reativado (estava pausado novamente)

## Correções Críticas 2026-06-21

- [x] Corrigir publicação multi-plataforma ao aprovar post (Instagram, Facebook, LinkedIn simultâneo)
- [x] Limpar posts aprovados residuais no banco (feito na sessão anterior)
- [x] Corrigir erro TS: Automation.tsx property 'errors' não existe (erro apenas no watcher, tsc --noEmit OK)
- [x] Corrigir erro TS: Themes.tsx property 'socialOnly' não existe (erro apenas no watcher, tsc --noEmit OK)
- [x] Corrigir erro TS: vercel.ts runSchedulerTick e probeImageStack não exportados (erro apenas no watcher, tsc --noEmit OK)
- [x] Auditar e corrigir todas as páginas do sistema

## Redesign Futurista 2026-06-21

- [x] Tema dark tech: fundo oklch(0.09), neon cyan/purple/pink, glassmorphism, grid cyberpunk no body
- [x] Fontes: Orbitron (títulos), JetBrains Mono (labels/mono), Inter (texto)
- [x] DashboardLayout: sidebar dark com neon cyan, active border-left neon, footer com avatar
- [x] Home/Dashboard: stat cards neon, redes conectadas com ícone neon, alertas neon
- [x] Login: card glassmorphism com glow, inputs dark, botão gradiente neon
- [x] Approval: cards dark com borda neon por plataforma, botões neon
- [x] Analytics: gráficos com cores neon, stat cards com neon por categoria
- [x] HistoryView: cards dark com borda pink neon, métricas coloridas
- [x] Build limpo: zero erros TypeScript, pnpm build OK
- [x] Diagnosticado: token Facebook inválido — usuário deve reconectar via OAuth com permissão pages_manage_posts
