class_name Lutador
extends Node2D
## Um lutador, a 60 quadros por segundo.
##
## Golpes normais: soco fraco, soco forte (frente + Soco), soco baixo, chute médio, chute alto
## (frente + Chute), rasteira (baixo + Chute), soco aéreo, voadora e pisão (baixo + Chute no ar).
## Agarrão: botão Agarrar (ou Soco + Chute juntos) de perto; trás + Agarrar joga para trás.
## Dash: dois toques para a frente. Esquiva: dois toques para trás (invencível no começo).
## Defesa: segure para trás. Começar a defender bem na hora do golpe é DEFESA PERFEITA:
## não perde vida e o rival fica desequilibrado (é a janela do contra-ataque).
## Acertar o rival enquanto ele prepara um golpe é CONTRA-ATAQUE (mais dano e mais atordoamento).
## Habilidades (dados em personagens.gd): especiais com recarga, SUPER (meia barra) e ULTIMATE (barra cheia).

signal tiro(lutador: Lutador, spec: Dictionary)
signal zona(lutador: Lutador, spec: Dictionary)
signal chuva(lutador: Lutador, spec: Dictionary)
signal falou(lutador: Lutador, texto: String)
signal poder(lutador: Lutador, tipo: String)  # "super" ou "ultimate" (congela a tela)
signal disparou_ultimate(lutador: Lutador)
signal provocou(lutador: Lutador)
signal evento(lutador: Lutador, nome: String)  # sons e partículas: pulo, aterrissa, dash, golpe, sem_energia...

enum E { PARADO, ANDANDO, PULANDO, AGACHADO, ATACANDO, ATINGIDO, DEFENDENDO, CAIDO, LEVANTANDO, NOCAUTE,
	VITORIA, PROVOCANDO, DERROTA, PRE_PULO, ATERRISSANDO, DASH, AGARRANDO, AGARRADO, DESEQUILIBRADO, CINEMATICA, PRESO }

const CHAO := 640.0
const TAM := 1.35  # tamanho do desenho e das caixas de colisão
const GRAVIDADE := 1.0
const LIMITE_ESQ := 50.0
const LIMITE_DIR := 1230.0
const VAZIO := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false,
	"especial": false, "provocar": false, "super": false, "agarrar": false}
const BARRA_SUPER := 50.0
const BARRA_ULTIMATE := 100.0
const ALCANCE_AGARRAO := 120.0

## caixa: retângulo do golpe olhando para a direita, relativo aos pés (antes do TAM).
## nivel: alto/medio (defende em pé ou agachado), baixo (só agachado), aereo (só em pé).
## forca: fraco/medio/forte (pausa de impacto, tremor, empurrão e som).
const GOLPES := {
	"soco": {"inicio": 3, "ativo": 2, "rec": 8, "dano": 32.0, "caixa": Rect2(20, -152, 80, 26), "atord": 13, "bloq": 8, "empurra": 5.0, "nivel": "alto", "forca": "fraco"},
	"soco2": {"inicio": 4, "ativo": 3, "rec": 10, "dano": 38.0, "caixa": Rect2(20, -142, 88, 30), "atord": 15, "bloq": 9, "empurra": 5.0, "nivel": "alto", "forca": "fraco"},
	"direto": {"inicio": 8, "ativo": 3, "rec": 16, "dano": 72.0, "caixa": Rect2(20, -150, 104, 32), "atord": 20, "bloq": 12, "empurra": 13.0, "nivel": "alto", "forca": "forte"},
	"soco_baixo": {"inicio": 4, "ativo": 3, "rec": 8, "dano": 30.0, "caixa": Rect2(20, -96, 80, 26), "atord": 13, "bloq": 8, "empurra": 5.0, "nivel": "medio", "forca": "fraco"},
	"chute": {"inicio": 6, "ativo": 4, "rec": 13, "dano": 55.0, "caixa": Rect2(20, -108, 104, 32), "atord": 17, "bloq": 11, "empurra": 9.0, "nivel": "medio", "forca": "medio"},
	"chute_alto": {"inicio": 9, "ativo": 4, "rec": 18, "dano": 82.0, "caixa": Rect2(20, -196, 112, 46), "atord": 22, "bloq": 13, "empurra": 15.0, "nivel": "alto", "forca": "forte"},
	"rasteira": {"inicio": 8, "ativo": 4, "rec": 20, "dano": 62.0, "caixa": Rect2(10, -32, 128, 30), "atord": 0, "bloq": 12, "empurra": 6.0, "nivel": "baixo", "derruba": true, "forca": "medio"},
	"final": {"inicio": 7, "ativo": 5, "rec": 24, "dano": 95.0, "caixa": Rect2(15, -205, 112, 175), "atord": 0, "bloq": 14, "empurra": 14.0, "nivel": "medio", "derruba": true, "final": true, "forca": "forte"},
	"soco_ar": {"inicio": 4, "ativo": 6, "rec": 4, "dano": 48.0, "caixa": Rect2(14, -160, 86, 40), "atord": 15, "bloq": 9, "empurra": 5.0, "nivel": "aereo", "forca": "medio", "ar": true},
	"voadora": {"inicio": 5, "ativo": 12, "rec": 3, "dano": 65.0, "caixa": Rect2(10, -98, 88, 48), "atord": 17, "bloq": 10, "empurra": 6.0, "nivel": "aereo", "forca": "medio", "ar": true},
	"pisao": {"inicio": 4, "ativo": 20, "rec": 2, "dano": 58.0, "caixa": Rect2(0, -70, 84, 70), "atord": 16, "bloq": 9, "empurra": 7.0, "nivel": "aereo", "forca": "medio", "ar": true},
	"agarrao": {"inicio": 3, "ativo": 3, "rec": 22, "forca": "medio"},
	"ultimate": {"inicio": 16, "ativo": 1, "rec": 40, "especial": true, "forca": "forte"},
}

var dados: Dictionary = {}
var oponente: Lutador
var entrada = null  # objeto com ler() -> Dictionary
var travado := false  # sem controle (intro e fim de round)
var treino := false   # modo treino: barra e vida se recuperam

