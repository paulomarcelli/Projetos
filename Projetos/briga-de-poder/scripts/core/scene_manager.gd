extends Node
## Troca de cenas com transição em cortina e carregamento em segundo plano.
## ResourceLoader.load_threaded_request funciona também na Web sem threads: o Godot
## carrega aos poucos no mesmo laço, então a tela "Carregando…" continua respondendo.

signal scene_changed(path: String)

const FADE_IN := 0.18
const FADE_OUT := 0.22
## Só mostra "Carregando…" se demorar mais que isto (cargas rápidas não piscam texto).
const LOADING_LABEL_DELAY := 0.35

var is_changing := false

var _layer: CanvasLayer
var _curtain: ColorRect
var _loading_label: Label


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_layer = CanvasLayer.new()
	_layer.layer = 90
	add_child(_layer)
	_curtain = ColorRect.new()
	_curtain.color = Color("0d0a19")
	_curtain.set_anchors_preset(Control.PRESET_FULL_RECT)
	_curtain.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_curtain.modulate.a = 0.0
	_layer.add_child(_curtain)
	_loading_label = Label.new()
	_loading_label.text = "Carregando…"
	_loading_label.set_anchors_preset(Control.PRESET_CENTER)
	_loading_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_loading_label.add_theme_font_size_override("font_size", 48)
	_loading_label.visible = false
	_curtain.add_child(_loading_label)


func change_scene(path: String) -> void:
	if is_changing:
		return
	if not ResourceLoader.exists(path):
		push_error("Cena inexistente: %s" % path)
		return
	is_changing = true
	_curtain.mouse_filter = Control.MOUSE_FILTER_STOP  # bloqueia cliques durante a troca
	var instant: bool = Settings.get_value("reduce_effects")
	await _fade_to(1.0, 0.0 if instant else FADE_IN)

	var err := ResourceLoader.load_threaded_request(path)
	var packed: PackedScene
	if err == OK:
		var waited := 0.0
		while ResourceLoader.load_threaded_get_status(path) == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			await get_tree().process_frame
			waited += get_process_delta_time()
			_loading_label.visible = waited > LOADING_LABEL_DELAY
		packed = ResourceLoader.load_threaded_get(path) as PackedScene
	else:
		packed = load(path) as PackedScene

	_loading_label.visible = false
	if packed == null:
		push_error("Falha ao carregar a cena: %s" % path)
	else:
		get_tree().change_scene_to_packed(packed)
		await get_tree().process_frame
		scene_changed.emit(path)

	await _fade_to(0.0, 0.0 if instant else FADE_OUT)
	_curtain.mouse_filter = Control.MOUSE_FILTER_IGNORE
	is_changing = false


func _fade_to(alpha: float, duration: float) -> void:
	if duration <= 0.0:
		_curtain.modulate.a = alpha
		return
	var tw := create_tween().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
	tw.tween_property(_curtain, "modulate:a", alpha, duration)
	await tw.finished
