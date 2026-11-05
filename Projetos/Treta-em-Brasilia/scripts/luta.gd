class_name Luta
extends Node2D
## A luta: dois lutadores, rounds (melhor de 3), tempo de 99 s, colisões, combos,
## pausa de impacto, super com tela congelada e os textos de meme na tela.

signal terminou(vencedor: int)  # 0 = jogador 1, 1 = jogador 2

const DURACAO := 99.0

var dados_p: Array = []
var humano := [true, false]
var nivel_cpu := 0.55

var p: Array[Lutador] = []
var ias: Array = [null, null]
var projeteis: Array[Projetil] = []
var efeitos: Array[Dictionary] = []
var vitorias := [0, 0]
var round_n := 1
var tempo := DURACAO
var fase := "intro"
var fase_t := 0
var hitstop := 0
var congelado := 0
var tremor := 0.0
var combo := [0, 0]
var combo_t := [0, 0]
var vida_vis := [1000.0, 1000.0]
var msg := ""
var msg_t := 0
var vencedor := -1
var tempo_total := 0.0

var _cenario: Camada
var _sombras: Camada
var _efeitos: Camada
var _hud: Camada
var _palco: Node2D
var _som: AudioStreamPlayer
var _meme_cd := 0


func configurar(a: Dictionary, b: Dictionary, dois_jogadores: bool, cpu_contra_cpu := false) -> void:
	dados_p = [a, b]
	humano = [not cpu_contra_cpu, dois_jogadores and not cpu_contra_cpu]


func _ready() -> void:
	_cenario = _camada(func(c): Desenho.cenario(c, tempo_total), 0)
	_palco = Node2D.new()
	add_child(_palco)
	_sombras = _camada(_desenhar_sombras, 1, _palco)
	for i in 2:
		var l := Lutador.new()
		l.z_index = 2
		_palco.add_child(l)
		p.append(l)
		l.soltou_projetil.connect(_soltar_projetil)
		l.falou.connect(_fala)
		l.super_ativado.connect(_super)
		l.provocou.connect(_provocou)
		if humano[i]:
			l.entrada = EntradaHumana.new(i + 1)
		else:
			var ia := IA.new(nivel_cpu)
			ias[i] = ia
			l.entrada = ia
	p[0].oponente = p[1]
	p[1].oponente = p[0]
	for i in 2:
		if ias[i] != null:
			ias[i].eu = p[i]
			ias[i].op = p[1 - i]
	_efeitos = _camada(_desenhar_efeitos, 5, _palco)
	_hud = _camada(_desenhar_hud, 10)
	_som = AudioStreamPlayer.new()
	add_child(_som)
	_novo_round()


func _camada(f: Callable, z: int, pai: Node = null) -> Camada:
	var c := Camada.new()
	c.desenhar = f
	c.z_index = z
	(pai if pai != null else self).add_child(c)
	return c


func _novo_round() -> void:
	p[0].configurar(dados_p[0], 380.0, 1)
	p[1].configurar(dados_p[1], 900.0, -1)
	for l in p:
		l.travado = true
		l.barra = l.barra if round_n > 1 else 0.0
	for pr in projeteis:
		pr.queue_free()
	projeteis.clear()
	vida_vis = [p[0].vida, p[1].vida]
	tempo = DURACAO
	combo = [0, 0]
	fase = "intro"
	fase_t = 0
	_mensagem("ROUND %d" % round_n, 70)


func _mensagem(t: String, dur: int) -> void:
	msg = t
	msg_t = dur


# ---------------------------------------------------------------- laço principal

func _physics_process(_delta: float) -> void:
	tempo_total += 1.0 / 60.0
	fase_t += 1
	if msg_t > 0:
		msg_t -= 1
	tremor = maxf(tremor - 0.6, 0.0)
	if _meme_cd > 0:
		_meme_cd -= 1
	_palco.position = Vector2(randf_range(-tremor, tremor), randf_range(-tremor, tremor))
	_atualizar_efeitos()
	for i in 2:
		vida_vis[i] = move_toward(vida_vis[i], p[i].vida, 6.0) if vida_vis[i] > p[i].vida else p[i].vida
		if combo_t[i] > 0:
			combo_t[i] -= 1
		elif p[1 - i].estado != Lutador.E.ATINGIDO:
			combo[i] = 0

	match fase:
		"intro":
			if fase_t == 72:
				_mensagem("LUTE!", 45)
			if fase_t >= 80:
				for l in p:
					l.travado = false
				fase = "luta"
				fase_t = 0
			_passo_lutadores()
		"luta":
			if congelado > 0:
				congelado -= 1
			elif hitstop > 0:
				hitstop -= 1
			else:
				_passo_lutadores()
				_passo_projeteis()
				_colisoes()
				_separar()
				tempo = maxf(tempo - 1.0 / 60.0, 0.0)
				_checar_fim()
		"fim_round":
			_passo_lutadores()
			if fase_t == 110:
				var v := vencedor
				if v >= 0:
					p[v].comemorar()
					p[1 - v].lamentar()
					_fala_texto(p[v], p[v].dados["vitoria"], Color("ffd23f"))
					_meme(v, true)
			if fase_t >= 230:
				if vitorias[0] >= 2 or vitorias[1] >= 2:
					fase = "fim"
					terminou.emit(0 if vitorias[0] >= 2 else 1)
				else:
					round_n += 1
					_novo_round()
	_cenario.queue_redraw()
	_sombras.queue_redraw()
	_efeitos.queue_redraw()
	_hud.queue_redraw()


