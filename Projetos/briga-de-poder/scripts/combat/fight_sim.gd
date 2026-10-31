class_name FightSim
extends RefCounted
## Simulação da luta em quadros fixos (60 por segundo), separada da tela.
## Regras: só inteiros, nenhum acesso a Input, nenhum número aleatório, ordem de execução fixa.
## Assim os mesmos dados de entrada produzem sempre o mesmo resultado, e o estado pode ser
## copiado e restaurado (snapshot/restore), o que o rollback da Fase 6 exige.

enum Phase { INTRO, FIGHT, KO, TIME_OVER, ROUND_RESULT, MATCH_END }

const S := FighterState.State
const SUB := 100                 ## 1 pixel = 100 unidades
const STAGE_WIDTH := 1700        ## pixels
const START_GAP := 520           ## distância inicial entre os lutadores, em pixels
const TIMER_SECONDS := 90
const ROUNDS_TO_WIN := 2
const MAX_ROUNDS := 5            ## evita luta infinita em empates seguidos
const BUFFER := 5                ## quadros em que um botão apertado cedo fica guardado
const MOTION_WINDOW := 16        ## quadros para completar um comando de especial
const CANCEL_WINDOW := 4         ## quadros após o fim do active em que o cancelamento vale
const LANDING_FRAMES := 3
const KNOCKDOWN_GROUND := 36
const KNOCKDOWN_LAUNCH_VX := 500
const KNOCKDOWN_LAUNCH_VY := 1600
const KNOCKDOWN_GRAVITY := 120
const INTRO_FRAMES := 100
const KO_FRAMES := 150
const RESULT_FRAMES := 120
const ENERGY_MAX := 1000
const VERTICAL_OVERLAP := 16000  ## acima disso um pulo passa por cima do oponente

var data: Array[FighterData] = []
var fighters: Array[FighterState] = []
var frame := 0
var phase: Phase = Phase.INTRO
var phase_frame := 0
var round_number := 0
var wins := [0, 0]
var timer_frames := 0
var freeze := 0                  ## pausa de impacto em andamento
var round_winner := -1           ## -1 em andamento, 0/1 jogador, 2 empate
var match_winner := -1           ## -1 em andamento, 0/1 jogador, 2 empate
var events: Array[Dictionary] = []  ## o que aconteceu neste quadro (sons e efeitos leem)


func _init(p1: FighterData, p2: FighterData) -> void:
	data = [p1, p2]
	fighters = [FighterState.new(), FighterState.new()]


func start_match() -> void:
	frame = 0
	round_number = 0
	wins = [0, 0]
	match_winner = -1
	for f in fighters:
		f.energy = 0
	_start_round()


func step(inputs: Array) -> void:
	events.clear()
	frame += 1
	for i in 2:
		_record_input(i, int(inputs[i]) if phase == Phase.FIGHT else 0)
	if freeze > 0:
		freeze -= 1
		return
	if phase == Phase.INTRO:
		phase_frame += 1
		if phase_frame >= INTRO_FRAMES:
			_set_phase(Phase.FIGHT)
		return
	if phase == Phase.MATCH_END:
		for i in 2:
			_physics(i)
			_advance(i)
		return
	if phase == Phase.FIGHT:
		for i in 2:
			_control(i)
	for i in 2:
		_attack_motion(i)
		_physics(i)
	_separate()
	_update_facing()
	if phase == Phase.FIGHT:
		_resolve_hits()
	for i in 2:
		_advance(i)
	_update_phase()


# --- consultas usadas pela tela e pelos testes ---------------------------------------------

func current_attack(i: int) -> AttackData:
	var f := fighters[i]
	return data[i].attack(f.attack_key) if f.state == S.ATTACK else null


func hurtbox_world(i: int) -> Rect2i:
	var f := fighters[i]
	var d := data[i]
	if f.state == S.KNOCKDOWN or f.state == S.KO:
		return Rect2i()
	var attack := current_attack(i)
	if attack and f.state_frame <= attack.invulnerable_until:
		return Rect2i()
	var box: Rect2i
	if f.is_airborne():
		box = d.hurt_air
	elif f.state == S.CROUCH or f.crouching or (attack and f.attack_key.begins_with("crouch")):
		box = d.hurt_crouch
	else:
		box = d.hurt_stand
	return _to_world(box, f)