var vida := 1000.0
var vida_max := 1000.0
var barra := 0.0  # 0 a 100: 50 = Superpower, 100 = Ultimate
var vel := Vector2.ZERO
var lado := 1
var estado: int = E.PARADO
var quadro := 0
var golpe: Dictionary = {}
var golpe_nome := ""
var hab: Dictionary = {}       # habilidade em uso (vazia nos golpes normais)
var hab_slot := ""
var conectou := false           # o golpe atual já acertou ou foi defendido (libera os combos)
var hits_feitos := 0
var _prox_hit := 0
var _tiros_dados := 0
var armadura := 0
var atordoado := 0
var invencivel := 0
var flash := 0
var defendeu_agachado := false
var reacao := "corpo"           # cabeca, corpo, pernas
var reacao_forte := false
var ultimo_contra := false       # o último golpe recebido foi contra-ataque
var recargas := {}               # slot -> quadros
var bloqueado := 0               # sem especiais (Bloqueio Supremo)
var censurado := 0               # tarja preta e mosaico no rosto (Censura Suprema)
var lento := 0                   # dentro de zona que atrasa
var tempo_vivo := 0
var _lado_visual := 1.0
var _atacou_no_ar := false
var _pulo_dir := 0.0
var _dash_dir := 0
var _tras_t := 0                 # há quantos quadros segura para trás (defesa perfeita)
var _agarrar_t := 99             # há quantos quadros apertou Agarrar (escapar do agarrão)
var _toque_frente := -99
var _toque_tras := -99
var _soltou_frente := true
var _soltou_tras := true
var agarrado_por: Lutador = null
var _arremesso_tras := false
var _barra_cheia_avisou := false
# movimento secundário (cabeça e roupa atrasam em relação ao corpo)
var _x_ant := 0.0
var _mola_cab := Vector2.ZERO
var _vento := 0.0

var _antes: Dictionary = VAZIO.duplicate()
var _buffer: Array[int] = []


func configurar(d: Dictionary, x: float, olhando: int) -> void:
	_lado_visual = float(olhando)
	dados = d
	vida_max = float(d.get("vida", 1000))
	vida = vida_max
	position = Vector2(x, CHAO)
	_x_ant = x
	lado = olhando
	resetar_estado()


func resetar_estado() -> void:
	vel = Vector2.ZERO
	estado = E.PARADO
	quadro = 0
	golpe = {}
	golpe_nome = ""
	hab = {}
	hab_slot = ""
	atordoado = 0
	invencivel = 0
	flash = 0
	bloqueado = 0
	censurado = 0
	lento = 0
	recargas.clear()
	agarrado_por = null
	_buffer.clear()


func habilidade(slot: String) -> Dictionary:
	return dados.get("habilidades", {}).get(slot, {})


# ---------------------------------------------------------------- consultas

func no_chao() -> bool:
	return position.y >= CHAO - 0.5


func esta_atacando() -> bool:
	return estado == E.ATACANDO


func nivel_golpe() -> String:
	return golpe.get("nivel", "medio")


func pode_agir() -> bool:
	return estado in [E.PARADO, E.ANDANDO, E.AGACHADO]


func pode_bloquear_estado() -> bool:
	return estado in [E.PARADO, E.ANDANDO, E.AGACHADO, E.DEFENDENDO, E.ATERRISSANDO]


func agachado() -> bool:
	return estado == E.AGACHADO or estado == E.PRE_PULO or estado == E.LEVANTANDO \
		or (estado == E.ATACANDO and golpe_nome in ["soco_baixo", "rasteira"]) \
		or (estado == E.DEFENDENDO and defendeu_agachado)


func hurtbox() -> Rect2:
	if agachado():
		return Rect2(position.x - 34 * TAM, position.y - 150 * TAM, 68 * TAM, 150 * TAM)
	return Rect2(position.x - 32 * TAM, position.y - 200 * TAM, 64 * TAM, 200 * TAM)


## Retângulo do golpe em coordenadas da tela, ou null quando o golpe não pode acertar agora.
func caixa_ataque() -> Variant:
	if estado != E.ATACANDO or not golpe.has("caixa"):
		return null
	var ini: int = golpe["inicio"]
	if quadro < ini or quadro >= ini + int(golpe["ativo"]):
		return null
	if hits_feitos >= int(golpe.get("hits", 1)) or quadro < _prox_hit:
		return null
	var c0: Rect2 = golpe["caixa"]
	var c := Rect2(c0.position * TAM, c0.size * TAM)
	var x := position.x + c.position.x if lado == 1 else position.x - c.position.x - c.size.x
	return Rect2(x, position.y + c.position.y, c.size.x, c.size.y)


## A luta avisa que o golpe pegou (ou foi defendido). Golpes de vários acertos esperam o intervalo.
func registrar_acerto() -> void:
	hits_feitos += 1
	_prox_hit = quadro + int(golpe.get("intervalo", 6))
	conectou = true


func ultimo_hit() -> bool:
	return hits_feitos >= int(golpe.get("hits", 1)) - 1


func pronto_ultimate() -> bool:
	return barra >= BARRA_ULTIMATE


# ---------------------------------------------------------------- quadro a quadro