func _passo_lutadores() -> void:
	for i in 2:
		if ias[i] != null:
			ias[i].perigo = _projetil_vindo(i)
		p[i].passo()


func _projetil_vindo(i: int) -> bool:
	for pr in projeteis:
		if pr.dono != p[i] and absf(pr.position.x - p[i].position.x) < 330.0 and signf(p[i].position.x - pr.position.x) == pr.dir:
			return true
	return false


func _passo_projeteis() -> void:
	for pr in projeteis:
		pr.passo()
	# projétil contra projétil: se anulam (o super passa por cima)
	for a in projeteis:
		for b in projeteis:
			if a != b and a.ativo and b.ativo and a.dono != b.dono and a.caixa().intersects(b.caixa()):
				if not a.eh_super:
					a.ativo = false
				if not b.eh_super:
					b.ativo = false
				_faisca((a.position + b.position) / 2.0, Color("ffd23f"))
	for pr in projeteis.duplicate():
		if not pr.ativo:
			projeteis.erase(pr)
			pr.dono.tem_projetil = false
			pr.queue_free()


func _colisoes() -> void:
	var golpes := []
	for i in 2:
		var c = p[i].caixa_ataque()
		if c != null and (c as Rect2).intersects(p[1 - i].hurtbox()):
			golpes.append(i)
	for i in golpes:
		var atk := p[i]
		var def := p[1 - i]
		atk.ja_acertou = true
		var g: Dictionary = atk.golpe.duplicate()
		var estava_tonto := def.estado in [Lutador.E.ATINGIDO]
		g["dano"] = float(g["dano"]) * float(atk.dados.get("forca", 1.0)) * _escala_combo(i, estava_tonto)
		var r := def.receber(g, atk.position.x)
		_resultado(i, r, def.hurtbox().get_center().lerp(atk.position + Vector2(atk.lado * 60, -120), 0.5), g, estava_tonto)
	for pr in projeteis:
		if not pr.ativo:
			continue
		var alvo_i := 1 if pr.dono == p[0] else 0
		var alvo := p[alvo_i]
		if pr.caixa().intersects(alvo.hurtbox()):
			var estava_tonto := alvo.estado == Lutador.E.ATINGIDO
			var g := pr.golpe.duplicate()
			g["dano"] = float(g["dano"]) * _escala_combo(1 - alvo_i, estava_tonto)
			var r := alvo.receber(g, pr.position.x - pr.dir * 10.0)
			if r != "":
				pr.ativo = false
				_resultado(1 - alvo_i, r, pr.position, g, estava_tonto)


func _escala_combo(i: int, estava_tonto: bool) -> float:
	var n: int = combo[i] if estava_tonto else 0
	return maxf(0.45, 1.0 - 0.12 * n)


func _resultado(i: int, r: String, ponto: Vector2, g: Dictionary, estava_tonto: bool) -> void:
	if r == "":
		return
	var atk := p[i]
	if r == "bloqueio":
		hitstop = 5
		atk.barra = minf(atk.barra + 3.0, 100.0)
		_faisca(ponto, Color("7ec8ff"))
		return
	hitstop = 9 if g.get("especial", false) else 7
	tremor = 7.0 if g.get("especial", false) else 4.0
	atk.barra = minf(atk.barra + 8.0, 100.0)
	_faisca(ponto, Color("fff3b0"))
	if g.get("final", false) or g.get("super", false) or (g.get("especial", false) and randf() < 0.25):
		_meme(i)
	combo[i] = combo[i] + 1 if estava_tonto else 1
	combo_t[i] = 40
	if combo[i] >= 2:
		_texto(Vector2(200 if i == 0 else 1080, 250), "%d GOLPES!" % combo[i], Color("ffd23f"), 34)
	# empurrão no canto: quem bate é que recua
	var def := p[1 - i]
	if def.position.x <= Lutador.LIMITE_ESQ + 1.0 or def.position.x >= Lutador.LIMITE_DIR - 1.0:
		atk.position.x -= atk.lado * float(g.get("empurra", 6.0)) * 1.5


