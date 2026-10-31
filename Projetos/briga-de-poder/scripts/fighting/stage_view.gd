extends Node2D
## Arena de testes provisória: fundo, chão e limites. Desenhada em código (sem texturas)
## e com pouco contraste para não atrapalhar a leitura dos lutadores e dos golpes.

const SKY_TOP := Color("120b26")
const SKY_BOTTOM := Color("2a1747")
const FLOOR := Color("1b1233")
const FLOOR_LINE := Color("ffc23d")
const GRID := Color(1, 1, 1, 0.05)

const _FONT := preload("res://assets/fonts/BarlowCondensed-Bold.ttf")

var origin := Vector2.ZERO  ## tela: canto esquerdo da arena, na altura do chão


func _draw() -> void:
	var size := get_viewport_rect().size
	var stage_w := FightSim.STAGE_WIDTH
	# céu em faixas (degradê simples e barato)
	var bands := 12
	for i in bands:
		var t := float(i) / bands
		draw_rect(Rect2(0, origin.y * t, size.x, origin.y / bands + 1), SKY_TOP.lerp(SKY_BOTTOM, t))
	# parede do fundo com marcações a cada 100 px (ajudam a ler distâncias no modo de teste)
	for x in range(0, stage_w + 1, 100):
		draw_line(Vector2(origin.x + x, origin.y - 420), Vector2(origin.x + x, origin.y), GRID, 2)
	draw_string(_FONT, Vector2(origin.x, origin.y - 440), "ARENA DE TESTES · PROVISÓRIA",
		HORIZONTAL_ALIGNMENT_CENTER, stage_w, 34, Color(1, 1, 1, 0.12))
	# chão
	draw_rect(Rect2(0, origin.y, size.x, size.y - origin.y), FLOOR)
	draw_line(Vector2(origin.x, origin.y), Vector2(origin.x + stage_w, origin.y), FLOOR_LINE, 4)
	# limites da arena (cantos)
	for x in [origin.x, origin.x + stage_w]:
		draw_line(Vector2(x, origin.y - 600), Vector2(x, origin.y + 40), Color(FLOOR_LINE, 0.35), 3)
