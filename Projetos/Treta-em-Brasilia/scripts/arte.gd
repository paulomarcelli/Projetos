class_name Arte
## Arte das habilidades, desenhada em código no estilo do resto (contorno escuro + cor):
## objetos na mão, projéteis novos, zonas, o caça que cruza o céu, a churrasqueira e o cadeado.
## As armas são brinquedos de videogame: cores fortes, formas gordas e ponta laranja.

const PRETO := Color("140c1c")
const BRANCO := Color("fbfbf7")


# ---------------------------------------------------------------- picanha

## Picanha de verdade: peça de carne em forma de cunha, capa de gordura branca no alto,
## marcas de grelha e brilho. Centro em 0,0, comprimento ~ 2*tam*28. Duas passadas (contorno e cor).
static func picanha(c: CanvasItem, centro: Vector2, ang: float, tam: float, cont: bool, assada := true) -> void:
	var carne := [Vector2(-28, -6), Vector2(-18, -16), Vector2(6, -18), Vector2(26, -12), Vector2(30, 0), Vector2(24, 12), Vector2(-4, 15), Vector2(-26, 9)]
	var gordura := [Vector2(-18, -16), Vector2(6, -18), Vector2(26, -12), Vector2(29, -5), Vector2(24, -6), Vector2(4, -11), Vector2(-17, -9), Vector2(-26, -2), Vector2(-28, -6)]
	var tr := func(pts: Array) -> PackedVector2Array:
		var out := PackedVector2Array()
		for q in pts:
			out.append(centro + ((q as Vector2) * tam).rotated(ang))
		return out
	Desenho._poli(c, tr.call(carne), Color("8c2f22") if assada else Color("b8473f"))
	if cont:
		return
	Desenho._dp(c, tr.call(carne.slice(3, 8)), Color("a8402c") if assada else Color("c85a4e"))
	Desenho._dp(c, tr.call(gordura), Color("f3e3c3"))
	Desenho._dp(c, tr.call([Vector2(-14, -13), Vector2(4, -15), Vector2(20, -10), Vector2(4, -12)]), Color("fff7e6"))
	if assada:
		for k in 3:
			var a := centro + (Vector2(-14 + k * 12, -4) * tam).rotated(ang)
			Desenho._dl(c, a, a + (Vector2(8, 10) * tam).rotated(ang), Color("3e140e"), maxf(2.0, 2.5 * tam))
	Desenho._dl(c, centro + (Vector2(-20, 6) * tam).rotated(ang), centro + (Vector2(16, 8) * tam).rotated(ang), Color(1, 0.8, 0.7, 0.35), 2.0)


# ---------------------------------------------------------------- objetos na mão

## Desenha o objeto em duas passadas (contorno e cor). ang gira em volta da mão.
static func prop(c: CanvasItem, nome: String, mao: Vector2, ang: float) -> void:
	for passada in 2:
		Desenho._cont = passada == 0
		_prop(c, nome, mao, ang)
	Desenho._cont = false
	_prop_detalhe(c, nome, mao, ang)


