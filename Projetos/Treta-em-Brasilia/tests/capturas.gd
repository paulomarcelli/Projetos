extends SceneTree
## Capturas de tela de todas as telas e de momentos da luta (para revisão visual).
## Rodar com tela (xvfb): godot --path . --fixed-fps 60 --script res://tests/capturas.gd -- pasta_saida [filtro]

var raiz: Node2D
var quadro := 0
var saida := "res://docs/capturas"
var filtro := ""
var etapa := -1
var luta: Luta
var roteiro: Array = []
var _forcar := ""  # golpe a disparar no lutador 1 assim que ele puder agir
var _vida_rival := -1.0
var _chamar_dilera := false


class Botao:
	## Entrada que aperta um botão em quadros escolhidos (para forçar golpes nas capturas).
	var apertos := {}  # quadro -> {tecla: true}
	var q := 0
	var ia: IA
	func ler() -> Dictionary:
		q += 1
		if apertos.has(q):
			var d := {"esq": false, "dir": false, "cima": false, "baixo": false, "soco": false, "chute": false, "especial": false, "provocar": false, "super": false, "agarrar": false}
			for k in apertos[q]:
				d[k] = apertos[q][k]
			return d
		return ia.ler() if ia != null else {}


func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		saida = args[0]
	if args.size() > 1:
		filtro = args[1]
	DirAccess.make_dir_recursive_absolute(saida)
	Config.efeitos = 0.0
	Config.musica = 0.0
	raiz = Node2D.new()
	raiz.scale = Vector2.ONE * Desenho.ESCALA
	root.add_child(raiz)
	roteiro = [
		["titulo", _titulo, [50]],
		["creditos", _creditos, [30, 150]],
		["dilera", _dilera_cap, [24, 50]],
		["online_menu", _online.bind("menu"), [30]],
		["online_digitar", _online.bind("digitar"), [30]],
		["online_sala", _online.bind("aguardando"), [30]],
		["online_erro", _online.bind("erro"), [30]],
		["selecao_online", _selecao_online, [40]],
		["luta_online", _luta_online, [200]],
		["selecao", _selecao, [40]],
		["arena", _arena, [20]],
		["lutadores", _lutadores, [40, 100]],
		["config", _config, [10]],
		["comojogar", _como, [10]],
		["versus", _versus, [40]],
		["resultado", _resultado, [30]],
		["luta_praca", _luta.bind("praca", 0, 1, {}), [90, 260, 420]],
		["luta_usp", _luta.bind("usp", 4, 2, {}), [140, 300]],
		["luta_paulista", _luta.bind("paulista", 1, 0, {}), [140, 300]],
		["luta_casa", _luta.bind("casa_branca", 3, 2, {}), [140, 300]],
		["super_lula", _poder.bind("praca", 0, 3, "super"), [112, 150, 170, 190, 215]],
		["super_bolsonaro", _poder.bind("paulista", 1, 0, "super"), [112, 150, 170, 190, 215]],
		["super_xandao", _poder.bind("praca", 2, 4, "super"), [112, 150, 170, 190, 215]],
		["super_trump", _poder.bind("casa_branca", 3, 1, "super"), [150, 180, 210, 240, 270, 330]],
		["super_eduarda", _poder.bind("usp", 4, 2, "super"), [112, 150, 170, 190, 215]],
		["danca", _poder.bind("casa_branca", 3, 1, "baixo"), [112, 124, 136, 148]],
		["cabelo", _poder.bind("casa_branca", 3, 1, "frente"), [114, 120]],
		["xandao_zona", _poder.bind("praca", 2, 4, "tras"), [130]],
		["moto", _poder.bind("paulista", 1, 0, "frente"), [116]],
		["cloroquina", _poder.bind("paulista", 1, 0, "baixo"), [150]],
		["debate", _poder.bind("usp", 4, 3, "baixo"), [124]],
		["ult_lula", _poder.bind("praca", 0, 2, "ult"), [190, 250, 300, 335]],
		["ult_trump", _poder.bind("casa_branca", 3, 0, "ult"), [190, 250, 300, 335]],
		["ult_bolsonaro", _poder.bind("paulista", 1, 4, "ult"), [190, 250, 300, 335]],
		["ult_xandao", _poder.bind("usp", 2, 3, "ult"), [190, 250, 300, 335]],
		["ult_eduarda", _poder.bind("usp", 4, 1, "ult"), [190, 250, 300, 335]],
		["erika_pec", _poder.bind("praca", 5, 1, "projetil"), [108, 122]],
		["erika_giro", _poder.bind("praca", 5, 1, "frente"), [112, 124]],
		["erika_assinado", _poder.bind("praca", 5, 1, "baixo"), [200, 260]],
		["erika_representa", _poder.bind("praca", 5, 1, "tras"), [118, 140]],
		["super_erika", _poder.bind("praca", 5, 1, "super"), [112, 150, 170, 190, 215]],
		["ult_erika", _poder.bind("praca", 5, 1, "ult"), [140, 200, 260, 300]],
		["pav_rec", _poder.bind("usp", 6, 4, "projetil"), [246, 258]],
		["pav_usp", _poder.bind("usp", 6, 4, "frente"), [244, 256]],
		["pav_antiwoke", _poder.bind("usp", 6, 4, "baixo"), [262, 300]],
		["pav_mala", _poder.bind("usp", 6, 4, "tras"), [252, 270]],
		["super_pavanato", _poder.bind("usp", 6, 4, "super"), [252, 285, 305]],
		["ult_pavanato", _poder.bind("usp", 6, 4, "ult"), [300, 360, 420, 455]],
		["nik_pix", _poder.bind("paulista", 7, 0, "projetil"), [248, 262]],
		["nik_caminhada", _poder.bind("paulista", 7, 0, "frente"), [250, 270]],
		["nik_revoga", _poder.bind("paulista", 7, 0, "baixo"), [282, 292]],
		["nik_story", _poder.bind("paulista", 7, 0, "tras"), [258, 272]],
		["super_nikolas", _poder.bind("paulista", 7, 0, "super"), [252, 285, 305]],
		["ult_nikolas", _poder.bind("paulista", 7, 0, "ult"), [360, 460, 540, 580]],
		["fla_bombom", _poder.bind("casa_branca", 8, 0, "projetil"), [248, 262]],
		["fla_racha", _poder.bind("casa_branca", 8, 0, "frente"), [248, 258]],
		["fla_mansao", _poder.bind("casa_branca", 8, 0, "baixo"), [262, 300]],
		["fla_carta", _poder.bind("casa_branca", 8, 0, "tras"), [258, 272]],
		["super_flavio", _poder.bind("casa_branca", 8, 0, "super"), [300, 320, 340, 360]],
		["ult_flavio", _poder.bind("casa_branca", 8, 0, "ult"), [300, 360, 400, 440]],
		["fla_idle", _luta.bind("casa_branca", 8, 0, {}), [200]],
		["ren_tesoura", _poder.bind("paulista", 9, 8, "projetil"), [246, 258]],
		["ren_megafone", _poder.bind("paulista", 9, 8, "frente"), [250, 262]],
		["ren_cela", _poder.bind("paulista", 9, 8, "baixo"), [262, 300]],
		["ren_live", _poder.bind("paulista", 9, 8, "tras"), [258, 272]],
		["super_renan", _poder.bind("paulista", 9, 8, "super"), [300, 330]],
		["ult_renan", _poder.bind("paulista", 9, 8, "ult"), [340, 370, 420, 480]],
		["ren_idle", _luta.bind("paulista", 9, 8, {}), [60, 200]],
		["dil_vento", _poder.bind("praca", 10, 0, "projetil"), [248, 262]],
		["dil_pedalada", _poder.bind("praca", 10, 0, "frente"), [250, 266]],
		["dil_mandioca", _poder.bind("praca", 10, 0, "baixo"), [262, 300]],
		["dil_telefone", _poder.bind("praca", 10, 0, "tras"), [258, 272]],
		["super_dilma", _poder.bind("praca", 10, 0, "super"), [300, 330]],
		["ult_dilma", _poder.bind("praca", 10, 0, "ult"), [340, 380, 420, 480]],
		["dil_idle", _luta.bind("praca", 10, 1, {}), [60]],
		["memes_casa", _luta.bind("casa_branca", 3, 9, {}), [700]],
		["memes_paulista", _luta.bind("paulista", 9, 7, {}), [500]],
		["entrada", _luta.bind("praca", 2, 10, {}), [20, 44]],
		["ko_final", _ko, [395, 470, 520]],
		["treino", _treino, [120]],
	]
	if filtro != "":
		roteiro = roteiro.filter(func(r): return String(r[0]).begins_with(filtro))
	_proxima()


