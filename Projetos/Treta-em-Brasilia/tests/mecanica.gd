extends SceneTree
## Testes da mecânica de luta, sem tela.
## Rodar: godot --headless --path . --script res://tests/mecanica.gd

var falhas := 0


class Fake:
	var e := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false, "especial": false, "super": false, "agarrar": false}
	func ler() -> Dictionary:
		return e.duplicate()
	func soltar() -> void:
		for k in e:
			e[k] = false


func ok(cond: bool, msg: String) -> void:
	print(("PASS " if cond else "FAIL ") + msg)
	if not cond:
		falhas += 1


func novo(x: float, lado: int, quem := 0) -> Array:
	var l := Lutador.new()
	root.add_child(l)
	l.configurar(Personagens.por_indice(quem), x, lado)
	var f := Fake.new()
	l.entrada = f
	return [l, f]


func esperar(ls: Array, n: int) -> void:
	for i in n:
		for l in ls:
			l.passo()


func _initialize() -> void:
	var a: Array = novo(500, 1)
	var b: Array = novo(600, -1, 1)
	var A: Lutador = a[0]
	var B: Lutador = b[0]
	var fa: Fake = a[1]
	var fb: Fake = b[1]
	A.oponente = B
	B.oponente = A
	var eventos := []
	A.evento.connect(func(_l, nome): eventos.append(nome))

	# caminhada: acelera ao iniciar e freia ao soltar a direção
	var x_inicio := A.position.x
	fa.e["dir"] = true
	A.passo()
	ok(A.position.x - x_inicio < 4.6 and A.position.x > x_inicio, "caminhada acelera em vez de atingir velocidade máxima de imediato")
	A.passo()
	var x_antes_frear := A.position.x
	fa.soltar()
	A.passo()
	var x_apos_frear := A.position.x
	A.passo()
	ok(x_apos_frear > x_antes_frear and A.position.x - x_apos_frear < x_apos_frear - x_antes_frear, "caminhada freia rapidamente ao soltar a direção")
	A.position.x = 500.0
	A.resetar_estado()

	# soco acerta quem está parado
	fa.e["soco"] = true
	var acertou := false
	for i in 12:
		A.passo()
		B.passo()
		fa.soltar()
		var c = A.caixa_ataque()
		if c != null and (c as Rect2).intersects(B.hurtbox()):
			A.registrar_acerto()
			acertou = B.receber(A.golpe, A.position.x, A) == "acerto"
	ok(acertou and B.vida < B.vida_max, "soco acerta quem está parado")
	esperar([A, B], 40)

	# frente + soco = soco forte; frente + chute = chute alto
	fa.e["dir"] = true
	fa.e["soco"] = true
	A.passo()
	ok(A.golpe_nome == "direto", "frente + Soco = soco forte")
	fa.soltar()
	esperar([A], 40)
	fa.e["dir"] = true
	fa.e["chute"] = true
	A.passo()
	ok(A.golpe_nome == "chute_alto", "frente + Chute = chute alto")
	fa.soltar()
	esperar([A, B], 40)

	# defesa normal: segurando para trás há tempo (B olha para a esquerda, trás = direita)
	fb.e["dir"] = true
	esperar([B], 12)
	var r := B.receber(Lutador.GOLPES["soco"], A.position.x, A)
	ok(r == "bloqueio", "segurar para trás defende golpe alto")
	esperar([B], 20)
	r = B.receber(Lutador.GOLPES["rasteira"], A.position.x)
	ok(r == "derrubou", "rasteira derruba quem defende em pé")
	fb.soltar()
	esperar([B], 80)
	fb.e["baixo"] = true
	fb.e["dir"] = true
	esperar([B], 12)
	r = B.receber(Lutador.GOLPES["rasteira"], A.position.x)
	ok(r == "bloqueio", "agachado e para trás defende rasteira")
	esperar([B], 20)
	r = B.receber(Lutador.GOLPES["voadora"], A.position.x)
	ok(r == "acerto" or r == "derrubou", "voadora pega quem defende agachado")
	fb.soltar()
	esperar([A, B], 80)

	# defesa perfeita: começa a segurar para trás bem na hora; o atacante perde o equilíbrio
	fa.e["dir"] = true
	fa.e["soco"] = true
	A.passo()
	fa.soltar()
	fb.e["dir"] = true
	B.passo()
	B.passo()
	r = B.receber(A.golpe, A.position.x, A)
	ok(r == "perfeita" and A.estado == Lutador.E.DESEQUILIBRADO, "defesa perfeita desequilibra o atacante")
	fb.soltar()
	esperar([A, B], 60)

	# contra-ataque: acertar quem está preparando um golpe dá mais dano
	fb.e["soco"] = true
	fb.e["esq"] = true
	B.passo()
	fb.soltar()
	var vida_antes := B.vida
	r = B.receber(Lutador.GOLPES["soco"], A.position.x, A)
	ok(B.ultimo_contra and vida_antes - B.vida > Lutador.GOLPES["soco"]["dano"], "acertar na preparação é contra-ataque")
	esperar([A, B], 60)

	# dash: dois toques para a frente
	fa.e["dir"] = true
	A.passo()
	fa.soltar()
	A.passo()
	fa.e["dir"] = true
	A.passo()
	ok(A.estado == Lutador.E.DASH, "dois toques para a frente = dash")
	fa.soltar()
	esperar([A], 30)
	A.position.x = 500.0
	B.position.x = 640.0
	esperar([A, B], 5)

	# comando ↓↘→ + Soco solta projétil (A olha para a direita)
	var tiros := [0]
	A.tiro.connect(func(_l, _s): tiros[0] += 1)
	for d in [["baixo"], ["baixo", "dir"], ["dir"]]:
		fa.soltar()
		for k in d:
			fa.e[k] = true
		A.passo()
		A.passo()
	fa.e["soco"] = true
	for i in 24:
		A.passo()
	fa.soltar()
	ok(tiros[0] == 1, "↓↘→ + Soco solta o projétil")
	esperar([A], 40)

	# especial em recarga: não sai de novo, avisa
	eventos.clear()
	fa.e["especial"] = true
	A.passo()
	fa.soltar()
	ok("recarga" in eventos, "especial em recarga só avisa")
	esperar([A], 80)

	# →↓↘ + Soco é o gancho
	A.recargas.clear()
	for d in [["dir"], ["baixo"], ["baixo", "dir"]]:
		fa.soltar()
		for k in d:
			fa.e[k] = true
		A.passo()
	fa.e["soco"] = true
	A.passo()
	ok(A.golpe_nome == "hab_cima", "→↓↘ + Soco faz o gancho")
	fa.soltar()
	esperar([A], 80)

	# SUPER sem energia: avisa e não sai nada
	eventos.clear()
	A.barra = 20.0
	fa.e["super"] = true
	A.passo()
	fa.soltar()
	ok("sem_energia" in eventos and A.estado != Lutador.E.ATACANDO, "SUPER sem energia avisa e não sai")
	esperar([A], 5)

	# meia barra = Superpower (gasta 50)
	A.barra = 60.0
	fa.e["super"] = true
	A.passo()
	fa.soltar()
	ok(A.golpe_nome == "hab_super" and is_equal_approx(A.barra, 10.0), "SUPER com meia barra = Superpower")
	esperar([A], 120)

	# barra cheia = Ultimate (gasta 100)
	A.barra = 100.0
	var ult := [false]
	A.disparou_ultimate.connect(func(_l): ult[0] = true)
	fa.e["super"] = true
	A.passo()
	fa.soltar()
	ok(A.golpe_nome == "ultimate" and A.barra == 0.0, "SUPER com barra cheia = Ultimate")
	esperar([A], 30)
	ok(ult[0], "o Ultimate dispara depois da preparação")
	esperar([A], 80)

	# agarrão: pega quem está parado e arremessa
	A.position.x = 560.0
	B.position.x = 640.0
	B.resetar_estado()
	A.resetar_estado()
	vida_antes = B.vida
	fa.e["agarrar"] = true
	var pegou := ""
	for i in 8:
		A.passo()
		B.passo()
		fa.soltar()
		var res := A.tentar_agarrar(B)
		if res != "":
			pegou = res
	ok(pegou == "agarrou" and B.estado == Lutador.E.AGARRADO, "agarrão pega quem está parado")
	esperar([A, B], 40)
	ok(B.vida < vida_antes and B.estado in [Lutador.E.CAIDO, Lutador.E.LEVANTANDO], "arremesso tira vida e derruba")
	esperar([A, B], 80)

	# Bloqueio Supremo: sem especiais por um tempo
	A.resetar_estado()
	A.receber({"dano": 10.0, "nivel": "medio", "ao_acertar": "bloqueio_supremo"}, B.position.x)
	esperar([A], 20)
	eventos.clear()
	fa.e["especial"] = true
	A.passo()
	fa.soltar()
	ok(A.bloqueado > 0 and "bloqueado" in eventos and A.estado != Lutador.E.ATACANDO, "Bloqueio Supremo impede especiais")

	# todas as habilidades de todos começam sem erro
	for i in Personagens.LISTA.size():
		var l: Lutador = novo(400, 1, i)[0]
		l.oponente = B
		for slot in ["projetil", "frente", "cima", "baixo", "tras"]:
			l.resetar_estado()
			l.position = Vector2(400, Lutador.CHAO)
			var saiu := l._usar_habilidade(slot)
			for k in 120:
				l.passo()
			ok(saiu, "%s: %s" % [l.dados["nome"], l.habilidade(slot)["nome"]])
		l.barra = 50.0
		l.resetar_estado()
		ok(l._usar_habilidade("super"), "%s: SUPER %s" % [l.dados["nome"], l.habilidade("super")["nome"]])
		for k in 140:
			l.passo()

	# nocaute
	B.resetar_estado()
	B.vida = 10.0
	esperar([B], 30)
	r = B.receber({"dano": 50.0, "nivel": "medio"}, A.position.x)
	ok(r == "nocaute" and B.estado == Lutador.E.NOCAUTE, "vida zerada = nocaute")

	print("FALHAS: %d" % falhas)
	quit(1 if falhas > 0 else 0)
