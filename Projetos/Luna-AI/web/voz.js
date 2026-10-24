// ===== VOZ DA LUNA: ouvir (reconhecimento de fala) e falar (síntese de voz) =====
// Usa a Web Speech API do próprio navegador: grátis, sem servidor extra e sem chave.
// shortcut: a voz depende das vozes instaladas no aparelho e o reconhecimento corta em pausas longas; para voz neural igual em todo lugar ou conversa em tempo real, trocar falar()/ouvir() por um serviço na nuvem (ver README).

const Voz = (() => {
    const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition; // Chrome/Edge/Safari usam o prefixo webkit
    const sintese = window.speechSynthesis;                                         // quem fala
    const podeOuvir = Boolean(Reconhecimento);                                       // o navegador reconhece fala?
    const podeFalar = Boolean(sintese && window.SpeechSynthesisUtterance);           // o navegador fala?

    // ----- elementos do painel de voz -----
    const painel = document.getElementById("painel-voz");
    const indicador = painel.querySelector(".indicador-voz");
    const status = document.getElementById("status-voz");
    const transcricao = document.getElementById("transcricao");
    const botaoPausar = document.getElementById("voz-pausar");
    const botaoInterromper = document.getElementById("voz-interromper");
    const botaoEncerrar = document.getElementById("voz-encerrar");

    // funções que o script.js entrega em configurar()
    let opcoes = { obterConfig: () => ({}), enviar: () => {}, aviso: () => {}, aoMudarEstado: () => {}, aoMudarVozes: () => {} };

    let estado = "inativo";      // inativo | ouvindo | pensando | falando | pausado
    let falaPausada = false;     // true quando "pausado" no meio de uma fala (Retomar continua de onde parou)
    let reconhecedor = null;     // reconhecimento ativo agora
    let silencios = 0;           // quantas vezes seguidas o microfone não ouviu nada
    let idFala = 0;              // número da fala atual: impede que uma fala cancelada dispare callbacks
    let vozes = [];              // vozes em português disponíveis
    let botaoLendo = null;       // botão "Ouvir" da mensagem que está sendo lida

    const TEXTOS = {
        ouvindo: "Ouvindo… pode falar.",
        pensando: "Pensando na resposta…",
        falando: "Luna falando…",
        pausado: "Pausado. Toque em Retomar quando quiser.",
    };

    const ERROS = { // erro do reconhecimento: [o que fazer, mensagem]
        "not-allowed": ["encerrar", "O acesso ao microfone foi negado. Para conversar por voz, permita o microfone nas configurações do navegador. Você pode continuar por texto."],
        "service-not-allowed": ["encerrar", "O navegador bloqueou o reconhecimento de fala. Você pode continuar por texto."],
        "audio-capture": ["encerrar", "Não encontrei um microfone funcionando neste aparelho."],
        "language-not-supported": ["encerrar", "Este navegador não reconhece fala em português."],
        "network": ["pausar", "O reconhecimento de fala precisa de internet e a conexão falhou. Toque em Retomar para tentar de novo."],
    };


    // ===== ESTADO E PAINEL =====
    function mudarEstado(novo, mensagem) {
        estado = novo;                                                   // guarda o estado
        painel.hidden = novo === "inativo";                              // painel só aparece na conversa por voz
        indicador.dataset.estado = falaPausada ? "pausado" : novo;       // muda a animação das barrinhas
        status.textContent = mensagem ?? TEXTOS[novo] ?? "";             // texto do estado (lido por leitor de tela)
        botaoInterromper.hidden = !(novo === "falando" || falaPausada);  // "Interromper" só faz sentido se ela está falando
        botaoPausar.textContent = novo === "pausado" ? "Retomar" : "Pausar";
        botaoPausar.disabled = novo === "pensando";                      // nada pra pausar enquanto espera a resposta
        if (novo !== "ouvindo") transcricao.textContent = "";            // limpa o que foi ouvido
        opcoes.aoMudarEstado(novo);                                      // o script.js atualiza o botão do microfone
    }


    // ===== FALAR =====
    function carregarVozes() {
        if (podeFalar) {
            vozes = sintese.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("pt"));
            vozes.sort((a, b) => pontuar(b) - pontuar(a));               // as mais naturais primeiro
        }
        opcoes.aoMudarVozes(vozes);                                      // o script.js atualiza a lista nas configurações
    }

    function pontuar(voz) { // prefere vozes "neurais"/online e português do Brasil
        const nome = voz.name.toLowerCase();
        let pontos = 0;
        if (/natural|neural|online|premium|enhanced|aprimorad/.test(nome)) pontos += 4;
        if (nome.includes("google")) pontos += 2;
        if (voz.lang.replace("_", "-").toLowerCase() === "pt-br") pontos += 3;
        return pontos;
    }

    function vozEscolhida() {
        const uri = opcoes.obterConfig().vozURI;
        return vozes.find((v) => v.voiceURI === uri) ?? vozes[0] ?? null; // escolhida nas configurações ou a melhor
    }

    function limparParaFala(texto) { // tira o Markdown pra ela não ler "asterisco"
        return texto
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/^\s*(?:[-*•]|\d+\.)\s+/gm, "")
            .replace(/[*_#>`~|]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function dividirEmFrases(texto) { // falas curtas evitam o corte de ~15s do Chrome e permitem pausar
        const frases = texto.match(/[^.!?…]+[.!?…]+["”)]?\s*|[^.!?…]+$/g) ?? [texto];
        const partes = [];
        let atual = "";
        for (const frase of frases) {
            if (atual && (atual + frase).length > 220) { partes.push(atual.trim()); atual = ""; }
            atual += frase;
        }
        if (atual.trim()) partes.push(atual.trim());
        return partes;
    }

    function falar(texto, aoTerminar) {
        if (!podeFalar) { aoTerminar?.(); return; }
        pararFala();                                                     // nunca duas falas ao mesmo tempo
        const id = idFala;
        const partes = dividirEmFrases(limparParaFala(texto));
        if (!partes.length) { aoTerminar?.(); return; }
        const voz = vozEscolhida();
        const velocidade = Number(opcoes.obterConfig().velocidade) || 0.95;
        partes.forEach((parte, i) => {
            const fala = new SpeechSynthesisUtterance(parte);
            fala.lang = voz?.lang ?? "pt-BR";                            // pronúncia em português
            if (voz) fala.voice = voz;
            fala.rate = velocidade;                                      // ritmo moderado (padrão 0,95)
            fala.pitch = 1;                                              // tom natural, sem dramatizar
            if (i === partes.length - 1) fala.onend = () => { if (id === idFala) aoTerminar?.(); };
            fala.onerror = (e) => {                                      // erro real (não cancelamento): segue a conversa
                if (id !== idFala || e.error === "interrupted" || e.error === "canceled") return;
                idFala++;
                aoTerminar?.();
            };
            sintese.speak(fala);
        });
    }

    function pararFala() {
        idFala++;                                                        // invalida callbacks da fala anterior
        falaPausada = false;
        if (podeFalar) { sintese.cancel(); sintese.resume(); }           // resume() destrava o Chrome se ficou pausado
    }


    // ===== OUVIR =====
    function ouvir() {
        if (!podeOuvir) return;
        pararDeOuvir();
        const r = new Reconhecimento();
        reconhecedor = r;
        r.lang = "pt-BR";                                                // português do Brasil
        r.interimResults = true;                                         // mostra o texto enquanto a pessoa fala
        r.continuous = false;                                            // termina sozinho quando a pessoa para de falar
        r.maxAlternatives = 1;
        let final = "";
        let erro = null;

        r.onresult = (e) => {
            if (reconhecedor !== r) return;
            let parcial = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const trecho = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += trecho; else parcial += trecho;
            }
            transcricao.textContent = (final + parcial).trim();
        };
        r.onerror = (e) => { if (reconhecedor === r) erro = e.error; };
        r.onend = () => {
            if (reconhecedor !== r) return;                              // foi substituído ou cancelado de propósito
            reconhecedor = null;
            if (estado !== "ouvindo") return;
            if (erro && ERROS[erro]) return tratarErro(erro);
            const texto = final.trim();
            if (texto.length >= 2) {                                     // ignora ruídos curtos ("é", "hm")
                silencios = 0;
                mudarEstado("pensando");
                opcoes.enviar(texto);
            } else if (++silencios < 3) {
                ouvir();                                                 // silêncio: tenta ouvir de novo
            } else {
                mudarEstado("pausado", "Não ouvi nada. Toque em Retomar quando quiser falar.");
            }
        };

        try {
            r.start();
        } catch {
            reconhecedor = null;
            mudarEstado("pausado", "Não consegui ligar o microfone. Toque em Retomar para tentar de novo.");
        }
    }

    function pararDeOuvir() {
        const r = reconhecedor;
        reconhecedor = null;                                             // os eventos dele passam a ser ignorados
        if (r) try { r.abort(); } catch { /* já tinha parado */ }
    }

    function tratarErro(codigo) {
        const [acao, mensagem] = ERROS[codigo];
        if (acao === "encerrar") { encerrar(); opcoes.aviso(mensagem); }
        else mudarEstado("pausado", mensagem);
    }


    // ===== CONTROLES DA CONVERSA POR VOZ =====
    function iniciarConversa() {
        if (!podeOuvir) {
            opcoes.aviso("A conversa por voz precisa de reconhecimento de fala, que este navegador não oferece. Use Chrome, Edge ou Safari, ou continue por texto.");
            return;
        }
        pararLeitura();
        silencios = 0;
        mudarEstado("ouvindo");
        ouvir();
    }

    function aguardarResposta() { // a pessoa mandou texto digitado com a voz ligada
        if (estado === "inativo") return;
        pararDeOuvir();
        pararFala();
        mudarEstado("pensando");
    }

    function responder(texto) { // a resposta chegou do servidor
        if (estado !== "pensando") return;                               // encerrou/pausou enquanto esperava: não fala
        mudarEstado("falando");
        falar(texto, () => {
            if (estado !== "falando") return;
            if (opcoes.obterConfig().conversaContinua) { silencios = 0; mudarEstado("ouvindo"); ouvir(); }
            else mudarEstado("pausado", "Toque em Retomar para responder.");
        });
    }

    function falhou(mensagem) {
        if (estado === "pensando") mudarEstado("pausado", mensagem);
    }

    function interromper() { // corta a fala e já passa a ouvir
        if (estado !== "falando" && !falaPausada) return;
        pararFala();
        silencios = 0;
        mudarEstado("ouvindo");
        ouvir();
    }

    function alternarPausa() {
        if (estado === "falando") {
            sintese.pause();
            falaPausada = true;
            mudarEstado("pausado", "Fala pausada.");
        } else if (estado === "ouvindo") {
            pararDeOuvir();
            mudarEstado("pausado");
        } else if (estado === "pausado" && falaPausada) {
            falaPausada = false;
            sintese.resume();
            mudarEstado("falando");
        } else if (estado === "pausado") {
            silencios = 0;
            mudarEstado("ouvindo");
            ouvir();
        }
    }

    function encerrar() {
        pararDeOuvir();
        pararFala();
        if (estado !== "inativo") mudarEstado("inativo");
    }


    // ===== LER UMA MENSAGEM (botão "Ouvir") =====
    function marcarBotao(botao, lendo) {
        botao.setAttribute("aria-pressed", String(lendo));
        botao.querySelector(".rotulo").textContent = lendo ? "Parar" : "Ouvir";
    }

    function pararLeitura() {
        if (!botaoLendo) return;
        marcarBotao(botaoLendo, false);
        botaoLendo = null;
        pararFala();
    }

    function lerTexto(texto, botao) {
        if (estado !== "inativo") return;                                // na conversa por voz ela já fala sozinha
        const mesmo = botaoLendo === botao;
        pararLeitura();
        if (mesmo) return;                                               // clicar de novo para
        botaoLendo = botao;
        marcarBotao(botao, true);
        falar(texto, () => { if (botaoLendo === botao) { marcarBotao(botao, false); botaoLendo = null; } });
    }

    function testar() {
        pararLeitura();
        falar("Oi. Eu sou a Luna. É assim que eu vou falar quando a gente conversar.");
    }


    // ===== LIGAÇÕES =====
    botaoPausar.addEventListener("click", alternarPausa);
    botaoInterromper.addEventListener("click", interromper);
    botaoEncerrar.addEventListener("click", encerrar);

    document.addEventListener("visibilitychange", () => { // aba escondida: para de ouvir (o navegador cortaria mesmo)
        if (document.hidden && estado === "ouvindo") { pararDeOuvir(); mudarEstado("pausado"); }
    });

    function configurar(novas) {
        opcoes = { ...opcoes, ...novas };
        carregarVozes();
        if (podeFalar) sintese.addEventListener?.("voiceschanged", carregarVozes); // as vozes chegam depois em alguns navegadores
    }

    return {
        podeOuvir, podeFalar, configurar, iniciarConversa, aguardarResposta, responder, falhou, interromper, encerrar,
        lerTexto, pararLeitura, testar,
        emConversa: () => estado !== "inativo",
        falando: () => estado === "falando" || Boolean(botaoLendo),
        estado: () => estado,
    };
})();
