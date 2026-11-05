class_name Lutador
extends Node2D
## Um lutador: movimento, golpes com quadros de início/ativo/recuperação, defesa,
## comandos de especial (↓↘→, →↓↘, ↓↙←) e barra de super. Tudo a 60 quadros por segundo.

signal soltou_projetil(lutador: Lutador, eh_super: bool)
signal falou(lutador: Lutador, texto: String)
signal super_ativado(lutador: Lutador)
signal provocou(lutador: Lutador)

enum E { PARADO, ANDANDO, PULANDO, AGACHADO, ATACANDO, ATINGIDO, DEFENDENDO, CAIDO, LEVANTANDO, NOCAUTE, VITORIA, PROVOCANDO, DERROTA }

const CHAO := 640.0
const TAM := 1.35  # tamanho do desenho e das caixas de colisão
const GRAVIDADE := 1.0
const LIMITE_ESQ := 50.0
const LIMITE_DIR := 1230.0
const VAZIO := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false, "especial": false, "provocar": false}

## caixa: retângulo do golpe olhando para a direita, relativo aos pés.
## nivel: alto/medio (defende em pé ou agachado), baixo (só agachado), aereo (só em pé).
const GOLPES := {
	"soco": {"inicio": 4, "ativo": 3, "rec": 9, "dano": 45.0, "caixa": Rect2(20, -152, 82, 28), "atord": 15, "bloq": 9, "empurra": 6.0, "nivel": "alto"},
	"chute": {"inicio": 7, "ativo": 4, "rec": 15, "dano": 75.0, "caixa": Rect2(20, -108, 102, 32), "atord": 18, "bloq": 11, "empurra": 9.0, "nivel": "medio"},
	"soco_baixo": {"inicio": 4, "ativo": 3, "rec": 8, "dano": 35.0, "caixa": Rect2(20, -96, 80, 26), "atord": 13, "bloq": 8, "empurra": 5.0, "nivel": "medio"},
	"rasteira": {"inicio": 8, "ativo": 4, "rec": 20, "dano": 65.0, "caixa": Rect2(10, -32, 128, 30), "atord": 0, "bloq": 12, "empurra": 6.0, "nivel": "baixo", "derruba": true},
	"soco2": {"inicio": 4, "ativo": 3, "rec": 12, "dano": 45.0, "caixa": Rect2(20, -142, 88, 30), "atord": 17, "bloq": 10, "empurra": 5.0, "nivel": "alto"},
	"final": {"inicio": 7, "ativo": 5, "rec": 24, "dano": 95.0, "caixa": Rect2(15, -205, 112, 175), "atord": 0, "bloq": 14, "empurra": 12.0, "nivel": "medio", "derruba": true, "final": true},
	"voadora": {"inicio": 5, "ativo": 12, "rec": 3, "dano": 65.0, "caixa": Rect2(10, -98, 88, 48), "atord": 17, "bloq": 10, "empurra": 5.0, "nivel": "aereo"},
	"investida": {"inicio": 9, "ativo": 18, "rec": 16, "dano": 95.0, "caixa": Rect2(0, -152, 98, 140), "atord": 0, "bloq": 14, "empurra": 10.0, "nivel": "medio", "derruba": true, "especial": true},
	"gancho": {"inicio": 3, "ativo": 12, "rec": 24, "dano": 105.0, "caixa": Rect2(5, -235, 72, 205), "atord": 0, "bloq": 16, "empurra": 4.0, "nivel": "alto", "derruba": true, "especial": true, "invencivel": 9},
	"projetil": {"inicio": 12, "ativo": 1, "rec": 24, "especial": true},
	"super": {"inicio": 26, "ativo": 1, "rec": 30, "especial": true},
}

var dados: Dictionary = {}
var oponente: Lutador
var entrada = null  # objeto com ler() -> Dictionary
var travado := false  # sem controle (intro e fim de round)

var vida := 1000.0
var vida_max := 1000.0
var barra := 0.0  # 0 a 100
var vel := Vector2.ZERO
var lado := 1
var estado: int = E.PARADO
var quadro := 0
var golpe: Dictionary = {}
var golpe_nome := ""
var ja_acertou := false
var atordoado := 0
var invencivel := 0
var flash := 0
var tem_projetil := false
var defendeu_agachado := false
var tempo_vivo := 0  # quadros desde que entrou (respiração, piscadas, gestos)

