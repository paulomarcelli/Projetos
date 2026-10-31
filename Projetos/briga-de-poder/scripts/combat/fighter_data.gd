class_name FighterData
extends Resource
## Atributos de um lutador. O motor de combate é o mesmo para todos; só os dados mudam.
## Velocidades em pixels × FightSim.SUB por quadro.

@export var id := ""
@export var display_name := ""
@export var provisional := true      ## personagem de teste, não faz parte do elenco final
@export var max_health := 1000
@export var walk_forward := 400
@export var walk_back := 320
@export var jump_velocity := 2400
@export var jump_forward := 450
@export var gravity := 120
@export var push_half_width := 55    ## metade da largura do corpo para não atravessar o oponente
@export var hurt_stand := Rect2i(-55, -255, 110, 255)
@export var hurt_crouch := Rect2i(-58, -160, 116, 160)
@export var hurt_air := Rect2i(-50, -220, 100, 190)
@export var color_main := Color.WHITE
@export var color_accent := Color.WHITE
## Chaves: stand_light, stand_medium, stand_heavy, crouch_light, crouch_medium, crouch_heavy,
## air, special.
@export var attacks: Dictionary = {}


func attack(key: String) -> AttackData:
	return attacks.get(key)
