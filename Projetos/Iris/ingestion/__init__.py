"""Ingestão de documentos científicos em PDF (Fase 2).

Módulos:
- `storage`: guarda os PDFs em disco (STORAGE_DIR) com nomes gerados, nunca o nome enviado.
- `validation`: confere extensão, tipo declarado, assinatura `%PDF` e estrutura do arquivo.
- `normalization`: limpeza conservadora do texto (não resume, não traduz, não interpreta).
- `extraction`: texto página por página com o pypdf (sem OCR).
- `metadata`: metadados bibliográficos (do usuário, do PDF ou heurística segura; senão NULL).
- `processing`: transforma um documento `pending` em `completed` ou `failed`.
- `service`: casos de uso chamados pelas rotas (upload, listagem, detalhe, páginas, remoção).
"""
