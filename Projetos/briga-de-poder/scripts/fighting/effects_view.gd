extends Node2D
## Faíscas de impacto e de defesa. Só visual: lê os eventos da simulação, nunca a altera.

const LIFE := 14

var _sparks: Array[Dictionary] = []


func spawn(pos: Vector2, strength: int, blocked: bool) -> void:
	var reduce: bool = Settings.get_value("reduce_effects")
	_sparks.append({
		"pos": pos, "age": 0, "blocked": blocked,
		"size": clampf(30.0 + strength * 0.5, 40.0, 110.0) * (0.7 if reduce else 1.0),
	})


func _physics_process(_delta: float) -> void:
	for s in _sparks:
		s.age += 1
	_sparks = _sparks.filter(func(s): return s.age < LIFE)
	queue_redraw()


func _draw() -> void:
	for s in _sparks:
		var t: float = float(s.age) / LIFE
		var color := Color("3de0ff") if s.blocked else Color("ffc23d")
		color.a = 1.0 - t
		var r: float = s.size * (0.5 + t)
		var rays := 8
		var pts := PackedVector2Array()
		for k in rays * 2:
			var ang := TAU * k / (rays * 2) + 0.3
			pts.append(s.pos + Vector2.from_angle(ang) * (r if k % 2 == 0 else r * 0.4))
		draw_colored_polygon(pts, color)
		if not s.blocked:
			draw_circle(s.pos, r * 0.25, Color(1, 1, 1, 1.0 - t))
