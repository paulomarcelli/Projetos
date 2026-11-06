class_name Cenarios
## As arenas. Cada uma tem três camadas:
##   fundo  desenhado uma vez (céu, prédios, monumentos)
##   vivo   redesenhado todo quadro (plateia, bandeiras, trânsito, holofotes) e reage à luta (agito 0 a 1)
##   frente desenhada uma vez (chão onde se luta)
## Manifestações são sátira: cartazes e bandeiras, empurra-empurra de desenho animado, ninguém se machuca.

const LISTA := [
	{"id": "praca", "nome": "PRAÇA DOS TRÊS PODERES", "local": "Brasília", "musica": "praca"},
	{"id": "usp", "nome": "USP", "local": "São Paulo", "musica": "usp"},
	{"id": "paulista", "nome": "AVENIDA PAULISTA", "local": "São Paulo", "musica": "paulista"},
	{"id": "casa_branca", "nome": "CASA BRANCA", "local": "Washington", "musica": "casa_branca"},
]

const PRETO := Color("140c1c")
const BRANCO := Color("fbfbf7")
const PELES := [Color("f0c8a0"), Color("c88a5c"), Color("8a5a3a"), Color("e3a983"), Color("5c3a24")]
const CABELOS := [Color("2a1c14"), Color("6b3f22"), Color("c9c9c9"), Color("1a1a1a"), Color("a0522d"), Color("e0b050")]

static var _ceus := {}


static func indice(id: String) -> int:
	for i in LISTA.size():
		if LISTA[i]["id"] == id:
			return i
	return 0


static func musica(id: String) -> String:
	return LISTA[indice(id)]["musica"]


## Para menus e miniaturas: as três camadas de uma vez.
static func completo(c: CanvasItem, id: String, t: float, agito := 0.3) -> void:
	fundo(c, id)
	vivo(c, id, t, agito)
	frente(c, id)


static func fundo(c: CanvasItem, id: String) -> void:
	match id:
		"usp":
			_usp_fundo(c)
		"paulista":
			_paulista_fundo(c)
		"casa_branca":
			_casa_fundo(c)
		_:
			Desenho.cenario_fundo(c)


static func vivo(c: CanvasItem, id: String, t: float, agito: float) -> void:
	match id:
		"usp":
			_usp_vivo(c, t, agito)
		"paulista":
			_paulista_vivo(c, t, agito)
		"casa_branca":
			_casa_vivo(c, t, agito)
		_:
			Desenho.cenario_vivo(c, t, agito)


static func frente(c: CanvasItem, id: String) -> void:
	match id:
		"usp":
			_piso(c, Color("b9b4aa"), Color("9a958c"), 80.0)
		"paulista":
			_asfalto(c)
		"casa_branca":
			_gramado_frente(c)
		_:
			Desenho.cenario_frente(c)


# ---------------------------------------------------------------- utilitários

## Céu em faixas com pontilhado (dithering), gerado uma vez por cenário.
static func ceu(c: CanvasItem, id: String, cores: Array, fim: float = 196.0) -> void:
	if not _ceus.has(id):
		var w := 480
		var h := 270
		var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
		var bayer := [0.0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125]
		for y in h:
			var f := clampf(y / fim, 0.0, 0.999) * float(cores.size() - 1)
			var i := int(f)
			var frac := f - i
			var transicao := clampf((frac - 0.55) / 0.45, 0.0, 1.0)
			for x in w:
				var limiar: float = bayer[(x % 4) + 4 * (y % 4)]
				var k := mini(i + 1, cores.size() - 1) if transicao > limiar else i
				img.set_pixel(x, y, cores[k])
		_ceus[id] = ImageTexture.create_from_image(img)
	c.draw_texture_rect(_ceus[id], Rect2(0, 0, 1280, 720), false)


