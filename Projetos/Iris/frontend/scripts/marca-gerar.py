# Gera os SVGs da marca IRIS (public/recursos/icones/marca* e public/favicon.svg, favicon) e a geometria usada pelo componente Marca.
# Uso, a partir de uma pasta temporária:
#   python3 marca-wordmark.py <source-serif-4-latin-wght-normal.woff2> 600 0.14
#   python3 marca-gerar.py
# Depois copie os .svg para public/recursos/icones/marca/ e a geometria (geometria.json) para src/config/marca-geometria.ts.
# Requer fonttools (pip install fonttools brotli).
import math, json
path = open("wordmark.path").read()
x0,y0,x1,y1 = map(float, open("wordmark.bbox").read().split())
# --- símbolo (grade 32×32) -------------------------------------------------
C=(14.5,17.5); R=10.0
def p(a): return (C[0]+R*math.cos(math.radians(a)), C[1]+R*math.sin(math.radians(a)))
a1,a2 = p(-18), p(-72)
anel = f"M{a1[0]:.3f} {a1[1]:.3f}A{R} {R} 0 1 1 {a2[0]:.3f} {a2[1]:.3f}"
simbolo = {"anel":anel,"pupila":[17.2,14.8,3.8],"no":[26.2,5.8,2.6]}
def simb_svg(tinta, acento, extra=""):
    return (f'<path d="{anel}" fill="none" stroke="{tinta}" stroke-width="2.6" stroke-linecap="round"/>'
            f'<circle cx="17.2" cy="14.8" r="3.8" fill="{tinta}"/>'
            f'<circle cx="26.2" cy="5.8" r="2.6" fill="{acento}"/>')
TONS = {"escuro":("#F3F6FA","#52C7E8","#0B1220"), "claro":("#0B1220","#0A6F91","#FFFFFF")}
# --- wordmark: altura de maiúscula = 0.5 × altura do símbolo ----------------
H=32.0; cap=y1-y0; esc=(H*0.42)/cap
larg=(x1-x0)*esc; gap=H*0.34
ox = H+gap - x0*esc
oy = C[1] + (H*0.42)/2 - y1*esc  # centra as maiúsculas na pupila
W = H+gap+larg+1
def wm(tinta): return f'<path transform="translate({ox:.3f} {oy:.3f}) scale({esc:.5f})" fill="{tinta}" d="{path}"/>'
for t,(tinta,acento,fundo) in TONS.items():
    open(f"iris-simbolo-{t}.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="IRIS">{simb_svg(tinta,acento)}</svg>')
    open(f"iris-horizontal-{t}.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} 32" role="img" aria-label="IRIS">{simb_svg(tinta,acento)}{wm(tinta)}</svg>')
# favicon: símbolo sobre ladrilho escuro, levemente ampliado para ocupar o quadro
open("favicon.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0B1220"/><g transform="translate(16 16) scale(0.86) translate(-16 -16)">{simb_svg("#F3F6FA","#52C7E8")}</g></svg>')
json.dump({"simbolo":simbolo,"wordmark":{"d":path,"tx":round(ox,3),"ty":round(oy,3),"escala":round(esc,5),"largura":round(W,2)}}, open("geometria.json","w"))
print(W, ox, oy, esc)
