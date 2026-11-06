class_name IA
## Jogador da CPU. A cada poucos quadros escolhe um plano pela distância (zonear com especiais,
## aproximar com dash, combar de perto, agarrar quem defende muito, antiaéreo, Super e Ultimate).
## Os comandos saem de uma fila de quadros, então combos e dash viram apertos de verdade.
## nivel (0 a 1): reação, defesa, defesa perfeita e quanto ela continua os combos.

var eu: Lutador
var op: Lutador
var nivel := 0.55
var perigo := false  # a luta avisa quando há projétil vindo

var _fila: Array[Dictionary] = []
var _t := 0
var _cd := 0
var _defende := 0
var _avaliou_ameaca := false
var _defesas_seguidas := 0


func _init(nivel_: float = 0.55) -> void:
	nivel = nivel_


func _vazio() -> Dictionary:
	return {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false,
		"especial": false, "provocar": false, "super": false, "agarrar": false}


## Põe na fila: cada item é um quadro com as teclas apertadas (direções relativas: "frente"/"tras").
func _empilhar(quadros: Array) -> void:
	for q in quadros:
		_fila.append(q)


func _traduzir(q: Dictionary) -> Dictionary:
	var d := _vazio()
	var frente := "dir" if op.position.x >= eu.position.x else "esq"
	var tras := "esq" if frente == "dir" else "dir"
	for k in q:
		if k == "frente":
			d[frente] = true
		elif k == "tras":
			d[tras] = true
		else:
			d[k] = q[k]
	return d


func ler() -> Dictionary:
	if eu == null or op == null:
		return _vazio()
	_t -= 1
	_cd -= 1
	if not _fila.is_empty():
		return _traduzir(_fila.pop_front())
	var dist := absf(op.position.x - eu.position.x)

	# combo: se o golpe conectou, continua (mais provável em níveis altos)
	if eu.estado == Lutador.E.ATACANDO and eu.conectou and randf() < nivel * 0.5:
		match eu.golpe_nome:
			"soco":
				_empilhar([{}, {"soco": true}])
			"soco2":
				_empilhar([{}, {"chute": true}])
			"chute":
				if randf() < 0.5:
					_empilhar([{}, {"especial": true, "frente": true}])
				else:
					_empilhar([{}, {"chute": true}])
			"chute_alto", "direto":
				if eu.barra >= 50.0 and randf() < 0.4:
					_empilhar([{}, {"super": true}])
		if not _fila.is_empty():
			return _traduzir(_fila.pop_front())

	# rival desequilibrado (defesa perfeita): pune
	if op.estado == Lutador.E.DESEQUILIBRADO and dist < 200.0 and eu.pode_agir():
		_empilhar([{"frente": true, "soco": true}, {}, {}, {}, {}, {}, {}, {}, {}, {"chute": true}])
		return _traduzir(_fila.pop_front())

	# 1) defesa: quando o rival ataca de perto ou vem projétil
	var ameaca := (op.esta_atacando() and dist < 300.0) or perigo
	if ameaca and not _avaliou_ameaca:
		_avaliou_ameaca = true
		if randf() < nivel * 0.85:
			_defende = 20
			_defesas_seguidas += 1
			# defesa perfeita: espera o golpe chegar e só então segura para trás
			if randf() < nivel * 0.35 and op.esta_atacando() and op.quadro < int(op.golpe.get("inicio", 0)) - 2:
				var espera := int(op.golpe.get("inicio", 0)) - op.quadro - 3
				for i in maxi(espera, 0):
					_fila.append({})
				_defende = 16
	if not ameaca:
		_avaliou_ameaca = false
	if _defende > 0 and (eu.pode_agir() or eu.estado == Lutador.E.DEFENDENDO):
		_defende -= 1
		var d := _vazio()
		d = _traduzir({"tras": true})
		d["baixo"] = op.esta_atacando() and op.nivel_golpe() == "baixo"
		return d

	# 2) antiaéreo
	if op.estado == Lutador.E.PULANDO and dist < 200.0 and op.vel.y > -4.0 and eu.pode_agir() and _cd <= 0:
		if randf() < nivel * 0.6 and not eu.recargas.has("cima"):
			_cd = 30
			return _traduzir({"cima": true, "especial": true})

	# 3) no ar: golpe na descida
	if eu.estado == Lutador.E.PULANDO and eu.vel.y > 0 and dist < 180.0 and _cd <= 0:
		_cd = 20
		return _traduzir({"chute": true, "baixo": randf() < 0.3})

	if not eu.pode_agir():
		return _vazio()

	# Ultimate e Super
	if eu.barra >= 100.0 and op.no_chao() and op.estado not in [Lutador.E.CAIDO, Lutador.E.LEVANTANDO] and randf() < 0.02 + nivel * 0.03:
		return _traduzir({"super": true})
	if eu.barra >= 50.0 and eu.barra < 100.0 and randf() < 0.008 + nivel * 0.01:
		return _traduzir({"super": true, "tras": eu.barra >= 100.0})

	# provoca de vez em quando, de longe
	if dist > 540.0 and randf() < 0.004:
		return _traduzir({"provocar": true})

	# 4) plano
	if _t <= 0:
		_escolher_plano(dist)
	return _vazio() if _fila.is_empty() else _traduzir(_fila.pop_front())