## Pessoa da plateia (estilo das outras: corpo, cabeça redonda, braços). acao: baixo, cima, cartaz, bandeira, camera, escudo.
static func pessoa(c: CanvasItem, base: Vector2, s: float, camisa: Color, pele: Color, cabelo: Color, acao: String, detalhe := "") -> void:
	var b := base
	for passada in 2:
		Desenho._cont = passada == 0
		Desenho._ret(c, Rect2(b + Vector2(-22, -66) * s, Vector2(44, 70) * s), camisa)
		Desenho._circ(c, b + Vector2(0, -88) * s, 20 * s, pele)
		match acao:
			"cima":
				Desenho._lin(c, b + Vector2(-20, -60) * s, b + Vector2(-34, -118) * s, pele, 9.0 * s)
				Desenho._lin(c, b + Vector2(20, -60) * s, b + Vector2(34, -118) * s, pele, 9.0 * s)
			"cartaz", "bandeira":
				Desenho._lin(c, b + Vector2(-20, -60) * s, b + Vector2(-16, -126) * s, pele, 9.0 * s)
				Desenho._lin(c, b + Vector2(20, -60) * s, b + Vector2(16, -126) * s, pele, 9.0 * s)
			"camera":
				Desenho._lin(c, b + Vector2(-20, -60) * s, b + Vector2(-10, -96) * s, pele, 9.0 * s)
				Desenho._lin(c, b + Vector2(20, -60) * s, b + Vector2(16, -96) * s, pele, 9.0 * s)
				Desenho._ret(c, Rect2(b + Vector2(-30, -116) * s, Vector2(46, 30) * s), Color("2a2230"))
			"escudo":
				Desenho._ret(c, Rect2(b + Vector2(8, -90) * s, Vector2(26, 86) * s), Color("8ab4d8"))
			_:
				Desenho._lin(c, b + Vector2(-20, -60) * s, b + Vector2(-30, -26) * s, pele, 9.0 * s)
				Desenho._lin(c, b + Vector2(20, -60) * s, b + Vector2(30, -26) * s, pele, 9.0 * s)
	Desenho._cont = false
	c.draw_arc(b + Vector2(0, -90) * s, 19 * s, PI * 1.05, PI * 1.95, 12, cabelo, 12.0 * s)
	c.draw_circle(b + Vector2(-6, -88) * s, 3 * s, PRETO)
	c.draw_circle(b + Vector2(8, -88) * s, 3 * s, PRETO)
	c.draw_rect(Rect2(b + Vector2(-22, -66) * s, Vector2(10, 70) * s), camisa.darkened(0.25))
	match detalhe:
		"estrela":
			Desenho._estrela(c, b + Vector2(2, -44) * s, 11.0 * s, BRANCO)
		"brasil":
			c.draw_colored_polygon(PackedVector2Array([b + Vector2(2, -54) * s, b + Vector2(16, -40) * s, b + Vector2(2, -26) * s, b + Vector2(-12, -40) * s]), Color("1f9d55"))
			c.draw_circle(b + Vector2(2, -40) * s, 6 * s, Color("2a4fa8"))
		"oculos":
			c.draw_rect(Rect2(b + Vector2(-12, -94) * s, Vector2(26, 7) * s), PRETO)
		"policia":
			c.draw_rect(Rect2(b + Vector2(-20, -106) * s, Vector2(40, 12) * s), Color("1d2c66"))
			c.draw_rect(Rect2(b + Vector2(-4, -50) * s, Vector2(10, 8) * s), Color("ffd23f"))
		"mochila":
			c.draw_rect(Rect2(b + Vector2(-30, -60) * s, Vector2(12, 34) * s), Color("2a4fa8"))
	if acao == "camera":
		c.draw_circle(b + Vector2(-26, -101) * s, 7 * s, Color("7ec8ff"))


## Bandeira tremulando presa no mastro (topo do mastro em pos).
static func bandeira(c: CanvasItem, pos: Vector2, w: float, h: float, tipo: String, t: float, fase := 0.0) -> void:
	c.draw_line(pos, pos + Vector2(0, h * 2.6), PRETO, 5.0)
	c.draw_line(pos, pos + Vector2(0, h * 2.6), Color("c9ced6"), 2.5)
	var n := 8
	var faixas := []
	match tipo:
		"brasil":
			faixas = [Color("1f9d55")]
		"pt", "vermelha":
			faixas = [Color("d62828")]
		"lgbt":
			faixas = [Color("e40303"), Color("ff8c00"), Color("ffed00"), Color("008026"), Color("004dff"), Color("750787")]
		"palestina":
			faixas = [Color("1a1a1a"), BRANCO, Color("149954")]
		"eua":
			faixas = [Color("b22234"), BRANCO, Color("b22234"), BRANCO, Color("b22234"), BRANCO, Color("b22234")]
	var onda := func(i: int) -> float: return sin(t * 5.0 - i * 0.7 + fase) * 5.0 * (float(i) / n)
	for f in faixas.size():
		var y0 := h * f / faixas.size()
		var y1 := h * (f + 1) / faixas.size()
		var pts := PackedVector2Array()
		for i in n + 1:
			pts.append(pos + Vector2(i * w / n, y0 + onda.call(i)))
		for i in range(n, -1, -1):
			pts.append(pos + Vector2(i * w / n, y1 + onda.call(i)))
		c.draw_colored_polygon(pts, faixas[f])
	var meio := pos + Vector2(w * 0.5, h * 0.5 + onda.call(4))
	match tipo:
		"brasil":
			c.draw_colored_polygon(PackedVector2Array([meio + Vector2(0, -h * 0.4), meio + Vector2(w * 0.42, 0), meio + Vector2(0, h * 0.4), meio + Vector2(-w * 0.42, 0)]), Color("ffd23f"))
			c.draw_circle(meio, h * 0.22, Color("2a4fa8"))
		"pt":
			Desenho._estrela(c, meio, h * 0.36, BRANCO)
		"palestina":
			c.draw_colored_polygon(PackedVector2Array([pos + Vector2(0, onda.call(0)), pos + Vector2(w * 0.38, h * 0.5 + onda.call(3)), pos + Vector2(0, h + onda.call(0))]), Color("e4312b"))
		"eua":
			c.draw_rect(Rect2(pos + Vector2(0, onda.call(0)), Vector2(w * 0.42, h * 0.55)), Color("3c3b6e"))
			for i in 3:
				for j in 2:
					c.draw_rect(Rect2(pos + Vector2(4 + i * w * 0.12, 4 + j * h * 0.22 + onda.call(i)), Vector2(3, 3)), BRANCO)


