"""Erros da HELA, com mensagens que a CLI, o MCP e a API podem mostrar como estão."""


class HelaError(Exception):
    """Base de todos os erros esperados da HELA."""


class NotFound(HelaError):
    """O id pedido não existe."""


class InvalidInput(HelaError):
    """Entrada recusada pela validação."""


class DuplicateContent(HelaError):
    """A edição deixaria o conteúdo igual ao de outra memória."""


class PhaseNotAvailable(HelaError):
    """Recurso que chega numa fase futura do projeto."""


def describe_validation_error(erro: Exception) -> str:
    """Resume um ValidationError do pydantic sem repetir o valor recebido.

    O texto padrão do pydantic traz `input_value=...`, que pode ser um segredo vindo da
    entrada. Aqui sai só o campo e o motivo.
    """
    erros = getattr(erro, "errors", None)
    if not callable(erros):
        return type(erro).__name__
    partes = []
    for e in erros():
        local = ".".join(str(p) for p in e.get("loc", ())) or "entrada"
        partes.append(f"{local}: {e.get('msg', 'inválido')}")
    return "; ".join(partes)
