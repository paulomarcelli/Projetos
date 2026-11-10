class_name Rede
extends Node
## Multiplayer online P2P: os dois navegadores se encontram pelo servidor público do PeerJS
## e depois conversam direto (WebRTC), por um canal de dados confiável.
##
## A parte de rede roda na própria página, com a biblioteca PeerJS (MIT): web/peerjs.min.js,
## copiada ao lado do jogo exportado (com o unpkg de reserva). O Godot conversa com ela pelo
## JavaScriptBridge: manda texto com brk.enviar() e lê o que chegou com brk.ler().
##
## Quem cria a sala recebe um código de 4 letras e vira o anfitrião (lado esquerdo, 1P).
## Quem entra digita o código (ou abre o link ?sala=CODIGO) e fica com o lado direito (2P).
## As mensagens do jogo são dicionários pequenos em JSON; o campo "k" diz o tipo.
##
## Feito para celular, onde a aba vai para segundo plano (mandar o código no WhatsApp):
## - a sala continua registrada no servidor a sessão toda; se o servidor cair (o celular fecha a
##   conexão em segundo plano), a página reconecta sozinha com o MESMO código;
## - quem entra pelo link espera a sala aparecer (o amigo pode estar no WhatsApp);
## - se a conexão direta cair no meio do jogo, os dois ficam "reconectando" e se acham de novo;
##   o que foi enviado nesse meio-tempo fica numa fila e sai quando a conexão volta;
## - sair da tela avisa o outro ("oculto"), que espera mais antes de desistir.

signal estado_mudou(estado: String, info: String)
signal mensagem(d: Dictionary)

const PREFIXO := "brkombat-"
const LETRAS := "ABCDEFGHJKLMNPQRSTUVWXYZ"  # sem I e O (confundem com 1 e 0)
const VERSAO := 3  # 3: reconexão; páginas de versões diferentes não se conectam
const SEM_DADOS := 8.0        # segundos sem nada do outro: passa a "reconectando"
const ESPERA_QUEDA := 45.0    # tempo reconectando antes de desistir
const ESPERA_OCULTO := 180.0  # ... se o outro avisou que saiu da tela
const ESPERA_SALA := 120.0    # quem entra pelo link espera a sala aparecer
const REDISCAR := 4.0         # de quanto em quanto tempo o convidado tenta de novo

