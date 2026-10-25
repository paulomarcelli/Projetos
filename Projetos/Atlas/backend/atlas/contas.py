"""Contas, sessões e turmas do ATLAS SaaS acadêmico.

Segurança:
- Senhas com scrypt (biblioteca padrão), sal aleatório por usuário e comparação em tempo constante.
- Sessão = token aleatório de 256 bits entregue em cookie httpOnly; no banco fica só o SHA-256 do token.
- Códigos de turma sem caracteres ambíguos (sem 0/O, 1/I/L), gerados com `secrets`.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import time
import uuid
from dataclasses import dataclass

from .modelos import Membro, Turma, Usuario, agora
from .persistencia import Banco

_N, _R, _P = 2**14, 8, 1
_ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


class ErroConta(Exception):
    def __init__(self, mensagem: str, status: int = 400):
        super().__init__(mensagem)
        self.mensagem, self.status = mensagem, status


def gerar_hash(senha: str) -> str:
    sal = secrets.token_bytes(16)
    h = hashlib.scrypt(senha.encode(), salt=sal, n=_N, r=_R, p=_P, dklen=32)
    return f"scrypt${_N}${_R}${_P}${sal.hex()}${h.hex()}"


def conferir_senha(senha: str, armazenado: str) -> bool:
    try:
        _, n, r, p, sal, h = armazenado.split("$")
        calc = hashlib.scrypt(senha.encode(), salt=bytes.fromhex(sal), n=int(n), r=int(r), p=int(p), dklen=len(bytes.fromhex(h)))
        return hmac.compare_digest(calc.hex(), h)
    except (ValueError, TypeError):
        return False


# hash fixo para gastar o mesmo tempo quando o e-mail não existe (não revela quais e-mails têm conta)
_HASH_FALSO = gerar_hash(secrets.token_urlsafe(16))


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@dataclass
class Contas:
    banco: Banco
    sessao_dias: int = 14
    admin_emails: tuple[str, ...] = ()

    # ------------------------------------------------------------ usuários
    def _linha_usuario(self, l) -> Usuario:
        return Usuario(id=l["id"], nome=l["nome"], email=l["email"], papel=l["papel"], criado_em=l["criado_em"])

    def criar_usuario(self, nome: str, email: str, senha: str, papel: str) -> Usuario:
        email = email.strip().lower()
        if email in self.admin_emails:
            papel = "admin"
        uid = uuid.uuid4().hex[:16]
        b = self.banco
        with b._trava:
            if b._con.execute("SELECT 1 FROM usuarios WHERE email=?", (email,)).fetchone():
                raise ErroConta("Já existe uma conta com este e-mail.", 409)
            b._con.execute(
                "INSERT INTO usuarios (id, nome, email, senha_hash, papel, criado_em, aceite_termos_em) VALUES (?,?,?,?,?,?,?)",
                (uid, nome.strip(), email, gerar_hash(senha), papel, agora(), agora()),
            )
            b._con.commit()
        return Usuario(id=uid, nome=nome.strip(), email=email, papel=papel, criado_em=agora())  # type: ignore[arg-type]

    def autenticar(self, email: str, senha: str) -> Usuario:
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT * FROM usuarios WHERE email=?", (email.strip().lower(),)).fetchone()
        if not l:
            conferir_senha(senha, _HASH_FALSO)
            raise ErroConta("E-mail ou senha incorretos.", 401)
        if not conferir_senha(senha, l["senha_hash"]):
            raise ErroConta("E-mail ou senha incorretos.", 401)
        return self._linha_usuario(l)

    def obter_usuario(self, uid: str) -> Usuario | None:
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT * FROM usuarios WHERE id=?", (uid,)).fetchone()
        return self._linha_usuario(l) if l else None

    def excluir_usuario(self, uid: str) -> dict:
        """LGPD: apaga a conta, as sessões, as simulações e as turmas que a pessoa criou."""
        b = self.banco
        sims = b.apagar_do_usuario(uid)
        with b._trava:
            turmas = [l["id"] for l in b._con.execute("SELECT id FROM turmas WHERE professor_id=?", (uid,))]
            for t in turmas:
                b._con.execute("DELETE FROM membros WHERE turma_id=?", (t,))
                b._con.execute("UPDATE simulacoes SET turma_id=NULL WHERE turma_id=?", (t,))
            b._con.execute("DELETE FROM turmas WHERE professor_id=?", (uid,))
            b._con.execute("DELETE FROM membros WHERE usuario_id=?", (uid,))
            b._con.execute("DELETE FROM sessoes WHERE usuario_id=?", (uid,))
            b._con.execute("DELETE FROM usuarios WHERE id=?", (uid,))
            b._con.commit()
        return {"simulacoes": sims, "turmas": len(turmas)}

    def exportar(self, uid: str) -> dict:
        """LGPD: portabilidade — tudo o que o ATLAS guarda sobre a pessoa (sem o hash da senha)."""
        u = self.obter_usuario(uid)
        if not u:
            raise ErroConta("Conta não encontrada.", 404)
        sims = []
        for resumo in self.banco.listar(1000, usuario_id=uid):
            r = self.banco.obter(resumo.id)
            if r:
                sims.append(r.model_dump(mode="json"))
        return {"exportado_em": agora(), "usuario": u.model_dump(), "turmas": [t.model_dump() for t in self.turmas_do_usuario(u)], "simulacoes": sims}

    # ------------------------------------------------------------ sessões
    def criar_sessao(self, uid: str) -> str:
        token = secrets.token_urlsafe(32)
        b = self.banco
        with b._trava:
            b._con.execute("DELETE FROM sessoes WHERE expira < ?", (time.time(),))
            b._con.execute("INSERT INTO sessoes (token_hash, usuario_id, expira, criada_em) VALUES (?,?,?,?)",
                           (_hash_token(token), uid, time.time() + self.sessao_dias * 86400, time.time()))
            b._con.commit()
        return token

    def usuario_da_sessao(self, token: str | None) -> Usuario | None:
        if not token or len(token) > 200:
            return None
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT usuario_id, expira FROM sessoes WHERE token_hash=?", (_hash_token(token),)).fetchone()
        if not l or l["expira"] < time.time():
            return None
        return self.obter_usuario(l["usuario_id"])

    def encerrar_sessao(self, token: str | None) -> None:
        if not token:
            return
        b = self.banco
        with b._trava:
            b._con.execute("DELETE FROM sessoes WHERE token_hash=?", (_hash_token(token),))
            b._con.commit()

    # ------------------------------------------------------------ turmas
    def _novo_codigo(self) -> str:
        return "".join(secrets.choice(_ALFABETO_CODIGO) for _ in range(8))

    def _turma(self, l, usuario: Usuario) -> Turma:
        b = self.banco
        with b._trava:
            membros = b._con.execute("SELECT COUNT(*) AS n FROM membros WHERE turma_id=?", (l["id"],)).fetchone()["n"]
            prof = b._con.execute("SELECT nome FROM usuarios WHERE id=?", (l["professor_id"],)).fetchone()
        dono = l["professor_id"] == usuario.id or usuario.papel == "admin"
        return Turma(id=l["id"], nome=l["nome"], codigo=l["codigo"] if dono else None, professor_id=l["professor_id"],
                     professor_nome=prof["nome"] if prof else "—", criada_em=l["criada_em"], membros=membros,
                     cenario_caso_id=l["cenario_caso_id"], cenario_orientacao=l["cenario_orientacao"], sou_professor=dono)

    def criar_turma(self, usuario: Usuario, nome: str) -> Turma:
        if usuario.papel not in ("professor", "admin"):
            raise ErroConta("Só professores podem criar turmas.", 403)
        b = self.banco
        tid = uuid.uuid4().hex[:12]
        with b._trava:
            for _ in range(10):
                codigo = self._novo_codigo()
                if not b._con.execute("SELECT 1 FROM turmas WHERE codigo=?", (codigo,)).fetchone():
                    break
            b._con.execute("INSERT INTO turmas (id, nome, codigo, professor_id, criada_em) VALUES (?,?,?,?,?)", (tid, nome.strip(), codigo, usuario.id, agora()))
            b._con.commit()
            l = b._con.execute("SELECT * FROM turmas WHERE id=?", (tid,)).fetchone()
        return self._turma(l, usuario)

    def obter_turma(self, usuario: Usuario, tid: str) -> Turma:
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT * FROM turmas WHERE id=?", (tid,)).fetchone()
        if not l or not self.pode_ver_turma(usuario, tid, l["professor_id"]):
            raise ErroConta("Turma não encontrada.", 404)  # 404 também quando não é membro: não revela que existe
        return self._turma(l, usuario)

    def pode_ver_turma(self, usuario: Usuario, tid: str, professor_id: str | None = None) -> bool:
        if usuario.papel == "admin":
            return True
        b = self.banco
        with b._trava:
            if professor_id is None:
                l = b._con.execute("SELECT professor_id FROM turmas WHERE id=?", (tid,)).fetchone()
                if not l:
                    return False
                professor_id = l["professor_id"]
            if professor_id == usuario.id:
                return True
            return b._con.execute("SELECT 1 FROM membros WHERE turma_id=? AND usuario_id=?", (tid, usuario.id)).fetchone() is not None

    def eh_professor_da_turma(self, usuario: Usuario, tid: str) -> bool:
        if usuario.papel == "admin":
            return True
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT professor_id FROM turmas WHERE id=?", (tid,)).fetchone()
        return bool(l) and l["professor_id"] == usuario.id

    def turmas_do_usuario(self, usuario: Usuario) -> list[Turma]:
        b = self.banco
        with b._trava:
            linhas = b._con.execute(
                "SELECT DISTINCT t.* FROM turmas t LEFT JOIN membros m ON m.turma_id = t.id "
                "WHERE t.professor_id = ? OR m.usuario_id = ? ORDER BY t.criada_em DESC", (usuario.id, usuario.id)).fetchall()
        return [self._turma(l, usuario) for l in linhas]

    def ids_turmas_lecionadas(self, usuario: Usuario) -> list[str]:
        b = self.banco
        with b._trava:
            return [l["id"] for l in b._con.execute("SELECT id FROM turmas WHERE professor_id=?", (usuario.id,))]

    def entrar_na_turma(self, usuario: Usuario, codigo: str) -> Turma:
        codigo = codigo.strip().upper().replace("-", "").replace(" ", "")
        b = self.banco
        with b._trava:
            l = b._con.execute("SELECT * FROM turmas WHERE codigo=?", (codigo,)).fetchone()
            if not l:
                raise ErroConta("Código de turma inválido.", 404)
            if l["professor_id"] != usuario.id:
                b._con.execute("INSERT OR IGNORE INTO membros (turma_id, usuario_id, entrou_em) VALUES (?,?,?)", (l["id"], usuario.id, agora()))
                b._con.commit()
        return self._turma(l, usuario)

    def membros(self, usuario: Usuario, tid: str) -> list[Membro]:
        if not self.eh_professor_da_turma(usuario, tid):
            raise ErroConta("Só o professor da turma vê a lista de alunos.", 403)
        b = self.banco
        with b._trava:
            linhas = b._con.execute(
                "SELECT u.id, u.nome, u.email, m.entrou_em, (SELECT COUNT(*) FROM simulacoes s WHERE s.usuario_id=u.id AND s.turma_id=?) AS sims "
                "FROM membros m JOIN usuarios u ON u.id = m.usuario_id WHERE m.turma_id=? ORDER BY u.nome", (tid, tid)).fetchall()
        return [Membro(id=l["id"], nome=l["nome"], email=l["email"], entrou_em=l["entrou_em"], simulacoes=l["sims"]) for l in linhas]

    def remover_membro(self, usuario: Usuario, tid: str, membro_id: str) -> None:
        if not self.eh_professor_da_turma(usuario, tid):
            raise ErroConta("Só o professor da turma pode remover alunos.", 403)
        b = self.banco
        with b._trava:
            b._con.execute("DELETE FROM membros WHERE turma_id=? AND usuario_id=?", (tid, membro_id))
            b._con.commit()

    def sair_da_turma(self, usuario: Usuario, tid: str) -> None:
        b = self.banco
        with b._trava:
            b._con.execute("DELETE FROM membros WHERE turma_id=? AND usuario_id=?", (tid, usuario.id))
            b._con.commit()

    def novo_codigo(self, usuario: Usuario, tid: str) -> Turma:
        if not self.eh_professor_da_turma(usuario, tid):
            raise ErroConta("Só o professor da turma pode trocar o código.", 403)
        b = self.banco
        with b._trava:
            b._con.execute("UPDATE turmas SET codigo=? WHERE id=?", (self._novo_codigo(), tid))
            b._con.commit()
        return self.obter_turma(usuario, tid)

    def definir_cenario(self, usuario: Usuario, tid: str, caso_id: str | None, orientacao: str | None) -> Turma:
        if not self.eh_professor_da_turma(usuario, tid):
            raise ErroConta("Só o professor da turma pode propor um cenário.", 403)
        b = self.banco
        with b._trava:
            b._con.execute("UPDATE turmas SET cenario_caso_id=?, cenario_orientacao=? WHERE id=?", (caso_id or None, (orientacao or "").strip() or None, tid))
            b._con.commit()
        return self.obter_turma(usuario, tid)

    def excluir_turma(self, usuario: Usuario, tid: str) -> None:
        if not self.eh_professor_da_turma(usuario, tid):
            raise ErroConta("Só o professor da turma pode excluí-la.", 403)
        b = self.banco
        with b._trava:
            b._con.execute("DELETE FROM membros WHERE turma_id=?", (tid,))
            b._con.execute("UPDATE simulacoes SET turma_id=NULL WHERE turma_id=?", (tid,))
            b._con.execute("DELETE FROM turmas WHERE id=?", (tid,))
            b._con.commit()

    # ------------------------------------------------------------ admin
    def resumo_admin(self) -> dict:
        b = self.banco
        with b._trava:
            por_papel = {l["papel"]: l["n"] for l in b._con.execute("SELECT papel, COUNT(*) AS n FROM usuarios GROUP BY papel")}
            turmas = b._con.execute("SELECT COUNT(*) AS n FROM turmas").fetchone()["n"]
            sims = b._con.execute("SELECT COUNT(*) AS n FROM simulacoes").fetchone()["n"]
        return {"usuarios": por_papel, "turmas": turmas, "simulacoes": sims, "uso_hoje": b.uso_hoje()}