func _especial(slot: String) -> Dictionary:
	match slot:
		"frente":
			return {"frente": true, "especial": true}
		"cima":
			return {"cima": true, "especial": true}
		"baixo":
			return {"baixo": true, "especial": true}
		"tras":
			return {"tras": true, "especial": true}
	return {"especial": true}


func _pode(slot: String) -> bool:
	return not eu.recargas.has(slot) and eu.bloqueado <= 0 and not eu.habilidade(slot).is_empty()


func _escolher_plano(dist: float) -> void:
	_t = randi_range(12, 30) - int(nivel * 8)
	var opcoes: Dictionary
	if dist > 450.0:
		opcoes = {"projetil": 0.3, "dash": 0.22, "andar": 0.25, "baixo": 0.1, "pular": 0.05, "esperar": 0.08}
	elif dist > 190.0:
		opcoes = {"andar": 0.3, "dash": 0.14, "frente": 0.14, "projetil": 0.12, "tras": 0.08, "pular": 0.1, "esperar": 0.06, "baixo": 0.06}
	else:
		opcoes = {"combo": 0.4, "rasteira": 0.14, "agarrar": 0.1 + 0.1 * minf(_defesas_seguidas, 3), "recuar": 0.1, "baixo": 0.08, "esperar": 0.06, "pular": 0.04}
	var r := randf()
	var plano := "esperar"
	for k in opcoes:
		r -= opcoes[k]
		if r <= 0.0:
			plano = k
			break
	match plano:
		"andar":
			for i in randi_range(10, 24):
				_fila.append({"frente": true})
		"recuar":
			for i in randi_range(8, 16):
				_fila.append({"tras": true})
		"dash":
			_empilhar([{"frente": true}, {}, {"frente": true}, {"frente": true}])
		"pular":
			_empilhar([{"cima": true, "frente": true}, {"frente": true}, {"frente": true}, {"frente": true}])
		"projetil", "frente", "baixo", "tras":
			if _pode(plano):
				_empilhar([_especial(plano), {}])
			else:
				for i in 8:
					_fila.append({"frente": true})
		"combo":
			var sequencias := [
				[{"soco": true}, {}, {}, {}, {}, {"soco": true}, {}, {}, {}, {}, {}, {"chute": true}],
				[{"chute": true}, {}, {}, {}, {}, {}, {}, {}, {"chute": true}],
				[{"soco": true}, {}, {}, {}, {}, {"frente": true, "soco": true}],
				[{"frente": true, "chute": true}],
				[{"frente": true, "soco": true}],
			]
			_empilhar(sequencias[randi() % sequencias.size()])
			_defesas_seguidas = 0
		"rasteira":
			_empilhar([{"baixo": true}, {"baixo": true, "chute": true}, {"baixo": true}])
		"agarrar":
			_empilhar([{"frente": true}, {"frente": true}, {"agarrar": true}, {}])
			_defesas_seguidas = 0
		_:
			pass