static func _rot(mao: Vector2, ang: float, pts: Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	for q in pts:
		out.append(mao + (q as Vector2).rotated(ang))
	return out


static func _prop(c: CanvasItem, nome: String, mao: Vector2, ang: float) -> void:
	match nome:
		"picanha_gigante":
			# espeto grosso com uma picanha enorme na ponta
			Desenho._lin(c, mao + Vector2(0, 10).rotated(ang), mao + Vector2(0, -40).rotated(ang), Color("9aa0a6"), 6.0)
			picanha(c, mao + Vector2(0, -82).rotated(ang), ang - PI / 2.0, 1.9, Desenho._cont)
		"espeto_cheio":
			Desenho._lin(c, mao + Vector2(-6, 10), mao + Vector2(30, -60), Color("9aa0a6"), 3.0)
			for k in 3:
				Desenho._circ(c, mao + Vector2(6 + k * 9, -14 - k * 15), 8.0, Color("a8432f"))
		"metralhadora":
			# metralhadora de brinquedo: corpo verde, tambor amarelo, cano gordo e ponta laranja
			Desenho._ret(c, Rect2(mao + Vector2(-40, -14), Vector2(84, 20)), Color("2f9e4e"))
			Desenho._ret(c, Rect2(mao + Vector2(44, -11), Vector2(34, 13)), Color("4a5060"))
			Desenho._ret(c, Rect2(mao + Vector2(78, -13), Vector2(12, 17)), Color("ff8a1e"))
			Desenho._circ(c, mao + Vector2(-6, 14), 13.0, Color("ffd23f"))
			Desenho._ret(c, Rect2(mao + Vector2(-56, -12), Vector2(16, 24)), Color("2f9e4e"))
		"fuzil":
			# fuzil de brinquedo: corpo verde, pente amarelo, cano gordo e ponta laranja
			Desenho._ret(c, Rect2(mao + Vector2(-34, -12), Vector2(70, 16)), Color("2f9e4e"))
			Desenho._ret(c, Rect2(mao + Vector2(36, -9), Vector2(26, 10)), Color("4a5060"))
			Desenho._ret(c, Rect2(mao + Vector2(62, -11), Vector2(10, 14)), Color("ff8a1e"))
			Desenho._ret(c, Rect2(mao + Vector2(-6, 4), Vector2(12, 18)), Color("ffd23f"))
			Desenho._ret(c, Rect2(mao + Vector2(-44, -10), Vector2(12, 20)), Color("2f9e4e"))
		"frasco":
			Desenho._ret(c, Rect2(mao + Vector2(-10, -40), Vector2(20, 30)), BRANCO)
			Desenho._ret(c, Rect2(mao + Vector2(-7, -48), Vector2(14, 8)), Color("2f6fdb"))
		"caneta":
			Desenho._poli(c, _rot(mao, -0.5, [Vector2(-6, 20), Vector2(6, 20), Vector2(6, -70), Vector2(0, -84), Vector2(-6, -70)]), Color("1f3f9a"))
		"carimbo":
			Desenho._lin(c, mao, mao + Vector2(14, 0), Color("8a5a35"), 10.0)
			Desenho._ret(c, Rect2(mao + Vector2(14, -16), Vector2(16, 32)), Color("d62828"))
		"L":
			# o "L" com a mão: polegar para cima e indicador para a frente
			Desenho._lin(c, mao, mao + Vector2(0, -34), Color("e8a07a"), 9.0)
			Desenho._lin(c, mao, mao + Vector2(24, 0), Color("e8a07a"), 9.0)


static func _prop_detalhe(c: CanvasItem, nome: String, mao: Vector2, ang: float) -> void:
	match nome:
		"picanha_gigante":
			picanha(c, mao + Vector2(0, -82).rotated(ang), ang - PI / 2.0, 1.9, false)
		"metralhadora":
			Desenho._dr(c, Rect2(mao + Vector2(-36, -12), Vector2(76, 5)), Color("6fd36f"))
			Desenho._dc(c, mao + Vector2(-6, 14), 6.0, Color("c9a227"))
			for k in 4:
				Desenho._dr(c, Rect2(mao + Vector2(48 + k * 7, -10), Vector2(3, 11)), Color("2a2e38"))
			Desenho._estrela(c, mao + Vector2(4, -4), 5.0, Color("ffd23f"))
		"espeto_cheio":
			for k in 3:
				Desenho._dc(c, mao + Vector2(8 + k * 9, -16 - k * 15), 3.0, Color("f3c3a3"))
		"fuzil":
			Desenho._dr(c, Rect2(mao + Vector2(-30, -10), Vector2(62, 4)), Color("6fd36f"))
			Desenho._estrela(c, mao + Vector2(4, -4), 5.0, Color("ffd23f"))
		"frasco":
			Desenho._dr(c, Rect2(mao + Vector2(-8, -32), Vector2(16, 12)), Color("7ec8ff"))
			Desenho._dr(c, Rect2(mao + Vector2(-2, -30), Vector2(4, 8)), Color("2f6fdb"))
		"caneta":
			Desenho._dp(c, _rot(mao, -0.5, [Vector2(6, -70), Vector2(0, -84), Vector2(-6, -70)]), Color("c9a227"))
			Desenho._dl(c, mao + Vector2(4, 14).rotated(-0.5), mao + Vector2(4, -60).rotated(-0.5), Color("5a7fe0"), 2.0)
		"carimbo":
			Desenho._dr(c, Rect2(mao + Vector2(28, -16), Vector2(4, 32)), Color("ff8a8a"))


# ---------------------------------------------------------------- projéteis novos (centro 0,0, indo para +x)

static func projetil(c: CanvasItem, forma: String, t: int, cont: bool) -> void:
	match forma:
		"pix":
			# losango verde-água girando com "PIX" e o contador de views pulsando
			var g := t * 0.18
			var r := 30.0 + sin(t * 0.5) * 2.0
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(0, -r), Vector2(r, 0), Vector2(0, r), Vector2(-r, 0)]), Color("32bcad"))
			if not cont:
				Desenho._dp(c, _rot(Vector2.ZERO, g, [Vector2(0, -r * 0.62), Vector2(r * 0.62, 0), Vector2(0, r * 0.62), Vector2(-r * 0.62, 0)]), Color("1f8f84"))
				Desenho.letras_px(c, Vector2(-10.5, -6), "PIX", 2.0, BRANCO)
				Desenho._da(c, Vector2.ZERO, r + 8.0, -t * 0.2, -t * 0.2 + 2.0, 10, Color(0.6, 1, 0.95, 0.6), 3.0)
		"curtida":
			# coração de curtida
			Desenho._circ(c, Vector2(-8, -6), 11.0, Color("ff3b6b"))
			Desenho._circ(c, Vector2(8, -6), 11.0, Color("ff3b6b"))
			Desenho._poli(c, PackedVector2Array([Vector2(-18, -2), Vector2(18, -2), Vector2(0, 20)]), Color("ff3b6b"))
			if not cont:
				Desenho._dc(c, Vector2(-10, -10), 3.5, Color(1, 1, 1, 0.7))
		"play":
			# botão de play vermelho de vídeo
			Desenho._poli(c, PackedVector2Array([Vector2(-26, -18), Vector2(26, -18), Vector2(28, -12), Vector2(28, 12), Vector2(26, 18), Vector2(-26, 18), Vector2(-28, 12), Vector2(-28, -12)]), Color("e5243b"))
			if not cont:
				Desenho._dp(c, PackedVector2Array([Vector2(-7, -10), Vector2(11, 0), Vector2(-7, 10)]), BRANCO)
		"revogado":
			# carimbo gigante caindo com REVOGADO
			Desenho._lin(c, Vector2(0, -70), Vector2(0, -36), Color("8a5a35"), 14.0)
			Desenho._circ(c, Vector2(0, -74), 13.0, Color("8a5a35"))
			Desenho._poli(c, PackedVector2Array([Vector2(-58, -36), Vector2(58, -36), Vector2(58, 10), Vector2(-58, 10)]), Color("e5243b"))
			if not cont:
				Desenho._dr(c, Rect2(-54, -32, 108, 38), Color("ff6b6b"))
				Desenho.letras_px(c, Vector2(-50, -24), "REVOGADO", 3.0, BRANCO)
		"rec":
			# celular gravando: tela com o ponto vermelho piscando e o flash estourando na frente
			if not cont:
				var f := 0.6 + 0.4 * sin(t * 0.9)
				Desenho._dp(c, PackedVector2Array([Vector2(14, -6), Vector2(70, -30), Vector2(70, 30), Vector2(14, 6)]), Color(1, 1, 0.85, 0.28 * f))
			Desenho._poli(c, PackedVector2Array([Vector2(-16, -26), Vector2(16, -26), Vector2(16, 26), Vector2(-16, 26)]), Color("1f1a24"))
			if not cont:
				Desenho._dr(c, Rect2(-12, -21, 24, 40), Color("2a2f45"))
				if (t / 8) % 2 == 0:
					Desenho._dc(c, Vector2(-5, -14), 4.0, Color("ff2d3d"))
				Desenho._dr(c, Rect2(1, -16, 9, 3), BRANCO)
				Desenho._dc(c, Vector2(10, 18), 3.0, Color("fff3b0"))
		"mala":
			# mala de bordo com etiqueta, girando no ar
			var g := t * 0.22
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(-26, -18), Vector2(26, -18), Vector2(26, 22), Vector2(-26, 22)]), Color("2f3b5c"))
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(-8, -30), Vector2(8, -30), Vector2(8, -18), Vector2(-8, -18)]), Color("1a1f30"))
			if not cont:
				for j in 3:
					Desenho._dl(c, Vector2(-16 + j * 16, -16).rotated(g), Vector2(-16 + j * 16, 20).rotated(g), Color("44527a"), 2.0)
				Desenho._dr(c, Rect2(Vector2(10, 2).rotated(g), Vector2(10, 8)), Color("ffd23f"))
		"voto":
			# cédula com o X marcado, balançando ao cair
			var g2 := sin(t * 0.25) * 0.3
			Desenho._poli(c, _rot(Vector2.ZERO, g2, [Vector2(-22, -14), Vector2(22, -14), Vector2(22, 14), Vector2(-22, 14)]), BRANCO)
			if not cont:
				Desenho._dr(c, Rect2(Vector2(-18, -10).rotated(g2), Vector2(10, 10)), Color("1f6fd1"))
				Desenho._dl(c, Vector2(-16, -8).rotated(g2), Vector2(-10, -2).rotated(g2), BRANCO, 2.0)
				Desenho._dl(c, Vector2(-10, -8).rotated(g2), Vector2(-16, -2).rotated(g2), BRANCO, 2.0)
				for j in 3:
					Desenho._dl(c, Vector2(-2, -8 + j * 7).rotated(g2), Vector2(18, -8 + j * 7).rotated(g2), Color("9aa0a6"), 2.0)
		"pec":
			# a PEC: pasta dourada com o documento saindo, carimbo vermelho "6x1" riscado e brilho
			var g := sin(t * 0.3) * 0.18
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(-30, -22), Vector2(30, -22), Vector2(30, 24), Vector2(-30, 24)]), Color("f2c230"))
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(-24, -34), Vector2(22, -34), Vector2(22, 10), Vector2(-24, 10)]), BRANCO)
			if not cont:
				for j in 3:
					Desenho._dl(c, Vector2(-18, -26 + j * 7).rotated(g), Vector2(16, -26 + j * 7).rotated(g), Color("9aa0a6"), 2.0)
				_seis_x_um(c, Vector2(0, -6), 1.0, g, Color("d62828"))
				Desenho._dl(c, Vector2(-16, 8).rotated(g), Vector2(16, -6).rotated(g), Color("d62828"), 4.0)
				Desenho._dr(c, Rect2(-30, 12, 60, 4), Color("c9a227"))
				for j in 3:
					var r := 38.0 + j * 9.0 + fmod(t * 1.2, 9.0)
					Desenho._da(c, Vector2(-4, 0), r, PI - 0.6, PI + 0.6, 8, Color(1, 0.85, 0.3, 0.7 - j * 0.22), 3.0)
		"oficio":
			# ofício de representação girando como bumerangue, com selo e rastro
			var g3 := t * 0.45
			if not cont:
				for j in 3:
					Desenho._da(c, Vector2.ZERO, 30.0 + j * 4.0, g3 + PI + j * 0.4, g3 + PI * 1.6 + j * 0.4, 8, Color(1, 1, 1, 0.45 - j * 0.12), 4.0)
			Desenho._poli(c, _rot(Vector2.ZERO, g3, [Vector2(-22, -28), Vector2(22, -28), Vector2(22, 28), Vector2(-22, 28)]), BRANCO)
			if not cont:
				for j in 4:
					Desenho._dl(c, Vector2(-15, -18 + j * 8).rotated(g3), Vector2(15, -18 + j * 8).rotated(g3), Color("9aa0a6"), 2.0)
				Desenho._dc(c, Vector2(8, 16).rotated(g3), 8.0, Color("e5243b"))
				Desenho._dc(c, Vector2(8, 16).rotated(g3), 4.0, Color("ffd23f"))
		"calendario":
			# folhinha de calendário caindo: argolas, cabeçalho vermelho, "6x1" e um X por cima
			var g4 := sin(t * 0.2) * 0.12
			Desenho._poli(c, _rot(Vector2.ZERO, g4, [Vector2(-30, -34), Vector2(30, -34), Vector2(30, 34), Vector2(-30, 34)]), BRANCO)
			Desenho._poli(c, _rot(Vector2.ZERO, g4, [Vector2(-30, -34), Vector2(30, -34), Vector2(30, -18), Vector2(-30, -18)]), Color("e5243b"))
			if not cont:
				for j in 2:
					Desenho._dc(c, Vector2(-14 + j * 28, -36).rotated(g4), 4.0, Color("4a4a55"))
				for i in 4:
					for j in 3:
						Desenho._dr(c, Rect2((Vector2(-24 + i * 13, -12 + j * 9)).rotated(g4), Vector2(8, 5)), Color("d0d4dc"))
				_seis_x_um(c, Vector2(0, 6), 1.1, g4, PRETO)
				Desenho._dl(c, Vector2(-22, -10).rotated(g4), Vector2(22, 28).rotated(g4), Color("e5243b"), 5.0)
				Desenho._dl(c, Vector2(22, -10).rotated(g4), Vector2(-22, 28).rotated(g4), Color("e5243b"), 5.0)
		"picanha_fogo":
			if not cont:
				# chamas atrás (o projétil vai para +x)
				for j in 5:
					var fx := -26.0 - j * 9.0
					var fy := sin(t * 0.8 + j) * 5.0
					Desenho._dc(c, Vector2(fx, fy), 12.0 - j * 1.8, Color("ffd23f") if j % 2 == 0 else Color("ff7a2f"))
			picanha(c, Vector2.ZERO, t * 0.25, 1.0, cont)
		"carimbo_gigante":
			# carimbo de borracha gigante caindo: cabo de madeira e base vermelha com a tarja
			Desenho._lin(c, Vector2(0, -60), Vector2(0, -30), Color("8a5a35"), 14.0)
			Desenho._circ(c, Vector2(0, -64), 13.0, Color("8a5a35"))
			Desenho._ret(c, Rect2(-44, -30, 88, 22), Color("6b4226"))
			Desenho._ret(c, Rect2(-48, -8, 96, 16), Color("d62828"))
			if not cont:
				Desenho._dr(c, Rect2(-40, -26, 80, 4), Color("8a5a35"))
				Desenho._dr(c, Rect2(-40, -4, 80, 8), Color("140c1c"))
		"discurso":
			# balão de fala gigante com ondas de som na frente
			Desenho._poli(c, PackedVector2Array([Vector2(-30, -22), Vector2(26, -22), Vector2(30, 18), Vector2(-4, 18), Vector2(-20, 32), Vector2(-16, 18), Vector2(-30, 18)]), BRANCO)
			if not cont:
				for j in 3:
					Desenho._dr(c, Rect2(Vector2(-18 + j * 14, -4), Vector2(8, 8)), Color("d62828"))
				for j in 3:
					var r := 34.0 + j * 10.0 + fmod(t * 1.5, 10.0)
					Desenho._da(c, Vector2(10, 0), r, -0.7, 0.7, 10, Color(1, 0.9, 0.4, 0.8 - j * 0.25), 4.0)
		"comida":
			# linguiça e pão de alho alternando
			if (t / 20) % 2 == 0:
				Desenho._poli(c, PackedVector2Array([Vector2(-22, -6), Vector2(18, -10), Vector2(24, 0), Vector2(18, 10), Vector2(-22, 6), Vector2(-26, 0)]), Color("a8432f"))
				if not cont:
					Desenho._dl(c, Vector2(-16, -2), Vector2(14, -5), Color("d9765f"), 3.0)
			else:
				Desenho._ret(c, Rect2(-20, -9, 40, 18), Color("e8c06a"))
				if not cont:
					for j in 3:
						Desenho._dl(c, Vector2(-12 + j * 12, -8), Vector2(-8 + j * 12, 8), Color("b07a2a"), 3.0)
		"rolha":
			# dardo de espuma: corpo azul e ponta laranja (brinquedo)
			Desenho._ret(c, Rect2(-16, -6, 22, 12), Color("2a9df4"))
			Desenho._circ(c, Vector2(10, 0), 8.0, Color("ff8a1e"))
			if not cont:
				Desenho._dl(c, Vector2(-30, 0), Vector2(-18, 0), Color(1, 1, 1, 0.7), 3.0)
		"frasco":
			var g := t * 0.35
			var pts := [Vector2(-10, -18), Vector2(10, -18), Vector2(10, 18), Vector2(-10, 18)]
			Desenho._poli(c, _rot(Vector2.ZERO, g, pts), BRANCO)
			Desenho._poli(c, _rot(Vector2.ZERO, g, [Vector2(-7, -26), Vector2(7, -26), Vector2(7, -18), Vector2(-7, -18)]), Color("2f6fdb"))
			if not cont:
				Desenho._dp(c, _rot(Vector2.ZERO, g, [Vector2(-8, -6), Vector2(8, -6), Vector2(8, 8), Vector2(-8, 8)]), Color("7ec8ff"))
		"onda":
			if not cont:
				for j in 4:
					var r := 14.0 + j * 9.0
					Desenho._da(c, Vector2(-j * 6.0, 0), r, -1.0, 1.0, 12, Color(1, 0.95, 0.6, 0.95 - j * 0.2), 6.0 - j)
				Desenho._dc(c, Vector2(-6, 0), 8.0, Color(1, 1, 1, 0.8))
		"selo":
			Desenho._circ(c, Vector2.ZERO, 30.0, Color("d62828"))
			if not cont:
				Desenho._da(c, Vector2.ZERO, 24.0, 0, TAU, 24, BRANCO, 3.0)
				cadeado(c, Vector2(0, 2), 0.9)
		"documento":
			var g2 := sin(t * 0.25) * 0.25
			Desenho._poli(c, _rot(Vector2.ZERO, g2, [Vector2(-28, -36), Vector2(28, -36), Vector2(28, 36), Vector2(-28, 36)]), BRANCO)
			if not cont:
				for j in 6:
					Desenho._dl(c, Vector2(-20, -26 + j * 9).rotated(g2), Vector2(20, -26 + j * 9).rotated(g2), Color("9aa0a6"), 2.0)
				Desenho._da(c, Vector2(10, 18).rotated(g2), 12.0, 0, TAU, 16, Color("d62828"), 4.0)
				Desenho._dl(c, Vector2(-18, 26).rotated(g2), Vector2(-2, 22).rotated(g2), Color("1f3f9a"), 3.0)
		"bomba":
			Desenho._circ(c, Vector2.ZERO, 20.0, Color("2a2230"))
			Desenho._lin(c, Vector2(8, -16), Vector2(14, -28), Color("8a5a35"), 3.0)
			if not cont:
				Desenho._dr(c, Rect2(-20, -4, 40, 8), Color("d62828"))
				Desenho._dr(c, Rect2(-20, -1, 40, 2), BRANCO)
				Desenho._dc(c, Vector2(-7, -8), 5.0, Color(1, 1, 1, 0.4))
				var faisca := Vector2(14, -30)
				for j in 4:
					var a := j * PI / 2.0 + t * 0.6
					Desenho._dl(c, faisca, faisca + Vector2(cos(a), sin(a)) * 7.0, Color("ffd23f"), 2.0)
		"notificacao":
			Desenho._poli(c, PackedVector2Array([Vector2(-22, -16), Vector2(22, -16), Vector2(22, 12), Vector2(-4, 12), Vector2(-14, 22), Vector2(-12, 12), Vector2(-22, 12)]), BRANCO)
			Desenho._circ(c, Vector2(20, -16), 9.0, Color("ff3b6b"))
			if not cont:
				Desenho._dc(c, Vector2(-8, -2), 5.0, Color("ff3b6b"))
				Desenho._dc(c, Vector2(0, -2), 5.0, Color("ff3b6b"))
				Desenho._dp(c, PackedVector2Array([Vector2(-13, 0), Vector2(5, 0), Vector2(-4, 9)]), Color("ff3b6b"))
				Desenho._dr(c, Rect2(18, -21, 4, 6), BRANCO)
				Desenho._dr(c, Rect2(18, -13, 4, 3), BRANCO)


