class_name Telas
## Telas de menu, desenhadas em código: título, seleção de lutadores, seleção de cenário,
## ficha dos lutadores, configurações, como jogar, tela de VS e resultado.
## A fonte pixelada mede 8 px por letra na tela real: linhas com até ~56 letras no tamanho menor.


static func apertou(acao: String) -> bool:
	return Input.is_action_just_pressed(acao)


static func confirmou(jogador: int) -> bool:
	var p := "p%d_" % jogador
	return apertou(p + "soco") or apertou(p + "chute") or (jogador == 1 and apertou("ui_accept"))


static func voltou() -> bool:
	return apertou("ui_cancel") or apertou("p1_especial") or apertou("p2_especial")


static func direcao() -> Vector2i:
	var d := Vector2i.ZERO
	for j in [1, 2]:
		if apertou("p%d_esq" % j):
			d.x -= 1
		if apertou("p%d_dir" % j):
			d.x += 1
		if apertou("p%d_cima" % j):
			d.y -= 1
		if apertou("p%d_baixo" % j):
			d.y += 1
	if apertou("ui_left"):
		d.x -= 1
	if apertou("ui_right"):
		d.x += 1
	if apertou("ui_up"):
		d.y -= 1
	if apertou("ui_down"):
		d.y += 1
	return Vector2i(clampi(d.x, -1, 1), clampi(d.y, -1, 1))


## Quebra o texto em linhas de até n letras.
static func quebrar(txt: String, n: int) -> Array[String]:
	var linhas: Array[String] = []
	var atual := ""
	for palavra in txt.split(" "):
		if atual == "":
			atual = palavra
		elif (atual + " " + palavra).length() <= n:
			atual += " " + palavra
		else:
			linhas.append(atual)
			atual = palavra
	if atual != "":
		linhas.append(atual)
	return linhas


## Posição (coordenadas do jogo) de um toque ou clique, ou null. O toque no celular chega como clique.
static func toque(n: Node2D, ev: InputEvent) -> Variant:
	if ev is InputEventScreenTouch:
		Toque.usado = true
	if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
		return Toque.local(n, ev.position)
	return null


## Botão de fliperama: borda grossa, relevo e brilho quando selecionado.
static func botao(c: CanvasItem, r: Rect2, txt: String, cor: Color = Color("ffd23f"), sel := false, tam := 26) -> void:
	var t := Time.get_ticks_msec() * 0.006
	if sel:
		for i in 3:
			c.draw_rect(r.grow(10 + i * 5 + sin(t) * 2.0), Color(cor, 0.12 - i * 0.03))
	c.draw_rect(Rect2(r.position + Vector2(0, 8), r.size).grow(5), Desenho.PRETO)
	c.draw_rect(r.grow(5), Desenho.PRETO)
	c.draw_rect(r, Color("3a2d6a") if sel else Color("2c2450"))
	c.draw_rect(Rect2(r.position, Vector2(r.size.x, r.size.y * 0.45)), Color(1, 1, 1, 0.08 if not sel else 0.16))
	c.draw_rect(Rect2(r.position + Vector2(0, r.size.y - 6), Vector2(r.size.x, 6)), Color(0, 0, 0, 0.3))
	c.draw_rect(r, cor if sel else Color(cor, 0.55), false, 4.0)
	Desenho.texto(c, r.get_center() + Vector2(0, tam * 0.38), txt, tam, cor if sel else Color(1, 1, 1, 0.85), Desenho.PRETO, 5)


static func painel(c: CanvasItem, r: Rect2) -> void:
	c.draw_rect(r.grow(8), Desenho.PRETO)
	c.draw_rect(r.grow(4), Color("ffd23f"))
	c.draw_rect(r, Color("1b1238"))


## Fundo animado dos menus: gradiente escuro, raios de energia girando e brasas subindo.
static func fundo_energia(c: CanvasItem, t: float, cor := Color("ff5a2e")) -> void:
	c.draw_rect(Rect2(0, 0, 1280, 720), Color("120a26"))
	var centro := Vector2(640, 300)
	for i in 18:
		var a := i * TAU / 18.0 + t * 0.15
		var a2 := a + 0.09
		var raio := 1100.0
		var k := 0.06 + 0.04 * sin(t * 2.0 + i)
		c.draw_colored_polygon(PackedVector2Array([centro, centro + Vector2(cos(a), sin(a)) * raio, centro + Vector2(cos(a2), sin(a2)) * raio]), Color(cor, k))
	for i in 30:
		var x := fposmod(i * 97.0 + sin(t + i) * 30.0, 1280.0)
		var y := 760.0 - fposmod(t * (40.0 + (i % 5) * 18.0) + i * 53.0, 800.0)
		var tam := 4.0 + (i % 3) * 2.0
		c.draw_rect(Rect2(x, y, tam, tam), Color(1, 0.6 + 0.3 * (i % 2), 0.2, 0.7))
	c.draw_rect(Rect2(0, 560, 1280, 160), Color(0, 0, 0, 0.35))


