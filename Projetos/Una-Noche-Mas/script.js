/* =====================================================================
   UNA NOCHE MÁS · script.js
   ---------------------------------------------------------------------
   Tudo o que é FUNCIONALIDADE do site (o movimento/animação fica em
   motion.js e motion.css). O JS só liga e desliga classes e atributos
   combinados no contrato (docs/DESIGN_SYSTEM.md, seção 5); a aparência
   de cada estado está no CSS.

   Índice
     0. Ajudantes (funções pequenas usadas em vários lugares)
     1. Toast: avisos rápidos na parte de baixo da tela
     2. Revelar ao rolar ([data-reveal] → .is-visible)
     3. Header ao rolar (.is-scrolled) e botão "voltar ao topo"
     4. Link do menu da seção atual (aria-current)
     5. Menu do celular
     6. Vídeo de fundo do hero (tocar/pausar)
     7. Players com "fachada" (Spotify e YouTube)
     8. Fotos com reserva de iniciais
     9. Tecla Esc (uma central só, com prioridades)

   Regra de ouro: se o JavaScript falhar ou estiver desligado, o conteúdo
   continua todo visível e os links continuam funcionando.
   ===================================================================== */

// "use strict" liga o modo estrito: o navegador reclama de erros bobos
// (por exemplo, usar uma variável que não foi criada).
"use strict";

// Classe "js" no <html>. O <head> já faz isso; repetir aqui não custa nada.
document.documentElement.classList.add("js");


/* =====================================================================
   0. AJUDANTES
   ===================================================================== */

// Media query = a mesma pergunta que o CSS faz com @media, só que no JS.
// Esta responde: "a pessoa pediu para reduzir o movimento no sistema?"
const midiaMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

// E esta: "a tela está no tamanho do menu de celular?" (o CSS usa max-width: 899px)
const midiaCelular = window.matchMedia("(max-width: 899px)");

// Avisa quando a resposta de uma media query muda (ex.: girar o celular,
// mudar a preferência de movimento com a página aberta).
// Navegadores antigos (Safari < 14) só conhecem addListener, por isso o "if".
function aoMudarMidia(midia, funcao) {
    if (typeof midia.addEventListener === "function") {
        midia.addEventListener("change", funcao);
    } else if (typeof midia.addListener === "function") {
        midia.addListener(funcao);
    }
}

// "smooth" (rolagem suave) só para quem não pediu menos movimento
function comportamentoDeRolagem() {
    return midiaMenosMovimento.matches ? "auto" : "smooth";
}

// Cria um link externo seguro, que abre em nova aba e AVISA isso ao leitor de tela.
// rel="noopener noreferrer": a página aberta não consegue controlar a nossa.
function criarLinkExterno(endereco, texto) {
    const link = document.createElement("a");
    link.href = endereco;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = texto;

    const aviso = document.createElement("span");
    aviso.className = "sr-only";
    aviso.textContent = " (abre em nova aba)";
    link.appendChild(aviso);
    return link;
}


/* =====================================================================
   1. TOAST (aviso rápido)
   ---------------------------------------------------------------------
   Uso: mostrarToast("Texto", "info" | "erro", { duracao, link: { href, texto } })
   - Os avisos entram numa FILA: um de cada vez, na ordem em que chegaram.
   - Cada um fica ~4 s (os que têm link ficam 8 s, dá tempo de clicar).
   - Com o mouse em cima ou o foco dentro, o tempo PAUSA (ninguém perde o aviso).
   - Botão × e tecla Esc fecham.
   - role="status" (no HTML) faz o leitor de tela anunciar o texto.
   ===================================================================== */
const toast = document.querySelector(".toast");
const filaDeToasts = [];      // avisos esperando a vez
let toastAtual = null;        // aviso que está na tela agora (ou null)
let cronometroToast = null;   // o setTimeout que vai fechar o aviso
let tempoRestanteToast = 0;   // quanto falta (em ms), para retomar depois da pausa
let inicioCronometroToast = 0;

