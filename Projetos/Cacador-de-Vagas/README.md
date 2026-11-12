<div align="center">

# 🎯 Caçador de Vagas

**O n8n lê os alertas de vaga do LinkedIn no seu e-mail, a IA dá uma nota para cada vaga e um modelo de Machine Learning aprende o seu gosto.**

![n8n](https://img.shields.io/badge/n8n-self--hosted-EA4B71?style=flat-square&logo=n8n&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_API-4285F4?style=flat-square&logo=googlegemini&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-opcional-000000?style=flat-square)
![Notion](https://img.shields.io/badge/Notion_API-000000?style=flat-square&logo=notion&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)

Tudo roda no seu computador e de graça.

</div>

## O que ele faz

```text
Alerta de vagas do LinkedIn (e-mail)
        │  o n8n lê assim que chega (IMAP)
        ▼
Extrair vagas ──► já está no Notion? ──► IA dá nota 0–10 ──► salva no Notion ──► e-mail com as melhores
                                         (Gemini ou Ollama)    (banco "Vagas")

Você marca 👍 / 👎 nas vagas ──► ml/treinar.py ──► seu modelo × a IA: quem acerta mais o seu gosto?
```

1. **Fluxo 01 · alertas do LinkedIn:** a cada alerta, as vagas novas ganham nota, explicação, pontos fortes, lacunas, área, nível e modalidade, e vão para o Notion. Você recebe um e-mail só com as vagas de nota 7 ou mais.
2. **Fluxo 02 · analisar uma vaga:** um formulário em `localhost:5678/form/analisar-vaga`. Você cola a descrição completa e as perguntas da candidatura, e a IA devolve a nota, **rascunhos de resposta com os seus projetos reais**, uma mensagem para o recrutador e o que destacar no currículo.
3. **Machine Learning:** com as vagas que você marcou em "Gostei?", treina um modelo próprio (TF-IDF + Regressão Logística) e compara com a nota da IA, usando validação cruzada.

<table>
  <tr>
    <td><img src="docs/fluxo-01.webp" alt="Fluxo 01 no editor do n8n: do e-mail até o resumo"><br><sub><b>Fluxo 01</b> · do alerta ao resumo</sub></td>
  </tr>
  <tr>
    <td><img src="docs/fluxo-02.webp" alt="Fluxo 02 no editor do n8n: do formulário ao resultado"><br><sub><b>Fluxo 02</b> · do formulário à análise</sub></td>
  </tr>
</table>

> [!NOTE]
> **Sem raspagem do LinkedIn.** O projeto só lê os e-mails de alerta que o próprio LinkedIn manda para você. Nada acessa o site do LinkedIn, então não há risco para a sua conta.

## Do que você precisa (tudo grátis)

| | Para quê |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Rodar o n8n. Sem Docker: `npx n8n` (precisa do Node.js 24) |
| Conta Google com verificação em 2 etapas | Ler os alertas (IMAP) e mandar o resumo (SMTP) com uma senha de app |
| Chave da API do Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) | A IA. Alternativa sem chave: Ollama local |
| Notion | O banco "Vagas" (já criado em DASHBOARD › VAGAS) |
| Python 3.11+ | Só para a parte de Machine Learning |

## Passo a passo

### 1. Subir o n8n

```bash
docker compose up -d
```

Abra **http://localhost:5678** e crie a sua conta local, que fica só no seu computador.

### 2. Alertas de vaga no LinkedIn

1. Pesquise vagas no LinkedIn: "estágio dados", "python júnior", "inteligência artificial estágio" e assim por diante.
2. Ative o **alerta** de cada pesquisa, com frequência **diária** e aviso **por e-mail**.

### 3. Gmail: marcador e senha de app

1. **Senha de app:** em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crie uma senha de app. Ela só aparece se a verificação em 2 etapas estiver ligada.
2. **Filtro:** no Gmail, crie um filtro para **De:** `jobalerts-noreply@linkedin.com` → **Aplicar o marcador** `Vagas` (crie o marcador) → **Pular a Caixa de entrada**.

   O fluxo lê os e-mails **não lidos** do marcador `Vagas` e os marca como lidos. Assim nada se perde se você abrir o Gmail antes.

### 4. Notion: integração

1. Em [notion.so/profile/integrations](https://www.notion.so/profile/integrations), crie uma **integração interna** e copie o token.
2. Abra o banco **Vagas** (DASHBOARD › VAGAS) › `•••` › **Conexões** › adicione a integração.

### 5. Importar os fluxos

No n8n, crie um workflow em branco, abra o menu **⋯** no canto superior direito › **Import from File** e escolha `n8n/01-alertas-linkedin.json`. Repita com um workflow novo para `n8n/02-analisar-vaga.json`.

### 6. Criar as credenciais

Em cada nó com triângulo vermelho, clique e escolha **Create new credential**:

| Credencial | Tipo | Preenchimento | Nós |
|---|---|---|---|
| **Notion** | Header Auth | Name `Authorization` · Value `Bearer SEU_TOKEN_DO_NOTION` | Já está no Notion?, Salvar no Notion |
| **IA (Gemini)** | Header Auth | Name `Authorization` · Value `Bearer SUA_CHAVE_DO_GEMINI` | Nota da IA, IA analisa |
| **Gmail IMAP** | IMAP | Usuário: seu Gmail · Senha: a senha de app · Host `imap.gmail.com` · Porta `993` · SSL ligado | Novo alerta no e-mail |
| **Gmail SMTP** | SMTP | Usuário: seu Gmail · Senha: a senha de app · Host `smtp.gmail.com` · Porta `465` · SSL ligado | Enviar resumo |

No nó **Configuração** (nos dois fluxos), troque `email_resumo` pelo seu e-mail. Ali também ficam o seu perfil, o modelo da IA e a nota mínima do resumo.

> [!TIP]
> Se o Gemini responder "model not found", troque `llm_modelo` pelo modelo Flash mais recente que aparece no AI Studio.

### 7. Testar

1. No fluxo 01, clique na seta do botão **Execute** e escolha **Testar com e-mail de exemplo**.
2. Duas vagas **de exemplo** (marcadas "EXEMPLO") vão aparecer no Notion: uma com nota alta e outra com nota baixa. Você recebe o e-mail de resumo com a boa.
3. Apague as duas do Notion depois.

### 8. Ligar

Clique em **Publish** nos dois fluxos:
- o 01 passa a rodar sozinho a cada alerta, enquanto o n8n estiver ligado;
- o 02 fica em **http://localhost:5678/form/analisar-vaga**.

## Machine Learning: o seu modelo contra a IA

1. Durante umas duas semanas, marque **Gostei?** (👍 Sim / 👎 Não) nas vagas do Notion. O treino exige pelo menos 20 vagas marcadas, com 5 de cada tipo.
2. Depois rode:

```bash
pip install -r ml/requirements.txt
```

```bash
NOTION_TOKEN=SEU_TOKEN_DO_NOTION python ml/exportar.py
```

```bash
python ml/treinar.py
```

```bash
python ml/prever.py
```

O que cada um faz:
- `exportar.py` baixa as vagas do Notion para `ml/dados/vagas.csv`;
- `treinar.py` treina, avalia e escreve `ml/resultados/relatorio.md`;
- `prever.py` ordena as vagas ainda não marcadas pela chance de você gostar.

No Windows (PowerShell), troque a linha do token por `$env:NOTION_TOKEN="SEU_TOKEN"; python ml/exportar.py`.

O relatório traz:
- **acurácia, precisão, revocação e F1** de três "previsores" nas mesmas vagas: o seu modelo, a IA (nota ≥ 7) e o chute da maioria;
- a **matriz de confusão** do seu modelo e da IA;
- as **palavras que mais pesam** para você gostar ou não de uma vaga.

**Como a avaliação é feita:** validação cruzada estratificada. Cada vaga é prevista por um modelo que não a viu no treino, então a nota não é inflada por "decorar" os dados.

## IA local com Ollama (sem chave nenhuma)

```bash
docker compose --profile ollama up -d
```

```bash
docker compose exec ollama ollama pull qwen2.5:7b
```

No nó **Configuração**:
- `llm_url` = `http://ollama:11434/v1/chat/completions`
- `llm_modelo` = `qwen2.5:7b`

Na credencial de IA, qualquer valor serve (por exemplo `Bearer ollama`).

Modelos de 7B precisam de uns 8 GB de RAM, são mais lentos em CPU e erram mais que o Gemini.

## Limites

- O e-mail de alerta traz só título, empresa e local, então a nota do fluxo 01 é uma triagem. Para decidir, cole a descrição completa no fluxo 02.
- A IA pode errar. Ela foi instruída a não inventar experiência, mas **revise toda resposta antes de enviar**.
- O plano grátis do Gemini tem limite por minuto. Por isso o fluxo pede uma nota a cada 5 segundos.
- O fluxo 01 só funciona com o n8n ligado. E-mails que chegam com ele desligado ficam não lidos e são lidos quando ele volta.

## Estrutura

```text
Cacador-de-Vagas/
├── docker-compose.yml          # n8n (+ Ollama opcional)
├── perfil.md                   # seu perfil: a IA usa isto para dar a nota
├── n8n/
│   ├── 01-alertas-linkedin.json
│   ├── 02-analisar-vaga.json
│   ├── montar_fluxos.py        # gera os JSON a partir de codigo/ e perfil.md
│   └── codigo/                 # o JavaScript de cada nó de código
├── ml/
│   ├── exportar.py             # Notion → CSV
│   ├── treinar.py              # treino + avaliação + relatório
│   └── prever.py               # ordena as vagas novas
└── testes/
    ├── teste_extrair_vagas.js  # leitor de e-mails (4 cenários)
    └── teste_ml.py             # treino ponta a ponta com dados fictícios
```

Mudou o perfil ou o código de um nó? Rode `python n8n/montar_fluxos.py` e importe o fluxo de novo.

Para rodar os testes:

```bash
node testes/teste_extrair_vagas.js
```

```bash
python testes/teste_ml.py
```
