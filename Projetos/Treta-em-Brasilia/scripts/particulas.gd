class_name Particulas
## Partículas leves em pixel (quadradinhos), com limite para não pesar em celular:
## faíscas de impacto, poeira de pulo e queda, fumaça, estrelas, confete e linhas de velocidade.

const MAX := 260

var lista: Array[Dictionary] = []


func _add(p: Dictionary) -> void:
	if lista.size() >= MAX:
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


func bloqueio(pos: Vector2, dir: float) -> void:
	for i in 6:
		var a := randf_range(-0.8, 0.8) + (PI if dir > 0 else 0.0)
		_add({"tipo": "faisca", "pos": pos, "vel": Vector2(cos(a), sin(a)) * randf_range(3.0, 7.0), "t": 0, "dur": 10, "cor": Color("7ec8ff"), "tam": 5.0, "g": 0.2})
	_add({"tipo": "escudo", "pos": pos, "vel": Vector2.ZERO, "t": 0, "dur": 10, "cor": Color("7ec8ff"), "tam": 46.0, "g": 0.0})


func poeira(pos: Vector2, n: int = 6, forte := false) -> void:
	for i in n:
		var lado := -1.0 if i % 2 == 0 else 1.0
		_add({"tipo": "poeira", "pos": pos + Vector2(randf_range(-20, 20), -4), "vel": Vector2(lado * randf_range(1.5, 5.0 if forte else 3.0), randf_range(-2.5, -0.5)), "t": 0, "dur": randi_range(18, 30), "cor": Color(0.85, 0.78, 0.65, 0.8), "tam": randf_range(8.0, 16.0 if forte else 12.0), "g": 0.02})


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
	for p in lista:
		var k: float = float(p["t"]) / float(p["dur"])
		var cor: Color = p["cor"]
		var pos: Vector2 = p["pos"]
		var s: float = p["tam"]
		match p["tipo"]:
			"faisca":
				cor.a *= 1.0 - k * k
				var tam := s * (1.0 - k * 0.6)
				c.draw_rect(Rect2(pos - Vector2(tam, tam) / 2.0, Vector2(tam, tam)), cor)
			"anel":
				cor.a = 1.0 - k
				c.draw_arc(pos, s * (0.3 + k), 0, TAU, 20, cor, 8.0 * (1.0 - k) + 2.0)
			"escudo":
				cor.a = 0.8 * (1.0 - k)
				c.draw_arc(pos, s * (0.8 + 0.3 * k), -PI * 0.5, PI * 0.5, 10, cor, 6.0)
			"poeira":
				cor.a *= 1.0 - k
				var tam := s * (0.6 + k * 0.8)
				c.draw_rect(Rect2(pos - Vector2(tam, tam) / 2.0, Vector2(tam, tam)), cor)
			"estrela":
				cor.a = 1.0 - k
				Desenho._estrela(c, pos, s, cor)
			"confete":
				var w := s * absf(sin(p["t"] * 0.2 + s))
				c.draw_rect(Rect2(pos, Vector2(maxf(w, 2.0), s * 0.6)), cor)
			"linha":
				cor.a *= 1.0 - k
				c.draw_line(pos, pos + Vector2(signf(p["vel"].x) * -s, 0), cor, 4.0)
