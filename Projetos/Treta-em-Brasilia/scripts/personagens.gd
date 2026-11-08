class_name Personagens
## Elenco: caricaturas de paródia. A cabeça vem da foto (sprites/<foto>_rosto.png, gerada por
## ferramentas/cabeca_pixel.py) e o corpo é desenhado em código, com a roupa de cada um.
##
## Habilidades (comandos iguais para todos, golpes diferentes):
##   projetil  Especial parado (ou ↓↘→ + Soco)
##   frente    Frente + Especial (ou ↓↙← + Chute)
##   cima      Cima + Especial (ou →↓↘ + Soco)
##   baixo     Baixo + Especial
##   tras      Trás + Especial
##   super     botão SUPER com meia barra (50)        · trás + SUPER força o Superpower
##   ultimate  botão SUPER com a barra cheia (100)
##
## Cada habilidade é um dado que o lutador executa (lutador.gd): tempos (início, ativo, recuperação),
## recarga, custo e o que ela faz. Partes possíveis (podem se somar):
##   corpo  golpe com o corpo ou um objeto: caixa, dano, hits, intervalo, avanço, derruba, armadura
##   salto  impulso (subida do gancho)
##   tiro   projétil: forma, dano, vel, qtd, intervalo, arco (sobe e cai), quica, volta (bumerangue), hits
##   zona   área que fica no chão: forma, dist, larg, dur, dano, efeito (lento, bloqueio, apaga)
##   chuva  coisas caindo em cima do rival: forma, qtd, intervalo, atraso, veiculo (passa no céu)
##   ao_acertar  efeito extra: "bloqueio_supremo" (rival sem especiais por 5 s)
## Danos em pontos de vida (a vida tem ~1000). Tempos em quadros (60 por segundo).



