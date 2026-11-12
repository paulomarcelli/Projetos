#!/usr/bin/env python3
"""Gera os fluxos do n8n (01 e 02) a partir dos arquivos em n8n/codigo/ e do perfil.md.

Uso: python n8n/montar_fluxos.py
Edite o código em n8n/codigo/*.js e o seu perfil em perfil.md, e rode de novo.
"""
import json
import uuid
from pathlib import Path

PASTA = Path(__file__).resolve().parent
COD = PASTA / "codigo"
PERFIL = (PASTA.parent / "perfil.md").read_text(encoding="utf-8").strip()
NOTION_DB = "e4d8a79cb87948ceadad7ec8504a6977"
LLM_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
LLM_MODELO = "gemini-2.5-flash"

ler = lambda nome: (COD / nome).read_text(encoding="utf-8")
comum = ler("comum.js")
# extrair_vagas.js sem o module.exports (dentro do n8n não existe module)
extrator = "\n".join(l for l in ler("extrair_vagas.js").splitlines() if not l.startswith("if (typeof module"))
uid = lambda semente: str(uuid.uuid5(uuid.NAMESPACE_URL, "cacador-de-vagas/" + semente))


def codigo(nome, js, pos):
    return {"id": uid(nome), "name": nome, "type": "n8n-nodes-base.code", "typeVersion": 2,
            "position": pos, "parameters": {"jsCode": js}}


def config(pos):
    campos = [
        ("perfil", PERFIL, "string"),
        ("notion_database_id", NOTION_DB, "string"),
        ("llm_url", LLM_URL, "string"),
        ("llm_modelo", LLM_MODELO, "string"),
        ("nota_minima_resumo", 7, "number"),
        ("email_resumo", "seu-email@gmail.com", "string"),
    ]
    return {"id": uid("Configuração"), "name": "Configuração", "type": "n8n-nodes-base.set", "typeVersion": 3.4,
            "position": pos,
            "parameters": {"mode": "manual", "includeOtherFields": True, "options": {},
                           "assignments": {"assignments": [
                               {"id": uid("cfg-" + n), "name": n, "value": v, "type": t} for n, v, t in campos]}}}


def http(nome, url, corpo_expr, pos, cabecalhos=None, lote_ms=None, continuar=False, timeout=None):
    opcoes = {}
    if lote_ms:
        opcoes["batching"] = {"batch": {"batchSize": 1, "batchInterval": lote_ms}}
    if timeout:
        opcoes["timeout"] = timeout
    no = {"id": uid(nome), "name": nome, "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": pos,
          "parameters": {"method": "POST", "url": url, "authentication": "genericCredentialType",
                         "genericAuthType": "httpHeaderAuth", "sendBody": True, "specifyBody": "json",
                         "jsonBody": corpo_expr, "options": opcoes}}
    if cabecalhos:
        no["parameters"]["sendHeaders"] = True
        no["parameters"]["headerParameters"] = {"parameters": [{"name": k, "value": v} for k, v in cabecalhos.items()]}
    if continuar:
        no["onError"] = "continueRegularOutput"
        no["retryOnFail"] = True
        no["maxTries"] = 3
        no["waitBetweenTries"] = 5000
    return no


def nota(nome, texto, pos, w=420, h=300, cor=7):
    return {"id": uid(nome), "name": nome, "type": "n8n-nodes-base.stickyNote", "typeVersion": 1, "position": pos,
            "parameters": {"content": texto, "width": w, "height": h, "color": cor}}


def ligar(*pares):
    con = {}
    for de, para in pares:
        con.setdefault(de, {"main": [[]]})["main"][0].append({"node": para, "type": "main", "index": 0})
    return con


NOTION_HDR = {"Notion-Version": "2022-06-28"}
CFG = "$('Configuração').first().json"