var _antes: Dictionary = VAZIO.duplicate()
var _buffer: Array[int] = []


func configurar(d: Dictionary, x: float, olhando: int) -> void:
	dados = d
	vida_max = float(d.get("vida", 1000))
	vida = vida_max
	position = Vector2(x, CHAO)
	lado = olhando
	resetar_estado()


func resetar_estado() -> void:
	vel = Vector2.ZERO
	estado = E.PARADO
	quadro = 0
	golpe = {}
	golpe_nome = ""
	atordoado = 0
	invencivel = 0
	flash = 0
	tem_projetil = false
	_buffer.clear()


# ---------------------------------------------------------------- consultas

func no_chao() -> bool:
	return position.y >= CHAO - 0.5


func esta_atacando() -> bool:
	return estado == E.ATACANDO


func nivel_golpe() -> String:
	return golpe.get("nivel", "medio")


func pode_agir() -> bool:
	return estado in [E.PARADO, E.ANDANDO, E.AGACHADO]


func hurtbox() -> Rect2:
	var agachado := estado == E.AGACHADO or (estado == E.ATACANDO and golpe_nome in ["soco_baixo", "rasteira"]) or estado == E.LEVANTANDO
	if estado == E.DEFENDENDO and defendeu_agachado:
		agachado = true
	if agachado:
		return Rect2(position.x - 34 * TAM, position.y - 165 * TAM, 68 * TAM, 165 * TAM)
	return Rect2(position.x - 32 * TAM, position.y - 200 * TAM, 64 * TAM, 200 * TAM)


## Retângulo do golpe em coordenadas da tela, ou null quando o golpe não está ativo.
func caixa_ataque() -> Variant:
	if estado != E.ATACANDO or ja_acertou or not golpe.has("caixa"):
		return null
	var ini: int = golpe["inicio"]
	if quadro < ini or quadro >= ini + int(golpe["ativo"]):
		return null
	var c0: Rect2 = golpe["caixa"]
	var c := Rect2(c0.position * TAM, c0.size * TAM)
	var x := position.x + c.position.x if lado == 1 else position.x - c.position.x - c.size.x
	return Rect2(x, position.y + c.position.y, c.size.x, c.size.y)


# ---------------------------------------------------------------- quadro a quadro

func passo() -> void:
	var e: Dictionary = VAZIO
	if entrada != null and not travado:
		e = entrada.ler()
	var aperto := {}
	for k in ["soco", "chute", "especial", "provocar"]:
		aperto[k] = e.get(k, false) and not _antes.get(k, false)
	_antes = e
	var dirn := _direcao(e)
	_buffer.push_back(dirn)
	if _buffer.size() > 18:
		_buffer.pop_front()

	quadro += 1
	tempo_vivo += 1
	if flash > 0:
		flash -= 1
	if invencivel > 0:
		invencivel -= 1

	match estado:
		E.PARADO, E.ANDANDO, E.AGACHADO:
			_virar()
			if aperto["provocar"] and estado != E.AGACHADO:
				_mudar(E.PROVOCANDO)
				provocou.emit(self)
			elif not _tentar_ataque(e, aperto, dirn):
				_movimento_chao(e)
		E.PROVOCANDO:
			if quadro > 60:
				_mudar(E.PARADO)
		E.PULANDO:
			if aperto["soco"] or aperto["chute"]:
				_iniciar("voadora")
			_fisica_ar()
			if no_chao() and estado == E.PULANDO:
				_mudar(E.PARADO)
		E.ATACANDO:
			if not _encadear(e, aperto, dirn):
				_atualizar_ataque(e)
		E.ATINGIDO, E.DEFENDENDO:
			atordoado -= 1
			position.x += vel.x
			vel.x *= 0.82
			if atordoado <= 0:
				_mudar(E.AGACHADO if e.get("baixo", false) else E.PARADO)
		E.CAIDO, E.NOCAUTE:
			if not no_chao() or vel.y < 0:
				_fisica_ar()
				if no_chao():
					vel = Vector2.ZERO
					quadro = 0
			elif estado == E.CAIDO and quadro > 34:
				_mudar(E.LEVANTANDO)
				invencivel = 26
		E.LEVANTANDO:
			if quadro > 22:
				_mudar(E.PARADO)
		E.VITORIA, E.DERROTA:
			pass

	position.x = clampf(position.x, LIMITE_ESQ, LIMITE_DIR)
	_atualizar_visual()


