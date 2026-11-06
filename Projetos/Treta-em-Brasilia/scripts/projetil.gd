class_name Projetil
extends Node2D
## Projéteis das habilidades: retos, em arco (com quique), bumerangue, de vários acertos,
## ou caindo do céu em cima do rival (chuva, com a sombra avisando onde vai cair).

signal quebrou(p: Projetil)  # caiu no chão (frasco que vira nuvem)

var dono: Lutador
var dir := 1
var vel := Vector2.ZERO
var forma := ""
var tamanho := 1.0
var golpe: Dictionary = {}
var ativo := true
var t := 0
var hits := 1
var intervalo := 10
var hits_feitos := 0
var _prox := 0
var gravidade := 0.0
var quica := 0
var volta := false
var atravessa := false
var ao_quebrar := ""
var queda := false
var atraso := 0
var alvo_x := 0.0
var _voltando := false


func iniciar(de: Lutador, spec: Dictionary) -> void:
	dono = de
	dir = de.lado
	forma = spec.get("forma", "")
	tamanho = spec.get("tam", 1.0)
	var forca: float = de.dados.get("forca", 1.0)
	golpe = {
		"dano": float(spec.get("dano", 70.0)) * forca, "atord": 18, "bloq": 14, "empurra": float(spec.get("empurra", 8.0)),
		"nivel": spec.get("nivel", "medio"), "especial": true, "derruba": spec.get("derruba", false),
		"super": spec.get("atravessa", false), "forca": "forte" if spec.get("derruba", false) else "medio",
	}
	if spec.has("ao_acertar"):
		golpe["ao_acertar"] = spec["ao_acertar"]
	hits = spec.get("hits", 1)
	intervalo = spec.get("intervalo", 10)
	volta = spec.get("volta", false)
	atravessa = spec.get("atravessa", false)
	ao_quebrar = spec.get("ao_quebrar", "")
	quica = spec.get("quica", 0)
	vel = Vector2(dir * float(spec.get("vel", 9.0)), float(spec.get("arco", 0.0)))
	if spec.has("arco"):
		gravidade = 0.75
	position = de.position + Vector2(de.lado * 95.0, float(spec.get("y", -165.0)))
	scale = Vector2(dir, 1) * Lutador.TAM


## Cai do céu sobre x depois de "espera" quadros.
func iniciar_queda(de: Lutador, spec: Dictionary, x: float, espera: int) -> void:
	iniciar(de, spec)
	queda = true
	atraso = espera
	alvo_x = x
	position = Vector2(x, -120.0)
	vel = Vector2(0, 15.0)
	gravidade = 0.0
	scale = Vector2.ONE * Lutador.TAM


func pode_acertar() -> bool:
	return ativo and atraso <= 0 and t >= _prox and hits_feitos < hits


func acertou() -> void:
	hits_feitos += 1
	_prox = t + intervalo
	if hits_feitos >= hits:
		ativo = false


func passo() -> void:
	t += 1
	if atraso > 0:
		atraso -= 1
		queue_redraw()
		return
	if volta:
		if not _voltando and t > 36:
			_voltando = true
		if _voltando:
			vel.x = move_toward(vel.x, -dir * 11.0, 0.6)
			if dono != null and absf(position.x - dono.position.x) < 60.0 and vel.x * dir < 0:
				ativo = false
	vel.y += gravidade
	position += vel
	if position.y >= Lutador.CHAO - 18.0 and (gravidade > 0.0 or queda):
		position.y = Lutador.CHAO - 18.0
		if quica > 0:
			quica -= 1
			vel.y = -absf(vel.y) * 0.55
			vel.x *= 0.8
		else:
			if ao_quebrar != "":
				quebrou.emit(self)
			ativo = false
	if position.x < -200.0 or position.x > 1480.0:
		ativo = false
	queue_redraw()


func caixa() -> Rect2:
	var s := 56.0 * tamanho * (1.0 if not queda else 1.2)
	return Rect2(position.x - s / 2.0, position.y - s * 0.45, s, s * 0.9)


func _draw() -> void:
	if atraso > 0:
		# aviso no chão de onde vai cair
		var y := (Lutador.CHAO - position.y) / scale.y
		var k := 1.0 - float(atraso % 10) / 10.0
		draw_set_transform(Vector2(0, y), 0.0, Vector2(1.0, 0.25))
		draw_circle(Vector2.ZERO, 34.0 * tamanho, Color(0, 0, 0, 0.35))
		draw_arc(Vector2.ZERO, 34.0 * tamanho * (0.6 + 0.4 * k), 0, TAU, 24, Color(1, 0.2, 0.2, 0.8), 4.0)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		return
	if atravessa:
		draw_circle(Vector2.ZERO, 30.0 * tamanho * (1.0 + sin(t * 0.4) * 0.08), Color(1, 0.85, 0.3, 0.3))
	Desenho.projetil(self, forma, tamanho, t)
