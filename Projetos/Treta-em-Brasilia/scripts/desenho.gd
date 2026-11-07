class_name Desenho
## Tudo o que é desenhado em código, no visual de fliperama 16 bits:
## lutadores cabeçudos com contorno escuro e sombreado, projéteis, veículos das investidas,
## o cenário da Praça dos Três Poderes (céu pontilhado, plateia com cartazes) e textos
## com a fonte pixelada Press Start 2P.
##
## O jogo pensa em 1280x720 e desenha numa tela de 480x270 (ESCALA). Pés do lutador em (0, 0),
## olhando para a direita (+x é a frente).

const ESCALA := 0.375
const PRETO := Color("140c1c")
const CONTORNO := Color("140c1c")
const BRANCO := Color("fbfbf7")
const SOMBRA := Color(0, 0, 0, 0.32)

static var _cont := false
## Lote de triângulos do boneco (lote.gd): enquanto existe, as formas vão para ele em vez de virar
## uma chamada de desenho cada. usar_lote = false volta ao desenho direto.
static var usar_lote := true
static var _lote: Lote = null


static func _dl(c: CanvasItem, a: Vector2, b: Vector2, cor: Color, w: float = -1.0) -> void:
	if _lote != null:
		_lote.linha(a, b, cor, w if w > 0.0 else 1.0)
	else:
		c.draw_line(a, b, cor, w)


static func _dc(c: CanvasItem, pos: Vector2, r: float, cor: Color) -> void:
	if _lote != null:
		_lote.circulo(pos, r, cor)
	else:
		c.draw_circle(pos, r, cor)


static func _dp(c: CanvasItem, pts: PackedVector2Array, cor: Color) -> void:
	if _lote != null:
		_lote.poligono(pts, cor)
	else:
		c.draw_colored_polygon(pts, cor)


static func _dr(c: CanvasItem, r: Rect2, cor: Color, cheio: bool = true, w: float = -1.0) -> void:
	if _lote != null:
		if cheio:
			_lote.retangulo(r, cor)
		else:
			var e := maxf(w, 1.0)
			_lote.retangulo(Rect2(r.position, Vector2(r.size.x, e)), cor)
			_lote.retangulo(Rect2(r.position + Vector2(0, r.size.y - e), Vector2(r.size.x, e)), cor)
			_lote.retangulo(Rect2(r.position, Vector2(e, r.size.y)), cor)
			_lote.retangulo(Rect2(r.position + Vector2(r.size.x - e, 0), Vector2(e, r.size.y)), cor)
	else:
		c.draw_rect(r, cor, cheio, w)


static func _da(c: CanvasItem, centro: Vector2, r: float, de: float, ate: float, n: int, cor: Color, w: float = -1.0) -> void:
	if _lote != null:
		_lote.arco(centro, r, de, ate, n, cor, w if w > 0.0 else 1.0)
	else:
		c.draw_arc(centro, r, de, ate, n, cor, w)


static func _dm(c: CanvasItem, m: Transform2D) -> void:
	if _lote != null:
		_lote.xf = m
	else:
		c.draw_set_transform_matrix(m)
## Cor única (rastro de velocidade): quando a.a > 0, tudo sai nessa cor, só a silhueta.
static var _silhueta := Color(0, 0, 0, 0)
## Transformação de quem chamou (posição/escala do boneco na tela); as partes se compõem com ela.
static var _base := Transform2D.IDENTITY
## Transformação do tronco (inclinação), onde o pescoço se apoia. A cabeça soma o próprio giro.
static var _mat_tronco := Transform2D.IDENTITY
const EXPRESSOES := ["neutro", "piscar", "esforco", "grito", "dor", "nocaute", "feliz", "derrota"]
static var _fonte: Font
static var _prop_ang := 0.0
## Quando ligado, Desenho.texto guarda os textos numa fila e só desenha em textos_pendentes():
## assim formas e textos não se intercalam e a placa de vídeo agrupa as chamadas (plateias).
static var adiar_textos := false
static var _fila_textos: Array = []
static var _ceu: ImageTexture
static var _texturas := {}


## Carrega sprites/<nome>.png uma vez (null se não existir).
static func textura(nome: String) -> Texture2D:
	if not _texturas.has(nome):
		var caminho := "res://sprites/%s.png" % nome
		_texturas[nome] = load(caminho) if ResourceLoader.exists(caminho) else null
	return _texturas[nome]


static func pose_padrao() -> Dictionary:
	return {
		"agachado": false, "quadril": -72.0, "inclina": 0.0, "giro": 0.0,
		"mao_f": Vector2(36, -128), "mao_t": Vector2(18, -122),
		"pe_f": Vector2(20, 0), "pe_t": Vector2(-20, 0),
		"boca": "normal", "olhos": "normal", "punho_grande": false, "martelo": false,
	}


# ---------------------------------------------------------------- poses de personalidade
# Usadas na luta e nas telas (seleção, resultado). t = quadros desde que o lutador entrou.

static func _id(d: Dictionary) -> String:
	return d.get("id", "")


## Parado: cada um com seu jeito (discurso, postura militar, "sanfona", imponente, celular na mão).
static func pose_idle(d: Dictionary, t: int) -> Dictionary:
	var p := pose_padrao()
	var resp := sin(t * 0.07)
	p["quadril"] = -72.0 + resp * 1.5
	p["cabeca_desl"] = Vector2(0, sin(t * 0.07 - 0.6) * 1.5)
	p["cabeca_giro"] = sin(t * 0.023) * 0.05
	match d.get("idle", ""):
		"discurso":
			p["mao_f"] = Vector2(44 + sin(t * 0.11) * 9, -134 + sin(t * 0.22) * 12)
			p["cabeca_giro"] = sin(t * 0.11) * 0.07
		"militar":
			p["inclina"] = -0.04
			p["mao_f"] = Vector2(30, -124)
			p["mao_t"] = Vector2(10, -118)
			if t % 240 < 40:
				p["mao_f"] = Vector2(22, -176)  # continência rápida
		"sanfona":
			var f := sin(t * 0.09)
			p["mao_f"] = Vector2(38 + f * 14, -122)
			p["mao_t"] = Vector2(14 - f * 12, -120)
			p["cabeca_giro"] = sin(t * 0.045) * 0.09
		"imponente":
			p["inclina"] = -0.06
			p["mao_f"] = Vector2(-2, -98)
			p["mao_t"] = Vector2(-14, -94)
			if t % 300 < 34:
				p["mao_f"] = Vector2(30, -150)  # mão no queixo, avaliando o réu
		"dedo":
			# discurso de tribuna: dedo apontado, cabeça firme
			p["mao_f"] = Vector2(50 + sin(t * 0.1) * 8, -150 + sin(t * 0.2) * 6)
			p["mao_t"] = Vector2(-8, -100)
			p["cabeca_giro"] = sin(t * 0.1) * 0.06
			p["boca"] = "grito" if (t / 12) % 4 == 0 else "normal"
		"megafone":
			# megafone na mão; de tempos em tempos leva à boca e puxa o coro
			p["mao_f"] = Vector2(30, -96)
			p["prop"] = "megafone"
			p["mao_t"] = Vector2(-6, -100)
			if t % 240 < 60:
				p["mao_f"] = Vector2(40, -196)
				p["prop"] = "megafone_on"
				p["mao_t"] = Vector2(10 + sin(t * 0.4) * 10, -190)
				p["boca"] = "grito"
				p["cabeca_giro"] = -0.08
		"acenar":
			# aceno de faixa no peito para a multidão imaginária, mãos juntas entre um aceno e outro
			p["mao_f"] = Vector2(12, -104)
			p["mao_t"] = Vector2(0, -100)
			p["inclina"] = -0.03
			if t % 220 < 70:
				var ac := sin(t * 0.35)
				p["mao_f"] = Vector2(54 + ac * 10, -214 + absf(ac) * 6)
				p["cabeca_giro"] = -0.1 + ac * 0.04
				p["boca"] = "grito" if (t / 14) % 3 == 0 else "normal"
		"selfie":
			# celular erguido filmando a si mesmo, falando com a câmera
			p["mao_f"] = Vector2(58, -214 + sin(t * 0.08) * 4)
			p["prop"] = "celular"
			p["mao_t"] = Vector2(14 + sin(t * 0.16) * 10, -132)
			p["cabeca_giro"] = -0.1 + sin(t * 0.16) * 0.05
			p["boca"] = "grito" if (t / 9) % 3 == 0 else "normal"
		"cabelo":
			# ajeita o cabelo de tempos em tempos, mão na cintura
			p["mao_t"] = Vector2(-4, -82)
			p["inclina"] = -0.04
			if t % 260 < 46:
				var k := sin(PI * (t % 260) / 46.0)
				p["mao_f"] = Vector2(26, -150).lerp(Vector2(14, -214), k)
				p["cabeca_giro"] = -0.12 * k
		"celular":
			p["mao_t"] = Vector2(30, -150)
			p["prop_t"] = "celular"
			p["cabeca_giro"] = 0.08 + sin(t * 0.05) * 0.04
	if (t + d.get("nome", "").length() * 37) % 170 < 6:
		p["expr"] = "piscar"
	return p


## Postura de luta (como nos fliperamas): de lado, pernas abertas e joelhos dobrados, punhos na guarda
## perto do rosto e o corpo subindo e descendo no ritmo (ciclo de ~0,6 s).
static func pose_guarda(d: Dictionary, t: int) -> Dictionary:
	var p := pose_padrao()
	var ritmo := sin(t * 0.18)
	var sobe := absf(ritmo)
	p["quadril"] = -62.0 + sobe * 4.0
	p["pe_f"] = Vector2(34, 0)
	p["pe_t"] = Vector2(-32, 0)
	p["inclina"] = 0.08 + ritmo * 0.015
	# os punhos vêm um pouco atrasados em relação ao corpo (peso), e giram de leve
	var atraso := absf(sin(t * 0.18 - 0.7))
	var giro := sin(t * 0.09)
	p["mao_f"] = Vector2(40 + giro * 2.5, -138 + atraso * 5.0)
	p["mao_t"] = Vector2(24 - giro * 2.0, -126 + atraso * 4.0)
	p["pe_f"] = Vector2(34 + giro * 1.5, 0)
	p["punho_grande"] = false
	p["cabeca_desl"] = Vector2(1 + giro, sobe * 2.5)
	p["cabeca_giro"] = 0.05
	if (t + d.get("nome", "").length() * 37) % 170 < 6:
		p["expr"] = "piscar"
	return p


## Provocação (taunt): o meme de cada um.
static func pose_provocar(d: Dictionary, t: int) -> Dictionary:
	var p := pose_padrao()
	p["expr"] = "feliz"
	match _id(d):
		"lula":
			p["mao_f"] = Vector2(40, -206)
			p["cabeca_giro"] = -0.1
		"bolsonaro":
			p["mao_f"] = Vector2(24, -178)
			p["chapeu"] = "boina"
			p["inclina"] = -0.05
			p["expr"] = "esforco"
		"trump":
			Poses.danca(p, t, 1.0)
		"xandao":
			p["mao_f"] = Vector2(30, -150)
			p["mao_t"] = Vector2(-10, -100)
			p["expr"] = "neutro"
			p["cabeca_giro"] = -0.08
		"erika":
			# joga o cabelo e aponta o dedo: "Não me calarão!"
			p["mao_f"] = Vector2(70, -170)
			p["mao_t"] = Vector2(10, -212 + absf(sin(t * 0.2)) * 10)
			p["cabeca_giro"] = -0.2 + sin(t * 0.2) * 0.08
			p["inclina"] = -0.08
		"pavanato":
			# aponta o celular para o rival: "tá gravando?"
			p["mao_f"] = Vector2(84, -170)
			p["prop"] = "celular"
			p["mao_t"] = Vector2(30, -200 + absf(sin(t * 0.25)) * 12)
			p["cabeca_giro"] = -0.12
			p["inclina"] = 0.06
		"renan":
			# megafone na boca, dedo apontado para o rival: "nem Lula, nem Flávio!"
			p["mao_f"] = Vector2(40, -196)
			p["prop"] = "megafone_on"
			p["mao_t"] = Vector2(80, -170 + sin(t * 0.3) * 8)
			p["boca"] = "grito"
			p["inclina"] = 0.06
		"flavio":
			# lê a carta (mais uma versão) e olha para o rival por cima do papel
			p["mao_f"] = Vector2(44, -176)
			p["prop"] = "carta"
			p["mao_t"] = Vector2(26, -170)
			p["cabeca_giro"] = 0.1 + sin(t * 0.12) * 0.06
			p["inclina"] = -0.04
			p["boca"] = "grito" if (t / 10) % 3 == 0 else "normal"
		"nikolas":
			# segura a bandeira e acena para a câmera
			p["mao_f"] = Vector2(40, -150)
			p["prop"] = "bandeira"
			p["mao_t"] = Vector2(10, -210 + absf(sin(t * 0.3)) * 14)
			p["cabeca_giro"] = -0.1
		"eduarda":
			p["mao_f"] = Vector2(72, -204)
			p["prop"] = "celular"
			p["inclina"] = -0.1
			p["cabeca_giro"] = -0.15
	return p