## Ponte na página: carrega a PeerJS, guarda o que chega numa fila que o jogo esvazia e cuida
## de reconectar ao servidor sozinha (funciona mesmo com o jogo parado em segundo plano).
const JS := """
window.brk = window.brk || (function () {
  const B = {fila: [], eventos: [], saida: [], peer: null, conn: null, pronto: false, criada: false, timer: null, tentativas: 0};
  // STUN acha o endereço público; o TURN (relay) é o plano B quando os dois aparelhos estão em
  // redes que não deixam ligar direto (4G, Wi-Fi de outra casa): sem ele, o convidado não entra
  const R = 'openrelayproject';
  const cfg = {config: {iceServers: [
    {urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']},
    {urls: 'turn:openrelay.metered.ca:80', username: R, credential: R},
    {urls: 'turn:openrelay.metered.ca:443', username: R, credential: R},
    {urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: R, credential: R},
  ]}};
  const DE_REDE = ['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected'];
  B.ev = (t, i) => B.eventos.push({t: t, i: i || ''});
  B.carregar = () => {
    if (window.Peer) { B.pronto = true; return; }
    const s = document.createElement('script');
    s.src = 'peerjs.min.js';
    s.onload = () => { B.pronto = true; };
    s.onerror = () => {
      const r = document.createElement('script');
      r.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      r.onload = () => { B.pronto = true; };
      r.onerror = () => B.ev('erro', 'biblioteca');
      document.head.appendChild(r);
    };
    document.head.appendChild(s);
  };
  // conexão de dados: só a atual conta (uma reconexão troca a velha pela nova)
  B.ligar = (c) => {
    const velha = B.conn;
    B.conn = c;
    if (velha && velha !== c) { try { velha.close(); } catch (e) {} }
    c.on('open', () => { if (c !== B.conn) return; B.ev('aberto'); B.descarregar(); });
    c.on('data', (d) => { if (c === B.conn) B.fila.push(String(d)); });
    c.on('close', () => { if (c === B.conn) B.ev('fechou'); });
    c.on('error', (e) => { if (c === B.conn) B.ev('fechou', String(e && e.type || e)); });
  };
  B.descarregar = () => {
    while (B.saida.length && B.conn && B.conn.open) {
      try { B.conn.send(B.saida[0]); B.saida.shift(); } catch (e) { return; }
    }
  };
  // servidor de salas: se cair, volta com o mesmo código (a cada 3 s, por até 3 min)
  B.servidor = (p) => {
    p.on('open', () => { if (p !== B.peer) return; B.criada = true; B.tentativas = 0; B.ev('registrado'); });
    p.on('disconnected', () => { if (p === B.peer) B.reconectar(); });
    p.on('error', (e) => {
      if (p !== B.peer) return;
      const t = String(e && e.type || e);
      if (DE_REDE.includes(t) || (t === 'unavailable-id' && B.criada)) { B.ev('sem_servidor', t); B.reconectar(); return; }
      B.ev('erro', t);
    });
  };
  B.reconectar = () => {
    if (B.timer || !B.peer || B.peer.destroyed) return;
    B.timer = setTimeout(() => {
      B.timer = null;
      const p = B.peer;
      if (!p || p.destroyed || !p.disconnected) return;
      B.tentativas += 1;
      if (B.tentativas > 60) { B.ev('erro', 'servidor'); return; }
      try { p.reconnect(); } catch (e) {}
      B.reconectar();
    }, 3000);
  };
  B.criar = (id) => {
    B.fechar();
    B.peer = new Peer(id, cfg);
    B.servidor(B.peer);
    // o mesmo convidado voltando (ou um novo, se o anterior caiu) troca a conexão velha
    B.peer.on('connection', (c) => {
      if (B.conn && B.conn.open && c.peer !== B.conn.peer) { c.close(); return; }
      B.ligar(c);
    });
  };
  B.entrar = (dst) => {
    B.fechar();
    B.dst = dst;
    B.peer = new Peer(cfg);
    B.servidor(B.peer);
    B.peer.on('open', () => B.discar());
  };
  // convidado: (re)liga para o anfitrião
  B.discar = () => {
    const p = B.peer;
    if (!p || p.destroyed || p.disconnected || !p.open || !B.dst) return false;
    if (B.conn && B.conn.open) return true;
    B.ligar(p.connect(B.dst, {reliable: true, serialization: 'raw'}));
    return true;
  };
  // fila: o que for enviado com a conexão caída sai quando ela voltar
  B.enviar = (s, guardar) => {
    if (B.conn && B.conn.open) { try { B.conn.send(s); return; } catch (e) {} }
    if (guardar && B.saida.length < 600) B.saida.push(s);
  };
  B.ler = () => { const r = JSON.stringify({f: B.fila, e: B.eventos}); B.fila = []; B.eventos = []; return r; };
  B.fechar = () => {
    if (B.timer) { clearTimeout(B.timer); B.timer = null; }
    const p = B.peer, c = B.conn;
    B.conn = null; B.peer = null; B.fila = []; B.eventos = []; B.saida = []; B.criada = false; B.tentativas = 0; B.dst = null;
    try { if (c) c.close(); } catch (e) {}
    try { if (p) p.destroy(); } catch (e) {}
  };
  // sair da tela (WhatsApp): avisa o outro; ao voltar, reconecta ao servidor se ele caiu
  document.addEventListener('visibilitychange', () => {
    const oculto = document.visibilityState === 'hidden';
    if (B.conn && B.conn.open) { try { B.conn.send(JSON.stringify({k: oculto ? 'oculto' : 'visivel'})); } catch (e) {} }
    if (!oculto) {
      B.ev('voltou');
      const p = B.peer;
      if (p && !p.destroyed && p.disconnected) { try { p.reconnect(); } catch (e) {} B.reconectar(); }
    }
  });
  B.carregar();
  return B;
})();
"""

var estado := "parado"  # parado, criando, aguardando, conectando, conectado, reconectando, erro, caiu
var sala := ""
var anfitriao := false
var rtt_ms := 120.0
var info := ""
var outro_oculto := false  # o outro jogador saiu da tela (avisou)