func _separar() -> void:
	var a := p[0]
	var b := p[1]
	if absf(a.position.y - b.position.y) > 130.0:
		return
	var dx := b.position.x - a.position.x
	var minimo := 64.0 * Lutador.TAM
	if absf(dx) < minimo:
		var falta := (minimo - absf(dx)) / 2.0
		var s := signf(dx) if dx != 0.0 else float(a.lado)
		a.position.x -= s * falta
		b.position.x += s * falta
		for l in p:
			l.position.x = clampf(l.position.x, Lutador.LIMITE_ESQ, Lutador.LIMITE_DIR)
		# se um está na parede, o outro é que sai
		if absf(b.position.x - a.position.x) < minimo - 1.0:
			if a.position.x <= Lutador.LIMITE_ESQ + 1.0 or a.position.x >= Lutador.LIMITE_DIR - 1.0:
				b.position.x = a.position.x + s * minimo
			else:
				a.position.x = b.position.x - s * minimo


func _checar_fim() -> void:
	var ko := [p[0].vida <= 0.0, p[1].vida <= 0.0]
	if ko[0] or ko[1] or tempo <= 0.0:
		if ko[0] and ko[1]:
			vencedor = -1
		elif ko[0]:
			vencedor = 1
		elif ko[1]:
			vencedor = 0
		elif p[0].vida == p[1].vida:
			vencedor = -1
		else:
			vencedor = 0 if p[0].vida > p[1].vida else 1
		if vencedor >= 0:
			vitorias[vencedor] += 1
		else:
			vitorias[0] += 1
			vitorias[1] += 1
		_mensagem("K.O.!" if (ko[0] or ko[1]) else "TEMPO!", 100)
		if ko[0] or ko[1]:
			hitstop = 0
			tremor = 12.0
		for l in p:
			l.travado = true
		fase = "fim_round"
		fase_t = 0


# ---------------------------------------------------------------- eventos dos lutadores

func _soltar_projetil(l: Lutador, eh_super: bool) -> void:
	var pr := Projetil.new()
	pr.z_index = 3
	pr.iniciar(l, eh_super)
	_palco.add_child(pr)
	projeteis.append(pr)
	l.tem_projetil = true


func _fala(l: Lutador, texto: String) -> void:
	_fala_texto(l, texto, Color.WHITE)


func _fala_texto(l: Lutador, texto: String, cor: Color) -> void:
	_texto(l.position + Vector2(0, -330), texto, cor, 28)


func _provocou(l: Lutador) -> void:
	l.barra = minf(l.barra + 10.0, 100.0)
	_meme(p.find(l), true)


func _super(l: Lutador) -> void:
	congelado = 34
	efeitos.append({"tipo": "super", "t": 0, "dur": 34, "dono": l})
	_texto(Vector2(640, 330), l.dados["especiais"]["super"]["nome"], Color("ffd23f"), 64, 70)


# ---------------------------------------------------------------- memes

## Solta um meme do lutador i: o retrato entra na tela com a frase (e o áudio, se houver).
func _meme(i: int, forcar := false) -> void:
	if _meme_cd > 0 and not forcar:
		return
	var d: Dictionary = p[i].dados
	var memes: Array = d.get("memes", [])
	if memes.is_empty():
		return
	var n := randi() % memes.size()
	efeitos = efeitos.filter(func(ef): return ef["tipo"] != "meme")
	efeitos.append({"tipo": "meme", "t": 0, "dur": 110, "lado": i, "txt": memes[n], "dados": d})
	var som := Personagens.audio(d["id"], n)
	if som != null:
		_som.stream = som
		_som.play()
	_meme_cd = 300


# ---------------------------------------------------------------- efeitos

func _faisca(pos: Vector2, cor: Color) -> void:
	efeitos.append({"tipo": "faisca", "pos": pos, "t": 0, "dur": 12, "cor": cor})


func _texto(pos: Vector2, txt: String, cor: Color, tam: int, dur: int = 60) -> void:
	efeitos.append({"tipo": "texto", "pos": pos, "t": 0, "dur": dur, "cor": cor, "txt": txt, "tam": tam})


func _atualizar_efeitos() -> void:
	for ef in efeitos:
		ef["t"] += 1
	efeitos = efeitos.filter(func(ef): return ef["t"] < ef["dur"])


