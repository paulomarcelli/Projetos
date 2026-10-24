# Roteiro do vídeo — Luna AI

Vídeo de apresentação técnica, 2:55, 1920 × 1080, 30 fps. Gerado a partir de `roteiro.json`: para mudar um texto ou um tempo, edite o JSON e renderize de novo.

**Narração:** as falas abaixo são o roteiro da narração e aparecem como legendas no vídeo. Ainda não há voz gravada (veja o LEIA-ME para adicionar).

**Fiel ao código:** tudo o que o vídeo mostra existe no projeto. Duas exceções estão marcadas na própria tela: a conversa de exemplo usa a resposta-modelo das instruções (não uma resposta gerada pelo Gemini), e a conversa em tempo real aparece como visão futura.

## Abertura · 0:00.00–0:12.00

**Na tela:** Céu noturno da identidade da Luna. Partículas se conectam, linhas de onda sugerem fala, a logo surge com brilho e uma faísca no cristal da coroa. O nome LUNA AI aparece letra a letra.

**Narração:**

- `0:02.60` Esta é a Luna, um projeto pessoal de IA aplicada ao apoio emocional.
- `0:07.87` Vamos ver o que ela faz e como funciona por dentro.

## Propósito · 0:12.00–0:28.00

**Na tela:** Capturas reais da interface no computador e no celular. A conversa mostrada usa a resposta-modelo das instruções da Luna e está marcada como exemplo na tela. Cartão de limite: não substitui profissionais.

**Narração:**

- `0:12.60` A Luna é uma aplicação web de conversa, por texto ou por voz.
- `0:16.98` Ela ajuda a organizar pensamentos e a olhar situações difíceis de outros ângulos.
- `0:22.69` Ela não substitui psicólogos, diagnóstico nem atendimento de emergência.

## Arquitetura · 0:28.00–1:00.00

**Na tela:** Cinco camadas reais surgem uma a uma (Interface, Servidor, Segurança, Motor da Luna, Serviços externos), com os arquivos de cada uma. Trilho da ida à esquerda e da volta à direita, com legenda do que trafega em cada trecho. Selo: sem banco de dados.

**Narração:**

- `0:28.60` A arquitetura tem cinco partes, cada uma com uma responsabilidade clara.
- `0:33.48` No navegador fica a interface: HTML, CSS e JavaScript, sem framework.
- `0:38.17` Um servidor em Python com Flask recebe e valida as mensagens, sem guardar conversas.
- `0:43.82` Uma camada de segurança, escrita em código, avalia o risco antes de chamar a IA.
- `0:49.21` O motor da Luna monta instruções e contexto e faz uma chamada ao Google Gemini.
- `0:54.54` Não há banco de dados: histórico e memória são opcionais e ficam no navegador.

## Uma mensagem · 1:00.00–1:25.00

**Na tela:** A mensagem de exemplo percorre 7 etapas reais. Um painel mostra o que trafega em cada uma: o JSON enviado ao /chat, o resultado de seguranca.avaliar(), o formato da resposta do Gemini (conteúdo ilustrativo) e as checagens de verificar_resposta().

**Narração:**

- `1:00.60` Veja o caminho de uma mensagem pela aplicação.
- `1:03.95` A interface envia o texto junto com as últimas mensagens, como contexto.
- `1:09.03` O servidor valida o pedido, e a segurança classifica o risco. Aqui: nenhum.
- `1:14.31` O Gemini recebe instruções e contexto e devolve uma resposta estruturada.
- `1:19.46` Uma última verificação em código acontece antes de a resposta chegar à tela.

## Instruções · 1:25.00–1:50.00

**Na tela:** Trecho resumido das instruções de luna.py. Comparação entre a interpretação inicial e a perspectiva alternativa, com fato e interpretação destacados. Selo: comportamento desejado, não garantia de acerto.

**Narração:**

- `1:25.60` O comportamento da Luna nasce de instruções escritas com cuidado.
- `1:29.95` Acolher sem julgar, separar fatos de interpretações, reconhecer limites.
- `1:34.74` Diante de “ela não gosta mais de mim”, o objetivo não é negar o sentimento.
- `1:39.72` É separar o que se sabe do que se imagina: a demora é fato; o motivo, não.
- `1:44.64` Esse é o comportamento desejado. O modelo pode errar, por isso existem testes.

## Voz e memória · 1:50.00–2:15.00

**Na tela:** Ciclo da voz (microfone → reconhecimento de fala → Luna → síntese de voz) com indicador de estado e captura real do painel de voz. Depois, o fluxo da memória com consentimento. Por fim, o que existe hoje e a visão futura (conversa em tempo real), marcada como não implementada.

**Narração:**

- `1:50.60` Na voz, o navegador transforma a fala em texto e lê a resposta em voz alta.
- `1:56.57` Dá para pausar, interromper ou encerrar. O microfone desliga enquanto ela fala.
- `2:02.85` A memória é opcional: a Luna sugere, e só guarda o que a pessoa confirma.
- `2:08.67` Não há agentes nem ferramentas. Conversa em tempo real é uma evolução futura.

## Segurança · 2:15.00–2:35.00

**Na tela:** Fluxo da camada de segurança: avaliação em código, quatro níveis e a resposta de cada um, verificação da resposta e encaminhamento humano (marcado como fora do sistema). Captura real do cartão de contatos no celular.

**Narração:**

- `2:15.60` No apoio emocional, a segurança não pode depender só do modelo.
- `2:19.74` Regras em código classificam o risco em quatro níveis, antes e depois da IA.
- `2:24.68` Em risco imediato, a primeira resposta é um texto revisado, que não depende da IA.
- `2:29.98` E os contatos de ajuda aparecem na tela: CVV 188 e SAMU 192, entre outros.

## Encerramento · 2:35.00–2:55.00

**Na tela:** As cinco partes giram em anel em volta da logo, com os números verificados (45 testes, 12 cenários). Título final e transição para o preto.

**Narração:**

- `2:35.60` Interface, servidor, segurança, motor e modelo: cada parte faz pouco, e bem.
- `2:41.39` São 45 testes automáticos. Avaliar as respostas reais é o próximo passo.

## Texto final

**LUNA AI** · IA, engenharia de software e apoio emocional em um único projeto.

Crédito: Paulo Marcelli · Projeto pessoal · Trilha original gerada por código
