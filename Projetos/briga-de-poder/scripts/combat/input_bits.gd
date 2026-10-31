class_name InputBits
extends RefCounted
## Entrada de um quadro como bitmask: é o que a simulação lê e, na Fase 6, o que vai pela rede.

const UP := 1
const DOWN := 2
const LEFT := 4
const RIGHT := 8
const LIGHT := 16
const MEDIUM := 32
const HEAVY := 64
const BUTTONS := [LIGHT, MEDIUM, HEAVY]

const MOTIONS := {
	"qcf": [2, 3, 6],  # baixo, baixo-frente, frente
	"dp": [6, 2, 3],   # frente, baixo, baixo-frente
}


## Direção no "teclado numérico" relativa a quem o lutador encara: 6 = frente, 4 = trás,
## 2 = baixo, 8 = cima, 5 = neutro. Direções opostas apertadas juntas se anulam.
static func numpad(bits: int, facing: int) -> int:
	var h := 0
	if bits & RIGHT:
		h += 1
	if bits & LEFT:
		h -= 1
	h *= facing
	var v := 0
	if bits & UP:
		v += 1
	if bits & DOWN:
		v -= 1
	return 5 + h + v * 3


## A sequência do comando aparece, em ordem, dentro dos últimos `window` quadros.
static func has_motion(history: Array[int], facing: int, motion: String, window: int) -> bool:
	var sequence: Array = MOTIONS.get(motion, [])
	if sequence.is_empty():
		return false
	var step := sequence.size() - 1
	var start := maxi(0, history.size() - window)
	for i in range(history.size() - 1, start - 1, -1):
		if numpad(history[i], facing) == sequence[step]:
			step -= 1
			if step < 0:
				return true
	return false
