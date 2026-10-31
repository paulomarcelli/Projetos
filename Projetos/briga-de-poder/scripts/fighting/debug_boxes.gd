extends Node2D
## Caixas de golpe (vermelho) e de corpo (verde) por cima da luta. Liga e desliga na pausa.

var sim: FightSim
var origin := Vector2.ZERO


func _process(_delta: float) -> void:
	if visible:
		queue_redraw()


func _draw() -> void:
	for i in 2:
		_box(sim.hurtbox_world(i), Color(0.3, 1, 0.5))
		_box(sim.hitbox_world(i), Color(1, 0.25, 0.3))


func _box(r: Rect2i, color: Color) -> void:
	if r.size == Vector2i.ZERO:
		return
	var s := float(FightSim.SUB)
	var rect := Rect2(origin.x + r.position.x / s, origin.y - (r.position.y + r.size.y) / s, r.size.x / s, r.size.y / s)
	draw_rect(rect, Color(color, 0.25))
	draw_rect(rect, color, false, 3)