// Monta o "esqueleto" do toast uma vez só: um lugar para o texto + o botão ×.
// O botão nasce junto e nunca muda, assim o leitor de tela só anuncia o TEXTO novo.
let toastTexto = null;
if (toast) {
    toastTexto = document.createElement("span");
    toastTexto.className = "toast__texto";

    const botaoFechar = document.createElement("button");
    botaoFechar.type = "button";
    botaoFechar.className = "toast__fechar";
    botaoFechar.setAttribute("aria-label", "Fechar aviso");
    botaoFechar.innerHTML = '<span aria-hidden="true">×</span>';
    botaoFechar.addEventListener("click", fecharToast);

    toast.append(toastTexto, botaoFechar);

    // Pausa o cronômetro com o mouse em cima ou com o foco dentro do aviso
    toast.addEventListener("mouseenter", pausarToast);
    toast.addEventListener("mouseleave", retomarToast);
    toast.addEventListener("focusin", pausarToast);
    toast.addEventListener("focusout", function (evento) {
        // focusout também dispara ao passar o foco de um item do toast para outro;
        // só retomamos se o foco saiu DE VEZ do toast.
        if (!toast.contains(evento.relatedTarget)) retomarToast();
    });
}

function mostrarToast(texto, tipo, opcoes) {
    if (!toast) return;
    filaDeToasts.push({ texto: texto, tipo: tipo || "info", opcoes: opcoes || {} });
    if (!toastAtual) mostrarProximoToast();   // se não tem nada na tela, mostra já
}

function mostrarProximoToast() {
    toastAtual = filaDeToasts.shift() || null;
    if (!toastAtual) return;

    // Preenche o texto (e o link, se houver)
    toastTexto.textContent = toastAtual.texto;
    const link = toastAtual.opcoes.link;
    if (link) {
        toastTexto.append(" ", criarLinkExterno(link.href, link.texto));
    }

    toast.dataset.tipo = toastAtual.tipo;   // o CSS pode colorir: data-tipo="erro"
    toast.classList.add("is-shown");

    tempoRestanteToast = toastAtual.opcoes.duracao || (link ? 8000 : 4000);
    // Se o mouse/foco já estiver sobre o toast, começa pausado
    if (toast.matches(":hover") || toast.contains(document.activeElement)) return;
    iniciarCronometroToast();
}

function iniciarCronometroToast() {
    clearTimeout(cronometroToast);
    inicioCronometroToast = Date.now();
    cronometroToast = setTimeout(fecharToast, tempoRestanteToast);
}

function pausarToast() {
    if (!toastAtual || !cronometroToast) return;
    clearTimeout(cronometroToast);
    cronometroToast = null;
    tempoRestanteToast -= Date.now() - inicioCronometroToast;  // guarda quanto faltava
    // Garante um tempinho mínimo para ler depois que o mouse sair
    if (tempoRestanteToast < 1500) tempoRestanteToast = 1500;
}

function retomarToast() {
    if (!toastAtual || cronometroToast) return;
    iniciarCronometroToast();
}

function fecharToast() {
    if (!toastAtual) return;
    clearTimeout(cronometroToast);
    cronometroToast = null;

    // Se o foco estava no toast (no × ou no link), devolve para a página
    // antes de esconder, senão o foco "some" junto com o aviso.
    const focoEstavaNoToast = toast.contains(document.activeElement);

    toast.classList.remove("is-shown");
    toastAtual = null;

    if (focoEstavaNoToast) {
        const conteudo = document.getElementById("conteudo");
        if (conteudo) conteudo.focus({ preventScroll: true });
    }

    // Espera a saída (≈ a transição do CSS) e então limpa o texto e chama o próximo
    setTimeout(function () {
        if (toastAtual) return;           // outro aviso já entrou nesse meio-tempo
        toastTexto.textContent = "";
        delete toast.dataset.tipo;
        if (filaDeToasts.length) mostrarProximoToast();
    }, 320);
}