func _direcao(e: Dictionary) -> int:
	var h := 0
	if e.get("dir", false):
		h += 1
	if e.get("esq", false):
		h -= 1
	h *= lado
	var v := 0
	if e.get("cima", false):
		v = 1
	elif e.get("baixo", false):
		v = -1
	return 5 + h + 3 * v


## Procura a sequência de direções (numeração do teclado numérico) nos últimos quadros.
func _comando(seq: Array) -> bool:
	var i := 0
	var ultimo := -1
	for k in _buffer.size():
		if _buffer[k] == seq[i]:
			i += 1
			ultimo = k
			if i == seq.size():
				return ultimo >= _buffer.size() - 6
	return false


func _virar() -> void:
	if oponente != null and no_chao():
		lado = 1 if oponente.position.x >= position.x else -1


func _mudar(novo: int) -> void:
	if novo != estado:
		estado = novo
		quadro = 0


func _movimento_chao(e: Dictionary) -> void:
	var vm: float = dados.get("velocidade", 1.0)
	var frente: bool = e.get("dir", false) if lado == 1 else e.get("esq", false)
	var tras: bool = e.get("esq", false) if lado == 1 else e.get("dir", false)
	if e.get("cima", false):
		vel = Vector2((6.0 if frente else (-6.0 if tras else 0.0)) * lado * vm, -21.5)
		_mudar(E.PULANDO)
		return
	if e.get("baixo", false):
		_mudar(E.AGACHADO)
		return
	if frente:
		position.x += lado * 4.6 * vm
		_mudar(E.ANDANDO)
	elif tras:
		position.x -= lado * 3.8 * vm
		_mudar(E.ANDANDO)
	else:
		_mudar(E.PARADO)


func _tentar_ataque(e: Dictionary, aperto: Dictionary, dirn: int) -> bool:
	var g := ""
	if aperto["especial"]:
		if e.get("baixo", false) and barra >= 100.0:
			g = "super"
		elif dirn in [7, 8, 9]:
			g = "gancho"
		elif dirn == 6:
			g = "investida"
		else:
			g = "projetil"
	elif aperto["soco"] and _comando([6, 2, 3]):
		g = "gancho"
	elif aperto["soco"] and _comando([2, 3, 6]):
		g = "projetil"
	elif aperto["chute"] and _comando([2, 1, 4]):
		g = "investida"
	elif aperto["soco"]:
		g = "soco_baixo" if e.get("baixo", false) else "soco"
	elif aperto["chute"]:
		g = "rasteira" if e.get("baixo", false) else "chute"
	if g == "projetil" and tem_projetil:
		g = "" if aperto["especial"] else "soco"
	if g == "":
		return false
	_iniciar(g)
	return true


func _iniciar(nome: String) -> void:
	golpe_nome = nome
	golpe = GOLPES[nome].duplicate()
	ja_acertou = false
	if nome != "voadora":
		vel.x = 0.0
	estado = E.ATACANDO
	quadro = 0
	if golpe.has("invencivel"):
		invencivel = golpe["invencivel"]
	if nome == "super":
		barra = 0.0
		invencivel = 30
		super_ativado.emit(self)
	if golpe.get("especial", false) and dados.has("especiais"):
		falou.emit(self, dados["especiais"][nome]["nome"])
	if nome == "final" and dados.has("especiais"):
		falou.emit(self, dados["especiais"]["final"]["nome"])