## "6x1" desenhado com traços (dentro de projéteis girando não dá para usar a fonte).
static func _seis_x_um(c: CanvasItem, centro: Vector2, s: float, g: float, cor: Color) -> void:
	var r := func(v: Vector2) -> Vector2: return centro + (v * s).rotated(g)
	# 6
	Desenho._da(c, r.call(Vector2(-14, 3)), 5.0 * s, 0.0, TAU, 10, cor, 2.5)
	Desenho._dl(c, r.call(Vector2(-19, 3)), r.call(Vector2(-16, -8)), cor, 2.5)
	Desenho._dl(c, r.call(Vector2(-16, -8)), r.call(Vector2(-11, -9)), cor, 2.5)
	# x
	Desenho._dl(c, r.call(Vector2(-4, -2)), r.call(Vector2(4, 8)), cor, 2.5)
	Desenho._dl(c, r.call(Vector2(4, -2)), r.call(Vector2(-4, 8)), cor, 2.5)
	# 1
	Desenho._dl(c, r.call(Vector2(14, -9)), r.call(Vector2(14, 8)), cor, 2.5)
	Desenho._dl(c, r.call(Vector2(14, -9)), r.call(Vector2(10, -5)), cor, 2.5)


# ---------------------------------------------------------------- zonas (base no chão em 0,0)

