"""Gera a arte animada do tema Magia do Caos para o Notion (capas, ícones e divisor), em SVG.

Tudo é desenho original: selos, runas e emblemas feitos aqui com traços simples. Nenhum símbolo, logotipo
ou imagem de filmes ou quadrinhos.

Uso (na pasta Notion-Caos):
  python3 ferramentas/gerar_arte.py

Saída:
  arte/capas/<pagina>.svg   1500×600, para a capa das páginas (o Notion corta o meio: o selo fica à direita,
                            longe do ícone, que fica no canto de baixo à esquerda)
  arte/icones/<pagina>.svg  256×256, ícone da página (disco escuro: funciona no tema claro e no escuro)
  arte/divisor.svg          1200×48, linha de energia para separar seções

Animações em CSS dentro do próprio SVG (rodam quando o SVG é mostrado como imagem). Um ciclo de
"mudança de realidade" a cada 11 s: onda de hexágonos, tremor, cópias em vermelho e ciano e a cor do fundo
virando por um instante.
"""
import math
import pathlib
import random

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CAPAS = RAIZ / 'arte' / 'capas'
ICONES = RAIZ / 'arte' / 'icones'

ESCARLATE = '#ff1f3d'
SANGUE = '#7a0a1c'
NOITE = '#07010a'

# emblemas originais, traço em caixa 100×100 (centro 50,50)
EMBLEMAS = {
    'olho': 'M8 50 Q50 12 92 50 Q50 88 8 50 Z M50 38 A12 12 0 1 1 49.9 38 Z M50 46 A4 4 0 1 1 49.9 46 Z',
    'ampulheta': 'M24 10 H76 M24 90 H76 M30 10 C30 38 50 44 50 50 C50 56 30 62 30 90 M70 10 C70 38 50 44 50 50 C50 56 70 62 70 90 M38 80 C44 74 56 74 62 80 Z',
    'lua': 'M60 14 A36 36 0 1 0 60 86 A28 28 0 1 1 60 14 Z M78 26 L80 31 L85 33 L80 35 L78 40 L76 35 L71 33 L76 31 Z',
    'raio': 'M57 8 L27 56 H48 L41 92 L74 40 H53 Z',
    'grimorio': 'M50 28 C38 19 22 19 11 24 V80 C22 75 38 75 50 84 C62 75 78 75 89 80 V24 C78 19 62 19 50 28 Z M50 28 V84 M20 36 C28 33 36 33 42 36 M58 36 C64 33 72 33 80 36 M20 48 C28 45 36 45 42 48 M58 48 C64 45 72 45 80 48',
    'estrela': 'M50 6 L57 38 L86 22 L66 48 L94 56 L62 62 L72 92 L50 70 L28 92 L38 62 L6 56 L34 48 L14 22 L43 38 Z',
    'chama': 'M50 10 C64 30 76 44 68 66 C63 80 37 80 32 66 C26 50 38 40 43 28 C46 40 52 44 57 47 C59 36 55 23 50 10 Z M50 58 C55 64 55 70 50 74 C45 70 45 64 50 58 Z',
    'pena': 'M82 12 C52 16 30 38 22 76 L16 92 M22 76 C40 70 62 56 74 34 M34 60 L52 55 M28 70 L44 67',
    'alvo': 'M50 14 A36 36 0 1 1 49.9 14 Z M50 28 A22 22 0 1 1 49.9 28 Z M50 42 A8 8 0 1 1 49.9 42 Z M50 50 L90 10 M78 10 H90 V22',
    'haltere': 'M28 50 H72 M22 34 V66 M14 41 V59 M78 34 V66 M86 41 V59',
    'faisca': 'M50 8 C54 40 60 46 92 50 C60 54 54 60 50 92 C46 60 40 54 8 50 C40 46 46 40 50 8 Z M80 14 L82 20 L88 22 L82 24 L80 30 L78 24 L72 22 L78 20 Z',
    'pico': 'M10 84 L42 32 L54 50 L64 38 L90 84 Z M42 32 V12 L60 18 L42 24',
}

