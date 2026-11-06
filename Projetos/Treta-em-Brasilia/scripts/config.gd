class_name Config
## Configurações do jogador, salvas em user://config.cfg (no navegador, ficam no armazenamento do site).
## Tudo estático: funciona em qualquer lugar (inclusive nos testes, sem autoload).

const ARQUIVO := "user://config.cfg"

static var musica := 0.7       # 0 a 1
static var efeitos := 0.85     # 0 a 1
static var dificuldade := 1    # 0 fácil, 1 normal, 2 difícil
static var tremor := true      # tremor de tela nos impactos
static var toque := 0          # 0 automático, 1 sempre, 2 nunca
static var tempo_round := 99   # 60, 99 ou 0 (sem tempo)

const DIFICULDADES := ["FÁCIL", "NORMAL", "DIFÍCIL"]
const NIVEL_CPU := [0.32, 0.58, 0.85]


static func nivel_cpu() -> float:
	return NIVEL_CPU[clampi(dificuldade, 0, 2)]


static func carregar() -> void:
	var c := ConfigFile.new()
	if c.load(ARQUIVO) != OK:
		return
	musica = c.get_value("som", "musica", musica)
	efeitos = c.get_value("som", "efeitos", efeitos)
	dificuldade = c.get_value("jogo", "dificuldade", dificuldade)
	tremor = c.get_value("jogo", "tremor", tremor)
	toque = c.get_value("jogo", "toque", toque)
	tempo_round = c.get_value("jogo", "tempo_round", tempo_round)


static func salvar() -> void:
	var c := ConfigFile.new()
	c.set_value("som", "musica", musica)
	c.set_value("som", "efeitos", efeitos)
	c.set_value("jogo", "dificuldade", dificuldade)
	c.set_value("jogo", "tremor", tremor)
	c.set_value("jogo", "toque", toque)
	c.set_value("jogo", "tempo_round", tempo_round)
	c.save(ARQUIVO)
