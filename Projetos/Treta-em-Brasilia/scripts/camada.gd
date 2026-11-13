class_name Camada
extends Node2D
## Nó que só desenha: quem o cria passa a função de desenho (cenário, HUD, efeitos).

var desenhar: Callable

## Medição (tests/perf.gd): tempo gasto em cada função de desenho, em microssegundos.
static var medir := false
static var tempos := {}


func _draw() -> void:
	if not desenhar.is_valid():
		return
	if not medir:
		desenhar.call(self)
		return
	var t0 := Time.get_ticks_usec()
	desenhar.call(self)
	var k := str(desenhar.get_method())
	tempos[k] = tempos.get(k, 0) + Time.get_ticks_usec() - t0
