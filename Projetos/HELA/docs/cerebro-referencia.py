"""HELA · referência da forma do cérebro 3D (Design System da Sofia, 18/11/2026).

Gera a casca de pontos do cérebro (córtex com sulcos e fissura, lobo temporal, cerebelo e tronco),
separa os pontos por profundidade e pelo contorno (fresnel), escolhe posições de neurônio por região
do tipo de memória e liga as sinapses. Foi daqui que saiu o componente "Cérebro holográfico" do Figma.

Para o Three.js, porte `cerebro_pontos()` (coordenadas da cena: o cérebro tem ~2 de comprimento em x,
frontal em +x, topo em +y) e `regiao()` (região de cada tipo). A projeção e as camadas são só para a
prévia em 2D. Rodar: `python3 cerebro-referencia.py` gera cerebro.json e cerebro-previa.svg (e .png se
houver cairosvg). Sem dependências além da biblioteca padrão.
"""
import json, math, random, sys
random.seed(7)

def fib_esfera(n):
    pts = []
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        t = ga * i
        pts.append((math.cos(t) * r, y, math.sin(t) * r))
    return pts

def dentro_cortex(X, Y, Z):
    return (X / 1.0) ** 2 + ((Y - 0.08) / 0.64) ** 2 + (Z / 0.80) ** 2 < 1.0

def cerebro_pontos(n=3200):
    pts = []
    # hemisférios: elipsoide alongado com sulcos, base achatada e lobo temporal descendo
    for (x, y, z) in fib_esfera(n):
        theta = math.atan2(z, x); phi = math.acos(max(-1, min(1, y)))
        k = 1 + 0.05 * math.sin(14 * theta + 2.2 * math.sin(6 * phi)) * math.sin(10 * phi)
        X, Y, Z = x * 1.0 * k, y * 0.64 * k + 0.08, z * 0.80 * k
        nx, ny, nz = x, y / 0.64, z / 0.80
        temporal = -0.35 < X < 0.62 and abs(Z) > 0.35
        piso = -0.40 if temporal else -0.16
        if Y < piso:
            Y = piso + (Y - piso) * 0.30
        if X > 0.55 and Y < -0.05:  # base do lobo frontal mais reta
            Y = max(Y, -0.12 - (X - 0.55) * 0.2)
        if X < -0.70 and Y < -0.05:  # o occipital termina acima do cerebelo
            Y = max(Y, -0.08)
        if abs(Z) < 0.045 and Y > 0.12:  # fissura longitudinal
            continue
        pts.append((X, Y, Z, 'cortex', (nx, ny, nz)))
    # cerebelo, sob o occipital
    for (x, y, z) in fib_esfera(900):
        k = 1 + 0.07 * math.sin(30 * y + 3 * x)  # folhas finas
        X, Y, Z = -0.66 + x * 0.33 * k, -0.36 + y * 0.21, z * 0.58
        if dentro_cortex(X, Y, Z) and Y > -0.30:
            continue
        pts.append((X, Y, Z, 'cerebelo', (x, y, z)))
    # tronco
    for i in range(160):
        t = random.random(); a = random.random() * 2 * math.pi
        X = -0.26 + 0.08 * t + 0.11 * math.cos(a)
        Y = -0.30 - 0.50 * t
        Z = 0.11 * math.sin(a)
        pts.append((X, Y, Z, 'tronco', (math.cos(a), 0, math.sin(a))))
    return pts

YAW, PITCH = math.radians(-22), math.radians(12)
def projetar(p, cx, cy, escala):
    x, y, z = p[:3]
    return _proj(x, y, z, cx, cy, escala)

def girar(x, y, z):
    x1 = x * math.cos(YAW) + z * math.sin(YAW); z1 = -x * math.sin(YAW) + z * math.cos(YAW)
    y2 = y * math.cos(PITCH) - z1 * math.sin(PITCH); z2 = y * math.sin(PITCH) + z1 * math.cos(PITCH)
    return x1, y2, z2

def _proj(x, y, z, cx, cy, escala):
    # gira em y (yaw) e em x (pitch)
    x1 = x * math.cos(YAW) + z * math.sin(YAW); z1 = -x * math.sin(YAW) + z * math.cos(YAW)
    y2 = y * math.cos(PITCH) - z1 * math.sin(PITCH); z2 = y * math.sin(PITCH) + z1 * math.cos(PITCH)
    d = 3.6; f = 3.2 / (d - z2)
    return cx + x1 * f * escala, cy - y2 * f * escala, z2

def regiao(p):
    x, y, z, parte = p[:4]
    if parte == 'cerebelo':
        return 'procedural'
    if parte != 'cortex':
        return None
    if x > 0.48 and y > -0.15:
        return 'executiva'
    if -0.25 < x < 0.55 and -0.32 < y < 0.02 and abs(z) > 0.5:
        return 'episodica'
    if y > 0.38 and x < 0.42:
        return 'semantica'
    return None

