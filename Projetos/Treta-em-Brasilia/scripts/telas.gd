class_name Telas
## Telas de menu: título, como jogar, seleção de personagens e resultado. Desenhadas em código.
## A fonte pixelada mede 8 px por letra na tela real: linhas com até ~56 letras no tamanho menor.


static func apertou(acao: String) -> bool:
	return Input.is_action_just_pressed(acao)


static func confirmou(jogador: int) -> bool:
	var p := "p%d_" % jogador
	return apertou(p + "soco") or apertou(p + "chute") or (jogador == 1 and apertou("ui_accept"))


static func voltou() -> bool:
	return apertou("ui_cancel") or apertou("p1_especial") or apertou("p2_especial")


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


static func botao(c: CanvasItem, r: Rect2, txt: String, cor: Color = Color("ffd23f")) -> void:
	c.draw_rect(r.grow(5), Desenho.PRETO)
	c.draw_rect(r, Color("2c2450"))
	c.draw_rect(r, cor, false, 4.0)
	Desenho.texto(c, r.get_center() + Vector2(0, 10), txt, 26, cor, Desenho.PRETO, 4)


static func painel(c: CanvasItem, r: Rect2) -> void:
	c.draw_rect(r.grow(8), Desenho.PRETO)
	c.draw_rect(r.grow(4), Color("ffd23f"))
	c.draw_rect(r, Color("1b1238"))


class Titulo extends Node2D:
	signal escolheu(modo: int)  # 1, 2 ou 3 (como jogar)
	var opcao := 0
	var t := 0.0
	const ITENS := ["1 JOGADOR", "2 JOGADORES", "COMO JOGAR"]

	func _item(i: int) -> Rect2:
		return Rect2(410, 432 + i * 56 - 42, 460, 54)

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null:
			return
		for i in ITENS.size():
			if _item(i).has_point(p):
				opcao = i
				escolheu.emit(i + 1)
				return

	func _process(delta: float) -> void:
		t += delta
		for a in ["p1_baixo", "p2_baixo", "ui_down"]:
			if Telas.apertou(a):
				opcao = (opcao + 1) % ITENS.size()
		for a in ["p1_cima", "p2_cima", "ui_up"]:
			if Telas.apertou(a):
				opcao = (opcao + ITENS.size() - 1) % ITENS.size()
		if Telas.confirmou(1) or Telas.confirmou(2):
			escolheu.emit(opcao + 1)
		queue_redraw()

	func _draw() -> void:
		Desenho.cenario(self, t)
		draw_rect(Rect2(0, 0, 1280, 720), Color(0.06, 0.03, 0.14, 0.62))
		var y := 170.0 + sin(t * 2.0) * 6.0
		Desenho.texto(self, Vector2(640, y), "BRASÍLIA", 128, Color("ffd23f"), Color("7a1020"), 20)
		Desenho.texto(self, Vector2(640, y + 92), "KOMBAT", 64, Color("fbfbf7"), Color("1d3a8a"), 14)
		Desenho.texto(self, Vector2(640, y + 140), "A BRIGA MAIS POLARIZADA DO PAÍS", 26, Color("ffe7b0"), Desenho.PRETO, 6)
		Telas.painel(self, Rect2(400, 372, 480, 196))
		for i in ITENS.size():
			var sel := i == opcao
			var cor := Color("ffd23f") if sel else Color(1, 1, 1, 0.7)
			var txt: String = ITENS[i]
			if sel:
				txt = ("> " + txt + " <") if int(t * 3) % 2 == 0 else ("  " + txt + "  ")
			Desenho.texto(self, Vector2(640, 432 + i * 56), txt, 40, cor, Desenho.PRETO, 6)
		for i in Personagens.LISTA.size():
			var d: Dictionary = Personagens.LISTA[i]
			var x := 640.0 + (i - 2.5) * 120.0
			var ex: String = ["neutro", "feliz", "grito", "piscar"][int(t * 1.5 + i * 1.7) % 4]
			Desenho.cabeca(self, d, Vector2(x, 612 + sin(t * 3.0 + i) * 4.0), 43.0, {"expr": ex, "cabeca_giro": sin(t * 2.0 + i) * 0.08})
		if Toque.disponivel():
			Desenho.texto(self, Vector2(640, 360), "TOQUE PARA ESCOLHER", 22, Color("7ec8ff"), Desenho.PRETO, 5)
		Desenho.texto(self, Vector2(640, 706), "Paródia e humor. Sem apoio a partido ou candidato.", 22, Color(1, 1, 1, 0.8), Desenho.PRETO, 5)


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
		Desenho.texto(self, Vector2(640, 96), "COMO JOGAR", 64, Color("ffd23f"), Desenho.PRETO, 10)
		var tabela := [
			["", "JOGADOR 1", "JOGADOR 2"],
			["Andar", "A  D", "setas"],
			["Pular", "W", "seta p/ cima"],
			["Agachar", "S", "seta p/ baixo"],
			["Soco", "F", "1 (numérico) ou ,"],
			["Chute", "G", "2 (numérico) ou ."],
			["Especial", "H", "3 (numérico) ou ;"],
		]
		for i in tabela.size():
			var linha: Array = tabela[i]
			var y := 140.0 + i * 34.0
			var cor := Color("ffd23f") if i == 0 else Color.WHITE
			Desenho.texto_esq(self, Vector2(150, y), linha[0], 26, Color("7ec8ff"), 0)
			Desenho.texto_esq(self, Vector2(470, y), linha[1], 26, cor, 0)
			Desenho.texto_esq(self, Vector2(760, y), linha[2], 26, cor, 0)
		Desenho.texto(self, Vector2(640, 396), "Controle: direcional + X soco, A chute, B especial", 26, Color(1, 1, 1, 0.75), Desenho.PRETO, 0)
		Desenho.texto(self, Vector2(640, 452), "ESPECIAIS (todos os lutadores)", 26, Color("ffd23f"), Desenho.PRETO, 0)
		var golpes := [
			["Projétil", "Especial / baixo, diag, frente + Soco"],
			["Investida", "frente+Especial / baixo, diag, trás + Chute"],
			["Gancho", "cima+Especial / frente, baixo, diag + Soco"],
			["SUPER", "barra cheia: baixo + Especial"],
		]
		for i in golpes.size():
			var y := 492.0 + i * 32.0
			Desenho.texto_esq(self, Vector2(110, y), golpes[i][0], 26, Color("ff8a5c"), 0)
			Desenho.texto_esq(self, Vector2(330, y), golpes[i][1], 26, Color.WHITE, 0)
		Desenho.texto(self, Vector2(640, 644), "Defesa: segure para trás. Agachado defende rasteira,", 26, Color("7ec8ff"), Desenho.PRETO, 0)
		Desenho.texto(self, Vector2(640, 676), "em pé defende voadora. Soco ou Esc para voltar.", 26, Color("7ec8ff"), Desenho.PRETO, 0)
		Desenho.texto(self, Vector2(640, 710), "No celular: direcional à esquerda, botões à direita. Toque para voltar.", 22, Color("ffd23f"), Desenho.PRETO, 0)


