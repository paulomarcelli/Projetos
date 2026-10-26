// ===== PEGANDO OS ELEMENTOS DA PÁGINA =====
const raiz = document.documentElement;                               // <html>: recebe as classes de acessibilidade
const chatArea = document.getElementById("chat-area");               // área principal (recebe a classe "conversando")
const campoMensagem = document.getElementById("campo-mensagem");     // caixa de texto
const botaoEnviar = document.getElementById("enviar-mensagem");      // botão de enviar
const botaoMicrofone = document.getElementById("botao-microfone");   // liga/desliga a conversa por voz
const divMensagens = document.getElementById("mensagens");           // onde os balões aparecem
const botaoNovaConversa = document.getElementById("nova-conversa");  // botão da sidebar
const botoesSugestao = document.querySelectorAll(".sugestao");       // atalhos da tela inicial
const listaConversas = document.getElementById("lista-conversas");   // histórico na sidebar
const historicoVazio = document.getElementById("historico-vazio");   // aviso quando não há histórico
const botaoMenu = document.getElementById("botao-menu");             // abre a gaveta no celular
const fundoMenu = document.getElementById("fundo-menu");             // fundo escuro atrás da gaveta
const botaoAjudaMobile = document.getElementById("botao-ajuda-mobile");
const cartaoAjuda = document.getElementById("cartao-ajuda");
const avisoRapido = document.getElementById("aviso-rapido");

// janela de configurações
const dialogoConfig = document.getElementById("configuracoes");
const cfgVoz = document.getElementById("cfg-voz");
const cfgVelocidade = document.getElementById("cfg-velocidade");
const valorVelocidade = document.getElementById("valor-velocidade");
const cfgLer = document.getElementById("cfg-ler");
const cfgContinua = document.getElementById("cfg-continua");
const cfgHistorico = document.getElementById("cfg-historico");
const cfgRetencao = document.getElementById("cfg-retencao");
const cfgMemoria = document.getElementById("cfg-memoria");
const cfgTextoGrande = document.getElementById("cfg-texto-grande");
const cfgMenosAnimacao = document.getElementById("cfg-menos-animacao");
const listaMemoria = document.getElementById("lista-memoria");
const memoriaVazia = document.getElementById("memoria-vazia");
const formMemoria = document.getElementById("form-memoria");
const novaMemoria = document.getElementById("nova-memoria");
const vozSuporte = document.getElementById("voz-suporte");

// servido pelo Flask (porta 5000) usa o caminho relativo; aberto pelo Live Server usa o endereço completo
// Servidor da Luna: config.js (GitHub Pages) > mesma origem (python app.py) > servidor local de testes
const API_BASE = (window.LUNA_CONFIG?.apiBase || (location.port === "5000" ? "" : "http://127.0.0.1:5000")).replace(/\/+$/, "");
const URL_SERVIDOR = API_BASE + "/chat";
const LIMITE_CONTEXTO = 30;                                          // quantas mensagens anteriores vão como contexto
const TEMPO_LIMITE_MS = 45000;                                       // desiste de esperar depois de 45 segundos


// ===== DADOS SALVOS NESTE NAVEGADOR =====
const PADRAO = {
    guardarHistorico: false,   // nada é guardado sem a pessoa permitir
    retencaoDias: 30,          // conversas antigas são apagadas sozinhas
    memoriaAtiva: false,       // memória desligada até a pessoa ligar
    lerRespostas: false,       // no modo texto, ler as respostas em voz alta
    conversaContinua: true,    // na voz, voltar a ouvir depois da resposta
    vozURI: "",                // voz escolhida ("" = a melhor disponível)
    velocidade: 0.95,          // ritmo um pouco mais calmo que o normal
    textoGrande: false,
    reduzirAnimacoes: false,
};

function lerSalvo(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; }  // localStorage guarda texto; JSON vira objeto
    catch { return padrao; }                                           // modo anônimo ou dado corrompido: usa o padrão
}

function salvar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); }
    catch { mostrarAviso("Não consegui salvar neste navegador (armazenamento cheio ou bloqueado)."); }
}

function remover(chave) {
    try { localStorage.removeItem(chave); } catch { /* armazenamento bloqueado: nada a apagar */ }
}

let config = { ...PADRAO, ...lerSalvo("luna.config", {}) };          // configurações
let memoria = lerSalvo("luna.memoria", []);                          // lista de frases que a pessoa autorizou lembrar
let conversas = lerSalvo("luna.conversas", []);                      // histórico (só se a pessoa ativou)
let atual = criarConversa();                                         // conversa aberta na tela
let ocupado = false;                                                 // true enquanto espera a resposta

