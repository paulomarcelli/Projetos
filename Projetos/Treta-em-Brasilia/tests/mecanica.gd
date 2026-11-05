extends SceneTree
## Testes da mecânica de luta, sem tela.
## Rodar: godot --headless --path . --script res://tests/mecanica.gd

var falhas := 0


class Fake:
	var e := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false, "especial": false}
	func ler() -> Dictionary:
		return e.duplicate()
	func soltar() -> void:
		for k in e:
			e[k] = false


func ok(cond: bool, msg: String) -> void:
	print(("PASS " if cond else "FAIL ") + msg)
	if not cond:
		falhas += 1


func novo(x: float, lado: int) -> Array:
	var l := Lutador.new()
	root.add_child(l)
	l.configurar(Personagens.por_indice(0), x, lado)
	var f := Fake.new()
	l.entrada = f
	return [l, f]


func _initialize() -> void:
	var a: Array = novo(500, 1)
	var b: Array = novo(600, -1)
	var A: Lutador = a[0]
	var B: Lutador = b[0]
	var fa: Fake = a[1]
	var fb: Fake = b[1]
	A.oponente = B
	B.oponente = A

	# soco acerta quem está parado
	fa.e["soco"] = true
	var acertou := false
	for i in 12:
		A.passo()
		B.passo()
		fa.soltar()
		var c = A.caixa_ataque()
		if c != null and (c as Rect2).intersects(B.hurtbox()):
			acertou = B.receber(A.golpe, A.position.x) == "acerto"
			A.ja_acertou = true
	ok(acertou and B.vida < B.vida_max, "soco acerta quem está parado")

	# defesa: segurando para trás (B olha para a esquerda, trás = direita)
	for i in 30:
		A.passo()
		B.passo()
	fb.e["dir"] = true
	B.passo()
	var r := B.receber(Lutador.GOLPES["soco"], A.position.x)
	ok(r == "bloqueio", "segurar para trás defende golpe alto")
	for i in 20:
		B.passo()
	# rasteira (baixo) não é defendida em pé
	r = B.receber(Lutador.GOLPES["rasteira"], A.position.x)
	ok(r == "derrubou", "rasteira derruba quem defende em pé")
	for i in 80:
		B.passo()
	fb.e["baixo"] = true
	B.passo()
	r = B.receber(Lutador.GOLPES["rasteira"], A.position.x)
	ok(r == "bloqueio", "agachado e para trás defende rasteira")
	for i in 20:
		B.passo()
	r = B.receber(Lutador.GOLPES["voadora"], A.position.x)
	ok(r == "acerto" or r == "derrubou", "voadora pega quem defende agachado")
	fb.soltar()
	for i in 80:
		B.passo()

	# comando ↓↘→ + Soco solta projétil (A olha para a direita)
	var soltou := [false]
	A.soltou_projetil.connect(func(_l, _s): soltou[0] = true)
	for i in 40:
		A.passo()
	for d in [["baixo"], ["baixo", "dir"], ["dir"]]:
		fa.soltar()
		for k in d:
			fa.e[k] = true
		A.passo()
		A.passo()
	fa.e["soco"] = true
	for i in 20:
		A.passo()
	fa.soltar()
	ok(soltou[0], "↓↘→ + Soco solta o projétil")

	# →↓↘ + Soco é o gancho
	for i in 40:
		A.passo()
	A.tem_projetil = false
	for d in [["dir"], ["baixo"], ["baixo", "dir"]]:
		fa.soltar()
		for k in d:
			fa.e[k] = true
		A.passo()
	fa.e["soco"] = true
	A.passo()
	ok(A.golpe_nome == "gancho", "→↓↘ + Soco faz o gancho")
	fa.soltar()
	for i in 80:
		A.passo()

	# super só com a barra cheia
	fa.e["baixo"] = true
	fa.e["especial"] = true
	A.passo()
	ok(A.golpe_nome != "super", "sem barra cheia não sai super")
	fa.soltar()
	for i in 60:
		A.passo()
	A.barra = 100.0
	fa.e["baixo"] = true
	fa.e["especial"] = true
	A.passo()
	ok(A.golpe_nome == "super" and A.barra == 0.0, "barra cheia + baixo + Especial = super")
	fa.soltar()

	# nocaute
	B.vida = 10.0
	for i in 80:
		B.passo()
	r = B.receber({"dano": 50.0, "nivel": "medio"}, A.position.x)
	ok(r == "nocaute" and B.estado == Lutador.E.NOCAUTE, "vida zerada = nocaute")

	print("FALHAS: %d" % falhas)
	quit(1 if falhas > 0 else 0)
