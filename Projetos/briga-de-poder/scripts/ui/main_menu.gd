extends Control
## Menu inicial. Os botões são gerados a partir de ITEMS para que cada opção tenha um único
## lugar onde se define texto, dica e destino. Opções de fases futuras aparecem desativadas
## e marcadas como "em breve", com a fase em que chegam (nenhum botão decorativo).

const ITEMS := [
	{"id": "play", "label": "JOGAR", "hint": "Combate local 1 contra 1.", "phase": 2},
	{"id": "multiplayer", "label": "MULTIPLAYER", "hint": "Partidas online pelo navegador.", "phase": 6},
	{"id": "training", "label": "TREINAMENTO", "hint": "Treino livre contra boneco e IA.", "phase": 4},
	{"id": "characters", "label": "PERSONAGENS", "hint": "Elenco, atributos e golpes.", "phase": 5},
	{"id": "settings", "label": "CONFIGURAÇÕES", "hint": "Volume, tela, qualidade e efeitos.", "scene": "settings"},
	{"id": "credits", "label": "CRÉDITOS", "hint": "Equipe, fontes e licenças.", "scene": "credits"},
	{"id": "quit", "label": "SAIR", "hint": "Fechar o jogo.", "action": "quit"},
]

const DESKTOP := {"columns": 1, "button_size": Vector2(620, 0), "font": 44, "title": 128}
const TOUCH := {"columns": 2, "button_size": Vector2(620, 128), "font": 52, "title": 104}

@onready var _title: Label = %Title
@onready var _buttons: GridContainer = %Buttons
@onready var _hint: Label = %Hint
@onready var _device: Label = %Device
@onready var _version: Label = %Version
@onready var _background: ColorRect = %Background

var buttons: Dictionary = {}  # id -> Button (lido pelos testes)


func _ready() -> void:
	GameManager.set_state(GameManager.State.MENU)
	_version.text = "v%s · Fase 1 (fundação)" % ProjectSettings.get_setting("application/config/version")
	_build_buttons()
	_apply_layout()
	_update_device_label()
	_apply_motion()
	InputDetector.device_changed.connect(_on_device_changed)
	Settings.changed.connect(_on_setting_changed)
	resized.connect(_update_background_aspect)
	_update_background_aspect()
	if InputDetector.current != InputDetector.Device.TOUCH:
		_focus_first()


func _build_buttons() -> void:
	for item in ITEMS:
		if item.get("action") == "quit" and not PlatformInfo.can_quit():
			continue  # no navegador não existe "fechar o jogo"; quem fecha é a aba
		var button := Button.new()
		button.name = item.id.capitalize().replace(" ", "") + "Button"
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var available: bool = not item.has("phase")
		button.disabled = not available
		button.text = item.label if available else "%s · EM BREVE" % item.label
		button.tooltip_text = _hint_for(item)
		button.focus_entered.connect(_show_hint.bind(item))
		button.mouse_entered.connect(_on_button_hovered.bind(button, item))
		if available:
			button.pressed.connect(_on_item_pressed.bind(item))
		else:
			button.gui_input.connect(_on_disabled_input.bind(item))
		_buttons.add_child(button)
		buttons[item.id] = button


func _hint_for(item: Dictionary) -> String:
	if item.has("phase"):
		return "%s Ainda não disponível: chega na Fase %d do desenvolvimento." % [item.hint, item.phase]
	return item.hint


func _on_item_pressed(item: Dictionary) -> void:
	AudioManager.play_ui("click")
	if item.has("scene"):
		GameManager.go_to(item.scene)
	elif item.get("action") == "quit":
		get_tree().quit()


func _on_disabled_input(event: InputEvent, item: Dictionary) -> void:
	var tapped: bool = event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT
	if tapped or event.is_action_pressed("ui_accept"):
		AudioManager.play_ui("denied")
		_show_hint(item)


func _on_button_hovered(button: Button, item: Dictionary) -> void:
	if not button.disabled:
		AudioManager.play_ui("hover")
	_show_hint(item)


func _show_hint(item: Dictionary) -> void:
	_hint.text = _hint_for(item)


func _focus_first() -> void:
	for button in _buttons.get_children():
		if not button.disabled:
			button.grab_focus()
			return


func _unhandled_input(event: InputEvent) -> void:
	# Teclado/controle sem nada focado (ex.: depois de usar o mouse): a primeira seta foca o menu.
	if get_viewport().gui_get_focus_owner() == null:
		for action in ["ui_up", "ui_down", "ui_left", "ui_right", "ui_focus_next"]:
			if event.is_action_pressed(action):
				_focus_first()
				get_viewport().set_input_as_handled()
				return


## Layouts distintos: no toque, botões maiores em duas colunas para caberem na tela deitada
## do celular com área de toque confortável; no desktop, coluna única navegável por setas.
func _apply_layout() -> void:
	var touch := InputDetector.current == InputDetector.Device.TOUCH
	var layout: Dictionary = TOUCH if touch else DESKTOP
	_buttons.columns = layout.columns
	_title.add_theme_font_size_override("font_size", layout.title)
	for button in _buttons.get_children():
		button.custom_minimum_size = layout.button_size
		button.add_theme_font_size_override("font_size", layout.font)


func _on_device_changed(_device_id: int) -> void:
	_apply_layout()
	_update_device_label()
	if InputDetector.current != InputDetector.Device.TOUCH and get_viewport().gui_get_focus_owner() == null:
		_focus_first()


func _update_device_label() -> void:
	_device.text = "Entrada: %s" % InputDetector.current_label()


func _on_setting_changed(key: String, _value: Variant) -> void:
	if key == "reduce_effects":
		_apply_motion()


func _apply_motion() -> void:
	var mat := _background.material as ShaderMaterial
	mat.set_shader_parameter("motion", 0.0 if Settings.get_value("reduce_effects") else 1.0)


func _update_background_aspect() -> void:
	if size.y > 0.0:
		(_background.material as ShaderMaterial).set_shader_parameter("aspect", size.x / size.y)
