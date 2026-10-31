extends Node
## Testes automáticos da Fase 1. Rodar (sem janela):
##   godot --headless --path . res://tests/test_runner.tscn
## Sai com código 0 se tudo passar, 1 se algo falhar. Roda como cena (e não com -s) para que
## os autoloads existam exatamente como no jogo.

const TEST_SETTINGS_PATH := "user://test_settings.cfg"

var _failures := 0
var _checks := 0


func _ready() -> void:
	Settings.path = TEST_SETTINGS_PATH  # nunca tocar nas configurações reais do jogador
	# Troca de cena libera a "cena atual". Um nó vazio assume esse papel para que o próprio
	# executor de testes sobreviva ao teste do SceneManager.
	var placeholder := Node.new()
	placeholder.name = "Placeholder"
	get_tree().root.add_child.call_deferred(placeholder)
	await get_tree().process_frame
	get_tree().current_scene = placeholder
	_test_settings()
	_test_input_classification()
	_test_audio()
	_test_scene_registry()
	await _test_main_menu()
	await _test_settings_menu()
	await _test_scene_change()
	_test_focus_pause()
	DirAccess.remove_absolute(ProjectSettings.globalize_path(TEST_SETTINGS_PATH))
	print("\n%d verificações, %d falhas" % [_checks, _failures])
	get_tree().quit(1 if _failures > 0 else 0)


func check(condition: bool, label: String) -> void:
	_checks += 1
	if condition:
		print("  ok   ", label)
	else:
		_failures += 1
		printerr("  FALHA ", label)


func _test_settings() -> void:
	print("Settings")
	Settings.reset_to_defaults()
	Settings.set_value("master_volume", 0.35)
	Settings.set_value("sfx_volume", 7.0)          # fora da faixa
	Settings.set_value("touch_scale", 0.1)         # abaixo do mínimo
	Settings.set_value("quality", "ultra")         # valor inválido
	Settings.set_value("reduce_effects", true)
	Settings.set_value("fullscreen", "sim")        # tipo errado
	check(is_equal_approx(Settings.get_value("sfx_volume"), 1.0), "volume acima de 1 é limitado a 1")
	check(is_equal_approx(Settings.get_value("touch_scale"), 0.75), "tamanho do toque respeita o mínimo")
	check(Settings.get_value("quality") == "auto", "qualidade inválida volta ao padrão")
	check(Settings.get_value("fullscreen") == false, "tipo errado volta ao padrão")
	Settings.load_settings()  # relê do disco
	check(is_equal_approx(Settings.get_value("master_volume"), 0.35), "valor salvo sobrevive à releitura")
	check(Settings.get_value("reduce_effects") == true, "booleano salvo sobrevive à releitura")
	var master := AudioServer.get_bus_index("Master")
	Settings.apply_all()
	check(is_equal_approx(AudioServer.get_bus_volume_db(master), linear_to_db(0.35)), "volume aplicado ao barramento de áudio")
	Settings.set_value("music_volume", 0.0)
	check(AudioServer.is_bus_mute(AudioServer.get_bus_index("Music")), "volume zero silencia o barramento")
	var cfg := ConfigFile.new()
	cfg.set_value(Settings.SECTION, "master_volume", "alto")
	cfg.set_value(Settings.SECTION, "quality", "high")
	cfg.save(TEST_SETTINGS_PATH)
	Settings.load_settings()
	check(is_equal_approx(Settings.get_value("master_volume"), Settings.DEFAULTS.master_volume), "arquivo corrompido não quebra a leitura")
	check(Settings.get_value("quality") == "high", "valor válido do arquivo é mantido")
	Settings.reset_to_defaults()
	check(Settings.get_value("quality") == "auto" and not Settings.get_value("reduce_effects"), "restaurar padrão")
	check(Settings.effective_quality() == ("low" if PlatformInfo.is_mobile else "high"), "qualidade automática por plataforma")


func _test_input_classification() -> void:
	print("InputDetector")
	var D := InputDetector.Device
	var key := InputEventKey.new()
	check(InputDetector.classify(key) == D.KEYBOARD_MOUSE, "tecla = teclado")
	var pad := InputEventJoypadButton.new()
	check(InputDetector.classify(pad) == D.GAMEPAD, "botão do controle = controle")
	var drift := InputEventJoypadMotion.new()
	drift.axis_value = 0.1
	check(InputDetector.classify(drift) == -1, "ruído do analógico é ignorado")
	var stick := InputEventJoypadMotion.new()
	stick.axis_value = -0.9
	check(InputDetector.classify(stick) == D.GAMEPAD, "analógico inclinado = controle")
	var touch := InputEventScreenTouch.new()
	check(InputDetector.classify(touch) == D.TOUCH, "toque = toque")
	var emulated := InputEventMouseButton.new()
	emulated.device = InputEvent.DEVICE_ID_EMULATION
	check(InputDetector.classify(emulated) == -1, "mouse emulado pelo toque não troca o dispositivo")
	var mouse := InputEventMouseMotion.new()
	check(InputDetector.classify(mouse) == D.KEYBOARD_MOUSE, "mouse real = teclado/mouse")


