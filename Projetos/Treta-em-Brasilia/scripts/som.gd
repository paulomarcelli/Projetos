class_name Som
extends Node
## Toca os efeitos (audio/sfx), as vozes dos lutadores (audio/vozes/<id>) e a música (audio/musica),
## gerados por ferramentas/sons.py, e os áudios de meme (audio/memes/<id>), as trilhas das Ultimates
## (audio/ultimate), a torcida (audio/cenario) e o Dilera (audio/dilera), convertidos por
## ferramentas/memes_audio.py. Enquanto um meme, uma trilha ou a torcida toca, a música de fundo abaixa.
## Os sons carregam sob demanda e ficam em cache.

const CANAIS := 10
## volume de cada efeito (dB) para equilibrar a mixagem
const AJUSTE := {"sem_energia": -10.0, "recarga": -12.0, "menu_mover": -6.0, "menu_ok": -4.0, "menu_voltar": -4.0,
	"pulo": -7.0, "projetil": -5.0, "moto": -4.0, "microfone": -4.0, "discurso": -4.0, "ko": 3.0, "explosao": 2.0, "multidao": -6.0}

static var _eu: Som
var _cache := {}
var _canais: Array[AudioStreamPlayer] = []
var _proximo := 0
var _musica: AudioStreamPlayer
var _faixa := ""
var _meme_p: AudioStreamPlayer
var _trilha_p: AudioStreamPlayer
var _amb_p: AudioStreamPlayer
var _abafado := false


## O nó de som é criado na primeira vez que alguém toca algo (main.gd chama Som.iniciar).
static func iniciar(raiz: Node) -> void:
	if _eu == null:
		_eu = Som.new()
		raiz.add_child.call_deferred(_eu)  # a raiz ainda está montando os filhos


static func sfx(nome: String, variacao := 0.06, ganho_db := 0.0) -> void:
	if _eu != null:
		_eu._sfx(nome, variacao, ganho_db)


static func voz(id: String, nome: String) -> void:
	if _eu != null:
		_eu._voz(id, nome)


static func musica(nome: String) -> void:
	if _eu != null:
		_eu._musica_tocar(nome)


static func atualizar_volume() -> void:
	if _eu != null:
		_eu._atualizar_volume()


static func abafar(sim: bool) -> void:
	if _eu != null:
		_eu._abafar(sim)


## Meme falado (um por vez: o novo corta o anterior).
static func meme(caminho: String) -> void:
	if _eu != null:
		_eu._tocar_em(_eu._meme_p, caminho, Config.efeitos, 1.0)


## Quantas trilhas já foram pedidas e a última (os testes conferem quando a trilha toca).
static var trilhas_pedidas := 0
static var ultima_trilha := ""


## Trilha de Ultimate ou de SUPER (por cima da música, que abaixa).
static func trilha(caminho: String) -> void:
	trilhas_pedidas += 1
	ultima_trilha = caminho
	if _eu != null:
		_eu._tocar_em(_eu._trilha_p, caminho, maxf(Config.musica, Config.efeitos * 0.8), 0.0)


static func meme_tocando() -> bool:
	return _eu != null and _eu._meme_p != null and _eu._meme_p.playing


static func trilha_tocando() -> bool:
	return _eu != null and _eu._trilha_p != null and _eu._trilha_p.playing


## Para a trilha; com fade (segundos), abaixa até sumir antes de parar.
static func trilha_parar(fade := 0.0) -> void:
	if _eu == null or _eu._trilha_p == null or not _eu._trilha_p.playing:
		return
	if fade <= 0.0:
		_eu._trilha_p.stop()
		_eu._volume_musica()
		return
	var a := _eu._trilha_p
	var tw := _eu.create_tween()
	tw.tween_property(a, "volume_db", a.volume_db - 30.0, fade)
	tw.tween_callback(func() -> void:
		a.stop()
		_eu._volume_musica())


## Som de ambiente (a torcida cantando).
static func ambiente(caminho: String) -> void:
	if _eu != null:
		_eu._tocar_em(_eu._amb_p, caminho, Config.efeitos, -2.0)


static func existe(caminho: String) -> bool:
	return ResourceLoader.exists(caminho)


