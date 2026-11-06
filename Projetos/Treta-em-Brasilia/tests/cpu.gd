extends SceneTree
## Custo de CPU por quadro de uma luta CPU x CPU (lógica + gravação do desenho), sem limite de FPS.
var raiz: Node2D
var luta: Luta
var q := 0
var t0 := 0


func _initialize() -> void:
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	luta = Luta.new()
	luta.configurar(Personagens.por_indice(0), Personagens.por_indice(3), false, true)
	raiz.add_child(luta)


func _process(_d: float) -> bool:
	q += 1
	if q == 100:
		t0 = Time.get_ticks_usec()
	if q == 700:
		print("ms por quadro: %.2f" % ((Time.get_ticks_usec() - t0) / 600.0 / 1000.0))
		quit()
	return false