## Combos: enquanto o golpe acerta (ou é defendido), dá para emendar o próximo.
## Soco > Soco > Chute termina no golpe final do personagem; golpes normais cancelam em especial.
func _encadear(e: Dictionary, aperto: Dictionary, dirn: int) -> bool:
	if not ja_acertou or quadro < int(golpe["inicio"]):
		return false
	if golpe_nome in ["soco", "soco_baixo"] and aperto["soco"]:
		_iniciar("soco2")
		return true
	if golpe_nome == "soco2" and aperto["chute"]:
		_iniciar("final")
		return true
	if golpe_nome in ["soco", "soco2", "chute", "soco_baixo"] and aperto["especial"]:
		return _tentar_ataque(e, aperto, dirn)
	return false


func _atualizar_ataque(e: Dictionary) -> void:
	var ini: int = golpe["inicio"]
	var total: int = ini + int(golpe["ativo"]) + int(golpe["rec"])
	var vm: float = dados.get("velocidade", 1.0)
	match golpe_nome:
		"investida":
			if quadro >= ini and quadro < ini + int(golpe["ativo"]):
				position.x += lado * 12.5 * vm
		"gancho":
			if quadro == ini:
				vel = Vector2(lado * 2.5, -16.0)
		"projetil", "super":
			if quadro == ini:
				soltou_projetil.emit(self, golpe_nome == "super")

	var no_ar := golpe_nome == "voadora" or (golpe_nome == "gancho" and quadro >= ini)
	if no_ar:
		_fisica_ar()
		if no_chao() and (golpe_nome == "voadora" or quadro > ini + 2):
			vel = Vector2.ZERO
			_mudar(E.PARADO)
	elif quadro >= total:
		_mudar(E.AGACHADO if e.get("baixo", false) else E.PARADO)


func _fisica_ar() -> void:
	vel.y += GRAVIDADE
	position += vel
	if position.y >= CHAO:
		position.y = CHAO
		if vel.y > 0:
			vel.y = 0


# ---------------------------------------------------------------- levar golpe

## Recebe um golpe. Devolve "bloqueio", "acerto", "derrubou", "nocaute" ou "" (não pegou).
func receber(g: Dictionary, atacante_x: float) -> String:
	if estado in [E.NOCAUTE, E.CAIDO, E.LEVANTANDO, E.VITORIA, E.DERROTA] or invencivel > 0:
		return ""
	var tras: bool = _antes.get("esq", false) if atacante_x > position.x else _antes.get("dir", false)
	var agachado: bool = _antes.get("baixo", false)
	var pode_bloquear: bool = tras and estado in [E.PARADO, E.ANDANDO, E.AGACHADO, E.DEFENDENDO]
	var nivel: String = g.get("nivel", "medio")
	if pode_bloquear and nivel == "baixo" and not agachado:
		pode_bloquear = false
	if pode_bloquear and nivel == "aereo" and agachado:
		pode_bloquear = false
	var empurrao := 1.0 if position.x >= atacante_x else -1.0
	var dano: float = g.get("dano", 0.0)

	if pode_bloquear:
		if g.get("especial", false):
			vida = maxf(vida - dano * 0.2, 0.0)
		defendeu_agachado = agachado
		_mudar(E.DEFENDENDO)
		quadro = 0
		atordoado = g.get("bloq", 10)
		vel.x = empurrao * float(g.get("empurra", 6.0)) * 0.9
		barra = minf(barra + 3.0, 100.0)
		if vida <= 0.0:
			_cair(empurrao, true)
			return "nocaute"
		return "bloqueio"

	vida = maxf(vida - dano, 0.0)
	barra = minf(barra + 6.0, 100.0)
	flash = 8
	if vida <= 0.0:
		_cair(empurrao, true)
		return "nocaute"
	if g.get("derruba", false) or not no_chao():
		_cair(empurrao, false)
		return "derrubou"
	_mudar(E.ATINGIDO)
	quadro = 0
	atordoado = g.get("atord", 14)
	vel.x = empurrao * float(g.get("empurra", 6.0))
	return "acerto"


func _cair(empurrao: float, nocaute: bool) -> void:
	estado = E.NOCAUTE if nocaute else E.CAIDO
	quadro = 0
	vel = Vector2(empurrao * (7.0 if nocaute else 5.5), -12.0 if nocaute else -10.0)
	if no_chao():
		position.y = CHAO - 1.0


func comemorar() -> void:
	if estado != E.NOCAUTE:
		vel = Vector2.ZERO
		position.y = CHAO
		_mudar(E.VITORIA)


