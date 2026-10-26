// ===== VOZ EM TEMPO REAL DA LUNA (OpenAI Realtime via WebRTC) =====
// Conversa simultânea: o microfone fica aberto, a Luna responde falando e a pessoa
// pode interrompê-la só começando a falar (a OpenAI detecta e corta o áudio).
//
// Segurança da chave: a página nunca vê a chave secreta. Ela pede ao servidor da Luna
// (POST /voz/sessao) uma chave EFÊMERA, que expira em ~2 minutos e só serve para abrir
// esta conexão. As instruções da Luna já vêm dentro da sessão, definidas pelo servidor.
//
// Segurança da pessoa: cada fala transcrita passa por POST /voz/avaliar (a mesma camada
// em código do chat). Em risco, a resposta em andamento é cortada, a orientação de
// segurança entra na sessão e os contatos de ajuda aparecem embaixo da resposta.
//
// Usa o mesmo painel de voz (#painel-voz) da voz do navegador (voz.js). Quando esta
// conversa está ativa, os botões do painel são tratados aqui.

const VozTempoReal = (() => {
    const painel = document.getElementById("painel-voz");
    const indicador = painel.querySelector(".indicador-voz");
    const status = document.getElementById("status-voz");
    const transcricao = document.getElementById("transcricao");
    const botaoPausar = document.getElementById("voz-pausar");
    const botaoInterromper = document.getElementById("voz-interromper");
    const botaoEncerrar = document.getElementById("voz-encerrar");

    const suportado = Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
    const TEXTOS = {
        conectando: "Conectando a voz…",
        ouvindo: "Pode falar. Estou ouvindo.",
        pensando: "Pensando…",
        falando: "Luna falando… você pode interromper falando.",
        pausado: "Microfone pausado. Toque em Retomar.",
    };

    // funções que o script.js entrega em configurar()
    let opcoes = {
        apiBase: "", obterMemoria: () => ({ memoria: [], memoria_ativa: false }), historico: () => [],
        aoFalaPessoa: () => {}, aoFalaLuna: () => {}, aoMudarEstado: () => {},
    };
    let disponivel = false;      // o servidor tem a voz em tempo real configurada? (/status)
    let estado = "inativo";      // inativo | conectando | ouvindo | pensando | falando | pausado | erro
    let pc = null, canal = null, microfone = null, audio = null;
    let lunaFalando = false, pausado = false;
    let segurancaPendente = null;  // contatos de ajuda para anexar à próxima resposta da Luna
    let tentativa = 0;             // invalida conexões antigas se a pessoa encerrar no meio

    function mudarEstado(novo, mensagem) {
        estado = novo;
        painel.hidden = novo === "inativo";
        indicador.dataset.estado = novo;
        status.textContent = mensagem ?? TEXTOS[novo] ?? "";
        botaoInterromper.hidden = !lunaFalando || novo === "erro";
        botaoPausar.hidden = novo === "erro";
        botaoPausar.textContent = pausado ? "Retomar" : "Pausar";
        botaoPausar.disabled = novo === "conectando";
        botaoEncerrar.textContent = novo === "erro" ? "Fechar" : "Encerrar";
        if (novo !== "ouvindo" && novo !== "pensando") transcricao.textContent = "";
        opcoes.aoMudarEstado(novo);
    }

    function enviar(evento) {
        if (canal?.readyState === "open") canal.send(JSON.stringify(evento));
    }

    function fecharConexao() {
        tentativa++;
        canal?.close();
        pc?.close();
        microfone?.getTracks().forEach((t) => t.stop());   // apaga a luz do microfone
        if (audio) audio.srcObject = null;
        pc = canal = microfone = null;
        lunaFalando = pausado = false;
        segurancaPendente = null;
    }

    function falhar(mensagem) {
        fecharConexao();
        mudarEstado("erro", mensagem + " Você pode continuar por texto.");
    }

    function erroMicrofone(erro) {
        if (erro?.name === "NotAllowedError" || erro?.name === "SecurityError")
            return "O acesso ao microfone foi negado. Para conversar por voz, permita o microfone nas configurações do navegador.";
        if (erro?.name === "NotFoundError") return "Não encontrei um microfone neste aparelho.";
        if (erro?.name === "NotReadableError") return "O microfone está sendo usado por outro aplicativo.";
        return "Não consegui abrir o microfone.";
    }

    async function postar(caminho, corpo) {
        const resposta = await fetch(opcoes.apiBase + caminho, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo),
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.erro || `O servidor respondeu com erro ${resposta.status}.`);
        return dados;
    }

    async function iniciar() {
        if (estado !== "inativo" && estado !== "erro") return;
        if (!suportado) { falhar("Este navegador não faz conversa por voz em tempo real."); return; }
        const minha = ++tentativa;
        mudarEstado("conectando");
        // O <audio> nasce dentro do clique: celulares só deixam tocar som depois de um toque.
        audio = audio || Object.assign(document.createElement("audio"), { autoplay: true });
        audio.setAttribute("playsinline", "");
        audio.play?.().catch(() => {});

        try {
            microfone = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
        } catch (erro) {
            if (minha === tentativa) falhar(erroMicrofone(erro));
            return;
        }
        if (minha !== tentativa) { microfone.getTracks().forEach((t) => t.stop()); return; }

        try {
            const sessao = await postar("/voz/sessao", opcoes.obterMemoria());
            if (minha !== tentativa) return;

            pc = new RTCPeerConnection();
            pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };
            microfone.getTracks().forEach((faixa) => pc.addTrack(faixa, microfone));
            canal = pc.createDataChannel("oai-events");
            canal.addEventListener("open", () => {
                if (minha !== tentativa) return;
                enviarHistorico();
                mudarEstado("ouvindo");
            });
            canal.addEventListener("message", (e) => {
                try { tratar(JSON.parse(e.data)); } catch (erro) { console.error(erro); }
            });
            pc.addEventListener("connectionstatechange", () => {
                if (minha !== tentativa) return;
                if (pc.connectionState === "failed" || pc.connectionState === "disconnected")
                    falhar("A conexão de voz caiu.");
            });

            const oferta = await pc.createOffer();
            await pc.setLocalDescription(oferta);
            const resposta = await fetch(sessao.url_chamada, {
                method: "POST",
                body: oferta.sdp,
                headers: { Authorization: `Bearer ${sessao.chave}`, "Content-Type": "application/sdp" },
            });
            if (!resposta.ok) throw new Error(`A OpenAI recusou a conexão de voz (erro ${resposta.status}).`);
            const sdp = await resposta.text();
            if (minha !== tentativa) return;
            await pc.setRemoteDescription({ type: "answer", sdp });
        } catch (erro) {
            if (minha !== tentativa) return;
            console.error(erro);
            falhar(erro instanceof TypeError ? "Não consegui me conectar ao servidor de voz." : erro.message);
        }
    }

    // A sessão começa vazia: manda as últimas mensagens para a Luna lembrar da conversa.
    function enviarHistorico() {
        opcoes.historico().slice(-20).forEach(({ papel, texto }) => {
            const luna = papel === "luna";
            enviar({
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: luna ? "assistant" : "user",
                    content: [{ type: luna ? "output_text" : "input_text", text: texto }],
                },
            });
        });
    }

    function tratar(evento) {
        switch (evento.type) {
            case "input_audio_buffer.speech_started":
                transcricao.textContent = "";
                if (!pausado) mudarEstado("ouvindo");
                break;
            case "conversation.item.input_audio_transcription.delta":
                transcricao.textContent += evento.delta || "";
                break;
            case "input_audio_buffer.speech_stopped":
                if (!pausado) mudarEstado("pensando");
                break;
            case "conversation.item.input_audio_transcription.completed": {
                const texto = (evento.transcript || "").trim();
                if (texto) { opcoes.aoFalaPessoa(texto); avaliarSeguranca(texto); }
                break;
            }
            case "output_audio_buffer.started":
                lunaFalando = true;
                if (!pausado) mudarEstado("falando");
                break;
            case "output_audio_buffer.stopped":
            case "output_audio_buffer.cleared":
                lunaFalando = false;
                if (!pausado && estado !== "inativo" && estado !== "erro") mudarEstado("ouvindo");
                break;
            case "response.output_audio_transcript.done": {
                const texto = (evento.transcript || "").trim();
                if (texto) { opcoes.aoFalaLuna(texto, segurancaPendente); segurancaPendente = null; }
                break;
            }
            case "response.done":
                if (evento.response?.status === "failed") {
                    status.textContent = "Não consegui responder agora. Pode repetir?";
                }
                if (estado === "pensando" && !lunaFalando) mudarEstado("ouvindo");
                break;
            case "error":
                // cancelar quando nada está tocando não é problema; o resto aparece no painel
                if (evento.error?.code !== "response_cancel_not_active") {
                    console.warn("Realtime:", evento.error);
                    status.textContent = evento.error?.message || "A voz teve um problema. Tente falar de novo.";
                }
                break;
        }
    }

    async function avaliarSeguranca(texto) {
        let resultado;
        try {
            const anteriores = opcoes.historico().filter((m) => m.papel === "usuario").map((m) => m.texto).slice(-20);
            resultado = await postar("/voz/avaliar", { texto, anteriores });
        } catch (erro) {
            console.error(erro);
            return;
        }
        if (resultado.nivel === "nenhum" && !resultado.orientacao) return;
        segurancaPendente = { nivel: resultado.nivel, categorias: resultado.categorias, contatos: resultado.contatos };
        const urgente = resultado.nivel === "alto" || resultado.nivel === "imediato";
        if (urgente) {                                   // corta o que ela estava dizendo e recomeça com segurança
            enviar({ type: "response.cancel" });
            enviar({ type: "output_audio_buffer.clear" });
        }
        let texto_orientacao = resultado.orientacao;
        if (resultado.texto_seguro)
            texto_orientacao += `\nResponda agora dizendo esta mensagem, com calma e sem omitir nenhum número de contato:\n${resultado.texto_seguro}`;
        enviar({
            type: "conversation.item.create",
            item: { type: "message", role: "system", content: [{ type: "input_text", text: texto_orientacao }] },
        });
        if (urgente) enviar({ type: "response.create" });
    }

    // Texto digitado durante a conversa por voz entra na mesma sessão.
    function enviarTexto(texto) {
        enviar({
            type: "conversation.item.create",
            item: { type: "message", role: "user", content: [{ type: "input_text", text: texto }] },
        });
        enviar({ type: "response.create" });
        avaliarSeguranca(texto);
        mudarEstado("pensando");
    }

    function interromper() {
        enviar({ type: "response.cancel" });
        enviar({ type: "output_audio_buffer.clear" });
    }

    function alternarPausa() {
        pausado = !pausado;
        microfone?.getAudioTracks().forEach((t) => { t.enabled = !pausado; });  // pausa = microfone mudo
        mudarEstado(pausado ? "pausado" : lunaFalando ? "falando" : "ouvindo");
    }

    function encerrar() {
        if (estado === "inativo") return;
        fecharConexao();
        mudarEstado("inativo");
    }

    // Botões do painel: quando esta conversa está ativa, ela responde e o voz.js não.
    function assumir(botao, acao) {
        botao.addEventListener("click", (e) => {
            if (estado === "inativo") return;
            e.stopImmediatePropagation();
            acao();
        }, { capture: true });
    }
    assumir(botaoPausar, alternarPausa);
    assumir(botaoInterromper, interromper);
    assumir(botaoEncerrar, encerrar);
    window.addEventListener("pagehide", encerrar);

    return {
        suportado,
        configurar: (novas) => { opcoes = { ...opcoes, ...novas }; },
        definirDisponivel: (valor) => { disponivel = Boolean(valor) && suportado; },
        disponivel: () => disponivel,
        ativa: () => estado !== "inativo",
        falando: () => lunaFalando,
        iniciar, encerrar, interromper, enviarTexto,
    };
})();
