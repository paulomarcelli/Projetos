class_name Luta
extends Node2D
## A luta: dois lutadores, rounds (melhor de 3), tempo, colisões, combos, agarrões,
## projéteis, zonas, chuva de objetos, SUPER e ULTIMATE com cinemática, câmera com zoom e tremor,
## partículas, sons e o HUD de fliperama. Também roda o modo treino.

signal terminou(vencedor: int)  # 0 = jogador 1, 1 = jogador 2
signal sair
signal dessincronizou

# ---------------------------------------------------------------- online (lockstep)
## As duas pontas rodam a mesma simulação quadro a quadro com as mesmas entradas. Cada um manda
## a sua entrada para "quadro + atraso" e só avança quando tem as dos dois para o quadro atual.
const BOTOES := ["esq", "dir", "cima", "baixo", "soco", "chute", "especial", "provocar", "super", "agarrar"]
var online = null          # transporte com enviar(d: Dictionary)
var eu := 0                # meu lado (0 = anfitrião, 1 = convidado)
var atraso := 4
var q_sim := 0             # quadro da simulação
var parado_q := 0          # quadros seguidos esperando o outro
var fonte_local = null     # quem lê a minha entrada (teclado/toque, ou o teste)
var rng := RandomNumberGenerator.new()  # aleatoriedade que muda o jogo (igual nas duas pontas)
var tempo_round_fixo := -1
var _in := [{}, {}]        # quadro -> botões em bits, de cada lado
var _local_ate := -1
var _chk := [{}, {}]

var dados_p: Array = []
var humano := [true, false]
var nivel_cpu := 0.55
var cenario := "praca"
var treino := false
var rotulo_modo := ""  # "ARCADE 2/4" etc.

var p: Array[Lutador] = []
var ias: Array = [null, null]
var projeteis: Array[Projetil] = []
var zonas: Array[Zona] = []
var efeitos: Array[Dictionary] = []
var particulas := Particulas.new()
var rastros: Array[Dictionary] = []
var vitorias := [0, 0]
var round_n := 1
var tempo := 99.0
var fase := "intro"
var fase_t := 0
var hitstop := 0
var _treme := -1  # quem treme durante a pausa de impacto

## Onomatopeias de quadrinho nos golpes fortes, e a palavra de cada um nos especiais e no SUPER.
const POW := ["POW!", "PÁ!", "TUM!", "BAM!", "CRÁS!", "TOMA!"]
const IMPACTOS := {
	"lula": ["PICANHA!", "FAZ O L!", "COMPANHEIRO!"],
	"bolsonaro": ["TALKEY?", "TÁ OK?", "IMBROCHÁVEL!"],
	"xandao": ["INQUÉRITO!", "MULTA DIÁRIA!", "SUSPENSO!"],
	"trump": ["YOU'RE FIRED!", "TARIFF!", "TREMENDOUS!"],
	"eduarda": ["MAIS VOTADA!", "CORTE VIRAL!", "ME SEGUE!"],
	"erika": ["6x1 NÃO!", "ASSINA A PEC!", "REPRESENTEI!"],
	"pavanato": ["TÁ GRAVANDO?", "ANTIWOKE!", "VEM DEBATER!"],
	"nikolas": ["VIRALIZOU!", "REVOGA!", "O PIX É NOSSO!"],
	"flavio": ["É SÓ CHOCOLATE!", "VERSÃO 3!", "TARIFLÁVIO!"],
	"renan": ["NEM-NEM!", "VOTA 14!", "CORTA ESSA!"],
	"dilma": ["ESTOCA VENTO!", "MANDIOCA!", "DOBROU A META!"],
}
var congelado := 0
var tremor := 0.0
var combo := [0, 0]
var combo_dano := [0.0, 0.0]
var combo_t := [0, 0]
var vida_vis := [1000.0, 1000.0]
var msg := ""
var msg_t := 0
var vencedor := -1
var tempo_total := 0.0
var agito := 0.0  # torcida: sobe com os golpes, a plateia pula mais
var cinema: Dictionary = {}
var pausado := false
var pausa_opcao := 0
var aviso_barra := [0, 0]
var _sem_dano := [0, 0]
var _lento_ko := 0
var _recua_em := 0.0      # USP: quando a torcida canta "RECUA" (uma vez por partida)
var _recua_tocou := false
var _dilera := -1         # quadro em que o Dilera apareceu no canto (uma vez por partida)
var _dilera_audio := ""
var _quadro_impar := false

# câmera
var cam_zoom := 1.0
var cam_alvo := Vector2(640, 360)
var _zoom_alvo := 1.0
var _foco := Vector2(640, 360)

var _mundo: Node2D
var _cenario_vivo: Cache
var _rastro_camada: Camada
var _sombras: Camada
var _vx_ant := [0.0, 0.0]
var _efeitos: Camada
var _cinema_camada: Camada
var _cinema_fundo: Camada
var _hud: Camada
var _palco: Node2D
var _meme_cd := 0
var _toque: Toque


func configurar(a: Dictionary, b: Dictionary, dois_jogadores: bool, cpu_contra_cpu := false) -> void:
	dados_p = [a, b]
	humano = [not cpu_contra_cpu, dois_jogadores and not cpu_contra_cpu]


func configurar_online(transporte, lado: int, semente: int, atraso_q: int) -> void:
	online = transporte
	eu = lado
	atraso = atraso_q
	rng.seed = semente
	humano = [true, true]
	for f in atraso:
		_in[0][f] = 0
		_in[1][f] = 0
	_local_ate = atraso - 1


## Mensagens da rede para esta luta ("in" = entrada de um quadro, "chk" = conferência).
func rede_receber(d: Dictionary) -> void:
	match d.get("k", ""):
		"in":
			_in[1 - eu][int(d["f"])] = int(d["b"])
		"chk":
			_chk[1 - eu][int(d["f"])] = int(d["h"])
			_conferir(int(d["f"]))


static func bits(e: Dictionary) -> int:
	var b := 0
	for i in BOTOES.size():
		if e.get(BOTOES[i], false):
			b |= 1 << i
	return b


func entrada_online(lado: int) -> Dictionary:
	var b: int = _in[lado].get(q_sim, 0)
	var e := {}
	for i in BOTOES.size():
		e[BOTOES[i]] = (b >> i) & 1 == 1
	return e


## Resumo do estado que importa para o jogo (as duas pontas precisam dar o mesmo número).
func estado_hash() -> int:
	var a := [q_sim, round_n, vitorias[0], vitorias[1], fase, fase_t, hitstop, congelado, snappedf(tempo, 0.001), projeteis.size(), zonas.size()]
	for l in p:
		a.append_array([snappedf(l.position.x, 0.01), snappedf(l.position.y, 0.01), snappedf(l.vida, 0.01), snappedf(l.barra, 0.01), l.estado, l.quadro, l.lado])
	for pr in projeteis:
		a.append_array([snappedf(pr.position.x, 0.01), snappedf(pr.position.y, 0.01)])
	return hash(str(a))


func _conferir(f: int) -> void:
	if _chk[0].has(f) and _chk[1].has(f) and _chk[0][f] != _chk[1][f]:
		push_warning("dessincronizou no quadro %d" % f)
		dessincronizou.emit()
		online = null


## Manda a minha entrada adiantada e diz se já dá para rodar o quadro atual.
func _online_pronto() -> bool:
	while _local_ate < q_sim + atraso:
		_local_ate += 1
		var e: Dictionary = fonte_local.ler() if fonte_local != null and not pausado else {}
		var b := bits(e)
		_in[eu][_local_ate] = b
		online.enviar({"k": "in", "f": _local_ate, "b": b})
	return _in[1 - eu].has(q_sim)


func _online_depois() -> void:
	q_sim += 1
	for lado in 2:
		_in[lado].erase(q_sim - 30)
	if q_sim % 60 == 0:
		var h := estado_hash()
		_chk[eu][q_sim] = h
		online.enviar({"k": "chk", "f": q_sim, "h": h})
		if online.has_method("publicar"):
			online.publicar({"q": q_sim, "h": h, "vidas": [int(p[0].vida), int(p[1].vida)]})
		_conferir(q_sim)


class EntradaRede:
	var luta: Luta
	var lado := 0
	func _init(l: Luta, i: int) -> void:
		luta = l
		lado = i
	func ler() -> Dictionary:
		return luta.entrada_online(lado)


func _ready() -> void:
	if online == null:
		rng.randomize()
	_mundo = Node2D.new()
	add_child(_mundo)
	# o cenário vira textura (1 chamada de desenho por camada): fundo e frente são desenhados
	# uma vez só; a plateia é redesenhada 20 vezes por segundo
	Cache.criar(self, _mundo, func(c): Cenarios.fundo(c, cenario))
	_cenario_vivo = Cache.criar(self, _mundo, func(c): Cenarios.vivo(c, cenario, tempo_total, agito))
	Cache.criar(self, _mundo, func(c): Cenarios.frente(c, cenario))
	_palco = Node2D.new()
	_mundo.add_child(_palco)
	_sombras = _camada(_desenhar_sombras, 1, _palco)
	_rastro_camada = _camada(_desenhar_rastros, 1, _palco)
	_cinema_fundo = _camada(_desenhar_cinema_fundo, 1, _palco)
	for i in 2:
		var l := Lutador.new()
		l.z_index = 2
		_palco.add_child(l)
		p.append(l)
		l.tiro.connect(_soltar_tiro)
		l.zona.connect(_criar_zona)
		l.chuva.connect(_criar_chuva)
		l.falou.connect(_fala)
		l.poder.connect(_poder)
		l.disparou_ultimate.connect(_disparou_ultimate)
		l.provocou.connect(_provocou)
		l.evento.connect(_evento)
		if humano[i]:
			l.entrada = EntradaHumana.new(i + 1)
		elif treino and i == 1:
			l.entrada = null
		else:
			var ia := IA.new(nivel_cpu)
			ias[i] = ia
			l.entrada = ia
	if online != null:
		for i in 2:
			p[i].entrada = EntradaRede.new(self, i)
			ias[i] = null
		if fonte_local == null:
			fonte_local = EntradaHumana.new(1)
	p[0].oponente = p[1]
	p[1].oponente = p[0]
	p[0].treino = treino
	for i in 2:
		if ias[i] != null:
			ias[i].eu = p[i]
			ias[i].op = p[1 - i]
	_efeitos = _camada(_desenhar_efeitos, 5, _palco)
	_cinema_camada = _camada(_desenhar_cinema, 6, _mundo)
	_hud = _camada(_desenhar_hud, 10)
	if humano[0]:
		_toque = Toque.new()
		_toque.luta = self
		add_child(_toque)  # controles na tela (aparecem no celular ou depois do primeiro toque)
	Som.musica(Cenarios.musica(cenario))
	_novo_round()


