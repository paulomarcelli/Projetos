class_name Toque
extends Node2D
## Controles de toque na luta (celular e tablet): direcional à esquerda e botões à direita,
## com o botão SUPER grande (anel mostra a barra; brilha quando dá para usar; dourado = ULTIMATE).
## Aperta e solta as mesmas ações do teclado do jogador 1 (Input.action_press), então o resto do
## jogo não precisa saber de onde veio o comando. Aceita vários dedos.

static var usado := false  # vira true no primeiro toque na tela (mostra os controles)

const CENTRO_DIR := Vector2(190, 560)
const RAIO_DIR := 130.0
const BOTOES := {
	"p1_soco": {"pos": Vector2(965, 622), "rot": "SOCO", "cor": Color("2a9df4"), "raio": 56.0},
	"p1_chute": {"pos": Vector2(1105, 630), "rot": "CHUTE", "cor": Color("e63946"), "raio": 56.0},
	"p1_especial": {"pos": Vector2(1030, 498), "rot": "ESP.", "cor": Color("ff8a1e"), "raio": 52.0},
	"p1_super": {"pos": Vector2(1182, 470), "rot": "SUPER", "cor": Color("ffd23f"), "raio": 64.0},
	"p1_agarrar": {"pos": Vector2(876, 516), "rot": "AGARRA", "cor": Color("9b5de5"), "raio": 42.0},
	"p1_provocar": {"pos": Vector2(1218, 330), "rot": "PROV.", "cor": Color("6a6a80"), "raio": 32.0},
}

var luta: Luta  # para ler a barra do jogador 1
var _dedo_dir := -1
var _vetor := Vector2.ZERO
var _botoes_dedo := {}  # índice do dedo -> ação
var _t := 0


static func disponivel() -> bool:
	if Config.toque == 1:
		return true
	if Config.toque == 2:
		return false
	return usado or DisplayServer.is_touchscreen_available()


## Converte a posição do evento (pixels da tela) para as coordenadas do jogo (1280x720).
static func local(n: CanvasItem, pos: Vector2) -> Vector2:
	return n.get_global_transform_with_canvas().affine_inverse() * pos


var _cache: Cache


func _ready() -> void:
	z_index = 20
	# os botões viram textura: só são redesenhados quando algo muda (1 chamada de desenho por quadro)
	_cache = Cache.criar(self, self, _desenhar_botoes)


func _redesenhar() -> void:
	if _cache != null:
		_cache.atualizar()


func _exit_tree() -> void:
	for acao in ["p1_esq", "p1_dir", "p1_cima", "p1_baixo"] + BOTOES.keys():
		Input.action_release(acao)


var _ultimo_estado := ""


func _process(_d: float) -> void:
	_t += 1
	if not disponivel():
		return
	# só redesenha quando algo muda (barra, botão apertado, aviso) ou para o brilho pulsar (a cada 4 quadros)
	var estado := ""
	if luta != null and luta.p.size() > 0:
		estado = "%d|%d|%d|%d" % [int(luta.p[0].barra), luta.aviso_barra[0], luta.p[0].bloqueado, _botoes_dedo.size()]
	if estado != _ultimo_estado or (_t % 4 == 0 and luta != null and luta.p.size() > 0 and luta.p[0].barra >= 50.0) or luta == null:
		_ultimo_estado = estado
		_redesenhar()


func _input(ev: InputEvent) -> void:
	if not visible:
		return
	if ev is InputEventScreenTouch:
		usado = true
		var p := Toque.local(self, ev.position)
		if ev.pressed:
			if p.distance_to(CENTRO_DIR) < RAIO_DIR * 1.5 and _dedo_dir == -1:
				_dedo_dir = ev.index
				_direcao(p)
			else:
				var acao := _botao_em(p)
				if acao != "":
					_botoes_dedo[ev.index] = acao
					Input.action_press(acao)
		else:
			if ev.index == _dedo_dir:
				_dedo_dir = -1
				_direcao(CENTRO_DIR)
			if _botoes_dedo.has(ev.index):
				Input.action_release(_botoes_dedo[ev.index])
				_botoes_dedo.erase(ev.index)
		_redesenhar()
	elif ev is InputEventScreenDrag and ev.index == _dedo_dir:
		_direcao(Toque.local(self, ev.position))
		_redesenhar()


## O botão mais perto do dedo (dentro de uma folga de 25% do raio).
func _botao_em(p: Vector2) -> String:
	var melhor := ""
	var dist := INF
	for acao in BOTOES:
		var b: Dictionary = BOTOES[acao]
		var d := p.distance_to(b["pos"])
		if d < float(b["raio"]) * 1.25 and d < dist:
			dist = d
			melhor = acao
	return melhor


## Direcional de 8 direções a partir do arraste do dedo.
func _direcao(p: Vector2) -> void:
	var v := (p - CENTRO_DIR)
	_vetor = v.limit_length(RAIO_DIR)
	var morto := RAIO_DIR * 0.28
	var estados := {
		"p1_esq": v.x < -morto and absf(v.x) > absf(v.y) * 0.45,
		"p1_dir": v.x > morto and absf(v.x) > absf(v.y) * 0.45,
		"p1_cima": v.y < -morto and absf(v.y) > absf(v.x) * 0.45,
		"p1_baixo": v.y > morto and absf(v.y) > absf(v.x) * 0.45,
	}
	for acao in estados:
		if estados[acao]:
			Input.action_press(acao)
		else:
			Input.action_release(acao)


