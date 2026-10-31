extends Node
## Configurações do jogador, salvas em user://settings.cfg.
## No navegador, user:// é persistido pelo Godot no IndexedDB do site.

signal changed(key: String, value: Variant)

const DEFAULT_PATH := "user://settings.cfg"
const SECTION := "settings"

const DEFAULTS := {
	"master_volume": 0.8,
	"music_volume": 0.7,
	"sfx_volume": 0.9,
	"fullscreen": false,
	"quality": "auto",        # "auto" | "low" | "high"
	"reduce_effects": false,  # menos partículas, tremores e movimento
	"touch_opacity": 0.7,     # usados pelos controles de toque (Fase 3)
	"touch_scale": 1.0,
}

const RANGES := {
	"master_volume": Vector2(0.0, 1.0),
	"music_volume": Vector2(0.0, 1.0),
	"sfx_volume": Vector2(0.0, 1.0),
	"touch_opacity": Vector2(0.2, 1.0),
	"touch_scale": Vector2(0.75, 1.5),
}

const QUALITY_VALUES := ["auto", "low", "high"]

var path := DEFAULT_PATH
var _values: Dictionary = {}


func _ready() -> void:
	load_settings()
	apply_all()


func get_value(key: String) -> Variant:
	return _values.get(key, DEFAULTS.get(key))


func set_value(key: String, value: Variant, save := true) -> void:
	if not DEFAULTS.has(key):
		push_warning("Configuração desconhecida: %s" % key)
		return
	value = _sanitize(key, value)
	if _values.get(key) == value:
		return
	_values[key] = value
	_apply(key)
	changed.emit(key, value)
	if save:
		save_settings()


func reset_to_defaults() -> void:
	for key in DEFAULTS:
		set_value(key, DEFAULTS[key], false)
	save_settings()


## Qualidade efetiva: "auto" vira "low" em celular, onde GPU e bateria são mais limitadas.
func effective_quality() -> String:
	var q: String = get_value("quality")
	if q == "auto":
		return "low" if PlatformInfo.is_mobile else "high"
	return q


func load_settings() -> void:
	_values = DEFAULTS.duplicate()
	var cfg := ConfigFile.new()
	if cfg.load(path) != OK:
		return
	for key in DEFAULTS:
		if cfg.has_section_key(SECTION, key):
			_values[key] = _sanitize(key, cfg.get_value(SECTION, key))


func save_settings() -> void:
	var cfg := ConfigFile.new()
	for key in _values:
		cfg.set_value(SECTION, key, _values[key])
	var err := cfg.save(path)
	if err != OK:
		push_warning("Não foi possível salvar as configurações (%s)." % error_string(err))


func apply_all() -> void:
	for key in _values:
		_apply(key)


func _sanitize(key: String, value: Variant) -> Variant:
	var default: Variant = DEFAULTS[key]
	match typeof(default):
		TYPE_FLOAT:
			var f := float(value) if (typeof(value) == TYPE_FLOAT or typeof(value) == TYPE_INT) else float(default)
			if RANGES.has(key):
				f = clampf(f, RANGES[key].x, RANGES[key].y)
			return f
		TYPE_BOOL:
			return bool(value) if typeof(value) == TYPE_BOOL else default
		TYPE_STRING:
			if key == "quality" and not QUALITY_VALUES.has(value):
				return default
			return str(value)
	return default


func _apply(key: String) -> void:
	match key:
		"master_volume":
			_set_bus_volume("Master", get_value(key))
		"music_volume":
			_set_bus_volume("Music", get_value(key))
		"sfx_volume":
			_set_bus_volume("SFX", get_value(key))
		"fullscreen":
			_apply_fullscreen(get_value(key))


func _set_bus_volume(bus_name: String, linear: float) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx < 0:
		return
	AudioServer.set_bus_mute(idx, linear <= 0.001)
	AudioServer.set_bus_volume_db(idx, linear_to_db(maxf(linear, 0.001)))


func _apply_fullscreen(enabled: bool) -> void:
	# Sem janela (testes headless) não há o que alternar. No navegador o pedido de tela cheia
	# só é aceito durante um gesto do jogador (clique/toque), por isso parte do botão.
	if DisplayServer.get_name() == "headless":
		return
	var mode := DisplayServer.WINDOW_MODE_FULLSCREEN if enabled else DisplayServer.WINDOW_MODE_WINDOWED
	if DisplayServer.window_get_mode() != mode:
		DisplayServer.window_set_mode(mode)