func _camada(f: Callable, z: int, pai: Node = null) -> Camada:
	var c := Camada.new()
	c.desenhar = f
	c.z_index = z
	(pai if pai != null else self).add_child(c)
	return c


func _novo_round() -> void:
	p[0].configurar(dados_p[0], 380.0, 1)
	p[1].configurar(dados_p[1], 900.0, -1)
	for l in p:
		l.travado = true
		l.barra = l.barra if round_n > 1 else 0.0
	for pr in projeteis:
		pr.queue_free()
	projeteis.clear()
	for z in zonas:
		z.queue_free()
	zonas.clear()
	cinema = {}
	vida_vis = [p[0].vida, p[1].vida]
	var tr := tempo_round_fixo if tempo_round_fixo >= 0 else Config.tempo_round
	tempo = float(tr) if tr > 0 and not treino else 999.0
	combo = [0, 0]
	fase = "intro"
	fase_t = 0
	_zoom_alvo = 1.0
	if treino:
		p[0].barra = 100.0
	_mensagem("TREINO" if treino else ("ROUND %d" % round_n if round_n < 3 else "ROUND FINAL"), 70)
	Som.sfx("round", 0.0)


func _mensagem(t: String, dur: int) -> void:
	msg = t
	msg_t = dur


# ---------------------------------------------------------------- laço principal

func _unhandled_input(ev: InputEvent) -> void:
	if fase == "fim":
		return
	if ev.is_action_pressed("ui_cancel") or (ev is InputEventKey and ev.pressed and ev.physical_keycode == KEY_P and not ev.echo):
		_pausar(not pausado)
		get_viewport().set_input_as_handled()
		return
	var pt = Telas.toque(self, ev)
	if pt == null:
		return
	if not pausado and Rect2(600, 158, 80, 50).has_point(pt):
		_pausar(true)
		get_viewport().set_input_as_handled()
	elif pausado:
		for i in 3:
			if _bt_pausa(i).has_point(pt):
				pausa_opcao = i
				_escolher_pausa()
				get_viewport().set_input_as_handled()


func _pausar(sim: bool) -> void:
	pausado = sim
	pausa_opcao = 0
	Som.sfx("menu_ok" if sim else "menu_voltar", 0.0)
	if _toque != null:
		_toque.visible = not sim


func _bt_pausa(i: int) -> Rect2:
	return Rect2(440, 300 + i * 80, 400, 60)


func _escolher_pausa() -> void:
	match pausa_opcao:
		0:
			_pausar(false)
		1:
			if online != null:
				_pausar(false)
				return
			pausado = false
			vitorias = [0, 0]
			round_n = 1
			_novo_round()
		2:
			Som.sfx("menu_voltar", 0.0)
			if online != null:
				online.enviar({"k": "sair"})
			sair.emit()


func _physics_process(_delta: float) -> void:
	if online != null:
		# online: a pausa é só um menu por cima; a luta não para (o outro continua jogando)
		if pausado:
			_menu_pausa()
		if not _online_pronto():
			parado_q += 1
			_hud.queue_redraw()
			return
		parado_q = 0
		_tick()
		if online != null:
			_online_depois()
		return
	if pausado:
		_menu_pausa()
		return
	_tick()


func _menu_pausa() -> void:
	for a in ["p1_baixo", "p2_baixo", "ui_down"]:
		if Input.is_action_just_pressed(a):
			pausa_opcao = (pausa_opcao + 1) % 3
			Som.sfx("menu_mover", 0.0)
	for a in ["p1_cima", "p2_cima", "ui_up"]:
		if Input.is_action_just_pressed(a):
			pausa_opcao = (pausa_opcao + 2) % 3
			Som.sfx("menu_mover", 0.0)
	if Input.is_action_just_pressed("ui_accept") or Input.is_action_just_pressed("p1_soco"):
		_escolher_pausa()
	_hud.queue_redraw()


func _tick() -> void:
	# câmera lenta no nocaute: a lógica anda um quadro sim, outro não
	if _lento_ko > 0:
		_lento_ko -= 1
		_quadro_impar = not _quadro_impar
		if _quadro_impar:
			_atualizar_camera()
			_redesenhar()
			return
	tempo_total += 1.0 / 60.0
	fase_t += 1
	if msg_t > 0:
		msg_t -= 1
	tremor = maxf(tremor - 0.6, 0.0)
	agito = maxf(agito - 0.004, 0.0)
	if _meme_cd > 0:
		_meme_cd -= 1
	for i in 2:
		if aviso_barra[i] > 0:
			aviso_barra[i] -= 1
	_atualizar_efeitos()
	particulas.passo()
	if _dilera >= 0 and _dilera <= 110:
		_dilera += 1
	for i in 2:
		vida_vis[i] = move_toward(vida_vis[i], p[i].vida, 6.0) if vida_vis[i] > p[i].vida else p[i].vida
		if combo_t[i] > 0:
			combo_t[i] -= 1
		elif p[1 - i].estado != Lutador.E.ATINGIDO:
			combo[i] = 0
			combo_dano[i] = 0.0
	if treino:
		_passo_treino()

	match fase:
		"intro":
			# no 1º round cada um entra provocando, um de cada vez, e solta um bordão
			if round_n == 1 and not treino and fase_t in [4, 22]:
				var l: Lutador = p[0 if fase_t == 4 else 1]
				l._mudar(Lutador.E.PROVOCANDO)
				l.quadro = (90 if l.dados.get("id", "") == "trump" else 60) - (80 - fase_t)
				var memes: Array = l.dados.get("memes", [])
				if not memes.is_empty():
					# bem acima da cabeça, para não brigar com o "ROUND 1" no meio da tela
					_texto(l.position + Vector2(0, -440), memes[randi() % memes.size()], Color("ffd23f"), 26, 70)
			if fase_t == 72:
				_mensagem("LUTE!", 45)
				Som.sfx("lute", 0.0)
			if fase_t >= 80:
				for l in p:
					l.travado = false
				fase = "luta"
				fase_t = 0
			_passo_lutadores()
		"luta":
			if not cinema.is_empty():
				_passo_cinema()
			elif congelado > 0:
				congelado -= 1
				if congelado == 0:
					_zoom_alvo = 1.0
			elif hitstop > 0:
				hitstop -= 1
				if _treme >= 0:
					p[_treme].tremido = (5.0 if hitstop % 2 == 0 else -5.0) if hitstop > 0 else 0.0
					p[_treme].queue_redraw()
			else:
				_passo_lutadores()
				_passo_projeteis()
				_passo_zonas()
				_colisoes()
				_separar()
				if tempo < 900.0:
					tempo = maxf(tempo - 1.0 / 60.0, 0.0)
				_checar_fim()
				_torcida()
		"fim_round":
			_passo_lutadores()
			_passo_projeteis()
			if fase_t == 110:
				_zoom_alvo = 1.0
				var v := vencedor
				if v >= 0:
					p[v].comemorar()
					p[1 - v].lamentar()
					_fala_texto(p[v], p[v].dados["vitoria"], Color("ffd23f"))
					if vitorias[v] >= 2 and p[v].dados.has("vitoria_audio"):
						Som.meme("res://audio/memes/%s/%s.ogg" % [p[v].dados["id"], p[v].dados["vitoria_audio"]])
					else:
						_meme(v, true)
					Som.voz(p[v].dados["id"], "vitoria")
					Som.sfx("vitoria", 0.0)
					particulas.confete(Vector2(640, 0), 50)
			if fase_t >= 230:
				if vitorias[0] >= 2 or vitorias[1] >= 2:
					fase = "fim"
					terminou.emit(0 if vitorias[0] >= 2 else 1)
				else:
					round_n += 1
					_novo_round()
	_guardar_rastros()
	_atualizar_camera()
	_redesenhar()


func _redesenhar() -> void:
	# a plateia e o que anda no fundo mudam devagar: 20 vezes por segundo bastam
	if Engine.get_physics_frames() % 3 == 0:
		_cenario_vivo.atualizar()
	_sombras.queue_redraw()
	if not rastros.is_empty() or _rastro_camada.get_meta("tinha", false):
		_rastro_camada.queue_redraw()
	_rastro_camada.set_meta("tinha", not rastros.is_empty())
	_efeitos.queue_redraw()
	if not cinema.is_empty() or _cinema_fundo.get_meta("tinha", false):
		_cinema_camada.queue_redraw()
		_cinema_fundo.queue_redraw()
	_cinema_fundo.set_meta("tinha", not cinema.is_empty())
	_hud.queue_redraw()


func _passo_treino() -> void:
	var boneco := p[1]
	p[0].barra = 100.0
	for i in 2:
		_sem_dano[i] += 1
	if _sem_dano[1] > 90 and boneco.vida < boneco.vida_max and boneco.pode_agir():
		boneco.vida = boneco.vida_max
		vida_vis[1] = boneco.vida_max
	if p[0].vida < p[0].vida_max * 0.3:
		p[0].vida = p[0].vida_max


