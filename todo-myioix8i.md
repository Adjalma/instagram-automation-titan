# Project TODO

- [x] Corrigir fluxo de approve inline (routers.ts) - adicionar refresh do token Facebook com fallback e tratamento de null
- [x] Corrigir scheduledRoutes.ts - adicionar refresh do token Facebook antes de publicar em publishToSocialPlatforms e heartbeat-publish
- [x] Corrigir approveAll e publishNow para disparar publicação real no Facebook/LinkedIn
- [x] Corrigir erro de sintaxe na string quebrada em routers.ts linha 285-286
- [x] Adicionar logs verbosos para debugging de publicação Facebook/LinkedIn
- [x] Escrever testes vitest para as correções