var _fila_carga: Array[String] = []


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	# carrega os sons aos poucos (um por quadro) já no menu, para não engasgar na primeira vez na luta
	var pastas := ["res://audio/sfx"]
	for d in DirAccess.get_directories_at("res://audio/vozes"):
		pastas.append("res://audio/vozes/" + d)
	for pasta in pastas:
		for f in DirAccess.get_files_at(pasta):
			f = f.trim_suffix(".import").trim_suffix(".remap")
			if f.ends_with(".ogg") and not _fila_carga.has(pasta + "/" + f):
				_fila_carga.append(pasta + "/" + f)
	for i in CANAIS:
		var a := AudioStreamPlayer.new()
		add_child(a)
		_canais.append(a)
	_musica = AudioStreamPlayer.new()
	add_child(_musica)
	for k in 3:
		var a := AudioStreamPlayer.new()
		add_child(a)
		a.finished.connect(_volume_musica)
		if k == 0:
			_meme_p = a
		elif k == 1:
			_trilha_p = a
		else:
			_amb_p = a
	if _faixa != "":
		var f := _faixa
		_faixa = ""
		_musica_tocar(f)


func _process(_d: float) -> void:
	if not _fila_carga.is_empty():
		_carregar(_fila_carga.pop_back())


func _carregar(caminho: String) -> AudioStream:
	if not _cache.has(caminho):
		_cache[caminho] = load(caminho) if ResourceLoader.exists(caminho) else null
	return _cache[caminho]


func _db(vol: float) -> float:
	return linear_to_db(maxf(vol, 0.0001))


## Efeito sonoro. altura varia um pouco para não cansar o ouvido.
func _sfx(nome: String, variacao := 0.06, ganho_db := 0.0) -> void:
	if Config.efeitos <= 0.01:
		return
	var s := _carregar("res://audio/sfx/%s.ogg" % nome)
	if s == null:
		return
	_tocar(s, ganho_db + AJUSTE.get(nome, 0.0), 1.0 + randf_range(-variacao, variacao))


## Voz caricata do lutador (ataque1, ataque2, forte, dor, dor2, especial, super, provocar, vitoria, derrota, agarra).
func _voz(id: String, nome: String) -> void:
	if Config.efeitos <= 0.01:
		return
	var s := _carregar("res://audio/vozes/%s/%s.ogg" % [id, nome])
	if s == null:
		return
	_tocar(s, -1.0, 1.0 + randf_range(-0.04, 0.04))


func _tocar(s: AudioStream, ganho_db: float, altura: float) -> void:
	if _canais.is_empty():
		return
	# usa o canal livre; se todos estão ocupados, o mais antigo
	var a: AudioStreamPlayer = null
	for k in CANAIS:
		var c := _canais[(_proximo + k) % CANAIS]
		if not c.playing:
			a = c
			break
	if a == null:
		a = _canais[_proximo]
	_proximo = (_proximo + 1) % CANAIS
	a.stream = s
	a.volume_db = _db(Config.efeitos) + ganho_db
	a.pitch_scale = altura
	a.play()


## Troca a música (em loop). "" para parar.
func _musica_tocar(nome: String) -> void:
	if _musica == null:
		_faixa = nome  # toca quando o nó entrar na árvore
		return
	if nome == _faixa and _musica.playing:
		return
	_faixa = nome
	if nome == "":
		_musica.stop()
		return
	var s := _carregar("res://audio/musica/%s.ogg" % nome)
	if s == null:
		_musica.stop()
		return
	if s is AudioStreamOggVorbis:
		(s as AudioStreamOggVorbis).loop = true
	_musica.stream = s
	_volume_musica()
	_musica.play()


func _atualizar_volume() -> void:
	if _musica == null:
		return
	_volume_musica()
	if Config.musica <= 0.01:
		_musica.stream_paused = true
	else:
		_musica.stream_paused = false


## Abaixa a música (cinemática do ultimate) e volta depois.
func _abafar(sim: bool) -> void:
	_abafado = sim
	_volume_musica()


func _tocar_em(a: AudioStreamPlayer, caminho: String, vol: float, ganho_db: float) -> void:
	if a == null or vol <= 0.01:
		return
	var s := _carregar(caminho)
	if s == null:
		return
	a.stream = s
	a.volume_db = _db(vol) + ganho_db
	a.play()
	_volume_musica()


## A música de fundo abaixa enquanto tem trilha, meme ou torcida tocando (e na cinemática).
func _volume_musica() -> void:
	if _musica == null:
		return
	var corte := 6.0
	if _trilha_p != null and _trilha_p.playing:
		corte = 30.0
	elif _abafado:
		corte = 16.0
	elif (_meme_p != null and _meme_p.playing) or (_amb_p != null and _amb_p.playing):
		corte = 13.0
	_musica.volume_db = _db(Config.musica) - corte