func hitbox_world(i: int) -> Rect2i:
	var attack := current_attack(i)
	var f := fighters[i]
	if attack == null or f.attack_hit or not attack.is_active(f.state_frame):
		return Rect2i()
	return _to_world(attack.hitbox, f)


func seconds_left() -> int:
	return ceili(timer_frames / 60.0)


func is_actionable(i: int) -> bool:
	return fighters[i].state in [S.IDLE, S.WALK_F, S.WALK_B, S.CROUCH]


func snapshot() -> Dictionary:
	return {
		"frame": frame, "phase": phase, "phase_frame": phase_frame, "round": round_number,
		"wins": wins.duplicate(), "timer": timer_frames, "freeze": freeze,
		"round_winner": round_winner, "match_winner": match_winner,
		"fighters": [fighters[0].to_dict(), fighters[1].to_dict()],
	}


func restore(snap: Dictionary) -> void:
	frame = snap.frame
	phase = snap.phase
	phase_frame = snap.phase_frame
	round_number = snap.round
	wins.assign(snap.wins)
	timer_frames = snap.timer
	freeze = snap.freeze
	round_winner = snap.round_winner
	match_winner = snap.match_winner
	for i in 2:
		fighters[i].from_dict(snap.fighters[i])


func checksum() -> int:
	return str(snapshot()).hash()


## Fator de dano do combo, em porcentagem: cheio nos dois primeiros acertos, depois cai.
static func combo_scale(hit_number: int) -> int:
	if hit_number <= 2:
		return 100
	return maxi(30, 100 - 20 - (hit_number - 3) * 10)


# --- rounds -----------------------------------------------------------------------------------

func _start_round() -> void:
	round_number += 1
	round_winner = -1
	timer_frames = TIMER_SECONDS * 60
	freeze = 0
	var center := STAGE_WIDTH * SUB / 2
	for i in 2:
		var f := fighters[i]
		var energy := f.energy
		f.from_dict(FighterState.new().to_dict())
		f.energy = energy
		f.health = data[i].max_health
		f.facing = 1 if i == 0 else -1
		f.x = center - f.facing * START_GAP * SUB / 2
	_set_phase(Phase.INTRO)


func _set_phase(new_phase: Phase) -> void:
	phase = new_phase
	phase_frame = 0


func _update_phase() -> void:
	match phase:
		Phase.FIGHT:
			if fighters[0].health <= 0 or fighters[1].health <= 0:
				_set_phase(Phase.KO)
				events.append({"type": "ko"})
			else:
				timer_frames = maxi(0, timer_frames - 1)
				if timer_frames == 0:
					_set_phase(Phase.TIME_OVER)
					events.append({"type": "time_over"})
		Phase.KO, Phase.TIME_OVER:
			phase_frame += 1
			if phase_frame >= KO_FRAMES:
				_finish_round()
		Phase.ROUND_RESULT:
			phase_frame += 1
			if phase_frame >= RESULT_FRAMES:
				if match_winner >= 0:
					_set_phase(Phase.MATCH_END)
				else:
					_start_round()


func _finish_round() -> void:
	# Compara a porcentagem de vida (multiplicação cruzada, só inteiros): os lutadores têm
	# vida máxima diferente.
	var h0 := fighters[0].health * data[1].max_health
	var h1 := fighters[1].health * data[0].max_health
	if h0 == h1 or (fighters[0].health <= 0 and fighters[1].health <= 0):
		round_winner = 2
	else:
		round_winner = 0 if h0 > h1 else 1
		wins[round_winner] += 1
	if wins[0] >= ROUNDS_TO_WIN or wins[1] >= ROUNDS_TO_WIN:
		match_winner = 0 if wins[0] > wins[1] else 1
	elif round_number >= MAX_ROUNDS:
		match_winner = 2 if wins[0] == wins[1] else (0 if wins[0] > wins[1] else 1)
	_set_phase(Phase.ROUND_RESULT)
	events.append({"type": "round_result", "winner": round_winner})


