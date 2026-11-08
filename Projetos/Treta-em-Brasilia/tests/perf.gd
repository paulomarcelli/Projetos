extends SceneTree
## Custo de CPU de cada tela, quadro a quadro (tempo real entre quadros, com --fixed-fps 60:
## cada quadro faz exatamente 1 passo de física). Sem placa de vídeo: --headless.
##   godot --headless --path . --fixed-fps 60 --script res://tests/perf.gd
## Imprime a média e o pior caso (p95) em ms. Para 60 fps num celular, a média tem de ficar
## bem abaixo de 4 ms aqui (o celular com WebAssembly roda umas 4 vezes mais devagar).
var raiz: Node2D
var fase := 0
var q := 0
var no: Node
var t_ant := 0
var amostras: Array[float] = []
var telas := []


func _initialize() -> void:
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	telas = [
		["titulo", func(): return Telas.Titulo.new()],
		["selecao", func(): return Telas.Selecao.new()],
		["cenario", func(): return Telas.SelecaoCenario.new()],
		["creditos", func(): return Telas.Creditos.new()],
		["luta_usp", func(): return _luta("usp", 0, 1)],
		["luta_praca", func(): return _luta("praca", 3, 2)],
		["luta_paulista", func(): return _luta("paulista", 5, 6)],
		["luta_casa_branca", func(): return _luta("casa_branca", 9, 10)],
	]


func _luta(cen: String, a: int, b: int) -> Node:
	var l := Luta.new()
	l.cenario = cen
	l.configurar(Personagens.por_indice(a), Personagens.por_indice(b), true, true)
	return l


func _process(_d: float) -> bool:
	var agora := Time.get_ticks_usec()
	if fase >= telas.size():
		quit()
		return true
	if q == 0:
		if no != null:
			no.queue_free()
		no = telas[fase][1].call()
		raiz.add_child(no)
		amostras.clear()
	elif q > 30:
		amostras.append((agora - t_ant) / 1000.0)
	t_ant = agora
	q += 1
	if q > 630:
		amostras.sort()
		var soma := 0.0
		for a in amostras:
			soma += a
		print("%-17s média %5.2f ms · p95 %5.2f ms · pior %6.2f ms" % [telas[fase][0], soma / amostras.size(), amostras[int(amostras.size() * 0.95)], amostras[-1]])
		fase += 1
		q = 0
	return false