/* =====================================================================
   2. REVELAR AO ROLAR
   ---------------------------------------------------------------------
   Quem tem [data-reveal] (ou [data-reveal-stagger], os grupos escalonados)
   ganha .is-visible quando entra na tela, UMA vez só. O visual da entrada
   é do motion.css; sem JS (ou sem a classe "js") nada fica escondido.
   ===================================================================== */
const elementosParaRevelar = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");

function revelarTudo() {
    elementosParaRevelar.forEach(function (elemento) {
        elemento.classList.add("is-visible");
    });
}

if (!("IntersectionObserver" in window)) {
    // Navegador muito antigo: mostra tudo de uma vez (ninguém fica sem ver o conteúdo)
    revelarTudo();
} else {
    // O "observador" avisa quando um elemento entra na área visível da tela.
    const observadorDeRevelar = new IntersectionObserver(function (entradas, observador) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("is-visible");  // revela
                observador.unobserve(entrada.target);        // uma vez só: para de vigiar
            }
        });
    }, {
        threshold: 0,                       // basta 1 pixel aparecer...
        rootMargin: "0px 0px -10% 0px"      // ...acima dos últimos 10% da tela
    });

    elementosParaRevelar.forEach(function (elemento) {
        observadorDeRevelar.observe(elemento);
    });
}

// Ao imprimir (ou salvar em PDF), tudo aparece, mesmo o que ainda não foi rolado
window.addEventListener("beforeprint", revelarTudo);


/* =====================================================================
   3. HEADER AO ROLAR + BOTÃO "VOLTAR AO TOPO"
   ---------------------------------------------------------------------
   O evento "scroll" dispara MUITAS vezes por segundo. Para não pesar:
   - { passive: true } avisa o navegador que não vamos impedir a rolagem;
   - requestAnimationFrame junta tudo em, no máximo, 1 conta por quadro.
   ===================================================================== */
const header = document.querySelector(".site-header");
const botaoTopo = document.querySelector(".topo");
const tituloPrincipal = document.getElementById("titulo-principal");
let rolagemAgendada = false;

function atualizarAoRolar() {
    rolagemAgendada = false;
    const rolado = window.scrollY || document.documentElement.scrollTop;

    // Header sólido depois de 24 px
    if (header) header.classList.toggle("is-scrolled", rolado > 24);

    // "Voltar ao topo" aparece depois de ~1 tela
    if (botaoTopo) botaoTopo.classList.toggle("is-visible", rolado > window.innerHeight * 0.9);
}

window.addEventListener("scroll", function () {
    if (rolagemAgendada) return;            // já tem uma conta marcada para o próximo quadro
    rolagemAgendada = true;
    window.requestAnimationFrame(atualizarAoRolar);
}, { passive: true });

window.addEventListener("resize", atualizarAoRolar, { passive: true });
atualizarAoRolar();   // estado certo logo ao abrir (a página pode abrir já rolada)

if (botaoTopo) {
    botaoTopo.addEventListener("click", function (evento) {
        evento.preventDefault();   // sem JS o link pularia para o título; com JS fazemos melhor
        window.scrollTo({ top: 0, behavior: comportamentoDeRolagem() });
        // O foco vai para o <h1> (tabindex="-1" no HTML): quem usa teclado ou
        // leitor de tela recomeça do topo, e não do rodapé.
        // preventScroll: o foco não "puxa" a página (a rolagem acima cuida disso).
        if (tituloPrincipal) tituloPrincipal.focus({ preventScroll: true });
    });
}


/* =====================================================================
   4. LINK DA SEÇÃO ATUAL NO MENU (aria-current="true")
   ---------------------------------------------------------------------
   Uma "faixa" invisível no meio da tela (rootMargin corta 40% de cima e
   55% de baixo). A seção que passa por essa faixa é a atual. No hero,
   nenhum link fica marcado.
   ===================================================================== */
