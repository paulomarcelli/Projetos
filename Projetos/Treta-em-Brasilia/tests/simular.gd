extends SceneTree
## Teste: várias partidas CPU x CPU até o fim, com todos os personagens.
## Rodar: godot --headless --fixed-fps 60 --path . --script res://tests/simular.gd

var partidas := []
var atual: Luta
var indice := 0
var quadros := 0
var resultados := []
var erros := 0


func _initialize() -> void:
	var n := Personagens.LISTA.size()
	for i in n:
		partidas.append([i, (i + 1) % n])
		partidas.append([i, (i + 3) % n])
	_proxima()


func _proxima() -> void:
	if atual != null:
		atual.queue_free()
	if indice >= partidas.size():
		_fim()
		return
	var par: Array = partidas[indice]
	atual = Luta.new()
	atual.nivel_cpu = 0.6
	atual.configurar(Personagens.por_indice(par[0]), Personagens.por_indice(par[1]), false, true)
	atual.terminou.connect(_terminou)
	root.add_child(atual)
	quadros = 0


func _terminou(v: int) -> void:
	var par: Array = partidas[indice]
	var a: String = Personagens.por_indice(par[0])["nome"]
	var b: String = Personagens.por_indice(par[1])["nome"]
	var golpes := "rounds %d x %d" % [atual.vitorias[0], atual.vitorias[1]]
	resultados.append("%s x %s -> venceu %s (%s, %d quadros)" % [a, b, a if v == 0 else b, golpes, quadros])
	indice += 1
	_proxima.call_deferred()


func _process(_delta: float) -> bool:
	quadros += 1
	if quadros > 60 * 60 * 6:
		resultados.append("TRAVOU: partida %d não terminou" % indice)
		erros += 1
		indice += 1
		_proxima()
	return false


func _fim() -> void:
	for r in resultados:
		print(r)
	print("PARTIDAS: %d  ERROS: %d" % [resultados.size(), erros])
	quit(1 if erros > 0 else 0)