func _atualizar_camera() -> void:
	cam_zoom = lerpf(cam_zoom, _zoom_alvo, 0.12)
	cam_alvo = cam_alvo.lerp(_foco if _zoom_alvo > 1.01 else Vector2(640, 360), 0.12)
	var forca_tremor := tremor if Config.tremor else tremor * 0.15
	var desl := Vector2(randf_range(-forca_tremor, forca_tremor), randf_range(-forca_tremor, forca_tremor))
	# o centro da câmera não deixa aparecer fora do cenário
	var meia := Vector2(640, 360) / cam_zoom
	var centro := Vector2(clampf(cam_alvo.x, meia.x, 1280 - meia.x), clampf(cam_alvo.y, meia.y, 720 - meia.y))
	_mundo.scale = Vector2.ONE * cam_zoom
	_mundo.position = Vector2(640, 360) - centro * cam_zoom + desl


func _passo_lutadores() -> void:
	for i in 2:
		if ias[i] != null:
			ias[i].perigo = _projetil_vindo(i)
		p[i].passo()
		var l := p[i]
		if l.estado == Lutador.E.DASH or (l.estado == Lutador.E.ATACANDO and float(l.golpe.get("avanco", 0.0)) > 0.0 and l.quadro >= int(l.golpe["inicio"])):
			if fase_t % 2 == 0:
				particulas.velocidade(l.position, float(l.lado) * signf(l.vel.x if l.estado == Lutador.E.DASH else 1.0))
		# passos levantam um pouco de poeira; frear forte arrasta os pés no chão
		if l.no_chao():
			var vx := absf(l.vel.x)
			if l.estado == Lutador.E.ANDANDO and vx > 2.5 and l.tempo_vivo % 16 == 0:
				particulas.poeira(l.position + Vector2(-l.vel.x * 3.0, 0), 2)
			if vx > 1.2 and vx < _vx_ant[i] - 0.4 and fase_t % 3 == 0:
				particulas.arrasto(l.position + Vector2(signf(l.vel.x) * 18.0, 0), signf(l.vel.x))
			_vx_ant[i] = vx
		if l.estado == Lutador.E.ATACANDO and l.hab_slot != "" and l.hab.get("pose", "") == "churrasco" and fase_t % 5 == 0:
			particulas.fumaca(l.position + Vector2(l.lado * 120, -60), 1)


func _projetil_vindo(i: int) -> bool:
	for pr in projeteis:
		if pr.dono != p[i] and pr.atraso <= 0 and absf(pr.position.x - p[i].position.x) < 330.0 and (pr.queda or signf(p[i].position.x - pr.position.x) == signf(pr.vel.x)):
			return true
	return false


func _passo_projeteis() -> void:
	for pr in projeteis:
		pr.passo()
		if pr.forma == "picanha_fogo" and pr.atraso <= 0 and fase_t % 2 == 0:
			particulas.fogo(pr.position - pr.vel * 2.0)
	# projétil contra projétil: se anulam (os que atravessam passam por cima)
	for a in projeteis:
		for b in projeteis:
			if a != b and a.ativo and b.ativo and a.dono != b.dono and a.atraso <= 0 and b.atraso <= 0 and a.caixa().intersects(b.caixa()):
				if not a.atravessa:
					a.ativo = false
				if not b.atravessa:
					b.ativo = false
				particulas.impacto((a.position + b.position) / 2.0, 1.0, 0.6, Color("ffd23f"))
				Som.sfx("bloqueio")
	for pr in projeteis.duplicate():
		if not pr.ativo:
			projeteis.erase(pr)
			pr.queue_free()


func _passo_zonas() -> void:
	for z in zonas:
		z.passo()
		var alvo := z.dono.oponente
		if alvo == null:
			continue
		var dentro := z.caixa().intersects(alvo.hurtbox())
		if dentro:
			match z.efeito:
				"lento":
					alvo.lento = 12
				"bloqueio":
					alvo.bloqueado = maxi(alvo.bloqueado, 20)
			if z.pode_ferir():
				var g := {"dano": z.dano, "nivel": "medio", "atord": 10, "bloq": 6, "empurra": 3.0, "especial": true, "forca": "fraco"}
				var r := alvo.receber(g, z.position.x)
				if r != "":
					_resultado(p.find(z.dono), r, alvo.hurtbox().get_center(), g, false)
		if z.efeito == "apaga":
			for pr in projeteis:
				if pr.dono != z.dono and pr.ativo and pr.caixa().intersects(z.caixa()):
					pr.ativo = false
					particulas.fumaca(pr.position, 2)
	for z in zonas.duplicate():
		if not z.ativo:
			zonas.erase(z)
			z.queue_free()


func _colisoes() -> void:
	# agarrões primeiro
	for i in 2:
		var r := p[i].tentar_agarrar(p[1 - i])
		if r == "agarrou":
			Som.sfx("agarrao")
			Som.voz(p[i].dados["id"], "agarra")
			_texto(Vector2(640, 250), "AGARRÃO!", Color("ff8a5c"), 34, 40)
		elif r == "escapou":
			Som.sfx("bloqueio")
			_texto(Vector2(640, 250), "ESCAPOU!", Color("7ec8ff"), 34, 40)
	var golpes := []
	for i in 2:
		var c = p[i].caixa_ataque()
		if c != null and (c as Rect2).intersects(p[1 - i].hurtbox()):
			golpes.append(i)
	for i in golpes:
		var atk := p[i]
		var def := p[1 - i]
		var g: Dictionary = atk.golpe.duplicate()
		g["ultimo"] = atk.ultimo_hit()
		var estava_tonto := def.estado in [Lutador.E.ATINGIDO]
		g["dano"] = float(g.get("dano", 0.0)) * float(atk.dados.get("forca", 1.0)) * _escala_combo(i, estava_tonto)
		atk.registrar_acerto()
		var r := def.receber(g, atk.position.x, atk)
		_resultado(i, r, def.hurtbox().get_center().lerp(atk.position + Vector2(atk.lado * 70, -130), 0.5), g, estava_tonto)
		if r != "" and r != "bloqueio" and r != "perfeita" and g.get("explode", false) and g["ultimo"]:
			particulas.explosao(def.position + Vector2(0, -120), 0.8)
			Som.sfx("explosao")
	for pr in projeteis:
		if not pr.pode_acertar():
			continue
		var alvo_i := 1 if pr.dono == p[0] else 0
		var alvo := p[alvo_i]
		if pr.caixa().intersects(alvo.hurtbox()):
			var estava_tonto := alvo.estado == Lutador.E.ATINGIDO
			var g := pr.golpe.duplicate()
			g["dano"] = float(g["dano"]) * _escala_combo(1 - alvo_i, estava_tonto)
			g["ultimo"] = pr.hits_feitos >= pr.hits - 1
			var r := alvo.receber(g, pr.position.x - signf(pr.vel.x) * 10.0)
			if r != "":
				pr.acertou()
				if pr.queda:
					pr.ativo = false
				if pr.ao_quebrar != "":
					_quebrou(pr)
					pr.ativo = false
				_resultado(1 - alvo_i, r, pr.position, g, estava_tonto)


func _escala_combo(i: int, estava_tonto: bool) -> float:
	var n: int = combo[i] if estava_tonto else 0
	return maxf(0.4, 1.0 - 0.1 * n)


## Sons, partículas, pausa de impacto, tremor, barra e textos de cada resultado.
func _resultado(i: int, r: String, ponto: Vector2, g: Dictionary, estava_tonto: bool) -> void:
	if r == "":
		return
	var atk := p[i]
	var def := p[1 - i]
	var dir := float(atk.lado) if atk.position.x <= def.position.x + 1.0 else -1.0
	dir = 1.0 if def.position.x >= atk.position.x else -1.0
	var forca: String = g.get("forca", "medio")
	var peso: float = {"fraco": 0.2, "medio": 0.55, "forte": 1.0}.get(forca, 0.5)
	if g.get("especial", false):
		peso = maxf(peso, 0.8)
	match r:
		"bloqueio":
			hitstop = 4 + int(peso * 3)
			atk.barra = minf(atk.barra + 3.0, 100.0)
			particulas.bloqueio(ponto, dir)
			Som.sfx("bloqueio")
			return
		"perfeita":
			hitstop = 12
			particulas.bloqueio(ponto, dir)
			particulas.estrelas(ponto, 4)
			Som.sfx("contra", 0.0)
			_texto(def.position + Vector2(0, -360), "DEFESA PERFEITA!", Color("7ec8ff"), 30, 50)
			return
		"armadura":
			hitstop = 6
			particulas.impacto(ponto, dir, 0.3, Color("c9ced6"))
			Som.sfx("bloqueio", 0.0, 3.0)
			return
	_sem_dano[1 - i] = 0
	hitstop = int(lerpf(5.0, 12.0, peso)) + (4 if g.get("super", false) else 0)
	tremor = lerpf(2.0, 9.0, peso) + (3.0 if r in ["derrubou", "nocaute"] else 0.0)
	atk.barra = minf(atk.barra + lerpf(5.0, 10.0, peso), 100.0)
	agito = minf(agito + 0.08 + peso * 0.1, 1.0)
	var cor := Color("fff3b0") if peso < 0.7 else Color("ffd23f")
	if g.get("especial", false) or g.get("super", false):
		# especiais: faíscas puxando para a cor de quem bateu
		cor = cor.lerp(atk.dados.get("cor", cor), 0.55)
	if def.ultimo_contra:
		cor = Color("ff5a4e")
		_texto(def.position + Vector2(0, -360), "CONTRA-ATAQUE!", Color("ff5a4e"), 30, 50)
		hitstop += 4
	particulas.impacto(ponto, dir, peso, cor)
	if peso >= 0.9:
		particulas.estrelas(ponto, 3)
	if r == "derrubou" and randf() < 0.35:
		_chamar_dilera()
	_treme = 1 - i
	# balão de quadrinho: a palavra do lutador nos especiais, onomatopeia nos golpes fortes
	var especial: bool = g.get("especial", false) or g.get("super", false)
	if especial or peso >= 0.9 or r in ["derrubou", "nocaute"]:
		var palavras: Array = IMPACTOS.get(atk.dados.get("id", ""), POW) if especial else POW
		var cor_b: Color = atk.dados.get("cor", Color("ffd23f")) if especial else Color("ffd23f")
		efeitos.append({"tipo": "pow", "pos": ponto + Vector2(dir * 40.0, -60.0), "t": 0, "dur": 34 if especial else 24,
			"txt": palavras[randi() % palavras.size()], "cor": cor_b, "giro": randf_range(-0.25, 0.25), "grande": especial})
	var som := "soco_fraco"
	if forca == "forte" or g.get("especial", false):
		som = "impacto" if r in ["derrubou", "nocaute"] else "soco_forte"
	elif forca == "medio":
		som = "chute"
	Som.sfx(som)
	if randf() < 0.55:
		Som.voz(def.dados["id"], "dor" if randf() < 0.6 else "dor2")
	if g.get("final", false) or g.get("super", false):
		_meme(i)
	combo[i] = combo[i] + 1 if estava_tonto else 1
	combo_dano[i] = (combo_dano[i] if estava_tonto else 0.0) + float(g.get("dano", 0.0))
	combo_t[i] = 40
	if combo[i] >= 2:
		var tam := 30 + mini(combo[i], 8) * 3
		_texto(Vector2(220 if i == 0 else 1060, 250), "%d HITS!" % combo[i], Color("ffd23f"), tam, 50)
	if g.get("ao_acertar", "") == "bloqueio_supremo":
		_texto(def.position + Vector2(0, -380), "BLOQUEIO SUPREMO!", Color("ff5a4e"), 32, 70)
		Som.sfx("carimbo", 0.0)
	elif g.get("ao_acertar", "") == "censura":
		_texto(def.position + Vector2(0, -390), "CENSURADO!", Color("ff5a4e"), 48, 90)
		Som.sfx("carimbo", 0.0)
		tremor = maxf(tremor, 10.0)
	# empurrão no canto: quem bate é que recua
	if def.position.x <= Lutador.LIMITE_ESQ + 1.0 or def.position.x >= Lutador.LIMITE_DIR - 1.0:
		atk.position.x -= atk.lado * float(g.get("empurra", 6.0)) * 1.5


