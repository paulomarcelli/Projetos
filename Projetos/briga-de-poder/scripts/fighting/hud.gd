extends Control
## HUD da luta: vida (com rastro do dano), energia, relógio, rounds vencidos, nomes, combo
## e os avisos do round. Desenhado em código para ficar nítido em qualquer resolução.

const GOLD := Color("ffc23d")
const PINK := Color("ff4d6d")
const CYAN := Color("3de0ff")
const NIGHT := Color("0d0a19")
const PANEL := Color(0.07, 0.045, 0.15, 0.9)
const MUTED := Color(0.72, 0.67, 0.86)
const BAR_H := 46.0
const SKEW := 18.0

var sim: FightSim
var _trail: Array[float] = [1.0, 1.0]
var _combo_show: Array[int] = [0, 0]   ## combo exibido do lado de quem bateu
var _combo_timer: Array[int] = [0, 0]
var _title_font: Font = preload("res://assets/fonts/Bungee-Regular.ttf")


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)


func register_combo(attacker: int, combo: int) -> void:
	if combo >= 2:
		_combo_show[attacker] = combo
		_combo_timer[attacker] = 70


func _process(_delta: float) -> void:
	for i in 2:
		var ratio := float(sim.fighters[i].health) / sim.data[i].max_health
		_trail[i] = maxf(ratio, move_toward(_trail[i], ratio, 0.006))
		if _combo_timer[i] > 0:
			_combo_timer[i] -= 1
	queue_redraw()


func _draw() -> void:
	if sim == null:
		return
	var w := size.x
	var center := w / 2.0
	var bar_w := minf(720.0, center - 170.0)
	for i in 2:
		var dir := -1.0 if i == 0 else 1.0
		var inner := center + dir * 130.0          # ponta perto do relógio
		var outer := inner + dir * bar_w           # ponta perto da borda
		_health_bar(i, minf(inner, outer), 58.0, bar_w, i == 1)
		var name_x := minf(inner, outer)
		var align := HORIZONTAL_ALIGNMENT_LEFT if i == 0 else HORIZONTAL_ALIGNMENT_RIGHT
		_text(sim.data[i].display_name, Vector2(name_x, 148), bar_w, 34, align, Color.WHITE)
		for k in FightSim.ROUNDS_TO_WIN:
			var p := Vector2(inner + dir * (24 + k * 38), 142)
			_diamond(p, 13, GOLD if sim.wins[i] > k else Color(1, 1, 1, 0.18))
		_energy_bar(i, size.y - 64.0, align)
		if _combo_timer[i] > 0:
			var cx := 90.0 if i == 0 else w - 90.0 - 420.0
			_text("%d ACERTOS!" % _combo_show[i], Vector2(cx, 300), 420, 64, align, GOLD, true)
	# relógio
	draw_rect(Rect2(center - 92, 36, 184, 120), PANEL)
	draw_rect(Rect2(center - 92, 36, 184, 6), GOLD)
	_text(str(sim.seconds_left()), Vector2(center - 92, 140), 184, 92, HORIZONTAL_ALIGNMENT_CENTER,
		PINK if sim.seconds_left() <= 10 else Color.WHITE, true)
	_center_message()


func _health_bar(i: int, x: float, y: float, bar_w: float, mirrored: bool) -> void:
	var f := sim.fighters[i]
	var ratio := float(f.health) / sim.data[i].max_health
	_skewed(x - 6, y - 6, bar_w + 12, BAR_H + 12, NIGHT)
	_skewed(x, y, bar_w, BAR_H, Color(0.18, 0.12, 0.3))
	var trail_w := bar_w * _trail[i]
	var fill_w := bar_w * ratio
	var color := PINK if ratio < 0.25 else GOLD
	if mirrored:
		_skewed(x, y, trail_w, BAR_H, Color.WHITE.lerp(PINK, 0.5))
		_skewed(x, y, fill_w, BAR_H, color)
	else:
		_skewed(x + bar_w - trail_w, y, trail_w, BAR_H, Color.WHITE.lerp(PINK, 0.5))
		_skewed(x + bar_w - fill_w, y, fill_w, BAR_H, color)


func _energy_bar(i: int, y: float, align: int) -> void:
	var bar_w := 460.0
	var x := 90.0 if i == 0 else size.x - 90.0 - bar_w
	var ratio := float(sim.fighters[i].energy) / FightSim.ENERGY_MAX
	draw_rect(Rect2(x - 4, y - 4, bar_w + 8, 30), NIGHT)
	draw_rect(Rect2(x, y, bar_w, 22), Color(0.18, 0.12, 0.3))
	var fill := bar_w * ratio
	draw_rect(Rect2(x if i == 0 else x + bar_w - fill, y, fill, 22), CYAN)
	_text("ENERGIA · golpe supremo na Fase 4", Vector2(x, y - 12), bar_w, 26, align, MUTED)


func _center_message() -> void:
	var text := ""
	var color := Color.WHITE
	match sim.phase:
		FightSim.Phase.INTRO:
			if sim.phase_frame < 60:
				text = "ROUND FINAL" if sim.round_number == FightSim.MAX_ROUNDS else "ROUND %d" % sim.round_number
			else:
				text = "LUTE!"
				color = GOLD
		FightSim.Phase.KO:
			text = "NOCAUTE!"
			color = PINK
		FightSim.Phase.TIME_OVER:
			text = "TEMPO!"
			color = PINK
		FightSim.Phase.ROUND_RESULT:
			if sim.round_winner == 2:
				text = "EMPATE"
			else:
				text = "%s VENCE O ROUND" % sim.data[sim.round_winner].display_name
			color = GOLD
	if text != "":
		var fs := 120 if text.length() < 12 else 76
		_text(text, Vector2(0, size.y * 0.44), size.x, fs, HORIZONTAL_ALIGNMENT_CENTER, color, true)


func _skewed(x: float, y: float, w: float, h: float, color: Color) -> void:
	if w <= 0.5:
		return
	draw_colored_polygon(PackedVector2Array([
		Vector2(x + SKEW, y), Vector2(x + w + SKEW, y), Vector2(x + w - SKEW, y + h), Vector2(x - SKEW, y + h),
	]), color)


func _diamond(p: Vector2, r: float, color: Color) -> void:
	draw_colored_polygon(PackedVector2Array([p + Vector2(0, -r), p + Vector2(r, 0), p + Vector2(0, r), p + Vector2(-r, 0)]), color)


func _text(text: String, pos: Vector2, width: float, font_size: int, align: int, color: Color, title := false) -> void:
	var font: Font = _title_font if title else get_theme_default_font()
	draw_string_outline(font, pos, text, align, width, font_size, 12 if title else 8, NIGHT)
	draw_string(font, pos, text, align, width, font_size, color)