## Perdeu sem ser nocauteado (tempo esgotado): fica de pé, frustrado.
func lamentar() -> void:
	if estado != E.NOCAUTE:
		vel = Vector2.ZERO
		position.y = CHAO
		_mudar(E.DERROTA)


# ---------------------------------------------------------------- desenho

## A pose de cada quadro: corpo, expressão do rosto (folha de expressões) e movimento da cabeça,
## que acompanha o corpo com atraso e reage sozinha (recua no golpe, abaixa na derrota).
func pose() -> Dictionary:
	var p := Desenho.pose_idle(dados, tempo_vivo)
	var t := quadro
	match estado:
		E.PARADO:
			pass
		E.ANDANDO:
			var s := sin(t * 0.3)
			p["pe_f"] = Vector2(20 + s * 13.0, -maxf(0.0, s) * 8.0)
			p["pe_t"] = Vector2(-20 - s * 13.0, -maxf(0.0, -s) * 8.0)
			p["quadril"] = -72.0 - absf(s) * 3.0
			p["cabeca_desl"] = Vector2(0, -absf(sin(t * 0.3 - 0.5)) * 3.0)
			p["cabeca_giro"] = s * 0.05
		E.AGACHADO, E.LEVANTANDO:
			_pose_agachada(p)
			if estado == E.LEVANTANDO:
				p["expr"] = "esforco"
		E.PULANDO:
			p["pe_f"] = Vector2(16, -34)
			p["pe_t"] = Vector2(-14, -26)
			p["mao_f"] = Vector2(30, -150)
			p["cabeca_giro"] = clampf(vel.y * 0.01, -0.12, 0.14)
		E.ATINGIDO:
			var k := clampf(atordoado / 14.0, 0.0, 1.0)
			p["inclina"] = -0.32 * k
			p["expr"] = "dor"
			p["mao_f"] = Vector2(10, -120)
			p["mao_t"] = Vector2(-6, -112)
			p["cabeca_giro"] = -0.42 * k
			p["cabeca_desl"] = Vector2(-8 * k, 2)
		E.DEFENDENDO:
			if defendeu_agachado:
				_pose_agachada(p)
			p["mao_f"] = Vector2(28, -150 + (40 if defendeu_agachado else 0))
			p["mao_t"] = Vector2(32, -126 + (40 if defendeu_agachado else 0))
			p["inclina"] = -0.08
			p["expr"] = "esforco"
			p["cabeca_giro"] = 0.14
			p["cabeca_desl"] = Vector2(2, 4)
		E.PROVOCANDO:
			p = Desenho.pose_provocar(dados, t)
		E.VITORIA:
			p = Desenho.pose_vitoria(dados, t)
		E.DERROTA:
			p = Desenho.pose_derrota(dados, t)
		E.CAIDO, E.NOCAUTE:
			p["expr"] = "nocaute" if estado == E.NOCAUTE else "dor"
			p["giro"] = -1.15 if not no_chao() else -PI / 2.0
			p["cabeca_giro"] = -0.3
			p["mao_f"] = Vector2(30, -150)
			p["mao_t"] = Vector2(-20, -150)
		E.ATACANDO:
			_pose_ataque(p)
	return p


func _pose_agachada(p: Dictionary) -> void:
	p["agachado"] = true
	p["quadril"] = -42.0
	p["pe_f"] = Vector2(28, 0)
	p["pe_t"] = Vector2(-26, 0)
	p["mao_f"] = Vector2(32, -98)
	p["mao_t"] = Vector2(14, -92)


