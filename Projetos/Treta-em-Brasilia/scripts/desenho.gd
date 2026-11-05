class_name Desenho
## Tudo o que é desenhado em código, no visual de fliperama 16 bits:
## lutadores cabeçudos com contorno escuro e sombreado, projéteis, veículos das investidas,
## o cenário da Praça dos Três Poderes (céu pontilhado, plateia com cartazes) e textos
## com a fonte pixelada Press Start 2P.
##
## O jogo pensa em 1280x720 e desenha numa tela de 480x270 (ESCALA). Pés do lutador em (0, 0),
## olhando para a direita (+x é a frente).

const ESCALA := 0.375
const PRETO := Color("140c1c")
const CONTORNO := Color("140c1c")
const BRANCO := Color("fbfbf7")
const SOMBRA := Color(0, 0, 0, 0.32)

static var _cont := false
## Transformação de quem chamou (posição/escala do boneco na tela); as partes se compõem com ela.
static var _base := Transform2D.IDENTITY
static var _fonte: Font
static var _ceu: ImageTexture
static var _texturas := {}


## Carrega sprites/<nome>.png uma vez (null se não existir).
static func textura(nome: String) -> Texture2D:
	if not _texturas.has(nome):
		var caminho := "res://sprites/%s.png" % nome
		_texturas[nome] = load(caminho) if ResourceLoader.exists(caminho) else null
	return _texturas[nome]


static func pose_padrao() -> Dictionary:
	return {
		"agachado": false, "quadril": -72.0, "inclina": 0.0, "giro": 0.0,
		"mao_f": Vector2(36, -128), "mao_t": Vector2(18, -122),
		"pe_f": Vector2(20, 0), "pe_t": Vector2(-20, 0),
		"boca": "normal", "olhos": "normal", "punho_grande": false, "martelo": false,
	}


# ---------------------------------------------------------------- primitivas com contorno
# Cada parte é desenhada duas vezes: primeiro a silhueta escura um pouco maior (contorno),
# depois a cor. É o que dá o traço preto dos sprites de 16 bits.

static func _cor(cor: Color) -> Color:
	return CONTORNO if _cont else cor


static func _lin(c: CanvasItem, a: Vector2, b: Vector2, cor: Color, w: float) -> void:
	c.draw_line(a, b, _cor(cor), w + (6.0 if _cont else 0.0))


static func _circ(c: CanvasItem, pos: Vector2, r: float, cor: Color) -> void:
	c.draw_circle(pos, r + (3.0 if _cont else 0.0), _cor(cor))


static func _poli(c: CanvasItem, pts: PackedVector2Array, cor: Color) -> void:
	if _cont:
		for o in [Vector2(3, 0), Vector2(-3, 0), Vector2(0, 3), Vector2(0, -3)]:
			var m := PackedVector2Array()
			for q in pts:
				m.append(q + o)
			c.draw_colored_polygon(m, CONTORNO)
	else:
		c.draw_colored_polygon(pts, cor)


static func _ret(c: CanvasItem, r: Rect2, cor: Color) -> void:
	c.draw_rect(r.grow(3.0 if _cont else 0.0), _cor(cor))


static func _arco(c: CanvasItem, centro: Vector2, r: float, de: float, ate: float, cor: Color, w: float) -> void:
	c.draw_arc(centro, r, de, ate, 20, _cor(cor), w + (6.0 if _cont else 0.0))


# ---------------------------------------------------------------- lutador

## Desenha o lutador em pos, com escala (negativa em x = olhando para a esquerda).
static func lutador_em(c: CanvasItem, d: Dictionary, p: Dictionary, pos: Vector2, escala: Vector2) -> void:
	_base = Transform2D(0.0, escala, 0.0, pos)
	c.draw_set_transform_matrix(_base)
	lutador(c, d, p)
	_base = Transform2D.IDENTITY
	c.draw_set_transform_matrix(_base)


