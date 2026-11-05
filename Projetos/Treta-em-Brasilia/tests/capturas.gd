extends SceneTree
## Tira capturas de tela do título, da seleção e de momentos da luta (CPU x CPU).
## Rodar com tela (xvfb): godot --path . --fixed-fps 60 --script res://tests/capturas.gd -- pasta_saida

var raiz: Node2D
var quadro := 0
var saida := "res://docs/capturas"
var etapa := 0
var luta: Luta
var plano := [
	["titulo", 40], ["ajuda", 20], ["selecao", 40], ["meme", 18], ["resultado", 30],
	["luta_inicio", 70], ["luta_lute", 30], ["luta_1", 150], ["luta_2", 200], ["luta_3", 300], ["luta_4", 400], ["luta_5", 500],
]


func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		saida = args[0]
	DirAccess.make_dir_recursive_absolute(saida)
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	_montar("titulo")


func _montar(nome: String) -> void:
	for f in raiz.get_children():
		f.queue_free()
	if nome == "titulo":
		raiz.add_child(Telas.Titulo.new())
	elif nome == "meme":
		var s2 := Telas.Selecao.new()
		s2.modo = 1
		s2.cursor = [3, 0]
		raiz.add_child(s2)
		s2._confirmar(0)
	elif nome == "ajuda":
		raiz.add_child(Telas.ComoJogar.new())
	elif nome == "resultado":
		var r := Telas.Resultado.new()
		r.dados = Personagens.por_indice(4)
		r.perdedor = Personagens.por_indice(1)
		r.quem = "Jogador 1"
		raiz.add_child(r)
	elif nome == "selecao":
		var s := Telas.Selecao.new()
		s.modo = 1
		s.cursor = [0, 2]
		raiz.add_child(s)
	elif nome == "luta_inicio":
		luta = Luta.new()
		luta.nivel_cpu = 0.7
		luta.configurar(Personagens.por_indice(int(OS.get_environment("P1") if OS.get_environment("P1") != "" else "0")), Personagens.por_indice(int(OS.get_environment("P2") if OS.get_environment("P2") != "" else "1")), false, true)
		raiz.add_child(luta)


func _process(_d: float) -> bool:
	quadro += 1
	if etapa >= plano.size():
		quit()
		return true
	var item: Array = plano[etapa]
	if quadro >= int(item[1]):
		var img := root.get_texture().get_image()
		img.resize(img.get_width() * 3, img.get_height() * 3, Image.INTERPOLATE_NEAREST)
		img.save_png("%s/%02d_%s.png" % [saida, etapa, item[0]])
		quadro = 0
		etapa += 1
		if etapa < plano.size():
			var prox: String = plano[etapa][0]
			if prox in ["ajuda", "selecao", "meme", "resultado", "luta_inicio"]:
				_montar(prox)
	return false