## Vitória: comemoração própria (em loop).
static func pose_vitoria(d: Dictionary, t: int) -> Dictionary:
	var p := pose_padrao()
	p["expr"] = "feliz"
	p["punho_grande"] = true
	var bob := sin(t * 0.15)
	match _id(d):
		"lula":
			p["mao_f"] = Vector2(36, -214 + bob * 6)
			p["prop"] = "picanha"
			p["mao_t"] = Vector2(-26, -200)
		"bolsonaro":
			p["mao_f"] = Vector2(44, -176)
			p["mao_t"] = Vector2(-30, -176)
			p["prop"] = "joinha"
			p["prop_t"] = "joinha"
			p["chapeu"] = "boina"
		"trump":
			Poses.danca(p, t, 1.2)
			p["punho_grande"] = false
		"xandao":
			var k := absf(sin(t * 0.12))
			p["mao_f"] = Vector2(54, -132).lerp(Vector2(40, -214), k)
			p["prop"] = "martelo"
			p["expr"] = "esforco" if k < 0.2 else "feliz"
		"erika":
			p["mao_f"] = Vector2(40, -228 + bob * 4)
			p["prop"] = "pec"
			p["mao_t"] = Vector2(-6, -84)
			p["cabeca_giro"] = -0.12
			p["inclina"] = -0.06
		"pavanato":
			p["mao_f"] = Vector2(56, -220 + bob * 4)
			p["prop"] = "celular"
			p["mao_t"] = Vector2(-30, -200)
			p["prop_t"] = "joinha"
			p["cabeca_giro"] = -0.15
		"renan":
			p["mao_f"] = Vector2(40, -196)
			p["prop"] = "megafone_on"
			p["mao_t"] = Vector2(-26, -224 + bob * 6)
			p["boca"] = "grito"
			p["cabeca_giro"] = -0.1
		"flavio":
			p["mao_f"] = Vector2(44, -226 + bob * 4)
			p["prop"] = "carta"
			p["mao_t"] = Vector2(-30, -206 - absf(sin(t * 0.3)) * 10)
			p["cabeca_giro"] = -0.14
			p["inclina"] = -0.06
		"nikolas":
			p["mao_f"] = Vector2(40, -150 + bob * 4)
			p["prop"] = "bandeira"
			p["mao_t"] = Vector2(-30, -214)
			p["cabeca_giro"] = -0.12
		"eduarda":
			p["mao_f"] = Vector2(72, -204 + bob * 4)
			p["prop"] = "celular"
			p["inclina"] = -0.08
			p["cabeca_giro"] = -0.12
		_:
			p["mao_f"] = Vector2(34, -222 + bob * 6)
			p["mao_t"] = Vector2(-30, -214)
	if _id(d) != "trump":
		p["cabeca_desl"] = Vector2(0, bob * 2.0)
	return p


## Derrota: frustração própria.
static func pose_derrota(d: Dictionary, t: int) -> Dictionary:
	var p := pose_padrao()
	p["expr"] = "derrota"
	p["agachado"] = true
	p["quadril"] = -40.0
	p["pe_f"] = Vector2(30, 0)
	p["pe_t"] = Vector2(-28, 0)
	p["inclina"] = 0.28
	p["cabeca_giro"] = 0.3 + sin(t * 0.05) * 0.04
	p["mao_f"] = Vector2(30, -42)
	p["mao_t"] = Vector2(4, -40)
	match _id(d):
		"lula":
			p["prop"] = "espeto"
			p["mao_f"] = Vector2(34, -70)
		"bolsonaro":
			p["agachado"] = false
			p["quadril"] = -72.0
			p["pe_f"] = Vector2(20, 0)
			p["pe_t"] = Vector2(-20, 0)
			p["inclina"] = -0.05
			p["mao_f"] = Vector2(52, -112 - absf(sin(t * 0.08)) * 10)
			p["mao_t"] = Vector2(-34, -112 - absf(sin(t * 0.08)) * 10)
			p["cabeca_giro"] = -0.1
		"trump":
			p["agachado"] = false
			p["quadril"] = -72.0
			p["pe_f"] = Vector2(20, 0)
			p["pe_t"] = Vector2(-20, 0)
			p["inclina"] = -0.08
			p["mao_f"] = Vector2(6, -122)
			p["mao_t"] = Vector2(18, -114)
			p["cabeca_giro"] = -0.2
		"xandao":
			p["prop"] = "martelo"
		"erika":
			p["mao_f"] = Vector2(22, -100)
			p["mao_t"] = Vector2(8, -96)
		"pavanato":
			p["mao_f"] = Vector2(30, -96)
			p["prop"] = "celular"
		"renan":
			p["mao_f"] = Vector2(30, -62)
			p["prop"] = "megafone"
			p["mao_t"] = Vector2(10, -96)
		"flavio":
			p["mao_f"] = Vector2(34, -70)
			p["prop"] = "carta"
			p["mao_t"] = Vector2(14, -178)
		"nikolas":
			p["mao_f"] = Vector2(30, -60)
			p["prop"] = "bandeira"
		"eduarda":
			p["mao_f"] = Vector2(30, -96)
			p["prop"] = "celular"
	return p


# ---------------------------------------------------------------- primitivas com contorno
# Cada parte é desenhada duas vezes: primeiro a silhueta escura um pouco maior (contorno),
# depois a cor. É o que dá o traço preto dos sprites de 16 bits.

static func _cor(cor: Color) -> Color:
	if _silhueta.a > 0.0:
		return _silhueta
	return CONTORNO if _cont else cor


static func _lin(c: CanvasItem, a: Vector2, b: Vector2, cor: Color, w: float) -> void:
	_dl(c, a, b, _cor(cor), w + (6.0 if _cont else 0.0))


static func _circ(c: CanvasItem, pos: Vector2, r: float, cor: Color) -> void:
	_dc(c, pos, r + (3.0 if _cont else 0.0), _cor(cor))


static func _poli(c: CanvasItem, pts: PackedVector2Array, cor: Color) -> void:
	if _cont:
		for o in [Vector2(3, 0), Vector2(-3, 0), Vector2(0, 3), Vector2(0, -3)]:
			var m := PackedVector2Array()
			for q in pts:
				m.append(q + o)
			_dp(c, m, _cor(cor))
	else:
		_dp(c, pts, cor)


static func _ret(c: CanvasItem, r: Rect2, cor: Color) -> void:
	_dr(c, r.grow(3.0 if _cont else 0.0), _cor(cor))


static func _arco(c: CanvasItem, centro: Vector2, r: float, de: float, ate: float, cor: Color, w: float) -> void:
	_da(c, centro, r, de, ate, 20, _cor(cor), w + (6.0 if _cont else 0.0))


# ---------------------------------------------------------------- lutador

## Desenha o lutador em pos, com escala (negativa em x = olhando para a esquerda).
static func lutador_em(c: CanvasItem, d: Dictionary, p: Dictionary, pos: Vector2, escala: Vector2) -> void:
	_base = Transform2D(0.0, escala, 0.0, pos)
	_dm(c, _base)
	lutador(c, d, p)
	_base = Transform2D.IDENTITY
	_dm(c, _base)


