class_name Poses
## Poses das habilidades e a dança do Trump. Cada função mexe no dicionário de pose (mãos, pés,
## quadril, inclinação do tronco, giro e deslocamento da cabeça, expressão e objetos na mão).
## t = quadro do golpe; ini/ativo/rec = tempos do golpe. Antes de ini é a preparação (antecipação).


static func _k(t: int, ini: int, ativo: int, rec: int) -> float:
	if t < ini:
		return -0.4 * sin(PI * 0.5 * t / maxf(1.0, float(ini)))
	if t < ini + ativo:
		return 1.0
	return clampf(1.0 - float(t - ini - ativo) / maxf(1.0, float(rec)), 0.0, 1.0)


static func habilidade(d: Dictionary, nome: String, t: int, ini: int, ativo: int, rec: int, p: Dictionary) -> Dictionary:
	var k := _k(t, ini, ativo, rec)
	var kp := maxf(k, 0.0)
	var prep := t < ini
	var id: String = d.get("id", "")
	p["expr"] = "esforco" if prep else "grito"
	match nome:
		"discurso":
			# braço erguido de palanque, depois os dois braços abertos soltando a onda
			if prep:
				p["mao_f"] = Vector2(30, -190)
				p["mao_t"] = Vector2(-10, -150)
				p["inclina"] = -0.12
				p["cabeca_giro"] = -0.2
			else:
				p["mao_f"] = Vector2(96, -150)
				p["mao_t"] = Vector2(70, -176)
				p["inclina"] = 0.14 * kp
				p["boca"] = "grito"
				p["cabeca_giro"] = 0.12
		"picanha_gigante":
			# ergue a picanha por trás da cabeça e desce num arco enorme
			var a := lerpf(-2.4, 0.5, kp) if not prep else lerpf(-1.6, -2.4, -k / 0.4)
			p["mao_f"] = Vector2(10, -150) + Vector2(cos(a), sin(a)) * 70.0
			p["mao_t"] = p["mao_f"] + Vector2(-16, 10)
			p["prop"] = "picanha_gigante"
			p["prop_ang"] = a + PI * 0.5
			p["inclina"] = -0.2 if prep else 0.3 * kp
			p["pe_f"] = Vector2(36, 0)
			p["pe_t"] = Vector2(-30, 0)
			if kp >= 1.0:
				p["rastro"] = [p["mao_f"] + Vector2(cos(a), sin(a)) * 80.0, Vector2(-20, -260)]
		"gancho":
			p["mao_f"] = Vector2(34, -128).lerp(Vector2(46, -238), kp) + Vector2(0, -k * 20.0 if prep else 0.0)
			p["punho_grande"] = true
			p["boca"] = "grito"
			p["prop"] = d.get("habilidades", {}).get("cima", {}).get("prop", "")
			if prep:
				_agacha(p)
			else:
				p["rastro"] = [p["mao_f"], Vector2(40, -110)]
		"arremesso", "arremesso_baixo":
			var baixo := nome == "arremesso_baixo"
			if prep:
				p["mao_f"] = Vector2(-30, -150 if not baixo else -80)
				p["mao_t"] = Vector2(20, -120)
				p["inclina"] = -0.18
				if baixo:
					_agacha(p)
			else:
				p["mao_f"] = Vector2(90, -136 if not baixo else -60)
				p["mao_t"] = Vector2(-20, -116)
				p["inclina"] = 0.16 * kp
				if baixo:
					_agacha(p)
				if kp >= 1.0:
					p["rastro"] = [p["mao_f"], Vector2(-20, -160 if not baixo else -90)]
			p["boca"] = "grito"
		"churrasco":
			# monta a churrasqueira e vira os espetos
			p["churrasqueira"] = true
			var vira := sin(t * 0.5)
			p["mao_f"] = Vector2(80 + vira * 10, -110)
			p["mao_t"] = Vector2(60 - vira * 10, -104)
			p["prop"] = "espeto_cheio"
			p["inclina"] = 0.12
			p["expr"] = "feliz" if (t / 12) % 2 == 0 else "grito"
			p["cabeca_giro"] = 0.1 + vira * 0.05
		"metralhadora":
			# segura a metralhadora na altura do peito; o corpo treme com o recuo de cada tiro
			p["prop"] = "metralhadora"
			var recuo := 0.0 if prep or (t - ini) % 3 != 0 else 1.0
			p["mao_f"] = Vector2(58 - recuo * 6.0, -128)
			p["mao_t"] = Vector2(30 - recuo * 6.0, -120)
			p["inclina"] = -0.06 - recuo * 0.05
			p["pe_f"] = Vector2(36, 0)
			p["pe_t"] = Vector2(-34, 0)
			p["quadril"] = -62.0
			p["cabeca_desl"] = Vector2(-recuo * 3.0, 0)
			p["expr"] = "esforco" if prep else "grito"
			p["chapeu"] = "boina"
		"fuzil":
			p["prop"] = "fuzil"
			p["mao_f"] = Vector2(64, -138)
			p["mao_t"] = Vector2(40, -128)
			p["inclina"] = -0.04 if prep else -0.04 - 0.06 * absf(sin(t * 1.4))
			p["pe_t"] = Vector2(-30, 0)
			p["expr"] = "esforco"
			p["cabeca_giro"] = 0.06
		"moto":
			p["veiculo"] = "moto"
			p["agachado"] = true
			p["quadril"] = -62.0
			p["pe_f"] = Vector2(30, -26)
			p["pe_t"] = Vector2(-10, -26)
			p["mao_f"] = Vector2(56, -112)
			p["mao_t"] = Vector2(44, -108)
			p["inclina"] = 0.2
			p["chapeu"] = "capacete"
			p["boca"] = "grito"
		"capitao":
			# continência, depois uma sequência militar (socos e chutes alternados) e a bota final
			if prep:
				p["mao_f"] = Vector2(22, -176)
				p["inclina"] = -0.05
				p["chapeu"] = "boina"
				p["expr"] = "esforco"
			else:
				var fase := (t - ini) / 8
				var sub := float((t - ini) % 8) / 8.0
				p["chapeu"] = "boina"
				p["punho_grande"] = true
				match fase % 3:
					0:
						p["mao_f"] = Vector2(40, -130).lerp(Vector2(108, -140), sub)
					1:
						p["mao_t"] = Vector2(30, -120).lerp(Vector2(104, -126), sub)
						p["mao_f"] = Vector2(20, -112)
					2:
						p["pe_f"] = Vector2(20, 0).lerp(Vector2(116, -120), sub)
						p["inclina"] = -0.2
				p["rastro"] = [p["mao_f"], Vector2(30, -120)]
		"carimbo", "carimbo_chao":
			p["prop"] = "carimbo"
			if nome == "carimbo":
				p["mao_f"] = Vector2(40, -150).lerp(Vector2(104, -126), kp)
				p["inclina"] = 0.3 * kp
			else:
				p["mao_f"] = Vector2(40, -200).lerp(Vector2(80, -30), kp)
				p["inclina"] = 0.35 * kp
				if kp > 0.0:
					_agacha(p)
			p["expr"] = "esforco" if prep else "neutro"
		"canetada":
			p["prop"] = "caneta"
			p["mao_f"] = Vector2(40, -120).lerp(Vector2(60, -220), kp) if t < ini + 4 else Vector2(80, -150)
			p["mao_t"] = Vector2(10, -110)
			p["prop_t"] = "livro"
			p["inclina"] = -0.08 + 0.1 * kp
			p["expr"] = "neutro" if prep else "esforco"
		"martelada":
			var a2 := lerpf(-2.2, 0.3, kp) if not prep else -2.2
			p["mao_f"] = Vector2(14, -150) + Vector2(cos(a2), sin(a2)) * 60.0
			p["prop"] = "martelo"
			p["inclina"] = -0.15 if prep else 0.25 * kp
			p["expr"] = "esforco" if prep else "grito"
		"microfone":
			p["prop"] = "microfone"
			p["mao_f"] = Vector2(40, -170)
			p["mao_t"] = Vector2(70, -160) if not prep else Vector2(-10, -130)
			p["inclina"] = -0.1 if prep else 0.12
			p["boca"] = "grito"
			p["cabeca_giro"] = -0.15 if prep else 0.1
		"microfone_avanco":
			p["prop"] = "microfone"
			p["mao_f"] = Vector2(80, -150)
			p["mao_t"] = Vector2(-30, -120)
			p["inclina"] = 0.3
			p["pe_f"] = Vector2(30 + sin(t * 0.8) * 16, -absf(sin(t * 0.8)) * 10)
			p["pe_t"] = Vector2(-30 - sin(t * 0.8) * 16, -absf(cos(t * 0.8)) * 10)
		"cabelo":
			# o topete cresce e chicoteia para a frente
			p["cabelo_estica"] = kp
			p["inclina"] = -0.1 if prep else 0.22 * kp
			p["cabeca_giro"] = -0.15 if prep else 0.25 * kp
			p["mao_f"] = Vector2(10, -128)
			p["mao_t"] = Vector2(-20, -118)
			p["expr"] = "esforco" if prep else "grito"
		"danca":
			danca(p, t, 1.0)
		"chamar":
			# aponta para o céu e chama o caça
			p["mao_f"] = Vector2(30, -150).lerp(Vector2(60, -250), clampf(t / 10.0, 0.0, 1.0))
			p["mao_t"] = Vector2(-10, -120)
			p["inclina"] = -0.12
			p["cabeca_giro"] = -0.3
			p["boca"] = "grito"
		"debate":
			# gesticula sem parar, balões de fala saindo
			var g := sin(t * 0.7)
			p["mao_f"] = Vector2(70 + g * 20, -150 + cos(t * 0.7) * 20)
			p["mao_t"] = Vector2(50 - g * 20, -140)
			p["inclina"] = 0.1 + g * 0.05
			p["boca"] = "grito" if (t / 4) % 2 == 0 else "normal"
			p["cabeca_giro"] = g * 0.12
			p["baloes"] = true
		"votos":
			p["mao_f"] = Vector2(40, -200)
			p["mao_t"] = Vector2(-30, -190)
			p["expr"] = "feliz"
			p["cabeca_giro"] = sin(t * 0.3) * 0.1
		"celular_alto":
			p["prop"] = "celular"
			p["mao_f"] = Vector2(50, -220)
			p["mao_t"] = Vector2(-10, -140)
			p["inclina"] = -0.1
			p["expr"] = "feliz"
			p["cabeca_giro"] = -0.25
		"caminhada":
			# marcha decidida com a bandeira: passos largos, braço livre balançando
			p["prop"] = "bandeira"
			var passo := sin(t * 0.32)
			p["pe_f"] = Vector2(26 + passo * 22, -maxf(0.0, passo) * 14.0)
			p["pe_t"] = Vector2(-22 - passo * 22, -maxf(0.0, -passo) * 14.0)
			p["quadril"] = -72.0 + absf(passo) * 4.0
			p["mao_f"] = Vector2(44, -150)
			p["mao_t"] = Vector2(-10 - passo * 26, -112)
			p["inclina"] = 0.1
			p["expr"] = "esforco" if prep else ("grito" if (t / 10) % 3 == 0 else "feliz")
		"filmar":
			# aponta o celular para o rival e o "REC" sai voando
			p["prop"] = "celular"
			if prep:
				p["mao_f"] = Vector2(40, -190)
				p["mao_t"] = Vector2(10, -140)
				p["cabeca_giro"] = -0.1
			else:
				p["mao_f"] = Vector2(100, -170)
				p["mao_t"] = Vector2(30, -140)
				p["inclina"] = 0.12 * kp
				p["pe_f"] = Vector2(38, 0)
				p["pe_t"] = Vector2(-30, 0)
				p["expr"] = "feliz"
		"protocolar":
			# ergue a pasta da PEC e lança com o braço todo, girando o tronco
			if prep:
				p["mao_f"] = Vector2(-20, -200)
				p["mao_t"] = Vector2(30, -120)
				p["prop"] = "pec"
				p["inclina"] = -0.16
				p["cabeca_giro"] = -0.15
			else:
				p["mao_f"] = Vector2(96, -150).lerp(Vector2(70, -130), 1.0 - kp)
				p["mao_t"] = Vector2(-30, -130)
				p["inclina"] = 0.18 * kp
				p["pe_f"] = Vector2(40, 0)
				p["pe_t"] = Vector2(-30, 0)
				if kp >= 1.0:
					p["rastro"] = [p["mao_f"], Vector2(-20, -200)]
		"giro_bolsa":
			# avança girando com os braços abertos (o "giro" do corpo vem do vaivém dos braços)
			var gi := t * 0.55
			var lado := sin(gi)
			p["mao_f"] = Vector2(70 * lado + 10, -150 + cos(gi) * 16)
			p["mao_t"] = Vector2(-70 * lado - 10, -146 - cos(gi) * 16)
			p["inclina"] = 0.12 + lado * 0.06
			p["cabeca_giro"] = lado * 0.18
			p["pe_f"] = Vector2(30 + lado * 10, -absf(lado) * 8.0)
			p["pe_t"] = Vector2(-26 + lado * 10, 0)
			p["expr"] = "feliz" if not prep else "esforco"
			if not prep and kp >= 1.0:
				p["rastro"] = [p["mao_f"], p["mao_t"]]
		"assinar":
			# abaixa e solta o rolo do abaixo-assinado no chão
			if prep:
				p["mao_f"] = Vector2(30, -170)
				p["mao_t"] = Vector2(10, -150)
				p["prop"] = "pec"
			else:
				_agacha(p)
				p["mao_f"] = Vector2(80, -40)
				p["mao_t"] = Vector2(30, -60)
				p["inclina"] = 0.22
				p["expr"] = "feliz"
		"megafone":
			# avança gritando no megafone: as ondas de som empurram o rival
			p["prop"] = "megafone_on" if not prep else "megafone"
			if prep:
				p["mao_f"] = Vector2(20, -150)
				p["mao_t"] = Vector2(-10, -140)
				p["inclina"] = -0.12
			else:
				var tr := sin(t * 0.9) * 3.0
				p["mao_f"] = Vector2(44 + tr, -194)
				p["mao_t"] = Vector2(70, -150 + tr)
				p["inclina"] = 0.14
				p["pe_f"] = Vector2(40, 0)
				p["pe_t"] = Vector2(-32, 0)
				p["boca"] = "grito"
				p["cabeca_desl"] = Vector2(tr, 0)
		"rachadinha":
			# puxa o envelope de trás e avança de ombro, "rachando" o golpe ao meio com a outra mão
			p["prop"] = "envelope"
			if prep:
				p["mao_f"] = Vector2(-34, -150)
				p["mao_t"] = Vector2(10, -130)
				p["inclina"] = -0.14
				p["cabeca_giro"] = -0.12
			else:
				var vai := sin(t * 0.6)
				p["mao_f"] = Vector2(104, -150 + vai * 14).lerp(Vector2(60, -130), 1.0 - kp)
				p["mao_t"] = Vector2(70, -110 - vai * 14)
				p["inclina"] = 0.22 * kp
				p["pe_f"] = Vector2(42, 0)
				p["pe_t"] = Vector2(-34, 0)
				p["expr"] = "feliz" if (t / 6) % 2 == 0 else "grito"
				if kp >= 1.0:
					p["rastro"] = [p["mao_f"], p["mao_t"]]
		"ultimate_inicio":
			# pose de poder antes da cinemática
			p["mao_f"] = Vector2(40, -220)
			p["mao_t"] = Vector2(-40, -210)
			p["inclina"] = -0.15
			p["expr"] = "grito"
			p["cabeca_giro"] = -0.2
			p["aura"] = true
		"ultimate":
			_ultimate(d, id, t, p)
	return p