func _pose_ataque(p: Dictionary) -> void:
	var ini: int = golpe["inicio"]
	var ativo: int = golpe["ativo"]
	var t := quadro
	p["mao_t"] = Vector2(18, -122)
	p["prop_t"] = ""
	# 0 = recolhido, 1 = esticado
	var k := 0.0
	if t < ini:
		k = -0.2
	elif t < ini + ativo:
		k = 1.0
	else:
		k = clampf(1.0 - float(t - ini - ativo) / maxf(1.0, float(golpe["rec"])), 0.0, 1.0)
	var forte: bool = golpe.get("especial", false) or golpe_nome in ["final", "voadora", "super"]
	p["expr"] = "grito" if forte else "esforco"
	p["cabeca_giro"] = (-0.08 if t < ini else 0.14 * maxf(k, 0.0))
	p["cabeca_desl"] = Vector2(4 * maxf(k, 0.0), 0)
	match golpe_nome:
		"soco":
			p["mao_f"] = Vector2(36, -128).lerp(Vector2(98, -140), maxf(k, 0.0))
			p["punho_grande"] = k > 0.5
			p["inclina"] = 0.12 * k
		"soco2":
			p["mao_t"] = Vector2(18, -122).lerp(Vector2(96, -128), maxf(k, 0.0))
			p["mao_f"] = Vector2(20, -112)
			p["inclina"] = 0.16 * k
		"final":
			p["mao_f"] = Vector2(30, -110).lerp(Vector2(104, -196), maxf(k, 0.0))
			p["punho_grande"] = true
			p["inclina"] = 0.28 * maxf(k, 0.0)
			p["pe_t"] = Vector2(-34, 0)
			p["boca"] = "grito"
			if dados.has("especiais"):
				p["prop"] = dados["especiais"]["gancho"].get("prop", "")
		"chute":
			p["pe_f"] = Vector2(20, 0).lerp(Vector2(112, -96), maxf(k, 0.0))
			p["inclina"] = -0.18 * maxf(k, 0.0)
		"soco_baixo":
			_pose_agachada(p)
			p["mao_f"] = Vector2(32, -98).lerp(Vector2(96, -84), maxf(k, 0.0))
			p["punho_grande"] = k > 0.5
		"rasteira":
			_pose_agachada(p)
			p["quadril"] = -34.0
			p["pe_f"] = Vector2(28, 0).lerp(Vector2(128, -6), maxf(k, 0.0))
			p["inclina"] = -0.25 * maxf(k, 0.0)
		"voadora":
			p["pe_f"] = Vector2(84, -52)
			p["pe_t"] = Vector2(-8, -40)
			p["inclina"] = -0.2
			p["boca"] = "grito"
		"investida":
			p["inclina"] = 0.32
			p["mao_f"] = Vector2(78, -122)
			p["mao_t"] = Vector2(56, -108)
			p["punho_grande"] = true
			p["boca"] = "grito"
			if dados.get("id", "") == "lula" and t >= ini:
				p["mao_f"] = Vector2(70, -170)
			if dados.get("id", "") == "bolsonaro":
				p["chapeu"] = "boina"
		"gancho":
			p["mao_f"] = Vector2(34, -128).lerp(Vector2(46, -238), maxf(k, 0.0))
			p["punho_grande"] = true
			p["boca"] = "grito"
			if dados.has("especiais"):
				p["prop"] = dados["especiais"]["gancho"].get("prop", "")
		"projetil", "super":
			if t < ini:
				p["mao_f"] = Vector2(-6, -112)
				p["mao_t"] = Vector2(-16, -104)
				p["inclina"] = -0.12
			else:
				p["mao_f"] = Vector2(82, -126)
				p["mao_t"] = Vector2(70, -116)
				p["inclina"] = 0.12
				p["boca"] = "grito"


func _draw() -> void:
	if dados.is_empty():
		return
	if estado == E.ATACANDO and golpe_nome == "investida" and dados.has("especiais"):
		Desenho.veiculo(self, dados["especiais"]["investida"]["forma"], quadro)
	Desenho.lutador(self, dados, _pose_atual)


var _pose_atual: Dictionary = Desenho.pose_padrao()


## Espelho (lado), giro ao cair e piscar ao apanhar ficam no próprio nó.
func _atualizar_visual() -> void:
	_pose_atual = pose()
	var giro: float = _pose_atual["giro"]
	var alt: float = dados.get("corpo", {}).get("alt", 1.0)
	scale = Vector2(lado, 1) * TAM * alt
	rotation = giro * lado
	if giro != 0.0 and no_chao():
		_pose_atual["quadril"] = -72.0
	modulate = Color(1.0, 0.55, 0.55) if (flash > 0 and flash % 2 == 0) else Color.WHITE
	queue_redraw()
