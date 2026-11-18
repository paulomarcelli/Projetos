"""Strategy Ranker (em construção nesta tarefa: pesos padrão)."""

DEFAULT_WEIGHTS: dict[str, float] = {
    "success": 0.45, "quality": 0.2, "tokens": 0.1, "duration": 0.1, "attempts": 0.1, "compute": 0.05,
}