var _pendente := ""  # "criar" ou "entrar", esperando a biblioteca carregar
var _t_estado := 0.0
var _t_ping := 0.0
var _t_disca := 0.0
var _pings := 0
var _aberto := false
var _sem_resposta := 0.0


static func disponivel() -> bool:
	return OS.has_feature("web")


static func codigo_aleatorio() -> String:
	var s := ""
	for i in 4:
		s += LETRAS[randi() % LETRAS.length()]
	return s


func _ready() -> void:
	if disponivel():
		JavaScriptBridge.eval(JS, true)


func criar() -> void:
	fechar()
	anfitriao = true
	sala = codigo_aleatorio()
	_pendente = "criar"
	_mudar("criando", "")


func entrar(codigo: String) -> void:
	fechar()
	anfitriao = false
	sala = codigo.to_upper().strip_edges()
	_pendente = "entrar"
	_mudar("conectando", "")


## Fecha tudo (sem avisar o outro: para avisar, mande {"k": "sair"} antes).
## mudar_estado = false mantém o estado atual (erro ou caiu) para a tela mostrar o motivo.
func fechar(mudar_estado := true) -> void:
	if disponivel():
		JavaScriptBridge.eval("window.brk && brk.fechar()", true)
	_pendente = ""
	_aberto = false
	_pings = 0
	outro_oculto = false
	if mudar_estado and estado != "parado":
		_mudar("parado", "")


func conectado() -> bool:
	return estado == "conectado"


## Manda uma mensagem do jogo. Se a conexão estiver caída, ela espera na fila da página.
func enviar(d: Dictionary) -> void:
	if not disponivel() or estado in ["parado", "erro", "caiu", "criando"]:
		return
	var guardar: bool = d.get("k", "") not in ["ping", "pong"]
	if not _aberto and not guardar:
		return
	JavaScriptBridge.eval("brk.enviar(%s, %s)" % [JSON.stringify(JSON.stringify(d)), "true" if guardar else "false"], true)


## Quadros de atraso das entradas para a latência medida (ida = metade do ping).
func atraso_sugerido() -> int:
	return clampi(int(ceil(rtt_ms / 2.0 / 16.67)) + 2, 3, 8)


func link() -> String:
	if not disponivel():
		return ""
	var base = JavaScriptBridge.eval("location.origin + location.pathname")
	return "%s?sala=%s" % [base, sala]


func _mudar(e: String, motivo: String) -> void:
	estado = e
	info = motivo
	_t_estado = 0.0
	_t_disca = 0.0
	estado_mudou.emit(e, motivo)
	_publicar()


## Expõe o estado para a página (window.brasiliaOnline): usado pelos testes no navegador.
func _publicar(extra := {}) -> void:
	if not disponivel():
		return
	var d := {"estado": estado, "sala": sala, "anfitriao": anfitriao, "rtt": rtt_ms, "info": info, "outro_oculto": outro_oculto}
	d.merge(extra, true)
	JavaScriptBridge.eval("window.brasiliaOnline = Object.assign(window.brasiliaOnline || {}, %s)" % JSON.stringify(d), true)


func publicar(extra: Dictionary) -> void:
	_publicar(extra)


# ---------------------------------------------------------------- quadro a quadro