## Cartaz com o texto em até duas linhas (a fonte pequena mede ~21 unidades por letra).
static func cartaz(c: CanvasItem, centro: Vector2, txt: String, cor_txt: Color, fundo_cor := BRANCO, tam := 22) -> void:
	var linhas: Array = Array(Telas.quebrar(txt, 12)) if txt.length() > 12 else [txt]
	var maior := 0
	for l in linhas:
		maior = maxi(maior, l.length())
	var largura := maxf(96.0, maior * 21.4 + 26.0)
	var altura := 30.0 + linhas.size() * 24.0
	var r := Rect2(centro - Vector2(largura / 2.0, altura - 26.0), Vector2(largura, altura))
	c.draw_line(r.get_center() + Vector2(0, altura / 2.0), r.get_center() + Vector2(0, altura / 2.0 + 30), Color("8a5a35"), 6.0)
	c.draw_rect(r.grow(3), PRETO)
	c.draw_rect(r, fundo_cor)
	for j in linhas.size():
		Desenho.texto(c, Vector2(r.get_center().x, r.position.y + 34 + j * 24), linhas[j], tam, cor_txt, fundo_cor, 0)


static func _piso(c: CanvasItem, cor: Color, linha: Color, lado: float) -> void:
	c.draw_rect(Rect2(0, 560, 1280, 160), cor)
	c.draw_rect(Rect2(0, 560, 1280, 10), linha.darkened(0.2))
	for i in 10:
		var y := 570.0 + pow(i / 9.0, 1.6) * 150.0
		c.draw_line(Vector2(0, y), Vector2(1280, y), linha, 3.0)
	for i in 21:
		c.draw_line(Vector2(640 + (i - 10) * lado, 570), Vector2(640 + (i - 10) * lado * 2.3, 720), linha, 3.0)


# ---------------------------------------------------------------- USP

static func _usp_fundo(c: CanvasItem) -> void:
	ceu(c, "usp", [Color("5aa8e8"), Color("74b9ec"), Color("90c8ee"), Color("acd6ee"), Color("c8e2ea"), Color("e2ecdc"), Color("f4efcc")])
	for i in 4:
		var x := 90.0 + i * 340.0
		for j in 4:
			c.draw_circle(Vector2(x + j * 28, 108 - (12 if j in [1, 2] else 0)), 22, Color("ffffff", 0.85))
	# árvores ao fundo
	for i in 22:
		var x := i * 62.0
		c.draw_circle(Vector2(x, 430 - (i % 3) * 14), 58, Color("3f7a3a") if i % 2 else Color("4f8c3f"))
	# Torre do Relógio da Praça do Relógio
	var tx := 300.0
	c.draw_rect(Rect2(tx - 30, 150, 60, 360), Color("a8a29a"))
	c.draw_rect(Rect2(tx - 30, 150, 14, 360), Color("8e887f"))
	for j in 9:
		c.draw_rect(Rect2(tx - 22, 210 + j * 32, 44, 4), Color("8e887f"))
	c.draw_circle(Vector2(tx, 182), 22, BRANCO)
	c.draw_arc(Vector2(tx, 182), 22, 0, TAU, 20, PRETO, 3.0)
	c.draw_line(Vector2(tx, 182), Vector2(tx, 168), PRETO, 3.0)
	c.draw_line(Vector2(tx, 182), Vector2(tx + 10, 186), PRETO, 3.0)
	# prédio brutalista com pilotis (estilo dos prédios da Cidade Universitária)
	var px := 760.0
	c.draw_rect(Rect2(px, 290, 460, 150), Color("b3ada3"))
	c.draw_rect(Rect2(px, 290, 460, 20), Color("8e887f"))
	for j in 10:
		c.draw_rect(Rect2(px + 16 + j * 44, 324, 30, 90), Color("4a5a6a"))
		c.draw_rect(Rect2(px + 16 + j * 44, 324, 30, 8), Color("7ec8ff", 0.5))
	for j in 6:
		c.draw_rect(Rect2(px + 20 + j * 86, 440, 18, 76), Color("8e887f"))
	c.draw_rect(Rect2(px + 20, 438, 420, 6), Color("6e6860"))
	# faixa pendurada no prédio
	c.draw_rect(Rect2(px + 110, 300, 250, 44), BRANCO)
	Desenho.texto(c, Vector2(px + 235, 332), "GREVE GERAL", 22, Color("d62828"), BRANCO, 0)
	# letreiro de pedra
	c.draw_rect(Rect2(470, 468, 250, 46), Color("8e887f"))
	Desenho.texto(c, Vector2(595, 500), "USP", 30, BRANCO, PRETO, 4)
	# gramado
	c.draw_rect(Rect2(0, 510, 1280, 50), Color("4f8c3f"))
	for i in 40:
		c.draw_rect(Rect2(i * 32 + (i % 3) * 5, 512 + (i % 2) * 8, 6, 4), Color("6aa84f"))