## Logo do jogo com contorno grosso, brilho correndo e raio.
static func logo(c: CanvasItem, centro: Vector2, t: float, escala := 1.0) -> void:
	var y := centro.y + sin(t * 2.0) * 4.0
	Desenho.texto(c, Vector2(centro.x + 6, y + 8), "BRASÍLIA", int(128 * escala), Color("7a1020"), Color("7a1020"), 20)
	Desenho.texto(c, Vector2(centro.x, y), "BRASÍLIA", int(128 * escala), Color("ffd23f"), Color("7a1020"), 20)
	# brilho correndo nas letras
	var bx := fposmod(t * 500.0, 2200.0) - 500.0
	c.draw_colored_polygon(PackedVector2Array([Vector2(bx, y - 70 * escala), Vector2(bx + 40, y - 70 * escala), Vector2(bx - 20, y + 10), Vector2(bx - 60, y + 10)]), Color(1, 1, 1, 0.35))
	var y2 := y + 96 * escala
	c.draw_rect(Rect2(centro.x - 300 * escala, y2 - 58 * escala, 600 * escala, 76 * escala), Color("1d3a8a"))
	c.draw_rect(Rect2(centro.x - 300 * escala, y2 - 58 * escala, 600 * escala, 76 * escala), Desenho.PRETO, false, 6.0)
	Desenho.texto(c, Vector2(centro.x, y2), "KOMBAT", int(72 * escala), Color("fbfbf7"), Desenho.PRETO, 12)
	# raios dos lados
	for lado in [-1.0, 1.0]:
		var base := Vector2(centro.x + lado * 380 * escala, y2 - 30)
		if int(t * 4.0) % 5 != 0:
			var pts := PackedVector2Array([base, base + Vector2(lado * 20, 30), base + Vector2(lado * 6, 30), base + Vector2(lado * 26, 70), base + Vector2(-lado * 4, 26), base + Vector2(lado * 10, 26)])
			c.draw_colored_polygon(pts, Color("7ef0ff"))


# ---------------------------------------------------------------- título

class Titulo extends Node2D:
	signal escolheu(opcao: String)
	var opcao := 0
	var t := 0.0
	var _par := 0
	const ITENS := [["PLAY", "1 jogador contra a CPU"], ["MULTIPLAYER", "2 jogadores no mesmo aparelho"], ["ARCADE MODE", "enfrente todos em sequência"],
		["TRAINING", "treino livre, barra infinita"], ["CHARACTERS", "fichas e golpes dos lutadores"], ["SETTINGS", "som, dificuldade e controles"]]
	const CHAVES := ["play", "multiplayer", "arcade", "treino", "lutadores", "config"]

	func _item(i: int) -> Rect2:
		return Rect2(300 + (i % 2) * 356, 336 + (i / 2) * 92, 324, 66)

	func _ready() -> void:
		Som.musica("menu")

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null:
			return
		for i in ITENS.size():
			if _item(i).grow(6).has_point(p):
				opcao = i
				_escolher()
				return

	func _escolher() -> void:
		Som.sfx("menu_ok", 0.0)
		escolheu.emit(CHAVES[opcao])
		set_process(false)
		set_process_unhandled_input(false)

	func _process(delta: float) -> void:
		t += delta
		var d := Telas.direcao()
		if d != Vector2i.ZERO:
			var col := opcao % 2
			var lin := opcao / 2
			col = clampi(col + d.x, 0, 1)
			lin = clampi(lin + d.y, 0, 2)
			var nova := lin * 2 + col
			if nova != opcao:
				opcao = nova
				Som.sfx("menu_mover", 0.0)
		if Telas.confirmou(1) or Telas.confirmou(2):
			_escolher()
		_par = int(t / 4.0)
		queue_redraw()

	func _draw() -> void:
		Telas.fundo_energia(self, t)
		# dois lutadores em pose de combate, trocando de dupla de tempos em tempos
		var n := Personagens.LISTA.size()
		var a: Dictionary = Personagens.LISTA[_par % n]
		var b: Dictionary = Personagens.LISTA[(_par + 2) % n]
		var tq := int(t * 60.0)
		var entra := clampf(fmod(t, 4.0) / 0.35, 0.0, 1.0)
		var pa := Desenho.pose_idle(a, tq)
		pa["mao_f"] = Vector2(56, -150)
		pa["mao_t"] = Vector2(40, -132)
		pa["punho_grande"] = true
		pa["inclina"] = 0.08
		pa["pe_f"] = Vector2(30, 0)
		pa["pe_t"] = Vector2(-30, 0)
		var pb := pa.duplicate()
		pb["cabeca_giro"] = 0.05
		var alt_a: float = a.get("corpo", {}).get("alt", 1.0)
		var alt_b: float = b.get("corpo", {}).get("alt", 1.0)
		# holofotes no chão embaixo de cada lutador
		for xh in [lerpf(-200, 150, entra), lerpf(1480, 1130, entra)]:
			draw_set_transform(Vector2(xh, 690), 0.0, Vector2(1.0, 0.18))
			draw_circle(Vector2.ZERO, 150.0, Color(1, 0.85, 0.4, 0.16))
			draw_circle(Vector2.ZERO, 95.0, Color(0, 0, 0, 0.35))
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		Desenho.lutador_em(self, a, pa, Vector2(lerpf(-200, 150, entra), 690), Vector2(1.55, 1.55) * alt_a)
		Desenho.lutador_em(self, b, pb, Vector2(lerpf(1480, 1130, entra), 690), Vector2(-1.55, 1.55) * alt_b)
		if entra < 1.0:
			draw_rect(Rect2(0, 0, 1280, 720), Color(1, 1, 1, (1.0 - entra) * 0.35))
		Telas.logo(self, Vector2(640, 142), t, 0.76)
		Desenho.texto(self, Vector2(640, 296), "A BRIGA MAIS POLARIZADA DO PAÍS", 22, Color("ffe7b0"), Desenho.PRETO, 6)
		for i in ITENS.size():
			var sel := i == opcao
			var r := _item(i)
			var rot: String = ITENS[i][0]
			Telas.botao(self, r, rot, Color("ffd23f") if sel else Color.WHITE, sel, 24 if rot.length() <= 12 else (18 if rot.length() <= 14 else 15))
		var dica: String = ITENS[opcao][1]
		Desenho.texto(self, Vector2(640, 646), dica, 22, Color("7ec8ff"), Desenho.PRETO, 5)
		Desenho.texto(self, Vector2(640, 706), "Paródia e humor. Sem apoio a partido ou candidato.", 18, Color(1, 1, 1, 0.75), Desenho.PRETO, 4)


# ---------------------------------------------------------------- seleção de lutadores

