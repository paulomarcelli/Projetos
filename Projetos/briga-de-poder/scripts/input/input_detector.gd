extends Node
## Descobre qual dispositivo o jogador está usando agora (teclado/mouse, controle ou toque)
## e avisa a interface, que troca dicas de botões e mostra/esconde os controles de toque.

signal device_changed(device: Device)

enum Device { KEYBOARD_MOUSE, GAMEPAD, TOUCH }

const LABELS := {
	Device.KEYBOARD_MOUSE: "Teclado",
	Device.GAMEPAD: "Controle",
	Device.TOUCH: "Toque",
}

## Movimentos de analógico abaixo disto são ruído do controle, não intenção do jogador.
const AXIS_DEADZONE := 0.35

var current: Device = Device.KEYBOARD_MOUSE


func _ready() -> void:
	if PlatformInfo.prefers_touch_layout():
		current = Device.TOUCH


func _input(event: InputEvent) -> void:
	var device := classify(event)
	if device >= 0 and device != current:
		current = device
		device_changed.emit(current)


## Retorna o dispositivo do evento, ou -1 se o evento não indica troca (ex.: mouse emulado pelo toque).
func classify(event: InputEvent) -> int:
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		return Device.TOUCH
	if event is InputEventJoypadButton:
		return Device.GAMEPAD
	if event is InputEventJoypadMotion:
		return Device.GAMEPAD if absf(event.axis_value) > AXIS_DEADZONE else -1
	if event is InputEventMouse:
		# O Godot gera cliques de mouse a partir do toque (emulate_mouse_from_touch).
		# Esses eventos têm device == DEVICE_ID_EMULATION e não significam troca para mouse.
		return -1 if event.device == InputEvent.DEVICE_ID_EMULATION else Device.KEYBOARD_MOUSE
	if event is InputEventKey:
		return Device.KEYBOARD_MOUSE
	return -1


func current_label() -> String:
	return LABELS[current]