static func lutador(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	_cont = true
	_corpo(c, d, p)
	_cont = false
	_corpo(c, d, p)


static func _corpo(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	var quadril := Vector2(0, p["quadril"])
	var inclina: float = p["inclina"]
	var ombro_f := quadril + Vector2(14, -58).rotated(inclina)
	var ombro_t := quadril + Vector2(-14, -58).rotated(inclina)
	var pele: Color = d["pele"]
	var roupa: Color = d["roupa"]

	_braco(c, d, ombro_t, p["mao_t"], roupa.darkened(0.3), false)
	_perna(c, d, quadril + Vector2(-9, 0), p["pe_t"], p["agachado"], true)
	_perna(c, d, quadril + Vector2(9, 0), p["pe_f"], p["agachado"], false)

	c.draw_set_transform_matrix(_base * Transform2D(inclina, quadril))
	_tronco(c, d)
	if not _cont:
		# contorno próprio da cabeça por cima do tronco
		_cont = true
		cabeca(c, d, Vector2(0, -96), 32.0, p)
		_cont = false
	cabeca(c, d, Vector2(0, -96), 32.0, p)
	c.draw_set_transform_matrix(_base)

	if not _cont:
		_cont = true
		_braco(c, d, ombro_f, p["mao_f"], roupa, p["punho_grande"])
		_cont = false
	_braco(c, d, ombro_f, p["mao_f"], roupa, p["punho_grande"])
	match p.get("prop", ""):
		"martelo":
			_martelo(c, p["mao_f"])
		"livro":
			_livro(c, p["mao_f"])
	if not _cont and pele.a > 0.0:
		pass


static func _perna(c: CanvasItem, d: Dictionary, quadril: Vector2, pe: Vector2, agachado: bool, de_tras: bool) -> void:
	var cor: Color = d["calca"]
	if d["extra"] == "toga":
		cor = Color("1b1b22")
	if de_tras:
		cor = cor.darkened(0.25)
	var meio := (quadril + pe) / 2.0
	var joelho := meio + (Vector2(24, -4) if agachado else Vector2(7, 0))
	_lin(c, quadril, joelho, cor, 16.0)
	_lin(c, joelho, pe + Vector2(0, -5), cor, 14.0)
	_circ(c, joelho, 7.5, cor)
	if not _cont:
		# brilho na canela
		c.draw_line(joelho + Vector2(3, 2), pe + Vector2(3, -10), cor.lightened(0.18), 3.0)
	var sapato := PackedVector2Array([pe + Vector2(-9, -9), pe + Vector2(13, -9), pe + Vector2(19, 0), pe + Vector2(-9, 0)])
	_poli(c, sapato, Color("2a2230"))
	if not _cont:
		c.draw_line(pe + Vector2(-6, -7), pe + Vector2(10, -7), Color("5a4e60"), 2.0)


static func _braco(c: CanvasItem, d: Dictionary, ombro: Vector2, mao: Vector2, cor: Color, grande: bool) -> void:
	var meio := (ombro + mao) / 2.0
	var perp := (mao - ombro).orthogonal().normalized()
	if perp.y < 0:
		perp = -perp
	var cotovelo := meio + perp * clampf(60.0 - ombro.distance_to(mao) * 0.5, 0.0, 22.0)
	_lin(c, ombro, cotovelo, cor, 15.0)
	_lin(c, cotovelo, mao, cor, 13.0)
	_circ(c, cotovelo, 7.0, cor)
	if not _cont:
		c.draw_line(ombro + Vector2(0, -3), cotovelo + Vector2(0, -3), cor.lightened(0.2), 3.0)
	var r := 11.5 if grande else 8.5
	var pele: Color = d["pele"]
	_circ(c, mao, r, pele.darkened(0.2))
	if not _cont:
		c.draw_circle(mao + Vector2(1.5, -1.5), r - 2.5, pele)


static func _tronco(c: CanvasItem, d: Dictionary) -> void:
	var roupa: Color = d["roupa"]
	var extra: String = d["extra"]
	var paleto := PackedVector2Array([Vector2(-27, -60), Vector2(27, -60), Vector2(24, 2), Vector2(-24, 2)])
	if extra == "vestido":
		paleto = PackedVector2Array([Vector2(-27, -60), Vector2(27, -60), Vector2(40, 30), Vector2(-40, 30)])
	if extra == "toga":
		paleto = PackedVector2Array([Vector2(-29, -60), Vector2(29, -60), Vector2(37, 22), Vector2(-37, 22)])
	_poli(c, paleto, roupa)
	if _cont:
		return
	# sombra do lado de trás e brilho na frente
	c.draw_colored_polygon(PackedVector2Array([Vector2(-27, -60), Vector2(-15, -60), Vector2(-13, 2 if extra != "toga" else 22), Vector2(-24 if extra != "toga" else -37, 2 if extra != "toga" else 22)]), roupa.darkened(0.3))
	c.draw_line(Vector2(22, -56), Vector2(20, -4), roupa.lightened(0.22), 3.0)
	# pescoço
	c.draw_rect(Rect2(-8, -70, 16, 14), d["pele"].darkened(0.22))
	if extra not in ["toga", "vestido"]:
		c.draw_colored_polygon(PackedVector2Array([Vector2(-11, -60), Vector2(11, -60), Vector2(0, -30)]), d["camisa"])
	var gravata: Color = d["gravata"]
	if gravata.a > 0.0 and extra != "toga":
		var ponta := 6.0 if extra == "eua" else -15.0  # a gravata comprida do Trump
		c.draw_colored_polygon(PackedVector2Array([Vector2(-4, -57), Vector2(4, -57), Vector2(7, ponta - 9), Vector2(0, ponta), Vector2(-7, ponta - 9)]), gravata)
		c.draw_line(Vector2(2, -54), Vector2(4, -26), gravata.lightened(0.3), 2.0)
	match extra:
		"faixa":
			c.draw_colored_polygon(PackedVector2Array([Vector2(-24, -60), Vector2(-12, -60), Vector2(24, -8), Vector2(24, 6), Vector2(14, 6)]), Color("1f9d55"))
			c.draw_colored_polygon(PackedVector2Array([Vector2(-18, -60), Vector2(-13, -60), Vector2(24, -4), Vector2(20, 4)]), Color("ffd23f"))
		"estrela":
			_estrela(c, Vector2(-15, -44), 5.5, Color("e3262f"))
		"faixa_roseta":
			c.draw_colored_polygon(PackedVector2Array([Vector2(-26, -60), Vector2(-13, -60), Vector2(24, -6), Vector2(24, 8), Vector2(12, 8)]), Color("1f9d55"))
			c.draw_colored_polygon(PackedVector2Array([Vector2(-21, -60), Vector2(-15, -60), Vector2(24, -2), Vector2(19, 6)]), Color("ffd23f"))
			c.draw_circle(Vector2(12, -8), 10.0, Color("1f9d55"))
			c.draw_circle(Vector2(12, -8), 6.5, Color("ffd23f"))
			c.draw_circle(Vector2(12, -8), 3.0, Color("c9a227"))
			_estrela(c, Vector2(-14, -48), 5.0, Color("c9a227"))
		"broche":
			c.draw_rect(Rect2(-17, -48, 7, 5), Color("1f9d55"))
			c.draw_rect(Rect2(-15, -47, 3, 3), Color("ffd23f"))
		"eua":
			c.draw_rect(Rect2(-18, -48, 8, 6), BRANCO)
			c.draw_rect(Rect2(-18, -48, 8, 2), Color("c8102e"))
			c.draw_rect(Rect2(-18, -48, 3, 3), Color("2a3f8f"))
		"toga":
			c.draw_colored_polygon(PackedVector2Array([Vector2(-12, -60), Vector2(12, -60), Vector2(6, -40), Vector2(0, -36), Vector2(-6, -40)]), BRANCO)
			c.draw_line(Vector2(0, -36), Vector2(0, 18), Color("34343e"), 2.0)
			# cordões vermelhos da toga
			c.draw_line(Vector2(-13, -60), Vector2(-9, 20), Color("c8102e"), 2.5)
			c.draw_line(Vector2(13, -60), Vector2(9, 20), Color("c8102e"), 2.5)
		"colar":
			for i in 7:
				var a := PI * (0.15 + 0.7 * i / 6.0)
				c.draw_circle(Vector2(cos(a) * 13.0, -62 + sin(a) * 10.0), 2.6, BRANCO)
		"vestido":
			c.draw_colored_polygon(PackedVector2Array([Vector2(-27, -60), Vector2(27, -60), Vector2(40, 30), Vector2(-40, 30)]), roupa)
			c.draw_colored_polygon(PackedVector2Array([Vector2(-14, -60), Vector2(14, -60), Vector2(12, -46), Vector2(-12, -46)]), d["pele"])
			for i in 6:
				var y := -40.0 + i * 12.0
				c.draw_arc(Vector2(-14 + (i % 2) * 18, y), 6.0, 0, PI * 1.5, 8, Color("8a8478"), 2.0)
			c.draw_rect(Rect2(-30, -22, 60, 4), Color("8a8478"))
		"listras":
			for i in 4:
				var y := -52.0 + i * 15.0
				c.draw_rect(Rect2(-25, y, 50, 6), Color("e63946") if i % 2 == 0 else Color("2a9df4"))
	if extra in ["", "faixa", "estrela", "faixa_roseta", "broche", "eua"]:
		c.draw_line(Vector2(-11, -60), Vector2(-2, -24), roupa.darkened(0.45), 2.0)
		c.draw_line(Vector2(11, -60), Vector2(2, -24), roupa.darkened(0.45), 2.0)
		c.draw_circle(Vector2(3, -18), 1.8, roupa.darkened(0.5))
		c.draw_circle(Vector2(3, -8), 1.8, roupa.darkened(0.5))


static func cabeca(c: CanvasItem, d: Dictionary, centro: Vector2, r: float, p: Dictionary) -> void:
	if d.has("foto") and textura(d["foto"] + "_cabeca") != null:
		if not _cont:
			_cabeca_foto(c, d, centro, r, p)
		return
	var pele: Color = d["pele"]
	var cabelo: Color = d["cabelo"]
	var estilo: String = d["estilo_cabelo"]

	if estilo == "curto":
		_circ(c, centro + Vector2(-3, -5), r * 1.14, cabelo)
	_circ(c, centro + Vector2(-r * 0.78, 2), r * 0.24, pele.darkened(0.15))
	_circ(c, centro, r, pele.darkened(0.2))
	_circ(c, centro + Vector2(r * 0.12, r * 0.38), r * 0.72, pele.darkened(0.2))
	if not _cont:
		# rosto com sombra do lado de trás (luz vindo da frente)
		c.draw_circle(centro + Vector2(3, -2), r - 3.0, pele)
		c.draw_circle(centro + Vector2(r * 0.12 + 3, r * 0.36), r * 0.72 - 3.0, pele)
		c.draw_circle(centro + Vector2(r * 0.35, -r * 0.55), r * 0.16, pele.lightened(0.2))

	match estilo:
		"grisalho":
			_arco(c, centro, r * 0.98, PI * 1.05, PI * 1.95, cabelo, r * 0.22)
			_circ(c, centro + Vector2(-r * 0.82, -r * 0.18), r * 0.34, cabelo)
		"repartido":
			_poli(c, _arco_cheio(centro, r * 1.04, PI * 1.02, PI * 2.02, r * 0.62), cabelo)
			if not _cont:
				c.draw_line(centro + Vector2(-r * 0.2, -r * 0.98), centro + Vector2(r * 0.05, -r * 0.55), cabelo.lightened(0.3), 2.0)
		"careca":
			if not _cont:
				c.draw_arc(centro + Vector2(r * 0.1, -r * 0.1), r * 0.72, PI * 1.25, PI * 1.6, 10, Color(1, 1, 1, 0.5), 4.0)
				c.draw_circle(centro + Vector2(-r * 0.85, -r * 0.05), r * 0.18, Color("5a4a40"))
		"grisalho_liso":
			_poli(c, _arco_cheio(centro, r * 1.03, PI * 1.0, PI * 1.98, r * 0.5), cabelo)
		"curto":
			_poli(c, _arco_cheio(centro, r * 1.06, PI * 1.05, PI * 1.9, r * 0.55), cabelo)
		"palhaco":
			_circ(c, centro + Vector2(-r * 0.85, -r * 0.1), r * 0.36, cabelo)
			var base_e := centro + Vector2(-r * 0.95, -r * 0.55)
			var base_d := centro + Vector2(r * 0.95, -r * 0.55)
			var ponta := centro + Vector2(-r * 0.6, -r * 2.1)
			_poli(c, PackedVector2Array([base_e, base_d, ponta]), Color("2a9df4"))
			if not _cont:
				c.draw_colored_polygon(PackedVector2Array([base_e.lerp(ponta, 0.33), base_d.lerp(ponta, 0.33), base_d.lerp(ponta, 0.66), base_e.lerp(ponta, 0.66)]), Color("f2c230"))
			_ret(c, Rect2(base_e + Vector2(-2, -4), Vector2(base_d.x - base_e.x + 4, 9)), Color("e63946"))
			_circ(c, ponta, r * 0.2, Color("e63946"))
	if d["barba"]:
		var barba := PackedVector2Array()
		for i in 13:
			var a := lerpf(PI * 0.02, PI * 0.98, i / 12.0)
			barba.append(centro + Vector2(r * 0.12, r * 0.25) + Vector2(cos(a) * r * 0.92, sin(a) * r * 0.82))
		barba.append(centro + Vector2(-r * 0.7, r * 0.2))
		barba.append(centro + Vector2(r * 0.95, r * 0.2))
		_poli(c, barba, cabelo)
	if _cont:
		return

	if d["barba"]:
		c.draw_line(centro + Vector2(r * 0.2, r * 0.36), centro + Vector2(r * 0.86, r * 0.36), cabelo.darkened(0.25), 6.0)
		for i in 4:
			c.draw_line(centro + Vector2(r * (0.0 + i * 0.25), r * 0.6), centro + Vector2(r * (0.05 + i * 0.25), r * 0.85), cabelo.darkened(0.2), 2.0)
	var olho1 := centro + Vector2(r * 0.12, -r * 0.08)
	var olho2 := centro + Vector2(r * 0.62, -r * 0.08)
	match p.get("olhos", "normal"):
		"x":
			for o in [olho1, olho2]:
				c.draw_line(o + Vector2(-5, -5), o + Vector2(5, 5), PRETO, 3.0)
				c.draw_line(o + Vector2(-5, 5), o + Vector2(5, -5), PRETO, 3.0)
		"fechado":
			for o in [olho1, olho2]:
				c.draw_line(o + Vector2(-6, 0), o + Vector2(6, 2), PRETO, 3.0)
		_:
			for o in [olho1, olho2]:
				c.draw_circle(o, r * 0.17, BRANCO)
				c.draw_circle(o + Vector2(2.2, 0.5), r * 0.1, PRETO)
	var brava: bool = d["id"] == "xandao"
	var cor_sob: Color = cabelo.darkened(0.35) if estilo != "careca" else Color("3a2c25")
	var g := 5.5 if brava else 3.5
	c.draw_line(olho1 + Vector2(-7, -12 if brava else -10), olho1 + Vector2(7, -7 if brava else -11), cor_sob, g)
	c.draw_line(olho2 + Vector2(-7, -7 if brava else -11), olho2 + Vector2(7, -12 if brava else -10), cor_sob, g)
	if d["oculos"]:
		for o in [olho1, olho2]:
			c.draw_arc(o, r * 0.27, 0, TAU, 18, PRETO, 3.0)
			c.draw_arc(o + Vector2(-2, -2), r * 0.18, PI * 1.1, PI * 1.5, 6, Color(1, 1, 1, 0.7), 2.0)
		c.draw_line(olho1 + Vector2(r * 0.27, 0), olho2 - Vector2(r * 0.27, 0), PRETO, 2.5)
	var nariz := centro + Vector2(r * 0.88, r * 0.12)
	c.draw_colored_polygon(PackedVector2Array([nariz + Vector2(-8, -10), nariz + Vector2(7, 4), nariz + Vector2(-6, 7)]), pele.darkened(0.2))
	c.draw_line(nariz + Vector2(-7, -9), nariz + Vector2(5, 3), pele.lightened(0.15), 2.0)
	if estilo == "palhaco":
		c.draw_circle(centro + Vector2(r * 0.05, r * 0.32), r * 0.16, Color(1, 0.35, 0.4, 0.6))
	var boca := centro + Vector2(r * 0.5, r * 0.5)
	match p.get("boca", "normal"):
		"grito":
			c.draw_circle(boca, r * 0.22, Color("4a0c14"))
			c.draw_circle(boca + Vector2(0, 3), r * 0.11, Color("e05a6a"))
			c.draw_rect(Rect2(boca + Vector2(-5, -7), Vector2(10, 3)), BRANCO)
		"dor":
			c.draw_line(boca + Vector2(-8, 2), boca + Vector2(-2, -2), PRETO, 3.0)
			c.draw_line(boca + Vector2(-2, -2), boca + Vector2(4, 2), PRETO, 3.0)
			c.draw_line(boca + Vector2(4, 2), boca + Vector2(9, -2), PRETO, 3.0)
		"sorriso":
			c.draw_arc(boca + Vector2(0, -5), 9.0, PI * 0.15, PI * 0.85, 10, PRETO, 3.0)
		_:
			c.draw_line(boca + Vector2(-7, 0), boca + Vector2(8, -1), PRETO, 3.0)


## Cabeça caricata em pixel art feita da foto (ferramentas/cabeca_pixel.py). O queixo fica no pescoço.
static func _cabeca_foto(c: CanvasItem, d: Dictionary, centro: Vector2, r: float, p: Dictionary) -> void:
	var tex := textura(d["foto"] + ("_retrato" if p.get("retrato", false) else "_cabeca"))
	var h := r * 2.85
	var w := h * tex.get_width() / float(tex.get_height())
	var sobe := -3.0 if p.get("boca", "") == "grito" else 0.0
	c.draw_texture_rect(tex, Rect2(centro.x - w / 2.0 + r * 0.08, centro.y + r * 1.05 - h + sobe, w, h), false)
	if p.get("olhos", "") == "x":
		# tonto: estrelinhas girando em volta da cabeça
		var t := Time.get_ticks_msec() * 0.004
		for i in 3:
			var a := t + i * TAU / 3.0
			_estrela(c, centro + Vector2(cos(a) * r * 1.2, -r * 1.3 + sin(a) * r * 0.35), 7.0, Color("ffd23f"))


static func _arco_cheio(centro: Vector2, r: float, de: float, ate: float, espessura: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 17:
		var a := lerpf(de, ate, i / 16.0)
		pts.append(centro + Vector2(cos(a), sin(a)) * r)
	for i in 17:
		var a := lerpf(ate, de, i / 16.0)
		pts.append(centro + Vector2(cos(a), sin(a)) * (r - espessura))
	return pts


static func _estrela(c: CanvasItem, centro: Vector2, r: float, cor: Color) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a := -PI / 2.0 + i * PI / 5.0
		var rr := r if i % 2 == 0 else r * 0.45
		pts.append(centro + Vector2(cos(a), sin(a)) * rr)
	c.draw_colored_polygon(pts, cor)


static func _livro(c: CanvasItem, mao: Vector2) -> void:
	# a Constituição, verde e dourada
	for passada in 2:
		_cont = passada == 0
		_ret(c, Rect2(mao + Vector2(-16, -48), Vector2(32, 42)), Color("1f6f3a"))
	_cont = false
	c.draw_rect(Rect2(mao + Vector2(-12, -44), Vector2(24, 4)), Color("c9a227"))
	c.draw_rect(Rect2(mao + Vector2(-12, -14), Vector2(24, 4)), Color("c9a227"))
	_estrela(c, mao + Vector2(0, -27), 6.0, Color("c9a227"))
	c.draw_rect(Rect2(mao + Vector2(13, -46), Vector2(3, 38)), BRANCO)


static func _martelo(c: CanvasItem, mao: Vector2) -> void:
	for passada in 2:
		_cont = passada == 0
		_lin(c, mao, mao + Vector2(0, -46), Color("6b4226"), 6.0)
		_ret(c, Rect2(mao + Vector2(-22, -66), Vector2(44, 22)), Color("8a5a35"))
		_ret(c, Rect2(mao + Vector2(-26, -64), Vector2(6, 18)), Color("c9a227"))
		_ret(c, Rect2(mao + Vector2(20, -64), Vector2(6, 18)), Color("c9a227"))
	_cont = false


# ---------------------------------------------------------------- veículos e rastros

static func veiculo(c: CanvasItem, forma: String, t: int) -> void:
	match forma:
		"moto":
			for passada in 2:
				_cont = passada == 0
				for x in [-38.0, 42.0]:
					_circ(c, Vector2(x, -18), 18, Color("1f1a24"))
				_poli(c, PackedVector2Array([Vector2(-40, -30), Vector2(30, -40), Vector2(48, -26), Vector2(-20, -18)]), Color("1f9d55"))
				_ret(c, Rect2(-10, -48, 26, 12), Color("ffd23f"))
				_lin(c, Vector2(36, -36), Vector2(48, -66), Color("2a2230"), 4.0)
			_cont = false
			for x in [-38.0, 42.0]:
				c.draw_circle(Vector2(x, -18), 7, Color("9aa0a6"))
		"aviao":
			for passada in 2:
				_cont = passada == 0
				_poli(c, PackedVector2Array([Vector2(-150, -40), Vector2(60, -52), Vector2(96, -36), Vector2(60, -20), Vector2(-150, -24)]), Color("f2f4f8"))
				_poli(c, PackedVector2Array([Vector2(-30, -36), Vector2(10, -36), Vector2(-50, 10), Vector2(-74, 10)]), Color("d9dee8"))
				_poli(c, PackedVector2Array([Vector2(-150, -40), Vector2(-128, -40), Vector2(-150, -80), Vector2(-168, -80)]), Color("2a4f9a"))
			_cont = false
			c.draw_rect(Rect2(-150, -36, 210, 5), Color("2a4f9a"))
			for i in 8:
				c.draw_rect(Rect2(-110 + i * 20, -46, 7, 5), Color("7ec8ff"))
			for i in 4:
				c.draw_line(Vector2(-170 - i * 14, -50 + i * 10), Vector2(-240 - i * 20, -50 + i * 10), Color(1, 1, 1, 0.6), 4.0)
		"bike":
			for x in [-34.0, 36.0]:
				c.draw_arc(Vector2(x, -20), 18, 0, TAU, 20, PRETO, 4.0)
			c.draw_line(Vector2(-34, -20), Vector2(0, -44), Color("b3122e"), 5.0)
			c.draw_line(Vector2(0, -44), Vector2(36, -20), Color("b3122e"), 5.0)
			c.draw_line(Vector2(-34, -20), Vector2(4, -20), Color("b3122e"), 5.0)
		"votos":
			for i in 6:
				var x := -60.0 - i * 26.0
				var y := -30.0 - (i % 3) * 40.0 + sin(t * 0.5 + i) * 6.0
				c.draw_rect(Rect2(x - 2, y - 2, 26, 18), PRETO)
				c.draw_rect(Rect2(x, y, 22, 14), BRANCO)
				c.draw_line(Vector2(x + 4, y + 8), Vector2(x + 9, y + 12), Color("1f9d55"), 2.0)
				c.draw_line(Vector2(x + 9, y + 12), Vector2(x + 18, y + 2), Color("1f9d55"), 2.0)
		"danca":
			for i in 3:
				var a := t * 0.4 + i * 2.1
				_nota(c, Vector2(cos(a) * 60, -120 + sin(a) * 50), Color("f2c230"))
		_:
			for i in 4:
				var y := -40.0 - i * 32.0
				c.draw_line(Vector2(-60 - i * 10, y), Vector2(-120 - i * 18, y), Color(1, 1, 1, 0.6), 4.0)


static func _nota(c: CanvasItem, pos: Vector2, cor: Color) -> void:
	c.draw_circle(pos, 9, PRETO)
	c.draw_circle(pos, 7, cor)
	c.draw_line(pos + Vector2(6, 0), pos + Vector2(6, -22), cor, 3.0)
	c.draw_line(pos + Vector2(6, -22), pos + Vector2(16, -16), cor, 3.0)


# ---------------------------------------------------------------- projéteis (centro em 0,0, indo para +x)

static func projetil(c: CanvasItem, forma: String, s: float, t: int) -> void:
	var giro := sin(t * 0.3) * 0.15
	c.draw_set_transform(Vector2.ZERO, giro, Vector2(s, s))
	for passada in 2:
		_cont = passada == 0
		_projetil_forma(c, forma, t, giro, s)
	_cont = false
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func _projetil_forma(c: CanvasItem, forma: String, t: int, giro: float, s: float) -> void:
	match forma:
		"picanha":
			_poli(c, PackedVector2Array([Vector2(-26, -8), Vector2(20, -14), Vector2(28, 2), Vector2(18, 14), Vector2(-24, 12)]), Color("b8473f"))
			if not _cont:
				c.draw_colored_polygon(PackedVector2Array([Vector2(-26, -8), Vector2(20, -14), Vector2(22, -7), Vector2(-24, -1)]), Color("f3e3c3"))
				for x in [-12.0, 0.0, 12.0]:
					c.draw_line(Vector2(x, 2), Vector2(x + 8, 10), Color("6b241f"), 3.0)
		"cartao":
			_ret(c, Rect2(-26, -16, 52, 32), Color("1f6fc8"))
			if not _cont:
				c.draw_rect(Rect2(-26, -16, 52, 9), Color("ffd23f"))
				c.draw_rect(Rect2(-20, 2, 10, 8), Color("c9a227"))
				c.draw_rect(Rect2(-4, 6, 24, 3), BRANCO)
			_circ(c, Vector2(30, -14), 8, Color("ffd23f"))
		"seringa":
			_ret(c, Rect2(-24, -8, 36, 16), Color("e8f4ff"))
			_ret(c, Rect2(-34, -12, 8, 24), Color("9aa0a6"))
			_lin(c, Vector2(12, 0), Vector2(34, 0), Color("c9ced6"), 3.0)
			if not _cont:
				c.draw_rect(Rect2(-20, -5, 26, 10), Color("6fd36f"))
				for i in 4:
					c.draw_line(Vector2(-18 + i * 7, -8), Vector2(-18 + i * 7, -3), Color("4a5060"), 2.0)
		"celular":
			_ret(c, Rect2(-14, -26, 28, 52), Color("1f1a24"))
			if not _cont:
				c.draw_rect(Rect2(-10, -21, 20, 40), Color("ff3b6b"))
				c.draw_colored_polygon(PackedVector2Array([Vector2(-4, -8), Vector2(6, 0), Vector2(-4, 8)]), BRANCO)
				c.draw_circle(Vector2(0, 22), 2.5, Color("4a4a55"))
		"bone":
			_poli(c, PackedVector2Array([Vector2(-22, 4), Vector2(-20, -10), Vector2(-8, -18), Vector2(10, -18), Vector2(20, -8), Vector2(22, 4)]), Color("d62828"))
			_ret(c, Rect2(10, 0, 28, 7), Color("b51f1f"))
			if not _cont:
				c.draw_rect(Rect2(-14, -8, 26, 4), BRANCO)
		"pilula":
			_circ(c, Vector2(-12, 0), 12, BRANCO)
			_circ(c, Vector2(12, 0), 12, Color("2f6fdb"))
			_ret(c, Rect2(-12, -12, 24, 24), BRANCO)
			if not _cont:
				c.draw_rect(Rect2(0, -12, 12, 24), Color("2f6fdb"))
				c.draw_line(Vector2(-14, -6), Vector2(-4, -6), Color(1, 1, 1, 0.9), 3.0)
		"inquerito":
			_ret(c, Rect2(-22, -26, 44, 52), BRANCO)
			if not _cont:
				for i in 5:
					c.draw_line(Vector2(-15, -16 + i * 8), Vector2(15, -16 + i * 8), Color("9aa0a6"), 2.0)
				c.draw_arc(Vector2(8, 12), 11, 0, TAU, 18, Color("d62828"), 3.0)
		"grafico":
			_ret(c, Rect2(-28, -22, 56, 44), BRANCO)
			if not _cont:
				var alturas := [10.0, 18.0, 14.0, 28.0]
				for i in 4:
					c.draw_rect(Rect2(-20 + i * 11, 16 - alturas[i], 8, alturas[i]), [Color("2a9df4"), Color("f2c230"), Color("e63946"), Color("1f9d55")][i])
		"mandioca":
			_poli(c, PackedVector2Array([Vector2(-30, -6), Vector2(10, -11), Vector2(30, 0), Vector2(10, 11), Vector2(-30, 6)]), Color("8a5a35"))
			_circ(c, Vector2(-30, 0), 6, Color("f3e9d2"))
			if not _cont:
				c.draw_line(Vector2(-20, -3), Vector2(16, -6), Color("a87448"), 3.0)
		"torta":
			_circ(c, Vector2(0, 6), 26, Color("c9c9c9"))
			_circ(c, Vector2(0, -6), 18, BRANCO)
			_circ(c, Vector2(-10, -2), 12, BRANCO)
			_circ(c, Vector2(10, -2), 12, BRANCO)
			_circ(c, Vector2(0, -22), 5, Color("d62828"))
		"vento":
			if not _cont:
				for i in 4:
					c.draw_arc(Vector2(i * 4, 0), 10.0 + i * 8.0, t * 0.3 + i, t * 0.3 + i + PI * 1.4, 16, Color(0.75, 0.9, 1.0, 0.9 - i * 0.15), 5.0)
		_:
			_circ(c, Vector2.ZERO, 20, Color(1, 0.9, 0.3))
			if not _cont:
				c.draw_circle(Vector2.ZERO, 11, BRANCO)


# ---------------------------------------------------------------- cenário: Praça dos Três Poderes

## Céu do fim de tarde em faixas, com pontilhado (dithering) nas transições, na resolução real.
static func _textura_ceu() -> ImageTexture:
	if _ceu != null:
		return _ceu
	var w := 480
	var h := 270
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var cores := [Color("1a1238"), Color("2c1a55"), Color("4a2370"), Color("7a2a72"), Color("b03c66"), Color("dc5f52"), Color("f08c48"), Color("fbb85a"), Color("ffd98a")]
	var bayer := [0.0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125]
	var fim := 196.0
	for y in h:
		var f := clampf(y / fim, 0.0, 0.999) * float(cores.size() - 1)
		var i := int(f)
		var frac := f - i
		var transicao := clampf((frac - 0.55) / 0.45, 0.0, 1.0)
		for x in w:
			var limiar: float = bayer[(x % 4) + 4 * (y % 4)]
			var k := mini(i + 1, cores.size() - 1) if transicao > limiar else i
			img.set_pixel(x, y, cores[k])
	_ceu = ImageTexture.create_from_image(img)
	return _ceu


static func cenario(c: CanvasItem, t: float) -> void:
	c.draw_texture_rect(_textura_ceu(), Rect2(0, 0, 1280, 720), false)
	# sol retrô com faixas
	var sol := Vector2(1010, 395)
	c.draw_circle(sol, 96, Color("ffe08a"))
	c.draw_circle(sol, 80, Color("fff1c2"))
	for i in 5:
		c.draw_rect(Rect2(sol.x - 100, sol.y + 8 + i * 16, 200, 4 + i), Color("f08c48"))
	# nuvens
	for i in 3:
		var x := fposmod(t * (6.0 + i * 3.0) + i * 470.0, 1600.0) - 160.0
		var y := 80.0 + i * 60.0
		for j in 4:
			c.draw_circle(Vector2(x + j * 30, y - (14 if j in [1, 2] else 0)), 24, Color("f7c7b0") if i < 2 else Color("ffe0c0"))
		c.draw_rect(Rect2(x - 20, y, 130, 16), Color("f7c7b0") if i < 2 else Color("ffe0c0"))
	_cidade(c)
	_pato(c, Vector2(170, 470), t)
	_van(c, Vector2(1080, 498))
	_bandeiras(c, t)
	_plateia(c, t)
	_grade(c)
	_chao(c)


static func _cidade(c: CanvasItem) -> void:
	var longe := Color("3a2456")
	var perto := Color("2a1a40")
	for i in 7:
		var x := 20.0 + i * 64.0
		c.draw_rect(Rect2(x, 400 - i * 6, 48, 120 + i * 6), longe)
		c.draw_rect(Rect2(1212 - x, 400 - i * 6, 48, 120 + i * 6), longe)
		for j in 6:
			if (i + j) % 3 != 0:
				c.draw_rect(Rect2(x + 8, 412 - i * 6 + j * 16, 32, 5), Color("ffcf7a", 0.55))
				c.draw_rect(Rect2(1220 - x, 412 - i * 6 + j * 16, 32, 5), Color("ffcf7a", 0.55))
	# Congresso Nacional
	c.draw_rect(Rect2(598, 230, 36, 270), perto)
	c.draw_rect(Rect2(646, 230, 36, 270), perto)
	c.draw_rect(Rect2(598, 300, 84, 10), perto)
	for j in 14:
		c.draw_rect(Rect2(604, 240 + j * 18, 24, 5), Color("ffcf7a", 0.7 if j % 3 else 0.25))
		c.draw_rect(Rect2(652, 240 + j * 18, 24, 5), Color("ffcf7a", 0.7 if (j + 1) % 3 else 0.25))
	c.draw_rect(Rect2(400, 470, 480, 28), perto)
	var cupula := PackedVector2Array()
	for i in 17:
		var a := lerpf(PI, TAU, i / 16.0)
		cupula.append(Vector2(500, 470) + Vector2(cos(a) * 66, sin(a) * 52))
	c.draw_colored_polygon(cupula, perto)
	c.draw_arc(Vector2(500, 470), 60, PI * 1.15, PI * 1.45, 8, Color("f08c48", 0.6), 4.0)
	var cuia := PackedVector2Array([Vector2(696, 430), Vector2(846, 430)])
	for i in 17:
		var a := lerpf(0.0, PI, i / 16.0)
		cuia.append(Vector2(771, 432) + Vector2(cos(a) * 75, sin(a) * 40))
	c.draw_colored_polygon(cuia, perto)
	c.draw_line(Vector2(700, 431), Vector2(842, 431), Color("f08c48", 0.8), 3.0)
	# gramado
	c.draw_rect(Rect2(0, 496, 1280, 40), Color("2f5a2e"))
	for i in 40:
		c.draw_rect(Rect2(i * 32 + (i % 3) * 5, 498 + (i % 2) * 6, 6, 4), Color("4a7d3a"))


static func _pato(c: CanvasItem, base: Vector2, t: float) -> void:
	# o famoso pato amarelo inflável das manifestações
	var bal := sin(t * 1.3) * 4.0
	var b := base + Vector2(0, bal)
	for passada in 2:
		_cont = passada == 0
		_circ(c, b + Vector2(0, -60), 70, Color("ffd23f"))
		_circ(c, b + Vector2(40, -150), 48, Color("ffd23f"))
		_poli(c, PackedVector2Array([b + Vector2(78, -158), b + Vector2(132, -148), b + Vector2(80, -134)]), Color("f28c28"))
	_cont = false
	c.draw_circle(b + Vector2(-10, -40), 46, Color("f2b81f"))
	c.draw_circle(b + Vector2(8, -76), 40, Color("ffd23f"))
	c.draw_circle(b + Vector2(56, -160), 9, BRANCO)
	c.draw_circle(b + Vector2(59, -160), 5, PRETO)
	c.draw_circle(b + Vector2(28, -170), 12, Color("fff3b0"))
	c.draw_line(b + Vector2(80, -146), b + Vector2(128, -148), Color("c96a18"), 3.0)


static func _van(c: CanvasItem, base: Vector2) -> void:
	for passada in 2:
		_cont = passada == 0
		_ret(c, Rect2(base + Vector2(-110, -96), Vector2(200, 80)), Color("e8ecf2"))
		_ret(c, Rect2(base + Vector2(60, -78), Vector2(48, 62)), Color("e8ecf2"))
		_circ(c, base + Vector2(-70, -12), 18, Color("1f1a24"))
		_circ(c, base + Vector2(60, -12), 18, Color("1f1a24"))
		_lin(c, base + Vector2(-40, -96), base + Vector2(-40, -130), Color("9aa0a6"), 5.0)
	_cont = false
	c.draw_rect(Rect2(base + Vector2(-110, -60), Vector2(218, 12)), Color("d62828"))
	c.draw_rect(Rect2(base + Vector2(72, -72), Vector2(30, 24)), Color("7ec8ff"))
	c.draw_arc(base + Vector2(-40, -140), 26, PI * 0.1, PI * 0.9, 12, Color("c9ced6"), 8.0)
	texto(c, base + Vector2(-12, -70), "TV TRETA", 30, Color("d62828"), BRANCO, 0)


static func _bandeiras(c: CanvasItem, t: float) -> void:
	for x in [330.0, 950.0]:
		c.draw_line(Vector2(x, 520), Vector2(x, 330), PRETO, 6.0)
		c.draw_line(Vector2(x, 520), Vector2(x, 330), Color("c9ced6"), 3.0)
		var pts := PackedVector2Array()
		var pts2 := PackedVector2Array()
		for i in 9:
			var px: float = x + i * 12.0
			var onda := sin(t * 5.0 - i * 0.7) * 6.0 * (i / 8.0)
			pts.append(Vector2(px, 336 + onda))
			pts2.append(Vector2(px, 392 + onda))
		pts2.reverse()
		var bandeira := pts + pts2
		c.draw_colored_polygon(bandeira, Color("1f9d55"))
		var losango := PackedVector2Array([Vector2(x + 48, 342 + sin(t * 5.0 - 3.0) * 3.0), Vector2(x + 90, 364), Vector2(x + 48, 386 + sin(t * 5.0 - 3.0) * 3.0), Vector2(x + 8, 364)])
		c.draw_colored_polygon(losango, Color("ffd23f"))
		c.draw_circle(Vector2(x + 48, 364 + sin(t * 5.0 - 3.0) * 3.0), 12, Color("2a4fa8"))


const CARTAZES := ["FAZ O L", "TÁ OK?", "MITO!", "INELEGÍVEL", "PICANHA JÁ", "CADÊ O PIX?", "DOBRA A META", "ABESTADO", "#FORA TODOS", "EU AVISEI"]


static func _plateia(c: CanvasItem, t: float) -> void:
	var camisas := [Color("ffd23f"), Color("1f9d55"), Color("d62828"), Color("f2f2f2"), Color("2a4fa8"), Color("ff7a2f")]
	var peles := [Color("f0c8a0"), Color("c88a5c"), Color("8a5a3a"), Color("e3a983"), Color("5c3a24")]
	var cabelos := [Color("2a1c14"), Color("6b3f22"), Color("c9c9c9"), Color("1a1a1a"), Color("a0522d")]
	for i in 13:
		var x := 60.0 + i * 96.0 + (i % 2) * 14.0
		var pulo := absf(sin(t * (4.0 + (i % 3)) + i * 1.7)) * 10.0
		var base := Vector2(x, 548 - pulo)
		var camisa: Color = camisas[(i * 7) % camisas.size()]
		var pele: Color = peles[(i * 3) % peles.size()]
		var cabelo: Color = cabelos[(i * 5) % cabelos.size()]
		var braco := sin(t * 6.0 + i) > 0.0
		var tem_cartaz := i % 3 == 1
		for passada in 2:
			_cont = passada == 0
			_ret(c, Rect2(base + Vector2(-22, -66), Vector2(44, 70)), camisa)
			_circ(c, base + Vector2(0, -88), 20, pele)
			if tem_cartaz:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-26, -130), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(26, -130), pele, 9.0)
			elif braco:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-34, -118), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(34, -118), pele, 9.0)
			else:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-30, -26), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(30, -26), pele, 9.0)
		_cont = false
		c.draw_arc(base + Vector2(0, -90), 19, PI * 1.05, PI * 1.95, 12, cabelo, 12.0)
		c.draw_circle(base + Vector2(-6, -88), 3, PRETO)
		c.draw_circle(base + Vector2(8, -88), 3, PRETO)
		c.draw_arc(base + Vector2(1, -80), 6, PI * 0.1, PI * 0.9, 6, PRETO, 2.5)
		c.draw_rect(Rect2(base + Vector2(-22, -66), Vector2(10, 70)), camisa.darkened(0.25))
		if tem_cartaz:
			var txt: String = CARTAZES[(i / 3 + int(t / 6.0)) % CARTAZES.size()]
			var largura := maxf(110.0, txt.length() * 22.0 + 20.0)
			var r := Rect2(base + Vector2(-largura / 2.0, -178), Vector2(largura, 52))
			c.draw_rect(r.grow(3), PRETO)
			c.draw_rect(r, BRANCO)
			texto(c, r.get_center() + Vector2(0, 11), txt, 22, Color("d62828") if i % 2 else Color("1f6f3a"), BRANCO, 0)


