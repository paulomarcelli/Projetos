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

signal estado_mudou(estado: String, info: String)
signal mensagem(d: Dictionary)

const PREFIXO := "brkombat-"
const LETRAS := "ABCDEFGHJKLMNPQRSTUVWXYZ"  # sem I e O (confundem com 1 e 0)
const VERSAO := 1

## Ponte na página: carrega a PeerJS e guarda o que chega numa fila que o jogo esvazia.
const JS := """
window.brk = window.brk || (function () {
  const B = {fila: [], eventos: [], peer: null, conn: null, pronto: false};
  const cfg = {config: {iceServers: [{urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']}]}};
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
  B.ligar = (c) => {
    B.conn = c;
    c.on('open', () => B.ev('aberto'));
    c.on('data', (d) => B.fila.push(String(d)));
    c.on('close', () => B.ev('fechou'));
    c.on('error', (e) => B.ev('erro', String(e && e.type || e)));
  };
  B.criar = (id) => {
    B.fechar();
    B.peer = new Peer(id, cfg);
    B.peer.on('open', () => B.ev('registrado'));
    B.peer.on('connection', (c) => { if (B.conn) { c.close(); return; } B.ligar(c); });
    B.peer.on('error', (e) => B.ev('erro', String(e && e.type || e)));
  };
  B.entrar = (dst) => {
    B.fechar();
    B.peer = new Peer(cfg);
    B.peer.on('open', () => B.ligar(B.peer.connect(dst, {reliable: true, serialization: 'raw'})));
    B.peer.on('error', (e) => B.ev('erro', String(e && e.type || e)));
  };
  B.enviar = (s) => { if (B.conn && B.conn.open) B.conn.send(s); };
  B.ler = () => { const r = JSON.stringify({f: B.fila, e: B.eventos}); B.fila = []; B.eventos = []; return r; };
  B.largar_servidor = () => { try { if (B.peer) B.peer.disconnect(); } catch (e) {} };
  B.fechar = () => {
    try { if (B.conn) B.conn.close(); } catch (e) {}
    try { if (B.peer) B.peer.destroy(); } catch (e) {}
    B.conn = null; B.peer = null; B.fila = []; B.eventos = [];
  };
  B.carregar();
  return B;
})();
"""

var estado := "parado"  # parado, criando, aguardando, conectando, conectado, erro, caiu
var sala := ""
var anfitriao := false
var rtt_ms := 120.0
var info := ""

var _pendente := ""  # "criar" ou "entrar", esperando a biblioteca carregar
var _t_estado := 0.0
var _t_ping := 0.0
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
	if mudar_estado and estado != "parado":
		_mudar("parado", "")


func conectado() -> bool:
	return estado == "conectado"


func enviar(d: Dictionary) -> void:
	if _aberto and disponivel():
		JavaScriptBridge.eval("brk.enviar(%s)" % JSON.stringify(JSON.stringify(d)), true)


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
	estado_mudou.emit(e, motivo)
	_publicar()


## Expõe o estado para a página (window.brasiliaOnline): usado pelo teste no navegador.
func _publicar(extra := {}) -> void:
	if not disponivel():
		return
	var d := {"estado": estado, "sala": sala, "anfitriao": anfitriao, "rtt": rtt_ms, "info": info}
	d.merge(extra, true)
	JavaScriptBridge.eval("window.brasiliaOnline = Object.assign(window.brasiliaOnline || {}, %s)" % JSON.stringify(d), true)


func publicar(extra: Dictionary) -> void:
	_publicar(extra)


# ---------------------------------------------------------------- quadro a quadro

func _process(delta: float) -> void:
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
		if _sem_resposta > 6.0 and estado == "conectado":
			_cair()
	# sem conexão direta em 25 s: a rede provavelmente bloqueia P2P
	if estado == "conectando" and _t_estado > 25.0:
		_mudar("erro", "Não deu para conectar. Algumas redes bloqueiam conexão direta: tente outra rede.")
		fechar(false)


func _evento(t: String, i: String) -> void:
	match t:
		"registrado":
			if anfitriao and estado == "criando":
				_mudar("aguardando", "")
		"aberto":
			_aberto = true
			_sem_resposta = 0.0
			if anfitriao:
				_mudar("conectando", "")
			enviar({"k": "ola", "v": VERSAO})
		"fechou":
			if estado == "conectado":
				_cair()
		"erro":
			if _aberto and estado == "conectado":
				_cair()
				return
			match i:
				"unavailable-id":
					criar()  # código já em uso: sorteia outro
				"peer-unavailable":
					_mudar("erro", "Sala %s não encontrada. Confira o código." % sala)
					fechar(false)
				"biblioteca":
					_mudar("erro", "Não deu para carregar o online. Confira a internet.")
				_:
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
			# conexão direta feita: a sala no servidor não precisa mais ficar aberta
			JavaScriptBridge.eval("brk.largar_servidor()", true)
			if estado != "conectado":
				_mudar("conectado", "")
		"ping":
			enviar({"k": "pong", "t": d.get("t", 0)})
		"pong":
			var medido := float(Time.get_ticks_msec() - int(d.get("t", 0)))
			rtt_ms = medido if _pings == 0 else lerpf(rtt_ms, medido, 0.3)
			_pings += 1
			_publicar()
		_:
			mensagem.emit(d)
