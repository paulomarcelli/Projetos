extends Node
## Estado global do jogo e reações ao ambiente: perda de foco do navegador (pausa) e
## orientação do celular (pede para girar quando está em retrato).

signal state_changed(state: State)
signal focus_changed(focused: bool)

enum State { MENU, CHARACTER_SELECT, FIGHT, PAUSED }

const SCENES := {
	"main_menu": "res://scenes/menus/main_menu.tscn",
	"settings": "res://scenes/menus/settings_menu.tscn",
	"credits": "res://scenes/menus/credits.tscn",
	"fight": "res://scenes/fighting/fight.tscn",
}

var state: State = State.MENU
var app_focused := true

var _rotate_layer: CanvasLayer


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_rotate_overlay()
	PlatformInfo.orientation_changed.connect(func(_p): _update_rotate_overlay())
	_update_rotate_overlay()


func go_to(scene_key: String) -> void:
	SceneManager.change_scene(SCENES[scene_key])


func set_state(new_state: State) -> void:
	if new_state == state:
		return
	state = new_state
	state_changed.emit(state)


## Aba em segundo plano, app minimizado ou tela bloqueada: a luta pausa sozinha
## (o Godot Web envia FOCUS_OUT quando a página perde o foco).
func _notification(what: int) -> void:
	match what:
		NOTIFICATION_APPLICATION_FOCUS_OUT, NOTIFICATION_APPLICATION_PAUSED:
			_set_focus(false)
		NOTIFICATION_APPLICATION_FOCUS_IN, NOTIFICATION_APPLICATION_RESUMED:
			_set_focus(true)


func _set_focus(focused: bool) -> void:
	if focused == app_focused:
		return
	app_focused = focused
	focus_changed.emit(focused)
	if not focused and state == State.FIGHT:
		set_state(State.PAUSED)


func _build_rotate_overlay() -> void:
	_rotate_layer = CanvasLayer.new()
	_rotate_layer.layer = 100
	add_child(_rotate_layer)
	var bg := ColorRect.new()
	bg.color = Color("0d0a19")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	_rotate_layer.add_child(bg)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 32)
	bg.add_child(box)
	var icon := TextureRect.new()
	icon.texture = preload("res://assets/ui/rotate_device.svg")
	icon.custom_minimum_size = Vector2(480, 400)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	box.add_child(icon)
	var msg := Label.new()
	msg.text = "Gire o aparelho\npara jogar na horizontal"
	msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	msg.add_theme_font_size_override("font_size", 96)
	box.add_child(msg)


func _update_rotate_overlay() -> void:
	# Só faz sentido no celular: no computador, uma janela estreita não é "retrato".
	var show := PlatformInfo.is_mobile and PlatformInfo.is_portrait()
	_rotate_layer.visible = show
	get_tree().paused = show