const CARTAZES_USP := ["RECUA, FASCISTA, RECUA!", "GREVE GERAL", "BANDEJÃO R$2", "ASSEMBLEIA HOJE", "FORA!", "EDUCAÇÃO NÃO É GASTO"]


static func _usp_vivo(c: CanvasItem, t: float, agito: float) -> void:
	# estudantes passando ao fundo, de mochila
	for i in 4:
		var x := fposmod(t * (40.0 + i * 12.0) + i * 380.0, 1500.0) - 110.0
		if i % 2:
			x = 1390.0 - x
		pessoa(c, Vector2(x, 515), 0.55, [Color("2a9df4"), Color("e8e8e8"), Color("ff7a2f"), Color("6a4c93")][i], PELES[i % 5], CABELOS[i % 6], "baixo", "mochila")
	# sinalizador de fumaça vermelha (em vez de fogo de verdade)
	for j in 6:
		var k := fposmod(t * 0.6 + j / 6.0, 1.0)
		c.draw_circle(Vector2(1110 + sin(t + j) * 10.0 + k * 40.0, 470 - k * 200.0), 16 + k * 26, Color(0.9, 0.2, 0.25, 0.35 * (1.0 - k)))
	# a manifestação: grupo de vermelho com estrela, bandeiras LGBT e da Palestina, cartazes
	var bandeiras := [[130.0, "pt"], [380.0, "lgbt"], [610.0, "palestina"], [860.0, "pt"], [1150.0, "lgbt"]]
	for b in bandeiras:
		bandeira(c, Vector2(b[0], 330), 96, 58, b[1], t, b[0] * 0.01)
	for i in 13:
		var x := 50.0 + i * 98.0 + (i % 2) * 14.0
		var pula := absf(sin(t * (3.5 + (i % 3)) + i * 1.7)) * (5.0 + 16.0 * agito)
		var base := Vector2(x, 548 - pula)
		var vermelho := i % 3 != 2
		var camisa: Color = Color("d62828") if vermelho else [Color("f2f2f2"), Color("2a2a2a"), Color("7a3fa0")][i % 3]
		var acao := "cartaz" if i % 3 == 1 else ("cima" if sin(t * 5.0 + i) > 0.2 - agito else "baixo")
		pessoa(c, base, 1.0, camisa, PELES[(i * 3) % 5], CABELOS[(i * 5) % 6], acao, "estrela" if vermelho else "")
		if acao == "cartaz":
			var txt: String = CARTAZES_USP[(i / 3 + int(t / 5.0)) % CARTAZES_USP.size()]
			cartaz(c, base + Vector2(0, -150 - (i / 3 % 2) * 34), txt, Color("d62828") if i % 2 else PRETO, BRANCO, 18)
	# palavra de ordem gritada (balão)
	var grito := int(t / 3.0) % 2 == 0
	if grito:
		var bx := 240.0 + fposmod(floorf(t / 3.0) * 410.0, 800.0)
		c.draw_rect(Rect2(bx - 110, 236, 220, 46), PRETO)
		c.draw_rect(Rect2(bx - 106, 240, 212, 38), BRANCO)
		Desenho.texto(c, Vector2(bx, 268), "RECUA! RECUA!", 18, Color("d62828"), BRANCO, 0)


# ---------------------------------------------------------------- Avenida Paulista

