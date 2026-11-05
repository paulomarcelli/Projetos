class_name Toque
extends Node2D
## Controles de toque na luta (celular e tablet): direcional à esquerda e quatro botões à direita.
## Aperta e solta as mesmas ações do teclado do jogador 1 (Input.action_press), então o resto do
## jogo não precisa saber se o comando veio do toque, do teclado ou do controle. Aceita vários dedos.

static var usado := false  # vira true no primeiro toque na tela (mostra os controles)

const CENTRO_DIR := Vector2(190, 560)
const RAIO_DIR := 130.0
const BOTOES := {
	"p1_soco": {"pos": Vector2(990, 610), "rot": "SOCO", "cor": Color("2a9df4")},
	"p1_chute": {"pos": Vector2(1130, 600), "rot": "CHUTE", "cor": Color("e63946")},
	"p1_especial": {"pos": Vector2(1060, 470), "rot": "ESP.", "cor": Color("ffd23f")},
	"p1_provocar": {"pos": Vector2(1190, 440), "rot": "PROV.", "cor": Color("9b5de5"), "raio": 40.0},
}
const RAIO_BOTAO := 58.0

var _dedo_dir := -1  # índice do dedo no direcional
var _vetor := Vector2.ZERO
var _botoes_dedo := {}  # índice do dedo -> ação


static func disponivel() -> bool:
	return usado or DisplayServer.is_touchscreen_available()


## Converte a posição do evento (pixels da tela) para as coordenadas do jogo (1280x720).
static func local(n: CanvasItem, pos: Vector2) -> Vector2:
	return n.get_global_transform_with_canvas().affine_inverse() * pos


func _ready() -> void:
	z_index = 20


func _exit_tree() -> void:
	for acao in ["p1_esq", "p1_dir", "p1_cima", "p1_baixo"] + BOTOES.keys():
		Input.action_release(acao)


func _input(ev: InputEvent) -> void:
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
		queue_redraw()
	elif ev is InputEventScreenDrag and ev.index == _dedo_dir:
		_direcao(Toque.local(self, ev.position))
		queue_redraw()


func _botao_em(p: Vector2) -> String:
	for acao in BOTOES:
		var b: Dictionary = BOTOES[acao]
		if p.distance_to(b["pos"]) < b.get("raio", RAIO_BOTAO) * 1.25:
			return acao
	return ""


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


func _draw() -> void:
	if not Toque.disponivel():
		return
	# direcional
	draw_circle(CENTRO_DIR, RAIO_DIR + 6, Color(0, 0, 0, 0.35))
	draw_arc(CENTRO_DIR, RAIO_DIR, 0, TAU, 40, Color(1, 1, 1, 0.35), 4.0)
	for a in 4:
		var ang := a * PI / 2.0
		var ponta := CENTRO_DIR + Vector2(cos(ang), sin(ang)) * (RAIO_DIR - 22)
		var lado := Vector2(cos(ang + PI / 2), sin(ang + PI / 2)) * 14
		var base := CENTRO_DIR + Vector2(cos(ang), sin(ang)) * (RAIO_DIR - 52)
		draw_colored_polygon(PackedVector2Array([ponta, base + lado, base - lado]), Color(1, 1, 1, 0.45))
	draw_circle(CENTRO_DIR + _vetor, 48, Color(1, 1, 1, 0.55 if _dedo_dir != -1 else 0.3))
	# botões
	var apertados := _botoes_dedo.values()
	for acao in BOTOES:
		var b: Dictionary = BOTOES[acao]
		var r: float = b.get("raio", RAIO_BOTAO)
		var cor: Color = b["cor"]
		var on: bool = acao in apertados
		draw_circle(b["pos"], r + 5, Color(0, 0, 0, 0.45))
		draw_circle(b["pos"], r, Color(cor, 0.85 if on else 0.5))
		draw_arc(b["pos"], r, 0, TAU, 32, Color(1, 1, 1, 0.6), 3.0)
		Desenho.texto(self, b["pos"] + Vector2(0, 8), b["rot"], 22, Color.WHITE, Desenho.PRETO, 4)