const LISTA := [
	{
		"id": "lula", "nome": "LULA", "titulo": "O Churrasqueiro", "foto": "lula",
		"bio": "Resiste muito e controla o espaço com discursos e churrasco. Lento para entrar, difícil de derrubar.",
		"pele": Color("e8a07a"), "cabelo": Color("dcd6cc"), "estilo_cabelo": "grisalho", "barba": true, "oculos": false,
		"roupa": Color("23367d"), "camisa": Color("f2f2f2"), "gravata": Color("d04c86"), "calca": Color("1d2c66"),
		"extra": "faixa_roseta", "velocidade": 0.94, "forca": 1.05, "vida": 1080,
		"corpo": {"alt": 0.95, "larg": 1.12, "barriga": 0.7}, "idle": "discurso", "cor": Color("d62828"),
		"musica": "praca",
		"habilidades": {
			"projetil": {"nome": "Discurso do Planalto", "pose": "discurso", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 70, "som": "discurso",
				"tiro": {"forma": "discurso", "dano": 70.0, "vel": 6.0, "tam": 1.5, "hits": 2, "intervalo": 14}},
			"frente": {"nome": "Picanha Gigante", "pose": "picanha_gigante", "inicio": 12, "ativo": 8, "rec": 20, "recarga": 80, "som": "whoosh_forte",
				"corpo": {"caixa": Rect2(10, -230, 150, 220), "dano": 110.0, "avanco": 5.0, "derruba": true, "armadura": 1, "empurra": 12.0}},
			"cima": {"nome": "Faz o L!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.5, -16.0), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 100.0, "derruba": true, "nivel": "alto"}, "prop": "L"},
			"baixo": {"nome": "Bolsa Família", "pose": "arremesso_baixo", "inicio": 10, "ativo": 1, "rec": 20, "recarga": 70, "som": "papel",
				"tiro": {"forma": "cartao", "dano": 60.0, "vel": 9.5, "y": -40.0, "nivel": "baixo", "tam": 0.9}},
			"tras": {"nome": "Picanha Voadora", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 22, "recarga": 80, "som": "projetil",
				"tiro": {"forma": "picanha", "dano": 75.0, "vel": 6.5, "arco": -15.0, "quica": 1, "tam": 1.1}},
			"super": {"nome": "Picanha na Brasa", "pose": "churrasco", "inicio": 18, "ativo": 40, "rec": 22, "custo": 50.0, "som": "churrasco", "voz": "super",
				"zona": {"forma": "fumaca", "dist": 150.0, "larg": 170.0, "dur": 150, "dano": 12.0, "intervalo": 18, "efeito": "apaga"},
				"tiro": {"forma": "picanha_fogo", "dano": 34.0, "vel": 8.5, "arco": -16.0, "qtd": 6, "intervalo": 6, "tam": 1.25, "ao_quebrar": "brasa"}},
			"ultimate": {"nome": "PICANHA SUPREMA", "cinema": "lula", "dano": 340.0, "hits": 6, "cura": 60.0},
			"final": {"nome": "Nunca Antes Neste País!", "prop": "livro"},
		},
		"memes": ["Faz o L!", "Companheiro!", "A picanha voltou!", "Nunca antes na história deste país!", "O amor venceu!", "Taxa das blusinhas!"],
		"vitoria": "Companheiro, essa foi pro povo!",
	},
	{
		"id": "bolsonaro", "nome": "BOLSONARO", "titulo": "O Capitão", "foto": "bolsonaro",
		"bio": "Rápido e agressivo. Entra de moto, segura o rival à distância com o fuzil de brinquedo e metralha com a Rajada do Capitão.",
		"pele": Color("e8a587"), "cabelo": Color("3a3a3a"), "estilo_cabelo": "repartido", "barba": false, "oculos": false,
		"roupa": Color("4b5a2a"), "camisa": Color("ffd23f"), "gravata": Color(0, 0, 0, 0), "calca": Color("3b4724"),
		"extra": "militar", "velocidade": 1.06, "forca": 1.0, "vida": 1000,
		"corpo": {"alt": 1.04, "larg": 0.94, "barriga": 0.0}, "idle": "militar", "cor": Color("1f9d55"),
		"musica": "paulista",
		"habilidades": {
			"projetil": {"nome": "Fuzil Cartunesco", "pose": "fuzil", "inicio": 12, "ativo": 14, "rec": 18, "recarga": 75, "som": "fuzil",
				"tiro": {"forma": "rolha", "dano": 28.0, "vel": 13.0, "qtd": 3, "intervalo": 6, "tam": 0.9, "y": -168.0}},
			"frente": {"nome": "Motociata", "pose": "moto", "inicio": 10, "ativo": 22, "rec": 16, "recarga": 90, "som": "moto",
				"corpo": {"caixa": Rect2(-10, -160, 120, 160), "dano": 95.0, "avanco": 13.0, "derruba": true, "hits": 1}},
			"cima": {"nome": "Talquei?", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.5, -16.5), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 100.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Operação Cloroquina", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 22, "recarga": 110, "som": "frasco",
				"tiro": {"forma": "frasco", "dano": 50.0, "vel": 7.0, "arco": -14.0, "tam": 1.2, "ao_quebrar": "nuvem"}},
			"tras": {"nome": "Vai Virar Jacaré!", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 22, "recarga": 70, "som": "projetil",
				"tiro": {"forma": "seringa", "dano": 70.0, "vel": 9.5}},
			"super": {"nome": "Rajada do Capitão", "pose": "metralhadora", "inicio": 14, "ativo": 54, "rec": 20, "custo": 50.0, "som": "fuzil", "voz": "super", "invencivel": 10,
				"tiro": {"forma": "rolha", "dano": 13.0, "vel": 17.0, "qtd": 16, "intervalo": 3, "tam": 1.0, "y": -150.0, "empurra": 2.0}},
			"ultimate": {"nome": "MOTOCIATA NACIONAL", "cinema": "bolsonaro", "dano": 330.0, "hits": 7},
			"final": {"nome": "E Daí?"},
		},
		"memes": ["Tá OK?", "Talquei?", "E daí?", "Imbrochável!", "Vai virar jacaré!", "Daqui pra frente é pra frente!"],
		"vitoria": "Tá OK? Tá OK!",
	},
	{
		"id": "xandao", "nome": "XANDÃO", "titulo": "O Careca da Toga", "foto": "xandao",
		"bio": "Controle total. Bloqueia contas, fecha o espaço com zonas e, com a Censura Suprema, cala o rival: sem especiais e com tarja preta.",
		"pele": Color("d39a7c"), "cabelo": Color("d39a7c"), "estilo_cabelo": "careca", "barba": false, "oculos": false,
		"roupa": Color("15151c"), "camisa": Color("f5f5f5"), "gravata": Color("2f4f9a"), "calca": Color("15151c"),
		"extra": "toga", "velocidade": 0.9, "forca": 1.0, "vida": 1020,
		"corpo": {"alt": 1.05, "larg": 1.04, "barriga": 0.0}, "idle": "imponente", "cor": Color("2f4f9a"),
		"musica": "praca",
		"habilidades": {
			"projetil": {"nome": "Inquérito!", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 22, "recarga": 65, "som": "papel",
				"tiro": {"forma": "inquerito", "dano": 75.0, "vel": 8.5}},
			"frente": {"nome": "Conta Bloqueada", "pose": "carimbo", "inicio": 10, "ativo": 16, "rec": 18, "recarga": 85, "som": "carimbo",
				"corpo": {"caixa": Rect2(0, -152, 108, 140), "dano": 95.0, "avanco": 11.0, "derruba": true}},
			"cima": {"nome": "Martelo da Justiça", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "martelo",
				"salto": Vector2(2.0, -15.5), "corpo": {"caixa": Rect2(5, -250, 90, 220), "dano": 105.0, "derruba": true, "nivel": "alto"}, "prop": "martelo"},
			"baixo": {"nome": "Canetada do STF", "pose": "canetada", "inicio": 14, "ativo": 1, "rec": 24, "recarga": 120, "som": "papel",
				"chuva": {"forma": "documento", "qtd": 1, "dano": 95.0, "atraso": 34, "tam": 2.2, "derruba": true}},
			"tras": {"nome": "Suspensão de Conta", "pose": "carimbo_chao", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 150, "som": "carimbo",
				"zona": {"forma": "suspensao", "dist": 330.0, "larg": 210.0, "dur": 240, "dano": 10.0, "intervalo": 30, "efeito": "bloqueio"}},
			"super": {"nome": "Censura Suprema", "pose": "martelada", "inicio": 18, "ativo": 1, "rec": 24, "custo": 50.0, "som": "martelo", "voz": "super",
				"chuva": {"forma": "carimbo_gigante", "qtd": 1, "dano": 120.0, "atraso": 22, "tam": 2.6, "derruba": true, "ao_acertar": "censura"}},
			"ultimate": {"nome": "DECISÃO MONOCRÁTICA", "cinema": "xandao", "dano": 320.0, "hits": 6, "ao_acertar": "censura"},
			"final": {"nome": "Prisão Preventiva!", "prop": "martelo"},
		},
		"memes": ["Inquérito aberto!", "Conta bloqueada!", "Investigado!", "Multa diária!", "Está suspenso!", "Inelegível!"],
		"vitoria": "Inquérito aberto. Próximo!",
	},
	{
		"id": "trump", "nome": "TRUMP", "titulo": "O Tarifador", "foto": "trump",
		"bio": "Pesado e imprevisível. Ataca com o cabelo, discursa no microfone, dança no meio da briga e chama a esquadrilha.",
		"pele": Color("e8915a"), "cabelo": Color("e8c27a"), "estilo_cabelo": "repartido", "barba": false, "oculos": false,
		"roupa": Color("1a1c26"), "camisa": Color("f5f5f5"), "gravata": Color("d62828"), "calca": Color("15171f"),
		"extra": "eua", "velocidade": 0.96, "forca": 1.06, "vida": 1060,
		"corpo": {"alt": 1.06, "larg": 1.2, "barriga": 0.35}, "idle": "sanfona", "cor": Color("d62828"),
		"musica": "casa_branca",
		"habilidades": {
			"projetil": {"nome": "Presidential Speech", "pose": "microfone", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 70, "som": "microfone",
				"tiro": {"forma": "onda", "dano": 72.0, "vel": 9.0, "tam": 1.3}},
			"frente": {"nome": "Hair Attack", "pose": "cabelo", "inicio": 12, "ativo": 10, "rec": 22, "recarga": 70, "som": "cabelo",
				"corpo": {"caixa": Rect2(30, -260, 250, 90), "dano": 85.0, "empurra": 14.0, "nivel": "alto"}},
			"cima": {"nome": "You're Fired!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.5, -15.5), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 105.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Make America Dance Again", "pose": "danca", "inicio": 8, "ativo": 60, "rec": 16, "recarga": 120, "som": "danca",
				"corpo": {"caixa": Rect2(-80, -220, 220, 220), "dano": 26.0, "hits": 5, "intervalo": 12, "empurra": 2.0}},
			"tras": {"nome": "Boné MAGA!", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 20, "recarga": 80, "som": "projetil",
				"tiro": {"forma": "bone", "dano": 55.0, "vel": 10.0, "volta": true, "hits": 2, "intervalo": 20}},
			"super": {"nome": "Bombardeio Presidencial", "pose": "chamar", "inicio": 16, "ativo": 1, "rec": 24, "custo": 50.0, "som": "caca", "voz": "super",
				"chuva": {"forma": "bomba", "qtd": 8, "intervalo": 6, "dano": 34.0, "atraso": 36, "tam": 1.5, "espalha": 230.0, "veiculo": "esquadrilha", "ao_quebrar": "explosao"}},
			"ultimate": {"nome": "YMCA PRESIDENTIAL SHOW", "cinema": "trump", "dano": 335.0, "hits": 8},
			"final": {"nome": "Make Brasília Great Again!"},
		},
		"memes": ["You're fired!", "Fake news!", "Tarifaço!", "Make America Great Again!", "Tremendous!", "Nobody does it better!"],
		"vitoria": "Tremendous. The best fight ever. Everybody says so.",
	},
	{
		"id": "eduarda", "nome": "EDUARDA", "titulo": "A Mais Votada", "foto": "eduarda",
		"bio": "A mais rápida do elenco. Vive de cortes virais, debate sem parar e soterra o rival em notificações.",
		"pele": Color("efb894"), "cabelo": Color("4a3226"), "estilo_cabelo": "curto", "barba": false, "oculos": true,
		"roupa": Color("ffd23f"), "camisa": Color("1f9d55"), "gravata": Color(0, 0, 0, 0), "calca": Color("2c3e66"),
		"extra": "selecao", "velocidade": 1.12, "forca": 0.99, "vida": 990,
		"corpo": {"alt": 0.92, "larg": 0.86, "barriga": 0.0}, "idle": "celular", "cor": Color("ffd23f"),
		"musica": "usp",
		"habilidades": {
			"projetil": {"nome": "Corte Viral!", "pose": "arremesso", "inicio": 10, "ativo": 1, "rec": 20, "recarga": 55, "som": "notificacao",
				"tiro": {"forma": "celular", "dano": 65.0, "vel": 10.0}},
			"frente": {"nome": "Microfone Explosivo", "pose": "microfone_avanco", "inicio": 10, "ativo": 16, "rec": 18, "recarga": 85, "som": "microfone",
				"corpo": {"caixa": Rect2(0, -170, 110, 150), "dano": 90.0, "avanco": 12.0, "derruba": true, "explode": true}},
			"cima": {"nome": "Lacração Reversa", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 22, "recarga": 45, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(3.0, -17.0), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 92.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Debate Infinito", "pose": "debate", "inicio": 8, "ativo": 48, "rec": 16, "recarga": 110, "som": "discurso",
				"corpo": {"caixa": Rect2(10, -220, 170, 200), "dano": 24.0, "hits": 6, "intervalo": 8, "empurra": 2.5}},
			"tras": {"nome": "1,9 Milhão de Votos", "pose": "votos", "inicio": 8, "ativo": 60, "rec": 14, "recarga": 140, "som": "papel",
				"zona": {"forma": "votos", "dist": 0.0, "larg": 170.0, "dur": 60, "dano": 14.0, "intervalo": 14, "efeito": "apaga", "segue": true}},
			"super": {"nome": "Polêmica nas Redes", "pose": "celular_alto", "inicio": 16, "ativo": 1, "rec": 22, "custo": 50.0, "som": "notificacao", "voz": "super",
				"chuva": {"forma": "notificacao", "qtd": 9, "intervalo": 5, "dano": 22.0, "atraso": 20, "tam": 1.1, "espalha": 140.0}},
			"ultimate": {"nome": "TRETA NACIONAL", "cinema": "eduarda", "dano": 315.0, "hits": 9},
			"final": {"nome": "Direto de Praia Grande!"},
		},
		"memes": ["Mais votada de SP!", "1,9 milhão de votos!", "Me segue lá!", "Corte viral!", "Praia Grande no mapa!"],
		"vitoria": "Postei e já viralizou. Próximo!",
	},
	{
		# deputada federal (PSOL-SP), autora da PEC pelo fim da escala 6x1 (44h -> 36h, movimento VAT)
		"id": "erika", "nome": "ERIKA", "titulo": "A Deputada da 6x1", "foto": "erika",
		"bio": "Técnica e elegante. Trava o chão com o abaixo-assinado, devolve tudo com a Representação e soterra o rival em calendários no Fim da Escala 6x1.",
		"pele": Color("b5764f"), "cabelo": Color("d9a85a"), "estilo_cabelo": "longo", "barba": false, "oculos": false,
		"roupa": Color("1a171f"), "camisa": Color("1a171f"), "gravata": Color(0, 0, 0, 0), "calca": Color("b5764f"),
		"extra": "blazer_vestido", "velocidade": 1.08, "forca": 0.98, "vida": 990,
		"corpo": {"alt": 1.02, "larg": 0.84, "barriga": 0.0}, "idle": "cabelo", "cor": Color("e5243b"),
		"musica": "praca",
		"habilidades": {
			"projetil": {"nome": "PEC 6x1", "pose": "protocolar", "inicio": 12, "ativo": 1, "rec": 20, "recarga": 65, "som": "papel",
				"tiro": {"forma": "pec", "dano": 68.0, "vel": 8.5, "tam": 1.15, "hits": 2, "intervalo": 12}},
			"frente": {"nome": "Vida Além do Trabalho", "pose": "giro_bolsa", "inicio": 9, "ativo": 18, "rec": 18, "recarga": 80, "som": "whoosh_forte",
				"corpo": {"caixa": Rect2(-20, -200, 150, 190), "dano": 46.0, "avanco": 11.0, "hits": 2, "intervalo": 9, "derruba": true}},
			"cima": {"nome": "Não Me Calarão!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 22, "recarga": 48, "invencivel": 9, "som": "microfone",
				"salto": Vector2(2.8, -16.5), "corpo": {"caixa": Rect2(5, -238, 76, 208), "dano": 96.0, "derruba": true, "nivel": "alto"}, "prop": "microfone"},
			"baixo": {"nome": "Abaixo-Assinado", "pose": "assinar", "inicio": 12, "ativo": 1, "rec": 20, "recarga": 140, "som": "papel",
				"zona": {"forma": "assinaturas", "dist": 230.0, "larg": 330.0, "dur": 200, "dano": 9.0, "intervalo": 24, "efeito": "lento"}},
			"tras": {"nome": "Representação!", "pose": "arremesso", "inicio": 11, "ativo": 1, "rec": 20, "recarga": 80, "som": "projetil",
				"tiro": {"forma": "oficio", "dano": 52.0, "vel": 10.0, "volta": true, "hits": 2, "intervalo": 20}},
			"super": {"nome": "Fim da Escala 6x1", "pose": "chamar", "inicio": 16, "ativo": 1, "rec": 22, "custo": 50.0, "som": "papel", "voz": "super",
				"chuva": {"forma": "calendario", "qtd": 7, "intervalo": 7, "dano": 32.0, "atraso": 30, "tam": 1.5, "espalha": 190.0, "ao_quebrar": "papelada"}},
			"ultimate": {"nome": "PEC APROVADA", "cinema": "erika", "dano": 325.0, "hits": 8},
			"final": {"nome": "Vida Além do Trabalho!"},
		},
		"memes": ["Fim da escala 6x1!", "Vida além do trabalho!", "Não me calarão!", "36 horas semanais!", "Assina a PEC!", "Vou representar!"],
		"vitoria": "Mais uma vitória pra classe trabalhadora!",
	},
	{
		# vereador mais votado da história de SP (2024) e deputado federal com ~3 milhões de votos (PL-SP);
		# ficou conhecido pelos vídeos abordando estudantes na USP e pela Frente Parlamentar Antiwoke
		"id": "pavanato", "nome": "PAVANATO", "titulo": "O Mais Votado", "foto": "pavanato",
		"bio": "Influencer de microfone na mão. Chega de surpresa, grava tudo, ergue a Frente Antiwoke contra projéteis e soterra o rival em 3 milhões de votos.",
		"pele": Color("e8a882"), "cabelo": Color("6a4026"), "estilo_cabelo": "curto", "barba": false, "oculos": false,
		"roupa": Color("1d2a4e"), "camisa": Color("15131a"), "gravata": Color(0, 0, 0, 0), "calca": Color("2c3a5c"),
		"extra": "antiwoke", "velocidade": 1.1, "forca": 0.97, "vida": 980,
		"corpo": {"alt": 1.04, "larg": 0.9, "barriga": 0.0}, "idle": "selfie", "cor": Color("1f6fd1"),
		"musica": "usp",
		"habilidades": {
			"projetil": {"nome": "Tá Gravando?", "pose": "filmar", "inicio": 11, "ativo": 1, "rec": 20, "recarga": 60, "som": "notificacao",
				"tiro": {"forma": "rec", "dano": 64.0, "vel": 10.5, "tam": 1.1}},
			"frente": {"nome": "Visita Surpresa na USP", "pose": "microfone_avanco", "inicio": 9, "ativo": 18, "rec": 18, "recarga": 85, "som": "microfone",
				"corpo": {"caixa": Rect2(0, -175, 115, 155), "dano": 48.0, "avanco": 12.5, "hits": 2, "intervalo": 9, "derruba": true}},
			"cima": {"nome": "Mais Votado da História!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 22, "recarga": 46, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(3.0, -17.0), "corpo": {"caixa": Rect2(5, -238, 74, 208), "dano": 94.0, "derruba": true, "nivel": "alto"}, "prop": "joinha"},
			"baixo": {"nome": "Frente Antiwoke", "pose": "carimbo_chao", "inicio": 12, "ativo": 1, "rec": 20, "recarga": 150, "som": "carimbo",
				"zona": {"forma": "antiwoke", "dist": 115.0, "larg": 130.0, "dur": 170, "dano": 10.0, "intervalo": 28, "efeito": "apaga"}},
			"tras": {"nome": "Treta no Aeroporto", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 22, "recarga": 85, "som": "projetil",
				"tiro": {"forma": "mala", "dano": 72.0, "vel": 7.0, "arco": -14.0, "quica": 1, "tam": 1.15}},
			"super": {"nome": "3 Milhões de Votos", "pose": "votos", "inicio": 14, "ativo": 1, "rec": 22, "custo": 50.0, "som": "papel", "voz": "super",
				"chuva": {"forma": "voto", "qtd": 10, "intervalo": 5, "dano": 21.0, "atraso": 24, "tam": 1.25, "espalha": 210.0}},
			"ultimate": {"nome": "PRESIDENTE?!", "cinema": "pavanato", "dano": 320.0, "hits": 8},
			"final": {"nome": "Corta Pro Insta!", "prop": "celular"},
		},
		"memes": ["Tá gravando?", "Mais votado da história!", "3 milhões de votos!", "Frente Antiwoke!", "Corta pro Insta!", "Vem debater!"],
		"vitoria": "Corta essa parte e posta!",
	},
	{
		# deputado federal mais votado do Brasil em 2022 (PL-MG); o vídeo sobre o Pix passou de 300 milhões
		# de views e o governo revogou a medida; em 2026 caminhou ~240 km de Paracatu até Brasília
		"id": "nikolas", "nome": "NIKOLAS", "titulo": "O Viral do Pix", "foto": "nikolas",
		"bio": "Rei do viral. Viraliza o Pix na cara do rival, marcha 240 km sem parar de bater e faz a canetada do governo cair na cabeça de quem estiver embaixo.",
		"pele": Color("e3a57e"), "cabelo": Color("2e1f18"), "estilo_cabelo": "curto", "barba": false, "oculos": false,
		"roupa": Color("1b2440"), "camisa": Color("f2f2f2"), "gravata": Color("1e3a8a"), "calca": Color("1b2440"),
		"extra": "", "velocidade": 1.06, "forca": 1.05, "vida": 1050,
		"corpo": {"alt": 1.0, "larg": 0.92, "barriga": 0.0}, "idle": "dedo", "cor": Color("00a3ff"),
		"musica": "paulista",
		"habilidades": {
			"projetil": {"nome": "O Vídeo do Pix", "pose": "arremesso", "inicio": 11, "ativo": 1, "rec": 18, "recarga": 55, "som": "notificacao",
				"tiro": {"forma": "pix", "dano": 74.0, "vel": 9.5, "tam": 1.2, "hits": 2, "intervalo": 12}},
			"frente": {"nome": "Caminhada até Brasília", "pose": "caminhada", "inicio": 8, "ativo": 40, "rec": 14, "recarga": 90, "som": "whoosh_forte",
				"corpo": {"caixa": Rect2(-10, -220, 130, 210), "dano": 30.0, "avanco": 6.5, "hits": 4, "intervalo": 10, "armadura": 1, "empurra": 4.0}},
			"cima": {"nome": "Mais Votado do Brasil!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.6, -16.5), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 100.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Revoga!", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 24, "recarga": 125, "som": "carimbo",
				"chuva": {"forma": "revogado", "qtd": 1, "dano": 92.0, "atraso": 32, "tam": 2.0, "derruba": true}},
			"tras": {"nome": "Story de 1 Minuto", "pose": "arremesso", "inicio": 10, "ativo": 18, "rec": 18, "recarga": 80, "som": "notificacao",
				"tiro": {"forma": "curtida", "dano": 26.0, "vel": 8.0, "arco": -11.0, "qtd": 3, "intervalo": 7, "tam": 1.0}},
			"super": {"nome": "300 Milhões de Views", "pose": "celular_alto", "inicio": 14, "ativo": 1, "rec": 22, "custo": 50.0, "som": "notificacao", "voz": "super",
				"chuva": {"forma": "play", "qtd": 10, "intervalo": 5, "dano": 21.0, "atraso": 22, "tam": 1.3, "espalha": 210.0}},
			"ultimate": {"nome": "CAMINHADA!", "cinema": "nikolas", "dano": 330.0, "hits": 8},
			"final": {"nome": "Chegamos a Brasília!", "prop": "bandeira"},
		},
		"memes": ["O Pix é do povo!", "Mais votado do Brasil!", "240 km a pé!", "Viralizou!", "Revoga!", "Chegamos a Brasília!"],
		"vitoria": "Postei, viralizou e revogaram!",
	},
	{
		"id": "flavio", "nome": "FLÁVIO", "titulo": "O Zero Um", "foto": "flavio",
		"bio": "O filho 01. Joga bombom da lojinha, racha o golpe com quem estiver perto, ergue a mansão no meio da arena e, quando aperta, escreve mais uma versão da carta e sai escondido.",
		"pele": Color("dfa585"), "cabelo": Color("2b211c"), "estilo_cabelo": "curto", "barba": false, "oculos": false,
		"roupa": Color("1f2a44"), "camisa": Color("f4f4f4"), "gravata": Color("1c2438"), "calca": Color("1f2a44"),
		"extra": "faixa", "velocidade": 1.02, "forca": 1.04, "vida": 1040,
		"corpo": {"alt": 1.03, "larg": 0.96, "barriga": 0.1}, "idle": "acenar", "cor": Color("c9a227"),
		"musica": "casa_branca",
		"habilidades": {
			"projetil": {"nome": "Bombom Lavado", "pose": "arremesso", "inicio": 11, "ativo": 1, "rec": 18, "recarga": 55, "som": "whoosh",
				"tiro": {"forma": "bombom", "dano": 70.0, "vel": 9.0, "tam": 1.2}},
			"frente": {"nome": "Rachadinha!", "pose": "rachadinha", "inicio": 9, "ativo": 16, "rec": 16, "recarga": 85, "som": "whoosh_forte",
				"corpo": {"caixa": Rect2(0, -210, 140, 190), "dano": 46.0, "avanco": 9.0, "hits": 2, "intervalo": 8, "empurra": 5.0}},
			"cima": {"nome": "Cadê o Queiroz?", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.4, -16.0), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 100.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Mansão de R$ 6 Mi", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 140, "som": "carimbo",
				"zona": {"forma": "mansao", "dist": 210.0, "larg": 250.0, "dur": 200, "dano": 10.0, "intervalo": 24, "efeito": "lento"}},
			"tras": {"nome": "Carta (Versão 3)", "pose": "arremesso", "inicio": 10, "ativo": 18, "rec": 18, "recarga": 80, "som": "papel",
				"tiro": {"forma": "carta", "dano": 27.0, "vel": 8.0, "arco": -10.0, "qtd": 3, "intervalo": 8, "tam": 1.1}},
			"super": {"nome": "TariFlávio", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 22, "custo": 50.0, "som": "carimbo", "voz": "super",
				"chuva": {"forma": "tarifa", "qtd": 9, "intervalo": 5, "dano": 23.0, "atraso": 22, "tam": 1.3, "espalha": 210.0}},
			"ultimate": {"nome": "SAIU ESCONDIDO!", "cinema": "flavio", "dano": 330.0, "hits": 8},
			"final": {"nome": "Verdadeiro Presidente... digo, Líder!", "prop": "carta"},
		},
		"memes": ["Foi por muito pouco!", "Cadê o Queiroz?", "É só chocolate!", "TariFlávio!", "Sou o líder do Brasil!", "Versão 3 da carta!"],
		"vitoria": "Escrevi a carta de novo: dessa vez eu venci!",
	},
	{
		"id": "renan", "nome": "RENAN", "titulo": "O Nem-Nem", "foto": "renan",
		"bio": "Fundador do MBL e candidato do Missão. Corta o rival em pedacinhos de live, grita no megafone desde 2015, prende geral no superpresídio e manda o povo digitar 14 e CONFIRMA.",
		"pele": Color("e0aa88"), "cabelo": Color("1a1414"), "estilo_cabelo": "curto", "barba": true, "oculos": false,
		"roupa": Color("1b2236"), "camisa": Color("f4f4f4"), "gravata": Color("1d2a4d"), "calca": Color("1b2236"),
		"extra": "", "velocidade": 1.03, "forca": 0.98, "vida": 970,
		"corpo": {"alt": 0.98, "larg": 0.9, "barriga": 0.0}, "idle": "megafone", "cor": Color("ff7a00"),
		"musica": "paulista",
		"habilidades": {
			"projetil": {"nome": "Corte da Live", "pose": "arremesso", "inicio": 10, "ativo": 1, "rec": 17, "recarga": 60, "som": "whoosh",
				"tiro": {"forma": "tesoura", "dano": 60.0, "vel": 10.0, "tam": 1.2}},
			"frente": {"nome": "Megafone do Impeachment", "pose": "megafone", "inicio": 10, "ativo": 30, "rec": 20, "recarga": 105, "som": "microfone",
				"corpo": {"caixa": Rect2(20, -230, 150, 210), "dano": 12.0, "avanco": 2.0, "hits": 4, "intervalo": 7, "empurra": 6.0}},
			"cima": {"nome": "Vota 14!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.6, -16.5), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 100.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Superpresídio", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 135, "som": "martelo",
				"zona": {"forma": "cela", "dist": 230.0, "larg": 170.0, "dur": 170, "dano": 10.0, "intervalo": 22, "efeito": "lento"}},
			"tras": {"nome": "LIVE EMERGENCIAL", "pose": "arremesso", "inicio": 10, "ativo": 18, "rec": 18, "recarga": 80, "som": "notificacao",
				"tiro": {"forma": "aovivo", "dano": 26.0, "vel": 8.5, "arco": -10.0, "qtd": 3, "intervalo": 7, "tam": 1.0}},
			"super": {"nome": "Chuva de Cortes", "pose": "celular_alto", "inicio": 14, "ativo": 1, "rec": 22, "custo": 50.0, "som": "notificacao", "voz": "super",
				"chuva": {"forma": "corte", "qtd": 10, "intervalo": 5, "dano": 21.0, "atraso": 22, "tam": 1.3, "espalha": 210.0}},
			"ultimate": {"nome": "CONFIRMA!", "cinema": "renan", "dano": 330.0, "hits": 8},
			"final": {"nome": "Nem Lula, nem Flávio!", "prop": "megafone"},
		},
		"memes": ["Nem Lula, nem Flávio!", "Não somos terceira via!", "LIVE EMERGENCIAL!", "Superpresídio neles!", "Vota 14!", "Corta essa!"],
		"vitoria": "Nem Lula, nem Flávio: deu Missão!",
	},
	{
		"id": "dilma", "nome": "DILMA", "titulo": "A Mãe do PAC", "foto": "dilma",
		"bio": "Presidenta duas vezes e hoje à frente do Banco dos BRICS. Estoca vento num pote, chega de bicicleta pedalando, faz brotar mandioca do chão e, se a meta não bater, dobra a meta.",
		"pele": Color("e8b08c"), "cabelo": Color("6b3f22"), "estilo_cabelo": "curto", "barba": false, "oculos": false,
		"roupa": Color("e9e1d6"), "camisa": Color("f6f1ea"), "gravata": Color(0, 0, 0, 0), "calca": Color("d9cfc2"),
		"extra": "faixa", "velocidade": 0.98, "forca": 1.04, "vida": 1060,
		"corpo": {"alt": 0.94, "larg": 1.0, "barriga": 0.15}, "idle": "gesticula", "cor": Color("d94f70"),
		"musica": "praca",
		"habilidades": {
			"projetil": {"nome": "Estocar Vento", "pose": "arremesso", "inicio": 12, "ativo": 1, "rec": 18, "recarga": 58, "som": "whoosh",
				"tiro": {"forma": "vento", "dano": 68.0, "vel": 8.5, "tam": 1.25}},
			"frente": {"nome": "Pedalada Fiscal", "pose": "pedalada", "inicio": 8, "ativo": 36, "rec": 16, "recarga": 95, "som": "whoosh_forte",
				"corpo": {"caixa": Rect2(-20, -200, 150, 200), "dano": 22.0, "avanco": 7.0, "hits": 4, "intervalo": 8, "empurra": 5.0}},
			"cima": {"nome": "Mulher Sapiens!", "pose": "gancho", "inicio": 3, "ativo": 12, "rec": 24, "recarga": 50, "invencivel": 9, "som": "whoosh_forte",
				"salto": Vector2(2.2, -16.0), "corpo": {"caixa": Rect2(5, -235, 72, 205), "dano": 102.0, "derruba": true, "nivel": "alto"}},
			"baixo": {"nome": "Saudação à Mandioca", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 22, "recarga": 135, "som": "carimbo",
				"zona": {"forma": "mandioca", "dist": 220.0, "larg": 220.0, "dur": 180, "dano": 11.0, "intervalo": 22, "efeito": "lento"}},
			"tras": {"nome": "Tchau, Querida!", "pose": "arremesso", "inicio": 10, "ativo": 14, "rec": 18, "recarga": 78, "som": "notificacao",
				"tiro": {"forma": "telefone", "dano": 34.0, "vel": 8.5, "arco": -11.0, "qtd": 2, "intervalo": 10, "tam": 1.1}},
			"super": {"nome": "Dobraremos a Meta", "pose": "chamar", "inicio": 14, "ativo": 1, "rec": 22, "custo": 50.0, "som": "carimbo", "voz": "super",
				"chuva": {"forma": "meta", "qtd": 8, "intervalo": 6, "dano": 25.0, "atraso": 22, "tam": 1.3, "espalha": 210.0}},
			"ultimate": {"nome": "ESTOCANDO VENTO!", "cinema": "dilma", "dano": 330.0, "hits": 8},
			"final": {"nome": "Dobraremos a meta!", "prop": "mandioca"},
		},
		"memes": ["Estocar vento!", "Saúdo a mandioca!", "Mulher sapiens!", "Dobraremos a meta!", "Tchau, querida!", "Pátria educadora!"],
		"vitoria": "Não acho que quem ganhar ou quem perder vai ganhar ou perder. Vai todo mundo perder!",
	},
]

