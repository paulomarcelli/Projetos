extends RefCounted
## Testes do motor de luta (Fase 2). Os códigos T-xx correspondem aos testes de aceitação do
## estudo em docs/research/re-street-fighter-ii-snes/clone/parity.md.

const S := FighterState.State
const B = preload("res://scripts/combat/input_bits.gd")
const ROCHA := "res://data/characters/rocha.tres"
const FAISCA := "res://data/characters/faisca.tres"

var check: Callable


func run(check_fn: Callable) -> void:
	check = check_fn
	print("Motor de luta")
	_test_round_rules()
	_test_active_frames()
	_test_hitstun_and_advantage()
	_test_block_chip_pushback()
	_test_guard_levels()
	_test_hitstop()
	_test_knockdown()
	_test_combo_and_scaling()
	_test_cancel_and_specials()
	_test_buffer()
	_test_movement()
	_test_fighters_differ()
	_test_determinism()


# --- utilitários ------------------------------------------------------------------------------

## Luta já no FIGHT, lutadores a `gap` pixels, P1 à esquerda olhando para a direita.
func _sim(gap_px: int, p1 := ROCHA, p2 := FAISCA) -> FightSim:
	var sim := FightSim.new(load(p1), load(p2))
	sim.start_match()
	while sim.phase != FightSim.Phase.FIGHT:
		sim.step([0, 0])
	var center := FightSim.STAGE_WIDTH * FightSim.SUB / 2
	sim.fighters[0].x = center - gap_px * FightSim.SUB / 2
	sim.fighters[1].x = center + gap_px * FightSim.SUB / 2
	return sim


func _run(sim: FightSim, frames: int, p1 := 0, p2 := 0) -> void:
	for i in frames:
		sim.step([p1, p2])


## Aperta um botão por um quadro.
func _tap(sim: FightSim, p1 := 0, p2 := 0) -> void:
	sim.step([p1, p2])


func _until(sim: FightSim, cond: Callable, limit := 600, p1 := 0, p2 := 0) -> int:
	var n := 0
	while not cond.call() and n < limit:
		sim.step([p1, p2])
		n += 1
	return n


# --- testes -----------------------------------------------------------------------------------

func _test_round_rules() -> void:
	# T-01: vida a zero encerra o round com vitória do outro
	var sim := _sim(150)
	sim.fighters[1].health = 1
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.phase == FightSim.Phase.ROUND_RESULT)
	check.call(sim.round_winner == 0 and sim.wins == [1, 0], "T-01 nocaute dá o round a quem bateu")
	# T-02: tempo esgotado, vence quem tem mais vida
	sim = _sim(600)
	sim.fighters[1].health -= 10
	sim.timer_frames = 2
	_until(sim, func(): return sim.phase == FightSim.Phase.ROUND_RESULT)
	check.call(sim.round_winner == 0, "T-02 tempo esgotado: vence quem tem mais vida")
	# T-03: vida igual no fim do tempo e nocaute duplo não dão vitória a ninguém
	sim = _sim(600)
	sim.timer_frames = 2
	_until(sim, func(): return sim.phase == FightSim.Phase.ROUND_RESULT)
	check.call(sim.round_winner == 2 and sim.wins == [0, 0], "T-03 vida igual no tempo: round empatado")
	sim = _sim(600)
	sim.fighters[0].health = 0
	sim.fighters[1].health = 0
	_until(sim, func(): return sim.phase == FightSim.Phase.ROUND_RESULT)
	check.call(sim.round_winner == 2 and sim.wins == [0, 0], "T-03 nocaute duplo: round empatado")
	# T-04: duas vitórias encerram a luta
	sim = _sim(150)
	sim.wins = [1, 0]
	sim.fighters[1].health = 1
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.phase == FightSim.Phase.MATCH_END)
	check.call(sim.match_winner == 0 and sim.phase == FightSim.Phase.MATCH_END, "T-04 segunda vitória encerra a luta")
	# T-05: limite de rounds encerra empates seguidos
	sim = _sim(600)
	sim.round_number = FightSim.MAX_ROUNDS
	sim.wins = [1, 1]
	sim.timer_frames = 2
	_until(sim, func(): return sim.phase == FightSim.Phase.MATCH_END)
	check.call(sim.match_winner == 2, "T-05 último round empatado encerra a luta em empate")
	# round seguinte reinicia vida e posições
	sim = _sim(150)
	sim.fighters[1].health = 1
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.phase == FightSim.Phase.INTRO)
	check.call(sim.round_number == 2 and sim.fighters[1].health == sim.data[1].max_health, "novo round restaura a vida")