# --- entrada e controle -----------------------------------------------------------------------

func _record_input(i: int, bits: int) -> void:
	var f := fighters[i]
	var before := f.last_input()
	f.push_input(bits)
	for b in 3:
		var mask: int = InputBits.BUTTONS[b]
		if bits & mask and not before & mask:
			f.pressed_at[b] = frame


## Botão apertado há no máximo BUFFER quadros e ainda não usado. Forte tem prioridade.
func _take_button(f: FighterState) -> int:
	for b in [2, 1, 0]:
		if frame - f.pressed_at[b] <= BUFFER:
			f.pressed_at[b] = -1000
			return b
	return -1


func _peek_button(f: FighterState) -> bool:
	for b in 3:
		if frame - f.pressed_at[b] <= BUFFER:
			return true
	return false


func _special_ready(i: int) -> bool:
	var special := data[i].attack("special")
	var f := fighters[i]
	return special != null and _peek_button(f) and InputBits.has_motion(f.history, f.facing, special.motion, MOTION_WINDOW)


func _control(i: int) -> void:
	var f := fighters[i]
	var d := data[i]
	var dir := InputBits.numpad(f.last_input(), f.facing)
	match f.state:
		S.IDLE, S.WALK_F, S.WALK_B, S.CROUCH:
			if _special_ready(i):
				_take_button(f)
				_start_attack(i, "special")
				return
			var button := _take_button(f)
			if button >= 0:
				var strength: String = ["light", "medium", "heavy"][button]
				_start_attack(i, ("crouch_" if dir <= 3 else "stand_") + strength)
				return
			if dir >= 7:
				f.set_state(S.AIR)
				f.vy = d.jump_velocity
				f.vx = (dir - 8) * d.jump_forward * f.facing
				f.air_attack_used = false
				f.y = 1  # sai do chão neste quadro
			elif dir <= 3:
				f.set_state(S.CROUCH)
				f.vx = 0
			elif dir == 6:
				f.set_state(S.WALK_F)
				f.vx = d.walk_forward * f.facing
			elif dir == 4:
				f.set_state(S.WALK_B)
				f.vx = -d.walk_back * f.facing
			else:
				f.set_state(S.IDLE)
				f.vx = 0
		S.AIR:
			if not f.air_attack_used and _take_button(f) >= 0:
				f.air_attack_used = true
				_start_attack(i, "air")
		S.ATTACK:
			var attack := current_attack(i)
			var in_window := f.state_frame < attack.startup + attack.active + CANCEL_WINDOW
			if attack.cancelable and f.attack_hit and in_window and _special_ready(i):
				_take_button(f)
				_start_attack(i, "special")


func _start_attack(i: int, key: String) -> void:
	var f := fighters[i]
	if data[i].attack(key) == null:
		return
	f.state = S.ATTACK
	f.state_frame = 0
	f.attack_key = key
	f.attack_hit = false
	if not f.is_airborne():
		f.vx = 0


## Golpes de avanço andam durante startup e active; golpes que sobem saltam no 1º quadro ativo.
func _attack_motion(i: int) -> void:
	var attack := current_attack(i)
	if attack == null:
		return
	var f := fighters[i]
	if attack.move_vx != 0:
		f.vx = attack.move_vx * f.facing if f.state_frame < attack.startup + attack.active else 0
	if attack.move_vy != 0 and f.state_frame == attack.startup:
		f.vy = attack.move_vy
		f.y = maxi(f.y, 1)


# --- física -----------------------------------------------------------------------------------

