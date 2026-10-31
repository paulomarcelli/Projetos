extends Node2D
## Luta local 1 contra 1. A simulação avança só em _physics_process (60 quadros fixos por
## segundo); o resto deste script apenas lê o resultado para desenhar, tocar sons e mostrar menus.

enum Opponent { PLAYER_2, DUMMY_IDLE, DUMMY_BLOCK }

const FIGHTERS := ["res://data/characters/rocha.tres", "res://data/characters/faisca.tres"]
const OPPONENT_LABELS := ["JOGADOR 2", "BONECO PARADO", "BONECO QUE DEFENDE"]
const FLOOR_Y := 930.0

var sim: FightSim
var opponent: Opponent = Opponent.PLAYER_2
var paused := false
var _shake := 0.0

@onready var _stage = $Stage
@onready var _views := [$Fighter1, $Fighter2]
@onready var _effects = $Effects
@onready var _debug = $DebugBoxes
@onready var _hud = %Hud
@onready var _pause_panel: Control = %PausePanel
@onready var _end_panel: Control = %EndPanel
@onready var _opponent_button: Button = %OpponentButton
@onready var _boxes_button: Button = %BoxesButton
@onready var _touch_notice: Control = %TouchNotice


func _ready() -> void:
	PlayerBindings.ensure_defaults()
	sim = FightSim.new(load(FIGHTERS[0]), load(FIGHTERS[1]))
	sim.start_match()
	for i in 2:
		_views[i].sim = sim
		_views[i].index = i
	_debug.sim = sim
	_debug.visible = false
	_hud.sim = sim
	%ControlsLabel.text = "\n".join(PlayerBindings.LABELS) + "\nEspecial: baixo, diagonal, frente + ataque (Rocha) · frente, baixo, diagonal + ataque (Faísca)"
	%ResumeButton.pressed.connect(_set_paused.bind(false))
	_opponent_button.pressed.connect(_cycle_opponent)
	_boxes_button.pressed.connect(_toggle_boxes)
	%RestartButton.pressed.connect(_restart)
	%MenuButton.pressed.connect(_to_menu)
	%RematchButton.pressed.connect(_restart)
	%EndMenuButton.pressed.connect(_to_menu)
	%TouchOkButton.pressed.connect(func(): _touch_notice.hide())
	_touch_notice.visible = InputDetector.current == InputDetector.Device.TOUCH
	GameManager.state_changed.connect(_on_game_state)
	GameManager.set_state(GameManager.State.FIGHT)
	_refresh_labels()
	_layout()


func _physics_process(_delta: float) -> void:
	if paused or _touch_notice.visible:
		return
	sim.step([PlayerBindings.read(0), _opponent_input()])
	for e in sim.events:
		_on_event(e)
	if sim.phase == FightSim.Phase.MATCH_END and not _end_panel.visible:
		_show_end()


func _process(delta: float) -> void:
	_layout()
	if _shake > 0.0:
		_shake = maxf(0.0, _shake - delta * 60.0)
		position = Vector2(randf_range(-_shake, _shake), randf_range(-_shake, _shake))
	else:
		position = Vector2.ZERO


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"pause") and not _end_panel.visible:
		get_viewport().set_input_as_handled()
		_set_paused(not paused)


## A arena fica centralizada; em telas mais largas que 16:9 sobra fundo nas laterais.
func _layout() -> void:
	var origin := Vector2((get_viewport_rect().size.x - FightSim.STAGE_WIDTH) / 2.0, FLOOR_Y)
	_stage.origin = origin
	_stage.queue_redraw()
	_debug.origin = origin
	for v in _views:
		v.origin = origin


func _opponent_input() -> int:
	match opponent:
		Opponent.DUMMY_IDLE:
			return 0
		Opponent.DUMMY_BLOCK:
			var me := sim.fighters[1]
			var bits := InputBits.RIGHT if me.x > sim.fighters[0].x else InputBits.LEFT
			var attack := sim.current_attack(0)
			if attack and attack.guard == AttackData.Guard.LOW:
				bits |= InputBits.DOWN
			return bits
	return PlayerBindings.read(1)


func _on_event(e: Dictionary) -> void:
	match e.type:
		"hit", "block":
			var s := float(FightSim.SUB)
			var pos := Vector2(_stage.origin.x + e.x / s, _stage.origin.y - e.y / s)
			_effects.spawn(pos, e.strength, e.type == "block")
			if e.type == "hit":
				AudioManager.play_ui("hit_heavy" if e.strength >= 90 else "hit_light")
				_hud.register_combo(e.attacker, e.combo)
				if e.strength >= 90 and not Settings.get_value("reduce_effects"):
					_shake = 9.0
			else:
				AudioManager.play_ui("block")
		"ko":
			AudioManager.play_ui("ko")
		"time_over", "round_result":
			AudioManager.play_ui("round")


func _set_paused(value: bool) -> void:
	paused = value
	_pause_panel.visible = paused
	GameManager.set_state(GameManager.State.PAUSED if paused else GameManager.State.FIGHT)
	if paused:
		AudioManager.play_ui("back")
		%ResumeButton.grab_focus()


func _on_game_state(state: GameManager.State) -> void:
	# A aba perdeu o foco no meio da luta: o GameManager muda para PAUSED e o menu aparece.
	if state == GameManager.State.PAUSED and not paused and not _end_panel.visible:
		_set_paused(true)


func _cycle_opponent() -> void:
	opponent = ((opponent + 1) % OPPONENT_LABELS.size()) as Opponent
	AudioManager.play_ui("click")
	_refresh_labels()


func _toggle_boxes() -> void:
	_debug.visible = not _debug.visible
	AudioManager.play_ui("click")
	_refresh_labels()


func _refresh_labels() -> void:
	_opponent_button.text = "ADVERSÁRIO: %s" % OPPONENT_LABELS[opponent]
	_boxes_button.text = "CAIXAS DE COLISÃO: %s" % ("SIM" if _debug.visible else "NÃO")


func _restart() -> void:
	AudioManager.play_ui("click")
	sim.start_match()
	_end_panel.hide()
	_set_paused(false)


func _show_end() -> void:
	var w := sim.match_winner
	%EndTitle.text = "EMPATE" if w == 2 else "%s VENCEU!" % sim.data[w].display_name
	%EndScore.text = "%d × %d em %d rounds" % [sim.wins[0], sim.wins[1], sim.round_number]
	_end_panel.show()
	%RematchButton.grab_focus()


func _to_menu() -> void:
	AudioManager.play_ui("back")
	GameManager.set_state(GameManager.State.MENU)
	GameManager.go_to("main_menu")
