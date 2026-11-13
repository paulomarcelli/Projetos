class_name Particulas
## Partículas leves em pixel (quadradinhos), com limite para não pesar em celular:
## faíscas de impacto, poeira de pulo e queda, fumaça, estrelas, confete e linhas de velocidade.

const MAX := 260

var lista: Array[Dictionary] = []


func _add(p: Dictionary) -> void:
	if lista.size() >= (MAX / 2 if Config.leve else MAX):
		lista.pop_front()
	lista.append(p)


## Impacto de golpe: faíscas na direção do golpe e um anel. forca 0 a 1.
func impacto(pos: Vector2, dir: float, forca: float, cor: Color) -> void:
	var n := int(6 + 10 * forca)
	for i in n:
		var a := randf_range(-1.1, 1.1) + (0.0 if dir > 0 else PI)
		var v := Vector2(cos(a), sin(a)) * randf_range(4.0, 9.0 + 9.0 * forca)
		_add({"tipo": "faisca", "pos": pos, "vel": v, "t": 0, "dur": randi_range(10, 18), "cor": cor if i % 3 else Color.WHITE, "tam": randf_range(4.0, 8.0 + 4.0 * forca), "g": 0.35})
	_add({"tipo": "anel", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 12, "cor": cor, "tam": 30.0 + 40.0 * forca, "g": 0.0})
	# estalo de quadrinho: estrela pontuda branca com miolo colorido, girada ao acaso
	_add({"tipo": "estalo", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 7 + int(forca * 4), "cor": cor, "tam": 34.0 + 46.0 * forca, "g": 0.0, "giro": randf() * TAU})
	if forca >= 0.5:
		for i in int(4 + forca * 6):
			var a := randf() * TAU
			_add({"tipo": "risco", "pos": pos, "vel": Vector2(cos(a), sin(a)), "t": 0, "dur": 8, "cor": Color.WHITE, "tam": 50.0 + 70.0 * forca, "g": 0.0})


## Brilho de poder: anel que abre e faíscas subindo, na cor do lutador (início de especial).
func brilho(pos: Vector2, cor: Color, forca: float = 1.0) -> void:
	_add({"tipo": "anel", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 14, "cor": cor, "tam": 50.0 + 50.0 * forca, "g": 0.0})
	for i in int(5 + 6 * forca):
		var a := randf() * TAU
		_add({"tipo": "faisca", "pos": pos + Vector2(cos(a), sin(a)) * 20.0, "vel": Vector2(cos(a) * 3.0, -randf_range(2.0, 6.0)), "t": 0, "dur": randi_range(12, 20), "cor": cor.lightened(0.3) if i % 2 else cor, "tam": randf_range(3.0, 6.0), "g": -0.05})


## Clarão na boca do cano: estrela achatada na direção do tiro.
func clarao(pos: Vector2, dir: float) -> void:
	_add({"tipo": "clarao", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 4, "cor": Color("fff3b0"), "tam": 40.0, "g": 0.0, "giro": 0.0 if dir > 0 else PI})


func bloqueio(pos: Vector2, dir: float) -> void:
	for i in 6:
		var a := randf_range(-0.8, 0.8) + (PI if dir > 0 else 0.0)
		_add({"tipo": "faisca", "pos": pos, "vel": Vector2(cos(a), sin(a)) * randf_range(3.0, 7.0), "t": 0, "dur": 10, "cor": Color("7ec8ff"), "tam": 5.0, "g": 0.2})
	_add({"tipo": "escudo", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 10, "cor": Color("7ec8ff"), "tam": 46.0, "g": 0.0})


func poeira(pos: Vector2, n: int = 6, forte := false) -> void:
	for i in n:
		var lado := -1.0 if i % 2 == 0 else 1.0
		_add({"tipo": "poeira", "pos": pos + Vector2(randf_range(-20, 20), -4), "vel": Vector2(lado * randf_range(1.5, 5.0 if forte else 3.0), randf_range(-2.5, -0.5)), "t": 0, "dur": randi_range(18, 30), "cor": Color(0.85, 0.78, 0.65, 0.8), "tam": randf_range(8.0, 16.0 if forte else 12.0), "g": 0.02})


## Poeira rasteira de quem freia ou é empurrado: sai baixa, para trás do movimento.
func arrasto(pos: Vector2, dir: float) -> void:
	for i in 2:
		_add({"tipo": "poeira", "pos": pos + Vector2(randf_range(-6, 6), -3), "vel": Vector2(dir * randf_range(0.5, 2.0), randf_range(-1.2, -0.3)), "t": 0, "dur": randi_range(14, 22), "cor": Color(0.85, 0.78, 0.65, 0.6), "tam": randf_range(6.0, 10.0), "g": 0.01})


func fumaca(pos: Vector2, n: int = 3, cor := Color(0.45, 0.45, 0.5, 0.6)) -> void:
	for i in n:
		_add({"tipo": "poeira", "pos": pos + Vector2(randf_range(-30, 30), randf_range(-10, 10)), "vel": Vector2(randf_range(-0.8, 0.8), randf_range(-2.2, -0.8)), "t": 0, "dur": randi_range(30, 50), "cor": cor, "tam": randf_range(14.0, 26.0), "g": -0.01})


