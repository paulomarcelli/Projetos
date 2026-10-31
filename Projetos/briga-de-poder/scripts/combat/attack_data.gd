class_name AttackData
extends Resource
## Um golpe. Tempos em quadros (60 por segundo), distâncias em pixels × FightSim.SUB.
## A caixa de golpe é relativa aos pés do lutador olhando para a direita (y negativo = para cima).

enum Guard { HIGH, MID, LOW }  # HIGH: defende em pé; LOW: defende agachado; MID: os dois

@export var display_name := ""
@export var startup := 5        ## quadros antes de a caixa de golpe existir
@export var active := 2         ## quadros em que o golpe pode acertar
@export var recovery := 8       ## quadros até voltar ao controle
@export var damage := 30
@export var chip_damage := 0    ## dano mesmo defendido
@export var hitstun := 12
@export var blockstun := 8
@export var hitstop := 7        ## pausa de impacto
@export var pushback := 1400    ## distância total do empurrão
@export var hitbox := Rect2i()
@export var guard: Guard = Guard.MID
@export var knockdown := false
@export var cancelable := false ## pode ser cancelado em especial ao conectar
@export var motion := ""        ## "", "qcf" (baixo, diagonal, frente) ou "dp" (frente, baixo, diagonal)
@export var move_vx := 0        ## deslocamento por quadro durante startup e active (golpes de avanço)
@export var move_vy := 0        ## impulso vertical no primeiro quadro ativo (golpes que sobem)
@export var invulnerable_until := -1  ## sem caixa de corpo até este quadro (inclusive)


func total() -> int:
	return startup + active + recovery


func is_active(frame: int) -> bool:
	return frame >= startup and frame < startup + active