class Selecao extends Node2D:
	signal pronto(a: int, b: int)
	signal voltar
	var modo := 1  # 1 = contra a CPU, 2 = dois jogadores, 3 = arcade/treino (só o jogador 1)
	var cursor := [0, 1]
	var confirmado := [false, false]
	var t := 0.0
	var meme := {}
	var espera := 0.0
	const COLS := 3
	const CARTAO := Vector2(180, 126)
	const ORIGEM := Vector2(355, 140)
	const BT_VOLTAR := Rect2(380, 650, 220, 50)
	const BT_ALEATORIO := Rect2(680, 650, 220, 50)

	func _ready() -> void:
		Som.musica("selecao")
		if modo == 3:
			confirmado[1] = true

	func _process(delta: float) -> void:
		t += delta
		if not meme.is_empty():
			meme["t"] += 1
			if meme["t"] >= meme["dur"]:
				meme = {}
		if Telas.apertou("ui_cancel"):
			Som.sfx("menu_voltar", 0.0)
			voltar.emit()
			return
		if confirmado[0] and confirmado[1]:
			espera -= delta
			if espera <= 0.0 and meme.is_empty():
				pronto.emit(cursor[0], cursor[1])
				set_process(false)
			queue_redraw()
			return
		if modo == 1:
			var i := 0 if not confirmado[0] else 1
			_mover(i, 1)
			if Telas.confirmou(1):
				_confirmar(i)
			elif Telas.apertou("p1_especial") and confirmado[0]:
				cursor[1] = randi() % Personagens.LISTA.size()
				_confirmar(1)
		elif modo == 3:
			_mover(0, 1)
			if Telas.confirmou(1):
				_confirmar(0)
		else:
			for i in 2:
				if not confirmado[i]:
					_mover(i, i + 1)
					if Telas.confirmou(i + 1):
						_confirmar(i)
				elif Telas.apertou("p%d_especial" % (i + 1)):
					confirmado[i] = false
		queue_redraw()

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null or (confirmado[0] and confirmado[1]):
			return
		if BT_VOLTAR.has_point(p):
			Som.sfx("menu_voltar", 0.0)
			voltar.emit()
			return
		var i := 0 if not confirmado[0] else 1
		if BT_ALEATORIO.has_point(p):
			cursor[i] = randi() % Personagens.LISTA.size()
			_confirmar(i)
			return
		for k in Personagens.LISTA.size():
			if _cartao(k).has_point(p):
				if cursor[i] == k or Toque.usado:
					cursor[i] = k
					_confirmar(i)
				else:
					cursor[i] = k
					Som.sfx("menu_mover", 0.0)
				return

	func _confirmar(i: int) -> void:
		confirmado[i] = true
		espera = 0.5
		Som.sfx("menu_ok", 0.0)
		var d: Dictionary = Personagens.LISTA[cursor[i]]
		Som.voz(d["id"], "provocar")
		var memes: Array = d.get("memes", [])
		if memes.is_empty():
			return
		var n := randi() % memes.size()
		meme = {"lado": i, "txt": memes[n], "dados": d, "t": 0, "dur": 70}

	func _mover(i: int, jogador: int) -> void:
		var pre := "p%d_" % jogador
		var n := Personagens.LISTA.size()
		var antes: int = cursor[i]
		if Telas.apertou(pre + "dir") or (jogador == 1 and Telas.apertou("ui_right")):
			cursor[i] = (cursor[i] + 1) % n
		if Telas.apertou(pre + "esq") or (jogador == 1 and Telas.apertou("ui_left")):
			cursor[i] = (cursor[i] - 1 + n) % n
		if Telas.apertou(pre + "baixo"):
			cursor[i] = mini(cursor[i] + COLS, n - 1) if cursor[i] + COLS < n else cursor[i] % COLS
		if Telas.apertou(pre + "cima"):
			cursor[i] = cursor[i] - COLS if cursor[i] - COLS >= 0 else mini(cursor[i] + COLS, n - 1)
		if cursor[i] != antes:
			Som.sfx("menu_mover", 0.0)

	func _cartao(i: int) -> Rect2:
		return Rect2(ORIGEM + Vector2((i % COLS) * (CARTAO.x + 10), (i / COLS) * (CARTAO.y + 12)), CARTAO)

	func _draw() -> void:
		Telas.fundo_energia(self, t, Color("3a5aff"))
		Desenho.texto(self, Vector2(640, 76), "ESCOLHA SEU LUTADOR", 50, Color("ffd23f"), Desenho.PRETO, 10)
		var dica := "Escolha o seu e depois o rival (Especial = aleatório)" if modo == 1 else ("Cada jogador escolhe com seus comandos" if modo == 2 else "Escolha o seu lutador")
		Desenho.texto(self, Vector2(640, 108), dica, 20, Color(1, 1, 1, 0.8), Desenho.PRETO, 5)
		var n := Personagens.LISTA.size()
		for i in n + Personagens.EM_BREVE.size():
			var r := _cartao(i)
			draw_rect(r.grow(4), Desenho.PRETO)
			if i < n:
				var d: Dictionary = Personagens.LISTA[i]
				var sel: bool = cursor[0] == i or (cursor[1] == i and modo != 3)
				draw_rect(r, Color("2c2450") if not sel else Color("3d3270"))
				var cor_p: Color = d.get("cor", Color.WHITE)
				draw_rect(Rect2(r.position, Vector2(r.size.x, 8)), cor_p)
				var ex := "feliz" if sel else ("piscar" if int(t * 10 + i * 7) % 40 == 0 else "neutro")
				Desenho.cabeca(self, d, r.get_center() + Vector2(0, -18 + (sin(t * 6.0) * 2.0 if sel else 0.0)), 40.0 * (1.08 if sel else 1.0), {"expr": ex, "cabeca_giro": sin(t * 3.0 + i) * 0.05 if sel else 0.0})
				var nome_c: String = d["nome"]
				Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 8), nome_c, 22 if nome_c.length() <= 7 else 16, Color.WHITE, Desenho.PRETO, 5)
			else:
				draw_rect(r, Color("201a38"))
				Desenho.texto(self, r.get_center() + Vector2(0, 8), "?", 80, Color(1, 1, 1, 0.18), Desenho.PRETO, 0)
				Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 8), Personagens.EM_BREVE[i - n], 20, Color(1, 1, 1, 0.35), Desenho.PRETO, 0)
		for k in (1 if modo == 3 else 2):
			var r := _cartao(cursor[k]).grow(6 + k * 8)
			var cor := Color("2a9df4") if k == 0 else Color("e63946")
			if not confirmado[k] or int(t * 6) % 2 == 0:
				draw_rect(r, cor, false, 6.0)
			var rotulo := "1P" if k == 0 else ("CPU" if modo == 1 else "2P")
			# etiqueta colada na quina de fora da moldura
			var ep := Vector2(r.position.x + 4, r.position.y - 22) if k == 0 else Vector2(r.end.x - 60, r.end.y + 2)
			draw_rect(Rect2(ep, Vector2(56, 24)), cor)
			Desenho.texto(self, ep + Vector2(28, 21), rotulo, 18, Color.WHITE, Desenho.PRETO, 4)
		for k in (1 if modo == 3 else 2):
			_ficha(k)
		if modo != 3:
			Desenho.texto(self, Vector2(640, 612), "VS", 48, Color("ff5a4e"), Desenho.PRETO, 12)
		Telas.botao(self, BT_VOLTAR, "< VOLTAR", Color.WHITE, false, 20)
		Telas.botao(self, BT_ALEATORIO, "ALEATÓRIO", Color("ffd23f"), false, 20)
		if not meme.is_empty():
			Luta.desenhar_meme(self, meme["dados"], meme["txt"], int(meme["lado"]), int(meme["t"]), int(meme["dur"]))

	## Ficha do lado: lutador de corpo inteiro, nome, título, atributos, Super e Ultimate.
	## (cabem ~15 letras por linha nesta coluna)
	func _ficha(k: int) -> void:
		var d: Dictionary = Personagens.LISTA[cursor[k]]
		var esq := k == 0
		var x := 170.0 if esq else 1110.0
		var tq := int(t * 60.0)
		var pose := Desenho.pose_vitoria(d, tq) if confirmado[k] else Desenho.pose_idle(d, tq + k * 50)
		pose["t"] = tq
		var alt: float = d.get("corpo", {}).get("alt", 1.0)
		var cor_p: Color = d.get("cor", Color.WHITE)
		draw_circle(Vector2(x, 380), 140, Color(cor_p, 0.12))
		Desenho.lutador_em(self, d, pose, Vector2(x, 480), Vector2(1.1 * (1 if esq else -1), 1.1) * alt)
		var nome_f: String = d["nome"]
		Desenho.texto(self, Vector2(x, 160), nome_f, 32 if nome_f.length() <= 7 else 25, Color("ffd23f"), Desenho.PRETO, 8)
		Desenho.texto(self, Vector2(x, 190), d["titulo"], 18, Color.WHITE, Desenho.PRETO, 4)
		var atributos := [["VIDA", (float(d["vida"]) - 900.0) / 200.0], ["FORÇA", (float(d["forca"]) - 0.85) / 0.25], ["VELOC.", (float(d["velocidade"]) - 0.85) / 0.3]]
		for j in 3:
			var y := 512.0 + j * 24.0
			Desenho.texto_esq(self, Vector2(x - 150, y + 10), atributos[j][0], 16, Color("7ec8ff"), 4)
			draw_rect(Rect2(x - 4, y - 4, 152, 14), Desenho.PRETO)
			draw_rect(Rect2(x - 2, y - 2, 148 * clampf(atributos[j][1], 0.1, 1.0), 10), cor_p)
		var hab: Dictionary = d["habilidades"]
		# Super (azul) e Ultimate (dourado), até 15 letras por linha
		var y2 := 590.0
		for linha in Telas.quebrar(String(hab["super"]["nome"]), 15):
			y2 += 22.0
			Desenho.texto(self, Vector2(x, y2), linha, 16, Color("7ef0ff"), Desenho.PRETO, 4)
		y2 += 8.0
		for linha in Telas.quebrar(String(hab["ultimate"]["nome"]), 15):
			y2 += 22.0
			Desenho.texto(self, Vector2(x, y2), linha, 16, Color("ffd23f"), Desenho.PRETO, 4)


