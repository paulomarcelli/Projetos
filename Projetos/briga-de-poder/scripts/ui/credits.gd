extends Control
## Créditos: autoria, ferramentas e licenças de tudo o que acompanha o jogo.


func _ready() -> void:
	%Engine.text = "Godot Engine %s — licença MIT (godotengine.org)" % Engine.get_version_info().string
	%BackButton.pressed.connect(_on_back)
	%BackButton.grab_focus()


func _on_back() -> void:
	AudioManager.play_ui("back")
	GameManager.go_to("main_menu")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_back()