static func zona(c: CanvasItem, forma: String, larg: float, alt: float, t: int, k: float) -> void:
	var meia := larg / 2.0
	match forma:
		"fumaca":
			for i in 9:
				var x := -meia + fposmod(i * larg / 9.0 + t * 0.6, larg)
				var y := -40.0 - fposmod(i * 37.0 + t * 1.2, alt - 40.0)
				var r := 26.0 + 10.0 * sin(t * 0.05 + i)
				Desenho._dc(c, Vector2(x, y), r, Color(0.55, 0.55, 0.6, 0.45 * k))
				Desenho._dc(c, Vector2(x - 8, y - 6), r * 0.6, Color(0.75, 0.75, 0.8, 0.35 * k))
		"nuvem":
			for i in 10:
				var x := -meia + fposmod(i * larg / 10.0 + sin(t * 0.03 + i) * 20.0, larg)
				var y := -20.0 - fposmod(i * 23.0 + t * 0.5, 160.0)
				Desenho._dc(c, Vector2(x, y), 22.0 + 6.0 * sin(t * 0.07 + i), Color(0.45, 0.85, 0.35, 0.4 * k))
			for i in 4:
				var x2 := -meia * 0.6 + i * meia * 0.4
				var y2 := -50.0 - fposmod(t * 1.5 + i * 40.0, 140.0)
				Desenho._dc(c, Vector2(x2, y2), 5.0, Color(0.8, 1.0, 0.7, 0.8 * k))
		"suspensao":
			Desenho._dr(c, Rect2(-meia, -alt, larg, alt), Color(0.85, 0.1, 0.15, 0.18 * k))
			# fitas de interdição listradas no alto e no chão
			for y in [-alt, -24.0]:
				Desenho._dr(c, Rect2(-meia, y, larg, 18), Color(0.1, 0.05, 0.05, 0.7 * k))
				for j in int(larg / 24.0) + 1:
					var x := -meia + j * 24.0 + fmod(t * 0.8, 24.0)
					if x < meia - 12:
						Desenho._dp(c, PackedVector2Array([Vector2(x, y), Vector2(x + 12, y), Vector2(x + 4, y + 18), Vector2(x - 8, y + 18)]), Color(1, 0.82, 0.25, 0.9 * k))
			Desenho._dr(c, Rect2(-meia, -alt, 6, alt), Color(1, 0.3, 0.3, 0.7 * k))
			Desenho._dr(c, Rect2(meia - 6, -alt, 6, alt), Color(1, 0.3, 0.3, 0.7 * k))
			cadeado(c, Vector2(0, -alt * 0.55 + sin(t * 0.1) * 6.0), 1.6 * k)
			var cor := Color("ff5a4e")
			cor.a = k
			Desenho.texto(c, Vector2(0, -alt * 0.25), "SUSPENSO", 26, cor, Color(0, 0, 0, k), 6)
		"antiwoke":
			# muro de escudos azuis com faixa ANTIWOKE: apaga projéteis que entram
			var sobe := clampf(t / 10.0, 0.0, 1.0)
			var h := 190.0 * sobe
			Desenho._dr(c, Rect2(-meia - 4, -h - 4, larg + 8, h + 4), Color(0.05, 0.04, 0.1, 0.9 * k))
			Desenho._dr(c, Rect2(-meia, -h, larg, h), Color(0.12, 0.43, 0.82, 0.75 * k))
			for j in 4:
				var y := -h + 12.0 + j * 46.0
				if y < -20.0:
					Desenho._dr(c, Rect2(-meia + 6, y, larg - 12, 3), Color(1, 1, 1, 0.35 * k))
			Desenho._dc(c, Vector2(0, -h * 0.55), 26.0 * sobe, Color(1, 0.84, 0.25, k))
			Desenho._dc(c, Vector2(0, -h * 0.55), 19.0 * sobe, Color(0.12, 0.43, 0.82, k))
			Desenho._dl(c, Vector2(-12, -h * 0.55 - 12), Vector2(12, -h * 0.55 + 12), Color(1, 0.84, 0.25, k), 5.0)
			var cor2 := Color.WHITE
			cor2.a = k
			Desenho.texto(c, Vector2(0, -h - 14), "ANTIWOKE", 22, cor2, Color(0.1, 0.1, 0.3, k), 5)
		"assinaturas":
			# o rolo do abaixo-assinado se desenrola pelo chão: folha comprida com linhas de assinatura
			var abre := clampf(t / 18.0, 0.0, 1.0)
			var w := larg * abre
			Desenho._dr(c, Rect2(-meia - 4, -50, w + 8, 54), Color(0.08, 0.05, 0.12, 0.85 * k))
			Desenho._dr(c, Rect2(-meia, -46, w, 46), Color(0.98, 0.96, 0.9, k))
			Desenho._dr(c, Rect2(-meia, -46, w, 7), Color(0.9, 0.14, 0.23, k))
			var n := int(w / 20.0)
			for i in n:
				for linha in 2:
					var x := -meia + 6 + i * 20.0
					var y := -26.0 + linha * 14.0 + sin(i * 1.7 + linha) * 3.0
					Desenho._dl(c, Vector2(x, y), Vector2(x + 6, y - 5), Color(0.1, 0.2, 0.6, k), 2.0)
					Desenho._dl(c, Vector2(x + 6, y - 5), Vector2(x + 13, y + 2), Color(0.1, 0.2, 0.6, k), 2.0)
			# o rolo na ponta, girando
			var rx := -meia + w
			Desenho._dc(c, Vector2(rx, -24), 26.0, Color(0.08, 0.05, 0.12, k))
			Desenho._dc(c, Vector2(rx, -24), 22.0, Color(0.98, 0.96, 0.9, k))
			Desenho._da(c, Vector2(rx, -24), 14.0, t * 0.3, t * 0.3 + 4.5, 12, Color(0.6, 0.6, 0.66, k), 3.0)
			Desenho._da(c, Vector2(rx, -24), 7.0, t * 0.3 + 1.0, t * 0.3 + 5.0, 10, Color(0.6, 0.6, 0.66, k), 2.0)
			# contador de assinaturas subindo
			var cor := Color("ffd23f")
			cor.a = k
			Desenho.texto(c, Vector2(0, -92 - sin(t * 0.1) * 4.0), "+%d MIL ASSINATURAS" % (100 + t * 7), 20, cor, Color(0, 0, 0, k), 5)
		"votos":
			for i in 10:
				var a := t * 0.12 + i * TAU / 10.0
				var pos := Vector2(cos(a) * meia, -120.0 + sin(a) * 60.0)
				Desenho._dr(c, Rect2(pos - Vector2(13, 9), Vector2(26, 18)), Color(0.08, 0.05, 0.12, k))
				Desenho._dr(c, Rect2(pos - Vector2(11, 7), Vector2(22, 14)), Color(1, 1, 1, k))
				Desenho._dl(c, pos + Vector2(-6, 0), pos + Vector2(-2, 4), Color("1f9d55"), 2.0)
				Desenho._dl(c, pos + Vector2(-2, 4), pos + Vector2(6, -4), Color("1f9d55"), 2.0)