# ---------------------------------------------------------------- seleção de cenário

class SelecaoCenario extends Node2D:
	signal pronto(id: String)
	signal voltar
	var opcao := 0
	var t := 0.0
	const BT_VOLTAR := Rect2(30, 650, 170, 50)

	func _miniatura(i: int) -> Rect2:
		return Rect2(150 + (i % 2) * 520, 120 + (i / 2) * 246, 460, 236)

	func _ready() -> void:
		# miniaturas desenhadas uma vez (cada cenário inteiro, reduzido)
		for i in Cenarios.LISTA.size():
			var r := _miniatura(i)
			var id: String = Cenarios.LISTA[i]["id"]
			var cache := Cache.criar(self, self, func(c: CanvasItem) -> void: Cenarios.completo(c, id, 3.0, 0.4), -1)
			cache.sprite.position = r.position
			cache.sprite.scale = r.size / Vector2(cache.vp.size)
		var fundo := Camada.new()
		fundo.z_index = -2
		fundo.desenhar = func(c: CanvasItem) -> void: c.draw_rect(Rect2(0, 0, 1280, 720), Color("120a26"))
		add_child(fundo)

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null:
			return
		if BT_VOLTAR.has_point(p):
			voltar.emit()
			return
		for i in Cenarios.LISTA.size():
			if _miniatura(i).has_point(p):
				opcao = i
				_escolher()

	func _escolher() -> void:
		Som.sfx("menu_ok", 0.0)
		pronto.emit(Cenarios.LISTA[opcao]["id"])
		set_process(false)
		set_process_unhandled_input(false)

	func _process(delta: float) -> void:
		t += delta
		var d := Telas.direcao()
		if d != Vector2i.ZERO:
			var col := clampi(opcao % 2 + d.x, 0, 1)
			var lin := clampi(opcao / 2 + d.y, 0, 1)
			if lin * 2 + col != opcao:
				opcao = lin * 2 + col
				Som.sfx("menu_mover", 0.0)
		if Telas.confirmou(1) or Telas.confirmou(2):
			_escolher()
		elif Telas.apertou("ui_cancel"):
			voltar.emit()
		queue_redraw()

	func _draw() -> void:
		# esconde o que as miniaturas desenham fora da moldura (nuvens e carros passando)
		var fundo := Color("120a26")
		draw_rect(Rect2(0, 0, 1280, 114), fundo)
		draw_rect(Rect2(0, 356, 1280, 8), fundo)
		draw_rect(Rect2(0, 606, 1280, 114), fundo)
		draw_rect(Rect2(0, 0, 144, 720), fundo)
		draw_rect(Rect2(616, 0, 48, 720), fundo)
		draw_rect(Rect2(1136, 0, 144, 720), fundo)
		Desenho.texto(self, Vector2(640, 80), "ESCOLHA A ARENA", 52, Color("ffd23f"), Desenho.PRETO, 10)
		for i in Cenarios.LISTA.size():
			var r := _miniatura(i)
			var sel := i == opcao
			draw_rect(r.grow(6), Color("ffd23f") if sel else Desenho.PRETO, false, 8.0 if sel else 6.0)
			if not sel:
				draw_rect(r, Color(0, 0, 0, 0.35))
			draw_rect(Rect2(r.position + Vector2(0, r.size.y - 62), Vector2(r.size.x, 62)), Color(0, 0, 0, 0.75))
			Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 34), Cenarios.LISTA[i]["nome"], 24, Color("ffd23f") if sel else Color.WHITE, Desenho.PRETO, 5)
			Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 8), Cenarios.LISTA[i]["local"], 14, Color(1, 1, 1, 0.75), Desenho.PRETO, 0)
		Telas.botao(self, BT_VOLTAR, "< VOLTAR", Color.WHITE, false, 20)


