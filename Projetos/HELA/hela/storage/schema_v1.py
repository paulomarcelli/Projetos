"""Esquema 1 da HELA (Parte C.4.2 do prompt mestre).

Todas as tabelas já nascem aqui, inclusive as que só as Fases 3 a 5 vão usar, para que
as próximas fases não precisem de migração que quebre dados.

Convenções:
- Datas: texto ISO 8601 em UTC com microssegundos (ver hela/core/clock.py).
- JSON: colunas *_json ou tags/metadata guardam texto JSON (o SQLite tem json_each/json_extract).
- Ids de memória: texto (uuid4 hex), estáveis entre bancos (export/import). A coluna
  `rid INTEGER PRIMARY KEY` é o rowid explícito, estável até em VACUUM, usado pelo FTS5.
"""

SCHEMA_V1 = r"""
-- Chave/valor interno. graph_version invalida o cache do grafo em todos os processos.
CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT INTO meta (key, value) VALUES ('graph_version', '0');

-- Sessões do Claude Code (preenchidas pelos hooks na Fase 4).
CREATE TABLE sessions (
    id              TEXT PRIMARY KEY,
    started_at      TEXT NOT NULL,
    ended_at        TEXT,
    cwd             TEXT,
    project         TEXT,
    source          TEXT,              -- startup | resume | clear | compact | fork
    end_reason      TEXT,
    transcript_path TEXT,
    metadata        TEXT NOT NULL DEFAULT '{}'
);

-- Tarefas: cada pedido do usuário que a HELA acompanha.
CREATE TABLE tasks (
    id                      TEXT PRIMARY KEY,
    session_id              TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    prompt                  TEXT NOT NULL,          -- já redigido
    prompt_hash             TEXT,
    project                 TEXT,
    category                TEXT,
    complexity              TEXT CHECK (complexity IS NULL OR complexity IN ('low','medium','high')),
    tools                   TEXT NOT NULL DEFAULT '[]',
    label_source            TEXT CHECK (label_source IS NULL OR label_source IN ('rules','explicit','feedback')),
    status                  TEXT NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','done','failed','abandoned')),
    assisted                INTEGER NOT NULL DEFAULT 1,  -- 0 = holdout (sem contexto da HELA), para medir economia
    transcript_offset_start INTEGER,
    transcript_offset_end   INTEGER,
    created_at              TEXT NOT NULL,
    completed_at            TEXT,
    metadata                TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_tasks_session ON tasks(session_id);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Memória unificada: os quatro tipos do prompt mestre numa tabela só.
CREATE TABLE memories (
    rid             INTEGER PRIMARY KEY,
    id              TEXT NOT NULL UNIQUE,
    kind            TEXT NOT NULL CHECK (kind IN ('episodic','semantic','procedural','executive')),
    title           TEXT,
    content         TEXT NOT NULL,
    summary         TEXT,
    project         TEXT,
    tags            TEXT NOT NULL DEFAULT '[]',
    source          TEXT NOT NULL DEFAULT 'manual',  -- manual | mcp | hook | import | consolidation | api
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','quarantined','expired','merged')),
    content_hash    TEXT NOT NULL UNIQUE,            -- sha256 do texto normalizado
    embedding       BLOB,                            -- float32, norma 1
    embedding_model TEXT,                            -- ex.: hashing-512-v1
    importance      REAL NOT NULL DEFAULT 0.5 CHECK (importance BETWEEN 0 AND 1),
    quality         REAL NOT NULL DEFAULT 0.5 CHECK (quality BETWEEN 0 AND 1),
    confidence      REAL NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
    access_count    INTEGER NOT NULL DEFAULT 0,
    last_accessed   TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    expires_at      TEXT,
    session_id      TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    merged_into     TEXT REFERENCES memories(id) ON DELETE SET NULL,
    redactions      INTEGER NOT NULL DEFAULT 0,      -- quantos trechos a redação trocou
    injection_score REAL NOT NULL DEFAULT 0,
    metadata        TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_memories_kind_status ON memories(kind, status);
CREATE INDEX idx_memories_project ON memories(project);
CREATE INDEX idx_memories_expires ON memories(status, expires_at);
CREATE INDEX idx_memories_last_accessed ON memories(last_accessed);

-- Busca textual (BM25). Conteúdo externo: o índice lê de memories via rid.
-- remove_diacritics 2: "renderização" casa com "renderizacao".
CREATE VIRTUAL TABLE memories_fts USING fts5(
    title, content, summary, tags,
    content = 'memories',
    content_rowid = 'rid',
    tokenize = 'unicode61 remove_diacritics 2'
);
CREATE TRIGGER memories_fts_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts (rowid, title, content, summary, tags)
    VALUES (new.rid, new.title, new.content, new.summary, new.tags);
END;
CREATE TRIGGER memories_fts_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts (memories_fts, rowid, title, content, summary, tags)
    VALUES ('delete', old.rid, old.title, old.content, old.summary, old.tags);
END;
CREATE TRIGGER memories_fts_au AFTER UPDATE OF title, content, summary, tags ON memories BEGIN
    INSERT INTO memories_fts (memories_fts, rowid, title, content, summary, tags)
    VALUES ('delete', old.rid, old.title, old.content, old.summary, old.tags);
    INSERT INTO memories_fts (rowid, title, content, summary, tags)
    VALUES (new.rid, new.title, new.content, new.summary, new.tags);
END;

-- Procedimentos reutilizáveis (Execution Intelligence, Fase 3). A HELA nunca executa sozinha:
-- approved_sha256 guarda o hash do script que um humano aprovou.
CREATE TABLE procedures (
    id              TEXT PRIMARY KEY,
    memory_id       TEXT UNIQUE REFERENCES memories(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    steps           TEXT NOT NULL DEFAULT '[]',
    script          TEXT,
    script_language TEXT,
    script_sha256   TEXT,
    exec_class      TEXT CHECK (exec_class IS NULL OR exec_class IN ('reasoning','script','reuse','human_approval')),
    approved        INTEGER NOT NULL DEFAULT 0,
    approved_sha256 TEXT,
    approved_at     TEXT,
    validation      TEXT NOT NULL DEFAULT '{}',
    success_count   INTEGER NOT NULL DEFAULT 0,
    failure_count   INTEGER NOT NULL DEFAULT 0,
    last_used       TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- Estratégias comparadas pelo Strategy Ranker (Fase 3).
CREATE TABLE strategies (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL UNIQUE,
    category     TEXT,
    description  TEXT,
    procedure_id TEXT REFERENCES procedures(id) ON DELETE SET NULL,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired')),
    created_at   TEXT NOT NULL
);

-- Métricas agregadas por estratégia e categoria de tarefa.
CREATE TABLE strategy_metrics (
    strategy_id     TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    category        TEXT NOT NULL DEFAULT '',
    n_obs           INTEGER NOT NULL DEFAULT 0,
    successes       INTEGER NOT NULL DEFAULT 0,
    failures        INTEGER NOT NULL DEFAULT 0,
    sum_quality     REAL NOT NULL DEFAULT 0,
    sum_duration_ms REAL NOT NULL DEFAULT 0,
    sum_tokens      REAL NOT NULL DEFAULT 0,
    sum_attempts    REAL NOT NULL DEFAULT 0,
    wilson_lower    REAL,
    score           REAL,
    weights_version INTEGER,
    updated_at      TEXT NOT NULL,
    PRIMARY KEY (strategy_id, category)
);

-- Resultado de cada tarefa (tokens do provedor ou estimados, nunca misturados).
CREATE TABLE outcomes (
    id                    INTEGER PRIMARY KEY,
    task_id               TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    strategy_id           TEXT REFERENCES strategies(id) ON DELETE SET NULL,
    success               INTEGER CHECK (success IS NULL OR success IN (0,1)),
    quality               REAL CHECK (quality IS NULL OR quality BETWEEN 0 AND 1),
    duration_ms           REAL,
    attempts              INTEGER,
    tokens_input          INTEGER,
    tokens_output         INTEGER,
    tokens_cache_read     INTEGER,
    tokens_cache_creation INTEGER,
    tokens_thinking       INTEGER,
    token_source          TEXT CHECK (token_source IS NULL OR token_source IN ('provider','estimated')),
    notes                 TEXT,
    created_at            TEXT NOT NULL
);
CREATE INDEX idx_outcomes_task ON outcomes(task_id);

-- Relações entre memórias (o grafo). Uma aresta por (origem, destino, tipo).
CREATE TABLE relationships (
    id         INTEGER PRIMARY KEY,
    source_id  TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    target_id  TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    weight     REAL NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
    evidence   TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_id, target_id, type),
    CHECK (source_id <> target_id)
);
CREATE INDEX idx_relationships_target ON relationships(target_id);
-- Qualquer mudança nas arestas (inclusive em cascata) sobe o contador do grafo.
CREATE TRIGGER relationships_ver_ai AFTER INSERT ON relationships BEGIN
    UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'graph_version';
END;
CREATE TRIGGER relationships_ver_au AFTER UPDATE ON relationships BEGIN
    UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'graph_version';
END;
CREATE TRIGGER relationships_ver_ad AFTER DELETE ON relationships BEGIN
    UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'graph_version';
END;

-- Cada recuperação feita pelo Router (Fase 3): o que foi pedido, o que voltou, quanto custou.
CREATE TABLE retrievals (
    id               INTEGER PRIMARY KEY,
    task_id          TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    session_id       TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    query            TEXT NOT NULL,       -- já redigida
    filters          TEXT NOT NULL DEFAULT '{}',
    results          TEXT NOT NULL DEFAULT '[]',  -- [{id, score}]
    n_results        INTEGER NOT NULL DEFAULT 0,
    insufficient     INTEGER NOT NULL DEFAULT 0,  -- 1 = "experiência insuficiente"
    latency_ms       REAL,
    tokens_estimated INTEGER,
    created_at       TEXT NOT NULL
);
CREATE INDEX idx_retrievals_created ON retrievals(created_at);

-- Feedback sobre memórias, recuperações e tarefas.
CREATE TABLE feedback (
    id           INTEGER PRIMARY KEY,
    memory_id    TEXT REFERENCES memories(id) ON DELETE CASCADE,
    task_id      TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    retrieval_id INTEGER REFERENCES retrievals(id) ON DELETE SET NULL,
    rating       INTEGER CHECK (rating IS NULL OR rating IN (-1, 0, 1)),
    score        REAL,
    comment      TEXT,
    source       TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user','claude','hook','auto')),
    created_at   TEXT NOT NULL
);
CREATE INDEX idx_feedback_memory ON feedback(memory_id);

-- Observações capturadas pelos hooks (resumidas e redigidas; nunca a conversa inteira).
CREATE TABLE observations (
    id          INTEGER PRIMARY KEY,
    session_id  TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    task_id     TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    event       TEXT NOT NULL,      -- nome do hook
    tool_name   TEXT,
    tool_use_id TEXT,
    success     INTEGER CHECK (success IS NULL OR success IN (0,1)),
    summary     TEXT,
    payload     TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL
);
CREATE INDEX idx_observations_session ON observations(session_id);

-- Linha do tempo do motor (alimenta o dashboard). Só ids, tipos e contagens: nunca conteúdo.
CREATE TABLE events (
    id        INTEGER PRIMARY KEY,
    ts        TEXT NOT NULL,
    type      TEXT NOT NULL,
    entity    TEXT,
    entity_id TEXT,
    data      TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_events_ts ON events(ts);
CREATE INDEX idx_events_type ON events(type);

-- Versões de componentes ajustáveis (pesos do ranker, configurações) com snapshot para rollback.
CREATE TABLE versions (
    id         INTEGER PRIMARY KEY,
    component  TEXT NOT NULL,
    version    INTEGER NOT NULL,
    data       TEXT NOT NULL DEFAULT '{}',
    parent_id  INTEGER REFERENCES versions(id) ON DELETE SET NULL,
    active     INTEGER NOT NULL DEFAULT 0,
    note       TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (component, version)
);

-- Propostas do Evolution Engine, testadas por replay antes de aplicar.
CREATE TABLE evolution_proposals (
    id               INTEGER PRIMARY KEY,
    component        TEXT NOT NULL,
    description      TEXT NOT NULL,
    proposal         TEXT NOT NULL DEFAULT '{}',
    metric_name      TEXT,
    baseline_metric  REAL,
    candidate_metric REAL,
    status           TEXT NOT NULL DEFAULT 'proposed'
                     CHECK (status IN ('proposed','tested','applied','rejected','rolled_back')),
    version_id       INTEGER REFERENCES versions(id) ON DELETE SET NULL,
    created_at       TEXT NOT NULL,
    decided_at       TEXT
);

-- Modelos do classificador de tarefas (regras ou Naive Bayes treinado de verdade).
CREATE TABLE classifier_models (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    algo          TEXT NOT NULL CHECK (algo IN ('rules','naive_bayes')),
    version       INTEGER NOT NULL,
    params        TEXT NOT NULL DEFAULT '{}',
    classes       TEXT NOT NULL DEFAULT '[]',
    n_samples     INTEGER NOT NULL DEFAULT 0,
    cv_accuracy   REAL,
    label_sources TEXT NOT NULL DEFAULT '[]',
    active        INTEGER NOT NULL DEFAULT 0,
    trained_at    TEXT NOT NULL,
    UNIQUE (name, version)
);
"""
