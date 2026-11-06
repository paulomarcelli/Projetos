extends Node2D
## Troca as telas e cuida dos modos de jogo, com uma cortina animada entre uma tela e outra:
##   PLAY         1 jogador contra a CPU: lutadores → arena → VS → luta → resultado
##   MULTIPLAYER  2 jogadores no mesmo aparelho (teclado ou dois controles)
##   ARCADE       o jogador enfrenta todo o elenco em sequência, cada luta mais difícil e numa arena
##   TRAINING     contra um boneco parado, com barra infinita e vida que volta
##   CHARACTER SELECT (lutadores) e SETTINGS

var modo := "play"
var escolha := [0, 1]
var cenario := "praca"
var tela: Node
var arcade_rivais: Array[int] = []
var arcade_luta := 0

var _aviso: Camada
var _cortina: Camada
var _cortina_k := 0.0  # 0 = aberta, 1 = fechada
var _trocando := false


func _ready() -> void:
	randomize()
	Config.carregar()
	Som.iniciar(get_tree().root)
	# O jogo pensa em 1280x720, mas desenha numa tela de 480x270 ampliada sem suavização:
	# é isso que dá o visual de pixel dos fliperamas de 16 bits.
	scale = Vector2.ONE * Desenho.ESCALA
	_aviso = Camada.new()
	_aviso.z_index = 100
	_aviso.desenhar = func(c: CanvasItem) -> void:
		var tam := DisplayServer.window_get_size()
		if tam.y > tam.x:
			c.draw_rect(Rect2(0, 0, 1280, 720), Color(0.05, 0.03, 0.12, 0.92))
			Desenho.texto(c, Vector2(640, 330), "VIRE O CELULAR", 64, Color("ffd23f"), Desenho.PRETO, 10)
			Desenho.texto(c, Vector2(640, 400), "o jogo é na horizontal", 26, Color.WHITE, Desenho.PRETO, 5)
	add_child(_aviso)
	_cortina = Camada.new()
	_cortina.z_index = 90
	_cortina.desenhar = _desenhar_cortina
	add_child(_cortina)
	_titulo()


func _process(_d: float) -> void:
	_aviso.queue_redraw()
	_cortina.queue_redraw()
	move_child(_cortina, get_child_count() - 1)
	move_child(_aviso, get_child_count() - 1)


## Faixas diagonais que fecham e abrem (estilo fliperama).
func _desenhar_cortina(c: CanvasItem) -> void:
	if _cortina_k <= 0.001:
		return
	for i in 10:
		var atraso := i * 0.05
		var k := clampf((_cortina_k - atraso) / (1.0 - 0.45), 0.0, 1.0)
		if k <= 0.0:
			continue
		var y := i * 72.0
		var w := 1600.0 * k
		var x0 := -160.0 if i % 2 == 0 else 1440.0 - w
		c.draw_colored_polygon(PackedVector2Array([Vector2(x0, y), Vector2(x0 + w, y), Vector2(x0 + w - 40, y + 74), Vector2(x0 - 40, y + 74)]), Color("140c1c") if i % 2 else Color("1d1240"))
	if _cortina_k > 0.95:
		Desenho.texto(c, Vector2(640, 380), "BRASÍLIA KOMBAT", 32, Color("ffd23f"), Desenho.PRETO, 6)


func _trocar(n: Node) -> void:
	if tela == null:
		tela = n
		add_child(n)
		return
	if _trocando:
		n.queue_free()
		return
	_trocando = true
	var tw := create_tween()
	tw.tween_property(self, "_cortina_k", 1.0, 0.22)
	tw.tween_callback(func() -> void:
		if tela != null:
			tela.queue_free()
		tela = n
		add_child(n)
		move_child(_cortina, get_child_count() - 1))
	tw.tween_property(self, "_cortina_k", 0.0, 0.25)
	tw.tween_callback(func() -> void: _trocando = false)


func _titulo() -> void:
	var t := Telas.Titulo.new()
	t.escolheu.connect(_escolheu_modo)
	_trocar(t)


func _escolheu_modo(opcao: String) -> void:
	modo = opcao
	match opcao:
		"lutadores":
			_lutadores()
		"config":
			_config()
		_:
			_selecao()


func _lutadores() -> void:
	var l := Telas.Lutadores.new()
	l.voltar.connect(_titulo)
	_trocar(l)


func _config() -> void:
	var c := Telas.Configuracoes.new()
	c.voltar.connect(_titulo)
	c.como_jogar.connect(func() -> void:
		var cj := Telas.ComoJogar.new()
		cj.voltar.connect(_config)
		_trocar(cj))
	_trocar(c)


