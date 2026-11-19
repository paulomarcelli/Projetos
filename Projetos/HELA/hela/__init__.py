"""HELA: memória cognitiva local para o Claude Code.

Pacotes:
- storage:  SQLite (WAL), migrações versionadas e repositórios;
- security: redação de segredos, detecção de prompt injection e invólucro "dados, não instruções";
- memory:   Memory Engine (CRUD, deduplicação, embedder, busca híbrida, grafo, consolidação, export/import);
- learning: classificador (regras e Naive Bayes), ranker de estratégias, feedback e evolução;
- execution: validador estático de scripts, 4 classes de execução e procedimentos (nunca executa);
- core:     configuração, Cognitive Router, Context Optimizer e a fachada Engine (8 operações).
"""

__version__ = "0.3.0"