const linksDoMenu = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));

function marcarLinkAtual(idDaSecao) {
    linksDoMenu.forEach(function (link) {
        if (link.getAttribute("href") === "#" + idDaSecao) {
            link.setAttribute("aria-current", "true");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

if ("IntersectionObserver" in window && linksDoMenu.length) {
    const observadorDeSecoes = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (entrada.isIntersecting) marcarLinkAtual(entrada.target.id);
        });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

    // O hero também é vigiado: quando ele volta para a faixa, limpa a marcação
    ["inicio", "sobre-musica", "compositores", "redes-sociais"].forEach(function (id) {
        const secao = document.getElementById(id);
        if (secao) observadorDeSecoes.observe(secao);
    });
}


/* =====================================================================
   5. MENU DO CELULAR (< 900 px)
   ---------------------------------------------------------------------
   Aberto = botão com aria-expanded="true" + #menu-principal.is-open +
   body.menu-aberto (o CSS trava a rolagem de trás).
   Acessibilidade: foco vai para o 1º link, o Tab fica "preso" dentro do
   menu, Esc fecha e devolve o foco ao botão, e o resto da página fica
   "inerte" (o leitor de tela não sai do menu sem querer).
   ===================================================================== */
const botaoMenu = document.querySelector(".menu-toggle");
const menu = document.getElementById("menu-principal");
const rotuloBotaoMenu = botaoMenu ? botaoMenu.querySelector(".menu-toggle__rotulo") : null;

// Partes da página que ficam "inertes" (sem foco, sem clique, sem leitor) com o menu aberto
const partesForaDoMenu = [
    document.querySelector(".skip-link"),
    document.querySelector(".logo"),
    document.getElementById("conteudo"),
    document.querySelector(".site-footer"),
    toast
].filter(Boolean);   // tira da lista o que não existir

function menuEstaAberto() {
    return !!botaoMenu && botaoMenu.getAttribute("aria-expanded") === "true";
}

function abrirMenu() {
    botaoMenu.setAttribute("aria-expanded", "true");
    if (rotuloBotaoMenu) rotuloBotaoMenu.textContent = "Fechar menu";
    menu.classList.add("is-open");
    document.body.classList.add("menu-aberto");
    partesForaDoMenu.forEach(function (parte) { parte.inert = true; });
    pausarToast();   // o aviso some atrás do menu (CSS): o tempo dele para de correr

    // Foco no primeiro link, para quem usa teclado já começar navegando
    if (linksDoMenu[0]) linksDoMenu[0].focus();
}

// devolverFoco: true quando fechou por Esc/botão (o foco volta ao botão do menu)
function fecharMenu(devolverFoco) {
    if (!botaoMenu) return;
    botaoMenu.setAttribute("aria-expanded", "false");
    if (rotuloBotaoMenu) rotuloBotaoMenu.textContent = "Abrir menu";
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-aberto");
    partesForaDoMenu.forEach(function (parte) { parte.inert = false; });
    retomarToast();  // o aviso volta a aparecer e o tempo volta a correr

    if (devolverFoco) botaoMenu.focus();
}

if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
        if (menuEstaAberto()) fecharMenu(true);
        else abrirMenu();
    });

    // Clicar num link fecha o menu (a página então rola até a seção)
    linksDoMenu.forEach(function (link) {
        link.addEventListener("click", function () {
            if (menuEstaAberto()) fecharMenu(false);
        });
    });

    // Clicar "fora" (no fundo do painel, longe dos links) também fecha
    document.addEventListener("click", function (evento) {
        if (!menuEstaAberto()) return;
        const dentroDaLista = evento.target.closest(".nav__lista");
        const noBotao = botaoMenu.contains(evento.target);
        if (!dentroDaLista && !noBotao) fecharMenu(true);
    });

    // Tab "preso": do último item volta ao primeiro, e vice-versa (Shift+Tab)
    document.addEventListener("keydown", function (evento) {
        if (evento.key !== "Tab" || !menuEstaAberto()) return;

        const itens = [botaoMenu].concat(linksDoMenu);
        const primeiro = itens[0];
        const ultimo = itens[itens.length - 1];
        const atual = document.activeElement;

        if (itens.indexOf(atual) === -1) {           // foco escapou? traz de volta
            evento.preventDefault();
            primeiro.focus();
        } else if (evento.shiftKey && atual === primeiro) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && atual === ultimo) {
            evento.preventDefault();
            primeiro.focus();
        }
    });

    // Virou desktop (≥ 900 px) com o menu aberto? Limpa tudo, senão a página
    // ficaria travada (body.menu-aberto) sem nenhum botão para destravar.
    aoMudarMidia(midiaCelular, function () {
        if (!midiaCelular.matches && menuEstaAberto()) fecharMenu(false);
    });
}


