extends SceneTree
## Galeria de animação: cada personagem (linhas) em cada estado (colunas), desenhado pelo
## próprio código do jogo (Lutador.pose + Desenho), em vários quadros de cada animação.
## Rodar com tela: godot --path . --script res://tests/galeria.gd -- saida.png [quadro]

const ESTADOS := [
	["parado", Lutador.E.PARADO, ""], ["piscar", Lutador.E.PARADO, "piscar"], ["andar", Lutador.E.ANDANDO, ""],
	["pular", Lutador.E.PULANDO, ""], ["agachar", Lutador.E.AGACHADO, ""], ["soco", Lutador.E.ATACANDO, "soco"],
	["chute", Lutador.E.ATACANDO, "chute"], ["especial", Lutador.E.ATACANDO, "projetil"], ["gancho", Lutador.E.ATACANDO, "gancho"],
	["defesa", Lutador.E.DEFENDENDO, ""], ["dor", Lutador.E.ATINGIDO, ""], ["nocaute", Lutador.E.NOCAUTE, ""],
	["provocar", Lutador.E.PROVOCANDO, ""], ["vitoria", Lutador.E.VITORIA, ""], ["derrota", Lutador.E.DERROTA, ""],
]
const CEL := Vector2(170, 300)

var vp: SubViewport
var saida := "res://galeria.png"
var quadro_base := 8
var esperar := 4


func _initialize() -> void:
	var a := OS.get_cmdline_user_args()
	if a.size() > 0:
		saida = a[0]
	if a.size() > 1:
		quadro_base = int(a[1])
	vp = SubViewport.new()
	vp.size = Vector2i(int(CEL.x * ESTADOS.size() * Desenho.ESCALA), int((CEL.y * Personagens.LISTA.size() + 60) * Desenho.ESCALA))
	vp.transparent_bg = false
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	root.add_child(vp)
	var raiz := Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	vp.add_child(raiz)
	var fundo := Camada.new()
	fundo.desenhar = func(c):
		c.draw_rect(Rect2(0, 0, CEL.x * ESTADOS.size(), CEL.y * Personagens.LISTA.size() + 60), Color("2c2450"))
		for j in ESTADOS.size():
			Desenho.texto(c, Vector2(CEL.x * j + CEL.x / 2, 40), ESTADOS[j][0].to_upper(), 26, Color("ffd23f"), Desenho.PRETO, 5)
			c.draw_line(Vector2(CEL.x * j, 0), Vector2(CEL.x * j, 2000), Color(1, 1, 1, 0.08), 2)
	raiz.add_child(fundo)
	for i in Personagens.LISTA.size():
		var d: Dictionary = Personagens.LISTA[i]
		for j in ESTADOS.size():
			var l := Lutador.new()
			raiz.add_child(l)
			l.configurar(d, CEL.x * j + CEL.x / 2, 1)
			l.position.y = 60 + CEL.y * (i + 1) - 14
			var est: int = ESTADOS[j][1]
			var extra: String = ESTADOS[j][2]
			l.estado = est
			l.quadro = quadro_base
			l.tempo_vivo = 40 + quadro_base * 3
			if est == Lutador.E.ATACANDO:
				l.golpe_nome = extra
				l.golpe = Lutador.GOLPES[extra].duplicate()
				l.quadro = int(l.golpe["inicio"]) + 1
			elif est == Lutador.E.ATINGIDO:
				l.atordoado = 12
			elif est == Lutador.E.NOCAUTE:
				l.position.y = l.position.y
			elif est == Lutador.E.PULANDO:
				l.vel = Vector2(0, -6)
			if extra == "piscar":
				l.tempo_vivo = 170 - (d["nome"].length() * 37) % 170 + 2
			# para posar sem física: só atualiza o desenho
			l._atualizar_visual()
			l.position.y = 60 + CEL.y * (i + 1) - 14 - (40.0 if est == Lutador.E.PULANDO else 0.0)
			if est == Lutador.E.NOCAUTE:
				l.position.y = 60 + CEL.y * (i + 1) - 14


func _process(_d: float) -> bool:
	esperar -= 1
	if esperar <= 0:
		var img := vp.get_texture().get_image()
		img.resize(img.get_width() * 2, img.get_height() * 2, Image.INTERPOLATE_NEAREST)
		img.save_png(saida)
		print("galeria salva: ", saida, " ", img.get_size())
		quit()
	return false