# ---------------------------------------------------------------- ficha dos lutadores

class Lutadores extends Node2D:
	signal voltar
	var indice := 0
	var t := 0.0
	var demo := 0  # qual golpe está sendo mostrado
	var demo_t := 0
	const BT_VOLTAR := Rect2(30, 650, 170, 50)
	const BT_ESQ := Rect2(24, 330, 70, 90)
	const BT_DIR := Rect2(406, 330, 70, 90)
	const DEMOS := ["idle", "projetil", "frente", "cima", "baixo", "tras", "super", "ultimate", "provocar", "vitoria"]

	func _ready() -> void:
		Som.musica("selecao")

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null:
			return
		if BT_VOLTAR.has_point(p):
			voltar.emit()
		elif BT_ESQ.has_point(p):
			_trocar(-1)
		elif BT_DIR.has_point(p):
			_trocar(1)
		elif Rect2(530, 110, 720, 530).has_point(p):
			var dl: Dictionary = Personagens.LISTA[indice]
			var y0 := 146.0 + Telas.quebrar(dl["bio"], 31).size() * 22.0 + 20.0
			var linha := int(floor((p.y - y0 + 26.0) / 50.0))
			if linha >= 0 and linha < 7:
				demo = linha + 1
				demo_t = 0

	func _trocar(d: int) -> void:
		indice = wrapi(indice + d, 0, Personagens.LISTA.size())
		demo = 0
		demo_t = 0
		Som.sfx("menu_mover", 0.0)

	func _process(delta: float) -> void:
		t += delta
		demo_t += 1
		var d := Telas.direcao()
		if d.x != 0:
			_trocar(d.x)
		if d.y != 0:
			demo = wrapi(demo + d.y, 0, DEMOS.size())
			demo_t = 0
		if Telas.confirmou(1):
			demo = wrapi(demo + 1, 0, DEMOS.size())
			demo_t = 0
		if Telas.voltou():
			voltar.emit()
			set_process(false)
		if demo_t > 150:
			demo = wrapi(demo + 1, 0, DEMOS.size())
			demo_t = 0
		queue_redraw()

	func _pose_demo(dl: Dictionary) -> Dictionary:
		var nome: String = DEMOS[demo]
		var p := Desenho.pose_idle(dl, demo_t)
		match nome:
			"provocar":
				p = Desenho.pose_provocar(dl, demo_t)
			"vitoria":
				p = Desenho.pose_vitoria(dl, demo_t)
			"idle":
				pass
			_:
				var h: Dictionary = dl["habilidades"].get(nome, {})
				if not h.is_empty():
					var ini: int = h["inicio"]
					var ativo: int = h["ativo"]
					var rec: int = h["rec"]
					var tt := demo_t % (ini + ativo + rec + 30)
					if tt < ini + ativo + rec:
						Poses.habilidade(dl, h.get("pose", ""), tt, ini, ativo, rec, p)
		p["t"] = demo_t
		return p

	func _draw() -> void:
		Telas.fundo_energia(self, t, Color("ff3b6b"))
		var dl: Dictionary = Personagens.LISTA[indice]
		var cor_p: Color = dl.get("cor", Color.WHITE)
		Telas.painel(self, Rect2(110, 110, 380, 530))
		draw_circle(Vector2(300, 430), 150, Color(cor_p, 0.15))
		var alt: float = dl.get("corpo", {}).get("alt", 1.0)
		Desenho.lutador_em(self, dl, _pose_demo(dl), Vector2(300, 540), Vector2(1.2, 1.2) * alt)
		Desenho.texto(self, Vector2(300, 158), dl["nome"], 32, Color("ffd23f"), Desenho.PRETO, 8)
		Desenho.texto(self, Vector2(300, 188), dl["titulo"], 18, Color.WHITE, Desenho.PRETO, 4)
		var nome_demo: String = DEMOS[demo]
		var rot: String = {"idle": "PARADO", "provocar": "PROVOCAÇÃO", "vitoria": "VITÓRIA"}.get(nome_demo, String(dl["habilidades"].get(nome_demo, {}).get("nome", "")).to_upper())
		var linhas_rot := Telas.quebrar(rot, 16)
		for j in linhas_rot.size():
			Desenho.texto(self, Vector2(300, 580 + j * 22), linhas_rot[j], 18, Color("7ef0ff"), Desenho.PRETO, 4)
		Telas.botao(self, BT_ESQ, "<", Color.WHITE, false, 40)
		Telas.botao(self, BT_DIR, ">", Color.WHITE, false, 40)
		# coluna da direita: ~33 letras por linha
		Telas.painel(self, Rect2(530, 110, 720, 530))
		var bio := Telas.quebrar(dl["bio"], 31)
		for j in bio.size():
			Desenho.texto_esq(self, Vector2(552, 146 + j * 22), bio[j], 16, Color(1, 1, 1, 0.9), 4)
		var hab: Dictionary = dl["habilidades"]
		var y0 := 146.0 + bio.size() * 22.0 + 20.0
		for j in Personagens.COMANDOS.size():
			var slot: String = Personagens.COMANDOS[j][0]
			var y := y0 + j * 50.0
			var sel := demo == j + 1
			if sel:
				draw_rect(Rect2(540, y - 26, 700, 50), Color(cor_p, 0.25))
			var h: Dictionary = hab.get(slot, {})
			var cor_nome := Color("ffd23f") if slot == "ultimate" else (Color("7ef0ff") if slot == "super" else Color("ff8a5c"))
			Desenho.texto_esq(self, Vector2(552, y), String(h.get("nome", "-")), 18, cor_nome, 5)
			Desenho.texto_esq(self, Vector2(572, y + 23), Personagens.COMANDOS[j][1], 14, Color(1, 1, 1, 0.65), 4)
		Desenho.texto_esq(self, Vector2(552, 626), "Toque num golpe para ver", 14, Color("7ec8ff"), 4)
		Telas.botao(self, BT_VOLTAR, "< VOLTAR", Color.WHITE, false, 20)