# página → (emblema, acento, semente). O acento muda a cor das faíscas e de um dos anéis.
PAGINAS = {
    'inicio': ('olho', '#ff7a1a', 11),
    'planner': ('ampulheta', '#ff2e88', 12),
    'trabalho': ('raio', '#ffb21a', 13),
    'estudos': ('grimorio', '#ff7a1a', 14),
    'objetivo': ('pico', '#ffb21a', 15),
    'goals': ('estrela', '#ffb21a', 16),
    'notes': ('chama', '#ff7a1a', 17),
    'celular': ('lua', '#b04dff', 18),
    'substack': ('pena', '#ff2e88', 19),
    'vagas': ('alvo', '#ff7a1a', 20),
    'treino': ('haltere', '#ff2e88', 21),
    'ideias': ('faisca', '#ffb21a', 22),
}


def runa(rng, x, y, s):
    """uma runa inventada: haste e 1 a 3 traços (diagonais, ganchos ou ponto)"""
    p = [f'M{x:.1f},{y - s:.1f} L{x:.1f},{y + s:.1f}']
    for _ in range(rng.randint(1, 3)):
        t = rng.choice(['diag', 'gancho', 'cruz', 'ponto'])
        yy = y + rng.uniform(-s * .7, s * .7)
        lado = rng.choice([-1, 1])
        if t == 'diag':
            p.append(f'M{x:.1f},{yy:.1f} L{x + lado * s * .7:.1f},{yy - s * .5:.1f}')
        elif t == 'gancho':
            p.append(f'M{x:.1f},{yy:.1f} L{x + lado * s * .6:.1f},{yy:.1f} L{x + lado * s * .6:.1f},{yy + s * .45:.1f}')
        elif t == 'cruz':
            p.append(f'M{x - s * .5:.1f},{yy:.1f} L{x + s * .5:.1f},{yy:.1f}')
        else:
            p.append(f'M{x + lado * s * .55:.1f},{yy:.1f} l0.1,0')
    return ' '.join(p)


def anel_de_runas(rng, cx, cy, r, n, s):
    """runas em volta de um círculo, cada uma girada para o centro"""
    partes = []
    for i in range(n):
        a = 360 * i / n
        g = runa(rng, 0, 0, s)
        partes.append(f'<path d="{g}" transform="translate({cx:.1f},{cy:.1f}) rotate({a:.2f}) translate(0,{-r:.1f})"/>')
    return '\n'.join(partes)


def hexagrama(cx, cy, r):
    pts = lambda off: ' '.join(f'{cx + r * math.cos(math.radians(off + 120 * k)):.1f},{cy + r * math.sin(math.radians(off + 120 * k)):.1f}' for k in range(3))
    return f'<polygon points="{pts(-90)}"/><polygon points="{pts(90)}"/>'


def poligono(cx, cy, r, n, rot=0):
    return ' '.join(f'{cx + r * math.cos(math.radians(rot + 360 * k / n)):.1f},{cy + r * math.sin(math.radians(rot + 360 * k / n)):.1f}' for k in range(n))


def selo(rng, cx, cy, R, acento, emblema, fino=1.0, emb=.4, hexop=1.0):
    """o selo do caos: 3 anéis de runas que giram em sentidos diferentes, hexagrama, heptágono e o emblema"""
    w = fino
    return f'''
<g class="giro" style="transform-origin:{cx}px {cy}px">
  <circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{ESCARLATE}" stroke-width="{2.4 * w}"/>
  <circle cx="{cx}" cy="{cy}" r="{R * .93}" fill="none" stroke="{ESCARLATE}" stroke-width="{1 * w}" stroke-dasharray="1 7" opacity=".9"/>
  <g stroke="#ff6b82" stroke-width="{1.6 * w}" fill="none" stroke-linecap="round" opacity=".95">{anel_de_runas(rng, cx, cy, R * .965, 40, R * .03)}</g>
</g>
<g class="giroR" style="transform-origin:{cx}px {cy}px">
  <circle cx="{cx}" cy="{cy}" r="{R * .8}" fill="none" stroke="{acento}" stroke-width="{1.4 * w}" opacity=".85"/>
  <polygon points="{poligono(cx, cy, R * .8, 7, -90)}" fill="none" stroke="{ESCARLATE}" stroke-width="{1.4 * w}" opacity=".75"/>
  <g stroke="{acento}" stroke-width="{1.3 * w}" fill="none" stroke-linecap="round" opacity=".8">{anel_de_runas(rng, cx, cy, R * .7, 24, R * .028)}</g>
</g>
<g class="giroLento" style="transform-origin:{cx}px {cy}px" opacity="{hexop}" fill="none" stroke="{ESCARLATE}" stroke-width="{2 * w}" stroke-linejoin="round">
  {hexagrama(cx, cy, R * .58)}
  <circle cx="{cx}" cy="{cy}" r="{R * .29}" stroke-width="{1.2 * w}" stroke-dasharray="4 5"/>
</g>
<g class="respira" style="transform-origin:{cx}px {cy}px">
  <circle cx="{cx}" cy="{cy}" r="{R * max(.27, emb * .72)}" fill="url(#nucleo)"/>
  <path d="{EMBLEMAS[emblema]}" transform="translate({cx - R * emb / 2:.1f},{cy - R * emb / 2:.1f}) scale({R * emb / 100:.4f})" fill="none" stroke="#ffe3e8" stroke-width="{(5.5 if emb < .5 else 9) * 100 / (R * emb):.2f}" stroke-linecap="round" stroke-linejoin="round"/>
</g>'''