func passo() -> void:
	var e: Dictionary = VAZIO
	if entrada != null and not travado:
		e = entrada.ler()
	var aperto := {}
	for k in ["soco", "chute", "especial", "provocar", "super", "agarrar"]:
		aperto[k] = e.get(k, false) and not _antes.get(k, false)
	if aperto["soco"] and aperto["chute"]:
		aperto["agarrar"] = true
	_antes = e
	var dirn := _direcao(e)
	_buffer.push_back(dirn)
	if _buffer.size() > 18:
		_buffer.pop_front()
	var segurando_tras := dirn in [1, 4, 7]
	_tras_t = _tras_t + 1 if segurando_tras else 0
	_agarrar_t = 0 if aperto["agarrar"] else _agarrar_t + 1
	_ler_toques(dirn)

	quadro += 1
	tempo_vivo += 1
	for k in recargas.keys():
		recargas[k] -= 1
		if recargas[k] <= 0:
			recargas.erase(k)
	if flash > 0:
		flash -= 1
	if invencivel > 0:
		invencivel -= 1
	if bloqueado > 0:
		bloqueado -= 1
	if censurado > 0:
		censurado -= 1
	if lento > 0:
		lento -= 1
	if treino:
		barra = 100.0
	if barra >= BARRA_ULTIMATE and not _barra_cheia_avisou:
		_barra_cheia_avisou = true
		evento.emit(self, "barra_cheia")
	elif barra < BARRA_ULTIMATE:
		_barra_cheia_avisou = false

	match estado:
		E.PARADO, E.ANDANDO, E.AGACHADO:
			_virar()
			if aperto["provocar"] and estado != E.AGACHADO:
				_mudar(E.PROVOCANDO)
				provocou.emit(self)
			elif not _tentar_ataque(e, aperto, dirn):
				_movimento_chao(e)
		E.PRE_PULO:
			if quadro >= 4:
				vel = Vector2(_pulo_dir * 6.0 * lado * _vm(), -21.5)
				_mudar(E.PULANDO)
				_atacou_no_ar = false
				evento.emit(self, "pulo")
		E.ATERRISSANDO:
			if quadro >= int(golpe.get("aterrissa", 4)):
				golpe = {}
				_mudar(E.PARADO)
		E.DASH:
			position.x += vel.x
			vel.x *= 0.86
			if quadro >= 16:
				_mudar(E.PARADO)
		E.PROVOCANDO:
			if quadro > (90 if dados.get("id", "") == "trump" else 60):
				_mudar(E.PARADO)
		E.PULANDO:
			if not _atacou_no_ar and (aperto["soco"] or aperto["chute"]):
				_atacou_no_ar = true
				if aperto["chute"] and e.get("baixo", false):
					_iniciar("pisao")
					vel = Vector2(lado * 8.0 * _vm(), 11.0)
				else:
					_iniciar("soco_ar" if aperto["soco"] else "voadora")
			_fisica_ar()
			if no_chao() and estado == E.PULANDO:
				_aterrissar(4)
		E.ATACANDO:
			if not _encadear(e, aperto, dirn):
				_atualizar_ataque(e)
		E.ATINGIDO, E.DEFENDENDO, E.DESEQUILIBRADO:
			atordoado -= 1
			position.x += vel.x
			vel.x *= 0.82
			if not no_chao():
				_fisica_ar()
			if atordoado <= 0 and no_chao():
				_mudar(E.AGACHADO if e.get("baixo", false) else E.PARADO)
		E.CAIDO, E.NOCAUTE:
			if not no_chao() or vel.y < 0:
				var caindo := vel.y
				_fisica_ar()
				if no_chao():
					if caindo > 7.0 and not _quicou:
						# o corpo quica uma vez no chão
						_quicou = true
						vel = Vector2(vel.x * 0.5, -caindo * 0.35)
						position.y = CHAO - 1.0
					else:
						vel = Vector2.ZERO
						quadro = 0
					evento.emit(self, "queda")
			elif estado == E.CAIDO and quadro > 34:
				_mudar(E.LEVANTANDO)
				invencivel = 26
		E.LEVANTANDO:
			if quadro > 22:
				_mudar(E.PARADO)
		E.AGARRANDO:
			_passo_arremesso()
		E.AGARRADO, E.CINEMATICA, E.PRESO, E.VITORIA, E.DERROTA:
			pass

	if estado != E.AGARRADO:
		position.x = clampf(position.x, LIMITE_ESQ, LIMITE_DIR)
	_atualizar_visual()


func _vm() -> float:
	var v: float = dados.get("velocidade", 1.0)
	return v * (0.55 if lento > 0 else 1.0)


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


## Dois toques rápidos para a frente (dash) ou para trás (esquiva).
func _ler_toques(dirn: int) -> void:
	var frente := dirn == 6
	var tras := dirn == 4
	_dash_dir = 0
	if frente:
		if _soltou_frente:
			if tempo_vivo - _toque_frente < 14:
				_dash_dir = 1
			_toque_frente = tempo_vivo
		_soltou_frente = false
	else:
		_soltou_frente = true
	if tras:
		if _soltou_tras:
			if tempo_vivo - _toque_tras < 14:
				_dash_dir = -1
			_toque_tras = tempo_vivo
		_soltou_tras = false
	else:
		_soltou_tras = true


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


func _aterrissar(n: int) -> void:
	vel = Vector2.ZERO
	position.y = CHAO
	golpe = {"aterrissa": n}
	golpe_nome = ""
	_mudar(E.ATERRISSANDO)
	evento.emit(self, "aterrissa")


func _movimento_chao(e: Dictionary) -> void:
	var vm := _vm()
	var frente: bool = e.get("dir", false) if lado == 1 else e.get("esq", false)
	var tras: bool = e.get("esq", false) if lado == 1 else e.get("dir", false)
	if _dash_dir != 0 and no_chao():
		_mudar(E.DASH)
		vel.x = lado * _dash_dir * (13.0 if _dash_dir > 0 else 11.0) * vm
		_dash_dir = 0
		if vel.x * lado < 0:
			invencivel = 8  # esquiva para trás
		evento.emit(self, "dash")
		return
	if e.get("cima", false):
		_pulo_dir = 1.0 if frente else (-1.0 if tras else 0.0)
		_mudar(E.PRE_PULO)
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


## Escolhe o golpe pelo botão e pela direção. Devolve true se algo começou.
func _tentar_ataque(e: Dictionary, aperto: Dictionary, dirn: int) -> bool:
	if aperto["super"]:
		return _tentar_super(dirn)
	if aperto["agarrar"] and no_chao():
		_iniciar("agarrao")
		return true
	var slot := ""
	if aperto["especial"]:
		if dirn in [7, 8, 9]:
			slot = "cima"
		elif dirn == 6:
			slot = "frente"
		elif dirn == 4:
			slot = "tras"
		elif dirn in [1, 2, 3]:
			slot = "baixo"
		else:
			slot = "projetil"
	elif aperto["soco"] and _comando([6, 2, 3]):
		slot = "cima"
	elif aperto["soco"] and _comando([2, 3, 6]):
		slot = "projetil"
	elif aperto["chute"] and _comando([2, 1, 4]):
		slot = "frente"
	if slot != "":
		if _usar_habilidade(slot):
			return true
		if aperto["especial"]:
			return true  # especial em recarga: só o aviso
	var g := ""
	if aperto["soco"]:
		g = "soco_baixo" if e.get("baixo", false) else ("direto" if dirn == 6 else "soco")
	elif aperto["chute"]:
		g = "rasteira" if e.get("baixo", false) else ("chute_alto" if dirn == 6 else "chute")
	if g == "":
		return false
	_iniciar(g)
	return true


