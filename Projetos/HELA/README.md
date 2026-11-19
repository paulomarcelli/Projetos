# HELA

Memória cognitiva local para o Claude Code: um "cérebro externo" que guarda experiências, conhecimentos e
procedimentos, e devolve só o que é relevante para a próxima tarefa.

> **Estado:** Fases 2 (Cognitive Core) e 3 (Intelligence) prontas. Skill, MCP, hooks, dashboard e instalador chegam nas
> próximas fases. O contrato das 8 operações está em [`docs/api.md`](docs/api.md).
> O plano completo está em [`docs/plano.md`](docs/plano.md) e as decisões em [`docs/arquitetura.md`](docs/arquitetura.md).

## Rodar o núcleo (desenvolvimento)

```bash
cd Projetos/HELA
uv venv .venv && uv pip install --python .venv/bin/python -e ".[dev]"
.venv/bin/pytest            # a suíte usa um HELA_HOME temporário
.venv/bin/hela status       # banco em ~/.hela (ou em $HELA_HOME)
.venv/bin/hela export --out minhas-memorias.json
.venv/bin/hela import --dry-run minhas-memorias.json
.venv/bin/hela procedure list                       # procedimentos e a classe de execução de cada um
.venv/bin/hela procedure approve <id> --sha256 <sha> # aprovar um script é decisão humana (só pela CLI)
.venv/bin/hela classifier status                    # modo ativo: rules ou naive_bayes (com N e acurácia)
.venv/bin/hela evolution propose                    # propostas testadas por replay; nada é aplicado sozinho
```

### O que é regra, o que é estatística e o que é modelo treinado

| Componente | Natureza |
|---|---|
| Task Classifier | regras (palavras-chave) por padrão; **modelo treinado** (Naive Bayes multinomial) só com rótulos humanos suficientes e só se bater as regras |
| Strategy Ranker | **heurística estatística**: limite inferior de Wilson + qualidade + custos, pesos versionados |
| Evolution Engine | propostas testadas offline (Brier do replay, Wilson); aplicar e desfazer são decisões humanas |
| Cognitive Router, Context Optimizer, Execution Intelligence | regras, com o limiar de relevância medido num conjunto-ouro |

A HELA nunca executa scripts: ela classifica, valida e devolve como dado.

Os dados ficam só na sua máquina, em `~/.hela/` (ou na pasta indicada por `HELA_HOME`). Nada de memória vai para o git.
