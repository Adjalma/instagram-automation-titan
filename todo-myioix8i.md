# Project TODO

- [ ] Corrigir fluxo de approve inline (routers.ts) - adicionar refresh do token Facebook com fallback e tratamento de null
- [ ] Corrigir scheduledRoutes.ts - adicionar refresh do token Facebook antes de publicar em publishToSocialPlatforms e heartbeat-publish
- [ ] Corrigir approveAll e publishNow para disparar publicação real no Facebook/LinkedIn
- [ ] Corrigir erro de sintaxe na string quebrada em routers.ts linha 285-286
- [ ] Adicionar logs verbosos para debugging de publicação Facebook/LinkedIn
- [ ] Escrever testes vitest para as correções
