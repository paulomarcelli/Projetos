import { ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { CabecalhoDaPagina } from "../components/layout";
import { iniciais } from "../components/sidebar/itens";
import { Botao, CampoTexto, Esqueleto, cx } from "../components/ui";
import { rotas } from "../config/rotas";
import { usePreferencias } from "../contexts/Preferencias";
import { dataLonga, mensagemDoErro, numero, useHistorico } from "../hooks";

export function PaginaPerfil() {
  const { perfil, definir } = usePreferencias();
  const [nome, setNome] = useState(perfil.nome);
  const [funcao, setFuncao] = useState(perfil.funcao);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setNome(perfil.nome);
    setFuncao(perfil.funcao);
  }, [perfil.nome, perfil.funcao]);

  const mudou = nome.trim() !== perfil.nome || funcao.trim() !== perfil.funcao;

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErroNome("Escreva como a F.R.E.Y.A. deve chamar você.");
      return;
    }
    definir({ perfil: { nome: nome.trim(), funcao: funcao.trim() } });
    setSalvo(true);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <CabecalhoDaPagina titulo="Perfil" subtitulo="Como a F.R.E.Y.A. chama você nas saudações e nas análises." />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <form onSubmit={salvar} noValidate className="flex flex-col gap-5 rounded-3xl border border-borda bg-superficie p-5 sm:p-6" aria-labelledby="perfil-form">
          <h2 id="perfil-form" className="sr-only">
            Dados do perfil
          </h2>
          <div className="flex items-center gap-4">
            <span className="fr-avatar size-16! text-xl!" aria-hidden="true">
              {iniciais(nome || perfil.nome)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{nome.trim() || "Sem nome"}</p>
              <p className="truncate text-sm text-texto-suave">{funcao.trim() || "Sem função"}</p>
            </div>
          </div>
          <CampoTexto
            rotulo="Nome"
            required
            value={nome}
            maxLength={60}
            autoComplete="name"
            erro={erroNome ?? undefined}
            dica="Usado na saudação: “Olá, nome!”"
            onChange={(e) => {
              setNome(e.target.value);
              setErroNome(null);
              setSalvo(false);
            }}
          />
          <CampoTexto
            rotulo="Função"
            value={funcao}
            maxLength={80}
            autoComplete="organization-title"
            dica="Aparece no menu, abaixo do nome."
            onChange={(e) => {
              setFuncao(e.target.value);
              setSalvo(false);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Botao type="submit" variante="primario" disabled={!mudou}>
              Salvar perfil
            </Botao>
            <Botao
              onClick={() => {
                setNome(perfil.nome);
                setFuncao(perfil.funcao);
                setErroNome(null);
              }}
              disabled={!mudou}
            >
              Desfazer
            </Botao>
            <p role="status" className="text-sm text-texto-suave">
              {salvo && !mudou ? "Perfil salvo neste navegador." : ""}
            </p>
          </div>
          <p className="flex items-start gap-3 rounded-2xl border border-aviso/30 bg-aviso-tinta px-4 py-3 text-sm">
            <ShieldAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-aviso" />
            <span>Seu perfil fica salvo só neste navegador — a F.R.E.Y.A. ainda não tem contas de usuário. Quem acessar esta API vê e altera as mesmas análises.</span>
          </p>
        </form>

        <Atividade />
      </div>
    </div>
  );
}

function Atividade() {
  const h = useHistorico({ limite: 1000 });
  const itens = h.itens ?? [];
  const numeros = [
    { rotulo: "Análises", valor: itens.length, para: rotas.historico },
    { rotulo: "Concluídas", valor: itens.filter((i) => i.estado === "concluida").length },
    { rotulo: "Guardadas", valor: itens.filter((i) => i.guardada).length, para: rotas.guardados },
    { rotulo: "Cenários gerados", valor: itens.reduce((n, i) => n + i.cenarios, 0) },
  ];
  const mais = itens[itens.length - 1];
  return (
    <section aria-labelledby="atividade" className="rounded-3xl border border-borda bg-superficie p-5 sm:p-6">
      <h2 id="atividade" className="text-xl font-semibold">
        Atividade
      </h2>
      <p className="mt-1 text-sm text-texto-suave">Contada no histórico desta API (todas as pessoas que a usam).</p>
      {h.erro ? (
        <p role="alert" className="mt-4 text-sm text-perigo">
          {mensagemDoErro(h.erro, "a atividade").titulo}
        </p>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {numeros.map((n) => (
            <div key={n.rotulo} className="rounded-2xl bg-superficie-2 px-4 py-3">
              <dt className="text-xs text-texto-fraco">{n.rotulo}</dt>
              <dd className={cx("mt-1 text-2xl font-medium fr-numeros")}>
                {h.carregando ? <Esqueleto largura="2.5rem" altura="1.75rem" /> : n.para ? <Link to={n.para} className="passar:text-escarlate">{numero(n.valor)}</Link> : numero(n.valor)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {mais && <p className="mt-4 text-xs text-texto-fraco">Primeira análise registrada em {dataLonga(mais.criada_em)}.</p>}
    </section>
  );
}
