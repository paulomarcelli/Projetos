// ================================================================
// som.js — efeitos sonoros sintetizados com Web Audio (sem arquivos de áudio)
// ================================================================

// Classe Som: um único objeto pro jogo todo (sobrevive ao reinício das cenas)
class Som {
    constructor() {
        // Contexto de áudio (só pode ser criado depois de um clique/tecla do jogador)
        this.ctx = null;
        // Volume geral (o "master")
        this.master = null;
        // Buffer de ruído branco (usado em impactos e explosões), criado uma vez
        this.bufferRuido = null;
        // Som ligado ou desligado (tecla M); lê a preferência salva
        this.mudo = this.lerMudo();
        // Na primeira interação do jogador, liga o áudio
        const destravar = () => this.iniciar();
        // Escuta clique/toque na página inteira
        window.addEventListener('pointerdown', destravar);
        // Escuta tecla na página inteira
        window.addEventListener('keydown', destravar);
    }

    // Lê do localStorage se o som estava desligado (try/catch: pode falhar em aba anônima)
    lerMudo() {
        // Tenta ler a chave salva
        try { return localStorage.getItem('tracoGeometrico.mudo') === '1'; }
        // Se der erro, começa com som ligado
        catch (e) { return false; }
    }

    // Cria o contexto de áudio (ou retoma se o navegador pausou)
    iniciar() {
        // Pega a classe de AudioContext (Safari antigo usa o prefixo webkit)
        const Contexto = window.AudioContext || window.webkitAudioContext;
        // Navegador sem Web Audio: sai sem som
        if (!Contexto) return;
        // Se ainda não existe contexto, cria
        if (!this.ctx) {
            // Novo contexto de áudio
            this.ctx = new Contexto();
            // Nó de ganho geral
            this.master = this.ctx.createGain();
            // Volume geral baixinho (0 se estiver mudo)
            this.master.gain.value = this.mudo ? 0 : 0.18;
            // Liga o master na saída (alto-falante)
            this.master.connect(this.ctx.destination);
            // Cria 1 segundo de ruído branco
            this.bufferRuido = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
            // Pega os dados do canal pra preencher
            const dados = this.bufferRuido.getChannelData(0);
            // Preenche com valores aleatórios entre -1 e 1
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
        }
        // Se o navegador suspendeu o contexto, retoma
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    // Liga/desliga o som (tecla M) e salva a escolha
    alternarMudo() {
        // Inverte o estado
        this.mudo = !this.mudo;
        // Ajusta o volume geral, se o contexto já existir
        if (this.master) this.master.gain.value = this.mudo ? 0 : 0.18;
        // Salva a preferência (try/catch: pode falhar)
        try { localStorage.setItem('tracoGeometrico.mudo', this.mudo ? '1' : '0'); } catch (e) {}
        // Devolve o novo estado (a cena mostra "SOM: LIGADO/DESLIGADO")
        return this.mudo;
    }

    // Toca um tom: onda ('sine','square','sawtooth','triangle'), freq inicial f0, final f1, duração ms, volume
    tom(onda, f0, f1, ms, vol = 0.08, atraso = 0) {
        // Sem contexto (jogador ainda não interagiu) ou mudo: não toca
        if (!this.ctx || this.mudo) return;
        // Momento de começar (agora + atraso em segundos)
        const t = this.ctx.currentTime + atraso / 1000;
        // Cria o oscilador
        const osc = this.ctx.createOscillator();
        // Cria o ganho (envelope de volume)
        const ganho = this.ctx.createGain();
        // Define o tipo de onda
        osc.type = onda;
        // Frequência inicial
        osc.frequency.setValueAtTime(f0, t);
        // Rampa até a frequência final (exponencial soa mais natural)
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + ms / 1000);
        // Volume começa em zero
        ganho.gain.setValueAtTime(0.0001, t);
        // Sobe rápido (5 ms de ataque)
        ganho.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        // Cai até quase zero no fim
        ganho.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
        // Liga oscilador → ganho → master
        osc.connect(ganho).connect(this.master);
        // Começa a tocar
        osc.start(t);
        // Para um pouquinho depois do fim
        osc.stop(t + ms / 1000 + 0.02);
    }

    // Toca ruído filtrado (impactos, explosões, poeira)
    ruido(ms, vol = 0.1, filtroHz = 1200, atraso = 0) {
        // Sem contexto ou mudo: não toca
        if (!this.ctx || this.mudo) return;
        // Momento de começar
        const t = this.ctx.currentTime + atraso / 1000;
        // Fonte que toca o buffer de ruído
        const fonte = this.ctx.createBufferSource();
        // Usa o ruído branco criado no iniciar()
        fonte.buffer = this.bufferRuido;
        // Filtro passa-baixa (deixa o ruído mais "grave")
        const filtro = this.ctx.createBiquadFilter();
        // Tipo do filtro
        filtro.type = 'lowpass';
        // Frequência de corte
        filtro.frequency.value = filtroHz;
        // Envelope de volume
        const ganho = this.ctx.createGain();
        // Começa no volume pedido
        ganho.gain.setValueAtTime(vol, t);
        // Some até o fim
        ganho.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
        // Liga fonte → filtro → ganho → master
        fonte.connect(filtro).connect(ganho).connect(this.master);
        // Começa
        fonte.start(t);
        // Para no fim
        fonte.stop(t + ms / 1000 + 0.02);
    }

