extends Control
## Emblema decorativo do menu: raios de energia girando atrás de um raio estilizado.
## Desenhado em código (vetorial, nítido em qualquer densidade de tela, zero bytes de textura).

const GOLD := Color("ffc23d")
const PINK := Color("ff4d6d")
const NIGHT := Color("120b26")
const RAYS := 18
const SPEED := 0.12  # radianos por segundo: lento de propósito, para não distrair

## Raio em coordenadas normalizadas (-1..1), desenhado em ziguezague.
const BOLT := [
	Vector2(0.18, -0.78), Vector2(-0.34, 0.08), Vector2(-0.02, 0.08),
	Vector2(-0.2, 0.78), Vector2(0.36, -0.12), Vector2(0.04, -0.12),
	Vector2(0.24, -0.78),
]

var _angle := 0.0


func _process(delta: float) -> void:
	if Settings.get_value("reduce_effects"):
		return
	_angle = fmod(_angle + delta * SPEED, TAU)
	queue_redraw()


func _draw() -> void:
	var center := size * 0.5
	var radius := minf(size.x, size.y) * 0.5
	if radius <= 0.0:
		return
	for i in RAYS:
		var a0 := _angle + TAU * i / RAYS
		var a1 := a0 + TAU / RAYS * 0.45
		var color := (GOLD if i % 2 == 0 else PINK)
		color.a = 0.10
		draw_colored_polygon(PackedVector2Array([
			center,
			center + Vector2.from_angle(a0) * radius * 1.25,
			center + Vector2.from_angle(a1) * radius * 1.25,
		]), color)
	draw_circle(center, radius * 0.62, NIGHT)
	draw_arc(center, radius * 0.62, 0.0, TAU, 96, GOLD, radius * 0.035, true)
	draw_arc(center, radius * 0.7, 0.0, TAU, 96, Color(PINK, 0.6), radius * 0.012, true)
	var bolt := PackedVector2Array()
	for p in BOLT:
		bolt.append(center + p * radius * 0.55)
	var shadow := PackedVector2Array()
	for p in bolt:
		shadow.append(p + Vector2(radius * 0.04, radius * 0.04))
	draw_colored_polygon(shadow, PINK)
	draw_colored_polygon(bolt, GOLD)
