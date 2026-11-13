# Plano — jogo de plataforma sobre patins (título provisório: *Ritmo sobre Rodas*)

> Rascunho de planejamento feito com a skill `gamedev-skills` (roteador → `platformer`,
> `phaser-arcade-physics`, `game-feel`, `create-game-assets`, `level-design`, `audio-design`).

## 0. Sobre a inspiração

A ideia nasce do clima de séries juvenis sobre patinação, música e amizade, mas o jogo é **original**:
personagens, cidade, pista, músicas, nomes e logos são criados do zero. Não usamos nada de
*Soy Luna* (nomes, rostos ou figurinos dos personagens, cenários da série, músicas, logo da Disney).
A protagonista se chama **Luna**, mas é uma personagem nossa: não é Luna Valente, não tem a história,
o visual nem o figurino da série. Isso protege o projeto: dá para publicar, mostrar no portfólio e até vender sem risco de
derrubarem o jogo por direitos autorais.

## 1. Conceito

**Luna**, 16 anos, entrega encomendas de patins por **Porto Aurora**, uma cidade litorânea
inventada com ladeiras, feiras e telhados coloridos. Ela sonha competir no **Festival da Pista
Cometa**, o grande campeonato de patinação artística da cidade. A cada fase, Luna atravessa
um bairro de patins, faz manobras no ritmo da música e reúne a turma para o número final.

- **Gênero:** plataforma 2D de rolagem lateral, com movimento de patins (embalo, rampas, trilhos).
- **"Liso":** o foco é o fluxo. Quem joga bem quase nunca para: acelera nas descidas, desliza
  em corrimãos e emenda manobras.
- **Público:** de 10 anos para cima; controles simples (correr, pular, manobra).
- **Sessão:** fases de 2 a 4 minutos, com estrelas para quem quiser refazer melhor.

## 2. Movimento (o coração do jogo)

Valores iniciais da skill `platformer`, em blocos (tiles) e segundos, ajustados para patins:

| Ajuste | Valor inicial | Por quê |
|--------|---------------|---------|
| Altura do pulo completo | 3,5 blocos | Padrão confortável |
| Tempo até o topo | 0,38 s | Um pouco mais "flutuante", combina com patins |
| Gravidade na queda | 1,6 × a da subida | Queda firme sem ser pesada |
| Pulo curto (toque rápido) | 30% do completo | Controle fino |
| Tempo de "pulo atrasado" ao sair da borda | 0,1 s | Perdoa o atraso |
| Memória do botão de pulo antes de aterrissar | 0,12 s | O pulo nunca "some" |
| Aceleração no chão | **lenta (0,6 s até o máximo)** | Sensação de embalo, diferente de correr a pé |
| Desaceleração ao soltar | bem lenta (patins deslizam) | Fluxo contínuo |
| Ganho em descida / perda em subida | ± conforme a inclinação | Ladeiras viram estratégia |
| Trilhos (corrimãos, fios, bancos) | encaixe automático ao cair em cima | Manobra fácil, visual bonito |

Manobras: girar no ar (botão de manobra) dá pontos e um pouco de velocidade ao aterrissar
certinho. Errar a aterrissagem só tira o embalo, sem morte instantânea.

## 3. Fases (cenários originais, desenhados à mão)

1. **Calçadão do Farol:** tutorial ao pôr do sol, com quiosques, bancos e corrimãos da orla.
2. **Feira das Ladeiras:** barracas de frutas e toldos que servem de trampolim; ladeiras longas.
3. **Telhados da Vila Azul:** varais, caixas-d'água e antenas; fase mais vertical.
4. **Pista Cometa (treino noturno):** o rinque por dentro, com luzes, arquibancadas e rampas.
5. **Festival:** grande final em forma de fase rítmica, com manobras no compasso da música.

Cada fase segue o modelo da skill `level-design`: ensina uma ideia num lugar seguro, testa,
combina com algo já aprendido e termina com uma pequena surpresa.

## 4. Visual "feito à mão"

- **Estilo:** traço de lápis/nanquim levemente irregular e pintura em aquarela/guache com textura
  de papel. Cores quentes de fim de tarde, com o turquesa do mar como contraponto.
- **Linha viva:** o contorno dos personagens "treme" de leve (3 desenhos por pose, trocando
  8 vezes por segundo), como animação desenhada quadro a quadro.
- **Profundidade:** de 3 a 4 camadas de fundo em parallax (céu, cidade distante, casas, primeiro
  plano), cada uma mais clara e menos detalhada quanto mais longe.
- **Leitura de jogo:** tudo em que se pode pisar tem contorno mais escuro e topo claro; o
  fundo nunca compete com as plataformas.
- **Personagens:** Luna e a turma (4 amigos originais), com silhuetas bem diferentes entre si
  (cabelo, altura, figurino), legíveis em tamanho pequeno.

### Como produzir a arte (decidir)
Pela skill `create-game-assets`: primeiro trava-se um **alvo visual** (um único cenário pronto,
testado dentro do jogo) e só depois se produz o resto em "famílias" com a mesma paleta e traço.

| Caminho | Prós | Contras |
|---------|------|---------|
| A. Você (ou alguém) desenha no papel/tablet e eu monto no jogo | Arte 100% autoral, mais bonita | Mais tempo de desenho |
| B. Geração por IA (ex.: Figma, usa créditos) + limpeza | Rápido | Precisa de muito controle para manter consistência; marcar como gerado por IA |
| C. Eu desenho em código (SVG com efeito de lápis e textura de papel) | Sem custo, rápido para protótipo | Fica mais simples que uma ilustração real |

Recomendação: **C para o protótipo jogável** (formas provisórias com cara de desenho), e
**A ou B para a arte final**, partindo do alvo visual aprovado.

## 5. Tecnologia

- **Motor recomendado:** **Phaser 4** (JavaScript), no navegador. Combina com os outros projetos
  do repositório (JS, GitHub Pages) e roda no celular e no computador sem instalar nada.
  O roteador sugere Godot quando não há preferência; vale se o objetivo for lançar na Steam ou
  em console. Para portfólio e web, o Phaser é mais direto.
- **Física:** Arcade Physics com passo fixo (60 Hz) e o controlador de pulo da skill `platformer`.
- **Fases:** montadas no editor Tiled e importadas pelo Phaser.
- **Música:** trilhas originais (compostas ou com licença livre e crédito); a fase final usa as
  batidas da música para cronometrar as manobras.
- **Controles:** teclado, controle e toque na tela (botões grandes).

## 6. Etapas

1. **Protótipo do movimento (1 fase cinza):** só a Luna, rampas, trilhos e pulo. Ajustar até ficar gostoso.
2. **Alvo visual:** o Calçadão do Farol desenhado no estilo final e testado no jogo.
3. **Fatia vertical:** fase 1 completa, com arte, som, menu, estrelas e checkpoint.
4. **Produção:** fases 2 a 5, personagens da turma, cenas curtas entre fases.
5. **Polimento e publicação:** sensação de jogo (`game-feel`), acessibilidade, testes no celular,
   publicação no GitHub Pages e no itch.io.

## 7. Decisões em aberto

- [ ] Concorda com a versão original (sem personagens e cenários de *Soy Luna*)?
- [ ] Motor: Phaser (web) ou Godot (Steam/console)?
- [ ] Quem faz a arte final: desenho próprio, IA ou desenho em código?
- [x] Protagonista: **Luna** (personagem original: sem sobrenome, história, visual ou figurino da série).
- [ ] Nome do jogo (*Ritmo sobre Rodas* é provisório; não pode usar "Soy Luna" nem marcas da série).
