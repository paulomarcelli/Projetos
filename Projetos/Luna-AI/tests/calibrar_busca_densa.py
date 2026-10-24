"""Calibração dos limiares da busca híbrida (usa a API de embeddings, precisa da chave).

Compara a similaridade (cosseno) do melhor trecho da biblioteca para frases RELEVANTES
(sofrimento, relações, estresse...) e IRRELEVANTES (piada, receita, saudação) e mostra se
algum critério separa os dois grupos. Os valores de rag/recuperador.py (SIM_ALTA e SIM_MEDIA)
vieram deste experimento. Rode de novo ao trocar de modelo de embeddings ou de biblioteca,
e acrescente frases reais da sua conversa em RELEVANTES e IRRELEVANTES.

    python tests/calibrar_busca_densa.py

No plano gratuito os embeddings são limitados a 100 textos por minuto; a primeira execução
monta o índice da biblioteca (alguns minutos) e guarda em conhecimento/.cache/.
"""

import os
import sys
import time
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PASTA))

from rag.indice import embedder_gemini  # noqa: E402
from rag.ingestao import carregar_biblioteca  # noqa: E402
from rag.recuperador import Recuperador  # noqa: E402

MODELO = os.environ.get("LUNA_EMBEDDING_MODELO", "gemini-embedding-001")
RELEVANTES = [
    "Fico revivendo a conversa de ontem na minha cabeça sem parar",
    "Acordo sem vontade de fazer nada e nada me anima mais",
    "Meu parceiro me deixou e a casa ficou vazia",
    "Sinto que todo mundo é melhor do que eu",
    "Perdi alguém que eu amava muito",
    "Não consigo desligar a cabeça à noite, só penso em problemas",
    "Estou sobrecarregada com tantas tarefas, não aguento mais o ritmo",
    "Briguei feio com minha mãe e agora me sinto péssima",
    "Tenho medo de falar em público e ser julgado",
    "Meu corpo está cansado mas eu não consigo dormir direito",
    "Acho que sou um fracasso e vou decepcionar todo mundo",
    "Sinto um aperto no peito antes de qualquer prova",
]
IRRELEVANTES = [
    "Qual é a capital da França?", "oi, tudo bem?", "Me conta uma piada", "Como faço um bolo de chocolate?",
    "Qual o melhor time de futebol do Brasil?", "Quanto é 15 vezes 12?", "Que horas são agora?",
    "Obrigada pela ajuda!", "Me recomenda um filme para o fim de semana", "Como configuro o roteador wifi?",
    "Boa noite, Luna", "Quem descobriu o Brasil?",
]


def main():
    if not (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")):
        print("Defina GEMINI_API_KEY para calibrar.")
        return 2
    rec = Recuperador(carregar_biblioteca(PASTA / "conhecimento"), embedder=embedder_gemini(MODELO),
                      cache_embeddings=PASTA / "conhecimento" / ".cache" / f"embeddings-{MODELO}.json")
    if not rec.denso:
        print("Não foi possível montar o índice denso (veja os avisos acima).")
        return 1

    def melhor(frase):
        time.sleep(0.7)                                    # folga para o limite por minuto
        return rec.denso.buscar(frase, rec.permitidos)[0][1]

    relevantes = [melhor(f) for f in RELEVANTES]
    irrelevantes = [melhor(f) for f in IRRELEVANTES]
    print(f"Relevantes:   {min(relevantes):.3f} a {max(relevantes):.3f}")
    print(f"Irrelevantes: {min(irrelevantes):.3f} a {max(irrelevantes):.3f}")
    folga = min(relevantes) - max(irrelevantes)
    print("Os grupos se separam." if folga > 0 else f"Os grupos se sobrepõem em {-folga:.3f}: por isso a decisão combina embeddings com palavras em comum.")
    print(f"Limiares em uso: SIM_ALTA={rec.sim_alta} (basta sozinha) · SIM_MEDIA={rec.sim_media} (exige palavra em comum)")
    acima = sum(x >= rec.sim_alta for x in irrelevantes)
    print(f"Irrelevantes que passariam pela SIM_ALTA: {acima} de {len(irrelevantes)} (o ideal é 0)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