ESTILO = '''<style>
.giro{animation:giro 70s linear infinite}.giroR{animation:giro 46s linear infinite reverse}.giroLento{animation:giro 120s linear infinite}
@keyframes giro{to{transform:rotate(360deg)}}
.respira{animation:respira 5.5s ease-in-out infinite}@keyframes respira{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.82}}
.aura{animation:aura 7s ease-in-out infinite}@keyframes aura{50%{opacity:.6}}
.fio{fill:none;stroke-linecap:round;stroke-dasharray:14 86;animation:fio 6s linear infinite}
@keyframes fio{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.sobe1,.sobe2,.sobe3{opacity:0}
.sobe1{animation:sobe1 7s ease-in infinite}.sobe2{animation:sobe2 9s ease-in infinite}.sobe3{animation:sobe3 6s ease-in infinite}
@keyframes sobe1{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(-40px,-280px);opacity:0}}
@keyframes sobe2{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(50px,-330px);opacity:0}}
@keyframes sobe3{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(8px,-220px);opacity:0}}
.fumaca1{animation:fumaca1 26s ease-in-out infinite alternate}.fumaca2{animation:fumaca2 33s ease-in-out infinite alternate}
@keyframes fumaca1{to{transform:translate(-120px,30px) scale(1.15)}}@keyframes fumaca2{to{transform:translate(90px,-40px) scale(.9)}}
.estilhaco{animation:estilhaco 9s ease-in-out infinite alternate}@keyframes estilhaco{to{transform:translate(0,-14px) rotate(25deg)}}
.onda{animation:onda 11s cubic-bezier(.3,0,.2,1) infinite}@keyframes onda{0%{transform:translateX(-700px)}38%,100%{transform:translateX(2300px)}}
.tremor{animation:tremor 11s steps(1) infinite}
@keyframes tremor{0%,3.5%,100%{transform:none}.5%{transform:translate(5px,-2px) skewX(-5deg)}1%{transform:translate(-6px,2px)}1.6%{transform:translate(3px,0) skewX(3deg)}2.2%{transform:translate(-2px,1px)}}
.rgb{opacity:0;animation:rgb 11s steps(1) infinite}@keyframes rgb{0%,3.5%,100%{opacity:0}.4%,1.2%,2%{opacity:.75}.8%,1.6%{opacity:0}}
.outra{opacity:0;animation:outra 11s ease-out infinite}@keyframes outra{0%{opacity:0}1%{opacity:.85}9%{opacity:0}100%{opacity:0}}
.lampejo{opacity:0;animation:lampejo 11s ease-out infinite}@keyframes lampejo{0%{opacity:0}.6%{opacity:.5}5%{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation-duration:0s!important;animation-iteration-count:1!important}}
</style>'''