func _separar() -> void:
	var a := p[0]
	var b := p[1]
	if a.estado == Lutador.E.AGARRADO or b.estado == Lutador.E.AGARRADO:
		return
	if absf(a.position.y - b.position.y) > 130.0:
		return
	var dx := b.position.x - a.position.x
	var minimo := 64.0 * Lutador.TAM
	if absf(dx) < minimo:
		var falta := (minimo - absf(dx)) / 2.0
		var s := signf(dx) if dx != 0.0 else float(a.lado)
		a.position.x -= s * falta
		b.position.x += s * falta
		for l in p:
			l.position.x = clampf(l.position.x, Lutador.LIMITE_ESQ, Lutador.LIMITE_DIR)
		# se um está na parede, o outro é que sai
		if absf(b.position.x - a.position.x) < minimo - 1.0:
			if a.position.x <= Lutador.LIMITE_ESQ + 1.0 or a.position.x >= Lutador.LIMITE_DIR - 1.0:
				b.position.x = a.position.x + s * minimo
			else:
				a.position.x = b.position.x - s * minimo


func _checar_fim() -> void:
	if treino:
		return
	var ko := [p[0].vida <= 0.0, p[1].vida <= 0.0]
	if ko[0] or ko[1] or tempo <= 0.0:
		if ko[0] and ko[1]:
			vencedor = -1
		elif ko[0]:
			vencedor = 1
		elif ko[1]:
			vencedor = 0
		elif p[0].vida == p[1].vida:
			vencedor = -1
		else:
			vencedor = 0 if p[0].vida > p[1].vida else 1
		if vencedor >= 0:
			vitorias[vencedor] += 1
		else:
			vitorias[0] += 1
			vitorias[1] += 1
		var nocaute: bool = ko[0] or ko[1]
		_mensagem("K.O.!" if nocaute else ("EMPATE!" if vencedor < 0 else "TEMPO!"), 100)
		if nocaute:
			hitstop = 0
			tremor = 14.0
			_lento_ko = 70
			_zoom_alvo = 1.35
			_foco = p[1 if ko[1] else 0].position + Vector2(0, -150)
			agito = 1.0
			Som.sfx("ko", 0.0)
			Som.voz(p[1 if ko[1] else 0].dados["id"], "derrota")
			particulas.explosao(p[1 if ko[1] else 0].position + Vector2(0, -140), 1.0)
			# balão de quadrinho gigante com a palavra de quem venceu, em cima de quem caiu
			var caiu: Lutador = p[1 if ko[1] else 0]
			var venceu: Lutador = p[0 if ko[1] else 1]
			var palavras: Array = IMPACTOS.get(venceu.dados.get("id", ""), POW)
			# entra quando o "K.O.!" já está sumindo (t negativo = espera)
			efeitos.append({"tipo": "pow", "pos": caiu.position + Vector2(0, -230), "t": -70, "dur": 150, "txt": palavras[0],
				"cor": venceu.dados.get("cor", Color("ffd23f")), "giro": 0.12, "grande": true, "escala": 1.5})
		else:
			Som.sfx("round", 0.0)
		for l in p:
			l.travado = true
		fase = "fim_round"
		fase_t = 0


# ---------------------------------------------------------------- eventos dos lutadores

func _soltar_tiro(l: Lutador, spec: Dictionary) -> void:
	var pr := Projetil.new()
	pr.z_index = 3
	pr.iniciar(l, spec)
	pr.quebrou.connect(_quebrou)
	_palco.add_child(pr)
	projeteis.append(pr)
	if spec.get("forma", "") == "rolha":
		# clarão na boca do cano e o cartucho voando para trás
		particulas.clarao(pr.position + Vector2(l.lado * 6.0, 0), float(l.lado))
		particulas.cartucho(l.position + Vector2(l.lado * 40.0, -150), -float(l.lado))
		tremor = maxf(tremor, 1.5)


func _quebrou(pr: Projetil) -> void:
	if pr.ao_quebrar == "explosao":
		particulas.explosao(pr.position + Vector2(0, -20), 0.9)
		particulas.onda(Vector2(pr.position.x, Lutador.CHAO), 1.0)
		tremor = maxf(tremor, 6.0)
		Som.sfx("explosao", 0.1, -3.0)
		_texto(pr.position + Vector2(randf_range(-30, 30), -110), "BUM!", Color("ffd23f"), 40, 30)
		return
	if pr.ao_quebrar == "brasa":
		particulas.explosao(pr.position + Vector2(0, -10), 0.45)
		particulas.fumaca(pr.position, 2, Color(0.4, 0.38, 0.4, 0.6))
		Som.sfx("churrasco", 0.1, -8.0)
		return
	if pr.ao_quebrar == "papelada":
		# o calendário 6x1 se rasga em pedaços de papel e sobe um "4x3"
		particulas.confete(pr.position + Vector2(0, -40), 10)
		particulas.poeira(Vector2(pr.position.x, Lutador.CHAO), 4)
		Som.sfx("papel", 0.1, -6.0)
		_texto(pr.position + Vector2(randf_range(-20, 20), -120), "4x3!", Color("ffd23f"), 34, 26)
		return
	if pr.ao_quebrar == "nuvem":
		var z := Zona.new()
		z.iniciar_em(pr.dono, pr.position.x, "nuvem")
		_palco.add_child(z)
		z.z_index = 1
		zonas.append(z)
		particulas.fumaca(pr.position, 6, Color(0.5, 0.9, 0.4, 0.6))
		Som.sfx("frasco", 0.0)


func _criar_zona(l: Lutador, spec: Dictionary) -> void:
	var z := Zona.new()
	z.iniciar(l, spec)
	z.z_index = 1
	_palco.add_child(z)
	zonas.append(z)


func _criar_chuva(l: Lutador, spec: Dictionary) -> void:
	var alvo := l.oponente
	var qtd: int = spec.get("qtd", 1)
	var espalha: float = spec.get("espalha", 0.0)
	for k in qtd:
		var pr := Projetil.new()
		pr.z_index = 3
		var x := alvo.position.x + (rng.randf_range(-espalha, espalha) if k > 0 else 0.0)
		pr.iniciar_queda(l, spec, clampf(x, 60.0, 1220.0), int(spec.get("atraso", 30)) + k * int(spec.get("intervalo", 6)))
		_palco.add_child(pr)
		projeteis.append(pr)
	if spec.get("veiculo", "") != "":
		efeitos.append({"tipo": "veiculo", "forma": spec["veiculo"], "t": 0, "dur": 110, "dir": l.lado})


## USP: uma vez por partida a torcida canta "RECUA!" (só som e plateia: não mexe na luta).
func _torcida() -> void:
	if cenario != "usp" or _recua_tocou or treino:
		return
	if _recua_em <= 0.0:
		_recua_em = randf_range(12.0, 30.0)
	if tempo_total >= _recua_em:
		_recua_tocou = true
		Som.ambiente("res://audio/cenario/recua.ogg")
		agito = 1.0
		_texto(Vector2(640, 250), "RECUA! RECUA!", Color("ff5a4e"), 40, 150)


## O Dilera aparece no canto da tela (como o "Toasty!" dos fliperamas) e solta um áudio. Uma vez por partida.
const DILERA := ["ai_paje", "aiiin_gugu", "guguu", "oi_torto", "careca_do_stf"]


func _chamar_dilera() -> void:
	if _dilera >= 0 or treino:
		return
	_dilera = 0
	_dilera_audio = DILERA[randi() % DILERA.size()]
	Som.meme("res://audio/dilera/%s.ogg" % _dilera_audio)