function criarConversa() {
    const id = window.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
    return { id, titulo: "", criadaEm: Date.now(), atualizadaEm: Date.now(), mensagens: [] };
}


// ===== CRIA UM BALÃO DE MENSAGEM =====
function htmlSeguro(markdown) {
    if (!window.marked || !window.DOMPurify) return null;             // bibliotecas não carregaram: mostra texto puro
    return DOMPurify.sanitize(marked.parse(markdown));                // Markdown → HTML → limpo (sem scripts)
}

function criarAvatar() {
    const avatar = document.createElement("img");
    avatar.src = "marca/luna-mind.png";                               // figura completa da LUNA MIND (a mesma do topo), não só a coroa
    avatar.alt = "";                                                  // decorativa
    avatar.classList.add("avatar");
    return avatar;
}

function criarBotaoAcao(rotulo, icone) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "acao";
    botao.innerHTML = `${icone}<span class="rotulo"></span>`;         // ícone fixo (nosso), texto via textContent
    botao.querySelector(".rotulo").textContent = rotulo;
    return botao;
}

const ICONE_SOM = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICONE_REPETIR = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15m0 5v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function adicionarMensagem(quem, conteudo, extras = {}) {
    const linha = document.createElement("div");                     // segura avatar + coluna
    linha.classList.add("linha", quem);                               // "usuario" ou "luna" define lado e cor
    if (extras.semAnimacao) linha.classList.add("sem-animacao");
    if (quem === "luna") linha.appendChild(criarAvatar());

    const coluna = document.createElement("div");                     // balão + ações + cartões
    coluna.className = "coluna";

    const balao = document.createElement("div");
    balao.classList.add("balao");
    if (extras.erro) balao.classList.add("erro");
    const html = quem === "luna" ? htmlSeguro(conteudo) : null;
    if (html === null) balao.textContent = conteudo;                  // texto da pessoa: sempre puro (seguro)
    else balao.innerHTML = html;                                      // resposta da IA: Markdown já limpo
    balao.querySelectorAll("a").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    coluna.appendChild(balao);

    if (quem === "luna" && !extras.erro && Voz.podeFalar) {           // botão "Ouvir" em cada resposta
        const acoes = document.createElement("div");
        acoes.className = "acoes";
        const ouvir = criarBotaoAcao("Ouvir", ICONE_SOM);
        ouvir.setAttribute("aria-pressed", "false");
        ouvir.addEventListener("click", () => Voz.lerTexto(conteudo, ouvir));
        acoes.appendChild(ouvir);
        coluna.appendChild(acoes);
    }
    if (extras.seguranca?.contatos?.length) coluna.appendChild(criarCartaoContatos(extras.seguranca.contatos));
    if (extras.sugestaoMemoria) coluna.appendChild(criarSugestaoMemoria(extras.sugestaoMemoria));
    if (quem === "luna" && extras.fontes?.length) coluna.appendChild(criarFontes(extras.fontes));

    linha.appendChild(coluna);
    const estavaNoFim = pertoDoFim();                                 // medir ANTES de a mensagem nova aumentar a altura
    divMensagens.appendChild(linha);
    rolarAte(linha, quem === "usuario" || estavaNoFim);
    return linha;
}

// ===== FONTES DA BIBLIOTECA (RAG) =====
// O servidor só devolve fontes que o modelo realmente usou E que estavam entre os
// trechos recuperados (conferido em luna.py). Aqui mostramos apenas capítulo e seção,
// num <details> fechado: a informação fica disponível sem competir com a resposta.
function criarFontes(fontes) {
    const caixa = document.createElement("details");
    caixa.className = "fontes";
    const resumo = document.createElement("summary");
    resumo.textContent = fontes.length === 1 ? "Baseado em 1 trecho da biblioteca" : `Baseado em ${fontes.length} trechos da biblioteca`;
    caixa.appendChild(resumo);
    const lista = document.createElement("ul");
    fontes.forEach((f) => {
        const item = document.createElement("li");
        const doc = document.createElement("span");
        doc.className = "fonte-doc";
        doc.textContent = f.documento;                                // textContent: nada vira HTML
        const secao = document.createElement("span");
        secao.className = "fonte-secao";
        secao.textContent = f.secao;
        item.append(doc, secao);
        lista.appendChild(item);
    });
    caixa.appendChild(lista);
    const nota = document.createElement("p");
    nota.className = "fontes-nota";
    nota.textContent = "Biblioteca de pesquisa da LUNA MIND. É material educativo e não substitui um profissional.";
    caixa.appendChild(nota);
    return caixa;
}