/* =====================================================================
   6. VÍDEO DE FUNDO DO HERO
   ---------------------------------------------------------------------
   O HTML não tem "autoplay": quem decide é este código.
   - Toca sozinho só se a pessoa NÃO pediu menos movimento no sistema.
   - O botão .video-toggle pausa/toca. aria-pressed="true" = pausado.
   - Pausa sozinho quando sai da tela ou quando a aba fica escondida
     (economiza bateria) e volta só se a PESSOA não tinha pausado.
   - Se o vídeo não carregar, o botão some e fica o poster (a imagem).

   A ideia central: "querTocar" guarda a VONTADE (da pessoa ou da
   preferência do sistema). Tocar de verdade = vontade + condições
   (estar na tela, aba visível, vídeo funcionando).
   ===================================================================== */
const video = document.querySelector(".hero__video");
const botaoVideo = document.querySelector(".video-toggle");

// Exposta para outras partes (ex.: o player do YouTube pausa o fundo)
let pausarVideoDoHero = function () {};

if (video && botaoVideo) {
    let querTocar = !midiaMenosMovimento.matches;  // vontade atual
    let heroNaTela = true;                         // o hero está visível?
    let videoFalhou = false;                       // nenhuma fonte funcionou?

    // Descrição do estado, lida junto com o nome do botão pelo leitor de tela.
    // O NOME fica fixo ("Pausar vídeo de fundo"); o estado vem do aria-pressed
    // e desta descrição ("Vídeo tocando" / "Vídeo pausado").
    const estadoVideo = document.createElement("span");
    estadoVideo.id = "video-toggle-estado";
    estadoVideo.hidden = true;   // escondido de todos; só serve de descrição
    botaoVideo.after(estadoVideo);
    botaoVideo.setAttribute("aria-describedby", estadoVideo.id);

    const atualizarBotaoVideo = function () {
        botaoVideo.setAttribute("aria-pressed", querTocar ? "false" : "true");
        estadoVideo.textContent = querTocar ? "Vídeo tocando" : "Vídeo pausado";
    };

    const tentarTocar = function () {
        const promessa = video.play();
        // Navegadores novos devolvem uma "promessa". Se o play for recusado
        // (ex.: modo economia), tratamos aqui, sem erro no console.
        if (promessa && typeof promessa.catch === "function") {
            promessa.catch(function (erro) {
                // AbortError = um pause() chegou antes do play terminar: tudo bem.
                if (erro && erro.name === "AbortError") return;
                querTocar = false;          // foi recusado: mostra o botão "tocar"
                atualizarBotaoVideo();
            });
        }
    };

    // A única função que manda tocar ou pausar de verdade
    const aplicarEstadoDoVideo = function () {
        const deveTocar = querTocar && heroNaTela && !document.hidden && !videoFalhou;
        if (deveTocar && video.paused) tentarTocar();
        else if (!deveTocar && !video.paused) video.pause();
        atualizarBotaoVideo();
    };

    // O vídeo não carregou: some com o botão (não há o que pausar) e fica o poster
    const marcarFalhaDoVideo = function () {
        videoFalhou = true;
        botaoVideo.hidden = true;
        if (!video.paused) video.pause();
    };

    // Com várias <source>, o erro de cada uma dispara NELA (não no <video>).
    // Só a ÚLTIMA importa: se ela falhou, todas falharam.
    const fontes = video.querySelectorAll("source");
    const ultimaFonte = fontes[fontes.length - 1];
    if (ultimaFonte) ultimaFonte.addEventListener("error", marcarFalhaDoVideo);
    video.addEventListener("error", marcarFalhaDoVideo);  // erro do próprio vídeo (ex.: decodificação)

    // Pode ter falhado ANTES deste script rodar (aí perdemos os eventos "error").
    // Sinal: o vídeo está em "sem fonte" (NETWORK_NO_SOURCE) e não tem nada
    // carregado (HAVE_NOTHING). Quando dá certo, a esta altura ele já está
    // baixando (NETWORK_LOADING) ou com os dados prontos (NETWORK_IDLE).
    if (video.error || (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE &&
                        video.readyState === HTMLMediaElement.HAVE_NOTHING)) {
        marcarFalhaDoVideo();
    }

    // Clique no botão = vontade da pessoa (vale mais que a preferência do sistema)
    botaoVideo.addEventListener("click", function () {
        querTocar = !querTocar;
        aplicarEstadoDoVideo();
    });

    // A preferência de movimento mudou com a página aberta
    aoMudarMidia(midiaMenosMovimento, function () {
        querTocar = !midiaMenosMovimento.matches;
        aplicarEstadoDoVideo();
    });

    // Fora da tela: pausa (e volta ao reaparecer, se a pessoa não pausou)
    const hero = document.getElementById("inicio");
    if ("IntersectionObserver" in window && hero) {
        new IntersectionObserver(function (entradas) {
            heroNaTela = entradas[0].isIntersecting;
            aplicarEstadoDoVideo();
        }, { threshold: 0 }).observe(hero);
    }

    // Aba escondida (trocou de aba, minimizou): pausa; ao voltar, retoma
    document.addEventListener("visibilitychange", aplicarEstadoDoVideo);

    pausarVideoDoHero = function () {
        querTocar = false;
        aplicarEstadoDoVideo();
    };

    aplicarEstadoDoVideo();   // decide o estado inicial
}