func _limpar() -> void:
	for f in raiz.get_children():
		f.queue_free()
	luta = null
	_forcar = ""


func _proxima() -> void:
	etapa += 1
	quadro = 0
	if etapa >= roteiro.size():
		quit()
		return
	_limpar()
	(roteiro[etapa][1] as Callable).call()


func _titulo() -> void:
	raiz.add_child(Telas.Titulo.new())


func _selecao() -> void:
	var s := Telas.Selecao.new()
	s.modo = 1
	s.cursor = [0, 3]
	raiz.add_child(s)


func _online(qual: String) -> void:
	var o := Telas.Online.new()
	raiz.add_child(o)
	match qual:
		"digitar":
			o.modo = "digitar"
			o.codigo = "KF"
			o.grade = 5
		"aguardando":
			o.atualizar("aguardando", "", "BRKZ")
		"erro":
			o.atualizar("erro", "Não deu para conectar. Algumas redes bloqueiam conexão direta: tente outra rede.", "BRKZ")


func _selecao_online() -> void:
	var s := Telas.Selecao.new()
	s.modo = 4
	s.lado_local = 1
	s.cursor = [10, 9]
	raiz.add_child(s)
	s.remoto(10, true)


## Luta online com um transporte que só devolve a própria entrada (para ver o HUD e o aviso).
class _Eco:
	var luta: Luta
	func enviar(d: Dictionary) -> void:
		if d.get("k", "") == "in" and int(d["f"]) < 150:
			luta.rede_receber(d)


