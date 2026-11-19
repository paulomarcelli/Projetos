"""Esquema 3 da HELA (Fase 4): o que a integração com o Claude Code precisa.

- meta.vectors_version: contador que invalida o cache de vetores do hook (hela/memory/vector_cache.py).
  Sobe por gatilho quando um vetor muda (UPDATE OF embedding, embedding_model) ou some (DELETE).
  Inserção não sobe o contador: o cache acompanha as linhas novas pelo maior rid.
- procedures.approved_language: a linguagem do script no momento da aprovação humana (revisão F3-M2).
  Mudar a linguagem depois invalida a aprovação, mesmo com o texto igual.
- transcript_cursors: até onde cada arquivo de transcript já foi somado (tokens do provedor), com os
  message.id mais recentes, para não contar duas vezes a mesma resposta (docs/referencia-claude-code.md, 4.4).

Só acrescenta: nenhum dado existente muda.
"""

SCHEMA_V3 = r"""
INSERT OR IGNORE INTO meta (key, value) VALUES ('vectors_version', '0');
CREATE TRIGGER memories_vec_au AFTER UPDATE OF embedding, embedding_model ON memories BEGIN
    UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'vectors_version';
END;
CREATE TRIGGER memories_vec_ad AFTER DELETE ON memories BEGIN
    UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'vectors_version';
END;
ALTER TABLE procedures ADD COLUMN approved_language TEXT;
CREATE TABLE transcript_cursors (
    path       TEXT PRIMARY KEY,
    session_id TEXT,
    offset     INTEGER NOT NULL DEFAULT 0,
    recent_ids TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT
);
CREATE INDEX idx_observations_task ON observations(task_id);
CREATE INDEX idx_observations_tool ON observations(tool_name, created_at);
"""