## Quem ainda vai entrar (aparece com "?" na seleção até chegar a foto).
const EM_BREVE := ["MILEI", "JANONES"]

## Ordem e rótulo dos comandos, para a tela de lutadores e o "como jogar".
const COMANDOS := [
	["projetil", "ESPECIAL"],
	["frente", "FRENTE + ESPECIAL"],
	["cima", "CIMA + ESPECIAL"],
	["baixo", "BAIXO + ESPECIAL"],
	["tras", "TRÁS + ESPECIAL"],
	["super", "SUPER (1/2 barra)"],
	["ultimate", "SUPER (barra cheia)"],
]


static func por_indice(i: int) -> Dictionary:
	return LISTA[wrapi(i, 0, LISTA.size())]


static func indice_de(id: String) -> int:
	for i in LISTA.size():
		if LISTA[i]["id"] == id:
			return i
	return 0


## Áudio do meme n (0, 1, 2...) do personagem, se alguém colocar arquivos em audio/<id>/<n+1>.ogg.
static func audio(id: String, n: int) -> AudioStream:
	for ext in ["ogg", "mp3", "wav"]:
		var caminho := "res://audio/%s/%d.%s" % [id, n + 1, ext]
		if ResourceLoader.exists(caminho):
			return load(caminho)
	return null