func _physics(i: int) -> void:
	var f := fighters[i]
	var d := data[i]
	if f.slide != 0:
		var part := f.slide / 4
		if part == 0:
			part = f.slide
		f.x += part
		f.slide -= part
	f.x += f.vx
	if f.is_airborne():
		f.y += f.vy
		var gravity := KNOCKDOWN_GRAVITY if f.state in [S.KNOCKDOWN, S.KO] else d.gravity
		f.vy -= gravity
		if f.y <= 0:
			f.y = 0
			f.vy = 0
			_land(i)
	var half := d.push_half_width * SUB
	f.x = clampi(f.x, half, STAGE_WIDTH * SUB - half)


func _land(i: int) -> void:
	var f := fighters[i]
	match f.state:
		S.AIR, S.ATTACK:
			f.vx = 0
			f.set_state(S.LANDING)
			f.state_frame = 0
		S.KNOCKDOWN:
			f.vx = 0
			f.stun = KNOCKDOWN_GROUND
		S.KO:
			f.vx = 0
		_:
			f.vx = 0


func _separate() -> void:
	var a := fighters[0]
	var b := fighters[1]
	if a.state == S.KO or b.state == S.KO or absi(a.y - b.y) > VERTICAL_OVERLAP:
		return
	var minimum := (data[0].push_half_width + data[1].push_half_width) * SUB
	var dx := b.x - a.x
	if absi(dx) >= minimum:
		return
	var dir := signi(dx) if dx != 0 else a.facing
	var overlap := minimum - absi(dx)
	a.x -= dir * (overlap / 2)
	b.x += dir * (overlap - overlap / 2)
	# Quem está na parede não sai do lugar: o outro recebe o empurrão inteiro.
	for k in 2:
		var me := fighters[k]
		var half := data[k].push_half_width * SUB
		var clamped := clampi(me.x, half, STAGE_WIDTH * SUB - half)
		if clamped != me.x:
			fighters[1 - k].x += clamped - me.x
			me.x = clamped


func _update_facing() -> void:
	for i in 2:
		var f := fighters[i]
		var other := fighters[1 - i]
		if f.is_airborne() or not f.state in [S.IDLE, S.WALK_F, S.WALK_B, S.CROUCH, S.LANDING]:
			continue
		if other.x != f.x:
			var new_facing := signi(other.x - f.x)
			if new_facing != f.facing:
				f.facing = new_facing
				if f.state == S.WALK_F or f.state == S.WALK_B:
					f.vx = -f.vx


# --- acertos ----------------------------------------------------------------------------------

func _resolve_hits() -> void:
	var hits: Array[int] = []
	for i in 2:
		var hit := hitbox_world(i)
		var hurt := hurtbox_world(1 - i)
		if hit.size != Vector2i.ZERO and hurt.size != Vector2i.ZERO and hit.intersects(hurt):
			hits.append(i)
	# Os dois golpes são aplicados no mesmo quadro (troca), sem favorecer o jogador 1.
	var blocked := {}
	var attacks := {}
	for i in hits:
		blocked[i] = _is_blocking(1 - i, i)
		attacks[i] = current_attack(i)
	for i in hits:
		_apply_hit(i, 1 - i, attacks[i], blocked[i])


func _is_blocking(defender: int, attacker: int) -> bool:
	var f := fighters[defender]
	if f.is_airborne() or not f.state in [S.IDLE, S.WALK_B, S.CROUCH, S.BLOCKSTUN]:
		return false
	var bits := f.last_input()
	var away := signi(f.x - fighters[attacker].x)
	if away == 0:
		away = -f.facing
	var holding_away := (away > 0 and bits & InputBits.RIGHT and not bits & InputBits.LEFT) \
		or (away < 0 and bits & InputBits.LEFT and not bits & InputBits.RIGHT)
	if not holding_away:
		return false
	var crouched := bool(bits & InputBits.DOWN)
	var guard := current_attack(attacker).guard
	if guard == AttackData.Guard.LOW:
		return crouched
	if guard == AttackData.Guard.HIGH:
		return not crouched
	return true