func _test_audio() -> void:
	print("AudioManager")
	for sound in ["hover", "click", "back", "denied"]:
		check(AudioManager.has_sound(sound), "som de interface '%s' existe" % sound)
	AudioManager.play_ui("click")  # não pode lançar erro mesmo sem placa de som (headless)


func _test_scene_registry() -> void:
	print("Cenas registradas")
	for key in GameManager.SCENES:
		check(ResourceLoader.exists(GameManager.SCENES[key]), "cena '%s' existe" % key)


func _test_main_menu() -> void:
	print("Menu principal")
	var menu: Control = load("res://scenes/menus/main_menu.tscn").instantiate()
	add_child(menu)
	await get_tree().process_frame
	var ids: Array = menu.ITEMS.map(func(i): return i.id)
	for item in menu.ITEMS:
		var button: Button = menu.buttons.get(item.id)
		if item.get("action") == "quit" and not PlatformInfo.can_quit():
			check(button == null, "'Sair' fica oculto onde não dá para sair (Web)")
			continue
		check(button != null, "botão '%s' foi criado" % item.id)
		if button == null:
			continue
		if button.disabled:
			check("EM BREVE" in button.text and item.has("phase"), "'%s' desativado e marcado como em breve" % item.id)
			check(button.gui_input.get_connections().size() > 0, "'%s' responde ao toque com aviso" % item.id)
		else:
			check(button.pressed.get_connections().size() > 0, "'%s' tem ação ligada" % item.id)
	check(ids.has("settings") and not menu.buttons.settings.disabled, "Configurações disponível")
	check(ids.has("credits") and not menu.buttons.credits.disabled, "Créditos disponível")
	menu.buttons.multiplayer.focus_entered.emit()
	check("Fase 6" in menu.get_node("%Hint").text, "dica explica quando o multiplayer chega")
	menu.queue_free()
	await get_tree().process_frame


func _test_settings_menu() -> void:
	print("Tela de configurações")
	var screen: Control = load("res://scenes/menus/settings_menu.tscn").instantiate()
	add_child(screen)
	await get_tree().process_frame
	var slider: HSlider = screen.get_node("%MasterSlider")
	check(is_equal_approx(slider.value, Settings.get_value("master_volume")), "controle mostra o valor salvo")
	slider.value = 0.5
	check(is_equal_approx(Settings.get_value("master_volume"), 0.5), "mover o controle altera a configuração")
	var option: OptionButton = screen.get_node("%QualityOption")
	option.select(2)
	option.item_selected.emit(2)
	check(Settings.get_value("quality") == "high", "escolher qualidade grava a configuração")
	screen.get_node("%DefaultsButton").pressed.emit()
	check(is_equal_approx(slider.value, Settings.DEFAULTS.master_volume), "restaurar padrão atualiza a tela")
	screen.queue_free()
	var credits: Control = load("res://scenes/menus/credits.tscn").instantiate()
	add_child(credits)
	await get_tree().process_frame
	check("Godot Engine 4." in credits.get_node("%Engine").text, "créditos mostram a versão real do Godot")
	credits.queue_free()
	await get_tree().process_frame


func _test_scene_change() -> void:
	print("SceneManager")
	var outcome := [""]
	SceneManager.scene_changed.connect(func(p): outcome[0] = p, CONNECT_ONE_SHOT)
	SceneManager.change_scene(GameManager.SCENES.credits)
	SceneManager.change_scene(GameManager.SCENES.settings)  # segundo pedido durante a troca é ignorado
	var frames := 0
	while SceneManager.is_changing and frames < 300:
		await get_tree().process_frame
		frames += 1
	check(outcome[0] == GameManager.SCENES.credits, "troca de cena concluída e sinalizada")
	check(get_tree().current_scene != null and get_tree().current_scene.name == "Credits", "cena atual é a de créditos")
	check(not SceneManager.is_changing, "trava de troca liberada ao final")


func _test_focus_pause() -> void:
	print("GameManager")
	GameManager.set_state(GameManager.State.FIGHT)
	GameManager._notification(NOTIFICATION_APPLICATION_FOCUS_OUT)
	check(GameManager.state == GameManager.State.PAUSED, "luta pausa quando a aba perde o foco")
	GameManager._notification(NOTIFICATION_APPLICATION_FOCUS_IN)
	check(GameManager.app_focused, "foco recuperado é registrado")
	GameManager.set_state(GameManager.State.MENU)