function criarCartaoContatos(contatos) { // aparece embaixo da resposta em situações de risco
    const cartao = document.createElement("aside");
    cartao.className = "cartao-contatos";
    cartao.setAttribute("aria-label", "Contatos de ajuda");
    const titulo = document.createElement("p");
    titulo.className = "titulo-contatos";
    titulo.textContent = "Se precisar de ajuda agora";
    const lista = document.createElement("ul");
    contatos.forEach((contato) => {
        const item = document.createElement("li");
        const numero = document.createElement("a");
        numero.className = "numero";
        numero.href = `tel:${contato.numero}`;                         // no celular, toca e liga
        numero.textContent = contato.numero;
        numero.setAttribute("aria-label", `Ligar para ${contato.nome}, ${contato.numero}`);
        const texto = document.createElement("span");
        const nome = document.createElement("strong");
        nome.textContent = contato.nome;
        texto.append(nome, ` · ${contato.descricao}`);
        item.append(numero, texto);
        lista.appendChild(item);
    });
    cartao.append(titulo, lista);
    return cartao;
}

function criarSugestaoMemoria(texto) { // a Luna pergunta antes de lembrar qualquer coisa
    const caixa = document.createElement("div");
    caixa.className = "sugestao-memoria";
    caixa.setAttribute("role", "group");
    caixa.setAttribute("aria-label", "Sugestão de lembrança");
    const pergunta = document.createElement("p");
    pergunta.textContent = "Quer que eu lembre disto nas próximas conversas?";
    const citacao = document.createElement("blockquote");
    citacao.textContent = texto;
    const acoes = document.createElement("div");
    acoes.className = "acoes";
    const sim = criarBotaoAcao("Lembrar", "");
    const nao = criarBotaoAcao("Agora não", "");
    sim.addEventListener("click", () => {
        if (!memoria.includes(texto)) memoria.push(texto);
        salvar("luna.memoria", memoria);
        renderizarMemoria();
        const feito = document.createElement("p");
        feito.textContent = "Guardado. Você pode ver, corrigir ou apagar em Configurações.";
        caixa.replaceChildren(feito);
    });
    nao.addEventListener("click", () => caixa.remove());
    acoes.append(sim, nao);
    caixa.append(pergunta, citacao, acoes);
    return caixa;
}

function mostrarErro(texto, aoTentarDeNovo) {
    const linha = adicionarMensagem("luna", texto, { erro: true });
    const acoes = document.createElement("div");
    acoes.className = "acoes";
    const tentar = criarBotaoAcao("Tentar de novo", ICONE_REPETIR);
    tentar.addEventListener("click", () => { linha.remove(); aoTentarDeNovo(); });
    acoes.appendChild(tentar);
    linha.querySelector(".coluna").appendChild(acoes);
}


// ===== MOSTRA OS TRÊS PONTINHOS ENQUANTO A LUNA "PENSA" =====
function mostrarDigitando() {
    const linha = document.createElement("div");
    linha.classList.add("linha", "luna");
    linha.id = "digitando";
    const balao = document.createElement("div");
    balao.classList.add("balao", "digitando");
    balao.setAttribute("role", "status");
    balao.setAttribute("aria-label", "A Luna está escrevendo");
    balao.innerHTML = "<span></span><span></span><span></span>";
    linha.append(criarAvatar(), balao);
    divMensagens.appendChild(linha);
    rolarAte(linha, true);
}

function esconderDigitando() {
    document.getElementById("digitando")?.remove();
}


// ===== ROLAGEM =====
function pertoDoFim() {
    return divMensagens.scrollHeight - divMensagens.scrollTop - divMensagens.clientHeight < 140;
}

function rolarAte(linha, rolar) {
    if (!rolar) return;                                               // a pessoa subiu pra reler: não puxa a tela
    const suave = !raiz.classList.contains("menos-animacao") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alvo = linha && linha.offsetHeight > divMensagens.clientHeight * 0.8
        ? linha.offsetTop - 16                                          // resposta longa: mostra o começo dela
        : divMensagens.scrollHeight;                                    // senão: vai pro fim
    divMensagens.scrollTo({ top: alvo, behavior: suave ? "smooth" : "auto" });
}


