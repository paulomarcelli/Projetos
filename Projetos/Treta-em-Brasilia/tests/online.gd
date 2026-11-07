extends SceneTree
## Teste do online sem rede: duas lutas (anfitrião e convidado) ligadas por uma "ponte" que
## entrega as mensagens com atraso variável e fora de ordem. As duas recebem entradas aleatórias
## (cada lado só conhece a sua) e o estado precisa sair idêntico em todos os quadros.
## Rodar: godot --headless --fixed-fps 60 --path . --script res://tests/online.gd

const QUADROS := 9000
const PARES := [[10, 0, "praca", false], [1, 8, "paulista", true], [3, 9, "casa_branca", false], [5, 6, "usp", true]]

var etapa := -1
var quadro := 0
var a: Luta
var b: Luta
var ponte_ab: Ponte
var ponte_ba: Ponte
var hashes := [{}, {}]
var paradas := [0, 0]
var dessinc := false
var falhas := 0
var cinema_q := 0
var zonas_q := 0
var proj_q := 0


class Ponte:
	var destino: Luta
	var fila: Array = []
	var t := 0
	var rng := RandomNumberGenerator.new()
	var min_q := 2
	var max_q := 7

	func enviar(d: Dictionary) -> void:
		fila.append([t + rng.randi_range(min_q, max_q), d.duplicate()])

	func passo() -> void:
		t += 1
		var resto: Array = []
		for m in fila:
			if m[0] <= t:
				destino.rede_receber(m[1])
			else:
				resto.append(m)
		fila = resto


class Robo:
	## Aperta botões aleatórios por alguns quadros seguidos (como alguém jogando de qualquer jeito).
	var rng := RandomNumberGenerator.new()
	var atual := {}
	var dur := 0

	func ler() -> Dictionary:
		if dur <= 0:
			dur = rng.randi_range(3, 18)
			atual = {}
			var dir := rng.randi_range(0, 5)
			if dir == 1:
				atual["dir"] = true
			elif dir == 2:
				atual["esq"] = true
			elif dir == 3:
				atual["baixo"] = true
			elif dir == 4:
				atual["cima"] = true
			var bt: String = ["", "soco", "chute", "especial", "super", "agarrar", "soco", "chute"][rng.randi_range(0, 7)]
			if bt != "":
				atual[bt] = true
		dur -= 1
		return atual


func _initialize() -> void:
	Config.efeitos = 0.0
	Config.musica = 0.0
	_proxima()


func _proxima() -> void:
	if a != null:
		_conferir_par()
		a.queue_free()
		b.queue_free()
	etapa += 1
	quadro = 0
	hashes = [{}, {}]
	paradas = [0, 0]
	dessinc = false
	cinema_q = 0
	zonas_q = 0
	proj_q = 0
	if etapa >= PARES.size():
		print("ONLINE FALHAS: %d" % falhas)
		quit(1 if falhas > 0 else 0)
		return
	var par: Array = PARES[etapa]
	var semente := 1234 + etapa
	a = Luta.new()
	b = Luta.new()
	ponte_ab = Ponte.new()
	ponte_ba = Ponte.new()
	ponte_ab.destino = b
	ponte_ba.destino = a
	ponte_ab.rng.seed = 7 + etapa
	ponte_ba.rng.seed = 99 + etapa
	for i in 2:
		var l: Luta = [a, b][i]
		l.cenario = par[2]
		l.configurar(Personagens.por_indice(par[0]), Personagens.por_indice(par[1]), true)
		l.configurar_online(ponte_ab if i == 0 else ponte_ba, i, semente, 4)
		var robo := Robo.new()
		robo.rng.seed = 500 + i * 31 + etapa
		l.fonte_local = robo
		l.dessincronizou.connect(func() -> void: dessinc = true)
		root.add_child(l)
		if par[3]:
			# barra cheia nos dois lados: força SUPER e ULTIMATE (com cinemática) no meio da luta
			for lt in l.p:
				lt.barra = 100.0


func _physics_process(_d: float) -> bool:
	if etapa >= PARES.size() or a == null:
		return false
	quadro += 1
	ponte_ab.passo()
	ponte_ba.passo()
	for i in 2:
		var l: Luta = [a, b][i]
		if l.parado_q > 0:
			paradas[i] += 1
		if not hashes[i].has(l.q_sim):
			hashes[i][l.q_sim] = l.estado_hash()
	if not a.cinema.is_empty():
		cinema_q += 1
	if not a.zonas.is_empty():
		zonas_q += 1
	if not a.projeteis.is_empty():
		proj_q += 1
	if quadro >= QUADROS:
		_proxima()
	return false


func _conferir_par() -> void:
	var par: Array = PARES[etapa]
	var comuns := 0
	var diferentes := 0
	var primeiro := -1
	for q in hashes[0]:
		if hashes[1].has(q):
			comuns += 1
			if hashes[0][q] != hashes[1][q]:
				diferentes += 1
				if primeiro < 0 or q < primeiro:
					primeiro = q
	var nomes := "%s x %s" % [Personagens.por_indice(par[0])["nome"], Personagens.por_indice(par[1])["nome"]]
	var ok := diferentes == 0 and not dessinc and comuns > 1000 and a.q_sim > 1000 and b.q_sim > 1000
	if not ok:
		falhas += 1
	print("   cinemática %d quadros, zonas %d, projéteis %d, vidas %d/%d" % [cinema_q, zonas_q, proj_q, a.p[0].vida, a.p[1].vida])
	print("%s %s: quadros %d/%d, iguais %d de %d, diferentes %d (1º em %d), esperas %d/%d, fase %s/%s, vitórias %s %s" % [
		"OK " if ok else "ERRO", nomes, a.q_sim, b.q_sim, comuns - diferentes, comuns, diferentes, primeiro,
		paradas[0], paradas[1], a.fase, b.fase, a.vitorias, b.vitorias])
