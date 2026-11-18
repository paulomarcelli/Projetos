# HELA

Memória cognitiva local para o Claude Code: um "cérebro externo" que guarda experiências, conhecimentos e
procedimentos, e devolve só o que é relevante para a próxima tarefa.

> **Estado:** Fase 2 (Cognitive Core) pronta. Skill, MCP, hooks, dashboard e instalador chegam nas próximas fases.
> O plano completo está em [`docs/plano.md`](docs/plano.md) e as decisões em [`docs/arquitetura.md`](docs/arquitetura.md).

## Rodar o núcleo (desenvolvimento)

```bash
cd Projetos/HELA
uv venv .venv && uv pip install --python .venv/bin/python -e ".[dev]"
.venv/bin/pytest            # a suíte usa um HELA_HOME temporário
.venv/bin/hela status       # banco em ~/.hela (ou em $HELA_HOME)
.venv/bin/hela export --out minhas-memorias.json
.venv/bin/hela import --dry-run minhas-memorias.json
```

Os dados ficam só na sua máquina, em `~/.hela/` (ou na pasta indicada por `HELA_HOME`). Nada de memória vai para o git.
