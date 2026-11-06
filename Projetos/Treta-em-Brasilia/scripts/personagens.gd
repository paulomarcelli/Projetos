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
			"super": {"nome": "Churrasco Presidencial", "pose": "churrasco", "inicio": 18, "ativo": 30, "rec": 24, "custo": 50.0, "som": "churrasco", "voz": "super",
				"zona": {"forma": "fumaca", "dist": 150.0, "larg": 190.0, "dur": 170, "dano": 18.0, "intervalo": 16, "efeito": "apaga"},
				"tiro": {"forma": "comida", "dano": 40.0, "vel": 7.5, "arco": -17.0, "qtd": 5, "intervalo": 6, "tam": 1.0}},
			"ultimate": {"nome": "PICANHA SUPREMA", "cinema": "lula", "dano": 340.0, "hits": 6, "cura": 60.0},
			"final": {"nome": "Nunca Antes Neste País!", "prop": "livro"},
		},
		"memes": ["Faz o L!", "Companheiro!", "A picanha voltou!", "Nunca antes na história deste país!", "O amor venceu!", "Taxa das blusinhas!"],
		"vitoria": "Companheiro, essa foi pro povo!",
	},
	{
		"id": "bolsonaro", "nome": "BOLSONARO", "titulo": "O Capitão", "foto": "bolsonaro",
		"bio": "Rápido e agressivo. Entra de moto, segura o rival à distância com o fuzil de brinquedo e fecha com sequências militares.",
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
			"super": {"nome": "Capitão do Caos", "pose": "capitao", "inicio": 14, "ativo": 48, "rec": 22, "custo": 50.0, "som": "whoosh_forte", "voz": "super", "invencivel": 14,
				"corpo": {"caixa": Rect2(0, -200, 120, 200), "dano": 42.0, "hits": 6, "intervalo": 8, "avanco": 5.0, "derruba": true, "empurra": 3.0}},
			"ultimate": {"nome": "OPERAÇÃO PRESIDENCIAL", "cinema": "bolsonaro", "dano": 330.0, "hits": 7},
			"final": {"nome": "E Daí?"},
		},
		"memes": ["Tá OK?", "Talquei?", "E daí?", "Imbrochável!", "Vai virar jacaré!", "Daqui pra frente é pra frente!"],
		"vitoria": "Tá OK? Tá OK!",
	},
	{
		"id": "xandao", "nome": "XANDÃO", "titulo": "O Careca da Toga", "foto": "xandao",
		"bio": "Controle total. Bloqueia contas, fecha o espaço com zonas e, com a Canetada, deixa o rival sem especiais.",
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
			"super": {"nome": "Bloqueio Supremo", "pose": "martelada", "inicio": 18, "ativo": 1, "rec": 24, "custo": 50.0, "som": "martelo", "voz": "super",
				"tiro": {"forma": "selo", "dano": 120.0, "vel": 12.0, "tam": 2.0, "atravessa": true, "derruba": true, "ao_acertar": "bloqueio_supremo"}},
			"ultimate": {"nome": "DECISÃO MONOCRÁTICA", "cinema": "xandao", "dano": 320.0, "hits": 6, "ao_acertar": "bloqueio_supremo"},
			"final": {"nome": "Prisão Preventiva!", "prop": "martelo"},
		},
		"memes": ["Inquérito aberto!", "Conta bloqueada!", "Investigado!", "Multa diária!", "Está suspenso!", "Inelegível!"],
		"vitoria": "Inquérito aberto. Próximo!",
	},
	{
		"id": "trump", "nome": "TRUMP", "titulo": "O Tarifador", "foto": "trump",
		"bio": "Pesado e imprevisível. Ataca com o cabelo, discursa no microfone, dança no meio da briga e chama o caça.",
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
			"super": {"nome": "Caça Presidencial", "pose": "chamar", "inicio": 16, "ativo": 1, "rec": 24, "custo": 50.0, "som": "caca", "voz": "super",
				"chuva": {"forma": "bomba", "qtd": 3, "intervalo": 12, "dano": 60.0, "atraso": 40, "tam": 1.3, "espalha": 90.0, "veiculo": "caca", "derruba": true}},
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
]

## Quem ainda vai entrar (aparece com "?" na seleção até chegar a foto).
const EM_BREVE := ["FLÁVIO", "MILEI", "PAVANATO", "JANONES"]

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