// ===== ENVIA A MENSAGEM PRO SERVIDOR =====
// Servidor hospedado no plano gratuito "dorme" quando ninguém usa e leva ~30-50 s para acordar; nesse
// intervalo o navegador vê uma falha de rede. Em vez de desistir, tentamos de novo algumas vezes.
const SERVIDOR_REMOTO = API_BASE !== "" && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(API_BASE);
const ESPERAS_ACORDAR_MS = [5000, 8000, 10000, 12000, 15000];

async function pedirResposta(mensagem, historico, porVoz) {
    const corpo = JSON.stringify({
        mensagem,
        historico,                                                  // contexto: a Luna lembra do que foi dito
        memoria: config.memoriaAtiva ? memoria : [],                // memória só vai se estiver ligada
        memoria_ativa: config.memoriaAtiva,
        modo_voz: porVoz,                                           // na voz, respostas mais curtas e sem Markdown
    });
    const inicio = Date.now();
    let resposta;
    for (let tentativa = 0; ; tentativa++) {
        const controle = new AbortController();
        const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
        try {
            resposta = await fetch(URL_SERVIDOR, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: corpo,
                signal: controle.signal,
            });
            break;
        } catch (erro) {
            const abortou = erro.name === "AbortError";
            if (!abortou && SERVIDOR_REMOTO && tentativa < ESPERAS_ACORDAR_MS.length) {
                mostrarAviso("Acordando a Luna… na primeira mensagem isso pode levar até um minuto.");
                await new Promise((fim) => setTimeout(fim, ESPERAS_ACORDAR_MS[tentativa]));
                continue;
            }
            throw new Error(abortou
                ? "A resposta demorou demais. Tente de novo em alguns instantes."
                : `Não consegui me conectar com o servidor (${new URL(URL_SERVIDOR, location.href).host}). Se a página ficou aberta por muito tempo, recarregue com Ctrl+Shift+R e tente de novo.`);
        } finally {
            clearTimeout(relogio);
        }
    }
    avisoRapido.classList.remove("visivel");                        // some o "Acordando a Luna…"
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok || typeof dados.resposta !== "string") {
        throw new Error(dados.erro || `O servidor respondeu com erro ${resposta.status}. Tente de novo em alguns instantes.`);
    }
    return dados;
}

async function enviarMensagem(textoOpcional, { porVoz = false } = {}) {
    const pergunta = (textoOpcional ?? campoMensagem.value).trim();  // texto da sugestão, da voz ou digitado
    if (!pergunta) return;                                            // não envia mensagem vazia
    if (ocupado) {                                                    // ainda esperando a resposta anterior
        if (porVoz) Voz.falhou("Espere a resposta anterior e toque em Retomar.");
        return;
    }

    if (VozTempoReal.ativa()) {                                      // conversa por voz ao vivo: o texto entra na mesma sessão
        registrarFala("usuario", pergunta);
        if (textoOpcional === undefined) { campoMensagem.value = ""; ajustarAltura(); }
        VozTempoReal.enviarTexto(pergunta);
        return;
    }

    ocupado = true;
    atualizarBotoes();
    Voz.pararLeitura();
    if (!porVoz) Voz.aguardarResposta();                             // texto digitado com a voz ligada: para de ouvir
    const conversa = atual;                                          // se trocar de conversa no meio, a resposta vai pra certa
    const historico = conversa.mensagens.slice(-LIMITE_CONTEXTO).map(({ papel, texto }) => ({ papel, texto }));
    conversa.mensagens.push({ papel: "usuario", texto: pergunta });

    chatArea.classList.add("conversando");                           // esconde boas-vindas
    const linhaPergunta = adicionarMensagem("usuario", pergunta);
    if (textoOpcional === undefined) { campoMensagem.value = ""; ajustarAltura(); }
    mostrarDigitando();

    try {
        const dados = await pedirResposta(pergunta, historico, porVoz);
        conversa.mensagens.push({ papel: "luna", texto: dados.resposta, seguranca: dados.seguranca, fontes: dados.fontes || [] });
        salvarConversa(conversa);
        if (conversa !== atual) return;                              // a pessoa abriu outra conversa enquanto esperava
        esconderDigitando();
        const linha = adicionarMensagem("luna", dados.resposta, {
            seguranca: dados.seguranca,
            sugestaoMemoria: config.memoriaAtiva ? dados.sugestao_memoria : null,
            fontes: dados.fontes || [],
        });
        if (Voz.emConversa()) Voz.responder(dados.resposta);         // conversa por voz: ela fala e volta a ouvir
        else if (config.lerRespostas) {
            const ouvir = linha.querySelector(".acao[aria-pressed]");
            if (ouvir) Voz.lerTexto(dados.resposta, ouvir);
        }
    } catch (erro) {
        conversa.mensagens.pop();                                    // pergunta sem resposta não entra no histórico
        if (conversa !== atual) return;
        esconderDigitando();
        mostrarErro(erro.message, () => { linhaPergunta.remove(); enviarMensagem(pergunta, { porVoz }); });
        Voz.falhou(erro.message);
        console.error(erro);                                         // detalhe técnico no Console (F12)
    } finally {
        ocupado = false;
        atualizarBotoes();
        if (!Voz.emConversa() && textoOpcional === undefined) campoMensagem.focus();
    }
}

