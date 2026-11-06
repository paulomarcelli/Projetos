class_name Lote
## Junta várias formas sem textura (linhas grossas, círculos, polígonos, retângulos, arcos) num único
## pacote de triângulos com cor por vértice e manda para a placa de vídeo de uma vez só.
## Um lutador tinha ~57 chamadas de desenho por quadro; com o lote são ~3 (o lote, a cabeça, o lote).
## xf é a transformação atual (o equivalente a draw_set_transform_matrix): os vértices já saem transformados.

var pts := PackedVector2Array()
var cores := PackedColorArray()
var idx := PackedInt32Array()
var xf := Transform2D.IDENTITY


func _tri(a: Vector2, b: Vector2, c: Vector2, cor: Color) -> void:
	var n := pts.size()
	pts.append(xf * a)
	pts.append(xf * b)
	pts.append(xf * c)
	cores.append(cor)
	cores.append(cor)
	cores.append(cor)
	idx.append(n)
	idx.append(n + 1)
	idx.append(n + 2)


func _quad(a: Vector2, b: Vector2, c: Vector2, d: Vector2, cor: Color) -> void:
	var n := pts.size()
	pts.append(xf * a)
	pts.append(xf * b)
	pts.append(xf * c)
	pts.append(xf * d)
	for i in 4:
		cores.append(cor)
	idx.append_array([n, n + 1, n + 2, n, n + 2, n + 3])


func linha(a: Vector2, b: Vector2, cor: Color, largura: float) -> void:
	var w := maxf(largura, 1.0) * 0.5
	var d := b - a
	if d.length_squared() < 0.0001:
		return
	var n := d.orthogonal().normalized() * w
	_quad(a + n, b + n, b - n, a - n, cor)


func circulo(centro: Vector2, r: float, cor: Color) -> void:
	var seg := 8 if r < 5.0 else (12 if r < 12.0 else (16 if r < 30.0 else 24))
	var n := pts.size()
	pts.append(xf * centro)
	cores.append(cor)
	for i in seg:
		var a := TAU * i / seg
		pts.append(xf * (centro + Vector2(cos(a), sin(a)) * r))
		cores.append(cor)
	for i in seg:
		idx.append_array([n, n + 1 + i, n + 1 + (i + 1) % seg])


func poligono(p: PackedVector2Array, cor: Color) -> void:
	if p.size() < 3:
		return
	var tri := Geometry2D.triangulate_polygon(p)
	if tri.is_empty():
		return
	var n := pts.size()
	for q in p:
		pts.append(xf * q)
		cores.append(cor)
	for t in tri:
		idx.append(n + t)


func retangulo(r: Rect2, cor: Color) -> void:
	_quad(r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y), cor)


func arco(centro: Vector2, r: float, de: float, ate: float, segs: int, cor: Color, largura: float) -> void:
	var w := maxf(largura, 1.0) * 0.5
	segs = maxi(segs, 2)
	for i in segs:
		var a0 := lerpf(de, ate, float(i) / segs)
		var a1 := lerpf(de, ate, float(i + 1) / segs)
		var d0 := Vector2(cos(a0), sin(a0))
		var d1 := Vector2(cos(a1), sin(a1))
		_quad(centro + d0 * (r - w), centro + d1 * (r - w), centro + d1 * (r + w), centro + d0 * (r + w), cor)


## Manda o pacote acumulado (antes de uma textura ou de um texto, e no fim do boneco).
func despejar(c: CanvasItem) -> void:
	if idx.is_empty():
		return
	c.draw_set_transform_matrix(Transform2D.IDENTITY)
	RenderingServer.canvas_item_add_triangle_array(c.get_canvas_item(), idx, pts, cores)
	pts.clear()
	cores.clear()
	idx.clear()