static func _paulista_fundo(c: CanvasItem) -> void:
	ceu(c, "paulista", [Color("1a1238"), Color("33205e"), Color("5a2a78"), Color("8c3a7a"), Color("c04e6a"), Color("e8785a"), Color("f6a860")], 230.0)
	# prédios altos com janelas acesas
	var cores := [Color("2c2048"), Color("362a58"), Color("241a3c")]
	for i in 16:
		var x := i * 84.0 - 20.0
		var h := 230.0 + float((i * 53) % 160)
		var cor: Color = cores[i % 3]
		c.draw_rect(Rect2(x, 520 - h, 76, h), cor)
		for j in int(h / 26.0):
			for k in 3:
				if (i + j * 3 + k) % 4 != 0:
					c.draw_rect(Rect2(x + 8 + k * 22, 530 - h + j * 26, 14, 10), Color("ffcf7a", 0.55 if (i + j) % 3 else 0.25))
	# antenas de TV vermelhas e brancas
	for ax in [150.0, 1130.0]:
		for j in 8:
			c.draw_rect(Rect2(ax - 6, 60 + j * 30, 12, 30), Color("d62828") if j % 2 == 0 else BRANCO)
		c.draw_circle(Vector2(ax, 56), 6, Color("ff5a4e"))
	# MASP: caixa suspensa por dois pórticos vermelhos e o vão livre
	var mx := 640.0
	c.draw_rect(Rect2(mx - 300, 330, 600, 110), Color("6a6e78"))
	for j in 14:
		c.draw_rect(Rect2(mx - 290 + j * 42, 352, 30, 66), Color("2a2e38"))
		c.draw_rect(Rect2(mx - 290 + j * 42, 352, 30, 6), Color("7ec8ff", 0.4))
	for px in [mx - 280.0, mx + 250.0]:
		c.draw_rect(Rect2(px, 300, 30, 220), Color("d62828"))
		c.draw_rect(Rect2(px, 300, 30, 220).grow(-6), Color("e8484a"))
	c.draw_rect(Rect2(mx - 290, 300, 580, 32), Color("d62828"))
	c.draw_rect(Rect2(mx - 290, 306, 580, 8), Color("e8484a"))
	Desenho.texto(c, Vector2(mx, 470), "MASP", 26, BRANCO, PRETO, 4)
	# calçada atrás da avenida
	c.draw_rect(Rect2(0, 516, 1280, 44), Color("8a8a92"))
	for i in 32:
		c.draw_line(Vector2(i * 40, 516), Vector2(i * 40 - 10, 560), Color("70707a"), 2.0)


const CARTAZ_ESQ := ["FAZ O L!", "LULA LÁ", "SEM ANISTIA", "PICANHA JÁ"]
const CARTAZ_DIR := ["MITO!", "VOLTA, CAPITÃO", "BRASIL ACIMA DE TUDO", "TÁ OK?"]


static func _paulista_vivo(c: CanvasItem, t: float, agito: float) -> void:
	# trânsito passando atrás da manifestação
	for i in 3:
		var x := fposmod(t * (180.0 + i * 50.0) + i * 600.0, 1900.0) - 300.0
		var cor: Color = [Color("ffd23f"), Color("2a9df4"), Color("e8e8e8")][i]
		if i == 1:
			_onibus(c, Vector2(1580.0 - x, 470))
		else:
			_carro(c, Vector2(x, 480), cor)
	# bandeiras dos dois lados
	bandeira(c, Vector2(80, 320), 100, 60, "pt", t)
	bandeira(c, Vector2(300, 300), 100, 60, "vermelha", t, 1.0)
	bandeira(c, Vector2(880, 300), 100, 60, "brasil", t, 2.0)
	bandeira(c, Vector2(1100, 320), 100, 60, "brasil", t, 3.0)
	# esquerda: vermelho; direita: verde e amarelo; no meio, a polícia e a imprensa
	for i in 6:
		var x := 40.0 + i * 82.0
		var pula := absf(sin(t * 4.0 + i * 1.3)) * (6.0 + 14.0 * agito)
		var acao := "cartaz" if i % 3 == 0 else ("cima" if sin(t * 6.0 + i) > 0.0 else "baixo")
		var base := Vector2(x, 548 - pula)
		pessoa(c, base, 0.95, Color("d62828"), PELES[i % 5], CABELOS[(i * 2) % 6], acao, "estrela")
		if acao == "cartaz":
			cartaz(c, base + Vector2(0, -146 - (i / 3) * 30), CARTAZ_ESQ[(i / 3 + int(t / 6.0)) % 4], Color("d62828"), BRANCO, 18)
	for i in 6:
		var x := 1240.0 - i * 82.0
		var pula := absf(sin(t * 4.2 + i * 1.1)) * (6.0 + 14.0 * agito)
		var acao := "cartaz" if i % 3 == 0 else ("cima" if sin(t * 6.0 + i + 1.0) > 0.0 else "baixo")
		var base := Vector2(x, 548 - pula)
		pessoa(c, base, 0.95, Color("ffd23f") if i % 2 else Color("1f9d55"), PELES[(i + 2) % 5], CABELOS[(i * 3) % 6], acao, "brasil")
		if acao == "cartaz":
			var txt: String = CARTAZ_DIR[(i / 3 + int(t / 6.0)) % 4]
			cartaz(c, base + Vector2(0, -146 - (i / 3) * 30), txt, Color("1f6f3a"), Color("ffd23f"), 18)
	# policiais com escudo no meio, separando os dois lados
	for i in 3:
		var x := 560.0 + i * 80.0
		pessoa(c, Vector2(x + sin(t * 1.5 + i) * 3.0, 548), 1.0, Color("2c3e66"), PELES[(i + 1) % 5], PRETO, "escudo", "policia")
	# empurra-empurra de desenho animado (nuvem de poeira com estrelas), de vez em quando
	var ciclo := fposmod(t, 9.0)
	if ciclo < 2.5 or agito > 0.7:
		var cx := 640.0 + sin(t * 0.7) * 30.0
		for j in 7:
			var a := t * 3.0 + j * TAU / 7.0
			c.draw_circle(Vector2(cx + cos(a) * 60.0, 300 + sin(a) * 30.0), 34, Color(0.85, 0.8, 0.7, 0.9))
		for j in 3:
			Desenho._estrela(c, Vector2(cx + cos(t * 5.0 + j * 2.0) * 70.0, 280 + sin(t * 5.0 + j * 2.0) * 34.0), 10.0, Color("ffd23f"))
		c.draw_line(Vector2(cx - 50, 290), Vector2(cx - 86, 270 + sin(t * 9.0) * 10.0), Color("d62828"), 8.0)
		c.draw_line(Vector2(cx + 50, 300), Vector2(cx + 86, 280 + cos(t * 9.0) * 10.0), Color("1f9d55"), 8.0)
	# imprensa: cinegrafistas com câmera e flash
	for i in 2:
		var x := 470.0 + i * 340.0
		pessoa(c, Vector2(x, 520), 0.8, Color("4a4a55"), PELES[(i + 3) % 5], CABELOS[i], "camera")
		if fposmod(t * 1.7 + i, 2.0) < 0.12 + agito * 0.2:
			c.draw_circle(Vector2(x - 22, 430), 30, Color(1, 1, 1, 0.8))
	# palavras de ordem
	if int(t / 2.0) % 3 == 0:
		_grito(c, Vector2(240, 250), "OLÊ OLÊ OLÁ!", Color("d62828"))
	elif int(t / 2.0) % 3 == 1:
		_grito(c, Vector2(1040, 250), "MITO! MITO!", Color("1f6f3a"))