func _tentar_super(dirn: int) -> bool:
	if bloqueado > 0:
		evento.emit(self, "bloqueado")
		return false
	if barra >= BARRA_ULTIMATE and dirn not in [1, 4, 7] and not habilidade("ultimate").is_empty():
		barra -= BARRA_ULTIMATE
		_iniciar("ultimate")
		hab = habilidade("ultimate")
		hab_slot = "ultimate"
		invencivel = 70
		poder.emit(self, "ultimate")
		falou.emit(self, hab.get("nome", ""))
		return true
	if barra >= BARRA_SUPER:
		return _usar_habilidade("super")
	evento.emit(self, "sem_energia")
	return false


## Começa a habilidade do slot (se não estiver em recarga, bloqueada ou sem barra).
func _usar_habilidade(slot: String) -> bool:
	var h := habilidade(slot)
	if h.is_empty():
		return false
	if bloqueado > 0:
		evento.emit(self, "bloqueado")
		return false
	if recargas.has(slot):
		evento.emit(self, "recarga")
		return false
	var custo: float = h.get("custo", 0.0)
	if barra < custo:
		evento.emit(self, "sem_energia")
		return false
	barra -= custo
	hab = h
	hab_slot = slot
	golpe_nome = "hab_" + slot
	golpe = {"inicio": h["inicio"], "ativo": h["ativo"], "rec": h["rec"], "especial": true, "forca": "forte"}
	var corpo: Dictionary = h.get("corpo", {})
	for k in corpo:
		golpe[k] = corpo[k]
	golpe["nivel"] = corpo.get("nivel", "medio")
	golpe["bloq"] = corpo.get("bloq", 14)
	golpe["empurra"] = corpo.get("empurra", 8.0)
	golpe["atord"] = corpo.get("atord", 18)
	if slot == "super":
		golpe["super"] = true
	if h.has("ao_acertar"):
		golpe["ao_acertar"] = h["ao_acertar"]
	_comecar_golpe()
	armadura = int(corpo.get("armadura", 0))
	if h.has("invencivel"):
		invencivel = int(h["invencivel"])
	if h.has("recarga"):
		recargas[slot] = int(h["recarga"])
	if slot == "super":
		poder.emit(self, "super")
	falou.emit(self, h.get("nome", ""))
	evento.emit(self, "voz_super" if slot == "super" else "voz_especial")
	return true


func _iniciar(nome: String) -> void:
	golpe_nome = nome
	golpe = GOLPES[nome].duplicate()
	hab = {}
	hab_slot = ""
	armadura = 0
	_comecar_golpe()
	if nome == "final" and dados.has("habilidades"):
		falou.emit(self, dados["habilidades"]["final"]["nome"])
	evento.emit(self, "golpe")


func _comecar_golpe() -> void:
	conectou = false
	hits_feitos = 0
	_prox_hit = 0
	_tiros_dados = 0
	if not golpe.get("ar", false):
		vel.x = 0.0
	estado = E.ATACANDO
	quadro = 0


## Combos: com o golpe já conectado (acerto ou defesa), dá para emendar o próximo.
## Soco > Soco > Chute = golpe final. Normais cancelam em especial; tudo (menos o ultimate) cancela no SUPER.
func _encadear(e: Dictionary, aperto: Dictionary, dirn: int) -> bool:
	if not conectou or quadro < int(golpe["inicio"]) or golpe_nome == "ultimate":
		return false
	var normal := hab.is_empty() and golpe_nome not in ["agarrao", "final"]
	if aperto["super"] and (normal or hab_slot not in ["super", "ultimate"]):
		return _tentar_super(dirn)
	if not normal:
		return false
	if aperto["especial"]:
		return _tentar_ataque(e, aperto, dirn)
	match golpe_nome:
		"soco", "soco_baixo":
			if aperto["soco"]:
				_iniciar("direto" if dirn == 6 else "soco2")
				return true
			if aperto["chute"]:
				_iniciar("chute_alto" if dirn == 6 else "chute")
				return true
		"soco2":
			if aperto["chute"]:
				_iniciar("final")
				return true
			if aperto["soco"] and dirn == 6:
				_iniciar("direto")
				return true
		"chute":
			if aperto["chute"]:
				_iniciar("chute_alto")
				return true
	return false


func _atualizar_ataque(e: Dictionary) -> void:
	var ini: int = golpe["inicio"]
	var ativo: int = golpe["ativo"]
	var total: int = ini + ativo + int(golpe["rec"])
	var vm := _vm()
	var na_janela := quadro >= ini and quadro < ini + ativo
	if quadro == ini:
		evento.emit(self, "ativo")
	if golpe_nome == "ultimate":
		if quadro == ini:
			disparou_ultimate.emit(self)
	elif not hab.is_empty():
		var avanco: float = golpe.get("avanco", 0.0)
		if na_janela and avanco > 0.0:
			position.x += lado * avanco * vm
		if quadro == ini and hab.has("salto"):
			var s: Vector2 = hab["salto"]
			vel = Vector2(lado * s.x, s.y)
		if hab.has("tiro"):
			var t: Dictionary = hab["tiro"]
			var qtd: int = t.get("qtd", 1)
			var passo_t: int = t.get("intervalo", 6)
			if _tiros_dados < qtd and quadro == ini + _tiros_dados * passo_t:
				_tiros_dados += 1
				tiro.emit(self, t)
		if quadro == ini and hab.has("zona"):
			zona.emit(self, hab["zona"])
		if quadro == ini and hab.has("chuva"):
			chuva.emit(self, hab["chuva"])
		if quadro == ini and hab.has("cura"):
			vida = minf(vida + float(hab["cura"]), vida_max)

	var no_ar: bool = golpe.get("ar", false) or (hab.has("salto") and quadro >= ini)
	if no_ar:
		_fisica_ar()
		if no_chao() and (golpe.get("ar", false) or quadro > ini + 2):
			_aterrissar(7 if hab.has("salto") else 5)
	elif quadro >= total:
		golpe_nome = ""
		hab = {}
		hab_slot = ""
		_mudar(E.AGACHADO if e.get("baixo", false) else E.PARADO)