static func lutador(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	if usar_lote and _lote == null:
		_lote = Lote.new()
		_lote.xf = _base
		_lutador(c, d, p)
		_lote.despejar(c)
		_lote = null
		c.draw_set_transform_matrix(_base)
		return
	_lutador(c, d, p)


static func _lutador(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	if p.has("veiculo"):
		veiculo(c, p["veiculo"], int(p.get("t", 0)))
	if p.get("churrasqueira", false):
		Arte.churrasqueira(c, Vector2(120, 0), int(p.get("t", 0)))
	if p.get("aura", false):
		var t := int(p.get("t", 0))
		for i in 3:
			var r := 110.0 + i * 26.0 + sin(t * 0.3 + i) * 8.0
			_da(c, Vector2(0, -110), r, 0, TAU, 28, Color(1, 0.85, 0.3, 0.25 - i * 0.06), 8.0)
	_cont = true
	_corpo(c, d, p)
	_cont = false
	_corpo(c, d, p)
	_mat_tronco = Transform2D.IDENTITY
	if p.get("tonto", false) or p.get("cadeado", false) or p.get("baloes", false) or p.has("letra"):
		_extras_cabeca(c, d, p)
	if p.get("censura", false) and _silhueta.a == 0.0:
		_dm(c, _base * Transform2D(p["inclina"], Vector2(0, p["quadril"])))
		Arte.censura(c, Vector2(4, -140) + p.get("cabeca_desl", Vector2.ZERO), int(p.get("t", 0)))
		_dm(c, _base)


## Rastro de velocidade: só a silhueta do boneco, numa cor translúcida.
static func silhueta(c: CanvasItem, d: Dictionary, p: Dictionary, pos: Vector2, escala: Vector2, rot: float, cor: Color) -> void:
	_base = Transform2D(rot, escala, 0.0, pos)
	_dm(c, _base)
	_silhueta = cor
	_cont = true
	if usar_lote:
		_lote = Lote.new()
		_lote.xf = _base
	_corpo(c, d, p)
	if _lote != null:
		_lote.despejar(c)
		_lote = null
	_cont = false
	_silhueta = Color(0, 0, 0, 0)
	_mat_tronco = Transform2D.IDENTITY
	_base = Transform2D.IDENTITY
	_dm(c, _base)


## Estrelas de tontura, cadeado do bloqueio, balões de fala e a letra da dança, acima da cabeça.
static func _extras_cabeca(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	var t := int(p.get("t", 0))
	var topo := Vector2(0, p["quadril"] - 190.0)
	if p.get("tonto", false):
		for k in 3:
			var a := t * 0.15 + k * TAU / 3.0
			_estrela(c, topo + Vector2(cos(a) * 34.0, sin(a) * 10.0), 8.0, Color("ffd23f"))
	if p.get("cadeado", false):
		Arte.cadeado(c, topo + Vector2(-40, -10), 0.8)
	if p.get("baloes", false):
		for k in 3:
			var fase := fposmod(t * 0.04 + k / 3.0, 1.0)
			var pos := topo + Vector2(60 + fase * 120.0, 40 - fase * 60.0 + k * 20)
			var cor := Color(1, 1, 1, 1.0 - fase)
			_dr(c, Rect2(pos - Vector2(26, 14), Vector2(52, 28)), Color(0.08, 0.05, 0.12, cor.a))
			_dr(c, Rect2(pos - Vector2(23, 11), Vector2(46, 22)), cor)
			for j in 3:
				_dc(c, pos + Vector2(-12 + j * 12, 0), 3.0, Color(0.1, 0.1, 0.1, cor.a))
	if p.has("letra"):
		texto(c, topo + Vector2(0, -40), p["letra"], 40, Color("ffd23f"), PRETO, 8)


## Articulação de dois ossos (cinemática inversa): devolve [junta, ponta]. A ponta fica no alvo,
## ou o mais perto possível sem esticar o membro. dobra: 1 = joelho (para a frente), -1 = cotovelo (para baixo/trás).
static func _ik(raiz: Vector2, alvo: Vector2, l1: float, l2: float, dobra: int) -> Array:
	var v := alvo - raiz
	var dist := clampf(v.length(), 4.0, l1 + l2 - 0.5)
	var dir := v.normalized() if v.length() > 0.01 else Vector2(1, 0)
	var ponta := raiz + dir * dist
	var a := (l1 * l1 - l2 * l2 + dist * dist) / (2.0 * dist)
	var h := sqrt(maxf(l1 * l1 - a * a, 0.0))
	var perp := dir.orthogonal()
	if dobra > 0:
		# joelho para a frente; se a perna está deitada (chute), para cima
		if absf(perp.x) < 0.25:
			perp = perp if perp.y < 0 else -perp
		elif perp.x < 0:
			perp = -perp
	else:
		# cotovelo para baixo; com o braço para cima, para trás
		if absf(perp.y) < 0.25:
			perp = perp if perp.x < 0 else -perp
		elif perp.y < 0:
			perp = -perp
	return [raiz + dir * a + perp * h, ponta]


static func _corpo(c: CanvasItem, d: Dictionary, p: Dictionary) -> void:
	var quadril := Vector2(0, p["quadril"])
	var inclina: float = p["inclina"]
	var corpo: Dictionary = d.get("corpo", {})
	var larg: float = corpo.get("larg", 1.0)
	var ombro_f := quadril + Vector2(13 * larg, -55).rotated(inclina)
	var ombro_t := quadril + Vector2(-11 * larg, -55).rotated(inclina)
	var roupa: Color = d["roupa"]
	var braco_t := _ik(ombro_t, p["mao_t"], 34.0, 33.0, -1)
	var braco_f := _ik(ombro_f, p["mao_f"], 34.0, 33.0, -1)
	var perna_t := _ik(quadril + Vector2(-8, 0), p["pe_t"], 39.0, 37.0, 1)
	var perna_f := _ik(quadril + Vector2(8, 0), p["pe_f"], 39.0, 37.0, 1)

	if not _cont and _silhueta.a == 0.0 and p.has("rastro") and (p["rastro"] as Array).size() == 2:
		_rastro(c, p["rastro"][0], p["rastro"][1])
	# braço e perna de trás (mais escuros), depois a da frente
	_braco(c, d, ombro_t, braco_t[0], braco_t[1], true, false)
	if not _cont:
		_prop_mao(c, p.get("prop_t", ""), braco_t[1])
	_perna(c, d, quadril + Vector2(-8, 0), perna_t[0], perna_t[1], true)
	_perna(c, d, quadril + Vector2(8, 0), perna_f[0], perna_f[1], false)

	_mat_tronco = _base * Transform2D(inclina, quadril)
	_dm(c, _mat_tronco * Transform2D(0.0, Vector2(larg, 1.0), 0.0, Vector2.ZERO))
	_tronco(c, d, float(corpo.get("barriga", 0.0)), float(p.get("vento", 0.0)))
	_dm(c, _mat_tronco)
	if not _cont:
		# contorno próprio da cabeça por cima do tronco
		_cont = true
		cabeca(c, d, Vector2(0, -96), 32.0, p)
		_cont = false
	cabeca(c, d, Vector2(0, -96), 32.0, p)
	_dm(c, _base)

	if not _cont:
		_cont = true
		_braco(c, d, ombro_f, braco_f[0], braco_f[1], false, p["punho_grande"])
		_cont = false
	_braco(c, d, ombro_f, braco_f[0], braco_f[1], false, p["punho_grande"])
	_prop_ang = p.get("prop_ang", 0.0)
	_prop_mao(c, p.get("prop", ""), braco_f[1])
	_prop_ang = 0.0


static func _perna(c: CanvasItem, d: Dictionary, quadril: Vector2, joelho: Vector2, pe: Vector2, de_tras: bool) -> void:
	if d["extra"] == "blazer_vestido":
		_perna_salto(c, d, quadril, joelho, pe, de_tras)
		return
	var cor: Color = d["calca"]
	if d["extra"] == "toga":
		cor = Color("1b1b22")
	if de_tras:
		cor = cor.darkened(0.25)
	_lin(c, quadril, joelho, cor, 19.0)
	_circ(c, joelho, 8.5, cor)
	_lin(c, joelho, pe + Vector2(0, -6), cor, 16.0)
	if not _cont:
		# vinco da calça e brilho na canela
		_dl(c, quadril.lerp(joelho, 0.15) + Vector2(3, 0), joelho + Vector2(3, 1), cor.lightened(0.14), 3.0)
		_dl(c, joelho + Vector2(3, 3), pe + Vector2(3, -12), cor.lightened(0.18), 3.0)
		# lado de trás da perna na sombra e dobra atrás do joelho
		_dl(c, quadril.lerp(joelho, 0.2) + Vector2(-6, 0), joelho + Vector2(-5, 0), cor.darkened(0.3), 3.0)
		_dl(c, joelho + Vector2(-4, 4), pe + Vector2(-4, -12), cor.darkened(0.25), 2.5)
		_dl(c, joelho + Vector2(-6, -3), joelho + Vector2(2, 2), cor.darkened(0.35), 2.0)
		# barra da calça caindo sobre o sapato
		var dcan := (pe - joelho).normalized()
		_dl(c, pe - dcan * 9.0 + dcan.orthogonal() * 8.0, pe - dcan * 9.0 - dcan.orthogonal() * 8.0, cor.darkened(0.2), 3.0)
	# sapato apoiado no chão (ou acompanhando a canela quando o pé sobe)
	var dir_canela := (pe - joelho).normalized()
	var frente := Vector2(1, 0)
	var cima := Vector2(0, -1)
	if pe.y < -6.0:
		# pé no ar: o sapato acompanha a canela
		frente = Vector2(-dir_canela.y, dir_canela.x)
		if frente.x < 0:
			frente = -frente
		cima = -dir_canela
	var sapato := PackedVector2Array([pe + cima * 9 - frente * 9, pe + cima * 9 + frente * 12, pe + frente * 20, pe - frente * 9])
	var tenis: bool = d["id"] in ["eduarda", "pavanato"]
	var cor_sapato := Color("2a2230") if not tenis else Color("e8e8e8")
	_poli(c, sapato, cor_sapato)
	if not _cont:
		# sola, salto e brilho do bico
		var sola := Color("120c16") if not tenis else Color("b8b8b8")
		_dp(c, PackedVector2Array([pe - frente * 9 + cima * 2.5, pe + frente * 19 + cima * 2.5, pe + frente * 20, pe - frente * 9]), sola)
		_dp(c, PackedVector2Array([pe - frente * 9 + cima * 5, pe - frente * 2 + cima * 5, pe - frente * 2, pe - frente * 9]), sola)
		_dl(c, pe + cima * 7 - frente * 6, pe + cima * 7 + frente * 10, cor_sapato.lightened(0.25), 2.0)
		_dc(c, pe + cima * 6 + frente * 13, 2.2, cor_sapato.lightened(0.45))
		if tenis:
			# tênis: faixa colorida, cadarço e sola branca
			_dl(c, pe + cima * 4 - frente * 8, pe + cima * 4 + frente * 16, Color("1f9d55") if d["id"] == "eduarda" else Color("1f6fd1"), 3.0)
			for k in 3:
				_dl(c, pe + cima * 8.5 + frente * (k * 4.0 - 2.0), pe + cima * 8.5 + frente * (k * 4.0 + 1.0), Color("2a2230"), 1.5)


## Pernas de fora com escarpim preto de salto fino (vestido): canela mais fina, joelho marcado e brilho.
static func _perna_salto(c: CanvasItem, d: Dictionary, quadril: Vector2, joelho: Vector2, pe: Vector2, de_tras: bool) -> void:
	var pele: Color = d["pele"]
	if de_tras:
		pele = pele.darkened(0.22)
	_lin(c, quadril, joelho, pele, 15.0)
	_circ(c, joelho, 6.5, pele)
	_lin(c, joelho, pe + Vector2(0, -8), pele, 11.0)
	if not _cont:
		_dl(c, quadril.lerp(joelho, 0.2) + Vector2(3, 0), joelho + Vector2(2, 0), pele.lightened(0.16), 2.5)
		_dl(c, joelho + Vector2(2, 3), pe + Vector2(2, -14), pele.lightened(0.2), 2.0)
		_dl(c, joelho + Vector2(-4, 3), pe + Vector2(-3, -14), pele.darkened(0.25), 2.0)
	# escarpim: bico fino na frente, salto agulha atrás
	var dir_canela := (pe - joelho).normalized()
	var frente := Vector2(1, 0)
	var cima := Vector2(0, -1)
	if pe.y < -6.0:
		frente = Vector2(-dir_canela.y, dir_canela.x)
		if frente.x < 0:
			frente = -frente
		cima = -dir_canela
	var preto := Color("141018")
	_poli(c, PackedVector2Array([pe + cima * 11 - frente * 6, pe + cima * 6 + frente * 10, pe + frente * 20, pe + cima * 2 - frente * 4]), preto)
	_lin(c, pe + cima * 9 - frente * 6, pe - frente * 8, preto, 3.0)
	if not _cont:
		_dl(c, pe + cima * 8 - frente * 2, pe + cima * 4 + frente * 12, Color("4a4250"), 2.0)
		_dc(c, pe + cima * 3 + frente * 15, 1.6, Color("8a8494"))


static func _braco(c: CanvasItem, d: Dictionary, ombro: Vector2, cotovelo: Vector2, mao: Vector2, de_tras: bool, grande: bool) -> void:
	var extra: String = d["extra"]
	var manga: Color = d["roupa"]
	if de_tras:
		manga = manga.darkened(0.3)
	var pele: Color = d["pele"]
	var curta := extra == "selecao"  # camisa da seleção: manga curta
	var sem_manga := extra == "blazer_vestido"  # vestido-blazer sem manga: braço de fora
	if sem_manga:
		manga = d["pele"].darkened(0.22 if de_tras else 0.0)
		curta = true
	var toga := extra == "toga"
	_circ(c, ombro, 10.0, manga)  # ombro: o braço sai do corpo
	_lin(c, ombro, cotovelo, manga, 17.0)
	_circ(c, cotovelo, 7.5, pele if curta else manga)
	var ante := pele.darkened(0.25 if de_tras else 0.0) if curta else manga
	_lin(c, cotovelo, mao, ante, 13.0 if curta else (15.0 if not toga else 18.0))
	if not _cont:
		_dl(c, ombro + Vector2(0, -4), cotovelo + Vector2(0, -4), manga.lightened(0.2), 3.0)
		if sem_manga:
			# pulseira dourada no pulso
			var dpu := (mao - cotovelo).normalized()
			_dl(c, mao - dpu * 10 + dpu.orthogonal() * 7, mao - dpu * 10 - dpu.orthogonal() * 7, Color("e0b84a"), 3.5)
		elif curta:
			# barra verde da manga
			_dl(c, ombro.lerp(cotovelo, 0.72) + (cotovelo - ombro).orthogonal().normalized() * 9, ombro.lerp(cotovelo, 0.72) - (cotovelo - ombro).orthogonal().normalized() * 9, d["camisa"], 5.0)
		elif toga:
			# boca larga da manga da toga
			var dir := (mao - cotovelo).normalized()
			_dl(c, mao - dir * 12 + dir.orthogonal() * 12, mao - dir * 12 - dir.orthogonal() * 12, Color("26262e"), 6.0)
		elif extra in ["eua", "faixa_roseta", "faixa", "", "broche", "estrela"]:
			# punho da camisa aparecendo
			var dir2 := (mao - cotovelo).normalized()
			_dl(c, mao - dir2 * 11 + dir2.orthogonal() * 6, mao - dir2 * 11 - dir2.orthogonal() * 6, d["camisa"], 5.0)
	if not _cont and not curta:
		# sombra embaixo da manga (luz vem de cima e da frente)
		var n := (cotovelo - ombro).orthogonal().normalized()
		if n.y < 0:
			n = -n
		_dl(c, ombro + n * 6.0, cotovelo + n * 5.0, manga.darkened(0.3), 3.0)
	var r := 11.5 if grande else 9.0
	# punho fechado: a mão olha para onde o antebraço aponta, com nós dos dedos e polegar
	var fd := (mao - cotovelo).normalized() if mao.distance_to(cotovelo) > 0.1 else Vector2(1, 0)
	var fn := fd.orthogonal()
	if fn.y > 0:
		fn = -fn
	_circ(c, mao, r, pele.darkened(0.2))
	_circ(c, mao + fd * r * 0.45, r * 0.78, pele.darkened(0.2))
	if not _cont:
		_dc(c, mao + Vector2(1.0, -1.5), r - 2.5, pele)
		_dc(c, mao + fd * r * 0.45 + Vector2(0.5, -1.0), r * 0.78 - 2.0, pele)
		# nós dos dedos: três calombos na frente do punho
		for k in 3:
			var nk := mao + fd * r * 0.95 + fn * (r * 0.5 - k * r * 0.5)
			_dc(c, nk, 2.4 if grande else 2.0, pele.lightened(0.12))
		_dl(c, mao + fd * r * 0.75 + fn * r * 0.7, mao + fd * r * 0.75 - fn * r * 0.7, pele.darkened(0.3), 1.6)
		# polegar dobrado por cima
		_dl(c, mao - fd * r * 0.2 + fn * r * 0.55, mao + fd * r * 0.5 + fn * r * 0.15, pele.darkened(0.15), 3.0)
		_dl(c, mao - fd * r * 0.5 - fn * r * 0.5, mao + fd * r * 0.2 - fn * r * 0.75, pele.darkened(0.32), 2.0)


## Letras de pixel 3x5 para estampas (dentro do corpo, que está transformado, a fonte não serve).
const _FONTE_PX := {
	"A": ["010", "101", "111", "101", "101"], "N": ["101", "111", "111", "111", "101"], "T": ["111", "010", "010", "010", "010"],
	"I": ["111", "010", "010", "010", "111"], "W": ["101", "101", "111", "111", "101"], "O": ["111", "101", "101", "101", "111"],
	"K": ["101", "110", "100", "110", "101"], "E": ["111", "100", "110", "100", "111"],
	"P": ["110", "101", "110", "100", "100"], "X": ["101", "101", "010", "101", "101"], "R": ["110", "101", "110", "101", "101"],
	"V": ["101", "101", "101", "101", "010"], "G": ["011", "100", "101", "101", "011"], "D": ["110", "101", "101", "101", "110"],
	"S": ["011", "100", "010", "001", "110"], "M": ["101", "111", "111", "101", "101"], "C": ["011", "100", "100", "100", "011"],
	"F": ["111", "100", "110", "100", "100"], "L": ["100", "100", "100", "100", "111"], "U": ["101", "101", "101", "101", "111"],
	"H": ["101", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"], "?": ["110", "001", "010", "000", "010"],
	"0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"], "3": ["110", "001", "010", "001", "110"],
	"5": ["111", "100", "110", "001", "110"], "4": ["101", "101", "111", "001", "001"], "6": ["011", "100", "110", "101", "010"], "%": ["101", "001", "010", "100", "101"],
	"$": ["011", "110", "010", "011", "110"], "!": ["010", "010", "010", "000", "010"],
}


static func letras_px(c: CanvasItem, origem: Vector2, txt: String, px: float, cor: Color) -> void:
	for n in txt.length():
		var g: Array = _FONTE_PX.get(txt[n], [])
		for y in g.size():
			for x in 3:
				if String(g[y])[x] == "1":
					_dr(c, Rect2(origem + Vector2((n * 4 + x) * px, y * px), Vector2(px, px)), cor)


## Arco de movimento (smear) entre onde o golpe saiu e onde chegou: uma faixa curva preenchida
## que afina na saída, branca e translúcida, como nos fliperamas.
static func _rastro(c: CanvasItem, ate: Vector2, de: Vector2) -> void:
	var meio := (ate + de) / 2.0 + (ate - de).orthogonal().normalized() * -18.0
	var fora := PackedVector2Array()
	var dentro := PackedVector2Array()
	for i in 9:
		var k := i / 8.0
		var pt := de.lerp(meio, k).lerp(meio.lerp(ate, k), k)
		var prox := de.lerp(meio, minf(k + 0.05, 1.0)).lerp(meio.lerp(ate, minf(k + 0.05, 1.0)), minf(k + 0.05, 1.0))
		var n := (prox - pt).orthogonal().normalized() if prox.distance_to(pt) > 0.01 else Vector2(0, 1)
		var larg := 2.0 + 13.0 * k
		fora.append(pt + n * larg)
		dentro.append(pt - n * larg * 0.3)
	dentro.reverse()
	var pts := fora + dentro
	if Geometry2D.triangulate_polygon(pts).is_empty():
		return
	_dp(c, pts, Color(1, 1, 1, 0.38))


## Tronco no espaço do quadril (y de 0 a -62). barriga 0 a 1 empurra a frente do paletó.
static func _tronco(c: CanvasItem, d: Dictionary, barriga: float, vento: float = 0.0) -> void:
	var roupa: Color = d["roupa"]
	var extra: String = d["extra"]
	var b := barriga
	var barra := 4.0
	var largura_barra := 22.0
	if extra == "toga":
		barra = 40.0
		largura_barra = 34.0
	elif extra == "selecao":
		barra = 2.0
		largura_barra = 21.0
	elif extra == "blazer_vestido":
		barra = 30.0  # saia lápis até o meio da coxa
		largura_barra = 24.0
	var bal := clampf(-vento * 6.0, -8.0, 8.0) if extra == "toga" else 0.0
	var forma := PackedVector2Array([
		Vector2(-21, -63), Vector2(21, -63), Vector2(27, -56), Vector2(26 + 4 * b, -42),
		Vector2(25 + 12 * b, -27), Vector2(24 + 13 * b, -13), Vector2(21 + 7 * b, -2),
		Vector2(largura_barra, barra), Vector2(-largura_barra + bal, barra + (2.0 if extra == "toga" else 0.0)),
		Vector2(-23, -12), Vector2(-25, -40), Vector2(-27, -56)])
	# pescoço antes do tronco (liga a cabeça)
	_ret(c, Rect2(-9, -72, 18, 12), d["pele"].darkened(0.2))
	_poli(c, forma, roupa)
	if _cont:
		return
	# sombra das costas e brilho da frente
	_dp(c, PackedVector2Array([Vector2(-21, -63), Vector2(-11, -63), Vector2(-12, barra), Vector2(-largura_barra + bal, barra + (2.0 if extra == "toga" else 0.0)), Vector2(-23, -12), Vector2(-25, -40), Vector2(-27, -56)]), roupa.darkened(0.28))
	_dl(c, Vector2(23 + 3 * b, -52), Vector2(21 + 11 * b, -18), roupa.lightened(0.22), 3.0)
	if b > 0.0:
		_da(c, Vector2(8 + 6 * b, -18), 12 + 6 * b, -0.9, 0.9, 8, roupa.lightened(0.12), 3.0)
	# dobras do tecido na cintura e cava do braço
	_dl(c, Vector2(-18, -10), Vector2(-8, -14), roupa.darkened(0.2), 2.0)
	_dl(c, Vector2(16 + 6 * b, -12), Vector2(6 + 4 * b, -16), roupa.darkened(0.15), 2.0)
	_da(c, Vector2(18, -50), 9.0, 1.2, 2.6, 6, roupa.darkened(0.25), 2.0)
	var camisa: Color = d["camisa"]
	match extra:
		"antiwoke":
			# blazer azul-marinho aberto sobre a camiseta preta com "ANTI WOKE" em letras brancas
			_dp(c, PackedVector2Array([Vector2(-16, -63), Vector2(16, -63), Vector2(15, 2), Vector2(-15, 2)]), camisa)
			_da(c, Vector2(0, -63), 7.0, 0.1, PI - 0.1, 8, camisa.lightened(0.25), 2.0)  # gola careca
			letras_px(c, Vector2(-12, -55), "ANTI", 1.6, BRANCO)
			letras_px(c, Vector2(-12, -44), "WOKE", 1.6, BRANCO)
			_dl(c, Vector2(-12, -33), Vector2(12, -33), Color("e5243b"), 2.5)  # risco embaixo
			# lapelas do blazer aberto (bem abertas, para a estampa aparecer) e botão
			_dp(c, PackedVector2Array([Vector2(-16, -63), Vector2(-22, -62), Vector2(-17, -10), Vector2(-14, -12)]), roupa.lightened(0.12))
			_dp(c, PackedVector2Array([Vector2(16, -63), Vector2(22, -62), Vector2(17, -10), Vector2(14, -12)]), roupa.lightened(0.2))
			_dc(c, Vector2(19, -16), 1.8, roupa.darkened(0.4))
			# broche na lapela (como na foto)
			_dr(c, Rect2(-21, -52, 4, 4), Color("c9a227"))
		"blazer_vestido":
			# vestido-blazer preto sem manga: decote em V, lapelas acetinadas, cinto fino e botões dourados
			_dp(c, PackedVector2Array([Vector2(-10, -63), Vector2(10, -63), Vector2(0, -36)]), d["pele"])
			_dp(c, PackedVector2Array([Vector2(-10, -63), Vector2(-17, -61), Vector2(-3, -33), Vector2(0, -36)]), roupa.lightened(0.16))
			_dp(c, PackedVector2Array([Vector2(10, -63), Vector2(17, -61), Vector2(3, -33), Vector2(0, -36)]), roupa.lightened(0.24))
			_dl(c, Vector2(-26, -56), Vector2(-22, -62), d["pele"], 4.0)  # cava sem manga
			_dl(c, Vector2(26, -56), Vector2(22, -62), d["pele"], 4.0)
			_dr(c, Rect2(-23, -8, 46, 4), roupa.lightened(0.12))
			_dc(c, Vector2(2, -24), 1.8, Color("e0b84a"))
			_dc(c, Vector2(2, -15), 1.8, Color("e0b84a"))
			# fenda da saia e brilho do tecido
			_dl(c, Vector2(14, 14), Vector2(16, barra - 2), roupa.darkened(0.4), 2.0)
			_dl(c, Vector2(19, -50), Vector2(18, 24), roupa.lightened(0.3), 1.5)
		"toga":
			# gola branca, cordões vermelhos e a barra balançando
			_dp(c, PackedVector2Array([Vector2(-12, -63), Vector2(12, -63), Vector2(7, -44), Vector2(0, -40), Vector2(-7, -44)]), BRANCO)
			_dl(c, Vector2(0, -40), Vector2(0, barra - 4), Color("34343e"), 2.0)
			_dl(c, Vector2(-13, -62), Vector2(-9, barra - 6), Color("c8102e"), 2.5)
			_dl(c, Vector2(13, -62), Vector2(9, barra - 6), Color("c8102e"), 2.5)
			for k in 3:
				var x := -24.0 + k * 16.0
				_dl(c, Vector2(x, 0), Vector2(x + bal * 0.5, barra - 2), roupa.lightened(0.08), 2.0)
		"militar":
			# farda: camisa amarela por dentro, cinto, bolsos, bandeira e divisas
			_dp(c, PackedVector2Array([Vector2(-11, -63), Vector2(11, -63), Vector2(5, -18), Vector2(-5, -18)]), camisa)
			_dl(c, Vector2(-11, -63), Vector2(-4, -20), roupa.darkened(0.4), 2.0)
			_dl(c, Vector2(11, -63), Vector2(4, -20), roupa.darkened(0.4), 2.0)
			_dr(c, Rect2(-23, -6, 46 + 8 * b, 7), Color("2a2a1a"))
			_dr(c, Rect2(-3, -6, 7, 7), Color("c9a227"))
			_dr(c, Rect2(-21, -42, 11, 10), roupa.darkened(0.2))
			_dr(c, Rect2(11, -42, 11, 10), roupa.darkened(0.2))
			_dr(c, Rect2(-21, -42, 11, 3), roupa.darkened(0.35))
			_dr(c, Rect2(11, -42, 11, 3), roupa.darkened(0.35))
			_dr(c, Rect2(-24, -57, 10, 7), Color("1f9d55"))
			_dr(c, Rect2(-22, -56, 5, 5), Color("ffd23f"))
			for k in 3:
				_dr(c, Rect2(14 + k * 3, -57, 2, 5), Color("ffd23f"))
			# dragonas nos ombros, barra de condecorações e botões dos bolsos
			_dr(c, Rect2(-28, -63, 13, 5), roupa.darkened(0.35))
			_dr(c, Rect2(15, -63, 13, 5), roupa.darkened(0.35))
			_dc(c, Vector2(-17, -61), 1.6, Color("c9a227"))
			_dc(c, Vector2(17, -61), 1.6, Color("c9a227"))
			var fitas := [Color("1f9d55"), Color("ffd23f"), Color("2a4f9a"), Color("c8102e")]
			for k in 4:
				_dr(c, Rect2(10 + k * 4, -49, 4, 5), fitas[k])
			_dc(c, Vector2(-15.5, -37), 1.4, Color("c9a227"))
			_dc(c, Vector2(16.5, -37), 1.4, Color("c9a227"))
		"selecao":
			# camisa amarela com gola verde em V, escudo e barra verde
			_dp(c, PackedVector2Array([Vector2(-14, -63), Vector2(14, -63), Vector2(0, -40)]), camisa)
			_dp(c, PackedVector2Array([Vector2(-9, -63), Vector2(9, -63), Vector2(0, -47)]), d["pele"])
			_dl(c, Vector2(-27, -56), Vector2(-21, -63), camisa, 4.0)
			_dl(c, Vector2(27, -56), Vector2(21, -63), camisa, 4.0)
			_dp(c, PackedVector2Array([Vector2(8, -33), Vector2(18, -33), Vector2(18, -23), Vector2(13, -19), Vector2(8, -23)]), Color("2a4f9a"))
			_dc(c, Vector2(13, -28), 2.0, Color("ffd23f"))
			_dr(c, Rect2(-21, -3, 42, 5), camisa)
			# cinco estrelas sobre o escudo e faixa verde lateral da camisa
			for k in 5:
				_dc(c, Vector2(9 + k * 2.2, -36), 0.9, Color("1f9d55"))
			_dl(c, Vector2(25, -54), Vector2(23, -6), camisa.darkened(0.12), 3.0)
			_dl(c, Vector2(24, -54), Vector2(22, -6), Color("1f9d55"), 1.5)
		_:
			# paletó: camisa e gravata no V, lapelas, botões e bolso
			_dp(c, PackedVector2Array([Vector2(-11, -63), Vector2(11, -63), Vector2(0, -26)]), camisa)
			var gravata: Color = d["gravata"]
			if gravata.a > 0.0:
				var ponta := -6.0 if extra == "eua" else -18.0  # a gravata comprida do Trump, dentro do paletó
				var balg := clampf(-vento * 4.0, -5.0, 5.0)
				_dp(c, PackedVector2Array([Vector2(-3, -61), Vector2(3, -61), Vector2(5, -55), Vector2(6 + balg, ponta - 8), Vector2(balg, ponta), Vector2(-6 + balg, ponta - 8), Vector2(-5, -55)]), gravata)
				_dr(c, Rect2(-4, -62, 8, 6), gravata.darkened(0.15))
				_dl(c, Vector2(2, -52), Vector2(3 + balg, ponta - 10), gravata.lightened(0.3), 2.0)
			_dp(c, PackedVector2Array([Vector2(-11, -63), Vector2(-16, -63), Vector2(-3, -24), Vector2(-1, -26)]), roupa.darkened(0.35))
			_dp(c, PackedVector2Array([Vector2(11, -63), Vector2(16, -63), Vector2(3, -24), Vector2(1, -26)]), roupa.lightened(0.1))
			_dc(c, Vector2(3 + 2 * b, -17), 1.8, roupa.darkened(0.5))
			_dc(c, Vector2(3 + 3 * b, -8), 1.8, roupa.darkened(0.5))
			_dl(c, Vector2(10, -30), Vector2(19 + 4 * b, -30), roupa.darkened(0.3), 2.0)
			# lenço no bolso do peito e costura das lapelas
			if extra in ["eua", "faixa_roseta", "faixa"]:
				var lenco := BRANCO if extra == "eua" else Color("e7e3d4")
				_dp(c, PackedVector2Array([Vector2(-20, -47), Vector2(-14, -49), Vector2(-12, -45), Vector2(-20, -44)]), lenco)
			_dl(c, Vector2(14, -60), Vector2(3, -27), roupa.lightened(0.25), 1.2)
			match extra:
				"faixa":
					# faixa verde e amarela da foto (verde nas bordas, amarelo no meio), brasão dourado embaixo
					var fx := PackedVector2Array([Vector2(-26, -57), Vector2(-14, -63), Vector2(25 + 10 * b, -8), Vector2(22 + 10 * b, 3), Vector2(13 + 8 * b, 3)])
					_dp(c, fx, Color("1f9d55"))
					_dp(c, PackedVector2Array([Vector2(-22, -59), Vector2(-17, -61), Vector2(22 + 10 * b, -5), Vector2(19 + 10 * b, 1)]), Color("ffd23f"))
					_dl(c, Vector2(-23, -58), Vector2(20 + 10 * b, 0), Color("ffe680"), 1.0)
					_dc(c, Vector2(12 + 8 * b, -10), 8.0, Color("c9a227"))
					_estrela(c, Vector2(12 + 8 * b, -10), 7.0, Color("e8c547"))
					_dc(c, Vector2(12 + 8 * b, -10), 3.2, Color("1f3f9a"))
					# broche do Senado na lapela
					_dc(c, Vector2(-15, -40), 2.2, Color("c9a227"))
				"faixa_roseta":
					# faixa presidencial verde e amarela atravessada, com a roseta
					_dp(c, PackedVector2Array([Vector2(-25, -58), Vector2(-15, -62), Vector2(24 + 10 * b, -6), Vector2(20 + 10 * b, 2), Vector2(14 + 8 * b, 2)]), Color("1f9d55"))
					_dp(c, PackedVector2Array([Vector2(-21, -60), Vector2(-17, -61), Vector2(22 + 10 * b, -4), Vector2(18 + 10 * b, 0)]), Color("ffd23f"))
					_dc(c, Vector2(14 + 8 * b, -8), 9.0, Color("1f9d55"))
					_dc(c, Vector2(14 + 8 * b, -8), 6.0, Color("ffd23f"))
					_dc(c, Vector2(14 + 8 * b, -8), 2.5, Color("c9a227"))
				"eua":
					_dr(c, Rect2(-19, -50, 8, 6), BRANCO)
					_dr(c, Rect2(-19, -50, 8, 2), Color("c8102e"))
					_dr(c, Rect2(-19, -50, 3, 3), Color("2a3f8f"))
				"estrela":
					_estrela(c, Vector2(-15, -46), 5.5, Color("e3262f"))
				"broche":
					_dr(c, Rect2(-17, -50, 7, 5), Color("1f9d55"))


static func cabeca(c: CanvasItem, d: Dictionary, centro: Vector2, r: float, p: Dictionary) -> void:
	if _silhueta.a > 0.0:
		var giro: float = p.get("cabeca_giro", 0.0)
		_dm(c, _mat_tronco * Transform2D(giro, centro + Vector2(0, r * 1.0)))
		_dc(c, Vector2(0, -r * 1.1), r * 1.05, _silhueta)
		_dm(c, _mat_tronco)
		return
	if d.has("foto") and textura(d["foto"] + "_cabeca") != null:
		if not _cont:
			_cabeca_foto(c, d, centro, r, p)
		return
	var pele: Color = d["pele"]
	var cabelo: Color = d["cabelo"]
	var estilo: String = d["estilo_cabelo"]

	if estilo == "curto":
		_circ(c, centro + Vector2(-3, -5), r * 1.14, cabelo)
	_circ(c, centro + Vector2(-r * 0.78, 2), r * 0.24, pele.darkened(0.15))
	_circ(c, centro, r, pele.darkened(0.2))
	_circ(c, centro + Vector2(r * 0.12, r * 0.38), r * 0.72, pele.darkened(0.2))
	if not _cont:
		# rosto com sombra do lado de trás (luz vindo da frente)
		_dc(c, centro + Vector2(3, -2), r - 3.0, pele)
		_dc(c, centro + Vector2(r * 0.12 + 3, r * 0.36), r * 0.72 - 3.0, pele)
		_dc(c, centro + Vector2(r * 0.35, -r * 0.55), r * 0.16, pele.lightened(0.2))

	match estilo:
		"grisalho":
			_arco(c, centro, r * 0.98, PI * 1.05, PI * 1.95, cabelo, r * 0.22)
			_circ(c, centro + Vector2(-r * 0.82, -r * 0.18), r * 0.34, cabelo)
		"repartido":
			_poli(c, _arco_cheio(centro, r * 1.04, PI * 1.02, PI * 2.02, r * 0.62), cabelo)
			if not _cont:
				_dl(c, centro + Vector2(-r * 0.2, -r * 0.98), centro + Vector2(r * 0.05, -r * 0.55), cabelo.lightened(0.3), 2.0)
		"careca":
			if not _cont:
				_da(c, centro + Vector2(r * 0.1, -r * 0.1), r * 0.72, PI * 1.25, PI * 1.6, 10, Color(1, 1, 1, 0.5), 4.0)
				_dc(c, centro + Vector2(-r * 0.85, -r * 0.05), r * 0.18, Color("5a4a40"))
		"grisalho_liso":
			_poli(c, _arco_cheio(centro, r * 1.03, PI * 1.0, PI * 1.98, r * 0.5), cabelo)
		"curto":
			_poli(c, _arco_cheio(centro, r * 1.06, PI * 1.05, PI * 1.9, r * 0.55), cabelo)
		"palhaco":
			_circ(c, centro + Vector2(-r * 0.85, -r * 0.1), r * 0.36, cabelo)
			var base_e := centro + Vector2(-r * 0.95, -r * 0.55)
			var base_d := centro + Vector2(r * 0.95, -r * 0.55)
			var ponta := centro + Vector2(-r * 0.6, -r * 2.1)
			_poli(c, PackedVector2Array([base_e, base_d, ponta]), Color("2a9df4"))
			if not _cont:
				_dp(c, PackedVector2Array([base_e.lerp(ponta, 0.33), base_d.lerp(ponta, 0.33), base_d.lerp(ponta, 0.66), base_e.lerp(ponta, 0.66)]), Color("f2c230"))
			_ret(c, Rect2(base_e + Vector2(-2, -4), Vector2(base_d.x - base_e.x + 4, 9)), Color("e63946"))
			_circ(c, ponta, r * 0.2, Color("e63946"))
	if d["barba"]:
		var barba := PackedVector2Array()
		for i in 13:
			var a := lerpf(PI * 0.02, PI * 0.98, i / 12.0)
			barba.append(centro + Vector2(r * 0.12, r * 0.25) + Vector2(cos(a) * r * 0.92, sin(a) * r * 0.82))
		barba.append(centro + Vector2(-r * 0.7, r * 0.2))
		barba.append(centro + Vector2(r * 0.95, r * 0.2))
		_poli(c, barba, cabelo)
	if _cont:
		return

	if d["barba"]:
		_dl(c, centro + Vector2(r * 0.2, r * 0.36), centro + Vector2(r * 0.86, r * 0.36), cabelo.darkened(0.25), 6.0)
		for i in 4:
			_dl(c, centro + Vector2(r * (0.0 + i * 0.25), r * 0.6), centro + Vector2(r * (0.05 + i * 0.25), r * 0.85), cabelo.darkened(0.2), 2.0)
	var olho1 := centro + Vector2(r * 0.12, -r * 0.08)
	var olho2 := centro + Vector2(r * 0.62, -r * 0.08)
	match p.get("olhos", "normal"):
		"x":
			for o in [olho1, olho2]:
				_dl(c, o + Vector2(-5, -5), o + Vector2(5, 5), PRETO, 3.0)
				_dl(c, o + Vector2(-5, 5), o + Vector2(5, -5), PRETO, 3.0)
		"fechado":
			for o in [olho1, olho2]:
				_dl(c, o + Vector2(-6, 0), o + Vector2(6, 2), PRETO, 3.0)
		_:
			for o in [olho1, olho2]:
				_dc(c, o, r * 0.17, BRANCO)
				_dc(c, o + Vector2(2.2, 0.5), r * 0.1, PRETO)
	var brava: bool = d["id"] == "xandao"
	var cor_sob: Color = cabelo.darkened(0.35) if estilo != "careca" else Color("3a2c25")
	var g := 5.5 if brava else 3.5
	_dl(c, olho1 + Vector2(-7, -12 if brava else -10), olho1 + Vector2(7, -7 if brava else -11), cor_sob, g)
	_dl(c, olho2 + Vector2(-7, -7 if brava else -11), olho2 + Vector2(7, -12 if brava else -10), cor_sob, g)
	if d["oculos"]:
		for o in [olho1, olho2]:
			_da(c, o, r * 0.27, 0, TAU, 18, PRETO, 3.0)
			_da(c, o + Vector2(-2, -2), r * 0.18, PI * 1.1, PI * 1.5, 6, Color(1, 1, 1, 0.7), 2.0)
		_dl(c, olho1 + Vector2(r * 0.27, 0), olho2 - Vector2(r * 0.27, 0), PRETO, 2.5)
	var nariz := centro + Vector2(r * 0.88, r * 0.12)
	_dp(c, PackedVector2Array([nariz + Vector2(-8, -10), nariz + Vector2(7, 4), nariz + Vector2(-6, 7)]), pele.darkened(0.2))
	_dl(c, nariz + Vector2(-7, -9), nariz + Vector2(5, 3), pele.lightened(0.15), 2.0)
	if estilo == "palhaco":
		_dc(c, centro + Vector2(r * 0.05, r * 0.32), r * 0.16, Color(1, 0.35, 0.4, 0.6))
	var boca := centro + Vector2(r * 0.5, r * 0.5)
	match p.get("boca", "normal"):
		"grito":
			_dc(c, boca, r * 0.22, Color("4a0c14"))
			_dc(c, boca + Vector2(0, 3), r * 0.11, Color("e05a6a"))
			_dr(c, Rect2(boca + Vector2(-5, -7), Vector2(10, 3)), BRANCO)
		"dor":
			_dl(c, boca + Vector2(-8, 2), boca + Vector2(-2, -2), PRETO, 3.0)
			_dl(c, boca + Vector2(-2, -2), boca + Vector2(4, 2), PRETO, 3.0)
			_dl(c, boca + Vector2(4, 2), boca + Vector2(9, -2), PRETO, 3.0)
		"sorriso":
			_da(c, boca + Vector2(0, -5), 9.0, PI * 0.15, PI * 0.85, 10, PRETO, 3.0)
		_:
			_dl(c, boca + Vector2(-7, 0), boca + Vector2(8, -1), PRETO, 3.0)


## Cabeça caricata em pixel art feita da foto (ferramentas/cabeca_pixel.py). O queixo fica no pescoço.
## Cabeça de foto: folha de expressões (ferramentas/cabeca_pixel.py) presa no pescoço.
## p["expr"] escolhe o quadro; p["cabeca_giro"] e p["cabeca_desl"] mexem a cabeça sem mexer o tronco.
static func _cabeca_foto(c: CanvasItem, d: Dictionary, centro: Vector2, r: float, p: Dictionary) -> void:
	var retrato: bool = p.get("retrato", false)
	var tex := textura(d["foto"] + ("_retrato" if retrato else "_rosto"))
	if tex == null:
		tex = textura(d["foto"] + "_cabeca")
		if tex == null:
			return
	var n := EXPRESSOES.size() if tex.get_width() > tex.get_height() * 3 else 1
	var fw := tex.get_width() / float(n)
	var fh := float(tex.get_height())
	var quadro := maxi(0, EXPRESSOES.find(p.get("expr", "neutro"))) if n > 1 else 0
	var h := r * 2.35
	var w := h * fw / fh
	var pescoco := centro + Vector2(0, r * 1.0)
	var giro: float = p.get("cabeca_giro", 0.0)
	var desl: Vector2 = p.get("cabeca_desl", Vector2.ZERO)
	_dm(c, _mat_tronco * Transform2D(giro, pescoco + desl))
	if _lote != null:
		_lote.despejar(c)
		c.draw_set_transform_matrix(_lote.xf)
	c.draw_texture_rect_region(tex, Rect2(-w / 2.0 + r * 0.06, -h, w, h), Rect2(quadro * fw, 0, fw, fh))
	var topo := Vector2(0, -h)
	if d.get("id", "") == "trump" and not retrato:
		_topete(c, topo, h, float(p.get("vento", 0.0)), float(p.get("cabelo_estica", 0.0)), int(p.get("t", 0)))
	match p.get("chapeu", ""):
		"capacete":
			_cont = true
			_poli(c, _arco_cheio(topo + Vector2(0, h * 0.32), h * 0.36, PI, TAU, h * 0.2), Color("2a2230"))
			_cont = false
			_dp(c, _arco_cheio(topo + Vector2(0, h * 0.32), h * 0.36, PI, TAU, h * 0.2), Color("1f9d55"))
			_dr(c, Rect2(topo + Vector2(-h * 0.36, h * 0.3), Vector2(h * 0.72, 5)), Color("ffd23f"))
		"boina":
			_cont = true
			_poli(c, PackedVector2Array([topo + Vector2(-30, 16), topo + Vector2(26, 6), topo + Vector2(30, 16), topo + Vector2(-26, 26)]), Color("3d4a22"))
			_cont = false
			_dp(c, PackedVector2Array([topo + Vector2(-30, 16), topo + Vector2(26, 6), topo + Vector2(30, 16), topo + Vector2(-26, 26)]), Color("4b5a2a"))
			_dc(c, topo + Vector2(-12, 16), 4.0, Color("ffd23f"))
	if p.get("expr", "") == "nocaute" or p.get("olhos", "") == "x":
		var t := Time.get_ticks_msec() * 0.004
		for k in 3:
			var a := t + k * TAU / 3.0
			_estrela(c, Vector2(cos(a) * r * 1.2, -h - 6 + sin(a) * r * 0.3), 7.0, Color("ffd23f"))
	_dm(c, _mat_tronco)


## Topete loiro do Trump: balança com o vento e vira chicote no Hair Attack.
static func _topete(c: CanvasItem, topo: Vector2, h: float, vento: float, estica: float, t: int) -> void:
	var cor := Color("f0cf80")
	var escuro := Color("c9a050")
	var bal := -vento * 6.0 + sin(t * 0.12) * 2.0
	var base := topo + Vector2(-h * 0.05, h * 0.16)
	var ponta := base + Vector2(h * 0.42 + bal, -h * 0.06 - absf(bal) * 0.3)
	if estica > 0.0:
		# o cabelo cresce em ondas até onde está a caixa do golpe
		var pts := PackedVector2Array()
		var n := 12
		var comp := h * (0.5 + estica * 3.6)
		for i in n + 1:
			var k := float(i) / n
			pts.append(base + Vector2(comp * k, -sin(k * PI * 2.0 + t * 0.6) * 10.0 * k - 6.0 * k))
		for i in n + 1:
			var k := 1.0 - float(i) / n
			pts.append(base + Vector2(comp * k, -sin(k * PI * 2.0 + t * 0.6) * 10.0 * k + 12.0 - 8.0 * k))
		for o in [Vector2(2, 2), Vector2(-2, -2)]:
			var m := PackedVector2Array()
			for q in pts:
				m.append(q + o)
			_dp(c, m, CONTORNO)
		_dp(c, pts, cor)
		return
	var tufo := PackedVector2Array([base + Vector2(-h * 0.1, 4), base + Vector2(h * 0.12, -h * 0.1), ponta, base + Vector2(h * 0.3, h * 0.05)])
	_dp(c, tufo, cor)
	_dl(c, base + Vector2(0, -2), ponta + Vector2(-8, 2), escuro, 2.0)


static func _arco_cheio(centro: Vector2, r: float, de: float, ate: float, espessura: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 17:
		var a := lerpf(de, ate, i / 16.0)
		pts.append(centro + Vector2(cos(a), sin(a)) * r)
	for i in 17:
		var a := lerpf(ate, de, i / 16.0)
		pts.append(centro + Vector2(cos(a), sin(a)) * (r - espessura))
	return pts


static func _estrela(c: CanvasItem, centro: Vector2, r: float, cor: Color) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a := -PI / 2.0 + i * PI / 5.0
		var rr := r if i % 2 == 0 else r * 0.45
		pts.append(centro + Vector2(cos(a), sin(a)) * rr)
	_dp(c, pts, cor)


static func _prop_mao(c: CanvasItem, prop: String, mao: Vector2) -> void:
	if prop == "" or _silhueta.a > 0.0:
		return
	if prop in ["picanha_gigante", "fuzil", "metralhadora", "frasco", "caneta", "carimbo", "L", "espeto_cheio"]:
		Arte.prop(c, prop, mao, _prop_ang)
		return
	match prop:
		"martelo":
			_martelo(c, mao)
		"livro":
			_livro(c, mao)
		"picanha":
			for passada in 2:
				_cont = passada == 0
				_lin(c, mao + Vector2(0, 6), mao + Vector2(2, -26), Color("9aa0a6"), 4.0)
				Arte.picanha(c, mao + Vector2(4, -48), -0.15, 1.05, _cont)
			_cont = false
		"bandeira":
			# bandeira do Brasil num mastro, tremulando
			var ond := sin(Time.get_ticks_msec() * 0.008) * 4.0
			for passada in 2:
				_cont = passada == 0
				_lin(c, mao + Vector2(0, 14), mao + Vector2(0, -96), Color("8a5a35"), 4.0)
				_poli(c, PackedVector2Array([mao + Vector2(2, -96), mao + Vector2(60, -92 + ond), mao + Vector2(60, -54 + ond), mao + Vector2(2, -58)]), Color("1f9d55"))
			_cont = false
			_dp(c, PackedVector2Array([mao + Vector2(31, -88 + ond * 0.5), mao + Vector2(54, -74 + ond), mao + Vector2(31, -60 + ond * 0.5), mao + Vector2(8, -76)]), Color("ffd23f"))
			_dc(c, mao + Vector2(31, -75 + ond * 0.5), 8.0, Color("1f3f9a"))
			_dl(c, mao + Vector2(24, -77), mao + Vector2(38, -73), BRANCO, 1.5)
		"megafone", "megafone_on":
			# megafone branco com faixa laranja; ligado solta as ondas de som
			for passada in 2:
				_cont = passada == 0
				_lin(c, mao + Vector2(0, 2), mao + Vector2(2, -12), Color("2a2a30"), 6.0)
				_poli(c, PackedVector2Array([mao + Vector2(-10, -16), mao + Vector2(4, -20), mao + Vector2(34, -32), mao + Vector2(36, 2), mao + Vector2(4, -8), mao + Vector2(-10, -10)]), Color("f2f2f2"))
			_cont = false
			_dp(c, PackedVector2Array([mao + Vector2(14, -24), mao + Vector2(20, -26), mao + Vector2(21, -2), mao + Vector2(15, -4)]), Color("ff7a00"))
			_dr(c, Rect2(mao + Vector2(33, -32), Vector2(4, 34)), Color("c9c9cf"))
			if prop == "megafone_on":
				var f := fposmod(Time.get_ticks_msec() * 0.01, 10.0)
				for k in 3:
					var r := 14.0 + k * 12.0 + f
					_da(c, mao + Vector2(36, -15), r, -0.7, 0.7, 8, Color(1, 0.6, 0.15, 0.85 - k * 0.22), 3.0)
		"envelope":
			# envelope pardo estufado, com notas escapando
			for passada in 2:
				_cont = passada == 0
				_ret(c, Rect2(mao + Vector2(-16, -30), Vector2(34, 24)), Color("c49a5c"))
			_cont = false
			_dp(c, PackedVector2Array([mao + Vector2(-16, -30), mao + Vector2(18, -30), mao + Vector2(1, -17)]), Color("a87f45"))
			_dr(c, Rect2(mao + Vector2(-10, -40), Vector2(20, 11)), Color("6fbf73"))
			_dr(c, Rect2(mao + Vector2(-4, -44), Vector2(20, 11)), Color("8fd694"))
			_dc(c, mao + Vector2(6, -39), 2.5, Color("3f8f46"))
		"carta":
			# a carta (versão 3): folha com linhas, uma riscada, e o lacre vermelho
			for passada in 2:
				_cont = passada == 0
				_ret(c, Rect2(mao + Vector2(-14, -50), Vector2(30, 40)), Color("f7f3e6"))
			_cont = false
			for k in 4:
				_dl(c, mao + Vector2(-9, -42 + k * 7), mao + Vector2(11 - (k % 2) * 6, -42 + k * 7), Color("6b7280"), 1.5)
			_dl(c, mao + Vector2(-11, -35), mao + Vector2(13, -34), Color("e5243b"), 2.0)
			_dc(c, mao + Vector2(9, -16), 4.5, Color("c8102e"))
		"pec":
			# a pasta da PEC erguida
			for passada in 2:
				_cont = passada == 0
				_ret(c, Rect2(mao + Vector2(-16, -46), Vector2(34, 42)), Color("f2c230"))
			_cont = false
			_dr(c, Rect2(mao + Vector2(-12, -54), Vector2(26, 26)), BRANCO)
			for k in 3:
				_dl(c, mao + Vector2(-8, -48 + k * 6), mao + Vector2(10, -48 + k * 6), Color("9aa0a6"), 1.5)
			_dc(c, mao + Vector2(8, -18), 6.0, Color("e5243b"))
		"celular":
			for passada in 2:
				_cont = passada == 0
				_ret(c, Rect2(mao + Vector2(-6, -26), Vector2(13, 24)), Color("1f1a24"))
			_cont = false
			_dr(c, Rect2(mao + Vector2(-4, -24), Vector2(9, 17)), Color("7ec8ff"))
		"microfone":
			for passada in 2:
				_cont = passada == 0
				_lin(c, mao, mao + Vector2(6, -22), Color("2a2230"), 5.0)
				_circ(c, mao + Vector2(7, -26), 6.5, Color("4a4a55"))
			_cont = false
			_dc(c, mao + Vector2(6, -28), 2.0, Color("9aa0a6"))
		"espeto":
			# o espeto vazio: a picanha acabou
			for passada in 2:
				_cont = passada == 0
				_lin(c, mao, mao + Vector2(10, -46), Color("9aa0a6"), 3.0)
			_cont = false
		"joinha":
			_cont = true
			_lin(c, mao, mao + Vector2(0, -16), Color("e8a587"), 6.0)
			_cont = false
			_dl(c, mao, mao + Vector2(0, -16), Color("e8a587"), 6.0)


static func _livro(c: CanvasItem, mao: Vector2) -> void:
	# a Constituição, verde e dourada
	for passada in 2:
		_cont = passada == 0
		_ret(c, Rect2(mao + Vector2(-16, -48), Vector2(32, 42)), Color("1f6f3a"))
	_cont = false
	_dr(c, Rect2(mao + Vector2(-12, -44), Vector2(24, 4)), Color("c9a227"))
	_dr(c, Rect2(mao + Vector2(-12, -14), Vector2(24, 4)), Color("c9a227"))
	_estrela(c, mao + Vector2(0, -27), 6.0, Color("c9a227"))
	_dr(c, Rect2(mao + Vector2(13, -46), Vector2(3, 38)), BRANCO)


static func _martelo(c: CanvasItem, mao: Vector2) -> void:
	for passada in 2:
		_cont = passada == 0
		_lin(c, mao, mao + Vector2(0, -46), Color("6b4226"), 6.0)
		_ret(c, Rect2(mao + Vector2(-22, -66), Vector2(44, 22)), Color("8a5a35"))
		_ret(c, Rect2(mao + Vector2(-26, -64), Vector2(6, 18)), Color("c9a227"))
		_ret(c, Rect2(mao + Vector2(20, -64), Vector2(6, 18)), Color("c9a227"))
	_cont = false


# ---------------------------------------------------------------- veículos e rastros

static func veiculo(c: CanvasItem, forma: String, t: int) -> void:
	match forma:
		"moto":
			for passada in 2:
				_cont = passada == 0
				for x in [-38.0, 42.0]:
					_circ(c, Vector2(x, -18), 18, Color("1f1a24"))
				_poli(c, PackedVector2Array([Vector2(-40, -30), Vector2(30, -40), Vector2(48, -26), Vector2(-20, -18)]), Color("1f9d55"))
				_ret(c, Rect2(-10, -48, 26, 12), Color("ffd23f"))
				_lin(c, Vector2(36, -36), Vector2(48, -66), Color("2a2230"), 4.0)
			_cont = false
			for x in [-38.0, 42.0]:
				_dc(c, Vector2(x, -18), 7, Color("9aa0a6"))
		"aviao":
			for passada in 2:
				_cont = passada == 0
				_poli(c, PackedVector2Array([Vector2(-150, -40), Vector2(60, -52), Vector2(96, -36), Vector2(60, -20), Vector2(-150, -24)]), Color("f2f4f8"))
				_poli(c, PackedVector2Array([Vector2(-30, -36), Vector2(10, -36), Vector2(-50, 10), Vector2(-74, 10)]), Color("d9dee8"))
				_poli(c, PackedVector2Array([Vector2(-150, -40), Vector2(-128, -40), Vector2(-150, -80), Vector2(-168, -80)]), Color("2a4f9a"))
			_cont = false
			_dr(c, Rect2(-150, -36, 210, 5), Color("2a4f9a"))
			for i in 8:
				_dr(c, Rect2(-110 + i * 20, -46, 7, 5), Color("7ec8ff"))
			for i in 4:
				_dl(c, Vector2(-170 - i * 14, -50 + i * 10), Vector2(-240 - i * 20, -50 + i * 10), Color(1, 1, 1, 0.6), 4.0)
		"bike":
			for x in [-34.0, 36.0]:
				_da(c, Vector2(x, -20), 18, 0, TAU, 20, PRETO, 4.0)
			_dl(c, Vector2(-34, -20), Vector2(0, -44), Color("b3122e"), 5.0)
			_dl(c, Vector2(0, -44), Vector2(36, -20), Color("b3122e"), 5.0)
			_dl(c, Vector2(-34, -20), Vector2(4, -20), Color("b3122e"), 5.0)
		"votos":
			for i in 6:
				var x := -60.0 - i * 26.0
				var y := -30.0 - (i % 3) * 40.0 + sin(t * 0.5 + i) * 6.0
				_dr(c, Rect2(x - 2, y - 2, 26, 18), PRETO)
				_dr(c, Rect2(x, y, 22, 14), BRANCO)
				_dl(c, Vector2(x + 4, y + 8), Vector2(x + 9, y + 12), Color("1f9d55"), 2.0)
				_dl(c, Vector2(x + 9, y + 12), Vector2(x + 18, y + 2), Color("1f9d55"), 2.0)
		"danca":
			for i in 3:
				var a := t * 0.4 + i * 2.1
				_nota(c, Vector2(cos(a) * 60, -120 + sin(a) * 50), Color("f2c230"))
		_:
			for i in 4:
				var y := -40.0 - i * 32.0
				_dl(c, Vector2(-60 - i * 10, y), Vector2(-120 - i * 18, y), Color(1, 1, 1, 0.6), 4.0)


static func _nota(c: CanvasItem, pos: Vector2, cor: Color) -> void:
	_dc(c, pos, 9, PRETO)
	_dc(c, pos, 7, cor)
	_dl(c, pos + Vector2(6, 0), pos + Vector2(6, -22), cor, 3.0)
	_dl(c, pos + Vector2(6, -22), pos + Vector2(16, -16), cor, 3.0)


# ---------------------------------------------------------------- projéteis (centro em 0,0, indo para +x)

static func projetil(c: CanvasItem, forma: String, s: float, t: int) -> void:
	var giro := sin(t * 0.3) * 0.15
	c.draw_set_transform(Vector2.ZERO, giro, Vector2(s, s))
	for passada in 2:
		_cont = passada == 0
		_projetil_forma(c, forma, t, giro, s)
	_cont = false
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func _projetil_forma(c: CanvasItem, forma: String, t: int, giro: float, s: float) -> void:
	match forma:
		"picanha":
			Arte.picanha(c, Vector2.ZERO, 0.0, 1.0, _cont)
		"cartao":
			_ret(c, Rect2(-26, -16, 52, 32), Color("1f6fc8"))
			if not _cont:
				_dr(c, Rect2(-26, -16, 52, 9), Color("ffd23f"))
				_dr(c, Rect2(-20, 2, 10, 8), Color("c9a227"))
				_dr(c, Rect2(-4, 6, 24, 3), BRANCO)
			_circ(c, Vector2(30, -14), 8, Color("ffd23f"))
		"seringa":
			_ret(c, Rect2(-24, -8, 36, 16), Color("e8f4ff"))
			_ret(c, Rect2(-34, -12, 8, 24), Color("9aa0a6"))
			_lin(c, Vector2(12, 0), Vector2(34, 0), Color("c9ced6"), 3.0)
			if not _cont:
				_dr(c, Rect2(-20, -5, 26, 10), Color("6fd36f"))
				for i in 4:
					_dl(c, Vector2(-18 + i * 7, -8), Vector2(-18 + i * 7, -3), Color("4a5060"), 2.0)
		"celular":
			_ret(c, Rect2(-14, -26, 28, 52), Color("1f1a24"))
			if not _cont:
				_dr(c, Rect2(-10, -21, 20, 40), Color("ff3b6b"))
				_dp(c, PackedVector2Array([Vector2(-4, -8), Vector2(6, 0), Vector2(-4, 8)]), BRANCO)
				_dc(c, Vector2(0, 22), 2.5, Color("4a4a55"))
		"bone":
			_poli(c, PackedVector2Array([Vector2(-22, 4), Vector2(-20, -10), Vector2(-8, -18), Vector2(10, -18), Vector2(20, -8), Vector2(22, 4)]), Color("d62828"))
			_ret(c, Rect2(10, 0, 28, 7), Color("b51f1f"))
			if not _cont:
				_dr(c, Rect2(-14, -8, 26, 4), BRANCO)
		"pilula":
			_circ(c, Vector2(-12, 0), 12, BRANCO)
			_circ(c, Vector2(12, 0), 12, Color("2f6fdb"))
			_ret(c, Rect2(-12, -12, 24, 24), BRANCO)
			if not _cont:
				_dr(c, Rect2(0, -12, 12, 24), Color("2f6fdb"))
				_dl(c, Vector2(-14, -6), Vector2(-4, -6), Color(1, 1, 1, 0.9), 3.0)
		"inquerito":
			_ret(c, Rect2(-22, -26, 44, 52), BRANCO)
			if not _cont:
				for i in 5:
					_dl(c, Vector2(-15, -16 + i * 8), Vector2(15, -16 + i * 8), Color("9aa0a6"), 2.0)
				_da(c, Vector2(8, 12), 11, 0, TAU, 18, Color("d62828"), 3.0)
		"grafico":
			_ret(c, Rect2(-28, -22, 56, 44), BRANCO)
			if not _cont:
				var alturas := [10.0, 18.0, 14.0, 28.0]
				for i in 4:
					_dr(c, Rect2(-20 + i * 11, 16 - alturas[i], 8, alturas[i]), [Color("2a9df4"), Color("f2c230"), Color("e63946"), Color("1f9d55")][i])
		"mandioca":
			_poli(c, PackedVector2Array([Vector2(-30, -6), Vector2(10, -11), Vector2(30, 0), Vector2(10, 11), Vector2(-30, 6)]), Color("8a5a35"))
			_circ(c, Vector2(-30, 0), 6, Color("f3e9d2"))
			if not _cont:
				_dl(c, Vector2(-20, -3), Vector2(16, -6), Color("a87448"), 3.0)
		"torta":
			_circ(c, Vector2(0, 6), 26, Color("c9c9c9"))
			_circ(c, Vector2(0, -6), 18, BRANCO)
			_circ(c, Vector2(-10, -2), 12, BRANCO)
			_circ(c, Vector2(10, -2), 12, BRANCO)
			_circ(c, Vector2(0, -22), 5, Color("d62828"))
		"vento":
			if not _cont:
				for i in 4:
					_da(c, Vector2(i * 4, 0), 10.0 + i * 8.0, t * 0.3 + i, t * 0.3 + i + PI * 1.4, 16, Color(0.75, 0.9, 1.0, 0.9 - i * 0.15), 5.0)
		"discurso", "comida", "rolha", "frasco", "onda", "selo", "documento", "bomba", "notificacao", "picanha_fogo", "carimbo_gigante", "pec", "oficio", "calendario", "rec", "mala", "voto", "pix", "curtida", "play", "revogado", "bombom", "carta", "tarifa", "tesoura", "aovivo", "corte":
			Arte.projetil(c, forma, t, _cont)
		_:
			_circ(c, Vector2.ZERO, 20, Color(1, 0.9, 0.3))
			if not _cont:
				_dc(c, Vector2.ZERO, 11, BRANCO)


# ---------------------------------------------------------------- cenário: Praça dos Três Poderes

## Céu do fim de tarde em faixas, com pontilhado (dithering) nas transições, na resolução real.
static func _textura_ceu() -> ImageTexture:
	if _ceu != null:
		return _ceu
	var w := 480
	var h := 270
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var cores := [Color("1a1238"), Color("2c1a55"), Color("4a2370"), Color("7a2a72"), Color("b03c66"), Color("dc5f52"), Color("f08c48"), Color("fbb85a"), Color("ffd98a")]
	var bayer := [0.0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125]
	var fim := 196.0
	for y in h:
		var f := clampf(y / fim, 0.0, 0.999) * float(cores.size() - 1)
		var i := int(f)
		var frac := f - i
		var transicao := clampf((frac - 0.55) / 0.45, 0.0, 1.0)
		for x in w:
			var limiar: float = bayer[(x % 4) + 4 * (y % 4)]
			var k := mini(i + 1, cores.size() - 1) if transicao > limiar else i
			img.set_pixel(x, y, cores[k])
	_ceu = ImageTexture.create_from_image(img)
	return _ceu


static func cenario(c: CanvasItem, t: float) -> void:
	cenario_fundo(c)
	cenario_vivo(c, t, 0.3)
	cenario_frente(c)


static func cenario_fundo(c: CanvasItem) -> void:
	c.draw_texture_rect(_textura_ceu(), Rect2(0, 0, 1280, 720), false)
	# sol retrô com faixas
	var sol := Vector2(1010, 395)
	_dc(c, sol, 96, Color("ffe08a"))
	_dc(c, sol, 80, Color("fff1c2"))
	for i in 5:
		_dr(c, Rect2(sol.x - 100, sol.y + 8 + i * 16, 200, 4 + i), Color("f08c48"))
	_cidade(c)
	_van(c, Vector2(1080, 498))


static func cenario_vivo(c: CanvasItem, t: float, agito: float) -> void:
	for i in 3:
		var x := fposmod(t * (6.0 + i * 3.0) + i * 470.0, 1600.0) - 160.0
		var y := 80.0 + i * 60.0
		for j in 4:
			_dc(c, Vector2(x + j * 30, y - (14 if j in [1, 2] else 0)), 24, Color("f7c7b0") if i < 2 else Color("ffe0c0"))
		_dr(c, Rect2(x - 20, y, 130, 16), Color("f7c7b0") if i < 2 else Color("ffe0c0"))
	_pato(c, Vector2(170, 470), t)
	_bandeiras(c, t)
	_plateia(c, t, agito)


static func cenario_frente(c: CanvasItem) -> void:
	_grade(c)
	_chao(c)


static func _cidade(c: CanvasItem) -> void:
	var longe := Color("3a2456")
	var perto := Color("2a1a40")
	for i in 7:
		var x := 20.0 + i * 64.0
		_dr(c, Rect2(x, 400 - i * 6, 48, 120 + i * 6), longe)
		_dr(c, Rect2(1212 - x, 400 - i * 6, 48, 120 + i * 6), longe)
		for j in 6:
			if (i + j) % 3 != 0:
				_dr(c, Rect2(x + 8, 412 - i * 6 + j * 16, 32, 5), Color("ffcf7a", 0.55))
				_dr(c, Rect2(1220 - x, 412 - i * 6 + j * 16, 32, 5), Color("ffcf7a", 0.55))
	# Congresso Nacional
	_dr(c, Rect2(598, 230, 36, 270), perto)
	_dr(c, Rect2(646, 230, 36, 270), perto)
	_dr(c, Rect2(598, 300, 84, 10), perto)
	for j in 14:
		_dr(c, Rect2(604, 240 + j * 18, 24, 5), Color("ffcf7a", 0.7 if j % 3 else 0.25))
		_dr(c, Rect2(652, 240 + j * 18, 24, 5), Color("ffcf7a", 0.7 if (j + 1) % 3 else 0.25))
	_dr(c, Rect2(400, 470, 480, 28), perto)
	var cupula := PackedVector2Array()
	for i in 17:
		var a := lerpf(PI, TAU, i / 16.0)
		cupula.append(Vector2(500, 470) + Vector2(cos(a) * 66, sin(a) * 52))
	_dp(c, cupula, perto)
	_da(c, Vector2(500, 470), 60, PI * 1.15, PI * 1.45, 8, Color("f08c48", 0.6), 4.0)
	var cuia := PackedVector2Array([Vector2(696, 430), Vector2(846, 430)])
	for i in 17:
		var a := lerpf(0.0, PI, i / 16.0)
		cuia.append(Vector2(771, 432) + Vector2(cos(a) * 75, sin(a) * 40))
	_dp(c, cuia, perto)
	_dl(c, Vector2(700, 431), Vector2(842, 431), Color("f08c48", 0.8), 3.0)
	# gramado
	_dr(c, Rect2(0, 496, 1280, 40), Color("2f5a2e"))
	for i in 40:
		_dr(c, Rect2(i * 32 + (i % 3) * 5, 498 + (i % 2) * 6, 6, 4), Color("4a7d3a"))


static func _pato(c: CanvasItem, base: Vector2, t: float) -> void:
	# o famoso pato amarelo inflável das manifestações
	var bal := sin(t * 1.3) * 4.0
	var b := base + Vector2(0, bal)
	for passada in 2:
		_cont = passada == 0
		_circ(c, b + Vector2(0, -60), 70, Color("ffd23f"))
		_circ(c, b + Vector2(40, -150), 48, Color("ffd23f"))
		_poli(c, PackedVector2Array([b + Vector2(78, -158), b + Vector2(132, -148), b + Vector2(80, -134)]), Color("f28c28"))
	_cont = false
	_dc(c, b + Vector2(-10, -40), 46, Color("f2b81f"))
	_dc(c, b + Vector2(8, -76), 40, Color("ffd23f"))
	_dc(c, b + Vector2(56, -160), 9, BRANCO)
	_dc(c, b + Vector2(59, -160), 5, PRETO)
	_dc(c, b + Vector2(28, -170), 12, Color("fff3b0"))
	_dl(c, b + Vector2(80, -146), b + Vector2(128, -148), Color("c96a18"), 3.0)


static func _van(c: CanvasItem, base: Vector2) -> void:
	for passada in 2:
		_cont = passada == 0
		_ret(c, Rect2(base + Vector2(-110, -96), Vector2(200, 80)), Color("e8ecf2"))
		_ret(c, Rect2(base + Vector2(60, -78), Vector2(48, 62)), Color("e8ecf2"))
		_circ(c, base + Vector2(-70, -12), 18, Color("1f1a24"))
		_circ(c, base + Vector2(60, -12), 18, Color("1f1a24"))
		_lin(c, base + Vector2(-40, -96), base + Vector2(-40, -130), Color("9aa0a6"), 5.0)
	_cont = false
	_dr(c, Rect2(base + Vector2(-110, -60), Vector2(218, 12)), Color("d62828"))
	_dr(c, Rect2(base + Vector2(72, -72), Vector2(30, 24)), Color("7ec8ff"))
	_da(c, base + Vector2(-40, -140), 26, PI * 0.1, PI * 0.9, 12, Color("c9ced6"), 8.0)
	texto(c, base + Vector2(-12, -70), "TV TRETA", 30, Color("d62828"), BRANCO, 0)


static func _bandeiras(c: CanvasItem, t: float) -> void:
	for x in [330.0, 950.0]:
		_dl(c, Vector2(x, 520), Vector2(x, 330), PRETO, 6.0)
		_dl(c, Vector2(x, 520), Vector2(x, 330), Color("c9ced6"), 3.0)
		var pts := PackedVector2Array()
		var pts2 := PackedVector2Array()
		for i in 9:
			var px: float = x + i * 12.0
			var onda := sin(t * 5.0 - i * 0.7) * 6.0 * (i / 8.0)
			pts.append(Vector2(px, 336 + onda))
			pts2.append(Vector2(px, 392 + onda))
		pts2.reverse()
		var bandeira := pts + pts2
		_dp(c, bandeira, Color("1f9d55"))
		var losango := PackedVector2Array([Vector2(x + 48, 342 + sin(t * 5.0 - 3.0) * 3.0), Vector2(x + 90, 364), Vector2(x + 48, 386 + sin(t * 5.0 - 3.0) * 3.0), Vector2(x + 8, 364)])
		_dp(c, losango, Color("ffd23f"))
		_dc(c, Vector2(x + 48, 364 + sin(t * 5.0 - 3.0) * 3.0), 12, Color("2a4fa8"))


const CARTAZES := ["FAZ O L", "TÁ OK?", "MITO!", "INELEGÍVEL", "PICANHA JÁ", "CADÊ O PIX?", "DOBRA A META", "ABESTADO", "#FORA TODOS", "EU AVISEI"]


static func _plateia(c: CanvasItem, t: float, agito := 0.3) -> void:
	var camisas := [Color("ffd23f"), Color("1f9d55"), Color("d62828"), Color("f2f2f2"), Color("2a4fa8"), Color("ff7a2f")]
	var peles := [Color("f0c8a0"), Color("c88a5c"), Color("8a5a3a"), Color("e3a983"), Color("5c3a24")]
	var cabelos := [Color("2a1c14"), Color("6b3f22"), Color("c9c9c9"), Color("1a1a1a"), Color("a0522d")]
	for i in 13:
		var x := 60.0 + i * 96.0 + (i % 2) * 14.0
		var pulo := absf(sin(t * (4.0 + (i % 3)) + i * 1.7)) * (6.0 + 16.0 * agito)
		var base := Vector2(x, 548 - pulo)
		var camisa: Color = camisas[(i * 7) % camisas.size()]
		var pele: Color = peles[(i * 3) % peles.size()]
		var cabelo: Color = cabelos[(i * 5) % cabelos.size()]
		var braco := sin(t * 6.0 + i) > 0.0
		var tem_cartaz := i % 3 == 1
		for passada in 2:
			_cont = passada == 0
			_ret(c, Rect2(base + Vector2(-22, -66), Vector2(44, 70)), camisa)
			_circ(c, base + Vector2(0, -88), 20, pele)
			if tem_cartaz:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-26, -130), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(26, -130), pele, 9.0)
			elif braco:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-34, -118), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(34, -118), pele, 9.0)
			else:
				_lin(c, base + Vector2(-20, -60), base + Vector2(-30, -26), pele, 9.0)
				_lin(c, base + Vector2(20, -60), base + Vector2(30, -26), pele, 9.0)
		_cont = false
		_da(c, base + Vector2(0, -90), 19, PI * 1.05, PI * 1.95, 12, cabelo, 12.0)
		_dc(c, base + Vector2(-6, -88), 3, PRETO)
		_dc(c, base + Vector2(8, -88), 3, PRETO)
		_da(c, base + Vector2(1, -80), 6, PI * 0.1, PI * 0.9, 6, PRETO, 2.5)
		_dr(c, Rect2(base + Vector2(-22, -66), Vector2(10, 70)), camisa.darkened(0.25))
		if tem_cartaz:
			var txt: String = CARTAZES[(i / 3 + int(t / 6.0)) % CARTAZES.size()]
			var largura := maxf(110.0, txt.length() * 22.0 + 20.0)
			var r := Rect2(base + Vector2(-largura / 2.0, -178), Vector2(largura, 52))
			_dr(c, r.grow(3), PRETO)
			_dr(c, r, BRANCO)
			texto(c, r.get_center() + Vector2(0, 11), txt, 22, Color("d62828") if i % 2 else Color("1f6f3a"), BRANCO, 0)