static func _grade(c: CanvasItem) -> void:
	# grade de contenção na frente da plateia
	var cor := Color("8a90a0")
	c.draw_rect(Rect2(0, 508, 1280, 7), PRETO)
	c.draw_rect(Rect2(0, 509, 1280, 4), cor)
	c.draw_rect(Rect2(0, 552, 1280, 7), PRETO)
	c.draw_rect(Rect2(0, 553, 1280, 4), cor.darkened(0.2))
	for i in 54:
		var x := i * 24.0
		c.draw_rect(Rect2(x, 511, 5, 46), PRETO)
		c.draw_rect(Rect2(x + 1, 512, 3, 44), cor)


static func _chao(c: CanvasItem) -> void:
	c.draw_rect(Rect2(0, 560, 1280, 160), Color("c2ad8a"))
	c.draw_rect(Rect2(0, 560, 1280, 10), Color("8a775e"))
	for i in 12:
		var y := 570.0 + pow(i / 11.0, 1.6) * 150.0
		c.draw_line(Vector2(0, y), Vector2(1280, y), Color("ad9878"), 3.0)
	for i in 21:
		c.draw_line(Vector2(640 + (i - 10) * 70, 570), Vector2(640 + (i - 10) * 160, 720), Color("ad9878"), 3.0)
	# rachaduras e manchas
	for i in 9:
		var x := 70.0 + i * 140.0
		c.draw_line(Vector2(x, 640 + (i % 3) * 20), Vector2(x + 26, 652 + (i % 3) * 20), Color("8a775e"), 3.0)
		c.draw_line(Vector2(x + 26, 652 + (i % 3) * 20), Vector2(x + 40, 646 + (i % 3) * 20), Color("8a775e"), 3.0)


