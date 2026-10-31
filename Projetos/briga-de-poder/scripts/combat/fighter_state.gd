class_name FighterState
extends RefCounted
## Estado de um lutador num quadro. Só inteiros, para a simulação ser determinística e poder
## ser copiada e restaurada (base do rollback na Fase 6).

enum State { IDLE, WALK_F, WALK_B, CROUCH, AIR, ATTACK, LANDING, HITSTUN, BLOCKSTUN, KNOCKDOWN, KO }

const HISTORY_SIZE := 32

var x := 0
var y := 0              ## altura acima do chão (0 = no chão)
var vx := 0
var vy := 0
var facing := 1         ## 1 olha para a direita, -1 para a esquerda
var state: State = State.IDLE
var state_frame := 0
var stun := 0           ## quadros restantes de hitstun/blockstun/chão
var attack_key := ""
var attack_hit := false ## o golpe atual já conectou (acertou ou foi defendido)
var air_attack_used := false
var crouching := false  ## agachado ao sofrer o golpe (caixa de corpo baixa)
var health := 0
var energy := 0
var combo := 0          ## acertos seguidos sofridos
var slide := 0          ## empurrão ainda a aplicar
var pressed_at: Array[int] = [-1000, -1000, -1000]  ## quadro do último aperto de leve/médio/forte
var history: Array[int] = []                        ## entradas dos últimos quadros (mais recente no fim)


func is_airborne() -> bool:
	return y > 0


func last_input() -> int:
	return history[-1] if not history.is_empty() else 0


func previous_input() -> int:
	return history[-2] if history.size() >= 2 else 0


func push_input(bits: int) -> void:
	history.append(bits)
	if history.size() > HISTORY_SIZE:
		history.remove_at(0)


func set_state(new_state: State) -> void:
	if state != new_state:
		state = new_state
		state_frame = 0


func to_dict() -> Dictionary:
	return {
		"x": x, "y": y, "vx": vx, "vy": vy, "facing": facing, "state": state,
		"state_frame": state_frame, "stun": stun, "attack_key": attack_key,
		"attack_hit": attack_hit, "air_attack_used": air_attack_used, "crouching": crouching,
		"health": health, "energy": energy, "combo": combo, "slide": slide,
		"pressed_at": pressed_at.duplicate(), "history": history.duplicate(),
	}


func from_dict(d: Dictionary) -> void:
	for key in d:
		var value = d[key]
		if value is Array:
			value = value.duplicate()
		set(key, value)