/* =====================================================================
   7. PLAYERS COM "FACHADA" (Spotify e YouTube)
   ---------------------------------------------------------------------
   Até o clique, só há uma imagem + botão (nenhum dado vai para o Spotify
   ou o YouTube). No clique: .is-loading e criamos a <iframe> oficial.
   Quando ela carrega: .is-loaded (a fachada some) e o foco vai para o player.

   Como saber se deu CERTO de verdade? O evento "load" da <iframe> também
   dispara quando o navegador mostra a página de erro dele (sem internet,
   bloqueio de rede...). Por isso esperamos um "oi" do player:
   - o Spotify manda sozinho a mensagem { type: "ready" };
   - o YouTube responde quando perguntamos (por isso o enablejsapi=1 no
     endereço) e também avisa se o vídeo não puder tocar fora do YouTube.
   Se a iframe nem carregar em 10 s: desiste e volta a fachada. Se carregar
   mas o player não der sinal de vida: fica o que carregou e um aviso
   oferece o link externo como alternativa.
   ===================================================================== */
const TEMPO_LIMITE_PLAYER = 10000;   // 10 s para a iframe carregar
const TEMPO_SINAL_PLAYER = 6000;     // depois disso, 6 s para o player dar sinal de vida

// Configuração de cada player. Só endereços OFICIAIS entram numa <iframe>.
const PLAYERS = {
    spotify: {
        src: "https://open.spotify.com/embed/track/7nxvsuEtsUoFWx5H9jaF8A?utm_source=generator&theme=0",
        origem: "https://open.spotify.com",
        title: "Spotify: prévia de Una Noche Más, de Alan Navarro e Karol Sevilla",
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        erro: "Não deu para carregar o player do Spotify.",
        alternativa: { href: "https://open.spotify.com/intl-es/track/7nxvsuEtsUoFWx5H9jaF8A", texto: "Ouvir no Spotify" }
    },
    youtube: {
        src: "https://www.youtube-nocookie.com/embed/pCgq0ZMoUg4?autoplay=1&rel=0&enablejsapi=1",
        origem: "https://www.youtube-nocookie.com",
        title: "YouTube: clipe oficial de Una Noche Más, de Alan Navarro e Karol Sevilla",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        telaCheia: true,
        perguntar: true,   // o YouTube só fala se a gente "chamar" primeiro
        erro: "Não deu para carregar o clipe aqui.",
        erroDoVideo: "O YouTube não liberou o clipe para tocar aqui.",
        alternativa: { href: "https://www.youtube.com/watch?v=pCgq0ZMoUg4", texto: "Assistir no YouTube" }
    }
};

