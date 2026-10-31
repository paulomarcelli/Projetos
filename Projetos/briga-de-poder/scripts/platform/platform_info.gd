extends Node
## Plataforma e capacidades do dispositivo. Base para escolher layout (desktop x toque),
## qualidade gráfica e o que a interface pode oferecer (ex.: "Sair" não existe no navegador).

signal orientation_changed(is_portrait: bool)

var is_web: bool = OS.has_feature("web")
## Celular ou tablet: app nativo ("mobile") ou navegador em Android/iOS ("web_android"/"web_ios").
var is_mobile: bool = OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios")
var has_touch: bool = false

var _was_portrait := false


func _ready() -> void:
	has_touch = DisplayServer.is_touchscreen_available()
	_was_portrait = is_portrait()
	get_viewport().size_changed.connect(_on_viewport_resized)


## Layout de toque: celular/tablet, ou qualquer tela sensível ao toque sem ser desktop comum.
func prefers_touch_layout() -> bool:
	return is_mobile or (has_touch and not OS.has_feature("pc") and not OS.has_feature("web_windows") and not OS.has_feature("web_macos") and not OS.has_feature("web_linuxbsd"))


func is_portrait() -> bool:
	var size := DisplayServer.window_get_size()
	return size.y > size.x


## No navegador uma página não pode fechar a própria aba: o botão "Sair" só existe fora da Web.
func can_quit() -> bool:
	return not is_web


func platform_label() -> String:
	if is_web:
		return "Navegador (celular)" if is_mobile else "Navegador (computador)"
	return "Celular" if is_mobile else "Computador"


func _on_viewport_resized() -> void:
	var portrait := is_portrait()
	if portrait != _was_portrait:
		_was_portrait = portrait
		orientation_changed.emit(portrait)
