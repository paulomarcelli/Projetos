class_name Cache
## Desenha uma camada pesada (cenário, plateia) numa textura do tamanho da tela real (480x270)
## e mostra essa textura como uma imagem só: a placa de vídeo recebe 1 chamada em vez de centenas.
## A camada só é redesenhada quando pedimos (atualizar), não a cada quadro.

var vp: SubViewport
var camada: Camada
var sprite: Sprite2D


## pai_vp: nó que guarda o SubViewport; pai_sprite: onde a imagem aparece (coordenadas 1280x720).
static func criar(pai_vp: Node, pai_sprite: Node, desenhar: Callable, z: int = 0, tamanho := Vector2(1280, 720)) -> Cache:
	var c := Cache.new()
	c.vp = SubViewport.new()
	c.vp.size = Vector2i(ceili(tamanho.x * Desenho.ESCALA), ceili(tamanho.y * Desenho.ESCALA))
	c.vp.transparent_bg = true
	c.vp.disable_3d = true
	c.vp.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	c.vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	c.camada = Camada.new()
	c.camada.desenhar = desenhar
	c.camada.scale = Vector2.ONE * Desenho.ESCALA
	c.vp.add_child(c.camada)
	pai_vp.add_child(c.vp)
	c.sprite = Sprite2D.new()
	c.sprite.texture = c.vp.get_texture()
	c.sprite.centered = false
	c.sprite.scale = Vector2.ONE / Desenho.ESCALA
	c.sprite.z_index = z
	pai_sprite.add_child(c.sprite)
	return c


func atualizar() -> void:
	camada.queue_redraw()
	vp.render_target_update_mode = SubViewport.UPDATE_ONCE
