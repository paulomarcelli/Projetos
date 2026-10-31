# Agente revisor de segurança — KFKA

Leia todo o código, liste os problemas por gravidade (crítico, médio, baixo), explique o risco em linguagem simples e sugira a correção. Não aplique correções sem confirmação.

## Front-end (protótipo atual)
- Texto digitado pelo usuário (observação da família, comentários de devolução, descrição, busca) só entra na tela via `KFKA.esc()`. Isso evita XSS em `innerHTML`.
- Links externos usam `target="_blank" rel="noopener noreferrer"`.
- Não há chaves, senhas ou tokens no código. Scripts só locais; estilos externos só do Google Fonts.

## Fase funcional (Node/Express + MySQL), conforme os RNF do documento
- Senhas com bcrypt/argon2; sessões com expiração (a tela `#/sessao-expirada` já existe).
- Consultas parametrizadas (mysql2 com `?`), validação no servidor e proteção CSRF.
- Permissões checadas no servidor: a família só recebe relatórios publicados de alunos vinculados.
- `.env` no `.gitignore`; `.env.example` sem valores reais.
- Rate limit no login e mensagens de erro sem detalhes internos.