## Pose de cada um durante a cinemática do ultimate.
static func _ultimate(d: Dictionary, id: String, t: int, p: Dictionary) -> void:
	p["aura"] = true
	match id:
		"lula":
			p["churrasqueira"] = t > 30
			var vira := sin(t * 0.4)
			p["mao_f"] = Vector2(90 + vira * 20, -150 - absf(vira) * 30)
			p["prop"] = "picanha_gigante" if t > 120 else "espeto_cheio"
			p["prop_ang"] = vira
			p["expr"] = "feliz" if (t / 15) % 2 == 0 else "grito"
		"bolsonaro":
			p["chapeu"] = "capacete"
			p["mao_f"] = Vector2(22, -176) if t < 50 else Vector2(80, -200)
			p["expr"] = "grito"
			p["inclina"] = -0.05
		"trump":
			danca(p, t, 1.4)
		"xandao":
			var a := -2.2 + absf(sin(t * 0.18)) * 2.4
			p["mao_f"] = Vector2(14, -150) + Vector2(cos(a), sin(a)) * 60.0
			p["prop"] = "martelo"
			p["expr"] = "esforco" if sin(t * 0.18) > 0 else "neutro"
		"renan":
			# aperta os botões no ar: 1, 4 e o CONFIRMA
			var bate := absf(sin(t * 0.25))
			p["mao_f"] = Vector2(90, -160 + bate * 30)
			p["mao_t"] = Vector2(40, -196)
			p["prop_t"] = "megafone_on"
			p["inclina"] = 0.08
			p["expr"] = "grito" if t > 110 else "esforco"
		"flavio":
			# acena da escada do avião de mala na mão e depois mostra a carta
			p["prop"] = "carta" if t > 150 else "envelope"
			p["mao_f"] = Vector2(50, -214 + sin(t * 0.3) * 8) if t > 150 else Vector2(30, -96)
			p["mao_t"] = Vector2(-30 + sin(t * 0.35) * 14, -214)
			p["cabeca_giro"] = -0.15 + sin(t * 0.35) * 0.05
			p["inclina"] = -0.05
			p["expr"] = "feliz" if t < 150 else "grito"
		"nikolas":
			# marchando no lugar com a bandeira erguida
			p["prop"] = "bandeira"
			var passo2 := sin(t * 0.3)
			p["pe_f"] = Vector2(26, -maxf(0.0, passo2) * 12.0)
			p["pe_t"] = Vector2(-22, -maxf(0.0, -passo2) * 12.0)
			p["mao_f"] = Vector2(40, -190)
			p["mao_t"] = Vector2(-20 - passo2 * 20, -120)
			p["expr"] = "feliz" if t > 160 else "grito"
		"pavanato":
			# na posse: acena com as duas mãos, joinha e celular filmando a multidão
			p["prop"] = "celular"
			p["prop_t"] = "joinha"
			p["mao_f"] = Vector2(60, -220 + sin(t * 0.2) * 10)
			p["mao_t"] = Vector2(-40, -210 - absf(sin(t * 0.2)) * 10)
			p["inclina"] = -0.06
			p["cabeca_giro"] = -0.12
			p["expr"] = "feliz"
		"erika":
			# na tribuna: ergue a PEC e comemora cada voto
			p["prop"] = "pec"
			p["mao_f"] = Vector2(30, -230 + absf(sin(t * 0.15)) * 14)
			p["mao_t"] = Vector2(-20, -200 + sin(t * 0.3) * 10)
			p["inclina"] = -0.08
			p["cabeca_giro"] = -0.15
			p["expr"] = "feliz" if t > 120 else "grito"
		"eduarda":
			p["prop"] = "microfone"
			p["mao_f"] = Vector2(60, -190)
			p["mao_t"] = Vector2(40 + sin(t * 0.6) * 20, -150)
			p["boca"] = "grito"
			p["baloes"] = true