# ---------------------------------------------------------------- outros

## O caça estilizado cruza o céu soltando o ataque (coordenadas da tela).
static func veiculo_ceu(c: CanvasItem, forma: String, t: int, dur: int, dir: int) -> void:
	var k := float(t) / float(dur)
	var x := lerpf(-320.0, 1600.0, k) if dir > 0 else lerpf(1600.0, -320.0, k)
	var y := 120.0 + sin(k * PI) * 30.0
	var base := Transform2D(0.0, Vector2(dir * 1.3, 1.3), 0.0, Vector2(x, y))
	Desenho._dm(c, base)
	if forma == "esquadrilha":
		# três caças em formação (o do meio na frente)
		Desenho._dm(c, Transform2D.IDENTITY)
		for j in [1, 2, 0]:
			var off := Vector2(-dir * 150.0 * (1 if j > 0 else 0), (-46.0 if j == 1 else (46.0 if j == 2 else 0.0)))
			_caca(c, Transform2D(0.0, Vector2(dir * 1.2, 1.2), 0.0, Vector2(x, y) + off), t)
		return
	if forma == "caca":
		for passada in 2:
			Desenho._cont = passada == 0
			Desenho._poli(c, PackedVector2Array([Vector2(-110, -6), Vector2(70, -10), Vector2(110, 0), Vector2(70, 10), Vector2(-110, 8)]), Color("8a94a6"))
			Desenho._poli(c, PackedVector2Array([Vector2(-20, 0), Vector2(30, 0), Vector2(-50, 50), Vector2(-80, 50)]), Color("6f7a8c"))
			Desenho._poli(c, PackedVector2Array([Vector2(-20, 0), Vector2(30, 0), Vector2(-50, -40), Vector2(-80, -40)]), Color("7a8496"))
			Desenho._poli(c, PackedVector2Array([Vector2(-110, -6), Vector2(-86, -6), Vector2(-104, -44), Vector2(-122, -44)]), Color("6f7a8c"))
		Desenho._cont = false
		Desenho._dp(c, PackedVector2Array([Vector2(40, -9), Vector2(76, -8), Vector2(66, -2), Vector2(40, -3)]), Color("7ec8ff"))
		Desenho._dr(c, Rect2(-100, -2, 160, 4), Color("d62828"))
		# chama do motor
		var f := 30.0 + sin(t * 1.3) * 10.0
		Desenho._dp(c, PackedVector2Array([Vector2(-110, -6), Vector2(-110 - f, 0), Vector2(-110, 8)]), Color("ffb03a"))
		Desenho._dp(c, PackedVector2Array([Vector2(-110, -3), Vector2(-110 - f * 0.5, 1), Vector2(-110, 5)]), Color("fff3b0"))
		for j in 3:
			Desenho._dl(c, Vector2(-150 - j * 40, -20 + j * 16), Vector2(-260 - j * 40, -20 + j * 16), Color(1, 1, 1, 0.5), 3.0)
	Desenho._dm(c, Transform2D.IDENTITY)