func _desenhar_dilera(c: CanvasItem) -> void:
	if _dilera < 0 or _dilera > 110:
		return
	var t := float(_dilera)
	var entra := clampf(t / 10.0, 0.0, 1.0)
	var sai := clampf((110.0 - t) / 12.0, 0.0, 1.0)
	var k := minf(entra, sai)
	var tex := Desenho.textura("dilera")
	var alt := 300.0
	var base := Vector2(1280.0 - 150.0, 720.0 + alt * (1.0 - k) * 0.9)
	if tex != null:
		var w := alt * tex.get_width() / float(tex.get_height())
		c.draw_texture_rect(tex, Rect2(base.x - w / 2.0, base.y - alt, w, alt), false)
	else:
		# sem a foto: um rostinho de desenho no lugar
		c.draw_circle(base + Vector2(0, -170), 90.0, Color("e0aa88"))
		c.draw_circle(base + Vector2(-30, -190), 14.0, Color.WHITE)
		c.draw_circle(base + Vector2(30, -190), 14.0, Color.WHITE)
		c.draw_circle(base + Vector2(-30, -190), 6.0, Desenho.PRETO)
		c.draw_circle(base + Vector2(30, -190), 6.0, Desenho.PRETO)
		c.draw_rect(Rect2(base + Vector2(-34, -140), Vector2(68, 14)), Color("b0304a"))
	if k > 0.6:
		Desenho.texto(c, base + Vector2(-60, -alt - 14), "DILERA!", 30, Color("ffd23f"), Desenho.PRETO, 6)


func _fala(l: Lutador, texto: String) -> void:
	_fala_texto(l, texto, Color.WHITE)


func _fala_texto(l: Lutador, texto: String, cor: Color) -> void:
	if l.censurado > 0:
		texto = "#".repeat(mini(texto.length(), 12))
		cor = Color("9aa0a6")
	_texto(l.position + Vector2(0, -330), texto, cor, 28)


func _provocou(l: Lutador) -> void:
	l.barra = minf(l.barra + 12.0, 100.0)
	Som.voz(l.dados["id"], "provocar")
	if l.dados.get("id", "") == "trump":
		Som.sfx("danca", 0.0)
	_meme(p.find(l), true)


func _evento(l: Lutador, nome: String) -> void:
	var i := p.find(l)
	var id: String = l.dados.get("id", "")
	match nome:
		"pulo":
			Som.sfx("pulo")
			particulas.poeira(l.position, 4)
		"aterrissa":
			Som.sfx("aterrissa")
			particulas.poeira(l.position, 6)
		"dash":
			Som.sfx("dash")
			particulas.poeira(l.position, 5, true)
		"derrapa":
			particulas.poeira(l.position + Vector2(-l.lado * 20.0, 0), 4, true)
		"queda":
			Som.sfx("queda")
			particulas.poeira(l.position, 10, true)
			particulas.onda(l.position, 0.7)
			tremor = maxf(tremor, 4.0)
		"golpe":
			var forte: bool = l.golpe.get("forca", "") == "forte"
			Som.sfx("whoosh_forte" if forte else "whoosh", 0.1, -4.0)
			if randf() < (0.7 if forte else 0.35):
				Som.voz(id, "forte" if forte else ("ataque1" if randf() < 0.5 else "ataque2"))
		"ativo":
			if l.hab.has("trilha"):
				Som.trilha(l.hab["trilha"])
			# especial saindo: anel e faíscas na cor do lutador, na altura do peito
			if not l.hab.is_empty() and l.golpe_nome != "ultimate":
				var cor_l: Color = l.dados.get("cor", Color("ffd23f"))
				var peito := l.position + Vector2(l.lado * 60.0, -150.0)
				particulas.brilho(peito, cor_l, 1.0 if l.golpe_nome == "super" else 0.6)
		"voz_especial", "voz_super":
			Som.voz(id, "super" if nome == "voz_super" else "especial")
			if l.hab.has("som"):
				Som.sfx(l.hab["som"], 0.02)
		"sem_energia":
			Som.sfx("sem_energia", 0.0)
			aviso_barra[i] = 40
			_texto(l.position + Vector2(0, -330), "SEM ENERGIA", Color("ff5a4e"), 24, 40)
		"recarga":
			Som.sfx("recarga", 0.0)
			_texto(l.position + Vector2(0, -330), "RECARREGANDO", Color("9aa0a6"), 20, 30)
		"bloqueado":
			Som.sfx("sem_energia", 0.0)
			_texto(l.position + Vector2(0, -330), "BLOQUEADO!", Color("ff5a4e"), 26, 40)
		"barra_cheia":
			Som.sfx("energia_cheia", 0.0)
			if humano[i]:
				_texto(Vector2(220 if i == 0 else 1060, 640), "ULTIMATE PRONTO!", Color("ffd23f"), 22, 70)
		"arremesso":
			Som.sfx("arremesso", 0.0)
			tremor = maxf(tremor, 6.0)


## SUPER e ULTIMATE: congela a tela, escurece, dá zoom em quem soltou.
func _poder(l: Lutador, tipo: String) -> void:
	var ult := tipo == "ultimate"
	congelado = 40 if ult else 24
	_zoom_alvo = 1.3 if ult else 1.15
	_foco = l.position + Vector2(0, -170)
	efeitos.append({"tipo": "poder", "t": 0, "dur": congelado + 6, "dono": l, "ult": ult})
	if not ult:
		congelado = 34
		var memes: Array = l.dados.get("memes", [""])
		efeitos.append({"tipo": "cutin", "t": 0, "dur": 40, "dados": l.dados, "lado": p.find(l), "nome": l.hab.get("nome", ""), "frase": memes[randi() % memes.size()]})
	# quadro de impacto: clarão na cor do lutador, onda no chão e brilho no peito
	efeitos.append({"tipo": "clarao", "t": 0, "dur": 10, "cor": l.dados.get("cor", Color("ffd23f"))})
	particulas.onda(l.position, 1.2)
	particulas.brilho(l.position + Vector2(0, -150), l.dados.get("cor", Color("ffd23f")), 1.4)
	Som.sfx("ultimate" if ult else "super", 0.0)
	if ult:
		Som.voz(l.dados["id"], "super")
	agito = minf(agito + 0.3, 1.0)


## O ultimate pega quem está no chão e não defendeu. Pulando ou defendendo, escapa.
func _disparou_ultimate(l: Lutador) -> void:
	var alvo := l.oponente
	var esquivou := alvo.estado in [Lutador.E.CAIDO, Lutador.E.NOCAUTE, Lutador.E.LEVANTANDO] or alvo.invencivel > 0 or not alvo.no_chao()
	var tras: bool = alvo._antes.get("esq", false) if l.position.x > alvo.position.x else alvo._antes.get("dir", false)
	if esquivou:
		_texto(l.position + Vector2(0, -330), "ESQUIVOU!", Color("7ec8ff"), 30, 50)
		Som.sfx("whoosh_forte", 0.0)
		return
	if tras and alvo.pode_bloquear_estado():
		var g := {"dano": 90.0, "nivel": "medio", "bloq": 24, "empurra": 16.0, "especial": true, "forca": "forte"}
		alvo.receber(g, l.position.x)
		particulas.bloqueio(alvo.hurtbox().get_center(), float(l.lado))
		_texto(alvo.position + Vector2(0, -330), "DEFENDEU!", Color("7ec8ff"), 30, 50)
		Som.sfx("bloqueio", 0.0)
		hitstop = 12
		return
	var h: Dictionary = l.dados["habilidades"]["ultimate"]
	cinema = {"atk": p.find(l), "t": 0, "dur": 230, "id": h.get("cinema", ""), "dano": float(h.get("dano", 300.0)) * float(l.dados.get("forca", 1.0)),
		"hits": int(h.get("hits", 6)), "dados_hits": 0, "ao_acertar": h.get("ao_acertar", ""), "cura": float(h.get("cura", 0.0))}
	l.entrar_cinematica(true)
	alvo.entrar_cinematica(false)
	Som.trilha(String(h.get("trilha", "res://audio/ultimate/%s.ogg" % l.dados.get("id", ""))))
	# arruma os dois no palco para a cena
	var centro := clampf((l.position.x + alvo.position.x) / 2.0, 340.0, 940.0)
	var lado := 1.0 if alvo.position.x >= l.position.x else -1.0
	l.position = Vector2(centro - lado * 170.0, Lutador.CHAO)
	alvo.position = Vector2(centro + lado * 170.0, Lutador.CHAO)
	l.lado = int(lado)
	alvo.lado = -int(lado)
	for pr in projeteis:
		pr.queue_free()
	projeteis.clear()
	_zoom_alvo = 1.12
	_foco = Vector2(centro, 420)
	Som.abafar(true)


func _passo_cinema() -> void:
	var c := cinema
	c["t"] += 1
	var atk := p[c["atk"]]
	var def := p[1 - c["atk"]]
	atk.quadro += 1
	atk.tempo_vivo += 1
	def.quadro += 1
	def.tempo_vivo += 1
	atk._atualizar_visual()
	def._atualizar_visual()
	var t: int = c["t"]
	var hits: int = c["hits"]
	# acertos espalhados entre 70 e 190
	var proximo: int = 70 + int(c["dados_hits"] * 120.0 / maxf(1.0, hits - 1))
	if c["dados_hits"] < hits and t >= proximo:
		c["dados_hits"] += 1
		var dano: float = c["dano"] / hits
		def.vida = maxf(def.vida - dano, 1.0 if c["dados_hits"] < hits else 0.0)
		def.flash = 6
		var ponto := def.position + Vector2(randf_range(-30, 30), randf_range(-200, -80))
		particulas.impacto(ponto, float(atk.lado), 1.0, Color("ffd23f"))
		tremor = 7.0
		Som.sfx("impacto" if c["dados_hits"] == hits else ["soco_forte", "chute_forte", "explosao"][c["dados_hits"] % 3])
		if c["dados_hits"] % 2 == 0:
			Som.voz(def.dados["id"], "dor")
		combo[c["atk"]] = c["dados_hits"]
		combo_t[c["atk"]] = 60
	Cinematica.passo(c, atk, def, particulas)
	if t >= c["dur"]:
		cinema = {}
		_zoom_alvo = 1.0
		Som.abafar(false)
		atk.sair_cinematica()
		if c["cura"] > 0.0:
			atk.vida = minf(atk.vida + c["cura"], atk.vida_max)
		def.estado = Lutador.E.PARADO
		if c["ao_acertar"] == "bloqueio_supremo":
			def.bloqueado = 300
		def._cair(float(atk.lado), def.vida <= 0.0)
		tremor = 12.0
		particulas.explosao(def.position + Vector2(0, -100), 1.0)
		Som.sfx("explosao", 0.0)
		_texto(Vector2(640, 250), "%d HITS!" % hits, Color("ffd23f"), 48, 60)
		_checar_fim()