static func _agacha(p: Dictionary) -> void:
	p["agachado"] = true
	p["quadril"] = -46.0
	p["pe_f"] = Vector2(28, 0)
	p["pe_t"] = Vector2(-26, 0)


## A dança das letras com os braços (Y, M, C, A) com passo de lado, quadril, tronco e cabeça.
## Ciclo de 4 letras; cada letra dura 16 quadros com transição suave.
static func danca(p: Dictionary, t: int, vel: float = 1.0) -> void:
	var ciclo := t * vel
	var letra := int(ciclo / 16.0) % 4
	var sub := fmod(ciclo, 16.0) / 16.0
	var suave := sin(sub * PI * 0.5)
	# braços de cada letra (mão da frente, mão de trás), vistas de lado
	var alvos := [
		[Vector2(76, -236), Vector2(-66, -232)],   # Y: braços bem abertos para cima
		[Vector2(30, -206), Vector2(-34, -204)],   # M: mãos na cabeça, cotovelos para fora
		[Vector2(86, -214), Vector2(70, -132)],    # C: os dois braços curvados para a frente
		[Vector2(10, -262), Vector2(-6, -260)],    # A: mãos juntas no alto
	]
	var ant: Array = alvos[(letra + 3) % 4]
	var atual: Array = alvos[letra]
	p["mao_f"] = (ant[0] as Vector2).lerp(atual[0], suave)
	p["mao_t"] = (ant[1] as Vector2).lerp(atual[1], suave)
	# passo para o lado (balanço de quadril) e joelho dobrando no tempo
	var batida := sin(ciclo * PI / 8.0)
	p["quadril"] = -72.0 + absf(batida) * 7.0
	p["pe_f"] = Vector2(22 + batida * 10.0, -maxf(0.0, batida) * 10.0)
	p["pe_t"] = Vector2(-22 + batida * 10.0, -maxf(0.0, -batida) * 10.0)
	p["inclina"] = batida * 0.12 + (0.1 if letra == 2 else 0.0)
	p["cabeca_giro"] = -batida * 0.16
	p["cabeca_desl"] = Vector2(batida * 4.0, -absf(batida) * 3.0)
	p["expr"] = "feliz" if letra != 1 else "grito"
	p["letra"] = ["Y", "M", "C", "A"][letra]
