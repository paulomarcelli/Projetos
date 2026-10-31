# Gera o contorno vetorial do wordmark "IRIS" a partir da Source Serif 4 (peso 600),
# para que os SVGs da marca não dependam da fonte instalada.
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
src, peso, track = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
f = TTFont(src)
axes = {a.axisTag: a for a in f["fvar"].axes}
loc = {"wght": peso}
if "opsz" in axes: loc["opsz"] = axes["opsz"].maxValue
f = instantiateVariableFont(f, loc)
gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f["head"].unitsPerEm
x = 0; partes = []; bb = [1e9,1e9,-1e9,-1e9]
for ch in "IRIS":
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    tp = TransformPen(pen, (1,0,0,-1,x,0))
    gs[g].draw(tp)
    b = BoundsPen(gs); gs[g].draw(b)
    if b.bounds:
        x0,y0,x1,y1 = b.bounds
        bb = [min(bb[0],x+x0), min(bb[1],-y1), max(bb[2],x+x1), max(bb[3],-y0)]
    partes.append(pen.getCommands())
    x += gs[g].width + track*upm
print(upm, bb)
open("wordmark.path","w").write(" ".join(partes))
open("wordmark.bbox","w").write(" ".join(str(round(v,1)) for v in bb))