def gerar(cx=380, cy=330, escala=330):
    pts = cerebro_pontos()
    proj = [(projetar(p, cx, cy, escala), p) for p in pts]
    zs = [pp[0][2] for pp in proj]; zmin, zmax = min(zs), max(zs)
    camadas = {'fundo': [], 'meio': [], 'frente': [], 'contorno': []}
    for (x, y, z), p in proj:
        t = (z - zmin) / (zmax - zmin)
        n = girar(*p[4]); nn = math.sqrt(sum(v * v for v in n)) or 1
        borda = abs(n[2] / nn) < 0.32
        nome = 'contorno' if (borda and t > 0.25) else ('fundo' if t < 0.38 else ('meio' if t < 0.62 else 'frente'))
        camadas[nome].append((round(x), round(y)))
    # neurônios
    alvo = {'executiva': 9, 'episodica': 11, 'semantica': 14, 'procedural': 7}
    cand = {k: [] for k in alvo}
    for (pp, p) in proj:
        r = regiao(p)
        if r and pp[2] > zmin + 0.25 * (zmax - zmin):  # só o que está visível de frente
            cand[r].append((pp, p))
    neur = []
    for tipo, n in alvo.items():
        random.shuffle(cand[tipo])
        escolhidos = []
        for pp, p in cand[tipo]:
            if all(math.dist(pp[:2], e[0][:2]) > 34 for e in escolhidos):
                escolhidos.append((pp, p))
            if len(escolhidos) == n:
                break
        for pp, p in escolhidos:
            imp = round(random.uniform(0.15, 1.0), 2)
            neur.append({'tipo': tipo, 'x': round(pp[0], 1), 'y': round(pp[1], 1), 'z': round(pp[2], 3),
                         'p3': [round(v, 3) for v in p[:3]], 'importancia': imp})
    # sinapses: 2 vizinhos mais próximos (3D) + algumas pontes entre regiões
    sin = set()
    for i, a in enumerate(neur):
        dist = sorted(((math.dist(a['p3'], b['p3']), j) for j, b in enumerate(neur) if j != i))
        for _, j in dist[:2]:
            sin.add(tuple(sorted((i, j))))
    tipos = {}
    for i, a in enumerate(neur):
        tipos.setdefault(a['tipo'], []).append(i)
    pares = [('executiva', 'semantica'), ('executiva', 'episodica'), ('episodica', 'semantica'),
             ('procedural', 'executiva'), ('semantica', 'procedural'), ('episodica', 'procedural')]
    for a, b in pares:  # a ponte entre duas regiões liga o par mais próximo
        par = min(((math.dist(neur[i]['p3'], neur[j]['p3']), i, j) for i in tipos[a] for j in tipos[b]))
        sin.add(tuple(sorted(par[1:])))
    sin = sorted(sin)
    ativas = random.sample(range(len(sin)), 6)
    return camadas, neur, [{'a': a, 'b': b, 'ativa': k in ativas} for k, (a, b) in enumerate(sin)]

def caminho_pontos(pts, lado):
    return ''.join(f'M{x} {y}h{lado}v{lado}h-{lado}z' for x, y in pts)

if __name__ == '__main__':
    camadas, neur, sin = gerar()
    dados = {
        'camadas': {k: caminho_pontos(v, {'fundo': 1, 'meio': 2, 'frente': 2, 'contorno': 2}[k]) for k, v in camadas.items()},
        'pontos': {k: ''.join(f'{x:03d}{y:03d}' for x, y in v) for k, v in camadas.items()},
        'contagem': {k: len(v) for k, v in camadas.items()},
        'neuronios': neur, 'sinapses': sin,
    }
    json.dump(dados, open('cerebro.json', 'w'))
    print({k: len(v) for k, v in dados['camadas'].items()}, dados['contagem'], len(neur), len(sin))
    cor = {'executiva': '#7CFF2E', 'episodica': '#22C983', 'semantica': '#C9D1CD', 'procedural': '#0B7A50'}
    op = {'fundo': 0.2, 'meio': 0.38, 'frente': 0.6, 'contorno': 0.95}
    s = ['<svg xmlns="http://www.w3.org/2000/svg" width="760" height="680"><rect width="760" height="680" fill="#020403"/>']
    for k in ('fundo', 'meio', 'frente', 'contorno'):
        s.append(f'<path d="{dados["camadas"][k]}" fill="{"#5EDDA6" if k == "contorno" else "#9EB3A6"}" opacity="{op[k]}"/>')
    for e in sin:
        a, b = neur[e['a']], neur[e['b']]
        s.append(f'<line x1="{a["x"]}" y1="{a["y"]}" x2="{b["x"]}" y2="{b["y"]}" stroke="{"#7CFF2E" if e["ativa"] else "#22C983"}" stroke-opacity="{0.9 if e["ativa"] else 0.35}" stroke-width="{1.5 if e["ativa"] else 1}"/>')
    for n in neur:
        r = 3 + 6 * n['importancia']
        s.append(f'<circle cx="{n["x"]}" cy="{n["y"]}" r="{r*2.2:.1f}" fill="{cor[n["tipo"]]}" opacity="0.18"/>')
        s.append(f'<circle cx="{n["x"]}" cy="{n["y"]}" r="{r:.1f}" fill="{cor[n["tipo"]]}"/>')
    s.append('</svg>')
    open('cerebro-previa.svg', 'w').write(''.join(s))
    try:
        import cairosvg
        cairosvg.svg2png(url='cerebro-previa.svg', write_to='cerebro-previa.png')
    except ImportError:
        pass
