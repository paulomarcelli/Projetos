class_name Projetil
extends Node2D
## Projétil dos especiais (picanha, cloroquina, inquérito...). O super usa o mesmo, maior.

var dono: Lutador
var dir := 1
var velocidade := 9.0
var forma := ""
var tamanho := 1.0
var eh_super := false
var golpe: Dictionary = {}
var ativo := true
var t := 0


func iniciar(de: Lutador, super_: bool) -> void:
	dono = de
	dir = de.lado
	eh_super = super_
	var esp: Dictionary = de.dados["especiais"]["super" if super_ else "projetil"]
	forma = esp["forma"]
	tamanho = 2.3 if super_ else 1.0
	velocidade = 11.0 if super_ else 8.5
	var forca: float = de.dados.get("forca", 1.0)
	golpe = {
		"dano": (280.0 if super_ else 85.0) * forca, "atord": 20, "bloq": 16, "empurra": 9.0,
		"nivel": "medio", "especial": true, "derruba": super_, "super": super_,
	}
	position = de.position + Vector2(de.lado * 95.0, -165.0)
	scale = Vector2(dir, 1) * 1.35


func passo() -> void:
	t += 1
	position.x += dir * velocidade
	if position.x < -150.0 or position.x > 1430.0:
		ativo = false
	queue_redraw()


func caixa() -> Rect2:
	var s := 62.0 * tamanho
	return Rect2(position.x - s / 2.0, position.y - s * 0.4, s, s * 0.8)


func _draw() -> void:
	if eh_super:
		draw_circle(Vector2.ZERO, 34.0 * tamanho * (1.0 + sin(t * 0.4) * 0.08), Color(1, 0.85, 0.3, 0.35))
	Desenho.projetil(self, forma, tamanho, t)
