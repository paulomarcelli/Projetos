"""CLI `hela`: status, export, import (Fase 2); procedure, classifier, evolution (Fase 3).

Códigos de saída: 0 sucesso; 1 erro (mensagem em stderr); 3 comando de outra fase.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from hela import __version__
from hela._fases import CODIGO_OUTRA_FASE, avisar
from hela.core.errors import HelaError

# Comandos previstos no plano que ainda não existem: (fase, o que fazem).
_OUTRAS_FASES = {
    "dashboard": ("Fase 5", "abrir o dashboard no navegador"),
    "doctor": ("Fase 6", "diagnóstico da instalação"),
}


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="hela", description="HELA: memória cognitiva local para o Claude Code.")
    p.add_argument("--version", action="version", version=f"hela {__version__}")
    sub = p.add_subparsers(dest="comando", required=True)

    st = sub.add_parser("status", help="estado do banco e das memórias")
    st.add_argument("--json", action="store_true", help="saída em JSON")

    ex = sub.add_parser("export", help="exporta as memórias em JSON versionado")
    ex.add_argument("--out", type=Path, help="arquivo de saída (sem ele, imprime no stdout)")
    ex.add_argument("--include-quarantined", action="store_true",
                    help="inclui as memórias em quarentena (fora por padrão)")

    im = sub.add_parser("import", help="importa um arquivo de exportação (a redação é reaplicada)")
    im.add_argument("arquivo", help="caminho do JSON, ou - para ler do stdin")
    im.add_argument("--trusted", action="store_true",
                    help="backup seu, assinado por esta instalação: mantém status, qualidade e contadores "
                         "(só em terminal interativo, com confirmação; a quarentena continua valendo)")
    im.add_argument("--dry-run", action="store_true", help="mostra o que entraria, sem gravar nada")

    pr = sub.add_parser("procedure", help="procedimentos: listar, ver, aprovar script (decisão humana) e revogar")
    prs = pr.add_subparsers(dest="acao", required=True)
    prl = prs.add_parser("list", help="lista os procedimentos")
    prl.add_argument("--query", help="busca pelo texto")
    prs.add_parser("show", help="mostra um procedimento com o script e a validação").add_argument("id")
    pra = prs.add_parser("approve", help="aprova o script revisado (exige o sha256 exato)")
    pra.add_argument("id")
    pra.add_argument("--sha256", required=True, help="sha256 do script que você revisou (mostrado em show)")
    pra.add_argument("--acknowledge-findings", action="store_true",
                     help="aprova mesmo com achados do validador (eles continuam pedindo um humano)")
    prs.add_parser("revoke", help="revoga a aprovação").add_argument("id")

    cl = sub.add_parser("classifier", help="classificador de tarefas: modo ativo e treino")
    cl.add_argument("acao", choices=["status", "train"])

    ev = sub.add_parser("evolution", help="propostas de melhoria: listar, propor, aplicar e desfazer")
    evs = ev.add_subparsers(dest="acao", required=True)
    evs.add_parser("list", help="lista as propostas")
    evs.add_parser("propose", help="gera e testa propostas (nada é aplicado sozinho)")
    evs.add_parser("apply", help="aplica uma proposta testada").add_argument("id", type=int)
    evs.add_parser("rollback", help="desfaz uma proposta aplicada").add_argument("id", type=int)

    for nome, (fase, o_que) in _OUTRAS_FASES.items():
        sub.add_parser(nome, help=f"{o_que} ({fase})")
    return p


def _status(eng, como_json: bool) -> None:
    s = eng.stats()
    if como_json:
        print(json.dumps(s, ensure_ascii=False, indent=2))
        return
    mem = s["memories"]
    linhas = [
        f"HELA {__version__}",
        f"pasta:        {s['home']}",
        f"banco:        {s['db_path']} ({s['db_bytes'] / 1024:.0f} KB, esquema v{s['schema_version']}, {s['journal_mode']})",
        f"embedder:     {s['embedder']}",
        f"config.json:  {'sim' if s['config_file'] else 'não (valem os padrões)'}",
        f"memórias:     {mem['total']}",
    ]
    linhas += [f"  {k}: {v}" for k, v in sorted(mem["by_kind"].items())]
    linhas.append("por status:   " + (", ".join(f"{k} {v}" for k, v in sorted(mem["by_status"].items())) or "-"))
    linhas.append(f"relações:     {s['relationships']}")
    linhas.append(f"eventos:      {s['events']}")
    print("\n".join(linhas))


def _confirmar_trusted(arquivo: str) -> bool:
    """--trusted só para uma pessoa no terminal (revisão da Fase 2, seção 3).

    O Bash do Claude não tem terminal: uma injeção que mande rodar `hela import --trusted` para aqui.
    """
    if arquivo == "-":
        print("hela: erro: --trusted não lê do stdin; informe o arquivo do backup", file=sys.stderr)
        return False
    if not sys.stdin.isatty():
        print("hela: erro: --trusted só funciona num terminal interativo (com uma pessoa confirmando)",
              file=sys.stderr)
        return False
    resposta = input(f"O arquivo {arquivo} é um backup seu, feito pelo 'hela export' desta instalação? [s/N] ")
    if resposta.strip().lower() not in ("s", "sim", "y", "yes"):
        print("hela: import cancelado", file=sys.stderr)
        return False
    return True


def _json(dados: object) -> None:
    print(json.dumps(dados, ensure_ascii=False, indent=2, default=str))


def main(argv: Optional[list[str]] = None) -> int:
    args = _parser().parse_args(argv)
    if args.comando in _OUTRAS_FASES:
        fase, o_que = _OUTRAS_FASES[args.comando]
        avisar(f"hela {args.comando}", fase, o_que)
        return CODIGO_OUTRA_FASE

    from hela.core.engine import Engine  # import aqui: --version e avisos não abrem o banco

    try:
        with Engine() as eng:
            if args.comando == "status":
                _status(eng, args.json)
            elif args.comando == "export":
                if args.out:
                    n = eng.export_to_file(args.out, include_quarantined=args.include_quarantined)
                    print(f"{n} memória{'s' if n != 1 else ''} exportada{'s' if n != 1 else ''} para {args.out}",
                          file=sys.stderr)
                else:
                    print(json.dumps(eng.export_data(include_quarantined=args.include_quarantined),
                                     ensure_ascii=False, indent=2))
            elif args.comando == "import":
                if args.trusted and not _confirmar_trusted(args.arquivo):
                    return 1
                opcoes = {"trusted": args.trusted, "dry_run": args.dry_run}
                rel = (eng.import_data(sys.stdin.buffer.read(), **opcoes) if args.arquivo == "-"
                       else eng.import_file(Path(args.arquivo), **opcoes))
                if args.dry_run:
                    print("simulação (nada foi gravado)")
                print(f"criadas: {rel.created}, duplicadas: {rel.duplicates}, em quarentena: {rel.quarantined}, "
                      f"trechos redigidos: {rel.redactions}, relações: {rel.relationships} "
                      f"(puladas: {rel.skipped_relationships})")
            elif args.comando == "procedure":
                if args.acao == "list":
                    lista = eng.procedure(action="list", query=args.query, limit=50)["procedures"]
                    _json([{k: p[k] for k in ("id", "name", "exec_class", "approved", "script_sha256")} for p in lista])
                elif args.acao == "show":
                    _json({k: v for k, v in eng.procedures.get(args.id).items() if k != "context"})
                elif args.acao == "approve":
                    _json(eng.procedures.approve(args.id, args.sha256, args.acknowledge_findings, approver="cli"))
                else:
                    _json(eng.procedures.revoke(args.id))
            elif args.comando == "classifier":
                _json(eng.classifier.status() if args.acao == "status" else eng.classifier.train().as_dict())
            elif args.comando == "evolution":
                if args.acao == "list":
                    _json(eng.evolution.list())
                elif args.acao == "propose":
                    _json(eng.evolution.propose())
                elif args.acao == "apply":
                    _json(eng.evolution.apply(args.id))
                else:
                    _json(eng.evolution.rollback(args.id))
        return 0
    except (HelaError, ValueError) as erro:
        print(f"hela: erro: {erro}", file=sys.stderr)
        return 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
