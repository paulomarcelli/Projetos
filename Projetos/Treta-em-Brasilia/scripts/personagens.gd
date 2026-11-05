class_name Personagens
## Elenco: caricaturas de paródia. A cabeça vem da foto (sprites/<foto>_cabeca.png, gerada por
## ferramentas/cabeca_pixel.py) e o corpo é desenhado em código, com a roupa de cada um.
##
## Golpes especiais (iguais para todos, com nomes, formas e efeitos diferentes):
##   projetil  ↓↘→ + Soco   ou  Especial parado
##   investida ↓↙← + Chute  ou  Frente + Especial
##   gancho    →↓↘ + Soco   ou  Cima + Especial
##   super     Baixo + Especial, com a barra cheia
## Combo: Soco, Soco, Chute (encadeados enquanto acertam) termina no golpe final do personagem.
##
## memes: frases que aparecem com o retrato (e o áudio, se existir audio/<id>/<n>.ogg/.wav/.mp3).

const LISTA := [
	{
		"id": "lula", "nome": "LULA", "titulo": "O Companheiro", "foto": "lula",
		"pele": Color("e8a07a"), "cabelo": Color("dcd6cc"), "estilo_cabelo": "grisalho", "barba": true, "oculos": false,
		"roupa": Color("23367d"), "camisa": Color("f2f2f2"), "gravata": Color("d04c86"), "calca": Color("1d2c66"),
		"extra": "faixa_roseta", "velocidade": 0.94, "forca": 1.05, "vida": 1050,
		"corpo": {"alt": 0.95, "larg": 1.12, "barriga": 0.7}, "idle": "discurso",
		"especiais": {
			"projetil": {"nome": "Bolsa Família!", "forma": "cartao"},
			"investida": {"nome": "Faz o L!", "forma": "L"},
			"gancho": {"nome": "Constituição na Mão", "forma": "", "prop": "livro"},
			"super": {"nome": "PICANHA E CERVEJINHA", "forma": "picanha"},
			"final": {"nome": "Nunca Antes Neste País!"},
		},
		"memes": ["Faz o L!", "Companheiro!", "A picanha voltou!", "Nunca antes na história deste país!", "O amor venceu!", "Taxa das blusinhas!"],
		"vitoria": "Companheiro, essa foi pro povo!",
	},
	{
		"id": "bolsonaro", "nome": "BOLSONARO", "titulo": "O Capitão", "foto": "bolsonaro",
		"pele": Color("e8a587"), "cabelo": Color("3a3a3a"), "estilo_cabelo": "repartido", "barba": false, "oculos": false,
		"roupa": Color("4b5a2a"), "camisa": Color("ffd23f"), "gravata": Color(0, 0, 0, 0), "calca": Color("3b4724"),
		"extra": "militar", "velocidade": 1.06, "forca": 1.0, "vida": 1000,
		"corpo": {"alt": 1.04, "larg": 0.94, "barriga": 0.0}, "idle": "militar",
		"especiais": {
			"projetil": {"nome": "Vai Virar Jacaré!", "forma": "seringa"},
			"investida": {"nome": "Motociata", "forma": "moto"},
			"gancho": {"nome": "Talquei?", "forma": "", "prop": ""},
			"super": {"nome": "IMBROCHÁVEL!", "forma": "seringa"},
			"final": {"nome": "E Daí?"},
		},
		"memes": ["Tá OK?", "Talquei?", "E daí?", "Imbrochável!", "Vai virar jacaré!", "Daqui pra frente é pra frente!"],
		"vitoria": "Tá OK? Tá OK!",
	},
	{
		"id": "xandao", "nome": "XANDÃO", "titulo": "O Careca da Toga", "foto": "xandao",
		"pele": Color("d39a7c"), "cabelo": Color("d39a7c"), "estilo_cabelo": "careca", "barba": false, "oculos": false,
		"roupa": Color("15151c"), "camisa": Color("f5f5f5"), "gravata": Color("2f4f9a"), "calca": Color("15151c"),
		"extra": "toga", "velocidade": 0.9, "forca": 1.0, "vida": 1000,
		"corpo": {"alt": 1.05, "larg": 1.04, "barriga": 0.0}, "idle": "imponente",
		"especiais": {
			"projetil": {"nome": "Inquérito!", "forma": "inquerito"},
			"investida": {"nome": "Conta Bloqueada", "forma": "carimbo"},
			"gancho": {"nome": "Martelo da Justiça", "forma": "", "prop": "martelo"},
			"super": {"nome": "INELEGÍVEL!", "forma": "inquerito"},
			"final": {"nome": "Prisão Preventiva!"},
		},
		"memes": ["Inquérito aberto!", "Conta bloqueada!", "Investigado!", "Multa diária!", "Está suspenso!", "Inelegível!"],
		"vitoria": "Inquérito aberto. Próximo!",
	},

	{
		"id": "trump", "nome": "TRUMP", "titulo": "O Tarifador", "foto": "trump",
		"pele": Color("e8915a"), "cabelo": Color("e8c27a"), "estilo_cabelo": "repartido", "barba": false, "oculos": false,
		"roupa": Color("1a1c26"), "camisa": Color("f5f5f5"), "gravata": Color("d62828"), "calca": Color("15171f"),
		"extra": "eua", "velocidade": 0.96, "forca": 1.06, "vida": 1060,
		"corpo": {"alt": 1.06, "larg": 1.2, "barriga": 0.35}, "idle": "sanfona",
		"especiais": {
			"projetil": {"nome": "Boné MAGA!", "forma": "bone"},
			"investida": {"nome": "Air Force One", "forma": "aviao"},
			"gancho": {"nome": "You're Fired!", "forma": "", "prop": ""},
			"super": {"nome": "TARIFAÇO 50%!", "forma": "bone"},
			"final": {"nome": "Make Brasília Great Again!"},
		},
		"memes": ["You're fired!", "Fake news!", "Tarifaço!", "Make America Great Again!", "Tremendous!", "Nobody does it better!"],
		"vitoria": "Tremendous. The best fight ever. Everybody says so.",
	},
	{
		"id": "eduarda", "nome": "EDUARDA", "titulo": "A Mais Votada", "foto": "eduarda",
		"pele": Color("efb894"), "cabelo": Color("4a3226"), "estilo_cabelo": "curto", "barba": false, "oculos": true,
		"roupa": Color("1f9d55"), "camisa": Color("ffd23f"), "gravata": Color(0, 0, 0, 0), "calca": Color("2c3e66"),
		"extra": "selecao", "velocidade": 1.12, "forca": 0.92, "vida": 950,
		"corpo": {"alt": 0.92, "larg": 0.86, "barriga": 0.0}, "idle": "celular",
		"especiais": {
			"projetil": {"nome": "Corte Viral!", "forma": "celular"},
			"investida": {"nome": "1,9 Milhão de Votos", "forma": "votos"},
			"gancho": {"nome": "Lacração Reversa", "forma": "", "prop": ""},
			"super": {"nome": "MAIS VOTADA DE SP!", "forma": "celular"},
			"final": {"nome": "Direto de Praia Grande!"},
		},
		"memes": ["Mais votada de SP!", "1,9 milhão de votos!", "Me segue lá!", "Corte viral!", "Praia Grande no mapa!"],
		"vitoria": "Postei e já viralizou. Próximo!",
	},
]

## Quem ainda vai entrar (aparece com "?" na seleção até chegar a foto).
const EM_BREVE := ["FLÁVIO", "MILEI", "PAVANATO", "JANONES"]


static func por_indice(i: int) -> Dictionary:
	return LISTA[wrapi(i, 0, LISTA.size())]


## Áudio do meme n (0, 1, 2...) do personagem: audio/<id>/<n+1>.ogg, .mp3 ou .wav.
static func audio(id: String, n: int) -> AudioStream:
	for ext in ["ogg", "mp3", "wav"]:
		var caminho := "res://audio/%s/%d.%s" % [id, n + 1, ext]
		if ResourceLoader.exists(caminho):
			return load(caminho)
	return null