# ---------------------------------------------------------------- configurações

class Configuracoes extends Node2D:
	signal voltar
	signal como_jogar
	var opcao := 0
	var t := 0.0
	const ITENS := ["MÚSICA", "EFEITOS", "DIFICULDADE", "TREMOR DE TELA", "CONTROLES DE TOQUE", "TEMPO DO ROUND", "TELA CHEIA", "COMO JOGAR", "VOLTAR"]

	func _linha(i: int) -> Rect2:
		return Rect2(240, 140 + i * 58, 800, 48)

	func _valor(i: int) -> String:
		match i:
			0:
				return "%d%%" % int(round(Config.musica * 100))
			1:
				return "%d%%" % int(round(Config.efeitos * 100))
			2:
				return Config.DIFICULDADES[Config.dificuldade]
			3:
				return "LIGADO" if Config.tremor else "DESLIGADO"
			4:
				return ["AUTOMÁTICO", "SEMPRE", "NUNCA"][Config.toque]
			5:
				return "SEM TEMPO" if Config.tempo_round == 0 else "%d s" % Config.tempo_round
		return ""

	func _mudar(i: int, d: int) -> void:
		match i:
			0:
				Config.musica = clampf(Config.musica + d * 0.1, 0.0, 1.0)
				Som.atualizar_volume()
			1:
				Config.efeitos = clampf(Config.efeitos + d * 0.1, 0.0, 1.0)
			2:
				Config.dificuldade = wrapi(Config.dificuldade + d, 0, 3)
			3:
				Config.tremor = not Config.tremor
			4:
				Config.toque = wrapi(Config.toque + d, 0, 3)
			5:
				var tempos := [60, 99, 0]
				Config.tempo_round = tempos[wrapi(tempos.find(Config.tempo_round) + d, 0, 3)]
			6:
				Config.alternar_tela_cheia()
				Som.sfx("menu_ok", 0.0)
				return
			7:
				como_jogar.emit()
				return
			8:
				Config.salvar()
				voltar.emit()
				return
		Config.salvar()
		Som.sfx("menu_mover", 0.0)

	func _ready() -> void:
		Som.musica("menu")

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null:
			return
		for i in ITENS.size():
			if _linha(i).has_point(p):
				opcao = i
				_mudar(i, -1 if p.x < 640 and i < 6 else 1)
				return

	func _process(delta: float) -> void:
		t += delta
		var d := Telas.direcao()
		if d.y != 0:
			opcao = wrapi(opcao + d.y, 0, ITENS.size())
			Som.sfx("menu_mover", 0.0)
		if d.x != 0 and opcao < 6:
			_mudar(opcao, d.x)
		if Telas.confirmou(1):
			_mudar(opcao, 1)
		if Telas.apertou("ui_cancel"):
			Config.salvar()
			voltar.emit()
			set_process(false)
		queue_redraw()

	func _draw() -> void:
		Telas.fundo_energia(self, t, Color("1f9d55"))
		Desenho.texto(self, Vector2(640, 96), "SETTINGS", 64, Color("ffd23f"), Desenho.PRETO, 10)
		for i in ITENS.size():
			var r := _linha(i)
			var sel := i == opcao
			draw_rect(r.grow(4), Desenho.PRETO)
			draw_rect(r, Color("3a2d6a") if sel else Color("231b44"))
			if sel:
				draw_rect(r, Color("ffd23f"), false, 4.0)
			if i < 6:
				Desenho.texto_esq(self, r.position + Vector2(24, 36), ITENS[i], 22, Color.WHITE, 5)
				Desenho.texto_dir(self, Vector2(r.end.x - 70, r.position.y + 36), _valor(i), 22, Color("ffd23f"), 5)
				Desenho.texto(self, Vector2(r.end.x - 40, r.position.y + 36), "<>", 18, Color(1, 1, 1, 0.5), Desenho.PRETO, 0)
			else:
				Desenho.texto(self, r.get_center() + Vector2(0, 10), ITENS[i], 24, Color("ffd23f") if sel else Color.WHITE, Desenho.PRETO, 5)
		Desenho.texto(self, Vector2(640, 706), "No toque: lado esquerdo diminui, lado direito aumenta.", 16, Color(1, 1, 1, 0.6), Desenho.PRETO, 0)


