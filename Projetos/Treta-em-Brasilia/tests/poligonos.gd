extends SceneTree
## Procura polígonos inválidos (o motor avisa "Invalid polygon data, triangulation failed"):
## deixa cada tela rodando por 10 s com renderização de verdade e marca no registro qual é a tela.
##   xvfb-run godot --path . --rendering-driver opengl3 --fixed-fps 60 --script res://tests/poligonos.gd
var raiz: Node2D
var fase := 0
var q := 0
var no: Node
var telas := []


func _initialize() -> void:
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	telas = [
		["titulo", func(): return Telas.Titulo.new()],
		["lutadores", func(): return Telas.Lutadores.new()],
		["online", func(): return Telas.Online.new()],
		["config", func(): return Telas.Configuracoes.new()],
		["como_jogar", func(): return Telas.ComoJogar.new()],
		["creditos", func(): return Telas.Creditos.new()],
		["selecao", func(): return Telas.Selecao.new()],
		["cenario", func(): return Telas.SelecaoCenario.new()],
	]


func _process(_d: float) -> bool:
	if fase >= telas.size():
		print("FIM")
		quit()
		return true
	if q == 0:
		if no != null:
			no.queue_free()
		no = telas[fase][1].call()
		raiz.add_child(no)
		printerr("TELA %s" % telas[fase][0])
	q += 1
	if q > int(OS.get_environment("QUADROS_TELA") if OS.get_environment("QUADROS_TELA") != "" else "600"):
		fase += 1
		q = 0
	return false