func _fisica_ar() -> void:
	vel.y += GRAVIDADE
	position += vel
	if position.y >= CHAO:
		position.y = CHAO
		if vel.y > 0:
			vel.y = 0


# ---------------------------------------------------------------- agarrão

## Tenta agarrar o rival (chamado pela luta nos quadros ativos do agarrão).
## Devolve "agarrou", "escapou" ou "".
func tentar_agarrar(alvo: Lutador) -> String:
	if estado != E.ATACANDO or golpe_nome != "agarrao" or conectou:
		return ""
	var ini: int = golpe["inicio"]
	if quadro < ini or quadro >= ini + int(golpe["ativo"]):
		return ""
	if absf(alvo.position.x - position.x) > ALCANCE_AGARRAO * TAM or not alvo.no_chao() or alvo.invencivel > 0:
		return ""
	if alvo.estado not in [E.PARADO, E.ANDANDO, E.AGACHADO, E.DEFENDENDO, E.PRE_PULO, E.ATERRISSANDO, E.DESEQUILIBRADO, E.PROVOCANDO, E.DASH] \
		and not (alvo.estado == E.ATACANDO and alvo.quadro < int(alvo.golpe.get("inicio", 0))):
		return ""
	conectou = true
	if alvo._agarrar_t < 7:
		# os dois apertaram: escapa
		for l in [self, alvo]:
			l._mudar(E.ATINGIDO)
			l.atordoado = 12
			l.vel.x = -l.lado * 9.0
		return "escapou"
	_arremesso_tras = _antes.get("esq", false) if lado == 1 else _antes.get("dir", false)
	_mudar(E.AGARRANDO)
	alvo._mudar(E.AGARRADO)
	alvo.agarrado_por = self
	alvo.vel = Vector2.ZERO
	return "agarrou"


func _passo_arremesso() -> void:
	var alvo := oponente
	var t := quadro
	if alvo == null or alvo.agarrado_por != self:
		_mudar(E.PARADO)
		return
	var frente := -1.0 if _arremesso_tras else 1.0
	# 0-12: ergue; 12-20: gira por cima; 20: solta; até 34: recupera
	if t <= 20:
		var k := clampf(t / 20.0, 0.0, 1.0)
		var ang := lerpf(0.0, PI, k)
		var raio := 70.0
		var centro := position + Vector2(lado * frente * 10.0, -120.0)
		var de := Vector2(lado * frente * raio, 0)
		alvo.position = centro + de.rotated(-ang * lado * frente) * Vector2(1, 1) + Vector2(0, 80.0)
		if _arremesso_tras:
			alvo.position.x = position.x + lado * lerpf(70.0, -90.0, k)
		else:
			alvo.position.x = position.x + lado * lerpf(70.0, 110.0, k)
		alvo.position.y = lerpf(CHAO, CHAO - 150.0, sin(k * PI))
	if t == 20:
		alvo.agarrado_por = null
		var dir := lado * frente
		alvo.vida = maxf(alvo.vida - 110.0 * float(dados.get("forca", 1.0)), 0.0)
		alvo.flash = 8
		alvo._cair(dir, alvo.vida <= 0.0)
		alvo.vel = Vector2(dir * 8.0, -9.0)
		evento.emit(self, "arremesso")
	if t >= 34:
		if _arremesso_tras:
			lado = -lado
		_mudar(E.PARADO)


# ---------------------------------------------------------------- levar golpe

## Recebe um golpe. Devolve "bloqueio", "perfeita", "armadura", "acerto", "derrubou", "nocaute" ou "" (não pegou).
## atacante é null para projéteis e zonas.
func receber(g: Dictionary, atacante_x: float, atacante: Lutador = null) -> String:
	ultimo_contra = false
	if estado in [E.NOCAUTE, E.CAIDO, E.LEVANTANDO, E.VITORIA, E.DERROTA, E.AGARRADO, E.CINEMATICA, E.PRESO] or invencivel > 0:
		return ""
	var tras: bool = _antes.get("esq", false) if atacante_x > position.x else _antes.get("dir", false)
	var abaixado: bool = _antes.get("baixo", false)
	var pode_bloquear: bool = tras and pode_bloquear_estado()
	var nivel: String = g.get("nivel", "medio")
	if pode_bloquear and nivel == "baixo" and not abaixado:
		pode_bloquear = false
	if pode_bloquear and nivel == "aereo" and abaixado:
		pode_bloquear = false
	var empurrao := 1.0 if position.x >= atacante_x else -1.0
	var dano: float = g.get("dano", 0.0)
	var ultimo: bool = g.get("ultimo", true)

	if pode_bloquear:
		defendeu_agachado = abaixado
		if _tras_t >= 1 and _tras_t <= 8 and estado != E.DEFENDENDO:
			# defesa perfeita: sem dano, e o rival perde o equilíbrio (janela de contra-ataque)
			_mudar(E.DEFENDENDO)
			atordoado = 6
			vel.x = empurrao * 2.0
			barra = minf(barra + 8.0, 100.0)
			if atacante != null and atacante.estado == E.ATACANDO:
				atacante.desequilibrar(24)
			return "perfeita"
		if g.get("especial", false):
			vida = maxf(vida - dano * 0.18, 0.0)
		_mudar(E.DEFENDENDO)
		quadro = 0
		atordoado = g.get("bloq", 10)
		vel.x = empurrao * float(g.get("empurra", 6.0)) * 0.9
		barra = minf(barra + 3.0, 100.0)
		if vida <= 0.0:
			_cair(empurrao, true)
			return "nocaute"
		return "bloqueio"

	if estado == E.ATACANDO and quadro < int(golpe.get("inicio", 0)):
		ultimo_contra = true
		dano *= 1.25
	if estado == E.ATACANDO and armadura > 0 and not g.get("super", false):
		armadura -= 1
		vida = maxf(vida - dano * 0.6, 0.0)
		flash = 6
		if vida <= 0.0:
			_cair(empurrao, true)
			return "nocaute"
		return "armadura"

	vida = maxf(vida - dano, 0.0)
	barra = minf(barra + 6.0, 100.0)
	flash = 8
	reacao = {"alto": "cabeca", "baixo": "pernas", "aereo": "cabeca"}.get(nivel, "corpo")
	reacao_forte = g.get("forca", "") == "forte" or g.get("especial", false)
	if g.get("ao_acertar", "") == "bloqueio_supremo":
		bloqueado = 300
	elif g.get("ao_acertar", "") == "censura":
		bloqueado = 300
		censurado = 300
	if vida <= 0.0:
		_cair(empurrao, true)
		return "nocaute"
	if ultimo and (g.get("derruba", false) or not no_chao()):
		_cair(empurrao, false)
		return "derrubou"
	_mudar(E.ATINGIDO)
	quadro = 0
	atordoado = int(g.get("atord", 14)) + (6 if ultimo_contra else 0) + (4 if reacao_forte else 0)
	vel.x = empurrao * float(g.get("empurra", 6.0)) * (1.3 if reacao_forte else 1.0)
	return "acerto"


