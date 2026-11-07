class_name Cinematica
## Cinemáticas dos ultimates (230 quadros): a tela escurece, entram as faixas pretas de cinema,
## o nome do golpe cruza a tela e cada lutador faz o seu show. A luta aplica os acertos (luta.gd);
## aqui ficam só as imagens e as partículas. Tudo cartunesco: nada de violência realista.

const PRETO := Color("140c1c")


static func passo(cin: Dictionary, atk: Lutador, def: Lutador, part: Particulas) -> void:
	var t: int = cin["t"]
	var alvo := def.position + Vector2(0, -130)
	match cin["id"]:
		"lula":
			if t > 40 and t % 6 == 0:
				part.fumaca(atk.position + Vector2(atk.lado * 150, -120), 1)
			if t == 196:
				part.explosao(alvo, 1.4)
		"bolsonaro":
			if t in [90, 120, 150, 175]:
				part.explosao(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 1.0)
		"trump":
			if t > 40 and t % 10 == 0:
				part.confete(Vector2(640, 0), 6)
		"xandao":
			if t == 192:
				part.explosao(alvo, 1.2)
		"pavanato":
			if t > 50 and t < 175 and t % 7 == 0:
				part.estrelas(alvo + Vector2(randf_range(-70, 70), randf_range(-50, 50)), 2)
			if t == 180:
				part.explosao(alvo, 1.1)
			if t > 180 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"erika":
			if t > 60 and t < 170 and t % 9 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.0)
			if t > 176 and t % 5 == 0:
				part.confete(Vector2(640, 0), 8)
		"eduarda":
			if t > 40 and t % 4 == 0:
				part.estrelas(alvo + Vector2(randf_range(-80, 80), randf_range(-60, 60)), 1)