# ---------------------------------------------------------------- Fluxo 01
f1 = {
    "name": "Caçador de Vagas · 01 alertas do LinkedIn",
    "nodes": [
        nota("Leia antes", "## 🎯 Caçador de Vagas\n\n1. Teste primeiro com **Testar com e-mail de exemplo** (botão *Execute workflow*).\n"
             "2. Escolha as credenciais nos nós **Novo alerta no e-mail**, **Já está no Notion?**, **Nota da IA**, "
             "**Salvar no Notion** e **Enviar resumo**.\n3. Troque o e-mail em **Configuração**.\n"
             "4. Publique o fluxo (Publish/Active) para ele rodar sozinho a cada alerta.\n\nPasso a passo completo no README.",
             [-560, -380], 460, 300, 4),
        {"id": uid("imap"), "name": "Novo alerta no e-mail", "type": "n8n-nodes-base.emailReadImap", "typeVersion": 2.1,
         "position": [-480, 0],
         "parameters": {"mailbox": "Vagas", "postProcessAction": "read", "format": "simple",
                        "downloadAttachments": False, "options": {"customEmailConfig": "[\"UNSEEN\"]"}}},
        {"id": uid("manual"), "name": "Testar com e-mail de exemplo", "type": "n8n-nodes-base.manualTrigger",
         "typeVersion": 1, "position": [-480, 200], "parameters": {}},
        codigo("E-mail de exemplo", ler("exemplo_email.js"), [-260, 200]),
        config([-40, 0]),
        codigo("Extrair vagas", extrator + "\n\n" + ler("extrair_no.js"), [180, 0]),
        http("Já está no Notion?", f"=https://api.notion.com/v1/databases/{{{{ {CFG}.notion_database_id }}}}/query",
             "={{ JSON.stringify($json.consulta) }}", [400, 0], NOTION_HDR, lote_ms=400),
        codigo("Só vagas novas", comum + "\n" + ler("so_novas.js"), [620, 0]),
        http("Nota da IA", f"={{{{ {CFG}.llm_url }}}}", "={{ JSON.stringify($json.pedido_ia) }}", [840, 0],
             lote_ms=5000, continuar=True, timeout=120000),
        codigo("Montar página", comum + "\n" + ler("montar_pagina.js"), [1060, 0]),
        http("Salvar no Notion", "https://api.notion.com/v1/pages", "={{ JSON.stringify($json.corpo_pagina) }}",
             [1280, 0], NOTION_HDR, lote_ms=400),
        codigo("Montar resumo", comum + "\n" + ler("montar_resumo.js"), [1500, 0]),
        {"id": uid("smtp"), "name": "Enviar resumo", "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1,
         "position": [1720, 0],
         "parameters": {"fromEmail": f"={{{{ {CFG}.email_resumo }}}}", "toEmail": f"={{{{ {CFG}.email_resumo }}}}",
                        "subject": "={{ $json.assunto }}", "emailFormat": "html", "html": "={{ $json.html }}",
                        "options": {"appendAttribution": False}}},
    ],
    "connections": ligar(
        ("Novo alerta no e-mail", "Configuração"),
        ("Testar com e-mail de exemplo", "E-mail de exemplo"),
        ("E-mail de exemplo", "Configuração"),
        ("Configuração", "Extrair vagas"),
        ("Extrair vagas", "Já está no Notion?"),
        ("Já está no Notion?", "Só vagas novas"),
        ("Só vagas novas", "Nota da IA"),
        ("Nota da IA", "Montar página"),
        ("Montar página", "Salvar no Notion"),
        ("Salvar no Notion", "Montar resumo"),
        ("Montar resumo", "Enviar resumo"),
    ),
    "settings": {"executionOrder": "v1", "timezone": "America/Sao_Paulo"},
    "pinData": {},
}

# ---------------------------------------------------------------- Fluxo 02
campos_form = [
    {"fieldLabel": "Título da vaga", "requiredField": True, "placeholder": "Ex.: Estágio em Dados"},
    {"fieldLabel": "Empresa"},
    {"fieldLabel": "Link da vaga", "placeholder": "https://www.linkedin.com/jobs/view/..."},
    {"fieldLabel": "Descrição da vaga", "fieldType": "textarea", "requiredField": True,
     "placeholder": "Cole aqui a descrição completa da vaga"},
    {"fieldLabel": "Perguntas do formulário", "fieldType": "textarea",
     "placeholder": "Uma pergunta por linha (opcional)"},
]
f2 = {
    "name": "Caçador de Vagas · 02 analisar uma vaga",
    "nodes": [
        nota("Leia antes", "## 📝 Analisar uma vaga\n\nCole a descrição completa e as perguntas do formulário. A IA dá a nota, "
             "escreve as respostas com os seus projetos reais e salva tudo no Notion.\n\n"
             "Formulário (com o fluxo publicado): **http://localhost:5678/form/analisar-vaga**",
             [-520, -340], 440, 240, 4),
        {"id": uid("form"), "name": "Formulário: analisar vaga", "type": "n8n-nodes-base.formTrigger",
         "typeVersion": 2.3, "position": [-460, 0], "webhookId": uid("form-webhook"),
         "parameters": {"formTitle": "Analisar uma vaga",
                        "formDescription": "Cole a descrição da vaga e as perguntas do formulário. A análise aparece na próxima tela e fica salva no Notion.",
                        "formFields": {"values": campos_form},
                        "options": {"path": "analisar-vaga", "buttonLabel": "Analisar", "appendAttribution": False}}},
        config([-240, 0]),
        codigo("Pedido para a IA", comum + "\n" + ler("f2_pedido.js"), [-20, 0]),
        http("IA analisa", f"={{{{ {CFG}.llm_url }}}}", "={{ JSON.stringify($json.pedido_ia) }}", [200, 0],
             continuar=True, timeout=180000),
        codigo("Montar análise", comum + "\n" + ler("f2_montar.js"), [420, 0]),
        http("Salvar no Notion", "https://api.notion.com/v1/pages", "={{ JSON.stringify($json.corpo_pagina) }}",
             [640, 0], NOTION_HDR, continuar=True),
        codigo("Página de resultado", comum + "\n" + ler("f2_resposta.js"), [860, 0]),
        {"id": uid("form-fim"), "name": "Mostrar resultado", "type": "n8n-nodes-base.form", "typeVersion": 2.3,
         "position": [1080, 0], "webhookId": uid("form-fim-webhook"),
         "parameters": {"operation": "completion", "respondWith": "showText", "responseText": "={{ $json.html }}"}},
    ],
    "connections": ligar(
        ("Formulário: analisar vaga", "Configuração"),
        ("Configuração", "Pedido para a IA"),
        ("Pedido para a IA", "IA analisa"),
        ("IA analisa", "Montar análise"),
        ("Montar análise", "Salvar no Notion"),
        ("Salvar no Notion", "Página de resultado"),
        ("Página de resultado", "Mostrar resultado"),
    ),
    "settings": {"executionOrder": "v1", "timezone": "America/Sao_Paulo"},
    "pinData": {},
}

for arquivo, fluxo in [("01-alertas-linkedin.json", f1), ("02-analisar-vaga.json", f2)]:
    (PASTA / arquivo).write_text(json.dumps(fluxo, ensure_ascii=False, indent=2), encoding="utf-8")
    print("gerado:", arquivo, "·", len(fluxo["nodes"]), "nós")