# ---------------------------------------------------------------- memes

## Solta um meme do lutador i: o retrato entra na tela com a frase.
func _meme(i: int, forcar := false) -> void:
	if _meme_cd > 0 and not forcar:
		return
	var d: Dictionary = p[i].dados
	var memes: Array = d.get("memes", [])
	if memes.is_empty():
		return
	var txt: String = memes[randi() % memes.size()]
	# quando o lutador tem memes em áudio, quase sempre sai um deles (com a legenda certa)
	var falados: Array = d.get("memes_audio", [])
	if not falados.is_empty() and randf() < 0.75:
		var m: Array = falados[randi() % falados.size()]
		txt = m[0]
		Som.meme("res://audio/memes/%s/%s.ogg" % [d["id"], m[1]])
	efeitos = efeitos.filter(func(ef): return ef["tipo"] != "meme")
	efeitos.append({"tipo": "meme", "t": 0, "dur": 110, "lado": i, "txt": txt, "dados": d})
	_meme_cd = 360


# ---------------------------------------------------------------- efeitos

func _texto(pos: Vector2, txt: String, cor: Color, tam: int, dur: int = 60) -> void:
	efeitos.append({"tipo": "texto", "pos": pos, "t": 0, "dur": dur, "cor": cor, "txt": txt, "tam": tam})


func _atualizar_efeitos() -> void:
	for ef in efeitos:
		ef["t"] += 1
	efeitos = efeitos.filter(func(ef): return ef["t"] < ef["dur"])


## Guarda as silhuetas de quem corre (dash, investidas, ultimate) para desenhar o rastro.
func _guardar_rastros() -> void:
	for r in rastros:
		r["t"] += 1
	rastros = rastros.filter(func(r): return r["t"] < 10)
	if fase_t % 2 != 0:
		return
	for l in p:
		var correndo := l.estado == Lutador.E.DASH or (l.estado == Lutador.E.ATACANDO and (float(l.golpe.get("avanco", 0.0)) > 0.0 or l.golpe_nome == "pisao") and l.quadro >= int(l.golpe["inicio"]))
		if correndo:
			rastros.append({"pos": l.position, "escala": l.scale, "rot": l.rotation, "pose": l._pose_atual, "dados": l.dados, "t": 0, "cor": l.dados.get("cor", Color.WHITE)})


func _desenhar_rastros(c: CanvasItem) -> void:
	for r in rastros:
		var cor: Color = r["cor"]
		cor.a = 0.35 * (1.0 - r["t"] / 10.0)
		Desenho.silhueta(c, r["dados"], r["pose"], r["pos"], r["escala"], r["rot"], cor)


func _desenhar_sombras(c: CanvasItem) -> void:
	for l in p:
		var altura := Lutador.CHAO - l.position.y
		c.draw_set_transform(Vector2(l.position.x, Lutador.CHAO), 0.0, Vector2(1.0, 0.22))
		c.draw_circle(Vector2.ZERO, 62.0 - clampf(altura * 0.1, 0.0, 26.0), Desenho.SOMBRA)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _desenhar_efeitos(c: CanvasItem) -> void:
	particulas.desenhar(c)
	for ef in efeitos:
		var k: float = float(ef["t"]) / float(ef["dur"])
		match ef["tipo"]:
			"texto":
				var pos: Vector2 = ef["pos"] + Vector2(0, -k * 40.0)
				var cor: Color = ef["cor"]
				cor.a = 1.0 if k < 0.7 else (1.0 - k) / 0.3
				var tam := int(ef["tam"] * (1.0 + maxf(0.0, 0.25 - k) * 1.2))
				var borda := Desenho.PRETO
				borda.a = cor.a
				Desenho.texto(c, pos, ef["txt"], tam, cor, borda, 8)
			"veiculo":
				Arte.veiculo_ceu(c, ef["forma"], int(ef["t"]), int(ef["dur"]), int(ef["dir"]))
			"pow":
				if k > 0.0:
					_desenhar_pow(c, ef, k)
			"clarao":
				var cc: Color = ef["cor"]
				cc = cc.lightened(0.5)
				cc.a = 0.55 * (1.0 - k)
				c.draw_rect(Rect2(-300, -300, 1880, 1320), cc)
			"poder":
				var l: Lutador = ef["dono"]
				var ult: bool = ef["ult"]
				c.draw_rect(Rect2(-200, -200, 1680, 1120), Color(0.02, 0.0, 0.08, (0.6 if ult else 0.45) * (1.0 - k * k)))
				var centro := l.position + Vector2(0, -150)
				var cor: Color = Color(1, 0.85, 0.3) if ult else Color(l.dados.get("cor", Color(0.5, 0.8, 1.0))).lightened(0.25)
				for j in 16:
					var a: float = j * TAU / 16.0 + float(ef["t"]) * 0.06
					cor.a = 0.4 * (1.0 - k)
					c.draw_line(centro + Vector2(cos(a), sin(a)) * 70.0, centro + Vector2(cos(a), sin(a)) * 700.0, cor, 12.0 if j % 2 == 0 else 5.0)
				cor.a = 0.9 * (1.0 - k)
				c.draw_arc(centro, 60.0 + k * 220.0, 0, TAU, 32, cor, 10.0 * (1.0 - k) + 2.0)


## Balão estourado de quadrinho: estrela de pontas irregulares com contorno e a palavra no meio.
func _desenhar_pow(c: CanvasItem, ef: Dictionary, k: float) -> void:
	var grande: bool = ef["grande"]
	var txt: String = ef["txt"]
	var entra := clampf(k / 0.18, 0.0, 1.0)
	var esc := (1.25 - 0.25 * entra) * entra * (1.0 if k < 0.75 else 1.0 - (k - 0.75) / 0.25 * 0.3)
	var a := 1.0 if k < 0.75 else (1.0 - k) / 0.25
	var centro: Vector2 = ef["pos"] + Vector2(0, -k * 18.0)
	var r := (50.0 + txt.length() * 6.0) * (0.98 if grande else 0.8) * esc * float(ef.get("escala", 1.0))
	var giro: float = ef["giro"]
	var pts := PackedVector2Array()
	var dentro := PackedVector2Array()
	for j in 18:
		var ang := giro + j * TAU / 18.0
		var rr := r * (1.0 if j % 2 == 0 else 0.68) * (1.0 + 0.08 * sin(j * 2.3))
		var v := Vector2(cos(ang) * rr, sin(ang) * rr * 0.62)
		pts.append(centro + v * 1.1)
		dentro.append(centro + v)
	c.draw_colored_polygon(pts, Color(0.08, 0.05, 0.1, a))
	var cor: Color = ef["cor"]
	cor = cor.lightened(0.35)
	cor.a = a
	c.draw_colored_polygon(dentro, cor)
	c.draw_colored_polygon(PackedVector2Array([centro + Vector2(-r * 0.5, -r * 0.24), centro + Vector2(r * 0.2, -r * 0.3), centro + Vector2(-r * 0.3, -r * 0.1)]), Color(1, 1, 1, 0.45 * a))
	if entra >= 0.6:
		var tam := int((22 if grande else 18) * clampf(esc, 0.6, 1.2) * float(ef.get("escala", 1.0)))
		Desenho.texto(c, centro + Vector2(0, tam * 0.4), txt, tam, Color(0.85, 0.08, 0.12, a), Color(1, 1, 1, a), 5)


func _desenhar_cinema_fundo(c: CanvasItem) -> void:
	if not cinema.is_empty():
		Cinematica.desenhar(c, cinema, p[cinema["atk"]], p[1 - cinema["atk"]], true)


func _desenhar_cinema(c: CanvasItem) -> void:
	if not cinema.is_empty():
		Cinematica.desenhar(c, cinema, p[cinema["atk"]], p[1 - cinema["atk"]])


## Faixa de meme com o retrato entrando pelo lado do jogador (usada na luta e na seleção).
static func desenhar_meme(c: CanvasItem, d: Dictionary, txt: String, lado: int, t: int, dur: int) -> void:
	var entra := clampf(t / 10.0, 0.0, 1.0)
	var sai := clampf((dur - t) / 10.0, 0.0, 1.0)
	var k := minf(entra, sai)
	var y0 := 250.0
	c.draw_rect(Rect2(0, y0 - 6, 1280 * k, 182), Desenho.PRETO)
	c.draw_rect(Rect2(0, y0, 1280 * k, 170), Color("2a1446"))
	for j in 14:
		var x := fposmod(j * 110.0 + t * 14.0 * (1 if lado == 0 else -1), 1540.0) - 130.0
		c.draw_line(Vector2(x, y0 + 170), Vector2(x + 90, y0), Color(1, 0.82, 0.25, 0.18 * k), 22.0)
	var esq := lado == 0
	var desliza := (1.0 - k) * 500.0
	var px := (170.0 - desliza) if esq else (1110.0 + desliza)
	var ex := "grito" if (t / 6) % 2 == 0 else "feliz"
	Desenho._mat_tronco = Transform2D(0.0, Vector2(1 if esq else -1, 1), 0.0, Vector2(px, y0 + 168))
	Desenho.cabeca(c, d, Vector2(0, -88), 88.0, {"expr": ex, "retrato": true, "cabeca_giro": sin(t * 0.3) * 0.06})
	Desenho._mat_tronco = Transform2D.IDENTITY
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var linhas := Telas.quebrar(txt.to_upper(), 22)
	var cx := 760.0 if esq else 520.0
	for j in linhas.size():
		var yy := y0 + 85.0 - (linhas.size() - 1) * 24.0 + j * 48.0 + 16.0
		Desenho.texto(c, Vector2(cx + (1.0 - k) * (300.0 if esq else -300.0), yy), linhas[j], 40, Color("ffd23f"), Desenho.PRETO, 10)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