static func _grito(c: CanvasItem, pos: Vector2, txt: String, cor: Color) -> void:
	var w := txt.length() * 18.0 + 30.0
	c.draw_rect(Rect2(pos - Vector2(w / 2.0 + 4, 27), Vector2(w + 8, 46)), PRETO)
	c.draw_rect(Rect2(pos - Vector2(w / 2.0, 23), Vector2(w, 38)), BRANCO)
	Desenho.texto(c, pos + Vector2(0, 5), txt, 18, cor, BRANCO, 0)


static func _carro(c: CanvasItem, pos: Vector2, cor: Color) -> void:
	c.draw_rect(Rect2(pos + Vector2(-60, -30), Vector2(120, 26)), PRETO)
	c.draw_rect(Rect2(pos + Vector2(-58, -28), Vector2(116, 22)), cor)
	c.draw_rect(Rect2(pos + Vector2(-34, -48), Vector2(64, 20)), cor.darkened(0.15))
	c.draw_rect(Rect2(pos + Vector2(-28, -44), Vector2(24, 14)), Color("7ec8ff"))
	c.draw_rect(Rect2(pos + Vector2(2, -44), Vector2(24, 14)), Color("7ec8ff"))
	c.draw_circle(pos + Vector2(-34, -4), 11, PRETO)
	c.draw_circle(pos + Vector2(34, -4), 11, PRETO)


static func _onibus(c: CanvasItem, pos: Vector2) -> void:
	c.draw_rect(Rect2(pos + Vector2(-140, -86), Vector2(280, 76)), PRETO)
	c.draw_rect(Rect2(pos + Vector2(-137, -83), Vector2(274, 70)), Color("2a6fd0"))
	for j in 7:
		c.draw_rect(Rect2(pos + Vector2(-128 + j * 38, -76), Vector2(30, 24)), Color("7ec8ff"))
	c.draw_rect(Rect2(pos + Vector2(-137, -42), Vector2(274, 8)), BRANCO)
	c.draw_circle(pos + Vector2(-90, -8), 14, PRETO)
	c.draw_circle(pos + Vector2(90, -8), 14, PRETO)