DEFS = f'''<defs>
<radialGradient id="aura" cx="74%" cy="50%" r="55%"><stop offset="0" stop-color="{ESCARLATE}" stop-opacity=".55"/><stop offset=".4" stop-color="{SANGUE}" stop-opacity=".35"/><stop offset="1" stop-color="{NOITE}" stop-opacity="0"/></radialGradient>
<radialGradient id="outraRealidade" cx="74%" cy="50%" r="70%"><stop offset="0" stop-color="#b04dff" stop-opacity=".55"/><stop offset=".5" stop-color="#3a0a6e" stop-opacity=".35"/><stop offset="1" stop-color="#05010a" stop-opacity="0"/></radialGradient>
<radialGradient id="nucleo"><stop offset="0" stop-color="#ff4d6d" stop-opacity=".95"/><stop offset=".6" stop-color="{SANGUE}" stop-opacity=".6"/><stop offset="1" stop-color="{SANGUE}" stop-opacity="0"/></radialGradient>
<linearGradient id="escuro" x1="0" x2="1"><stop offset="0" stop-color="{NOITE}" stop-opacity=".92"/><stop offset=".5" stop-color="{NOITE}" stop-opacity=".25"/><stop offset="1" stop-color="{NOITE}" stop-opacity="0"/></linearGradient>
<linearGradient id="faixa" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="brilho" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="nevoa" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="48"/></filter>
<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .12  0 0 0 0 .24  0 0 0 .55 0"/></filter>
<filter id="energia" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="turbulence" baseFrequency=".012 .03" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="22"/><feGaussianBlur stdDeviation="1.2"/></filter>
<pattern id="hex" width="34.64" height="60" patternUnits="userSpaceOnUse"><path d="M17.32 0 L34.64 10 V30 L17.32 40 L0 30 V10 Z M17.32 40 V60" fill="none" stroke="{ESCARLATE}" stroke-width="1"/></pattern>
<mask id="mascaraOnda"><rect width="1500" height="600" fill="#000"/><g class="onda"><rect x="0" y="0" width="520" height="600" fill="url(#faixa)"/></g></mask>
</defs>'''


def capa(nome, emblema, acento, semente):
    rng = random.Random(semente)
    W, H, cx, cy, R = 1500, 600, 1110, 300, 236
    # tentáculos de energia: saem do selo para as bordas
    fios = []
    for i in range(14):
        a = rng.uniform(0, 2 * math.pi)
        x0, y0 = cx + R * .9 * math.cos(a), cy + R * .9 * math.sin(a)
        dist = rng.uniform(260, 620)
        x3, y3 = cx + dist * math.cos(a) * 1.4, cy + dist * math.sin(a)
        c1 = (x0 + rng.uniform(-160, 160), y0 + rng.uniform(-120, 120))
        c2 = (x3 + rng.uniform(-200, 200), y3 + rng.uniform(-140, 140))
        cor = acento if i % 3 == 0 else ESCARLATE
        fios.append(f'<path class="fio" pathLength="100" d="M{x0:.0f},{y0:.0f} C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {x3:.0f},{y3:.0f}" stroke="{cor}" stroke-width="{rng.uniform(1.2, 3.2):.1f}" style="animation-delay:-{rng.uniform(0, 6):.1f}s;animation-duration:{rng.uniform(4.5, 8):.1f}s"/>')
    brasas = []
    for i in range(46):
        x = rng.uniform(560, 1480) if i % 4 else rng.uniform(60, 560)
        y = rng.uniform(340, 640)
        cor = acento if i % 3 == 0 else rng.choice([ESCARLATE, '#ff6b82', '#ffd0d8'])
        brasas.append(f'<circle class="sobe{i % 3 + 1}" cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(1, 3.4):.1f}" fill="{cor}" style="animation-delay:-{rng.uniform(0, 9):.1f}s"/>')
    estilhacos = []
    for i in range(9):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(R * 1.08, R * 1.55)
        x, y = cx + d * math.cos(a), cy + d * math.sin(a)
        s = rng.uniform(8, 22)
        estilhacos.append(f'<polygon class="estilhaco" points="{x:.0f},{y - s:.0f} {x + s * .8:.0f},{y + s * .6:.0f} {x - s * .7:.0f},{y + s * .4:.0f}" fill="{SANGUE}" stroke="{ESCARLATE}" stroke-width="1.2" style="transform-origin:{x:.0f}px {y:.0f}px;animation-delay:-{rng.uniform(0, 9):.1f}s"/>')
    sel = selo(rng, cx, cy, R, acento, emblema)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Capa: magia do caos ({nome})">
{ESTILO}
{DEFS}
<rect width="{W}" height="{H}" fill="{NOITE}"/>
<g filter="url(#nevoa)" opacity=".75">
  <ellipse class="fumaca1" cx="1050" cy="260" rx="420" ry="230" fill="{SANGUE}"/>
  <ellipse class="fumaca2" cx="520" cy="420" rx="380" ry="160" fill="#4a0612"/>
  <ellipse class="fumaca1" cx="1300" cy="520" rx="260" ry="140" fill="{acento}" opacity=".35"/>
  <ellipse class="fumaca2" cx="200" cy="120" rx="240" ry="120" fill="#2a0410"/>