# ---------------------------------------------------------------- HUD

func _desenhar_hud(c: CanvasItem) -> void:
	var y := 34.0
	var h := 30.0
	var w := 452.0
	# 1ª passada: todas as formas num lote só (uma chamada de desenho)
	var lote := Lote.new()
	Desenho._lote = lote
	for i in 2:
		var l := p[i]
		var esq := i == 0
		var x0 := 122.0 if esq else 706.0
		var fracao := clampf(l.vida / l.vida_max, 0.0, 1.0)
		var vis: float = clampf(vida_vis[i] / l.vida_max, 0.0, 1.0)
		# moldura inclinada (paralelogramo) com bisel
		var inc := 14.0 if esq else -14.0
		_paralelo(c, Rect2(x0 - 7, y - 7, w + 14, h + 14), inc, Desenho.PRETO)
		_paralelo(c, Rect2(x0 - 3, y - 3, w + 6, h + 6), inc, Color("fbfbf7"))
		_paralelo(c, Rect2(x0, y, w, h), inc, Color("5a0f1a"))
		var amarelo := Color("ffd23f")
		var claro := Color("fff3b0")
		if fracao < 0.25 and int(tempo_total * 6) % 2 == 0:
			amarelo = Color("ff7a3c")
			claro = Color("ffc08a")
		# rastro do dano (vermelho-claro) que esvazia depois da vida de verdade
		var rastro := Color("ff5a4e") if vida_vis[i] - l.vida > 1.0 else Color("ff9a3c")
		if esq:
			_paralelo(c, Rect2(x0 + w * (1.0 - vis), y, w * vis, h), inc, rastro)
			_paralelo(c, Rect2(x0 + w * (1.0 - fracao), y, w * fracao, h), inc, amarelo)
			_paralelo(c, Rect2(x0 + w * (1.0 - fracao), y, w * fracao, h * 0.4), inc * 0.4, claro)
		else:
			_paralelo(c, Rect2(x0, y, w * vis, h), inc, rastro)
			_paralelo(c, Rect2(x0, y, w * fracao, h), inc, amarelo)
			_paralelo(c, Rect2(x0, y, w * fracao, h * 0.4), inc * 0.4, claro)
		# marcas a cada 10% e sombra embaixo
		for k in range(1, 10):
			var mx := x0 + w * k / 10.0 + inc * 0.5
			Desenho._dl(c, Vector2(mx, y + h * 0.55), Vector2(mx - inc * 0.2, y + h), Color(0, 0, 0, 0.22), 2.0)
		Desenho._dr(c, Rect2(x0 + (inc if esq else 0.0), y + h - 5, w - absf(inc), 5), Color(0, 0, 0, 0.18))
		# moldura do retrato
		var rx := 58.0 if esq else 1222.0
		var cor_l: Color = l.dados.get("cor", Color("ffd23f"))
		Desenho._dr(c, Rect2(rx - 46, y - 12, 92, 92), Desenho.PRETO)
		Desenho._dr(c, Rect2(rx - 42, y - 8, 84, 84), cor_l.darkened(0.15))
		Desenho._dr(c, Rect2(rx - 38, y - 4, 76, 76), Color("2a1446"))
		if l.censurado > 0:
			Desenho._dr(c, Rect2(rx - 38, y + 22, 76, 20), Desenho.PRETO)
		# vitórias: medalhas douradas
		for v in vitorias[i]:
			var vx: float = (x0 + w - 18 - v * 34) if esq else (x0 + 18 + v * 34)
			var vy := y + h + 30.0
			Desenho._dc(c, Vector2(vx, vy), 13.0, Desenho.PRETO)
			Desenho._dc(c, Vector2(vx, vy), 10.0, Color("c9a227"))
			Desenho._dc(c, Vector2(vx - 2, vy - 2), 6.0, Color("ffd23f"))
			Desenho._estrela(c, Vector2(vx, vy), 5.0, Color("fff3b0"))
		_desenhar_recargas(c, l, Vector2(x0 + (200.0 if esq else w - 200.0 - 5 * 26.0), y + h + 22))
		if l.bloqueado > 0:
			Arte.cadeado(c, Vector2(x0 + (180.0 if esq else w - 180.0), y + h + 64), 1.0)
		_desenhar_barra(c, i, l, esq)
	# selo KO e placa do relógio
	Desenho._dr(c, Rect2(586, y - 10, 108, h + 20), Desenho.PRETO)
	Desenho._dr(c, Rect2(592, y - 4, 96, h + 8), Color("fbfbf7"))
	Desenho._dr(c, Rect2(582, 82, 116, 72), Desenho.PRETO)
	Desenho._dr(c, Rect2(587, 87, 106, 62), Color("2a1446"))
	Desenho._dr(c, Rect2(587, 87, 106, 6), Color(1, 1, 1, 0.12))
	Desenho._lote = null
	lote.despejar(c)
	# 2ª passada: retratos e textos por cima
	for i in 2:
		var l := p[i]
		var esq := i == 0
		var x0 := 122.0 if esq else 706.0
		var rx := 58.0 if esq else 1222.0
		if l.censurado <= 0:
			var ex := "dor" if l.estado in [Lutador.E.ATINGIDO, Lutador.E.CAIDO] else ("nocaute" if l.estado == Lutador.E.NOCAUTE else ("grito" if l.estado == Lutador.E.ATACANDO else "neutro"))
			Desenho._mat_tronco = Transform2D(0.0, Vector2(1 if esq else -1, 1), 0.0, Vector2(rx, y + 74))
			Desenho.cabeca(c, l.dados, Vector2(0, -36), 33.0, {"expr": ex, "retrato": true})
			Desenho._mat_tronco = Transform2D.IDENTITY
			c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		var nome: String = l.dados.get("nome", "") if l.censurado <= 0 else "CENSURADO"
		var quem := ("P%d" % (i + 1)) if humano[i] else ("BONECO" if treino else "CPU")
		if esq:
			Desenho.texto_esq(c, Vector2(x0, y + h + 42), nome, 24, Color("ffd23f"), 6)
			Desenho.texto_esq(c, Vector2(rx - 40, y + 116), quem, 22, Color("7ec8ff"), 6)
		else:
			Desenho.texto_dir(c, Vector2(x0 + w, y + h + 42), nome, 24, Color("ffd23f"), 6)
			Desenho.texto_dir(c, Vector2(rx + 40, y + 116), quem, 22, Color("ff8a8a"), 6)
		_rotulo_barra(c, i, l, esq)
	Desenho.texto(c, Vector2(640, y + h + 2), "KO", 34, Color("c81e2a"), Desenho.PRETO, 0)
	if tempo < 900.0:
		var cor_t := Color("ffd23f") if tempo > 10 else Color("ff5a4e")
		Desenho.texto(c, Vector2(640, 142), "%02d" % int(ceil(tempo)), 64, cor_t, Desenho.PRETO, 10)
	else:
		Desenho.texto(c, Vector2(640, 142), "--", 64, Color("ffd23f"), Desenho.PRETO, 10)
	# botão de pausa (toque)
	if Toque.disponivel():
		c.draw_rect(Rect2(612, 166, 56, 36), Color(0, 0, 0, 0.45))
		c.draw_rect(Rect2(628, 172, 8, 24), Color(1, 1, 1, 0.8))
		c.draw_rect(Rect2(644, 172, 8, 24), Color(1, 1, 1, 0.8))
	if rotulo_modo != "":
		Desenho.texto(c, Vector2(640, 228), rotulo_modo, 20, Color("7ec8ff"), Desenho.PRETO, 5)
	if treino:
		Desenho.texto(c, Vector2(640, 228), "TREINO · barra infinita · ESC para sair", 20, Color("7ec8ff"), Desenho.PRETO, 5)
		if combo_dano[0] > 0.0:
			Desenho.texto(c, Vector2(640, 260), "COMBO: %d hits · %d de dano" % [combo[0], int(combo_dano[0])], 22, Color("ffd23f"), Desenho.PRETO, 5)
	for ef in efeitos:
		if ef["tipo"] == "meme":
			Luta.desenhar_meme(c, ef["dados"], ef["txt"], int(ef["lado"]), int(ef["t"]), int(ef["dur"]))
		elif ef["tipo"] == "cutin":
			_desenhar_cutin(c, ef)
	if not cinema.is_empty():
		Cinematica.desenhar_tela(c, cinema, p[cinema["atk"]])
	# mensagem central
	if msg_t > 0:
		var k := clampf(msg_t / 20.0, 0.0, 1.0)
		var cor := Color(1, 0.85, 0.25, k)
		var borda := Desenho.PRETO
		borda.a = k
		var escala := 1.0 + maxf(0.0, (msg_t - 50) / 30.0) * 0.4 if msg == "K.O.!" else 1.0
		Desenho.texto(c, Vector2(640, 380), msg, int(96 * escala), cor, borda, 14)
	if online != null:
		Desenho.texto(c, Vector2(640, 676), "ONLINE · você é o %dP" % (eu + 1), 16, Color("7ef0ff"), Desenho.PRETO, 4)
		if parado_q > 20:
			var nome_o: String = p[1 - eu].dados.get("nome", "")
			c.draw_rect(Rect2(340, 300, 600, 70), Color(0.05, 0.03, 0.12, 0.85))
			Desenho.texto(c, Vector2(640, 346), "AGUARDANDO %s..." % nome_o, 24, Color("ffd23f"), Desenho.PRETO, 6)
	_desenhar_dilera(c)
	if pausado:
		_desenhar_pausa(c)