func _apply_hit(attacker: int, defender: int, attack: AttackData, blocked: bool) -> void:
	var a := fighters[attacker]
	var f := fighters[defender]
	a.attack_hit = true
	var contact := _to_world(attack.hitbox, a).intersection(hurtbox_world(defender))
	var push_dir := signi(f.x - a.x) if f.x != a.x else a.facing
	var event := {"x": contact.get_center().x, "y": contact.get_center().y, "attacker": attacker,
		"strength": attack.damage}
	if blocked:
		f.health -= attack.chip_damage
		f.crouching = bool(f.last_input() & InputBits.DOWN)
		f.set_state(S.BLOCKSTUN)
		f.state_frame = -1  # o quadro do impacto não conta no blockstun
		f.stun = attack.blockstun
		f.vx = 0
		a.energy = mini(ENERGY_MAX, a.energy + attack.damage / 4)
		event["type"] = "block"
	else:
		f.combo += 1
		var dealt := attack.damage * combo_scale(f.combo) / 100
		f.health -= dealt
		a.energy = mini(ENERGY_MAX, a.energy + attack.damage / 2)
		f.energy = mini(ENERGY_MAX, f.energy + attack.damage / 4)
		event["type"] = "hit"
		event["damage"] = dealt
		event["combo"] = f.combo
		if f.health <= 0:
			f.health = 0
			_launch(f, push_dir, S.KO)
		elif attack.knockdown or f.is_airborne():
			_launch(f, push_dir, S.KNOCKDOWN)
		else:
			f.crouching = f.state == S.CROUCH or (f.state == S.ATTACK and f.attack_key.begins_with("crouch"))
			f.set_state(S.HITSTUN)
			f.state_frame = -1  # o quadro do impacto não conta no hitstun
			f.stun = attack.hitstun
			f.vx = 0
	f.attack_key = ""
	# Empurrão: se o defensor está na parede, quem recua é o atacante.
	var half := data[defender].push_half_width * SUB
	var at_wall := (push_dir > 0 and f.x >= STAGE_WIDTH * SUB - half - 500) or (push_dir < 0 and f.x <= half + 500)
	if f.state != S.KNOCKDOWN and f.state != S.KO:
		if at_wall:
			a.slide = -push_dir * attack.pushback
		else:
			f.slide = push_dir * attack.pushback
	freeze = maxi(freeze, attack.hitstop)
	events.append(event)


func _launch(f: FighterState, dir: int, state: int) -> void:
	f.set_state(state)
	f.state_frame = 0
	f.stun = -1
	f.vx = dir * KNOCKDOWN_LAUNCH_VX
	f.vy = KNOCKDOWN_LAUNCH_VY
	f.y = maxi(f.y, 1)
	f.slide = 0


# --- avanço dos estados ----------------------------------------------------------------------

func _advance(i: int) -> void:
	var f := fighters[i]
	f.state_frame += 1
	match f.state:
		S.ATTACK:
			var attack := current_attack(i)
			if f.state_frame >= attack.total():
				f.attack_key = ""
				if f.is_airborne():
					f.state = S.AIR
					f.state_frame = 0
				else:
					f.set_state(S.IDLE)
					f.vx = 0
		S.HITSTUN, S.BLOCKSTUN:
			if f.state_frame > 0:
				f.stun -= 1
			if f.stun <= 0:
				f.set_state(S.CROUCH if f.crouching else S.IDLE)
				f.crouching = false
				f.combo = 0  # saiu do hitstun: o próximo acerto começa um combo novo
		S.KNOCKDOWN:
			if not f.is_airborne() and f.stun > 0:
				f.stun -= 1
				if f.stun == 0:
					f.set_state(S.IDLE)
					f.combo = 0
		S.LANDING:
			if f.state_frame >= LANDING_FRAMES:
				f.set_state(S.IDLE)


func _to_world(box: Rect2i, f: FighterState) -> Rect2i:
	var x0 := box.position.x if f.facing > 0 else -box.position.x - box.size.x
	# y do mundo cresce para cima; a caixa tem y negativo para cima a partir dos pés.
	return Rect2i(f.x + x0 * SUB, f.y - (box.position.y + box.size.y) * SUB,
		box.size.x * SUB, box.size.y * SUB)