</g>
<rect width="{W}" height="{H}" fill="url(#aura)" class="aura"/>
<rect width="{W}" height="{H}" fill="url(#outraRealidade)" class="outra"/>
<rect width="{W}" height="{H}" fill="url(#hex)" opacity=".07"/>
<rect width="{W}" height="{H}" fill="url(#hex)" opacity=".55" mask="url(#mascaraOnda)"/>
<g class="tremor">
  <g filter="url(#energia)" opacity=".9">{''.join(fios)}</g>
  {''.join(estilhacos)}
  <g filter="url(#brilho)">{sel}</g>
  <g class="rgb" transform="translate(7,0)" opacity=".7" style="mix-blend-mode:screen"><g stroke="#2ef2ff" fill="none" stroke-width="2"><circle cx="{cx}" cy="{cy}" r="{R}"/>{hexagrama(cx, cy, R * .58)}</g></g>
  <g class="rgb" transform="translate(-7,0)" style="mix-blend-mode:screen"><g stroke="#ff2e88" fill="none" stroke-width="2"><circle cx="{cx}" cy="{cy}" r="{R}"/>{hexagrama(cx, cy, R * .58)}</g></g>
</g>
{''.join(brasas)}
<rect width="{W}" height="{H}" fill="url(#escuro)"/>
<rect width="{W}" height="{H}" filter="url(#grao)" opacity=".18"/>
<rect width="{W}" height="{H}" fill="#ffd0d8" class="lampejo"/>
</svg>
'''


def icone(nome, emblema, acento, semente):
    rng = random.Random(semente + 100)
    cx = cy = 128
    R = 108
    brasas = ''.join(f'<circle class="sobe{i % 3 + 1}" cx="{rng.uniform(60, 196):.0f}" cy="{rng.uniform(170, 230):.0f}" r="{rng.uniform(1.2, 2.6):.1f}" fill="{acento if i % 2 else "#ff6b82"}" style="animation-delay:-{rng.uniform(0, 8):.1f}s;animation-duration:{rng.uniform(3, 5):.1f}s"/>' for i in range(10))
    # no ícone as faíscas sobem menos (o ícone é pequeno)
    estilo = ESTILO.replace('-280px', '-120px').replace('-330px', '-140px').replace('-220px', '-100px')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="Ícone: {nome}">
{estilo}
{DEFS}
<circle cx="128" cy="128" r="126" fill="#12030a"/>
<circle cx="128" cy="128" r="126" fill="url(#nucleo)" opacity=".35" class="aura"/>
<g class="tremor"><g filter="url(#brilho)">{selo(rng, cx, cy, R, acento, emblema, fino=1.6, emb=.86, hexop=.35)}</g></g>
{brasas}
</svg>
'''


def divisor():
    rng = random.Random(5)
    runas = ''.join(f'<path d="{runa(rng, x, 24, 7)}"/>' for x in range(40, 1200, 80))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="48" viewBox="0 0 1200 48" role="img" aria-label="Divisor">
{ESTILO}
{DEFS}
<g filter="url(#brilho)">
  <path d="M0 24 H1200" stroke="{SANGUE}" stroke-width="2"/>
  <path class="fio" pathLength="100" d="M0 24 H1200" stroke="{ESCARLATE}" stroke-width="3" style="animation-duration:4s"/>
  <path class="fio" pathLength="100" d="M1200 24 H0" stroke="#ff7a1a" stroke-width="2" style="animation-duration:6.5s"/>
  <g stroke="#ff6b82" stroke-width="1.6" fill="none" stroke-linecap="round" class="aura">{runas}</g>
  <polygon points="{poligono(600, 24, 14, 6, -90)}" fill="#12030a" stroke="{ESCARLATE}" stroke-width="2" class="respira" style="transform-origin:600px 24px"/>
</g>
</svg>
'''


def main():
    CAPAS.mkdir(parents=True, exist_ok=True)
    ICONES.mkdir(parents=True, exist_ok=True)
    for nome, (emb, acento, semente) in PAGINAS.items():
        (CAPAS / f'{nome}.svg').write_text(capa(nome, emb, acento, semente), encoding='utf-8')
        (ICONES / f'{nome}.svg').write_text(icone(nome, emb, acento, semente), encoding='utf-8')
    (RAIZ / 'arte' / 'divisor.svg').write_text(divisor(), encoding='utf-8')
    print(len(PAGINAS), 'capas e ícones + divisor em', RAIZ / 'arte')


if __name__ == '__main__':
    main()