## Perde o equilíbrio (golpe defendido com perfeição): fica vulnerável por n quadros.
func desequilibrar(n: int) -> void:
	golpe = {}
	golpe_nome = ""
	hab = {}
	hab_slot = ""
	_mudar(E.DESEQUILIBRADO)
	atordoado = n
	vel.x = -lado * 3.0


var _quicou := false


func _cair(empurrao: float, nocaute: bool) -> void:
	_quicou = false
	agarrado_por = null
	estado = E.NOCAUTE if nocaute else E.CAIDO
	quadro = 0
	vel = Vector2(empurrao * (7.0 if nocaute else 5.5), -12.0 if nocaute else -10.0)
	if no_chao():
		position.y = CHAO - 1.0


## Ultimate: a luta prende os dois durante a cinemática e solta o rival no fim.
func entrar_cinematica(atacante: bool) -> void:
	vel = Vector2.ZERO
	golpe = {}
	golpe_nome = ""
	_mudar(E.CINEMATICA if atacante else E.PRESO)


func sair_cinematica() -> void:
	hab = {}
	hab_slot = ""
	_mudar(E.PARADO)


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

## A pose de cada quadro: corpo, expressão do rosto e movimento da cabeça (que atrasa em relação ao corpo).
func pose() -> Dictionary:
	var p := Desenho.pose_guarda(dados, tempo_vivo)
	var t := quadro
	match estado:
		E.PARADO:
			pass
		E.ANDANDO:
			# anda na guarda: passos curtos arrastando os pés, o corpo sobe e desce
			var s := sin(tempo_vivo * 0.26 * (0.6 if lento > 0 else 1.0))
			p["pe_f"] = Vector2(34 + s * 12.0, -maxf(0.0, s) * 7.0)
			p["pe_t"] = Vector2(-32 - s * 12.0, -maxf(0.0, -s) * 7.0)
			p["quadril"] = -62.0 + absf(s) * 3.0
			p["cabeca_desl"] = Vector2(1, absf(s) * 2.0)
		E.AGACHADO, E.LEVANTANDO:
			_pose_agachada(p)
			if estado == E.LEVANTANDO:
				p["expr"] = "esforco"
				var k := clampf(t / 22.0, 0.0, 1.0)
				p["quadril"] = lerpf(-30.0, -72.0, k)
		E.PRE_PULO:
			_pose_agachada(p)
			p["quadril"] = -50.0
			p["mao_f"] = Vector2(20, -96)
			p["mao_t"] = Vector2(-8, -92)
			p["expr"] = "esforco"
		E.ATERRISSANDO:
			_pose_agachada(p)
			p["quadril"] = lerpf(-44.0, -60.0, clampf(t / 6.0, 0.0, 1.0))
		E.DASH:
			var frente := vel.x * lado > 0
			p["inclina"] = 0.32 if frente else -0.22
			p["pe_f"] = Vector2(34 if frente else 10, -10)
			p["pe_t"] = Vector2(-40 if frente else -22, -4)
			p["mao_f"] = Vector2(40, -116)
			p["mao_t"] = Vector2(-30, -110)
			p["expr"] = "esforco"
			p["cabeca_giro"] = 0.1 if frente else -0.12
		E.PULANDO:
			# pernas encolhidas no alto do pulo; pulo para a frente ou para trás vira cambalhota
			var progresso := clampf((vel.y + 21.5) / 43.0, 0.0, 1.0)
			var encolhe := sin(progresso * PI)
			p["quadril"] = -72.0 + encolhe * 18.0
			p["pe_f"] = Vector2(16, 0).lerp(Vector2(30, -58), encolhe)
			p["pe_t"] = Vector2(-14, 0).lerp(Vector2(-4, -50), encolhe)
			p["mao_f"] = Vector2(36, -140).lerp(Vector2(34, -112), encolhe)
			p["mao_t"] = Vector2(20, -130).lerp(Vector2(22, -104), encolhe)
			p["cabeca_giro"] = clampf(vel.y * 0.01, -0.12, 0.14)
			if absf(_pulo_dir) > 0.0:
				p["cambalhota"] = progresso * TAU * _pulo_dir
		E.ATINGIDO:
			var k := clampf(atordoado / 14.0, 0.0, 1.0)
			p["expr"] = "dor"
			match reacao:
				"cabeca":
					p["inclina"] = -0.36 * k
					p["cabeca_giro"] = -0.55 * k
					p["cabeca_desl"] = Vector2(-10 * k, 2)
					p["mao_f"] = Vector2(6, -140)
					p["mao_t"] = Vector2(-12, -130)
				"pernas":
					p["inclina"] = 0.2 * k
					p["quadril"] = -62.0
					p["pe_f"] = Vector2(4, -14 * k)
					p["mao_f"] = Vector2(20, -80)
					p["cabeca_giro"] = 0.25 * k
				_:
					p["inclina"] = 0.32 * k
					p["quadril"] = -66.0
					p["mao_f"] = Vector2(22, -90)
					p["mao_t"] = Vector2(10, -86)
					p["cabeca_giro"] = 0.35 * k
					p["cabeca_desl"] = Vector2(6 * k, 6 * k)
			if reacao_forte:
				p["pe_t"] = Vector2(-34, 0)
		E.DEFENDENDO:
			if defendeu_agachado:
				_pose_agachada(p)
			p["mao_f"] = Vector2(30, -150 + (44 if defendeu_agachado else 0))
			p["mao_t"] = Vector2(36, -132 + (44 if defendeu_agachado else 0))
			p["inclina"] = -0.1
			p["expr"] = "esforco"
			p["cabeca_giro"] = 0.14
			p["cabeca_desl"] = Vector2(2, 4)
		E.DESEQUILIBRADO:
			var w := sin(t * 0.5)
			p["inclina"] = -0.28 + w * 0.06
			p["mao_f"] = Vector2(40, -190 + w * 10)
			p["mao_t"] = Vector2(-40, -180 - w * 10)
			p["pe_f"] = Vector2(30, -8)
			p["expr"] = "dor"
			p["cabeca_giro"] = -0.3 + w * 0.1
			p["tonto"] = true
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
		E.AGARRANDO:
			var k := clampf(t / 20.0, 0.0, 1.0)
			p["mao_f"] = Vector2(60, -130).lerp(Vector2(-10 if not _arremesso_tras else 70, -230), k)
			p["mao_t"] = Vector2(50, -120).lerp(Vector2(-30 if not _arremesso_tras else 50, -220), k)
			p["inclina"] = lerpf(0.1, -0.35, k) if t <= 20 else 0.2
			p["expr"] = "grito"
		E.AGARRADO:
			p["expr"] = "dor"
			p["giro"] = -0.6
			p["mao_f"] = Vector2(30, -180)
			p["mao_t"] = Vector2(-20, -170)
			p["pe_f"] = Vector2(30, -20)
		E.CINEMATICA:
			Poses.habilidade(dados, "ultimate", t, 10, 200, 10, p)
		E.PRESO:
			p["expr"] = "dor" if (t / 10) % 2 == 0 else "nocaute"
			p["inclina"] = -0.25 + sin(t * 0.4) * 0.08
			p["mao_f"] = Vector2(10, -170)
			p["mao_t"] = Vector2(-20, -160)
			p["cabeca_giro"] = -0.3 + sin(t * 0.5) * 0.15
		E.ATACANDO:
			_pose_ataque(p)
	if bloqueado > 0:
		p["cadeado"] = true
	if censurado > 0:
		p["censura"] = true
	return p


