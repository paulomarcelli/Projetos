## Entrada de um jogador humano: lê as ações "pN_*" criadas em controles.gd.
class_name EntradaHumana
var prefixo := "p1_"

func _init(numero: int) -> void:
	prefixo = "p%d_" % numero

func ler() -> Dictionary:
	return {
		"esq": Input.is_action_pressed(prefixo + "esq"),
		"dir": Input.is_action_pressed(prefixo + "dir"),
		"cima": Input.is_action_pressed(prefixo + "cima"),
		"baixo": Input.is_action_pressed(prefixo + "baixo"),
		"soco": Input.is_action_pressed(prefixo + "soco"),
		"chute": Input.is_action_pressed(prefixo + "chute"),
		"especial": Input.is_action_pressed(prefixo + "especial"),
		"provocar": Input.is_action_pressed(prefixo + "provocar"),
	}
