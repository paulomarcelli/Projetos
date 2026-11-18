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