static func _caca(c: CanvasItem, base: Transform2D, t: int) -> void:
	Desenho._dm(c, base)
	for passada in 2:
		Desenho._cont = passada == 0
		Desenho._poli(c, PackedVector2Array([Vector2(-110, -6), Vector2(70, -10), Vector2(110, 0), Vector2(70, 10), Vector2(-110, 8)]), Color("8a94a6"))
		Desenho._poli(c, PackedVector2Array([Vector2(-20, 0), Vector2(30, 0), Vector2(-50, 50), Vector2(-80, 50)]), Color("6f7a8c"))
		Desenho._poli(c, PackedVector2Array([Vector2(-20, 0), Vector2(30, 0), Vector2(-50, -40), Vector2(-80, -40)]), Color("7a8496"))
		Desenho._poli(c, PackedVector2Array([Vector2(-110, -6), Vector2(-86, -6), Vector2(-104, -44), Vector2(-122, -44)]), Color("6f7a8c"))
	Desenho._cont = false
	Desenho._dp(c, PackedVector2Array([Vector2(40, -9), Vector2(76, -8), Vector2(66, -2), Vector2(40, -3)]), Color("7ec8ff"))
	Desenho._dr(c, Rect2(-100, -2, 160, 4), Color("d62828"))
	var f := 30.0 + sin(t * 1.3) * 10.0
	Desenho._dp(c, PackedVector2Array([Vector2(-110, -6), Vector2(-110 - f, 0), Vector2(-110, 8)]), Color("ffb03a"))
	Desenho._dp(c, PackedVector2Array([Vector2(-110, -3), Vector2(-110 - f * 0.5, 1), Vector2(-110, 5)]), Color("fff3b0"))
	Desenho._dm(c, Transform2D.IDENTITY)