func _desenhar_sombras(c: CanvasItem) -> void:
	for l in p:
		var altura := Lutador.CHAO - l.position.y
		c.draw_set_transform(Vector2(l.position.x, Lutador.CHAO), 0.0, Vector2(1.0, 0.22))
		c.draw_circle(Vector2.ZERO, 62.0 - clampf(altura * 0.1, 0.0, 26.0), Desenho.SOMBRA)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _desenhar_efeitos(c: CanvasItem) -> void:
	for ef in efeitos:
		var k: float = float(ef["t"]) / float(ef["dur"])
		match ef["tipo"]:
			"faisca":
				var pos: Vector2 = ef["pos"]
				var cor: Color = ef["cor"]
				cor.a = 1.0 - k
				for j in 8:
					var a := j * TAU / 8.0 + 0.3
					c.draw_line(pos + Vector2(cos(a), sin(a)) * (10 + k * 30), pos + Vector2(cos(a), sin(a)) * (24 + k * 52), cor, 5.0 * (1.0 - k) + 1.0)
				c.draw_circle(pos, 16.0 * (1.0 - k), cor)
			"texto":
				var pos: Vector2 = ef["pos"] + Vector2(0, -k * 40.0)
				var cor: Color = ef["cor"]
				cor.a = 1.0 if k < 0.7 else (1.0 - k) / 0.3
				var tam := int(ef["tam"] * (1.0 + maxf(0.0, 0.25 - k) * 1.2))
				var borda := Desenho.PRETO
				borda.a = cor.a
				Desenho.texto(c, pos, ef["txt"], tam, cor, borda, 8)
			"meme":
				Luta.desenhar_meme(c, ef["dados"], ef["txt"], int(ef["lado"]), int(ef["t"]), int(ef["dur"]))
			"super":
				var l: Lutador = ef["dono"]
				c.draw_rect(Rect2(-20, -20, 1320, 760), Color(0, 0, 0, 0.45 * (1.0 - k)))
				for j in 12:
					var a: float = j * TAU / 12.0 + float(ef["t"]) * 0.05
					var centro := l.position + Vector2(0, -150)
					c.draw_line(centro + Vector2(cos(a), sin(a)) * 60.0, centro + Vector2(cos(a), sin(a)) * 600.0, Color(1, 0.85, 0.3, 0.35 * (1.0 - k)), 10.0)


## Faixa de meme com o retrato entrando pelo lado do jogador (usada na luta e na seleção).
static func desenhar_meme(c: CanvasItem, d: Dictionary, txt: String, lado: int, t: int, dur: int) -> void:
	var entra := clampf(t / 10.0, 0.0, 1.0)
	var sai := clampf((dur - t) / 10.0, 0.0, 1.0)
	var k := minf(entra, sai)
	var y0 := 250.0
	var faixa := Rect2(0, y0, 1280, 170)
	c.draw_rect(Rect2(0, y0 - 6, 1280 * k, 182), Desenho.PRETO)
	c.draw_rect(Rect2(0, y0, 1280 * k, 170), Color("2a1446"))
	for j in 14:
		var x := fposmod(j * 110.0 + t * 14.0 * (1 if lado == 0 else -1), 1540.0) - 130.0
		c.draw_line(Vector2(x, y0 + 170), Vector2(x + 90, y0), Color(1, 0.82, 0.25, 0.18 * k), 22.0)
	var esq := lado == 0
	var desliza := (1.0 - k) * 500.0
	var px := (170.0 - desliza) if esq else (1110.0 + desliza)
	# o retrato "fala": alterna boca aberta e sorriso enquanto o meme está na tela
	var ex := "grito" if (t / 6) % 2 == 0 else "feliz"
	Desenho._mat_tronco = Transform2D(0.0, Vector2(1 if esq else -1, 1), 0.0, Vector2(px, y0 + 168))
	Desenho.cabeca(c, d, Vector2(0, -88), 88.0, {"expr": ex, "retrato": true, "cabeca_giro": sin(t * 0.3) * 0.06})
	Desenho._mat_tronco = Transform2D.IDENTITY
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var linhas := Telas.quebrar(txt.to_upper(), 22)
	var cx := 760.0 if esq else 520.0
	for j in linhas.size():
		var yy := y0 + 85.0 - (linhas.size() - 1) * 24.0 + j * 48.0 + 16.0
		Desenho.texto(c, Vector2(cx + (1.0 - k) * (300.0 if esq else -300.0), yy), linhas[j], 40, Color("ffd23f"), Desenho.PRETO, 10)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