func _test_active_frames() -> void:
	# T-06: só acerta nos quadros ativos e dentro do alcance
	var sim := _sim(150)
	var jab := sim.data[0].attack("stand_light")
	var hp := sim.fighters[1].health
	_tap(sim, B.LIGHT)
	var hit_frame := 1 + _until(sim, func(): return sim.fighters[1].health < hp, 40)
	check.call(hit_frame == jab.startup + 1, "T-06 o golpe acerta no 1º quadro ativo (quadro %d)" % hit_frame)
	sim = _sim(500)
	hp = sim.fighters[1].health
	_tap(sim, B.LIGHT)
	_run(sim, 30)
	check.call(sim.fighters[1].health == hp, "T-06 fora do alcance não acerta")


func _test_hitstun_and_advantage() -> void:
	# T-07: em hitstun o lutador não age
	var sim := _sim(150)
	var hp := sim.fighters[1].health
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[1].health < hp, 40)
	var acted := false
	while sim.fighters[1].state == S.HITSTUN:
		sim.step([0, B.HEAVY if sim.frame % 2 == 0 else 0])
		if sim.fighters[1].state == S.ATTACK:
			acted = true
	check.call(not acted, "T-07 hitstun impede ações")
	# T-10: vantagem de quadro medida = prevista pelos dados
	sim = _sim(150)
	var jab := sim.data[0].attack("stand_light")
	hp = sim.fighters[1].health
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[1].health < hp, 40)
	var a_free := 0
	var d_free := 0
	var n := 0
	while (a_free == 0 or d_free == 0) and n < 120:
		n += 1
		sim.step([0, 0])
		if sim.freeze > 0:
			n -= 1  # pausa de impacto não conta
		if a_free == 0 and sim.is_actionable(0):
			a_free = n
		if d_free == 0 and sim.is_actionable(1):
			d_free = n
	var expected := jab.hitstun - (jab.active - 1 + jab.recovery)
	check.call(d_free - a_free == expected, "T-10 vantagem no acerto do jab: %+d (previsto %+d)" % [d_free - a_free, expected])


func _test_block_chip_pushback() -> void:
	# T-08: defesa de golpe normal não tira vida; especial tira só o raspão
	var sim := _sim(150)
	var hp := sim.fighters[1].health
	_tap(sim, B.HEAVY, B.RIGHT)
	_run(sim, 40, 0, B.RIGHT)
	check.call(sim.fighters[1].health == hp, "T-08 golpe normal defendido não tira vida")
	sim = _sim(300)
	hp = sim.fighters[1].health
	var special := sim.data[0].attack("special")
	for d in [B.DOWN, B.DOWN | B.RIGHT, B.RIGHT]:
		sim.step([d, B.RIGHT])
	sim.step([B.RIGHT | B.LIGHT, B.RIGHT])
	_run(sim, 60, 0, B.RIGHT)
	check.call(hp - sim.fighters[1].health == special.chip_damage, "T-08 especial defendido tira só o raspão (%d)" % (hp - sim.fighters[1].health))
	# T-09: acerto empurra
	sim = _sim(150)
	var before := sim.fighters[1].x - sim.fighters[0].x
	_tap(sim, B.MEDIUM)
	_run(sim, 40)
	check.call(sim.fighters[1].x - sim.fighters[0].x > before, "T-09 acerto afasta os lutadores")
	# empurrão na parede: quem recua é o atacante
	sim = _sim(150)
	var wall := FightSim.STAGE_WIDTH * FightSim.SUB - sim.data[1].push_half_width * FightSim.SUB
	sim.fighters[1].x = wall
	sim.fighters[0].x = wall - 150 * FightSim.SUB
	var p1_before := sim.fighters[0].x
	_tap(sim, B.MEDIUM)
	_run(sim, 40)
	check.call(sim.fighters[0].x < p1_before and sim.fighters[1].x == wall, "T-09 na parede o atacante é que recua")


