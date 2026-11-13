extends SceneTree
## Grava o mini trailer (~30 s) com imagem e som do próprio jogo, pelo Movie Maker do Godot:
##   xvfb-run godot --path . --rendering-driver opengl3 --resolution 1440x810 \
##       --write-movie /caminho/trailer.avi --script res://tests/trailer.gd
## Depois, ferramentas/trailer.py monta o vídeo vertical para os stories (legendas, fundo, link).
##
## Cenas (60 quadros por segundo):
##   capa Lula x Bolsonaro com o "cadê o Zé Gotinha?" · VS · luta na Praça com memes em áudio ·
##   SUPER do Trump dançando YMCA · o Dilera surgindo · Ultimate do Lula com música, K.O. e a
##   música da vitória · créditos.
var raiz: Node2D
var quadro := 0       # quadro da cena atual
var cena := -1
var luta: Luta
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
		[165, _capa],
		[120, _versus],
		[300, _luta_memes],
		[330, _super_trump],
		[165, _dilera],
		[600, _ultimate_ko],
		[150, _creditos],
	]
	_proxima.call_deferred()


func _limpar() -> void:
	for c in raiz.get_children():
		c.queue_free()
	luta = null


func _proxima() -> void:
	_limpar()
	cena += 1
	quadro = 0
	if cena >= cenas.size():
		quit()
		return
	cenas[cena][1].call()


## Luta CPU x CPU já no meio do round (pula a apresentação), os dois perto um do outro.
func _nova_luta(cenario: String, a: int, b: int, nivel := 0.75) -> Luta:
	var l := Luta.new()
	l.cenario = cenario
	l.nivel_cpu = nivel
	l.configurar(Personagens.por_indice(a), Personagens.por_indice(b), false, true)
	raiz.add_child(l)
	for i in 200:
		if l.fase == "luta":
			break
		l._tick()
	l.msg_t = 0  # sem o "LUTE!" que sobra da apresentação
	l.p[0].position.x = 540.0
	l.p[1].position.x = 760.0
	l._radio_em = 99999.0  # o rádio de memes fica por conta do roteiro
	l._dilera = 999  # o Dilera só aparece na cena dele
	return l


# ---------------------------------------------------------------- cenas

func _capa() -> void:
	var t := Telas.Titulo.new()
	t.dupla = [0, 1]
	raiz.add_child(t)
	Som.musica("menu")


func _versus() -> void:
	var v := Telas.Versus.new()
	v.a = Personagens.por_indice(0)
	v.b = Personagens.por_indice(1)
	v.cenario = "praca"
	v.rotulo = "LULA x BOLSONARO"
	raiz.add_child(v)


func _luta_memes() -> void:
	luta = _nova_luta("praca", 0, 1)
	Som.musica("praca")


func _super_trump() -> void:
	luta = _nova_luta("casa_branca", 3, 1, 0.0)
	Som.musica("casa_branca")


func _dilera() -> void:
	luta = _nova_luta("paulista", 1, 0)
	Som.musica("paulista")


func _ultimate_ko() -> void:
	luta = _nova_luta("praca", 0, 1, 0.0)
	luta.vitorias = [1, 0]  # esta é a luta decisiva: a vitória toca a música do Lula
	luta.p[1].vida = 260.0  # a cinemática inteira e o K.O. no último golpe
	Som.musica("praca")


func _creditos() -> void:
	Som.trilha_parar(1.5)
	raiz.add_child(Telas.Creditos.new())


# ---------------------------------------------------------------- roteiro quadro a quadro

func _process(_d: float) -> bool:
	if cena < 0 or cena >= cenas.size():
		return false
	quadro += 1
	match cena:
		0:
			if quadro == 40:
				Som.meme("res://audio/memes/lula/ze_gotinha.ogg")
		2:
			# memes em áudio no meio da troca de golpes: do Lula, do Bolsonaro e um do rádio
			if quadro == 20:
				luta._meme_cd = 0
				_meme_de(0, "res://audio/memes/lula/cara_sem_dente.ogg", "Cara sem dente!")
			elif quadro == 170:
				_meme_de(1, "res://audio/memes/bolsonaro/imbrochavel.ogg", "IMBROCHÁVEL!")
		3:
			# Trump solta o SUPER (YMCA) assim que puder
			if quadro == 20:
				_parar_ias()
				luta.p[0].position.x = 560.0
				luta.p[1].position.x = 800.0
				luta.p[0].barra = 60.0
				luta.p[0]._tentar_super(5)
		4:
			if quadro == 15:
				luta._dilera = -1
				luta._chamar_dilera()
		5:
			if quadro == 20:
				_parar_ias()
				luta.p[0].position.x = 560.0
				luta.p[1].position.x = 760.0
				luta.p[0].barra = 100.0
				luta.p[0]._tentar_super(5)
	if quadro >= int(cenas[cena][0]):
		_proxima()
	return false


func _parar_ias() -> void:
	for l in luta.p:
		l.entrada = null
	luta.ias = [null, null]


## Meme em áudio escolhido, com o retrato e a legenda (o mesmo efeito do jogo).
func _meme_de(lado: int, caminho: String, txt: String) -> void:
	Som.meme(caminho)
	luta.efeitos = luta.efeitos.filter(func(ef): return ef["tipo"] != "meme")
	luta.efeitos.append({"tipo": "meme", "t": 0, "dur": 110, "lado": lado, "txt": txt, "dados": luta.p[lado].dados})
	luta._meme_cd = 240