class Selecao extends Node2D:
	signal pronto(a: int, b: int)
	signal voltar
	var modo := 1
	var cursor := [0, 1]
	var confirmado := [false, false]
	var t := 0.0
	var meme := {}  # meme tocando: lado, txt, dados, t
	var espera := 0.0
	var _som: AudioStreamPlayer
	const COLS := 5
	const CARTAO := Vector2(196, 150)
	const ORIGEM := Vector2(130, 132)

	func _ready() -> void:
		_som = AudioStreamPlayer.new()
		add_child(_som)

	func _process(delta: float) -> void:
		t += delta
		if not meme.is_empty():
			meme["t"] += 1
			if meme["t"] >= meme["dur"]:
				meme = {}
		if Telas.apertou("ui_cancel"):
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
		else:
			for i in 2:
				if not confirmado[i]:
					_mover(i, i + 1)
					if Telas.confirmou(i + 1):
						_confirmar(i)
				elif Telas.apertou("p%d_especial" % (i + 1)):
					confirmado[i] = false
		queue_redraw()

	const BT_VOLTAR := Rect2(20, 652, 170, 52)
	const BT_ALEATORIO := Rect2(1070, 652, 190, 52)

	func _unhandled_input(ev: InputEvent) -> void:
		var p = Telas.toque(self, ev)
		if p == null or (confirmado[0] and confirmado[1]):
			return
		if BT_VOLTAR.has_point(p):
			voltar.emit()
			return
		var i := 0 if not confirmado[0] else 1
		if BT_ALEATORIO.has_point(p) and modo == 1 and confirmado[0]:
			cursor[1] = randi() % Personagens.LISTA.size()
			_confirmar(1)
			return
		for k in Personagens.LISTA.size():
			if _cartao(k).has_point(p):
				cursor[i] = k
				_confirmar(i)
				return

	func _confirmar(i: int) -> void:
		confirmado[i] = true
		espera = 0.4
		var d: Dictionary = Personagens.LISTA[cursor[i]]
		var memes: Array = d.get("memes", [])
		if memes.is_empty():
			return
		var n := randi() % memes.size()
		meme = {"lado": i, "txt": memes[n], "dados": d, "t": 0, "dur": 80}
		var som := Personagens.audio(d["id"], n)
		if som != null:
			_som.stream = som
			_som.play()

	func _mover(i: int, jogador: int) -> void:
		var pre := "p%d_" % jogador
		var n := Personagens.LISTA.size()
		if Telas.apertou(pre + "dir"):
			cursor[i] = (cursor[i] + 1) % n
		if Telas.apertou(pre + "esq"):
			cursor[i] = (cursor[i] - 1 + n) % n
		if Telas.apertou(pre + "baixo") or Telas.apertou(pre + "cima"):
			var alvo: int = cursor[i] + COLS if cursor[i] + COLS < n else cursor[i] % COLS
			cursor[i] = mini(alvo, n - 1)

	func _cartao(i: int) -> Rect2:
		return Rect2(ORIGEM + Vector2((i % COLS) * (CARTAO.x + 8), (i / COLS) * (CARTAO.y + 10)), CARTAO)

	func _draw() -> void:
		draw_rect(Rect2(0, 0, 1280, 720), Color("1b1238"))
		for i in 26:
			var x := i * 60.0 - fmod(t * 30.0, 60.0)
			draw_line(Vector2(x, 0), Vector2(x - 200, 720), Color(1, 1, 1, 0.04), 18.0)
		Desenho.texto(self, Vector2(640, 74), "ESCOLHA SEU LUTADOR", 64, Color("ffd23f"), Desenho.PRETO, 10)
		var dica := "Escolha o seu e depois o rival (Especial = aleatório)" if modo == 1 else "Cada jogador escolhe com seus comandos"
		Desenho.texto(self, Vector2(640, 110), dica, 26, Color(1, 1, 1, 0.8), Desenho.PRETO, 5)
		var n := Personagens.LISTA.size()
		for i in n + Personagens.EM_BREVE.size():
			var r := _cartao(i)
			draw_rect(r.grow(4), Desenho.PRETO)
			if i < n:
				var d: Dictionary = Personagens.LISTA[i]
				draw_rect(r, Color("2c2450"))
				draw_rect(Rect2(r.position, Vector2(r.size.x, r.size.y * 0.55)), Color("3a3068"))
				var sel: bool = cursor[0] == i or cursor[1] == i
				var ex := "feliz" if sel else ("piscar" if int(t * 10 + i * 7) % 40 == 0 else "neutro")
				Desenho.cabeca(self, d, r.get_center() + Vector2(0, -26), 43.0, {"expr": ex})
				Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 8), d["nome"], 26, Color.WHITE, Desenho.PRETO, 5)
			else:
				draw_rect(r, Color("201a38"))
				Desenho.texto(self, r.get_center() + Vector2(0, 8), "?", 96, Color(1, 1, 1, 0.18), Desenho.PRETO, 0)
				Desenho.texto(self, Vector2(r.get_center().x, r.end.y - 8), Personagens.EM_BREVE[i - n], 26, Color(1, 1, 1, 0.35), Desenho.PRETO, 0)
		for k in 2:
			var r := _cartao(cursor[k]).grow(6 + k * 8)
			var cor := Color("2a9df4") if k == 0 else Color("e63946")
			if not confirmado[k] or int(t * 6) % 2 == 0:
				draw_rect(r, cor, false, 6.0)
			var rotulo := "1P" if k == 0 else ("CPU" if modo == 1 else "2P")
			Desenho.texto(self, Vector2(r.position.x + 30 if k == 0 else r.end.x - 34, r.position.y + 6), rotulo, 26, cor, Desenho.PRETO, 5)
		for k in 2:
			var d: Dictionary = Personagens.LISTA[cursor[k]]
			var x := 130.0 if k == 0 else 1150.0
			var tq := int(t * 60.0)
			var pose := Desenho.pose_vitoria(d, tq) if confirmado[k] else Desenho.pose_idle(d, tq + k * 50)
			var alt: float = d.get("corpo", {}).get("alt", 1.0)
			Desenho.lutador_em(self, d, pose, Vector2(x, 640), Vector2(0.95 * (1 if k == 0 else -1), 0.95) * alt)
			var tx := 390.0 if k == 0 else 890.0
			Desenho.texto(self, Vector2(tx, 560), d["nome"], 40, Color("ffd23f"), Desenho.PRETO, 8)
			Desenho.texto(self, Vector2(tx, 590), d["titulo"], 22, Color.WHITE, Desenho.PRETO, 5)
			var esp: Dictionary = d["especiais"]
			for j in 3:
				var nome_g: String = esp[["projetil", "investida", "gancho"][j]]["nome"]
				Desenho.texto(self, Vector2(tx, 622 + j * 26), nome_g, 22, Color("ff8a5c"), Desenho.PRETO, 4)
		Desenho.texto(self, Vector2(640, 610), "VS", 64, Color("ff5a4e"), Desenho.PRETO, 12)
		Desenho.texto(self, Vector2(640, 706), "toque no lutador para escolher", 22, Color(1, 1, 1, 0.6), Desenho.PRETO, 4)
		Telas.botao(self, BT_VOLTAR, "< VOLTAR", Color.WHITE)
		if modo == 1 and confirmado[0] and not confirmado[1]:
			Telas.botao(self, BT_ALEATORIO, "ALEATÓRIO")
		if not meme.is_empty():
			Luta.desenhar_meme(self, meme["dados"], meme["txt"], int(meme["lado"]), int(meme["t"]), int(meme["dur"]))