func _test_guard_levels() -> void:
	var sim := _sim(150)
	var hp := sim.fighters[1].health
	_tap(sim, B.DOWN | B.LIGHT, B.RIGHT)  # golpe baixo contra defesa em pé
	_run(sim, 30, 0, B.RIGHT)
	check.call(sim.fighters[1].health < hp, "golpe baixo vence defesa em pé")
	sim = _sim(150)
	hp = sim.fighters[1].health
	_tap(sim, B.DOWN | B.LIGHT, B.RIGHT | B.DOWN)
	_run(sim, 30, 0, B.RIGHT | B.DOWN)
	check.call(sim.fighters[1].health == hp, "defesa agachada segura golpe baixo")
	# golpe aéreo (alto) contra defesa agachada: pulo para frente, golpe na descida
	sim = _sim(260)
	hp = sim.fighters[1].health
	_tap(sim, B.UP | B.RIGHT, B.RIGHT | B.DOWN)
	_run(sim, 28, 0, B.RIGHT | B.DOWN)
	_tap(sim, B.HEAVY, B.RIGHT | B.DOWN)
	_run(sim, 30, 0, B.RIGHT | B.DOWN)
	check.call(sim.fighters[1].health < hp, "golpe aéreo vence defesa agachada")


func _test_hitstop() -> void:
	# T-11: na pausa de impacto nada se move e o golpe não avança
	var sim := _sim(150)
	var hp := sim.fighters[1].health
	_tap(sim, B.HEAVY)
	_until(sim, func(): return sim.fighters[1].health < hp, 40)
	var stop := sim.data[0].attack("stand_heavy").hitstop
	var snap := [sim.fighters[0].state_frame, sim.fighters[1].x, sim.fighters[1].stun]
	_run(sim, stop)
	var same: bool = [sim.fighters[0].state_frame, sim.fighters[1].x, sim.fighters[1].stun] == snap
	sim.step([0, 0])
	var moved: bool = sim.fighters[0].state_frame != snap[0]
	check.call(same and moved, "T-11 pausa de impacto dura %d quadros e congela os dois" % stop)


func _test_knockdown() -> void:
	# T-13: rasteira derruba; no chão não leva golpe até levantar
	var sim := _sim(170)
	var hp := sim.fighters[1].health
	_tap(sim, B.DOWN | B.HEAVY)
	_until(sim, func(): return sim.fighters[1].state == S.KNOCKDOWN, 40, B.DOWN)
	check.call(sim.fighters[1].state == S.KNOCKDOWN, "T-13 rasteira derruba")
	_until(sim, func(): return not sim.fighters[1].is_airborne(), 80)
	var hp_down := sim.fighters[1].health
	sim.fighters[0].x = sim.fighters[1].x - 140 * FightSim.SUB
	_tap(sim, B.DOWN | B.LIGHT)
	_run(sim, 12)
	check.call(sim.fighters[1].health == hp_down and hp_down < hp, "T-13 caído não pode ser acertado")
	_until(sim, func(): return sim.fighters[1].state == S.IDLE, 120)
	check.call(sim.fighters[1].state == S.IDLE, "lutador levanta depois da queda")
	# golpe em quem está no ar também derruba
	sim = _sim(170)
	_tap(sim, B.HEAVY)
	_run(sim, 9)
	_tap(sim, 0, B.UP)  # pula logo antes de o golpe ficar ativo
	_until(sim, func(): return sim.fighters[1].state == S.KNOCKDOWN, 30)
	check.call(sim.fighters[1].state == S.KNOCKDOWN, "acerto no ar derruba")


