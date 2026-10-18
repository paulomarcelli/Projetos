// =====================================================================
// script.js — FUNCIONALIDADES DO SITE "CENICIENTA" (Agente 2)
// ---------------------------------------------------------------------
// Sumário (procure pelo número para achar cada parte):
//   0. Classe "js" no <html>
//   1. Ferramentas comuns (movimento reduzido, foco)
//   2. Revelar blocos ao rolar ([data-reveal])
//   3. Header sólido ao rolar + botão "voltar ao topo"
//   4. Menu do celular
//   5. Link ativo no menu (seção visível)
//   6. Vídeo do hero (pausar/tocar)
//   7. Toast (avisos rápidos)
//   8. Mensagens dos fãs (formulário + mural salvo no navegador)
//   9. Compartilhar
//  10. Tecla Esc
//
// Regra do projeto: o JS só COLOCA/TIRA classes e atributos.
// A aparência fica no CSS e as animações no motion.css / motion.js.
// =====================================================================

// 0. Avisa ao CSS que o JavaScript está funcionando.
//    Coloca a classe "js" na tag <html>. O CSS só esconde coisas (para animar)
//    quando essa classe existe — então, se o JS falhar, todo o conteúdo continua visível.
document.documentElement.classList.add('js');

// Todo o resto fica dentro de uma "função que se chama sozinha" (IIFE):
// (function () { ... })();
// Assim as nossas variáveis ficam "trancadas" aqui dentro e não brigam com
// variáveis de mesmo nome em outros arquivos (como o motion.js).
(function () {
    'use strict'; // modo estrito: o navegador avisa mais erros bobos (ex.: variável sem declarar)


    // =================================================================
    // 1. FERRAMENTAS COMUNS
    // =================================================================

    // matchMedia "pergunta" ao navegador se uma media query é verdadeira — igual ao @media do CSS.
    // Aqui: a pessoa pediu ao sistema para REDUZIR MOVIMENTO?
    const midiaMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function prefereMenosMovimento() {
        return midiaMenosMovimento.matches;
    }

    // Espelha a preferência numa classe do <html> (contrato: html.reduz-movimento)
    function atualizarClasseMovimento() {
        document.documentElement.classList.toggle('reduz-movimento', prefereMenosMovimento());
    }
    atualizarClasseMovimento();

    // Função de ajuda para "escutar" mudanças numa media query.
    // Navegadores antigos (Safari < 14) só conhecem addListener, por isso o if.
    function quandoMudar(midia, funcao) {
        if (midia.addEventListener) {
            midia.addEventListener('change', funcao);
        } else if (midia.addListener) {
            midia.addListener(funcao);
        }
    }
    quandoMudar(midiaMenosMovimento, atualizarClasseMovimento);

    // Coloca o foco num elemento SEM fazer a página pular até ele.
    function focar(elemento) {
        if (!elemento) return;
        try {
            elemento.focus({ preventScroll: true });
        } catch (erro) {
            elemento.focus(); // navegadores bem antigos não entendem a opção
        }
    }


    // =================================================================
    // 2. REVELAR BLOCOS AO ROLAR
    // Todo bloco com data-reveal ganha .is-visible quando aparece na tela.
    // (O "como aparece" — a animação — é do motion.css.)
    // =================================================================
    const blocosRevelar = document.querySelectorAll('[data-reveal]');

    // Se o navegador não conhece o IntersectionObserver (muito antigo),
    // já mostra tudo de uma vez para nada ficar escondido.
    if (!('IntersectionObserver' in window)) {
        blocosRevelar.forEach(function (bloco) {
            bloco.classList.add('is-visible');
        });
    } else {
        // O "observador" avisa quando um bloco entra na tela
        const observadorRevelar = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('is-visible'); // marca como visível
                    observadorRevelar.unobserve(entrada.target); // já apareceu: não precisa mais observar
                }
            });
        }, { threshold: 0.15 }); // 0.15 = dispara quando 15% do bloco estiver visível

        blocosRevelar.forEach(function (bloco) {
            observadorRevelar.observe(bloco);
        });
    }


    // =================================================================
    // 3. HEADER SÓLIDO AO ROLAR + BOTÃO "VOLTAR AO TOPO"
    // =================================================================
    const header = document.querySelector('.site-header');
    const botaoTopo = document.querySelector('.topo');
    const tituloPrincipal = document.getElementById('titulo-principal');

    // O evento "scroll" dispara MUITAS vezes por segundo. Para não pesar,
    // usamos requestAnimationFrame: a conta roda no máximo 1 vez por quadro da tela.
    let rolagemAgendada = false;

    function atualizarRolagem() {
        rolagemAgendada = false;
        const posicao = window.scrollY || window.pageYOffset;

        // Header sólido depois de rolar um pouquinho (24px)
        if (header) header.classList.toggle('is-scrolled', posicao > 24);

        // Botão de topo aparece depois de rolar mais ou menos 1 tela
        if (botaoTopo) botaoTopo.classList.toggle('is-visible', posicao > window.innerHeight * 0.9);
    }

    function aoRolar() {
        if (rolagemAgendada) return;
        rolagemAgendada = true;
        window.requestAnimationFrame(atualizarRolagem);
    }

    // passive: true → avisa ao navegador que não vamos impedir a rolagem (fica mais fluido no celular)
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar, { passive: true });
    atualizarRolagem(); // confere já na abertura (a página pode abrir no meio, ex.: ao recarregar)

    if (botaoTopo) {
        botaoTopo.addEventListener('click', function () {
            // 1º move o foco para o título (quem usa teclado continua "lá em cima")...
            focar(tituloPrincipal);
            // ...2º rola até o topo. Com "reduzir movimento", pula direto sem animar.
            window.scrollTo({ top: 0, behavior: prefereMenosMovimento() ? 'auto' : 'smooth' });
        });
    }

    // Skip-link: garante que o foco vá MESMO para o <main> (alguns navegadores só rolam).
    const skipLink = document.querySelector('.skip-link');
    const conteudo = document.getElementById('conteudo');
    if (skipLink && conteudo) {
        skipLink.addEventListener('click', function () {
            // setTimeout 0 → espera o navegador terminar o "pulo" da âncora e então foca
            window.setTimeout(function () { focar(conteudo); }, 0);
        });
    }


    // =================================================================
    // 4. MENU DO CELULAR
    // Contrato: body.menu-aberto + botão aria-expanded="true" + lista .is-open
    // =================================================================
    const botaoMenu = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu-principal');
    const midiaCelular = window.matchMedia('(max-width: 768px)'); // mesmo ponto de quebra do CSS
    let menuAberto = false;

    function abrirMenu() {
        menuAberto = true;
        botaoMenu.setAttribute('aria-expanded', 'true');
        botaoMenu.setAttribute('aria-label', 'Fechar menu');
        trocarIconeMenu('fa-xmark');
        menu.classList.add('is-open');
        document.body.classList.add('menu-aberto'); // o CSS trava a rolagem da página de trás

        // Leva o foco para o primeiro link (no próximo quadro, depois que o menu ficou visível)
        window.requestAnimationFrame(function () {
            focar(menu.querySelector('a'));
        });
    }

    // devolverFoco = true → o foco volta para o botão (ex.: quando fecha com Esc)
    function fecharMenu(devolverFoco) {
        if (!menuAberto) return;
        menuAberto = false;
        botaoMenu.setAttribute('aria-expanded', 'false');
        botaoMenu.setAttribute('aria-label', 'Abrir menu');
        trocarIconeMenu('fa-bars');
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-aberto');
        if (devolverFoco) focar(botaoMenu);
    }

    // Troca o ícone ☰ ↔ ✕ dentro do botão
    function trocarIconeMenu(icone) {
        const i = botaoMenu.querySelector('i');
        if (!i) return;
        i.classList.remove('fa-bars', 'fa-xmark');
        i.classList.add(icone);
    }

    if (botaoMenu && menu) {
        botaoMenu.addEventListener('click', function () {
            if (menuAberto) {
                fecharMenu(false);
            } else {
                abrirMenu();
            }
        });

        // Clicou num link do menu → fecha (a página rola até a seção normalmente)
        menu.addEventListener('click', function (evento) {
            if (evento.target.closest('a')) fecharMenu(false);
        });

        // Clicou FORA do menu (ou no fundo vazio do painel) → fecha
        document.addEventListener('click', function (evento) {
            if (!menuAberto) return;
            const clicouNoBotao = botaoMenu.contains(evento.target);
            const clicouNumLink = Boolean(evento.target.closest('#menu-principal a'));
            if (!clicouNoBotao && !clicouNumLink) fecharMenu(false);
        });

        // "Prende" o Tab dentro do menu aberto: do último link volta para o botão e vice-versa.
        // (O botão vem antes da lista no HTML, então o resto do caminho já é natural.)
        document.addEventListener('keydown', function (evento) {
            if (!menuAberto || evento.key !== 'Tab') return;
            const links = menu.querySelectorAll('a');
            const ultimo = links[links.length - 1];
            if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                focar(botaoMenu);
            } else if (evento.shiftKey && document.activeElement === botaoMenu) {
                evento.preventDefault();
                focar(ultimo);
            }
        });

        // Girou o celular / aumentou a janela até virar "computador" → fecha e limpa tudo
        quandoMudar(midiaCelular, function () {
            if (!midiaCelular.matches) fecharMenu(false);
        });
    }


    // =================================================================
    // 5. LINK ATIVO NO MENU
    // Marca aria-current="true" no link da seção que está no meio da tela.
    // =================================================================
    const linksMenu = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
    const secoesMenu = linksMenu
        .map(function (link) { return document.querySelector(link.getAttribute('href')); })
        .filter(Boolean); // tira da lista os links cujo destino não existe

    function marcarLinkAtivo(id) {
        linksMenu.forEach(function (link) {
            if (link.getAttribute('href') === '#' + id) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    if ('IntersectionObserver' in window && secoesMenu.length) {
        const secoesNaFaixa = new Set(); // ids das seções que estão cruzando a "faixa" do meio da tela
        let ignorarAte = 0; // depois de um clique no menu, ignoramos o observador por um instante

        function escolherSecaoAtiva() {
            let ativa = null;
            let reserva = null;
            secoesMenu.forEach(function (secao) {
                if (!secoesNaFaixa.has(secao.id)) return;
                // No computador o cartão da música é "sticky" (fica grudado enquanto o texto
                // da esquerda rola), então ele está SEMPRE na faixa. Ele só vira o ativo
                // se nenhuma outra seção estiver na faixa.
                if (window.getComputedStyle(secao).position === 'sticky') {
                    reserva = secao.id;
                } else {
                    ativa = secao.id; // a última da lista que está na faixa vence
                }
            });
            const escolhida = ativa || reserva;
            if (escolhida) marcarLinkAtivo(escolhida);
        }

        // rootMargin "encolhe" a área observada para uma faixa fina perto do meio da tela
        // (de 40% a 45% da altura). A seção que cruzar essa faixa é a "atual".
        const observadorSecoes = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    secoesNaFaixa.add(entrada.target.id);
                } else {
                    secoesNaFaixa.delete(entrada.target.id);
                }
            });
            if (Date.now() > ignorarAte) escolherSecaoAtiva();
        }, { rootMargin: '-40% 0px -55% 0px' });

        secoesMenu.forEach(function (secao) { observadorSecoes.observe(secao); });

        // Clique num link: marca na hora (sem esperar a rolagem terminar)
        linksMenu.forEach(function (link) {
            link.addEventListener('click', function () {
                marcarLinkAtivo(link.getAttribute('href').slice(1));
                ignorarAte = Date.now() + 1000; // 1s: tempo da rolagem suave
            });
        });
    }


    // =================================================================
    // 6. VÍDEO DO HERO
    // aria-pressed="true" = pausado | "false" = tocando (contrato do CSS).
    // =================================================================
    const video = document.querySelector('.hero__video');
    const botaoVideo = document.querySelector('.video-toggle');
    const estadoVideo = document.getElementById('video-estado');
    const hero = document.querySelector('.hero');

    if (video && botaoVideo) {
        // A pessoa (ou o sistema, com "reduzir movimento") quer o vídeo PARADO?
        let pausadoPorEscolha = prefereMenosMovimento();
        let heroNaTela = true;
        let videoComErro = false;

        function mostrarEstadoVideo() {
            botaoVideo.setAttribute('aria-pressed', String(pausadoPorEscolha));
            let texto = pausadoPorEscolha ? 'Vídeo pausado.' : 'Vídeo tocando.';
            if (pausadoPorEscolha && prefereMenosMovimento()) {
                texto = 'Vídeo pausado porque seu sistema pede menos movimento. Aperte para tocar.';
            }
            if (estadoVideo) estadoVideo.textContent = texto;
            // title → dica que aparece ao parar o mouse em cima (só quando é útil)
            if (pausadoPorEscolha && prefereMenosMovimento()) {
                botaoVideo.title = texto;
            } else {
                botaoVideo.removeAttribute('title');
            }
        }

        // Tenta tocar, mas só se faz sentido: ninguém pediu pausa, o hero está na tela
        // e a aba está aberta. Assim economizamos bateria e internet.
        function tentarTocar() {
            if (pausadoPorEscolha || !heroNaTela || document.hidden || videoComErro) return;
            const promessa = video.play();
            // play() devolve uma Promise. Se o navegador bloquear (modo economia de energia,
            // por exemplo), ela é "rejeitada". Tratamos aqui para não aparecer erro no console:
            // o vídeo fica parado no poster e o botão mostra "pausado" (dá para tocar pelo botão).
            if (promessa && typeof promessa.catch === 'function') {
                promessa.catch(function (erro) {
                    // AbortError = alguém chamou pause() antes de o play terminar → é normal, ignora
                    if (erro && erro.name === 'AbortError') return;
                    pausadoPorEscolha = true;
                    mostrarEstadoVideo();
                });
            }
        }

        // Se o vídeo não carregar (arquivo faltando, formato não suportado...),
        // o poster continua aparecendo e o botão some — ele não teria o que controlar.
        function falhaNoVideo() {
            videoComErro = true;
            botaoVideo.hidden = true;
        }

        // Há duas fontes (WebM e MP4). Se a primeira falhar, o navegador tenta a próxima sozinho;
        // só é falha de verdade quando a ÚLTIMA fonte também der erro.
        const fontes = video.querySelectorAll('source');
        const fonteVideo = fontes[fontes.length - 1];
        // Atenção: quando o arquivo falha, o evento "error" acontece no <source>, não no <video>
        if (fonteVideo) fonteVideo.addEventListener('error', falhaNoVideo);
        video.addEventListener('error', falhaNoVideo);
        // networkState 3 = NETWORK_NO_SOURCE (nenhuma fonte serviu) — caso o erro já tenha acontecido
        if (video.error || video.networkState === 3) falhaNoVideo();

        botaoVideo.addEventListener('click', function () {
            if (pausadoPorEscolha) {
                pausadoPorEscolha = false;
                mostrarEstadoVideo();
                tentarTocar();
            } else {
                pausadoPorEscolha = true;
                video.pause();
                mostrarEstadoVideo();
            }
        });

        // Aba escondida (trocou de aba / bloqueou o celular) → pausa. Voltou → retoma
        // (só se a pessoa não tinha pausado de propósito — tentarTocar() confere isso).
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                video.pause();
            } else {
                tentarTocar();
            }
        });

        // Hero saiu da tela (a pessoa rolou para baixo) → pausa. Voltou → retoma.
        if ('IntersectionObserver' in window && hero) {
            const observadorHero = new IntersectionObserver(function (entradas) {
                heroNaTela = entradas[0].isIntersecting;
                if (heroNaTela) {
                    tentarTocar();
                } else {
                    video.pause();
                }
            });
            observadorHero.observe(hero);
        }

        // Se a pessoa ligar "reduzir movimento" com o site aberto, o vídeo para.
        quandoMudar(midiaMenosMovimento, function () {
            if (prefereMenosMovimento()) {
                pausadoPorEscolha = true;
                video.pause();
                mostrarEstadoVideo();
            }
        });

        mostrarEstadoVideo();
        tentarTocar(); // o HTML não tem "autoplay": quem dá o play é esta linha
    }


    // =================================================================
    // 7. TOAST (avisos rápidos)
    // Uso: mostrarToast('Texto', 'sucesso' | 'erro' | 'info', { rotuloAcao, acao, duracao })
    // Os avisos entram numa FILA: se já tem um na tela, o próximo espera.
    // =================================================================
    const toast = document.querySelector('.toast');
    const toastTexto = toast ? toast.querySelector('.toast__texto') : null;
    const toastAcao = toast ? toast.querySelector('.toast__acao') : null;
    const toastFechar = toast ? toast.querySelector('.toast__fechar') : null;

    const DURACAO_TOAST = 3500;     // 3,5 s na tela
    const PAUSA_ENTRE_TOASTS = 300; // tempo para o anterior sair (a saída dura --dur-media, 250ms)

    const filaToasts = [];
    let toastAtual = null;   // o aviso que está na tela agora (ou null)
    let timerToast = null;
    let tempoRestante = 0;
    let inicioContagem = 0;
    let mouseNoToast = false;
    let focoNoToast = false;
    let focoAntesDoToast = null; // para devolver o foco quando o toast fechar

    function mostrarToast(texto, tipo, opcoes) {
        if (!toast) return;
        opcoes = opcoes || {};
        filaToasts.push({
            texto: String(texto),
            tipo: tipo || 'info',
            rotuloAcao: opcoes.rotuloAcao || '',
            acao: typeof opcoes.acao === 'function' ? opcoes.acao : null,
            duracao: opcoes.duracao || DURACAO_TOAST
        });
        if (!toastAtual) mostrarProximoToast();
    }

    function mostrarProximoToast() {
        toastAtual = filaToasts.shift() || null;
        if (!toastAtual) return;

        toast.classList.remove('toast--sucesso', 'toast--erro');
        if (toastAtual.tipo === 'sucesso') toast.classList.add('toast--sucesso');
        if (toastAtual.tipo === 'erro') toast.classList.add('toast--erro');

        // Botão de ação ("Desfazer") só aparece quando o aviso tem uma ação
        toastAcao.hidden = !toastAtual.acao;
        toastAcao.textContent = toastAtual.rotuloAcao || 'Desfazer';

        toast.classList.add('is-shown');

        // Primeiro mostra o toast e SÓ DEPOIS escreve o texto (no próximo quadro):
        // o leitor de tela só anuncia mudanças em áreas que já estão visíveis.
        toastTexto.textContent = '';
        const textoParaMostrar = toastAtual.texto;
        window.requestAnimationFrame(function () {
            toastTexto.textContent = textoParaMostrar;
        });

        tempoRestante = toastAtual.duracao;
        if (!mouseNoToast && !focoNoToast) iniciarContagemToast();
    }

    function iniciarContagemToast() {
        window.clearTimeout(timerToast);
        inicioContagem = Date.now();
        timerToast = window.setTimeout(esconderToast, tempoRestante);
    }

    // Mouse em cima ou foco dentro do toast → o tempo "congela" (dá tempo de ler/clicar)
    function pausarContagemToast() {
        if (!toastAtual) return;
        window.clearTimeout(timerToast);
        tempoRestante = Math.max(tempoRestante - (Date.now() - inicioContagem), 1000);
    }

    function esconderToast() {
        window.clearTimeout(timerToast);
        if (!toastAtual) return;

        // Se o foco estava num botão do toast, devolve para onde estava antes
        const focoEstavaDentro = toast.contains(document.activeElement);
        toast.classList.remove('is-shown');
        toastAtual = null;
        mouseNoToast = false;
        focoNoToast = false;
        if (focoEstavaDentro) {
            focar(focoAntesDoToast && document.contains(focoAntesDoToast) ? focoAntesDoToast : conteudo);
        }

        if (filaToasts.length) window.setTimeout(mostrarProximoToast, PAUSA_ENTRE_TOASTS);
    }

    if (toast) {
        toast.addEventListener('mouseenter', function () {
            mouseNoToast = true;
            pausarContagemToast();
        });
        toast.addEventListener('mouseleave', function () {
            mouseNoToast = false;
            if (toastAtual && !focoNoToast) iniciarContagemToast();
        });
        toast.addEventListener('focusin', function (evento) {
            // relatedTarget = de onde o foco veio; se veio de fora, guardamos para devolver depois
            if (!focoNoToast && evento.relatedTarget && !toast.contains(evento.relatedTarget)) {
                focoAntesDoToast = evento.relatedTarget;
            }
            focoNoToast = true;
            pausarContagemToast();
        });
        toast.addEventListener('focusout', function (evento) {
            if (evento.relatedTarget && toast.contains(evento.relatedTarget)) return; // só mudou de botão
            focoNoToast = false;
            if (toastAtual && !mouseNoToast) iniciarContagemToast();
        });
        toastFechar.addEventListener('click', esconderToast);
        toastAcao.addEventListener('click', function () {
            const acao = toastAtual && toastAtual.acao;
            esconderToast();
            if (acao) acao();
        });
    }


    // =================================================================
    // 8. MENSAGENS DOS FÃS
    // ATENÇÃO: este site NÃO tem servidor. As mensagens ficam guardadas só no
    // navegador de quem escreveu (localStorage). Outras pessoas não as veem.
    // =================================================================
    const form = document.getElementById('form-mensagem');
    const listaMensagens = document.getElementById('lista-mensagens');
    const tituloMural = document.getElementById('titulo-mural');

    const CHAVE_STORAGE = 'cenicienta:mensagens:v1'; // "nome da gaveta" no localStorage
    const MAX_MENSAGENS = 20;
    const LIMITES = {
        nome: { min: 2, max: 40 },
        mensagem: { min: 5, max: 280 }
    };
    const AVISO_PERTO_DO_LIMITE = 260; // a partir daqui o contador fica em destaque e é falado

    let mensagens = []; // a lista "oficial" (mais nova primeiro)

    // ---------- 8.1 Limpar o texto digitado ----------
    // Nome: troca qualquer sequência de espaços/quebras por UM espaço e tira as pontas.
    function normalizarNome(valor) {
        return String(valor).replace(/\s+/g, ' ').trim();
    }

    // Mensagem: mantém as quebras de linha (no máximo uma linha em branco seguida),
    // mas junta espaços repetidos.
    function normalizarTexto(valor) {
        return String(valor)
            .replace(/\r\n?/g, '\n')      // quebra de linha do Windows → padrão
            .replace(/[^\S\n]+/g, ' ')    // espaços/tabs repetidos (sem contar \n) → 1 espaço
            .replace(/ *\n */g, '\n')     // tira espaços em volta das quebras
            .replace(/\n{3,}/g, '\n\n')   // no máximo 1 linha em branco
            .trim();
    }

    // ---------- 8.2 Guardar e ler no localStorage ----------
    function criarId() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    // Confere UM item lido do localStorage. Qualquer coisa estranha → descarta (null).
    // Importante porque o localStorage pode ser editado à mão (DevTools) ou por versões antigas.
    function sanitizarMensagem(item) {
        if (!item || typeof item !== 'object') return null;
        if (typeof item.nome !== 'string' || typeof item.texto !== 'string') return null;

        const nome = normalizarNome(item.nome);
        const texto = normalizarTexto(item.texto);
        if (nome.length < LIMITES.nome.min || nome.length > LIMITES.nome.max) return null;
        if (texto.length < LIMITES.mensagem.min || texto.length > LIMITES.mensagem.max) return null;

        const quando = Date.parse(item.data);
        if (isNaN(quando)) return null;

        const idValido = typeof item.id === 'string' && /^[a-z0-9-]{1,40}$/i.test(item.id);
        return {
            id: idValido ? item.id : criarId(),
            nome: nome,
            texto: texto,
            data: new Date(quando).toISOString()
        };
    }

    function lerMensagens() {
        let bruto = null;
        // try/catch: o localStorage pode estar bloqueado (aba anônima, configurações de privacidade)
        try {
            bruto = window.localStorage.getItem(CHAVE_STORAGE);
        } catch (erro) {
            return [];
        }
        if (!bruto) return [];

        let dados;
        try {
            dados = JSON.parse(bruto);
        } catch (erro) {
            return []; // texto corrompido: começa do zero em vez de quebrar a página
        }
        if (!Array.isArray(dados)) return [];

        return dados
            .map(sanitizarMensagem)
            .filter(Boolean)
            .sort(function (a, b) { return Date.parse(b.data) - Date.parse(a.data); }) // mais nova primeiro
            .slice(0, MAX_MENSAGENS);
    }

    // Devolve true se conseguiu salvar, false se não (cheio, bloqueado...)
    function salvarMensagens() {
        try {
            window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(mensagens));
            return true;
        } catch (erro) {
            return false;
        }
    }

    // ---------- 8.3 Datas legíveis ("há 5 minutos") ----------
    const formatoRelativo = (window.Intl && Intl.RelativeTimeFormat)
        ? new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }) // numeric auto → "ontem" em vez de "há 1 dia"
        : null;

    function dataCompleta(iso) {
        return new Date(iso).toLocaleString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function dataRelativa(iso) {
        const segundos = Math.round((Date.parse(iso) - Date.now()) / 1000); // negativo = passado
        const distancia = Math.abs(segundos);
        if (distancia < 45) return 'agora mesmo';
        if (!formatoRelativo) return dataCompleta(iso);
        if (distancia < 3600) return formatoRelativo.format(Math.round(segundos / 60), 'minute');
        if (distancia < 86400) return formatoRelativo.format(Math.round(segundos / 3600), 'hour');
        if (distancia < 7 * 86400) return formatoRelativo.format(Math.round(segundos / 86400), 'day');
        return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ---------- 8.4 Desenhar o mural ----------
    // SEGURANÇA: tudo que a pessoa digitou entra com textContent (vira TEXTO puro).
    // Nunca use innerHTML com dados do usuário: um "<img onerror=...>" viraria código rodando.
    function criarItemMensagem(mensagem) {
        const item = document.createElement('li');
        item.className = 'mensagem';
        item.dataset.id = mensagem.id;

        const topo = document.createElement('div');
        topo.className = 'mensagem__topo';

        const nome = document.createElement('strong');
        nome.className = 'mensagem__nome';
        nome.textContent = mensagem.nome;

        // <time datetime="..."> → a data "de máquina" fica no atributo; o texto é para pessoas
        const data = document.createElement('time');
        data.className = 'mensagem__data';
        data.dateTime = mensagem.data;
        data.textContent = dataRelativa(mensagem.data);
        data.title = dataCompleta(mensagem.data);

        topo.append(nome, data);

        const texto = document.createElement('p');
        texto.className = 'mensagem__texto';
        texto.textContent = mensagem.texto;

        const apagar = document.createElement('button');
        apagar.type = 'button';
        apagar.className = 'mensagem__apagar';
        // O nome acessível começa com a palavra visível ("Apagar") e diz QUAL mensagem
        apagar.setAttribute('aria-label', 'Apagar mensagem de ' + mensagem.nome);
        const icone = document.createElement('i');
        icone.className = 'fa-solid fa-trash-can';
        icone.setAttribute('aria-hidden', 'true');
        const rotulo = document.createElement('span');
        rotulo.textContent = 'Apagar';
        apagar.append(icone, rotulo);

        item.append(topo, texto, apagar);
        return item;
    }

    function desenharMural() {
        // replaceChildren() esvazia a lista; depois colocamos cada item de novo
        listaMensagens.replaceChildren();
        mensagens.forEach(function (mensagem) {
            listaMensagens.appendChild(criarItemMensagem(mensagem));
        });
    }

    // Atualiza os "há X minutos" a cada minuto
    function atualizarDatas() {
        listaMensagens.querySelectorAll('time.mensagem__data').forEach(function (data) {
            data.textContent = dataRelativa(data.dateTime);
        });
    }

    // ---------- 8.5 Apagar (com "Desfazer") ----------
    function apagarMensagem(id) {
        const indice = mensagens.findIndex(function (m) { return m.id === id; });
        if (indice === -1) return;

        const removida = mensagens.splice(indice, 1)[0];
        const item = listaMensagens.querySelector('[data-id="' + id + '"]');

        // Para onde vai o foco? Próxima mensagem → anterior → título do mural.
        // (Se o botão focado some, o foco "cai" no começo da página — ruim para teclado.)
        let proximoFoco = tituloMural;
        if (item) {
            const vizinho = item.nextElementSibling || item.previousElementSibling;
            if (vizinho) proximoFoco = vizinho.querySelector('.mensagem__apagar');
            item.remove();
        }
        focar(proximoFoco);

        const salvou = salvarMensagens();
        if (!salvou) {
            mostrarToast('Mensagem apagada da tela, mas não deu para salvar a mudança neste navegador.', 'erro');
            return;
        }

        mostrarToast('Mensagem apagada', 'info', {
            rotuloAcao: 'Desfazer',
            duracao: 6000, // um pouco mais de tempo para dar chance de desfazer
            acao: function () {
                mensagens.splice(Math.min(indice, mensagens.length), 0, removida);
                mensagens = mensagens.slice(0, MAX_MENSAGENS);
                salvarMensagens();
                desenharMural();
                const restaurado = listaMensagens.querySelector('[data-id="' + removida.id + '"]');
                if (restaurado) focar(restaurado.querySelector('.mensagem__apagar'));
                mostrarToast('Mensagem restaurada', 'sucesso');
            }
        });
    }

    // ---------- 8.6 Validação do formulário ----------
    if (form && listaMensagens) {
        const campoNome = document.getElementById('campo-nome');
        const campoMensagem = document.getElementById('campo-mensagem');
        const contagem = document.getElementById('contador-mensagem');
        const avisoContador = document.getElementById('contador-aviso');
        const botaoEnviar = form.querySelector('button[type="submit"]');
        const textoBotao = botaoEnviar.querySelector('.btn__texto');
        let enviando = false;
        let timerAvisoContador = null;

        // Devolve o texto do erro (ou '' se está tudo certo)
        function erroDoCampo(campo) {
            if (campo === campoNome) {
                const nome = normalizarNome(campo.value);
                if (!nome) return 'Escreva seu nome.';
                if (nome.length < LIMITES.nome.min) return 'O nome precisa ter pelo menos ' + LIMITES.nome.min + ' caracteres.';
                if (nome.length > LIMITES.nome.max) return 'O nome pode ter no máximo ' + LIMITES.nome.max + ' caracteres.';
            } else {
                const texto = normalizarTexto(campo.value);
                if (!texto) return 'Escreva uma mensagem.';
                if (texto.length < LIMITES.mensagem.min) return 'A mensagem precisa ter pelo menos ' + LIMITES.mensagem.min + ' caracteres.';
                if (texto.length > LIMITES.mensagem.max) return 'A mensagem pode ter no máximo ' + LIMITES.mensagem.max + ' caracteres.';
            }
            return '';
        }

        // Mostra/limpa o erro de um campo (contrato: .campo.is-invalid + aria-invalid)
        function mostrarErroCampo(campo, mensagemErro) {
            const caixa = campo.closest('.campo');
            const textoErro = caixa.querySelector('.campo__erro');
            textoErro.textContent = mensagemErro;
            caixa.classList.toggle('is-invalid', Boolean(mensagemErro));
            if (mensagemErro) {
                campo.setAttribute('aria-invalid', 'true');
            } else {
                campo.removeAttribute('aria-invalid');
            }
        }

        function validarCampo(campo) {
            const erro = erroDoCampo(campo);
            mostrarErroCampo(campo, erro);
            return erro;
        }

        [campoNome, campoMensagem].forEach(function (campo) {
            // Ao SAIR do campo: valida se a pessoa já digitou algo (ou se ele já estava com erro).
            // Não mostramos erro só porque alguém passou pelo campo com o Tab.
            campo.addEventListener('blur', function () {
                if (campo.dataset.mexido === 'sim' || campo.getAttribute('aria-invalid') === 'true') {
                    validarCampo(campo);
                }
            });
            // Enquanto digita: se o campo estava com erro, revalida na hora (o erro some assim que corrigir)
            campo.addEventListener('input', function () {
                campo.dataset.mexido = 'sim';
                if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
            });
        });

        // ---------- Contador de caracteres ----------
        function atualizarContador() {
            const total = campoMensagem.value.length;
            const maximo = LIMITES.mensagem.max;
            const faltam = maximo - total;

            // Reescreve o texto do contador: "123/280 caracteres..."
            const numero = document.createElement('span');
            numero.className = 'campo__contador';
            numero.textContent = total;
            let complemento = '/' + maximo + ' caracteres (mínimo ' + LIMITES.mensagem.min + ')';
            if (total >= AVISO_PERTO_DO_LIMITE) {
                complemento = '/' + maximo + ' caracteres — ' + (faltam > 0 ? 'faltam ' + faltam : 'limite atingido');
            }
            contagem.replaceChildren(numero, document.createTextNode(complemento));

            contagem.classList.toggle('is-perto', total >= AVISO_PERTO_DO_LIMITE && total < maximo);
            contagem.classList.toggle('is-limite', total >= maximo);

            // Aviso FALADO: só perto do limite, e esperando a pessoa parar de digitar (0,7 s)
            // para não ler um número a cada tecla.
            window.clearTimeout(timerAvisoContador);
            if (total < AVISO_PERTO_DO_LIMITE) {
                avisoContador.textContent = '';
                return;
            }
            timerAvisoContador = window.setTimeout(function () {
                avisoContador.textContent = faltam > 0
                    ? 'Faltam ' + faltam + ' caracteres.'
                    : 'Limite de ' + maximo + ' caracteres atingido.';
            }, 700);
        }
        campoMensagem.addEventListener('input', atualizarContador);

        // ---------- Botão "enviando..." ----------
        function estadoEnviando(ligado) {
            enviando = ligado;
            botaoEnviar.classList.toggle('is-loading', ligado);
            botaoEnviar.disabled = ligado;
            if (ligado) {
                botaoEnviar.setAttribute('aria-busy', 'true');
            } else {
                botaoEnviar.removeAttribute('aria-busy');
            }
            textoBotao.textContent = ligado ? 'Enviando…' : 'Enviar mensagem';
        }

        // ---------- Envio ----------
        form.addEventListener('submit', function (evento) {
            evento.preventDefault(); // não recarrega a página (não há servidor para receber)
            if (enviando) return;

            const erroNome = validarCampo(campoNome);
            const erroMensagem = validarCampo(campoMensagem);
            if (erroNome || erroMensagem) {
                // Foco no PRIMEIRO campo com erro: o leitor de tela lê o rótulo e o erro
                focar(erroNome ? campoNome : campoMensagem);
                return;
            }

            const nova = {
                id: criarId(),
                nome: normalizarNome(campoNome.value),
                texto: normalizarTexto(campoMensagem.value),
                data: new Date().toISOString()
            };

            estadoEnviando(true);

            // SIMULAÇÃO: não existe servidor. Esperamos 600 ms só para dar o retorno visual de
            // "enviando..."; a mensagem é salva LOCALMENTE, no localStorage deste navegador.
            window.setTimeout(function () {
                mensagens.unshift(nova);                      // coloca no começo (mais nova primeiro)
                mensagens = mensagens.slice(0, MAX_MENSAGENS); // guarda no máximo 20
                const salvou = salvarMensagens();

                // Mostra no mural, no topo, marcada como nova (.is-new → o motion.css anima)
                const item = criarItemMensagem(nova);
                item.classList.add('is-new');
                listaMensagens.prepend(item);
                while (listaMensagens.children.length > MAX_MENSAGENS) {
                    listaMensagens.lastElementChild.remove();
                }

                // Limpa o formulário
                form.reset();
                [campoNome, campoMensagem].forEach(function (campo) {
                    delete campo.dataset.mexido;
                    mostrarErroCampo(campo, '');
                });
                atualizarContador();

                // Quando um botão fica "disabled", o navegador tira o foco dele.
                // Se isso aconteceu, devolvemos o foco ao botão (quem usa teclado não se perde).
                const focoPerdido = !document.activeElement || document.activeElement === document.body;
                estadoEnviando(false);
                if (focoPerdido) focar(botaoEnviar);

                if (salvou) {
                    mostrarToast('Mensagem publicada no mural!', 'sucesso');
                } else {
                    mostrarToast('Não deu para salvar neste navegador: a mensagem aparece agora, mas some ao recarregar.', 'erro');
                }
            }, 600);
        });

        // Botões "Apagar": um único "escutador" na lista cuida de todos (delegação de eventos),
        // inclusive das mensagens que ainda vão ser criadas.
        listaMensagens.addEventListener('click', function (evento) {
            const botao = evento.target.closest('.mensagem__apagar');
            if (!botao) return;
            const item = botao.closest('.mensagem');
            if (item) apagarMensagem(item.dataset.id);
        });

        // Abriu a página: carrega o que estava salvo
        mensagens = lerMensagens();
        desenharMural();
        atualizarContador();
        window.setInterval(atualizarDatas, 60 * 1000);
    }


    // =================================================================
    // 9. COMPARTILHAR
    // No celular: abre a janela de compartilhar do sistema (navigator.share).
    // Sem isso: copia o link (navigator.clipboard) e, se nem isso der, usa o
    // jeito antigo (selecionar um texto escondido e "copiar").
    // =================================================================
    const botaoCompartilhar = document.querySelector('.compartilhar__btn');

    // O endereço a compartilhar: o da página publicada.
    // Aberto direto do computador (file://), usamos o endereço "oficial" (canonical).
    function enderecoDoSite() {
        const canonico = document.querySelector('link[rel="canonical"]');
        if (location.protocol === 'file:' && canonico) return canonico.href;
        return location.origin + location.pathname;
    }

    function copiarDoJeitoAntigo(texto) {
        const focoAnterior = document.activeElement;
        const caixa = document.createElement('textarea');
        caixa.value = texto;
        caixa.setAttribute('readonly', '');
        caixa.className = 'sr-only'; // fica fora da vista
        document.body.appendChild(caixa);
        caixa.select();
        let copiou = false;
        try {
            copiou = document.execCommand('copy');
        } catch (erro) {
            copiou = false;
        }
        caixa.remove();
        focar(focoAnterior); // select() roubou o foco: devolve
        return copiou;
    }

    function copiarLink(url) {
        function avisarResultado(copiou) {
            if (copiou) {
                mostrarToast('Link copiado', 'sucesso');
            } else {
                mostrarToast('Não deu para copiar. O endereço é: ' + url, 'erro', { duracao: 8000 });
            }
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url)
                .then(function () { avisarResultado(true); })
                .catch(function () { avisarResultado(copiarDoJeitoAntigo(url)); });
        } else {
            avisarResultado(copiarDoJeitoAntigo(url));
        }
    }

    if (botaoCompartilhar) {
        botaoCompartilhar.hidden = false; // com JS ele funciona, então aparece

        botaoCompartilhar.addEventListener('click', function () {
            const url = enderecoDoSite();
            if (navigator.share) {
                navigator.share({
                    title: 'Cenicienta – Karol Sevilla',
                    text: 'Conheça “Cenicienta”, single de Karol Sevilla:',
                    url: url
                }).catch(function (erro) {
                    // AbortError = a pessoa fechou a janela de compartilhar. Não é erro.
                    if (erro && erro.name === 'AbortError') return;
                    copiarLink(url);
                });
            } else {
                copiarLink(url);
            }
        });
    }


    // =================================================================
    // 10. TECLA ESC
    // Fecha o que estiver "por cima": primeiro o menu, depois o toast.
    // =================================================================
    document.addEventListener('keydown', function (evento) {
        if (evento.key !== 'Escape' && evento.key !== 'Esc') return;
        if (menuAberto) {
            fecharMenu(true); // devolve o foco ao botão do menu
            return;
        }
        if (toastAtual) esconderToast();
    });
})();
