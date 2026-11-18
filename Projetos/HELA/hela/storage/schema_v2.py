"""Esquema 2 da HELA (Fase 3): colunas que o aprendizado e o roteador precisam.

- outcomes.compute_cost: custo computacional de uma tarefa, em unidades livres (a Fase 4
  grava o número de chamadas de ferramenta). Entra no Strategy Ranker como custo.
- strategy_metrics.sum_compute: soma desse custo por estratégia e categoria.
- retrievals.tokens_raw / tokens_optimized: tokens estimados (caracteres/4) antes e depois
  do Context Optimizer. tokens_estimated (esquema 1) continua igual a tokens_optimized.
- Índices para as consultas do aprendizado.

Só ALTER TABLE ADD COLUMN e CREATE INDEX: nenhum dado existente muda.
"""

SCHEMA_V2 = r"""
ALTER TABLE outcomes ADD COLUMN compute_cost REAL;
ALTER TABLE strategy_metrics ADD COLUMN sum_compute REAL NOT NULL DEFAULT 0;
ALTER TABLE retrievals ADD COLUMN tokens_raw INTEGER;
ALTER TABLE retrievals ADD COLUMN tokens_optimized INTEGER;
CREATE INDEX idx_tasks_label ON tasks(label_source);
CREATE INDEX idx_outcomes_strategy ON outcomes(strategy_id);
CREATE INDEX idx_retrievals_task ON retrievals(task_id);
CREATE INDEX idx_procedures_memory ON procedures(memory_id);
"""