static func _grade(c: CanvasItem) -> void:
	# grade de contenção na frente da plateia
	var cor := Color("8a90a0")
	_dr(c, Rect2(0, 508, 1280, 7), PRETO)
	_dr(c, Rect2(0, 509, 1280, 4), cor)
	_dr(c, Rect2(0, 552, 1280, 7), PRETO)
	_dr(c, Rect2(0, 553, 1280, 4), cor.darkened(0.2))
	for i in 54:
		var x := i * 24.0
		_dr(c, Rect2(x, 511, 5, 46), PRETO)
		_dr(c, Rect2(x + 1, 512, 3, 44), cor)


static func _chao(c: CanvasItem) -> void:
	_dr(c, Rect2(0, 560, 1280, 160), Color("c2ad8a"))
	_dr(c, Rect2(0, 560, 1280, 10), Color("8a775e"))
	for i in 12:
		var y := 570.0 + pow(i / 11.0, 1.6) * 150.0
		_dl(c, Vector2(0, y), Vector2(1280, y), Color("ad9878"), 3.0)
	for i in 21:
		_dl(c, Vector2(640 + (i - 10) * 70, 570), Vector2(640 + (i - 10) * 160, 720), Color("ad9878"), 3.0)
	# rachaduras e manchas
	for i in 9:
		var x := 70.0 + i * 140.0
		_dl(c, Vector2(x, 640 + (i % 3) * 20), Vector2(x + 26, 652 + (i % 3) * 20), Color("8a775e"), 3.0)
		_dl(c, Vector2(x + 26, 652 + (i % 3) * 20), Vector2(x + 40, 646 + (i % 3) * 20), Color("8a775e"), 3.0)