func _selecao() -> void:
	var s := Telas.Selecao.new()
	s.modo = {"play": 1, "multiplayer": 2}.get(modo, 3)
	s.cursor = escolha.duplicate()
	s.pronto.connect(_escolheu_lutadores)
	s.voltar.connect(_titulo)
	_trocar(s)


func _escolheu_lutadores(a: int, b: int) -> void:
	escolha = [a, b]
	match modo:
		"arcade":
			_arcade_comecar()
		"treino":
			_treino()
		_:
			_selecao_cenario()


func _selecao_cenario() -> void:
	var s := Telas.SelecaoCenario.new()
	s.opcao = Cenarios.indice(cenario)
	s.pronto.connect(func(id: String) -> void:
		cenario = id
		_versus(""))
	s.voltar.connect(_selecao)
	_trocar(s)


func _versus(rotulo: String) -> void:
	var v := Telas.Versus.new()
	v.a = Personagens.por_indice(escolha[0])
	v.b = Personagens.por_indice(escolha[1])
	v.cenario = cenario
	v.rotulo = rotulo
	v.fim.connect(func() -> void: _luta(rotulo))
	Som.musica("")
	_trocar(v)


func _luta(rotulo := "") -> void:
	var l := Luta.new()
	l.configurar(Personagens.por_indice(escolha[0]), Personagens.por_indice(escolha[1]), modo == "multiplayer")
	l.cenario = cenario
	l.nivel_cpu = Config.nivel_cpu()
	l.rotulo_modo = rotulo
	if modo == "arcade":
		l.nivel_cpu = clampf(Config.nivel_cpu() - 0.12 + arcade_luta * 0.07, 0.2, 0.95)
	l.terminou.connect(_resultado)
	l.sair.connect(_titulo)
	_trocar(l)


func _treino() -> void:
	var outros := range(Personagens.LISTA.size()).filter(func(i): return i != escolha[0])
	escolha[1] = outros[randi() % outros.size()]
	var l := Luta.new()
	l.treino = true
	l.configurar(Personagens.por_indice(escolha[0]), Personagens.por_indice(escolha[1]), false)
	l.cenario = Cenarios.LISTA[randi() % Cenarios.LISTA.size()]["id"]
	l.sair.connect(_titulo)
	_trocar(l)


func _arcade_comecar() -> void:
	arcade_rivais.clear()
	for i in Personagens.LISTA.size():
		if i != escolha[0]:
			arcade_rivais.append(i)
	arcade_rivais.shuffle()
	arcade_luta = 0
	_arcade_proxima()


func _arcade_proxima() -> void:
	escolha[1] = arcade_rivais[arcade_luta]
	cenario = Cenarios.LISTA[arcade_luta % Cenarios.LISTA.size()]["id"]
	_versus("ARCADE · LUTA %d DE %d" % [arcade_luta + 1, arcade_rivais.size()])


func _resultado(vencedor: int) -> void:
	var r := Telas.Resultado.new()
	r.dados = Personagens.por_indice(escolha[vencedor])
	r.perdedor = Personagens.por_indice(escolha[1 - vencedor])
	match modo:
		"multiplayer":
			r.quem = "Jogador %d" % (vencedor + 1)
			r.texto_revanche = "REVANCHE"
			r.texto_trocar = "TROCAR LUTADOR"
			r.revanche.connect(func() -> void: _versus(""))
			r.trocar.connect(_selecao)
		"arcade":
			if vencedor == 0:
				arcade_luta += 1
				if arcade_luta >= arcade_rivais.size():
					r.campeao = true
					r.quem = "Você venceu todo mundo no modo Arcade!"
					r.texto_revanche = "JOGAR DE NOVO"
					r.texto_trocar = "MENU"
					r.revanche.connect(_selecao)
					r.trocar.connect(_titulo)
					Som.sfx("vitoria", 0.0)
				else:
					r.quem = "Próximo rival: %s" % Personagens.por_indice(arcade_rivais[arcade_luta])["nome"]
					r.texto_revanche = "PRÓXIMA LUTA"
					r.texto_trocar = "MENU"
					r.revanche.connect(_arcade_proxima)
					r.trocar.connect(_titulo)
			else:
				r.quem = "CPU · Luta %d de %d" % [arcade_luta + 1, arcade_rivais.size()]
				r.texto_revanche = "CONTINUAR"
				r.texto_trocar = "MENU"
				r.revanche.connect(_arcade_proxima)
				r.trocar.connect(_titulo)
		_:
			r.quem = "Jogador 1" if vencedor == 0 else "CPU"
			r.texto_revanche = "REVANCHE"
			r.texto_trocar = "TROCAR LUTADOR"
			r.revanche.connect(func() -> void: _versus(""))
			r.trocar.connect(_selecao)
	_trocar(r)