## Imagens no mundo. fundo = true: atrás dos lutadores (escurece o cenário, objetos grandes);
## fundo = false: na frente (o que voa e cai em cima do rival).
static func desenhar(c: CanvasItem, cin: Dictionary, atk: Lutador, def: Lutador, fundo := false) -> void:
	var t: int = cin["t"]
	var dur: int = cin["dur"]
	var entra := clampf(t / 20.0, 0.0, 1.0)
	var sai := clampf((dur - t) / 20.0, 0.0, 1.0)
	var k := minf(entra, sai)
	# escurece o cenário (fica só a ação)
	if fundo:
		c.draw_rect(Rect2(-300, -300, 1880, 1320), Color(0.03, 0.0, 0.08, 0.72 * k))
	var dir := float(atk.lado)
	var ax := atk.position.x
	var dx := def.position.x
	var chao := Lutador.CHAO
	match cin["id"]:
		"lula":
			# churrasqueira gigante atrás do Lula e picanhas voando
			if fundo:
				var s := clampf((t - 20) / 30.0, 0.0, 1.0)
				c.draw_set_transform(Vector2(ax - dir * 210, chao), 0.0, Vector2(dir, 1) * (1.0 + 1.3 * s))
				Arte.churrasqueira(c, Vector2.ZERO, t)
				c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				return
			for i in 4:
				var fase := fposmod((t - 50) / 40.0 + i * 0.25, 1.0)
				if t > 50 and t < 170:
					var pos := Vector2(lerpf(ax, dx, fase), chao - 200 - sin(fase * PI) * 220.0)
					c.draw_set_transform(pos, fase * 6.0, Vector2(dir, 1) * 1.6)
					Arte.projetil(c, "comida", t + i * 20, false)
					c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			if t > 140:
				# a picanha suprema desce do céu
				var q := clampf((t - 140) / 56.0, 0.0, 1.0)
				var y := lerpf(-400.0, chao - 160.0, q * q)
				c.draw_set_transform(Vector2(dx, y), 0.15, Vector2(4.5, 4.5))
				for passada in 2:
					Desenho._cont = passada == 0
					Desenho._projetil_forma(c, "picanha", t, 0.0, 4.5)
				Desenho._cont = false
				c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		"bolsonaro":
			# tanque de brinquedo entra rolando e solta "BUM"s de confete
			if fundo:
				var q := clampf((t - 25) / 40.0, 0.0, 1.0)
				var tx := lerpf(ax - dir * 700.0, ax - dir * 260.0, q)
				_tanque(c, Vector2(tx, chao - 40), dir, t)
				return
			for j in 3:
				var pt := 60 + j * 30
				if t > pt and t < pt + 70:
					var kk := float(t - pt) / 70.0
					var pos := Vector2(dx + (j - 1) * 120.0, lerpf(-120.0, chao - 260.0, kk))
					_paraquedas(c, pos, t)
			for j in 4:
				var tt: int = [90, 120, 150, 175][j]
				if t >= tt and t < tt + 18:
					var kk := float(t - tt) / 18.0
					Desenho.texto(c, def.position + Vector2((j - 1.5) * 70.0, -280 - kk * 40.0), "BUM!", int(48 + 30 * kk), Color("ffd23f"), PRETO, 10)
		"trump":
			# palco: holofotes coloridos e as letras gigantes em neon
			var cores := [Color("ff3b6b"), Color("2a9df4"), Color("ffd23f"), Color("1f9d55")]
			if not fundo:
				for j in 4:
					if (t / 16) % 4 == j and t > 60 and (t % 16) < 4:
						c.draw_line(Vector2((ax + dx) / 2.0 - 240.0 + j * 160.0, 300), def.position + Vector2(0, -130), Color(cores[j], 0.8), 10.0)
				return
			for j in 4:
				var a := sin(t * 0.04 + j * 1.3) * 0.5
				var topo := Vector2(200 + j * 300.0, -40)
				var fim := topo + Vector2(0, 800).rotated(a)
				var cor: Color = cores[j]
				cor.a = 0.18 * k
				c.draw_colored_polygon(PackedVector2Array([topo, fim + Vector2(-140, 0), fim + Vector2(140, 0)]), cor)
			for j in 10:
				var cor2: Color = cores[(j + t / 15) % 4]
				cor2.a = 0.35 * k
				c.draw_rect(Rect2(j * 128.0, chao - 6, 128, 40), cor2)
			var letras := ["Y", "M", "C", "A"]
			for j in 4:
				var aceso := (t / 16) % 4 == j
				var cor3: Color = cores[j]
				cor3.a = (1.0 if aceso else 0.35) * k
				Desenho.texto(c, Vector2((ax + dx) / 2.0 - 240.0 + j * 160.0, 330), letras[j], 110 if aceso else 90, cor3, PRETO, 12)
		"xandao":
			# chuva de documentos e o martelo gigante batendo no rival
			if fundo:
				for j in 12:
					var x := fposmod(j * 113.0 + t * 2.0, 1280.0)
					var y := fposmod(j * 71.0 + t * 7.0, 760.0) - 40.0
					c.draw_set_transform(Vector2(x, y), sin(t * 0.1 + j), Vector2(1.2, 1.2))
					Arte.projetil(c, "documento", t + j, false)
					c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				return
			var batida := absf(sin(t * 0.13))
			var a2 := lerpf(-1.4, 0.2, batida)
			c.draw_set_transform(Vector2(dx - dir * 60, chao - 400), a2 * -dir, Vector2(dir * 3.0, 3.0))
			for passada in 2:
				Desenho._cont = passada == 0
				Desenho._martelo(c, Vector2(0, 110))
			Desenho._cont = false
			c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			if t > 180:
				var q2 := clampf((t - 180) / 12.0, 0.0, 1.0)
				var tam := lerpf(180.0, 90.0, q2)
				var cor4 := Color("d62828")
				cor4.a = k
				c.draw_rect(Rect2(dx - 230, chao - 260, 460, 110).grow(-(1.0 - q2) * 10.0), Color(0.1, 0.0, 0.0, 0.6 * k))
				Desenho.texto(c, Vector2(dx, chao - 180), "BLOQUEADO", int(tam * 0.5), cor4, Color.WHITE, 8)
		"pavanato":
			# posse de mentira: bandeira ao fundo, contador de votos disparando, flashes de câmera e cédulas
			if not fundo:
				for j in 9:
					var tt := 46 + j * 12
					if t >= tt and t < tt + 34:
						var q := clampf((t - tt) / 20.0, 0.0, 1.0)
						var pos := Vector2(dx + (j % 3 - 1) * 60.0 + (j / 3) * 14.0, lerpf(-60.0, chao - 140.0 - (j % 2) * 50.0, q * q))
						c.draw_set_transform(pos, sin(t * 0.3 + j) * 0.4, Vector2(1.6, 1.6))
						for passada in 2:
							Desenho._cont = passada == 0
							Arte.projetil(c, "voto", t + j * 5, Desenho._cont)
						Desenho._cont = false
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				# flashes de câmera em volta do rival
				if t > 40 and t < 180 and (t / 5) % 3 == 0:
					var fx := dx + sin(t * 1.7) * 120.0
					var fy := chao - 160.0 + cos(t * 1.3) * 90.0
					c.draw_circle(Vector2(fx, fy), 26.0, Color(1, 1, 0.9, 0.85 * k))
					c.draw_circle(Vector2(fx, fy), 48.0, Color(1, 1, 0.9, 0.25 * k))
				if t > 172:
					var q4 := clampf((t - 172) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					var cor := Color("ffd23f")
					cor.a = k
					c.draw_rect(Rect2(dx - 260, chao - 250, 520, 110), Color(0.0, 0.05, 0.15, 0.7 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "MAIS VOTADO!", int(tam * 0.5), cor, Color("1f6fd1"), 8)
				return
			# bandeira gigante ondulando atrás de tudo
			var cx := clampf((ax + dx) / 2.0, 320.0, 960.0)
			var base := Rect2(cx - 300, chao - 470, 600, 300)
			for i in 30:
				var x0 := base.position.x + i * 20.0
				var ond := sin(t * 0.12 + i * 0.4) * 8.0
				c.draw_rect(Rect2(x0, base.position.y + ond, 21, base.size.y), Color(0.0, 0.6, 0.25, 0.9 * k))
			var centro := base.get_center()
			var losango := PackedVector2Array([centro + Vector2(0, -120), centro + Vector2(260, 0), centro + Vector2(0, 120), centro + Vector2(-260, 0)])
			c.draw_colored_polygon(losango, Color(1.0, 0.84, 0.15, 0.95 * k))
			c.draw_circle(centro, 84.0, Color(0.1, 0.2, 0.55, k))
			c.draw_line(centro + Vector2(-82, -14), centro + Vector2(82, 14), Color(1, 1, 1, k), 10.0)
			var votos := int(clampf((t - 30) / 140.0, 0.0, 1.0) * 3038438.0)
			var txt := str(votos)
			var fmt := ""
			for i in txt.length():
				if i > 0 and (txt.length() - i) % 3 == 0:
					fmt += "."
				fmt += txt[i]
			c.draw_rect(Rect2(centro.x - 230, base.end.y + 6, 460, 56), Color(0.04, 0.04, 0.1, 0.85 * k))
			Desenho.texto(c, Vector2(centro.x, base.end.y + 46), fmt + " VOTOS", 32, Color(1, 1, 1, k), Color("1f6fd1"), 6)
		"erika":
			# plenário: painel de votação enchendo de SIM, calendários 6x1 caindo no rival e o carimbo APROVADA
			if not fundo:
				for j in 6:
					var tt := 50 + j * 18
					if t >= tt and t < tt + 40:
						var q := clampf((t - tt) / 22.0, 0.0, 1.0)
						var pos := Vector2(dx + (j - 2.5) * 46.0, lerpf(-80.0, chao - 150.0 - (j % 2) * 40.0, q * q))
						c.draw_set_transform(pos, sin(t * 0.2 + j) * 0.3, Vector2(1.7, 1.7))
						for passada in 2:
							Desenho._cont = passada == 0
							Arte.projetil(c, "calendario", t + j * 7, Desenho._cont)
						Desenho._cont = false
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				if t > 168:
					var q4 := clampf((t - 168) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					var cor := Color("1f9d55")
					cor.a = k
					c.draw_rect(Rect2(dx - 250, chao - 250, 500, 110), Color(0.0, 0.08, 0.03, 0.7 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "APROVADA!", int(tam * 0.55), cor, Color.WHITE, 8)
				return
			var painel := Rect2(clampf((ax + dx) / 2.0, 320.0, 960.0) - 230, chao - 450, 460, 280)
			c.draw_rect(painel.grow(10), Color(0.25, 0.18, 0.08, k))
			c.draw_rect(painel, Color(0.04, 0.12, 0.08, 0.92 * k))
			Desenho.texto(c, painel.position + Vector2(230, 46), "PEC 6x1 · VOTAÇÃO", 26, Color(1, 0.85, 0.3, k), PRETO, 4)
			var sim := int(clampf((t - 40) / 130.0, 0.0, 1.0) * 412.0)
			var nao := int(clampf((t - 40) / 130.0, 0.0, 1.0) * 37.0)
			var w_sim := 380.0 * sim / 449.0
			var w_nao := 380.0 * nao / 449.0
			c.draw_rect(Rect2(painel.position + Vector2(40, 90), Vector2(380, 50)), Color(1, 1, 1, 0.12 * k))
			c.draw_rect(Rect2(painel.position + Vector2(40, 90), Vector2(w_sim, 50)), Color(0.12, 0.62, 0.33, k))
			Desenho.texto(c, painel.position + Vector2(230, 128), "SIM  %d" % sim, 30, Color(1, 1, 1, k), PRETO, 4)
			c.draw_rect(Rect2(painel.position + Vector2(40, 170), Vector2(380, 50)), Color(1, 1, 1, 0.12 * k))
			c.draw_rect(Rect2(painel.position + Vector2(40, 170), Vector2(w_nao, 50)), Color(0.84, 0.16, 0.16, k))
			Desenho.texto(c, painel.position + Vector2(230, 208), "NÃO  %d" % nao, 30, Color(1, 1, 1, k), PRETO, 4)
			# luzinhas dos deputados votando
			for j in 24:
				var aceso := (j * 37 + t / 3) % 7 != 0 and t > 40 + j * 4
				c.draw_circle(painel.position + Vector2(40 + j * 16.5, 262), 5.0, Color(0.2, 0.9, 0.4, k) if aceso else Color(0.3, 0.3, 0.35, k))
		"eduarda":
			# live: tela de celular gigante ao fundo, comentários subindo, e as letras de TRETA caindo
			if not fundo:
				for j in 5:
					var tt2 := 70 + j * 24
					if t >= tt2:
						var q3 := clampf((t - tt2) / 14.0, 0.0, 1.0)
						var pos3 := Vector2(dx + (j - 2) * 64.0, lerpf(-80.0, chao - 250.0 + (j % 2) * 30.0, q3))
						Desenho.texto(c, pos3, "TRETA"[j], 80, Color("ffd23f"), PRETO, 12)
				return
			var cel := Rect2(clampf(ax - dir * 200.0, 230.0, 1050.0) - 170, 160, 340, 420)
			c.draw_rect(cel.grow(10), Color(0.08, 0.06, 0.12, k))
			c.draw_rect(cel, Color(0.95, 0.2, 0.42, 0.85 * k))
			Desenho.texto(c, cel.position + Vector2(170, 44), "AO VIVO", 30, Color(1, 1, 1, k), PRETO, 6)
			for j in 6:
				var y3 := fposmod(cel.end.y - 40 - j * 70.0 - t * 2.5, 400.0) + 160.0
				c.draw_rect(Rect2(cel.position.x + 20, y3, 300, 40), Color(1, 1, 1, 0.85 * k))
				c.draw_circle(Vector2(cel.position.x + 40, y3 + 20), 12.0, Color("ffd23f"))
				c.draw_rect(Rect2(cel.position.x + 62, y3 + 12, 200 - j * 18.0, 6), Color(0.3, 0.3, 0.35, k))
				c.draw_rect(Rect2(cel.position.x + 62, y3 + 24, 140 - j * 10.0, 6), Color(0.5, 0.5, 0.55, k))


static func _tanque(c: CanvasItem, pos: Vector2, dir: float, t: int) -> void:
	c.draw_set_transform(pos, 0.0, Vector2(dir * 2.0, 2.0))
	for passada in 2:
		Desenho._cont = passada == 0
		Desenho._ret(c, Rect2(-70, -36, 140, 26), Color("4b5a2a"))
		Desenho._poli(c, PackedVector2Array([Vector2(-40, -36), Vector2(40, -36), Vector2(30, -62), Vector2(-30, -62)]), Color("5e6e34"))
		Desenho._ret(c, Rect2(28, -56, 66, 12), Color("4b5a2a"))
		Desenho._ret(c, Rect2(-74, -14, 148, 16), Color("2a2230"))
	Desenho._cont = false
	for j in 6:
		c.draw_circle(Vector2(-60 + j * 24, -6), 6.0, Color("6a6a74"))
	Desenho._estrela(c, Vector2(0, -48), 9.0, Color("ffd23f"))
	c.draw_rect(Rect2(90, -58, 10, 16), Color("ff8a1e"))
	if (t / 8) % 2 == 0:
		c.draw_circle(Vector2(110, -50), 10.0, Color("ffd23f"))
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func _paraquedas(c: CanvasItem, pos: Vector2, t: int) -> void:
	var bal := sin(t * 0.1) * 0.15
	c.draw_set_transform(pos, bal, Vector2(1.4, 1.4))
	var cupula := PackedVector2Array()
	for i in 13:
		var a := lerpf(PI, TAU, i / 12.0)
		cupula.append(Vector2(cos(a) * 50, -60 + sin(a) * 34))
	c.draw_colored_polygon(cupula, Color("1f9d55"))
	c.draw_line(Vector2(-50, -60), Vector2(-14, 0), PRETO, 2.0)
	c.draw_line(Vector2(50, -60), Vector2(14, 0), PRETO, 2.0)
	c.draw_rect(Rect2(-18, 0, 36, 30), Color("8a5a35"))
	c.draw_rect(Rect2(-18, 12, 36, 5), Color("ffd23f"))
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Por cima de tudo (tela): faixas de cinema e o nome do golpe cruzando.
static func desenhar_tela(c: CanvasItem, cin: Dictionary, atk: Lutador) -> void:
	var t: int = cin["t"]
	var dur: int = cin["dur"]
	var k := minf(clampf(t / 14.0, 0.0, 1.0), clampf((dur - t) / 14.0, 0.0, 1.0))
	c.draw_rect(Rect2(0, 0, 1280, 70 * k), PRETO)
	c.draw_rect(Rect2(0, 720 - 70 * k, 1280, 70 * k), PRETO)
	if t < 60:
		var q := clampf(t / 18.0, 0.0, 1.0)
		var x := lerpf(-600.0, 640.0, q * q * (3.0 - 2.0 * q))
		var nome: String = atk.dados["habilidades"]["ultimate"]["nome"]
		c.draw_rect(Rect2(0, 300, 1280, 110), Color(0.1, 0.0, 0.0, 0.6 * k))
		Desenho.texto(c, Vector2(x, 380), nome, 64, Color("ffd23f"), Color("7a1020"), 12)
		Desenho.texto(c, Vector2(1280 - x, 440), "ULTIMATE · " + String(atk.dados["nome"]), 26, Color.WHITE, PRETO, 6)
	if t > dur - 8:
		c.draw_rect(Rect2(0, 0, 1280, 720), Color(1, 1, 1, float(t - (dur - 8)) / 8.0 * 0.7))
