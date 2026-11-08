extends SceneTree
## Trailer parte 2 (1 min), com imagem e som do próprio jogo, pelo Movie Maker do Godot:
##   xvfb-run godot --path . --rendering-driver opengl3 --resolution 1440x810 \
##       --write-movie /caminho/q.png --script res://tests/trailer2.gd
## Depois: python3 ferramentas/trailer.py <pasta> docs/divulgacao/trailer2.mp4 2
##
## Cenas (60 quadros por segundo): capa com o Zé Gotinha · escolha de lutadores passando pelos 11 ·
## VS Nikolas x Flávio · luta com os memes deles · Censura Suprema do Xandão · a USP gritando
## "RECUA!" · Ultimates da Dilma, do Bolsonaro, do Flávio e do Trump com as músicas · o Dilera com o Renan ·
## online com código de sala · créditos.
const LULA := 0
const BOLSONARO := 1
const XANDAO := 2
const TRUMP := 3
const EDUARDA := 4
const ERIKA := 5
const PAVANATO := 6
const NIKOLAS := 7
const FLAVIO := 8
const RENAN := 9
const DILMA := 10

var raiz: Node2D
var quadro := 0
var cena := -1
var luta: Luta
var tela: Node
var cenas: Array = []


func _initialize() -> void:
	Config.musica = 0.55
	Config.efeitos = 0.9
	Config.desempenho = 2
	Config.aplicar_desempenho()
	Som.iniciar(root)
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	cenas = [
		[150, _capa],                                                 # 0–2,5 s
		[300, _selecao],                                              # 2,5–7,5 s
		[180, _versus],                                               # 7,5–10,5 s
		[300, func(): _nova_luta("paulista", NIKOLAS, FLAVIO)],       # 10,5–15,5 s
		[300, func(): _nova_luta("usp", XANDAO, EDUARDA, 0.0)],       # 15,5–20,5 s
		[360, func(): _nova_luta("usp", ERIKA, PAVANATO)],            # 20,5–26,5 s
		[330, func(): _nova_luta("praca", DILMA, RENAN, 0.0)],        # 26,5–32 s
		[330, func(): _nova_luta("paulista", BOLSONARO, LULA, 0.0)],  # 32–37,5 s
		[330, func(): _nova_luta("praca", FLAVIO, XANDAO, 0.0)],      # 37,5–43 s
		[330, func(): _nova_luta("casa_branca", TRUMP, LULA, 0.0)],   # 43–48,5 s
		[210, func(): _nova_luta("paulista", RENAN, LULA)],           # 48,5–52 s
		[180, _online],                                               # 52–55 s
		[210, _creditos],                                             # 55–58,5 s
	]
	_proxima.call_deferred()


func _limpar() -> void:
	for c in raiz.get_children():
		c.queue_free()
	luta = null
	tela = null


func _proxima() -> void:
	_limpar()
	cena += 1
	quadro = 0
	if cena >= cenas.size():
		quit()
		return
	cenas[cena][1].call()


## Luta CPU x CPU já no meio do round, os dois perto um do outro, sem rádio nem Dilera automáticos.
func _nova_luta(cenario: String, a: int, b: int, nivel := 0.75) -> void:
	var l := Luta.new()
	l.cenario = cenario
	l.nivel_cpu = nivel
	l.configurar(Personagens.por_indice(a), Personagens.por_indice(b), false, true)
	raiz.add_child(l)
	for i in 200:
		if l.fase == "luta":
			break
		l._tick()
	l.msg_t = 0
	l.p[0].position.x = 540.0
	l.p[1].position.x = 760.0
	l._radio_em = 99999.0
	l._recua_tocou = true
	l._dilera = 999
	luta = l
	Som.musica(cenario)


# ---------------------------------------------------------------- telas

func _capa() -> void:
	var t := Telas.Titulo.new()
	t.dupla = [NIKOLAS, FLAVIO]
	raiz.add_child(t)
	Som.musica("menu")


func _selecao() -> void:
	var s := Telas.Selecao.new()
	s.modo = 1
	s.cursor = [0, BOLSONARO]
	raiz.add_child(s)
	tela = s
	Som.musica("selecao")


func _versus() -> void:
	var v := Telas.Versus.new()
	v.a = Personagens.por_indice(NIKOLAS)
	v.b = Personagens.por_indice(FLAVIO)
	v.cenario = "paulista"
	v.rotulo = "NIKOLAS x FLÁVIO"
	raiz.add_child(v)


func _online() -> void:
	var o := Telas.Online.new()
	raiz.add_child(o)
	o.atualizar("aguardando", "", "KMBT")
	Som.musica("menu")


func _creditos() -> void:
	Som.trilha_parar(1.0)
	raiz.add_child(Telas.Creditos.new())


# ---------------------------------------------------------------- roteiro quadro a quadro

func _process(_d: float) -> bool:
	if cena < 0 or cena >= cenas.size():
		return false
	quadro += 1
	match cena:
		0:
			if quadro == 30:
				Som.meme("res://audio/memes/lula/ze_gotinha.ogg")
		1:
			# o cursor passa pelos 11 lutadores e para no Nikolas, que solta um meme ao ser escolhido
			var s := tela as Telas.Selecao
			if quadro % 22 == 0 and quadro <= 22 * 11:
				s.cursor[0] = (quadro / 22) % Personagens.LISTA.size()
				Som.sfx("menu_mover", 0.0)
			if quadro == 22 * 11 + 25:
				s.cursor[0] = NIKOLAS
				s._confirmar(0)
		3:
			if quadro == 15:
				_meme_de(0, "res://audio/memes/nikolas/oi_dani.ogg", "Oi, Dani!")
			elif quadro == 190:
				_meme_de(1, "res://audio/memes/flavio/bolsonaro_dentro_do_lula.ogg", "Tem Bolsonaro dentro do Lula!")
		4:
			if quadro == 15:
				_poder("super", 60.0)
			elif quadro == 200:
				_meme_de(0, "res://audio/memes/xandao/transparencia.ogg", "Transparênciaaa!")
		5:
			# a torcida da USP canta "RECUA!" (áudio, público pulando e os balões)
			if quadro == 10:
				luta.cantar_recua()
		6, 7, 8, 9:
			if quadro == 15:
				_poder("ult", 100.0)
		10:
			if quadro == 10:
				_meme_de(0, "res://audio/memes/renan/tranqueira.ogg", "Tranqueira!")
			elif quadro == 90:
				luta._dilera = -1
				luta._chamar_dilera()
	if quadro >= int(cenas[cena][0]):
		_proxima()
	return false


## O lutador 1 solta o SUPER (barra 60) ou a Ultimate (barra 100), os dois parados e perto.
func _poder(_tipo: String, barra: float) -> void:
	for l in luta.p:
		l.entrada = null
	luta.ias = [null, null]
	luta.p[0].position.x = 560.0
	luta.p[1].position.x = 780.0
	luta.p[0].barra = barra
	luta.p[0]._tentar_super(5)


## Meme em áudio escolhido, com o retrato e a legenda (o mesmo efeito do jogo).
func _meme_de(lado: int, caminho: String, txt: String) -> void:
	Som.meme(caminho)
	luta.efeitos = luta.efeitos.filter(func(ef): return ef["tipo"] != "meme")
	luta.efeitos.append({"tipo": "meme", "t": 0, "dur": 110, "lado": lado, "txt": txt, "dados": luta.p[lado].dados})
	luta._meme_cd = 240
