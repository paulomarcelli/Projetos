# 🌙 LUNA MIND

<div align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Gemini%20API-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini API" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Status-Online-brightgreen?style=for-the-badge" alt="Status: online" />
</div>

<p align="center">
  <b>Assistente de apoio emocional com conversa por texto e por voz.</b>
</p>

<p align="center">
  <a href="https://paulomarcelli.github.io/Projetos/Projetos/Luna/"><b>🌙 Abrir a Luna online →</b></a><br>
  <sub><code>https://paulomarcelli.github.io/Projetos/Projetos/Luna/</code></sub>
</p>

> ⏳ **Primeira mensagem demorada?** A parte que pensa (o servidor) roda num plano gratuito que "dorme" depois de uns 15 minutos sem uso. Na primeira mensagem depois disso, a Luna mostra "Acordando a Luna…" e pode levar até 1 minuto. Depois responde em poucos segundos.

---

## 📌 Sobre o projeto

A **LUNA MIND** (antes "Luna AI") ajuda a pessoa a entender o que está sentindo, organizar os pensamentos e enxergar a situação com mais equilíbrio. Ela acolhe sem julgar, separa fatos de interpretações e sugere pequenos próximos passos.

A Luna **não é psicóloga**, não faz diagnóstico e não substitui atendimento profissional ou de emergência. Em situações de risco, ela prioriza a segurança e mostra os contatos de ajuda: **CVV 188**, **SAMU 192**, **Polícia 190**, **Ligue 180** e **Disque 100**.

O que ela faz:

