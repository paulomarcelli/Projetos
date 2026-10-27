import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Aviso } from "../components/Estados";
import { GlifoEpistemico } from "../components/Epistemico";
import { Marca, SimboloIris } from "../components/Marca";
import { MARCA } from "../lib/marca";
import { ROTAS } from "../lib/rotas";

const ANO = new Date().getFullYear();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Tela de entrada. O servidor ainda NÃO tem autenticação: o formulário valida os campos e,
 * em vez de fingir um login, explica isso e oferece o acesso aberto de desenvolvimento.
 */
export function Entrar() {
  const id = useId();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [enviado, setEnviado] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const novos: typeof erros = {};
    if (!EMAIL.test(email.trim())) novos.email = "Digite um e-mail válido, como nome@instituicao.org.";
    if (!senha) novos.senha = "Digite a sua senha.";
    setErros(novos);
    setEnviado(Object.keys(novos).length === 0);
    if (novos.email) document.getElementById(`${id}-email`)?.focus();
    else if (novos.senha) document.getElementById(`${id}-senha`)?.focus();
  };

  return (
    <div className="grid min-h-dvh bg-abismo lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Painel da marca: coordenadas e o conceito, sem dados */}
      <aside className="fundo-cartografico relative hidden overflow-hidden border-r border-linha lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to={ROTAS.landing} aria-label={`${MARCA.nome}: página inicial`} className="w-fit">
          <Marca />
        </Link>
        <div className="pointer-events-none absolute top-16 -right-48 opacity-[0.10]" aria-hidden="true">
          <SimboloIris tamanho={560} />
        </div>
        <div className="relative max-w-md">
          <p className="font-editorial text-titulo leading-snug text-texto">{MARCA.conceito}</p>
          <ul className="mt-6 flex flex-col gap-2 text-legenda text-texto-2">
            <li className="flex items-center gap-2">
              <GlifoEpistemico tipo="evidencia" /> Toda afirmação rastreável até a fonte
            </li>
            <li className="flex items-center gap-2">
              <GlifoEpistemico tipo="cenario" /> Cenários condicionais, nunca previsões
            </li>
            <li className="flex items-center gap-2">
              <GlifoEpistemico tipo="incerteza" /> Incertezas declaradas
            </li>
          </ul>
        </div>
        <p className="relative font-dados text-micro text-texto-3">15°47′S 47°52′W · horizonte {ANO}–{ANO + 25}</p>
      </aside>

      <main
        className="flex flex-col justify-center py-10"
        style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      >
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to={ROTAS.landing} aria-label={`${MARCA.nome}: página inicial`}>
              <Marca />
            </Link>
          </div>
          <Link to={ROTAS.landing} className="mb-6 hidden w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto lg:inline-flex">
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar ao site
          </Link>
          <h1 className="font-editorial text-titulo font-medium text-texto">Entrar no Iris</h1>
          <p className="mt-2 text-corpo text-texto-2">Use o e-mail da sua instituição.</p>

          <form onSubmit={enviar} noValidate className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor={`${id}-email`} className="mb-1.5 block text-legenda text-texto-2">
                E-mail
              </label>
              <input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                inputMode="email"
                className="campo"
                value={email}
                aria-invalid={Boolean(erros.email) || undefined}
                aria-describedby={erros.email ? `${id}-email-erro` : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEnviado(false);
                }}
              />
              {erros.email && (
                <p id={`${id}-email-erro`} role="alert" className="mt-1.5 text-legenda text-negativo">
                  {erros.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-senha`} className="mb-1.5 block text-legenda text-texto-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id={`${id}-senha`}
                  type={verSenha ? "text" : "password"}
                  autoComplete="current-password"
                  className="campo pr-11"
                  value={senha}
                  aria-invalid={Boolean(erros.senha) || undefined}
                  aria-describedby={erros.senha ? `${id}-senha-erro` : undefined}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setEnviado(false);
                  }}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-fino text-texto-3 hover:text-texto"
                  aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={verSenha}
                  onClick={() => setVerSenha((v) => !v)}
                >
                  {verSenha ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {erros.senha && (
                <p id={`${id}-senha-erro`} role="alert" className="mt-1.5 text-legenda text-negativo">
                  {erros.senha}
                </p>
              )}
            </div>
            <button type="submit" className="botao botao-primario w-full">
              Entrar
            </button>
          </form>

          {enviado && (
            <div className="aparecer mt-5">
              <Aviso tom="atencao" titulo="Login ainda não disponível">
                <span className="flex flex-col items-start gap-3">
                  A autenticação ainda não existe no servidor, então nenhuma senha foi verificada.
                  Nesta versão de desenvolvimento, o acesso é aberto.
                  <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => navegar(ROTAS.inicio)}>
                    Continuar para a plataforma
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </span>
              </Aviso>
            </div>
          )}

          <div className="mt-8 border-t border-linha pt-5">
            <Link to={ROTAS.inicio} className="inline-flex items-center gap-1.5 text-legenda text-ciano-texto hover:underline">
              Acessar sem conta (ambiente de desenvolvimento)
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <p className="mt-2 text-micro text-texto-3">Contas, recuperação de senha e permissões chegam com a autenticação.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
