class_name Zona
extends Node2D
## Área que fica no chão por um tempo: fumaça do churrasco (apaga projéteis), nuvem da cloroquina
## (deixa lento), suspensão de conta (bloqueia especiais) e o redemoinho de votos (segue a dona).

var dono: Lutador
var forma := ""
var larg := 200.0
var alt := 230.0
var dur := 120
var dano := 0.0
var intervalo := 20
var efeito := ""
var segue := false
var t := 0
var ativo := true
var _dist := 0.0


func iniciar(de: Lutador, spec: Dictionary) -> void:
	dono = de
	forma = spec.get("forma", "")
	larg = float(spec.get("larg", 200.0)) * Lutador.TAM * 0.8
	dur = int(spec.get("dur", 120))
	dano = float(spec.get("dano", 0.0))
	intervalo = int(spec.get("intervalo", 20))
	efeito = spec.get("efeito", "")
	segue = spec.get("segue", false)
	_dist = float(spec.get("dist", 150.0)) * de.lado
	position = Vector2(clampf(de.position.x + _dist, 80.0, 1200.0), Lutador.CHAO)


## Zona criada no lugar onde algo quebrou (frasco de cloroquina vira nuvem).
func iniciar_em(de: Lutador, x: float, forma_: String) -> void:
	dono = de
	forma = forma_
	larg = 230.0
	dur = 150
	dano = 8.0
	intervalo = 20
	efeito = "lento"
	position = Vector2(x, Lutador.CHAO)


func caixa() -> Rect2:
	return Rect2(position.x - larg / 2.0, position.y - alt, larg, alt)


func pode_ferir() -> bool:
	return dano > 0.0 and t % intervalo == intervalo / 2


func passo() -> void:
	t += 1
	if segue and dono != null:
		position.x = dono.position.x
	if t >= dur:
		ativo = false
	queue_redraw()


func _draw() -> void:
	var k := clampf(minf(t / 12.0, (dur - t) / 15.0), 0.0, 1.0)
	Arte.zona(self, forma, larg, alt, t, k)