func _process(delta: float) -> void:
	# em segundo plano o jogo para; na volta, a pausa não pode contar como "o outro sumiu"
	delta = minf(delta, 0.25)
	_t_estado += delta
	if not disponivel() or estado == "parado":
		return
	if _pendente != "":
		if JavaScriptBridge.eval("!!(window.brk && brk.pronto)", true):
			if _pendente == "criar":
				JavaScriptBridge.eval("brk.criar('%s')" % (PREFIXO + sala), true)
			else:
				JavaScriptBridge.eval("brk.entrar('%s')" % (PREFIXO + sala), true)
			_pendente = ""
		elif _t_estado > 12.0:
			_mudar("erro", "Não deu para carregar o online. Confira a internet.")
			return
	var r = JSON.parse_string(str(JavaScriptBridge.eval("window.brk ? brk.ler() : '{}'", true)))
	if typeof(r) == TYPE_DICTIONARY:
		for ev in r.get("e", []):
			_evento(String(ev.get("t", "")), String(ev.get("i", "")))
		for txt in r.get("f", []):
			_sem_resposta = 0.0
			var d = JSON.parse_string(String(txt))
			if typeof(d) == TYPE_DICTIONARY:
				_receber(d)
	if _aberto:
		_sem_resposta += delta
		_t_ping += delta
		if _t_ping > 1.0:
			_t_ping = 0.0
			enviar({"k": "ping", "t": Time.get_ticks_msec()})
		if _sem_resposta > SEM_DADOS and estado == "conectado" and not outro_oculto:
			_reconectar("O outro jogador não responde.")
	match estado:
		"reconectando":
			if _t_estado > (ESPERA_OCULTO if outro_oculto else ESPERA_QUEDA):
				_cair()
				return
			_rediscar(delta)
		"conectando":
			if anfitriao:
				# o convidado ligou mas não completou: volta a esperar
				if _t_estado > 25.0:
					_mudar("aguardando", "")
			else:
				if _t_estado > ESPERA_SALA:
					_mudar("erro", "Sala %s não encontrada. Confira o código." % sala)
					fechar(false)
					return
				_rediscar(delta)
		"conectado":
			# o outro sumiu da tela há muito tempo
			if outro_oculto and _sem_resposta > ESPERA_OCULTO:
				_cair()


## Convidado: tenta ligar para o anfitrião de novo de tempos em tempos.
func _rediscar(delta: float) -> void:
	if anfitriao:
		return
	_t_disca += delta
	if _t_disca >= REDISCAR:
		_t_disca = 0.0
		JavaScriptBridge.eval("brk.discar()", true)


func _reconectar(motivo: String) -> void:
	_aberto = false
	_mudar("reconectando", motivo)


func _evento(t: String, i: String) -> void:
	match t:
		"registrado":
			if anfitriao and estado == "criando":
				_mudar("aguardando", "")
		"sem_servidor":
			pass  # a página já está reconectando ao servidor com o mesmo código
		"voltou":
			_sem_resposta = 0.0
		"aberto":
			_aberto = true
			_sem_resposta = 0.0
			if anfitriao and estado == "aguardando":
				_mudar("conectando", "")
			enviar({"k": "ola", "v": VERSAO})
		"fechou":
			_aberto = false
			if estado == "conectado":
				_reconectar("A conexão piscou.")
			elif estado == "conectando" and anfitriao:
				_mudar("aguardando", "")
		"erro":
			match i:
				"unavailable-id":
					if estado == "criando":
						criar()  # código já em uso na criação: sorteia outro
				"peer-unavailable":
					# a sala ainda não está no servidor (o amigo pode estar no WhatsApp): segue tentando
					if estado == "conectando":
						info = "Procurando a sala %s... (o amigo pode estar fora da tela)" % sala
						estado_mudou.emit(estado, info)
				"biblioteca":
					_mudar("erro", "Não deu para carregar o online. Confira a internet.")
				"browser-incompatible":
					_mudar("erro", "Este navegador não tem suporte ao online.")
					fechar(false)
				"servidor":
					if estado in ["criando", "aguardando", "conectando"]:
						_mudar("erro", "O servidor de salas não respondeu. Tente de novo.")
						fechar(false)
				_:
					if estado == "criando":
						_mudar("erro", "O servidor de salas não respondeu (%s). Tente de novo." % i)
						fechar(false)


func _cair() -> void:
	_mudar("caiu", "O outro jogador saiu ou a conexão caiu.")
	fechar(false)


func _receber(d: Dictionary) -> void:
	match d.get("k", ""):
		"ola":
			if int(d.get("v", 0)) != VERSAO:
				_mudar("erro", "Versões diferentes do jogo: recarreguem a página.")
				return
			outro_oculto = false
			if estado == "reconectando":
				_mudar("conectado", "retomou")
			elif estado != "conectado":
				_mudar("conectado", "")
		"oculto":
			outro_oculto = true
			_publicar()
		"visivel":
			outro_oculto = false
			_publicar()
		"ping":
			enviar({"k": "pong", "t": d.get("t", 0)})
		"pong":
			var medido := float(Time.get_ticks_msec() - int(d.get("t", 0)))
			rtt_ms = medido if _pings == 0 else lerpf(rtt_ms, medido, 0.3)
			_pings += 1
			_publicar()
		_:
			mensagem.emit(d)
