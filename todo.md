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
