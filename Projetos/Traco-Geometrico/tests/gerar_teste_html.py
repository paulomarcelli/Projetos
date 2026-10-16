# Gera tests/teste.html a partir do index.html: troca o Phaser do CDN pelo arquivo local
# e ajusta os caminhos (o teste fica dentro da pasta tests/)
import re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
html = (raiz / 'index.html').read_text(encoding='utf-8')
html = html.replace('https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js', '../phaser.local.min.js')
html = html.replace('href="style.css"', 'href="../style.css"')
html = re.sub(r'src="(js/[^"]+|main\.js)"', r'src="../\1"', html)
(raiz / 'tests' / 'teste.html').write_text(html, encoding='utf-8')
print('tests/teste.html gerado')
