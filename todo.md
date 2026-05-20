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
