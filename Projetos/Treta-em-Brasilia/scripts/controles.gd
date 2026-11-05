extends Node
## Cria os comandos dos dois jogadores no início do jogo (teclado e controle).
## Usa a posição física das teclas, então funciona igual em teclado ABNT2 e americano.

const TECLAS := {
	"p1_esq": [KEY_A], "p1_dir": [KEY_D], "p1_cima": [KEY_W], "p1_baixo": [KEY_S],
	"p1_soco": [KEY_F], "p1_chute": [KEY_G], "p1_especial": [KEY_H], "p1_provocar": [KEY_R],
	"p2_esq": [KEY_LEFT], "p2_dir": [KEY_RIGHT], "p2_cima": [KEY_UP], "p2_baixo": [KEY_DOWN],
	"p2_soco": [KEY_KP_1, KEY_COMMA], "p2_chute": [KEY_KP_2, KEY_PERIOD], "p2_especial": [KEY_KP_3, KEY_SLASH], "p2_provocar": [KEY_KP_4, KEY_SEMICOLON],
}

# Controle: direcional + X/Quadrado soco, A/X chute, B/Bola especial.
const BOTOES := {
	"esq": JOY_BUTTON_DPAD_LEFT, "dir": JOY_BUTTON_DPAD_RIGHT, "cima": JOY_BUTTON_DPAD_UP, "baixo": JOY_BUTTON_DPAD_DOWN,
	"soco": JOY_BUTTON_X, "chute": JOY_BUTTON_A, "especial": JOY_BUTTON_B, "provocar": JOY_BUTTON_Y,
}


func _ready() -> void:
	for acao in TECLAS:
		if not InputMap.has_action(acao):
			InputMap.add_action(acao)
		for tecla in TECLAS[acao]:
			var ev := InputEventKey.new()
			ev.physical_keycode = tecla
			InputMap.action_add_event(acao, ev)
	for jogador in [0, 1]:
		for nome in BOTOES:
			var acao := "p%d_%s" % [jogador + 1, nome]
			var ev := InputEventJoypadButton.new()
			ev.device = jogador
			ev.button_index = BOTOES[nome]
			InputMap.action_add_event(acao, ev)
		# Analógico esquerdo também anda
		for par in [["esq", JOY_AXIS_LEFT_X, -1.0], ["dir", JOY_AXIS_LEFT_X, 1.0], ["cima", JOY_AXIS_LEFT_Y, -1.0], ["baixo", JOY_AXIS_LEFT_Y, 1.0]]:
			var ev := InputEventJoypadMotion.new()
			ev.device = jogador
			ev.axis = par[1]
			ev.axis_value = par[2]
			InputMap.action_add_event("p%d_%s" % [jogador + 1, par[0]], ev)