func _test_combo_and_scaling() -> void:
	# T-14: jab + jab emendados formam combo (o oponente nunca recupera o controle)
	var sim := _sim(140)
	var hp := sim.fighters[1].health
	var free_between := false
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[1].health < hp, 40)
	for i in 30:
		var press := B.LIGHT if sim.is_actionable(0) and sim.fighters[1].combo == 1 else 0
		sim.step([press, 0])
		if sim.is_actionable(1) and sim.fighters[1].combo < 2:
			free_between = true
		if sim.fighters[1].combo >= 2:
			break
	check.call(sim.fighters[1].combo == 2 and not free_between, "T-14 jab, jab emendados formam combo de 2")
	# T-16: redução de dano
	check.call(FightSim.combo_scale(1) == 100 and FightSim.combo_scale(3) == 80 and FightSim.combo_scale(20) == 30,
		"T-16 redução de dano 100% → 80% no 3º acerto, piso de 30%")
	sim = _sim(140)
	sim.fighters[1].combo = 2  # próximo acerto é o 3º
	sim.fighters[1].state = S.HITSTUN
	sim.fighters[1].stun = 30
	hp = sim.fighters[1].health
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[1].health < hp, 40)
	var dmg := sim.data[0].attack("stand_light").damage
	check.call(hp - sim.fighters[1].health == dmg * 80 / 100, "T-16 3º acerto do combo causa 80% do dano")


func _test_cancel_and_specials() -> void:
	# T-17: comando de movimento + botão sai o especial (Rocha: baixo, diagonal, frente)
	var sim := _sim(600)
	for d in [B.DOWN, B.DOWN | B.RIGHT, B.RIGHT]:
		sim.step([d, 0])
	sim.step([B.RIGHT | B.MEDIUM, 0])
	check.call(sim.fighters[0].attack_key == "special", "T-17 Rocha: baixo, diagonal, frente + ataque = especial")
	# Faísca (P2, olhando para a esquerda): frente, baixo, diagonal
	sim = _sim(600)
	for d in [B.LEFT, B.DOWN, B.DOWN | B.LEFT]:
		sim.step([0, d])
	sim.step([0, B.DOWN | B.LEFT | B.HEAVY])
	check.call(sim.fighters[1].attack_key == "special", "T-17 Faísca: frente, baixo, diagonal + ataque = especial (lado direito)")
	# comando incompleto não sai especial
	sim = _sim(600)
	sim.step([B.DOWN, 0])
	sim.step([B.RIGHT | B.LIGHT, 0])
	check.call(sim.fighters[0].attack_key == "stand_light", "comando incompleto vira golpe normal")
	# T-15: cancelamento: jab que acertou vira especial antes de terminar
	sim = _sim(150)
	var jab := sim.data[0].attack("stand_light")
	var hp := sim.fighters[1].health
	_tap(sim, B.DOWN | B.LIGHT)
	_until(sim, func(): return sim.fighters[1].health < hp, 40, B.DOWN)
	var started := sim.fighters[0].state_frame
	for d in [B.DOWN | B.RIGHT, B.RIGHT]:
		sim.step([d, 0])
	sim.step([B.RIGHT | B.HEAVY, 0])
	_until(sim, func(): return sim.freeze == 0, 20)
	sim.step([0, 0])
	check.call(sim.fighters[0].attack_key == "special" and started < jab.total(), "T-15 golpe que conectou cancela em especial")
	# golpe que errou não cancela
	sim = _sim(600)
	_tap(sim, B.DOWN | B.LIGHT)
	for d in [B.DOWN | B.RIGHT, B.RIGHT]:
		sim.step([d, 0])
	sim.step([B.RIGHT | B.HEAVY, 0])
	check.call(sim.fighters[0].attack_key == "crouch_light", "golpe que errou não cancela")
	# especial de Faísca é invulnerável no início
	sim = _sim(170)
	var faisca_special := sim.data[1].attack("special")
	for d in [B.LEFT, B.DOWN, B.DOWN | B.LEFT]:
		sim.step([0, d])
	sim.step([0, B.DOWN | B.LEFT | B.LIGHT])
	check.call(sim.hurtbox_world(1).size == Vector2i.ZERO and faisca_special.invulnerable_until > 0, "especial de Faísca começa invulnerável")