    // Som contínuo (jato, vento): um oscilador que fica ligado e muda só o volume
    // Retorna um objeto com volume(v) e parar(); funciona mesmo antes do áudio destravar (fica mudo)
    continuo(onda = 'sawtooth', freq = 90, filtroHz = 400) {
        // Objeto de controle (começa vazio)
        const ctrl = { ganho: null, osc: null };
        // Cria os nós de áudio (se o contexto já existir)
        const montar = () => {
            // Já montado ou sem contexto: não faz nada
            if (ctrl.osc || !this.ctx) return;
            // Oscilador contínuo
            ctrl.osc = this.ctx.createOscillator();
            // Tipo de onda
            ctrl.osc.type = onda;
            // Frequência fixa
            ctrl.osc.frequency.value = freq;
            // Filtro passa-baixa (deixa o som abafado, tipo motor)
            const filtro = this.ctx.createBiquadFilter();
            // Tipo do filtro
            filtro.type = 'lowpass';
            // Frequência de corte
            filtro.frequency.value = filtroHz;
            // Ganho (volume) começa em zero
            ctrl.ganho = this.ctx.createGain();
            // Volume inicial zero
            ctrl.ganho.gain.value = 0;
            // Liga oscilador → filtro → ganho → master
            ctrl.osc.connect(filtro).connect(ctrl.ganho).connect(this.master);
            // Começa a tocar (em silêncio)
            ctrl.osc.start();
        };
        // Muda o volume suavemente (80 ms)
        ctrl.volume = (v) => {
            // Monta se ainda não montou
            montar();
            // Sem nó de ganho: sai
            if (!ctrl.ganho) return;
            // Rampa até o novo volume
            ctrl.ganho.gain.setTargetAtTime(this.mudo ? 0 : v, this.ctx.currentTime, 0.03);
        };
        // Para e desliga o oscilador
        ctrl.parar = () => {
            // Se existe, para
            if (ctrl.osc) { try { ctrl.osc.stop(); } catch (e) {} ctrl.osc.disconnect(); ctrl.osc = null; }
        };
        // Devolve o controle
        return ctrl;
    }

    // Trilha sintetizada, tocada uma batida por vez (a fase chama a cada batida, no ritmo do BPM dela)
    // i = número da batida; raiz = nota base em Hz (cada herói tem a sua); intervalo = ms entre batidas
    batidaMusica(i, raiz, intervalo) {
        // Sem som: nada
        if (!this.ctx || this.mudo) return;
        // Posição dentro do compasso (4 batidas) e da frase (16 batidas)
        const b = i % 4, frase = Math.floor(i / 4) % 4;
        // Bumbo em toda batida (grave caindo)
        this.tom('sine', 140, 45, 140, 0.11);
        // Chimbal no contratempo (meia batida depois)
        this.ruido(40, 0.03, 7000, intervalo / 2);
        // Caixa nas batidas 2 e 4
        if (b === 1 || b === 3) this.ruido(110, 0.05, 1800);
        // Baixo: raiz, raiz, quinta, oitava (muda de grau a cada compasso: I, I, VI, V)
        const grau = [1, 1, 0.84, 0.75][frase];
        const nota = raiz * grau * [1, 1, 1.5, 2][b];
        this.tom('sawtooth', nota, nota, intervalo * 0.8, 0.035);
        // Arpejo agudo nos dois últimos compassos da frase (colcheias)
        if (frase >= 2) [1, 1.25, 1.5, 2].forEach((m, k) => { if (k < 2) this.tom('triangle', raiz * grau * 4 * m * (b % 2 ? 1.25 : 1), raiz * grau * 4 * m, intervalo * 0.4, 0.02, k * intervalo / 2); });
    }

    // Sons prontos usados em todas as fases (nome → receita)
    tocar(nome) {
        // Escolhe a receita pelo nome
        switch (nome) {
            // Pulo: bip curto subindo
            case 'pulo': this.tom('square', 520, 780, 90, 0.06); break;
            // Morte: queda grave + ruído
            case 'morte': this.tom('sawtooth', 320, 60, 380, 0.12); this.ruido(200, 0.1, 1200); break;
            // Aviso: tique agudo
            case 'aviso': this.tom('square', 1200, 1200, 40, 0.06); break;
            // Chegada: arpejo de 4 notas
            case 'chegada': [523, 659, 784, 1046].forEach((f, i) => this.tom('triangle', f, f, 110, 0.1, i * 110)); break;
            // Clique de interface
            case 'clique': this.tom('sine', 880, 660, 50, 0.05); break;
            // Erro / sem efeito
            case 'erro': this.tom('sine', 300, 200, 80, 0.05); break;
        }
    }
}

// Instância única usada pelo jogo inteiro
const som = new Som();