# ---------------------------------------------------------------- como jogar

class ComoJogar extends Node2D:
	signal voltar
	var t := 0.0

	func _unhandled_input(ev: InputEvent) -> void:
		if t > 0.3 and Telas.toque(self, ev) != null:
			voltar.emit()
			set_process_unhandled_input(false)

	func _process(delta: float) -> void:
		t += delta
		if t > 0.3 and (Telas.confirmou(1) or Telas.confirmou(2) or Telas.voltou()):
			voltar.emit()
			set_process(false)
		queue_redraw()

	func _draw() -> void:
		draw_rect(Rect2(0, 0, 1280, 720), Color("1b1238"))
		Desenho.texto(self, Vector2(640, 64), "COMO JOGAR", 48, Color("ffd23f"), Desenho.PRETO, 10)
		var tabela := [
			["", "JOGADOR 1", "JOGADOR 2"],
			["Mover", "A D W S", "setas"],
			["Soco / Chute", "F / G", ", / . (ou 1 / 2)"],
			["Especial", "H", "/ (ou 3)"],
			["SUPER", "J", "K (ou 5)"],
			["Agarrar", "T", "L (ou 6)"],
			["Provocar", "R", "; (ou 4)"],
		]
		for i in tabela.size():
			var linha: Array = tabela[i]
			var y := 112.0 + i * 26.0
			var cor := Color("ffd23f") if i == 0 else Color.WHITE
			Desenho.texto_esq(self, Vector2(60, y), linha[0], 16, Color("7ec8ff"), 0)
			Desenho.texto_esq(self, Vector2(420, y), linha[1], 16, cor, 0)
			Desenho.texto_esq(self, Vector2(720, y), linha[2], 16, cor, 0)
		var dicas := [
			["Soco forte", "frente + Soco"],
			["Chute alto", "frente + Chute"],
			["Rasteira", "baixo + Chute"],
			["No ar", "Soco, Chute ou baixo + Chute"],
			["Combo", "Soco, Soco, Chute"],
			["Dash/esquiva", "2 toques p/ frente ou p/ trás"],
			["Defesa", "segure para trás"],
			["Def. perfeita", "defenda na hora: rival desequilibra"],
			["Agarrão", "Agarrar (ou Soco+Chute) de perto"],
			["Especiais", "Especial + direção (5 golpes)"],
			["SUPERPOWER", "SUPER com meia barra"],
			["ULTIMATE", "SUPER com a barra cheia"],
		]
		for i in dicas.size():
			var y := 316.0 + i * 30.0
			Desenho.texto_esq(self, Vector2(60, y), dicas[i][0], 16, Color("ff8a5c"), 0)
			Desenho.texto_esq(self, Vector2(400, y), dicas[i][1], 16, Color.WHITE, 0)
		Desenho.texto(self, Vector2(640, 700), "Controle: X soco A chute B esp. RB super LB agarra", 16, Color("ffd23f"), Desenho.PRETO, 0)


# ---------------------------------------------------------------- tela de VS