// Falas da conversa por voz ao vivo entram no chat e no histórico, como mensagens normais.
function registrarFala(papel, texto, seguranca) {
    const conversa = atual;
    conversa.mensagens.push(papel === "luna" ? { papel, texto, seguranca, fontes: [] } : { papel, texto });
    salvarConversa(conversa);
    chatArea.classList.add("conversando");
    adicionarMensagem(papel, texto, papel === "luna" ? { seguranca, fontes: [] } : {});
}

function atualizarBotoes() {
    botaoEnviar.disabled = ocupado;                                  // trava o botão até a resposta chegar
}


// ===== CAMPO DE TEXTO CRESCE CONFORME A PESSOA ESCREVE =====
function ajustarAltura() {
    campoMensagem.style.height = "auto";
    campoMensagem.style.height = campoMensagem.scrollHeight + "px";  // o CSS limita o máximo
}


// ===== HISTÓRICO (só neste navegador, e só se a pessoa ativar) =====
function resumirTitulo(texto) {
    const limpo = texto.replace(/\s+/g, " ").trim();
    return limpo.length > 42 ? limpo.slice(0, 40).trimEnd() + "…" : limpo;
}

function salvarConversa(conversa) {
    if (!config.guardarHistorico || !conversa.mensagens.length) return;
    conversa.titulo ||= resumirTitulo(conversa.mensagens.find((m) => m.papel === "usuario")?.texto ?? "Conversa");
    conversa.atualizadaEm = Date.now();
    conversas = [conversa, ...conversas.filter((c) => c.id !== conversa.id)]; // mais recente primeiro
    salvar("luna.conversas", conversas);
    renderizarConversas();
}

function aplicarRetencao() { // apaga conversas mais velhas que o prazo escolhido
    const dias = Number(config.retencaoDias);
    if (!dias) return;
    const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
    const antes = conversas.length;
    conversas = conversas.filter((c) => c.atualizadaEm >= limite);
    if (conversas.length !== antes) salvar("luna.conversas", conversas);
}

