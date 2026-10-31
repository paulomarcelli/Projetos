extends Node
## Áudio da interface e, nas próximas fases, música e efeitos de luta.
## Os sons de interface são sintetizados em tempo de execução: nenhum download extra no
## carregamento inicial da Web e nenhum asset de terceiros a licenciar.
## No navegador o áudio só começa depois do primeiro gesto do jogador (regra de autoplay).

const SAMPLE_RATE := 22050
const POOL_SIZE := 6

var _streams: Dictionary = {}
var _pool: Array[AudioStreamPlayer] = []
var _next := 0


func _ready() -> void:
	for i in POOL_SIZE:
		var p := AudioStreamPlayer.new()
		p.bus = &"SFX"
		add_child(p)
		_pool.append(p)
	_streams["hover"] = _tone(880.0, 0.04, 0.18)
	_streams["click"] = _tone(660.0, 0.07, 0.35, 990.0)
	_streams["back"] = _tone(520.0, 0.08, 0.3, 330.0)
	_streams["denied"] = _tone(180.0, 0.12, 0.35)
	# luta: impactos com ruído (estalo) + tom grave descendo (peso)
	_streams["hit_light"] = _impact(0.07, 0.5, 260.0)
	_streams["hit_heavy"] = _impact(0.16, 0.8, 140.0)
	_streams["block"] = _tone(1200.0, 0.05, 0.3, 700.0)
	_streams["ko"] = _impact(0.45, 0.9, 90.0)
	_streams["round"] = _tone(440.0, 0.22, 0.35, 880.0)


func play_ui(name: String) -> void:
	var stream: AudioStream = _streams.get(name)
	if stream == null:
		push_warning("Som de interface desconhecido: %s" % name)
		return
	var p := _pool[_next]
	_next = (_next + 1) % _pool.size()
	p.stream = stream
	p.play()


func has_sound(name: String) -> bool:
	return _streams.has(name)


## Impacto: ruído branco com decaimento rápido somado a um tom que cai de frequência.
func _impact(duration: float, volume: float, freq: float) -> AudioStreamWAV:
	var frames := int(SAMPLE_RATE * duration)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(freq)  # sempre o mesmo som
	var phase := 0.0
	for i in frames:
		var t := float(i) / frames
		phase = fmod(phase + lerpf(freq, freq * 0.4, t) / SAMPLE_RATE, 1.0)
		var noise := rng.randf_range(-1.0, 1.0) * pow(1.0 - t, 6.0)
		var body := sin(phase * TAU) * pow(1.0 - t, 2.0)
		var sample := (noise * 0.6 + body * 0.7) * volume
		data.encode_s16(i * 2, int(clampf(sample, -1.0, 1.0) * 32767.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.data = data
	return wav


## Bipe curto (onda triangular) com envelope de ataque/decaimento e deslizamento de frequência.
func _tone(freq: float, duration: float, volume: float, end_freq := -1.0) -> AudioStreamWAV:
	var frames := int(SAMPLE_RATE * duration)
	var data := PackedByteArray()
	data.resize(frames * 2)
	var phase := 0.0
	var target := end_freq if end_freq > 0.0 else freq
	for i in frames:
		var t := float(i) / frames
		var f := lerpf(freq, target, t)
		phase = fmod(phase + f / SAMPLE_RATE, 1.0)
		var tri := 4.0 * absf(phase - 0.5) - 1.0
		var env := minf(t * 20.0, 1.0) * pow(1.0 - t, 2.0)
		data.encode_s16(i * 2, int(clampf(tri * env * volume, -1.0, 1.0) * 32767.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.stereo = false
	wav.data = data
	return wav
