# Agente de segurança — Site Karol Sevilla

> Criado a partir de `references/seguranca.md` da skill `criar-sites-com-ia` (Etapa 6). Fica em `docs/agents/` para não poluir a raiz publicada.

## Instruções do agente
Você é o revisor de segurança deste site estático (sem backend, sem login, sem formulários, publicado no GitHub Pages).
1. Leia todo o código: `index.html`, `assets/css/*`, `assets/js/*`, `primeira-versao/*` e o workflow `.github/workflows/pages.yml`.
2. Liste os problemas por gravidade (**crítico**, **médio**, **baixo**), explique o risco em linguagem simples e sugira a correção.
3. Não aplique correções sem a confirmação do autor.

### Checklist
**Segredos:** nenhuma chave, senha ou token no front-end; `.env` fora do Git; histórico sem segredos.
**Front-end:** sem `innerHTML` com texto externo; links `target="_blank"` com `rel="noopener noreferrer"`; scripts de terceiros só de fontes confiáveis e com versão fixa; formulários validados (não há).
**Backend / IA:** não se aplica (não há servidor nem chamadas de API).
**Publicação:** HTTPS; nenhum arquivo de teste, backup ou `.env` publicado; dependências atualizadas.

---

## Resultado da revisão (2026-10-16, Agente 3; atualizada na Fase 4)

| Item | Situação | Evidência |
|---|---|---|
| Segredos no código | ok | Busca por e-mails, chaves e tokens na pasta: 0 ocorrências. Não há `.env`. |
| `innerHTML`, `eval`, `document.write`, `insertAdjacentHTML` | ok | 0 usos (a única ocorrência da palavra `innerHTML` é um comentário em `player.js`). O player cria os links com `createElement` + `textContent`, copiando URLs que já estão no HTML do próprio site. |
| Links externos | ok | 95 links externos (63 URLs diferentes): 95 com `target="_blank"` e 95 com `rel="noopener noreferrer"` (medido no navegador). Os links criados pelo JS no player também recebem os dois atributos. |
| Scripts de terceiros | ok | Nenhum script externo. O único recurso de terceiros é a folha de estilo do Google Fonts (CSS e fontes, sem JavaScript; ver a ressalva em "Dados pessoais"). |
| Script inline | baixo (aceito) | Uma linha no `<head>` troca a classe `no-js` por `js` antes da pintura, para não piscar as seções. Não há Content-Security-Policy (o GitHub Pages não permite cabeçalhos próprios); se um dia houver CSP por `<meta>`, será preciso um hash para esta linha. |
| Armazenamento | ok | Só `sessionStorage` com o id da faixa escolhida (ex.: `mariposas`), dentro de `try/catch`. Sem cookies, sem `localStorage`, sem dados pessoais. |
| Dados pessoais | ok, com ressalva (Fase 4, achado C13) | O site não tem formulários, cookies, análise nem armazenamento de dados pessoais. **Ressalva:** as fontes tipográficas vêm do Google Fonts, então o navegador do visitante envia o endereço IP ao Google ao abrir a página (o texto de Créditos agora diz isso). Se o autor quiser eliminar o envio, basta hospedar Fredoka e Figtree em `assets/fonts/` (licença OFL). Nas requisições de download das imagens foi usado só o User-Agent "KarolSevillaFanSite/1.0 (educational project)", sem e-mail. |
| Hash da URL | ok | O roteador só aceita ids de views ou de elementos que existem dentro do `<main>`; qualquer outro valor volta para `#inicio`. O texto do hash entra no aviso por `textContent` (sem risco de XSS). |
| HTTPS | ok | GitHub Pages serve por HTTPS. Todos os links externos do site usam `https://`. |
| Arquivos publicados | baixo (aceito) | O workflow publica a pasta inteira, incluindo `docs/` (decisão do projeto). Capturas de tela, perfis de navegador e scripts de teste ficaram no scratchpad, fora do repositório. |
| Dependências | ok | Não há `package.json` nem bibliotecas; nada a atualizar. |
| Primeira versão | baixo (informativo) | `primeira-versao/` mantém o código original do autor, que carrega imagens de terceiros (Google Images, Fandom, Spotify CDN) por *hotlink*. Não é falha de segurança, mas essas imagens podem sumir. O código foi preservado sem mudanças, por decisão do projeto. |

**Problemas críticos:** nenhum. **Médios:** nenhum. **Baixos:** 3 (todos aceitos e explicados acima).
