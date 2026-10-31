extends Control
## Tela de configurações. Cada controle lê e grava direto em Settings (salvo em user://).

const QUALITY_LABELS := {"auto": "Automática", "low": "Baixa (celular)", "high": "Alta"}

@onready var _master: HSlider = %MasterSlider
@onready var _music: HSlider = %MusicSlider
@onready var _sfx: HSlider = %SfxSlider
@onready var _fullscreen: CheckButton = %FullscreenCheck
@onready var _quality: OptionButton = %QualityOption
@onready var _reduce: CheckButton = %ReduceEffectsCheck
@onready var _touch_opacity: HSlider = %TouchOpacitySlider
@onready var _touch_scale: HSlider = %TouchScaleSlider
@onready var _quality_note: Label = %QualityNote

var _sliders: Dictionary = {}


func _ready() -> void:
	_sliders = {
		"master_volume": _master, "music_volume": _music, "sfx_volume": _sfx,
		"touch_opacity": _touch_opacity, "touch_scale": _touch_scale,
	}
	for key in _sliders:
		var slider: HSlider = _sliders[key]
		var limits: Vector2 = Settings.RANGES[key]
		slider.min_value = limits.x
		slider.max_value = limits.y
		slider.step = 0.05
		slider.value_changed.connect(_on_slider_changed.bind(key))
	for q in Settings.QUALITY_VALUES:
		_quality.add_item(QUALITY_LABELS[q])
	_quality.item_selected.connect(func(i): Settings.set_value("quality", Settings.QUALITY_VALUES[i]); _refresh())
	_fullscreen.toggled.connect(func(on): Settings.set_value("fullscreen", on))
	_reduce.toggled.connect(func(on): Settings.set_value("reduce_effects", on))
	%DefaultsButton.pressed.connect(_on_defaults)
	%BackButton.pressed.connect(_on_back)
	_refresh()
	_master.grab_focus()


func _refresh() -> void:
	for key in _sliders:
		_sliders[key].set_value_no_signal(Settings.get_value(key))
	_fullscreen.set_pressed_no_signal(Settings.get_value("fullscreen"))
	_reduce.set_pressed_no_signal(Settings.get_value("reduce_effects"))
	_quality.select(Settings.QUALITY_VALUES.find(Settings.get_value("quality")))
	_quality_note.text = "Em uso agora: %s" % QUALITY_LABELS[Settings.effective_quality()]


func _on_slider_changed(value: float, key: String) -> void:
	Settings.set_value(key, value)
	if key.ends_with("volume"):
		AudioManager.play_ui("hover")  # retorno audível do novo volume


func _on_defaults() -> void:
	AudioManager.play_ui("click")
	Settings.reset_to_defaults()
	_refresh()


func _on_back() -> void:
	AudioManager.play_ui("back")
	GameManager.go_to("main_menu")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_back()
