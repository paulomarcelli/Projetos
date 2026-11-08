# Perfil do motor web enxuto do Brasília Kombat (Godot 4.3-stable, SCons).
#
# O jogo usa só o núcleo 2D do Godot: Node2D, Sprite2D, SubViewport, ImageTexture,
# CanvasTexture, Tween, fonte TTF (FreeType), áudio OGG Vorbis e o JavaScriptBridge
# (o online é a biblioteca PeerJS na própria página). Tudo o mais sai do motor:
# menos para baixar e bem menos para o navegador compilar antes de abrir o jogo.
#
# Uso (ferramentas/motor_web.sh faz tudo, do zero):
#   scons platform=web target=template_release threads=no profile=<este arquivo> -j4

platform = "web"
target = "template_release"
threads = "no"  # igual ao preset de exportação (variant/thread_support=false)

# Produção: LTO completo, sem símbolos de depuração; tamanho acima de velocidade
production = "yes"
optimize = "size"
# Sem os módulos de rede do Godot, as funções de rede da biblioteca C (htonl...) só aparecem
# depois do LTO e o ligador recusa ("attempt to add bitcode file after LTO"). Pedimos antes.
linkflags = "-Wl,-u,htonl -Wl,-u,htons -Wl,-u,ntohl -Wl,-u,ntohs"

# Sem nós 3D nem os controles de interface avançados (o jogo desenha tudo à mão)
disable_3d = "yes"
disable_advanced_gui = "yes"

# Texto: servidor simples. A fonte é pixel (Press Start 2P) e o texto é só latino,
# então não precisa de HarfBuzz/ICU (ligaduras, escrita da direita para a esquerda...).
module_text_server_adv_enabled = "no"
module_text_server_fb_enabled = "yes"

# 3D, XR e navegação
module_gltf_enabled = "no"
module_fbx_enabled = "no"
module_csg_enabled = "no"
module_gridmap_enabled = "no"
module_navigation_enabled = "no"
module_mobile_vr_enabled = "no"
module_webxr_enabled = "no"
module_openxr_enabled = "no"
module_godot_physics_3d_enabled = "no"

# Rede do Godot (o online usa a PeerJS no navegador, pelo JavaScriptBridge)
module_webrtc_enabled = "no"
module_websocket_enabled = "no"
module_enet_enabled = "no"
module_multiplayer_enabled = "no"
module_upnp_enabled = "no"
module_jsonrpc_enabled = "no"
module_mbedtls_enabled = "no"

# Formatos que o jogo não carrega em tempo de execução (as imagens já vão importadas
# em .ctex PNG/WebP e o áudio é todo OGG Vorbis)
module_jpg_enabled = "no"
module_svg_enabled = "no"
module_bmp_enabled = "no"
module_tga_enabled = "no"
module_hdr_enabled = "no"
module_dds_enabled = "no"
module_ktx_enabled = "no"
module_tinyexr_enabled = "no"
module_basis_universal_enabled = "no"
module_minimp3_enabled = "no"
module_theora_enabled = "no"

# Outros sem uso no jogo
module_interactive_music_enabled = "no"
module_camera_enabled = "no"
module_noise_enabled = "no"
module_regex_enabled = "no"
module_msdfgen_enabled = "no"
module_zip_enabled = "no"

# Mantidos (padrão ligado): gdscript, freetype, ogg, vorbis, webp, godot_physics_2d
# e o PNG do núcleo.
