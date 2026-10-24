# 🌙 Luna AI

<div align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Gemini%20API-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini API" />
  <img src="https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge" alt="Status: Em desenvolvimento" />
</div>

<p align="center">
  <b>Assistente de apoio emocional com conversa por texto e por voz.</b>
</p>

---

## 📌 Sobre o projeto

A **Luna** ajuda a pessoa a entender o que está sentindo, organizar os pensamentos e enxergar a situação com mais equilíbrio. Ela acolhe sem julgar, separa fatos de interpretações e sugere pequenos próximos passos.

A Luna **não é psicóloga**, não faz diagnóstico e não substitui atendimento profissional ou de emergência. Em situações de risco, ela prioriza a segurança e mostra os contatos de ajuda: **CVV 188**, **SAMU 192**, **Polícia 190**, **Ligue 180** e **Disque 100**.

O que ela faz:

- Conversa por **texto** ou por **voz**, com botões para pausar, interromper e encerrar.
- Lembra do que foi dito na conversa.
- **Segurança** que não depende da IA: o próprio programa reconhece frases de risco e garante a resposta certa.
- **Histórico** e **memória** opcionais. Ficam só no seu navegador e você pode ver, corrigir e apagar tudo.
- Funciona no celular, no tablet e no computador, com opções de **texto maior** e **menos animação**.

> ⚠️ Para maiores de 18 anos (exigência dos termos da API do Gemini).

## 🚀 Como rodar (passo a passo)

Você só precisa fazer os passos 1 a 4 uma vez.

**1. Instale o Python.** Baixe em [python.org/downloads](https://www.python.org/downloads/). No Windows, marque a caixinha **"Add python.exe to PATH"** antes de clicar em instalar.

**2. Pegue sua chave do Gemini (grátis).** Entre em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) com sua conta Google e clique em **Create API key**. Copie a chave.

**3. Coloque a chave no projeto.** Na pasta `Luna-AI`, faça uma cópia do arquivo `.env.example` e renomeie a cópia para `.env`. Abra o `.env` no Bloco de Notas e troque `coloque-sua-chave-aqui` pela sua chave. Salve.

> 🔒 O arquivo `.env` é secreto: nunca mande para ninguém nem publique no GitHub. Ele já está no `.gitignore`.

**4. Instale as bibliotecas.** Abra o terminal na pasta `Luna-AI`. No Windows: abra a pasta, clique na barra de endereço, digite `cmd` e aperte Enter. Depois digite:

```bash
pip install -r requirements.txt
```

**5. Ligue a Luna.** No mesmo terminal:

```bash
python app.py
```

**6. Abra no navegador:** [http://127.0.0.1:5000](http://127.0.0.1:5000). Use **Chrome** ou **Edge** para ter a conversa por voz.

Para desligar, volte ao terminal e aperte `Ctrl + C`.

## 🎙️ Conversa por voz

1. Toque no botão do **microfone** e permita o acesso quando o navegador pedir.
2. Fale normalmente. Quando você parar, a Luna responde em voz alta e volta a ouvir.
3. **Pausar** e **Retomar** controlam a fala e a escuta. **Interromper** corta a fala dela (a tecla `Esc` também). **Encerrar** desliga a voz.

A voz é a do seu próprio navegador e varia de aparelho para aparelho. Em **Configurações → Voz**, teste as opções e escolha a que soar mais calma para você. No Edge, as vozes com "Natural" no nome costumam ser as mais naturais.

## 🔐 Privacidade

- **Nada fica guardado sem você permitir.** Histórico e memória começam desligados e, quando ligados, ficam só no seu navegador.
- O **servidor da Luna não guarda nada**: ele recebe a mensagem, pede a resposta ao Gemini e esquece. Os registros dele mostram só "chegou uma mensagem", nunca o texto.
- ⚠️ **Plano gratuito do Gemini:** o Google pode usar as mensagens para melhorar os produtos dele, e revisores humanos podem lê‑las. Para usar com outras pessoas de verdade, ative o faturamento na conta do Google AI Studio. No plano pago, o Google diz que não usa as conversas para isso.
- Na conversa por voz no Chrome e no Edge, o áudio do microfone é enviado ao serviço de reconhecimento do navegador para virar texto.

## 🧪 Testes

```bash
python -m unittest discover tests
```

- `test_seguranca.py` e `test_app.py` verificam a segurança e o servidor. Não precisam de internet nem de chave.
- `test_interface.py` abre a Luna num navegador automático em três tamanhos (celular, tablet e computador). Precisa de `pip install playwright` e `python -m playwright install chromium`.
- `avaliar_respostas.py` conversa com o Gemini de verdade nos 12 cenários do projeto e gera um relatório para você dar notas. Precisa da chave.

```bash
python tests/avaliar_respostas.py
```

## 📁 Arquivos

```text
Luna-AI/
├── app.py             → servidor (liga a página ao Gemini)
├── luna.py            → "cérebro": instruções da Luna e chamada ao Gemini
├── seguranca.py       → camada de segurança (risco, contatos de ajuda, verificações)
├── web/               → a página: index.html, style.css, script.js, voz.js, logo.png
├── tests/             → testes automáticos e avaliação das respostas
├── video/             → vídeo de apresentação feito em código (roteiro, cenas, trilha, renderização)
├── requirements.txt   → bibliotecas necessárias
├── .env.example       → modelo do arquivo da chave
├── MUDANCAS.md        → relatório técnico do que foi feito
├── LUNA.py            → primeira versão, de terminal (mantida como histórico)
└── README.md
```

## 👤 Autor

Desenvolvido por **Paulo Marcelli** — Estudante de ADS na **FECAP**.
