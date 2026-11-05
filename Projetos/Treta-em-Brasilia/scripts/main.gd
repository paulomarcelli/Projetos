extends Node2D
## Troca as telas: título → seleção → luta → resultado.

var modo := 1
var escolha := [0, 1]
var tela: Node


func _ready() -> void:
	randomize()
	# O jogo pensa em 1280x720, mas desenha numa tela de 480x270 ampliada sem suavização:
	# é isso que dá o visual de pixel dos fliperamas de 16 bits.
	scale = Vector2.ONE * Desenho.ESCALA
	_titulo()


func _trocar(n: Node) -> void:
	if tela != null:
		tela.queue_free()
	tela = n
	add_child(n)


func _titulo() -> void:
	var t := Telas.Titulo.new()
	t.escolheu.connect(func(m: int) -> void:
		if m == 3:
			_como_jogar()
			return
		modo = m
		_selecao())
	_trocar(t)


func _como_jogar() -> void:
	var c := Telas.ComoJogar.new()
	c.voltar.connect(_titulo)
	_trocar(c)


func _selecao() -> void:
	var s := Telas.Selecao.new()
	s.modo = modo
	s.cursor = escolha.duplicate()
	s.pronto.connect(func(a: int, b: int) -> void:
		escolha = [a, b]
		_luta())
	s.voltar.connect(_titulo)
	_trocar(s)


func _luta() -> void:
	var l := Luta.new()
	l.configurar(Personagens.por_indice(escolha[0]), Personagens.por_indice(escolha[1]), modo == 2)
	l.terminou.connect(_resultado)
	_trocar(l)


func _resultado(vencedor: int) -> void:
	var r := Telas.Resultado.new()
	r.dados = Personagens.por_indice(escolha[vencedor])
	r.perdedor = Personagens.por_indice(escolha[1 - vencedor])
	r.quem = "Jogador %d" % (vencedor + 1) if (modo == 2 or vencedor == 0) else "CPU"
	r.revanche.connect(_luta)
	r.trocar.connect(_selecao)
	_trocar(r)