## Caminho do pé no chute: do chão recolhe o joelho (preparação), estica no impacto e volta pelo joelho.
func _chute(chao: Vector2, recolhido: Vector2, esticado: Vector2, k: float) -> Vector2:
	if quadro < int(golpe["inicio"]):
		return chao.lerp(recolhido, clampf(quadro / maxf(1.0, float(golpe["inicio"])), 0.0, 1.0))
	if k >= 1.0:
		return esticado
	# recuperação: k vai de 1 a 0 passando pelo joelho recolhido
	return recolhido.lerp(esticado, k) if k > 0.4 else chao.lerp(recolhido, k / 0.4)


func _pose_agachada(p: Dictionary) -> void:
	p["agachado"] = true
	p["quadril"] = -38.0
	p["pe_f"] = Vector2(34, 0)
	p["pe_t"] = Vector2(-30, 0)
	p["inclina"] = 0.16
	p["mao_f"] = Vector2(44, -104)
	p["mao_t"] = Vector2(30, -94)


## 0 = recolhido (antecipação puxa para trás), 1 = esticado (impacto), depois volta (recuperação).
func _fase() -> float:
	var ini: int = golpe["inicio"]
	var ativo: int = golpe["ativo"]
	var t := quadro
	if t < ini:
		return -0.35 * sin(PI * 0.5 * t / maxf(1.0, float(ini)))
	if t < ini + ativo:
		return 1.0
	return clampf(1.0 - float(t - ini - ativo) / maxf(1.0, float(golpe["rec"])), 0.0, 1.0)