- **Abertura de boas-vindas** animada (logo, nome e estrelas), que aparece uma vez por sessão e pode ser pulada.
- Conversa por **texto** ou por **voz**, com botões para pausar, interromper e encerrar.
- **Voz em tempo real** (opcional): conversa simultânea, em que você pode interromper a Luna só falando.
- **Personalidade** acolhedora, serena e honesta, a mesma no texto e na voz (veja [Onde editar a personalidade](#️-onde-editar-a-personalidade)).
- Lembra do que foi dito na conversa.
- **Biblioteca de pesquisa (RAG)**: antes de responder, busca trechos relevantes em `conhecimento/` (ansiedade, luto, relacionamentos, estresse, hábitos...) e, quando usa algum, mostra a fonte sob a resposta. Se a biblioteca não tiver nada útil, ela simplesmente não é usada.
- **Segurança** que não depende da IA: o próprio programa reconhece frases de risco e garante a resposta certa, inclusive na voz.
- **Histórico** e **memória** opcionais. Ficam só no seu navegador e você pode ver, corrigir e apagar tudo.
- Funciona no celular, no tablet e no computador, com opções de **texto maior** e **menos animação**.

> ⚠️ Para maiores de 18 anos (exigência dos termos das APIs de IA usadas).

## 🧩 Como as peças se encaixam

```text
 Você (navegador)
      │  abre
      ▼
 GitHub Pages ── só a tela (web/) ── https://paulomarcelli.github.io/Projetos/Projetos/Luna/
      │  envia a mensagem
      ▼
 Render ── o "cérebro" (app.py) ── https://luna-mind.onrender.com
      │  personalidade + memória + biblioteca + segurança
      ▼
 IA: OpenAI (ou serviço compatível) primeiro; se falhar, Gemini
```

- **GitHub Pages** só guarda arquivos prontos (tela, cores, animação). Não roda programas e **não guarda nenhuma chave**.
- **Render** roda o servidor Python (`app.py`). As chaves ficam só nele, em *Environment*, nunca no código.
- Rodando no seu computador (`python app.py`), as duas partes saem do mesmo endereço.

## 🚀 Como rodar no seu computador (passo a passo)

Você só precisa fazer os passos 1 a 4 uma vez.

**1. Instale o Python.** Baixe em [python.org/downloads](https://www.python.org/downloads/). No Windows, marque a caixinha **"Add python.exe to PATH"** antes de clicar em instalar.

**2. Pegue sua chave do Gemini (grátis).** Entre em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) com sua conta Google e clique em **Create API key**. Copie a chave.

**3. Coloque a chave no projeto.** Na pasta `Luna-AI`, faça uma cópia do arquivo `.env.example` e renomeie a cópia para `.env`. Abra o `.env` no Bloco de Notas e troque `coloque-sua-chave-aqui` pela sua chave. Salve.

> 🔒 O arquivo `.env` é secreto: nunca mande para ninguém nem publique no GitHub. Ele já está no `.gitignore`.

**4. Instale as bibliotecas.** Abra o terminal **dentro da pasta `Luna-AI`** (a que tem o `app.py`). No Windows: abra a pasta, clique na barra de endereço, digite `cmd` e aperte Enter. Depois digite:

```bash
pip install -r requirements.txt
```

**5. Ligue a Luna.** No mesmo terminal:

```bash
python app.py
```

O terminal deve mostrar `LUNA MIND rodando em http://127.0.0.1:5000` e **fica ocupado enquanto a Luna estiver ligada** (isso é normal).

**6. Abra no navegador:** [http://127.0.0.1:5000](http://127.0.0.1:5000). Use **Chrome** ou **Edge** para ter a conversa por voz.

Para desligar, volte ao terminal e aperte `Ctrl + C`.

### Se não abrir

- O terminal precisa estar **dentro da pasta com o `app.py`**. Se aparecer "No such file", use `cd` para entrar na pasta certa (pode haver uma pasta `Luna-AI` dentro de outra).
- Rode `python -c "import app; print('carregou ok')"` para ver qualquer erro escondido.
- "Recusado" ou "não foi possível conectar" no navegador quer dizer que o `python app.py` não está rodando: veja o terminal.
- No Windows, `py app.py` funciona quando o comando `python` não é encontrado.

## 🤖 Provedores de IA

A Luna fala com um modelo de linguagem por provedor. A ordem é:

1. **OpenAI (ou serviço compatível)**, se `OPENAI_API_KEY` estiver no `.env`. Também aceita um serviço de terceiros com a mesma interface, definindo o endereço e o modelo:
   ```text
   OPENAI_API_KEY=sua-chave
   LUNA_OPENAI_URL=https://endereco-do-servico/v1/chat/completions
   LUNA_OPENAI_MODELO=nome-do-modelo
   ```
2. **Gemini**, como padrão e como **reserva**: se o primeiro falhar (chave recusada, limite, instabilidade), o Gemini assume e a conversa não para.

Para usar **só** o Gemini, ponha `LUNA_PROVEDOR=gemini` no `.env`.

> 🔎 **Privacidade com serviços de terceiros:** se você apontar `LUNA_OPENAI_URL` para um revendedor, tudo o que a pessoa escrever passa pelos servidores dele antes de chegar à IA. Para um app de apoio emocional, prefira a OpenAI direta ou o Gemini.

## 🎙️ Voz

### Voz em tempo real (opcional)

Com `OPENAI_REALTIME_API_KEY` no `.env` (**chave oficial da OpenAI**, com acesso ao Realtime; chaves de revenda não servem), o microfone abre uma conversa simultânea: a Luna ouve e responde falando, e você pode interrompê-la só começando a falar. A chave secreta fica no servidor; o navegador recebe só uma chave temporária (expira em 2 minutos) para abrir a conexão. Cada fala passa pela mesma camada de segurança do chat, e há um limite de 20 sessões por hora por endereço de internet.

Variáveis: `LUNA_REALTIME_MODELO` (padrão `gpt-realtime-2.1`), `LUNA_REALTIME_VOZ` (padrão `marin`) e `LUNA_VOZ_TEMPO_REAL=0` para desligar.

### Voz do navegador (padrão)

Sem a chave acima, o microfone usa a voz do próprio navegador:

1. Toque no botão do **microfone** e permita o acesso quando o navegador pedir.
2. Fale normalmente. Quando você parar, a Luna responde em voz alta e volta a ouvir.
3. **Pausar** e **Retomar** controlam a fala e a escuta. **Interromper** corta a fala dela (a tecla `Esc` também). **Encerrar** desliga a voz.

A voz varia de aparelho para aparelho. Em **Configurações → Voz**, teste as opções e escolha a que soar mais calma para você. No Edge, as vozes com "Natural" no nome costumam ser as mais naturais.

## 🌐 Publicação (GitHub Pages + Render)

### Tela: GitHub Pages

O workflow `.github/workflows/pages.yml` publica a pasta `web/` em `https://paulomarcelli.github.io/Projetos/Projetos/Luna/` a cada push na `main`. Ele grava no `config.js` o endereço do servidor (padrão `https://luna-mind.onrender.com`; a variável `LUNA_API_URL` do repositório, se existir, tem prioridade) e renova a versão dos arquivos a cada publicação, para o navegador não ficar com a página antiga.

### Servidor: Render

O arquivo `render.yaml` (na raiz do repositório) descreve o serviço:

1. No Render: **New → Blueprint**, escolha o repositório e a branch `main`.
2. Informe as chaves quando ele pedir (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `LUNA_OPENAI_URL`, `LUNA_OPENAI_MODELO`). Elas ficam guardadas no Render, não no código.
3. Aguarde o status **Live** e confira `https://luna-mind.onrender.com/status`.

Já vêm configurados: `LUNA_ORIGENS_PERMITIDAS=https://paulomarcelli.github.io` (só o seu site pode usar o servidor), `LUNA_PROXY=1` (enxerga o endereço real de quem acessa) e `LUNA_LIMITE_CHAT_HORA=60` (**60 mensagens por hora por pessoa**, para proteger os créditos das chaves).

Para trocar uma chave: Render → serviço `luna-mind` → **Environment**.

## 🔐 Privacidade

- **Nada fica guardado sem você permitir.** Histórico e memória começam desligados e, quando ligados, ficam só no seu navegador.
- O **servidor da Luna não guarda nada**: ele recebe a mensagem, pede a resposta à IA e esquece. Os registros dele mostram só "chegou uma mensagem", nunca o texto.
- ⚠️ **Plano gratuito do Gemini:** o Google pode usar as mensagens para melhorar os produtos dele, e revisores humanos podem lê‑las. Para usar com outras pessoas de verdade, ative o faturamento na conta do Google AI Studio. No plano pago, o Google diz que não usa as conversas para isso.
- Na voz do navegador (Chrome e Edge), o áudio do microfone é enviado ao serviço de reconhecimento do navegador para virar texto. Na voz em tempo real, o áudio vai à OpenAI.
- A página publicada **não contém nenhuma chave**.

## 📚 Como funciona o RAG

O RAG segue a especificação da própria biblioteca (`conhecimento/12_Especificacao_Tecnica_RAG.md`):

1. **Ingestão** (`rag/ingestao.py`): lê os capítulos, confere o SHA-256 de cada um com o `manifesto_documentos.json` e quebra o texto por seção, guardando documento, versão, seção e posição. Capítulos técnicos (12, 14, 15) e seções editoriais (fichas de fontes, estatísticas, referências) não entram na conversa.
2. **Consulta** (`rag/consulta.py`): a fala da pessoa é preservada; uma expansão pequena e revisável liga palavras do dia a dia ("remoendo", "namoro") a termos da biblioteca.
3. **Busca** (`rag/recuperador.py`, `rag/indice.py`): BM25 sempre. Com `LUNA_RAG_DENSO=1` entra também a busca por significado (embeddings do Gemini), que acha trechos mesmo quando a pessoa usa outras palavras ("fico revivendo a conversa na cabeça" → ruminação). A decisão de usar ou não a biblioteca combina os dois sinais: similaridade alta basta; na faixa de borda exige também uma palavra em comum; abaixo disso, só evidência forte de palavras. Sem evidência, **não traz nada** (abstenção). Os limiares foram calibrados com a biblioteca real (`python tests/calibrar_busca_densa.py`).
   - A primeira vez monta o índice em **segundo plano** (332 trechos; no plano gratuito leva ~4 minutos por causa do limite de 100 textos/minuto) e guarda em `conhecimento/.cache/`. Enquanto isso o chat usa só BM25.
4. **Prompt** (`rag/prompt.py`): os trechos vão como **dados não confiáveis**, nunca como instruções.
5. **Resposta** (`luna.py`): o modelo informa quais trechos usou; o servidor só aceita ids que realmente foram enviados.
6. **Segurança**: em risco alto ou imediato o RAG não é usado; quem conduz é a camada de `seguranca.py`.

Diagnóstico sem dados pessoais: `GET /status` (mostra se a chave existe, se a voz em tempo real está ativa e o estado da biblioteca). Variáveis em `.env.example`. Para desligar o RAG: `LUNA_RAG=0`.

## ✏️ Onde editar a personalidade

Tudo o que define **como a Luna fala e se comporta** está em um único arquivo: [`personalidade.py`](personalidade.py), usado por todos os modos:

- `INSTRUCOES`: identidade, traços, jeito de conversar, estilo, limites da relação e segurança. Vale para o chat com qualquer provedor (OpenAI ou Gemini).
- `VOZ`: ajustes quando a resposta vai ser falada pela voz do navegador.
- `VOZ_TEMPO_REAL`: ajustes da conversa por voz ao vivo.

O resto do sistema (RAG, segurança, interface) não escreve nem altera esse texto. Só não mude os nomes dos campos da seção "FORMATO DA SAÍDA" sem ajustar `luna.interpretar()`.

## ⚠️ Limites das chaves gratuitas

O plano gratuito do Gemini permite poucas requisições por dia por modelo (20/dia para o `gemini-3.6-flash` quando testado) e 100 textos de embeddings por minuto. Quando o limite diário acaba, a Luna avisa com uma mensagem própria. Para uso de verdade, ative o faturamento no Google AI Studio. O app repete automaticamente erros temporários do servidor do Google (503 "alta demanda").

## 🧪 Testes

Na pasta `Luna-AI`:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

- `test_seguranca.py` e `test_app.py` verificam a segurança, o servidor e a ordem dos provedores (OpenAI primeiro, Gemini de reserva). Não precisam de internet nem de chave.
- `test_voz_tempo_real.py` testa a sessão temporária da voz ao vivo (a chave secreta nunca vai ao navegador), a segurança das falas e o CORS, com a OpenAI simulada.
- `test_hospedagem.py` testa o limite de mensagens por pessoa.
- `test_rag.py` testa a biblioteca real: ingestão e hashes, busca por tema, abstenção, trechos como dados não confiáveis, fontes conferidas, risco alto sem RAG e modo híbrido (com embeddings falsos).
- `test_interface.py` abre a Luna num navegador automático em três tamanhos (celular, tablet e computador). Precisa de `pip install playwright` e `python -m playwright install chromium`.
- `avaliar_respostas.py` conversa com o modelo de verdade nos 12 cenários do projeto e gera um relatório para você dar notas (inclui as fontes da biblioteca usadas). Precisa da chave. Salva a cada cenário; se a cota acabar, continue depois com `LUNA_AVALIAR_DESDE=6`.
- `calibrar_busca_densa.py` mede a separação entre frases relevantes e irrelevantes para os limiares da busca híbrida.

```bash
python tests/avaliar_respostas.py
```

## 📁 Arquivos

```text
Luna-AI/
├── app.py               → servidor: chat, status, voz em tempo real, CORS e limites de uso
├── luna.py              → "cérebro": junta personalidade, memória, RAG e segurança e chama a IA (OpenAI ou Gemini)
├── personalidade.py     → a personalidade da Luna, para texto e voz (você edita aqui)
├── voz_tempo_real.py    → cria a sessão temporária da voz ao vivo e avalia a segurança das falas
├── rag/                 → busca na biblioteca: ingestão, consulta, índices, recuperação, prompt
├── conhecimento/        → biblioteca de pesquisa (capítulos, manifesto, taxonomia, catálogo de fontes)
├── docs/                → registro de progresso e continuidade
├── seguranca.py         → camada de segurança (risco, contatos de ajuda, verificações)
├── web/                 → a página publicada no GitHub Pages
│   ├── index.html, style.css, script.js   → interface e conversa
│   ├── intro.js                           → abertura animada de boas-vindas
│   ├── estrelas.js                        → céu estrelado (estrelas de 4 pontas)
│   ├── voz.js, voz-tempo-real.js          → voz do navegador e voz em tempo real
│   ├── config.js                          → endereço do servidor (gerado na publicação)
│   └── marca/, logo.png                   → logo refinado e ícones
├── tests/               → testes automáticos e avaliação das respostas
├── video/               → vídeo de apresentação feito em código (roteiro, cenas, trilha, renderização)
├── historico/luna_terminal_v1.py → primeira versão, de terminal (só histórico; ficava como LUNA.py, mas o nome colidia com luna.py no Windows)
├── requirements.txt     → bibliotecas necessárias
├── .env.example         → modelo do arquivo das chaves
├── MUDANCAS.md          → relatório técnico do que foi feito
└── README.md

(na raiz do repositório)
├── render.yaml                → descrição do servidor no Render
└── .github/workflows/pages.yml → publicação da tela no GitHub Pages
```

## 👤 Autor

Desenvolvido por **Paulo Marcelli** — Estudante de ADS na **FECAP**.
