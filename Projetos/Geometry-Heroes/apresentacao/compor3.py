# ================================================================
# compor3.py — versão 3 do vídeo (60–90 s): mesmas cenas e transições da v2 (compor2.py),
# linha do tempo mais curta (~83 s), capturas novas (interface HQ, cards padronizados, efeitos 8-bit)
# e textos atualizados com as correções desta rodada. Música: a mesma da v2, cortada com fade-out.
# Uso: python3 apresentacao/compor3.py <pasta> <musica.mp3> <saida.mp4>   (rodar da raiz do jogo)
# ================================================================
import sys, subprocess
import compor as C
import compor2 as V2
from compor import W, H, FPS, eo, eio, faixa, fonte, texto_alfa, entra, tela_base, vinheta, OURO, BRANCO, CINZA
from PIL import ImageDraw

TOTAL_TESTES = int(sys.argv[sys.argv.index('--testes') + 1]) if '--testes' in sys.argv else 280

# Textos conferidos com o que de fato foi usado no projeto
C.SKILLS = [
    ('REA', 'Engenharia reversa por observação', 'Estudo das referências do gênero (layout, ritmo, cores). A skill de REA foi consultada; como não havia binário para analisar, a análise foi feita por observação (REA_ESQUEMA.md).', (255, 59, 85)),
    ('ANIMATE', 'Skill de animação', 'Decidir o que deve animar, curva ease-out e duração curta: portais, rastro, parallax do Homem de Ferro.', (255, 194, 61)),
    ('EMIL DESIGN ENG', 'Skill de engenharia de design', 'Revisão de UI e movimento: detalhes invisíveis, legibilidade e feedback.', (176, 140, 255)),
    ('AGENTES', '3 agentes em paralelo (rodadas 7 e 8)', 'Cenários, pulo e tela inicial divididos por arquivos; um agente principal integrou e testou.', (111, 220, 74)),
    ('TESTES', 'Testes de regressão automáticos', f'Cada mudança validada por 7 suítes ({TOTAL_TESTES} verificações) com piloto automático.', (92, 225, 255)),
]
C.CASOS = [
    ('Renascer colado no perigo', '0,3 s → ≥ 0,8 s', 'checkpoints recuados, câmera alinhada e 0,5 s de respiro; teste com 3 mortes seguidas'),
    ('Homem de Ferro morria no piso do túnel', 'causa real', 'as paredes eram "mortais": viraram sólidas e só a frente mata'),
    ('Toque perdido no celular', '1 → 3 dedos', 'multitoque ligado; foco preso em botão não bloqueia mais o pulo'),
]

# Cena "o jogo em ação" com a gravação nova do menu (menu de 4 a 9 s; seleção a partir de 10,4 s)
def cena_jogo(t, D):
    im, d = tela_base(t)
    a, dsl = entra(t, 0.1, 0.5, 30)
    texto_alfa(im, (110, 90), 'O JOGO EM AÇÃO', fonte('tit', 54), OURO, 'la', a, dsl)
    texto_alfa(im, (112, 168), 'Plataforma rítmica · 6 heróis · 6 fases · jogável no navegador', fonte('semi', 30), CINZA, 'la', a, dsl, sombra=False)
    caixa = (110, 225, 110 + 1360, 225 + 765)
    corte = D * 0.6
    if t < corte:
        z = 1.0 + 0.05 * eio(faixa(t, 0, corte))
        tm = 4.5 + t if t < 3.6 else 10.6 + (t - 3.6) * 1.6
        C.colar_zoom(im, C.menu_quadro(tm), caixa, z, (0.5, 0.5), raio=26, borda=((255, 201, 74), 3))
        rot = 'Menu no estilo HQ com o elenco' if t < 3.6 else 'Seleção de fases (cards padronizados)'
    else:
        tl = t - corte; ordem = ['Homem-Aranha_0', 'Hulk_0', 'Homem_de_Ferro_0', 'Wanda_0']
        i = min(int(tl / 1.0), 3); nome = ordem[i]
        z = 1.08 + 0.06 * eio((tl % 1.0) / 1.0)
        C.colar_zoom(im, C.clipe(nome, 1.5 + (tl % 1.0)), caixa, z, (0.35, 0.6), raio=26, borda=((255, 201, 74), 3))
        rot = 'Jogabilidade real (piloto automático dos testes)'
    for j, (titulo, sub) in enumerate([('6', 'heróis e fases'), (str(TOTAL_TESTES), 'verificações de teste'), ('~10.100', 'linhas de JavaScript')]):
        aa, ds = entra(t, 0.8 + j * 0.25, 0.5, 24)
        texto_alfa(im, (1540, 300 + j * 230), titulo, fonte('tit', 68), OURO, 'la', aa, ds)
        texto_alfa(im, (1542, 386 + j * 230), sub, fonte('semi', 24), CINZA, 'la', aa, ds, sombra=False)
    texto_alfa(im, (112, 1010), rot, fonte('semi', 26), BRANCO, 'la', 1.0, sombra=False)
    return vinheta(im, 0.4)
C.cena_jogo = cena_jogo

# Linha do tempo curta: ~83 s
V2.LINHA = [('abertura', 5.5), ('jogo', 9.5)] + [(f'heroi{i}', 5.5) for i in range(6)] + \
           [('tech', 10.0), ('skills', 10.0), ('engenharia', 9.0), ('final', 6.0)]
V2.EMENDAS = ['portal', 'teia', 'forca', 'flecha', 'hud', 'portal', 'realidade', 'teia', 'hud', 'flecha', 'forca']
TOTAL = sum(d for _, d in V2.LINHA)

if __name__ == '__main__':
    if '--quadros' in sys.argv:
        for tg in [float(x) for x in sys.argv[sys.argv.index('--quadros') + 1].split(',')]:
            V2.quadro(tg).save(str(C.V / f'v3_{tg:07.2f}.jpg'), quality=88)
        sys.exit(0)
    print(f'total {TOTAL:.1f}s · {int(TOTAL * FPS)} quadros', flush=True)
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-i', C.MUSICA, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
           '-c:a', 'aac', '-b:a', '192k', '-af', f'afade=t=in:d=0.5,afade=t=out:st={TOTAL - 3:.2f}:d=3', '-t', f'{TOTAL:.2f}',
           '-movflags', '+faststart', C.SAIDA]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(TOTAL * FPS)
    for i in range(n):
        pr.stdin.write(V2.quadro(i / FPS).tobytes())
        if i % 300 == 0: print(f'{i}/{n}', flush=True)
    pr.stdin.close(); pr.wait()
    print('ok', C.SAIDA)
