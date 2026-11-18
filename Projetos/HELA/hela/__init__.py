"""HELA: memória cognitiva local para o Claude Code.

Pacotes:
- storage:  SQLite (WAL), migrações versionadas e repositórios;
- security: redação de segredos, detecção de prompt injection e invólucro "dados, não instruções";
- memory:   Memory Engine (CRUD, deduplicação, embedder, busca híbrida, grafo, consolidação, export/import);
- core:     configuração e a fachada Engine usada pela CLI, MCP, hooks e API.
"""

__version__ = "0.2.0"