func _test_buffer() -> void:
	# T-19: botão apertado pouco antes do fim da recuperação sai no 1º quadro livre
	var sim := _sim(600)
	_tap(sim, B.HEAVY)
	_until(sim, func(): return sim.fighters[0].state_frame >= sim.data[0].attack("stand_heavy").total() - 3, 60)
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[0].state != S.ATTACK, 10)
	sim.step([0, 0])
	check.call(sim.fighters[0].attack_key == "stand_light" and sim.fighters[0].state_frame == 1, "T-19 botão guardado no buffer sai no 1º quadro livre")
	# fora da janela é descartado
	sim = _sim(600)
	_tap(sim, B.HEAVY)
	_run(sim, 2)
	_tap(sim, B.LIGHT)
	_until(sim, func(): return sim.fighters[0].state != S.ATTACK, 60)
	_run(sim, 2)
	check.call(sim.fighters[0].state == S.IDLE, "aperto fora da janela de buffer é descartado")


func _test_movement() -> void:
	var sim := _sim(600)
	var x0 := sim.fighters[0].x
	_run(sim, 30, B.RIGHT)
	check.call(sim.fighters[0].x - x0 == 30 * sim.data[0].walk_forward, "andar para frente na velocidade do lutador")
	_run(sim, 1, B.UP)
	var air := _until(sim, func(): return not sim.fighters[0].is_airborne(), 120)
	check.call(air > 30 and air < 60, "pulo dura entre 30 e 60 quadros (%d)" % air)
	_run(sim, 400, B.LEFT)
	check.call(sim.fighters[0].x == sim.data[0].push_half_width * FightSim.SUB, "parede segura o lutador")
	# lutadores não se atravessam no chão
	sim = _sim(120)
	_run(sim, 60, B.RIGHT, B.LEFT)
	var dist := sim.fighters[1].x - sim.fighters[0].x
	check.call(dist >= (sim.data[0].push_half_width + sim.data[1].push_half_width) * FightSim.SUB, "corpos não se atravessam")
	# virar de lado depois de passar para o outro lado no ar
	sim = _sim(300)
	_run(sim, 1, B.UP)
	_run(sim, 10)
	sim.fighters[0].x = sim.fighters[1].x + 250 * FightSim.SUB
	_until(sim, func(): return not sim.fighters[0].is_airborne(), 120)
	_run(sim, 6)
	check.call(sim.fighters[0].x > sim.fighters[1].x and sim.fighters[0].facing == -1, "ao passar por cima, o lutador vira para o oponente")


func _test_fighters_differ() -> void:
	var a: FighterData = load(ROCHA)
	var b: FighterData = load(FAISCA)
	check.call(a.max_health > b.max_health and a.walk_forward < b.walk_forward, "Rocha resiste mais, Faísca anda mais rápido")
	check.call(a.attack("special").motion != b.attack("special").motion, "especiais com comandos diferentes")
	check.call(a.provisional and b.provisional, "lutadores marcados como provisórios")
	var keys := ["stand_light", "stand_medium", "stand_heavy", "crouch_light", "crouch_medium", "crouch_heavy", "air", "special"]
	check.call(keys.all(func(k): return a.attack(k) != null and b.attack(k) != null), "os dois têm os 8 golpes")


func _test_determinism() -> void:
	# mesmas entradas → mesmo resultado; restaurar um estado e repetir dá o mesmo final
	var inputs := _random_inputs(1200, 7)
	var first := _replay(inputs)
	var second := _replay(inputs)
	check.call(first == second, "simulação determinística (1200 quadros, mesma soma de verificação)")
	var sim := FightSim.new(load(ROCHA), load(FAISCA))
	sim.start_match()
	for i in 600:
		sim.step(inputs[i])
	var snap := sim.snapshot()
	for i in range(600, 1200):
		sim.step(inputs[i])
	var end_a := sim.checksum()
	sim.restore(snap)
	for i in range(600, 1200):
		sim.step(inputs[i])
	check.call(sim.checksum() == end_a, "restaurar estado e ressimular dá o mesmo resultado (base do rollback)")
	check.call(end_a == first, "estado final igual ao da execução direta")


func _random_inputs(count: int, seed_value: int) -> Array:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	var list := []
	for i in count:
		list.append([rng.randi() & 127, rng.randi() & 127])
	return list


func _replay(inputs: Array) -> int:
	var sim := FightSim.new(load(ROCHA), load(FAISCA))
	sim.start_match()
	for frame_inputs in inputs:
		sim.step(frame_inputs)
	return sim.checksum()