func _pose_ataque(p: Dictionary) -> void:
	var ini: int = golpe["inicio"]
	var t := quadro
	p["mao_t"] = Vector2(24, -126)
	p["prop_t"] = ""
	var k := _fase()
	var kp := maxf(k, 0.0)
	var antecipa := minf(k, 0.0)  # negativo na preparação
	var forte: bool = golpe.get("especial", false) or golpe.get("forca", "") == "forte"
	p["expr"] = "grito" if forte else "esforco"
	p["cabeca_giro"] = (-0.12 if t < ini else 0.14 * kp)
	p["cabeca_desl"] = Vector2(4 * kp + antecipa * 8.0, 0)
	p["impacto"] = k >= 1.0
	if not hab.is_empty():
		Poses.habilidade(dados, hab.get("pose", ""), t, ini, int(golpe["ativo"]), int(golpe["rec"]), p)
		return
	match golpe_nome:
		"soco", "soco2":
			var mao := "mao_f" if golpe_nome == "soco" else "mao_t"
			p[mao] = Vector2(40, -138).lerp(Vector2(102, -142 if golpe_nome == "soco" else -132), kp) + Vector2(antecipa * 30.0, 0)
			if golpe_nome == "soco2":
				p["mao_f"] = Vector2(30, -136)
			p["pe_f"] = Vector2(34 + 8 * kp, 0)
			p["punho_grande"] = k > 0.5
			p["inclina"] = 0.12 * k
			p["rastro"] = [p[mao], Vector2(40, -128)] if k >= 1.0 else []
		"direto":
			p["mao_f"] = Vector2(30, -124).lerp(Vector2(112, -146), kp) + Vector2(antecipa * 60.0, antecipa * -10.0)
			p["mao_t"] = Vector2(30, -130)
			p["punho_grande"] = true
			p["inclina"] = 0.22 * k
			p["pe_t"] = Vector2(-30 + antecipa * 10.0, 0)
			p["pe_f"] = Vector2(30 * kp + 18, 0)
			p["rastro"] = [p["mao_f"], Vector2(10, -122)] if k >= 1.0 else []
		"final":
			p["mao_f"] = Vector2(30, -110).lerp(Vector2(104, -196), kp) + Vector2(antecipa * 40.0, 0)
			p["punho_grande"] = true
			p["inclina"] = 0.28 * kp
			p["pe_t"] = Vector2(-34, 0)
			p["boca"] = "grito"
			p["prop"] = dados.get("habilidades", {}).get("final", {}).get("prop", "")
			p["rastro"] = [p["mao_f"], Vector2(40, -96)] if k >= 1.0 else []
		"chute":
			p["pe_f"] = _chute(Vector2(34, 0), Vector2(44, -62), Vector2(112, -96), k)
			p["pe_t"] = Vector2(-20, 0)
			p["inclina"] = -0.22 * maxf(k, 0.4 if quadro < int(golpe["inicio"]) else 0.0)
			p["mao_f"] = Vector2(26, -134)
			p["mao_t"] = Vector2(4, -124)
			p["rastro"] = [p["pe_f"], Vector2(30, -20)] if k >= 1.0 else []
		"chute_alto":
			p["pe_f"] = _chute(Vector2(34, 0), Vector2(40, -78), Vector2(116, -196), k)
			p["inclina"] = -0.4 * maxf(k, 0.5 if quadro < int(golpe["inicio"]) else 0.0)
			p["pe_t"] = Vector2(-16, 0)
			p["mao_f"] = Vector2(-6, -118)
			p["mao_t"] = Vector2(-30, -110)
			p["rastro"] = [p["pe_f"], Vector2(60, -40)] if k >= 1.0 else []
		"soco_baixo":
			_pose_agachada(p)
			p["mao_f"] = Vector2(32, -98).lerp(Vector2(96, -84), kp)
			p["punho_grande"] = k > 0.5
		"rasteira":
			_pose_agachada(p)
			p["quadril"] = -34.0
			p["pe_f"] = Vector2(28, 0).lerp(Vector2(128, -6), kp)
			p["inclina"] = -0.25 * kp
			p["rastro"] = [p["pe_f"], Vector2(20, -6)] if k >= 1.0 else []
		"voadora":
			p["pe_f"] = Vector2(84, -52)
			p["pe_t"] = Vector2(-8, -40)
			p["inclina"] = -0.2
			p["boca"] = "grito"
		"soco_ar":
			p["mao_f"] = Vector2(30, -150).lerp(Vector2(96, -128), kp)
			p["pe_f"] = Vector2(20, -40)
			p["pe_t"] = Vector2(-20, -30)
			p["punho_grande"] = true
			p["inclina"] = 0.18
		"pisao":
			p["pe_f"] = Vector2(70, -10)
			p["pe_t"] = Vector2(-10, -50)
			p["inclina"] = 0.25
			p["mao_f"] = Vector2(-10, -160)
			p["mao_t"] = Vector2(-30, -150)
			p["boca"] = "grito"
		"agarrao":
			p["mao_f"] = Vector2(40, -130).lerp(Vector2(86, -126), kp)
			p["mao_t"] = Vector2(30, -120).lerp(Vector2(80, -116), kp)
			p["inclina"] = 0.2 * kp
		"ultimate":
			Poses.habilidade(dados, "ultimate_inicio", t, ini, 1, int(golpe["rec"]), p)


var _pose_atual: Dictionary = Desenho.pose_padrao()


func _draw() -> void:
	if dados.is_empty():
		return
	var giro: float = _pose_atual.get("cambalhota", 0.0)
	if giro != 0.0:
		# a cambalhota gira em volta do meio do corpo, não dos pés
		Desenho._base = Transform2D(0.0, Vector2(0, -90)) * Transform2D(giro, Vector2.ZERO) * Transform2D(0.0, Vector2(0, 90))
		draw_set_transform_matrix(Desenho._base)
		Desenho.lutador(self, dados, _pose_atual)
		Desenho._base = Transform2D.IDENTITY
		draw_set_transform_matrix(Desenho._base)
		return
	Desenho.lutador(self, dados, _pose_atual)


## Espelho (lado), giro ao cair, esticar/achatar e piscar ao apanhar ficam no próprio nó.
func _atualizar_visual() -> void:
	var p := pose()
	# movimento secundário: a cabeça atrasa e a roupa balança com a velocidade
	var dx := (position.x - _x_ant) * lado
	_x_ant = position.x
	_mola_cab = _mola_cab.lerp(Vector2(clampf(-dx * 1.2, -8.0, 8.0), clampf(vel.y * 0.25, -6.0, 6.0)), 0.25)
	_vento = lerpf(_vento, clampf(dx * 0.35, -3.0, 3.0), 0.15)
	p["cabeca_desl"] = p.get("cabeca_desl", Vector2.ZERO) + _mola_cab
	p["vento"] = _vento + sin(tempo_vivo * 0.09) * 0.25
	p["t"] = tempo_vivo
	_pose_atual = p
	var giro: float = p["giro"]
	var alt: float = dados.get("corpo", {}).get("alt", 1.0)
	_lado_visual = move_toward(_lado_visual, float(lado), 0.34)
	var lx := _lado_visual if absf(_lado_visual) > 0.15 else 0.15 * signf(lado)
	var estica := Vector2.ONE
	match estado:
		E.PRE_PULO:
			estica = Vector2(1.08, 0.92)
		E.ATERRISSANDO:
			estica = Vector2(1.06, 0.94).lerp(Vector2.ONE, clampf(quadro / 5.0, 0.0, 1.0))
		E.PULANDO:
			if vel.y < -8.0:
				estica = Vector2(0.95, 1.06)
		E.ATINGIDO:
			if quadro < 4:
				estica = Vector2(1.05, 0.96)
	scale = Vector2(lx, 1) * TAM * alt * estica
	rotation = giro * lado
	if giro != 0.0 and no_chao():
		_pose_atual["quadril"] = -72.0
	if flash > 0 and flash % 2 == 0:
		modulate = Color(1.0, 0.55, 0.55)
	elif bloqueado > 0 and (tempo_vivo / 8) % 2 == 0:
		modulate = Color(0.85, 0.85, 1.1)
	elif lento > 0:
		modulate = Color(0.8, 1.0, 0.8)
	else:
		modulate = Color.WHITE
	queue_redraw()
