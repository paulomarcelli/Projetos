import sys
sys.path.insert(0, sys.argv[0].rsplit('/', 1)[0])
from pck import ler, gravar
orig, saida, *scripts = sys.argv[1:]
cab, ents = ler(orig)
for s in scripts:  # ex.: scripts/luta.gd
    r = 'res://' + s
    ents = [e for e in ents if e[0] not in (r + '.remap', r[:-3] + '.gdc')]
    ents.append([r, open(s, 'rb').read(), 0])
gravar(saida, cab, ents)
print('ok', len(ents))
