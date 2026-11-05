class_name Camada
extends Node2D
## Nó que só desenha: quem o cria passa a função de desenho (cenário, HUD, efeitos).

var desenhar: Callable


func _draw() -> void:
	if desenhar.is_valid():
		desenhar.call(self)
