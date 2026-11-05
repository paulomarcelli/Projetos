class_name IA
## Jogador da CPU. Decide um plano a cada poucos quadros (avançar, pular, soltar especial,
## atacar de perto) e defende ou dá o gancho antiaéreo conforme o nível (0 a 1).

var eu: Lutador
var op: Lutador
var nivel := 0.55
var perigo := false  # a luta avisa quando há projétil vindo

var _plano := "esperar"
var _t := 0
var _cd := 0
var _defende := 0
var _avaliou_ameaca := false


func _init(nivel_: float = 0.55) -> void:
	nivel = nivel_


func ler() -> Dictionary:
	var d := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false, "especial": false, "provocar": false}
	if eu == null or op == null:
		return d
	var dist := absf(op.position.x - eu.position.x)
	var frente := "dir" if op.position.x >= eu.position.x else "esq"
	var tras := "esq" if frente == "dir" else "dir"
	_t -= 1
	_cd -= 1

	# 1) defesa: quando o rival ataca de perto ou vem projétil
	var ameaca := (op.esta_atacando() and dist < 270.0) or perigo
	if ameaca and not _avaliou_ameaca:
		_avaliou_ameaca = true
		if randf() < nivel * 0.85:
			_defende = 20
	if not ameaca:
		_avaliou_ameaca = false
	if _defende > 0 and eu.pode_agir() or (_defende > 0 and eu.estado == Lutador.E.DEFENDENDO):
		_defende -= 1
		d[tras] = true
		d["baixo"] = op.esta_atacando() and op.nivel_golpe() == "baixo"
		return d

	# 2) antiaéreo
	if op.estado == Lutador.E.PULANDO and dist < 190.0 and op.vel.y > -4.0 and eu.pode_agir() and _cd <= 0:
		if randf() < nivel * 0.5:
			d["cima"] = true
			d["especial"] = true
			_cd = 30
			return d

	# 3) no ar: voadora na descida
	if eu.estado == Lutador.E.PULANDO and eu.vel.y > 0 and dist < 170.0 and _cd <= 0:
		d["chute"] = true
		_cd = 20
		return d

	# provoca de vez em quando, de longe
	if dist > 520.0 and eu.pode_agir() and randf() < 0.004:
		d["provocar"] = true
		return d

	# 4) plano
	if _t <= 0:
		_escolher_plano(dist)
	match _plano:
		"avancar":
			d[frente] = true
			if dist < 120.0:
				_plano = "atacar"
		"recuar":
			d[tras] = true
		"pular":
			d["cima"] = true
			d[frente] = true
			_plano = "esperar"
		"projetil":
			if _cd <= 0 and not eu.tem_projetil:
				d["especial"] = true
				_cd = 40
			_plano = "esperar"
		"investida":
			if _cd <= 0:
				d[frente] = true
				d["especial"] = true
				_cd = 50
			_plano = "esperar"
		"super":
			d["baixo"] = true
			d["especial"] = true
			_plano = "esperar"
		"atacar":
			if dist > 150.0:
				d[frente] = true
			elif _cd <= 0:
				d["soco" if randf() < 0.55 else "chute"] = true
				_cd = randi_range(10, 22)
		"rasteira":
			d["baixo"] = true
			if dist < 150.0 and _cd <= 0:
				d["chute" if randf() < 0.6 else "soco"] = true
				_cd = 24
	return d


func _escolher_plano(dist: float) -> void:
	_t = randi_range(14, 32)
	var opcoes: Dictionary
	if eu.barra >= 100.0 and dist < 600.0 and randf() < 0.4:
		_plano = "super"
		return
	if dist > 450.0:
		opcoes = {"projetil": 0.35, "avancar": 0.45, "pular": 0.08, "esperar": 0.12}
	elif dist > 180.0:
		opcoes = {"avancar": 0.42, "pular": 0.16, "investida": 0.12, "projetil": 0.14, "recuar": 0.08, "esperar": 0.08}
	else:
		opcoes = {"atacar": 0.52, "rasteira": 0.2, "recuar": 0.12, "pular": 0.06, "esperar": 0.1}
	var r := randf()
	for k in opcoes:
		r -= opcoes[k]
		if r <= 0.0:
			_plano = k
			return
	_plano = "esperar"