func estrelas(pos: Vector2, n: int = 5) -> void:
	for i in n:
		var a := randf() * TAU
		_add({"tipo": "estrela", "pos": pos, "vel": Vector2(cos(a), sin(a) - 0.6) * randf_range(3.0, 7.0), "t": 0, "dur": randi_range(20, 32), "cor": Color("ffd23f"), "tam": randf_range(8.0, 13.0), "g": 0.25})


func confete(centro: Vector2, n: int = 40) -> void:
	var cores := [Color("ffd23f"), Color("1f9d55"), Color("2a9df4"), Color("e63946"), Color("fbfbf7")]
	for i in n:
		_add({"tipo": "confete", "pos": centro + Vector2(randf_range(-600, 600), randf_range(-60, 0)), "vel": Vector2(randf_range(-1.5, 1.5), randf_range(1.0, 3.5)), "t": 0, "dur": randi_range(90, 150), "cor": cores[i % cores.size()], "tam": randf_range(6.0, 10.0), "g": 0.02})


func explosao(pos: Vector2, forca: float = 1.0) -> void:
	for i in int(10 + 12 * forca):
		var a := randf() * TAU
		_add({"tipo": "faisca", "pos": pos, "vel": Vector2(cos(a), sin(a)) * randf_range(3.0, 12.0 * forca), "t": 0, "dur": randi_range(14, 26), "cor": [Color("ffd23f"), Color("ff7a2f"), Color("e63946")][i % 3], "tam": randf_range(6.0, 14.0), "g": 0.2})
	fumaca(pos, 5, Color(0.3, 0.28, 0.3, 0.7))
	_add({"tipo": "anel", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 16, "cor": Color("ffd23f"), "tam": 110.0 * forca, "g": 0.0})
	# bola de fogo em camadas (branco, amarelo, laranja, fumaça escura) e entulho
	_add({"tipo": "bola", "pos": pos, "vel": Vector2(0, -0.6), "t": 0, "dur": 22, "cor": Color.WHITE, "tam": 70.0 * forca, "g": 0.0})
	for i in int(4 + forca * 4):
		var a := randf_range(-PI, 0.0)
		_add({"tipo": "entulho", "pos": pos, "vel": Vector2(cos(a), sin(a)) * randf_range(5.0, 11.0), "t": 0, "dur": randi_range(26, 40), "cor": Color("3a3038"), "tam": randf_range(5.0, 9.0), "g": 0.45, "giro": randf() * TAU})


## Onda de choque achatada no chão (pouso pesado, queda, bomba).
func onda(pos: Vector2, forca: float = 1.0) -> void:
	_add({"tipo": "onda", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 18, "cor": Color(1, 0.95, 0.8, 0.9), "tam": 160.0 * forca, "g": 0.0})


## Cartucho dourado voando para trás (metralhadora).
func cartucho(pos: Vector2, dir: float) -> void:
	_add({"tipo": "faisca", "pos": pos, "vel": Vector2(dir * randf_range(3.0, 6.0), randf_range(-7.0, -4.0)), "t": 0, "dur": 26, "cor": Color("e0b040"), "tam": 6.0, "g": 0.5})


## Fogo atrás da picanha flamejante.
func fogo(pos: Vector2) -> void:
	_add({"tipo": "poeira", "pos": pos + Vector2(randf_range(-6, 6), randf_range(-6, 6)), "vel": Vector2(randf_range(-0.6, 0.6), randf_range(-2.0, -0.8)), "t": 0, "dur": randi_range(12, 20), "cor": [Color("ffd23f"), Color("ff7a2f"), Color("e63946")][randi() % 3], "tam": randf_range(10.0, 16.0), "g": -0.02})


## Linhas de velocidade atrás de quem corre (dash, investida).
func velocidade(pos: Vector2, dir: float) -> void:
	_add({"tipo": "linha", "pos": pos + Vector2(-dir * randf_range(20, 60), randf_range(-220, -20)), "vel": Vector2(-dir * 14.0, 0), "t": 0, "dur": 8, "cor": Color(1, 1, 1, 0.7), "tam": randf_range(40.0, 90.0), "g": 0.0})


func passo() -> void:
	for p in lista:
		p["t"] += 1
		p["vel"] += Vector2(0, p["g"])
		if p["tipo"] == "confete":
			p["vel"].x = sin(p["t"] * 0.15 + p["tam"]) * 1.6
		p["pos"] += p["vel"]
	lista = lista.filter(func(p): return p["t"] < p["dur"])


