class_name PlayerBindings
extends RefCounted
## Teclas e botões padrão dos dois jogadores e leitura da entrada de cada quadro como bitmask.
## As ações ficam no InputMap, então a Fase 3 pode permitir remapear sem mudar o resto.

const ACTIONS := ["up", "down", "left", "right", "light", "medium", "heavy"]
const BITS := {
	"up": InputBits.UP, "down": InputBits.DOWN, "left": InputBits.LEFT, "right": InputBits.RIGHT,
	"light": InputBits.LIGHT, "medium": InputBits.MEDIUM, "heavy": InputBits.HEAVY,
}
const KEYS := [
	{"up": KEY_W, "down": KEY_S, "left": KEY_A, "right": KEY_D, "light": KEY_J, "medium": KEY_K, "heavy": KEY_L},
	{"up": KEY_UP, "down": KEY_DOWN, "left": KEY_LEFT, "right": KEY_RIGHT,
		"light": KEY_KP_1, "medium": KEY_KP_2, "heavy": KEY_KP_3},
]
## Teclas extras do jogador 2 para notebooks sem teclado numérico.
const KEYS_ALT_P2 := {"light": KEY_COMMA, "medium": KEY_PERIOD, "heavy": KEY_SLASH}
const PAD_BUTTONS := {
	"up": JOY_BUTTON_DPAD_UP, "down": JOY_BUTTON_DPAD_DOWN, "left": JOY_BUTTON_DPAD_LEFT,
	"right": JOY_BUTTON_DPAD_RIGHT, "light": JOY_BUTTON_X, "medium": JOY_BUTTON_Y, "heavy": JOY_BUTTON_B,
}
## Rótulos para a tela de controles (o controle segue o padrão Xbox; no PlayStation: Quadrado, Triângulo, Círculo).
const LABELS := [
	"Jogador 1 — mover: W A S D · leve: J · médio: K · forte: L · controle 1",
	"Jogador 2 — mover: setas · leve: 1 · médio: 2 · forte: 3 (teclado numérico) ou , . / · controle 2",
]


static func action(player: int, name: String) -> StringName:
	return StringName("p%d_%s" % [player + 1, name])


static func ensure_defaults() -> void:
	for p in 2:
		for name in ACTIONS:
			var act := action(p, name)
			if InputMap.has_action(act):
				continue
			InputMap.add_action(act, 0.5)
			_add_key(act, KEYS[p][name])
			if p == 1 and KEYS_ALT_P2.has(name):
				_add_key(act, KEYS_ALT_P2[name])
			var pad := InputEventJoypadButton.new()
			pad.device = p
			pad.button_index = PAD_BUTTONS[name]
			InputMap.action_add_event(act, pad)
			if name in ["up", "down", "left", "right"]:
				var axis := InputEventJoypadMotion.new()
				axis.device = p
				axis.axis = JOY_AXIS_LEFT_Y if name in ["up", "down"] else JOY_AXIS_LEFT_X
				axis.axis_value = -1.0 if name in ["up", "left"] else 1.0
				InputMap.action_add_event(act, axis)
	if not InputMap.has_action(&"pause"):
		InputMap.add_action(&"pause")
		_add_key(&"pause", KEY_ESCAPE)
		_add_key(&"pause", KEY_P)
		for p in 2:
			var start := InputEventJoypadButton.new()
			start.device = p
			start.button_index = JOY_BUTTON_START
			InputMap.action_add_event(&"pause", start)


static func read(player: int) -> int:
	var bits := 0
	for name in ACTIONS:
		if Input.is_action_pressed(action(player, name)):
			bits |= BITS[name]
	return bits


static func _add_key(act: StringName, keycode: Key) -> void:
	var ev := InputEventKey.new()
	ev.physical_keycode = keycode
	InputMap.action_add_event(act, ev)
