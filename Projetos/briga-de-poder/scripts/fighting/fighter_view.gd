extends Node2D
## Desenho provisório de um lutador: boneco geométrico que mostra claramente o estado da luta
## (guarda, golpe, defesa, atordoado, caído). Será trocado pela arte definitiva na Fase 4.

const S := FighterState.State
const OUTLINE := Color("0d0a19")

var sim: FightSim
var index := 0
var origin := Vector2.ZERO


func _process(_delta: float) -> void:
	var f := sim.fighters[index]
	position = Vector2(origin.x + f.x / float(FightSim.SUB), origin.y - f.y / float(FightSim.SUB))
	queue_redraw()


func _draw() -> void:
	var f := sim.fighters[index]
	var d := sim.data[index]
	var h := float(d.hurt_stand.size.y)
	var w := float(d.hurt_stand.size.x)
	# sombra no chão (não sobe junto com o pulo)
	draw_set_transform(Vector2(0, f.y / float(FightSim.SUB) + 4), 0, Vector2(1, 0.2))
	draw_circle(Vector2.ZERO, w * 0.7, Color(0, 0, 0, 0.4))
	var main := d.color_main
	if f.state == S.HITSTUN and f.state_frame < 4:
		main = Color.WHITE  # brilho do impacto
	match f.state:
		S.KNOCKDOWN, S.KO:
			_draw_down(f, h, w, main, d.color_accent)
		_:
			_draw_standing(f, d, h, w, main, d.color_accent)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)


func _draw_standing(f: FighterState, d: FighterData, h: float, w: float, main: Color, accent: Color) -> void:
	var crouch := f.state == S.CROUCH or f.crouching or f.attack_key.begins_with("crouch")
	var body_h := float(d.hurt_crouch.size.y) if crouch else h
	var air := f.is_airborne() and f.state != S.ATTACK
	var lean := 0.0
	if f.state == S.HITSTUN:
		lean = -0.25
	draw_set_transform(Vector2.ZERO, lean * f.facing, Vector2(f.facing, 1))
	var hip := Vector2(0, -body_h * (0.42 if not crouch else 0.38))
	var shoulder := Vector2(w * 0.05, -body_h * 0.8)
	var head := Vector2(w * 0.1, -body_h * 0.91)
	var limb_w := w * 0.2
	# pernas
	var foot_front := Vector2(w * 0.32, 0)
	var foot_back := Vector2(-w * 0.3, 0)
	if air:
		foot_front = hip + Vector2(w * 0.35, h * 0.2)
		foot_back = hip + Vector2(-w * 0.15, h * 0.28)
	var arm_front := shoulder + Vector2(w * 0.45, h * 0.08)
	var arm_back := shoulder + Vector2(w * 0.25, h * 0.14)
	# golpe: o membro vai até o centro da caixa de golpe
	var attack := sim.current_attack(index)
	if attack:
		var target := Vector2(attack.hitbox.get_center())
		var t := _extension(attack, f.state_frame)
		if target.y > -body_h * 0.45:
			foot_front = foot_front.lerp(target, t)
		else:
			arm_front = arm_front.lerp(target, t)
	if f.state == S.BLOCKSTUN:
		arm_front = shoulder + Vector2(w * 0.38, -h * 0.02)
		arm_back = shoulder + Vector2(w * 0.32, h * 0.06)
	_limb(hip, foot_back, limb_w, main.darkened(0.25))
	_limb(shoulder, arm_back, limb_w * 0.85, main.darkened(0.25))
	_torso(hip, shoulder, w * 0.5, main)
	_limb(hip, foot_front, limb_w, main)
	_limb(shoulder, arm_front, limb_w * 0.85, main)
	draw_circle(arm_front, limb_w * 0.62, accent)  # luva
	draw_circle(head, h * 0.1 + 4, OUTLINE)
	draw_circle(head, h * 0.1, main)
	draw_rect(Rect2(head + Vector2(-h * 0.1, -h * 0.03), Vector2(h * 0.2, h * 0.04)), accent)  # faixa
	if f.state == S.BLOCKSTUN:
		draw_arc(shoulder + Vector2(w * 0.5, h * 0.1), h * 0.32, -1.2, 1.2, 24, Color("3de0ff"), 6)


func _draw_down(f: FighterState, h: float, w: float, main: Color, accent: Color) -> void:
	# Cai para trás: a cabeça vai para o lado oposto ao que o lutador encara.
	var angle := (-1.0 if f.is_airborne() else -PI / 2) * f.facing
	var lift := 0.0 if f.is_airborne() else -w * 0.22
	draw_set_transform(Vector2(0, lift), angle, Vector2.ONE)
	var hip := Vector2(0, -h * 0.42)
	var shoulder := Vector2(0, -h * 0.8)
	_limb(hip, Vector2(w * 0.2, 0), w * 0.2, main.darkened(0.25))
	_limb(hip, Vector2(-w * 0.2, 0), w * 0.2, main)
	_torso(hip, shoulder, w * 0.5, main)
	_limb(shoulder, shoulder + Vector2(w * 0.5, -h * 0.1), w * 0.17, main)
	draw_circle(Vector2(0, -h * 0.91), h * 0.1 + 4, OUTLINE)
	draw_circle(Vector2(0, -h * 0.91), h * 0.1, main)


## 0 → 1 no startup, 1 no active, volta a 0 na recuperação.
func _extension(attack: AttackData, frame: int) -> float:
	if frame < attack.startup:
		return float(frame + 1) / attack.startup
	if frame < attack.startup + attack.active:
		return 1.0
	return 1.0 - float(frame - attack.startup - attack.active) / maxf(1.0, attack.recovery)


func _limb(a: Vector2, b: Vector2, width: float, color: Color) -> void:
	draw_line(a, b, OUTLINE, width + 8)
	draw_circle(a, (width + 8) / 2, OUTLINE)
	draw_circle(b, (width + 8) / 2, OUTLINE)
	draw_line(a, b, color, width)
	draw_circle(a, width / 2, color)
	draw_circle(b, width / 2, color)


func _torso(hip: Vector2, shoulder: Vector2, width: float, color: Color) -> void:
	var pts := PackedVector2Array([
		hip + Vector2(-width * 0.4, 0), hip + Vector2(width * 0.4, 0),
		shoulder + Vector2(width * 0.55, 0), shoulder + Vector2(-width * 0.5, 0),
	])
	var outline := PackedVector2Array()
	var c := (hip + shoulder) / 2
	for p in pts:
		outline.append(c + (p - c) * 1.12)
	draw_colored_polygon(outline, OUTLINE)
	draw_colored_polygon(pts, color)