class Versus extends Node2D:
	signal fim
	var a: Dictionary
	var b: Dictionary
	var cenario := "praca"
	var rotulo := ""
	var t := 0.0
	var _som_feito := false

	func _process(delta: float) -> void:
		t += delta
		if t > 0.35 and not _som_feito:
			_som_feito = true
			Som.sfx("impacto", 0.0)
		if t > 2.6 or (t > 0.8 and (Telas.confirmou(1) or Telas.confirmou(2))):
			fim.emit()
			set_process(false)
		queue_redraw()

	func _unhandled_input(ev: InputEvent) -> void:
		if t > 0.8 and Telas.toque(self, ev) != null:
			fim.emit()
			set_process(false)

	func _draw() -> void:
		var k := clampf(t / 0.35, 0.0, 1.0)
		var e := 1.0 - pow(1.0 - k, 3.0)
		draw_rect(Rect2(0, 0, 1280, 720), Color("120a26"))
		# metades diagonais coloridas
		var ca: Color = a.get("cor", Color("2a9df4"))
		var cb: Color = b.get("cor", Color("e63946"))
		draw_colored_polygon(PackedVector2Array([Vector2(-700 + 700 * e, 0), Vector2(760 - 700 + 700 * e, 0), Vector2(520 - 700 + 700 * e, 720), Vector2(-700 + 700 * e, 720)]), Color(ca, 0.5))
		draw_colored_polygon(PackedVector2Array([Vector2(760 + 700 - 700 * e, 0), Vector2(1980 - 700 * e, 0), Vector2(1980 - 700 * e, 720), Vector2(520 + 700 - 700 * e, 720)]), Color(cb, 0.5))
		for i in 12:
			var x := fposmod(i * 140.0 + t * 600.0, 1600.0) - 160.0
			draw_line(Vector2(x, 0), Vector2(x - 240, 720), Color(1, 1, 1, 0.06), 20.0)
		Desenho._mat_tronco = Transform2D(0.0, Vector2(1, 1), 0.0, Vector2(lerpf(-300, 330, e), 560))
		Desenho.cabeca(self, a, Vector2(0, -150), 150.0, {"expr": "grito" if fmod(t, 0.6) < 0.3 else "feliz", "retrato": true})
		Desenho._mat_tronco = Transform2D(0.0, Vector2(-1, 1), 0.0, Vector2(lerpf(1580, 950, e), 560))
		Desenho.cabeca(self, b, Vector2(0, -150), 150.0, {"expr": "esforco" if fmod(t, 0.7) < 0.35 else "grito", "retrato": true})
		Desenho._mat_tronco = Transform2D.IDENTITY
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		Desenho.texto(self, Vector2(lerpf(-300, 330, e), 640), a["nome"], 48, Color("ffd23f"), Desenho.PRETO, 10)
		Desenho.texto(self, Vector2(lerpf(1580, 950, e), 640), b["nome"], 48, Color("ffd23f"), Desenho.PRETO, 10)
		var vs := 1.0 + maxf(0.0, 0.6 - (t - 0.3)) * 2.0 if t > 0.3 else 0.0
		if vs > 0.0:
			# raio do choque entre os dois e estrela atrás do VS
			var cen := Vector2(640, 360)
			for j in 14:
				var a := j * TAU / 14.0 + t * 0.8
				var a2 := a + TAU / 34.0
				draw_colored_polygon(PackedVector2Array([cen, cen + Vector2(cos(a), sin(a)) * 420.0 * minf(vs, 1.3), cen + Vector2(cos(a2), sin(a2)) * 420.0 * minf(vs, 1.3)]), Color(1, 0.85, 0.3, 0.12))
			var zig := PackedVector2Array()
			for j in 9:
				zig.append(Vector2(640 + (14.0 if j % 2 == 0 else -14.0) * vs, 120 + j * 62.0))
			draw_polyline(zig, Color(1, 1, 1, 0.85), 6.0)
			Desenho.texto(self, Vector2(640, 400), "VS", int(120 * vs), Color("ff5a4e"), Desenho.PRETO, 16)
		var nome_c: String = Cenarios.LISTA[Cenarios.indice(cenario)]["nome"]
		Desenho.texto(self, Vector2(640, 700), "ARENA: " + nome_c, 20, Color.WHITE, Desenho.PRETO, 5)
		if rotulo != "":
			Desenho.texto(self, Vector2(640, 60), rotulo, 28, Color("7ec8ff"), Desenho.PRETO, 6)


# ---------------------------------------------------------------- resultado

class Resultado extends Node2D:
	signal revanche
	signal trocar
	var dados: Dictionary = {}
	var perdedor: Dictionary = {}
	var quem := "P1"
	var t := 0.0
	var texto_revanche := "REVANCHE"
	var texto_trocar := "MENU"
	var campeao := false
	const BT_REVANCHE := Rect2(290, 636, 320, 58)
	const BT_TROCAR := Rect2(670, 636, 320, 58)

	func _ready() -> void:
		Som.musica("selecao")

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null or t < 0.8:
			return
		if BT_REVANCHE.has_point(p):
			revanche.emit()
			set_process_unhandled_input(false)
		elif BT_TROCAR.has_point(p):
			trocar.emit()
			set_process_unhandled_input(false)

	func _process(delta: float) -> void:
		t += delta
		if t > 0.8:
			if Telas.confirmou(1) or Telas.confirmou(2):
				Som.sfx("menu_ok", 0.0)
				revanche.emit()
				set_process(false)
			elif Telas.voltou():
				trocar.emit()
				set_process(false)
		queue_redraw()

	func _draw() -> void:
		Telas.fundo_energia(self, t, Color("ffd23f"))
		var titulo := "CAMPEÃO!" if campeao else "%s VENCEU!" % dados["nome"]
		Desenho.texto(self, Vector2(640, 92), titulo, 64, Color("ffd23f"), Desenho.PRETO, 12)
		Desenho.texto(self, Vector2(640, 132), quem, 22, Color.WHITE, Desenho.PRETO, 5)
		var tq := int(t * 60.0)
		var alt_v: float = dados.get("corpo", {}).get("alt", 1.0)
		var pv := Desenho.pose_vitoria(dados, tq)
		pv["t"] = tq
		Desenho.lutador_em(self, dados, pv, Vector2(330, 620), Vector2(1.7, 1.7) * alt_v)
		if not campeao and not perdedor.is_empty():
			var alt_d: float = perdedor.get("corpo", {}).get("alt", 1.0)
			Desenho.lutador_em(self, perdedor, Desenho.pose_derrota(perdedor, tq), Vector2(980, 620), Vector2(-1.4, 1.4) * alt_d)
		var linhas := Telas.quebrar("\"%s\"" % dados["vitoria"], 26)
		var balao := Rect2(510, 190, 600, 40 + linhas.size() * 30)
		draw_rect(balao.grow(5), Desenho.PRETO)
		draw_rect(balao, Desenho.BRANCO)
		draw_colored_polygon(PackedVector2Array([Vector2(530, balao.end.y - 2), Vector2(600, balao.end.y - 2), Vector2(470, balao.end.y + 70)]), Desenho.PRETO)
		draw_colored_polygon(PackedVector2Array([Vector2(536, balao.end.y - 4), Vector2(592, balao.end.y - 4), Vector2(480, balao.end.y + 58)]), Desenho.BRANCO)
		for i in linhas.size():
			Desenho.texto(self, Vector2(balao.get_center().x, balao.position.y + 46 + i * 30), linhas[i], 24, Desenho.PRETO, Desenho.BRANCO, 0)
		Telas.botao(self, BT_REVANCHE, texto_revanche, Color("ffd23f"), true, 22)
		Telas.botao(self, BT_TROCAR, texto_trocar, Color.WHITE, false, 22)
