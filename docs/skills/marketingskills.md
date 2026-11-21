# Marketing Skills — origem e uso

O repositório incorpora o pacote [Marketing Skills](https://github.com/coreyhaines31/marketingskills), de Corey Haines,
sob licença MIT (cópia em `docs/skills/MARKETINGSKILLS-LICENSE` e um `LICENSE` em cada pasta de skill). Versão do
plugin: **2.14.25**; commit `5b2b400` de 19/11/2026. As versões de cada skill estão em
`docs/skills/MARKETINGSKILLS-VERSIONS.md`.

## O que foi instalado (21/11/2026)

- As 54 skills de `skills/` do pacote, em `.claude/skills/<nome>/` (o formato Agent Skills que o Claude Code lê):
  `SKILL.md` e `references/`. A pasta `evals/` de cada skill (testes do autor) ficou de fora.
- `content-strategy`, `copy-editing` e `social` já estavam no repositório (instaladas com a Gabriela em 17/11):
  as duas primeiras estavam iguais à versão atual e não mudaram; a `social` foi de 2.5.2 para 2.6.0.
- **Não instalado:** a pasta `tools/` do pacote (registro e guias de integração com serviços pagos, como Supermetrics,
  Meta Ads e TikTok Ads). As skills citam `tools/REGISTRY.md` como opção; a Gabriela não tem acesso às contas e
  trabalha com os números que o Paulo manda. Nenhuma chave de API foi configurada.

## Quem usa

A **Gabriela** (marketing, conteúdo e análise de performance). O perfil dela (`.claude/agents/gabriela.md`) diz qual
skill usar para cada tarefa; ela lê só a que serve, sem aplicar o pacote inteiro. As outras agentes podem consultar uma
skill se a tarefa pedir.

## Como atualizar

```bash
bash docs/skills/atualizar-marketingskills.sh
```

O script baixa a versão atual do repositório oficial numa pasta temporária, copia cada skill para `.claude/skills/`
(sem `evals/`, com o `LICENSE`), atualiza `MARKETINGSKILLS-VERSIONS.md` e mostra o que mudou no `git status`. Revise o
diff antes do commit: o script não apaga skill que o pacote tenha removido (diga isso no relatório e decida à mão).

Origem: https://github.com/coreyhaines31/marketingskills