## Tarja de censura: mosaico de pixels sobre o rosto e a barra preta nos olhos (coordenadas do boneco).
static func censura(c: CanvasItem, topo: Vector2, t: int) -> void:
	var lado := 13.0
	for i in 5:
		for j in 5:
			var h := int(i * 7 + j * 13 + t / 6) % 5
			var cor: Color = [Color("c88a6a"), Color("a86a50"), Color("e0a888"), Color("8a5040"), Color("6a4a3a")][h]
			Desenho._dr(c, Rect2(topo + Vector2(-34 + i * lado, j * lado), Vector2(lado, lado)), cor)
	Desenho._dr(c, Rect2(topo + Vector2(-44, 16), Vector2(88, 18)), Color("0a0a0a"))


## Churrasqueira no chão, na frente do Lula (coordenadas do boneco, pés em 0,0).
static func churrasqueira(c: CanvasItem, pos: Vector2, t: int) -> void:
	for passada in 2:
		Desenho._cont = passada == 0
		Desenho._lin(c, pos + Vector2(-30, 0), pos + Vector2(-20, -50), Color("4a4a55"), 5.0)
		Desenho._lin(c, pos + Vector2(30, 0), pos + Vector2(20, -50), Color("4a4a55"), 5.0)
		Desenho._ret(c, Rect2(pos + Vector2(-42, -70), Vector2(84, 22)), Color("2a2230"))
	Desenho._cont = false
	Desenho._dr(c, Rect2(pos + Vector2(-38, -74), Vector2(76, 6)), Color("9aa0a6"))
	for j in 6:
		var x := -34.0 + j * 13.0
		var h := 10.0 + 8.0 * absf(sin(t * 0.3 + j))
		Desenho._dp(c, PackedVector2Array([pos + Vector2(x, -74), pos + Vector2(x + 6, -74 - h), pos + Vector2(x + 12, -74)]), Color("ff7a2f") if j % 2 else Color("ffd23f"))
	Desenho._dr(c, Rect2(pos + Vector2(-36, -66), Vector2(72, 8)), Color("e8582a"))


static func cadeado(c: CanvasItem, pos: Vector2, s: float) -> void:
	if s <= 0.01:
		return
	Desenho._da(c, pos + Vector2(0, -10) * s, 9.0 * s, PI, TAU, 10, PRETO, 7.0 * s)
	Desenho._da(c, pos + Vector2(0, -10) * s, 9.0 * s, PI, TAU, 10, Color("c9ced6"), 4.0 * s)
	Desenho._dr(c, Rect2(pos + Vector2(-14, -10) * s, Vector2(28, 22) * s), PRETO)
	Desenho._dr(c, Rect2(pos + Vector2(-12, -8) * s, Vector2(24, 18) * s), Color("ffd23f"))
	Desenho._dr(c, Rect2(pos + Vector2(-2, -4) * s, Vector2(4, 8) * s), PRETO)