func desenhar(c: CanvasItem) -> void:
	# tudo vai num lote de triângulos: uma chamada de desenho para todas as partículas
	var lote := Lote.new()
	Desenho._lote = lote
	for p in lista:
		var k: float = float(p["t"]) / float(p["dur"])
		var cor: Color = p["cor"]
		var pos: Vector2 = p["pos"]
		var s: float = p["tam"]
		match p["tipo"]:
			"faisca":
				cor.a *= 1.0 - k * k
				var tam := s * (1.0 - k * 0.6)
				Desenho._dr(c, Rect2(pos - Vector2(tam, tam) / 2.0, Vector2(tam, tam)), cor)
			"anel":
				cor.a = 1.0 - k
				Desenho._da(c, pos, s * (0.3 + k), 0, TAU, 20, cor, 8.0 * (1.0 - k) + 2.0)
			"escudo":
				cor.a = 0.8 * (1.0 - k)
				Desenho._da(c, pos, s * (0.8 + 0.3 * k), -PI * 0.5, PI * 0.5, 10, cor, 6.0)
			"poeira":
				cor.a *= 1.0 - k
				var tam := s * (0.6 + k * 0.8)
				Desenho._dr(c, Rect2(pos - Vector2(tam, tam) / 2.0, Vector2(tam, tam)), cor)
			"estrela":
				cor.a = 1.0 - k
				Desenho._estrela(c, pos, s, cor)
			"confete":
				var w := s * absf(sin(p["t"] * 0.2 + s))
				Desenho._dr(c, Rect2(pos, Vector2(maxf(w, 2.0), s * 0.6)), cor)
			"linha":
				cor.a *= 1.0 - k
				Desenho._dl(c, pos, pos + Vector2(signf(p["vel"].x) * -s, 0), cor, 4.0)
			"estalo":
				var esc := minf(1.0, 0.45 + k * 3.0) * (1.0 - k * 0.35)
				var a := 1.0 if k < 0.6 else (1.0 - k) / 0.4
				_estrela_pontas(c, pos, s * esc, s * esc * 0.42, 9, p["giro"], Color(1, 1, 1, a))
				_estrela_pontas(c, pos, s * esc * 0.62, s * esc * 0.3, 9, p["giro"] + 0.35, Color(cor.r, cor.g, cor.b, a))
				Desenho._dc(c, pos, s * esc * 0.22, Color(1, 1, 1, a))
			"risco":
				var d: Vector2 = p["vel"]
				var ini := pos + d * s * (0.35 + k * 0.6)
				Desenho._dl(c, ini, ini + d * s * 0.45 * (1.0 - k), Color(1, 1, 1, 0.9 * (1.0 - k)), 4.0 * (1.0 - k) + 1.0)
			"clarao":
				var a2 := 1.0 - k
				_estrela_pontas(c, pos + Vector2(cos(p["giro"]), 0) * s * 0.4, s * 1.1, s * 0.25, 6, p["giro"], Color(1, 0.95, 0.6, a2), Vector2(1.0, 0.55))
				Desenho._dc(c, pos, s * 0.3, Color(1, 1, 1, a2))
			"bola":
				var r := s * (0.5 + k * 0.9)
				var camadas := [Color(0.25, 0.2, 0.22, 0.75 * (1.0 - k)), Color(1.0, 0.45, 0.15, 1.0 - k), Color(1.0, 0.82, 0.25, 1.0 - k * 1.3), Color(1, 1, 1, 1.0 - k * 2.5)]
				for j in camadas.size():
					var cj: Color = camadas[j]
					if cj.a <= 0.0:
						continue
					var rj := r * (1.0 - j * 0.22) * (1.0 + (0.25 * k if j == 0 else 0.0))
					Desenho._dc(c, pos + Vector2(0, -k * 30.0 * (1.0 - j * 0.2)), rj, cj)
			"entulho":
				cor.a *= 1.0 - k * k
				var g: float = float(p["giro"]) + float(p["t"]) * 0.3
				var e := Vector2(cos(g), sin(g)) * s * 0.6
				Desenho._dp(c, PackedVector2Array([pos + e, pos + e.orthogonal(), pos - e, pos - e.orthogonal() * 0.5]), cor)
			"onda":
				cor.a *= 1.0 - k
				# elipse achatada feita de segmentos
				var ro := s * (0.25 + k)
				var esp := 14.0 * (1.0 - k) + 2.0
				for q in 24:
					var a0 := q * TAU / 24.0
					var a1 := (q + 1) * TAU / 24.0
					Desenho._dl(c, pos + Vector2(cos(a0) * ro, sin(a0) * ro * 0.2), pos + Vector2(cos(a1) * ro, sin(a1) * ro * 0.2), cor, esp)
	Desenho._lote = null
	lote.despejar(c)


## Estrela de n pontas (raio externo r1, interno r2), opcionalmente achatada.
func _estrela_pontas(c: CanvasItem, centro: Vector2, r1: float, r2: float, n: int, giro: float, cor: Color, achata := Vector2.ONE) -> void:
	var pts := PackedVector2Array()
	for i in n * 2:
		var a := giro + i * PI / n
		var r := r1 if i % 2 == 0 else r2
		pts.append(centro + Vector2(cos(a) * r * achata.x, sin(a) * r * achata.y).rotated(0.0))
	Desenho._dp(c, pts, cor)