class Resultado extends Node2D:
	signal revanche
	signal trocar
	const BT_REVANCHE := Rect2(290, 636, 320, 58)
	const BT_TROCAR := Rect2(670, 636, 320, 58)

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
	var dados: Dictionary = {}
	var perdedor: Dictionary = {}
	var quem := "P1"
	var t := 0.0

	func _process(delta: float) -> void:
		t += delta
		if t > 0.8:
			if Telas.confirmou(1) or Telas.confirmou(2):
				revanche.emit()
				set_process(false)
			elif Telas.voltou():
				trocar.emit()
				set_process(false)
		queue_redraw()

	func _draw() -> void:
		Desenho.cenario(self, t)
		draw_rect(Rect2(0, 0, 1280, 720), Color(0.04, 0.02, 0.1, 0.55))
		Desenho.texto(self, Vector2(640, 92), "%s VENCEU!" % dados["nome"], 64, Color("ffd23f"), Desenho.PRETO, 12)
		Desenho.texto(self, Vector2(640, 132), quem, 26, Color.WHITE, Desenho.PRETO, 5)
		var tq := int(t * 60.0)
		var alt_v: float = dados.get("corpo", {}).get("alt", 1.0)
		var alt_d: float = perdedor.get("corpo", {}).get("alt", 1.0)
		Desenho.lutador_em(self, dados, Desenho.pose_vitoria(dados, tq), Vector2(330, 650), Vector2(1.8, 1.8) * alt_v)
		Desenho.lutador_em(self, perdedor, Desenho.pose_derrota(perdedor, tq), Vector2(980, 650), Vector2(-1.5, 1.5) * alt_d)
		var linhas := Telas.quebrar("\"%s\"" % dados["vitoria"], 26)
		var balao := Rect2(510, 190, 600, 40 + linhas.size() * 30)
		draw_rect(balao.grow(5), Desenho.PRETO)
		draw_rect(balao, Desenho.BRANCO)
		draw_colored_polygon(PackedVector2Array([Vector2(530, balao.end.y - 2), Vector2(600, balao.end.y - 2), Vector2(470, balao.end.y + 70)]), Desenho.PRETO)
		draw_colored_polygon(PackedVector2Array([Vector2(536, balao.end.y - 4), Vector2(592, balao.end.y - 4), Vector2(480, balao.end.y + 58)]), Desenho.BRANCO)
		for i in linhas.size():
			Desenho.texto(self, Vector2(balao.get_center().x, balao.position.y + 46 + i * 30), linhas[i], 26, Desenho.PRETO, Desenho.BRANCO, 0)
		Telas.botao(self, BT_REVANCHE, "REVANCHE (Soco)")
		Telas.botao(self, BT_TROCAR, "TROCAR (Especial)", Color.WHITE)