func _luta_online() -> void:
	luta = Luta.new()
	luta.cenario = "paulista"
	luta.configurar(Personagens.por_indice(10), Personagens.por_indice(9), true)
	var eco := _Eco.new()
	eco.luta = luta
	luta.configurar_online(eco, 0, 42, 4)
	raiz.add_child(luta)


func _creditos() -> void:
	raiz.add_child(Telas.Creditos.new())


func _dilera_cap() -> void:
	_luta("paulista", 1, 0, {})
	_chamar_dilera = true


func _arena() -> void:
	var s := Telas.SelecaoCenario.new()
	s.opcao = 1
	raiz.add_child(s)


func _lutadores() -> void:
	var l := Telas.Lutadores.new()
	l.indice = 3
	l.demo = 4
	raiz.add_child(l)


func _config() -> void:
	raiz.add_child(Telas.Configuracoes.new())


func _como() -> void:
	raiz.add_child(Telas.ComoJogar.new())


func _versus() -> void:
	var v := Telas.Versus.new()
	v.a = Personagens.por_indice(0)
	v.b = Personagens.por_indice(1)
	v.cenario = "paulista"
	v.rotulo = "ARCADE · LUTA 1 DE 4"
	raiz.add_child(v)


func _resultado() -> void:
	var r := Telas.Resultado.new()
	r.dados = Personagens.por_indice(3)
	r.perdedor = Personagens.por_indice(1)
	r.quem = "Jogador 1"
	raiz.add_child(r)


func _luta(cenario: String, a: int, b: int, apertos: Dictionary, barra := -1.0) -> void:
	luta = Luta.new()
	luta.nivel_cpu = 0.7
	luta.cenario = cenario
	luta.configurar(Personagens.por_indice(a), Personagens.por_indice(b), false, true)
	raiz.add_child(luta)
	if not apertos.is_empty():
		var bt := Botao.new()
		bt.apertos = apertos
		bt.ia = luta.ias[0]
		luta.p[0].entrada = bt
		# deixa os dois perto um do outro
		luta.p[0].position.x = 520.0
		luta.p[1].position.x = 780.0
		luta.ias[1].nivel = 0.0
	if barra >= 0.0:
		luta.p[0].barra = barra


## Luta com os dois parados: o lutador 1 solta o golpe pedido assim que puder.
func _poder(cenario: String, a: int, b: int, golpe: String) -> void:
	luta = Luta.new()
	luta.cenario = cenario
	luta.configurar(Personagens.por_indice(a), Personagens.por_indice(b), false, true)
	raiz.add_child(luta)
	_forcar = golpe


func _ko() -> void:
	_poder("praca", 0, 1, "ult")
	_vida_rival = 60.0


func _treino() -> void:
	luta = Luta.new()
	luta.treino = true
	luta.cenario = "usp"
	luta.configurar(Personagens.por_indice(1), Personagens.por_indice(2), false)
	raiz.add_child(luta)


func _process(_d: float) -> bool:
	quadro += 1
	if _chamar_dilera and luta != null and luta.p.size() == 2:
		luta._chamar_dilera()
		_chamar_dilera = false
	if _vida_rival >= 0.0 and luta != null and luta.p.size() == 2:
		luta.p[1].vida = _vida_rival
		_vida_rival = -1.0
	if _forcar != "" and luta != null and luta.p.size() == 2 and luta.ias[0] != null:
		for l in luta.p:
			l.entrada = null
		luta.ias = [null, null]
	if _forcar != "" and luta != null and luta.p.size() == 2 and quadro >= (232 if (String(roteiro[etapa][0]).contains("pav") or String(roteiro[etapa][0]).contains("nik") or String(roteiro[etapa][0]).contains("fla") or String(roteiro[etapa][0]).contains("ren") or String(roteiro[etapa][0]).contains("dil")) else 96) and luta.p[0].pode_agir():
		luta.p[0].position.x = 520.0
		luta.p[1].position.x = 760.0 if _forcar not in ["tras", "frente"] else 900.0
		var l := luta.p[0]
		match _forcar:
			"super":
				l.barra = 60.0
				l._tentar_super(5)
			"ult":
				l.barra = 100.0
				l._tentar_super(5)
			_:
				l._usar_habilidade(_forcar)
		_forcar = ""
	if etapa >= roteiro.size():
		return true
	var item: Array = roteiro[etapa]
	var marcas: Array = item[2]
	if quadro in marcas:
		var img := root.get_texture().get_image()
		img.resize(img.get_width() * 2, img.get_height() * 2, Image.INTERPOLATE_NEAREST)
		img.save_png("%s/%02d_%s_%03d.png" % [saida, etapa, item[0], quadro])
	if quadro >= int(marcas.max()):
		_proxima()
	return false
