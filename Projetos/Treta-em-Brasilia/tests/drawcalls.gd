extends SceneTree
## Quantas chamadas de desenho cada camada da luta gera (esconde uma de cada vez).
var raiz: Node2D
var luta: Luta
var q := 0
var camadas: Array = []
var idx := -1
var base := 0.0
var acum := 0.0
var n := 0


func _initialize() -> void:
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	Config.toque = 1
	luta = Luta.new()
	luta.cenario = OS.get_environment("CEN") if OS.get_environment("CEN") != "" else "praca"
	luta.configurar(Personagens.por_indice(0), Personagens.por_indice(3), false, false)
	raiz.add_child(luta)


func _todas(n0: Node, out: Array) -> void:
	for c in n0.get_children():
		if c is CanvasItem:
			out.append(c)
		_todas(c, out)


func _process(_d: float) -> bool:
	q += 1
	if q == 150:
		_todas(luta, camadas)
		camadas = camadas.filter(func(c): return not (c is Node2D and c.get_child_count() > 0 and not (c is Lutador)))
	if q > 150:
		var dc := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
		acum += dc
		n += 1
		if n == 20:
			var media := acum / n
			if idx == -1:
				base = media
				print("TOTAL: %d chamadas" % media)
			else:
				var c: CanvasItem = camadas[idx]
				var nome: String = str(c.get_class()) + ":" + (str((c as Camada).desenhar.get_method()) if c is Camada else String(c.name))
				print("  %-45s %d" % [nome, base - media])
				c.visible = true
			idx += 1
			if idx >= camadas.size():
				quit()
				return true
			camadas[idx].visible = false
			acum = 0.0
			n = 0
	return false