static func _asfalto(c: CanvasItem) -> void:
	c.draw_rect(Rect2(0, 560, 1280, 160), Color("4a4650"))
	c.draw_rect(Rect2(0, 560, 1280, 12), Color("9a9aa4"))
	for i in 9:
		var y := 580.0 + pow(i / 8.0, 1.6) * 140.0
		c.draw_line(Vector2(0, y), Vector2(1280, y), Color("55515c"), 2.0)
	for i in 12:
		c.draw_rect(Rect2(i * 120.0 + 20.0, 646, 70, 8), Color("ffd23f"))
	# faixa de pedestre
	for i in 8:
		c.draw_rect(Rect2(560 + i * 22, 580, 12, 130), Color(1, 1, 1, 0.55))


# ---------------------------------------------------------------- Casa Branca

static func _casa_fundo(c: CanvasItem) -> void:
	ceu(c, "casa_branca", [Color("0b0f2a"), Color("121a40"), Color("1b2856"), Color("27386c"), Color("344a80"), Color("4a6094"), Color("7088ae")], 260.0)
	for i in 40:
		var x := float((i * 197) % 1280)
		var y := float((i * 89) % 260)
		c.draw_rect(Rect2(x, y, 3, 3), Color(1, 1, 1, 0.5 + 0.5 * float(i % 3) / 2.0))
	c.draw_circle(Vector2(1080, 110), 40, Color("f4efcc"))
	c.draw_circle(Vector2(1094, 100), 36, Color("1b2856"))
	# árvores
	for i in 12:
		var x := i * 120.0 - 20.0
		if x > 260 and x < 1020:
			continue
		c.draw_circle(Vector2(x, 400), 70, Color("1f3a2a"))
	# a Casa Branca: alas com janelas e o pórtico com colunas e frontão
	var cx := 640.0
	c.draw_rect(Rect2(cx - 380, 300, 760, 210), Color("e8e6de"))
	c.draw_rect(Rect2(cx - 380, 300, 760, 14), Color("cfccc0"))
	c.draw_rect(Rect2(cx - 380, 404, 760, 6), Color("cfccc0"))
	for j in 12:
		if j in [5, 6]:
			continue
		var x := cx - 360 + j * 62
		c.draw_rect(Rect2(x, 330, 26, 50), Color("ffcf7a"))
		c.draw_rect(Rect2(x, 330, 26, 6), Color("cfccc0"))
		c.draw_rect(Rect2(x, 430, 26, 50), Color("ffcf7a"))
	# pórtico
	c.draw_colored_polygon(PackedVector2Array([Vector2(cx - 150, 270), Vector2(cx + 150, 270), Vector2(cx, 214)]), Color("f2f0e8"))
	c.draw_colored_polygon(PackedVector2Array([Vector2(cx - 120, 264), Vector2(cx + 120, 264), Vector2(cx, 224)]), Color("dcd9ce"))
	c.draw_rect(Rect2(cx - 160, 270, 320, 16), Color("f2f0e8"))
	for j in 6:
		var x := cx - 140 + j * 56
		c.draw_rect(Rect2(x, 286, 18, 200), Color("f8f6ee"))
		c.draw_rect(Rect2(x, 286, 5, 200), Color("d8d5ca"))
	c.draw_rect(Rect2(cx - 30, 410, 60, 76), Color("6a4a2a"))
	c.draw_rect(Rect2(cx - 26, 414, 52, 30), Color("ffcf7a"))
	# grade e gramado
	c.draw_rect(Rect2(0, 508, 1280, 52), Color("2f6a3a"))
	for i in 54:
		c.draw_rect(Rect2(i * 24.0, 492, 4, 30), PRETO)
	c.draw_rect(Rect2(0, 492, 1280, 4), PRETO)


static func _casa_vivo(c: CanvasItem, t: float, agito: float) -> void:
	# holofotes cruzando o céu
	for j in 2:
		var a := sin(t * 0.5 + j * 2.0) * 0.6 + (-0.3 if j == 0 else 0.3)
		var base := Vector2(260 + j * 760.0, 500)
		var fim := base + Vector2(0, -700).rotated(a)
		c.draw_colored_polygon(PackedVector2Array([base, fim + Vector2(-70, 0), fim + Vector2(70, 0)]), Color(1, 1, 0.8, 0.08 + agito * 0.05))
	# bandeira no alto do prédio
	bandeira(c, Vector2(640, 150), 90, 52, "eua", t)
	# helicóptero passando de vez em quando
	var ciclo := fposmod(t, 16.0)
	if ciclo < 6.0:
		var hx := lerpf(-200.0, 1480.0, ciclo / 6.0)
		_helicoptero(c, Vector2(hx, 160 + sin(t * 2.0) * 8.0), t)
	# limusine com as bandeirinhas
	_limusine(c, Vector2(1080, 545), t)
	# bandeiras na grade
	for x in [120.0, 400.0, 870.0]:
		bandeira(c, Vector2(x, 380), 70, 40, "eua", t, x * 0.01)
	# agentes de segurança de terno e óculos escuros (põem a mão no ouvido de vez em quando)
	for i in 5:
		var x: float = [60.0, 230.0, 500.0, 780.0, 930.0][i]
		var ouvido := fposmod(t * 0.7 + i * 0.37, 3.0) < 0.6 or agito > 0.75
		var base := Vector2(x, 548)
		pessoa(c, base, 1.0, Color("1a1c26"), PELES[(i * 2) % 5], PRETO, "baixo", "oculos")
		c.draw_colored_polygon(PackedVector2Array([base + Vector2(-6, -66), base + Vector2(6, -66), base + Vector2(0, -40)]), BRANCO)
		if ouvido:
			c.draw_line(base + Vector2(20, -60), base + Vector2(22, -92), PELES[(i * 2) % 5], 9.0)
		c.draw_line(base + Vector2(16, -100), base + Vector2(12, -70), Color("c9ced6"), 2.0)
	# fotógrafos com flash
	for i in 2:
		var x := 320.0 + i * 330.0
		pessoa(c, Vector2(x, 525), 0.8, Color("6a5a4a"), PELES[(i + 1) % 5], CABELOS[i + 1], "camera")
		if fposmod(t * 1.3 + i * 0.8, 2.0) < 0.1 + agito * 0.25:
			c.draw_circle(Vector2(x - 22, 432), 30, Color(1, 1, 1, 0.85))