func _desenhar_botoes(_c: CanvasItem) -> void:
	if not disponivel():
		return
	_draw2(_c)


func _draw2(c: CanvasItem) -> void:
	# direcional
	c.draw_circle(CENTRO_DIR, RAIO_DIR + 6, Color(0, 0, 0, 0.35))
	c.draw_arc(CENTRO_DIR, RAIO_DIR, 0, TAU, 40, Color(1, 1, 1, 0.35), 4.0)
	for a in 4:
		var ang := a * PI / 2.0
		var ponta := CENTRO_DIR + Vector2(cos(ang), sin(ang)) * (RAIO_DIR - 22)
		var lado := Vector2(cos(ang + PI / 2), sin(ang + PI / 2)) * 14
		var base := CENTRO_DIR + Vector2(cos(ang), sin(ang)) * (RAIO_DIR - 52)
		c.draw_colored_polygon(PackedVector2Array([ponta, base + lado, base - lado]), Color(1, 1, 1, 0.45))
	c.draw_circle(CENTRO_DIR + _vetor, 48, Color(1, 1, 1, 0.55 if _dedo_dir != -1 else 0.3))
	# botões: primeiro todas as formas, depois todos os textos (o WebGL junta as chamadas)
	var apertados := _botoes_dedo.values()
	var rotulos := []
	for acao in BOTOES:
		if acao == "p1_super":
			_botao_super(c, acao in apertados, rotulos)
			continue
		var b: Dictionary = BOTOES[acao]
		var r: float = b["raio"]
		var cor: Color = b["cor"]
		var on: bool = acao in apertados
		var pos: Vector2 = b["pos"]
		var rr := r * (0.92 if on else 1.0)
		c.draw_circle(pos + Vector2(0, 5), rr + 5, Color(0, 0, 0, 0.45))
		c.draw_circle(pos, rr, Color(cor, 0.88 if on else 0.55))
		c.draw_circle(pos + Vector2(-rr * 0.25, -rr * 0.3), rr * 0.35, Color(1, 1, 1, 0.18))
		c.draw_arc(pos, rr, 0, TAU, 32, Color(1, 1, 1, 0.65), 3.0)
		rotulos.append([pos + Vector2(0, 8), b["rot"], 22 if r > 40 else 16, Color.WHITE])
	for l in rotulos:
		Desenho.texto(c, l[0], l[1], l[2], l[3], Desenho.PRETO, 4)


## Botão de fliperama: anel com a barra, brilho quando pronto, tremida quando falta energia.
func _botao_super(c: CanvasItem, on: bool, rotulos: Array) -> void:
	var b: Dictionary = BOTOES["p1_super"]
	var r: float = b["raio"]
	var pos: Vector2 = b["pos"]
	var barra := 0.0
	var falta := false
	var bloqueado := false
	if luta != null and luta.p.size() > 0:
		barra = luta.p[0].barra
		falta = luta.aviso_barra[0] > 0
		bloqueado = luta.p[0].bloqueado > 0
	if falta:
		pos.x += sin(_t * 1.8) * 6.0
	var meia := barra >= 50.0
	var cheia := barra >= 100.0
	var pulso := 0.5 + 0.5 * sin(_t * 0.25)
	var cor := Color("4a4a60")
	if cheia:
		cor = Color("ffd23f").lerp(Color("fff3b0"), pulso)
	elif meia:
		cor = Color("7ef0ff")
	if bloqueado:
		cor = Color("6a3040")
	# brilho em volta quando dá para usar
	if meia and not bloqueado:
		for i in 3:
			c.draw_circle(pos, r + 12 + i * 8 + pulso * 6, Color(cor, 0.12 - i * 0.03))
	var rr := r * (0.9 if on else 1.0)
	c.draw_circle(pos + Vector2(0, 7), rr + 8, Color(0, 0, 0, 0.55))
	c.draw_circle(pos, rr + 6, Color("1a1430"))
	# anel da barra (meia volta = Superpower, volta inteira = Ultimate)
	c.draw_arc(pos, rr + 2, -PI / 2, -PI / 2 + TAU, 48, Color(1, 1, 1, 0.15), 8.0)
	if barra > 0.0:
		c.draw_arc(pos, rr + 2, -PI / 2, -PI / 2 + TAU * barra / 100.0, 48, cor if barra >= 50.0 else Color("4aa8ff"), 8.0)
	c.draw_line(pos + Vector2(0, rr - 6), pos + Vector2(0, rr + 10), Desenho.PRETO, 4.0)
	c.draw_circle(pos, rr - 6, Color(cor, 0.95 if (on or meia) else 0.5))
	c.draw_circle(pos + Vector2(-rr * 0.25, -rr * 0.3), rr * 0.35, Color(1, 1, 1, 0.25))
	var rot := "ULTIMATE" if cheia else "SUPER"
	if bloqueado:
		Arte.cadeado(c, pos + Vector2(0, -4), 1.1)
	else:
		rotulos.append([pos + Vector2(0, 8), rot, 16 if cheia else 22, Color.WHITE if meia else Color(1, 1, 1, 0.6)])