# ---------------------------------------------------------------- texto pixelado

static func fonte() -> Font:
	if _fonte == null:
		var f := load("res://fontes/PressStart2P-Regular.ttf") as FontFile
		if f != null:
			f.antialiasing = TextServer.FONT_ANTIALIASING_NONE
			f.hinting = TextServer.HINTING_NONE
			f.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
			_fonte = f
		else:
			_fonte = ThemeDB.fallback_font
	return _fonte


## Tamanho em pixels reais (múltiplos de 8, que é a grade da fonte).
static func tamanho_real(t: int) -> int:
	return maxi(8, int(round(t * ESCALA / 8.0)) * 8)


## alinhamento: 0 = centro, 1 = esquerda, 2 = direita. pos em coordenadas do jogo (1280x720).
static func _texto_px(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, contorno: Color, borda: int, alinhamento: int) -> void:
	if _lote != null:
		_lote.despejar(c)
	var f := fonte()
	var tam := tamanho_real(tamanho)
	# a fonte não tem o Í maiúsculo (sai minúsculo): no estilo fliperama, fica sem acento
	txt = txt.replace("Í", "I")
	var inv := 1.0 / ESCALA
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2(inv, inv))
	var w := f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam).x
	var p := pos * ESCALA
	if alinhamento == 0:
		p.x -= w / 2.0
	elif alinhamento == 2:
		p.x -= w
	p = p.floor()
	if borda > 0:
		var b := maxi(2, int(round(borda * ESCALA)))
		c.draw_string_outline(f, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, b, contorno)
	if contorno.a > 0.0 and borda > 0:
		c.draw_string(f, p + Vector2(1, 1), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, contorno)
	c.draw_string(f, p, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, tam, cor)
	c.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func texto(c: CanvasItem, centro: Vector2, txt: String, tamanho: int, cor: Color, contorno: Color = PRETO, borda: int = 6) -> void:
	if adiar_textos:
		_fila_textos.append([centro, txt, tamanho, cor, contorno, borda])
		return
	_texto_px(c, centro, txt, tamanho, cor, contorno, borda, 0)


static func textos_pendentes(c: CanvasItem) -> void:
	adiar_textos = false
	for t in _fila_textos:
		_texto_px(c, t[0], t[1], t[2], t[3], t[4], t[5], 0)
	_fila_textos.clear()


static func texto_esq(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, borda: int = 0) -> void:
	_texto_px(c, pos, txt, tamanho, cor, PRETO, borda, 1)


static func texto_dir(c: CanvasItem, pos: Vector2, txt: String, tamanho: int, cor: Color, borda: int = 0) -> void:
	_texto_px(c, pos, txt, tamanho, cor, PRETO, borda, 2)