function renderizarConversas() {
    listaConversas.replaceChildren();
    historicoVazio.hidden = false;
    if (!config.guardarHistorico) {
        const ativar = document.createElement("button");
        ativar.type = "button";
        ativar.className = "link";
        ativar.textContent = "Ativar";
        ativar.addEventListener("click", () => abrirConfiguracoes("secao-privacidade"));
        historicoVazio.replaceChildren("O histórico está desligado. ", ativar);
        return;
    }
    if (!conversas.length) {
        historicoVazio.textContent = "Suas conversas vão aparecer aqui.";
        return;
    }
    historicoVazio.hidden = true;
    conversas.forEach((c) => {
        const item = document.createElement("li");
        item.className = "item-conversa";
        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "abrir-conversa";
        if (c.id === atual.id) abrir.setAttribute("aria-current", "true");
        const titulo = document.createElement("span");
        titulo.textContent = c.titulo || "Conversa";
        const data = document.createElement("small");
        data.textContent = new Date(c.atualizadaEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        abrir.append(titulo, data);
        abrir.addEventListener("click", () => abrirConversa(c.id));
        const apagar = document.createElement("button");
        apagar.type = "button";
        apagar.className = "apagar-conversa";
        apagar.setAttribute("aria-label", `Apagar conversa: ${c.titulo || "Conversa"}`);
        apagar.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 7h14M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        apagar.addEventListener("click", () => apagarConversa(c.id));
        item.append(abrir, apagar);
        listaConversas.appendChild(item);
    });
}

function abrirConversa(id) {
    const conversa = conversas.find((c) => c.id === id);
    if (!conversa || ocupado) return;
    VozTempoReal.encerrar();
    Voz.encerrar();
    Voz.pararLeitura();
    atual = conversa;
    divMensagens.replaceChildren();
    conversa.mensagens.forEach((m) => adicionarMensagem(m.papel, m.texto, { seguranca: m.seguranca, fontes: m.fontes, semAnimacao: true }));
    chatArea.classList.add("conversando");
    renderizarConversas();
    fecharMenu();
    divMensagens.scrollTop = divMensagens.scrollHeight;
    campoMensagem.focus();
}

function apagarConversa(id) {
    if (!confirm("Apagar esta conversa deste aparelho?")) return;
    conversas = conversas.filter((c) => c.id !== id);
    salvar("luna.conversas", conversas);
    if (atual.id === id) novaConversa();
    renderizarConversas();
}


// ===== NOVA CONVERSA =====
function novaConversa() {
    VozTempoReal.encerrar();
    Voz.encerrar();
    Voz.pararLeitura();
    atual = criarConversa();
    divMensagens.replaceChildren();                                  // apaga os balões da tela
    chatArea.classList.remove("conversando");                        // volta a tela de boas-vindas
    renderizarConversas();
    fecharMenu();
    campoMensagem.focus();
}


// ===== MEMÓRIA (a pessoa vê, corrige e apaga tudo) =====
function renderizarMemoria() {
    listaMemoria.replaceChildren();
    memoriaVazia.hidden = memoria.length > 0;
    memoria.forEach((item, i) => {
        const li = document.createElement("li");
        const campo = document.createElement("input");
        campo.type = "text";
        campo.value = item;
        campo.maxLength = 200;
        campo.setAttribute("aria-label", `Lembrança ${i + 1}`);
        campo.addEventListener("change", () => {                     // corrigir: editar e sair do campo
            const novo = campo.value.trim();
            if (novo) memoria[i] = novo; else memoria.splice(i, 1);
            salvar("luna.memoria", memoria);
            renderizarMemoria();
        });
        const apagar = document.createElement("button");
        apagar.type = "button";
        apagar.className = "botao-secundario";
        apagar.textContent = "Apagar";
        apagar.setAttribute("aria-label", `Apagar lembrança: ${item}`);
        apagar.addEventListener("click", () => {
            memoria.splice(i, 1);
            salvar("luna.memoria", memoria);
            renderizarMemoria();
        });
        li.append(campo, apagar);
        listaMemoria.appendChild(li);
    });
}


// ===== CONFIGURAÇÕES =====
function aplicarAparencia() {
    raiz.classList.toggle("texto-grande", config.textoGrande);
    raiz.classList.toggle("menos-animacao", config.reduzirAnimacoes);
}

function salvarConfig() {
    salvar("luna.config", config);
}

function formatarVelocidade(valor) {
    return Number(valor).toFixed(2).replace(".", ",") + "×";
}

function preencherVozes(vozes) {
    cfgVoz.replaceChildren();
    const padrao = new Option("Automática (a mais natural disponível)", "");
    cfgVoz.add(padrao);
    vozes.forEach((v) => cfgVoz.add(new Option(`${v.name} (${v.lang})`, v.voiceURI)));
    cfgVoz.value = vozes.some((v) => v.voiceURI === config.vozURI) ? config.vozURI : "";
    cfgVoz.disabled = !Voz.podeFalar;
    const partes = [];
    if (!Voz.podeFalar) partes.push("Este navegador não consegue falar em voz alta.");
    else if (!vozes.length) partes.push("Nenhuma voz em português foi encontrada neste aparelho; o navegador vai usar a voz padrão.");
    if (!Voz.podeOuvir) partes.push("A conversa por voz (ouvir você) não funciona neste navegador. Use Chrome, Edge ou Safari.");
    else partes.push("No Chrome e no Edge, o áudio do microfone é enviado ao serviço de reconhecimento do navegador para virar texto.");
    vozSuporte.textContent = partes.join(" ");
}

function preencherConfiguracoes() {
    cfgVelocidade.value = config.velocidade;
    valorVelocidade.textContent = formatarVelocidade(config.velocidade);
    cfgLer.checked = config.lerRespostas;
    cfgContinua.checked = config.conversaContinua;
    cfgHistorico.checked = config.guardarHistorico;
    cfgRetencao.value = String(config.retencaoDias);
    cfgMemoria.checked = config.memoriaAtiva;
    cfgTextoGrande.checked = config.textoGrande;
    cfgMenosAnimacao.checked = config.reduzirAnimacoes;
    renderizarMemoria();
}

function abrirConfiguracoes(secao) {
    fecharMenu();
    preencherConfiguracoes();
    dialogoConfig.showModal();                                       // janela nativa: prende o foco e fecha com Esc
    if (secao) document.getElementById(secao)?.scrollIntoView({ block: "start" });
}

function ligarConfig(elemento, chave, ler = (el) => el.checked) { // atualiza e salva a cada mudança
    elemento.addEventListener("change", () => {
        config[chave] = ler(elemento);
        salvarConfig();
        aplicarAparencia();
    });
}

ligarConfig(cfgVoz, "vozURI", (el) => el.value);
ligarConfig(cfgLer, "lerRespostas");
ligarConfig(cfgContinua, "conversaContinua");
ligarConfig(cfgMemoria, "memoriaAtiva");
ligarConfig(cfgTextoGrande, "textoGrande");
ligarConfig(cfgMenosAnimacao, "reduzirAnimacoes");
ligarConfig(cfgRetencao, "retencaoDias", (el) => Number(el.value));
cfgRetencao.addEventListener("change", () => { aplicarRetencao(); renderizarConversas(); });
cfgVelocidade.addEventListener("input", () => {
    config.velocidade = Number(cfgVelocidade.value);
    valorVelocidade.textContent = formatarVelocidade(config.velocidade);
    salvarConfig();
});

cfgHistorico.addEventListener("change", () => {
    if (cfgHistorico.checked) {
        config.guardarHistorico = true;
        salvarConfig();
        salvarConversa(atual);                                       // guarda a conversa que já está na tela
    } else {
        const total = conversas.length;
        const ok = !total || confirm(`Desligar o histórico apaga ${total === 1 ? "a conversa guardada" : `as ${total} conversas guardadas`} neste aparelho. Continuar?`);
        if (!ok) { cfgHistorico.checked = true; return; }
        config.guardarHistorico = false;
        conversas = [];
        remover("luna.conversas");
        salvarConfig();
    }
    renderizarConversas();
});

formMemoria.addEventListener("submit", (evento) => {
    evento.preventDefault();                                         // não recarrega a página
    const texto = novaMemoria.value.trim();
    if (!texto) return;
    if (!memoria.includes(texto)) memoria.push(texto);
    salvar("luna.memoria", memoria);
    novaMemoria.value = "";
    renderizarMemoria();
});

document.getElementById("apagar-tudo").addEventListener("click", () => {
    if (!confirm("Apagar conversas, lembranças e configurações da Luna deste navegador? Isso não pode ser desfeito.")) return;
    ["luna.config", "luna.memoria", "luna.conversas"].forEach(remover);
    config = { ...PADRAO };
    memoria = [];
    conversas = [];
    aplicarAparencia();
    preencherConfiguracoes();
    novaConversa();
    dialogoConfig.close();
    mostrarAviso("Pronto. Seus dados da Luna foram apagados deste navegador.");
});

document.getElementById("testar-voz").addEventListener("click", () => Voz.testar());
document.getElementById("abrir-configuracoes").addEventListener("click", () => abrirConfiguracoes());
document.getElementById("ver-privacidade").addEventListener("click", () => abrirConfiguracoes("secao-privacidade"));
document.getElementById("fechar-config").addEventListener("click", () => dialogoConfig.close());
dialogoConfig.addEventListener("click", (evento) => { if (evento.target === dialogoConfig) dialogoConfig.close(); }); // clique fora fecha


// ===== GAVETA DO CELULAR =====
function abrirMenu() {
    document.body.classList.add("menu-aberto");
    fundoMenu.hidden = false;
    botaoMenu.setAttribute("aria-expanded", "true");
    chatArea.inert = true;                                           // o Tab não vai pra trás da gaveta
    botaoNovaConversa.focus();
}

function fecharMenu() {
    if (!document.body.classList.contains("menu-aberto")) return;
    document.body.classList.remove("menu-aberto");
    fundoMenu.hidden = true;
    botaoMenu.setAttribute("aria-expanded", "false");
    chatArea.inert = false;
    botaoMenu.focus();
}

botaoMenu.addEventListener("click", abrirMenu);
fundoMenu.addEventListener("click", fecharMenu);
botaoAjudaMobile.addEventListener("click", () => {
    abrirMenu();
    cartaoAjuda.scrollIntoView({ block: "end" });
    cartaoAjuda.focus();
});
matchMedia("(min-width: 769px)").addEventListener("change", (e) => { if (e.matches) fecharMenu(); });


// ===== AVISO RÁPIDO =====
let relogioAviso;
function mostrarAviso(texto) {
    avisoRapido.textContent = texto;
    avisoRapido.classList.add("visivel");
    clearTimeout(relogioAviso);
    relogioAviso = setTimeout(() => avisoRapido.classList.remove("visivel"), 6000);
}


// ===== TECLADO VIRTUAL: a área visível encolhe e a conversa acompanha =====
function ajustarAlturaVisivel() {
    const altura = window.visualViewport?.height ?? window.innerHeight;
    raiz.style.setProperty("--altura-visivel", `${altura}px`);
    if (pertoDoFim()) divMensagens.scrollTop = divMensagens.scrollHeight;
}
window.visualViewport?.addEventListener("resize", ajustarAlturaVisivel);


// ===== VOZ =====
Voz.configurar({
    obterConfig: () => config,
    enviar: (texto) => enviarMensagem(texto, { porVoz: true }),
    aviso: mostrarAviso,
    aoMudarVozes: preencherVozes,
    aoMudarEstado: (estado) => {
        const ativa = estado !== "inativo";
        botaoMicrofone.setAttribute("aria-pressed", String(ativa));
        botaoMicrofone.setAttribute("aria-label", ativa ? "Encerrar conversa por voz" : "Conversar por voz");
    },
});

if (!Voz.podeOuvir) { // indisponível: o botão continua visível e explica o motivo ao tocar
    botaoMicrofone.setAttribute("aria-disabled", "true");
    botaoMicrofone.setAttribute("aria-label", "Conversa por voz indisponível neste navegador");
}

VozTempoReal.configurar({
    apiBase: API_BASE,
    obterMemoria: () => ({ memoria: config.memoriaAtiva ? memoria : [], memoria_ativa: Boolean(config.memoriaAtiva) }),
    historico: () => atual.mensagens.map(({ papel, texto }) => ({ papel, texto })),
    aoFalaPessoa: (texto) => registrarFala("usuario", texto),
    aoFalaLuna: (texto, seguranca) => registrarFala("luna", texto, seguranca),
    aoMudarEstado: (estado) => {
        const ativa = estado !== "inativo";
        botaoMicrofone.setAttribute("aria-pressed", String(ativa));
        botaoMicrofone.setAttribute("aria-label", ativa ? "Encerrar conversa por voz" : "Conversar por voz");
    },
});

// Com a voz em tempo real configurada no servidor, o microfone abre a conversa simultânea;
// sem ela (ou sem servidor), continua a voz do navegador.
botaoMicrofone.addEventListener("click", () => {
    if (VozTempoReal.ativa()) VozTempoReal.encerrar();
    else if (Voz.emConversa()) Voz.encerrar();
    else if (VozTempoReal.disponivel()) { Voz.pararLeitura(); VozTempoReal.iniciar(); }
    else Voz.iniciarConversa();
});

async function verificarServidor() {
    try {
        const resposta = await fetch(API_BASE + "/status", { signal: AbortSignal.timeout?.(6000) });
        const estado = await resposta.json();
        VozTempoReal.definirDisponivel(estado.voz_tempo_real);
        if (VozTempoReal.disponivel()) {
            botaoMicrofone.removeAttribute("aria-disabled");
            botaoMicrofone.setAttribute("aria-label", "Conversar por voz");
        }
    } catch {
        // Página publicada sem servidor configurado: avisa logo, em vez de falhar na primeira mensagem.
        if (window.LUNA_CONFIG?.apiBase || location.hostname.endsWith("github.io"))
            mostrarAviso("O servidor da Luna está fora do ar ou não foi configurado. As respostas ficam indisponíveis por enquanto.");
    }
}


// ===== EVENTOS (o que acontece em cada ação) =====
botaoEnviar.addEventListener("click", () => enviarMensagem());

campoMensagem.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.isComposing) { // Enter envia; Shift+Enter pula linha
        evento.preventDefault();
        enviarMensagem();
    }
});

campoMensagem.addEventListener("input", ajustarAltura);

botoesSugestao.forEach((botao) => {
    botao.addEventListener("click", () => enviarMensagem(botao.textContent));
});

botaoNovaConversa.addEventListener("click", novaConversa);

document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape" || dialogoConfig.open) return;      // a janela de configurações trata o próprio Esc
    if (document.body.classList.contains("menu-aberto")) fecharMenu();
    else if (VozTempoReal.ativa() && VozTempoReal.falando()) VozTempoReal.interromper(); // Esc corta a fala ao vivo
    else if (Voz.emConversa() && Voz.estado() === "falando") Voz.interromper(); // Esc corta a fala
    else if (Voz.falando()) Voz.pararLeitura();
});


// ===== COMEÇO =====
aplicarRetencao();
aplicarAparencia();
renderizarConversas();
renderizarMemoria();
ajustarAlturaVisivel();
verificarServidor();
