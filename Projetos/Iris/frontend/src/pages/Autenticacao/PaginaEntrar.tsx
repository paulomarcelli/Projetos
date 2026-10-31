/**
 * Entrar na conta: a tela inteira em duas colunas (components/ui/sign-in-page.tsx). À esquerda, o formulário; à
 * direita, a imagem de Relações Internacionais (abstrata, gerada por IA, sem dados), sem depoimentos. Por cima, a
 * marca e o "Voltar ao site". O tema segue o do app.
 *
 * Fluxo: o navegador exige e-mail e senha (required); aqui confere o formato do e-mail → chama
 * `autenticacao.entrar` → trata o resultado:
 *   - ok: só então leva à plataforma (nunca antes de o servidor confirmar);
 *   - erro: mostra a mensagem do servidor;
 *   - indisponível (situação atual: a API não tem autenticação): diz que nenhuma senha foi verificada e oferece o
 *     acesso aberto de desenvolvimento, sem fingir login.
 * "Manter conectado" vem do componente; sem sessão no servidor, ainda não tem efeito (o aviso não promete nada).
 * A Iris não tem login com Google: sem onGoogleSignIn, o componente não mostra esse botão.
 */
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Aviso } from "../../components/feedback/Aviso";
import { Marca } from "../../components/ui/Marca";
import { SignInPage } from "../../components/ui/sign-in-page";
import { usePreferencias } from "../../store/preferencias";
import { BASE_PUBLICA } from "../../config/env";
import { ROTAS } from "../../config/rotas";
import { autenticacao, type ResultadoAuth } from "../../services/autenticacao";
import { validarEmail } from "../../utils/validadores";

const IMAGEM = `${BASE_PUBLICA}recursos/imagens/entrar/plenario.webp`;

type Retorno = ResultadoAuth | { tipo: "formato"; mensagem: string } | null;

export function PaginaEntrar() {
  const navegar = useNavigate();
  const { temaEfetivo } = usePreferencias();
  const [retorno, setRetorno] = useState<Retorno>(null);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (carregando) return;
    const form = e.currentTarget;
    const dados = new FormData(form);
    const email = String(dados.get("email") ?? "").trim();
    const senha = String(dados.get("password") ?? "");
    const formato = validarEmail(email);
    if (formato) {
      setRetorno({ tipo: "formato", mensagem: formato });
      form.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }
    setRetorno(null);
    setCarregando(true);
    const r = await autenticacao.entrar({ email, senha });
    setCarregando(false);
    if (r.tipo === "ok") return navegar(ROTAS.inicio);
    setRetorno(r);
  };

  return (
    <div className="relative min-h-svh">
      <SignInPage
        theme={temaEfetivo === "claro" ? "light" : "dark"}
        description="Entre para continuar as suas investigações."
        heroImageSrc={IMAGEM}
        onSignIn={enviar}
        onResetPassword={() => navegar(ROTAS.recuperarSenha)}
        onCreateAccount={() => navegar(ROTAS.criarConta)}
      />

      {/* A marca e a volta ao site, por cima do canto da coluna do formulário. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 sm:px-8">
        <Link to={ROTAS.landing} className="pointer-events-auto rounded-fino" aria-label="Iris, voltar ao site">
          <Marca altura={24} />
        </Link>
        <Link to={ROTAS.landing} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-fino text-legenda text-texto-2 hover:text-texto md:hidden">
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar ao site
        </Link>
      </div>

      {/* O retorno do envio, embaixo da coluna do formulário (o Aviso já é anunciado pelos leitores de tela). */}
      {retorno && (
        <div className="fixed bottom-6 left-0 z-10 flex w-full justify-center px-4 md:w-1/2">
          <div className="relative w-full max-w-[448px] rounded-painel shadow-elevado">
            {/* No celular o aviso cobre o pé do formulário: dá para fechar. */}
            <button type="button" onClick={() => setRetorno(null)} className="absolute top-2 right-2 z-10 rounded-fino p-1 text-texto-3 hover:text-texto" aria-label="Fechar o aviso">
              <X size={16} aria-hidden="true" />
            </button>
            {retorno.tipo === "indisponivel" && (
              <Aviso tom="atencao" titulo="Login ainda não disponível">
                <span className="flex flex-col items-start gap-3">
                  A autenticação ainda não existe no servidor, então nenhuma senha foi verificada. Nesta versão de desenvolvimento, o acesso à plataforma é aberto.
                  <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => navegar(ROTAS.inicio)}>
                    Continuar para a plataforma
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </span>
              </Aviso>
            )}
            {(retorno.tipo === "formato" || retorno.tipo === "erro") && <Aviso tom="erro">{retorno.mensagem}</Aviso>}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaginaEntrar;