function carregarPlayer(botao) {
    const tipo = botao.dataset.player;
    const config = PLAYERS[tipo];
    const player = botao.closest(".player");
    if (!config || !player) return;
    // Já está carregando ou carregado? Não faz nada (evita duas iframes).
    if (player.classList.contains("is-loading") || player.classList.contains("is-loaded")) return;

    player.classList.add("is-loading");
    // aria-disabled em vez de disabled: "disabled" tiraria o foco do botão
    // e quem usa teclado ficaria "perdido" na página.
    botao.setAttribute("aria-disabled", "true");

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", config.title);   // nome da iframe para leitores de tela
    iframe.setAttribute("allow", config.allow);   // o que o player pode usar (tocar, tela cheia...)
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    if (config.telaCheia) iframe.setAttribute("allowfullscreen", "");

    let carregou = false;      // a iframe disparou "load"?
    let deuSinal = false;      // o player mandou mensagem?
    let avisou = false;        // já mostramos um aviso de erro? (só um por player)
    let perguntas = null;      // repetição da "chamada" ao YouTube

    function avisarErro(texto) {
        if (avisou) return;
        avisou = true;
        mostrarToast(texto, "erro", { link: config.alternativa });
    }

    // Mensagens que chegam das iframes. Só aceitamos as que vêm DESTA iframe
    // (event.source) e do endereço oficial (event.origin): segurança.
    function aoReceberMensagem(evento) {
        if (evento.source !== iframe.contentWindow || evento.origin !== config.origem) return;
        deuSinal = true;
        clearInterval(perguntas);
        // O YouTube manda texto em formato JSON; "onError" = o vídeo não pode tocar aqui
        if (typeof evento.data === "string" && evento.data.indexOf('"onError"') !== -1) {
            avisarErro(config.erroDoVideo || config.erro);
        }
    }
    window.addEventListener("message", aoReceberMensagem);

    // 1) A iframe nem carregou em 10 s: desiste e devolve a fachada como estava
    const cronometro = setTimeout(function () {
        if (carregou) return;
        window.removeEventListener("message", aoReceberMensagem);
        iframe.remove();
        player.classList.remove("is-loading");
        botao.removeAttribute("aria-disabled");
        avisarErro(config.erro);
    }, TEMPO_LIMITE_PLAYER);

    iframe.addEventListener("load", function () {
        if (carregou) return;
        carregou = true;
        clearTimeout(cronometro);
        player.classList.remove("is-loading");
        player.classList.add("is-loaded");
        botao.removeAttribute("aria-disabled");

        // A fachada continua no HTML (o motion.css a desbota por cima da iframe).
        // "inert" garante que ela não recebe mais clique, Tab nem leitor de tela.
        const fachada = player.querySelector(".player__fachada");
        if (fachada) fachada.inert = true;

        // Se o foco estava na fachada, ele passa para o player (que a substituiu)
        const ativo = document.activeElement;
        if (!ativo || ativo === document.body || player.contains(ativo)) iframe.focus();

        // O clipe tem som: pausa o vídeo de fundo para não disputar atenção
        if (tipo === "youtube") pausarVideoDoHero();

        // "Chama" o YouTube algumas vezes (ele pode demorar a ficar pronto)
        if (config.perguntar) {
            const chamar = function () {
                if (!iframe.contentWindow) return;
                iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), config.origem);
            };
            chamar();
            perguntas = setInterval(chamar, 500);
        }

        // 2) Carregou, mas o player não deu sinal de vida: provavelmente é a
        //    página de erro do navegador. Avisa e oferece o link externo.
        setTimeout(function () {
            clearInterval(perguntas);
            if (!deuSinal) avisarErro(config.erro);
        }, TEMPO_SINAL_PLAYER);
    });

    iframe.src = config.src;   // o src por último: só então o navegador começa a baixar
    player.appendChild(iframe);
}

