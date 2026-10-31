"""Erros dos documentos com código estável e mensagem pública fixa.

As mensagens são escritas aqui, nunca copiadas de exceções: assim uma resposta da API não tem como
vazar caminho interno, URL de banco ou detalhe de implementação.
"""

from __future__ import annotations


class ErroDocumento(Exception):
    def __init__(self, status: int, codigo: str, mensagem: str) -> None:
        super().__init__(mensagem)
        self.status = status
        self.codigo = codigo
        self.mensagem = mensagem


def extensao_invalida() -> ErroDocumento:
    return ErroDocumento(415, "unsupported_extension", "Só são aceitos arquivos com extensão .pdf.")


def tipo_invalido() -> ErroDocumento:
    return ErroDocumento(
        415, "unsupported_media_type", "O tipo declarado do arquivo deve ser application/pdf."
    )


def assinatura_invalida() -> ErroDocumento:
    return ErroDocumento(
        415, "invalid_signature", "O conteúdo não é um PDF (falta a assinatura %PDF no início)."
    )


def arquivo_vazio() -> ErroDocumento:
    return ErroDocumento(400, "empty_file", "O arquivo enviado está vazio.")


def arquivo_grande(max_mb: int) -> ErroDocumento:
    return ErroDocumento(
        413, "file_too_large", f"O arquivo passa do limite de {max_mb} MB por documento."
    )


def pdf_corrompido() -> ErroDocumento:
    return ErroDocumento(422, "corrupted_pdf", "O PDF está corrompido ou não pôde ser lido.")


def pdf_protegido() -> ErroDocumento:
    return ErroDocumento(
        422, "encrypted_pdf", "O PDF é protegido por senha; envie uma versão sem proteção."
    )


def paginas_demais(max_paginas: int) -> ErroDocumento:
    return ErroDocumento(
        422, "too_many_pages", f"O PDF passa do limite de {max_paginas} páginas por documento."
    )


def metadados_invalidos(campos: list[str]) -> ErroDocumento:
    return ErroDocumento(
        422, "invalid_metadata", "Metadados inválidos nos campos: " + ", ".join(campos) + "."
    )


def nao_encontrado() -> ErroDocumento:
    return ErroDocumento(404, "not_found", "Documento não encontrado.")


def em_processamento() -> ErroDocumento:
    return ErroDocumento(
        409, "document_processing", "O documento está sendo processado; tente de novo depois."
    )


def banco_nao_configurado() -> ErroDocumento:
    return ErroDocumento(
        503, "database_not_configured", "O banco de dados não está configurado neste servidor."
    )


def banco_indisponivel() -> ErroDocumento:
    return ErroDocumento(503, "database_unavailable", "O banco de dados está indisponível.")


def armazenamento_indisponivel() -> ErroDocumento:
    return ErroDocumento(503, "storage_unavailable", "O armazenamento de arquivos falhou.")


# Falhas de PROCESSAMENTO gravadas no documento (status `failed`): código → mensagem fixa.
FALHAS_DE_PROCESSAMENTO: dict[str, str] = {
    "file_missing": "O arquivo do documento não foi encontrado no armazenamento.",
    "pdf_unreadable": "O PDF não pôde ser aberto durante o processamento.",
    "extraction_failed": "A extração de texto falhou em todas as páginas.",
    "processing_error": "Erro inesperado durante o processamento.",
}
