# Design — Sistema Especialista "Qual é o seu perfil de investidor?"

Atividade **Expert System — FECAP**: criar um sistema (tema livre), versionar com Git, criar branches e merges,
enviar ao GitHub, criar issues e pull request.

## 1. O que é
Um **sistema especialista** que faz ~10 perguntas sobre a vida financeira da pessoa e, com uma **base de regras**,
conclui o **perfil de investidor** (conservador, moderado ou arrojado), sugere uma **carteira de exemplo** e
**explica o raciocínio** citando as regras que usou.

- **Para quem:** iniciantes em investimentos (colegas, família) e a banca da FECAP.
- **Sucesso:** a pessoa responde em menos de 3 minutos, entende o resultado e consegue ver *por que* o sistema concluiu aquilo.
- **Não é:** recomendação oficial de investimento. A tela final deixa claro que é um projeto educacional
  (no Brasil, a análise de perfil oficial — *suitability* — é feita pela corretora/banco).

## 2. Abordagens consideradas
| Abordagem | Prós | Contras |
|-----------|------|---------|
| **A. Site estático (HTML/CSS/JS) — escolhida** | Roda em qualquer navegador, sem servidor; publica no GitHub Pages; testes simples com Node | Não salva histórico entre visitas |
| B. Python + Flask | Mais "sistema", pode salvar dados | Precisa hospedar servidor; mais difícil de apresentar |
| C. Python no terminal | Mais simples | Sem interface; pouco para mostrar |

Escolha do usuário: **A**.

## 3. Como funciona o sistema especialista
Três partes clássicas, cada uma em um arquivo:

1. **Base de conhecimento** (`js/base-conhecimento.js`)
   - **Perguntas**, cada resposta gera um **fato** (ex.: `prazo = curto`, `reserva_emergencia = nao`) e **pontos de risco** (0 a 4).
   - **Regras SE → ENTÃO**, com nome e explicação em português. Exemplos:
     - R01 — SE pontuação ≤ 12 (de 34) ENTÃO perfil preliminar = conservador.
     - R02 — SE pontuação entre 13 e 23 ENTÃO perfil preliminar = moderado.
     - R03 — SE pontuação ≥ 24 ENTÃO perfil preliminar = arrojado.
     - R10 — SE não tem reserva de emergência ENTÃO perfil máximo = conservador e recomendar montar a reserva primeiro.
     - R11 — SE precisa do dinheiro em menos de 1 ano ENTÃO perfil máximo = conservador.
     - R12 — SE venderia tudo numa queda de 10% ENTÃO perfil máximo = moderado.
     - R13 — SE tem dívidas com juros altos (cartão, cheque especial) ENTÃO recomendar quitar dívidas antes de investir.
     - R14 — SE a reserva está incompleta ENTÃO recomendar completá-la.
     - R20 — perfil final = o menor entre o preliminar e o limite; R30…R32 — carteira de exemplo para cada perfil (percentuais por tipo de investimento).
2. **Motor de inferência** (`js/motor.js`)
   - **Encadeamento para frente**: parte dos fatos, dispara as regras cujas condições são verdadeiras, adiciona novos fatos,
     repete até nenhuma regra nova disparar. Regras de **limite** (R10–R12) têm prioridade sobre o perfil preliminar.
   - Guarda a **trilha de raciocínio**: quais regras dispararam, em que ordem e por quê.
   - Não conhece nada sobre investimentos: só sabe executar regras. Trocar a base troca o especialista.
3. **Interface e explicação** (`index.html`, `css/estilo.css`, `js/app.js`)
   - Uma pergunta por tela, barra de progresso, voltar e avançar, funciona por teclado e no celular.
   - Resultado: perfil em destaque, carteira de exemplo em barras, alertas (reserva/dívidas) e a seção
     **"Como cheguei nisso"** com as regras disparadas.
   - Botão **refazer**.

## 4. Interface (skill de design)
- Direção de arte escolhida com a skill de design (`taste-skill`) e textos revisados com `ux-writing`.
- Linguagem simples, sem jargão; cada termo técnico (CDB, Tesouro IPCA+, ETF) com uma explicação curta.
- Acessível: contraste AA, foco visível, botões grandes, rótulos nos campos.

## 5. Testes
- `tests/motor.test.js` com o testador nativo do Node (`node --test`): cada regra, casos de limite
  (sem reserva → nunca passa de conservador), perfis extremos e a trilha de explicação.

## 6. Git e GitHub (o que a atividade pede)
Projeto na pasta `Projetos/Perfil-Investidor/` do repositório `paulomarcelli/projetos`.

```
main
 └─ perfil-investidor/develop                  (integração do projeto)
     ├─ perfil-investidor/feature/base-de-regras   → merge em develop
     ├─ perfil-investidor/feature/motor-inferencia → merge em develop
     ├─ perfil-investidor/feature/interface        → merge em develop
     └─ perfil-investidor/docs/readme              → merge em develop
```
- Cada branch tem seus commits e é **mesclada com `merge --no-ff`** (o histórico mostra cada merge). Todas são enviadas ao GitHub.
- **Issues** no `paulomarcelli/projetos`, uma por funcionalidade, citadas nos commits.
- **Pull request** de `perfil-investidor/develop` → `main` com "Closes #…" para cada issue. **Você** faz o merge final no GitHub
  (bom para o print da atividade).
- **Projeto do colega:** com o link do repositório, uma issue com sugestão e um pull request com uma melhoria pequena
  (via fork), sempre com sua confirmação antes de enviar.
- `README.md` com: o que é, como usar, como funciona o sistema especialista, como rodar os testes e
  **passo a passo no GitHub Desktop** (clonar, ver branches, merge, push) para você reproduzir no seu computador.

## 7. Fora do escopo
Salvar respostas, login, dados reais de mercado, recomendação de produtos específicos (nomes de fundos/ações).
