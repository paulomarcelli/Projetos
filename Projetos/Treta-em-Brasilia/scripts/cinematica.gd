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
			if t > 30 and t % 6 == 0:
				part.fumaca(atk.position + Vector2(-atk.lado * 190, -150), 1)
			if t > 60 and t < 170 and t % 9 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.4)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"bolsonaro":
			if t > 60 and t < 172 and t % 5 == 0:
				part.poeira(def.position + Vector2(randf_range(-80, 80), 0), 3, true)
			if t > 60 and t < 172 and t % 11 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-50, 30)), 2)
			if t == 176:
				part.explosao(alvo, 1.2)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"trump":
			if t > 40 and t % 8 == 0:
				part.confete(Vector2(640, 0), 6)
			if t > 70 and t < 172 and t % 10 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.2)
		"xandao":
			if t > 60 and t < 172 and t % 9 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.2)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 6)
		"nikolas":
			if t > 60 and t < 176 and t % 8 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 182:
				part.explosao(alvo, 1.1)
			if t > 182 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"pavanato":
			if t > 50 and t < 175 and t % 7 == 0:
				part.estrelas(alvo + Vector2(randf_range(-70, 70), randf_range(-50, 50)), 2)
			if t == 180:
				part.explosao(alvo, 1.1)
			if t > 180 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"dilma":
			if t > 50 and t < 170 and t % 7 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-60, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.1)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"renan":
			if t > 50 and t < 170 and t % 8 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.1)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"flavio":
			if t > 50 and t < 170 and t % 9 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 178:
				part.explosao(alvo, 1.1)
			if t > 178 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)
		"erika":
			if t > 60 and t < 170 and t % 9 == 0:
				part.estrelas(alvo + Vector2(randf_range(-60, 60), randf_range(-40, 40)), 2)
			if t == 176:
				part.explosao(alvo, 1.0)
			if t > 176 and t % 5 == 0:
				part.confete(Vector2(640, 0), 8)
		"eduarda":
			if t > 50 and t < 172 and t % 6 == 0:
				part.estrelas(alvo + Vector2(randf_range(-80, 80), randf_range(-60, 60)), 1)
			if t == 176:
				part.explosao(alvo, 1.2)
			if t > 176 and t % 4 == 0:
				part.confete(Vector2(640, 0), 8)


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
			# churrascão no Planalto: pôr do sol, churrasqueira gigante, placa da picanha despencando de
			# preço, a multidão fazendo o L e a picanha suprema caindo do céu
			var cxl := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if fundo:
				for j in 6:
					var cor_c := Color("ff9a3c").lerp(Color("7a2d6b"), j / 5.0)
					c.draw_rect(Rect2(-300, chao - 560 + j * 80.0, 1880, 82), Color(cor_c, 0.9 * k))
				c.draw_circle(Vector2(cxl + 260, chao - 300), 70.0, Color(1, 0.85, 0.45, 0.9 * k))
				# Palácio do Planalto: laje comprida, colunas em curva e a rampa
				c.draw_rect(Rect2(cxl - 520, chao - 150, 1040, 14), Color(0.95, 0.95, 0.92, k))
				c.draw_rect(Rect2(cxl - 500, chao - 136, 1000, 70), Color(0.35, 0.3, 0.38, 0.8 * k))
				for j in 14:
					var xc := cxl - 480 + j * 74.0
					# coluna do Planalto: fina no chão e no alto, larga no meio, em curva
					c.draw_colored_polygon(PackedVector2Array([Vector2(xc - 3, chao - 66), Vector2(xc + 3, chao - 66), Vector2(xc + 20, chao - 96), Vector2(xc + 8, chao - 136),
						Vector2(xc - 8, chao - 136), Vector2(xc - 20, chao - 96)]), Color(0.97, 0.97, 0.95, k))
				c.draw_colored_polygon(PackedVector2Array([Vector2(cxl - 120, chao - 66), Vector2(cxl + 80, chao - 66), Vector2(cxl - 40, chao - 20), Vector2(cxl - 240, chao - 20)]), Color(0.9, 0.9, 0.88, k))
				var s2 := clampf((t - 20) / 30.0, 0.0, 1.0)
				c.draw_set_transform(Vector2(ax - dir * 210, chao), 0.0, Vector2(dir, 1) * (1.0 + 1.3 * s2))
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
			if t > 140 and t < 178:
				var q := clampf((t - 140) / 36.0, 0.0, 1.0)
				var y := lerpf(-400.0, chao - 160.0, q * q)
				c.draw_set_transform(Vector2(dx, y), 0.15, Vector2(4.5, 4.5))
				for passada in 2:
					Desenho._cont = passada == 0
					Desenho._projetil_forma(c, "picanha", t, 0.0, 4.5)
				Desenho._cont = false
				c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			# a multidão fazendo o L embaixo
			if t > 50:
				var sobe := clampf((t - 50) / 20.0, 0.0, 1.0)
				for j in 12:
					var hx := fposmod(j * 118.0, 1400.0) - 60.0
					var hy := chao + 70.0 - sobe * (40.0 + absf(sin(t * 0.2 + j)) * 14.0)
					c.draw_rect(Rect2(hx - 8, hy - 50, 16, 60), Color(0.85, 0.62, 0.45, k))
					c.draw_rect(Rect2(hx - 8, hy - 50, 40, 14), Color(0.85, 0.62, 0.45, k))
					c.draw_rect(Rect2(hx - 12, hy + 4, 24, 40), Color(0.84, 0.16, 0.16, k))
			# placa do preço da picanha despencando
			var preco := lerpf(89.90, 9.99, clampf((t - 40) / 120.0, 0.0, 1.0))
			var cor_p := Color("ff5a4e").lerp(Color("4ade80"), clampf((t - 40) / 120.0, 0.0, 1.0))
			_letreiro(c, cxl, chao, "PICANHA: R$ %s" % ("%.2f" % preco).replace(".", ","), cor_p, k)
			if t > 172:
				_frase_final(c, dx, chao, t, "A PICANHA VOLTOU!", Color("ffd23f"), Color("d62828"), k)
		"bolsonaro":
			# motociata: Esplanada, comboio de motos cruzando por cima do rival e o contador subindo
			var cxb := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if fundo:
				c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.45, 0.68, 0.9, 0.85 * k))
				# Congresso: as duas torres e as cúpulas
				c.draw_rect(Rect2(cxb - 30, chao - 330, 26, 220), Color(0.92, 0.92, 0.9, k))
				c.draw_rect(Rect2(cxb + 8, chao - 330, 26, 220), Color(0.92, 0.92, 0.9, k))
				c.draw_rect(Rect2(cxb - 300, chao - 112, 600, 22), Color(0.92, 0.92, 0.9, k))
				c.draw_arc(Vector2(cxb - 160, chao - 112), 54.0, PI, TAU, 18, Color(0.95, 0.95, 0.93, k), 8.0)
				c.draw_colored_polygon(_meia_lua(Vector2(cxb + 160, chao - 112), 56.0), Color(0.95, 0.95, 0.93, k))
				c.draw_rect(Rect2(-300, chao - 90, 1880, 90), Color(0.3, 0.3, 0.34, k))
				for j in 12:
					c.draw_rect(Rect2(fposmod(j * 140.0 - t * 9.0, 1680.0) - 200, chao - 46, 70, 6), Color(1, 0.9, 0.3, k))
				for j in 6:
					var bx := cxb - 450 + j * 180.0
					c.draw_line(Vector2(bx, chao - 90), Vector2(bx, chao - 210), Color(0.4, 0.3, 0.2, k), 3.0)
					var ond := sin(t * 0.2 + j) * 5.0
					c.draw_colored_polygon(PackedVector2Array([Vector2(bx, chao - 210), Vector2(bx + 56, chao - 206 + ond), Vector2(bx + 56, chao - 172 + ond), Vector2(bx, chao - 176)]), Color(0.12, 0.62, 0.33, k))
					c.draw_colored_polygon(PackedVector2Array([Vector2(bx + 28, chao - 204), Vector2(bx + 50, chao - 191 + ond), Vector2(bx + 28, chao - 178), Vector2(bx + 6, chao - 191)]), Color(1, 0.84, 0.25, k))
				return
			# fileiras de motos passando (a do meio passa por cima do rival)
			if t > 40 and t < 176:
				for fila in 3:
					var y := chao - 10.0 - fila * 26.0
					for j in 5:
						var x := fposmod((t - 40) * (14.0 + fila * 3.0) + j * 260.0, 1700.0) - 210.0
						if dir < 0:
							x = 1280.0 - x
						_moto(c, Vector2(x, y), dir, t + j * 7, 1.0 - fila * 0.12, k)
			var motos := int(clampf((t - 40) / 130.0, 0.0, 1.0) * 12000.0)
			_letreiro(c, cxb, chao, "MOTOS: %s" % _milhar(motos), Color("ffd23f"), k)
			if t > 172:
				_frase_final(c, dx, chao, t, "TÁ OK?", Color("ffd23f"), Color("1f9d55"), k)
		"trump":
			# comício: telão, bandeirolas, Y M C A acendendo, plateia de bonés e caixotes de tarifa
			var cores := [Color("ff3b6b"), Color("2a9df4"), Color("ffd23f"), Color("1f9d55")]
			var cxt := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if not fundo:
				for j in 4:
					if (t / 16) % 4 == j and t > 60 and (t % 16) < 4:
						c.draw_line(Vector2(cxt - 240.0 + j * 160.0, chao - 330), def.position + Vector2(0, -130), Color(cores[j], 0.8), 10.0)
				for j in 7:
					var tt := 60 + j * 15
					if t >= tt and t < tt + 24:
						var q := clampf((t - tt) / 20.0, 0.0, 1.0)
						var pos := Vector2(dx + (j % 3 - 1) * 60.0, lerpf(-60.0, chao - 120.0 - (j % 2) * 40.0, q * q))
						c.draw_set_transform(pos, sin(t * 0.2 + j) * 0.3, Vector2(1.6, 1.6))
						for passada in 2:
							Desenho._cont = passada == 0
							Arte.projetil(c, "tarifa", t + j * 5, Desenho._cont)
						Desenho._cont = false
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				# plateia de bonés vermelhos pulando
				for j in 16:
					var px := fposmod(j * 86.0, 1400.0) - 60.0
					var py := chao + 60.0 - absf(sin(t * 0.25 + j * 0.7)) * 10.0
					c.draw_circle(Vector2(px, py - 40), 16.0, Color(0.1, 0.08, 0.14, k))
					c.draw_rect(Rect2(px - 17, py - 58, 34, 12), Color(0.8, 0.1, 0.15, k))
					c.draw_rect(Rect2(px - 4, py - 50, 26, 5), Color(0.8, 0.1, 0.15, k))
				var letras := ["Y", "M", "C", "A"]
				for j in 4:
					var aceso := (t / 16) % 4 == j
					var cor3: Color = cores[j]
					cor3.a = (1.0 if aceso else 0.35) * k
					Desenho.texto(c, Vector2(cxt - 240.0 + j * 160.0, chao - 270), letras[j], 72 if aceso else 60, cor3, PRETO, 12)
				var tarifa := int(lerpf(10.0, 500.0, clampf((t - 40) / 130.0, 0.0, 1.0)))
				_letreiro(c, cxt, chao, "TARIFA: %d%%" % tarifa, Color("ff5a4e"), k)
				if t > 172:
					_frase_final(c, dx, chao, t, "YOU'RE FIRED!", Color("ffd23f"), Color("b3001b"), k)
				return
			c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.04, 0.06, 0.2, 0.9 * k))
			for j in 40:
				c.draw_circle(Vector2(fposmod(j * 137.0, 1400.0) - 60, chao - 540 + fposmod(j * 61.0, 220.0)), 3.0, Color(1, 1, 1, (0.5 + 0.5 * sin(t * 0.3 + j)) * k))
			# bandeirolas listradas
			for j in 18:
				var bx := cxt - 640 + j * 72.0
				var cor_b := Color("b3001b") if j % 2 == 0 else Color("f2f2f2")
				c.draw_colored_polygon(PackedVector2Array([Vector2(bx, chao - 420), Vector2(bx + 72, chao - 420), Vector2(bx + 36, chao - 388)]), Color(cor_b, k))
			for j in 4:
				var a := sin(t * 0.04 + j * 1.3) * 0.5
				var topo := Vector2(cxt - 450 + j * 300.0, chao - 560)
				var fim := topo + Vector2(0, 800).rotated(a)
				var cor: Color = cores[j]
				cor.a = 0.18 * k
				c.draw_colored_polygon(PackedVector2Array([topo, fim + Vector2(-140, 0), fim + Vector2(140, 0)]), cor)
			c.draw_rect(Rect2(-300, chao - 40, 1880, 40), Color(0.15, 0.1, 0.2, k))
		"xandao":
			# Supremo: colunas do STF, a estátua da Justiça, perfis caindo e sendo carimbados, e o martelo
			var cxx := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if fundo:
				c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.12, 0.1, 0.16, 0.9 * k))
				c.draw_rect(Rect2(cxx - 560, chao - 330, 1120, 20), Color(0.9, 0.9, 0.88, k))
				for j in 10:
					var xc := cxx - 520 + j * 116.0
					c.draw_colored_polygon(PackedVector2Array([Vector2(xc - 24, chao - 60), Vector2(xc + 24, chao - 60), Vector2(xc + 8, chao - 310), Vector2(xc - 8, chao - 310)]), Color(0.86, 0.86, 0.84, 0.9 * k))
				# a Justiça sentada, de olhos vendados, com a espada no colo
				var js := Vector2(cxx + (380 if dir > 0 else -380), chao - 60)
				c.draw_rect(Rect2(js + Vector2(-50, -50), Vector2(100, 50)), Color(0.55, 0.55, 0.58, k))
				c.draw_colored_polygon(PackedVector2Array([js + Vector2(-34, -50), js + Vector2(34, -50), js + Vector2(22, -150), js + Vector2(-22, -150)]), Color(0.6, 0.6, 0.63, k))
				c.draw_circle(js + Vector2(0, -170), 22.0, Color(0.6, 0.6, 0.63, k))
				c.draw_rect(Rect2(js + Vector2(-22, -178), Vector2(44, 8)), Color(0.35, 0.35, 0.4, k))
				c.draw_line(js + Vector2(-60, -84), js + Vector2(60, -96), Color(0.75, 0.75, 0.8, k), 6.0)
				for j in 10:
					var x := fposmod(j * 113.0 + t * 2.0, 1280.0)
					var y := fposmod(j * 71.0 + t * 7.0, 760.0) - 40.0
					c.draw_set_transform(Vector2(x, y), sin(t * 0.1 + j), Vector2(1.2, 1.2))
					Arte.projetil(c, "documento", t + j, false)
					c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				return
			# cartões de perfil caindo; ao passar do meio levam o carimbo SUSPENSO
			for j in 6:
				var tt := 40 + j * 20
				if t >= tt and t < tt + 60:
					var q := (t - tt) / 60.0
					var pos := Vector2(cxx - 380 + j * 150.0, lerpf(chao - 420.0, chao - 60.0, q))
					var r := Rect2(pos - Vector2(56, 22), Vector2(112, 44))
					c.draw_rect(r.grow(3), Color(0.05, 0.04, 0.08, k))
					c.draw_rect(r, Color(1, 1, 1, k))
					c.draw_circle(r.position + Vector2(20, 22), 13.0, Color(0.3, 0.55, 0.9, k))
					c.draw_rect(Rect2(r.position + Vector2(40, 12), Vector2(60, 6)), Color(0.4, 0.4, 0.45, k))
					c.draw_rect(Rect2(r.position + Vector2(40, 26), Vector2(44, 6)), Color(0.6, 0.6, 0.65, k))
					if q > 0.45:
						c.draw_set_transform(pos, -0.2, Vector2.ONE)
						c.draw_rect(Rect2(-60, -14, 120, 28), Color(0.85, 0.1, 0.12, 0.9 * k), false, 4.0)
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
						Desenho.texto(c, pos + Vector2(0, 8), "SUSPENSO", 13, Color(0.85, 0.1, 0.12, k), Color(1, 1, 1, k), 2)
			var batida := absf(sin(t * 0.13))
			var a2 := lerpf(-1.4, 0.2, batida)
			c.draw_set_transform(Vector2(dx - dir * 60, chao - 400), a2 * -dir, Vector2(dir * 3.0, 3.0))
			for passada in 2:
				Desenho._cont = passada == 0
				Desenho._martelo(c, Vector2(0, 110))
			Desenho._cont = false
			c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			var perfis := int(clampf((t - 40) / 130.0, 0.0, 1.0) * 999.0)
			_letreiro(c, cxx, chao, "PERFIS SUSPENSOS: %d" % perfis, Color("ff5a4e"), k)
			if t > 172:
				_frase_final(c, dx, chao, t, "INQUÉRITO ABERTO!", Color("ff5a4e"), Color.WHITE, k)
		"nikolas":
			# a caminhada: estrada BR-040, chuva, placa de km contando até Brasília e a multidão marchando
			if not fundo:
				# chuva
				for j in 40:
					var x := fposmod(j * 97.0 + t * 3.0, 1400.0) - 60.0
					var y := fposmod(j * 53.0 + t * 18.0, 760.0) - 40.0
					c.draw_line(Vector2(x, y), Vector2(x - 6, y + 22), Color(0.7, 0.85, 1.0, 0.45 * k), 2.0)
				# multidão passando na frente, de bandeirinha
				for j in 10:
					var px := fposmod(j * 140.0 + t * 2.2, 1500.0) - 110.0
					var bob := absf(sin(t * 0.3 + j)) * 6.0
					var base_y := chao + 40.0 - bob
					c.draw_circle(Vector2(px, base_y - 70), 13.0, Color(0.08, 0.06, 0.14, 0.9 * k))
					c.draw_rect(Rect2(px - 13, base_y - 58, 26, 58), Color(0.08, 0.06, 0.14, 0.9 * k))
					if j % 3 == 0:
						c.draw_line(Vector2(px + 10, base_y - 50), Vector2(px + 10, base_y - 110), Color(0.3, 0.2, 0.1, k), 3.0)
						c.draw_rect(Rect2(px + 11, base_y - 110, 30, 20), Color(0.12, 0.62, 0.33, k))
						c.draw_circle(Vector2(px + 26, base_y - 100), 5.0, Color(1, 0.84, 0.25, k))
				if t > 170:
					var q4 := clampf((t - 170) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					var cor := Color("ffd23f")
					cor.a = k
					c.draw_rect(Rect2(dx - 250, chao - 250, 500, 110), Color(0.0, 0.1, 0.05, 0.7 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "CHEGAMOS!", int(tam * 0.55), cor, Color("1f9d55"), 8)
				return
			# estrada em perspectiva com a faixa andando
			var cxr := clampf((ax + dx) / 2.0, 320.0, 960.0)
			c.draw_rect(Rect2(-300, chao - 520, 1880, 520), Color(0.25, 0.3, 0.4, 0.8 * k))
			var estrada := PackedVector2Array([Vector2(cxr - 60, chao - 300), Vector2(cxr + 60, chao - 300), Vector2(cxr + 700, chao), Vector2(cxr - 700, chao)])
			c.draw_colored_polygon(estrada, Color(0.22, 0.22, 0.26, k))
			for j in 6:
				var q := fposmod(j / 6.0 + t * 0.012, 1.0)
				var y0 := lerpf(chao - 300, chao, q * q)
				var w := lerpf(4.0, 22.0, q * q)
				c.draw_rect(Rect2(cxr - w / 2.0, y0, w, lerpf(8.0, 40.0, q * q)), Color(1, 0.85, 0.2, k))
			# placa verde da rodovia
			var km := int(lerpf(240.0, 0.0, clampf((t - 30) / 140.0, 0.0, 1.0)))
			var placa := Rect2(cxr + 120, chao - 470, 300, 120)
			c.draw_rect(placa.grow(6), Color(0.9, 0.9, 0.9, k))
			c.draw_rect(placa, Color(0.05, 0.42, 0.22, k))
			Desenho.texto(c, placa.position + Vector2(150, 50), "BRASÍLIA", 30, Color(1, 1, 1, k), Color(0, 0, 0, 0), 0)
			Desenho.texto(c, placa.position + Vector2(150, 100), "%d km" % km, 32, Color(1, 1, 1, k), Color(0, 0, 0, 0), 0)
			c.draw_line(placa.position + Vector2(150, placa.size.y + 6), placa.position + Vector2(150, 470), Color(0.6, 0.6, 0.6, k), 8.0)
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
		"dilma":
			# estocando vento: parque eólico girando, tornado no rival e o medidor enchendo
			var cxd := clampf((ax + dx) / 2.0, 320.0, 960.0)
			var enche := clampf((t - 30) / 140.0, 0.0, 1.0)
			if not fundo:
				# tornado em volta do rival
				if t > 40 and t < 176:
					var forte := clampf((t - 40) / 30.0, 0.0, 1.0)
					for j in 9:
						var y := chao - 10.0 - j * 34.0
						var rx := (30.0 + j * 13.0) * forte
						var fase := t * 0.5 + j * 0.7
						c.draw_set_transform(Vector2(dx + sin(fase * 0.5) * 10.0, y), 0.0, Vector2(1.0, 0.28))
						c.draw_arc(Vector2.ZERO, rx, fase, fase + 4.2, 18, Color(0.85, 0.92, 1.0, 0.7 * k), 7.0)
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				# potes voando do rival para a Dilma, cheios de vento
				for j in 6:
					var tt := 50 + j * 20
					if t >= tt and t < tt + 28:
						var q := clampf((t - tt) / 26.0, 0.0, 1.0)
						var pos := Vector2(lerpf(dx, ax + dir * 40.0, q), chao - 160.0 - sin(q * PI) * 140.0)
						c.draw_set_transform(pos, sin(t * 0.3 + j) * 0.5, Vector2(1.5, 1.5))
						for passada in 2:
							Desenho._cont = passada == 0
							Arte.projetil(c, "vento", t + j * 5, Desenho._cont)
						Desenho._cont = false
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				# medidor
				var barra := Rect2(cxd - 230, chao - 400, 460, 34)
				c.draw_rect(barra.grow(4), Color(0.05, 0.04, 0.12, 0.85 * k))
				c.draw_rect(Rect2(barra.position, Vector2(barra.size.x * enche, barra.size.y)), Color(0.45, 0.8, 1.0, k))
				Desenho.texto(c, barra.get_center() + Vector2(0, 10), "VENTO ESTOCADO: %d%%" % int(enche * 100.0), 16, Color(1, 1, 1, k), Color(0.05, 0.1, 0.3, k), 4)
				if t > 172:
					var q4 := clampf((t - 172) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					c.draw_rect(Rect2(dx - 290, chao - 250, 580, 110), Color(0.05, 0.05, 0.15, 0.75 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "VENTO ESTOCADO!", int(tam * 0.46), Color(0.55, 0.9, 1.0, k), Color("d94f70"), 8)
				return
			# céu claro, morro verde e as turbinas eólicas
			c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.55, 0.78, 0.95, 0.85 * k))
			c.draw_rect(Rect2(-300, chao - 60, 1880, 60), Color(0.3, 0.6, 0.3, k))
			var giro := t * (0.05 + enche * 0.35)
			for j in 3:
				var bx := cxd - 330.0 + j * 330.0
				var topo := Vector2(bx, chao - 360.0 + (j % 2) * 30.0)
				c.draw_colored_polygon(PackedVector2Array([Vector2(bx - 9, chao - 50), Vector2(bx + 9, chao - 50), Vector2(bx + 4, topo.y), Vector2(bx - 4, topo.y)]), Color(0.95, 0.95, 0.97, k))
				c.draw_rect(Rect2(topo + Vector2(-12, -8), Vector2(26, 14)), Color(0.9, 0.9, 0.93, k))
				for pa in 3:
					var a: float = giro + pa * TAU / 3.0 + j
					var ponta := topo + Vector2(cos(a), sin(a)) * 120.0
					var lado := Vector2(-sin(a), cos(a)) * 7.0
					c.draw_colored_polygon(PackedVector2Array([topo + lado, ponta, topo - lado]), Color(0.98, 0.98, 1.0, k))
				c.draw_circle(topo, 8.0, Color(0.8, 0.8, 0.85, k))
		"renan":
			# urna eletrônica gigante: digita 1, 4, CONFIRMA; as teclas voam no rival
			var cxu := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if not fundo:
				for j in 8:
					var tt := 46 + j * 15
					if t >= tt and t < tt + 26:
						var q := clampf((t - tt) / 22.0, 0.0, 1.0)
						var pos := Vector2(lerpf(ax + dir * 60.0, dx, q), chao - 170.0 - sin(q * PI) * 160.0 + (j % 2) * 30.0)
						var tecla := Rect2(pos - Vector2(30, 26), Vector2(60, 52))
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
						c.draw_rect(tecla.grow(4), Color(0.08, 0.06, 0.12, k))
						c.draw_rect(tecla, Color(0.16, 0.16, 0.2, k))
						c.draw_rect(Rect2(tecla.position, Vector2(60, 8)), Color(0.3, 0.3, 0.36, k))
						Desenho.texto(c, pos + Vector2(0, 14), "1" if j % 2 == 0 else "4", 28, Color(1, 1, 1, k), Color(0, 0, 0, 0), 0)
				if t > 172:
					var q4 := clampf((t - 172) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					var cor := Color(0.3, 1.0, 0.45, k)
					c.draw_rect(Rect2(dx - 250, chao - 250, 500, 110), Color(0.0, 0.08, 0.02, 0.75 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "CONFIRMA!", int(tam * 0.55), cor, Color(0.05, 0.3, 0.1, k), 8)
				return
			var urna := Rect2(cxu - 270, chao - 400, 540, 290)
			c.draw_rect(urna.grow(8), Color(0.08, 0.06, 0.12, k))
			c.draw_rect(urna, Color(0.82, 0.8, 0.74, k))
			var tela := Rect2(urna.position + Vector2(20, 20), Vector2(310, 200))
			c.draw_rect(tela, Color(0.92, 0.94, 0.9, k))
			if t < 124:
				Desenho.texto(c, tela.position + Vector2(155, 34), "PRESIDENTE", 18, Color(0.1, 0.1, 0.1, k), Color(0, 0, 0, 0), 0)
				var dig := ""
				if t >= 40:
					dig = "1"
				if t >= 70:
					dig = "14"
				for j in 2:
					var caixa := Rect2(tela.position + Vector2(95 + j * 66, 56), Vector2(54, 66))
					c.draw_rect(caixa, Color(0.1, 0.1, 0.1, k), false, 3.0)
					if dig.length() > j:
						Desenho.texto(c, caixa.get_center() + Vector2(0, 18), dig[j], 40, Color(0.1, 0.1, 0.1, k), Color(0, 0, 0, 0), 0)
				if t >= 80:
					Desenho.texto(c, tela.position + Vector2(155, 170), "RENAN · MISSÃO", 16, Color(0.1, 0.1, 0.1, k), Color(0, 0, 0, 0), 0)
			else:
				Desenho.texto(c, tela.get_center() + Vector2(0, 24), "FIM", 54, Color(0.1, 0.1, 0.1, k), Color(0, 0, 0, 0), 0)
			# teclado: números e os botões BRANCO, CORRIGE e CONFIRMA
			var tx := urna.position + Vector2(350, 24)
			for j in 9:
				c.draw_rect(Rect2(tx + Vector2((j % 3) * 56, (j / 3) * 46), Vector2(48, 38)), Color(0.16, 0.16, 0.2, k))
			var aperta := 4.0 if (t >= 108 and t < 122) else 0.0
			c.draw_rect(Rect2(tx + Vector2(0, 150), Vector2(48, 30)), Color(0.95, 0.95, 0.95, k))
			c.draw_rect(Rect2(tx + Vector2(56, 150), Vector2(48, 30)), Color(1.0, 0.5, 0.1, k))
			c.draw_rect(Rect2(tx + Vector2(112, 146 + aperta), Vector2(56, 38)), Color(0.15, 0.7, 0.3, k))
			if aperta > 0.0:
				c.draw_circle(tx + Vector2(140, 165), 50.0, Color(0.4, 1, 0.5, 0.3 * k))
		"flavio":
			# saiu escondido: aeroporto à noite, painel com o voo para Miami, avião decolando,
			# a lupa procurando "CADÊ O FLÁVIO?" e as malas despencando no rival
			if not fundo:
				for j in 8:
					var tt := 48 + j * 14
					if t >= tt and t < tt + 30:
						var q := clampf((t - tt) / 18.0, 0.0, 1.0)
						var pos := Vector2(dx + (j % 3 - 1) * 56.0, lerpf(-60.0, chao - 120.0 - (j % 2) * 46.0, q * q))
						c.draw_set_transform(pos, sin(t * 0.25 + j) * 0.5, Vector2(1.7, 1.7))
						for passada in 2:
							Desenho._cont = passada == 0
							Arte.projetil(c, "mala", t + j * 7, Desenho._cont)
						Desenho._cont = false
						c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				# lupa varrendo a tela
				var cxl := clampf((ax + dx) / 2.0, 320.0, 960.0)
				if t > 96 and t < 168:
					var q2 := (t - 96) / 72.0
					var lp := Vector2(lerpf(cxl - 420.0, cxl + 420.0, q2), chao - 190.0 + sin(q2 * TAU * 1.5) * 60.0)
					c.draw_circle(lp, 62.0, Color(0.85, 0.95, 1.0, 0.18 * k))
					c.draw_arc(lp, 64.0, 0.0, TAU, 40, Color(0.1, 0.08, 0.14, k), 14.0)
					c.draw_arc(lp, 64.0, 0.0, TAU, 40, Color(0.79, 0.64, 0.15, k), 8.0)
					c.draw_line(lp + Vector2(44, 44), lp + Vector2(110, 110), Color(0.1, 0.08, 0.14, k), 20.0)
					c.draw_line(lp + Vector2(46, 46), lp + Vector2(106, 106), Color(0.45, 0.28, 0.14, k), 12.0)
					c.draw_rect(Rect2(cxl - 240, chao - 400, 480, 70), Color(0.05, 0.04, 0.12, 0.8 * k))
					Desenho.texto(c, Vector2(cxl, chao - 352), "CADÊ O FLÁVIO?", 28, Color(1, 0.84, 0.25, k), Color(0.1, 0.1, 0.3, k), 6)
				if t > 172:
					var q4 := clampf((t - 172) / 10.0, 0.0, 1.0)
					var tam := lerpf(150.0, 84.0, q4)
					var cor := Color("ffd23f")
					cor.a = k
					c.draw_rect(Rect2(dx - 290, chao - 250, 580, 110), Color(0.0, 0.05, 0.15, 0.75 * k))
					Desenho.texto(c, Vector2(dx, chao - 172), "SAIU ESCONDIDO!", int(tam * 0.46), cor, Color("1f9d55"), 8)
				return
			# céu noturno com estrelas e a pista iluminada
			c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.04, 0.06, 0.16, 0.85 * k))
			for j in 24:
				var sx := fposmod(j * 173.0, 1280.0)
				var sy := chao - 540.0 + fposmod(j * 97.0, 300.0)
				c.draw_circle(Vector2(sx, sy), 1.5 + (j % 3), Color(1, 1, 0.9, (0.4 + 0.4 * sin(t * 0.2 + j)) * k))
			c.draw_rect(Rect2(-300, chao - 40, 1880, 40), Color(0.12, 0.12, 0.16, k))
			for j in 14:
				var lx := fposmod(j * 100.0 - t * 6.0, 1400.0) - 60.0
				c.draw_circle(Vector2(lx, chao - 20), 4.0, Color(1, 0.85, 0.3, k))
			# painel de partidas
			var cxp := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if t < 98:
				var kp := k * clampf((98 - t) / 8.0, 0.0, 1.0)
				var painel := Rect2(cxp - 230, chao - 404, 460, 116)
				c.draw_rect(painel.grow(6), Color(0.3, 0.3, 0.34, kp))
				c.draw_rect(painel, Color(0.06, 0.06, 0.08, kp))
				Desenho.texto(c, painel.position + Vector2(230, 30), "PARTIDAS", 18, Color(1, 0.84, 0.25, kp), Color(0, 0, 0, 0), 0)
				var pisca := 1.0 if (t / 12) % 2 == 0 else 0.35
				Desenho.texto(c, painel.position + Vector2(230, 66), "MIAMI  EMBARQUE", 17, Color(0.4, 1, 0.5, pisca * kp), Color(0, 0, 0, 0), 0)
				Desenho.texto(c, painel.position + Vector2(230, 100), "BRASÍLIA  CANCELADO", 17, Color(1, 0.35, 0.3, kp), Color(0, 0, 0, 0), 0)
			# o avião decolando
			if t > 30 and t < 190:
				var q3 := clampf((t - 30) / 150.0, 0.0, 1.0)
				var pv := Vector2(lerpf(-160.0, 1460.0, q3), chao - 90.0 - maxf(0.0, q3 - 0.25) * 520.0)
				var inc := -0.28 if q3 > 0.25 else 0.0
				c.draw_set_transform(pv, inc, Vector2.ONE)
				c.draw_colored_polygon(PackedVector2Array([Vector2(-150, -18), Vector2(130, -18), Vector2(170, 0), Vector2(130, 18), Vector2(-150, 18)]), Color(0.93, 0.94, 0.97, k))
				c.draw_colored_polygon(PackedVector2Array([Vector2(-130, -18), Vector2(-150, -70), Vector2(-112, -70), Vector2(-90, -18)]), Color(0.12, 0.62, 0.33, k))
				c.draw_colored_polygon(PackedVector2Array([Vector2(-20, 6), Vector2(40, 6), Vector2(-40, 70), Vector2(-70, 70)]), Color(0.75, 0.78, 0.85, k))
				for w in 9:
					c.draw_circle(Vector2(-110 + w * 26, -4), 5.0, Color(0.35, 0.6, 0.9, k))
				c.draw_rect(Rect2(-150, 4, 300, 5), Color(1, 0.84, 0.25, k))
				c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
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
			# Praia Grande no mapa: orla com coqueiros e guarda-sóis, celulares com corações subindo,
			# o contador de votos e o pino do mapa gigante caindo no rival
			var cxe := clampf((ax + dx) / 2.0, 320.0, 960.0)
			if fundo:
				c.draw_rect(Rect2(-300, chao - 560, 1880, 560), Color(0.5, 0.8, 0.98, 0.9 * k))
				c.draw_circle(Vector2(cxe - 300, chao - 330), 50.0, Color(1, 0.92, 0.5, k))
				c.draw_rect(Rect2(-300, chao - 190, 1880, 70), Color(0.15, 0.55, 0.8, k))
				for j in 10:
					var ox := fposmod(j * 160.0 + t * 1.5, 1700.0) - 210.0
					c.draw_arc(Vector2(ox, chao - 160), 26.0, PI, TAU, 10, Color(1, 1, 1, 0.7 * k), 3.0)
				c.draw_rect(Rect2(-300, chao - 120, 1880, 120), Color(0.95, 0.85, 0.6, k))
				for j in 5:
					var gx := cxe - 520 + j * 260.0
					var cor_g: Color = [Color("ff3b6b"), Color("ffd23f"), Color("2a9df4")][j % 3]
					c.draw_line(Vector2(gx, chao - 40), Vector2(gx, chao - 120), Color(0.4, 0.3, 0.2, k), 3.0)
					c.draw_colored_polygon(_meia_lua(Vector2(gx, chao - 120), 50.0), Color(cor_g, k))
				for lado_c: float in [-1.0, 1.0]:
					var cx2: float = cxe + lado_c * 560.0
					c.draw_line(Vector2(cx2, chao - 40), Vector2(cx2 + lado_c * 20, chao - 300), Color(0.45, 0.3, 0.15, k), 12.0)
					for f in 5:
						var a := -PI / 2 + (f - 2) * 0.55
						c.draw_line(Vector2(cx2 + lado_c * 20, chao - 300), Vector2(cx2 + lado_c * 20, chao - 300) + Vector2(cos(a), sin(a) + 0.6) * 90.0, Color(0.15, 0.6, 0.25, k), 9.0)
				return
			# celulares subindo com corações
			for j in 8:
				var y := chao - fposmod(t * 4.0 + j * 70.0, 460.0)
				var x := cxe - 420 + j * 120.0
				c.draw_set_transform(Vector2(x, y), sin(t * 0.1 + j) * 0.2, Vector2(1.2, 1.2))
				for passada in 2:
					Desenho._cont = passada == 0
					Arte.projetil(c, "corte" if j % 2 == 0 else "curtida", t + j * 3, Desenho._cont)
				Desenho._cont = false
				c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			# o pino do mapa caindo no rival
			if t > 120 and t < 178:
				var q := clampf((t - 120) / 40.0, 0.0, 1.0)
				var py := lerpf(-200.0, def.position.y - 230.0, q * q)
				c.draw_circle(Vector2(dx, py), 62.0, Color(0.1, 0.05, 0.1, k))
				c.draw_circle(Vector2(dx, py), 56.0, Color(0.92, 0.2, 0.3, k))
				c.draw_colored_polygon(PackedVector2Array([Vector2(dx - 44, py + 34), Vector2(dx + 44, py + 34), Vector2(dx, py + 120)]), Color(0.92, 0.2, 0.3, k))
				c.draw_circle(Vector2(dx, py), 22.0, Color(1, 1, 1, k))
			var votos := int(clampf((t - 40) / 130.0, 0.0, 1.0) * 1900000.0)
			_letreiro(c, cxe, chao, "VOTOS: %s" % _milhar(votos), Color("ffd23f"), k)
			if t > 172:
				_frase_final(c, dx, chao, t, "PRAIA GRANDE NO MAPA!", Color("ffd23f"), Color("e83e8c"), k)


## Letreiro de contador na faixa de cima que fica visível com o zoom da cena.
static func _letreiro(c: CanvasItem, cx: float, chao: float, txt: String, cor: Color, k: float) -> void:
	var r := Rect2(cx - 260, chao - 404, 520, 58)
	c.draw_rect(r.grow(5), Color(0.05, 0.04, 0.1, 0.9 * k))
	c.draw_rect(r, Color(0.12, 0.08, 0.2, 0.9 * k))
	var cor2 := cor
	cor2.a = k
	Desenho.texto(c, r.get_center() + Vector2(0, 12), txt, 22, cor2, Color(0, 0, 0, k), 5)


## Frase final grande em cima do rival, entrando com zoom.
static func _frase_final(c: CanvasItem, x: float, chao: float, t: int, txt: String, cor: Color, borda: Color, k: float) -> void:
	var q := clampf((t - 172) / 10.0, 0.0, 1.0)
	var tam := lerpf(150.0, 84.0, q) * (0.46 if txt.length() > 12 else 0.55) * (0.72 if txt.length() > 17 else 1.0)
	var cor2 := cor
	cor2.a = k
	var b2 := borda
	b2.a = k
	var larg := clampf(txt.length() * tam * 0.9 + 60.0, 360.0, 760.0)
	x = clampf(x, 250.0 + larg / 2.0, 1030.0 - larg / 2.0)
	c.draw_rect(Rect2(x - larg / 2.0, chao - 250, larg, 110), Color(0.03, 0.02, 0.08, 0.75 * k))
	Desenho.texto(c, Vector2(x, chao - 172), txt, int(tam), cor2, b2, 8)


static func _milhar(n: int) -> String:
	var txt := str(n)
	var fmt := ""
	for i in txt.length():
		if i > 0 and (txt.length() - i) % 3 == 0:
			fmt += "."
		fmt += txt[i]
	return fmt


static func _meia_lua(centro: Vector2, r: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 13:
		var a := lerpf(PI, TAU, i / 12.0)
		pts.append(centro + Vector2(cos(a), sin(a)) * r)
	return pts


## Moto do comboio (com o piloto de capacete verde e amarelo).
static func _moto(c: CanvasItem, pos: Vector2, dir: float, t: int, esc: float, k: float) -> void:
	c.draw_set_transform(pos, 0.0, Vector2(dir, 1.0) * 1.3 * esc)
	var roda := 14.0
	for rx in [-30.0, 30.0]:
		c.draw_circle(Vector2(rx, -roda), roda, Color(0.08, 0.06, 0.1, k))
		c.draw_circle(Vector2(rx, -roda), roda * 0.45, Color(0.6, 0.6, 0.65, k))
	c.draw_colored_polygon(PackedVector2Array([Vector2(-36, -24), Vector2(28, -30), Vector2(40, -20), Vector2(-28, -14)]), Color(0.12, 0.6, 0.33, k))
	c.draw_rect(Rect2(-16, -36, 30, 8), Color(1, 0.84, 0.25, k))
	c.draw_line(Vector2(26, -30), Vector2(34, -48), Color(0.2, 0.2, 0.25, k), 3.0)
	# piloto
	var bob := sin(t * 0.5) * 1.5
	c.draw_rect(Rect2(-10, -66 + bob, 18, 32), Color(0.95, 0.85, 0.2, k))
	c.draw_line(Vector2(4, -56 + bob), Vector2(30, -46), Color(0.95, 0.85, 0.2, k), 5.0)
	c.draw_circle(Vector2(0, -76 + bob), 12.0, Color(0.12, 0.6, 0.33, k))
	c.draw_rect(Rect2(2, -80 + bob, 10, 6), Color(0.2, 0.25, 0.35, k))
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


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
