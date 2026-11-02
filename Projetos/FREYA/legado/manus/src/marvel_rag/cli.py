import argparse, json
from .engine import MarvelKnowledge

def main():
    p = argparse.ArgumentParser(description="Mecanismos de recuperação MCU: hybrid ou graph")
    sub = p.add_subparsers(dest="command", required=True)
    ing = sub.add_parser("ingest"); ing.add_argument("--corpus", default="data/corpus.jsonl")
    for mode in ("hybrid", "graph"):
        q = sub.add_parser(mode); q.add_argument("question"); q.add_argument("-k", type=int, default=5)
    args = p.parse_args(); engine = MarvelKnowledge()
    try:
        if args.command == "ingest": out = engine.ingest(args.corpus)
        elif args.command == "hybrid": out = engine.hybrid_search(args.question, args.k)
        else: out = engine.graph_search(args.question, args.k)
        print(json.dumps(out, ensure_ascii=False, indent=2))
    finally: engine.close()

if __name__ == "__main__": main()
