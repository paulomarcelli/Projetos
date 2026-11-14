# Aurora criança (9 anos) · Prólogo

Ficha de referência: `arte/referencias/aurora-crianca-01.png` (gerada no Figma, modelo Gemini 3.1 Flash Image,
arquivo "Aurora criança · Prólogo"). Visual: cabelo prateado longo com duas tranças finas na frente, olhos violeta,
tiara fina de prata com uma lua crescente e uma pedra violeta, vestido de veludo verde-azulado com luas e estrelas
bordadas em prata, capinha branca de pele presa com um broche de lua, meias brancas e botinhas marrons.
É a noite da festa de inverno, antes do massacre: o cabelo ainda não foi tingido.

O Prólogo (roteiro) pede: correr e pular pelo castelo e, depois que as luzes se apagam, chegar à capela **sem ser vista**
(furtividade) e se esconder sob o altar. Animações necessárias abaixo.

## Folhas já geradas (Figma, modelo Gemini 3.1 Flash Image)

Arquivo do Figma "Aurora criança · Prólogo". Originais em `arte/poses-originais/` (1376×768, não editar):

| Folha | Quadros | Arquivo |
|---|---|---|
| K1 parada (respira e pisca) | 3 | `crianca_parada.png` |
| K2 correndo, 1ª metade | 4 | `crianca_correndo1.png` |
| K2 correndo, 2ª metade | 4 | `crianca_correndo2.png` |
| K3 pulo | 4 | `crianca_pulo.png` |
| K4 andando escondida | 4 | `crianca_furtiva.png` |
| K5 escondida | 3 | `crianca_escondida.png` |

**Recorte:** a capinha de pele e as meias são brancas, e o recorte normal apaga áreas brancas fechadas (feito para o vão
entre o arco e a corda). Use sempre `--manter-brancos` nessas folhas:

```bash
python3 ferramentas/fatiar_folha.py arte/poses-originais/crianca_correndo1.png --nomes c_correndo1:4 --saida arte/sprites/recortes --manter-brancos
```

O gerador do Figma só aceita texto (sem imagem de referência), então cada prompt repete a descrição completa da menina.
Para refazer uma folha com a ficha anexada, use os prompts abaixo no Gemini.

## Como pedir ao Gemini

1. Anexe `arte/referencias/aurora-crianca-01.png` em todo prompt.
2. No máximo 4 quadros por imagem, mande como **arquivo** (não colado).
3. Cole sempre este bloco no fim:

```
Folha de sprites horizontal com os quadros lado a lado, na ordem, com bastante espaço branco entre eles.
Todos os quadros na MESMA escala e com os pés na MESMA linha do chão. Imagem grande e nítida, contorno limpo,
sem desfoque, sem rastros, sem sombra no chão. Fundo branco liso. Mesma menina da imagem de referência: manter
rosto, cabelo, tiara, vestido, capinha e botas. Estilo igual: anime suave, contorno marrom-escuro. Sem texto.
```

## Prompts

**K1 · PARADA (3 quadros, respiração):**
```
A menina da referência de perfil, voltada para a direita, parada, respirando: quadro 1 inspira, quadro 2 expira
(ombros um pouco mais baixos), quadro 3 igual ao 1 com os olhos fechados (piscando).
```

**K2 · CORRENDO (4 quadros + outra imagem com mais 4 = ciclo de 8):**
```
A menina da referência de perfil, voltada para a direita, CORRENDO alegre pelo salão (ciclo de corrida, quadros
[1 a 4 | 5 a 8]): passos curtos de criança, braços balançando, a capinha e o cabelo voando para trás.
```

**K3 · PULO (4 quadros):**
```
A menina da referência de perfil, voltada para a direita, pulando: 1 agacha para pegar impulso, 2 subindo com os
braços para cima, 3 no alto com as pernas dobradas, 4 caindo para aterrissar. Cabelo e capinha reagindo ao movimento.
```

**K4 · ANDANDO ESCONDIDA (4 quadros, furtividade):**
```
A menina da referência de perfil, voltada para a direita, andando agachada e devagar, com medo, nas pontas dos pés,
uma mão na frente da boca, olhos arregalados, ciclo de 4 quadros de passos silenciosos.
```

**K5 · ESCONDIDA (3 quadros):**
```
A menina da referência encolhida no chão, abraçando os joelhos, de perfil voltada para a direita, olhando para a
frente por uma fresta, assustada: quadro 1 respira rápido, quadro 2 prende a respiração, quadro 3 fecha os olhos com força.
```

Depois de recebidas: fatiar com `ferramentas/fatiar_folha.py` e registrar num grupo novo em `ferramentas/montar_folha.py`
(a menina é menor: medir a altura da cabeça e definir uma escala própria, pois a criança tem cerca de 4 cabeças de altura).