# ---------------------------------------------------------------- HUD

func _desenhar_hud(c: CanvasItem) -> void:
	# barras de energia no alto, com o selo "KO" no meio, como nos fliperamas
	var y := 34.0
	var h := 30.0
	for i in 2:
		var l := p[i]
		var esq := i == 0
		var x0 := 64.0 if esq else 704.0
		var w := 512.0
		var fracao := l.vida / l.vida_max
		var vis: float = vida_vis[i] / l.vida_max
		c.draw_rect(Rect2(x0 - 6, y - 6, w + 12, h + 12), Desenho.PRETO)
		c.draw_rect(Rect2(x0 - 3, y - 3, w + 6, h + 6), Color("fbfbf7"))
		c.draw_rect(Rect2(x0, y, w, h), Color("c81e2a"))
		var amarelo := Color("ffd23f")
		if fracao < 0.25 and int(tempo_total * 6) % 2 == 0:
			amarelo = Color("fff3b0")
		if esq:
			c.draw_rect(Rect2(x0 + w * (1.0 - vis), y, w * vis, h), Color("ff9a3c"))
			c.draw_rect(Rect2(x0 + w * (1.0 - fracao), y, w * fracao, h), amarelo)
		else:
			c.draw_rect(Rect2(x0, y, w * vis, h), Color("ff9a3c"))
			c.draw_rect(Rect2(x0, y, w * fracao, h), amarelo)
		c.draw_rect(Rect2(x0, y, w, 6), Color(1, 1, 1, 0.35))
		c.draw_rect(Rect2(x0, y + h - 6, w, 6), Color(0, 0, 0, 0.2))
		var nome: String = l.dados.get("nome", "")
		var quem := ("P%d" % (i + 1)) if humano[i] else "CPU"
		if esq:
			Desenho.texto_esq(c, Vector2(x0, y + h + 42), nome, 24, Color("ffd23f"), 6)
			Desenho.texto_esq(c, Vector2(x0, y + h + 74), quem, 22, Color("7ec8ff"), 6)
		else:
			Desenho.texto_dir(c, Vector2(x0 + w, y + h + 42), nome, 24, Color("ffd23f"), 6)
			Desenho.texto_dir(c, Vector2(x0 + w, y + h + 74), quem, 22, Color("ff8a8a"), 6)
		# vitórias: um "V" por round ganho
		for v in vitorias[i]:
			var vx: float = (x0 + w - 24 - v * 34) if esq else (x0 + 24 + v * 34)
			Desenho.texto(c, Vector2(vx, y + h + 42), "V", 24, Color("fff3b0"), Desenho.PRETO, 6)
		# barra de super embaixo
		var bx := 40.0 if esq else 960.0
		var by := 690.0
		c.draw_rect(Rect2(bx - 5, by - 5, 290, 26), Desenho.PRETO)
		c.draw_rect(Rect2(bx, by, 280, 16), Color("2a2050"))
		var cheia: bool = l.barra >= 100.0
		var cor_super := Color("4aa8ff") if not cheia else (Color("ffd23f") if int(tempo_total * 8) % 2 == 0 else Color("fff3b0"))
		var bw := 280.0 * l.barra / 100.0
		c.draw_rect(Rect2(bx if esq else bx + 280 - bw, by, bw, 16), cor_super)
		var rotulo := "SUPER!" if cheia else "SUPER"
		if esq:
			Desenho.texto_esq(c, Vector2(bx + 296, by + 18), rotulo, 22, cor_super if cheia else Color.WHITE, 6)
		else:
			Desenho.texto_dir(c, Vector2(bx - 16, by + 18), rotulo, 22, cor_super if cheia else Color.WHITE, 6)
	# selo KO
	c.draw_rect(Rect2(586, y - 10, 108, h + 20), Desenho.PRETO)
	c.draw_rect(Rect2(592, y - 4, 96, h + 8), Color("fbfbf7"))
	Desenho.texto(c, Vector2(640, y + h + 2), "KO", 34, Color("c81e2a"), Desenho.PRETO, 0)
	# relógio grande
	var cor_t := Color("ffd23f") if tempo > 10 else Color("ff5a4e")
	Desenho.texto(c, Vector2(640, 142), "%02d" % int(ceil(tempo)), 64, cor_t, Desenho.PRETO, 10)
	# mensagem central
	if msg_t > 0:
		var k := clampf(msg_t / 20.0, 0.0, 1.0)
		var cor := Color(1, 0.85, 0.25, k)
		var borda := Desenho.PRETO
		borda.a = k
		Desenho.texto(c, Vector2(640, 380), msg, 96, cor, borda, 14)