static func _helicoptero(c: CanvasItem, pos: Vector2, t: float) -> void:
	c.draw_rect(Rect2(pos + Vector2(-60, -24), Vector2(110, 40)), PRETO)
	c.draw_rect(Rect2(pos + Vector2(-58, -22), Vector2(106, 22)), Color("2f5a2e"))
	c.draw_rect(Rect2(pos + Vector2(-58, 0), Vector2(106, 14)), BRANCO)
	c.draw_rect(Rect2(pos + Vector2(-140, -14), Vector2(84, 10)), Color("2f5a2e"))
	c.draw_rect(Rect2(pos + Vector2(20, -18), Vector2(24, 14)), Color("7ec8ff"))
	var giro := sin(t * 40.0) * 90.0
	c.draw_line(pos + Vector2(-giro, -30), pos + Vector2(giro, -30), Color(0.1, 0.1, 0.1, 0.8), 4.0)
	c.draw_line(pos + Vector2(-50, 20), pos + Vector2(40, 20), PRETO, 3.0)


static func _limusine(c: CanvasItem, pos: Vector2, t: float) -> void:
	c.draw_rect(Rect2(pos + Vector2(-150, -44), Vector2(300, 36)), PRETO)
	c.draw_rect(Rect2(pos + Vector2(-147, -41), Vector2(294, 30)), Color("1a1a22"))
	c.draw_rect(Rect2(pos + Vector2(-100, -66), Vector2(190, 26)), Color("1a1a22"))
	for j in 4:
		c.draw_rect(Rect2(pos + Vector2(-92 + j * 46, -62), Vector2(38, 18)), Color("2a3a5a"))
	c.draw_circle(pos + Vector2(-100, -6), 15, PRETO)
	c.draw_circle(pos + Vector2(100, -6), 15, PRETO)
	c.draw_circle(pos + Vector2(-100, -6), 6, Color("9aa0a6"))
	c.draw_circle(pos + Vector2(100, -6), 6, Color("9aa0a6"))
	for lado in [-1.0, 1.0]:
		var m := pos + Vector2(lado * 130, -44)
		c.draw_line(m, m + Vector2(0, -24), Color("c9ced6"), 2.0)
		c.draw_rect(Rect2(m + Vector2(0, -24 + sin(t * 8.0) * 1.0), Vector2(18, 11)), Color("b22234"))
		c.draw_rect(Rect2(m + Vector2(0, -24), Vector2(8, 6)), Color("3c3b6e"))


static func _gramado_frente(c: CanvasItem) -> void:
	c.draw_rect(Rect2(0, 560, 1280, 160), Color("3f7f45"))
	c.draw_rect(Rect2(0, 560, 1280, 10), Color("2f6a3a"))
	for i in 9:
		var y := 575.0 + pow(i / 8.0, 1.6) * 140.0
		c.draw_rect(Rect2(0, y, 1280, 6), Color("4a8f50"))
	# caminho de pedra clara onde se luta
	c.draw_colored_polygon(PackedVector2Array([Vector2(0, 600), Vector2(1280, 600), Vector2(1280, 690), Vector2(0, 690)]), Color("cfc8b6"))
	for i in 16:
		c.draw_line(Vector2(i * 84.0, 600), Vector2(i * 84.0 - 20, 690), Color("b0a894"), 3.0)
	c.draw_rect(Rect2(0, 600, 1280, 4), Color("b0a894"))
	c.draw_rect(Rect2(0, 686, 1280, 4), Color("b0a894"))
