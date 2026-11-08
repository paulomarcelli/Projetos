extends SceneTree
## Testes do som da luta (sem tela):
##   - a trilha da Ultimate só toca quando a Ultimate pega (defendeu ou esquivou: nada);
##   - a música da Ultimate toca na vitória da partida de quem tem música (e só deles);
##   - o "rádio de memes" solta memes de vários personagens do elenco durante a luta.
## Rodar: godot --headless --path . --script res://tests/som_luta.gd
var raiz: Node2D
var falhas := 0


func ok(cond: bool, msg: String) -> void:
	print(("PASS " if cond else "FAIL ") + msg)
	if not cond:
		falhas += 1


func _luta(a: int, b: int) -> Luta:
	var l := Luta.new()
	l.cenario = "praca"
	l.configurar(Personagens.por_indice(a), Personagens.por_indice(b), false, true)
	raiz.add_child(l)
	return l


## Avança a luta até a fase "luta" (fim da apresentação do round).
func _ate_lutar(l: Luta) -> void:
	for i in 400:
		if l.fase == "luta":
			return
		l._tick()


func _initialize() -> void:
	raiz = Node2D.new()
	root.add_child(raiz)
	_rodar.call_deferred()  # os lutadores só existem depois do _ready da luta (com a árvore rodando)


func _rodar() -> void:
	var trump := Personagens.LISTA.map(func(d): return d["id"]).find("trump")
	var lula := Personagens.LISTA.map(func(d): return d["id"]).find("lula")
	var erika := Personagens.LISTA.map(func(d): return d["id"]).find("erika")

	# 1) Ultimate do Trump saindo (evento "ativo"): a trilha ainda não pode tocar
	var l := _luta(trump, lula)
	_ate_lutar(l)
	var atk: Lutador = l.p[0]
	var def: Lutador = l.p[1]
	atk.hab = atk.habilidade("ultimate")
	atk.golpe_nome = "ultimate"
	var antes := Som.trilhas_pedidas
	l._evento(atk, "ativo")
	ok(Som.trilhas_pedidas == antes, "Ultimate saindo (ativo) não toca trilha")

	# 2) o rival defende (segurando para trás, de pé): sem trilha e sem cinemática
	def.estado = Lutador.E.PARADO
	def.position.y = Lutador.CHAO
	var tras := "esq" if atk.position.x > def.position.x else "dir"
	def._antes = def._antes.duplicate()
	def._antes[tras] = true
	l._disparou_ultimate(atk)
	ok(Som.trilhas_pedidas == antes and l.cinema.is_empty(), "Ultimate defendida: sem trilha")

	# 3) o rival pula (no ar): esquivou, sem trilha
	def._antes[tras] = false
	def.position.y = Lutador.CHAO - 120.0
	l._disparou_ultimate(atk)
	ok(Som.trilhas_pedidas == antes and l.cinema.is_empty(), "Ultimate esquivada: sem trilha")

	# 4) pega de verdade: toca a trilha (o YMCA, no Trump)
	def.position.y = Lutador.CHAO
	def.estado = Lutador.E.PARADO
	l._disparou_ultimate(atk)
	ok(Som.trilhas_pedidas == antes + 1 and Som.ultima_trilha.ends_with("trump_ymca.ogg") and not l.cinema.is_empty(),
		"Ultimate que pega toca a trilha (%s)" % Som.ultima_trilha)
	l.queue_free()

	# 5) vitória da partida do Lula: a música da Ultimate dele
	l = _luta(lula, trump)
	_ate_lutar(l)
	l.vitorias = [2, 0]
	l.vencedor = 0
	l.fase = "fim_round"
	l.fase_t = 109
	antes = Som.trilhas_pedidas
	l._tick()
	ok(Som.trilhas_pedidas == antes + 1 and Som.ultima_trilha.ends_with("ultimate/lula.ogg"), "Lula vence a partida: música da Ultimate")
	l.queue_free()

	# 6) vitória da Erika (sem música própria): nada de trilha, continua o meme
	l = _luta(erika, lula)
	_ate_lutar(l)
	l.vitorias = [2, 0]
	l.vencedor = 0
	l.fase = "fim_round"
	l.fase_t = 109
	antes = Som.trilhas_pedidas
	l._tick()
	ok(Som.trilhas_pedidas == antes, "Erika vence a partida: sem trilha (não tem música)")
	l.queue_free()

	# 7) rádio de memes: em 90 s de luta, vários memes, de mais de um personagem
	l = _luta(erika, lula)
	_ate_lutar(l)
	for i in 90 * 60:
		if l.fase != "luta":
			break
		for pl: Lutador in l.p:
			pl.vida = pl.vida_max  # ninguém cai: a luta segue os 90 s
		l._tick()
	var ids := {}
	for id in l.radio_tocados:
		ids[id] = true
	print("  rádio: %d memes, de %s" % [l.radio_tocados.size(), ", ".join(ids.keys())])
	ok(l.radio_tocados.size() >= 5, "rádio de memes tocou várias vezes")
	ok(ids.size() >= 3, "rádio de memes com personagens diferentes")

	# 8) variedade: 60 memes seguidos do rádio; todos os áudios saem antes de algum repetir
	l.radio_audios.clear()
	l.radio_tocados.clear()
	Som._baralhos.erase("radio")  # o baralho vale para a sessão: começa um novo para contar
	for i in 60:
		l._meme_cd = 0
		l._radio_em = 0.001
		l.tempo_total = 1000.0 + i
		l._radio_memes()
	var total := 0
	for dd in Personagens.LISTA:
		total += dd.get("memes_audio", []).size()
	var primeiros: Array = l.radio_audios.slice(0, total)
	var unicos := {}
	for a in primeiros:
		unicos[a] = true
	var quem := {}
	for id in l.radio_tocados:
		quem[id] = true
	print("  rádio em sequência: %d áudios, %d diferentes nos %d primeiros, %d personagens" % [l.radio_audios.size(), unicos.size(), total, quem.size()])
	ok(primeiros.size() == total and unicos.size() == total, "rádio: os %d áudios saem antes de repetir" % total)
	ok(quem.size() >= 9, "rádio: memes de pelo menos 9 personagens (com as frases de quem não tem áudio)")
	l.queue_free()

	# 9) Xandão (1 áudio só): memes seguidos não repetem o áudio; sai a frase escrita
	var xandao := Personagens.LISTA.map(func(d): return d["id"]).find("xandao")
	l = _luta(xandao, lula)
	_ate_lutar(l)
	var pedidos := Som.memes_pedidos
	for i in 5:
		l._meme(0, true)
	ok(Som.memes_pedidos - pedidos <= 1, "Xandão: o mesmo áudio não repete em sequência (%d de 5)" % (Som.memes_pedidos - pedidos))
	l.queue_free()

	# 10) título: escolher um modo toca o Zé Gotinha; SETTINGS não
	var t := Telas.Titulo.new()
	raiz.add_child(t)
	t.opcao = 0
	t._escolher()
	ok(Som.ultimo_meme.ends_with("lula/ze_gotinha.ogg"), "PLAY: cadê o Zé Gotinha?")
	pedidos = Som.memes_pedidos
	t.opcao = 6
	t._escolher()
	ok(Som.memes_pedidos == pedidos, "SETTINGS: sem Zé Gotinha")
	t.queue_free()

	print("FALHAS: %d" % falhas)
	quit(1 if falhas > 0 else 0)