## Retângulo inclinado (as barras do HUD têm as pontas cortadas em diagonal).
func _paralelo(c: CanvasItem, r: Rect2, inc: float, cor: Color) -> void:
	if r.size.x <= 0.5 or r.size.y <= 0.5:
		return
	var k := minf(absf(inc), r.size.x)
	var x0 := r.position.x
	var x1 := r.end.x
	var pts: PackedVector2Array
	if inc > 0:
		# ponta de fora (esquerda) cortada embaixo
		pts = PackedVector2Array([Vector2(x0 + k, r.position.y), Vector2(x1, r.position.y), Vector2(x1 - k, r.end.y), Vector2(x0, r.end.y)])
	else:
		pts = PackedVector2Array([Vector2(x0, r.position.y), Vector2(x1 - k, r.position.y), Vector2(x1, r.end.y), Vector2(x0 + k, r.end.y)])
	Desenho._dp(c, pts, cor)


## Retrato do lutador cruzando a tela com o nome do Superpower (como nos fliperamas).
func _desenhar_cutin(c: CanvasItem, ef: Dictionary) -> void:
	var t: int = ef["t"]
	var dur: int = ef["dur"]
	var k := minf(clampf(t / 6.0, 0.0, 1.0), clampf((dur - t) / 6.0, 0.0, 1.0))
	var esq: bool = int(ef["lado"]) == 0
	var d: Dictionary = ef["dados"]
	var cor: Color = d.get("cor", Color("ffd23f"))
	var y0 := 210.0
	var h := 190.0 * k
	c.draw_rect(Rect2(0, y0 + 95 - h / 2.0 - 6, 1280, h + 12), Desenho.PRETO)
	c.draw_rect(Rect2(0, y0 + 95 - h / 2.0, 1280, h), cor.darkened(0.55))
	for j in 10:
		var x := fposmod(j * 150.0 + t * 40.0 * (1 if esq else -1), 1500.0) - 110.0
		c.draw_line(Vector2(x, y0 + 95 + h / 2.0), Vector2(x + 110, y0 + 95 - h / 2.0), Color(cor, 0.35 * k), 26.0)
	if k < 0.5:
		return
	var desliza := clampf(t / 10.0, 0.0, 1.0)
	var px := lerpf(-200.0, 260.0, desliza) if esq else lerpf(1480.0, 1020.0, desliza)
	# explosão de raios atrás do retrato e faixas finas em cima e embaixo
	var cen := Vector2(px, y0 + 100)
	for j in 16:
		var a := j * TAU / 16.0 + t * 0.03
		var a2 := a + TAU / 40.0
		c.draw_colored_polygon(PackedVector2Array([cen, cen + Vector2(cos(a), sin(a)) * 260.0, cen + Vector2(cos(a2), sin(a2)) * 260.0]), Color(1, 0.9, 0.5, 0.16 if j % 2 == 0 else 0.07))
	c.draw_rect(Rect2(0, y0 + 95 - h / 2.0 + 8, 1280, 4), Color(cor.lightened(0.4), 0.8))
	c.draw_rect(Rect2(0, y0 + 95 + h / 2.0 - 12, 1280, 4), Color(cor.lightened(0.4), 0.8))
	Desenho._mat_tronco = Transform2D(0.0, Vector2(1 if esq else -1, 1), 0.0, Vector2(px, y0 + 190))
	Desenho.cabeca(c, d, Vector2(0, -92), 92.0, {"expr": "grito", "retrato": true})
	Desenho._mat_tronco = Transform2D.IDENTITY
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var tx := lerpf(1400.0, 760.0, desliza) if esq else lerpf(-120.0, 520.0, desliza)
	Desenho.texto(c, Vector2(tx, y0 + 110), String(ef["nome"]).to_upper(), 40, Color("ffd23f"), Desenho.PRETO, 10)
	Desenho.texto(c, Vector2(tx, y0 + 150), "SUPERPOWER", 20, Color.WHITE, Desenho.PRETO, 5)
	var frase: String = ef.get("frase", "")
	if frase != "" and t > 8:
		Desenho.texto(c, Vector2(tx, y0 + 180), "\"" + frase + "\"", 16, Color(cor.lightened(0.5)), Desenho.PRETO, 4)


func _desenhar_recargas(c: CanvasItem, l: Lutador, pos: Vector2) -> void:
	var slots := ["projetil", "frente", "cima", "baixo", "tras"]
	for j in slots.size():
		var r := Rect2(pos + Vector2(j * 26.0, 0), Vector2(20, 20))
		var h := l.habilidade(slots[j])
		Desenho._dr(c, r.grow(2), Desenho.PRETO)
		var pronto := not l.recargas.has(slots[j]) and l.bloqueado <= 0
		Desenho._dr(c, r, Color("ff8a5c") if pronto else Color("3a3050"))
		if not pronto and h.has("recarga") and l.recargas.has(slots[j]):
			var frac: float = 1.0 - float(l.recargas[slots[j]]) / float(h["recarga"])
			Desenho._dr(c, Rect2(r.position + Vector2(0, r.size.y * (1.0 - frac)), Vector2(r.size.x, r.size.y * frac)), Color("ff8a5c", 0.55))


## Barra de energia em 2 níveis: meia = SUPERPOWER, cheia = ULTIMATE.
func _desenhar_barra(c: CanvasItem, i: int, l: Lutador, esq: bool) -> void:
	var bx := 40.0 if esq else 900.0
	var by := 680.0
	var bw := 340.0
	var bh := 22.0
	var tremer := Vector2(randf_range(-4, 4), 0) if aviso_barra[i] > 0 else Vector2.ZERO
	var base := Vector2(bx, by) + tremer
	Desenho._dr(c, Rect2(base - Vector2(6, 6), Vector2(bw + 12, bh + 12)), Desenho.PRETO)
	Desenho._dr(c, Rect2(base, Vector2(bw, bh)), Color("2a2050") if aviso_barra[i] == 0 else Color("5a1020"))
	var cheia := l.barra >= 100.0
	var meia := l.barra >= 50.0
	var pisca := int(tempo_total * 8) % 2 == 0
	var cor := Color("4aa8ff")
	if cheia:
		cor = Color("ffd23f") if pisca else Color("fff3b0")
	elif meia:
		cor = Color("7ef0ff")
	var largura := bw * l.barra / 100.0
	var x_cheio := base + Vector2(0 if esq else bw - largura, 0)
	Desenho._dr(c, Rect2(x_cheio, Vector2(largura, bh)), cor)
	Desenho._dr(c, Rect2(x_cheio, Vector2(largura, 7)), cor.lightened(0.45))
	Desenho._dr(c, Rect2(x_cheio + Vector2(0, bh - 5), Vector2(largura, 5)), cor.darkened(0.3))
	# faíscas correndo dentro da barra quando há Super disponível
	if meia:
		var brilho := fposmod(tempo_total * (520.0 if cheia else 300.0), largura + 60.0) - 30.0
		var bxp := x_cheio.x + (brilho if esq else largura - brilho)
		Desenho._dr(c, Rect2(Vector2(clampf(bxp - 10, x_cheio.x, x_cheio.x + largura), base.y), Vector2(clampf(20.0, 0.0, largura), bh)), Color(1, 1, 1, 0.55))
	if cheia:
		Desenho._dr(c, Rect2(base - Vector2(10, 10), Vector2(bw + 20, bh + 20)), Color(1, 0.85, 0.3, 0.18 + 0.12 * sin(tempo_total * 10.0)), false, 4.0)
	Desenho._dr(c, Rect2(base + Vector2(bw / 2.0 - 2, -4), Vector2(4, bh + 8)), Desenho.PRETO)
	# dois losangos: cada um acende com meia barra
	for n in 2:
		var lx := (base.x + bw + 26 + n * 26) if esq else (base.x - 26 - n * 26)
		var aceso := l.barra >= 50.0 * (n + 1)
		var cl := Color("ffd23f") if aceso else Color("3a3050")
		var cen := Vector2(lx, base.y + bh / 2.0)
		Desenho._dp(c, PackedVector2Array([cen + Vector2(0, -15), cen + Vector2(13, 0), cen + Vector2(0, 15), cen + Vector2(-13, 0)]), Desenho.PRETO)
		Desenho._dp(c, PackedVector2Array([cen + Vector2(0, -10), cen + Vector2(9, 0), cen + Vector2(0, 10), cen + Vector2(-9, 0)]), cl)


## Rótulo da barra de energia (desenhado depois do lote de formas).
func _rotulo_barra(c: CanvasItem, i: int, l: Lutador, esq: bool) -> void:
	var bx := 40.0 if esq else 900.0
	var bw := 340.0
	var tremer := Vector2(randf_range(-4, 4), 0) if aviso_barra[i] > 0 else Vector2.ZERO
	var base := Vector2(bx, 680.0) + tremer
	var cheia := l.barra >= 100.0
	var meia := l.barra >= 50.0
	var cor := Color("4aa8ff")
	if cheia:
		cor = Color("ffd23f") if int(tempo_total * 8) % 2 == 0 else Color("fff3b0")
	elif meia:
		cor = Color("7ef0ff")
	var rotulo := "ULTIMATE!" if cheia else ("SUPER x1" if meia else "ENERGIA")
	var cor_r := cor if meia else Color(1, 1, 1, 0.8)
	if esq:
		Desenho.texto_esq(c, base + Vector2(0, -12), rotulo, 20, cor_r, 5)
	else:
		Desenho.texto_dir(c, base + Vector2(bw, -12), rotulo, 20, cor_r, 5)


func _desenhar_pausa(c: CanvasItem) -> void:
	c.draw_rect(Rect2(0, 0, 1280, 720), Color(0.03, 0.01, 0.08, 0.75))
	Desenho.texto(c, Vector2(640, 220), "PAUSA", 80, Color("ffd23f"), Desenho.PRETO, 12)
	var itens := ["CONTINUAR", "RECOMEÇAR", "SAIR PARA O MENU"]
	for i in 3:
		Telas.botao(c, _bt_pausa(i), itens[i], Color("ffd23f") if i == pausa_opcao else Color.WHITE, i == pausa_opcao)