# ---------------------------------------------------------------- texto pixelado

static func fonte() -> Font:
	if _fonte == null:
		var f := load("res://fontes/PressStart2P-Regular.ttf") as FontFile
		if f != null:
			f.antialiasing = TextServer.FONT_ANTIALIASING_NONE
			f.hinting = TextServer.HINTING_NONE
			f.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
			_fonte = f
		else:
			_fonte = ThemeDB.fallback_font
	return _fonte


## Tamanho em pixels reais (múltiplos de 8, que é a grade da fonte).
static func tamanho_real(t: int) -> int:
	return maxi(8, int(round(t * ESCALA / 8.0)) * 8)


## alinhamento: 0 = centro, 1 = esquerda, 2 = direita. pos em coordenadas do jogo (1280x720).
static func _texto_px(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, contorno: Color, borda: int, alinhamento: int) -> void:
	var f := fonte()
	var tam := tamanho_real(tamanho)
	# a fonte não tem o Í maiúsculo (sai minúsculo): no estilo fliperama, fica sem acento
	txt = txt.replace("Í", "I")
	var inv := 1.0 / ESCALA
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2(inv, inv))
	var w := f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam).x
	var p := pos * ESCALA
	if alinhamento == 0:
		p.x -= w / 2.0
	elif alinhamento == 2:
		p.x -= w
	p = p.floor()
	if borda > 0:
		var b := maxi(2, int(round(borda * ESCALA)))
		c.draw_string_outline(f, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, b, contorno)
	if contorno.a > 0.0 and borda > 0:
		c.draw_string(f, p + Vector2(1, 1), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, contorno)
	c.draw_string(f, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, cor)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func texto(c: CanvasItem, centro: Vector2, txt: String, tamanho: int, cor: Color, contorno: Color = PRETO, borda: int = 6) -> void:
	_texto_px(c, centro, txt, tamanho, cor, contorno, borda, 0)


static func texto_esq(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, borda: int = 0) -> void:
	_texto_px(c, pos, txt, tamanho, cor, PRETO, borda, 1)


static func texto_dir(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, borda: int = 0) -> void:
	_texto_px(c, pos, txt, tamanho, cor, PRETO, borda, 2)