document.querySelectorAll(".player__carregar[data-player]").forEach(function (botao) {
    botao.addEventListener("click", function () {
        carregarPlayer(botao);
    });
});

// CTA "Assistir ao clipe" do hero: rola até o player e põe o foco no botão
// da fachada. NÃO carrega o vídeo sozinho (a pessoa decide clicar).
const ctaClipe = document.querySelector('.hero__acoes a[href="#player-youtube"]');
const playerYoutube = document.getElementById("player-youtube");
if (ctaClipe && playerYoutube) {
    ctaClipe.addEventListener("click", function (evento) {
        evento.preventDefault();
        playerYoutube.scrollIntoView({ behavior: comportamentoDeRolagem(), block: "center" });
        // Se o player já foi carregado, o foco vai para a iframe; senão, para o botão
        const alvo = playerYoutube.querySelector("iframe") || playerYoutube.querySelector(".player__carregar");
        if (alvo) alvo.focus({ preventScroll: true });
        // Atualiza o endereço (#player-youtube) sem pular a página
        if (window.history && history.replaceState) history.replaceState(null, "", "#player-youtube");
    });
}


/* =====================================================================
   8. FOTOS COM RESERVA DE INICIAIS
   ---------------------------------------------------------------------
   Se a imagem falhar, o .foto (pai) ganha .foto--falhou e o CSS mostra
   as iniciais (data-iniciais). Duas situações:
   - a falha acontece depois: o evento "error" avisa;
   - a falha aconteceu ANTES deste script rodar: aí a imagem já está
     "completa" (complete) mas sem largura (naturalWidth === 0).
   ===================================================================== */
document.querySelectorAll(".foto img").forEach(function (imagem) {
    const moldura = imagem.closest(".foto");
    if (!moldura) return;

    const marcarFalha = function () { moldura.classList.add("foto--falhou"); };

    imagem.addEventListener("error", marcarFalha);
    imagem.addEventListener("load", function () { moldura.classList.remove("foto--falhou"); });

    if (imagem.complete && imagem.naturalWidth === 0 && imagem.getAttribute("src")) marcarFalha();
});


/* =====================================================================
   9. TECLA Esc (uma central só)
   ---------------------------------------------------------------------
   Prioridade: 1º fecha o menu do celular; se ele não está aberto, fecha
   o aviso (toast). Assim um Esc nunca faz duas coisas de uma vez.
   ===================================================================== */
document.addEventListener("keydown", function (evento) {
    if (evento.key !== "Escape" && evento.key !== "Esc") return;

    if (menuEstaAberto()) {
        fecharMenu(true);
    } else if (toastAtual) {
        fecharToast();
    }
});
