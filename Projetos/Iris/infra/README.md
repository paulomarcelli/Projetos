# `infra/` · Docker, deploy e infraestrutura

Hoje a infraestrutura é só o `docker-compose.yml` na raiz, que sobe o PostgreSQL 16 com pgvector para desenvolvimento.

Aqui vão ficar os arquivos de deploy (imagens Docker da API, configuração do servidor e da publicação) quando a Iris for para produção. Antes disso, veja os limites de segurança em `docs/BACKEND.md`: a API ainda não tem autenticação.
